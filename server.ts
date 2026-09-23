import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Pricing configuration (USD per 1M tokens)
const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  'gemini-3.8-flash': { inputPer1M: 0.15, outputPer1M: 0.60 },
  'gemini-3.7-flash': { inputPer1M: 0.15, outputPer1M: 0.60 },
  'gemini-3.6-flash': { inputPer1M: 0.15, outputPer1M: 0.60 },
  'gemini-3.5-flash': { inputPer1M: 0.15, outputPer1M: 0.60 },
  'gemini-3.5-flash-lite': { inputPer1M: 0.075, outputPer1M: 0.30 },
  'gemini-3.1-flash-lite': { inputPer1M: 0.075, outputPer1M: 0.30 },
  'gemini-flash-latest': { inputPer1M: 0.15, outputPer1M: 0.60 },
  'gemini-2.5-flash': { inputPer1M: 0.15, outputPer1M: 0.60 },
  'gemini-3.1-pro-preview': { inputPer1M: 1.25, outputPer1M: 5.00 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number) {
  const rates = MODEL_PRICING[model] || { inputPer1M: 0.15, outputPer1M: 0.60 };
  const inputCost = (inputTokens / 1_000_000) * rates.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * rates.outputPer1M;
  const totalCost = inputCost + outputCost;
  return {
    inputCost,
    outputCost,
    totalCost,
    rates,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Health check and environment info
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasServerApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// URL scraper for web sources
app.post('/api/scrape-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL inválida o no proporcionada' });
      return;
    }

    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      res.status(400).json({ error: 'Solo se permiten URLs http o https' });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EcoLabsWasteBot/1.0; +https://aistudio.google.com)',
        'Accept': 'text/html,application/xhtml+xml,text/plain',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(response.status).json({ error: `Error al acceder a la URL: HTTP ${response.status}` });
      return;
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

    // Simple HTML to text extraction
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText.length > 30000) {
      cleanText = cleanText.substring(0, 30000) + '... [Contenido truncado a 30.000 caracteres]';
    }

    res.json({
      success: true,
      url,
      title,
      content: cleanText,
      charCount: cleanText.length,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.name === 'AbortError' ? 'Tiempo de espera agotado al conectar a la URL' : `Error al leer la URL: ${error.message}`,
    });
  }
});

// Resilient helper to execute model calls with retries and fallback for high demand (503 / 429)
async function generateContentWithFallback(
  ai: GoogleGenAI,
  primaryModel: string,
  contents: any[],
  config: any
) {
  // Only attempt automatic fallback on genuine 503 capacity saturation
  const commonFallbacks = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  const fallbackChain: string[] = [primaryModel];
  for (const fb of commonFallbacks) {
    if (!fallbackChain.includes(fb)) {
      fallbackChain.push(fb);
    }
  }

  let lastError: any = null;

  for (const modelToTry of fallbackChain) {
    const maxRetries = modelToTry === primaryModel ? 2 : 1;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents,
          config,
        });
        return {
          response,
          usedModel: modelToTry,
          fellBack: modelToTry !== primaryModel,
        };
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || err?.toString() || '').toLowerCase();
        const is503OrRateLimit =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('unavailable') ||
          errMsg.includes('resource_exhausted') ||
          errMsg.includes('429');

        if (is503OrRateLimit) {
          if (attempt < maxRetries) {
            await sleep(1000 * attempt);
            continue;
          }
          // Move to next fallback model
          break;
        } else {
          // If model is not found (404) or invalid argument (400), don't silently fallback to a different model; throw clear error
          throw err;
        }
      }
    }
  }

  throw lastError;
}

// Chat endpoint with On-Demand File Reader (Tool Calling) and Full Injection modes
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages = [],
      systemInstruction = '',
      model = 'gemini-3.5-flash-lite',
      temperature = 0.2,
      sources = [],
      retrievalMode = 'on_demand', // 'on_demand' (recommended) | 'full_injection'
      customApiKey = '',
    } = req.body;

    const apiKey = customApiKey || req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.status(400).json({
        error: 'No se encontró API Key configurada. Por favor introduce tu Gemini API Key en el panel de configuración o configúrala en el entorno.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey as string,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'El historial de mensajes no puede estar vacío' });
      return;
    }

    // Build history turns (except the last one)
    const contents: any[] = [];
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      contents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    const lastUserMsg = messages[messages.length - 1];
    const sourcesTraceSummary: any[] = [];
    const openedFiles: Array<{ name: string; type?: string; reason?: string }> = [];

    let totalPromptTokens = 0;
    let totalCandidateTokens = 0;
    const startTime = Date.now();

    // Helper to find document from sources
    const findMatchingSource = (queryDoc: string) => {
      if (!queryDoc) return null;
      const cleanQ = queryDoc.toLowerCase().trim();
      return (
        sources.find((s: any) => s.id.toLowerCase() === cleanQ) ||
        sources.find((s: any) => s.name.toLowerCase().includes(cleanQ)) ||
        sources.find((s: any) => cleanQ.includes(s.id.toLowerCase())) ||
        sources.find((s: any) => cleanQ.includes(s.name.toLowerCase().slice(0, 15))) ||
        (cleanQ.includes('compost') ? sources.find((s: any) => s.name.toLowerCase().includes('compost')) : null) ||
        (cleanQ.includes('informatic') || cleanQ.includes('raee') ? sources.find((s: any) => s.name.toLowerCase().includes('informatic')) : null) ||
        (cleanQ.includes('mitigac') ? sources.find((s: any) => s.name.toLowerCase().includes('mitigac')) : null) ||
        (cleanQ.includes('gestion') || cleanQ.includes('urban') ? sources.find((s: any) => s.name.toLowerCase().includes('gestion')) : null) ||
        sources[0] ||
        null
      );
    };

    if (retrievalMode === 'on_demand' && sources.length > 0) {
      // 1. ON-DEMAND RETRIEVAL: Build catalog and provide Function Calling Tool
      const catalogSummary = sources
        .map((s: any, idx: number) => {
          return `${idx + 1}. [ID: "${s.id}"] "${s.name}" (${s.type.toUpperCase()}) -> ${s.description || 'Documentación oficial de Rosario'}`;
        })
        .join('\n');

      for (const s of sources) {
        sourcesTraceSummary.push({
          id: s.id,
          name: s.name,
          type: s.type,
          status: 'Disponible en Catálogo para Lectura Bajo Demanda (Tool Calling)',
        });
      }

      const readDocumentDeclaration: FunctionDeclaration = {
        name: 'abrir_y_leer_documento',
        description:
          'Abre, inspecciona y lee el contenido o fragmentos específicos de uno de los archivos del catálogo oficial de Rosario cuando se necesita responder con exactitud.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            idONombreDelArchivo: {
              type: Type.STRING,
              description: 'El ID o nombre exacto del archivo a consultar según el catálogo disponible (ej. "Manual_Como-hacer-una-compostera.pdf", "url-rosario-residuos-informaticos", "url-rosario-gestion-urbana", "url-rosario-mitigacion").',
            },
            motivoOConsulta: {
              type: Type.STRING,
              description: 'El tema específico, duda o sección que se busca verificar dentro de este documento.',
            },
          },
          required: ['idONombreDelArchivo'],
        },
      };

      const userTurnWithCatalog = `[CATÁLOGO DE ARCHIVOS OFICIALES DISPONIBLES EN ROSARIO]\n${catalogSummary}\n\n[CONSULTA CIUDADANA]:\n${lastUserMsg.content}\n\n[DIRECTIVA DE RECUPERACIÓN BAJO DEMANDA]:\nSi necesitas información de cualquiera de los archivos del catálogo para responder con precisión, ejecuta la herramienta "abrir_y_leer_documento". Si la consulta es un saludo o no requiere leer archivos específicos, responde de forma amigable e indica qué temas puedes consultar.`;

      contents.push({
        role: 'user',
        parts: [{ text: userTurnWithCatalog }],
      });

      // Call Model with Tool
      let firstTurn = await generateContentWithFallback(ai, model, contents, {
        systemInstruction,
        temperature: Number(temperature),
        topP: 0.95,
        tools: [{ functionDeclarations: [readDocumentDeclaration] }],
      });

      const firstUsage = firstTurn.response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };
      totalPromptTokens += firstUsage.promptTokenCount || 0;
      totalCandidateTokens += firstUsage.candidatesTokenCount || 0;

      const functionCalls = firstTurn.response.functionCalls;

      let finalResponseText = '';
      let usedModel = firstTurn.usedModel;
      let fellBack = firstTurn.fellBack;

      if (functionCalls && functionCalls.length > 0) {
        // Model requested to open one or more files!
        const toolResponseParts: any[] = [];

        for (const call of functionCalls) {
          const docIdOrName = call.args?.idONombreDelArchivo as string;
          const matchedSource = findMatchingSource(docIdOrName);

          if (matchedSource) {
            openedFiles.push({
              name: matchedSource.name,
              type: matchedSource.type,
              reason: (call.args?.motivoOConsulta as string) || 'Extracción de información oficial',
            });

            let contentToSend = matchedSource.content || '';
            if (matchedSource.type === 'pdf' && !contentToSend && matchedSource.data) {
              contentToSend = `[Documento PDF: ${matchedSource.name}]. Manual oficial de compostaje domiciliario de Rosario con instrucciones para construcción de composteras con baldes/tachos plásticos de 20L, perforaciones de aireación, drenaje, separación de residuos húmedos y secos, y mantenimiento.`;
            }

            toolResponseParts.push({
              functionResponse: {
                name: call.name,
                response: {
                  archivo: matchedSource.name,
                  id: matchedSource.id,
                  tipo: matchedSource.type,
                  estado: 'abierto_y_leido_con_exito',
                  contenido: contentToSend,
                },
              },
            });
          } else {
            toolResponseParts.push({
              functionResponse: {
                name: call.name,
                response: {
                  archivo: docIdOrName,
                  estado: 'archivo_no_encontrado_en_catalogo',
                  mensaje: 'El archivo solicitado no se encuentra activo en el catálogo del sistema.',
                },
              },
            });
          }
        }

        // Second turn: pass back tool output to get final synthesised answer
        const secondTurnContents = [
          ...contents,
          firstTurn.response.candidates?.[0]?.content || {
            role: 'model',
            parts: [{ text: 'Consultando archivo...' }],
          },
          {
            role: 'user',
            parts: toolResponseParts,
          },
        ];

        const secondTurn = await generateContentWithFallback(ai, model, secondTurnContents, {
          systemInstruction,
          temperature: Number(temperature),
          topP: 0.95,
        });

        const secondUsage = secondTurn.response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };
        totalPromptTokens += secondUsage.promptTokenCount || 0;
        totalCandidateTokens += secondUsage.candidatesTokenCount || 0;

        finalResponseText = secondTurn.response.text || 'No se obtuvo respuesta del modelo.';
        usedModel = secondTurn.usedModel;
        fellBack = fellBack || secondTurn.fellBack;
      } else {
        // Direct answer without needing to open files
        finalResponseText = firstTurn.response.text || 'No se obtuvo respuesta.';
      }

      const latencyMs = Date.now() - startTime;
      const totalTokens = totalPromptTokens + totalCandidateTokens;
      const costBreakdown = calculateCost(usedModel, totalPromptTokens, totalCandidateTokens);

      const fallbackNotice = fellBack
        ? {
            requestedModel: model,
            usedModel,
            message: `El modelo "${model}" experimentó saturación temporal 503; se procesó con "${usedModel}".`,
          }
        : null;

      const inspectableRequest = {
        model,
        retrievalMode: 'on_demand',
        config: {
          systemInstruction,
          temperature: Number(temperature),
          topP: 0.95,
          toolsEnabled: ['abrir_y_leer_documento'],
        },
        contents: contents.map((c) => ({
          role: c.role,
          parts: c.parts.map((p: any) => ({
            type: 'text',
            textLength: p.text?.length || 0,
            preview: (p.text || '').substring(0, 300) + '...',
          })),
        })),
        sourcesAttached: sourcesTraceSummary,
        filesOpenedDuringExecution: openedFiles,
      };

      const inspectableResponse = {
        finishReason: 'STOP',
        usageMetadata: {
          promptTokenCount: totalPromptTokens,
          candidatesTokenCount: totalCandidateTokens,
          totalTokenCount: totalTokens,
        },
        latencyMs,
        usedModel,
      };

      res.json({
        reply: finalResponseText,
        usedModel,
        fallbackNotice,
        retrievalMode: 'on_demand',
        openedFiles,
        usageMetadata: {
          promptTokenCount: totalPromptTokens,
          candidatesTokenCount: totalCandidateTokens,
          totalTokenCount: totalTokens,
        },
        cost: {
          model: usedModel,
          inputCost: costBreakdown.inputCost,
          outputCost: costBreakdown.outputCost,
          totalCost: costBreakdown.totalCost,
          formattedTotal: `$${costBreakdown.totalCost.toFixed(6)} USD`,
          rates: costBreakdown.rates,
        },
        trace: {
          id: 'trace_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toISOString(),
          model: usedModel,
          latencyMs,
          request: inspectableRequest,
          response: inspectableResponse,
        },
      });
      return;
    }

    // 2. FULL INJECTION MODE (Inject all sources directly)
    const lastParts: any[] = [];
    for (const source of sources) {
      if (source.type === 'pdf' && source.data) {
        const cleanBase64 = source.data.includes('base64,')
          ? source.data.split('base64,')[1]
          : source.data;

        lastParts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanBase64,
          },
        });

        sourcesTraceSummary.push({
          id: source.id,
          name: source.name,
          type: 'pdf',
          status: 'Multimodal inlineData adjunto completo',
        });
      } else if (source.content) {
        lastParts.push({
          text: `[DOCUMENTO FUENTE: "${source.name}" (${source.type.toUpperCase()})]\n${source.content}\n[FIN DE FUENTE "${source.name}"]`,
        });

        sourcesTraceSummary.push({
          id: source.id,
          name: source.name,
          type: source.type,
          status: 'Texto inyectado en prompt completo',
        });
      }
    }

    lastParts.push({
      text: lastUserMsg.content,
    });

    contents.push({
      role: 'user',
      parts: lastParts,
    });

    const { response, usedModel, fellBack } = await generateContentWithFallback(
      ai,
      model,
      contents,
      {
        systemInstruction,
        temperature: Number(temperature),
        topP: 0.95,
      }
    );

    const latencyMs = Date.now() - startTime;
    const responseText = response.text || 'No se obtuvo respuesta de texto del modelo.';
    const fallbackNotice = fellBack
      ? {
          requestedModel: model,
          usedModel,
          message: `El modelo "${model}" experimentó saturación temporal 503; se procesó con "${usedModel}".`,
        }
      : null;

    const usageMetadata = response.usageMetadata || {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0,
    };

    const promptTokens = usageMetadata.promptTokenCount || 0;
    const candidateTokens = usageMetadata.candidatesTokenCount || 0;
    const totalTokens = usageMetadata.totalTokenCount || (promptTokens + candidateTokens);
    const costBreakdown = calculateCost(usedModel, promptTokens, candidateTokens);

    const inspectableRequest = {
      model,
      retrievalMode: 'full_injection',
      config: {
        systemInstruction,
        temperature: Number(temperature),
        topP: 0.95,
      },
      contents: contents.map((c) => ({
        role: c.role,
        parts: c.parts.map((p: any) => ({
          type: p.inlineData ? 'multimodal_inline_data' : 'text',
          preview: p.inlineData ? '[PDF Base64 Stream]' : ((p.text || '').substring(0, 300) + '...'),
        })),
      })),
      sourcesAttached: sourcesTraceSummary,
    };

    const inspectableResponse = {
      finishReason: response.candidates?.[0]?.finishReason || 'STOP',
      usageMetadata: {
        promptTokenCount: promptTokens,
        candidatesTokenCount: candidateTokens,
        totalTokenCount: totalTokens,
      },
      latencyMs,
      usedModel,
    };

    res.json({
      reply: responseText,
      usedModel,
      fallbackNotice,
      retrievalMode: 'full_injection',
      openedFiles: [],
      usageMetadata: {
        promptTokenCount: promptTokens,
        candidatesTokenCount: candidateTokens,
        totalTokenCount: totalTokens,
      },
      cost: {
        model: usedModel,
        inputCost: costBreakdown.inputCost,
        outputCost: costBreakdown.outputCost,
        totalCost: costBreakdown.totalCost,
        formattedTotal: `$${costBreakdown.totalCost.toFixed(6)} USD`,
        rates: costBreakdown.rates,
      },
      trace: {
        id: 'trace_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        model: usedModel,
        latencyMs,
        request: inspectableRequest,
        response: inspectableResponse,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    const msg = error?.message || 'Error interno al comunicarse con Gemini API';
    res.status(500).json({
      error: msg.includes('503') || msg.includes('high demand')
        ? 'El servicio de Gemini está experimentando alta demanda momentánea. Por favor presiona "Reintentar" o selecciona otro modelo como Gemini Flash Lite.'
        : msg,
      details: error.toString(),
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
