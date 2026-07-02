import type { JSX } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import type { HeaderChromeShellViewModel } from "@application/index.js";

import headerStyles from "../../shells/SoftphoneShellHeader.module.css";

import { RegistrationStatusDot } from "./RegistrationStatusDot.js";

import { UserAvatar } from "./UserAvatar.js";

import { SoftphoneShellHeader } from "../../shells/SoftphoneShellHeader.js";



const registeredChrome: HeaderChromeShellViewModel = {

  registrationDotVariant: "registered_online",

  registrationDotAriaLabel: "SIP: Зарегистрирован",

  avatarInitials: "AO",

  showUserIdentity: true,

  displayName: "alex.operator",

  sipStatusLabel: "Зарегистрирован",

  sipStatusTimerSuffix: null,

  sipStatusTone: "registered",

};



const noop = (): void => undefined;



const baseHeaderArgs = {

  headerChrome: registeredChrome,

  userAvatarMenu: {

    open: false,

    anchorRef: { current: null },

    menuRef: { current: null },

    position: { top: 0, left: 0 },

    toggle: noop,

    close: noop,

  },

  userAvatarMenuActions: {

    dndEnabled: false,

    dndDisabledReason: null,

    logoutDisabledReason: null,

    handleOpenSettings: noop,

    handleToggleDnd: noop,

    handleLogout: noop,

  },

};



const meta = {

  title: "Header/ShellHeader",

  component: SoftphoneShellHeader,

  parameters: {

    layout: "padded",

  },

  decorators: [

    (StoryComponent: () => JSX.Element) => (

      <div style={{ maxWidth: 420, padding: 16, background: "var(--color-bg-app)" }}>

        <StoryComponent />

      </div>

    ),

  ],

} satisfies Meta<typeof SoftphoneShellHeader>;



export default meta;



type Story = StoryObj<typeof meta>;



export const RegisteredLight: Story = {

  args: baseHeaderArgs,

  parameters: { themes: { themeOverride: "light" } },

};



export const RegisteredDark: Story = {

  args: baseHeaderArgs,

  decorators: [

    (StoryComponent: () => JSX.Element) => (

      <div data-theme="dark" style={{ maxWidth: 420, padding: 16, background: "var(--color-bg-app)" }}>

        <StoryComponent />

      </div>

    ),

  ],

};



export const ReconnectingWithTimer: Story = {

  args: {

    ...baseHeaderArgs,

    headerChrome: {

      ...registeredChrome,

      registrationDotVariant: "failed",

      registrationDotAriaLabel: "SIP: Нет соединения, повтор через 01:23",

      sipStatusLabel: "Нет соединения",

      sipStatusTimerSuffix: "01:23",

      sipStatusTone: "reconnecting",

    },

  },

};



export const AvatarAndDot: Story = {

  args: baseHeaderArgs,

  render: () => (

    <div style={{ padding: 16, background: "var(--color-bg-app)" }}>

      <div className={headerStyles["avatarGroup"]}>

        <UserAvatar initials="AO" />

        <RegistrationStatusDot variant="registered_dnd" label="SIP: Не беспокоить" />

      </div>

    </div>

  ),

};



export const NotRegistered: Story = {

  args: {

    ...baseHeaderArgs,

    headerChrome: {

      ...registeredChrome,

      registrationDotVariant: "not_registered",

      registrationDotAriaLabel: "SIP: Не зарегистрирован",

      sipStatusLabel: "Не зарегистрирован",

      sipStatusTimerSuffix: null,

      sipStatusTone: "not_registered",

    },

  },

};


