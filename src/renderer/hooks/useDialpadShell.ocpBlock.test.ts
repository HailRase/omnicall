// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  OperatorStatus,
  initialAccountBootstrapProjection,
  initialCallProjection,
  initialMultiCallProjection,
  initialOperatorStatusProjection,
} from "@application/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useDialpadShell } from "./useDialpadShell.js";

afterEach(() => {
  cleanup();
  useAccountBootstrapStore.setState({
    ocpOperatorStatusProjection: initialOperatorStatusProjection(),
  });
});

describe("useDialpadShell OCP dialpad block", () => {
  it("blocks call button when operator status is RESERVED_TO_CALL", () => {
    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...initialOperatorStatusProjection(),
        operatorId: 1,
        status: OperatorStatus.RESERVED_TO_CALL,
      },
    });

    const { result } = renderHook(() =>
      useDialpadShell({
        projection: {
          ...initialAccountBootstrapProjection(),
          authUiState: "sip_registered",
        },
        callProjection: initialCallProjection(),
        multiCallProjection: initialMultiCallProjection(),
        historyRemoteNumbers: [],
      }),
    );

    act(() => {
      result.current.setDialedNumber("100");
    });

    expect(result.current.callDisabledReason).toMatch(/зарезервирован|reserved/i);
    expect(result.current.videoCallDisabledReason).toMatch(/зарезервирован|reserved/i);
  });
});
