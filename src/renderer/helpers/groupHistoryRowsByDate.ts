import type { SupportedLanguage } from "@application/index.js";

export type HistoryDateGroupKind =
  | "today"
  | "yesterday"
  | "weekday"
  | "lastWeek"
  | "month";

export type HistoryDateGroupKey = Readonly<{
  kind: HistoryDateGroupKind;
  sortKey: string;
  label: string;
}>;

type ResolveHistoryDateGroupInput = Readonly<{
  startedAtIso: string;
  language: SupportedLanguage;
  now?: Date;
  translate: (key: string) => string;
}>;

type GroupHistoryRowsInput<TRow extends Readonly<{ id: string; startedAtIso: string }>> =
  Readonly<{
    rows: ReadonlyArray<TRow>;
    language: SupportedLanguage;
    now?: Date;
    translate: (key: string) => string;
  }>;

export type HistoryDateSection<TRow> = Readonly<{
  group: HistoryDateGroupKey;
  rows: ReadonlyArray<TRow>;
}>;

/**
 * - Purpose: bucket call-history rows into localized date sections for list UI.
 * - Inputs: rows with ISO timestamps, locale, and translation callback.
 * - Outputs: ordered sections preserving row order within each group.
 */
export function groupHistoryRowsByDate<TRow extends Readonly<{ id: string; startedAtIso: string }>>(
  input: GroupHistoryRowsInput<TRow>,
): ReadonlyArray<HistoryDateSection<TRow>> {
  const now = input.now ?? new Date();
  const sections = new Map<string, HistoryDateSection<TRow>>();

  for (const row of input.rows) {
    const group = resolveHistoryDateGroup({
      startedAtIso: row.startedAtIso,
      language: input.language,
      now,
      translate: input.translate,
    });

    const existing = sections.get(group.sortKey);
    if (existing !== undefined) {
      sections.set(group.sortKey, {
        group: existing.group,
        rows: [...existing.rows, row],
      });
      continue;
    }

    sections.set(group.sortKey, { group, rows: [row] });
  }

  return [...sections.values()];
}

function resolveHistoryDateGroup(input: ResolveHistoryDateGroupInput): HistoryDateGroupKey {
  const date = new Date(input.startedAtIso);
  if (Number.isNaN(date.getTime())) {
    return {
      kind: "month",
      sortKey: "invalid",
      label: input.translate("history.group.older"),
    };
  }

  const now = input.now ?? new Date();
  const dayDelta = diffCalendarDays(now, date);

  if (dayDelta === 0) {
    return {
      kind: "today",
      sortKey: "today",
      label: input.translate("history.group.today"),
    };
  }

  if (dayDelta === 1) {
    return {
      kind: "yesterday",
      sortKey: "yesterday",
      label: input.translate("history.group.yesterday"),
    };
  }

  if (dayDelta >= 2 && dayDelta <= 6) {
    const weekday = new Intl.DateTimeFormat(input.language, { weekday: "long" }).format(date);
    return {
      kind: "weekday",
      sortKey: `weekday-${formatDayKey(date)}`,
      label: weekday,
    };
  }

  if (dayDelta >= 7 && dayDelta <= 13) {
    return {
      kind: "lastWeek",
      sortKey: "last-week",
      label: input.translate("history.group.lastWeek"),
    };
  }

  const monthLabel = new Intl.DateTimeFormat(input.language, {
    month: "long",
    year: "numeric",
  }).format(date);

  return {
    kind: "month",
    sortKey: `month-${date.getFullYear()}-${date.getMonth()}`,
    label: monthLabel,
  };
}

function diffCalendarDays(reference: Date, target: Date): number {
  const referenceDay = startOfDay(reference).getTime();
  const targetDay = startOfDay(target).getTime();
  return Math.round((referenceDay - targetDay) / 86_400_000);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
