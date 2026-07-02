const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Your Location'
  } catch {
    return 'Your Location'
  }
}

export const getLocationCoordinates = () => {
  return new Promise((resolve) => {
    let resolved = false

    const resolveWithCity = async (lat, lon, source) => {
      const city = await reverseGeocode(lat, lon)
      resolve({ lat, lon, city, source })
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!resolved) {
            resolved = true
            console.log('✓ Browser geolocation successful:', position.coords.latitude, position.coords.longitude)
            resolveWithCity(position.coords.latitude, position.coords.longitude, 'browser')
          }
        },
        (error) => {
          console.warn('✗ Browser geolocation error:', error.message)
          if (!resolved) {
            resolved = true
            resolveWithCity(28.7041, 77.1025, 'default')
          }
        }
      )
    } else {
      console.warn('✗ Geolocation not supported in this browser')
      resolveWithCity(28.7041, 77.1025, 'default')
      resolved = true
    }

    setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolveWithCity(28.7041, 77.1025, 'timeout')
      }
    }, 5000)
  })
}

export const getLocationFromIP = async () => {
  try {
    console.log('→ Trying IP-based geolocation...')
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    console.log('✓ IP geolocation successful:', data.city)
    return {
      lat: data.latitude,
      lon: data.longitude,
      city: data.city,
      source: 'ip',
    }
  } catch (error) {
    console.warn('✗ IP geolocation failed:', error.message)
    return {
      lat: 28.7041,
      lon: 77.1025,
      source: 'default',
    }
  }
}

export const useLocationCoordinates = async (preferMethod = 'browser') => {
  if (preferMethod === 'browser') {
    return getLocationCoordinates()
  } else if (preferMethod === 'ip') {
    return getLocationFromIP()
  }
  return getLocationCoordinates()
}
