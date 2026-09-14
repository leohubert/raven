/**
 * Bridges a synchronous producer (the pool calls `push` whenever it likes) to an
 * asynchronous consumer (a streaming handler's `yield*`). A buffer alone would drop the
 * wakeup for a parked consumer; a pending-resolver alone would drop a message pushed
 * before anyone is awaiting. Both are needed together.
 */
export function newOutbox<T>() {
	const buffer: T[] = [];
	let pendingResolve: ((result: IteratorResult<T>) => void) | null = null;
	let closed = false;

	function push(value: T): void {
		if (closed) return;
		if (pendingResolve) {
			const resolve = pendingResolve;
			pendingResolve = null;
			resolve({ value, done: false });
			return;
		}
		buffer.push(value);
	}

	function close(): void {
		if (closed) return;
		closed = true;
		if (pendingResolve) {
			const resolve = pendingResolve;
			pendingResolve = null;
			resolve({ value: undefined, done: true });
		}
	}

	function next(): Promise<IteratorResult<T>> {
		if (buffer.length > 0) {
			const value = buffer.shift() as T;
			return Promise.resolve({ value, done: false });
		}
		if (closed) return Promise.resolve({ value: undefined, done: true });
		return new Promise((resolve) => {
			pendingResolve = resolve;
		});
	}

	return {
		push,
		close,
		[Symbol.asyncIterator](): AsyncIterator<T> {
			return { next };
		},
	};
}
