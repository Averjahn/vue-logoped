# vue-logoped

Логопедический тренажёр для комбинирования частей слов. Приложение полностью повторяет функционал и внешний вид версии `v0-logoped`, но переписано на Vite + Vue 3 (Composition API, `<script setup>`) без TypeScript.

## Возможности

- Переключение между 18 упражнениями, каждое с общим корнем
- Панель с таймером, счётчиками правильных/ошибочных ответов и кнопкой сброса
- Банк частей слова с выделением выбранного элемента
- Две колонки (приставки и суффиксы) с подсветкой правильных/ошибочных ответов
- Кнопка перехода к следующему упражнению и финальный экран завершения

## Стек

- [Vite](https://vitejs.dev/) + [Vue 3](https://vuejs.org/)
- Tailwind CSS 3
- [lucide-vue-next](https://www.npmjs.com/package/lucide-vue-next) для иконок

## Запуск

```bash
npm install
npm run dev
```

Сборка продакшн-версии:

```bash
npm run build
npm run preview
```

## Структура

- `src/components/WordTrainer.vue` — основная логика тренажёра
- `src/components/ui/AppButton.vue` — переиспользуемая кнопка
- `src/data/exercises.js` — данные упражнений
- `src/utils/index.js` — утилиты (`cn`, перемешивание)
- `src/assets/main.css` — глобальные стили и Tailwind-слои

## Отправка статистики

### Режим платформы (isPlatform = true)

Сценарий 452 для курса 20 (см. [edudev.med-game.ru](https://edudev.med-game.ru/#/course/20)) требует два типа событий:

1. **Старт сессии** — сразу после входа отправляем

```json
{
  "test_id": 452,
  "course_id": 20,
  "body": {
    "startDate": "17.11.2025 18:04:07"
  }
}
```

2. **Каждая попытка** — после любого клика по слоту

```json
{
  "test_id": 452,
  "course_id": 20,
  "body": {
    "answers": ["СТУЛ"],
    "isRight": true,
    "numberTry": 1,
    "isHint": false
  }
}
```

- `answers` — массив слов, собранных пользователем в текущей попытке (аналог `scenarios_front`).
- `numberTry` — порядковый номер попытки в рамках текущего упражнения (сбрасывается при переключении задания).
- `isHint` — всегда `false`, пока подсказки не предусмотрены, но поле оставлено для совместимости.

Эндпоинты настраиваются через `.env`:

```
VITE_IS_PLATFORM=true
VITE_TEST_ID=452
VITE_COURSE_ID=20
VITE_STATISTICS_URL=https://dev2.med-game.ru/api/v1/user/answers
VITE_PLATFORM_START_URL=https://dev2.med-game.ru/api/v1/user/answers
```

`course_id` также автоматически берётся из URL (`#/course/:id`), так что при развёртывании на другом курсе достаточно обновить адрес.

### Режим без платформы

Если `VITE_IS_PLATFORM` не задан, приложение отправляет расширенный JSON (для внутренней аналитики), содержащий историю слов и координаты слота:

```jsonc
{
  "questionText": "Задание 4",
  "answers": ["СТУЛ", "МУСКУЛ", "УЛИТКА"],
  "currentWord": "СТУЛ",
  "isRight": true,
  "numberTry": 5,
  "column": "left",
  "position": 1,
  "timerSeconds": 125,
  "timestamp": "2025-11-17T09:45:12.345Z"
}
```

- `answers` — все слова, которые пользователь уже собрал на поле (аналог `answers` из `scenarios_front`)
- `currentWord` — слово из последней попытки (даже если неверно)
- `isRight` — корректность попытки
- `numberTry` — порядковый номер попытки с начала упражнения
- `column`, `position` — куда ставили часть
- `timerSeconds` и `timestamp` помогают строить таймлайн

Событие отправляется сразу после каждой попытки (как только пользователь кликает по слоту), чтобы аналитика получала историю действий в реальном времени, полностью повторяя специфику сбора статистики из `scenarios_front`.
