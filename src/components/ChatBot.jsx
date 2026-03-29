// src/components/ChatBot.jsx
import { useState, useRef, useEffect } from "react";

const FAQS = [
  "What is HackHunt?",
  "Show ongoing hackathons",
  "Find online hackathons",
  "Hackathons in Delhi",
  "Can beginners join?",
  "How to host a hackathon?",
];

const s = {
  fab: {
    position: "fixed", bottom: "24px", right: "24px",
    width: "52px", height: "52px", borderRadius: "50%",
    background: "#6366f1", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2147483647,
    boxShadow: "0 4px 20px rgba(99,102,241,0.5)",
  },
  badge: {
    position: "absolute", top: "-3px", right: "-3px",
    width: "13px", height: "13px", background: "#22c55e",
    borderRadius: "50%", border: "2px solid white",
  },
  panel: {
    position: "fixed", bottom: "88px", right: "24px",
    width: "340px", height: "520px",
    background: "#ffffff", border: "1px solid #e5e7eb",
    borderRadius: "16px", display: "flex", flexDirection: "column",
    zIndex: 2147483646,
    boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
    overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    background: "#6366f1", padding: "12px 16px",
    display: "flex", alignItems: "center", gap: "10px", flexShrink: 0,
  },
  avatar: {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "18px", flexShrink: 0,
  },
  headerName: { fontWeight: 600, fontSize: "14px", color: "#fff" },
  headerSub: { fontSize: "11px", color: "rgba(255,255,255,0.8)", marginTop: "1px" },
  closeBtn: {
    marginLeft: "auto", background: "none", border: "none",
    color: "rgba(255,255,255,0.8)", cursor: "pointer",
    fontSize: "20px", lineHeight: 1, padding: "2px 6px",
  },
  messages: {
    flex: 1, overflowY: "auto", padding: "14px 12px",
    display: "flex", flexDirection: "column", gap: "8px",
    background: "#f9fafb",
  },
  botRow: { display: "flex", gap: "8px", alignItems: "flex-end" },
  userRow: { display: "flex", gap: "8px", alignItems: "flex-end", flexDirection: "row-reverse" },
  botAvatar: {
    width: "24px", height: "24px", borderRadius: "50%",
    background: "#ede9fe", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "12px", flexShrink: 0,
  },
  botBubble: {
    background: "#ffffff", border: "1px solid #e5e7eb",
    borderRadius: "12px", borderBottomLeftRadius: "3px",
    padding: "8px 12px", fontSize: "13px", lineHeight: "1.55",
    color: "#1f2937", maxWidth: "82%", wordBreak: "break-word",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  userBubble: {
    background: "#6366f1", borderRadius: "12px", borderBottomRightRadius: "3px",
    padding: "8px 12px", fontSize: "13px", lineHeight: "1.55",
    color: "#ffffff", maxWidth: "82%", wordBreak: "break-word",
  },
  faqSection: {
    padding: "8px 12px", borderTop: "1px solid #e5e7eb",
    background: "#fff", flexShrink: 0,
  },
  faqLabel: {
    fontSize: "10px", color: "#9ca3af", marginBottom: "6px",
    textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600,
  },
  faqWrap: { display: "flex", flexWrap: "wrap", gap: "5px" },
  chip: {
    fontSize: "11px", padding: "4px 10px", borderRadius: "20px",
    border: "1px solid #e5e7eb", background: "#f3f4f6", color: "#4b5563",
    cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
  },
  inputArea: {
    padding: "10px 12px", display: "flex", gap: "8px", alignItems: "center",
    background: "#fff", borderTop: "1px solid #e5e7eb", flexShrink: 0,
  },
  input: {
    flex: 1, background: "#f3f4f6", border: "none", borderRadius: "20px",
    padding: "8px 14px", fontSize: "13px", color: "#1f2937",
    outline: "none", fontFamily: "inherit",
  },
  sendBtn: {
    width: "34px", height: "34px", background: "#6366f1", border: "none",
    borderRadius: "50%", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: "bot", text: "Hi! 👋 I'm HackBot. Ask me anything about hackathons or click a question below!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setMessages(prev => [...prev, { id: Date.now(), role: "user", text: userText }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "bot",
        text: data.reply || "Something went wrong. Try again!",
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "bot",
        text: "Couldn't connect. Please try again. 🔌",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button style={s.fab} onClick={() => setIsOpen(o => !o)} title="Chat with HackBot">
        <div style={s.badge} />
        {isOpen ? (
          <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div style={s.panel}>
          {/* Header */}
          <div style={s.header}>
            <div style={s.avatar}>🤖</div>
            <div>
              <div style={s.headerName}>HackBot</div>
              <div style={s.headerSub}>● Online · Powered by Hackhunt</div>
            </div>
            <button style={s.closeBtn} onClick={() => setIsOpen(false)}>×</button>
          </div>

          {/* Messages */}
          <div style={s.messages}>
            {messages.map(msg => (
              <div key={msg.id} style={msg.role === "bot" ? s.botRow : s.userRow}>
                {msg.role === "bot" && <div style={s.botAvatar}>🤖</div>}
                <div style={msg.role === "bot" ? s.botBubble : s.userBubble}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={s.botRow}>
                <div style={s.botAvatar}>🤖</div>
                <div style={s.botBubble}>typing...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* FAQs — always visible */}
          <div style={s.faqSection}>
            <div style={s.faqLabel}>Quick Questions</div>
            <div style={s.faqWrap}>
              {FAQS.map(q => (
                <button
                  key={q} style={s.chip}
                  onClick={() => sendMessage(q)}
                  onMouseEnter={e => { e.target.style.background = "#ede9fe"; e.target.style.borderColor = "#6366f1"; e.target.style.color = "#6366f1"; }}
                  onMouseLeave={e => { e.target.style.background = "#f3f4f6"; e.target.style.borderColor = "#e5e7eb"; e.target.style.color = "#4b5563"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div style={s.inputArea}>
            <input
              ref={inputRef}
              style={s.input}
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <button
              style={{ ...s.sendBtn, opacity: !input.trim() || loading ? 0.4 : 1 }}
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}