import { Resend } from "resend";

let resendClient = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendEmail({ to, subject, html }) {
  const resend = getResend();
  if (!resend || !to) return { sent: false, reason: "email_not_configured" };

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "KashmirConnect <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });
    return { sent: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[email]", error.message);
    return { sent: false, reason: error.message };
  }
}
