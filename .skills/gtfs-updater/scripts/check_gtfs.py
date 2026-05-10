#!/usr/bin/env python3
"""
GTFS Feed Version Checker and Updater for DART Silver Line App

Checks DART and TEXRail GTFS feeds for updates and downloads if newer.
"""

import argparse
import csv
import io
import os
import shutil
import sys
import tempfile
import urllib.request
import zipfile
from dataclasses import dataclass
from typing import Optional


@dataclass
class FeedInfo:
    publisher_name: str
    version: str
    start_date: str
    end_date: str


FEEDS = {
    "DART": {
        "url": "https://www.dart.org/transitdata/latest/google_transit.zip",
        "local_path": "GTFS/DART",
    },
    "TEXRail": {
        "url": "https://gtfsdata.ridetm.org/gtfs/fwtatransitdata.zip",
        "local_path": "GTFS/TEXRail",
    },
}


def parse_feed_info(feed_info_content: str) -> Optional[FeedInfo]:
    """Parse feed_info.txt content and return FeedInfo object."""
    reader = csv.DictReader(io.StringIO(feed_info_content))
    for row in reader:
        return FeedInfo(
            publisher_name=row.get("feed_publisher_name", "Unknown"),
            version=row.get("feed_version", "Unknown"),
            start_date=row.get("feed_start_date", "Unknown"),
            end_date=row.get("feed_end_date", "Unknown"),
        )
    return None


def get_local_feed_info(app_path: str, feed_name: str) -> Optional[FeedInfo]:
    """Read local feed_info.txt and return FeedInfo."""
    feed_info_path = os.path.join(app_path, FEEDS[feed_name]["local_path"], "feed_info.txt")
    if not os.path.exists(feed_info_path):
        return None
    with open(feed_info_path, "r") as f:
        return parse_feed_info(f.read())


def download_and_extract_feed(url: str, extract_to: str) -> bool:
    """Download GTFS zip and extract to directory."""
    # Cloudflare blocks Python-urllib's default UA; set a browser-ish one.
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; gtfs-updater/1.0)"},
    )
    try:
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
            tmp_path = tmp.name
            with urllib.request.urlopen(req, timeout=60) as resp:
                shutil.copyfileobj(resp, tmp)
        with zipfile.ZipFile(tmp_path, "r") as z:
            z.extractall(extract_to)
        os.unlink(tmp_path)
        return True
    except Exception as e:
        print(f"Error downloading: {e}", file=sys.stderr)
        return False


def get_remote_feed_info(feed_name: str) -> Optional[FeedInfo]:
    """Download feed and extract feed_info.txt."""
    with tempfile.TemporaryDirectory() as tmpdir:
        if not download_and_extract_feed(FEEDS[feed_name]["url"], tmpdir):
            return None
        feed_info_path = os.path.join(tmpdir, "feed_info.txt")
        if os.path.exists(feed_info_path):
            with open(feed_info_path, "r") as f:
                return parse_feed_info(f.read())
    return None


def update_feed(app_path: str, feed_name: str) -> bool:
    """Download and update local GTFS feed."""
    local_path = os.path.join(app_path, FEEDS[feed_name]["local_path"])
    with tempfile.TemporaryDirectory() as tmpdir:
        if not download_and_extract_feed(FEEDS[feed_name]["url"], tmpdir):
            return False
        # Copy all txt files to local path
        for f in os.listdir(tmpdir):
            if f.endswith(".txt"):
                shutil.copy2(os.path.join(tmpdir, f), local_path)
    return True


def check_feeds(app_path: str, update: bool = False) -> dict:
    """Check all feeds and optionally update."""
    results = {}
    for feed_name in FEEDS:
        local = get_local_feed_info(app_path, feed_name)
        remote = get_remote_feed_info(feed_name)

        needs_update = False
        if local and remote:
            needs_update = local.version != remote.version

        results[feed_name] = {
            "local_version": local.version if local else "Not found",
            "remote_version": remote.version if remote else "Error fetching",
            "local_dates": f"{local.start_date} - {local.end_date}" if local else "N/A",
            "remote_dates": f"{remote.start_date} - {remote.end_date}" if remote else "N/A",
            "needs_update": needs_update,
            "updated": False,
        }

        if needs_update and update:
            if update_feed(app_path, feed_name):
                results[feed_name]["updated"] = True
                print(f"✅ Updated {feed_name} to {remote.version}")
            else:
                print(f"❌ Failed to update {feed_name}")

    return results


def main():
    parser = argparse.ArgumentParser(description="Check and update GTFS feeds")
    parser.add_argument("app_path", help="Path to DART Silver Line app folder")
    parser.add_argument("--update", "-u", action="store_true", help="Update feeds if newer available")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    results = check_feeds(args.app_path, args.update)

    if args.json:
        import json
        print(json.dumps(results, indent=2))
    else:
        print("\n" + "=" * 60)
        print("GTFS Feed Status")
        print("=" * 60)
        for feed_name, info in results.items():
            status = "⚠️  OUTDATED" if info["needs_update"] else "✅ Current"
            if info["updated"]:
                status = "✅ UPDATED"
            print(f"\n{feed_name}:")
            print(f"  Local:  {info['local_version']} ({info['local_dates']})")
            print(f"  Remote: {info['remote_version']} ({info['remote_dates']})")
            print(f"  Status: {status}")
        print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
