import { afterEach, describe, expect, it, vi } from 'vitest';
import { openPrintWindow } from '../utils/openPrintWindow';

describe('accounting print window', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens the child page without noopener and then severs its opener', () => {
    const popup = { opener: window } as unknown as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(popup);

    expect(openPrintWindow()).toBe(popup);
    expect(open).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith('', '_blank');
    expect(popup.opener).toBeNull();
  });

  it('returns null when the browser blocks a popup', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);

    expect(openPrintWindow()).toBeNull();
  });
});
