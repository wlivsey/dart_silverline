#!/usr/bin/env python3
"""
GTFS Parser for DART Silver Line and TEXRail
Extracts schedule data from GTFS files and outputs JavaScript arrays
for embedding in the live display HTML files.
"""

import csv
import json
from collections import defaultdict
from pathlib import Path

# Configuration
DART_GTFS_DIR = Path(__file__).parent / "DART"
TEXRAIL_GTFS_DIR = Path(__file__).parent / "TEXRail"

# DART Silver Line
SILVER_LINE_ROUTE_ID = "26986"
SILVER_LINE_STOPS = [
    "33473",  # DFW Terminal B
    "33474",  # DFW North Station
    "33595",  # Cypress Waters Station
    "34292",  # Downtown Carrollton
    "33596",  # Addison Station
    "33597",  # Knoll Trail Station
    "33598",  # UT Dallas Station
    "26895",  # CityLine/Bush Station
    "34293",  # 12th Street Station
    "33600",  # Shiloh Rd Station
]

# TEXRail
TEXRAIL_ROUTE_ID = "7737"
TEXRAIL_STOPS = [
    "28",    # Fort Worth T&P Station
    "78",    # Fort Worth Central Station
    "4166",  # North Side Station
    "4167",  # Mercantile Center Station
    "4153",  # Iron Horse Station
    "4154",  # Smithfield Station
    "4155",  # Grapevine Main Street Station
    "4156",  # DFW Airport North Station
    "4158",  # DFW Airport Terminal B Station
]


def read_csv(filepath):
    """Read a CSV file and return list of dicts."""
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        return list(reader)


def parse_time(time_str):
    """Parse GTFS time (HH:MM:SS) to HH:MM format."""
    time_str = time_str.strip()
    parts = time_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    # Handle times past midnight (e.g., 25:30:00)
    if hours >= 24:
        hours = hours - 24
    return f"{hours:02d}:{minutes:02d}"


def get_trips_for_route(trips_data, route_id):
    """Get all trip IDs for a given route."""
    trips = {}
    for trip in trips_data:
        if trip['route_id'] == route_id:
            trip_id = trip['trip_id']
            service_id = trip['service_id']
            direction = trip.get('direction_id', '0')
            headsign = trip.get('trip_headsign', '')
            trips[trip_id] = {
                'service_id': service_id,
                'direction': direction,
                'headsign': headsign
            }
    return trips


def get_stop_times_for_trips(stop_times_data, trip_ids, stop_order):
    """Get stop times for given trips, ordered by stop sequence."""
    schedules = defaultdict(dict)

    for st in stop_times_data:
        trip_id = st['trip_id']
        if trip_id in trip_ids:
            stop_id = st['stop_id'].strip()
            if stop_id in stop_order:
                arrival = parse_time(st['arrival_time'])
                schedules[trip_id][stop_id] = arrival

    return schedules


def build_schedule_arrays(schedules, trip_info, stop_order, calendar_data):
    """Build schedule arrays grouped by service type and direction."""
    # Group trips by service_id and direction
    grouped = defaultdict(list)

    for trip_id, stops in schedules.items():
        if trip_id not in trip_info:
            continue

        info = trip_info[trip_id]
        service_id = info['service_id']
        direction = info['direction']
        headsign = info['headsign']

        # Build ordered time array based on direction
        # For westbound (direction=1), reverse the stop order for proper display
        if direction == '1':
            ordered_stops = list(reversed(stop_order))
        else:
            ordered_stops = stop_order

        times = []
        for stop_id in ordered_stops:
            time = stops.get(stop_id, None)
            times.append(time)

        # Skip if missing stops
        if None in times:
            continue

        # Get first departure time for sorting (first station in the route direction)
        first_time = times[0]

        grouped[(service_id, direction)].append({
            'times': times,
            'first_time': first_time,
            'headsign': headsign
        })

    # Sort each group by departure time
    for key in grouped:
        grouped[key].sort(key=lambda x: x['first_time'])

    return grouped


def get_service_days(calendar_data, service_id):
    """Get which days a service runs."""
    for cal in calendar_data:
        if cal['service_id'] == service_id:
            days = []
            if cal['monday'] == '1': days.append('Mon')
            if cal['tuesday'] == '1': days.append('Tue')
            if cal['wednesday'] == '1': days.append('Wed')
            if cal['thursday'] == '1': days.append('Thu')
            if cal['friday'] == '1': days.append('Fri')
            if cal['saturday'] == '1': days.append('Sat')
            if cal['sunday'] == '1': days.append('Sun')
            return days
    return []


def format_js_array(trips, direction_label):
    """Format trips as JavaScript array."""
    lines = []
    for trip in trips:
        times_str = ', '.join([f'"{t}"' for t in trip['times']])
        lines.append(f'            [{times_str}]')
    return ',\n'.join(lines)


def process_dart_silver_line():
    """Process DART GTFS for Silver Line schedules."""
    print("Processing DART Silver Line...")

    # Read GTFS files
    trips_data = read_csv(DART_GTFS_DIR / "trips.txt")
    stop_times_data = read_csv(DART_GTFS_DIR / "stop_times.txt")
    calendar_data = read_csv(DART_GTFS_DIR / "calendar.txt")

    # Get Silver Line trips
    trip_info = get_trips_for_route(trips_data, SILVER_LINE_ROUTE_ID)
    print(f"  Found {len(trip_info)} Silver Line trips")

    # Get stop times
    schedules = get_stop_times_for_trips(stop_times_data, trip_info, SILVER_LINE_STOPS)
    print(f"  Processed {len(schedules)} trips with complete stop times")

    # Build schedule arrays
    grouped = build_schedule_arrays(schedules, trip_info, SILVER_LINE_STOPS, calendar_data)

    # Output results
    print("\n  Service patterns found:")
    results = {
        'weekday_eastbound': [],
        'weekday_westbound': [],
        'weekend_eastbound': [],
        'weekend_westbound': []
    }

    for (service_id, direction), trips in grouped.items():
        days = get_service_days(calendar_data, service_id)
        dir_label = "Eastbound" if direction == '0' else "Westbound"
        print(f"    Service {service_id} ({', '.join(days)}), {dir_label}: {len(trips)} trips")

        # Categorize - treat any weekday service as applying to all weekdays
        # (DART runs same schedule Mon-Fri even if GTFS only shows Mon-Wed)
        is_weekday = 'Mon' in days or 'Tue' in days or 'Wed' in days or 'Thu' in days or 'Fri' in days
        is_weekend = 'Sat' in days or 'Sun' in days

        if direction == '0':  # Eastbound (to Shiloh)
            if is_weekday:
                results['weekday_eastbound'].extend(trips)
            if is_weekend:
                results['weekend_eastbound'].extend(trips)
        else:  # Westbound (to DFW)
            if is_weekday:
                results['weekday_westbound'].extend(trips)
            if is_weekend:
                results['weekend_westbound'].extend(trips)

    # Sort all results by first departure time and deduplicate
    for key in results:
        results[key].sort(key=lambda x: x['first_time'])
        # Deduplicate trips with identical times (e.g., Saturday and Sunday same schedule)
        seen = set()
        deduped = []
        for trip in results[key]:
            times_key = tuple(trip['times'])
            if times_key not in seen:
                seen.add(times_key)
                deduped.append(trip)
        results[key] = deduped

    return results


def process_texrail():
    """Process TEXRail GTFS for schedules."""
    print("\nProcessing TEXRail...")

    # Read GTFS files
    trips_data = read_csv(TEXRAIL_GTFS_DIR / "trips.txt")
    stop_times_data = read_csv(TEXRAIL_GTFS_DIR / "stop_times.txt")
    calendar_data = read_csv(TEXRAIL_GTFS_DIR / "calendar.txt")

    # Get TEXRail trips
    trip_info = get_trips_for_route(trips_data, TEXRAIL_ROUTE_ID)
    print(f"  Found {len(trip_info)} TEXRail trips")

    # Get stop times
    schedules = get_stop_times_for_trips(stop_times_data, trip_info, TEXRAIL_STOPS)
    print(f"  Processed {len(schedules)} trips with complete stop times")

    # Build schedule arrays
    grouped = build_schedule_arrays(schedules, trip_info, TEXRAIL_STOPS, calendar_data)

    # Output results
    print("\n  Service patterns found:")
    results = {
        'weekday_eastbound': [],
        'weekday_westbound': [],
        'saturday_eastbound': [],
        'saturday_westbound': [],
        'sunday_eastbound': [],
        'sunday_westbound': []
    }

    for (service_id, direction), trips in grouped.items():
        days = get_service_days(calendar_data, service_id)
        dir_label = "Eastbound (to DFW)" if direction == '0' else "Westbound (to FW)"
        print(f"    Service {service_id} ({', '.join(days)}), {dir_label}: {len(trips)} trips")

        # Categorize
        is_weekday = 'Mon' in days and 'Fri' in days
        is_saturday = 'Sat' in days and 'Sun' not in days
        is_sunday = 'Sun' in days and 'Sat' not in days

        if direction == '0':  # Eastbound (to DFW)
            if is_weekday:
                results['weekday_eastbound'].extend(trips)
            if is_saturday:
                results['saturday_eastbound'].extend(trips)
            if is_sunday:
                results['sunday_eastbound'].extend(trips)
        else:  # Westbound (to Fort Worth)
            if is_weekday:
                results['weekday_westbound'].extend(trips)
            if is_saturday:
                results['saturday_westbound'].extend(trips)
            if is_sunday:
                results['sunday_westbound'].extend(trips)

    # Sort all results by first departure time
    for key in results:
        results[key].sort(key=lambda x: x['first_time'])

    return results


def output_javascript(silver_line_results, texrail_results):
    """Output JavaScript code for embedding in HTML files."""

    print("\n" + "="*60)
    print("DART SILVER LINE SCHEDULE (for index.html)")
    print("="*60)

    print("""
        // Schedule data - Weekday Eastbound (to Shiloh Road)
        // Generated from GTFS data - same schedule Mon-Fri
        const weekdayEastbound = [""")
    print(format_js_array(silver_line_results['weekday_eastbound'], 'Eastbound'))
    print("        ];")

    print("""
        // Schedule data - Weekday Westbound (to DFW Airport)
        // Same schedule Mon-Fri
        const weekdayWestbound = [""")
    print(format_js_array(silver_line_results['weekday_westbound'], 'Westbound'))
    print("        ];")

    print("""
        // Weekend Eastbound
        const weekendEastbound = [""")
    print(format_js_array(silver_line_results['weekend_eastbound'], 'Eastbound'))
    print("        ];")

    print("""
        // Weekend Westbound
        const weekendWestbound = [""")
    print(format_js_array(silver_line_results['weekend_westbound'], 'Westbound'))
    print("        ];")

    print("\n" + "="*60)
    print("TEXRAIL SCHEDULE (for texrail/index.html)")
    print("="*60)

    # TEXRail runs same schedule daily, so combine weekday for daily
    print("""
        // TEXRail Schedule data - Daily schedule (same every day)
        // Generated from GTFS data
        // Eastbound: Fort Worth T&P -> DFW Airport Terminal B
        const dailyEastbound = [""")
    print(format_js_array(texrail_results['weekday_eastbound'], 'Eastbound'))
    print("        ];")

    print("""
        // Westbound: DFW Airport Terminal B -> Fort Worth T&P
        const dailyWestbound = [""")
    print(format_js_array(texrail_results['weekday_westbound'], 'Westbound'))
    print("        ];")

    print("""
        // TEXRail uses same schedule every day
        const weekdayEastbound = dailyEastbound;
        const weekdayWestbound = dailyWestbound;
        const weekendEastbound = dailyEastbound;
        const weekendWestbound = dailyWestbound;""")


def main():
    print("GTFS Parser for DART Silver Line and TEXRail")
    print("=" * 50)

    # Process both systems
    silver_line_results = process_dart_silver_line()
    texrail_results = process_texrail()

    # Output JavaScript
    output_javascript(silver_line_results, texrail_results)

    print("\n" + "="*60)
    print("Done! Copy the JavaScript arrays above into the HTML files.")
    print("="*60)


if __name__ == "__main__":
    main()
