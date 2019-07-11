import { useReducer, useMemo, useDebugValue } from "react";

import produce, { Draft } from "immer";

type PayloadAction<P> = {
  type: string;
  payload: P;
};

type PayloadActionDispatch<P = void> = void extends P
  ? () => void
  : (payload: P) => void;

export type RedurcerWithoutPayload<S> = (state: S) => S;

export type PayloadActionReducer<S, P = void> = (
  state: Draft<S>,
  action: PayloadAction<P>
) => void | S | Draft<S>;

export type ReducerMap<State> = {
  [actionType: string]: PayloadActionReducer<State, any>;
};

type DispatcherMap<Reducers extends ReducerMap<any>> = {
  [T in keyof Reducers]: Reducers[T] extends RedurcerWithoutPayload<any>
  ? PayloadActionDispatch<void>
  : Reducers[T] extends PayloadActionReducer<any, infer P>
  ? PayloadActionDispatch<P>
  : never
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
  slice = "unnamed"
}: UseLocalSliceOptions<State, Reducers>): [State, DispatcherMap<Reducers>] {
  useDebugValue(slice);

  const reducer = (baseState: State, action: PayloadAction<any>) =>
    produce(baseState, draftState =>
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
  }, [dispatch, JSON.stringify(actionTypes)]);

  return [state, dispatchAction];
}
