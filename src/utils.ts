import { Store, StoreValue } from "nanostores";
import { Accessor, createRenderEffect, createSignal, onCleanup, untrack } from "solid-js";
import { useStore as _useStore } from "@nanostores/solid";

export const NOOP = () => {};

const neverResolvingPromise = new Promise<void>(NOOP);

/**
 *
 * @param ms if not passed with a number, use this as a cheap queueMicrotask (similar to svelte's `tick()`), if passed with infinity returns a promise that never resolves
 * @returns
 */
export function sleep(ms: void | number) {
	if (ms === undefined) {
		return Promise.resolve();
	}

	if (!Number.isFinite(ms)) {
		return neverResolvingPromise;
	}

	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * similar to onMount but basically before anything is *surely* mounted
 */
export function onBeforeMount(fn: () => void) {
	createRenderEffect(() => untrack(fn));
}

/**
 * custom behavior
 *
 * @param store Store instance.
 * @returns Store value.
 */
export function useStore<SomeStore extends Store, Value extends StoreValue<SomeStore>>(
	store: SomeStore | (() => SomeStore | undefined)
): Accessor<Value> {
	// if it's a function we do my implementation
	if (typeof store == "function") {
		const [state, setState] = createSignal(store()?.value);

		createRenderEffect(() => {
			const unsub = store()?.subscribe((val) => {
				setState(val);
			});

			unsub && onCleanup(unsub);
		});

		return state;
	}

	return _useStore(store);
}
