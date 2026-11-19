import React from 'react';

/**
 * Gabriel's chapel, exact pixels from the with-pews sheet.
 * The sheet's title and cream margin stay outside the frame.
 * Décor colors do not recolor this painting.
 */
const SHEET = { w: 1024, h: 572 };
const ART = { x: 19, y: 47, w: 986, h: 509 };

export const ChapelNave: React.FC<{
  floor: string;
  drape: string;
  light: string;
  pew: string;
}> = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <img
        src="/chapel/source/chapel-with-pews.jpg"
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

export const CHAPEL_ART_ASPECT = ART.w / ART.h;
