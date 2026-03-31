import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ROLES = [
  {
    route: '/teacher',
    icon: '🎓',
    title: "I'm a Teacher",
    desc: 'Create a class and manage your students with live emotional insights.',
    color: '#6366F1',
    bg: '#EEF2FF',
    border: '#C7D2FE',
  },
  {
    route: '/child',
    icon: '⭐',
    title: "I'm a Student",
    desc: 'Join your class and let the magic begin!',
    color: '#FF922B',
    bg: '#FFF7ED',
    border: '#FED7AA',
  },
  {
    route: '/parent',
    icon: '💜',
    title: "I'm a Parent",
    desc: "Watch your child's class and see how they're doing in real time.",
    color: '#10B981',
    bg: '#ECFDF5',
    border: '#A7F3D0',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #F8FAFF 0%, #FDF4FF 100%)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-center pt-12 pb-4 px-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-5xl">🚀</span>
            <span
              className="font-display font-black text-5xl"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #EC4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Leapboard
            </span>
          </div>
          <p className="font-display text-gray-500 text-lg">
            Where learning feels like magic ✨
          </p>
        </motion.div>
      </header>

      {/* Role cards */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display font-black text-3xl text-gray-700 text-center mb-10"
          >
            Who are you today?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLES.map((role, i) => (
              <motion.button
                key={role.route}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, type: 'spring', bounce: 0.3 }}
                whileHover={{ y: -6, boxShadow: `0 20px 50px ${role.color}25` }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(role.route)}
                className="rounded-3xl p-8 text-left flex flex-col gap-4 border-2 transition-all duration-200 cursor-pointer"
                style={{
                  background: role.bg,
                  borderColor: role.border,
                }}
              >
                <div
                  className="text-5xl w-16 h-16 flex items-center justify-center rounded-2xl"
                  style={{ background: `${role.color}15` }}
                >
                  {role.icon}
                </div>
                <div>
                  <h3
                    className="font-display font-black text-2xl mb-1"
                    style={{ color: role.color }}
                  >
                    {role.title}
                  </h3>
                  <p className="font-display text-gray-500 text-sm leading-relaxed">
                    {role.desc}
                  </p>
                </div>
                <div
                  className="mt-auto flex items-center gap-2 font-display font-bold text-sm"
                  style={{ color: role.color }}
                >
                  Enter <span>→</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center pb-8 text-gray-400 font-display text-sm">
        Leapboard — Emotion-intelligent classroom for children 4–7 ✨
      </footer>
    </div>
  );
}
