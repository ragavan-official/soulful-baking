import React, { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const particleCount = 50;
    
    // Theme colors: gold, vanilla cream, and amber
    const colors = [
      { core: 'rgba(212, 175, 55, 0.25)', glow: 'rgba(212, 175, 55, 0.05)' },
      { core: 'rgba(243, 229, 171, 0.2)',  glow: 'rgba(243, 229, 171, 0.04)' },
      { core: 'rgba(233, 182, 70, 0.15)', glow: 'rgba(233, 182, 70, 0.03)' },
      { core: 'rgba(139, 69, 19, 0.1)',   glow: 'rgba(139, 69, 19, 0.02)' }
    ];

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2.5 + 1;
        this.speedX = Math.random() * 0.3 - 0.15;
        this.speedY = Math.random() * 0.3 - 0.15;
        const colorObj = colors[Math.floor(Math.random() * colors.length)];
        this.color = colorObj.core;
        this.glowColor = colorObj.glow;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off walls
        if (this.x < 0 || this.x > width) this.speedX *= -1;
        if (this.y < 0 || this.y > height) this.speedY *= -1;
      }

      draw() {
        // Draw soft glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = this.glowColor;
        ctx.fill();

        // Draw solid core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 50%, #170d08 0%, #070403 100%)',
      }}
    />
  );
};

export default AnimatedBackground;
