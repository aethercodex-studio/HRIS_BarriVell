/**
 * Pointer-based drag & resize for shift blocks (works with mouse and touch).
 *
 * While dragging, a `preview` { shift, date, start, end } is rendered instead of
 * the stored shift; on release the change is saved in one update.
 * A press without movement counts as a click (→ opens the editor).
 */
import { useCallback, useRef, useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { GRID_START_MIN } from '@/config/constants';
import { toHHMM, MINUTES_PER_DAY } from '@/lib/time';
import * as actions from '@/domain/actions';

const SNAP_MIN = 15;
const MIN_DURATION = 30;
const MOVE_THRESHOLD_PX = 5;

export function useShiftDrag({ hourPx, onClick }) {
  const { update, showToast } = useApp();
  const [preview, setPreview] = useState(null);
  const drag = useRef(null);
  const lastDragEnd = useRef(0);

  const startDrag = useCallback(
    (ev, item, mode) => {
      if (ev.button != null && ev.button !== 0) return;
      ev.stopPropagation();
      const g = {
        item,
        mode,
        x0: ev.clientX,
        y0: ev.clientY,
        a0: item.startMin,
        b0: item.endMin,
        moved: false,
        current: null,
      };
      drag.current = g;

      const onMove = (e) => {
        const dy = e.clientY - g.y0;
        const dx = e.clientX - g.x0;
        if (!g.moved && Math.abs(dy) < MOVE_THRESHOLD_PX && Math.abs(dx) < MOVE_THRESHOLD_PX) return;
        g.moved = true;
        const delta = Math.round(((dy / hourPx) * 60) / SNAP_MIN) * SNAP_MIN;
        let a = g.a0;
        let b = g.b0;
        let date = item.shift.date;
        if (g.mode === 'move') {
          const dur = g.b0 - g.a0;
          a = Math.max(0, Math.min(MINUTES_PER_DAY - dur, g.a0 + delta));
          b = a + dur;
          const col = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.dataset?.calday);
          if (col) date = col.dataset.calday;
        } else if (g.mode === 'top') {
          a = Math.max(0, Math.min(g.b0 - MIN_DURATION, g.a0 + delta));
        } else {
          b = Math.min(MINUTES_PER_DAY, Math.max(g.a0 + MIN_DURATION, g.b0 + delta));
        }
        const next = { shift: item.shift, date, start: toHHMM(a + GRID_START_MIN), end: toHHMM(b + GRID_START_MIN) };
        g.current = next;
        setPreview(next);
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        drag.current = null;
        setPreview(null);
        if (!g.moved) return onClick(item.shift);
        lastDragEnd.current = Date.now();
        const p = g.current;
        if (!p || (p.date === item.shift.date && p.start === item.shift.start && p.end === item.shift.end)) return;
        update(actions.saveShift, { ...item.shift, date: p.date, start: p.start, end: p.end });
        showToast(`Turno actualizado: ${p.start}–${p.end}`);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [hourPx, onClick, update, showToast],
  );

  /** The click that follows a drag must not create a new shift. */
  const wasJustDragged = useCallback(() => Date.now() - lastDragEnd.current < 400, []);

  return { preview, startDrag, wasJustDragged };
}
