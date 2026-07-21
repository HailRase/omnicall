import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
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
} from "../../ui/index.js";

export type OriginConfirmKind = "remove" | "blacklist";

type Props = Readonly<{
  origin: string;
  kind: OriginConfirmKind | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}>;

/** Destructive confirm for remove / blacklist trusted-site actions. */
export function SdkModuleSettingsOriginConfirmDialog({
  origin,
  kind,
  onOpenChange,
  onConfirm,
}: Props): JSX.Element {
  const { t } = useI18n();
  const confirmTestId =
    kind === "blacklist"
      ? `sdk-origin-blacklist-confirm-${origin}`
      : `sdk-origin-remove-confirm-${origin}`;

  return (
    <AlertDialog
      open={kind !== null}
      onOpenChange={(open) => {
        onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {kind === "blacklist"
              ? t("settings.integrations.sdk.blacklist.confirmTitle")
              : t("settings.integrations.sdk.origins.deleteTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {kind === "blacklist"
              ? t("settings.integrations.sdk.blacklist.confirmMessage")
              : t("settings.integrations.sdk.origins.deleteMessage")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">{t("common.cancel")}</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" data-testid={confirmTestId} onClick={onConfirm}>
              {kind === "blacklist"
                ? t("settings.integrations.sdk.blacklist.confirm")
                : t("settings.integrations.sdk.origins.deleteConfirm")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
