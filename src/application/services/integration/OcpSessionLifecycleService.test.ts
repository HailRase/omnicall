/**
 * - Purpose: verify server terminate forces sessionClosed + cascade Domain Events.
 */

import { describe, expect, it, vi } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { OcpProjectionHub } from "../../read-models/OcpProjectionHub.js";
import { OcpSessionLifecycleService } from "./OcpSessionLifecycleService.js";

describe("OcpSessionLifecycleService", () => {
  it("on terminate disconnects sessionClosed and publishes session-end events", () => {
    const gateway = new MockOcpGateway();
    const bus = new InMemoryDomainEventBus();
    const published: string[] = [];
    bus.subscribe((event) => {
      published.push(event.type);
    });
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const logger = createTestLogger({
      featureId: "F-028",
      boundedContext: "Integration",
    });

    const lifecycle = new OcpSessionLifecycleService({
      ocpGateway: gateway,
      operatorReadModel: hub,
      eventPublisher: bus,
      logger,
      getSessionDomain: () => hub.getSessionProjection().domain,
      applyCampaignOffer: (payload) => hub.applyCampaignOffer(payload),
    });

    gateway.connect({ domain: "ocp.example", authToken: "token" });
    gateway.simulateAuthSuccess(42);
    expect(hub.getSessionProjection().isAuthenticated).toBe(true);

    gateway.simulateMessage({ entity: "terminate" });

    expect(gateway.getConnectionState()).toBe("disconnected");
    expect(hub.getSessionProjection().connectionState).toBe("sessionClosed");
    expect(hub.getSessionProjection().isAuthenticated).toBe(false);
    expect(published).toContain("OperatorSessionEnded");
    expect(published).toContain("OperatorLoggedOut");
    expect(published.filter((type) => type === "OperatorSessionEnded")).toHaveLength(1);

    lifecycle.dispose();
    hub.dispose();
  });

  it("publishes OperatorSessionStarted and OperatorStatusChanged from users", () => {
    const gateway = new MockOcpGateway();
    const bus = new InMemoryDomainEventBus();
    const published: Array<{ type: string; newStatus?: number }> = [];
    bus.subscribe((event) => {
      const entry: { type: string; newStatus?: number } = { type: event.type };
      if (typeof event["newStatus"] === "number") {
        entry.newStatus = event["newStatus"];
      }
      published.push(entry);
    });
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const lifecycle = new OcpSessionLifecycleService({
      ocpGateway: gateway,
      operatorReadModel: hub,
      eventPublisher: bus,
      logger: createTestLogger({ featureId: "F-028", boundedContext: "Integration" }),
      getSessionDomain: () => "ocp.example",
      applyCampaignOffer: (payload) => hub.applyCampaignOffer(payload),
    });

    gateway.connect({ domain: "ocp.example", authToken: "token" });
    gateway.simulateMessage({
      entity: "users",
      data: {
        operatorId: 5,
        status: OperatorStatus.READY,
        reasonId: 1,
        statusSince: "2026-07-14T12:00:00.000Z",
      },
    });
    gateway.simulateMessage({
      entity: "users",
      data: {
        operatorId: 5,
        status: OperatorStatus.BREAK,
        reasonId: 2,
        statusSince: "2026-07-14T12:01:00.000Z",
      },
    });

    expect(published.map((entry) => entry.type)).toEqual([
      "OperatorSessionStarted",
      "OperatorStatusChanged",
    ]);
    expect(published[1]?.newStatus).toBe(OperatorStatus.BREAK);

    lifecycle.dispose();
    hub.dispose();
  });

  it("holds second preview until accept; then promotes pending (no dual modal)", () => {
    const gateway = new MockOcpGateway();
    const bus = new InMemoryDomainEventBus();
    const published: string[] = [];
    bus.subscribe((event) => {
      published.push(event.type);
    });
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const lifecycle = new OcpSessionLifecycleService({
      ocpGateway: gateway,
      operatorReadModel: hub,
      eventPublisher: bus,
      logger: createTestLogger({ featureId: "F-028", boundedContext: "Integration" }),
      getSessionDomain: () => "ocp.example",
      applyCampaignOffer: (payload) => hub.applyCampaignOffer(payload),
    });

    const campaignBase = {
      id: "camp_1",
      callId: "ocp-call",
      queueId: "q1",
      abonentId: "a1",
      companyId: "co1",
      queueTitle: "Support",
      selectionId: "s1",
      isAnswered: false,
      progressive: false,
      clientPhone: "+15551237890",
      companyTitle: "Acme",
      strategyTitle: "Strat",
      selectionTitle: "Sel",
      strategyCallId: "sc1",
    };

    gateway.connect({ domain: "ocp.example", authToken: "token" });
    gateway.simulateMessage({
      entity: "campaign_events",
      data: campaignBase,
    });
    gateway.simulateMessage({
      entity: "campaign_events",
      data: { ...campaignBase, id: "camp_2" },
    });

    expect(published).toEqual(["OperatorCampaignOffered"]);
    expect(hub.getCampaignProjection().activeCampaign?.id).toBe("camp_1");
    expect(hub.getCampaignProjection().pendingPreview?.id).toBe("camp_2");
    expect(hub.getCampaignProjection().phase).toBe("preview_offered");

    const { clearedId, promoted } = hub.clearActiveCampaign();
    expect(clearedId).toBe("camp_1");
    expect(promoted?.id).toBe("camp_2");
    lifecycle.publishCampaignCleared(clearedId!, "accepted");
    lifecycle.publishCampaignOffered(promoted!);
    expect(published).toEqual([
      "OperatorCampaignOffered",
      "OperatorCampaignCleared",
      "OperatorCampaignOffered",
    ]);
    expect(hub.getCampaignProjection().activeCampaign?.id).toBe("camp_2");

    lifecycle.dispose();
    hub.dispose();
  });

  it("publishes OperatorCredentialsReceived without password payload", () => {
    const gateway = new MockOcpGateway();
    const bus = new InMemoryDomainEventBus();
    const events: Array<Record<string, unknown>> = [];
    bus.subscribe((event) => {
      events.push({ ...event });
    });
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const lifecycle = new OcpSessionLifecycleService({
      ocpGateway: gateway,
      operatorReadModel: hub,
      eventPublisher: bus,
      logger: createTestLogger({ featureId: "F-028", boundedContext: "Integration" }),
      getSessionDomain: () => null,
      applyCampaignOffer: (payload) => hub.applyCampaignOffer(payload),
    });

    gateway.connect({ domain: "ocp.example", authToken: "token" });
    gateway.simulateMessage({
      entity: "creds",
      data: {
        username: "u",
        password: "secret-password",
        domain: "sip.example",
        server: "sip.example",
      },
    });

    const credsEvent = events.find((event) => event["type"] === "OperatorCredentialsReceived");
    expect(credsEvent).toBeDefined();
    expect(JSON.stringify(credsEvent)).not.toContain("secret-password");

    lifecycle.dispose();
    hub.dispose();
  });

  it("is idempotent for repeated terminate", () => {
    const gateway = new MockOcpGateway();
    const bus = new InMemoryDomainEventBus();
    const disconnectSpy = vi.spyOn(gateway, "disconnect");
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const lifecycle = new OcpSessionLifecycleService({
      ocpGateway: gateway,
      operatorReadModel: hub,
      eventPublisher: bus,
      logger: createTestLogger({ featureId: "F-028", boundedContext: "Integration" }),
      getSessionDomain: () => null,
      applyCampaignOffer: (payload) => hub.applyCampaignOffer(payload),
    });

    gateway.connect({ domain: "ocp.example", authToken: "token" });
    gateway.simulateAuthSuccess(1);
    gateway.simulateMessage({ entity: "terminate" });
    gateway.simulateMessage({ entity: "terminate" });

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(disconnectSpy).toHaveBeenCalledWith("terminate");

    lifecycle.dispose();
    hub.dispose();
  });
});
