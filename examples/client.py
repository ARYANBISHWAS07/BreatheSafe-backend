#!/usr/bin/env python3

"""
Example Client - Python
Demonstrates how to use the Air Quality Monitoring System API
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Optional, List

BASE_URL = "http://localhost:3000/api"


class AirQualityClient:
    """REST API Client for Air Quality Monitoring System"""

    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()

    def get_latest_data(self) -> dict:
        """Get the latest sensor reading"""
        response = self.session.get(f"{self.base_url}/data")
        response.raise_for_status()
        return response.json()["data"]

    def get_history(self, limit: int = 100, skip: int = 0) -> List[dict]:
        """Get sensor data history with pagination"""
        response = self.session.get(
            f"{self.base_url}/history",
            params={"limit": limit, "skip": skip}
        )
        response.raise_for_status()
        return response.json()["data"]

    def get_statistics(self, hours: int = 24) -> dict:
        """Get sensor data statistics for a time period"""
        response = self.session.get(
            f"{self.base_url}/statistics",
            params={"hours": hours}
        )
        response.raise_for_status()
        return response.json()["data"]

    def get_data_by_date_range(self, start_date: datetime, end_date: datetime) -> List[dict]:
        """Get sensor data within a date range"""
        response = self.session.get(
            f"{self.base_url}/data/range",
            params={
                "startDate": start_date.isoformat() + "Z",
                "endDate": end_date.isoformat() + "Z"
            }
        )
        response.raise_for_status()
        return response.json()["data"]

    def get_alerts(self, limit: int = 50, unacknowledged: bool = False) -> List[dict]:
        """Get alert history"""
        response = self.session.get(
            f"{self.base_url}/alerts",
            params={"limit": limit, "unacknowledged": unacknowledged}
        )
        response.raise_for_status()
        return response.json()["data"]

    def acknowledge_alert(self, alert_id: str, acknowledged_by: str = "python_client") -> dict:
        """Acknowledge an alert"""
        response = self.session.post(
            f"{self.base_url}/alerts/{alert_id}/acknowledge",
            json={"acknowledgedBy": acknowledged_by}
        )
        response.raise_for_status()
        return response.json()["data"]

    def get_alert_stats(self, hours: int = 24) -> dict:
        """Get alert statistics"""
        response = self.session.get(
            f"{self.base_url}/alerts/stats",
            params={"hours": hours}
        )
        response.raise_for_status()
        return response.json()["data"]

    def get_system_status(self) -> dict:
        """Get detailed system status"""
        response = self.session.get(f"{self.base_url}/status")
        response.raise_for_status()
        return response.json()["data"]

    def check_health(self) -> dict:
        """Check system health"""
        response = self.session.get(f"{self.base_url}/health")
        return response.json()

    def close(self):
        """Close the session"""
        self.session.close()


def main():
    """Main example usage"""
    print("🌍 Air Quality Monitoring System - Python Client Example")
    print("=" * 55)
    print()

    client = AirQualityClient()

    try:
        # Get latest data
        print("📊 Fetching latest sensor data...")
        latest = client.get_latest_data()
        print(f"  PM2.5: {latest['pm25']} µg/m³")
        print(f"  AQI: {latest['aqi']} ({latest['aqiCategory']})")
        print(f"  CRI: {latest['cri']}")
        print(f"  Recorded at: {latest['recordedAt']}")
        print()

        # Get statistics
        print("📈 Fetching 24-hour statistics...")
        stats = client.get_statistics(hours=24)
        print(f"  Average PM2.5: {stats['avgPM25']:.1f} µg/m³")
        print(f"  Max PM2.5: {stats['maxPM25']:.1f} µg/m³")
        print(f"  Average AQI: {stats['avgAQI']:.0f}")
        print(f"  Total readings: {stats['count']}")
        print()

        # Get alerts
        print("🚨 Fetching alerts...")
        alerts = client.get_alerts(limit=10, unacknowledged=True)
        print(f"  Unacknowledged alerts: {len(alerts)}")
        if alerts:
            alert = alerts[0]
            print(f"  Recent alert: [{alert['level']}] {alert['message']}")
            
            # Acknowledge the alert
            print(f"  Acknowledging alert {alert['_id'][:8]}...")
            client.acknowledge_alert(alert['_id'], acknowledged_by="python_example")
            print("  ✓ Alert acknowledged")
        print()

        # Get alert statistics
        print("📊 Alert statistics (last 24 hours)...")
        alert_stats = client.get_alert_stats(hours=24)
        print(f"  LOW: {alert_stats['LOW']}")
        print(f"  MODERATE: {alert_stats['MODERATE']}")
        print(f"  HIGH: {alert_stats['HIGH']}")
        print(f"  Total: {alert_stats['total']}")
        print()

        # Get system status
        print("💚 System status...")
        status = client.get_system_status()
        print(f"  Uptime: {status['uptime']:.0f}s")
        print(f"  MQTT Connected: {status['mqtt']['isConnected']}")
        print(f"  Queue size: {status['mqtt']['queueSize']}")
        print()

        # Health check
        print("🏥 Health check...")
        health = client.check_health()
        print(f"  Status: {health['status']}")
        print(f"  MQTT: {health['mqtt']}")
        print()

        # Get historical data
        print("📅 Getting data from last 24 hours...")
        end_date = datetime.now()
        start_date = end_date - timedelta(hours=24)
        history = client.get_data_by_date_range(start_date, end_date)
        print(f"  Found {len(history)} records in the last 24 hours")
        if history:
            avg_pm25 = sum(h['pm25'] for h in history) / len(history)
            max_pm25 = max(h['pm25'] for h in history)
            print(f"  Average PM2.5: {avg_pm25:.1f} µg/m³")
            print(f"  Max PM2.5: {max_pm25:.1f} µg/m³")
        print()

        print("✅ All tests completed successfully!")

    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the server. Is it running?")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()


if __name__ == "__main__":
    main()
