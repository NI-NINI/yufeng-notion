'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', icon: '◫', label: '總覽' },
  { href: '/cases',     icon: '≡', label: '案件管理' },
  { href: '/kanban',    icon: '⊞', label: '看板' },
  { href: '/workload',  icon: '◎', label: '負荷分析' },
  { href: '/bonus',     icon: '◈', label: '獎金試算' },
  { href: '/gifts',     icon: '◇', label: '節日送禮' },
  { href: '/payments',  icon: '◉', label: '付款管理' },
  { href: '/clients',   icon: '▣', label: '客戶管理' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <div className="sidebar">
      <div className="sb-hd">
        <div className="sb-mk">宇</div>
        <div>
          <div className="sb-tt">宇豐估價部</div>
          <div className="sb-sub">控案管理系統 v4</div>
        </div>
      </div>

      <nav className="sb-nv">
        <div className="sb-lb">工作區</div>
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`sb-it ${path.startsWith(item.href) ? 'active' : ''}`}
          >
            <span className="ic">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sb-ft">
        <div className="sb-usr">
          <div className="sb-av">宇</div>
          <div>
            <div className="sb-un">宇豐估價部</div>
            <div className="sb-ur">Notion Backend</div>
          </div>
        </div>
      </div>
    </div>
  )
}
