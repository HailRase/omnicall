# Account: SIP-like API key field + borderless mode tabs

**Дата:** 2026-07-17 15:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPasswordField.tsx`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/ui/tabs/Tabs.module.css`

## Что
- OCP API key переведён на тот же `AccountPasswordField`, что SIP password (тот же input + глазок)
- Tabs slide: base trigger без border; selected chrome только у thumb; active-стили с border только вне `indicator="slide"`
- Локально у `mode-tab-trigger` принудительно `border: none`

## Зачем
- Визуальный паритет secret-полей и убрать border у неактивных mode tabs.

## Результат
- AccountPanel + Tabs tests, eslint, tsc — ok
