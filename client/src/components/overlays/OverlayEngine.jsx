import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { playOverlaySound, stopOverlaySound, playStarSound } from '../../hooks/useJingle';

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
  const balloons = useMemo(() => Array.from({ length: 28 }, (_, i) => {
    const baseX = rand(4, 94);
    const swayAmt = rand(3, 9);
    return {
      id: i,
      x: baseX,
      color: pick(BALLOON_COLORS),
      size: rand(65, 135),
      duration: rand(5, 8.5),
      delay: rand(0, 2.8),
      swayAmt,
      swayFrames: [
        `${baseX}vw`,
        `${baseX + swayAmt}vw`,
        `${baseX - swayAmt * 0.6}vw`,
        `${baseX + swayAmt * 0.4}vw`,
        `${baseX - swayAmt * 0.8}vw`,
        `${baseX + swayAmt * 0.3}vw`,
        `${baseX}vw`,
      ],
      rotFrames: (() => {
        const r = rand(8, 18);
        return [0, r, -r * 0.7, r * 0.5, -r * 0.3, r * 0.15, 0];
      })(),
      scaleFrames: [0.85, 1, 1.03, 0.98, 1.01, 1, 0.95],
    };
  }), []);

  useEffect(() => { const t = setTimeout(onDone, 9500); return () => clearTimeout(t); }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <Backdrop opacity={0.45} />

      {balloons.map((b) => (
        <motion.div
          key={b.id}
          className="absolute"
          style={{ bottom: -160, zIndex: 1 }}
          initial={{ y: 0, x: `${b.x}vw`, opacity: 0, scale: 0.6 }}
          animate={{
            y: [0, '-115vh'],
            x: b.swayFrames,
            rotate: b.rotFrames,
            scale: b.scaleFrames,
            opacity: [0, 1, 1, 1, 1, 1, 0],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            ease: [0.25, 0.1, 0.25, 1],
            y: { duration: b.duration, ease: [0.16, 0.7, 0.35, 1] },
            opacity: { times: [0, 0.06, 0.2, 0.6, 0.8, 0.92, 1], duration: b.duration },
          }}
        >
          <motion.div
            className="relative"
            animate={{ y: [0, -6, 0, 4, 0], rotate: [0, 1.5, 0, -1, 0] }}
            transition={{ repeat: Infinity, duration: rand(2.5, 4), ease: 'easeInOut' }}
            style={{
              width: b.size,
              height: b.size * 1.25,
              background: `radial-gradient(ellipse at 32% 30%, ${b.color}FF, ${b.color}CC 55%, ${b.color}88)`,
              borderRadius: '50% 50% 48% 52% / 60% 60% 40% 40%',
              boxShadow: `inset -8px -12px 22px rgba(0,0,0,0.15), inset 6px 8px 18px rgba(255,255,255,0.15), 0 8px 28px rgba(0,0,0,0.18)`,
            }}
          >
            <div style={{
              position: 'absolute', top: '14%', left: '20%',
              width: '30%', height: '22%',
              background: 'rgba(255,255,255,0.5)',
              borderRadius: '50%',
              transform: 'rotate(-35deg)',
              filter: 'blur(2px)',
            }} />
            <div style={{
              position: 'absolute', top: '22%', left: '28%',
              width: '12%', height: '8%',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '50%',
              transform: 'rotate(-30deg)',
            }} />
          </motion.div>
          <svg width={b.size} height={b.size * 0.75} viewBox="0 0 40 50" style={{ display: 'block', margin: '0 auto' }}>
            <path
              d="M20 0 Q22 15, 18 25 Q16 35, 21 50"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      ))}

      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 30 }}
          animate={{
            scale: [0, 1.25, 0.95, 1.05, 1, 1, 0.85],
            opacity: [0, 1, 1, 1, 1, 1, 0],
            y: [30, -8, 2, 0, 0, 0, -20],
          }}
          transition={{
            times: [0, 0.12, 0.2, 0.26, 0.32, 0.82, 1],
            duration: 8,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, -3, 3, -2, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="font-display font-black text-white leading-none"
            style={{ fontSize: 'clamp(3.5rem, 12vw, 7rem)', textShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            🎈 YAY!!!
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -8] }}
            transition={{ delay: 0.6, duration: 6.5, times: [0, 0.08, 0.85, 1] }}
            className="font-display font-bold text-yellow-300 mt-3"
            style={{ fontSize: 'clamp(1.4rem, 4vw, 2.5rem)', textShadow: '0 4px 15px rgba(0,0,0,0.4)' }}
          >
            You're doing amazing! 🌟
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ── 2. STAR BURST overlay ─────────────────────────────────────────────────────
function StarOverlay({ onDone }) {
  const stars = useMemo(() => Array.from({ length: 55 }, (_, i) => {
    const angle = rand(0, Math.PI * 2);
    const dist  = rand(120, 550);
    const wobble = rand(15, 50);
    return {
      id: i,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      midX: Math.cos(angle + rand(-0.3, 0.3)) * dist * 0.5 + rand(-wobble, wobble),
      midY: Math.sin(angle + rand(-0.3, 0.3)) * dist * 0.5 + rand(-wobble, wobble),
      size: rand(22, 65),
      color: pick(STAR_COLORS),
      duration: rand(1.4, 2.8),
      delay: rand(0, 0.5),
      rotate: rand(200, 900) * (Math.random() > 0.5 ? 1 : -1),
    };
  }), []);

  const twinkles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i, x: rand(8, 92), y: rand(8, 92),
    size: rand(12, 30), delay: rand(0.5, 2.5),
    color: pick(STAR_COLORS),
  })), []);

  useEffect(() => { const t = setTimeout(onDone, 5500); return () => clearTimeout(t); }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      <Backdrop opacity={0.5} />

      <motion.div className="absolute rounded-full z-10"
        style={{ background: 'radial-gradient(circle, #fff7aaCC, #FFD93D88, transparent 70%)' }}
        initial={{ width: 0, height: 0, opacity: 1 }}
        animate={{ width: ['0vw', '90vw', '110vw'], height: ['0vw', '90vw', '110vw'], opacity: [1, 0.8, 0] }}
        transition={{ duration: 0.9, ease: [0.16, 0.8, 0.3, 1], times: [0, 0.4, 1] }}
      />

      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute z-20"
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, s.midX, s.tx],
            y: [0, s.midY, s.ty],
            scale: [0, 1.6, 1.1, 0],
            rotate: [0, s.rotate * 0.4, s.rotate],
            opacity: [0, 1, 0.9, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            ease: [0.22, 1, 0.36, 1],
            scale: { times: [0, 0.15, 0.6, 1] },
            opacity: { times: [0, 0.1, 0.7, 1] },
          }}
          style={{
            fontSize: s.size,
            color: s.color,
            filter: `drop-shadow(0 0 ${s.size * 0.3}px ${s.color})`,
          }}
        >⭐</motion.div>
      ))}

      {twinkles.map((t) => (
        <motion.div key={`tw-${t.id}`} className="absolute z-15"
          style={{ left: `${t.x}%`, top: `${t.y}%`, fontSize: t.size, color: t.color }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 0, 1, 0], opacity: [0, 1, 0, 0.8, 0] }}
          transition={{ delay: t.delay, duration: 2, ease: 'easeInOut' }}
        >✦</motion.div>
      ))}

      <motion.div className="z-30 text-center"
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{
          scale: [0, 1.35, 0.9, 1.05, 1, 1, 0],
          opacity: [0, 1, 1, 1, 1, 1, 0],
          y: [20, -5, 3, 0, 0, 0, -25],
        }}
        transition={{ times: [0, 0.1, 0.17, 0.22, 0.28, 0.82, 1], duration: 5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1], rotate: [0, 2, -2, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="font-display font-black text-white"
          style={{ fontSize: 'clamp(4rem, 13vw, 8rem)', textShadow: '0 0 40px #FFD93D, 0 8px 32px rgba(0,0,0,0.5)' }}
        >
          ✨ AMAZING!
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, -10] }}
          transition={{ delay: 0.4, duration: 4.2, times: [0, 0.1, 0.85, 1] }}
          className="font-display font-bold text-yellow-200 mt-2"
          style={{ fontSize: 'clamp(1.5rem, 4.5vw, 3rem)', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
        >
          You're a superstar! ⭐
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── 3. CONFETTI overlay ───────────────────────────────────────────────────────
function ConfettiOverlay({ onDone }) {
  const pieces = useMemo(() => Array.from({ length: 120 }, (_, i) => {
    const baseX = rand(-5, 105);
    const windDir = Math.random() > 0.5 ? 1 : -1;
    const drift = rand(4, 18) * windDir;
    return {
      id: i,
      x: baseX,
      color: pick(CONFETTI_COLORS),
      w: rand(8, 22),
      h: rand(12, 28),
      duration: rand(4, 7),
      delay: rand(0, 2.5),
      rot: rand(360, 1440) * (Math.random() > 0.5 ? 1 : -1),
      drift,
      xFrames: [
        `${baseX}vw`,
        `${baseX + drift * 0.3}vw`,
        `${baseX + drift * 0.7}vw`,
        `${baseX + drift * 0.5}vw`,
        `${baseX + drift}vw`,
      ],
      flipSpeed: rand(0.4, 0.9),
      shape: i % 7 === 0 ? 'circle' : i % 9 === 0 ? 'star' : i % 5 === 0 ? 'ribbon' : 'rect',
    };
  }), []);

  useEffect(() => { const t = setTimeout(onDone, 9000); return () => clearTimeout(t); }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <Backdrop opacity={0.4} color="#1a0533" />

      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ top: -50, zIndex: 1 }}
          initial={{ y: 0, x: `${p.x}vw`, rotate: 0, opacity: 0 }}
          animate={{
            y: [0, '110vh'],
            x: p.xFrames,
            rotate: [0, p.rot * 0.3, p.rot * 0.6, p.rot * 0.85, p.rot],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            y: { ease: [0.4, 0, 1, 1] },
            x: { ease: 'easeInOut' },
            rotate: { ease: 'linear' },
            opacity: { times: [0, 0.04, 0.3, 0.9, 1] },
          }}
        >
          <motion.div
            animate={{ scaleX: [1, 0.1, 1, -0.1, 1], scaleY: [1, 0.8, 1, 0.85, 1] }}
            transition={{ repeat: Infinity, duration: p.flipSpeed, ease: 'easeInOut' }}
            style={{
              width: p.w,
              height: p.shape === 'circle' ? p.w : p.shape === 'ribbon' ? p.h * 1.5 : p.h,
              backgroundColor: p.shape === 'star' ? 'transparent' : p.color,
              color: p.shape === 'star' ? p.color : 'transparent',
              fontSize: p.shape === 'star' ? p.w + 6 : undefined,
              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'ribbon' ? '2px 2px 1px 1px' : '2px',
              boxShadow: p.shape !== 'star' ? `0 2px 6px ${p.color}44` : undefined,
              transformOrigin: 'center center',
            }}
          >
            {p.shape === 'star' ? '⭐' : null}
          </motion.div>
        </motion.div>
      ))}

      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.div className="text-center"
          initial={{ scale: 0, opacity: 0, y: 30 }}
          animate={{
            scale: [0, 1.3, 0.9, 1.05, 1, 1, 0.6],
            opacity: [0, 1, 1, 1, 1, 1, 0],
            y: [30, -8, 3, 0, 0, 0, -40],
          }}
          transition={{ times: [0, 0.1, 0.17, 0.22, 0.28, 0.82, 1], duration: 7, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <motion.div
            animate={{ rotate: [0, 8, -8, 5, -5, 0], scale: [1, 1.1, 1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            style={{ fontSize: 'clamp(5rem, 16vw, 10rem)' }}
          >🎉</motion.div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="font-display font-black text-white"
            style={{ fontSize: 'clamp(3.5rem, 11vw, 7rem)', textShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
          >
            WOOHOO!
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -8] }}
            transition={{ delay: 0.5, duration: 5.5, times: [0, 0.1, 0.85, 1] }}
            className="font-display font-bold text-pink-200 mt-2"
            style={{ fontSize: 'clamp(1.3rem, 4vw, 2.4rem)', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
          >
            What a rockstar! 🚀
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ── 4. MASCOT overlay ─────────────────────────────────────────────────────────
function MascotOverlay({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 7000); return () => clearTimeout(t); }, [onDone]);

  const sparkles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: rand(10, 90), y: rand(15, 85), size: rand(16, 36),
    delay: rand(0.5, 3), color: pick(STAR_COLORS),
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <Backdrop opacity={0.6} color="#0f0728" />

      {sparkles.map((s) => (
        <motion.div key={s.id} className="absolute z-5"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size, color: s.color }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 0], opacity: [0, 0.9, 0], rotate: [0, 180] }}
          transition={{ delay: s.delay, duration: 1.5, ease: 'easeOut' }}
        >✦</motion.div>
      ))}

      <motion.div className="z-10 flex flex-col items-center gap-6 text-center px-8"
        initial={{ scale: 0, y: 120, opacity: 0 }}
        animate={{
          scale: [0, 1.15, 0.92, 1.04, 1, 1, 0.85],
          y: [120, -15, 5, 0, 0, 0, -80],
          opacity: [0, 1, 1, 1, 1, 1, 0],
        }}
        transition={{ times: [0, 0.1, 0.17, 0.22, 0.28, 0.82, 1], duration: 7, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          animate={{ y: [0, -18, 0, -8, 0], rotate: [0, 6, -4, 3, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          style={{ fontSize: 'clamp(6rem, 22vw, 12rem)', filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.8))' }}
        >
          🚀
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.05, 1], opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="rounded-[2.5rem] px-12 py-10 flex flex-col items-center gap-4 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(139,92,246,0.95))',
            border: '6px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 25px 70px rgba(99,102,241,0.6)',
            maxWidth: '80vw',
          }}
        >
          <div className="font-display font-black text-white"
            style={{ fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', textShadow: '0 4px 20px rgba(0,0,0,0.3)', lineHeight: 1.1 }}>
            YOU ARE<br />INCREDIBLE! ⭐
          </div>
          <div className="font-display font-bold text-indigo-100"
            style={{ fontSize: 'clamp(1.1rem, 3.5vw, 2rem)' }}>
            Super brave explorer! 💜
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── 5. BRAVE BADGE overlay ────────────────────────────────────────────────────
function BadgeOverlay({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 6500); return () => clearTimeout(t); }, [onDone]);

  const rays = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i, angle: (360 / 10) * i, delay: rand(0.1, 0.4),
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      <Backdrop opacity={0.65} color="#1a0a00" />

      <motion.div className="absolute rounded-full z-0"
        style={{ background: 'radial-gradient(circle, rgba(255,217,61,0.35), rgba(255,146,43,0.15), transparent 75%)' }}
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{ width: '130vw', height: '130vw', opacity: [0, 0.8, 0.9, 0] }}
        transition={{ duration: 6, times: [0, 0.12, 0.8, 1], ease: [0.16, 0.7, 0.35, 1] }}
      />

      {rays.map((r) => (
        <motion.div key={r.id} className="absolute z-1"
          style={{
            width: 3, height: '40vh', transformOrigin: 'bottom center',
            background: 'linear-gradient(to top, rgba(255,217,61,0.5), transparent)',
            rotate: `${r.angle}deg`,
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1, 1, 0], opacity: [0, 0.6, 0.5, 0] }}
          transition={{ delay: r.delay, duration: 4, times: [0, 0.15, 0.8, 1], ease: 'easeOut' }}
        />
      ))}

      <motion.div
        className="z-10 flex flex-col items-center gap-6 text-center px-6"
        initial={{ scale: 0, rotate: -15, opacity: 0 }}
        animate={{
          scale: [0, 1.25, 0.9, 1.06, 1, 1, 0.5],
          rotate: [-15, 4, -2, 1, 0, 0, 8],
          opacity: [0, 1, 1, 1, 1, 1, 0],
        }}
        transition={{ times: [0, 0.1, 0.17, 0.22, 0.28, 0.82, 1], duration: 6.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1, 1.06, 1], y: [0, -5, 0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          style={{ fontSize: 'clamp(6rem, 20vw, 11rem)', filter: 'drop-shadow(0 0 30px #FFD93D)' }}
        >
          🏆
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="font-display font-black"
          style={{
            fontSize: 'clamp(3.5rem, 12vw, 7.5rem)',
            background: 'linear-gradient(135deg, #FFD93D, #FF922B, #FF6B6B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
            lineHeight: 1,
          }}
        >
          SUPER<br />BRAVE!
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
          transition={{ delay: 0.3, duration: 5.2, times: [0, 0.08, 0.85, 1] }}
          className="font-display font-bold text-white"
          style={{ fontSize: 'clamp(1.4rem, 4.5vw, 2.8rem)', textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
        >
          ⭐ Brave Point Earned! ⭐
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ delay: 0.6, duration: 4.5, times: [0, 0.1, 0.85, 1] }}
          className="font-display text-yellow-300 font-medium"
          style={{ fontSize: 'clamp(1rem, 3vw, 1.8rem)', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
        >
          Keep going, champion! 🦁
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── 6. RAINBOW overlay ────────────────────────────────────────────────────────
function RainbowOverlay({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 7000); return () => clearTimeout(t); }, [onDone]);

  const sparkles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i, x: rand(5, 95), y: rand(10, 85),
    size: rand(18, 50), delay: rand(0.3, 3), color: pick(STAR_COLORS),
    driftY: rand(-15, 15),
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <Backdrop opacity={0.35} color="#0a0a1a" />

      <motion.div className="absolute left-1/2 z-10"
        style={{ transform: 'translateX(-50%)', bottom: '-25vh' }}
        initial={{ scaleX: 0, scaleY: 0, opacity: 0, y: 80 }}
        animate={{
          scaleX: [0, 0.4, 1.03, 1],
          scaleY: [0, 0.4, 1.03, 1],
          opacity: [0, 0.6, 1, 1, 0],
          y: [80, 40, -5, 0, 30],
        }}
        transition={{ times: [0, 0.12, 0.28, 0.5, 1], duration: 7, ease: [0.16, 0.8, 0.3, 1] }}
      >
        <motion.div
          animate={{ scale: [1, 1.015, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          style={{
            width: '150vw',
            height: '75vw',
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
            background: 'conic-gradient(from 180deg at 50% 100%, #FF0000 0%, #FF7700 14%, #FFFF00 28%, #00DD00 42%, #0080FF 57%, #8B00FF 71%, #FF0077 85%, #FF0000 100%)',
            opacity: 0.85,
            boxShadow: '0 0 80px rgba(255,255,255,0.3), inset 0 0 60px rgba(255,255,255,0.1)',
            marginLeft: '-25vw',
          }}
        />
      </motion.div>

      {sparkles.map((s) => (
        <motion.div key={s.id}
          className="absolute z-20"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size, color: s.color }}
          initial={{ scale: 0, opacity: 0, y: 0 }}
          animate={{
            scale: [0, 1.4, 0.8, 1.2, 0],
            opacity: [0, 1, 0.6, 0.9, 0],
            rotate: [0, 60, 140, 220, 300],
            y: [0, s.driftY * 0.5, s.driftY],
          }}
          transition={{ delay: s.delay, duration: 2.5, ease: 'easeOut' }}
        >✨</motion.div>
      ))}

      <div className="absolute inset-0 flex items-center justify-center z-30">
        <motion.div className="text-center"
          initial={{ scale: 0, opacity: 0, y: 35 }}
          animate={{
            scale: [0, 1.25, 0.92, 1.05, 1, 1, 0],
            opacity: [0, 1, 1, 1, 1, 1, 0],
            y: [35, -6, 3, 0, 0, 0, -50],
          }}
          transition={{ times: [0, 0.1, 0.17, 0.22, 0.28, 0.82, 1], duration: 7, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <motion.div
            animate={{ y: [0, -8, 0], scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
            style={{ fontSize: 'clamp(4rem, 14vw, 9rem)', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.7))' }}
          >
            🌈
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="font-display font-black text-white"
            style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', textShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            BEAUTIFUL!
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -8] }}
            transition={{ delay: 0.5, duration: 5.5, times: [0, 0.08, 0.85, 1] }}
            className="font-display font-bold text-yellow-200 mt-2"
            style={{ fontSize: 'clamp(1.2rem, 3.8vw, 2.5rem)', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
          >
            You light up the room! ✨
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ── 7. SUPERPOWER overlay ─────────────────────────────────────────────────────
function SuperpowerOverlay({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 8000); return () => clearTimeout(t); }, [onDone]);

  const sparks = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    id: i, x: rand(5, 95), y: rand(5, 95),
    delay: rand(0, 2.5),
    driftX: rand(-20, 20), driftY: rand(-30, -5),
    rotDir: Math.random() > 0.5 ? 1 : -1,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.85) 0%, rgba(0,0,0,0.9) 100%)' }}
      />

      {sparks.map((s) => (
        <motion.div key={s.id} className="absolute text-5xl z-10"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
          initial={{ scale: 0, opacity: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            scale: [0, 1.6, 0.3, 1.4, 0],
            opacity: [0, 1, 0.3, 0.9, 0],
            x: [0, s.driftX * 0.5, s.driftX],
            y: [0, s.driftY * 0.5, s.driftY],
            rotate: [0, 30 * s.rotDir, -20 * s.rotDir, 15 * s.rotDir, 0],
          }}
          transition={{
            delay: s.delay,
            duration: 1.8,
            repeat: 2,
            repeatDelay: rand(0.2, 0.6),
            ease: [0.22, 1, 0.36, 1],
          }}
        >⚡</motion.div>
      ))}

      <motion.div className="z-20 text-center px-6"
        style={{ maxWidth: '85vw' }}
        initial={{ scale: 0, opacity: 0, y: 50 }}
        animate={{
          scale: [0, 1.2, 0.9, 1.05, 1, 1, 0.75],
          opacity: [0, 1, 1, 1, 1, 1, 0],
          y: [50, -8, 3, 0, 0, 0, -80],
        }}
        transition={{ times: [0, 0.1, 0.16, 0.21, 0.27, 0.82, 1], duration: 8, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          animate={{
            scale: [1, 1.15, 1, 1.08, 1],
            filter: [
              'drop-shadow(0 0 30px #FFD700)',
              'drop-shadow(0 0 55px #FFD700)',
              'drop-shadow(0 0 35px #FFD700)',
              'drop-shadow(0 0 50px #FFD700)',
              'drop-shadow(0 0 30px #FFD700)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{ fontSize: 'clamp(6rem, 22vw, 13rem)' }}
        >
          🦸
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="font-display font-black text-white"
          style={{ fontSize: 'clamp(2.5rem, 9vw, 6rem)', textShadow: '0 0 40px rgba(99,102,241,0.9), 0 8px 32px rgba(0,0,0,0.6)', lineHeight: 1.1 }}
        >
          YOU JUST<br />UNLOCKED
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, 0] }}
          transition={{ delay: 0.4, duration: 6.5, times: [0, 0.08, 0.85, 1] }}
          className="font-display font-black mt-2"
          style={{
            fontSize: 'clamp(2.5rem, 9vw, 6rem)',
            background: 'linear-gradient(135deg, #FFD700, #FF922B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))',
          }}
        >YOUR SUPERPOWER!</motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ delay: 0.7, duration: 5.5, times: [0, 0.1, 0.85, 1] }}
          className="font-display font-bold text-indigo-100 mt-4"
          style={{ fontSize: 'clamp(1.2rem, 3.5vw, 2.2rem)', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
        >
          Only the bravest kids have this power 💜
        </motion.div>
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

export default function OverlayEngine({ socket, childName }) {
  const [activeOverlay, setActiveOverlay]   = useState(null);
  const [overlayKey, setOverlayKey]         = useState(0);
  const [bravePoints, setBravePoints]       = useState(0);
  const [stars, setStars]                   = useState(0);
  const [braveToast, setBraveToast]         = useState(false);
  const [starToast, setStarToast]           = useState(false);
  const [starToastCount, setStarToastCount] = useState(0);
  const overlayActiveRef = useRef(false);

  const showOverlay = useCallback((type) => {
    overlayActiveRef.current = true;
    setActiveOverlay(type);
    setOverlayKey((k) => k + 1);
  }, []);

  const dismissOverlay = useCallback(() => {
    stopOverlaySound();
    overlayActiveRef.current = false;
    setActiveOverlay(null);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onOverlay = ({ type, initiator }) => {
      const overlayType = type || 'balloons';
      showOverlay(overlayType);
      const mode = initiator === 'auto' ? null : 'full';
      playOverlaySound(overlayType, mode);
    };

    const onStar = ({ total }) => {
      setStars(total);
      setStarToastCount(total);
      setStarToast(true);
      setTimeout(() => setStarToast(false), 4000);
      playStarSound(childName);
      // Only fire star overlay when no other overlay is already playing
      if (!overlayActiveRef.current) {
        showOverlay('stars');
      }
    };

    const onBravePoint = ({ total }) => {
      setBravePoints(total);
      setBraveToast(true);
      setTimeout(() => setBraveToast(false), 3500);
    };

    socket.on('trigger:overlay', onOverlay);
    socket.on('award:star',      onStar);
    socket.on('award:brave_point', onBravePoint);

    return () => {
      socket.off('trigger:overlay', onOverlay);
      socket.off('award:star',      onStar);
      socket.off('award:brave_point', onBravePoint);
    };
  }, [socket, childName, showOverlay]);

  const OverlayComponent = activeOverlay ? (OVERLAY_MAP[activeOverlay] || BalloonOverlay) : null;

  return (
    <>
      <AnimatePresence>
        {OverlayComponent && (
          <OverlayComponent key={overlayKey} onDone={dismissOverlay} />
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
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 text-white rounded-3xl px-10 py-6 shadow-2xl font-display font-black pointer-events-none text-center"
            style={{
              fontSize: 'clamp(1.3rem, 4vw, 2rem)',
              background: 'linear-gradient(135deg, #F59E0B, #FF922B)',
              boxShadow: '0 12px 40px rgba(245,158,11,0.5)',
            }}
            initial={{ y: 80, opacity: 0, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, scale: [0.6, 1.15, 1] }}
            exit={{ y: 80, opacity: 0, scale: 0.8 }}
          >
            <div style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>⭐</div>
            <div>{childName ? `${childName}, ` : ''}You earned a Star!</div>
            <div style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)', opacity: 0.85, fontWeight: 600, marginTop: 4 }}>
              Total stars: {starToastCount} ⭐
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
