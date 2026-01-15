"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, MapPin, Search, Download, Trash2, Save, FileText } from 'lucide-react';
import { TutorialDialog } from '@/components/TutorialDialog';

const MapViewer = dynamic(() => import('@/components/map/MapViewer'), { ssr: false });

interface SavedLocation {
  id: string;
  address: string;
  lat: number;
  lon: number;
  notes?: string;
  report?: string; // Informe completo generado
  createdAt: string;
}

interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function Home() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSavedLocations, setShowSavedLocations] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [showFullReport, setShowFullReport] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Cargar ubicaciones guardadas del localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('savedLocations');
    if (saved) {
      try {
        setSavedLocations(JSON.parse(saved));
      } catch (error) {
        console.error('Error al cargar ubicaciones guardadas:', error);
      }
    }
  }, []);

  // Guardar en localStorage cada vez que cambian las ubicaciones
  useEffect(() => {
    if (savedLocations.length > 0) {
      localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
    } else {
      localStorage.removeItem('savedLocations');
    }
  }, [savedLocations]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar sugerencias mientras se escribe
  useEffect(() => {
    const searchSuggestions = async () => {
      if (addressInput.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}&limit=5&addressdetails=1`
        );
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error al buscar sugerencias:', error);
      }
    };

    const timeoutId = setTimeout(searchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [addressInput]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setAddressInput(suggestion.display_name);
    setCoords({ 
      lat: parseFloat(suggestion.lat), 
      lon: parseFloat(suggestion.lon) 
    });
    setShowSuggestions(false);
    toast.success('Dirección seleccionada');
  };

  const handleMapClick = (lat: number, lon: number) => {
    setCoords({ lat, lon });
    toast.success(`Coordenadas seleccionadas: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
  };

  const handleAnalyzeAddress = async () => {
    if (!addressInput.trim()) {
      toast.error('Por favor, ingresa una dirección');
      return;
    }
    
    setIsLoading(true);
    setAnalysisResult('');
    
    try {
      let targetCoords = coords;

      // Si no hay coordenadas o la dirección ha cambiado, geocodificar de nuevo
      if (!targetCoords || addressInput !== (localStorage.getItem('lastGeocodedAddress') || '')) {
        console.log('Geocodificando dirección:', addressInput);
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}&limit=1`
        );
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData.length === 0) {
          toast.error('No se pudo encontrar la dirección');
          setIsLoading(false);
          return;
        }
        
        const { lat, lon } = geocodeData[0];
        targetCoords = { lat: parseFloat(lat), lon: parseFloat(lon) };
        setCoords(targetCoords);
        localStorage.setItem('lastGeocodedAddress', addressInput); // Guardar la dirección geocodificada
        console.log('Coordenadas obtenidas:', targetCoords);
      } else {
        console.log('Usando coordenadas cacheadas:', targetCoords);
      }
      
      if (!targetCoords) {
        toast.error('No se pudieron obtener las coordenadas para la dirección.');
        setIsLoading(false);
        return;
      }

      console.log('Iniciando análisis para:', addressInput, targetCoords);
      
      // Llamada a la IA (ahora idéntica a handleAnalyzeMapPoint)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Genera un informe geoespacial profesional completo para:
- Dirección completa: ${addressInput}
- Coordenadas: ${targetCoords.lat}, ${targetCoords.lon}

IMPORTANTE: 
1. Usa la tool analyzeLocation para obtener datos REALES de infraestructura
2. Usa la tool getRiskAssessment para evaluar riesgos
3. Usa la tool getWeather para obtener condiciones meteorológicas actuales
4. DEBES incluir EXACTAMENTE la sección de ubicación con la dirección proporcionada
5. Genera el informe siguiendo EXACTAMENTE esta estructura sin omitir ninguna sección:

# 📍 INFORME GEOESPACIAL PROFESIONAL
**GEOAI-ASSISTANT** | Análisis de Inteligencia Geoespacial

---

## 📌 UBICACIÓN
**Dirección:** ${addressInput}  
**Coordenadas:** ${targetCoords.lat.toFixed(6)}, ${targetCoords.lon.toFixed(6)}

---

## 1. DESCRIPCIÓN DE LA ZONA
[Describe el tipo de zona urbana/rural, densidad de población estimada, carácter del área]

## 2. INFRAESTRUCTURA CERCANA
Basado en datos de **OpenStreetMap (Overpass API)**:

###  Servicios de Salud
[Lista hospitales, centros médicos]

###  Educación
[Lista escuelas, centros educativos]

###  Servicios de Emergencia
[Lista estaciones de policía/bomberos]

###  Comercio y Servicios
[Resume densidad comercial]

###  Áreas Verdes
[Lista parques y espacios recreativos]

## 3. ANÁLISIS DE RIESGOS

###  Riesgo de Inundación: **[NIVEL]**
[Explicación basada en cauces de agua cercanos]

###  Riesgo Estructural: **[NIVEL]**
[Explicación basada en densidad de infraestructura]

###  Riesgo Ambiental: **[NIVEL]**
[Explicación basada en áreas verdes]

###  Riesgo Sísmico: **[NIVEL]**
[Explicación basada en zona geográfica - referencia IGN]

## 4. USOS URBANOS RECOMENDADOS
Basado en el análisis de infraestructura y riesgos:
- [Uso recomendado 1]
- [Uso recomendado 2]
- [Uso recomendado 3]

## 5. RECOMENDACIÓN FINAL
 **[Recomendación principal para la zona]**

---

###  Fuentes de Datos Utilizadas
${new Date().toLocaleDateString('es-ES')}

**Datos reales obtenidos de:**
- OpenStreetMap / Overpass API (infraestructura)
- Instituto Geográfico Nacional - IGN (referencias sísmicas)
- Análisis geoespacial automatizado con IA

###  Limitaciones
Este informe se basa en datos públicos disponibles. Para decisiones críticas se recomienda consultar: Copernicus EMS, IGN oficial, MITECO.`
          }],
        }),
      });

      console.log('Response status:', response.ok, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error en el análisis: ${response.status}`);
      }

      // Leer el stream de texto plano
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No se pudo leer la respuesta');
      }
      
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        setAnalysisResult(result);
      }
      
      if (!result || result.trim().length < 50) {
        console.error('❌ Informe muy corto o vacío. Longitud:', result?.length);
        throw new Error('El informe está vacío o incompleto. Por favor, intenta nuevamente.');
      }
      
      console.log('Informe final generado, longitud:', result.length);
      toast.success('Informe completado');
    } catch (error) {
      console.error('Error completo:', error);
      toast.error(error instanceof Error ? error.message : 'Error al analizar la dirección');
      setAnalysisResult('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeMapPoint = async () => {
    if (!coords) {
      toast.error('Por favor, selecciona un punto en el mapa');
      return;
    }
    
    setIsLoading(true);
    setAnalysisResult('');
    
    try {
      console.log('Iniciando análisis para coordenadas:', coords);
      
      // Obtener la dirección mediante geocodificación inversa
      let locationAddress = `${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
      try {
        console.log('Buscando dirección para coordenadas:', coords);
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&addressdetails=1&zoom=18`,
          {
            headers: {
              'User-Agent': 'GeoAI-Assistant/1.0'
            }
          }
        );
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          console.log('Datos de geocodificación recibidos:', geocodeData);
          if (geocodeData.display_name) {
            locationAddress = geocodeData.display_name;
            console.log('Dirección encontrada:', locationAddress);
          }
        } else {
          console.warn('Error en geocodificación:', geocodeResponse.status);
        }
      } catch (geocodeError) {
        console.warn('No se pudo obtener la dirección:', geocodeError);
      }
      
      console.log('Dirección final a usar en el informe:', locationAddress);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Genera un informe geoespacial profesional completo para:
- Coordenadas: ${coords.lat}, ${coords.lon}
- Dirección completa: ${locationAddress}

IMPORTANTE: 
1. Usa la tool analyzeLocation para obtener datos REALES de infraestructura
2. Usa la tool getRiskAssessment para evaluar riesgos
3. Usa la tool getWeather para obtener condiciones meteorológicas actuales
4. DEBES incluir EXACTAMENTE la sección de ubicación con la dirección proporcionada
5. Genera el informe siguiendo EXACTAMENTE esta estructura sin omitir ninguna sección:

# 📍 INFORME GEOESPACIAL PROFESIONAL
**GEOAI-ASSISTANT** | Análisis de Inteligencia Geoespacial

---

## 📌 UBICACIÓN
**Dirección:** ${locationAddress}  
**Coordenadas:** ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}

---

## 1. DESCRIPCIÓN DE LA ZONA
[Describe el tipo de zona urbana/rural, densidad de población estimada, carácter del área]

## 2. INFRAESTRUCTURA CERCANA
Basado en datos de **OpenStreetMap (Overpass API)**:

###  Servicios de Salud
[Lista hospitales, centros médicos]

###  Educación
[Lista escuelas, centros educativos]

###  Servicios de Emergencia
[Lista estaciones de policía/bomberos]

###  Comercio y Servicios
[Resume densidad comercial]

###  Áreas Verdes
[Lista parques y espacios recreativos]

## 3. ANÁLISIS DE RIESGOS

###  Riesgo de Inundación: **[NIVEL]**
[Explicación basada en cauces de agua cercanos]

###  Riesgo Estructural: **[NIVEL]**
[Explicación basada en densidad de infraestructura]

###  Riesgo Ambiental: **[NIVEL]**
[Explicación basada en áreas verdes]

###  Riesgo Sísmico: **[NIVEL]**
[Explicación basada en zona geográfica - referencia IGN]

## 4. USOS URBANOS RECOMENDADOS
Basado en el análisis de infraestructura y riesgos:
- [Uso recomendado 1]
- [Uso recomendado 2]
- [Uso recomendado 3]

## 5. RECOMENDACIÓN FINAL
 **[Recomendación principal para la zona]**

---

###  Fuentes de Datos Utilizadas
${new Date().toLocaleDateString('es-ES')}

**Datos reales obtenidos de:**
- OpenStreetMap / Overpass API (infraestructura)
- Instituto Geográfico Nacional - IGN (referencias sísmicas)
- Análisis geoespacial automatizado con IA

###  Limitaciones
Este informe se basa en datos públicos disponibles. Para decisiones críticas se recomienda consultar: Copernicus EMS, IGN oficial, MITECO.`
          }],
        }),
      });

      console.log('Response status:', response.ok, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error en el análisis: ${response.status}`);
      }

      // Leer el text stream simple
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No se pudo leer la respuesta');
      }
      
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        setAnalysisResult(result);
      }
      
if (!result || result.trim().length < 50) {
  console.error('❌ Informe muy corto o vacío. Longitud:', result?.length);
  throw new Error('El informe está vacío o incompleto. Por favor, intenta nuevamente.');
}
      
      console.log('Informe final generado, longitud:', result.length);
      toast.success('Informe completado');
    } catch (error) {
      console.error('Error completo:', error);
      toast.error(error instanceof Error ? error.message : 'Error al generar el informe');
      setAnalysisResult('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysisResult) {
      toast.error('No hay informe para descargar');
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Título principal
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INFORME GEOESPACIAL PROFESIONAL', margin, yPosition);
      yPosition += 12;

      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Procesar el contenido del informe
      const lines = analysisResult.split('\n');
      pdf.setFontSize(10);
      
      for (const line of lines) {
        // Verificar si necesitamos una nueva página
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        const trimmedLine = line.trim();
        
        // Títulos principales (# )
        if (trimmedLine.startsWith('# ')) {
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          const text = trimmedLine.replace(/^#\s+/, '').replace(/📍/g, '');
          pdf.text(text, margin, yPosition);
          yPosition += 10;
        }
        // Títulos secundarios (## )
        else if (trimmedLine.startsWith('## ')) {
          pdf.setFontSize(13);
          pdf.setFont('helvetica', 'bold');
          const text = trimmedLine.replace(/^##\s+/, '');
          pdf.text(text, margin, yPosition);
          yPosition += 8;
        }
        // Títulos terciarios (### )
        else if (trimmedLine.startsWith('### ')) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          const text = trimmedLine.replace(/^###\s+/, '').replace(/🌊|🏗️|🌡️/g, '');
          pdf.text(text, margin, yPosition);
          yPosition += 6;
        }
        // Línea separadora (---)
        else if (trimmedLine.startsWith('---')) {
          pdf.setLineWidth(0.3);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
        }
        // Texto normal
        else if (trimmedLine.length > 0) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          
          // Limpiar emojis y markdown
          const cleanText = trimmedLine
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/✅|❌|⚠️/g, '');
          
          // Dividir texto largo en múltiples líneas
          const textLines = pdf.splitTextToSize(cleanText, maxWidth);
          
          for (const textLine of textLines) {
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(textLine, margin, yPosition);
            yPosition += 5;
          }
        } else {
          yPosition += 3; // Espacio en blanco
        }
      }

      // Guardar PDF
      const fileName = `informe-geoespacial-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      toast.success('Informe PDF descargado');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const handleClearPoint = () => {
    setCoords(null);
    toast.info('Punto limpiado');
  };

  const handleClearAll = () => {
    setCoords(null);
    setAddressInput('');
    setAnalysisResult('');
    setSuggestions([]);
    setShowSuggestions(false);
    setShowFullReport(false);
    toast.info('Todo limpiado');
  };

  const handleSaveLocation = () => {
    if (!coords) {
      toast.error('No hay coordenadas para guardar');
      return;
    }
    
    const newLocation: SavedLocation = {
      id: Date.now().toString(),
      address: addressInput || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
      lat: coords.lat,
      lon: coords.lon,
      notes: '',
      report: analysisResult || '', // Guardar el informe actual
      createdAt: new Date().toISOString(),
    };
    
    setSavedLocations(prev => [...prev, newLocation]);
    toast.success(analysisResult ? 'Ubicación e informe guardados' : 'Ubicación guardada');
  };

  const handleLoadLocation = (location: SavedLocation) => {
    setCoords({ lat: location.lat, lon: location.lon });
    setAddressInput(location.address);
    
    // Cargar el informe si existe
    if (location.report) {
      setAnalysisResult(location.report);
      toast.success('Ubicación e informe cargados');
    } else {
      setAnalysisResult('');
      toast.success('Ubicación cargada');
    }
    
    setShowSavedLocations(false);
  };

  const handleDeleteLocation = (id: string) => {
    setSavedLocations(prev => prev.filter(loc => loc.id !== id));
    toast.success('Ubicación eliminada');
  };

  const handleStartEdit = (location: SavedLocation) => {
    setEditingLocation(location.id);
    setEditNotes(location.notes || '');
  };

  const handleSaveNotes = (id: string) => {
    setSavedLocations(prev => 
      prev.map(loc => 
        loc.id === id ? { ...loc, notes: editNotes } : loc
      )
    );
    setEditingLocation(null);
    setEditNotes('');
    toast.success('Notas guardadas');
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
    setEditNotes('');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Tutorial Dialog */}
      <TutorialDialog />
      
      {/* Panel Izquierdo */}
      <div className="w-1/4 p-6 bg-gray-200 flex flex-col gap-4 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-800">GEOAI-ASSISTANT</h1>
        
        {!showSavedLocations && !showFullReport ? (
          <>
            {/* Buscar por dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por dirección
              </label>
              <div className="relative" ref={suggestionsRef}>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input 
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="Ej: Gran Vía 100, Barcelona" 
                      className="w-full border border-gray-300 p-3 rounded-md bg-white"
                      disabled={isLoading}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeAddress()}
                    />
                    {addressInput && (
                      <button
                        onClick={() => {
                          setAddressInput('');
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={handleAnalyzeAddress}
                          disabled={isLoading || !addressInput}
                          className="px-6"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analizando...
                            </>
                          ) : (
                            <>
                              <Search className="mr-2 h-4 w-4" />
                              Analizar
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Buscar y analizar dirección</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Sugerencias de autocompletado */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 flex items-start gap-2"
                      >
                        <span className="text-gray-500 mt-1">📍</span>
                        <span className="text-sm text-gray-700 flex-1">
                          {suggestion.display_name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coordenadas seleccionadas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Coordenadas seleccionadas
                </label>
                <Button 
                  onClick={handleClearPoint}
                  disabled={!coords}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Limpiar
                </Button>
              </div>
              <div className="bg-white border border-gray-300 p-3 rounded-md text-gray-600 text-sm">
                {coords ? `${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}` : 'Sin selección'}
              </div>
            </div>

            {/* Analizar punto del mapa */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleAnalyzeMapPoint}
                    disabled={!coords || isLoading}
                    variant="secondary"
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Analizar punto del mapa
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generar informe para las coordenadas seleccionadas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Vista previa del informe */}
            {analysisResult && (
              <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
                <div className="bg-blue-600 text-white p-3 font-semibold text-center">
                  📄 Informe Detallado
                </div>
                <div className="p-4 max-h-48 overflow-y-auto">
                  <p className="text-xs text-gray-600 line-clamp-6">
                    {analysisResult.substring(0, 300)}...
                  </p>
                </div>
                <div className="p-3 bg-gray-50 flex gap-2">
                  <Button
                    onClick={handleDownloadReport}
                    variant="default"
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </Button>
                  <Button
                    onClick={() => setShowFullReport(true)}
                    variant="default"
                    size="sm"
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ver completo
                  </Button>
                </div>
              </div>
            )}

            {isLoading && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando informe profesional...
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            )}

            {/* Botón Limpiar */}
            <button 
              onClick={handleClearAll}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-300 self-end"
            >
              Limpiar
            </button>

            {/* Mensaje informativo */}
            <p className="text-xs text-gray-600 leading-relaxed">
              La IA se basa en datos reales. Si una fuente no responde, se indicará como imitación.
            </p>

            {/* Botones de guardar */}
            <button 
              onClick={handleSaveLocation}
              disabled={!coords}
              className="w-full bg-gray-700 text-white p-4 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Guardar ubicación
            </button>

            <button 
              onClick={() => setShowSavedLocations(true)}
              className="w-full bg-gray-100 text-gray-700 p-4 rounded-md border border-gray-300 hover:bg-gray-200 font-medium"
            >
              Ubicaciones guardadas ({savedLocations.length})
            </button>
          </>
        ) : showFullReport ? (
          <>
            {/* Vista completa del informe */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">📄 Informe Completo</h2>
              <button 
                onClick={() => setShowFullReport(false)}
                className="text-gray-600 hover:text-gray-800 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 bg-white border border-gray-300 p-6 rounded-md overflow-y-auto prose prose-sm max-w-none">
              <div 
                className="text-sm text-gray-800"
                dangerouslySetInnerHTML={{ 
                  __html: analysisResult
                    .replace(/###\s+(.+)/g, '<h3 class="font-bold text-lg mt-4 mb-2 text-gray-800">$1</h3>')
                    .replace(/##\s+(.+)/g, '<h2 class="font-bold text-xl mt-4 mb-3 text-gray-900">$1</h2>')
                    .replace(/#\s+(.+)/g, '<h1 class="font-bold text-2xl mt-4 mb-4 text-gray-900">$1</h1>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                    .replace(/\n/g, '<br/>')
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadReport}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 font-medium"
              >
                 Descargar Informe
              </button>
              <button 
                onClick={() => setShowFullReport(false)}
                className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-md hover:bg-gray-800 font-medium"
              >
                Volver
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Panel de ubicaciones guardadas */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Ubicaciones Guardadas</h2>
              <button 
                onClick={() => setShowSavedLocations(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {savedLocations.length === 0 ? (
                <div className="bg-white border border-gray-300 p-6 rounded-md text-center">
                  <p className="text-gray-500">No hay ubicaciones guardadas</p>
                </div>
              ) : (
                savedLocations.map((location) => (
                  <div 
                    key={location.id} 
                    className="bg-white border border-gray-300 p-4 rounded-md space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 wrap-break-word">
                          {location.address}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(location.createdAt).toLocaleString('es-ES')}
                        </p>
                        {location.report && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            Informe guardado
                          </Badge>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Notas */}
                    {editingLocation === location.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Añade notas aquí..."
                          className="w-full border border-gray-300 p-2 rounded text-sm resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveNotes(location.id)}
                            className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {location.notes && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                            {location.notes}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleLoadLocation(location)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={() => handleStartEdit(location)}
                            className="flex-1 bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                          >
                            {location.notes ? 'Editar notas' : 'Añadir notas'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => setShowSavedLocations(false)}
              className="w-full bg-gray-700 text-white p-4 rounded-md hover:bg-gray-800 font-medium"
            >
              Volver
            </button>
          </>
        )}
      </div>

{/* Panel Derecho: Mapa */}
<div className="w-4/5 p-4 relative">
  {/* Mensaje instructivo */}
  <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[900] bg-blue-600 text-white px-5 py-3 rounded-lg shadow-lg animate-pulse max-w-md">
    <div className="flex items-center gap-2 mb-1">
      <MapPin className="h-5 w-5" />
      <span className="font-bold text-sm">
        Haz clic en cualquier punto del mapa
      </span>
    </div>
    <p className="text-xs ml-7">
      Verás: 🌡️ Temperatura • 💨 Viento • 💧 Humedad • 🌊 Presión • ☁️ Clima
    </p>
  </div>
  
  <MapViewer 
    lat={coords?.lat || 40.416} 
    lon={coords?.lon || -3.703} 
    onSelect={handleMapClick}
  />
</div>
    </div>
  );
}