import type { JSX } from "react";
import { useEffect, useState } from "react";
import type { PlatformVersionResponse } from "@shared/ipc/IpcChannels.js";

type BootState =
  | { status: "loading" }
  | { status: "ready"; platform: PlatformVersionResponse }
  | { status: "error"; message: string };

export function App(): JSX.Element {
  const [bootState, setBootState] = useState<BootState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadPlatformInfo(): Promise<void> {
      try {
        const platform = await window.softphone.getPlatformVersion();
        if (!cancelled) {
          setBootState({ status: "ready", platform });
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Platform bootstrap failed";
        if (!cancelled) {
          setBootState({ status: "error", message });
        }
      }
    }

    void loadPlatformInfo();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="shell" data-testid="softphone-shell">
      <header className="shell__header">
        <h1 className="shell__title">Enterprise Softphone</h1>
        <p className="shell__subtitle">Platform Foundation</p>
      </header>

      <section className="shell__content" aria-live="polite">
        {bootState.status === "loading" && (
          <p data-testid="boot-loading">Booting platform shell…</p>
        )}

        {bootState.status === "ready" && (
          <div data-testid="boot-ready">
            <p>
              <strong>{bootState.platform.name}</strong> v
              {bootState.platform.version}
            </p>
            <p className="shell__hint">
              Telephony features will be added in later roadmap phases.
            </p>
          </div>
        )}

        {bootState.status === "error" && (
          <p className="shell__error" data-testid="boot-error" role="alert">
            {bootState.message}
          </p>
        )}
      </section>
    </main>
  );
}
