// routes/chat.js
// REST endpoints for chats, messages, and file uploads.

const express = require('express');
const multer = require('multer');

const chatStore = require('../store/chatStore');
const { extractText, processImage } = require('../services/fileProcessor');
const { sendMessage } = require('../services/gemini');

const router = express.Router();

// Multer: keep files in memory (small files only). 15MB cap.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// ----- Chat lifecycle -----

// Create a new chat
router.post('/chats', (req, res) => {
  const chat = chatStore.createChat();
  res.status(201).json({
    id: chat.id,
    title: chat.title,
    createdAt: chat.createdAt,
    messages: [],
    documentName: null,
    image: null,
  });
});

// List all chats (sidebar)
router.get('/chats', (req, res) => {
  res.json(chatStore.listChats());
});

// Get a chat with full messages
router.get('/chats/:id', (req, res) => {
  const chat = chatStore.getChat(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  // Don't ship the raw base64 image bytes back to the client (they already have it)
  res.json({
    id: chat.id,
    title: chat.title,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messages: chat.messages,
    documentName: chat.documentName,
    documentPreview: chat.documentText
      ? chat.documentText.slice(0, 200) + (chat.documentText.length > 200 ? '…' : '')
      : null,
    image: chat.image
      ? { name: chat.image.name, mimeType: chat.image.mimeType }
      : null,
  });
});

// Delete a chat
router.delete('/chats/:id', (req, res) => {
  const ok = chatStore.deleteChat(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Chat not found' });
  res.status(204).end();
});

// ----- File uploads -----

// Upload a document (PDF/TXT). Replaces any existing doc on this chat.
router.post('/chats/:id/document', upload.single('file'), async (req, res) => {
  try {
    const chat = chatStore.getChat(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { text, name } = await extractText(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    if (!text) {
      return res.status(400).json({
        error: 'Could not extract any text from the uploaded file.',
      });
    }

    chatStore.setDocument(chat.id, text, name);
    res.json({
      ok: true,
      documentName: name,
      preview: text.slice(0, 200) + (text.length > 200 ? '…' : ''),
      length: text.length,
    });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(400).json({ error: err.message || 'Failed to process document' });
  }
});

// Upload an image (PNG/JPG). Replaces any existing image on this chat.
router.post('/chats/:id/image', upload.single('file'), async (req, res) => {
  try {
    const chat = chatStore.getChat(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const image = processImage(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    chatStore.setImage(chat.id, image);
    res.json({
      ok: true,
      image: { name: image.name, mimeType: image.mimeType },
    });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(400).json({ error: err.message || 'Failed to process image' });
  }
});

// Optional: clear attached files for a chat
router.delete('/chats/:id/files', (req, res) => {
  const chat = chatStore.clearFiles(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  res.json({ ok: true });
});

// ----- Messaging -----

// Send a message in a chat. Body: { text }
router.post('/chats/:id/message', async (req, res) => {
  try {
    const chat = chatStore.getChat(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const text = (req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Message text is required' });

    // Persist user message FIRST (so history reflects it on subsequent calls)
    const userMsg = chatStore.addMessage(chat.id, {
      role: 'user',
      text,
      attachedDocument: chat.documentName || null,
      attachedImage: chat.image ? chat.image.name : null,
    });

    // For Gemini, send history that DOES NOT include the new user message — we
    // pass that as the current turn. Re-fetch chat and slice off the new user msg.
    const fresh = chatStore.getChat(chat.id);
    const historyOnly = {
      ...fresh,
      messages: fresh.messages.slice(0, -1),
    };

    const reply = await sendMessage(historyOnly, text);

    const botMsg = chatStore.addMessage(chat.id, { role: 'model', text: reply });

    res.json({ user: userMsg, bot: botMsg });
  } catch (err) {
    console.error('Message error:', err);
    res.status(500).json({
      error: err.message || 'Failed to get a response from Gemini',
    });
  }
});

module.exports = router;
