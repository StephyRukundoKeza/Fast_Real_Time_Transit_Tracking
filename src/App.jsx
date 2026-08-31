import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [phone, setPhone] = useState('+1234567890') // your test number
  const [token, setToken] = useState('')
  const [step, setStep] = useState('phone') // 'phone' | 'otp' | 'logged_in'
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        setStep('logged_in')
      }
    })
  }, [])

  // 1. Send OTP (Simulated for test numbers!)
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setMessage('Sending code...')
    const { error } = await supabase.auth.signInWithOtp({ phone })

    if (error) {
      setMessage(`❌ Error: ${error.message}`)
    } else {
      setMessage('✅ Code sent! Enter your test OTP.')
      setStep('otp')
    }
  }

  // 2. Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setMessage('Verifying code...')
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })

    if (error) {
      setMessage(`❌ Verification failed: ${error.message}`)
    } else {
      setUser(data.user)
      setStep('logged_in')
      setMessage('🎉 Successfully logged in!')
    }
  }

  // 3. Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setStep('phone')
    setToken('')
    setMessage('Logged out.')
  }

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 24, border: '1px solid #333', borderRadius: 12, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>🚌 Transit Tracker Auth</h2>

      {message && <p style={{ fontSize: 14, color: '#4ade80' }}>{message}</p>}

      {step === 'phone' && (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ textAlign: 'left', fontSize: 12 }}>Phone Number:</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1234567890"
            style={{ padding: 10, borderRadius: 6, border: '1px solid #555' }}
            required
          />
          <button type="submit" style={{ padding: 10, borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Send OTP Code
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ textAlign: 'left', fontSize: 12 }}>Enter OTP Code (e.g. 123456):</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456"
            style={{ padding: 10, borderRadius: 6, border: '1px solid #555' }}
            required
          />
          <button type="submit" style={{ padding: 10, borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Verify & Log In
          </button>
        </form>
      )}

      {step === 'logged_in' && (
        <div>
          <p>Logged in as:</p>
          <code style={{ background: '#222', padding: 6, borderRadius: 4, display: 'block', wordBreak: 'break-all' }}>
            {user?.phone || user?.id}
          </code>
          <button onClick={handleLogout} style={{ marginTop: 16, padding: 8, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

export default App