import chalk from "chalk";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../../docs/swagger";
import { AlertService } from "./alert";
import { getSystemHealth } from "./health";
import { refreshToken, requireAuth } from "./middleware/auth";

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
app.use(cookieParser());
// swagger ui
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//auth middleware
app.use(refreshToken);

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

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     description: Returns the health status of the API and its services
 *     responses:
 *       200:
 *         description: System health information
 *       500:
 *         description: System health check failed
 */
app.get("/health", async (_req, res) => {
  const health = await getSystemHealth("API Gateway", {});
  res.json(health);
});

//
const protectedPaths = ["/logout"];
const checkAuthForPath = (req: Request, res: Response, next: NextFunction) => {
  if (protectedPaths.includes(req.path)) {
    return requireAuth(req, res, next);
  }
  next();
};

// auth service
app.use("/api/auth", checkAuthForPath, authProxy);

app.listen(PORT, () => {
  console.log(
    `${chalk.green("API Gateway is running on port")} ${chalk.yellow(PORT)}`
  );
});
