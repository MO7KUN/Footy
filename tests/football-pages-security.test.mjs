import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as model from '../football-model.js';
import {domesticCups, internationalCompetitions} from '../competition-data.js';

const source = (await readFile(new URL('../football-pages.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/gm, '')
  .replace(/export /g, '');

test('fixture and team links escape provider-controlled attributes', () => {
  const context = vm.createContext({...model});
  vm.runInContext(source, context);
  const html = vm.runInContext(`
    bridge = {matchDate: () => 'Today', matchTime: () => '12:00'};
    const attack = '42" onclick="alert(1)';
    fixtureList([{id: attack, league: 'eng.1', competitions: [{competitors: []}]}], 'eng.1')
      + '<a href="' + clubURL('eng.1', attack) + '">Club</a>';
  `, context);
  assert.ok(html.includes('42&quot; onclick=&quot;alert(1)'));
  assert.ok(!html.includes('" onclick="'));
  assert.equal(vm.runInContext("clubURL('eng.1', '42')", context), '#/club/eng.1/42');
});

test('competition directory combines search, type and region filters', () => {
  const elements = new Map();
  const document = {querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, {value: '', innerHTML: '', textContent: ''});
    return elements.get(selector);
  }};
  const context = vm.createContext({document, leagueBadge: () => '', competitions: [...domesticCups, ...internationalCompetitions]});
  vm.runInContext(source + '\nbridge = {leagues: competitions}; directory();', context);
  const cards = document.querySelector('#competitionCards');
  document.querySelector('#competitionSearch').value = 'america';
  document.querySelector('#competitionSearch').oninput();
  assert.ok(cards.innerHTML.includes('Copa América'));
  document.querySelector('#competitionType').value = 'cup';
  document.querySelector('#competitionType').onchange();
  assert.ok(cards.innerHTML.includes('No competitions found'));
  document.querySelector('#competitionSearch').value = '';
  document.querySelector('#competitionRegion').value = 'England';
  document.querySelector('#competitionRegion').onchange();
  assert.ok(cards.innerHTML.includes('FA Cup'));
  assert.ok(!cards.innerHTML.includes('Copa del Rey'));
});
