import { expectTypeOf } from "expect-type";
import { buildUseLocalSlice } from "./buildUseLocalSlice.ts";
import type { buildUseLocalSlice as rootBuildUseLocalSlice } from "./index.ts";
import { useLocalSlice } from "./index.ts";

type Mutable<State> = { -readonly [Key in keyof State]: State[Key] };

interface MutableHKT extends buildUseLocalSlice.ProduceHKT {
  readonly Draft: Mutable<this["State"]>;
  readonly RecipeReturn: this["State"];
}

type State = { readonly count: number };

const useMutableSlice = buildUseLocalSlice<MutableHKT>((state, recipe) =>
  recipe(state),
);

export function useFactoryTypeChecks(initialState: State) {
  const [state, dispatch] = useMutableSlice({
    initialState,
    reducers: {
      increment(draft, action: { payload: number }) {
        draft.count += action.payload;
        return draft;
      },
      optional(draft, action: { payload?: number }) {
        draft.count += action.payload ?? 1;
        return draft;
      },
      reset: () => initialState,
    },
  });

  const unchangedStateType: State = state;
  expectTypeOf(state).toEqualTypeOf<State>();
  expectTypeOf(state.count).toEqualTypeOf<number>();
  expectTypeOf(dispatch.increment).toEqualTypeOf<(payload: number) => void>();
  expectTypeOf(dispatch.optional).toEqualTypeOf<(payload?: number | undefined) => void>();
  expectTypeOf(dispatch.reset).toEqualTypeOf<() => void>();
  const draft: rootBuildUseLocalSlice.DraftOf<MutableHKT, State> = { count: 0 };
  expectTypeOf(draft.count).toEqualTypeOf<number>();
  draft.count++;
  const replacement: buildUseLocalSlice.RecipeReturnOf<MutableHKT, State> = initialState;
  dispatch.increment(1);
  dispatch.optional();
  dispatch.optional(1);
  dispatch.reset();
  // @ts-expect-error The payload is required.
  dispatch.increment();
  // @ts-expect-error The payload must be numeric.
  dispatch.increment("1");
  // @ts-expect-error Payloadless actions do not accept arguments.
  dispatch.reset(1);
  // @ts-expect-error The returned hook state retains its readonly property.
  state.count++;

  useMutableSlice({
    initialState,
    reducers: {
      // @ts-expect-error This producer requires a replacement state, not void.
      invalid(draft) {
        draft.count++;
      },
    },
  });

  const [, immerDispatch] = useLocalSlice({
    initialState,
    reducers: {
      increment(draft, action: { payload: number }) {
        draft.count += action.payload;
      },
    },
  });
  expectTypeOf(immerDispatch.increment).toEqualTypeOf<(payload: number) => void>();
  immerDispatch.increment(1);
  // @ts-expect-error The default hook still infers required payloads.
  immerDispatch.increment();

  return { unchangedStateType, replacement };
}
