"use client";

import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export default function Modal({ title, description, children, onClose }) {
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);
  useEffect(() => {
    previousFocus.current = document.activeElement;
    dialogRef.current?.focus();
    const onKeyDown = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus.current?.focus?.(); };
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby={description ? 'dialog-description' : undefined} tabIndex={-1}>
      <header className="modal-top"><div><h2 id="dialog-title">{title}</h2>{description && <p id="dialog-description" className="muted">{description}</p>}</div><button type="button" className="icon-button" onClick={onClose} aria-label="ปิดหน้าต่าง"><Icon name="close" /></button></header>
      {children}
    </section>
  </div>;
}
