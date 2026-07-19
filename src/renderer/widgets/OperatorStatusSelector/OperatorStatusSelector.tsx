import clsx from "clsx";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type JSX,
} from "react";
import type {
  OperatorStatusSelectorVm,
  PostCallFinishAppealVm,
} from "../../hooks/useOperatorStatusSelector.js";
import { AppIcon } from "../../components/icons/AppIcon.js";
import { IconTooltip } from "../../components/icons/IconTooltip.js";
import { OcpStatusDropdown } from "../../components/integration/ocp/OcpStatusDropdown.js";
import { OcpStatusTimer } from "../../components/integration/ocp/OcpStatusTimer.js";
import { useI18n } from "../../i18n/index.js";
import styles from "./OperatorStatusSelector.module.css";

export type OperatorStatusSelectorProps = Readonly<{
  vm: OperatorStatusSelectorVm;
  finishAppeal: PostCallFinishAppealVm;
  onSelectReason: (targetStatus: "ready" | "break", reasonId: number) => void;
  onFinishAppeal: () => void;
}>;

/**
 * - Purpose: header OCP operator status chip (dot + reason label + timer + dropdown).
 * - Inputs: view-model from useOperatorStatusSelector; select callback.
 * - Outputs: null when not authenticated; otherwise status trigger + menu.
 */
export function OperatorStatusSelector({
  vm,
  finishAppeal,
  onSelectReason,
  onFinishAppeal,
}: OperatorStatusSelectorProps): JSX.Element | null {
  const { t } = useI18n();
  const labelRef = useRef<HTMLSpanElement>(null);
  const [isLabelTruncated, setIsLabelTruncated] = useState(false);

  const label = !vm.isAuthenticated
    ? ""
    : vm.reasonLabel.length > 0
      ? vm.reasonLabel
      : vm.allowStatusLabelFallback
        ? t(vm.statusLabelKey)
        : "";

  useLayoutEffect(() => {
    if (!vm.isAuthenticated) {
      setIsLabelTruncated(false);
      return;
    }
    const el = labelRef.current;
    if (el === null) {
      setIsLabelTruncated(false);
      return;
    }
    setIsLabelTruncated(el.scrollWidth > el.clientWidth + 1);
  }, [label, vm.isAuthenticated]);

  useEffect(() => {
    if (!vm.isAuthenticated) {
      return;
    }
    const el = labelRef.current;
    if (el === null || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      setIsLabelTruncated(el.scrollWidth > el.clientWidth + 1);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [label, vm.isAuthenticated]);

  if (!vm.isAuthenticated) {
    return null;
  }

  const triggerAria = t("ocp.status.selector.aria", {
    status: label.length > 0 ? label : t(vm.statusLabelKey),
  });
  const disabledTitle =
    vm.isDropdownDisabled && vm.dropdownDisabledReasonKey !== null
      ? t(vm.dropdownDisabledReasonKey)
      : undefined;
  const overflowTooltipLabel =
    !vm.isDropdownDisabled && isLabelTruncated && label.length > 0 ? label : "";

  const trigger = (
    <button
      type="button"
      className={clsx(styles.trigger, vm.isDropdownDisabled && styles.triggerDisabled)}
      data-testid="ocp-status-selector"
      aria-label={triggerAria}
      title={disabledTitle}
      disabled={vm.isDropdownDisabled}
    >
      <span
        className={styles.dot}
        style={{ background: vm.statusColor }}
        aria-hidden
        data-testid="ocp-status-dot"
      />
      <span className={styles.labelSlot}>
        <IconTooltip label={overflowTooltipLabel} className={styles.labelTooltipHost}>
          <span ref={labelRef} className={styles.label} data-testid="ocp-status-label">
            {label}
          </span>
        </IconTooltip>
      </span>
      <OcpStatusTimer since={vm.timerSince} className={styles.timer} />
      <AppIcon
        id="ui.select.chevron"
        decorative
        size={14}
        className={styles.chevron}
      />
    </button>
  );

  return (
    <div className={styles.root} data-testid="ocp-status-selector-root">
      <OcpStatusDropdown
        disabled={vm.isDropdownDisabled}
        disabledReasonKey={vm.dropdownDisabledReasonKey}
        readyItems={vm.readyItems}
        breakItems={vm.breakItems}
        finishAppeal={finishAppeal}
        trigger={trigger}
        onSelectReason={onSelectReason}
        onFinishAppeal={onFinishAppeal}
      />
    </div>
  );
}
