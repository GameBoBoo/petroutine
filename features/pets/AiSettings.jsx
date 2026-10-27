"use client";

import { useEffect, useState } from 'react';
import { useConfirmation } from '../../components/ConfirmationProvider.jsx';

export default function AiSettings({ householdId, headers }) {
  const confirm = useConfirmation();
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch(`/api/v1/households/${householdId}/ai-settings`, { headers })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error?.message); return data.settings; })
      .then(data => { if (active) setSettings(data); })
      .catch(() => { if (active) setError('เชื่อมต่อบริการ AI ไม่สำเร็จ กรุณาลองใหม่ภายหลัง'); });
    return () => { active = false; };
  }, [householdId, headers]);
  async function change(enabled) {
    if (!await confirm({ title: enabled ? 'เปิดใช้งาน AI สำหรับบ้านนี้?' : 'ปิดใช้งาน AI สำหรับบ้านนี้?', description: enabled ? 'สมาชิกที่ยินยอมสามารถถาม AI เพื่อค้นหาและสรุปบันทึกในบ้านได้' : 'สมาชิกในบ้านจะหยุดใช้ AI จนกว่าจะเปิดใช้งานอีกครั้ง', confirmLabel: 'ยืนยัน' })) return;
    setBusy(true); setError('');
    const previous = settings;
    setSettings(current => ({ ...current, enabled }));
    try {
      const response = await fetch(`/api/v1/households/${householdId}/ai-settings`, {
        method: 'PATCH', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'บันทึกไม่สำเร็จ');
      setSettings(data.settings);
    } catch (problem) { setSettings(previous); setError(problem.message); }
    finally { setBusy(false); }
  }
  async function changeConsent(consented) {
    if (!await confirm({ title: consented ? 'ยืนยันความยินยอมใช้ AI?' : 'ถอนความยินยอมใช้ AI?', description: consented ? 'คำถามและบันทึกที่เกี่ยวข้องของบ้านนี้จะถูกส่งไปยังผู้ให้บริการ AI เพื่อค้นหาและสรุปคำตอบ' : 'ระบบจะหยุดส่งคำขอ AI ครั้งถัดไปสำหรับคุณ', confirmLabel: 'ยืนยัน' })) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/v1/households/${householdId}/ai-consent`, {
        method: 'PATCH', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ consented }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'บันทึกไม่สำเร็จ');
      setSettings(current => ({ ...current, consented: data.consented }));
    } catch (problem) { setError(problem.message); }
    finally { setBusy(false); }
  }
  return <section className="settings-card form-stack" aria-label="การตั้งค่า AI">
    <h3>ผู้ช่วย AI</h3>
    <p className="muted">เจ้าของบ้านเปิด AI ให้สมาชิกใช้ได้ แต่แต่ละคนเลือกยินยอมเองเพียงครั้งเดียวต่อบ้าน และถอนความยินยอมได้ที่นี่</p>
    {!settings ? <p role="status">กำลังโหลดการตั้งค่า…</p> : <>
      <label className="checkbox-row"><input type="checkbox" checked={settings.enabled} disabled={busy || settings.role !== 'owner' || !settings.available} onChange={event => change(event.target.checked)} /> เปิดใช้งาน AI สำหรับบ้านนี้</label>
      <label className="checkbox-row"><input type="checkbox" checked={settings.consented} disabled={busy || (!settings.enabled && !settings.consented)} onChange={event => changeConsent(event.target.checked)} /> ยินยอมให้ส่งคำถามและบันทึกที่เกี่ยวข้องของบ้านนี้ไปยัง ผู้ให้บริการ AI</label>
      <p className="muted">การถอนความยินยอมจะหยุดคำขอ AI ครั้งถัดไปทันที</p>
      {!settings.available && <p className="muted">ระบบยังไม่พร้อมให้ใช้งาน AI</p>}
      {settings.role !== 'owner' && <p className="muted">เฉพาะเจ้าของบ้านที่เปลี่ยนการตั้งค่านี้ได้</p>}
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
