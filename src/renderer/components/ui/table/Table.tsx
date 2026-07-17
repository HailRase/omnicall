import clsx from "clsx";
import {
  forwardRef,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
  type Ref,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import type { TableCellAlign } from "../types.js";
import styles from "./Table.module.css";

export type TableProps = Readonly<
  Omit<TableHTMLAttributes<HTMLTableElement>, "className"> & {
    className?: string;
    children?: ReactNode;
  }
>;

export type TableHeaderProps = Readonly<
  Omit<HTMLAttributes<HTMLTableSectionElement>, "className"> & {
    className?: string;
    children?: ReactNode;
  }
>;

export type TableBodyProps = Readonly<
  Omit<HTMLAttributes<HTMLTableSectionElement>, "className"> & {
    className?: string;
    children?: ReactNode;
  }
>;

export type TableFooterProps = Readonly<
  Omit<HTMLAttributes<HTMLTableSectionElement>, "className"> & {
    className?: string;
    children?: ReactNode;
  }
>;

export type TableRowProps = Readonly<
  Omit<HTMLAttributes<HTMLTableRowElement>, "className"> & {
    className?: string;
    children?: ReactNode;
  }
>;

export type TableHeadProps = Readonly<
  Omit<ThHTMLAttributes<HTMLTableCellElement>, "className" | "align"> & {
    align?: TableCellAlign;
    className?: string;
    children?: ReactNode;
  }
>;

export type TableCellProps = Readonly<
  Omit<TdHTMLAttributes<HTMLTableCellElement>, "className" | "align"> & {
    align?: TableCellAlign;
    className?: string;
    children?: ReactNode;
  }
>;

export type TableCaptionProps = Readonly<
  Omit<HTMLAttributes<HTMLTableCaptionElement>, "className"> & {
    className?: string;
    children?: ReactNode;
  }
>;

const ALIGN_CLASS: Record<TableCellAlign, string> = {
  left: styles.alignLeft ?? "",
  center: styles.alignCenter ?? "",
  right: styles.alignRight ?? "",
};

/**
 * - Purpose: shadcn-like scrollable data table root with native table semantics.
 * - Inputs: native table props, className, composable header/body/footer children.
 * - Outputs: overflow container wrapping a full-width table; ref targets the table.
 */
export const Table = forwardRef(function Table(
  { className, children, ...rest }: TableProps,
  ref: Ref<HTMLTableElement>,
): JSX.Element {
  return (
    <div data-slot="table-container" className={styles.container}>
      <table
        ref={ref}
        {...rest}
        data-slot="table"
        className={clsx(styles.table, className)}
      >
        {children}
      </table>
    </div>
  );
});

/**
 * - Purpose: table header section for column labels.
 * - Inputs: native thead props and TableRow/TableHead children.
 * - Outputs: semantic thead with bottom border styling on rows.
 */
export const TableHeader = forwardRef(function TableHeader(
  { className, children, ...rest }: TableHeaderProps,
  ref: Ref<HTMLTableSectionElement>,
): JSX.Element {
  return (
    <thead
      ref={ref}
      {...rest}
      data-slot="table-header"
      className={clsx(styles.header, className)}
    >
      {children}
    </thead>
  );
});

/**
 * - Purpose: table body section for data rows.
 * - Inputs: native tbody props and TableRow/TableCell children.
 * - Outputs: semantic tbody; last row omits bottom border.
 */
export const TableBody = forwardRef(function TableBody(
  { className, children, ...rest }: TableBodyProps,
  ref: Ref<HTMLTableSectionElement>,
): JSX.Element {
  return (
    <tbody
      ref={ref}
      {...rest}
      data-slot="table-body"
      className={clsx(styles.body, className)}
    >
      {children}
    </tbody>
  );
});

/**
 * - Purpose: table footer section for totals or summary rows.
 * - Inputs: native tfoot props and TableRow/TableCell children.
 * - Outputs: muted footer surface with top border.
 */
export const TableFooter = forwardRef(function TableFooter(
  { className, children, ...rest }: TableFooterProps,
  ref: Ref<HTMLTableSectionElement>,
): JSX.Element {
  return (
    <tfoot
      ref={ref}
      {...rest}
      data-slot="table-footer"
      className={clsx(styles.footer, className)}
    >
      {children}
    </tfoot>
  );
});

/**
 * - Purpose: single table row with hover and selected surface states.
 * - Inputs: native tr props; optional data-state="selected" from callers.
 * - Outputs: bordered row with token-based hover/selected backgrounds.
 */
export const TableRow = forwardRef(function TableRow(
  { className, children, ...rest }: TableRowProps,
  ref: Ref<HTMLTableRowElement>,
): JSX.Element {
  return (
    <tr
      ref={ref}
      {...rest}
      data-slot="table-row"
      className={clsx(styles.row, className)}
    >
      {children}
    </tr>
  );
});

/**
 * - Purpose: column header cell with muted emphasis and typed alignment.
 * - Inputs: native th props, optional align, children.
 * - Outputs: semantic th with medium weight secondary text.
 */
export const TableHead = forwardRef(function TableHead(
  { align = "left", className, children, ...rest }: TableHeadProps,
  ref: Ref<HTMLTableCellElement>,
): JSX.Element {
  return (
    <th
      ref={ref}
      {...rest}
      data-slot="table-head"
      data-align={align}
      className={clsx(styles.head, ALIGN_CLASS[align], className)}
    >
      {children}
    </th>
  );
});

/**
 * - Purpose: data cell with compact padding and typed alignment.
 * - Inputs: native td props, optional align, children.
 * - Outputs: semantic td aligned to the table density canon.
 */
export const TableCell = forwardRef(function TableCell(
  { align = "left", className, children, ...rest }: TableCellProps,
  ref: Ref<HTMLTableCellElement>,
): JSX.Element {
  return (
    <td
      ref={ref}
      {...rest}
      data-slot="table-cell"
      data-align={align}
      className={clsx(styles.cell, ALIGN_CLASS[align], className)}
    >
      {children}
    </td>
  );
});

/**
 * - Purpose: accessible table caption rendered below the table.
 * - Inputs: native caption props and caption copy from the caller.
 * - Outputs: muted centered caption; no hardcoded product text.
 */
export const TableCaption = forwardRef(function TableCaption(
  { className, children, ...rest }: TableCaptionProps,
  ref: Ref<HTMLTableCaptionElement>,
): JSX.Element {
  return (
    <caption
      ref={ref}
      {...rest}
      data-slot="table-caption"
      className={clsx(styles.caption, className)}
    >
      {children}
    </caption>
  );
});
