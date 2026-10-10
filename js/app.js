/* app.js — UI wiring, i18n (EN/BN), persistence. Depends on Zakat (js/zakat.js). */
(function () {
  'use strict';

  var Z = window.Zakat;
  var STORE_KEY = 'zakat-calc-bd-v1';

  var DEFAULTS = {
    goldRate: 120000,   // BDT per bhori — DEFAULT ESTIMATE, not a live price
    silverRate: 2500,    // BDT per bhori — DEFAULT ESTIMATE, not a live price
    nisabBasis: 'silver',
    lang: 'en',
    inputs: {}
  };

  var INPUT_IDS = ['cash', 'goldBhori', 'goldGram', 'silverBhori', 'silverGram',
                   'stock', 'investments', 'receivables', 'liabilities'];

  /* ---------------- i18n ---------------- */
  var I18N = {
    en: {
      appTitle: 'Zakat Calculator BD',
      tagline: 'Your Zakat, calculated honestly',
      rateDisclaimer: 'Gold & silver rates below are default estimates only — update them with today\'s market price. They are not live prices.',
      ratesTitle: 'Gold & Silver Rates (per bhori, BDT)',
      goldRate: 'Gold rate per bhori (৳)',
      goldRateHint: 'Default estimate — update with today\'s market price',
      silverRate: 'Silver rate per bhori (৳)',
      silverRateHint: 'Default estimate — update with today\'s market price',
      nisabBasisLabel: 'Nisab basis',
      nisabSilver: 'Silver — 595 g (lower, safer default)',
      nisabGold: 'Gold — 85 g',
      assetsTitle: 'Your Assets (BDT)',
      cash: 'Cash & bank savings (৳)',
      gold: 'Gold',
      bhori: 'bhori', bhori2: 'bhori', bhori3: 'bhori',
      gram: 'gram', gram2: 'gram', gram3: 'gram',
      value: 'Value', value2: 'Value',
      silver: 'Silver',
      stock: 'Business inventory / stock (৳)',
      investments: 'Investments & mutual funds (৳)',
      receivables: 'Money owed to you (৳)',
      liabTitle: 'Deductions',
      liabilities: 'Debts payable this lunar year (৳)',
      reset: 'Reset all',
      print: 'Print result',
      resultTitle: 'Your Zakat',
      emptyMsg: 'Enter your assets above to see your Zakat calculation.',
      nisabLabel: 'Nisab threshold',
      totalAssets: 'Total assets',
      totalLiabilities: 'Liabilities',
      zakatable: 'Zakatable wealth',
      zakatDue: 'Zakat due (2.5%)',
      scholarNote: 'This is a calculation aid using estimated rates. For personal rulings (nisab choice, debt treatment, mixed assets), please consult a qualified scholar.',
      footer: 'Fully offline · No data leaves your device · Rates are estimates, not live prices',
      errNegative: 'Value cannot be negative.',
      errNaN: 'Enter a valid number.',
      dueMsg: '✅ Zakat is due on your wealth.',
      noneMsg: 'No Zakat is due — your zakatable wealth is below the nisab threshold.',
      basisSilver: 'silver basis (595 g)',
      basisGold: 'gold basis (85 g)',
      lineCash: 'Cash & bank savings',
      lineGold: 'Gold',
      lineSilver: 'Silver',
      lineStock: 'Business inventory / stock',
      lineInvestments: 'Investments & mutual funds',
      lineReceivables: 'Money owed to you',
      confirmReset: 'Clear all inputs and rates?'
    },
    bn: {
      appTitle: 'যাকাত ক্যালকুলেটর BD',
      tagline: 'আপনার যাকাত, সঠিক হিসাব',
      rateDisclaimer: 'নিচের স্বর্ণ ও রূপার দাম শুধুই ডিফল্ট আনুমানিক দাম — আজকের বাজারদর দিয়ে আপডেট করুন। এগুলো লাইভ দাম নয়।',
      ratesTitle: 'স্বর্ণ ও রূপার দাম (প্রতি ভরি, ৳)',
      goldRate: 'প্রতি ভরি স্বর্ণের দাম (৳)',
      goldRateHint: 'ডিফল্ট আনুমানিক দাম — আজকের বাজারদর দিয়ে আপডেট করুন',
      silverRate: 'প্রতি ভরি রূপার দাম (৳)',
      silverRateHint: 'ডিফল্ট আনুমানিক দাম — আজকের বাজারদর দিয়ে আপডেট করুন',
      nisabBasisLabel: 'নিসাবের ভিত্তি',
      nisabSilver: 'রূপা — ৫৯৫ গ্রাম (কম, নিরাপদ ডিফল্ট)',
      nisabGold: 'স্বর্ণ — ৮৫ গ্রাম',
      assetsTitle: 'আপনার সম্পদ (৳)',
      cash: 'নগদ টাকা ও ব্যাংক সঞ্চয় (৳)',
      gold: 'স্বর্ণ',
      bhori: 'ভরি', bhori2: 'ভরি', bhori3: 'ভরি',
      gram: 'গ্রাম', gram2: 'গ্রাম', gram3: 'গ্রাম',
      value: 'মূল্য', value2: 'মূল্য',
      silver: 'রূপা',
      stock: 'ব্যবসার মজুদ পণ্য (৳)',
      investments: 'বিনিয়োগ ও মিউচুয়াল ফান্ড (৳)',
      receivables: 'আপনার পাওনা টাকা (৳)',
      liabTitle: 'বাদ দেওয়ার পরিমাণ',
      liabilities: 'এই চান্দ্র বছরে পরিশোধযোগ্য ঋণ (৳)',
      reset: 'সব মুছুন',
      print: 'ফলাফল প্রিন্ট করুন',
      resultTitle: 'আপনার যাকাত',
      emptyMsg: 'যাকাতের হিসাব দেখতে উপরে আপনার সম্পদ লিখুন।',
      nisabLabel: 'নিসাব সীমা',
      totalAssets: 'মোট সম্পদ',
      totalLiabilities: 'ঋণ',
      zakatable: 'যাকাতযোগ্য সম্পদ',
      zakatDue: 'প্রদেয় যাকাত (২.৫%)',
      scholarNote: 'এটি আনুমানিক দাম ব্যবহার করে একটি হিসাব সহায়ক। ব্যক্তিগত ফতোয়ার জন্য (নিসাব নির্বাচন, ঋণের নিয়ম, মিশ্র সম্পদ) অনুগ্রহ করে যোগ্য আলেমের পরামর্শ নিন।',
      footer: 'সম্পূর্ণ অফলাইন · আপনার ডেটা ডিভাইস ছাড়ে না · দাম আনুমানিক, লাইভ দাম নয়',
      errNegative: 'নেতিবাচক মান দেওয়া যাবে না।',
      errNaN: 'সঠিক সংখ্যা লিখুন।',
      dueMsg: '✅ আপনার সম্পদের উপর যাকাত ফরয হয়েছে।',
      noneMsg: 'যাকাত ফরয হয়নি — আপনার যাকাতযোগ্য সম্পদ নিসাব সীমার নিচে।',
      basisSilver: 'রূপার ভিত্তি (৫৯৫ গ্রাম)',
      basisGold: 'স্বর্ণের ভিত্তি (৮৫ গ্রাম)',
      lineCash: 'নগদ টাকা ও ব্যাংক সঞ্চয়',
      lineGold: 'স্বর্ণ',
      lineSilver: 'রূপা',
      lineStock: 'ব্যবসার মজুদ পণ্য',
      lineInvestments: 'বিনিয়োগ ও মিউচুয়াল ফান্ড',
      lineReceivables: 'পাওনা টাকা',
      confirmReset: 'সব ইনপুট ও দাম মুছে ফেলবেন?'
    }
  };

  /* ---------------- state ---------------- */
  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        var merged = {
          goldRate: (parsed.goldRate > 0) ? parsed.goldRate : DEFAULTS.goldRate,
          silverRate: (parsed.silverRate > 0) ? parsed.silverRate : DEFAULTS.silverRate,
          nisabBasis: (parsed.nisabBasis === 'gold') ? 'gold' : 'silver',
          lang: (parsed.lang === 'bn') ? 'bn' : 'en',
          inputs: parsed.inputs || {}
        };
        return merged;
      }
    } catch (e) { /* corrupted storage: fall through to defaults */ }
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable: app still works in-session */ }
  }

  function t(key) {
    return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
  }

  function $(id) { return document.getElementById(id); }

  function fmt(n) {
    var v = Math.round(n);
    return '৳' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* ---------------- language ---------------- */
  function applyLang() {
    document.documentElement.lang = state.lang;
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      els[i].textContent = t(key);
    }
    $('langToggle').textContent = (state.lang === 'en') ? 'বাং' : 'EN';
  }

  /* ---------------- validation + calc ---------------- */
  function readInputs() {
    var errors = {};
    var values = {};
    var allValid = true;

    function readField(id, errId) {
      var el = $(id);
      var v = Z.validateInput(el.value.trim());
      if (!v.ok) {
        allValid = false;
        errors[errId] = (v.error === 'negative') ? t('errNegative') : t('errNaN');
        el.classList.add('invalid');
      } else {
        el.classList.remove('invalid');
      }
      values[id] = v.ok ? v.value : 0;
    }

    readField('goldRate', 'goldRate');
    readField('silverRate', 'silverRate');
    readField('cash', 'cash');
    readField('stock', 'stock');
    readField('investments', 'investments');
    readField('receivables', 'receivables');
    readField('liabilities', 'liabilities');

    // dual gold / silver fields: report on the group error line
    var goldBad = false, silverBad = false;
    ['goldBhori', 'goldGram'].forEach(function (id) {
      var v = Z.validateInput($(id).value.trim());
      if (!v.ok) { goldBad = true; $(id).classList.add('invalid'); }
      else { $(id).classList.remove('invalid'); }
      values[id] = v.ok ? v.value : 0;
    });
    ['silverBhori', 'silverGram'].forEach(function (id) {
      var v = Z.validateInput($(id).value.trim());
      if (!v.ok) { silverBad = true; $(id).classList.add('invalid'); }
      else { $(id).classList.remove('invalid'); }
      values[id] = v.ok ? v.value : 0;
    });
    if (goldBad) { allValid = false; errors.gold = t('errNaN'); }
    if (silverBad) { allValid = false; errors.silver = t('errNaN'); }

    // clear negative flags where applicable (re-check to pick right message)
    ['goldRate','silverRate','cash','stock','investments','receivables','liabilities'].forEach(function (id) {
      var v = Z.validateInput($(id).value.trim());
      if (!v.ok && v.error === 'negative') errors[id] = t('errNegative');
    });

    return { values: values, errors: errors, allValid: allValid };
  }

  function showErrors(errors) {
    var ids = ['goldRate', 'silverRate', 'cash', 'gold', 'silver',
               'stock', 'investments', 'receivables', 'liabilities'];
    ids.forEach(function (id) {
      var el = $('err-' + id);
      if (!el) return;
      if (errors[id]) {
        el.textContent = errors[id];
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });
  }

  function recalc() {
    var read = readInputs();
    showErrors(read.errors);
    var v = read.values;

    var goldGrams = Z.metalToGrams(v.goldBhori, v.goldGram);
    var silverGrams = Z.metalToGrams(v.silverBhori, v.silverGram);
    var goldVal = Z.metalValueBDT(goldGrams, v.goldRate);
    var silverVal = Z.metalValueBDT(silverGrams, v.silverRate);

    $('goldValue').textContent = fmt(goldVal);
    $('silverValue').textContent = fmt(silverVal);

    if (!read.allValid) { return; }

    var result = Z.calculateZakat({
      cash: v.cash,
      goldValue: goldVal,
      silverValue: silverVal,
      stock: v.stock,
      investments: v.investments,
      receivables: v.receivables,
      liabilities: v.liabilities,
      nisabBasis: state.nisabBasis,
      goldRate: v.goldRate,
      silverRate: v.silverRate
    });

    // persist state
    state.goldRate = v.goldRate;
    state.silverRate = v.silverRate;
    INPUT_IDS.forEach(function (id) { state.inputs[id] = v[id]; });
    save();

    renderResult(result, {
      cash: v.cash, gold: goldVal, silver: silverVal,
      stock: v.stock, investments: v.investments, receivables: v.receivables
    });
  }

  function renderResult(result, lines) {
    var hasAnyAsset = result.totalAssets > 0;
    $('resultEmpty').hidden = hasAnyAsset;
    $('resultContent').hidden = !hasAnyAsset;
    if (!hasAnyAsset) return;

    var stateEl = $('resultState');
    if (result.isZakatDue) {
      stateEl.className = 'result-state due';
      stateEl.textContent = t('dueMsg');
    } else {
      stateEl.className = 'result-state none';
      stateEl.textContent = t('noneMsg');
    }

    $('nisabBasisText').textContent =
      (state.nisabBasis === 'gold') ? t('basisGold') : t('basisSilver');
    $('nisabValue').textContent = fmt(result.nisab);

    var items = [
      ['lineCash', lines.cash],
      ['lineGold', lines.gold],
      ['lineSilver', lines.silver],
      ['lineStock', lines.stock],
      ['lineInvestments', lines.investments],
      ['lineReceivables', lines.receivables]
    ];
    var ul = $('breakdown');
    ul.innerHTML = '';
    items.forEach(function (pair) {
      if (pair[1] > 0) {
        var li = document.createElement('li');
        var s1 = document.createElement('span');
        s1.textContent = t(pair[0]);
        var s2 = document.createElement('span');
        s2.textContent = fmt(pair[1]);
        li.appendChild(s1);
        li.appendChild(s2);
        ul.appendChild(li);
      }
    });

    $('totalAssets').textContent = fmt(result.totalAssets);
    $('totalLiabilities').textContent = fmt(result.liabilities);
    $('zakatable').textContent = fmt(result.zakatable);
    $('zakatDue').textContent = fmt(result.zakatDue);
  }

  /* ---------------- events ---------------- */
  function init() {
    applyLang();

    // restore persisted values
    if (state.inputs) {
      INPUT_IDS.forEach(function (id) {
        if (state.inputs[id] !== undefined && state.inputs[id] !== null) {
          $(id).value = state.inputs[id];
        }
      });
    }
    $('goldRate').value = state.goldRate;
    $('silverRate').value = state.silverRate;
    var radios = document.getElementsByName('nisabBasis');
    for (var i = 0; i < radios.length; i++) {
      radios[i].checked = (radios[i].value === state.nisabBasis);
    }

    // live recalc on any change
    var inputs = document.querySelectorAll('input');
    for (var j = 0; j < inputs.length; j++) {
      inputs[j].addEventListener('input', function () {
        var sel = document.querySelector('input[name="nisabBasis"]:checked');
        state.nisabBasis = sel ? sel.value : 'silver';
        recalc();
      });
      inputs[j].addEventListener('change', function () {
        var sel2 = document.querySelector('input[name="nisabBasis"]:checked');
        state.nisabBasis = sel2 ? sel2.value : 'silver';
        save();
        recalc();
      });
    }

    $('langToggle').addEventListener('click', function () {
      state.lang = (state.lang === 'en') ? 'bn' : 'en';
      save();
      applyLang();
      recalc();
    });

    $('resetBtn').addEventListener('click', function () {
      if (!window.confirm(t('confirmReset'))) return;
      var fresh = JSON.parse(JSON.stringify(DEFAULTS));
      state.inputs = {};
      state.goldRate = fresh.goldRate;
      state.silverRate = fresh.silverRate;
      INPUT_IDS.forEach(function (id) { $(id).value = ''; });
      $('goldRate').value = state.goldRate;
      $('silverRate').value = state.silverRate;
      save();
      recalc();
    });

    $('printBtn').addEventListener('click', function () {
      window.print();
    });

    recalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
