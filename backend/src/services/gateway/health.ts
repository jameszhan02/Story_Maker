import os from "os";

export type ServiceHealth = {
  status: "up" | "down";
  responseTime?: number;
  error?: string;
};

export type SystemHealth = {
  status: string;
  timestamp: string;
  version: string;
  service: {
    name: string;
    uptime: {
      seconds: number;
      formatted: string;
    };
    responseTime: number;
  };
  dependencies: {
    [key: string]: ServiceHealth;
  };
  system: {
    memory: {
      total: number;
      free: number;
      used: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    cpu: {
      cores: number;
      loadAvg: number[];
      model: string;
    };
    platform: string;
    arch: string;
    nodeVersion: string;
  };
};

export async function checkServiceHealth(url: string): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const response = await fetch(url);
    const responseTime = Date.now() - start;

    return {
      status: response.ok ? "up" : "down",
      responseTime,
    };
  } catch (error) {
    return {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function formatUptime(uptime: number): string {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export async function getSystemHealth(
  serviceName: string,
  dependencies: { [key: string]: string } = {}
): Promise<SystemHealth> {
  const start = Date.now();
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  // check all dependency services
  const dependencyHealth: { [key: string]: ServiceHealth } = {};
  await Promise.all(
    Object.entries(dependencies).map(async ([name, url]) => {
      dependencyHealth[name] = await checkServiceHealth(url);
    })
  );

  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: {
      name: serviceName,
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime),
      },
      responseTime: Date.now() - start,
    },

    dependencies: dependencyHealth,

    system: {
      memory: {
        total: Math.floor(os.totalmem() / 1024 / 1024),
        free: Math.floor(os.freemem() / 1024 / 1024),
        used: Math.floor((os.totalmem() - os.freemem()) / 1024 / 1024),
        heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.floor(memoryUsage.external / 1024 / 1024),
      },
      cpu: {
        cores: os.cpus().length,
        loadAvg: os.loadavg(),
        model: os.cpus()[0].model,
      },
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
    },
  };
}
