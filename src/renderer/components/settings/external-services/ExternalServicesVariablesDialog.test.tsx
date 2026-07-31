// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { ExternalServicesVariablesDialog } from "./ExternalServicesVariablesDialog.js";

beforeEach(setupJsdomRadix);
afterEach(cleanup);

describe("ExternalServicesVariablesDialog", () => {
  it("blocks save on duplicate keys and warns on system names", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ExternalServicesVariablesDialog
        open
        collectionName="CRM"
        initialVariables={[
          { key: "call_id", value: "spoof" },
          { key: "base_url", value: "https://a.test" },
        ]}
        busy={false}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />,
    );

    expect(screen.getByTestId("external-services-variables-system-warning")).toBeInTheDocument();
    expect(screen.getByTestId("external-services-variables-example")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Добавить переменную" }));
    const keyInputs = screen.getAllByLabelText("Ключ");
    await user.type(keyInputs[2]!, "base_url");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("alert").some((node) =>
        (node.textContent ?? "").includes("уникальным"),
      ),
    ).toBe(true);
  });

  it("saves valid rows", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ExternalServicesVariablesDialog
        open
        collectionName="CRM"
        initialVariables={[{ key: "base_url", value: "https://crm.example.test" }]}
        busy={false}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(onSave).toHaveBeenCalledWith([
      { key: "base_url", value: "https://crm.example.test" },
    ]);
  });
});
