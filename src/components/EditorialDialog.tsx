import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  children: ReactNode;
};

export function EditorialDialog({ open, onClose, title, className = '', children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useBodyScrollLock(open);

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const previousFocus = document.activeElement;
    element.showModal();
    element.scrollTop = 0;
    return () => {
      element.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className={`editorial-dialog ${className}`}
      aria-label={title}
      onCancel={(event) => { event.preventDefault(); close.current(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close.current(); }}
    >
      {open && <div className="dialog-surface">
        <button type="button" className="round-control dialog-close" aria-label={`Close ${title}`} onClick={onClose}><X size={20} /></button>
        {children}
      </div>}
    </dialog>
  );
}
