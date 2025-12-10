import React from 'react';

export default function ApiSettingsList({ local, setFormData, setEditingId, handleDeleteApi, testApi }) {
  return (
    <div className="api-list">
      <div className="api-list-title">List of APIs</div>
      {(local.apis || []).map((api) => (
        <div key={api.id} className="api-item">
          <div className="api-summary">
            <div className="api-name-display">{api.name}</div>
            {api.ip ? (
              <div className="api-url-display">{api.ip}{api.port ? `:${api.port}` : ''}</div>
            ) : (
              <div className="api-url-display">{api.baseUrl}</div>
            )}
          </div>
          <div className="api-item-actions">
            <button className="edit-btn" onClick={() => { setFormData(api); setEditingId(api.id); }} title="Edit API">Edit</button>
            <button className="test-btn" onClick={async ()=>{
              try { const res = await testApi({ apiId: api.id }); alert('Test result: ' + JSON.stringify(res)); }
              catch (e) { alert('Test failed: ' + String(e)); }
            }} title="Test API">Test</button>
            <button className="delete-btn" onClick={() => handleDeleteApi(api.id)} title="Delete API">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
