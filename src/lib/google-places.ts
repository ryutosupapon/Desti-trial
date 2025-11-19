const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
}

export async function searchPlaces(input: string): Promise<PlacePrediction[]> {
  if (!input || input.length < 3) return []

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&types=(cities)&key=${GOOGLE_PLACES_API_KEY}`
    )

    const data = await response.json()
    
    if (data.status === 'OK') {
      return data.predictions || []
    }
    
    console.error('Places API error:', data.status)
    return []
  } catch (error) {
    console.error('Places search error:', error)
    return []
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,types&key=${GOOGLE_PLACES_API_KEY}`
    )

    const data = await response.json()
    
    if (data.status === 'OK' && data.result) {
      return data.result
    }
    
    console.error('Place details API error:', data.status)
    return null
  } catch (error) {
    console.error('Place details error:', error)
    return null
  }
}
