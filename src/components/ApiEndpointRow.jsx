import React from 'react';

export default function ApiEndpointRow({
  toolKey,
  displayName,
  keyName,
  actionLabel,
  value,
  index,
  withEnable,
  toolObj,
  editing,
  onToggle,
  onMakeEditable,
  onStopEditing,
  onUpdate
}) {
  const isEditing = editing?.tool === toolKey && editing?.key === keyName;
  const rowClass = `endpoint-row ${toolObj.enable === 'true' ? 'enabled' : 'disabled'}`;

  return (
    <div className={`${rowClass} endpoint-grid ${withEnable ? 'has-enable' : ''}`}>
      {withEnable ? (
        index === 0 ? (
          <div className="cell check">
            <input type="checkbox" checked={toolObj.enable === 'true'} onChange={(e) => onToggle(toolKey, e.target.checked)} />
          </div>
        ) : (
          <div className="cell check" />
        )
      ) : null}

      <div className="cell tool" style={{ fontWeight: '600' }}>{index === 0 ? displayName : ''}</div>

  <div className="cell action" style={{ color: '#666' }}>{actionLabel || keyName}</div>

      <div className="cell url">
        {isEditing ? (
          <input autoFocus onBlur={onStopEditing} value={value} onChange={(e) => onUpdate(toolKey, keyName, e.target.value)} />
        ) : (
          <span onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); onMakeEditable(toolKey, keyName); }} style={{ wordBreak: 'break-all', cursor: 'text' }}>{value}</span>
        )}
      </div>
    </div>
  );
}
