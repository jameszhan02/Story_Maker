import chalk from "chalk";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { AlertService } from "./alert";
import { getSystemHealth } from "./health";

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;
const alertService = new AlertService({
  enabled: true,
  threshold: 100,
  cooldown: 1000,
  maxRetries: 3,
});

// == Middleware ==
app.use(helmet()); // security headers
app.use(cors()); // cors
app.use(express.json());

// gateway middleware
const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  changeOrigin: true,
  pathRewrite: {
    "^/api/auth": "",
  },
  proxyTimeout: 3000,
  timeout: 3000,
  on: {
    proxyReq: fixRequestBody,
  },
});

// == Alert Middleware ==
app.use(alertService.staticRequestCount);
app.use(alertService.responseTimeAlert);
app.use(alertService.errorRateAlert);

// == Health Check ==
app.get("/health", async (req, res) => {
  const health = await getSystemHealth("API Gateway", {});
  res.json(health);
});

// auth service
app.use("/api/auth", authProxy);

app.listen(PORT, () => {
  console.log(
    `${chalk.green("API Gateway is running on port")} ${chalk.yellow(PORT)}`
  );
});
