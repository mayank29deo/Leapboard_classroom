import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOTIONS = [
  { key: 'happy', emoji: '😄', label: 'Happy!', color: '#FFD93D', bg: '#FEF3C7' },
  { key: 'okay', emoji: '🙂', label: 'Okay', color: '#10B981', bg: '#ECFDF5' },
  { key: 'sad', emoji: '😢', label: 'A little sad', color: '#60A5FA', bg: '#EFF6FF' },
  { key: 'grumpy', emoji: '😤', label: 'Not great', color: '#F87171', bg: '#FEF2F2' },
];

export default function FeelingCorner({ onCheckin, childName }) {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSelect = (emotion) => {
    if (confirmed) return;
    setSelected(emotion.key);
  };

  const handleConfirm = () => {
    if (!selected || confirmed) return;
    setConfirmed(true);
    onCheckin(selected);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #FDF4FF 100%)' }}
    >
      <motion.div
        className="w-full max-w-lg px-6"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.35 }}
      >
        <AnimatePresence mode="wait">
          {!confirmed ? (
            <motion.div
              key="form"
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">👋</div>
              <h1 className="font-display font-black text-4xl text-gray-800 mb-2">
                Hi{childName ? `, ${childName}` : ''}!
              </h1>
              <p className="font-display text-gray-500 text-xl mb-8">
                How are you feeling today?
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {EMOTIONS.map((e) => (
                  <motion.button
                    key={e.key}
                    onClick={() => handleSelect(e)}
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.04 }}
                    className="rounded-3xl py-6 px-4 flex flex-col items-center gap-3 transition-all duration-150 border-4"
                    style={{
                      background: selected === e.key ? e.bg : 'white',
                      borderColor: selected === e.key ? e.color : 'transparent',
                      boxShadow: selected === e.key
                        ? `0 8px 32px ${e.color}40`
                        : '0 2px 12px rgba(0,0,0,0.06)',
                    }}
                  >
                    <span className="text-5xl">{e.emoji}</span>
                    <span
                      className="font-display font-bold text-lg"
                      style={{ color: selected === e.key ? e.color : '#6B7280' }}
                    >
                      {e.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              <motion.button
                onClick={handleConfirm}
                disabled={!selected}
                whileTap={{ scale: 0.95 }}
                className="w-full py-5 rounded-2xl font-display font-black text-2xl text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: selected
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : '#D1D5DB',
                  boxShadow: selected ? '0 8px 24px rgba(99,102,241,0.4)' : 'none',
                }}
              >
                Let's Go! 🚀
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="confirmed"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="text-center"
            >
              <div className="text-8xl mb-6">
                {EMOTIONS.find((e) => e.key === selected)?.emoji || '😄'}
              </div>
              <h2 className="font-display font-black text-4xl text-gray-800 mb-3">
                Great! Ready to learn!
              </h2>
              <p className="font-display text-gray-500 text-xl">
                Joining your class now... ✨
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
