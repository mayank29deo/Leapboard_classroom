import { useState } from 'react';
import { motion } from 'framer-motion';

const BROADCAST_OVERLAYS = [
  { key: 'confetti', emoji: '🎉', label: 'Confetti' },
  { key: 'stars', emoji: '⭐', label: 'Star Burst' },
  { key: 'balloons', emoji: '🎈', label: 'Balloons' },
  { key: 'rainbow', emoji: '🌈', label: 'Rainbow' },
];

const INDIVIDUAL_OVERLAYS = [
  { key: 'balloons', emoji: '🎈', label: 'Balloons' },
  { key: 'stars', emoji: '⭐', label: 'Stars' },
  { key: 'confetti', emoji: '🎉', label: 'Confetti' },
  { key: 'mascot', emoji: '🚀', label: 'Mascot' },
  { key: 'badge', emoji: '🏆', label: 'Brave Badge' },
  { key: 'rainbow', emoji: '🌈', label: 'Rainbow' },
  { key: 'superpower', emoji: '🦸', label: 'Superpower' },
];

export default function TriggerPanel({ socket, children, onTriggered }) {
  const [broadcastCooldown, setBroadcastCooldown] = useState(false);
  const [broadcastTimer, setBroadcastTimer] = useState(0);
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedOverlay, setSelectedOverlay] = useState('balloons');

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
      if (remaining <= 0) {
        clearInterval(interval);
        setBroadcastCooldown(false);
        setBroadcastTimer(0);
      }
    }, 1000);
  };

  const fireIndividual = () => {
    if (!socket || !selectedChild) return;
    socket.emit('trigger:individual', {
      childSocketId: selectedChild,
      overlayType: selectedOverlay,
    });
    if (onTriggered) onTriggered({ type: 'individual', overlayType: selectedOverlay });
  };

  const awardStar = (childSocketId) => {
    if (!socket) return;
    socket.emit('award:star', { childSocketId });
  };

  return (
    <div className="space-y-4">
      {/* Individual Trigger */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">👆</span>
          <h3 className="font-display font-bold text-gray-700 text-sm uppercase tracking-wide">
            Individual Magic
          </h3>
        </div>

        {children.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-2">
            No children in class yet
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {children.map((child) => (
                <button
                  key={child.socketId}
                  onClick={() => setSelectedChild(
                    selectedChild === child.socketId ? null : child.socketId
                  )}
                  className="text-xs font-display font-bold px-3 py-1.5 rounded-xl border-2 transition-all duration-150"
                  style={{
                    borderColor: selectedChild === child.socketId ? '#6366F1' : '#E5E7EB',
                    background: selectedChild === child.socketId ? '#EEF2FF' : 'white',
                    color: selectedChild === child.socketId ? '#6366F1' : '#6B7280',
                  }}
                >
                  {child.name}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {INDIVIDUAL_OVERLAYS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setSelectedOverlay(o.key)}
                  className="text-xs px-2 py-1 rounded-lg border transition-all duration-100"
                  style={{
                    borderColor: selectedOverlay === o.key ? '#6366F1' : '#E5E7EB',
                    background: selectedOverlay === o.key ? '#EEF2FF' : 'white',
                    color: selectedOverlay === o.key ? '#6366F1' : '#9CA3AF',
                    fontWeight: selectedOverlay === o.key ? 700 : 400,
                  }}
                >
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <motion.button
                onClick={fireIndividual}
                disabled={!selectedChild}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm text-white transition-all disabled:opacity-40"
                style={{
                  background: selectedChild
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : '#D1D5DB',
                }}
              >
                ✨ Send Magic
              </motion.button>

              {selectedChild && (
                <motion.button
                  onClick={() => awardStar(selectedChild)}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2.5 rounded-xl font-display font-bold text-sm bg-amber-100 text-amber-700 border-2 border-amber-200"
                >
                  ⭐
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Broadcast Trigger */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">📢</span>
          <h3 className="font-display font-bold text-gray-700 text-sm uppercase tracking-wide">
            Broadcast to All
          </h3>
          {broadcastCooldown && (
            <span className="ml-auto text-xs text-gray-400 font-mono">
              {broadcastTimer}s
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {BROADCAST_OVERLAYS.map((o) => (
            <motion.button
              key={o.key}
              onClick={() => fireBroadcast(o.key)}
              disabled={broadcastCooldown}
              whileTap={{ scale: 0.93 }}
              className="py-3 rounded-2xl font-display font-bold text-sm flex flex-col items-center gap-1 border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderColor: '#E5E7EB',
                background: broadcastCooldown ? '#F9FAFB' : 'white',
                color: '#374151',
              }}
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
          className="mt-2 w-full py-3.5 rounded-2xl font-display font-black text-base text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: broadcastCooldown
              ? '#D1D5DB'
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
