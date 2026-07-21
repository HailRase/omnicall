import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "../ui/index.js";

export type SdkOriginTrustConsentModalProps = Readonly<{
  open: boolean;
  origin: string | null;
  onAllow: () => void;
  onDeny: () => void;
}>;

export function SdkOriginTrustConsentModal(
  props: SdkOriginTrustConsentModalProps,
): JSX.Element {
  const { t } = useI18n();
  const origin = props.origin ?? "";
  return (
    <AlertDialog open={props.open} onOpenChange={(open) => !open && props.onDeny()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("settings.integrations.sdk.tofu.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("settings.integrations.sdk.tofu.message", { origin })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={props.onDeny}>
              {t("settings.integrations.sdk.tofu.deny")}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={props.onAllow}>
              {t("settings.integrations.sdk.tofu.allow")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
