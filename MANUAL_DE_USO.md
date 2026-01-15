# 📘 Manual de Uso - GEOAI-ASSISTANT

## Introducción

GEOAI-ASSISTANT es tu compañero inteligente para el análisis geoespacial profesional. Esta aplicación web te permite explorar **cualquier ubicación del mundo** (España, Colombia, México, y más de 190 países) y obtener un informe completo sobre su infraestructura, condiciones meteorológicas, riesgos y potencial urbano, todo basado en datos reales de fuentes oficiales internacionales.

Imagina que eres un urban planner evaluando un nuevo terreno en Bogotá, un inversor explorando zonas prometedoras en Madrid, o simplemente alguien curioso sobre tu barrio. Con GEOAI-ASSISTANT, en segundos obtienes un análisis completo que normalmente tomaría horas de investigación.

---

## ¿Cómo empezar?

### Opción 1: Buscar por dirección

1. **Escribe una dirección completa** en el campo de búsqueda
   - Ejemplos: "Puerta del Sol, Madrid, España"
   - "Bogotá, Colombia" 
   - "Medellín, Antioquia, Colombia"
   - "Ciudad de México, México"
2. Mientras escribes, aparecerán **sugerencias automáticas** de lugares
3. Haz clic en la sugerencia que te interese o presiona Enter
4. Presiona el botón **"Analizar"**

La aplicación encontrará las coordenadas exactas y generará tu informe.

### Opción 2: Hacer clic en el mapa

1. Simplemente **haz clic en cualquier punto** del mapa interactivo
2. Las coordenadas se capturarán automáticamente
3. Presiona **"Analizar punto del mapa"**

¡Así de simple!

---

## El Informe Geoespacial

Una vez que inicies el análisis, verás un indicador de carga mientras nuestra IA:

1. **Consulta OpenStreetMap** para obtener datos reales de infraestructura global
2. **Obtiene datos meteorológicos actuales** de Open-Meteo API
3. **Evalúa riesgos** basándose en datos geográficos oficiales
4. **Estima población** usando densidad de infraestructura
5. **Genera recomendaciones** personalizadas

El informe incluye:

### 📍 Datos de ubicación
- Coordenadas exactas (latitud y longitud)
- Población estimada en radio de 1km
- Densidad poblacional aproximada (hab/km²)
- Metodología de estimación

### 🌤️ Condiciones Meteorológicas Actuales
Datos en tiempo real que incluyen:
- **Temperatura** (°C)
- **Humedad relativa** (%)
- **Precipitaciones** (mm)
- **Nubosidad** (%)
- **Viento** (velocidad en km/h y dirección en grados)
- **Condición general** (despejado, nublado, lluvia, etc.)

*Datos proporcionados por Open-Meteo API - Actualización en tiempo real*

### 🏗️ Infraestructura cercana
Lista detallada y categorizada de:
- Hospitales y centros de salud
- Escuelas y centros educativos
- Servicios de emergencia (policía, bomberos)
- Comercios y servicios
- Áreas verdes y parques

### ⚠️ Análisis de riesgos
Evaluación profesional de **5 tipos de riesgos**:
- **Riesgo de inundación** (basado en cauces de agua cercanos)
- **Riesgo estructural** (densidad de infraestructura y sobrecarga de servicios)
- **Riesgo de incendio** (densidad urbana vs cobertura de bomberos)
- **Riesgo ambiental** (disponibilidad de áreas verdes)
- **Riesgo sísmico** (referencias del IGN - Instituto Geográfico Nacional)

Cada riesgo incluye:
- Nivel: BAJO, MEDIO o ALTO
- Explicación detallada
- Recomendaciones específicas

### 🎯 Usos urbanos recomendados
Sugerencias prácticas sobre qué tipo de desarrollos son apropiados para la zona.

### ✅ Recomendación final
Un resumen ejecutivo con la conclusión principal del análisis.

---

## Funciones adicionales

### 💾 Guardar ubicaciones
¿Quieres comparar varias zonas?
- Haz clic en **"Guardar ubicación"** 
- Añade notas personales para recordar detalles importantes
- El informe completo se guarda junto con la ubicación
- Accede a tu historial en **"Ubicaciones guardadas"**
- Badge visual indica si una ubicación tiene informe guardado (📄)

### 📥 Descargar informes
Todos los informes se pueden descargar en **formato PDF** con un solo clic, perfecto para compartir con tu equipo o guardar para consulta futura.

### 🗺️ Navegación del mapa
- **Zoom**: Usa la rueda del ratón o los controles +/-
- **Mover**: Arrastra el mapa con el ratón
- **Seleccionar**: Un simple clic marca tu punto de interés

---

## Consejos prácticos

🌍 **Cobertura global**: Funciona en todo el mundo. Los datos de OpenStreetMap están disponibles para más de 190 países.

🔍 **Para áreas rurales**: Los datos pueden ser limitados dependiendo del país. El informe te indicará claramente qué información está disponible y mostrará advertencias si hay problemas.

🏙️ **Para zonas urbanas**: Obtendrás análisis muy detallados con decenas (o cientos) de puntos de interés catalogados.

⚡ **Conexión a internet**: La app consulta múltiples APIs en tiempo real (OpenStreetMap, Overpass, Open-Meteo). Asegúrate de tener una conexión estable.

📱 **Responsive**: Funciona perfectamente en móviles, tablets y escritorio (aunque el escritorio ofrece la mejor experiencia visual).

🌤️ **Datos meteorológicos**: Se actualizan en tiempo real. Cada análisis obtiene las condiciones meteorológicas del momento exacto.

⏱️ **Tiempo de análisis**: Normalmente toma 10-30 segundos dependiendo de la densidad de datos de la zona.

---

## Limitaciones y transparencia

Como menciona cada informe generado, los datos provienen de:

- **OpenStreetMap / Overpass API**: Infraestructura y cauces de agua (datos colaborativos globales)
- **Open-Meteo API**: Datos meteorológicos en tiempo real (cobertura mundial)
- **IGN (Instituto Geográfico Nacional)**: Referencias sísmicas para España
- **Algoritmos propios**: Estimación poblacional basada en densidad de infraestructura

### Notas importantes:

✅ **Datos reales**: No inventamos nada. Todo proviene de APIs oficiales reconocidas internacionalmente.

⚠️ **Calidad variable**: La precisión depende de la cobertura de OpenStreetMap en cada región. Zonas urbanas consolidadas tienen mejor cobertura.

🔄 **Actualizaciones**: Los datos de OpenStreetMap se actualizan constantemente por la comunidad. Las condiciones meteorológicas son en tiempo real.

📊 **Estimaciones**: La población es una estimación basada en infraestructura, no datos censales oficiales.

🌍 **Limitaciones geográficas**: 
- Riesgo sísmico: Solo para España (basado en IGN). Para otros países se indica "DESCONOCIDO"
- Infraestructura: Disponible globalmente pero calidad variable
- Clima: Cobertura mundial completa

Para análisis críticos (construcción, inversión importante), recomendamos:
- Consultar **Copernicus EMS** para riesgos naturales
- **IGN** para datos sísmicos oficiales en España
- **MITECO** para evaluaciones ambientales
- Institutos geográficos nacionales de cada país
- Autoridades locales de planificación urbana

---

## Solución de problemas

### "No se encontraron datos de infraestructura"
- **Causa**: La zona puede tener poca cobertura en OpenStreetMap o problemas temporales con la API de Overpass
- **Solución**: Intenta con otra ubicación cercana o espera unos minutos y vuelve a intentar

### "Error al conectar con las APIs"
- **Causa**: Problema de conexión a internet o las APIs están temporalmente no disponibles
- **Solución**: Verifica tu conexión y reintenta. El sistema usa servidores de respaldo automáticamente

### El informe muestra "DESCONOCIDO" en riesgos
- **Causa**: No se pudieron obtener datos de infraestructura de la zona
- **Solución**: Normal en zonas remotas o con poca documentación en OpenStreetMap

### La búsqueda no encuentra mi dirección
- **Causa**: La dirección no está registrada en OpenStreetMap Nominatim
- **Solución**: Usa el modo de clic en el mapa para seleccionar coordenadas directamente

---

## Casos de uso

### 🏢 Urban Planning
"Necesito evaluar 3 terrenos en diferentes zonas de Bogotá para decidir dónde construir un nuevo desarrollo residencial"
→ Analiza cada zona, guarda las ubicaciones con notas, compara informes de riesgos y servicios

### 🏠 Compra de vivienda
"Quiero saber qué servicios hay cerca de este apartamento que me interesa"
→ Click en el mapa en la ubicación, revisa hospitales, escuelas, comercios en el radio de 1km

### 📊 Investigación académica
"Estudio patrones de urbanización en ciudades latinoamericanas"
→ Genera múltiples informes, descarga PDFs, analiza densidad de infraestructura

### 💼 Due diligence inmobiliaria
"Mi cliente quiere invertir en esta zona pero necesita un análisis de riesgos preliminar"
→ Informe completo con evaluación de 5 tipos de riesgos, descargable en PDF profesional

---

## Soporte técnico

**Proyecto académico**: GEOAI-ASSISTANT  
**Propósito**: Demostración de integración IA + APIs geoespaciales  
**Tecnologías**: Next.js 16, React 19, Groq AI, OpenStreetMap, Open-Meteo  

Para reportar problemas o sugerencias, contacta al equipo de desarrollo del proyecto.

---

## Conclusión

GEOAI-ASSISTANT democratiza el acceso a análisis geoespaciales profesionales. Lo que antes requería software GIS especializado, múltiples fuentes de datos y horas de trabajo, ahora está disponible con un simple clic.

**¡Empieza a explorar el mundo ahora!** 🌍
- **OpenStreetMap**: Base de datos colaborativa y abierta
- **Referencias IGN**: Instituto Geográfico Nacional
- **Análisis automático con IA**

**No inventa datos**. Si una fuente no responde o no tiene información, el informe lo indica claramente. Para decisiones críticas (compra de terrenos, proyectos de construcción grandes), siempre complementa con fuentes oficiales como Copernicus EMS, IGN oficial y MITECO.

---

## ¿Problemas?

Si ves un mensaje de error:
- **"No se encontraron datos"**: La zona puede ser muy remota o las APIs están temporalmente ocupadas. Intenta de nuevo.
- **"Coordenadas inválidas"**: Asegúrate de hacer clic dentro del mapa.
- **"Error de red"**: Revisa tu conexión a internet.

La mayoría de problemas se resuelven simplemente volviendo a intentar.

---

## ¡Explora sin límites!

GEOAI-ASSISTANT está diseñado para ser intuitivo y poderoso. No necesitas conocimientos técnicos. Solo curiosidad. Explora tu ciudad, compara barrios, descubre nuevas áreas. Los datos están ahí, esperando a ser descubiertos.

**¡Feliz exploración geoespacial! 🌍**
