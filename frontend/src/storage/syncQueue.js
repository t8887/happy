/**
 * Lightweight offline sync queue.
 *
 * Mutations that fail while offline are saved here as JSON.
 * When the device comes back online, `flushSyncQueue()` replays them
 * in the order they were enqueued.
 *
 * Supported operations: 'createTask' | 'completeTask' | 'deleteTask'
 */
import storage from './storage';
import { CACHE_SYNC_QUEUE } from './cacheKeys';
import api from '../services/api';

// ─ Persistence helpers ────────────────────────────────────────────────────────

function readQueue() {
  try {
    const raw = storage.getString(CACHE_SYNC_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  storage.setString(CACHE_SYNC_QUEUE, JSON.stringify(queue));
}

// ─ Public API ─────────────────────────────────────────────────────────────────

/** Add a pending mutation to the queue. */
export function enqueueMutation(op, payload) {
  const queue = readQueue();
  queue.push({ op, payload, enqueuedAt: Date.now() });
  writeQueue(queue);
}

/** Return current queue length (useful for debug / badge). */
export function getSyncQueueLength() {
  return readQueue().length;
}

/**
 * Replay all queued mutations against the API.
 * Each item is removed from the queue only after a successful API call.
 * Returns { flushed, failed } counts.
 */
export async function flushSyncQueue(queryClient) {
  const queue = readQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed  = 0;
  const remaining = [];

  for (const item of queue) {
    try {
      await replay(item);
      flushed++;
    } catch {
      // Keep failed items for next attempt
      remaining.push(item);
      failed++;
    }
  }

  writeQueue(remaining);

  // Invalidate affected queries so UI refreshes
  if (flushed > 0 && queryClient) {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['streak'] });
  }

  return { flushed, failed };
}

// ─ Per-operation replay ───────────────────────────────────────────────────────

async function replay({ op, payload }) {
  switch (op) {
    case 'createTask':
      await api.post('/tasks', payload);
      break;
    case 'completeTask':
      await api.patch(`/tasks/${payload.taskId}/complete`);
      break;
    case 'deleteTask':
      await api.delete(`/tasks/${payload.taskId}`);
      break;
    default:
      // Unknown op — drop silently rather than blocking the queue
      break;
  }
}
