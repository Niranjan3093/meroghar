import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error.message);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export const sendEmail = async (options) => {
  const mailOptions = {
    from: `MeroGhar <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', options.to);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    // Don't throw error - allow registration to continue
    // The user can request a new verification code later
    return false;
  }
};
