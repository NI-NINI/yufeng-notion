'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Client_ } from '@/lib/notion'

const HOLIDAYS = ['春節', '端午', '中秋', '年節']
const HOLIDAY_DATES: Record<string, string> = {
  '春節': '農曆年前兩週', '端午': '6月初', '中秋': '9月中旬', '年節': '12月底'
}

interface GiftRecord {
  clientId: string
  holiday: string
  year: string
  gifted: boolean
  note: string
}

export default function GiftsPage() {
  const [clients, setClients] = useState<Client_[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHoliday, setSelectedHoliday] = useState('春節')
  const [selectedYear, setSelectedYear] = useState(`${new Date().getFullYear()}`)
  const [records, setRecords] = useState<Record<string, GiftRecord>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => {
      setClients(d)
      setLoading(false)
    })
  }, [])

  const giftTargets = clients.filter(c =>
    c.isGiftTarget && (!search || c.name.includes(search))
  )

  const getKey = (clientId: string) => `${clientId}_${selectedHoliday}_${selectedYear}`

  const toggleGifted = (clientId: string) => {
    const key = getKey(clientId)
    setRecords(prev => ({
      ...prev,
      [key]: { clientId, holiday: selectedHoliday, year: selectedYear, gifted: !prev[key]?.gifted, note: prev[key]?.note ?? '' }
    }))
  }

  const setNote = (clientId: string, note: string) => {
    const key = getKey(clientId)
    setRecords(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? { clientId, holiday: selectedHoliday, year: selectedYear, gifted: false }), note }
    }))
  }

  const giftedCount = giftTargets.filter(c => records[getKey(c.id)]?.gifted).length

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>節日送禮</h1>
          <div style={{ fontSize: 13, color: '#888' }}>僅顯示勾選「送禮對象」的客戶</div>
        </div>

        {/* 節日選擇 */}
        <div className="card" style={{ marginBottom: 16, padding: '16px' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label className="label">節日</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {HOLIDAYS.map(h => (
                  <button key={h} onClick={() => setSelectedHoliday(h)}
                    style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid', fontSize: 13, cursor: 'pointer', fontWeight: selectedHoliday === h ? 700 : 400, background: selectedHoliday === h ? '#1c1c1e' : '#fff', color: selectedHoliday === h ? '#fff' : '#555', borderColor: selectedHoliday === h ? '#1c1c1e' : '#ddd' }}>
                    {h}
                  </button>
                ))}
              </div>
              {HOLIDAY_DATES[selectedHoliday] && <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>時間參考：{HOLIDAY_DATES[selectedHoliday]}</div>}
            </div>
            <div>
              <label className="label">年份</label>
              <select className="select" style={{ width: 100 }} value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                {['2024','2025','2026','2027'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#888' }}>送禮對象</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{giftedCount} / {giftTargets.length} <span style={{ fontSize: 13, color: '#888', fontWeight: 400 }}>已完成</span></div>
              <div style={{ background: '#f0f0f0', borderRadius: 4, height: 6, width: 120, marginTop: 4 }}>
                <div style={{ background: '#22c55e', width: giftTargets.length > 0 ? `${(giftedCount/giftTargets.length)*100}%` : '0', height: '100%', borderRadius: 4 }} />
              </div>
            </div>
            <input className="input" style={{ width: 180 }} placeholder="搜尋客戶名稱" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="card">
          {loading ? <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>載入中…</div> : giftTargets.length === 0 ? (
            <div style={{ color: '#aaa', padding: 40, textAlign: 'center' }}>尚無送禮對象，請至客戶管理勾選「送禮對象」</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>已送出</th><th>委託單位</th><th>統一編號</th><th>類型</th>
                  <th>聯絡窗口</th><th>電話</th><th>備註（禮品記錄）</th>
                </tr></thead>
                <tbody>
                  {giftTargets.map(c => {
                    const rec = records[getKey(c.id)]
                    return (
                      <tr key={c.id} style={{ background: rec?.gifted ? '#f0fdf4' : undefined }}>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={rec?.gifted ?? false} onChange={() => toggleGifted(c.id)}
                            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#22c55e' }} />
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          {rec?.gifted && <div style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>已送出</div>}
                        </td>
                        <td style={{ fontSize: 12, color: '#666' }}>{c.taxId || '—'}</td>
                        <td>{c.clientType ? <span className="badge" style={{ background: '#f0f0f0', color: '#555' }}>{c.clientType}</span> : '—'}</td>
                        <td style={{ fontSize: 12 }}>{c.contact1Name || '—'}</td>
                        <td style={{ fontSize: 12 }}>{c.contact1Phone || c.phone || '—'}</td>
                        <td>
                          <input className="input" style={{ fontSize: 12 }} value={rec?.note ?? ''} onChange={e => setNote(c.id, e.target.value)} placeholder="記錄禮品內容…" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
