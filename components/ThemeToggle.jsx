"use client";

import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

export default function ThemeToggle({ showLabel = false }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const sync = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    sync();
    window.addEventListener('pawroutine-theme-change', sync);
    return () => window.removeEventListener('pawroutine-theme-change', sync);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try { window.localStorage.setItem('pawroutine_theme', next); } catch {}
    window.dispatchEvent(new Event('pawroutine-theme-change'));
    setTheme(next);
  }

  const dark = theme === 'dark';
  return <button type="button" className={`theme-toggle${showLabel ? ' theme-toggle-labeled' : ''}`} onClick={toggle} aria-label={dark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'} title={dark ? 'โหมดสว่าง' : 'โหมดมืด'} aria-pressed={dark}>
    <Icon name={dark ? 'sun' : 'moon'} size={19}/>{showLabel && <span>{dark ? 'โหมดสว่าง' : 'โหมดมืด'}</span>}
  </button>;
}
