import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const particleCount = Math.min(150, Math.floor((canvas.width * canvas.height) / 15000));
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedY: Math.random() * 0.5 + 0.1,
          opacity: Math.random() * 0.5 + 0.3,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    const animate = (time: number) => {
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Parallax effect based on scroll position
      const parallaxOffset = scrollY * 0.3;

      particles.forEach((particle) => {
        // Twinkling effect
        const twinkle = Math.sin(time * particle.twinkleSpeed + particle.twinkleOffset);
        const currentOpacity = particle.opacity + twinkle * 0.3;

        // Apply parallax offset
        const parallaxY = particle.y + parallaxOffset;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, parallaxY, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, currentOpacity))})`;
        ctx.fill();

        // Add subtle blue glow for some particles
        if (particle.size > 1.5) {
          ctx.beginPath();
          ctx.arc(particle.x, parallaxY, particle.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${currentOpacity * 0.2})`;
          ctx.fill();
        }

        // Move particle
        particle.y -= particle.speedY;

        // Reset particle when it goes off screen
        if (particle.y < -10) {
          particle.y = canvas.height + 10;
          particle.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', handleScroll, { passive: true });
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [scrollY]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
