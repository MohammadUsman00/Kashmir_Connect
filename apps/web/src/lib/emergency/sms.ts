import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

const twilioClient =
  accountSid && authToken
    ? twilio(accountSid, authToken)
    : null;

export type SOSContact = {
  name: string;
  phone: string;
};

export type SOSMessageInput = {
  userName: string;
  mapsLink: string;
  timestamp: string;
  locationLabel: string;
  emergencyContacts: SOSContact[];
  nearestPolicePhone?: string;
};

function formatMessage(input: SOSMessageInput): string {
  return `EMERGENCY ALERT: ${input.userName} triggered SOS at ${input.locationLabel}. Google Maps: ${input.mapsLink}. Time: ${input.timestamp}`;
}

export async function sendEmergencySMS(input: SOSMessageInput): Promise<{ sent: string[]; failed: string[] }> {
  const body = formatMessage(input);
  const recipients = [...input.emergencyContacts.map((c) => c.phone)];
  if (input.nearestPolicePhone) recipients.push(input.nearestPolicePhone);

  if (!twilioClient || !fromNumber) {
    return { sent: [], failed: recipients };
  }

  const sent: string[] = [];
  const failed: string[] = [];
  for (const to of recipients) {
    try {
      await twilioClient.messages.create({
        from: fromNumber,
        to,
        body
      });
      sent.push(to);
    } catch {
      failed.push(to);
    }
  }
  return { sent, failed };
}
