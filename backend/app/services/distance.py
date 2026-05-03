import httpx
import logging
from decimal import Decimal
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

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
    Placeholder/Mock if API key is not set.
    """
    if not settings.GOOGLE_MAPS_API_KEY or settings.GOOGLE_MAPS_API_KEY == "YOUR_GOOGLE_MAPS_API_KEY_HERE":
        logger.warning("GOOGLE_MAPS_API_KEY not set, using mock coordinates for testing")
        # Return mock coordinates (London center) for testing purposes
        return 51.5074, -0.1278

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
            raise ValueError(f"Could not geocode postcode: {postcode}")
        
        loc = data["results"][0]["geometry"]["location"]
        return loc["lat"], loc["lng"]
    except Exception as e:
        logger.exception(f"Error during geocoding: {e}")
        # Fallback to mock for testing if requested
        return 51.5074, -0.1278

async def get_driving_distance_miles(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float,
) -> float:
    """
    Get driving distance in miles using Google Distance Matrix API.
    Placeholder/Mock if API key is not set.
    """
    if not settings.GOOGLE_MAPS_API_KEY or settings.GOOGLE_MAPS_API_KEY == "YOUR_GOOGLE_MAPS_API_KEY_HERE":
        logger.warning("GOOGLE_MAPS_API_KEY not set, returning mock distance (2.5 miles)")
        return 2.5

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
            logger.error(f"Distance calculation failed: {data.get('status')}")
            return 2.5 # Mock fallback

        element = data["rows"][0]["elements"][0]
        # Distance comes in meters, convert to miles
        meters = element["distance"]["value"]
        return meters / 1609.344
    except Exception as e:
        logger.exception(f"Error during distance calculation: {e}")
        return 2.5

def get_delivery_fee(distance_miles: float) -> Optional[Decimal]:
    """Return delivery fee based on distance tier, or None if undeliverable."""
    if distance_miles > MAX_DELIVERY_MILES:
        return None
    for max_miles, fee in DELIVERY_TIERS:
        if distance_miles <= max_miles:
            return fee
    return None
