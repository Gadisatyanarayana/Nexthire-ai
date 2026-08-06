const fs = require('fs');

let content = fs.readFileSync('src/app/voice-interviewer/page.tsx', 'utf8');

// Fix voiceProvider.speak() empty args
content = content.replace(/voiceProvider\.speak\(\)/g, 'voiceProvider.speak("Okay, let us proceed.")');

// We need to move the block containing useVoiceMachine up before line 192 (or before the useEffects).
// The block is currently right above `const handleExecuteCode = async () => {`
// Let's extract it.
const blockStart = "const voiceProvider = useMemo(() => new BrowserVoiceProvider(), []);";
const blockEnd = "voiceProvider.speak(fallbackGreeting);\n    }\n  };";

const startIndex = content.indexOf(blockStart);
const endIndex = content.indexOf(blockEnd) + blockEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  const blockToMove = content.substring(startIndex, endIndex);
  
  // Remove it from its current position
  content = content.substring(0, startIndex) + content.substring(endIndex);
  
  // Find where to insert it: after the state declarations (e.g., right before `const messagesRef = useRef`)
  const insertMarker = "const messagesRef = useRef<ChatMessage[]>(messages);";
  const insertIndex = content.indexOf(insertMarker);
  
  if (insertIndex !== -1) {
    content = content.substring(0, insertIndex) + blockToMove + "\n\n  " + content.substring(insertIndex);
  }
}

fs.writeFileSync('src/app/voice-interviewer/page.tsx', content, 'utf8');
console.log("Fixes applied.");
