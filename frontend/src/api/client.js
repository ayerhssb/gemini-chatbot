// api/client.js
// Thin wrapper around fetch for the backend API.

const BASE = '/api';

async function handle(res) {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch (_) {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => fetch(`${BASE}/health`).then(handle),

  listChats: () => fetch(`${BASE}/chats`).then(handle),

  createChat: () =>
    fetch(`${BASE}/chats`, { method: 'POST' }).then(handle),

  getChat: (id) => fetch(`${BASE}/chats/${id}`).then(handle),

  deleteChat: (id) =>
    fetch(`${BASE}/chats/${id}`, { method: 'DELETE' }).then(handle),

  sendMessage: (id, text) =>
    fetch(`${BASE}/chats/${id}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }).then(handle),

  uploadDocument: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return fetch(`${BASE}/chats/${id}/document`, {
      method: 'POST',
      body: fd,
    }).then(handle);
  },

  uploadImage: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return fetch(`${BASE}/chats/${id}/image`, {
      method: 'POST',
      body: fd,
    }).then(handle);
  },

  clearFiles: (id) =>
    fetch(`${BASE}/chats/${id}/files`, { method: 'DELETE' }).then(handle),
};
