import React from 'react';

/**
 * Gabriel's chapel, exact pixels. Empty pews, or his seated congregation.
 * Both sheets share the title and cream margin, cropped the same way.
 * Décor colors do not recolor either painting.
 */
const SHEET = { w: 1024, h: 572 };
const ART = { x: 19, y: 47, w: 986, h: 509 };

export const ChapelNave: React.FC<{
  floor: string;
  drape: string;
  light: string;
  pew: string;
  /** Gabriel's seated congregation, same sheet size and crop as the empty nave. */
  withMourners?: boolean;
}> = ({ withMourners = false }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <img
        src={withMourners ? '/chapel/source/chapel-with-mourners.jpg' : '/chapel/source/chapel-with-pews.jpg'}
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
