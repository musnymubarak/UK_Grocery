import httpx
import logging
from decimal import Decimal
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)


class DistanceServiceUnavailable(Exception):
    """Raised when a real distance/geocode result can't be obtained — never
    caught silently. Callers must decide explicitly how to degrade (e.g. fall
    back to the postcode/zone system), instead of receiving a fake number that
    looks like a real answer."""
    pass


DELIVERY_TIERS = [
    (1.0, Decimal("1.99")),
    (2.0, Decimal("2.99")),
    (3.0, Decimal("3.99")),
    (4.0, Decimal("4.99")),
    (5.0, Decimal("5.99")),
]
MAX_DELIVERY_MILES = 5.0

async def geocode_postcode(postcode: str) -> Tuple[float, float]:
    """
    Convert UK postcode to lat/lng using Google Geocoding API.
    Raises DistanceServiceUnavailable if a real result can't be obtained —
    callers decide how to degrade, this never fabricates a coordinate.
    """
    if not settings.GOOGLE_MAPS_API_KEY or settings.GOOGLE_MAPS_API_KEY == "YOUR_GOOGLE_MAPS_API_KEY_HERE":
        logger.error("GOOGLE_MAPS_API_KEY is not configured — cannot geocode postcodes")
        raise DistanceServiceUnavailable("GOOGLE_MAPS_API_KEY is not configured")

    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": postcode,
        "region": "uk",
        "key": settings.GOOGLE_MAPS_API_KEY,
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params)
            data = resp.json()

        if data["status"] != "OK" or not data["results"]:
            logger.error(f"Geocoding failed for {postcode}: {data.get('status')}")
            raise DistanceServiceUnavailable(f"Could not geocode postcode: {postcode} ({data.get('status')})")

        loc = data["results"][0]["geometry"]["location"]
        return loc["lat"], loc["lng"]
    except DistanceServiceUnavailable:
        raise
    except Exception as e:
        logger.exception(f"Error calling Google Geocoding API for {postcode}: {e}")
        raise DistanceServiceUnavailable(f"Geocoding API call failed: {e}") from e

async def get_driving_distance_miles(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float,
) -> float:
    """
    Get driving distance in miles using Google Distance Matrix API.
    Raises DistanceServiceUnavailable if a real result can't be obtained —
    callers decide how to degrade, this never fabricates a distance.
    """
    if not settings.GOOGLE_MAPS_API_KEY or settings.GOOGLE_MAPS_API_KEY == "YOUR_GOOGLE_MAPS_API_KEY_HERE":
        logger.error("GOOGLE_MAPS_API_KEY is not configured — cannot calculate driving distance")
        raise DistanceServiceUnavailable("GOOGLE_MAPS_API_KEY is not configured")

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": f"{origin_lat},{origin_lng}",
        "destinations": f"{dest_lat},{dest_lng}",
        "units": "imperial",
        "key": settings.GOOGLE_MAPS_API_KEY,
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params)
            data = resp.json()

        if data["status"] != "OK" or not data["rows"] or data["rows"][0]["elements"][0]["status"] != "OK":
            logger.error(f"Distance Matrix call failed: {data.get('status')}")
            raise DistanceServiceUnavailable(f"Distance Matrix API returned status {data.get('status')}")

        element = data["rows"][0]["elements"][0]
        # Distance comes in meters, convert to miles
        meters = element["distance"]["value"]
        return meters / 1609.344
    except DistanceServiceUnavailable:
        raise
    except Exception as e:
        logger.exception(f"Error calling Google Distance Matrix API: {e}")
        raise DistanceServiceUnavailable(f"Distance Matrix API call failed: {e}") from e

def get_delivery_fee(distance_miles: float) -> Optional[Decimal]:
    """Return delivery fee based on distance tier, or None if undeliverable."""
    if distance_miles > MAX_DELIVERY_MILES:
        return None
    for max_miles, fee in DELIVERY_TIERS:
        if distance_miles <= max_miles:
            return fee
    return None
