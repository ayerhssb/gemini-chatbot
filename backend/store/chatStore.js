// store/chatStore.js
// Simple in-memory chat store. Resets on server restart (per spec).

const { v4: uuidv4 } = require('uuid');

class ChatStore {
  constructor() {
    // Map<chatId, ChatSession>
    this.chats = new Map();
  }

  createChat(title = 'New Chat') {
    const id = uuidv4();
    const chat = {
      id,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],         // [{ role: 'user'|'model', text, image?, timestamp }]
      documentText: null,   // extracted PDF/TXT content
      documentName: null,
      image: null,          // { mimeType, data (base64), name }
    };
    this.chats.set(id, chat);
    return chat;
  }

  getChat(id) {
    return this.chats.get(id) || null;
  }

  listChats() {
    // Return chat metadata only (no full message bodies) for sidebar list
    return Array.from(this.chats.values())
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messageCount: c.messages.length,
        hasDocument: !!c.documentText,
        hasImage: !!c.image,
      }));
  }

  deleteChat(id) {
    return this.chats.delete(id);
  }

  addMessage(id, message) {
    const chat = this.chats.get(id);
    if (!chat) return null;
    const msg = { ...message, timestamp: new Date().toISOString() };
    chat.messages.push(msg);
    chat.updatedAt = new Date().toISOString();

    // Auto-title chat from first user message
    if (chat.title === 'New Chat' && message.role === 'user' && message.text) {
      chat.title = message.text.slice(0, 40) + (message.text.length > 40 ? '…' : '');
    }
    return msg;
  }

  setDocument(id, text, name) {
    const chat = this.chats.get(id);
    if (!chat) return null;
    chat.documentText = text;
    chat.documentName = name;
    chat.updatedAt = new Date().toISOString();
    return chat;
  }

  setImage(id, image) {
    const chat = this.chats.get(id);
    if (!chat) return null;
    chat.image = image;
    chat.updatedAt = new Date().toISOString();
    return chat;
  }

  clearFiles(id) {
    const chat = this.chats.get(id);
    if (!chat) return null;
    chat.documentText = null;
    chat.documentName = null;
    chat.image = null;
    return chat;
  }
}

module.exports = new ChatStore();
