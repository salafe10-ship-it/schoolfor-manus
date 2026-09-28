import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createExamPrintDocument } from '../utils/examPrintDocument';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('exam print document', () => {
  it('uses a hidden iframe and removes executable markup before loading it', () => {
    const appendedNodes: Node[] = [];
    vi.spyOn(document.body, 'append').mockImplementation((...nodes) => {
      appendedNodes.push(...nodes.filter((node): node is Node => node instanceof Node));
    });
    const session = createExamPrintDocument({ title: 'كشف اختبار' });
    expect(session).not.toBeNull();

    session?.document.write('<!doctype html><html><head><title>كشف</title></head><body><h1>كشف الدرجات</h1><script>window.parent.location="https://bad.example"</script><img src="x" onerror="alert(1)"></body></html>');
    session?.document.close();

    const frame = appendedNodes.find(node => node instanceof HTMLIFrameElement) as HTMLIFrameElement | undefined;
    expect(frame).not.toBeNull();
    expect(frame?.title).toBe('كشف اختبار');

    const parsed = new DOMParser().parseFromString(frame?.srcdoc || '', 'text/html');
    expect(parsed.querySelector('h1')?.textContent).toBe('كشف الدرجات');
    expect(parsed.querySelector('script')).toBeNull();
    expect(parsed.querySelector('img')?.hasAttribute('onerror')).toBe(false);
  });

  it('invokes the frame print command after the document loads', () => {
    const appendedNodes: Node[] = [];
    vi.spyOn(document.body, 'append').mockImplementation((...nodes) => {
      appendedNodes.push(...nodes.filter((node): node is Node => node instanceof Node));
    });
    const print = vi.fn();
    const focus = vi.fn();
    const addEventListener = vi.fn();
    const frameWindow = { print, focus, addEventListener } as unknown as Window;
    vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue(frameWindow);
    const onPrintStarted = vi.fn();

    const session = createExamPrintDocument({ onPrintStarted });
    session?.document.write('<html><body><h1>كشف</h1></body></html>');
    session?.document.close();
    const frame = appendedNodes.find(node => node instanceof HTMLIFrameElement) as HTMLIFrameElement | undefined;
    frame?.dispatchEvent(new Event('load'));

    expect(focus).toHaveBeenCalledOnce();
    expect(print).toHaveBeenCalledOnce();
    expect(addEventListener).toHaveBeenCalledWith('afterprint', expect.any(Function), { once: true });
    expect(onPrintStarted).toHaveBeenCalledOnce();
  });
});
