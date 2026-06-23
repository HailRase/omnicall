import { useEffect, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { createAccountBootstrap } from "@infrastructure/bootstrap/createAccountBootstrap.js";
import {
  setBootstrapModeInStore,
  useAccountBootstrapStore,
} from "../stores/useAccountBootstrapStore.js";
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
    const bootstrapConfig = readBootstrapConfigFromUrl();
    return createAccountBootstrap({ bootstrapConfig });
  }, []);

  useEffect(() => {
    let unsubscribe = (): void => undefined;
    let cancelled = false;

    async function bootstrap(): Promise<void> {
      try {
        const config = readBootstrapConfigFromUrl();
        setBootstrapModeInStore(config.mode === "ocp");
        unsubscribe = bindFacade(facade);

        if (config.mode === "ocp" && config.ocpToken && config.ocpDomain) {
          await facade.authenticateOcp.execute({
            token: config.ocpToken,
            domain: config.ocpDomain,
          });
        }

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
    };
  }, [bindFacade, facade]);

  return { facade, status, errorMessage };
}
