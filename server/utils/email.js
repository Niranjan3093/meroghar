import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let transporter;
let emailAvailable = false;

if (process.env.NODE_ENV === 'production') {
  // Production: use Gmail SMTP
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter error:', error.message);
    } else {
      emailAvailable = true;
      console.log('Email server is ready to send messages');
    }
  });
} else {
  // Development: use Ethereal (free fake SMTP — no network blocks)
  nodemailer.createTestAccount().then((testAccount) => {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    emailAvailable = true;
    console.log('Dev email ready — emails will be logged to console with preview URLs');
  }).catch((err) => {
    console.error('Could not create Ethereal account:', err.message);
    console.log('Emails will be logged to console only');
  });
}

export const sendEmail = async (options) => {
  const mailOptions = {
    from: `MeroGhar <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  // Always log email content in development so verification codes etc. are visible
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== EMAIL ==========');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    if (options.text) console.log('Text:', options.text);
    if (options.html) console.log('HTML:', options.html);
    console.log('===========================\n');
  }

  if (!transporter || !emailAvailable) {
    console.log('Email transporter not available — email logged above');
    return true; // Return true so app flow continues
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', options.to);

    // In dev, show Ethereal preview URL
    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log('Preview URL:', previewUrl);
    }

    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};
