import { describe, expect, it, vi } from 'vitest';
import {
  isTransientFinancialSourceReadError,
  retryTransientFinancialSourceRead,
} from '../utils/retryFinancialSourceRead';

describe('financial source read recovery', () => {
  it('retries a temporary gateway response once and returns the verified read', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('temporary outage'), { status: 503 }))
      .mockResolvedValueOnce({ connected: true });

    await expect(retryTransientFinancialSourceRead(operation, { retryDelayMs: 0 }))
      .resolves.toEqual({ connected: true });
    expect(operation).toHaveBeenCalledTimes(2);
    expect(operation.mock.calls[0][0]).not.toBe(operation.mock.calls[1][0]);
  });

  it('does not retry authentication or authorization failures', async () => {
    const failure = Object.assign(new Error('forbidden'), { status: 403 });
    const operation = vi.fn().mockRejectedValue(failure);

    await expect(retryTransientFinancialSourceRead(operation, { retryDelayMs: 0 }))
      .rejects.toBe(failure);
    expect(operation).toHaveBeenCalledOnce();
    expect(isTransientFinancialSourceReadError(failure)).toBe(false);
  });

  it('treats a temporary server error as retryable', () => {
    expect(isTransientFinancialSourceReadError({ status: 500 })).toBe(true);
    expect(isTransientFinancialSourceReadError({ status: 403 })).toBe(false);
  });

  it('aborts a timed-out attempt and retries with a fresh connection signal', async () => {
    const observedSignals: AbortSignal[] = [];
    const operation = vi.fn(async (signal: AbortSignal) => {
      observedSignals.push(signal);
      if (observedSignals.length === 1) {
        return new Promise<never>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')), { once: true });
        });
      }
      return 'connected';
    });

    await expect(retryTransientFinancialSourceRead(operation, {
      attempts: 2,
      timeoutMs: 10,
      retryDelayMs: 0,
    })).resolves.toBe('connected');

    expect(observedSignals).toHaveLength(2);
    expect(observedSignals[0].aborted).toBe(true);
    expect(observedSignals[1].aborted).toBe(false);
  });

  it('stops retrying when the parent screen is closed', async () => {
    const parentController = new AbortController();
    const operation = vi.fn((signal: AbortSignal) => new Promise<never>((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }));
    const pending = retryTransientFinancialSourceRead(operation, {
      attempts: 3,
      timeoutMs: 1000,
      retryDelayMs: 1000,
      signal: parentController.signal,
    });

    parentController.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(operation).toHaveBeenCalledOnce();
  });
});
