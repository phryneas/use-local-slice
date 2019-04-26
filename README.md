# use-local-slice

An opinionated react hook to use reducers for local state

- in a typesafe way
- with an API like [createSlice](https://redux-starter-kit.js.org/api/createslice) from [redux-starter-kit](https://redux-starter-kit.js.org)
- with [immer](https://github.com/mweststrate/immer) integration

## How to use it

```typescript
const [state, dispatchAction] = useLocalSlice({
  slice: "my slice", // optional - will be displayed in the debug tools
  initialState: { data: "initial text", someOtherValue: 5 },
  reducers: {
    concat: (state, action: { payload: string }) => {
      // reducers are passed an immer draft of the current state, so you can directly modify values in the draft
      state.data += action.payload;
    },
    toUpper: state => ({
      // or you return a modified copy yourself
      ...state,
      data: state.data.toUpperCase()
    })
    // more reducers ...
  },
  middlewares: [] // optional, takes an array of redux middlewares. see warnings below.
});
```

and in some callback:

```typescript
dispatchAction.concat("concatenate me!");
// or
dispatchAction.toUpper();
```

use-local-slice provides one dispatchAction method per reducer, and (for typescript users) ensures that these dispatchers are only called with correct payload types.

## On Middlewares

Most Redux middlewares should work out of the box with use-local-slice.

_But there are exceptions:_

Due to the asynchronity of React's useReducer (the reducer is only executed on next render), the following construct will not work:

```javascript
const middleware = store => next => action => {
  console.log("state before next() is", store.getState());
  const retVal = next(action);
  console.log("state after next() is", store.getState());
  return retVal;
};
```

That code will log the state _before_ calling the reducer twice, because the reducer is executed asynchronously on next render.

As this behaviour is highly undependable in Redux anyways (if a middleware that comes after this middleware defers the call to `next(action)` to a later moment, you have the same behaviour there, too), most Redux middlewares will not depend on that behaviour to work, so in general this should break nothing.

But, _if_ you truly need this behaviour, the following should work (unless another middleware meddles with the call to `next(action)` too much):

```javascript
const middleware = store => next => async action => {
  console.log("state before next() is", store.getState());
  const retVal = await next(action);
  console.log("state after next() is", store.getState());
  return retVal;
};
```

## Edge case uses & good to know stuff

- reducers can directly reference other local component state & variables without the need for a `dependencies` array. This is normal `useReducer` behaviour. You can read up on this on the overreacted blog: [Why useReducer Is the Cheat Mode of Hooks](https://overreacted.io/a-complete-guide-to-useeffect/#why-usereducer-is-the-cheat-mode-of-hooks)
- you can exchange reducers for others between renders - as long as the keys of the `reducers` property do not change, you will get an identical instance of `dispatchAction`.
- only renaming, adding or removing keys will get you a new `dispatchAction` instance
