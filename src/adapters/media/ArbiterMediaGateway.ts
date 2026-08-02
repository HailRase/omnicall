import { TonePlaybackCoordinator } from "@application/services/telephony/TonePlaybackCoordinator.js";
import type {
  AttachRemoteAudioCommand,
  BindCallVideoSurfacesCommand,
  ConfigureIncomingRingtoneCommand,
  MediaGateway,
  MuteCallCommand,
  PlayBusyToneCommand,
  PlayFailedToneCommand,
  PlayIncomingRingtoneCommand,
  PlayRingbackToneCommand,
  PlayRingtoneCommand,
  PreviewIncomingRingtoneCommand,
  ReleaseAllMediaCommand,
  RemoteAudioAttachOutcome,
  StopIncomingRingtonePreviewCommand,
  StopRingtoneCommand,
  StopToneCommand,
  UnmuteCallCommand,
} from "@ports/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

/**
 * - Purpose: MediaGateway decorator that enforces single-stream tone arbitration.
 * - Inputs: underlying media gateway and tone play/stop commands.
 * - Outputs: delegated non-tone media operations and coordinated tone playback.
 */
export class ArbiterMediaGateway implements MediaGateway {
  private readonly delegate: MediaGateway;
  private readonly coordinator: TonePlaybackCoordinator;

  constructor(delegate: MediaGateway) {
    this.delegate = delegate;
    this.coordinator = new TonePlaybackCoordinator(delegate);
  }

  getCoordinator(): TonePlaybackCoordinator {
    return this.coordinator;
  }

  attachRemoteAudio(
    command: AttachRemoteAudioCommand,
  ): Promise<Result<RemoteAudioAttachOutcome, PlatformError>> {
    return this.delegate.attachRemoteAudio(command);
  }

  bindCallVideoSurfaces(
    command: BindCallVideoSurfacesCommand,
  ): Promise<Result<void, PlatformError>> {
    return this.delegate.bindCallVideoSurfaces(command);
  }

  configureIncomingRingtone(
    command: ConfigureIncomingRingtoneCommand,
  ): Promise<Result<void, PlatformError>> {
    return this.delegate.configureIncomingRingtone(command);
  }

  previewIncomingRingtone(
    command: PreviewIncomingRingtoneCommand,
  ): Promise<Result<void, PlatformError>> {
    return this.delegate.previewIncomingRingtone(command);
  }

  stopIncomingRingtonePreview(
    command: StopIncomingRingtonePreviewCommand,
  ): Promise<Result<void, PlatformError>> {
    return this.delegate.stopIncomingRingtonePreview(command);
  }

  playRingbackTone(
    command: PlayRingbackToneCommand,
  ): Promise<Result<void, PlatformError>> {
    return this.coordinator.playRingbackTone(command);
  }

  playIncomingRingtone(
    command: PlayIncomingRingtoneCommand,
  ): Promise<Result<void, PlatformError>> {
    return this.coordinator.playIncomingRingtone(command);
  }

  playRingtone(command: PlayRingtoneCommand): Promise<Result<void, PlatformError>> {
    return this.coordinator.playRingtone(command);
  }

  playBusyTone(command: PlayBusyToneCommand): Promise<Result<void, PlatformError>> {
    return this.coordinator.playBusyTone(command);
  }

  playFailedTone(command: PlayFailedToneCommand): Promise<Result<void, PlatformError>> {
    return this.coordinator.playFailedTone(command);
  }

  stopTone(command: StopToneCommand): Promise<Result<void, PlatformError>> {
    return this.coordinator.stopTone(command);
  }

  stopRingtone(command: StopRingtoneCommand): Promise<Result<void, PlatformError>> {
    return this.coordinator.stopRingtone(command);
  }

  muteCall(command: MuteCallCommand): Promise<Result<void, PlatformError>> {
    return this.delegate.muteCall(command);
  }

  unmuteCall(command: UnmuteCallCommand): Promise<Result<void, PlatformError>> {
    return this.delegate.unmuteCall(command);
  }

  releaseAll(command: ReleaseAllMediaCommand): Promise<Result<void, PlatformError>> {
    return this.coordinator.releaseAll(command);
  }
}

/**
 * - Purpose: wrap a media gateway with tone priority arbitration.
 * - Inputs: underlying MediaGateway implementation.
 * - Outputs: ArbiterMediaGateway ready for bootstrap wiring.
 */
export function createArbiterMediaGateway(delegate: MediaGateway): ArbiterMediaGateway {
  return new ArbiterMediaGateway(delegate);
}
