import type { Meta, StoryObj } from "@storybook/react";
import type {
  OperatorStatusSelectorVm,
  PostCallFinishAppealVm,
} from "../../hooks/useOperatorStatusSelector.js";
import { OperatorStatusSelector } from "./OperatorStatusSelector.js";

const hiddenFinishAppeal: PostCallFinishAppealVm = {
  visible: false,
  statusLabel: "",
  submitting: false,
  disabled: false,
  disabledReasonKey: null,
};

const authenticatedVm: OperatorStatusSelectorVm = {
  isAuthenticated: true,
  statusColor: "var(--color-status-online)",
  reasonLabel: "Ready for calls",
  allowStatusLabelFallback: false,
  statusLabelKey: "ocp.operatorStatus.ready",
  timerSince: Date.now() - 125_000,
  isDropdownDisabled: false,
  dropdownDisabledReasonKey: null,
  readyItems: [
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
};

const meta = {
  title: "Integration/OperatorStatusSelector",
  component: OperatorStatusSelector,
  parameters: { layout: "padded" },
  args: {
    vm: authenticatedVm,
    finishAppeal: hiddenFinishAppeal,
    onSelectReason: () => undefined,
    onFinishAppeal: () => undefined,
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
      reasonLabel: "Ready for calls",
      statusLabelKey: "ocp.operatorStatus.talking",
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
      reasonLabel: "Ready for calls",
      statusLabelKey: "ocp.operatorStatus.talking",
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

export const ManyBreakReasonsScroll: Story = {
  args: {
    vm: {
      ...authenticatedVm,
      reasonLabel: "Доступен",
      readyItems: [
        {
          reasonId: 1,
          label: "Доступен",
          targetStatus: "ready",
          disabled: false,
          disabledReasonKey: null,
          testId: null,
          isCurrent: true,
        },
      ],
      breakItems: Array.from({ length: 10 }, (_, index) => ({
        reasonId: 10 + index,
        label: `Перерыв ${index + 1}`,
        targetStatus: "break" as const,
        disabled: false,
        disabledReasonKey: null,
        testId: null,
        isCurrent: false,
      })),
    },
  },
  parameters: { themes: { themeOverride: "light" } },
};

export const CurrentBreakSelectedLight: Story = {
  args: {
    vm: {
      ...authenticatedVm,
      statusColor: "var(--color-status-dnd)",
      reasonLabel: "Обед",
      statusLabelKey: "ocp.operatorStatus.break",
      readyItems: [
        {
          reasonId: 1,
          label: "Доступен",
          targetStatus: "ready",
          disabled: false,
          disabledReasonKey: null,
          testId: null,
          isCurrent: false,
        },
      ],
      breakItems: [
        {
          reasonId: 7,
          label: "Обед",
          targetStatus: "break",
          disabled: false,
          disabledReasonKey: null,
          testId: "ocp-break-current",
          isCurrent: true,
        },
        {
          reasonId: 8,
          label: "Кофе",
          targetStatus: "break",
          disabled: false,
          disabledReasonKey: null,
          testId: null,
          isCurrent: false,
        },
      ],
    },
  },
  parameters: { themes: { themeOverride: "light" } },
};

export const PostCallFinishAppealLight: Story = {
  args: {
    vm: {
      ...authenticatedVm,
      statusColor: "var(--color-status-offline)",
      reasonLabel: "",
      allowStatusLabelFallback: true,
      statusLabelKey: "ocp.operatorStatus.postCallProcessing",
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
      breakItems: [
        {
          reasonId: 7,
          label: "Lunch break",
          targetStatus: "break",
          disabled: false,
          disabledReasonKey: null,
          testId: "ocp-break-reserved-current",
          isCurrent: true,
        },
        {
          reasonId: 8,
          label: "Coffee",
          targetStatus: "break",
          disabled: false,
          disabledReasonKey: null,
          testId: null,
          isCurrent: false,
        },
      ],
    },
    finishAppeal: {
      visible: true,
      statusLabel: "Lunch break",
      submitting: false,
      disabled: false,
      disabledReasonKey: null,
    },
  },
  parameters: { themes: { themeOverride: "light" } },
};

export const PostCallFinishAppealDark: Story = {
  args: {
    ...PostCallFinishAppealLight.args,
  },
  parameters: { themes: { themeOverride: "dark" } },
};

export const CurrentBreakSelectedDark: Story = {
  args: {
    ...CurrentBreakSelectedLight.args,
  },
  parameters: { themes: { themeOverride: "dark" } },
};
