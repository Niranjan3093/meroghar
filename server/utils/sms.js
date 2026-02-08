import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

let client = null;

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
} = process.env;

if (
  TWILIO_ACCOUNT_SID &&
  TWILIO_AUTH_TOKEN &&
  !TWILIO_ACCOUNT_SID.startsWith("your_")
) {
  client = twilio(
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN
  );
}

export const sendSMS = async (to, message) => {
  if (!client) {
    console.log("📵 SMS disabled (Twilio not configured)");
    return false;
  }

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log('SMS sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('SMS send error:', error.message);
    return false;
  }
};
