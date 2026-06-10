/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuditLog } from "@/models/AuditLog";
import { connectToDatabase } from "./mongodb";

export type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: Record<string, any>;
  userId?: string;
  action?: string;
  error?: any;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: string, metadata?: Record<string, any>): string {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata
    };
    return JSON.stringify(payload);
  }

  info(message: string, context?: string, metadata?: Record<string, any>) {
    console.info(this.formatLog("info", message, context, metadata));
  }

  warn(message: string, context?: string, metadata?: Record<string, any>) {
    console.warn(this.formatLog("warn", message, context, metadata));
  }

  error(message: string, error?: any, context?: string, metadata?: Record<string, any>) {
    const errorMeta = error ? {
      errorMessage: error.message || String(error),
      stack: error.stack
    } : {};
    console.error(
      this.formatLog("error", message, context, { ...metadata, ...errorMeta })
    );
  }

  async audit(params: {
    userId?: string;
    action: string;
    status: "success" | "failure";
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    const { userId, action, status, ipAddress, userAgent, metadata } = params;
    
    // 1. Output audit event to stdout for Render log stream aggregation
    this.info(`Audit Log [${action}] - Status: ${status}`, "Audit", {
      userId,
      status,
      ipAddress,
      userAgent,
      ...metadata
    });

    // 2. Persist audit log in database
    try {
      await connectToDatabase();
      await AuditLog.create({
        userId,
        action,
        status,
        ipAddress,
        userAgent,
        metadata: metadata || {}
      });
    } catch (dbErr) {
      // Graceful degradation: log to stderr if db logging fails, but do not crash the app
      this.error("Failed to persist audit log in database", dbErr, "Audit");
    }
  }
}

export const logger = new Logger();
