// Main chatbot component

import { useState, useRef, useEffect } from "react";
import "./App.css";

const QUICK_PROMPTS = [
  "What is a Transformer in AI?",
  "Explain GANs simply",
  "What is RAG in GenAI?",
  "Difference: GPT vs BERT",
  "How does Stable Diffusion work?",
];

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function TypingBubble() {
  return (
    <div className="message">
      <div className="avatar ai">AI</div>
      <div className="bubble ai">
        <div className="typing-indicator">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`message ${isUser ? "user" : ""}`}>
      <div className={`avatar ${isUser ? "user" : "ai"}`}>
        {isUser ? "You" : "AI"}
      </div>
      <div>
        <div
          className={`bubble ${isUser ? "user" : "ai"}`}
          dangerouslySetInnerHTML={{
            __html: msg.text
              .replace(/`([^`]+)`/g, "<code>$1</code>")
              .replace(/\n/g, "<br/>"),
          }}
        />
        <div className="bubble-meta">{msg.time}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const userMsg = { role: "user", text: userText, time: formatTime() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    if (!history.includes(userText) && userText.length < 40)
      setHistory((prev) => [userText, ...prev].slice(0, 5));

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "moonshotai/kimi-k2-instruct-0905",
          messages: [
            {
              role: "system",
              content: "You are an expert AI Study Assistant for a B.Tech Data Science course on Generative AI (DSE3261) at Manipal University Jaipur. Help students understand GANs, Transformers, BERT, GPT, LangChain, RAG, vector databases, Stable Diffusion, and LLaMA. Give clear beginner-friendly answers with examples. Use backticks for technical terms.",
            },
            ...updated.map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.text,
            })),
          ],
          max_tokens: 1000,
        }),
      });

      const data = await res.json();
      console.log("API Response:", JSON.stringify(data));
      const aiText =
        data.choices?.[0]?.message?.content ||
        "Sorry, I couldn't get a response.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: aiText, time: formatTime() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ Error connecting. Check your API key in the .env file.",
          time: formatTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">

      {/* Header */}
      <div className="header">
        <div className="logo">🎓</div>
        <div className="header-text">
          <h1>AI Study Assistant</h1>
          <p>Ask me anything about Gen AI and more.</p>
        </div>
        <div className="status-dot" />
      </div>

      {/* Recent History Bar */}
      {history.length > 0 && (
        <div className="history-bar">
          <span className="hist-label">Recent:</span>
          {history.map((h, i) => (
            <span key={i} className="hist-tag"
              onClick={() => { setInput(h); textareaRef.current?.focus(); }}>
              {h.length > 28 ? h.slice(0, 28) + "…" : h}
            </span>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div className="chat-area">
        {messages.length === 0 && (
          <div className="welcome">
            <div className="welcome-icon">🤖</div>
            <h2>What Can I Help You With?</h2>
            <div className="chips">
              {QUICK_PROMPTS.map((p, i) => (
                <span key={i} className="chip" onClick={() => sendMessage(p)}>{p}</span>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && <TypingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        <div className="input-row">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about GANs, Transformers, RAG, LLMs..."
            rows={1}
          />
          <button className="send-btn" onClick={() => sendMessage()}
            disabled={loading || !input.trim()}>
            ➤
          </button>
        </div>
        <div className="hint">Enter to send · Shift+Enter for new line</div>
      </div>

    </div>
  );
}