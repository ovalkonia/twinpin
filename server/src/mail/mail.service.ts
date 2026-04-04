import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as QRCode from 'qrcode';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.from = this.config.get<string>('RESEND_FROM', 'Twinpin <noreply@twinpin.com>');
  }

  async sendBookingConfirmation(
    to: string,
    name: string,
    eventTitle: string,
    eventDate: string,
    ticketCode: string,
  ): Promise<void> {
    try {
      const qrDataUrl = await QRCode.toDataURL(ticketCode, {
        width: 220,
        margin: 2,
        color: { dark: '#ff6b00', light: '#1a1a1a' },
      });

      const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Your ticket for ${eventTitle}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid rgba(255,107,0,0.2);border-radius:16px;overflow:hidden;max-width:480px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#ff6b00;padding:24px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">Twinpin</p>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Booking Confirmation</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:15px;color:#999;">Hi ${name},</p>
              <p style="margin:0 0 28px;font-size:15px;color:#ccc;">Your ticket has been confirmed. See you there!</p>

              <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#ff6b00;text-transform:uppercase;letter-spacing:0.08em;">Event</p>
              <p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#e0e0e0;">${eventTitle}</p>

              <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#ff6b00;text-transform:uppercase;letter-spacing:0.08em;">Date</p>
              <p style="margin:0 0 28px;font-size:15px;color:#ccc;">${formattedDate}</p>

              <!-- QR -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:#1a1a1a;border:1px solid rgba(255,107,0,0.15);border-radius:12px;padding:24px;">
                    <img src="${qrDataUrl}" width="180" height="180" alt="QR Code" style="display:block;" />
                    <p style="margin:14px 0 0;font-size:12px;font-family:monospace;color:#ff6b00;letter-spacing:0.1em;">${ticketCode}</p>
                    <p style="margin:8px 0 0;font-size:12px;color:#666;">Show this code at the venue entrance</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:#444;text-align:center;">Twinpin · This is an automated message, please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      });
    } catch (err) {
      this.logger.error(`Failed to send booking confirmation to ${to}`, err);
    }
  }
}