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

/**
 * Calculate Qibla bearing from a location.
 *
 * 🟢 Established: Great-circle bearing is the standard method for Qibla
 * direction, used by classical Islamic astronomers and modern institutions.
 *
 * @param {object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @returns {object} { bearing, magneticDeclination, trueBearing }
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

  return {
    bearing: Math.round(bearing * 10) / 10,
    magneticDeclination,
    trueBearing: Math.round(((bearing + magneticDeclination + 360) % 360) * 10) / 10,
  }
}
