import { renderHook, cleanup, act } from "react-hooks-testing-library";
import { useLocalSlice, UseLocalSliceOptions, ReducerMap } from "./";
import { Middleware } from "redux";

afterEach(cleanup);

function renderUseLocalSlice<S, R extends ReducerMap<S>>(
  options: UseLocalSliceOptions<S, R>
) {
  return renderHook((opts: UseLocalSliceOptions<S, R>) => useLocalSlice(opts), {
    initialProps: options
  });
}

describe("basic behaviour", () => {
  test("initial state", () => {
    const { result } = renderUseLocalSlice({
      initialState: { value: "test" },
      reducers: {}
    });

    const {
      current: [state]
    } = result;
    expect(state).toEqual({ value: "test" });
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
        }
      }
    });

    const {
      current: [, dispatchAction]
    } = result;
    expect(dispatchAction).toEqual({
      a: expect.any(Function),
      b: expect.any(Function)
    });
  });

  test("reducer without argument", () => {
    const { result } = renderUseLocalSlice({
      initialState: 5,
      reducers: {
        increment(state) {
          return state + 1;
        }
      }
    });

    let [state, dispatchAction] = result.current;
    expect(state).toEqual(5);

    act(() => dispatchAction.increment());
    [state, dispatchAction] = result.current;
    expect(state).toEqual(6);
  });

  test("reducer with argument", () => {
    const { result } = renderUseLocalSlice({
      initialState: 5,
      reducers: {
        incrementBy(state, action: { payload: number }) {
          return state + action.payload;
        }
      }
    });

    let [state, dispatchAction] = result.current;
    expect(state).toEqual(5);

    act(() => dispatchAction.incrementBy(9));
    [state, dispatchAction] = result.current;
    expect(state).toEqual(14);
  });

  test("multiple reducers in complex state", () => {
    const { result } = renderUseLocalSlice({
      initialState: {
        numberProp: 3,
        stringProp: "hello"
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
        }
      }
    });

    let [state, dispatchAction] = result.current;
    expect(state).toEqual({
      numberProp: 3,
      stringProp: "hello"
    });

    act(() => dispatchAction.incrementBy(9));
    [state, dispatchAction] = result.current;
    expect(state.numberProp).toEqual(12);

    act(() => dispatchAction.concat(" world"));
    [state, dispatchAction] = result.current;
    expect(state.stringProp).toEqual("hello world");

    act(() => dispatchAction.clearString());
    [state, dispatchAction] = result.current;
    expect(state.stringProp).toEqual("");

    act(() => dispatchAction.concat("new value"));
    [state, dispatchAction] = result.current;
    expect(state.stringProp).toEqual("new value");
  });

  test("rerender with same reducer names does return same dispatchAction instance", () => {
    const { result, rerender } = renderUseLocalSlice({
      initialState: {
        numberProp: 3,
        stringProp: "hello"
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
        }
      }
    });

    const [, dispatchAction] = result.current;

    rerender({
      initialState: {
        numberProp: 3,
        stringProp: "hello"
      },
      reducers: {
        incrementBy(state, action: { payload: number }) {
          // definitely different implementation - should not matter
          return state;
        },
        concat(state, action: { payload: string }) {
          return state;
        },
        clearString(state) {
          return state;
        }
      }
    });

    const [, newDispatchAction] = result.current;

    expect(dispatchAction).toBe(newDispatchAction);
  });

  test("rerender with different reducer names does return different dispatchAction instance", () => {
    const { result, rerender } = renderUseLocalSlice({
      initialState: {
        numberProp: 3,
        stringProp: "hello"
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
        }
      }
    });

    const [, dispatchAction] = result.current;

    type S = {
      numberProp: number;
      stringProp: string;
    };

    rerender({
      initialState: {
        numberProp: 3,
        stringProp: "hello"
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
        }
      }
    } as any);

    const [, newDispatchAction] = result.current;

    expect(dispatchAction).not.toBe(newDispatchAction);
    expect(Object.keys(dispatchAction)).toEqual([
      "incrementBy",
      "concat",
      "clearString"
    ]);
    expect(Object.keys(newDispatchAction)).toEqual([
      "incrementBy",
      "clearString",
      "different"
    ]);
  });

  test("rerender with additional reducer names does return different dispatchAction instance", () => {
    const { result, rerender } = renderUseLocalSlice({
      initialState: {
        numberProp: 3,
        stringProp: "hello"
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
        }
      }
    });

    const [, dispatchAction] = result.current;

    type S = {
      numberProp: number;
      stringProp: string;
    };

    rerender({
      initialState: {
        numberProp: 3,
        stringProp: "hello"
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
        }
      }
    } as any);

    const [, newDispatchAction] = result.current;

    expect(dispatchAction).not.toBe(newDispatchAction);

    expect(Object.keys(dispatchAction)).toEqual([
      "incrementBy",
      "concat",
      "clearString"
    ]);
    expect(Object.keys(newDispatchAction)).toEqual([
      "incrementBy",
      "concat",
      "clearString",
      "additional"
    ]);
  });

  test("reducer implementations can be exchanged for others between renders", () => {
    const { result, rerender } = renderUseLocalSlice({
      initialState: 5,
      reducers: {
        increment(state) {
          return state + 1;
        }
      }
    });

    let [state, dispatchAction] = result.current;
    expect(state).toBe(5);

    act(() => dispatchAction.increment());
    [state] = result.current;
    expect(state).toBe(6);

    rerender({
      initialState: 5,
      reducers: {
        increment(state) {
          return state + 10;
        }
      }
    });

    let [, newDispatchAction] = result.current;
    expect(dispatchAction).toBe(newDispatchAction);

    act(() => dispatchAction.increment());
    [state] = result.current;
    expect(state).toBe(16);
  });
});

describe("immer integration in reducers", () => {
  test("modification of draft", () => {
    const { result } = renderUseLocalSlice({
      initialState: {
        stringProp: "hello"
      },
      reducers: {
        concat(state, action: { payload: string }) {
          state.stringProp += action.payload;
        }
      }
    });

    let [state, dispatchAction] = result.current;
    expect(state).toEqual({ stringProp: "hello" });

    act(() => dispatchAction.concat(" world"));
    let [newState] = result.current;
    expect(newState).toEqual({ stringProp: "hello world" });
    expect(newState).not.toBe(state);
  });

  test("returning of modified draft", () => {
    const { result } = renderUseLocalSlice({
      initialState: {
        stringProp: "hello"
      },
      reducers: {
        concat(state, action: { payload: string }) {
          state.stringProp += action.payload;
          return state;
        }
      }
    });

    let [state, dispatchAction] = result.current;
    expect(state).toEqual({ stringProp: "hello" });

    act(() => dispatchAction.concat(" world"));
    let [newState] = result.current;
    expect(newState).toEqual({ stringProp: "hello world" });
    expect(newState).not.toBe(state);
  });

  test("return something different", () => {
    const { result } = renderUseLocalSlice({
      initialState: {
        stringProp: "hello"
      },
      reducers: {
        concat(state, action: { payload: string }) {
          return { stringProp: state.stringProp + action.payload };
        }
      }
    });

    let [state, dispatchAction] = result.current;
    expect(state).toEqual({ stringProp: "hello" });

    act(() => dispatchAction.concat(" world"));
    let [newState] = result.current;
    expect(newState).toEqual({ stringProp: "hello world" });
    expect(newState).not.toBe(state);
  });
});

describe("middlewares", () => {
  it("can access the state before next(action)", () => {
    let before: any;
    const middleware: Middleware = store => next => action => {
      before = store.getState();
      next(action);
    };

    const { result } = renderUseLocalSlice({
      initialState: {
        stringProp: "hello"
      },
      reducers: {
        concat(state, action: { payload: string }) {
          return { stringProp: state.stringProp + action.payload };
        }
      },
      middlewares: [middleware]
    });

    act(() => result.current[1].concat("test"));

    expect(before).toEqual({ stringProp: "hello" });
  });

  it("can NOT! access the state after next(action) synchronously", () => {
    let after: any;
    const middleware: Middleware = store => next => action => {
      next(action);
      after = store.getState();
    };

    const { result } = renderUseLocalSlice({
      initialState: {
        stringProp: "hello"
      },
      reducers: {
        concat(state, action: { payload: string }) {
          return { stringProp: state.stringProp + action.payload };
        }
      },
      middlewares: [middleware]
    });

    act(() => result.current[1].concat("test"));

    expect(after).not.toEqual(result.current[0]);
  });

  it("can access the state after next(action) by awaiting next asynchronously", async () => {
    let after: any;
    let onMiddlewareFinished: () => void;
    let middlewareFinished = new Promise(
      resolve => (onMiddlewareFinished = resolve)
    );

    const middleware: Middleware = store => next => async action => {
      await next(action);
      after = store.getState();
      onMiddlewareFinished!();
    };

    const { result } = renderUseLocalSlice({
      initialState: {
        stringProp: "hello"
      },
      reducers: {
        concat(state, action: { payload: string }) {
          return { stringProp: state.stringProp + action.payload };
        }
      },
      middlewares: [middleware]
    });

    act(() => void result.current[1].concat("test"));

    await middlewareFinished;

    expect(after).toEqual(result.current[0]);
  });

  it("can modify an action", () => {
    let after: any;
    const middleware: Middleware = store => next => action => {
      next({ ...action, payload: "foo" });
    };

    const { result } = renderUseLocalSlice({
      initialState: {
        stringProp: "hello"
      },
      reducers: {
        concat(state, action: { payload: string }) {
          return { stringProp: state.stringProp + action.payload };
        }
      },
      middlewares: [middleware]
    });

    act(() => result.current[1].concat("test"));

    expect(result.current[0]).toEqual({ stringProp: "hellofoo" });
  });

  it("can dispatch additional actions, correct order", () => {
    let after: any;
    const middleware: Middleware = store => next => action => {
      if (!("skip" in action)) {
        store.dispatch({ ...action, payload: "-before-", skip: true });
      }
      next(action);
      if (!("skip" in action)) {
        store.dispatch({ ...action, payload: "-after", skip: true });
      }
    };

    const { result } = renderUseLocalSlice({
      initialState: {
        stringProp: "hello"
      },
      reducers: {
        concat(state, action: { payload: string }) {
          return { stringProp: state.stringProp + action.payload };
        }
      },
      middlewares: [middleware]
    });

    act(() => result.current[1].concat("test"));

    expect(result.current[0]).toEqual({
      stringProp: "hello-before-test-after"
    });
  });
});
