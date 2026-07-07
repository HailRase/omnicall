/** Bulgarian interpolation function sources for i18n catalog generation. */
export const BG_FUNCTION_TEMPLATES = {
  "settings.content.title": `(params: Readonly<{ sectionTitle: string }>) =>
    \`Настройки (\${params.sectionTitle})\``,
  "settings.general.recoveryIntervalHint": `(params: Readonly<{ minSec: number }>) =>
    \`Фиксирано забавяне между опитите (минимум \${params.minSec} сек)\``,
  "settings.general.latestVersion": `(params: Readonly<{ version: string }>) =>
    \`Последна версия: \${params.version}\``,
  "updates.status.updateAvailable": `(params: Readonly<{ latestVersion: string | undefined }>) =>
    params.latestVersion !== undefined
      ? \`Налична е нова версия \${params.latestVersion}. Изтеглете инсталатора и я инсталирайте ръчно.\`
      : "Налична е нова версия. Изтеглете инсталатора и я инсталирайте ръчно."`,
  "updates.prompt.message": `(params: Readonly<{ latestVersion: string | undefined }>) =>
    params.latestVersion !== undefined
      ? \`Налична е нова версия \${params.latestVersion}.\`
      : "Налична е нова версия."`,
  "account.error.serverRegistration": `(params: Readonly<{ detail: string }>) =>
    \`Грешка при регистрация на сървъра: \${params.detail}\``,
  "account.profile.switch.confirmMessage": `(params: Readonly<{ fromLogin: string; toLogin: string }>) =>
    \`Сигурни ли сте, че искате да смените профила от \${params.fromLogin} на \${params.toLogin}?\``,
  "header.registrationDot.aria": `(params: Readonly<{ registrationStatus: string; phoneStatus: string }>) =>
    \`Регистрация: \${params.registrationStatus}, телефон: \${params.phoneStatus}\``,
  "header.sipStatus.aria": `(params: Readonly<{ status: string }>) => \`SIP: \${params.status}\``,
  "header.sipStatus.ariaWithRetry": `(params: Readonly<{ status: string; timer: string }>) =>
    \`SIP: \${params.status}, повторен опит след \${params.timer}\``,
  "call.line.ariaLabel": `(params: Readonly<{ displayName: string }>) =>
    \`Линия на обаждане \${params.displayName}\``,
  "call.controls.hangupLineAria": `(params: Readonly<{ displayName: string }>) =>
    \`Затвори обаждане \${params.displayName}\``,
  "call.controls.answerLineAria": `(params: Readonly<{ displayName: string }>) =>
    \`Отговори на обаждане \${params.displayName}\``,
  "call.controls.resumeLineAria": `(params: Readonly<{ displayName: string }>) =>
    \`Възобнови обаждане \${params.displayName}\``,
  "call.controls.retryOperationAria": `(params: Readonly<{ operation: string }>) =>
    \`Повтори \${params.operation}\``,
  "call.sessions.heading": `(params: Readonly<{ count: number }>) => \`Сесии · \${params.count}\``,
  "call.session.status.selected": `(params: Readonly<{ status: string }>) =>
    \`\${params.status} · избрана\``,
  "call.session.selectAria": `(params: Readonly<{ displayName: string }>) =>
    \`Избери обаждане \${params.displayName}\``,
  "call.session.ariaLabel": `(params: Readonly<{ displayName: string }>) =>
    \`Обаждане \${params.displayName}\``,
  "call.session.compactAria.localAndRemoteHold": `(params: Readonly<{ base: string }>) =>
    \`\${params.base}, на задържане, отдалечената страна е на задържане\``,
  "call.session.compactAria.localHold": `(params: Readonly<{ base: string }>) =>
    \`\${params.base}, на задържане\``,
  "call.session.compactAria.remoteHold": `(params: Readonly<{ base: string }>) =>
    \`\${params.base}, отдалечената страна е на задържане\``,
  "call.dtmf.title": `(params: Readonly<{ displayName: string }>) =>
    \`DTMF клавиатура \${params.displayName}\``,
  "incoming.selectAria": `(params: Readonly<{ primary: string }>) =>
    \`Избери входящо обаждане \${params.primary}\``,
  "incoming.autoAnswer.countdown": `(params: Readonly<{ seconds: number }>) =>
    \`Автоматичен отговор след \${params.seconds}\``,
  "activeCall.operationError": `(params: Readonly<{ operation: string; message: string }>) =>
    \`\${params.operation}: грешка — \${params.message}\``,
  "status.timer.ariaLabel": `(params: Readonly<{ duration: string }>) =>
    \`Време в статус: \${params.duration}\``,
  "recovery.channel.attempt": `(params: Readonly<{ attempt: number; maxAttempts: number }>) =>
    \`Опит \${params.attempt} от \${params.maxAttempts}\``,
  "recovery.countdown.message": `(params: Readonly<{ seconds: number; suffix: string }>) =>
    \`Следващ опит след \${params.seconds} \${params.suffix}\``,
  "settings.sessions.autoAnswer.timeoutHint": `(params: Readonly<{ maxSec: number }>) =>
    \`0 — незабавен отговор; максимум \${params.maxSec} сек\``,
  "settings.systemState.liveSummary": `(params: Readonly<{ transport: string; registration: string; summary: string }>) =>
    \`Сървър: \${params.transport}. Регистрация: \${params.registration}. Обобщение: \${params.summary}.\``,
  "settings.systemState.metric.serverAria": `(params: Readonly<{ value: string }>) =>
    \`Сървър: \${params.value}\``,
  "settings.systemState.metric.registrationAria": `(params: Readonly<{ value: string }>) =>
    \`Регистрация: \${params.value}\``,
  "settings.systemState.metric.summaryAria": `(params: Readonly<{ value: string }>) =>
    \`Обобщение: \${params.value}\``,
  "settings.systemState.autoRecovery.reconnectIntervalHint": `(params: Readonly<{ minSec: number }>) =>
    \`Минимум \${params.minSec} сек\``,
  "settings.systemState.autoRecovery.reregisterIntervalHint": `(params: Readonly<{ minSec: number }>) =>
    \`Минимум \${params.minSec} сек\``,
  "settings.systemState.field.minValueError": `(params: Readonly<{ min: number }>) =>
    \`Минималната стойност е \${params.min} сек\``,
  "dialpad.keys.dialAria": `(params: Readonly<{ key: string }>) => \`Набери \${params.key}\``,
  "shell.overlay.closeTitleAria": `(params: Readonly<{ title: string }>) => \`Затвори: \${params.title}\``,
};
