export default function Sidebar({ chats, currentId, onNewChat, onSelect, onDelete }) {
  return (
    <aside className="sidebar">
      <button className="btn-primary new-chat" onClick={onNewChat}>
        <span className="plus">+</span>
        <span>New Chat</span>
      </button>

      <div className="sidebar-label">Conversations</div>

      <div className="chat-list">
        {chats.length === 0 && (
          <div className="empty-state">
            No chats yet.<br />Start one above.
          </div>
        )}
        {chats.map((c) => (
          <div
            key={c.id}
            className={`chat-item ${c.id === currentId ? 'active' : ''}`}
            onClick={() => onSelect(c.id)}
          >
            <div className="chat-item-main">
              <div className="chat-item-title">{c.title}</div>
              <div className="chat-item-meta">
                {c.messageCount} msg
                {c.hasDocument && ' · 📄'}
                {c.hasImage && ' · 🖼'}
              </div>
            </div>
            <button
              className="chat-item-del"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this chat?')) onDelete(c.id);
              }}
              title="Delete chat"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <span>In-memory · resets on restart</span>
      </div>
    </aside>
  );
}
