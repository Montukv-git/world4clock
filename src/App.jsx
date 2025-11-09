import React, { useEffect, useRef, useState } from 'react'

const clocks = [
  { id: 'newyork', label: 'New York', tz: 'America/New_York' },
  { id: 'london', label: 'London', tz: 'Europe/London' },
  { id: 'tokyo', label: 'Tokyo', tz: 'Asia/Tokyo' },
  { id: 'kolkata', label: 'Kolkata', tz: 'Asia/Kolkata' },
]

// Lightweight fetch-with-timeout helper
async function fetchWithTimeout(url, ms = 5000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return res
  } finally {
    clearTimeout(id)
  }
}

export default function App() {
  const [now, setNow] = useState(() => new Date())
  const [is24h, setIs24h] = useState(true)
  const [synced, setSynced] = useState(false)
  const [syncMessage, setSyncMessage] = useState('Syncing...')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    async function fetchTime() {
      const attempts = [
        {
          name: 'WorldTimeAPI (UTC)',
          url: 'https://worldtimeapi.org/api/timezone/Etc/UTC',
          parse: async (res) => {
            const json = await res.json()
            return new Date(json.utc_datetime)
          },
        },
        {
          name: 'TimeAPI.io (UTC)',
          url: 'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
          parse: async (res) => {
            const json = await res.json()
            if (json && json.dateTime) return new Date(json.dateTime)
            if (json && json.currentLocalTime) return new Date(json.currentLocalTime)
            throw new Error('Unexpected response shape')
          },
        },
      ]

      let lastErr = null
      for (const a of attempts) {
        try {
          setSyncMessage(`Trying ${a.name}...`)
          const res = await fetchWithTimeout(a.url, 6000)
          if (!res || !res.ok) throw new Error(`HTTP ${res ? res.status : 'NO_RESPONSE'}`)
          const dt = await a.parse(res)
          if (!dt || Number.isNaN(dt.getTime())) throw new Error('Invalid date parsed')
          if (!mountedRef.current) return
          setNow(dt)
          setSynced(true)
          setSyncMessage(`Synced via ${a.name}`)
          return
        } catch (err) {
          console.error(`Failed ${a.name}:`, err)
          lastErr = err
        }
      }
      console.error('All time fetch attempts failed:', lastErr)
      setSynced(false)
      setSyncMessage('Not synced (using local clock)')
      setNow(new Date())
    }

    fetchTime()

    const t = setInterval(() => {
      setNow(prev => {
        const prevMs = prev instanceof Date ? prev.getTime() : Date.now()
        return new Date(prevMs + 1000)
      })
    }, 1000)

    return () => {
      mountedRef.current = false
      clearInterval(t)
    }
  }, [])

  function formatTime(date, tz) {
    try {
      const opts = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !is24h,
        timeZone: tz,
      }
      return new Intl.DateTimeFormat(undefined, opts).format(date)
    } catch (e) {
      return '--:--:--'
    }
  }

  function formatDate(date, tz) {
    try {
      const opts = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: tz,
      }
      return new Intl.DateTimeFormat(undefined, opts).format(date)
    } catch (e) {
      return ''
    }
  }

  return (
    <div className="app-root">
      <header className="header">
        <div className="brand">
          <div className="logo">⏱️</div>
          <div>
            <h1>Four Timezones — Digital Watch</h1>
            <p className="muted">Modern · Classic · Black theme</p>
          </div>
        </div>
        <div>
          <button className="btn" onClick={() => setIs24h(v => !v)}>
            {is24h ? '24-hour' : '12-hour'}
          </button>
        </div>
      </header>

      <main className="grid">
        {clocks.map(c => (
          <section key={c.id} className="card" aria-label={`Clock for ${c.label}`}>
            <div className="card-top">
              <div>
                <div className="label">{c.label}</div>
                <div className="tz">{c.tz}</div>
              </div>
              <div className="date-small">{formatDate(now, c.tz)}</div>
            </div>

            <div className="card-body">
              <div className="time-big">{formatTime(now, c.tz)}</div>
              <div className="date-big">{formatDate(now, c.tz)}</div>
              <div className="muted">Digital — Modern & Classic</div>
            </div>
          </section>
        ))}
      </main>

      <footer className="footer">
        <div className="footer-left">
          <span>{syncMessage}</span>
          {!synced && <span className="unsynced">Unsynced</span>}
        </div>
        <div className="footer-right">
          <span className="powered">Powered by <strong>MKVTech © 2025</strong></span>
        </div>
      </footer>

    </div>
  )
}
