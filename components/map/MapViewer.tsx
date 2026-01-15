"use client";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { CustomLayersControl } from './CustomLayersControl';

interface WeatherData {
  temp: number;
  wind_speed: number;
  wind_deg: number;
  humidity: number;
  pressure: number;
  description: string;
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], map.getZoom(), {
        animate: true,
      });
    }
  }, [lat, lon, map]);
  
  return null;
}

function WeatherMarker({ lat, lon, shouldOpenPopup }: { lat: number; lon: number; shouldOpenPopup: boolean }) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (!lat || !lon || !apiKey) return;

    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);
      setWeatherData(null);
      
      try {
        console.log(`Fetching weather for: ${lat}, ${lon}`);
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Weather data received:', data);
        
        setWeatherData({
          temp: Math.round(data.main.temp),
          wind_speed: data.wind?.speed || 0,
          wind_deg: data.wind?.deg || 0,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          description: data.weather[0].description
        });
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setError('Error al cargar datos meteorológicos');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [lat, lon, apiKey]);

  useEffect(() => {
    if (shouldOpenPopup && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [shouldOpenPopup, lat, lon]);

  if (!lat || !lon) return null;

  return (
    <Marker position={[lat, lon]} ref={markerRef} key={`weather-${lat}-${lon}`}>
      <Popup 
        className="custom-popup" 
        maxWidth={300} 
        closeButton={true}
      >
        <div className="p-2 min-w-[200px]">
          <h3 className="font-bold text-lg mb-2">Datos Meteorológicos</h3>
          <p className="text-xs text-gray-500 mb-2">
            📍 {lat.toFixed(4)}, {lon.toFixed(4)}
          </p>
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Cargando datos...</span>
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : weatherData ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>🌡️ Temperatura:</span>
                <span className="font-semibold">{weatherData.temp}°C</span>
              </div>
              <div className="flex justify-between">
                <span>💨 Viento:</span>
                <span className="font-semibold">{weatherData.wind_speed} m/s</span>
              </div>
              <div className="flex justify-between">
                <span>🧭 Dirección:</span>
                <span className="font-semibold">{weatherData.wind_deg}°</span>
              </div>
              <div className="flex justify-between">
                <span>💧 Humedad:</span>
                <span className="font-semibold">{weatherData.humidity}%</span>
              </div>
              <div className="flex justify-between">
                <span>🌊 Presión:</span>
                <span className="font-semibold">{weatherData.pressure} hPa</span>
              </div>
              <div className="mt-2 pt-2 border-t">
                <span className="text-gray-600 capitalize">{weatherData.description}</span>
              </div>
            </div>
          ) : (
            <p>No se pudieron cargar los datos</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

interface MapViewerProps {
  lat: number;
  lon: number;
  onSelect: (lat: number, lng: number) => void;
  showWindLayer?: boolean;
  showTempLayer?: boolean;
}

export default function MapViewer({ 
  lat, 
  lon, 
  onSelect, 
  showWindLayer = false, 
  showTempLayer = false
}: MapViewerProps) {
  const center: LatLngExpression = [lat || 40.416, lon || -3.703];
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  const [baseLayer, setBaseLayer] = useState('standard');
  const [overlays, setOverlays] = useState<string[]>([]);
  const [shouldOpenPopup, setShouldOpenPopup] = useState(false);
  
  // Límites del mundo para evitar repetición
  const worldBounds: L.LatLngBoundsExpression = [
    [-90, -180],
    [90, 180]
  ];

  useEffect(() => {
    setShouldOpenPopup(true);
    const timer = setTimeout(() => setShouldOpenPopup(false), 100);
    return () => clearTimeout(timer);
  }, [lat, lon]);

  const handleLayerChange = (layer: string) => {
    if (['standard', 'satellite', 'terrain'].includes(layer)) {
      setBaseLayer(layer);
    } else {
      setOverlays(prev => 
        prev.includes(layer) 
          ? prev.filter(l => l !== layer)
          : [...prev, layer]
      );
    }
  };
  
  return (
    <MapContainer 
      center={center} 
      zoom={6}
      minZoom={2}
      maxBounds={worldBounds}
      maxBoundsViscosity={1.0}
      doubleClickZoom={true}
      className="h-full w-full rounded-lg"
    >
      {/* Mapa Base */}
      {baseLayer === 'standard' && (
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          noWrap={true}
        />
      )}
      {baseLayer === 'satellite' && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          noWrap={true}
          minZoom={2}
          maxZoom={18}
        />
      )}
      {baseLayer === 'terrain' && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          noWrap={true}
          minZoom={2}
          maxZoom={18}
        />
      )}

      {/* Capas meteorológicas */}
      {overlays.includes('temperature') && (
        <TileLayer
          url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`}
          attribution='&copy; OpenWeatherMap'
          opacity={0.6}
          noWrap={true}
        />
      )}
      {overlays.includes('wind') && (
        <TileLayer
          url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`}
          attribution='&copy; OpenWeatherMap'
          opacity={0.5}
          noWrap={true}
        />
      )}
      {overlays.includes('clouds') && (
        <TileLayer
          url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`}
          attribution='&copy; OpenWeatherMap'
          opacity={0.4}
          noWrap={true}
        />
      )}
      {overlays.includes('precipitation') && (
        <TileLayer
          url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`}
          attribution='&copy; OpenWeatherMap'
          opacity={0.5}
          noWrap={true}
        />
      )}
      {overlays.includes('pressure') && (
        <TileLayer
          url={`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${apiKey}`}
          attribution='&copy; OpenWeatherMap'
          opacity={0.5}
          noWrap={true}
        />
      )}

      <CustomLayersControl onLayerChange={handleLayerChange} />
      
      {lat && lon && <WeatherMarker lat={lat} lon={lon} shouldOpenPopup={shouldOpenPopup} />}
      <RecenterMap lat={lat} lon={lon} />
      <LocationMarker onLocationSelect={onSelect} />
    </MapContainer>
  );
}