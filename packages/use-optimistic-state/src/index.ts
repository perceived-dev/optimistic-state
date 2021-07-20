import { useState } from 'react';
import optimisticState from '@perceived/optimistic-state';

export default function useOptimisticState<T, R = any>(
  initialState: T,
  routine: (state: T) => Promise<R>,
) {
  const [state, setState] = useState<T>(initialState);
  const [result, setResult] = useState<R>();
  const [error, setError] = useState();

  const updateState = optimisticState<T, R>({
    initialState,
    routine,
    handleState: setState,
    handleResult: setResult,
    handleError: setError,
  });

  return [state, updateState, error, result];
}
