/**
 * Alert service
 * Type of alerts in api management system:
 * 1. performance alerts:
 *  - response time
 *  - latency
 *  - throughput
 *  all these help identify when an API is not performing within the expected parameters, potentially impacting the user experience
 *
 * 2. security alerts:
 *  - authentication failures
 *  - unauthorized access attempts
 *  - unusual spikes in traffic that could indicatre a DDoS attack.
 *
 * 3. Quota and Usage Alerts:
 *  - when a user exceeds their allocated quota
 *  - when an API is being used more than expected
 *
 * 4. Functional Alerts:
 *  - when an API is not working as expected
 *  - when an API is not responding to requests
 *
 * 5. System Health Alerts:
 *  - when the system is not performing as expected
 *  - when the system is experiencing high load
 *  - when the system is not responding to requests
 *
 */

/*
 *  common error codes:
 *  - 500: internal server error
 *  - 503: service unavailable
 *  - 400: bad request
 *  - 401: unauthorized
 *  - 403: forbidden
 *  - 404: not found
 *  - 429: too many requests
 *  - 408: request timeout
 *  - 409: conflict
 *  - 413: payload too large
 *  - 415: unsupported media type
 *  - 422: unprocessable entity
 */

import { NextFunction, Request, Response } from "express";

export type AlertLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type Alert = {
  id?: string;
  level: AlertLevel;
  service: string;
  message: string;
  timestamp: number;
  details?: any;
  resolved?: boolean;
  resolvedAt?: string;
};

export type AlertConfig = {
  enabled: boolean;
  threshold: number;
  cooldown: number;
  maxRetries: number;
};

export type AlertServiceType = {
  responseTimeAlert: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
};

export class AlertService {
  private requestCount: number = 0;
  private errorCount: number = 0;
  private errorRate: number = 0;
  private lastResetTime: number = Date.now();
  private alertConfig: AlertConfig;
  private readonly PERFORMANCE_THRESHOLD = 1500;
  private readonly ERROR_RATE_THRESHOLD = 0.1; // 10%
  private readonly MAX_RETRIES = 3;
  private readonly RESET_INTERVAL = 300000 / 12; //reset stats in 5 mins window

  private endpointsStats: Map<
    string,
    {
      requestCount: number;
      errorCount: number;
      errorRate: number;
      lastResetTime: number;
    }
  > = new Map();

  constructor(alertConfig: AlertConfig) {
    this.alertConfig = alertConfig;

    //reset stats in 5 mins window
    setInterval(() => {
      this.endpointsStats.clear();
    }, this.RESET_INTERVAL);
  }

  private getEndpointKey = (req: Request) => {
    return `${req.method}:${req.path}`;
  };

  private getOrCreateEndpointStats = (req: Request) => {
    const key = this.getEndpointKey(req);
    let stats = this.endpointsStats.get(key);
    if (!stats) {
      stats = {
        requestCount: 0,
        errorCount: 0,
        errorRate: 0,
        lastResetTime: Date.now(),
      };
      this.endpointsStats.set(key, stats);
    }
    return stats;
  };

  private updateEndpointStats = (req: Request, res: Response) => {
    const stats = this.getOrCreateEndpointStats(req);
    stats.requestCount++;
    res.on("finish", () => {
      //TODO: make this more in details later.
      if (res.statusCode >= 500) {
        stats.errorCount++;
      }
      stats.errorRate = stats.errorCount / stats.requestCount;
    });
  };

  private sendAlert = (alert: Alert) => {
    //TODO: send alert in an different way later.
    const { level, service, message, details } = alert;
    console.error(`🚨:[${level}] [${service}] ${message}`, details);
  };

  public staticRequestCount = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    this.updateEndpointStats(req, res);
    next();
  };

  public responseTimeAlert = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const startTime = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      if (duration > this.PERFORMANCE_THRESHOLD) {
        this.sendAlert({
          level: "WARNING",
          service: "Gateway",
          message: "Response time alert",
          timestamp: Date.now(),
          details: {
            duration,
            path: req.path,
            method: req.method,
          },
        });
      }
    });
    next();
  };

  public errorRateAlert = (req: Request, res: Response, next: NextFunction) => {
    const stats = this.getOrCreateEndpointStats(req);
    res.on("finish", () => {
      if (stats.errorRate > this.ERROR_RATE_THRESHOLD) {
        this.sendAlert({
          level: "ERROR",
          service: "Gateway",
          message: "Error rate alert",
          timestamp: Date.now(),
          details: {
            errorRate: (stats.errorRate * 100).toFixed(2) + "%",
            path: req.path,
            method: req.method,
            window: this.RESET_INTERVAL,
          },
        });
      }
    });
    next();
  };
}
