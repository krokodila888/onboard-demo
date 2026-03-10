import { useState } from 'react'
import { HelpCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'

// ─── Locomotive database (same as AdvancedTractionCalculator) ─────────────────
const LOCOMOTIVES = {
  vl80s: { name: 'ВЛ80С',  fullName: 'ВЛ80С — электровоз грузовой',   mass: 192, maxForce: 520, power: 6160,  maxSpeed: 110, w0: 2.5 },
  vl85:  { name: 'ВЛ85',   fullName: 'ВЛ85 — электровоз грузовой',    mass: 288, maxForce: 780, power: 10000, maxSpeed: 110, w0: 2.3 },
  te116: { name: '2ТЭ116', fullName: '2ТЭ116 — тепловоз грузовой',    mass: 276, maxForce: 520, power: 6000,  maxSpeed: 100, w0: 2.8 },
  chs2:  { name: 'ЧС2',    fullName: 'ЧС2 — электровоз пассажирский', mass: 123, maxForce: 230, power: 4000,  maxSpeed: 160, w0: 2.0 },
  ep1:   { name: 'ЭП1',    fullName: 'ЭП1 — электровоз пассажирский', mass: 135, maxForce: 250, power: 4700,  maxSpeed: 140, w0: 2.0 },
}

// ─── Calculation engine (unchanged from AdvancedTractionCalculator) ───────────
function computeStep1({ locomotiveType, trainMass }) {
  const loco   = LOCOMOTIVES[locomotiveType]
  const mTrain = Math.max(0, parseFloat(trainMass) || 0)
  return {
    locomotiveType,
    locoName:  loco.fullName,
    locoMass:  loco.mass,
    trainMass: mTrain,
    totalMass: loco.mass + mTrain,
    maxForce:  loco.maxForce,
    power:     loco.power,
    maxSpeed:  loco.maxSpeed,
    w0:        loco.w0,
  }
}

function computeStep2({ gradient, curveRadius, useAdvanced, rollingCoeff, airCoeff }, s1) {
  const loco   = LOCOMOTIVES[s1.locomotiveType]
  const i      = parseFloat(gradient) || 0
  const R      = parseFloat(curveRadius) || 0
  const wCurve = R > 0 ? 700 / R : 0
  const mTrain = s1.trainMass
  const mTotal = s1.totalMass
  const nPts = 20, vMin = 2, vMax = s1.maxSpeed
  const points = Array.from({ length: nPts }, (_, k) => {
    const v   = vMin + ((vMax - vMin) / (nPts - 1)) * k
    const a0  = useAdvanced ? (parseFloat(rollingCoeff) || 0.7) : 0.7
    const a2  = useAdvanced ? (parseFloat(airCoeff)     || 0.0003) : 0.0003
    const w0t = a0 + 3 / v + a2 * v * v
    const W_lo = (loco.w0 * loco.mass * 9.81) / 1000
    const W_tr = (w0t * mTrain * 9.81) / 1000
    const W_gr = (i * mTotal * 9.81) / 1000
    const W_cv = (wCurve * mTotal * 9.81) / 1000
    const R_total = W_lo + W_tr + W_gr + W_cv
    const F_trac  = Math.min(loco.maxForce, (loco.power * 3.6) / v)
    return { v, F_trac, R_total }
  })
  let vEquilibrium = null
  for (let k = 0; k < points.length - 1; k++) {
    const a = points[k], b = points[k + 1]
    const dA = a.F_trac - a.R_total, dB = b.F_trac - b.R_total
    if (dA * dB <= 0 && dA !== dB) {
      vEquilibrium = (a.v + (dA / (dA - dB)) * (b.v - a.v)).toFixed(1)
      break
    }
  }
  const v60  = Math.min(60, vMax)
  const w0t6 = 0.7 + 3 / v60 + 0.0003 * v60 * v60
  const W_r6 = ((loco.w0 * loco.mass + w0t6 * mTrain) * 9.81) / 1000
  const W_g6 = (i * mTotal * 9.81) / 1000
  const W_c6 = (wCurve * mTotal * 9.81) / 1000
  const F_req6  = W_r6 + W_g6 + W_c6
  const F_av6   = Math.min(loco.maxForce, (loco.power * 3.6) / v60)
  const F_res6  = F_av6 - F_req6
  return {
    vEquilibrium,
    atV60: {
      v: v60,
      F_req:     F_req6.toFixed(1),
      F_avail:   F_av6.toFixed(1),
      F_reserve: F_res6.toFixed(1),
      feasible:  F_res6 >= 0,
    },
  }
}

function computeStep3({ useEnvironmental, temperature, altitude, weather, useEconomics, energyCost, maintenanceCost }, s1) {
  const T  = parseFloat(temperature) || 20
  const H  = parseFloat(altitude)    || 0
  const wF = weather === 'snow' ? 0.95 : weather === 'rain' ? 0.97 : 1.0
  const tF = useEnvironmental ? Math.max(0.70, 1 - Math.max(0, T - 40) * 0.005) : 1.0
  const hF = useEnvironmental ? Math.max(0.60, 1 - (H / 1000) * 0.03)           : 1.0
  const envFactor = tF * hF * (useEnvironmental ? wF : 1.0)
  const corrPower = s1.power * envFactor
  const energyKWh = (corrPower * (100 / 60)) / 0.85
  let cost = null
  if (useEconomics) {
    const eC = Math.max(0, parseFloat(energyCost)      || 5)
    const mC = Math.max(0, parseFloat(maintenanceCost) || 50)
    cost = {
      energy:      (energyKWh * eC).toFixed(0),
      maintenance: (100 * mC).toFixed(0),
      total:       (energyKWh * eC + 100 * mC).toFixed(0),
    }
  }
  return { corrPower: corrPower.toFixed(0), envFactor: envFactor.toFixed(3), energyKWh: energyKWh.toFixed(0), cost }
}

// ─── InfoBadge (same appearance as original) ──────────────────────────────────
function InfoBadge({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex align-middle ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}       onBlur={() => setShow(false)}
        className="text-blue-400 hover:text-blue-600 transition-colors"
        aria-label="Подсказка"
      >
        <HelpCircle size={13} />
      </button>
      {show && (
        <span className="absolute left-6 top-0 z-30 w-56 bg-gray-800 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl pointer-events-none">
          {text}
        </span>
      )}
    </span>
  )
}

// ─── Analysis breakdown cards ─────────────────────────────────────────────────
const ANALYSIS_ITEMS = [
  {
    title: 'Аббревиатуры вместо названий',
    desc: 'Поля подписаны техническими аббревиатурами (ip, Q брутто, Vр, ТПС) без расшифровки и единиц измерения. Новый инженер вынужден знать их значение наизусть или искать в документации.',
  },
  {
    title: 'Кнопка заблокирована без объяснения причины',
    desc: 'Кнопка «Расчёт» заблокирована при невыполнении ряда условий, но интерфейс не сообщает, какое именно условие не выполнено. Одно из условий нетривиально: блокировка при сочетании типа ТПС и значения Q брутто.',
  },
  {
    title: 'Порядок полей обратен логике заполнения',
    desc: 'Поля ip и Vр расположены перед Q брутто и типом ТПС, хотя логически первично — выбрать локомотив и задать массу состава.',
  },
  {
    title: 'Кнопка расчёта расположена над полями',
    desc: 'Submit-кнопка находится в верхней части формы — нетипичный паттерн, противоречащий привычному F-образному сканированию интерфейса.',
  },
  {
    title: 'Смена типа ТПС очищает поле Q брутто',
    desc: 'Изменение выпадающего списка локомотивов без предупреждения стирает введённое значение массы состава. Пользователь теряет данные неожиданно для себя.',
  },
  {
    title: 'Открытие раздела «Расш. параметры» блокирует расчёт',
    desc: 'Раскрытие коллапсибл-секции с дополнительными коэффициентами активирует их обязательность — кнопка расчёта снова блокируется, хотя визуально поля выглядят предзаполненными (placeholder).',
  },
  {
    title: 'Ложное ограничение уклона',
    desc: 'Сообщение об ошибке появляется при уклоне > 15 ‰ и указывает максимум 12 ‰, хотя реальный диапазон расчёта — до 40 ‰. Пользователь, работающий с горными перегонами, получает ошибку при корректных данных.',
  },
  {
    title: 'Результаты без единиц измерения',
    desc: 'В блоке результатов часть параметров отображается без указания единиц — кН, т, км/ч. Пользователь не знает, в чём выражен ответ.',
  },
  {
    title: 'Изменение параметров незаметно инвалидирует результаты',
    desc: 'После получения результатов шага 1 любое изменение полей сбрасывает результаты шага 2, но никакого предупреждения «данные устарели» не отображается.',
  },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function LegacyCalculator() {
  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [tpsType,   setTpsType]   = useState('vl80s')
  const [qBrutto,   setQBrutto]   = useState('')
  const [ip,        setIp]        = useState('')
  const [rMin,      setRMin]      = useState('')
  const [vR,        setVR]        = useState('')
  const [advOpen,   setAdvOpen]   = useState(false)
  const [a0,        setA0]        = useState('')
  const [a2,        setA2]        = useState('')

  // ── Step 3 state ──────────────────────────────────────────────────────────
  const [temperature,      setTemperature]      = useState('20')
  const [altitude,         setAltitude]         = useState('0')
  const [weather,          setWeather]          = useState('clear')
  const [useCost,          setUseCost]          = useState(false)
  const [energyCost,       setEnergyCost]       = useState('5')
  const [maintenanceCost,  setMaintenanceCost]  = useState('50')

  // ── Results ───────────────────────────────────────────────────────────────
  const [step1Result, setStep1Result] = useState(null)
  const [step2Result, setStep2Result] = useState(null)
  const [step3Result, setStep3Result] = useState(null)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showAnalysis, setShowAnalysis] = useState(false)

  // ── Rule 3: Button blocking conditions ───────────────────────────────────
  const qNum = parseFloat(qBrutto) || 0
  const vNum = parseFloat(vR)      || 0
  const isPassenger = tpsType === 'chs2' || tpsType === 'ep1'
  const calcBlocked =
    !qBrutto || qNum === 0 ||
    ip === '' ||
    vR === '' || vNum < 10 ||
    (isPassenger && qNum > 1200) ||
    (advOpen && (!a0 || !a2))

  // ── Rule 5a: Changing TPS clears Q брутто ────────────────────────────────
  function handleTpsChange(val) {
    setTpsType(val)
    if (qBrutto !== '') setQBrutto('')
    setStep1Result(null)
    setStep2Result(null)
    setStep3Result(null)
  }

  // ── Rule 5b: Opening advanced section blocks until a0/a2 are typed ───────
  function handleAdvToggle() {
    const opening = !advOpen
    setAdvOpen(opening)
    if (opening) { setA0(''); setA2('') }  // clear so user must type (blocks button)
    setStep1Result(null)
    setStep2Result(null)
    setStep3Result(null)
  }

  // ── Rule 5c: Any step-1 field change invalidates downstream results ───────
  function resetS1() { setStep1Result(null); setStep2Result(null); setStep3Result(null) }

  function handleCalcStep1() {
    if (calcBlocked) return
    setStep1Result(computeStep1({ locomotiveType: tpsType, trainMass: qBrutto }))
    setStep2Result(null)
    setStep3Result(null)
  }

  function handleCalcStep2() {
    if (!step1Result) return
    setStep2Result(computeStep2(
      { gradient: ip, curveRadius: rMin, useAdvanced: advOpen, rollingCoeff: a0, airCoeff: a2 },
      step1Result,
    ))
    setStep3Result(null)
  }

  function handleCalcStep3() {
    if (!step2Result) return
    setStep3Result(computeStep3(
      { useEnvironmental: true, temperature, altitude, weather, useEconomics: useCost, energyCost, maintenanceCost },
      step1Result,
    ))
  }

  // ── Rule 4: Misleading/contradictory validation messages ─────────────────
  const qNum2 = parseFloat(qBrutto) || 0
  const qMsg  = qBrutto !== '' && qNum2 > 6000 ? 'Значение превышает норматив. Проверьте ввод.'
              : qBrutto !== '' && qNum2 > 0 && qNum2 < 100 ? 'Недопустимое значение Q'
              : null

  const ipNum = parseFloat(ip) || 0
  const ipMsg = ip !== '' && ipNum > 15 ? 'Значение уклона вне нормативного диапазона (макс. 12 ‰)' : null

  const vMsg  = vR !== '' && vNum > 120 ? 'Предупреждение: превышение конструкционной скорости'
              : vR !== '' && vNum > 0 && vNum < 10 ? 'Ошибка: значение скорости вне диапазона'
              : null

  const rNum = parseFloat(rMin) || 0
  const rMsg = rMin !== '' && rNum >= 1 && rNum < 100 ? 'Нетипичное значение. Возможна ошибка ввода.' : null

  // ── CSS helpers ───────────────────────────────────────────────────────────
  const inp  = 'rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white'
  const inpF = `w-full ${inp}`
  const inpH = `w-1/2 ${inp}`

  return (
    <div className="space-y-4">

      {/* ── Banner ── */}
      <div className="rounded-2xl border bg-slate-50 border-slate-200 p-4 sm:p-5">
        <div className="flex items-start gap-2 mb-2">
          <AlertTriangle size={15} className="text-slate-600 mt-0.5 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800">Реальное ПО — имитация legacy-интерфейса</h2>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          Эта вкладка намеренно воспроизводит типичные проблемы интерфейса расчётного инженерного ПО:
          запутанные названия полей, скрытые зависимости, вводящие в заблуждение подсказки
          и неочевидная блокировка расчёта. Математика работает корректно — сложность создаёт
          только интерфейс. Попробуйте получить результат самостоятельно, затем сравните
          с вкладкой «Без онбординга».
        </p>
        <button
          type="button"
          onClick={() => setShowAnalysis(o => !o)}
          className="text-xs font-medium text-slate-600 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors"
        >
          {showAnalysis ? 'Скрыть разбор проблем ↑' : 'Показать разбор проблем ↓'}
        </button>
      </div>

      {/* ── Analysis collapsible (closed by default) ── */}
      {showAnalysis && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700">Что здесь намеренно сломано</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ANALYSIS_ITEMS.map((item, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-start gap-2 mb-1.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-slate-400 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-7">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Параметры расчётной задачи ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-slate-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
          <span className="text-sm font-semibold text-slate-700">Параметры расчётной задачи</span>
        </div>
        <div className="px-4 py-4 space-y-4">

          {/* Rule 6: Calc button AT TOP */}
          <button
            type="button"
            onClick={handleCalcStep1}
            disabled={calcBlocked}
            className={`w-full font-medium py-2.5 px-4 rounded-lg text-sm transition-colors ${
              calcBlocked
                ? 'bg-slate-300 text-slate-400 opacity-50 cursor-not-allowed pointer-events-none'
                : 'bg-slate-600 hover:bg-slate-700 text-white'
            }`}
          >
            Расчёт (F1)
          </button>

          {/* Rule 6: ip first (wrong order) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ip
              <InfoBadge text="Руководящий подъём. Определяется по продольному профилю перегона согласно ТРА станции." />
            </label>
            <input
              type="number" min="-40" max="40" step="0.5"
              value={ip} placeholder="авт."
              onChange={e => { setIp(e.target.value); resetS1() }}
              className={inpF}
            />
            {ipMsg && <p className="mt-1 text-xs text-red-500">{ipMsg}</p>}
          </div>

          {/* Vр second (wrong order) — Rule 6: w-1/2 inconsistency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Vр
              <InfoBadge text="Расчётная скорость. Принимается по ведомости предельных скоростей данного перегона." />
            </label>
            <input
              type="number" min="0"
              value={vR} placeholder="60"
              onChange={e => { setVR(e.target.value); resetS1() }}
              className={inpH}
            />
            {vMsg && <p className="mt-1 text-xs text-red-500">{vMsg}</p>}
          </div>

          {/* Q брутто — Rule 6: w-1/2, colon in label */}
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Q брутто:
              <InfoBadge text="Масса поезда брутто. Не путать с нетто. См. ГОСТ 22235-2010, таблица Б.3, столбец 7." />
            </label>
            <input
              type="number" min="0"
              value={qBrutto} placeholder="т"
              onChange={e => { setQBrutto(e.target.value); resetS1() }}
              className={inpF}
            />
            {qMsg && <p className="mt-1 text-xs text-red-500">{qMsg}</p>}
          </div>

          {/* Тип ТПС — Rule 6: w-full, no colon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Тип ТПС
              <InfoBadge text="Серия тягового подвижного состава. Параметры приведены в Приложении 2 к ПТР-2016, форма ТУ-162." />
            </label>
            <select
              value={tpsType}
              onChange={e => handleTpsChange(e.target.value)}
              className={inpF}
            >
              {Object.entries(LOCOMOTIVES).map(([k, l]) => (
                <option key={k} value={k}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Rmin — Rule 6: inconsistent width (w-1/2 input), no note that it's optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rmin
              <InfoBadge text="Минимальный радиус кривой в плане. Учитывается через формулу Голышева при R < 4000." />
            </label>
            <input
              type="number" min="0"
              value={rMin} placeholder=""
              onChange={e => { setRMin(e.target.value); resetS1() }}
              className={inpH}
            />
            {rMsg && <p className="mt-1 text-xs text-red-500">{rMsg}</p>}
          </div>

          {/* Advanced collapsible — Rule 5b: opening blocks calc */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={handleAdvToggle}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {advOpen
                ? <ChevronDown  size={14} className="text-gray-400 shrink-0" />
                : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
              <span className="text-xs font-semibold text-gray-700">Расш. физ. параметры</span>
              <InfoBadge text="Коэффициент. Значение по умолчанию — стандартное." />
            </button>
            {advOpen && (
              <div className="px-3 py-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    a₀ (ПТР п.3.1.4)
                    <InfoBadge text="Коэффициент. Значение по умолчанию — стандартное." />
                  </label>
                  <input
                    type="number" min="0" step="0.1"
                    value={a0} placeholder="0.7"
                    onChange={e => setA0(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  {/* Rule 6: no colon, and no InfoBadge — inconsistent */}
                  <label className="block text-xs font-medium text-gray-700 mb-1">a₂</label>
                  <input
                    type="number" min="0" step="0.0001"
                    value={a2} placeholder="0.0003"
                    onChange={e => setA2(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Step 2: Тяговые характеристики — Rule 5c: appears only after step1 ── */}
      {step1Result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-slate-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <span className="text-sm font-semibold text-slate-700">Тяговые характеристики</span>
          </div>
          <div className="px-4 py-4 space-y-3">
            <button
              type="button"
              onClick={handleCalcStep2}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
            >
              Пересчёт тяги
            </button>
            {/* Rule 7: inline results with missing units on some values */}
            {step2Result && (
              <div className="pt-2 border-t border-gray-100 font-mono text-xs text-gray-600 space-y-1">
                <div>F_тяги = {step2Result.atV60.F_avail}</div>
                <div>W_сумм = {step2Result.atV60.F_req} кН</div>
                <div>ΔF = {step2Result.atV60.F_reserve}</div>
                {step2Result.vEquilibrium && <div>Vравн = {step2Result.vEquilibrium} км/ч</div>}
                <div className={`mt-1 text-xs font-sans font-medium ${step2Result.atV60.feasible ? 'text-slate-600' : 'text-slate-600'}`}>
                  {step2Result.atV60.feasible ? 'Условие выполнено.' : 'Условие не выполнено.'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: ТЭП — only after step2 ── */}
      {step2Result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-slate-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
            <span className="text-sm font-semibold text-slate-700">Технико-экономические показатели</span>
          </div>
          <div className="px-4 py-4 space-y-3">
            {/* Rule 6: inconsistent width and colon placement */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">t°</label>
              <input
                type="number" min="-50" max="50"
                value={temperature} onChange={e => setTemperature(e.target.value)}
                className={inpH}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">H, м</label>
              <input
                type="number" min="0" max="5000" step="100"
                value={altitude} onChange={e => setAltitude(e.target.value)}
                className={inpF}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Атм. условия (п.4.2):</label>
              <select
                value={weather} onChange={e => setWeather(e.target.value)}
                className={`${inpH} bg-white`}
              >
                <option value="clear">норм.</option>
                <option value="rain">ливень</option>
                <option value="snow">снег/гололёд</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox" checked={useCost} onChange={e => setUseCost(e.target.checked)}
                className="rounded border-gray-300 text-slate-600"
              />
              <span className="text-xs text-gray-700">Расчёт стоимости</span>
            </label>
            {useCost && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Сэ (тариф III)</label>
                  <input
                    type="number" min="0" step="0.5"
                    value={energyCost} onChange={e => setEnergyCost(e.target.value)}
                    className={inpF}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Смр/км:</label>
                  <input
                    type="number" min="0" step="10"
                    value={maintenanceCost} onChange={e => setMaintenanceCost(e.target.value)}
                    className={inpH}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleCalcStep3}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
            >
              ТЭП
            </button>
            {/* Rule 7: raw numbers, some without units */}
            {step3Result && (
              <div className="pt-2 border-t border-gray-100 font-mono text-xs text-gray-600 space-y-1">
                <div>Kкорр = {step3Result.envFactor}</div>
                <div>Nскорр = {step3Result.corrPower}</div>
                <div>Э₁₀₀ = {step3Result.energyKWh} кВтч</div>
                {step3Result.cost && (
                  <>
                    <div>Сэ = {step3Result.cost.energy}</div>
                    <div>Смр = {step3Result.cost.maintenance}</div>
                    <div>Σ = {step3Result.cost.total} руб.</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Rule 6 + Rule 7: Step 1 results AT BOTTOM, raw numbers, missing some units ── */}
      {step1Result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Результаты блока 1</p>
          <div className="font-mono text-xs text-gray-600 space-y-1">
            <div>М_лок = {step1Result.locoMass}</div>
            <div>Q = {step1Result.trainMass} т</div>
            <div>М_пол = {step1Result.totalMass}</div>
            <div>F_расч = {step1Result.maxForce}</div>
            <div>N = {step1Result.power} кВт</div>
            <div>V_max = {step1Result.maxSpeed}</div>
          </div>
        </div>
      )}
    </div>
  )
}
