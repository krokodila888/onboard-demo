// ─── React Joyride step definitions ──────────────────────────────────────────
// Each step targets an element by CSS selector (`target` field).
// `content` supports JSX — passed through as React nodes in TractionCalculator.

/**
 * Returns the step array for React Joyride.
 * Called at tour-start time so DOM elements are guaranteed to exist.
 */
export const JOYRIDE_STEPS = [
  // 1 — Welcome (targets body → centred dialog via placement:'center')
  {
    target: 'body',
    placement: 'center',
    title: 'Тяговый калькулятор',
    content: (
      <>
        <p>Добро пожаловать! Этот тур познакомит вас с основными элементами
        калькулятора тяговых характеристик поезда.</p>
        <p style={{ marginTop: 6 }}>
          Библиотека: <strong>React Joyride</strong> — компонентный тур,
          нативно интегрированный в React.
        </p>
      </>
    ),
    disableBeacon: true,
  },

  // 2 — Тип локомотива
  {
    target: '#locomotive-type',
    placement: 'right',
    title: 'Тип локомотива',
    content: (
      <>
        <p>Выберите серию электровоза или тепловоза из выпадающего списка.</p>
        <p>Каждый локомотив имеет собственные <strong>силу тяги</strong>,
        мощность и массу, которые участвуют в расчёте.</p>
      </>
    ),
    disableBeacon: true,
  },

  // 3 — Масса локомотива (SpecChip)
  {
    target: '#loco-mass',
    placement: 'right',
    title: 'Масса локомотива',
    content: (
      <>
        <p>Показывает собственную массу выбранного локомотива в тоннах.</p>
        <p>Типичный диапазон: <strong>50–300 т</strong>.
        Учитывается при расчёте общей массы поезда и сил сопротивления.</p>
      </>
    ),
    disableBeacon: true,
  },

  // 4 — Масса состава
  {
    target: '#train-mass',
    placement: 'right',
    title: 'Масса состава',
    content: (
      <>
        <p>Введите полную массу вагонного состава <strong>без локомотива</strong> в тоннах.</p>
        <p>Грузовые поезда: <strong>1 000–9 000 т</strong>,
        пассажирские: 600–1 200 т.</p>
      </>
    ),
    disableBeacon: true,
  },

  // 5 — Расчётный уклон
  {
    target: '#gradient',
    placement: 'right',
    title: 'Расчётный уклон',
    content: (
      <>
        <p>Укажите крутизну расчётного подъёма в <strong>промилле (‰)</strong>.</p>
        <p>«+» — подъём, «−» — спуск.
        Уклон — главный ограничивающий фактор массы поезда.
        Типовые значения: <strong>6–12 ‰</strong>.</p>
      </>
    ),
    disableBeacon: true,
  },

  // 6 — Кнопка расчёта
  {
    target: '#calculate-btn',
    placement: 'top',
    title: 'Запуск расчёта',
    content: (
      <>
        <p>Нажмите <strong>«Рассчитать»</strong>, чтобы выполнить тяговый расчёт
        по формулам ПТР. Данные валидируются автоматически перед расчётом.</p>
      </>
    ),
    disableBeacon: true,
  },

  // 7 — Результаты
  {
    target: '[data-step="5"]',
    placement: 'left',
    title: 'Таблица результатов',
    content: (
      <>
        <p>После расчёта здесь появятся: массы, удельные сопротивления,
        требуемые и располагаемые сила тяги и мощность.</p>
        <p><strong style={{ color: '#16a34a' }}>Зелёный</strong> баннер — условия выполнены.{' '}
        <strong style={{ color: '#dc2626' }}>Красный</strong> — сила тяги недостаточна.</p>
      </>
    ),
    disableBeacon: true,
  },
]
