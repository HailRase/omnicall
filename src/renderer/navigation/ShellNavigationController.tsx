import type { JSX, ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

type ShellNavigationControllerProps = Readonly<{
  layout: ReactNode;
}>;

/**
 * - Purpose: declare hash-router shell routes while keeping the layout route mounted.
 * - Inputs: persistent softphone layout element for all in-app routes.
 * - Outputs: nested route tree with invalid-path fallback to dialpad.
 */
export function ShellNavigationController({
  layout,
}: ShellNavigationControllerProps): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={layout}>
        <Route index element={null} />
        <Route path="history" element={null} />
        <Route path="contacts" element={null} />
        <Route path="contacts/:contactId" element={null} />
        <Route path="contacts/:contactId/edit" element={null} />
        <Route path="settings" element={null} />
        <Route path="settings/:sectionId" element={null} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
