import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// == Middleware ==
app.use(helmet()); // security headers
app.use(cors()); // cors
app.use(express.json());

// == Health Check ==
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// gateway middleware
const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  changeOrigin: true,
  pathRewrite: {
    "^/api/auth": "",
  },
});

// auth service
app.use("/api/auth", authProxy);

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
