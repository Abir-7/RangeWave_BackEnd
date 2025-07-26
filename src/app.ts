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
  origin: ["*", "https://"],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
};

app.use(cors(corsOption));
app.use(cookieParser());
app.use(express.json());

app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  StripeController.stripeWebhook
);

app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.get("/", (req, res) => {
  res.send("Hello World! This app name is Ai_Finance_Hub");
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
  res.send(`
    <h1>Onboarding Complete!</h1>
    <p>Your Stripe account is ready to receive payments.</p>
    <a href="/dashboard">Go to Dashboard</a>
  `);
});

app.use(express.static(path.join(process.cwd(), "uploads")));

app.use(globalErrorHandler);
app.use(noRouteFound);
const server = http.createServer(app);

export default server;
