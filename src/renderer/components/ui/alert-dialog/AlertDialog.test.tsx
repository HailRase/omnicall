// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type JSX } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../button/Button.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./AlertDialog.js";

afterEach(() => {
  cleanup();
});

function BasicAlertDialog({
  onAction,
  onCancel,
  actionLoading = false,
}: Readonly<{
  onAction?: () => void;
  onCancel?: () => void;
  actionLoading?: boolean;
}>): JSX.Element {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Open alert</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Your profile will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              loading={actionLoading}
              onClick={onAction}
            >
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ControlledAlertDialog(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="primary">{open ? "Alert open" : "Alert closed"}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Controlled alert</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">Dismiss</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe("AlertDialog", () => {
  it("opens and closes", async () => {
    const user = userEvent.setup();

    render(<BasicAlertDialog />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open alert" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("calls action", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(<BasicAlertDialog onAction={onAction} />);

    await user.click(screen.getByRole("button", { name: "Open alert" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onAction).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("calls cancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<BasicAlertDialog onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Open alert" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("keeps focus inside", async () => {
    const user = userEvent.setup();

    render(<BasicAlertDialog />);

    await user.click(screen.getByRole("button", { name: "Open alert" }));
    const alertDialog = await screen.findByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const deleteButton = screen.getByRole("button", { name: "Delete" });

    expect(cancelButton).toHaveFocus();

    await user.tab();
    expect(deleteButton).toHaveFocus();

    await user.tab();
    expect(cancelButton).toHaveFocus();
  });

  it("has alertdialog role and accessible name", async () => {
    const user = userEvent.setup();

    render(<BasicAlertDialog />);

    await user.click(screen.getByRole("button", { name: "Open alert" }));

    const alertDialog = await screen.findByRole("alertdialog", { name: "Delete account" });
    expect(alertDialog).toBeInTheDocument();
    expect(
      screen.getByText("This action cannot be undone. Your profile will be permanently removed."),
    ).toBeInTheDocument();
  });

  it("supports controlled open state", async () => {
    const user = userEvent.setup();

    render(<ControlledAlertDialog />);

    await user.click(screen.getByRole("button", { name: "Alert closed" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Alert closed" })).toBeInTheDocument();
  });

  it("preserves caller className on content", async () => {
    const user = userEvent.setup();

    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Open alert</Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="custom-alert-panel">
          <AlertDialogHeader>
            <AlertDialogTitle>Styled alert</AlertDialogTitle>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open alert" }));

    expect(await screen.findByRole("alertdialog")).toHaveClass("custom-alert-panel");
  });

  it("blocks action click while loading", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(<BasicAlertDialog onAction={onAction} actionLoading />);

    await user.click(screen.getByRole("button", { name: "Open alert" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
