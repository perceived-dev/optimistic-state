import optimisticState from '../src/index';

type Action = {
  state: number;
  type: 'success' | 'error';
  delay: number;
  result?: string;
  error?: any;
};

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
    let state = 0;
    let result;
    const optimisticHandler = optimisticState({
      initialState: state,
      routine,
      handleState: (_state) => (state = _state),
      handleResult: (_result) => (result = _result),
    });

    processActions(actions, optimisticHandler);

    expect(state).toEqual(1);
    expect(result).toEqual(undefined);

    await wait(400);

    expect(result).toEqual('Result for 1');
  });

  it('should give error and rollback when rejected', async () => {
    const actions: Action[] = [{ state: 1, type: 'error', delay: 300, error: 'error for 1' }];
    let state = 0;
    let error;
    const optimisticHandler = optimisticState({
      initialState: state,
      routine,
      handleState: (_state) => (state = _state),
      handleError: (_errror) => (error = _errror),
    });

    processActions(actions, optimisticHandler);

    expect(state).toEqual(1);
    expect(error).toEqual(undefined);

    await wait(400);

    expect(state).toEqual(0);
    expect(error).toEqual('error for 1');
  });

  it('should handle race conditions when multiple promises are involved', async () => {
    const actions: Action[] = [
      { state: 1, type: 'success', delay: 300, result: 'Result for 1' },
      { state: 2, type: 'success', delay: 800, result: 'Result for 2' },
      { state: 3, type: 'success', delay: 500, result: 'Result for 3' },
    ];
    let state = 0;
    let result;
    let error;

    const optimisticHandler = optimisticState({
      initialState: state,
      routine,
      handleState: (_state) => (state = _state),
      handleResult: (_result) => (result = _result),
      handleError: (_errror) => (error = _errror),
    });

    processActions(actions, optimisticHandler);

    expect(state).toEqual(3);

    await wait(1000);

    expect(state).toEqual(3);
    expect(result).toEqual('Result for 3');
  });

  it('should ignore previous promises if last promise is resolved', async () => {
    const actions: Action[] = [
      { state: 1, type: 'success', delay: 300, result: 'Result for 1' },
      { state: 2, type: 'error', delay: 800, error: 'Error for 2' },
      { state: 3, type: 'success', delay: 500, result: 'Result for 3' },
    ];
    let state = 0;
    let result;
    let error;

    const optimisticHandler = optimisticState({
      initialState: state,
      routine,
      handleState: (_state) => (state = _state),
      handleResult: (_result) => (result = _result),
      handleError: (_errror) => (error = _errror),
    });

    processActions(actions, optimisticHandler);

    expect(state).toEqual(3);

    // it shouldn't wait for previous promises to get resolve/reject if last is passed
    await wait(600);

    expect(state).toEqual(3);
    expect(result).toEqual('Result for 3');
    expect(error).toEqual(undefined);

    // even previous request fails nothing should change
    await wait(1000);
    expect(state).toEqual(3);
    expect(result).toEqual('Result for 3');
    expect(error).toEqual(undefined);
  });

  it('should roll back to last passed state and returns the error along with the last resolve value ', async () => {
    const actions: Action[] = [
      { state: 1, type: 'success', delay: 300, result: 'Result for 1' },
      { state: 2, type: 'error', delay: 400, error: 'error for 2' },
      { state: 3, type: 'success', delay: 400, result: 'Result for 3' },
      { state: 4, type: 'error', delay: 800, error: 'error for 4' },
      { state: 5, type: 'error', delay: 500, error: 'error for 5' },
    ];

    let state = 0;
    let result;
    let error;

    const optimisticHandler = optimisticState({
      initialState: state,
      routine,
      handleState: (_state) => (state = _state),
      handleResult: (_result) => (result = _result),
      handleError: (_errror) => (error = _errror),
    });

    processActions(actions, optimisticHandler);

    expect(state).toEqual(5);

    await wait(1000);

    expect(state).toEqual(3);
    expect(result).toEqual('Result for 3');
    expect(error).toEqual('error for 5');
  });

  it('should roll back to initial value if all are is error', async () => {
    const actions: Action[] = [
      { state: 1, type: 'error', delay: 200, error: 'error for 1' },
      { state: 2, type: 'error', delay: 500, error: 'error for 2' },
      { state: 3, type: 'error', delay: 300, error: 'error for 3' },
    ];

    let state = 999;
    let result;
    let error;

    const optimisticHandler = optimisticState({
      initialState: state,
      routine,
      handleState: (_state) => (state = _state),
      handleResult: (_result) => (result = _result),
      handleError: (_errror) => (error = _errror),
    });

    processActions(actions, optimisticHandler);

    expect(state).toEqual(3);

    await wait(600);

    expect(state).toEqual(999);
    expect(result).toEqual(undefined);
    expect(error).toEqual('error for 3');
  });

  it('should roll back to last resolve state in case actions are triggered in future and all failed', async () => {
    let state = 999;
    let result;
    let error;

    const optimisticHandler = optimisticState({
      initialState: state,
      routine,
      handleState: (_state) => (state = _state),
      handleResult: (_result) => (result = _result),
      handleError: (_errror) => (error = _errror),
    });

    processActions(
      [{ state: 1, type: 'success', delay: 200, result: 'Result for 1' }],
      optimisticHandler,
    );

    expect(state).toEqual(1);

    await wait(300);
    expect(state).toEqual(1);
    expect(result).toEqual('Result for 1');

    const actions: Action[] = [
      { state: 2, type: 'error', delay: 300, error: 'error for 2' },
      { state: 3, type: 'error', delay: 200, error: 'error for 3' },
    ];

    processActions(actions, optimisticHandler);
    expect(state).toEqual(3);

    await wait(400);

    expect(state).toEqual(1);
    expect(result).toEqual('Result for 1');
    expect(error).toEqual('error for 3');
  });
});
