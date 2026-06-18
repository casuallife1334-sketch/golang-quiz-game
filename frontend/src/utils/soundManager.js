// Sound Effects Manager
class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.5;
    this.init();
  }

  init() {
    // Создаем аудио контекст для генерации звуков
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  // Генерация звука с помощью осциллятора
  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Error playing tone:', e);
    }
  }

  // Звук клика
  playClick() {
    this.playTone(800, 0.1, 'sine', 0.2);
  }

  // Звук успешного действия
  playSuccess() {
    if (!this.enabled) return;
    
    // Воспроизводим аккорд
    setTimeout(() => this.playTone(523.25, 0.3, 'sine', 0.3), 0);    // C5
    setTimeout(() => this.playTone(659.25, 0.3, 'sine', 0.3), 50);   // E5
    setTimeout(() => this.playTone(783.99, 0.4, 'sine', 0.3), 100);  // G5
  }

  // Звук ошибки
  playError() {
    if (!this.enabled) return;
    
    setTimeout(() => this.playTone(200, 0.2, 'sawtooth', 0.2), 0);
    setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.2), 150);
  }

  // Звук появления вопроса
  playQuestionOpen() {
    if (!this.enabled) return;
    
    setTimeout(() => this.playTone(440, 0.15, 'sine', 0.3), 0);
    setTimeout(() => this.playTone(554.37, 0.15, 'sine', 0.3), 100);
    setTimeout(() => this.playTone(659.25, 0.2, 'sine', 0.3), 200);
  }

  // Звук таймера (последние 5 секунд)
  playTimerTick() {
    this.playTone(1000, 0.05, 'sine', 0.15);
  }

  // Звук окончания времени
  playTimeUp() {
    if (!this.enabled) return;
    
    setTimeout(() => this.playTone(880, 0.15, 'square', 0.2), 0);
    setTimeout(() => this.playTone(880, 0.15, 'square', 0.2), 150);
    setTimeout(() => this.playTone(880, 0.3, 'square', 0.2), 300);
  }

  // Звук отправки ответа
  playAnswerSubmit() {
    this.playTone(600, 0.1, 'sine', 0.25);
  }

  // Звук правильного ответа
  playCorrectAnswer() {
    if (!this.enabled) return;
    
    // Победная фанфара
    setTimeout(() => this.playTone(523.25, 0.2, 'sine', 0.3), 0);    // C5
    setTimeout(() => this.playTone(659.25, 0.2, 'sine', 0.3), 100);  // E5
    setTimeout(() => this.playTone(783.99, 0.2, 'sine', 0.3), 200);  // G5
    setTimeout(() => this.playTone(1046.50, 0.4, 'sine', 0.3), 300); // C6
  }

  // Звук неправильного ответа
  playIncorrectAnswer() {
    if (!this.enabled) return;
    
    setTimeout(() => this.playTone(300, 0.15, 'triangle', 0.25), 0);
    setTimeout(() => this.playTone(250, 0.15, 'triangle', 0.25), 150);
    setTimeout(() => this.playTone(200, 0.3, 'triangle', 0.25), 300);
  }

  // Звук сообщения в чате
  playChatMessage() {
    this.playTone(1200, 0.08, 'sine', 0.15);
  }

  // Звук старта игры
  playGameStart() {
    if (!this.enabled) return;
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.3), i * 100);
    });
  }

  // Звук получения очков
  playScoreGain() {
    if (!this.enabled) return;
    
    setTimeout(() => this.playTone(783.99, 0.15, 'sine', 0.3), 0);
    setTimeout(() => this.playTone(1046.50, 0.2, 'sine', 0.3), 100);
  }

  // Звук открытия отчета
  playReportOpen() {
    this.playTone(400, 0.1, 'sine', 0.2);
  }

  // Отключить звуки
  disable() {
    this.enabled = false;
  }

  // Включить звуки
  enable() {
    this.enabled = true;
  }

  // Установить громкость
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Переключить звук
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// Экспортируем единственный экземпляр
export const soundManager = new SoundManager();

// Хук для использования в React компонентах
export function useSound() {
  return soundManager;
}
