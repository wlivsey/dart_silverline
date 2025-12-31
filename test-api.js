#!/usr/bin/env node
/**
 * Test script for DART Silver Line API endpoints
 * Run locally with: node test-api.js
 * Run against prod with: node test-api.js https://dfwtrain.com
 */

const BASE_URL = process.argv[2] || 'http://localhost:8888';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log(`\nTesting API at: ${BASE_URL}\n`);
  console.log('='.repeat(60));

  for (const { name, fn } of tests) {
    try {
      await fn();
      passed++;
      console.log(`✓ ${name}`);
    } catch (err) {
      failed++;
      console.log(`✗ ${name}`);
      console.log(`  Error: ${err.message}`);
    }
  }

  console.log('='.repeat(60));
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// JSON endpoint tests
test('GET /v1/next?station=cypress_waters returns valid JSON', async () => {
  const res = await fetch(`${BASE_URL}/v1/next?station=cypress_waters`);
  assert(res.status === 200, `Expected 200, got ${res.status}`);

  const contentType = res.headers.get('content-type');
  assert(contentType.includes('application/json'), `Expected JSON content-type, got ${contentType}`);

  const data = await res.json();
  assert(data.station === 'Cypress Waters', `Expected station name, got ${data.station}`);
  assert(data.slug === 'cypress_waters', `Expected slug, got ${data.slug}`);
  assert(data.asOf, 'Expected asOf field');
  assert(data.eastbound !== undefined, 'Expected eastbound field');
  assert(data.westbound !== undefined, 'Expected westbound field');
});

test('GET /v1/next with alias "CW" works', async () => {
  const res = await fetch(`${BASE_URL}/v1/next?station=CW`);
  assert(res.status === 200, `Expected 200, got ${res.status}`);

  const data = await res.json();
  assert(data.station === 'Cypress Waters', `Expected Cypress Waters, got ${data.station}`);
});

test('GET /v1/next with alias "Cypress Waters" works', async () => {
  const res = await fetch(`${BASE_URL}/v1/next?station=${encodeURIComponent('Cypress Waters')}`);
  assert(res.status === 200, `Expected 200, got ${res.status}`);

  const data = await res.json();
  assert(data.station === 'Cypress Waters', `Expected Cypress Waters, got ${data.station}`);
});

test('GET /v1/next with alias "cypress-waters" works', async () => {
  const res = await fetch(`${BASE_URL}/v1/next?station=cypress-waters`);
  assert(res.status === 200, `Expected 200, got ${res.status}`);

  const data = await res.json();
  assert(data.station === 'Cypress Waters', `Expected Cypress Waters, got ${data.station}`);
});

test('GET /v1/next without station returns 400', async () => {
  const res = await fetch(`${BASE_URL}/v1/next`);
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

test('GET /v1/next with invalid station returns 400', async () => {
  const res = await fetch(`${BASE_URL}/v1/next?station=invalid`);
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

test('GET /v1/next has Cache-Control header', async () => {
  const res = await fetch(`${BASE_URL}/v1/next?station=cypress_waters`);
  const cacheControl = res.headers.get('cache-control');
  assert(cacheControl && cacheControl.includes('max-age=10'), `Expected max-age=10, got ${cacheControl}`);
});

test('GET /v1/next eastbound has all required fields', async () => {
  const res = await fetch(`${BASE_URL}/v1/next?station=cypress_waters`);
  const data = await res.json();

  if (data.eastbound) {
    assert(typeof data.eastbound.minutes === 'number', 'eastbound.minutes should be a number');
    assert(typeof data.eastbound.departureTimeLocal === 'string', 'eastbound.departureTimeLocal should be a string');
    assert(typeof data.eastbound.departureTimeISO === 'string', 'eastbound.departureTimeISO should be a string');
    assert(data.eastbound.source === 'schedule' || data.eastbound.source === 'rt', 'eastbound.source should be schedule or rt');
  }
});

// Voice endpoint tests
test('GET /v1/voice/next?station=cypress_waters returns plain text', async () => {
  const res = await fetch(`${BASE_URL}/v1/voice/next?station=cypress_waters`);
  assert(res.status === 200, `Expected 200, got ${res.status}`);

  const contentType = res.headers.get('content-type');
  assert(contentType.includes('text/plain'), `Expected text/plain, got ${contentType}`);

  const text = await res.text();
  assert(text.length > 0, 'Expected non-empty response');
  assert(text.includes('As of'), 'Expected "As of" in response');
  assert(text.includes('Cypress Waters'), 'Expected station name in response');
});

test('GET /v1/voice/next with alias "CW" works', async () => {
  const res = await fetch(`${BASE_URL}/v1/voice/next?station=CW`);
  assert(res.status === 200, `Expected 200, got ${res.status}`);

  const text = await res.text();
  assert(text.includes('Cypress Waters'), 'Expected Cypress Waters in response');
});

test('GET /v1/voice/next includes both directions', async () => {
  const res = await fetch(`${BASE_URL}/v1/voice/next?station=cypress_waters`);
  const text = await res.text();

  // Should mention both directions (or no service for one)
  const hasEastbound = text.includes('Eastbound') || text.includes('eastbound');
  const hasWestbound = text.includes('Westbound') || text.includes('westbound');
  assert(hasEastbound, 'Expected eastbound info in response');
  assert(hasWestbound, 'Expected westbound info in response');
});

test('GET /v1/voice/next has Cache-Control header', async () => {
  const res = await fetch(`${BASE_URL}/v1/voice/next?station=cypress_waters`);
  const cacheControl = res.headers.get('cache-control');
  assert(cacheControl && cacheControl.includes('max-age=10'), `Expected max-age=10, got ${cacheControl}`);
});

test('GET /v1/voice/next without station returns 400', async () => {
  const res = await fetch(`${BASE_URL}/v1/voice/next`);
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

// Test all stations
const stations = [
  'dfw_terminal_b', 'dfw_north', 'cypress_waters', 'downtown_carrollton',
  'addison', 'knoll_trail', 'ut_dallas', 'cityline_bush', 'twelfth_street', 'shiloh_road'
];

for (const station of stations) {
  test(`GET /v1/next?station=${station} works`, async () => {
    const res = await fetch(`${BASE_URL}/v1/next?station=${station}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const data = await res.json();
    assert(data.slug === station, `Expected slug ${station}, got ${data.slug}`);
  });
}

runTests();
