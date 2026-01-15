'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Thermometer, Wind } from 'lucide-react';

interface WeatherLegendProps {
  latitude?: number;
  longitude?: number;
}

export function WeatherLegend({ latitude, longitude }: WeatherLegendProps) {
  const [activeTab, setActiveTab] = useState<'temp' | 'wind' | null>(null);

  const handleShowTemperature = () => {
    setActiveTab(activeTab === 'temp' ? null : 'temp');
  };

  const handleShowWind = () => {
    setActiveTab(activeTab === 'wind' ? null : 'wind');
  };

  const isAnyActive = activeTab !== null;

  return (
    <>
      <div className="absolute bottom-10 left-10 z-[1000] flex gap-4">
        <Button
          onClick={handleShowTemperature}
          variant="outline"
          size="sm"
          className={`shadow-lg ${
            activeTab === 'temp' 
              ? 'bg-red-500 text-white border-red-600 hover:bg-red-600' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Thermometer className="h-4 w-4 mr-2" />
          <span className="font-medium">Temperatura</span>
        </Button>

        <Button
          onClick={handleShowWind}
          variant="outline"
          size="sm"
          className={`shadow-lg ${
            activeTab === 'wind' 
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
                  <div className="w-4 h-4" style={{ backgroundColor: '#800080' }}></div>
                  <span>&gt; 40°C - Extremo calor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#FF0000' }}></div>
                  <span>30-40°C - Muy caluroso</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#FFA500' }}></div>
                  <span>20-30°C - Cálido</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#FFFF00' }}></div>
                  <span>10-20°C - Templado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#00FF00' }}></div>
                  <span>0-10°C - Fresco</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#00FFFF' }}></div>
                  <span>-10-0°C - Frío</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#0000FF' }}></div>
                  <span>&lt; -10°C - Muy frío</span>
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
    </>
  );
}
