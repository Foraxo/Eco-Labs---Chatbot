export type ModelId = string;

export interface ModelOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  inputPrice1M: number;
  outputPrice1M: number;
  contextWindow: string;
  isPaid?: boolean;
}

export interface SourceDocument {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'url' | 'doc';
  content?: string;
  mimeType?: string;
  data?: string; // base64 representation
  size?: number; // bytes
  enabled: boolean;
  addedAt: string;
  description?: string;
}

export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface CostCalculation {
  model: string;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  formattedTotal: string;
  rates: {
    inputPer1M: number;
    outputPer1M: number;
  };
}

export interface ApiTrace {
  id: string;
  timestamp: string;
  model: string;
  latencyMs: number;
  request: {
    model: string;
    config: {
      systemInstruction: string;
      temperature: number;
      topP: number;
    };
    contents: Array<{
      role: 'user' | 'model';
      parts: Array<{
        type: string;
        textLength?: number;
        mimeType?: string;
        dataLengthBase64?: number;
        preview: string;
      }>;
    }>;
    sourcesAttached: Array<{
      id: string;
      name: string;
      type: string;
      mimeType?: string;
      sizeBytes?: number;
      charCount?: number;
      snippet?: string;
      status: string;
    }>;
  };
  response: {
    finishReason: string;
    usageMetadata: UsageMetadata;
    latencyMs: number;
    safetyRatings?: any[];
  };
}

export interface FallbackNotice {
  requestedModel: string;
  usedModel: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  sourcesUsed?: string[];
  openedFiles?: Array<{
    name: string;
    type?: string;
    reason?: string;
  }>;
  usageMetadata?: UsageMetadata;
  cost?: CostCalculation;
  trace?: ApiTrace;
  fallbackNotice?: FallbackNotice;
  error?: boolean;
}
