import { useEffect, useMemo, useState, type JSX } from "react";
import { createCallId, validatePhoneNumber } from "@domain/index.js";
import { deriveDialpadDisabledReason } from "@application/index.js";
import { useAccountBootstrapStore } from "./stores/useAccountBootstrapStore.js";
import { useAccountBootstrap } from "./hooks/useAccountBootstrap.js";
import { AuthStateView } from "./components/auth/AuthStateView.js";
import { AccountPanel } from "./components/account/AccountPanel.js";
import { PhoneStatusBadge } from "./components/status/PhoneStatusBadge.js";
import { Dialpad, type DialpadMode } from "./components/dialpad/Dialpad.js";
import { OutgoingCallCard } from "./components/call/OutgoingCallCard.js";
import { IncomingCallModal } from "./components/call/IncomingCallModal.js";

function registrationLabel(
  registrationState: string,
  authUiState: string,
): string {
  if (authUiState === "sip_registering") {
    return "Registering";
  }

  switch (registrationState) {
    case "registered":
      return "Registered";
    case "failed":
      return "Failed";
    case "registering":
      return "Registering";
    default:
      return "Not registered";
  }
}

export function App(): JSX.Element {
  const { facade, status, errorMessage } = useAccountBootstrap();
  const projection = useAccountBootstrapStore((state) => state.projection);
  const callProjection = useAccountBootstrapStore((state) => state.callProjection);
  const incomingCallProjection = useAccountBootstrapStore(
    (state) => state.incomingCallProjection,
  );
  const setCallMode = useAccountBootstrapStore((state) => state.setCallMode);
  const setIncomingUiState = useAccountBootstrapStore((state) => state.setIncomingUiState);
  const setIncomingBreakReason = useAccountBootstrapStore(
    (state) => state.setIncomingBreakReason,
  );
  const setIncomingRejectReasonRequired = useAccountBootstrapStore(
    (state) => state.setIncomingRejectReasonRequired,
  );
  const [dialedNumber, setDialedNumber] = useState("");

  const showAccountPanel =
    projection.authUiState === "sip_only_ready" ||
    projection.authUiState === "sip_registration_failed" ||
    projection.authUiState === "sip_registered" ||
    projection.authUiState === "access_denied";

  const blockingAuthState =
    projection.authUiState === "booting" ||
    projection.authUiState === "ocp_authenticating" ||
    projection.authUiState === "ocp_session_exists" ||
    projection.authUiState === "ocp_invalid_token" ||
    projection.authUiState === "sip_registering";

  const isCalling = callProjection.state === "Connecting";
  const hasInvalidNumber = validatePhoneNumber(dialedNumber).length > 0;
  const secondSessionDisabled =
    callProjection.state !== "Idle" &&
    callProjection.state !== "Failed" &&
    callProjection.state !== "Ended";
  const ocpReserved = projection.isOcpMode && projection.phoneStatus === "dnd";

  const disabledState = useMemo(
    () =>
      deriveDialpadDisabledReason({
        isRegistered: !blockingAuthState && projection.authUiState === "sip_registered",
        isOcpReserved: ocpReserved,
        isSecondSessionDisabled:
          secondSessionDisabled && callProjection.state !== "Active",
        isNumberValid: !hasInvalidNumber,
        isConnecting: callProjection.state === "Connecting",
      }),
    [
      blockingAuthState,
      callProjection.state,
      hasInvalidNumber,
      ocpReserved,
      projection.authUiState,
      secondSessionDisabled,
    ],
  );
  const callDisabledReason = mapDisabledReason(disabledState);

  const dialpadMode: DialpadMode = callProjection.mode;

  const handleDialpadCall = (): void => {
    if (facade === null || callDisabledReason !== null) {
      return;
    }
    void facade.makeCall(dialedNumber);
  };

  const handleSendDtmf = (tone: string): void => {
    if (facade === null || callProjection.activeCallId === null) {
      return;
    }
    void facade.sendDtmf(createCallId(callProjection.activeCallId), tone);
  };

  useEffect(() => {
    setIncomingRejectReasonRequired(projection.isOcpMode);
  }, [projection.isOcpMode, setIncomingRejectReasonRequired]);

  const handleAnswerIncoming = (): void => {
    if (facade === null || incomingCallProjection.callId === null) {
      return;
    }
    setIncomingUiState("answering");
    void facade.answerCall(createCallId(incomingCallProjection.callId));
  };

  const handleRejectIncoming = (): void => {
    if (facade === null || incomingCallProjection.callId === null) {
      return;
    }
    setIncomingUiState("rejecting");
    void facade.rejectCall(
      createCallId(incomingCallProjection.callId),
      incomingCallProjection.selectedBreakReason ?? undefined,
    );
  };

  return (
    <main className="shell" data-testid="softphone-shell">
      <header className="shell__header">
        <h1 className="shell__title">Enterprise Softphone</h1>
        <p className="shell__subtitle">Authorization &amp; Account Bootstrap</p>
      </header>

      {status === "loading" && (
        <p data-testid="bootstrap-loading">Booting application…</p>
      )}

      {status === "error" && (
        <p className="shell__error" data-testid="bootstrap-error" role="alert">
          {errorMessage}
        </p>
      )}

      {status === "ready" && facade !== null && (
        <>
          <AuthStateView
            state={projection.authUiState}
            lastError={projection.lastError}
          />

          <PhoneStatusBadge
            status={projection.phoneStatus}
            registrationLabel={registrationLabel(
              projection.registrationState,
              projection.authUiState,
            )}
            disabled={blockingAuthState}
            onChange={(nextStatus) => {
              void facade.setPhoneStatus(nextStatus);
            }}
          />

          {showAccountPanel && !blockingAuthState && (
            <AccountPanel facade={facade} />
          )}

          {projection.authUiState === "sip_registered" && (
            <div className="shell__content">
              <p className="shell__hint" data-testid="sip-registered-hint">
                SIP account is registered via mock gateway (P01-P02 foundation).
              </p>

              <Dialpad
                numberValue={dialedNumber}
                mode={dialpadMode}
                isCalling={isCalling}
                callDisabledReason={callDisabledReason}
                onNumberChange={setDialedNumber}
                onDelete={() => {
                  setDialedNumber((previous) => previous.slice(0, -1));
                }}
                onClear={() => {
                  setDialedNumber("");
                }}
                onCall={handleDialpadCall}
                onSendDtmf={handleSendDtmf}
                onModeChange={setCallMode}
              />

              <OutgoingCallCard
                callId={callProjection.activeCallId}
                callState={callProjection.state}
                numberValue={dialedNumber}
                lastError={callProjection.lastError}
                lastDtmfTone={callProjection.lastDtmfTone}
                uiState={callProjection.uiState}
                toneIndicator={callProjection.toneIndicator}
              />
              <audio
                data-testid="remote-audio-mount"
                aria-label="Remote audio mount point"
                hidden={!callProjection.remoteAudioAttached}
              />

              <IncomingCallModal
                visible={incomingCallProjection.visible}
                callerNumber={incomingCallProjection.callerNumber}
                displayName={incomingCallProjection.displayName}
                queueInfo={incomingCallProjection.queueInfo}
                ringingState={incomingCallProjection.ringingIndicator}
                autoAnswerSecondsRemaining={
                  incomingCallProjection.autoAnswerSecondsRemaining
                }
                uiState={incomingCallProjection.uiState}
                rejectReasonRequired={projection.isOcpMode}
                rejectReasons={["break", "meeting", "training"]}
                selectedBreakReason={incomingCallProjection.selectedBreakReason}
                answerDisabledReason={
                  incomingCallProjection.uiState === "rejecting"
                    ? "Reject in progress"
                    : null
                }
                rejectDisabledReason={
                  incomingCallProjection.uiState === "answering"
                    ? "Answer in progress"
                    : null
                }
                onAnswer={handleAnswerIncoming}
                onReject={handleRejectIncoming}
                onSelectBreakReason={(reason) => {
                  setIncomingBreakReason(reason);
                }}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}

function mapDisabledReason(disabledState: string | null): string | null {
  if (disabledState === null) {
    return null;
  }
  switch (disabledState) {
    case "disabledByNotRegistered":
      return "Not registered";
    case "invalidNumber":
      return "Invalid number";
    case "disabledByOcpReserved":
      return "OCP reserved";
    case "disabledBySecondSessionPolicy":
      return "Second session disabled";
    case "calling":
      return "Call already connecting";
    default:
      return "Action unavailable";
  }
}
