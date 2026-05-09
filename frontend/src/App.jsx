import { useEffect, useRef, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import InputBar from './components/InputBar.jsx';
import { api } from './api/client.js';

export default function App() {
  const [chats, setChats] = useState([]);            // sidebar list (metadata)
  const [currentId, setCurrentId] = useState(null);
  const [chat, setChat] = useState(null);            // full active chat
  const [imagePreview, setImagePreview] = useState(null); // dataURL for current chat image
  const [isSending, setIsSending] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [error, setError] = useState(null);
  const [healthOk, setHealthOk] = useState(true);

  const previewCache = useRef({});  // chatId -> dataURL (so we don't lose previews on chat switch)

  // ---- Initial load: health + chat list ----
  useEffect(() => {
    (async () => {
      try {
        const h = await api.health();
        setHealthOk(!!h.hasApiKey);
      } catch {
        setHealthOk(false);
      }
      await refreshList();
    })();
  }, []);

  const refreshList = useCallback(async () => {
    try {
      const list = await api.listChats();
      setChats(list);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadChat = useCallback(async (id) => {
    if (!id) {
      setChat(null);
      setImagePreview(null);
      return;
    }
    try {
      const data = await api.getChat(id);
      setChat(data);
      setImagePreview(previewCache.current[id] || null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadChat(currentId);
  }, [currentId, loadChat]);

  // ---- Actions ----

  const handleNewChat = async () => {
    setError(null);
    try {
      const created = await api.createChat();
      await refreshList();
      setCurrentId(created.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectChat = (id) => {
    setError(null);
    setCurrentId(id);
  };

  const handleDeleteChat = async (id) => {
    setError(null);
    try {
      await api.deleteChat(id);
      delete previewCache.current[id];
      if (currentId === id) setCurrentId(null);
      await refreshList();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSend = async (text) => {
    if (!text.trim()) return;
    setError(null);

    // Ensure a chat exists
    let id = currentId;
    if (!id) {
      const created = await api.createChat();
      id = created.id;
      setCurrentId(id);
    }

    // Optimistic user message
    setChat((prev) =>
      prev
        ? { ...prev, messages: [...prev.messages, { role: 'user', text, timestamp: new Date().toISOString() }] }
        : prev
    );
    setIsSending(true);

    try {
      const result = await api.sendMessage(id, text);
      setChat((prev) =>
        prev
          ? {
              ...prev,
              // Replace last (optimistic) user msg with the server one + append bot reply
              messages: [...prev.messages.slice(0, -1), result.user, result.bot],
            }
          : prev
      );
      await refreshList();
    } catch (err) {
      setError(err.message);
      // Roll back the optimistic user message
      setChat((prev) =>
        prev ? { ...prev, messages: prev.messages.slice(0, -1) } : prev
      );
    } finally {
      setIsSending(false);
    }
  };

  const ensureChatId = async () => {
    if (currentId) return currentId;
    const created = await api.createChat();
    setCurrentId(created.id);
    return created.id;
  };

  const handleUploadDocument = async (file) => {
    setError(null);
    setIsUploadingDoc(true);
    try {
      const id = await ensureChatId();
      const result = await api.uploadDocument(id, file);
      // Re-fetch to update documentName
      await loadChat(id);
      await refreshList();
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleUploadImage = async (file) => {
    setError(null);
    setIsUploadingImg(true);
    try {
      const id = await ensureChatId();
      const result = await api.uploadImage(id, file);

      // Generate local preview (dataURL) and cache by chatId
      const reader = new FileReader();
      reader.onload = () => {
        previewCache.current[id] = reader.result;
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      await loadChat(id);
      await refreshList();
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleClearFiles = async () => {
    if (!currentId) return;
    setError(null);
    try {
      await api.clearFiles(currentId);
      delete previewCache.current[currentId];
      setImagePreview(null);
      await loadChat(currentId);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        currentId={currentId}
        onNewChat={handleNewChat}
        onSelect={handleSelectChat}
        onDelete={handleDeleteChat}
      />

      <main className="main">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">✦</span>
            <span className="brand-name">Gemini Chatbot</span>
          </div>
          <div className="topbar-right">
            {!healthOk && (
              <span className="badge badge-warn" title="Backend can't reach Gemini">
                API key missing
              </span>
            )}
            {chat?.documentName && (
              <span className="badge" title={`Document: ${chat.documentName}`}>
                📄 {chat.documentName}
              </span>
            )}
            {chat?.image && (
              <span className="badge" title={`Image: ${chat.image.name}`}>
                🖼 {chat.image.name}
              </span>
            )}
            {(chat?.documentName || chat?.image) && (
              <button className="btn-ghost btn-sm" onClick={handleClearFiles} title="Clear attached files">
                clear
              </button>
            )}
          </div>
        </header>

        <ChatWindow
          chat={chat}
          imagePreview={imagePreview}
          isSending={isSending}
        />

        {error && (
          <div className="error-bar">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <InputBar
          onSend={handleSend}
          onUploadDocument={handleUploadDocument}
          onUploadImage={handleUploadImage}
          isSending={isSending}
          isUploadingDoc={isUploadingDoc}
          isUploadingImg={isUploadingImg}
          disabled={!healthOk}
        />
      </main>
    </div>
  );
}
