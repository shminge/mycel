/**
 * The main Mycel object, which handles overall state
 */
class _Mycel {
  currentComputation: Computation | null = null;
  queue: Computation[] = [];
  isBatching: boolean = false;
  epoch: number = 0;

  private constructor() {}

  static _instance: _Mycel = new _Mycel();

  schedule(comp: Computation) {
    if (this.isBatching) {
      this.queue.push(comp);
    } else {
      comp.run();
    }
  }
}

const mycel = _Mycel._instance;

/**
 * A reactive computation that re-runs whenever its dependents change.
 */
export class Computation {
  private fn: () => void;

  constructor(fn: () => void) {
    this.fn = fn;
    this.run();
  }

  run() {
    mycel.currentComputation = this;
    this.fn();
    mycel.currentComputation = null;
  }
}

/**
 * Helper shorthand to initialise reactive variables
 * @param val either the inital value or the derivation
 * @returns
 */
export function v<T>(val: T | (() => T)): Reative<T> {
  return new Reative(val);
}

/**
 * A reactive value
 */
class Reative<T> {
  private value!: T;
  private listeners: Set<Computation> = new Set();
  private computation: Computation | null = null;

  constructor(v: T | (() => T)) {
    if (isFunction(v)) {
      this.computation = new Computation(() => {
        this.value = v();
      });
    } else {
      this.value = v;
    }
  }

  private notify() {
    this.listeners.forEach((comp) => mycel.schedule(comp));
    this.listeners.clear();
  }
}

// Utilities
// Type Guard:
function isFunction<T>(v: T | (() => T)): v is () => T {
  return typeof v === "function";
}
