import React from 'react';

/**
 * The nearest pew end panels, cut from the same sheet as the nave.
 * Drawn above the seated mourners so the arched boards stay in front
 * and the pew-back clip does not slice them.
 */
const SHEET = { w: 1024, h: 572 };
const ART = { x: 19, y: 47, w: 986, h: 509 };

export const ChapelPewEnds: React.FC = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 8 }}
      data-chapel-pew-ends
      aria-hidden
    >
      <img
        src="/chapel/pew-ends.png"
        alt=""
        draggable={false}
        className="absolute max-w-none select-none"
        style={{
          width: `${(SHEET.w / ART.w) * 100}%`,
          height: `${(SHEET.h / ART.h) * 100}%`,
          left: `${(-ART.x / ART.w) * 100}%`,
          top: `${(-ART.y / ART.h) * 100}%`,
        }}
      />
    </div>
  );
};
