//! GTFS Parser for DART Silver Line and TEXRail
//! Extracts schedule data from GTFS files and outputs JavaScript arrays
//! for embedding in the live display HTML files.

use csv::ReaderBuilder;
use serde::Deserialize;
use std::collections::HashMap;
use std::error::Error;
use std::path::Path;

// Configuration
const DART_GTFS_DIR: &str = "../DART";
const TEXRAIL_GTFS_DIR: &str = "../TEXRail";

// DART Silver Line
const SILVER_LINE_ROUTE_ID: &str = "26810";
const SILVER_LINE_STOPS: [&str; 10] = [
    "33473", // DFW Terminal B
    "33474", // DFW North Station
    "33595", // Cypress Waters Station
    "34292", // Downtown Carrollton
    "33596", // Addison Station
    "33597", // Knoll Trail Station
    "33598", // UT Dallas Station
    "26895", // CityLine/Bush Station
    "34293", // 12th Street Station
    "33600", // Shiloh Rd Station
];

// TEXRail
const TEXRAIL_ROUTE_ID: &str = "7689";
const TEXRAIL_STOPS: [&str; 9] = [
    "28",   // Fort Worth T&P Station
    "78",   // Fort Worth Central Station
    "4166", // North Side Station
    "4167", // Mercantile Center Station
    "4153", // Iron Horse Station
    "4154", // Smithfield Station
    "4155", // Grapevine Main Street Station
    "4156", // DFW Airport North Station
    "4158", // DFW Airport Terminal B Station
];

#[derive(Debug, Deserialize)]
struct Trip {
    route_id: String,
    service_id: String,
    trip_id: String,
    trip_headsign: Option<String>,
    direction_id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StopTime {
    trip_id: String,
    arrival_time: String,
    stop_id: String,
}

#[derive(Debug, Deserialize)]
struct Calendar {
    service_id: String,
    monday: String,
    tuesday: String,
    wednesday: String,
    thursday: String,
    friday: String,
    saturday: String,
    sunday: String,
}

#[derive(Debug, Clone)]
struct TripInfo {
    service_id: String,
    direction: String,
    #[allow(dead_code)]
    headsign: String,
}

#[derive(Debug, Clone)]
struct ScheduleEntry {
    times: Vec<String>,
    first_time: String,
}

#[derive(Debug, Default)]
struct ScheduleResults {
    weekday_eastbound: Vec<ScheduleEntry>,
    weekday_westbound: Vec<ScheduleEntry>,
    weekend_eastbound: Vec<ScheduleEntry>,
    weekend_westbound: Vec<ScheduleEntry>,
}

/// Parse GTFS time (HH:MM:SS) to HH:MM format
fn parse_time(time_str: &str) -> String {
    let parts: Vec<&str> = time_str.trim().split(':').collect();
    if parts.len() < 2 {
        return time_str.to_string();
    }
    let mut hours: i32 = parts[0].parse().unwrap_or(0);
    let minutes: i32 = parts[1].parse().unwrap_or(0);

    // Handle times past midnight (e.g., 25:30:00)
    if hours >= 24 {
        hours -= 24;
    }

    format!("{:02}:{:02}", hours, minutes)
}

/// Read trips from GTFS file and filter by route
fn get_trips_for_route(gtfs_dir: &Path, route_id: &str) -> Result<HashMap<String, TripInfo>, Box<dyn Error>> {
    let mut trips = HashMap::new();
    let path = gtfs_dir.join("trips.txt");

    let mut rdr = ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .from_path(&path)?;

    for result in rdr.deserialize() {
        let trip: Trip = result?;
        if trip.route_id == route_id {
            trips.insert(
                trip.trip_id,
                TripInfo {
                    service_id: trip.service_id,
                    direction: trip.direction_id.unwrap_or_else(|| "0".to_string()),
                    headsign: trip.trip_headsign.unwrap_or_default(),
                },
            );
        }
    }

    Ok(trips)
}

/// Get stop times for given trips
fn get_stop_times_for_trips(
    gtfs_dir: &Path,
    trip_ids: &HashMap<String, TripInfo>,
    stop_order: &[&str],
) -> Result<HashMap<String, HashMap<String, String>>, Box<dyn Error>> {
    let mut schedules: HashMap<String, HashMap<String, String>> = HashMap::new();
    let path = gtfs_dir.join("stop_times.txt");

    let mut rdr = ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .from_path(&path)?;

    for result in rdr.deserialize() {
        let st: StopTime = result?;
        if trip_ids.contains_key(&st.trip_id) {
            let stop_id = st.stop_id.trim().to_string();
            if stop_order.contains(&stop_id.as_str()) {
                let arrival = parse_time(&st.arrival_time);
                schedules
                    .entry(st.trip_id)
                    .or_default()
                    .insert(stop_id, arrival);
            }
        }
    }

    Ok(schedules)
}

/// Read calendar data
fn read_calendar(gtfs_dir: &Path) -> Result<Vec<Calendar>, Box<dyn Error>> {
    let path = gtfs_dir.join("calendar.txt");
    let mut rdr = ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .from_path(&path)?;

    let mut calendars = Vec::new();
    for result in rdr.deserialize() {
        let cal: Calendar = result?;
        calendars.push(cal);
    }

    Ok(calendars)
}

/// Get service days for a given service_id
fn get_service_days(calendars: &[Calendar], service_id: &str) -> Vec<String> {
    for cal in calendars {
        if cal.service_id == service_id {
            let mut days = Vec::new();
            if cal.monday == "1" { days.push("Mon".to_string()); }
            if cal.tuesday == "1" { days.push("Tue".to_string()); }
            if cal.wednesday == "1" { days.push("Wed".to_string()); }
            if cal.thursday == "1" { days.push("Thu".to_string()); }
            if cal.friday == "1" { days.push("Fri".to_string()); }
            if cal.saturday == "1" { days.push("Sat".to_string()); }
            if cal.sunday == "1" { days.push("Sun".to_string()); }
            return days;
        }
    }
    Vec::new()
}

/// Build schedule arrays grouped by service type and direction
fn build_schedule_arrays(
    schedules: &HashMap<String, HashMap<String, String>>,
    trip_info: &HashMap<String, TripInfo>,
    stop_order: &[&str],
    calendars: &[Calendar],
) -> ScheduleResults {
    // Group trips by (service_id, direction)
    let mut grouped: HashMap<(String, String), Vec<ScheduleEntry>> = HashMap::new();

    for (trip_id, stops) in schedules {
        let Some(info) = trip_info.get(trip_id) else {
            continue;
        };

        // Build ordered time array based on direction
        // For westbound (direction=1), reverse the stop order for proper display
        let ordered_stops: Vec<&str> = if info.direction == "1" {
            stop_order.iter().rev().copied().collect()
        } else {
            stop_order.to_vec()
        };

        let mut times = Vec::new();
        let mut has_missing = false;

        for stop_id in &ordered_stops {
            if let Some(time) = stops.get(*stop_id) {
                times.push(time.clone());
            } else {
                has_missing = true;
                break;
            }
        }

        // Skip if missing stops
        if has_missing || times.is_empty() {
            continue;
        }

        let first_time = times[0].clone();
        let key = (info.service_id.clone(), info.direction.clone());

        grouped
            .entry(key)
            .or_default()
            .push(ScheduleEntry { times, first_time });
    }

    // Sort each group by departure time
    for entries in grouped.values_mut() {
        entries.sort_by(|a, b| a.first_time.cmp(&b.first_time));
    }

    // Build results
    let mut results = ScheduleResults::default();

    for ((service_id, direction), trips) in &grouped {
        let days = get_service_days(calendars, service_id);
        let dir_label = if direction == "0" { "Eastbound" } else { "Westbound" };
        println!("    Service {} ({}), {}: {} trips",
            service_id, days.join(", "), dir_label, trips.len());

        // Categorize - treat any weekday service as applying to all weekdays
        // (DART runs same schedule Mon-Fri even if GTFS only shows Mon-Wed)
        let is_weekday = days.contains(&"Mon".to_string())
            || days.contains(&"Tue".to_string())
            || days.contains(&"Wed".to_string())
            || days.contains(&"Thu".to_string())
            || days.contains(&"Fri".to_string());
        let is_weekend = days.contains(&"Sat".to_string())
            || days.contains(&"Sun".to_string());

        if direction == "0" {
            // Eastbound (to Shiloh/DFW)
            if is_weekday {
                results.weekday_eastbound.extend(trips.clone());
            }
            if is_weekend {
                results.weekend_eastbound.extend(trips.clone());
            }
        } else {
            // Westbound (to DFW/Fort Worth)
            if is_weekday {
                results.weekday_westbound.extend(trips.clone());
            }
            if is_weekend {
                results.weekend_westbound.extend(trips.clone());
            }
        }
    }

    // Sort all results by first departure time
    results.weekday_eastbound.sort_by(|a, b| a.first_time.cmp(&b.first_time));
    results.weekday_westbound.sort_by(|a, b| a.first_time.cmp(&b.first_time));
    results.weekend_eastbound.sort_by(|a, b| a.first_time.cmp(&b.first_time));
    results.weekend_westbound.sort_by(|a, b| a.first_time.cmp(&b.first_time));

    results
}

/// Format trips as JavaScript array
fn format_js_array(trips: &[ScheduleEntry]) -> String {
    trips
        .iter()
        .map(|trip| {
            let times_str = trip
                .times
                .iter()
                .map(|t| format!("\"{}\"", t))
                .collect::<Vec<_>>()
                .join(", ");
            format!("            [{}]", times_str)
        })
        .collect::<Vec<_>>()
        .join(",\n")
}

fn process_dart_silver_line() -> Result<ScheduleResults, Box<dyn Error>> {
    println!("Processing DART Silver Line...");

    let gtfs_dir = Path::new(DART_GTFS_DIR);

    // Get Silver Line trips
    let trip_info = get_trips_for_route(gtfs_dir, SILVER_LINE_ROUTE_ID)?;
    println!("  Found {} Silver Line trips", trip_info.len());

    // Get stop times
    let schedules = get_stop_times_for_trips(gtfs_dir, &trip_info, &SILVER_LINE_STOPS)?;
    println!("  Processed {} trips with complete stop times", schedules.len());

    // Read calendar
    let calendars = read_calendar(gtfs_dir)?;

    // Build schedule arrays
    println!("\n  Service patterns found:");
    let results = build_schedule_arrays(&schedules, &trip_info, &SILVER_LINE_STOPS, &calendars);

    Ok(results)
}

fn process_texrail() -> Result<ScheduleResults, Box<dyn Error>> {
    println!("\nProcessing TEXRail...");

    let gtfs_dir = Path::new(TEXRAIL_GTFS_DIR);

    // Get TEXRail trips
    let trip_info = get_trips_for_route(gtfs_dir, TEXRAIL_ROUTE_ID)?;
    println!("  Found {} TEXRail trips", trip_info.len());

    // Get stop times
    let schedules = get_stop_times_for_trips(gtfs_dir, &trip_info, &TEXRAIL_STOPS)?;
    println!("  Processed {} trips with complete stop times", schedules.len());

    // Read calendar
    let calendars = read_calendar(gtfs_dir)?;

    // Build schedule arrays
    println!("\n  Service patterns found:");
    let results = build_schedule_arrays(&schedules, &trip_info, &TEXRAIL_STOPS, &calendars);

    Ok(results)
}

fn output_javascript(silver_line: &ScheduleResults, texrail: &ScheduleResults) {
    println!("\n{}", "=".repeat(60));
    println!("DART SILVER LINE SCHEDULE (for index.html)");
    println!("{}", "=".repeat(60));

    println!(r#"
        // Schedule data - Weekday Eastbound (to Shiloh Road)
        // Generated from GTFS data - same schedule Mon-Fri
        const weekdayEastbound = ["#);
    println!("{}", format_js_array(&silver_line.weekday_eastbound));
    println!("        ];");

    println!(r#"
        // Schedule data - Weekday Westbound (to DFW Airport)
        // Same schedule Mon-Fri
        const weekdayWestbound = ["#);
    println!("{}", format_js_array(&silver_line.weekday_westbound));
    println!("        ];");

    println!(r#"
        // Weekend Eastbound
        const weekendEastbound = ["#);
    println!("{}", format_js_array(&silver_line.weekend_eastbound));
    println!("        ];");

    println!(r#"
        // Weekend Westbound
        const weekendWestbound = ["#);
    println!("{}", format_js_array(&silver_line.weekend_westbound));
    println!("        ];");

    println!("\n{}", "=".repeat(60));
    println!("TEXRAIL SCHEDULE (for texrail/index.html)");
    println!("{}", "=".repeat(60));

    println!(r#"
        // TEXRail Schedule data - Daily schedule (same every day)
        // Generated from GTFS data
        // Eastbound: Fort Worth T&P -> DFW Airport Terminal B
        const dailyEastbound = ["#);
    println!("{}", format_js_array(&texrail.weekday_eastbound));
    println!("        ];");

    println!(r#"
        // Westbound: DFW Airport Terminal B -> Fort Worth T&P
        const dailyWestbound = ["#);
    println!("{}", format_js_array(&texrail.weekday_westbound));
    println!("        ];");

    println!(r#"
        // TEXRail uses same schedule every day
        const weekdayEastbound = dailyEastbound;
        const weekdayWestbound = dailyWestbound;
        const weekendEastbound = dailyEastbound;
        const weekendWestbound = dailyWestbound;"#);
}

fn main() -> Result<(), Box<dyn Error>> {
    println!("GTFS Parser for DART Silver Line and TEXRail (Rust)");
    println!("{}", "=".repeat(50));

    // Process both systems
    let silver_line_results = process_dart_silver_line()?;
    let texrail_results = process_texrail()?;

    // Output JavaScript
    output_javascript(&silver_line_results, &texrail_results);

    println!("\n{}", "=".repeat(60));
    println!("Done! Copy the JavaScript arrays above into the HTML files.");
    println!("{}", "=".repeat(60));

    Ok(())
}
