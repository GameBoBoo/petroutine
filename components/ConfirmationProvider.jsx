"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ConfirmationContext = createContext(null);

export function useConfirmation() {
  const confirm = useContext(ConfirmationContext);
  if (!confirm) throw new Error('ConfirmationProvider is required');
  return confirm;
}

function ConfirmationDialog({ request, onAnswer }) {
  const panel = useRef(null);
  const backdrop = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const siblings = [...document.body.children].filter(element => element !== backdrop.current);
    const inertStates = siblings.map(element => element.inert);
    siblings.forEach(element => { element.inert = true; });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('button')?.focus();
    function onKey(event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); onAnswer(false); }
      if (event.key !== 'Tab') return;
      const buttons = [...panel.current.querySelectorAll('button:not(:disabled)')];
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      siblings.forEach((element, index) => { element.inert = inertStates[index]; });
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [onAnswer]);
  return createPortal(<div ref={backdrop} className="modal-backdrop confirmation-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onAnswer(false); }}>
    <section ref={panel} className="modal confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <h2 id={titleId}>{request.title || 'ยืนยันการเปลี่ยนแปลง'}</h2>
      <p id={descriptionId}>{request.description}</p>
      <div className="form-actions"><button type="button" className="button ghost" onClick={() => onAnswer(false)}>ยกเลิก</button><button type="button" className={`button ${request.danger ? 'danger' : 'primary'}`} onClick={() => onAnswer(true)}>{request.confirmLabel || (request.danger ? 'ยืนยันลบ' : 'ยืนยัน')}</button></div>
    </section>
  </div>, document.body);
}

export default function ConfirmationProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolver = useRef(null);
  const confirm = useCallback(options => {
    if (resolver.current) return Promise.resolve(false);
    return new Promise(resolve => { resolver.current = resolve; setRequest(options); });
  }, []);
  const answer = useCallback(value => {
    const resolve = resolver.current;
    resolver.current = null;
    setRequest(null);
    resolve?.(value);
  }, []);
  useEffect(() => () => { resolver.current?.(false); }, []);
  return <ConfirmationContext.Provider value={confirm}>{children}{request && <ConfirmationDialog request={request} onAnswer={answer}/>}</ConfirmationContext.Provider>;
}
