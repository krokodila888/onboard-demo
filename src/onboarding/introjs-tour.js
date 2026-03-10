import introJs from 'intro.js'
import 'intro.js/introjs.css'

// ─── localStorage key ─────────────────────────────────────────────────────────
const STORAGE_KEY = 'introjs-tour-progress'

// ─── Step definitions ─────────────────────────────────────────────────────────
// Elements are resolved at call-time (inside startTour()) to guarantee they
// exist in the DOM when the tour starts.
function buildSteps() {
  return [
    // 1 — Тип локомотива
    {
      element: document.querySelector('#locomotive-type'),
      title: '🚂 Тип локомотива',
      intro: `
        <p>Выберите серию электровоза или тепловоза из выпадающего списка.</p>
        <p>Каждый локомотив имеет собственные <strong>силу тяги</strong>,
        мощность и массу, которые участвуют в тяговом расчёте.</p>
      `,
      position: 'right',
      scrollTo: 'element',
    },

    // 2 — Масса локомотива (отображается в чипах под селектором)
    {
      element: document.querySelector('#loco-mass'),
      title: '⚖️ Масса локомотива',
      intro: `
        <p>Показывает собственную массу выбранного локомотива в тоннах.</p>
        <p>Типичный диапазон: <strong>50–300 т</strong>.
        Масса локомотива учитывается при расчёте общей массы поезда
        и сил сопротивления движению.</p>
      `,
      position: 'right',
      scrollTo: 'element',
    },

    // 3 — Масса состава
    {
      element: document.querySelector('#train-mass'),
      title: '🚃 Масса состава',
      intro: `
        <p>Введите полную массу вагонного состава <strong>без локомотива</strong>
        в тоннах.</p>
        <p>Ориентир: грузовые поезда — <strong>1 000–9 000 т</strong>,
        пассажирские — 600–1 200 т.</p>
      `,
      position: 'right',
      scrollTo: 'element',
    },

    // 4 — Расчётный уклон
    {
      element: document.querySelector('#gradient'),
      title: '📐 Руководящий подъём',
      intro: `
        <p>Укажите крутизну расчётного подъёма в <strong>промилле (‰)</strong>.</p>
        <p>«+» — подъём, «−» — спуск.
        Именно уклон чаще всего ограничивает допустимую массу поезда.
        Типовые значения: <strong>6–12 ‰</strong>.</p>
      `,
      position: 'right',
      scrollTo: 'element',
    },

    // 5 — Кнопка расчёта
    {
      element: document.querySelector('#calculate-btn'),
      title: '🧮 Нажмите для расчёта',
      intro: `
        <p>После заполнения всех полей нажмите эту кнопку, чтобы выполнить
        тяговый расчёт по формулам <strong>ПТР</strong>
        (Правила тяговых расчётов).</p>
        <p>Данные автоматически проверяются перед расчётом.</p>
      `,
      position: 'top',
      scrollTo: 'element',
    },

    // 6 — Область результатов
    {
      element: document.querySelector('[data-step="5"]'),
      title: '📊 Результаты расчёта',
      intro: `
        <p>Здесь отобразятся результаты — таблица с массами, удельными
        сопротивлениями, силами тяги и потребляемой мощностью.</p>
        <p><strong>Зелёный</strong> баннер = тяговые условия выполнены.<br>
        <strong>Красный</strong> = сила тяги недостаточна.</p>
      `,
      position: 'left',
      scrollTo: 'element',
    },

    // 7 — Финальный шаг (без привязки к элементу — центрированное окно)
    {
      element: null,
      title: '✅ Тур завершён!',
      intro: `
        <p>Вы познакомились со всеми основными элементами калькулятора
        тяговых характеристик поезда.</p>
        <p>Попробуйте сменить тип локомотива или изменить уклон —
        и нажмите <strong>«Рассчитать»</strong>, чтобы увидеть,
        как меняется запас тяги.</p>
        <p style="margin-top:8px;font-size:11px;color:#9ca3af">
          Библиотека: Intro.js v8 — классический пошаговый тур.
        </p>
      `,
      scrollTo: 'off',
    },
  ]
}

// ─── Factory ──────────────────────────────────────────────────────────────────
/**
 * Returns a `startTour` function that creates and starts an Intro.js tour.
 * Called on demand so DOM elements are queried at start time.
 *
 * @param {{ onComplete?: Function, onExit?: Function }} callbacks
 * @returns {() => void}
 */
export function createIntrojsTour({ onComplete, onExit } = {}) {
  function startTour() {
    const tour = introJs()

    tour.setOptions({
      steps: buildSteps(),

      // Labels (Russian)
      nextLabel:  'Далее →',
      prevLabel:  '← Назад',
      skipLabel:  'Пропустить',
      doneLabel:  'Готово ✓',

      // UX
      showProgress:       true,
      showBullets:        false,
      showStepNumbers:    false,
      exitOnOverlayClick: false,
      exitOnEsc:          true,
      keyboardNavigation: true,

      // Scroll
      scrollToElement: true,
      scrollPadding:   60,

      // Style
      overlayOpacity:      0.65,
      helperElementPadding: 8,
      tooltipClass:        'introjs-custom',
      tooltipRenderAsHtml: true,
      disableInteraction:  false,
    })

    // ── oncomplete: alert + localStorage ─────────────────────────────────
    tour.oncomplete(function () {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ completed: true, timestamp: new Date().toISOString() }),
      )
      alert('✅ Тур завершён! Результаты сохранены.')
      onComplete?.()
    })

    // ── onexit: save current step progress ───────────────────────────────
    // Called when user clicks Skip / presses Esc (but NOT when tour completes)
    tour.onexit(function () {
      const step = this.getCurrentStep() ?? 0
      const saved = {
        completed: false,
        step,
        stepLabel: buildSteps()[step]?.title ?? '',
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      console.log(`[Intro.js] Тур прерван на шаге ${step + 1}. Прогресс сохранён.`, saved)
      onExit?.(step)
    })

    tour.start()
  }

  return startTour
}

/** Read saved progress from localStorage (for debugging / resume) */
export function getIntrojsProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
  } catch {
    return null
  }
}

// ─── Hints factory ────────────────────────────────────────────────────────────
/**
 * Initialise Intro.js Hints on 3 technical fields of the calculator.
 * Returns the introJs instance so the caller can call .showHints() /
 * .hideHints() / .removeHints() as needed.
 */
export function createIntrojsHints() {
  const hints = [
    {
      element: document.querySelector('#step1-mass'),
      hint: '<strong>Масса состава</strong><br>Масса вагонов <em>без локомотива</em> в тоннах.<br>Грузовые поезда: 1 000–9 000 т, пассажирские: 600–1 200 т.',
      hintPosition: 'top-right',
    },
    {
      element: document.querySelector('#step2-gradient'),
      hint: '<strong>Уклон (промилле, ‰)</strong><br>1 ‰ = подъём 1 м на 1 000 м пути.<br>Расчётные уклоны: 6–12 ‰. «+» — подъём, «−» — спуск.',
      hintPosition: 'top-right',
    },
    {
      element: document.querySelector('#section-advanced'),
      hint: '<strong>Коэффициенты ПТР</strong><br>Формула: w₀ = a₀ + 3/v + a₂·v²<br><em>a₀</em> = коэф. качения (норм. 0.7 Н/кН)<br><em>a₂</em> = аэродинамический коэф. (0.0003)',
      hintPosition: 'top-right',
    },
  ].filter(h => h.element !== null)

  // Intro.js v8: use introJs.hint() — introJs() is deprecated for hints
  const instance = introJs.hint()
  instance.setOptions({ hints, hintButtonLabel: 'Понятно' })
  // addHints() both adds and shows hint bubbles in v8 (showHints() was removed)
  instance.addHints()
  return instance
}
