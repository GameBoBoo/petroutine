export default function BrandLogo({ className = '' }) {
  return <span className={`brand-logo ${className}`.trim()} role="img" aria-label="PetRoutine — Care, together">
    <svg className="brand-logo-symbol" viewBox="0 0 160 116" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 70c0-24 13-43 31-43 13 0 20 9 27 22 7-13 14-22 27-22 18 0 31 19 31 43" stroke="#F59E0B" strokeWidth="6"/>
      <path d="M27 70c0 18 10 29 25 29 11 0 20-6 26-16 6 10 15 16 26 16 15 0 25-11 25-29" stroke="#1F2937" strokeWidth="6"/>
      <path d="M46 61c4 3 8 3 12 0m25 0c4 3 8 3 12 0" stroke="#1F2937" strokeWidth="3.5"/>
      <path d="M68 78c3-2 6-2 9 0" stroke="#F59E0B" strokeWidth="3.5"/>
      <circle cx="51" cy="54" r="2.3" fill="#1F2937"/><circle cx="86" cy="54" r="2.3" fill="#1F2937"/>
    </svg>
    <span className="brand-logo-type"><span className="brand-logo-name">Pet<span>Routine</span></span><span className="brand-logo-tagline">CARE, TOGETHER</span></span>
  </span>;
}
