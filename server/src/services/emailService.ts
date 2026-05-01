import nodemailer from "nodemailer";
import { getRequiredEnv } from "../helpers/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port: Number(getRequiredEnv("SMTP_PORT")),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });

  return transporter;
}

function getFromAddress() {
  const fromName = getRequiredEnv("SMTP_FROM_NAME");
  const fromEmail = getRequiredEnv("SMTP_FROM_EMAIL");

  return `${fromName} <${fromEmail}>`;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
  });
}
