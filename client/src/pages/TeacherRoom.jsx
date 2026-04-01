import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';
import TriggerPanel from '../components/dashboard/TriggerPanel';
import AlertLog from '../components/dashboard/AlertLog';
import JoinModal from '../components/common/JoinModal';
import Leaderboard from '../components/dashboard/Leaderboard';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

const EMOTION_ICONS = {
  happy: '😄',
  okay: '🙂',
  sad: '😢',
  grumpy: '😤',
  null: '😶',
};

const MOOD_WEATHER = {
  calm: { icon: '☀️', label: 'Calm', color: '#10B981' },
  slightly_off: { icon: '⛅', label: 'Slight Wobble', color: '#F59E0B' },
  distress: { icon: '🌧️', label: 'Needs Attention', color: '#EF4444' },
};

export default function TeacherRoom() {
  const navigate = useNavigate();
  const socket = getSocket();

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('join'); // join | classroom
  const [teacherName, setTeacherName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const [children, setChildren] = useState([]); // [{ socketId, name, emotion, bravePoints, mood }]
  const [alertLog, setAlertLog] = useState([]);
  const [activePanel, setActivePanel] = useState('trigger'); // trigger | alerts
  const [newAlertCount, setNewAlertCount] = useState(0);
  const [panicAlerts, setPanicAlerts] = useState([]);

  // ── Create session and join ────────────────────────────────────────────────
  const handleJoin = useCallback(({ name }) => {
    setJoining(true);
    setJoinError(null);
    setTeacherName(name);

    fetch(`${SERVER_URL}/api/session/create`, { method: 'POST' })
      .then((r) => r.json())
      .then(({ code }) => {
        setSessionCode(code);
        socket.emit('join:session', { code, role: 'teacher', name });
        setJoining(false);
        setPhase('classroom');
      })
      .catch(() => {
        setJoining(false);
        setJoinError('Could not create session. Is the server running?');
      });
  }, [socket]);

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleChildJoined = ({ socketId, name, emotion }) => {
      setChildren((prev) => {
        if (prev.find((c) => c.socketId === socketId)) return prev;
        return [...prev, { socketId, name, emotion, bravePoints: 0, stars: 0, mood: 'calm' }];
      });
    };

    const handleChildLeft = ({ socketId }) => {
      setChildren((prev) => prev.filter((c) => c.socketId !== socketId));
    };

    const handleChildCheckin = ({ socketId, emotion }) => {
      setChildren((prev) =>
        prev.map((c) => (c.socketId === socketId ? { ...c, emotion } : c))
      );
    };

    const handleDistressAlert = ({ childSocketId, childName, confidence, timestamp, overlayFired }) => {
      const entry = {
        type: 'distress_auto',
        childName,
        childSocketId,
        overlayType: overlayFired,
        confidence,
        timestamp,
        initiator: 'auto',
      };
      setAlertLog((prev) => [...prev, entry]);
      setChildren((prev) =>
        prev.map((c) => (c.socketId === childSocketId ? { ...c, mood: 'distress' } : c))
      );
      // Reset mood after 15 seconds
      setTimeout(() => {
        setChildren((prev) =>
          prev.map((c) => (c.socketId === childSocketId ? { ...c, mood: 'calm' } : c))
        );
      }, 15000);
      if (activePanel !== 'alerts') setNewAlertCount((n) => n + 1);
    };

    const handleChildBravePoint = ({ childSocketId, childName, total }) => {
      setChildren((prev) =>
        prev.map((c) => (c.socketId === childSocketId ? { ...c, bravePoints: total } : c))
      );
    };

    const handleParentPanic = ({ childName, timestamp }) => {
      const entry = { childName, timestamp };
      setPanicAlerts((prev) => [...prev, entry]);
      setAlertLog((prev) => [...prev, {
        type: 'parent_panic',
        childName,
        timestamp,
      }]);
      setTimeout(() => setPanicAlerts((prev) => prev.filter((a) => a.timestamp !== timestamp)), 10000);
    };

    const handleTriggerConfirmed = ({ childName, overlayType }) => {
      setAlertLog((prev) => [...prev, {
        type: 'manual_individual',
        childName,
        overlayType,
        timestamp: new Date().toISOString(),
        initiator: 'teacher',
      }]);
    };

    // Broadcast confirmed — update star counts for all children (broadcast awards +1 each)
    const handleBroadcastConfirmed = ({ childrenUpdated }) => {
      if (!childrenUpdated) return;
      setChildren((prev) => prev.map((c) => {
        const updated = childrenUpdated.find((u) => u.socketId === c.socketId);
        return updated ? { ...c, stars: updated.stars || c.stars } : c;
      }));
    };

    // Individual star update
    const handleStarUpdated = ({ childSocketId, total }) => {
      setChildren((prev) => prev.map((c) => c.socketId === childSocketId ? { ...c, stars: total } : c));
    };

    socket.on('child:joined',        handleChildJoined);
    socket.on('child:left',          handleChildLeft);
    socket.on('child:checkin',       handleChildCheckin);
    socket.on('alert:distress',      handleDistressAlert);
    socket.on('child:brave_point',   handleChildBravePoint);
    socket.on('alert:parent_panic',  handleParentPanic);
    socket.on('trigger:confirmed',   handleTriggerConfirmed);
    socket.on('broadcast:confirmed', handleBroadcastConfirmed);
    socket.on('child:star_updated',  handleStarUpdated);

    return () => {
      socket.off('child:joined',        handleChildJoined);
      socket.off('child:left',          handleChildLeft);
      socket.off('child:checkin',       handleChildCheckin);
      socket.off('alert:distress',      handleDistressAlert);
      socket.off('child:brave_point',   handleChildBravePoint);
      socket.off('alert:parent_panic',  handleParentPanic);
      socket.off('trigger:confirmed',   handleTriggerConfirmed);
      socket.off('broadcast:confirmed', handleBroadcastConfirmed);
      socket.off('child:star_updated',  handleStarUpdated);
    };
  }, [socket, activePanel]);

  const switchPanel = (panel) => {
    setActivePanel(panel);
    if (panel === 'alerts') setNewAlertCount(0);
  };

  const jitsiUrl = sessionCode
    ? `https://meet.jit.si/leapboard${sessionCode.toLowerCase()}` +
      `#config.prejoinPageEnabled=false` +
      `&config.lobby.enabled=false` +
      `&config.startWithAudioMuted=false` +
      `&config.disableInitialGUM=false` +
      `&config.enableWelcomePage=false` +
      `&userInfo.displayName=${encodeURIComponent('🎓 ' + teacherName)}` +
      `&userInfo.email=teacher-${sessionCode}@leapboard.app`
    : null;

  const copyCode = () => {
    navigator.clipboard.writeText(sessionCode).catch(() => {});
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col" style={{ fontFamily: 'Nunito, sans-serif' }}>
      {/* Join Modal */}
      <AnimatePresence>
        {phase === 'join' && (
          <JoinModal
            role="teacher"
            onJoin={handleJoin}
            loading={joining}
            error={joinError}
          />
        )}
      </AnimatePresence>

      {phase === 'classroom' && (
        <>
          {/* Leaderboard modal */}
          <AnimatePresence>
            {showLeaderboard && (
              <Leaderboard
                sessionCode={sessionCode}
                teacherName={teacherName}
                onClose={() => setShowLeaderboard(false)}
              />
            )}
          </AnimatePresence>

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white font-display text-sm transition-colors">
              ← Exit
            </button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <span className="font-display font-black text-white text-lg">Leapboard</span>
              <span className="text-gray-600">|</span>
              <span className="font-display text-gray-400 text-sm">{teacherName}</span>
            </div>
            {/* Right side: code + end class */}
            <div className="flex items-center gap-2">
              <button
                onClick={copyCode}
                className="flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 border border-indigo-700 rounded-xl px-3 py-1.5 transition-colors group"
              >
                <span className="font-display text-indigo-300 text-xs">Code:</span>
                <span className="font-display font-black text-white text-sm tracking-widest">{sessionCode}</span>
                <span className="text-indigo-400 text-xs group-hover:text-white transition-colors">📋</span>
              </button>
              <motion.button
                onClick={() => setShowLeaderboard(true)}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}
              >
                🏆 End Class
              </motion.button>
            </div>
          </div>

          {/* Parent panic alerts */}
          <AnimatePresence>
            {panicAlerts.map((alert) => (
              <motion.div
                key={alert.timestamp}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-orange-500 text-white px-4 py-2 flex items-center gap-2 font-display font-bold text-sm shrink-0"
              >
                <span>🆘</span>
                <span>Parent flagged: <strong>{alert.childName}</strong> may need attention</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Main layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Video area — left */}
            <div className="flex-1 relative overflow-hidden">
              {jitsiUrl && (
                <iframe
                  src={jitsiUrl}
                  className="w-full h-full"
                  allow="camera; microphone; display-capture; fullscreen"
                  style={{ border: 'none', minHeight: 'calc(100vh - 52px)' }}
                  title="Teacher Classroom"
                />
              )}
            </div>

            {/* Dashboard sidebar — right */}
            <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden shrink-0">
              {/* Children grid */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">👥</span>
                  <span className="font-display font-bold text-gray-400 text-xs uppercase tracking-wide">
                    Class ({children.length})
                  </span>
                </div>
                {children.length === 0 ? (
                  <p className="text-gray-600 text-sm font-display text-center py-2">
                    Waiting for students to join…
                    <br />
                    Share code: <span className="font-black text-gray-400">{sessionCode}</span>
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {children.map((child) => {
                      const mood = MOOD_WEATHER[child.mood] || MOOD_WEATHER.calm;
                      return (
                        <div
                          key={child.socketId}
                          className="rounded-2xl p-2.5 flex flex-col gap-1"
                          style={{
                            background: child.mood === 'distress' ? '#1F0000' : '#1F2937',
                            border: `2px solid ${child.mood === 'distress' ? '#EF444440' : '#374151'}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg">{mood.icon}</span>
                            <span className="text-xs" title={`Emotion: ${child.emotion || 'unknown'}`}>
                              {EMOTION_ICONS[child.emotion] || EMOTION_ICONS['null']}
                            </span>
                          </div>
                          <p className="font-display font-bold text-white text-xs truncate">{child.name}</p>
                          <div className="flex gap-2 text-xs text-gray-500">
                            <span>⭐{child.stars || 0}</span>
                            <span>💜{child.bravePoints || 0}</span>
                          </div>
                          {child.mood === 'distress' && (
                            <div className="text-xs text-red-400 font-display font-bold animate-pulse">
                              Needs attention
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Panel tabs */}
              <div className="flex border-b border-gray-800 shrink-0">
                {[
                  { key: 'trigger', label: '✨ Triggers' },
                  { key: 'alerts', label: `📋 Alerts${newAlertCount > 0 ? ` (${newAlertCount})` : ''}` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => switchPanel(tab.key)}
                    className="flex-1 py-2.5 font-display font-bold text-xs transition-colors"
                    style={{
                      background: activePanel === tab.key ? '#1F2937' : 'transparent',
                      color: activePanel === tab.key ? '#E5E7EB' : '#6B7280',
                      borderBottom: activePanel === tab.key ? '2px solid #6366F1' : '2px solid transparent',
                    }}
                  >
                    {tab.label}
                    {tab.key === 'alerts' && newAlertCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {newAlertCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                {activePanel === 'trigger' && (
                  <TriggerPanel
                    socket={socket}
                    children={children}
                    onTriggered={(entry) =>
                      setAlertLog((prev) => [...prev, { ...entry, timestamp: new Date().toISOString() }])
                    }
                  />
                )}
                {activePanel === 'alerts' && <AlertLog alerts={alertLog} />}
              </div>

              {/* Session info footer */}
              <div className="px-4 py-3 border-t border-gray-800 shrink-0">
                <div className="flex items-center justify-between text-xs text-gray-600 font-display">
                  <span>Share code with parents:</span>
                  <span className="font-black text-gray-400">{sessionCode}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
