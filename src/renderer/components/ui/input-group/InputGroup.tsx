import clsx from "clsx";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type JSX,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { Button } from "../button/Button.js";
import type {
  ButtonVariant,
  ControlSize,
  InputGroupAddonAlign,
  InputGroupButtonSize,
  TextareaResize,
} from "../types.js";
import styles from "./InputGroup.module.css";

type InputGroupControlState = Readonly<{
  disabled: boolean;
  invalid: boolean;
  readOnly: boolean;
}>;

type InputGroupContextValue = Readonly<{
  size: ControlSize;
  controlState: InputGroupControlState;
  updateControlState: (patch: Partial<InputGroupControlState>) => void;
}>;

const DEFAULT_CONTROL_STATE: InputGroupControlState = {
  disabled: false,
  invalid: false,
  readOnly: false,
};

const InputGroupContext = createContext<InputGroupContextValue | null>(null);

function useInputGroupContext(): InputGroupContextValue {
  const context = useContext(InputGroupContext);
  if (context === null) {
    throw new Error("input_group_context_missing");
  }
  return context;
}

type InputGroupProviderProps = Readonly<{
  size: ControlSize;
  children: ReactNode;
}>;

function InputGroupProvider({ size, children }: InputGroupProviderProps): JSX.Element {
  const [controlState, setControlState] =
    useState<InputGroupControlState>(DEFAULT_CONTROL_STATE);

  const updateControlState = useCallback((patch: Partial<InputGroupControlState>): void => {
    setControlState((previous) => ({ ...previous, ...patch }));
  }, []);

  const value = useMemo(
    (): InputGroupContextValue => ({
      size,
      controlState,
      updateControlState,
    }),
    [size, controlState, updateControlState],
  );

  return (
    <InputGroupContext.Provider value={value}>{children}</InputGroupContext.Provider>
  );
}

export type InputGroupProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className"> & {
    size?: ControlSize;
    className?: string;
    children?: ReactNode;
  }
>;

export type InputGroupAddonProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className"> & {
    align?: InputGroupAddonAlign;
    className?: string;
    children?: ReactNode;
  }
>;

export type InputGroupInputProps = Readonly<
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> & {
    invalid?: boolean;
    className?: string;
  }
>;

export type InputGroupTextareaProps = Readonly<
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "size"> & {
    invalid?: boolean;
    resize?: TextareaResize;
    className?: string;
  }
>;

export type InputGroupButtonProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "size"> & {
    variant?: ButtonVariant;
    size?: InputGroupButtonSize;
    className?: string;
    children?: ReactNode;
  }
>;

export type InputGroupTextProps = Readonly<
  Omit<HTMLAttributes<HTMLSpanElement>, "className"> & {
    className?: string;
    children?: ReactNode;
  }
>;

const SIZE_CLASS: Record<ControlSize, string> = {
  sm: styles.sizeSm ?? "",
  md: styles.sizeMd ?? "",
  lg: styles.sizeLg ?? "",
};

const ADDON_ALIGN_CLASS: Record<InputGroupAddonAlign, string> = {
  "inline-start": styles.addonAlignInlineStart ?? "",
  "inline-end": styles.addonAlignInlineEnd ?? "",
  "block-start": styles.addonAlignBlockStart ?? "",
  "block-end": styles.addonAlignBlockEnd ?? "",
};

const GROUP_BUTTON_SIZE_CLASS: Record<InputGroupButtonSize, string> = {
  xs: styles.groupButtonSizeXs ?? "",
  sm: styles.groupButtonSizeSm ?? "",
  "icon-xs": styles.groupButtonSizeIconXs ?? "",
  "icon-sm": styles.groupButtonSizeIconSm ?? "",
};

function focusGroupControl(container: HTMLDivElement): void {
  container
    .closest('[data-slot="input-group"]')
    ?.querySelector<HTMLElement>('[data-slot="input-group-control"]')
    ?.focus();
}

function useRegisterControlState(
  disabled: boolean,
  invalid: boolean,
  readOnly: boolean,
): void {
  const { updateControlState } = useInputGroupContext();

  useEffect(() => {
    updateControlState({ disabled, invalid, readOnly });
    return () => {
      updateControlState({ disabled: false, invalid: false, readOnly: false });
    };
  }, [disabled, invalid, readOnly, updateControlState]);
}

/**
 * - Purpose: composable bordered input group container with shared focus and state styling.
 * - Inputs: size, native div props, and addon/control children.
 * - Outputs: unified input group surface with group-level data attributes.
 */
export const InputGroup = forwardRef(function InputGroup(
  { size = "md", className, children, ...rest }: InputGroupProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <InputGroupProvider size={size}>
      <InputGroupSurface ref={ref} className={className} {...rest}>
        {children}
      </InputGroupSurface>
    </InputGroupProvider>
  );
});

type InputGroupSurfaceProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className"> & {
    className?: string | undefined;
    children?: ReactNode;
  }
>;

const InputGroupSurface = forwardRef(function InputGroupSurface(
  { className, children, ...rest }: InputGroupSurfaceProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const { size, controlState } = useInputGroupContext();

  return (
    <div
      ref={ref}
      {...rest}
      data-slot="input-group"
      className={clsx(styles.group, SIZE_CLASS[size], className)}
      data-disabled={controlState.disabled ? "true" : undefined}
      data-invalid={controlState.invalid ? "true" : undefined}
      data-readonly={controlState.readOnly ? "true" : undefined}
    >
      {children}
    </div>
  );
});

/**
 * - Purpose: addon slot for icons, text, or buttons around a group control.
 * - Inputs: align, native div props, and addon children.
 * - Outputs: positioned addon region that focuses the group control on click.
 */
export const InputGroupAddon = forwardRef(function InputGroupAddon(
  { align = "inline-start", className, children, onClick, ...rest }: InputGroupAddonProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  function handleClick(event: MouseEvent<HTMLDivElement>): void {
    const target = event.target as HTMLElement;
    if (target.closest("button") === null) {
      focusGroupControl(event.currentTarget);
    }
    onClick?.(event);
  }

  return (
    <div
      ref={ref}
      {...rest}
      data-slot="input-group-addon"
      data-align={align}
      className={clsx(styles.addon, ADDON_ALIGN_CLASS[align], className)}
      onClick={handleClick}
    >
      {children}
    </div>
  );
});

/**
 * - Purpose: borderless input control styled for use inside InputGroup.
 * - Inputs: invalid, native input props.
 * - Outputs: textbox integrated with group focus ring and state attributes.
 */
export const InputGroupInput = forwardRef(function InputGroupInput(
  {
    className,
    invalid = false,
    disabled = false,
    readOnly = false,
    onChange,
    type = "text",
    ...rest
  }: InputGroupInputProps,
  ref: Ref<HTMLInputElement>,
): JSX.Element {
  const { size } = useInputGroupContext();
  useRegisterControlState(disabled, invalid, readOnly);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onChange?.(event);
  }

  return (
    <input
      ref={ref}
      type={type}
      data-slot="input-group-control"
      className={clsx(
        styles.control,
        styles.controlInput,
        SIZE_CLASS[size],
        className,
      )}
      {...rest}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
      data-invalid={invalid ? "true" : undefined}
      data-readonly={readOnly ? "true" : undefined}
      onChange={handleChange}
    />
  );
});

/**
 * - Purpose: borderless textarea control styled for use inside InputGroup.
 * - Inputs: invalid, resize, native textarea props.
 * - Outputs: multiline control integrated with group focus ring and state attributes.
 */
export const InputGroupTextarea = forwardRef(function InputGroupTextarea(
  {
    className,
    invalid = false,
    resize = "vertical",
    disabled = false,
    readOnly = false,
    onChange,
    ...rest
  }: InputGroupTextareaProps,
  ref: Ref<HTMLTextAreaElement>,
): JSX.Element {
  const { size } = useInputGroupContext();
  useRegisterControlState(disabled, invalid, readOnly);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onChange?.(event);
  }

  return (
    <textarea
      ref={ref}
      data-slot="input-group-control"
      className={clsx(
        styles.control,
        styles.controlTextarea,
        SIZE_CLASS[size],
        className,
      )}
      {...rest}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
      data-invalid={invalid ? "true" : undefined}
      data-readonly={readOnly ? "true" : undefined}
      data-resize={resize}
      onChange={handleChange}
    />
  );
});

/**
 * - Purpose: compact button slot optimized for input group addon layouts.
 * - Inputs: variant, compact size, native button props, children.
 * - Outputs: ghost/outline button with group-specific density.
 */
export const InputGroupButton = forwardRef(function InputGroupButton(
  {
    variant = "ghost",
    size = "xs",
    className,
    children,
    type = "button",
    ...rest
  }: InputGroupButtonProps,
  ref: Ref<HTMLButtonElement>,
): JSX.Element {
  return (
    <Button
      ref={ref}
      type={type}
      variant={variant}
      className={clsx(styles.groupButton, GROUP_BUTTON_SIZE_CLASS[size], className)}
      {...rest}
    >
      {children}
    </Button>
  );
});

/**
 * - Purpose: static muted text slot for prefixes, suffixes, and units.
 * - Inputs: native span props and text children.
 * - Outputs: compact addon text with secondary tone.
 */
export const InputGroupText = forwardRef(function InputGroupText(
  { className, children, ...rest }: InputGroupTextProps,
  ref: Ref<HTMLSpanElement>,
): JSX.Element {
  return (
    <span
      ref={ref}
      {...rest}
      data-slot="input-group-text"
      className={clsx(styles.text, className)}
    >
      {children}
    </span>
  );
});
