import "./test-setup.ts";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { act, cleanup, renderHook } from "@testing-library/react/pure.js";
import { usePlainLocalSlice } from "./usePlainLocalSlice.ts";

afterEach(cleanup);

test("plain passes through state and uses reducer replacements", () => {
  const initialState: Readonly<{ count: number }> = Object.freeze({ count: 0 });
  let receivedState: typeof initialState | undefined;
  const { result, rerender } = renderHook(() =>
    usePlainLocalSlice({
      initialState,
      reducers: {
        increment(state, action: { payload: number }) {
          receivedState = state;
          return { count: state.count + action.payload };
        },
        reset: () => initialState,
      },
    }),
  );

  const dispatch = result.current[1];
  assert.equal(result.current[0], initialState);
  act(() => dispatch.increment(3));
  assert.equal(receivedState, initialState);
  assert.deepEqual(result.current[0], { count: 3 });
  assert.equal(Object.isFrozen(result.current[0]), false);
  assert.deepEqual(initialState, { count: 0 });
  rerender();
  assert.equal(result.current[1], dispatch);
  act(() => dispatch.reset());
  assert.equal(result.current[0], initialState);
});

test("plain supports optional payloads and scalar replacement states", () => {
  const { result } = renderHook(() =>
    usePlainLocalSlice({
      initialState: 0,
      reducers: {
        increment: (state, action: { payload?: number }) =>
          state + (action.payload ?? 1),
        reset: () => 0,
      },
    }),
  );

  act(() => result.current[1].increment());
  assert.equal(result.current[0], 1);
  act(() => result.current[1].increment(4));
  assert.equal(result.current[0], 5);
  act(() => result.current[1].reset());
  assert.equal(result.current[0], 0);
});
