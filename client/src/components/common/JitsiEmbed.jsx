import { useEffect, useMemo, useRef, useState } from 'react';

const JITSI_API_SRC = 'https://meet.jit.si/external_api.js';

function loadJitsiApiScript() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve(window.JitsiMeetExternalAPI);

  const existing = document.querySelector(`script[src="${JITSI_API_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(window.JitsiMeetExternalAPI), { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JITSI_API_SRC;
    s.async = true;
    s.onload = () => resolve(window.JitsiMeetExternalAPI);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function JitsiEmbed({
  roomName,
  displayName,
  email,
  className,
  style,
}) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [ready, setReady] = useState(false);

  const userInfo = useMemo(() => ({
    displayName: displayName || undefined,
    email: email || undefined,
  }), [displayName, email]);

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      if (!roomName || !containerRef.current) return;
      setReady(false);

      const JitsiMeetExternalAPI = await loadJitsiApiScript();
      if (cancelled || !containerRef.current) return;

      // Ensure a clean mount (important during HMR / route transitions)
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch (_) {}
        apiRef.current = null;
      }
      containerRef.current.innerHTML = '';

      const api = new JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        userInfo,
        configOverwrite: {
          prejoinPageEnabled: false,
          enableWelcomePage: false,
          disableInitialGUM: false,
          startWithAudioMuted: false,
          lobby: { enabled: false },
        },
      });

      apiRef.current = api;
      setReady(true);
    }

    mount().catch(() => {
      if (!cancelled) setReady(false);
    });

    return () => {
      cancelled = true;
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch (_) {}
        apiRef.current = null;
      }
    };
  }, [roomName, userInfo]);

  return (
    <div className={className} style={{ ...style, position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0 }}
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          Loading video…
        </div>
      )}
    </div>
  );
}

