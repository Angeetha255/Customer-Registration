# SMTP Configuration for Email Verification

Nodemailer is already installed in your project. You need to configure SMTP settings to send verification emails.

## Required Environment Variables

Add these to your `.env` file in the Customer-Registration directory:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="InfoTell" <noreply@infotell.com>
```

## Gmail Setup (Recommended for Testing)

1. Go to Google Account settings: https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Create a new app password with name "InfoTell"
5. Copy the generated password (16 characters)
6. Use this password as `SMTP_PASS`

## Alternative Email Services

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM="InfoTell" <noreply@infotell.com>
```

### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-ses-smtp-username
SMTP_PASS=your-aws-ses-smtp-password
EMAIL_FROM="InfoTell" <noreply@infotell.com>
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-api-key
EMAIL_FROM="InfoTell" <noreply@infotell.com>
```

## Steps to Complete Setup

1. Create `.env` file in `Customer-Registration` directory
2. Add SMTP configuration variables
3. Restart the backend server:
   ```bash
   cd Customer-Registration
   npm run server
   ```
4. The server will automatically create the `email_verification_tokens` table
5. Test the email verification flow from the frontend

## Testing

After configuration, test by:
1. Go to your React app
2. Navigate to a product or company page
3. Click "Write a Review"
4. Enter your email
5. Click "Send Verification Link"
6. Check your email inbox

## Troubleshooting

**Email not sending:**
- Check SMTP credentials are correct
- Verify network connectivity
- Check firewall settings
- Review server logs for errors

**Gmail authentication failed:**
- Ensure you're using an App Password, not your regular password
- Verify 2FA is enabled
- Check that Less Secure Apps is not needed (use App Password instead)

**Port blocked:**
- Try port 465 with `secure: true` in services/emailService.js
- Check firewall/router settings
- Contact your ISP if needed

**Database table not created:**
- Ensure server is running
- Check Sequelize connection in models/sequelize.js
- Verify MySQL is running
