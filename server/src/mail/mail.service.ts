import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
        host: this.configService.get('MAIL_HOST'),
        port: this.configService.get('MAIL_PORT'),
        secure: false,
        auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
        },
    });
    }

    async sendMail(to: string, subject: string, html: string) {
    const mailOptions = {
        from: this.configService.get('MAIL_FROM'),
        to,
        subject,
        html,
    };

    return await this.transporter.sendMail(mailOptions);
    }

    async generateTicketEmail(ticketData: any) {
        return `
            <h1>🎫 Your ticket for ${ticketData.eventTitle}</h1>
            <p>Hello ${ticketData.userName},</p>
            <p>Your ticket number: <strong>${ticketData.ticketNumber}</strong></p>
            <p>Event: ${ticketData.eventTitle}</p>
            <p>Date: ${ticketData.eventDate}</p>
            <p>Location: ${ticketData.eventLocation}</p>
            <p>Show this email at the entrance.</p>
        `;
    }

    async sendTicketEmail(to: string, ticketData: any) {
        const html = await this.generateTicketEmail(ticketData);
        const subject = `Your ticket for ${ticketData.eventTitle}`;
        
        return await this.sendMail(to, subject, html);
    }

    async sendReminderEmail(to: string, data: any) {
        const html = `
            <h1>Reminder: ${data.eventTitle} starts tomorrow!</h1>
            <p>Hello ${data.userName},</p>
            <p>This is a reminder that the event <strong>${data.eventTitle}</strong> starts tomorrow.</p>
            <p><strong>Date:</strong> ${data.eventDate}</p>
            <p><strong>Location:</strong> ${data.eventLocation}</p>
            <p>We look forward to seeing you there!</p>
        `;
    
        return await this.sendMail(to, `Reminder: ${data.eventTitle} tomorrow`, html);
    }

}