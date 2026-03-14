'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', icon: '◫', label: '總覽' },
  // 客戶管理群組 — 用 group 標記
  { group: '客戶管理', items: [
    { href: '/clients', icon: '▣', label: '客戶資料' },
    { href: '/gifts',   icon: '◇', label: '送禮篩選' },
  ]},
  { href: '/cases',     icon: '≡', label: '案件管理' },
  { href: '/workload',  icon: '◑', label: '負荷分析' },
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
        {nav.map((item: any) => {
          if (item.group) {
            // 群組：大標題 + 子項目縮排
            const groupActive = item.items.some((sub: any) => path.startsWith(sub.href))
            return (
              <div key={item.group}>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: groupActive ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.35)',
                  letterSpacing: '.04em', padding: '8px 10px 3px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{fontSize:12, opacity:.7}}>▣</span>
                  {item.group}
                </div>
                {item.items.map((sub: any) => (
                  <Link key={sub.href} href={sub.href}
                    className={`sb-it ${path.startsWith(sub.href) ? 'active' : ''}`}
                    style={{paddingLeft: 24, fontSize: 12}}>
                    <span style={{opacity:.5, marginRight:2, fontSize:11}}>{sub.icon}</span>
                    <span>{sub.label}</span>
                  </Link>
                ))}
              </div>
            )
          }
          return (
            <Link key={item.href} href={item.href}
              className={`sb-it ${path.startsWith(item.href) ? 'active' : ''}`}>
              <span style={{opacity:.6, marginRight:2, fontSize:12}}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
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
