/* zakat.js — pure, ES5-compatible Zakat calculation logic.
 * Usable in the browser via <script> (global Zakat) and in Node via
 * require(). No DOM, no I/O, no dependencies.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.Zakat = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BHORI_IN_GRAMS = 11.664;
  var NISAB_GOLD_GRAMS = 85;    // Hanafi: 85 g of gold
  var NISAB_SILVER_GRAMS = 595; // Hanafi: 595 g of silver
  var ZAKAT_RATE = 0.025;       // 2.5%

  function toNum(v) {
    var n = parseFloat(v);
    return isNaN(n) ? NaN : n;
  }

  /* Validate a raw numeric input. Returns { ok: true, value: n } or
   * { ok: false, error: 'negative' | 'not_a_number' }.
   * Empty / missing input is treated as 0 (ok). */
  function validateInput(v) {
    if (v === '' || v === null || v === undefined) {
      return { ok: true, value: 0 };
    }
    var n = toNum(v);
    if (isNaN(n)) {
      return { ok: false, error: 'not_a_number' };
    }
    if (n < 0) {
      return { ok: false, error: 'negative' };
    }
    return { ok: true, value: n };
  }

  /* Convert a metal amount (bhori and/or gram fields) to grams. */
  function metalToGrams(bhori, gram) {
    var b = toNum(bhori);
    var g = toNum(gram);
    var total = 0;
    if (!isNaN(b) && b > 0) total += b * BHORI_IN_GRAMS;
    if (!isNaN(g) && g > 0) total += g;
    return total;
  }

  /* BDT value of metal: grams * (rate per bhori / grams per bhori). */
  function metalValueBDT(grams, ratePerBhori) {
    if (isNaN(grams) || isNaN(ratePerBhori) || ratePerBhori <= 0) return 0;
    return grams * (ratePerBhori / BHORI_IN_GRAMS);
  }

  /* Nisab value in BDT for the chosen basis ('gold' | 'silver'). */
  function nisabBDT(basis, goldRatePerBhori, silverRatePerBhori) {
    if (basis === 'gold') {
      return NISAB_GOLD_GRAMS * (goldRatePerBhori / BHORI_IN_GRAMS);
    }
    return NISAB_SILVER_GRAMS * (silverRatePerBhori / BHORI_IN_GRAMS);
  }

  /* Full calculation. inputs: { cash, goldValue, silverValue, stock,
   * investments, receivables, liabilities, nisabBasis, goldRate, silverRate }
   * all numbers (BDT for money lines, per-bhori for rates). */
  function calculateZakat(inputs) {
    var assets =
      inputs.cash + inputs.goldValue + inputs.silverValue +
      inputs.stock + inputs.investments + inputs.receivables;
    var liabilities = Math.max(0, inputs.liabilities || 0);
    var zakatable = Math.max(0, assets - liabilities);
    var nisab = nisabBDT(inputs.nisabBasis, inputs.goldRate, inputs.silverRate);
    var belowNisab = zakatable < nisab;
    var due = belowNisab ? 0 : zakatable * ZAKAT_RATE;
    return {
      totalAssets: assets,
      liabilities: liabilities,
      zakatable: zakatable,
      nisab: nisab,
      nisabBasis: inputs.nisabBasis,
      zakatDue: due,
      isZakatDue: !belowNisab && due > 0
    };
  }

  return {
    BHORI_IN_GRAMS: BHORI_IN_GRAMS,
    NISAB_GOLD_GRAMS: NISAB_GOLD_GRAMS,
    NISAB_SILVER_GRAMS: NISAB_SILVER_GRAMS,
    ZAKAT_RATE: ZAKAT_RATE,
    validateInput: validateInput,
    metalToGrams: metalToGrams,
    metalValueBDT: metalValueBDT,
    nisabBDT: nisabBDT,
    calculateZakat: calculateZakat
  };
});
