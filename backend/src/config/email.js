import nodemailer from 'nodemailer';
import winston from 'winston';
import mongoose from 'mongoose';

// Helper to get SMTP settings from DB (if present) or environment variables
const getTransporter = async () => {
  let smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
      pass: process.env.SMTP_PASS || 'ethereal.pass'
    }
  };

  try {
    // Attempt to read from a 'Settings' collection in Mongoose
    const db = mongoose.connection.db;
    if (db) {
      const settingsCollection = db.collection('settings');
      const emailSettings = await settingsCollection.findOne({ key: 'smtp_settings' });
      if (emailSettings && emailSettings.value) {
        smtpConfig = {
          host: emailSettings.value.host,
          port: parseInt(emailSettings.value.port),
          secure: emailSettings.value.secure,
          auth: {
            user: emailSettings.value.user,
            pass: emailSettings.value.pass
          }
        };
      }
    }
  } catch (err) {
    winston.warn(`Failed to fetch dynamic SMTP settings from DB: ${err.message}. Using env fallbacks.`);
  }

  return nodemailer.createTransport(smtpConfig);
};

export const sendMail = async ({ to, subject, html, text }) => {
  try {
    const transporter = await getTransporter();
    
    // In development mode with Ethereal fallback, log details
    if (transporter.options.host === 'smtp.ethereal.email') {
      winston.info(`[Email Sandbox] To: ${to} | Subject: ${subject}`);
      winston.info(`[Email Sandbox] Body: ${text || html}`);
      return { messageId: 'sandbox-mock-id' };
    }

    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'TravelSphere'}" <${transporter.options.auth.user}>`,
      to,
      subject,
      text,
      html
    });

    winston.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    winston.error(`Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
};
