import CareIllustration from '../../components/CareIllustration.jsx';
import Icon from '../../components/Icon.jsx';

export default function HeroCareScene() {
  return <div className="home-care-scene">
    <div className="home-care-art"><span className="home-care-overline">LITTLE THINGS. LOTS OF LOVE.</span><span className="home-care-message">ทุกวันของเขา มีเราอยู่ด้วย</span><div className="home-care-note" aria-hidden="true"><svg viewBox="0 0 38 38" fill="none"><path d="M19 31C12 26 5 20 5 14c0-4 3-7 7-7 3 0 6 2 7 5 2-3 4-5 8-5 4 0 7 3 7 7 0 6-8 13-15 17Z" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="m11 18 4 3 9-9" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg><span>ใส่ใจทีละนิด<br/><strong>ทุกวันก็พิเศษขึ้น</strong></span></div><CareIllustration/></div>
    <div className="home-care-caption"><span><Icon name="users" size={20}/></span><div><strong>ดูแลได้ดีขึ้น เมื่อช่วยกัน</strong><p>หนึ่งบ้าน หนึ่งตาราง สำหรับทุกคนที่รักเขา</p></div></div>
  </div>;
}
