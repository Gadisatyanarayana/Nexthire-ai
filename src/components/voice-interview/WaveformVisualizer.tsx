"use client";

import React, { useEffect, useRef } from "react";

type WaveformVisualizerProps = {
  stream: MediaStream | null;
  isActive: boolean;
  color?: string;
};

export function WaveformVisualizer({ stream, isActive, color = "#06b6d4" }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isActive) {
      analyserRef.current = null;
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // Low fftSize for clean, wide frequency bars
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    } catch (e) {
      console.warn("AudioContext setup failed:", e);
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
      }
    };
  }, [stream, isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 18;
      const spacing = 4;
      const barWidth = (width - spacing * (barCount - 1)) / barCount;
      const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 32);

      if (analyserRef.current && isActive) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      phase += 0.05;

      // Center line vertical reference
      const midY = height / 2;

      for (let i = 0; i < barCount; i++) {
        let val = 0;

        if (isActive) {
          if (analyserRef.current) {
            // Read data array value (scaled)
            val = (dataArray[i % dataArray.length] / 255) * (height * 0.85);
          } else {
            // Simulated sine wave if analyser is blocked or offline
            const angle = (i / barCount) * Math.PI * 2 + phase;
            val = (Math.sin(angle) * 0.5 + 0.5) * (height * 0.5);
          }
        }

        // Ambient noise fluctuation floor
        const h = Math.max(4, val);

        const x = i * (barWidth + spacing);
        const y = midY - h / 2;

        // Draw double rounded frequency bars
        ctx.fillStyle = color;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, h, barWidth / 2);
        } else {
          ctx.rect(x, y, barWidth, h);
        }
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, color]);

  return (
    <div className="w-full flex items-center justify-center p-2 bg-white/5 border border-white/5 rounded-2xl h-14">
      <canvas 
        ref={canvasRef} 
        width={240} 
        height={32} 
        className="w-full max-w-xs" 
        aria-label="Vocal input frequency wave visualizer"
      />
    </div>
  );
}
