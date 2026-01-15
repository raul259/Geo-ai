'use client';

import { useEffect, useRef } from 'react';

interface WindyMapProps {
  lat: number;
  lon: number;
  zoom?: number;
  overlay?: 'wind' | 'temp' | 'clouds' | 'rain';
}

export function WindyMap({ lat, lon, zoom = 6, overlay = 'wind' }: WindyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    
    script.onload = () => {
      const windyScript = document.createElement('script');
      windyScript.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
      windyScript.async = true;
      
      windyScript.onload = () => {
        const options = {
          key: 'PsL0owFe2bRC6F1wcKsXka4asdqMrNjG', // Clave pública de Windy (reemplazar con tu propia clave)
          lat: lat,
          lon: lon,
          zoom: zoom,
        };

        // @ts-ignore
        if (window.windyInit) {
          // @ts-ignore
          window.windyInit(options, (windyAPI: any) => {
            const { map, store } = windyAPI;
            store.set('overlay', overlay);
            store.set('particlesAnim', 'on');
          });
        }
      };
      
      document.head.appendChild(windyScript);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup si es necesario
    };
  }, [lat, lon, zoom, overlay]);

  return (
    <div 
      ref={containerRef} 
      id="windy" 
      style={{ width: '100%', height: '100%' }}
    />
  );
}
