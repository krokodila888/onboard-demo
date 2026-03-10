import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  // 1 — Welcome (no element → centred dialog)
  {
    popover: {
      title: 'Тяговый калькулятор',
      description: `
        <p>Добро пожаловать! Этот тур проведёт вас по основным
        элементам калькулятора тяговых характеристик поезда.</p>
        <p>Библиотека: <strong>Driver.js</strong> — spotlight-тур
        с минималистичным дизайном.</p>
      `,
      side: 'over',
      align: 'center',
    },
  },

  // 2 — Тип локомотива
  {
    element: '#locomotive-type',
    popover: {
      title: 'Тип локомотива',
      description: `
        <p>Выберите серию из выпадающего списка. Каждый локомотив
        имеет свои <strong>силу тяги</strong>, мощность и массу,
        которые участвуют в расчёте.</p>
      `,
      side: 'right',
      align: 'start',
    },
  },

  // 3 — Масса локомотива
  {
    element: '#loco-mass',
    popover: {
      title: 'Масса локомотива',
      description: `
        <p>Показывает собственную массу выбранного локомотива в тоннах.
        Типичный диапазон: <strong>50–300 т</strong>.</p>
        <p>Учитывается при расчёте общей массы поезда и сил
        сопротивления движению.</p>
      `,
      side: 'right',
      align: 'start',
    },
  },

  // 4 — Масса состава
  {
    element: '#train-mass',
    popover: {
      title: 'Масса состава',
      description: `
        <p>Полная масса вагонов <strong>без локомотива</strong> в тоннах.</p>
        <p>Грузовые поезда: <strong>1 000–9 000 т</strong>,
        пассажирские: 600–1 200 т.</p>
      `,
      side: 'right',
      align: 'start',
    },
  },

  // 5 — Расчётный уклон
  {
    element: '#gradient',
    popover: {
      title: 'Расчётный уклон',
      description: `
        <p>Руководящий подъём пути в <strong>промилле (‰)</strong>.
        «+» — подъём, «−» — спуск.</p>
        <p>Уклон — главный лимитирующий фактор для массы поезда.
        Типовые значения: <strong>6–12 ‰</strong>.</p>
      `,
      side: 'right',
      align: 'start',
    },
  },

  // 6 — Кнопка расчёта
  {
    element: '#calculate-btn',
    popover: {
      title: 'Запуск расчёта',
      description: `
        <p>Нажмите <strong>«Рассчитать»</strong>, чтобы выполнить
        тяговый расчёт по формулам ПТР. Данные валидируются
        автоматически перед расчётом.</p>
      `,
      side: 'top',
      align: 'center',
    },
  },

  // 7 — Результаты
  {
    element: '[data-step="5"]',
    popover: {
      title: 'Таблица результатов',
      description: `
        <p>После расчёта здесь появятся: массы, удельные сопротивления,
        требуемые и располагаемые сила тяги и мощность.</p>
        <p><strong>Зелёный</strong> баннер — условия выполнены.
        <strong>Красный</strong> — сила тяги недостаточна.</p>
      `,
      side: 'left',
      align: 'start',
    },
  },
]

// ─── onPopoverRender ──────────────────────────────────────────────────────────
// Добавляет акцентную полосу вверху каждого popover-а и
// инъектирует HTML в description (Driver.js по умолчанию — plaintext).
function handlePopoverRender(popover, { state, driver: d }) {
  // Разрешить HTML в description
  const raw = state.activeStep?.popover?.description ?? ''
  popover.description.innerHTML = raw

  // Акцентная полоса (violet) над заголовком
  if (!popover.wrapper.querySelector('.drvr-accent')) {
    const accent = document.createElement('div')
    accent.className = 'drvr-accent'
    popover.wrapper.prepend(accent)
  }

  // Прогресс-текст: кастомный формат
  const idx   = d.getActiveIndex() ?? 0
  const total = (d.getConfig().steps ?? STEPS).length
  popover.progress.textContent = `Шаг ${idx + 1} из ${total}`
}

// ─── Factory ──────────────────────────────────────────────────────────────────
/**
 * Returns a `startTour()` function that creates and starts a Driver.js tour.
 *
 * @param {{ onDestroyed?: Function }} callbacks
 * @returns {() => void}
 */
export function createDriverTour({ onDestroyed } = {}) {
  let driverInstance = null

  function startTour() {
    // Destroy any previous instance
    driverInstance?.destroy()

    driverInstance = driver({
      steps: STEPS,

      // Global labels
      nextBtnText:  'Далее →',
      prevBtnText:  '← Назад',
      doneBtnText:  'Готово ✓',

      // Progress
      showProgress: true,
      progressText: '{{current}} / {{total}}',

      // UX
      animate:              true,
      smoothScroll:         true,
      allowClose:           true,
      allowKeyboardControl: true,
      overlayOpacity:       0.65,
      overlayColor:         '#000',

      // Spotlight styling
      stagePadding: 8,
      stageRadius:  10,

      // Custom CSS class added to every popover
      popoverClass: 'drvr-custom',

      // ── Hooks ────────────────────────────────────────────────────────────
      onPopoverRender: handlePopoverRender,

      onDestroyed: (element, step, { state, driver: d }) => {
        const idx = d.getActiveIndex()
        const isLast = d.isLastStep?.() ?? false
        console.log(
          `[Driver.js] Тур завершён. Последний активный шаг: ${(idx ?? 0) + 1}`,
          { element, isLast },
        )
        onDestroyed?.({ element, step, state })
      },
    })

    driverInstance.drive()
  }

  /** Programmatic cleanup (called from useEffect cleanup) */
  function destroyTour() {
    driverInstance?.destroy()
    driverInstance = null
  }

  return { startTour, destroyTour }
}

// ─── Highlight factory ────────────────────────────────────────────────────────
/**
 * Returns `{ triggerHighlight, destroyHighlight }`.
 * `triggerHighlight()` spotlights the Step-2 panel with a single-element
 * highlight (not a full tour). A "Понятно" button closes it.
 *
 * @returns {{ triggerHighlight: () => void, destroyHighlight: () => void }}
 */
export function createDriverHighlight() {
  let instance = null

  function triggerHighlight() {
    instance?.destroy()

    // Capture in closure so the OK-button click can destroy it
    let d

    d = driver({
      allowClose: true,
      overlayOpacity: 0.45,
      stagePadding: 10,
      stageRadius: 12,
      popoverClass: 'drvr-custom drvr-highlight',

      onPopoverRender(popover) {
        // Enable HTML in description
        popover.description.innerHTML = `
          <p>Теперь доступен расчёт тяговых характеристик.</p>
          <p style="margin-top:6px">Введите уклон пути и нажмите <strong>«Рассчитать тяговые характеристики»</strong>.</p>
        `
        // Replace default footer with a single "Понятно" button
        const footer = popover.wrapper.querySelector('.driver-popover-footer')
        if (footer) {
          footer.innerHTML = ''
          const btn = document.createElement('button')
          btn.id = 'driver-highlight-ok-btn'
          btn.textContent = 'Понятно'
          btn.addEventListener('click', () => d?.destroy())
          footer.appendChild(btn)
        }
        // Remove close ×
        const closeBtn = popover.wrapper.querySelector('.driver-popover-close-btn')
        if (closeBtn) closeBtn.style.display = 'none'
      },

      onDestroyed() {
        instance = null
      },
    })

    instance = d

    d.highlight({
      element: '[data-onboarding-step="2"]',
      popover: {
        title: '✅ Шаг 1 выполнен!',
        description: '',
        side: 'top',
        align: 'center',
      },
    })
  }

  function destroyHighlight() {
    instance?.destroy()
    instance = null
  }

  return { triggerHighlight, destroyHighlight }
}
