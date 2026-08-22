import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const SHEET_OPEN_CLASS = 'sheet-open';

/** Renders children on document.body above AppShell/BottomNav, locks background scroll. */
export function SheetPortal({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add(SHEET_OPEN_CLASS);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove(SHEET_OPEN_CLASS);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return createPortal(children, document.body);
}
