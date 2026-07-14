import type { Meta, StoryObj } from "@storybook/react";
import type { OperatorStatusSelectorVm } from "../../hooks/useOperatorStatusSelector.js";
import { OperatorStatusSelector } from "./OperatorStatusSelector.js";

const authenticatedVm: OperatorStatusSelectorVm = {
  isAuthenticated: true,
  statusColor: "var(--color-status-online)",
  reasonLabel: "Ready for calls",
  allowStatusLabelFallback: false,
  statusLabelKey: "ocp.operatorStatus.ready",
  timerSince: Date.now() - 125_000,
  isDropdownDisabled: false,
  dropdownDisabledReasonKey: null,
  currentItems: [
    {
      reasonId: 1,
      label: "Ready for calls",
      targetStatus: "ready",
      disabled: false,
      disabledReasonKey: null,
      testId: null,
      isCurrent: true,
    },
  ],
  readyItems: [],
  breakItems: [
    {
      reasonId: 7,
      label: "Lunch break",
      targetStatus: "break",
      disabled: false,
      disabledReasonKey: null,
      testId: null,
      isCurrent: false,
    },
  ],
  isReconnecting: false,
  isFailed: false,
  reconnectAttempt: 0,
  maxReconnectAttempts: 6,
  proxyStatus: null,
};

const meta = {
  title: "Integration/OperatorStatusSelector",
  component: OperatorStatusSelector,
  parameters: { layout: "padded" },
  args: {
    vm: authenticatedVm,
    onSelectReason: () => undefined,
  },
} satisfies Meta<typeof OperatorStatusSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AuthenticatedLight: Story = {
  parameters: { themes: { themeOverride: "light" } },
};

export const AuthenticatedDark: Story = {
  parameters: { themes: { themeOverride: "dark" } },
};

export const BusyLight: Story = {
  args: {
    vm: {
      ...authenticatedVm,
      statusColor: "var(--color-status-offline)",
      reasonLabel: "",
      statusLabelKey: "ocp.operatorStatus.talking",
      currentItems: [],
      readyItems: [
        {
          reasonId: 1,
          label: "Ready for calls",
          targetStatus: "ready",
          disabled: false,
          disabledReasonKey: null,
          testId: null,
          isCurrent: false,
        },
      ],
      isDropdownDisabled: false,
      dropdownDisabledReasonKey: null,
    },
  },
  parameters: { themes: { themeOverride: "light" } },
};

export const BusyDark: Story = {
  args: {
    vm: {
      ...authenticatedVm,
      statusColor: "var(--color-status-offline)",
      reasonLabel: "",
      statusLabelKey: "ocp.operatorStatus.talking",
      currentItems: [],
      readyItems: [
        {
          reasonId: 1,
          label: "Ready for calls",
          targetStatus: "ready",
          disabled: false,
          disabledReasonKey: null,
          testId: null,
          isCurrent: false,
        },
      ],
      isDropdownDisabled: false,
      dropdownDisabledReasonKey: null,
    },
  },
  parameters: { themes: { themeOverride: "dark" } },
};

export const DndGuardLight: Story = {
  args: {
    vm: {
      ...authenticatedVm,
      currentItems: [],
      readyItems: [
        {
          reasonId: 1,
          label: "Ready for calls",
          targetStatus: "ready",
          disabled: true,
          disabledReasonKey: "ocp.dropdown.disabledDnd",
          testId: "ocp-ready-disabled-dnd",
          isCurrent: false,
        },
      ],
    },
  },
  parameters: { themes: { themeOverride: "light" } },
};

export const DndGuardDark: Story = {
  args: {
    vm: {
      ...authenticatedVm,
      currentItems: [],
      readyItems: [
        {
          reasonId: 1,
          label: "Ready for calls",
          targetStatus: "ready",
          disabled: true,
          disabledReasonKey: "ocp.dropdown.disabledDnd",
          testId: "ocp-ready-disabled-dnd",
          isCurrent: false,
        },
      ],
    },
  },
  parameters: { themes: { themeOverride: "dark" } },
};

export const DisconnectedHidden: Story = {
  args: {
    vm: {
      ...authenticatedVm,
      isAuthenticated: false,
    },
  },
  parameters: { themes: { themeOverride: "light" } },
};
