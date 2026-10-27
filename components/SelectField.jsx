"use client";

import { Children, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';

const optionsFrom = children => Children.toArray(children)
  .filter(child => isValidElement(child) && child.type === 'option')
  .map(child => ({ value: String(child.props.value ?? child.props.children), label: child.props.children, description: child.props['data-description'], disabled: Boolean(child.props.disabled) }));

export default function SelectField({ value = '', onChange, children, disabled = false, required = false, className = '', ...props }) {
  const id = useId();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const options = optionsFrom(children);
  const selectedIndex = options.findIndex(option => option.value === String(value ?? ''));
  const [activeIndex, setActiveIndex] = useState(Math.max(0, selectedIndex));
  const selected = options[selectedIndex];

  const positionMenu = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const roomBelow = window.innerHeight - rect.bottom - gap - 8;
    const roomAbove = rect.top - gap - 8;
    const preferredHeight = Math.min(320, options.length * 53 + 14);
    const above = roomBelow < Math.min(preferredHeight, 180) && roomAbove > roomBelow;
    const maxHeight = Math.max(60, Math.min(preferredHeight, above ? roomAbove : roomBelow));
    const width = Math.min(Math.max(rect.width, 240), window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setMenuStyle({ position: 'fixed', zIndex: 1000, top: above ? 'auto' : rect.bottom + gap, bottom: above ? window.innerHeight - rect.top + gap : 'auto', left, right: 'auto', width, maxHeight, transformOrigin: above ? 'bottom center' : 'top center' });
  }, [options.length]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    positionMenu();
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    return () => {
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
    };
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = event => { if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false); };
    const closeEscape = event => { if (event.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); } };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, [open]);

  function choose(option) {
    if (!option || option.disabled) return;
    onChange?.({ target: { value: option.value } });
    setOpen(false);
    buttonRef.current?.focus();
  }

  function keyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setOpen(true);
      let next = open ? activeIndex + step : selectedIndex < 0 ? (step > 0 ? 0 : options.length - 1) : selectedIndex;
      while (next >= 0 && next < options.length && options[next].disabled) next += step;
      if (next >= 0 && next < options.length) setActiveIndex(next);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(options[activeIndex]); else { setActiveIndex(Math.max(0, selectedIndex)); setOpen(true); }
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); setOpen(true); setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
    }
  }

  return <div ref={rootRef} className={`select-field ${className}`.trim()}>
    <button {...props} ref={buttonRef} type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined} disabled={disabled || !options.length} onClick={() => { setActiveIndex(Math.max(0, selectedIndex)); setOpen(current => !current); }} onKeyDown={keyDown} className="select-field-trigger">
      <span className="select-field-value">{selected?.label ?? (options.length ? 'เลือกหนึ่งรายการ' : 'ไม่มีข้อมูลให้เลือก')}</span><Icon name="down" size={18}/>
    </button>
    {open && menuStyle && createPortal(<div ref={menuRef} className="select-field-menu" style={menuStyle} id={`${id}-list`} role="listbox" aria-label={props['aria-label']}>
      {options.map((option, index) => <button type="button" role="option" id={`${id}-option-${index}`} aria-label={typeof option.label === 'string' ? option.label : undefined} aria-describedby={option.description ? `${id}-description-${index}` : undefined} aria-selected={String(value ?? '') === option.value} disabled={option.disabled} key={`${option.value}:${index}`} className={`select-field-option ${index === activeIndex ? 'active' : ''}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option)}><span className="select-option-copy"><span>{option.label}</span>{option.description && <small id={`${id}-description-${index}`}>{option.description}</small>}</span><span aria-hidden="true">{String(value ?? '') === option.value ? '✓' : ''}</span></button>)}
    </div>, document.body)}
    <select className="select-field-native" tabIndex={-1} aria-hidden="true" required={required} disabled={disabled} value={value ?? ''} onChange={() => {}} onInvalid={event => { event.preventDefault(); buttonRef.current?.focus(); }}>{children}</select>
  </div>;
}
