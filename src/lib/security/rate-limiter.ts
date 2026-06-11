interface RateLimitInfo {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, number[]>();
  private limit: number;
  private windowMs: number;
  private lastCleanup: number;

  constructor(limit: number = 60, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.lastCleanup = Date.now();
  }

  check(ip: string): RateLimitInfo {
    const now = Date.now();

    // Lazy cleanup every 10 minutes to prevent memory leaks without background timers
    if (now - this.lastCleanup > 10 * 60 * 1000) {
      this.cleanup();
      this.lastCleanup = now;
    }

    const windowStart = now - this.windowMs;

    let requests = this.store.get(ip) || [];
    requests = requests.filter((time) => time > windowStart);

    if (requests.length < this.limit) {
      requests.push(now);
      this.store.set(ip, requests);
      
      const oldestRequest = requests[0] || now;
      const resetTime = oldestRequest + this.windowMs;

      return {
        allowed: true,
        limit: this.limit,
        remaining: this.limit - requests.length,
        reset: resetTime
      };
    }

    const oldestRequest = requests[0] || now;
    const resetTime = oldestRequest + this.windowMs;

    return {
      allowed: false,
      limit: this.limit,
      remaining: 0,
      reset: resetTime
    };
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [ip, requests] of this.store.entries()) {
      const active = requests.filter((time) => time > windowStart);
      if (active.length === 0) {
        this.store.delete(ip);
      } else {
        this.store.set(ip, active);
      }
    }
  }
}

export const apiRateLimiter = new InMemoryRateLimiter(60, 60000); 
export const authRateLimiter = new InMemoryRateLimiter(10, 60000); 
export const uploadRateLimiter = new InMemoryRateLimiter(10, 60000); 
