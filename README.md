# Zakat Calculator BD — যাকাত ক্যালকুলেটর

A free, fully offline bilingual (Bangla/English) Zakat calculator for Bangladesh.

[![Offline](https://img.shields.io/badge/Offline-100%25-green.svg)]()
[![Lang](https://img.shields.io/badge/Bangla-English-blue.svg)]()
[![Deps](https://img.shields.io/badge/Dependencies-zero-orange.svg)]()

> *"Calculate your Zakat honestly — সঠিক হিসাব, পরিষ্কার নিয়তে।"*

---

## 1. Problem being solved

Many online Zakat calculators are English-only, hard-code foreign gold prices,
and quietly phone home with your financial data. This app is built for
Bangladeshi users: amounts in BDT, gold/silver entered in **bhori or gram**,
and — critically — **rates are labelled as editable default estimates, never
presented as live prices**. Everything runs locally in the browser; nothing
ever leaves the device.

## 2. Features

1. **Asset inputs in BDT** — cash & bank savings, gold (bhori and/or gram;
   1 bhori = 11.664 g), silver (bhori and/or gram), business inventory/stock,
   investments & mutual funds, money owed to you. Non-negative number
   validation with inline error messages and NaN guards.
2. **Liabilities deduction** — debts payable this lunar year are subtracted
   from total assets before nisab is checked.
3. **Nisab engine** — selectable basis: **silver — 595 g (default, the lower
   Hanafi-friendly bar)** or **gold — 85 g**. Per-bhori rates are user-editable,
   persisted to `localStorage`, and always labelled *"default estimate —
   update with today's market price"*. The computed nisab value in BDT and the
   basis in use are shown explicitly.
4. **Zakat calculation** — `zakatable = max(0, assets − liabilities)`;
   `due = zakatable ≥ nisab ? zakatable × 2.5% : 0`. A clear **not-zakatable**
   state explains when wealth is below nisab. Full per-line breakdown, all
   amounts formatted in ৳.
5. **Persistence + polish** — all inputs, rates, and language saved to
   `localStorage`; reset button; print-friendly result card (print CSS shows
   the result only); mobile-first responsive UI; empty/error states;
   **zero external requests** (no CDNs, fonts, or analytics).

## 3. Stack

Vanilla HTML / CSS / JavaScript — no frameworks, no build step, no dependencies.

## 4. Prerequisites

Any modern browser (Chrome, Firefox, Edge, Safari). No server, no install.

## 5. Install

```bash
git clone https://github.com/fahad3235/zakat-calculator-bd.git
cd zakat-calculator-bd
# then open index.html in a browser, or serve it:
python3 -m http.server 8000
# open http://localhost:8000
```

## 6. Dev commands

There is no build step. The calculation logic lives in `js/zakat.js` and is
shared between the browser and Node (ES5-compatible, `module.exports` guard).

```bash
node test/test-zakat.js   # unit tests for the calc engine (12 tests)
# headless-Chrome smoke tests via Playwright:
NODE_PATH=/path/to/playwright_modules node test/smoke.js
```

## 7. Testing

| Suite | Runner | Result (2026-10-10) |
|---|---|---|
| `test/test-zakat.js` | Node `assert` | **12 passed, 0 failed** — covers bhori↔gram conversion (1 bhori = 11.664 g), gold-basis nisab, silver-basis nisab, zakat exactly at nisab, below-nisab → 0, liabilities > assets → 0, negative/non-numeric rejection, mixed bhori+gram input, full-breakdown sums |
| `test/smoke.js` | Playwright + headless Chromium, `file://` | **all checks passed, 0 console errors** — default load, EN→BN toggle (`<html lang="bn">`), gold=1 bhori + cash=100000 → due > 0 with ৳ formatting, clear-all → empty state, absurd gold rate → nisab drops and UI updates, negative input → inline error |

## 8. Deployment (GitHub Pages)

The app is a static site with relative asset paths — deploy by pushing to a
repo and enabling Pages:

1. Push `index.html`, `css/`, `js/` to the repo root.
2. GitHub → Settings → Pages → Deploy from branch → `main` / `/ (root)`.
3. The app works offline once loaded; no server-side component exists.

## 9. Limitations

- **Gold/silver rates are estimates, not live prices.** The defaults
  (৳120,000/bhori gold, ৳2,500/bhori silver) are placeholders — always update
  them with the current Bangladesh market price before relying on the result.
- **Not a fatwa.** Nisab basis choice, debt treatment, mixed/illiquid assets,
  and personal circumstances vary by madhab and situation. **Consult a
  qualified scholar for personal rulings.**
- The app assumes a single lunar year of ownership and a flat 2.5% rate; it
  does not model business-specific or agricultural zakat rules.
- Data is stored in the browser's `localStorage` only — clearing site data
  removes saved inputs and rates.

## 10. Status

MVP complete and verified (2026-10-10): 12/12 unit tests, all smoke checks
green, zero console errors, zero external requests.
