import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_BRANDING_LOGO_DATA_URL_LENGTH, compressBrandingImage } from '../utils/brandingImages';

class MockFileReader {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  readAsDataURL() {
    this.result = 'data:image/mock;base64,source';
    this.onload?.();
  }
}

class MockImage {
  naturalWidth = 1600;
  naturalHeight = 900;
  width = this.naturalWidth;
  height = this.naturalHeight;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) { this.onload?.(); }
}

const makeCanvas = (outputs: Record<string, string>, context: CanvasRenderingContext2D) => ({
  width: 0,
  height: 0,
  getContext: () => context,
  toDataURL: (type: string, _quality?: number) => outputs[type] || `data:${type};base64,small`
}) as unknown as HTMLCanvasElement;

describe('branding image compression', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps a small transparent PNG unchanged in format and within the server limit', async () => {
    const context = { clearRect: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: '' } as unknown as CanvasRenderingContext2D;
    const originalCreateElement = document.createElement.bind(document);
    vi.stubGlobal('FileReader', MockFileReader);
    vi.stubGlobal('Image', MockImage);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => (
      tagName === 'canvas'
        ? makeCanvas({ 'image/png': 'data:image/png;base64,small' }, context) as unknown as HTMLElement
        : originalCreateElement(tagName)
    ));

    const result = await compressBrandingImage(new File(['source'], 'stage.png', { type: 'image/png' }));
    expect(result).toBe('data:image/png;base64,small');
    expect(result.length).toBeLessThanOrEqual(MAX_BRANDING_LOGO_DATA_URL_LENGTH);
    expect(context.fillRect).not.toHaveBeenCalled();
  });

  it('uses alpha-preserving WebP before a white-backed JPEG fallback for oversized PNGs', async () => {
    const context = { clearRect: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: '' } as unknown as CanvasRenderingContext2D;
    const originalCreateElement = document.createElement.bind(document);
    const webp = 'data:image/webp;base64,compressed';
    vi.stubGlobal('FileReader', MockFileReader);
    vi.stubGlobal('Image', MockImage);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => (
      tagName === 'canvas'
        ? makeCanvas({ 'image/png': 'x'.repeat(700_001), 'image/webp': webp }, context) as unknown as HTMLElement
        : originalCreateElement(tagName)
    ));

    const result = await compressBrandingImage(new File(['source'], 'stage.png', { type: 'image/png' }));
    expect(result).toBe(webp);
    expect(context.fillRect).not.toHaveBeenCalled();
  });

  it('flattens transparency to white before producing a JPEG fallback', async () => {
    const context = { clearRect: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: '' } as unknown as CanvasRenderingContext2D;
    const originalCreateElement = document.createElement.bind(document);
    const outputs = {
      'image/png': 'x'.repeat(700_001),
      'image/webp': 'x'.repeat(700_001),
      'image/jpeg': 'data:image/jpeg;base64,compressed'
    };
    vi.stubGlobal('FileReader', MockFileReader);
    vi.stubGlobal('Image', MockImage);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => (
      tagName === 'canvas'
        ? makeCanvas(outputs, context) as unknown as HTMLElement
        : originalCreateElement(tagName)
    ));

    const result = await compressBrandingImage(new File(['source'], 'stage.png', { type: 'image/png' }));
    expect(result).toBe(outputs['image/jpeg']);
    expect(context.fillStyle).toBe('#fff');
    expect(context.fillRect).toHaveBeenCalled();
    expect(result.length).toBeLessThanOrEqual(MAX_BRANDING_LOGO_DATA_URL_LENGTH);
  });
});
