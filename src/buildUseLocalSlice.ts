import { useReducer, useMemo, useDebugValue } from "react";
import type { PlainHKT } from "./usePlainLocalSlice.ts";

export declare namespace buildUseLocalSlice {
  export interface ProduceHKT {
    readonly State: unknown;
    readonly Draft: unknown;
    readonly RecipeReturn: unknown;
  }

  export type DraftOf<Types extends ProduceHKT, State> = (Types & {
    readonly State: State;
  })["Draft"];

  export type RecipeReturnOf<Types extends ProduceHKT, State> = (Types & {
    readonly State: State;
  })["RecipeReturn"];

  export type Produce<Types extends ProduceHKT> = <State>(
    state: State,
    recipe: (draft: DraftOf<Types, State>) => RecipeReturnOf<Types, State>,
  ) => State;

  type IfMaybeUndefined<P, True, False> = [undefined] extends [P] ? True : False;

  export type PayloadAction<P> = {
    type: string;
    payload: P;
  };

  export type PayloadActionDispatch<P = void> = void extends P
    ? () => void
    : IfMaybeUndefined<P, (payload?: P) => void, (payload: P) => void>;

  export type ReducerWithoutPayload<State> = (state: State) => State;

  export type PayloadActionReducer<
    State,
    P = void,
    Types extends ProduceHKT = PlainHKT,
  > = (
    state: DraftOf<Types, State>,
    action: PayloadAction<P>,
  ) => RecipeReturnOf<Types, State>;

  export type ReducerMap<State, Types extends ProduceHKT = PlainHKT> = {
    [actionType: string]: PayloadActionReducer<State, any, Types>;
  };

  export type DispatcherMap<
    Reducers extends ReducerMap<any, Types>,
    Types extends ProduceHKT = PlainHKT,
  > = {
    [T in keyof Reducers]: Reducers[T] extends ReducerWithoutPayload<any>
      ? PayloadActionDispatch<void>
      : Reducers[T] extends PayloadActionReducer<any, infer P, Types>
        ? PayloadActionDispatch<P>
        : never;
  };

  export interface UseLocalSliceOptions<
    State,
    Reducers extends ReducerMap<State, Types>,
    Types extends ProduceHKT = PlainHKT,
  > {
    initialState: State;
    reducers: Reducers;
    slice?: string;
  }
}

export function buildUseLocalSlice<Types extends buildUseLocalSlice.ProduceHKT = PlainHKT>(
  produce: buildUseLocalSlice.Produce<Types>,
) {
  return function useLocalSlice<
    State,
    Reducers extends buildUseLocalSlice.ReducerMap<State, Types>,
  >({
    initialState,
    reducers,
    slice = "unnamed",
  }: buildUseLocalSlice.UseLocalSliceOptions<State, Reducers, Types>): [
    State,
    buildUseLocalSlice.DispatcherMap<Reducers, Types>,
  ] {
    useDebugValue(slice);

    const reducer = (baseState: State, action: buildUseLocalSlice.PayloadAction<any>) =>
      produce(baseState, (draft) => reducers[action.type](draft, action));

    const [state, dispatch] = useReducer(reducer, initialState);
    const actionTypes = Object.keys(reducers);

    const dispatchAction = useMemo(() => {
      const map: { [actionType: string]: (payload?: unknown) => void } = {};
      for (const type of actionTypes) {
        map[type] = (payload) => dispatch({ type, payload });
      }
      return map as buildUseLocalSlice.DispatcherMap<Reducers, Types>;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, JSON.stringify(actionTypes)]);

    return [state, dispatchAction];
  };
}
