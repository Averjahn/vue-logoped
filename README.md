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
