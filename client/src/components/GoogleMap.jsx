import { useState, useCallback, useEffect } from 'react';
import { GoogleMap as GoogleMapComponent, useLoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '450px',
  borderRadius: '8px',
  border: '2px solid #e5e7eb'
};

// Default center: Kathmandu, Nepal
const defaultCenter = {
  lat: 27.7172,
  lng: 85.3240
};

const normalizeLocation = (value) => {
  if (!value) return null;
  const lat = Number(value.lat);
  const lng = Number(value.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const GoogleMap = ({ onLocationSelect, initialLocation, readOnly = false }) => {
  const [selectedLocation, setSelectedLocation] = useState(normalizeLocation(initialLocation));
  const [map, setMap] = useState(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Update selected location when initialLocation changes
  useEffect(() => {
    const normalizedLocation = normalizeLocation(initialLocation);
    if (normalizedLocation) {
      setSelectedLocation(normalizedLocation);
      if (map) {
        map.panTo(normalizedLocation);
      }
    } else if (readOnly) {
      setSelectedLocation(null);
    }
  }, [initialLocation, map, readOnly]);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleLocationUpdate = useCallback((lat, lng) => {
    // Only update coordinates, no address auto-fill
    if (onLocationSelect) {
      onLocationSelect({
        location: { lat, lng }
      });
    }
  }, [onLocationSelect]);

  const handleMapClick = useCallback((event) => {
    if (readOnly) return; // Don't allow clicking in read-only mode
    
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    const newLocation = { lat, lng };
    setSelectedLocation(newLocation);
    handleLocationUpdate(lat, lng);
  }, [handleLocationUpdate, readOnly]);

  const markerLocation = selectedLocation || normalizeLocation(initialLocation);

  const handleMarkerDragEnd = useCallback((event) => {
    if (readOnly) return; // Don't allow dragging in read-only mode
    
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    const newLocation = { lat, lng };
    setSelectedLocation(newLocation);
    handleLocationUpdate(lat, lng);
  }, [handleLocationUpdate, readOnly]);

  if (loadError) {
    return (
      <div style={containerStyle} className="bg-red-50 flex items-center justify-center rounded-lg border-2 border-red-200">
        <div className="text-center p-6">
          <p className="text-red-600 mb-2 font-medium">Error loading Google Maps</p>
          <p className="text-sm text-red-500">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={containerStyle} className="bg-gray-50 flex items-center justify-center rounded-lg">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div style={containerStyle} className="bg-yellow-50 flex items-center justify-center rounded-lg border-2 border-yellow-200">
        <div className="text-center p-6">
          <p className="text-yellow-800 mb-2 font-medium">Google Maps API key not configured</p>
          <p className="text-sm text-yellow-700">Add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <GoogleMapComponent
        mapContainerStyle={containerStyle}
        center={markerLocation || defaultCenter}
        zoom={15}
        onClick={readOnly ? undefined : handleMapClick}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: false,
          disableDoubleClickZoom: false,
        }}
      >
        {markerLocation && (
          <Marker
            position={markerLocation}
            draggable={!readOnly}
            onDragEnd={readOnly ? undefined : handleMarkerDragEnd}
            animation={window.google?.maps?.Animation?.DROP}
            title={readOnly ? "Property Location" : "Property Location (Drag to adjust)"}
          />
        )}
      </GoogleMapComponent>
      
      {!readOnly && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <span className="text-blue-600">📍</span>
            <span>
              <strong>Click on the map</strong> to pin your property location, or <strong>drag the marker</strong> to adjust the exact position.
            </span>
          </p>
          {selectedLocation && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-green-600 font-medium">✓</span>
              <p className="text-xs text-green-700">
                Location pinned: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>
      )}
      
      {readOnly && markerLocation && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <span className="text-gray-600">📍</span>
            <span>
              This is the location pinned by the property owner.
            </span>
          </p>
        </div>
      )}

      {readOnly && !markerLocation && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <span className="text-yellow-700">⚠️</span>
            <span>Location not available for this property.</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
