import React, { useEffect, useState } from 'react';
import ThemeToggle from '../contexts/ThemeToggle';
import { useApiSettings } from '../contexts/ApiSettingsContext';

export default function ApiSettingsModal({ onClose }) {
  const { settings, saveSettings, loading } = useApiSettings();
  const [local, setLocal] = useState(null);

  useEffect(() => {
    const def = settings || {};
    const initial = {
      MCP_CONFIG: def.MCP_CONFIG || { uploadfile: 'http://localhost:8080/upload-file', chat: 'http://localhost:8080/chat' },
      RAG_TOOL: def.RAG_TOOL || { enable: 'false', uploadfile: 'http://localhost:9000/upload', collectionList: 'http://localhost:9000/collections', askrag: 'http://localhost:9000/ask' },
      SUMMARY_TOOL: def.SUMMARY_TOOL || { enable: 'false', getSummary: 'http://127.0.0.1:8003/upload/' }
    };
    setLocal(initial);
  }, [settings]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!local && loading) return null;
  if (!local) return null;

  function setEnable(tool, value) {
    const copy = { ...local };
    copy[tool] = { ...copy[tool], enable: value ? 'true' : 'false' };
    setLocal(copy);
  }

  function makeEditable(tool, key) {
    setLocal({ ...local, _editing: { tool, key } });
  }

  function stopEditing() {
    const copy = { ...local };
    delete copy._editing;
    setLocal(copy);
  }

  function updateField(tool, key, value) {
    const copy = { ...local };
    copy[tool] = { ...copy[tool], [key]: value };
    setLocal(copy);
  }

  async function handleSave() {
    try {
      await saveSettings(local);
      alert('Settings saved');
      onClose();
    } catch (e) {
      alert('Save failed: ' + String(e));
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <h3>Integration Configuration</h3>
            <div className="modal-subtitle">Edit endpoints and enable/disable tools</div>
          </div>
          <div className="modal-controls">
            <ThemeToggle />
            <button onClick={onClose} aria-label="Close settings" title="Close (Esc)" className="close-icon-btn">✕</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="api-form">
            <div className={`tool-row`}>{/* MCP row */}
              <div className="col title">MCP</div>
              <div className="col names">
                <div>Upload</div>
                <div>Chat</div>
              </div>
              <div className="col values">
                <div>{local._editing?.tool === 'MCP_CONFIG' && local._editing?.key === 'uploadfile' ? (
                    <input autoFocus onBlur={stopEditing} value={local.MCP_CONFIG.uploadfile} onChange={(e)=> updateField('MCP_CONFIG','uploadfile', e.target.value)} />
                  ) : (
                    <span onDoubleClick={()=> makeEditable('MCP_CONFIG','uploadfile')}>{local.MCP_CONFIG.uploadfile}</span>
                  )}</div>
                <div>{local._editing?.tool === 'MCP_CONFIG' && local._editing?.key === 'chat' ? (
                    <input autoFocus onBlur={stopEditing} value={local.MCP_CONFIG.chat} onChange={(e)=> updateField('MCP_CONFIG','chat', e.target.value)} />
                  ) : (
                    <span onDoubleClick={()=> makeEditable('MCP_CONFIG','chat')}>{local.MCP_CONFIG.chat}</span>
                  )}</div>
              </div>
            </div>

            <div className={`tool-row ${local.RAG_TOOL.enable === 'true' ? 'enabled' : 'disabled'}`}>{/* RAG row */}
              <div className="col check"><input type="checkbox" checked={local.RAG_TOOL.enable === 'true'} onChange={(e)=> setEnable('RAG_TOOL', e.target.checked)} /></div>
              <div className="col title">RAG</div>
              <div className="col names">
                <div>Upload</div>
                <div>Collections</div>
                <div>Ask</div>
              </div>
              <div className="col values">
                <div>{local._editing?.tool === 'RAG_TOOL' && local._editing?.key === 'uploadfile' ? (
                    <input autoFocus onBlur={stopEditing} value={local.RAG_TOOL.uploadfile} onChange={(e)=> updateField('RAG_TOOL','uploadfile', e.target.value)} />
                  ) : (
                    <span onDoubleClick={()=> makeEditable('RAG_TOOL','uploadfile')}>{local.RAG_TOOL.uploadfile}</span>
                  )}</div>
                <div>{local._editing?.tool === 'RAG_TOOL' && local._editing?.key === 'collectionList' ? (
                    <input autoFocus onBlur={stopEditing} value={local.RAG_TOOL.collectionList} onChange={(e)=> updateField('RAG_TOOL','collectionList', e.target.value)} />
                  ) : (
                    <span onDoubleClick={()=> makeEditable('RAG_TOOL','collectionList')}>{local.RAG_TOOL.collectionList}</span>
                  )}</div>
                <div>{local._editing?.tool === 'RAG_TOOL' && local._editing?.key === 'askrag' ? (
                    <input autoFocus onBlur={stopEditing} value={local.RAG_TOOL.askrag} onChange={(e)=> updateField('RAG_TOOL','askrag', e.target.value)} />
                  ) : (
                    <span onDoubleClick={()=> makeEditable('RAG_TOOL','askrag')}>{local.RAG_TOOL.askrag}</span>
                  )}</div>
              </div>
            </div>

            <div className={`tool-row ${local.SUMMARY_TOOL.enable === 'true' ? 'enabled' : 'disabled'}`}>{/* SUMMARY row */}
              <div className="col check"><input type="checkbox" checked={local.SUMMARY_TOOL.enable === 'true'} onChange={(e)=> setEnable('SUMMARY_TOOL', e.target.checked)} /></div>
              <div className="col title">SUMMARY</div>
              <div className="col names">
                <div>Get Summary</div>
              </div>
              <div className="col values">
                <div>{local._editing?.tool === 'SUMMARY_TOOL' && local._editing?.key === 'getSummary' ? (
                    <input autoFocus onBlur={stopEditing} value={local.SUMMARY_TOOL.getSummary} onChange={(e)=> updateField('SUMMARY_TOOL','getSummary', e.target.value)} />
                  ) : (
                    <span onDoubleClick={()=> makeEditable('SUMMARY_TOOL','getSummary')}>{local.SUMMARY_TOOL.getSummary}</span>
                  )}</div>
              </div>
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={handleSave}>💾 Save</button>
              <button className="cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
          