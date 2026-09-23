import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SourceDocument } from '../types';
import {
  Send,
  Sparkles,
  Bot,
  User,
  FileText,
  FileCode,
  Globe,
  Terminal,
  Clock,
  DollarSign,
  Activity,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  FileUp,
} from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  sources: SourceDocument[];
  onSelectTrace: (traceId: string) => void;
  onSelectTab: (tab: 'chat' | 'sources' | 'prompt' | 'trace' | 'cost') => void;
}

const SAMPLE_QUESTIONS = [
  {
    label: '📅 Recolección Diferenciada',
    query: '¿Qué días y horarios pasa la recolección de reciclables en bolsa verde y qué materiales están permitidos?',
  },
  {
    label: '🔋 Pilas y Baterías (PDF)',
    query: '¿Dónde debo depositar las pilas y baterías usadas según la resolución municipal?',
  },
  {
    label: '🧱 Escombros de Obra (PDF)',
    query: '¿A qué número debo llamar para solicitar el retiro gratuito de escombros de obra y cuál es el límite?',
  },
  {
    label: '🌱 Compostaje Prohibido',
    query: '¿Puedo tirar carnes, lácteos o heces de mascotas en la compostera domiciliaria?',
  },
  {
    label: '🛡️ Test de Aislamiento',
    query: '¿Cómo renuevo mi licencia de conducir en la municipalidad?',
  },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  sources,
  onSelectTrace,
  onSelectTab,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const enabledSources = sources.filter((s) => s.enabled);
  const pdfSourcesCount = enabledSources.filter((s) => s.type === 'pdf').length;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-125px)]">
      {/* Active Sources Mini-Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Fuentes activas ({enabledSources.length}):
          </span>
          {enabledSources.map((s) => (
            <span
              key={s.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono border whitespace-nowrap ${
                s.type === 'pdf'
                  ? 'bg-red-500/10 text-red-300 border-red-500/30'
                  : s.type === 'url'
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}
              title={s.name}
            >
              {s.type === 'pdf' && <FileUp className="w-3 h-3 text-red-400" />}
              {s.type === 'url' && <Globe className="w-3 h-3 text-cyan-400" />}
              {s.type === 'text' && <FileText className="w-3 h-3 text-emerald-400" />}
              <span className="truncate max-w-[130px]">{s.name}</span>
            </span>
          ))}
          {enabledSources.length === 0 && (
            <span className="text-amber-400 text-xs italic">
              Sin fuentes activas. El modelo responderá que no tiene información.
            </span>
          )}
        </div>

        <button
          onClick={() => onSelectTab('sources')}
          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium hover:underline shrink-0"
        >
          Gestionar fuentes &rarr;
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.length === 0 ? (
          <div className="py-8 sm:py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/20">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-white tracking-tight">
                ¡Hola! Soy EcoLabs, tu Asistente de Residuos
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Respondo <strong className="text-slate-200">únicamente</strong> a partir de las fuentes documentales y normativas cargadas. Prueba una de las siguientes consultas para verificar la extracción y trazabilidad:
              </p>
            </div>

            {/* Quick Sample Questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto text-left">
              {SAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(q.query)}
                  className="p-3 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-xs transition-all group shadow-sm flex flex-col justify-between"
                >
                  <span className="font-semibold text-emerald-400 text-[11px] mb-1 group-hover:text-emerald-300">
                    {q.label}
                  </span>
                  <span className="text-slate-300 line-clamp-2 leading-relaxed">
                    {q.query}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs sm:text-sm ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Bot Avatar */}
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Content Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 space-y-2.5 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : msg.error
                    ? 'bg-red-950/40 border border-red-800/80 text-red-200 rounded-bl-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>

                {/* Performance & Cost Bar for Model Messages */}
                {msg.role === 'model' && msg.trace && (
                  <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 text-cyan-300 font-mono">
                        <Clock className="w-3 h-3" />
                        {msg.trace.latencyMs} ms
                      </span>
                      <span className="flex items-center gap-1 text-amber-300 font-mono">
                        <Activity className="w-3 h-3" />
                        {msg.usageMetadata?.totalTokenCount.toLocaleString() || 0} tokens
                      </span>
                      <span className="flex items-center gap-1 text-emerald-300 font-mono font-bold">
                        <DollarSign className="w-3 h-3" />
                        ${msg.cost?.totalCost.toFixed(6) || '0.000000'} USD
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTrace(msg.trace!.id);
                        onSelectTab('trace');
                      }}
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 transition-colors"
                      title="Ver el JSON exacto de Request y Response de esta consulta"
                    >
                      <Terminal className="w-3 h-3" />
                      Ver Trazabilidad API &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 border border-slate-700">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Spinner / Step Tracker */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shrink-0 shadow-md animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2 shadow-md max-w-md">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Procesando consulta con Gemini...</span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                {pdfSourcesCount > 0 && (
                  <p className="flex items-center gap-1.5 text-amber-300">
                    <FileUp className="w-3.5 h-3.5" />
                    Analizando {pdfSourcesCount} PDF(s) con visión multimodal nativa...
                  </p>
                )}
                <p>Verificando guardarraíles de aislamiento y calculando tokens en tiempo real...</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-3 bg-slate-900 border border-slate-700/80 rounded-2xl p-2 sm:p-2.5 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre reciclaje, días de recolección, Puntos Verdes o normativas..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 p-2 focus:outline-none resize-none max-h-32 min-h-[38px] leading-relaxed"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>

        <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-slate-500">
          <span>Presiona <strong>Enter</strong> para enviar, <strong>Shift + Enter</strong> para salto de línea</span>
          <span>Aislamiento de fuentes activo</span>
        </div>
      </div>
    </div>
  );
};
