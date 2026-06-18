# AGENTS.md

## Cursor Cloud specific instructions

### Обзор проекта

**GM Beauty Cabinet** — одностраничное React-приложение (Vite 8 + TypeScript + React 19). Каталог косметики без бэкенда: данные в `src/data/products.ts`, корзина и избранное в `localStorage`. Маршрутизация через hash (`#catalog`, `#product/<id>`, `#cart`, `#favorites`).

### Сервисы

| Сервис | Команда | Порт | Обязателен |
|--------|---------|------|------------|
| Vite dev server | `npm run dev -- --host 0.0.0.0` | 5173 | Да (для разработки) |
| Vite preview | `npm run preview -- --host 0.0.0.0` | 4173 | Нет (альтернатива после `npm run build`) |

Бэкенд, БД, Docker и внешние сервисы не требуются.

### Стандартные команды

См. `README.md` и `package.json`:

- **Установка зависимостей:** `npm install`
- **Dev-сервер:** `npm run dev`
- **Сборка:** `npm run build`
- **Линт:** `npm run lint`
- **Preview prod-сборки:** `npm run preview`

### Заметки для агентов

- Запускай dev-сервер в tmux, чтобы процесс не завершался: `npm run dev -- --host 0.0.0.0` (порт 5173).
- Тестов в репозитории нет — проверка через lint, build и ручной/E2E-прогон в браузере.
- Для E2E достаточно: главная → каталог → карточка товара → «Добавить в корзину» → корзина.
- Новые товары добавляются в `src/data/products.ts`; изображения — в `public/products/`.
