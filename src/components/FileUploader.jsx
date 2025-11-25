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
      <button onClick={() => ref.current.click()} disabled={busy}>{busy ? 'Uploading...' : 'Upload'}</button>
    </div>
  );
}
