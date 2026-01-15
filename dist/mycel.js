/**
 * The main Mycel object, which handles overall state
 */
class _Mycel {
  currentComputation = null;
  queue = new Set();
  isBatching = false;
  schedule(comp) {
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
  fn;
  constructor(fn) {
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
export function v(val) {
  return new Reactive(val);
}
/**
 * A reactive value
 */
class Reactive {
  value;
  listeners = new Set();
  computation = null;
  constructor(v) {
    if (isFunction(v)) {
      this.computation = new Computation(() => {
        this.value = v();
      });
    } else {
      this.value = v;
    }
  }
  notify() {
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
  set(v) {
    if (this.computation) {
      throw new Error("Tried to call set on a computed value");
    }
    this.value = v;
    this.notify();
  }
  update(fn) {
    this.set(fn(this.value));
  }
}
/**
 * Calls a batch of functions, combines notifications at the end
 */
function batch(fn) {
  mycel.isBatching = true;
  fn();
  mycel.isBatching = false;
  mycel.flush();
}
// Utilities
// Type Guard:
function isFunction(v) {
  return typeof v === "function";
}
