import { buildUseLocalSlice } from "./buildUseLocalSlice.ts";

export interface PlainHKT extends buildUseLocalSlice.ProduceHKT {
  readonly Draft: this["State"];
  readonly RecipeReturn: this["State"];
}

export declare namespace usePlainLocalSlice {
  export type PayloadActionReducer<State, P = void> = buildUseLocalSlice.PayloadActionReducer<
    State,
    P,
    PlainHKT
  >;

  export type ReducerMap<State> = buildUseLocalSlice.ReducerMap<State, PlainHKT>;

  export type DispatcherMap<Reducers extends ReducerMap<any>> =
    buildUseLocalSlice.DispatcherMap<Reducers, PlainHKT>;

  export interface UseLocalSliceOptions<
    State,
    Reducers extends ReducerMap<State>,
  > extends buildUseLocalSlice.UseLocalSliceOptions<State, Reducers, PlainHKT> {}

  export interface UseLocalSliceOptionsWithInit<
    State,
    InitialArg,
    Reducers extends ReducerMap<State>,
  > extends buildUseLocalSlice.UseLocalSliceOptionsWithInit<State, InitialArg, Reducers, PlainHKT> {}
}

export const usePlainLocalSlice = buildUseLocalSlice<PlainHKT>(
  (state, recipe) => recipe(state),
);
