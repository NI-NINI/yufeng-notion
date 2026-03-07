'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard',   label: '儀表板' },
  { href: '/clients',     label: '客戶管理' },
  { href: '/cases',       label: '案件管理' },
  { href: '/workload',    label: '案件負荷統計' },
  { href: '/bonus',       label: '獎金配發' },
  { href: '/bonus-stats', label: '獎金統計' },
  { href: '/gifts',       label: '節日送禮' },
  { href: '/payments',    label: '付款管理' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <div className="sidebar">
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #2c2c2e' }}>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 4, letterSpacing: 1 }}>宇豐估價師事務所</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>控案管理系統</div>
        <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>v3.0</div>
      </div>
      <nav style={{ padding: '8px 0', flex: 1 }}>
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${path.startsWith(item.href) ? 'active' : ''}`}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div style={{ padding: '16px', borderTop: '1px solid #2c2c2e', fontSize: 11, color: '#333' }}>
        Notion Backend
      </div>
    </div>
  )
}
