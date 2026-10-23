import { produce } from "immer";
import type { Draft } from "immer";
import { buildUseLocalSlice } from "./buildUseLocalSlice.ts";

export interface ImmerHKT extends buildUseLocalSlice.ProduceHKT {
  readonly Draft: Draft<this["State"]>;
  readonly RecipeReturn: void | this["State"] | this["Draft"];
}

export declare namespace useLocalSlice {
  export type PayloadActionReducer<State, P = void> = buildUseLocalSlice.PayloadActionReducer<
    State,
    P,
    ImmerHKT
  >;

  export type ReducerMap<State> = buildUseLocalSlice.ReducerMap<State, ImmerHKT>;

  export type DispatcherMap<Reducers extends ReducerMap<any>> =
    buildUseLocalSlice.DispatcherMap<Reducers, ImmerHKT>;

  export interface UseLocalSliceOptions<
    State,
    Reducers extends ReducerMap<State>,
  > extends buildUseLocalSlice.UseLocalSliceOptions<State, Reducers, ImmerHKT> {}

  export interface UseLocalSliceOptionsWithInit<
    State,
    InitialArg,
    Reducers extends ReducerMap<State>,
  > extends buildUseLocalSlice.UseLocalSliceOptionsWithInit<State, InitialArg, Reducers, ImmerHKT> {}
}

export const useLocalSlice = buildUseLocalSlice<ImmerHKT>((state, recipe) =>
  produce(
    state,
    (draft) =>
      // Immer accepts undrafted replacement states as well as drafts at runtime.
      recipe(draft) as Draft<typeof state> | void,
  ),
);
