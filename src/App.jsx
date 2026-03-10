import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react'
import { Train, Play, Star, Info, BookOpen, AlertTriangle } from 'lucide-react'
import AdvancedTractionCalculator from './components/AdvancedTractionCalculator'
import LegacyCalculator from './components/LegacyCalculator'
import ErrorBoundary from './components/ErrorBoundary'

const AboutPage = lazy(() => import('./pages/AboutPage'))

// ─── Library metadata ─────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'about',
    label: 'О проекте',
    hasTour: false,
    isAbout: true,
    description: null,
    tags: [],
    ratings: null,
    notes: null,
  },
  {
    id: 'legacy',
    label: 'Реальное ПО',
    isLegacy: true,
    hasTour: false,
    description: null,
    tags: [],
    ratings: null,
    notes: null,
  },
  {
    id: 'baseline',
    label: 'Без онбординга',
    hasTour: false,
    description: 'Базовый интерфейс без каких-либо подсказок. Служит точкой отсчёта для сравнения библиотек.',
    tags: ['Baseline', 'Контрольная группа'],
    ratings: null,
    notes: null,
  },
  {
    id: 'introjs',
    label: 'Intro.js',
    hasTour: true,
    hasExtra: true,
    extraLabel: 'Обновить Hints',
    extraDesc: 'Постоянные подсказки «?» (Hints) на трёх технических полях — активны независимо от тура',
    description:
      'Классическая библиотека (2013) для создания пошаговых туров с выделением элементов. Настраивается через data-атрибуты или JavaScript API.',
    tags: ['Highlight', 'Progress bar', 'data-атрибуты', 'Зрелая'],
    ratings: { integration: 4, positioning: 3, suitability: 3 },
    notes: {
      integration: 'Минимум кода — data-атрибуты + один вызов intro().start()',
      positioning: 'Базовое позиционирование; иногда перекрывает элементы',
      suitability: 'Хорошо для простых форм, слабее для динамичных таблиц',
    },
  },
  {
    id: 'shepherd',
    label: 'Shepherd.js',
    hasTour: true,
    hasExtra: true,
    extraLabel: 'Инструкция по расчёту',
    extraDesc: 'Модальный мини-тур из 3 шагов: вводный экран, типичные ошибки, точка старта',
    description:
      'Мощная и гибкая библиотека. Использует Floating UI для точного позиционирования tooltips. Поддерживает сложные сценарии с кастомными шагами.',
    tags: ['Floating UI', 'Кастомизация', 'Events API', 'Framework-agnostic'],
    ratings: { integration: 3, positioning: 5, suitability: 4 },
    notes: {
      integration: 'Требует явного описания каждого шага в JS',
      positioning: 'Floating UI — лучшее позиционирование из всех вариантов',
      suitability: 'Гибкость полезна для сложных расчётных форм',
    },
  },
  {
    id: 'driver',
    label: 'Driver.js',
    hasTour: true,
    hasExtra: true,
    extraLabel: 'Одиночная подсветка',
    extraDesc: 'driver.highlight() — подсвечивает следующий доступный шаг без запуска полного тура',
    description:
      'Современная легковесная библиотека (v2+). Spotlight-эффект с затемнением фона чётко выделяет целевые элементы. Минималистичный API.',
    tags: ['Spotlight', 'Современный API', 'Лёгкий', 'Без зависимостей'],
    ratings: { integration: 4, positioning: 4, suitability: 4 },
    notes: {
      integration: 'Простой конфигурационный объект, минимальная настройка',
      positioning: 'Spotlight отлично акцентирует поля ввода',
      suitability: 'Затемнение фона предотвращает случайные клики при туре',
    },
  },
  {
    id: 'joyride',
    label: 'React Joyride',
    hasTour: true,
    hasExtra: true,
    extraLabel: 'Справка по полям',
    extraDesc: 'Beacon-режим — пульсирующие маркеры на ключевых полях; клик открывает контекстную подсказку',
    description:
      'React-нативная библиотека. Управляется через state и props — идеально вписывается в React-архитектуру. Поддерживает TypeScript.',
    tags: ['React-нативный', 'State-driven', 'TypeScript', 'Popper.js'],
    ratings: { integration: 4, positioning: 4, suitability: 5 },
    notes: {
      integration: 'Полная интеграция с React state; компонентная модель',
      positioning: 'Popper.js — стабильное позиционирование в динамичных UI',
      suitability: 'Наилучший вариант для React-приложений с формами',
    },
  },
  {
    id: 'tippy',
    label: 'Tippy.js',
    bannerTitle: 'Tippy.js — контекстная справка без тура',
    hasTour: false,
    description:
      'В отличие от предыдущих вкладок, здесь нет пошагового тура. Tippy.js специализируется на тултипах и поповерах: справка доступна в любой момент по наведению или клику на значок ? рядом с полем. Это альтернативный подход к онбордингу — не "веди меня за руку", а "дай мне справку, когда она нужна".',
    tags: ['Tooltip', 'Popover', 'Hover/Click', 'Popper-based'],
    ratings: null,
    notes: null,
    components: [
      'Контекстные тултипы на полях (hover/focus)',
      'Интерактивный поповер с контентом (click)',
      'Автоматическое перепозиционирование (flip)',
    ],
  },
  {
    id: 'custom',
    label: 'Кастомная',
    bannerTitle: 'Кастомная реализация на Floating UI',
    hasTour: false,
    description:
      'Эта вкладка показывает, что находится "под капотом" у Shepherd.js и других библиотек. Floating UI — это движок позиционирования, на котором строятся тултипы, поповеры и туры. Здесь онбординг собран вручную: без готовой библиотеки, только @floating-ui/react и собственный код. Именно такой подход лежит в основе разрабатываемой в ВКР библиотеки.',
    tags: ['Движок', 'Позиционирование', 'Low-level', 'Без UI'],
    ratings: null,
    notes: null,
    components: [
      'Кастомный компонент CustomTooltip (исходный код в src/)',
      'Автоматический flip и shift через middleware',
      'Portal-рендеринг (FloatingPortal)',
    ],
  },
]

// ─── Per-tab color palette (static strings для Tailwind JIT) ─────────────────
const PALETTE = {
  baseline: {
    tabActive:   'bg-slate-700 text-white shadow',
    tabInactive: 'text-slate-600 hover:bg-slate-100',
    bannerBg:    'bg-slate-50 border-slate-200',
    titleColor:  'text-slate-800',
    textColor:   'text-slate-600',
    badge:       'bg-slate-100 text-slate-600',
    tourBtn:     'bg-slate-600 hover:bg-slate-700 text-white',
    starFilled:  'text-slate-500 fill-slate-500',
    cardBorder:  'border-slate-200',
  },
  introjs: {
    tabActive:   'bg-amber-500 text-white shadow',
    tabInactive: 'text-amber-700 hover:bg-amber-50',
    bannerBg:    'bg-amber-50 border-amber-200',
    titleColor:  'text-amber-900',
    textColor:   'text-amber-800',
    badge:       'bg-amber-100 text-amber-700',
    tourBtn:     'bg-amber-500 hover:bg-amber-600 text-white',
    starFilled:  'text-amber-400 fill-amber-400',
    cardBorder:  'border-amber-200',
  },
  shepherd: {
    tabActive:   'bg-emerald-600 text-white shadow',
    tabInactive: 'text-emerald-700 hover:bg-emerald-50',
    bannerBg:    'bg-emerald-50 border-emerald-200',
    titleColor:  'text-emerald-900',
    textColor:   'text-emerald-800',
    badge:       'bg-emerald-100 text-emerald-700',
    tourBtn:     'bg-emerald-600 hover:bg-emerald-700 text-white',
    starFilled:  'text-emerald-500 fill-emerald-500',
    cardBorder:  'border-emerald-200',
  },
  driver: {
    tabActive:   'bg-violet-600 text-white shadow',
    tabInactive: 'text-violet-700 hover:bg-violet-50',
    bannerBg:    'bg-violet-50 border-violet-200',
    titleColor:  'text-violet-900',
    textColor:   'text-violet-800',
    badge:       'bg-violet-100 text-violet-700',
    tourBtn:     'bg-violet-600 hover:bg-violet-700 text-white',
    starFilled:  'text-violet-500 fill-violet-500',
    cardBorder:  'border-violet-200',
  },
  joyride: {
    tabActive:   'bg-blue-600 text-white shadow',
    tabInactive: 'text-blue-700 hover:bg-blue-50',
    bannerBg:    'bg-blue-50 border-blue-200',
    titleColor:  'text-blue-900',
    textColor:   'text-blue-800',
    badge:       'bg-blue-100 text-blue-700',
    tourBtn:     'bg-blue-600 hover:bg-blue-700 text-white',
    starFilled:  'text-blue-500 fill-blue-500',
    cardBorder:  'border-blue-200',
  },
  about: {
    tabActive:   'bg-gray-800 text-white shadow',
    tabInactive: 'text-gray-600 hover:bg-gray-100',
    bannerBg:    'bg-gray-50 border-gray-200',
    titleColor:  'text-gray-900',
    textColor:   'text-gray-700',
    badge:       'bg-gray-100 text-gray-600',
    tourBtn:     'bg-gray-700 hover:bg-gray-800 text-white',
    starFilled:  'text-gray-500 fill-gray-500',
    cardBorder:  'border-gray-200',
  },
  legacy: {
    tabActive:   'bg-gray-500 text-white shadow',
    tabInactive: 'text-gray-500 hover:bg-gray-100',
    bannerBg:    'bg-gray-50 border-gray-200',
    titleColor:  'text-gray-900',
    textColor:   'text-gray-700',
    badge:       'bg-gray-100 text-gray-600',
    tourBtn:     'bg-gray-500 hover:bg-gray-600 text-white',
    starFilled:  'text-gray-400 fill-gray-400',
    cardBorder:  'border-gray-200',
  },
  tippy: {
    tabActive:   'bg-orange-500 text-white shadow',
    tabInactive: 'text-orange-700 hover:bg-orange-50',
    bannerBg:    'bg-orange-50 border-orange-200',
    titleColor:  'text-orange-900',
    textColor:   'text-orange-800',
    badge:       'bg-orange-100 text-orange-700',
    tourBtn:     'bg-orange-500 hover:bg-orange-600 text-white',
    starFilled:  'text-orange-400 fill-orange-400',
    cardBorder:  'border-orange-200',
  },
  custom: {
    tabActive:   'bg-violet-600 text-white shadow',
    tabInactive: 'text-violet-700 hover:bg-violet-50',
    bannerBg:    'bg-violet-50 border-violet-200',
    titleColor:  'text-violet-900',
    textColor:   'text-violet-800',
    badge:       'bg-violet-100 text-violet-700',
    tourBtn:     'bg-violet-600 hover:bg-violet-700 text-white',
    starFilled:  'text-violet-500 fill-violet-500',
    cardBorder:  'border-violet-200',
  },
}

// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ value, max = 5, filledClass }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} из ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={15}
          className={i < value ? filledClass : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  )
}

// ─── NoteCard ─────────────────────────────────────────────────────────────────
function NoteCard({ criterion, rating, note, filledClass, borderClass }) {
  return (
    <div className={`bg-white rounded-xl border ${borderClass} p-4 flex flex-col gap-2`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{criterion}</p>
      <StarRating value={rating} filledClass={filledClass} />
      <p className="text-sm text-gray-600 leading-snug">{note}</p>
    </div>
  )
}

// ─── LibraryBanner ────────────────────────────────────────────────────────────
function LibraryBanner({ tab, palette, onStartTour, onStartExtra }) {
  return (
    <div className={`rounded-2xl border ${palette.bannerBg} p-4 sm:p-5`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Info size={15} className={palette.titleColor} />
            <h2 className={`text-sm font-bold ${palette.titleColor}`}>{tab.bannerTitle ?? tab.label}</h2>
          </div>
          <p className={`text-sm leading-relaxed ${palette.textColor} mb-3`}>
            {tab.description}
          </p>
          {/* Extra component description */}
          {tab.hasExtra && tab.extraDesc && (
            <p className={`text-xs leading-relaxed ${palette.textColor} mb-3 opacity-80`}>
              <BookOpen size={12} className="inline mr-1 mb-0.5" />
              <strong>Доп. компонент:</strong> {tab.extraDesc}
            </p>
          )}
          {/* Implemented components list (Tippy, Custom tabs) */}
          {tab.components && tab.components.length > 0 && (
            <ul className={`text-xs leading-relaxed ${palette.textColor} mb-3 space-y-0.5`}>
              {tab.components.map((c) => (
                <li key={c} className="flex items-center gap-1.5">
                  <span className="text-green-500 font-bold">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-1.5">
            {tab.tags.map((tag) => (
              <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-medium ${palette.badge}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right: buttons */}
        {tab.hasTour && (
          <div className="shrink-0 flex flex-col gap-2">
            <button
              type="button"
              onClick={onStartTour}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm ${palette.tourBtn}`}
            >
              <Play size={14} className="fill-current" />
              Запустить тур
            </button>
            {tab.hasExtra && tab.extraLabel && (
              <button
                type="button"
                onClick={onStartExtra}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors border ${palette.badge} border-current opacity-80 hover:opacity-100`}
              >
                <BookOpen size={13} />
                {tab.extraLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ComparisonNotes ──────────────────────────────────────────────────────────
function ComparisonNotes({ tab, palette }) {
  if (!tab.ratings) return null

  const criteria = [
    {
      key: 'integration',
      label: 'Простота интеграции',
      rating: tab.ratings.integration,
      note: tab.notes.integration,
    },
    {
      key: 'positioning',
      label: 'Качество позиционирования',
      rating: tab.ratings.positioning,
      note: tab.notes.positioning,
    },
    {
      key: 'suitability',
      label: 'Подходит для расчётного ПО',
      rating: tab.ratings.suitability,
      note: tab.notes.suitability,
    },
  ]

  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Star size={15} className="text-amber-400 fill-amber-400" />
        Заметки для сравнения
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {criteria.map((c) => (
          <NoteCard
            key={c.key}
            criterion={c.label}
            rating={c.rating}
            note={c.note}
            filledClass={palette.starFilled}
            borderClass={palette.cardBorder}
          />
        ))}
      </div>
    </section>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeId, setActiveId] = useState('about')

  // Shared refs populated by the active AdvancedTractionCalculator instance
  const tourRef        = useRef(null)
  const extraActionRef = useRef(null)

  const activeTab     = TABS.find((t) => t.id === activeId)
  const activePalette = PALETTE[activeId]

  const handleStartTour = useCallback(() => {
    if (tourRef.current?.start) {
      tourRef.current.start()
    } else {
      alert(`Тур «${activeTab.label}» будет реализован на следующем этапе.`)
    }
  }, [activeTab])

  const handleStartExtra = useCallback(() => {
    if (extraActionRef.current?.start) {
      extraActionRef.current.start()
    }
  }, [])

  // Ctrl+T keyboard shortcut to start tour
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 't' && activeTab.hasTour) {
        e.preventDefault()
        if (tourRef.current?.start) tourRef.current.start()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeTab])

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="bg-blue-600 rounded-xl p-2 shrink-0">
            <Train className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              Railway Onboard Demo
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              Тяговые расчёты · Сравнение библиотек онбординга
            </p>
          </div>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[57px] z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Horizontally scrollable on mobile */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2" role="tablist" aria-label="Режимы онбординга">
            {TABS.map((tab) => {
              const isActive = tab.id === activeId
              const p = PALETTE[tab.id]
              return (
                <div key={tab.id} className="flex items-center">
                  <button
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveId(tab.id)}
                    className={`whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                      isActive ? p.tabActive : p.tabInactive
                    }`}
                  >
                    {tab.isAbout && <BookOpen size={13} />}
                    {tab.isLegacy && <AlertTriangle size={13} />}
                    {tab.label}
                  </button>
                  {(tab.isAbout || tab.isLegacy) && (
                    <div className="w-px h-5 bg-gray-200 self-center ml-2 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <main
        id={`panel-${activeId}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeId}`}
        className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
      >
        {activeTab.isAbout ? (
          /* ── About page ── */
          <ErrorBoundary>
            <Suspense fallback={<div className="py-20 text-center text-sm text-gray-400">Загрузка…</div>}>
              <AboutPage />
            </Suspense>
          </ErrorBoundary>
        ) : activeTab.isLegacy ? (
          /* ── Legacy tab ── */
          <LegacyCalculator key="legacy" />
        ) : (
          /* ── Calculator tabs ── */
          <>
            {/* Library info banner */}
            <div className="mb-6">
              <LibraryBanner
                tab={activeTab}
                palette={activePalette}
                onStartTour={handleStartTour}
                onStartExtra={handleStartExtra}
              />
            </div>

            {/* Calculator — re-mounts on tab switch to reset form + tour state */}
            <AdvancedTractionCalculator key={activeId} onboardingLib={activeId} tourRef={tourRef} extraActionRef={extraActionRef} />

            {/* Comparison notes (hidden for baseline) */}
            <ComparisonNotes tab={activeTab} palette={activePalette} />
          </>
        )}
      </main>
    </div>
  )
}
