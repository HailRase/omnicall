import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AppIcon } from "../../icons/AppIcon.js";
import { Button } from "../button/Button.js";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "./index.js";

const meta = {
  title: "UI Kit/Sidebar",
  component: SidebarProvider,
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            minHeight: "28rem",
            background: "var(--color-bg-app)",
            color: "var(--color-text-primary)",
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta<typeof SidebarProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

type DemoNavItem = Readonly<{
  id: string;
  label: string;
  iconId: "shell.settings" | "shell.contacts" | "settings.general" | "settings.account";
  children?: ReadonlyArray<{ id: string; label: string }>;
}>;

const NAV_ITEMS: ReadonlyArray<DemoNavItem> = [
  { id: "home", label: "Home", iconId: "settings.general" },
  {
    id: "workspace",
    label: "Workspace",
    iconId: "shell.contacts",
    children: [
      { id: "projects", label: "Projects" },
      { id: "team", label: "Team" },
    ],
  },
  { id: "settings", label: "Settings", iconId: "shell.settings" },
];

type SidebarDemoProps = Readonly<{
  collapsible?: "offcanvas" | "icon" | "none";
  variant?: "sidebar" | "floating" | "inset";
  forceMobile?: boolean;
  defaultOpen?: boolean;
}>;

function SidebarDemo({
  collapsible = "icon",
  variant = "sidebar",
  forceMobile = false,
  defaultOpen = true,
}: SidebarDemoProps): JSX.Element {
  const [activeItem, setActiveItem] = useState("home");

  return (
    <SidebarProvider defaultOpen={defaultOpen} forceMobile={forceMobile}>
      <Sidebar
        collapsible={collapsible}
        variant={variant}
        mobileTitle="Navigation"
        mobileDescription="Application navigation sidebar"
      >
        <SidebarHeader>
          <div style={{ padding: "var(--space-2xs)", fontWeight: 600 }}>Acme Inc</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeItem === item.id}
                      tooltip={item.label}
                      onClick={() => {
                        setActiveItem(item.id);
                      }}
                    >
                      <AppIcon id={item.iconId} decorative size={16} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.children !== undefined ? (
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.id}>
                            <SidebarMenuSubButton
                              isActive={activeItem === child.id}
                              href="#"
                              onClick={(event) => {
                                event.preventDefault();
                                setActiveItem(child.id);
                              }}
                            >
                              <span>{child.label}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Account">
                <AppIcon id="settings.account" decorative size={16} />
                <span>Account</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail toggleLabel="Toggle sidebar" />
      </Sidebar>
      <SidebarInset>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            padding: "var(--space-sm)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <SidebarTrigger toggleLabel="Toggle sidebar" />
          <span style={{ fontWeight: 600 }}>Dashboard</span>
        </header>
        <div style={{ padding: "var(--space-md)" }}>
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
            Active item: {activeItem}
          </p>
          <Button variant="outline" size="sm" style={{ marginTop: "var(--space-sm)" }}>
            Secondary action
          </Button>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const Default: Story = {
  render: () => <SidebarDemo />,
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-lg)" }}>
      <SidebarDemo variant="sidebar" />
      <SidebarDemo variant="floating" />
      <SidebarDemo variant="inset" />
    </div>
  ),
};

export const CollapsibleModes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-lg)" }}>
      <SidebarDemo collapsible="icon" defaultOpen />
      <SidebarDemo collapsible="offcanvas" defaultOpen={false} />
      <SidebarDemo collapsible="none" />
    </div>
  ),
};

export const MobileSheet: Story = {
  render: () => <SidebarDemo forceMobile defaultOpen={false} />,
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [open, setOpen] = useState(true);

    return (
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar mobileTitle="Navigation">
          <SidebarHeader>
            <div style={{ padding: "var(--space-2xs)" }}>Controlled</div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarSeparator />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Dashboard">
                  <AppIcon id="settings.general" decorative size={16} />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div style={{ padding: "var(--space-md)" }}>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen((previous) => !previous);
              }}
            >
              {open ? "Collapse sidebar" : "Expand sidebar"}
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  },
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => <SidebarDemo />,
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => <SidebarDemo />,
};
