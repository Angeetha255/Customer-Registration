import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

/**
 * Send verification email with magic link
 * @param {string} email - Recipient email
 * @param {string} magicLink - Verification magic link
 * @returns {Promise<void>}
 */
export async function sendVerificationEmail(email, magicLink) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"InfoTell" <noreply@infotell.com>',
    to: email,
    subject: 'Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #4e0105; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 20px 0;
          }
          .expiry { color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Verify Your Email</h2>
          <p>Click the button below to verify your email address and continue writing your review.</p>
          <a href="${magicLink}" class="button">Verify Email</a>
          <p class="expiry">This link expires in 30 minutes.</p>
          <p>If you didn't request this verification, you can safely ignore this email.</p>
        </div>
      </body>
      </html>
    `
  }

  await transporter.sendMail(mailOptions)
}
