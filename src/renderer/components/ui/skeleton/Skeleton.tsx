import clsx from "clsx";
import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type JSX,
  type Ref,
} from "react";
import type { SkeletonShape } from "../types.js";
import styles from "./Skeleton.module.css";

export type SkeletonProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    shape?: SkeletonShape;
    width?: string | number;
    height?: string | number;
    className?: string;
  }
>;

const SHAPE_CLASS: Record<SkeletonShape, string> = {
  text: styles.shapeText ?? "",
  rectangle: styles.shapeRectangle ?? "",
  circle: styles.shapeCircle ?? "",
};

function toCssLength(value: string | number): string {
  return typeof value === "number" ? `${value}px` : value;
}

function resolveSkeletonStyle(
  width: SkeletonProps["width"],
  height: SkeletonProps["height"],
  nativeStyle: CSSProperties | undefined,
): CSSProperties | undefined {
  const resolved: CSSProperties = { ...nativeStyle };

  if (width !== undefined) {
    resolved.width = toCssLength(width);
  }

  if (height !== undefined) {
    resolved.height = toCssLength(height);
  }

  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

/**
 * - Purpose: decorative loading placeholder with shape and size variants.
 * - Inputs: shape, optional width/height, className, and native div props.
 * - Outputs: non-interactive skeleton surface hidden from assistive technologies.
 */
export const Skeleton = forwardRef(function Skeleton(
  {
    shape = "text",
    width,
    height,
    className,
    style,
    ...rest
  }: SkeletonProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const resolvedStyle = resolveSkeletonStyle(width, height, style);

  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(styles.skeleton, SHAPE_CLASS[shape], className)}
      {...(resolvedStyle !== undefined ? { style: resolvedStyle } : {})}
      aria-hidden="true"
      data-shape={shape}
    />
  );
});
