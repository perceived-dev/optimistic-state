# optimistic-state

Optimistic state with rollbacks and race condition handling.

## What is an optimistic state?

When a state is derived from client and synced to the server, you can take benefit of that state and optimistically update UI (even before you receive response from the server) with a hope that server request will pass. If it fails you revert the UI.

As 99% chance the API will pass, it gives user a snappier feeling even the things are happening in background. Its called perceived experience. The key is to respond as quick as possible on user interaction. In case of error its fine to show error (may be as a toast/notification) and revert the change. But still you are optimizing UI for 99% of user.

Such UIs are called Optimistic UI. There are multiple place where Optimistic UI are helpful.

- Like button
- Adding items into a favorite list / Cart
- Bookmarking
- Filters with checkboxes (or any other elements)
- Or any place where you don't want to show loading state on interacting element.

But managing states for Optimistic UI is tricky. As the interactions and API response and timing is non deterministic, it becomes hard to provide final correct state. **optimistic-state** is a micro library to manage the state of an Optimistic UI with rollbacks in case of failures and race conditions handling in case of multiple simultaneous interactions.

## Different use cases an optimistic-state library should handle

- **It should optimistically update state as soon as user interact and give the result when resolved.**

  For example as soon as user clicks like button on a post you show that the user has liked it, increase the liked count by 1. But when the response of API comes you set the correct count (may be other users have liked it at the same time).

- **It should handle race conditions when multiple interactions and API calls are involved.**

  As we are optimistically updating the UI we don't disable button on which user interacts. This can lead to user clicking button multiple time. As API timings are non-deterministic we should handle race conditions and only apply the result of last interaction.

  For example: On click of like button multiple times simultaneously, we should handle the total count from the last API response only.

- **It should rollback to last resolved interaction in case of error**

  Even with a optimistic update we want user to be notified about error, and revert the changes so user can perform the action again. When there is series of actions lets say X, Y, Z, if Y and Z both gives error. It should notify about the last error (Z) and the state should rollback to X. In case all (X, Y, Z) fails it should rollback initial value.

- **It should ignore previous actions if the last one succeeds**

  In case of optimistic UI we always care about the final state, intermediate failure can be ignored if the last one passed.
  Let's say there is series of action X, Y, Z. If X and Y fails but Z passes thats the final state so we don't need to inform the user about failure of X and Y.

## Demo

Try simulating all the cases in this example. [https://codesandbox.io/s/use-optimistic-state-g5hds](https://codesandbox.io/s/use-optimistic-state-g5hds)

## Usage

There is two flavour of optimistic-state right now. Check the API and usage in respective docs.

- Vanilla JS [optimistic-state](packages/optimistic-state/README.md)
- React hook [use-optimistic-state](packages/use-optimistic-state/README.md)

React hook `use-optimistic-state` is just a wrapper on top of `optimistic-state`. If you are looking for other lib/framework you can write one using `optimistic-state` and probably contribute back here. 🙂
