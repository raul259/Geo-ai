'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-velocity';

interface WindAnimationLayerProps {
  show: boolean;
}

export function WindAnimationLayer({ show }: WindAnimationLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!show) return;

    // URL para obtener datos de viento en formato GRIB2 convertido a JSON
    // Usaremos un servicio que proporcione datos de viento en formato compatible
    const fetchWindData = async () => {
      try {
        // Esta es una estructura de ejemplo de datos de viento
        // En producción, deberías obtener datos reales de una API
        const windData = {
          header: {
            parameterCategory: 2,
            parameterNumber: 2,
            dx: 1,
            dy: 1,
            la1: 90,
            la2: -90,
            lo1: 0,
            lo2: 359,
            nx: 360,
            ny: 181,
          },
          data: [] as number[]
        };

        // Por ahora, vamos a usar una capa de OpenWeatherMap con overlay
        // Para una animación real, necesitarías datos GRIB o similar
        
        // Alternativa: Usar iframe de Windy embebido
        const windyLayer = L.tileLayer(
          'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=' + process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
          {
            attribution: '&copy; OpenWeatherMap',
            opacity: 0.6,
            className: 'wind-animated-layer'
          }
        );

        windyLayer.addTo(map);

        return () => {
          map.removeLayer(windyLayer);
        };
      } catch (error) {
        console.error('Error loading wind animation:', error);
      }
    };

    fetchWindData();
  }, [show, map]);

  return null;
}
