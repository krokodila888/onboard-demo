# Railway Onboard Demo

Демонстрационный проект для сравнения библиотек онбординга в React-приложениях.

## Технологии

- **React 18** + **Vite**
- **Tailwind CSS** — утилитарные стили
- **lucide-react** — иконки

## Запуск

```bash
npm install
npm run dev
```

## Структура проекта

```
railway-onboard-demo/
├── src/
│   ├── components/     # Компоненты демонстраций библиотек
│   ├── App.jsx         # Главный компонент
│   ├── main.jsx        # Точка входа
│   └── index.css       # Tailwind базовые стили
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Библиотеки для демонстрации

| Библиотека | Описание |
|---|---|
| **Intro.js** | Пошаговые туры с выделением элементов |
| **Shepherd.js** | Гибкие туры с кастомизацией |
| **Driver.js** | Акцент на элементах и туры |
| **React Joyride** | Онбординг-туры для React |
