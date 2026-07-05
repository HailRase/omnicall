import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { ChangeEvent, JSX } from "react";
import { useI18n, type TranslationKey } from "../../../i18n/index.js";
import styles from "./CodecPreferencesSortableList.module.css";

export type CodecSortableRow = Readonly<{
  id: string;
  enabled: boolean;
  order: number;
}>;

export type CodecPreferencesSortableListProps = Readonly<{
  listId: string;
  rows: ReadonlyArray<CodecSortableRow>;
  resolveLabelKey: (codecId: string) => TranslationKey;
  isToggleDisabled: (codecId: string) => boolean;
  onToggle: (codecId: string, enabled: boolean) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}>;

/**
 * - Purpose: render draggable codec preference rows with enable checkboxes.
 * - Inputs: ordered rows, label resolver, toggle/reorder callbacks.
 * - Outputs: accessible sortable list without settings persistence logic.
 */
export function CodecPreferencesSortableList({
  listId,
  rows,
  resolveLabelKey,
  isToggleDisabled,
  onToggle,
  onReorder,
}: CodecPreferencesSortableListProps): JSX.Element {
  const { t } = useI18n();
  const sortedRows = [...rows].sort((left, right) => left.order - right.order);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (over === null || active.id === over.id) {
      return;
    }

    const fromIndex = sortedRows.findIndex((row) => row.id === active.id);
    const toIndex = sortedRows.findIndex((row) => row.id === over.id);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    onReorder(fromIndex, toIndex);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortedRows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
        <ul className={styles.list} data-testid={`${listId}-list`}>
          {sortedRows.map((row) => (
            <CodecSortableRowItem
              key={row.id}
              listId={listId}
              row={row}
              label={t(resolveLabelKey(row.id))}
              toggleDisabled={isToggleDisabled(row.id)}
              onToggle={onToggle}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

type CodecSortableRowItemProps = Readonly<{
  listId: string;
  row: CodecSortableRow;
  label: string;
  toggleDisabled: boolean;
  onToggle: (codecId: string, enabled: boolean) => void;
}>;

function CodecSortableRowItem({
  listId,
  row,
  label,
  toggleDisabled,
  onToggle,
}: CodecSortableRowItemProps): JSX.Element {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onToggle(row.id, event.target.checked);
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={clsx(styles.row, isDragging && styles.rowDragging)}
      data-testid={`${listId}-row-${row.id}`}
    >
      <button
        type="button"
        className={styles.dragHandle}
        aria-label={t("settings.codecs.dragHandleLabel")}
        data-testid={`${listId}-drag-${row.id}`}
        {...attributes}
        {...listeners}
      >
        <span className={styles.dragGrip} aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className={styles.dragGripDot} />
          ))}
        </span>
      </button>
      <input
        id={`${listId}-codec-${row.id}`}
        type="checkbox"
        className={styles.checkbox}
        checked={row.enabled}
        disabled={toggleDisabled}
        aria-disabled={toggleDisabled}
        data-testid={`${listId}-toggle-${row.id}`}
        onChange={handleCheckboxChange}
      />
      <label
        htmlFor={`${listId}-codec-${row.id}`}
        className={clsx(styles.label, toggleDisabled && styles.labelDisabled)}
      >
        {label}
      </label>
    </li>
  );
}
