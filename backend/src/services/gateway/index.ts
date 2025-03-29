import chalk from "chalk";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { getSystemHealth } from "./health";

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// == Middleware ==
app.use(helmet()); // security headers
app.use(cors()); // cors
app.use(express.json());

// == Health Check ==
app.get("/health", async (req, res) => {
  const health = await getSystemHealth("API Gateway", {});
  res.json(health);
});

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

app.use((req, res, next) => {
  console.log(chalk.cyan("\n=== Gateway Request ==="));
  console.log("📝 Path:", chalk.yellow(req.path));
  console.log("📝 Method:", chalk.yellow(req.method));
  console.log("📝 Body:", chalk.yellow(JSON.stringify(req.body)));
  next();
});

// auth service
app.use("/api/auth", authProxy);

app.listen(PORT, () => {
  console.log(
    `${chalk.green("API Gateway is running on port")} ${chalk.yellow(PORT)}`
  );
});
