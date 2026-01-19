import {Injectable} from "@nestjs/common";
import * as nodemailer from 'nodemailer';
import {Transporter} from 'nodemailer';
import * as process from "node:process";

@Injectable()
export class EmailService {
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async sendVerificationEmail(to: string, token: string) {
        const url = `${process.env.FRONTEND_BASE_URL}/verify?token=${token}`;

        const html = `
    <html lang="">
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
          color: #333333;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          padding: 30px;
        }
        h1 {
          color: #0070f3;
          font-weight: 700;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 30px;
        }
        .btn {
          display: inline-block;
          padding: 14px 28px;
          color: white !important;
          background-color: #0070f3;
          border-radius: 5px;
          font-weight: 600;
          text-decoration: none;
          font-size: 16px;
          transition: background-color 0.3s ease;
        }
        .btn:hover {
          background-color: #005bb5;
        }
        .footer {
          font-size: 12px;
          color: #999999;
          margin-top: 30px;
          text-align: center;
        }
        a {
          color: #0070f3;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
      <title></title>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to DocuWiki!</h1>
        <p>Hi there,</p>
        <p>Thank you for registering with DocuWiki. To complete your signup and activate your account, please confirm your email address by clicking the button below:</p>
        <p style="text-align:center;">
          <a href="${url}" class="btn" target="_blank" rel="noopener noreferrer">Confirm your email</a>
        </p>
        <p>If you did not create an account with DocuWiki, you can safely ignore this email.</p>
        <p>Cheers,<br/>The DocuWiki Team</p>
        <div class="footer">
          DocuWiki Inc. &bull; 2025<br/>
          If you have any questions, contact us at <a href="mailto:support@docuwiki.com">support@docuwiki.com</a>
        </div>
      </div>
    </body>
    </html>
    `;

        await this.transporter.sendMail({
            to,
            from: '"DocuWiki Official" <no-reply@docuwiki.com>',
            subject: 'Confirm your DocuWiki email address',
            html
        });
    }

    async sendResetPasswordEmail(to: string, token: string) {
        const url = `${process.env.FRONTEND_BASE_URL}/resetPassword?token=${token}`;

        const html = `
    <html lang="">
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
          color: #333333;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          padding: 30px;
        }
        h1 {
          color: #0070f3;
          font-weight: 700;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 30px;
        }
        .btn {
          display: inline-block;
          padding: 14px 28px;
          color: white !important;
          background-color: #0070f3;
          border-radius: 5px;
          font-weight: 600;
          text-decoration: none;
          font-size: 16px;
          transition: background-color 0.3s ease;
        }
        .btn:hover {
          background-color: #005bb5;
        }
        .footer {
          font-size: 12px;
          color: #999999;
          margin-top: 30px;
          text-align: center;
        }
        a {
          color: #0070f3;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
      <title></title>
    </head>
    <body>
      <div class="container">
        <h1>Reset your DocuWiki password</h1>
        <p>Hi there,</p>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <p style="text-align:center;">
          <a href="${url}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
        </p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p>Cheers,<br/>The DocuWiki Team</p>
        <div class="footer">
          DocuWiki Inc. &bull; 2025<br/>
          If you have any questions, contact us at <a href="mailto:support@docuwiki.com">support@docuwiki.com</a>
        </div>
      </div>
    </body>
    </html>
    `;

        await this.transporter.sendMail({
            to,
            from: '"DocuWiki Official" <no-reply@docuwiki.com>',
            subject: 'Reset your DocuWiki password',
            html
        });
    }

}