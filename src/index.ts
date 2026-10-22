import { useReducer, useMemo, useDebugValue } from "react";

import produce, { Draft } from "immer";

type IfMaybeUndefined<P, True, False> = [undefined] extends [P]
  ? True
  : False;

export type PayloadAction<P> = {
  type: string;
  payload: P;
};

export type PayloadActionDispatch<P = void> = void extends P
  ? () => void
  : IfMaybeUndefined<P, (payload?: P) => void, (payload: P) => void>;

export type ReducerWithoutPayload<S> = (state: S) => S;

export type PayloadActionReducer<S, P = void> = (
  state: Draft<S>,
  action: PayloadAction<P>
) => void | S | Draft<S>;

export type ReducerMap<State> = {
  [actionType: string]: PayloadActionReducer<State, any>;
};

export type DispatcherMap<Reducers extends ReducerMap<any>> = {
  [T in keyof Reducers]: Reducers[T] extends ReducerWithoutPayload<any>
    ? PayloadActionDispatch<void>
    : Reducers[T] extends PayloadActionReducer<any, infer P>
    ? PayloadActionDispatch<P>
    : never;
};

export interface UseLocalSliceOptions<
  State,
  Reducers extends ReducerMap<State>
> {
  initialState: State;
  reducers: Reducers;
  slice?: string;
}

export function useLocalSlice<State, Reducers extends ReducerMap<State>>({
  initialState,
  reducers,
  slice = "unnamed",
}: UseLocalSliceOptions<State, Reducers>): [State, DispatcherMap<Reducers>] {
  useDebugValue(slice);

  const reducer = (baseState: State, action: PayloadAction<any>) =>
    produce(baseState, (draftState) =>
      reducers[action.type](draftState, action)
    ) as State;

  const [state, dispatch] = useReducer(reducer, initialState);

  const actionTypes = Object.keys(reducers);

  const dispatchAction = useMemo(() => {
    let map: {
      [actionType: string]: PayloadActionDispatch<{}>;
    } = {};
    for (const type of actionTypes) {
      map[type] = (payload: any) => dispatch({ type, payload });
    }
    return map as DispatcherMap<Reducers>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, JSON.stringify(actionTypes)]);

  return [state, dispatchAction];
}
