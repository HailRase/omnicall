import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs.js";

const meta = {
  title: "UI Kit/Tabs",
  component: Tabs,
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            padding: "var(--space-xl)",
            background: "var(--color-bg-app)",
            color: "var(--color-text-primary)",
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

function SettingsTabs(): JSX.Element {
  return (
    <Tabs defaultValue="account">
      <TabsList aria-label="Settings sections">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="audio">Audio</TabsTrigger>
        <TabsTrigger value="network">Network</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p style={{ margin: 0 }}>Manage SIP account credentials and registration profile.</p>
      </TabsContent>
      <TabsContent value="audio">
        <p style={{ margin: 0 }}>Choose microphone, speaker, and codec preferences.</p>
      </TabsContent>
      <TabsContent value="network">
        <p style={{ margin: 0 }}>Configure transport, proxy, and reconnect behavior.</p>
      </TabsContent>
    </Tabs>
  );
}

export const Default: Story = {
  render: () => <SettingsTabs />,
};

export const Controlled: Story = {
  render: function ControlledStory(): JSX.Element {
    const [value, setValue] = useState("account");

    return (
      <div style={{ display: "grid", gap: "var(--space-sm)" }}>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)" }}>
          Active tab: {value}
        </p>
        <Tabs value={value} onValueChange={setValue}>
          <TabsList aria-label="Controlled settings sections">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Account panel content</TabsContent>
          <TabsContent value="audio">Audio panel content</TabsContent>
          <TabsContent value="network">Network panel content</TabsContent>
        </Tabs>
      </div>
    );
  },
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="account" orientation="vertical">
      <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "flex-start" }}>
        <TabsList aria-label="Vertical settings sections">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>
        <div style={{ flex: 1, minWidth: 0 }}>
          <TabsContent value="account">Account panel content</TabsContent>
          <TabsContent value="audio">Audio panel content</TabsContent>
          <TabsContent value="network">Network panel content</TabsContent>
        </div>
      </div>
    </Tabs>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <TabsList aria-label="Sections with disabled tab">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="audio" disabled>
          Audio
        </TabsTrigger>
        <TabsTrigger value="network">Network</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account panel content</TabsContent>
      <TabsContent value="audio">Audio panel content</TabsContent>
      <TabsContent value="network">Network panel content</TabsContent>
    </Tabs>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-lg)" }}>
      <SettingsTabs />
      <Tabs defaultValue="account" orientation="vertical">
        <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "flex-start" }}>
          <TabsList aria-label="Vertical light theme sections">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="network" disabled>
              Network
            </TabsTrigger>
          </TabsList>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TabsContent value="account">Account panel content</TabsContent>
            <TabsContent value="audio">Audio panel content</TabsContent>
            <TabsContent value="network">Network panel content</TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-lg)" }}>
      <SettingsTabs />
      <Tabs defaultValue="account" orientation="vertical">
        <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "flex-start" }}>
          <TabsList aria-label="Vertical dark theme sections">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="network" disabled>
              Network
            </TabsTrigger>
          </TabsList>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TabsContent value="account">Account panel content</TabsContent>
            <TabsContent value="audio">Audio panel content</TabsContent>
            <TabsContent value="network">Network panel content</TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  ),
};
