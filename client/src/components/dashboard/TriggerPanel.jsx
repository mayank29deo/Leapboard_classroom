import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BROADCAST_OVERLAYS = [
  { key: 'confetti', emoji: '🎉', label: 'Confetti' },
  { key: 'stars',    emoji: '⭐', label: 'Star Burst' },
  { key: 'balloons', emoji: '🎈', label: 'Balloons' },
  { key: 'rainbow',  emoji: '🌈', label: 'Rainbow' },
];

const INDIVIDUAL_OVERLAYS = [
  { key: 'balloons',   emoji: '🎈', label: 'Balloons' },
  { key: 'stars',      emoji: '⭐', label: 'Stars' },
  { key: 'confetti',   emoji: '🎉', label: 'Confetti' },
  { key: 'mascot',     emoji: '🚀', label: 'Mascot' },
  { key: 'badge',      emoji: '🏆', label: 'Badge' },
  { key: 'rainbow',    emoji: '🌈', label: 'Rainbow' },
  { key: 'superpower', emoji: '🦸', label: 'Superpower' },
];

export default function TriggerPanel({ socket, children, onTriggered }) {
  const [broadcastCooldown, setBroadcastCooldown] = useState(false);
  const [broadcastTimer,    setBroadcastTimer]    = useState(0);
  const [selectedChild,     setSelectedChild]     = useState(null);
  const [selectedOverlay,   setSelectedOverlay]   = useState('balloons');
  const [starFlash,         setStarFlash]         = useState(null); // socketId that just got a star

  // ── Broadcast ───────────────────────────────────────────────────────────────
  const fireBroadcast = (overlayType) => {
    if (broadcastCooldown || !socket) return;
    socket.emit('trigger:broadcast', { overlayType });
    if (onTriggered) onTriggered({ type: 'broadcast', overlayType });
    setBroadcastCooldown(true);
    let remaining = 60;
    setBroadcastTimer(remaining);
    const interval = setInterval(() => {
      remaining -= 1;
      setBroadcastTimer(remaining);
      if (remaining <= 0) { clearInterval(interval); setBroadcastCooldown(false); setBroadcastTimer(0); }
    }, 1000);
  };

  // ── Individual magic ────────────────────────────────────────────────────────
  const fireIndividual = () => {
    if (!socket || !selectedChild) return;
    socket.emit('trigger:individual', { childSocketId: selectedChild, overlayType: selectedOverlay });
    if (onTriggered) onTriggered({ type: 'individual', overlayType: selectedOverlay });
  };

  // ── Award star ──────────────────────────────────────────────────────────────
  const awardStar = (childSocketId) => {
    if (!socket) return;
    socket.emit('award:star', { childSocketId });
    // Flash feedback on the button
    setStarFlash(childSocketId);
    setTimeout(() => setStarFlash(null), 1200);
  };

  const noChildren = children.length === 0;

  return (
    <div className="space-y-5">

      {/* ── SECTION 1: Give a Star ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-base">⭐</span>
          <h3 className="font-display font-bold text-gray-400 text-xs uppercase tracking-widest">
            Give a Star
          </h3>
          <span className="font-display text-gray-600 text-xs ml-auto">after a good answer</span>
        </div>

        {noChildren ? (
          <p className="text-gray-600 text-xs text-center py-2">Waiting for students…</p>
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            {children.map((child) => {
              const flashing = starFlash === child.socketId;
              return (
                <motion.button
                  key={child.socketId}
                  onClick={() => awardStar(child.socketId)}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-between w-full rounded-2xl px-4 py-3 border-2 transition-all duration-200"
                  style={{
                    background: flashing ? '#FEF3C7' : '#1F2937',
                    borderColor: flashing ? '#F59E0B' : '#374151',
                    boxShadow: flashing ? '0 0 20px rgba(245,158,11,0.4)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-white text-sm">
                      {child.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ⭐ {child.stars || 0}
                    </span>
                  </div>
                  <motion.div
                    animate={flashing ? { scale: [1, 1.8, 1], rotate: [0, 20, -20, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-xl"
                  >
                    {flashing ? '🌟' : '⭐'}
                  </motion.div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800" />

      {/* ── SECTION 2: Individual Magic ──────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-base">👆</span>
          <h3 className="font-display font-bold text-gray-400 text-xs uppercase tracking-widest">
            Individual Magic
          </h3>
        </div>

        {noChildren ? (
          <p className="text-gray-600 text-xs text-center py-2">Waiting for students…</p>
        ) : (
          <div className="space-y-2.5">
            {/* Child selector */}
            <div className="flex flex-wrap gap-1.5">
              {children.map((child) => (
                <button
                  key={child.socketId}
                  onClick={() => setSelectedChild(
                    selectedChild === child.socketId ? null : child.socketId
                  )}
                  className="text-xs font-display font-bold px-3 py-1.5 rounded-xl border-2 transition-all duration-150"
                  style={{
                    borderColor: selectedChild === child.socketId ? '#6366F1' : '#374151',
                    background:  selectedChild === child.socketId ? '#312E81' : '#1F2937',
                    color:       selectedChild === child.socketId ? '#A5B4FC' : '#6B7280',
                  }}
                >
                  {child.name}
                </button>
              ))}
            </div>

            {/* Overlay type picker */}
            <div className="flex flex-wrap gap-1.5">
              {INDIVIDUAL_OVERLAYS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setSelectedOverlay(o.key)}
                  className="text-xs px-2 py-1 rounded-lg border transition-all duration-100"
                  style={{
                    borderColor: selectedOverlay === o.key ? '#6366F1' : '#374151',
                    background:  selectedOverlay === o.key ? '#312E81' : '#1F2937',
                    color:       selectedOverlay === o.key ? '#A5B4FC' : '#6B7280',
                    fontWeight:  selectedOverlay === o.key ? 700 : 400,
                  }}
                >
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>

            <motion.button
              onClick={fireIndividual}
              disabled={!selectedChild}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 rounded-xl font-display font-bold text-sm text-white transition-all disabled:opacity-40"
              style={{
                background: selectedChild
                  ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                  : '#374151',
                boxShadow: selectedChild ? '0 6px 20px rgba(99,102,241,0.35)' : 'none',
              }}
            >
              ✨ Send Magic to {selectedChild
                ? children.find(c => c.socketId === selectedChild)?.name || 'child'
                : '…'}
            </motion.button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800" />

      {/* ── SECTION 3: Broadcast to All ──────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-base">📢</span>
          <h3 className="font-display font-bold text-gray-400 text-xs uppercase tracking-widest">
            Broadcast to All
          </h3>
          {broadcastCooldown && (
            <span className="ml-auto font-mono text-xs text-gray-500">{broadcastTimer}s</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          {BROADCAST_OVERLAYS.map((o) => (
            <motion.button
              key={o.key}
              onClick={() => fireBroadcast(o.key)}
              disabled={broadcastCooldown}
              whileTap={{ scale: 0.93 }}
              className="py-3 rounded-2xl font-display font-bold text-sm flex flex-col items-center gap-1 border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#1F2937', borderColor: '#374151', color: '#D1D5DB' }}
            >
              <span className="text-2xl">{o.emoji}</span>
              <span className="text-xs">{o.label}</span>
            </motion.button>
          ))}
        </div>

        <motion.button
          onClick={() => fireBroadcast('confetti')}
          disabled={broadcastCooldown}
          whileTap={{ scale: 0.95 }}
          className="w-full py-3.5 rounded-2xl font-display font-black text-base text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: broadcastCooldown
              ? '#374151'
              : 'linear-gradient(135deg, #FF922B, #FF6B6B)',
            boxShadow: broadcastCooldown ? 'none' : '0 6px 20px rgba(255,146,43,0.35)',
          }}
        >
          ⚡ Quick Energy Reset!
        </motion.button>
      </div>
    </div>
  );
}
