// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { ExternalServicesTriggerList } from "./ExternalServicesTriggerList.js";

beforeEach(setupJsdomRadix);
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

function renderInScrollPane(ui: React.ReactElement): void {
  const pane = document.createElement("div");
  pane.style.overflow = "auto";
  pane.style.position = "relative";
  pane.style.height = "240px";
  document.body.append(pane);
  render(ui, { container: pane });
}

describe("ExternalServicesTriggerVariableHelp", () => {
  it("shows call groups for call_answered and only always for post_call_processing", async () => {
    const user = userEvent.setup();
    renderInScrollPane(
      <ExternalServicesTriggerList triggers={[]} disabled={false} onChange={() => undefined} />,
    );

    await user.click(screen.getByTestId("external-services-trigger-help-call_answered"));
    const answeredPopup = await screen.findByTestId(
      "external-services-trigger-help-call_answered-popup",
    );
    expect(answeredPopup).toHaveTextContent("{{call_id}}");
    expect(answeredPopup).toHaveTextContent("{{timestamp}}");
    await user.click(screen.getByTestId("external-services-trigger-help-call_answered"));

    await user.click(screen.getByTestId("external-services-trigger-help-post_call_processing"));
    const postCallPopup = await screen.findByTestId(
      "external-services-trigger-help-post_call_processing-popup",
    );
    expect(postCallPopup).toHaveTextContent("{{timestamp}}");
    expect(postCallPopup).toHaveTextContent("{{user_login}}");
    expect(postCallPopup).not.toHaveTextContent("{{call_id}}");
    expect(postCallPopup).not.toHaveTextContent("{{campaign_id}}");
  });

  it("lists campaign tokens without call tokens", async () => {
    const user = userEvent.setup();
    renderInScrollPane(
      <ExternalServicesTriggerList triggers={[]} disabled={false} onChange={() => undefined} />,
    );
    await user.click(screen.getByTestId("external-services-trigger-help-campaign_offered"));
    const popup = await screen.findByTestId(
      "external-services-trigger-help-campaign_offered-popup",
    );
    expect(popup).toHaveTextContent("{{campaign_id}}");
    expect(popup).toHaveTextContent("{{queue_name}}");
    expect(popup).not.toHaveTextContent("{{call_id}}");
  });
});
