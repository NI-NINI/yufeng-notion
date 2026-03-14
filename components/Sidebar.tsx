'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', icon: '◫', label: '總覽' },
  { href: '/clients',   icon: '▣', label: '客戶管理' },
  { href: '/cases',     icon: '≡', label: '案件管理' },
  { href: '/bonus',     icon: '◈', label: '獎金配發' },

  { href: '/payments',  icon: '◉', label: '付款管理' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <div className="sidebar">
      <div className="sb-hd">
        <div className="sb-logo">宇</div>
        <div>
          <div className="sb-name">宇豐估價部</div>
          <div className="sb-ver">控案系統 v5.0</div>
        </div>
      </div>
      <nav className="sb-nv">
        <div className="sb-lb">工作區</div>
        {nav.map(item => (
          <Link key={item.href} href={item.href}
            className={`sb-it ${path.startsWith(item.href) ? 'active' : ''}`}>
            <span style={{opacity:.6,marginRight:2,fontSize:12}}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sb-ft">
        <div className="sb-user">
          <div className="sb-av">妮</div>
          <div>
            <div className="sb-uname">慈妮（組長）</div>
            <div className="sb-urole">妮組</div>
          </div>
        </div>
      </div>
    </div>
  )
}
