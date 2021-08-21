# use-optimistic-state

React hooks for optimistic state with rollbacks and race condition handling.

## What and why an optimistic state?

[Optimistic UI and Optimistic States](https://github.com/perceived-dev/optimistic-state#what-is-an-optimistic-state)

## Installation

```
npm install @perceived/use-optimistic-state
```

## Usage

```js
import useOptimisticState from '@perceived/use-optimistic-state';
```

```js
function routine(state) {
  // async routine which should return promise
  return syncCounterToServer(state);
}

function App() {
  const { state, updateState, result, error, loading } = useOptimisticState(0, routine);

  return (
    <div>
      ...
      <span>Likes: ${state}</span>
      <button onClick={() => updateState(state + 1)}>Like</button>
      ...
    </div>
  );
}
```

## API

### Types

- TState : Type of the optimistic state
- TResult: Type of api result (defaults to any)
- TError: Type of error (defaults to any)

### Arguments

#### initialState : `TState`

The initialState of optimistic state, before any action is fired.

#### routine : `(state: TState, ...args[]) => Promise`

Async routine (mostly an api call which sync client state to server). This routine must return a promise.

### Return properties

#### state: `TState;`

This represents up to date optimistic states. Its updated before the routine start and on rollbacks.

#### result: `TResult`

This represent to the up to date last resolved data from series of actions. It is set when the last action is resolved. In case of error on last action, it is set with the last resolved data of action where it is rolled back.

For example if if there is series of action X, Y, Z. If Z is resolved (irrespective of X, Y failed or passed), handleResult will be called with Z data. But in case if Y, Z fails, handleResult will be called with X data.

#### error: `TError`

The error is set when the last action (in series of actions) fails. If last action is passed and there is failure on previous actions it will not set the error.

Note: It resets when ever we trigger the routine again.

#### loading: `boolean`

It represents the loading state while action is triggered, it resets back when the optimistic state is resolved from backend.

Note: If there is series of simultaneous actions, it will maintain the loading state until the final state is resolved/rejected.

## Demo

Try simulating all the cases in this example. [https://codesandbox.io/s/use-optimistic-state-g5hds](https://codesandbox.io/s/use-optimistic-state-g5hds)
