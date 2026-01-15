'use client';

import { Button } from '@/components/ui/button';
import { Thermometer, Wind, Cloud, CloudRain, Gauge, Map, Mountain, Satellite } from 'lucide-react';
import { useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';

interface CustomLayersControlProps {
  onLayerChange?: (layer: string) => void;
}

export function CustomLayersControl({ onLayerChange }: CustomLayersControlProps) {
  const map = useMap();
  const [activeOverlays, setActiveOverlays] = useState<string[]>([]);
  const [baseLayer, setBaseLayer] = useState('standard');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Deshabilitar eventos del mapa en el área del control
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
    }
  }, []);

  // Deshabilitar eventos del mapa en el panel cuando se abre
  useEffect(() => {
    if (panelRef.current) {
      const panel = panelRef.current;
      L.DomEvent.disableClickPropagation(panel);
      L.DomEvent.disableScrollPropagation(panel);
    }
  }, [isOpen]);

  const toggleOverlay = (overlay: string) => {
    const newActiveOverlays = activeOverlays.includes(overlay) 
      ? activeOverlays.filter(o => o !== overlay)
      : [...activeOverlays, overlay];
    
    setActiveOverlays(newActiveOverlays);
    onLayerChange?.(overlay);
  };

  const selectBaseLayer = (layer: string) => {
    setBaseLayer(layer);
    onLayerChange?.(layer);
  };

  const handleTogglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div 
      ref={containerRef}
      className="leaflet-bottom leaflet-right" 
      style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 1100 }}
    >
      {/* Botón para abrir/cerrar */}
      <div className="leaflet-control">
        <Button
          onClick={handleTogglePanel}
          variant="outline"
          size="sm"
          className="shadow-lg bg-white hover:bg-gray-100"
        >
          <Map className="h-4 w-4 mr-2" />
          Capas
        </Button>
      </div>

      {/* Panel de capas */}
      {isOpen && (
        <div 
          ref={panelRef}
          className="mb-2 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl min-w-[280px]" 
          style={{ position: 'relative', pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {/* Mapas Base */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase">Mapas Base</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => selectBaseLayer('standard')}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  baseLayer === 'standard'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Map className="h-4 w-4" />
                Mapa estándar
              </button>
              <button
                onClick={() => selectBaseLayer('satellite')}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  baseLayer === 'satellite'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Satellite className="h-4 w-4" />
                Satélite
              </button>
              <button
                onClick={() => selectBaseLayer('terrain')}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  baseLayer === 'terrain'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Mountain className="h-4 w-4" />
                Relieve
              </button>
            </div>
          </div>

          {/* Capas Meteorológicas */}
          <div>
            <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase">Capas Meteorológicas</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => toggleOverlay('temperature')}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activeOverlays.includes('temperature')
                    ? 'bg-red-500 text-white border-red-600'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Thermometer className="h-4 w-4" />
                Temperatura
              </button>
              <button
                onClick={() => toggleOverlay('wind')}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activeOverlays.includes('wind')
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Wind className="h-4 w-4" />
                Viento
              </button>
              <button
                onClick={() => toggleOverlay('clouds')}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activeOverlays.includes('clouds')
                    ? 'bg-gray-500 text-white border-gray-600'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Cloud className="h-4 w-4" />
                Nubes
              </button>
              <button
                onClick={() => toggleOverlay('precipitation')}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activeOverlays.includes('precipitation')
                    ? 'bg-cyan-500 text-white border-cyan-600'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <CloudRain className="h-4 w-4" />
                Precipitación
              </button>
              <button
                onClick={() => toggleOverlay('pressure')}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activeOverlays.includes('pressure')
                    ? 'bg-purple-500 text-white border-purple-600'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Gauge className="h-4 w-4" />
                Presión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
