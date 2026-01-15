/**
 * The main Mycel object, which handles overall state
 */
class _Mycel {
  currentComputation: Computation | null = null;
  queue: Set<Computation> = new Set();
  isBatching: boolean = false;

  schedule(comp: Computation) {
    if (this.isBatching) {
      this.queue.add(comp);
    } else {
      comp.run();
    }
  }

  flush() {
    this.queue.forEach((c) => c.run());
  }
}

const mycel = new _Mycel();

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

  peek() {
    return this.value;
  }

  read() {
    if (mycel.currentComputation) {
      this.listeners.add(mycel.currentComputation);
    }
    return this.value;
  }

  set(v: T) {
    if (this.computation) {
      throw new Error("Tried to call set on a computed value");
    }
    this.value = v;
    this.notify();
  }

  update(fn: (v: T) => T) {
    this.set(fn(this.value));
  }
}

/**
 * Calls a batch of functions, combines notifications at the end
 */
function batch(fn: () => void) {
  mycel.isBatching = true;
  fn();
  mycel.isBatching = false;
  mycel.flush();
}

// Utilities
// Type Guard:
function isFunction<T>(v: T | (() => T)): v is () => T {
  return typeof v === "function";
}
