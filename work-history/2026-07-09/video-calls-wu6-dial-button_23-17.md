# Video calls WU6 dial button (F-027)

**Дата:** 2026-07-09 23:17
**Статус:** выполнено (частично: dial UI; surfaces/view modes — следующий шаг)
**Коммит:** —

## Где
- `src/renderer/components/dialpad/Dialpad.tsx` + CSS
- `src/renderer/hooks/useDialpadShell.ts`, `useSoftphoneCallActions.ts`, `useCallFeatureShell.ts`
- `src/application/facades/AccountBootstrapFacade.ts` (`makeCall` + mediaMode)
- `src/renderer/components/icons/iconCatalog.ts`, `Icon-Registry.md`
- i18n: `messages.ts`, `bgMessages.ts`, `bg-strings.json`

## Что
- Кнопка «Видеозвонок» рядом с «Позвонить» (`dialpad-video-call`)
- `facade.makeCall(number, undefined, "video")` при нажатии
- Disabled reasons через `resolveVideoCallAvailability` + i18n
- Иконка `dial.videoCall` (Lucide Video)
- Тесты Dialpad + useSoftphoneCallActions

## Зачем
- Убрать зависимость от global audioOnly: явный video dial action

## Результат
- Dialpad + call actions tests: 21/21 PASS
- typecheck PASS
- Следующий шаг WU6: video surfaces, view modes, cam/screen controls; затем WU7 incoming
