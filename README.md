# 🌍 GEOAI-ASSISTANT

**Asistente de Inteligencia Geoespacial con IA + Mapas + Tools**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

> Análisis geoespacial profesional impulsado por IA con datos reales de OpenStreetMap, IGN y más.

---

## ✨ Características

- 🗺️ **Mapas Interactivos** con Leaflet y OpenStreetMap
- 🤖 **IA Avanzada** con Groq (llama-3.3-70b-versatile)
- 🛠️ **Function Calling** con 3 tools obligatorias
- 📊 **Datos Reales** de APIs oficiales (OSM, Overpass, IGN)
- 📄 **Informes Profesionales** en formato estructurado
- 📥 **Export a PDF** con un clic
- 💾 **Guardar Ubicaciones** con notas personalizadas
- 🎨 **UI Moderna** con Shadcn UI + Tailwind CSS
- 🔔 **Notificaciones** con Sonner
- 📱 **Responsive Design** (móvil, tablet, escritorio)

---

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/geo-ai-assistant.git
cd geo-ai-assistant
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz:

```bash
GROQ_API_KEY=tu_api_key_aqui
```

> 💡 Obtén tu API key gratuita en [Groq Console](https://console.groq.com)

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📚 Documentación

- 📘 [**Manual de Uso**](MANUAL_DE_USO.md) - Guía completa para usuarios
- 📊 [**Informe Técnico**](INFORME_TECNICO.md) - Arquitectura y decisiones de diseño

---

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Modo desarrollo (con Turbopack)
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter ESLint
```

---

## 📖 Cómo Usar

### Opción 1: Buscar por dirección
1. Escribe una dirección en el campo de búsqueda
2. Selecciona una sugerencia
3. Click en "Analizar"

### Opción 2: Click en el mapa
1. Haz click en cualquier punto del mapa
2. Click en "Analizar punto del mapa"

### Ver y descargar informe
- El informe se genera en tiempo real
- Descarga en PDF con un click
- Guarda ubicaciones para comparar

---

##  🏗️ Tecnologías Utilizadas

- **Next.js 16** + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **Shadcn UI**
- **Leaflet** (Mapas) + **Sonner** (Notificaciones)
- **Vercel AI SDK** + **Groq API** (LLM)
- **APIs**: OpenStreetMap, Overpass, IGN

---

## 📄 Licencia

MIT License

---

<div align="center">
  <p>Hecho con ❤️ para Inteligencia Geoespacial con IA</p>
</div>

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
