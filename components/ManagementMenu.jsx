"use client";
import Icon from './Icon.jsx';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
const ManagementContext = createContext(null);

export function ManagementMode({ children }) {
  const [managing, setManaging] = useState(false);
  const [count, setCount] = useState(0);
  const register = useCallback(() => {
    setCount(value => value + 1);
    return () => setCount(value => value - 1);
  }, []);
  const context = useMemo(() => ({ managing, register, count, setManaging }), [managing, register, count]);
  return <ManagementContext.Provider value={context}>

    {children}
  </ManagementContext.Provider>;
}

export function ManagementControls({ children }) {
  const context = useContext(ManagementContext);
  return <div className="management-header-actions">
    {children}
    {context?.count > 0 && <div className={`management-toolbar${context.managing ? ' is-managing' : ''}`}>
      <button type="button" className="button management-toggle" aria-pressed={context.managing} title={context.managing ? 'ซ่อนเครื่องมือแก้ไขและลบ' : 'แสดงเครื่องมือแก้ไขและลบรายการในส่วนนี้'} onClick={() => context.setManaging(value => !value)}>
        <Icon name={context.managing ? 'check' : 'edit'} size={17} />
        {context.managing ? 'เสร็จสิ้น' : 'จัดการรายการ'}
      </button>
    </div>}
  </div>;
}

export default function ManagementMenu({ label = 'รายการนี้', children }) {
  const context = useContext(ManagementContext);
  const register = context?.register;
  useEffect(() => register?.(), [register]);
  if (!context?.managing) return null;
  return <div className="management-menu management-options" role="group" aria-label={`จัดการ ${label}`}>{children}</div>;
}
