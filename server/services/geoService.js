// Simple in-memory cache to avoid IP geolocation API rate limits (45 requests per minute)
const ipCache = new Map();

/**
 * Service to resolve geolocation coordinates or details from a client's IP address.
 */
export async function getIpLocation(ip) {
  if (!ip) return 'Unknown';

  // Check for local loopbacks or local networks
  if (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('fe80') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.')
  ) {
    return 'Localhost / Development';
  }

  // Clean IP (in case of ipv4-mapped ipv6 addresses like ::ffff:1.2.3.4)
  let cleanIp = ip;
  if (ip.startsWith('::ffff:')) {
    cleanIp = ip.substring(7);
  }

  // Check cache first
  if (ipCache.has(cleanIp)) {
    return ipCache.get(cleanIp);
  }

  try {
    // Call free geolocate API with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 seconds timeout

    const response = await fetch(`http://ip-api.com/json/${cleanIp}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return 'Unknown Location';
    }

    const data = await response.json();
    if (data && data.status === 'success') {
      const city = data.city || '';
      const region = data.regionName || '';
      const country = data.country || '';
      const resolvedLocation = [city, region, country].filter(Boolean).join(', ');
      ipCache.set(cleanIp, resolvedLocation);
      return resolvedLocation;
    }

    return 'Unknown Location';
  } catch (error) {
    console.error(`[GeoService] Failed to lookup IP: ${cleanIp}`, error.message);
    return 'Unknown Location';
  }
}
