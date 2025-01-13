import React from 'react';

const Note: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      zIndex: 1000,
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Controls</h3>
      <ul style={{ 
        margin: 0,
        paddingLeft: '20px',
        listStyle: 'none'
      }}>
        <li>I/J/K/L - Move model forward/left/back/right</li>
        <li>N/M - Move model down/up</li>
        <li>U/O - Rotate model forward/backward</li>
      </ul>
    </div>
  );
};

export default Note; 