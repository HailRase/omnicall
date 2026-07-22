import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import type { SdkConnectCeremonyView } from "../../hooks/useSdkConnectCeremony.js";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "../ui/index.js";
import styles from "./SdkConnectCeremonyModal.module.css";

export type SdkConnectCeremonyModalProps = Readonly<{
  view: SdkConnectCeremonyView;
  busy: boolean;
  onAllowTransport: () => void;
  onDenyTransport: () => void;
  onApprovePairing: () => void;
  onDenyPairing: () => void;
  onCancelWaiting: () => void;
  onDismiss: () => void;
}>;

function CeremonyStepper(props: {
  step: "transport" | "waiting" | "pairing";
}): JSX.Element {
  const { t } = useI18n();
  const activeIndex = props.step === "pairing" ? 1 : 0;
  return (
    <ol className={styles.stepper} aria-label={t("settings.integrations.sdk.ceremony.stepsAria")}>
      <li
        className={styles.step}
        data-active={activeIndex === 0 ? "true" : "false"}
        data-done={activeIndex > 0 ? "true" : "false"}
      >
        <span className={styles.stepDot} aria-hidden="true">
          1
        </span>
        <span className={styles.stepLabel}>
          {t("settings.integrations.sdk.ceremony.step.transport")}
        </span>
      </li>
      <li className={styles.stepRail} aria-hidden="true" />
      <li
        className={styles.step}
        data-active={activeIndex === 1 ? "true" : "false"}
        data-done="false"
      >
        <span className={styles.stepDot} aria-hidden="true">
          2
        </span>
        <span className={styles.stepLabel}>
          {t("settings.integrations.sdk.ceremony.step.pairing")}
        </span>
      </li>
    </ol>
  );
}

/**
 * Root overlay for SDK Origin trust + pairing (F-011 / ADR-0018 presentation).
 * Escape: Deny transport/pairing, or cancel waiting (no blacklist).
 */
export function SdkConnectCeremonyModal(
  props: SdkConnectCeremonyModalProps,
): JSX.Element {
  const { t } = useI18n();
  const open = props.view.open;
  const step = open ? props.view.step : "transport";
  const origin = open ? props.view.origin : "";
  const showStepper = open ? props.view.showStepper : false;
  const pairing = open ? props.view.pairing : null;
  const appName = pairing?.applicationName ?? "";

  const title =
    step === "waiting"
      ? t("settings.integrations.sdk.ceremony.waitingTitle")
      : step === "pairing"
        ? t("settings.integrations.sdk.pending.title")
        : t("settings.integrations.sdk.tofu.title");

  const description =
    step === "waiting"
      ? t("settings.integrations.sdk.ceremony.waiting", { origin })
      : step === "pairing"
        ? t("settings.integrations.sdk.ceremony.pairingMessage", {
            applicationName: appName,
            origin,
          })
        : t("settings.integrations.sdk.tofu.message", { origin });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          props.onDismiss();
        }
      }}
    >
      <AlertDialogContent
        className={styles.content}
        overlayClassName={styles.overlay}
        data-testid="sdk-connect-ceremony-modal"
        aria-label={title}
        onEscapeKeyDown={() => {
          props.onDismiss();
        }}
      >
        <AlertDialogHeader>
          {showStepper ? <CeremonyStepper step={step} /> : null}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className={styles.description}>
            {description}
          </AlertDialogDescription>
          {step === "waiting" ? (
            <div
              className={styles.waitingPulse}
              data-testid="sdk-connect-ceremony-waiting"
              aria-hidden="true"
            />
          ) : null}
          {step === "pairing" && pairing !== null ? (
            <p className={styles.meta} data-testid="sdk-connect-ceremony-pairing-meta">
              <span className={styles.metaApp}>{pairing.applicationName}</span>
              <span className={styles.metaOrigin} title={pairing.origin}>
                {pairing.origin}
              </span>
            </p>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter className={styles.footer}>
          {step === "transport" ? (
            <>
              <AlertDialogCancel asChild>
                <Button
                  variant="ghost"
                  disabled={props.busy}
                  data-testid="sdk-connect-ceremony-deny-transport"
                  onClick={props.onDenyTransport}
                >
                  {t("settings.integrations.sdk.tofu.deny")}
                </Button>
              </AlertDialogCancel>
              <Button
                disabled={props.busy}
                data-testid="sdk-connect-ceremony-allow-transport"
                onClick={props.onAllowTransport}
              >
                {t("settings.integrations.sdk.tofu.allow")}
              </Button>
            </>
          ) : null}
          {step === "waiting" ? (
            <AlertDialogCancel asChild>
              <Button
                variant="ghost"
                disabled={props.busy}
                data-testid="sdk-connect-ceremony-cancel-waiting"
                onClick={props.onCancelWaiting}
              >
                {t("settings.integrations.sdk.ceremony.waitingCancel")}
              </Button>
            </AlertDialogCancel>
          ) : null}
          {step === "pairing" ? (
            <>
              <AlertDialogCancel asChild>
                <Button
                  variant="ghost"
                  disabled={props.busy}
                  data-testid="sdk-connect-ceremony-deny-pairing"
                  onClick={props.onDenyPairing}
                >
                  {t("settings.integrations.sdk.pending.deny")}
                </Button>
              </AlertDialogCancel>
              <Button
                disabled={props.busy}
                data-testid={`sdk-connect-ceremony-approve-${pairing?.pairingRequestId ?? "none"}`}
                onClick={props.onApprovePairing}
              >
                {t("settings.integrations.sdk.pending.approve")}
              </Button>
            </>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
