# npm public RC publish (blocked on token package perms)

**Дата:** 2026-07-27 16:47
**Статус:** не выполнено
**Коммит:** —

## Где
- omnicall-kit packages ready at 0.1.0-rc.0 public
- npm org softomnitel (hailrase owner)

## Что
- 2FA включена (раньше был EOTP)
- Automation token принят: whoami=hailrase OK
- publish всё ещё E404 PUT (npm маскирует отсутствие прав на создание пакета)
- Token, скорее всего, с правами Organization R/W без Packages R/W / create packages under @softomnitel

## Зачем
- Опубликовать @softomnitel/omnicall-protocol и @softomnitel/omnicall-kit@0.1.0-rc.0 public

## Результат
- На registry пакетов нет
- Нужен новый Granular token: Packages and scopes = Read and write, org softomnitel, разрешить создание новых пакетов; старый токен из чата — отозвать
