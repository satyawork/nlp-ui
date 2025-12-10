import React from 'react';

export default function ApiSettingsDefault({ local, setLocal, handleSaveDefault, handleTestDefault }) {
return (
    <div className="default-api">
    <div className="form-row-inline">
        <h4>Default API</h4>
            <input
                type="text"
                className="form-input compact name-field"
                value={local.default?.name || ''}
                placeholder="Lab system"
                onChange={(e) => setLocal({ ...local, default: { ...local.default, name: e.target.value } })}
            />
            <input
                type="text"
                className="form-input compact base-field"
                value={local.default?.baseUrl || ''}
                placeholder="http://127.0.0.1"
                onChange={(e) => setLocal({ ...local, default: { ...local.default, baseUrl: e.target.value } })}
            />
            <input
                type="text"
                className="form-input compact small endpoint-field"
                value={local.default?.port || ''}
                placeholder="8080"
                onChange={(e) => setLocal({ ...local, default: { ...local.default, port: e.target.value } })}
            />
        </div>
        <div className="form-group">
            <div className="headers-list">
                {(local.default?.headers || []).map((h, idx) => (
                    <div key={idx} className="header-row">
                        <input
                            type="text"
                            placeholder="Header name"
                            value={h.key}
                            onChange={(e) => {
                                const nh = [...(local.default.headers || [])];
                                nh[idx].key = e.target.value;
                                setLocal({ ...local, default: { ...local.default, headers: nh } });
                            }}
                            className="header-key"
                        />
                        <input
                            type="text"
                            placeholder="Header value"
                            value={h.value}
                            onChange={(e) => {
                                const nh = [...(local.default.headers || [])];
                                nh[idx].value = e.target.value;
                                setLocal({ ...local, default: { ...local.default, headers: nh } });
                            }}
                            className="header-value"
                        />
                        <button
                            className="remove-header-btn"
                            onClick={() => {
                                const nh = (local.default.headers || []).filter((_, i) => i !== idx);
                                setLocal({ ...local, default: { ...local.default, headers: nh } });
                            }}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
            <button
                className="add-header-btn"
                onClick={() =>
                    setLocal({
                        ...local,
                        default: { ...local.default, headers: [...(local.default.headers || []), { key: '', value: '' }] },
                    })
                }
            >
                + Add Header
            </button>
        </div>
        <div className="form-actions">
            <button onClick={handleSaveDefault} className="save-btn">
                💾 Save Default
            </button>
            <button onClick={handleTestDefault} className="test-btn">
                Test Default
            </button>
        </div>
    </div>
);
}
