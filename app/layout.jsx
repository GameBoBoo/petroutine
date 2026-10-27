import './google-sans.css';
import './globals.css';
import './readability.css';
import './pet-workspace.css';
import './brand-fonts.css';
import './today-brand-preview.css';
import './landing-brand.css';
import './auth-brand.css';
import './brand-handdrawn.css';
import './system-brand.css';
import './today-dashboard.css';
import './calendar-dashboard.css';
import './pets-actions.css';
import './household-ux.css';
import './notification-ux.css';
import './dark-mode.css';
import './ai-care.css';
import ConfirmationProvider from '../components/ConfirmationProvider.jsx';

export const metadata = {
  title: 'PetRoutine',
  description: 'ผู้ช่วยจัดการกิจวัตรและการดูแลสุนัขและแมวในครอบครัว',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: "try{var saved=localStorage.getItem('pawroutine_theme');var theme=saved==='dark'||saved==='light'?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}catch(e){}" }} /></head>
      <body><ConfirmationProvider>{children}</ConfirmationProvider></body>
    </html>
  );
}
