/**
 * - Purpose: click-to-toggle help popup for one system template variable.
 * - Inputs: variable display name, help text, test id.
 * - Outputs: icon control; popup portals into nearest scroll container with flip/shift.
 */

import { autoUpdate, flip, offset, shift } from "@floating-ui/dom";
import { useFloating } from "@floating-ui/react-dom";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../../i18n/index.js";
import { AppIcon } from "../../icons/AppIcon.js";
import { findNearestScrollContainer } from "./findNearestScrollContainer.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesVariableHelpButtonProps = Readonly<{
  variableLabel: string;
  description: string;
  testId: string;
}>;

const EDGE_PADDING_PX = 8;
const POPUP_OFFSET_PX = 6;

/**
 * @uiMeta f=F-031
 */
export function ExternalServicesVariableHelpButton({
  variableLabel,
  description,
  testId,
}: ExternalServicesVariableHelpButtonProps): JSX.Element {
  const { t } = useI18n();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [clipRoot, setClipRoot] = useState<HTMLElement | null>(null);
  const hostRef = useRef<HTMLSpanElement | null>(null);

  const { refs, floatingStyles, placement, update } = useFloating({
    open,
    strategy: "absolute",
    placement: "bottom-start",
    middleware: [
      offset(POPUP_OFFSET_PX),
      flip({
        padding: EDGE_PADDING_PX,
        fallbackPlacements: ["top-start", "bottom-end", "top-end"],
        ...(clipRoot !== null ? { boundary: clipRoot } : {}),
      }),
      shift({
        padding: EDGE_PADDING_PX,
        ...(clipRoot !== null ? { boundary: clipRoot } : {}),
      }),
    ],
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    void update();
    const reference = refs.reference.current;
    const floating = refs.floating.current;
    if (reference === null || floating === null) {
      return;
    }
    return autoUpdate(reference, floating, update);
  }, [open, clipRoot, refs.floating, refs.reference, update]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (hostRef.current?.contains(target) === true) {
        return;
      }
      if (refs.floating.current?.contains(target) === true) {
        return;
      }
      setOpen(false);
      setClipRoot(null);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
        setClipRoot(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, refs.floating]);

  const close = (): void => {
    setOpen(false);
    setClipRoot(null);
  };

  const toggle = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (open) {
      close();
      return;
    }
    setClipRoot(findNearestScrollContainer(event.currentTarget));
    setOpen(true);
  };

  const onButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  };

  const popupNode = open ? (
    <div
      ref={refs.setFloating}
      id={panelId}
      role="dialog"
      className={styles.variableHelpPopup}
      style={floatingStyles}
      data-testid={`${testId}-popup`}
      data-placement={placement}
      aria-label={variableLabel}
    >
      {description}
    </div>
  ) : null;

  const popup =
    popupNode === null
      ? null
      : clipRoot !== null
        ? createPortal(popupNode, clipRoot)
        : popupNode;

  return (
    <>
      <span ref={hostRef} className={styles.variableHelpHost}>
        <button
          type="button"
          ref={refs.setReference}
          className={styles.variableHelpButton}
          data-testid={testId}
          aria-label={t("settings.integrations.externalServices.variables.helpAria", {
            name: variableLabel,
          })}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={toggle}
          onKeyDown={onButtonKeyDown}
        >
          <AppIcon
            id="settings.integrations.external-services.variableHelp"
            decorative
            size={14}
          />
        </button>
      </span>
      {popup}
    </>
  );
}
