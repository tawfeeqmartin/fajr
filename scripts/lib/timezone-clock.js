// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

/**
 * Convert a clock time recorded in one zone into the local clock shown in
 * another zone for the same instant. This intentionally supports UTC/GMT
 * source clocks first, because the known Mawaqit UK yearly artifact is a
 * GMT-year-round embedded calendar being compared as Europe/London local time.
 */

const UTC_ZONE_NAMES = new Set(['UTC', 'Etc/UTC', 'GMT', 'Etc/GMT', 'Zulu'])

export function normalizeClockTimeForZone({ date, time, sourceTimeZone, targetTimeZone }) {
  if (!sourceTimeZone || !targetTimeZone || sourceTimeZone === targetTimeZone) return time
  if (!UTC_ZONE_NAMES.has(sourceTimeZone)) {
    throw new Error(`Unsupported source clock timezone: ${sourceTimeZone}; only UTC/GMT source clocks are supported`)
  }

  const parsed = parseDateAndTime(date, time)
  if (!parsed) return time
  const instant = new Date(Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour,
    parsed.minute,
    0,
  ))
  return formatClockInZone(instant, targetTimeZone)
}

function parseDateAndTime(date, time) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date))
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(String(time))
  if (!dateMatch || !timeMatch) return null

  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  if (hour > 23 || minute > 59) return null
  return { year, month, day, hour, minute }
}

function formatClockInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(date)
  const out = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const hour = String(Number(out.hour) % 24).padStart(2, '0')
  return `${hour}:${out.minute}`
}
