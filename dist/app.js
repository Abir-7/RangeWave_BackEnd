"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./app/routes"));
const http_1 = __importDefault(require("http"));
const globalErrorHandler_1 = require("./app/middleware/globalErrorHandler");
const noRouteFound_1 = require("./app/utils/noRouteFound");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const stripe_controller_1 = require("./app/modules/stripe/stripe.controller");
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)(corsOption));
app.use((0, cookie_parser_1.default)());
app.use("/api/stripe/webhook", express_1.default.raw({ type: "application/json" }), stripe_controller_1.StripeController.stripeWebhook);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api", routes_1.default);
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
app.use(express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(noRouteFound_1.noRouteFound);
const server = http_1.default.createServer(app);
exports.default = server;
