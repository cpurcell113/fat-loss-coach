import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  voiceEnabled: boolean;
  isSupported: boolean;
  error: string | null;
}

const VOICE_PREF_KEY = 'allin_voice_enabled';

// Use type assertions to avoid missing lib dom types for speech API
type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): (new () => SpeechRecognitionType) | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useVoice() {
  const [state, setState] = useState<VoiceState>(() => ({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    voiceEnabled: localStorage.getItem(VOICE_PREF_KEY) !== 'false',
    isSupported: typeof window !== 'undefined' && !!(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    ),
    error: null,
  }));

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setState(s => ({ ...s, error: 'Voice input not supported on this device' }));
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () =>
      setState(s => ({ ...s, isListening: true, transcript: '', error: null }));

    recognition.onresult = (e) => {
      const t = Array.from(e.results as ArrayLike<{ 0: { transcript: string } }>)
        .map(r => r[0].transcript)
        .join('');
      setState(s => ({ ...s, transcript: t }));
    };

    recognition.onend = () =>
      setState(s => ({ ...s, isListening: false }));

    recognition.onerror = (e) =>
      setState(s => ({ ...s, isListening: false, error: e.error }));

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback((): string => {
    recognitionRef.current?.stop();
    return state.transcript;
  }, [state.transcript]);

  const clearTranscript = useCallback(() => {
    setState(s => ({ ...s, transcript: '' }));
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();

      // Prefer high-quality on-device en-US female voices (best on iOS = Samantha enhanced)
      const preferred =
        voices.find(v => v.lang === 'en-US' && v.name.includes('Samantha') && v.localService) ||
        voices.find(v => v.lang === 'en-US' && v.name.includes('Samantha')) ||
        voices.find(v => v.lang === 'en-US' && v.localService) ||
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang.startsWith('en-'));

      if (preferred) utterance.voice = preferred;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => setState(s => ({ ...s, isSpeaking: true }));
      utterance.onend = () => setState(s => ({ ...s, isSpeaking: false }));
      utterance.onerror = () => setState(s => ({ ...s, isSpeaking: false }));

      window.speechSynthesis.speak(utterance);
    };

    // iOS loads voices async — wait if not ready yet
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setState(s => ({ ...s, isSpeaking: false }));
  }, []);

  const toggleVoice = useCallback(() => {
    setState(s => {
      const next = !s.voiceEnabled;
      localStorage.setItem(VOICE_PREF_KEY, String(next));
      if (!next) window.speechSynthesis.cancel();
      return { ...s, voiceEnabled: next, isSpeaking: false };
    });
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    clearTranscript,
    speak,
    stopSpeaking,
    toggleVoice,
  };
}
