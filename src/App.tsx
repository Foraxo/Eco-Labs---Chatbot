import React, { useState, useRef, useEffect } from 'react';
import { ModelId, SourceDocument, ChatMessage, ApiTrace, FallbackNotice } from './types';
import { AVAILABLE_MODELS, DEFAULT_SYSTEM_PROMPT, INITIAL_SOURCES } from './data/defaultSources';
import { MarkdownMessage } from './components/MarkdownMessage';
import {
  testFirestoreConnection,
  syncSessionToFirestore,
  saveSingleChatLog,
  subscribeToSavedSessions,
  deleteFirestoreSession,
  SavedChatSession,
} from './lib/firebase';
import {
  Sparkles,
  Send,
  Upload,
  Plus,
  Trash2,
  FileText,
  FileUp,
  Globe,
  Terminal,
  DollarSign,
  Activity,
  Clock,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X,
  Copy,
  Info,
  Layers,
  ShieldCheck,
  Cpu,
  Edit3,
  Zap,
  Save,
  RotateCcw,
  Cloud,
  CloudCheck,
  Flame,
  BookOpen,
  Lock,
  Unlock,
  User,
  Users,
  MessageSquare,
  ChevronRight,
  LogOut,
  FolderClock,
} from 'lucide-react';

const REQUIRED_PASSCODE = 'Birria2026';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'ecoguia_auth_token_v3',
  USER_NAME: 'ecoguia_user_name_v3',
  MESSAGES: 'ecoguia_chat_messages_v3',
  SOURCES: 'ecoguia_sources_rosario_v3',
  SYSTEM_PROMPT: 'ecoguia_system_prompt_rosario_v3',
  CURRENT_MODEL: 'ecoguia_selected_model_v3',
  CUSTOM_MODEL_ACTIVE: 'ecoguia_custom_model_active_v3',
  CUSTOM_MODEL_INPUT: 'ecoguia_custom_model_input_v3',
  TEMPERATURE: 'ecoguia_temperature_v3',
  RETRIEVAL_MODE: 'ecoguia_retrieval_mode_v3',
  SESSION_ID: 'ecoguia_current_session_id_v3',
  SESSION_COST: 'ecoguia_session_cost_v3',
  SESSION_TOKENS: 'ecoguia_session_tokens_v3',
  API_KEY: 'gemini_custom_api_key',
};

export default function App() {
  // Authentication Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) === 'authorized_birria_2026';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userNameInput, setUserNameInput] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
  });
  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Compañero';
  });
  const [loginError, setLoginError] = useState('');

  // Active Session ID for Firestore
  const [sessionId, setSessionId] = useState<string>(() => {
    let sid = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (!sid) {
      sid = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, sid);
    }
    return sid;
  });

  // App model & sources state (Default to gemini-3.5-flash-lite)
  const [currentModel, setCurrentModel] = useState<ModelId>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_MODEL) || 'gemini-3.5-flash-lite';
  });

  const [isCustomModelActive, setIsCustomModelActive] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_MODEL_ACTIVE) === 'true';
  });

  const [customModelInput, setCustomModelInput] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_MODEL_INPUT) || '';
  });
  
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  });

  const [temperature, setTemperature] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEMPERATURE);
    return saved !== null ? parseFloat(saved) : 0.2;
  });

  const [retrievalMode, setRetrievalMode] = useState<'on_demand' | 'full_injection'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RETRIEVAL_MODE);
    return saved === 'full_injection' ? 'full_injection' : 'on_demand';
  });

  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT) || DEFAULT_SYSTEM_PROMPT;
  });

  const [sources, setSources] = useState<SourceDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOURCES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error al cargar fuentes:', e);
    }
    return INITIAL_SOURCES;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error al cargar mensajes:', e);
    }
    return [];
  });

  const [sessionCost, setSessionCost] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSION_COST);
    return saved ? parseFloat(saved) || 0 : 0;
  });

  const [sessionTokens, setSessionTokens] = useState<{ prompt: number; candidates: number; total: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION_TOKENS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { prompt: 0, candidates: 0, total: 0 };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [saveStatus, setSaveStatus] = useState<string>('Guardado');
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'syncing' | 'error'>('connected');

  // Firebase Cloud Saved Sessions Drawer State
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [cloudSessions, setCloudSessions] = useState<SavedChatSession[]>([]);
  const [selectedCloudSession, setSelectedCloudSession] = useState<SavedChatSession | null>(null);

  // UI toggle states
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState<'none' | 'upload' | 'url' | 'text'>('none');
  const [inspectTrace, setInspectTrace] = useState<ApiTrace | null>(null);
  const [previewDoc, setPreviewDoc] = useState<SourceDocument | null>(null);

  // Form states for adding sources
  const [newDocName, setNewDocName] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [sourceError, setSourceError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeModelId = isCustomModelActive && customModelInput.trim() ? customModelInput.trim() : currentModel;
  const selectedModelObj = AVAILABLE_MODELS.find((m) => m.id === activeModelId) || {
    id: activeModelId,
    name: activeModelId,
    tag: 'Personalizado',
    description: 'Modelo especificado por el usuario.',
    inputPrice1M: 0.15,
    outputPrice1M: 0.60,
    contextWindow: 'Auto',
  };
  const activeSources = sources.filter((s) => s.enabled);

  // Initial connection test to Firestore
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Listen to Firestore real-time cloud chat sessions
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const unsubscribe = subscribeToSavedSessions(
        (list) => {
          setCloudSessions(list);
          setFirebaseStatus('connected');
        },
        () => {
          setFirebaseStatus('error');
        }
      );
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch {
      setFirebaseStatus('error');
    }
  }, [isAuthenticated]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Persist LocalStorage & Sync to Firebase Firestore when messages change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      setSaveStatus('Guardado');
    } catch (e) {
      console.error('Error saving messages to localStorage:', e);
    }

    if (messages.length > 0 && isAuthenticated) {
      setFirebaseStatus('syncing');
      const sessionData: SavedChatSession = {
        id: sessionId,
        authorName: currentUserName,
        createdAt: messages[0]?.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        modelUsed: activeModelId,
        totalCost: sessionCost,
        totalTokens: sessionTokens.total,
        messageCount: messages.length,
        preview: messages[0]?.content.substring(0, 90) || 'Conversación activa',
        messages: messages,
      };

      syncSessionToFirestore(sessionData)
        .then(() => {
          setFirebaseStatus('connected');
        })
        .catch((err) => {
          console.error('Firebase sync error:', err);
          setFirebaseStatus('error');
        });
    }
  }, [messages, sessionId, currentUserName, activeModelId, sessionCost, sessionTokens.total, isAuthenticated]);

  // Persist Sources
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(sources));
    } catch (e) {
      console.error('Error saving sources:', e);
    }
  }, [sources]);

  // Persist System Prompt
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, systemPrompt);
    } catch (e) {
      console.error('Error saving prompt:', e);
    }
  }, [systemPrompt]);

  // Persist Model settings, Temperature & Retrieval Mode
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_MODEL, currentModel);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MODEL_ACTIVE, String(isCustomModelActive));
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MODEL_INPUT, customModelInput);
    localStorage.setItem(STORAGE_KEYS.TEMPERATURE, temperature.toString());
    localStorage.setItem(STORAGE_KEYS.RETRIEVAL_MODE, retrievalMode);
  }, [currentModel, isCustomModelActive, customModelInput, temperature, retrievalMode]);

  // Persist Session Stats
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSION_COST, sessionCost.toString());
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKENS, JSON.stringify(sessionTokens));
  }, [sessionCost, sessionTokens]);

  // Handle Login submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPassword === REQUIRED_PASSCODE) {
      const resolvedName = userNameInput.trim() || 'Compañero';
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'authorized_birria_2026');
      localStorage.setItem(STORAGE_KEYS.USER_NAME, resolvedName);
      setCurrentUserName(resolvedName);
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Contraseña incorrecta. Solicita la clave de acceso al equipo.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Deseas cerrar la sesión protegida?')) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      setIsAuthenticated(false);
      setLoginPassword('');
    }
  };

  // Start a fresh new chat session
  const handleNewChatSession = () => {
    const newSid = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    setSessionId(newSid);
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSid);
    setMessages([]);
    setSessionCost(0);
    setSessionTokens({ prompt: 0, candidates: 0, total: 0 });
  };

  // Load a previously saved cloud session into view
  const handleLoadCloudSession = (session: SavedChatSession) => {
    setSessionId(session.id);
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, session.id);
    setMessages(session.messages || []);
    setSessionCost(session.totalCost || 0);
    setSessionTokens({ prompt: 0, candidates: 0, total: session.totalTokens || 0 });
    if (session.modelUsed) {
      setCurrentModel(session.modelUsed);
    }
    setShowHistoryDrawer(false);
  };

  // Delete a cloud session
  const handleDeleteCloudSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar esta conversación guardada en Firebase?')) {
      try {
        await deleteFirestoreSession(sid);
        if (sid === sessionId) {
          handleNewChatSession();
        }
      } catch (error) {
        console.error('Error al eliminar sesión:', error);
      }
    }
  };

  // Save API key
  const handleSaveKey = (key: string) => {
    setCustomApiKey(key);
    if (key) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
    setShowKeyModal(false);
  };

  // Toggle source on/off
  const handleToggleSource = (id: string) => {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  // Delete source
  const handleDeleteSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  // Reset to authentic Rosario municipality sources
  const handleRestoreRosarioDefaults = () => {
    if (window.confirm('¿Deseas restaurar las 4 fuentes oficiales de Rosario (Residuos Informáticos, Gestión Urbana, Mitigación y Manual de Compostera)?')) {
      setSources(INITIAL_SOURCES);
    }
  };

  // Handle File upload (PDF or text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSourceError('');
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
          description: `PDF Multimodal cargado (${Math.round(file.size / 1024)} KB).`,
        };
        setSources((prev) => [...prev, newSource]);
        setShowAddSourceModal('none');
      };
      reader.onerror = () => setSourceError('Error al leer el archivo PDF.');
      reader.readAsDataURL(file);
    } else {
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
          description: `Texto cargado (${text.length} caracteres).`,
        };
        setSources((prev) => [...prev, newSource]);
        setShowAddSourceModal('none');
      };
      reader.onerror = () => setSourceError('Error al leer el archivo.');
      reader.readAsText(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle URL Scrape
  const handleScrapeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setUrlLoading(true);
    setSourceError('');

    try {
      const res = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al descargar la página.');

      const newSource: SourceDocument = {
        id: 'url-' + Date.now(),
        name: data.title ? `${data.title.substring(0, 45)} (Web)` : newUrl,
        type: 'url',
        content: data.content,
        size: data.charCount,
        enabled: true,
        addedAt: new Date().toISOString(),
        description: `Fuente Web extraída de ${newUrl}.`,
      };
      setSources((prev) => [...prev, newSource]);
      setNewUrl('');
      setShowAddSourceModal('none');
    } catch (err: any) {
      setSourceError(err.message || 'Error al conectar con la URL.');
    } finally {
      setUrlLoading(false);
    }
  };

  // Handle manual text source
  const handleAddManualText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocContent.trim()) {
      setSourceError('Completa título y contenido.');
      return;
    }
    const newSource: SourceDocument = {
      id: 'txt-' + Date.now(),
      name: newDocName.endsWith('.txt') ? newDocName : `${newDocName}.txt`,
      type: 'text',
      content: newDocContent.trim(),
      size: newDocContent.length,
      enabled: true,
      addedAt: new Date().toISOString(),
      description: `Texto redactado (${newDocContent.length} caracteres).`,
    };
    setSources((prev) => [...prev, newSource]);
    setNewDocName('');
    setNewDocContent('');
    setShowAddSourceModal('none');
  };

  // Send message to chatbot & record in Firestore
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-user',
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          systemInstruction: systemPrompt,
          model: activeModelId,
          temperature: temperature,
          retrievalMode: retrievalMode,
          sources: activeSources,
          customApiKey: customApiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al contactar con la API');

      let replyContent = data.reply || '';
      let notice: FallbackNotice | undefined = data.fallbackNotice;

      const legacyNoteMatch = replyContent.match(/^\*\(Nota:\s*El modelo "([^"]+)" experimentó una saturación temporal de demanda 503; se procesó automáticamente con "([^"]+)"\)\*\s*\n\n/);
      if (legacyNoteMatch) {
        notice = notice || {
          requestedModel: legacyNoteMatch[1],
          usedModel: legacyNoteMatch[2],
          message: `El modelo "${legacyNoteMatch[1]}" experimentó saturación temporal de demanda (503); la respuesta se generó automáticamente con "${legacyNoteMatch[2]}".`,
        };
        replyContent = replyContent.replace(legacyNoteMatch[0], '');
      }

      const botMsg: ChatMessage = {
        id: 'msg-' + Date.now() + '-bot',
        role: 'model',
        content: replyContent,
        timestamp: new Date().toISOString(),
        openedFiles: data.openedFiles || [],
        usageMetadata: data.usageMetadata,
        cost: data.cost,
        trace: data.trace,
        fallbackNotice: notice,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Save individual interaction log to Firestore
      saveSingleChatLog({
        id: 'log_' + Date.now(),
        sessionId: sessionId,
        authorName: currentUserName,
        query: query.trim(),
        reply: replyContent,
        model: activeModelId,
        timestamp: new Date().toISOString(),
        latencyMs: data.trace?.latencyMs,
        tokens: data.usageMetadata?.totalTokenCount,
        costUsd: data.cost?.totalCost,
      }).catch((e) => console.warn('Log save error:', e));

      if (data.cost?.totalCost) {
        setSessionCost((prev) => prev + data.cost.totalCost);
      }
      if (data.usageMetadata) {
        setSessionTokens((prev) => ({
          prompt: prev.prompt + (data.usageMetadata.promptTokenCount || 0),
          candidates: prev.candidates + (data.usageMetadata.candidatesTokenCount || 0),
          total: prev.total + (data.usageMetadata.totalTokenCount || 0),
        }));
      }
    } catch (error: any) {
      const errBotMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'model',
        content: `⚠️ ${error.message || 'Error de conexión.'} Por favor revisa la configuración o tu API Key.`,
        timestamp: new Date().toISOString(),
        error: true,
      };
      setMessages((prev) => [...prev, errBotMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ================= LOGIN SCREEN GATE =================
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100 font-sans p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/20 border border-emerald-400/30">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">EcoLabs</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acceso protegido para el equipo y compañeros. Registro centralizado en Firebase Firestore.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Tu Nombre o Apodo (para identificar tus chats):
              </label>
              <input
                type="text"
                placeholder="ej. Lucas, Martín, Sofía..."
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Contraseña de Acceso:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ingresa la contraseña..."
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setLoginError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-11 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer p-1 rounded-md"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 animate-in fade-in">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              Ingresar al Chatbot
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-500">
              Modelo predeterminado: <strong className="text-emerald-400">Gemini 3.5 Flash Lite</strong> · Base de datos Firestore conectada
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ================= MAIN AUTHENTICATED APP =================
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* ================= LEFT SIDEBAR (Fuentes, Modelos & Cloud) ================= */}
      <aside
        className={`w-80 md:w-92 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 z-20 ${
          showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none md:overflow-hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">EcoLabs</h1>
              <span className="text-[10px] text-emerald-400 font-medium">Firebase & Gemini 3.5 Flash-Lite</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs flex items-center gap-1 border border-slate-700"
              title="Ver registro de chats en Firebase"
            >
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold text-cyan-300">{cloudSessions.length}</span>
            </button>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1 text-slate-400 hover:text-white rounded-md md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Badge Bar */}
        <div className="px-3.5 py-2 bg-slate-950/70 border-b border-slate-850 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 truncate">
            <User className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate text-[11px] font-medium">{currentUserName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono ${
                firebaseStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : firebaseStatus === 'syncing'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
              title="Estado de conexión con Firebase Firestore"
            >
              <Cloud className="w-2.5 h-2.5" />
              {firebaseStatus === 'syncing' ? 'Sincronizando...' : 'Firestore OK'}
            </span>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-slate-800"
              title="Cerrar sesión"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Sidebar Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
          {/* Quick Action: Ver Registro de Chats en la Nube */}
          <button
            onClick={() => setShowHistoryDrawer(true)}
            className="w-full p-2.5 bg-gradient-to-r from-cyan-950/50 to-slate-900 border border-cyan-500/30 hover:border-cyan-400/60 rounded-xl text-left flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2">
              <FolderClock className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-white block">Registro de Chats (Firebase)</span>
                <span className="text-[10px] text-slate-400">{cloudSessions.length} conversaciones compartidas</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Section: System Prompt Button */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                System Prompt (Aislamiento)
              </span>
              <button
                onClick={() => setShowPromptModal(true)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
              >
                Editar
              </button>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {systemPrompt}
            </p>
          </div>

          {/* Section: Fuentes Documentales Reales de Rosario */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Fuentes ({activeSources.length}/{sources.length} activas)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleRestoreRosarioDefaults}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] flex items-center gap-1 border border-slate-700"
                  title="Restaurar las 4 fuentes oficiales de Rosario"
                >
                  <RotateCcw className="w-2.5 h-2.5 text-cyan-400" />
                  Oficiales
                </button>
                <button
                  onClick={() => {
                    setSourceError('');
                    setShowAddSourceModal('upload');
                  }}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all"
                  title="Añadir PDF o archivo"
                >
                  <Plus className="w-3 h-3" /> Añadir
                </button>
              </div>
            </div>

            {/* Retrieval Strategy Selector (Bajo Demanda vs Inyección Total) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  Estrategia de Lectura:
                </span>
                <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-1.5 py-0.2 rounded font-bold">
                  {retrievalMode === 'on_demand' ? '⚡ Bajo Demanda' : '📦 Inyección Total'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRetrievalMode('on_demand')}
                  className={`py-1 px-1.5 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    retrievalMode === 'on_demand'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="El modelo consulta el catálogo y abre solo el archivo necesario vía Tool Calling"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Bajo Demanda</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRetrievalMode('full_injection')}
                  className={`py-1 px-1.5 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    retrievalMode === 'full_injection'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Envía el texto completo de todos los archivos en cada turno"
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span>Inyección Total</span>
                </button>
              </div>

              <p className="text-[9px] text-slate-400 leading-tight">
                {retrievalMode === 'on_demand'
                  ? '⚡ Ahorra tokens: Gemini abre y lee archivos específicos solo cuando la pregunta lo requiere.'
                  : '📦 Inyecta todos los documentos activos en cada mensaje (mayor consumo de tokens).'}
              </p>
            </div>

            {/* List of sources */}
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {sources.map((src) => {
                const isRosarioGov = src.content?.includes('rosario.gob.ar') || src.description?.includes('rosario.gob.ar') || src.name.toLowerCase().includes('rosario');
                return (
                  <div
                    key={src.id}
                    className={`border rounded-lg p-2.5 transition-all text-xs flex flex-col gap-1.5 ${
                      src.enabled
                        ? 'bg-slate-950/80 border-slate-700/80 text-slate-200'
                        : 'bg-slate-950/30 border-slate-800/50 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleSource(src.id)}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
                            src.enabled
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                          title={src.enabled ? 'Desactivar fuente' : 'Activar fuente'}
                        >
                          {src.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        {src.type === 'pdf' ? (
                          <FileUp className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        ) : src.type === 'url' ? (
                          <Globe className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        )}

                        <span className="truncate text-[11px] font-medium" title={src.name}>
                          {src.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setPreviewDoc(src)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                          title="Ver contenido completo"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteSource(src.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800"
                          title="Eliminar fuente"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {src.description && (
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pl-6">
                        <span className="truncate">{src.description}</span>
                        {isRosarioGov && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/20 flex-shrink-0 ml-1">
                            Oficial
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {activeSources.length === 0 && (
              <p className="text-[10px] text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20 leading-relaxed">
                ⚠️ Sin fuentes activas. El bot responderá que no dispone de datos según la regla de aislamiento.
              </p>
            )}
          </div>

          {/* Section: Modelo & Selector (Gemini 3.5 Flash Recomendado) */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Modelo Gemini
              </span>
              <button
                onClick={() => setShowKeyModal(true)}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
              >
                <Key className="w-2.5 h-2.5" />
                {customApiKey ? 'Key Propia' : 'Key Servidor'}
              </button>
            </div>

            {/* Select dropdown */}
            <select
              value={isCustomModelActive ? 'custom' : currentModel}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomModelActive(true);
                  if (!customModelInput) setCustomModelInput('gemini-3.5-flash-lite');
                } else {
                  setIsCustomModelActive(false);
                  setCurrentModel(e.target.value);
                }
              }}
              aria-label="Seleccionar modelo de IA"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <optgroup label="Recomendado">
                <option value="gemini-3.5-flash-lite">🌟 Gemini 3.5 Flash Lite (Recomendado)</option>
              </optgroup>
              <optgroup label="Familia Gemini Flash">
                <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
                <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
                <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Económico)</option>
                <option value="gemini-flash-latest">Gemini Flash (Latest)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </optgroup>
              <optgroup label="Pro & Complejo">
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Alta Precisión)</option>
              </optgroup>
              <optgroup label="Avanzado">
                <option value="custom">✍️ Ingresar otro modelo personalizado...</option>
              </optgroup>
            </select>

            {/* Custom Model Input if 'custom' is selected */}
            {isCustomModelActive && (
              <div className="pt-1.5 space-y-1">
                <div className="flex items-center gap-1 text-[11px] text-amber-300">
                  <Edit3 className="w-3 h-3" />
                  <span>Nombre o ID del modelo:</span>
                </div>
                <input
                  type="text"
                  placeholder="ej. gemini-3.5-flash-lite"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Temperature Slider & Control */}
            <div className="pt-2.5 border-t border-slate-850 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Temperatura
                </span>
                <span className="font-mono text-orange-300 font-bold bg-slate-900 border border-orange-500/30 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                  <span>{temperature.toFixed(2)}</span>
                  <span className="text-[9px] text-slate-400 font-normal">
                    {temperature <= 0.2 ? '(Preciso)' : temperature <= 0.7 ? '(Equilibrado)' : '(Creativo)'}
                  </span>
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-orange-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />

              {/* Preset buttons */}
              <div className="grid grid-cols-4 gap-1 pt-0.5">
                {[
                  { label: '0.0', name: 'Preciso', val: 0.0 },
                  { label: '0.2', name: 'Oficial', val: 0.2 },
                  { label: '0.7', name: 'Medio', val: 0.7 },
                  { label: '1.2', name: 'Creativo', val: 1.2 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setTemperature(preset.val)}
                    className={`py-1 px-1 rounded text-[10px] font-medium transition-colors border cursor-pointer ${
                      Math.abs(temperature - preset.val) < 0.04
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Semantic Helper description */}
              <p className="text-[10px] text-slate-400 leading-tight pt-0.5">
                {temperature <= 0.2
                  ? '🎯 Respuestas deterministas y fieles a los documentos de Rosario.'
                  : temperature <= 0.7
                  ? '⚖️ Balance entre rigor informativo y naturalidad conversacional.'
                  : '💡 Mayor inventiva y variedad de redacción.'}
              </p>
            </div>

            {/* Session Cost & Tokens Mini summary */}
            <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Coste sesión:</span>
              <span className="font-mono font-bold text-emerald-400">
                ${sessionCost.toFixed(5)} USD
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Tokens procesados:</span>
              <span className="font-mono">{sessionTokens.total.toLocaleString()} tok</span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Municipalidad de Rosario</span>
          <span className="text-cyan-400 flex items-center gap-1">
            <CloudCheck className="w-3 h-3" /> Firebase Sync
          </span>
        </div>
      </aside>

      {/* ================= MAIN CHAT & WORKSPACE ================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Top Header Bar */}
        <header className="h-13 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 text-xs flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fuentes & Config</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">EcoGuía Rosario</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono font-bold">
                {selectedModelObj.name}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-orange-300 bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-800/50 font-mono font-medium" title={`Temperatura activa: ${temperature}`}>
                <Flame className="w-2.5 h-2.5 text-orange-400" /> T: {temperature.toFixed(2)}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/60">
                <Cloud className="w-2.5 h-2.5" /> Firebase Firestore
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Historial Cloud Button */}
            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="Abrir historial de chats guardados en Firebase"
            >
              <FolderClock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Historial ({cloudSessions.length})</span>
            </button>

            {/* Nueva Conversación Button */}
            <button
              onClick={handleNewChatSession}
              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-xs flex items-center gap-1.5 border border-emerald-500/30 transition-colors"
              title="Iniciar una nueva sesión de chat limpia"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo Chat</span>
            </button>

            {/* Session Cost Indicator */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-bold text-emerald-300 text-xs">
                ${sessionCost.toFixed(5)}
              </span>
            </div>
          </div>
        </header>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {messages.length === 0 ? (
            /* Clean Empty State with Quick Questions */
            <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center mx-auto text-white shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  ¡Hola {currentUserName}! Asistente Oficial de Residuos de Rosario
                </h2>
                <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Procesando con <strong>Gemini 3.5 Flash</strong> sobre fuentes reales de <strong>rosario.gob.ar</strong>. Todos los chats quedan guardados en Firebase Firestore para que puedas compartirlos con tus compañeros.
                </p>
              </div>

              {/* Quick Suggestion Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left max-w-xl mx-auto">
                {[
                  {
                    title: '💻 Residuos Informáticos (CMD)',
                    query: '¿Qué aparatos reciben en las jornadas de residuos informáticos de Rosario y en qué lugares?',
                    desc: 'CPUs, notebooks, periféricos en CMD y Montevideo 2852',
                  },
                  {
                    title: '🟠 Contenedores Naranja vs Verdes',
                    query: '¿Qué materiales se deben depositar limpios y secos en los contenedores naranja de Rosario?',
                    desc: 'Papel, cartón, plástico, vidrio, metal y telgopor',
                  },
                  {
                    title: '🪴 Manual Compostera (PDF)',
                    query: '¿Cómo hago una compostera casera con baldes de 20L y qué residuos NO debo colocar según el manual de Rosario?',
                    desc: 'Guía oficial paso a paso y lista de prohibidos',
                  },
                  {
                    title: '🌍 Plan de Acción Climática 2030',
                    query: '¿Cómo ayuda el compostaje y la reducción de basura a mitigar las emisiones de metano en Rosario?',
                    desc: 'Estrategia de mitigación y desvío de orgánicos',
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.query)}
                    className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-xs transition-all text-left space-y-1 group cursor-pointer"
                  >
                    <span className="font-semibold text-emerald-400 text-[11px] block group-hover:text-emerald-300">
                      {item.title}
                    </span>
                    <span className="text-slate-200 text-[11px] line-clamp-2 leading-tight">
                      {item.query}
                    </span>
                    <span className="text-[10px] text-slate-500 block pt-0.5">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages Stream */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-3xl mx-auto space-y-2 w-full ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Fallback Notice Card */}
                {msg.role === 'model' && msg.fallbackNotice && (
                  <div className="w-full max-w-[95%] sm:max-w-[88%] bg-amber-950/30 border border-amber-500/40 rounded-xl p-2.5 text-xs text-amber-200 flex items-start gap-2.5 shadow-md animate-in fade-in duration-200">
                    <div className="p-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0 mt-0.5">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="font-semibold text-amber-300 text-[11px] flex flex-wrap items-center gap-1.5">
                        <span>Aviso de Conmutación por Demanda (503)</span>
                        <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200 font-mono">
                          {msg.fallbackNotice.requestedModel} ➔ {msg.fallbackNotice.usedModel}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        {msg.fallbackNotice.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Message Bubble */}
                <div
                  className={`rounded-2xl p-4 leading-relaxed shadow-sm max-w-[95%] sm:max-w-[88%] ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none text-xs sm:text-sm font-medium'
                      : msg.error
                      ? 'bg-red-950/40 border border-red-800/80 text-red-200 rounded-bl-none space-y-2 text-xs sm:text-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : msg.error ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <MarkdownMessage content={msg.content} />
                  )}

                  {/* Opened Files Badge (On-Demand Tool Calling) */}
                  {msg.role === 'model' && msg.openedFiles && msg.openedFiles.length > 0 && (
                    <div className="mt-2 p-2 bg-slate-950/70 border border-emerald-500/30 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Archivos consultados bajo demanda ({msg.openedFiles.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {msg.openedFiles.map((f, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-950/40 text-emerald-200 border border-emerald-500/30 rounded-lg text-[10px]"
                            title={f.reason || 'Documento oficial consultado'}
                          >
                            <FileText className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span className="font-medium font-mono truncate max-w-[200px]">{f.name}</span>
                            {f.reason && (
                              <span className="text-[9px] text-slate-400 border-l border-emerald-700/40 pl-1.5 hidden sm:inline">
                                {f.reason}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.error && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                          if (lastUser) {
                            handleSendMessage(lastUser.content);
                          }
                        }}
                        className="px-2.5 py-1 bg-red-800/60 hover:bg-red-700/80 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-red-600/40"
                      >
                        <RefreshCw className="w-3 h-3" /> Reintentar
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub-Card: Token, Cost & Inspector Button for Bot messages */}
                {msg.role === 'model' && msg.trace && (
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 px-1">
                    <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300 font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {msg.trace.latencyMs}ms
                    </span>
                    <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono flex items-center gap-1">
                      <Activity className="w-2.5 h-2.5" />
                      {msg.usageMetadata?.totalTokenCount} tokens
                    </span>
                    <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-300 font-mono font-bold flex items-center gap-1">
                      <DollarSign className="w-2.5 h-2.5" />
                      ${msg.cost?.totalCost.toFixed(6)} USD
                    </span>

                    {/* Button to open Inspector drawer */}
                    <button
                      onClick={() => setInspectTrace(msg.trace!)}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 transition-colors"
                    >
                      <Terminal className="w-2.5 h-2.5" />
                      Trazabilidad API 🔍
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl w-fit">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Consultando con Gemini 3.5 Flash y fuentes de Rosario...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 rounded-2xl p-1.5 focus-within:border-emerald-500 transition-colors shadow-inner"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Pregunta sobre recolección, contenedores, RAEE o composteras en Rosario..."
                disabled={isLoading}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md flex-shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* ================= FIREBASE CLOUD CHAT HISTORY DRAWER ================= */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Registro de Chats en Firebase</h3>
                  <span className="text-[10px] text-slate-400">Conversaciones guardadas en la nube</span>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 text-slate-400 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {cloudSessions.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Aún no hay conversaciones guardadas en Firebase.</p>
                  <p className="text-[11px] text-slate-500">Al enviar mensajes se registrarán aquí automáticamente.</p>
                </div>
              ) : (
                cloudSessions.map((session) => {
                  const isCurrent = session.id === sessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => handleLoadCloudSession(session)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-2 group ${
                        isCurrent
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-emerald-400" />
                          <span className="font-semibold text-slate-200">{session.authorName || 'Compañero'}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-medium">
                              Sesión actual
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(session.updatedAt || session.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={(e) => handleDeleteCloudSession(session.id, e)}
                            className="p-1 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {session.preview || session.messages?.[0]?.content || 'Sin mensajes'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded font-mono text-cyan-300">
                          {session.modelUsed || 'gemini-3.5-flash'}
                        </span>
                        <span className="font-mono">
                          {session.messageCount || session.messages?.length || 0} msgs · ${(session.totalCost || 0).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={handleNewChatSession}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Nueva Sesión
              </button>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INSPECTOR MODAL / DRAWER ================= */}
      {inspectTrace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Trazabilidad de la API (Payload Inspector)</h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {inspectTrace.model} · {inspectTrace.latencyMs}ms
                </span>
              </div>
              <button
                onClick={() => setInspectTrace(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Explicación de la llamada:
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Para responder tu consulta con <strong>{inspectTrace.model}</strong>, el chatbot tomó tu mensaje, inyectó las fuentes oficiales de Rosario, aplicó el System Prompt de aislamiento y lo envió al endpoint oficial de Gemini.
                </p>
              </div>

              {/* Tokens & Cost Card */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Tokens Entrada</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {inspectTrace.response.usageMetadata.promptTokenCount}
                  </div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Tokens Salida</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {inspectTrace.response.usageMetadata.candidatesTokenCount}
                  </div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 font-semibold">Coste Total</div>
                  <div className="text-sm font-bold text-emerald-300 font-mono">
                    ${(
                      ((inspectTrace.response.usageMetadata.promptTokenCount || 0) / 1_000_000) * selectedModelObj.inputPrice1M +
                      ((inspectTrace.response.usageMetadata.candidatesTokenCount || 0) / 1_000_000) * selectedModelObj.outputPrice1M
                    ).toFixed(6)} USD
                  </div>
                </div>
              </div>

              {/* JSON Sections */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-400 font-semibold">📤 Request Payload (Enviado a Gemini)</span>
                  <button
                    onClick={() => copyText(JSON.stringify(inspectTrace.request, null, 2), 'trace-req')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 flex items-center gap-1"
                  >
                    {copiedKey === 'trace-req' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copiar JSON
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(inspectTrace.request, null, 2)}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-semibold">📥 Response Payload (Recibido de Gemini)</span>
                  <button
                    onClick={() => copyText(JSON.stringify(inspectTrace.response, null, 2), 'trace-res')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 flex items-center gap-1"
                  >
                    {copiedKey === 'trace-res' ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                    Copiar JSON
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(inspectTrace.response, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectTrace(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SYSTEM PROMPT MODAL ================= */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Editar System Prompt del Chatbot
              </h3>
              <button onClick={() => setShowPromptModal(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Controla las directivas de respuesta y el aislamiento de fuentes oficiales.
            </p>
            <textarea
              rows={10}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Restaurar Predeterminado
              </button>
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Guardar Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD SOURCE MODAL ================= */}
      {showAddSourceModal !== 'none' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Añadir Fuente de Información
              </h3>
              <button onClick={() => setShowAddSourceModal('none')} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            {/* Tab selection */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setShowAddSourceModal('upload')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  showAddSourceModal === 'upload' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                📄 Subir PDF/Doc
              </button>
              <button
                onClick={() => setShowAddSourceModal('url')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  showAddSourceModal === 'url' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                🌐 URL Web
              </button>
              <button
                onClick={() => setShowAddSourceModal('text')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  showAddSourceModal === 'text' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                ✍️ Texto
              </button>
            </div>

            {sourceError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-2.5 rounded-lg text-xs">
                {sourceError}
              </div>
            )}

            {/* Upload Option */}
            {showAddSourceModal === 'upload' && (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950"
                >
                  <Upload className="w-7 h-7 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-slate-200">
                    Haz clic para seleccionar un archivo PDF o TXT
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Los PDFs se procesan con visión multimodal nativa de Gemini.
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

            {/* URL Option */}
            {showAddSourceModal === 'url' && (
              <form onSubmit={handleScrapeUrl} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    URL de la página (ej. rosario.gob.ar):
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.rosario.gob.ar/inicio/..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={urlLoading}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {urlLoading ? 'Descargando contenido...' : 'Importar Web'}
                  </button>
                </div>
              </form>
            )}

            {/* Text Option */}
            {showAddSourceModal === 'text' && (
              <form onSubmit={handleAddManualText} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nombre:</label>
                  <input
                    type="text"
                    required
                    placeholder="Normativa_Local.txt"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contenido:</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Pega aquí el contenido que el chatbot debe conocer..."
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs"
                  >
                    Guardar Fuente
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= API KEY MODAL ================= */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                Configurar API Key
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              El chatbot ya utiliza la clave del servidor por defecto. Si prefieres usar tu propia clave de Google AI Studio, puedes ingresarla aquí:
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => handleSaveKey('')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Restaurar Servidor
              </button>
              <button
                type="button"
                onClick={() => handleSaveKey(customApiKey)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DOCUMENT PREVIEW MODAL ================= */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <h3 className="text-xs font-bold text-white truncate">{previewDoc.name}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 text-xs space-y-3">
              {previewDoc.description && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>{previewDoc.description}</span>
                </div>
              )}

              {previewDoc.type === 'pdf' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200">
                    Documento PDF oficial procesado con la visión multimodal de Gemini:
                  </div>
                  {previewDoc.content && (
                    <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                      {previewDoc.content}
                    </pre>
                  )}
                  <div className="text-[10px] text-slate-500 font-mono">
                    Stream base64 PDF: {previewDoc.data?.length || 0} caracteres
                  </div>
                </div>
              ) : (
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {previewDoc.content}
                </pre>
              )}
            </div>
            <div className="p-3 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => copyText(previewDoc.content || previewDoc.data || '', 'doc-copy')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5"
              >
                {copiedKey === 'doc-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copiar Contenido
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
