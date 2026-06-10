import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function WavingFlag({ width = 210, height = 140, speed = 0.04, className = '' }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const drawChakra = (cx, cy, r) => {
      ctx.save();
      
      // Outer glow
      ctx.shadowColor = 'rgba(0, 8, 128, 0.5)';
      ctx.shadowBlur = 10;
      
      ctx.strokeStyle = '#000080';
      ctx.lineWidth = 1;

      // Outer circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Inner dot
      ctx.fillStyle = '#000080';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // 24 spokes with gradient
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const gradient = ctx.createLinearGradient(
          cx + Math.cos(angle) * r * 0.12,
          cy + Math.sin(angle) * r * 0.12,
          cx + Math.cos(angle) * r * 0.88,
          cy + Math.sin(angle) * r * 0.88
        );
        gradient.addColorStop(0, '#000080');
        gradient.addColorStop(1, 'rgba(0, 8, 128, 0.6)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r * 0.12, cy + Math.sin(angle) * r * 0.12);
        ctx.lineTo(cx + Math.cos(angle) * r * 0.88, cy + Math.sin(angle) * r * 0.88);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawFlag = () => {
      ctx.clearRect(0, 0, W, H);

      const cols = 80;
      const segW = W / cols;

      // Draw each vertical strip with wave distortion
      for (let i = 0; i < cols; i++) {
        const x = i * segW;
        const waveAmp = (i / cols) * 16;
        const waveY = Math.sin((i / cols) * Math.PI * 2.5 + timeRef.current) * waveAmp;
        const scaleY = 1 - Math.abs(Math.sin((i / cols) * Math.PI * 2.5 + timeRef.current)) * 0.08;

        const stripH = H * scaleY;
        const yOff = (H - stripH) / 2 + waveY;
        const third = stripH / 3;

        // Add subtle gradient to each color
        const saffronGradient = ctx.createLinearGradient(x, yOff, x, yOff + third);
        saffronGradient.addColorStop(0, '#FFB366');
        saffronGradient.addColorStop(1, '#FF9933');
        ctx.fillStyle = saffronGradient;
        ctx.fillRect(x, yOff, segW + 1, third);

        const whiteGradient = ctx.createLinearGradient(x, yOff + third, x, yOff + third * 2);
        whiteGradient.addColorStop(0, '#FFFFFF');
        whiteGradient.addColorStop(1, '#F5F5F5');
        ctx.fillStyle = whiteGradient;
        ctx.fillRect(x, yOff + third, segW + 1, third);

        const greenGradient = ctx.createLinearGradient(x, yOff + third * 2, x, yOff + third * 3);
        greenGradient.addColorStop(0, '#138808');
        greenGradient.addColorStop(1, '#0A5504');
        ctx.fillStyle = greenGradient;
        ctx.fillRect(x, yOff + third * 2, segW + 1, third);
      }

      // Draw Ashoka Chakra at center
      const centerX = W * 0.5;
      const centerWave = Math.sin(0.5 * Math.PI * 2.5 + timeRef.current) * 8;
      const centerY = H / 2 + centerWave;
      drawChakra(centerX, centerY, H * 0.13);

      timeRef.current += speed;
      animationRef.current = requestAnimationFrame(drawFlag);
    };

    drawFlag();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, width, height]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="drop-shadow-2xl"
        style={{ display: 'block', filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5))' }}
      />
    </motion.div>
  );
}
