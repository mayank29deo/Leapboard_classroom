import { useState } from 'react';
import { motion } from 'framer-motion';

export default function JoinModal({
  role,
  onJoin,
  loading = false,
  error = null,
  showChildNameField = false,
}) {
  const [code, setCode]           = useState('');
  const [name, setName]           = useState('');
  const [childName, setChildName] = useState('');
  const [email, setEmail]         = useState('');

  const config = {
    teacher: {
      icon: '🎓',
      title: "You're the Teacher!",
      subtitle: 'Create a new class and get your session code.',
      namePlaceholder: 'Your name (e.g. Ms. Priya)',
      cta: 'Create Class',
      showCode: false,
      color: '#6366F1',
    },
    child: {
      icon: '⭐',
      title: 'Ready to Learn!',
      subtitle: 'Ask your teacher for the magic code.',
      namePlaceholder: 'Your name (e.g. Aryan)',
      cta: "Let's Go!",
      showCode: true,
      color: '#FF922B',
    },
    parent: {
      icon: '💜',
      title: "Watch Your Child",
      subtitle: 'Enter the class code your teacher shared.',
      namePlaceholder: 'Your name',
      cta: 'Join as Parent',
      showCode: true,
      color: '#10B981',
    },
  };

  const c = config[role];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (c.showCode && !code.trim()) return;
    if (showChildNameField && !childName.trim()) return;

    onJoin({
      name:      name.trim(),
      code:      code.trim().toUpperCase(),
      childName: childName.trim() || undefined,
      email:     email.trim()     || undefined,
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
        initial={{ scale: 0.85, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.3 }}
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{c.icon}</div>
          <h2 className="font-display font-black text-3xl text-gray-800 mb-1">
            {c.title}
          </h2>
          <p className="font-display text-gray-500">{c.subtitle}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-display">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-display font-bold text-gray-700 text-sm mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={c.namePlaceholder}
              maxLength={40}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-display text-gray-800 text-base focus:outline-none focus:border-indigo-400 transition-colors"
              style={{ fontSize: '16px' }}
            />
          </div>

          {showChildNameField && (
            <div>
              <label className="block font-display font-bold text-gray-700 text-sm mb-1.5">
                Child's Name (to track)
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g. Riya"
                maxLength={40}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-display text-gray-800 text-base focus:outline-none focus:border-green-400 transition-colors"
                style={{ fontSize: '16px' }}
              />
            </div>
          )}

          {/* Email — only for parent role */}
          {role === 'parent' && (
            <div>
              <label className="block font-display font-bold text-gray-700 text-sm mb-1.5">
                Your Email <span className="font-normal text-gray-400">(for class report)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. parent@gmail.com"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-display text-gray-800 text-base focus:outline-none focus:border-green-400 transition-colors"
                style={{ fontSize: '16px' }}
              />
            </div>
          )}

          {c.showCode && (
            <div>
              <label className="block font-display font-bold text-gray-700 text-sm mb-1.5">
                Class Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. STAR42"
                maxLength={6}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-display font-black text-gray-800 text-xl tracking-widest text-center focus:outline-none focus:border-indigo-400 transition-colors uppercase"
                style={{ fontSize: '20px', letterSpacing: '0.2em' }}
              />
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-display font-black text-xl text-white mt-2 disabled:opacity-60"
            style={{
              background: `linear-gradient(135deg, ${c.color}, ${c.color}CC)`,
              boxShadow: `0 8px 24px ${c.color}40`,
            }}
          >
            {loading ? '...' : c.cta}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
