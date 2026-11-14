import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { audioManager } from '../utils/audioManager';

/**
 * Mortuary ping on toast / legal / service-feedback updates.
 * Debounced in audioManager; never interrupts menu/chapel beds.
 */
export const NotificationPing: React.FC = () => {
  const intakeToast = useGameStore((s) => s.intakeToast);
  const legalAlert = useGameStore((s) => s.legalAlert);
  const serviceFeedback = useGameStore((s) => s.serviceFeedback);
  const seen = useRef({ toast: '', legal: '', feedback: '' });

  useEffect(() => {
    if (intakeToast && intakeToast !== seen.current.toast) {
      seen.current.toast = intakeToast;
      audioManager.playNotificationPing();
    }
    if (!intakeToast) seen.current.toast = '';
  }, [intakeToast]);

  useEffect(() => {
    if (legalAlert && legalAlert !== seen.current.legal) {
      seen.current.legal = legalAlert;
      audioManager.playNotificationPing();
    }
    if (!legalAlert) seen.current.legal = '';
  }, [legalAlert]);

  useEffect(() => {
    const id = serviceFeedback?.decedentName ?? '';
    if (serviceFeedback && id !== seen.current.feedback) {
      seen.current.feedback = id;
      audioManager.playNotificationPing();
    }
    if (!serviceFeedback) seen.current.feedback = '';
  }, [serviceFeedback]);

  return null;
};
