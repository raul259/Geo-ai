'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Thermometer, Wind, Loader2, X } from 'lucide-react';
import { fetchWeatherData, getWindDirection, getWindSpeedDescription } from '@/lib/geo-utils';
import type { WeatherData } from '@/lib/geo-utils';

interface WeatherControlsProps {
  latitude: number;
  longitude: number;
  onToggleWind?: (show: boolean) => void;
  onToggleTemperature?: (show: boolean) => void;
}

export function WeatherControls({ latitude, longitude, onToggleWind, onToggleTemperature }: WeatherControlsProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showWind, setShowWind] = useState(false);
  const [activeTab, setActiveTab] = useState<'temp' | 'wind'>('temp');

  const handleFetchWeather = async () => {
    setLoading(true);
    try {
      const data = await fetchWeatherData(latitude, longitude);
      setWeatherData(data);
    } catch (error) {
      console.error('Error al obtener datos meteorológicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowTemperature = async () => {
    if (!weatherData) {
      await handleFetchWeather();
    }
    const newState = !showWeather;
    setShowWeather(newState);
    setActiveTab('temp');
    if (newState) {
      setShowWind(false);
    }
    onToggleTemperature?.(newState);
    onToggleWind?.(false);
  };

  const handleShowWind = async () => {
    if (!weatherData) {
      await handleFetchWeather();
    }
    const newState = !showWind;
    setShowWind(newState);
    setActiveTab('wind');
    if (newState) {
      setShowWeather(false);
    }
    onToggleWind?.(newState);
    onToggleTemperature?.(false);
  };

  const handleClose = () => {
    setShowWeather(false);
    setShowWind(false);
    onToggleWind?.(false);
    onToggleTemperature?.(false);
  };

  const isAnyActive = showWeather || showWind;

  return (
    <>
      <div className="absolute bottom-10 left-10 z-[1000] flex gap-4">
        <Button
          onClick={handleShowTemperature}
          disabled={loading}
          variant="outline"
          size="sm"
          className={`shadow-lg ${
            showWeather 
              ? 'bg-red-500 text-white border-red-600 hover:bg-red-600' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Thermometer className="h-4 w-4 mr-2" />
              <span className="font-medium">Temperatura</span>
            </>
          )}
        </Button>

        <Button
          onClick={handleShowWind}
          disabled={loading}
          variant="outline"
          size="sm"
          className={`shadow-lg ${
            showWind 
              ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Wind className="h-4 w-4 mr-2" />
          <span className="font-medium">Viento</span>
        </Button>
      </div>

      {/* Leyenda cuando está activa */}
      {isAnyActive && (
        <div className="absolute bottom-24 left-10 z-[999] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            {activeTab === 'temp' ? (
              <>
                <Thermometer className="h-4 w-4 text-red-500" />
                Escala de temperatura
              </>
            ) : (
              <>
                <Wind className="h-4 w-4 text-blue-500" />
                Intensidad del viento
              </>
            )}
          </h4>
          <div className="flex flex-col gap-1 text-xs">
            {activeTab === 'temp' ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-900"></div>
                  <span>&gt; 40°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600"></div>
                  <span>30-40°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500"></div>
                  <span>20-30°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400"></div>
                  <span>10-20°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cyan-400"></div>
                  <span>0-10°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600"></div>
                  <span>&lt; 0°C</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-700"></div>
                  <span>&gt; 20 m/s</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600"></div>
                  <span>10-20 m/s</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cyan-400"></div>
                  <span>5-10 m/s</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-300"></div>
                  <span>&lt; 5 m/s</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CARD UNIFICADA - Muestra toda la información */}
      {weatherData && isAnyActive && (
        <Card className="absolute top-10 left-10 z-[999] p-4 shadow-xl bg-white/95 backdrop-blur-sm min-w-[320px] max-w-[380px]">
          <div className="space-y-3">
            {/* Header con pestañas */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTab('temp');
                    setShowWeather(true);
                    setShowWind(false);
                    onToggleTemperature?.(true);
                    onToggleWind?.(false);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                    activeTab === 'temp'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Thermometer className="h-4 w-4" />
                  Temperatura
                </button>
                <button
                  onClick={() => {
                    setActiveTab('wind');
                    setShowWind(true);
                    setShowWeather(false);
                    onToggleWind?.(true);
                    onToggleTemperature?.(false);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                    activeTab === 'wind'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Wind className="h-4 w-4" />
                  Viento
                </button>
              </div>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Contenido según la pestaña activa */}
            {activeTab === 'temp' ? (
              <>
                <div className="flex items-center gap-3">
                  <img
                    src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                    alt={weatherData.description}
                    className="w-20 h-20"
                  />
                  <div>
                    <p className="text-4xl font-bold text-gray-800">{weatherData.temp}°C</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {weatherData.description}
                    </p>
                  </div>
                </div>
                <div className="text-sm space-y-2 border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sensación térmica:</span>
                    <strong className="text-gray-800">{weatherData.feels_like}°C</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Humedad:</span>
                    <strong className="text-gray-800">{weatherData.humidity}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Presión:</span>
                    <strong className="text-gray-800">{weatherData.pressure} hPa</strong>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div 
                    className="relative w-20 h-20 flex items-center justify-center"
                    style={{ 
                      transform: `rotate(${weatherData.wind_deg}deg)`,
                      transition: 'transform 0.5s ease'
                    }}
                  >
                    <div className="text-6xl text-blue-500">↑</div>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-gray-800">
                      {weatherData.wind_speed} m/s
                    </p>
                    <p className="text-sm text-gray-600">
                      {getWindSpeedDescription(weatherData.wind_speed)}
                    </p>
                  </div>
                </div>
                <div className="text-sm space-y-2 border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dirección:</span>
                    <strong className="text-gray-800">
                      {getWindDirection(weatherData.wind_deg)} ({weatherData.wind_deg}°)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Velocidad:</span>
                    <strong className="text-gray-800">
                      {(weatherData.wind_speed * 3.6).toFixed(1)} km/h
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <strong className="text-gray-800">
                      {weatherData.wind_speed < 5 ? 'Brisa' : weatherData.wind_speed < 11 ? 'Moderado' : 'Fuerte'}
                    </strong>
                  </div>
                </div>
              </>
            )}

            {/* Información común */}
            <div className="text-xs text-gray-500 border-t pt-2">
              <p className="text-center">
                📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}