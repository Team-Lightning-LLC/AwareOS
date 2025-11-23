// src/shell/NotificationBar.jsx
// Shows orchestrator suggestions at the top

import React from 'react';

export default function NotificationBar({ suggestions }) {
  if (suggestions.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '10px 20px',
      background: 'linear-gradient(to bottom, rgba(26, 26, 46, 0.98), rgba(26, 26, 46, 0.95))',
      borderBottom: '1px solid #333',
      backdropFilter: 'blur(10px)'
    }}>
      {suggestions.slice(0, 3).map((suggestion, i) => (
        <Suggestion key={suggestion.id} suggestion={suggestion} isFirst={i === 0} />
      ))}
    </div>
  );
}

function Suggestion({ suggestion, isFirst }) {
  const priorityColors = {
    low: '#666',
    medium: '#f59e0b',
    high: '#ef4444'
  };

  return (
    <div style={{
      background: isFirst ? '#252540' : '#1a1a2e',
      border: `1px solid ${priorityColors[suggestion.priority] || '#333'}`,
      borderRadius: '6px',
      padding: '12px 15px',
      marginBottom: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: '#eee', marginBottom: '4px' }}>
          🤖 {suggestion.message}
        </div>
        <div style={{ fontSize: '11px', color: '#888' }}>
          {suggestion.actions?.length || 0} action{suggestion.actions?.length !== 1 ? 's' : ''} suggested
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => handleApprove(suggestion)}
          style={{
            background: '#10b981',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500'
          }}
        >
          Approve
        </button>
        <button
          onClick={() => handleDismiss(suggestion.id)}
          style={{
            background: 'transparent',
            color: '#888',
            border: '1px solid #444',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function handleApprove(suggestion) {
  console.log('Approving suggestion:', suggestion);
  // In future: call orchestrator.approveSuggestion(suggestion.id, suggestion.actions)
  alert('Suggestion approved! (Integration coming soon)');
}

function handleDismiss(suggestionId) {
  console.log('Dismissing suggestion:', suggestionId);
  // In future: call orchestrator.dismissSuggestion(suggestionId)
}
