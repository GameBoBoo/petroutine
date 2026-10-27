"use client";

import { useEffect, useState } from 'react';
import BrandLogo from '../../components/BrandLogo.jsx';
import Icon from '../../components/Icon.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import AuthCareDoodle from './AuthCareDoodle.jsx';

export default function AuthScreen({ onLogin, onBack, api }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isRegister = mode === 'register';
  const canSubmit = Boolean(form.email.trim() && form.password.length >= (isRegister ? 8 : 1) && (!isRegister || form.name.trim().length >= 2));

  useEffect(() => {
    const previousTitle = document.title;
    return () => { document.title = previousTitle; };
  }, []);
  useEffect(() => {
    document.title = `${isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'} | PetRoutine`;
  }, [isRegister]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      onLogin(await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
    setShowPassword(false);
  }

  return <main className="auth-layout brand-auth">
    <div className={`auth-frame ${isRegister ? 'auth-register' : 'auth-login'}`}>
      <header className="auth-header">
        <BrandLogo />
        <div className="auth-header-actions"><ThemeToggle/><button className="auth-back" type="button" onClick={onBack}><Icon name="arrow" size={18} />กลับหน้าแรก</button></div>
      </header>
      <div className="auth-grid">
        <section className="auth-story" aria-label="เกี่ยวกับ PetRoutine">
          <div className="auth-story-copy">
            <span className="auth-story-kicker">{isRegister ? 'A NEW LITTLE BEGINNING' : 'YOUR EVERYDAY, TOGETHER'}</span>
            <h1>{isRegister ? <>บ้านของการดูแล<br/><span>เริ่มที่คุณ</span></> : <>กลับมาเติม<br/><span>ความใส่ใจ</span></>}</h1>
            <p>{isRegister ? 'ชวนคนในบ้านมาแบ่งปันหน้าที่ และสร้างวันดี ๆ ให้เจ้าตัวเล็กไปด้วยกัน' : 'งานเล็ก ๆ ในทุกวัน คือความรักที่เขารู้สึกได้ มาดูแลวันนี้ไปด้วยกันนะ'}</p>
          </div>
          <AuthCareDoodle together={isRegister}/>
          <span className="auth-story-note">A LITTLE CARE GOES A LONG WAY</span>
        </section>

        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-card">
            <span className="auth-eyebrow">{isRegister ? 'JOIN PETROUTINE' : 'WELCOME BACK'}</span>
            <h2 id="auth-title">{isRegister ? 'สร้างบัญชีของคุณ' : 'ยินดีต้อนรับกลับ'}</h2>
            <p className="auth-intro">{isRegister ? 'เริ่มจัดตารางดูแลสัตว์เลี้ยงร่วมกับคนในบ้าน' : 'เข้ามาดูกันว่า วันนี้มีอะไรที่ต้องดูแลบ้าง'}</p>

            <form onSubmit={submit} className="auth-form">
              {isRegister && <label htmlFor="auth-name">ชื่อของคุณ
                <input id="auth-name" required minLength={2} autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="ชื่อที่คนในบ้านรู้จัก" />
              </label>}
              <label htmlFor="auth-email">อีเมล
                <input id="auth-email" required type="email" autoComplete="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" />
              </label>
              <label htmlFor="auth-password">รหัสผ่าน
                <span className="auth-password-field">
                  <input id="auth-password" required minLength={isRegister ? 8 : undefined} type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} aria-describedby={isRegister ? 'auth-password-hint' : undefined} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder={isRegister ? 'ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร' : 'กรอกรหัสผ่าน'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} aria-pressed={showPassword}>{showPassword ? 'ซ่อน' : 'แสดง'}</button>
                </span>
              </label>
              {isRegister && <p className="auth-field-hint" id="auth-password-hint">ใช้ตัวอักษรอย่างน้อย 8 ตัว เพื่อความปลอดภัยของบัญชี</p>}
              {error && <p className="auth-error" role="alert"><Icon name="alert" size={18}/>{error}</p>}
              <button className="button primary full auth-submit" disabled={loading || !canSubmit}>{loading ? 'กำลังดำเนินการ…' : isRegister ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}<Icon name="arrow" size={18}/></button>
            </form>

            <p className="auth-switch">{isRegister ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'} <button type="button" onClick={switchMode}>{isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button></p>
          </div>
        </section>
      </div>
    </div>
  </main>;
}
