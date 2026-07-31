# ADR-0024: External Applications screen-pop BrowserWindows

- Status: **Accepted** (2026-07-31)
- Context: Operators need configurable CRM/helpdesk pages on call events inside Electron, not only system browser tabs (F-020) or HTTP webhooks (F-031).
- Decision: Main opens sandboxed `BrowserWindow` via typed IPC; payload is a resolved HTTPS URL + size/title/ids; child loads URL directly (no `<webview>`, no softphone preload in guest); partition `persist:external-applications`; duplicate `applicationId:callId` focuses existing window.
- Alternatives rejected: iframe host page (X-Frame-Options failures); `<webview>` (deprecated / larger attack surface); unvalidated renderer `window.open`.
- Consequences: Application resolves templates and validates HTTPS before IPC; Domain stays Electron-free; F-030 round-trips `UserSettings.externalApplications` (schema v14).
