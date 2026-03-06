import nodemailer from "nodemailer";
import { readFile } from "fs/promises";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAILER_EMAIL,
    pass: process.env.MAILER_PASSWORD,
  },
});

export async function renderTemplate(path: string, variables: Record<string, any> = {}) {
  let html = await readFile(path, "utf8");

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    html = html.replace(regex, value);
  }

  return html;
}

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return await transporter.sendMail({
    from: `"Delight Haven" <${process.env.MAILER_EMAIL}>`,
    to,
    subject,
    html,
  });
}
