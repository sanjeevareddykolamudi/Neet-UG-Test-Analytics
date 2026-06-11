import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { env } from "../lib/env";
console.log("env.MONGODB_URI is:", env.MONGODB_URI);
