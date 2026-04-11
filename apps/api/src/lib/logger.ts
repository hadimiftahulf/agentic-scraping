import { pino } from "pino";
import { config } from "@bot/config";

export const logger = pino({
  level: config.nodeEnv === "production" ? "info" : "debug",
  transport:
    config.nodeEnv === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  base: {
    service: "api",
    environment: config.nodeEnv,
  },
});

export const createRequestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info(
      {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: duration,
        traceId: req.headers["x-trace-id"] || generateTraceId(),
      },
      "Request completed",
    );
  });

  next();
};

function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
