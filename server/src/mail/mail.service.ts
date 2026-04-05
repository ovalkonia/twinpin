import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'UTC',
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',  // appends "UTC" — e.g. "8:00 PM UTC"
  });
}

// ─── Shell ────────────────────────────────────────────────────────────────────
// Every email uses this exact outer wrapper.

function shell(opts: {
  label: string;   // right-side badge in the header
  body: string;    // assembled <tr> blocks — no outer wrapper needed
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Twinpin</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
      style="background:#161616;border:1px solid rgba(255,107,0,0.22);border-radius:20px;overflow:hidden;max-width:520px;width:100%;">

      <!-- ── Header ──────────────────────────────────────────────────── -->
      <tr>
        <td style="background:linear-gradient(135deg,#ff6b00,#ff8c38);padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.4px;">Twinpin</span></td>
            <td align="right">
              <span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.8);
                letter-spacing:0.1em;text-transform:uppercase;">${opts.label}</span>
            </td>
          </tr></table>
        </td>
      </tr>

      ${opts.body}

      <!-- ── Footer ──────────────────────────────────────────────────── -->
      <tr>
        <td style="padding:16px 32px;background:#0d0d0d;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:11px;color:#333;text-align:center;">
            &copy; Twinpin &nbsp;&middot;&nbsp; Automated message — please do not reply
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Blocks ───────────────────────────────────────────────────────────────────
// Reusable <tr> blocks that compose the body of every email.

/** Full-width cover photo strip */
function cover(url: string, alt: string): string {
  return `<tr>
    <td style="padding:0;line-height:0;font-size:0;">
      <img src="${url}" width="520" alt="${alt}"
        style="display:block;width:100%;max-height:220px;object-fit:cover;" />
    </td>
  </tr>`;
}

/**
 * Centred hero: icon circle → headline → subtitle.
 * icon: unicode entity string, e.g. '&#10003;'
 */
function hero(
  icon: string,
  iconBg: string,
  iconBorder: string,
  iconColor: string,
  headline: string,
  subtitle: string,
): string {
  return `<tr>
    <td style="padding:36px 32px 28px;text-align:center;">
      <div style="width:64px;height:64px;border-radius:50%;background:${iconBg};
        border:2px solid ${iconBorder};margin:0 auto 20px;
        line-height:60px;text-align:center;font-size:28px;font-weight:700;color:${iconColor};">
        ${icon}
      </div>
      <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#f0f0f0;letter-spacing:-0.4px;">
        ${headline}
      </p>
      <p style="margin:0;font-size:14px;color:#888;line-height:1.55;">${subtitle}</p>
    </td>
  </tr>`;
}

/** 1 px horizontal rule */
function divider(): string {
  return `<tr>
    <td style="padding:0 32px;">
      <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
    </td>
  </tr>`;
}

/** Label → value table card */
function infoCard(rows: { label: string; value: string; color?: string }[]): string {
  const cells = rows.map((r, i) => `
    ${i > 0 ? '<tr><td colspan="2"><div style="height:1px;background:rgba(255,255,255,0.05);margin:11px 0;"></div></td></tr>' : ''}
    <tr>
      <td style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;
        letter-spacing:0.1em;white-space:nowrap;padding-right:16px;
        vertical-align:top;padding-top:2px;">${r.label}</td>
      <td style="font-size:14px;font-weight:600;color:${r.color ?? '#d0d0d0'};text-align:right;">${r.value}</td>
    </tr>`).join('');

  return `<tr>
    <td style="padding:24px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#0f0f0f;border-radius:14px;padding:20px 22px;
               border:1px solid rgba(255,255,255,0.06);">
        ${cells}
      </table>
    </td>
  </tr>`;
}

/** Orange (or custom-colour) pill CTA button */
function cta(label: string, href: string, color = '#ff6b00'): string {
  return `<tr>
    <td style="padding:4px 32px 32px;text-align:center;">
      <a href="${href}"
        style="display:inline-block;padding:13px 32px;background:${color};
          color:#fff;text-decoration:none;border-radius:50px;
          font-size:13px;font-weight:700;letter-spacing:0.04em;">
        ${label}
      </a>
    </td>
  </tr>`;
}

/** Branded QR-code ticket block — shows full UUID below the code */
function qrBlock(qrUrl: string, fullCode: string): string {
  return `${divider()}
  <tr>
    <td style="padding:28px 32px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center"
            style="background:#0a0a0a;border:1px solid rgba(255,107,0,0.2);
              border-radius:18px;padding:30px 20px;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#ff6b00;
              text-transform:uppercase;letter-spacing:0.14em;">Your Ticket</p>
            <p style="margin:0 0 22px;font-size:12px;color:#555;">Show this QR code at the entrance</p>
            <img src="${qrUrl}" width="176" height="176" alt="QR Code"
              style="display:block;border-radius:12px;margin:0 auto;" />
            <p style="margin:20px 0 4px;font-size:9px;font-weight:700;color:#444;
              text-transform:uppercase;letter-spacing:0.1em;">Ticket ID</p>
            <p style="margin:0;font-size:11px;font-family:monospace;color:#666;
              letter-spacing:0.06em;word-break:break-all;">${fullCode}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.from = this.config.get<string>('RESEND_FROM', 'Twinpin <noreply@twinpin.com>');
  }

  private get frontendUrl(): string {
    return this.config.get<string>('URL_FRONTEND', 'http://localhost:5173');
  }

  // ─── 1. Booking confirmation ───────────────────────────────────────────────

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
      const eventUrl  = eventId ? `${this.frontendUrl}/events/${eventId}` : null;
      const validateUrl = `${this.frontendUrl}/validate?code=${encodeURIComponent(ticketCode)}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200` +
        `&data=${encodeURIComponent(validateUrl)}&bgcolor=0a0a0a&color=ff6b00&margin=10&qzone=2`;

      const cardRows: { label: string; value: string; color?: string }[] = [
        { label: 'Event',  value: eventTitle },
        { label: 'Date',   value: fmtDate(eventDate) },
        { label: 'Time',   value: fmtTime(eventDate) },
      ];
      if (eventLocation) cardRows.push({ label: 'Location', value: eventLocation });
      const body = `
        ${coverUrl ? cover(coverUrl, eventTitle) : ''}
        ${hero(
          '&#10003;',
          'rgba(39,174,96,0.12)', 'rgba(39,174,96,0.45)', '#2ecc71',
          "You're going!",
          `Hi ${name}, your spot at <strong style="color:#e0e0e0;">${eventTitle}</strong> is confirmed.`,
        )}
        ${divider()}
        ${infoCard(cardRows)}
        ${eventUrl ? cta('View Event &rarr;', eventUrl) : ''}
        ${qrBlock(qrUrl, ticketCode)}
      `;

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Your ticket for ${eventTitle}`,
        html: shell({ label: 'Booking Confirmed', body }),
      });
    } catch (err) {
      this.logger.error(`Failed to send booking confirmation to ${to}`, err);
    }
  }

  // ─── 2. Check-in confirmation ──────────────────────────────────────────────

  async sendCheckInConfirmation(
    to: string,
    name: string,
    eventTitle: string,
    usedAt: Date,
    eventDate?: string | null,
    eventId?: string | null,
    eventLocation?: string | null,
    coverUrl?: string | null,
  ): Promise<void> {
    try {
      const eventUrl = eventId ? `${this.frontendUrl}/events/${eventId}` : null;

      const cardRows: { label: string; value: string; color?: string }[] = [
        { label: 'Event', value: eventTitle },
      ];
      if (eventDate) {
        cardRows.push({ label: 'Date', value: fmtDate(eventDate) });
        cardRows.push({ label: 'Time', value: fmtTime(eventDate) });
      }
      if (eventLocation) cardRows.push({ label: 'Location', value: eventLocation });
      cardRows.push({
        label: 'Checked in',
        value: usedAt.toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
          timeZone: 'UTC', timeZoneName: 'short',
        }),
        color: '#2ecc71',
      });

      const body = `
        ${coverUrl ? cover(coverUrl, eventTitle) : ''}
        ${hero(
          '&#10003;',
          'rgba(39,174,96,0.14)', 'rgba(39,174,96,0.5)', '#2ecc71',
          "You're in!",
          `Hi ${name}, your ticket for <strong style="color:#e0e0e0;">${eventTitle}</strong> was scanned successfully.`,
        )}
        ${divider()}
        ${infoCard(cardRows)}
        <tr>
          <td style="padding:0 32px 8px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
              Enjoy the event — have a great time!
            </p>
          </td>
        </tr>
        ${eventUrl ? cta('View Event &rarr;', eventUrl) : ''}
      `;

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Checked in — ${eventTitle}`,
        html: shell({ label: 'Checked In', body }),
      });
    } catch (err) {
      this.logger.error(`Failed to send check-in confirmation to ${to}`, err);
    }
  }

  // ─── 3. Booking cancellation ───────────────────────────────────────────────

  async sendCancellationConfirmation(
    to: string,
    name: string,
    eventTitle: string,
    eventDate: string,
    eventLocation?: string | null,
    coverUrl?: string | null,
    eventId?: string | null,
  ): Promise<void> {
    try {
      const eventsUrl = `${this.frontendUrl}/events`;

      const cardRows: { label: string; value: string }[] = [
        { label: 'Event',         value: eventTitle },
        { label: 'Was scheduled', value: fmtDate(eventDate) },
        { label: 'Time',          value: fmtTime(eventDate) },
      ];
      if (eventLocation) cardRows.push({ label: 'Location', value: eventLocation });

      const body = `
        ${coverUrl ? cover(coverUrl, eventTitle) : ''}
        ${hero(
          '&times;',
          'rgba(180,180,180,0.07)', 'rgba(180,180,180,0.18)', '#777',
          'Booking cancelled',
          `Hi ${name}, your booking for <strong style="color:#e0e0e0;">${eventTitle}</strong> has been cancelled.`,
        )}
        ${divider()}
        ${infoCard(cardRows)}
        <tr>
          <td style="padding:0 32px 8px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
              Changed your mind? Spots may still be available on Twinpin.
            </p>
          </td>
        </tr>
        ${cta('Explore Events &rarr;', eventsUrl, '#555')}
      `;

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Booking cancelled — ${eventTitle}`,
        html: shell({ label: 'Booking Cancelled', body }),
      });
    } catch (err) {
      this.logger.error(`Failed to send cancellation confirmation to ${to}`, err);
    }
  }

  // ─── 4. New event (follower notification) ─────────────────────────────────

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
      const eventUrl = `${this.frontendUrl}/events/${eventId}`;

      const cardRows: { label: string; value: string }[] = [
        { label: 'Event',    value: eventTitle },
        { label: 'Date',     value: fmtDate(eventDate) },
        { label: 'Time',     value: fmtTime(eventDate) },
      ];
      if (eventLocation) cardRows.push({ label: 'Location', value: eventLocation });

      const body = `
        ${coverUrl ? cover(coverUrl, eventTitle) : ''}
        ${hero(
          '&#9733;',
          'rgba(124,58,237,0.12)', 'rgba(124,58,237,0.4)', '#7c3aed',
          `New event from ${companyName}`,
          `Hi ${name}, an organizer you follow just published <strong style="color:#e0e0e0;">${eventTitle}</strong>.`,
        )}
        ${divider()}
        ${infoCard(cardRows)}
        ${cta('Get Your Ticket &rarr;', eventUrl)}
      `;

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `New event: ${eventTitle}`,
        html: shell({ label: 'New Event', body }),
      });
    } catch (err) {
      this.logger.error(`Failed to send new event email to ${to}`, err);
    }
  }

  // ─── 5. New visitor alert (organizer) ────────────────────────────────────

  async sendNewVisitorEmail(
    to: string,
    organizerName: string,
    visitorName: string,
    tierName: string,
    eventTitle: string,
    eventDate: string,
    eventId: string,
    eventLocation?: string | null,
    coverUrl?: string | null,
  ): Promise<void> {
    try {
      const eventUrl = `${this.frontendUrl}/events/${eventId}`;

      const cardRows: { label: string; value: string; color?: string }[] = [
        { label: 'Event',    value: eventTitle },
        { label: 'Date',     value: fmtDate(eventDate) },
        { label: 'Time',     value: fmtTime(eventDate) },
      ];
      if (eventLocation) cardRows.push({ label: 'Location', value: eventLocation });
      cardRows.push({ label: 'Ticket tier', value: tierName });
      cardRows.push({ label: 'Attendee',    value: visitorName, color: '#a78bfa' });

      const body = `
        ${coverUrl ? cover(coverUrl, eventTitle) : ''}
        ${hero(
          '&#9733;',
          'rgba(167,139,250,0.12)', 'rgba(167,139,250,0.4)', '#a78bfa',
          'New attendee!',
          `Hi ${organizerName}, <strong style="color:#e0e0e0;">${visitorName}</strong> just registered for your event.`,
        )}
        ${divider()}
        ${infoCard(cardRows)}
        ${cta('Manage Event &rarr;', eventUrl)}
      `;

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `New attendee for ${eventTitle}`,
        html: shell({ label: 'New Attendee', body }),
      });
    } catch (err) {
      this.logger.error(`Failed to send new visitor email to ${to}`, err);
    }
  }

  // ─── 6. Generic notification ──────────────────────────────────────────────

  async sendNotificationEmail(
    to: string,
    title: string,
    message: string,
    type?: string,
  ): Promise<void> {
    try {
      const isCancelled = type?.includes('cancel');
      const isUpdate    = type?.includes('update');

      const iconChar  = isCancelled ? '&times;'  : isUpdate ? '&#9998;'  : '&#9733;';
      const iconBg    = isCancelled ? 'rgba(180,180,180,0.07)' : isUpdate ? 'rgba(52,152,219,0.1)'  : 'rgba(59,130,246,0.1)';
      const iconBdr   = isCancelled ? 'rgba(180,180,180,0.18)' : isUpdate ? 'rgba(52,152,219,0.3)'  : 'rgba(59,130,246,0.35)';
      const iconColor = isCancelled ? '#777'     : isUpdate ? '#3498db' : '#3b82f6';

      const body = `
        ${hero(iconChar, iconBg, iconBdr, iconColor, title, '')}
        ${divider()}
        <tr>
          <td style="padding:24px 32px 36px;text-align:center;">
            <p style="margin:0;font-size:14px;color:#aaa;line-height:1.75;">${message}</p>
          </td>
        </tr>
      `;

      await this.resend.emails.send({
        from: this.from,
        to,
        subject: title,
        html: shell({ label: 'Notification', body }),
      });
    } catch (err) {
      this.logger.error(`Failed to send notification email to ${to}`, err);
    }
  }
}
