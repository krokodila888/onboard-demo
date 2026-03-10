import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TOTAL = 7

/** Inject/update the progress bar inside the current step element */
function injectProgress(step) {
  const el = step.getElement()
  if (!el) return

  const idx   = step.tour.steps.indexOf(step)
  const total = step.tour.steps.length
  const pct   = Math.round(((idx + 1) / total) * 100)
  const label = `Шаг ${idx + 1} из ${total}`

  // Remove previous bar to avoid duplicates on back/forward
  el.querySelector('.shp-progress')?.remove()

  const wrap = document.createElement('div')
  wrap.className = 'shp-progress'
  wrap.innerHTML = `
    <div class="shp-progress__track">
      <div class="shp-progress__fill" style="width:${pct}%"></div>
    </div>
    <span class="shp-progress__label">${label}</span>
  `

  const footer = el.querySelector('.shepherd-footer')
  if (footer) footer.before(wrap)
}

/** Standard button set for each step */
function buttons(tour, idx) {
  const btns = []

  // Skip — always first
  btns.push({
    text: 'Пропустить',
    secondary: true,
    action() { tour.cancel() },
  })

  // Back — from step 2 onward
  if (idx > 0) {
    btns.push({
      text: '← Назад',
      secondary: true,
      action() { tour.back() },
    })
  }

  // Next / Finish
  btns.push(
    idx < TOTAL - 1
      ? { text: 'Далее →', action() { tour.next() } }
      : { text: 'Завершить ✓', action() { tour.complete() } },
  )

  return btns
}

// ─── Step definitions ─────────────────────────────────────────────────────────
// attachTo targets always-present DOM elements (data-step or id selectors).
// Results container [data-step="5"] is always rendered (shows EmptyState or table).
function stepDefs(tour) {
  return [
    // 1 — Welcome (centred, no anchor)
    {
      id: 'welcome',
      title: 'Тяговый калькулятор',
      text: `
        <p>Этот интерактивный тур познакомит вас с основными элементами
        калькулятора тяговых характеристик поезда.</p>
        <p>Библиотека: <strong>Shepherd.js</strong> — гибкий тур с Floating UI.</p>
      `,
      buttons: buttons(tour, 0),
      when: { show() { injectProgress(this) } },
    },

    // 2 — Locomotive type
    {
      id: 'locomotive-type',
      title: '🚂 Тип локомотива',
      text: `
        <p>Выберите серию локомотива из выпадающего списка.</p>
        <p>Тип определяет <strong>располагаемую силу тяги</strong>, мощность
        и собственную массу, которые используются в расчёте.</p>
      `,
      attachTo: { element: '[data-step="1"]', on: 'right' },
      scrollTo: { behavior: 'smooth', block: 'center' },
      modalOverlayOpeningPadding: 6,
      modalOverlayOpeningRadius: 8,
      buttons: buttons(tour, 1),
      when: { show() { injectProgress(this) } },
    },

    // 3 — Train mass
    {
      id: 'train-mass',
      title: '⚖️ Масса состава',
      text: `
        <p>Введите массу вагонного состава <strong>без локомотива</strong> в тоннах.</p>
        <p>Типовые грузовые поезда: <strong>3 000–6 000 т</strong>.</p>
      `,
      attachTo: { element: '[data-step="2"]', on: 'right' },
      scrollTo: { behavior: 'smooth', block: 'center' },
      modalOverlayOpeningPadding: 6,
      modalOverlayOpeningRadius: 8,
      buttons: buttons(tour, 2),
      when: { show() { injectProgress(this) } },
    },

    // 4 — Gradient
    {
      id: 'gradient',
      title: '📐 Расчётный уклон',
      text: `
        <p>Руководящий подъём пути в <strong>промилле (‰)</strong>.</p>
        <p>«+» — подъём, «−» — спуск. Типичные значения: <strong>6–12 ‰</strong>.
        Именно уклон чаще всего является лимитирующим фактором для массы поезда.</p>
      `,
      attachTo: { element: '[data-step="3"]', on: 'right' },
      scrollTo: { behavior: 'smooth', block: 'center' },
      modalOverlayOpeningPadding: 6,
      modalOverlayOpeningRadius: 8,
      buttons: buttons(tour, 3),
      when: { show() { injectProgress(this) } },
    },

    // 5 — Speed
    {
      id: 'speed',
      title: '⚡ Расчётная скорость',
      text: `
        <p>Скорость движения в км/ч влияет на
        <strong>удельное основное сопротивление</strong> состава (w″₀)
        и на потребляемую мощность локомотива.</p>
        <p>Формула: <em>w″₀ = 0.7 + 3/v + 0.0003·v²</em></p>
      `,
      attachTo: { element: '#speed', on: 'right' },
      scrollTo: { behavior: 'smooth', block: 'center' },
      modalOverlayOpeningPadding: 6,
      modalOverlayOpeningRadius: 8,
      buttons: buttons(tour, 4),
      when: { show() { injectProgress(this) } },
    },

    // 6 — Calculate button
    {
      id: 'calculate-btn',
      title: '🧮 Запуск расчёта',
      text: `
        <p>Нажмите <strong>«Рассчитать»</strong> для выполнения тягового расчёта
        по формулам ПТР.</p>
        <p>Перед расчётом введённые данные автоматически проверяются.</p>
      `,
      attachTo: { element: '[data-step="4"]', on: 'top' },
      scrollTo: { behavior: 'smooth', block: 'center' },
      modalOverlayOpeningPadding: 6,
      modalOverlayOpeningRadius: 8,
      buttons: buttons(tour, 5),
      when: { show() { injectProgress(this) } },
    },

    // 7 — Results area
    {
      id: 'results',
      title: '📊 Таблица результатов',
      text: `
        <p>После расчёта здесь появляется таблица с результатами:
        массы, удельные сопротивления, требуемая и располагаемая сила тяги, мощность.</p>
        <p><strong>Зелёный</strong> баннер — тяговые условия выполнены.
        <strong>Красный</strong> — нет.</p>
      `,
      attachTo: { element: '[data-step="5"]', on: 'left' },
      scrollTo: { behavior: 'smooth', block: 'center' },
      modalOverlayOpeningPadding: 6,
      modalOverlayOpeningRadius: 8,
      buttons: buttons(tour, 6),
      when: { show() { injectProgress(this) } },
    },
  ]
}

// ─── Factory ──────────────────────────────────────────────────────────────────
/**
 * Create and configure a Shepherd tour instance.
 * @param {{ onComplete?: () => void, onCancel?: () => void }} callbacks
 * @returns {import('shepherd.js').Tour}
 */
export function createShepherdTour({ onComplete, onCancel } = {}) {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      classes: 'shp-custom',
      floatingUIOptions: {
        middleware: [], // use Shepherd defaults
      },
    },
  })

  stepDefs(tour).forEach((def) => tour.addStep(def))

  if (onCancel)   tour.on('cancel',   onCancel)
  if (onComplete) tour.on('complete', onComplete)

  return tour
}

// ─── Instruction tour factory ─────────────────────────────────────────────────
/**
 * A 3-step instruction mini-tour that explains how to do the calculation.
 * Steps 1–2 are centred modals (no attachTo); step 3 is anchored to the
 * "Рассчитать базовые параметры" button.
 *
 * @param {{ onComplete?: () => void, onCancel?: () => void }} callbacks
 * @returns {import('shepherd.js').Tour}
 */
export function createShepherdInstructionTour({ onComplete, onCancel } = {}) {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      classes: 'shp-custom shp-instruction',
    },
  })

  function btns(idx) {
    const total = 3
    const list = []
    list.push({ text: 'Закрыть', secondary: true, action() { tour.cancel() } })
    if (idx > 0) list.push({ text: '← Назад', secondary: true, action() { tour.back() } })
    list.push(
      idx < total - 1
        ? { text: 'Далее →', action() { tour.next() } }
        : { text: 'Понятно ✓', action() { tour.complete() } },
    )
    return list
  }

  // Step 1 — centred modal: three phases overview
  tour.addStep({
    id: 'instr-overview',
    title: '📋 Как выполнить тяговый расчёт',
    text: `
      <p>Расчёт выполняется в три последовательных этапа:</p>
      <ol style="margin-top:10px;padding-left:20px;list-style:decimal;line-height:1.8">
        <li><strong>Базовые параметры</strong> — выберите локомотив и введите массу состава</li>
        <li><strong>Тяговые характеристики</strong> — задайте уклон и условия движения; строится график F(v)</li>
        <li><strong>Эксплуатационные показатели</strong> — учёт среды, экономика поездки</li>
      </ol>
      <p style="margin-top:8px;font-size:11px;color:#6b7280">Каждый шаг разблокируется только после завершения предыдущего.</p>
    `,
    buttons: btns(0),
    when: { show() { injectProgress(this) } },
  })

  // Step 2 — centred modal: common mistakes
  tour.addStep({
    id: 'instr-mistakes',
    title: '⚠️ Типичные ошибки новичков',
    text: `
      <ul style="padding:0;list-style:none;margin:0;line-height:1.7">
        <li style="display:flex;gap:8px;margin-bottom:6px">
          <span style="color:#ef4444;font-weight:700">✕</span>
          <span>Путаница с единицами: масса — <strong>тонны</strong>, уклон — <strong>промилле (‰)</strong>, сила — <strong>кН</strong></span>
        </li>
        <li style="display:flex;gap:8px;margin-bottom:6px">
          <span style="color:#ef4444;font-weight:700">✕</span>
          <span>Масса локомотива <em>не включается</em> в поле «Масса состава»</span>
        </li>
        <li style="display:flex;gap:8px;margin-bottom:6px">
          <span style="color:#ef4444;font-weight:700">✕</span>
          <span>Нельзя перейти к Шагу 2, не выполнив расчёт Шага 1</span>
        </li>
        <li style="display:flex;gap:8px">
          <span style="color:#ef4444;font-weight:700">✕</span>
          <span>Отрицательный уклон означает <em>спуск</em> — знак числа важен</span>
        </li>
      </ul>
    `,
    buttons: btns(1),
    when: { show() { injectProgress(this) } },
  })

  // Step 3 — anchored to the Step-1 calculate button
  tour.addStep({
    id: 'instr-start-here',
    title: '▶ Начните здесь',
    text: `
      <p>Введите тип локомотива и массу состава, затем нажмите эту кнопку,
      чтобы завершить Шаг 1 и открыть расчёт тяговых характеристик.</p>
    `,
    attachTo: { element: '#calculate-step1-btn', on: 'top' },
    scrollTo: { behavior: 'smooth', block: 'center' },
    modalOverlayOpeningPadding: 6,
    modalOverlayOpeningRadius: 8,
    buttons: btns(2),
    when: { show() { injectProgress(this) } },
  })

  if (onCancel)   tour.on('cancel',   onCancel)
  if (onComplete) tour.on('complete', onComplete)

  return tour
}
