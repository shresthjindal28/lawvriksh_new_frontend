/**
 * Gmail Send Email API Route
 * Sends emails with attachments using Gmail API
 * This route is used when we need server-side email sending
 */

import { NextRequest, NextResponse } from 'next/server';

interface EmailAttachment {
  filename: string;
  mimeType: string;
  data: string; // Base64 encoded
}

interface SendEmailRequest {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}

function createMimeMessage(
  to: string,
  subject: string,
  body: string,
  attachments?: EmailAttachment[]
): string {
  const boundary = `boundary_${Date.now()}`;
  const nl = '\r\n';

  let message = '';
  message += `To: ${to}${nl}`;
  message += `Subject: ${subject}${nl}`;
  message += `MIME-Version: 1.0${nl}`;
  message += `Content-Type: multipart/mixed; boundary="${boundary}"${nl}${nl}`;

  // Body part
  message += `--${boundary}${nl}`;
  message += `Content-Type: text/plain; charset="UTF-8"${nl}${nl}`;
  message += `${body}${nl}${nl}`;

  // Attachments
  if (attachments) {
    for (const attachment of attachments) {
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

function toBase64Url(str: string): string {
  const base64 = Buffer.from(str, 'utf-8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();
    const { accessToken, to, subject, body: emailBody, attachments } = body;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access token is required' },
        { status: 401 }
      );
    }

    if (!to || !subject) {
      return NextResponse.json(
        { success: false, error: 'Recipient and subject are required' },
        { status: 400 }
      );
    }

    const mimeMessage = createMimeMessage(to, subject, emailBody, attachments);
    const encodedMessage = toBase64Url(mimeMessage);

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

      return NextResponse.json(
        {
          success: false,
          error: errorData.error?.message || 'Failed to send email',
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      messageId: data.id,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      },
      { status: 500 }
    );
  }
}
