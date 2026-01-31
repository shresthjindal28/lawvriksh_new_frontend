/**
 * Gmail OAuth Callback Route
 * Handles the OAuth redirect from Google and exchanges the code for tokens
 */

import { NextRequest, NextResponse } from 'next/server';

const GMAIL_CLIENT_ID = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Handle error from Google
  if (error) {
    console.error('Gmail OAuth error:', error);
    return new NextResponse(generateCallbackHtml(false, null, error), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Validate code
  if (!code) {
    return new NextResponse(generateCallbackHtml(false, null, 'No authorization code received'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    // Exchange code for tokens
    const redirectUri = `${request.nextUrl.origin}/api/gmail/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GMAIL_CLIENT_ID || '',
        client_secret: GMAIL_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return new NextResponse(
        generateCallbackHtml(
          false,
          null,
          errorData.error_description || 'Failed to exchange code for tokens'
        ),
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    const tokenData = await tokenResponse.json();

    const tokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    };

    // Return HTML that sends tokens to parent window
    return new NextResponse(generateCallbackHtml(true, tokens, null, state), {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err) {
    console.error('Gmail OAuth callback error:', err);
    return new NextResponse(generateCallbackHtml(false, null, 'An unexpected error occurred'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

interface Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

function generateCallbackHtml(
  success: boolean,
  tokens: Tokens | null,
  error: string | null,
  state?: string | null
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Gmail Authorization</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .success { color: #22c55e; }
    .error { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    ${
      success
        ? '<h2 class="success">✓ Gmail Connected Successfully!</h2><p>This window will close automatically...</p>'
        : `<h2 class="error">✗ Authorization Failed</h2><p>${error || 'Unknown error'}</p>`
    }
  </div>
  <script>
    (function() {
      const success = ${success};
      const tokens = ${tokens ? JSON.stringify(tokens) : 'null'};
      const error = ${error ? JSON.stringify(error) : 'null'};
      
      if (window.opener) {
        window.opener.postMessage({
          type: success ? 'GMAIL_AUTH_SUCCESS' : 'GMAIL_AUTH_ERROR',
          tokens: tokens,
          error: error
        }, window.location.origin);
        
        setTimeout(() => window.close(), 1500);
      }
    })();
  </script>
</body>
</html>
  `;
}
