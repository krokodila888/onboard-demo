import { useState, useEffect, useRef, memo } from 'react'
import Joyride, { STATUS } from 'react-joyride'
import { createShepherdTour, createShepherdInstructionTour } from '../onboarding/shepherd-tour'
import { createIntrojsTour, createIntrojsHints }            from '../onboarding/introjs-tour'
import { createDriverTour, createDriverHighlight }          from '../onboarding/driver-tour'
import { JOYRIDE_STEPS, JOYRIDE_BEACON_STEPS }              from '../onboarding/joyride-steps.jsx'
import Shepherd from 'shepherd.js'
import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'
import CustomTooltip from './CustomTooltip'
import {
  HelpCircle, Calculator, CheckCircle2, ChevronDown, ChevronRight,
  Lock, Zap, Weight, Train, BarChart2, TrendingUp, DollarSign,
} from 'lucide-react'

// ─── Locomotive database ──────────────────────────────────────────────────────
const LOCOMOTIVES = {
  vl80s: { name: 'ВЛ80С',  fullName: 'ВЛ80С — электровоз грузовой',   mass: 192, maxForce: 520, power: 6160,  maxSpeed: 110, w0: 2.5 },
  vl85:  { name: 'ВЛ85',   fullName: 'ВЛ85 — электровоз грузовой',    mass: 288, maxForce: 780, power: 10000, maxSpeed: 110, w0: 2.3 },
  te116: { name: '2ТЭ116', fullName: '2ТЭ116 — тепловоз грузовой',    mass: 276, maxForce: 520, power: 6000,  maxSpeed: 100, w0: 2.8 },
  chs2:  { name: 'ЧС2',    fullName: 'ЧС2 — электровоз пассажирский', mass: 123, maxForce: 230, power: 4000,  maxSpeed: 160, w0: 2.0 },
  ep1:   { name: 'ЭП1',    fullName: 'ЭП1 — электровоз пассажирский', mass: 135, maxForce: 250, power: 4700,  maxSpeed: 140, w0: 2.0 },
}

// ─── Calculation engine ───────────────────────────────────────────────────────
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
  const wCurve = R > 0 ? 700 / R : 0  // Russian standard: w_r = 700/R [Н/кН]
  const mTrain = s1.trainMass
  const mTotal = s1.totalMass

  // Build 20-point F(v) and R(v) curves from v=2 to vMax
  const nPts = 20
  const vMin = 2
  const vMax = s1.maxSpeed
  const points = Array.from({ length: nPts }, (_, k) => {
    const v    = vMin + ((vMax - vMin) / (nPts - 1)) * k
    const a0   = useAdvanced ? (parseFloat(rollingCoeff) || 0.7) : 0.7
    const a2   = useAdvanced ? (parseFloat(airCoeff)     || 0.0003) : 0.0003
    const w0t  = a0 + 3 / v + a2 * v * v
    const W_lo = (loco.w0 * loco.mass * 9.81) / 1000
    const W_tr = (w0t     * mTrain    * 9.81) / 1000
    const W_ru = W_lo + W_tr
    const W_gr = (i      * mTotal * 9.81) / 1000
    const W_cv = (wCurve * mTotal * 9.81) / 1000
    const R_total = W_ru + W_gr + W_cv
    const F_trac  = Math.min(loco.maxForce, (loco.power * 3.6) / v)
    return { v, F_trac, R_total }
  })

  // Find equilibrium speed (linear interpolation between crossover points)
  let vEquilibrium = null
  for (let k = 0; k < points.length - 1; k++) {
    const a = points[k], b = points[k + 1]
    const dA = a.F_trac - a.R_total
    const dB = b.F_trac - b.R_total
    if (dA * dB <= 0 && dA !== dB) {
      const t = dA / (dA - dB)
      vEquilibrium = (a.v + t * (b.v - a.v)).toFixed(1)
      break
    }
  }

  // Summary stats at v = min(60, vMax)
  const v60  = Math.min(60, vMax)
  const w0t6 = 0.7 + 3 / v60 + 0.0003 * v60 * v60
  const W_l6 = (loco.w0 * loco.mass * 9.81) / 1000
  const W_t6 = (w0t6 * mTrain * 9.81) / 1000
  const W_r6 = W_l6 + W_t6
  const W_g6 = (i * mTotal * 9.81) / 1000
  const W_c6 = (wCurve * mTotal * 9.81) / 1000
  const F_req6  = W_r6 + W_g6 + W_c6
  const F_av6   = Math.min(loco.maxForce, (loco.power * 3.6) / v60)
  const F_res6  = F_av6 - F_req6

  return {
    points,
    vEquilibrium,
    atV60: {
      v:         v60,
      W_run:     W_r6.toFixed(1),
      W_grade:   W_g6.toFixed(1),
      W_curve:   W_c6.toFixed(1),
      F_req:     F_req6.toFixed(1),
      F_avail:   F_av6.toFixed(1),
      F_reserve: F_res6.toFixed(1),
      feasible:  F_res6 >= 0,
    },
  }
}

function computeStep3(
  { useEnvironmental, temperature, altitude, weather, useEconomics, energyCost, maintenanceCost },
  s1, s2,
) {
  const T = parseFloat(temperature) || 20
  const H = parseFloat(altitude)    || 0
  const wF = weather === 'snow' ? 0.95 : weather === 'rain' ? 0.97 : 1.0
  const tF = useEnvironmental ? Math.max(0.70, 1 - Math.max(0, T - 40) * 0.005) : 1.0
  const hF = useEnvironmental ? Math.max(0.60, 1 - (H / 1000) * 0.03) : 1.0
  const envFactor   = tF * hF * (useEnvironmental ? wF : 1.0)
  const corrPower   = s1.power    * envFactor
  const corrForce   = s1.maxForce * Math.sqrt(envFactor)

  // Energy for 100 km @ 60 km/h avg, efficiency 0.85
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

  return {
    corrPower:   corrPower.toFixed(0),
    corrForce:   corrForce.toFixed(1),
    envFactor:   envFactor.toFixed(3),
    energyKWh:   energyKWh.toFixed(0),
    cost,
  }
}

// ─── InfoBadge ────────────────────────────────────────────────────────────────
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

// ─── TippyBadge — «?» icon with Tippy.js tooltip ─────────────────────────────
function TippyBadge({ content }) {
  return (
    <Tippy content={content} placement="right" trigger="mouseenter focus" animation="scale" maxWidth={260}>
      <span
        role="img"
        aria-label="Подсказка"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold cursor-help ml-1 align-middle"
      >
        ?
      </span>
    </Tippy>
  )
}

// ─── CustomBadge — «?» icon with Floating UI CustomTooltip ───────────────────
function CustomBadge({ content }) {
  return (
    <CustomTooltip content={content} placement="right">
      <span
        role="img"
        aria-label="Подсказка"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-100 text-violet-600 text-[10px] font-bold cursor-help ml-1 align-middle"
        tabIndex={0}
      >
        ?
      </span>
    </CustomTooltip>
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

// ─── MiniStat ─────────────────────────────────────────────────────────────────
function MiniStat({ label, value, colorClass = 'text-gray-800' }) {
  return (
    <div className="flex flex-col items-center bg-gray-50 rounded-lg px-2 py-1.5">
      <span className="text-[10px] text-gray-500 mb-0.5">{label}</span>
      <span className={`text-xs font-semibold ${colorClass}`}>{value}</span>
    </div>
  )
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────
const CARD_COLORS = {
  blue:  { bg: 'bg-blue-50',  border: 'border-blue-100',  icon: 'text-blue-400',  text: 'text-blue-700'  },
  green: { bg: 'bg-green-50', border: 'border-green-100', icon: 'text-green-400', text: 'text-green-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-400', text: 'text-amber-700' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-100', icon: 'text-slate-400', text: 'text-slate-700' },
}
function SummaryCard({ label, value, note, icon, color = 'blue' }) {
  const c = CARD_COLORS[color] ?? CARD_COLORS.blue
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-3 flex flex-col gap-1`}>
      <div className={`flex items-center gap-1.5 ${c.icon}`}>
        {icon}
        <span className="text-[11px] font-medium text-gray-500">{label}</span>
      </div>
      <span className={`text-sm font-bold ${c.text}`}>{value}</span>
      {note && <span className="text-[10px] text-gray-400">{note}</span>}
    </div>
  )
}

// ─── CollapsibleSection ───────────────────────────────────────────────────────
function CollapsibleSection({
  id, title, infoBadgeText, infoBadgeNode, defaultOpen = false,
  hasCheckbox, checkboxLabel, checked, onCheckedChange,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div id={id} data-onboarding-collapsible="" className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        {open
          ? <ChevronDown  size={14} className="text-gray-400 shrink-0" />
          : <ChevronRight size={14} className="text-gray-400 shrink-0" />
        }
        <span className="text-xs font-semibold text-gray-700">{title}</span>
        {hasCheckbox && !checked && (
          <span className="text-[10px] text-gray-400 font-normal ml-1">(базовые значения)</span>
        )}
        {infoBadgeNode ?? (infoBadgeText && <InfoBadge text={infoBadgeText} />)}
      </button>

      {open && (
        <div className="px-3 py-3 space-y-3">
          {hasCheckbox && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checked ?? false}
                onChange={e => onCheckedChange?.(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-400"
              />
              <span className="text-xs text-gray-700">{checkboxLabel}</span>
            </label>
          )}
          {children}
        </div>
      )}
    </div>
  )
}

// ─── StepPanel ────────────────────────────────────────────────────────────────
function StepPanel({ stepNumber, title, status, children }) {
  const locked    = status === 'locked'
  const completed = status === 'completed'
  const active    = status === 'active'
  return (
    <div
      data-onboarding-step={String(stepNumber)}
      {...(locked ? { 'data-onboarding-disabled': '' } : {})}
      className={`bg-white rounded-2xl border shadow-sm transition-all ${
        active    ? 'border-blue-300 ring-2 ring-blue-100' :
        completed ? 'border-green-200 ring-2 ring-green-100' :
                    'border-gray-200 opacity-60'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center gap-2.5 ${
        active    ? 'border-blue-100 bg-blue-50' :
        completed ? 'border-green-100 bg-green-50' :
                    'border-gray-100 bg-gray-50'
      }`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          completed ? 'bg-green-100 text-green-600' :
          active    ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
        }`}>
          {completed ? <CheckCircle2 size={14} /> : stepNumber}
        </div>
        <span className={`text-sm font-semibold ${
          completed ? 'text-green-800' : active ? 'text-blue-800' : 'text-gray-500'
        }`}>{title}</span>
        {locked && <Lock size={13} className="ml-auto text-gray-300" />}
      </div>

      {/* Body */}
      {locked ? (
        <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
          <Lock size={22} className="text-gray-200" />
          <span className="text-sm text-gray-400">Завершите предыдущий шаг для доступа</span>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4">{children}</div>
      )}
    </div>
  )
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({ step1Done, step2Done, step3Done }) {
  const doneCount = [step1Done, step2Done, step3Done].filter(Boolean).length
  const steps = [
    { n: 1, label: 'Базовые параметры',       done: step1Done, active: !step1Done },
    { n: 2, label: 'Тяговые характеристики',   done: step2Done, active: step1Done && !step2Done },
    { n: 3, label: 'Эксплуатационные',         done: step3Done, active: step2Done && !step3Done },
  ]
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">Прогресс расчёта</span>
        <span className="text-xs text-gray-500">{doneCount} / 3 этапов завершено</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / 3) * 100}%` }}
        />
      </div>
      <div className="flex items-center">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 min-w-0">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              s.done   ? 'bg-green-100 text-green-600' :
              s.active ? 'bg-blue-100 text-blue-600' :
                         'bg-gray-100 text-gray-400'
            }`}>
              {s.done ? '✓' : s.n}
            </div>
            <span className={`text-[11px] ml-1.5 truncate flex-1 ${
              s.done ? 'text-green-700' : s.active ? 'text-blue-700' : 'text-gray-400'
            }`}>{s.label}</span>
            {i < 2 && <div className="w-3 shrink-0 h-px bg-gray-200 mx-1 hidden sm:block" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TractionChart (SVG) ──────────────────────────────────────────────────────
function TractionChart({ step1Result, step2Result }) {
  const W = 420, H = 224
  const mL = 54, mR = 18, mT = 22, mB = 44
  const pw = W - mL - mR
  const ph = H - mT - mB

  const { points, vEquilibrium } = step2Result
  const vMax = step1Result.maxSpeed
  const rMax = Math.max(...points.map(p => p.R_total))
  const yMax = Math.max(Math.ceil(step1Result.maxForce * 1.15 / 100) * 100, Math.ceil(rMax * 1.25 / 100) * 100, 100)

  const xS = v => mL + (v / vMax) * pw
  const yS = f => H - mB - (Math.max(0, f) / yMax) * ph

  const fPath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${xS(p.v).toFixed(1)},${yS(p.F_trac).toFixed(1)}`
  ).join(' ')
  const rPath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${xS(p.v).toFixed(1)},${yS(p.R_total).toFixed(1)}`
  ).join(' ')

  const xTicks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * vMax))
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * yMax / 100) * 100)
  const vEqNum = vEquilibrium ? parseFloat(vEquilibrium) : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ fontFamily: 'inherit', overflow: 'visible' }}>
      {/* Plot background */}
      <rect x={mL} y={mT} width={pw} height={ph} fill="#fafafa" rx="3" />

      {/* Grid lines */}
      {xTicks.map(v => (
        <line key={`xg${v}`} x1={xS(v)} y1={mT} x2={xS(v)} y2={H - mB} stroke="#f0f0f0" strokeWidth="1" />
      ))}
      {yTicks.map(f => (
        <line key={`yg${f}`} x1={mL} y1={yS(f)} x2={W - mR} y2={yS(f)} stroke="#f0f0f0" strokeWidth="1" />
      ))}

      {/* Equilibrium vertical line */}
      {vEqNum && vEqNum >= 2 && vEqNum <= vMax && (
        <line x1={xS(vEqNum)} y1={mT} x2={xS(vEqNum)} y2={H - mB}
          stroke="#16a34a" strokeWidth="1.2" strokeDasharray="4,3" opacity="0.8" />
      )}

      {/* Data paths */}
      <path d={fPath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d={rPath} fill="none" stroke="#dc2626" strokeWidth="1.8" strokeDasharray="5,3" strokeLinejoin="round" />

      {/* Axes */}
      <line x1={mL} y1={mT} x2={mL} y2={H - mB} stroke="#9ca3af" strokeWidth="1.5" />
      <line x1={mL} y1={H - mB} x2={W - mR} y2={H - mB} stroke="#9ca3af" strokeWidth="1.5" />

      {/* X ticks + labels */}
      {xTicks.map(v => (
        <g key={`xt${v}`}>
          <line x1={xS(v)} y1={H - mB} x2={xS(v)} y2={H - mB + 4} stroke="#9ca3af" strokeWidth="1" />
          <text x={xS(v)} y={H - mB + 15} textAnchor="middle" fontSize="10" fill="#6b7280">{v}</text>
        </g>
      ))}

      {/* Y ticks + labels */}
      {yTicks.filter(f => f > 0).map(f => (
        <g key={`yt${f}`}>
          <line x1={mL - 4} y1={yS(f)} x2={mL} y2={yS(f)} stroke="#9ca3af" strokeWidth="1" />
          <text x={mL - 7} y={yS(f) + 3.5} textAnchor="end" fontSize="10" fill="#6b7280">{f}</text>
        </g>
      ))}

      {/* Axis labels */}
      <text x={(mL + W - mR) / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="#6b7280">
        Скорость, км/ч
      </text>
      <text
        x={11} y={(mT + H - mB) / 2}
        textAnchor="middle" fontSize="11" fill="#6b7280"
        transform={`rotate(-90, 11, ${(mT + H - mB) / 2})`}
      >
        Сила, кН
      </text>

      {/* Legend */}
      <line x1={mL + 5}  y1={mT + 9} x2={mL + 24} y2={mT + 9} stroke="#2563eb" strokeWidth="2.5" />
      <text x={mL + 28} y={mT + 13} fontSize="10" fill="#374151">Сила тяги</text>

      <line x1={mL + 88} y1={mT + 9} x2={mL + 107} y2={mT + 9}
        stroke="#dc2626" strokeWidth="1.8" strokeDasharray="5,3" />
      <text x={mL + 111} y={mT + 13} fontSize="10" fill="#374151">Сопротивление</text>

      {vEqNum && vEqNum >= 2 && vEqNum <= vMax && (
        <>
          <line x1={mL + 198} y1={mT + 9} x2={mL + 217} y2={mT + 9}
            stroke="#16a34a" strokeWidth="1.2" strokeDasharray="4,3" />
          <text x={mL + 221} y={mT + 13} fontSize="10" fill="#374151">
            vравн = {vEquilibrium} км/ч
          </text>
        </>
      )}
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
function AdvancedTractionCalculator({ onboardingLib, tourRef, extraActionRef }) {
  const tourInstance = useRef(null)
  const [runTour, setRunTour] = useState(false)

  // ── Beacon mode (Joyride "Справка по полям") ──────────────────────────────
  const [beaconMode, setBeaconMode] = useState(false)

  // ── Driver highlight refs ─────────────────────────────────────────────────
  const highlightRef      = useRef(null) // { triggerHighlight, destroyHighlight }
  const highlightShownRef = useRef(false)

  // ── Intro.js hints instance ───────────────────────────────────────────────
  const hintsInstanceRef = useRef(null)

  // ── Tippy interactive popover ref (Step 1 calculate button) ──────────────
  const step1TippyRef = useRef(null)

  // ── Onboarding integrations ───────────────────────────────────────────────

  // --- Driver tour + highlight ---
  useEffect(() => {
    if (onboardingLib !== 'driver') return
    const { startTour, destroyTour } = createDriverTour({})
    const hl = createDriverHighlight()
    highlightRef.current = hl
    highlightShownRef.current = false
    if (tourRef) tourRef.current = { start: startTour }
    if (extraActionRef) extraActionRef.current = { start: () => hl.triggerHighlight() }
    return () => {
      destroyTour()
      hl.destroyHighlight()
      highlightRef.current = null
      if (tourRef) tourRef.current = null
      if (extraActionRef) extraActionRef.current = null
    }
  }, [onboardingLib]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Intro.js tour + hints ---
  useEffect(() => {
    if (onboardingLib !== 'introjs') return
    const startTour = createIntrojsTour({})
    if (tourRef) tourRef.current = { start: startTour }

    // Initialise and show hints automatically
    // In Intro.js v8 addHints() already shows the bubbles — no showHints() needed
    const showHints = () => {
      hintsInstanceRef.current?.removeHints?.()
      const h = createIntrojsHints()
      hintsInstanceRef.current = h
    }
    showHints()
    if (extraActionRef) extraActionRef.current = { start: showHints }

    return () => {
      try { hintsInstanceRef.current?.removeHints?.() } catch (_) { /* ignore */ }
      hintsInstanceRef.current = null
      if (tourRef) tourRef.current = null
      if (extraActionRef) extraActionRef.current = null
    }
  }, [onboardingLib]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Shepherd tour + instruction tour ---
  useEffect(() => {
    if (onboardingLib !== 'shepherd') return
    const tour = createShepherdTour({})
    const instrTour = createShepherdInstructionTour({})
    tourInstance.current = tour
    if (tourRef) tourRef.current = { start: () => tour.start() }
    if (extraActionRef) extraActionRef.current = { start: () => instrTour.start() }
    return () => {
      Shepherd.activeTour?.cancel()
      tourInstance.current = null
      if (tourRef) tourRef.current = null
      if (extraActionRef) extraActionRef.current = null
    }
  }, [onboardingLib]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Joyride tour + beacon mode ---
  useEffect(() => {
    if (onboardingLib !== 'joyride') return
    if (tourRef) tourRef.current = { start: () => setRunTour(true) }
    if (extraActionRef) extraActionRef.current = { start: () => setBeaconMode(m => !m) }
    return () => {
      setRunTour(false)
      setBeaconMode(false)
      if (tourRef) tourRef.current = null
      if (extraActionRef) extraActionRef.current = null
    }
  }, [onboardingLib]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [s1, setS1] = useState({ locomotiveType: 'vl80s', trainMass: '3500' })
  const [s1Err, setS1Err] = useState({})
  const [step1Result, setStep1Result] = useState(null)

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [s2, setS2] = useState({
    gradient: '6', curveRadius: '', useAdvanced: false,
    rollingCoeff: '0.7', airCoeff: '0.0003',
  })
  const [s2Err, setS2Err] = useState({})
  const [step2Result, setStep2Result] = useState(null)

  // ── Step 3 state ──────────────────────────────────────────────────────────
  const [s3, setS3] = useState({
    useEnvironmental: false, temperature: '20', altitude: '0', weather: 'clear',
    useEconomics: false, energyCost: '5', maintenanceCost: '50',
  })
  const [step3Result, setStep3Result] = useState(null)

  // ── Driver: auto-highlight Step 2 when Step 1 is first completed ─────────
  useEffect(() => {
    if (onboardingLib !== 'driver') return
    if (!step1Result) return              // Step 1 not yet done
    if (highlightShownRef.current) return // Already shown once
    highlightShownRef.current = true
    const timer = setTimeout(() => {
      highlightRef.current?.triggerHighlight()
    }, 800)
    return () => clearTimeout(timer)
  }, [step1Result, onboardingLib]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived helpers ───────────────────────────────────────────────────────
  function getStatus(n) {
    if (n === 1) return step1Result ? 'completed' : 'active'
    if (n === 2) return !step1Result ? 'locked' : step2Result ? 'completed' : 'active'
    return !step2Result ? 'locked' : step3Result ? 'completed' : 'active'
  }

  const iCls = (field, errs) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${
      errs[field] ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-400'
    }`

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleCalcStep1() {
    const e = {}
    if (!s1.trainMass || parseFloat(s1.trainMass) < 0) e.trainMass = 'Укажите корректную массу состава'
    if (Object.keys(e).length) { setS1Err(e); return }
    setS1Err({})
    setStep1Result(computeStep1(s1))
    setStep2Result(null)
    setStep3Result(null)
  }

  function handleCalcStep2() {
    const e = {}
    if (s2.gradient === '' || isNaN(parseFloat(s2.gradient))) e.gradient = 'Укажите уклон'
    if (s2.curveRadius && parseFloat(s2.curveRadius) <= 0) e.curveRadius = 'Радиус должен быть > 0'
    if (Object.keys(e).length) { setS2Err(e); return }
    setS2Err({})
    setStep2Result(computeStep2(s2, step1Result))
    setStep3Result(null)
  }

  function handleCalcStep3() {
    setStep3Result(computeStep3(s3, step1Result, step2Result))
  }

  function handleJoyrideCallback({ status }) {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false)
    }
  }

  // ── fieldTip: renders appropriate tooltip badge based on active lib ────────
  function fieldTip(defaultText, libText) {
    if (onboardingLib === 'tippy')   return <TippyBadge content={libText} />
    if (onboardingLib === 'custom')  return <CustomBadge content={libText} />
    return <InfoBadge text={defaultText} />
  }

  const currentLoco = LOCOMOTIVES[s1.locomotiveType]

  const joyrideStyles = {
    options: {
      primaryColor: '#2563eb', backgroundColor: '#ffffff', textColor: '#374151',
      arrowColor: '#ffffff', overlayColor: 'rgba(0,0,0,0.65)', zIndex: 10000, width: 380,
    },
  }

  return (
    <div>
      {/* ── React Joyride (tour) ── */}
      {onboardingLib === 'joyride' && (
        <Joyride
          steps={JOYRIDE_STEPS}
          run={runTour}
          continuous showProgress showSkipButton scrollToFirstStep
          spotlightPadding={8}
          disableOverlayClose
          locale={{ back: '← Назад', close: 'Закрыть', last: 'Готово ✓', next: 'Далее →', skip: 'Пропустить' }}
          styles={joyrideStyles}
          callback={handleJoyrideCallback}
        />
      )}

      {/* ── React Joyride (beacon mode — Справка по полям) ──
           One <Joyride> per step → all beacons visible simultaneously.
           Uncontrolled (no stepIndex) + continuous={false}:
           clicking a beacon opens its tooltip; closing restores the beacon. */}
      {onboardingLib === 'joyride' && beaconMode && JOYRIDE_BEACON_STEPS.map((step, i) => (
        <Joyride
          key={`beacon-${i}`}
          steps={[step]}
          run={beaconMode}
          continuous={false}
          disableOverlay={false}
          showSkipButton={false}
          spotlightClicks
          spotlightPadding={6}
          disableScrolling
          locale={{ close: 'Закрыть', last: 'Закрыть' }}
          styles={{
            ...joyrideStyles,
            options: {
              ...joyrideStyles.options,
              overlayColor: 'rgba(0,0,0,0.15)',
            },
          }}
          callback={() => {}}
        />
      ))}

      {/* ── Intro.js: hint notice ── */}
      {onboardingLib === 'introjs' && (
        <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
          <HelpCircle size={13} className="text-amber-500 shrink-0" />
          <span>Значки <strong>?</strong> — постоянные подсказки (Hints). Нажмите для просмотра.</span>
        </div>
      )}

      {/* ── Tippy.js: notice ── */}
      {onboardingLib === 'tippy' && (
        <div className="mb-4 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-800">
          <HelpCircle size={13} className="text-orange-500 shrink-0" />
          <span>Значки <strong className="bg-orange-100 text-orange-600 px-1 rounded">?</strong> рядом с полями — тултипы Tippy.js. Наведите или кликните для справки.</span>
        </div>
      )}

      {/* ── Custom (Floating UI): notice ── */}
      {onboardingLib === 'custom' && (
        <div className="mb-4 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-xs text-violet-800">
          <HelpCircle size={13} className="text-violet-500 shrink-0" />
          <span>Значки <strong className="bg-violet-100 text-violet-600 px-1 rounded">?</strong> — кастомные тултипы на <code className="font-mono">@floating-ui/react</code>. Наведите для справки.</span>
        </div>
      )}

      {/* ── Joyride beacon: close bar ── */}
      {onboardingLib === 'joyride' && beaconMode && (
        <div className="mb-4 flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-800">
          <span className="flex items-center gap-1.5">
            <HelpCircle size={13} className="text-blue-500 shrink-0" />
            Режим <strong>Справка по полям</strong> — нажмите на пульсирующий маркер у поля для подсказки
          </span>
          <button
            type="button"
            onClick={() => setBeaconMode(false)}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Закрыть справку
          </button>
        </div>
      )}

      {/* ── Progress bar ── */}
      <ProgressBar
        step1Done={!!step1Result}
        step2Done={!!step2Result}
        step3Done={!!step3Result}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ───────────────── Left: Steps ───────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── Step 1: Базовые параметры ── */}
          <StepPanel stepNumber={1} title="Базовые параметры" status={getStatus(1)}>
            {/* Locomotive select */}
            <div data-onboarding-step="1">
              <label htmlFor="step1-locomotive" className="block text-sm font-medium text-gray-700 mb-1.5">
                Тип локомотива
                {fieldTip(
                  'Определяет силу тяги, мощность и собственную массу локомотива.',
                  'Серия определяет тяговые характеристики. ВЛ80С — грузовой восьмиосный электровоз переменного тока мощностью 6520 кВт.',
                )}
              </label>
              <select
                id="step1-locomotive"
                value={s1.locomotiveType}
                onChange={e => { setS1({ ...s1, locomotiveType: e.target.value }); setStep1Result(null) }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
              >
                {Object.entries(LOCOMOTIVES).map(([k, l]) => (
                  <option key={k} value={k}>{l.fullName}</option>
                ))}
              </select>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <SpecChip id="loco-mass" icon={<Weight size={11} />}    label="Масса"  value={`${currentLoco.mass} т`} />
                <SpecChip              icon={<Zap size={11} />}        label="Fтяги"  value={`${currentLoco.maxForce} кН`} />
                <SpecChip              icon={<TrendingUp size={11} />} label="Мощн."  value={`${currentLoco.power} кВт`} />
              </div>
            </div>

            {/* Train mass */}
            <div>
              <label htmlFor="step1-mass" className="block text-sm font-medium text-gray-700 mb-1.5">
                Масса состава, т
                {fieldTip(
                  'Масса вагонов без локомотива. Грузовые поезда: 3 000–6 000 т.',
                  'Полная масса вагонов с грузом, без учёта массы локомотива. Типовые значения: 3000–6000 т для грузовых, 1000–1500 т для пассажирских.',
                )}
              </label>
              <input
                id="step1-mass"
                type="number" min="0" max="20000"
                value={s1.trainMass}
                onChange={e => { setS1({ ...s1, trainMass: e.target.value }); setStep1Result(null) }}
                placeholder="напр. 3500"
                className={iCls('trainMass', s1Err)}
              />
              {s1Err.trainMass && <p className="mt-1 text-xs text-red-500">{s1Err.trainMass}</p>}
            </div>

            {/* Calculate button — wrapped in interactive Tippy popover for tippy tab */}
            {onboardingLib === 'tippy' ? (
              <Tippy
                trigger="click"
                interactive
                appendTo={() => document.body}
                maxWidth={280}
                onCreate={inst => { step1TippyRef.current = inst }}
                content={
                  <div className="p-1">
                    <p className="text-sm font-semibold mb-2">Что происходит при расчёте?</p>
                    <ul className="text-xs space-y-1 list-disc list-inside text-gray-200">
                      <li>Вычисляется удельное сопротивление движению по формулам ПТР</li>
                      <li>Строится зависимость F(v) — сила тяги от скорости</li>
                      <li>Определяется равновесная скорость в заданных условиях</li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => step1TippyRef.current?.hide()}
                      className="mt-3 px-3 py-1 bg-white text-gray-800 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Понятно
                    </button>
                  </div>
                }
              >
                <button
                  id="calculate-step1-btn"
                  type="button"
                  onClick={handleCalcStep1}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <Calculator size={14} />
                  Рассчитать базовые параметры
                </button>
              </Tippy>
            ) : (
              <button
                id="calculate-step1-btn"
                type="button"
                onClick={handleCalcStep1}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Calculator size={14} />
                Рассчитать базовые параметры
              </button>
            )}

            {/* Inline results */}
            {step1Result && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-green-700 font-medium mb-2 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-green-500" />
                  Базовые параметры рассчитаны
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <MiniStat label="Масса поезда" value={`${step1Result.totalMass} т`} />
                  <MiniStat label="Макс. тяга"   value={`${step1Result.maxForce} кН`} />
                  <MiniStat label="Мощность"     value={`${step1Result.power} кВт`} />
                </div>
              </div>
            )}
          </StepPanel>

          {/* ── Step 2: Тяговые характеристики ── */}
          <StepPanel stepNumber={2} title="Тяговые характеристики" status={getStatus(2)}>
            {/* Gradient */}
            <div>
              <label htmlFor="step2-gradient" className="block text-sm font-medium text-gray-700 mb-1.5">
                Расчётный уклон, ‰
                {fieldTip(
                  'Руководящий подъём в промилле. "+" — подъём, "−" — спуск. Типовые значения: 6–12 ‰.',
                  'Измеряется в промилле (‰): превышение в метрах на 1000 м пути. Подъём — положительное значение, спуск — отрицательное. Нормативный руководящий уклон по ПТР: до 12–15 ‰.',
                )}
              </label>
              <input
                id="step2-gradient"
                type="number" min="-40" max="40" step="0.5"
                value={s2.gradient}
                onChange={e => { setS2({ ...s2, gradient: e.target.value }); setStep2Result(null) }}
                placeholder="напр. 6"
                className={iCls('gradient', s2Err)}
              />
              {s2Err.gradient && <p className="mt-1 text-xs text-red-500">{s2Err.gradient}</p>}
            </div>

            {/* Curve radius */}
            <div>
              <label htmlFor="step2-curve" className="block text-sm font-medium text-gray-700 mb-1.5">
                Минимальный радиус кривых, м
                {fieldTip(
                  'Кривые добавляют сопротивление (w_r = 700/R). Оставьте пустым для прямого участка.',
                  'Радиус горизонтальной кривой в метрах. Влияет на дополнительное сопротивление движению. Минимальный радиус на главных путях — 350 м. При R > 2000 м влиянием можно пренебречь.',
                )}
              </label>
              <input
                id="step2-curve"
                type="number" min="0" step="50"
                value={s2.curveRadius}
                onChange={e => { setS2({ ...s2, curveRadius: e.target.value }); setStep2Result(null) }}
                placeholder="напр. 500 (пусто = без кривых)"
                className={iCls('curveRadius', s2Err)}
              />
              {s2Err.curveRadius && <p className="mt-1 text-xs text-red-500">{s2Err.curveRadius}</p>}
            </div>

            {/* Collapsible: advanced physics */}
            <CollapsibleSection
              id="section-advanced"
              title="Расширенные физические параметры"
              infoBadgeNode={fieldTip(
                'Переопределяют коэффициенты базовой формулы сопротивления движению (ПТР)',
                'Коэффициенты ПТР: w₀ = a₀ + 3/v + a₂·v². a₀ — коэф. качения (норм. 0.7 Н/кН), a₂ — аэродинамический коэф. (0.0003)',
              )}
              hasCheckbox
              checkboxLabel="Использовать расширенные параметры"
              checked={s2.useAdvanced}
              onCheckedChange={v => setS2({ ...s2, useAdvanced: v })}
            >
              {s2.useAdvanced && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Нач. коэф. сопр. качению a₀, Н/кН
                      {fieldTip('В формуле w\'\'₀ = a₀ + 3/v + a₂·v². Базовое значение 0.7.', 'В формуле w\'\'₀ = a₀ + 3/v + a₂·v². a₀ — начальный коэф. сопротивления качению. Базовое значение 0.7 Н/кН.')}
                    </label>
                    <input
                      type="number" min="0" step="0.1"
                      value={s2.rollingCoeff}
                      onChange={e => setS2({ ...s2, rollingCoeff: e.target.value })}
                      placeholder="0.7"
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Коэф. возд. сопротивления a₂
                      {fieldTip('В формуле w\'\'₀ = a₀ + 3/v + a₂·v². Базовое значение 0.0003.', 'В формуле w\'\'₀ = a₀ + 3/v + a₂·v². a₂ — аэродинамический коэф. сопротивления. Базовое значение 0.0003.')}
                    </label>
                    <input
                      type="number" min="0" step="0.0001"
                      value={s2.airCoeff}
                      onChange={e => setS2({ ...s2, airCoeff: e.target.value })}
                      placeholder="0.0003"
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              )}
            </CollapsibleSection>

            {/* Calculate button */}
            <button
              id="calculate-step2-btn"
              type="button"
              onClick={handleCalcStep2}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <BarChart2 size={14} />
              Рассчитать тяговые характеристики
            </button>

            {/* Inline results */}
            {step2Result && (
              <div className="pt-2 border-t border-gray-100">
                <p className={`text-xs font-medium mb-2 flex items-center gap-1 ${
                  step2Result.atV60.feasible ? 'text-green-700' : 'text-red-700'
                }`}>
                  <CheckCircle2 size={13} className={step2Result.atV60.feasible ? 'text-green-500' : 'text-red-400'} />
                  {step2Result.atV60.feasible
                    ? `Тяга выполнена при ${step2Result.atV60.v} км/ч`
                    : `Тяга недостаточна при ${step2Result.atV60.v} км/ч`}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <MiniStat label="Требуется тяга"  value={`${step2Result.atV60.F_req} кН`} />
                  <MiniStat label="Располагаемая"    value={`${step2Result.atV60.F_avail} кН`} />
                  <MiniStat
                    label="Запас тяги"
                    value={`${step2Result.atV60.F_reserve} кН`}
                    colorClass={parseFloat(step2Result.atV60.F_reserve) >= 0 ? 'text-green-600' : 'text-red-600'}
                  />
                  {step2Result.vEquilibrium && (
                    <MiniStat label="vравн." value={`${step2Result.vEquilibrium} км/ч`} colorClass="text-blue-600" />
                  )}
                </div>
              </div>
            )}
          </StepPanel>

          {/* ── Step 3: Эксплуатационные показатели ── */}
          <StepPanel stepNumber={3} title="Эксплуатационные показатели" status={getStatus(3)}>
            {/* Collapsible: environment */}
            <CollapsibleSection
              id="section-environmental"
              title="Условия окружающей среды"
              infoBadgeNode={fieldTip(
                'Температура, высота и погода влияют на мощность тягового оборудования',
                'Коррекция мощности: температура (−0.5% на °C выше 40°), высота (−3% на 1000 м), снег (−5%), дождь (−3%).',
              )}
              hasCheckbox
              checkboxLabel="Учитывать условия среды"
              checked={s3.useEnvironmental}
              onCheckedChange={v => setS3({ ...s3, useEnvironmental: v })}
            >
              {s3.useEnvironmental && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Температура воздуха, °C
                    </label>
                    <input
                      type="number" min="-50" max="50"
                      value={s3.temperature}
                      onChange={e => setS3({ ...s3, temperature: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Высота над уровнем моря, м
                    </label>
                    <input
                      type="number" min="0" max="5000" step="100"
                      value={s3.altitude}
                      onChange={e => setS3({ ...s3, altitude: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Погодные условия
                    </label>
                    <select
                      value={s3.weather}
                      onChange={e => setS3({ ...s3, weather: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    >
                      <option value="clear">Ясно</option>
                      <option value="rain">Дождь (−3 %)</option>
                      <option value="snow">Снег (−5 %)</option>
                    </select>
                  </div>
                </div>
              )}
            </CollapsibleSection>

            {/* Collapsible: economics */}
            <CollapsibleSection
              id="section-economics"
              title="Экономические параметры"
              infoBadgeNode={fieldTip(
                'Рассчитывает примерную стоимость поездки на 100 км',
                'Стоимость = энергия (кВт·ч × ₽/кВтч) + обслуживание (100 км × ₽/км). КПД тяги принят 0.85.',
              )}
              hasCheckbox
              checkboxLabel="Рассчитать стоимость поездки"
              checked={s3.useEconomics}
              onCheckedChange={v => setS3({ ...s3, useEconomics: v })}
            >
              {s3.useEconomics && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Стоимость электроэнергии, ₽/кВтч
                    </label>
                    <input
                      type="number" min="0" step="0.5"
                      value={s3.energyCost}
                      onChange={e => setS3({ ...s3, energyCost: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Стоимость обслуживания, ₽/км
                    </label>
                    <input
                      type="number" min="0" step="10"
                      value={s3.maintenanceCost}
                      onChange={e => setS3({ ...s3, maintenanceCost: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              )}
            </CollapsibleSection>

            {/* Calculate button */}
            <button
              id="calculate-step3-btn"
              type="button"
              onClick={handleCalcStep3}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <TrendingUp size={14} />
              Рассчитать эксплуатационные показатели
            </button>
          </StepPanel>
        </div>

        {/* ───────────────── Right: Chart + Summary ───────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Traction chart panel */}
          <div
            id="traction-chart-panel"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <BarChart2 size={15} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-800">Тяговая характеристика F(v)</h3>
            </div>
            {step2Result && step1Result ? (
              <div className="p-4">
                <TractionChart step1Result={step1Result} step2Result={step2Result} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[240px] text-center px-6 py-10">
                <BarChart2 size={38} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                  Завершите <strong className="text-gray-500">Шаг 2</strong>, чтобы
                  построить график зависимости силы тяги от скорости.
                </p>
              </div>
            )}
          </div>

          {/* Summary card (after all 3 steps) */}
          {step3Result && step1Result && step2Result && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Feasibility banner */}
              <div className={`px-5 py-3.5 flex items-center gap-3 border-b ${
                step2Result.atV60.feasible
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <CheckCircle2 size={18} className={step2Result.atV60.feasible ? 'text-green-500' : 'text-red-400'} />
                <div>
                  <p className={`text-sm font-semibold ${step2Result.atV60.feasible ? 'text-green-800' : 'text-red-800'}`}>
                    Итоговая сводка
                  </p>
                  <p className={`text-xs ${step2Result.atV60.feasible ? 'text-green-700' : 'text-red-700'}`}>
                    {step2Result.atV60.feasible
                      ? 'Тяговые условия выполнены'
                      : 'Тяговые условия НЕ выполнены — сила тяги недостаточна'}
                  </p>
                </div>
              </div>

              {/* Results tooltip for Tippy/Custom — shown on the summary header */}
              {(onboardingLib === 'tippy' || onboardingLib === 'custom') && (
                <div className="px-5 pt-3 flex items-center gap-1.5 text-xs text-gray-500">
                  <span>Блок результатов</span>
                  {fieldTip(
                    'Результаты тягового расчёта.',
                    'Равновесная скорость — скорость, при которой сила тяги локомотива равна суммарному сопротивлению движению поезда.',
                  )}
                </div>
              )}

              {/* Key metrics */}
              <div className="px-5 py-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <SummaryCard
                    label="Общая масса поезда"
                    value={`${step1Result.totalMass} т`}
                    icon={<Weight size={15} />}
                    color="blue"
                  />
                  <SummaryCard
                    label="Требуемая тяга"
                    value={`${step2Result.atV60.F_req} кН`}
                    icon={<Zap size={15} />}
                    color="blue"
                  />
                  <SummaryCard
                    label="Скоррект. мощность"
                    value={`${step3Result.corrPower} кВт`}
                    note={parseFloat(step3Result.envFactor) < 0.999 ? `×${step3Result.envFactor}` : null}
                    icon={<TrendingUp size={15} />}
                    color={parseFloat(step3Result.envFactor) < 0.99 ? 'amber' : 'blue'}
                  />
                  <SummaryCard
                    label="Расход энергии"
                    value={`${step3Result.energyKWh} кВтч`}
                    note="на 100 км"
                    icon={<Zap size={15} />}
                    color="slate"
                  />
                  {step2Result.vEquilibrium && (
                    <SummaryCard
                      label="Равновесная скорость"
                      value={`${step2Result.vEquilibrium} км/ч`}
                      icon={<Train size={15} />}
                      color="green"
                    />
                  )}
                  {step3Result.cost && (
                    <SummaryCard
                      label="Стоимость поездки"
                      value={`${step3Result.cost.total} ₽`}
                      note="на 100 км"
                      icon={<DollarSign size={15} />}
                      color="amber"
                    />
                  )}
                </div>

                {/* Cost breakdown */}
                {step3Result.cost && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 flex-wrap">
                    <span className="text-xs text-gray-500">
                      Энергия: <strong className="text-gray-700">{step3Result.cost.energy} ₽</strong>
                    </span>
                    <span className="text-xs text-gray-500">
                      Обслуживание: <strong className="text-gray-700">{step3Result.cost.maintenance} ₽</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(AdvancedTractionCalculator)
