const {
  normalizeStation,
  getNextDepartures,
  formatTime12h
} = require('./lib/schedules');

/**
 * GET /v1/voice/next?station=cypress_waters
 * Returns plain text response optimized for Siri/voice queries
 *
 * Example: "As of 2:03 PM, Cypress Waters: Eastbound in 40 min (2:43 PM). Westbound in 28 min (2:31 PM)."
 */
exports.handler = async (event) => {
  // Headers for voice response
  const headers = {
    'Content-Type': 'text/plain; charset=utf-8',
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
      body: 'Method not allowed'
    };
  }

  // Get station from query params
  const stationInput = event.queryStringParameters?.station;

  if (!stationInput) {
    return {
      statusCode: 400,
      headers,
      body: 'Missing required parameter: station. Example: /v1/voice/next?station=cypress_waters'
    };
  }

  // Normalize station
  const stationSlug = normalizeStation(stationInput);

  if (!stationSlug) {
    return {
      statusCode: 400,
      headers,
      body: `Unknown station: ${stationInput}. Valid stations include: Cypress Waters, CW, DFW, Addison, UT Dallas, etc.`
    };
  }

  // Get current time in Chicago timezone
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const currentTimeStr = formatTime12h(now.getHours() * 60 + now.getMinutes());

  // Get departure data
  const data = getNextDepartures(stationSlug, now);

  if (!data) {
    return {
      statusCode: 200,
      headers,
      body: `As of ${currentTimeStr}, ${stationInput}: no real-time data.`
    };
  }

  // Check if we have departure data
  const hasEastbound = data.eastbound !== null;
  const hasWestbound = data.westbound !== null;

  if (!hasEastbound && !hasWestbound) {
    return {
      statusCode: 200,
      headers,
      body: `As of ${currentTimeStr}, ${data.station.name}: no real-time data.`
    };
  }

  // Build voice response
  let response = `As of ${currentTimeStr}, ${data.station.name}: `;

  const parts = [];

  if (hasEastbound) {
    const eastTime = formatTime12h(data.eastbound.minutes);
    if (data.eastbound.minutesUntil === 0) {
      parts.push(`Eastbound arriving now (${eastTime})`);
    } else if (data.eastbound.minutesUntil === 1) {
      parts.push(`Eastbound in 1 min (${eastTime})`);
    } else {
      parts.push(`Eastbound in ${data.eastbound.minutesUntil} min (${eastTime})`);
    }
  } else {
    parts.push('No eastbound service');
  }

  if (hasWestbound) {
    const westTime = formatTime12h(data.westbound.minutes);
    if (data.westbound.minutesUntil === 0) {
      parts.push(`Westbound arriving now (${westTime})`);
    } else if (data.westbound.minutesUntil === 1) {
      parts.push(`Westbound in 1 min (${westTime})`);
    } else {
      parts.push(`Westbound in ${data.westbound.minutesUntil} min (${westTime})`);
    }
  } else {
    parts.push('No westbound service');
  }

  response += parts.join('. ') + '.';

  return {
    statusCode: 200,
    headers,
    body: response
  };
};
