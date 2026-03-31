import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';
import CalmOMeter from '../components/parent/CalmOMeter';
import JoinModal from '../components/common/JoinModal';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function ParentView() {
  const navigate = useNavigate();
  const socket = getSocket();

  const [phase, setPhase] = useState('join');
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const [calmState, setCalmState] = useState('calm');
  const [lastEvent, setLastEvent] = useState(null);
  const [panicSent, setPanicSent] = useState(false);
  const [panicCooldown, setPanicCooldown] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  const handleJoin = useCallback(({ name, code, childName: cn }) => {
    setJoining(true);
    setJoinError(null);
    setParentName(name);
    setChildName(cn || name);
    setSessionCode(code);

    fetch(`${SERVER_URL}/api/session/${code}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => {
        socket.emit('join:session', {
          code,
          role: 'parent',
          name,
          childName: cn,
        });
        setJoining(false);
        setPhase('watching');
      })
      .catch(() => {
        setJoining(false);
        setJoinError('Class not found. Check the code your teacher shared.');
      });
  }, [socket]);

  useEffect(() => {
    const handleDistress = ({ childName: cn, timestamp }) => {
      if (cn !== childName && childName) return;
      setCalmState('needs_attention');
      setLastEvent({ text: `${cn || 'Your child'} had a moment — magic is on the way! ✨`, time: timestamp });
      // Recover after 20 seconds
      setTimeout(() => setCalmState('calm'), 20000);
    };

    socket.on('child:distress', handleDistress);
    return () => socket.off('child:distress', handleDistress);
  }, [socket, childName]);

  const sendPanic = () => {
    if (panicCooldown) return;
    socket.emit('parent:panic', { childName });
    setPanicSent(true);
    setPanicCooldown(true);
    setLastEvent({ text: 'Teacher has been alerted silently. 💜', time: new Date().toISOString() });
    setTimeout(() => {
      setPanicSent(false);
      setPanicCooldown(false);
    }, 180000); // 3 minute cooldown
  };

  const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
  const elapsedStr =
    phase === 'watching'
      ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
      : '--';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #F0FDF4 0%, #ECFDF5 100%)', fontFamily: 'Nunito, sans-serif' }}
    >
      {/* Join Modal */}
      <AnimatePresence>
        {phase === 'join' && (
          <JoinModal
            role="parent"
            onJoin={handleJoin}
            loading={joining}
            error={joinError}
            showChildNameField
          />
        )}
      </AnimatePresence>

      {phase === 'watching' && (
        <>
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-green-100 bg-white/60 backdrop-blur-sm">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700 font-display text-sm">
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <span className="font-display font-black text-gray-800 text-lg">Leapboard</span>
            </div>
            <div className="font-display text-gray-400 text-sm font-mono">{elapsedStr}</div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">
            {/* Title */}
            <div className="text-center">
              <h1 className="font-display font-black text-3xl text-gray-800 mb-1">
                {childName}'s Class
              </h1>
              <p className="font-display text-gray-500">
                Code: <span className="font-black text-gray-700">{sessionCode}</span>
              </p>
            </div>

            {/* Calm-o-Meter */}
            <motion.div
              layout
              className="w-full max-w-sm"
            >
              <CalmOMeter state={calmState} childName={childName} />
            </motion.div>

            {/* Last event */}
            <AnimatePresence>
              {lastEvent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-sm bg-white rounded-2xl px-5 py-4 shadow-sm border border-green-100"
                >
                  <p className="font-display text-gray-600 text-sm text-center leading-relaxed">
                    {lastEvent.text}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Panic button */}
            <div className="w-full max-w-sm space-y-3">
              <motion.button
                onClick={sendPanic}
                disabled={panicCooldown}
                whileTap={{ scale: 0.96 }}
                className="w-full py-4 rounded-2xl font-display font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: panicCooldown
                    ? '#D1D5DB'
                    : 'linear-gradient(135deg, #FF922B, #EF4444)',
                  color: 'white',
                  boxShadow: panicCooldown ? 'none' : '0 8px 24px rgba(239,68,68,0.3)',
                }}
              >
                {panicCooldown
                  ? panicSent
                    ? '✅ Teacher Alerted!'
                    : '⏳ Cooldown (3 min)'
                  : '🆘 Alert Teacher (Silent)'}
              </motion.button>
              <p className="font-display text-gray-400 text-xs text-center">
                Sends a private, silent alert to the teacher. No class disruption.
              </p>
            </div>

            {/* Info cards */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-3">
              {[
                { icon: '🔒', title: 'Private', desc: 'Only you see this view' },
                { icon: '⚡', title: 'Real-time', desc: 'Updates in under 2 seconds' },
                { icon: '🎭', title: 'Magic active', desc: 'Auto-overlays are watching' },
                { icon: '💜', title: 'Care system', desc: 'Every child is seen' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-green-50 text-center"
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="font-display font-bold text-gray-700 text-sm">{item.title}</p>
                  <p className="font-display text-gray-400 text-xs mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </main>
        </>
      )}
    </div>
  );
}
