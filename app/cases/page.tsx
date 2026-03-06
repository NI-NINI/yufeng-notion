'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, X } from 'lucide-react';
import { Sidebar } from '../page';

const STATUS_OPTIONS = ['全部', '待處理', '進行中', '待審核', '已完成', '暫停'];
const TEAM_OPTIONS = ['全部', '妮組', '文組'];
const TYPE_OPTIONS = ['一般估價', '都更', '顧問', '訴訟'];
const PRIORITY_OPTIONS = ['高', '中', '低'];

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [teamFilter, setTeamFilter] = useState('全部');
  const [showModal, setShowModal] = useState(false);
  const [editCase, setEditCase] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetchCases = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== '全部') params.set('status', statusFilter);
    if (teamFilter !== '全部') params.set('team', teamFilter);
    fetch(`/api/cases?${params}`).then(r => r.json()).then(data => {
      setCases(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchCases(); }, [statusFilter, teamFilter]);

  const filtered = cases.filter(c =>
    !search || c.name.includes(search) || c.clientName.includes(search) || c.code.includes(search)
  );

  const openNew = () => {
    setEditCase({ name: '', code: '', clientName: '', type: '一般估價', address: '', team: '妮組', appraiser: '', status: '待處理', priority: '中', contractAmount: '', discountPct: '', assignDate: '', dueDate: '', nextDue: '', note: '' });
    setShowModal(true);
  };

  const openEdit = (c: any) => { setEditCase({ ...c }); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editCase.id) {
        await fetch(`/api/cases/${editCase.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCase) });
      } else {
        await fetch('/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCase) });
      }
      setShowModal(false);
      fetchCases();
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="cases" />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>案件管理</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>共 {filtered.length} 件</p>
          </div>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} />新增案件</button>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 36 }} placeholder="搜尋案件名稱、客戶、編號..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="input" style={{ width: 'auto' }} value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
            {TEAM_OPTIONS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>載入中...</div>
          : filtered.length === 0 ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>沒有符合條件的案件</div>
          : (
            <table>
              <thead><tr><th>案件編號</th><th>案件名稱</th><th>客戶</th><th>類型</th><th>團隊</th><th>狀態</th><th>優先</th><th>截止日期</th><th>操作</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.code}</td>
                    <td><Link href={`/cases/${c.id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>{c.name}</Link></td>
                    <td>{c.clientName}</td>
                    <td>{c.type}</td>
                    <td>{c.team}</td>
                    <td><span className={`badge status-${c.status}`}>{c.status}</span></td>
                    <td><span className={`badge priority-${c.priority}`}>{c.priority}</span></td>
                    <td style={{ fontSize: 13 }}>{c.dueDate}</td>
                    <td><button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(c)}>編輯</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {showModal && editCase && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editCase.id ? '編輯案件' : '新增案件'}</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div className="form-grid">
                {[
                  { label: '案件名稱 *', key: 'name', full: true },
                  { label: '案件編號', key: 'code' },
                  { label: '客戶名稱', key: 'clientName' },
                  { label: '地址', key: 'address', full: true },
                  { label: '負責估價師', key: 'appraiser' },
                  { label: '合約金額', key: 'contractAmount', type: 'number' },
                  { label: '折扣%', key: 'discountPct', type: 'number' },
                  { label: '指派日期', key: 'assignDate', type: 'date' },
                  { label: '截止日期', key: 'dueDate', type: 'date' },
                  { label: '下次追蹤', key: 'nextDue', type: 'date' },
                ].map(f => (
                  <div key={f.key} className={`form-group${f.full ? ' form-full' : ''}`}>
                    <label>{f.label}</label>
                    <input className="input" type={f.type || 'text'} value={editCase[f.key] || ''} onChange={e => setEditCase({ ...editCase, [f.key]: e.target.value })} />
                  </div>
                ))}
                {[
                  { label: '案件類型', key: 'type', options: TYPE_OPTIONS },
                  { label: '負責團隊', key: 'team', options: ['妮組', '文組'] },
                  { label: '狀態', key: 'status', options: STATUS_OPTIONS.slice(1) },
                  { label: '優先順序', key: 'priority', options: PRIORITY_OPTIONS },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label>{f.label}</label>
                    <select className="input" value={editCase[f.key] || ''} onChange={e => setEditCase({ ...editCase, [f.key]: e.target.value })}>
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div className="form-group form-full">
                  <label>備註</label>
                  <textarea className="input" rows={3} value={editCase.note || ''} onChange={e => setEditCase({ ...editCase, note: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>取消</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '儲存中...' : '儲存'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
