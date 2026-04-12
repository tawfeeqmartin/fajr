# A Gift of Time — agiftoftime.app

> *"a study in light, time, orientation and a call to prayer"*

[A Gift of Time](https://agiftoftime.app) is a free Progressive Web App — completely free with no ads and no tracking — offered as a sadaqah jariyah (ongoing charity) for the Muslim community.

It features:

- **Dichroic glass cube clock** — a Three.js cube refracting the hands of time, built with PBR materials and HDRI reflections
- **Qibla compass** — lights up the way toward the Ka'bah so you can "turn towards what's best for you"
- **Spatial adhan** — hear the call to prayer from the direction of Makkah using HRTF binaural audio (use headphones)
- **Rolling prayer windows** — tracks the current and upcoming prayer throughout the day
- **Works offline** as a PWA — install it and it runs without a connection

---

## This example

The `examples/agiftoftime/` directory is a CLI demo that exercises fajr's core feature set — the same prayer time data, Qibla bearing, night thirds, Hijri date, and hilal visibility that powers A Gift of Time's time calculations.

```bash
node examples/agiftoftime/index.js --lat 33.9716 --lng -6.8498 --elevation 75 --tz "Africa/Casablanca"
```

```
بسم الله الرحمن الرحيم

Prayer Times — Rabat, Morocco
15 Sha'ban 1445 / 25 February 2024

Fajr    ·  04:47
Shuruq  ·  06:14
Dhuhr   ·  13:22
Asr     ·  16:43
Maghrib ·  19:31
Isha    ·  20:48

Qibla   ·  97.4° (true north)
Method  ·  Morocco (18° / 17°)
Source  ·  fajr v0.1.0

Night thirds:
  Last third begins: 02:03

الحمد لله
```

---

*Fajr began with A Gift of Time — built with Kauthar — and a simple question: how do we know these times are right?*
