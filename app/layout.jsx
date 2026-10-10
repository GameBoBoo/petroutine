import './globals.css';

export const metadata = {
  title: 'PawRoutine',
  description: 'ผู้ช่วยจัดการกิจวัตรและการดูแลสุนัขและแมวในครอบครัว',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
