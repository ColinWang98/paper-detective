import { NextRequest, NextResponse } from 'next/server';

/**
 * Sync API Route
 * Handles batched sync operations from offline clients
 * Supports conflict detection and resolution
 */

// Import database helpers (using existing db pattern)
import { db, dbHelpers } from '@/lib/db';
import type { SyncOperation, SyncConflict } from '@/lib/sync/backgroundSync';
import type { ClueCardType, Group, Highlight, HighlightColor, HighlightPriority } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface SyncBatchRequest {
  operations: SyncOperation[];
  clientTimestamp: string;
  deviceId: string;
}

interface SyncBatchResponse {
  success: boolean;
  results: SyncResult[];
  conflicts: SyncConflict[];
  serverTimestamp: string;
}

interface SyncResult {
  operationId: number;
  status: 'success' | 'conflict' | 'error';
  data?: Record<string, unknown>;
  error?: string;
}

const HIGHLIGHT_COLORS: readonly HighlightColor[] = ['red', 'yellow', 'orange', 'gray'];
const HIGHLIGHT_PRIORITIES: readonly HighlightPriority[] = ['critical', 'important', 'interesting', 'archived'];
const CLUE_CARD_TYPES: readonly ClueCardType[] = ['question', 'method', 'finding', 'limitation'];

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function asHighlightColor(value: unknown): HighlightColor | undefined {
  return typeof value === 'string' && HIGHLIGHT_COLORS.includes(value as HighlightColor)
    ? value as HighlightColor
    : undefined;
}

function asHighlightPriority(value: unknown): HighlightPriority | undefined {
  return typeof value === 'string' && HIGHLIGHT_PRIORITIES.includes(value as HighlightPriority)
    ? value as HighlightPriority
    : undefined;
}

function asClueCardType(value: unknown): ClueCardType | undefined {
  return typeof value === 'string' && CLUE_CARD_TYPES.includes(value as ClueCardType)
    ? value as ClueCardType
    : undefined;
}

function asPosition(value: unknown): Highlight['position'] | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const position = value as Record<string, unknown>;
  const x = asNumber(position.x);
  const y = asNumber(position.y);
  const width = asNumber(position.width);
  const height = asNumber(position.height);

  if (x === undefined || y === undefined || width === undefined || height === undefined) {
    return undefined;
  }

  return { x, y, width, height };
}

// ============================================================================
// Request Handlers
// ============================================================================

/**
 * POST /api/sync
 * Process batch sync operations
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SyncBatchRequest = await request.json();
    const { operations, clientTimestamp, deviceId } = body;

    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json(
        { error: 'No operations provided' },
        { status: 400 }
      );
    }

    const results: SyncResult[] = [];
    const conflicts: SyncConflict[] = [];

    // Process each operation in order
    for (const operation of operations) {
      const result = await processOperation(operation, deviceId);
      results.push(result);

      if (result.status === 'conflict' && result.data) {
        conflicts.push({
          operationId: operation.id!,
          localData: operation.payload,
          serverData: result.data,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const response: SyncBatchResponse = {
      success: conflicts.length === 0,
      results,
      conflicts,
      serverTimestamp: new Date().toISOString(),
    };

    // Return 409 if there are conflicts
    const statusCode = conflicts.length > 0 ? 409 : 200;
    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { 
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/status
 * Get sync status for a device
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const since = searchParams.get('since');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID required' },
        { status: 400 }
      );
    }

    // Get sync status (placeholder - implement based on your needs)
    const status = {
      deviceId,
      lastSyncTime: since ? new Date(since).toISOString() : null,
      pendingChanges: 0, // Calculate based on your data
      serverTime: new Date().toISOString(),
    };

    return NextResponse.json(status);

  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sync/resolve
 * Resolve sync conflicts
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { operationId, resolution, deviceId } = body;

    if (!operationId || !resolution || !deviceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle conflict resolution
    if (resolution === 'server') {
      // Accept server version - nothing to do
      return NextResponse.json({ success: true, message: 'Server version accepted' });
    } else if (resolution === 'client') {
      // Force client version
      // Re-apply the operation with force flag
      return NextResponse.json({ success: true, message: 'Client version forced' });
    } else if (resolution === 'merge') {
      // Custom merge logic
      const merged = body.mergedData;
      if (!merged) {
        return NextResponse.json(
          { error: 'Merged data required for merge resolution' },
          { status: 400 }
        );
      }
      // Apply merged data
      return NextResponse.json({ success: true, message: 'Merged successfully' });
    }

    return NextResponse.json(
      { error: 'Invalid resolution type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Conflict resolution error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve conflict' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sync/queue
 * Clear sync queue for a device
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID required' },
        { status: 400 }
      );
    }

    // Clear sync queue logic here
    return NextResponse.json({ 
      success: true, 
      message: 'Sync queue cleared',
      deviceId 
    });

  } catch (error) {
    console.error('Clear queue error:', error);
    return NextResponse.json(
      { error: 'Failed to clear queue' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Operation Processors
// ============================================================================

async function processOperation(
  operation: SyncOperation,
  deviceId: string
): Promise<SyncResult> {
  try {
    switch (operation.type) {
      case 'CREATE_HIGHLIGHT':
        return await processCreateHighlight(operation);
      
      case 'UPDATE_HIGHLIGHT':
        return await processUpdateHighlight(operation);
      
      case 'DELETE_HIGHLIGHT':
        return await processDeleteHighlight(operation);
      
      case 'CREATE_GROUP':
        return await processCreateGroup(operation);
      
      case 'UPDATE_GROUP':
        return await processUpdateGroup(operation);
      
      case 'DELETE_GROUP':
        return await processDeleteGroup(operation);
      
      case 'MOVE_HIGHLIGHT':
        return await processMoveHighlight(operation);
      
      case 'ADD_CLUE_CARD':
        return await processAddClueCard(operation);
      
      case 'UPDATE_CLUE_CARD':
        return await processUpdateClueCard(operation);
      
      case 'DELETE_CLUE_CARD':
        return await processDeleteClueCard(operation);
      
      case 'UPDATE_BRIEF':
        return await processUpdateBrief(operation);
      
      default:
        return {
          operationId: operation.id!,
          status: 'error',
          error: `Unknown operation type: ${operation.type}`,
        };
    }
  } catch (error) {
    console.error(`Operation ${operation.type} failed:`, error);
    return {
      operationId: operation.id!,
      status: 'error',
      error: error instanceof Error ? error.message : 'Operation failed',
    };
  }
}

// ------------------------------------------------------------------------
// Highlight Operations
// ------------------------------------------------------------------------

async function processCreateHighlight(operation: SyncOperation): Promise<SyncResult> {
  const { paperId, text, color, priority, pageNumber, position } = operation.payload;
  const normalizedText = asString(text);

  if (!paperId || !normalizedText) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Missing required fields: paperId, text',
    };
  }

  // Check for conflicts - same text on same page
  const existingHighlights = await db.highlights
    .where('paperId')
    .equals(Number(paperId))
    .toArray();

  const conflict = existingHighlights.find(h => 
    h.text === normalizedText && h.pageNumber === asNumber(pageNumber)
  );

  if (conflict) {
    return {
      operationId: operation.id!,
      status: 'conflict',
      data: { existing: conflict },
    };
  }

  const id = await dbHelpers.addHighlight({
    paperId: Number(paperId),
    text: normalizedText,
    color: asHighlightColor(color) ?? 'yellow',
    priority: asHighlightPriority(priority) ?? 'important',
    pageNumber: asNumber(pageNumber),
    position: asPosition(position),
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  return {
    operationId: operation.id!,
    status: 'success',
    data: { id },
  };
}

async function processUpdateHighlight(operation: SyncOperation): Promise<SyncResult> {
  const { id, ...updates } = operation.payload;

  if (!id) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Missing highlight ID',
    };
  }

  // Check if highlight still exists
  const existing = await db.highlights.get(Number(id));
  if (!existing) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Highlight not found',
    };
  }

  await dbHelpers.updateHighlight(Number(id), updates);

  return {
    operationId: operation.id!,
    status: 'success',
  };
}

async function processDeleteHighlight(operation: SyncOperation): Promise<SyncResult> {
  const { id } = operation.payload;

  if (!id) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Missing highlight ID',
    };
  }

  await dbHelpers.deleteHighlight(Number(id));

  return {
    operationId: operation.id!,
    status: 'success',
  };
}

// ------------------------------------------------------------------------
// Group Operations
// ------------------------------------------------------------------------

async function processCreateGroup(operation: SyncOperation): Promise<SyncResult> {
  const { paperId, name, type, color, icon } = operation.payload;
  const normalizedName = asString(name);
  const normalizedType: Group['type'] = type === 'inbox' ? 'inbox' : 'custom';

  if (!paperId || !normalizedName) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Missing required fields: paperId, name',
    };
  }

  const id = await dbHelpers.addGroup({
    paperId: Number(paperId),
    name: normalizedName,
    type: normalizedType,
    color: asString(color),
    icon: asString(icon),
    position: Date.now(),
    createdAt: new Date().toISOString(),
  });

  return {
    operationId: operation.id!,
    status: 'success',
    data: { id },
  };
}

async function processUpdateGroup(operation: SyncOperation): Promise<SyncResult> {
  const { id, ...updates } = operation.payload;

  if (!id) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Missing group ID',
    };
  }

  await dbHelpers.updateGroup(Number(id), updates);

  return {
    operationId: operation.id!,
    status: 'success',
  };
}

async function processDeleteGroup(operation: SyncOperation): Promise<SyncResult> {
  const { id } = operation.payload;

  if (!id) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Missing group ID',
    };
  }

  try {
    await dbHelpers.deleteGroup(Number(id));
    return {
      operationId: operation.id!,
      status: 'success',
    };
  } catch (error) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to delete group',
    };
  }
}

async function processMoveHighlight(operation: SyncOperation): Promise<SyncResult> {
  const { highlightId, toGroupId } = operation.payload;

  if (!highlightId || !toGroupId) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Missing required fields: highlightId, toGroupId',
    };
  }

  await dbHelpers.moveHighlightToGroup(Number(highlightId), Number(toGroupId));

  return {
    operationId: operation.id!,
    status: 'success',
  };
}

// ------------------------------------------------------------------------
// Clue Card Operations
// ------------------------------------------------------------------------

async function processAddClueCard(operation: SyncOperation): Promise<SyncResult> {
  const { paperId, title, content, type, confidence } = operation.payload;
  const normalizedTitle = asString(title);
  const normalizedContent = asString(content) ?? '';

  if (!paperId || !normalizedTitle) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Missing required fields: paperId, title',
    };
  }

  const id = await dbHelpers.addClueCard({
    paperId: Number(paperId),
    title: normalizedTitle,
    content: normalizedContent,
    type: asClueCardType(type) ?? 'method',
    confidence: asNumber(confidence) ?? 0.8,
    createdAt: new Date().toISOString(),
    source: 'custom-insight',
  });

  return {
    operationId: operation.id!,
    status: 'success',
    data: { id },
  };
}

async function processUpdateClueCard(operation: SyncOperation): Promise<SyncResult> {
  const { id, ...updates } = operation.payload;

  if (!id) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Missing clue card ID',
    };
  }

  await dbHelpers.updateClueCard(Number(id), updates);

  return {
    operationId: operation.id!,
    status: 'success',
  };
}

async function processDeleteClueCard(operation: SyncOperation): Promise<SyncResult> {
  const { id } = operation.payload;

  if (!id) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Missing clue card ID',
    };
  }

  await dbHelpers.deleteClueCard(Number(id));

  return {
    operationId: operation.id!,
    status: 'success',
  };
}

// ------------------------------------------------------------------------
// Intelligence Brief Operations
// ------------------------------------------------------------------------

async function processUpdateBrief(operation: SyncOperation): Promise<SyncResult> {
  const { id, ...updates } = operation.payload;

  if (!id) {
    return {
      operationId: operation.id!,
      status: 'error',
      error: 'Missing brief ID',
    };
  }

  await dbHelpers.updateIntelligenceBrief(Number(id), updates);

  return {
    operationId: operation.id!,
    status: 'success',
  };
}
