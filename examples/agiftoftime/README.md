# A Gift of Time

> *"Time is like a sword — if you do not cut it, it will cut you."*

This example demonstrates fajr's full feature set in a simple, human-readable prayer schedule generator.

---

## What this does

Generates a beautiful, complete prayer schedule for any location — including:

- All six prayer times with local timezone formatting
- Qibla direction with magnetic declination
- Night thirds for Tahajjud
- Hijri date
- Hilal visibility for the current month (when data is available)

---

## Usage

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

*The name comes from the Islamic tradition that knowing prayer times precisely is itself a gift — it lets you prepare, not scramble.*
