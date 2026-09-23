import React, { useState } from 'react';
import { ModelOption, ChatMessage } from '../types';
import { DollarSign, Activity, Cpu, Calculator, ArrowUpRight, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface CostSummaryViewProps {
  messages: ChatMessage[];
  models: ModelOption[];
  sessionCost: number;
  sessionTokens: { prompt: number; candidates: number; total: number };
  currentModel: string;
}

export const CostSummaryView: React.FC<CostSummaryViewProps> = ({
  messages,
  models,
  sessionCost,
  sessionTokens,
  currentModel,
}) => {
  // Simulator state
  const [simPromptTokens, setSimPromptTokens] = useState<number>(3500);
  const [simOutputTokens, setSimOutputTokens] = useState<number>(450);
  const [simQueries, setSimQueries] = useState<number>(1000);

  const currentModelObj = models.find((m) => m.id === currentModel) || models[0];

  const traceMessages = messages.filter((m) => m.trace);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Session Hero Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <DollarSign className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Consumo y Costes en Tiempo Real
              </h2>
            </div>
            <p className="text-sm text-slate-300">
              Seguimiento transparente de recursos y tokens consumidos en esta sesión de trabajo.
            </p>
          </div>
        </div>

        {/* Big Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Gasto Total Acumulado
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              ${sessionCost.toFixed(5)} <span className="text-sm font-normal text-slate-400">USD</span>
            </div>
            <p className="text-xs text-slate-400">
              En {traceMessages.length} consulta{traceMessages.length === 1 ? '' : 's'} realizadas
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tokens de Entrada / Salida
            </span>
            <div className="text-3xl font-extrabold text-white font-mono">
              {sessionTokens.total.toLocaleString()} <span className="text-sm font-normal text-slate-400">tok</span>
            </div>
            <p className="text-xs text-slate-400">
              {sessionTokens.prompt.toLocaleString()} entrada · {sessionTokens.candidates.toLocaleString()} salida
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Coste Promedio por Consulta
            </span>
            <div className="text-3xl font-extrabold text-cyan-400 font-mono">
              ${traceMessages.length > 0 ? (sessionCost / traceMessages.length).toFixed(6) : '0.000000'} <span className="text-sm font-normal text-slate-400">USD</span>
            </div>
            <p className="text-xs text-slate-400">
              Con modelo {currentModelObj.name}
            </p>
          </div>
        </div>
      </div>

      {/* Model Pricing Table Comparison */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          Tabla Comparativa Oficial de Precios Gemini
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Modelo</th>
                <th className="py-3 px-4">Entrada (Input / 1M tokens)</th>
                <th className="py-3 px-4">Salida (Output / 1M tokens)</th>
                <th className="py-3 px-4">Ventana Contexto</th>
                <th className="py-3 px-4">Recomendación de Uso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {models.map((m) => (
                <tr
                  key={m.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    m.id === currentModel ? 'bg-emerald-500/5 font-semibold text-white' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 flex items-center gap-2">
                    <span className="font-bold">{m.name}</span>
                    {m.id === currentModel && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-400">${m.inputPrice1M.toFixed(3)} USD</td>
                  <td className="py-3.5 px-4 font-mono text-cyan-400">${m.outputPrice1M.toFixed(3)} USD</td>
                  <td className="py-3.5 px-4">{m.contextWindow}</td>
                  <td className="py-3.5 px-4 text-slate-400">{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Cost Simulator for Scale Estimation */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">
            Simulador de Costes a Escala (Estimación para Ciudades y Empresas)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Calcula cuánto costaría implementar este chatbot atendiendo a miles de ciudadanos en tu municipio con diferentes modelos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              Tokens entrada por consulta (promedio):
            </label>
            <input
              type="number"
              value={simPromptTokens}
              onChange={(e) => setSimPromptTokens(Math.max(10, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500">Incluye PDFs de normativas + pregunta</span>
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              Tokens salida por respuesta (promedio):
            </label>
            <input
              type="number"
              value={simOutputTokens}
              onChange={(e) => setSimOutputTokens(Math.max(10, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500">Respuesta explicativa detallada</span>
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              Volumen de consultas mensuales:
            </label>
            <input
              type="number"
              value={simQueries}
              onChange={(e) => setSimQueries(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500">Consultas de vecinos / mes</span>
          </div>
        </div>

        {/* Simulator Results Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {models.map((m) => {
            const queryInputCost = (simPromptTokens / 1_000_000) * m.inputPrice1M;
            const queryOutputCost = (simOutputTokens / 1_000_000) * m.outputPrice1M;
            const singleCost = queryInputCost + queryOutputCost;
            const totalMonthly = singleCost * simQueries;

            return (
              <div
                key={m.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{m.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                    {m.tag}
                  </span>
                </div>
                <div className="text-xl font-bold text-emerald-400 font-mono pt-1">
                  ${totalMonthly.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USD/mes</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ${singleCost.toFixed(6)} USD por consulta
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
