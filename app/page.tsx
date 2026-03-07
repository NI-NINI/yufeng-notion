'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function Home() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(data => {
      setCases(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = {
    total: cases.length,
    inProgress: cases.filter(c => c.status === '進行中').length,
    pending: cases.filter(c => c.status === '待處理').length,
    done: cases.filter(c => c.status === '已完成').length,
  };

  const urgent = cases.filter(c => {
    if (!c.dueDate) return false;
    const days = Math.ceil((new Date(c.dueDate).getTime() - Date.now()) / 86400000);
    return days <= 7 && days >= 0 && c.status !== '已完成';
  }).slice(0, 5);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="home" />
      <main className="main-content">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>宇豐案件系統</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: '總案件數', value: stats.total, icon: FileText, color: 'var(--accent)' },
            { label: '進行中', value: stats.inProgress, icon: TrendingUp, color: 'var(--warning)' },
            { label: '待處理', value: stats.pending, icon: Clock, color: 'var(--info)' },
            { label: '已完成', value: stats.done, icon: CheckCircle, color: 'var(--success)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={22} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{loading ? '...' : s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>即將到期（7天內）</h2>
          </div>
          {loading ? <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>載入中...</p>
          : urgent.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>目前沒有即將到期的案件 🎉</p>
          : (
            <table>
              <thead><tr><th>案件名稱</th><th>客戶</th><th>負責人</th><th>截止日期</th><th>狀態</th></tr></thead>
              <tbody>
                {urgent.map(c => (
                  <tr key={c.id}>
                    <td><Link href={`/cases/${c.id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>{c.name}</Link></td>
                    <td>{c.clientName}</td>
                    <td>{c.appraiser}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 500 }}>{c.dueDate}</td>
                    <td><span className={`badge status-${c.status}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
