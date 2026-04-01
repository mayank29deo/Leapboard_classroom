// Plays a short musical jingle + speaks a rhyme using Web Audio API + SpeechSynthesis
// Zero external files — works fully offline

// ── Rhymes per overlay type ───────────────────────────────────────────────────
const RHYMES = {
  balloons:   "Up, up and away! You're having a wonderful day! 🎈",
  stars:      "Twinkle twinkle, superstar — look how amazing you are! ⭐",
  confetti:   "Hooray hooray, it's a wonderful day — you rock it every single way! 🎉",
  mascot:     "You are brave, you are strong, you always belong! 🚀",
  badge:      "Super brave, through and through — we are so proud of you! 🏆",
  rainbow:    "After every cloud and rain, a beautiful rainbow comes again! 🌈",
  superpower: "You've got the power, you've got the light — you shine so incredibly bright! 🦸",
  celebration:"Everybody clap and cheer — the best student is right here! 🎊",
  energy_blast:"Let's go, let's glow, let's put on a show! ⚡",
};

// ── Note frequencies (Hz) ─────────────────────────────────────────────────────
const NOTES = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

// ── Jingle sequences per overlay ─────────────────────────────────────────────
const JINGLES = {
  balloons:    [['C4',0.15],['E4',0.15],['G4',0.15],['C5',0.3],['G4',0.15],['C5',0.4]],
  stars:       [['C5',0.12],['C5',0.12],['G4',0.25],['G4',0.12],['A4',0.12],['A4',0.25],['G4',0.5]],
  confetti:    [['C4',0.1],['D4',0.1],['E4',0.1],['F4',0.1],['G4',0.1],['A4',0.1],['B4',0.1],['C5',0.45]],
  mascot:      [['E4',0.2],['G4',0.2],['C5',0.2],['E5',0.5],['C5',0.15],['E5',0.4]],
  badge:       [['G4',0.15],['C5',0.15],['E5',0.15],['G5',0.5],['E5',0.2],['G5',0.6]],
  rainbow:     [['C4',0.18],['E4',0.18],['G4',0.18],['C5',0.18],['E5',0.18],['G5',0.5]],
  superpower:  [['C4',0.08],['E4',0.08],['G4',0.08],['C5',0.08],['E5',0.08],['G5',0.08],['C5',0.12],['E5',0.35]],
  celebration: [['C4',0.1],['D4',0.1],['E4',0.1],['F4',0.1],['G4',0.2],['G4',0.2],['A4',0.1],['A4',0.1],['G4',0.4]],
  energy_blast:[['G4',0.1],['A4',0.1],['B4',0.1],['C5',0.1],['D5',0.1],['E5',0.1],['D5',0.1],['C5',0.3]],
};

function playJingle(audioCtx, overlayType) {
  const sequence = JINGLES[overlayType] || JINGLES.balloons;
  let time = audioCtx.currentTime + 0.05;

  sequence.forEach(([note, dur]) => {
    const osc    = audioCtx.createOscillator();
    const gainNd = audioCtx.createGain();

    osc.connect(gainNd);
    gainNd.connect(audioCtx.destination);

    osc.type      = 'sine';
    osc.frequency.setValueAtTime(NOTES[note] || 440, time);

    gainNd.gain.setValueAtTime(0, time);
    gainNd.gain.linearRampToValueAtTime(0.28, time + 0.02);
    gainNd.gain.exponentialRampToValueAtTime(0.001, time + dur - 0.02);

    osc.start(time);
    osc.stop(time + dur);

    time += dur;
  });

  return time; // returns when jingle ends
}

function speakRhyme(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utterance      = new SpeechSynthesisUtterance(text);
  utterance.rate       = 0.92;
  utterance.pitch      = 1.25;   // slightly high — child-friendly
  utterance.volume     = 0.9;

  // Pick a friendly voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Samantha') ||
    v.name.includes('Karen') ||
    v.name.includes('Moira') ||
    v.name.includes('Victoria') ||
    (v.lang.startsWith('en') && v.localService)
  );
  if (preferred) utterance.voice = preferred;

  // Slight delay so jingle starts first
  setTimeout(() => window.speechSynthesis.speak(utterance), 800);
}

// ── Public API ────────────────────────────────────────────────────────────────
let sharedAudioCtx = null;

// Modes: 'silent' | 'jingle' | 'rhyme' | 'full'
// Weights: silent 25%, jingle-only 25%, rhyme-only 25%, full 25%
const MODES = ['silent', 'jingle', 'rhyme', 'full'];

export function playOverlaySound(overlayType, forceMode = null) {
  const mode = forceMode || MODES[Math.floor(Math.random() * MODES.length)];
  if (mode === 'silent') return;

  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();

    if (mode === 'jingle' || mode === 'full') {
      playJingle(sharedAudioCtx, overlayType);
    }
    if (mode === 'rhyme' || mode === 'full') {
      // If full mode, delay rhyme slightly so jingle starts first
      const delay = mode === 'full' ? 1000 : 300;
      setTimeout(() => speakRhyme(RHYMES[overlayType] || RHYMES.balloons), delay);
    }
  } catch (e) {
    // Audio not available — silently skip
  }
}

// Always plays jingle + rhyme (used for star awards — special moment)
export function playStarSound(childName) {
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
    playJingle(sharedAudioCtx, 'stars');
    const msg = childName
      ? `${childName}, you just earned a star! Brilliant work!`
      : `You just earned a star! Brilliant work! ⭐`;
    setTimeout(() => speakRhyme(msg), 900);
  } catch (e) {}
}

export function stopOverlaySound() {
  try {
    window.speechSynthesis?.cancel();
  } catch (_) {}
}
