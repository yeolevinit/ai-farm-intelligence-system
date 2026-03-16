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
    """Generate farming advisories based on weather conditions."""
    advisories = []
    main = weather_data.get("main", {})
    wind = weather_data.get("wind", {})
    weather_desc = weather_data.get("weather", [{}])[0].get("main", "").lower()

    temp = main.get("temp", 20)
    humidity = main.get("humidity", 50)
    wind_speed = wind.get("speed", 0)

    if "rain" in weather_desc:
        advisories.append("Rain expected — delay irrigation and pesticide spraying.")
    if temp > 35:
        advisories.append("High temperature alert — ensure adequate irrigation and shade for sensitive crops.")
    if temp < 10:
        advisories.append("Low temperature — protect frost-sensitive crops tonight.")
    if humidity > 80:
        advisories.append("High humidity — monitor crops for fungal disease risk.")
    if wind_speed > 10:
        advisories.append("Strong winds — avoid spraying pesticides or fertilizers today.")
    if not advisories:
        advisories.append("Weather conditions are favorable for most farming activities.")

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
