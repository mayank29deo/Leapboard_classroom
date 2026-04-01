import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { playOverlaySound, stopOverlaySound } from '../../../hooks/useJingle';

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand = (a, b) => Math.random() * (b - a) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const BALLOON_COLORS  = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF922B','#CC5DE8','#FF8CC8','#38BDF8','#F472B6'];
const CONFETTI_COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF922B','#CC5DE8','#38BDF8','#F472B6','#A78BFA'];
const STAR_COLORS     = ['#FFD93D','#FF922B','#FF6B6B','#FBBF24','#FDE68A','#FCA5A5','#FBCFE8'];

// ── Shared dark backdrop ──────────────────────────────────────────────────────
function Backdrop({ opacity = 0.55, color = '#000' }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{ background: color, zIndex: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, opacity, opacity, 0] }}
      transition={{ times: [0, 0.08, 0.82, 1], duration: 6 }}
    />
  );
}

// ── 1. BALLOON overlay ────────────────────────────────────────────────────────
function BalloonOverlay({ onDone }) {
  // Three waves of balloons for dense coverage
  const balloons = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: rand(2, 96),
    color: pick(BALLOON_COLORS),
    size: rand(70, 130),
    duration: rand(3.2, 5.5),
    delay: rand(0, 2.2),
    rot: rand(-20, 20),
  }));

  useEffect(() => { const t = setTimeout(onDone, 7000); return () => clearTimeout(t); }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <Backdrop opacity={0.45} />

      {balloons.map((b) => (
        <div
          key={b.id}
          className="absolute bottom-[-10px]"
          style={{
            left: `${b.x}%`,
            '--duration': `${b.duration}s`,
            '--balloon-rot': `${b.rot}deg`,
            animationDelay: `${b.delay}s`,
            zIndex: 1,
          }}
        >
          {/* Balloon body */}
          <div
            className="balloon relative"
            style={{
              width: b.size,
              height: b.size * 1.25,
              background: `radial-gradient(circle at 35% 35%, ${b.color}EE, ${b.color}88)`,
              borderRadius: '50% 50% 48% 52% / 58% 58% 42% 42%',
              boxShadow: `inset -10px -10px 25px rgba(0,0,0,0.18), 0 6px 20px rgba(0,0,0,0.2)`,
            }}
          >
            {/* Shine */}
            <div style={{
              position:'absolute', top:'15%', left:'22%',
              width:'28%', height:'20%',
              background:'rgba(255,255,255,0.55)',
              borderRadius:'50%',
              transform:'rotate(-30deg)',
            }} />
          </div>
          {/* String */}
          <div style={{
            width:2, height: b.size * 0.6,
            background:'rgba(255,255,255,0.4)',
            margin:'0 auto',
          }} />
        </div>
      ))}

      {/* Central text */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1.1, 1.1, 0], opacity: [0, 1, 1, 1, 0] }}
          transition={{ times: [0, 0.18, 0.32, 0.78, 1], duration: 6 }}
          className="text-center"
        >
          <div className="font-display font-black text-white leading-none"
            style={{ fontSize: 'clamp(3.5rem, 12vw, 7rem)', textShadow: '0 6px 30px rgba(0,0,0,0.5)' }}>
            🎈 YAY!!!
          </div>
          <div className="font-display font-bold text-yellow-300 mt-3"
            style={{ fontSize: 'clamp(1.4rem, 4vw, 2.5rem)', textShadow: '0 4px 15px rgba(0,0,0,0.4)' }}>
            You're doing amazing! 🌟
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── 2. STAR BURST overlay ─────────────────────────────────────────────────────
function StarOverlay({ onDone }) {
  const stars = Array.from({ length: 55 }, (_, i) => {
    const angle = rand(0, Math.PI * 2);
    const dist  = rand(120, 500);
    return {
      id: i,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      size: rand(28, 65),
      color: pick(STAR_COLORS),
      duration: rand(0.9, 2.2),
      delay: rand(0, 0.8),
    };
  });

  useEffect(() => { const t = setTimeout(onDone, 5500); return () => clearTimeout(t); }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      <Backdrop opacity={0.5} />

      {/* Big central flash */}
      <motion.div className="absolute rounded-full z-10"
        style={{ background: 'radial-gradient(circle, #fff7aa, #FFD93D, #FF922B)' }}
        initial={{ width: 0, height: 0, opacity: 1 }}
        animate={{ width: '70vw', height: '70vw', opacity: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />

      {/* Stars shooting out */}
      {stars.map((s) => (
        <div key={s.id} className="star-particle absolute z-20"
          style={{
            '--star-tx': `${s.tx}px`,
            '--star-ty': `${s.ty}px`,
            '--duration': `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            fontSize: s.size,
            color: s.color,
            filter: `drop-shadow(0 0 8px ${s.color})`,
          }}
        >⭐</div>
      ))}

      {/* Central message */}
      <motion.div className="z-30 text-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1.2, 1.2, 0], opacity: [0, 1, 1, 1, 0] }}
        transition={{ times: [0, 0.18, 0.3, 0.78, 1], duration: 5 }}
      >
        <div className="font-display font-black text-white"
          style={{ fontSize: 'clamp(4rem, 13vw, 8rem)', textShadow: '0 0 40px #FFD93D, 0 6px 20px rgba(0,0,0,0.5)' }}>
          ✨ AMAZING!
        </div>
        <div className="font-display font-bold text-yellow-200 mt-2"
          style={{ fontSize: 'clamp(1.5rem, 4.5vw, 3rem)', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          You're a superstar! ⭐
        </div>
      </motion.div>
    </div>
  );
}

// ── 3. CONFETTI overlay ───────────────────────────────────────────────────────
function ConfettiOverlay({ onDone }) {
  const pieces = Array.from({ length: 120 }, (_, i) => ({
    id: i,
    x: rand(-2, 102),
    color: pick(CONFETTI_COLORS),
    w: rand(10, 22),
    h: rand(14, 30),
    duration: rand(2.8, 5.5),
    delay: rand(0, 2.5),
    rot: rand(0, 360),
    shape: i % 5 === 0 ? 'circle' : i % 7 === 0 ? 'star' : 'rect',
  }));

  useEffect(() => { const t = setTimeout(onDone, 8000); return () => clearTimeout(t); }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <Backdrop opacity={0.4} color="#1a0533" />

      {pieces.map((p) => (
        <div key={p.id}
          className="confetti-piece absolute top-0"
          style={{
            left: `${p.x}%`,
            width: p.shape === 'circle' ? p.w : p.w,
            height: p.shape === 'circle' ? p.w : p.h,
            backgroundColor: p.shape === 'star' ? 'transparent' : p.color,
            color: p.shape === 'star' ? p.color : 'transparent',
            fontSize: p.shape === 'star' ? p.w + 6 : undefined,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            '--duration': `${p.duration}s`,
            '--conf-rot': `${p.rot}deg`,
            animationDelay: `${p.delay}s`,
            zIndex: 1,
          }}
        >
          {p.shape === 'star' ? '⭐' : null}
        </div>
      ))}

      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.div className="text-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1, 1, 0], opacity: [0, 1, 1, 1, 0] }}
          transition={{ times: [0, 0.16, 0.3, 0.78, 1], duration: 7 }}
        >
          <div style={{ fontSize: 'clamp(5rem, 16vw, 10rem)' }}>🎉</div>
          <div className="font-display font-black text-white"
            style={{ fontSize: 'clamp(3.5rem, 11vw, 7rem)', textShadow: '0 6px 30px rgba(0,0,0,0.6)' }}>
            WOOHOO!
          </div>
          <div className="font-display font-bold text-pink-200 mt-2"
            style={{ fontSize: 'clamp(1.3rem, 4vw, 2.4rem)', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            What a rockstar! 🚀
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── 4. MASCOT overlay ─────────────────────────────────────────────────────────
function MascotOverlay({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 6500); return () => clearTimeout(t); }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <Backdrop opacity={0.6} color="#0f0728" />

      <motion.div className="z-10 flex flex-col items-center gap-5 text-center px-8"
        initial={{ scale: 0, y: 80, opacity: 0 }}
        animate={{ scale: [0, 1.15, 1, 1, 0.9, 0], y: [80, -10, 0, 0, 0, -40], opacity: [0, 1, 1, 1, 1, 0] }}
        transition={{ times: [0, 0.15, 0.25, 0.72, 0.88, 1], duration: 6.5 }}
      >
        {/* Big mascot */}
        <div style={{ fontSize: 'clamp(6rem, 22vw, 12rem)', filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.8))' }}>
          🚀
        </div>

        {/* Card */}
        <div className="rounded-3xl px-10 py-8 flex flex-col items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, #6366F1dd, #8B5CF6dd)',
            border: '4px solid rgba(255,255,255,0.35)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 20px 60px rgba(99,102,241,0.5)',
            maxWidth: '75vw',
          }}
        >
          <div className="font-display font-black text-white"
            style={{ fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', textShadow: '0 4px 20px rgba(0,0,0,0.3)', lineHeight: 1.1 }}>
            YOU ARE<br />INCREDIBLE! ⭐
          </div>
          <div className="font-display font-bold text-indigo-200"
            style={{ fontSize: 'clamp(1.1rem, 3.5vw, 2rem)' }}>
            Super brave explorer! 💜
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── 5. BRAVE BADGE overlay ────────────────────────────────────────────────────
function BadgeOverlay({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 6000); return () => clearTimeout(t); }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      <Backdrop opacity={0.65} color="#1a0a00" />

      {/* Radial glow */}
      <motion.div className="absolute rounded-full z-0"
        style={{ background: 'radial-gradient(circle, rgba(255,217,61,0.35), transparent 70%)' }}
        initial={{ width: 0, height: 0 }}
        animate={{ width: '100vw', height: '100vw', opacity: [0, 1, 1, 0] }}
        transition={{ duration: 5.5, times: [0, 0.15, 0.75, 1] }}
      />

      <div className="badge-wrap z-10 flex flex-col items-center gap-5 text-center px-6">
        <div style={{ fontSize: 'clamp(6rem, 20vw, 11rem)', filter: 'drop-shadow(0 0 25px #FFD93D)' }}>
          🏆
        </div>
        <div className="font-display font-black"
          style={{
            fontSize: 'clamp(3.5rem, 12vw, 7.5rem)',
            background: 'linear-gradient(135deg, #FFD93D, #FF922B, #FF6B6B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))',
            lineHeight: 1,
          }}
        >
          SUPER<br />BRAVE!
        </div>
        <div className="font-display font-bold text-white"
          style={{ fontSize: 'clamp(1.4rem, 4.5vw, 2.8rem)', textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
          ⭐ Brave Point Earned! ⭐
        </div>
        <div className="font-display text-yellow-300"
          style={{ fontSize: 'clamp(1rem, 3vw, 1.8rem)', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
          Keep going, champion! 🦁
        </div>
      </div>
    </div>
  );
}

// ── 6. RAINBOW overlay ────────────────────────────────────────────────────────
function RainbowOverlay({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 6000); return () => clearTimeout(t); }, [onDone]);

  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i, x: rand(5, 95), y: rand(10, 85),
    size: rand(20, 50), delay: rand(0, 1.5), color: pick(STAR_COLORS),
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <Backdrop opacity={0.35} color="#0a0a1a" />

      {/* Rainbow arc — very large */}
      <motion.div className="absolute left-1/2 z-10"
        style={{ transform: 'translateX(-50%)', bottom: '-20vh' }}
        initial={{ scaleX: 0, scaleY: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1.1, 1], scaleY: [0, 1.1, 1], opacity: [0, 1, 1, 0] }}
        transition={{ times: [0, 0.2, 0.5, 1], duration: 6 }}
      >
        <div style={{
          width: '140vw',
          height: '70vw',
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          background: 'conic-gradient(from 180deg at 50% 100%, #FF0000 0%, #FF7700 14%, #FFFF00 28%, #00DD00 42%, #0080FF 57%, #8B00FF 71%, #FF0077 85%, #FF0000 100%)',
          opacity: 0.85,
          boxShadow: '0 0 80px rgba(255,255,255,0.3)',
          marginLeft: '-20vw',
        }} />
      </motion.div>

      {/* Sparkle stars across screen */}
      {stars.map((s) => (
        <motion.div key={s.id}
          className="absolute z-20"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size, color: s.color }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{ delay: s.delay, duration: 3, times: [0, 0.2, 0.7, 1] }}
        >✨</motion.div>
      ))}

      <div className="absolute inset-0 flex items-center justify-center z-30">
        <motion.div className="text-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.25, 1, 1, 0], opacity: [0, 1, 1, 1, 0] }}
          transition={{ times: [0, 0.18, 0.3, 0.78, 1], duration: 6 }}
        >
          <div style={{ fontSize: 'clamp(4rem, 14vw, 9rem)', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.6))' }}>
            🌈
          </div>
          <div className="font-display font-black text-white"
            style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', textShadow: '0 6px 30px rgba(0,0,0,0.5)' }}>
            BEAUTIFUL!
          </div>
          <div className="font-display font-bold text-yellow-200 mt-2"
            style={{ fontSize: 'clamp(1.2rem, 3.8vw, 2.5rem)' }}>
            You light up the room! ✨
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── 7. SUPERPOWER overlay ─────────────────────────────────────────────────────
function SuperpowerOverlay({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 7000); return () => clearTimeout(t); }, [onDone]);

  const sparks = Array.from({ length: 20 }, (_, i) => ({
    id: i, x: rand(5, 95), y: rand(5, 95), delay: rand(0, 2),
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.75) 0%, rgba(0,0,0,0.82) 100%)' }}
    >
      {/* Spark particles */}
      {sparks.map((s) => (
        <motion.div key={s.id} className="absolute text-4xl z-10"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
          transition={{ delay: s.delay, duration: 1.2, repeat: 2 }}
        >⚡</motion.div>
      ))}

      <motion.div className="z-20 text-center px-6"
        style={{ maxWidth: '85vw' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1, 1, 0], opacity: [0, 1, 1, 1, 0] }}
        transition={{ times: [0, 0.15, 0.25, 0.8, 1], duration: 7 }}
      >
        <div style={{ fontSize: 'clamp(6rem, 22vw, 13rem)', filter: 'drop-shadow(0 0 40px rgba(255,215,0,0.9))' }}>
          🦸
        </div>
        <div className="font-display font-black text-white"
          style={{ fontSize: 'clamp(2.5rem, 9vw, 6rem)', textShadow: '0 0 40px rgba(99,102,241,0.9), 0 6px 20px rgba(0,0,0,0.5)', lineHeight: 1.1 }}>
          YOU JUST<br />UNLOCKED
        </div>
        <div className="font-display font-black mt-1"
          style={{
            fontSize: 'clamp(2.5rem, 9vw, 6rem)',
            background: 'linear-gradient(135deg, #FFD700, #FF922B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))',
          }}
        >YOUR SUPERPOWER!</div>
        <div className="font-display font-bold text-indigo-200 mt-3"
          style={{ fontSize: 'clamp(1.2rem, 3.5vw, 2.2rem)' }}>
          Only the bravest kids have this power 💜
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Overlay Engine ───────────────────────────────────────────────────────
const OVERLAY_MAP = {
  balloons:     BalloonOverlay,
  stars:        StarOverlay,
  confetti:     ConfettiOverlay,
  mascot:       MascotOverlay,
  badge:        BadgeOverlay,
  rainbow:      RainbowOverlay,
  superpower:   SuperpowerOverlay,
  celebration:  ConfettiOverlay,
  energy_blast: StarOverlay,
};

export default function OverlayEngine({ socket }) {
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [bravePoints, setBravePoints]     = useState(0);
  const [stars, setStars]                 = useState(0);
  const [braveToast, setBraveToast]       = useState(false);
  const [starToast, setStarToast]         = useState(false);

  const dismissOverlay = useCallback(() => {
    stopOverlaySound();
    setActiveOverlay(null);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onOverlay = ({ type }) => {
      const overlayType = type || 'balloons';
      setActiveOverlay(overlayType);
      playOverlaySound(overlayType);
    };
    const onBravePoint   = ({ total }) => { setBravePoints(total); setBraveToast(true); setTimeout(() => setBraveToast(false), 3000); };
    const onStar         = ({ total }) => { setStars(total); setStarToast(true); setTimeout(() => setStarToast(false), 2500); };

    socket.on('trigger:overlay', onOverlay);
    socket.on('award:brave_point', onBravePoint);
    socket.on('award:star', onStar);

    return () => {
      socket.off('trigger:overlay', onOverlay);
      socket.off('award:brave_point', onBravePoint);
      socket.off('award:star', onStar);
    };
  }, [socket]);

  const OverlayComponent = activeOverlay ? (OVERLAY_MAP[activeOverlay] || BalloonOverlay) : null;

  return (
    <>
      <AnimatePresence>
        {OverlayComponent && (
          <OverlayComponent key={activeOverlay + Date.now()} onDone={dismissOverlay} />
        )}
      </AnimatePresence>

      {/* HUD — top right */}
      <div className="fixed top-4 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none">
        <motion.div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-2xl px-4 py-2 shadow-lg"
          initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <span className="text-xl">⭐</span>
          <span className="font-display font-bold text-gray-800">{stars}</span>
        </motion.div>
        <motion.div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-2xl px-4 py-2 shadow-lg"
          initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
          <span className="text-xl">💜</span>
          <span className="font-display font-bold text-gray-800">{bravePoints}</span>
        </motion.div>
      </div>

      {/* Toasts */}
      <AnimatePresence>
        {braveToast && (
          <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-indigo-600 text-white rounded-2xl px-8 py-5 shadow-2xl font-display font-bold pointer-events-none text-center"
            style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.6rem)' }}
            initial={{ y: 60, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.8 }}
          >
            💜 Brave Point earned! Total: {bravePoints}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {starToast && (
          <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-white rounded-2xl px-8 py-5 shadow-2xl font-display font-bold pointer-events-none text-center"
            style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.6rem)' }}
            initial={{ y: 60, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.8 }}
          >
            ⭐ Star earned! Total: {stars}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
