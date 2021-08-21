# optimistic-state

Micro library for optimistic state with rollbacks and race condition handling.

## What and why an optimistic state?

[Optimistic UI and Optimistic States](https://github.com/perceived-dev/optimistic-state#what-is-an-optimistic-state)

## Installation

```
npm install @perceived/optimistic-state
```

## Usage

```js
import optimisticState from '@perceived/optimistic-state';
```

```js
function routine(state) {
  // async routine which should return promise
  return syncCounterToServer(state);
}

let count;

const updateState = optimisticState({
  initialState: 0,
  routine,
  handleState: (state) => {
    count = state;
    // handle optimistic state
    document.querySelector('.current-count').innerHTML = state;
  },
  handleResult: (result) => {
    document.querySelector('.result').innerHTML = result;
  },
  handleError: (err) => {
    // handle error, may be display error as toast/notification message
    message.error(err);
  },
});

document.querySelector('#increment-btn').addEventListener('click', () => {
  updateState(count + 1);
});
```

## API

### Types

- TState : Type of the optimistic state
- TResult: Type of api result (defaults to any)
- TError: Type of error (defaults to any)

### Options

#### initialState : `TState`

The initialState of optimistic state, before any action is fired.

#### routine : `(state: TState, ...args[]) => Promise`

Async routine (mostly an api call which sync client state to server). This routine must return a promise.

#### handleState: `(state: TState) => void;`

A callback to handle the optimistic state, this is fired when a routine is called, and also on rollbacks with the state.

#### handleResult: `(result: TResult) => void;`

The handleResult is called when the last action is resolved with the resolved data. In case of error on last action it is called with the last resolved data of action where it is rolled back.

For example if if there is series of action X, Y, Z. If Z is resolved (irrespective of X, Y failed or passed), handleResult will be called with Z data. But in case if Y, Z fails, handleResult will be called with X data.

#### handleError: `(err: TError) => void;`

The handleError will be called with reject reason, if the last action in series of action fails.

Note: If last action is passed and there is failure on previous actions, it will not call handleError

### Return

#### updateState: `(state: TState, ...args[] ) => void`

optimisticState return a updater function, which accepts new state as first argument, followed by any number of arguments. All of the arguments are passed to routine function.

## Demo

Try simulating all the cases in this example. [https://codesandbox.io/s/optimistic-state-rc9m5](https://codesandbox.io/s/optimistic-state-rc9m5)
