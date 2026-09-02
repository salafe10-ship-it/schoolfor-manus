import type { RequestHandler } from 'express';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
  maxKeys?: number;
};

type Counter = {
  count: number;
  resetAt: number;
};

/**
 * Small, bounded in-process limiter for single-instance auth/diagnostic routes.
 *
 * The map is intentionally bounded and expires entries so an attacker cannot
 * turn the limiter itself into an unbounded memory sink. Multi-instance
 * deployments should put a shared gateway limiter in front of the service.
 */
export function createMemoryRateLimiter({
  windowMs,
  max,
  message = 'Too many requests. Please try again later.',
  maxKeys = 10_000,
}: RateLimitOptions): RequestHandler {
  const counters = new Map<string, Counter>();
  let lastSweepAt = 0;

  const sweepExpired = (now: number) => {
    for (const [key, counter] of counters) {
      if (counter.resetAt <= now) counters.delete(key);
    }
    lastSweepAt = now;
  };

  return (req, res, next) => {
    const now = Date.now();

    if (now - lastSweepAt >= windowMs) {
      sweepExpired(now);
    }

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let counter = counters.get(key);

    if (!counter || counter.resetAt <= now) {
      if (counter) counters.delete(key);
      if (counters.size >= maxKeys) sweepExpired(now);
      if (counters.size >= maxKeys) {
        res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
        res.status(503).json({
          success: false,
          code: 'RATE_LIMITER_CAPACITY',
          message: 'Request protection is temporarily at capacity. Please retry later.',
        });
        return;
      }
      counter = { count: 0, resetAt: now + windowMs };
      counters.set(key, counter);
    }

    counter.count += 1;
    const remaining = Math.max(0, max - counter.count);
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(remaining));
    res.set('RateLimit-Reset', String(Math.ceil(counter.resetAt / 1000)));

    if (counter.count > max) {
      res.set('Retry-After', String(Math.ceil((counter.resetAt - now) / 1000)));
      res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message,
      });
      return;
    }

    next();
  };
}
