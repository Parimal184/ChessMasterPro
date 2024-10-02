// ValidMoveMarker.tsx
import React from 'react';
import '../../styles/ValidMoveMarker.scss';

const ValidMoveMarker: React.FC<{ position: { row: number; col: number } }> = ({ position }) => {
  const { row, col } = position;

  return (
    <div className="valid-move-marker" style={{
      top: `${row * 100}px`,  // Adjust 100 to your square height if different
      left: `${col * 100}px`, // Adjust 100 to your square width if different
    }} />
  );
};

export default ValidMoveMarker;
