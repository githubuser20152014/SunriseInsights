interface WeatherData {
  temperature: number;
  maxTemp: number;
  minTemp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export async function getWeatherForAlpharetta(): Promise<WeatherData> {
  const apiKey = process.env.WEATHER_API_KEY;
  
  if (!apiKey) {
    throw new Error('Weather API key not configured');
  }

  try {
    // Using WeatherAPI.com format - adjust if using a different provider
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=Alpharetta,GA&aqi=no`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      temperature: Math.round(data.current.temp_f),
      maxTemp: Math.round(data.current.temp_f + 5), // Approximation since current API doesn't provide forecast
      minTemp: Math.round(data.current.temp_f - 10), // Approximation 
      condition: data.current.condition.text,
      icon: data.current.condition.icon,
      humidity: data.current.humidity,
      windSpeed: Math.round(data.current.wind_mph)
    };
  } catch (error) {
    // Fallback for OpenWeatherMap API format
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Alpharetta,GA,US&appid=${apiKey}&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        maxTemp: Math.round(data.main.temp_max),
        minTemp: Math.round(data.main.temp_min),
        condition: data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1),
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed)
      };
    } catch (openWeatherError) {
      console.error('Weather API error:', error);
      throw new Error('Unable to fetch weather data');
    }
  }
}