// DART Silver Line Schedule Data
// Shared module for API endpoints

// Station definitions with aliases
const STATIONS = {
  dfw_terminal_b: {
    name: "DFW Terminal B",
    slug: "dfw_terminal_b",
    aliases: ["dfw terminal b", "dfw-terminal-b", "dfw_terminal_b", "dfwb", "terminal b", "dfw"],
    eastboundIdx: 0,
    westboundIdx: 9
  },
  dfw_north: {
    name: "DFW North",
    slug: "dfw_north",
    aliases: ["dfw north", "dfw-north", "dfw_north", "dfwn"],
    eastboundIdx: 1,
    westboundIdx: 8
  },
  cypress_waters: {
    name: "Cypress Waters",
    slug: "cypress_waters",
    aliases: ["cypress waters", "cypress-waters", "cypress_waters", "cw", "cypress"],
    eastboundIdx: 2,
    westboundIdx: 7
  },
  downtown_carrollton: {
    name: "Downtown Carrollton",
    slug: "downtown_carrollton",
    aliases: ["downtown carrollton", "downtown-carrollton", "downtown_carrollton", "carrollton", "dtwn carrollton"],
    eastboundIdx: 3,
    westboundIdx: 6
  },
  addison: {
    name: "Addison",
    slug: "addison",
    aliases: ["addison"],
    eastboundIdx: 4,
    westboundIdx: 5
  },
  knoll_trail: {
    name: "Knoll Trail",
    slug: "knoll_trail",
    aliases: ["knoll trail", "knoll-trail", "knoll_trail", "knoll"],
    eastboundIdx: 5,
    westboundIdx: 4
  },
  ut_dallas: {
    name: "UT Dallas",
    slug: "ut_dallas",
    aliases: ["ut dallas", "ut-dallas", "ut_dallas", "utd", "utdallas"],
    eastboundIdx: 6,
    westboundIdx: 3
  },
  cityline_bush: {
    name: "CityLine/Bush",
    slug: "cityline_bush",
    aliases: ["cityline/bush", "cityline-bush", "cityline_bush", "cityline", "bush"],
    eastboundIdx: 7,
    westboundIdx: 2
  },
  twelfth_street: {
    name: "12th Street",
    slug: "twelfth_street",
    aliases: ["12th street", "12th-street", "twelfth_street", "12th", "12th_street"],
    eastboundIdx: 8,
    westboundIdx: 1
  },
  shiloh_road: {
    name: "Shiloh Road",
    slug: "shiloh_road",
    aliases: ["shiloh road", "shiloh-road", "shiloh_road", "shiloh"],
    eastboundIdx: 9,
    westboundIdx: 0
  }
};

// Build reverse lookup for aliases
const ALIAS_MAP = {};
for (const [slug, station] of Object.entries(STATIONS)) {
  for (const alias of station.aliases) {
    ALIAS_MAP[alias.toLowerCase()] = slug;
  }
}

// Weekday Eastbound (to Shiloh Road)
const weekdayEastbound = [
  ["04:28", "04:34", "04:43", "04:50", "04:59", "05:01", "05:09", "05:15", "05:19", "05:22"],
  ["05:28", "05:34", "05:43", "05:50", "05:59", "06:01", "06:09", "06:15", "06:19", "06:22"],
  ["05:58", "06:04", "06:13", "06:20", "06:29", "06:31", "06:39", "06:45", "06:49", "06:52"],
  ["06:28", "06:34", "06:43", "06:50", "06:59", "07:01", "07:09", "07:15", "07:19", "07:22"],
  ["06:58", "07:04", "07:13", "07:20", "07:29", "07:31", "07:39", "07:45", "07:49", "07:52"],
  ["07:28", "07:34", "07:43", "07:50", "07:59", "08:01", "08:09", "08:15", "08:19", "08:22"],
  ["07:58", "08:04", "08:13", "08:20", "08:29", "08:31", "08:39", "08:45", "08:49", "08:52"],
  ["08:28", "08:34", "08:43", "08:50", "08:59", "09:01", "09:09", "09:15", "09:19", "09:22"],
  ["08:58", "09:04", "09:13", "09:20", "09:29", "09:31", "09:39", "09:45", "09:49", "09:52"],
  ["09:28", "09:34", "09:43", "09:50", "09:59", "10:01", "10:09", "10:15", "10:19", "10:22"],
  ["10:28", "10:34", "10:43", "10:50", "10:59", "11:01", "11:09", "11:15", "11:19", "11:22"],
  ["11:28", "11:34", "11:43", "11:50", "11:59", "12:01", "12:09", "12:15", "12:19", "12:22"],
  ["12:28", "12:34", "12:43", "12:50", "12:59", "13:01", "13:09", "13:15", "13:19", "13:22"],
  ["13:28", "13:34", "13:43", "13:50", "13:59", "14:01", "14:09", "14:15", "14:19", "14:22"],
  ["14:28", "14:34", "14:43", "14:50", "14:59", "15:01", "15:09", "15:15", "15:19", "15:22"],
  ["14:58", "15:04", "15:13", "15:20", "15:29", "15:31", "15:39", "15:45", "15:49", "15:52"],
  ["15:28", "15:34", "15:43", "15:50", "15:59", "16:01", "16:09", "16:15", "16:19", "16:22"],
  ["15:58", "16:04", "16:13", "16:20", "16:29", "16:31", "16:39", "16:45", "16:49", "16:52"],
  ["16:28", "16:34", "16:43", "16:50", "16:59", "17:01", "17:09", "17:15", "17:19", "17:22"],
  ["16:58", "17:04", "17:13", "17:20", "17:29", "17:31", "17:39", "17:45", "17:49", "17:52"],
  ["17:28", "17:34", "17:43", "17:50", "17:59", "18:01", "18:09", "18:15", "18:19", "18:22"],
  ["17:58", "18:04", "18:13", "18:20", "18:29", "18:31", "18:39", "18:45", "18:49", "18:52"],
  ["18:28", "18:34", "18:43", "18:50", "18:59", "19:01", "19:09", "19:15", "19:19", "19:22"],
  ["18:58", "19:04", "19:13", "19:20", "19:29", "19:31", "19:39", "19:45", "19:49", "19:52"],
  ["19:28", "19:34", "19:43", "19:50", "19:59", "20:01", "20:09", "20:15", "20:19", "20:22"],
  ["20:28", "20:34", "20:43", "20:50", "20:59", "21:01", "21:09", "21:15", "21:19", "21:22"],
  ["21:28", "21:34", "21:43", "21:50", "21:59", "22:01", "22:09", "22:15", "22:19", "22:22"],
  ["22:28", "22:34", "22:43", "22:50", "22:59", "23:01", "23:09", "23:15", "23:19", "23:22"],
  ["23:28", "23:34", "23:43", "23:50", "23:59", "00:01", "00:09", "00:15", "00:19", "00:22"],
  ["00:28", "00:34", "00:43", "00:50", "00:59", "01:01", "01:09", "01:15", "01:19", "01:22"]
];

// Weekday Westbound (to DFW Airport)
const weekdayWestbound = [
  ["03:23", "03:27", "03:30", "03:36", "03:43", "03:46", "03:54", "04:01", "04:11", "04:18"],
  ["04:23", "04:27", "04:30", "04:36", "04:43", "04:46", "04:54", "05:01", "05:11", "05:18"],
  ["04:53", "04:57", "05:00", "05:06", "05:13", "05:16", "05:24", "05:31", "05:41", "05:48"],
  ["05:23", "05:27", "05:30", "05:36", "05:43", "05:46", "05:54", "06:01", "06:11", "06:18"],
  ["05:53", "05:57", "06:00", "06:06", "06:13", "06:16", "06:24", "06:31", "06:41", "06:48"],
  ["06:23", "06:27", "06:30", "06:36", "06:43", "06:46", "06:54", "07:01", "07:11", "07:18"],
  ["06:53", "06:57", "07:00", "07:06", "07:13", "07:16", "07:24", "07:31", "07:41", "07:48"],
  ["07:23", "07:27", "07:30", "07:36", "07:43", "07:46", "07:54", "08:01", "08:11", "08:18"],
  ["07:53", "07:57", "08:00", "08:06", "08:13", "08:16", "08:24", "08:31", "08:41", "08:48"],
  ["08:23", "08:27", "08:30", "08:36", "08:43", "08:46", "08:54", "09:01", "09:11", "09:18"],
  ["09:23", "09:27", "09:30", "09:36", "09:43", "09:46", "09:54", "10:01", "10:11", "10:18"],
  ["10:23", "10:27", "10:30", "10:36", "10:43", "10:46", "10:54", "11:01", "11:11", "11:18"],
  ["11:23", "11:27", "11:30", "11:36", "11:43", "11:46", "11:54", "12:01", "12:11", "12:18"],
  ["12:23", "12:27", "12:30", "12:36", "12:43", "12:46", "12:54", "13:01", "13:11", "13:18"],
  ["13:23", "13:27", "13:30", "13:36", "13:43", "13:46", "13:54", "14:01", "14:11", "14:18"],
  ["13:53", "13:57", "14:00", "14:06", "14:13", "14:16", "14:24", "14:31", "14:41", "14:48"],
  ["14:23", "14:27", "14:30", "14:36", "14:43", "14:46", "14:54", "15:01", "15:11", "15:18"],
  ["14:53", "14:57", "15:00", "15:06", "15:13", "15:16", "15:24", "15:31", "15:41", "15:48"],
  ["15:23", "15:27", "15:30", "15:36", "15:43", "15:46", "15:54", "16:01", "16:11", "16:18"],
  ["15:53", "15:57", "16:00", "16:06", "16:13", "16:16", "16:24", "16:31", "16:41", "16:48"],
  ["16:23", "16:27", "16:30", "16:36", "16:43", "16:46", "16:54", "17:01", "17:11", "17:18"],
  ["16:53", "16:57", "17:00", "17:06", "17:13", "17:16", "17:24", "17:31", "17:41", "17:48"],
  ["17:23", "17:27", "17:30", "17:36", "17:43", "17:46", "17:54", "18:01", "18:11", "18:18"],
  ["17:53", "17:57", "18:00", "18:06", "18:13", "18:16", "18:24", "18:31", "18:41", "18:48"],
  ["18:23", "18:27", "18:30", "18:36", "18:43", "18:46", "18:54", "19:01", "19:11", "19:18"],
  ["19:23", "19:27", "19:30", "19:36", "19:43", "19:46", "19:54", "20:01", "20:11", "20:18"],
  ["20:23", "20:27", "20:30", "20:36", "20:43", "20:46", "20:54", "21:01", "21:11", "21:18"],
  ["21:23", "21:27", "21:30", "21:36", "21:43", "21:46", "21:54", "22:01", "22:11", "22:18"],
  ["22:23", "22:27", "22:30", "22:36", "22:43", "22:46", "22:54", "23:01", "23:11", "23:18"],
  ["23:23", "23:27", "23:30", "23:36", "23:43", "23:46", "23:54", "00:01", "00:11", "00:18"]
];

// Weekend Eastbound
const weekendEastbound = [
  ["05:28", "05:34", "05:43", "05:50", "05:59", "06:01", "06:09", "06:15", "06:19", "06:22"],
  ["06:28", "06:34", "06:43", "06:50", "06:59", "07:01", "07:09", "07:15", "07:19", "07:22"],
  ["07:28", "07:34", "07:43", "07:50", "07:59", "08:01", "08:09", "08:15", "08:19", "08:22"],
  ["08:28", "08:34", "08:43", "08:50", "08:59", "09:01", "09:09", "09:15", "09:19", "09:22"],
  ["09:28", "09:34", "09:43", "09:50", "09:59", "10:01", "10:09", "10:15", "10:19", "10:22"],
  ["10:28", "10:34", "10:43", "10:50", "10:59", "11:01", "11:09", "11:15", "11:19", "11:22"],
  ["11:28", "11:34", "11:43", "11:50", "11:59", "12:01", "12:09", "12:15", "12:19", "12:22"],
  ["12:28", "12:34", "12:43", "12:50", "12:59", "13:01", "13:09", "13:15", "13:19", "13:22"],
  ["13:28", "13:34", "13:43", "13:50", "13:59", "14:01", "14:09", "14:15", "14:19", "14:22"],
  ["14:28", "14:34", "14:43", "14:50", "14:59", "15:01", "15:09", "15:15", "15:19", "15:22"],
  ["15:28", "15:34", "15:43", "15:50", "15:59", "16:01", "16:09", "16:15", "16:19", "16:22"],
  ["16:28", "16:34", "16:43", "16:50", "16:59", "17:01", "17:09", "17:15", "17:19", "17:22"],
  ["17:28", "17:34", "17:43", "17:50", "17:59", "18:01", "18:09", "18:15", "18:19", "18:22"],
  ["18:28", "18:34", "18:43", "18:50", "18:59", "19:01", "19:09", "19:15", "19:19", "19:22"],
  ["19:28", "19:34", "19:43", "19:50", "19:59", "20:01", "20:09", "20:15", "20:19", "20:22"],
  ["20:28", "20:34", "20:43", "20:50", "20:59", "21:01", "21:09", "21:15", "21:19", "21:22"],
  ["21:28", "21:34", "21:43", "21:50", "21:59", "22:01", "22:09", "22:15", "22:19", "22:22"],
  ["22:28", "22:34", "22:43", "22:50", "22:59", "23:01", "23:09", "23:15", "23:19", "23:22"],
  ["23:28", "23:34", "23:43", "23:50", "23:59", "00:01", "00:09", "00:15", "00:19", "00:22"],
  ["00:28", "00:34", "00:43", "00:50", "00:59", "01:01", "01:09", "01:15", "01:19", "01:22"]
];

// Weekend Westbound
const weekendWestbound = [
  ["04:23", "04:27", "04:30", "04:36", "04:43", "04:46", "04:54", "05:01", "05:11", "05:18"],
  ["05:23", "05:27", "05:30", "05:36", "05:43", "05:46", "05:54", "06:01", "06:11", "06:18"],
  ["06:23", "06:27", "06:30", "06:36", "06:43", "06:46", "06:54", "07:01", "07:11", "07:18"],
  ["07:23", "07:27", "07:30", "07:36", "07:43", "07:46", "07:54", "08:01", "08:11", "08:18"],
  ["08:23", "08:27", "08:30", "08:36", "08:43", "08:46", "08:54", "09:01", "09:11", "09:18"],
  ["09:23", "09:27", "09:30", "09:36", "09:43", "09:46", "09:54", "10:01", "10:11", "10:18"],
  ["10:23", "10:27", "10:30", "10:36", "10:43", "10:46", "10:54", "11:01", "11:11", "11:18"],
  ["11:23", "11:27", "11:30", "11:36", "11:43", "11:46", "11:54", "12:01", "12:11", "12:18"],
  ["12:23", "12:27", "12:30", "12:36", "12:43", "12:46", "12:54", "13:01", "13:11", "13:18"],
  ["13:23", "13:27", "13:30", "13:36", "13:43", "13:46", "13:54", "14:01", "14:11", "14:18"],
  ["14:23", "14:27", "14:30", "14:36", "14:43", "14:46", "14:54", "15:01", "15:11", "15:18"],
  ["15:23", "15:27", "15:30", "15:36", "15:43", "15:46", "15:54", "16:01", "16:11", "16:18"],
  ["16:23", "16:27", "16:30", "16:36", "16:43", "16:46", "16:54", "17:01", "17:11", "17:18"],
  ["17:23", "17:27", "17:30", "17:36", "17:43", "17:46", "17:54", "18:01", "18:11", "18:18"],
  ["18:23", "18:27", "18:30", "18:36", "18:43", "18:46", "18:54", "19:01", "19:11", "19:18"],
  ["19:23", "19:27", "19:30", "19:36", "19:43", "19:46", "19:54", "20:01", "20:11", "20:18"],
  ["20:23", "20:27", "20:30", "20:36", "20:43", "20:46", "20:54", "21:01", "21:11", "21:18"],
  ["21:23", "21:27", "21:30", "21:36", "21:43", "21:46", "21:54", "22:01", "22:11", "22:18"],
  ["22:23", "22:27", "22:30", "22:36", "22:43", "22:46", "22:54", "23:01", "23:11", "23:18"],
  ["23:23", "23:27", "23:30", "23:36", "23:43", "23:46", "23:54", "00:01", "00:11", "00:18"]
];

/**
 * Normalize station input to internal slug
 * @param {string} input - Station name, slug, or alias
 * @returns {string|null} - Internal slug or null if not found
 */
function normalizeStation(input) {
  if (!input) return null;
  const normalized = input.toLowerCase().trim();
  return ALIAS_MAP[normalized] || null;
}

/**
 * Get station data by slug
 * @param {string} slug - Station slug
 * @returns {object|null} - Station data or null
 */
function getStation(slug) {
  return STATIONS[slug] || null;
}

/**
 * Check if current time is weekend in Chicago timezone
 * @param {Date} now - Current date
 * @returns {boolean}
 */
function isWeekend(now) {
  const day = now.getDay();
  return day === 0 || day === 6;
}

/**
 * Get current schedule based on day of week
 * @param {Date} now - Current date
 * @returns {object} - { eastbound, westbound }
 */
function getSchedule(now) {
  if (isWeekend(now)) {
    return { eastbound: weekendEastbound, westbound: weekendWestbound };
  }
  return { eastbound: weekdayEastbound, westbound: weekdayWestbound };
}

/**
 * Parse time string to minutes since midnight
 * @param {string} timeStr - "HH:MM" format
 * @returns {number} - Minutes since midnight
 */
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get current minutes since midnight in Chicago timezone
 * @param {Date} now - Current date
 * @returns {number}
 */
function getCurrentMinutes(now) {
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Calculate minutes until target time, handling day wraparound
 * @param {number} targetMinutes - Target time in minutes
 * @param {number} currentMinutes - Current time in minutes
 * @returns {number} - Minutes until target
 */
function getMinutesUntil(targetMinutes, currentMinutes) {
  let diff = targetMinutes - currentMinutes;
  if (diff < -60) {
    diff += 24 * 60;
  }
  return diff;
}

/**
 * Format minutes to local time string (12-hour format)
 * @param {number} minutes - Minutes since midnight
 * @returns {string} - e.g., "2:43 PM"
 */
function formatTime12h(minutes) {
  const hours24 = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  const ampm = hours24 < 12 ? 'AM' : 'PM';
  return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Format minutes to 24-hour time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} - e.g., "14:43"
 */
function formatTime24h(minutes) {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Create ISO timestamp for a given time on a specific date
 * @param {Date} baseDate - Base date
 * @param {number} minutes - Minutes since midnight
 * @returns {string} - ISO 8601 timestamp
 */
function createISO(baseDate, minutes) {
  const d = new Date(baseDate);
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;

  // Handle overnight times (after midnight)
  if (minutes >= 24 * 60 || hours < 3) {
    d.setDate(d.getDate() + 1);
  }

  d.setHours(hours, mins, 0, 0);
  return d.toISOString();
}

/**
 * Get next departure for a station in a given direction
 * @param {Array} schedule - Schedule array for direction
 * @param {number} stationIdx - Station index in schedule
 * @param {number} currentMinutes - Current time in minutes
 * @returns {object|null} - { timeStr, minutes, minutesUntil } or null
 */
function getNextDeparture(schedule, stationIdx, currentMinutes) {
  let nextDeparture = null;
  let minDiff = Infinity;

  for (const trip of schedule) {
    const timeStr = trip[stationIdx];
    const tripMinutes = parseTime(timeStr);
    const diff = getMinutesUntil(tripMinutes, currentMinutes);

    // Only show upcoming trains (diff >= -1 to catch "arriving now")
    if (diff >= -1 && diff < minDiff) {
      minDiff = diff;
      nextDeparture = {
        timeStr,
        minutes: tripMinutes,
        minutesUntil: Math.max(0, diff)
      };
    }
  }

  return nextDeparture;
}

/**
 * Get next departures for a station in both directions
 * @param {string} stationSlug - Station slug
 * @param {Date} now - Current date/time in Chicago timezone
 * @returns {object} - Complete departure data
 */
function getNextDepartures(stationSlug, now) {
  const station = getStation(stationSlug);
  if (!station) {
    return null;
  }

  const schedule = getSchedule(now);
  const currentMinutes = getCurrentMinutes(now);

  const eastbound = getNextDeparture(schedule.eastbound, station.eastboundIdx, currentMinutes);
  const westbound = getNextDeparture(schedule.westbound, station.westboundIdx, currentMinutes);

  return {
    station,
    now,
    currentMinutes,
    eastbound,
    westbound,
    source: 'schedule' // Static schedule, no RT feed currently
  };
}

module.exports = {
  STATIONS,
  normalizeStation,
  getStation,
  getSchedule,
  getNextDepartures,
  parseTime,
  getCurrentMinutes,
  getMinutesUntil,
  formatTime12h,
  formatTime24h,
  createISO,
  isWeekend
};
