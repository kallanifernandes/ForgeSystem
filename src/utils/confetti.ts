import confetti from 'canvas-confetti';

export function fireDisciplineConfetti(): void {
  try {
    confetti({
      particleCount: 50,
      spread: 65,
      origin: { y: 0.75 },
      colors: ['#EAB308', '#FACC15', '#F59E0B', '#FFFFFF', '#71717A'],
      disableForReducedMotion: true,
    });
  } catch (err) {
    // Graceful fallback
  }
}

export function fireMilestoneCelebration(): void {
  try {
    const duration = 1.6 * 1000;
    const animationEnd = Date.now() + duration;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 35 * (timeLeft / duration);
      confetti({
        particleCount,
        spread: 80,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#EAB308', '#FACC15', '#F59E0B', '#FFFFFF', '#E4E4E7'],
        disableForReducedMotion: true,
      });
    }, 250);
  } catch (err) {
    // Graceful fallback
  }
}
