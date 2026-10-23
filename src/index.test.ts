import "./test-setup.ts";
import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { renderHook, act, cleanup } from "@testing-library/react/pure.js";
import { useLocalSlice } from "./index.ts";

afterEach(cleanup);

function renderUseLocalSlice<S, R extends useLocalSlice.ReducerMap<S>>(
  options: useLocalSlice.UseLocalSliceOptions<S, R>,
) {
  return renderHook((opts: useLocalSlice.UseLocalSliceOptions<S, R>) => useLocalSlice(opts), {
    initialProps: options,
  });
}

describe("basic behaviour", () => {
  test("initial state", () => {
    const { result } = renderUseLocalSlice({
      initialState: { value: "test" },
      reducers: {},
    });

    const {
      current: [state],
    } = result;
    assert.deepEqual(state, { value: "test" });
  });

  test("dispatchAction has reducer names as methods", () => {
    const { result } = renderUseLocalSlice({
      initialState: { value: "test" },
      reducers: {
        a(state) {
          return state;
        },
        b(state) {
          return state;
        },
      },
    });

    const {
      current: [, dispatchAction],
    } = result;
    assert.deepEqual(Object.keys(dispatchAction), ["a", "b"]);
    assert.equal(typeof dispatchAction.a, "function");
    assert.equal(typeof dispatchAction.b, "function");
  });

  test("reducer without argument", () => {
    const { result } = renderUseLocalSlice({
      initialState: 5,
      reducers: {
        increment(state) {
          return state + 1;
        },
      },
    });

    let [state, dispatchAction] = result.current;
    assert.deepEqual(state, 5);

    act(() => dispatchAction.increment());
    [state, dispatchAction] = result.current;
    assert.deepEqual(state, 6);
  });

  test("reducer with optional argument", () => {
    const { result } = renderUseLocalSlice({
      initialState: 5,
      reducers: {
        incrementBy(state, action: { payload?: number }) {
          return state + (action.payload ?? 1);
        },
      },
    });

    let [state, dispatchAction] = result.current;
    assert.deepEqual(state, 5);

    act(() => dispatchAction.incrementBy());
    [state, dispatchAction] = result.current;
    assert.deepEqual(state, 6);

    act(() => dispatchAction.incrementBy(9));
    [state, dispatchAction] = result.current;
    assert.deepEqual(state, 15);
  });

  test("reducer with argument", () => {
    const { result } = renderUseLocalSlice({
      initialState: 5,
      reducers: {
        incrementBy(state, action: { payload: number }) {
          return state + action.payload;
        },
      },
    });

    let [state, dispatchAction] = result.current;
    assert.deepEqual(state, 5);

    act(() => dispatchAction.incrementBy(9));
    [state, dispatchAction] = result.current;
    assert.deepEqual(state, 14);
  });

  test("multiple reducers in complex state", () => {
    const { result } = renderUseLocalSlice({
      initialState: {
        numberProp: 3,
        stringProp: "hello",
      },
      reducers: {
        incrementBy(state, action: { payload: number }) {
          return { ...state, numberProp: state.numberProp + action.payload };
        },
        concat(state, action: { payload: string }) {
          return { ...state, stringProp: state.stringProp + action.payload };
        },
        clearString(state) {
          return { ...state, stringProp: "" };
        },
      },
    });

    let [state, dispatchAction] = result.current;
    assert.deepEqual(state, {
      numberProp: 3,
      stringProp: "hello",
    });

    act(() => dispatchAction.incrementBy(9));
    [state, dispatchAction] = result.current;
    assert.deepEqual(state.numberProp, 12);

    act(() => dispatchAction.concat(" world"));
    [state, dispatchAction] = result.current;
    assert.deepEqual(state.stringProp, "hello world");

    act(() => dispatchAction.clearString());
    [state, dispatchAction] = result.current;
    assert.deepEqual(state.stringProp, "");

    act(() => dispatchAction.concat("new value"));
    [state, dispatchAction] = result.current;
    assert.deepEqual(state.stringProp, "new value");
  });

  test("rerender with same reducer names does return same dispatchAction instance", () => {
    const { result, rerender } = renderUseLocalSlice({
      initialState: {
        numberProp: 3,
        stringProp: "hello",
      },
      reducers: {
        incrementBy(state, action: { payload: number }) {
          return { ...state, numberProp: state.numberProp + action.payload };
        },
        concat(state, action: { payload: string }) {
          return { ...state, stringProp: state.stringProp + action.payload };
        },
        clearString(state) {
          return { ...state, stringProp: "" };
        },
      },
    });

    const [, dispatchAction] = result.current;

    rerender({
      initialState: {
        numberProp: 3,
        stringProp: "hello",
      },
      reducers: {
        incrementBy(state) {
          // definitely different implementation - should not matter
          return state;
        },
        concat(state) {
          return state;
        },
        clearString(state) {
          return state;
        },
      },
    });

    const [, newDispatchAction] = result.current;

    assert.equal(dispatchAction, newDispatchAction);
  });

  test("rerender with different reducer names does return different dispatchAction instance", () => {
    const { result, rerender } = renderUseLocalSlice({
      initialState: {
        numberProp: 3,
        stringProp: "hello",
      },
      reducers: {
        incrementBy(state, action: { payload: number }) {
          return { ...state, numberProp: state.numberProp + action.payload };
        },
        concat(state, action: { payload: string }) {
          return { ...state, stringProp: state.stringProp + action.payload };
        },
        clearString(state) {
          return { ...state, stringProp: "" };
        },
      },
    });

    const [, dispatchAction] = result.current;

    type S = {
      numberProp: number;
      stringProp: string;
    };

    rerender({
      initialState: {
        numberProp: 3,
        stringProp: "hello",
      },
      reducers: {
        incrementBy(state: S, action: { payload: number }) {
          return { ...state, numberProp: state.numberProp + action.payload };
        },
        clearString(state: S) {
          return { ...state, stringProp: "" };
        },
        different(state: S) {
          return state;
        },
      },
    } as any);

    const [, newDispatchAction] = result.current;

    assert.notEqual(dispatchAction, newDispatchAction);
    assert.deepEqual(Object.keys(dispatchAction), [
      "incrementBy",
      "concat",
      "clearString",
    ]);
    assert.deepEqual(Object.keys(newDispatchAction), [
      "incrementBy",
      "clearString",
      "different",
    ]);
  });

  test("rerender with additional reducer names does return different dispatchAction instance", () => {
    const { result, rerender } = renderUseLocalSlice({
      initialState: {
        numberProp: 3,
        stringProp: "hello",
      },
      reducers: {
        incrementBy(state, action: { payload: number }) {
          return { ...state, numberProp: state.numberProp + action.payload };
        },
        concat(state, action: { payload: string }) {
          return { ...state, stringProp: state.stringProp + action.payload };
        },
        clearString(state) {
          return { ...state, stringProp: "" };
        },
      },
    });

    const [, dispatchAction] = result.current;

    type S = {
      numberProp: number;
      stringProp: string;
    };

    rerender({
      initialState: {
        numberProp: 3,
        stringProp: "hello",
      },
      reducers: {
        incrementBy(state: S, action: { payload: number }) {
          return { ...state, numberProp: state.numberProp + action.payload };
        },
        concat(state: S, action: { payload: string }) {
          return { ...state, stringProp: state.stringProp + action.payload };
        },
        clearString(state: S) {
          return { ...state, stringProp: "" };
        },
        additional(state: S) {
          return state;
        },
      },
    } as any);

    const [, newDispatchAction] = result.current;

    assert.notEqual(dispatchAction, newDispatchAction);

    assert.deepEqual(Object.keys(dispatchAction), [
      "incrementBy",
      "concat",
      "clearString",
    ]);
    assert.deepEqual(Object.keys(newDispatchAction), [
      "incrementBy",
      "concat",
      "clearString",
      "additional",
    ]);
  });

  test("reducer implementations can be exchanged for others between renders", () => {
    const { result, rerender } = renderUseLocalSlice({
      initialState: 5,
      reducers: {
        increment(state) {
          return state + 1;
        },
      },
    });

    let [state, dispatchAction] = result.current;
    assert.equal(state, 5);

    act(() => dispatchAction.increment());
    [state] = result.current;
    assert.equal(state, 6);

    rerender({
      initialState: 5,
      reducers: {
        increment(state) {
          return state + 10;
        },
      },
    });

    let [, newDispatchAction] = result.current;
    assert.equal(dispatchAction, newDispatchAction);

    act(() => dispatchAction.increment());
    [state] = result.current;
    assert.equal(state, 16);
  });
});

describe("immer integration in reducers", () => {
  test("modification of draft", () => {
    const { result } = renderUseLocalSlice({
      initialState: {
        stringProp: "hello",
      },
      reducers: {
        concat(state, action: { payload: string }) {
          state.stringProp += action.payload;
        },
      },
    });

    let [state, dispatchAction] = result.current;
    assert.deepEqual(state, { stringProp: "hello" });

    act(() => dispatchAction.concat(" world"));
    let [newState] = result.current;
    assert.deepEqual(newState, { stringProp: "hello world" });
    assert.notEqual(newState, state);
  });

  test("returning of modified draft", () => {
    const { result } = renderUseLocalSlice({
      initialState: {
        stringProp: "hello",
      },
      reducers: {
        concat(state, action: { payload: string }) {
          state.stringProp += action.payload;
          return state;
        },
      },
    });

    let [state, dispatchAction] = result.current;
    assert.deepEqual(state, { stringProp: "hello" });

    act(() => dispatchAction.concat(" world"));
    let [newState] = result.current;
    assert.deepEqual(newState, { stringProp: "hello world" });
    assert.notEqual(newState, state);
  });

  test("return something different", () => {
    const { result } = renderUseLocalSlice({
      initialState: {
        stringProp: "hello",
      },
      reducers: {
        concat(state, action: { payload: string }) {
          return { stringProp: state.stringProp + action.payload };
        },
      },
    });

    let [state, dispatchAction] = result.current;
    assert.deepEqual(state, { stringProp: "hello" });

    act(() => dispatchAction.concat(" world"));
    let [newState] = result.current;
    assert.deepEqual(newState, { stringProp: "hello world" });
    assert.notEqual(newState, state);
  });
});
