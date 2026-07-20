import { useEffect, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { bindSdkBrokerSession } from "../bootstrap/bindSdkBrokerSession.js";
import { createRendererComposition } from "../bootstrap/createRendererComposition.js";
import { translateCurrent } from "../i18n/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

type BootstrapStatus = "loading" | "ready" | "error";

export function useAccountBootstrap(): Readonly<{
  facade: AccountBootstrapFacade | null;
  status: BootstrapStatus;
  errorMessage: string | null;
}> {
  const [status, setStatus] = useState<BootstrapStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facade, setFacade] = useState<AccountBootstrapFacade | null>(null);
  const bindFacade = useAccountBootstrapStore((state) => state.bindFacade);

  useEffect(() => {
    let unsubscribe = (): void => undefined;
    let disposeSdkBroker = (): void => undefined;
    let cancelled = false;
    let activeFacade: AccountBootstrapFacade | null = null;

    async function bootstrap(): Promise<void> {
      try {
        const { facade: composedFacade, bootstrapOptions } = await createRendererComposition();
        activeFacade = composedFacade;
        setFacade(activeFacade);
        unsubscribe = bindFacade(activeFacade);
        await activeFacade.initialize(bootstrapOptions.config);

        if (!cancelled) {
          const settingsResult = await activeFacade.getUserSettingsForAccount();
          const ocpModuleEnabled =
            settingsResult.ok === true
              ? settingsResult.value.ocpIntegration.enabled
              : false;
          const bound = bindSdkBrokerSession({
            facade: activeFacade,
            ocpModuleEnabled,
          });
          disposeSdkBroker = bound.dispose;
          setStatus("ready");
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : translateCurrent("bootstrap.error.initializationFailed");
          setErrorMessage(message);
          setStatus("error");
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      disposeSdkBroker();
      unsubscribe();
      activeFacade?.dispose();
    };
  }, [bindFacade]);

  return { facade, status, errorMessage };
}
