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
    Reducers extends Record<string, unknown>,
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
    initialArg?: never;
    init?: never;
    reducers: Reducers;
    slice?: string;
  }

  export interface UseLocalSliceOptionsWithInit<
    State,
    InitialArg,
    Reducers extends ReducerMap<State, Types>,
    Types extends ProduceHKT = PlainHKT,
  > {
    initialState?: never;
    initialArg: InitialArg;
    init: (initialArg: InitialArg) => State;
    reducers: Reducers;
    slice?: string;
  }

  export interface Hook<
    Types extends buildUseLocalSlice.ProduceHKT = PlainHKT,
  > {
    <State, InitialArg, Reducers extends Record<string, unknown>>(
      options: buildUseLocalSlice.UseLocalSliceOptionsWithInit<
        State,
        InitialArg,
        Reducers & buildUseLocalSlice.ReducerMap<State, Types>,
        Types
      >,
    ): [State, buildUseLocalSlice.DispatcherMap<Reducers, Types>];
    <State, Reducers extends buildUseLocalSlice.ReducerMap<State, Types>>(
      options: buildUseLocalSlice.UseLocalSliceOptions<State, Reducers, Types>,
    ): [State, buildUseLocalSlice.DispatcherMap<Reducers, Types>];
    // Infer union state from init without including the absent initialState's undefined.
    // Default to never so invalid eager calls cannot fall back to an unknown state.
    <
      State = never,
      Reducers extends buildUseLocalSlice.ReducerMap<State, Types> =
        buildUseLocalSlice.ReducerMap<State, Types>,
      InitialArg = State,
    >(
      options:
        | buildUseLocalSlice.UseLocalSliceOptions<
            NoInfer<State>,
            Reducers,
            Types
          >
        | buildUseLocalSlice.UseLocalSliceOptionsWithInit<
            State,
            InitialArg,
            Reducers,
            Types
          >,
    ): [State, buildUseLocalSlice.DispatcherMap<Reducers, Types>];
  }
}

export function buildUseLocalSlice<
  Types extends buildUseLocalSlice.ProduceHKT = PlainHKT,
>(produce: buildUseLocalSlice.Produce<Types>): buildUseLocalSlice.Hook<Types> {
  return function useLocalSlice<
    State,
    Reducers extends buildUseLocalSlice.ReducerMap<State, Types>,
    InitialArg = State,
  >(
    options:
      | buildUseLocalSlice.UseLocalSliceOptions<State, Reducers, Types>
      | buildUseLocalSlice.UseLocalSliceOptionsWithInit<
          State,
          InitialArg,
          Reducers,
          Types
        >,
  ): [State, buildUseLocalSlice.DispatcherMap<Reducers, Types>] {
    const { reducers, slice = "unnamed" } = options;
    useDebugValue(slice);

    const reducer = (
      baseState: State,
      action: buildUseLocalSlice.PayloadAction<any>,
    ) => produce(baseState, (draft) => reducers[action.type](draft, action));

    const [state, dispatch] = useReducer(reducer, options, (options) =>
      options.init ? options.init(options.initialArg) : options.initialState,
    );
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
