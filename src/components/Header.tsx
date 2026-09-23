import React from 'react';
import { ModelId, ModelOption, CostCalculation } from '../types';
import { Sparkles, Key, FileText, Activity, Terminal, RefreshCw, Cpu, DollarSign, BookOpen } from 'lucide-react';

interface HeaderProps {
  currentModel: ModelId;
  onModelChange: (model: ModelId) => void;
  models: ModelOption[];
  activeTab: 'chat' | 'sources' | 'prompt' | 'trace' | 'cost';
  onTabChange: (tab: 'chat' | 'sources' | 'prompt' | 'trace' | 'cost') => void;
  hasCustomKey: boolean;
  onOpenKeyModal: () => void;
  sessionCost: number;
  sessionTokens: { prompt: number; candidates: number; total: number };
  activeSourcesCount: number;
  totalSourcesCount: number;
  onResetChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModel,
  onModelChange,
  models,
  activeTab,
  onTabChange,
  hasCustomKey,
  onOpenKeyModal,
  sessionCost,
  sessionTokens,
  activeSourcesCount,
  totalSourcesCount,
  onResetChat,
}) => {
  const selectedModelObj = models.find((m) => m.id === currentModel) || models[0];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      {/* Top Banner with App Brand & Session Counters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
            <Sparkles className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                EcoLabs
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  RAG & Multimodal
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Gestión de Residuos Urbanos · Respuestas Aisladas a Fuentes · Trazabilidad de API
            </p>
          </div>
        </div>

        {/* Model Selector, Key & Real-time Metrics */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Model Selector Dropdown */}
          <div className="relative flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg p-1">
            <Cpu className="w-4 h-4 text-emerald-400 ml-2 mr-1.5 shrink-0" />
            <select
              value={currentModel}
              onChange={(e) => onModelChange(e.target.value as ModelId)}
              aria-label="Seleccionar modelo de IA"
              className="bg-transparent text-xs text-slate-200 font-medium py-1 pr-7 pl-1 focus:outline-none cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.name} ({m.tag})
                </option>
              ))}
            </select>
          </div>

          {/* API Key Status / Button */}
          <button
            onClick={onOpenKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hasCustomKey
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
            }`}
            title="Configurar o cambiar Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasCustomKey ? 'API Key Personalizada' : 'API Key Servidor'}</span>
          </button>

          {/* Real-time Session Cost Badge */}
          <div
            onClick={() => onTabChange('cost')}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:border-emerald-500/60 transition-all shadow-sm"
            title="Ver desglose detallado de costes acumulados"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 font-normal leading-none">Coste Sesión</span>
              <span className="text-xs font-bold text-emerald-300">
                ${sessionCost.toFixed(5)} USD
              </span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              {sessionTokens.total.toLocaleString()} tok
            </span>
          </div>

          {/* Reset Chat */}
          <button
            onClick={onResetChat}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Reiniciar conversación"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 border-t border-slate-800/60 overflow-x-auto scrollbar-none py-1">
        <button
          onClick={() => onTabChange('chat')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'chat'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Chatbot Asistente
        </button>

        <button
          onClick={() => onTabChange('sources')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'sources'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Fuentes Documentales
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {activeSourcesCount}/{totalSourcesCount}
          </span>
        </button>

        <button
          onClick={() => onTabChange('prompt')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'prompt'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          System Prompt
        </button>

        <button
          onClick={() => onTabChange('trace')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'trace'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Trazabilidad API & Inspector
        </button>

        <button
          onClick={() => onTabChange('cost')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'cost'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Consumo & Costes
        </button>
      </div>
    </header>
  );
};
