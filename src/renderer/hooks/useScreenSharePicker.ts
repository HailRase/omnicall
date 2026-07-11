/**
 * - Purpose: orchestrate screen-share source picker IPC and facade confirm/cancel.
 * - Inputs: AccountBootstrapFacade.
 * - Outputs: dialog state, open/confirm/cancel handlers.
 */

import { useCallback, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type {
  DisplayCaptureSourceDto,
  DisplayCaptureSourceKind,
} from "@shared/ipc/DisplayCaptureContract.js";
import type { TranslationKey } from "../i18n/index.js";

type UseScreenSharePickerInput = Readonly<{
  facade: AccountBootstrapFacade;
}>;

export type UseScreenSharePickerResult = Readonly<{
  open: boolean;
  loading: boolean;
  confirming: boolean;
  errorKey: TranslationKey | null;
  activeKind: DisplayCaptureSourceKind;
  selectedSourceId: string | null;
  sources: ReadonlyArray<DisplayCaptureSourceDto>;
  openPicker: (callId: string) => void;
  setActiveKind: (kind: DisplayCaptureSourceKind) => void;
  selectSource: (sourceId: string) => void;
  confirm: () => void;
  cancel: () => void;
}>;

/**
 * - Purpose: load display sources and start screen share only after user confirm.
 * - Inputs: facade for SwitchLocalVideoSource.
 * - Outputs: picker state machine; cancel never mutates call video projection.
 */
export function useScreenSharePicker(
  input: UseScreenSharePickerInput,
): UseScreenSharePickerResult {
  const { facade } = input;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [activeKind, setActiveKind] = useState<DisplayCaptureSourceKind>("screen");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [sources, setSources] = useState<ReadonlyArray<DisplayCaptureSourceDto>>([]);
  const [callId, setCallId] = useState<string | null>(null);

  const reset = useCallback((): void => {
    setOpen(false);
    setLoading(false);
    setConfirming(false);
    setErrorKey(null);
    setSelectedSourceId(null);
    setSources([]);
    setCallId(null);
    setActiveKind("screen");
  }, []);

  const openPicker = useCallback((nextCallId: string): void => {
    setCallId(nextCallId);
    setOpen(true);
    setLoading(true);
    setErrorKey(null);
    setSelectedSourceId(null);
    setActiveKind("screen");
    void window.softphone.listDisplaySources().then((response) => {
      setLoading(false);
      if (!response.ok) {
        setErrorKey("call.video.screenShare.picker.loadFailed");
        setSources([]);
        return;
      }
      setSources(response.sources);
      const firstScreen = response.sources.find((source) => source.kind === "screen");
      setSelectedSourceId(firstScreen?.id ?? response.sources[0]?.id ?? null);
    });
  }, []);

  const cancel = useCallback((): void => {
    void window.softphone.setPendingDisplaySource({ sourceId: null });
    reset();
  }, [reset]);

  const confirm = useCallback((): void => {
    if (callId === null || selectedSourceId === null || confirming) {
      return;
    }
    setConfirming(true);
    setErrorKey(null);
    void window.softphone
      .setPendingDisplaySource({ sourceId: selectedSourceId })
      .then(async (pendingResult) => {
        if (!pendingResult.ok) {
          setConfirming(false);
          setErrorKey("call.video.screenShare.picker.confirmFailed");
          return;
        }
        const switchResult = await facade.switchLocalVideoSourceById(
          callId,
          "screen",
          false,
        );
        if (!switchResult.ok) {
          void window.softphone.setPendingDisplaySource({ sourceId: null });
          setConfirming(false);
          if (switchResult.error.code === "cancelled") {
            reset();
            return;
          }
          setErrorKey("call.video.screenShare.picker.confirmFailed");
          return;
        }
        reset();
      });
  }, [callId, confirming, facade, reset, selectedSourceId]);

  const handleSetActiveKind = useCallback(
    (kind: DisplayCaptureSourceKind): void => {
      setActiveKind(kind);
      setSelectedSourceId((current) => {
        const inKind = sources.filter((source) => source.kind === kind);
        if (inKind.some((source) => source.id === current)) {
          return current;
        }
        return inKind[0]?.id ?? null;
      });
    },
    [sources],
  );

  const filteredSources = sources.filter((source) => source.kind === activeKind);

  return {
    open,
    loading,
    confirming,
    errorKey,
    activeKind,
    selectedSourceId,
    sources: filteredSources,
    openPicker,
    setActiveKind: handleSetActiveKind,
    selectSource: setSelectedSourceId,
    confirm,
    cancel,
  };
}
