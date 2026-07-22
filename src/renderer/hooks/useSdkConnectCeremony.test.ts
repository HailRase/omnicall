// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  SdkPendingOriginTrustProjection,
  SdkPendingPairingProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import { useSdkConnectCeremony } from "./useSdkConnectCeremony.js";

type CeremonyProps = Readonly<{
  pendingOriginTrust: readonly SdkPendingOriginTrustProjection[];
  pendingPairing: readonly SdkPendingPairingProjection[];
  isOriginAllowed?: (origin: string) => boolean;
}>;

function baseInput(
  props: CeremonyProps,
  overrides: Partial<{
    onAllowOriginTrust: ReturnType<typeof vi.fn>;
    onDenyOriginTrust: ReturnType<typeof vi.fn>;
    onApprovePairing: ReturnType<typeof vi.fn>;
    onDenyPairing: ReturnType<typeof vi.fn>;
    isOriginAllowed: (origin: string) => boolean;
  }> = {},
) {
  return {
    pendingOriginTrust: props.pendingOriginTrust,
    pendingPairing: props.pendingPairing,
    busy: false,
    isOriginAllowed: overrides.isOriginAllowed ?? props.isOriginAllowed ?? (() => true),
    onAllowOriginTrust: overrides.onAllowOriginTrust ?? vi.fn(),
    onDenyOriginTrust: overrides.onDenyOriginTrust ?? vi.fn(),
    onApprovePairing: overrides.onApprovePairing ?? vi.fn(),
    onDenyPairing: overrides.onDenyPairing ?? vi.fn(),
  };
}

describe("useSdkConnectCeremony", () => {
  it("requires isOriginAllowed in hook input and maps pending origin trust to transport", () => {
    const isOriginAllowed = vi.fn(() => true);
    const { result } = renderHook(() =>
      useSdkConnectCeremony(
        baseInput(
          {
            pendingOriginTrust: [
              { originTrustRequestId: "trust_1", origin: "https://crm.example" },
            ],
            pendingPairing: [],
          },
          { isOriginAllowed },
        ),
      ),
    );

    expect(isOriginAllowed).toBeTypeOf("function");
    expect(result.current.view).toEqual({
      open: true,
      step: "transport",
      origin: "https://crm.example",
      showStepper: true,
      originTrustRequestId: "trust_1",
      pairing: null,
    });
    expect(result.current.onCancelWaiting).toBeTypeOf("function");
  });

  it("bridges allow transport into waiting then pairing without closing", () => {
    const onAllowOriginTrust = vi.fn();
    const pendingPairing: readonly SdkPendingPairingProjection[] = [
      {
        pairingRequestId: "pair_1",
        clientId: "cli_1",
        origin: "https://crm.example",
        applicationName: "CRM",
        profile: "presentation",
        expiresAt: "2026-07-22T12:00:00.000Z",
      },
    ];

    const { result, rerender } = renderHook(
      (props: CeremonyProps) => useSdkConnectCeremony(baseInput(props, { onAllowOriginTrust })),
      {
        initialProps: {
          pendingOriginTrust: [
            { originTrustRequestId: "trust_1", origin: "https://crm.example" },
          ],
          pendingPairing: [] as readonly SdkPendingPairingProjection[],
        } satisfies CeremonyProps,
      },
    );

    act(() => {
      result.current.onAllowTransport();
    });
    expect(onAllowOriginTrust).toHaveBeenCalledWith("trust_1");
    expect(result.current.view.open && result.current.view.step).toBe("waiting");

    rerender({ pendingOriginTrust: [], pendingPairing });
    expect(result.current.view).toMatchObject({
      open: true,
      step: "pairing",
      showStepper: true,
      pairing: { pairingRequestId: "pair_1" },
    });
  });

  it("onCancelWaiting clears waiting without deny", () => {
    const onDenyPairing = vi.fn();
    const onDenyOriginTrust = vi.fn();
    const { result, rerender } = renderHook(
      (props: CeremonyProps) =>
        useSdkConnectCeremony(
          baseInput(props, { onDenyPairing, onDenyOriginTrust }),
        ),
      {
        initialProps: {
          pendingOriginTrust: [
            { originTrustRequestId: "trust_1", origin: "https://crm.example" },
          ],
          pendingPairing: [] as readonly SdkPendingPairingProjection[],
        } satisfies CeremonyProps,
      },
    );

    act(() => {
      result.current.onAllowTransport();
    });
    // Allow clears Origin trust pending in the snapshot; bridge stays in waiting.
    rerender({
      pendingOriginTrust: [],
      pendingPairing: [],
    });
    expect(result.current.view.open && result.current.view.step).toBe("waiting");

    act(() => {
      result.current.onCancelWaiting();
    });
    expect(result.current.view).toEqual({ open: false });
    expect(onDenyPairing).not.toHaveBeenCalled();
    expect(onDenyOriginTrust).not.toHaveBeenCalled();
  });

  it("approve when !isOriginAllowed calls onDenyPairing", () => {
    const onApprovePairing = vi.fn();
    const onDenyPairing = vi.fn();
    const { result } = renderHook(() =>
      useSdkConnectCeremony(
        baseInput(
          {
            pendingOriginTrust: [],
            pendingPairing: [
              {
                pairingRequestId: "pair_guard",
                clientId: "cli_guard",
                origin: "https://crm.example",
                applicationName: "CRM",
                profile: "presentation",
                expiresAt: "2026-07-22T12:00:00.000Z",
              },
            ],
          },
          {
            isOriginAllowed: () => false,
            onApprovePairing,
            onDenyPairing,
          },
        ),
      ),
    );

    act(() => {
      result.current.onApprovePairing();
    });
    expect(onDenyPairing).toHaveBeenCalledWith("pair_guard");
    expect(onApprovePairing).not.toHaveBeenCalled();
  });

  it("shows pairing-only when origin already allowed", () => {
    const { result } = renderHook(() =>
      useSdkConnectCeremony(
        baseInput({
          pendingOriginTrust: [],
          pendingPairing: [
            {
              pairingRequestId: "pair_2",
              clientId: "cli_2",
              origin: "https://crm.example",
              applicationName: "CRM",
              profile: "presentation",
              expiresAt: "2026-07-22T12:00:00.000Z",
            },
          ],
        }),
      ),
    );

    expect(result.current.view).toMatchObject({
      open: true,
      step: "pairing",
      showStepper: false,
      pairing: { pairingRequestId: "pair_2" },
    });
  });

  it("deny transport calls origin deny; dismiss on pairing denies pairing", () => {
    const onDenyOriginTrust = vi.fn();
    const onDenyPairing = vi.fn();
    const { result, rerender } = renderHook(
      (props: CeremonyProps) =>
        useSdkConnectCeremony(baseInput(props, { onDenyOriginTrust, onDenyPairing })),
      {
        initialProps: {
          pendingOriginTrust: [
            { originTrustRequestId: "trust_1", origin: "https://crm.example" },
          ],
          pendingPairing: [] as readonly SdkPendingPairingProjection[],
        } satisfies CeremonyProps,
      },
    );

    act(() => {
      result.current.onDenyTransport();
    });
    expect(onDenyOriginTrust).toHaveBeenCalledWith("trust_1");

    rerender({
      pendingOriginTrust: [],
      pendingPairing: [
        {
          pairingRequestId: "pair_9",
          clientId: "cli_9",
          origin: "https://crm.example",
          applicationName: "CRM",
          profile: "presentation",
          expiresAt: "2026-07-22T12:00:00.000Z",
        },
      ],
    });
    act(() => {
      result.current.onDismiss();
    });
    expect(onDenyPairing).toHaveBeenCalledWith("pair_9");
  });
});
