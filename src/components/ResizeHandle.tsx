import { useRef } from 'react';

type Edge = 'left' | 'right' | 'top';

interface Props {
  edge: Edge;
  size: number;
  min: number;
  max: number;
  onResize: (size: number) => void;
}

export function ResizeHandle({ edge, size, min, max, onResize }: Props) {
  const handleRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startCoord: number; startSize: number } | null>(null);
  const axis: 'x' | 'y' = edge === 'top' ? 'y' : 'x';

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = {
      startCoord: axis === 'x' ? e.clientX : e.clientY,
      startSize: size,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const cur = axis === 'x' ? e.clientX : e.clientY;
    let delta = cur - dragRef.current.startCoord;
    // 핸들이 sidebar의 "안쪽" 가장자리에 있으면 delta를 반전.
    // - left sidebar: 핸들이 right edge → 그대로 (오른쪽 드래그 = wider)
    // - right sidebar: 핸들이 left edge → 반전 (왼쪽 드래그 = wider)
    // - bottom sidebar: 핸들이 top edge → 반전 (위쪽 드래그 = taller)
    if (edge === 'left' || edge === 'top') delta = -delta;
    const newSize = Math.min(max, Math.max(min, dragRef.current.startSize + delta));
    onResize(newSize);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    handleRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={handleRef}
      className={`resize-handle resize-handle-${edge}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="separator"
      aria-orientation={axis === 'x' ? 'vertical' : 'horizontal'}
      aria-label="크기 조정"
    />
  );
}
