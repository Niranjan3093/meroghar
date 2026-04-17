import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let transporter;
let emailAvailable = false;

// Check if email credentials are configured
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  const smtpPort = Number(process.env.EMAIL_PORT || 587);

  // Use explicit SMTP settings so production can be tuned through environment variables
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: process.env.EMAIL_SECURE
      ? process.env.EMAIL_SECURE === 'true'
      : smtpPort === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT || 15000),
    greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT || 15000),
    socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT || 20000)
  });
  emailAvailable = true;

  // Verify transporter configuration in the background, but do not block sending on a timeout
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter error:', error.message);
    } else {
      console.log('✓ Email server is ready to send messages');
    }
  });
} else {
  console.warn('⚠ Email credentials not configured. Emails will only be logged to console.');
  console.warn('Please set EMAIL_USER and EMAIL_PASSWORD in your .env file');
}

export const sendEmail = async (options) => {
  const mailOptions = {
    from: `MeroGhar <${process.env.EMAIL_USER || 'noreply@meroghar.com'}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  // Always log email content in development so verification codes etc. are visible
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== EMAIL (DEV LOG) ==========');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    if (options.text) console.log('Text:', options.text);
    console.log('=====================================\n');
  }

  if (!transporter) {
    console.error('❌ Email transporter not configured - cannot send email to:', options.to);
    return false;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Email sent successfully to:', options.to);
    return true;
  } catch (error) {
    console.error('❌ Email send error to', options.to, ':', error.message);
    return false;
  }
};
