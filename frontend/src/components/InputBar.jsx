import { useRef, useState } from 'react';

export default function InputBar({
  onSend,
  onUploadDocument,
  onUploadImage,
  isSending,
  isUploadingDoc,
  isUploadingImg,
  disabled,
}) {
  const [text, setText] = useState('');
  const docInputRef = useRef(null);
  const imgInputRef = useRef(null);
  const taRef = useRef(null);

  const submit = () => {
    if (!text.trim() || isSending) return;
    onSend(text.trim());
    setText('');
    // Reset textarea height
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const autoResize = (e) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleDocChange = async (e) => {
    const f = e.target.files?.[0];
    if (f) await onUploadDocument(f);
    e.target.value = '';
  };

  const handleImgChange = async (e) => {
    const f = e.target.files?.[0];
    if (f) await onUploadImage(f);
    e.target.value = '';
  };

  return (
    <div className="input-bar">
      <div className="input-shell">
        <div className="input-actions">
          <button
            className="icon-btn"
            onClick={() => docInputRef.current?.click()}
            disabled={isUploadingDoc || disabled}
            title="Upload document (PDF or TXT)"
          >
            {isUploadingDoc ? <span className="spinner" /> : <span>📄</span>}
          </button>
          <button
            className="icon-btn"
            onClick={() => imgInputRef.current?.click()}
            disabled={isUploadingImg || disabled}
            title="Upload image (PNG or JPG)"
          >
            {isUploadingImg ? <span className="spinner" /> : <span>🖼</span>}
          </button>

          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={handleDocChange}
            hidden
          />
          <input
            ref={imgInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            onChange={handleImgChange}
            hidden
          />
        </div>

        <textarea
          ref={taRef}
          className="input-text"
          placeholder={disabled ? 'Add GEMINI_API_KEY to backend/.env to start' : 'Message…  (Shift + Enter for newline)'}
          value={text}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
        />

        <button
          className="send-btn"
          onClick={submit}
          disabled={!text.trim() || isSending || disabled}
          title="Send"
        >
          {isSending ? <span className="spinner" /> : <span>→</span>}
        </button>
      </div>
      <div className="input-foot">
        Powered by Google Gemini · Files & messages stay in this session only.
      </div>
    </div>
  );
}
