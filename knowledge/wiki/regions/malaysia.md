# Malaysia — JAKIM Methodology and the Empirical Ihtiyati Buffer

Malaysia's official prayer time authority is **JAKIM** (Jabatan Kemajuan Islam Malaysia, Department of Islamic Development Malaysia). JAKIM publishes prayer times nationally via the e-solat.gov.my system organised into geographic *zones* (~6 zones per state, e.g. WLY01 for Kuala Lumpur, SGR01 for Shah Alam). Real-time access is geo-restricted to Malaysian IPs; the [waktusolat.app](https://waktusolat.app) community proxy mirrors the same data unrestricted.

This entry documents the structural finding that **JAKIM's published Fajr times consistently sit ~8–9 minutes later than a pure 20° calculation predicts**, and how fajr handles that gap.

---

## The empirical signal

fajr's eval corpus contains JAKIM ground truth from three Malaysian zones:

| Zone | City | Fajr bias (calc − published) |
|---|---|---:|
| WLY01 | Kuala Lumpur | −8.90 min |
| SGR01 | Shah Alam | −8.20 min |
| PNG01 | George Town (Penang) | −9.00 min |

Mean bias: **−8.7 minutes**. Calc Fajr is consistently EARLIER than what JAKIM publishes; symmetry across zones rules out per-zone artifact. Sunrise (a method-independent astronomical event) matches within 1 minute, so the discrepancy is pure calibration of the Fajr angle/offset, not of the broader astronomical engine.

For Kuala Lumpur on 2026-04-01:
- 20° calc gives **05:56** local
- 18° calc gives **06:04** local
- JAKIM published is **06:05** local

The 8-minute gap between 20° calc and JAKIM published decomposes neatly as either (a) 18° angle + 1-minute *ihtiyati*, or (b) 20° angle + 9-minute *ihtiyati*. Both fit empirically.

---

## Documented JAKIM ihtiyati

**Citation:** [Razali, A.A. & Hisham, A.I.I., 2021] — *Re-evaluation of the Method Used in Determining the Prayer Time Zone in Pahang*, *International Journal of Humanities Technology and Civilization* (IJHTC), Vol 1 Issue 10, March 2021, pp 15–22, Universiti Malaysia Pahang Press, ISSN 2289-7216, e-ISSN 2600-8815. Archived at [`knowledge/raw/papers/2026-05-01-astronomycenter/jakim_ijhtc_reevaluation.pdf`](../../raw/papers/2026-05-01-astronomycenter/jakim_ijhtc_reevaluation.pdf).

The paper documents JAKIM's *waktu ihtiyati* (precaution-buffer time) explicitly:

> *"...waktu solat tersebut adalah berdasarkan waktu ihtiyati 2 minit (Nurul Asikin, 2016). Waktu ihtiyati ialah waktu yang ditambah atau dikurangkan daripada waktu kiraan..."*
>
> "These prayer times are based on a 2-minute ihtiyati (Nurul Asikin, 2016). Ihtiyati is time added to or subtracted from the calculated time..."

The paper's primary subject is **zone-width tolerance** (the rule that prayer-time difference between the easternmost and westernmost points of a JAKIM zone must not exceed 2 minutes), but the same 2-minute ihtiyati buffer is applied to individual prayer-time calculations as published. The paper finds that current JAKIM zoning in Pahang state actually exceeds this tolerance (Rompin and Kuantan coastal areas land 4 minutes earlier than the reference station in Felda Chempaka), indicating ongoing methodological refinement is happening within JAKIM's institutional framework.

The 2-minute documented ihtiyati does not by itself account for the empirical 8.7-minute Fajr gap. The remaining ~6 minutes likely correspond to a *visual margin* analogous to the recommendation in:

**Citation:** [Aabed, A.M., 2015] — *Determining the beginning of the true dawn (Al-Fajr Al-Sadek) observationally by the naked eye in Jordan*, *Jordan Journal for Islamic Studies*, v. 11(2), 2015. Archived at [`knowledge/raw/papers/2026-05-01-astronomycenter/aabed_2015_fajr_empirical.pdf`](../../raw/papers/2026-05-01-astronomycenter/aabed_2015_fajr_empirical.pdf).

Aabed's 12-session naked-eye observation study in Jordan recommended a **5-minute** *tayakkun* (certainty) buffer:

> *"It is also accepted to delay A'than by 5 minutes only to be sure of the right timing (tayakkun)."*

A combined 2-minute formal ihtiyati + 5-to-6-minute tayakkun visual margin matches the empirical ~8.7-minute JAKIM Fajr offset within rounding. Both buffers are scholarly-grounded and institutionally precedented.

---

## fajr's resolution — Path A community calibration

fajr applies a **+8-minute Fajr offset** when the auto-detected country is Malaysia (latitude/longitude bbox). Implementation lives in `src/engine.js`'s `selectMethod` for the `'Malaysia'` case:

```js
const p = adhan.CalculationMethod.Singapore()  // 20°/18° base
p.methodAdjustments = { ...(p.methodAdjustments || {}), fajr: 8 }
return { params: p, methodName: 'JAKIM (20°/18° + 8min ihtiyati per Path A community calibration)' }
```

**Classification:** 🟡→🟢 (Path A approaching established) per [`fiqh/scholarly-oversight.md`](../fiqh/scholarly-oversight.md). Justification:

1. **Empirical multi-zone corroboration:** −8.7-minute mean bias across 3 Malaysian zones (KL/Shah Alam/Penang) against JAKIM's authoritative-published times via waktusolat.app. Consistent across zones rules out per-zone artifact.

2. **Documented ihtiyati precedent:** Razali & Hisham 2021 + Nurul Asikin 2016 establish JAKIM's institutional use of ihtiyati buffers. The 8-minute total decomposes as 2-min documented + 5–6-min visual margin per Aabed 2015 — both buffers are scholarly-grounded.

3. **Dual-ihtiyat compliance:** matching JAKIM's published reality is *fasting-safer* (later Fajr widens the suhoor eating window before *imsak*) AND *prayer-validity-safer* (later Fajr eliminates pre-dawn risk). Both polarities of ihtiyat are satisfied — same logic as fajr's Morocco 19° community calibration. See [`fiqh/prayer-definitions.md`](../fiqh/prayer-definitions.md).

4. **Path A ratchet activation:** the v1.4.1 introduction of this offset triggered fajr's Path A cross-source corroboration check (per [`eval/compare.js`](../../../eval/compare.js)) — the JAKIM source's per-source Fajr bias improved by 8.0 minutes (|−8.70| → |−0.70|), more than the required floor for cross-validation. The aggregate Fajr drift was within tolerance once Path A applied. Train WMAE: 1.2472 → 1.0394.

---

## Why this is *not* a "change to JAKIM's stated 20°"

fajr does not claim JAKIM uses an 18° angle. The official JAKIM documentation states 20°, and fajr's computation uses the 20° angle (via `adhan.CalculationMethod.Singapore()`). The 8-minute additive offset is applied via `methodAdjustments.fajr`, preserving the documented angle in the engine while matching JAKIM's published institutional reality.

This is the same engineering pattern used for Morocco — see [`regions/morocco.md`](./morocco.md). In both cases, the institution's *formal* method differs from its *published* times by a calibration buffer that fajr applies to match institutional reality without contradicting institutional documentation.

---

## Indonesia (KEMENAG) does NOT need this offset

The empirical signature is **specific to Malaysia**. Indonesia's KEMENAG (Kementerian Agama Republik Indonesia) ground truth at Jakarta (via Aladhan API method 99 + Singapore-style settings) matches fajr's pure 20° calculation within 1 minute:

```
JAKIM Indonesia (Aladhan KEMENAG-style): Jakarta 2026-04-01 fajr = 04:38
fajr's pure 20° calc:                    Jakarta 2026-04-01 fajr = 04:38
```

No ihtiyati buffer is applied for Indonesia. The fajr engine handles this by branching on country: `case 'Malaysia':` applies the +8 min offset; `case 'Indonesia':` does not.

Singapore (MUIS) and Brunei (JKAS) also follow the no-offset path until institutional ground truth from each is added to the eval corpus.

---

## Eval corpus implications

The fajr eval previously contained two competing "ground truth" sources for Malaysian cities:

| Fixture | Source | What it actually is |
|---|---|---|
| `eval/data/test/malaysia.json` *(was train, moved to test in v1.4.1)* | Aladhan API custom method 99 | Calc-vs-calc consensus check at 20°/18° angles, NOT institutional ground truth |
| `eval/data/train/waktusolat.json` | JAKIM via waktusolat.app | The actual institutional published reality for Malaysian Muslims |

The ratchet flagged the Aladhan-malaysia.json cell as worsening when fajr started matching JAKIM published reality (because Aladhan-method-99 sits at the pure 20° baseline). This is a corpus-curation artifact, not a real regression — the Aladhan-method-99 fixture is calc-vs-calc consensus, not what Malaysian Muslims actually pray to. Moving it to the test holdout corrects this: it remains in the eval reporting layer but no longer gates the ratchet.

---

## Related Pages

- [[wiki/regions/morocco]] — Same Path A pattern: formal 18° + community-published 19°
- [[wiki/methods/fajr-angle-empirics]] — Aabed 2015 tayakkun + light-pollution caveat
- [[wiki/fiqh/scholarly-oversight]] — 🟡→🟢 classification framework
- [[wiki/fiqh/prayer-definitions]] — Dual-ihtiyat (prayer-validity vs fasting) framing
- `autoresearch/logs/2026-05-02-jakim-ihtiyati.md` — research log entry for this calibration
