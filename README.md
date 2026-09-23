# 🧪 EcoLabs - Chatbot & API Inspector

> **Plataforma inteligente de gestión de residuos, reciclaje y compostaje con trazabilidad en tiempo real y arquitectura de recuperación documental bajo demanda.**

Bienvenido a **EcoLabs**. Esta aplicación es una solución interactiva de doble propósito: por un lado, funciona como un **asistente ciudadano amigable** para responder dudas sobre separación de residuos, contenedores, jornadas de residuos informáticos y compostaje domiciliario (basado en la normativa oficial de Rosario, Argentina); y por el otro, ofrece un **laboratorio visual de inspección de IA** que permite a cualquier persona comprender cómo interactúa un modelo de lenguaje (LLM), cuántos recursos consume y cuánto cuesta cada consulta.

---

## 🎯 ¿Qué hace este proyecto y qué problema resuelve?

En muchas ciudades, los vecinos no saben con certeza qué materiales van al contenedor naranja o verde, cómo construir una compostera casera o dónde dejar una computadora vieja. A su vez, los equipos que implementan soluciones de inteligencia artificial suelen trabajar a "ciegas" sin saber el costo exacto o el flujo real de datos con la API de Google Gemini.

**EcoLabs resuelve ambos desafíos:**
1. **Para el ciudadano:** Respuestas claras, directas, fundamentadas en documentos oficiales y con lenguaje cotidiano.
2. **Para creadores y tomadores de decisiones:** Visibilidad 100% transparente de cada llamada a la API, tiempo de respuesta, tokens consumidos, desglose de costos en dólares y trazabilidad de documentos abiertos.

---

## 💡 ¿Cómo funciona por dentro? *(Explicado fácil para no técnicos)*

Imagina que tienes una **biblioteca municipal** con manuales de reciclaje y normativas:

```
[ Ciudadano pregunta: "¿Cómo armo una compostera en mi balcón?" ]
                               │
                               ▼
            [ Servidor con Inteligencia Artificial (Gemini) ]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   ¿Es un saludo general?             ¿Requiere datos oficiales?
   (Responde amablemente)              (Abre el Manual PDF de Rosario)
                                                  │
                                                  ▼
                                       [ Lee el fragmento exacto ]
                                                  │
                                                  ▼
                         [ Redacta la respuesta paso a paso con citas ]
                                                  │
                                                  ▼
                [ Muestra al usuario la respuesta + costo en centavos de USD ]
```

1. **Catálogo de Fuentes:** El sistema cuenta con documentos oficiales (archivos PDF auténticos, textos normativos y páginas web oficiales de la Municipalidad de Rosario).
2. **Lectura Inteligente Bajo Demanda (*Tool Calling*):** En lugar de enviar todos los libros completos en cada pregunta (lo que sería lento y costoso), la IA primero revisa el índice. Si la pregunta requiere detalles del manual de compostaje, la IA "abre el archivo específico", lee lo necesario y responde citando la fuente.
3. **Cálculo de Costos en Vivo:** Por cada respuesta, el sistema cuenta los tokens (palabras/caracteres) y calcula el valor exacto según las tarifas oficiales de Google Gemini.

---

## ✨ Características Principales

| Característica | Descripción |
| :--- | :--- |
| 💬 **Chatbot Ciudadano Guiado** | Respuestas precisas sobre contenedores naranja/verde, RAEE (informáticos), aceites usados y compostaje. |
| 📚 **Gestor Multimodal de Fuentes** | Permite agregar PDFs, enlaces web oficiales (con extractor automático de texto) o notas personalizadas. |
| 🔍 **Inspector de Trazas de API** | Panel interactivo para auditar el JSON exacto de envío y respuesta hacia Google Gemini. |
| 💰 **Calculadora de Costos en Tiempo Real** | Resumen detallado de costo acumulado y costo por consulta en fracciones de centavo de dólar. |
| 🤖 **Selector de Modelos Gemini** | Compatible con `Gemini 3.5 Flash Lite`, `Gemini 3.5 Flash`, `Gemini 3.8 Flash`, `Gemini 3.7 Flash`, `Gemini 3.1 Pro`, etc. |
| 🛡️ **Sistema de Resiliencia Automática** | Reintentos automáticos y conmutación por saturación de demanda para garantizar que nunca se caiga la atención. |
| ⚙️ **Editor de Prompt de Sistema** | Permite modificar el tono, las reglas de aislamiento de fuentes y la temperatura del modelo desde la propia interfaz. |

---

## 🚀 Guía de Despliegue Paso a Paso (Para Principiantes)

No necesitas ser un programador experto para poner a funcionar este proyecto en tu propia computadora o en un servidor en la nube. Sigue estos sencillos pasos:

### 🔑 Paso 1: Obtener tu API Key gratuita de Google Gemini

1. Entra en [Google AI Studio](https://aistudio.google.com/).
2. Inicia sesión con cualquier cuenta de Google (Gmail).
3. Haz clic en el botón azul **"Get API key"** (Obtener clave de API).
4. Selecciona **"Create API key"** y copia la clave generada (se verá como una cadena de letras y números tipo `AIzaSy...`).

---

### 💻 Paso 2: Ejecutar en tu Computadora (Local)

#### Requisitos previos mínimos:
- Tener instalado **Node.js** (versión 18 o superior). Puedes descargarlo gratis desde [nodejs.org](https://nodejs.org/).
- Una terminal (Símbolo del sistema / PowerShell en Windows, o Terminal en Mac / Linux).

#### Instrucciones paso a paso:

1. **Descarga o clona este repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/ecolabs.git
   cd ecolabs
   ```

2. **Instala las dependencias necesarias:**
   *(Esto descargará los paquetes necesarios para que la aplicación funcione).*
   ```bash
   npm install
   ```

3. **Configura tu clave de API:**
   Copia el archivo de ejemplo `.env.example` y renómbralo a `.env`:
   ```bash
   cp .env.example .env
   ```
   Abre el archivo `.env` con cualquier editor de texto (como el Bloc de notas o VS Code) y pega tu clave:
   ```env
   GEMINI_API_KEY=AIzaSyTuClaveDeApiAqui
   PORT=3000
   ```

4. **Inicia la aplicación:**
   ```bash
   npm run dev
   ```

5. **¡Listo!** Abre tu navegador web (Chrome, Edge, Safari o Firefox) e ingresa a:
   👉 **`http://localhost:3000`**

---

### ☁️ Paso 3: Desplegar en la Nube (Opciones recomendadas)

Si deseas que cualquier persona en internet pueda usar tu EcoLabs, puedes subirlo a un servicio en la nube:

#### Opción A: Google Cloud Run / Google AI Studio
- El proyecto ya está preparado con arquitectura full-stack integrada (`server.ts` con Express y Vite).
- Se conecta de manera nativa con las variables de entorno `GEMINI_API_KEY` y `PORT`.
- El comando de inicio para producción es:
  ```bash
  npm run build
  npm start
  ```

#### Opción B: Render / Railway / Fly.io / VPS
1. Crea un nuevo **Web Service** y conecta tu repositorio de GitHub.
2. **Build Command (Comando de construcción):** `npm install && npm run build`
3. **Start Command (Comando de inicio):** `npm start`
4. En la sección de **Variables de Entorno (Environment Variables)** agrega:
   - `GEMINI_API_KEY` = *Tu clave de Gemini*
   - `NODE_ENV` = `production`
   - `PORT` = `3000` (o el asignado por la plataforma)

---

## 📂 Estructura del Proyecto

Para que puedas ubicarte fácilmente en los archivos:

```text
├── server.ts                  # Servidor backend (Express): gestión de llamadas a Gemini, scraping de URLs y cálculo de costos.
├── index.html                 # Página HTML principal.
├── package.json               # Configuración de dependencias y comandos de ejecución.
├── src/
│   ├── App.tsx                # Componente principal que coordina chat, fuentes e inspector.
│   ├── main.tsx               # Punto de entrada de React.
│   ├── types.ts               # Definiciones de datos (mensajes, trazas, fuentes, costos).
│   ├── data/
│   │   └── defaultSources.ts  # Fuentes oficiales predeterminadas (PDF de compostaje, residuos informáticos, etc.).
│   └── components/
│       ├── ChatInterface.tsx      # Ventana de conversación con el chatbot y sugerencias rápidas.
│       ├── ApiTraceInspector.tsx  # Visor interactivo de auditoría de llamadas y payloads.
│       ├── CostSummaryView.tsx    # Métricas de consumo y desglose de costos.
│       ├── SourcesManager.tsx     # Panel para subir PDFs, textos o consultar URLs.
│       ├── SystemPromptEditor.tsx # Editor del rol e instrucciones del asistente.
│       └── Header.tsx             # Barra superior con estado del servidor y selección de modelo.
```

---

## ❓ Preguntas Frecuentes (FAQ)

### 1. ¿Puedo usar este proyecto para otra ciudad, empresa o temática?
**¡Sí!** La arquitectura está diseñada para ser completamente adaptable. Solo tienes que ir a la pestaña **"Fuentes de Información"** y cargar los PDFs, textos o URLs de tu propio municipio o empresa, y luego ajustar el **"Prompt del Sistema"** con el nombre de tu asistente.

### 2. ¿Cuánto dinero cuesta utilizar Gemini en este chatbot?
Los modelos Flash de Gemini (como `Gemini 3.5 Flash Lite`) son extremadamente económicos: procesar unas 1.000 preguntas ciudadanas suele costar **menos de $0.05 USD** (fracciones mínimas de centavos). Puedes ver el costo acumulado en tiempo real en la pestaña **"Costos"**.

### 3. ¿Por qué el asistente responde que no tiene la información en vez de adivinar?
Para evitar "alucinaciones" (respuestas inventadas), el asistente tiene una regla estricta: si un dato no está en las fuentes oficiales cargadas, te invitará a consultar las líneas de atención oficiales en lugar de inventar una respuesta.

### 4. ¿Puedo utilizar mi propia clave de API directamente desde la pantalla?
Sí. En la esquina superior derecha encontrarás un botón para introducir tu propia Gemini API Key si no deseas configurar archivos en el servidor.

---

## 📄 Licencia

Este proyecto se distribuye bajo fines educativos, cívicos y de desarrollo tecnológico sustentable. ¡Siéntete libre de adaptarlo y desplegarlo en tu comunidad! 🧪🌱✨
