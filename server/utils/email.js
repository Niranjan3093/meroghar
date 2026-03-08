import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let transporter;
let emailAvailable = false;

// Check if email credentials are configured
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  // Use Gmail SMTP in both development and production
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter error:', error.message);
      console.error('Please check your EMAIL_USER and EMAIL_PASSWORD in .env file');
    } else {
      emailAvailable = true;
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

  if (!emailAvailable) {
    console.warn('⚠ Email transporter not ready yet - please wait a moment and retry');
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
