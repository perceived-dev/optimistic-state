import { renderHook, act } from '@testing-library/react-hooks';
import useOptimisticState, { HookResult } from '../src/index';

type Action = {
  state: number;
  type: 'success' | 'error';
  delay: number;
  result?: string;
  error?: any;
};

type StateData = HookResult<number, string, any>;

function wait(delay: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null);
    }, delay);
  });
}

function withSuccess(data: any, delay: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
}

function withError(err: any, delay: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(err);
    }, delay);
  });
}

function processActions(actions: Action[], optimisticHandler: (...args: any[]) => void) {
  actions.forEach((action) => {
    optimisticHandler(action.state, action);
  });
}

function routine(state: number, action: Action) {
  if (action.type === 'success') {
    return withSuccess(action.result, action.delay);
  } else {
    return withError(action.error, action.delay);
  }
}

describe('Test optimistic-state', () => {
  it('should optimistically update state and give result when resolved', async () => {
    const actions: Action[] = [{ state: 1, type: 'success', delay: 300, result: 'Result for 1' }];

    const { result } = renderHook(() => useOptimisticState(0, routine));

    act(() => {
      processActions(actions, result.current.updateState);
    });

    expect(result.current.state).toEqual(1);
    expect(result.current.loading).toEqual(true);

    await act(async () => {
      await wait(400);
    });

    expect(result.current.state).toEqual(1);
    expect(result.current.loading).toEqual(false);
    expect(result.current.result).toEqual('Result for 1');
  });

  it('should rollback and give error when last promise is rejected', async () => {
    const actions: Action[] = [
      { state: 1, type: 'success', delay: 500, result: 'Result for 1' },
      { state: 2, type: 'error', delay: 300, error: 'Error for 2' },
    ];

    const { result } = renderHook(() => useOptimisticState(0, routine));

    act(() => {
      processActions(actions, result.current.updateState);
    });

    expect(result.current.state).toEqual(2);
    expect(result.current.loading).toEqual(true);

    await act(async () => {
      await wait(500);
    });

    expect(result.current.state).toEqual(1);
    expect(result.current.loading).toEqual(false);
    expect(result.current.result).toEqual('Result for 1');
    expect(result.current.error).toEqual('Error for 2');
  });

  it('should reset error when new routine starts but should maintain the last result', async () => {
    const { result } = renderHook(() => useOptimisticState(0, routine));

    act(() => {
      processActions(
        [{ state: 1, type: 'success', delay: 300, result: 'Result for 1' }],
        result.current.updateState,
      );
    });

    await act(async () => {
      await wait(400);
    });

    act(() => {
      processActions(
        [{ state: 2, type: 'error', delay: 300, error: 'Error for 2' }],
        result.current.updateState,
      );
    });

    await act(async () => {
      await wait(400);
    });

    expect(result.current.state).toEqual(1);
    expect(result.current.error).toEqual('Error for 2');
    expect(result.current.result).toEqual('Result for 1');

    act(() => {
      processActions(
        [{ state: 3, type: 'success', delay: 300, result: 'Result for 3' }],
        result.current.updateState,
      );
    });

    expect(result.current.state).toEqual(3);
    expect(result.current.error).toEqual(undefined);
    expect(result.current.result).toEqual('Result for 1');

    await act(async () => {
      await wait(400);
    });

    expect(result.current.state).toEqual(3);
    expect(result.current.error).toEqual(undefined);
    expect(result.current.result).toEqual('Result for 3');
  });
});
