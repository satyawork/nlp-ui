import React, { useRef, useState } from 'react';

export default function FileUploader({ onUploaded }) {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  async function uploadFile(file) {
    setBusy(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/files/upload', { method: 'POST', body: form });
    const j = await res.json();
    setBusy(false);
    if (j.ok) {
      onUploaded(j.meta);
    } else {
      alert('Upload failed: '+(j.error || 'unknown'));
    }
  }

  return (
    <div className="file-uploader">
      <input ref={ref} type="file" style={{ display: 'none' }} onChange={e => uploadFile(e.target.files[0])} />
      <button
        onClick={() => ref.current.click()}
        disabled={busy}
        aria-label="Upload file"
        title="Upload file"
        className="icon-btn upload-btn"
      >
        {busy ? (
          // small spinner
          <svg width="16" height="16" viewBox="0 0 50 50" aria-hidden>
            <path fill="currentColor" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068
              c0-8.073,6.541-14.614,14.614-14.614c8.073,0,14.614,6.541,14.614,14.614H43.935z">
              <animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/>
            </path>
          </svg>
        ) : (
          // upload icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 21H3v-4a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}
