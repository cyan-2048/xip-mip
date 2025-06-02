export function getOpenPromise() {
	const wrapper = {
		isResolved: false,
		isPending: true,
		isRejected: false,
	};
	let promise;
	let resolve = () => {};
	let reject = () => {};
	if (typeof Promise.withResolvers === "function") {
		const { promise: p, resolve: r, reject: j } = Promise.withResolvers();
		promise = p;
		resolve = r;
		reject = j;
	} else {
		promise = new Promise((r, j) => {
			resolve = r;
			reject = j;
		});
	}
	Object.assign(promise, {
		...wrapper,
		resolve,
		reject,
	});
	promise.then(
		(v) => {
			promise.isResolved = true;
			promise.isPending = false;
			promise.isRejected = false;
			return v;
		},
		(e) => {
			promise.isResolved = false;
			promise.isPending = false;
			promise.isRejected = true;
			throw e;
		}
	);
	return promise;
}
