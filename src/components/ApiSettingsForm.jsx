import React from 'react';

export default function ApiSettingsForm({ formData, setFormData, handleSaveApi, testApi, onCancel }) {
  return (
    <div className="api-form">
      <h3>{formData.id ? 'Edit API' : '➕ Add New API'}</h3>

      <div className="form-row-inline">
        <input type="text" value={formData.name} onChange={(e)=> setFormData({...formData, name: e.target.value})} placeholder="API name (e.g., LLM Model)" className="form-input compact name-field" />
        <input type="text" value={formData.ip || ''} onChange={(e)=> setFormData({...formData, ip: e.target.value})} placeholder="http://127.0.0.1" className="form-input compact base-field" />
        <input type="text" value={formData.port || ''} onChange={(e)=> setFormData({...formData, port: e.target.value})} placeholder="8080" className="form-input compact small endpoint-field" />
        <input type="text" value={formData.endpoint || ''} onChange={(e)=> setFormData({...formData, endpoint: e.target.value})} placeholder="Endpoint path (e.g., /v1/model/complete)" className="form-input compact endpoint-field" />
      </div>
      <div className="form-group">
        <div className="headers-list">
          {(formData.headers || []).map((header, hIndex) => (
            <div key={hIndex} className="header-row">
              <input type="text" placeholder="Header name" value={header.key} onChange={(e)=>{ const nh = [...formData.headers]; nh[hIndex].key = e.target.value; setFormData({...formData, headers: nh}); }} className="header-key" />
              <input type="text" placeholder="Header value" value={header.value} onChange={(e)=>{ const nh = [...formData.headers]; nh[hIndex].value = e.target.value; setFormData({...formData, headers: nh}); }} className="header-value" />
              <button className="remove-header-btn" onClick={() => { const nh = (formData.headers||[]).filter((_, idx) => idx !== hIndex); setFormData({...formData, headers: nh}); }}>✕</button>
            </div>
          ))}
        </div>
        <button className="add-header-btn" onClick={() => setFormData({...formData, headers: [...(formData.headers||[]), {key:'', value:''}]})}>+ Add Header</button>
      </div>
      <div className="form-actions">
        <button onClick={handleSaveApi} className="save-btn">💾 Save</button>
        <button className="test-btn" onClick={async ()=>{ try { const res = await testApi({ apiId: formData.id, config: formData }); alert('Test result: ' + JSON.stringify(res)); } catch (e) { alert('Test failed: ' + String(e)); }}}>Test</button>
        <button onClick={onCancel} className="cancel-btn">Cancel</button>
      </div>
    </div>
  );
}
