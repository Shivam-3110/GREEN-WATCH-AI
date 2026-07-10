import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '../../services/apiClient'

export default function MrGreenChat({ aqiData }) {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [typing, setTyping]   = useState(false)
  const [history, setHistory] = useState([])
  const [messages, setMessages] = useState([
    { role: 'ai', content: '👋 Hi! I\'m Mr. Green, your environmental AI assistant. Ask me anything about air quality, pollution, or how to protect your health and the planet!' },
  ])
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim() || typing) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setTyping(true)

    // Append live AQI context if available
    const contextMsg = aqiData
      ? `[Current AQI: ${aqiData.aqi}, PM2.5: ${aqiData.pm25}, PM10: ${aqiData.pm10}, NO2: ${aqiData.no2}, O3: ${aqiData.o3}, Status: ${aqiData.status}] ${userMsg}`
      : userMsg

    try {
      const res = await apiClient.post('/assistant/chat', {
        message: contextMsg,
        conversationHistory: history,
      })
      const reply = res.data.data.response
      setMessages(prev => [...prev, { role: 'ai', content: reply }])
      setHistory(prev => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: '🌿 Sorry, I\'m having trouble connecting. Please make sure the backend is running.' }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 sm:w-96 rounded-2xl border border-emerald-400/20 bg-[#060f0a]/95 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col overflow-hidden"
            style={{ height: '480px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-emerald-400/15 bg-emerald-950/40 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg shadow-lg">
                🌿
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-300">Mr. Green</p>
                <p className="text-xs text-slate-400">Environmental AI Assistant</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600/80 text-white'
                      : 'bg-white/[0.06] border border-white/10 text-slate-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 flex gap-1">
                    {[0,1,2].map(i => (
                      <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-emerald-400 block"
                        animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} className="border-t border-emerald-400/15 px-3 py-3 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about pollution, AQI..."
                className="flex-1 rounded-full bg-white/[0.06] border border-white/10 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-400/40"
              />
              <button type="submit" disabled={!input.trim() || typing}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white disabled:opacity-40 hover:bg-emerald-400 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-[0_8px_32px_rgba(52,211,153,0.4)] text-2xl"
      >
        {open ? '✕' : '🌿'}
      </motion.button>
    </div>
  )
}
