import { expectTypeOf } from "expect-type";
import { usePlainLocalSlice } from "./usePlainLocalSlice.ts";
import type { usePlainLocalSlice as rootUsePlainLocalSlice } from "./index.ts";

type State = { readonly count: number };

const increment: usePlainLocalSlice.PayloadActionReducer<State, number> = (
  state,
  action,
) => {
  // @ts-expect-error Plain reducers preserve readonly properties.
  state.count++;
  return { count: state.count + action.payload };
};

const reducers = { increment } satisfies usePlainLocalSlice.ReducerMap<State>;

export function usePlainNamespaceTypeChecks(initialState: State) {
  const options: usePlainLocalSlice.UseLocalSliceOptions<State, typeof reducers> = {
    initialState,
    reducers,
  };
  const [state, dispatch] = usePlainLocalSlice(options);
  const lazyOptions: usePlainLocalSlice.UseLocalSliceOptionsWithInit<State, string, typeof reducers> = {
    initialArg: "2",
    init: (value) => ({ count: Number(value) }),
    reducers,
  };
  expectTypeOf(usePlainLocalSlice(lazyOptions)[0]).toEqualTypeOf<State>();
  expectTypeOf(state).toEqualTypeOf<State>();
  const rootDispatch: rootUsePlainLocalSlice.DispatcherMap<typeof reducers> = dispatch;

  expectTypeOf(rootDispatch.increment).toEqualTypeOf<(payload: number) => void>();
  rootDispatch.increment(1);
  // @ts-expect-error Namespaced plain reducers retain required payloads.
  rootDispatch.increment();
  // @ts-expect-error The hook state retains its readonly property.
  state.count++;
}

export function usePlainTypeChecks(initialState: State) {
  const [plainState, plainDispatch] = usePlainLocalSlice({
    initialState,
    reducers: {
      increment(state, action: { payload: number }) {
        // @ts-expect-error Plain reducers do not turn readonly state into a draft.
        state.count++;
        return { count: state.count + action.payload };
      },
    },
  });
  expectTypeOf(plainState).toEqualTypeOf<State>();
  expectTypeOf(plainDispatch.increment).toEqualTypeOf<(payload: number) => void>();
  plainDispatch.increment(1);
  // @ts-expect-error Plain dispatchers also require their payload.
  plainDispatch.increment();

  usePlainLocalSlice({
    initialState,
    reducers: {
      // @ts-expect-error Plain reducers must return a state.
      invalid() {},
    },
  });
}

export function usePlainLazyTypeChecks() {
  const [state, dispatch] = usePlainLocalSlice({
    initialArg: "2",
    init: (value) => {
      expectTypeOf(value).toEqualTypeOf<string>();
      return { count: Number(value) } as State;
    },
    reducers: {
      increment(state, action: { payload: number }) {
        expectTypeOf(state).toEqualTypeOf<State>();
        // @ts-expect-error Plain initialized states remain readonly.
        state.count++;
        return { count: state.count + action.payload };
      },
    },
  });
  expectTypeOf(state).toEqualTypeOf<State>();
  expectTypeOf(dispatch.increment).toEqualTypeOf<(payload: number) => void>();
  // @ts-expect-error An initial argument requires an initializer.
  usePlainLocalSlice({ initialArg: "2", reducers: {} });
  // @ts-expect-error Lazy plain reducers must return the initialized state type.
  usePlainLocalSlice({ initialArg: "2", init: Number, reducers: { invalid() {} } });
  // @ts-expect-error Lazy reducers cannot replace the state with a different type.
  usePlainLocalSlice({ initialArg: "2", init: Number, reducers: { invalid: () => "wrong" } });
  // @ts-expect-error The two initialization forms cannot be combined.
  usePlainLocalSlice({ initialState: 0, initialArg: "2", init: Number, reducers: {} });
  // @ts-expect-error The initializer must accept the initial argument's type.
  usePlainLocalSlice({ initialArg: "2", init: (value: number) => value, reducers: {} });
}
