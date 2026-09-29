import DOMPurify from 'dompurify';

export interface ExamPrintDocumentOptions {
  title?: string;
  onPrintStarted?: () => void;
  onError?: () => void;
}

export interface ExamPrintDocumentSession {
  document: Pick<Document, 'write' | 'close'>;
}

/**
 * Opens an isolated same-origin print frame instead of a popup window.
 * Print markup is sanitized because it may contain names or other values from
 * database rows; executable content must never run with access to the app.
 */
export function createExamPrintDocument(
  options: ExamPrintDocumentOptions = {}
): ExamPrintDocumentSession | null {
  if (typeof document === 'undefined' || !document.body) return null;

  const frame = document.createElement('iframe');
  frame.title = options.title || 'مستند طباعة الامتحانات';
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('tabindex', '-1');
  frame.dataset.examPrintFrame = 'true';
  frame.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;z-index:-1;';

  let markup = '';
  let closed = false;

  const removeFrame = () => {
    if (frame.isConnected) frame.remove();
  };

  return {
    document: {
      write: (html: string) => {
        if (!closed) markup += html;
      },
      close: () => {
        if (closed) return;
        closed = true;

        frame.addEventListener('load', () => {
          const printWindow = frame.contentWindow;
          if (!printWindow || typeof printWindow.print !== 'function') {
            removeFrame();
            options.onError?.();
            return;
          }

          printWindow.addEventListener('afterprint', removeFrame, { once: true });
          try {
            printWindow.focus();
            printWindow.print();
            options.onPrintStarted?.();
          } catch {
            removeFrame();
            options.onError?.();
            return;
          }

          // Some embedded browsers do not emit `afterprint`; avoid leaking a
          // hidden iframe indefinitely while leaving ample time for the dialog.
          if (frame.isConnected) window.setTimeout(removeFrame, 120_000);
        }, { once: true });

        try {
          frame.srcdoc = DOMPurify.sanitize(markup, {
            WHOLE_DOCUMENT: true,
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base'],
            FORBID_ATTR: ['srcdoc']
          }) as string;
          document.body.append(frame);
        } catch {
          removeFrame();
          options.onError?.();
        }
      }
    }
  };
}
