import { create } from 'zustand';

export type VisualMode = 'reading' | 'interactive' | 'visual' | 'animation' | 'whiteboard' | 'interview';
export type PlaybackState = 'idle' | 'playing' | 'paused' | 'completed';

interface VisualLearningState {
  // Navigation & Mode
  activeLesson: string | null;
  visualMode: VisualMode;
  fullscreen: boolean;
  
  // Diagram Selection & Interaction
  selectedDiagram: string | null; // ID of the currently active diagram asset
  selectedNode: string | null; // ID of the clicked node in React Flow
  highlightedConcept: string | null; // For Knowledge Graph or Tooltips
  zoomLevel: number;
  
  // Animation Engine
  playbackState: PlaybackState;
  currentStep: number;
  animationSpeed: number; // e.g. 1.0 = normal, 2.0 = fast
  
  // Actions
  setActiveLesson: (lessonId: string | null) => void;
  setVisualMode: (mode: VisualMode) => void;
  toggleFullscreen: () => void;
  setSelectedDiagram: (diagramId: string | null) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setHighlightedConcept: (conceptId: string | null) => void;
  setZoomLevel: (zoom: number) => void;
  
  // Playback Actions
  setPlaybackState: (state: PlaybackState) => void;
  setCurrentStep: (step: number) => void;
  setAnimationSpeed: (speed: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetPlayback: () => void;
}

export const useVisualLearningStore = create<VisualLearningState>((set) => ({
  activeLesson: null,
  visualMode: 'reading',
  fullscreen: false,
  
  selectedDiagram: null,
  selectedNode: null,
  highlightedConcept: null,
  zoomLevel: 1,
  
  playbackState: 'idle',
  currentStep: 0,
  animationSpeed: 1.0,
  
  setActiveLesson: (id) => set({ activeLesson: id }),
  setVisualMode: (mode) => set({ visualMode: mode }),
  toggleFullscreen: () => set((state) => ({ fullscreen: !state.fullscreen })),
  setSelectedDiagram: (id) => set({ selectedDiagram: id }),
  setSelectedNode: (id) => set({ selectedNode: id }),
  setHighlightedConcept: (id) => set({ highlightedConcept: id }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  
  setPlaybackState: (state) => set({ playbackState: state }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
  resetPlayback: () => set({ currentStep: 0, playbackState: 'idle' }),
}));
