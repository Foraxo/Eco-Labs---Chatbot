import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ChatMessage } from '../types';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Pass firestoreDatabaseId as required
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || 'shared-passcode-user',
      email: auth.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on boot as required by Firebase SKILL.md
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
    }
    // Non-fatal if test doc doesn't exist
    return true;
  }
}

export interface SavedChatSession {
  id: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  modelUsed: string;
  totalCost: number;
  totalTokens: number;
  messageCount: number;
  preview: string;
  messages: ChatMessage[];
}

/**
 * Saves or updates a full chat session in Firestore
 */
export async function syncSessionToFirestore(session: SavedChatSession): Promise<void> {
  const path = `chatSessions/${session.id}`;
  try {
    const docRef = doc(db, 'chatSessions', session.id);
    // Sanitize messages array so no undefined properties break Firestore
    const cleanMessages = session.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content || '',
      timestamp: m.timestamp || new Date().toISOString(),
      ...(m.cost ? { cost: m.cost } : {}),
      ...(m.usageMetadata ? { usageMetadata: m.usageMetadata } : {}),
      ...(m.fallbackNotice ? { fallbackNotice: m.fallbackNotice } : {}),
      ...(m.error ? { error: m.error } : {}),
    }));

    await setDoc(
      docRef,
      {
        id: session.id,
        authorName: session.authorName || 'Compañero',
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        modelUsed: session.modelUsed,
        totalCost: Number(session.totalCost || 0),
        totalTokens: Number(session.totalTokens || 0),
        messageCount: session.messages.length,
        preview: session.preview || (session.messages[0]?.content.substring(0, 80) ?? 'Chat iniciado'),
        messages: cleanMessages,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Saves a single prompt-response log in Firestore
 */
export async function saveSingleChatLog(log: {
  id: string;
  sessionId: string;
  authorName: string;
  query: string;
  reply: string;
  model: string;
  timestamp: string;
  latencyMs?: number;
  tokens?: number;
  costUsd?: number;
}): Promise<void> {
  const path = `chatLogs/${log.id}`;
  try {
    const docRef = doc(db, 'chatLogs', log.id);
    await setDoc(docRef, {
      id: log.id,
      sessionId: log.sessionId,
      authorName: log.authorName || 'Compañero',
      query: log.query.substring(0, 15000),
      reply: log.reply.substring(0, 45000),
      model: log.model,
      timestamp: log.timestamp,
      latencyMs: log.latencyMs || 0,
      tokens: log.tokens || 0,
      costUsd: log.costUsd || 0,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Subscribe in real-time to shared chat sessions
 */
export function subscribeToSavedSessions(
  callback: (sessions: SavedChatSession[]) => void,
  onError?: (err: any) => void
) {
  const collectionPath = 'chatSessions';
  try {
    const q = query(collection(db, collectionPath), orderBy('updatedAt', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: SavedChatSession[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SavedChatSession);
        });
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscription status:', error.message || error);
        if (onError) {
          onError(error);
        }
      }
    );
  } catch (error) {
    console.warn('Firestore subscription init error:', error);
    if (onError) {
      onError(error);
    }
  }
}

/**
 * Deletes a session from Firestore
 */
export async function deleteFirestoreSession(sessionId: string): Promise<void> {
  const path = `chatSessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'chatSessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
