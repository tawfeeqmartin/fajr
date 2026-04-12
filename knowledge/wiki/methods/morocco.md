# Morocco — Ministry of Habous Method

The Moroccan method uses 18° for Fajr and 17° for Isha (identical parameters to MWL), but derives its authority from the Moroccan Ministry of Habous and Islamic Affairs, whose published annual timetables are the ground truth for Moroccan prayer times.

---

## Parameters

| Parameter | Value |
|-----------|-------|
| **Fajr angle** | 18° below horizon |
| **Isha angle** | 17° below horizon |
| **Asr convention** | Standard (shadow = 1× object height, Maliki/Shafi'i) |
| **Isha calculation type** | Angle (not fixed offset) |
| **Authority source** | Ministry of Habous annual timetable publications |

---

## History and Authority

**Endorsing institution:** Ministère des Habous et des Affaires Islamiques (Ministry of Habous and Islamic Affairs), Kingdom of Morocco, Rabat.

The Ministry of Habous (*habous* refers to Islamic endowments, *waqf* in Arabic) is the Moroccan government ministry responsible for Islamic affairs, mosque administration, and religious education. It has published official prayer timetables for Morocco since at least the 1970s, using the 18°/17° angles that correspond to the MWL standard — a natural alignment given Morocco's Maliki legal tradition and historical ties to the broader Sunni scholarly world.

The ministry publishes:
1. **Annual prayer timetable books** (*Imsakiyya*) for major Moroccan cities
2. **Digital time broadcasts** via state television and radio, synchronized with the official timetable
3. **Mosque adhan coordination** through the national network of Ministry-supervised mosques

The published timetables incorporate local adjustments for geographic coordinates and potentially local atmospheric calibration, but the underlying methodology uses 18°/17° angles. For the fajr library, the **ministry-published timetables for specific cities are the authoritative reference**, not the formula alone.

**Classification:** 🟢 Established — government-authorized, consistently published for decades, Maliki scholarly tradition well-served by the Maliki-mainstream 18°/17° parameters.

---

## Geographic Applicability

**Official:** Kingdom of Morocco
**Also used (informally):** Algeria, Tunisia (with local adjustments); some Moroccan diaspora communities in Europe follow Ministry timetables for Ramadan

**Latitude range:** Morocco spans approximately 27.5°N (Lagouira in the south) to 35.9°N (Oujda in the northeast). Most major cities fall in the 30°N–35°N range.

**Terrain diversity:** Morocco has unusually diverse terrain for its size:
- Atlantic coastal plain: Casablanca (33.6°N, 7m elevation), Rabat (34.0°N, 75m), Agadir (30.4°N, 49m)
- Mediterranean coast: Tangier (35.8°N, 15m), Al-Hoceima
- Middle Atlas mountains: Ifrane (33.5°N, 1,665m), Azrou (33.4°N, 1,250m)
- High Atlas mountains: Jbel Toubkal 4,167m (highest peak in North Africa), Ouarzazate (30.9°N, 1,136m)
- Saharan pre-desert: Errachidia, Zagora

This terrain diversity means that a formula calibrated for coastal cities (sea level) can diverge substantially from the observed prayer times at mountain locations. See [[wiki/regions/morocco]] for detailed regional notes.

---

## Relationship to MWL: Same Angles, Different Authority

The Morocco method and MWL method share the same Fajr and Isha angles (18°/17°). The distinction is one of **authority and ground truth**:

- **MWL** is the internationally-endorsed standard, derived from the Muslim World League in Makkah.
- **Morocco** is the nationally-endorsed standard, derived from the Moroccan government's religious authority.

In practice, for any location in Morocco, the Morocco method and MWL formula will produce essentially identical calculated times. The difference emerges when the Ministry's published timetable is compared to the formula output — the ministry may incorporate local adjustments or rounding conventions not captured in the bare formula.

**For the fajr library's Morocco evaluation data:** The ministry-published timetable is authoritative. If a calculated value diverges from the published timetable, the timetable is correct and the calculation should be investigated for missing adjustments (elevation, local longitude correction, DST handling).

---

## DST and UTC Offset Complexity

Morocco has a complex recent history with time zones:

**Current status (as of 2018):** Morocco is permanently on **UTC+1** (Western European Time / WET+1), having moved to year-round UTC+1 by Law 04-18, enacted in October 2018. This abolished the previous alternation between UTC+0 (winter) and UTC+1 (summer DST).

**Ramadan exception:** In some years following the 2018 change, Morocco has temporarily reverted to UTC+0 *during Ramadan only*, to allow Muslim workers to leave their offices earlier relative to clock time. This is a practical accommodation for the fasting month and has been applied inconsistently year-by-year. **Users and the library must verify the current year's Ramadan UTC offset**.

**Historical complexity:** Before 2018, Morocco applied DST irregularly, sometimes with different start/end dates from European DST, and with Ramadan exceptions in some years. Historical prayer time calculations for Morocco before 2019 must use UTC offsets verified against Ministry announcements for the specific year.

**Library implication:** Do not hard-code Morocco's UTC offset as "+1" for all dates. Query a verified timezone database (such as IANA tz database) for the specific date, and flag any Ramadan-period calculations in Morocco for manual UTC verification.

---

## Asr Madhab Note

Morocco follows the **Maliki** school of Islamic law, one of the four major Sunni madhabs. The Maliki position on Asr start time follows the **standard (1× shadow)** convention, not the Hanafi (2× shadow) convention. This is consistent with the Morocco method's default Asr convention.

The Maliki school is the dominant madhab across the Maghreb (Morocco, Algeria, Tunisia) and West Africa. Methods used in these regions should use standard (1× shadow) Asr by default.

---

## Publication Format and Eval Data

The Ministry publishes timetables in the following formats:
- **Annual imsakiyya books:** Available from Ministry offices and online; city-specific; include Ramadan schedules
- **Ministry website:** times.habous.gov.ma provides daily times for Moroccan cities
- **Mobile apps:** Official Ministry-endorsed apps distribute the timetable

For the fajr library's eval data, the Morocco ground truth consists of Ministry-published timetables for specific cities (Casablanca, Rabat, Marrakech, Fes, Meknes, Agadir). These are authoritative to within the Ministry's own rounding conventions (typically to the nearest minute).

---

## Related Pages

- [[wiki/regions/morocco]] — Detailed regional notes including terrain effects, DST history, and city-specific considerations
- [[wiki/methods/overview]] — Full comparison table of all methods
- [[wiki/methods/mwl]] — MWL method (same angles, different jurisdictional authority)
- [[wiki/corrections/elevation]] — Elevation correction relevant for Atlas mountain communities
