import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import type { ButtonGroupOrientation } from "../types.js";
import styles from "./ButtonGroup.module.css";

export type ButtonGroupProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className"> & {
    orientation?: ButtonGroupOrientation;
    className?: string;
    children?: ReactNode;
  }
>;

export type ButtonGroupTextProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "className" | "children"> & {
    asChild?: boolean;
    className?: string;
    children?: ReactNode;
  }
>;

export type ButtonGroupSeparatorProps = Readonly<
  Omit<ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>, "className"> & {
    className?: string;
  }
>;

const ORIENTATION_CLASS: Record<ButtonGroupOrientation, string> = {
  horizontal: styles.orientationHorizontal ?? "",
  vertical: styles.orientationVertical ?? "",
};

/**
 * - Purpose: group related action controls with shared edges and orientation.
 * - Inputs: orientation, native div props, Button/Input/text/separator children.
 * - Outputs: accessible `role="group"` container with shadcn-like joined layout.
 */
export const ButtonGroup = forwardRef(function ButtonGroup(
  {
    orientation = "horizontal",
    className,
    children,
    ...rest
  }: ButtonGroupProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  return (
    <div
      ref={ref}
      {...rest}
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={clsx(styles.group, ORIENTATION_CLASS[orientation], className)}
    >
      {children}
    </div>
  );
});

/**
 * - Purpose: static muted text/label slot inside a button group.
 * - Inputs: asChild Slot merge, native element props, text children.
 * - Outputs: bordered text surface aligned with adjacent buttons.
 */
export const ButtonGroupText = forwardRef(function ButtonGroupText(
  { asChild = false, className, children, ...rest }: ButtonGroupTextProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const classNames = clsx(styles.text, className);

  if (asChild) {
    return (
      <Slot
        ref={ref}
        {...rest}
        data-slot="button-group-text"
        className={classNames}
      >
        {children}
      </Slot>
    );
  }

  return (
    <div
      ref={ref}
      {...rest}
      data-slot="button-group-text"
      className={classNames}
    >
      {children}
    </div>
  );
});

/**
 * - Purpose: visual divider between non-outline buttons in a group.
 * - Inputs: orientation (default vertical), decorative flag, Radix separator props.
 * - Outputs: stretched 1px separator styled with control border token.
 */
export const ButtonGroupSeparator = forwardRef(function ButtonGroupSeparator(
  {
    className,
    orientation = "vertical",
    decorative = true,
    ...rest
  }: ButtonGroupSeparatorProps,
  ref: Ref<ComponentRef<typeof SeparatorPrimitive.Root>>,
): JSX.Element {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      {...rest}
      decorative={decorative}
      orientation={orientation}
      data-slot="button-group-separator"
      className={clsx(styles.separator, className)}
    />
  );
});
