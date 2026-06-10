import { env } from "@/lib/env";

export function getSecurityHeaders() {
  const isDev = env.APP_ENV === "development";

  const cspDirectives = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      isDev ? "'unsafe-eval'" : "", 
      "https://apis.google.com",
    ].filter(Boolean),
    "style-src": [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://res.cloudinary.com",
      "https://lh3.googleusercontent.com",
      "https://images.unsplash.com",
    ],
    "font-src": [
      "'self'",
      "https://fonts.gstatic.com",
    ],
    "connect-src": [
      "'self'",
      "https://api.cloudinary.com",
      "https://res.cloudinary.com",
      isDev ? "ws:" : "",
      isDev ? "http://localhost:3001" : "",
    ].filter(Boolean),
    "frame-src": [
      "'self'",
      "https://accounts.google.com",
    ],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": isDev ? [] : [""]
  };

  const cspHeaderValue = Object.entries(cspDirectives)
    .map(([key, values]) => {
      if (values.length === 0) return "";
      return `${key} ${values.join(" ")}`;
    })
    .filter(Boolean)
    .join("; ");

  return {
    "Content-Security-Policy": cspHeaderValue,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload"
  };
}
