/**
 * Improve mode selection state when pending changes.
 */

import type { JSX } from "react";
import { useEffect, useState } from "react";
import type { SdkActivateMode } from "@application/integration/ExternalSdkAccountPort.js";
import type { SdkActivateConsentPending } from "@application/integration/DeferredSdkActivateConsent.js";
import { useI18n } from "../../i18n/index.js";
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
import formStyles from "../settings/SettingsForm.module.css";

export type SdkActivateProfileConsentModalProps = Readonly<{
  pending: SdkActivateConsentPending | null;
  onAllow: (mode: SdkActivateMode) => void;
  onDeny: () => void;
  onDismiss: () => void;
}>;

function pickInitialMode(pending: SdkActivateConsentPending | null): SdkActivateMode {
  if (pending?.preferredMode !== undefined) {
    return pending.preferredMode;
  }
  if (pending?.availableModes.includes("sip_only") === true) {
    return "sip_only";
  }
  return pending?.availableModes[0] ?? "sip_only";
}

/** ADR-0018 §E: login activate / reauthorize / logout-required notice. */
export function SdkActivateProfileConsentModal(
  props: SdkActivateProfileConsentModalProps,
): JSX.Element {
  const { t } = useI18n();
  const pending = props.pending;
  const open = pending !== null;
  const origin = pending?.origin ?? "";
  const profileLabel = pending?.profileLabel ?? "";
  const login = pending?.login ?? "";
  const kind = pending?.kind ?? "activate";
  const modes = pending?.availableModes ?? [];
  const [selectedMode, setSelectedMode] = useState<SdkActivateMode>(() =>
    pickInitialMode(pending),
  );

  useEffect(() => {
    setSelectedMode(pickInitialMode(pending));
  }, [pending]);

  const titleKey =
    kind === "logout_required"
      ? "settings.integrations.sdk.activateConsent.logoutRequiredTitle"
      : kind === "reauthorize"
        ? "settings.integrations.sdk.activateConsent.reauthorizeTitle"
        : "settings.integrations.sdk.activateConsent.title";

  const message =
    kind === "logout_required"
      ? t("settings.integrations.sdk.activateConsent.logoutRequiredMessage", {
          origin,
          profileLabel,
          currentProfileLabel: pending?.currentProfileLabel ?? "",
        })
      : kind === "reauthorize"
        ? t("settings.integrations.sdk.activateConsent.reauthorizeMessage", {
            origin,
            profileLabel,
            login,
          })
        : t("settings.integrations.sdk.activateConsent.message", {
            origin,
            profileLabel,
            login,
          });

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        data-testid="sdk-activate-consent-modal"
        aria-label={t(titleKey)}
        onEscapeKeyDown={props.onDismiss}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t(titleKey)}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        {kind !== "logout_required" && modes.length > 1 ? (
          <div
            className={formStyles.stackedForm}
            role="radiogroup"
            aria-label={t("settings.integrations.sdk.activateConsent.modeLabel")}
            data-testid="sdk-activate-consent-modes"
          >
            {modes.map((mode) => (
              <label key={mode} className={formStyles.toggleRow}>
                <input
                  type="radio"
                  name="sdk-activate-mode"
                  value={mode}
                  checked={selectedMode === mode}
                  data-testid={`sdk-activate-mode-${mode}`}
                  onChange={() => {
                    setSelectedMode(mode);
                  }}
                />
                <span className={formStyles.toggleLabel}>
                  {mode === "sip_only"
                    ? t("settings.integrations.sdk.activateConsent.modeSip")
                    : t("settings.integrations.sdk.activateConsent.modeOcp")}
                </span>
              </label>
            ))}
          </div>
        ) : null}
        <AlertDialogFooter>
          {kind === "logout_required" ? (
            <Button
              data-testid="sdk-activate-consent-dismiss"
              onClick={props.onDismiss}
            >
              {t("settings.integrations.sdk.activateConsent.acknowledge")}
            </Button>
          ) : (
            <>
              <AlertDialogCancel asChild>
                <Button
                  variant="ghost"
                  data-testid="sdk-activate-consent-deny"
                  onClick={props.onDeny}
                >
                  {t("settings.integrations.sdk.activateConsent.deny")}
                </Button>
              </AlertDialogCancel>
              <Button
                variant="outline"
                data-testid="sdk-activate-consent-cancel"
                onClick={props.onDismiss}
              >
                {t("settings.integrations.sdk.activateConsent.cancel")}
              </Button>
              <Button
                data-testid="sdk-activate-consent-allow"
                onClick={() => {
                  const mode = modes.length === 1 ? modes[0]! : selectedMode;
                  props.onAllow(mode);
                }}
              >
                {t("settings.integrations.sdk.activateConsent.allow")}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
