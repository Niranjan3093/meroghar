import { useState, useCallback, useEffect } from 'react';
import { GoogleMap as GoogleMapComponent, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px'
};

// Default center: Kathmandu, Nepal
const defaultCenter = {
  lat: 27.7172,
  lng: 85.3240
};

const GoogleMap = ({ onLocationSelect, initialLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || defaultCenter);
  const [map, setMap] = useState(null);

  // Update selected location when initialLocation changes
  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = useCallback(async (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    setSelectedLocation({ lat, lng });

    // Reverse geocoding to get address details
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const addressComponents = results[0].address_components;
          
          // Extract address details
          let street = '';
          let city = '';
          let state = '';
          let zipCode = '';

          addressComponents.forEach(component => {
            const types = component.types;
            
            if (types.includes('street_number')) {
              street = component.long_name + ' ' + street;
            }
            if (types.includes('route')) {
              street += component.long_name;
            }
            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            }
            if (types.includes('postal_code')) {
              zipCode = component.long_name;
            }
          });

          // If no city found, try sublocality
          if (!city) {
            addressComponents.forEach(component => {
              if (component.types.includes('sublocality') || component.types.includes('sublocality_level_1')) {
                city = component.long_name;
              }
            });
          }

          // Call the callback with address data
          if (onLocationSelect) {
            onLocationSelect({
              street: street.trim() || results[0].formatted_address,
              city: city,
              state: state,
              zipCode: zipCode,
              location: { lat, lng }
            });
          }
        } else {
          // If geocoding fails, still provide the coordinates
          if (onLocationSelect) {
            onLocationSelect({
              street: '',
              city: '',
              state: '',
              zipCode: '',
              location: { lat, lng }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error getting address:', error);
      // Still provide the coordinates even if geocoding fails
      if (onLocationSelect) {
        onLocationSelect({
          street: '',
          city: '',
          state: '',
          zipCode: '',
          location: { lat, lng }
        });
      }
    }
  }, [onLocationSelect]);

  // Get API key from environment variable (you'll need to add this to .env)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div style={containerStyle} className="bg-gray-100 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center p-6">
          <p className="text-gray-600 mb-2">Google Maps API key not configured</p>
          <p className="text-sm text-gray-500">
            Add VITE_GOOGLE_MAPS_API_KEY to your .env file
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMapComponent
        mapContainerStyle={containerStyle}
        center={selectedLocation}
        zoom={13}
        onClick={handleMapClick}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {selectedLocation && <Marker position={selectedLocation} />}
      </GoogleMapComponent>
    </LoadScript>
  );
};

export default GoogleMap;
