"use client";

import React, { useEffect, useState } from "react";
import { X, Mic, Camera, Volume2, User, Settings2 } from "lucide-react";
import { useMediaDevices, useLocalStorage } from "./hooks";

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { devices, updateDevices } = useMediaDevices();
  
  // Local storage settings
  const [selectedMic, setSelectedMic] = useLocalStorage("nh-mic", "");
  const [selectedCamera, setSelectedCamera] = useLocalStorage("nh-cam", "");
  const [selectedSpeaker, setSelectedSpeaker] = useLocalStorage("nh-speaker", "");
  const [selectedVoice, setSelectedVoice] = useLocalStorage("nh-voice", "");
  const [selectedLanguage, setSelectedLanguage] = useLocalStorage("nh-language", "en-US");
  
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      void updateDevices();
      
      const loadVoices = () => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          const voices = window.speechSynthesis.getVoices();
          setAvailableVoices(voices);
        }
      };
      
      loadVoices();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, [isOpen, updateDevices]);

  if (!isOpen) return null;

  const microphones = devices.filter(d => d.kind === "audioinput");
  const cameras = devices.filter(d => d.kind === "videoinput");
  const speakers = devices.filter(d => d.kind === "audiooutput");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative flex flex-col gap-6" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors focus:ring focus:ring-cyan-500/50 outline-none"
          aria-label="Close Settings"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
            <Settings2 className="w-6 h-6" />
          </div>
          <h2 id="settings-title" className="text-xl font-bold text-white">Interview Settings</h2>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto max-h-[60vh] pr-2">
          
          {/* Device Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Devices</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 flex items-center gap-2" htmlFor="mic-select">
                <Mic className="w-4 h-4" /> Microphone
              </label>
              <select 
                id="mic-select"
                value={selectedMic} 
                onChange={e => setSelectedMic(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                aria-label="Select Microphone"
              >
                <option value="">Default Microphone</option>
                {microphones.map(m => (
                  <option key={m.deviceId} value={m.deviceId}>{m.label || `Microphone ${m.deviceId.substring(0,5)}`}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 flex items-center gap-2" htmlFor="cam-select">
                <Camera className="w-4 h-4" /> Camera
              </label>
              <select 
                id="cam-select"
                value={selectedCamera} 
                onChange={e => setSelectedCamera(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                aria-label="Select Camera"
              >
                <option value="">Default Camera</option>
                {cameras.map(c => (
                  <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId.substring(0,5)}`}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 flex items-center gap-2" htmlFor="speaker-select">
                <Volume2 className="w-4 h-4" /> Speaker
              </label>
              <select 
                id="speaker-select"
                value={selectedSpeaker} 
                onChange={e => setSelectedSpeaker(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                aria-label="Select Speaker"
              >
                <option value="">Default Speaker</option>
                {speakers.map(s => (
                  <option key={s.deviceId} value={s.deviceId}>{s.label || `Speaker ${s.deviceId.substring(0,5)}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* AI Voice Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">AI Voice Preferences</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 flex items-center gap-2" htmlFor="lang-select">
                <User className="w-4 h-4" /> Language
              </label>
              <select 
                id="lang-select"
                value={selectedLanguage} 
                onChange={e => setSelectedLanguage(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                aria-label="Select Language"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="en-AU">English (Australia)</option>
                <option value="en-IN">English (India)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 flex items-center gap-2" htmlFor="voice-select">
                <Volume2 className="w-4 h-4" /> AI Voice
              </label>
              <select 
                id="voice-select"
                value={selectedVoice} 
                onChange={e => setSelectedVoice(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                aria-label="Select AI Voice"
              >
                <option value="">Default Voice</option>
                {availableVoices.filter(v => v.lang.startsWith("en")).map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-colors focus:ring focus:ring-cyan-500/50 outline-none"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
