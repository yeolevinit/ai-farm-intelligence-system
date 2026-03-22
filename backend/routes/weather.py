from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5"


def generate_advisory(weather_data: dict) -> list[str]:
    """Generate multiple stacked farming advisories based on weather conditions."""
    advisories = []
    main         = weather_data.get("main", {})
    wind         = weather_data.get("wind", {})
    weather_main = weather_data.get("weather", [{}])[0].get("main", "").lower()
    weather_desc = weather_data.get("weather", [{}])[0].get("description", "").lower()

    temp       = main.get("temp", 20)
    humidity   = main.get("humidity", 50)
    wind_speed = wind.get("speed", 0)

    # Precipitation advisories
    if "thunderstorm" in weather_main:
        advisories.append("Thunderstorm alert — stay indoors, secure farm equipment and cover harvested produce.")
    elif "rain" in weather_main or "drizzle" in weather_main:
        advisories.append("Rain expected — delay irrigation and pesticide spraying today.")
        if humidity > 80:
            advisories.append("Wet conditions increase fungal risk — inspect crops for early disease signs after rain.")

    # Temperature advisories
    if temp > 38:
        advisories.append("Extreme heat ({}°C) — irrigate crops early morning or late evening to reduce water loss.".format(round(temp)))
    elif temp > 32:
        advisories.append("High temperature ({}°C) — increase irrigation frequency and mulch to retain soil moisture.".format(round(temp)))
    elif temp < 5:
        advisories.append("Frost risk ({}°C) — cover frost-sensitive crops and young seedlings tonight.".format(round(temp)))
    elif temp < 12:
        advisories.append("Cool temperature ({}°C) — delay transplanting of warm-season crops.".format(round(temp)))

    # Humidity advisories
    if humidity > 85 and "rain" not in weather_main:
        advisories.append("Very high humidity ({}%) — high risk of fungal diseases like blight and mildew. Monitor leaves closely.".format(humidity))
    elif humidity > 75 and "rain" not in weather_main:
        advisories.append("Elevated humidity ({}%) — reduce overhead irrigation to lower disease pressure.".format(humidity))
    elif humidity < 30:
        advisories.append("Low humidity ({}%) — crops losing moisture rapidly. Check soil moisture and irrigate if needed.".format(humidity))

    # Wind advisories
    if wind_speed > 12:
        advisories.append("Strong winds ({} m/s) — avoid all spraying operations. Secure crop supports and netting.".format(round(wind_speed, 1)))
    elif wind_speed > 6:
        advisories.append("Moderate wind ({} m/s) — spray only in early morning when wind is calmer.".format(round(wind_speed, 1)))
    elif wind_speed < 2 and temp > 28:
        advisories.append("Calm and hot conditions — ideal time for foliar spray if temperature allows.")

    # Favorable condition
    if not advisories:
        advisories.append("Weather conditions are favorable for most farming activities today.")
        if 15 <= temp <= 28 and 50 <= humidity <= 70:
            advisories.append("Good conditions for transplanting, spraying, or harvesting operations.")
        if wind_speed < 4:
            advisories.append("Low wind — suitable for pesticide or fertiliser application.")

    return advisories


class WeatherOutput(BaseModel):
    location: str
    temperature: float
    humidity: float
    description: str
    wind_speed: float
    advisories: list[str]


@router.get("/weather", response_model=WeatherOutput)
async def get_weather(city: str):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="OPENWEATHER_API_KEY not set in .env")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/weather",
            params={"q": city, "appid": API_KEY, "units": "metric"}
        )

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found.")
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Weather service unavailable.")

    data = response.json()
    advisories = generate_advisory(data)

    return WeatherOutput(
        location=data["name"],
        temperature=round(data["main"]["temp"], 1),
        humidity=data["main"]["humidity"],
        description=data["weather"][0]["description"].capitalize(),
        wind_speed=round(data["wind"]["speed"], 1),
        advisories=advisories
    )