import { describe, expect, it } from "vitest";
import type { MenuItemConstructorOptions } from "electron";
import {
  buildDarwinApplicationMenuTemplate,
  getMacosDevViewMenuRoles,
  getMacosEditMenuRoles,
} from "./darwinApplicationMenuTemplate.js";

function collectRoles(
  items: ReadonlyArray<MenuItemConstructorOptions>,
): ReadonlyArray<MenuItemConstructorOptions["role"]> {
  const roles: Array<MenuItemConstructorOptions["role"]> = [];

  for (const item of items) {
    if (item.role != null) {
      roles.push(item.role);
    }

    if (item.submenu != null && Array.isArray(item.submenu)) {
      roles.push(...collectRoles(item.submenu));
    }
  }

  return roles;
}

describe("buildDarwinApplicationMenuTemplate", () => {
  it("includes App and Edit top-level menus only in production mode", () => {
    const template = buildDarwinApplicationMenuTemplate("OmniCall");

    expect(template.map((item) => item.label)).toEqual(["OmniCall", "Edit"]);
  });

  it("adds View menu with developer roles only when enabled", () => {
    const template = buildDarwinApplicationMenuTemplate("OmniCall", {
      includeDeveloperViewMenu: true,
    });

    expect(template.map((item) => item.label)).toEqual(["OmniCall", "Edit", "View"]);
    const roles = collectRoles(template);

    for (const role of getMacosDevViewMenuRoles()) {
      expect(roles).toContain(role);
    }
  });

  it("omits View menu in production mode", () => {
    const template = buildDarwinApplicationMenuTemplate("OmniCall", {
      includeDeveloperViewMenu: false,
    });

    expect(template.map((item) => item.label)).toEqual(["OmniCall", "Edit"]);
    const roles = collectRoles(template);

    for (const role of getMacosDevViewMenuRoles()) {
      expect(roles).not.toContain(role);
    }
  });

  it("registers native edit roles required for Cmd+C/V/A shortcuts", () => {
    const template = buildDarwinApplicationMenuTemplate("OmniCall");
    const roles = collectRoles(template);

    for (const role of getMacosEditMenuRoles()) {
      expect(roles).toContain(role);
    }
  });
});
