const DEFAULT_SOUND_VOLUME = 0.9;
const DEFAULT_TONE_FREQUENCY = 880;
const DEFAULT_TONE_DURATION_SEC = 0.18;
const SAMPLE_RATE = 44100;

const writeString = (view: DataView, offset: number, value: string) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
};

const buildWavBuffer = (tone: { frequency: number; duration: number; volume: number }) => {
  const totalSamples = Math.floor(SAMPLE_RATE * tone.duration);
  const bytesPerSample = 2;
  const dataSize = totalSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / SAMPLE_RATE;
    const sample = Math.sin(2 * Math.PI * tone.frequency * t);
    const amplitude = Math.max(-1, Math.min(1, sample * tone.volume));
    view.setInt16(offset, amplitude * 32767, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const toneId = url.searchParams.get('tone') || 'chime';
  const toneMap: Record<string, { frequency: number; duration: number; volume: number }> = {
    chime: { frequency: 880, duration: 0.18, volume: DEFAULT_SOUND_VOLUME },
    ping: { frequency: 1046, duration: 0.14, volume: DEFAULT_SOUND_VOLUME },
    soft: { frequency: 660, duration: 0.22, volume: 0.7 },
  };
  const tone = toneMap[toneId] || {
    frequency: DEFAULT_TONE_FREQUENCY,
    duration: DEFAULT_TONE_DURATION_SEC,
    volume: DEFAULT_SOUND_VOLUME,
  };
  const wavBuffer = buildWavBuffer(tone);
  return new Response(wavBuffer, {
    headers: {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
