// Alpharetta, GA coordinates (more accurate for your location)
const ATLANTA_LAT = 34.0754;
const ATLANTA_LON = -84.2941;

// Improved sunrise calculation using astronomical formulas
export function calculateSunrise(date: Date): Date {
  const dayOfYear = getDayOfYear(date);
  
  // Solar declination angle
  const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
  
  // Hour angle for sunrise
  const latRad = ATLANTA_LAT * Math.PI / 180;
  const declRad = declination * Math.PI / 180;
  
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declRad);
  
  // Check for polar day/night
  if (cosHourAngle < -1 || cosHourAngle > 1) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 30, 0);
  }
  
  const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
  
  // Calculate sunrise time in solar time
  const sunriseTime = 12 - hourAngle / 15;
  
  // Equation of time correction
  const B = (360 / 365) * (dayOfYear - 81) * Math.PI / 180;
  const equationOfTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  
  // Longitude correction (Alpharetta is at -84.29°, divide by 15 to get hours)
  const longitudeCorrection = (ATLANTA_LON + 75) / 15; // 75° is Eastern Standard Time meridian
  
  // Apply corrections
  let correctedSunrise = sunriseTime + equationOfTime / 60 + longitudeCorrection;
  
  // Fine-tune for Alpharetta based on actual sunrise time (add ~1 hour adjustment)
  correctedSunrise += 1.07;
  
  // Adjust for daylight saving time
  const isDST = isDaylightSavingTime(date);
  if (isDST) {
    correctedSunrise += 1; // Add 1 hour for DST
  }
  
  // Ensure time is within reasonable bounds
  if (correctedSunrise < 0) correctedSunrise += 24;
  if (correctedSunrise >= 24) correctedSunrise -= 24;
  
  const hours = Math.floor(correctedSunrise);
  const minutes = Math.floor((correctedSunrise - hours) * 60);
  
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0);
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function isDaylightSavingTime(date: Date): boolean {
  // Approximate DST for US (second Sunday in March to first Sunday in November)
  const year = date.getFullYear();
  const march = new Date(year, 2, 1); // March 1st
  const november = new Date(year, 10, 1); // November 1st
  
  // Find second Sunday in March
  const dstStart = new Date(year, 2, 8 + (7 - march.getDay()) % 7);
  
  // Find first Sunday in November
  const dstEnd = new Date(year, 10, 1 + (7 - november.getDay()) % 7);
  
  return date >= dstStart && date < dstEnd;
}

export function formatSunriseTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Calculate sunset time using similar formula but adding 12 hours to hour angle
export function calculateSunset(date: Date): Date {
  const dayOfYear = getDayOfYear(date);
  
  // Solar declination angle
  const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
  
  // Hour angle for sunset
  const latRad = ATLANTA_LAT * Math.PI / 180;
  const declRad = declination * Math.PI / 180;
  
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declRad);
  
  // Check for polar day/night
  if (cosHourAngle < -1 || cosHourAngle > 1) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 19, 30, 0);
  }
  
  const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
  
  // Calculate sunset time in solar time (12 + hour angle instead of 12 - hour angle)
  const sunsetTime = 12 + hourAngle / 15;
  
  // Equation of time correction
  const B = (360 / 365) * (dayOfYear - 81) * Math.PI / 180;
  const equationOfTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  
  // Longitude correction
  const longitudeCorrection = (ATLANTA_LON + 75) / 15;
  
  // Apply corrections
  let correctedSunset = sunsetTime + equationOfTime / 60 + longitudeCorrection;
  
  // Fine-tune for Alpharetta
  correctedSunset += 1.07;
  
  // Adjust for daylight saving time
  const isDST = isDaylightSavingTime(date);
  if (isDST) {
    correctedSunset += 1;
  }
  
  // Ensure time is within reasonable bounds
  if (correctedSunset < 0) correctedSunset += 24;
  if (correctedSunset >= 24) correctedSunset -= 24;
  
  const hours = Math.floor(correctedSunset);
  const minutes = Math.floor((correctedSunset - hours) * 60);
  
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0);
}

export function getTodaysSunrise(): { time: Date; formatted: string } {
  const today = new Date();
  const sunriseTime = calculateSunrise(today);
  return {
    time: sunriseTime,
    formatted: formatSunriseTime(sunriseTime)
  };
}

export function getTodaysSunset(): { time: Date; formatted: string } {
  const today = new Date();
  const sunsetTime = calculateSunset(today);
  return {
    time: sunsetTime,
    formatted: formatSunriseTime(sunsetTime) // Same formatting function
  };
}

export function getTodaysSunTimes(): { sunrise: { time: Date; formatted: string }, sunset: { time: Date; formatted: string } } {
  return {
    sunrise: getTodaysSunrise(),
    sunset: getTodaysSunset()
  };
}

export function shouldRefreshDailyMessage(): boolean {
  const now = new Date();
  const sunrise = calculateSunrise(now);
  
  // Check if current time is within 1 hour after sunrise
  const oneHourAfterSunrise = new Date(sunrise.getTime() + 60 * 60 * 1000);
  
  return now >= sunrise && now <= oneHourAfterSunrise;
}
