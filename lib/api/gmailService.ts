/**
 * Gmail API Service for sending emails with attachments
 * Uses OAuth 2.0 for authentication
 */

const GMAIL_CLIENT_ID = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID;
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
].join(' ');

// Storage keys for Gmail tokens
const GMAIL_TOKEN_KEY = 'gmail_access_token';
const GMAIL_REFRESH_TOKEN_KEY = 'gmail_refresh_token';
const GMAIL_TOKEN_EXPIRY_KEY = 'gmail_token_expiry';

export interface GmailTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  data: string; // Base64 encoded
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}

class GmailService {
  private static instance: GmailService;

  private constructor() {}

  static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService();
    }
    return GmailService.instance;
  }

  /**
   * Check if user is authenticated with Gmail
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem(GMAIL_TOKEN_KEY);
    const expiry = localStorage.getItem(GMAIL_TOKEN_EXPIRY_KEY);

    if (!token || !expiry) return false;

    // Check if token is expired (with 5 min buffer)
    return Date.now() < parseInt(expiry) - 5 * 60 * 1000;
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(GMAIL_TOKEN_KEY);
  }

  /**
   * Store tokens after OAuth callback
   */
  storeTokens(tokens: GmailTokens): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(GMAIL_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(GMAIL_TOKEN_EXPIRY_KEY, tokens.expiresAt.toString());
    if (tokens.refreshToken) {
      localStorage.setItem(GMAIL_REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  }

  /**
   * Clear stored tokens (logout)
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(GMAIL_TOKEN_KEY);
    localStorage.removeItem(GMAIL_REFRESH_TOKEN_KEY);
    localStorage.removeItem(GMAIL_TOKEN_EXPIRY_KEY);
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: GMAIL_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GMAIL_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Initiate OAuth flow - opens popup for Gmail authorization
   */
  async initiateAuth(): Promise<boolean> {
    return new Promise((resolve) => {
      const redirectUri = `${window.location.origin}/api/gmail/callback`;
      const state = Math.random().toString(36).substring(7);

      // Store state for verification
      sessionStorage.setItem('gmail_oauth_state', state);

      const authUrl = this.getAuthUrl(redirectUri, state);
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for message from popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GMAIL_AUTH_SUCCESS') {
          this.storeTokens(event.data.tokens);
          window.removeEventListener('message', handleMessage);
          resolve(true);
        } else if (event.data.type === 'GMAIL_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          resolve(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed without completing auth
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          resolve(false);
        }
      }, 1000);
    });
  }

  /**
   * Create MIME message with attachments
   */
  private createMimeMessage(params: SendEmailParams): string {
    const boundary = `boundary_${Date.now()}`;
    const nl = '\r\n';

    let message = '';
    message += `To: ${params.to}${nl}`;
    message += `Subject: ${params.subject}${nl}`;
    message += `MIME-Version: 1.0${nl}`;
    message += `Content-Type: multipart/mixed; boundary="${boundary}"${nl}${nl}`;

    // Body part
    message += `--${boundary}${nl}`;
    message += `Content-Type: text/plain; charset="UTF-8"${nl}${nl}`;
    message += `${params.body}${nl}${nl}`;

    // Attachments
    if (params.attachments) {
      for (const attachment of params.attachments) {
        message += `--${boundary}${nl}`;
        message += `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"${nl}`;
        message += `Content-Disposition: attachment; filename="${attachment.filename}"${nl}`;
        message += `Content-Transfer-Encoding: base64${nl}${nl}`;
        message += `${attachment.data}${nl}${nl}`;
      }
    }

    message += `--${boundary}--`;

    return message;
  }

  /**
   * Convert string to base64url encoding (required by Gmail API)
   */
  private toBase64Url(str: string): string {
    // Convert to base64
    const base64 = btoa(unescape(encodeURIComponent(str)));
    // Convert to base64url
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Send email with attachments using Gmail API
   */
  async sendEmail(
    params: SendEmailParams
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      return { success: false, error: 'Not authenticated with Gmail' };
    }

    try {
      const mimeMessage = this.createMimeMessage(params);
      const encodedMessage = this.toBase64Url(mimeMessage);

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gmail API error:', errorData);

        // If token expired, clear it
        if (response.status === 401) {
          this.clearTokens();
          return { success: false, error: 'Gmail session expired. Please re-authenticate.' };
        }

        return { success: false, error: errorData.error?.message || 'Failed to send email' };
      }

      const data = await response.json();
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Convert Blob to base64 string
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Open Gmail compose with pre-filled draft (fallback method)
   */
  openGmailCompose(subject: string, body: string): void {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  }
}

export const gmailService = GmailService.getInstance();
