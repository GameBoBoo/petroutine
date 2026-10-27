// Distinct scenes share stroke weight and palette, never the same composition.
export default function CareSceneIllustration({ scene, className = '' }) {
  const props = { className: `care-illustration ${className}`, viewBox: '0 0 480 360', fill: 'none', 'aria-hidden': true, focusable: 'false' };
  if (scene === 'routine') return <svg {...props}>
    <path d="M77 291c-37-59-9-169 77-201 97-35 213 5 246 88 18 46 10 97-13 125-98 22-215 17-310-12Z" fill="#F8D8A1"/>
    <g stroke="#1F2937" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M141 73c49-6 115-3 160 1 10 1 15 7 15 18l-4 179c0 11-7 17-18 17l-151-3c-12 0-17-7-17-18l2-177c0-10 4-16 13-17Z" fill="#FFFAF4" stroke="none"/>
      <path d="M155 59v31m132-29-1 29M147 113c45-2 95-1 149 2" stroke="#A95300"/>
      <path d="m156 153 9 10 17-20m-26 57 9 10 17-20m-26 56 9 10 17-20" stroke="#A95300"/>
      <path d="M203 155c25-2 47-1 69 1m-69 45c27-1 47 0 68 1m-68 45 47 1" opacity=".7"/>
      <path d="M280 270c25-5 62-4 91 0l-10 37c-2 8-8 12-17 12l-37-1c-9 0-14-4-17-13Z" fill="#F59E0B" stroke="#A95300"/>
      <path d="M299 269c0-14 13-21 25-13 8-13 25-8 28 9M339 100c18-4 30-16 34-34m-23 5 23-5 4 23M91 333c86 4 191 4 291-1" stroke="#A95300"/>
    </g>
  </svg>;
  if (scene === 'welcome') return <svg {...props}>
    <path d="M69 272C40 197 73 86 163 51c88-36 193 9 226 91 21 52 18 100-8 139-101 20-210 14-312-9Z" fill="#F59E0B"/>
    <g strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M322 68c-18 28-8 48 18 52-29 13-58-4-57-28 0-13 12-25 39-24Z" stroke="#FFFAF4"/>
      <path d="M128 280c-42-2-57 20-38 38 16 15 208 22 257 1 30-13 14-35-25-38-63-6-133-6-194-1Z" fill="#EFCB98"/>
      <path d="M152 276c-17-30-7-72 31-87 38-15 95-1 110 37 9 23 3 43-13 55Z" fill="#FFFAF4"/>
      <path d="m126 241-2-34c0-6 4-8 8-3l17 17c10-4 21-4 30-1l17-20c4-4 8-3 9 3l3 36c2 23-15 37-40 37-25 0-41-13-42-35Z" fill="#FFFAF4"/>
      <path d="M141 242c5 5 10 5 15 0m20 0c5 5 10 5 15-1m-32 12c5 5 10 5 15 0" stroke="#1F2937" strokeWidth="3.5"/>
      <path d="M276 221c25-7 43 3 42 22-1 24-26 30-54 23" stroke="#FFFAF4" strokeWidth="16"/>
      <path d="m218 135 14-1-14 17 16-1m10-43 20-1-19 23 21-1" stroke="#FFFAF4"/>
      <path d="M118 343c69 2 154 2 228-2" stroke="#A95300"/>
    </g>
  </svg>;
  return <svg {...props}>
    <path d="M77 292c-25-67-6-166 52-202 76-47 185-34 245 39 43 52 44 119 15 172-96 15-214 10-312-9Z" fill="#FFE5B9"/>
    <g strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m113 170 118-102c9-8 17-8 27 0l119 102" stroke="#A95300"/>
      <path d="M138 155v148c67 6 139 6 207-1l-3-145-101-84Z" fill="#F59E0B"/>
      <path d="M209 305v-79c0-40 65-41 65 0v79" fill="#FFFAF4"/>
      <path d="M240 151c-27-29-48 6 0 31 48-28 27-59 0-31Z" fill="#FFFAF4"/>
      <path d="M164 209h23v27h-23Zm132 0h23v27h-23Z" stroke="#FFFAF4"/>
      <path d="M96 300c-7-28-5-51 5-75m-4 33c-22-4-30-15-27-31 18 3 27 13 27 31m2 19c22-18 39-17 48-4-13 11-28 14-46 10" stroke="#A95300"/>
      <path d="M347 93c15-9 29-7 37 2m-23-26 6-16m32 58 17-1M95 331c83 7 188 5 292-1" stroke="#A95300"/>
    </g>
  </svg>;
}
