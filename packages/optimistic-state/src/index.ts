type OptimisticStateOptions<T, R, E> = {
  initialState: T;
  routine: (state: T, ...args: any[]) => Promise<R>;
  handleState: (state: T) => void;
  handleResult?: (data: R) => void;
  handleError?: (error: E) => void;
};

const noop = () => {};

export default function optimisticState<T, R = any, E = any>({
  initialState,
  routine, // async routine
  handleState, // optimistic state
  handleResult = noop, // last successful result
  handleError = noop, // last error
}: OptimisticStateOptions<T, R, E>) {
  let resolvedState = initialState;
  let promises: Promise<R>[] = [];
  let states: T[] = [];

  const reset = () => {
    //reset the promises and states
    promises = [];
    states = [];
  };

  return (state: T, ...args: any[]) => {
    const promise = routine(state, ...args);

    // optimistically update state
    handleState(state);

    // keep the reference of state for rollback purpose
    states.push(state);

    // create a new list of promises with existing ones and the new one
    const curPromises = promises.concat([promise]);

    /**
     * store the promiseList on promises.
     * Note, promises will always point to the latest list,
     * while curPromises will be the list when the handler was called.
     */
    promises = curPromises;

    promise.then(
      (value) => {
        // handle only in case its the last promise
        if (promise === promises[promises.length - 1]) {
          /**
           * if the final one is successful we ignore all the
           * previous promises and treat the resolution to be successful
           */
          resolvedState = states[states.length - 1];
          handleResult(value);
          reset();
        }
      },
      (err) => {
        // ignore error here
      },
    );

    // handle rollbacks
    Promise.allSettled(curPromises).then((values) => {
      // when it is resolved if the promises is updated ignore the previous allSettled value
      if (promises !== curPromises) return;

      const lastValue = values[values.length - 1];

      // if the resolution is successful we don't need to rollback
      if (lastValue.status === 'fulfilled') return;

      if (lastValue.status === 'rejected') {
        // if the last one is error treat the final resolution as error and rollback to closest success
        handleError(lastValue.reason);

        for (let i = values.length - 1; i >= 0; i--) {
          // if we find anything resolved previously rollback to it
          const curValue = values[i];
          if (curValue.status === 'fulfilled') {
            resolvedState = states[i];
            handleState(resolvedState);
            handleResult(curValue.value);
            break;
          }

          // if we have reached the first promise and if that is also a failure reset to last resolved state
          if (i === 0 && curValue.status === 'rejected') {
            handleState(resolvedState);
          }
        }
      }

      reset();
    });
  };
}
