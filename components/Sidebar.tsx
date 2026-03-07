'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', icon: '📊', label: '儀表板' },
  { href: '/cases', icon: '📋', label: '案件管理' },
  { href: '/kanban', icon: '🗂', label: '看板' },
  { href: '/workload', icon: '⚖️', label: '負荷分析' },
  { href: '/stuck', icon: '🔴', label: '擱淺追蹤' },
  { href: '/bonus', icon: '💰', label: '獎金試算' },
  { href: '/clients', icon: '🏢', label: '客戶管理' },
  { href: '/payments', icon: '🧾', label: '付款管理' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <div className="sidebar">
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #2c2c2e' }}>
        <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>宇豐估價師事務所</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>控案管理系統</div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>v2.0</div>
      </div>
      <nav style={{ padding: '8px 0', flex: 1 }}>
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${path.startsWith(item.href) ? 'active' : ''}`}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div style={{ padding: '16px', borderTop: '1px solid #2c2c2e', fontSize: 11, color: '#444' }}>
        Notion Backend
      </div>
    </div>
  )
}
