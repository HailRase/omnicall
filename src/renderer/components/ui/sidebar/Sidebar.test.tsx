// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type JSX } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "./index.js";

function ContextProbe(): JSX.Element {
  const { open, state } = useSidebar();
  return (
    <div data-testid="sidebar-context-probe" data-open={open ? "true" : "false"} data-state={state} />
  );
}

function ControlledSidebarFixture(): JSX.Element {
  const [open, setOpen] = useState(true);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <ContextProbe />
      <Sidebar mobileTitle="Navigation">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton data-testid="sidebar-menu-home">Home</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger toggleLabel="Toggle sidebar" data-testid="sidebar-trigger" />
        <button
          type="button"
          data-testid="sidebar-external-toggle"
          onClick={() => {
            setOpen(false);
          }}
        >
          Close
        </button>
      </SidebarInset>
    </SidebarProvider>
  );
}

describe("Sidebar", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("throws when useSidebar is called outside SidebarProvider", () => {
    function OutsideProvider(): JSX.Element {
      useSidebar();
      return <div />;
    }

    expect(() => render(<OutsideProvider />)).toThrow("SIDEBAR_PROVIDER_REQUIRED");
  });

  it("toggles desktop open state from SidebarTrigger", async () => {
    const user = userEvent.setup();

    render(
      <SidebarProvider defaultOpen>
        <ContextProbe />
        <Sidebar mobileTitle="Navigation">
          <SidebarContent />
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger toggleLabel="Toggle sidebar" data-testid="sidebar-trigger" />
        </SidebarInset>
      </SidebarProvider>,
    );

    const probe = screen.getByTestId("sidebar-context-probe");
    expect(probe).toHaveAttribute("data-open", "true");
    expect(probe).toHaveAttribute("data-state", "expanded");

    await user.click(screen.getByTestId("sidebar-trigger"));

    expect(probe).toHaveAttribute("data-open", "false");
    expect(probe).toHaveAttribute("data-state", "collapsed");
  });

  it("supports controlled open state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <SidebarProvider open onOpenChange={onOpenChange}>
        <SidebarTrigger toggleLabel="Toggle sidebar" data-testid="sidebar-trigger" />
      </SidebarProvider>,
    );

    await user.click(screen.getByTestId("sidebar-trigger"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("toggles with Ctrl+B keyboard shortcut", async () => {
    const user = userEvent.setup();

    render(
      <SidebarProvider defaultOpen>
        <ContextProbe />
      </SidebarProvider>,
    );

    const probe = screen.getByTestId("sidebar-context-probe");
    expect(probe).toHaveAttribute("data-open", "true");

    await user.keyboard("{Control>}b{/Control}");
    expect(probe).toHaveAttribute("data-open", "false");
  });

  it("opens mobile sheet when forceMobile is enabled", async () => {
    const user = userEvent.setup();

    render(
      <SidebarProvider defaultOpen={false} forceMobile>
        <Sidebar mobileTitle="Navigation" mobileDescription="Mobile navigation">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Home</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger toggleLabel="Toggle sidebar" data-testid="sidebar-trigger" />
        </SidebarInset>
      </SidebarProvider>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("sidebar-trigger"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("marks active menu buttons with data-active", () => {
    render(
      <SidebarProvider>
        <Sidebar mobileTitle="Navigation">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive data-testid="sidebar-active-item">
                  Active
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );

    expect(screen.getByTestId("sidebar-active-item")).toHaveAttribute("data-active", "true");
  });

  it("preserves caller className on SidebarInset", () => {
    render(
      <SidebarProvider>
        <SidebarInset className="custom-inset" data-testid="sidebar-inset">
          Content
        </SidebarInset>
      </SidebarProvider>,
    );

    expect(screen.getByTestId("sidebar-inset")).toHaveClass("custom-inset");
  });

  it("forwards external controlled close to provider state", async () => {
    const user = userEvent.setup();

    render(<ControlledSidebarFixture />);

    const probe = screen.getByTestId("sidebar-context-probe");
    expect(probe).toHaveAttribute("data-open", "true");

    await user.click(screen.getByTestId("sidebar-external-toggle"));
    expect(probe).toHaveAttribute("data-open", "false");
  });
});
