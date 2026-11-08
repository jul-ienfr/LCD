import { In as safe_not_equal, Ir as run_all, Nr as noop, f as untrack } from "/node_modules/.vite/deps/runtime-BOFXI46e.js?v=70f5904f";
// node_modules/svelte/src/store/utils.js
/** @import { Readable } from './public' */
/**
* @template T
* @param {Readable<T> | null | undefined} store
* @param {(value: T) => void} run
* @param {(value: T) => void} [invalidate]
* @returns {() => void}
*/
function subscribe_to_store(store, run, invalidate) {
	if (store == null) {
		run(void 0);
		if (invalidate) invalidate(void 0);
		return noop;
	}
	const unsub = untrack(() => store.subscribe(run, invalidate));
	return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
// node_modules/svelte/src/store/shared/index.js
/** @import { Readable, StartStopNotifier, Subscriber, Unsubscriber, Updater, Writable } from '../public.js' */
/** @import { Stores, StoresValues, SubscribeInvalidateTuple } from '../private.js' */
/**
* @type {Array<SubscribeInvalidateTuple<any> | any>}
*/
var subscriber_queue = [];
/**
* Creates a `Readable` store that allows reading by subscription.
*
* @template T
* @param {T} [value] initial value
* @param {StartStopNotifier<T>} [start]
* @returns {Readable<T>}
*/
function readable(value, start) {
	return { subscribe: writable(value, start).subscribe };
}
/**
* Create a `Writable` store that allows both updating and reading by subscription.
*
* @template T
* @param {T} [value] initial value
* @param {StartStopNotifier<T>} [start]
* @returns {Writable<T>}
*/
function writable(value, start = noop) {
	/** @type {Unsubscriber | null} */
	let stop = null;
	/** @type {Set<SubscribeInvalidateTuple<T>>} */
	const subscribers = /* @__PURE__ */ new Set();
	/**
	* @param {T} new_value
	* @returns {void}
	*/
	function set(new_value) {
		if (safe_not_equal(value, new_value)) {
			value = new_value;
			if (stop) {
				const run_queue = !subscriber_queue.length;
				for (const subscriber of subscribers) {
					subscriber[1]();
					subscriber_queue.push(subscriber, value);
				}
				if (run_queue) {
					for (let i = 0; i < subscriber_queue.length; i += 2) subscriber_queue[i][0](subscriber_queue[i + 1]);
					subscriber_queue.length = 0;
				}
			}
		}
	}
	/**
	* @param {Updater<T>} fn
	* @returns {void}
	*/
	function update(fn) {
		set(fn(value));
	}
	/**
	* @param {Subscriber<T>} run
	* @param {() => void} [invalidate]
	* @returns {Unsubscriber}
	*/
	function subscribe(run, invalidate = noop) {
		/** @type {SubscribeInvalidateTuple<T>} */
		const subscriber = [run, invalidate];
		subscribers.add(subscriber);
		if (subscribers.size === 1) stop = start(set, update) || noop;
		run(value);
		return () => {
			subscribers.delete(subscriber);
			if (subscribers.size === 0 && stop) {
				stop();
				stop = null;
			}
		};
	}
	return {
		set,
		update,
		subscribe
	};
}
/**
* Derived value store by synchronizing one or more readable stores and
* applying an aggregation function over its input values.
*
* @template {Stores} S
* @template T
* @overload
* @param {S} stores
* @param {(values: StoresValues<S>, set: (value: T) => void, update: (fn: Updater<T>) => void) => Unsubscriber | void} fn
* @param {T} [initial_value]
* @returns {Readable<T>}
*/
/**
* Derived value store by synchronizing one or more readable stores and
* applying an aggregation function over its input values.
*
* @template {Stores} S
* @template T
* @overload
* @param {S} stores
* @param {(values: StoresValues<S>) => T} fn
* @param {T} [initial_value]
* @returns {Readable<T>}
*/
/**
* @template {Stores} S
* @template T
* @param {S} stores
* @param {Function} fn
* @param {T} [initial_value]
* @returns {Readable<T>}
*/
function derived(stores, fn, initial_value) {
	const single = !Array.isArray(stores);
	/** @type {Array<Readable<any>>} */
	const stores_array = single ? [stores] : stores;
	if (!stores_array.every(Boolean)) throw new Error("derived() expects stores as input, got a falsy value");
	const auto = fn.length < 2;
	return readable(initial_value, (set, update) => {
		let started = false;
		/** @type {T[]} */
		const values = [];
		let pending = 0;
		let cleanup = noop;
		const sync = () => {
			if (pending) return;
			cleanup();
			const result = fn(single ? values[0] : values, set, update);
			if (auto) set(result);
			else cleanup = typeof result === "function" ? result : noop;
		};
		const unsubscribers = stores_array.map((store, i) => subscribe_to_store(store, (value) => {
			values[i] = value;
			pending &= ~(1 << i);
			if (started) sync();
		}, () => {
			pending |= 1 << i;
		}));
		started = true;
		sync();
		return function stop() {
			run_all(unsubscribers);
			cleanup();
			started = false;
		};
	});
}
/**
* Takes a store and returns a new one derived from the old one that is readable.
*
* @template T
* @param {Readable<T>} store  - store to make readonly
* @returns {Readable<T>}
*/
function readonly(store) {
	return { subscribe: store.subscribe.bind(store) };
}
/**
* Get the current value from a store by subscribing and immediately unsubscribing.
*
* @template T
* @param {Readable<T>} store
* @returns {T}
*/
function get(store) {
	let value;
	subscribe_to_store(store, (_) => value = _)();
	return value;
}
export { writable as a, readonly as i, get as n, subscribe_to_store as o, readable as r, derived as t };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLUNCa0Y1VDFGLmpzIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIi4uLy4uL3N2ZWx0ZS9zcmMvc3RvcmUvdXRpbHMuanMiLCIuLi8uLi9zdmVsdGUvc3JjL3N0b3JlL3NoYXJlZC9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGltcG9ydCB7IFJlYWRhYmxlIH0gZnJvbSAnLi9wdWJsaWMnICovXG5pbXBvcnQgeyB1bnRyYWNrIH0gZnJvbSAnLi4vaW50ZXJuYWwvY2xpZW50L3J1bnRpbWUuanMnO1xuaW1wb3J0IHsgbm9vcCB9IGZyb20gJy4uL2ludGVybmFsL3NoYXJlZC91dGlscy5qcyc7XG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7UmVhZGFibGU8VD4gfCBudWxsIHwgdW5kZWZpbmVkfSBzdG9yZVxuICogQHBhcmFtIHsodmFsdWU6IFQpID0+IHZvaWR9IHJ1blxuICogQHBhcmFtIHsodmFsdWU6IFQpID0+IHZvaWR9IFtpbnZhbGlkYXRlXVxuICogQHJldHVybnMgeygpID0+IHZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdWJzY3JpYmVfdG9fc3RvcmUoc3RvcmUsIHJ1biwgaW52YWxpZGF0ZSkge1xuXHRpZiAoc3RvcmUgPT0gbnVsbCkge1xuXHRcdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0XHRydW4odW5kZWZpbmVkKTtcblxuXHRcdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0XHRpZiAoaW52YWxpZGF0ZSkgaW52YWxpZGF0ZSh1bmRlZmluZWQpO1xuXG5cdFx0cmV0dXJuIG5vb3A7XG5cdH1cblxuXHQvLyBTdmVsdGUgc3RvcmUgdGFrZXMgYSBwcml2YXRlIHNlY29uZCBhcmd1bWVudFxuXHQvLyBTdGFydFN0b3BOb3RpZmllciBjb3VsZCBtdXRhdGUgc3RhdGUsIGFuZCB3ZSB3YW50IHRvIHNpbGVuY2UgdGhlIGNvcnJlc3BvbmRpbmcgdmFsaWRhdGlvbiBlcnJvclxuXHRjb25zdCB1bnN1YiA9IHVudHJhY2soKCkgPT5cblx0XHRzdG9yZS5zdWJzY3JpYmUoXG5cdFx0XHRydW4sXG5cdFx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0XHRpbnZhbGlkYXRlXG5cdFx0KVxuXHQpO1xuXG5cdC8vIEFsc28gc3VwcG9ydCBSeEpTXG5cdC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETyBmaXggdGhpcyBpbiB0aGUgdHlwZXM/XG5cdHJldHVybiB1bnN1Yi51bnN1YnNjcmliZSA/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKCkgOiB1bnN1Yjtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgUmVhZGFibGUsIFN0YXJ0U3RvcE5vdGlmaWVyLCBTdWJzY3JpYmVyLCBVbnN1YnNjcmliZXIsIFVwZGF0ZXIsIFdyaXRhYmxlIH0gZnJvbSAnLi4vcHVibGljLmpzJyAqL1xuLyoqIEBpbXBvcnQgeyBTdG9yZXMsIFN0b3Jlc1ZhbHVlcywgU3Vic2NyaWJlSW52YWxpZGF0ZVR1cGxlIH0gZnJvbSAnLi4vcHJpdmF0ZS5qcycgKi9cbmltcG9ydCB7IG5vb3AsIHJ1bl9hbGwgfSBmcm9tICcuLi8uLi9pbnRlcm5hbC9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0IHsgc2FmZV9ub3RfZXF1YWwgfSBmcm9tICcuLi8uLi9pbnRlcm5hbC9jbGllbnQvcmVhY3Rpdml0eS9lcXVhbGl0eS5qcyc7XG5pbXBvcnQgeyBzdWJzY3JpYmVfdG9fc3RvcmUgfSBmcm9tICcuLi91dGlscy5qcyc7XG5cbi8qKlxuICogQHR5cGUge0FycmF5PFN1YnNjcmliZUludmFsaWRhdGVUdXBsZTxhbnk+IHwgYW55Pn1cbiAqL1xuY29uc3Qgc3Vic2NyaWJlcl9xdWV1ZSA9IFtdO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBgUmVhZGFibGVgIHN0b3JlIHRoYXQgYWxsb3dzIHJlYWRpbmcgYnkgc3Vic2NyaXB0aW9uLlxuICpcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1R9IFt2YWx1ZV0gaW5pdGlhbCB2YWx1ZVxuICogQHBhcmFtIHtTdGFydFN0b3BOb3RpZmllcjxUPn0gW3N0YXJ0XVxuICogQHJldHVybnMge1JlYWRhYmxlPFQ+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZGFibGUodmFsdWUsIHN0YXJ0KSB7XG5cdHJldHVybiB7XG5cdFx0c3Vic2NyaWJlOiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQpLnN1YnNjcmliZVxuXHR9O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGBXcml0YWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgYm90aCB1cGRhdGluZyBhbmQgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7VH0gW3ZhbHVlXSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyPFQ+fSBbc3RhcnRdXG4gKiBAcmV0dXJucyB7V3JpdGFibGU8VD59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQgPSBub29wKSB7XG5cdC8qKiBAdHlwZSB7VW5zdWJzY3JpYmVyIHwgbnVsbH0gKi9cblx0bGV0IHN0b3AgPSBudWxsO1xuXG5cdC8qKiBAdHlwZSB7U2V0PFN1YnNjcmliZUludmFsaWRhdGVUdXBsZTxUPj59ICovXG5cdGNvbnN0IHN1YnNjcmliZXJzID0gbmV3IFNldCgpO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge1R9IG5ld192YWx1ZVxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdGZ1bmN0aW9uIHNldChuZXdfdmFsdWUpIHtcblx0XHRpZiAoc2FmZV9ub3RfZXF1YWwodmFsdWUsIG5ld192YWx1ZSkpIHtcblx0XHRcdHZhbHVlID0gbmV3X3ZhbHVlO1xuXHRcdFx0aWYgKHN0b3ApIHtcblx0XHRcdFx0Ly8gc3RvcmUgaXMgcmVhZHlcblx0XHRcdFx0Y29uc3QgcnVuX3F1ZXVlID0gIXN1YnNjcmliZXJfcXVldWUubGVuZ3RoO1xuXHRcdFx0XHRmb3IgKGNvbnN0IHN1YnNjcmliZXIgb2Ygc3Vic2NyaWJlcnMpIHtcblx0XHRcdFx0XHRzdWJzY3JpYmVyWzFdKCk7XG5cdFx0XHRcdFx0c3Vic2NyaWJlcl9xdWV1ZS5wdXNoKHN1YnNjcmliZXIsIHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAocnVuX3F1ZXVlKSB7XG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDsgaSArPSAyKSB7XG5cdFx0XHRcdFx0XHRzdWJzY3JpYmVyX3F1ZXVlW2ldWzBdKHN1YnNjcmliZXJfcXVldWVbaSArIDFdKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0c3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGggPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7VXBkYXRlcjxUPn0gZm5cblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGUoZm4pIHtcblx0XHRzZXQoZm4oLyoqIEB0eXBlIHtUfSAqLyAodmFsdWUpKSk7XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIHtTdWJzY3JpYmVyPFQ+fSBydW5cblx0ICogQHBhcmFtIHsoKSA9PiB2b2lkfSBbaW52YWxpZGF0ZV1cblx0ICogQHJldHVybnMge1Vuc3Vic2NyaWJlcn1cblx0ICovXG5cdGZ1bmN0aW9uIHN1YnNjcmliZShydW4sIGludmFsaWRhdGUgPSBub29wKSB7XG5cdFx0LyoqIEB0eXBlIHtTdWJzY3JpYmVJbnZhbGlkYXRlVHVwbGU8VD59ICovXG5cdFx0Y29uc3Qgc3Vic2NyaWJlciA9IFtydW4sIGludmFsaWRhdGVdO1xuXHRcdHN1YnNjcmliZXJzLmFkZChzdWJzY3JpYmVyKTtcblx0XHRpZiAoc3Vic2NyaWJlcnMuc2l6ZSA9PT0gMSkge1xuXHRcdFx0c3RvcCA9IHN0YXJ0KHNldCwgdXBkYXRlKSB8fCBub29wO1xuXHRcdH1cblx0XHRydW4oLyoqIEB0eXBlIHtUfSAqLyAodmFsdWUpKTtcblx0XHRyZXR1cm4gKCkgPT4ge1xuXHRcdFx0c3Vic2NyaWJlcnMuZGVsZXRlKHN1YnNjcmliZXIpO1xuXHRcdFx0aWYgKHN1YnNjcmliZXJzLnNpemUgPT09IDAgJiYgc3RvcCkge1xuXHRcdFx0XHRzdG9wKCk7XG5cdFx0XHRcdHN0b3AgPSBudWxsO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cblx0cmV0dXJuIHsgc2V0LCB1cGRhdGUsIHN1YnNjcmliZSB9O1xufVxuXG4vKipcbiAqIERlcml2ZWQgdmFsdWUgc3RvcmUgYnkgc3luY2hyb25pemluZyBvbmUgb3IgbW9yZSByZWFkYWJsZSBzdG9yZXMgYW5kXG4gKiBhcHBseWluZyBhbiBhZ2dyZWdhdGlvbiBmdW5jdGlvbiBvdmVyIGl0cyBpbnB1dCB2YWx1ZXMuXG4gKlxuICogQHRlbXBsYXRlIHtTdG9yZXN9IFNcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAb3ZlcmxvYWRcbiAqIEBwYXJhbSB7U30gc3RvcmVzXG4gKiBAcGFyYW0geyh2YWx1ZXM6IFN0b3Jlc1ZhbHVlczxTPiwgc2V0OiAodmFsdWU6IFQpID0+IHZvaWQsIHVwZGF0ZTogKGZuOiBVcGRhdGVyPFQ+KSA9PiB2b2lkKSA9PiBVbnN1YnNjcmliZXIgfCB2b2lkfSBmblxuICogQHBhcmFtIHtUfSBbaW5pdGlhbF92YWx1ZV1cbiAqIEByZXR1cm5zIHtSZWFkYWJsZTxUPn1cbiAqL1xuLyoqXG4gKiBEZXJpdmVkIHZhbHVlIHN0b3JlIGJ5IHN5bmNocm9uaXppbmcgb25lIG9yIG1vcmUgcmVhZGFibGUgc3RvcmVzIGFuZFxuICogYXBwbHlpbmcgYW4gYWdncmVnYXRpb24gZnVuY3Rpb24gb3ZlciBpdHMgaW5wdXQgdmFsdWVzLlxuICpcbiAqIEB0ZW1wbGF0ZSB7U3RvcmVzfSBTXG4gKiBAdGVtcGxhdGUgVFxuICogQG92ZXJsb2FkXG4gKiBAcGFyYW0ge1N9IHN0b3Jlc1xuICogQHBhcmFtIHsodmFsdWVzOiBTdG9yZXNWYWx1ZXM8Uz4pID0+IFR9IGZuXG4gKiBAcGFyYW0ge1R9IFtpbml0aWFsX3ZhbHVlXVxuICogQHJldHVybnMge1JlYWRhYmxlPFQ+fVxuICovXG4vKipcbiAqIEB0ZW1wbGF0ZSB7U3RvcmVzfSBTXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtTfSBzdG9yZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge1R9IFtpbml0aWFsX3ZhbHVlXVxuICogQHJldHVybnMge1JlYWRhYmxlPFQ+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVyaXZlZChzdG9yZXMsIGZuLCBpbml0aWFsX3ZhbHVlKSB7XG5cdGNvbnN0IHNpbmdsZSA9ICFBcnJheS5pc0FycmF5KHN0b3Jlcyk7XG5cdC8qKiBAdHlwZSB7QXJyYXk8UmVhZGFibGU8YW55Pj59ICovXG5cdGNvbnN0IHN0b3Jlc19hcnJheSA9IHNpbmdsZSA/IFtzdG9yZXNdIDogc3RvcmVzO1xuXHRpZiAoIXN0b3Jlc19hcnJheS5ldmVyeShCb29sZWFuKSkge1xuXHRcdHRocm93IG5ldyBFcnJvcignZGVyaXZlZCgpIGV4cGVjdHMgc3RvcmVzIGFzIGlucHV0LCBnb3QgYSBmYWxzeSB2YWx1ZScpO1xuXHR9XG5cdGNvbnN0IGF1dG8gPSBmbi5sZW5ndGggPCAyO1xuXHRyZXR1cm4gcmVhZGFibGUoaW5pdGlhbF92YWx1ZSwgKHNldCwgdXBkYXRlKSA9PiB7XG5cdFx0bGV0IHN0YXJ0ZWQgPSBmYWxzZTtcblx0XHQvKiogQHR5cGUge1RbXX0gKi9cblx0XHRjb25zdCB2YWx1ZXMgPSBbXTtcblx0XHRsZXQgcGVuZGluZyA9IDA7XG5cdFx0bGV0IGNsZWFudXAgPSBub29wO1xuXHRcdGNvbnN0IHN5bmMgPSAoKSA9PiB7XG5cdFx0XHRpZiAocGVuZGluZykge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjbGVhbnVwKCk7XG5cdFx0XHRjb25zdCByZXN1bHQgPSBmbihzaW5nbGUgPyB2YWx1ZXNbMF0gOiB2YWx1ZXMsIHNldCwgdXBkYXRlKTtcblx0XHRcdGlmIChhdXRvKSB7XG5cdFx0XHRcdHNldChyZXN1bHQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y2xlYW51cCA9IHR5cGVvZiByZXN1bHQgPT09ICdmdW5jdGlvbicgPyByZXN1bHQgOiBub29wO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0Y29uc3QgdW5zdWJzY3JpYmVycyA9IHN0b3Jlc19hcnJheS5tYXAoKHN0b3JlLCBpKSA9PlxuXHRcdFx0c3Vic2NyaWJlX3RvX3N0b3JlKFxuXHRcdFx0XHRzdG9yZSxcblx0XHRcdFx0KHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dmFsdWVzW2ldID0gdmFsdWU7XG5cdFx0XHRcdFx0cGVuZGluZyAmPSB+KDEgPDwgaSk7XG5cdFx0XHRcdFx0aWYgKHN0YXJ0ZWQpIHtcblx0XHRcdFx0XHRcdHN5bmMoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdCgpID0+IHtcblx0XHRcdFx0XHRwZW5kaW5nIHw9IDEgPDwgaTtcblx0XHRcdFx0fVxuXHRcdFx0KVxuXHRcdCk7XG5cdFx0c3RhcnRlZCA9IHRydWU7XG5cdFx0c3luYygpO1xuXHRcdHJldHVybiBmdW5jdGlvbiBzdG9wKCkge1xuXHRcdFx0cnVuX2FsbCh1bnN1YnNjcmliZXJzKTtcblx0XHRcdGNsZWFudXAoKTtcblx0XHRcdC8vIFdlIG5lZWQgdG8gc2V0IHRoaXMgdG8gZmFsc2UgYmVjYXVzZSBjYWxsYmFja3MgY2FuIHN0aWxsIGhhcHBlbiBkZXNwaXRlIGhhdmluZyB1bnN1YnNjcmliZWQ6XG5cdFx0XHQvLyBDYWxsYmFja3MgbWlnaHQgYWxyZWFkeSBiZSBwbGFjZWQgaW4gdGhlIHF1ZXVlIHdoaWNoIGRvZXNuJ3Qga25vdyBpdCBzaG91bGQgbm8gbG9uZ2VyXG5cdFx0XHQvLyBpbnZva2UgdGhpcyBkZXJpdmVkIHN0b3JlLlxuXHRcdFx0c3RhcnRlZCA9IGZhbHNlO1xuXHRcdH07XG5cdH0pO1xufVxuXG4vKipcbiAqIFRha2VzIGEgc3RvcmUgYW5kIHJldHVybnMgYSBuZXcgb25lIGRlcml2ZWQgZnJvbSB0aGUgb2xkIG9uZSB0aGF0IGlzIHJlYWRhYmxlLlxuICpcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1JlYWRhYmxlPFQ+fSBzdG9yZSAgLSBzdG9yZSB0byBtYWtlIHJlYWRvbmx5XG4gKiBAcmV0dXJucyB7UmVhZGFibGU8VD59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkb25seShzdG9yZSkge1xuXHRyZXR1cm4ge1xuXHRcdC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETyBpIHN1c3BlY3QgdGhlIGJpbmQgaXMgdW5uZWNlc3Nhcnlcblx0XHRzdWJzY3JpYmU6IHN0b3JlLnN1YnNjcmliZS5iaW5kKHN0b3JlKVxuXHR9O1xufVxuXG4vKipcbiAqIEdldCB0aGUgY3VycmVudCB2YWx1ZSBmcm9tIGEgc3RvcmUgYnkgc3Vic2NyaWJpbmcgYW5kIGltbWVkaWF0ZWx5IHVuc3Vic2NyaWJpbmcuXG4gKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7UmVhZGFibGU8VD59IHN0b3JlXG4gKiBAcmV0dXJucyB7VH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldChzdG9yZSkge1xuXHRsZXQgdmFsdWU7XG5cdHN1YnNjcmliZV90b19zdG9yZShzdG9yZSwgKF8pID0+ICh2YWx1ZSA9IF8pKSgpO1xuXHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdHJldHVybiB2YWx1ZTtcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVdBLFNBQWdCLG1CQUFtQixPQUFPLEtBQUssWUFBWTtDQUMxRCxJQUFJLFNBQVMsTUFBTTtFQUVsQixJQUFJLEtBQUEsQ0FBUztFQUdiLElBQUksWUFBWSxXQUFXLEtBQUEsQ0FBUztFQUVwQyxPQUFPO0NBQ1I7Q0FJQSxNQUFNLFFBQVEsY0FDYixNQUFNLFVBQ0wsS0FFQSxVQUNELENBQ0Q7Q0FJQSxPQUFPLE1BQU0sb0JBQW9CLE1BQU0sWUFBWSxJQUFJO0FBQ3hEOzs7Ozs7O0FDMUJBLElBQU0sbUJBQW1CLENBQUM7Ozs7Ozs7OztBQVUxQixTQUFnQixTQUFTLE9BQU8sT0FBTztDQUN0QyxPQUFPLEVBQ04sV0FBVyxTQUFT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