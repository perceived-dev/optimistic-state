import { useState, useRef, useMemo } from 'react';
import optimisticState from '@perceived/optimistic-state';

export type HookResult<T, R, E> = {
  state: T;
  updateState: (state: T, ...args: any[]) => void;
  loading: boolean;
  result?: R;
  error?: E;
};

export default function useOptimisticState<T, R = any, E = any>(
  initialState: T,
  routine: (state: T, ...args: any[]) => Promise<R>,
): HookResult<T, R, E> {
  const [state, setState] = useState<T>(initialState);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<R>();
  const [error, setError] = useState<E>();
  const routineRef = useRef(routine);

  // keep the routine ref upto date
  routineRef.current = routine;

  const updateState = useMemo(() => {
    return optimisticState<T, R, E>({
      initialState,
      routine: (state: T, ...args: any[]) => {
        setLoading(true);
        return routineRef.current(state, ...args);
      },
      handleState: setState,
      handleResult: (res) => {
        setLoading(false);
        setResult(res);
      },
      handleError: (err) => {
        setLoading(false);
        setError(err);
      },
    });
  }, []);

  return { state, updateState, loading, error, result };
}
