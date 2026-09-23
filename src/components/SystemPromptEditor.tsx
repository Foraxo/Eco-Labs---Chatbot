import React, { useState } from 'react';
import { BookOpen, RefreshCw, Check, Sparkles, ShieldCheck, Terminal, AlertCircle } from 'lucide-react';
import { DEFAULT_SYSTEM_PROMPT } from '../data/defaultSources';

interface SystemPromptEditorProps {
  systemPrompt: string;
  onSystemPromptChange: (newPrompt: string) => void;
  onSelectTab: (tab: 'chat' | 'sources' | 'prompt' | 'trace' | 'cost') => void;
}

export const SystemPromptEditor: React.FC<SystemPromptEditorProps> = ({
  systemPrompt,
  onSystemPromptChange,
  onSelectTab,
}) => {
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSystemPromptChange(localPrompt);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleRestoreDefault = () => {
    if (window.confirm('¿Restaurar el System Prompt predeterminado de EcoGuía Residuos?')) {
      setLocalPrompt(DEFAULT_SYSTEM_PROMPT);
      onSystemPromptChange(DEFAULT_SYSTEM_PROMPT);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Editor de System Prompt (Instrucción del Sistema)
              </h2>
            </div>
            <p className="text-sm text-slate-300">
              Define la identidad, guardarraíles de seguridad y reglas de aislamiento de fuentes que guían a Gemini antes de cada interacción.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreDefault}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
              title="Restaurar prompt oficial"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restaurar Original
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  ¡Guardado!
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Aplicar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Educational Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Textarea */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono flex items-center gap-1 text-emerald-400">
              <Terminal className="w-3.5 h-3.5" />
              config.systemInstruction
            </span>
            <span>{localPrompt.length} caracteres ({Math.round(localPrompt.length / 4)} tokens aprox.)</span>
          </div>

          <div className="relative">
            <textarea
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              rows={16}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs font-mono text-slate-100 leading-relaxed focus:outline-none focus:border-emerald-500 shadow-inner resize-y"
              placeholder="Escribe aquí las directivas del System Prompt..."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-500">
              * Los cambios se enviarán en la propiedad <code className="text-emerald-400 font-mono">config.systemInstruction</code> de la API en la próxima consulta.
            </p>
            <button
              onClick={() => onSelectTab('chat')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              Probar en el chat &rarr;
            </button>
          </div>
        </div>

        {/* Educational Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              ¿Por qué es crucial el System Prompt?
            </div>
            <p className="text-slate-300 leading-relaxed">
              El System Prompt establece las <strong>reglas inviolables</strong> del modelo. En este chatbot, garantiza que la IA no invente datos y responda <strong>únicamente</strong> basándose en las fuentes cargadas.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <AlertCircle className="w-4 h-4" />
              Técnica de Aislamiento (Anti-Alucinaciones)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Al instruir al modelo a decir explícitamente:
              <br />
              <em className="text-slate-200">
                &ldquo;Lo siento, esa información no se encuentra en las fuentes...&rdquo;
              </em>
              <br />
              evitamos que conteste con datos generales erróneos de otras ciudades o normativas ajenas.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Prueba educativa recomendada:
            </span>
            <p className="text-slate-400 leading-relaxed">
              Pregunta algo que <strong>no</strong> esté en los documentos (por ej: <em>&ldquo;¿Cómo renuevo mi pasaporte?&rdquo;</em>) para verificar cómo el System Prompt bloquea respuestas fuera de dominio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
