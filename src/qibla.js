// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Qibla direction calculation.
 *
 * Returns the bearing from a given location toward the Kaaba in Makkah.
 * Includes magnetic declination offset for compass use.
 */

const KAABA_LAT = 21.4225
const KAABA_LNG = 39.8262
const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

// 16-point compass — abbreviation + human-readable description.
// Boundaries computed at every 22.5° (360 / 16). See bearingToCardinal16 below.
const CARDINAL_16 = [
  { abbr: 'N',   description: 'North' },
  { abbr: 'NNE', description: 'North-northeast' },
  { abbr: 'NE',  description: 'Northeast' },
  { abbr: 'ENE', description: 'East-northeast' },
  { abbr: 'E',   description: 'East' },
  { abbr: 'ESE', description: 'East-southeast' },
  { abbr: 'SE',  description: 'Southeast' },
  { abbr: 'SSE', description: 'South-southeast' },
  { abbr: 'S',   description: 'South' },
  { abbr: 'SSW', description: 'South-southwest' },
  { abbr: 'SW',  description: 'Southwest' },
  { abbr: 'WSW', description: 'West-southwest' },
  { abbr: 'W',   description: 'West' },
  { abbr: 'WNW', description: 'West-northwest' },
  { abbr: 'NW',  description: 'Northwest' },
  { abbr: 'NNW', description: 'North-northwest' },
]

function bearingToCardinal16(bearing) {
  const normalised = ((bearing % 360) + 360) % 360
  return CARDINAL_16[Math.round(normalised / 22.5) % 16]
}

/**
 * Calculate Qibla bearing from a location.
 *
 * 🟢 Established: Great-circle bearing is the standard method for Qibla
 * direction, used by classical Islamic astronomers and modern institutions.
 *
 * @param {object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @returns {object} { bearing, magneticDeclination, trueBearing, cardinal, cardinalDescription }
 */
export function qibla({ latitude, longitude }) {
  const lat1 = latitude * DEG_TO_RAD
  const lat2 = KAABA_LAT * DEG_TO_RAD
  const deltaLng = (KAABA_LNG - longitude) * DEG_TO_RAD

  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) -
             Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

  const bearing = ((Math.atan2(y, x) * RAD_TO_DEG) + 360) % 360

  // Magnetic declination placeholder — full model requires WMM2024 data
  // TODO: integrate NOAA World Magnetic Model
  const magneticDeclination = 0
  const trueBearing = ((bearing + magneticDeclination + 360) % 360)
  const card = bearingToCardinal16(bearing)

  return {
    bearing: Math.round(bearing * 10) / 10,
    magneticDeclination,
    trueBearing: Math.round(trueBearing * 10) / 10,
    cardinal: card.abbr,
    cardinalDescription: card.description,
  }
}
