import { useEffect, useRef } from 'react';

function formatTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function Message({ m, imagePreview }) {
  const isUser = m.role === 'user';
  return (
    <div className={`msg ${isUser ? 'msg-user' : 'msg-bot'}`}>
      <div className="msg-avatar">{isUser ? 'You' : '✦'}</div>
      <div className="msg-bubble">
        {/* Show small attachment chips on user messages that referenced an upload */}
        {isUser && (m.attachedDocument || m.attachedImage) && (
          <div className="msg-attachments">
            {m.attachedDocument && <span className="attach-chip">📄 {m.attachedDocument}</span>}
            {m.attachedImage && <span className="attach-chip">🖼 {m.attachedImage}</span>}
          </div>
        )}

        {/* If user attached an image AND we have a local preview, show it inline on first user msg */}
        {isUser && m.attachedImage && imagePreview && (
          <div className="msg-image">
            <img src={imagePreview} alt={m.attachedImage} />
          </div>
        )}

        <div className="msg-text">{m.text}</div>
        <div className="msg-time">{formatTime(m.timestamp)}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="msg msg-bot">
      <div className="msg-avatar">✦</div>
      <div className="msg-bubble">
        <div className="typing">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ chat, imagePreview, isSending }) {
  const endRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
    return () => clearTimeout(timer);
  }, [chat?.messages?.length, isSending]);

  // Empty / welcome state
  if (!chat || chat.messages.length === 0) {
    return (
      <div className="chat-window empty">
        <div className="welcome">
          <div className="welcome-mark">✦</div>
          <h1 className="welcome-title">
            Ask anything. <em>Attach anything.</em>
          </h1>
          <p className="welcome-sub">
            Drop in a PDF or image and chat about it.
            Conversations stay in memory until you reset them.
          </p>

          <div className="welcome-tiles">
            <div className="tile">
              <div className="tile-icon">📄</div>
              <div className="tile-title">Document Q&amp;A</div>
              <div className="tile-text">Upload a PDF or TXT, then ask the bot to summarize, extract, or explain.</div>
            </div>
            <div className="tile">
              <div className="tile-icon">🖼</div>
              <div className="tile-title">Image understanding</div>
              <div className="tile-text">Add a PNG or JPG and ask the bot what it sees, who's in it, or what's happening.</div>
            </div>
            <div className="tile">
              <div className="tile-icon">↻</div>
              <div className="tile-title">Fresh context</div>
              <div className="tile-text">Hit New Chat to wipe everything and start over with a clean slate.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="messages">
        {chat.messages.map((m, i) => (
          <Message key={i} m={m} imagePreview={imagePreview} />
        ))}
        {isSending && <TypingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
