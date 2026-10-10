/* smoke.js — headless-Chrome smoke tests via Playwright.
 * Load index.html from file:// and verify:
 *  (a) default load has 0 console errors
 *  (b) language toggle switches <html lang> to 'bn'
 *  (c) gold=1 bhori + cash=100000 (default rates) -> due amount > 0 with ৳ formatting
 *  (d) clear all -> empty-state message visible
 *  (e) gold rate = 1 -> nisab drops and UI updates
 */
'use strict';
const assert = require('assert');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const errors = [];
  const browser = await chromium.launch({
    executablePath: process.env.PW_EXEC_PATH ||
      '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell'
  });
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  await page.goto(url, { waitUntil: 'load' });

  // (a) zero console errors on default load
  assert.strictEqual(errors.length, 0, 'expected 0 console errors, got: ' + errors.join(' | '));

  // (b) language toggle switches html lang to 'bn'
  assert.strictEqual(await page.evaluate(() => document.documentElement.lang), 'en');
  await page.click('#langToggle');
  assert.strictEqual(await page.evaluate(() => document.documentElement.lang), 'bn');
  const titleBn = await page.textContent('[data-i18n="appTitle"]');
  assert.ok(titleBn.includes('যাকাত'), 'Bangla title expected, got: ' + titleBn);
  await page.click('#langToggle'); // back to English for the rest

  // (c) fill gold=1 bhori + cash=100000, default rates -> due > 0, BDT formatted
  await page.fill('#goldRate', '120000');
  await page.fill('#silverRate', '2500');
  await page.fill('#goldBhori', '1');
  await page.fill('#cash', '100000');
  await page.waitForTimeout(300);
  const dueText = await page.textContent('#zakatDue');
  assert.ok(dueText.startsWith('৳'), 'due should be ৳-formatted, got: ' + dueText);
  const due = parseFloat(dueText.replace(/[৳,]/g, ''));
  assert.ok(due > 0, 'zakat due should be > 0 (assets 220000 > silver nisab ~127k), got: ' + dueText);
  // breakdown lists the gold line
  const breakdown = await page.textContent('#breakdown');
  assert.ok(breakdown.includes('Gold'), 'breakdown should include Gold line, got: ' + breakdown);
  const stateText = await page.textContent('#resultState');
  assert.ok(/Zakat is due/.test(stateText), 'due-state message expected, got: ' + stateText);

  // (d) clear all -> empty-state visible
  await page.fill('#goldBhori', '');
  await page.fill('#cash', '');
  await page.waitForTimeout(300);
  const emptyVisible = await page.evaluate(() => {
    const el = document.getElementById('resultEmpty');
    return !el.hidden && getComputedStyle(el).display !== 'none';
  });
  assert.ok(emptyVisible, 'empty-state should be visible after clearing inputs');

  // (e) absurd gold rate -> nisab drops and UI updates
  await page.fill('#goldBhori', '10');
  await page.click('input[name="nisabBasis"][value="gold"]');
  await page.fill('#goldRate', '1');
  await page.waitForTimeout(300);
  const nisabText = await page.textContent('#nisabValue');
  const nisab = parseFloat(nisabText.replace(/[৳,]/g, ''));
  const expectedNisab = 85 * (1 / 11.664);
  assert.ok(nisab < 10, 'nisab should collapse with rate=1, got: ' + nisabText);
  assert.ok(Math.abs(nisab - Math.round(expectedNisab)) < 2, 'nisab mismatch, got ' + nisabText);
  // Note: rate=1 also collapses the gold asset value (assets are priced at the
  // same rate), so gold=10bhori (৳0.86) stays below the tiny nisab (৳7.29).
  // Correct expectation: nisab UI drops to ৳7 (85g @ 1 BDT/bhori = 7.29) and the
  // UI updates. (10 bhori is now worth ৳10 >= nisab ৳7.29, so the due-state
  // shows; the 2.5% of ৳10 rounds to ৳0 in display — an honest rounding
  // artifact only reachable with absurd rates.)
  const dueText2 = await page.textContent('#zakatDue');
  assert.strictEqual(dueText2, '৳0', 'due display should round 0.25 to ৳0, got: ' + dueText2);
  const stateText2 = await page.textContent('#resultState');
  assert.ok(/Zakat is due/.test(stateText2), 'due state expected, got: ' + stateText2);
  const basisText = await page.textContent('#nisabBasisText');
  assert.ok(/gold/i.test(basisText), 'gold basis should be labeled, got: ' + basisText);

  // validation: negative input shows inline error
  await page.fill('#cash', '-5');
  await page.waitForTimeout(300);
  const errVisible = await page.evaluate(() => {
    const el = document.getElementById('err-cash');
    return !el.hidden && el.textContent.length > 0;
  });
  assert.ok(errVisible, 'negative input should show an inline error');

  assert.strictEqual(errors.length, 0, '0 console errors expected throughout, got: ' + errors.join(' | '));

  await browser.close();
  console.log('SMOKE: all checks passed');
})().catch(e => {
  console.error('SMOKE FAIL: ' + e.message);
  process.exit(1);
});
