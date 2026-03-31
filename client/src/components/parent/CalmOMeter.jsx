import { motion } from 'framer-motion';

const STATES = {
  calm: {
    label: 'Calm & Happy',
    emoji: '😊',
    color: '#10B981',
    bg: '#ECFDF5',
    level: 100,
    message: 'Your little one is doing great!',
  },
  slightly_off: {
    label: 'Slightly Off',
    emoji: '😐',
    color: '#F59E0B',
    bg: '#FEF3C7',
    level: 55,
    message: 'A small wobble — teacher is keeping an eye.',
  },
  needs_attention: {
    label: 'Needs Attention',
    emoji: '😢',
    color: '#EF4444',
    bg: '#FEF2F2',
    level: 20,
    message: 'A moment of upset — magic is on the way!',
  },
};

export default function CalmOMeter({ state = 'calm', childName }) {
  const current = STATES[state] || STATES.calm;

  return (
    <div
      className="rounded-3xl p-8 w-full max-w-sm mx-auto text-center"
      style={{ background: current.bg, border: `3px solid ${current.color}22` }}
    >
      <p className="font-display text-gray-500 text-sm uppercase tracking-widest mb-2">
        Calm-o-Meter
      </p>
      <motion.div
        key={state}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.45 }}
        className="text-8xl mb-3"
      >
        {current.emoji}
      </motion.div>

      <h2
        className="font-display font-black text-2xl mb-1"
        style={{ color: current.color }}
      >
        {current.label}
      </h2>
      {childName && (
        <p className="font-display text-gray-500 text-sm mb-4">{childName}</p>
      )}

      {/* Bar */}
      <div className="w-full h-4 bg-white rounded-full overflow-hidden shadow-inner mb-4">
        <motion.div
          className="h-full rounded-full"
          style={{ background: current.color }}
          initial={{ width: 0 }}
          animate={{ width: `${current.level}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <p className="font-display text-gray-600 text-sm leading-relaxed">
        {current.message}
      </p>
    </div>
  );
}
