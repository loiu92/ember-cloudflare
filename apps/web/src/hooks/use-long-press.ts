import { useEffect, useEffectEvent, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from "react";

/** How long a finger must hold a message before its drawer opens, as Slack's does. */
const HOLD_MS = 450;

/** How far a finger may drift while holding before the press counts as a scroll instead. */
const HOLD_SLOP_PX = 8;

/** The pointer handlers a row takes so a finger can hold it. */
export interface LongPressProps {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onContextMenu: (event: MouseEvent<HTMLElement>) => void;
}

/**
 * Watches a touch press on `row`: holding it still for HOLD_MS calls `onHeld`, and `holding` says while
 * the finger is down. A mouse never holds anything, and a press gives up when its finger drifts beyond a
 * few pixels, when a second finger lands, when the page scrolls, or when it lifts. The press that calls
 * `onHeld` also swallows the one click its finger would leave behind, so what it opens doesn't follow a
 * link under the finger, and the row's own long-press menu never comes up with it.
 */
export function useLongPress(row: RefObject<HTMLElement | null>, enabled: boolean, onHeld: () => void) {
  const [holding, setHolding] = useState(false);
  // The press waiting out its hold: which finger, and where it landed.
  const press = useRef<{ id: number; x: number; y: number } | null>(null);
  // Whether a press has just called `onHeld`, whose click and menu are held back until it ends.
  const triggered = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const stop = useEffectEvent(() => {
    clearTimeout(timer.current);
    press.current = null;
    setHolding(false);
  });

  const held = useEffectEvent(() => {
    triggered.current = true;
    row.current?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        triggered.current = false;
      },
      { capture: true, once: true },
    );
    onHeld();
  });

  const down = (event: PointerEvent<HTMLElement>) => {
    if (!enabled || event.pointerType !== "touch") return;
    // A press on what the row has open already, as its actions bar, is that thing's, not the row's hold.
    if (event.target instanceof Element && event.target.closest("[data-message-actions]")) return;
    triggered.current = false;
    // A second finger lands: the first gives up its hold rather than both opening things.
    if (press.current) return stop();
    press.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    setHolding(true);
    timer.current = setTimeout(() => {
      press.current = null;
      setHolding(false);
      held();
    }, HOLD_MS);
  };

  const move = (event: PointerEvent<HTMLElement>) => {
    const waiting = press.current;
    if (!waiting || event.pointerId !== waiting.id) return;
    if (Math.hypot(event.clientX - waiting.x, event.clientY - waiting.y) > HOLD_SLOP_PX) stop();
  };

  // The message is leaving under a finger that scrolls away, so its hold gives up too.
  useEffect(() => {
    if (!holding) return;
    const events = new AbortController();
    document.addEventListener("scroll", () => stop(), { signal: events.signal, capture: true, passive: true });
    return () => {
      events.abort();
      stop();
    };
  }, [holding]);

  // What a change takes away while a finger holds, as an editor opening over the message does, ends it.
  useEffect(() => {
    if (!enabled) stop();
  }, [enabled]);

  // A press doesn't outlive its row.
  useEffect(() => () => stop(), []);

  return {
    holding,
    props: {
      onPointerDown: down,
      onPointerMove: move,
      onPointerUp: stop,
      onPointerCancel: stop,
      // A held finger, or one that just opened its drawer, draws no menu of the row's own.
      onContextMenu: (event: MouseEvent<HTMLElement>) => {
        if (holding || triggered.current) event.preventDefault();
      },
    } satisfies LongPressProps,
  };
}
