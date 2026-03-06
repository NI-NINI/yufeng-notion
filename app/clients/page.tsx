'use client';
import { useEffect, useState } from 'react';
import { Plus, X, Phone, Mail, MapPin } from 'lucide-react';
import { Sidebar } from '../page';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetchClients = () => {
    setLoading(true);
    fetch('/api/clients').then(r => r.json()).then(data => {
      setClients(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter(c =>
    !search || c.name.includes(search) || c.contact?.includes(search) || c.phone?.includes(search)
  );

  const openNew = () => {
    setEditClient({ name: '', contact: '', phone: '', email: '', address: '', taxId: '', note: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editClient) });
      setShowModal(false);
      fetchClients();
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="clients" />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>客戶管理</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>共 {filtered.length} 位客戶</p>
          </div>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} />新增客戶</button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <input className="input" style={{ maxWidth: 320 }} placeholder="搜尋客戶名稱、聯絡人、電話..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>載入中...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(c => (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{c.name}</div>
                {c.contact && <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>聯絡人：{c.contact}</div>}
                {c.phone && <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}><Phone size={13} style={{ color: 'var(--text-muted)' }} />{c.phone}</div>}
                {c.email && <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}><Mail size={13} style={{ color: 'var(--text-muted)' }} />{c.email}</div>}
                {c.address && <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}><MapPin size={13} style={{ color: 'var(--text-muted)' }} />{c.address}</div>}
                {c.taxId && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>統編：{c.taxId}</div>}
                {c.note && <div style={{ fontSize: 13, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>{c.note}</div>}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>沒有符合條件的客戶</div>}
          </div>
        )}
        {showModal && editClient && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>新增客戶</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div className="form-grid">
                {[
                  { label: '客戶名稱 *', key: 'name', full: true },
                  { label: '聯絡人', key: 'contact' },
                  { label: '統一編號', key: 'taxId' },
                  { label: '電話', key: 'phone' },
                  { label: 'Email', key: 'email' },
                  { label: '地址', key: 'address', full: true },
                  { label: '備註', key: 'note', full: true, textarea: true },
                ].map(f => (
                  <div key={f.key} className={`form-group${f.full ? ' form-full' : ''}`}>
                    <label>{f.label}</label>
                    {f.textarea
                      ? <textarea className="input" rows={3} value={editClient[f.key] || ''} onChange={e => setEditClient({ ...editClient, [f.key]: e.target.value })} />
                      : <input className="input" value={editClient[f.key] || ''} onChange={e => setEditClient({ ...editClient, [f.key]: e.target.value })} />
                    }
                  </div>
                ))}
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
