import "./test-setup.ts";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { act, cleanup, renderHook } from "@testing-library/react/pure.js";
import { buildUseLocalSlice } from "./buildUseLocalSlice.ts";

afterEach(cleanup);

type Box<State> = { value: State };

interface BoxHKT extends buildUseLocalSlice.ProduceHKT {
  readonly Draft: Box<this["State"]>;
  readonly RecipeReturn: void | Box<this["State"]>;
}

const useBoxSlice = buildUseLocalSlice<BoxHKT>((state, recipe) => {
  const draft = { value: state };
  return (recipe(draft) ?? draft).value;
});

test("custom producers apply their draft and recipe-return transformations", () => {
  const { result } = renderHook(() =>
    useBoxSlice({
      initialArg: "1",
      init: Number,
      reducers: {
        increment(draft, action: { payload: number }) {
          draft.value += action.payload;
        },
        replace: (_draft, action: { payload: number }) => ({
          value: action.payload,
        }),
      },
    }),
  );

  act(() => result.current[1].increment(2));
  assert.equal(result.current[0], 3);
  act(() => result.current[1].replace(10));
  assert.equal(result.current[0], 10);
});
