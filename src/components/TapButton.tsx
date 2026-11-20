import React from 'react';
import { useTapAction } from '../hooks/useTapAction';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  onTap: () => void;
  moveThresholdPx?: number;
  maxDurationMs?: number;
};

/**
 * Button that activates only on a real tap (not scroll-drag).
 * Prefer this over onPointerDown for shop / list / purchase controls.
 */
export const TapButton: React.FC<Props> = ({
  onTap,
  moveThresholdPx,
  maxDurationMs,
  type = 'button',
  className,
  children,
  disabled,
  ...rest
}) => {
  const tap = useTapAction(onTap, { moveThresholdPx, maxDurationMs });
  return (
    <button
      type={type}
      disabled={disabled}
      className={className}
      style={{ touchAction: 'manipulation', ...(rest.style ?? {}) }}
      {...rest}
      {...(disabled ? {} : tap)}
    >
      {children}
    </button>
  );
};
