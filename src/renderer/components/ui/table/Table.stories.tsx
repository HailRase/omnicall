import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../badge/Badge.js";
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

type InvoiceRow = Readonly<{
  invoice: string;
  status: "Paid" | "Pending" | "Unpaid";
  method: string;
  amount: string;
}>;

const INVOICES: readonly InvoiceRow[] = [
  {
    invoice: "INV001",
    status: "Paid",
    method: "Credit Card",
    amount: "$250.00",
  },
  {
    invoice: "INV002",
    status: "Pending",
    method: "PayPal",
    amount: "$150.00",
  },
  {
    invoice: "INV003",
    status: "Unpaid",
    method: "Bank Transfer",
    amount: "$350.00",
  },
  {
    invoice: "INV004",
    status: "Paid",
    method: "Credit Card",
    amount: "$450.00",
  },
];

function statusTone(status: InvoiceRow["status"]): "success" | "warning" | "destructive" {
  if (status === "Paid") {
    return "success";
  }
  if (status === "Pending") {
    return "warning";
  }
  return "destructive";
}

function InvoiceTable(props: {
  selectedInvoice?: string;
  showFooter?: boolean;
  showCaption?: boolean;
}): JSX.Element {
  const { selectedInvoice, showFooter = true, showCaption = true } = props;

  return (
    <div
      style={{
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-panel)",
        background: "var(--color-bg-surface)",
        overflow: "hidden",
      }}
    >
      <Table>
        {showCaption ? <TableCaption>A list of your recent invoices.</TableCaption> : null}
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead align="right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {INVOICES.map((row) => (
            <TableRow
              key={row.invoice}
              data-state={row.invoice === selectedInvoice ? "selected" : undefined}
            >
              <TableCell>{row.invoice}</TableCell>
              <TableCell>
                <Badge tone={statusTone(row.status)} size="sm">
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell>{row.method}</TableCell>
              <TableCell align="right">{row.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {showFooter ? (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell align="right">$1,200.00</TableCell>
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </div>
  );
}

const meta = {
  title: "UI Kit/Table",
  component: Table,
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            padding: "var(--space-md)",
            background: "var(--color-bg-app)",
            color: "var(--color-text-primary)",
            maxWidth: 720,
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <InvoiceTable />,
};

export const WithSelectedRow: Story = {
  render: () => <InvoiceTable selectedInvoice="INV002" />,
};

export const WithoutFooter: Story = {
  render: () => <InvoiceTable showFooter={false} />,
};

export const Alignment: Story = {
  render: () => (
    <div
      style={{
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-panel)",
        background: "var(--color-bg-surface)",
        overflow: "hidden",
      }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead align="left">Left</TableHead>
            <TableHead align="center">Center</TableHead>
            <TableHead align="right">Right</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell align="left">Start</TableCell>
            <TableCell align="center">Middle</TableCell>
            <TableCell align="right">End</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const DenseComposition: Story = {
  render: () => <InvoiceTable selectedInvoice="INV001" showCaption={false} />,
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => <InvoiceTable selectedInvoice="INV003" />,
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => <InvoiceTable selectedInvoice="INV003" />,
};
