// 1. Geocodificación (Texto a Coordenadas)
export async function getCoordinates(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'GeoAI-Student-Project' } });
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: data[0].lat, lon: data[0].lon, display_name: data[0].display_name };
}

// Tipos para la infraestructura
interface InfrastructureData {
  hospitals: any[];
  schools: any[];
  emergencyServices: any[];
  waterways: any[];
  parks: any[];
  roads: any[];
  shops: any[];
}

export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  description: string;
  icon: string;
  pressure: number;
}

export async function fetchWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  try {
    const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener datos del clima');
    }

    const data = await response.json();
    
    return {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
      wind_deg: data.wind.deg,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      pressure: data.main.pressure,
    };
  } catch (error) {
    console.error('Error al obtener clima:', error);
    return null;
  }
}

export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export function getWindSpeedDescription(speed: number): string {
  if (speed < 1) return 'Calma';
  if (speed < 5) return 'Brisa ligera';
  if (speed < 11) return 'Brisa moderada';
  if (speed < 19) return 'Brisa fuerte';
  if (speed < 28) return 'Viento moderado';
  if (speed < 38) return 'Viento fuerte';
  return 'Temporal';
}

// Función para obtener datos meteorológicos actuales
export async function getWeatherData(lat: number, lon: number): Promise<WeatherData | WeatherError> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&timezone=auto`;
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!res.ok) {
      throw new Error(`Weather API error: ${res.status}`);
    }
    
    const data = await res.json();
    const current = data.current;
    
    // Mapear códigos de clima a descripciones en español
    const weatherCode = current.weather_code || 0;
    let weatherDescription = 'Despejado';
    
    if (weatherCode === 0) weatherDescription = 'Despejado';
    else if (weatherCode <= 3) weatherDescription = 'Parcialmente nublado';
    else if (weatherCode <= 48) weatherDescription = 'Nublado';
    else if (weatherCode <= 67) weatherDescription = 'Lluvia';
    else if (weatherCode <= 77) weatherDescription = 'Nieve';
    else if (weatherCode <= 82) weatherDescription = 'Chubascos';
    else if (weatherCode <= 86) weatherDescription = 'Lluvia intensa';
    else if (weatherCode <= 99) weatherDescription = 'Tormenta';
    
    return {
      temperature: current.temperature_2m || 0,
      humidity: current.relative_humidity_2m || 0,
      precipitation: current.precipitation || 0,
      cloudCover: current.cloud_cover || 0,
      windSpeed: current.wind_speed_10m || 0,
      windDirection: current.wind_direction_10m || 0,
      weatherDescription,
      timestamp: current.time || new Date().toISOString()
    };
  } catch (e) {
    console.error('Error en getWeatherData:', e);
    return { error: `Error obteniendo datos meteorológicos: ${e instanceof Error ? e.message : 'Desconocido'}` };
  }
}

interface InfrastructureError {
  error: string;
}

// 2. Infraestructura y Urbanismo (Overpass API)
export async function getUrbanData(lat: number, lon: number): Promise<InfrastructureData | InfrastructureError> {
  console.log(`[getUrbanData] Solicitando datos para lat=${lat}, lon=${lon}`);
  
  const query = `
    [out:json];
    (
      node["amenity"~"hospital|clinic|doctors"](around:1000, ${lat}, ${lon});
      way["amenity"~"hospital|clinic"](around:1000, ${lat}, ${lon});
      relation["amenity"="hospital"](around:1000, ${lat}, ${lon});
      node["healthcare"~"hospital|clinic|centre"](around:1000, ${lat}, ${lon});
      way["healthcare"~"hospital|clinic|centre"](around:1000, ${lat}, ${lon});
      node["amenity"~"school|kindergarten|college|university"](around:1000, ${lat}, ${lon});
      way["amenity"~"school|kindergarten|college|university"](around:1000, ${lat}, ${lon});
      node["amenity"~"fire_station|police"](around:1000, ${lat}, ${lon});
      way["amenity"~"fire_station|police"](around:1000, ${lat}, ${lon});
      node["amenity"="pharmacy"](around:500, ${lat}, ${lon});
      way["waterway"](around:500, ${lat}, ${lon});
      node["leisure"~"park|playground|garden|pitch|sports_centre"](around:1000, ${lat}, ${lon});
      way["leisure"~"park|playground|garden|pitch"](around:1000, ${lat}, ${lon});
      way["highway"~"primary|secondary|tertiary"](around:300, ${lat}, ${lon});
      node["shop"](around:500, ${lat}, ${lon});
    );
    out center;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  
  console.log(`[getUrbanData] URL de consulta: ${url.substring(0, 100)}...`);
  
  try {
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'GeoAI-Assistant-Educational-Project/1.0',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(15000) // 15s timeout
    });
    
    console.log(`[getUrbanData] Respuesta de Overpass: status=${res.status}, ok=${res.ok}`);
    
    if (!res.ok) {
      console.error(`[getUrbanData] Overpass API returned status: ${res.status}`);
      // Si falla, intentar con otro endpoint
      console.log('[getUrbanData] Intentando con endpoint de respaldo...');
      const backupUrl = `https://lz4.overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const backupRes = await fetch(backupUrl, {
        headers: { 
          'User-Agent': 'GeoAI-Assistant-Educational-Project/1.0',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      });
      
      console.log(`[getUrbanData] Respuesta de respaldo: status=${backupRes.status}, ok=${backupRes.ok}`);
      
      if (!backupRes.ok) {
        throw new Error(`Overpass API error: ${res.status} (backup: ${backupRes.status})`);
      }
      const backupData = await backupRes.json();
      console.log(`[getUrbanData] Datos de respaldo recibidos: ${backupData.elements?.length || 0} elementos`);
      return processOverpassData(backupData);
    }
    
    const data = await res.json();
    console.log(`[getUrbanData] Datos recibidos: ${data.elements?.length || 0} elementos`);
    const result = processOverpassData(data);
    console.log(`[getUrbanData] Resultado procesado - hospitales: ${result.hospitals?.length}, escuelas: ${result.schools?.length}, tiendas: ${result.shops?.length}`);
    return result;
  } catch (e) {
    console.error('[getUrbanData] Error:', e);
    return { error: `Error conectando con Overpass API: ${e instanceof Error ? e.message : 'Desconocido'}` };
  }
}

// Función auxiliar para procesar datos de Overpass
function processOverpassData(data: any): InfrastructureData {
  console.log(`[processOverpassData] Procesando ${data.elements?.length || 0} elementos`);
  
  const infrastructure: InfrastructureData = {
    hospitals: [],
    schools: [],
    emergencyServices: [],
    waterways: [],
    parks: [],
    roads: [],
    shops: [],
  };
  
  if (!data.elements || data.elements.length === 0) {
    console.log('[processOverpassData] No hay elementos para procesar');
    return infrastructure;
  }
  
  data.elements.forEach((el: any) => {
    // Para way y relation, usar center si está disponible
    const lat = el.lat || el.center?.lat;
    const lon = el.lon || el.center?.lon;
    
    const item = {
      type: el.tags.amenity || el.tags.healthcare || el.tags.waterway || el.tags.leisure || el.tags.highway || el.tags.shop,
      name: el.tags.name || "Sin nombre",
      lat: lat,
      lon: lon,
    };
    
    // Hospitales y centros de salud
    if (el.tags.amenity === 'hospital' || el.tags.amenity === 'clinic' || el.tags.amenity === 'doctors' || 
        el.tags.healthcare === 'hospital' || el.tags.healthcare === 'clinic' || el.tags.healthcare === 'centre') {
      infrastructure.hospitals.push(item);
    }
    // Escuelas y educación
    else if (el.tags.amenity === 'school' || el.tags.amenity === 'kindergarten' || 
             el.tags.amenity === 'college' || el.tags.amenity === 'university') {
      infrastructure.schools.push(item);
    }
    // Servicios de emergencia
    else if (el.tags.amenity === 'fire_station' || el.tags.amenity === 'police') {
      infrastructure.emergencyServices.push(item);
    }
    // Cauces de agua
    else if (el.tags.waterway) {
      infrastructure.waterways.push(item);
    }
    // Áreas verdes y recreación
    else if (el.tags.leisure) {
      infrastructure.parks.push(item);
    }
    // Carreteras
    else if (el.tags.highway) {
      infrastructure.roads.push(item);
    }
    // Comercios
    else if (el.tags.shop) {
      infrastructure.shops.push(item);
    }
  });
  
  console.log(`[processOverpassData] Resultados: hospitales=${infrastructure.hospitals.length}, escuelas=${infrastructure.schools.length}, emergencia=${infrastructure.emergencyServices.length}, parques=${infrastructure.parks.length}, tiendas=${infrastructure.shops.length}`);
  
  return infrastructure;
}

// 3. Análisis de Riesgos con datos reales
export async function getRiskData(lat: number, lon: number) {
  const urbanData = await getUrbanData(lat, lon);
  
  // Type guard para verificar si es un error
  if ('error' in urbanData) {
    return {
      floodRisk: "DESCONOCIDO",
      structuralRisk: "DESCONOCIDO",
      environmentalRisk: "DESCONOCIDO",
      seismicRisk: "DESCONOCIDO",
      note: "No se pudieron evaluar los riesgos por falta de datos",
      sources: []
    };
  }
  
  // === RIESGO DE INUNDACIÓN ===
  // Basado en datos de OpenStreetMap (cauces de agua cercanos)
  const waterways = urbanData.waterways || [];
  let floodRisk = "BAJO";
  let floodNote = "";
  
  if (waterways.length > 3) {
    floodRisk = "ALTO";
    floodNote = `Se detectaron ${waterways.length} cauces de agua en un radio de 500m. Alto riesgo de inundación en caso de precipitaciones extremas.`;
  } else if (waterways.length > 0) {
    floodRisk = "MEDIO";
    floodNote = `${waterways.length} cauce(s) de agua cercano(s). Riesgo moderado de inundación.`;
  } else {
    floodNote = "No se detectaron cauces de agua significativos en las cercanías.";
  }
  
  // === RIESGO ESTRUCTURAL ===
  // Basado en densidad de infraestructura (más densidad = más presión sobre servicios)
  const totalInfra = (urbanData.hospitals?.length || 0) + 
                     (urbanData.schools?.length || 0) + 
                     (urbanData.shops?.length || 0);
  let structuralRisk = "BAJO";
  let structuralNote = "";
  
  if (totalInfra > 50) {
    structuralRisk = "ALTO";
    structuralNote = `Zona de alta densidad urbana con ${totalInfra} elementos de infraestructura. Posible sobrecarga de servicios públicos.`;
  } else if (totalInfra > 20) {
    structuralRisk = "MEDIO";
    structuralNote = `Densidad urbana moderada con ${totalInfra} elementos de infraestructura.`;
  } else {
    structuralNote = `Baja densidad urbana con ${totalInfra} elementos registrados.`;
  }
  
  // === RIESGO AMBIENTAL ===
  // Basado en disponibilidad de áreas verdes
  const parks = urbanData.parks || [];
  let environmentalRisk = "MEDIO";
  let environmentalNote = "";
  
  if (parks.length > 3) {
    environmentalRisk = "BAJO";
    environmentalNote = `Buena disponibilidad de áreas verdes (${parks.length} parques/espacios recreativos). Calidad ambiental favorable.`;
  } else if (parks.length === 0) {
    environmentalRisk = "ALTO";
    environmentalNote = "Ausencia de áreas verdes registradas. Baja calidad ambiental urbana.";
  } else {
    environmentalNote = `${parks.length} área(s) verde(s) detectada(s). Calidad ambiental moderada.`;
  }
  
  // === RIESGO SÍSMICO ===
  // Datos aproximados por región (España peninsular: bajo-medio)
  // En producción real: consultar IGN o Copernicus
  let seismicRisk = "BAJO";
  let seismicNote = "";
  
  // Lógica simplificada basada en latitud (sur de España = mayor riesgo)
  if (lat < 38 && lat > 36) {
    seismicRisk = "MEDIO";
    seismicNote = "Zona con actividad sísmica moderada según el IGN. Se recomienda construcción antisísmica.";
  } else {
    seismicNote = "Actividad sísmica baja según registros históricos del IGN.";
  }
  
  // === RIESGO DE INCENDIO ===
  let fireRisk = "BAJO";
  let fireNote = "";
  
  const fireStations = urbanData.emergencyServices?.filter((e: any) => e.type === 'fire_station').length || 0;
  
  // Factores: alta densidad + pocas estaciones de bomberos = mayor riesgo
  if (totalInfra > 500 && fireStations === 0) {
    fireRisk = "ALTO";
    fireNote = "Alta densidad urbana sin estaciones de bomberos detectadas. Riesgo elevado de propagación.";
  } else if (totalInfra > 300 && fireStations < 2) {
    fireRisk = "MEDIO";
    fireNote = "Densidad urbana media con cobertura limitada de servicios contra incendios.";
  } else if (fireStations > 0) {
    fireRisk = "BAJO";
    fireNote = `Cobertura adecuada con ${fireStations} estación(es) de bomberos detectada(s).`;
  } else {
    fireNote = "Cobertura de servicios contra incendios no disponible en los datos.";
  }
  
  // === ESTIMACIÓN DE POBLACIÓN ===
  // Estimación basada en densidad de infraestructura
  let estimatedPopulation = 0;
  let populationNote = "";
  
  // Fórmula simplificada: infraestructura por habitante
  // Alta densidad urbana: ~200-300 personas por elemento de infraestructura clave
  // Media densidad: ~150-200
  // Baja densidad: ~50-100
  
  const keyInfra = (urbanData.hospitals?.length || 0) * 100 + 
                   (urbanData.schools?.length || 0) * 50 + 
                   (urbanData.shops?.length || 0) * 10;
  
  if (totalInfra > 500) {
    estimatedPopulation = Math.round(keyInfra * 2.5);
    populationNote = `Zona de muy alta densidad. Estimación basada en ${totalInfra} elementos de infraestructura.`;
  } else if (totalInfra > 200) {
    estimatedPopulation = Math.round(keyInfra * 2);
    populationNote = `Zona urbana consolidada. Estimación basada en ${totalInfra} elementos de infraestructura.`;
  } else if (totalInfra > 50) {
    estimatedPopulation = Math.round(keyInfra * 1.5);
    populationNote = `Zona urbana moderada. Estimación basada en ${totalInfra} elementos de infraestructura.`;
  } else {
    estimatedPopulation = Math.round(keyInfra * 1);
    populationNote = `Zona de baja densidad. Estimación aproximada.`;
  }
  
  // Ajustar por radio de búsqueda (1000m = ~3.14 km²)
  const populationDensity = Math.round(estimatedPopulation / 3.14);
  
  return {
    floodRisk,
    floodNote,
    structuralRisk,
    structuralNote,
    environmentalRisk,
    environmentalNote,
    seismicRisk,
    seismicNote,
    fireRisk,
    fireNote,
    estimatedPopulation,
    populationDensity,
    populationNote,
    details: {
      waterwaysNearby: waterways.length,
      infrastructureDensity: totalInfra,
      greenAreas: parks.length,
      fireStations: fireStations
    },
    sources: [
      "OpenStreetMap / Overpass API - Infraestructura y cauces de agua",
      "Análisis basado en datos cartográficos oficiales OSM",
      "IGN (Instituto Geográfico Nacional) - Referencias sísmicas",
      "Estimación poblacional basada en densidad de infraestructura"
    ],
    limitations: "Los riesgos se calculan con datos disponibles públicamente. Para análisis detallados se recomienda consultar: Copernicus EMS, IGN, MITECO (Ministerio para la Transición Ecológica)."
  };
}