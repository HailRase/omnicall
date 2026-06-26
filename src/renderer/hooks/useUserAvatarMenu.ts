import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  computeAnchoredMenuPosition,
  type AnchoredMenuPosition,
} from "../helpers/computeAnchoredMenuPosition.js";

export type UseUserAvatarMenuResult = Readonly<{
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  position: AnchoredMenuPosition;
  toggle: () => void;
  close: () => void;
}>;

/**
 * - Purpose: manage avatar menu open state, dismiss gestures, and anchored position.
 * - Inputs: none (anchor and menu element refs are created internally).
 * - Outputs: open flag, refs, computed position, toggle and close callbacks.
 */
export function useUserAvatarMenu(): UseUserAvatarMenuResult {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<AnchoredMenuPosition>({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((): void => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (anchor === null || menu === null) {
      return;
    }

    setPosition(
      computeAnchoredMenuPosition(
        anchor.getBoundingClientRect(),
        menu.getBoundingClientRect(),
      ),
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();

    const handleReposition = (): void => {
      updatePosition();
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (anchorRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const toggle = useCallback((): void => {
    setOpen((current) => !current);
  }, []);

  const close = useCallback((): void => {
    setOpen(false);
  }, []);

  return {
    open,
    anchorRef,
    menuRef,
    position,
    toggle,
    close,
  };
}
