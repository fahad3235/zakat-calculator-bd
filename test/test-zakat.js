/* test-zakat.js — Node assert tests for the pure Zakat calc logic. */
'use strict';
var assert = require('assert');
var Z = require('../js/zakat.js');

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS  ' + name);
  } catch (e) {
    failed++;
    console.log('  FAIL  ' + name + ' :: ' + e.message);
  }
}

function approx(a, b, eps) {
  return Math.abs(a - b) < (eps || 1e-6);
}

var GOLD_RATE = 120000;   // BDT per bhori (default estimate)
var SILVER_RATE = 2500;   // BDT per bhori (default estimate)

console.log('Zakat calc unit tests:');

test('gold->BDT conversion: 1 bhori = 11.664 g', function () {
  assert.strictEqual(Z.BHORI_IN_GRAMS, 11.664);
  var grams = Z.metalToGrams(1, 0);
  assert.ok(approx(grams, 11.664), 'expected 11.664, got ' + grams);
  var value = Z.metalValueBDT(grams, GOLD_RATE);
  assert.ok(approx(value, GOLD_RATE), '1 bhori should be worth exactly the per-bhori rate, got ' + value);
});

test('mixed bhori + gram input converts correctly', function () {
  var grams = Z.metalToGrams(2, 5);
  assert.ok(approx(grams, 2 * 11.664 + 5), 'got ' + grams);
  // gram-only input
  assert.ok(approx(Z.metalToGrams(0, 100), 100));
});

test('nisab on gold basis = 85g worth at the gold rate', function () {
  var n = Z.nisabBDT('gold', GOLD_RATE, SILVER_RATE);
  var expected = 85 * (GOLD_RATE / 11.664);
  assert.ok(approx(n, expected), 'expected ' + expected + ', got ' + n);
  assert.ok(n > 800000, 'gold nisab should be over ৳800k at this rate, got ' + n);
});

test('nisab on silver basis = 595g worth at the silver rate', function () {
  var n = Z.nisabBDT('silver', GOLD_RATE, SILVER_RATE);
  var expected = 595 * (SILVER_RATE / 11.664);
  assert.ok(approx(n, expected), 'expected ' + expected + ', got ' + n);
  // silver nisab should be much lower than gold nisab (hanafi-friendly lower bar)
  var goldNisab = Z.nisabBDT('gold', GOLD_RATE, SILVER_RATE);
  assert.ok(n < goldNisab, 'silver nisab ' + n + ' should be < gold nisab ' + goldNisab);
});

test('zakat due exactly at nisab (gold basis)', function () {
  var nisab = Z.nisabBDT('gold', GOLD_RATE, SILVER_RATE);
  var r = Z.calculateZakat({
    cash: nisab, goldValue: 0, silverValue: 0, stock: 0,
    investments: 0, receivables: 0, liabilities: 0,
    nisabBasis: 'gold', goldRate: GOLD_RATE, silverRate: SILVER_RATE
  });
  assert.strictEqual(r.isZakatDue, true);
  assert.ok(approx(r.zakatDue, nisab * 0.025), 'got ' + r.zakatDue);
});

test('below nisab -> 0 zakat, isZakatDue false', function () {
  var nisab = Z.nisabBDT('gold', GOLD_RATE, SILVER_RATE);
  var r = Z.calculateZakat({
    cash: nisab - 1, goldValue: 0, silverValue: 0, stock: 0,
    investments: 0, receivables: 0, liabilities: 0,
    nisabBasis: 'gold', goldRate: GOLD_RATE, silverRate: SILVER_RATE
  });
  assert.strictEqual(r.zakatDue, 0);
  assert.strictEqual(r.isZakatDue, false);
});

test('liabilities exceed assets -> zakatable 0, zakat 0', function () {
  var r = Z.calculateZakat({
    cash: 50000, goldValue: 0, silverValue: 0, stock: 0,
    investments: 0, receivables: 0, liabilities: 200000,
    nisabBasis: 'silver', goldRate: GOLD_RATE, silverRate: SILVER_RATE
  });
  assert.strictEqual(r.zakatable, 0);
  assert.strictEqual(r.zakatDue, 0);
  assert.strictEqual(r.isZakatDue, false);
});

test('negative input rejected by validateInput', function () {
  var v = Z.validateInput('-5');
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.error, 'negative');
});

test('non-numeric input rejected by validateInput', function () {
  var v = Z.validateInput('abc');
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.error, 'not_a_number');
});

test('empty input treated as 0', function () {
  assert.deepStrictEqual(Z.validateInput(''), { ok: true, value: 0 });
  assert.deepStrictEqual(Z.validateInput(null), { ok: true, value: 0 });
});

test('full asset breakdown sums correctly', function () {
  var goldVal = Z.metalValueBDT(Z.metalToGrams(1, 0), GOLD_RATE); // 1 bhori = 120000
  var r = Z.calculateZakat({
    cash: 100000, goldValue: goldVal, silverValue: 5000, stock: 20000,
    investments: 30000, receivables: 15000, liabilities: 10000,
    nisabBasis: 'silver', goldRate: GOLD_RATE, silverRate: SILVER_RATE
  });
  var expectedAssets = 100000 + 120000 + 5000 + 20000 + 30000 + 15000;
  assert.ok(approx(r.totalAssets, expectedAssets), 'got ' + r.totalAssets);
  assert.ok(approx(r.zakatable, expectedAssets - 10000), 'got ' + r.zakatable);
  var silverNisab = Z.nisabBDT('silver', GOLD_RATE, SILVER_RATE);
  assert.ok(r.zakatable >= silverNisab, 'should be above silver nisab');
  assert.ok(approx(r.zakatDue, r.zakatable * 0.025), 'got ' + r.zakatDue);
  assert.strictEqual(r.isZakatDue, true);
});

test('zakat = 2.5% of zakatable (silver basis example)', function () {
  var r = Z.calculateZakat({
    cash: 1000000, goldValue: 0, silverValue: 0, stock: 0,
    investments: 0, receivables: 0, liabilities: 0,
    nisabBasis: 'silver', goldRate: GOLD_RATE, silverRate: SILVER_RATE
  });
  assert.ok(approx(r.zakatDue, 25000), 'got ' + r.zakatDue);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
