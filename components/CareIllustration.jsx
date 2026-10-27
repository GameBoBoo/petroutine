// Cream silhouettes, small faces, organic curves and rounded hand-drawn plants.
export default function CareIllustration({ variant = 'together', className = '' }) {
  return <svg className={`care-illustration ${className}`} viewBox="0 0 480 360" fill="none" aria-hidden="true" focusable="false">
    <path className="care-art-ground" d="M48 326C25 210 45 25 182 12 320-12 437 28 437 165c1 60-3 113-14 160-123 16-248 17-375 1Z" fill="#F59E0B"/>
    <g className="care-art-plant" stroke="#FFFAF4" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M295 215c-13-48-5-93 22-136m-12 58c-34-8-51-30-45-58 26 5 43 25 43 48m6-31c-13-30-10-56 9-74 19 22 18 48-1 72m-17 58c28-36 57-42 79-28-17 25-43 34-75 35"/>
    </g>
    <path d="M174 329c-7-65 15-116 66-133 37-12 78 1 89 35 10 28 11 62 5 98Z" fill="#FFFAF4"/>
    <g stroke="#1F2937" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M238 202c-22-8-31 0-27 11 3 8 14 9 25 4m40-17c21-8 29 2 23 12-4 7-12 8-22 3"/>
      <path d="M233 202c-2-15 7-24 21-23 15 0 25 11 23 25-1 15-11 24-23 23-13-1-21-10-21-25Z" fill="#F8D8AF" stroke="none"/>
      <path d="M244 205c6 8 13 9 19 0"/>
      <circle cx="243" cy="196" r="2" fill="#1F2937" stroke="none"/><circle cx="265" cy="196" r="2" fill="#1F2937" stroke="none"/>
    </g>
    {variant === 'together' && <g stroke="#1F2937" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M91 329c-5-49 10-87 40-97 33-11 61 14 64 97Z" fill="#FFE6C0" stroke="none"/>
      <path d="m119 230 1-24c0-4 3-5 6-2l11 12c7-2 13-2 18 0l12-12c3-3 6-1 6 3l1 24c2 18-10 29-27 29-19 0-30-12-28-30Z" fill="#FFE6C0" stroke="none"/>
      <path d="M132 234c3 3 6 3 9 0m14 0c3 3 6 3 9 0m-23 10c4 4 8 4 12 0"/>
    </g>}
    <path d="M72 347c92 5 231 4 335-2" stroke="#A95300" strokeWidth="4" strokeLinecap="round"/>
  </svg>;
}
