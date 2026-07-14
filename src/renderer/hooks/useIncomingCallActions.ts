import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveIncomingAnswerDisabledReason,
  resolveVideoCallAvailability,
  type IncomingCallProjection,
  type MultiCallProjection,
} from "@application/index.js";
import { mapDialpadDisabledReason } from "../helpers/mapDialpadDisabledReason.js";
import { mapVideoCallDisabledReason } from "../helpers/mapVideoCallDisabledReason.js";
import { translateCurrent } from "../i18n/index.js";

type UseIncomingCallActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  incomingCallProjection: IncomingCallProjection;
  multiCallProjection: MultiCallProjection;
  isSipRegistered: boolean;
  setIncomingUiState: (state: IncomingCallProjection["uiState"]) => void;
}>;

type UseIncomingCallActionsResult = Readonly<{
  handleAnswerIncoming: () => void;
  handleAnswerIncomingWithVideo: () => void;
  handleRejectIncoming: () => void;
  handleRejectIncomingWithBreakReason: (breakReason: string) => Promise<boolean>;
  answerDisabledReason: string | null;
  videoAnswerDisabledReason: string | null;
  canAnswerWithVideo: boolean;
  rejectDisabledReason: string | null;
}>;

/**
 * - Purpose: bind incoming call UI intents to facade and derive disabled reasons.
 * - Inputs: facade, incoming projection, registration flag, store setters.
 * - Outputs: answer/reject handlers and transient UI disabled reasons.
 */
export function useIncomingCallActions(
  input: UseIncomingCallActionsInput,
): UseIncomingCallActionsResult {
  const {
    facade,
    incomingCallProjection,
    multiCallProjection,
    isSipRegistered,
    setIncomingUiState,
  } = input;

  const policyAnswerDisabled = deriveIncomingAnswerDisabledReason(multiCallProjection);
  const registrationAnswerDisabled = isSipRegistered
    ? null
    : mapDialpadDisabledReason("disabledByNotRegistered");

  const answerIncoming = (mediaMode: "audio" | "video"): void => {
    if (
      facade === null ||
      incomingCallProjection.callId === null ||
      registrationAnswerDisabled !== null ||
      policyAnswerDisabled !== null
    ) {
      return;
    }
    if (mediaMode === "video") {
      const videoAvailability = resolveVideoCallAvailability({
        numberValid: true,
        sipRegistered: isSipRegistered,
        secondSessionBlocked: policyAnswerDisabled === "multi.call.disabled.secondSession",
        holdAllInProgress: multiCallProjection.holdAllInProgress,
        videoCaptureAvailable: true,
        videoFeatureReady: true,
        // Hide only when SDP explicitly has no video; null = still detecting.
        remoteVideoOffered: incomingCallProjection.incomingRemoteVideoOffered !== false,
      });
      if (!videoAvailability.enabled) {
        return;
      }
    }
    setIncomingUiState("answering");
    void facade
      .answerCallById(incomingCallProjection.callId, mediaMode)
      .then((result) => {
        if (!result.ok) {
          setIncomingUiState("answerFailed");
        }
      });
  };

  const handleAnswerIncoming = (): void => {
    answerIncoming("audio");
  };

  const handleAnswerIncomingWithVideo = (): void => {
    answerIncoming("video");
  };

  const handleRejectIncoming = (): void => {
    if (facade === null || incomingCallProjection.callId === null) {
      return;
    }
    setIncomingUiState("rejecting");
    void facade.rejectCallById(incomingCallProjection.callId).then((result) => {
      if (!result.ok) {
        setIncomingUiState("rejectFailed");
      }
    });
  };

  const handleRejectIncomingWithBreakReason = async (
    breakReason: string,
  ): Promise<boolean> => {
    if (facade === null || incomingCallProjection.callId === null) {
      return false;
    }
    setIncomingUiState("rejecting");
    const result = await facade.rejectCallById(
      incomingCallProjection.callId,
      breakReason,
    );
    if (!result.ok) {
      setIncomingUiState("rejectFailed");
      return false;
    }
    return true;
  };

  const answerDisabledReason =
    incomingCallProjection.uiState === "rejecting"
      ? translateCurrent("incoming.status.rejecting")
      : (registrationAnswerDisabled ?? mapPolicyDisabledReason(policyAnswerDisabled));

  const videoAvailability = resolveVideoCallAvailability({
    numberValid: true,
    sipRegistered: isSipRegistered,
    secondSessionBlocked: policyAnswerDisabled === "multi.call.disabled.secondSession",
    holdAllInProgress: multiCallProjection.holdAllInProgress,
    videoCaptureAvailable: true,
    videoFeatureReady: true,
    remoteVideoOffered: incomingCallProjection.incomingRemoteVideoOffered !== false,
  });
  // Show Answer with video unless inbound offer is known audio-only.
  const canAnswerWithVideo =
    incomingCallProjection.incomingRemoteVideoOffered !== false &&
    videoAvailability.enabled;
  const videoAnswerDisabledReason =
    canAnswerWithVideo
      ? null
      : answerDisabledReason ??
        mapVideoCallDisabledReason(
          incomingCallProjection.incomingRemoteVideoOffered === false
            ? "videoCall.disabled.remoteVideoNotOffered"
            : videoAvailability.enabled
              ? null
              : videoAvailability.reason,
        );

  const rejectDisabledReason =
    incomingCallProjection.uiState === "answering"
      ? translateCurrent("incoming.status.answering")
      : null;

  return {
    handleAnswerIncoming,
    handleAnswerIncomingWithVideo,
    handleRejectIncoming,
    handleRejectIncomingWithBreakReason,
    answerDisabledReason,
    videoAnswerDisabledReason,
    canAnswerWithVideo,
    rejectDisabledReason,
  };
}

function mapPolicyDisabledReason(reason: string | null): string | null {
  if (reason === null) {
    return null;
  }
  if (
    reason === "multi.call.disabled.holdAllInProgress" ||
    reason === "multi.call.disabled.connectingInProgress" ||
    reason === "multi.call.disabled.secondSession"
  ) {
    return translateCurrent(reason);
  }
  return reason;
}
