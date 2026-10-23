# use-local-slice

An opinionated react hook to use reducers for local state

- in a typesafe way
- with an API like [createSlice](https://redux-starter-kit.js.org/api/createslice) from [redux-starter-kit](https://redux-starter-kit.js.org)
- with [immer](https://github.com/mweststrate/immer) integration

## How to use it

```typescript
import { useLocalSlice } from "use-local-slice";

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

## Exports

The package exports `useLocalSlice`, `usePlainLocalSlice`, and `buildUseLocalSlice` from its main entry point. Each is also available through an individual entry point:

| Import path | Export | Behavior |
| --- | --- | --- |
| `use-local-slice/useLocalSlice` | `useLocalSlice` | Uses Immer drafts; reducers can mutate the draft or return a replacement state. |
| `use-local-slice/usePlainLocalSlice` | `usePlainLocalSlice` | Passes state directly to reducers; each reducer must return the next state. |
| `use-local-slice/buildUseLocalSlice` | `buildUseLocalSlice` | Creates a hook using your own producer and draft/recipe-return types. |

The plain and factory entry points do not import Immer.

Generic types are available under the `buildUseLocalSlice` namespace, including `.ProduceHKT`, `.Produce<Types>`, `.DraftOf<Types, State>`, `.RecipeReturnOf<Types, State>`, and generic reducer/dispatcher types. These work with imports from either the main entry point or `use-local-slice/buildUseLocalSlice`.

Immer-specific types are available as `useLocalSlice.PayloadActionReducer<State, Payload>`, `useLocalSlice.ReducerMap<State>`, `useLocalSlice.DispatcherMap<Reducers>`, and `useLocalSlice.UseLocalSliceOptions<State, Reducers>`. These work with `useLocalSlice` imported from either the main entry point or `use-local-slice/useLocalSlice`.

The plain hook provides the same type helpers under `usePlainLocalSlice`: `.PayloadActionReducer<State, Payload>`, `.ReducerMap<State>`, `.DispatcherMap<Reducers>`, and `.UseLocalSliceOptions<State, Reducers>`. These work with imports from either the main entry point or `use-local-slice/usePlainLocalSlice` and preserve plain state and replacement-return types.

### Without Immer

`usePlainLocalSlice` has the same hook options and dispatch API. It does not create drafts or freeze state, so treat state as immutable and return a replacement when updating it:

```typescript
import { usePlainLocalSlice } from "use-local-slice/usePlainLocalSlice";

const [state, dispatchAction] = usePlainLocalSlice({
  initialState: { count: 0 },
  reducers: {
    increment: (state, action: { payload: number }) => ({
      ...state,
      count: state.count + action.payload
    }),
    reset: () => ({ count: 0 })
  }
});

dispatchAction.increment(2);
dispatchAction.reset();
```

### Custom producers

Call `buildUseLocalSlice` once outside your components and hooks. Its producer receives the current state and a recipe, applies that recipe, and returns the next state. The hook's state type stays the same; a `buildUseLocalSlice.ProduceHKT` interface describes how the recipe's draft and return types relate to that state.

For example, you can use a separately configured Immer instance:

```typescript
import { Immer, type Draft } from "immer";
import { buildUseLocalSlice } from "use-local-slice/buildUseLocalSlice";

interface CustomImmerHKT extends buildUseLocalSlice.ProduceHKT {
  readonly Draft: Draft<this["State"]>;
  readonly RecipeReturn: void | this["Draft"];
}

const immer = new Immer({ autoFreeze: false });

export const useCustomLocalSlice = buildUseLocalSlice<CustomImmerHKT>(
  (state, recipe) => immer.produce(state, recipe)
);
```

Use `useCustomLocalSlice` inside a component just like `useLocalSlice`. Other producers can define their own `Draft` and `RecipeReturn` transformations. `PlainHKT` is exported from `use-local-slice/usePlainLocalSlice`, and `ImmerHKT` from `use-local-slice/useLocalSlice`.

## Edge case uses & good to know stuff

- reducers can directly reference other local component state & variables without the need for a `dependencies` array. This is normal `useReducer` behaviour. You can read up on this on the overreacted blog: [Why useReducer Is the Cheat Mode of Hooks](https://overreacted.io/a-complete-guide-to-useeffect/#why-usereducer-is-the-cheat-mode-of-hooks)
- you can exchange reducers for others between renders - as long as the keys of the `reducers` property do not change, you will get an identical instance of `dispatchAction`.
- only renaming, adding or removing keys will get you a new `dispatchAction` instance
