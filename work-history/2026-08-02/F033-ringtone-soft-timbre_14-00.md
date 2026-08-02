# F-033: classic FM ring + восстановление каталога

**Дата:** 2026-08-02 14:10
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/media/browser/classicRingtone.ts`
- `src/adapters/media/browser/ringtonePresets.ts`, `WebAudioTonePlayer.ts`
- удалены временные helper-файлы тембр-прохода
- docs: P11 ringtone design, Feature-Registry F-033, STATUS, Legacy LF-012, Settings schema

## Что
- Classic FM-реализация сохранена под нейтральным именем `classicRingtone`
- Остальные пресеты и step-playback возвращены к исходным F-033 значениям
- Документация описывает classic технически (660 Hz / LFO / cadence), без внешних проектных ярлыков

## Зачем
- Нейтральные имена/доки; каталог как до тембр-экспериментов

## Результат
- Targeted vitest 20/20 PASS; `registry:check` 86/0; `tsc` web PASS
