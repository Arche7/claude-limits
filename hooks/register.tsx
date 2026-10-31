import { atom, read, update } from 'claude-code'
import type { Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Look, Meter, Meters } from '../types'
import { SKINS, THEMES, cardSvg, mascotIcon, moodFor, tone } from './art'
import type { CardRow, SkinId, ThemeId } from './art'

const PLUGIN = 'limits-band'
const PANE = 'limits-pane'

// Тег shape отбрасывает значения, сохранённые прошлой версией мода
const meters = atom({ plugin: 'limits-band', key: 'meters' } as const, null, { shape: 'meters-2' })
const soundOn = atom({ plugin: 'limits-band', key: 'soundOn' } as const, true)
const isHidden = atom({ plugin: 'limits-band', key: 'isHidden' } as const, false)
const look = atom({ plugin: 'limits-band', key: 'look' } as const, { theme: 'classic', skin: 'classic' })

const LABELS: Record<string, string> = {
  context: 'Контекст',
  five_hour: '5 часов',
  seven_day: 'Неделя',
  spend_limit: 'Бюджет',
}

const CHIME = { asset: 'sounds/done.wav' } as const
const isThemeId = (v: string): v is ThemeId => THEMES.some(t => t.id === v)
const isSkinId = (v: string): v is SkinId => SKINS.some(s => s.id === v)

function toMeters(context: SessionContextUsage, limits: SessionRateLimit[], costUsd?: number): Meters {
  return {
    context:
      context.percent === undefined
        ? null
        : { kind: 'context', percent: context.percent, tokens: context.tokens, window: context.window },
    limits: limits.map(l => ({ kind: l.kind, percent: l.percentUsed, resetsAt: l.resetsAt })),
    costUsd,
  }
}

function untilReset(iso: string | undefined, now: number): string {
  if (!iso) return ''
  const ms = Date.parse(iso) - now
  if (!(ms > 0)) return ''
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min} мин`
  const h = Math.floor(min / 60)
  if (h < 48) return `${h} ч ${min % 60} мин`
  return `${Math.floor(h / 24)} дн ${h % 24} ч`
}

const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))

function barSvg(percent: number): string {
  const w = 76
  const fill = (Math.max(0, Math.min(100, percent)) / 100) * w
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="6" viewBox="0 0 ${w} 6">` +
    `<rect width="${w}" height="6" rx="3" fill="rgba(128,128,128,0.22)"/>` +
    (fill > 0 ? `<rect width="${Math.max(fill, 6).toFixed(1)}" height="6" rx="3" fill="${tone(percent)}"/>` : '') +
    `</svg>`
  )
}

function barText(percent: number): string {
  const on = Math.round((Math.max(0, Math.min(100, percent)) / 100) * 10)
  return '▰'.repeat(on) + '▱'.repeat(10 - on)
}

function allItems(m: Meters): Meter[] {
  return [...(m.context ? [m.context] : []), ...m.limits]
}

/** Главная шкала: окно 5 часов, если есть, иначе контекст. */
function mainMeter(m: Meters): Meter | null {
  return m.limits.find(l => l.kind === 'five_hour') ?? m.context ?? m.limits[0] ?? null
}

function currentLook(l: Look): { theme: ThemeId; skin: SkinId } {
  return { theme: isThemeId(l.theme) ? l.theme : 'classic', skin: isSkinId(l.skin) ? l.skin : 'classic' }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({ name: 'limits', description: 'Открыть панель лимитов (или /limits hide — спрятать полоску)' })

    // Сохранённые настройки — между сессиями
    try {
      const saved = await $.store.get('look')
      const sound = await $.store.get('soundOn')
      if (saved && typeof saved === 'object') {
        const s = saved as Partial<Look>
        await update($, look, () => ({ theme: String(s.theme ?? 'classic'), skin: String(s.skin ?? 'classic') }))
      } else {
        // Без выбора пользователя: в октябре — хэллоуинская тема с паучком
        const month = new Date(await $.clock.now()).getMonth()
        if (month === 9) await update($, look, () => ({ theme: 'halloween', skin: 'spider' }))
      }
      if (typeof sound === 'boolean') await update($, soundOn, () => sound)
    } catch {}

    try {
      const u = await $.session.usage()
      await update($, meters, () => toMeters(u.context, u.rateLimits, u.cost?.usd))
    } catch {}
    return result
  })

  on('session.measure', async ($, e, next) => {
    await update($, meters, () => toMeters(e.context, e.rateLimits, e.cost?.usd))
    return next(e)
  })

  // Глубокий перезвон, когда основной ответ готов (не для субагентов и не при прерывании)
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (!e.agentId && e.reason === 'answer' && (await read($, soundOn))) {
      $.audio.play(CHIME, { gain: 0.9 }).catch(() => {})
    }
    return result
  })

  /* ───────────── Компактная полоска над вводом ───────────── */
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const m = await read($, meters)
    if (e.props.hasSurvey || (await read($, isHidden)) || m === null) return next(e)
    const items = allItems(m)
    if (items.length === 0) return next(e)

    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const hasSvg = e.surface !== 'terminal' && 'Svg' in ui
    const now = await $.clock.now()
    const sound = await read($, soundOn)
    const { skin } = currentLook(await read($, look))
    const peak = Math.max(...items.map(i => i.percent))

    return (
      <Box flexDirection="row" flexWrap="wrap" alignItems="center" columnGap={2} rowGap={0}>
        {hasSvg && 'Svg' in ui ? (
          <ui.Svg source={mascotIcon(skin, moodFor(peak), tone(peak))} alt="Токи" width={24} height={19.5} />
        ) : null}
        {items.map(it => {
          const label = LABELS[it.kind] ?? it.kind
          const pct = Math.round(it.percent)
          const reset = untilReset(it.resetsAt, now)
          return (
            <Box key={it.kind} flexDirection="row" alignItems="center" gap={1}>
              <Text dimColor size="footnote">{label}</Text>
              {hasSvg && 'Svg' in ui ? (
                <ui.Svg source={barSvg(it.percent)} alt={`${label}: ${pct}%`} width={76} height={6} />
              ) : (
                <Text color={tone(it.percent)}>{barText(it.percent)}</Text>
              )}
              <Text size="footnote" weight="medium" color={it.percent >= 85 ? 'error' : undefined}>
                {pct}%
              </Text>
              {reset ? <Text dimColor size="caption">↻ {reset}</Text> : null}
            </Box>
          )
        })}
        <Button
          key="sound"
          label={sound ? '🔔' : '🔕'}
          onPress={async () => {
            const turnOn = !(await read($, soundOn))
            await update($, soundOn, () => turnOn)
            await $.store.set('soundOn', turnOn)
            if (turnOn) $.audio.play(CHIME, { gain: 0.9 }).catch(() => {})
          }}
        />
        <Button key="panel" label="Панель" onPress={() => $.ui.open({ id: PANE, title: 'Лимиты' })} />
        <Button key="hide" label="Скрыть" onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })

  /* ───────────── Панель с карточкой ───────────── */
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const m = await read($, meters)
    const l = currentLook(await read($, look))
    const sound = await read($, soundOn)
    const now = await $.clock.now()

    const cycle = async (kind: 'theme' | 'skin') => {
      const list: readonly { id: string }[] = kind === 'theme' ? THEMES : SKINS
      const cur = await read($, look)
      const i = list.findIndex(x => x.id === cur[kind])
      const nextId = list[(i + 1) % list.length]?.id ?? list[0]!.id
      const nl = { ...cur, [kind]: nextId }
      await update($, look, () => nl)
      await $.store.set('look', nl)
    }

    const controls = (
      <Box flexDirection="row" flexWrap="wrap" gap={1} marginTop={1}>
        <Button key="theme" label={`Тема: ${THEMES.find(t => t.id === l.theme)?.name}`} onPress={() => cycle('theme')} />
        <Button key="skin" label={`Скин: ${SKINS.find(s => s.id === l.skin)?.name}`} onPress={() => cycle('skin')} />
        <Button
          key="sound"
          label={sound ? '🔔 Звук' : '🔕 Звук'}
          onPress={async () => {
            const turnOn = !(await read($, soundOn))
            await update($, soundOn, () => turnOn)
            await $.store.set('soundOn', turnOn)
            if (turnOn) $.audio.play(CHIME, { gain: 0.9 }).catch(() => {})
          }}
        />
      </Box>
    )

    const main = m ? mainMeter(m) : null
    if (!m || !main) {
      return (
        <Box flexDirection="column">
          <Text dimColor>Цифры появятся после первого ответа в этой сессии.</Text>
          {controls}
        </Box>
      )
    }

    const rows: CardRow[] = []
    for (const lim of m.limits) {
      if (lim === main) continue
      const r = untilReset(lim.resetsAt, now)
      rows.push({ label: LABELS[lim.kind] ?? lim.kind, percent: lim.percent, right: `${Math.round(lim.percent)}%${r ? ` · ${r}` : ''}` })
    }
    if (m.context && main !== m.context) {
      const c = m.context
      rows.push({
        label: 'Контекст',
        percent: c.percent,
        right: `${Math.round(c.percent)}%${c.tokens ? ` · ${k(c.tokens)} / ${k(c.window)}` : ''}`,
      })
    }
    const reset = untilReset(main.resetsAt, now)
    const peak = Math.max(...allItems(m).map(i => i.percent))
    const big = {
      label: LABELS[main.kind] ?? main.kind,
      percent: main.percent,
      sub: reset ? `сброс через ${reset}` : main.kind === 'context' ? 'заполненность этого чата' : '',
    }
    const footer = m.costUsd !== undefined ? `Сессия · $${m.costUsd.toFixed(2)}` : 'Сессия активна'

    if (e.surface === 'terminal' || !('Svg' in ui)) {
      return (
        <Box flexDirection="column">
          <Text>
            {big.label}: <Text color={tone(big.percent)}>{barText(big.percent)} {Math.round(big.percent)}%</Text> {big.sub}
          </Text>
          {rows.map(r => (
            <Text>
              {r.label}: <Text color={tone(r.percent)}>{barText(r.percent)}</Text> {r.right}
            </Text>
          ))}
          {controls}
        </Box>
      )
    }

    const svg = cardSvg({ title: 'Лимиты Claude', big, rows, footer, theme: l.theme, skin: l.skin, mood: moodFor(peak) })
    return (
      <Box flexDirection="column">
        <ui.Svg source={svg} alt={`${big.label}: ${Math.round(big.percent)}%. ${rows.map(r => `${r.label}: ${r.right}`).join('. ')}`} width={320} isInteractive />
        {controls}
      </Box>
    )
  })

  on('command.run', { command: 'limits' }, async ($, e) => {
    if (/hide|скрыть/i.test(e.args ?? '')) {
      const hidden = !(await read($, isHidden))
      await update($, isHidden, () => hidden)
      return { text: hidden ? 'Полоска лимитов скрыта. /limits hide — вернуть.' : 'Полоска лимитов снова видна.' }
    }
    await update($, isHidden, () => false)
    await $.ui.open({ id: PANE, title: 'Лимиты' })
    return { text: 'Панель лимитов открыта.' }
  })
}
