"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const nodemailer_1 = __importDefault(require("nodemailer"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const config_1 = require("../config");
const logger_1 = __importDefault(require("./logger"));
function sendEmail(email, subject, text) {
    return __awaiter(this, void 0, void 0, function* () {
        const appName = "WrenchWave";
        const color = "#FF6600";
        try {
            const transporter = nodemailer_1.default.createTransport({
                host: config_1.appConfig.email.host,
                port: Number(config_1.appConfig.email.port),
                secure: false,
                auth: {
                    user: config_1.appConfig.email.user,
                    pass: config_1.appConfig.email.pass,
                },
            });
            const info = yield transporter.sendMail({
                from: `"Wrenchwave" ${config_1.appConfig.email.from}`, // Sender address
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
        }
        catch (error) {
            logger_1.default.error("Error sending email", error);
            throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Error sending email");
        }
    });
}
