import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

// ─── Shared email shell ────────────────────────────────────────────────────────
// All emails use the same outer wrapper, header pattern, and footer.
// headerGradient: CSS background value for the top bar
// headerLabel: right-side badge text in the header
// accentBorder: card border colour (rgba string)
// body: the inner rows (plain table rows, no wrapper)

function emailShell(opts: {
  headerGradient: string;
  headerLabel: string;
  accentBorder: string;
  body: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Twinpin</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#161616;border:1px solid ${opts.accentBorder};border-radius:20px;overflow:hidden;max-width:520px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:${opts.headerGradient};padding:18px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><span style="font-size:19px;font-weight:800;color:#fff;letter-spacing:-0.3px;">Twinpin</span></td>
            <td align="right"><span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.82);letter-spacing:0.08em;text-transform:uppercase;">${opts.headerLabel}</span></td>
          </tr></table>
        </td>
      </tr>

      ${opts.body}

      <!-- Footer -->
      <tr>
        <td style="padding:14px 32px;background:#0f0f0f;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:11px;color:#383838;text-align:center;">© Twinpin &nbsp;·&nbsp; Automated message — please do not reply</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Shared sub-components ─────────────────────────────────────────────────────

function infoCard(rows: { label: string; value: string; valueColor?: string }[]): string {
  const inner = rows.map((r, i) => `
    ${i > 0 ? '<tr><td colspan="2" style="padding:0;"><div style="height:1px;background:rgba(255,255,255,0.05);margin:12px 0;"></div></td></tr>' : ''}
    <tr>
      <td style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.1em;white-space:nowrap;padding-right:16px;vertical-align:top;padding-top:2px;">${r.label}</td>
      <td style="font-size:14px;font-weight:600;color:${r.valueColor ?? '#d0d0d0'};text-align:right;">${r.value}</td>
    </tr>`).join('');

  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;border-radius:12px;padding:18px 20px;border:1px solid rgba(255,255,255,0.06);">${inner}</table>`;
}

function ctaButton(text: string, href: string, color = '#ff6b00'): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 28px;background:${color};color:#fff;text-decoration:none;border-radius:50px;font-size:13px;font-weight:700;letter-spacing:0.04em;">${text}</a>`;
}

function heroIcon(char: string, bg: string, border: string, color: string): string {
  return `<div style="width:60px;height:60px;border-radius:50%;background:${bg};border:2px solid ${border};margin:0 auto 18px;line-height:56px;text-align:center;font-size:26px;font-weight:700;color:${color};">${char}</div>`;
}

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.from = this.config.get<string>('RESEND_FROM', 'Twinpin <noreply@twinpin.com>');
  }

  // ─── Booking confirmation ──────────────────────────────────────────────────

  async sendBookingConfirmation(
    to: string,
    name: string,
    eventTitle: string,
    eventDate: string,
    ticketCode: string,
    eventLocation?: string | null,
    coverUrl?: string | null,
    eventId?: string | null,
  ): Promise<void> {
    try {
      const frontendUrl = this.config.get<string>('URL_FRONTEND', 'http://localhost:5173');
      const validateUrl = `${frontendUrl}/validate?code=${encodeURIComponent(ticketCode)}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(validateUrl)}&bgcolor=161616&color=ff6b00&margin=10&qzone=2`;
      const eventUrl = eventId ? `${frontendUrl}/events/${eventId}` : null;

      const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      const infoRows: { label: string; value: string }[] = [
        { label: 'Event', value: eventTitle },
        { label: 'Date', value: formattedDate },
      ];
      if (eventLocation) infoRows.push({ label: 'Location', value: eventLocation });

      const coverImg = coverUrl
        ? `<tr><td style="padding:0;"><img src="${coverUrl}" width="520" alt="${eventTitle}" style="display:block;width:100%;max-height:220px;object-fit:cover;" /></td></tr>`
        : '';

      const body = `
      ${coverImg}

      <!-- Hero -->
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          ${heroIcon('&#10003;', 'rgba(39,174,96,0.12)', 'rgba(39,174,96,0.4)', '#2ecc71')}
          <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#f0f0f0;letter-spacing:-0.3px;">You're going!</p>
          <p style="margin:0;font-size:14px;color:#888;">Hi ${name}, your spot is confirmed.</p>
        </td>
      </tr>

      <!-- Divider -->
      <tr><td style="padding:0 32px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

      <!-- Event details -->
      <tr>
        <td style="padding:24px 32px;">
          ${infoCard(infoRows)}
        </td>
      </tr>

      ${eventUrl ? `<!-- CTA -->
      <tr>
        <td style="padding:0 32px 24px;text-align:center;">
          ${ctaButton('View Event &rarr;', eventUrl)}
        </td>
      </tr>` : ''}

      <!-- Divider -->
      <tr><td style="padding:0 32px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

      <!-- QR ticket -->
      <tr>
        <td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="background:#0f0f0f;border:1px solid rgba(255,107,0,0.18);border-radius:16px;padding:28px 20px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#ff6b00;text-transform:uppercase;letter-spacing:0.1em;">Your Ticket</p>
                <p style="margin:0 0 20px;font-size:12px;color:#555;">Scan at the entrance</p>
                <img src="${qrUrl}" width="180" height="180" alt="QR Code" style="display:block;border-radius:10px;margin:0 auto;" />
                <p style="margin:16px 0 0;font-size:11px;font-family:monospace;color:#666;letter-spacing:0.1em;">${ticketCode.slice(0, 8).toUpperCase()}&hellip;</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Your ticket for ${eventTitle}`,
        html: emailShell({
          headerGradient: 'linear-gradient(135deg,#ff6b00,#ff8c38)',
          headerLabel: 'Booking Confirmed',
          accentBorder: 'rgba(255,107,0,0.22)',
          body,
        }),
      });
    } catch (err) {
      this.logger.error(`Failed to send booking confirmation to ${to}`, err);
    }
  }

  // ─── Check-in confirmation ─────────────────────────────────────────────────

  async sendCheckInConfirmation(
    to: string,
    name: string,
    eventTitle: string,
    usedAt: Date,
  ): Promise<void> {
    try {
      const formattedTime = usedAt.toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      });

      const body = `
      <!-- Hero -->
      <tr>
        <td style="padding:36px 32px 24px;text-align:center;">
          ${heroIcon('&#10003;', 'rgba(39,174,96,0.15)', 'rgba(39,174,96,0.5)', '#2ecc71')}
          <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#f0f0f0;letter-spacing:-0.3px;">You're in!</p>
          <p style="margin:0;font-size:14px;color:#888;">Hi ${name}, your ticket was scanned successfully.</p>
        </td>
      </tr>

      <!-- Divider -->
      <tr><td style="padding:0 32px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

      <!-- Details -->
      <tr>
        <td style="padding:24px 32px 32px;">
          ${infoCard([
            { label: 'Event', value: eventTitle },
            { label: 'Checked in', value: formattedTime, valueColor: '#2ecc71' },
          ])}
          <p style="margin:18px 0 0;font-size:13px;color:#555;text-align:center;line-height:1.6;">Enjoy the event — have a great time!</p>
        </td>
      </tr>`;

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Checked in — ${eventTitle}`,
        html: emailShell({
          headerGradient: 'linear-gradient(135deg,#1a9e5a,#27ae60)',
          headerLabel: 'Checked In',
          accentBorder: 'rgba(39,174,96,0.22)',
          body,
        }),
      });
    } catch (err) {
      this.logger.error(`Failed to send check-in confirmation to ${to}`, err);
    }
  }

  // ─── Cancellation confirmation ─────────────────────────────────────────────

  async sendCancellationConfirmation(
    to: string,
    name: string,
    eventTitle: string,
    eventDate: string,
  ): Promise<void> {
    try {
      const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      const body = `
      <!-- Hero -->
      <tr>
        <td style="padding:36px 32px 24px;text-align:center;">
          ${heroIcon('&times;', 'rgba(180,180,180,0.08)', 'rgba(180,180,180,0.2)', '#888')}
          <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#f0f0f0;letter-spacing:-0.3px;">Booking cancelled</p>
          <p style="margin:0;font-size:14px;color:#888;">Hi ${name}, we've confirmed your cancellation.</p>
        </td>
      </tr>

      <!-- Divider -->
      <tr><td style="padding:0 32px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

      <!-- Details -->
      <tr>
        <td style="padding:24px 32px 28px;">
          ${infoCard([
            { label: 'Event', value: eventTitle },
            { label: 'Was scheduled', value: formattedDate },
          ])}
          <p style="margin:18px 0 0;font-size:13px;color:#555;text-align:center;line-height:1.6;">Changed your mind? Spots may still be available on Twinpin.</p>
        </td>
      </tr>`;

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Booking cancelled — ${eventTitle}`,
        html: emailShell({
          headerGradient: 'linear-gradient(135deg,#1e1e1e,#2a2a2a)',
          headerLabel: 'Booking Cancelled',
          accentBorder: 'rgba(255,255,255,0.08)',
          body,
        }),
      });
    } catch (err) {
      this.logger.error(`Failed to send cancellation confirmation to ${to}`, err);
    }
  }

  // ─── New event email ───────────────────────────────────────────────────────

  async sendNewEventEmail(
    to: string,
    name: string,
    companyName: string,
    eventTitle: string,
    eventDate: string,
    eventId: string,
    eventLocation?: string | null,
    coverUrl?: string | null,
  ): Promise<void> {
    try {
      const frontendUrl = this.config.get<string>('URL_FRONTEND', 'http://localhost:5173');
      const eventUrl = `${frontendUrl}/events/${eventId}`;

      const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      const infoRows: { label: string; value: string }[] = [
        { label: 'Event', value: eventTitle },
        { label: 'Date', value: formattedDate },
      ];
      if (eventLocation) infoRows.push({ label: 'Location', value: eventLocation });

      const coverImg = coverUrl
        ? `<tr><td style="padding:0;"><img src="${coverUrl}" width="520" alt="${eventTitle}" style="display:block;width:100%;max-height:220px;object-fit:cover;" /></td></tr>`
        : '';

      const body = `
      ${coverImg}

      <!-- Hero -->
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          ${heroIcon('&#9733;', 'rgba(255,107,0,0.12)', 'rgba(255,107,0,0.4)', '#ff6b00')}
          <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#f0f0f0;letter-spacing:-0.3px;">New event from ${companyName}</p>
          <p style="margin:0;font-size:14px;color:#888;">Hi ${name}, an organizer you follow just published something new.</p>
        </td>
      </tr>

      <!-- Divider -->
      <tr><td style="padding:0 32px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

      <!-- Event details -->
      <tr>
        <td style="padding:24px 32px;">
          ${infoCard(infoRows)}
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:0 32px 32px;text-align:center;">
          ${ctaButton('View Event &rarr;', eventUrl)}
        </td>
      </tr>`;

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `New event: ${eventTitle}`,
        html: emailShell({
          headerGradient: 'linear-gradient(135deg,#ff6b00,#ff8c38)',
          headerLabel: 'New Event',
          accentBorder: 'rgba(255,107,0,0.22)',
          body,
        }),
      });
    } catch (err) {
      this.logger.error(`Failed to send new event email to ${to}`, err);
    }
  }

  // ─── Notification email ────────────────────────────────────────────────────

  async sendNotificationEmail(
    to: string,
    title: string,
    message: string,
    type?: string,
  ): Promise<void> {
    try {
      const isCancelled = type?.includes('cancel');
      const isUpdate    = type?.includes('update');

      const gradient = isCancelled
        ? 'linear-gradient(135deg,#1e1e1e,#2a2a2a)'
        : isUpdate
          ? 'linear-gradient(135deg,#1a3a5c,#1d5fa8)'
          : 'linear-gradient(135deg,#ff6b00,#ff8c38)';

      const accentBorder = isCancelled
        ? 'rgba(255,255,255,0.08)'
        : isUpdate
          ? 'rgba(52,152,219,0.25)'
          : 'rgba(255,107,0,0.18)';

      const iconChar  = isCancelled ? '&times;' : isUpdate ? '&#9998;' : '&#9679;';
      const iconBg    = isCancelled ? 'rgba(180,180,180,0.08)' : isUpdate ? 'rgba(52,152,219,0.1)' : 'rgba(255,107,0,0.1)';
      const iconBdr   = isCancelled ? 'rgba(180,180,180,0.2)'  : isUpdate ? 'rgba(52,152,219,0.3)'  : 'rgba(255,107,0,0.35)';
      const iconColor = isCancelled ? '#888'  : isUpdate ? '#3498db'  : '#ff6b00';

      const body = `
      <!-- Hero -->
      <tr>
        <td style="padding:36px 32px 24px;text-align:center;">
          ${heroIcon(iconChar, iconBg, iconBdr, iconColor)}
          <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#f0f0f0;letter-spacing:-0.2px;">${title}</p>
        </td>
      </tr>

      <!-- Divider -->
      <tr><td style="padding:0 32px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

      <!-- Message -->
      <tr>
        <td style="padding:24px 32px 32px;">
          <p style="margin:0;font-size:14px;color:#aaa;line-height:1.7;text-align:center;">${message}</p>
        </td>
      </tr>`;

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: title,
        html: emailShell({
          headerGradient: gradient,
          headerLabel: 'Notification',
          accentBorder,
          body,
        }),
      });
    } catch (err) {
      this.logger.error(`Failed to send notification email to ${to}`, err);
    }
  }
}
