"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const bangkokToday = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const parseDate = value => value ? new Date(`${value}T12:00:00`) : null;
const isoDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const prettyDate = value => value ? parseDate(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const monthText = date => date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function DatePicker({ value = '', onChange, min, max, required = false, disabled = false, className = '', ...props }) {
  const id = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const calendarRef = useRef(null);
  const openingDateRef = useRef('');
  const selectedDate = parseDate(value);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const date = selectedDate || parseDate(bangkokToday());
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = event => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const closeEscape = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    document.addEventListener('keydown', closeEscape, true);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('focusin', closeOutside); document.removeEventListener('keydown', closeEscape, true); };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !calendarRef.current) return undefined;
    const calendar = calendarRef.current;
    // The top layer escapes the modal's scrolling/animated containing block,
    // while keeping the calendar in the form's DOM and keyboard focus order.
    calendar.showPopover?.();
    function positionCalendar() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const viewport = window.visualViewport;
      const leftEdge = (viewport?.offsetLeft || 0) + 12;
      const topEdge = (viewport?.offsetTop || 0) + 12;
      const rightEdge = leftEdge + (viewport?.width || window.innerWidth) - 24;
      const bottomEdge = topEdge + (viewport?.height || window.innerHeight) - 24;
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(344, rightEdge - leftEdge);
      calendar.style.width = `${width}px`;
      const height = calendar.scrollHeight + 2;
      const below = Math.max(0, bottomEdge - rect.bottom - 8);
      const above = Math.max(0, rect.top - topEdge - 8);
      const placeAbove = below < height && above > below;
      const available = Math.max(44, placeAbove ? above : below);
      const visibleHeight = Math.min(height, available, bottomEdge - topEdge);
      const top = placeAbove ? rect.top - visibleHeight - 8 : rect.bottom + 8;
      calendar.style.left = `${Math.max(leftEdge, Math.min(rect.left, rightEdge - width))}px`;
      calendar.style.top = `${Math.max(topEdge, Math.min(top, bottomEdge - visibleHeight))}px`;
      calendar.style.maxHeight = `${visibleHeight}px`;
    }
    positionCalendar();
    calendar.querySelector(`[id="${id}-day-${openingDateRef.current}"]`)?.focus({ preventScroll: true });
    const resizeObserver = new ResizeObserver(positionCalendar);
    resizeObserver.observe(calendar);
    const grid = calendar.querySelector('.date-picker-grid');
    if (grid) resizeObserver.observe(grid);
    const onScroll = event => { if (!calendar.contains(event.target)) positionCalendar(); };
    window.addEventListener('resize', positionCalendar);
    window.addEventListener('scroll', onScroll, true);
    window.visualViewport?.addEventListener('resize', positionCalendar);
    window.visualViewport?.addEventListener('scroll', positionCalendar);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', positionCalendar);
      window.removeEventListener('scroll', onScroll, true);
      window.visualViewport?.removeEventListener('resize', positionCalendar);
      window.visualViewport?.removeEventListener('scroll', positionCalendar);
      if (calendar.matches(':popover-open')) calendar.hidePopover();
    };
  }, [open, id]);

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  function shiftMonth(amount) {
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }
  function choose(date) {
    const next = isoDate(date);
    if ((min && next < min) || (max && next > max)) return;
    onChange?.({ target: { value: next } });
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setOpen(false);
    triggerRef.current?.focus();
  }
  function clear() {
    onChange?.({ target: { value: '' } });
    setOpen(false);
    triggerRef.current?.focus();
  }
  function handleDayKey(event, date) {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next = offsets[event.key] ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsets[event.key]) : null;
    if (event.key === 'PageUp') next = new Date(date.getFullYear(), date.getMonth() - (event.shiftKey ? 12 : 1), date.getDate());
    if (event.key === 'PageDown') next = new Date(date.getFullYear(), date.getMonth() + (event.shiftKey ? 12 : 1), date.getDate());
    if (!next) return;
    event.preventDefault();
    const nextIso = isoDate(next);
    if ((min && nextIso < min) || (max && nextIso > max)) return;
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    requestAnimationFrame(() => document.getElementById(`${id}-day-${nextIso}`)?.focus());
  }

  const firstWeekday = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const dayCells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
  const nextMonthStart = isoDate(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  const previousMonthLast = isoDate(new Date(month.getFullYear(), month.getMonth(), 0));
  const canPrevious = !min || previousMonthLast >= min;
  const canNext = !max || nextMonthStart <= max;

  return <div ref={rootRef} className={`date-picker ${className}`.trim()}>
    <button {...props} ref={triggerRef} type="button" className="date-picker-trigger" aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-calendar`} aria-label={props['aria-label'] || (value ? `วันที่ ${prettyDate(value)}` : 'เลือกวันที่')} disabled={disabled} onClick={() => {
      if (!open) {
        let current = selectedDate || parseDate(bangkokToday());
        if (min && isoDate(current) < min) current = parseDate(min);
        if (max && isoDate(current) > max) current = parseDate(max);
        setMonth(new Date(current.getFullYear(), current.getMonth(), 1));
        openingDateRef.current = isoDate(current);
      }
      setOpen(current => !current);
    }}>
      <span className={value ? 'date-picker-value' : 'date-picker-placeholder'}>{value ? prettyDate(value) : 'เลือกวันที่'}</span>
      <Icon name="calendar" size={20}/>
    </button>
    {open && <section ref={calendarRef} popover="manual" className="date-picker-popover" id={`${id}-calendar`} role="dialog" aria-label="เลือกวันที่">
      <header className="date-picker-heading"><button type="button" className="date-picker-nav" aria-label="เดือนก่อนหน้า" disabled={!canPrevious} onClick={() => shiftMonth(-1)}>‹</button><h3>{monthText(month)}</h3><button type="button" className="date-picker-nav" aria-label="เดือนถัดไป" disabled={!canNext} onClick={() => shiftMonth(1)}>›</button></header>
      <div className="date-picker-grid" role="group" aria-label={monthText(month)}>
        {WEEKDAYS.map((day, index) => <span key={day} className="date-picker-weekday" aria-label={['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'][index]}>{day}</span>)}
        {dayCells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} className="date-picker-empty" aria-hidden="true" />;
          const iso = isoDate(date);
          const outOfRange = (min && iso < min) || (max && iso > max);
          return <button type="button" id={`${id}-day-${iso}`} aria-pressed={iso === value} aria-label={date.toLocaleDateString('th-TH', { dateStyle: 'full' })} aria-current={iso === bangkokToday() ? 'date' : undefined} disabled={outOfRange} key={iso} className={`date-picker-day ${iso === value ? 'selected' : ''} ${iso === bangkokToday() ? 'today' : ''}`} onKeyDown={event => handleDayKey(event, date)} onClick={() => choose(date)}>{date.getDate()}</button>;
        })}
      </div>
      <footer className="date-picker-footer"><button type="button" disabled={(min && bangkokToday() < min) || (max && bangkokToday() > max)} onClick={() => choose(parseDate(bangkokToday()))}>วันนี้</button>{!required && value && <button type="button" onClick={clear}>ล้างวันที่</button>}</footer>
    </section>}
    <input className="date-picker-native" type="date" value={value} min={min} max={max} required={required} disabled={disabled} tabIndex={-1} aria-hidden="true" onChange={() => {}} onInvalid={event => { event.preventDefault(); triggerRef.current?.focus(); }} />
  </div>;
}
