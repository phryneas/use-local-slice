import { expectTypeOf } from "expect-type";
import { useLocalSlice } from "./index.ts";
import type { useLocalSlice as directUseLocalSlice } from "./useLocalSlice.ts";

type State = { readonly count: number };

const increment: useLocalSlice.PayloadActionReducer<State, number> = (
  draft,
  action,
) => {
  draft.count += action.payload;
};

const reducers = { increment } satisfies useLocalSlice.ReducerMap<State>;

export function useNamespaceTypeChecks(initialState: State) {
  const options: useLocalSlice.UseLocalSliceOptions<State, typeof reducers> = {
    initialState,
    reducers,
  };
  const [state, dispatch] = useLocalSlice(options);
  const lazyOptions: useLocalSlice.UseLocalSliceOptionsWithInit<State, string, typeof reducers> = {
    initialArg: "2",
    init: (value) => ({ count: Number(value) }),
    reducers,
  };
  expectTypeOf(useLocalSlice(lazyOptions)[0]).toEqualTypeOf<State>();
  expectTypeOf(state).toEqualTypeOf<State>();
  const directDispatch: directUseLocalSlice.DispatcherMap<typeof reducers> = dispatch;

  expectTypeOf(directDispatch.increment).toEqualTypeOf<(payload: number) => void>();
  directDispatch.increment(1);
  // @ts-expect-error Namespaced reducers retain required payloads.
  directDispatch.increment();
  // @ts-expect-error The hook state retains its readonly property.
  state.count++;
}

export function useLazyTypeChecks() {
  const [state, dispatch] = useLocalSlice({
    initialArg: "2",
    init: (value) => {
      expectTypeOf(value).toEqualTypeOf<string>();
      return { count: Number(value) } as State;
    },
    reducers: {
      increment(draft, action: { payload: number }) {
        expectTypeOf(draft).toEqualTypeOf<{ count: number }>();
        draft.count += action.payload;
      },
    },
  });
  expectTypeOf(state).toEqualTypeOf<State>();
  expectTypeOf(dispatch.increment).toEqualTypeOf<(payload: number) => void>();
  // @ts-expect-error Lazy initialization retains required payloads.
  dispatch.increment();
}
