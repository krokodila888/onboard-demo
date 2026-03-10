# Railway Onboard Demo

Демонстрационный проект для сравнительного тестирования библиотек пользовательского онбординга применительно к расчётному инженерному ПО.

**Живая версия:** https://krokodila888.github.io/onboard-demo/

## Технологии

- **React 18** + **Vite 6**
- **Tailwind CSS 3** — утилитарные стили
- **lucide-react** — иконки

## Запуск локально

```bash
npm install
npm run dev   # http://localhost:5173
```

## Структура проекта

```
railway-onboard-demo/
├── src/
│   ├── components/
│   │   ├── AdvancedTractionCalculator.jsx  # Основной калькулятор (все табы онбординга)
│   │   ├── LegacyCalculator.jsx            # Намеренно ухудшенный интерфейс («Реальное ПО»)
│   │   ├── CustomTooltip.jsx               # Кастомный тултип на @floating-ui/react
│   │   └── ErrorBoundary.jsx
│   ├── onboarding/
│   │   ├── shepherd-tour.js
│   │   ├── introjs-tour.js
│   │   ├── driver-tour.js
│   │   └── joyride-steps.jsx
│   ├── pages/
│   │   └── AboutPage.jsx                   # Страница «О проекте»
│   ├── App.jsx                             # Таб-система, палитры, LibraryBanner
│   ├── main.jsx
│   └── index.css                           # Tailwind + кастомные стили библиотек
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js                          # base: '/onboard-demo/'
├── tailwind.config.js
└── postcss.config.js
```

## Вкладки приложения

| Вкладка | Описание |
|---|---|
| **О проекте** | Цели, библиотеки, процесс тестирования, типичные проблемы |
| **Реальное ПО** | Намеренно ухудшенный интерфейс с 7 UX-антипаттернами — точка отсчёта |
| **Без онбординга** | Чистый калькулятор без подсказок — контрольная группа |
| **Intro.js** | Пошаговый тур + постоянные Hints-маркеры |
| **Shepherd.js** | Гибкий тур на Floating UI + модальный мини-тур |
| **Driver.js** | Spotlight-тур + одиночная подсветка элемента |
| **React Joyride** | State-driven тур + Beacon-режим (справка по полям) |
| **Tippy.js** | Контекстные тултипы (hover/focus) + интерактивный поповер (click) |
| **Кастомная** | Тултипы, собранные вручную на `@floating-ui/react` |

## Тестируемые библиотеки

| Библиотека | Версия | Подход |
|---|---|---|
| Intro.js | v8.3 | Highlight + data-атрибуты |
| Shepherd.js | v15.2 | Floating UI, кастомные шаги |
| Driver.js | v1.4 | Spotlight, без зависимостей |
| React Joyride | v2.x | React state-driven, TypeScript |
| Tippy.js | v6.3 | Тултипы и поповеры (Popper-based) |
| Floating UI | v0.27 | Низкоуровневый движок позиционирования |

## Деплой

Приложение деплоится на GitHub Pages через ветку `gh-pages`.

```bash
npm run build
git subtree push --prefix dist origin gh-pages
```
