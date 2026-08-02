/**
 * - Purpose: assert F-034 WU-03 producer notify literals include module/functionId/interruptClass.
 * - Inputs: listed product toast producer source files.
 * - Outputs: empty violation list when every inline notify object is tagged.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const PRODUCER_RELATIVE_PATHS = [
  "src/renderer/hooks/useActionNotifications.ts",
  "src/renderer/hooks/useContactActions.ts",
  "src/renderer/hooks/useCallHistoryActions.ts",
  "src/renderer/hooks/usePreferencesTransferActions.ts",
  "src/renderer/hooks/useSdkSettingsPanel.ts",
  "src/renderer/hooks/useOcpSettingsPanel.ts",
  "src/renderer/hooks/useExternalApplicationsPanel.ts",
  "src/renderer/hooks/useScreenSharePicker.ts",
  "src/renderer/hooks/externalServicesPanel/presentExternalServicesOutcomeError.ts",
  "src/renderer/hooks/useVideoCallNotifications.ts",
  "src/renderer/hooks/useOcpCampaignModal.ts",
  "src/renderer/hooks/useOperatorStatusSelector.ts",
  "src/renderer/hooks/useOcpLogoutModal.ts",
  "src/renderer/hooks/useOcpRejectWithBreak.ts",
  "src/renderer/integration/ocp/createOcpToastNotificationPresenter.ts",
  "src/renderer/shells/SoftphoneReadyShell.tsx",
] as const;

const NOTIFY_OBJECT_START =
  /(?:notifications\.)?notify(?:\?\.)?\(\{|NotificationDescriptor\s*=\s*\{/g;

function extractBalancedObject(source: string, openBraceIndex: number): string {
  let depth = 0;
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char !== "}") {
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return source.slice(openBraceIndex, index + 1);
    }
  }
  return source.slice(openBraceIndex);
}

function collectUntaggedNotifyObjects(
  relativePath: string,
  source: string,
): string[] {
  const violations: string[] = [];
  NOTIFY_OBJECT_START.lastIndex = 0;
  let match = NOTIFY_OBJECT_START.exec(source);
  while (match !== null) {
    const openBraceIndex = source.indexOf("{", match.index);
    if (openBraceIndex < 0) {
      break;
    }
    const objectLiteral = extractBalancedObject(source, openBraceIndex);
    const hasModule = /\bmodule\s*:/.test(objectLiteral);
    const hasFunctionId = /\bfunctionId\s*:/.test(objectLiteral);
    const hasInterruptClass = /\binterruptClass\s*:/.test(objectLiteral);
    if (!hasModule || !hasFunctionId || !hasInterruptClass) {
      const line = source.slice(0, openBraceIndex).split("\n").length;
      violations.push(
        `${relativePath}:${line} missing ${[
          !hasModule ? "module" : null,
          !hasFunctionId ? "functionId" : null,
          !hasInterruptClass ? "interruptClass" : null,
        ]
          .filter((part): part is string => part !== null)
          .join(", ")}`,
      );
    }
    match = NOTIFY_OBJECT_START.exec(source);
  }
  return violations;
}

describe("F-034 notification producer tagging", () => {
  it("requires module, functionId, and interruptClass on product notify literals", () => {
    const violations = PRODUCER_RELATIVE_PATHS.flatMap((relativePath) => {
      const absolutePath = path.join(repoRoot, relativePath);
      expect(fs.existsSync(absolutePath)).toBe(true);
      return collectUntaggedNotifyObjects(
        relativePath,
        fs.readFileSync(absolutePath, "utf8"),
      );
    });

    expect(violations).toEqual([]);
  });
});
