// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { StrictMode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InMemoryContactRepository } from "@adapters/settings/InMemoryContactRepository.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { MockMediaGateway } from "@adapters/mock/MockMediaGateway.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { initialCallHistoryProjection } from "@application/projections/contacts/callHistoryProjection.js";
import { initialContactsProjection } from "@application/projections/contacts/contactsProjection.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { err, ok } from "@shared/result/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { useAccountBootstrapStore } from "../../stores/useAccountBootstrapStore.js";
import { clearLoadCoordinatorForTests } from "./loadCoordinator.js";
import { initialShellRouteDataState } from "./shellRouteDataModel.js";
import { useShellRouteDataLoader } from "./useShellRouteDataLoader.js";
import { useShellRouteDataStore } from "./useShellRouteDataStore.js";

function resetState(): void {
  clearLoadCoordinatorForTests();
  useShellRouteDataStore.setState(initialShellRouteDataState());
  useAccountBootstrapStore.setState({
    contactsProjection: initialContactsProjection(),
    callHistoryProjection: initialCallHistoryProjection(),
  });
}

function createRouteLoaderHarness(initialPath: string, strict = false) {
  return function RouteLoaderHarness({ children }: Readonly<{ children: ReactNode }>) {
    const tree = (
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    );

    return strict ? <StrictMode>{tree}</StrictMode> : tree;
  };
}

function createFacade(contactRepository = new InMemoryContactRepository()): AccountBootstrapFacade {
  return new AccountBootstrapFacade({
    telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
    mediaGateway: new MockMediaGateway(),
    settingsRepository: new InMemorySettingsRepository(),
    contactRepository,
    logger: createTestLogger(),
  });
}

describe("useShellRouteDataLoader", () => {
  afterEach(() => {
    resetState();
    vi.clearAllMocks();
  });

  it("loads contacts once when entering contacts route", async () => {
    resetState();
    const facade = createFacade();
    const listContacts = vi.spyOn(facade, "listContacts");

    renderHook(() => useShellRouteDataLoader({ facade, activeProfileSyncKey: null }), {
      wrapper: createRouteLoaderHarness("/contacts"),
    });

    await waitFor(() => {
      expect(listContacts).toHaveBeenCalledTimes(1);
    });
  });

  it("loads history once when entering history route", async () => {
    resetState();
    const facade = createFacade();
    const listCallHistory = vi.spyOn(facade, "listCallHistory");

    renderHook(() => useShellRouteDataLoader({ facade, activeProfileSyncKey: null }), {
      wrapper: createRouteLoaderHarness("/history"),
    });

    await waitFor(() => {
      expect(listCallHistory).toHaveBeenCalledTimes(1);
    });
  });

  it("does not double-load contacts under React StrictMode", async () => {
    resetState();
    const facade = createFacade();
    const listContacts = vi.spyOn(facade, "listContacts");

    renderHook(() => useShellRouteDataLoader({ facade, activeProfileSyncKey: null }), {
      wrapper: createRouteLoaderHarness("/contacts", true),
    });

    await waitFor(() => {
      expect(listContacts).toHaveBeenCalledTimes(1);
    });
  });

  it("loads contact details safely for direct route entry", async () => {
    resetState();
    const contactRepository = new InMemoryContactRepository();
    await contactRepository.createContact({
      displayName: "Direct Entry",
      primaryPhone: "+12025550100",
    });
    const contacts = await contactRepository.listContacts();
    const contactId = contacts[0]?.id;
    expect(contactId).toBeDefined();

    const facade = createFacade(contactRepository);
    const getContact = vi.spyOn(facade, "getContact");

    renderHook(() => useShellRouteDataLoader({ facade, activeProfileSyncKey: null }), {
      wrapper: createRouteLoaderHarness(`/contacts/${contactId}`),
    });

    await waitFor(() => {
      expect(getContact).toHaveBeenCalledWith(contactId);
      expect(useShellRouteDataStore.getState().activeContact).toMatchObject({
        contactId,
        status: "loaded",
      });
    });
  });

  it("shows not-found for invalid contact id without facade call", async () => {
    resetState();
    const facade = createFacade();
    const getContact = vi.spyOn(facade, "getContact");

    renderHook(() => useShellRouteDataLoader({ facade, activeProfileSyncKey: null }), {
      wrapper: createRouteLoaderHarness("/contacts/%20bad%20id"),
    });

    await waitFor(() => {
      expect(useShellRouteDataStore.getState().activeContact).toMatchObject({
        status: "notFound",
      });
    });

    expect(getContact).not.toHaveBeenCalled();
  });

  it("reloads contacts when active profile sync key changes on contacts route", async () => {
    resetState();
    const facade = createFacade();
    const listContacts = vi.spyOn(facade, "listContacts");

    const { rerender } = renderHook(
      ({ activeProfileSyncKey }: { activeProfileSyncKey: string | null }) =>
        useShellRouteDataLoader({ facade, activeProfileSyncKey }),
      {
        wrapper: createRouteLoaderHarness("/contacts"),
        initialProps: { activeProfileSyncKey: "1001@pbx.example" },
      },
    );

    await waitFor(() => {
      expect(listContacts).toHaveBeenCalledTimes(1);
    });

    listContacts.mockClear();
    rerender({ activeProfileSyncKey: "1002@pbx.example" });

    await waitFor(() => {
      expect(listContacts).toHaveBeenCalledTimes(1);
    });
  });

  it("does not apply stale contact A after switching to contact B", async () => {
    resetState();
    const contactRepository = new InMemoryContactRepository();
    const contactA = await contactRepository.createContact({
      displayName: "Contact A",
      primaryPhone: "+12025550100",
    });
    const contactB = await contactRepository.createContact({
      displayName: "Contact B",
      primaryPhone: "+12025550101",
    });

    const facade = createFacade(contactRepository);
    let resolveA: ((value: Awaited<ReturnType<typeof facade.getContact>>) => void) | undefined;
    const contactAPromise = new Promise<Awaited<ReturnType<typeof facade.getContact>>>((resolve) => {
      resolveA = resolve;
    });

    vi.spyOn(facade, "getContact").mockImplementation(async (contactId: string) => {
      if (contactId === contactA.id) {
        return contactAPromise;
      }

      const loaded = await contactRepository.getContactById(contactId as typeof contactA.id);
      if (loaded === null) {
        return err(createPlatformError("not_found", "Contact was not found"));
      }

      return ok(loaded);
    });

    function RouteSwitchHarness(): null {
      useShellRouteDataLoader({ facade, activeProfileSyncKey: null });
      return null;
    }

    renderHook(() => null, {
      wrapper: () => (
        <MemoryRouter initialEntries={[`/contacts/${contactA.id}`]}>
          <Routes>
            <Route path="/contacts/:contactId" element={<RouteSwitchHarness />} />
          </Routes>
        </MemoryRouter>
      ),
    });

    renderHook(() => null, {
      wrapper: () => (
        <MemoryRouter initialEntries={[`/contacts/${contactB.id}`]}>
          <Routes>
            <Route path="/contacts/:contactId" element={<RouteSwitchHarness />} />
          </Routes>
        </MemoryRouter>
      ),
    });

    await waitFor(() => {
      expect(useShellRouteDataStore.getState().activeContact).toMatchObject({
        contactId: contactB.id,
        status: "loaded",
      });
    });

    resolveA?.(ok(contactA));

    await waitFor(() => {
      expect(useShellRouteDataStore.getState().activeContact?.contactId).toBe(contactB.id);
    });
  });
});
