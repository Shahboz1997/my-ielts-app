import { useEffect, useState } from 'react';
import { playAlertSound } from '@/lib/writer/editorUi';

export function useWriterTimer(activeTab) {
  const [timeLeft, setTimeLeft] = useState(3600);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (activeTab === 'Task 1') {
      setTimeLeft(20 * 60);
    } else if (activeTab === 'Task 2') {
      setTimeLeft(40 * 60);
    }
    setTimerActive(false);
  }, [activeTab]);

  useEffect(() => {
    if (timeLeft === 60 && timerActive) {
      playAlertSound();
    }
    if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      playAlertSound();
      setTimeout(() => alert('Time is up! Please submit your task.'), 100);
    }
  }, [timeLeft, timerActive]);

  return { timeLeft, timerActive, setTimerActive };
}
