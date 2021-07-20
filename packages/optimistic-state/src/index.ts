type OptimisticStateOptions<T, R> = {
  initialState: T;
  routine: (state: T) => Promise<R>;
  handleState: (state: T) => void;
  handleResult?: (data: R) => void;
  handleError?: (error: any) => void;
};

const noop = () => {};

export default function optimisticState<T, R = any>({
  initialState,
  routine, // async routine
  handleState, // optimistic state
  handleResult = noop, // last successful result
  handleError = noop, // last error
}: OptimisticStateOptions<T, R>) {
  let resolvedState = initialState;
  let promises: Promise<R>[] = [];
  let states: T[] = [];

  return (state: T) => {
    const promise = routine(state);

    // optimistically update state
    handleState(state);

    // keep the reference of state for rollback purpose
    states.push(state);

    // create a new list of promises with existing ones and the new one
    const curPromises = promises.concat([promise]);

    // store the promiseList on promises
    promises = curPromises;

    Promise.allSettled(curPromises).then((values) => {
      // when it is resolved if the promises is updated ignore the previous allSettled value
      if (promises !== curPromises) return;

      const lastValue = values[values.length - 1];
      /**
       * after resolve if the final one is successful we ignore all the
       * previous promises and treat the resolution to be successful
       */
      if (lastValue.status === 'fulfilled') {
        resolvedState = states[states.length - 1];
        handleResult(lastValue.value);
      } else if (lastValue.status === 'rejected') {
        // if the last one is error treat the final resolution as error and rollback to closest success
        handleError(lastValue.reason);

        for (let i = values.length - 1; i >= 0; i++) {
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

      //reset the promises and states
      promises = [];
      states = [];
    });
  };
}
