import { useState, useEffect, useRef } from 'react'
import Joyride, { STATUS } from 'react-joyride'
import { createShepherdTour } from '../onboarding/shepherd-tour'
import { createIntrojsTour } from '../onboarding/introjs-tour'
import { createDriverTour }  from '../onboarding/driver-tour'
import { JOYRIDE_STEPS }     from '../onboarding/joyride-steps.jsx'
import Shepherd from 'shepherd.js'
import {
  HelpCircle,
  Calculator,
  CheckCircle2,
  XCircle,
  Zap,
  Weight,
  TrendingUp,
  Train,
} from 'lucide-react'

// ─── Locomotive specifications ────────────────────────────────────────────────
const LOCOMOTIVES = {
  vl80s: {
    name: 'ВЛ80С',
    fullName: 'ВЛ80С — электровоз грузовой',
    mass: 192, maxForce: 520, power: 6160, maxSpeed: 110, w0: 2.5,
  },
  vl85: {
    name: 'ВЛ85',
    fullName: 'ВЛ85 — электровоз грузовой',
    mass: 288, maxForce: 780, power: 10000, maxSpeed: 110, w0: 2.3,
  },
  te116: {
    name: '2ТЭ116',
    fullName: '2ТЭ116 — тепловоз грузовой',
    mass: 276, maxForce: 520, power: 6000, maxSpeed: 100, w0: 2.8,
  },
  chs2: {
    name: 'ЧС2',
    fullName: 'ЧС2 — электровоз пассажирский',
    mass: 123, maxForce: 230, power: 4000, maxSpeed: 160, w0: 2.0,
  },
  ep1: {
    name: 'ЭП1',
    fullName: 'ЭП1 — электровоз пассажирский',
    mass: 135, maxForce: 250, power: 4700, maxSpeed: 140, w0: 2.0,
  },
}

// ─── Calculation engine ───────────────────────────────────────────────────────
// Формулы по ПТР (Правила тяговых расчётов для поездной работы)
//   w''₀ = 0.7 + 3/v + 0.0003·v²  [Н/кН]  — удельное сопр. состава
//   W  [кН] = w₀ · m [т] · 9.81 / 1000
//   Wᵢ [кН] = i [‰] · mTotal · 9.81 / 1000
//   P  [кВт] = F_req · v / 3.6
function compute({ locomotiveType, trainMass, gradient, speed }) {
  const loco   = LOCOMOTIVES[locomotiveType]
  const mTrain = Math.max(0, parseFloat(trainMass) || 0)
  const i      = parseFloat(gradient) || 0
  const v      = Math.max(1, parseFloat(speed) || 60)
  const mTotal = loco.mass + mTrain

  const w0train  = 0.7 + 3 / v + 0.0003 * v * v
  const W_loco   = (loco.w0  * loco.mass * 9.81) / 1000
  const W_train  = (w0train  * mTrain    * 9.81) / 1000
  const W_run    = W_loco + W_train
  const W_grade  = (i * mTotal * 9.81) / 1000
  const F_req    = W_run + W_grade
  const P_req    = (F_req * v) / 3.6
  const F_reserve = loco.maxForce - F_req

  return {
    locoName:  loco.fullName,
    locoMass:  loco.mass,
    trainMass: mTrain,
    totalMass: mTotal,
    w0loco:    loco.w0.toFixed(2),
    w0train:   w0train.toFixed(2),
    W_loco:    W_loco.toFixed(1),
    W_train:   W_train.toFixed(1),
    W_run:     W_run.toFixed(1),
    W_grade:   W_grade.toFixed(1),
    F_req:     F_req.toFixed(1),
    F_avail:   loco.maxForce,
    F_reserve: F_reserve.toFixed(1),
    P_req:     P_req.toFixed(0),
    P_avail:   loco.power,
    feasible:  F_reserve >= 0,
  }
}

// ─── InfoBadge ────────────────────────────────────────────────────────────────
function InfoBadge({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex align-middle ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-blue-400 hover:text-blue-600 transition-colors"
        aria-label="Подсказка"
      >
        <HelpCircle size={14} />
      </button>
      {show && (
        <span className="absolute left-6 top-0 z-30 w-60 bg-gray-800 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl pointer-events-none">
          {text}
        </span>
      )}
    </span>
  )
}

// ─── SpecChip ─────────────────────────────────────────────────────────────────
function SpecChip({ id, icon, label, value }) {
  return (
    <div id={id} className="flex flex-col items-center bg-blue-50 border border-blue-100 rounded-lg px-2 py-1.5">
      <div className="flex items-center gap-1 text-blue-400 mb-0.5">
        {icon}
        <span className="text-[10px] font-medium text-blue-500">{label}</span>
      </div>
      <span className="text-xs font-semibold text-blue-700">{value}</span>
    </div>
  )
}

// ─── ResultRow ────────────────────────────────────────────────────────────────
function ResultRow({ label, value, unit, highlight, colorClass, note }) {
  return (
    <tr className={highlight ? 'bg-blue-50' : 'hover:bg-gray-50 transition-colors'}>
      <td className="px-4 py-2.5 text-gray-700 text-sm">
        {label}
        {note && <span className="ml-2 text-xs text-gray-400">({note})</span>}
      </td>
      <td className={`px-4 py-2.5 text-right font-mono font-semibold text-sm ${
        colorClass ?? (highlight ? 'text-blue-700' : 'text-gray-900')
      }`}>
        {value}
      </td>
      <td className="px-4 py-2.5 text-gray-400 text-xs w-14">{unit}</td>
    </tr>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <tr className="bg-slate-50">
      <td colSpan={3} className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </td>
    </tr>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center justify-center text-center min-h-[340px]">
      <div className="bg-gray-100 rounded-full p-5 mb-4">
        <Train size={36} className="text-gray-300" />
      </div>
      <p className="text-gray-400 text-sm max-w-xs">
        Заполните параметры слева и нажмите{' '}
        <strong className="text-gray-500">«Рассчитать»</strong>,
        чтобы получить результаты тягового расчёта.
      </p>
    </div>
  )
}

// ─── TractionCalculator ───────────────────────────────────────────────────────
// Props:
//   onboardingLib — ID активной библиотеки онбординга (для будущей интеграции туров)
export default function TractionCalculator({ onboardingLib, tourRef }) {
  const tourInstance = useRef(null)
  const [runTour, setRunTour] = useState(false)

  // ── Driver.js integration ────────────────────────────────────────────────
  useEffect(() => {
    if (onboardingLib !== 'driver') return

    const { startTour, destroyTour } = createDriverTour({
      onDestroyed: ({ state }) =>
        console.log('[Driver.js] Тур уничтожен', state),
    })

    if (tourRef) tourRef.current = { start: startTour }

    return () => {
      destroyTour()
      if (tourRef) tourRef.current = null
    }
  }, [onboardingLib]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Intro.js integration ─────────────────────────────────────────────────
  useEffect(() => {
    if (onboardingLib !== 'introjs') return

    const startTour = createIntrojsTour({
      onComplete: () => console.log('[Intro.js] Тур завершён'),
      onExit:     (step) => console.log(`[Intro.js] Прерван на шаге ${step + 1}`),
    })

    if (tourRef) tourRef.current = { start: startTour }

    return () => {
      if (tourRef) tourRef.current = null
    }
  }, [onboardingLib]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Shepherd.js integration ──────────────────────────────────────────────
  useEffect(() => {
    if (onboardingLib !== 'shepherd') return

    const tour = createShepherdTour({
      onComplete: () => console.log('[Shepherd] Тур завершён'),
      onCancel:   () => console.log('[Shepherd] Тур отменён'),
    })

    tourInstance.current = tour
    if (tourRef) tourRef.current = { start: () => tour.start() }

    return () => {
      // Cleanup on unmount / tab switch
      Shepherd.activeTour?.cancel()
      tourInstance.current = null
      if (tourRef) tourRef.current = null
    }
  }, [onboardingLib]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── React Joyride integration ─────────────────────────────────────────────
  useEffect(() => {
    if (onboardingLib !== 'joyride') return

    if (tourRef) tourRef.current = { start: () => setRunTour(true) }

    return () => {
      setRunTour(false)
      if (tourRef) tourRef.current = null
    }
  }, [onboardingLib]) // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState({
    locomotiveType: 'vl80s',
    trainMass: '3500',
    gradient: '6',
    speed: '60',
  })
  const [results, setResults] = useState(null)
  const [errors, setErrors]   = useState({})

  const currentLoco = LOCOMOTIVES[form.locomotiveType]

  function validate() {
    const e = {}
    if (!form.trainMass || parseFloat(form.trainMass) < 0)
      e.trainMass = 'Укажите корректную массу состава'
    if (form.gradient === '' || isNaN(parseFloat(form.gradient)))
      e.gradient = 'Укажите уклон'
    if (!form.speed || parseFloat(form.speed) < 1)
      e.speed = 'Скорость должна быть ≥ 1 км/ч'
    return e
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setResults(null)
    setErrors((err) => ({ ...err, [name]: undefined }))
  }

  function handleCalculate() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setResults(compute(form))
  }

  const inputCls = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${
      errors[field]
        ? 'border-red-400 focus:ring-red-300'
        : 'border-gray-300 focus:ring-blue-400'
    }`

  function handleJoyrideCallback(data) {
    const { status, index } = data
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false)
      console.log(
        status === STATUS.FINISHED
          ? '[Joyride] Тур завершён'
          : `[Joyride] Тур прерван на шаге ${index + 1}`,
      )
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

      {/* ── React Joyride ── */}
      {onboardingLib === 'joyride' && (
        <Joyride
          steps={JOYRIDE_STEPS}
          run={runTour}
          continuous
          showProgress
          showSkipButton
          scrollToFirstStep
          spotlightPadding={8}
          disableOverlayClose
          locale={{
            back:  '← Назад',
            close: 'Закрыть',
            last:  'Готово ✓',
            next:  'Далее →',
            skip:  'Пропустить',
          }}
          styles={{
            options: {
              primaryColor:    '#2563eb',
              backgroundColor: '#ffffff',
              textColor:       '#374151',
              arrowColor:      '#ffffff',
              overlayColor:    'rgba(0, 0, 0, 0.65)',
              zIndex:          10000,
              width:           380,
            },
          }}
          callback={handleJoyrideCallback}
        />
      )}

      {/* ── Form panel ── */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Calculator size={16} className="text-blue-500" />
            Параметры расчёта
          </h2>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* 1 · Locomotive type */}
          <div data-step="1">
            <label htmlFor="locomotive-type" className="block text-sm font-medium text-gray-700 mb-1.5">
              Тип локомотива
              <InfoBadge text="Определяет располагаемую силу тяги, мощность и собственную массу локомотива." />
            </label>
            <select
              id="locomotive-type"
              name="locomotiveType"
              value={form.locomotiveType}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
            >
              {Object.entries(LOCOMOTIVES).map(([key, loco]) => (
                <option key={key} value={key}>{loco.name}</option>
              ))}
            </select>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <SpecChip id="loco-mass" icon={<Weight size={11} />}    label="Масса"  value={`${currentLoco.mass} т`} />
              <SpecChip                 icon={<Zap size={11} />}        label="Fтяги"  value={`${currentLoco.maxForce} кН`} />
              <SpecChip                 icon={<TrendingUp size={11} />} label="Мощн." value={`${currentLoco.power} кВт`} />
            </div>
          </div>

          {/* 2 · Train mass */}
          <div data-step="2">
            <label htmlFor="train-mass" className="block text-sm font-medium text-gray-700 mb-1.5">
              Масса состава, т
              <InfoBadge text="Масса вагонного состава без локомотива. Типовые грузовые поезда: 3 000–6 000 т." />
            </label>
            <input
              id="train-mass" name="trainMass" type="number"
              min="0" max="20000"
              value={form.trainMass} onChange={handleChange}
              placeholder="напр. 3500"
              className={inputCls('trainMass')}
            />
            {errors.trainMass && <p className="mt-1 text-xs text-red-500">{errors.trainMass}</p>}
          </div>

          {/* 3 · Gradient */}
          <div data-step="3">
            <label htmlFor="gradient" className="block text-sm font-medium text-gray-700 mb-1.5">
              Расчётный уклон, ‰
              <InfoBadge text="Руководящий подъём в промилле (‰). «+» — подъём, «−» — спуск. Типовые значения: 6–12 ‰." />
            </label>
            <input
              id="gradient" name="gradient" type="number"
              min="-40" max="40" step="0.5"
              value={form.gradient} onChange={handleChange}
              placeholder="напр. 6"
              className={inputCls('gradient')}
            />
            {errors.gradient && <p className="mt-1 text-xs text-red-500">{errors.gradient}</p>}
          </div>

          {/* 4 · Speed */}
          <div>
            <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-1.5">
              Расчётная скорость, км/ч
              <InfoBadge text="Скорость движения влияет на удельное основное сопротивление состава и потребляемую мощность." />
            </label>
            <input
              id="speed" name="speed" type="number"
              min="1" max="200"
              value={form.speed} onChange={handleChange}
              placeholder="напр. 60"
              className={inputCls('speed')}
            />
            {errors.speed && <p className="mt-1 text-xs text-red-500">{errors.speed}</p>}
          </div>

          {/* 5 · Calculate button */}
          <div data-step="4">
            <button
              id="calculate-btn"
              type="button"
              onClick={handleCalculate}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Calculator size={15} />
              Рассчитать
            </button>
          </div>
        </div>
      </div>

      {/* ── Results panel ── */}
      <div className="lg:col-span-3" data-step="5">
        {!results ? (
          <EmptyState />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Feasibility banner */}
            <div className={`px-5 py-3.5 flex items-center gap-3 ${
              results.feasible
                ? 'bg-green-50 border-b border-green-200'
                : 'bg-red-50 border-b border-red-200'
            }`}>
              {results.feasible
                ? <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                : <XCircle     size={18} className="text-red-500 shrink-0" />
              }
              <p className={`text-sm font-medium ${results.feasible ? 'text-green-800' : 'text-red-800'}`}>
                {results.feasible
                  ? 'Тяговые условия выполнены — движение возможно'
                  : 'Тяговые условия НЕ выполнены — располагаемая сила тяги недостаточна'}
              </p>
            </div>

            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Результаты расчёта
                <InfoBadge text="Расчёт по ПТР. Формулы сопротивления движению для роликовых букс грузовых вагонов." />
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table id="results-table" className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-full">Параметр</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Значение</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Ед.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <SectionHeader label="Массы" />
                  <ResultRow label="Масса локомотива"      value={results.locoMass}  unit="т"    note={results.locoName} />
                  <ResultRow label="Масса состава"         value={results.trainMass} unit="т" />
                  <ResultRow label="Общая масса поезда"    value={results.totalMass} unit="т"    highlight />

                  <SectionHeader label="Удельные сопротивления" />
                  <ResultRow label="Уд. осн. сопр. локомотива w₀'" value={results.w0loco}  unit="Н/кН" />
                  <ResultRow label="Уд. осн. сопр. состава w₀''"  value={results.w0train} unit="Н/кН" />

                  <SectionHeader label="Силы сопротивления" />
                  <ResultRow label="Осн. сопр. движению — локо"      value={results.W_loco}  unit="кН" />
                  <ResultRow label="Осн. сопр. движению — состав"    value={results.W_train} unit="кН" />
                  <ResultRow label="Суммарное осн. сопр. движению"   value={results.W_run}   unit="кН" highlight />
                  <ResultRow label="Сопр. от уклона"                 value={results.W_grade} unit="кН" highlight />

                  <SectionHeader label="Тяга" />
                  <ResultRow label="Требуемая сила тяги"    value={results.F_req}   unit="кН" highlight />
                  <ResultRow label="Располагаемая сила тяги" value={results.F_avail} unit="кН" highlight />
                  <ResultRow label="Запас тяги"              value={results.F_reserve} unit="кН"
                    colorClass={parseFloat(results.F_reserve) >= 0 ? 'text-green-600' : 'text-red-600'} />

                  <SectionHeader label="Мощность" />
                  <ResultRow label="Требуемая мощность"    value={results.P_req}   unit="кВт" highlight />
                  <ResultRow label="Располагаемая мощность" value={results.P_avail} unit="кВт" highlight />
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
