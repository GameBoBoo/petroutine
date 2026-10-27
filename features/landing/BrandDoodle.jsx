// Decorative SVG linework inspired by the logo's rounded dog/cat curves.
export default function BrandDoodle({ kind = 'sparkle', className = '' }) {
  const common = { className: `brand-doodle ${className}`, fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' };
  if (kind === 'companions') return <svg {...common} viewBox="0 0 300 260">
    <path className="doodle-plant" d="M211 155c-1-25 2-47 13-69m-8 37c-25-8-35-24-32-43 18 2 33 13 34 32m4-16c-5-24 1-43 16-54 12 20 7 39-8 55m-10 33c17-22 37-28 55-20-8 18-26 25-51 24"/>
    <path className="doodle-body" d="M30 249c-2-46 11-74 41-83 20-6 37 3 46 24 11-32 35-47 63-38 32 10 43 44 39 97Z" stroke="none"/>
    <path className="doodle-body" d="M62 158c-13-5-21-19-17-36l10-35c3-8 10-7 15 1l14 24c10-4 22-4 33 0l16-26c5-8 12-7 14 3l8 35c4 18-4 30-15 35-23 14-54 14-78-1Z" stroke="none"/>
    <path className="doodle-body" d="M161 172c-17-7-24-22-19-40l10-32c3-9 10-11 18-7l29 15c17 8 23 24 17 42-8 24-32 32-55 22Z" stroke="none"/>
    <path d="m54 119 7-24 15 22m51 0 13-22 6 27M65 142c4 3 8 3 12-1m38 0c4 3 8 3 12-1m-39 11c5 6 11 6 16-1"/>
    <path d="M155 123c-17-5-23 5-17 14 3 5 9 5 14 2m51-21c17-2 22 9 15 17-3 4-9 4-14 0m-40 11c5 7 13 8 20 1"/>
    <circle cx="166" cy="133" r="2" fill="currentColor" stroke="none"/><circle cx="191" cy="132" r="2" fill="currentColor" stroke="none"/>
    <path className="doodle-blush" d="m62 151 8 1m51-1 8-1m25-7 7 2m35 0 6-1"/>
    <path d="M86 213c-3 12-3 24-2 36m78-41c-1 16 1 29 5 41" opacity=".25"/>
  </svg>;
  if (kind === 'sprout') return <svg {...common} viewBox="0 0 110 120"><path d="M52 108c-1-30 4-54 20-78m-12 42C31 69 16 51 21 30c23 3 40 20 40 36m8-28C60 21 65 9 76 3c12 13 10 27-3 39m-14 42c17-25 34-29 47-19-9 17-26 24-47 22"/></svg>;
  if (kind === 'underline') return <svg {...common} viewBox="0 0 240 18" preserveAspectRatio="none"><path d="M4 11c58-9 149-9 229-2M31 16c58-5 117-4 160-1"/></svg>;
  if (kind === 'trail') return <svg {...common} viewBox="0 0 130 100"><path d="M4 78c34 19 78 7 81-21 3-25-29-37-39-20-13 23 29 31 54 12 14-11 20-24 21-43" strokeDasharray="4 8"/><path d="m111 15 11-10 5 14"/></svg>;
  return <svg {...common} viewBox="0 0 56 60"><path d="M28 5c-1 18-6 23-22 25 17 0 22 7 23 25 1-18 5-23 21-26C34 29 29 22 28 5Z"/></svg>;
}
