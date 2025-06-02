import { createRenderEffect, untrack } from "solid-js";

export const NOOP = () => {};

const neverResolvingPromise = new Promise<void>(NOOP);

/**
 *
 * @param ms if not passed with a number, use this as a cheap queueMicrotask, if passed with infinity returns a promise that never resolves
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
