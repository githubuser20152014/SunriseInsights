// Atlanta, GA coordinates
const ATLANTA_LAT = 33.7490;
const ATLANTA_LON = -84.3880;

// Simple sunrise calculation using astronomical formulas
export function calculateSunrise(date: Date): Date {
  const dayOfYear = getDayOfYear(date);
  const year = date.getFullYear();
  
  // Calculate the equation of time and solar declination
  const P = Math.asin(0.39795 * Math.cos(0.98563 * (dayOfYear - 173) * Math.PI / 180));
  
  // Calculate sunrise time
  const argument = -Math.sin(ATLANTA_LAT * Math.PI / 180) * Math.sin(P) / (Math.cos(ATLANTA_LAT * Math.PI / 180) * Math.cos(P));
  
  if (Math.abs(argument) > 1) {
    // Polar day or polar night
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 30, 0); // Default to 6:30 AM
  }
  
  const hourAngle = Math.acos(argument);
  const sunriseHour = 12 - hourAngle * 12 / Math.PI;
  
  // Adjust for timezone (Atlanta is UTC-5 in winter, UTC-4 in summer)
  const isDST = isDaylightSavingTime(date);
  const timezoneOffset = isDST ? 4 : 5;
  const localSunriseHour = sunriseHour - timezoneOffset;
  
  const hours = Math.floor(localSunriseHour);
  const minutes = Math.floor((localSunriseHour - hours) * 60);
  
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

export function getTodaysSunrise(): { time: Date; formatted: string } {
  const today = new Date();
  const sunriseTime = calculateSunrise(today);
  return {
    time: sunriseTime,
    formatted: formatSunriseTime(sunriseTime)
  };
}

export function shouldRefreshDailyMessage(): boolean {
  const now = new Date();
  const sunrise = calculateSunrise(now);
  
  // Check if current time is within 1 hour after sunrise
  const oneHourAfterSunrise = new Date(sunrise.getTime() + 60 * 60 * 1000);
  
  return now >= sunrise && now <= oneHourAfterSunrise;
}
