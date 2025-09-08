/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import nodemailer from "nodemailer";

import HttpStatus from "http-status";

import AppError from "../errors/AppError";
import { appConfig } from "../config";
import logger from "./logger";

export async function sendEmail(email: string, subject: string, text: string) {
  const appName = "WrenchWave";
  const color = "#FF6600";
  try {
    const transporter = nodemailer.createTransport({
      host: appConfig.email.host,
      port: Number(appConfig.email.port),
      secure: false,
      auth: {
        user: appConfig.email.user,
        pass: appConfig.email.pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Wrenchwave" ${appConfig.email.from}`, // Sender address
      to: email, // Recipient's email
      subject: `${subject}`,
      text: text,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #333;
    }
    .container {
      max-width: 500px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 10px;
      padding: 40px 30px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.12); /* <-- stronger shadow */
      text-align: center;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #111;
    }
    h2 {
    
      margin: 5px 0 20px;
      font-size: 16px;
      font-weight: normal;
       font-weight: 600;
      color: #555;
    }
    .message {
      font-size: 15px;
      margin-bottom: 25px;
      color: #444;
    }
    .code-box {
      display: inline-block;
      padding: 15px 25px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 10px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 25px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08); /* shadow on the code box too */
    }
    .note {
      font-size: 13px;
      color: #666;
      margin-bottom: 20px;
    }
    .footer {
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eee;
      padding-top: 15px;
      margin-top: 25px;
    }
  </style>
</head>
<body>
  <div class="container">
   <h1 style="color:${color};">${appName}</h1>
    <h2>Verification Code</h2>
    <p class="message">Please use the verification code below to complete your request:</p>
    <div class="code-box">${text}</div>
    <p class="note">This code will expire in <b>10 minutes</b>. If you didn't request this code, please ignore this email.</p>
    <div class="footer">
      Need help? Contact our support team<br>
      &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
    </div>
  </div>
</body>
</html>
`,
    });

    return info;
  } catch (error: any) {
    logger.error("Error sending email", error);
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, "Error sending email");
  }
}
