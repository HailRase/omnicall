import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ElectronSafeStorageSecretService } from "./ElectronSafeStorageSecretService.js";
import { resolveSecretStorageFilePath } from "./resolveSecretStorageFilePath.js";

const {
  isEncryptionAvailableMock,
  encryptStringMock,
  decryptStringMock,
} = vi.hoisted(() => ({
  isEncryptionAvailableMock: vi.fn(() => false),
  encryptStringMock: vi.fn(() => Buffer.from("encrypted")),
  decryptStringMock: vi.fn(() => "secret"),
}));

vi.mock("electron", () => ({
  safeStorage: {
    isEncryptionAvailable: isEncryptionAvailableMock,
    encryptString: encryptStringMock,
    decryptString: decryptStringMock,
  },
}));

describe("ElectronSafeStorageSecretService", () => {
  const secretsRoot = join(tmpdir(), `axatalk-secrets-test-${Date.now()}`);

  afterEach(async () => {
    await rm(secretsRoot, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it("returns encryption_unavailable when safeStorage is unavailable", async () => {
    isEncryptionAvailableMock.mockReturnValue(false);
    const service = new ElectronSafeStorageSecretService(secretsRoot);

    const result = await service.saveSecret("user@example.com", "sip-password", "secret");

    expect(result).toEqual({ ok: false, reason: "encryption_unavailable" });
  });

  it("saves encrypted secret blob and loads it back", async () => {
    isEncryptionAvailableMock.mockReturnValue(true);
    encryptStringMock.mockReturnValue(Buffer.from("encrypted"));
    decryptStringMock.mockReturnValue("secret");

    const service = new ElectronSafeStorageSecretService(secretsRoot);
    const saveResult = await service.saveSecret("user@example.com", "sip-password", "secret");
    expect(saveResult).toEqual({ ok: true });

    const filePath = resolveSecretStorageFilePath(secretsRoot, "user@example.com", "sip-password");
    await expect(readFile(filePath)).resolves.toEqual(Buffer.from("encrypted"));

    const loadResult = await service.loadSecret("user@example.com", "sip-password");
    expect(loadResult).toEqual({ ok: true, value: "secret" });
  });

  it("returns null when secret file is missing", async () => {
    isEncryptionAvailableMock.mockReturnValue(true);
    await mkdir(secretsRoot, { recursive: true });

    const service = new ElectronSafeStorageSecretService(secretsRoot);
    const loadResult = await service.loadSecret("missing@example.com", "sip-password");

    expect(loadResult).toEqual({ ok: true, value: null });
  });

  it("deletes secret blob", async () => {
    isEncryptionAvailableMock.mockReturnValue(true);
    encryptStringMock.mockReturnValue(Buffer.from("encrypted"));

    const service = new ElectronSafeStorageSecretService(secretsRoot);
    await service.saveSecret("user@example.com", "sip-password", "secret");

    const deleteResult = await service.deleteSecret("user@example.com", "sip-password");
    expect(deleteResult).toEqual({ ok: true });

    const filePath = resolveSecretStorageFilePath(secretsRoot, "user@example.com", "sip-password");
    await expect(readFile(filePath)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
