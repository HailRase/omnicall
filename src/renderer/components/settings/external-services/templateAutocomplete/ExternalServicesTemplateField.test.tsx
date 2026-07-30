// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type JSX } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupJsdomRadix } from "../../../../test/setupJsdomRadix.js";
import { ExternalServicesTemplateField } from "./ExternalServicesTemplateField.js";

beforeEach(setupJsdomRadix);
afterEach(cleanup);

function ControlledField(props: Readonly<{
  initialValue?: string;
  keys?: ReadonlyArray<string>;
}>): JSX.Element {
  const [value, setValue] = useState(props.initialValue ?? "");
  return (
    <ExternalServicesTemplateField
      variant="input"
      value={value}
      disabled={false}
      collectionVariableKeys={props.keys ?? ["base_url"]}
      data-testid="template-field"
      onValueChange={setValue}
    />
  );
}

describe("ExternalServicesTemplateField", () => {
  it("opens suggestions after {{ and filters by typed prefix", async () => {
    const user = userEvent.setup();
    render(<ControlledField />);
    const field = screen.getByTestId("template-field");
    await user.click(field);
    // user-event escapes `{` as `{{`, so `{{{{b` types `{{b`.
    await user.type(field, "{{{{b");
    expect(await screen.findByTestId("external-services-template-autocomplete")).toBeInTheDocument();
    expect(
      screen.getByTestId("external-services-template-autocomplete-option-base_url"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("external-services-template-autocomplete-option-call_id"),
    ).not.toBeInTheDocument();
  });

  it("inserts the selected token and closes the popup", async () => {
    const user = userEvent.setup();
    render(<ControlledField />);
    const field = screen.getByTestId("template-field");
    await user.click(field);
    await user.type(field, "{{{{ba");
    await user.click(screen.getByTestId("external-services-template-autocomplete-option-base_url"));
    await waitFor(() => {
      expect(field).toHaveValue("{{base_url}}");
    });
    expect(screen.queryByTestId("external-services-template-autocomplete")).not.toBeInTheDocument();
  });

  it("does not open on a single brace used by JSON", async () => {
    const user = userEvent.setup();
    render(<ControlledField />);
    const field = screen.getByTestId("template-field");
    await user.click(field);
    await user.type(field, '{{"a":1}');
    expect(screen.queryByTestId("external-services-template-autocomplete")).not.toBeInTheDocument();
  });

  it("selects the active suggestion with Enter", async () => {
    const user = userEvent.setup();
    render(<ControlledField />);
    const field = screen.getByTestId("template-field");
    await user.click(field);
    await user.type(field, "{{{{base");
    await screen.findByTestId("external-services-template-autocomplete-option-base_url");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(field).toHaveValue("{{base_url}}");
    });
  });
});
