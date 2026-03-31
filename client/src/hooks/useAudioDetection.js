import { useEffect, useRef, useState, useCallback } from 'react';

const VOLUME_THRESHOLD = 0.15;       // RMS amplitude threshold
const DISTRESS_DURATION_MS = 1500;   // must persist for 1.5 seconds
const COOLDOWN_MS = 45000;           // 45 second cooldown between auto-triggers

export function useAudioDetection({ enabled = true, onDistress }) {
  const [listening, setListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [cooldown, setCooldown] = useState(false);

  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const frameRef = useRef(null);
  const distressStartRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  const startCooldown = useCallback(() => {
    setCooldown(true);
    cooldownTimerRef.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
  }, []);

  const analyse = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(dataArray);

    // Calculate RMS (root mean square) volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i];
    const rms = Math.sqrt(sum / bufferLength);

    setVolume(rms);

    if (!cooldown && rms > VOLUME_THRESHOLD) {
      if (!distressStartRef.current) {
        distressStartRef.current = Date.now();
      } else if (Date.now() - distressStartRef.current > DISTRESS_DURATION_MS) {
        // Distress confirmed — fire callback
        distressStartRef.current = null;
        startCooldown();
        if (onDistress) onDistress({ confidence: Math.min(rms / 0.4, 1) });
      }
    } else {
      distressStartRef.current = null;
    }

    frameRef.current = requestAnimationFrame(analyse);
  }, [cooldown, onDistress, startCooldown]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        streamRef.current = stream;
        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;

        setListening(true);
        frameRef.current = requestAnimationFrame(analyse);
      })
      .catch((err) => {
        console.warn('Microphone access denied:', err.message);
      });

    return () => {
      active = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      setListening(false);
    };
  }, [enabled, analyse]);

  // Manual "simulate distress" — for demo purposes
  const simulateDistress = useCallback(() => {
    if (cooldown) return;
    startCooldown();
    if (onDistress) onDistress({ confidence: 0.92, simulated: true });
  }, [cooldown, onDistress, startCooldown]);

  return { listening, volume, cooldown, simulateDistress };
}
