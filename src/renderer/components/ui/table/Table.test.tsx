// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table.js";
import styles from "./Table.module.css";

afterEach(() => {
  cleanup();
});

function renderBasicTable(): void {
  render(
    <Table data-testid="kit-table">
      <TableCaption>Recent invoices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead align="right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-testid="data-row">
          <TableCell>INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell align="right">$250.00</TableCell>
        </TableRow>
        <TableRow data-state="selected" data-testid="selected-row">
          <TableCell>INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell align="right">$150.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell align="right">$400.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>,
  );
}

describe("Table", () => {
  it("renders semantic table structure and caption", () => {
    renderBasicTable();

    const table = screen.getByRole("table", { name: "Recent invoices" });
    expect(table).toBeInTheDocument();
    expect(screen.getByText("Recent invoices").tagName).toBe("CAPTION");
    expect(screen.getByText("Invoice").tagName).toBe("TH");
    expect(screen.getByText("INV001").tagName).toBe("TD");
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("forwards ref to the native table element", () => {
    const ref = createRef<HTMLTableElement>();

    render(
      <Table ref={ref}>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(ref.current).toBeInstanceOf(HTMLTableElement);
    expect(ref.current).toHaveAttribute("data-slot", "table");
  });

  it("preserves className on the table root and wraps with overflow container", () => {
    render(
      <Table className="custom-table" data-testid="wrapped-table">
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const table = screen.getByTestId("wrapped-table");
    expect(table).toHaveClass(styles.table ?? "");
    expect(table).toHaveClass("custom-table");
    expect(table.parentElement).toHaveAttribute("data-slot", "table-container");
    expect(table.parentElement).toHaveClass(styles.container ?? "");
  });

  it("applies typed align classes and data-align on head and cell", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead align="center" data-testid="head-center">
              Center
            </TableHead>
            <TableHead align="right" data-testid="head-right">
              Right
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell align="center" data-testid="cell-center">
              A
            </TableCell>
            <TableCell align="right" data-testid="cell-right">
              B
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const headCenter = screen.getByTestId("head-center");
    const headRight = screen.getByTestId("head-right");
    const cellCenter = screen.getByTestId("cell-center");
    const cellRight = screen.getByTestId("cell-right");

    expect(headCenter).toHaveClass(styles.alignCenter ?? "");
    expect(headCenter).toHaveAttribute("data-align", "center");
    expect(headRight).toHaveClass(styles.alignRight ?? "");
    expect(headRight).toHaveAttribute("data-align", "right");
    expect(cellCenter).toHaveClass(styles.alignCenter ?? "");
    expect(cellRight).toHaveClass(styles.alignRight ?? "");
  });

  it("keeps selected row data-state for surface styling", () => {
    renderBasicTable();

    const selectedRow = screen.getByTestId("selected-row");
    expect(selectedRow).toHaveAttribute("data-state", "selected");
    expect(selectedRow).toHaveClass(styles.row ?? "");
  });

  it("renders slot data attributes for composable sections", () => {
    renderBasicTable();

    const table = screen.getByTestId("kit-table");
    expect(table.querySelector('[data-slot="table-header"]')).toBeInTheDocument();
    expect(table.querySelector('[data-slot="table-body"]')).toBeInTheDocument();
    expect(table.querySelector('[data-slot="table-footer"]')).toBeInTheDocument();
    expect(table.querySelector('[data-slot="table-caption"]')).toBeInTheDocument();
  });

  it("supports column header association for accessible cells", () => {
    renderBasicTable();

    const table = screen.getByRole("table", { name: "Recent invoices" });
    const rows = within(table).getAllByRole("row");
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(within(table).getByRole("columnheader", { name: "Invoice" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "INV001" })).toBeInTheDocument();
  });

  it("does not hardcode product copy inside the primitive", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Caller copy</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByText("Caller copy")).toBeInTheDocument();
    expect(screen.queryByText("No results.")).not.toBeInTheDocument();
  });
});
