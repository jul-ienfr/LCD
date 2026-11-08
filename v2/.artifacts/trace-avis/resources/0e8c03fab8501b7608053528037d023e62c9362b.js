import "/node_modules/.vite/deps/esm-env-D8Yi5ac9.js?v=70f5904f";
import { Gt as queue_micro_task, a as get, f as untrack, ft as source, j as render_effect, ln as tag, st as increment, w as effect_tracking } from "/node_modules/.vite/deps/runtime-BOFXI46e.js?v=70f5904f";
// node_modules/svelte/src/reactivity/create-subscriber.js
/**
* Returns a `subscribe` function that integrates external event-based systems with Svelte's reactivity.
* It's particularly useful for integrating with web APIs like `MediaQuery`, `IntersectionObserver`, or `WebSocket`.
*
* If `subscribe` is called inside an effect (including indirectly, for example inside a getter),
* the `start` callback will be called with an `update` function. Whenever `update` is called, the effect re-runs.
*
* If `start` returns a cleanup function, it will be called when the effect is destroyed.
*
* If `subscribe` is called in multiple effects, `start` will only be called once as long as the effects
* are active, and the returned teardown function will only be called when all effects are destroyed.
*
* It's best understood with an example. Here's an implementation of [`MediaQuery`](https://svelte.dev/docs/svelte/svelte-reactivity#MediaQuery):
*
* ```js
* import { createSubscriber } from 'svelte/reactivity';
* import { on } from 'svelte/events';
*
* export class MediaQuery {
* 	#query;
* 	#subscribe;
*
* 	constructor(query) {
* 		this.#query = window.matchMedia(`(${query})`);
*
* 		this.#subscribe = createSubscriber((update) => {
* 			// when the `change` event occurs, re-run any effects that read `this.current`
* 			const off = on(this.#query, 'change', update);
*
* 			// stop listening when all the effects are destroyed
* 			return () => off();
* 		});
* 	}
*
* 	get current() {
* 		// This makes the getter reactive, if read in an effect
* 		this.#subscribe();
*
* 		// Return the current state of the query, whether or not we're in an effect
* 		return this.#query.matches;
* 	}
* }
* ```
* @param {(update: () => void) => (() => void) | void} start
* @since 5.7.0
*/
function createSubscriber(start) {
	let subscribers = 0;
	let version = source(0);
	/** @type {(() => void) | void} */
	let stop;
	tag(version, "createSubscriber version");
	return () => {
		if (effect_tracking()) {
			get(version);
			render_effect(() => {
				if (subscribers === 0) stop = untrack(() => start(() => increment(version)));
				subscribers += 1;
				return () => {
					queue_micro_task(() => {
						subscribers -= 1;
						if (subscribers === 0) {
							stop?.();
							stop = void 0;
							increment(version);
						}
					});
				};
			});
		}
	};
}
export { createSubscriber as t };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLXN1YnNjcmliZXItQ1BBdExreVEuanMiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiLi4vLi4vc3ZlbHRlL3NyYy9yZWFjdGl2aXR5L2NyZWF0ZS1zdWJzY3JpYmVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldCwgdGljaywgdW50cmFjayB9IGZyb20gJy4uL2ludGVybmFsL2NsaWVudC9ydW50aW1lLmpzJztcbmltcG9ydCB7IGVmZmVjdF90cmFja2luZywgcmVuZGVyX2VmZmVjdCB9IGZyb20gJy4uL2ludGVybmFsL2NsaWVudC9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgc291cmNlLCBpbmNyZW1lbnQgfSBmcm9tICcuLi9pbnRlcm5hbC9jbGllbnQvcmVhY3Rpdml0eS9zb3VyY2VzLmpzJztcbmltcG9ydCB7IHRhZyB9IGZyb20gJy4uL2ludGVybmFsL2NsaWVudC9kZXYvdHJhY2luZy5qcyc7XG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7IHF1ZXVlX21pY3JvX3Rhc2sgfSBmcm9tICcuLi9pbnRlcm5hbC9jbGllbnQvZG9tL3Rhc2suanMnO1xuXG4vKipcbiAqIFJldHVybnMgYSBgc3Vic2NyaWJlYCBmdW5jdGlvbiB0aGF0IGludGVncmF0ZXMgZXh0ZXJuYWwgZXZlbnQtYmFzZWQgc3lzdGVtcyB3aXRoIFN2ZWx0ZSdzIHJlYWN0aXZpdHkuXG4gKiBJdCdzIHBhcnRpY3VsYXJseSB1c2VmdWwgZm9yIGludGVncmF0aW5nIHdpdGggd2ViIEFQSXMgbGlrZSBgTWVkaWFRdWVyeWAsIGBJbnRlcnNlY3Rpb25PYnNlcnZlcmAsIG9yIGBXZWJTb2NrZXRgLlxuICpcbiAqIElmIGBzdWJzY3JpYmVgIGlzIGNhbGxlZCBpbnNpZGUgYW4gZWZmZWN0IChpbmNsdWRpbmcgaW5kaXJlY3RseSwgZm9yIGV4YW1wbGUgaW5zaWRlIGEgZ2V0dGVyKSxcbiAqIHRoZSBgc3RhcnRgIGNhbGxiYWNrIHdpbGwgYmUgY2FsbGVkIHdpdGggYW4gYHVwZGF0ZWAgZnVuY3Rpb24uIFdoZW5ldmVyIGB1cGRhdGVgIGlzIGNhbGxlZCwgdGhlIGVmZmVjdCByZS1ydW5zLlxuICpcbiAqIElmIGBzdGFydGAgcmV0dXJucyBhIGNsZWFudXAgZnVuY3Rpb24sIGl0IHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIGVmZmVjdCBpcyBkZXN0cm95ZWQuXG4gKlxuICogSWYgYHN1YnNjcmliZWAgaXMgY2FsbGVkIGluIG11bHRpcGxlIGVmZmVjdHMsIGBzdGFydGAgd2lsbCBvbmx5IGJlIGNhbGxlZCBvbmNlIGFzIGxvbmcgYXMgdGhlIGVmZmVjdHNcbiAqIGFyZSBhY3RpdmUsIGFuZCB0aGUgcmV0dXJuZWQgdGVhcmRvd24gZnVuY3Rpb24gd2lsbCBvbmx5IGJlIGNhbGxlZCB3aGVuIGFsbCBlZmZlY3RzIGFyZSBkZXN0cm95ZWQuXG4gKlxuICogSXQncyBiZXN0IHVuZGVyc3Rvb2Qgd2l0aCBhbiBleGFtcGxlLiBIZXJlJ3MgYW4gaW1wbGVtZW50YXRpb24gb2YgW2BNZWRpYVF1ZXJ5YF0oaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3Mvc3ZlbHRlL3N2ZWx0ZS1yZWFjdGl2aXR5I01lZGlhUXVlcnkpOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgeyBjcmVhdGVTdWJzY3JpYmVyIH0gZnJvbSAnc3ZlbHRlL3JlYWN0aXZpdHknO1xuICogaW1wb3J0IHsgb24gfSBmcm9tICdzdmVsdGUvZXZlbnRzJztcbiAqXG4gKiBleHBvcnQgY2xhc3MgTWVkaWFRdWVyeSB7XG4gKiBcdCNxdWVyeTtcbiAqIFx0I3N1YnNjcmliZTtcbiAqXG4gKiBcdGNvbnN0cnVjdG9yKHF1ZXJ5KSB7XG4gKiBcdFx0dGhpcy4jcXVlcnkgPSB3aW5kb3cubWF0Y2hNZWRpYShgKCR7cXVlcnl9KWApO1xuICpcbiAqIFx0XHR0aGlzLiNzdWJzY3JpYmUgPSBjcmVhdGVTdWJzY3JpYmVyKCh1cGRhdGUpID0+IHtcbiAqIFx0XHRcdC8vIHdoZW4gdGhlIGBjaGFuZ2VgIGV2ZW50IG9jY3VycywgcmUtcnVuIGFueSBlZmZlY3RzIHRoYXQgcmVhZCBgdGhpcy5jdXJyZW50YFxuICogXHRcdFx0Y29uc3Qgb2ZmID0gb24odGhpcy4jcXVlcnksICdjaGFuZ2UnLCB1cGRhdGUpO1xuICpcbiAqIFx0XHRcdC8vIHN0b3AgbGlzdGVuaW5nIHdoZW4gYWxsIHRoZSBlZmZlY3RzIGFyZSBkZXN0cm95ZWRcbiAqIFx0XHRcdHJldHVybiAoKSA9PiBvZmYoKTtcbiAqIFx0XHR9KTtcbiAqIFx0fVxuICpcbiAqIFx0Z2V0IGN1cnJlbnQoKSB7XG4gKiBcdFx0Ly8gVGhpcyBtYWtlcyB0aGUgZ2V0dGVyIHJlYWN0aXZlLCBpZiByZWFkIGluIGFuIGVmZmVjdFxuICogXHRcdHRoaXMuI3N1YnNjcmliZSgpO1xuICpcbiAqIFx0XHQvLyBSZXR1cm4gdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHF1ZXJ5LCB3aGV0aGVyIG9yIG5vdCB3ZSdyZSBpbiBhbiBlZmZlY3RcbiAqIFx0XHRyZXR1cm4gdGhpcy4jcXVlcnkubWF0Y2hlcztcbiAqIFx0fVxuICogfVxuICogYGBgXG4gKiBAcGFyYW0geyh1cGRhdGU6ICgpID0+IHZvaWQpID0+ICgoKSA9PiB2b2lkKSB8IHZvaWR9IHN0YXJ0XG4gKiBAc2luY2UgNS43LjBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN1YnNjcmliZXIoc3RhcnQpIHtcblx0bGV0IHN1YnNjcmliZXJzID0gMDtcblx0bGV0IHZlcnNpb24gPSBzb3VyY2UoMCk7XG5cdC8qKiBAdHlwZSB7KCgpID0+IHZvaWQpIHwgdm9pZH0gKi9cblx0bGV0IHN0b3A7XG5cblx0aWYgKERFVikge1xuXHRcdHRhZyh2ZXJzaW9uLCAnY3JlYXRlU3Vic2NyaWJlciB2ZXJzaW9uJyk7XG5cdH1cblxuXHRyZXR1cm4gKCkgPT4ge1xuXHRcdGlmIChlZmZlY3RfdHJhY2tpbmcoKSkge1xuXHRcdFx0Z2V0KHZlcnNpb24pO1xuXG5cdFx0XHRyZW5kZXJfZWZmZWN0KCgpID0+IHtcblx0XHRcdFx0aWYgKHN1YnNjcmliZXJzID09PSAwKSB7XG5cdFx0XHRcdFx0c3RvcCA9IHVudHJhY2soKCkgPT4gc3RhcnQoKCkgPT4gaW5jcmVtZW50KHZlcnNpb24pKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzdWJzY3JpYmVycyArPSAxO1xuXG5cdFx0XHRcdHJldHVybiAoKSA9PiB7XG5cdFx0XHRcdFx0cXVldWVfbWljcm9fdGFzaygoKSA9PiB7XG5cdFx0XHRcdFx0XHQvLyBPbmx5IGNvdW50IGRvd24gYWZ0ZXIgYSBtaWNyb3Rhc2ssIGVsc2Ugd2Ugd291bGQgcmVhY2ggMCBiZWZvcmUgb3VyIG93biByZW5kZXIgZWZmZWN0IHJlcnVucyxcblx0XHRcdFx0XHRcdC8vIGJ1dCByZWFjaCAxIGFnYWluIHdoZW4gdGhlIHRpY2sgY2FsbGJhY2sgb2YgdGhlIHByaW9yIHRlYXJkb3duIHJ1bnMuIFRoYXQgd291bGQgbWVhbiB3ZVxuXHRcdFx0XHRcdFx0Ly8gcmUtc3ViY3JpYmUgdW5uZWNlc3NhcmlseSBhbmQgY3JlYXRlIGEgbWVtb3J5IGxlYWsgYmVjYXVzZSB0aGUgb2xkIHN1YnNjcmlwdGlvbiBpcyBuZXZlciBjbGVhbmVkIHVwLlxuXHRcdFx0XHRcdFx0c3Vic2NyaWJlcnMgLT0gMTtcblxuXHRcdFx0XHRcdFx0aWYgKHN1YnNjcmliZXJzID09PSAwKSB7XG5cdFx0XHRcdFx0XHRcdHN0b3A/LigpO1xuXHRcdFx0XHRcdFx0XHRzdG9wID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdFx0XHQvLyBJbmNyZW1lbnQgdGhlIHZlcnNpb24gdG8gZW5zdXJlIGFueSBkZXBlbmRlbnQgZGVyaXZlZHMgYXJlIG1hcmtlZCBkaXJ0eSB3aGVuIHRoZSBzdWJzY3JpcHRpb24gaXMgcGlja2VkIHVwIGFnYWluIGxhdGVyLlxuXHRcdFx0XHRcdFx0XHQvLyBJZiB3ZSBkaWRuJ3QgZG8gdGhpcyB0aGVuIHRoZSBjb21wYXJpc29uIG9mIHdyaXRlIHZlcnNpb25zIHdvdWxkIGRldGVybWluZSB0aGF0IHRoZSBkZXJpdmVkIGhhcyBhIGxhdGVyIHZlcnNpb24gdGhhblxuXHRcdFx0XHRcdFx0XHQvLyB0aGUgc3Vic2NyaWJlciwgYW5kIGl0IHdvdWxkIG5vdCBiZSByZS1ydW4uXG5cdFx0XHRcdFx0XHRcdGluY3JlbWVudCh2ZXJzaW9uKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFEQSxTQUFnQixpQkFBaUIsT0FBTztDQUN2QyxJQUFJLGNBQWM7Q0FDbEIsSUFBSSxVQUFVLE9BQU8sQ0FBQzs7Q0FFdEIsSUFBSTtDQUdILElBQUksU0FBUywwQkFBMEI7Q0FHeEMsYUFBYTtFQUNaLElBQUksZ0JBQWdCLEdBQUc7R0FDdEIsSUFBSSxPQUFPO0dBRVgsb0JBQW9CO0lBQ25CLElBQUksZ0JBQWdCLEdBQ25CLE9BQU8sY0FBYyxZQUFZLFVBQVUsT0FBTyxDQUFDLENBQUM7SUFHckQsZUFBZTtJQUVmLGFBQWE7S0FDWix1QkFBdUI7TUFJdEIsZUFBZTtNQUVmLElBQUksZ0JBQWdCLEdBQUc7T0FDdEIsT0FBTztPQUNQLE9BQU8sS0FBQTtPQUlQLFVBQVUsT0FBTztNQUNsQjtLQUNELENBQUM7SUFDRjtHQUNELENBQUM7RUFDRjtDQUNEO0FBQ0QiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMF19