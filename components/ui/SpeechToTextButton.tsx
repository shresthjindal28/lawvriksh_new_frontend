'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/lib/contexts/ToastContext';

// Tailwind class mappings (converted from CSS Module)
const styles = {
  button:
    'inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  icon: 'p-2 rounded-lg hover:bg-gray-100',
  dock: 'px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50',
  listening: 'text-red-500 bg-red-50 border-red-200',
  idle: 'text-gray-600',
  contentWrapper: 'flex items-center gap-2',
  labelText: 'text-sm font-medium',
};

interface SpeechToTextButtonProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onStop?: () => void;
  language?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'icon' | 'dock';
  label?: string;
  iconSize?: number;
}

/**
 * SpeechToTextButton
 * A robust microphone button that uses Deepgram's real-time WebSocket API
 * to convert speech to text.
 */
export default function SpeechToTextButton({
  onTranscript,
  onStop,
  language = 'en-US',
  className = '',
  disabled = false,
  variant = 'icon',
  label,
  iconSize = 18,
}: SpeechToTextButtonProps) {
  const { addToast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Use refs for callbacks to avoid re-creating start/stop functions
  const onTranscriptRef = useRef(onTranscript);
  const onStopRef = useRef(onStop);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  const stopListening = useCallback(() => {
    console.log('Stopping speech recognition...');
    setIsListening(false);
    isListeningRef.current = false;

    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
        } catch (e) {
          console.warn('Error sending CloseStream:', e);
        }
      }
      socketRef.current.close();
      socketRef.current = null;
    }

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn('Error stopping MediaRecorder:', e);
        }
      }
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }

    if (onStopRef.current) {
      onStopRef.current();
    }
  }, []); // Stable stop function

  const startListening = useCallback(async () => {
    if (disabled) return;

    console.log('Starting speech recognition for language:', language);
    try {
      // 1. Get API key from our backend
      const response = await fetch('/api/deepgram');
      if (!response.ok) {
        let errorMessage = response.statusText || 'Request failed';
        try {
          const payload = await response.json();
          if (payload?.error) {
            errorMessage = payload.error;
          }
        } catch {}
        throw new Error(`Failed to fetch API key: ${errorMessage}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const apiKey = data.key;
      if (!apiKey) {
        throw new Error('No API key received from server');
      }

      // 2. Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 3. Determine best mimeType for MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm';

      console.log('Using mimeType:', mimeType);

      // 4. Initialize Deepgram WebSocket
      const params = new URLSearchParams({
        model: 'nova-2',
        smart_format: 'true',
        interim_results: 'true',
        language: language || 'en-US',
      });

      const socket = new WebSocket(`wss://api.deepgram.com/v1/listen?${params.toString()}`, [
        'token',
        apiKey,
      ]);

      socket.onopen = () => {
        console.log('Deepgram WebSocket opened');
        setIsListening(true);
        isListeningRef.current = true;
        addToast('Listening… Speak now', 'info', 1500);

        // 5. Start recording and sending chunks
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (
            event.data.size > 0 &&
            socket.readyState === WebSocket.OPEN &&
            isListeningRef.current
          ) {
            socket.send(event.data);
          }
        };

        mediaRecorder.start(250); // Send 250ms chunks
      };

      socket.onmessage = (message) => {
        if (!isListeningRef.current) return;

        try {
          const received = JSON.parse(message.data);

          if (received.type === 'Results' && received.channel?.alternatives?.[0]) {
            const transcript = received.channel.alternatives[0].transcript;
            if (transcript || received.is_final) {
              onTranscriptRef.current(transcript, received.is_final);
            }
          }
        } catch (e) {
          console.error('Error parsing Deepgram message:', e);
        }
      };

      socket.onerror = (error) => {
        console.error('Deepgram WebSocket error event:', error);
        addToast('Connection error with voice service.', 'error');
        stopListening();
      };

      socket.onclose = (event) => {
        console.log('Deepgram WebSocket closed:', event.code, event.reason);
        const wasListening = isListeningRef.current;
        setIsListening(false);
        isListeningRef.current = false;

        if (wasListening && event.code !== 1000 && event.code !== 1005) {
          addToast('Voice connection lost.', 'error');
        }
      };

      socketRef.current = socket;
    } catch (error: any) {
      console.error('Error starting Deepgram:', error);
      addToast(error.message || 'Failed to start speech recognition.', 'error');
      stopListening();
    }
  }, [addToast, disabled, language, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  useEffect(() => {
    return () => {
      // Only stop if we are actually listening during unmount
      if (isListeningRef.current) {
        // Use a direct reference to the cleanup logic to avoid dependency issues
        if (socketRef.current) {
          socketRef.current.close();
        }
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`${styles.button} ${
        variant === 'dock'
          ? `${styles.dock} ${isListening ? styles.listening : styles.idle}`
          : `${styles.icon} ${isListening ? styles.listening : styles.idle}`
      } ${className}`}
      title={isListening ? 'Stop recording' : 'Start voice input'}
      aria-label={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {variant === 'dock' ? (
        <span className={styles.contentWrapper}>
          {isListening ? <MicOff size={iconSize} /> : <Mic size={iconSize} />}
          <span className={styles.labelText}>
            {isListening ? 'Listening… tap to stop' : label || 'Tap to speak'}
          </span>
        </span>
      ) : isListening ? (
        <MicOff size={iconSize} />
      ) : (
        <Mic size={iconSize} />
      )}
    </button>
  );
}
