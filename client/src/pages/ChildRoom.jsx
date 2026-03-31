import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';
import OverlayEngine from '../components/overlays/OverlayEngine';
import FeelingCorner from '../components/classroom/FeelingCorner';
import JoinModal from '../components/common/JoinModal';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function ChildRoom() {
  const navigate = useNavigate();
  const socket = getSocket();

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('join'); // join | feeling | classroom
  const [childName, setChildName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [joinError, setJoinError] = useState(null);
  const [joining, setJoining] = useState(false);

  // Audio detection
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [volume, setVolume] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const frameRef = useRef(null);
  const distressStartRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  // Jitsi room URL
  const jitsiUrl = sessionCode
    ? `https://meet.jit.si/leapboard${sessionCode.toLowerCase()}` +
      `#config.prejoinPageEnabled=false` +
      `&config.lobby.enabled=false` +
      `&config.startWithAudioMuted=false` +
      `&config.disableInitialGUM=false` +
      `&config.enableWelcomePage=false` +
      `&userInfo.displayName=${encodeURIComponent('⭐ ' + childName)}` +
      `&userInfo.email=child-${childName.toLowerCase().replace(/\s+/g, '')}-${sessionCode}@leapboard.app`
    : null;

  // ── Join handler ───────────────────────────────────────────────────────────
  const handleJoin = useCallback(({ name, code }) => {
    setJoining(true);
    setJoinError(null);
    setChildName(name);
    setSessionCode(code);

    // Validate session first
    fetch(`${SERVER_URL}/api/session/${code}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => {
        socket.emit('join:session', { code, role: 'child', name });
        setJoining(false);
        setPhase('feeling');
      })
      .catch(() => {
        setJoining(false);
        setJoinError('Class not found. Check your code and try again.');
      });
  }, [socket]);

  // Socket events
  useEffect(() => {
    socket.on('joined:child', () => {});
    socket.on('error:session', ({ message }) => {
      setJoinError(message);
      setJoining(false);
    });
    return () => {
      socket.off('joined:child');
      socket.off('error:session');
    };
  }, [socket]);

  // ── Feeling Corner done ────────────────────────────────────────────────────
  const handleCheckin = useCallback((emotion) => {
    socket.emit('checkin:emotion', { emotion });
    setTimeout(() => {
      setPhase('classroom');
      setAudioEnabled(true);
    }, 1200);
  }, [socket]);

  // ── Audio Detection ────────────────────────────────────────────────────────
  const VOLUME_THRESHOLD = 0.18;
  const DISTRESS_DURATION_MS = 1500;
  const COOLDOWN_MS = 45000;

  const startCooldown = useCallback(() => {
    setCooldown(true);
    cooldownTimerRef.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
  }, []);

  const analyse = useCallback(() => {
    if (!analyserRef.current) return;
    const bufferLength = analyserRef.current.fftSize;
    const data = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / bufferLength);
    setVolume(rms);

    if (!cooldown && rms > VOLUME_THRESHOLD) {
      if (!distressStartRef.current) {
        distressStartRef.current = Date.now();
      } else if (Date.now() - distressStartRef.current > DISTRESS_DURATION_MS) {
        distressStartRef.current = null;
        startCooldown();
        socket.emit('distress:detected', { confidence: Math.min(rms / 0.4, 1) });
      }
    } else {
      distressStartRef.current = null;
    }
    frameRef.current = requestAnimationFrame(analyse);
  }, [cooldown, socket, startCooldown]);

  useEffect(() => {
    if (!audioEnabled) return;
    let active = true;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
      if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      streamRef.current = stream;
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      frameRef.current = requestAnimationFrame(analyse);
    }).catch(() => {});

    return () => {
      active = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [audioEnabled, analyse]);

  // Demo button: simulate distress
  const simulateDistress = useCallback(() => {
    if (cooldown) return;
    startCooldown();
    socket.emit('distress:detected', { confidence: 0.92, simulated: true });
  }, [cooldown, socket, startCooldown]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col" style={{ fontFamily: 'Nunito, sans-serif' }}>
      {/* Join Modal */}
      <AnimatePresence>
        {phase === 'join' && (
          <JoinModal
            role="child"
            onJoin={handleJoin}
            loading={joining}
            error={joinError}
          />
        )}
      </AnimatePresence>

      {/* Feeling Corner */}
      <AnimatePresence>
        {phase === 'feeling' && (
          <FeelingCorner onCheckin={handleCheckin} childName={childName} />
        )}
      </AnimatePresence>

      {/* Classroom */}
      {phase === 'classroom' && (
        <>
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 shrink-0">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white font-display text-sm transition-colors"
            >
              ← Leave
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🚀</span>
              <span className="font-display font-black text-white text-lg">Leapboard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-gray-400 text-sm">Hi, {childName}!</span>
              {/* Mic indicator */}
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  volume > 0.05 ? 'bg-green-400' : 'bg-gray-600'
                }`}
              />
            </div>
          </div>

          {/* Video area */}
          <div className="flex-1 relative overflow-hidden">
            {jitsiUrl ? (
              <iframe
                src={jitsiUrl}
                className="w-full h-full"
                allow="camera; microphone; display-capture; fullscreen"
                style={{ border: 'none', minHeight: 'calc(100vh - 56px)' }}
                title="Class Room"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Loading...
              </div>
            )}

            {/* Overlay Engine — sits on top of iframe */}
            <OverlayEngine socket={socket} />

            {/* Mascot corner — always present */}
            <motion.div
              className="fixed bottom-6 left-6 z-30 pointer-events-none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, type: 'spring', bounce: 0.5 }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                🚀
              </div>
            </motion.div>

            {/* Demo button (visible only in dev / demo mode) */}
            {import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true' ? (
              <motion.button
                onClick={simulateDistress}
                disabled={cooldown}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 z-30 px-4 py-2.5 rounded-2xl font-display font-bold text-sm text-white shadow-xl disabled:opacity-40"
                style={{
                  background: cooldown
                    ? '#6B7280'
                    : 'linear-gradient(135deg, #EF4444, #FF6B6B)',
                }}
                title="Simulate distress detection (demo)"
              >
                {cooldown ? '⏳ Cooldown' : '🎭 Simulate Cry'}
              </motion.button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
