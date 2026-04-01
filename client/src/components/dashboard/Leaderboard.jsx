import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

const BADGE_BG = {
  '🥇': 'linear-gradient(135deg,#FFD700,#FF922B)',
  '🥈': 'linear-gradient(135deg,#C0C0C0,#9CA3AF)',
  '🥉': 'linear-gradient(135deg,#CD7F32,#B45309)',
  '🌟': 'linear-gradient(135deg,#F59E0B,#FDE68A)',
  '💜': 'linear-gradient(135deg,#8B5CF6,#C4B5FD)',
  '⭐': 'linear-gradient(135deg,#6366F1,#A5B4FC)',
};

function RankRow({ entry, index, isTeacherView, onEmailChange }) {
  const bg = BADGE_BG[entry.badge] || BADGE_BG['⭐'];
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', bounce: 0.25 }}
      className="flex items-center gap-4 rounded-2xl p-4"
      style={{
        background: index === 0 ? 'linear-gradient(135deg,#FEF3C7,#FDE68A)' : index === 1 ? '#F9FAFB' : index === 2 ? '#FFF7ED' : 'white',
        border: `2px solid ${index === 0 ? '#F59E0B44' : '#F3F4F6'}`,
      }}
    >
      {/* Rank badge */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
        style={{ background: bg }}>
        {entry.badge}
      </div>

      {/* Name + title */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-black text-gray-800 text-base truncate">{entry.name}</p>
        <p className="font-display text-gray-500 text-xs">{entry.title}</p>
        {isTeacherView && (
          <input
            type="email"
            placeholder="Parent email (optional)"
            defaultValue={entry.parentEmail || ''}
            onChange={(e) => onEmailChange && onEmailChange(entry.name, e.target.value)}
            className="mt-1.5 w-full text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-indigo-400"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="font-display font-black text-amber-500 text-lg leading-none">{entry.stars}</div>
            <div className="text-gray-400 text-xs">⭐</div>
          </div>
          <div className="text-center">
            <div className="font-display font-black text-indigo-500 text-lg leading-none">{entry.bravePoints}</div>
            <div className="text-gray-400 text-xs">💜</div>
          </div>
        </div>
        <div className="font-display font-bold text-gray-400 text-xs">#{entry.rank}</div>
      </div>
    </motion.div>
  );
}

export default function Leaderboard({ sessionCode, onClose, teacherName }) {
  const [leaderboard, setLeaderboard]   = useState(null);
  const [loading, setLoading]           = useState(false);
  const [emailMap, setEmailMap]         = useState({});    // name -> email overrides
  const [emailMode, setEmailMode]       = useState(false);
  const [smtpUser, setSmtpUser]         = useState('');
  const [smtpPass, setSmtpPass]         = useState('');
  const [sending, setSending]           = useState(false);
  const [sendResult, setSendResult]     = useState(null);
  const [error, setError]               = useState(null);

  // Fetch leaderboard from server
  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${SERVER_URL}/api/session/${sessionCode}/leaderboard`);
      const data = await res.json();
      setLeaderboard(data.leaderboard);
    } catch {
      setError('Could not load leaderboard. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  // On first open, auto-fetch
  if (!leaderboard && !loading && !error) fetchLeaderboard();

  const handleEmailChange = (name, email) => {
    setEmailMap((prev) => ({ ...prev, [name]: email }));
  };

  const handleSendEmails = async () => {
    if (!smtpUser || !smtpPass) return;
    setSending(true);
    setSendResult(null);
    setError(null);

    // Merge email overrides back — POST to server (server has the children map)
    // First send email overrides
    for (const [name, email] of Object.entries(emailMap)) {
      if (email) {
        // find child socketId by name — we don't have it here; server matches by name
        await fetch(`${SERVER_URL}/api/session/${sessionCode}/update-parent-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childName: name, parentEmail: email }),
        }).catch(() => {});
      }
    }

    try {
      const res  = await fetch(`${SERVER_URL}/api/session/${sessionCode}/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpUser, smtpPass }),
      });
      const data = await res.json();
      setSendResult(data);
    } catch {
      setError('Failed to send emails. Check server connection.');
    } finally {
      setSending(false);
    }
  };

  // Download leaderboard as HTML file
  const downloadHTML = () => {
    if (!leaderboard) return;
    const rows = leaderboard.map((r) => `
      <tr>
        <td style="padding:12px 16px;font-size:22px;text-align:center">${r.badge}</td>
        <td style="padding:12px 16px;font-weight:700;color:#111">${r.name}</td>
        <td style="padding:12px 16px;text-align:center;font-weight:700;color:#F59E0B">${r.stars} ⭐</td>
        <td style="padding:12px 16px;text-align:center;font-weight:700;color:#8B5CF6">${r.bravePoints} 💜</td>
        <td style="padding:12px 16px;text-align:center;color:#6B7280">${r.title}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Leapboard Class Report</title>
      <style>body{font-family:sans-serif;background:#F8FAFF;padding:32px}
        h1{color:#6366F1}table{width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
        th{background:#F9FAFB;padding:12px 16px;text-align:left;color:#6B7280;font-size:12px;text-transform:uppercase}
        tr:nth-child(even){background:#F9FAFB}
      </style></head><body>
      <h1>🚀 Leapboard — Class Report</h1>
      <p>Teacher: ${teacherName} | Code: ${sessionCode} | ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th></th><th>Name</th><th>Stars</th><th>Brave Points</th><th>Award</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="color:#9CA3AF;margin-top:24px;font-size:13px">Generated by Leapboard 🚀</p>
      </body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `leapboard-report-${sessionCode}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        initial={{ scale: 0.85, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 40, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.3 }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-black text-2xl text-gray-800">🏆 Class Leaderboard</h2>
              <p className="font-display text-gray-400 text-sm mt-0.5">Code: {sessionCode} · {new Date().toLocaleDateString('en-IN')}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors">✕</button>
          </div>

          {/* Note on scoring */}
          <div className="mt-3 bg-indigo-50 rounded-xl px-4 py-2.5 text-xs text-indigo-600 font-display leading-relaxed">
            ⭐ = individual stars earned · 💜 = brave points · broadcast awards count for everyone
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-2">
          {loading && (
            <div className="text-center py-12 text-gray-400 font-display">
              <div className="text-4xl mb-3 animate-spin">⭐</div>
              Loading results…
            </div>
          )}
          {error && <div className="text-center py-8 text-red-500 font-display text-sm">{error}</div>}

          {leaderboard && !emailMode && leaderboard.map((entry, i) => (
            <RankRow key={entry.name} entry={entry} index={i} isTeacherView={true} onEmailChange={handleEmailChange} />
          ))}

          {/* Email send panel */}
          <AnimatePresence>
            {emailMode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="font-display text-gray-500 text-sm">
                  Enter your Gmail + App Password to send the report to each parent. Emails with no address above will be skipped.
                </p>
                <input
                  type="email" placeholder="Your Gmail (e.g. teacher@gmail.com)"
                  value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-display focus:outline-none focus:border-indigo-400"
                />
                <input
                  type="password" placeholder="Gmail App Password (not your login password)"
                  value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-display focus:outline-none focus:border-indigo-400"
                />
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank" rel="noreferrer"
                  className="text-indigo-500 text-xs underline font-display"
                >
                  How to get a Gmail App Password →
                </a>

                {sendResult && (
                  <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-display">
                    <p className="font-bold text-green-700">✅ Sent to: {sendResult.sent?.join(', ') || 'none'}</p>
                    {sendResult.failed?.length > 0 && (
                      <p className="text-red-500 mt-1">Skipped: {sendResult.failed.map(f => `${f.name} (${f.reason})`).join(', ')}</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 space-y-2">
          {!emailMode ? (
            <div className="flex gap-2">
              <motion.button
                onClick={downloadHTML}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-2xl font-display font-bold text-sm border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                ⬇ Download Report
              </motion.button>
              <motion.button
                onClick={() => setEmailMode(true)}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-2xl font-display font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }}
              >
                📧 Email Parents
              </motion.button>
            </div>
          ) : (
            <div className="flex gap-2">
              <motion.button
                onClick={() => { setEmailMode(false); setSendResult(null); }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-3 rounded-2xl font-display font-bold text-sm border-2 border-gray-200 text-gray-500"
              >
                ← Back
              </motion.button>
              <motion.button
                onClick={handleSendEmails}
                disabled={sending || !smtpUser || !smtpPass}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-2xl font-display font-bold text-sm text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
              >
                {sending ? '⏳ Sending…' : '📨 Send to All Parents'}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
