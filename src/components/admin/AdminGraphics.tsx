/**
 * Go Travels branding for the Payload admin: the full logo on the login screen and the mark
 * in the navigation. Inline SVG with literal colours, because the admin doesn't load the site's
 * design tokens.
 */

function Mark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <rect width="64" height="64" rx="16" fill="#0B4F6C" />
      <path
        d="M42.7 23 A14 14 0 1 0 46 32 H34"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="16.5" r="5" fill="#F2A541" />
    </svg>
  )
}

export function AdminLogo() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Mark size={48} />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span style={{ fontWeight: 700, fontSize: 24 }}>
          <span style={{ color: '#0B4F6C' }}>Go</span> Travels
        </span>
        <span style={{ fontSize: 12, letterSpacing: '0.14em', color: '#5A6872' }}>ADMIN CMS</span>
      </span>
    </span>
  )
}

export function AdminIcon() {
  return <Mark size={28} />
}
