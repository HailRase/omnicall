// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UpdateCheckSnapshot } from "@application/use-cases/CheckForUpdatesUseCase.js";
import { ok } from "@shared/result/index.js";
import {
  resetAppUpdateBackgroundCheckGuardForTests,
  useAppUpdate,
} from "./useAppUpdate.js";

const mockExecute = vi.fn();
const mockOpenDownloadPage = vi.fn();

vi.mock("@application/use-cases/CheckForUpdatesUseCase.js", () => ({
  CheckForUpdatesUseCase: vi.fn().mockImplementation(() => ({
    execute: mockExecute,
    openDownloadPage: mockOpenDownloadPage,
  })),
}));

vi.mock("@adapters/index.js", () => ({
  FetchUpdateMetadataAdapter: vi.fn(),
  PreloadExternalUrlGateway: vi.fn(),
  PreloadPlatformInfoGateway: vi.fn(),
}));

vi.mock("@infrastructure/logging/index.js", () => ({
  createTestLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock("../bootstrap/readUpdateManifestUrl.js", () => ({
  readUpdateManifestUrl: vi.fn(() => "https://example.com/manifest.json"),
}));

vi.mock("../i18n/index.js", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const installedSnapshot: UpdateCheckSnapshot = {
  status: "idle",
  currentVersion: "1.0.0",
};

const updateAvailableSnapshot: UpdateCheckSnapshot = {
  status: "updateAvailable",
  currentVersion: "1.0.0",
  latestVersion: "2.0.0",
  downloadUrl: "https://example.com/download",
};

describe("useAppUpdate background prompt", () => {
  beforeEach(() => {
    resetAppUpdateBackgroundCheckGuardForTests();
    mockExecute.mockReset();
    mockOpenDownloadPage.mockReset();
    mockExecute.mockResolvedValue(ok(installedSnapshot));
  });

  afterEach(() => {
    resetAppUpdateBackgroundCheckGuardForTests();
  });

  it("does not show prompt before background check completes", () => {
    mockExecute.mockImplementation(() => new Promise(() => undefined));

    const { result } = renderHook(() =>
      useAppUpdate({ backgroundCheckOnMount: true }),
    );

    expect(result.current.showUpdatePrompt).toBe(false);
  });

  it("shows prompt only when background check finds updateAvailable", async () => {
    mockExecute
      .mockResolvedValueOnce(ok(installedSnapshot))
      .mockResolvedValueOnce(ok(updateAvailableSnapshot));

    const { result } = renderHook(() =>
      useAppUpdate({ backgroundCheckOnMount: true }),
    );

    await waitFor(() => {
      expect(result.current.showUpdatePrompt).toBe(true);
    });
    expect(result.current.snapshot.status).toBe("updateAvailable");
  });

  it("does not show prompt for upToDate background result", async () => {
    mockExecute
      .mockResolvedValueOnce(ok(installedSnapshot))
      .mockResolvedValueOnce(
        ok({
          status: "upToDate",
          currentVersion: "1.0.0",
        }),
      );

    const { result } = renderHook(() =>
      useAppUpdate({ backgroundCheckOnMount: true }),
    );

    await waitFor(() => {
      expect(result.current.snapshot.status).toBe("upToDate");
    });
    expect(result.current.showUpdatePrompt).toBe(false);
  });

  it("hides prompt after dismiss for current session", async () => {
    mockExecute
      .mockResolvedValueOnce(ok(installedSnapshot))
      .mockResolvedValueOnce(ok(updateAvailableSnapshot));

    const { result } = renderHook(() =>
      useAppUpdate({ backgroundCheckOnMount: true }),
    );

    await waitFor(() => {
      expect(result.current.showUpdatePrompt).toBe(true);
    });

    act(() => {
      result.current.onDismissUpdatePrompt();
    });

    expect(result.current.showUpdatePrompt).toBe(false);
  });

  it("calls openDownloadPage from download action", async () => {
    mockExecute
      .mockResolvedValueOnce(ok(installedSnapshot))
      .mockResolvedValueOnce(ok(updateAvailableSnapshot));
    mockOpenDownloadPage.mockResolvedValue(ok(undefined));

    const { result } = renderHook(() =>
      useAppUpdate({ backgroundCheckOnMount: true }),
    );

    await waitFor(() => {
      expect(result.current.canOpenDownloadPage).toBe(true);
    });

    act(() => {
      result.current.onOpenDownloadPage();
    });

    await waitFor(() => {
      expect(mockOpenDownloadPage).toHaveBeenCalledWith({
        downloadUrl: "https://example.com/download",
      });
    });
  });

  it("preserves manual check API without enabling background check", async () => {
    mockExecute.mockResolvedValueOnce(ok(installedSnapshot));

    const { result } = renderHook(() => useAppUpdate());

    await waitFor(() => {
      expect(result.current.snapshot.currentVersion).toBe("1.0.0");
    });

    expect(result.current.showUpdatePrompt).toBe(false);
    expect(typeof result.current.onCheckForUpdates).toBe("function");
    expect(result.current.canCheckForUpdates).toBe(true);
  });
});
