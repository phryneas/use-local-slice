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
  }
});
```

and in some callback:

```typescript
dispatchAction.concat("concatenate me!");
// or
dispatchAction.toUpper();
```

use-local-slice provides one dispatchAction method per reducer, and (for typescript users) ensures that these dispatchers are only called with correct payload types.

## Edge case uses & good to know stuff

- reducers can directly reference other local component state & variables without the need for a `dependencies` array. This is normal `useReducer` behaviour. You can read up on this on the overreacted blog: [Why useReducer Is the Cheat Mode of Hooks](https://overreacted.io/a-complete-guide-to-useeffect/#why-usereducer-is-the-cheat-mode-of-hooks)
- you can exchange reducers for others between renders - as long as the keys of the `reducers` property do not change, you will get an identical instance of `dispatchAction`.
- only renaming, adding or removing keys will get you a new `dispatchAction` instance
