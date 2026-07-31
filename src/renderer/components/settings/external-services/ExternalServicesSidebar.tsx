import { useState, type JSX } from "react";
import clsx from "clsx";
import { useI18n } from "../../../i18n/index.js";
import { AppIcon } from "../../icons/AppIcon.js";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/index.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesSidebarRequest = Readonly<{
  id: string;
  name: string;
  method: string;
  enabled: boolean;
}>;

export type ExternalServicesSidebarCollection = Readonly<{
  id: string;
  name: string;
  enabled: boolean;
  requests: ReadonlyArray<ExternalServicesSidebarRequest>;
}>;

export type ExternalServicesSidebarSelection =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "collection"; collectionId: string }>
  | Readonly<{ kind: "request"; collectionId: string; requestId: string }>;

export type ExternalServicesSidebarProps = Readonly<{
  collections: ReadonlyArray<ExternalServicesSidebarCollection>;
  selection: ExternalServicesSidebarSelection;
  busy: boolean;
  loadState: "loading" | "ready" | "error" | "unavailable";
  onCreateCollection: () => void;
  onImportCollection: () => void;
  onSelectCollection: (collectionId: string) => void;
  onSelectRequest: (collectionId: string, requestId: string) => void;
  onCreateRequest: (collectionId: string) => void;
  onRenameCollection: (collectionId: string) => void;
  onDuplicateCollection: (collectionId: string) => void;
  onExportCollection: (collectionId: string) => void;
  onEditVariables: (collectionId: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onToggleRequest: (collectionId: string, requestId: string, enabled: boolean) => void;
  onRenameRequest: (collectionId: string, requestId: string) => void;
  onDuplicateRequest: (collectionId: string, requestId: string) => void;
  onDeleteRequest: (collectionId: string, requestId: string) => void;
}>;

const METHOD_CLASS: Readonly<Record<string, string>> = {
  GET: styles.methodGet,
  POST: styles.methodPost,
  PUT: styles.methodPut,
  PATCH: styles.methodPatch,
  DELETE: styles.methodDelete,
};

/**
 * - Purpose: Postman-like collections tree for External Services Settings.
 * - Inputs: collection/request tree, selection, load/busy flags, intent callbacks.
 * - Outputs: accessible sidebar navigation without Domain or HTTP access.
 * @uiMeta f=F-031
 */
export function ExternalServicesSidebar({
  collections,
  selection,
  busy,
  loadState,
  onCreateCollection,
  onImportCollection,
  onSelectCollection,
  onSelectRequest,
  onCreateRequest,
  onRenameCollection,
  onDuplicateCollection,
  onExportCollection,
  onEditVariables,
  onDeleteCollection,
  onToggleRequest,
  onRenameRequest,
  onDuplicateRequest,
  onDeleteRequest,
}: ExternalServicesSidebarProps): JSX.Element {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(collections.map((c) => c.id)),
  );
  const controlsDisabled = busy || loadState === "loading" || loadState === "unavailable";

  const toggleExpanded = (collectionId: string): void => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  return (
    <aside
      className={styles.sidebar}
      data-testid="external-services-collections"
      aria-label={t("settings.integrations.externalServices.sidebar.collections")}
    >
      <div className={styles.sidebarHeader}>
        <p className={styles.sidebarTitle}>
          {t("settings.integrations.externalServices.sidebar.collections")}
        </p>
        <div className={styles.sidebarHeaderActions}>
          <button
            type="button"
            className={clsx(styles.sidebarHeaderButton, styles.sidebarIconButton)}
            disabled={controlsDisabled}
            data-testid="external-services-create-collection"
            aria-label={t("settings.integrations.externalServices.actions.create")}
            onClick={onCreateCollection}
          >
            <AppIcon
              id="settings.integrations.external-services.add"
              size={14}
              decorative
              preferAnimated={false}
            />
          </button>
          <button
            type="button"
            className={styles.sidebarHeaderButton}
            disabled={controlsDisabled}
            data-testid="external-services-import-collection"
            onClick={onImportCollection}
          >
            {t("settings.integrations.externalServices.actions.import")}
          </button>
        </div>
      </div>

      {loadState === "ready" && collections.length === 0 ? (
        <div className={styles.sidebarEmpty}>
          <p className={styles.emptyTitle}>
            {t("settings.integrations.externalServices.collections.emptyTitle")}
          </p>
          <p className={styles.emptyDescription}>
            {t("settings.integrations.externalServices.collections.emptyDescription")}
          </p>
          <div className={styles.emptyActions}>
            <Button type="button" size="sm" disabled={controlsDisabled} onClick={onCreateCollection}>
              {t("settings.integrations.externalServices.actions.create")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={controlsDisabled}
              onClick={onImportCollection}
            >
              {t("settings.integrations.externalServices.actions.import")}
            </Button>
          </div>
        </div>
      ) : null}

      {loadState === "ready" && collections.length > 0 ? (
        <ul className={styles.tree}>
          {collections.map((collection) => {
            const isExpanded = expanded.has(collection.id);
            const collectionSelected =
              selection.kind === "collection" && selection.collectionId === collection.id;
            return (
              <li
                key={collection.id}
                className={styles.treeCollection}
                data-testid={`external-services-collection-${collection.id}`}
              >
                <div className={clsx(styles.treeFolderRow, collectionSelected && styles.treeRowSelected)}>
                  <button
                    type="button"
                    className={styles.treeExpand}
                    aria-expanded={isExpanded}
                    aria-label={
                      isExpanded
                        ? t("settings.integrations.externalServices.sidebar.collapse", {
                            name: collection.name,
                          })
                        : t("settings.integrations.externalServices.sidebar.expand", {
                            name: collection.name,
                          })
                    }
                    onClick={() => {
                      toggleExpanded(collection.id);
                    }}
                  >
                    <AppIcon
                      id="ui.select.chevron"
                      decorative
                      className={clsx(styles.treeChevron, isExpanded && styles.treeChevronOpen)}
                    />
                  </button>
                  <button
                    type="button"
                    className={styles.treeFolderButton}
                    disabled={controlsDisabled}
                    onClick={() => {
                      if (!isExpanded) {
                        toggleExpanded(collection.id);
                      }
                      onSelectCollection(collection.id);
                    }}
                  >
                    <span className={styles.treeFolderName}>{collection.name}</span>
                  </button>
                  <div className={styles.treeRowActions}>
                    <button
                      type="button"
                      className={styles.treeQuickAdd}
                      disabled={controlsDisabled}
                      aria-label={t("settings.integrations.externalServices.requests.create")}
                      data-testid={`external-services-collection-add-${collection.id}`}
                      onClick={() => onCreateRequest(collection.id)}
                    >
                      <AppIcon
                        id="settings.integrations.external-services.add"
                        size={12}
                        decorative
                        preferAnimated={false}
                      />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={styles.treeMenuTrigger}
                          disabled={controlsDisabled}
                          aria-label={t("settings.integrations.externalServices.actions.menu")}
                          data-testid={`external-services-collection-menu-${collection.id}`}
                        >
                          ⋯
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          disabled={controlsDisabled}
                          onSelect={() => onCreateRequest(collection.id)}
                        >
                          {t("settings.integrations.externalServices.requests.create")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={controlsDisabled}
                          onSelect={() => onRenameCollection(collection.id)}
                        >
                          {t("settings.integrations.externalServices.actions.rename")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={controlsDisabled}
                          onSelect={() => onEditVariables(collection.id)}
                        >
                          {t("settings.integrations.externalServices.actions.editVariables")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={controlsDisabled}
                          onSelect={() => onDuplicateCollection(collection.id)}
                        >
                          {t("settings.integrations.externalServices.actions.duplicate")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={controlsDisabled}
                          onSelect={() => onExportCollection(collection.id)}
                        >
                          {t("settings.integrations.externalServices.actions.export")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={controlsDisabled}
                          destructive
                          onSelect={() => onDeleteCollection(collection.id)}
                        >
                          {t("settings.integrations.externalServices.actions.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {isExpanded ? (
                  collection.requests.length === 0 ? (
                    <div className={styles.treeEmptyFolder}>
                      <p className={styles.treeEmptyText}>
                        {t("settings.integrations.externalServices.sidebar.emptyCollection")}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={controlsDisabled}
                        onClick={() => onCreateRequest(collection.id)}
                      >
                        {t("settings.integrations.externalServices.requests.create")}
                      </Button>
                    </div>
                  ) : (
                    <ul className={styles.treeRequests}>
                      {collection.requests.map((request) => {
                        const selected =
                          selection.kind === "request" &&
                          selection.collectionId === collection.id &&
                          selection.requestId === request.id;
                        return (
                          <li key={request.id}>
                            <div
                              className={clsx(
                                styles.treeRequestRow,
                                selected && styles.treeRowSelected,
                              )}
                            >
                              <span
                                className={clsx(
                                  styles.treeRequestStatus,
                                  request.enabled
                                    ? styles.treeRequestStatusOn
                                    : styles.treeRequestStatusOff,
                                )}
                                aria-hidden="true"
                                data-testid={`external-services-request-status-${request.id}`}
                              />
                              <button
                                type="button"
                                className={styles.treeRequestButton}
                                disabled={controlsDisabled}
                                data-testid={`external-services-request-${request.id}`}
                                onClick={() => onSelectRequest(collection.id, request.id)}
                              >
                                <span
                                  className={clsx(
                                    styles.methodBadge,
                                    METHOD_CLASS[request.method] ?? styles.methodGet,
                                  )}
                                >
                                  {request.method}
                                </span>
                                <span
                                  className={clsx(
                                    styles.treeRequestName,
                                    !request.enabled && styles.treeRequestDisabled,
                                  )}
                                >
                                  {request.name}
                                </span>
                              </button>
                              <div className={styles.treeRowActions}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className={styles.treeMenuTrigger}
                                      disabled={controlsDisabled}
                                      aria-label={t(
                                        "settings.integrations.externalServices.requests.menuLabel",
                                      )}
                                      data-testid={`external-services-request-menu-${request.id}`}
                                    >
                                      ⋯
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem
                                      disabled={controlsDisabled}
                                      onSelect={() =>
                                        onToggleRequest(collection.id, request.id, !request.enabled)
                                      }
                                    >
                                      {t(
                                        request.enabled
                                          ? "settings.integrations.externalServices.requests.actionDisable"
                                          : "settings.integrations.externalServices.requests.actionEnable",
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={controlsDisabled}
                                      onSelect={() => onRenameRequest(collection.id, request.id)}
                                    >
                                      {t("settings.integrations.externalServices.actions.rename")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={controlsDisabled}
                                      onSelect={() =>
                                        onDuplicateRequest(collection.id, request.id)
                                      }
                                    >
                                      {t("settings.integrations.externalServices.actions.duplicate")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={controlsDisabled}
                                      destructive
                                      onSelect={() => onDeleteRequest(collection.id, request.id)}
                                    >
                                      {t("settings.integrations.externalServices.actions.delete")}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </aside>
  );
}
