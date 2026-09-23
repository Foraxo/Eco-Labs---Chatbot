import React, { useState, useRef } from 'react';
import { SourceDocument } from '../types';
import {
  FileText,
  FileCode,
  Globe,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  AlertTriangle,
  Layers,
  Sparkles,
  Link2,
  FileUp,
} from 'lucide-react';
import { INITIAL_SOURCES } from '../data/defaultSources';

interface SourcesManagerProps {
  sources: SourceDocument[];
  onSourcesChange: (sources: SourceDocument[]) => void;
  onSelectTab: (tab: 'chat' | 'sources' | 'prompt' | 'trace' | 'cost') => void;
}

export const SourcesManager: React.FC<SourcesManagerProps> = ({
  sources,
  onSourcesChange,
  onSelectTab,
}) => {
  const [modalMode, setModalMode] = useState<'none' | 'pdf' | 'text' | 'url'>('none');
  const [previewDoc, setPreviewDoc] = useState<SourceDocument | null>(null);

  // Form states
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toggle single source active status
  const handleToggleSource = (id: string) => {
    onSourcesChange(
      sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Delete source
  const handleDeleteSource = (id: string) => {
    onSourcesChange(sources.filter((s) => s.id !== id));
  };

  // Reset to default sample sources
  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restaurar las fuentes documentales predeterminadas sobre residuos urbanos?')) {
      onSourcesChange(INITIAL_SOURCES);
    }
  };

  // Handle PDF file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        const newSource: SourceDocument = {
          id: 'pdf-' + Date.now(),
          name: file.name,
          type: 'pdf',
          mimeType: 'application/pdf',
          data: base64Data,
          size: file.size,
          enabled: true,
          addedAt: new Date().toISOString(),
          description: `Documento PDF procesado de forma nativa por la visión multimodal del modelo (${Math.round(file.size / 1024)} KB).`,
        };
        onSourcesChange([...sources, newSource]);
        setModalMode('none');
      };
      reader.onerror = () => {
        setErrorMessage('Error al leer el archivo PDF');
      };
      reader.readAsDataURL(file);
    } else {
      // Plain text, markdown or doc text
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const newSource: SourceDocument = {
          id: 'txt-' + Date.now(),
          name: file.name,
          type: 'text',
          content: text,
          size: file.size,
          enabled: true,
          addedAt: new Date().toISOString(),
          description: `Archivo de texto/documento importado (${Math.round(file.size / 1024)} KB, ${text.length} caracteres).`,
        };
        onSourcesChange([...sources, newSource]);
        setModalMode('none');
      };
      reader.onerror = () => {
        setErrorMessage('Error al leer el archivo');
      };
      reader.readAsText(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle URL Scrape
  const handleScrapeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setUrlLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al descargar la página web');
      }

      const newSource: SourceDocument = {
        id: 'url-' + Date.now(),
        name: data.title ? `${data.title.substring(0, 45)} (Web)` : urlInput,
        type: 'url',
        content: data.content,
        size: data.charCount,
        enabled: true,
        addedAt: new Date().toISOString(),
        description: `Fuente Web extraída de ${urlInput} (${data.charCount} caracteres).`,
      };

      onSourcesChange([...sources, newSource]);
      setUrlInput('');
      setModalMode('none');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con la URL');
    } finally {
      setUrlLoading(false);
    }
  };

  // Handle custom text creation
  const handleAddTextSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docContent.trim()) {
      setErrorMessage('Por favor ingresa un título y el contenido');
      return;
    }

    const newSource: SourceDocument = {
      id: 'text-' + Date.now(),
      name: docName.endsWith('.txt') ? docName : `${docName}.txt`,
      type: 'text',
      content: docContent.trim(),
      size: docContent.length,
      enabled: true,
      addedAt: new Date().toISOString(),
      description: `Texto personalizado ingresado manualmente (${docContent.length} caracteres).`,
    };

    onSourcesChange([...sources, newSource]);
    setDocName('');
    setDocContent('');
    setModalMode('none');
  };

  const enabledCount = sources.filter((s) => s.enabled).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Fuentes de Información del Chatbot (Grounded Context)
              </h2>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              El chatbot responderá <span className="text-emerald-400 font-semibold">única y exclusivamente</span> utilizando los documentos habilitados a continuación. Los archivos <span className="text-amber-400 font-medium">PDF</span> se procesan mediante la capacidad multimodal de Gemini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setErrorMessage('');
                setModalMode('pdf');
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <Upload className="w-4 h-4" />
              Subir PDF / Doc
            </button>

            <button
              onClick={() => {
                setErrorMessage('');
                setModalMode('url');
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              Añadir URL Web
            </button>

            <button
              onClick={() => {
                setErrorMessage('');
                setModalMode('text');
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Crear Texto
            </button>

            <button
              onClick={handleResetDefaults}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl text-xs transition-all"
              title="Restaurar fuentes de ejemplo de residuos urbanos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {enabledCount} de {sources.length} fuentes activas
            </span>
            {enabledCount === 0 && (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                No hay fuentes activas. El chatbot indicará que no dispone de datos.
              </span>
            )}
          </div>
          <button
            onClick={() => onSelectTab('chat')}
            className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 hover:underline"
          >
            Ir al Chat a hacer una pregunta &rarr;
          </button>
        </div>
      </div>

      {/* Sources Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source) => (
          <div
            key={source.id}
            className={`border rounded-xl p-4 transition-all flex flex-col justify-between relative group ${
              source.enabled
                ? 'bg-slate-900/90 border-slate-700 hover:border-emerald-500/50 shadow-md'
                : 'bg-slate-950/60 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="space-y-3">
              {/* Header with Type Badge and Toggle */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  {source.type === 'pdf' ? (
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                      <FileUp className="w-4 h-4" />
                    </div>
                  ) : source.type === 'url' ? (
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="truncate">
                    <h3 className="text-sm font-semibold text-white truncate" title={source.name}>
                      {source.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {source.type === 'pdf'
                        ? 'PDF (Multimodal Nativo)'
                        : source.type === 'url'
                        ? 'Página Web (Scraped)'
                        : 'Texto Plano / Documento'}
                    </span>
                  </div>
                </div>

                {/* Enable/Disable Switch */}
                <button
                  onClick={() => handleToggleSource(source.id)}
                  aria-label={source.enabled ? `Desactivar fuente ${source.name}` : `Activar fuente ${source.name}`}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors shrink-0 ${
                    source.enabled
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                  }`}
                  title={source.enabled ? 'Desactivar esta fuente del contexto' : 'Activar esta fuente en el contexto'}
                >
                  {source.enabled ? 'Activa' : 'Inactiva'}
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {source.description || source.content?.substring(0, 160) || 'Sin descripción adicional.'}
              </p>
            </div>

            {/* Actions Bottom Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                {source.size ? `${(source.size / 1024).toFixed(1)} KB` : 'Doc'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreviewDoc(source)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Previsualizar contenido del documento"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteSource(source.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Eliminar fuente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal / Dialog for Add Source */}
      {modalMode !== 'none' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {modalMode === 'pdf' && <Upload className="w-4 h-4 text-emerald-400" />}
                {modalMode === 'url' && <Globe className="w-4 h-4 text-cyan-400" />}
                {modalMode === 'text' && <FileText className="w-4 h-4 text-emerald-400" />}
                {modalMode === 'pdf' && 'Subir Documento (PDF o Texto)'}
                {modalMode === 'url' && 'Importar Contenido desde URL Web'}
                {modalMode === 'text' && 'Crear Documento de Texto'}
              </h3>
              <button
                onClick={() => {
                  setModalMode('none');
                  setErrorMessage('');
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Mode 1: PDF Upload */}
            {modalMode === 'pdf' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/70"
                >
                  <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-200">
                    Haz clic para seleccionar un archivo PDF o TXT
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Soporta PDFs con visión multimodal nativa, .txt, .md y .docx
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.txt,.md,.doc,.docx"
                  className="hidden"
                />
              </div>
            )}

            {/* Mode 2: URL Scrape */}
            {modalMode === 'url' && (
              <form onSubmit={handleScrapeUrl} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    URL de la página web a consultar:
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      required
                      placeholder="https://ejemplo.gob.ar/residuos/guia-reciclaje"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    El servidor descargará el contenido textual de la página y lo estructurará como fuente documental.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalMode('none')}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={urlLoading}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    {urlLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Extrayendo contenido...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        Importar Página Web
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Mode 3: Plain text */}
            {modalMode === 'text' && (
              <form onSubmit={handleAddTextSource} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nombre del documento:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Normativa_Comercial_Residuos.txt"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contenido del documento:
                  </label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Escribe o pega aquí la información, normativas, listas o instrucciones que debe usar el chatbot..."
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalMode('none')}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Guardar Fuente
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white truncate">{previewDoc.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                  {previewDoc.type}
                </span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <p><strong>Descripción:</strong> {previewDoc.description || 'Sin descripción'}</p>
                <p className="mt-1"><strong>Estado:</strong> {previewDoc.enabled ? 'Habilitado en el prompt' : 'Deshabilitado'}</p>
              </div>

              {previewDoc.type === 'pdf' ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Procesamiento Multimodal Nativo de PDF
                    </p>
                    <p className="mt-1 text-slate-300">
                      Este documento PDF se envía directamente codificado en Base64 en la propiedad <code className="text-emerald-400 font-mono">inlineData</code> de la API de Gemini. El modelo analiza el documento con su motor multimodal, reconociendo tablas, columnas y texto.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800 break-all max-h-48 overflow-y-auto">
                    {previewDoc.data?.substring(0, 300)}... [Base64 PDF stream]
                  </div>
                </div>
              ) : (
                <pre className="text-xs font-mono text-slate-200 bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed">
                  {previewDoc.content}
                </pre>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-xs font-medium"
              >
                Cerrar Previsualización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
