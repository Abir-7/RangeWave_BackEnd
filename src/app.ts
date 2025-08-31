import express from "express";
import cors from "cors";
import router from "./app/routes";
import http from "http";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { noRouteFound } from "./app/utils/noRouteFound";
import cookieParser from "cookie-parser";
import path from "path";
import { StripeController } from "./app/modules/stripe/stripe.controller";
const app = express();

const corsOption = {
  origin: [
    "*",
    "http://10.10.12.62:3000",
    "http://10.10.12.59:5173",
    "http://localhost:5173",
    "https://stripe-front-end.vercel.app",
    "https://wange-wave.vercel.app",
  ],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
};

app.use(cors(corsOption));
app.use(cookieParser());

app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  StripeController.stripeWebhook
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.get("/", (req, res) => {
  res.send("Hello World! This app name is RangeWave");
});

// Onboarding refresh route
app.get("/stripe/onboarding/refresh", (req, res) => {
  res.send(`
    <h1>Onboarding Interrupted</h1>
    <p>Looks like something went wrong or you canceled onboarding.</p>
    <a href="/start-onboarding">Try Again</a>
  `);
});

// Onboarding success route
app.get("/stripe/onboarding/success", (req, res) => {
  // const deepLink = "rangewave://stripe/onboarding/refresh";
  // res.redirect(deepLink);
  res.send(`
    <html>
      <head>
        <title>Redirecting...</title>
        <script type="text/javascript">
          // Try to open app
          window.location = "rangewave://stripe/success";
          // After a timeout, redirect to fallback URL (e.g. web page)
          setTimeout(() => {
            window.location = "/stripe/onboarding/success/fallback";
          }, 2000);
        </script>
      </head>
    </html>
  `);
});

// Onboarding success route
app.get("/stripe/onboarding/success/fallback", (req, res) => {
  // const deepLink = "rangewave://stripe/onboarding/refresh";
  // res.redirect(deepLink);
  res.send(`
    <html>
      <head>
        <title>Redirecting...</title>
      </head>
      <body>
        <p>Redirecting you to the app...</p>
        <p>If nothing happens, <a href="rangewave://stripe/success">click here</a>.</p>
      </body>
    </html>
  `);
});

app.use(express.static(path.join(process.cwd(), "uploads")));

app.use(globalErrorHandler);
app.use(noRouteFound);
const server = http.createServer(app);

export default server;
