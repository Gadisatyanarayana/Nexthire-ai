import React from "react";

export function VoiceDebugPanel({
  state,
  transcriptDraft,
  sessionInfo
}: {
  state: string;
  transcriptDraft: string;
  sessionInfo?: any;
}) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const exportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      state,
      transcriptDraft,
      sessionInfo,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "voice_debug_logs.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      left: 20,
      backgroundColor: "rgba(0,0,0,0.85)",
      color: "#0f0",
      fontFamily: "monospace",
      fontSize: "12px",
      padding: "15px",
      borderRadius: "8px",
      zIndex: 9999,
      maxWidth: "350px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
    }}>
      <h3 style={{ margin: "0 0 10px 0", color: "#fff", borderBottom: "1px solid #333", paddingBottom: "5px" }}>
        VOICE DEBUG
      </h3>
      
      <div style={{ marginBottom: "5px" }}>
        <strong>Current State:</strong> {state}
      </div>
      
      <div style={{ marginBottom: "5px" }}>
        <strong>Transcript:</strong> <span style={{ color: "#aaa" }}>{transcriptDraft || "..."}</span>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Session ID:</strong> <span style={{ color: "#aaa" }}>{sessionInfo?.id || "N/A"}</span>
      </div>

      <button 
        onClick={exportLogs}
        style={{
          background: "#333",
          color: "#fff",
          border: "1px solid #555",
          padding: "4px 8px",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "11px",
          marginTop: "10px",
          width: "100%"
        }}
      >
        Export Voice Logs
      </button>
    </div>
  );
}
