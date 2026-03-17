/**
 * Background Sync Manager
 * Handles offline operation queueing and synchronization
 */

import { db } from '@/lib/db';

// ============================================================================
// Types
// ============================================================================

export type SyncOperationType = 
  | 'CREATE_HIGHLIGHT'
  | 'UPDATE_HIGHLIGHT'
  | 'DELETE_HIGHLIGHT'
  | 'CREATE_GROUP'
  | 'UPDATE_GROUP'
  | 'DELETE_GROUP'
  | 'MOVE_HIGHLIGHT'
  | 'ADD_CLUE_CARD'
  | 'UPDATE_CLUE_CARD'
  | 'DELETE_CLUE_CARD'
  | 'UPDATE_BRIEF';

export interface SyncOperation {
  id?: number;
  type: SyncOperationType;
  payload: Record<string, unknown>;
  paperId?: number;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}

export interface SyncConflict {
  operationId: number;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  timestamp: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error';

export interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncTime: Date | null;
  error: string | null;
  conflicts: SyncConflict[];
}

// ============================================================================
// Sync Queue Database Schema
// ============================================================================

// Extend Dexie database for sync queue
interface SyncDB {
  syncQueue: {
    add(operation: SyncOperation): Promise<number>;
    where(params: Record<string, unknown>): {
      equals(value: unknown): {
        toArray(): Promise<SyncOperation[]>;
        count(): Promise<number>;
        delete(): Promise<number>;
      };
    };
    delete(id: number): Promise<void>;
    toArray(): Promise<SyncOperation[]>;
    clear(): Promise<void>;
  };
}

// ============================================================================
// Sync Queue Manager
// ============================================================================

class BackgroundSyncManager {
  private isProcessing: boolean = false;
  private statusListeners: ((state: SyncState) => void)[] = [];
  private currentState: SyncState = {
    status: 'idle',
    pendingCount: 0,
    lastSyncTime: null,
    error: null,
    conflicts: [],
  };

  constructor() {
    // Initialize from localStorage if available
    this.loadState();
    
    // Listen for online events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.triggerSync();
      });
    }
  }

  // ========================================================================
  // State Management
  // ========================================================================

  private loadState(): void {
    if (typeof window === 'undefined') return;
    
    const saved = localStorage.getItem('syncState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentState = {
          ...this.currentState,
          ...parsed,
          lastSyncTime: parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null,
        };
      } catch {
        // Ignore parse errors
      }
    }
  }

  private saveState(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('syncState', JSON.stringify({
      ...this.currentState,
      lastSyncTime: this.currentState.lastSyncTime?.toISOString(),
    }));
  }

  private updateState(updates: Partial<SyncState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.saveState();
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.statusListeners.forEach(listener => listener(this.currentState));
  }

  // ========================================================================
  // Queue Operations
  // ========================================================================

  /**
   * Add an operation to the sync queue
   */
  async queueOperation(
    type: SyncOperationType,
    payload: Record<string, unknown>,
    paperId?: number
  ): Promise<number> {
    // Store in IndexedDB for persistence
    const operation: Omit<SyncOperation, 'id'> = {
      type,
      payload,
      paperId,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    try {
      // Use localStorage as a simple queue (can be enhanced with IndexedDB)
      const queue = this.getQueue();
      const id = Date.now() + Math.random();
      const operationWithId = { ...operation, id };
      queue.push(operationWithId);
      this.saveQueue(queue);

      // Update pending count
      this.updateState({ 
        pendingCount: queue.filter(op => op.status === 'pending').length 
      });

      // Try to sync immediately if online
      if (navigator.onLine) {
        this.triggerSync();
      }

      return id;
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  }

  /**
   * Get all queued operations
   */
  private getQueue(): SyncOperation[] {
    if (typeof window === 'undefined') return [];
    
    const saved = localStorage.getItem('syncQueue');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(queue: SyncOperation[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('syncQueue', JSON.stringify(queue));
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.currentState };
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.statusListeners.push(listener);
    // Immediately notify with current state
    listener(this.currentState);
    
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  // ========================================================================
  // Sync Processing
  // ========================================================================

  /**
   * Trigger sync process
   */
  async triggerSync(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;

    const queue = this.getQueue();
    const pendingOps = queue.filter(op => op.status === 'pending');

    if (pendingOps.length === 0) {
      this.updateState({ status: 'idle' });
      return;
    }

    this.isProcessing = true;
    this.updateState({ status: 'syncing', error: null });

    try {
      for (const operation of pendingOps) {
        await this.processOperation(operation);
      }

      this.updateState({
        status: 'completed',
        lastSyncTime: new Date(),
        pendingCount: 0,
      });
    } catch (error) {
      console.error('Sync failed:', error);
      this.updateState({
        status: 'error',
        error: error instanceof Error ? error.message : '同步失败',
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    // Mark as processing
    this.updateOperationStatus(operation.id!, 'processing');

    try {
      const result = await this.executeOperation(operation);
      
      if (result.success) {
        // Remove from queue
        this.removeFromQueue(operation.id!);
      } else if (result.conflict) {
        // Handle conflict
        this.handleConflict(operation, result.serverData ?? {});
      } else {
        // Mark as failed
        this.updateOperationStatus(operation.id!, 'failed', result.error);
      }
    } catch (error) {
      // Retry logic
      if (operation.retryCount < 3) {
        operation.retryCount++;
        this.updateOperation(operation);
        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, 1000 * operation.retryCount));
        await this.processOperation(operation);
      } else {
        this.updateOperationStatus(
          operation.id!, 
          'failed', 
          error instanceof Error ? error.message : '执行失败'
        );
      }
    }
  }

  /**
   * Execute operation on server
   */
  private async executeOperation(
    operation: SyncOperation
  ): Promise<{ success: boolean; conflict?: boolean; serverData?: Record<string, unknown>; error?: string }> {
    const endpoint = this.getEndpointForOperation(operation.type);
    const method = this.getMethodForOperation(operation.type);

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...operation.payload,
        clientTimestamp: operation.timestamp,
      }),
    });

    if (response.status === 409) {
      // Conflict detected
      const serverData = await response.json();
      return { success: false, conflict: true, serverData };
    }

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  }

  /**
   * Get API endpoint for operation type
   */
  private getEndpointForOperation(type: SyncOperationType): string {
    const endpoints: Record<SyncOperationType, string> = {
      CREATE_HIGHLIGHT: '/api/highlights',
      UPDATE_HIGHLIGHT: '/api/highlights',
      DELETE_HIGHLIGHT: '/api/highlights',
      CREATE_GROUP: '/api/groups',
      UPDATE_GROUP: '/api/groups',
      DELETE_GROUP: '/api/groups',
      MOVE_HIGHLIGHT: '/api/highlights/move',
      ADD_CLUE_CARD: '/api/ai/clue-cards',
      UPDATE_CLUE_CARD: '/api/ai/clue-cards',
      DELETE_CLUE_CARD: '/api/ai/clue-cards',
      UPDATE_BRIEF: '/api/ai/intelligence-brief',
    };
    return endpoints[type] || '/api/sync';
  }

  /**
   * Get HTTP method for operation type
   */
  private getMethodForOperation(type: SyncOperationType): string {
    if (type.startsWith('CREATE') || type.startsWith('ADD')) return 'POST';
    if (type.startsWith('UPDATE')) return 'PUT';
    if (type.startsWith('DELETE')) return 'DELETE';
    return 'POST';
  }

  // ========================================================================
  // Conflict Resolution
  // ========================================================================

  /**
   * Handle sync conflict
   */
  private handleConflict(
    operation: SyncOperation,
    serverData: Record<string, unknown>
  ): void {
    const conflict: SyncConflict = {
      operationId: operation.id!,
      localData: operation.payload,
      serverData,
      timestamp: new Date().toISOString(),
    };

    this.updateState({
      conflicts: [...this.currentState.conflicts, conflict],
    });

    // Mark operation as failed with conflict
    this.updateOperationStatus(operation.id!, 'failed', '数据冲突');
  }

  /**
   * Resolve conflict by choosing local or server version
   */
  resolveConflict(operationId: number, useLocal: boolean): void {
    const conflict = this.currentState.conflicts.find(c => c.operationId === operationId);
    if (!conflict) return;

    if (useLocal) {
      // Force sync with local data
      const queue = this.getQueue();
      const operation = queue.find(op => op.id === operationId);
      if (operation) {
        operation.retryCount = 0;
        operation.status = 'pending';
        this.saveQueue(queue);
        this.triggerSync();
      }
    } else {
      // Discard local changes
      this.removeFromQueue(operationId);
    }

    // Remove conflict from list
    this.updateState({
      conflicts: this.currentState.conflicts.filter(c => c.operationId !== operationId),
    });
  }

  // ========================================================================
  // Queue Management
  // ========================================================================

  private updateOperationStatus(id: number, status: SyncOperation['status'], error?: string): void {
    const queue = this.getQueue();
    const index = queue.findIndex(op => op.id === id);
    if (index > -1) {
      queue[index] = { ...queue[index], status, error };
      this.saveQueue(queue);
    }
  }

  private updateOperation(operation: SyncOperation): void {
    const queue = this.getQueue();
    const index = queue.findIndex(op => op.id === operation.id);
    if (index > -1) {
      queue[index] = operation;
      this.saveQueue(queue);
    }
  }

  private removeFromQueue(id: number): void {
    const queue = this.getQueue().filter(op => op.id !== id);
    this.saveQueue(queue);
    this.updateState({ pendingCount: queue.filter(op => op.status === 'pending').length });
  }

  // ========================================================================
  // Public Utilities
  // ========================================================================

  /**
   * Clear all pending operations
   */
  clearQueue(): void {
    localStorage.removeItem('syncQueue');
    this.updateState({ pendingCount: 0, status: 'idle' });
  }

  /**
   * Retry failed operations
   */
  retryFailed(): void {
    const queue = this.getQueue();
    const updated: SyncOperation[] = queue.map(op => 
      op.status === 'failed' ? { ...op, status: 'pending', retryCount: 0 } : op
    );
    this.saveQueue(updated);
    this.updateState({ 
      pendingCount: updated.filter(op => op.status === 'pending').length 
    });
    this.triggerSync();
  }

  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return this.getQueue().filter(op => op.status === 'pending').length;
  }

  /**
   * Check if there are pending operations
   */
  hasPendingOperations(): boolean {
    return this.getPendingCount() > 0;
  }
}

// Export singleton instance
export const syncManager = new BackgroundSyncManager();

// Export hooks for React
export function useSync() {
  return {
    queueOperation: (type: SyncOperationType, payload: Record<string, unknown>, paperId?: number) =>
      syncManager.queueOperation(type, payload, paperId),
    triggerSync: () => syncManager.triggerSync(),
    clearQueue: () => syncManager.clearQueue(),
    retryFailed: () => syncManager.retryFailed(),
    resolveConflict: (operationId: number, useLocal: boolean) =>
      syncManager.resolveConflict(operationId, useLocal),
    getState: () => syncManager.getState(),
    subscribe: (listener: (state: SyncState) => void) => syncManager.subscribe(listener),
    getPendingCount: () => syncManager.getPendingCount(),
    hasPendingOperations: () => syncManager.hasPendingOperations(),
  };
}

export default syncManager;
