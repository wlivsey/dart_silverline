const {
  normalizeStation,
  getNextDepartures,
  formatTime24h,
  createISO
} = require('./lib/schedules');

/**
 * GET /v1/next?station=cypress_waters
 * Returns JSON with next departure data for both directions
 */
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=10',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get station from query params
  const stationInput = event.queryStringParameters?.station;

  if (!stationInput) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Missing required parameter: station',
        example: '/v1/next?station=cypress_waters',
        validStations: [
          'dfw_terminal_b', 'dfw_north', 'cypress_waters', 'downtown_carrollton',
          'addison', 'knoll_trail', 'ut_dallas', 'cityline_bush', 'twelfth_street', 'shiloh_road'
        ]
      })
    };
  }

  // Normalize station
  const stationSlug = normalizeStation(stationInput);

  if (!stationSlug) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: `Unknown station: ${stationInput}`,
        validStations: [
          'dfw_terminal_b', 'dfw_north', 'cypress_waters', 'downtown_carrollton',
          'addison', 'knoll_trail', 'ut_dallas', 'cityline_bush', 'twelfth_street', 'shiloh_road'
        ]
      })
    };
  }

  // Get current time in Chicago timezone
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));

  // Get departure data
  const data = getNextDepartures(stationSlug, now);

  if (!data) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get departure data' })
    };
  }

  // Build response
  const response = {
    station: data.station.name,
    slug: data.station.slug,
    asOf: now.toISOString(),
    eastbound: data.eastbound ? {
      minutes: data.eastbound.minutesUntil,
      departureTimeLocal: formatTime24h(data.eastbound.minutes),
      departureTimeISO: createISO(now, data.eastbound.minutes),
      source: data.source
    } : null,
    westbound: data.westbound ? {
      minutes: data.westbound.minutesUntil,
      departureTimeLocal: formatTime24h(data.westbound.minutes),
      departureTimeISO: createISO(now, data.westbound.minutes),
      source: data.source
    } : null
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(response, null, 2)
  };
};
