import { useEffect, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { createAccountBootstrap } from "@infrastructure/bootstrap/createAccountBootstrap.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { readBootstrapConfigFromUrl } from "../bootstrap/readBootstrapConfig.js";

type BootstrapStatus = "loading" | "ready" | "error";

export function useAccountBootstrap(): Readonly<{
  facade: AccountBootstrapFacade | null;
  status: BootstrapStatus;
  errorMessage: string | null;
}> {
  const [status, setStatus] = useState<BootstrapStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bindFacade = useAccountBootstrapStore((state) => state.bindFacade);

  const facade = useMemo(() => {
    const bootstrap = readBootstrapConfigFromUrl();
    return createAccountBootstrap({
      bootstrapConfig: bootstrap.config,
      ocpScenario: bootstrap.ocpScenario,
      telephonyScenario: bootstrap.telephonyScenario,
    });
  }, []);

  useEffect(() => {
    let unsubscribe = (): void => undefined;
    let cancelled = false;

    async function bootstrap(): Promise<void> {
      try {
        const bootstrapOptions = readBootstrapConfigFromUrl();
        unsubscribe = bindFacade(facade);
        await facade.initialize(bootstrapOptions.config);

        if (!cancelled) {
          setStatus("ready");
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Bootstrap failed";
          setErrorMessage(message);
          setStatus("error");
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      unsubscribe();
      facade.dispose();
    };
  }, [bindFacade, facade]);

  return { facade, status, errorMessage };
}
