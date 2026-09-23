import React, { useState } from 'react';
import { ApiTrace, ChatMessage, ModelOption } from '../types';
import {
  Terminal,
  Activity,
  DollarSign,
  Cpu,
  Copy,
  Check,
  FileCode,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
  Database,
  Clock,
  Zap,
} from 'lucide-react';

interface ApiTraceInspectorProps {
  messages: ChatMessage[];
  selectedTraceId?: string;
  onSelectTraceId: (traceId: string) => void;
  models: ModelOption[];
}

export const ApiTraceInspector: React.FC<ApiTraceInspectorProps> = ({
  messages,
  selectedTraceId,
  onSelectTraceId,
  models,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'diagram' | 'request' | 'response' | 'cost'>('diagram');
  const [copied, setCopied] = useState<string | null>(null);

  // Filter messages that have traces
  const traceMessages = messages.filter((m) => m.trace);

  // Find the selected trace or fallback to the latest
  const currentMsg = selectedTraceId
    ? traceMessages.find((m) => m.trace?.id === selectedTraceId) || traceMessages[traceMessages.length - 1]
    : traceMessages[traceMessages.length - 1];

  const trace: ApiTrace | undefined = currentMsg?.trace;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!trace) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 border border-slate-700">
          <Terminal className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">No hay registros de llamadas a la API aún</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Envía una pregunta en la pestaña <strong>Chatbot Asistente</strong> para registrar la trazabilidad completa del payload enviado y recibido.
        </p>
      </div>
    );
  }

  const modelInfo = models.find((m) => m.id === trace.model) || models[0];
  const usage = trace.response.usageMetadata;
  const promptTokens = usage.promptTokenCount || 0;
  const candidateTokens = usage.candidatesTokenCount || 0;
  const totalTokens = usage.totalTokenCount || (promptTokens + candidateTokens);

  const inputCost = (promptTokens / 1_000_000) * modelInfo.inputPrice1M;
  const outputCost = (candidateTokens / 1_000_000) * modelInfo.outputPrice1M;
  const totalCost = inputCost + outputCost;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Selector & Summary */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Terminal className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Inspector de Trazabilidad y Consumo de la API
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Visualiza con fines educativos exactamente qué datos, documentos y parámetros viajan hacia Google Gemini en cada turno.
            </p>
          </div>

          {/* Trace Selector Dropdown if multiple queries exist */}
          {traceMessages.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Consulta a inspeccionar:</span>
              <select
                value={trace.id}
                onChange={(e) => onSelectTraceId(e.target.value)}
                aria-label="Seleccionar consulta a inspeccionar"
                className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {traceMessages.map((msg, idx) => (
                  <option key={msg.trace!.id} value={msg.trace!.id}>
                    #{idx + 1}: {msg.content.substring(0, 35)}... ({msg.trace!.latencyMs}ms)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modelo Utilizado</span>
            </div>
            <div className="text-sm font-bold text-white truncate">{trace.model}</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Latencia Inferencia</span>
            </div>
            <div className="text-sm font-bold text-cyan-300">{trace.latencyMs} ms</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Tokens Totales</span>
            </div>
            <div className="text-sm font-bold text-amber-300">
              {totalTokens.toLocaleString()}
              <span className="text-[10px] text-slate-400 font-normal ml-1">
                ({promptTokens} in / {candidateTokens} out)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Coste Estimado</span>
            </div>
            <div className="text-sm font-bold text-emerald-300">
              ${totalCost.toFixed(6)} USD
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 border-t border-slate-800 pt-3">
          <button
            onClick={() => setActiveSubTab('diagram')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'diagram'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📊 Diagrama Explicativo del Flujo
          </button>
          <button
            onClick={() => setActiveSubTab('request')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'request'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📤 Request Payload (Enviado a Gemini)
          </button>
          <button
            onClick={() => setActiveSubTab('response')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'response'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📥 Response Payload (Recibido de Gemini)
          </button>
          <button
            onClick={() => setActiveSubTab('cost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'cost'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            💰 Desglose Matemático de Costes
          </button>
        </div>
      </div>

      {/* SUBTAB 1: DIAGRAM */}
      {activeSubTab === 'diagram' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              ¿Cómo funciona simplificadamente este Chatbot RAG Multimodal?
            </h3>

            {/* Architecture Steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Step 1 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
                  1
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Pregunta del Usuario
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  El usuario escribe su consulta en lenguaje natural sobre reciclaje o residuos.
                </p>
                <div className="text-[11px] bg-slate-900 p-2 rounded border border-slate-800 text-slate-300 font-mono">
                  &ldquo;{currentMsg?.content.substring(0, 45)}...&rdquo;
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold border border-cyan-500/30">
                  2
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Inyección de Fuentes
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Se adjuntan los documentos activos. Los PDFs se adjuntan como <strong>inlineData multimodal</strong> y los textos como bloques delimitados.
                </p>
                <div className="text-[11px] bg-slate-900 p-2 rounded border border-slate-800 text-cyan-300">
                  {trace.request.sourcesAttached.length} fuentes adjuntas ({promptTokens} tokens de entrada)
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold border border-amber-500/30">
                  3
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  System Prompt & Guardrails
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  El servidor configura las reglas de aislamiento estricto para impedir alucinaciones y forzar respuestas solo basadas en los documentos.
                </p>
                <div className="text-[11px] bg-slate-900 p-2 rounded border border-slate-800 text-amber-300">
                  Aislamiento estricto activado
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/30">
                  4
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Inferencia & Tokens
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gemini procesa el prompt completo y genera la respuesta citando la fuente. Se registran tokens y costes.
                </p>
                <div className="text-[11px] bg-slate-900 p-2 rounded border border-slate-800 text-purple-300">
                  {candidateTokens} tokens generados (${totalCost.toFixed(6)})
                </div>
              </div>
            </div>

            {/* Multimodal explanation box */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                <FileCode className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-200">
                  ¿Por qué procesar PDFs con la capacidad Multimodal de Gemini?
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  A diferencia de un extractor de texto tradicional que pierde tablas, gráficos y diseño, Gemini analiza visual y semánticamente el archivo PDF completo en su formato original (<code className="text-emerald-400 font-mono">application/pdf</code>), permitiendo responder preguntas complejas sobre ordenanzas, diagramas o resoluciones municipales.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: REQUEST PAYLOAD */}
      {activeSubTab === 'request' && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                POST https://generativelanguage.googleapis.com/v1beta/models/{trace.model}:generateContent
              </h3>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(trace.request, null, 2), 'request')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors"
            >
              {copied === 'request' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar JSON
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-[500px]">
            <pre className="text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(trace.request, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* SUBTAB 3: RESPONSE PAYLOAD */}
      {activeSubTab === 'response' && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                GenerateContentResponse (HTTP 200 OK)
              </h3>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(trace.response, null, 2), 'response')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors"
            >
              {copied === 'response' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyan-400" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar JSON
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-[500px]">
            <pre className="text-xs font-mono text-cyan-300 leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(trace.response, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* SUBTAB 4: COST BREAKDOWN */}
      {activeSubTab === 'cost' && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Cálculo Matemático del Consumo de Recursos en Tiempo Real
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Input Tokens Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tokens de Entrada (Prompt)
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {promptTokens.toLocaleString()} <span className="text-xs text-slate-400 font-normal">tokens</span>
              </div>
              <div className="text-xs text-slate-400">
                Tarifa: ${modelInfo.inputPrice1M} USD por 1M tokens
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs font-mono text-emerald-400 font-bold">
                Coste = ${inputCost.toFixed(6)} USD
              </div>
            </div>

            {/* Output Tokens Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tokens de Salida (Respuesta)
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {candidateTokens.toLocaleString()} <span className="text-xs text-slate-400 font-normal">tokens</span>
              </div>
              <div className="text-xs text-slate-400">
                Tarifa: ${modelInfo.outputPrice1M} USD por 1M tokens
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs font-mono text-emerald-400 font-bold">
                Coste = ${outputCost.toFixed(6)} USD
              </div>
            </div>

            {/* Total Cost Card */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/40 rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Coste Total de la Consulta
              </div>
              <div className="text-2xl font-bold text-emerald-300 font-mono">
                ${totalCost.toFixed(6)} USD
              </div>
              <div className="text-xs text-slate-400">
                Total acumulado en este turno
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                ≈ {(totalCost * 100).toFixed(4)} centavos de USD
              </div>
            </div>
          </div>

          {/* Formula breakdown */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
            <div className="text-emerald-400 font-bold font-sans text-xs">Fórmula de cálculo aplicada:</div>
            <div>
              Coste_Entrada = ({promptTokens.toLocaleString()} / 1.000.000) × ${modelInfo.inputPrice1M} = ${inputCost.toFixed(6)} USD
            </div>
            <div>
              Coste_Salida = ({candidateTokens.toLocaleString()} / 1.000.000) × ${modelInfo.outputPrice1M} = ${outputCost.toFixed(6)} USD
            </div>
            <div className="pt-1 text-white font-bold">
              Total = ${inputCost.toFixed(6)} + ${outputCost.toFixed(6)} = ${totalCost.toFixed(6)} USD
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
