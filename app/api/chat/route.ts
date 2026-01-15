import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { getUrbanData, getRiskData, getCoordinates, getWeatherData } from './tools';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('[API] Received request with messages:', JSON.stringify(messages, null, 2));

  // Ejecutar herramientas y capturar resultados
  const result = await streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `Ejecuta las herramientas necesarias para analizar la ubicación.`,
    messages,
    tools: {
      buscarCoordenadas: {
        description: 'Convierte una dirección de texto en coordenadas geográficas (latitud y longitud) utilizando OpenStreetMap Nominatim.',
        inputSchema: z.object({
          direccion: z.string().describe('La dirección o lugar a buscar (por ejemplo: "Puerta del Sol, Madrid").'),
        }),
        output: z.any(),
        execute: async ({ direccion }) => {
          console.log(`[Tool] execute buscarCoordenadas for: ${direccion}`);
          try {
            const coords = await getCoordinates(direccion);
            if (!coords) {
              return { error: 'No se encontraron coordenadas para esta dirección' };
            }
            console.log('[Tool] Coordinates found:', coords);
            return coords;
          } catch (error) {
            console.error('[Tool] Error in buscarCoordenadas:', error);
            return { error: `Error al buscar coordenadas: ${error instanceof Error ? error.message : 'Error desconocido'}` };
          }
        },
      },
      analyzeLocation: {
        description: 'Obtiene datos de infraestructura urbana (hospitales, escuelas, etc.) para una latitud y longitud específicas utilizando la API de Overpass.',
        inputSchema: z.object({
          lat: z.number().describe('La latitud del punto a analizar.'),
          lon: z.number().describe('La longitud del punto a analizar.'),
        }),
        output: z.any(),
        execute: async ({ lat, lon }) => {
          console.log(`[Tool] execute analyzeLocation for: ${lat}, ${lon}`);
          try {
            const urbanData = await getUrbanData(lat, lon);
            console.log('[Tool] Urban data received:', urbanData);
            if ('error' in urbanData) {
              throw new Error(urbanData.error);
            }
            return urbanData;
          } catch (error) {
            console.error('[Tool] Error in analyzeLocation:', error);
            return { error: `No se pudieron obtener los datos de infraestructura: ${error instanceof Error ? error.message : 'Error desconocido'}` };
          }
        },
      },
      getRiskAssessment: {
        description: 'Evalúa riesgos (inundación, estructural, ambiental, sísmico) para una ubicación basándose en datos de OpenStreetMap y referencias del IGN. Proporciona análisis detallado con fuentes oficiales.',
        inputSchema: z.object({
          lat: z.number().describe('La latitud del punto a analizar.'),
          lon: z.number().describe('La longitud del punto a analizar.'),
        }),
        output: z.any(),
        execute: async ({ lat, lon }) => {
          console.log(`[Tool] execute getRiskAssessment for: ${lat}, ${lon}`);
          try {
            const riskData = await getRiskData(lat, lon);
            console.log('[Tool] Risk data received:', riskData);
            return riskData;
          } catch (error) {
            console.error('[Tool] Error in getRiskAssessment:', error);
            return { error: `No se pudieron obtener los datos de riesgos: ${error instanceof Error ? error.message : 'Error desconocido'}` };
          }
        },
      },
      getWeather: {
        description: 'Obtiene datos meteorológicos actuales (temperatura, humedad, precipitaciones, viento, nubosidad) para una ubicación específica utilizando Open-Meteo API.',
        inputSchema: z.object({
          lat: z.number().describe('La latitud del punto.'),
          lon: z.number().describe('La longitud del punto.'),
        }),
        output: z.any(),
        execute: async ({ lat, lon }) => {
          console.log(`[Tool] execute getWeather for: ${lat}, ${lon}`);
          try {
            const weatherData = await getWeatherData(lat, lon);
            console.log('[Tool] Weather data received:', weatherData);
            return weatherData;
          } catch (error) {
            console.error('[Tool] Error in getWeather:', error);
            return { error: `No se pudieron obtener los datos meteorológicos: ${error instanceof Error ? error.message : 'Error desconocido'}` };
          }
        },
      },
    },
  });

  // Capturar tool results
  let urbanData: any = null;
  let riskData: any = null;
  let coords: any = null;
  let weatherData: any = null;
  let lastToolInput: any = null;
  
  for await (const part of result.fullStream) {
    if (part.type === 'tool-result') {
      console.log('[API] Tool result full part:', JSON.stringify(part, null, 2));
      // El resultado está en part.output (según AI SDK v6)
      const toolResult = (part as any).output;
      console.log('[API] Tool result extracted:', part.toolName, toolResult);
      
      // Capturar el input para obtener coordenadas
      if ((part as any).input) {
        lastToolInput = (part as any).input;
      }
      
      if (part.toolName === 'analyzeLocation') {
        urbanData = toolResult;
      } else if (part.toolName === 'getRiskAssessment') {
        riskData = toolResult;
      } else if (part.toolName === 'buscarCoordenadas') {
        coords = toolResult;
      } else if (part.toolName === 'getWeather') {
        weatherData = toolResult;
      }
    }
  }

  console.log('[API] Tools completed, generating report...');
  console.log('[API] urbanData:', urbanData ? 'AVAILABLE' : 'NULL');
  console.log('[API] riskData:', riskData ? 'AVAILABLE' : 'NULL');
  console.log('[API] weatherData:', weatherData ? 'AVAILABLE' : 'NULL');
  
  // Generar informe manualmente con los datos obtenidos
  const reportStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      try {
        // Obtener coordenadas
        let lat, lon;
        
        // Prioridad 1: Desde tool input (más confiable)
        if (lastToolInput && lastToolInput.lat && lastToolInput.lon) {
          lat = lastToolInput.lat;
          lon = lastToolInput.lon;
        } 
        // Prioridad 2: Desde buscarCoordenadas
        else if (coords && coords.lat && coords.lon) {
          lat = coords.lat;
          lon = coords.lon;
        }
        // Prioridad 3: Del mensaje
        else {
          const lastMessage = messages[messages.length - 1];
          const coordMatch = lastMessage?.content?.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
          if (coordMatch) {
            lat = parseFloat(coordMatch[1]);
            lon = parseFloat(coordMatch[2]);
          }
        }
        
        // Validar que los datos no sean errores
        const urbanDataHasError = !urbanData || 'error' in urbanData;
        const riskDataHasError = !riskData || !riskData.floodRisk;
        
        if (!urbanData && !riskData) {
          controller.enqueue(encoder.encode('❌ Error: No se pudieron obtener datos de las APIs. Por favor, intente nuevamente.\n'));
          if (urbanData && 'error' in urbanData) {
            controller.enqueue(encoder.encode(`\nError de infraestructura: ${urbanData.error}\n`));
          }
          controller.close();
          return;
        }
        
        // Generar el informe
        let report = '# 📊 INFORME DE ANÁLISIS GEOESPACIAL\n\n';
        report += '## 📍 DATOS DE UBICACIÓN\n\n';
        report += `**Coordenadas:** ${lat?.toFixed(6)}, ${lon?.toFixed(6)}\n`;
        
        // Estimación de población
        if (riskData.estimatedPopulation) {
          report += `**Población estimada (radio 1km):** ${riskData.estimatedPopulation.toLocaleString('es-ES')} habitantes\n`;
          report += `**Densidad poblacional:** ~${riskData.populationDensity?.toLocaleString('es-ES')} hab/km²\n`;
          report += `*${riskData.populationNote}*\n`;
        }
        report += '\n';
        
        // Condiciones meteorológicas actuales
        if (weatherData && !('error' in weatherData)) {
          report += '## 🌤️ CONDICIONES METEOROLÓGICAS ACTUALES\n\n';
          report += `**Fecha y hora:** ${new Date(weatherData.timestamp).toLocaleString('es-ES')}\n\n`;
          report += `🌡️ **Temperatura:** ${weatherData.temperature}°C\n`;
          report += `💧 **Humedad:** ${weatherData.humidity}%\n`;
          report += `🌧️ **Precipitaciones:** ${weatherData.precipitation} mm\n`;
          report += `☁️ **Nubosidad:** ${weatherData.cloudCover}%\n`;
          report += `💨 **Viento:** ${weatherData.windSpeed} km/h (dirección ${weatherData.windDirection}°)\n`;
          report += `🌈 **Condición:** ${weatherData.weatherDescription}\n\n`;
          report += '*Datos proporcionados por Open-Meteo API*\n\n';
        }

        
        report += '## 🏗️ INFRAESTRUCTURA Y SERVICIOS\n\n';
        
        // Verificar si hay error en urbanData
        const hasInfrastructureData = urbanData && !('error' in urbanData);
        
        if (!hasInfrastructureData && urbanData && 'error' in urbanData) {
          report += `⚠️ **Advertencia:** No se pudieron obtener datos de infraestructura.\n`;
          report += `*Motivo: ${urbanData.error}*\n\n`;
        }
        
        // Hospitales
        report += `### 🏥 Servicios de Salud (${hasInfrastructureData && urbanData.hospitals ? urbanData.hospitals.length : 0})\n`;
        if (hasInfrastructureData && urbanData.hospitals && urbanData.hospitals.length > 0) {
          urbanData.hospitals.slice(0, 5).forEach((h: any) => {
            report += `  - ${h.name || 'Sin nombre'}\n`;
          });
          if (urbanData.hospitals.length > 5) {
            report += `  - ... y ${urbanData.hospitals.length - 5} más\n`;
          }
        } else {
          report += '  - No se encontraron hospitales en el radio de búsqueda\n';
        }
        
        // Escuelas
        report += `\n### 🏫 Educación (${hasInfrastructureData && urbanData.schools ? urbanData.schools.length : 0})\n`;
        if (hasInfrastructureData && urbanData.schools && urbanData.schools.length > 0) {
          urbanData.schools.slice(0, 8).forEach((s: any) => {
            report += `  - ${s.name || 'Sin nombre'}\n`;
          });
          if (urbanData.schools.length > 8) {
            report += `  - ... y ${urbanData.schools.length - 8} más\n`;
          }
        } else {
          report += '  - No se encontraron centros educativos en el radio de búsqueda\n';
        }
        
        // Servicios de Emergencia
        report += `\n### 🚨 Servicios de Emergencia (${hasInfrastructureData && urbanData.emergencyServices ? urbanData.emergencyServices.length : 0})\n`;
        if (hasInfrastructureData && urbanData.emergencyServices && urbanData.emergencyServices.length > 0) {
          const policeStations = urbanData.emergencyServices.filter((e: any) => e.type === 'police');
          const fireStations = urbanData.emergencyServices.filter((e: any) => e.type === 'fire_station');
          
          if (policeStations.length > 0) {
            report += `  **Policía:** ${policeStations.length} estación(es)\n`;
            policeStations.forEach((p: any) => {
              report += `    - ${p.name || 'Estación de Policía'}\n`;
            });
          }
          
          if (fireStations.length > 0) {
            report += `  **Bomberos:** ${fireStations.length} estación(es)\n`;
            fireStations.forEach((f: any) => {
              report += `    - ${f.name || 'Estación de Bomberos'}\n`;
            });
          }
        } else {
          report += '  - No se encontraron servicios de emergencia en el radio de búsqueda\n';
        }
        
        // Parques
        report += `\n### 🌳 Áreas Verdes y Espacios Recreativos (${hasInfrastructureData && urbanData.parks ? urbanData.parks.length : 0})\n`;
        if (hasInfrastructureData && urbanData.parks && urbanData.parks.length > 0) {
          const namedParks = urbanData.parks.filter((p: any) => p.name && p.name !== 'Sin nombre');
          const unnamedParks = urbanData.parks.filter((p: any) => !p.name || p.name === 'Sin nombre');
          
          if (namedParks.length > 0) {
            namedParks.slice(0, 5).forEach((p: any) => {
              report += `  - ${p.name}\n`;
            });
          }
          
          if (unnamedParks.length > 0) {
            report += `  - ${unnamedParks.length} espacios recreativos adicionales\n`;
          }
        } else {
          report += '  - No se encontraron áreas verdes en el radio de búsqueda\n';
        }
        
        // Comercios
        report += `\n### 🏪 Comercio y Servicios (${hasInfrastructureData && urbanData.shops ? urbanData.shops.length : 0} establecimientos)\n`;
        if (hasInfrastructureData && urbanData.shops && urbanData.shops.length > 0) {
          // Categorizar comercios
          const supermarkets = urbanData.shops.filter((s: any) => 
            ['supermarket', 'convenience', 'greengrocer'].includes(s.type)
          );
          const restaurants = urbanData.shops.filter((s: any) => 
            ['restaurant', 'cafe', 'fast_food', 'bar'].includes(s.type)
          );
          const stores = urbanData.shops.filter((s: any) => 
            ['clothes', 'shoes', 'mall', 'department_store'].includes(s.type)
          );
          
          if (supermarkets.length > 0) {
            report += `  **Supermercados/Alimentación:** ${supermarkets.length}\n`;
            supermarkets.slice(0, 3).forEach((s: any) => {
              report += `    - ${s.name || 'Sin nombre'} (${s.type})\n`;
            });
          }
          
          if (restaurants.length > 0) {
            report += `  **Restaurantes/Cafeterías:** ${restaurants.length}\n`;
          }
          
          if (stores.length > 0) {
            report += `  **Tiendas/Comercios:** ${stores.length}\n`;
          }
          
          const others = urbanData.shops.length - supermarkets.length - restaurants.length - stores.length;
          if (others > 0) {
            report += `  **Otros servicios:** ${others}\n`;
          }
        }
        
        report += '\n## ⚠️ EVALUACIÓN DE RIESGOS\n\n';
        report += `**🌊 Riesgo de Inundación:** ${riskData.floodRisk || 'DESCONOCIDO'}\n`;
        report += `${riskData.floodNote || 'No hay información disponible'}\n\n`;
        
        report += `**🏢 Riesgo Estructural:** ${riskData.structuralRisk || 'DESCONOCIDO'}\n`;
        report += `${riskData.structuralNote || 'No hay información disponible'}\n\n`;
        
        report += `**🔥 Riesgo de Incendio:** ${riskData.fireRisk || 'DESCONOCIDO'}\n`;
        report += `${riskData.fireNote || 'No hay información disponible'}\n\n`;
        
        report += `**🌳 Riesgo Ambiental:** ${riskData.environmentalRisk || 'DESCONOCIDO'}\n`;
        report += `${riskData.environmentalNote || 'No hay información disponible'}\n\n`;
        
        report += `**🌍 Riesgo Sísmico:** ${riskData.seismicRisk || 'DESCONOCIDO'}\n`;
        report += `${riskData.seismicNote || 'No hay información disponible'}\n\n`;
        
        report += '## 📊 ANÁLISIS Y CONCLUSIONES\n\n';
        
        // Caracterización de la zona
        report += '### Caracterización de la Zona\n';
        
        const totalInfra = (urbanData.hospitals?.length || 0) + 
                          (urbanData.schools?.length || 0) + 
                          (urbanData.shops?.length || 0);
        
        if (totalInfra > 500) {
          report += 'La ubicación se encuentra en una **zona urbana de muy alta densidad** con extensa infraestructura comercial y de servicios. ';
        } else if (totalInfra > 200) {
          report += 'La ubicación se encuentra en una **zona urbana consolidada** con buena disponibilidad de servicios. ';
        } else if (totalInfra > 50) {
          report += 'La ubicación se encuentra en una **zona urbana moderada** con servicios básicos disponibles. ';
        } else {
          report += 'La ubicación se encuentra en una **zona de baja densidad urbana**. ';
        }
        
        // Análisis específico según riesgos
        if (riskData.structuralRisk === 'ALTO') {
          report += 'La zona presenta **alta densidad de infraestructura** lo que indica concentración de actividad económica. ';
          report += 'Esto puede generar presión sobre servicios públicos y requiere mantenimiento constante.\n\n';
        } else if (riskData.structuralRisk === 'MEDIO') {
          report += 'La densidad de infraestructura es equilibrada, permitiendo un buen funcionamiento urbano.\n\n';
        } else {
          report += 'La baja densidad de infraestructura sugiere una zona menos urbanizada.\n\n';
        }
        
        if (riskData.environmentalRisk === 'BAJO') {
          report += 'La **disponibilidad de áreas verdes es favorable**, contribuyendo positivamente a la calidad ambiental y bienestar de los residentes.\n\n';
        } else if (riskData.environmentalRisk === 'MEDIO') {
          report += 'Se recomienda aumentar las áreas verdes para mejorar la calidad ambiental.\n\n';
        } else if (riskData.environmentalRisk === 'ALTO') {
          report += '⚠️ **Déficit de áreas verdes** en la zona. Se recomienda priorizar espacios verdes en el desarrollo urbano.\n\n';
        }
        
        // Servicios clave
        report += '### Servicios Disponibles\n';
        if (urbanData.hospitals && urbanData.hospitals.length > 0) {
          report += `✅ Servicios de salud disponibles (${urbanData.hospitals.length})\n`;
        } else {
          report += `⚠️ No se detectaron centros de salud cercanos\n`;
        }
        
        if (urbanData.schools && urbanData.schools.length >= 5) {
          report += `✅ Buena oferta educativa (${urbanData.schools.length} centros)\n`;
        } else if (urbanData.schools && urbanData.schools.length > 0) {
          report += `ℹ️ Oferta educativa limitada (${urbanData.schools.length} centros)\n`;
        } else {
          report += `⚠️ No se detectaron centros educativos cercanos\n`;
        }
        
        if (urbanData.emergencyServices && urbanData.emergencyServices.length > 0) {
          report += `✅ Servicios de emergencia presentes\n`;
        } else {
          report += `⚠️ No se detectaron servicios de emergencia inmediatos\n`;
        }
        
        const supermarkets = urbanData.shops?.filter((s: any) => 
          ['supermarket', 'convenience'].includes(s.type)
        ).length || 0;
        
        if (supermarkets >= 5) {
          report += `✅ Excelente acceso a comercios de alimentación (${supermarkets})\n`;
        } else if (supermarkets > 0) {
          report += `ℹ️ Acceso básico a comercios (${supermarkets})\n`;
        }
        
        report += '\n### Recomendaciones:\n';
        
        if (riskData.structuralRisk === 'ALTO') {
          report += '- Priorizar el mantenimiento de infraestructura existente\n';
          report += '- Evaluar capacidad de servicios públicos ante crecimiento\n';
        }
        
        if (riskData.floodRisk === 'MEDIO' || riskData.floodRisk === 'ALTO') {
          report += '- Implementar sistemas de drenaje adecuados\n';
          report += '- Considerar seguros contra inundaciones\n';
        }
        
        if (riskData.environmentalRisk !== 'BAJO') {
          report += '- Incrementar áreas verdes y espacios públicos\n';
        }
        
        report += '- Mantener infraestructura de servicios en buen estado\n';
        report += '- Fomentar desarrollo sostenible en futuras construcciones\n';
        
        if (urbanData.parks && urbanData.parks.length > 0) {
          report += '- Aprovechar y mantener las áreas verdes existentes\n';
        }
        
        report += '\n### Aptitud de la Zona\n';
        
        const aptitudes = [];
        if (urbanData.schools && urbanData.schools.length > 5) {
          aptitudes.push('✅ Zona familiar (buena oferta educativa)');
        }
        if (supermarkets >= 5) {
          aptitudes.push('✅ Zona con servicios comerciales completos');
        }
        if (urbanData.parks && urbanData.parks.length > 5) {
          aptitudes.push('✅ Zona con espacios recreativos');
        }
        if (riskData.structuralRisk === 'ALTO') {
          aptitudes.push('✅ Zona comercial activa');
        }
        
        if (aptitudes.length > 0) {
          aptitudes.forEach(apt => report += apt + '\n');
        } else {
          report += 'Zona residencial tranquila con servicios básicos\n';
        }
        
        report += '\n';
        
        report += '## 🔗 FUENTES DE DATOS\n\n';
        if (riskData.sources && Array.isArray(riskData.sources)) {
          riskData.sources.forEach((source: string) => {
            report += `- ${source}\n`;
          });
        }
        
        report += '\n## ⚠️ LIMITACIONES\n\n';
        report += riskData.limitations || 'Este es un análisis preliminar basado en datos públicos disponibles.';
        
        // Enviar el informe por chunks
        const chunkSize = 100;
        for (let i = 0; i < report.length; i += chunkSize) {
          controller.enqueue(encoder.encode(report.slice(i, i + chunkSize)));
          await new Promise(resolve => setTimeout(resolve, 10)); // Simular streaming
        }
        
        console.log('[API] Report generated successfully');
        controller.close();
      } catch (error) {
        console.error('[API] Error generating report:', error);
        controller.enqueue(encoder.encode('\n\n❌ Error al generar el informe.'));
        controller.close();
      }
    }
  });
  
  return new Response(reportStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    }
  });
  } catch (error) {
    console.error('[API] Error in POST handler:', error);
    return new Response(JSON.stringify({ 
      error: 'Error en el servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}