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
  expectTypeOf(state).toEqualTypeOf<State>();
  const directDispatch: directUseLocalSlice.DispatcherMap<typeof reducers> = dispatch;

  expectTypeOf(directDispatch.increment).toEqualTypeOf<(payload: number) => void>();
  directDispatch.increment(1);
  // @ts-expect-error Namespaced reducers retain required payloads.
  directDispatch.increment();
  // @ts-expect-error The hook state retains its readonly property.
  state.count++;
}
