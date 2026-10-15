import { useEffect, useRef, useState } from 'react'

function parse(value: string): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  const [h, m] = (value || '00:00').split(':').map(Number)
  const hour = Number.isFinite(h) ? h : 0
  const minute = Number.isFinite(m) ? m : 0
  const period: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return { hour12, minute, period }
}

function toValue(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  const hour24 = period === 'AM' ? (hour12 === 12 ? 0 : hour12) : hour12 === 12 ? 12 : hour12 + 12
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const inputClass =
  'w-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-1.5 py-1 text-center text-sm text-[var(--color-text-primary)] disabled:opacity-50'
const selectClass =
  'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-1.5 py-1 text-sm text-[var(--color-text-primary)] disabled:opacity-50'

export function TimeInput12h({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const parsed = parse(value)
  const [hourText, setHourText] = useState(String(parsed.hour12))
  const [minuteText, setMinuteText] = useState(String(parsed.minute).padStart(2, '0'))
  const [period, setPeriod] = useState<'AM' | 'PM'>(parsed.period)
  const hourFocused = useRef(false)
  const minuteFocused = useRef(false)

  useEffect(() => {
    const p = parse(value)
    if (!hourFocused.current) setHourText(String(p.hour12))
    if (!minuteFocused.current) setMinuteText(String(p.minute).padStart(2, '0'))
    setPeriod(p.period)
  }, [value])

  const commit = (hourStr: string, minuteStr: string, nextPeriod: 'AM' | 'PM') => {
    const h = parseInt(hourStr, 10)
    const m = parseInt(minuteStr, 10)
    if (!Number.isFinite(h) || h < 1 || h > 12) return
    if (!Number.isFinite(m) || m < 0 || m > 59) return
    onChange(toValue(h, m, nextPeriod))
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={hourText}
        disabled={disabled}
        onFocus={() => {
          hourFocused.current = true
        }}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 2)
          setHourText(v)
          commit(v, minuteText, period)
        }}
        onBlur={() => {
          hourFocused.current = false
          let h = parseInt(hourText, 10)
          if (!Number.isFinite(h) || h < 1) h = 1
          if (h > 12) h = 12
          setHourText(String(h))
          commit(String(h), minuteText, period)
        }}
        className={inputClass}
        aria-label="Hour"
      />
      <span className="text-[var(--color-text-secondary)]">:</span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={minuteText}
        disabled={disabled}
        onFocus={() => {
          minuteFocused.current = true
        }}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 2)
          setMinuteText(v)
          commit(hourText, v, period)
        }}
        onBlur={() => {
          minuteFocused.current = false
          let m = parseInt(minuteText, 10)
          if (!Number.isFinite(m) || m < 0) m = 0
          if (m > 59) m = 59
          const padded = String(m).padStart(2, '0')
          setMinuteText(padded)
          commit(hourText, padded, period)
        }}
        className={inputClass}
        aria-label="Minute"
      />
      <select
        value={period}
        disabled={disabled}
        onChange={(e) => {
          const p = e.target.value as 'AM' | 'PM'
          setPeriod(p)
          commit(hourText, minuteText, p)
        }}
        className={selectClass}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </span>
  )
}
