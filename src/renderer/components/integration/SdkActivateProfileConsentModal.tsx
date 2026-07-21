import type { JSX } from "react";
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

export type SdkActivateProfileConsentModalProps = Readonly<{
  open: boolean;
  origin: string | null;
  profileLabel: string | null;
  onAllow: () => void;
  onDeny: () => void;
  onDismiss: () => void;
}>;

/** ADR-0018 §E: every activate asks again when Origin matrix allows activate. */
export function SdkActivateProfileConsentModal(
  props: SdkActivateProfileConsentModalProps,
): JSX.Element {
  const { t } = useI18n();
  const origin = props.origin ?? "";
  const profileLabel = props.profileLabel ?? "";

  return (
    <AlertDialog open={props.open}>
      <AlertDialogContent
        data-testid="sdk-activate-consent-modal"
        aria-label={t("settings.integrations.sdk.activateConsent.title")}
        onEscapeKeyDown={props.onDismiss}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("settings.integrations.sdk.activateConsent.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("settings.integrations.sdk.activateConsent.message", {
              origin,
              profileLabel,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
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
            data-testid="sdk-activate-consent-allow"
            onClick={props.onAllow}
          >
            {t("settings.integrations.sdk.activateConsent.allow")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
