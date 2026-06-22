import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Load email configuration from environment variables
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS

console.log('=== Email Configuration Debug ===')
console.log('EMAIL_USER:', EMAIL_USER ? EMAIL_USER.substring(0, 5) + '...' : 'NOT SET')
console.log('EMAIL_PASS:', EMAIL_PASS ? EMAIL_PASS.substring(0, 5) + '...' : 'NOT SET')
console.log('====================================')

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
})

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('=== SMTP Connection Error ===')
    console.error('Error:', error)
    console.error('===============================')
  } else {
    console.log('=== SMTP Connection Successful ===')
    console.log('Server is ready to send emails')
    console.log('==================================')
  }
})

/**
 * Send welcome email to newly registered user
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} referralId - User's referral ID
 * @param {string} userId - User's user ID
 */
export const sendWelcomeMail = async (to, name, referralId, userId) => {
  console.log('=== sendWelcomeMail Called ===')
  console.log('Recipient email:', to)
  console.log('Recipient name:', name)
  console.log('Referral ID:', referralId)
  console.log('User ID:', userId)
  console.log('============================')

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('EMAIL_USER or EMAIL_PASS not set in environment variables')
    throw new Error('Email credentials not configured')
  }

  const mailOptions = {
    from: EMAIL_USER,
    to: to,
    subject: 'Welcome to Customer Management System',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to Customer Management System</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f9; padding: 40px 20px;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);">

          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2;">Welcome Aboard!</h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 400;">Your journey with us starts now</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 50px 40px; background-color: #ffffff;">

              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; color: #1a1a2e; font-size: 18px; font-weight: 600; line-height: 1.5;">Hi ${name},</p>
              <p style="margin: 0 0 32px 0; color: #4a5568; font-size: 15px; line-height: 1.7;">Thank you for joining us! We're excited to have you on board. Your account has been successfully created and you're all set to explore our platform.</p>

              <!-- Account Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%); border-radius: 12px; padding: 2px; margin: 0 0 32px 0;">
                <tr>
                  <td style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);">
                    <h2 style="margin: 0 0 24px 0; color: #1a1a2e; font-size: 20px; font-weight: 600; text-align: center;">Your Account Details</h2>

                    <!-- Name -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 16px 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
                          <p style="margin: 0 0 4px 0; color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Full Name</p>
                          <p style="margin: 0; color: #1a1a2e; font-size: 16px; font-weight: 600;">${name}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Email -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 16px 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #764ba2;">
                          <p style="margin: 0 0 4px 0; color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Email Address</p>
                          <p style="margin: 0; color: #1a1a2e; font-size: 16px; font-weight: 600;">${to}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Referral ID Badge -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 16px 20px; background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 8px; border-left: 4px solid #667eea;">
                          <p style="margin: 0 0 8px 0; color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Referral ID</p>
                          <p style="margin: 0; display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 16px; font-weight: 700; border-radius: 6px; letter-spacing: 0.5px;">${referralId}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- User ID Badge -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 16px 20px; background: linear-gradient(135deg, #43e97b15 0%, #38f9d715 100%); border-radius: 8px; border-left: 4px solid #43e97b;">
                          <p style="margin: 0 0 8px 0; color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">User ID</p>
                          <p style="margin: 0; display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: #ffffff; font-size: 16px; font-weight: 700; border-radius: 6px; letter-spacing: 0.5px;">${userId}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_BASE || 'http://localhost:5173'}/login" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);">Login Now</a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0; border-top: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 0; font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Help Text -->
              <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 15px; line-height: 1.7;">Need help getting started? Our support team is here to assist you every step of the way.</p>
              <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.7;">If you have any questions or need assistance, feel free to reach out to us at <a href="mailto:support@example.com" style="color: #667eea; text-decoration: none; font-weight: 600;">support@example.com</a></p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 40px; text-align: center;">
              <p style="margin: 0 0 12px 0; color: #a0aec0; font-size: 14px; line-height: 1.6;">&copy; 2024 Customer Management System. All rights reserved.</p>
              <p style="margin: 0; color: #718096; font-size: 13px; line-height: 1.6;">This is an automated message. Please do not reply to this email.</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `,
  }

  try {
    console.log('=== Attempting to send email ===')
    console.log('From:', mailOptions.from)
    console.log('To:', mailOptions.to)
    console.log('Subject:', mailOptions.subject)
    
    const info = await transporter.sendMail(mailOptions)
    
    console.log('=== Email Sent Successfully ===')
    console.log('Message ID:', info.messageId)
    console.log('Response:', info.response)
    console.log('=============================')
    
    return info
  } catch (error) {
    console.error('=== Email Sending Error ===')
    console.error('Error:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('==========================')
    throw error
  }
}

export default transporter
