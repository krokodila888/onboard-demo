import {
  Train, Target, BarChart2,
  CheckCircle2, ArrowRight, Info, ChevronDown,
  BookOpen, Star, Play, Cpu, Zap, Lock,
  AlertCircle, Settings, List,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, color = 'text-blue-600', children }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`p-2 rounded-xl bg-white border border-gray-200 shadow-sm ${color}`}>
        <Icon size={18} />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{children}</h2>
    </div>
  )
}

function SubHeading({ children }) {
  return (
    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 mt-6 first:mt-0 flex items-center gap-2">
      <span className="w-1 h-4 bg-blue-500 rounded-full inline-block" />
      {children}
    </h3>
  )
}

function BulletItem({ children }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
      <ArrowRight size={14} className="text-blue-400 mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  )
}

function Callout({ icon: Icon = Info, color = 'blue', children }) {
  const map = {
    blue:  { wrap: 'bg-blue-50 border-blue-200',  icon: 'text-blue-500',  text: 'text-blue-800'  },
    green: { wrap: 'bg-green-50 border-green-200', icon: 'text-green-500', text: 'text-green-800' },
    amber: { wrap: 'bg-amber-50 border-amber-200', icon: 'text-amber-500', text: 'text-amber-800' },
  }
  const c = map[color] ?? map.blue
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${c.wrap}`}>
      <Icon size={15} className={`${c.icon} mt-0.5 shrink-0`} />
      <p className={`text-sm leading-relaxed ${c.text}`}>{children}</p>
    </div>
  )
}

function Code({ children }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px] border border-gray-200">
      {children}
    </code>
  )
}

function StarBadge({ value, max = 5 }) {
  if (value === null || value === undefined) return <span className="text-gray-300 text-xs">—</span>
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`text-[11px] ${i < value ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
      <span className="ml-1 text-[10px] text-gray-500 font-mono">{value}</span>
    </span>
  )
}

function Tag({ children, color = 'blue' }) {
  const map = {
    blue:   'bg-blue-100 text-blue-700',
    emerald:'bg-emerald-100 text-emerald-700',
    violet: 'bg-violet-100 text-violet-700',
    amber:  'bg-amber-100 text-amber-700',
    slate:  'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[color] ?? map.blue}`}>
      {children}
    </span>
  )
}

// ─── Section 1: Goal ──────────────────────────────────────────────────────────

function GoalSection() {
  return (
    <section>
      <SectionTitle icon={Target} color="text-blue-600">Цель демо-приложения</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info size={15} className="text-blue-500" />
            <span className="text-sm font-semibold text-gray-800">Что это?</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Демонстрационное приложение для <strong>сравнительного тестирования
            библиотек пользовательского онбординга</strong> применительно к
            специфике расчётного инженерного ПО.
          </p>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            В роли целевого приложения выступает калькулятор тяговых
            характеристик поезда — типичный представитель инженерного ПО
            с многошаговыми расчётами, формулами и графиками.
          </p>
        </div>

        {/* Why */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-amber-500" />
            <span className="text-sm font-semibold text-gray-800">Зачем нужно?</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Выявить <strong>сильные и слабые стороны</strong> существующих решений
            для последующей разработки специализированной библиотеки онбординга,
            ориентированной на инженерное и научное ПО.
          </p>
          <ul className="mt-3 space-y-1.5">
            {[
              'Оценить простоту интеграции в React-проект',
              'Проверить точность позиционирования подсказок',
              'Измерить пригодность для сложных форм с расчётами',
            ].map(t => (
              <BulletItem key={t}>{t}</BulletItem>
            ))}
          </ul>
        </div>

        {/* Legacy tab */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Вкладка «Реальное ПО»</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Специальная вкладка с <strong>намеренно ухудшенным интерфейсом</strong> — реконструкция
            типичного устаревшего инженерного ПО без какого-либо онбординга. Содержит семь
            UX-антипаттернов: невнятные аббревиатуры, бесполезные подсказки, молчаливая блокировка
            кнопки, ложные сообщения об ошибках, скрытые зависимости полей и визуальный хаос.
          </p>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Цель — создать контрольную точку отсчёта: показать, <em>насколько плохим</em> может
            быть интерфейс без онбординга, чтобы тестируемые библиотеки оценивались не в вакууме,
            а в сравнении с реальной проблемой.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Section 2: Simulated features ───────────────────────────────────────────

function FeaturesSection() {
  return (
    <section>
      <SectionTitle icon={Cpu} color="text-violet-600">Имитируемые функции и процессы</SectionTitle>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-6">

        {/* Calculator description */}
        <div>
          <SubHeading>Что представляет собой демо-калькулятор</SubHeading>
          <ul className="space-y-2 mb-3">
            <BulletItem>
              <strong>Расчёт тяговых характеристик электровоза</strong> — типичная задача в железнодорожной отрасли, требующая ввода многочисленных параметров и интерпретации технических результатов
            </BulletItem>
            <BulletItem>
              <strong>Реалистичные параметры:</strong> масса состава, уклон пути, радиус кривых, коэффициенты сопротивления движению, условия окружающей среды
            </BulletItem>
            <BulletItem>
              <strong>Упрощённые формулы</strong> по ПТР (Правилам тяговых расчётов) — для демонстрации интерфейса, не для реального проектирования
            </BulletItem>
          </ul>
          <ul className="space-y-2 mb-3">
            <BulletItem>
              <strong>Намеренные UX-антипаттерны legacy-интерфейса (вкладка «Реальное ПО»)</strong> — невнятные аббревиатуры, бесполезные тултипы, молчаливая блокировка кнопки, ложные ошибки, скрытые зависимости полей — создают эталонный «плохой интерфейс» для сравнения
            </BulletItem>
          </ul>
          <Callout color="amber" icon={Info}>
            Приложение намеренно создаёт условия, сложные для онбординга: многошаговый ввод,
            зависимые поля, динамические графики и условные секции — именно там традиционные
            библиотеки часто дают сбои.
          </Callout>
        </div>

        {/* Multi-step */}
        <div>
          <SubHeading>Многошаговый процесс расчёта</SubHeading>
          <div className="space-y-2 mb-3">
            {[
              {
                n: '1',
                title: 'Базовые параметры локомотива',
                desc: 'Выбор серии, масса состава — определяют отправную точку расчёта',
                color: 'bg-blue-100 text-blue-700',
              },
              {
                n: '2',
                title: 'Тяговые характеристики',
                desc: 'Уклон, кривые, расширенные физические параметры — строится график F(v)',
                color: 'bg-violet-100 text-violet-700',
              },
              {
                n: '3',
                title: 'Эксплуатационные и экономические показатели',
                desc: 'Условия среды, стоимость энергии и обслуживания — итоговая сводка',
                color: 'bg-green-100 text-green-700',
              },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${s.color}`}>
                  {s.n}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Callout color="blue" icon={Lock}>
            Каждый шаг разблокируется только после успешного завершения предыдущего — имитация
            последовательных этапов реального инженерного расчёта, где результаты одного
            шага являются входными данными для следующего.
          </Callout>
        </div>

        {/* Progressive disclosure */}
        <div>
          <SubHeading>Прогрессивное раскрытие (Progressive Disclosure)</SubHeading>
          <ul className="space-y-2 mb-3">
            <BulletItem>
              Расширенные параметры скрыты в <strong>раскрывающихся секциях</strong> — интерфейс не перегружен сразу
            </BulletItem>
            <BulletItem>
              По умолчанию используются <strong>базовые значения</strong> (стандарты ПТР), что обеспечивает мгновенный результат
            </BulletItem>
            <BulletItem>
              Пользователь <strong>включает детальные расчёты</strong> через чекбокс внутри секции
            </BulletItem>
          </ul>

          {/* Example collapsibles */}
          <div className="space-y-2">
            {[
              {
                title: 'Расширенные физические параметры',
                desc: 'Коэффициенты сопротивления качению и воздуха (a₀, a₂)',
              },
              {
                title: 'Условия окружающей среды',
                desc: 'Температура воздуха, высота над уровнем моря, погодные условия',
              },
              {
                title: 'Экономические параметры',
                desc: 'Стоимость электроэнергии (₽/кВтч) и обслуживания (₽/км)',
              },
            ].map(ex => (
              <div
                key={ex.title}
                className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5"
              >
                <ChevronDown size={14} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{ex.title}</p>
                  <p className="text-[11px] text-gray-400 truncate">{ex.desc}</p>
                </div>
                <span className="ml-auto shrink-0 text-[10px] text-gray-400 font-medium">(базовые значения)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visualization */}
        <div>
          <SubHeading>Визуализация данных</SubHeading>
          <ul className="space-y-2 mb-3">
            <BulletItem>
              <strong>График тяговой характеристики F(v)</strong> — зависимость силы тяги и суммарного сопротивления от скорости, с отображением равновесной скорости
            </BulletItem>
            <BulletItem>
              Строится в реальном времени по результатам Шага 2
            </BulletItem>
            <BulletItem>
              Реализован на <strong>SVG</strong> — типичный подход для технических графиков в веб-приложениях, без внешних зависимостей
            </BulletItem>
          </ul>
          <Callout color="green" icon={BarChart2}>
            Динамический график — один из ключевых вызовов для онбординг-библиотек: подсказка должна
            корректно позиционироваться относительно элемента, который появляется только после
            выполнения расчёта.
          </Callout>
        </div>
      </div>
    </section>
  )
}

// ─── Section 3: Libraries ─────────────────────────────────────────────────────

const LIBRARIES = [
  {
    name: 'Intro.js',
    version: 'v8.3',
    color: 'amber',
    tags: ['Highlight', 'data-атрибуты'],
    desc: 'Классическая библиотека 2013 года. Выделяет элементы overlay-слоем с подсказкой. Минимальная настройка через data-атрибуты.',
    strengths: ['Простой старт', 'Широкая документация'],
    weaknesses: ['Слабая поддержка React', 'Базовое позиционирование'],
    components: ['Онбординг-тур', 'Hints (постоянные маркеры)'],
  },
  {
    name: 'Shepherd.js',
    version: 'v15.2',
    color: 'emerald',
    tags: ['Floating UI', 'Кастомизация', 'Framework-agnostic'],
    desc: 'Мощная и гибкая библиотека с Floating UI под капотом. Поддерживает сложные сценарии и кастомный рендеринг шагов.',
    strengths: ['Точное позиционирование', 'Богатый Events API'],
    weaknesses: ['Больше кода для настройки', 'Тяжелее бандл'],
    components: ['Онбординг-тур', 'Модальные шаги без привязки'],
  },
  {
    name: 'Driver.js',
    version: 'v1.4',
    color: 'violet',
    tags: ['Spotlight', 'Современный API', 'Без зависимостей'],
    desc: 'Современная лёгкая библиотека. Spotlight-эффект с затемнением фона чётко выделяет целевые элементы. Минималистичный API.',
    strengths: ['Spotlight-эффект', 'Нет зависимостей'],
    weaknesses: ['HTML в description — только через хук', 'Меньше возможностей кастомизации'],
    components: ['Онбординг-тур', 'Одиночная подсветка (highlight)'],
  },
  {
    name: 'React Joyride',
    version: 'v2.x',
    color: 'blue',
    tags: ['React-нативный', 'State-driven', 'TypeScript'],
    desc: 'React-нативная библиотека. Управляется через state и props — идеально вписывается в React-архитектуру. Поддерживает TypeScript.',
    strengths: ['Нативный React state', 'Компонентная модель'],
    weaknesses: ['Только для React', 'Требует useState'],
    components: ['Онбординг-тур', 'Beacon-режим (справка по полям)'],
  },
  {
    name: 'Tippy.js',
    version: 'v6.3',
    color: 'orange',
    tags: ['Tooltip', 'Popover', 'Hover/Click', 'Popper-based'],
    desc: 'Специализированная библиотека тултипов и поповеров. Не предназначена для туров — фокус на контекстной справке по отдельным элементам. Используется в Bootstrap 5, Material-UI.',
    strengths: ['Лёгкая интеграция', 'Богатые триггеры и анимации'],
    weaknesses: ['Не для туров', 'Требует ручной организации сценариев'],
    components: ['Контекстные тултипы (hover/focus)', 'Интерактивный поповер (click)'],
  },
  {
    name: 'Floating UI',
    version: 'v0.27',
    color: 'purple',
    tags: ['Движок', 'Позиционирование', 'Low-level', 'Без UI'],
    desc: 'Низкоуровневый движок позиционирования. Не UI-библиотека — используется как основа для кастомных компонентов и других библиотек (Shepherd.js, Radix UI, MUI). Прямой аналог Popper.js, но современнее.',
    strengths: ['Максимальная гибкость', 'Точное позиционирование', 'Tree-shakeable'],
    weaknesses: ['Требует написания UI с нуля', 'Выше порог входа'],
    components: ['Кастомный CustomTooltip (исходный код в src/)', 'Portal-рендеринг (FloatingPortal)'],
  },
]

const TAG_COLORS = { amber: 'amber', emerald: 'emerald', violet: 'violet', blue: 'blue', orange: 'amber', purple: 'violet' }

function LibrariesSection() {
  return (
    <section>
      <SectionTitle icon={BookOpen} color="text-emerald-600">Тестируемые библиотеки</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {LIBRARIES.map(lib => (
          <div key={lib.name} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-sm font-bold text-gray-900">{lib.name}</p>
                <p className="text-xs text-gray-400">{lib.version}</p>
              </div>
              <div className="flex flex-wrap gap-1 justify-end">
                {lib.tags.map(t => (
                  <Tag key={t} color={TAG_COLORS[lib.color]}>{t}</Tag>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">{lib.desc}</p>
            {lib.components && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">Реализованные компоненты</p>
                <div className="flex flex-wrap gap-1">
                  {lib.components.map(c => (
                    <span key={c} className="flex items-center gap-0.5 text-[11px] text-gray-700">
                      <CheckCircle2 size={10} className="text-blue-400 shrink-0" />
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-1">Плюсы</p>
                {lib.strengths.map(s => (
                  <div key={s} className="flex items-start gap-1 mb-0.5">
                    <CheckCircle2 size={11} className="text-green-400 mt-0.5 shrink-0" />
                    <span className="text-[11px] text-gray-600">{s}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-1">Минусы</p>
                {lib.weaknesses.map(w => (
                  <div key={w} className="flex items-start gap-1 mb-0.5">
                    <span className="text-red-300 mt-0.5 shrink-0 text-[10px] leading-none">✕</span>
                    <span className="text-[11px] text-gray-600">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Section 4: Criteria table ────────────────────────────────────────────────

const CRITERIA_ROWS = [
  {
    name: 'Простота интеграции',
    scale: '1–5',
    desc: 'Сколько кода потребовалось? Понятна ли документация? Нужны ли обёртки?',
    scores: { introjs: 4, shepherd: 3, driver: 4, joyride: 4, tippy: 5, floating: 2 },
  },
  {
    name: 'Качество позиционирования',
    scale: '1–5',
    desc: 'Корректно ли работает auto-flip? Работает ли со скроллом и viewport?',
    scores: { introjs: 3, shepherd: 5, driver: 4, joyride: 4, tippy: 4, floating: 5 },
  },
  {
    name: 'Поддержка многошаговых процессов',
    scale: '1–5',
    desc: 'Можно ли создать условные переходы? Работают ли disabled-элементы как цели?',
    scores: { introjs: 2, shepherd: 4, driver: 3, joyride: 5, tippy: 1, floating: 3 },
  },
  {
    name: 'Работа с нестандартными элементами',
    scale: '1–5',
    desc: (
      <>SVG-графики, <Code>&lt;select&gt;</Code>, раскрывающиеся секции</>
    ),
    scores: { introjs: 2, shepherd: 4, driver: 4, joyride: 4, tippy: 4, floating: 5 },
  },
  {
    name: 'Размер bundle',
    scale: 'кБ (min)',
    desc: 'Реальный размер после сборки без gzip-сжатия',
    scores: { introjs: '≈ 70 кБ', shepherd: '≈ 200 кБ', driver: '≈ 14 кБ', joyride: '≈ 65 кБ', tippy: '≈ 15 кБ', floating: '≈ 12 кБ' },
    isText: true,
  },
  {
    name: 'Документация',
    scale: '1–5',
    desc: 'Полнота, актуальность, наличие примеров для React',
    scores: { introjs: 4, shepherd: 4, driver: 5, joyride: 4, tippy: 4, floating: 5 },
  },
  {
    name: 'Пригодность для расчётного ПО',
    scale: '1–5',
    desc: 'Общая оценка применимости к инженерным расчётным интерфейсам',
    scores: { introjs: 3, shepherd: 4, driver: 4, joyride: 5, tippy: 3, floating: 4 },
  },
]

const LIB_COLS = [
  { key: 'introjs',   label: 'Intro.js',   color: 'text-amber-600'   },
  { key: 'shepherd',  label: 'Shepherd',   color: 'text-emerald-600' },
  { key: 'driver',    label: 'Driver.js',  color: 'text-violet-600'  },
  { key: 'joyride',   label: 'Joyride',    color: 'text-blue-600'    },
  { key: 'tippy',     label: 'Tippy.js',   color: 'text-orange-600'  },
  { key: 'floating',  label: 'Float. UI',  color: 'text-purple-600'  },
]

function CriteriaSection() {
  return (
    <section>
      <SectionTitle icon={Star} color="text-amber-500">Критерии оценки библиотек</SectionTitle>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed">
            После тестирования каждой библиотеки заполните таблицу сравнения.
            Шкала <strong>1–5</strong>: 1 — неприемлемо, 3 — удовлетворительно, 5 — отлично.
            Предзаполненные оценки основаны на результатах интеграции в данном проекте.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">
                  Критерий
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Что оценивается
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16">
                  Шкала
                </th>
                {LIB_COLS.map(c => (
                  <th key={c.key} className={`text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide w-24 ${c.color}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CRITERIA_ROWS.map((row, i) => (
                <tr
                  key={row.name}
                  className={`border-t border-gray-100 hover:bg-blue-50/30 transition-colors ${
                    i % 2 === 1 ? 'bg-gray-50/40' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-800 text-sm align-top">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 leading-relaxed align-top">
                    {row.desc}
                  </td>
                  <td className="px-3 py-3 text-center align-top">
                    <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      {row.scale}
                    </span>
                  </td>
                  {LIB_COLS.map(c => (
                    <td key={c.key} className="px-3 py-3 text-center align-top">
                      {row.isText
                        ? <span className="text-xs font-mono text-gray-600">{row.scores[c.key]}</span>
                        : <StarBadge value={row.scores[c.key]} />
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            * Оценки субъективны и основаны на использовании в данном конкретном проекте.
            Ваши результаты могут отличаться в зависимости от задачи.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Section 5: Testing process ───────────────────────────────────────────────

const TESTING_STEPS = [
  {
    n: 0,
    title: '(Рекомендуется) Начните с вкладки «Реальное ПО»',
    desc: (
      <>
        Откройте вкладку <strong>«Реальное ПО»</strong> и попробуйте выполнить расчёт
        самостоятельно. Затем нажмите <Code>Показать разбор проблем</Code>, чтобы увидеть,
        какие UX-антипаттерны были намеренно встроены в интерфейс. Это создаст точку отсчёта:
        насколько лучше работают тестируемые библиотеки онбординга по сравнению с отсутствием
        какой-либо помощи пользователю.
      </>
    ),
    sub: null,
  },
  {
    n: 1,
    title: 'Выбрать таб с библиотекой',
    desc: 'Переключайтесь между «Intro.js», «Shepherd.js», «Driver.js» и «React Joyride» в шапке страницы.',
    sub: null,
  },
  {
    n: 2,
    title: 'Нажать «Запустить тур» в информационном баннере',
    desc: 'Кнопка расположена в правой части цветного баннера под панелью вкладок.',
    sub: null,
  },
  {
    n: 3,
    title: 'Изучить дополнительный компонент библиотеки',
    desc: 'Нажмите вторую кнопку в баннере вкладки (рядом с «Запустить тур»). Каждая библиотека демонстрирует возможности, выходящие за рамки стандартного тура: Hints, модальные шаги, одиночная подсветка или Beacon-режим.',
    sub: null,
  },
  {
    n: 4,
    title: 'Пройти весь тур, обращая внимание на:',
    desc: null,
    sub: [
      'Корректность позиционирования tooltip относительно целевого элемента',
      'Работу spotlight / highlighting — насколько чётко выделен элемент',
      'Поведение на disabled-элементах (заблокированные шаги 2 и 3)',
      'Работу с раскрывающимися секциями — видна ли подсказка при свёрнутой секции',
    ],
  },
  {
    n: 5,
    title: 'Попробовать выполнить расчёт под руководством тура',
    desc: (
      <>
        Заполните Шаг 1 (выбор локомотива + масса состава) прямо во время тура.
        Нажмите <Code>Рассчитать базовые параметры</Code> — оцените, продолжает ли тур корректно работать.
      </>
    ),
    sub: null,
  },
  {
    n: 6,
    title: 'Открыть раскрывающиеся секции — как библиотека реагирует?',
    desc: (
      <>
        Раскройте <Code>Расширенные физические параметры</Code> в Шаге 2.
        Оцените, корректно ли перепозиционируется tooltip после изменения высоты страницы.
      </>
    ),
    sub: null,
  },
  {
    n: 7,
    title: 'Заполнить секцию «Заметки для сравнения» внизу страницы',
    desc: 'Карточки с оценками отображаются под калькулятором для каждой библиотеки (кроме «Без онбординга»).',
    sub: null,
  },
  {
    n: 8,
    title: 'Зафиксировать проблемы и находки',
    desc: 'Обратитесь к секции «Типичные проблемы» на этой странице — она поможет структурировать наблюдения.',
    sub: null,
  },
]

function TestingProcessSection() {
  return (
    <section>
      <SectionTitle icon={List} color="text-blue-600">Процесс тестирования</SectionTitle>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="space-y-5">
          {TESTING_STEPS.map(s => (
            <div key={s.n} className="flex items-start gap-4">
              {/* Step number */}
              <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${s.n === 0 ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white'}`}>
                {s.n === 0 ? '★' : s.n}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{s.title}</p>

                {s.desc && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
                )}

                {s.sub && (
                  <ul className="mt-2 space-y-1.5 pl-1">
                    {s.sub.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                        <ArrowRight size={11} className="text-blue-300 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <Callout color="blue" icon={Info}>
            Вкладка «Без онбординга» является контрольной группой — тот же интерфейс
            без подсказок. Сначала попробуйте разобраться с ней самостоятельно,
            чтобы понять, насколько ПО интуитивно без онбординга.
          </Callout>
        </div>
      </div>
    </section>
  )
}

// ─── Section 6: Typical problems ─────────────────────────────────────────────

const PROBLEMS = [
  {
    title: 'Tooltip обрезается краем экрана',
    desc: (
      <>
        Не работает <Code>auto-flip</Code> — подсказка уходит за пределы viewport вместо
        того, чтобы переключиться на противоположную сторону от элемента.
      </>
    ),
  },
  {
    title: 'Spotlight не полностью покрывает элемент',
    desc: 'Подсветка захватывает только часть поля ввода или select-а, создавая визуальный дискомфорт.',
  },
  {
    title: 'Тур не запускается на disabled-элементе',
    desc: (
      <>
        Шаги 2 и 3 заблокированы (<Code>opacity-60</Code>, <Code>pointer-events-none</Code>).
        Некоторые библиотеки не могут сфокусироваться на таких элементах.
      </>
    ),
  },
  {
    title: 'Tooltip не появляется на свёрнутой секции',
    desc: 'Если раскрывашка закрыта, целевой элемент внутри неё скрыт. Библиотека должна либо раскрыть её, либо перейти к следующему шагу.',
  },
  {
    title: <>Проблемы с позиционированием на <Code>&lt;select&gt;</Code></>,
    desc: 'Нативные select-элементы имеют нестандартное поведение в разных браузерах, что может сбивать позиционирование tooltip.',
  },
  {
    title: 'Tooltip перекрывает целевой элемент',
    desc: 'Подсказка полностью закрывает поле ввода, которое описывает — пользователь не может видеть элемент и tooltip одновременно.',
  },
  {
    title: 'Нет поддержки keyboard navigation',
    desc: (
      <>
        Пользователь не может переходить между шагами клавишами{' '}
        <Code>Tab</Code> / <Code>←</Code> / <Code>→</Code> / <Code>Esc</Code> — критично для accessibility.
      </>
    ),
  },
  {
    title: 'Тур ломается при изменении DOM',
    desc: 'После раскрытия секции или появления новых элементов (график после расчёта) библиотека теряет позицию и не может скорректировать tooltip.',
  },
  {
    title: 'Tippy.js: отсутствие сценарной логики',
    desc: 'Tippy.js не управляет последовательностью подсказок. Разработчик обязан самостоятельно реализовать любую логику порядка, условий показа и прогресса — библиотека лишь позиционирует поповер.',
  },
  {
    title: 'Floating UI: весь UI — ответственность разработчика',
    desc: 'Floating UI не предоставляет визуальных компонентов. Стили, анимации, кнопки навигации, оверлей, spotlight — всё реализуется вручную. Это мощно, но требует значительных трудозатрат.',
  },
]

function ProblemsSection() {
  return (
    <section>
      <SectionTitle icon={AlertCircle} color="text-red-500">
        Типичные проблемы, на которые стоит обратить внимание
      </SectionTitle>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          При тестировании каждой библиотеки проверьте наличие следующих проблем.
          Они особенно актуальны для инженерного ПО с динамичным интерфейсом.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROBLEMS.map((p, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 hover:border-red-200 transition-colors"
            >
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 leading-snug">{p.title}</p>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Callout color="amber" icon={Settings}>
            Не все проблемы проявляются в каждой библиотеке. Задача — методично проверить
            каждый пункт и зафиксировать результат. Именно совокупность мелких сбоев
            определяет пригодность инструмента для сложного ПО.
          </Callout>
        </div>
      </div>
    </section>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="space-y-10">

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl px-6 py-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 rounded-xl p-2.5">
            <Train size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-200 uppercase tracking-widest">
              ВКР — Сравнительное тестирование
            </p>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">
              Railway Onboard Demo
            </h1>
          </div>
        </div>
        <p className="text-sm sm:text-base text-blue-100 leading-relaxed max-w-2xl">
          Демонстрационная среда для сравнения библиотек пользовательского онбординга
          применительно к специфике <strong className="text-white">расчётного инженерного ПО</strong>.
          Роль прикладного ПО выполняет калькулятор тяговых характеристик поезда.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['React 18 + Vite 6', 'Tailwind CSS', 'Intro.js', 'Shepherd.js', 'Driver.js', 'React Joyride'].map(t => (
            <span key={t} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/15 text-white border border-white/20">
              {t}
            </span>
          ))}
        </div>
      </div>

      <GoalSection />
      <FeaturesSection />
      <LibrariesSection />
      {/* <CriteriaSection /> */}
      <TestingProcessSection />
      <ProblemsSection />
    </div>
  )
}
