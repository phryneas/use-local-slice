import {
  useReducer,
  useMemo,
  useDebugValue,
  useState,
  useCallback,
  Dispatch,
  useRef,
  ReducerState,
  Reducer
} from "react";

import produce, { Draft } from "immer";

import { Middleware } from "redux";
import { compose } from "./compose";

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
  middlewares?: Middleware[];
}

/**
 * returns a promise that will be resolved on the next render
 */
function useNextRenderPromise() {
  const postDispatch = useRef<{ promise: Promise<void>; resolve: () => void }>({
    promise: Promise.resolve(),
    resolve: () => 0
  });
  postDispatch.current.resolve();
  postDispatch.current.promise = new Promise(
    resolve => (postDispatch.current.resolve = resolve)
  );

  return postDispatch.current.promise;
}

/**
 * Essentially useReducer, but applies middlewares around the `dispatch` call.
 */
function useCreateStore<R extends Reducer<any, any>>(
  reducer: R,
  initialState: ReducerState<R>,
  middlewares: Middleware[]
) {
  const [state, finalDispatch] = useReducer(reducer, initialState);
  const nextRenderPromise = useNextRenderPromise();

  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * Wrap `dispatch` in the middlewares
   */
  const dispatch: typeof finalDispatch = useMemo(() => {
    let dispatch = (...args: any[]) => {
      throw new Error(/*
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      */);
    };

    const middlewareAPI = {
      getState() {
        return stateRef.current;
      },
      dispatch(...args: any[]) {
        return dispatch(...args);
      }
    };
    const chain = middlewares.map(middleware => middleware(middlewareAPI));

    /*
     * The dispatch that will be passed to the middlewares.
     * Returns a promise that will be resolved on the next render, after useReducer executed the reducer.
     */
    dispatch = compose<any>(...chain)(
      (action: any) => (finalDispatch(action), nextRenderPromise)
    );
    /*
     * The dispatch we return to the outside should not return a promise to not encourage it's use outside of middlewares.
     * But if that return value has been changed by a middelware, that changed return value will be forwarded.
     */
    return (...args) => {
      const retVal = dispatch(...args);
      return retVal === nextRenderPromise ? undefined : retVal;
    };
  }, [middlewares]);

  return [state, dispatch] as [typeof state, typeof dispatch];
}

export function useLocalSlice<State, Reducers extends ReducerMap<State>>({
  initialState,
  reducers,
  slice = "unnamed",
  middlewares = []
}: UseLocalSliceOptions<State, Reducers>): [State, DispatcherMap<Reducers>] {
  useDebugValue(slice);

  const reducer = (baseState: State, action: PayloadAction<any>) =>
    produce(baseState, draftState =>
      reducers[action.type](draftState, action)
    ) as State;

  const [state, dispatch] = useCreateStore(reducer, initialState, middlewares);

  const actionTypes = Object.keys(reducers);

  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const dispatchAction = useMemo(() => {
    let map: {
      [actionType: string]: PayloadActionDispatch<{}>;
    } = {};
    for (const type of actionTypes) {
      map[type] = (payload: any) => dispatchRef.current({ type, payload });
    }
    return map as DispatcherMap<Reducers>;
  }, [JSON.stringify(actionTypes)]);

  return [state, dispatchAction];
}
