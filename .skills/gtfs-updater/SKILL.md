---
name: gtfs-updater
description: |
  GTFS feed update checker for DART Silver Line transit app. Validates local GTFS data against DART and TEXRail/Trinity Metro official feeds, alerts when updates are available, and updates the app with latest schedules.

  MANDATORY TRIGGERS: GTFS, schedule update, DART update, TEXRail update, transit feed, check schedules, validate schedules, Silver Line update
---

# GTFS Updater for DART Silver Line

Check and update GTFS transit feeds for the DART Silver Line app.

## Feed Sources

| Agency | GTFS URL | Local Path |
|--------|----------|------------|
| DART | https://www.dart.org/transitdata/latest/google_transit.zip | GTFS/DART/ |
| TEXRail | https://gtfsdata.ridetm.org/gtfs/fwtatransitdata.zip | GTFS/TEXRail/ |

## Quick Check

Run the check script to compare local vs remote versions:

```bash
python3 scripts/check_gtfs.py "/path/to/DART Silver Line"
```

Add `--update` flag to automatically download and apply updates:

```bash
python3 scripts/check_gtfs.py "/path/to/DART Silver Line" --update
```

## Manual Workflow

If the script is unavailable, follow these steps:

### 1. Check Current Versions

Read local feed versions:
- `GTFS/DART/feed_info.txt` - Look for `feed_version` field
- `GTFS/TEXRail/feed_info.txt` - Look for `feed_version` field

### 2. Download Latest Feeds

```bash
# DART
curl -L -o dart.zip "https://www.dart.org/transitdata/latest/google_transit.zip"
unzip dart.zip -d dart_new

# TEXRail
curl -L -o texrail.zip "https://gtfsdata.ridetm.org/gtfs/fwtatransitdata.zip"
unzip texrail.zip -d texrail_new
```

### 3. Compare Versions

Check `feed_info.txt` in downloaded feeds against local versions. Key fields:
- `feed_version` - Version identifier
- `feed_start_date` - When schedule becomes effective
- `feed_end_date` - When schedule expires

### 4. Update If Needed

Copy all `.txt` files from downloaded feed to appropriate `GTFS/` subdirectory.

### 5. Deploy to Production

```bash
cd "DART Silver Line"
git add GTFS/DART/*.txt GTFS/TEXRail/*.txt
git commit -m "Update GTFS feeds to [version]"
git push origin main
```

The app is hosted on Netlify and auto-deploys from the main branch.

## GitHub Repository

- Repo: https://github.com/wlivsey/dart_silverline.git
- Hosting: Netlify (auto-deploys on push to main)
