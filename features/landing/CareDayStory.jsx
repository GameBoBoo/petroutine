import Icon from '../../components/Icon.jsx';

const moments = [
  { time: '08:00', icon: 'check', title: 'เริ่มวันด้วยมื้อเช้า', detail: 'บันทึกไว้ว่าใครดูแลแล้ว' },
  { time: 'ระหว่างวัน', icon: 'users', title: 'แบ่งหน้าที่กันในบ้าน', detail: 'ทุกคนเห็นตารางเดียวกัน' },
  { time: '17:30', icon: 'calendar', title: 'ไม่พลาดเวลาเดินเล่น', detail: 'เห็นงานต่อไปได้ทันที' },
];

export default function CareDayStory() {
  return <section className="public-day-story" aria-labelledby="public-day-story-title">
    <div className="public-day-story-heading">
      <span className="public-eyebrow">ONE DAY, A LOT OF CARE</span>
      <h2 id="public-day-story-title">วันหนึ่งของเรา <span>ดูแลกันได้แบบนี้</span></h2>
      <p>ตัวอย่างกิจวัตรเล็ก ๆ ที่ทุกคนช่วยกันได้</p>
    </div>
    <div className="public-day-moments">
      {moments.map(moment => <div className="public-day-moment" key={moment.time}>
        <span className="public-day-icon"><Icon name={moment.icon} size={20}/></span>
        <div><small>{moment.time}</small><strong>{moment.title}</strong><p>{moment.detail}</p></div>
      </div>)}
    </div>
  </section>;
}
