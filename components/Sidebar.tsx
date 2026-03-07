'use client';
import Link from 'next/link';
import { FileText, Users, TrendingUp } from 'lucide-react';

export function Sidebar({ active }: { active: string }) {
  const links = [
    { href: '/', label: '總覽', icon: TrendingUp, key: 'home' },
    { href: '/cases', label: '案件管理', icon: FileText, key: 'cases' },
    { href: '/clients', label: '客戶管理', icon: Users, key: 'clients' },
  ];
  return (
    <aside className="sidebar">
      <div style={{ padding: '0 20px', marginBottom: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>宇豐</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>不動產估價師事務所</div>
      </div>
      <nav style={{ flex: 1 }}>
        {links.map(l => (
          <Link key={l.key} href={l.href} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 20px', fontSize: 14, fontWeight: 500,
            color: active === l.key ? 'white' : '#888',
            background: active === l.key ? 'rgba(255,255,255,0.1)' : 'transparent',
            textDecoration: 'none', transition: 'all 0.15s',
            borderLeft: active === l.key ? '2px solid var(--accent)' : '2px solid transparent',
          }}>
            <l.icon size={16} />{l.label}
          </Link>
        ))}
      </nav>
      <div style={{ padding: '0 20px', fontSize: 12, color: '#444' }}>Powered by Notion API</div>
    </aside>
  );
}
