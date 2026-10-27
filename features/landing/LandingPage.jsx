"use client";

import BrandLogo from "../../components/BrandLogo.jsx";
import Icon from '../../components/Icon.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import BrandDoodle from './BrandDoodle.jsx';
import HeroCareScene from './HeroCareScene.jsx';
import CareDayStory from './CareDayStory.jsx';
import CareSceneIllustration from '../../components/CareSceneIllustration.jsx';
import { useEffect } from 'react';

const features = [
  { icon: 'clock', number: '01', title: 'รู้ว่าวันนี้ต้องดูแลอะไร', description: 'รวมเวลาให้อาหาร เติมน้ำ และกิจวัตรประจำไว้ในหน้าเดียว ดูได้ทันทีว่างานไหนทำแล้วหรืองานไหนยังรออยู่' },
  { icon: 'users', number: '02', title: 'แบ่งการดูแลให้คนในบ้าน', description: 'มอบหมายผู้รับผิดชอบและบันทึกการดูแลร่วมกัน ทุกคนเห็นข้อมูลชุดเดียวกัน ช่วยลดการทำซ้ำหรือหลงลืม' },
  { icon: 'calendar', number: '03', title: 'เก็บเรื่องสำคัญไว้ด้วยกัน', description: 'ดูกิจวัตร นัดหมาย และบันทึกสุขภาพย้อนหลัง พร้อมรวบรวมข้อมูลที่บันทึกไว้เป็นรายงานสำหรับสัตวแพทย์' },
];

function Logo() {
  return <BrandLogo className="public-brand-logo"/>;
}

export default function LandingPage({ onStart }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'PetRoutine — ดูแลทุกวัน ไปด้วยกัน';
    return () => { document.title = previousTitle; };
  }, []);
  return <div className="landing brand-public">
    <a className="skip-link" href="#landing-main">ข้ามไปเนื้อหาหลัก</a>
    <header className="landing-header"><a className="public-home-link" href="#landing-main" aria-label="PetRoutine หน้าแรก"><Logo/></a><nav aria-label="เมนูเว็บไซต์"><a href="#features">ช่วยดูแลอย่างไร</a><a href="#faq">คำถามที่พบบ่อย</a><ThemeToggle/><button type="button" className="button primary" onClick={onStart}>เข้าสู่ระบบ <Icon name="chevron" size={16}/></button></nav></header>
    <main id="landing-main">
      <section className="landing-hero"><div className="landing-copy"><span className="public-eyebrow"><span/>CARE, TOGETHER</span><h1>ดูแลทุกวัน<br/><em>ไปด้วยกัน<BrandDoodle kind="underline" className="public-title-underline"/></em></h1><p>ให้ทุกคนในบ้านช่วยกันดูแลสัตว์เลี้ยงได้ง่ายขึ้น<br className="public-desktop-break"/> จัดกิจวัตร แบ่งหน้าที่ และเก็บเรื่องสำคัญ<br className="public-desktop-break"/>ไว้ในพื้นที่เดียวกัน</p><div className="public-hero-actions"><button type="button" className="button primary" onClick={onStart}>เริ่มต้นใช้งาน <Icon name="chevron" size={18}/></button><a href="#features">รู้จัก PetRoutine <span aria-hidden="true">↓</span></a></div><small><Icon name="check" size={15}/>สำหรับสุนัขและแมว · ใช้ได้ทั้งมือถือและคอมพิวเตอร์</small></div><HeroCareScene/></section>
      <CareDayStory/>
      <section id="features" className="landing-features"><div className="landing-section-heading"><BrandDoodle kind="sprout" className="public-feature-sprout"/><span className="public-eyebrow">A LITTLE CARE, EVERY DAY</span><h2>การดูแลที่ดี<br className="public-mobile-break"/> เริ่มจากเข้าใจตรงกัน</h2><p>จากงานเล็ก ๆ ในแต่ละวัน ถึงข้อมูลที่อยากเก็บไว้ให้ครบ</p></div><div className="landing-feature-grid">{features.map(feature => <article key={feature.number}><div className="public-feature-top"><span><Icon name={feature.icon} size={24}/></span><small>{feature.number}</small></div><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</div></section>
      <section id="faq" className="landing-faq"><div className="public-faq-intro"><span className="public-eyebrow">GOOD TO KNOW</span><h2>ก่อนเริ่มดูแล<br/>ไปด้วยกัน</h2><p>คำตอบสั้น ๆ<br/>เพื่อให้เริ่มใช้งานได้สบายใจ</p></div><div className="public-faq-list"><details><summary>ใช้กับสัตว์เลี้ยงประเภทไหน?</summary><p>ขณะนี้รองรับสุนัขและแมว เพิ่มสัตว์เลี้ยงและจัดตารางการดูแลแยกตามแต่ละตัวได้</p></details><details><summary>ต้องติดตั้งแอปในโทรศัพท์ไหม?</summary><p>ไม่ต้อง PetRoutine เป็นเว็บไซต์ที่ใช้ได้ทั้งคอมพิวเตอร์และมือถือ ผ่านเว็บเบราว์เซอร์</p></details><details><summary>สมาชิกในบ้านช่วยดูแลร่วมกันได้อย่างไร?</summary><p>เจ้าของบ้านแชร์รหัสเชิญให้สมาชิกเข้าร่วมบ้านเดียวกัน เพื่อดูตาราง ผู้รับผิดชอบ และประวัติการดูแลร่วมกัน</p></details><details><summary>ระบบส่งข้อความหรืออีเมลเตือนไหม?</summary><p>ปัจจุบันแจ้งเตือนภายในเว็บไซต์เมื่อเปิดใช้งาน ยังไม่ส่งอีเมลหรือ push notification</p></details></div></section>
      <section className="public-start-section"><div className="public-start-copy"><span className="public-eyebrow">SMALL ROUTINES. SHARED CARE.</span><h2>อีกหนึ่งวันดี ๆ<br/>ที่เราดูแลเขาไปด้วยกัน</h2><p>เริ่มจากสร้างบ้าน เพิ่มสัตว์เลี้ยง และกิจวัตรแรกของคุณ</p><button type="button" className="button primary" onClick={onStart}>เริ่มต้นใช้งาน <Icon name="chevron" size={18}/></button></div><CareSceneIllustration scene="routine" className="public-start-companions"/></section>
    </main>
    <footer className="landing-footer"><div className="public-footer-brand"><Logo/><p>ดูแลทุกวัน ไปด้วยกัน</p></div><span>สำหรับสุนัข แมว และคนที่รักเขา</span></footer>
  </div>;
}
