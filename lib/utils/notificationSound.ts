let audioContext: AudioContext | null = null;
let audioElement: HTMLAudioElement | null = null;
let lastSoundId: string | null = null;

const SOUND_VOLUME = 0.6;
const TONE_FREQUENCY = 880;
const TONE_DURATION_SEC = 0.18;
const SOUND_URL = '/api/notification-sound';

// Enhanced sound definitions
type SoundType = 'chime' | 'ping' | 'soft' | 'success' | 'error' | 'complete';

const TONE_MAP: Record<string, { frequency: number; duration: number; volume: number }> = {
  chime: { frequency: 880, duration: 0.18, volume: 0.6 },
  ping: { frequency: 1046, duration: 0.14, volume: 0.6 },
  soft: { frequency: 660, duration: 0.42, volume: 0.5 },
  // Simple fallbacks for the API route (though we'll prefer client-side synthesis for these)
  success: { frequency: 880, duration: 0.3, volume: 0.6 },
  error: { frequency: 150, duration: 0.4, volume: 0.6 },
  complete: { frequency: 1046, duration: 0.4, volume: 0.6 },
};

const getAudioElement = (soundId: string) => {
  if (typeof window === 'undefined') return null;

  if (!audioElement || lastSoundId !== soundId) {
    audioElement = new Audio(`${SOUND_URL}?tone=${encodeURIComponent(soundId)}`);
    audioElement.preload = 'auto';
    audioElement.volume = SOUND_VOLUME;
    lastSoundId = soundId;
  }

  return audioElement;
};

export async function primeNotificationSound(soundId = 'chime') {
  const audio = getAudioElement(soundId);
  if (!audio) return;

  try {
    const previousMuted = audio.muted;
    audio.muted = true;
    audio.currentTime = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.muted = previousMuted;
  } catch (error) {
    // Ignore priming failures; actual play can still work later.
  }
}

// Advanced synthesis for pleasant sounds
async function playComplexSound(ctx: AudioContext, type: string) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(SOUND_VOLUME, now);

  const playOsc = (
    freq: number,
    type: OscillatorType,
    startTime: number,
    duration: number,
    vol: number = 1
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(vol, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  };

  switch (type) {
    case 'success':
      // Major chord (C5, E5, G5) with bell-like envelope
      playOsc(523.25, 'sine', now, 0.4, 0.8); // C5
      playOsc(659.25, 'sine', now + 0.05, 0.4, 0.6); // E5
      playOsc(783.99, 'sine', now + 0.1, 0.6, 0.5); // G5
      break;

    case 'error':
      // Low dissonant sound
      playOsc(150, 'sawtooth', now, 0.3, 0.4);
      playOsc(145, 'sawtooth', now, 0.3, 0.4); // Dissonance
      break;

    case 'complete':
      // Rising cheerful sequence
      playOsc(523.25, 'sine', now, 0.15, 0.6); // C5
      playOsc(659.25, 'sine', now + 0.15, 0.15, 0.6); // E5
      playOsc(783.99, 'sine', now + 0.3, 0.15, 0.6); // G5
      playOsc(1046.5, 'sine', now + 0.45, 0.3, 0.5); // C6
      break;

    case 'chime':
    default:
      // Standard chime
      playOsc(880, 'sine', now, 0.18, 0.6);
      break;
  }
}

export async function playNotificationSound(soundId = 'chime') {
  if (typeof window === 'undefined') return;

  // Prefer Web Audio API for complex sounds or if available
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (AudioContextClass) {
    try {
      if (!audioContext) {
        audioContext = new AudioContextClass();
      }

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (['success', 'error', 'complete'].includes(soundId)) {
        await playComplexSound(audioContext, soundId);
        return;
      }

      // Legacy simple tone logic for other IDs (or fallback)
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      const tone = TONE_MAP[soundId] || {
        frequency: TONE_FREQUENCY,
        duration: TONE_DURATION_SEC,
        volume: SOUND_VOLUME,
      };

      oscillator.type = 'sine';
      oscillator.frequency.value = tone.frequency;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(tone.volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.duration);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + tone.duration + 0.01);
      return;
    } catch (error) {
      console.warn('Web Audio playback failed, falling back to audio element:', error);
    }
  }

  // Fallback to Audio Element (mostly for simple tones if Web Audio fails)
  const audio = getAudioElement(soundId);
  if (audio) {
    try {
      audio.currentTime = 0;
      audio.volume = SOUND_VOLUME;
      await audio.play();
    } catch (error) {
      // Silent fail
    }
  }
}
