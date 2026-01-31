import { useCallback } from 'react';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { playNotificationSound } from '@/lib/utils/notificationSound';

export function useNotificationSound() {
  const { settings } = useSettings();

  const play = useCallback(
    (type?: string) => {
      if (!settings.notifications.soundEnabled) return;
      void playNotificationSound(type || settings.notifications.soundChoice);
    },
    [settings.notifications.soundEnabled, settings.notifications.soundChoice]
  );

  return {
    play,
    playSuccess: () => play('success'),
    playError: () => play('error'),
    playComplete: () => play('complete'),
  };
}
