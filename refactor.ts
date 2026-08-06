import { Project, SyntaxKind } from "ts-morph";

const project = new Project();
const sourceFile = project.addSourceFileAtPath("src/app/voice-interviewer/page.tsx");

// 1. Ensure useMemo is imported from react
const reactImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === "react");
if (reactImport) {
  const namedImports = reactImport.getNamedImports().map(ni => ni.getName());
  if (!namedImports.includes("useMemo")) {
    reactImport.addNamedImport("useMemo");
  }
}

const workspace = sourceFile.getFunction("VoiceInterviewerWorkspace");
if (!workspace) throw new Error("Could not find VoiceInterviewerWorkspace");

// 2. Remove legacy state declarations
const statesToRemove = [
  "voiceDraft", "isListening", "isThinking", "isSpeaking", "speechSupported", "ttsSupported"
];

const stmtsToRemove: any[] = [];

workspace.getVariableStatements().forEach(stmt => {
  const decs = stmt.getDeclarations();
  if (decs.length > 0) {
    const name = decs[0].getName();
    if (statesToRemove.some(s => name.includes(`[${s},`))) {
      stmtsToRemove.push(stmt);
    }
  }
});

// 3. Remove legacy refs
const refsToRemove = [
  "recognitionRef", "recognitionFactoryRef", "preferredVoiceRef", 
  "silenceTimerRef", "pendingTranscriptRef", "isListeningRef", 
  "isThinkingRef", "isSpeakingRef", "blockAutoRestartRef", "unmountedRef"
];

workspace.getVariableStatements().forEach(stmt => {
  const decs = stmt.getDeclarations();
  if (decs.length > 0) {
    const name = decs[0].getName();
    if (refsToRemove.includes(name)) {
      stmtsToRemove.push(stmt);
    }
  }
});

// 4. Find all usages of legacy refs and remove the entire expression statement (usually in useEffects)
workspace.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
  if (callExpr.wasForgotten()) return;
  if (callExpr.getExpression().getText() === "useEffect") {
    const text = callExpr.getText();
    if (
      text.includes("isThinkingRef.current") ||
      text.includes("isSpeakingRef.current") ||
      text.includes("silenceTimerRef.current") ||
      text.includes("recognitionCtor") ||
      text.includes("startListening()") // Mute toggle
    ) {
      const stmt = callExpr.getFirstAncestorByKind(SyntaxKind.ExpressionStatement);
      if (stmt && stmt.getParent() === workspace.getBody()) {
        stmtsToRemove.push(stmt);
      }
    }
  }
});

// 5. Remove all monolithic legacy functions
const funcsToRemove = [
  "splitSpeechChunks", "speakReply", "startListening", "stopListening", 
  "submitSpeechTurn", "sendTypedInput", "toggleManualListening", "launchInterview"
];

workspace.getVariableStatements().forEach(stmt => {
  const decs = stmt.getDeclarations();
  if (decs.length > 0) {
    const name = decs[0].getName();
    if (funcsToRemove.includes(name)) {
      stmtsToRemove.push(stmt);
    }
  }
});

workspace.getFunctions().forEach(func => {
  if (func.getName() && funcsToRemove.includes(func.getName()!)) {
    stmtsToRemove.push(func);
  }
});

// Also find stopListening() calls inside other functions (like endInterviewEarly) and replace with voiceProvider.stop()
workspace.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
  if (callExpr.wasForgotten()) return;
  if (callExpr.getExpression().getText() === "stopListening") {
    callExpr.getExpression().replaceWithText("voiceProvider.stop");
  }
  if (callExpr.getExpression().getText() === "speakReply") {
    callExpr.replaceWithText("voiceProvider.speak('Okay.')");
  }
});


// Execute removals safely
const uniqueStmts = Array.from(new Set(stmtsToRemove));
uniqueStmts.forEach(stmt => {
  if (!stmt.wasForgotten()) {
    stmt.remove();
  }
});

// 6. Inject the new useVoiceMachine block AT THE TOP of the workspace (right after the states)
// Find the first reference to `messagesRef` to know where to insert
const messagesRefStmt = workspace.getVariableStatements().find(stmt => 
  stmt.getText().includes("messagesRef") || stmt.getText().includes("const [step")
);

if (messagesRefStmt) {
  const codeToInsert = `
  const voiceProvider = useMemo(() => new BrowserVoiceProvider(), []);
  const speechProvider = useMemo(() => new BrowserSpeechRecognitionProvider(), []);

  const { state: voiceState, transcriptDraft, startSession } = useVoiceMachine({
    voiceProvider,
    speechProvider,
    onTranscriptReady: async (text) => {
      const res = await fetch("/api/voice-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-voice-input",
          sessionId,
          transcript: text
        })
      });
      const data = await res.json();
      if (data.session?.timeline?.phase) {
        setInterviewStage(data.session.timeline.phase);
      }
      if (data.session?.dsaQuestion) {
        setActiveQuestionTitle(data.session.dsaQuestion.title);
        setActiveQuestionDesc(data.session.dsaQuestion.description);
        if (data.session.dsaQuestion.starterCode) {
          setCode(data.session.dsaQuestion.starterCode);
        }
      }
      return data.reply;
    },
    onError: (err) => setVoiceIssue(err)
  });

  const isListening = voiceState === "Listening" || voiceState === "Transcribing";
  const isThinking = voiceState === "Thinking" || voiceState === "Generating";
  const isSpeaking = voiceState === "Speaking";
  const voiceDraft = transcriptDraft;
  const [voiceIssue, setVoiceIssue] = useState<string | null>(null);
  const preferredVoiceRef = useRef<any>(null);
  const unmountedRef = useRef(false);
  
  // Stubs for legacy actions
  const sendTypedInput = () => {
    if (input.trim()) {
      const text = input;
      setInput("");
      
      // Async submit manually to the API since we bypassed the voice pipeline
      fetch("/api/voice-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-voice-input",
          sessionId,
          transcript: text
        })
      }).then(r => r.json()).then(data => {
         if (data.reply) voiceProvider.speak(data.reply);
      });
    }
  };
  
  const toggleManualListening = () => {
    if (isListening) voiceProvider.stop();
  };
  
  const launchInterview = async () => {
    setStep("countdown");
    setTimeRemaining(duration * 60);

    try {
      const res = await fetch("/api/voice-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          difficulty,
          language,
          dsaTopic,
          companyMode,
          persona,
          interviewType,
          selfIntroduction: resumeUploaded ? \`My name is candidate. I know \${skillsDetected.join(", ")}.\` : "Hi, I am ready for the interview."
        })
      });
      const data = await res.json();
      if (data.session) {
        setSessionId(data.session.id);
        const greeting = data.session.aiResponses[0]?.content || "Hi, welcome! Please introduce yourself to begin.";
        setMessages([createMessage("assistant", greeting)]);
        startSession();
        voiceProvider.speak(greeting);
      }
    } catch {
      const fallbackGreeting = "Hi, welcome to the NextHire AI interview panel. Please share your self-introduction to start.";
      setMessages([createMessage("assistant", fallbackGreeting)]);
      startSession();
      voiceProvider.speak(fallbackGreeting);
    }
  };
`;
  workspace.insertStatements(messagesRefStmt.getChildIndex() + 1, codeToInsert);
}

// 7. Remove any remaining references to setIsThinking (which was removed)
workspace.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
  if (callExpr.wasForgotten()) return;
  if (callExpr.getExpression().getText() === "setIsThinking") {
    const stmt = callExpr.getFirstAncestorByKind(SyntaxKind.ExpressionStatement);
    if (stmt) stmt.remove();
  }
});

sourceFile.saveSync();
console.log("Refactoring complete.");
