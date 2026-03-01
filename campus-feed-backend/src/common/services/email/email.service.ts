import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService){
        //1.configure the transport mechanisim using gmail
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth : {
                user : this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    //2. create a specific function to send otps
    async sendOtpEmail(toEmail: string, otp: string){
        const mailOptions = {
            from: `"CampusFeed Admin" <${this.configService.get<string>('SMTP_USER')}>`,
            to: toEmail,
            subject: 'Your CampusFeed Verification Code',
            text: `Your otp is :${otp}. It is valid for 10minutes.`,
            html:
            `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>CampusFeed Security</h2>
          <p>You requested a one-time password (OTP) for your account.</p>
          <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes. Do not share it with anyone.</p>
        </div>

            `
        };
        await this.transporter.sendMail(mailOptions);
    }

}
