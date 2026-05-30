import * as React from "react";
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";
import { Job, Worker } from "bullmq";
import { Resend } from "resend";
import { emailDeadLetterQueue, emailQueueEvents, redisConnection } from "../queues";

type EmailJobName =
  | "BADGE_APPROVED"
  | "BADGE_REJECTED"
  | "ORDER_RECEIVED"
  | "ORDER_STATUS_UPDATE"
  | "WELCOME"
  | "PASSWORD_RESET";

type EmailPayload = {
  to: string;
  customerName?: string;
  storefrontName?: string;
  orderId?: string;
  status?: string;
  resetLink?: string;
  reason?: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Kashmir Connect <noreply@kashmirconnect.app>";

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY");
}

const resend = new Resend(resendApiKey);

function baseTemplate(title: string, subtitle: string, body: string): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>{subtitle}</Preview>
      <Body style={{ backgroundColor: "#FAF6EF", color: "#3D1F0D", fontFamily: "Inter, Arial, sans-serif" }}>
        <Container style={{ margin: "0 auto", maxWidth: "580px", padding: "24px 16px" }}>
          <Section style={{ borderRadius: "16px", backgroundColor: "#FFFFFF", padding: "24px", border: "1px solid #E8D7C3" }}>
            <Heading style={{ margin: 0, color: "#3D1F0D" }}>{title}</Heading>
            <Text style={{ marginTop: "14px", color: "#634E40", lineHeight: "1.6" }}>{body}</Text>
            <Text style={{ marginTop: "20px", color: "#A38C78", fontSize: "12px" }}>
              Kashmir Connect · Supporting Kashmir businesses and communities.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function buildMessage(jobName: EmailJobName, payload: EmailPayload): { subject: string; html: string } {
  switch (jobName) {
    case "BADGE_APPROVED":
      return {
        subject: "Your Kashmir Connect badge is approved",
        html: render(
          baseTemplate(
            "Badge approved",
            "Your storefront has been verified.",
            `Hi ${payload.customerName ?? "there"}, your storefront ${payload.storefrontName ?? ""} is now badge approved.`
          )
        )
      };
    case "BADGE_REJECTED":
      return {
        subject: "Badge review update",
        html: render(
          baseTemplate(
            "Badge review update",
            "Your badge request needs changes.",
            `Your badge request was rejected. Reason: ${payload.reason ?? "Please contact support."}`
          )
        )
      };
    case "ORDER_RECEIVED":
      return {
        subject: "New order request received",
        html: render(
          baseTemplate(
            "New order received",
            "A customer has placed an order request.",
            `Order ${payload.orderId ?? ""} was received for ${payload.storefrontName ?? "your storefront"}.`
          )
        )
      };
    case "ORDER_STATUS_UPDATE":
      return {
        subject: "Order status updated",
        html: render(
          baseTemplate(
            "Order status update",
            "Your order status has changed.",
            `Order ${payload.orderId ?? ""} is now marked as ${payload.status ?? "updated"}.`
          )
        )
      };
    case "PASSWORD_RESET":
      return {
        subject: "Reset your Kashmir Connect password",
        html: render(
          baseTemplate(
            "Password reset requested",
            "Use this secure link to reset your password.",
            `Reset your password using this link: ${payload.resetLink ?? ""}`
          )
        )
      };
    case "WELCOME":
    default:
      return {
        subject: "Welcome to Kashmir Connect",
        html: render(
          baseTemplate(
            "Welcome aboard",
            "Your account is ready.",
            `Welcome ${payload.customerName ?? ""}. Start exploring Kashmir Connect and grow your digital presence.`
          )
        )
      };
  }
}

export const emailWorker = new Worker<EmailPayload, unknown, EmailJobName>(
  "email",
  async (job: Job<EmailPayload, unknown, EmailJobName>) => {
    const { subject, html } = buildMessage(job.name, job.data);
    await resend.emails.send({
      from: fromEmail,
      to: job.data.to,
      subject,
      html
    });
  },
  {
    connection: redisConnection,
    concurrency: 8
  }
);

emailWorker.on("failed", async (job, error) => {
  if (!job) return;
  if (job.attemptsMade >= 3) {
    await emailDeadLetterQueue.add("EMAIL_FAILED", {
      originalJob: {
        id: job.id,
        name: job.name,
        data: job.data
      },
      reason: error.message,
      failedAt: new Date().toISOString()
    });
  }
});

void emailQueueEvents.waitUntilReady();
