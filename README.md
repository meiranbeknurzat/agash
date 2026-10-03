# «Ағаш» — лендинг и конфигуратор мебели

Реализация PRD v1.0 (`PRD.md`). Весь интерфейс находится в одном файле, `src/App.jsx`.

## Файлы

| Файл | Назначение |
|---|---|
| `src/App.jsx` | Весь сайт: данные, калькулятор, чертёж, форма заявки, стили (`STYLES`) |
| `agash-mebel.html` | Автономная страница: открывается двойным кликом, нужен интернет |
| `build-standalone.ps1` | Пересобирает `agash-mebel.html` из `src/App.jsx` без Node.js |
| `index.html`, `src/main.jsx`, `src/index.css`, `*.config.js`, `package.json` | Проект Vite + Tailwind 3.4 для продакшен-сборки |

## Настройка под компанию

В начале `src/App.jsx` замените заглушки в `COMPANY` (номер WhatsApp — только цифры с кодом страны).
Цены, материалы, фурнитура и каталог задаются в `TYPES`, `MATERIALS`, `FITTING_LEVELS`, `INSTALL` и `CATALOG`.

## Автономная страница (без Node.js)

```powershell
powershell -ExecutionPolicy Bypass -File .\build-standalone.ps1
```

React, lucide-react, Tailwind (Play CDN) и Babel подключаются с CDN, а JSX компилируется прямо в браузере.
Такой вариант подходит для прототипа и показа. Для продакшена используйте сборку через Vite.

## Продакшен-сборка (нужен Node.js 18+)

```bash
npm install
npm run dev      # локальный сервер разработки
npm run build    # статические файлы в dist/
```
