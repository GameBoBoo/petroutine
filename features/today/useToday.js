"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function useToday({ householdId, api }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [undo, setUndo] = useState(null);
  const timer = useRef(null);
  const load = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    try { setTasks((await api(`/households/${householdId}/tasks/today`)).tasks || []); setError(''); }
    catch (problem) { setError(problem.message); }
    finally { setLoading(false); }
  }, [api, householdId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const mutate = useCallback(async (task, action, payload = {}) => {
    const method = ['complete', 'skip'].includes(action) ? 'POST' : 'PATCH';
    const path = method === 'POST' ? `/tasks/${task.id}/${action}` : `/tasks/${task.id}`;
    try {
      const result = await api(path, { method, headers: { 'idempotency-key': crypto.randomUUID() }, body: JSON.stringify({ ...payload, action, expected_version: task.mutation_version }) });
      setUndo(result.activity || null);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setUndo(null), 8000);
      await load();
      return result;
    } catch (problem) {
      if (problem.status === 409) await load();
      throw problem;
    }
  }, [api, load]);
  const undoLast = useCallback(async () => {
    if (!undo) return;
    await api(`/activity/${undo.id}/undo`, { method: 'POST', body: '{}' });
    setUndo(null);
    await load();
  }, [api, load, undo]);
  return useMemo(() => ({ tasks, loading, error, undo, load, mutate, undoLast, dismissUndo: () => setUndo(null) }), [tasks, loading, error, undo, load, mutate, undoLast]);
}
