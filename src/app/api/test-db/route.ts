/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dns from "dns/promises";
import net from "net";

export async function GET() {
  const report: any = {
    timestamp: new Date().toISOString(),
    env: {
      has_uri: !!process.env.MONGODB_URI,
      uri_starts_with: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) : "none"
    },
    dns_resolution: {},
    port_connectivity: {},
    mongoose_connection: {}
  };

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/neet_analytics";
  // Clean URI (strip quotes)
  const cleanedUri = uri.trim().replace(/^["']|["']$/g, "").trim();

  // 1. Diagnose DNS SRV Records
  try {
    const srvHost = "cluster0.4xy3w88.mongodb.net";
    report.dns_resolution.srv_host = srvHost;
    
    const srvRecords = await dns.resolveSrv(`_mongodb._tcp.${srvHost}`);
    report.dns_resolution.srv_success = true;
    report.dns_resolution.srv_records = srvRecords;

    // Test TCP port connectivity for resolved hosts
    for (const record of srvRecords) {
      const host = record.name;
      const port = record.port || 27017;
      
      const connPromise = new Promise((resolve) => {
        const socket = new net.Socket();
        const start = Date.now();
        
        socket.setTimeout(3000);
        
        socket.on("connect", () => {
          socket.destroy();
          resolve({ success: true, latency_ms: Date.now() - start });
        });
        
        socket.on("error", (err: any) => {
          resolve({ success: false, error: err.message });
        });
        
        socket.on("timeout", () => {
          socket.destroy();
          resolve({ success: false, error: "timeout" });
        });
        
        socket.connect(port, host);
      });

      report.port_connectivity[host] = await connPromise;
    }
  } catch (error: any) {
    report.dns_resolution.srv_success = false;
    report.dns_resolution.srv_error = error.message;
  }

  // 2. Diagnose Mongoose Connection
  try {
    const start = Date.now();
    await mongoose.connect(cleanedUri, {
      serverSelectionTimeoutMS: 5000,
      dbName: "neet_analytics"
    });
    report.mongoose_connection.success = true;
    report.mongoose_connection.latency_ms = Date.now() - start;
    report.mongoose_connection.database_name = mongoose.connection.db?.databaseName;
    await mongoose.disconnect();
  } catch (error: any) {
    report.mongoose_connection.success = false;
    report.mongoose_connection.error_message = error.message;
    report.mongoose_connection.error_code = error.code;
    report.mongoose_connection.error_name = error.name;
  }

  return NextResponse.json(report);
}
