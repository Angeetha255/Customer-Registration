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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to Customer Management System!</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for registering with us. Your account has been successfully created.</p>
        <p>Your account details:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${to}</li>
          <li><strong>Referral ID:</strong> ${referralId}</li>
          <li><strong>User ID:</strong> ${userId}</li>
        </ul>
        <p>You can now log in to your account and start using our services.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br/>Customer Management Team</p>
      </div>
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
