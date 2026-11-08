import "/node_modules/.vite/deps/esm-env-D8Yi5ac9.js?v=70f5904f";
import { $n as NAMESPACE_SVG, A as remove_effect_dom, Ar as is_array, Bn as hydrating, Bt as add_form_reset_listener, C as effect_root, Cn as invalid_snippet, Cr as define_property, D as managed, Dn as rune_outside_svelte, Dr as get_descriptors, Dt as capture, En as props_rest_readonly, Er as get_descriptor, F as user_effect, Fn as svelte_element_invalid_this_value, Fr as run, Ft as unset_context, Gn as set_hydrating, Gt as queue_micro_task, H as clear_text_content, Hn as read_hydration_instruction, I as user_pre_effect, In as safe_not_equal, Ir as run_all, J as get_first_child, Jn as FILENAME, K as create_text, Kn as skip_nodes, L as validate_effect, Ln as hydrate_next, Lt as listen, M as resume_effect, Mn as lifecycle_outside_component, Mr as is_promise, N as teardown, Nn as snippet_without_render_tag, Nr as noop, O as move_effect, Or as get_prototype_of, Ot as flatten, P as template_effect, Pn as store_invalid_shape, Pr as object_keys, Qn as NAMESPACE_MATHML, Rn as hydrate_node, Rt as listen_to_event_and_reset_event, S as effect, St as previous_batch, Tn as props_invalid_value, Tt as derived_safe_equal, U as create_comment, Un as reset, Vt as autofocus, W as create_element, Wn as set_hydrate_node, Xn as HYDRATION_ERROR, Xt as dev_stack, Y as get_next_sibling, Yn as HMR, Yt as dev_current_component_function, Zn as NAMESPACE_HTML, _ as branch, _n as each_key_duplicate, _t as current_batch, a as get, at as is, b as destroy_effect, bn as get_abort_signal_outside_reaction, c as set_active_effect, cr as EFFECT_TRANSPARENT, ct as internal_set, d as tick, dr as HMR_ANCHOR, dt as set, en as is_runes, er as UNINITIALIZED, f as untrack, fn as snapshot, ft as source, g as block, gn as component_api_invalid_new, gt as Batch, hn as component_api_changed, hr as LOADING_ATTR_SYMBOL, i as deep_read_state, j as render_effect, jn as invalid_snippet_arguments, jr as is_function, jt as run_after_blockers, k as pause_effect, kn as experimental_async_required, kr as has_own_property, l as set_active_reaction, ln as tag, lr as FORM_RESET_HANDLER, lt as mutable_source, mn as bind_invalid_checkbox_value, mr as LEGACY_PROPS, mt as update, n as active_reaction, nr as CLASS_CACHE, o as is_destroying_effect, on as set_dev_current_component_function, or as EFFECT_OFFSCREEN, ot as proxy, pn as dynamic_void_element_content, pr as IS_XHTML, qn as ATTACHMENT_KEY, qt as component_context, sn as get_error, t as active_effect, tn as mark_as_component, tr as ATTRIBUTES_CACHE, tt as should_defer_append, ur as HEAD_EFFECT, vn as each_key_volatile, vr as STATE_SYMBOL, wn as lifecycle_legacy_only, wt as derived, x as eager_effect, xn as hydratable_missing_but_required, xr as array_from, xt as is_flushing_sync, yr as STYLE_CACHE, yt as flushSync, zt as without_reactive_context } from "/node_modules/.vite/deps/runtime-BOFXI46e.js?v=70f5904f";
import { _ as select_multiple_invalid_value, a as console_log_state, d as hydration_mismatch, f as invalid_raw_snippet_render, g as ownership_invalid_mutation, h as ownership_invalid_binding, i as binding_property_non_reactive, l as hydration_attribute_changed, t as assignment_value_stale, u as hydration_html_changed } from "/node_modules/.vite/deps/warnings-BCxPSjeg.js?v=70f5904f";
import { a as legacy_mode_flag, t as async_mode_flag } from "/node_modules/.vite/deps/flags-qfBdqUK7.js?v=70f5904f";
import { B as sanitize_location, C as assign_nodes, F as hash, I as is_capture_event, L as is_raw_text_element, M as create_fragment_from_html, N as create_trusted_html, P as can_delegate_event, R as is_void, S as append, g as set_should_intro, r as createClassComponent, v as should_intro, z as normalize_attribute } from "/node_modules/.vite/deps/legacy-client-CgNqUZrT.js?v=70f5904f";
import { a as delegated, i as delegate, r as create_event } from "/node_modules/.vite/deps/events-21uQP6Br.js?v=70f5904f";
import { clsx as clsx$1 } from "/node_modules/.vite/deps/svelte_n_clsx.js?v=70f5904f";
import { n as get$1, o as subscribe_to_store } from "/node_modules/.vite/deps/shared-CBkF5T1F.js?v=70f5904f";
// node_modules/svelte/src/attachments/index.js
/** @import { Action, ActionReturn } from '../action/public' */
/** @import { Attachment } from './public' */
/**
* Creates an object key that will be recognised as an attachment when the object is spread onto an element,
* as a programmatic alternative to using `{@attach ...}`. This can be useful for library authors, though
* is generally not needed when building an app.
*
* ```svelte
* <script>
* 	import { createAttachmentKey } from 'svelte/attachments';
*
* 	const props = {
* 		class: 'cool',
* 		onclick: () => alert('clicked'),
* 		[createAttachmentKey()]: (node) => {
* 			node.textContent = 'attached!';
* 		}
* 	};
* <\/script>
*
* <button {...props}>click me</button>
* ```
* @since 5.29
*/
function createAttachmentKey() {
	return Symbol(ATTACHMENT_KEY);
}
/**
* Converts an [action](https://svelte.dev/docs/svelte/use) into an [attachment](https://svelte.dev/docs/svelte/@attach) keeping the same behavior.
* It's useful if you want to start using attachments on components but you have actions provided by a library.
*
* Note that the second argument, if provided, must be a function that _returns_ the argument to the
* action function, not the argument itself.
*
* ```svelte
* <!-- with an action -->
* <div use:foo={bar}>...</div>
*
* <!-- with an attachment -->
* <div {@attach fromAction(foo, () => bar)}>...</div>
* ```
* @template {EventTarget} E
* @template {unknown} T
* @overload
* @param {Action<E, T> | ((element: E, arg: T) => void | ActionReturn<T>)} action The action function
* @param {() => T} fn A function that returns the argument for the action
* @returns {Attachment<E>}
*/
/**
* Converts an [action](https://svelte.dev/docs/svelte/use) into an [attachment](https://svelte.dev/docs/svelte/@attach) keeping the same behavior.
* It's useful if you want to start using attachments on components but you have actions provided by a library.
*
* Note that the second argument, if provided, must be a function that _returns_ the argument to the
* action function, not the argument itself.
*
* ```svelte
* <!-- with an action -->
* <div use:foo={bar}>...</div>
*
* <!-- with an attachment -->
* <div {@attach fromAction(foo, () => bar)}>...</div>
* ```
* @template {EventTarget} E
* @overload
* @param {Action<E, void> | ((element: E) => void | ActionReturn<void>)} action The action function
* @returns {Attachment<E>}
*/
/**
* Converts an [action](https://svelte.dev/docs/svelte/use) into an [attachment](https://svelte.dev/docs/svelte/@attach) keeping the same behavior.
* It's useful if you want to start using attachments on components but you have actions provided by a library.
*
* Note that the second argument, if provided, must be a function that _returns_ the argument to the
* action function, not the argument itself.
*
* ```svelte
* <!-- with an action -->
* <div use:foo={bar}>...</div>
*
* <!-- with an attachment -->
* <div {@attach fromAction(foo, () => bar)}>...</div>
* ```
*
* @template {EventTarget} E
* @template {unknown} T
* @param {Action<E, T> | ((element: E, arg: T) => void | ActionReturn<T>)} action The action function
* @param {() => T} fn A function that returns the argument for the action
* @returns {Attachment<E>}
* @since 5.32
*/
function fromAction(action, fn = noop) {
	return (element) => {
		const { update, destroy } = untrack(() => action(element, fn()) ?? {});
		if (update) {
			var ran = false;
			render_effect(() => {
				const arg = fn();
				if (ran) update(arg);
			});
			ran = true;
		}
		if (destroy) teardown(destroy);
	};
}
// node_modules/svelte/src/internal/client/dev/assign.js
/**
*
* @param {any} a
* @param {any} b
* @param {string} property
* @param {string} location
*/
function compare(a, b, property, location) {
	if (a !== b && typeof b === "object" && STATE_SYMBOL in b) assignment_value_stale(property, sanitize_location(location));
	return a;
}
/**
* @param {any} object
* @param {string} property
* @param {string} operator
* @param {any} rhs
* @param {string} location
*/
function assign(object, property, operator, rhs, location) {
	return compare(operator === "=" ? object[property] = rhs : operator === "&&=" ? object[property] &&= rhs() : operator === "||=" ? object[property] ||= rhs() : operator === "??=" ? object[property] ??= rhs() : null, untrack(() => object[property]), property, location);
}
/**
* @param {any} object
* @param {string} property
* @param {string} operator
* @param {any} rhs
* @param {string} location
*/
async function assign_async(object, property, operator, rhs, location) {
	return compare(operator === "=" ? object[property] = await rhs : operator === "&&=" ? object[property] &&= await rhs() : operator === "||=" ? object[property] ||= await rhs() : operator === "??=" ? object[property] ??= await rhs() : null, untrack(() => object[property]), property, location);
}
// node_modules/svelte/src/internal/client/dev/css.js
/** @type {Map<String, Set<HTMLStyleElement>>} */
var all_styles = /* @__PURE__ */ new Map();
/**
* @param {String} hash
* @param {HTMLStyleElement} style
*/
function register_style(hash, style) {
	var styles = all_styles.get(hash);
	if (!styles) {
		styles = /* @__PURE__ */ new Set();
		all_styles.set(hash, styles);
	}
	styles.add(style);
}
/**
* @param {String} hash
*/
function cleanup_styles(hash) {
	var styles = all_styles.get(hash);
	if (!styles) return;
	for (const style of styles) style.remove();
	all_styles.delete(hash);
}
// node_modules/svelte/src/internal/client/dev/elements.js
/** @import { SourceLocation } from '#client' */
/**
* @param {any} fn
* @param {string} filename
* @param {SourceLocation[]} locations
* @returns {any}
*/
function add_locations(fn, filename, locations) {
	return (...args) => {
		const dom = fn(...args);
		assign_locations(hydrating ? dom : dom.nodeType === 11 ? dom.firstChild : dom, filename, locations);
		return dom;
	};
}
/**
* @param {Element} element
* @param {string} filename
* @param {SourceLocation} location
*/
function assign_location(element, filename, location) {
	element.__svelte_meta = {
		parent: dev_stack,
		loc: {
			file: filename,
			line: location[0],
			column: location[1]
		}
	};
	if (location[2]) assign_locations(element.firstChild, filename, location[2]);
}
/**
* @param {Node | null} node
* @param {string} filename
* @param {SourceLocation[]} locations
*/
function assign_locations(node, filename, locations) {
	var i = 0;
	var depth = 0;
	while (node && i < locations.length) {
		if (hydrating && node.nodeType === 8) {
			var comment = node;
			if (comment.data[0] === "[") depth += 1;
			else if (comment.data[0] === "]") depth -= 1;
		}
		if (depth === 0 && node.nodeType === 1) assign_location(node, filename, locations[i++]);
		node = node.nextSibling;
	}
}
// node_modules/svelte/src/internal/client/dev/hmr.js
/** @import { Effect, TemplateNode } from '#client' */
/**
* @template {(anchor: Comment, props: any) => any} Component
* @param {Component} fn
*/
function hmr(fn) {
	const current = source(fn);
	/**
	* @param {TemplateNode} initial_anchor
	* @param {any} props
	*/
	function wrapper(initial_anchor, props) {
		let component = {};
		let instance = {};
		/** @type {Effect} */
		let effect;
		let ran = false;
		let anchor = initial_anchor;
		block(() => {
			if (component === (component = get(current))) return;
			if (effect) {
				for (var k in instance) delete instance[k];
				destroy_effect(effect);
			}
			effect = branch(() => {
				anchor = anchor[HMR_ANCHOR] ?? anchor;
				if (ran) set_should_intro(false);
				var result = new.target ? new component(anchor, props) : component(anchor, props);
				if (result) Object.defineProperties(instance, Object.getOwnPropertyDescriptors(result));
				if (ran) set_should_intro(true);
			});
			var inner_nodes = effect.nodes;
			if (inner_nodes) {
				var ae = active_effect;
				if (ae.nodes) {
					ae.nodes.start = inner_nodes.start;
					ae.nodes.end = inner_nodes.end;
				} else ae.nodes = {
					start: inner_nodes.start,
					end: inner_nodes.end,
					a: null,
					t: null
				};
			}
		}, EFFECT_TRANSPARENT);
		ran = true;
		if (hydrating) anchor = hydrate_node;
		return instance;
	}
	wrapper[FILENAME] = fn[FILENAME];
	wrapper[HMR] = {
		fn,
		current,
		update: (incoming) => {
			set(wrapper[HMR].current, incoming[HMR].fn);
			incoming[HMR].current = wrapper[HMR].current;
		}
	};
	return wrapper;
}
// node_modules/svelte/src/internal/client/dev/ownership.js
/** @typedef {{ file: string, line: number, column: number }} Location */
/**
* Sets up a validator that
* - traverses the path of a prop to find out if it is allowed to be mutated
* - checks that the binding chain is not interrupted
* @param {Record<string, any>} props
*/
function create_ownership_validator(props) {
	const component = component_context?.function;
	const parent = component_context?.p?.function;
	return {
		/**
		* @param {string} prop
		* @param {any[]} path
		* @param {any} result
		* @param {number} line
		* @param {number} column
		*/
		mutation: (prop, path, result, line, column) => {
			const name = path[0];
			if (is_bound_or_unset(props, name) || !parent) return result;
			/** @type {any} */
			let value = props;
			for (let i = 0; i < path.length - 1; i++) {
				value = value[path[i]];
				if (!value?.[STATE_SYMBOL]) return result;
			}
			const location = sanitize_location(`${component[FILENAME]}:${line}:${column}`);
			ownership_invalid_mutation(name, location, prop, parent[FILENAME]);
			return result;
		},
		/**
		* @param {any} key
		* @param {any} child_component
		* @param {() => any} value
		*/
		binding: (key, child_component, value) => {
			if (!is_bound_or_unset(props, key) && parent && value()?.[STATE_SYMBOL]) ownership_invalid_binding(component[FILENAME], key, child_component[FILENAME], parent[FILENAME]);
		}
	};
}
/**
* @param {Record<string, any>} props
* @param {string} prop_name
*/
function is_bound_or_unset(props, prop_name) {
	const is_entry_props = STATE_SYMBOL in props || LEGACY_PROPS in props;
	return !!get_descriptor(props, prop_name)?.set || is_entry_props && prop_name in props || !(prop_name in props);
}
// node_modules/svelte/src/internal/client/dev/legacy.js
/** @param {Function & { [FILENAME]: string }} target */
function check_target(target) {
	if (target) component_api_invalid_new(target[FILENAME] ?? "a component", target.name);
}
function legacy_api() {
	const component = component_context?.function;
	/** @param {string} method */
	function error(method) {
		component_api_changed(method, component[FILENAME]);
	}
	return {
		$destroy: () => error("$destroy()"),
		$on: () => error("$on(...)"),
		$set: () => error("$set(...)")
	};
}
// node_modules/svelte/src/internal/client/dev/inspect.js
/**
* @param {() => any[]} get_value
* @param {Function} inspector
* @param {boolean} show_stack
*/
function inspect(get_value, inspector, show_stack = false) {
	validate_effect("$inspect");
	let initial = true;
	let error = UNINITIALIZED;
	eager_effect(() => {
		error = UNINITIALIZED;
		try {
			var value = get_value();
		} catch (e) {
			error = e;
			return;
		}
		var snap = snapshot(value, true, true);
		untrack(() => {
			if (show_stack) {
				inspector(...snap);
				if (!initial) {
					const stack = get_error("$inspect(...)");
					if (stack) {
						console.groupCollapsed("stack trace");
						console.log(stack);
						console.groupEnd();
					}
				}
			} else inspector(initial ? "init" : "update", ...snap);
		});
		initial = false;
	});
	render_effect(() => {
		try {
			get_value();
		} catch {}
		if (error !== UNINITIALIZED) {
			console.error(error);
			error = UNINITIALIZED;
		}
	});
}
// node_modules/svelte/src/internal/client/dom/blocks/async.js
/** @import { Blocker, TemplateNode, Value } from '#client' */
/**
* @param {TemplateNode} node
* @param {Blocker[]} blockers
* @param {Array<() => Promise<any>>} expressions
* @param {(anchor: TemplateNode, ...deriveds: Value[]) => void} fn
*/
function async(node, blockers = [], expressions = [], fn) {
	var was_hydrating = hydrating;
	var end = null;
	if (was_hydrating) {
		hydrate_next();
		end = skip_nodes(false);
		assign_nodes(node, end);
	}
	if (expressions.length === 0 && blockers.every((b) => b.settled)) {
		fn(node);
		if (was_hydrating) set_hydrate_node(end);
		return;
	}
	if (was_hydrating) {
		var previous_hydrate_node = hydrate_node;
		set_hydrate_node(end);
	}
	flatten(blockers, [], expressions, (values) => {
		if (was_hydrating) {
			set_hydrating(true);
			set_hydrate_node(previous_hydrate_node);
		}
		try {
			for (const d of values) get(d);
			fn(node, ...values);
		} finally {
			if (was_hydrating) set_hydrating(false);
		}
	});
}
// node_modules/svelte/src/internal/client/dev/validation.js
/**
* @param {Node} anchor
* @param {...(()=>any)[]} args
*/
function validate_snippet_args(anchor, ...args) {
	if (typeof anchor !== "object" || !(anchor instanceof Node)) invalid_snippet_arguments();
	for (let arg of args) if (typeof arg !== "function") invalid_snippet_arguments();
}
// node_modules/svelte/src/internal/client/dom/blocks/branches.js
/** @import { Effect, TemplateNode } from '#client' */
/**
* @typedef {{ effect: Effect, fragment: DocumentFragment }} Branch
*/
/**
* @template Key
*/
var BranchManager = class {
	/** @type {TemplateNode} */
	anchor;
	/** @type {Map<Batch, Key>} */
	#batches = /* @__PURE__ */ new Map();
	/**
	* Map of keys to effects that are currently rendered in the DOM.
	* These effects are visible and actively part of the document tree.
	* Example:
	* ```
	* {#if condition}
	* 	foo
	* {:else}
	* 	bar
	* {/if}
	* ```
	* Can result in the entries `true->Effect` and `false->Effect`
	* @type {Map<Key, Effect>}
	*/
	#onscreen = /* @__PURE__ */ new Map();
	/**
	* Similar to #onscreen with respect to the keys, but contains branches that are not yet
	* in the DOM, because their insertion is deferred.
	* @type {Map<Key, Branch>}
	*/
	#offscreen = /* @__PURE__ */ new Map();
	/**
	* Keys of effects that are currently outroing
	* @type {Set<Key>}
	*/
	#outroing = /* @__PURE__ */ new Set();
	/**
	* Whether to pause (i.e. outro) on change, or destroy immediately.
	* This is necessary for `<svelte:element>`
	*/
	#transition = true;
	/**
	* @param {TemplateNode} anchor
	* @param {boolean} transition
	*/
	constructor(anchor, transition = true) {
		this.anchor = anchor;
		this.#transition = transition;
	}
	/**
	* @param {Batch} batch
	*/
	#commit = (batch) => {
		if (!this.#batches.has(batch)) return;
		var key = this.#batches.get(batch);
		var onscreen = this.#onscreen.get(key);
		if (onscreen) {
			resume_effect(onscreen);
			this.#outroing.delete(key);
		} else {
			var offscreen = this.#offscreen.get(key);
			if (offscreen) {
				resume_effect(offscreen.effect);
				this.#onscreen.set(key, offscreen.effect);
				this.#offscreen.delete(key);
				/** @type {any} */ offscreen.fragment.lastChild[HMR_ANCHOR] = this.anchor;
				/** @type {TemplateNode} */ offscreen.fragment.lastChild.remove();
				this.anchor.before(offscreen.fragment);
				onscreen = offscreen.effect;
			}
		}
		for (const [b, k] of this.#batches) {
			this.#batches.delete(b);
			if (b === batch) break;
			const offscreen = this.#offscreen.get(k);
			if (offscreen) {
				destroy_effect(offscreen.effect);
				this.#offscreen.delete(k);
			}
		}
		for (const [k, effect] of this.#onscreen) {
			if (k === key || this.#outroing.has(k)) continue;
			const on_destroy = () => {
				if (Array.from(this.#batches.values()).includes(k)) {
					var fragment = document.createDocumentFragment();
					move_effect(effect, fragment);
					fragment.append(create_text());
					this.#offscreen.set(k, {
						effect,
						fragment
					});
				} else destroy_effect(effect);
				this.#outroing.delete(k);
				this.#onscreen.delete(k);
			};
			if (this.#transition || !onscreen) {
				this.#outroing.add(k);
				pause_effect(effect, on_destroy, false);
			} else on_destroy();
		}
	};
	/**
	* @param {Batch} batch
	*/
	#discard = (batch) => {
		this.#batches.delete(batch);
		const keys = Array.from(this.#batches.values());
		for (const [k, branch] of this.#offscreen) if (!keys.includes(k)) {
			destroy_effect(branch.effect);
			this.#offscreen.delete(k);
		}
	};
	/**
	*
	* @param {any} key
	* @param {null | ((target: TemplateNode) => void)} fn
	*/
	ensure(key, fn) {
		var batch = current_batch;
		var defer = should_defer_append();
		if (fn && !this.#onscreen.has(key) && !this.#offscreen.has(key)) {
			if (defer) {
				var fragment = document.createDocumentFragment();
				var target = create_text();
				fragment.append(target);
				this.#offscreen.set(key, {
					effect: branch(() => fn(target)),
					fragment
				});
			} else this.#onscreen.set(key, branch(() => fn(this.anchor)));
		}
		this.#batches.set(batch, key);
		if (defer) {
			for (const [k, effect] of this.#onscreen) if (k === key) batch.unskip_effect(effect);
			else batch.skip_effect(effect);
			for (const [k, branch] of this.#offscreen) if (k === key) batch.unskip_effect(branch.effect);
			else batch.skip_effect(branch.effect);
			batch.oncommit(this.#commit);
			batch.ondiscard(this.#discard);
		} else {
			if (hydrating) this.anchor = hydrate_node;
			this.#commit(batch);
		}
	}
};
// node_modules/svelte/src/internal/client/dom/blocks/await.js
/** @import { Source, TemplateNode } from '#client' */
var PENDING = 0;
var THEN = 1;
var CATCH = 2;
/** @typedef {typeof PENDING | typeof THEN | typeof CATCH} AwaitState */
/**
* @template V
* @param {TemplateNode} node
* @param {(() => any)} get_input
* @param {null | ((anchor: Node) => void)} pending_fn
* @param {null | ((anchor: Node, value: Source<V>) => void)} then_fn
* @param {null | ((anchor: Node, error: unknown) => void)} catch_fn
* @returns {void}
*/
function await_block(node, get_input, pending_fn, then_fn, catch_fn) {
	if (hydrating) hydrate_next();
	var runes = is_runes();
	var v = UNINITIALIZED;
	var value = runes ? source(v) : /* @__PURE__ */ mutable_source(v, false, false);
	var error = runes ? source(v) : /* @__PURE__ */ mutable_source(v, false, false);
	value.label = "{#await ...} value";
	error.label = "{#await ...} error";
	var branches = new BranchManager(node);
	block(() => {
		var batch = current_batch;
		var input = get_input();
		var destroyed = false;
		/** Whether or not there was a hydration mismatch. Needs to be a `let` or else it isn't treeshaken out */
		let mismatch = hydrating && is_promise(input) === (node.data === "[!");
		if (mismatch) {
			set_hydrate_node(skip_nodes());
			set_hydrating(false);
		}
		if (is_promise(input)) {
			var restore = capture();
			var resolved = false;
			/**
			* @param {() => void} fn
			*/
			const resolve = (fn) => {
				if (destroyed) return;
				resolved = true;
				restore(false);
				if (current_batch === batch) batch.deactivate();
				Batch.ensure();
				try {
					fn();
				} finally {
					unset_context(false);
					if (!is_flushing_sync) flushSync();
				}
			};
			input.then((v) => {
				resolve(() => {
					internal_set(value, v);
					branches.ensure(THEN, then_fn && ((target) => then_fn(target, value)));
				});
			}, (e) => {
				resolve(() => {
					internal_set(error, e);
					branches.ensure(CATCH, catch_fn && ((target) => catch_fn(target, error)));
					if (!catch_fn) throw error.v;
				});
			});
			if (hydrating) branches.ensure(PENDING, pending_fn);
			else queue_micro_task(() => {
				if (!resolved) resolve(() => {
					branches.ensure(PENDING, pending_fn);
				});
			});
		} else {
			internal_set(value, input);
			branches.ensure(THEN, then_fn && ((target) => then_fn(target, value)));
		}
		if (mismatch) set_hydrating(true);
		return () => {
			destroyed = true;
		};
	});
}
// node_modules/svelte/src/internal/client/dom/blocks/if.js
/** @import { TemplateNode } from '#client' */
/**
* @param {TemplateNode} node
* @param {(branch: (fn: (anchor: Node) => void, key?: number | false) => void) => void} fn
* @param {boolean} [elseif] True if this is an `{:else if ...}` block rather than an `{#if ...}`, as that affects which transitions are considered 'local'
* @returns {void}
*/
function if_block(node, fn, elseif = false) {
	/** @type {TemplateNode | undefined} */
	var marker;
	if (hydrating) {
		marker = hydrate_node;
		hydrate_next();
	}
	var branches = new BranchManager(node);
	var flags = elseif ? EFFECT_TRANSPARENT : 0;
	/**
	* @param {number | false} key
	* @param {null | ((anchor: Node) => void)} fn
	*/
	function update_branch(key, fn) {
		if (hydrating) {
			var data = read_hydration_instruction(marker);
			if (key !== parseInt(data.substring(1))) {
				var anchor = skip_nodes();
				set_hydrate_node(anchor);
				branches.anchor = anchor;
				set_hydrating(false);
				branches.ensure(key, fn);
				set_hydrating(true);
				return;
			}
		}
		branches.ensure(key, fn);
	}
	block(() => {
		var has_branch = false;
		fn((fn, key = 0) => {
			has_branch = true;
			update_branch(key, fn);
		});
		if (!has_branch) update_branch(-1, null);
	}, flags);
}
// node_modules/svelte/src/internal/client/dom/blocks/key.js
/** @import { TemplateNode } from '#client' */
var NAN = Symbol("NaN");
/**
* @template V
* @param {TemplateNode} node
* @param {() => V} get_key
* @param {(anchor: Node) => TemplateNode | void} render_fn
* @returns {void}
*/
function key(node, get_key, render_fn) {
	if (hydrating) hydrate_next();
	var branches = new BranchManager(node);
	var legacy = !is_runes();
	block(() => {
		var key = get_key();
		if (key !== key) key = NAN;
		if (legacy && key !== null && typeof key === "object") key = {};
		branches.ensure(key, render_fn);
	});
}
// node_modules/svelte/src/internal/client/dom/blocks/css-props.js
/**
* @param {HTMLDivElement | SVGGElement} element
* @param {() => Record<string, string>} get_styles
* @returns {void}
*/
function css_props(element, get_styles) {
	if (hydrating) set_hydrate_node(/* @__PURE__ */ get_first_child(element));
	render_effect(() => {
		var styles = get_styles();
		for (var key in styles) {
			var value = styles[key];
			if (value == null || value === "") element.style.removeProperty(key);
			else element.style.setProperty(key, value);
		}
	});
}
// node_modules/svelte/src/internal/client/dom/blocks/each.js
/** @import { EachItem, EachOutroGroup, EachState, Effect, EffectNodes, MaybeSource, TemplateNode, TransitionManager } from '#client' */
/** @import { Batch } from '../../reactivity/batch.js'; */
/**
* @param {any} _
* @param {number} i
*/
function index(_, i) {
	return i;
}
/**
* Pause multiple effects simultaneously, and coordinate their
* subsequent destruction. Used in each blocks
* @param {EachState} state
* @param {Effect[]} to_destroy
* @param {null | Node} controlled_anchor
*/
function pause_effects(state, to_destroy, controlled_anchor) {
	/** @type {TransitionManager[]} */
	var transitions = [];
	var length = to_destroy.length;
	/** @type {EachOutroGroup} */
	var group;
	var remaining = to_destroy.length;
	for (var i = 0; i < length; i++) {
		let effect = to_destroy[i];
		pause_effect(effect, () => {
			if (group) {
				group.pending.delete(effect);
				group.done.add(effect);
				if (group.pending.size === 0) {
					var groups = state.outrogroups;
					destroy_effects(state, array_from(group.done));
					groups.delete(group);
					if (groups.size === 0) state.outrogroups = null;
				}
			} else remaining -= 1;
		}, false);
	}
	if (remaining === 0) {
		var fast_path = transitions.length === 0 && controlled_anchor !== null && state.pending.size === 0;
		if (fast_path) {
			var anchor = controlled_anchor;
			var parent_node = anchor.parentNode;
			clear_text_content(parent_node);
			parent_node.append(anchor);
			state.items.clear();
		}
		destroy_effects(state, to_destroy, !fast_path);
	} else {
		group = {
			pending: new Set(to_destroy),
			done: /* @__PURE__ */ new Set()
		};
		(state.outrogroups ??= /* @__PURE__ */ new Set()).add(group);
	}
}
/**
* @param {EachState} state
* @param {Effect[]} to_destroy
* @param {boolean} remove_dom
*/
function destroy_effects(state, to_destroy, remove_dom = true) {
	/** @type {Set<Effect> | undefined} */
	var preserved_effects;
	if (state.pending.size > 0) {
		preserved_effects = /* @__PURE__ */ new Set();
		for (const keys of state.pending.values()) for (const key of keys) preserved_effects.add(
			/** @type {EachItem} */
			state.items.get(key).e
		);
	}
	for (var i = 0; i < to_destroy.length; i++) {
		var e = to_destroy[i];
		if (preserved_effects?.has(e)) {
			e.f |= EFFECT_OFFSCREEN;
			const fragment = document.createDocumentFragment();
			move_effect(e, fragment);
		} else destroy_effect(to_destroy[i], remove_dom);
	}
}
/** @type {TemplateNode} */
var offscreen_anchor;
/**
* @template V
* @param {Element | Comment} node The next sibling node, or the parent node if this is a 'controlled' block
* @param {number} flags
* @param {() => V[]} get_collection
* @param {(value: V, index: number) => any} get_key
* @param {(anchor: Node, item: MaybeSource<V>, index: MaybeSource<number>) => void} render_fn
* @param {null | ((anchor: Node) => void)} fallback_fn
* @returns {void}
*/
function each(node, flags, get_collection, get_key, render_fn, fallback_fn = null) {
	var anchor = node;
	/** @type {Map<any, EachItem>} */
	var items = /* @__PURE__ */ new Map();
	if ((flags & 4) !== 0) {
		var parent_node = node;
		anchor = hydrating ? set_hydrate_node(/* @__PURE__ */ get_first_child(parent_node)) : parent_node.appendChild(create_text());
	}
	if (hydrating) hydrate_next();
	/** @type {Effect | null} */
	var fallback = null;
	var each_array = /* @__PURE__ */ derived_safe_equal(() => {
		var collection = get_collection();
		return is_array(collection) ? collection : collection == null ? [] : array_from(collection);
	});
	tag(each_array, "{#each ...}");
	/** @type {Map<Batch, Set<any>>} */
	var pending = /* @__PURE__ */ new Map();
	var first_run = true;
	/**
	* @param {Batch} batch
	*/
	function commit(batch) {
		if ((state.effect.f & 16384) !== 0) return;
		state.pending.delete(batch);
		var array = get(each_array);
		state.fallback = fallback;
		reconcile(state, array, anchor, flags, get_key);
		if (fallback !== null) {
			if (array.length === 0) {
				if ((fallback.f & 33554432) === 0) resume_effect(fallback);
				else {
					fallback.f ^= EFFECT_OFFSCREEN;
					move(fallback, null, anchor);
				}
			} else pause_effect(fallback, () => {
				fallback = null;
			});
		}
	}
	/**
	* @param {Batch} batch
	*/
	function discard(batch) {
		state.pending.delete(batch);
	}
	/** @type {EachState} */
	var state = {
		effect: block(() => {
			var array = get(each_array);
			var length = array.length;
			/** `true` if there was a hydration mismatch. Needs to be a `let` or else it isn't treeshaken out */
			let mismatch = false;
			if (hydrating) {
				if (read_hydration_instruction(anchor) === "[!" !== (length === 0)) {
					anchor = skip_nodes();
					set_hydrate_node(anchor);
					set_hydrating(false);
					mismatch = true;
				}
			}
			var keys = /* @__PURE__ */ new Set();
			var batch = current_batch;
			var defer = should_defer_append();
			for (var index = 0; index < length; index += 1) {
				if (hydrating && hydrate_node.nodeType === 8 && hydrate_node.data === "]") {
					anchor = hydrate_node;
					mismatch = true;
					set_hydrating(false);
				}
				var value = array[index];
				var key = get_key(value, index);
				var key_again = get_key(value, index);
				if (key !== key_again) each_key_volatile(String(index), String(key), String(key_again));
				var item = first_run ? null : items.get(key);
				if (item) {
					if (item.v) internal_set(item.v, value);
					if (item.i) internal_set(item.i, index);
					if (defer) batch.unskip_effect(item.e);
				} else {
					item = create_item(items, first_run ? anchor : offscreen_anchor ??= create_text(), value, key, index, render_fn, flags, get_collection);
					if (!first_run) item.e.f |= EFFECT_OFFSCREEN;
					items.set(key, item);
				}
				keys.add(key);
			}
			if (length === 0 && fallback_fn && !fallback) {
				if (first_run) fallback = branch(() => fallback_fn(anchor));
				else {
					fallback = branch(() => fallback_fn(offscreen_anchor ??= create_text()));
					fallback.f |= EFFECT_OFFSCREEN;
				}
			}
			if (length > keys.size) validate_each_keys(array, get_key);
			if (hydrating && length > 0) set_hydrate_node(skip_nodes());
			if (!first_run) {
				pending.set(batch, keys);
				if (defer) {
					for (const [key, item] of items) if (!keys.has(key)) batch.skip_effect(item.e);
					batch.oncommit(commit);
					batch.ondiscard(discard);
				} else commit(batch);
			}
			if (mismatch) set_hydrating(true);
			get(each_array);
		}),
		flags,
		items,
		pending,
		outrogroups: null,
		fallback
	};
	first_run = false;
	if (hydrating) anchor = hydrate_node;
}
/**
* Skip past any non-branch effects (which could be created with `createSubscriber`, for example) to find the next branch effect
* @param {Effect | null} effect
* @returns {Effect | null}
*/
function skip_to_branch(effect) {
	while (effect !== null && (effect.f & 32) === 0) effect = effect.next;
	return effect;
}
/**
* Add, remove, or reorder items output by an each block as its input changes
* @template V
* @param {EachState} state
* @param {Array<V>} array
* @param {Element | Comment | Text} anchor
* @param {number} flags
* @param {(value: V, index: number) => any} get_key
* @returns {void}
*/
function reconcile(state, array, anchor, flags, get_key) {
	var is_animated = (flags & 8) !== 0;
	var length = array.length;
	var items = state.items;
	var current = skip_to_branch(state.effect.first);
	/** @type {undefined | Set<Effect>} */
	var seen;
	/** @type {Effect | null} */
	var prev = null;
	/** @type {undefined | Set<Effect>} */
	var to_animate;
	/** @type {Effect[]} */
	var matched = [];
	/** @type {Effect[]} */
	var stashed = [];
	/** @type {V} */
	var value;
	/** @type {any} */
	var key;
	/** @type {Effect | undefined} */
	var effect;
	/** @type {number} */
	var i;
	if (is_animated) for (i = 0; i < length; i += 1) {
		value = array[i];
		key = get_key(value, i);
		effect = items.get(key).e;
		if ((effect.f & 33554432) === 0) {
			effect.nodes?.a?.measure();
			(to_animate ??= /* @__PURE__ */ new Set()).add(effect);
		}
	}
	for (i = 0; i < length; i += 1) {
		value = array[i];
		key = get_key(value, i);
		effect = items.get(key).e;
		if (state.outrogroups !== null) for (const group of state.outrogroups) {
			group.pending.delete(effect);
			group.done.delete(effect);
		}
		if ((effect.f & 8192) !== 0) {
			resume_effect(effect);
			if (is_animated) {
				effect.nodes?.a?.unfix();
				(to_animate ??= /* @__PURE__ */ new Set()).delete(effect);
			}
		}
		if ((effect.f & 33554432) !== 0) {
			effect.f ^= EFFECT_OFFSCREEN;
			if (effect === current) move(effect, null, anchor);
			else {
				var next = prev ? prev.next : current;
				if (effect === state.effect.last) state.effect.last = effect.prev;
				if (effect.prev) effect.prev.next = effect.next;
				if (effect.next) effect.next.prev = effect.prev;
				link(state, prev, effect);
				link(state, effect, next);
				move(effect, next, anchor);
				prev = effect;
				matched = [];
				stashed = [];
				current = skip_to_branch(prev.next);
				continue;
			}
		}
		if (effect !== current) {
			if (seen !== void 0 && seen.has(effect)) {
				if (matched.length < stashed.length) {
					var start = stashed[0];
					var j;
					prev = start.prev;
					var a = matched[0];
					var b = matched[matched.length - 1];
					for (j = 0; j < matched.length; j += 1) move(matched[j], start, anchor);
					for (j = 0; j < stashed.length; j += 1) seen.delete(stashed[j]);
					link(state, a.prev, b.next);
					link(state, prev, a);
					link(state, b, start);
					current = start;
					prev = b;
					i -= 1;
					matched = [];
					stashed = [];
				} else {
					seen.delete(effect);
					move(effect, current, anchor);
					link(state, effect.prev, effect.next);
					link(state, effect, prev === null ? state.effect.first : prev.next);
					link(state, prev, effect);
					prev = effect;
				}
				continue;
			}
			matched = [];
			stashed = [];
			while (current !== null && current !== effect) {
				(seen ??= /* @__PURE__ */ new Set()).add(current);
				stashed.push(current);
				current = skip_to_branch(current.next);
			}
			if (current === null) continue;
		}
		if ((effect.f & 33554432) === 0) matched.push(effect);
		prev = effect;
		current = skip_to_branch(effect.next);
	}
	if (state.outrogroups !== null) {
		for (const group of state.outrogroups) if (group.pending.size === 0) {
			destroy_effects(state, array_from(group.done));
			state.outrogroups?.delete(group);
		}
		if (state.outrogroups.size === 0) state.outrogroups = null;
	}
	if (current !== null || seen !== void 0) {
		/** @type {Effect[]} */
		var to_destroy = [];
		if (seen !== void 0) {
			for (effect of seen) if ((effect.f & 8192) === 0) to_destroy.push(effect);
		}
		while (current !== null) {
			if ((current.f & 8192) === 0 && current !== state.fallback) to_destroy.push(current);
			current = skip_to_branch(current.next);
		}
		var destroy_length = to_destroy.length;
		if (destroy_length > 0) {
			var controlled_anchor = (flags & 4) !== 0 && length === 0 ? anchor : null;
			if (is_animated) {
				for (i = 0; i < destroy_length; i += 1) to_destroy[i].nodes?.a?.measure();
				for (i = 0; i < destroy_length; i += 1) to_destroy[i].nodes?.a?.fix();
			}
			pause_effects(state, to_destroy, controlled_anchor);
		}
	}
	if (is_animated) queue_micro_task(() => {
		if (to_animate === void 0) return;
		for (effect of to_animate) effect.nodes?.a?.apply();
	});
}
/**
* @template V
* @param {Map<any, EachItem>} items
* @param {Node} anchor
* @param {V} value
* @param {unknown} key
* @param {number} index
* @param {(anchor: Node, item: MaybeSource<V>, index: MaybeSource<number>, collection: () => V[]) => void} render_fn
* @param {number} flags
* @param {() => V[]} get_collection
* @returns {EachItem}
*/
function create_item(items, anchor, value, key, index, render_fn, flags, get_collection) {
	var v = (flags & 1) !== 0 ? (flags & 16) === 0 ? /* @__PURE__ */ mutable_source(value, false, false) : source(value) : null;
	var i = (flags & 2) !== 0 ? source(index) : null;
	if (v) v.trace = () => {
		get_collection()[i?.v ?? index];
	};
	return {
		v,
		i,
		e: branch(() => {
			render_fn(anchor, v ?? value, i ?? index, get_collection);
			return () => {
				items.delete(key);
			};
		})
	};
}
/**
* @param {Effect} effect
* @param {Effect | null} next
* @param {Text | Element | Comment} anchor
*/
function move(effect, next, anchor) {
	if (!effect.nodes) return;
	var node = effect.nodes.start;
	var end = effect.nodes.end;
	var dest = next && (next.f & 33554432) === 0 ? next.nodes.start : anchor;
	while (node !== null) {
		var next_node = /* @__PURE__ */ get_next_sibling(node);
		dest.before(node);
		if (node === end) return;
		node = next_node;
	}
}
/**
* @param {EachState} state
* @param {Effect | null} prev
* @param {Effect | null} next
*/
function link(state, prev, next) {
	if (prev === null) state.effect.first = next;
	else prev.next = next;
	if (next === null) state.effect.last = prev;
	else next.prev = prev;
}
/**
* @param {Array<any>} array
* @param {(item: any, index: number) => string} key_fn
* @returns {void}
*/
function validate_each_keys(array, key_fn) {
	const keys = /* @__PURE__ */ new Map();
	const length = array.length;
	for (let i = 0; i < length; i++) {
		const key = key_fn(array[i], i);
		if (keys.has(key)) {
			const a = String(keys.get(key));
			const b = String(i);
			/** @type {string | null} */
			let k = String(key);
			if (k.startsWith("[object ")) k = null;
			each_key_duplicate(a, b, k);
		}
		keys.set(key, i);
	}
}
// node_modules/svelte/src/internal/client/dom/blocks/html.js
/** @import { Effect, TemplateNode } from '#client' */
/** @import {} from 'trusted-types' */
/**
* @param {Element} element
* @param {string | null} server_hash
* @param {string | TrustedHTML} value
*/
function check_hash(element, server_hash, value) {
	if (!server_hash || server_hash === hash(String(value ?? ""))) return;
	let location;
	const loc = element.__svelte_meta?.loc;
	if (loc) location = `near ${loc.file}:${loc.line}:${loc.column}`;
	else if (dev_current_component_function?.[FILENAME]) location = `in ${dev_current_component_function[FILENAME]}`;
	hydration_html_changed(sanitize_location(location));
}
/**
* @param {Element | Text | Comment} node
* @param {() => string | TrustedHTML} get_value
* @param {boolean} [is_controlled]
* @param {boolean} [svg]
* @param {boolean} [mathml]
* @param {boolean} [skip_warning]
* @returns {void}
*/
function html(node, get_value, is_controlled = false, svg = false, mathml = false, skip_warning = false) {
	var anchor = node;
	/** @type {string | TrustedHTML} */
	var value = "";
	if (is_controlled) {
		var parent_node = node;
		if (hydrating) anchor = set_hydrate_node(/* @__PURE__ */ get_first_child(parent_node));
	}
	template_effect(() => {
		var effect = active_effect;
		if (value === (value = get_value() ?? "")) {
			if (hydrating) hydrate_next();
			return;
		}
		if (is_controlled && !hydrating) {
			effect.nodes = null;
			parent_node.innerHTML = value;
			if (value !== "") assign_nodes(/* @__PURE__ */ get_first_child(parent_node), parent_node.lastChild);
			return;
		}
		if (effect.nodes !== null) {
			remove_effect_dom(effect.nodes.start, effect.nodes.end);
			effect.nodes = null;
		}
		if (value === "") return;
		if (hydrating) {
			var hash = hydrate_node.data;
			/** @type {TemplateNode | null} */
			var next = hydrate_next();
			var last = next;
			while (next !== null && (next.nodeType !== 8 || next.data !== "")) {
				last = next;
				next = /* @__PURE__ */ get_next_sibling(next);
			}
			if (next === null) {
				hydration_mismatch();
				throw HYDRATION_ERROR;
			}
			if (!skip_warning) check_hash(next.parentNode, hash, value);
			assign_nodes(hydrate_node, last);
			anchor = set_hydrate_node(next);
			return;
		}
		var wrapper = create_element(svg ? "svg" : mathml ? "math" : "template", svg ? NAMESPACE_SVG : mathml ? NAMESPACE_MATHML : void 0);
		wrapper.innerHTML = value;
		/** @type {DocumentFragment | Element} */
		var node = svg || mathml ? wrapper : /** @type {HTMLTemplateElement} */ wrapper.content;
		assign_nodes(/* @__PURE__ */ get_first_child(node), node.lastChild);
		if (svg || mathml) while (/* @__PURE__ */ get_first_child(node)) anchor.before(/* @__PURE__ */ get_first_child(node));
		else anchor.before(node);
	});
}
// node_modules/svelte/src/internal/client/dom/blocks/slot.js
/**
* @param {Comment} anchor
* @param {Record<string, any>} $$props
* @param {string} name
* @param {Record<string, unknown>} slot_props
* @param {null | ((anchor: Comment) => void)} fallback_fn
*/
function slot(anchor, $$props, name, slot_props, fallback_fn) {
	if (hydrating) hydrate_next();
	if ($$props.$$host?.$$shadowRoot) {
		const element = create_element("slot");
		if (name !== "default") element.name = name;
		append(anchor, element);
		if (fallback_fn !== null) {
			const fallback_anchor = create_text();
			element.append(fallback_anchor);
			fallback_fn(fallback_anchor);
		}
		return;
	}
	var slot_fn = $$props.$$slots?.[name];
	var is_interop = false;
	if (slot_fn === true) {
		slot_fn = $$props[name === "default" ? "children" : name];
		is_interop = true;
	}
	if (slot_fn === void 0) {
		if (fallback_fn !== null) fallback_fn(anchor);
	} else slot_fn(anchor, is_interop ? () => slot_props : slot_props);
}
/**
* @param {Record<string, any>} props
* @returns {Record<string, boolean>}
*/
function sanitize_slots(props) {
	/** @type {Record<string, boolean>} */
	const sanitized = {};
	if (props.children) sanitized.default = true;
	for (const key in props.$$slots) sanitized[key] = true;
	return sanitized;
}
// node_modules/svelte/src/internal/shared/validate.js
/**
* @param {() => string} tag_fn
* @returns {void}
*/
function validate_void_dynamic_element(tag_fn) {
	const tag = tag_fn();
	if (tag && is_void(tag)) dynamic_void_element_content(tag);
}
/** @param {() => unknown} tag_fn */
function validate_dynamic_element_tag(tag_fn) {
	const tag = tag_fn();
	if (tag && !(typeof tag === "string")) svelte_element_invalid_this_value();
}
/**
* @param {any} store
* @param {string} name
*/
function validate_store(store, name) {
	if (store != null && typeof store.subscribe !== "function") store_invalid_shape(name);
}
/**
* @template {(...args: any[]) => unknown} T
* @param {T} fn
*/
function prevent_snippet_stringification(fn) {
	fn.toString = () => {
		snippet_without_render_tag();
		return "";
	};
	return fn;
}
// node_modules/svelte/src/internal/client/dom/blocks/snippet.js
/** @import { Snippet } from 'svelte' */
/** @import { TemplateNode } from '#client' */
/** @import { Getters } from '#shared' */
/**
* @template {(node: TemplateNode, ...args: any[]) => void} SnippetFn
* @param {TemplateNode} node
* @param {() => SnippetFn | null | undefined} get_snippet
* @param {(() => any)[]} args
* @returns {void}
*/
function snippet(node, get_snippet, ...args) {
	var branches = new BranchManager(node);
	block(() => {
		const snippet = get_snippet() ?? null;
		if (snippet == null) invalid_snippet();
		branches.ensure(snippet, snippet && ((anchor) => snippet(anchor, ...args)));
	}, EFFECT_TRANSPARENT);
}
/**
* In development, wrap the snippet function so that it passes validation, and so that the
* correct component context is set for ownership checks
* @param {any} component
* @param {(node: TemplateNode, ...args: any[]) => void} fn
*/
function wrap_snippet(component, fn) {
	const snippet = (node, ...args) => {
		var previous_component_function = dev_current_component_function;
		set_dev_current_component_function(component);
		try {
			return fn(node, ...args);
		} finally {
			set_dev_current_component_function(previous_component_function);
		}
	};
	prevent_snippet_stringification(snippet);
	return snippet;
}
/**
* Create a snippet programmatically
* @template {unknown[]} Params
* @param {(...params: Getters<Params>) => {
*   render: () => string
*   setup?: (element: Element) => void | (() => void)
* }} fn
* @returns {Snippet<Params>}
*/
function createRawSnippet(fn) {
	return (anchor, ...params) => {
		var snippet = fn(...params);
		/** @type {Element} */
		var element;
		if (hydrating) {
			element = hydrate_node;
			hydrate_next();
		} else {
			var html = snippet.render().trim();
			var fragment = create_fragment_from_html(html);
			element = /* @__PURE__ */ get_first_child(fragment);
			if (/* @__PURE__ */ get_next_sibling(element) !== null || element.nodeType !== 1) invalid_raw_snippet_render();
			anchor.before(element);
		}
		const result = snippet.setup?.(element);
		assign_nodes(element, element);
		if (typeof result === "function") teardown(result);
	};
}
// node_modules/svelte/src/internal/client/dom/blocks/svelte-component.js
/** @import { TemplateNode, Dom } from '#client' */
/**
* @template P
* @template {(props: P) => void} C
* @param {TemplateNode} node
* @param {() => C} get_component
* @param {(anchor: TemplateNode, component: C) => Dom | void} render_fn
* @returns {void}
*/
function component(node, get_component, render_fn) {
	/** @type {TemplateNode | undefined} */
	var hydration_start_node;
	if (hydrating) {
		hydration_start_node = hydrate_node;
		hydrate_next();
	}
	var branches = new BranchManager(node);
	block(() => {
		var component = get_component() ?? null;
		if (hydrating) {
			if (read_hydration_instruction(hydration_start_node) === "[" !== (component !== null)) {
				var anchor = skip_nodes();
				set_hydrate_node(anchor);
				branches.anchor = anchor;
				set_hydrating(false);
				branches.ensure(component, component && ((target) => render_fn(target, component)));
				set_hydrating(true);
				return;
			}
		}
		branches.ensure(component, component && ((target) => render_fn(target, component)));
	}, EFFECT_TRANSPARENT);
}
// node_modules/svelte/src/internal/client/timing.js
/** @import { Raf } from '#client' */
var now = () => performance.now();
/** @type {Raf} */
var raf = {
	tick: /** @param {any} _ */ (_) => requestAnimationFrame(_),
	now: () => now(),
	tasks: /* @__PURE__ */ new Set()
};
// node_modules/svelte/src/internal/client/loop.js
/** @import { TaskCallback, Task, TaskEntry } from '#client' */
/**
* @returns {void}
*/
function run_tasks() {
	const now = raf.now();
	raf.tasks.forEach((task) => {
		if (!task.c(now)) {
			raf.tasks.delete(task);
			task.f();
		}
	});
	if (raf.tasks.size !== 0) raf.tick(run_tasks);
}
/**
* Creates a new task that runs on each raf frame
* until it returns a falsy value or is aborted
* @param {TaskCallback} callback
* @returns {Task}
*/
function loop(callback) {
	/** @type {TaskEntry} */
	let task;
	if (raf.tasks.size === 0) raf.tick(run_tasks);
	return {
		promise: new Promise((fulfill) => {
			raf.tasks.add(task = {
				c: callback,
				f: fulfill
			});
		}),
		abort() {
			raf.tasks.delete(task);
		}
	};
}
// node_modules/svelte/src/internal/client/dom/elements/transitions.js
/** @import { AnimateFn, Animation, AnimationConfig, EachItem, Effect, EffectNodes, TransitionFn, TransitionManager } from '#client' */
/**
* @param {Element} element
* @param {'introstart' | 'introend' | 'outrostart' | 'outroend'} type
* @returns {void}
*/
function dispatch_event(element, type) {
	without_reactive_context(() => {
		element.dispatchEvent(new CustomEvent(type));
	});
}
/**
* Converts a property to the camel-case format expected by Element.animate(), KeyframeEffect(), and KeyframeEffect.setKeyframes().
* @param {string} style
* @returns {string}
*/
function css_property_to_camelcase(style) {
	if (style === "float") return "cssFloat";
	if (style === "offset") return "cssOffset";
	if (style.startsWith("--")) return style;
	const parts = style.split("-");
	if (parts.length === 1) return parts[0];
	return parts[0] + parts.slice(1).map(
		/** @param {any} word */
		(word) => word[0].toUpperCase() + word.slice(1)
	).join("");
}
/**
* @param {string} css
* @returns {Keyframe}
*/
function css_to_keyframe(css) {
	/** @type {Keyframe} */
	const keyframe = {};
	const parts = css.split(";");
	for (const part of parts) {
		const [property, value] = part.split(":");
		if (!property || value === void 0) break;
		const formatted_property = css_property_to_camelcase(property.trim());
		keyframe[formatted_property] = value.trim();
	}
	return keyframe;
}
/** @param {number} t */
var linear = (t) => t;
/** @type {Effect | null} */
var animation_effect_override = null;
/** @param {Effect | null} v */
function set_animation_effect_override(v) {
	animation_effect_override = v;
}
/**
* Called inside keyed `{#each ...}` blocks (as `$.animation(...)`). This creates an animation manager
* and attaches it to the block, so that moves can be animated following reconciliation.
* @template P
* @param {Element} element
* @param {() => AnimateFn<P | undefined>} get_fn
* @param {(() => P) | null} get_params
*/
function animation(element, get_fn, get_params) {
	var nodes = (animation_effect_override ?? active_effect).nodes;
	/** @type {DOMRect} */
	var from;
	/** @type {DOMRect} */
	var to;
	/** @type {Animation | undefined} */
	var animation;
	/** @type {null | { position: string, width: string, height: string, transform: string }} */
	var original_styles = null;
	nodes.a ??= {
		element,
		measure() {
			from = this.element.getBoundingClientRect();
		},
		apply() {
			animation?.abort();
			to = this.element.getBoundingClientRect();
			if (from.left !== to.left || from.right !== to.right || from.top !== to.top || from.bottom !== to.bottom) {
				const options = get_fn()(this.element, {
					from,
					to
				}, get_params?.());
				animation = animate(this.element, options, void 0, 1, () => {}, () => {
					animation?.abort();
					animation = void 0;
				});
			}
		},
		fix() {
			if (element.getAnimations().length) return;
			var { position, width, height } = getComputedStyle(element);
			if (position !== "absolute" && position !== "fixed") {
				var style = element.style;
				original_styles = {
					position: style.position,
					width: style.width,
					height: style.height,
					transform: style.transform
				};
				style.position = "absolute";
				style.width = width;
				style.height = height;
				var to = element.getBoundingClientRect();
				if (from.left !== to.left || from.top !== to.top) {
					var transform = `translate(${from.left - to.left}px, ${from.top - to.top}px)`;
					style.transform = style.transform ? `${style.transform} ${transform}` : transform;
				}
			}
		},
		unfix() {
			if (original_styles) {
				var style = element.style;
				style.position = original_styles.position;
				style.width = original_styles.width;
				style.height = original_styles.height;
				style.transform = original_styles.transform;
			}
		}
	};
	nodes.a.element = element;
}
/**
* Called inside block effects as `$.transition(...)`. This creates a transition manager and
* attaches it to the current effect — later, inside `pause_effect` and `resume_effect`, we
* use this to create `intro` and `outro` transitions.
* @template P
* @param {number} flags
* @param {HTMLElement} element
* @param {() => TransitionFn<P | undefined>} get_fn
* @param {(() => P) | null} get_params
* @returns {void}
*/
function transition(flags, element, get_fn, get_params) {
	var is_intro = (flags & 1) !== 0;
	var is_outro = (flags & 2) !== 0;
	var is_both = is_intro && is_outro;
	var is_global = (flags & 4) !== 0;
	/** @type {'in' | 'out' | 'both'} */
	var direction = is_both ? "both" : is_intro ? "in" : "out";
	/** @type {AnimationConfig | ((opts: { direction: 'in' | 'out' }) => AnimationConfig) | undefined} */
	var current_options;
	var inert = element.inert;
	/**
	* The default overflow style, stashed so we can revert changes during the transition
	* that are necessary to work around a Safari <18 bug
	* TODO 6.0 remove this, if older versions of Safari have died out enough
	*/
	var overflow = element.style.overflow;
	/** @type {Animation | undefined} */
	var intro;
	/** @type {Animation | undefined} */
	var outro;
	function get_options() {
		return without_reactive_context(() => {
			return current_options ??= get_fn()(element, get_params?.() ?? {}, { direction });
		});
	}
	/** @type {TransitionManager} */
	var transition = {
		is_global,
		in() {
			element.inert = inert;
			if (!is_intro) {
				outro?.abort();
				outro?.reset?.();
				return;
			}
			if (!is_outro) intro?.abort();
			intro = animate(element, get_options(), outro, 1, () => {
				dispatch_event(element, "introstart");
			}, () => {
				dispatch_event(element, "introend");
				intro?.abort();
				intro = current_options = void 0;
				element.style.overflow = overflow;
			});
		},
		out(fn) {
			if (!is_outro) {
				fn?.();
				current_options = void 0;
				return;
			}
			element.inert = true;
			outro = animate(element, get_options(), intro, 0, () => {
				dispatch_event(element, "outrostart");
			}, () => {
				dispatch_event(element, "outroend");
				fn?.();
			});
		},
		stop: () => {
			intro?.abort();
			outro?.abort();
		}
	};
	var e = active_effect;
	(e.nodes.t ??= []).push(transition);
	if (is_intro && should_intro) {
		var run = is_global;
		if (!run) {
			var block = e.parent;
			while (block && (block.f & 65536) !== 0) while (block = block.parent) if ((block.f & 16) !== 0) break;
			run = !block || (block.f & 32768) !== 0;
		}
		if (run) effect(() => {
			untrack(() => transition.in());
		});
	}
}
/**
* Animates an element, according to the provided configuration
* @param {Element} element
* @param {AnimationConfig | ((opts: { direction: 'in' | 'out' }) => AnimationConfig)} options
* @param {Animation | undefined} counterpart The corresponding intro/outro to this outro/intro
* @param {number} t2 The target `t` value — `1` for intro, `0` for outro
* @param {(() => void)} on_begin Called just before beginning the animation
* @param {(() => void)} on_finish Called after successfully completing the animation
* @returns {Animation}
*/
function animate(element, options, counterpart, t2, on_begin, on_finish) {
	var is_intro = t2 === 1;
	var aborted = false;
	if (is_function(options)) {
		/** @type {Animation} */
		var a;
		queue_micro_task(() => {
			if (aborted) return;
			a = animate(element, options({ direction: is_intro ? "in" : "out" }), counterpart, t2, on_begin, on_finish);
		});
		return {
			abort: () => {
				aborted = true;
				a?.abort();
			},
			deactivate: () => a?.deactivate(),
			reset: () => a?.reset(),
			t: () => a?.t() ?? 1 - t2
		};
	}
	counterpart?.deactivate();
	if (!options?.duration && !options?.delay) {
		on_begin();
		on_finish();
		return {
			abort: noop,
			deactivate: noop,
			reset: noop,
			t: () => t2
		};
	}
	const { delay = 0, css, tick, easing = linear } = options;
	/** @type {globalThis.Animation} */
	var animation;
	var get_t = () => 1 - t2;
	queue_micro_task(() => {
		if (aborted) return;
		var keyframes = [];
		if (is_intro && counterpart === void 0) {
			if (tick) tick(0, 1);
			if (css) {
				var styles = css_to_keyframe(css(0, 1));
				keyframes.push(styles, styles);
			}
		}
		animation = element.animate(keyframes, {
			duration: delay,
			fill: "forwards"
		});
		animation.onfinish = () => {
			animation.cancel();
			on_begin();
			var t1 = counterpart?.t() ?? 1 - t2;
			counterpart?.abort();
			var delta = t2 - t1;
			var duration = options.duration * Math.abs(delta);
			var keyframes = [];
			if (duration > 0) {
				/**
				* Whether or not the CSS includes `overflow: hidden`, in which case we need to
				* add it as an inline style to work around a Safari <18 bug
				* TODO 6.0 remove this, if possible
				*/
				var needs_overflow_hidden = false;
				if (css) {
					var n = Math.ceil(duration / (1e3 / 60));
					for (var i = 0; i <= n; i += 1) {
						var t = t1 + delta * easing(i / n);
						var styles = css_to_keyframe(css(t, 1 - t));
						keyframes.push(styles);
						needs_overflow_hidden ||= styles.overflow === "hidden";
					}
				}
				if (needs_overflow_hidden)
 /** @type {HTMLElement} */ element.style.overflow = "hidden";
				get_t = () => {
					var time = animation.currentTime;
					return t1 + delta * easing(time / duration);
				};
				if (tick) loop(() => {
					if (animation.playState !== "running") return false;
					var t = get_t();
					tick(t, 1 - t);
					return true;
				});
			}
			animation = element.animate(keyframes, {
				duration,
				fill: "forwards"
			});
			animation.onfinish = () => {
				get_t = () => t2;
				tick?.(t2, 1 - t2);
				on_finish();
			};
		};
	});
	return {
		abort: () => {
			aborted = true;
			if (animation) {
				animation.cancel();
				animation.effect = null;
				animation.onfinish = noop;
			}
		},
		deactivate: () => {
			on_finish = noop;
		},
		reset: () => {
			if (t2 === 0) tick?.(1, 0);
		},
		t: () => get_t()
	};
}
// node_modules/svelte/src/internal/client/dom/blocks/svelte-element.js
/** @import { Effect, EffectNodes, TemplateNode } from '#client' */
/**
* @param {Comment | Element} node
* @param {() => string} get_tag
* @param {boolean} is_svg
* @param {undefined | ((element: Element, anchor: Node | null) => void)} render_fn,
* @param {undefined | (() => string)} get_namespace
* @param {undefined | [number, number]} location
* @returns {void}
*/
function element(node, get_tag, is_svg, render_fn, get_namespace, location) {
	let was_hydrating = hydrating;
	if (hydrating) hydrate_next();
	var filename = location && component_context?.function[FILENAME];
	/** @type {null | Element} */
	var element = null;
	if (hydrating && hydrate_node.nodeType === 1) {
		element = hydrate_node;
		hydrate_next();
	}
	var anchor = hydrating ? hydrate_node : node;
	/**
	* We track this so we can set it when changing the element, allowing any
	* `animate:` directive to bind itself to the correct block
	*/
	var parent_effect = active_effect;
	var branches = new BranchManager(anchor, false);
	block(() => {
		const next_tag = get_tag() || null;
		var ns = get_namespace ? get_namespace() : is_svg || next_tag === "svg" ? NAMESPACE_SVG : void 0;
		if (next_tag === null) {
			branches.ensure(null, null);
			set_should_intro(true);
			return;
		}
		branches.ensure(next_tag, (anchor) => {
			if (next_tag) {
				var is_hydrating = hydrating;
				element = hydrating ? element : create_element(next_tag, ns);
				if (location) element.__svelte_meta = {
					parent: dev_stack,
					loc: {
						file: filename,
						line: location[0],
						column: location[1]
					}
				};
				assign_nodes(element, element);
				if (render_fn) {
					var tmp_comment = null;
					if (hydrating && is_raw_text_element(next_tag)) element.append(tmp_comment = document.createComment(""));
					var child_anchor = hydrating ? /* @__PURE__ */ get_first_child(element) : element.appendChild(create_text());
					if (hydrating) {
						if (child_anchor === null) set_hydrating(false);
						else set_hydrate_node(child_anchor);
					}
					set_animation_effect_override(parent_effect);
					render_fn(element, child_anchor);
					tmp_comment?.remove();
					set_animation_effect_override(null);
				}
				/** @type {Effect & { nodes: EffectNodes }} */ active_effect.nodes.end = element;
				if (!is_hydrating) anchor.before(element);
			}
			if (hydrating) set_hydrate_node(anchor);
		});
		set_should_intro(true);
		return () => {
			if (next_tag) set_should_intro(false);
		};
	}, EFFECT_TRANSPARENT);
	teardown(() => {
		set_should_intro(true);
	});
	if (was_hydrating) {
		set_hydrating(true);
		set_hydrate_node(anchor);
	}
}
// node_modules/svelte/src/internal/client/dom/blocks/svelte-head.js
/** @import { TemplateNode } from '#client' */
/**
* @param {string} hash
* @param {(anchor: Node) => void} render_fn
* @returns {void}
*/
function head(hash, render_fn) {
	let previous_hydrate_node = null;
	let was_hydrating = hydrating;
	/** @type {Comment | Text} */
	var anchor;
	if (hydrating) {
		previous_hydrate_node = hydrate_node;
		var head_anchor = /* @__PURE__ */ get_first_child(document.head);
		while (head_anchor !== null && (head_anchor.nodeType !== 8 || head_anchor.data !== hash)) head_anchor = /* @__PURE__ */ get_next_sibling(head_anchor);
		if (head_anchor === null) set_hydrating(false);
		else {
			var start = /* @__PURE__ */ get_next_sibling(head_anchor);
			head_anchor.remove();
			set_hydrate_node(start);
		}
	}
	if (!hydrating) anchor = document.head.appendChild(create_text());
	try {
		block(() => {
			var e = branch(() => render_fn(anchor));
			e.f |= HEAD_EFFECT;
			if (!hydrating) {
				if (e.nodes === null) e.nodes = {
					start: anchor,
					end: anchor,
					a: null,
					t: null
				};
				else e.nodes.end = anchor;
			}
		});
	} finally {
		if (was_hydrating) {
			set_hydrating(true);
			set_hydrate_node(previous_hydrate_node);
		}
	}
}
// node_modules/svelte/src/internal/client/dom/css.js
/**
* @param {Node} anchor
* @param {{ hash: string, code: string }} css
*/
function append_styles$1(anchor, css) {
	effect(() => {
		anchor = active_effect?.parent?.nodes?.start ?? anchor;
		var root = anchor.getRootNode();
		var target = root.host ? root : /** @type {Document} */ root.head ?? root.ownerDocument.head;
		if (!target.querySelector("#" + css.hash)) {
			const style = create_element("style");
			style.id = css.hash;
			style.textContent = css.code;
			target.appendChild(style);
			register_style(css.hash, style);
		}
	});
}
// node_modules/svelte/src/internal/client/dom/elements/actions.js
/** @import { ActionPayload } from '#client' */
/**
* @template P
* @param {Element} dom
* @param {(dom: Element, value?: P) => ActionPayload<P>} action
* @param {() => P} [get_value]
* @returns {void}
*/
function action(dom, action, get_value) {
	effect(() => {
		var payload = untrack(() => action(dom, get_value?.()) || {});
		if (get_value && payload?.update) {
			var inited = false;
			/** @type {P} */
			var prev = {};
			render_effect(() => {
				var value = get_value();
				deep_read_state(value);
				if (inited && safe_not_equal(prev, value)) {
					prev = value;
					/** @type {Function} */ payload.update(value);
				}
			});
			inited = true;
		}
		if (payload?.destroy) return () => payload.destroy();
	});
}
// node_modules/svelte/src/internal/client/dom/elements/attachments.js
/** @import { Effect } from '#client' */
/**
* @param {Element} node
* @param {() => (node: Element) => void} get_fn
*/
function attach(node, get_fn) {
	/** @type {false | undefined | ((node: Element) => void)} */
	var fn = void 0;
	/** @type {Effect | null} */
	var e;
	managed(() => {
		if (fn !== (fn = get_fn())) {
			if (e) {
				destroy_effect(e);
				e = null;
			}
			if (fn) e = branch(() => {
				effect(() => fn(node));
			});
		}
	});
}
// node_modules/svelte/src/escaping.js
var ATTR_REGEX = /[&"<]/g;
var CONTENT_REGEX = /[&<]/g;
/**
* @template V
* @param {V} value
* @param {boolean} [is_attr]
*/
function escape_html(value, is_attr) {
	const str = String(value ?? "");
	const pattern = is_attr ? ATTR_REGEX : CONTENT_REGEX;
	pattern.lastIndex = 0;
	let escaped = "";
	let last = 0;
	while (pattern.test(str)) {
		const i = pattern.lastIndex - 1;
		const ch = str[i];
		escaped += str.substring(last, i) + (ch === "&" ? "&amp;" : ch === "\"" ? "&quot;" : "&lt;");
		last = i + 1;
	}
	return escaped + str.substring(last);
}
// node_modules/svelte/src/internal/shared/attributes.js
/**
* `<div translate={false}>` should be rendered as `<div translate="no">` and _not_
* `<div translate="false">`, which is equivalent to `<div translate="yes">`. There
* may be other odd cases that need to be added to this list in future
* @type {Record<string, Map<any, string>>}
*/
var replacements = { translate: /* @__PURE__ */ new Map([[true, "yes"], [false, "no"]]) };
/**
* @template V
* @param {string} name
* @param {V} value
* @param {boolean} [is_boolean]
* @returns {string}
*/
function attr(name, value, is_boolean = false) {
	if (name === "hidden" && value !== "until-found") is_boolean = true;
	if (value == null || is_boolean && !value && value !== "") return "";
	const normalized = has_own_property.call(replacements, name) && replacements[name].get(value) || value;
	return ` ${name}${is_boolean ? `=""` : `="${escape_html(normalized, true)}"`}`;
}
/**
* Small wrapper around clsx to preserve Svelte's (weird) handling of falsy values.
* TODO Svelte 6 revisit this, and likely turn all falsy values into the empty string (what clsx also does)
* @param  {any} value
*/
function clsx(value) {
	if (typeof value === "object") return clsx$1(value);
	else return value ?? "";
}
var whitespace = [..." 	\n\r\f\xA0\v﻿"];
/**
* @param {any} value
* @param {string | null} [hash]
* @param {Record<string, boolean>} [directives]
* @returns {string | null}
*/
function to_class(value, hash, directives) {
	var classname = value == null ? "" : "" + value;
	if (hash) classname = classname ? classname + " " + hash : hash;
	if (directives) {
		for (var key of Object.keys(directives)) if (directives[key]) classname = classname ? classname + " " + key : key;
		else if (classname.length) {
			var len = key.length;
			var a = 0;
			while ((a = classname.indexOf(key, a)) >= 0) {
				var b = a + len;
				if ((a === 0 || whitespace.includes(classname[a - 1])) && (b === classname.length || whitespace.includes(classname[b]))) classname = (a === 0 ? "" : classname.substring(0, a)) + classname.substring(b + 1);
				else a = b;
			}
		}
	}
	return classname === "" ? null : classname;
}
/**
*
* @param {Record<string,any>} styles
* @param {boolean} important
*/
function append_styles(styles, important = false) {
	var separator = important ? " !important;" : ";";
	var css = "";
	for (var key of Object.keys(styles)) {
		var value = styles[key];
		if (value != null && value !== "") css += " " + key + ": " + value + separator;
	}
	return css;
}
/**
* @param {string} name
* @returns {string}
*/
function to_css_name(name) {
	if (name[0] !== "-" || name[1] !== "-") return name.toLowerCase();
	return name;
}
/**
* @param {any} value
* @param {Record<string, any> | [Record<string, any>, Record<string, any>]} [styles]
* @returns {string | null}
*/
function to_style(value, styles) {
	if (styles) {
		var new_style = "";
		/** @type {Record<string,any> | undefined} */
		var normal_styles;
		/** @type {Record<string,any> | undefined} */
		var important_styles;
		if (Array.isArray(styles)) {
			normal_styles = styles[0];
			important_styles = styles[1];
		} else normal_styles = styles;
		if (value) {
			value = String(value).replaceAll(/\/\*.*?\*\//g, "").trim();
			/** @type {boolean | '"' | "'"} */
			var in_str = false;
			var in_apo = 0;
			var in_comment = false;
			var reserved_names = [];
			if (normal_styles) reserved_names.push(...Object.keys(normal_styles).map(to_css_name));
			if (important_styles) reserved_names.push(...Object.keys(important_styles).map(to_css_name));
			var start_index = 0;
			var name_index = -1;
			const len = value.length;
			for (var i = 0; i < len; i++) {
				var c = value[i];
				if (in_comment) {
					if (c === "/" && value[i - 1] === "*") in_comment = false;
				} else if (in_str) {
					if (in_str === c) in_str = false;
				} else if (c === "/" && value[i + 1] === "*") in_comment = true;
				else if (c === "\"" || c === "'") in_str = c;
				else if (c === "(") in_apo++;
				else if (c === ")") in_apo--;
				if (!in_comment && in_str === false && in_apo === 0) {
					if (c === ":" && name_index === -1) name_index = i;
					else if (c === ";" || i === len - 1) {
						if (name_index !== -1) {
							var name = to_css_name(value.substring(start_index, name_index).trim());
							if (!reserved_names.includes(name)) {
								if (c !== ";") i++;
								var property = value.substring(start_index, i).trim();
								new_style += " " + property + ";";
							}
						}
						start_index = i + 1;
						name_index = -1;
					}
				}
			}
		}
		if (normal_styles) new_style += append_styles(normal_styles);
		if (important_styles) new_style += append_styles(important_styles, true);
		new_style = new_style.trim();
		return new_style === "" ? null : new_style;
	}
	return value == null ? null : String(value);
}
// node_modules/svelte/src/internal/client/dom/elements/class.js
/**
* @param {Element} dom
* @param {boolean | number} is_html
* @param {string | null} value
* @param {string} [hash]
* @param {Record<string, any>} [prev_classes]
* @param {Record<string, any>} [next_classes]
* @returns {Record<string, boolean> | undefined}
*/
function set_class(dom, is_html, value, hash, prev_classes, next_classes) {
	var prev = dom[CLASS_CACHE];
	if (hydrating || prev !== value || prev === void 0) {
		var next_class_name = to_class(value, hash, next_classes);
		if (!hydrating || next_class_name !== dom.getAttribute("class")) {
			if (next_class_name == null) dom.removeAttribute("class");
			else if (is_html) dom.className = next_class_name;
			else dom.setAttribute("class", next_class_name);
		}
		/** @type {any} */ dom[CLASS_CACHE] = value;
	} else if (next_classes && prev_classes !== next_classes) for (var key in next_classes) {
		var is_present = !!next_classes[key];
		if (prev_classes == null || is_present !== !!prev_classes[key]) dom.classList.toggle(key, is_present);
	}
	return next_classes;
}
// node_modules/svelte/src/internal/client/dom/elements/style.js
/**
* @param {Element & ElementCSSInlineStyle} dom
* @param {Record<string, any>} prev
* @param {Record<string, any>} next
* @param {string} [priority]
*/
function update_styles(dom, prev = {}, next, priority) {
	for (var key in next) {
		var value = next[key];
		if (prev[key] !== value) {
			if (next[key] == null) dom.style.removeProperty(key);
			else dom.style.setProperty(key, value, priority);
		}
	}
}
/**
* @param {Element & ElementCSSInlineStyle} dom
* @param {string | null} value
* @param {Record<string, any> | [Record<string, any>, Record<string, any>]} [prev_styles]
* @param {Record<string, any> | [Record<string, any>, Record<string, any>]} [next_styles]
*/
function set_style(dom, value, prev_styles, next_styles) {
	var prev = dom[STYLE_CACHE];
	if (hydrating || prev !== value) {
		var next_style_attr = to_style(value, next_styles);
		if (!hydrating || next_style_attr !== dom.getAttribute("style")) {
			if (next_style_attr == null) dom.removeAttribute("style");
			else dom.style.cssText = next_style_attr;
		}
		/** @type {any} */ dom[STYLE_CACHE] = value;
	} else if (next_styles) {
		if (Array.isArray(next_styles)) {
			update_styles(dom, prev_styles?.[0], next_styles[0]);
			update_styles(dom, prev_styles?.[1], next_styles[1], "important");
		} else update_styles(dom, prev_styles, next_styles);
	}
	return next_styles;
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/select.js
/**
* Sets the `selected` attribute on an option so form reset can restore it.
* @param {HTMLOptionElement} option
* @param {boolean} selected
*/
function set_selected(option, selected) {
	if (selected) {
		if (!option.hasAttribute("selected")) option.setAttribute("selected", "");
	} else option.removeAttribute("selected");
}
/**
* Sets the options a form reset should restore. The first call selects
* them if nothing has set a value, later calls leave the current selection alone.
* @param {HTMLSelectElement} select
* @param {any} value
*/
function set_default_select_value(select, value) {
	var mounting = !("__defaultValue" in select);
	if (!mounting && select.__defaultValue === value) return;
	select.__defaultValue = value;
	apply_default_select_value(select, !mounting || "__value" in select);
}
/**
* Marks the options matching `__defaultValue` as selected. Without `preserve`
* a newly matching option gets selected, as an inserted `<option selected>` would.
* @param {HTMLSelectElement} select
* @param {boolean} preserve
*/
function apply_default_select_value(select, preserve) {
	var value = select.__defaultValue;
	var multiple = select.multiple;
	var values = multiple ? value ?? [] : null;
	if (multiple && !is_array(values)) return;
	var index = select.selectedIndex;
	var selected = preserve && multiple ? new Set(select.selectedOptions) : null;
	for (var option of select.options) {
		var option_value = get_option_value(option);
		set_selected(option, multiple ? values.includes(option_value) : is(option_value, value));
	}
	if (!preserve) return;
	if (selected !== null) for (option of select.options) {
		var was_selected = selected.has(option);
		if (option.selected !== was_selected) option.selected = was_selected;
	}
	else if (select.selectedIndex !== index) select.selectedIndex = index;
}
/**
* Selects the correct option(s) (depending on whether this is a multiple select)
* @template V
* @param {HTMLSelectElement} select
* @param {V} value
* @param {boolean} mounting
*/
function select_option(select, value, mounting = false) {
	if (select.multiple) {
		if (value == void 0) return;
		if (!is_array(value)) return select_multiple_invalid_value();
		for (var option of select.options) option.selected = value.includes(get_option_value(option));
		return;
	}
	for (option of select.options) {
		var option_value = get_option_value(option);
		if (is(option_value, value)) {
			option.selected = true;
			return;
		}
	}
	if (!mounting || value !== void 0) select.selectedIndex = -1;
}
/**
* Sets up a mutation observer to sync the current selection
* and default to the dom when the options change, for example
* when they are inside an `#each` block. Called once per `<select>`,
* by the compiled output or by `attribute_effect` for spreads.
* @param {HTMLSelectElement} select
*/
function init_select(select) {
	var observer = new MutationObserver((entries) => {
		if (entries.every(is_selectedcontent_mutation)) return;
		if ("__defaultValue" in select) apply_default_select_value(select, false);
		if ("__value" in select) select_option(select, select.__value);
	});
	observer.observe(select, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["value"]
	});
	teardown(() => {
		observer.disconnect();
	});
}
/**
* @param {HTMLSelectElement} select
* @param {() => unknown} get
* @param {(value: unknown) => void} set
* @returns {void}
*/
function bind_select_value(select, get, set = get) {
	var batches = /* @__PURE__ */ new WeakSet();
	var mounting = true;
	listen_to_event_and_reset_event(select, "change", (is_reset) => {
		var query = is_reset ? "[selected]" : ":checked";
		/** @type {unknown} */
		var value;
		if (select.multiple) value = [].map.call(select.querySelectorAll(query), get_option_value);
		else {
			/** @type {HTMLOptionElement | null} */
			var selected_option = select.querySelector(query) ?? select.querySelector("option:not([disabled])");
			value = selected_option && get_option_value(selected_option);
		}
		set(value);
		select.__value = value;
		if (current_batch !== null) batches.add(current_batch);
	});
	effect(() => {
		var value = get();
		if (select === document.activeElement) {
			var batch = async_mode_flag ? previous_batch : current_batch;
			if (batches.has(batch)) return;
		}
		select_option(select, value, mounting);
		if (mounting && value === void 0) {
			/** @type {HTMLOptionElement | null} */
			var selected_option = select.querySelector(":checked");
			if (selected_option !== null) {
				value = get_option_value(selected_option);
				set(value);
			}
		}
		select.__value = value;
		mounting = false;
	});
}
/** @param {HTMLOptionElement} option */
function get_option_value(option) {
	if ("__value" in option) return option.__value;
	else return option.value;
}
/**
* Returns `true` if the mutation stems from the browser mirroring the selected
* option's content into `<selectedcontent>`, or from us replacing the
* `<selectedcontent>` element with a clone of itself
* @param {MutationRecord} entry
*/
function is_selectedcontent_mutation(entry) {
	if (entry.target.closest("selectedcontent") !== null) return true;
	if (entry.type === "childList") {
		var nodes = [...entry.addedNodes, ...entry.removedNodes];
		return nodes.length > 0 && nodes.every((node) => node.nodeName === "SELECTEDCONTENT");
	}
	return false;
}
// node_modules/svelte/src/internal/client/dom/elements/attributes.js
/** @import { Blocker, Effect } from '#client' */
var CLASS = Symbol("class");
var STYLE = Symbol("style");
var IS_CUSTOM_ELEMENT = Symbol("is custom element");
var IS_HTML = Symbol("is html");
var LINK_TAG = IS_XHTML ? "link" : "LINK";
var INPUT_TAG = IS_XHTML ? "input" : "INPUT";
var OPTION_TAG = IS_XHTML ? "option" : "OPTION";
var SELECT_TAG = IS_XHTML ? "select" : "SELECT";
var PROGRESS_TAG = IS_XHTML ? "progress" : "PROGRESS";
/**
* The value/checked attribute in the template actually corresponds to the defaultValue property, so we need
* to remove it upon hydration to avoid a bug when someone resets the form value.
* @param {HTMLInputElement} input
* @returns {void}
*/
function remove_input_defaults(input) {
	if (!hydrating) return;
	var already_removed = false;
	var remove_defaults = () => {
		if (already_removed) return;
		already_removed = true;
		if (input.hasAttribute("value")) {
			var value = input.value;
			set_attribute(input, "value", null);
			input.value = value;
		}
		if (input.hasAttribute("checked")) {
			var checked = input.checked;
			set_attribute(input, "checked", null);
			input.checked = checked;
		}
	};
	/** @type {any} */ input[FORM_RESET_HANDLER] = remove_defaults;
	queue_micro_task(remove_defaults);
	add_form_reset_listener();
}
/**
* @param {Element} element
* @param {any} value
*/
function set_value(element, value) {
	var attributes = get_attributes(element);
	if (attributes.value === (attributes.value = value ?? void 0) || element.value === value && (value !== 0 || element.nodeName !== PROGRESS_TAG)) return;
	element.value = value ?? "";
}
/**
* @param {Element} element
* @param {boolean} checked
*/
function set_checked(element, checked) {
	var attributes = get_attributes(element);
	if (attributes.checked === (attributes.checked = checked ?? void 0)) return;
	element.checked = checked;
}
/**
* Applies the default checked property without influencing the current checked property.
* @param {HTMLInputElement} element
* @param {boolean} checked
*/
function set_default_checked(element, checked) {
	const existing_value = element.checked;
	element.defaultChecked = checked;
	element.checked = existing_value;
}
/**
* Applies the default value property without influencing the current value property.
* @param {HTMLInputElement | HTMLTextAreaElement} element
* @param {string} value
*/
function set_default_value(element, value) {
	const existing_value = element.value;
	element.defaultValue = value;
	element.value = existing_value;
}
/**
* @param {Element} element
* @param {string} attribute
* @param {string | null} value
* @param {boolean} [skip_warning]
*/
function set_attribute(element, attribute, value, skip_warning) {
	var attributes = get_attributes(element);
	if (hydrating) {
		attributes[attribute] = element.getAttribute(attribute);
		if (attribute === "src" || attribute === "srcset" || attribute === "href" && element.nodeName === LINK_TAG) {
			if (!skip_warning) check_src_in_dev_hydration(element, attribute, value ?? "");
			return;
		}
	}
	var previous = attributes[attribute];
	if (previous === (attributes[attribute] = value)) return;
	if (attribute === "loading") element[LOADING_ATTR_SYMBOL] = value;
	if (value == null) element.removeAttribute(attribute);
	else if (typeof value !== "string" && get_setters(element).has(attribute)) element[attribute] = value;
	else if (!(hydrating && (typeof value === "number" || typeof value === "boolean") && previous === String(value))) element.setAttribute(attribute, value);
}
/**
* @param {Element} dom
* @param {string} attribute
* @param {string} value
*/
function set_xlink_attribute(dom, attribute, value) {
	dom.setAttributeNS("http://www.w3.org/1999/xlink", attribute, value);
}
/**
* @param {HTMLElement} node
* @param {string} prop
* @param {any} value
*/
function set_custom_element_data(node, prop, value) {
	var previous_reaction = active_reaction;
	var previous_effect = active_effect;
	let was_hydrating = hydrating;
	if (hydrating) set_hydrating(false);
	set_active_reaction(null);
	set_active_effect(null);
	try {
		if (prop !== "style" && (setters_cache.has(node.getAttribute("is") || node.nodeName) || !customElements || customElements.get(node.getAttribute("is") || node.nodeName.toLowerCase()) ? get_setters(node).has(prop) : value && typeof value === "object")) node[prop] = value;
		else set_attribute(node, prop, value == null ? value : String(value));
	} finally {
		set_active_reaction(previous_reaction);
		set_active_effect(previous_effect);
		if (was_hydrating) set_hydrating(true);
	}
}
/**
* Spreads attributes onto a DOM element, taking into account the currently set attributes
* @param {Element & ElementCSSInlineStyle} element
* @param {Record<string | symbol, any> | undefined} prev
* @param {Record<string | symbol, any>} next New attributes - this function mutates this object
* @param {string} [css_hash]
* @param {boolean} [should_remove_defaults]
* @param {boolean} [skip_warning]
* @returns {Record<string, any>}
*/
function set_attributes(element, prev, next, css_hash, should_remove_defaults = false, skip_warning = false) {
	if (hydrating && should_remove_defaults && element.nodeName === INPUT_TAG) {
		if (!("defaultValue" in next || "defaultChecked" in next)) remove_input_defaults(element);
	}
	var attributes = get_attributes(element);
	var is_custom_element = attributes[IS_CUSTOM_ELEMENT];
	var preserve_attribute_case = !attributes[IS_HTML];
	let is_hydrating_custom_element = hydrating && is_custom_element;
	if (is_hydrating_custom_element) set_hydrating(false);
	var current = prev || {};
	var is_option_element = element.nodeName === OPTION_TAG;
	var is_select_element = element.nodeName === SELECT_TAG;
	try {
		for (var key in prev) if (!(key in next) && key[0] + key[1] !== "$$") next[key] = null;
		if (next.class) next.class = clsx(next.class);
		else if (css_hash || next[CLASS]) next.class = null;
		if (next[STYLE]) next.style ??= null;
		var setters = get_setters(element);
		if (element.nodeName === INPUT_TAG && "type" in next && ("value" in next || "__value" in next)) {
			var type = next.type;
			if (type !== current.type || type === void 0 && element.hasAttribute("type")) {
				current.type = type;
				set_attribute(element, "type", type, skip_warning);
			}
		}
		for (const key in next) {
			let value = next[key];
			if (is_option_element && key === "value" && value == null) {
				element.value = element.__value = "";
				current[key] = value;
				continue;
			}
			if (key === "class") {
				set_class(element, element.namespaceURI === "http://www.w3.org/1999/xhtml", value, css_hash, prev?.[CLASS], next[CLASS]);
				current[key] = value;
				current[CLASS] = next[CLASS];
				continue;
			}
			if (key === "style") {
				set_style(element, value, prev?.[STYLE], next[STYLE]);
				current[key] = value;
				current[STYLE] = next[STYLE];
				continue;
			}
			var prev_value = current[key];
			if (value === prev_value && !(value === void 0 && element.hasAttribute(key))) continue;
			current[key] = value;
			var prefix = key[0] + key[1];
			if (prefix === "$$") continue;
			if (prefix === "on") {
				/** @type {{ capture?: true }} */
				const opts = {};
				const event_handle_key = "$$" + key;
				let event_name = key.slice(2);
				var is_delegated = can_delegate_event(event_name);
				if (is_capture_event(event_name)) {
					event_name = event_name.slice(0, -7);
					opts.capture = true;
				}
				if (!is_delegated && prev_value) {
					if (value != null) continue;
					element.removeEventListener(event_name, current[event_handle_key], opts);
					current[event_handle_key] = null;
				}
				if (is_delegated) {
					delegated(event_name, element, value);
					delegate([event_name]);
				} else if (value != null) {
					/**
					* @this {any}
					* @param {Event} evt
					*/
					function handle(evt) {
						current[key].call(this, evt);
					}
					current[event_handle_key] = create_event(event_name, element, handle, opts);
				}
			} else if (key === "style") set_attribute(element, key, value);
			else if (key === "autofocus") autofocus(element, Boolean(value));
			else if (!is_custom_element && (key === "__value" || key === "value" && value != null)) {
				element.__value = value;
				if (prev_value == null || element.value !== value || value === 0 && element.nodeName === PROGRESS_TAG) element.value = value;
			} else if (key === "selected" && is_option_element) set_selected(element, value);
			else {
				var name = key;
				if (!preserve_attribute_case) name = normalize_attribute(name);
				var is_default = name === "defaultValue" || name === "defaultChecked";
				if (is_select_element && name === "defaultValue") continue;
				if (value == null && !is_custom_element && !is_default) {
					attributes[key] = null;
					if (name === "value" || name === "checked") {
						let input = element;
						const use_default = prev === void 0;
						if (name === "value") {
							let previous = input.defaultValue;
							input.removeAttribute(name);
							input.defaultValue = previous;
							input.value = input.__value = use_default ? previous : null;
						} else {
							let previous = input.defaultChecked;
							input.removeAttribute(name);
							input.defaultChecked = previous;
							input.checked = use_default ? previous : false;
						}
					} else element.removeAttribute(key);
				} else if (is_default || (is_custom_element || typeof value !== "string") && setters.has(name)) {
					element[name] = value;
					if (name in attributes) attributes[name] = UNINITIALIZED;
				} else if (typeof value !== "function") set_attribute(element, name, value, skip_warning);
			}
		}
	} finally {
		if (is_hydrating_custom_element) set_hydrating(true);
	}
	return current;
}
/**
* @param {Element & ElementCSSInlineStyle} element
* @param {(...expressions: any) => Record<string | symbol, any>} fn
* @param {Array<() => any>} sync
* @param {Array<() => Promise<any>>} async
* @param {Blocker[]} blockers
* @param {string} [css_hash]
* @param {boolean} [should_remove_defaults]
* @param {boolean} [skip_warning]
*/
function attribute_effect(element, fn, sync = [], async = [], blockers = [], css_hash, should_remove_defaults = false, skip_warning = false) {
	flatten(blockers, sync, async, (values) => {
		/** @type {Record<string | symbol, any> | undefined} */
		var prev = void 0;
		/** @type {Record<symbol, Effect>} */
		var effects = {};
		var is_select = element.nodeName === SELECT_TAG;
		var inited = false;
		managed(() => {
			var next = fn(...values.map(get));
			/** @type {Record<string | symbol, any>} */
			var current = set_attributes(element, prev, next, css_hash, should_remove_defaults, skip_warning);
			if (inited && is_select) {
				var select = element;
				if ("defaultValue" in next) set_default_select_value(select, next.defaultValue);
				if ("value" in next) select_option(select, next.value);
			}
			for (let symbol of Object.getOwnPropertySymbols(effects)) if (!next[symbol]) destroy_effect(effects[symbol]);
			for (let symbol of Object.getOwnPropertySymbols(next)) {
				var n = next[symbol];
				if (symbol.description === "@attach" && (!prev || n !== prev[symbol])) {
					if (effects[symbol]) destroy_effect(effects[symbol]);
					effects[symbol] = branch(() => attach(element, () => n));
				}
				current[symbol] = n;
			}
			prev = current;
		});
		if (is_select) {
			var select = element;
			effect(() => {
				var attrs = prev;
				if ("defaultValue" in attrs) set_default_select_value(select, attrs.defaultValue);
				select_option(select, attrs.value, true);
				init_select(select);
			});
		}
		inited = true;
	});
}
/**
*
* @param {Element} element
*/
function get_attributes(element) {
	return element[ATTRIBUTES_CACHE] ??= {
		[IS_CUSTOM_ELEMENT]: element.nodeName.includes("-"),
		[IS_HTML]: element.namespaceURI === NAMESPACE_HTML
	};
}
/** @type {Map<string, Set<string>>} */
var setters_cache = /* @__PURE__ */ new Map();
/** @param {Element} element */
function get_setters(element) {
	var cache_key = element.getAttribute("is") || element.nodeName;
	var setters = setters_cache.get(cache_key);
	if (setters) return setters;
	setters_cache.set(cache_key, setters = /* @__PURE__ */ new Set());
	var descriptors;
	var proto = element;
	var element_proto = Element.prototype;
	while (element_proto !== proto) {
		descriptors = get_descriptors(proto);
		for (var key in descriptors) if (descriptors[key].set && key !== "innerHTML" && key !== "textContent" && key !== "innerText") setters.add(key);
		proto = get_prototype_of(proto);
	}
	return setters;
}
/**
* @param {any} element
* @param {string} attribute
* @param {string} value
*/
function check_src_in_dev_hydration(element, attribute, value) {
	if (attribute === "srcset" && srcset_url_equal(element, value)) return;
	if (src_url_equal(element.getAttribute(attribute) ?? "", value)) return;
	hydration_attribute_changed(attribute, element.outerHTML.replace(element.innerHTML, element.innerHTML && "..."), String(value));
}
/**
* @param {string} element_src
* @param {string} url
* @returns {boolean}
*/
function src_url_equal(element_src, url) {
	if (element_src === url) return true;
	return new URL(element_src, document.baseURI).href === new URL(url, document.baseURI).href;
}
/** @param {string} srcset */
function split_srcset(srcset) {
	return srcset.split(",").map((src) => src.trim().split(" ").filter(Boolean));
}
/**
* @param {HTMLSourceElement | HTMLImageElement} element
* @param {string} srcset
* @returns {boolean}
*/
function srcset_url_equal(element, srcset) {
	var element_urls = split_srcset(element.srcset);
	var urls = split_srcset(srcset);
	return urls.length === element_urls.length && urls.every(([url, width], i) => width === element_urls[i][1] && (src_url_equal(element_urls[i][0], url) || src_url_equal(url, element_urls[i][0])));
}
// node_modules/svelte/src/internal/client/dom/elements/customizable-select.js
/** @type {boolean | null} */
var supported = null;
/**
* Checks if the browser supports rich HTML content inside `<option>` elements.
* Modern browsers preserve HTML elements inside options, while older browsers
* strip them during parsing, leaving only text content.
* @returns {boolean}
*/
function is_supported() {
	if (supported === null) {
		var select = create_element("select");
		select.innerHTML = create_trusted_html("<option><span>t</span></option>");
		supported = select.firstChild?.firstChild?.nodeType === 1;
	}
	return supported;
}
/**
*
* @param {HTMLElement} element
* @param {(new_element: HTMLElement) => void} update_element
*/
function selectedcontent(element, update_element) {
	if (!is_supported()) return;
	attach(element, () => () => {
		const select = element.closest("select");
		if (!select) return;
		const observer = new MutationObserver((entries) => {
			var selected = false;
			for (const entry of entries) {
				if (entry.target === element) return;
				selected ||= !!entry.target.parentElement?.closest("option")?.selected;
			}
			if (selected) {
				element.replaceWith(element = element.cloneNode(true));
				update_element(element);
			}
		});
		observer.observe(select, {
			childList: true,
			characterData: true,
			subtree: true
		});
		return () => {
			observer.disconnect();
		};
	});
}
/**
* Handles rich HTML content inside `<option>`, `<optgroup>`, or `<select>` elements with browser-specific branching.
* Modern browsers preserve HTML inside options, while older browsers strip it to text only.
*
* @param {HTMLOptionElement | HTMLOptGroupElement | HTMLSelectElement} element The element to process
* @param {() => void} rich_fn Function to process rich HTML content (modern browsers)
*/
function customizable_select(element, rich_fn) {
	var was_hydrating = hydrating;
	if (!is_supported()) {
		set_hydrating(false);
		element.textContent = "";
		element.append(create_comment(""));
	}
	try {
		rich_fn();
	} finally {
		if (was_hydrating) {
			if (hydrating) reset(element);
			else {
				set_hydrating(true);
				set_hydrate_node(element);
			}
		}
	}
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/document.js
/**
* @param {(activeElement: Element | null) => void} update
* @returns {void}
*/
function bind_active_element(update) {
	listen(document, ["focusin", "focusout"], (event) => {
		if (event && event.type === "focusout" && event.relatedTarget) return;
		without_reactive_context(() => update(document.activeElement));
	});
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
/** @import { Batch } from '../../../reactivity/batch.js' */
/**
* @param {HTMLInputElement} input
* @param {() => unknown} get
* @param {(value: unknown) => void} set
* @returns {void}
*/
function bind_value(input, get, set = get) {
	var batches = /* @__PURE__ */ new WeakSet();
	listen_to_event_and_reset_event(input, "input", async (is_reset) => {
		if (input.type === "checkbox") bind_invalid_checkbox_value();
		/** @type {any} */
		var value = is_reset ? input.defaultValue : input.value;
		value = is_numberlike_input(input) ? to_number(value) : value;
		set(value);
		if (current_batch !== null) batches.add(current_batch);
		await tick();
		if (value !== (value = get())) {
			var start = input.selectionStart;
			var end = input.selectionEnd;
			var length = input.value.length;
			input.value = value ?? "";
			if (end !== null) {
				var new_length = input.value.length;
				if (start === end && end === length && new_length > length) {
					input.selectionStart = new_length;
					input.selectionEnd = new_length;
				} else {
					input.selectionStart = start;
					input.selectionEnd = Math.min(end, new_length);
				}
			}
		}
	});
	if (hydrating && input.defaultValue !== input.value || untrack(get) == null && input.value) {
		set(is_numberlike_input(input) ? to_number(input.value) : input.value);
		if (current_batch !== null) batches.add(current_batch);
	}
	render_effect(() => {
		if (input.type === "checkbox") bind_invalid_checkbox_value();
		var value = get();
		if (input === document.activeElement) {
			var batch = async_mode_flag ? previous_batch : current_batch;
			if (batches.has(batch)) return;
		}
		if (is_numberlike_input(input) && value === to_number(input.value)) return;
		if (input.type === "date" && !value && !input.value) return;
		if (value !== input.value) input.value = value ?? "";
	});
}
/** @type {Set<HTMLInputElement[]>} */
var pending = /* @__PURE__ */ new Set();
/**
* @param {HTMLInputElement[]} inputs
* @param {null | [number]} group_index
* @param {HTMLInputElement} input
* @param {() => unknown} get
* @param {(value: unknown) => void} set
* @returns {void}
*/
function bind_group(inputs, group_index, input, get, set = get) {
	var is_checkbox = input.getAttribute("type") === "checkbox";
	var binding_group = inputs;
	let hydration_mismatch = false;
	if (group_index !== null) for (var index of group_index) binding_group = binding_group[index] ??= [];
	binding_group.push(input);
	listen_to_event_and_reset_event(input, "change", () => {
		var value = input.__value;
		if (is_checkbox) value = get_binding_group_value(binding_group, value, input.checked);
		set(value);
	}, () => set(is_checkbox ? [] : null));
	render_effect(() => {
		var value = get();
		if (hydrating && input.defaultChecked !== input.checked) {
			hydration_mismatch = true;
			return;
		}
		if (is_checkbox) {
			value = value || [];
			input.checked = value.includes(input.__value);
		} else input.checked = is(input.__value, value);
	});
	teardown(() => {
		var index = binding_group.indexOf(input);
		if (index !== -1) binding_group.splice(index, 1);
	});
	if (!pending.has(binding_group)) {
		pending.add(binding_group);
		queue_micro_task(() => {
			binding_group.sort((a, b) => a.compareDocumentPosition(b) === 4 ? -1 : 1);
			pending.delete(binding_group);
		});
	}
	queue_micro_task(() => {
		if (hydration_mismatch) {
			var value;
			if (is_checkbox) value = get_binding_group_value(binding_group, value, input.checked);
			else value = binding_group.find((input) => input.checked)?.__value;
			set(value);
		}
	});
}
/**
* @param {HTMLInputElement} input
* @param {() => unknown} get
* @param {(value: unknown) => void} set
* @returns {void}
*/
function bind_checked(input, get, set = get) {
	listen_to_event_and_reset_event(input, "change", (is_reset) => {
		set(is_reset ? input.defaultChecked : input.checked);
	});
	if (hydrating && input.defaultChecked !== input.checked || untrack(get) == null) set(input.checked);
	render_effect(() => {
		var value = get();
		input.checked = Boolean(value);
	});
}
/**
* @template V
* @param {Array<HTMLInputElement>} group
* @param {V} __value
* @param {boolean} checked
* @returns {V[]}
*/
function get_binding_group_value(group, __value, checked) {
	/** @type {Set<V>} */
	var value = /* @__PURE__ */ new Set();
	for (var i = 0; i < group.length; i += 1) if (group[i].checked) value.add(group[i].__value);
	if (!checked) value.delete(__value);
	return Array.from(value);
}
/**
* @param {HTMLInputElement} input
*/
function is_numberlike_input(input) {
	var type = input.type;
	return type === "number" || type === "range";
}
/**
* @param {string} value
*/
function to_number(value) {
	return value === "" ? null : +value;
}
/**
* @param {HTMLInputElement} input
* @param {() => FileList | null} get
* @param {(value: FileList | null) => void} set
*/
function bind_files(input, get, set = get) {
	listen_to_event_and_reset_event(input, "change", () => {
		set(input.files);
	});
	if (hydrating && input.files) set(input.files);
	render_effect(() => {
		input.files = get();
	});
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/media.js
/** @param {TimeRanges} ranges */
function time_ranges_to_array(ranges) {
	var array = [];
	for (var i = 0; i < ranges.length; i += 1) array.push({
		start: ranges.start(i),
		end: ranges.end(i)
	});
	return array;
}
/**
* @param {HTMLVideoElement | HTMLAudioElement} media
* @param {() => number | undefined} get
* @param {(value: number) => void} set
* @returns {void}
*/
function bind_current_time(media, get, set = get) {
	/** @type {number} */
	var raf_id;
	/** @type {number} */
	var value;
	var callback = () => {
		cancelAnimationFrame(raf_id);
		if (!media.paused) raf_id = requestAnimationFrame(callback);
		var next_value = media.currentTime;
		if (value !== next_value) set(value = next_value);
	};
	raf_id = requestAnimationFrame(callback);
	media.addEventListener("timeupdate", callback);
	render_effect(() => {
		var next_value = Number(get());
		if (value !== next_value && !isNaN(next_value)) media.currentTime = value = next_value;
	});
	teardown(() => {
		cancelAnimationFrame(raf_id);
		media.removeEventListener("timeupdate", callback);
	});
}
/**
* @param {HTMLVideoElement | HTMLAudioElement} media
* @param {(array: Array<{ start: number; end: number }>) => void} set
*/
function bind_buffered(media, set) {
	/** @type {{ start: number; end: number; }[]} */
	var current;
	listen(media, [
		"loadedmetadata",
		"progress",
		"timeupdate",
		"seeking"
	], () => {
		var ranges = media.buffered;
		if (!current || current.length !== ranges.length || current.some((range, i) => ranges.start(i) !== range.start || ranges.end(i) !== range.end)) {
			current = time_ranges_to_array(ranges);
			set(current);
		}
	});
}
/**
* @param {HTMLVideoElement | HTMLAudioElement} media
* @param {(array: Array<{ start: number; end: number }>) => void} set
*/
function bind_seekable(media, set) {
	listen(media, ["loadedmetadata"], () => set(time_ranges_to_array(media.seekable)));
}
/**
* @param {HTMLVideoElement | HTMLAudioElement} media
* @param {(array: Array<{ start: number; end: number }>) => void} set
*/
function bind_played(media, set) {
	listen(media, ["timeupdate"], () => set(time_ranges_to_array(media.played)));
}
/**
* @param {HTMLVideoElement | HTMLAudioElement} media
* @param {(seeking: boolean) => void} set
*/
function bind_seeking(media, set) {
	listen(media, ["seeking", "seeked"], () => set(media.seeking));
}
/**
* @param {HTMLVideoElement | HTMLAudioElement} media
* @param {(seeking: boolean) => void} set
*/
function bind_ended(media, set) {
	listen(media, ["timeupdate", "ended"], () => set(media.ended));
}
/**
* @param {HTMLVideoElement | HTMLAudioElement} media
* @param {(ready_state: number) => void} set
*/
function bind_ready_state(media, set) {
	listen(media, [
		"loadedmetadata",
		"loadeddata",
		"canplay",
		"canplaythrough",
		"playing",
		"waiting",
		"emptied"
	], () => set(media.readyState));
}
/**
* @param {HTMLVideoElement | HTMLAudioElement} media
* @param {() => number | undefined} get
* @param {(playback_rate: number) => void} set
*/
function bind_playback_rate(media, get, set = get) {
	effect(() => {
		var value = Number(get());
		if (value !== media.playbackRate && !isNaN(value)) media.playbackRate = value;
	});
	effect(() => {
		listen(media, ["ratechange"], () => {
			set(media.playbackRate);
		});
	});
}
/**
* @param {HTMLVideoElement | HTMLAudioElement} media
* @param {() => boolean | undefined} get
* @param {(paused: boolean) => void} set
*/
function bind_paused(media, get, set = get) {
	var paused = get();
	var update = () => {
		if (paused !== media.paused) set(paused = media.paused);
	};
	listen(media, [
		"play",
		"pause",
		"canplay"
	], update, paused == null);
	effect(() => {
		if ((paused = !!get()) !== media.paused) {
			if (paused) media.pause();
			else media.play().catch((error) => {
				set(paused = true);
				throw error;
			});
		}
	});
}
/**
* @param {HTMLVideoElement | HTMLAudioElement} media
* @param {() => number | undefined} get
* @param {(volume: number) => void} set
*/
function bind_volume(media, get, set = get) {
	var callback = () => {
		set(media.volume);
	};
	if (get() == null) callback();
	listen(media, ["volumechange"], callback, false);
	render_effect(() => {
		var value = Number(get());
		if (value !== media.volume && !isNaN(value)) media.volume = value;
	});
}
/**
* @param {HTMLVideoElement | HTMLAudioElement} media
* @param {() => boolean | undefined} get
* @param {(muted: boolean) => void} set
*/
function bind_muted(media, get, set = get) {
	var callback = () => {
		set(media.muted);
	};
	if (get() == null) callback();
	listen(media, ["volumechange"], callback, false);
	render_effect(() => {
		var value = !!get();
		if (media.muted !== value) media.muted = value;
	});
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/navigator.js
/**
* @param {(online: boolean) => void} update
* @returns {void}
*/
function bind_online(update) {
	listen(window, ["online", "offline"], () => {
		update(navigator.onLine);
	});
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/props.js
/**
* Makes an `export`ed (non-prop) variable available on the `$$props` object
* so that consumers can do `bind:x` on the component.
* @template V
* @param {Record<string, unknown>} props
* @param {string} prop
* @param {V} value
* @returns {void}
*/
function bind_prop(props, prop, value) {
	var desc = get_descriptor(props, prop);
	if (desc && desc.set) {
		props[prop] = value;
		teardown(() => {
			props[prop] = null;
		});
	}
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/size.js
/**
* We create one listener for all elements
* @see {@link https://groups.google.com/a/chromium.org/g/blink-dev/c/z6ienONUb5A/m/F5-VcUZtBAAJ Explanation}
*/
var ResizeObserverSingleton = class ResizeObserverSingleton {
	/** */
	#listeners = /* @__PURE__ */ new WeakMap();
	/** @type {ResizeObserver | undefined} */
	#observer;
	/** @type {ResizeObserverOptions} */
	#options;
	/** @static */
	static entries = /* @__PURE__ */ new WeakMap();
	/** @param {ResizeObserverOptions} options */
	constructor(options) {
		this.#options = options;
	}
	/**
	* @param {Element} element
	* @param {(entry: ResizeObserverEntry) => any} listener
	*/
	observe(element, listener) {
		var listeners = this.#listeners.get(element) || /* @__PURE__ */ new Set();
		listeners.add(listener);
		this.#listeners.set(element, listeners);
		this.#getObserver().observe(element, this.#options);
		return () => {
			var listeners = this.#listeners.get(element);
			listeners.delete(listener);
			if (listeners.size === 0) {
				this.#listeners.delete(element);
				/** @type {ResizeObserver} */ this.#observer.unobserve(element);
			}
		};
	}
	#getObserver() {
		return this.#observer ?? (this.#observer = new ResizeObserver(
			/** @param {any} entries */
			(entries) => {
				for (var entry of entries) {
					ResizeObserverSingleton.entries.set(entry.target, entry);
					for (var listener of this.#listeners.get(entry.target) || []) listener(entry);
				}
			}
		));
	}
};
var resize_observer_content_box = /* @__PURE__ */ new ResizeObserverSingleton({ box: "content-box" });
var resize_observer_border_box = /* @__PURE__ */ new ResizeObserverSingleton({ box: "border-box" });
var resize_observer_device_pixel_content_box = /* @__PURE__ */ new ResizeObserverSingleton({ box: "device-pixel-content-box" });
/**
* @param {Element} element
* @param {'contentRect' | 'contentBoxSize' | 'borderBoxSize' | 'devicePixelContentBoxSize'} type
* @param {(entry: keyof ResizeObserverEntry) => void} set
*/
function bind_resize_observer(element, type, set) {
	var unsub = (type === "contentRect" || type === "contentBoxSize" ? resize_observer_content_box : type === "borderBoxSize" ? resize_observer_border_box : resize_observer_device_pixel_content_box).observe(
		element,
		/** @param {any} entry */
		(entry) => set(entry[type])
	);
	teardown(unsub);
}
/**
* @param {HTMLElement} element
* @param {'clientWidth' | 'clientHeight' | 'offsetWidth' | 'offsetHeight'} type
* @param {(size: number) => void} set
*/
function bind_element_size(element, type, set) {
	var unsub = resize_observer_border_box.observe(element, () => set(element[type]));
	effect(() => {
		untrack(() => set(element[type]));
		return unsub;
	});
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
/** @import { ComponentContext, Effect } from '#client' */
/**
* @param {any} bound_value
* @param {Element} element_or_component
* @returns {boolean}
*/
function is_bound_this(bound_value, element_or_component) {
	return bound_value === element_or_component || bound_value?.[STATE_SYMBOL] === element_or_component;
}
/**
* @param {any} element_or_component
* @param {(value: unknown, ...parts: unknown[]) => void} update
* @param {(...parts: unknown[]) => unknown} get_value
* @param {() => unknown[]} [get_parts] Set if the this binding is used inside an each block,
* 										returns all the parts of the each block context that are used in the expression
* @returns {void}
*/
function bind_this(element_or_component = mark_as_component(), update, get_value, get_parts) {
	var component_effect = component_context.r;
	var parent = active_effect;
	effect(() => {
		/** @type {unknown[]} */
		var old_parts;
		/** @type {unknown[]} */
		var parts;
		render_effect(() => {
			old_parts = parts;
			parts = get_parts?.() || [];
			untrack(() => {
				if (!is_bound_this(get_value(...parts), element_or_component)) {
					update(element_or_component, ...parts);
					if (old_parts && is_bound_this(get_value(...old_parts), element_or_component)) update(null, ...old_parts);
				}
			});
		});
		return () => {
			let p = parent;
			while (p !== component_effect && p.parent !== null && p.parent.f & 33554432) p = p.parent;
			const teardown = () => {
				if (parts && is_bound_this(get_value(...parts), element_or_component)) update(null, ...parts);
			};
			const original_teardown = p.teardown;
			p.teardown = () => {
				teardown();
				original_teardown?.();
			};
		};
	});
	return element_or_component;
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/universal.js
/**
* @param {'innerHTML' | 'textContent' | 'innerText'} property
* @param {HTMLElement} element
* @param {() => unknown} get
* @param {(value: unknown) => void} set
* @returns {void}
*/
function bind_content_editable(property, element, get, set = get) {
	element.addEventListener("input", () => {
		set(element[property]);
	});
	render_effect(() => {
		var value = get();
		if (element[property] !== value) {
			if (value == null) {
				var non_null_value = element[property];
				set(non_null_value);
			} else element[property] = value + "";
		}
	});
}
/**
* @param {string} property
* @param {string} event_name
* @param {Element} element
* @param {(value: unknown) => void} set
* @param {() => unknown} [get]
* @returns {void}
*/
function bind_property(property, event_name, element, set, get) {
	var handler = () => {
		set(element[property]);
	};
	element.addEventListener(event_name, handler);
	if (get) render_effect(() => {
		element[property] = get();
	});
	else handler();
	if (element === document.body || element === window || element === document) teardown(() => {
		element.removeEventListener(event_name, handler);
	});
}
/**
* @param {HTMLElement} element
* @param {(value: unknown) => void} set
* @returns {void}
*/
function bind_focused(element, set) {
	listen(element, ["focus", "blur"], () => {
		set(element === document.activeElement);
	});
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/window.js
/**
* @param {'x' | 'y'} type
* @param {() => number} get
* @param {(value: number) => void} set
* @returns {void}
*/
function bind_window_scroll(type, get, set = get) {
	var is_scrolling_x = type === "x";
	var target_handler = () => without_reactive_context(() => {
		scrolling = true;
		clearTimeout(timeout);
		timeout = setTimeout(clear, 100);
		set(window[is_scrolling_x ? "scrollX" : "scrollY"]);
	});
	addEventListener("scroll", target_handler, { passive: true });
	var scrolling = false;
	/** @type {ReturnType<typeof setTimeout>} */
	var timeout;
	var clear = () => {
		scrolling = false;
	};
	var first = true;
	render_effect(() => {
		var latest_value = get();
		if (first) first = false;
		else if (!scrolling && latest_value != null) {
			scrolling = true;
			clearTimeout(timeout);
			if (is_scrolling_x) scrollTo(latest_value, window.scrollY);
			else scrollTo(window.scrollX, latest_value);
			timeout = setTimeout(clear, 100);
		}
	});
	effect(target_handler);
	teardown(() => {
		removeEventListener("scroll", target_handler);
	});
}
/**
* @param {'innerWidth' | 'innerHeight' | 'outerWidth' | 'outerHeight'} type
* @param {(size: number) => void} set
*/
function bind_window_size(type, set) {
	listen(window, ["resize"], () => without_reactive_context(() => set(window[type])));
}
// node_modules/svelte/src/internal/client/dom/legacy/lifecycle.js
/** @import { ComponentContextLegacy } from '#client' */
/**
* Legacy-mode only: Call `onMount` callbacks and set up `beforeUpdate`/`afterUpdate` effects
* @param {boolean} [immutable]
*/
function init(immutable = false) {
	const context = component_context;
	const callbacks = context.l.u;
	if (!callbacks) return;
	let props = () => deep_read_state(context.s);
	if (immutable) {
		let version = 0;
		let prev = {};
		const d = /* @__PURE__ */ derived(() => {
			let changed = false;
			const props = context.s;
			for (const key in props) if (props[key] !== prev[key]) {
				prev[key] = props[key];
				changed = true;
			}
			if (changed) version++;
			return version;
		});
		props = () => get(d);
	}
	if (callbacks.b.length) user_pre_effect(() => {
		observe_all(context, props);
		run_all(callbacks.b);
	});
	user_effect(() => {
		const fns = untrack(() => callbacks.m.map(run));
		return () => {
			for (const fn of fns) if (typeof fn === "function") fn();
		};
	});
	if (callbacks.a.length) user_effect(() => {
		observe_all(context, props);
		run_all(callbacks.a);
	});
}
/**
* Invoke the getter of all signals associated with a component
* so they can be registered to the effect this function is called in.
* @param {ComponentContextLegacy} context
* @param {(() => void)} props
*/
function observe_all(context, props) {
	if (context.l.s) for (const signal of context.l.s) get(signal);
	props();
}
// node_modules/svelte/src/internal/client/dom/legacy/misc.js
/**
* Under some circumstances, imports may be reactive in legacy mode. In that case,
* they should be using `reactive_import` as part of the transformation
* @param {() => any} fn
*/
function reactive_import(fn) {
	var s = source(0);
	return function() {
		if (arguments.length === 1) {
			set(s, get(s) + 1);
			return arguments[0];
		} else {
			get(s);
			return fn();
		}
	};
}
/**
* @this {any}
* @param {Record<string, unknown>} $$props
* @param {Event} event
* @returns {void}
*/
function bubble_event($$props, event) {
	var events = $$props.$$events?.[event.type];
	for (var fn of is_array(events) ? events.slice() : events == null ? [] : [events]) fn.call(this, event);
}
/**
* Used to simulate `$on` on a component instance when `compatibility.componentApi === 4`
* @param {Record<string, any>} $$props
* @param {string} event_name
* @param {Function} event_callback
*/
function add_legacy_event_listener($$props, event_name, event_callback) {
	$$props.$$events ||= {};
	$$props.$$events[event_name] ||= [];
	$$props.$$events[event_name].push(event_callback);
}
/**
* Used to simulate `$set` on a component instance when `compatibility.componentApi === 4`.
* Needs component accessors so that it can call the setter of the prop. Therefore doesn't
* work for updating props in `$$props` or `$$restProps`.
* @this {Record<string, any>}
* @param {Record<string, any>} $$new_props
*/
function update_legacy_props($$new_props) {
	for (var key in $$new_props) if (key in this) this[key] = $$new_props[key];
}
/**
* Whether or not the prop currently being read is a store binding, as in
* `<Child bind:x={$y} />`. If it is, we treat the prop as mutable even in
* runes mode, and skip `binding_property_non_reactive` validation
*/
var is_store_binding = false;
var IS_UNMOUNTED = Symbol("unmounted");
/**
* Gets the current value of a store. If the store isn't subscribed to yet, it will create a proxy
* signal that will be updated when the store is. The store references container is needed to
* track reassignments to stores and to track the correct component context.
* @template V
* @param {Store<V> | null | undefined} store
* @param {string} store_name
* @param {StoreReferencesContainer} stores
* @returns {V}
*/
function store_get(store, store_name, stores) {
	const entry = stores[store_name] ??= {
		store: null,
		source: /* @__PURE__ */ mutable_source(void 0),
		unsubscribe: noop
	};
	entry.source.label = store_name;
	if (entry.store !== store && !(IS_UNMOUNTED in stores)) {
		entry.unsubscribe();
		entry.store = store ?? null;
		if (store == null) {
			entry.source.v = void 0;
			entry.unsubscribe = noop;
		} else {
			var is_synchronous_callback = true;
			entry.unsubscribe = subscribe_to_store(store, (v) => {
				if (is_synchronous_callback) entry.source.v = v;
				else set(entry.source, v);
			});
			is_synchronous_callback = false;
		}
	}
	if (store && IS_UNMOUNTED in stores) return get$1(store);
	return get(entry.source);
}
/**
* Unsubscribe from a store if it's not the same as the one in the store references container.
* We need this in addition to `store_get` because someone could unsubscribe from a store but
* then never subscribe to the new one (if any), causing the subscription to stay open wrongfully.
* @param {Store<any> | null | undefined} store
* @param {string} store_name
* @param {StoreReferencesContainer} stores
*/
function store_unsub(store, store_name, stores) {
	/** @type {StoreReferencesContainer[''] | undefined} */
	let entry = stores[store_name];
	if (entry && entry.store !== store) {
		entry.unsubscribe();
		entry.unsubscribe = noop;
	}
	return store;
}
/**
* Sets the new value of a store and returns that value.
* @template V
* @param {Store<V>} store
* @param {V} value
* @returns {V}
*/
function store_set(store, value) {
	update_with_flag(store, value);
	return value;
}
/**
* @param {StoreReferencesContainer} stores
* @param {string} store_name
*/
function invalidate_store(stores, store_name) {
	var entry = stores[store_name];
	if (entry.store !== null) store_set(entry.store, entry.source.v);
}
/**
* Unsubscribes from all auto-subscribed stores on destroy
* @returns {[StoreReferencesContainer, ()=>void]}
*/
function setup_stores() {
	/** @type {StoreReferencesContainer} */
	const stores = {};
	function cleanup() {
		teardown(() => {
			for (var store_name in stores) stores[store_name].unsubscribe();
			define_property(stores, IS_UNMOUNTED, {
				enumerable: false,
				value: true
			});
		});
	}
	return [stores, cleanup];
}
/**
* @param {Store<V>} store
* @param {V} value
* @template V
*/
function update_with_flag(store, value) {
	try {
		store.set(value);
	} finally {}
}
/**
* Updates a store with a new value.
* @param {Store<V>} store  the store to update
* @param {any} expression  the expression that mutates the store
* @param {V} new_value  the new store value
* @template V
*/
function store_mutate(store, expression, new_value) {
	update_with_flag(store, new_value);
	return expression;
}
/**
* @param {Store<number>} store
* @param {number} store_value
* @param {1 | -1} [d]
* @returns {number}
*/
function update_store(store, store_value, d = 1) {
	update_with_flag(store, store_value + d);
	return store_value;
}
/**
* @param {Store<number>} store
* @param {number} store_value
* @param {1 | -1} [d]
* @returns {number}
*/
function update_pre_store(store, store_value, d = 1) {
	const value = store_value + d;
	update_with_flag(store, value);
	return value;
}
/**
* Called inside prop getters to communicate that the prop is a store binding
*/
function mark_store_binding() {
	is_store_binding = true;
}
/**
* Returns a tuple that indicates whether `fn()` reads a prop that is a store binding.
* Used to prevent `binding_property_non_reactive` validation false positives and
* ensure that these props are treated as mutable even in runes mode
* @template T
* @param {() => T} fn
* @returns {[T, boolean]}
*/
function capture_store_binding(fn) {
	var previous_is_store_binding = is_store_binding;
	try {
		is_store_binding = false;
		return [fn(), is_store_binding];
	} finally {
		is_store_binding = previous_is_store_binding;
	}
}
// node_modules/svelte/src/internal/client/reactivity/props.js
/** @import { Derived, Effect, Source } from './types.js' */
/**
* @param {((value?: number) => number)} fn
* @param {1 | -1} [d]
* @returns {number}
*/
function update_prop(fn, d = 1) {
	const value = fn();
	fn(value + d);
	return value;
}
/**
* @param {((value?: number) => number)} fn
* @param {1 | -1} [d]
* @returns {number}
*/
function update_pre_prop(fn, d = 1) {
	const value = fn() + d;
	fn(value);
	return value;
}
/**
* The proxy handler for rest props (i.e. `const { x, ...rest } = $props()`).
* Is passed the full `$$props` object and excludes the named props.
* @type {ProxyHandler<{ props: Record<string | symbol, unknown>, exclude: Set<string | symbol>, name?: string }>}}
*/
var rest_props_handler = {
	get(target, key) {
		if (target.exclude.has(key)) return;
		return target.props[key];
	},
	set(target, key) {
		props_rest_readonly(`${target.name}.${String(key)}`);
		return false;
	},
	getOwnPropertyDescriptor(target, key) {
		if (target.exclude.has(key)) return;
		if (key in target.props) return {
			enumerable: true,
			configurable: true,
			value: target.props[key]
		};
	},
	has(target, key) {
		if (target.exclude.has(key)) return false;
		return key in target.props;
	},
	ownKeys(target) {
		return Reflect.ownKeys(target.props).filter((key) => !target.exclude.has(key));
	}
};
/**
* @param {Record<string, unknown>} props
* @param {Set<string>} exclude
* @param {string} [name]
* @returns {Record<string, unknown>}
*/
/*#__NO_SIDE_EFFECTS__*/
function rest_props(props, exclude, name) {
	return new Proxy({
		props,
		exclude,
		name
	}, rest_props_handler);
}
/**
* The proxy handler for legacy $$restProps and $$props
* @type {ProxyHandler<{ props: Record<string | symbol, unknown>, exclude: Array<string | symbol>, special: Record<string | symbol, (v?: unknown) => unknown>, version: Source<number>, parent_effect: Effect }>}}
*/
var legacy_rest_props_handler = {
	get(target, key) {
		if (target.exclude.includes(key)) return;
		get(target.version);
		return key in target.special ? target.special[key]() : target.props[key];
	},
	set(target, key, value) {
		if (!(key in target.special)) {
			var previous_effect = active_effect;
			try {
				set_active_effect(target.parent_effect);
				/** @type {Record<string, (v?: unknown) => unknown>} */
				target.special[key] = prop({ get [key]() {
					return target.props[key];
				} }, key, 4);
			} finally {
				set_active_effect(previous_effect);
			}
		}
		target.special[key](value);
		update(target.version);
		return true;
	},
	getOwnPropertyDescriptor(target, key) {
		if (target.exclude.includes(key)) return;
		if (key in target.props) return {
			enumerable: true,
			configurable: true,
			value: target.props[key]
		};
	},
	deleteProperty(target, key) {
		if (target.exclude.includes(key)) return true;
		target.exclude.push(key);
		update(target.version);
		return true;
	},
	has(target, key) {
		if (target.exclude.includes(key)) return false;
		return key in target.props;
	},
	ownKeys(target) {
		return Reflect.ownKeys(target.props).filter((key) => !target.exclude.includes(key));
	}
};
/**
* @param {Record<string, unknown>} props
* @param {string[]} exclude
* @returns {Record<string, unknown>}
*/
function legacy_rest_props(props, exclude) {
	return new Proxy({
		props,
		exclude,
		special: {},
		version: source(0),
		parent_effect: active_effect
	}, legacy_rest_props_handler);
}
/**
* The proxy handler for spread props. Handles the incoming array of props
* that looks like `() => { dynamic: props }, { static: prop }, ..` and wraps
* them so that the whole thing is passed to the component as the `$$props` argument.
* @type {ProxyHandler<{ props: Array<Record<string | symbol, unknown> | (() => Record<string | symbol, unknown>)> }>}}
*/
var spread_props_handler = {
	get(target, key) {
		let i = target.props.length;
		while (i--) {
			let p = target.props[i];
			if (is_function(p)) p = p();
			if (typeof p === "object" && p !== null && key in p) return p[key];
		}
	},
	set(target, key, value) {
		let i = target.props.length;
		while (i--) {
			let p = target.props[i];
			if (is_function(p)) p = p();
			const desc = get_descriptor(p, key);
			if (desc && desc.set) {
				desc.set(value);
				return true;
			}
		}
		return false;
	},
	getOwnPropertyDescriptor(target, key) {
		let i = target.props.length;
		while (i--) {
			let p = target.props[i];
			if (is_function(p)) p = p();
			if (typeof p === "object" && p !== null && key in p) {
				const descriptor = get_descriptor(p, key);
				if (descriptor && !descriptor.configurable) descriptor.configurable = true;
				return descriptor;
			}
		}
	},
	has(target, key) {
		if (key === STATE_SYMBOL || key === LEGACY_PROPS) return false;
		for (let p of target.props) {
			if (is_function(p)) p = p();
			if (p != null && key in p) return true;
		}
		return false;
	},
	ownKeys(target) {
		/** @type {Array<string | symbol>} */
		const keys = [];
		for (let p of target.props) {
			if (is_function(p)) p = p();
			if (!p) continue;
			for (const key in p) if (!keys.includes(key)) keys.push(key);
			for (const key of Object.getOwnPropertySymbols(p)) if (!keys.includes(key)) keys.push(key);
		}
		return keys;
	}
};
/**
* @param {Array<Record<string, unknown> | (() => Record<string, unknown>)>} props
* @returns {any}
*/
function spread_props(...props) {
	return new Proxy({ props }, spread_props_handler);
}
/**
* This function is responsible for synchronizing a possibly bound prop with the inner component state.
* It is used whenever the compiler sees that the component writes to the prop, or when it has a default prop_value.
* @template V
* @param {Record<string, unknown>} props
* @param {string} key
* @param {number} flags
* @param {V | (() => V)} [fallback]
* @returns {(() => V | ((arg: V) => V) | ((arg: V, mutation: boolean) => V))}
*/
function prop(props, key, flags, fallback) {
	var runes = !legacy_mode_flag || (flags & 2) !== 0;
	var bindable = (flags & 8) !== 0;
	var lazy = (flags & 16) !== 0;
	var fallback_value = fallback;
	var fallback_dirty = true;
	var fallback_signal = void 0;
	var get_fallback = () => {
		if (lazy && runes) {
			fallback_signal ??= /* @__PURE__ */ derived(fallback);
			return get(fallback_signal);
		}
		if (fallback_dirty) {
			fallback_dirty = false;
			fallback_value = lazy ? untrack(fallback) : fallback;
		}
		return fallback_value;
	};
	/** @type {((v: V) => void) | undefined} */
	let setter;
	if (bindable) {
		var is_entry_props = STATE_SYMBOL in props || LEGACY_PROPS in props;
		setter = get_descriptor(props, key)?.set ?? (is_entry_props && key in props ? (v) => props[key] = v : void 0);
	}
	/** @type {V} */
	var initial_value;
	var is_store_sub = false;
	if (bindable) [initial_value, is_store_sub] = capture_store_binding(() => props[key]);
	else initial_value = props[key];
	if (initial_value === void 0 && fallback !== void 0) {
		initial_value = get_fallback();
		if (setter) {
			if (runes) props_invalid_value(key);
			setter(initial_value);
		}
	}
	/** @type {() => V} */
	var getter;
	if (runes) getter = () => {
		var value = props[key];
		if (value === void 0) return get_fallback();
		fallback_dirty = true;
		return value;
	};
	else getter = () => {
		var value = props[key];
		if (value !== void 0) fallback_value = void 0;
		return value === void 0 ? fallback_value : value;
	};
	if (runes && (flags & 4) === 0) return getter;
	if (setter) {
		var legacy_parent = props.$$legacy;
		return (function(value, mutation) {
			if (arguments.length > 0) {
				if (!runes || !mutation || legacy_parent || is_store_sub)
 /** @type {Function} */ setter(mutation ? getter() : value);
				return value;
			}
			return getter();
		});
	}
	var overridden = false;
	var d = ((flags & 1) !== 0 ? derived : derived_safe_equal)(() => {
		overridden = false;
		return getter();
	});
	d.label = key;
	if (bindable) get(d);
	var parent_effect = active_effect;
	return (function(value, mutation) {
		if (arguments.length > 0) {
			const new_value = mutation ? get(d) : runes && bindable ? proxy(value) : value;
			set(d, new_value);
			overridden = true;
			if (fallback_value !== void 0) fallback_value = new_value;
			return value;
		}
		if (is_destroying_effect && overridden || (parent_effect.f & 16384) !== 0) return d.v;
		return get(d);
	});
}
// node_modules/svelte/src/internal/client/validate.js
/** @import { Blocker } from '#client' */
/**
* @param {string} binding
* @param {Blocker[]} blockers
* @param {() => Record<string, any>} get_object
* @param {() => string} get_property
* @param {number} line
* @param {number} column
*/
function validate_binding(binding, blockers, get_object, get_property, line, column) {
	run_after_blockers(blockers, () => {
		var warned = false;
		var filename = dev_current_component_function?.[FILENAME];
		render_effect(() => {
			if (warned) return;
			var [object, is_store_sub] = capture_store_binding(get_object);
			if (is_store_sub) return;
			var property = get_property();
			var ran = false;
			var effect = render_effect(() => {
				if (ran) return;
				object[property];
			});
			ran = true;
			if (effect.deps === null) {
				var location = `${filename}:${line}:${column}`;
				binding_property_non_reactive(binding, location);
				warned = true;
			}
		});
	});
}
// node_modules/svelte/src/internal/client/dom/elements/custom-element.js
/**
* @typedef {Object} CustomElementPropDefinition
* @property {string} [attribute]
* @property {boolean} [reflect]
* @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
*/
/** @type {any} */
var SvelteElement;
if (typeof HTMLElement === "function") SvelteElement = class extends HTMLElement {
	/** The Svelte component constructor */
	$$ctor;
	/** Slots */
	$$s;
	/** @type {any} The Svelte component instance */
	$$c;
	/** Whether or not the custom element is connected */
	$$cn = false;
	/** @type {Record<string, any>} Component props data */
	$$d = {};
	/** `true` if currently in the process of reflecting component props back to attributes */
	$$r = false;
	/** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
	$$p_d = {};
	/** @type {Record<string, EventListenerOrEventListenerObject[]>} Event listeners */
	$$l = {};
	/** @type {Map<EventListenerOrEventListenerObject, Function>} Event listener unsubscribe functions */
	$$l_u = /* @__PURE__ */ new Map();
	/** @type {any} The managed render effect for reflecting attributes */
	$$me;
	/** @type {ShadowRoot | null} The ShadowRoot of the custom element */
	$$shadowRoot = null;
	/**
	* @param {*} $$componentCtor
	* @param {*} $$slots
	* @param {ShadowRootInit | undefined} shadow_root_init
	*/
	constructor($$componentCtor, $$slots, shadow_root_init) {
		super();
		this.$$ctor = $$componentCtor;
		this.$$s = $$slots;
		if (shadow_root_init) this.$$shadowRoot = this.attachShadow(shadow_root_init);
	}
	/**
	* @param {string} type
	* @param {EventListenerOrEventListenerObject} listener
	* @param {boolean | AddEventListenerOptions} [options]
	*/
	addEventListener(type, listener, options) {
		this.$$l[type] = this.$$l[type] || [];
		this.$$l[type].push(listener);
		if (this.$$c) {
			const unsub = this.$$c.$on(type, listener);
			this.$$l_u.set(listener, unsub);
		}
		super.addEventListener(type, listener, options);
	}
	/**
	* @param {string} type
	* @param {EventListenerOrEventListenerObject} listener
	* @param {boolean | AddEventListenerOptions} [options]
	*/
	removeEventListener(type, listener, options) {
		super.removeEventListener(type, listener, options);
		if (this.$$c) {
			const unsub = this.$$l_u.get(listener);
			if (unsub) {
				unsub();
				this.$$l_u.delete(listener);
			}
		}
	}
	async connectedCallback() {
		this.$$cn = true;
		if (!this.$$c) {
			await Promise.resolve();
			if (!this.$$cn || this.$$c) return;
			/** @param {string} name */
			function create_slot(name) {
				/**
				* @param {Element} anchor
				*/
				return (anchor) => {
					const slot = create_element("slot");
					if (name !== "default") slot.name = name;
					append(anchor, slot);
				};
			}
			/** @type {Record<string, any>} */
			const $$slots = {};
			const existing_slots = get_custom_elements_slots(this);
			for (const name of this.$$s) if (name in existing_slots) {
				if (name === "default" && !this.$$d.children) {
					this.$$d.children = create_slot(name);
					$$slots.default = true;
				} else $$slots[name] = create_slot(name);
			}
			for (const attribute of this.attributes) {
				const name = this.$$g_p(attribute.name);
				if (!(name in this.$$d)) this.$$d[name] = get_custom_element_value(name, attribute.value, this.$$p_d, "toProp");
			}
			for (const key in this.$$p_d) if (!(key in this.$$d) && this[key] !== void 0) {
				this.$$d[key] = this[key];
				delete this[key];
			}
			this.$$c = createClassComponent({
				component: this.$$ctor,
				target: this.$$shadowRoot || this,
				props: {
					...this.$$d,
					$$slots,
					$$host: this
				}
			});
			this.$$me = effect_root(() => {
				render_effect(() => {
					this.$$r = true;
					for (const key of object_keys(this.$$c)) {
						if (!this.$$p_d[key]?.reflect) continue;
						this.$$d[key] = this.$$c[key];
						const attribute_value = get_custom_element_value(key, this.$$d[key], this.$$p_d, "toAttribute");
						if (attribute_value == null) this.removeAttribute(this.$$p_d[key].attribute || key);
						else this.setAttribute(this.$$p_d[key].attribute || key, attribute_value);
					}
					this.$$r = false;
				});
			});
			for (const type in this.$$l) for (const listener of this.$$l[type]) {
				const unsub = this.$$c.$on(type, listener);
				this.$$l_u.set(listener, unsub);
			}
			this.$$l = {};
		}
	}
	/**
	* @param {string} attr
	* @param {string} _oldValue
	* @param {string} newValue
	*/
	attributeChangedCallback(attr, _oldValue, newValue) {
		if (this.$$r) return;
		attr = this.$$g_p(attr);
		this.$$d[attr] = get_custom_element_value(attr, newValue, this.$$p_d, "toProp");
		this.$$c?.$set({ [attr]: this.$$d[attr] });
	}
	disconnectedCallback() {
		this.$$cn = false;
		Promise.resolve().then(() => {
			if (!this.$$cn && this.$$c) {
				this.$$c.$destroy();
				this.$$me();
				this.$$c = void 0;
			}
		});
	}
	/**
	* @param {string} attribute_name
	*/
	$$g_p(attribute_name) {
		return object_keys(this.$$p_d).find((key) => this.$$p_d[key].attribute === attribute_name || !this.$$p_d[key].attribute && key.toLowerCase() === attribute_name) || attribute_name;
	}
};
/**
* @param {string} prop
* @param {any} value
* @param {Record<string, CustomElementPropDefinition>} props_definition
* @param {'toAttribute' | 'toProp'} [transform]
*/
function get_custom_element_value(prop, value, props_definition, transform) {
	const type = props_definition[prop]?.type;
	value = type === "Boolean" && typeof value !== "boolean" ? value != null : value;
	if (!transform || !props_definition[prop]) return value;
	else if (transform === "toAttribute") switch (type) {
		case "Object":
		case "Array": return value == null ? null : JSON.stringify(value);
		case "Boolean": return value ? "" : null;
		case "Number": return value == null ? null : value;
		default: return value;
	}
	else switch (type) {
		case "Object":
		case "Array": return value && JSON.parse(value);
		case "Boolean": return value;
		case "Number": return value != null ? +value : value;
		default: return value;
	}
}
/**
* @param {HTMLElement} element
*/
function get_custom_elements_slots(element) {
	/** @type {Record<string, true>} */
	const result = {};
	element.childNodes.forEach((node) => {
		result[node.slot || "default"] = true;
	});
	return result;
}
/**
* @internal
*
* Turn a Svelte component into a custom element.
* @param {any} Component  A Svelte component function
* @param {Record<string, CustomElementPropDefinition>} props_definition  The props to observe
* @param {string[]} slots  The slots to create
* @param {string[]} exports  Explicitly exported values, other than props
* @param {ShadowRootInit | undefined} shadow_root_init  Options passed to shadow DOM constructor
* @param {(ce: new () => HTMLElement) => new () => HTMLElement} [extend]
*/
function create_custom_element(Component, props_definition, slots, exports, shadow_root_init, extend) {
	let Class = class extends SvelteElement {
		constructor() {
			super(Component, slots, shadow_root_init);
			this.$$p_d = props_definition;
		}
		static get observedAttributes() {
			return object_keys(props_definition).map((key) => (props_definition[key].attribute || key).toLowerCase());
		}
	};
	object_keys(props_definition).forEach((prop) => {
		define_property(Class.prototype, prop, {
			get() {
				return this.$$c && prop in this.$$c ? this.$$c[prop] : this.$$d[prop];
			},
			set(value) {
				value = get_custom_element_value(prop, value, props_definition);
				this.$$d[prop] = value;
				var component = this.$$c;
				if (component) {
					if (get_descriptor(component, prop)?.get) component[prop] = value;
					else component.$set({ [prop]: value });
				}
			}
		});
	});
	exports.forEach((property) => {
		define_property(Class.prototype, property, { get() {
			return this.$$c?.[property];
		} });
	});
	if (extend) Class = extend(Class);
	Component.element = Class;
	return Class;
}
// node_modules/svelte/src/internal/client/dev/console-log.js
/**
* @param {string} method
* @param  {...any} objects
*/
function log_if_contains_state(method, ...objects) {
	untrack(() => {
		try {
			let has_state = false;
			const transformed = [];
			for (const obj of objects) if (obj && typeof obj === "object" && STATE_SYMBOL in obj) {
				transformed.push(snapshot(obj, true));
				has_state = true;
			} else transformed.push(obj);
			if (has_state) {
				console_log_state(method);
				console.log("%c[snapshot]", "color: grey", ...transformed);
			}
		} catch {}
	});
	return objects;
}
// node_modules/svelte/src/internal/client/hydratable.js
/**
* @template T
* @param {string} key
* @param {() => T} fn
* @returns {T}
*/
function hydratable(key, fn) {
	if (!async_mode_flag) experimental_async_required("hydratable");
	if (hydrating) {
		const store = window.__svelte?.h;
		if (store?.has(key)) return store.get(key);
		hydratable_missing_but_required(key);
	}
	return fn();
}
{
	/**
	* @param {string} rune
	*/
	function throw_rune_error(rune) {
		if (!(rune in globalThis)) {
			/** @type {any} */
			let value;
			Object.defineProperty(globalThis, rune, {
				configurable: true,
				get: () => {
					if (value !== void 0) return value;
					rune_outside_svelte(rune);
				},
				set: (v) => {
					value = v;
				}
			});
		}
	}
	throw_rune_error("$state");
	throw_rune_error("$effect");
	throw_rune_error("$derived");
	throw_rune_error("$inspect");
	throw_rune_error("$props");
	throw_rune_error("$bindable");
}
/**
* Returns an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that aborts when the current [derived](https://svelte.dev/docs/svelte/$derived) or [effect](https://svelte.dev/docs/svelte/$effect) re-runs or is destroyed.
*
* Must be called while a derived or effect is running.
*
* ```svelte
* <script>
* 	import { getAbortSignal } from 'svelte';
*
* 	let { id } = $props();
*
* 	async function getData(id) {
* 		const response = await fetch(`/items/${id}`, {
* 			signal: getAbortSignal()
* 		});
*
* 		return await response.json();
* 	}
*
* 	const data = $derived(await getData(id));
* <\/script>
* ```
*/
function getAbortSignal() {
	if (active_reaction === null) get_abort_signal_outside_reaction();
	return (active_reaction.ac ??= new AbortController()).signal;
}
/**
* `onMount`, like [`$effect`](https://svelte.dev/docs/svelte/$effect), schedules a function to run as soon as the component has been mounted to the DOM.
* Unlike `$effect`, the provided function only runs once.
*
* It must be called during the component's initialisation (but doesn't need to live _inside_ the component;
* it can be called from an external module). If a function is returned _synchronously_ from `onMount`,
* it will be called when the component is unmounted.
*
* `onMount` functions do not run during [server-side rendering](https://svelte.dev/docs/svelte/svelte-server#render).
*
* @template T
* @param {() => NotFunction<T> | Promise<NotFunction<T>> | (() => any)} fn
* @returns {void}
*/
function onMount(fn) {
	if (component_context === null) lifecycle_outside_component("onMount");
	if (legacy_mode_flag && component_context.l !== null) init_update_callbacks(component_context).m.push(fn);
	else user_effect(() => {
		const cleanup = untrack(fn);
		if (typeof cleanup === "function") return cleanup;
	});
}
/**
* Schedules a callback to run immediately before the component is unmounted.
*
* Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
* only one that runs inside a server-side component.
*
* @param {() => any} fn
* @returns {void}
*/
function onDestroy(fn) {
	if (component_context === null) lifecycle_outside_component("onDestroy");
	onMount(() => () => untrack(fn));
}
/**
* @template [T=any]
* @param {string} type
* @param {T} [detail]
* @param {any}params_0
* @returns {CustomEvent<T>}
*/
function create_custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
	return new CustomEvent(type, {
		detail,
		bubbles,
		cancelable
	});
}
/**
* Creates an event dispatcher that can be used to dispatch [component events](https://svelte.dev/docs/svelte/legacy-on#Component-events).
* Event dispatchers are functions that can take two arguments: `name` and `detail`.
*
* Component events created with `createEventDispatcher` create a
* [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
* These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
* The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
* property and can contain any type of data.
*
* The event dispatcher can be typed to narrow the allowed event names and the type of the `detail` argument:
* ```ts
* const dispatch = createEventDispatcher<{
*  loaded: null; // does not take a detail argument
*  change: string; // takes a detail argument of type string, which is required
*  optional: number | null; // takes an optional detail argument of type number
* }>();
* ```
*
* @deprecated Use callback props and/or the `$host()` rune instead — see [migration guide](https://svelte.dev/docs/svelte/v5-migration-guide#Event-changes-Component-events)
* @template {Record<string, any>} [EventMap = any]
* @returns {EventDispatcher<EventMap>}
*/
function createEventDispatcher() {
	const active_component_context = component_context;
	if (active_component_context === null) lifecycle_outside_component("createEventDispatcher");
	/**
	* @param [detail]
	* @param [options]
	*/
	return (type, detail, options) => {
		const events = active_component_context.s.$$events?.[type];
		if (events) {
			const callbacks = is_array(events) ? events.slice() : [events];
			const event = create_custom_event(type, detail, options);
			for (const fn of callbacks) fn.call(active_component_context.x, event);
			return !event.defaultPrevented;
		}
		return true;
	};
}
/**
* Schedules a callback to run immediately before the component is updated after any state change.
*
* The first time the callback runs will be before the initial `onMount`.
*
* In runes mode use `$effect.pre` instead.
*
* @deprecated Use [`$effect.pre`](https://svelte.dev/docs/svelte/$effect#$effect.pre) instead
* @param {() => void} fn
* @returns {void}
*/
function beforeUpdate(fn) {
	if (component_context === null) lifecycle_outside_component("beforeUpdate");
	if (component_context.l === null) lifecycle_legacy_only("beforeUpdate");
	init_update_callbacks(component_context).b.push(fn);
}
/**
* Schedules a callback to run immediately after the component has been updated.
*
* The first time the callback runs will be after the initial `onMount`.
*
* In runes mode use `$effect` instead.
*
* @deprecated Use [`$effect`](https://svelte.dev/docs/svelte/$effect) instead
* @param {() => void} fn
* @returns {void}
*/
function afterUpdate(fn) {
	if (component_context === null) lifecycle_outside_component("afterUpdate");
	if (component_context.l === null) lifecycle_legacy_only("afterUpdate");
	init_update_callbacks(component_context).a.push(fn);
}
/**
* Legacy-mode: Init callbacks object for onMount/beforeUpdate/afterUpdate
* @param {ComponentContext} context
*/
function init_update_callbacks(context) {
	var l = context.l;
	return l.u ??= {
		a: [],
		b: [],
		m: []
	};
}
export { bind_files as $, inspect as $t, init as A, animation as At, bind_online as B, validate_store as Bt, store_unsub as C, attr as Ct, bubble_event as D, append_styles$1 as Dt, add_legacy_event_listener as E, action as Et, bind_property as F, createRawSnippet as Ft, bind_paused as G, each as Gt, bind_current_time as H, sanitize_slots as Ht, bind_this as I, snippet as It, bind_ready_state as J, key as Jt, bind_playback_rate as K, index as Kt, bind_element_size as L, wrap_snippet as Lt, bind_window_size as M, loop as Mt, bind_content_editable as N, raf as Nt, reactive_import as O, head as Ot, bind_focused as P, component as Pt, bind_checked as Q, async as Qt, bind_resize_observer as R, prevent_snippet_stringification as Rt, store_set as S, set_class as St, update_store as T, attach as Tt, bind_ended as U, slot as Ut, bind_buffered as V, validate_void_dynamic_element as Vt, bind_muted as W, html as Wt, bind_seeking as X, await_block as Xt, bind_seekable as Y, if_block as Yt, bind_volume as Z, validate_snippet_args as Zt, invalidate_store as _, init_select as _t, onDestroy as a, cleanup_styles as an, CLASS as at, store_get as b, set_selected as bt, log_if_contains_state as c, createAttachmentKey as cn, remove_input_defaults as ct, legacy_rest_props as d, set_custom_element_data as dt, check_target as en, bind_group as et, prop as f, set_default_checked as ft, update_prop as g, bind_select_value as gt, update_pre_prop as h, set_xlink_attribute as ht, getAbortSignal as i, add_locations as in, selectedcontent as it, bind_window_scroll as j, transition as jt, update_legacy_props as k, element as kt, create_custom_element as l, fromAction as ln, set_attribute as lt, spread_props as m, set_value as mt, beforeUpdate as n, create_ownership_validator as nn, bind_active_element as nt, onMount as o, assign as on, STYLE as ot, rest_props as p, set_default_value as pt, bind_played as q, css_props as qt, createEventDispatcher as r, hmr as rn, customizable_select as rt, hydratable as s, assign_async as sn, attribute_effect as st, afterUpdate as t, legacy_api as tn, bind_value as tt, validate_binding as u, set_checked as ut, mark_store_binding as v, select_option as vt, update_pre_store as w, clsx as wt, store_mutate as x, set_style as xt, setup_stores as y, set_default_select_value as yt, bind_prop as z, validate_dynamic_element_tag as zt };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgtY2xpZW50LTI4TmprYXpBLmpzIiwibmFtZXMiOlsiYXBwZW5kX3N0eWxlcyIsIl9jbHN4Iiwidy5zZWxlY3RfbXVsdGlwbGVfaW52YWxpZF92YWx1ZSIsImdldF9zdG9yZSJdLCJzb3VyY2VzIjpbIi4uLy4uL3N2ZWx0ZS9zcmMvYXR0YWNobWVudHMvaW5kZXguanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kZXYvYXNzaWduLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZGV2L2Nzcy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2Rldi9lbGVtZW50cy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2Rldi9obXIuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kZXYvb3duZXJzaGlwLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZGV2L2xlZ2FjeS5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2Rldi9pbnNwZWN0LmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL2Jsb2Nrcy9hc3luYy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2Rldi92YWxpZGF0aW9uLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL2Jsb2Nrcy9icmFuY2hlcy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9ibG9ja3MvYXdhaXQuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vYmxvY2tzL2lmLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL2Jsb2Nrcy9rZXkuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vYmxvY2tzL2Nzcy1wcm9wcy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9ibG9ja3MvZWFjaC5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9ibG9ja3MvaHRtbC5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9ibG9ja3Mvc2xvdC5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvc2hhcmVkL3ZhbGlkYXRlLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL2Jsb2Nrcy9zbmlwcGV0LmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL2Jsb2Nrcy9zdmVsdGUtY29tcG9uZW50LmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvdGltaW5nLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvbG9vcC5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9lbGVtZW50cy90cmFuc2l0aW9ucy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9ibG9ja3Mvc3ZlbHRlLWVsZW1lbnQuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vYmxvY2tzL3N2ZWx0ZS1oZWFkLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL2Nzcy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9lbGVtZW50cy9hY3Rpb25zLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL2VsZW1lbnRzL2F0dGFjaG1lbnRzLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9lc2NhcGluZy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvc2hhcmVkL2F0dHJpYnV0ZXMuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vZWxlbWVudHMvY2xhc3MuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vZWxlbWVudHMvc3R5bGUuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vZWxlbWVudHMvYmluZGluZ3Mvc2VsZWN0LmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL2VsZW1lbnRzL2F0dHJpYnV0ZXMuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vZWxlbWVudHMvY3VzdG9taXphYmxlLXNlbGVjdC5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9lbGVtZW50cy9iaW5kaW5ncy9kb2N1bWVudC5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9lbGVtZW50cy9iaW5kaW5ncy9pbnB1dC5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9lbGVtZW50cy9iaW5kaW5ncy9tZWRpYS5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9lbGVtZW50cy9iaW5kaW5ncy9uYXZpZ2F0b3IuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vZWxlbWVudHMvYmluZGluZ3MvcHJvcHMuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vZWxlbWVudHMvYmluZGluZ3Mvc2l6ZS5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9lbGVtZW50cy9iaW5kaW5ncy90aGlzLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL2VsZW1lbnRzL2JpbmRpbmdzL3VuaXZlcnNhbC5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9lbGVtZW50cy9iaW5kaW5ncy93aW5kb3cuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vbGVnYWN5L2xpZmVjeWNsZS5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9sZWdhY3kvbWlzYy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L3JlYWN0aXZpdHkvc3RvcmUuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9yZWFjdGl2aXR5L3Byb3BzLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvdmFsaWRhdGUuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vZWxlbWVudHMvY3VzdG9tLWVsZW1lbnQuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kZXYvY29uc29sZS1sb2cuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9oeWRyYXRhYmxlLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbmRleC1jbGllbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBpbXBvcnQgeyBBY3Rpb24sIEFjdGlvblJldHVybiB9IGZyb20gJy4uL2FjdGlvbi9wdWJsaWMnICovXG4vKiogQGltcG9ydCB7IEF0dGFjaG1lbnQgfSBmcm9tICcuL3B1YmxpYycgKi9cbmltcG9ydCB7IG5vb3AsIHJlbmRlcl9lZmZlY3QgfSBmcm9tICdzdmVsdGUvaW50ZXJuYWwvY2xpZW50JztcbmltcG9ydCB7IEFUVEFDSE1FTlRfS0VZIH0gZnJvbSAnLi4vY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IHVudHJhY2sgfSBmcm9tICcuLi9pbmRleC1jbGllbnQuanMnO1xuaW1wb3J0IHsgdGVhcmRvd24gfSBmcm9tICcuLi9pbnRlcm5hbC9jbGllbnQvcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcblxuLyoqXG4gKiBDcmVhdGVzIGFuIG9iamVjdCBrZXkgdGhhdCB3aWxsIGJlIHJlY29nbmlzZWQgYXMgYW4gYXR0YWNobWVudCB3aGVuIHRoZSBvYmplY3QgaXMgc3ByZWFkIG9udG8gYW4gZWxlbWVudCxcbiAqIGFzIGEgcHJvZ3JhbW1hdGljIGFsdGVybmF0aXZlIHRvIHVzaW5nIGB7QGF0dGFjaCAuLi59YC4gVGhpcyBjYW4gYmUgdXNlZnVsIGZvciBsaWJyYXJ5IGF1dGhvcnMsIHRob3VnaFxuICogaXMgZ2VuZXJhbGx5IG5vdCBuZWVkZWQgd2hlbiBidWlsZGluZyBhbiBhcHAuXG4gKlxuICogYGBgc3ZlbHRlXG4gKiA8c2NyaXB0PlxuICogXHRpbXBvcnQgeyBjcmVhdGVBdHRhY2htZW50S2V5IH0gZnJvbSAnc3ZlbHRlL2F0dGFjaG1lbnRzJztcbiAqXG4gKiBcdGNvbnN0IHByb3BzID0ge1xuICogXHRcdGNsYXNzOiAnY29vbCcsXG4gKiBcdFx0b25jbGljazogKCkgPT4gYWxlcnQoJ2NsaWNrZWQnKSxcbiAqIFx0XHRbY3JlYXRlQXR0YWNobWVudEtleSgpXTogKG5vZGUpID0+IHtcbiAqIFx0XHRcdG5vZGUudGV4dENvbnRlbnQgPSAnYXR0YWNoZWQhJztcbiAqIFx0XHR9XG4gKiBcdH07XG4gKiA8L3NjcmlwdD5cbiAqXG4gKiA8YnV0dG9uIHsuLi5wcm9wc30+Y2xpY2sgbWU8L2J1dHRvbj5cbiAqIGBgYFxuICogQHNpbmNlIDUuMjlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUF0dGFjaG1lbnRLZXkoKSB7XG5cdHJldHVybiBTeW1ib2woQVRUQUNITUVOVF9LRVkpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGFuIFthY3Rpb25dKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL3N2ZWx0ZS91c2UpIGludG8gYW4gW2F0dGFjaG1lbnRdKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL3N2ZWx0ZS9AYXR0YWNoKSBrZWVwaW5nIHRoZSBzYW1lIGJlaGF2aW9yLlxuICogSXQncyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gc3RhcnQgdXNpbmcgYXR0YWNobWVudHMgb24gY29tcG9uZW50cyBidXQgeW91IGhhdmUgYWN0aW9ucyBwcm92aWRlZCBieSBhIGxpYnJhcnkuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByb3ZpZGVkLCBtdXN0IGJlIGEgZnVuY3Rpb24gdGhhdCBfcmV0dXJuc18gdGhlIGFyZ3VtZW50IHRvIHRoZVxuICogYWN0aW9uIGZ1bmN0aW9uLCBub3QgdGhlIGFyZ3VtZW50IGl0c2VsZi5cbiAqXG4gKiBgYGBzdmVsdGVcbiAqIDwhLS0gd2l0aCBhbiBhY3Rpb24gLS0+XG4gKiA8ZGl2IHVzZTpmb289e2Jhcn0+Li4uPC9kaXY+XG4gKlxuICogPCEtLSB3aXRoIGFuIGF0dGFjaG1lbnQgLS0+XG4gKiA8ZGl2IHtAYXR0YWNoIGZyb21BY3Rpb24oZm9vLCAoKSA9PiBiYXIpfT4uLi48L2Rpdj5cbiAqIGBgYFxuICogQHRlbXBsYXRlIHtFdmVudFRhcmdldH0gRVxuICogQHRlbXBsYXRlIHt1bmtub3dufSBUXG4gKiBAb3ZlcmxvYWRcbiAqIEBwYXJhbSB7QWN0aW9uPEUsIFQ+IHwgKChlbGVtZW50OiBFLCBhcmc6IFQpID0+IHZvaWQgfCBBY3Rpb25SZXR1cm48VD4pfSBhY3Rpb24gVGhlIGFjdGlvbiBmdW5jdGlvblxuICogQHBhcmFtIHsoKSA9PiBUfSBmbiBBIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgYXJndW1lbnQgZm9yIHRoZSBhY3Rpb25cbiAqIEByZXR1cm5zIHtBdHRhY2htZW50PEU+fVxuICovXG4vKipcbiAqIENvbnZlcnRzIGFuIFthY3Rpb25dKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL3N2ZWx0ZS91c2UpIGludG8gYW4gW2F0dGFjaG1lbnRdKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL3N2ZWx0ZS9AYXR0YWNoKSBrZWVwaW5nIHRoZSBzYW1lIGJlaGF2aW9yLlxuICogSXQncyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gc3RhcnQgdXNpbmcgYXR0YWNobWVudHMgb24gY29tcG9uZW50cyBidXQgeW91IGhhdmUgYWN0aW9ucyBwcm92aWRlZCBieSBhIGxpYnJhcnkuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByb3ZpZGVkLCBtdXN0IGJlIGEgZnVuY3Rpb24gdGhhdCBfcmV0dXJuc18gdGhlIGFyZ3VtZW50IHRvIHRoZVxuICogYWN0aW9uIGZ1bmN0aW9uLCBub3QgdGhlIGFyZ3VtZW50IGl0c2VsZi5cbiAqXG4gKiBgYGBzdmVsdGVcbiAqIDwhLS0gd2l0aCBhbiBhY3Rpb24gLS0+XG4gKiA8ZGl2IHVzZTpmb289e2Jhcn0+Li4uPC9kaXY+XG4gKlxuICogPCEtLSB3aXRoIGFuIGF0dGFjaG1lbnQgLS0+XG4gKiA8ZGl2IHtAYXR0YWNoIGZyb21BY3Rpb24oZm9vLCAoKSA9PiBiYXIpfT4uLi48L2Rpdj5cbiAqIGBgYFxuICogQHRlbXBsYXRlIHtFdmVudFRhcmdldH0gRVxuICogQG92ZXJsb2FkXG4gKiBAcGFyYW0ge0FjdGlvbjxFLCB2b2lkPiB8ICgoZWxlbWVudDogRSkgPT4gdm9pZCB8IEFjdGlvblJldHVybjx2b2lkPil9IGFjdGlvbiBUaGUgYWN0aW9uIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7QXR0YWNobWVudDxFPn1cbiAqL1xuLyoqXG4gKiBDb252ZXJ0cyBhbiBbYWN0aW9uXShodHRwczovL3N2ZWx0ZS5kZXYvZG9jcy9zdmVsdGUvdXNlKSBpbnRvIGFuIFthdHRhY2htZW50XShodHRwczovL3N2ZWx0ZS5kZXYvZG9jcy9zdmVsdGUvQGF0dGFjaCkga2VlcGluZyB0aGUgc2FtZSBiZWhhdmlvci5cbiAqIEl0J3MgdXNlZnVsIGlmIHlvdSB3YW50IHRvIHN0YXJ0IHVzaW5nIGF0dGFjaG1lbnRzIG9uIGNvbXBvbmVudHMgYnV0IHlvdSBoYXZlIGFjdGlvbnMgcHJvdmlkZWQgYnkgYSBsaWJyYXJ5LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcm92aWRlZCwgbXVzdCBiZSBhIGZ1bmN0aW9uIHRoYXQgX3JldHVybnNfIHRoZSBhcmd1bWVudCB0byB0aGVcbiAqIGFjdGlvbiBmdW5jdGlvbiwgbm90IHRoZSBhcmd1bWVudCBpdHNlbGYuXG4gKlxuICogYGBgc3ZlbHRlXG4gKiA8IS0tIHdpdGggYW4gYWN0aW9uIC0tPlxuICogPGRpdiB1c2U6Zm9vPXtiYXJ9Pi4uLjwvZGl2PlxuICpcbiAqIDwhLS0gd2l0aCBhbiBhdHRhY2htZW50IC0tPlxuICogPGRpdiB7QGF0dGFjaCBmcm9tQWN0aW9uKGZvbywgKCkgPT4gYmFyKX0+Li4uPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBAdGVtcGxhdGUge0V2ZW50VGFyZ2V0fSBFXG4gKiBAdGVtcGxhdGUge3Vua25vd259IFRcbiAqIEBwYXJhbSB7QWN0aW9uPEUsIFQ+IHwgKChlbGVtZW50OiBFLCBhcmc6IFQpID0+IHZvaWQgfCBBY3Rpb25SZXR1cm48VD4pfSBhY3Rpb24gVGhlIGFjdGlvbiBmdW5jdGlvblxuICogQHBhcmFtIHsoKSA9PiBUfSBmbiBBIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgYXJndW1lbnQgZm9yIHRoZSBhY3Rpb25cbiAqIEByZXR1cm5zIHtBdHRhY2htZW50PEU+fVxuICogQHNpbmNlIDUuMzJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21BY3Rpb24oYWN0aW9uLCBmbiA9IC8qKiBAdHlwZSB7KCkgPT4gVH0gKi8gKG5vb3ApKSB7XG5cdHJldHVybiAoZWxlbWVudCkgPT4ge1xuXHRcdGNvbnN0IHsgdXBkYXRlLCBkZXN0cm95IH0gPSB1bnRyYWNrKCgpID0+IGFjdGlvbihlbGVtZW50LCBmbigpKSA/PyB7fSk7XG5cblx0XHRpZiAodXBkYXRlKSB7XG5cdFx0XHR2YXIgcmFuID0gZmFsc2U7XG5cdFx0XHRyZW5kZXJfZWZmZWN0KCgpID0+IHtcblx0XHRcdFx0Y29uc3QgYXJnID0gZm4oKTtcblx0XHRcdFx0aWYgKHJhbikgdXBkYXRlKGFyZyk7XG5cdFx0XHR9KTtcblx0XHRcdHJhbiA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKGRlc3Ryb3kpIHtcblx0XHRcdHRlYXJkb3duKGRlc3Ryb3kpO1xuXHRcdH1cblx0fTtcbn1cbiIsImltcG9ydCB7IFNUQVRFX1NZTUJPTCB9IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcbmltcG9ydCB7IHNhbml0aXplX2xvY2F0aW9uIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMuanMnO1xuaW1wb3J0IHsgdW50cmFjayB9IGZyb20gJy4uL3J1bnRpbWUuanMnO1xuaW1wb3J0ICogYXMgdyBmcm9tICcuLi93YXJuaW5ncy5qcyc7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7YW55fSBhXG4gKiBAcGFyYW0ge2FueX0gYlxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gKiBAcGFyYW0ge3N0cmluZ30gbG9jYXRpb25cbiAqL1xuZnVuY3Rpb24gY29tcGFyZShhLCBiLCBwcm9wZXJ0eSwgbG9jYXRpb24pIHtcblx0aWYgKGEgIT09IGIgJiYgdHlwZW9mIGIgPT09ICdvYmplY3QnICYmIFNUQVRFX1NZTUJPTCBpbiBiKSB7XG5cdFx0dy5hc3NpZ25tZW50X3ZhbHVlX3N0YWxlKHByb3BlcnR5LCAvKiogQHR5cGUge3N0cmluZ30gKi8gKHNhbml0aXplX2xvY2F0aW9uKGxvY2F0aW9uKSkpO1xuXHR9XG5cblx0cmV0dXJuIGE7XG59XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5XG4gKiBAcGFyYW0ge3N0cmluZ30gb3BlcmF0b3JcbiAqIEBwYXJhbSB7YW55fSByaHNcbiAqIEBwYXJhbSB7c3RyaW5nfSBsb2NhdGlvblxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduKG9iamVjdCwgcHJvcGVydHksIG9wZXJhdG9yLCByaHMsIGxvY2F0aW9uKSB7XG5cdHJldHVybiBjb21wYXJlKFxuXHRcdG9wZXJhdG9yID09PSAnPSdcblx0XHRcdD8gKG9iamVjdFtwcm9wZXJ0eV0gPSByaHMpXG5cdFx0XHQ6IG9wZXJhdG9yID09PSAnJiY9J1xuXHRcdFx0XHQ/IChvYmplY3RbcHJvcGVydHldICYmPSByaHMoKSlcblx0XHRcdFx0OiBvcGVyYXRvciA9PT0gJ3x8PSdcblx0XHRcdFx0XHQ/IChvYmplY3RbcHJvcGVydHldIHx8PSByaHMoKSlcblx0XHRcdFx0XHQ6IG9wZXJhdG9yID09PSAnPz89J1xuXHRcdFx0XHRcdFx0PyAob2JqZWN0W3Byb3BlcnR5XSA/Pz0gcmhzKCkpXG5cdFx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0dW50cmFjaygoKSA9PiBvYmplY3RbcHJvcGVydHldKSxcblx0XHRwcm9wZXJ0eSxcblx0XHRsb2NhdGlvblxuXHQpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICogQHBhcmFtIHtzdHJpbmd9IG9wZXJhdG9yXG4gKiBAcGFyYW0ge2FueX0gcmhzXG4gKiBAcGFyYW0ge3N0cmluZ30gbG9jYXRpb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFzc2lnbl9hc3luYyhvYmplY3QsIHByb3BlcnR5LCBvcGVyYXRvciwgcmhzLCBsb2NhdGlvbikge1xuXHRyZXR1cm4gY29tcGFyZShcblx0XHRvcGVyYXRvciA9PT0gJz0nXG5cdFx0XHQ/IChvYmplY3RbcHJvcGVydHldID0gYXdhaXQgcmhzKVxuXHRcdFx0OiBvcGVyYXRvciA9PT0gJyYmPSdcblx0XHRcdFx0PyAob2JqZWN0W3Byb3BlcnR5XSAmJj0gYXdhaXQgcmhzKCkpXG5cdFx0XHRcdDogb3BlcmF0b3IgPT09ICd8fD0nXG5cdFx0XHRcdFx0PyAob2JqZWN0W3Byb3BlcnR5XSB8fD0gYXdhaXQgcmhzKCkpXG5cdFx0XHRcdFx0OiBvcGVyYXRvciA9PT0gJz8/PSdcblx0XHRcdFx0XHRcdD8gKG9iamVjdFtwcm9wZXJ0eV0gPz89IGF3YWl0IHJocygpKVxuXHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdHVudHJhY2soKCkgPT4gb2JqZWN0W3Byb3BlcnR5XSksXG5cdFx0cHJvcGVydHksXG5cdFx0bG9jYXRpb25cblx0KTtcbn1cbiIsIi8qKiBAdHlwZSB7TWFwPFN0cmluZywgU2V0PEhUTUxTdHlsZUVsZW1lbnQ+Pn0gKi9cbnZhciBhbGxfc3R5bGVzID0gbmV3IE1hcCgpO1xuXG4vKipcbiAqIEBwYXJhbSB7U3RyaW5nfSBoYXNoXG4gKiBAcGFyYW0ge0hUTUxTdHlsZUVsZW1lbnR9IHN0eWxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlcl9zdHlsZShoYXNoLCBzdHlsZSkge1xuXHR2YXIgc3R5bGVzID0gYWxsX3N0eWxlcy5nZXQoaGFzaCk7XG5cblx0aWYgKCFzdHlsZXMpIHtcblx0XHRzdHlsZXMgPSBuZXcgU2V0KCk7XG5cdFx0YWxsX3N0eWxlcy5zZXQoaGFzaCwgc3R5bGVzKTtcblx0fVxuXG5cdHN0eWxlcy5hZGQoc3R5bGUpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7U3RyaW5nfSBoYXNoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbnVwX3N0eWxlcyhoYXNoKSB7XG5cdHZhciBzdHlsZXMgPSBhbGxfc3R5bGVzLmdldChoYXNoKTtcblx0aWYgKCFzdHlsZXMpIHJldHVybjtcblxuXHRmb3IgKGNvbnN0IHN0eWxlIG9mIHN0eWxlcykge1xuXHRcdHN0eWxlLnJlbW92ZSgpO1xuXHR9XG5cblx0YWxsX3N0eWxlcy5kZWxldGUoaGFzaCk7XG59XG4iLCIvKiogQGltcG9ydCB7IFNvdXJjZUxvY2F0aW9uIH0gZnJvbSAnI2NsaWVudCcgKi9cbmltcG9ydCB7IENPTU1FTlRfTk9ERSwgRE9DVU1FTlRfRlJBR01FTlRfTk9ERSwgRUxFTUVOVF9OT0RFIH0gZnJvbSAnI2NsaWVudC9jb25zdGFudHMnO1xuaW1wb3J0IHsgSFlEUkFUSU9OX0VORCwgSFlEUkFUSU9OX1NUQVJUIH0gZnJvbSAnLi4vLi4vLi4vY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IGh5ZHJhdGluZyB9IGZyb20gJy4uL2RvbS9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgZGV2X3N0YWNrIH0gZnJvbSAnLi4vY29udGV4dC5qcyc7XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IGZuXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcbiAqIEBwYXJhbSB7U291cmNlTG9jYXRpb25bXX0gbG9jYXRpb25zXG4gKiBAcmV0dXJucyB7YW55fVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkX2xvY2F0aW9ucyhmbiwgZmlsZW5hbWUsIGxvY2F0aW9ucykge1xuXHRyZXR1cm4gKC8qKiBAdHlwZSB7YW55W119ICovIC4uLmFyZ3MpID0+IHtcblx0XHRjb25zdCBkb20gPSBmbiguLi5hcmdzKTtcblxuXHRcdHZhciBub2RlID0gaHlkcmF0aW5nID8gZG9tIDogZG9tLm5vZGVUeXBlID09PSBET0NVTUVOVF9GUkFHTUVOVF9OT0RFID8gZG9tLmZpcnN0Q2hpbGQgOiBkb207XG5cdFx0YXNzaWduX2xvY2F0aW9ucyhub2RlLCBmaWxlbmFtZSwgbG9jYXRpb25zKTtcblxuXHRcdHJldHVybiBkb207XG5cdH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcbiAqIEBwYXJhbSB7U291cmNlTG9jYXRpb259IGxvY2F0aW9uXG4gKi9cbmZ1bmN0aW9uIGFzc2lnbl9sb2NhdGlvbihlbGVtZW50LCBmaWxlbmFtZSwgbG9jYXRpb24pIHtcblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRlbGVtZW50Ll9fc3ZlbHRlX21ldGEgPSB7XG5cdFx0cGFyZW50OiBkZXZfc3RhY2ssXG5cdFx0bG9jOiB7IGZpbGU6IGZpbGVuYW1lLCBsaW5lOiBsb2NhdGlvblswXSwgY29sdW1uOiBsb2NhdGlvblsxXSB9XG5cdH07XG5cblx0aWYgKGxvY2F0aW9uWzJdKSB7XG5cdFx0YXNzaWduX2xvY2F0aW9ucyhlbGVtZW50LmZpcnN0Q2hpbGQsIGZpbGVuYW1lLCBsb2NhdGlvblsyXSk7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge05vZGUgfCBudWxsfSBub2RlXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcbiAqIEBwYXJhbSB7U291cmNlTG9jYXRpb25bXX0gbG9jYXRpb25zXG4gKi9cbmZ1bmN0aW9uIGFzc2lnbl9sb2NhdGlvbnMobm9kZSwgZmlsZW5hbWUsIGxvY2F0aW9ucykge1xuXHR2YXIgaSA9IDA7XG5cdHZhciBkZXB0aCA9IDA7XG5cblx0d2hpbGUgKG5vZGUgJiYgaSA8IGxvY2F0aW9ucy5sZW5ndGgpIHtcblx0XHRpZiAoaHlkcmF0aW5nICYmIG5vZGUubm9kZVR5cGUgPT09IENPTU1FTlRfTk9ERSkge1xuXHRcdFx0dmFyIGNvbW1lbnQgPSAvKiogQHR5cGUge0NvbW1lbnR9ICovIChub2RlKTtcblx0XHRcdGlmIChjb21tZW50LmRhdGFbMF0gPT09IEhZRFJBVElPTl9TVEFSVCkgZGVwdGggKz0gMTtcblx0XHRcdGVsc2UgaWYgKGNvbW1lbnQuZGF0YVswXSA9PT0gSFlEUkFUSU9OX0VORCkgZGVwdGggLT0gMTtcblx0XHR9XG5cblx0XHRpZiAoZGVwdGggPT09IDAgJiYgbm9kZS5ub2RlVHlwZSA9PT0gRUxFTUVOVF9OT0RFKSB7XG5cdFx0XHRhc3NpZ25fbG9jYXRpb24oLyoqIEB0eXBlIHtFbGVtZW50fSAqLyAobm9kZSksIGZpbGVuYW1lLCBsb2NhdGlvbnNbaSsrXSk7XG5cdFx0fVxuXG5cdFx0bm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG5cdH1cbn1cbiIsIi8qKiBAaW1wb3J0IHsgRWZmZWN0LCBUZW1wbGF0ZU5vZGUgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgRklMRU5BTUUsIEhNUiB9IGZyb20gJy4uLy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBFRkZFQ1RfVFJBTlNQQVJFTlQsIEhNUl9BTkNIT1IgfSBmcm9tICcjY2xpZW50L2NvbnN0YW50cyc7XG5pbXBvcnQgeyBoeWRyYXRlX25vZGUsIGh5ZHJhdGluZyB9IGZyb20gJy4uL2RvbS9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgYmxvY2ssIGJyYW5jaCwgZGVzdHJveV9lZmZlY3QgfSBmcm9tICcuLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgc2V0LCBzb3VyY2UgfSBmcm9tICcuLi9yZWFjdGl2aXR5L3NvdXJjZXMuanMnO1xuaW1wb3J0IHsgc2V0X3Nob3VsZF9pbnRybyB9IGZyb20gJy4uL3JlbmRlci5qcyc7XG5pbXBvcnQgeyBhY3RpdmVfZWZmZWN0LCBnZXQgfSBmcm9tICcuLi9ydW50aW1lLmpzJztcblxuLyoqXG4gKiBAdGVtcGxhdGUgeyhhbmNob3I6IENvbW1lbnQsIHByb3BzOiBhbnkpID0+IGFueX0gQ29tcG9uZW50XG4gKiBAcGFyYW0ge0NvbXBvbmVudH0gZm5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhtcihmbikge1xuXHRjb25zdCBjdXJyZW50ID0gc291cmNlKGZuKTtcblxuXHQvKipcblx0ICogQHBhcmFtIHtUZW1wbGF0ZU5vZGV9IGluaXRpYWxfYW5jaG9yXG5cdCAqIEBwYXJhbSB7YW55fSBwcm9wc1xuXHQgKi9cblx0ZnVuY3Rpb24gd3JhcHBlcihpbml0aWFsX2FuY2hvciwgcHJvcHMpIHtcblx0XHRsZXQgY29tcG9uZW50ID0ge307XG5cdFx0bGV0IGluc3RhbmNlID0ge307XG5cblx0XHQvKiogQHR5cGUge0VmZmVjdH0gKi9cblx0XHRsZXQgZWZmZWN0O1xuXG5cdFx0bGV0IHJhbiA9IGZhbHNlO1xuXHRcdGxldCBhbmNob3IgPSBpbml0aWFsX2FuY2hvcjtcblxuXHRcdGJsb2NrKCgpID0+IHtcblx0XHRcdGlmIChjb21wb25lbnQgPT09IChjb21wb25lbnQgPSBnZXQoY3VycmVudCkpKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGVmZmVjdCkge1xuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdGZvciAodmFyIGsgaW4gaW5zdGFuY2UpIGRlbGV0ZSBpbnN0YW5jZVtrXTtcblx0XHRcdFx0ZGVzdHJveV9lZmZlY3QoZWZmZWN0KTtcblx0XHRcdH1cblxuXHRcdFx0ZWZmZWN0ID0gYnJhbmNoKCgpID0+IHtcblx0XHRcdFx0YW5jaG9yID0gLyoqIEB0eXBlIHthbnl9ICovIChhbmNob3IpW0hNUl9BTkNIT1JdID8/IGFuY2hvcjtcblxuXHRcdFx0XHQvLyB3aGVuIHRoZSBjb21wb25lbnQgaXMgaW52YWxpZGF0ZWQsIHJlcGxhY2UgaXQgd2l0aG91dCB0cmFuc2l0aW9uc1xuXHRcdFx0XHRpZiAocmFuKSBzZXRfc2hvdWxkX2ludHJvKGZhbHNlKTtcblxuXHRcdFx0XHQvLyBwcmVzZXJ2ZSBnZXR0ZXJzL3NldHRlcnNcblx0XHRcdFx0dmFyIHJlc3VsdCA9XG5cdFx0XHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRcdFx0XHRcdG5ldy50YXJnZXQgPyBuZXcgY29tcG9uZW50KGFuY2hvciwgcHJvcHMpIDogY29tcG9uZW50KGFuY2hvciwgcHJvcHMpO1xuXHRcdFx0XHQvLyBhIGNvbXBvbmVudCBpcyBub3QgZ3VhcmFudGVlZCB0byByZXR1cm4gc29tZXRoaW5nIGFuZCB3ZSBjYW4ndCBpbnZva2UgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyBvbiB1bmRlZmluZWRcblx0XHRcdFx0aWYgKHJlc3VsdCkge1xuXHRcdFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGluc3RhbmNlLCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhyZXN1bHQpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyYW4pIHNldF9zaG91bGRfaW50cm8odHJ1ZSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gRm9yd2FyZCB0aGUgc3RhcnQvZW5kIERPTSBub2RlcyBmcm9tIHRoZSBpbm5lciBlZmZlY3QgdG8gdGhlIG91dGVyIGFjdGl2ZSBlZmZlY3Rcblx0XHRcdC8vIHdoaWNoIHdvdWxkIGdldCB0aGVtIGlmIHRoZSBITVIgd3JhcHBlciB3YXNuJ3QgdGhlcmUuIERvIHRoaXMgaW5zaWRlIHRoZSBibG9jayBub3Rcblx0XHRcdC8vIG91dHNpZGUgc28gdGhhdCBITVIgdXBkYXRlcyB0byB0aGUgY29tcG9uZW50IHdpbGwgYWxzbyB1cGRhdGUgdGhlIG5vZGVzIG9uIHRoZVxuXHRcdFx0Ly8gYWN0aXZlIGVmZmVjdC4gV2UgY29weSBvbmx5IHN0YXJ0L2VuZCwgbm90IHRoZSBmdWxsIG5vZGVzIG9iamVjdCwgc28gdGhhdFxuXHRcdFx0Ly8gcGF1c2VfY2hpbGRyZW4gZG9lcyBub3QgY29sbGVjdCB0cmFuc2l0aW9ucyBmcm9tIGJvdGggZWZmZWN0cyBhbmQgZmlyZSBvdXRyb2VuZCB0d2ljZS5cblx0XHRcdHZhciBpbm5lcl9ub2RlcyA9IGVmZmVjdC5ub2Rlcztcblx0XHRcdGlmIChpbm5lcl9ub2Rlcykge1xuXHRcdFx0XHR2YXIgYWUgPSAvKiogQHR5cGUge0VmZmVjdH0gKi8gKGFjdGl2ZV9lZmZlY3QpO1xuXHRcdFx0XHRpZiAoYWUubm9kZXMpIHtcblx0XHRcdFx0XHRhZS5ub2Rlcy5zdGFydCA9IGlubmVyX25vZGVzLnN0YXJ0O1xuXHRcdFx0XHRcdGFlLm5vZGVzLmVuZCA9IGlubmVyX25vZGVzLmVuZDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRhZS5ub2RlcyA9IHsgc3RhcnQ6IGlubmVyX25vZGVzLnN0YXJ0LCBlbmQ6IGlubmVyX25vZGVzLmVuZCwgYTogbnVsbCwgdDogbnVsbCB9O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSwgRUZGRUNUX1RSQU5TUEFSRU5UKTtcblxuXHRcdHJhbiA9IHRydWU7XG5cblx0XHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0XHRhbmNob3IgPSBoeWRyYXRlX25vZGU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGluc3RhbmNlO1xuXHR9XG5cblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHR3cmFwcGVyW0ZJTEVOQU1FXSA9IGZuW0ZJTEVOQU1FXTtcblxuXHQvLyBAdHMtaWdub3JlXG5cdHdyYXBwZXJbSE1SXSA9IHtcblx0XHRmbixcblx0XHRjdXJyZW50LFxuXHRcdHVwZGF0ZTogKC8qKiBAdHlwZSB7YW55fSAqLyBpbmNvbWluZykgPT4ge1xuXHRcdFx0Ly8gVGhpcyBsb2dpYyBlbnN1cmVzIHRoYXQgdGhlIGZpcnN0IHZlcnNpb24gb2YgdGhlIGNvbXBvbmVudCBpcyB0aGUgb25lXG5cdFx0XHQvLyB3aG9zZSB1cGRhdGUgZnVuY3Rpb24gYW5kIHRoZXJlZm9yZSBibG9jayBlZmZlY3QgaXMgcHJlc2VydmVkIGFjcm9zcyB1cGRhdGVzLlxuXHRcdFx0Ly8gSWYgd2UgZG9uJ3QgZG8gdGhpcyBkYW5jZSBhbmQgaW5zdGVhZCBqdXN0IHVzZSBgaW5jb21pbmdgIGFzIHRoZSBuZXcgY29tcG9uZW50XG5cdFx0XHQvLyBhbmQgdGhlbiB1cGRhdGUsIHdlJ2xsIGNyZWF0ZSBhbiBldmVyLWdyb3dpbmcgc3RhY2sgb2YgYmxvY2sgZWZmZWN0cy5cblxuXHRcdFx0Ly8gVHJpZ2dlciB0aGUgb3JpZ2luYWwgYmxvY2sgZWZmZWN0XG5cdFx0XHRzZXQod3JhcHBlcltITVJdLmN1cnJlbnQsIGluY29taW5nW0hNUl0uZm4pO1xuXG5cdFx0XHQvLyBSZXBsYWNlIHRoZSBpbmNvbWluZyBzb3VyY2Ugd2l0aCB0aGUgb3JpZ2luYWwgb25lXG5cdFx0XHRpbmNvbWluZ1tITVJdLmN1cnJlbnQgPSB3cmFwcGVyW0hNUl0uY3VycmVudDtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHdyYXBwZXI7XG59XG4iLCIvKiogQHR5cGVkZWYge3sgZmlsZTogc3RyaW5nLCBsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyIH19IExvY2F0aW9uICovXG5cbmltcG9ydCB7IGdldF9kZXNjcmlwdG9yIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3V0aWxzLmpzJztcbmltcG9ydCB7IExFR0FDWV9QUk9QUywgU1RBVEVfU1lNQk9MIH0gZnJvbSAnI2NsaWVudC9jb25zdGFudHMnO1xuaW1wb3J0IHsgRklMRU5BTUUgfSBmcm9tICcuLi8uLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgY29tcG9uZW50X2NvbnRleHQgfSBmcm9tICcuLi9jb250ZXh0LmpzJztcbmltcG9ydCAqIGFzIHcgZnJvbSAnLi4vd2FybmluZ3MuanMnO1xuaW1wb3J0IHsgc2FuaXRpemVfbG9jYXRpb24gfSBmcm9tICcuLi8uLi8uLi91dGlscy5qcyc7XG5cbi8qKlxuICogU2V0cyB1cCBhIHZhbGlkYXRvciB0aGF0XG4gKiAtIHRyYXZlcnNlcyB0aGUgcGF0aCBvZiBhIHByb3AgdG8gZmluZCBvdXQgaWYgaXQgaXMgYWxsb3dlZCB0byBiZSBtdXRhdGVkXG4gKiAtIGNoZWNrcyB0aGF0IHRoZSBiaW5kaW5nIGNoYWluIGlzIG5vdCBpbnRlcnJ1cHRlZFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBwcm9wc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlX293bmVyc2hpcF92YWxpZGF0b3IocHJvcHMpIHtcblx0Y29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50X2NvbnRleHQ/LmZ1bmN0aW9uO1xuXHRjb25zdCBwYXJlbnQgPSBjb21wb25lbnRfY29udGV4dD8ucD8uZnVuY3Rpb247XG5cblx0cmV0dXJuIHtcblx0XHQvKipcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gcHJvcFxuXHRcdCAqIEBwYXJhbSB7YW55W119IHBhdGhcblx0XHQgKiBAcGFyYW0ge2FueX0gcmVzdWx0XG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IGxpbmVcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gY29sdW1uXG5cdFx0ICovXG5cdFx0bXV0YXRpb246IChwcm9wLCBwYXRoLCByZXN1bHQsIGxpbmUsIGNvbHVtbikgPT4ge1xuXHRcdFx0Y29uc3QgbmFtZSA9IHBhdGhbMF07XG5cdFx0XHRpZiAoaXNfYm91bmRfb3JfdW5zZXQocHJvcHMsIG5hbWUpIHx8ICFwYXJlbnQpIHtcblx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHRcdH1cblxuXHRcdFx0LyoqIEB0eXBlIHthbnl9ICovXG5cdFx0XHRsZXQgdmFsdWUgPSBwcm9wcztcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aCAtIDE7IGkrKykge1xuXHRcdFx0XHR2YWx1ZSA9IHZhbHVlW3BhdGhbaV1dO1xuXHRcdFx0XHRpZiAoIXZhbHVlPy5bU1RBVEVfU1lNQk9MXSkge1xuXHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgbG9jYXRpb24gPSBzYW5pdGl6ZV9sb2NhdGlvbihgJHtjb21wb25lbnRbRklMRU5BTUVdfToke2xpbmV9OiR7Y29sdW1ufWApO1xuXG5cdFx0XHR3Lm93bmVyc2hpcF9pbnZhbGlkX211dGF0aW9uKG5hbWUsIGxvY2F0aW9uLCBwcm9wLCBwYXJlbnRbRklMRU5BTUVdKTtcblxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9LFxuXHRcdC8qKlxuXHRcdCAqIEBwYXJhbSB7YW55fSBrZXlcblx0XHQgKiBAcGFyYW0ge2FueX0gY2hpbGRfY29tcG9uZW50XG5cdFx0ICogQHBhcmFtIHsoKSA9PiBhbnl9IHZhbHVlXG5cdFx0ICovXG5cdFx0YmluZGluZzogKGtleSwgY2hpbGRfY29tcG9uZW50LCB2YWx1ZSkgPT4ge1xuXHRcdFx0aWYgKCFpc19ib3VuZF9vcl91bnNldChwcm9wcywga2V5KSAmJiBwYXJlbnQgJiYgdmFsdWUoKT8uW1NUQVRFX1NZTUJPTF0pIHtcblx0XHRcdFx0dy5vd25lcnNoaXBfaW52YWxpZF9iaW5kaW5nKFxuXHRcdFx0XHRcdGNvbXBvbmVudFtGSUxFTkFNRV0sXG5cdFx0XHRcdFx0a2V5LFxuXHRcdFx0XHRcdGNoaWxkX2NvbXBvbmVudFtGSUxFTkFNRV0sXG5cdFx0XHRcdFx0cGFyZW50W0ZJTEVOQU1FXVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHByb3BzXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcF9uYW1lXG4gKi9cbmZ1bmN0aW9uIGlzX2JvdW5kX29yX3Vuc2V0KHByb3BzLCBwcm9wX25hbWUpIHtcblx0Ly8gQ2FuIGJlIHRoZSBjYXNlIHdoZW4gc29tZW9uZSBkb2VzIGBtb3VudChDb21wb25lbnQsIHByb3BzKWAgd2l0aCBgbGV0IHByb3BzID0gJHN0YXRlKHsuLi59KWBcblx0Ly8gb3IgYGNyZWF0ZUNsYXNzQ29tcG9uZW50KENvbXBvbmVudCwgcHJvcHMpYFxuXHRjb25zdCBpc19lbnRyeV9wcm9wcyA9IFNUQVRFX1NZTUJPTCBpbiBwcm9wcyB8fCBMRUdBQ1lfUFJPUFMgaW4gcHJvcHM7XG5cdHJldHVybiAoXG5cdFx0ISFnZXRfZGVzY3JpcHRvcihwcm9wcywgcHJvcF9uYW1lKT8uc2V0IHx8XG5cdFx0KGlzX2VudHJ5X3Byb3BzICYmIHByb3BfbmFtZSBpbiBwcm9wcykgfHxcblx0XHQhKHByb3BfbmFtZSBpbiBwcm9wcylcblx0KTtcbn1cbiIsImltcG9ydCAqIGFzIGUgZnJvbSAnLi4vZXJyb3JzLmpzJztcbmltcG9ydCB7IGNvbXBvbmVudF9jb250ZXh0IH0gZnJvbSAnLi4vY29udGV4dC5qcyc7XG5pbXBvcnQgeyBGSUxFTkFNRSB9IGZyb20gJy4uLy4uLy4uL2NvbnN0YW50cy5qcyc7XG5cbi8qKiBAcGFyYW0ge0Z1bmN0aW9uICYgeyBbRklMRU5BTUVdOiBzdHJpbmcgfX0gdGFyZ2V0ICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tfdGFyZ2V0KHRhcmdldCkge1xuXHRpZiAodGFyZ2V0KSB7XG5cdFx0ZS5jb21wb25lbnRfYXBpX2ludmFsaWRfbmV3KHRhcmdldFtGSUxFTkFNRV0gPz8gJ2EgY29tcG9uZW50JywgdGFyZ2V0Lm5hbWUpO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsZWdhY3lfYXBpKCkge1xuXHRjb25zdCBjb21wb25lbnQgPSBjb21wb25lbnRfY29udGV4dD8uZnVuY3Rpb247XG5cblx0LyoqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgKi9cblx0ZnVuY3Rpb24gZXJyb3IobWV0aG9kKSB7XG5cdFx0ZS5jb21wb25lbnRfYXBpX2NoYW5nZWQobWV0aG9kLCBjb21wb25lbnRbRklMRU5BTUVdKTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0JGRlc3Ryb3k6ICgpID0+IGVycm9yKCckZGVzdHJveSgpJyksXG5cdFx0JG9uOiAoKSA9PiBlcnJvcignJG9uKC4uLiknKSxcblx0XHQkc2V0OiAoKSA9PiBlcnJvcignJHNldCguLi4pJylcblx0fTtcbn1cbiIsImltcG9ydCB7IFVOSU5JVElBTElaRUQgfSBmcm9tICcuLi8uLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgc25hcHNob3QgfSBmcm9tICcuLi8uLi9zaGFyZWQvY2xvbmUuanMnO1xuaW1wb3J0IHsgZWFnZXJfZWZmZWN0LCByZW5kZXJfZWZmZWN0LCB2YWxpZGF0ZV9lZmZlY3QgfSBmcm9tICcuLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgdW50cmFjayB9IGZyb20gJy4uL3J1bnRpbWUuanMnO1xuaW1wb3J0IHsgZ2V0X2Vycm9yIH0gZnJvbSAnLi4vLi4vc2hhcmVkL2Rldi5qcyc7XG5cbi8qKlxuICogQHBhcmFtIHsoKSA9PiBhbnlbXX0gZ2V0X3ZhbHVlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbnNwZWN0b3JcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc2hvd19zdGFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zcGVjdChnZXRfdmFsdWUsIGluc3BlY3Rvciwgc2hvd19zdGFjayA9IGZhbHNlKSB7XG5cdHZhbGlkYXRlX2VmZmVjdCgnJGluc3BlY3QnKTtcblxuXHRsZXQgaW5pdGlhbCA9IHRydWU7XG5cdGxldCBlcnJvciA9IC8qKiBAdHlwZSB7YW55fSAqLyAoVU5JTklUSUFMSVpFRCk7XG5cblx0Ly8gSW5zcGVjdCBlZmZlY3RzIHJ1bnMgc3luY2hyb25vdXNseSBzbyB0aGF0IHdlIGNhbiBjYXB0dXJlIHVzZWZ1bFxuXHQvLyBzdGFjayB0cmFjZXMuIEFzIGEgY29uc2VxdWVuY2UsIHJlYWRpbmcgdGhlIHZhbHVlIG1pZ2h0IHJlc3VsdFxuXHQvLyBpbiBhbiBlcnJvciAoYW4gYCRpbnNwZWN0KG9iamVjdC5wcm9wZXJ0eSlgIHdpbGwgcnVuIGJlZm9yZSB0aGVcblx0Ly8gYHsjaWYgb2JqZWN0fS4uLnsvaWZ9YCB0aGF0IGNvbnRhaW5zIGl0KVxuXHRlYWdlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdGVycm9yID0gVU5JTklUSUFMSVpFRDtcblxuXHRcdHRyeSB7XG5cdFx0XHR2YXIgdmFsdWUgPSBnZXRfdmFsdWUoKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRlcnJvciA9IGU7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIHNuYXAgPSBzbmFwc2hvdCh2YWx1ZSwgdHJ1ZSwgdHJ1ZSk7XG5cdFx0dW50cmFjaygoKSA9PiB7XG5cdFx0XHRpZiAoc2hvd19zdGFjaykge1xuXHRcdFx0XHRpbnNwZWN0b3IoLi4uc25hcCk7XG5cblx0XHRcdFx0aWYgKCFpbml0aWFsKSB7XG5cdFx0XHRcdFx0Y29uc3Qgc3RhY2sgPSBnZXRfZXJyb3IoJyRpbnNwZWN0KC4uLiknKTtcblx0XHRcdFx0XHRpZiAoc3RhY2spIHtcblx0XHRcdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0XHRcdFx0XHRjb25zb2xlLmdyb3VwQ29sbGFwc2VkKCdzdGFjayB0cmFjZScpO1xuXHRcdFx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKHN0YWNrKTtcblx0XHRcdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0XHRcdFx0XHRjb25zb2xlLmdyb3VwRW5kKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpbnNwZWN0b3IoaW5pdGlhbCA/ICdpbml0JyA6ICd1cGRhdGUnLCAuLi5zbmFwKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGluaXRpYWwgPSBmYWxzZTtcblx0fSk7XG5cblx0Ly8gSWYgYW4gZXJyb3Igb2NjdXJzLCB3ZSBzdG9yZSBpdCAoYWxvbmcgd2l0aCBpdHMgc3RhY2sgdHJhY2UpLlxuXHQvLyBJZiB0aGUgcmVuZGVyIGVmZmVjdCBzdWJzZXF1ZW50bHkgcnVucywgd2UgbG9nIHRoZSBlcnJvcixcblx0Ly8gYnV0IGlmIGl0IGRvZXNuJ3QgcnVuIGl0J3MgYmVjYXVzZSB0aGUgYCRpbnNwZWN0YCB3YXNcblx0Ly8gZGVzdHJveWVkLCBtZWFuaW5nIHdlIGRvbid0IG5lZWQgdG8gYm90aGVyXG5cdHJlbmRlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdHRyeSB7XG5cdFx0XHQvLyBjYWxsIGBnZXRfdmFsdWVgIHNvIHRoYXQgdGhpcyBydW5zIGFsb25nc2lkZSB0aGUgaW5zcGVjdCBlZmZlY3Rcblx0XHRcdGdldF92YWx1ZSgpO1xuXHRcdH0gY2F0Y2gge1xuXHRcdFx0Ly8gaWdub3JlXG5cdFx0fVxuXG5cdFx0aWYgKGVycm9yICE9PSBVTklOSVRJQUxJWkVEKSB7XG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0XHRlcnJvciA9IFVOSU5JVElBTElaRUQ7XG5cdFx0fVxuXHR9KTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgQmxvY2tlciwgVGVtcGxhdGVOb2RlLCBWYWx1ZSB9IGZyb20gJyNjbGllbnQnICovXG5pbXBvcnQgeyBmbGF0dGVuIH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9hc3luYy5qcyc7XG5pbXBvcnQgeyBnZXQgfSBmcm9tICcuLi8uLi9ydW50aW1lLmpzJztcbmltcG9ydCB7XG5cdGh5ZHJhdGVfbmV4dCxcblx0aHlkcmF0ZV9ub2RlLFxuXHRoeWRyYXRpbmcsXG5cdHNldF9oeWRyYXRlX25vZGUsXG5cdHNldF9oeWRyYXRpbmcsXG5cdHNraXBfbm9kZXNcbn0gZnJvbSAnLi4vaHlkcmF0aW9uLmpzJztcbmltcG9ydCB7IGFzc2lnbl9ub2RlcyB9IGZyb20gJy4uL3RlbXBsYXRlLmpzJztcblxuLyoqXG4gKiBAcGFyYW0ge1RlbXBsYXRlTm9kZX0gbm9kZVxuICogQHBhcmFtIHtCbG9ja2VyW119IGJsb2NrZXJzXG4gKiBAcGFyYW0ge0FycmF5PCgpID0+IFByb21pc2U8YW55Pj59IGV4cHJlc3Npb25zXG4gKiBAcGFyYW0geyhhbmNob3I6IFRlbXBsYXRlTm9kZSwgLi4uZGVyaXZlZHM6IFZhbHVlW10pID0+IHZvaWR9IGZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3luYyhub2RlLCBibG9ja2VycyA9IFtdLCBleHByZXNzaW9ucyA9IFtdLCBmbikge1xuXHR2YXIgd2FzX2h5ZHJhdGluZyA9IGh5ZHJhdGluZztcblx0dmFyIGVuZCA9IG51bGw7XG5cblx0aWYgKHdhc19oeWRyYXRpbmcpIHtcblx0XHRoeWRyYXRlX25leHQoKTtcblx0XHRlbmQgPSBza2lwX25vZGVzKGZhbHNlKTtcblx0XHRhc3NpZ25fbm9kZXMobm9kZSwgZW5kKTsgLy8gTmVjZXNzYXJ5IGlmIHRoaXMgd3JhcHMgdGhlIHNvbGUgY2hpbGQgb2YgYSBibG9jaywgZWxzZSBlbmQgbWFya2VyIGNhbiBiZSB3cm9uZ1xuXHR9XG5cblx0aWYgKGV4cHJlc3Npb25zLmxlbmd0aCA9PT0gMCAmJiBibG9ja2Vycy5ldmVyeSgoYikgPT4gYi5zZXR0bGVkKSkge1xuXHRcdGZuKG5vZGUpO1xuXG5cdFx0Ly8gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBpdCBpcyBub3QgZ3VhcmFudGVlZCB0aGF0IHRoZSByZW5kZXIgZnVuY3Rpb24gd2lsbFxuXHRcdC8vIGFkdmFuY2UgdGhlIGh5ZHJhdGlvbiBub2RlIHRvICQuYXN5bmMncyBlbmQgbWFya2VyOiBpdCBtYXkgc3RvcCBhdCBhbiBpbm5lclxuXHRcdC8vIGJsb2NrJ3MgZW5kIG1hcmtlciAoaW4gY2FzZSBvZiBhbiBpbm5lciBpZiBibG9jayBmb3IgZXhhbXBsZSksIGJ1dCBpdCBhbHNvIG1heVxuXHRcdC8vIHN0b3AgYXQgdGhlIGNvcnJlY3QgJC5hc3luYyBlbmQgbWFya2VyIChpbiBjYXNlIG9mIGNvbXBvbmVudCBjaGlsZCkgLSBoZW5jZVxuXHRcdC8vIHdlIGNhbid0IGp1c3QgdXNlIGh5ZHJhdGVfbmV4dCgpXG5cdFx0Ly8gVE9ETyB0aGlzIGZlZWxzIGluZGljYXRpdmUgb2YgYSBidWcgZWxzZXdoZXJlOyBpZGVhbGx5IHdlIHdvdWxkbid0IG5lZWRcblx0XHQvLyB0byBkb3VibGUtdHJhdmVyc2UgaW4gdGhlIGFscmVhZHktcmVzb2x2ZWQgY2FzZVxuXHRcdGlmICh3YXNfaHlkcmF0aW5nKSB7XG5cdFx0XHRzZXRfaHlkcmF0ZV9ub2RlKGVuZCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aWYgKHdhc19oeWRyYXRpbmcpIHtcblx0XHR2YXIgcHJldmlvdXNfaHlkcmF0ZV9ub2RlID0gaHlkcmF0ZV9ub2RlO1xuXHRcdHNldF9oeWRyYXRlX25vZGUoZW5kKTtcblx0fVxuXG5cdGZsYXR0ZW4oYmxvY2tlcnMsIFtdLCBleHByZXNzaW9ucywgKHZhbHVlcykgPT4ge1xuXHRcdGlmICh3YXNfaHlkcmF0aW5nKSB7XG5cdFx0XHRzZXRfaHlkcmF0aW5nKHRydWUpO1xuXHRcdFx0c2V0X2h5ZHJhdGVfbm9kZShwcmV2aW91c19oeWRyYXRlX25vZGUpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBnZXQgdmFsdWVzIGVhZ2VybHkgdG8gYXZvaWQgY3JlYXRpbmcgYmxvY2tzIGlmIHRoZXkgcmVqZWN0XG5cdFx0XHRmb3IgKGNvbnN0IGQgb2YgdmFsdWVzKSBnZXQoZCk7XG5cblx0XHRcdGZuKG5vZGUsIC4uLnZhbHVlcyk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGlmICh3YXNfaHlkcmF0aW5nKSB7XG5cdFx0XHRcdHNldF9oeWRyYXRpbmcoZmFsc2UpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59XG4iLCJpbXBvcnQgKiBhcyBlIGZyb20gJy4uL2Vycm9ycy5qcyc7XG4vKipcbiAqIEBwYXJhbSB7Tm9kZX0gYW5jaG9yXG4gKiBAcGFyYW0gey4uLigoKT0+YW55KVtdfSBhcmdzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZV9zbmlwcGV0X2FyZ3MoYW5jaG9yLCAuLi5hcmdzKSB7XG5cdGlmICh0eXBlb2YgYW5jaG9yICE9PSAnb2JqZWN0JyB8fCAhKGFuY2hvciBpbnN0YW5jZW9mIE5vZGUpKSB7XG5cdFx0ZS5pbnZhbGlkX3NuaXBwZXRfYXJndW1lbnRzKCk7XG5cdH1cblxuXHRmb3IgKGxldCBhcmcgb2YgYXJncykge1xuXHRcdGlmICh0eXBlb2YgYXJnICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRlLmludmFsaWRfc25pcHBldF9hcmd1bWVudHMoKTtcblx0XHR9XG5cdH1cbn1cbiIsIi8qKiBAaW1wb3J0IHsgRWZmZWN0LCBUZW1wbGF0ZU5vZGUgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgQmF0Y2gsIGN1cnJlbnRfYmF0Y2ggfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2JhdGNoLmpzJztcbmltcG9ydCB7XG5cdGJyYW5jaCxcblx0ZGVzdHJveV9lZmZlY3QsXG5cdG1vdmVfZWZmZWN0LFxuXHRwYXVzZV9lZmZlY3QsXG5cdHJlc3VtZV9lZmZlY3Rcbn0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcbmltcG9ydCB7IEhNUl9BTkNIT1IgfSBmcm9tICcuLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgaHlkcmF0ZV9ub2RlLCBoeWRyYXRpbmcgfSBmcm9tICcuLi9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgY3JlYXRlX3RleHQsIHNob3VsZF9kZWZlcl9hcHBlbmQgfSBmcm9tICcuLi9vcGVyYXRpb25zLmpzJztcbmltcG9ydCB7IERFViB9IGZyb20gJ2VzbS1lbnYnO1xuXG4vKipcbiAqIEB0eXBlZGVmIHt7IGVmZmVjdDogRWZmZWN0LCBmcmFnbWVudDogRG9jdW1lbnRGcmFnbWVudCB9fSBCcmFuY2hcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBLZXlcbiAqL1xuZXhwb3J0IGNsYXNzIEJyYW5jaE1hbmFnZXIge1xuXHQvKiogQHR5cGUge1RlbXBsYXRlTm9kZX0gKi9cblx0YW5jaG9yO1xuXG5cdC8qKiBAdHlwZSB7TWFwPEJhdGNoLCBLZXk+fSAqL1xuXHQjYmF0Y2hlcyA9IG5ldyBNYXAoKTtcblxuXHQvKipcblx0ICogTWFwIG9mIGtleXMgdG8gZWZmZWN0cyB0aGF0IGFyZSBjdXJyZW50bHkgcmVuZGVyZWQgaW4gdGhlIERPTS5cblx0ICogVGhlc2UgZWZmZWN0cyBhcmUgdmlzaWJsZSBhbmQgYWN0aXZlbHkgcGFydCBvZiB0aGUgZG9jdW1lbnQgdHJlZS5cblx0ICogRXhhbXBsZTpcblx0ICogYGBgXG5cdCAqIHsjaWYgY29uZGl0aW9ufVxuXHQgKiBcdGZvb1xuXHQgKiB7OmVsc2V9XG5cdCAqIFx0YmFyXG5cdCAqIHsvaWZ9XG5cdCAqIGBgYFxuXHQgKiBDYW4gcmVzdWx0IGluIHRoZSBlbnRyaWVzIGB0cnVlLT5FZmZlY3RgIGFuZCBgZmFsc2UtPkVmZmVjdGBcblx0ICogQHR5cGUge01hcDxLZXksIEVmZmVjdD59XG5cdCAqL1xuXHQjb25zY3JlZW4gPSBuZXcgTWFwKCk7XG5cblx0LyoqXG5cdCAqIFNpbWlsYXIgdG8gI29uc2NyZWVuIHdpdGggcmVzcGVjdCB0byB0aGUga2V5cywgYnV0IGNvbnRhaW5zIGJyYW5jaGVzIHRoYXQgYXJlIG5vdCB5ZXRcblx0ICogaW4gdGhlIERPTSwgYmVjYXVzZSB0aGVpciBpbnNlcnRpb24gaXMgZGVmZXJyZWQuXG5cdCAqIEB0eXBlIHtNYXA8S2V5LCBCcmFuY2g+fVxuXHQgKi9cblx0I29mZnNjcmVlbiA9IG5ldyBNYXAoKTtcblxuXHQvKipcblx0ICogS2V5cyBvZiBlZmZlY3RzIHRoYXQgYXJlIGN1cnJlbnRseSBvdXRyb2luZ1xuXHQgKiBAdHlwZSB7U2V0PEtleT59XG5cdCAqL1xuXHQjb3V0cm9pbmcgPSBuZXcgU2V0KCk7XG5cblx0LyoqXG5cdCAqIFdoZXRoZXIgdG8gcGF1c2UgKGkuZS4gb3V0cm8pIG9uIGNoYW5nZSwgb3IgZGVzdHJveSBpbW1lZGlhdGVseS5cblx0ICogVGhpcyBpcyBuZWNlc3NhcnkgZm9yIGA8c3ZlbHRlOmVsZW1lbnQ+YFxuXHQgKi9cblx0I3RyYW5zaXRpb24gPSB0cnVlO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge1RlbXBsYXRlTm9kZX0gYW5jaG9yXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gdHJhbnNpdGlvblxuXHQgKi9cblx0Y29uc3RydWN0b3IoYW5jaG9yLCB0cmFuc2l0aW9uID0gdHJ1ZSkge1xuXHRcdHRoaXMuYW5jaG9yID0gYW5jaG9yO1xuXHRcdHRoaXMuI3RyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7QmF0Y2h9IGJhdGNoXG5cdCAqL1xuXHQjY29tbWl0ID0gKGJhdGNoKSA9PiB7XG5cdFx0Ly8gaWYgdGhpcyBiYXRjaCB3YXMgbWFkZSBvYnNvbGV0ZSwgYmFpbFxuXHRcdGlmICghdGhpcy4jYmF0Y2hlcy5oYXMoYmF0Y2gpKSByZXR1cm47XG5cblx0XHR2YXIga2V5ID0gLyoqIEB0eXBlIHtLZXl9ICovICh0aGlzLiNiYXRjaGVzLmdldChiYXRjaCkpO1xuXG5cdFx0dmFyIG9uc2NyZWVuID0gdGhpcy4jb25zY3JlZW4uZ2V0KGtleSk7XG5cblx0XHRpZiAob25zY3JlZW4pIHtcblx0XHRcdC8vIGVmZmVjdCBpcyBhbHJlYWR5IGluIHRoZSBET00g4oCUIGFib3J0IGFueSBjdXJyZW50IG91dHJvXG5cdFx0XHRyZXN1bWVfZWZmZWN0KG9uc2NyZWVuKTtcblx0XHRcdHRoaXMuI291dHJvaW5nLmRlbGV0ZShrZXkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBlZmZlY3QgaXMgY3VycmVudGx5IG9mZnNjcmVlbi4gcHV0IGl0IGluIHRoZSBET01cblx0XHRcdHZhciBvZmZzY3JlZW4gPSB0aGlzLiNvZmZzY3JlZW4uZ2V0KGtleSk7XG5cblx0XHRcdGlmIChvZmZzY3JlZW4pIHtcblx0XHRcdFx0Ly8gZWZmZWN0IGNvdWxkIGhhdmUgYmVlbiBvdXRybydlZCBiZWZvcmUgdGhyb3VnaCBhIHByaW9yIGJhdGNoIOKAlCByZXN1bWUgaWYgbmVjZXNzYXJ5XG5cdFx0XHRcdHJlc3VtZV9lZmZlY3Qob2Zmc2NyZWVuLmVmZmVjdCk7XG5cdFx0XHRcdHRoaXMuI29uc2NyZWVuLnNldChrZXksIG9mZnNjcmVlbi5lZmZlY3QpO1xuXHRcdFx0XHR0aGlzLiNvZmZzY3JlZW4uZGVsZXRlKGtleSk7XG5cblx0XHRcdFx0aWYgKERFVikge1xuXHRcdFx0XHRcdC8vIFRlbGwgaG1yLmpzIGFib3V0IHRoZSBhbmNob3IgaXQgc2hvdWxkIHVzZSBmb3IgdXBkYXRlcyxcblx0XHRcdFx0XHQvLyBzaW5jZSB0aGUgaW5pdGlhbCBvbmUgd2lsbCBiZSByZW1vdmVkXG5cdFx0XHRcdFx0LyoqIEB0eXBlIHthbnl9ICovIChvZmZzY3JlZW4uZnJhZ21lbnQubGFzdENoaWxkKVtITVJfQU5DSE9SXSA9IHRoaXMuYW5jaG9yO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gcmVtb3ZlIHRoZSBhbmNob3IuLi5cblx0XHRcdFx0LyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGV9ICovIChvZmZzY3JlZW4uZnJhZ21lbnQubGFzdENoaWxkKS5yZW1vdmUoKTtcblxuXHRcdFx0XHQvLyAuLi5hbmQgYXBwZW5kIHRoZSBmcmFnbWVudFxuXHRcdFx0XHR0aGlzLmFuY2hvci5iZWZvcmUob2Zmc2NyZWVuLmZyYWdtZW50KTtcblx0XHRcdFx0b25zY3JlZW4gPSBvZmZzY3JlZW4uZWZmZWN0O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgW2IsIGtdIG9mIHRoaXMuI2JhdGNoZXMpIHtcblx0XHRcdHRoaXMuI2JhdGNoZXMuZGVsZXRlKGIpO1xuXG5cdFx0XHRpZiAoYiA9PT0gYmF0Y2gpIHtcblx0XHRcdFx0Ly8ga2VlcCB2YWx1ZXMgZm9yIG5ld2VyIGJhdGNoZXNcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IG9mZnNjcmVlbiA9IHRoaXMuI29mZnNjcmVlbi5nZXQoayk7XG5cblx0XHRcdGlmIChvZmZzY3JlZW4pIHtcblx0XHRcdFx0Ly8gZm9yIG9sZGVyIGJhdGNoZXMsIGRlc3Ryb3kgb2Zmc2NyZWVuIGVmZmVjdHNcblx0XHRcdFx0Ly8gYXMgdGhleSB3aWxsIG5ldmVyIGJlIGNvbW1pdHRlZFxuXHRcdFx0XHRkZXN0cm95X2VmZmVjdChvZmZzY3JlZW4uZWZmZWN0KTtcblx0XHRcdFx0dGhpcy4jb2Zmc2NyZWVuLmRlbGV0ZShrKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBvdXRyby9kZXN0cm95IGFsbCBvbnNjcmVlbiBlZmZlY3RzLi4uXG5cdFx0Zm9yIChjb25zdCBbaywgZWZmZWN0XSBvZiB0aGlzLiNvbnNjcmVlbikge1xuXHRcdFx0Ly8gLi4uZXhjZXB0IHRoZSBvbmUgdGhhdCB3YXMganVzdCBjb21taXR0ZWRcblx0XHRcdC8vICAgIG9yIHRob3NlIHRoYXQgYXJlIGFscmVhZHkgb3V0cm9pbmcgKGVsc2UgdGhlIHRyYW5zaXRpb24gaXMgYWJvcnRlZCBhbmQgdGhlIGVmZmVjdCBkZXN0cm95ZWQgcmlnaHQgYXdheSlcblx0XHRcdGlmIChrID09PSBrZXkgfHwgdGhpcy4jb3V0cm9pbmcuaGFzKGspKSBjb250aW51ZTtcblxuXHRcdFx0Y29uc3Qgb25fZGVzdHJveSA9ICgpID0+IHtcblx0XHRcdFx0Y29uc3Qga2V5cyA9IEFycmF5LmZyb20odGhpcy4jYmF0Y2hlcy52YWx1ZXMoKSk7XG5cblx0XHRcdFx0aWYgKGtleXMuaW5jbHVkZXMoaykpIHtcblx0XHRcdFx0XHQvLyBrZWVwIHRoZSBlZmZlY3Qgb2Zmc2NyZWVuLCBhcyBhbm90aGVyIGJhdGNoIHdpbGwgbmVlZCBpdFxuXHRcdFx0XHRcdHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRcdFx0XHRtb3ZlX2VmZmVjdChlZmZlY3QsIGZyYWdtZW50KTtcblxuXHRcdFx0XHRcdGZyYWdtZW50LmFwcGVuZChjcmVhdGVfdGV4dCgpKTsgLy8gVE9ETyBjYW4gd2UgYXZvaWQgdGhpcz9cblxuXHRcdFx0XHRcdHRoaXMuI29mZnNjcmVlbi5zZXQoaywgeyBlZmZlY3QsIGZyYWdtZW50IH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRlc3Ryb3lfZWZmZWN0KGVmZmVjdCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLiNvdXRyb2luZy5kZWxldGUoayk7XG5cdFx0XHRcdHRoaXMuI29uc2NyZWVuLmRlbGV0ZShrKTtcblx0XHRcdH07XG5cblx0XHRcdGlmICh0aGlzLiN0cmFuc2l0aW9uIHx8ICFvbnNjcmVlbikge1xuXHRcdFx0XHR0aGlzLiNvdXRyb2luZy5hZGQoayk7XG5cdFx0XHRcdHBhdXNlX2VmZmVjdChlZmZlY3QsIG9uX2Rlc3Ryb3ksIGZhbHNlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG9uX2Rlc3Ryb3koKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7QmF0Y2h9IGJhdGNoXG5cdCAqL1xuXHQjZGlzY2FyZCA9IChiYXRjaCkgPT4ge1xuXHRcdHRoaXMuI2JhdGNoZXMuZGVsZXRlKGJhdGNoKTtcblxuXHRcdGNvbnN0IGtleXMgPSBBcnJheS5mcm9tKHRoaXMuI2JhdGNoZXMudmFsdWVzKCkpO1xuXG5cdFx0Zm9yIChjb25zdCBbaywgYnJhbmNoXSBvZiB0aGlzLiNvZmZzY3JlZW4pIHtcblx0XHRcdGlmICgha2V5cy5pbmNsdWRlcyhrKSkge1xuXHRcdFx0XHRkZXN0cm95X2VmZmVjdChicmFuY2guZWZmZWN0KTtcblx0XHRcdFx0dGhpcy4jb2Zmc2NyZWVuLmRlbGV0ZShrKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqXG5cdCAqIEBwYXJhbSB7YW55fSBrZXlcblx0ICogQHBhcmFtIHtudWxsIHwgKCh0YXJnZXQ6IFRlbXBsYXRlTm9kZSkgPT4gdm9pZCl9IGZuXG5cdCAqL1xuXHRlbnN1cmUoa2V5LCBmbikge1xuXHRcdHZhciBiYXRjaCA9IC8qKiBAdHlwZSB7QmF0Y2h9ICovIChjdXJyZW50X2JhdGNoKTtcblx0XHR2YXIgZGVmZXIgPSBzaG91bGRfZGVmZXJfYXBwZW5kKCk7XG5cblx0XHRpZiAoZm4gJiYgIXRoaXMuI29uc2NyZWVuLmhhcyhrZXkpICYmICF0aGlzLiNvZmZzY3JlZW4uaGFzKGtleSkpIHtcblx0XHRcdGlmIChkZWZlcikge1xuXHRcdFx0XHR2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cdFx0XHRcdHZhciB0YXJnZXQgPSBjcmVhdGVfdGV4dCgpO1xuXG5cdFx0XHRcdGZyYWdtZW50LmFwcGVuZCh0YXJnZXQpO1xuXG5cdFx0XHRcdHRoaXMuI29mZnNjcmVlbi5zZXQoa2V5LCB7XG5cdFx0XHRcdFx0ZWZmZWN0OiBicmFuY2goKCkgPT4gZm4odGFyZ2V0KSksXG5cdFx0XHRcdFx0ZnJhZ21lbnRcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLiNvbnNjcmVlbi5zZXQoXG5cdFx0XHRcdFx0a2V5LFxuXHRcdFx0XHRcdGJyYW5jaCgoKSA9PiBmbih0aGlzLmFuY2hvcikpXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy4jYmF0Y2hlcy5zZXQoYmF0Y2gsIGtleSk7XG5cblx0XHRpZiAoZGVmZXIpIHtcblx0XHRcdGZvciAoY29uc3QgW2ssIGVmZmVjdF0gb2YgdGhpcy4jb25zY3JlZW4pIHtcblx0XHRcdFx0aWYgKGsgPT09IGtleSkge1xuXHRcdFx0XHRcdGJhdGNoLnVuc2tpcF9lZmZlY3QoZWZmZWN0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRiYXRjaC5za2lwX2VmZmVjdChlZmZlY3QpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGZvciAoY29uc3QgW2ssIGJyYW5jaF0gb2YgdGhpcy4jb2Zmc2NyZWVuKSB7XG5cdFx0XHRcdGlmIChrID09PSBrZXkpIHtcblx0XHRcdFx0XHRiYXRjaC51bnNraXBfZWZmZWN0KGJyYW5jaC5lZmZlY3QpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGJhdGNoLnNraXBfZWZmZWN0KGJyYW5jaC5lZmZlY3QpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGJhdGNoLm9uY29tbWl0KHRoaXMuI2NvbW1pdCk7XG5cdFx0XHRiYXRjaC5vbmRpc2NhcmQodGhpcy4jZGlzY2FyZCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChoeWRyYXRpbmcpIHtcblx0XHRcdFx0dGhpcy5hbmNob3IgPSBoeWRyYXRlX25vZGU7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuI2NvbW1pdChiYXRjaCk7XG5cdFx0fVxuXHR9XG59XG4iLCIvKiogQGltcG9ydCB7IFNvdXJjZSwgVGVtcGxhdGVOb2RlIH0gZnJvbSAnI2NsaWVudCcgKi9cbmltcG9ydCB7IGlzX3Byb21pc2UgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0IHsgYmxvY2sgfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgaW50ZXJuYWxfc2V0LCBtdXRhYmxlX3NvdXJjZSwgc291cmNlIH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9zb3VyY2VzLmpzJztcbmltcG9ydCB7XG5cdGh5ZHJhdGVfbmV4dCxcblx0aHlkcmF0aW5nLFxuXHRza2lwX25vZGVzLFxuXHRzZXRfaHlkcmF0ZV9ub2RlLFxuXHRzZXRfaHlkcmF0aW5nLFxuXHRoeWRyYXRlX25vZGVcbn0gZnJvbSAnLi4vaHlkcmF0aW9uLmpzJztcbmltcG9ydCB7IHF1ZXVlX21pY3JvX3Rhc2sgfSBmcm9tICcuLi90YXNrLmpzJztcbmltcG9ydCB7IEhZRFJBVElPTl9TVEFSVF9FTFNFLCBVTklOSVRJQUxJWkVEIH0gZnJvbSAnLi4vLi4vLi4vLi4vY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IGlzX3J1bmVzIH0gZnJvbSAnLi4vLi4vY29udGV4dC5qcyc7XG5pbXBvcnQgeyBCYXRjaCwgY3VycmVudF9iYXRjaCwgZmx1c2hTeW5jLCBpc19mbHVzaGluZ19zeW5jIH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9iYXRjaC5qcyc7XG5pbXBvcnQgeyBCcmFuY2hNYW5hZ2VyIH0gZnJvbSAnLi9icmFuY2hlcy5qcyc7XG5pbXBvcnQgeyBjYXB0dXJlLCB1bnNldF9jb250ZXh0IH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9hc3luYy5qcyc7XG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcblxuY29uc3QgUEVORElORyA9IDA7XG5jb25zdCBUSEVOID0gMTtcbmNvbnN0IENBVENIID0gMjtcblxuLyoqIEB0eXBlZGVmIHt0eXBlb2YgUEVORElORyB8IHR5cGVvZiBUSEVOIHwgdHlwZW9mIENBVENIfSBBd2FpdFN0YXRlICovXG5cbi8qKlxuICogQHRlbXBsYXRlIFZcbiAqIEBwYXJhbSB7VGVtcGxhdGVOb2RlfSBub2RlXG4gKiBAcGFyYW0geygoKSA9PiBhbnkpfSBnZXRfaW5wdXRcbiAqIEBwYXJhbSB7bnVsbCB8ICgoYW5jaG9yOiBOb2RlKSA9PiB2b2lkKX0gcGVuZGluZ19mblxuICogQHBhcmFtIHtudWxsIHwgKChhbmNob3I6IE5vZGUsIHZhbHVlOiBTb3VyY2U8Vj4pID0+IHZvaWQpfSB0aGVuX2ZuXG4gKiBAcGFyYW0ge251bGwgfCAoKGFuY2hvcjogTm9kZSwgZXJyb3I6IHVua25vd24pID0+IHZvaWQpfSBjYXRjaF9mblxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhd2FpdF9ibG9jayhub2RlLCBnZXRfaW5wdXQsIHBlbmRpbmdfZm4sIHRoZW5fZm4sIGNhdGNoX2ZuKSB7XG5cdGlmIChoeWRyYXRpbmcpIHtcblx0XHRoeWRyYXRlX25leHQoKTtcblx0fVxuXG5cdHZhciBydW5lcyA9IGlzX3J1bmVzKCk7XG5cblx0dmFyIHYgPSAvKiogQHR5cGUge1Z9ICovIChVTklOSVRJQUxJWkVEKTtcblx0dmFyIHZhbHVlID0gcnVuZXMgPyBzb3VyY2UodikgOiBtdXRhYmxlX3NvdXJjZSh2LCBmYWxzZSwgZmFsc2UpO1xuXHR2YXIgZXJyb3IgPSBydW5lcyA/IHNvdXJjZSh2KSA6IG11dGFibGVfc291cmNlKHYsIGZhbHNlLCBmYWxzZSk7XG5cblx0aWYgKERFVikge1xuXHRcdHZhbHVlLmxhYmVsID0gJ3sjYXdhaXQgLi4ufSB2YWx1ZSc7XG5cdFx0ZXJyb3IubGFiZWwgPSAneyNhd2FpdCAuLi59IGVycm9yJztcblx0fVxuXG5cdHZhciBicmFuY2hlcyA9IG5ldyBCcmFuY2hNYW5hZ2VyKG5vZGUpO1xuXG5cdGJsb2NrKCgpID0+IHtcblx0XHR2YXIgYmF0Y2ggPSAvKiogQHR5cGUge0JhdGNofSAqLyAoY3VycmVudF9iYXRjaCk7XG5cdFx0dmFyIGlucHV0ID0gZ2V0X2lucHV0KCk7XG5cblx0XHR2YXIgZGVzdHJveWVkID0gZmFsc2U7XG5cblx0XHQvKiogV2hldGhlciBvciBub3QgdGhlcmUgd2FzIGEgaHlkcmF0aW9uIG1pc21hdGNoLiBOZWVkcyB0byBiZSBhIGBsZXRgIG9yIGVsc2UgaXQgaXNuJ3QgdHJlZXNoYWtlbiBvdXQgKi9cblx0XHQvLyBAdHMtaWdub3JlIGNvZXJjaW5nIGBub2RlYCB0byBhIGBDb21tZW50YCBjYXVzZXMgVHlwZVNjcmlwdCBhbmQgUHJldHRpZXIgdG8gZmlnaHRcblx0XHRsZXQgbWlzbWF0Y2ggPSBoeWRyYXRpbmcgJiYgaXNfcHJvbWlzZShpbnB1dCkgPT09IChub2RlLmRhdGEgPT09IEhZRFJBVElPTl9TVEFSVF9FTFNFKTtcblxuXHRcdGlmIChtaXNtYXRjaCkge1xuXHRcdFx0Ly8gSHlkcmF0aW9uIG1pc21hdGNoOiByZW1vdmUgZXZlcnl0aGluZyBpbnNpZGUgdGhlIGFuY2hvciBhbmQgc3RhcnQgZnJlc2hcblx0XHRcdHNldF9oeWRyYXRlX25vZGUoc2tpcF9ub2RlcygpKTtcblx0XHRcdHNldF9oeWRyYXRpbmcoZmFsc2UpO1xuXHRcdH1cblxuXHRcdGlmIChpc19wcm9taXNlKGlucHV0KSkge1xuXHRcdFx0dmFyIHJlc3RvcmUgPSBjYXB0dXJlKCk7XG5cdFx0XHR2YXIgcmVzb2x2ZWQgPSBmYWxzZTtcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBAcGFyYW0geygpID0+IHZvaWR9IGZuXG5cdFx0XHQgKi9cblx0XHRcdGNvbnN0IHJlc29sdmUgPSAoZm4pID0+IHtcblx0XHRcdFx0aWYgKGRlc3Ryb3llZCkgcmV0dXJuO1xuXG5cdFx0XHRcdHJlc29sdmVkID0gdHJ1ZTtcblx0XHRcdFx0Ly8gV2UgZG9uJ3Qgd2FudCB0byByZXN0b3JlIHRoZSBwcmV2aW91cyBiYXRjaCBoZXJlOyB7I2F3YWl0fSBibG9ja3MgZG9uJ3QgZm9sbG93IHRoZSBhc3luYyBsb2dpY1xuXHRcdFx0XHQvLyB3ZSBoYXZlIGVsc2V3aGVyZSwgaW5zdGVhZCBwZW5kaW5nL3Jlc29sdmUvZmFpbCBzdGF0ZXMgYXJlIGVhY2ggdGhlaXIgb3duIGJhdGNoIHNvIHRvIHNwZWFrLlxuXHRcdFx0XHRyZXN0b3JlKGZhbHNlKTtcblx0XHRcdFx0Ly8gLi4uYnV0IGl0IG1pZ2h0IHN0aWxsIGJlIHNldCBoZXJlLiBUaGF0IG1lYW5zIGEgYHNhdmUoLi4uKWAgaGFzIHJlc3RvcmVkIGl0IOKAlCBidXQgdGhhdCBiYXRjaCB3aWxsXG5cdFx0XHRcdC8vIGxpa2VseSBhbHJlYWR5IGhhdmUgYmVlbiBjb21taXR0ZWQgYnkgdGhlIHRpbWUgaXQgcmVzb2x2ZXMsIGFuZCB0aGlzIHJlc29sdmUgc2hvdWxkIGJlIHByb2Nlc3NlZFxuXHRcdFx0XHQvLyBpbiBhIHNlcGFyYXRlIGJhdGNoLiBXZSdyZSBub3QgdXNpbmcgYmF0Y2guZGVhY3RpdmF0ZSgpL2FjdGl2YXRlKCkgYWJvdmUgYmVjYXVzZSBnZXRfaW5wdXQoKVxuXHRcdFx0XHQvLyBjb3VsZCB3cml0ZSB0byBzb3VyY2VzLCB3aGljaCB3b3VsZCB0aGVuIGluY29ycmVjdGx5IGNyZWF0ZSBhIG5ldyBiYXRjaCBvciBjb3VsZCBtZXNzIHdpdGhcblx0XHRcdFx0Ly8gYXN5bmNfZGVyaXZlZCBleHBlY3RpbmcgYSBjdXJyZW50X2JhdGNoIHRvIGV4aXN0LlxuXHRcdFx0XHRpZiAoY3VycmVudF9iYXRjaCA9PT0gYmF0Y2gpIHtcblx0XHRcdFx0XHRiYXRjaC5kZWFjdGl2YXRlKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gTWFrZSBzdXJlIHdlIGhhdmUgYSBiYXRjaCwgc2luY2UgdGhlIGJyYW5jaCBtYW5hZ2VyIGV4cGVjdHMgb25lIHRvIGV4aXN0XG5cdFx0XHRcdEJhdGNoLmVuc3VyZSgpO1xuXG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Zm4oKTtcblx0XHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0XHR1bnNldF9jb250ZXh0KGZhbHNlKTtcblxuXHRcdFx0XHRcdC8vIHdpdGhvdXQgdGhpcywgdGhlIERPTSBkb2VzIG5vdCB1cGRhdGUgdW50aWwgdHdvIHRpY2tzIGFmdGVyIHRoZSBwcm9taXNlXG5cdFx0XHRcdFx0Ly8gcmVzb2x2ZXMsIHdoaWNoIGlzIHVuZXhwZWN0ZWQgYmVoYXZpb3VyIChhbmQgc29tZXdoYXQgaXJrc29tZSB0byB0ZXN0KVxuXHRcdFx0XHRcdGlmICghaXNfZmx1c2hpbmdfc3luYykgZmx1c2hTeW5jKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdGlucHV0LnRoZW4oXG5cdFx0XHRcdCh2KSA9PiB7XG5cdFx0XHRcdFx0cmVzb2x2ZSgoKSA9PiB7XG5cdFx0XHRcdFx0XHRpbnRlcm5hbF9zZXQodmFsdWUsIHYpO1xuXHRcdFx0XHRcdFx0YnJhbmNoZXMuZW5zdXJlKFRIRU4sIHRoZW5fZm4gJiYgKCh0YXJnZXQpID0+IHRoZW5fZm4odGFyZ2V0LCB2YWx1ZSkpKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSxcblx0XHRcdFx0KGUpID0+IHtcblx0XHRcdFx0XHRyZXNvbHZlKCgpID0+IHtcblx0XHRcdFx0XHRcdGludGVybmFsX3NldChlcnJvciwgZSk7XG5cdFx0XHRcdFx0XHRicmFuY2hlcy5lbnN1cmUoQ0FUQ0gsIGNhdGNoX2ZuICYmICgodGFyZ2V0KSA9PiBjYXRjaF9mbih0YXJnZXQsIGVycm9yKSkpO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWNhdGNoX2ZuKSB7XG5cdFx0XHRcdFx0XHRcdC8vIFJldGhyb3cgdGhlIGVycm9yIGlmIG5vIGNhdGNoIGJsb2NrIGV4aXN0c1xuXHRcdFx0XHRcdFx0XHR0aHJvdyBlcnJvci52O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXG5cdFx0XHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0XHRcdGJyYW5jaGVzLmVuc3VyZShQRU5ESU5HLCBwZW5kaW5nX2ZuKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFdhaXQgYSBtaWNyb3Rhc2sgYmVmb3JlIGNoZWNraW5nIGlmIHdlIHNob3VsZCBzaG93IHRoZSBwZW5kaW5nIHN0YXRlIGFzXG5cdFx0XHRcdC8vIHRoZSBwcm9taXNlIG1pZ2h0IGhhdmUgcmVzb2x2ZWQgYnkgdGhlblxuXHRcdFx0XHRxdWV1ZV9taWNyb190YXNrKCgpID0+IHtcblx0XHRcdFx0XHRpZiAoIXJlc29sdmVkKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0YnJhbmNoZXMuZW5zdXJlKFBFTkRJTkcsIHBlbmRpbmdfZm4pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aW50ZXJuYWxfc2V0KHZhbHVlLCBpbnB1dCk7XG5cdFx0XHRicmFuY2hlcy5lbnN1cmUoVEhFTiwgdGhlbl9mbiAmJiAoKHRhcmdldCkgPT4gdGhlbl9mbih0YXJnZXQsIHZhbHVlKSkpO1xuXHRcdH1cblxuXHRcdGlmIChtaXNtYXRjaCkge1xuXHRcdFx0Ly8gY29udGludWUgaW4gaHlkcmF0aW9uIG1vZGVcblx0XHRcdHNldF9oeWRyYXRpbmcodHJ1ZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICgpID0+IHtcblx0XHRcdGRlc3Ryb3llZCA9IHRydWU7XG5cdFx0fTtcblx0fSk7XG59XG4iLCIvKiogQGltcG9ydCB7IFRlbXBsYXRlTm9kZSB9IGZyb20gJyNjbGllbnQnICovXG5pbXBvcnQgeyBFRkZFQ1RfVFJBTlNQQVJFTlQgfSBmcm9tICcjY2xpZW50L2NvbnN0YW50cyc7XG5pbXBvcnQge1xuXHRoeWRyYXRlX25leHQsXG5cdGh5ZHJhdGluZyxcblx0cmVhZF9oeWRyYXRpb25faW5zdHJ1Y3Rpb24sXG5cdHNraXBfbm9kZXMsXG5cdHNldF9oeWRyYXRlX25vZGUsXG5cdHNldF9oeWRyYXRpbmcsXG5cdGh5ZHJhdGVfbm9kZVxufSBmcm9tICcuLi9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgYmxvY2sgfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgQnJhbmNoTWFuYWdlciB9IGZyb20gJy4vYnJhbmNoZXMuanMnO1xuXG4vKipcbiAqIEBwYXJhbSB7VGVtcGxhdGVOb2RlfSBub2RlXG4gKiBAcGFyYW0geyhicmFuY2g6IChmbjogKGFuY2hvcjogTm9kZSkgPT4gdm9pZCwga2V5PzogbnVtYmVyIHwgZmFsc2UpID0+IHZvaWQpID0+IHZvaWR9IGZuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtlbHNlaWZdIFRydWUgaWYgdGhpcyBpcyBhbiBgezplbHNlIGlmIC4uLn1gIGJsb2NrIHJhdGhlciB0aGFuIGFuIGB7I2lmIC4uLn1gLCBhcyB0aGF0IGFmZmVjdHMgd2hpY2ggdHJhbnNpdGlvbnMgYXJlIGNvbnNpZGVyZWQgJ2xvY2FsJ1xuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpZl9ibG9jayhub2RlLCBmbiwgZWxzZWlmID0gZmFsc2UpIHtcblx0LyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGUgfCB1bmRlZmluZWR9ICovXG5cdHZhciBtYXJrZXI7XG5cdGlmIChoeWRyYXRpbmcpIHtcblx0XHRtYXJrZXIgPSBoeWRyYXRlX25vZGU7XG5cdFx0aHlkcmF0ZV9uZXh0KCk7XG5cdH1cblxuXHR2YXIgYnJhbmNoZXMgPSBuZXcgQnJhbmNoTWFuYWdlcihub2RlKTtcblx0dmFyIGZsYWdzID0gZWxzZWlmID8gRUZGRUNUX1RSQU5TUEFSRU5UIDogMDtcblxuXHQvKipcblx0ICogQHBhcmFtIHtudW1iZXIgfCBmYWxzZX0ga2V5XG5cdCAqIEBwYXJhbSB7bnVsbCB8ICgoYW5jaG9yOiBOb2RlKSA9PiB2b2lkKX0gZm5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZV9icmFuY2goa2V5LCBmbikge1xuXHRcdGlmIChoeWRyYXRpbmcpIHtcblx0XHRcdHZhciBkYXRhID0gcmVhZF9oeWRyYXRpb25faW5zdHJ1Y3Rpb24oLyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGV9ICovIChtYXJrZXIpKTtcblxuXHRcdFx0Ly8gXCJbblwiID0gYnJhbmNoIG4sIFwiWy0xXCIgPSBlbHNlXG5cdFx0XHRpZiAoa2V5ICE9PSBwYXJzZUludChkYXRhLnN1YnN0cmluZygxKSkpIHtcblx0XHRcdFx0Ly8gSHlkcmF0aW9uIG1pc21hdGNoOiByZW1vdmUgZXZlcnl0aGluZyBpbnNpZGUgdGhlIGFuY2hvciBhbmQgc3RhcnQgZnJlc2guXG5cdFx0XHRcdC8vIFRoaXMgY291bGQgaGFwcGVuIHdpdGggYHsjaWYgYnJvd3Nlcn0uLi57L2lmfWAsIGZvciBleGFtcGxlXG5cdFx0XHRcdHZhciBhbmNob3IgPSBza2lwX25vZGVzKCk7XG5cblx0XHRcdFx0c2V0X2h5ZHJhdGVfbm9kZShhbmNob3IpO1xuXHRcdFx0XHRicmFuY2hlcy5hbmNob3IgPSBhbmNob3I7XG5cblx0XHRcdFx0c2V0X2h5ZHJhdGluZyhmYWxzZSk7XG5cdFx0XHRcdGJyYW5jaGVzLmVuc3VyZShrZXksIGZuKTtcblx0XHRcdFx0c2V0X2h5ZHJhdGluZyh0cnVlKTtcblxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0YnJhbmNoZXMuZW5zdXJlKGtleSwgZm4pO1xuXHR9XG5cblx0YmxvY2soKCkgPT4ge1xuXHRcdHZhciBoYXNfYnJhbmNoID0gZmFsc2U7XG5cblx0XHRmbigoZm4sIGtleSA9IDApID0+IHtcblx0XHRcdGhhc19icmFuY2ggPSB0cnVlO1xuXHRcdFx0dXBkYXRlX2JyYW5jaChrZXksIGZuKTtcblx0XHR9KTtcblxuXHRcdGlmICghaGFzX2JyYW5jaCkge1xuXHRcdFx0dXBkYXRlX2JyYW5jaCgtMSwgbnVsbCk7XG5cdFx0fVxuXHR9LCBmbGFncyk7XG59XG4iLCIvKiogQGltcG9ydCB7IFRlbXBsYXRlTm9kZSB9IGZyb20gJyNjbGllbnQnICovXG5pbXBvcnQgeyBpc19ydW5lcyB9IGZyb20gJy4uLy4uL2NvbnRleHQuanMnO1xuaW1wb3J0IHsgYmxvY2sgfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgaHlkcmF0ZV9uZXh0LCBoeWRyYXRpbmcgfSBmcm9tICcuLi9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgQnJhbmNoTWFuYWdlciB9IGZyb20gJy4vYnJhbmNoZXMuanMnO1xuXG5jb25zdCBOQU4gPSBTeW1ib2woJ05hTicpO1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge1RlbXBsYXRlTm9kZX0gbm9kZVxuICogQHBhcmFtIHsoKSA9PiBWfSBnZXRfa2V5XG4gKiBAcGFyYW0geyhhbmNob3I6IE5vZGUpID0+IFRlbXBsYXRlTm9kZSB8IHZvaWR9IHJlbmRlcl9mblxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBrZXkobm9kZSwgZ2V0X2tleSwgcmVuZGVyX2ZuKSB7XG5cdGlmIChoeWRyYXRpbmcpIHtcblx0XHRoeWRyYXRlX25leHQoKTtcblx0fVxuXG5cdHZhciBicmFuY2hlcyA9IG5ldyBCcmFuY2hNYW5hZ2VyKG5vZGUpO1xuXG5cdHZhciBsZWdhY3kgPSAhaXNfcnVuZXMoKTtcblxuXHRibG9jaygoKSA9PiB7XG5cdFx0dmFyIGtleSA9IGdldF9rZXkoKTtcblxuXHRcdC8vIE5hTiAhPT0gTmFOLCBoZW5jZSB3ZSBkbyB0aGlzIHdvcmthcm91bmQgdG8gbm90IHRyaWdnZXIgcmVtb3VudHMgdW5uZWNlc3NhcmlseVxuXHRcdGlmIChrZXkgIT09IGtleSkge1xuXHRcdFx0a2V5ID0gLyoqIEB0eXBlIHthbnl9ICovIChOQU4pO1xuXHRcdH1cblxuXHRcdC8vIGtleSBibG9ja3MgaW4gU3ZlbHRlIDw1IGhhZCBzdHVwaWQgc2VtYW50aWNzXG5cdFx0aWYgKGxlZ2FjeSAmJiBrZXkgIT09IG51bGwgJiYgdHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGtleSA9IC8qKiBAdHlwZSB7Vn0gKi8gKHt9KTtcblx0XHR9XG5cblx0XHRicmFuY2hlcy5lbnN1cmUoa2V5LCByZW5kZXJfZm4pO1xuXHR9KTtcbn1cbiIsImltcG9ydCB7IHJlbmRlcl9lZmZlY3QgfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgaHlkcmF0aW5nLCBzZXRfaHlkcmF0ZV9ub2RlIH0gZnJvbSAnLi4vaHlkcmF0aW9uLmpzJztcbmltcG9ydCB7IGdldF9maXJzdF9jaGlsZCB9IGZyb20gJy4uL29wZXJhdGlvbnMuanMnO1xuXG4vKipcbiAqIEBwYXJhbSB7SFRNTERpdkVsZW1lbnQgfCBTVkdHRWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHsoKSA9PiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSBnZXRfc3R5bGVzXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNzc19wcm9wcyhlbGVtZW50LCBnZXRfc3R5bGVzKSB7XG5cdGlmIChoeWRyYXRpbmcpIHtcblx0XHRzZXRfaHlkcmF0ZV9ub2RlKGdldF9maXJzdF9jaGlsZChlbGVtZW50KSk7XG5cdH1cblxuXHRyZW5kZXJfZWZmZWN0KCgpID0+IHtcblx0XHR2YXIgc3R5bGVzID0gZ2V0X3N0eWxlcygpO1xuXG5cdFx0Zm9yICh2YXIga2V5IGluIHN0eWxlcykge1xuXHRcdFx0dmFyIHZhbHVlID0gc3R5bGVzW2tleV07XG5cblx0XHRcdGlmICh2YWx1ZSA9PSBudWxsIHx8IHZhbHVlID09PSAnJykge1xuXHRcdFx0XHRlbGVtZW50LnN0eWxlLnJlbW92ZVByb3BlcnR5KGtleSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRlbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59XG4iLCIvKiogQGltcG9ydCB7IEVhY2hJdGVtLCBFYWNoT3V0cm9Hcm91cCwgRWFjaFN0YXRlLCBFZmZlY3QsIEVmZmVjdE5vZGVzLCBNYXliZVNvdXJjZSwgVGVtcGxhdGVOb2RlLCBUcmFuc2l0aW9uTWFuYWdlciB9IGZyb20gJyNjbGllbnQnICovXG4vKiogQGltcG9ydCB7IEJhdGNoIH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9iYXRjaC5qcyc7ICovXG5pbXBvcnQge1xuXHRFQUNIX0lOREVYX1JFQUNUSVZFLFxuXHRFQUNIX0lTX0FOSU1BVEVELFxuXHRFQUNIX0lTX0NPTlRST0xMRUQsXG5cdEVBQ0hfSVRFTV9JTU1VVEFCTEUsXG5cdEVBQ0hfSVRFTV9SRUFDVElWRSxcblx0SFlEUkFUSU9OX0VORCxcblx0SFlEUkFUSU9OX1NUQVJUX0VMU0Vcbn0gZnJvbSAnLi4vLi4vLi4vLi4vY29uc3RhbnRzLmpzJztcbmltcG9ydCB7XG5cdGh5ZHJhdGVfbmV4dCxcblx0aHlkcmF0ZV9ub2RlLFxuXHRoeWRyYXRpbmcsXG5cdHJlYWRfaHlkcmF0aW9uX2luc3RydWN0aW9uLFxuXHRza2lwX25vZGVzLFxuXHRzZXRfaHlkcmF0ZV9ub2RlLFxuXHRzZXRfaHlkcmF0aW5nXG59IGZyb20gJy4uL2h5ZHJhdGlvbi5qcyc7XG5pbXBvcnQge1xuXHRjbGVhcl90ZXh0X2NvbnRlbnQsXG5cdGNyZWF0ZV90ZXh0LFxuXHRnZXRfZmlyc3RfY2hpbGQsXG5cdGdldF9uZXh0X3NpYmxpbmcsXG5cdHNob3VsZF9kZWZlcl9hcHBlbmRcbn0gZnJvbSAnLi4vb3BlcmF0aW9ucy5qcyc7XG5pbXBvcnQge1xuXHRibG9jayxcblx0YnJhbmNoLFxuXHRkZXN0cm95X2VmZmVjdCxcblx0bW92ZV9lZmZlY3QsXG5cdHBhdXNlX2VmZmVjdCxcblx0cmVzdW1lX2VmZmVjdFxufSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgc291cmNlLCBtdXRhYmxlX3NvdXJjZSwgaW50ZXJuYWxfc2V0IH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9zb3VyY2VzLmpzJztcbmltcG9ydCB7IGFycmF5X2Zyb20sIGlzX2FycmF5IH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzLmpzJztcbmltcG9ydCB7IEJSQU5DSF9FRkZFQ1QsIENPTU1FTlRfTk9ERSwgREVTVFJPWUVELCBFRkZFQ1RfT0ZGU0NSRUVOLCBJTkVSVCB9IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcbmltcG9ydCB7IHF1ZXVlX21pY3JvX3Rhc2sgfSBmcm9tICcuLi90YXNrLmpzJztcbmltcG9ydCB7IGdldCB9IGZyb20gJy4uLy4uL3J1bnRpbWUuanMnO1xuaW1wb3J0IHsgREVWIH0gZnJvbSAnZXNtLWVudic7XG5pbXBvcnQgeyBkZXJpdmVkX3NhZmVfZXF1YWwgfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2Rlcml2ZWRzLmpzJztcbmltcG9ydCB7IGN1cnJlbnRfYmF0Y2ggfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2JhdGNoLmpzJztcbmltcG9ydCAqIGFzIGUgZnJvbSAnLi4vLi4vZXJyb3JzLmpzJztcbmltcG9ydCB7IHRhZyB9IGZyb20gJy4uLy4uL2Rldi90cmFjaW5nLmpzJztcblxuLy8gV2hlbiBtYWtpbmcgc3Vic3RhbnRpdmUgY2hhbmdlcyB0byB0aGlzIGZpbGUsIHZhbGlkYXRlIHRoZW0gd2l0aCB0aGUgZWFjaCBibG9jayBzdHJlc3MgdGVzdDpcbi8vIGh0dHBzOi8vc3ZlbHRlLmRldi9wbGF5Z3JvdW5kLzE5NzJiMmNmNDY1NjQ0NzZhZDhjOGM2NDA1YjIzYjdiXG4vLyBUaGlzIHRlc3QgYWxzbyBleGlzdHMgaW4gdGhpcyByZXBvLCBhcyBgcGFja2FnZXMvc3ZlbHRlL3Rlc3RzL21hbnVhbC9lYWNoLXN0cmVzcy10ZXN0YFxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBfXG4gKiBAcGFyYW0ge251bWJlcn0gaVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5kZXgoXywgaSkge1xuXHRyZXR1cm4gaTtcbn1cblxuLyoqXG4gKiBQYXVzZSBtdWx0aXBsZSBlZmZlY3RzIHNpbXVsdGFuZW91c2x5LCBhbmQgY29vcmRpbmF0ZSB0aGVpclxuICogc3Vic2VxdWVudCBkZXN0cnVjdGlvbi4gVXNlZCBpbiBlYWNoIGJsb2Nrc1xuICogQHBhcmFtIHtFYWNoU3RhdGV9IHN0YXRlXG4gKiBAcGFyYW0ge0VmZmVjdFtdfSB0b19kZXN0cm95XG4gKiBAcGFyYW0ge251bGwgfCBOb2RlfSBjb250cm9sbGVkX2FuY2hvclxuICovXG5mdW5jdGlvbiBwYXVzZV9lZmZlY3RzKHN0YXRlLCB0b19kZXN0cm95LCBjb250cm9sbGVkX2FuY2hvcikge1xuXHQvKiogQHR5cGUge1RyYW5zaXRpb25NYW5hZ2VyW119ICovXG5cdHZhciB0cmFuc2l0aW9ucyA9IFtdO1xuXHR2YXIgbGVuZ3RoID0gdG9fZGVzdHJveS5sZW5ndGg7XG5cblx0LyoqIEB0eXBlIHtFYWNoT3V0cm9Hcm91cH0gKi9cblx0dmFyIGdyb3VwO1xuXHR2YXIgcmVtYWluaW5nID0gdG9fZGVzdHJveS5sZW5ndGg7XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdGxldCBlZmZlY3QgPSB0b19kZXN0cm95W2ldO1xuXG5cdFx0cGF1c2VfZWZmZWN0KFxuXHRcdFx0ZWZmZWN0LFxuXHRcdFx0KCkgPT4ge1xuXHRcdFx0XHRpZiAoZ3JvdXApIHtcblx0XHRcdFx0XHRncm91cC5wZW5kaW5nLmRlbGV0ZShlZmZlY3QpO1xuXHRcdFx0XHRcdGdyb3VwLmRvbmUuYWRkKGVmZmVjdCk7XG5cblx0XHRcdFx0XHRpZiAoZ3JvdXAucGVuZGluZy5zaXplID09PSAwKSB7XG5cdFx0XHRcdFx0XHR2YXIgZ3JvdXBzID0gLyoqIEB0eXBlIHtTZXQ8RWFjaE91dHJvR3JvdXA+fSAqLyAoc3RhdGUub3V0cm9ncm91cHMpO1xuXG5cdFx0XHRcdFx0XHRkZXN0cm95X2VmZmVjdHMoc3RhdGUsIGFycmF5X2Zyb20oZ3JvdXAuZG9uZSkpO1xuXHRcdFx0XHRcdFx0Z3JvdXBzLmRlbGV0ZShncm91cCk7XG5cblx0XHRcdFx0XHRcdGlmIChncm91cHMuc2l6ZSA9PT0gMCkge1xuXHRcdFx0XHRcdFx0XHRzdGF0ZS5vdXRyb2dyb3VwcyA9IG51bGw7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJlbWFpbmluZyAtPSAxO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZmFsc2Vcblx0XHQpO1xuXHR9XG5cblx0aWYgKHJlbWFpbmluZyA9PT0gMCkge1xuXHRcdC8vIElmIHdlJ3JlIGluIGEgY29udHJvbGxlZCBlYWNoIGJsb2NrIChpLmUuIHRoZSBibG9jayBpcyB0aGUgb25seSBjaGlsZCBvZiBhblxuXHRcdC8vIGVsZW1lbnQpLCBhbmQgd2UgYXJlIHJlbW92aW5nIGFsbCBpdGVtcywgX2FuZF8gdGhlcmUgYXJlIG5vIG91dCB0cmFuc2l0aW9ucyxcblx0XHQvLyB3ZSBjYW4gdXNlIHRoZSBmYXN0IHBhdGgg4oCUIGVtcHR5aW5nIHRoZSBlbGVtZW50IGFuZCByZXBsYWNpbmcgdGhlIGFuY2hvci5cblx0XHQvLyBTa2lwIHRoZSBmYXN0IHBhdGggd2hlbiBhbm90aGVyIGJhdGNoIGlzIHN0aWxsIHBlbmRpbmcgb24gdGhpcyBlYWNoIGJsb2NrOlxuXHRcdC8vIHRoYXQgYmF0Y2gncyBrZXlzIHN0aWxsIHJlZmVyZW5jZSBFYWNoSXRlbXMgaW4gYHN0YXRlLml0ZW1zYCwgd2hpY2hcblx0XHQvLyBgZGVzdHJveV9lZmZlY3RzYCBuZWVkcyB0byBwcmVzZXJ2ZSBvZmZzY3JlZW4gKHNlZSAjMTg2MTApLlxuXHRcdHZhciBmYXN0X3BhdGggPVxuXHRcdFx0dHJhbnNpdGlvbnMubGVuZ3RoID09PSAwICYmIGNvbnRyb2xsZWRfYW5jaG9yICE9PSBudWxsICYmIHN0YXRlLnBlbmRpbmcuc2l6ZSA9PT0gMDtcblxuXHRcdGlmIChmYXN0X3BhdGgpIHtcblx0XHRcdHZhciBhbmNob3IgPSAvKiogQHR5cGUge0VsZW1lbnR9ICovIChjb250cm9sbGVkX2FuY2hvcik7XG5cdFx0XHR2YXIgcGFyZW50X25vZGUgPSAvKiogQHR5cGUge0VsZW1lbnR9ICovIChhbmNob3IucGFyZW50Tm9kZSk7XG5cblx0XHRcdGNsZWFyX3RleHRfY29udGVudChwYXJlbnRfbm9kZSk7XG5cdFx0XHRwYXJlbnRfbm9kZS5hcHBlbmQoYW5jaG9yKTtcblxuXHRcdFx0c3RhdGUuaXRlbXMuY2xlYXIoKTtcblx0XHR9XG5cblx0XHRkZXN0cm95X2VmZmVjdHMoc3RhdGUsIHRvX2Rlc3Ryb3ksICFmYXN0X3BhdGgpO1xuXHR9IGVsc2Uge1xuXHRcdGdyb3VwID0ge1xuXHRcdFx0cGVuZGluZzogbmV3IFNldCh0b19kZXN0cm95KSxcblx0XHRcdGRvbmU6IG5ldyBTZXQoKVxuXHRcdH07XG5cblx0XHQoc3RhdGUub3V0cm9ncm91cHMgPz89IG5ldyBTZXQoKSkuYWRkKGdyb3VwKTtcblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7RWFjaFN0YXRlfSBzdGF0ZVxuICogQHBhcmFtIHtFZmZlY3RbXX0gdG9fZGVzdHJveVxuICogQHBhcmFtIHtib29sZWFufSByZW1vdmVfZG9tXG4gKi9cbmZ1bmN0aW9uIGRlc3Ryb3lfZWZmZWN0cyhzdGF0ZSwgdG9fZGVzdHJveSwgcmVtb3ZlX2RvbSA9IHRydWUpIHtcblx0LyoqIEB0eXBlIHtTZXQ8RWZmZWN0PiB8IHVuZGVmaW5lZH0gKi9cblx0dmFyIHByZXNlcnZlZF9lZmZlY3RzO1xuXG5cdC8vIFRoZSBsb29wLWluLWEtbG9vcCBpc24ndCBpZGVhbCwgYnV0IHdlIHNob3VsZCBvbmx5IGhpdCB0aGlzIGluIHJlbGF0aXZlbHkgcmFyZSBjYXNlc1xuXHRpZiAoc3RhdGUucGVuZGluZy5zaXplID4gMCkge1xuXHRcdHByZXNlcnZlZF9lZmZlY3RzID0gbmV3IFNldCgpO1xuXG5cdFx0Zm9yIChjb25zdCBrZXlzIG9mIHN0YXRlLnBlbmRpbmcudmFsdWVzKCkpIHtcblx0XHRcdGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcblx0XHRcdFx0cHJlc2VydmVkX2VmZmVjdHMuYWRkKC8qKiBAdHlwZSB7RWFjaEl0ZW19ICovIChzdGF0ZS5pdGVtcy5nZXQoa2V5KSkuZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0b19kZXN0cm95Lmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGUgPSB0b19kZXN0cm95W2ldO1xuXG5cdFx0aWYgKHByZXNlcnZlZF9lZmZlY3RzPy5oYXMoZSkpIHtcblx0XHRcdGUuZiB8PSBFRkZFQ1RfT0ZGU0NSRUVOO1xuXG5cdFx0XHRjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRcdG1vdmVfZWZmZWN0KGUsIGZyYWdtZW50KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVzdHJveV9lZmZlY3QodG9fZGVzdHJveVtpXSwgcmVtb3ZlX2RvbSk7XG5cdFx0fVxuXHR9XG59XG5cbi8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqL1xudmFyIG9mZnNjcmVlbl9hbmNob3I7XG5cbi8qKlxuICogQHRlbXBsYXRlIFZcbiAqIEBwYXJhbSB7RWxlbWVudCB8IENvbW1lbnR9IG5vZGUgVGhlIG5leHQgc2libGluZyBub2RlLCBvciB0aGUgcGFyZW50IG5vZGUgaWYgdGhpcyBpcyBhICdjb250cm9sbGVkJyBibG9ja1xuICogQHBhcmFtIHtudW1iZXJ9IGZsYWdzXG4gKiBAcGFyYW0geygpID0+IFZbXX0gZ2V0X2NvbGxlY3Rpb25cbiAqIEBwYXJhbSB7KHZhbHVlOiBWLCBpbmRleDogbnVtYmVyKSA9PiBhbnl9IGdldF9rZXlcbiAqIEBwYXJhbSB7KGFuY2hvcjogTm9kZSwgaXRlbTogTWF5YmVTb3VyY2U8Vj4sIGluZGV4OiBNYXliZVNvdXJjZTxudW1iZXI+KSA9PiB2b2lkfSByZW5kZXJfZm5cbiAqIEBwYXJhbSB7bnVsbCB8ICgoYW5jaG9yOiBOb2RlKSA9PiB2b2lkKX0gZmFsbGJhY2tfZm5cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWFjaChub2RlLCBmbGFncywgZ2V0X2NvbGxlY3Rpb24sIGdldF9rZXksIHJlbmRlcl9mbiwgZmFsbGJhY2tfZm4gPSBudWxsKSB7XG5cdHZhciBhbmNob3IgPSBub2RlO1xuXG5cdC8qKiBAdHlwZSB7TWFwPGFueSwgRWFjaEl0ZW0+fSAqL1xuXHR2YXIgaXRlbXMgPSBuZXcgTWFwKCk7XG5cblx0dmFyIGlzX2NvbnRyb2xsZWQgPSAoZmxhZ3MgJiBFQUNIX0lTX0NPTlRST0xMRUQpICE9PSAwO1xuXG5cdGlmIChpc19jb250cm9sbGVkKSB7XG5cdFx0dmFyIHBhcmVudF9ub2RlID0gLyoqIEB0eXBlIHtFbGVtZW50fSAqLyAobm9kZSk7XG5cblx0XHRhbmNob3IgPSBoeWRyYXRpbmdcblx0XHRcdD8gc2V0X2h5ZHJhdGVfbm9kZShnZXRfZmlyc3RfY2hpbGQocGFyZW50X25vZGUpKVxuXHRcdFx0OiBwYXJlbnRfbm9kZS5hcHBlbmRDaGlsZChjcmVhdGVfdGV4dCgpKTtcblx0fVxuXG5cdGlmIChoeWRyYXRpbmcpIHtcblx0XHRoeWRyYXRlX25leHQoKTtcblx0fVxuXG5cdC8qKiBAdHlwZSB7RWZmZWN0IHwgbnVsbH0gKi9cblx0dmFyIGZhbGxiYWNrID0gbnVsbDtcblxuXHQvLyBUT0RPOiBpZGVhbGx5IHdlIGNvdWxkIHVzZSBkZXJpdmVkIGZvciBydW5lcyBtb2RlIGJ1dCBiZWNhdXNlIG9mIHRoZSBhYmlsaXR5XG5cdC8vIHRvIHVzZSBhIHN0b3JlIHdoaWNoIGNhbiBiZSBtdXRhdGVkLCB3ZSBjYW4ndCBkbyB0aGF0IGhlcmUgYXMgbXV0YXRpbmcgYSBzdG9yZVxuXHQvLyB3aWxsIHN0aWxsIHJlc3VsdCBpbiB0aGUgY29sbGVjdGlvbiBhcnJheSBiZWluZyB0aGUgc2FtZSBmcm9tIHRoZSBzdG9yZVxuXHR2YXIgZWFjaF9hcnJheSA9IGRlcml2ZWRfc2FmZV9lcXVhbCgoKSA9PiB7XG5cdFx0dmFyIGNvbGxlY3Rpb24gPSBnZXRfY29sbGVjdGlvbigpO1xuXG5cdFx0cmV0dXJuIC8qKiBAdHlwZSB7VltdfSAqLyAoXG5cdFx0XHRpc19hcnJheShjb2xsZWN0aW9uKSA/IGNvbGxlY3Rpb24gOiBjb2xsZWN0aW9uID09IG51bGwgPyBbXSA6IGFycmF5X2Zyb20oY29sbGVjdGlvbilcblx0XHQpO1xuXHR9KTtcblxuXHRpZiAoREVWKSB7XG5cdFx0dGFnKGVhY2hfYXJyYXksICd7I2VhY2ggLi4ufScpO1xuXHR9XG5cblx0LyoqIEB0eXBlIHtNYXA8QmF0Y2gsIFNldDxhbnk+Pn0gKi9cblx0dmFyIHBlbmRpbmcgPSBuZXcgTWFwKCk7XG5cblx0dmFyIGZpcnN0X3J1biA9IHRydWU7XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7QmF0Y2h9IGJhdGNoXG5cdCAqL1xuXHRmdW5jdGlvbiBjb21taXQoYmF0Y2gpIHtcblx0XHRpZiAoKHN0YXRlLmVmZmVjdC5mICYgREVTVFJPWUVEKSAhPT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHN0YXRlLnBlbmRpbmcuZGVsZXRlKGJhdGNoKTtcblxuXHRcdC8vIFRoZSBlZmZlY3QgZG9lc24ndCBuZWNlc3NhcmlseSByZS1ydW4gaW4gYSBiYXRjaCByaWdodCBiZWZvcmUgdGhhdCBiYXRjaCBjb21taXRzXG5cdFx0Ly8gKGl0cyB2aWV3IG9mIHRoZSBjb2xsZWN0aW9uIG1heSBub3QgaGF2ZSBjaGFuZ2VkKSwgc28gd2UgcmVhZCB0aGUgY29sbGVjdGlvblxuXHRcdC8vIGFzIHRoZSBjb21taXR0aW5nIGJhdGNoIHNlZXMgaXQgcmF0aGVyIHRoYW4gdXNpbmcgdGhlIG1vc3QgcmVjZW50IGJsb2NrIHJ1bidzIHJlc3VsdFxuXHRcdHZhciBhcnJheSA9IGdldChlYWNoX2FycmF5KTtcblxuXHRcdHN0YXRlLmZhbGxiYWNrID0gZmFsbGJhY2s7XG5cdFx0cmVjb25jaWxlKHN0YXRlLCBhcnJheSwgYW5jaG9yLCBmbGFncywgZ2V0X2tleSk7XG5cblx0XHRpZiAoZmFsbGJhY2sgIT09IG51bGwpIHtcblx0XHRcdGlmIChhcnJheS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0aWYgKChmYWxsYmFjay5mICYgRUZGRUNUX09GRlNDUkVFTikgPT09IDApIHtcblx0XHRcdFx0XHRyZXN1bWVfZWZmZWN0KGZhbGxiYWNrKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRmYWxsYmFjay5mIF49IEVGRkVDVF9PRkZTQ1JFRU47XG5cdFx0XHRcdFx0bW92ZShmYWxsYmFjaywgbnVsbCwgYW5jaG9yKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF1c2VfZWZmZWN0KGZhbGxiYWNrLCAoKSA9PiB7XG5cdFx0XHRcdFx0Ly8gVE9ETyBvbmx5IG51bGwgb3V0IGlmIG5vIHBlbmRpbmcgYmF0Y2ggbmVlZHMgaXQsXG5cdFx0XHRcdFx0Ly8gb3RoZXJ3aXNlIHJlLWFkZCBgZmFsbGJhY2suZnJhZ21lbnRgIGFuZCBtb3ZlIHRoZVxuXHRcdFx0XHRcdC8vIGVmZmVjdCBpbnRvIGl0XG5cdFx0XHRcdFx0ZmFsbGJhY2sgPSBudWxsO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIHtCYXRjaH0gYmF0Y2hcblx0ICovXG5cdGZ1bmN0aW9uIGRpc2NhcmQoYmF0Y2gpIHtcblx0XHRzdGF0ZS5wZW5kaW5nLmRlbGV0ZShiYXRjaCk7XG5cdH1cblxuXHR2YXIgZWZmZWN0ID0gYmxvY2soKCkgPT4ge1xuXHRcdHZhciBhcnJheSA9IC8qKiBAdHlwZSB7VltdfSAqLyAoZ2V0KGVhY2hfYXJyYXkpKTtcblx0XHR2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG5cdFx0LyoqIGB0cnVlYCBpZiB0aGVyZSB3YXMgYSBoeWRyYXRpb24gbWlzbWF0Y2guIE5lZWRzIHRvIGJlIGEgYGxldGAgb3IgZWxzZSBpdCBpc24ndCB0cmVlc2hha2VuIG91dCAqL1xuXHRcdGxldCBtaXNtYXRjaCA9IGZhbHNlO1xuXG5cdFx0aWYgKGh5ZHJhdGluZykge1xuXHRcdFx0dmFyIGlzX2Vsc2UgPSByZWFkX2h5ZHJhdGlvbl9pbnN0cnVjdGlvbihhbmNob3IpID09PSBIWURSQVRJT05fU1RBUlRfRUxTRTtcblxuXHRcdFx0aWYgKGlzX2Vsc2UgIT09IChsZW5ndGggPT09IDApKSB7XG5cdFx0XHRcdC8vIGh5ZHJhdGlvbiBtaXNtYXRjaCDigJQgcmVtb3ZlIHRoZSBzZXJ2ZXItcmVuZGVyZWQgRE9NIGFuZCBzdGFydCBvdmVyXG5cdFx0XHRcdGFuY2hvciA9IHNraXBfbm9kZXMoKTtcblxuXHRcdFx0XHRzZXRfaHlkcmF0ZV9ub2RlKGFuY2hvcik7XG5cdFx0XHRcdHNldF9oeWRyYXRpbmcoZmFsc2UpO1xuXHRcdFx0XHRtaXNtYXRjaCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dmFyIGtleXMgPSBuZXcgU2V0KCk7XG5cdFx0dmFyIGJhdGNoID0gLyoqIEB0eXBlIHtCYXRjaH0gKi8gKGN1cnJlbnRfYmF0Y2gpO1xuXHRcdHZhciBkZWZlciA9IHNob3VsZF9kZWZlcl9hcHBlbmQoKTtcblxuXHRcdGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcblx0XHRcdGlmIChcblx0XHRcdFx0aHlkcmF0aW5nICYmXG5cdFx0XHRcdGh5ZHJhdGVfbm9kZS5ub2RlVHlwZSA9PT0gQ09NTUVOVF9OT0RFICYmXG5cdFx0XHRcdC8qKiBAdHlwZSB7Q29tbWVudH0gKi8gKGh5ZHJhdGVfbm9kZSkuZGF0YSA9PT0gSFlEUkFUSU9OX0VORFxuXHRcdFx0KSB7XG5cdFx0XHRcdC8vIFRoZSBzZXJ2ZXIgcmVuZGVyZWQgZmV3ZXIgaXRlbXMgdGhhbiBleHBlY3RlZCxcblx0XHRcdFx0Ly8gc28gYnJlYWsgb3V0IGFuZCBjb250aW51ZSBhcHBlbmRpbmcgbm9uLWh5ZHJhdGVkIGl0ZW1zXG5cdFx0XHRcdGFuY2hvciA9IC8qKiBAdHlwZSB7Q29tbWVudH0gKi8gKGh5ZHJhdGVfbm9kZSk7XG5cdFx0XHRcdG1pc21hdGNoID0gdHJ1ZTtcblx0XHRcdFx0c2V0X2h5ZHJhdGluZyhmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciB2YWx1ZSA9IGFycmF5W2luZGV4XTtcblx0XHRcdHZhciBrZXkgPSBnZXRfa2V5KHZhbHVlLCBpbmRleCk7XG5cblx0XHRcdGlmIChERVYpIHtcblx0XHRcdFx0Ly8gQ2hlY2sgdGhhdCB0aGUga2V5IGZ1bmN0aW9uIGlzIGlkZW1wb3RlbnQgKHJldHVybnMgdGhlIHNhbWUgdmFsdWUgd2hlbiBjYWxsZWQgdHdpY2UpXG5cdFx0XHRcdHZhciBrZXlfYWdhaW4gPSBnZXRfa2V5KHZhbHVlLCBpbmRleCk7XG5cdFx0XHRcdGlmIChrZXkgIT09IGtleV9hZ2Fpbikge1xuXHRcdFx0XHRcdGUuZWFjaF9rZXlfdm9sYXRpbGUoU3RyaW5nKGluZGV4KSwgU3RyaW5nKGtleSksIFN0cmluZyhrZXlfYWdhaW4pKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaXRlbSA9IGZpcnN0X3J1biA/IG51bGwgOiBpdGVtcy5nZXQoa2V5KTtcblxuXHRcdFx0aWYgKGl0ZW0pIHtcblx0XHRcdFx0Ly8gdXBkYXRlIGJlZm9yZSByZWNvbmNpbGlhdGlvbiwgdG8gdHJpZ2dlciBhbnkgYXN5bmMgdXBkYXRlc1xuXHRcdFx0XHRpZiAoaXRlbS52KSBpbnRlcm5hbF9zZXQoaXRlbS52LCB2YWx1ZSk7XG5cdFx0XHRcdGlmIChpdGVtLmkpIGludGVybmFsX3NldChpdGVtLmksIGluZGV4KTtcblxuXHRcdFx0XHRpZiAoZGVmZXIpIHtcblx0XHRcdFx0XHRiYXRjaC51bnNraXBfZWZmZWN0KGl0ZW0uZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGl0ZW0gPSBjcmVhdGVfaXRlbShcblx0XHRcdFx0XHRpdGVtcyxcblx0XHRcdFx0XHRmaXJzdF9ydW4gPyBhbmNob3IgOiAob2Zmc2NyZWVuX2FuY2hvciA/Pz0gY3JlYXRlX3RleHQoKSksXG5cdFx0XHRcdFx0dmFsdWUsXG5cdFx0XHRcdFx0a2V5LFxuXHRcdFx0XHRcdGluZGV4LFxuXHRcdFx0XHRcdHJlbmRlcl9mbixcblx0XHRcdFx0XHRmbGFncyxcblx0XHRcdFx0XHRnZXRfY29sbGVjdGlvblxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGlmICghZmlyc3RfcnVuKSB7XG5cdFx0XHRcdFx0aXRlbS5lLmYgfD0gRUZGRUNUX09GRlNDUkVFTjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGl0ZW1zLnNldChrZXksIGl0ZW0pO1xuXHRcdFx0fVxuXG5cdFx0XHRrZXlzLmFkZChrZXkpO1xuXHRcdH1cblxuXHRcdGlmIChsZW5ndGggPT09IDAgJiYgZmFsbGJhY2tfZm4gJiYgIWZhbGxiYWNrKSB7XG5cdFx0XHRpZiAoZmlyc3RfcnVuKSB7XG5cdFx0XHRcdGZhbGxiYWNrID0gYnJhbmNoKCgpID0+IGZhbGxiYWNrX2ZuKGFuY2hvcikpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZmFsbGJhY2sgPSBicmFuY2goKCkgPT4gZmFsbGJhY2tfZm4oKG9mZnNjcmVlbl9hbmNob3IgPz89IGNyZWF0ZV90ZXh0KCkpKSk7XG5cdFx0XHRcdGZhbGxiYWNrLmYgfD0gRUZGRUNUX09GRlNDUkVFTjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAobGVuZ3RoID4ga2V5cy5zaXplKSB7XG5cdFx0XHRpZiAoREVWKSB7XG5cdFx0XHRcdHZhbGlkYXRlX2VhY2hfa2V5cyhhcnJheSwgZ2V0X2tleSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBpbiBwcm9kLCB0aGUgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBpc24ndCBwcmludGVkLCBzbyBkb24ndCBib3RoZXIgY29tcHV0aW5nIGl0XG5cdFx0XHRcdGUuZWFjaF9rZXlfZHVwbGljYXRlKCcnLCAnJywgJycpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIHJlbW92ZSBleGNlc3Mgbm9kZXNcblx0XHRpZiAoaHlkcmF0aW5nICYmIGxlbmd0aCA+IDApIHtcblx0XHRcdHNldF9oeWRyYXRlX25vZGUoc2tpcF9ub2RlcygpKTtcblx0XHR9XG5cblx0XHRpZiAoIWZpcnN0X3J1bikge1xuXHRcdFx0cGVuZGluZy5zZXQoYmF0Y2gsIGtleXMpO1xuXG5cdFx0XHRpZiAoZGVmZXIpIHtcblx0XHRcdFx0Zm9yIChjb25zdCBba2V5LCBpdGVtXSBvZiBpdGVtcykge1xuXHRcdFx0XHRcdGlmICgha2V5cy5oYXMoa2V5KSkge1xuXHRcdFx0XHRcdFx0YmF0Y2guc2tpcF9lZmZlY3QoaXRlbS5lKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRiYXRjaC5vbmNvbW1pdChjb21taXQpO1xuXHRcdFx0XHRiYXRjaC5vbmRpc2NhcmQoZGlzY2FyZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb21taXQoYmF0Y2gpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChtaXNtYXRjaCkge1xuXHRcdFx0Ly8gY29udGludWUgaW4gaHlkcmF0aW9uIG1vZGVcblx0XHRcdHNldF9oeWRyYXRpbmcodHJ1ZSk7XG5cdFx0fVxuXG5cdFx0Ly8gV2hlbiB3ZSBtb3VudCB0aGUgZWFjaCBibG9jayBmb3IgdGhlIGZpcnN0IHRpbWUsIHRoZSBjb2xsZWN0aW9uIHdvbid0IGJlXG5cdFx0Ly8gY29ubmVjdGVkIHRvIHRoaXMgZWZmZWN0IGFzIHRoZSBlZmZlY3QgaGFzbid0IGZpbmlzaGVkIHJ1bm5pbmcgeWV0IGFuZCBpdHMgZGVwc1xuXHRcdC8vIHdvbid0IGJlIGFzc2lnbmVkLiBIb3dldmVyLCBpdCdzIHBvc3NpYmxlIHRoYXQgd2hlbiByZWNvbmNpbGluZyB0aGUgZWFjaCBibG9ja1xuXHRcdC8vIHRoYXQgYSBtdXRhdGlvbiBvY2N1cnJlZCBhbmQgaXQncyBtYWRlIHRoZSBjb2xsZWN0aW9uIE1BWUJFX0RJUlRZLCBzbyByZWFkaW5nIHRoZVxuXHRcdC8vIGNvbGxlY3Rpb24gYWdhaW4gY2FuIHByb3ZpZGUgY29uc2lzdGVuY3kgdG8gdGhlIHJlYWN0aXZlIGdyYXBoIGFnYWluIGFzIHRoZSBkZXJpdmVkc1xuXHRcdC8vIHdpbGwgbm93IGJlIGBDTEVBTmAuXG5cdFx0Z2V0KGVhY2hfYXJyYXkpO1xuXHR9KTtcblxuXHQvKiogQHR5cGUge0VhY2hTdGF0ZX0gKi9cblx0dmFyIHN0YXRlID0geyBlZmZlY3QsIGZsYWdzLCBpdGVtcywgcGVuZGluZywgb3V0cm9ncm91cHM6IG51bGwsIGZhbGxiYWNrIH07XG5cblx0Zmlyc3RfcnVuID0gZmFsc2U7XG5cblx0aWYgKGh5ZHJhdGluZykge1xuXHRcdGFuY2hvciA9IGh5ZHJhdGVfbm9kZTtcblx0fVxufVxuXG4vKipcbiAqIFNraXAgcGFzdCBhbnkgbm9uLWJyYW5jaCBlZmZlY3RzICh3aGljaCBjb3VsZCBiZSBjcmVhdGVkIHdpdGggYGNyZWF0ZVN1YnNjcmliZXJgLCBmb3IgZXhhbXBsZSkgdG8gZmluZCB0aGUgbmV4dCBicmFuY2ggZWZmZWN0XG4gKiBAcGFyYW0ge0VmZmVjdCB8IG51bGx9IGVmZmVjdFxuICogQHJldHVybnMge0VmZmVjdCB8IG51bGx9XG4gKi9cbmZ1bmN0aW9uIHNraXBfdG9fYnJhbmNoKGVmZmVjdCkge1xuXHR3aGlsZSAoZWZmZWN0ICE9PSBudWxsICYmIChlZmZlY3QuZiAmIEJSQU5DSF9FRkZFQ1QpID09PSAwKSB7XG5cdFx0ZWZmZWN0ID0gZWZmZWN0Lm5leHQ7XG5cdH1cblx0cmV0dXJuIGVmZmVjdDtcbn1cblxuLyoqXG4gKiBBZGQsIHJlbW92ZSwgb3IgcmVvcmRlciBpdGVtcyBvdXRwdXQgYnkgYW4gZWFjaCBibG9jayBhcyBpdHMgaW5wdXQgY2hhbmdlc1xuICogQHRlbXBsYXRlIFZcbiAqIEBwYXJhbSB7RWFjaFN0YXRlfSBzdGF0ZVxuICogQHBhcmFtIHtBcnJheTxWPn0gYXJyYXlcbiAqIEBwYXJhbSB7RWxlbWVudCB8IENvbW1lbnQgfCBUZXh0fSBhbmNob3JcbiAqIEBwYXJhbSB7bnVtYmVyfSBmbGFnc1xuICogQHBhcmFtIHsodmFsdWU6IFYsIGluZGV4OiBudW1iZXIpID0+IGFueX0gZ2V0X2tleVxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIHJlY29uY2lsZShzdGF0ZSwgYXJyYXksIGFuY2hvciwgZmxhZ3MsIGdldF9rZXkpIHtcblx0dmFyIGlzX2FuaW1hdGVkID0gKGZsYWdzICYgRUFDSF9JU19BTklNQVRFRCkgIT09IDA7XG5cblx0dmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblx0dmFyIGl0ZW1zID0gc3RhdGUuaXRlbXM7XG5cdHZhciBjdXJyZW50ID0gc2tpcF90b19icmFuY2goc3RhdGUuZWZmZWN0LmZpcnN0KTtcblxuXHQvKiogQHR5cGUge3VuZGVmaW5lZCB8IFNldDxFZmZlY3Q+fSAqL1xuXHR2YXIgc2VlbjtcblxuXHQvKiogQHR5cGUge0VmZmVjdCB8IG51bGx9ICovXG5cdHZhciBwcmV2ID0gbnVsbDtcblxuXHQvKiogQHR5cGUge3VuZGVmaW5lZCB8IFNldDxFZmZlY3Q+fSAqL1xuXHR2YXIgdG9fYW5pbWF0ZTtcblxuXHQvKiogQHR5cGUge0VmZmVjdFtdfSAqL1xuXHR2YXIgbWF0Y2hlZCA9IFtdO1xuXG5cdC8qKiBAdHlwZSB7RWZmZWN0W119ICovXG5cdHZhciBzdGFzaGVkID0gW107XG5cblx0LyoqIEB0eXBlIHtWfSAqL1xuXHR2YXIgdmFsdWU7XG5cblx0LyoqIEB0eXBlIHthbnl9ICovXG5cdHZhciBrZXk7XG5cblx0LyoqIEB0eXBlIHtFZmZlY3QgfCB1bmRlZmluZWR9ICovXG5cdHZhciBlZmZlY3Q7XG5cblx0LyoqIEB0eXBlIHtudW1iZXJ9ICovXG5cdHZhciBpO1xuXG5cdGlmIChpc19hbmltYXRlZCkge1xuXHRcdGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0dmFsdWUgPSBhcnJheVtpXTtcblx0XHRcdGtleSA9IGdldF9rZXkodmFsdWUsIGkpO1xuXHRcdFx0ZWZmZWN0ID0gLyoqIEB0eXBlIHtFYWNoSXRlbX0gKi8gKGl0ZW1zLmdldChrZXkpKS5lO1xuXG5cdFx0XHQvLyBvZmZzY3JlZW4gPT0gY29taW5nIGluIG5vdywgbm8gYW5pbWF0aW9uIGluIHRoYXQgY2FzZSxcblx0XHRcdC8vIGVsc2UgdGhpcyB3b3VsZCBoYXBwZW4gaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL3N2ZWx0ZS9pc3N1ZXMvMTcxODFcblx0XHRcdGlmICgoZWZmZWN0LmYgJiBFRkZFQ1RfT0ZGU0NSRUVOKSA9PT0gMCkge1xuXHRcdFx0XHRlZmZlY3Qubm9kZXM/LmE/Lm1lYXN1cmUoKTtcblx0XHRcdFx0KHRvX2FuaW1hdGUgPz89IG5ldyBTZXQoKSkuYWRkKGVmZmVjdCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Zm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG5cdFx0dmFsdWUgPSBhcnJheVtpXTtcblx0XHRrZXkgPSBnZXRfa2V5KHZhbHVlLCBpKTtcblxuXHRcdGVmZmVjdCA9IC8qKiBAdHlwZSB7RWFjaEl0ZW19ICovIChpdGVtcy5nZXQoa2V5KSkuZTtcblxuXHRcdGlmIChzdGF0ZS5vdXRyb2dyb3VwcyAhPT0gbnVsbCkge1xuXHRcdFx0Zm9yIChjb25zdCBncm91cCBvZiBzdGF0ZS5vdXRyb2dyb3Vwcykge1xuXHRcdFx0XHRncm91cC5wZW5kaW5nLmRlbGV0ZShlZmZlY3QpO1xuXHRcdFx0XHRncm91cC5kb25lLmRlbGV0ZShlZmZlY3QpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICgoZWZmZWN0LmYgJiBJTkVSVCkgIT09IDApIHtcblx0XHRcdHJlc3VtZV9lZmZlY3QoZWZmZWN0KTtcblx0XHRcdGlmIChpc19hbmltYXRlZCkge1xuXHRcdFx0XHRlZmZlY3Qubm9kZXM/LmE/LnVuZml4KCk7XG5cdFx0XHRcdCh0b19hbmltYXRlID8/PSBuZXcgU2V0KCkpLmRlbGV0ZShlZmZlY3QpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICgoZWZmZWN0LmYgJiBFRkZFQ1RfT0ZGU0NSRUVOKSAhPT0gMCkge1xuXHRcdFx0ZWZmZWN0LmYgXj0gRUZGRUNUX09GRlNDUkVFTjtcblxuXHRcdFx0aWYgKGVmZmVjdCA9PT0gY3VycmVudCkge1xuXHRcdFx0XHRtb3ZlKGVmZmVjdCwgbnVsbCwgYW5jaG9yKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhciBuZXh0ID0gcHJldiA/IHByZXYubmV4dCA6IGN1cnJlbnQ7XG5cblx0XHRcdFx0aWYgKGVmZmVjdCA9PT0gc3RhdGUuZWZmZWN0Lmxhc3QpIHtcblx0XHRcdFx0XHRzdGF0ZS5lZmZlY3QubGFzdCA9IGVmZmVjdC5wcmV2O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGVmZmVjdC5wcmV2KSBlZmZlY3QucHJldi5uZXh0ID0gZWZmZWN0Lm5leHQ7XG5cdFx0XHRcdGlmIChlZmZlY3QubmV4dCkgZWZmZWN0Lm5leHQucHJldiA9IGVmZmVjdC5wcmV2O1xuXHRcdFx0XHRsaW5rKHN0YXRlLCBwcmV2LCBlZmZlY3QpO1xuXHRcdFx0XHRsaW5rKHN0YXRlLCBlZmZlY3QsIG5leHQpO1xuXG5cdFx0XHRcdG1vdmUoZWZmZWN0LCBuZXh0LCBhbmNob3IpO1xuXHRcdFx0XHRwcmV2ID0gZWZmZWN0O1xuXG5cdFx0XHRcdG1hdGNoZWQgPSBbXTtcblx0XHRcdFx0c3Rhc2hlZCA9IFtdO1xuXG5cdFx0XHRcdGN1cnJlbnQgPSBza2lwX3RvX2JyYW5jaChwcmV2Lm5leHQpO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZWZmZWN0ICE9PSBjdXJyZW50KSB7XG5cdFx0XHRpZiAoc2VlbiAhPT0gdW5kZWZpbmVkICYmIHNlZW4uaGFzKGVmZmVjdCkpIHtcblx0XHRcdFx0aWYgKG1hdGNoZWQubGVuZ3RoIDwgc3Rhc2hlZC5sZW5ndGgpIHtcblx0XHRcdFx0XHQvLyBtb3JlIGVmZmljaWVudCB0byBtb3ZlIGxhdGVyIGl0ZW1zIHRvIHRoZSBmcm9udFxuXHRcdFx0XHRcdHZhciBzdGFydCA9IHN0YXNoZWRbMF07XG5cdFx0XHRcdFx0dmFyIGo7XG5cblx0XHRcdFx0XHRwcmV2ID0gc3RhcnQucHJldjtcblxuXHRcdFx0XHRcdHZhciBhID0gbWF0Y2hlZFswXTtcblx0XHRcdFx0XHR2YXIgYiA9IG1hdGNoZWRbbWF0Y2hlZC5sZW5ndGggLSAxXTtcblxuXHRcdFx0XHRcdGZvciAoaiA9IDA7IGogPCBtYXRjaGVkLmxlbmd0aDsgaiArPSAxKSB7XG5cdFx0XHRcdFx0XHRtb3ZlKG1hdGNoZWRbal0sIHN0YXJ0LCBhbmNob3IpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGZvciAoaiA9IDA7IGogPCBzdGFzaGVkLmxlbmd0aDsgaiArPSAxKSB7XG5cdFx0XHRcdFx0XHRzZWVuLmRlbGV0ZShzdGFzaGVkW2pdKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsaW5rKHN0YXRlLCBhLnByZXYsIGIubmV4dCk7XG5cdFx0XHRcdFx0bGluayhzdGF0ZSwgcHJldiwgYSk7XG5cdFx0XHRcdFx0bGluayhzdGF0ZSwgYiwgc3RhcnQpO1xuXG5cdFx0XHRcdFx0Y3VycmVudCA9IHN0YXJ0O1xuXHRcdFx0XHRcdHByZXYgPSBiO1xuXHRcdFx0XHRcdGkgLT0gMTtcblxuXHRcdFx0XHRcdG1hdGNoZWQgPSBbXTtcblx0XHRcdFx0XHRzdGFzaGVkID0gW107XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gbW9yZSBlZmZpY2llbnQgdG8gbW92ZSBlYXJsaWVyIGl0ZW1zIHRvIHRoZSBiYWNrXG5cdFx0XHRcdFx0c2Vlbi5kZWxldGUoZWZmZWN0KTtcblx0XHRcdFx0XHRtb3ZlKGVmZmVjdCwgY3VycmVudCwgYW5jaG9yKTtcblxuXHRcdFx0XHRcdGxpbmsoc3RhdGUsIGVmZmVjdC5wcmV2LCBlZmZlY3QubmV4dCk7XG5cdFx0XHRcdFx0bGluayhzdGF0ZSwgZWZmZWN0LCBwcmV2ID09PSBudWxsID8gc3RhdGUuZWZmZWN0LmZpcnN0IDogcHJldi5uZXh0KTtcblx0XHRcdFx0XHRsaW5rKHN0YXRlLCBwcmV2LCBlZmZlY3QpO1xuXG5cdFx0XHRcdFx0cHJldiA9IGVmZmVjdDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRtYXRjaGVkID0gW107XG5cdFx0XHRzdGFzaGVkID0gW107XG5cblx0XHRcdHdoaWxlIChjdXJyZW50ICE9PSBudWxsICYmIGN1cnJlbnQgIT09IGVmZmVjdCkge1xuXHRcdFx0XHQoc2VlbiA/Pz0gbmV3IFNldCgpKS5hZGQoY3VycmVudCk7XG5cdFx0XHRcdHN0YXNoZWQucHVzaChjdXJyZW50KTtcblx0XHRcdFx0Y3VycmVudCA9IHNraXBfdG9fYnJhbmNoKGN1cnJlbnQubmV4dCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjdXJyZW50ID09PSBudWxsKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICgoZWZmZWN0LmYgJiBFRkZFQ1RfT0ZGU0NSRUVOKSA9PT0gMCkge1xuXHRcdFx0bWF0Y2hlZC5wdXNoKGVmZmVjdCk7XG5cdFx0fVxuXG5cdFx0cHJldiA9IGVmZmVjdDtcblx0XHRjdXJyZW50ID0gc2tpcF90b19icmFuY2goZWZmZWN0Lm5leHQpO1xuXHR9XG5cblx0aWYgKHN0YXRlLm91dHJvZ3JvdXBzICE9PSBudWxsKSB7XG5cdFx0Zm9yIChjb25zdCBncm91cCBvZiBzdGF0ZS5vdXRyb2dyb3Vwcykge1xuXHRcdFx0aWYgKGdyb3VwLnBlbmRpbmcuc2l6ZSA9PT0gMCkge1xuXHRcdFx0XHRkZXN0cm95X2VmZmVjdHMoc3RhdGUsIGFycmF5X2Zyb20oZ3JvdXAuZG9uZSkpO1xuXHRcdFx0XHRzdGF0ZS5vdXRyb2dyb3Vwcz8uZGVsZXRlKGdyb3VwKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoc3RhdGUub3V0cm9ncm91cHMuc2l6ZSA9PT0gMCkge1xuXHRcdFx0c3RhdGUub3V0cm9ncm91cHMgPSBudWxsO1xuXHRcdH1cblx0fVxuXG5cdGlmIChjdXJyZW50ICE9PSBudWxsIHx8IHNlZW4gIT09IHVuZGVmaW5lZCkge1xuXHRcdC8qKiBAdHlwZSB7RWZmZWN0W119ICovXG5cdFx0dmFyIHRvX2Rlc3Ryb3kgPSBbXTtcblxuXHRcdGlmIChzZWVuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGZvciAoZWZmZWN0IG9mIHNlZW4pIHtcblx0XHRcdFx0aWYgKChlZmZlY3QuZiAmIElORVJUKSA9PT0gMCkge1xuXHRcdFx0XHRcdHRvX2Rlc3Ryb3kucHVzaChlZmZlY3QpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0d2hpbGUgKGN1cnJlbnQgIT09IG51bGwpIHtcblx0XHRcdC8vIElmIHRoZSBlYWNoIGJsb2NrIGlzbid0IGluZXJ0LCB0aGVuIGluZXJ0IGVmZmVjdHMgYXJlIGN1cnJlbnRseSBvdXRyb2luZyBhbmQgd2lsbCBiZSByZW1vdmVkIG9uY2UgdGhlIHRyYW5zaXRpb24gaXMgZmluaXNoZWRcblx0XHRcdGlmICgoY3VycmVudC5mICYgSU5FUlQpID09PSAwICYmIGN1cnJlbnQgIT09IHN0YXRlLmZhbGxiYWNrKSB7XG5cdFx0XHRcdHRvX2Rlc3Ryb3kucHVzaChjdXJyZW50KTtcblx0XHRcdH1cblxuXHRcdFx0Y3VycmVudCA9IHNraXBfdG9fYnJhbmNoKGN1cnJlbnQubmV4dCk7XG5cdFx0fVxuXG5cdFx0dmFyIGRlc3Ryb3lfbGVuZ3RoID0gdG9fZGVzdHJveS5sZW5ndGg7XG5cblx0XHRpZiAoZGVzdHJveV9sZW5ndGggPiAwKSB7XG5cdFx0XHR2YXIgY29udHJvbGxlZF9hbmNob3IgPSAoZmxhZ3MgJiBFQUNIX0lTX0NPTlRST0xMRUQpICE9PSAwICYmIGxlbmd0aCA9PT0gMCA/IGFuY2hvciA6IG51bGw7XG5cblx0XHRcdGlmIChpc19hbmltYXRlZCkge1xuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgZGVzdHJveV9sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdHRvX2Rlc3Ryb3lbaV0ubm9kZXM/LmE/Lm1lYXN1cmUoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBkZXN0cm95X2xlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0dG9fZGVzdHJveVtpXS5ub2Rlcz8uYT8uZml4KCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cGF1c2VfZWZmZWN0cyhzdGF0ZSwgdG9fZGVzdHJveSwgY29udHJvbGxlZF9hbmNob3IpO1xuXHRcdH1cblx0fVxuXG5cdGlmIChpc19hbmltYXRlZCkge1xuXHRcdHF1ZXVlX21pY3JvX3Rhc2soKCkgPT4ge1xuXHRcdFx0aWYgKHRvX2FuaW1hdGUgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXHRcdFx0Zm9yIChlZmZlY3Qgb2YgdG9fYW5pbWF0ZSkge1xuXHRcdFx0XHRlZmZlY3Qubm9kZXM/LmE/LmFwcGx5KCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHtNYXA8YW55LCBFYWNoSXRlbT59IGl0ZW1zXG4gKiBAcGFyYW0ge05vZGV9IGFuY2hvclxuICogQHBhcmFtIHtWfSB2YWx1ZVxuICogQHBhcmFtIHt1bmtub3dufSBrZXlcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICogQHBhcmFtIHsoYW5jaG9yOiBOb2RlLCBpdGVtOiBNYXliZVNvdXJjZTxWPiwgaW5kZXg6IE1heWJlU291cmNlPG51bWJlcj4sIGNvbGxlY3Rpb246ICgpID0+IFZbXSkgPT4gdm9pZH0gcmVuZGVyX2ZuXG4gKiBAcGFyYW0ge251bWJlcn0gZmxhZ3NcbiAqIEBwYXJhbSB7KCkgPT4gVltdfSBnZXRfY29sbGVjdGlvblxuICogQHJldHVybnMge0VhY2hJdGVtfVxuICovXG5mdW5jdGlvbiBjcmVhdGVfaXRlbShpdGVtcywgYW5jaG9yLCB2YWx1ZSwga2V5LCBpbmRleCwgcmVuZGVyX2ZuLCBmbGFncywgZ2V0X2NvbGxlY3Rpb24pIHtcblx0dmFyIHYgPVxuXHRcdChmbGFncyAmIEVBQ0hfSVRFTV9SRUFDVElWRSkgIT09IDBcblx0XHRcdD8gKGZsYWdzICYgRUFDSF9JVEVNX0lNTVVUQUJMRSkgPT09IDBcblx0XHRcdFx0PyBtdXRhYmxlX3NvdXJjZSh2YWx1ZSwgZmFsc2UsIGZhbHNlKVxuXHRcdFx0XHQ6IHNvdXJjZSh2YWx1ZSlcblx0XHRcdDogbnVsbDtcblxuXHR2YXIgaSA9IChmbGFncyAmIEVBQ0hfSU5ERVhfUkVBQ1RJVkUpICE9PSAwID8gc291cmNlKGluZGV4KSA6IG51bGw7XG5cblx0aWYgKERFViAmJiB2KSB7XG5cdFx0Ly8gRm9yIHRyYWNpbmcgcHVycG9zZXMsIHdlIG5lZWQgdG8gbGluayB0aGUgc291cmNlIHNpZ25hbCB3ZSBjcmVhdGUgd2l0aCB0aGVcblx0XHQvLyBjb2xsZWN0aW9uICsgaW5kZXggc28gdGhhdCB0cmFjaW5nIHdvcmtzIGFzIGludGVuZGVkXG5cdFx0di50cmFjZSA9ICgpID0+IHtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLWV4cHJlc3Npb25zXG5cdFx0XHRnZXRfY29sbGVjdGlvbigpW2k/LnYgPz8gaW5kZXhdO1xuXHRcdH07XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdHYsXG5cdFx0aSxcblx0XHRlOiBicmFuY2goKCkgPT4ge1xuXHRcdFx0cmVuZGVyX2ZuKGFuY2hvciwgdiA/PyB2YWx1ZSwgaSA/PyBpbmRleCwgZ2V0X2NvbGxlY3Rpb24pO1xuXG5cdFx0XHRyZXR1cm4gKCkgPT4ge1xuXHRcdFx0XHRpdGVtcy5kZWxldGUoa2V5KTtcblx0XHRcdH07XG5cdFx0fSlcblx0fTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VmZmVjdH0gZWZmZWN0XG4gKiBAcGFyYW0ge0VmZmVjdCB8IG51bGx9IG5leHRcbiAqIEBwYXJhbSB7VGV4dCB8IEVsZW1lbnQgfCBDb21tZW50fSBhbmNob3JcbiAqL1xuZnVuY3Rpb24gbW92ZShlZmZlY3QsIG5leHQsIGFuY2hvcikge1xuXHRpZiAoIWVmZmVjdC5ub2RlcykgcmV0dXJuO1xuXG5cdHZhciBub2RlID0gZWZmZWN0Lm5vZGVzLnN0YXJ0O1xuXHR2YXIgZW5kID0gZWZmZWN0Lm5vZGVzLmVuZDtcblxuXHR2YXIgZGVzdCA9XG5cdFx0bmV4dCAmJiAobmV4dC5mICYgRUZGRUNUX09GRlNDUkVFTikgPT09IDBcblx0XHRcdD8gLyoqIEB0eXBlIHtFZmZlY3ROb2Rlc30gKi8gKG5leHQubm9kZXMpLnN0YXJ0XG5cdFx0XHQ6IGFuY2hvcjtcblxuXHR3aGlsZSAobm9kZSAhPT0gbnVsbCkge1xuXHRcdHZhciBuZXh0X25vZGUgPSAvKiogQHR5cGUge1RlbXBsYXRlTm9kZX0gKi8gKGdldF9uZXh0X3NpYmxpbmcobm9kZSkpO1xuXHRcdGRlc3QuYmVmb3JlKG5vZGUpO1xuXG5cdFx0aWYgKG5vZGUgPT09IGVuZCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdG5vZGUgPSBuZXh0X25vZGU7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VhY2hTdGF0ZX0gc3RhdGVcbiAqIEBwYXJhbSB7RWZmZWN0IHwgbnVsbH0gcHJldlxuICogQHBhcmFtIHtFZmZlY3QgfCBudWxsfSBuZXh0XG4gKi9cbmZ1bmN0aW9uIGxpbmsoc3RhdGUsIHByZXYsIG5leHQpIHtcblx0aWYgKHByZXYgPT09IG51bGwpIHtcblx0XHRzdGF0ZS5lZmZlY3QuZmlyc3QgPSBuZXh0O1xuXHR9IGVsc2Uge1xuXHRcdHByZXYubmV4dCA9IG5leHQ7XG5cdH1cblxuXHRpZiAobmV4dCA9PT0gbnVsbCkge1xuXHRcdHN0YXRlLmVmZmVjdC5sYXN0ID0gcHJldjtcblx0fSBlbHNlIHtcblx0XHRuZXh0LnByZXYgPSBwcmV2O1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxhbnk+fSBhcnJheVxuICogQHBhcmFtIHsoaXRlbTogYW55LCBpbmRleDogbnVtYmVyKSA9PiBzdHJpbmd9IGtleV9mblxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlX2VhY2hfa2V5cyhhcnJheSwga2V5X2ZuKSB7XG5cdGNvbnN0IGtleXMgPSBuZXcgTWFwKCk7XG5cdGNvbnN0IGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0Y29uc3Qga2V5ID0ga2V5X2ZuKGFycmF5W2ldLCBpKTtcblxuXHRcdGlmIChrZXlzLmhhcyhrZXkpKSB7XG5cdFx0XHRjb25zdCBhID0gU3RyaW5nKGtleXMuZ2V0KGtleSkpO1xuXHRcdFx0Y29uc3QgYiA9IFN0cmluZyhpKTtcblxuXHRcdFx0LyoqIEB0eXBlIHtzdHJpbmcgfCBudWxsfSAqL1xuXHRcdFx0bGV0IGsgPSBTdHJpbmcoa2V5KTtcblx0XHRcdGlmIChrLnN0YXJ0c1dpdGgoJ1tvYmplY3QgJykpIGsgPSBudWxsO1xuXG5cdFx0XHRlLmVhY2hfa2V5X2R1cGxpY2F0ZShhLCBiLCBrKTtcblx0XHR9XG5cblx0XHRrZXlzLnNldChrZXksIGkpO1xuXHR9XG59XG4iLCIvKiogQGltcG9ydCB7IEVmZmVjdCwgVGVtcGxhdGVOb2RlIH0gZnJvbSAnI2NsaWVudCcgKi9cbi8qKiBAaW1wb3J0IHt9IGZyb20gJ3RydXN0ZWQtdHlwZXMnICovXG5pbXBvcnQge1xuXHRGSUxFTkFNRSxcblx0SFlEUkFUSU9OX0VSUk9SLFxuXHROQU1FU1BBQ0VfU1ZHLFxuXHROQU1FU1BBQ0VfTUFUSE1MXG59IGZyb20gJy4uLy4uLy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyByZW1vdmVfZWZmZWN0X2RvbSwgdGVtcGxhdGVfZWZmZWN0IH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcbmltcG9ydCB7IGh5ZHJhdGVfbmV4dCwgaHlkcmF0ZV9ub2RlLCBoeWRyYXRpbmcsIHNldF9oeWRyYXRlX25vZGUgfSBmcm9tICcuLi9oeWRyYXRpb24uanMnO1xuXG5pbXBvcnQgeyBhc3NpZ25fbm9kZXMgfSBmcm9tICcuLi90ZW1wbGF0ZS5qcyc7XG5pbXBvcnQgKiBhcyB3IGZyb20gJy4uLy4uL3dhcm5pbmdzLmpzJztcbmltcG9ydCB7IGhhc2gsIHNhbml0aXplX2xvY2F0aW9uIH0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMuanMnO1xuaW1wb3J0IHsgREVWIH0gZnJvbSAnZXNtLWVudic7XG5pbXBvcnQgeyBkZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0LmpzJztcbmltcG9ydCB7IGNyZWF0ZV9lbGVtZW50LCBnZXRfZmlyc3RfY2hpbGQsIGdldF9uZXh0X3NpYmxpbmcgfSBmcm9tICcuLi9vcGVyYXRpb25zLmpzJztcbmltcG9ydCB7IGFjdGl2ZV9lZmZlY3QgfSBmcm9tICcuLi8uLi9ydW50aW1lLmpzJztcbmltcG9ydCB7IENPTU1FTlRfTk9ERSB9IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7c3RyaW5nIHwgbnVsbH0gc2VydmVyX2hhc2hcbiAqIEBwYXJhbSB7c3RyaW5nIHwgVHJ1c3RlZEhUTUx9IHZhbHVlXG4gKi9cbmZ1bmN0aW9uIGNoZWNrX2hhc2goZWxlbWVudCwgc2VydmVyX2hhc2gsIHZhbHVlKSB7XG5cdGlmICghc2VydmVyX2hhc2ggfHwgc2VydmVyX2hhc2ggPT09IGhhc2goU3RyaW5nKHZhbHVlID8/ICcnKSkpIHJldHVybjtcblxuXHRsZXQgbG9jYXRpb247XG5cblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRjb25zdCBsb2MgPSBlbGVtZW50Ll9fc3ZlbHRlX21ldGE/LmxvYztcblx0aWYgKGxvYykge1xuXHRcdGxvY2F0aW9uID0gYG5lYXIgJHtsb2MuZmlsZX06JHtsb2MubGluZX06JHtsb2MuY29sdW1ufWA7XG5cdH0gZWxzZSBpZiAoZGV2X2N1cnJlbnRfY29tcG9uZW50X2Z1bmN0aW9uPy5bRklMRU5BTUVdKSB7XG5cdFx0bG9jYXRpb24gPSBgaW4gJHtkZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb25bRklMRU5BTUVdfWA7XG5cdH1cblxuXHR3Lmh5ZHJhdGlvbl9odG1sX2NoYW5nZWQoc2FuaXRpemVfbG9jYXRpb24obG9jYXRpb24pKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnQgfCBUZXh0IHwgQ29tbWVudH0gbm9kZVxuICogQHBhcmFtIHsoKSA9PiBzdHJpbmcgfCBUcnVzdGVkSFRNTH0gZ2V0X3ZhbHVlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc19jb250cm9sbGVkXVxuICogQHBhcmFtIHtib29sZWFufSBbc3ZnXVxuICogQHBhcmFtIHtib29sZWFufSBbbWF0aG1sXVxuICogQHBhcmFtIHtib29sZWFufSBbc2tpcF93YXJuaW5nXVxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBodG1sKFxuXHRub2RlLFxuXHRnZXRfdmFsdWUsXG5cdGlzX2NvbnRyb2xsZWQgPSBmYWxzZSxcblx0c3ZnID0gZmFsc2UsXG5cdG1hdGhtbCA9IGZhbHNlLFxuXHRza2lwX3dhcm5pbmcgPSBmYWxzZVxuKSB7XG5cdHZhciBhbmNob3IgPSBub2RlO1xuXG5cdC8qKiBAdHlwZSB7c3RyaW5nIHwgVHJ1c3RlZEhUTUx9ICovXG5cdHZhciB2YWx1ZSA9ICcnO1xuXG5cdGlmIChpc19jb250cm9sbGVkKSB7XG5cdFx0dmFyIHBhcmVudF9ub2RlID0gLyoqIEB0eXBlIHtFbGVtZW50fSAqLyAobm9kZSk7XG5cblx0XHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0XHRhbmNob3IgPSBzZXRfaHlkcmF0ZV9ub2RlKGdldF9maXJzdF9jaGlsZChwYXJlbnRfbm9kZSkpO1xuXHRcdH1cblx0fVxuXG5cdHRlbXBsYXRlX2VmZmVjdCgoKSA9PiB7XG5cdFx0dmFyIGVmZmVjdCA9IC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAoYWN0aXZlX2VmZmVjdCk7XG5cblx0XHRpZiAodmFsdWUgPT09ICh2YWx1ZSA9IGdldF92YWx1ZSgpID8/ICcnKSkge1xuXHRcdFx0aWYgKGh5ZHJhdGluZykgaHlkcmF0ZV9uZXh0KCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKGlzX2NvbnRyb2xsZWQgJiYgIWh5ZHJhdGluZykge1xuXHRcdFx0Ly8gV2hlbiBAaHRtbCBpcyB0aGUgb25seSBjaGlsZCwgdXNlIGlubmVySFRNTCBkaXJlY3RseS5cblx0XHRcdC8vIFRoaXMgYWxzbyBoYW5kbGVzIGNvbnRlbnRlZGl0YWJsZSwgd2hlcmUgdGhlIHVzZXIgbWF5IGRlbGV0ZSB0aGUgYW5jaG9yIGNvbW1lbnQuXG5cdFx0XHRlZmZlY3Qubm9kZXMgPSBudWxsO1xuXHRcdFx0cGFyZW50X25vZGUuaW5uZXJIVE1MID0gLyoqIEB0eXBlIHtzdHJpbmd9ICovICh2YWx1ZSk7XG5cblx0XHRcdGlmICh2YWx1ZSAhPT0gJycpIHtcblx0XHRcdFx0YXNzaWduX25vZGVzKFxuXHRcdFx0XHRcdC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoZ2V0X2ZpcnN0X2NoaWxkKHBhcmVudF9ub2RlKSksXG5cdFx0XHRcdFx0LyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGV9ICovIChwYXJlbnRfbm9kZS5sYXN0Q2hpbGQpXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoZWZmZWN0Lm5vZGVzICE9PSBudWxsKSB7XG5cdFx0XHRyZW1vdmVfZWZmZWN0X2RvbShlZmZlY3Qubm9kZXMuc3RhcnQsIC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoZWZmZWN0Lm5vZGVzLmVuZCkpO1xuXHRcdFx0ZWZmZWN0Lm5vZGVzID0gbnVsbDtcblx0XHR9XG5cblx0XHRpZiAodmFsdWUgPT09ICcnKSByZXR1cm47XG5cblx0XHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0XHQvLyBXZSdyZSBkZWxpYmVyYXRlbHkgbm90IHRyeWluZyB0byByZXBhaXIgbWlzbWF0Y2hlcyBiZXR3ZWVuIHNlcnZlciBhbmQgY2xpZW50LFxuXHRcdFx0Ly8gYXMgaXQncyBjb3N0bHkgYW5kIGVycm9yLXByb25lIChhbmQgaXQncyBhbiBlZGdlIGNhc2UgdG8gaGF2ZSBhIG1pc21hdGNoIGFueXdheSlcblx0XHRcdHZhciBoYXNoID0gLyoqIEB0eXBlIHtDb21tZW50fSAqLyAoaHlkcmF0ZV9ub2RlKS5kYXRhO1xuXG5cdFx0XHQvKiogQHR5cGUge1RlbXBsYXRlTm9kZSB8IG51bGx9ICovXG5cdFx0XHR2YXIgbmV4dCA9IGh5ZHJhdGVfbmV4dCgpO1xuXHRcdFx0dmFyIGxhc3QgPSBuZXh0O1xuXG5cdFx0XHR3aGlsZSAoXG5cdFx0XHRcdG5leHQgIT09IG51bGwgJiZcblx0XHRcdFx0KG5leHQubm9kZVR5cGUgIT09IENPTU1FTlRfTk9ERSB8fCAvKiogQHR5cGUge0NvbW1lbnR9ICovIChuZXh0KS5kYXRhICE9PSAnJylcblx0XHRcdCkge1xuXHRcdFx0XHRsYXN0ID0gbmV4dDtcblx0XHRcdFx0bmV4dCA9IGdldF9uZXh0X3NpYmxpbmcobmV4dCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChuZXh0ID09PSBudWxsKSB7XG5cdFx0XHRcdHcuaHlkcmF0aW9uX21pc21hdGNoKCk7XG5cdFx0XHRcdHRocm93IEhZRFJBVElPTl9FUlJPUjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKERFViAmJiAhc2tpcF93YXJuaW5nKSB7XG5cdFx0XHRcdGNoZWNrX2hhc2goLyoqIEB0eXBlIHtFbGVtZW50fSAqLyAobmV4dC5wYXJlbnROb2RlKSwgaGFzaCwgdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRhc3NpZ25fbm9kZXMoaHlkcmF0ZV9ub2RlLCBsYXN0KTtcblx0XHRcdGFuY2hvciA9IHNldF9oeWRyYXRlX25vZGUobmV4dCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gRG9uJ3QgdXNlIGNyZWF0ZV9mcmFnbWVudF93aXRoX3NjcmlwdF9mcm9tX2h0bWwgaGVyZSBiZWNhdXNlIHRoYXQgd291bGQgbWVhbiBzY3JpcHQgdGFncyBhcmUgZXhlY3V0ZWQuXG5cdFx0Ly8gQGh0bWwgaXMgYmFzaWNhbGx5IGAuaW5uZXJIVE1MID0gLi4uYCBhbmQgdGhhdCBkb2Vzbid0IGV4ZWN1dGUgc2NyaXB0cyBlaXRoZXIgZHVlIHRvIHNlY3VyaXR5IHJlYXNvbnMuXG5cdFx0Ly8gVXNlIGEgPHRlbXBsYXRlPiwgPHN2Zz4sIG9yIDxtYXRoPiB3cmFwcGVyIGRlcGVuZGluZyBvbiBjb250ZXh0LiBJZiB2YWx1ZSBpcyBhIFRydXN0ZWRIVE1MIG9iamVjdCxcblx0XHQvLyBpdCB3aWxsIGJlIGFzc2lnbmVkIGRpcmVjdGx5IHRvIGlubmVySFRNTCB3aXRob3V0IGNvZXJjaW9uIOKAlCB0aGlzIGFsbG93cyB7QGh0bWwgcG9saWN5LmNyZWF0ZUhUTUwoLi4uKX0gdG8gd29yay5cblx0XHR2YXIgbnMgPSBzdmcgPyBOQU1FU1BBQ0VfU1ZHIDogbWF0aG1sID8gTkFNRVNQQUNFX01BVEhNTCA6IHVuZGVmaW5lZDtcblx0XHR2YXIgd3JhcHBlciA9IC8qKiBAdHlwZSB7SFRNTFRlbXBsYXRlRWxlbWVudCB8IFNWR0VsZW1lbnQgfCBNYXRoTUxFbGVtZW50fSAqLyAoXG5cdFx0XHRjcmVhdGVfZWxlbWVudChzdmcgPyAnc3ZnJyA6IG1hdGhtbCA/ICdtYXRoJyA6ICd0ZW1wbGF0ZScsIG5zKVxuXHRcdCk7XG5cdFx0d3JhcHBlci5pbm5lckhUTUwgPSAvKiogQHR5cGUge2FueX0gKi8gKHZhbHVlKTtcblxuXHRcdC8qKiBAdHlwZSB7RG9jdW1lbnRGcmFnbWVudCB8IEVsZW1lbnR9ICovXG5cdFx0dmFyIG5vZGUgPSBzdmcgfHwgbWF0aG1sID8gd3JhcHBlciA6IC8qKiBAdHlwZSB7SFRNTFRlbXBsYXRlRWxlbWVudH0gKi8gKHdyYXBwZXIpLmNvbnRlbnQ7XG5cblx0XHRhc3NpZ25fbm9kZXMoXG5cdFx0XHQvKiogQHR5cGUge1RlbXBsYXRlTm9kZX0gKi8gKGdldF9maXJzdF9jaGlsZChub2RlKSksXG5cdFx0XHQvKiogQHR5cGUge1RlbXBsYXRlTm9kZX0gKi8gKG5vZGUubGFzdENoaWxkKVxuXHRcdCk7XG5cblx0XHRpZiAoc3ZnIHx8IG1hdGhtbCkge1xuXHRcdFx0d2hpbGUgKGdldF9maXJzdF9jaGlsZChub2RlKSkge1xuXHRcdFx0XHRhbmNob3IuYmVmb3JlKC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoZ2V0X2ZpcnN0X2NoaWxkKG5vZGUpKSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFuY2hvci5iZWZvcmUobm9kZSk7XG5cdFx0fVxuXHR9KTtcbn1cbiIsImltcG9ydCB7IGh5ZHJhdGVfbmV4dCwgaHlkcmF0aW5nIH0gZnJvbSAnLi4vaHlkcmF0aW9uLmpzJztcbmltcG9ydCB7IGNyZWF0ZV9lbGVtZW50LCBjcmVhdGVfdGV4dCB9IGZyb20gJy4uL29wZXJhdGlvbnMuanMnO1xuaW1wb3J0IHsgYXBwZW5kIH0gZnJvbSAnLi4vdGVtcGxhdGUuanMnO1xuXG4vKipcbiAqIEBwYXJhbSB7Q29tbWVudH0gYW5jaG9yXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59ICQkcHJvcHNcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBzbG90X3Byb3BzXG4gKiBAcGFyYW0ge251bGwgfCAoKGFuY2hvcjogQ29tbWVudCkgPT4gdm9pZCl9IGZhbGxiYWNrX2ZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzbG90KGFuY2hvciwgJCRwcm9wcywgbmFtZSwgc2xvdF9wcm9wcywgZmFsbGJhY2tfZm4pIHtcblx0aWYgKGh5ZHJhdGluZykge1xuXHRcdGh5ZHJhdGVfbmV4dCgpO1xuXHR9XG5cblx0Ly8gQ3VzdG9tIGVsZW1lbnQgc2xvdHMgYXJlIG5hdGl2ZSBET00gc2xvdHMuXG5cdC8vIFVzZSB0aGUgc3RvcmVkIHJlZmVyZW5jZSBiZWNhdXNlIHRoZSBzaGFkb3cgcm9vdCBtYXkgYmUgY2xvc2VkLlxuXHRpZiAoJCRwcm9wcy4kJGhvc3Q/LiQkc2hhZG93Um9vdCkge1xuXHRcdGNvbnN0IGVsZW1lbnQgPSBjcmVhdGVfZWxlbWVudCgnc2xvdCcpO1xuXHRcdGlmIChuYW1lICE9PSAnZGVmYXVsdCcpIGVsZW1lbnQubmFtZSA9IG5hbWU7XG5cblx0XHRhcHBlbmQoYW5jaG9yLCBlbGVtZW50KTtcblxuXHRcdGlmIChmYWxsYmFja19mbiAhPT0gbnVsbCkge1xuXHRcdFx0Y29uc3QgZmFsbGJhY2tfYW5jaG9yID0gY3JlYXRlX3RleHQoKTtcblx0XHRcdGVsZW1lbnQuYXBwZW5kKGZhbGxiYWNrX2FuY2hvcik7XG5cdFx0XHRmYWxsYmFja19mbihmYWxsYmFja19hbmNob3IpO1xuXHRcdH1cblxuXHRcdHJldHVybjtcblx0fVxuXG5cdHZhciBzbG90X2ZuID0gJCRwcm9wcy4kJHNsb3RzPy5bbmFtZV07XG5cdC8vIEludGVyb3A6IENhbiB1c2Ugc25pcHBldHMgdG8gZmlsbCBzbG90c1xuXHR2YXIgaXNfaW50ZXJvcCA9IGZhbHNlO1xuXHRpZiAoc2xvdF9mbiA9PT0gdHJ1ZSkge1xuXHRcdHNsb3RfZm4gPSAkJHByb3BzW25hbWUgPT09ICdkZWZhdWx0JyA/ICdjaGlsZHJlbicgOiBuYW1lXTtcblx0XHRpc19pbnRlcm9wID0gdHJ1ZTtcblx0fVxuXG5cdGlmIChzbG90X2ZuID09PSB1bmRlZmluZWQpIHtcblx0XHRpZiAoZmFsbGJhY2tfZm4gIT09IG51bGwpIHtcblx0XHRcdGZhbGxiYWNrX2ZuKGFuY2hvcik7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHNsb3RfZm4oYW5jaG9yLCBpc19pbnRlcm9wID8gKCkgPT4gc2xvdF9wcm9wcyA6IHNsb3RfcHJvcHMpO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBwcm9wc1xuICogQHJldHVybnMge1JlY29yZDxzdHJpbmcsIGJvb2xlYW4+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVfc2xvdHMocHJvcHMpIHtcblx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBib29sZWFuPn0gKi9cblx0Y29uc3Qgc2FuaXRpemVkID0ge307XG5cdGlmIChwcm9wcy5jaGlsZHJlbikgc2FuaXRpemVkLmRlZmF1bHQgPSB0cnVlO1xuXHRmb3IgKGNvbnN0IGtleSBpbiBwcm9wcy4kJHNsb3RzKSB7XG5cdFx0c2FuaXRpemVkW2tleV0gPSB0cnVlO1xuXHR9XG5cdHJldHVybiBzYW5pdGl6ZWQ7XG59XG4iLCJpbXBvcnQgeyBpc192b2lkIH0gZnJvbSAnLi4vLi4vdXRpbHMuanMnO1xuaW1wb3J0ICogYXMgdyBmcm9tICcuL3dhcm5pbmdzLmpzJztcbmltcG9ydCAqIGFzIGUgZnJvbSAnLi9lcnJvcnMuanMnO1xuXG5leHBvcnQgeyBpbnZhbGlkX2RlZmF1bHRfc25pcHBldCB9IGZyb20gJy4vZXJyb3JzLmpzJztcblxuLyoqXG4gKiBAcGFyYW0geygpID0+IHN0cmluZ30gdGFnX2ZuXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlX3ZvaWRfZHluYW1pY19lbGVtZW50KHRhZ19mbikge1xuXHRjb25zdCB0YWcgPSB0YWdfZm4oKTtcblx0aWYgKHRhZyAmJiBpc192b2lkKHRhZykpIHtcblx0XHR3LmR5bmFtaWNfdm9pZF9lbGVtZW50X2NvbnRlbnQodGFnKTtcblx0fVxufVxuXG4vKiogQHBhcmFtIHsoKSA9PiB1bmtub3dufSB0YWdfZm4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZV9keW5hbWljX2VsZW1lbnRfdGFnKHRhZ19mbikge1xuXHRjb25zdCB0YWcgPSB0YWdfZm4oKTtcblx0Y29uc3QgaXNfc3RyaW5nID0gdHlwZW9mIHRhZyA9PT0gJ3N0cmluZyc7XG5cdGlmICh0YWcgJiYgIWlzX3N0cmluZykge1xuXHRcdGUuc3ZlbHRlX2VsZW1lbnRfaW52YWxpZF90aGlzX3ZhbHVlKCk7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gc3RvcmVcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZV9zdG9yZShzdG9yZSwgbmFtZSkge1xuXHRpZiAoc3RvcmUgIT0gbnVsbCAmJiB0eXBlb2Ygc3RvcmUuc3Vic2NyaWJlICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0ZS5zdG9yZV9pbnZhbGlkX3NoYXBlKG5hbWUpO1xuXHR9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIHsoLi4uYXJnczogYW55W10pID0+IHVua25vd259IFRcbiAqIEBwYXJhbSB7VH0gZm5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByZXZlbnRfc25pcHBldF9zdHJpbmdpZmljYXRpb24oZm4pIHtcblx0Zm4udG9TdHJpbmcgPSAoKSA9PiB7XG5cdFx0ZS5zbmlwcGV0X3dpdGhvdXRfcmVuZGVyX3RhZygpO1xuXHRcdHJldHVybiAnJztcblx0fTtcblx0cmV0dXJuIGZuO1xufVxuIiwiLyoqIEBpbXBvcnQgeyBTbmlwcGV0IH0gZnJvbSAnc3ZlbHRlJyAqL1xuLyoqIEBpbXBvcnQgeyBUZW1wbGF0ZU5vZGUgfSBmcm9tICcjY2xpZW50JyAqL1xuLyoqIEBpbXBvcnQgeyBHZXR0ZXJzIH0gZnJvbSAnI3NoYXJlZCcgKi9cbmltcG9ydCB7IEVGRkVDVF9UUkFOU1BBUkVOVCwgRUxFTUVOVF9OT0RFIH0gZnJvbSAnI2NsaWVudC9jb25zdGFudHMnO1xuaW1wb3J0IHsgYmxvY2ssIHRlYXJkb3duIH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcbmltcG9ydCB7XG5cdGRldl9jdXJyZW50X2NvbXBvbmVudF9mdW5jdGlvbixcblx0c2V0X2Rldl9jdXJyZW50X2NvbXBvbmVudF9mdW5jdGlvblxufSBmcm9tICcuLi8uLi9jb250ZXh0LmpzJztcbmltcG9ydCB7IGh5ZHJhdGVfbmV4dCwgaHlkcmF0ZV9ub2RlLCBoeWRyYXRpbmcgfSBmcm9tICcuLi9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgY3JlYXRlX2ZyYWdtZW50X2Zyb21faHRtbCB9IGZyb20gJy4uL3JlY29uY2lsZXIuanMnO1xuaW1wb3J0IHsgYXNzaWduX25vZGVzIH0gZnJvbSAnLi4vdGVtcGxhdGUuanMnO1xuaW1wb3J0ICogYXMgdyBmcm9tICcuLi8uLi93YXJuaW5ncy5qcyc7XG5pbXBvcnQgKiBhcyBlIGZyb20gJy4uLy4uL2Vycm9ycy5qcyc7XG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7IGdldF9maXJzdF9jaGlsZCwgZ2V0X25leHRfc2libGluZyB9IGZyb20gJy4uL29wZXJhdGlvbnMuanMnO1xuaW1wb3J0IHsgcHJldmVudF9zbmlwcGV0X3N0cmluZ2lmaWNhdGlvbiB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC92YWxpZGF0ZS5qcyc7XG5pbXBvcnQgeyBCcmFuY2hNYW5hZ2VyIH0gZnJvbSAnLi9icmFuY2hlcy5qcyc7XG5cbi8qKlxuICogQHRlbXBsYXRlIHsobm9kZTogVGVtcGxhdGVOb2RlLCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZH0gU25pcHBldEZuXG4gKiBAcGFyYW0ge1RlbXBsYXRlTm9kZX0gbm9kZVxuICogQHBhcmFtIHsoKSA9PiBTbmlwcGV0Rm4gfCBudWxsIHwgdW5kZWZpbmVkfSBnZXRfc25pcHBldFxuICogQHBhcmFtIHsoKCkgPT4gYW55KVtdfSBhcmdzXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNuaXBwZXQobm9kZSwgZ2V0X3NuaXBwZXQsIC4uLmFyZ3MpIHtcblx0dmFyIGJyYW5jaGVzID0gbmV3IEJyYW5jaE1hbmFnZXIobm9kZSk7XG5cblx0YmxvY2soKCkgPT4ge1xuXHRcdGNvbnN0IHNuaXBwZXQgPSBnZXRfc25pcHBldCgpID8/IG51bGw7XG5cblx0XHRpZiAoREVWICYmIHNuaXBwZXQgPT0gbnVsbCkge1xuXHRcdFx0ZS5pbnZhbGlkX3NuaXBwZXQoKTtcblx0XHR9XG5cblx0XHRicmFuY2hlcy5lbnN1cmUoc25pcHBldCwgc25pcHBldCAmJiAoKGFuY2hvcikgPT4gc25pcHBldChhbmNob3IsIC4uLmFyZ3MpKSk7XG5cdH0sIEVGRkVDVF9UUkFOU1BBUkVOVCk7XG59XG5cbi8qKlxuICogSW4gZGV2ZWxvcG1lbnQsIHdyYXAgdGhlIHNuaXBwZXQgZnVuY3Rpb24gc28gdGhhdCBpdCBwYXNzZXMgdmFsaWRhdGlvbiwgYW5kIHNvIHRoYXQgdGhlXG4gKiBjb3JyZWN0IGNvbXBvbmVudCBjb250ZXh0IGlzIHNldCBmb3Igb3duZXJzaGlwIGNoZWNrc1xuICogQHBhcmFtIHthbnl9IGNvbXBvbmVudFxuICogQHBhcmFtIHsobm9kZTogVGVtcGxhdGVOb2RlLCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZH0gZm5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyYXBfc25pcHBldChjb21wb25lbnQsIGZuKSB7XG5cdGNvbnN0IHNuaXBwZXQgPSAoLyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGV9ICovIG5vZGUsIC8qKiBAdHlwZSB7YW55W119ICovIC4uLmFyZ3MpID0+IHtcblx0XHR2YXIgcHJldmlvdXNfY29tcG9uZW50X2Z1bmN0aW9uID0gZGV2X2N1cnJlbnRfY29tcG9uZW50X2Z1bmN0aW9uO1xuXHRcdHNldF9kZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb24oY29tcG9uZW50KTtcblxuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gZm4obm9kZSwgLi4uYXJncyk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHNldF9kZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb24ocHJldmlvdXNfY29tcG9uZW50X2Z1bmN0aW9uKTtcblx0XHR9XG5cdH07XG5cblx0cHJldmVudF9zbmlwcGV0X3N0cmluZ2lmaWNhdGlvbihzbmlwcGV0KTtcblxuXHRyZXR1cm4gc25pcHBldDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBzbmlwcGV0IHByb2dyYW1tYXRpY2FsbHlcbiAqIEB0ZW1wbGF0ZSB7dW5rbm93bltdfSBQYXJhbXNcbiAqIEBwYXJhbSB7KC4uLnBhcmFtczogR2V0dGVyczxQYXJhbXM+KSA9PiB7XG4gKiAgIHJlbmRlcjogKCkgPT4gc3RyaW5nXG4gKiAgIHNldHVwPzogKGVsZW1lbnQ6IEVsZW1lbnQpID0+IHZvaWQgfCAoKCkgPT4gdm9pZClcbiAqIH19IGZuXG4gKiBAcmV0dXJucyB7U25pcHBldDxQYXJhbXM+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmF3U25pcHBldChmbikge1xuXHQvLyBAdHMtZXhwZWN0LWVycm9yIHRoZSB0eXBlcyBhcmUgYSBsaWVcblx0cmV0dXJuICgvKiogQHR5cGUge1RlbXBsYXRlTm9kZX0gKi8gYW5jaG9yLCAvKiogQHR5cGUge0dldHRlcnM8UGFyYW1zPn0gKi8gLi4ucGFyYW1zKSA9PiB7XG5cdFx0dmFyIHNuaXBwZXQgPSBmbiguLi5wYXJhbXMpO1xuXG5cdFx0LyoqIEB0eXBlIHtFbGVtZW50fSAqL1xuXHRcdHZhciBlbGVtZW50O1xuXG5cdFx0aWYgKGh5ZHJhdGluZykge1xuXHRcdFx0ZWxlbWVudCA9IC8qKiBAdHlwZSB7RWxlbWVudH0gKi8gKGh5ZHJhdGVfbm9kZSk7XG5cdFx0XHRoeWRyYXRlX25leHQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIGh0bWwgPSBzbmlwcGV0LnJlbmRlcigpLnRyaW0oKTtcblx0XHRcdHZhciBmcmFnbWVudCA9IGNyZWF0ZV9mcmFnbWVudF9mcm9tX2h0bWwoaHRtbCk7XG5cdFx0XHRlbGVtZW50ID0gLyoqIEB0eXBlIHtFbGVtZW50fSAqLyAoZ2V0X2ZpcnN0X2NoaWxkKGZyYWdtZW50KSk7XG5cblx0XHRcdGlmIChERVYgJiYgKGdldF9uZXh0X3NpYmxpbmcoZWxlbWVudCkgIT09IG51bGwgfHwgZWxlbWVudC5ub2RlVHlwZSAhPT0gRUxFTUVOVF9OT0RFKSkge1xuXHRcdFx0XHR3LmludmFsaWRfcmF3X3NuaXBwZXRfcmVuZGVyKCk7XG5cdFx0XHR9XG5cblx0XHRcdGFuY2hvci5iZWZvcmUoZWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVzdWx0ID0gc25pcHBldC5zZXR1cD8uKGVsZW1lbnQpO1xuXHRcdGFzc2lnbl9ub2RlcyhlbGVtZW50LCBlbGVtZW50KTtcblxuXHRcdGlmICh0eXBlb2YgcmVzdWx0ID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0ZWFyZG93bihyZXN1bHQpO1xuXHRcdH1cblx0fTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgVGVtcGxhdGVOb2RlLCBEb20gfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgRUZGRUNUX1RSQU5TUEFSRU5UIH0gZnJvbSAnI2NsaWVudC9jb25zdGFudHMnO1xuaW1wb3J0IHsgYmxvY2sgfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHtcblx0aHlkcmF0ZV9uZXh0LFxuXHRoeWRyYXRlX25vZGUsXG5cdGh5ZHJhdGluZyxcblx0cmVhZF9oeWRyYXRpb25faW5zdHJ1Y3Rpb24sXG5cdHNldF9oeWRyYXRlX25vZGUsXG5cdHNldF9oeWRyYXRpbmcsXG5cdHNraXBfbm9kZXNcbn0gZnJvbSAnLi4vaHlkcmF0aW9uLmpzJztcbmltcG9ydCB7IEJyYW5jaE1hbmFnZXIgfSBmcm9tICcuL2JyYW5jaGVzLmpzJztcbmltcG9ydCB7IEhZRFJBVElPTl9TVEFSVCwgSFlEUkFUSU9OX1NUQVJUX0VMU0UgfSBmcm9tICcuLi8uLi8uLi8uLi9jb25zdGFudHMuanMnO1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBQXG4gKiBAdGVtcGxhdGUgeyhwcm9wczogUCkgPT4gdm9pZH0gQ1xuICogQHBhcmFtIHtUZW1wbGF0ZU5vZGV9IG5vZGVcbiAqIEBwYXJhbSB7KCkgPT4gQ30gZ2V0X2NvbXBvbmVudFxuICogQHBhcmFtIHsoYW5jaG9yOiBUZW1wbGF0ZU5vZGUsIGNvbXBvbmVudDogQykgPT4gRG9tIHwgdm9pZH0gcmVuZGVyX2ZuXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudChub2RlLCBnZXRfY29tcG9uZW50LCByZW5kZXJfZm4pIHtcblx0LyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGUgfCB1bmRlZmluZWR9ICovXG5cdHZhciBoeWRyYXRpb25fc3RhcnRfbm9kZTtcblxuXHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0aHlkcmF0aW9uX3N0YXJ0X25vZGUgPSBoeWRyYXRlX25vZGU7XG5cdFx0aHlkcmF0ZV9uZXh0KCk7XG5cdH1cblxuXHR2YXIgYnJhbmNoZXMgPSBuZXcgQnJhbmNoTWFuYWdlcihub2RlKTtcblxuXHRibG9jaygoKSA9PiB7XG5cdFx0dmFyIGNvbXBvbmVudCA9IGdldF9jb21wb25lbnQoKSA/PyBudWxsO1xuXG5cdFx0aWYgKGh5ZHJhdGluZykge1xuXHRcdFx0dmFyIGRhdGEgPSByZWFkX2h5ZHJhdGlvbl9pbnN0cnVjdGlvbigvKiogQHR5cGUge1RlbXBsYXRlTm9kZX0gKi8gKGh5ZHJhdGlvbl9zdGFydF9ub2RlKSk7XG5cblx0XHRcdHZhciBzZXJ2ZXJfaGFkX2NvbXBvbmVudCA9IGRhdGEgPT09IEhZRFJBVElPTl9TVEFSVDtcblx0XHRcdHZhciBjbGllbnRfaGFzX2NvbXBvbmVudCA9IGNvbXBvbmVudCAhPT0gbnVsbDtcblxuXHRcdFx0aWYgKHNlcnZlcl9oYWRfY29tcG9uZW50ICE9PSBjbGllbnRfaGFzX2NvbXBvbmVudCkge1xuXHRcdFx0XHQvLyBIeWRyYXRpb24gbWlzbWF0Y2g6IHNraXAgdGhlIHNlcnZlci1yZW5kZXJlZCBub2RlcyBhbmQgcmVuZGVyIGZyZXNoXG5cdFx0XHRcdHZhciBhbmNob3IgPSBza2lwX25vZGVzKCk7XG5cblx0XHRcdFx0c2V0X2h5ZHJhdGVfbm9kZShhbmNob3IpO1xuXHRcdFx0XHRicmFuY2hlcy5hbmNob3IgPSBhbmNob3I7XG5cblx0XHRcdFx0c2V0X2h5ZHJhdGluZyhmYWxzZSk7XG5cdFx0XHRcdGJyYW5jaGVzLmVuc3VyZShjb21wb25lbnQsIGNvbXBvbmVudCAmJiAoKHRhcmdldCkgPT4gcmVuZGVyX2ZuKHRhcmdldCwgY29tcG9uZW50KSkpO1xuXHRcdFx0XHRzZXRfaHlkcmF0aW5nKHRydWUpO1xuXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRicmFuY2hlcy5lbnN1cmUoY29tcG9uZW50LCBjb21wb25lbnQgJiYgKCh0YXJnZXQpID0+IHJlbmRlcl9mbih0YXJnZXQsIGNvbXBvbmVudCkpKTtcblx0fSwgRUZGRUNUX1RSQU5TUEFSRU5UKTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgUmFmIH0gZnJvbSAnI2NsaWVudCcgKi9cbmltcG9ydCB7IG5vb3AgfSBmcm9tICcuLi9zaGFyZWQvdXRpbHMuanMnO1xuXG5pbXBvcnQgeyBCUk9XU0VSIH0gZnJvbSAnZXNtLWVudic7XG5cbmNvbnN0IG5vdyA9IEJST1dTRVIgPyAoKSA9PiBwZXJmb3JtYW5jZS5ub3coKSA6ICgpID0+IERhdGUubm93KCk7XG5cbi8qKiBAdHlwZSB7UmFmfSAqL1xuZXhwb3J0IGNvbnN0IHJhZiA9IHtcblx0Ly8gZG9uJ3QgYWNjZXNzIHJlcXVlc3RBbmltYXRpb25GcmFtZSBlYWdlcmx5IG91dHNpZGUgbWV0aG9kXG5cdC8vIHRoaXMgYWxsb3dzIGJhc2ljIHRlc3Rpbmcgb2YgdXNlciBjb2RlIHdpdGhvdXQgSlNET01cblx0Ly8gYnVuZGVyIHdpbGwgZXZhbCBhbmQgcmVtb3ZlIHRlcm5hcnkgd2hlbiB0aGUgdXNlcidzIGFwcCBpcyBidWlsdFxuXHR0aWNrOiAvKiogQHBhcmFtIHthbnl9IF8gKi8gKF8pID0+IChCUk9XU0VSID8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIDogbm9vcCkoXyksXG5cdG5vdzogKCkgPT4gbm93KCksXG5cdHRhc2tzOiBuZXcgU2V0KClcbn07XG4iLCIvKiogQGltcG9ydCB7IFRhc2tDYWxsYmFjaywgVGFzaywgVGFza0VudHJ5IH0gZnJvbSAnI2NsaWVudCcgKi9cbmltcG9ydCB7IHJhZiB9IGZyb20gJy4vdGltaW5nLmpzJztcblxuLy8gVE9ETyBtb3ZlIHRoaXMgaW50byB0aW1pbmcuanMgd2hlcmUgaXQgcHJvYmFibHkgYmVsb25nc1xuXG4vKipcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5mdW5jdGlvbiBydW5fdGFza3MoKSB7XG5cdC8vIHVzZSBgcmFmLm5vdygpYCBpbnN0ZWFkIG9mIHRoZSBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBjYWxsYmFjayBhcmd1bWVudCwgYmVjYXVzZVxuXHQvLyBvdGhlcndpc2UgdGhpbmdzIGNhbiBnZXQgd29ua3kgaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL3N2ZWx0ZS9wdWxsLzE0NTQxXG5cdGNvbnN0IG5vdyA9IHJhZi5ub3coKTtcblxuXHRyYWYudGFza3MuZm9yRWFjaCgodGFzaykgPT4ge1xuXHRcdGlmICghdGFzay5jKG5vdykpIHtcblx0XHRcdHJhZi50YXNrcy5kZWxldGUodGFzayk7XG5cdFx0XHR0YXNrLmYoKTtcblx0XHR9XG5cdH0pO1xuXG5cdGlmIChyYWYudGFza3Muc2l6ZSAhPT0gMCkge1xuXHRcdHJhZi50aWNrKHJ1bl90YXNrcyk7XG5cdH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHRhc2sgdGhhdCBydW5zIG9uIGVhY2ggcmFmIGZyYW1lXG4gKiB1bnRpbCBpdCByZXR1cm5zIGEgZmFsc3kgdmFsdWUgb3IgaXMgYWJvcnRlZFxuICogQHBhcmFtIHtUYXNrQ2FsbGJhY2t9IGNhbGxiYWNrXG4gKiBAcmV0dXJucyB7VGFza31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvb3AoY2FsbGJhY2spIHtcblx0LyoqIEB0eXBlIHtUYXNrRW50cnl9ICovXG5cdGxldCB0YXNrO1xuXG5cdGlmIChyYWYudGFza3Muc2l6ZSA9PT0gMCkge1xuXHRcdHJhZi50aWNrKHJ1bl90YXNrcyk7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdHByb21pc2U6IG5ldyBQcm9taXNlKChmdWxmaWxsKSA9PiB7XG5cdFx0XHRyYWYudGFza3MuYWRkKCh0YXNrID0geyBjOiBjYWxsYmFjaywgZjogZnVsZmlsbCB9KSk7XG5cdFx0fSksXG5cdFx0YWJvcnQoKSB7XG5cdFx0XHRyYWYudGFza3MuZGVsZXRlKHRhc2spO1xuXHRcdH1cblx0fTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgQW5pbWF0ZUZuLCBBbmltYXRpb24sIEFuaW1hdGlvbkNvbmZpZywgRWFjaEl0ZW0sIEVmZmVjdCwgRWZmZWN0Tm9kZXMsIFRyYW5zaXRpb25GbiwgVHJhbnNpdGlvbk1hbmFnZXIgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgbm9vcCwgaXNfZnVuY3Rpb24gfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0IHsgZWZmZWN0IH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcbmltcG9ydCB7IGFjdGl2ZV9lZmZlY3QsIHVudHJhY2sgfSBmcm9tICcuLi8uLi9ydW50aW1lLmpzJztcbmltcG9ydCB7IGxvb3AgfSBmcm9tICcuLi8uLi9sb29wLmpzJztcbmltcG9ydCB7IHNob3VsZF9pbnRybyB9IGZyb20gJy4uLy4uL3JlbmRlci5qcyc7XG5pbXBvcnQgeyBUUkFOU0lUSU9OX0dMT0JBTCwgVFJBTlNJVElPTl9JTiwgVFJBTlNJVElPTl9PVVQgfSBmcm9tICcuLi8uLi8uLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgQkxPQ0tfRUZGRUNULCBSRUFDVElPTl9SQU4sIEVGRkVDVF9UUkFOU1BBUkVOVCB9IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcbmltcG9ydCB7IHF1ZXVlX21pY3JvX3Rhc2sgfSBmcm9tICcuLi90YXNrLmpzJztcbmltcG9ydCB7IHdpdGhvdXRfcmVhY3RpdmVfY29udGV4dCB9IGZyb20gJy4vYmluZGluZ3Mvc2hhcmVkLmpzJztcblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7J2ludHJvc3RhcnQnIHwgJ2ludHJvZW5kJyB8ICdvdXRyb3N0YXJ0JyB8ICdvdXRyb2VuZCd9IHR5cGVcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5mdW5jdGlvbiBkaXNwYXRjaF9ldmVudChlbGVtZW50LCB0eXBlKSB7XG5cdHdpdGhvdXRfcmVhY3RpdmVfY29udGV4dCgoKSA9PiB7XG5cdFx0ZWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCh0eXBlKSk7XG5cdH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgcHJvcGVydHkgdG8gdGhlIGNhbWVsLWNhc2UgZm9ybWF0IGV4cGVjdGVkIGJ5IEVsZW1lbnQuYW5pbWF0ZSgpLCBLZXlmcmFtZUVmZmVjdCgpLCBhbmQgS2V5ZnJhbWVFZmZlY3Quc2V0S2V5ZnJhbWVzKCkuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3R5bGVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGNzc19wcm9wZXJ0eV90b19jYW1lbGNhc2Uoc3R5bGUpIHtcblx0Ly8gaW4gY29tcGxpYW5jZSB3aXRoIHNwZWNcblx0aWYgKHN0eWxlID09PSAnZmxvYXQnKSByZXR1cm4gJ2Nzc0Zsb2F0Jztcblx0aWYgKHN0eWxlID09PSAnb2Zmc2V0JykgcmV0dXJuICdjc3NPZmZzZXQnO1xuXG5cdC8vIGRvIG5vdCByZW5hbWUgY3VzdG9tIEBwcm9wZXJ0aWVzXG5cdGlmIChzdHlsZS5zdGFydHNXaXRoKCctLScpKSByZXR1cm4gc3R5bGU7XG5cblx0Y29uc3QgcGFydHMgPSBzdHlsZS5zcGxpdCgnLScpO1xuXHRpZiAocGFydHMubGVuZ3RoID09PSAxKSByZXR1cm4gcGFydHNbMF07XG5cdHJldHVybiAoXG5cdFx0cGFydHNbMF0gK1xuXHRcdHBhcnRzXG5cdFx0XHQuc2xpY2UoMSlcblx0XHRcdC5tYXAoLyoqIEBwYXJhbSB7YW55fSB3b3JkICovICh3b3JkKSA9PiB3b3JkWzBdLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpKVxuXHRcdFx0LmpvaW4oJycpXG5cdCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGNzc1xuICogQHJldHVybnMge0tleWZyYW1lfVxuICovXG5mdW5jdGlvbiBjc3NfdG9fa2V5ZnJhbWUoY3NzKSB7XG5cdC8qKiBAdHlwZSB7S2V5ZnJhbWV9ICovXG5cdGNvbnN0IGtleWZyYW1lID0ge307XG5cdGNvbnN0IHBhcnRzID0gY3NzLnNwbGl0KCc7Jyk7XG5cdGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuXHRcdGNvbnN0IFtwcm9wZXJ0eSwgdmFsdWVdID0gcGFydC5zcGxpdCgnOicpO1xuXHRcdGlmICghcHJvcGVydHkgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkgYnJlYWs7XG5cblx0XHRjb25zdCBmb3JtYXR0ZWRfcHJvcGVydHkgPSBjc3NfcHJvcGVydHlfdG9fY2FtZWxjYXNlKHByb3BlcnR5LnRyaW0oKSk7XG5cdFx0a2V5ZnJhbWVbZm9ybWF0dGVkX3Byb3BlcnR5XSA9IHZhbHVlLnRyaW0oKTtcblx0fVxuXHRyZXR1cm4ga2V5ZnJhbWU7XG59XG5cbi8qKiBAcGFyYW0ge251bWJlcn0gdCAqL1xuY29uc3QgbGluZWFyID0gKHQpID0+IHQ7XG5cbi8qKiBAdHlwZSB7RWZmZWN0IHwgbnVsbH0gKi9cbmxldCBhbmltYXRpb25fZWZmZWN0X292ZXJyaWRlID0gbnVsbDtcblxuLyoqIEBwYXJhbSB7RWZmZWN0IHwgbnVsbH0gdiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldF9hbmltYXRpb25fZWZmZWN0X292ZXJyaWRlKHYpIHtcblx0YW5pbWF0aW9uX2VmZmVjdF9vdmVycmlkZSA9IHY7XG59XG5cbi8qKlxuICogQ2FsbGVkIGluc2lkZSBrZXllZCBgeyNlYWNoIC4uLn1gIGJsb2NrcyAoYXMgYCQuYW5pbWF0aW9uKC4uLilgKS4gVGhpcyBjcmVhdGVzIGFuIGFuaW1hdGlvbiBtYW5hZ2VyXG4gKiBhbmQgYXR0YWNoZXMgaXQgdG8gdGhlIGJsb2NrLCBzbyB0aGF0IG1vdmVzIGNhbiBiZSBhbmltYXRlZCBmb2xsb3dpbmcgcmVjb25jaWxpYXRpb24uXG4gKiBAdGVtcGxhdGUgUFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0geygpID0+IEFuaW1hdGVGbjxQIHwgdW5kZWZpbmVkPn0gZ2V0X2ZuXG4gKiBAcGFyYW0geygoKSA9PiBQKSB8IG51bGx9IGdldF9wYXJhbXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFuaW1hdGlvbihlbGVtZW50LCBnZXRfZm4sIGdldF9wYXJhbXMpIHtcblx0dmFyIGVmZmVjdCA9IGFuaW1hdGlvbl9lZmZlY3Rfb3ZlcnJpZGUgPz8gLyoqIEB0eXBlIHtFZmZlY3R9ICovIChhY3RpdmVfZWZmZWN0KTtcblx0dmFyIG5vZGVzID0gLyoqIEB0eXBlIHtFZmZlY3ROb2Rlc30gKi8gKGVmZmVjdC5ub2Rlcyk7XG5cblx0LyoqIEB0eXBlIHtET01SZWN0fSAqL1xuXHR2YXIgZnJvbTtcblxuXHQvKiogQHR5cGUge0RPTVJlY3R9ICovXG5cdHZhciB0bztcblxuXHQvKiogQHR5cGUge0FuaW1hdGlvbiB8IHVuZGVmaW5lZH0gKi9cblx0dmFyIGFuaW1hdGlvbjtcblxuXHQvKiogQHR5cGUge251bGwgfCB7IHBvc2l0aW9uOiBzdHJpbmcsIHdpZHRoOiBzdHJpbmcsIGhlaWdodDogc3RyaW5nLCB0cmFuc2Zvcm06IHN0cmluZyB9fSAqL1xuXHR2YXIgb3JpZ2luYWxfc3R5bGVzID0gbnVsbDtcblxuXHRub2Rlcy5hID8/PSB7XG5cdFx0ZWxlbWVudCxcblx0XHRtZWFzdXJlKCkge1xuXHRcdFx0ZnJvbSA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHR9LFxuXHRcdGFwcGx5KCkge1xuXHRcdFx0YW5pbWF0aW9uPy5hYm9ydCgpO1xuXG5cdFx0XHR0byA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuXHRcdFx0aWYgKFxuXHRcdFx0XHRmcm9tLmxlZnQgIT09IHRvLmxlZnQgfHxcblx0XHRcdFx0ZnJvbS5yaWdodCAhPT0gdG8ucmlnaHQgfHxcblx0XHRcdFx0ZnJvbS50b3AgIT09IHRvLnRvcCB8fFxuXHRcdFx0XHRmcm9tLmJvdHRvbSAhPT0gdG8uYm90dG9tXG5cdFx0XHQpIHtcblx0XHRcdFx0Y29uc3Qgb3B0aW9ucyA9IGdldF9mbigpKHRoaXMuZWxlbWVudCwgeyBmcm9tLCB0byB9LCBnZXRfcGFyYW1zPy4oKSk7XG5cblx0XHRcdFx0YW5pbWF0aW9uID0gYW5pbWF0ZShcblx0XHRcdFx0XHR0aGlzLmVsZW1lbnQsXG5cdFx0XHRcdFx0b3B0aW9ucyxcblx0XHRcdFx0XHR1bmRlZmluZWQsXG5cdFx0XHRcdFx0MSxcblx0XHRcdFx0XHQoKSA9PiB7fSxcblx0XHRcdFx0XHQoKSA9PiB7XG5cdFx0XHRcdFx0XHRhbmltYXRpb24/LmFib3J0KCk7XG5cdFx0XHRcdFx0XHRhbmltYXRpb24gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Zml4KCkge1xuXHRcdFx0Ly8gSWYgYW4gYW5pbWF0aW9uIGlzIGFscmVhZHkgcnVubmluZywgdHJhbnNmb3JtaW5nIHRoZSBlbGVtZW50IGlzIGxpa2VseSB0byBmYWlsLFxuXHRcdFx0Ly8gYmVjYXVzZSB0aGUgc3R5bGVzIGFwcGxpZWQgYnkgdGhlIGFuaW1hdGlvbiB0YWtlIHByZWNlZGVuY2UuIEluIHRoZSBjYXNlIG9mIGNyb3NzZmFkZSxcblx0XHRcdC8vIHRoYXQgbWVhbnMgdGhlIGB0cmFuc2xhdGUoLi4uKWAgb2YgdGhlIGNyb3NzZmFkZSB0cmFuc2l0aW9uIG92ZXJydWxlcyB0aGUgYHRyYW5zbGF0ZSguLi4pYFxuXHRcdFx0Ly8gd2Ugd291bGQgYXBwbHkgYmVsb3csIGxlYWRpbmcgdG8gdGhlIGVsZW1lbnQganVtcGluZyBzb21ld2hlcmUgdG8gdGhlIHRvcCBsZWZ0LlxuXHRcdFx0aWYgKGVsZW1lbnQuZ2V0QW5pbWF0aW9ucygpLmxlbmd0aCkgcmV0dXJuO1xuXG5cdFx0XHQvLyBJdCdzIGltcG9ydGFudCB0byBkZXN0cnVjdHVyZSB0aGVzZSB0byBnZXQgZml4ZWQgdmFsdWVzIC0gdGhlIG9iamVjdCBpdHNlbGYgaGFzIGdldHRlcnMsXG5cdFx0XHQvLyBhbmQgY2hhbmdpbmcgdGhlIHN0eWxlIHRvICdhYnNvbHV0ZScgY2FuIGZvciBleGFtcGxlIGluZmx1ZW5jZSB0aGUgd2lkdGguXG5cdFx0XHR2YXIgeyBwb3NpdGlvbiwgd2lkdGgsIGhlaWdodCB9ID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcblxuXHRcdFx0aWYgKHBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICYmIHBvc2l0aW9uICE9PSAnZml4ZWQnKSB7XG5cdFx0XHRcdHZhciBzdHlsZSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50fSAqLyAoZWxlbWVudCkuc3R5bGU7XG5cblx0XHRcdFx0b3JpZ2luYWxfc3R5bGVzID0ge1xuXHRcdFx0XHRcdHBvc2l0aW9uOiBzdHlsZS5wb3NpdGlvbixcblx0XHRcdFx0XHR3aWR0aDogc3R5bGUud2lkdGgsXG5cdFx0XHRcdFx0aGVpZ2h0OiBzdHlsZS5oZWlnaHQsXG5cdFx0XHRcdFx0dHJhbnNmb3JtOiBzdHlsZS50cmFuc2Zvcm1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHRzdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRcdHN0eWxlLndpZHRoID0gd2lkdGg7XG5cdFx0XHRcdHN0eWxlLmhlaWdodCA9IGhlaWdodDtcblx0XHRcdFx0dmFyIHRvID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuXHRcdFx0XHRpZiAoZnJvbS5sZWZ0ICE9PSB0by5sZWZ0IHx8IGZyb20udG9wICE9PSB0by50b3ApIHtcblx0XHRcdFx0XHR2YXIgdHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke2Zyb20ubGVmdCAtIHRvLmxlZnR9cHgsICR7ZnJvbS50b3AgLSB0by50b3B9cHgpYDtcblx0XHRcdFx0XHRzdHlsZS50cmFuc2Zvcm0gPSBzdHlsZS50cmFuc2Zvcm0gPyBgJHtzdHlsZS50cmFuc2Zvcm19ICR7dHJhbnNmb3JtfWAgOiB0cmFuc2Zvcm07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdHVuZml4KCkge1xuXHRcdFx0aWYgKG9yaWdpbmFsX3N0eWxlcykge1xuXHRcdFx0XHR2YXIgc3R5bGUgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50IHwgU1ZHRWxlbWVudH0gKi8gKGVsZW1lbnQpLnN0eWxlO1xuXG5cdFx0XHRcdHN0eWxlLnBvc2l0aW9uID0gb3JpZ2luYWxfc3R5bGVzLnBvc2l0aW9uO1xuXHRcdFx0XHRzdHlsZS53aWR0aCA9IG9yaWdpbmFsX3N0eWxlcy53aWR0aDtcblx0XHRcdFx0c3R5bGUuaGVpZ2h0ID0gb3JpZ2luYWxfc3R5bGVzLmhlaWdodDtcblx0XHRcdFx0c3R5bGUudHJhbnNmb3JtID0gb3JpZ2luYWxfc3R5bGVzLnRyYW5zZm9ybTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0Ly8gaW4gdGhlIGNhc2Ugb2YgYSBgPHN2ZWx0ZTplbGVtZW50PmAsIGl0J3MgcG9zc2libGUgZm9yIGAkLmFuaW1hdGlvbiguLi4pYCB0byBiZSBjYWxsZWRcblx0Ly8gd2hlbiBhbiBhbmltYXRpb24gbWFuYWdlciBhbHJlYWR5IGV4aXN0cywgaWYgdGhlIHRhZyBjaGFuZ2VzLiBpbiB0aGF0IGNhc2UsIHdlIG5lZWQgdG9cblx0Ly8gc3dhcCBvdXQgdGhlIGVsZW1lbnQgcmF0aGVyIHRoYW4gY3JlYXRpbmcgYSBuZXcgbWFuYWdlciwgaW4gY2FzZSBpdCBoYXBwZW5lZCBhdCB0aGUgc2FtZVxuXHQvLyBtb21lbnQgYXMgYSByZWNvbmNpbGlhdGlvblxuXHRub2Rlcy5hLmVsZW1lbnQgPSBlbGVtZW50O1xufVxuXG4vKipcbiAqIENhbGxlZCBpbnNpZGUgYmxvY2sgZWZmZWN0cyBhcyBgJC50cmFuc2l0aW9uKC4uLilgLiBUaGlzIGNyZWF0ZXMgYSB0cmFuc2l0aW9uIG1hbmFnZXIgYW5kXG4gKiBhdHRhY2hlcyBpdCB0byB0aGUgY3VycmVudCBlZmZlY3Qg4oCUIGxhdGVyLCBpbnNpZGUgYHBhdXNlX2VmZmVjdGAgYW5kIGByZXN1bWVfZWZmZWN0YCwgd2VcbiAqIHVzZSB0aGlzIHRvIGNyZWF0ZSBgaW50cm9gIGFuZCBgb3V0cm9gIHRyYW5zaXRpb25zLlxuICogQHRlbXBsYXRlIFBcbiAqIEBwYXJhbSB7bnVtYmVyfSBmbGFnc1xuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHsoKSA9PiBUcmFuc2l0aW9uRm48UCB8IHVuZGVmaW5lZD59IGdldF9mblxuICogQHBhcmFtIHsoKCkgPT4gUCkgfCBudWxsfSBnZXRfcGFyYW1zXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zaXRpb24oZmxhZ3MsIGVsZW1lbnQsIGdldF9mbiwgZ2V0X3BhcmFtcykge1xuXHR2YXIgaXNfaW50cm8gPSAoZmxhZ3MgJiBUUkFOU0lUSU9OX0lOKSAhPT0gMDtcblx0dmFyIGlzX291dHJvID0gKGZsYWdzICYgVFJBTlNJVElPTl9PVVQpICE9PSAwO1xuXHR2YXIgaXNfYm90aCA9IGlzX2ludHJvICYmIGlzX291dHJvO1xuXHR2YXIgaXNfZ2xvYmFsID0gKGZsYWdzICYgVFJBTlNJVElPTl9HTE9CQUwpICE9PSAwO1xuXG5cdC8qKiBAdHlwZSB7J2luJyB8ICdvdXQnIHwgJ2JvdGgnfSAqL1xuXHR2YXIgZGlyZWN0aW9uID0gaXNfYm90aCA/ICdib3RoJyA6IGlzX2ludHJvID8gJ2luJyA6ICdvdXQnO1xuXG5cdC8qKiBAdHlwZSB7QW5pbWF0aW9uQ29uZmlnIHwgKChvcHRzOiB7IGRpcmVjdGlvbjogJ2luJyB8ICdvdXQnIH0pID0+IEFuaW1hdGlvbkNvbmZpZykgfCB1bmRlZmluZWR9ICovXG5cdHZhciBjdXJyZW50X29wdGlvbnM7XG5cblx0dmFyIGluZXJ0ID0gZWxlbWVudC5pbmVydDtcblxuXHQvKipcblx0ICogVGhlIGRlZmF1bHQgb3ZlcmZsb3cgc3R5bGUsIHN0YXNoZWQgc28gd2UgY2FuIHJldmVydCBjaGFuZ2VzIGR1cmluZyB0aGUgdHJhbnNpdGlvblxuXHQgKiB0aGF0IGFyZSBuZWNlc3NhcnkgdG8gd29yayBhcm91bmQgYSBTYWZhcmkgPDE4IGJ1Z1xuXHQgKiBUT0RPIDYuMCByZW1vdmUgdGhpcywgaWYgb2xkZXIgdmVyc2lvbnMgb2YgU2FmYXJpIGhhdmUgZGllZCBvdXQgZW5vdWdoXG5cdCAqL1xuXHR2YXIgb3ZlcmZsb3cgPSBlbGVtZW50LnN0eWxlLm92ZXJmbG93O1xuXG5cdC8qKiBAdHlwZSB7QW5pbWF0aW9uIHwgdW5kZWZpbmVkfSAqL1xuXHR2YXIgaW50cm87XG5cblx0LyoqIEB0eXBlIHtBbmltYXRpb24gfCB1bmRlZmluZWR9ICovXG5cdHZhciBvdXRybztcblxuXHRmdW5jdGlvbiBnZXRfb3B0aW9ucygpIHtcblx0XHRyZXR1cm4gd2l0aG91dF9yZWFjdGl2ZV9jb250ZXh0KCgpID0+IHtcblx0XHRcdC8vIElmIGEgdHJhbnNpdGlvbiBpcyBzdGlsbCBvbmdvaW5nLCB3ZSB1c2UgdGhlIGV4aXN0aW5nIG9wdGlvbnMgcmF0aGVyIHRoYW4gZ2VuZXJhdGluZ1xuXHRcdFx0Ly8gbmV3IG9uZXMuIFRoaXMgZW5zdXJlcyB0aGF0IHJldmVyc2libGUgdHJhbnNpdGlvbnMgcmV2ZXJzZSBzbW9vdGhseSwgcmF0aGVyIHRoYW5cblx0XHRcdC8vIGp1bXBpbmcgdG8gYSBuZXcgc3BvdCBiZWNhdXNlIChmb3IgZXhhbXBsZSkgYSBkaWZmZXJlbnQgYGR1cmF0aW9uYCB3YXMgdXNlZFxuXHRcdFx0cmV0dXJuIChjdXJyZW50X29wdGlvbnMgPz89IGdldF9mbigpKGVsZW1lbnQsIGdldF9wYXJhbXM/LigpID8/IC8qKiBAdHlwZSB7UH0gKi8gKHt9KSwge1xuXHRcdFx0XHRkaXJlY3Rpb25cblx0XHRcdH0pKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKiBAdHlwZSB7VHJhbnNpdGlvbk1hbmFnZXJ9ICovXG5cdHZhciB0cmFuc2l0aW9uID0ge1xuXHRcdGlzX2dsb2JhbCxcblx0XHRpbigpIHtcblx0XHRcdGVsZW1lbnQuaW5lcnQgPSBpbmVydDtcblxuXHRcdFx0aWYgKCFpc19pbnRybykge1xuXHRcdFx0XHRvdXRybz8uYWJvcnQoKTtcblx0XHRcdFx0b3V0cm8/LnJlc2V0Py4oKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWlzX291dHJvKSB7XG5cdFx0XHRcdC8vIGlmIHdlIGludHJvIHRoZW4gb3V0cm8gdGhlbiBpbnRybyBhZ2Fpbiwgd2Ugd2FudCB0byBhYm9ydCB0aGUgZmlyc3QgaW50cm8sXG5cdFx0XHRcdC8vIGlmIGl0J3Mgbm90IGEgYmlkaXJlY3Rpb25hbCB0cmFuc2l0aW9uXG5cdFx0XHRcdGludHJvPy5hYm9ydCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRpbnRybyA9IGFuaW1hdGUoXG5cdFx0XHRcdGVsZW1lbnQsXG5cdFx0XHRcdGdldF9vcHRpb25zKCksXG5cdFx0XHRcdG91dHJvLFxuXHRcdFx0XHQxLFxuXHRcdFx0XHQoKSA9PiB7XG5cdFx0XHRcdFx0ZGlzcGF0Y2hfZXZlbnQoZWxlbWVudCwgJ2ludHJvc3RhcnQnKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0KCkgPT4ge1xuXHRcdFx0XHRcdGRpc3BhdGNoX2V2ZW50KGVsZW1lbnQsICdpbnRyb2VuZCcpO1xuXG5cdFx0XHRcdFx0Ly8gRW5zdXJlIHdlIGNhbmNlbCB0aGUgYW5pbWF0aW9uIHRvIHByZXZlbnQgbGVha2luZ1xuXHRcdFx0XHRcdGludHJvPy5hYm9ydCgpO1xuXHRcdFx0XHRcdGludHJvID0gY3VycmVudF9vcHRpb25zID0gdW5kZWZpbmVkO1xuXG5cdFx0XHRcdFx0ZWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9IG92ZXJmbG93O1xuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXHRcdH0sXG5cdFx0b3V0KGZuKSB7XG5cdFx0XHRpZiAoIWlzX291dHJvKSB7XG5cdFx0XHRcdGZuPy4oKTtcblx0XHRcdFx0Y3VycmVudF9vcHRpb25zID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGVsZW1lbnQuaW5lcnQgPSB0cnVlO1xuXG5cdFx0XHRvdXRybyA9IGFuaW1hdGUoXG5cdFx0XHRcdGVsZW1lbnQsXG5cdFx0XHRcdGdldF9vcHRpb25zKCksXG5cdFx0XHRcdGludHJvLFxuXHRcdFx0XHQwLFxuXHRcdFx0XHQoKSA9PiB7XG5cdFx0XHRcdFx0ZGlzcGF0Y2hfZXZlbnQoZWxlbWVudCwgJ291dHJvc3RhcnQnKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0KCkgPT4ge1xuXHRcdFx0XHRcdGRpc3BhdGNoX2V2ZW50KGVsZW1lbnQsICdvdXRyb2VuZCcpO1xuXHRcdFx0XHRcdGZuPy4oKTtcblx0XHRcdFx0fVxuXHRcdFx0KTtcblx0XHR9LFxuXHRcdHN0b3A6ICgpID0+IHtcblx0XHRcdGludHJvPy5hYm9ydCgpO1xuXHRcdFx0b3V0cm8/LmFib3J0KCk7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBlID0gLyoqIEB0eXBlIHtFZmZlY3QgJiB7IG5vZGVzOiBFZmZlY3ROb2RlcyB9fSAqLyAoYWN0aXZlX2VmZmVjdCk7XG5cblx0KGUubm9kZXMudCA/Pz0gW10pLnB1c2godHJhbnNpdGlvbik7XG5cblx0Ly8gaWYgdGhpcyBpcyBhIGxvY2FsIHRyYW5zaXRpb24sIHdlIG9ubHkgd2FudCB0byBydW4gaXQgaWYgdGhlIHBhcmVudCAoYnJhbmNoKSBlZmZlY3Qnc1xuXHQvLyBwYXJlbnQgKGJsb2NrKSBlZmZlY3QgaXMgd2hlcmUgdGhlIHN0YXRlIGNoYW5nZSBoYXBwZW5lZC4gd2UgY2FuIGRldGVybWluZSB0aGF0IGJ5XG5cdC8vIGxvb2tpbmcgYXQgd2hldGhlciB0aGUgYmxvY2sgZWZmZWN0IGlzIGN1cnJlbnRseSBpbml0aWFsaXppbmdcblx0aWYgKGlzX2ludHJvICYmIHNob3VsZF9pbnRybykge1xuXHRcdHZhciBydW4gPSBpc19nbG9iYWw7XG5cblx0XHRpZiAoIXJ1bikge1xuXHRcdFx0dmFyIGJsb2NrID0gLyoqIEB0eXBlIHtFZmZlY3QgfCBudWxsfSAqLyAoZS5wYXJlbnQpO1xuXG5cdFx0XHQvLyBza2lwIG92ZXIgdHJhbnNwYXJlbnQgYmxvY2tzIChlLmcuIHNuaXBwZXRzLCBlbHNlLWlmIGJsb2Nrcylcblx0XHRcdHdoaWxlIChibG9jayAmJiAoYmxvY2suZiAmIEVGRkVDVF9UUkFOU1BBUkVOVCkgIT09IDApIHtcblx0XHRcdFx0d2hpbGUgKChibG9jayA9IGJsb2NrLnBhcmVudCkpIHtcblx0XHRcdFx0XHRpZiAoKGJsb2NrLmYgJiBCTE9DS19FRkZFQ1QpICE9PSAwKSBicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRydW4gPSAhYmxvY2sgfHwgKGJsb2NrLmYgJiBSRUFDVElPTl9SQU4pICE9PSAwO1xuXHRcdH1cblxuXHRcdGlmIChydW4pIHtcblx0XHRcdGVmZmVjdCgoKSA9PiB7XG5cdFx0XHRcdHVudHJhY2soKCkgPT4gdHJhbnNpdGlvbi5pbigpKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIEFuaW1hdGVzIGFuIGVsZW1lbnQsIGFjY29yZGluZyB0byB0aGUgcHJvdmlkZWQgY29uZmlndXJhdGlvblxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge0FuaW1hdGlvbkNvbmZpZyB8ICgob3B0czogeyBkaXJlY3Rpb246ICdpbicgfCAnb3V0JyB9KSA9PiBBbmltYXRpb25Db25maWcpfSBvcHRpb25zXG4gKiBAcGFyYW0ge0FuaW1hdGlvbiB8IHVuZGVmaW5lZH0gY291bnRlcnBhcnQgVGhlIGNvcnJlc3BvbmRpbmcgaW50cm8vb3V0cm8gdG8gdGhpcyBvdXRyby9pbnRyb1xuICogQHBhcmFtIHtudW1iZXJ9IHQyIFRoZSB0YXJnZXQgYHRgIHZhbHVlIOKAlCBgMWAgZm9yIGludHJvLCBgMGAgZm9yIG91dHJvXG4gKiBAcGFyYW0geygoKSA9PiB2b2lkKX0gb25fYmVnaW4gQ2FsbGVkIGp1c3QgYmVmb3JlIGJlZ2lubmluZyB0aGUgYW5pbWF0aW9uXG4gKiBAcGFyYW0geygoKSA9PiB2b2lkKX0gb25fZmluaXNoIENhbGxlZCBhZnRlciBzdWNjZXNzZnVsbHkgY29tcGxldGluZyB0aGUgYW5pbWF0aW9uXG4gKiBAcmV0dXJucyB7QW5pbWF0aW9ufVxuICovXG5mdW5jdGlvbiBhbmltYXRlKGVsZW1lbnQsIG9wdGlvbnMsIGNvdW50ZXJwYXJ0LCB0Miwgb25fYmVnaW4sIG9uX2ZpbmlzaCkge1xuXHR2YXIgaXNfaW50cm8gPSB0MiA9PT0gMTtcblx0dmFyIGFib3J0ZWQgPSBmYWxzZTtcblxuXHRpZiAoaXNfZnVuY3Rpb24ob3B0aW9ucykpIHtcblx0XHQvLyBJbiB0aGUgY2FzZSBvZiBhIGRlZmVycmVkIHRyYW5zaXRpb24gKHN1Y2ggYXMgYGNyb3NzZmFkZWApLCBgb3B0aW9uYCB3aWxsIGJlXG5cdFx0Ly8gYSBmdW5jdGlvbiByYXRoZXIgdGhhbiBhbiBgQW5pbWF0aW9uQ29uZmlnYC4gV2UgbmVlZCB0byBjYWxsIHRoaXMgZnVuY3Rpb25cblx0XHQvLyBvbmNlIHRoZSBET00gaGFzIGJlZW4gdXBkYXRlZC4uLlxuXHRcdC8qKiBAdHlwZSB7QW5pbWF0aW9ufSAqL1xuXHRcdHZhciBhO1xuXG5cdFx0cXVldWVfbWljcm9fdGFzaygoKSA9PiB7XG5cdFx0XHRpZiAoYWJvcnRlZCkgcmV0dXJuO1xuXHRcdFx0dmFyIG8gPSBvcHRpb25zKHsgZGlyZWN0aW9uOiBpc19pbnRybyA/ICdpbicgOiAnb3V0JyB9KTtcblx0XHRcdGEgPSBhbmltYXRlKGVsZW1lbnQsIG8sIGNvdW50ZXJwYXJ0LCB0Miwgb25fYmVnaW4sIG9uX2ZpbmlzaCk7XG5cdFx0fSk7XG5cblx0XHQvLyAuLi5idXQgd2Ugd2FudCB0byBkbyBzbyB3aXRob3V0IHVzaW5nIGBhc3luY2AvYGF3YWl0YCBldmVyeXdoZXJlLCBzb1xuXHRcdC8vIHdlIHJldHVybiBhIGZhY2FkZSB0aGF0IGFsbG93cyBldmVyeXRoaW5nIHRvIHJlbWFpbiBzeW5jaHJvbm91c1xuXHRcdHJldHVybiB7XG5cdFx0XHRhYm9ydDogKCkgPT4ge1xuXHRcdFx0XHRhYm9ydGVkID0gdHJ1ZTtcblx0XHRcdFx0YT8uYWJvcnQoKTtcblx0XHRcdH0sXG5cdFx0XHRkZWFjdGl2YXRlOiAoKSA9PiBhPy5kZWFjdGl2YXRlKCksXG5cdFx0XHRyZXNldDogKCkgPT4gYT8ucmVzZXQoKSxcblx0XHRcdHQ6ICgpID0+IGE/LnQoKSA/PyAxIC0gdDJcblx0XHR9O1xuXHR9XG5cblx0Y291bnRlcnBhcnQ/LmRlYWN0aXZhdGUoKTtcblxuXHRpZiAoIW9wdGlvbnM/LmR1cmF0aW9uICYmICFvcHRpb25zPy5kZWxheSkge1xuXHRcdG9uX2JlZ2luKCk7XG5cdFx0b25fZmluaXNoKCk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0YWJvcnQ6IG5vb3AsXG5cdFx0XHRkZWFjdGl2YXRlOiBub29wLFxuXHRcdFx0cmVzZXQ6IG5vb3AsXG5cdFx0XHR0OiAoKSA9PiB0MlxuXHRcdH07XG5cdH1cblxuXHRjb25zdCB7IGRlbGF5ID0gMCwgY3NzLCB0aWNrLCBlYXNpbmcgPSBsaW5lYXIgfSA9IG9wdGlvbnM7XG5cblx0LyoqIEB0eXBlIHtnbG9iYWxUaGlzLkFuaW1hdGlvbn0gKi9cblx0dmFyIGFuaW1hdGlvbjtcblxuXHR2YXIgZ2V0X3QgPSAoKSA9PiAxIC0gdDI7XG5cblx0Ly8gd2FpdCBhIG1pY3JvdGFzayBiZWZvcmUgYXBwbHlpbmcgdGhlIGluaXRpYWwgc3R5bGVzIGFuZCBjcmVhdGluZyB0aGUgZHVtbXkgYW5pbWF0aW9uLFxuXHQvLyBzbyB0aGF0IHRyYW5zaXRpb25zIGNyZWF0ZWQgaW4gdGhlIHNhbWUgYmF0Y2ggKGUuZy4gb24gbmVzdGVkIGVsZW1lbnRzKSBhbGwgbWVhc3VyZVxuXHQvLyB0aGUgRE9NIGZpcnN0ICgjMTg0MjEpLiB0aGlzIHN0aWxsIGhhcHBlbnMgYmVmb3JlIHRoZSBuZXh0IHBhaW50LCBzbyB0aGUgZWxlbWVudFxuXHQvLyB3b24ndCBiZSByZW5kZXJlZCB3aXRob3V0IHN0eWxlcyBhcHBsaWVkICgjMTQ3MzIpXG5cdHF1ZXVlX21pY3JvX3Rhc2soKCkgPT4ge1xuXHRcdGlmIChhYm9ydGVkKSByZXR1cm47XG5cblx0XHR2YXIga2V5ZnJhbWVzID0gW107XG5cblx0XHRpZiAoaXNfaW50cm8gJiYgY291bnRlcnBhcnQgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0aWYgKHRpY2spIHtcblx0XHRcdFx0dGljaygwLCAxKTsgLy8gVE9ETyBwdXQgaW4gbmVzdGVkIGVmZmVjdCwgdG8gYXZvaWQgaW50ZXJsZWF2ZWQgcmVhZHMvd3JpdGVzP1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoY3NzKSB7XG5cdFx0XHRcdHZhciBzdHlsZXMgPSBjc3NfdG9fa2V5ZnJhbWUoY3NzKDAsIDEpKTtcblx0XHRcdFx0a2V5ZnJhbWVzLnB1c2goc3R5bGVzLCBzdHlsZXMpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIGNyZWF0ZSBhIGR1bW15IGFuaW1hdGlvbiB0aGF0IGxhc3RzIGFzIGxvbmcgYXMgdGhlIGRlbGF5IChidXQgd2l0aCB3aGF0ZXZlciBkZXZ0b29sc1xuXHRcdC8vIG11bHRpcGxpZXIgaXMgaW4gZWZmZWN0KS4gaW4gdGhlIGNvbW1vbiBjYXNlIHRoYXQgaXQgaXMgYDBgLCB3ZSBrZWVwIGl0IGFueXdheSBzbyB0aGF0XG5cdFx0Ly8gdGhlIENTUyBrZXlmcmFtZXMgYXJlbid0IGNyZWF0ZWQgdW50aWwgdGhlIERPTSBpcyB1cGRhdGVkXG5cdFx0Ly9cblx0XHQvLyBmaWxsIGZvcndhcmRzIHRvIHByZXZlbnQgdGhlIGVsZW1lbnQgZnJvbSByZW5kZXJpbmcgd2l0aG91dCBzdHlsZXMgYXBwbGllZFxuXHRcdC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vc3ZlbHRlanMvc3ZlbHRlL2lzc3Vlcy8xNDczMlxuXHRcdGFuaW1hdGlvbiA9IGVsZW1lbnQuYW5pbWF0ZShrZXlmcmFtZXMsIHsgZHVyYXRpb246IGRlbGF5LCBmaWxsOiAnZm9yd2FyZHMnIH0pO1xuXG5cdFx0YW5pbWF0aW9uLm9uZmluaXNoID0gKCkgPT4ge1xuXHRcdFx0Ly8gcmVtb3ZlIGR1bW15IGFuaW1hdGlvbiBmcm9tIHRoZSBzdGFjayB0byBwcmV2ZW50IGNvbmZsaWN0IHdpdGggbWFpbiBhbmltYXRpb25cblx0XHRcdGFuaW1hdGlvbi5jYW5jZWwoKTtcblxuXHRcdFx0b25fYmVnaW4oKTtcblxuXHRcdFx0Ly8gZm9yIGJpZGlyZWN0aW9uYWwgdHJhbnNpdGlvbnMsIHdlIHN0YXJ0IGZyb20gdGhlIGN1cnJlbnQgcG9zaXRpb24sXG5cdFx0XHQvLyByYXRoZXIgdGhhbiBkb2luZyBhIGZ1bGwgaW50cm8vb3V0cm9cblx0XHRcdHZhciB0MSA9IGNvdW50ZXJwYXJ0Py50KCkgPz8gMSAtIHQyO1xuXHRcdFx0Y291bnRlcnBhcnQ/LmFib3J0KCk7XG5cblx0XHRcdHZhciBkZWx0YSA9IHQyIC0gdDE7XG5cdFx0XHR2YXIgZHVyYXRpb24gPSAvKiogQHR5cGUge251bWJlcn0gKi8gKG9wdGlvbnMuZHVyYXRpb24pICogTWF0aC5hYnMoZGVsdGEpO1xuXHRcdFx0dmFyIGtleWZyYW1lcyA9IFtdO1xuXG5cdFx0XHRpZiAoZHVyYXRpb24gPiAwKSB7XG5cdFx0XHRcdC8qKlxuXHRcdFx0XHQgKiBXaGV0aGVyIG9yIG5vdCB0aGUgQ1NTIGluY2x1ZGVzIGBvdmVyZmxvdzogaGlkZGVuYCwgaW4gd2hpY2ggY2FzZSB3ZSBuZWVkIHRvXG5cdFx0XHRcdCAqIGFkZCBpdCBhcyBhbiBpbmxpbmUgc3R5bGUgdG8gd29yayBhcm91bmQgYSBTYWZhcmkgPDE4IGJ1Z1xuXHRcdFx0XHQgKiBUT0RPIDYuMCByZW1vdmUgdGhpcywgaWYgcG9zc2libGVcblx0XHRcdFx0ICovXG5cdFx0XHRcdHZhciBuZWVkc19vdmVyZmxvd19oaWRkZW4gPSBmYWxzZTtcblxuXHRcdFx0XHRpZiAoY3NzKSB7XG5cdFx0XHRcdFx0dmFyIG4gPSBNYXRoLmNlaWwoZHVyYXRpb24gLyAoMTAwMCAvIDYwKSk7IC8vIGBuYCBtdXN0IGJlIGFuIGludGVnZXIsIG9yIHdlIHJpc2sgbWlzc2luZyB0aGUgYHQyYCB2YWx1ZVxuXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPD0gbjsgaSArPSAxKSB7XG5cdFx0XHRcdFx0XHR2YXIgdCA9IHQxICsgZGVsdGEgKiBlYXNpbmcoaSAvIG4pO1xuXHRcdFx0XHRcdFx0dmFyIHN0eWxlcyA9IGNzc190b19rZXlmcmFtZShjc3ModCwgMSAtIHQpKTtcblx0XHRcdFx0XHRcdGtleWZyYW1lcy5wdXNoKHN0eWxlcyk7XG5cblx0XHRcdFx0XHRcdG5lZWRzX292ZXJmbG93X2hpZGRlbiB8fD0gc3R5bGVzLm92ZXJmbG93ID09PSAnaGlkZGVuJztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAobmVlZHNfb3ZlcmZsb3dfaGlkZGVuKSB7XG5cdFx0XHRcdFx0LyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGVsZW1lbnQpLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRnZXRfdCA9ICgpID0+IHtcblx0XHRcdFx0XHR2YXIgdGltZSA9IC8qKiBAdHlwZSB7bnVtYmVyfSAqLyAoXG5cdFx0XHRcdFx0XHQvKiogQHR5cGUge2dsb2JhbFRoaXMuQW5pbWF0aW9ufSAqLyAoYW5pbWF0aW9uKS5jdXJyZW50VGltZVxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRyZXR1cm4gdDEgKyBkZWx0YSAqIGVhc2luZyh0aW1lIC8gZHVyYXRpb24pO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGlmICh0aWNrKSB7XG5cdFx0XHRcdFx0bG9vcCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoYW5pbWF0aW9uLnBsYXlTdGF0ZSAhPT0gJ3J1bm5pbmcnKSByZXR1cm4gZmFsc2U7XG5cblx0XHRcdFx0XHRcdHZhciB0ID0gZ2V0X3QoKTtcblx0XHRcdFx0XHRcdHRpY2sodCwgMSAtIHQpO1xuXG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRhbmltYXRpb24gPSBlbGVtZW50LmFuaW1hdGUoa2V5ZnJhbWVzLCB7IGR1cmF0aW9uLCBmaWxsOiAnZm9yd2FyZHMnIH0pO1xuXG5cdFx0XHRhbmltYXRpb24ub25maW5pc2ggPSAoKSA9PiB7XG5cdFx0XHRcdGdldF90ID0gKCkgPT4gdDI7XG5cdFx0XHRcdHRpY2s/Lih0MiwgMSAtIHQyKTtcblx0XHRcdFx0b25fZmluaXNoKCk7XG5cdFx0XHR9O1xuXHRcdH07XG5cdH0pO1xuXG5cdHJldHVybiB7XG5cdFx0YWJvcnQ6ICgpID0+IHtcblx0XHRcdGFib3J0ZWQgPSB0cnVlO1xuXG5cdFx0XHRpZiAoYW5pbWF0aW9uKSB7XG5cdFx0XHRcdGFuaW1hdGlvbi5jYW5jZWwoKTtcblx0XHRcdFx0Ly8gVGhpcyBwcmV2ZW50cyBtZW1vcnkgbGVha3MgaW4gQ2hyb21pdW1cblx0XHRcdFx0YW5pbWF0aW9uLmVmZmVjdCA9IG51bGw7XG5cdFx0XHRcdC8vIFRoaXMgcHJldmVudHMgb25maW5pc2ggdG8gYmUgbGF1bmNoZWQgYWZ0ZXIgY2FuY2VsKCksXG5cdFx0XHRcdC8vIHdoaWNoIGNhbiBoYXBwZW4gaW4gc29tZSByYXJlIGNhc2VzXG5cdFx0XHRcdC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vc3ZlbHRlanMvc3ZlbHRlL2lzc3Vlcy8xMzY4MVxuXHRcdFx0XHRhbmltYXRpb24ub25maW5pc2ggPSBub29wO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0ZGVhY3RpdmF0ZTogKCkgPT4ge1xuXHRcdFx0b25fZmluaXNoID0gbm9vcDtcblx0XHR9LFxuXHRcdHJlc2V0OiAoKSA9PiB7XG5cdFx0XHRpZiAodDIgPT09IDApIHtcblx0XHRcdFx0dGljaz8uKDEsIDApO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0dDogKCkgPT4gZ2V0X3QoKVxuXHR9O1xufVxuIiwiLyoqIEBpbXBvcnQgeyBFZmZlY3QsIEVmZmVjdE5vZGVzLCBUZW1wbGF0ZU5vZGUgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgRklMRU5BTUUsIE5BTUVTUEFDRV9TVkcgfSBmcm9tICcuLi8uLi8uLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHtcblx0aHlkcmF0ZV9uZXh0LFxuXHRoeWRyYXRlX25vZGUsXG5cdGh5ZHJhdGluZyxcblx0c2V0X2h5ZHJhdGVfbm9kZSxcblx0c2V0X2h5ZHJhdGluZ1xufSBmcm9tICcuLi9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgY3JlYXRlX2VsZW1lbnQsIGNyZWF0ZV90ZXh0LCBnZXRfZmlyc3RfY2hpbGQgfSBmcm9tICcuLi9vcGVyYXRpb25zLmpzJztcbmltcG9ydCB7IGJsb2NrLCB0ZWFyZG93biB9IGZyb20gJy4uLy4uL3JlYWN0aXZpdHkvZWZmZWN0cy5qcyc7XG5pbXBvcnQgeyBzZXRfc2hvdWxkX2ludHJvIH0gZnJvbSAnLi4vLi4vcmVuZGVyLmpzJztcbmltcG9ydCB7IGFjdGl2ZV9lZmZlY3QgfSBmcm9tICcuLi8uLi9ydW50aW1lLmpzJztcbmltcG9ydCB7IGNvbXBvbmVudF9jb250ZXh0LCBkZXZfc3RhY2sgfSBmcm9tICcuLi8uLi9jb250ZXh0LmpzJztcbmltcG9ydCB7IERFViB9IGZyb20gJ2VzbS1lbnYnO1xuaW1wb3J0IHsgRUZGRUNUX1RSQU5TUEFSRU5ULCBFTEVNRU5UX05PREUgfSBmcm9tICcjY2xpZW50L2NvbnN0YW50cyc7XG5pbXBvcnQgeyBhc3NpZ25fbm9kZXMgfSBmcm9tICcuLi90ZW1wbGF0ZS5qcyc7XG5pbXBvcnQgeyBpc19yYXdfdGV4dF9lbGVtZW50IH0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMuanMnO1xuaW1wb3J0IHsgQnJhbmNoTWFuYWdlciB9IGZyb20gJy4vYnJhbmNoZXMuanMnO1xuaW1wb3J0IHsgc2V0X2FuaW1hdGlvbl9lZmZlY3Rfb3ZlcnJpZGUgfSBmcm9tICcuLi9lbGVtZW50cy90cmFuc2l0aW9ucy5qcyc7XG5cbi8qKlxuICogQHBhcmFtIHtDb21tZW50IHwgRWxlbWVudH0gbm9kZVxuICogQHBhcmFtIHsoKSA9PiBzdHJpbmd9IGdldF90YWdcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNfc3ZnXG4gKiBAcGFyYW0ge3VuZGVmaW5lZCB8ICgoZWxlbWVudDogRWxlbWVudCwgYW5jaG9yOiBOb2RlIHwgbnVsbCkgPT4gdm9pZCl9IHJlbmRlcl9mbixcbiAqIEBwYXJhbSB7dW5kZWZpbmVkIHwgKCgpID0+IHN0cmluZyl9IGdldF9uYW1lc3BhY2VcbiAqIEBwYXJhbSB7dW5kZWZpbmVkIHwgW251bWJlciwgbnVtYmVyXX0gbG9jYXRpb25cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudChub2RlLCBnZXRfdGFnLCBpc19zdmcsIHJlbmRlcl9mbiwgZ2V0X25hbWVzcGFjZSwgbG9jYXRpb24pIHtcblx0bGV0IHdhc19oeWRyYXRpbmcgPSBoeWRyYXRpbmc7XG5cblx0aWYgKGh5ZHJhdGluZykge1xuXHRcdGh5ZHJhdGVfbmV4dCgpO1xuXHR9XG5cblx0dmFyIGZpbGVuYW1lID0gREVWICYmIGxvY2F0aW9uICYmIGNvbXBvbmVudF9jb250ZXh0Py5mdW5jdGlvbltGSUxFTkFNRV07XG5cblx0LyoqIEB0eXBlIHtudWxsIHwgRWxlbWVudH0gKi9cblx0dmFyIGVsZW1lbnQgPSBudWxsO1xuXG5cdGlmIChoeWRyYXRpbmcgJiYgaHlkcmF0ZV9ub2RlLm5vZGVUeXBlID09PSBFTEVNRU5UX05PREUpIHtcblx0XHRlbGVtZW50ID0gLyoqIEB0eXBlIHtFbGVtZW50fSAqLyAoaHlkcmF0ZV9ub2RlKTtcblx0XHRoeWRyYXRlX25leHQoKTtcblx0fVxuXG5cdHZhciBhbmNob3IgPSAvKiogQHR5cGUge1RlbXBsYXRlTm9kZX0gKi8gKGh5ZHJhdGluZyA/IGh5ZHJhdGVfbm9kZSA6IG5vZGUpO1xuXG5cdC8qKlxuXHQgKiBXZSB0cmFjayB0aGlzIHNvIHdlIGNhbiBzZXQgaXQgd2hlbiBjaGFuZ2luZyB0aGUgZWxlbWVudCwgYWxsb3dpbmcgYW55XG5cdCAqIGBhbmltYXRlOmAgZGlyZWN0aXZlIHRvIGJpbmQgaXRzZWxmIHRvIHRoZSBjb3JyZWN0IGJsb2NrXG5cdCAqL1xuXHR2YXIgcGFyZW50X2VmZmVjdCA9IC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAoYWN0aXZlX2VmZmVjdCk7XG5cblx0dmFyIGJyYW5jaGVzID0gbmV3IEJyYW5jaE1hbmFnZXIoYW5jaG9yLCBmYWxzZSk7XG5cblx0YmxvY2soKCkgPT4ge1xuXHRcdGNvbnN0IG5leHRfdGFnID0gZ2V0X3RhZygpIHx8IG51bGw7XG5cdFx0dmFyIG5zID0gZ2V0X25hbWVzcGFjZVxuXHRcdFx0PyBnZXRfbmFtZXNwYWNlKClcblx0XHRcdDogaXNfc3ZnIHx8IG5leHRfdGFnID09PSAnc3ZnJ1xuXHRcdFx0XHQ/IE5BTUVTUEFDRV9TVkdcblx0XHRcdFx0OiB1bmRlZmluZWQ7XG5cblx0XHRpZiAobmV4dF90YWcgPT09IG51bGwpIHtcblx0XHRcdGJyYW5jaGVzLmVuc3VyZShudWxsLCBudWxsKTtcblx0XHRcdHNldF9zaG91bGRfaW50cm8odHJ1ZSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0YnJhbmNoZXMuZW5zdXJlKG5leHRfdGFnLCAoYW5jaG9yKSA9PiB7XG5cdFx0XHRpZiAobmV4dF90YWcpIHtcblx0XHRcdFx0dmFyIGlzX2h5ZHJhdGluZyA9IGh5ZHJhdGluZztcblx0XHRcdFx0ZWxlbWVudCA9IGh5ZHJhdGluZyA/IC8qKiBAdHlwZSB7RWxlbWVudH0gKi8gKGVsZW1lbnQpIDogY3JlYXRlX2VsZW1lbnQobmV4dF90YWcsIG5zKTtcblxuXHRcdFx0XHRpZiAoREVWICYmIGxvY2F0aW9uKSB7XG5cdFx0XHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRcdFx0XHRcdGVsZW1lbnQuX19zdmVsdGVfbWV0YSA9IHtcblx0XHRcdFx0XHRcdHBhcmVudDogZGV2X3N0YWNrLFxuXHRcdFx0XHRcdFx0bG9jOiB7XG5cdFx0XHRcdFx0XHRcdGZpbGU6IGZpbGVuYW1lLFxuXHRcdFx0XHRcdFx0XHRsaW5lOiBsb2NhdGlvblswXSxcblx0XHRcdFx0XHRcdFx0Y29sdW1uOiBsb2NhdGlvblsxXVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhc3NpZ25fbm9kZXMoZWxlbWVudCwgZWxlbWVudCk7XG5cblx0XHRcdFx0aWYgKHJlbmRlcl9mbikge1xuXHRcdFx0XHRcdHZhciB0bXBfY29tbWVudCA9IG51bGw7XG5cblx0XHRcdFx0XHRpZiAoaHlkcmF0aW5nICYmIGlzX3Jhd190ZXh0X2VsZW1lbnQobmV4dF90YWcpKSB7XG5cdFx0XHRcdFx0XHQvLyBwcmV2ZW50IGh5ZHJhdGlvbiBnbGl0Y2hlcyAoY29kZSBqdXN0IGJlbG93IGV4cGVjdHMgYW4gYW5jaG9yKVxuXHRcdFx0XHRcdFx0ZWxlbWVudC5hcHBlbmQoKHRtcF9jb21tZW50ID0gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnJykpKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBJZiBoeWRyYXRpbmcsIHVzZSB0aGUgZXhpc3Rpbmcgc3NyIGNvbW1lbnQgYXMgdGhlIGFuY2hvciBzbyB0aGF0IHRoZVxuXHRcdFx0XHRcdC8vIGlubmVyIG9wZW4gYW5kIGNsb3NlIG1ldGhvZHMgY2FuIHBpY2sgdXAgdGhlIGV4aXN0aW5nIG5vZGVzIGNvcnJlY3RseVxuXHRcdFx0XHRcdHZhciBjaGlsZF9hbmNob3IgPSBoeWRyYXRpbmdcblx0XHRcdFx0XHRcdD8gZ2V0X2ZpcnN0X2NoaWxkKGVsZW1lbnQpXG5cdFx0XHRcdFx0XHQ6IGVsZW1lbnQuYXBwZW5kQ2hpbGQoY3JlYXRlX3RleHQoKSk7XG5cblx0XHRcdFx0XHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0XHRcdFx0XHRpZiAoY2hpbGRfYW5jaG9yID09PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHNldF9oeWRyYXRpbmcoZmFsc2UpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0c2V0X2h5ZHJhdGVfbm9kZShjaGlsZF9hbmNob3IpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHNldF9hbmltYXRpb25fZWZmZWN0X292ZXJyaWRlKHBhcmVudF9lZmZlY3QpO1xuXG5cdFx0XHRcdFx0Ly8gYGNoaWxkX2FuY2hvcmAgaXMgdW5kZWZpbmVkIGlmIHRoaXMgaXMgYSB2b2lkIGVsZW1lbnQsIGJ1dCB3ZSBzdGlsbFxuXHRcdFx0XHRcdC8vIG5lZWQgdG8gY2FsbCBgcmVuZGVyX2ZuYCBpbiBvcmRlciB0byBydW4gYWN0aW9ucyBldGMuIElmIHRoZSBlbGVtZW50XG5cdFx0XHRcdFx0Ly8gY29udGFpbnMgY2hpbGRyZW4sIGl0J3MgYSB1c2VyIGVycm9yICh3aGljaCBpcyB3YXJuZWQgb24gZWxzZXdoZXJlKVxuXHRcdFx0XHRcdC8vIGFuZCB0aGUgRE9NIHdpbGwgYmUgc2lsZW50bHkgZGlzY2FyZGVkXG5cdFx0XHRcdFx0cmVuZGVyX2ZuKGVsZW1lbnQsIGNoaWxkX2FuY2hvcik7XG5cdFx0XHRcdFx0dG1wX2NvbW1lbnQ/LnJlbW92ZSgpO1xuXHRcdFx0XHRcdHNldF9hbmltYXRpb25fZWZmZWN0X292ZXJyaWRlKG51bGwpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gd2UgZG8gdGhpcyBhZnRlciBjYWxsaW5nIGByZW5kZXJfZm5gIHNvIHRoYXQgY2hpbGQgZWZmZWN0cyBkb24ndCBvdmVycmlkZSBgbm9kZXMuZW5kYFxuXHRcdFx0XHQvKiogQHR5cGUge0VmZmVjdCAmIHsgbm9kZXM6IEVmZmVjdE5vZGVzIH19ICovIChhY3RpdmVfZWZmZWN0KS5ub2Rlcy5lbmQgPSBlbGVtZW50O1xuXG5cdFx0XHRcdC8vIHdlIG9ubHkgbW92ZSB0aGUgbm9kZSBpZiB3ZSBhcmUgbm90IGh5ZHJhdGluZyBzaW5jZSBhIGNsYWltZWQgZWxlbWVudCBpcyBhbHJlYWR5IGluIHBsYWNlXG5cdFx0XHRcdGlmICghaXNfaHlkcmF0aW5nKSBhbmNob3IuYmVmb3JlKGVsZW1lbnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0XHRcdHNldF9oeWRyYXRlX25vZGUoYW5jaG9yKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIHJldmVydCB0byB0aGUgZGVmYXVsdCBzdGF0ZSBhZnRlciB0aGUgZWZmZWN0IGhhcyBiZWVuIGNyZWF0ZWRcblx0XHRzZXRfc2hvdWxkX2ludHJvKHRydWUpO1xuXG5cdFx0cmV0dXJuICgpID0+IHtcblx0XHRcdGlmIChuZXh0X3RhZykge1xuXHRcdFx0XHQvLyBpZiB3ZSdyZSBpbiB0aGlzIGNhbGxiYWNrIGJlY2F1c2Ugd2UncmUgcmUtcnVubmluZyB0aGUgZWZmZWN0LFxuXHRcdFx0XHQvLyBkaXNhYmxlIGludHJvcyAodW5sZXNzIG5vIGVsZW1lbnQgaXMgY3VycmVudGx5IGRpc3BsYXllZClcblx0XHRcdFx0c2V0X3Nob3VsZF9pbnRybyhmYWxzZSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSwgRUZGRUNUX1RSQU5TUEFSRU5UKTtcblxuXHR0ZWFyZG93bigoKSA9PiB7XG5cdFx0c2V0X3Nob3VsZF9pbnRybyh0cnVlKTtcblx0fSk7XG5cblx0aWYgKHdhc19oeWRyYXRpbmcpIHtcblx0XHRzZXRfaHlkcmF0aW5nKHRydWUpO1xuXHRcdHNldF9oeWRyYXRlX25vZGUoYW5jaG9yKTtcblx0fVxufVxuIiwiLyoqIEBpbXBvcnQgeyBUZW1wbGF0ZU5vZGUgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgaHlkcmF0ZV9ub2RlLCBoeWRyYXRpbmcsIHNldF9oeWRyYXRlX25vZGUsIHNldF9oeWRyYXRpbmcgfSBmcm9tICcuLi9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgY3JlYXRlX3RleHQsIGdldF9maXJzdF9jaGlsZCwgZ2V0X25leHRfc2libGluZyB9IGZyb20gJy4uL29wZXJhdGlvbnMuanMnO1xuaW1wb3J0IHsgYmxvY2ssIGJyYW5jaCB9IGZyb20gJy4uLy4uL3JlYWN0aXZpdHkvZWZmZWN0cy5qcyc7XG5pbXBvcnQgeyBDT01NRU5UX05PREUsIEhFQURfRUZGRUNUIH0gZnJvbSAnI2NsaWVudC9jb25zdGFudHMnO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBoYXNoXG4gKiBAcGFyYW0geyhhbmNob3I6IE5vZGUpID0+IHZvaWR9IHJlbmRlcl9mblxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoZWFkKGhhc2gsIHJlbmRlcl9mbikge1xuXHQvLyBUaGUgaGVhZCBmdW5jdGlvbiBtYXkgYmUgY2FsbGVkIGFmdGVyIHRoZSBmaXJzdCBoeWRyYXRpb24gcGFzcyBhbmQgc3NyIGNvbW1lbnQgbm9kZXMgbWF5IHN0aWxsIGJlIHByZXNlbnQsXG5cdC8vIHRoZXJlZm9yZSB3ZSBuZWVkIHRvIHNraXAgdGhhdCB3aGVuIHdlIGRldGVjdCB0aGF0IHdlJ3JlIG5vdCBpbiBoeWRyYXRpb24gbW9kZS5cblx0bGV0IHByZXZpb3VzX2h5ZHJhdGVfbm9kZSA9IG51bGw7XG5cdGxldCB3YXNfaHlkcmF0aW5nID0gaHlkcmF0aW5nO1xuXG5cdC8qKiBAdHlwZSB7Q29tbWVudCB8IFRleHR9ICovXG5cdHZhciBhbmNob3I7XG5cblx0aWYgKGh5ZHJhdGluZykge1xuXHRcdHByZXZpb3VzX2h5ZHJhdGVfbm9kZSA9IGh5ZHJhdGVfbm9kZTtcblxuXHRcdHZhciBoZWFkX2FuY2hvciA9IGdldF9maXJzdF9jaGlsZChkb2N1bWVudC5oZWFkKTtcblxuXHRcdC8vIFRoZXJlIG1pZ2h0IGJlIG11bHRpcGxlIGhlYWQgYmxvY2tzIGluIG91ciBhcHAsIGFuZCB0aGV5IGNvdWxkIGhhdmUgYmVlblxuXHRcdC8vIHJlbmRlcmVkIGluIGFuIGFyYml0cmFyeSBvcmRlciDigJQgZmluZCBvbmUgY29ycmVzcG9uZGluZyB0byB0aGlzIGNvbXBvbmVudFxuXHRcdHdoaWxlIChcblx0XHRcdGhlYWRfYW5jaG9yICE9PSBudWxsICYmXG5cdFx0XHQoaGVhZF9hbmNob3Iubm9kZVR5cGUgIT09IENPTU1FTlRfTk9ERSB8fCAvKiogQHR5cGUge0NvbW1lbnR9ICovIChoZWFkX2FuY2hvcikuZGF0YSAhPT0gaGFzaClcblx0XHQpIHtcblx0XHRcdGhlYWRfYW5jaG9yID0gZ2V0X25leHRfc2libGluZyhoZWFkX2FuY2hvcik7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgd2UgY2FuJ3QgZmluZCBhbiBvcGVuaW5nIGh5ZHJhdGlvbiBtYXJrZXIsIHNraXAgaHlkcmF0aW9uICh0aGlzIGNhbiBoYXBwZW5cblx0XHQvLyBpZiBhIGZyYW1ld29yayByZW5kZXJlZCBib2R5IGJ1dCBub3QgaGVhZCBjb250ZW50KVxuXHRcdGlmIChoZWFkX2FuY2hvciA9PT0gbnVsbCkge1xuXHRcdFx0c2V0X2h5ZHJhdGluZyhmYWxzZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBzdGFydCA9IC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoZ2V0X25leHRfc2libGluZyhoZWFkX2FuY2hvcikpO1xuXHRcdFx0aGVhZF9hbmNob3IucmVtb3ZlKCk7IC8vIGluIGNhc2UgdGhpcyBjb21wb25lbnQgaXMgcmVwZWF0ZWRcblxuXHRcdFx0c2V0X2h5ZHJhdGVfbm9kZShzdGFydCk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFoeWRyYXRpbmcpIHtcblx0XHRhbmNob3IgPSBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGNyZWF0ZV90ZXh0KCkpO1xuXHR9XG5cblx0dHJ5IHtcblx0XHRibG9jaygoKSA9PiB7XG5cdFx0XHR2YXIgZSA9IGJyYW5jaCgoKSA9PiByZW5kZXJfZm4oYW5jaG9yKSk7XG5cdFx0XHRlLmYgfD0gSEVBRF9FRkZFQ1Q7XG5cblx0XHRcdGlmICghaHlkcmF0aW5nKSB7XG5cdFx0XHRcdGlmIChlLm5vZGVzID09PSBudWxsKSB7XG5cdFx0XHRcdFx0ZS5ub2RlcyA9IHsgc3RhcnQ6IGFuY2hvciwgZW5kOiBhbmNob3IsIGE6IG51bGwsIHQ6IG51bGwgfTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRlLm5vZGVzLmVuZCA9IGFuY2hvcjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9IGZpbmFsbHkge1xuXHRcdGlmICh3YXNfaHlkcmF0aW5nKSB7XG5cdFx0XHRzZXRfaHlkcmF0aW5nKHRydWUpO1xuXHRcdFx0c2V0X2h5ZHJhdGVfbm9kZSgvKiogQHR5cGUge1RlbXBsYXRlTm9kZX0gKi8gKHByZXZpb3VzX2h5ZHJhdGVfbm9kZSkpO1xuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgREVWIH0gZnJvbSAnZXNtLWVudic7XG5pbXBvcnQgeyByZWdpc3Rlcl9zdHlsZSB9IGZyb20gJy4uL2Rldi9jc3MuanMnO1xuaW1wb3J0IHsgZWZmZWN0IH0gZnJvbSAnLi4vcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcbmltcG9ydCB7IGNyZWF0ZV9lbGVtZW50IH0gZnJvbSAnLi9vcGVyYXRpb25zLmpzJztcbmltcG9ydCB7IGFjdGl2ZV9lZmZlY3QgfSBmcm9tICcuLi9ydW50aW1lLmpzJztcblxuLyoqXG4gKiBAcGFyYW0ge05vZGV9IGFuY2hvclxuICogQHBhcmFtIHt7IGhhc2g6IHN0cmluZywgY29kZTogc3RyaW5nIH19IGNzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kX3N0eWxlcyhhbmNob3IsIGNzcykge1xuXHQvLyBVc2UgYW4gZWZmZWN0IHRvIGVuc3VyZSBgYW5jaG9yYCBpcyBpbiB0aGUgRE9NLCBvdGhlcndpc2UgZ2V0Um9vdE5vZGUoKSB3aWxsIHlpZWxkIHdyb25nIHJlc3VsdHNcblx0ZWZmZWN0KCgpID0+IHtcblx0XHQvLyBCaXQgb2YgYSBoYWNrOiBicmFuY2hlcy5qcy9lYWNoLmpzIHVzZSBvZmZzY3JlZW4gZnJhZ21lbnRzIHdpdGggdGVtcG9yYXJ5IHRleHQgbm9kZXMgdGhhdCB3aWxsXG5cdFx0Ly8gbmV2ZXIgYmUgY29ubmVjdGVkIHRvIHRoZSByZWFsIGRvbS4gVGhlcmVmb3JlIHdhbGsgdXAgdG8gdGhlIGJyYW5jaCB0aGF0IGhhcyBjcmVhdGVkIHRoZSBjb21wb25lbnRcblx0XHQvLyB3aG9zZSBzdHlsZXMgd2Ugd2FudCB0byBhcHBlbmQsIGFuZCBjaGVjayBpdHMgbm9kZSBpbnN0ZWFkLiBJdCB3aWxsIGJlIGNvbm5lY3RlZCBieSB0aGUgdGltZSB3ZSBnZXQgaGVyZS5cblx0XHRhbmNob3IgPSBhY3RpdmVfZWZmZWN0Py5wYXJlbnQ/Lm5vZGVzPy5zdGFydCA/PyBhbmNob3I7XG5cdFx0dmFyIHJvb3QgPSBhbmNob3IuZ2V0Um9vdE5vZGUoKTtcblxuXHRcdHZhciB0YXJnZXQgPSAvKiogQHR5cGUge1NoYWRvd1Jvb3R9ICovIChyb290KS5ob3N0XG5cdFx0XHQ/IC8qKiBAdHlwZSB7U2hhZG93Um9vdH0gKi8gKHJvb3QpXG5cdFx0XHQ6IC8qKiBAdHlwZSB7RG9jdW1lbnR9ICovIChyb290KS5oZWFkID8/IC8qKiBAdHlwZSB7RG9jdW1lbnR9ICovIChyb290Lm93bmVyRG9jdW1lbnQpLmhlYWQ7XG5cblx0XHQvLyBBbHdheXMgcXVlcnlpbmcgdGhlIERPTSBpcyByb3VnaGx5IHRoZSBzYW1lIHBlcmYgYXMgYWRkaXRpb25hbGx5IGNoZWNraW5nIGZvciBwcmVzZW5jZSBpbiBhIG1hcCBmaXJzdCBhc3N1bWluZ1xuXHRcdC8vIHRoYXQgeW91J2xsIGdldCBjYWNoZSBoaXRzIGhhbGYgb2YgdGhlIHRpbWUsIHNvIHdlIGp1c3QgYWx3YXlzIHF1ZXJ5IHRoZSBkb20gZm9yIHNpbXBsaWNpdHkgYW5kIGNvZGUgc2F2aW5ncy5cblx0XHRpZiAoIXRhcmdldC5xdWVyeVNlbGVjdG9yKCcjJyArIGNzcy5oYXNoKSkge1xuXHRcdFx0Y29uc3Qgc3R5bGUgPSBjcmVhdGVfZWxlbWVudCgnc3R5bGUnKTtcblx0XHRcdHN0eWxlLmlkID0gY3NzLmhhc2g7XG5cdFx0XHRzdHlsZS50ZXh0Q29udGVudCA9IGNzcy5jb2RlO1xuXG5cdFx0XHR0YXJnZXQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXG5cdFx0XHRpZiAoREVWKSB7XG5cdFx0XHRcdHJlZ2lzdGVyX3N0eWxlKGNzcy5oYXNoLCBzdHlsZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgQWN0aW9uUGF5bG9hZCB9IGZyb20gJyNjbGllbnQnICovXG5pbXBvcnQgeyBlZmZlY3QsIHJlbmRlcl9lZmZlY3QgfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgc2FmZV9ub3RfZXF1YWwgfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2VxdWFsaXR5LmpzJztcbmltcG9ydCB7IGRlZXBfcmVhZF9zdGF0ZSwgdW50cmFjayB9IGZyb20gJy4uLy4uL3J1bnRpbWUuanMnO1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBQXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGRvbVxuICogQHBhcmFtIHsoZG9tOiBFbGVtZW50LCB2YWx1ZT86IFApID0+IEFjdGlvblBheWxvYWQ8UD59IGFjdGlvblxuICogQHBhcmFtIHsoKSA9PiBQfSBbZ2V0X3ZhbHVlXVxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhY3Rpb24oZG9tLCBhY3Rpb24sIGdldF92YWx1ZSkge1xuXHRlZmZlY3QoKCkgPT4ge1xuXHRcdHZhciBwYXlsb2FkID0gdW50cmFjaygoKSA9PiBhY3Rpb24oZG9tLCBnZXRfdmFsdWU/LigpKSB8fCB7fSk7XG5cblx0XHRpZiAoZ2V0X3ZhbHVlICYmIHBheWxvYWQ/LnVwZGF0ZSkge1xuXHRcdFx0dmFyIGluaXRlZCA9IGZhbHNlO1xuXHRcdFx0LyoqIEB0eXBlIHtQfSAqL1xuXHRcdFx0dmFyIHByZXYgPSAvKiogQHR5cGUge2FueX0gKi8gKHt9KTsgLy8gaW5pdGlhbGl6ZSB3aXRoIHNvbWV0aGluZyBzbyBpdCdzIG5ldmVyIGVxdWFsIG9uIGZpcnN0IHJ1blxuXG5cdFx0XHRyZW5kZXJfZWZmZWN0KCgpID0+IHtcblx0XHRcdFx0dmFyIHZhbHVlID0gZ2V0X3ZhbHVlKCk7XG5cblx0XHRcdFx0Ly8gQWN0aW9uJ3MgdXBkYXRlIG1ldGhvZCBpcyBjb2Fyc2UtZ3JhaW5lZCwgaS5lLiB3aGVuIGFueXRoaW5nIGluIHRoZSBwYXNzZWQgdmFsdWUgY2hhbmdlcywgdXBkYXRlLlxuXHRcdFx0XHQvLyBUaGlzIHdvcmtzIGluIGxlZ2FjeSBtb2RlIGJlY2F1c2Ugb2YgbXV0YWJsZV9zb3VyY2UgYmVpbmcgdXBkYXRlZCBhcyBhIHdob2xlLCBidXQgd2hlbiB1c2luZyAkc3RhdGVcblx0XHRcdFx0Ly8gdG9nZXRoZXIgd2l0aCBhY3Rpb25zIGFuZCBtdXRhdGlvbiwgaXQgd291bGRuJ3Qgbm90aWNlIHRoZSBjaGFuZ2Ugd2l0aG91dCBhIGRlZXAgcmVhZC5cblx0XHRcdFx0ZGVlcF9yZWFkX3N0YXRlKHZhbHVlKTtcblxuXHRcdFx0XHRpZiAoaW5pdGVkICYmIHNhZmVfbm90X2VxdWFsKHByZXYsIHZhbHVlKSkge1xuXHRcdFx0XHRcdHByZXYgPSB2YWx1ZTtcblx0XHRcdFx0XHQvKiogQHR5cGUge0Z1bmN0aW9ufSAqLyAocGF5bG9hZC51cGRhdGUpKHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGluaXRlZCA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHBheWxvYWQ/LmRlc3Ryb3kpIHtcblx0XHRcdHJldHVybiAoKSA9PiAvKiogQHR5cGUge0Z1bmN0aW9ufSAqLyAocGF5bG9hZC5kZXN0cm95KSgpO1xuXHRcdH1cblx0fSk7XG59XG4iLCIvKiogQGltcG9ydCB7IEVmZmVjdCB9IGZyb20gJyNjbGllbnQnICovXG5pbXBvcnQgeyBicmFuY2gsIGVmZmVjdCwgZGVzdHJveV9lZmZlY3QsIG1hbmFnZWQgfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuXG4vLyBUT0RPIGluIDYuMCBvciA3LjAsIHdoZW4gd2UgcmVtb3ZlIGxlZ2FjeSBtb2RlLCB3ZSBjYW4gc2ltcGxpZnkgdGhpcyBieVxuLy8gZ2V0dGluZyByaWQgb2YgdGhlIGJsb2NrL2JyYW5jaCBzdHVmZiBhbmQganVzdCBsZXR0aW5nIHRoZSBlZmZlY3QgcmlwLlxuLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9zdmVsdGUvcHVsbC8xNTk2MlxuXG4vKipcbiAqIEBwYXJhbSB7RWxlbWVudH0gbm9kZVxuICogQHBhcmFtIHsoKSA9PiAobm9kZTogRWxlbWVudCkgPT4gdm9pZH0gZ2V0X2ZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2gobm9kZSwgZ2V0X2ZuKSB7XG5cdC8qKiBAdHlwZSB7ZmFsc2UgfCB1bmRlZmluZWQgfCAoKG5vZGU6IEVsZW1lbnQpID0+IHZvaWQpfSAqL1xuXHR2YXIgZm4gPSB1bmRlZmluZWQ7XG5cblx0LyoqIEB0eXBlIHtFZmZlY3QgfCBudWxsfSAqL1xuXHR2YXIgZTtcblxuXHRtYW5hZ2VkKCgpID0+IHtcblx0XHRpZiAoZm4gIT09IChmbiA9IGdldF9mbigpKSkge1xuXHRcdFx0aWYgKGUpIHtcblx0XHRcdFx0ZGVzdHJveV9lZmZlY3QoZSk7XG5cdFx0XHRcdGUgPSBudWxsO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZm4pIHtcblx0XHRcdFx0ZSA9IGJyYW5jaCgoKSA9PiB7XG5cdFx0XHRcdFx0ZWZmZWN0KCgpID0+IC8qKiBAdHlwZSB7KG5vZGU6IEVsZW1lbnQpID0+IHZvaWR9ICovIChmbikobm9kZSkpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufVxuIiwiY29uc3QgQVRUUl9SRUdFWCA9IC9bJlwiPF0vZztcbmNvbnN0IENPTlRFTlRfUkVHRVggPSAvWyY8XS9nO1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge1Z9IHZhbHVlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc19hdHRyXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlX2h0bWwodmFsdWUsIGlzX2F0dHIpIHtcblx0Y29uc3Qgc3RyID0gU3RyaW5nKHZhbHVlID8/ICcnKTtcblxuXHRjb25zdCBwYXR0ZXJuID0gaXNfYXR0ciA/IEFUVFJfUkVHRVggOiBDT05URU5UX1JFR0VYO1xuXHRwYXR0ZXJuLmxhc3RJbmRleCA9IDA7XG5cblx0bGV0IGVzY2FwZWQgPSAnJztcblx0bGV0IGxhc3QgPSAwO1xuXG5cdHdoaWxlIChwYXR0ZXJuLnRlc3Qoc3RyKSkge1xuXHRcdGNvbnN0IGkgPSBwYXR0ZXJuLmxhc3RJbmRleCAtIDE7XG5cdFx0Y29uc3QgY2ggPSBzdHJbaV07XG5cdFx0ZXNjYXBlZCArPSBzdHIuc3Vic3RyaW5nKGxhc3QsIGkpICsgKGNoID09PSAnJicgPyAnJmFtcDsnIDogY2ggPT09ICdcIicgPyAnJnF1b3Q7JyA6ICcmbHQ7Jyk7XG5cdFx0bGFzdCA9IGkgKyAxO1xuXHR9XG5cblx0cmV0dXJuIGVzY2FwZWQgKyBzdHIuc3Vic3RyaW5nKGxhc3QpO1xufVxuIiwiaW1wb3J0IHsgZXNjYXBlX2h0bWwgfSBmcm9tICcuLi8uLi9lc2NhcGluZy5qcyc7XG5pbXBvcnQgeyBjbHN4IGFzIF9jbHN4IH0gZnJvbSAnY2xzeCc7XG5pbXBvcnQgeyBoYXNfb3duX3Byb3BlcnR5IH0gZnJvbSAnLi91dGlscy5qcyc7XG5cbi8qKlxuICogYDxkaXYgdHJhbnNsYXRlPXtmYWxzZX0+YCBzaG91bGQgYmUgcmVuZGVyZWQgYXMgYDxkaXYgdHJhbnNsYXRlPVwibm9cIj5gIGFuZCBfbm90X1xuICogYDxkaXYgdHJhbnNsYXRlPVwiZmFsc2VcIj5gLCB3aGljaCBpcyBlcXVpdmFsZW50IHRvIGA8ZGl2IHRyYW5zbGF0ZT1cInllc1wiPmAuIFRoZXJlXG4gKiBtYXkgYmUgb3RoZXIgb2RkIGNhc2VzIHRoYXQgbmVlZCB0byBiZSBhZGRlZCB0byB0aGlzIGxpc3QgaW4gZnV0dXJlXG4gKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgTWFwPGFueSwgc3RyaW5nPj59XG4gKi9cbmNvbnN0IHJlcGxhY2VtZW50cyA9IHtcblx0dHJhbnNsYXRlOiBuZXcgTWFwKFtcblx0XHRbdHJ1ZSwgJ3llcyddLFxuXHRcdFtmYWxzZSwgJ25vJ11cblx0XSlcbn07XG5cbi8qKlxuICogQHRlbXBsYXRlIFZcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge1Z9IHZhbHVlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc19ib29sZWFuXVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dHIobmFtZSwgdmFsdWUsIGlzX2Jvb2xlYW4gPSBmYWxzZSkge1xuXHQvLyBhdHRyaWJ1dGUgaGlkZGVuIGZvciB2YWx1ZXMgb3RoZXIgdGhhbiBcInVudGlsLWZvdW5kXCIgYmVoYXZlcyBsaWtlIGEgYm9vbGVhbiBhdHRyaWJ1dGVcblx0aWYgKG5hbWUgPT09ICdoaWRkZW4nICYmIHZhbHVlICE9PSAndW50aWwtZm91bmQnKSB7XG5cdFx0aXNfYm9vbGVhbiA9IHRydWU7XG5cdH1cblx0Ly8gYCcnYCBpcyBhIHByZXNlbnQgYm9vbGVhbiBhdHRyaWJ1dGUsIGFzIGl0IGlzIGluIG1hcmt1cCBhbmQgb24gdGhlIGNsaWVudFxuXHRpZiAodmFsdWUgPT0gbnVsbCB8fCAoaXNfYm9vbGVhbiAmJiAhdmFsdWUgJiYgdmFsdWUgIT09ICcnKSkgcmV0dXJuICcnO1xuXHRjb25zdCBub3JtYWxpemVkID1cblx0XHQoaGFzX293bl9wcm9wZXJ0eS5jYWxsKHJlcGxhY2VtZW50cywgbmFtZSkgJiYgcmVwbGFjZW1lbnRzW25hbWVdLmdldCh2YWx1ZSkpIHx8IHZhbHVlO1xuXHRjb25zdCBhc3NpZ25tZW50ID0gaXNfYm9vbGVhbiA/IGA9XCJcImAgOiBgPVwiJHtlc2NhcGVfaHRtbChub3JtYWxpemVkLCB0cnVlKX1cImA7XG5cdHJldHVybiBgICR7bmFtZX0ke2Fzc2lnbm1lbnR9YDtcbn1cblxuLyoqXG4gKiBTbWFsbCB3cmFwcGVyIGFyb3VuZCBjbHN4IHRvIHByZXNlcnZlIFN2ZWx0ZSdzICh3ZWlyZCkgaGFuZGxpbmcgb2YgZmFsc3kgdmFsdWVzLlxuICogVE9ETyBTdmVsdGUgNiByZXZpc2l0IHRoaXMsIGFuZCBsaWtlbHkgdHVybiBhbGwgZmFsc3kgdmFsdWVzIGludG8gdGhlIGVtcHR5IHN0cmluZyAod2hhdCBjbHN4IGFsc28gZG9lcylcbiAqIEBwYXJhbSAge2FueX0gdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsc3godmFsdWUpIHtcblx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcblx0XHRyZXR1cm4gX2Nsc3godmFsdWUpO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiB2YWx1ZSA/PyAnJztcblx0fVxufVxuXG5jb25zdCB3aGl0ZXNwYWNlID0gWy4uLicgXFx0XFxuXFxyXFxmXFx1MDBhMFxcdTAwMGJcXHVmZWZmJ107XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IHZhbHVlXG4gKiBAcGFyYW0ge3N0cmluZyB8IG51bGx9IFtoYXNoXVxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBib29sZWFuPn0gW2RpcmVjdGl2ZXNdXG4gKiBAcmV0dXJucyB7c3RyaW5nIHwgbnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvX2NsYXNzKHZhbHVlLCBoYXNoLCBkaXJlY3RpdmVzKSB7XG5cdHZhciBjbGFzc25hbWUgPSB2YWx1ZSA9PSBudWxsID8gJycgOiAnJyArIHZhbHVlO1xuXG5cdGlmIChoYXNoKSB7XG5cdFx0Y2xhc3NuYW1lID0gY2xhc3NuYW1lID8gY2xhc3NuYW1lICsgJyAnICsgaGFzaCA6IGhhc2g7XG5cdH1cblxuXHRpZiAoZGlyZWN0aXZlcykge1xuXHRcdGZvciAodmFyIGtleSBvZiBPYmplY3Qua2V5cyhkaXJlY3RpdmVzKSkge1xuXHRcdFx0aWYgKGRpcmVjdGl2ZXNba2V5XSkge1xuXHRcdFx0XHRjbGFzc25hbWUgPSBjbGFzc25hbWUgPyBjbGFzc25hbWUgKyAnICcgKyBrZXkgOiBrZXk7XG5cdFx0XHR9IGVsc2UgaWYgKGNsYXNzbmFtZS5sZW5ndGgpIHtcblx0XHRcdFx0dmFyIGxlbiA9IGtleS5sZW5ndGg7XG5cdFx0XHRcdHZhciBhID0gMDtcblxuXHRcdFx0XHR3aGlsZSAoKGEgPSBjbGFzc25hbWUuaW5kZXhPZihrZXksIGEpKSA+PSAwKSB7XG5cdFx0XHRcdFx0dmFyIGIgPSBhICsgbGVuO1xuXG5cdFx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdFx0KGEgPT09IDAgfHwgd2hpdGVzcGFjZS5pbmNsdWRlcyhjbGFzc25hbWVbYSAtIDFdKSkgJiZcblx0XHRcdFx0XHRcdChiID09PSBjbGFzc25hbWUubGVuZ3RoIHx8IHdoaXRlc3BhY2UuaW5jbHVkZXMoY2xhc3NuYW1lW2JdKSlcblx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdGNsYXNzbmFtZSA9IChhID09PSAwID8gJycgOiBjbGFzc25hbWUuc3Vic3RyaW5nKDAsIGEpKSArIGNsYXNzbmFtZS5zdWJzdHJpbmcoYiArIDEpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRhID0gYjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gY2xhc3NuYW1lID09PSAnJyA/IG51bGwgOiBjbGFzc25hbWU7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZyxhbnk+fSBzdHlsZXNcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaW1wb3J0YW50XG4gKi9cbmZ1bmN0aW9uIGFwcGVuZF9zdHlsZXMoc3R5bGVzLCBpbXBvcnRhbnQgPSBmYWxzZSkge1xuXHR2YXIgc2VwYXJhdG9yID0gaW1wb3J0YW50ID8gJyAhaW1wb3J0YW50OycgOiAnOyc7XG5cdHZhciBjc3MgPSAnJztcblxuXHRmb3IgKHZhciBrZXkgb2YgT2JqZWN0LmtleXMoc3R5bGVzKSkge1xuXHRcdHZhciB2YWx1ZSA9IHN0eWxlc1trZXldO1xuXHRcdGlmICh2YWx1ZSAhPSBudWxsICYmIHZhbHVlICE9PSAnJykge1xuXHRcdFx0Y3NzICs9ICcgJyArIGtleSArICc6ICcgKyB2YWx1ZSArIHNlcGFyYXRvcjtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gY3NzO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiB0b19jc3NfbmFtZShuYW1lKSB7XG5cdGlmIChuYW1lWzBdICE9PSAnLScgfHwgbmFtZVsxXSAhPT0gJy0nKSB7XG5cdFx0cmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKTtcblx0fVxuXHRyZXR1cm4gbmFtZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55PiB8IFtSZWNvcmQ8c3RyaW5nLCBhbnk+LCBSZWNvcmQ8c3RyaW5nLCBhbnk+XX0gW3N0eWxlc11cbiAqIEByZXR1cm5zIHtzdHJpbmcgfCBudWxsfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9fc3R5bGUodmFsdWUsIHN0eWxlcykge1xuXHRpZiAoc3R5bGVzKSB7XG5cdFx0dmFyIG5ld19zdHlsZSA9ICcnO1xuXG5cdFx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLGFueT4gfCB1bmRlZmluZWR9ICovXG5cdFx0dmFyIG5vcm1hbF9zdHlsZXM7XG5cblx0XHQvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsYW55PiB8IHVuZGVmaW5lZH0gKi9cblx0XHR2YXIgaW1wb3J0YW50X3N0eWxlcztcblxuXHRcdGlmIChBcnJheS5pc0FycmF5KHN0eWxlcykpIHtcblx0XHRcdG5vcm1hbF9zdHlsZXMgPSBzdHlsZXNbMF07XG5cdFx0XHRpbXBvcnRhbnRfc3R5bGVzID0gc3R5bGVzWzFdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRub3JtYWxfc3R5bGVzID0gc3R5bGVzO1xuXHRcdH1cblxuXHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0Ly8gc3RyaXAgY29tbWVudHM7IHN1cnJvdW5kaW5nIHdoaXRlc3BhY2UgaXMgaGFuZGxlZCBieSB0aGUgdHJpbXMgYmVsb3cgKHdoaWNoIGlzIG11Y2ggZmFzdGVyIHRoYW4gZG9pbmcgaXQgdGhyb3VnaCByZWdleClcblx0XHRcdHZhbHVlID0gU3RyaW5nKHZhbHVlKVxuXHRcdFx0XHQucmVwbGFjZUFsbCgvXFwvXFwqLio/XFwqXFwvL2csICcnKVxuXHRcdFx0XHQudHJpbSgpO1xuXG5cdFx0XHQvKiogQHR5cGUge2Jvb2xlYW4gfCAnXCInIHwgXCInXCJ9ICovXG5cdFx0XHR2YXIgaW5fc3RyID0gZmFsc2U7XG5cdFx0XHR2YXIgaW5fYXBvID0gMDtcblx0XHRcdHZhciBpbl9jb21tZW50ID0gZmFsc2U7XG5cblx0XHRcdHZhciByZXNlcnZlZF9uYW1lcyA9IFtdO1xuXG5cdFx0XHRpZiAobm9ybWFsX3N0eWxlcykge1xuXHRcdFx0XHRyZXNlcnZlZF9uYW1lcy5wdXNoKC4uLk9iamVjdC5rZXlzKG5vcm1hbF9zdHlsZXMpLm1hcCh0b19jc3NfbmFtZSkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGltcG9ydGFudF9zdHlsZXMpIHtcblx0XHRcdFx0cmVzZXJ2ZWRfbmFtZXMucHVzaCguLi5PYmplY3Qua2V5cyhpbXBvcnRhbnRfc3R5bGVzKS5tYXAodG9fY3NzX25hbWUpKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHN0YXJ0X2luZGV4ID0gMDtcblx0XHRcdHZhciBuYW1lX2luZGV4ID0gLTE7XG5cblx0XHRcdGNvbnN0IGxlbiA9IHZhbHVlLmxlbmd0aDtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0dmFyIGMgPSB2YWx1ZVtpXTtcblxuXHRcdFx0XHRpZiAoaW5fY29tbWVudCkge1xuXHRcdFx0XHRcdGlmIChjID09PSAnLycgJiYgdmFsdWVbaSAtIDFdID09PSAnKicpIHtcblx0XHRcdFx0XHRcdGluX2NvbW1lbnQgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSBpZiAoaW5fc3RyKSB7XG5cdFx0XHRcdFx0aWYgKGluX3N0ciA9PT0gYykge1xuXHRcdFx0XHRcdFx0aW5fc3RyID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYgKGMgPT09ICcvJyAmJiB2YWx1ZVtpICsgMV0gPT09ICcqJykge1xuXHRcdFx0XHRcdGluX2NvbW1lbnQgPSB0cnVlO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGMgPT09ICdcIicgfHwgYyA9PT0gXCInXCIpIHtcblx0XHRcdFx0XHRpbl9zdHIgPSBjO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGMgPT09ICcoJykge1xuXHRcdFx0XHRcdGluX2FwbysrO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGMgPT09ICcpJykge1xuXHRcdFx0XHRcdGluX2Fwby0tO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCFpbl9jb21tZW50ICYmIGluX3N0ciA9PT0gZmFsc2UgJiYgaW5fYXBvID09PSAwKSB7XG5cdFx0XHRcdFx0aWYgKGMgPT09ICc6JyAmJiBuYW1lX2luZGV4ID09PSAtMSkge1xuXHRcdFx0XHRcdFx0bmFtZV9pbmRleCA9IGk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChjID09PSAnOycgfHwgaSA9PT0gbGVuIC0gMSkge1xuXHRcdFx0XHRcdFx0aWYgKG5hbWVfaW5kZXggIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBuYW1lID0gdG9fY3NzX25hbWUodmFsdWUuc3Vic3RyaW5nKHN0YXJ0X2luZGV4LCBuYW1lX2luZGV4KS50cmltKCkpO1xuXG5cdFx0XHRcdFx0XHRcdGlmICghcmVzZXJ2ZWRfbmFtZXMuaW5jbHVkZXMobmFtZSkpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoYyAhPT0gJzsnKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpKys7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdmFsdWUuc3Vic3RyaW5nKHN0YXJ0X2luZGV4LCBpKS50cmltKCk7XG5cdFx0XHRcdFx0XHRcdFx0bmV3X3N0eWxlICs9ICcgJyArIHByb3BlcnR5ICsgJzsnO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHN0YXJ0X2luZGV4ID0gaSArIDE7XG5cdFx0XHRcdFx0XHRuYW1lX2luZGV4ID0gLTE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKG5vcm1hbF9zdHlsZXMpIHtcblx0XHRcdG5ld19zdHlsZSArPSBhcHBlbmRfc3R5bGVzKG5vcm1hbF9zdHlsZXMpO1xuXHRcdH1cblxuXHRcdGlmIChpbXBvcnRhbnRfc3R5bGVzKSB7XG5cdFx0XHRuZXdfc3R5bGUgKz0gYXBwZW5kX3N0eWxlcyhpbXBvcnRhbnRfc3R5bGVzLCB0cnVlKTtcblx0XHR9XG5cblx0XHRuZXdfc3R5bGUgPSBuZXdfc3R5bGUudHJpbSgpO1xuXHRcdHJldHVybiBuZXdfc3R5bGUgPT09ICcnID8gbnVsbCA6IG5ld19zdHlsZTtcblx0fVxuXG5cdHJldHVybiB2YWx1ZSA9PSBudWxsID8gbnVsbCA6IFN0cmluZyh2YWx1ZSk7XG59XG4iLCJpbXBvcnQgeyB0b19jbGFzcyB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC9hdHRyaWJ1dGVzLmpzJztcbmltcG9ydCB7IENMQVNTX0NBQ0hFIH0gZnJvbSAnLi4vLi4vY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IGh5ZHJhdGluZyB9IGZyb20gJy4uL2h5ZHJhdGlvbi5qcyc7XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBkb21cbiAqIEBwYXJhbSB7Ym9vbGVhbiB8IG51bWJlcn0gaXNfaHRtbFxuICogQHBhcmFtIHtzdHJpbmcgfCBudWxsfSB2YWx1ZVxuICogQHBhcmFtIHtzdHJpbmd9IFtoYXNoXVxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbcHJldl9jbGFzc2VzXVxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbbmV4dF9jbGFzc2VzXVxuICogQHJldHVybnMge1JlY29yZDxzdHJpbmcsIGJvb2xlYW4+IHwgdW5kZWZpbmVkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0X2NsYXNzKGRvbSwgaXNfaHRtbCwgdmFsdWUsIGhhc2gsIHByZXZfY2xhc3NlcywgbmV4dF9jbGFzc2VzKSB7XG5cdHZhciBwcmV2ID0gLyoqIEB0eXBlIHthbnl9ICovIChkb20pW0NMQVNTX0NBQ0hFXTtcblxuXHRpZiAoXG5cdFx0aHlkcmF0aW5nIHx8XG5cdFx0cHJldiAhPT0gdmFsdWUgfHxcblx0XHRwcmV2ID09PSB1bmRlZmluZWQgLy8gZm9yIGVkZ2UgY2FzZSBvZiBgY2xhc3M9e3VuZGVmaW5lZH1gXG5cdCkge1xuXHRcdHZhciBuZXh0X2NsYXNzX25hbWUgPSB0b19jbGFzcyh2YWx1ZSwgaGFzaCwgbmV4dF9jbGFzc2VzKTtcblxuXHRcdGlmICghaHlkcmF0aW5nIHx8IG5leHRfY2xhc3NfbmFtZSAhPT0gZG9tLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSkge1xuXHRcdFx0Ly8gUmVtb3ZpbmcgdGhlIGF0dHJpYnV0ZSB3aGVuIHRoZSB2YWx1ZSBpcyBvbmx5IGFuIGVtcHR5IHN0cmluZyBjYXVzZXNcblx0XHRcdC8vIHBlcmZvcm1hbmNlIGlzc3VlcyB2cyBzaW1wbHkgbWFraW5nIHRoZSBjbGFzc05hbWUgYW4gZW1wdHkgc3RyaW5nLiBTb1xuXHRcdFx0Ly8gd2Ugc2hvdWxkIG9ubHkgcmVtb3ZlIHRoZSBjbGFzcyBpZiB0aGUgdmFsdWUgaXMgbnVsbGlzaFxuXHRcdFx0Ly8gYW5kIHRoZXJlIG5vIGhhc2gvZGlyZWN0aXZlcyA6XG5cdFx0XHRpZiAobmV4dF9jbGFzc19uYW1lID09IG51bGwpIHtcblx0XHRcdFx0ZG9tLnJlbW92ZUF0dHJpYnV0ZSgnY2xhc3MnKTtcblx0XHRcdH0gZWxzZSBpZiAoaXNfaHRtbCkge1xuXHRcdFx0XHRkb20uY2xhc3NOYW1lID0gbmV4dF9jbGFzc19uYW1lO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZG9tLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBuZXh0X2NsYXNzX25hbWUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8qKiBAdHlwZSB7YW55fSAqLyAoZG9tKVtDTEFTU19DQUNIRV0gPSB2YWx1ZTtcblx0fSBlbHNlIGlmIChuZXh0X2NsYXNzZXMgJiYgcHJldl9jbGFzc2VzICE9PSBuZXh0X2NsYXNzZXMpIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gbmV4dF9jbGFzc2VzKSB7XG5cdFx0XHR2YXIgaXNfcHJlc2VudCA9ICEhbmV4dF9jbGFzc2VzW2tleV07XG5cblx0XHRcdGlmIChwcmV2X2NsYXNzZXMgPT0gbnVsbCB8fCBpc19wcmVzZW50ICE9PSAhIXByZXZfY2xhc3Nlc1trZXldKSB7XG5cdFx0XHRcdGRvbS5jbGFzc0xpc3QudG9nZ2xlKGtleSwgaXNfcHJlc2VudCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIG5leHRfY2xhc3Nlcztcbn1cbiIsImltcG9ydCB7IHRvX3N0eWxlIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL2F0dHJpYnV0ZXMuanMnO1xuaW1wb3J0IHsgU1RZTEVfQ0FDSEUgfSBmcm9tICcuLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgaHlkcmF0aW5nIH0gZnJvbSAnLi4vaHlkcmF0aW9uLmpzJztcblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnQgJiBFbGVtZW50Q1NTSW5saW5lU3R5bGV9IGRvbVxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBwcmV2XG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IG5leHRcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcHJpb3JpdHldXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZV9zdHlsZXMoZG9tLCBwcmV2ID0ge30sIG5leHQsIHByaW9yaXR5KSB7XG5cdGZvciAodmFyIGtleSBpbiBuZXh0KSB7XG5cdFx0dmFyIHZhbHVlID0gbmV4dFtrZXldO1xuXG5cdFx0aWYgKHByZXZba2V5XSAhPT0gdmFsdWUpIHtcblx0XHRcdGlmIChuZXh0W2tleV0gPT0gbnVsbCkge1xuXHRcdFx0XHRkb20uc3R5bGUucmVtb3ZlUHJvcGVydHkoa2V5KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRvbS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlLCBwcmlvcml0eSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50ICYgRWxlbWVudENTU0lubGluZVN0eWxlfSBkb21cbiAqIEBwYXJhbSB7c3RyaW5nIHwgbnVsbH0gdmFsdWVcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55PiB8IFtSZWNvcmQ8c3RyaW5nLCBhbnk+LCBSZWNvcmQ8c3RyaW5nLCBhbnk+XX0gW3ByZXZfc3R5bGVzXVxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgW1JlY29yZDxzdHJpbmcsIGFueT4sIFJlY29yZDxzdHJpbmcsIGFueT5dfSBbbmV4dF9zdHlsZXNdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRfc3R5bGUoZG9tLCB2YWx1ZSwgcHJldl9zdHlsZXMsIG5leHRfc3R5bGVzKSB7XG5cdHZhciBwcmV2ID0gLyoqIEB0eXBlIHthbnl9ICovIChkb20pW1NUWUxFX0NBQ0hFXTtcblxuXHRpZiAoaHlkcmF0aW5nIHx8IHByZXYgIT09IHZhbHVlKSB7XG5cdFx0dmFyIG5leHRfc3R5bGVfYXR0ciA9IHRvX3N0eWxlKHZhbHVlLCBuZXh0X3N0eWxlcyk7XG5cblx0XHRpZiAoIWh5ZHJhdGluZyB8fCBuZXh0X3N0eWxlX2F0dHIgIT09IGRvbS5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykpIHtcblx0XHRcdGlmIChuZXh0X3N0eWxlX2F0dHIgPT0gbnVsbCkge1xuXHRcdFx0XHRkb20ucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZG9tLnN0eWxlLmNzc1RleHQgPSBuZXh0X3N0eWxlX2F0dHI7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0LyoqIEB0eXBlIHthbnl9ICovIChkb20pW1NUWUxFX0NBQ0hFXSA9IHZhbHVlO1xuXHR9IGVsc2UgaWYgKG5leHRfc3R5bGVzKSB7XG5cdFx0aWYgKEFycmF5LmlzQXJyYXkobmV4dF9zdHlsZXMpKSB7XG5cdFx0XHR1cGRhdGVfc3R5bGVzKGRvbSwgcHJldl9zdHlsZXM/LlswXSwgbmV4dF9zdHlsZXNbMF0pO1xuXHRcdFx0dXBkYXRlX3N0eWxlcyhkb20sIHByZXZfc3R5bGVzPy5bMV0sIG5leHRfc3R5bGVzWzFdLCAnaW1wb3J0YW50Jyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHVwZGF0ZV9zdHlsZXMoZG9tLCBwcmV2X3N0eWxlcywgbmV4dF9zdHlsZXMpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBuZXh0X3N0eWxlcztcbn1cbiIsImltcG9ydCB7IGVmZmVjdCwgdGVhcmRvd24gfSBmcm9tICcuLi8uLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgbGlzdGVuX3RvX2V2ZW50X2FuZF9yZXNldF9ldmVudCB9IGZyb20gJy4vc2hhcmVkLmpzJztcbmltcG9ydCB7IGlzIH0gZnJvbSAnLi4vLi4vLi4vcHJveHkuanMnO1xuaW1wb3J0IHsgaXNfYXJyYXkgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0ICogYXMgdyBmcm9tICcuLi8uLi8uLi93YXJuaW5ncy5qcyc7XG5pbXBvcnQgeyBCYXRjaCwgY3VycmVudF9iYXRjaCwgcHJldmlvdXNfYmF0Y2ggfSBmcm9tICcuLi8uLi8uLi9yZWFjdGl2aXR5L2JhdGNoLmpzJztcbmltcG9ydCB7IGFzeW5jX21vZGVfZmxhZyB9IGZyb20gJy4uLy4uLy4uLy4uL2ZsYWdzL2luZGV4LmpzJztcblxuLyoqXG4gKiBTZXRzIHRoZSBgc2VsZWN0ZWRgIGF0dHJpYnV0ZSBvbiBhbiBvcHRpb24gc28gZm9ybSByZXNldCBjYW4gcmVzdG9yZSBpdC5cbiAqIEBwYXJhbSB7SFRNTE9wdGlvbkVsZW1lbnR9IG9wdGlvblxuICogQHBhcmFtIHtib29sZWFufSBzZWxlY3RlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0X3NlbGVjdGVkKG9wdGlvbiwgc2VsZWN0ZWQpIHtcblx0aWYgKHNlbGVjdGVkKSB7XG5cdFx0aWYgKCFvcHRpb24uaGFzQXR0cmlidXRlKCdzZWxlY3RlZCcpKSBvcHRpb24uc2V0QXR0cmlidXRlKCdzZWxlY3RlZCcsICcnKTtcblx0fSBlbHNlIHtcblx0XHRvcHRpb24ucmVtb3ZlQXR0cmlidXRlKCdzZWxlY3RlZCcpO1xuXHR9XG59XG5cbi8qKlxuICogU2V0cyB0aGUgb3B0aW9ucyBhIGZvcm0gcmVzZXQgc2hvdWxkIHJlc3RvcmUuIFRoZSBmaXJzdCBjYWxsIHNlbGVjdHNcbiAqIHRoZW0gaWYgbm90aGluZyBoYXMgc2V0IGEgdmFsdWUsIGxhdGVyIGNhbGxzIGxlYXZlIHRoZSBjdXJyZW50IHNlbGVjdGlvbiBhbG9uZS5cbiAqIEBwYXJhbSB7SFRNTFNlbGVjdEVsZW1lbnR9IHNlbGVjdFxuICogQHBhcmFtIHthbnl9IHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRfZGVmYXVsdF9zZWxlY3RfdmFsdWUoc2VsZWN0LCB2YWx1ZSkge1xuXHR2YXIgbW91bnRpbmcgPSAhKCdfX2RlZmF1bHRWYWx1ZScgaW4gc2VsZWN0KTtcblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRpZiAoIW1vdW50aW5nICYmIHNlbGVjdC5fX2RlZmF1bHRWYWx1ZSA9PT0gdmFsdWUpIHJldHVybjtcblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRzZWxlY3QuX19kZWZhdWx0VmFsdWUgPSB2YWx1ZTtcblx0YXBwbHlfZGVmYXVsdF9zZWxlY3RfdmFsdWUoc2VsZWN0LCAhbW91bnRpbmcgfHwgJ19fdmFsdWUnIGluIHNlbGVjdCk7XG59XG5cbi8qKlxuICogTWFya3MgdGhlIG9wdGlvbnMgbWF0Y2hpbmcgYF9fZGVmYXVsdFZhbHVlYCBhcyBzZWxlY3RlZC4gV2l0aG91dCBgcHJlc2VydmVgXG4gKiBhIG5ld2x5IG1hdGNoaW5nIG9wdGlvbiBnZXRzIHNlbGVjdGVkLCBhcyBhbiBpbnNlcnRlZCBgPG9wdGlvbiBzZWxlY3RlZD5gIHdvdWxkLlxuICogQHBhcmFtIHtIVE1MU2VsZWN0RWxlbWVudH0gc2VsZWN0XG4gKiBAcGFyYW0ge2Jvb2xlYW59IHByZXNlcnZlXG4gKi9cbmZ1bmN0aW9uIGFwcGx5X2RlZmF1bHRfc2VsZWN0X3ZhbHVlKHNlbGVjdCwgcHJlc2VydmUpIHtcblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHR2YXIgdmFsdWUgPSBzZWxlY3QuX19kZWZhdWx0VmFsdWU7XG5cdHZhciBtdWx0aXBsZSA9IHNlbGVjdC5tdWx0aXBsZTtcblx0dmFyIHZhbHVlcyA9IG11bHRpcGxlID8gdmFsdWUgPz8gW10gOiBudWxsO1xuXG5cdGlmIChtdWx0aXBsZSAmJiAhaXNfYXJyYXkodmFsdWVzKSkgcmV0dXJuO1xuXG5cdHZhciBpbmRleCA9IHNlbGVjdC5zZWxlY3RlZEluZGV4O1xuXHR2YXIgc2VsZWN0ZWQgPSBwcmVzZXJ2ZSAmJiBtdWx0aXBsZSA/IG5ldyBTZXQoc2VsZWN0LnNlbGVjdGVkT3B0aW9ucykgOiBudWxsO1xuXG5cdGZvciAodmFyIG9wdGlvbiBvZiBzZWxlY3Qub3B0aW9ucykge1xuXHRcdHZhciBvcHRpb25fdmFsdWUgPSBnZXRfb3B0aW9uX3ZhbHVlKG9wdGlvbik7XG5cdFx0c2V0X3NlbGVjdGVkKFxuXHRcdFx0b3B0aW9uLFxuXHRcdFx0bXVsdGlwbGUgPyAvKiogQHR5cGUge2FueVtdfSAqLyAodmFsdWVzKS5pbmNsdWRlcyhvcHRpb25fdmFsdWUpIDogaXMob3B0aW9uX3ZhbHVlLCB2YWx1ZSlcblx0XHQpO1xuXHR9XG5cblx0aWYgKCFwcmVzZXJ2ZSkgcmV0dXJuO1xuXG5cdGlmIChzZWxlY3RlZCAhPT0gbnVsbCkge1xuXHRcdGZvciAob3B0aW9uIG9mIHNlbGVjdC5vcHRpb25zKSB7XG5cdFx0XHR2YXIgd2FzX3NlbGVjdGVkID0gc2VsZWN0ZWQuaGFzKG9wdGlvbik7XG5cdFx0XHRpZiAob3B0aW9uLnNlbGVjdGVkICE9PSB3YXNfc2VsZWN0ZWQpIG9wdGlvbi5zZWxlY3RlZCA9IHdhc19zZWxlY3RlZDtcblx0XHR9XG5cdH0gZWxzZSBpZiAoc2VsZWN0LnNlbGVjdGVkSW5kZXggIT09IGluZGV4KSB7XG5cdFx0c2VsZWN0LnNlbGVjdGVkSW5kZXggPSBpbmRleDtcblx0fVxufVxuXG4vKipcbiAqIFNlbGVjdHMgdGhlIGNvcnJlY3Qgb3B0aW9uKHMpIChkZXBlbmRpbmcgb24gd2hldGhlciB0aGlzIGlzIGEgbXVsdGlwbGUgc2VsZWN0KVxuICogQHRlbXBsYXRlIFZcbiAqIEBwYXJhbSB7SFRNTFNlbGVjdEVsZW1lbnR9IHNlbGVjdFxuICogQHBhcmFtIHtWfSB2YWx1ZVxuICogQHBhcmFtIHtib29sZWFufSBtb3VudGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0X29wdGlvbihzZWxlY3QsIHZhbHVlLCBtb3VudGluZyA9IGZhbHNlKSB7XG5cdGlmIChzZWxlY3QubXVsdGlwbGUpIHtcblx0XHQvLyBJZiB2YWx1ZSBpcyBudWxsIG9yIHVuZGVmaW5lZCwga2VlcCB0aGUgc2VsZWN0aW9uIGFzIGlzXG5cdFx0aWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIElmIG5vdCBhbiBhcnJheSwgd2FybiBhbmQga2VlcCB0aGUgc2VsZWN0aW9uIGFzIGlzXG5cdFx0aWYgKCFpc19hcnJheSh2YWx1ZSkpIHtcblx0XHRcdHJldHVybiB3LnNlbGVjdF9tdWx0aXBsZV9pbnZhbGlkX3ZhbHVlKCk7XG5cdFx0fVxuXG5cdFx0Ly8gT3RoZXJ3aXNlLCB1cGRhdGUgdGhlIHNlbGVjdGlvblxuXHRcdGZvciAodmFyIG9wdGlvbiBvZiBzZWxlY3Qub3B0aW9ucykge1xuXHRcdFx0b3B0aW9uLnNlbGVjdGVkID0gdmFsdWUuaW5jbHVkZXMoZ2V0X29wdGlvbl92YWx1ZShvcHRpb24pKTtcblx0XHR9XG5cblx0XHRyZXR1cm47XG5cdH1cblxuXHRmb3IgKG9wdGlvbiBvZiBzZWxlY3Qub3B0aW9ucykge1xuXHRcdHZhciBvcHRpb25fdmFsdWUgPSBnZXRfb3B0aW9uX3ZhbHVlKG9wdGlvbik7XG5cdFx0aWYgKGlzKG9wdGlvbl92YWx1ZSwgdmFsdWUpKSB7XG5cdFx0XHRvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxuXG5cdGlmICghbW91bnRpbmcgfHwgdmFsdWUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHNlbGVjdC5zZWxlY3RlZEluZGV4ID0gLTE7IC8vIG5vIG9wdGlvbiBzaG91bGQgYmUgc2VsZWN0ZWRcblx0fVxufVxuXG4vKipcbiAqIFNldHMgdXAgYSBtdXRhdGlvbiBvYnNlcnZlciB0byBzeW5jIHRoZSBjdXJyZW50IHNlbGVjdGlvblxuICogYW5kIGRlZmF1bHQgdG8gdGhlIGRvbSB3aGVuIHRoZSBvcHRpb25zIGNoYW5nZSwgZm9yIGV4YW1wbGVcbiAqIHdoZW4gdGhleSBhcmUgaW5zaWRlIGFuIGAjZWFjaGAgYmxvY2suIENhbGxlZCBvbmNlIHBlciBgPHNlbGVjdD5gLFxuICogYnkgdGhlIGNvbXBpbGVkIG91dHB1dCBvciBieSBgYXR0cmlidXRlX2VmZmVjdGAgZm9yIHNwcmVhZHMuXG4gKiBAcGFyYW0ge0hUTUxTZWxlY3RFbGVtZW50fSBzZWxlY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRfc2VsZWN0KHNlbGVjdCkge1xuXHR2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoZW50cmllcykgPT4ge1xuXHRcdC8vIE11dGF0aW9ucyByZWxhdGVkIHRvIGA8c2VsZWN0ZWRjb250ZW50PmAgY2FuIG5ldmVyIGFmZmVjdCB0aGUgb3B0aW9uIGxpc3QuXG5cdFx0Ly8gUmVhY3RpbmcgdG8gdGhlbSBjb3VsZCByZXZlcnQgYSB1c2VyLWluaXRpYXRlZCBzZWxlY3Rpb24gY2hhbmdlLCBiZWNhdXNlIHRoZVxuXHRcdC8vIHJlY29yZHMgYXJlIGRlbGl2ZXJlZCBhcyBzb29uIGFzIGFueSBsaXN0ZW5lciByZXR1cm5zIChlLmcuIGEgZGVsZWdhdGVkIGBpbnB1dGBcblx0XHQvLyBoYW5kbGVyKSwgd2hpY2ggY2FuIGhhcHBlbiBiZWZvcmUgdGhlIGBjaGFuZ2VgIGhhbmRsZXIgaGFzIHVwZGF0ZWQgYF9fdmFsdWVgXG5cdFx0aWYgKGVudHJpZXMuZXZlcnkoaXNfc2VsZWN0ZWRjb250ZW50X211dGF0aW9uKSkgcmV0dXJuO1xuXG5cdFx0aWYgKCdfX2RlZmF1bHRWYWx1ZScgaW4gc2VsZWN0KSB7XG5cdFx0XHRhcHBseV9kZWZhdWx0X3NlbGVjdF92YWx1ZShzZWxlY3QsIGZhbHNlKTtcblx0XHR9XG5cblx0XHRpZiAoJ19fdmFsdWUnIGluIHNlbGVjdCkge1xuXHRcdFx0c2VsZWN0X29wdGlvbihzZWxlY3QsIHNlbGVjdC5fX3ZhbHVlKTtcblx0XHR9XG5cdFx0Ly8gRGVsaWJlcmF0ZWx5IGRvbid0IHVwZGF0ZSB0aGUgcG90ZW50aWFsIGJpbmRpbmcgdmFsdWUsXG5cdFx0Ly8gdGhlIG1vZGVsIHNob3VsZCBiZSBwcmVzZXJ2ZWQgdW5sZXNzIGV4cGxpY2l0bHkgY2hhbmdlZFxuXHR9KTtcblxuXHRvYnNlcnZlci5vYnNlcnZlKHNlbGVjdCwge1xuXHRcdC8vIExpc3RlbiB0byBvcHRpb24gZWxlbWVudCBjaGFuZ2VzXG5cdFx0Y2hpbGRMaXN0OiB0cnVlLFxuXHRcdHN1YnRyZWU6IHRydWUsIC8vIGJlY2F1c2Ugb2YgPG9wdGdyb3VwPlxuXHRcdC8vIExpc3RlbiB0byBvcHRpb24gZWxlbWVudCB2YWx1ZSBhdHRyaWJ1dGUgY2hhbmdlc1xuXHRcdC8vIChkb2Vzbid0IGdldCBub3RpZmllZCBvZiBzZWxlY3QgdmFsdWUgY2hhbmdlcyxcblx0XHQvLyBiZWNhdXNlIHRoYXQgcHJvcGVydHkgaXMgbm90IHJlZmxlY3RlZCBhcyBhbiBhdHRyaWJ1dGUpXG5cdFx0YXR0cmlidXRlczogdHJ1ZSxcblx0XHRhdHRyaWJ1dGVGaWx0ZXI6IFsndmFsdWUnXVxuXHR9KTtcblxuXHR0ZWFyZG93bigoKSA9PiB7XG5cdFx0b2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxTZWxlY3RFbGVtZW50fSBzZWxlY3RcbiAqIEBwYXJhbSB7KCkgPT4gdW5rbm93bn0gZ2V0XG4gKiBAcGFyYW0geyh2YWx1ZTogdW5rbm93bikgPT4gdm9pZH0gc2V0XG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRfc2VsZWN0X3ZhbHVlKHNlbGVjdCwgZ2V0LCBzZXQgPSBnZXQpIHtcblx0dmFyIGJhdGNoZXMgPSBuZXcgV2Vha1NldCgpO1xuXHR2YXIgbW91bnRpbmcgPSB0cnVlO1xuXG5cdGxpc3Rlbl90b19ldmVudF9hbmRfcmVzZXRfZXZlbnQoc2VsZWN0LCAnY2hhbmdlJywgKGlzX3Jlc2V0KSA9PiB7XG5cdFx0dmFyIHF1ZXJ5ID0gaXNfcmVzZXQgPyAnW3NlbGVjdGVkXScgOiAnOmNoZWNrZWQnO1xuXHRcdC8qKiBAdHlwZSB7dW5rbm93bn0gKi9cblx0XHR2YXIgdmFsdWU7XG5cblx0XHRpZiAoc2VsZWN0Lm11bHRpcGxlKSB7XG5cdFx0XHR2YWx1ZSA9IFtdLm1hcC5jYWxsKHNlbGVjdC5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSwgZ2V0X29wdGlvbl92YWx1ZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8qKiBAdHlwZSB7SFRNTE9wdGlvbkVsZW1lbnQgfCBudWxsfSAqL1xuXHRcdFx0dmFyIHNlbGVjdGVkX29wdGlvbiA9XG5cdFx0XHRcdHNlbGVjdC5xdWVyeVNlbGVjdG9yKHF1ZXJ5KSA/P1xuXHRcdFx0XHQvLyB3aWxsIGZhbGwgYmFjayB0byBmaXJzdCBub24tZGlzYWJsZWQgb3B0aW9uIGlmIG5vIG9wdGlvbiBpcyBzZWxlY3RlZFxuXHRcdFx0XHRzZWxlY3QucXVlcnlTZWxlY3Rvcignb3B0aW9uOm5vdChbZGlzYWJsZWRdKScpO1xuXHRcdFx0dmFsdWUgPSBzZWxlY3RlZF9vcHRpb24gJiYgZ2V0X29wdGlvbl92YWx1ZShzZWxlY3RlZF9vcHRpb24pO1xuXHRcdH1cblxuXHRcdHNldCh2YWx1ZSk7XG5cblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0c2VsZWN0Ll9fdmFsdWUgPSB2YWx1ZTtcblxuXHRcdGlmIChjdXJyZW50X2JhdGNoICE9PSBudWxsKSB7XG5cdFx0XHRiYXRjaGVzLmFkZChjdXJyZW50X2JhdGNoKTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIE5lZWRzIHRvIGJlIGFuIGVmZmVjdCwgbm90IGEgcmVuZGVyX2VmZmVjdCwgc28gdGhhdCBpbiBjYXNlIG9mIGVhY2ggbG9vcHMgdGhlIGxvZ2ljIHJ1bnMgYWZ0ZXIgdGhlIGVhY2ggYmxvY2sgaGFzIHVwZGF0ZWRcblx0ZWZmZWN0KCgpID0+IHtcblx0XHR2YXIgdmFsdWUgPSBnZXQoKTtcblxuXHRcdGlmIChzZWxlY3QgPT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHtcblx0XHRcdC8vIEluIHN5bmMgbW9kZSByZW5kZXIgZWZmZWN0cyBhcmUgZXhlY3V0ZWQgZHVyaW5nIHRyZWUgdHJhdmVyc2FsIC0+IG5lZWRzIGN1cnJlbnRfYmF0Y2hcblx0XHRcdC8vIEluIGFzeW5jIG1vZGUgcmVuZGVyIGVmZmVjdHMgYXJlIGZsdXNoZWQgb25jZSBiYXRjaCByZXNvbHZlZCwgYXQgd2hpY2ggcG9pbnQgY3VycmVudF9iYXRjaCBpcyBudWxsIC0+IG5lZWRzIHByZXZpb3VzX2JhdGNoXG5cdFx0XHR2YXIgYmF0Y2ggPSAvKiogQHR5cGUge0JhdGNofSAqLyAoYXN5bmNfbW9kZV9mbGFnID8gcHJldmlvdXNfYmF0Y2ggOiBjdXJyZW50X2JhdGNoKTtcblxuXHRcdFx0Ly8gRG9uJ3QgdXBkYXRlIHRoZSA8c2VsZWN0PiBpZiBpdCBpcyBmb2N1c2VkLiBXZSBjYW4gZ2V0IGhlcmUgaWYsIGZvciBleGFtcGxlLFxuXHRcdFx0Ly8gYW4gdXBkYXRlIGlzIGRlZmVycmVkIGJlY2F1c2Ugb2YgYXN5bmMgd29yayBkZXBlbmRpbmcgb24gdGhlIHNlbGVjdDpcblx0XHRcdC8vXG5cdFx0XHQvLyA8c2VsZWN0IGJpbmQ6dmFsdWU9e3NlbGVjdGVkfT4uLi48L3NlbGVjdD5cblx0XHRcdC8vIDxwPnthd2FpdCBmaW5kKHNlbGVjdGVkKX08L3A+XG5cdFx0XHRpZiAoYmF0Y2hlcy5oYXMoYmF0Y2gpKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRzZWxlY3Rfb3B0aW9uKHNlbGVjdCwgdmFsdWUsIG1vdW50aW5nKTtcblxuXHRcdC8vIE1vdW50aW5nIGFuZCB2YWx1ZSB1bmRlZmluZWQgLT4gdGFrZSBzZWxlY3Rpb24gZnJvbSBkb21cblx0XHRpZiAobW91bnRpbmcgJiYgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0LyoqIEB0eXBlIHtIVE1MT3B0aW9uRWxlbWVudCB8IG51bGx9ICovXG5cdFx0XHR2YXIgc2VsZWN0ZWRfb3B0aW9uID0gc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJzpjaGVja2VkJyk7XG5cdFx0XHRpZiAoc2VsZWN0ZWRfb3B0aW9uICE9PSBudWxsKSB7XG5cdFx0XHRcdHZhbHVlID0gZ2V0X29wdGlvbl92YWx1ZShzZWxlY3RlZF9vcHRpb24pO1xuXHRcdFx0XHRzZXQodmFsdWUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRzZWxlY3QuX192YWx1ZSA9IHZhbHVlO1xuXHRcdG1vdW50aW5nID0gZmFsc2U7XG5cdH0pO1xufVxuXG4vKiogQHBhcmFtIHtIVE1MT3B0aW9uRWxlbWVudH0gb3B0aW9uICovXG5mdW5jdGlvbiBnZXRfb3B0aW9uX3ZhbHVlKG9wdGlvbikge1xuXHQvLyBfX3ZhbHVlIG9ubHkgZXhpc3RzIGlmIHRoZSA8b3B0aW9uPiBoYXMgYSB2YWx1ZSBhdHRyaWJ1dGVcblx0aWYgKCdfX3ZhbHVlJyBpbiBvcHRpb24pIHtcblx0XHRyZXR1cm4gb3B0aW9uLl9fdmFsdWU7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIG9wdGlvbi52YWx1ZTtcblx0fVxufVxuXG4vKipcbiAqIFJldHVybnMgYHRydWVgIGlmIHRoZSBtdXRhdGlvbiBzdGVtcyBmcm9tIHRoZSBicm93c2VyIG1pcnJvcmluZyB0aGUgc2VsZWN0ZWRcbiAqIG9wdGlvbidzIGNvbnRlbnQgaW50byBgPHNlbGVjdGVkY29udGVudD5gLCBvciBmcm9tIHVzIHJlcGxhY2luZyB0aGVcbiAqIGA8c2VsZWN0ZWRjb250ZW50PmAgZWxlbWVudCB3aXRoIGEgY2xvbmUgb2YgaXRzZWxmXG4gKiBAcGFyYW0ge011dGF0aW9uUmVjb3JkfSBlbnRyeVxuICovXG5mdW5jdGlvbiBpc19zZWxlY3RlZGNvbnRlbnRfbXV0YXRpb24oZW50cnkpIHtcblx0aWYgKC8qKiBAdHlwZSB7RWxlbWVudH0gKi8gKGVudHJ5LnRhcmdldCkuY2xvc2VzdCgnc2VsZWN0ZWRjb250ZW50JykgIT09IG51bGwpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdGlmIChlbnRyeS50eXBlID09PSAnY2hpbGRMaXN0Jykge1xuXHRcdHZhciBub2RlcyA9IFsuLi5lbnRyeS5hZGRlZE5vZGVzLCAuLi5lbnRyeS5yZW1vdmVkTm9kZXNdO1xuXHRcdHJldHVybiBub2Rlcy5sZW5ndGggPiAwICYmIG5vZGVzLmV2ZXJ5KChub2RlKSA9PiBub2RlLm5vZGVOYW1lID09PSAnU0VMRUNURURDT05URU5UJyk7XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG59XG4iLCIvKiogQGltcG9ydCB7IEJsb2NrZXIsIEVmZmVjdCB9IGZyb20gJyNjbGllbnQnICovXG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7IGh5ZHJhdGluZywgc2V0X2h5ZHJhdGluZyB9IGZyb20gJy4uL2h5ZHJhdGlvbi5qcyc7XG5pbXBvcnQgeyBnZXRfZGVzY3JpcHRvcnMsIGdldF9wcm90b3R5cGVfb2YgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0IHsgY3JlYXRlX2V2ZW50LCBkZWxlZ2F0ZSwgZGVsZWdhdGVkLCBldmVudCwgZXZlbnRfc3ltYm9sIH0gZnJvbSAnLi9ldmVudHMuanMnO1xuaW1wb3J0IHsgYWRkX2Zvcm1fcmVzZXRfbGlzdGVuZXIsIGF1dG9mb2N1cyB9IGZyb20gJy4vbWlzYy5qcyc7XG5pbXBvcnQgKiBhcyB3IGZyb20gJy4uLy4uL3dhcm5pbmdzLmpzJztcbmltcG9ydCB7XG5cdEFUVFJJQlVURVNfQ0FDSEUsXG5cdEZPUk1fUkVTRVRfSEFORExFUixcblx0SVNfWEhUTUwsXG5cdExPQURJTkdfQVRUUl9TWU1CT0xcbn0gZnJvbSAnI2NsaWVudC9jb25zdGFudHMnO1xuaW1wb3J0IHsgcXVldWVfbWljcm9fdGFzayB9IGZyb20gJy4uL3Rhc2suanMnO1xuaW1wb3J0IHsgaXNfY2FwdHVyZV9ldmVudCwgY2FuX2RlbGVnYXRlX2V2ZW50LCBub3JtYWxpemVfYXR0cmlidXRlIH0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMuanMnO1xuaW1wb3J0IHtcblx0YWN0aXZlX2VmZmVjdCxcblx0YWN0aXZlX3JlYWN0aW9uLFxuXHRnZXQsXG5cdHNldF9hY3RpdmVfZWZmZWN0LFxuXHRzZXRfYWN0aXZlX3JlYWN0aW9uXG59IGZyb20gJy4uLy4uL3J1bnRpbWUuanMnO1xuaW1wb3J0IHsgYXR0YWNoIH0gZnJvbSAnLi9hdHRhY2htZW50cy5qcyc7XG5pbXBvcnQgeyBjbHN4IH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL2F0dHJpYnV0ZXMuanMnO1xuaW1wb3J0IHsgc2V0X2NsYXNzIH0gZnJvbSAnLi9jbGFzcy5qcyc7XG5pbXBvcnQgeyBzZXRfc3R5bGUgfSBmcm9tICcuL3N0eWxlLmpzJztcbmltcG9ydCB7IEFUVEFDSE1FTlRfS0VZLCBOQU1FU1BBQ0VfSFRNTCwgVU5JTklUSUFMSVpFRCB9IGZyb20gJy4uLy4uLy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBicmFuY2gsIGRlc3Ryb3lfZWZmZWN0LCBlZmZlY3QsIG1hbmFnZWQgfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHtcblx0aW5pdF9zZWxlY3QsXG5cdHNlbGVjdF9vcHRpb24sXG5cdHNldF9kZWZhdWx0X3NlbGVjdF92YWx1ZSxcblx0c2V0X3NlbGVjdGVkXG59IGZyb20gJy4vYmluZGluZ3Mvc2VsZWN0LmpzJztcbmltcG9ydCB7IGZsYXR0ZW4gfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2FzeW5jLmpzJztcblxuZXhwb3J0IGNvbnN0IENMQVNTID0gU3ltYm9sKCdjbGFzcycpO1xuZXhwb3J0IGNvbnN0IFNUWUxFID0gU3ltYm9sKCdzdHlsZScpO1xuXG5jb25zdCBJU19DVVNUT01fRUxFTUVOVCA9IFN5bWJvbCgnaXMgY3VzdG9tIGVsZW1lbnQnKTtcbmNvbnN0IElTX0hUTUwgPSBTeW1ib2woJ2lzIGh0bWwnKTtcblxuY29uc3QgTElOS19UQUcgPSBJU19YSFRNTCA/ICdsaW5rJyA6ICdMSU5LJztcbmNvbnN0IElOUFVUX1RBRyA9IElTX1hIVE1MID8gJ2lucHV0JyA6ICdJTlBVVCc7XG5jb25zdCBPUFRJT05fVEFHID0gSVNfWEhUTUwgPyAnb3B0aW9uJyA6ICdPUFRJT04nO1xuY29uc3QgU0VMRUNUX1RBRyA9IElTX1hIVE1MID8gJ3NlbGVjdCcgOiAnU0VMRUNUJztcbmNvbnN0IFBST0dSRVNTX1RBRyA9IElTX1hIVE1MID8gJ3Byb2dyZXNzJyA6ICdQUk9HUkVTUyc7XG5cbi8qKlxuICogVGhlIHZhbHVlL2NoZWNrZWQgYXR0cmlidXRlIGluIHRoZSB0ZW1wbGF0ZSBhY3R1YWxseSBjb3JyZXNwb25kcyB0byB0aGUgZGVmYXVsdFZhbHVlIHByb3BlcnR5LCBzbyB3ZSBuZWVkXG4gKiB0byByZW1vdmUgaXQgdXBvbiBoeWRyYXRpb24gdG8gYXZvaWQgYSBidWcgd2hlbiBzb21lb25lIHJlc2V0cyB0aGUgZm9ybSB2YWx1ZS5cbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gaW5wdXRcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlX2lucHV0X2RlZmF1bHRzKGlucHV0KSB7XG5cdGlmICghaHlkcmF0aW5nKSByZXR1cm47XG5cblx0dmFyIGFscmVhZHlfcmVtb3ZlZCA9IGZhbHNlO1xuXG5cdC8vIFdlIHRyeSBhbmQgcmVtb3ZlIHRoZSBkZWZhdWx0IGF0dHJpYnV0ZXMgbGF0ZXIsIHJhdGhlciB0aGFuIHN5bmMgZHVyaW5nIGh5ZHJhdGlvbi5cblx0Ly8gRG9pbmcgaXQgc3luYyBkdXJpbmcgaHlkcmF0aW9uIGhhcyBhIG5lZ2F0aXZlIGltcGFjdCBvbiBwZXJmb3JtYW5jZSwgYnV0IGRlZmVycmluZyB0aGVcblx0Ly8gd29yayBpbiBhbiBpZGxlIHRhc2sgYWxsZXZpYXRlcyB0aGlzIGdyZWF0bHkuIElmIGEgZm9ybSByZXNldCBldmVudCBjb21lcyBpbiBiZWZvcmVcblx0Ly8gdGhlIGlkbGUgY2FsbGJhY2ssIHRoZW4gd2UgZW5zdXJlIHRoZSBpbnB1dCBkZWZhdWx0cyBhcmUgY2xlYXJlZCBqdXN0IGJlZm9yZS5cblx0dmFyIHJlbW92ZV9kZWZhdWx0cyA9ICgpID0+IHtcblx0XHRpZiAoYWxyZWFkeV9yZW1vdmVkKSByZXR1cm47XG5cdFx0YWxyZWFkeV9yZW1vdmVkID0gdHJ1ZTtcblxuXHRcdC8vIFJlbW92ZSB0aGUgYXR0cmlidXRlcyBidXQgcHJlc2VydmUgdGhlIHZhbHVlc1xuXHRcdGlmIChpbnB1dC5oYXNBdHRyaWJ1dGUoJ3ZhbHVlJykpIHtcblx0XHRcdHZhciB2YWx1ZSA9IGlucHV0LnZhbHVlO1xuXHRcdFx0c2V0X2F0dHJpYnV0ZShpbnB1dCwgJ3ZhbHVlJywgbnVsbCk7XG5cdFx0XHRpbnB1dC52YWx1ZSA9IHZhbHVlO1xuXHRcdH1cblxuXHRcdGlmIChpbnB1dC5oYXNBdHRyaWJ1dGUoJ2NoZWNrZWQnKSkge1xuXHRcdFx0dmFyIGNoZWNrZWQgPSBpbnB1dC5jaGVja2VkO1xuXHRcdFx0c2V0X2F0dHJpYnV0ZShpbnB1dCwgJ2NoZWNrZWQnLCBudWxsKTtcblx0XHRcdGlucHV0LmNoZWNrZWQgPSBjaGVja2VkO1xuXHRcdH1cblx0fTtcblxuXHQvKiogQHR5cGUge2FueX0gKi8gKGlucHV0KVtGT1JNX1JFU0VUX0hBTkRMRVJdID0gcmVtb3ZlX2RlZmF1bHRzO1xuXHRxdWV1ZV9taWNyb190YXNrKHJlbW92ZV9kZWZhdWx0cyk7XG5cdGFkZF9mb3JtX3Jlc2V0X2xpc3RlbmVyKCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldF92YWx1ZShlbGVtZW50LCB2YWx1ZSkge1xuXHR2YXIgYXR0cmlidXRlcyA9IGdldF9hdHRyaWJ1dGVzKGVsZW1lbnQpO1xuXG5cdGlmIChcblx0XHRhdHRyaWJ1dGVzLnZhbHVlID09PVxuXHRcdFx0KGF0dHJpYnV0ZXMudmFsdWUgPVxuXHRcdFx0XHQvLyB0cmVhdCBudWxsIGFuZCB1bmRlZmluZWQgdGhlIHNhbWUgZm9yIHRoZSBpbml0aWFsIHZhbHVlXG5cdFx0XHRcdHZhbHVlID8/IHVuZGVmaW5lZCkgfHxcblx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0Ly8gYHByb2dyZXNzYCBlbGVtZW50cyBhbHdheXMgbmVlZCB0aGVpciB2YWx1ZSBzZXQgd2hlbiBpdCdzIGAwYFxuXHRcdChlbGVtZW50LnZhbHVlID09PSB2YWx1ZSAmJiAodmFsdWUgIT09IDAgfHwgZWxlbWVudC5ub2RlTmFtZSAhPT0gUFJPR1JFU1NfVEFHKSlcblx0KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRlbGVtZW50LnZhbHVlID0gdmFsdWUgPz8gJyc7XG59XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNoZWNrZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldF9jaGVja2VkKGVsZW1lbnQsIGNoZWNrZWQpIHtcblx0dmFyIGF0dHJpYnV0ZXMgPSBnZXRfYXR0cmlidXRlcyhlbGVtZW50KTtcblxuXHRpZiAoXG5cdFx0YXR0cmlidXRlcy5jaGVja2VkID09PVxuXHRcdChhdHRyaWJ1dGVzLmNoZWNrZWQgPVxuXHRcdFx0Ly8gdHJlYXQgbnVsbCBhbmQgdW5kZWZpbmVkIHRoZSBzYW1lIGZvciB0aGUgaW5pdGlhbCB2YWx1ZVxuXHRcdFx0Y2hlY2tlZCA/PyB1bmRlZmluZWQpXG5cdCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0ZWxlbWVudC5jaGVja2VkID0gY2hlY2tlZDtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBkZWZhdWx0IGNoZWNrZWQgcHJvcGVydHkgd2l0aG91dCBpbmZsdWVuY2luZyB0aGUgY3VycmVudCBjaGVja2VkIHByb3BlcnR5LlxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNoZWNrZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldF9kZWZhdWx0X2NoZWNrZWQoZWxlbWVudCwgY2hlY2tlZCkge1xuXHRjb25zdCBleGlzdGluZ192YWx1ZSA9IGVsZW1lbnQuY2hlY2tlZDtcblx0ZWxlbWVudC5kZWZhdWx0Q2hlY2tlZCA9IGNoZWNrZWQ7XG5cdGVsZW1lbnQuY2hlY2tlZCA9IGV4aXN0aW5nX3ZhbHVlO1xufVxuXG4vKipcbiAqIEFwcGxpZXMgdGhlIGRlZmF1bHQgdmFsdWUgcHJvcGVydHkgd2l0aG91dCBpbmZsdWVuY2luZyB0aGUgY3VycmVudCB2YWx1ZSBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0X2RlZmF1bHRfdmFsdWUoZWxlbWVudCwgdmFsdWUpIHtcblx0Y29uc3QgZXhpc3RpbmdfdmFsdWUgPSBlbGVtZW50LnZhbHVlO1xuXHRlbGVtZW50LmRlZmF1bHRWYWx1ZSA9IHZhbHVlO1xuXHRlbGVtZW50LnZhbHVlID0gZXhpc3RpbmdfdmFsdWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gYXR0cmlidXRlXG4gKiBAcGFyYW0ge3N0cmluZyB8IG51bGx9IHZhbHVlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtza2lwX3dhcm5pbmddXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRfYXR0cmlidXRlKGVsZW1lbnQsIGF0dHJpYnV0ZSwgdmFsdWUsIHNraXBfd2FybmluZykge1xuXHR2YXIgYXR0cmlidXRlcyA9IGdldF9hdHRyaWJ1dGVzKGVsZW1lbnQpO1xuXG5cdGlmIChoeWRyYXRpbmcpIHtcblx0XHRhdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gPSBlbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuXG5cdFx0aWYgKFxuXHRcdFx0YXR0cmlidXRlID09PSAnc3JjJyB8fFxuXHRcdFx0YXR0cmlidXRlID09PSAnc3Jjc2V0JyB8fFxuXHRcdFx0KGF0dHJpYnV0ZSA9PT0gJ2hyZWYnICYmIGVsZW1lbnQubm9kZU5hbWUgPT09IExJTktfVEFHKVxuXHRcdCkge1xuXHRcdFx0aWYgKCFza2lwX3dhcm5pbmcpIHtcblx0XHRcdFx0Y2hlY2tfc3JjX2luX2Rldl9oeWRyYXRpb24oZWxlbWVudCwgYXR0cmlidXRlLCB2YWx1ZSA/PyAnJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIHdlIHJlc2V0IHRoZXNlIGF0dHJpYnV0ZXMsIHRoZXkgd291bGQgcmVzdWx0IGluIGFub3RoZXIgbmV0d29yayByZXF1ZXN0LCB3aGljaCB3ZSB3YW50IHRvIGF2b2lkLlxuXHRcdFx0Ly8gV2UgYXNzdW1lIHRoZXkgYXJlIHRoZSBzYW1lIGJldHdlZW4gY2xpZW50IGFuZCBzZXJ2ZXIgYXMgY2hlY2tpbmcgaWYgdGhleSBhcmUgZXF1YWwgaXMgZXhwZW5zaXZlXG5cdFx0XHQvLyAod2UgY2FuJ3QganVzdCBjb21wYXJlIHRoZSBzdHJpbmdzIGFzIHRoZXkgY2FuIGJlIGRpZmZlcmVudCBiZXR3ZWVuIGNsaWVudCBhbmQgc2VydmVyIGJ1dCByZXN1bHQgaW4gdGhlXG5cdFx0XHQvLyBzYW1lIHVybCwgc28gd2Ugd291bGQgbmVlZCB0byBjcmVhdGUgaGlkZGVuIGFuY2hvciBlbGVtZW50cyB0byBjb21wYXJlIHRoZW0pXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG5cblx0dmFyIHByZXZpb3VzID0gYXR0cmlidXRlc1thdHRyaWJ1dGVdO1xuXHRpZiAocHJldmlvdXMgPT09IChhdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gPSB2YWx1ZSkpIHJldHVybjtcblxuXHRpZiAoYXR0cmlidXRlID09PSAnbG9hZGluZycpIHtcblx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0ZWxlbWVudFtMT0FESU5HX0FUVFJfU1lNQk9MXSA9IHZhbHVlO1xuXHR9XG5cblx0aWYgKHZhbHVlID09IG51bGwpIHtcblx0XHRlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgJiYgZ2V0X3NldHRlcnMoZWxlbWVudCkuaGFzKGF0dHJpYnV0ZSkpIHtcblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0ZWxlbWVudFthdHRyaWJ1dGVdID0gdmFsdWU7XG5cdH0gZWxzZSBpZiAoXG5cdFx0Ly8gd2hpbGUgaHlkcmF0aW5nLCBza2lwIGEgbnVtYmVyIG9yIGJvb2xlYW4gd2hvc2Ugc3RyaW5nIHRoZSBzZXJ2ZXIgYWxyZWFkeSByZW5kZXJlZFxuXHRcdCEoXG5cdFx0XHRoeWRyYXRpbmcgJiZcblx0XHRcdCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSAmJlxuXHRcdFx0cHJldmlvdXMgPT09IFN0cmluZyh2YWx1ZSlcblx0XHQpXG5cdCkge1xuXHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwgdmFsdWUpO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBkb21cbiAqIEBwYXJhbSB7c3RyaW5nfSBhdHRyaWJ1dGVcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0X3hsaW5rX2F0dHJpYnV0ZShkb20sIGF0dHJpYnV0ZSwgdmFsdWUpIHtcblx0ZG9tLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbm9kZVxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEobm9kZSwgcHJvcCwgdmFsdWUpIHtcblx0Ly8gV2UgbmVlZCB0byBlbnN1cmUgdGhhdCBzZXR0aW5nIGN1c3RvbSBlbGVtZW50IHByb3BzLCB3aGljaCBjYW5cblx0Ly8gaW52b2tlIGxpZmVjeWNsZSBtZXRob2RzIG9uIG90aGVyIGN1c3RvbSBlbGVtZW50cywgZG9lcyBub3QgYWxzb1xuXHQvLyBhc3NvY2lhdGUgdGhvc2UgbGlmZWN5Y2xlIG1ldGhvZHMgd2l0aCB0aGUgY3VycmVudCBhY3RpdmUgcmVhY3Rpb25cblx0Ly8gb3IgZWZmZWN0XG5cdHZhciBwcmV2aW91c19yZWFjdGlvbiA9IGFjdGl2ZV9yZWFjdGlvbjtcblx0dmFyIHByZXZpb3VzX2VmZmVjdCA9IGFjdGl2ZV9lZmZlY3Q7XG5cblx0Ly8gSWYgd2UncmUgaHlkcmF0aW5nIGJ1dCB0aGUgY3VzdG9tIGVsZW1lbnQgaXMgZnJvbSBTdmVsdGUsIGFuZCBpdCBhbHJlYWR5IHNjYWZmb2xkZWQsXG5cdC8vIHRoZW4gaXQgbWlnaHQgcnVuIGJsb2NrIGxvZ2ljIGluIGh5ZHJhdGlvbiBtb2RlLCB3aGljaCB3ZSBoYXZlIHRvIHByZXZlbnQuXG5cdGxldCB3YXNfaHlkcmF0aW5nID0gaHlkcmF0aW5nO1xuXHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0c2V0X2h5ZHJhdGluZyhmYWxzZSk7XG5cdH1cblxuXHRzZXRfYWN0aXZlX3JlYWN0aW9uKG51bGwpO1xuXHRzZXRfYWN0aXZlX2VmZmVjdChudWxsKTtcblxuXHR0cnkge1xuXHRcdGlmIChcblx0XHRcdC8vIGBzdHlsZWAgc2hvdWxkIHVzZSBgc2V0X2F0dHJpYnV0ZWAgcmF0aGVyIHRoYW4gdGhlIHNldHRlclxuXHRcdFx0cHJvcCAhPT0gJ3N0eWxlJyAmJlxuXHRcdFx0Ly8gRG9uJ3QgY29tcHV0ZSBzZXR0ZXJzIGZvciBjdXN0b20gZWxlbWVudHMgd2hpbGUgdGhleSBhcmVuJ3QgcmVnaXN0ZXJlZCB5ZXQsXG5cdFx0XHQvLyBiZWNhdXNlIGR1cmluZyB0aGVpciB1cGdyYWRlL2luc3RhbnRpYXRpb24gdGhleSBtaWdodCBhZGQgbW9yZSBzZXR0ZXJzLlxuXHRcdFx0Ly8gSW5zdGVhZCwgZmFsbCBiYWNrIHRvIGEgc2ltcGxlIFwiYW4gb2JqZWN0LCB0aGVuIHNldCBhcyBwcm9wZXJ0eVwiIGhldXJpc3RpYy5cblx0XHRcdChzZXR0ZXJzX2NhY2hlLmhhcyhub2RlLmdldEF0dHJpYnV0ZSgnaXMnKSB8fCBub2RlLm5vZGVOYW1lKSB8fFxuXHRcdFx0Ly8gY3VzdG9tRWxlbWVudHMgbWF5IG5vdCBiZSBhdmFpbGFibGUgaW4gYnJvd3NlciBleHRlbnNpb24gY29udGV4dHNcblx0XHRcdCFjdXN0b21FbGVtZW50cyB8fFxuXHRcdFx0Y3VzdG9tRWxlbWVudHMuZ2V0KG5vZGUuZ2V0QXR0cmlidXRlKCdpcycpIHx8IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSlcblx0XHRcdFx0PyBnZXRfc2V0dGVycyhub2RlKS5oYXMocHJvcClcblx0XHRcdFx0OiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKVxuXHRcdCkge1xuXHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRcdFx0bm9kZVtwcm9wXSA9IHZhbHVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBXZSBkaWQgZ2V0dGVycyBldGMgY2hlY2tzIGFscmVhZHksIHN0cmluZ2lmeSBiZWZvcmUgcGFzc2luZyB0byBzZXRfYXR0cmlidXRlXG5cdFx0XHQvLyB0byBlbnN1cmUgaXQgZG9lc24ndCBpbnZva2UgdGhlIHNhbWUgbG9naWMgYWdhaW4sIGFuZCBwb3RlbnRpYWxseSBwb3B1bGF0aW5nXG5cdFx0XHQvLyB0aGUgc2V0dGVycyBjYWNoZSB0b28gZWFybHkuXG5cdFx0XHRzZXRfYXR0cmlidXRlKG5vZGUsIHByb3AsIHZhbHVlID09IG51bGwgPyB2YWx1ZSA6IFN0cmluZyh2YWx1ZSkpO1xuXHRcdH1cblx0fSBmaW5hbGx5IHtcblx0XHRzZXRfYWN0aXZlX3JlYWN0aW9uKHByZXZpb3VzX3JlYWN0aW9uKTtcblx0XHRzZXRfYWN0aXZlX2VmZmVjdChwcmV2aW91c19lZmZlY3QpO1xuXHRcdGlmICh3YXNfaHlkcmF0aW5nKSB7XG5cdFx0XHRzZXRfaHlkcmF0aW5nKHRydWUpO1xuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIFNwcmVhZHMgYXR0cmlidXRlcyBvbnRvIGEgRE9NIGVsZW1lbnQsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIGN1cnJlbnRseSBzZXQgYXR0cmlidXRlc1xuICogQHBhcmFtIHtFbGVtZW50ICYgRWxlbWVudENTU0lubGluZVN0eWxlfSBlbGVtZW50XG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcgfCBzeW1ib2wsIGFueT4gfCB1bmRlZmluZWR9IHByZXZcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZyB8IHN5bWJvbCwgYW55Pn0gbmV4dCBOZXcgYXR0cmlidXRlcyAtIHRoaXMgZnVuY3Rpb24gbXV0YXRlcyB0aGlzIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IFtjc3NfaGFzaF1cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Nob3VsZF9yZW1vdmVfZGVmYXVsdHNdXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtza2lwX3dhcm5pbmddXG4gKiBAcmV0dXJucyB7UmVjb3JkPHN0cmluZywgYW55Pn1cbiAqL1xuZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZXMoXG5cdGVsZW1lbnQsXG5cdHByZXYsXG5cdG5leHQsXG5cdGNzc19oYXNoLFxuXHRzaG91bGRfcmVtb3ZlX2RlZmF1bHRzID0gZmFsc2UsXG5cdHNraXBfd2FybmluZyA9IGZhbHNlXG4pIHtcblx0aWYgKGh5ZHJhdGluZyAmJiBzaG91bGRfcmVtb3ZlX2RlZmF1bHRzICYmIGVsZW1lbnQubm9kZU5hbWUgPT09IElOUFVUX1RBRykge1xuXHRcdGlmICghKCdkZWZhdWx0VmFsdWUnIGluIG5leHQgfHwgJ2RlZmF1bHRDaGVja2VkJyBpbiBuZXh0KSkge1xuXHRcdFx0cmVtb3ZlX2lucHV0X2RlZmF1bHRzKC8qKiBAdHlwZSB7SFRNTElucHV0RWxlbWVudH0gKi8gKGVsZW1lbnQpKTtcblx0XHR9XG5cdH1cblxuXHR2YXIgYXR0cmlidXRlcyA9IGdldF9hdHRyaWJ1dGVzKGVsZW1lbnQpO1xuXG5cdHZhciBpc19jdXN0b21fZWxlbWVudCA9IGF0dHJpYnV0ZXNbSVNfQ1VTVE9NX0VMRU1FTlRdO1xuXHR2YXIgcHJlc2VydmVfYXR0cmlidXRlX2Nhc2UgPSAhYXR0cmlidXRlc1tJU19IVE1MXTtcblxuXHQvLyBJZiB3ZSdyZSBoeWRyYXRpbmcgYnV0IHRoZSBjdXN0b20gZWxlbWVudCBpcyBmcm9tIFN2ZWx0ZSwgYW5kIGl0IGFscmVhZHkgc2NhZmZvbGRlZCxcblx0Ly8gdGhlbiBpdCBtaWdodCBydW4gYmxvY2sgbG9naWMgaW4gaHlkcmF0aW9uIG1vZGUsIHdoaWNoIHdlIGhhdmUgdG8gcHJldmVudC5cblx0bGV0IGlzX2h5ZHJhdGluZ19jdXN0b21fZWxlbWVudCA9IGh5ZHJhdGluZyAmJiBpc19jdXN0b21fZWxlbWVudDtcblx0aWYgKGlzX2h5ZHJhdGluZ19jdXN0b21fZWxlbWVudCkge1xuXHRcdHNldF9oeWRyYXRpbmcoZmFsc2UpO1xuXHR9XG5cblx0dmFyIGN1cnJlbnQgPSBwcmV2IHx8IHt9O1xuXHR2YXIgaXNfb3B0aW9uX2VsZW1lbnQgPSBlbGVtZW50Lm5vZGVOYW1lID09PSBPUFRJT05fVEFHO1xuXHR2YXIgaXNfc2VsZWN0X2VsZW1lbnQgPSBlbGVtZW50Lm5vZGVOYW1lID09PSBTRUxFQ1RfVEFHO1xuXG5cdHRyeSB7XG5cdFx0Zm9yICh2YXIga2V5IGluIHByZXYpIHtcblx0XHRcdC8vIGRvbid0IG51bGwgb3VyIGludGVybmFsICQkb25YIGxpc3RlbmVyc1xuXHRcdFx0aWYgKCEoa2V5IGluIG5leHQpICYmIGtleVswXSArIGtleVsxXSAhPT0gJyQkJykge1xuXHRcdFx0XHRuZXh0W2tleV0gPSBudWxsO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChuZXh0LmNsYXNzKSB7XG5cdFx0XHRuZXh0LmNsYXNzID0gY2xzeChuZXh0LmNsYXNzKTtcblx0XHR9IGVsc2UgaWYgKGNzc19oYXNoIHx8IG5leHRbQ0xBU1NdKSB7XG5cdFx0XHRuZXh0LmNsYXNzID0gbnVsbDsgLyogZm9yY2UgY2FsbCB0byBzZXRfY2xhc3MoKSAqL1xuXHRcdH1cblxuXHRcdGlmIChuZXh0W1NUWUxFXSkge1xuXHRcdFx0bmV4dC5zdHlsZSA/Pz0gbnVsbDsgLyogZm9yY2UgY2FsbCB0byBzZXRfc3R5bGUoKSAqL1xuXHRcdH1cblxuXHRcdHZhciBzZXR0ZXJzID0gZ2V0X3NldHRlcnMoZWxlbWVudCk7XG5cblx0XHRpZiAoXG5cdFx0XHRlbGVtZW50Lm5vZGVOYW1lID09PSBJTlBVVF9UQUcgJiZcblx0XHRcdCd0eXBlJyBpbiBuZXh0ICYmXG5cdFx0XHQoJ3ZhbHVlJyBpbiBuZXh0IHx8ICdfX3ZhbHVlJyBpbiBuZXh0KVxuXHRcdCkge1xuXHRcdFx0dmFyIHR5cGUgPSBuZXh0LnR5cGU7XG5cblx0XHRcdGlmICh0eXBlICE9PSBjdXJyZW50LnR5cGUgfHwgKHR5cGUgPT09IHVuZGVmaW5lZCAmJiBlbGVtZW50Lmhhc0F0dHJpYnV0ZSgndHlwZScpKSkge1xuXHRcdFx0XHRjdXJyZW50LnR5cGUgPSB0eXBlO1xuXHRcdFx0XHRzZXRfYXR0cmlidXRlKGVsZW1lbnQsICd0eXBlJywgdHlwZSwgc2tpcF93YXJuaW5nKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBzaW5jZSBrZXkgaXMgY2FwdHVyZWQgd2UgdXNlIGNvbnN0XG5cdFx0Zm9yIChjb25zdCBrZXkgaW4gbmV4dCkge1xuXHRcdFx0Ly8gbGV0IGluc3RlYWQgb2YgdmFyIGJlY2F1c2UgcmVmZXJlbmNlZCBpbiBhIGNsb3N1cmVcblx0XHRcdGxldCB2YWx1ZSA9IG5leHRba2V5XTtcblxuXHRcdFx0Ly8gVXAgaGVyZSBiZWNhdXNlIHdlIHdhbnQgdG8gZG8gdGhpcyBmb3IgdGhlIGluaXRpYWwgdmFsdWUsIHRvbywgZXZlbiBpZiBpdCdzIHVuZGVmaW5lZCxcblx0XHRcdC8vIGFuZCB0aGlzIHdvdWxkbid0IGJlIHJlYWNoZWQgaW4gY2FzZSBvZiB1bmRlZmluZWQgYmVjYXVzZSBvZiB0aGUgZXF1YWxpdHkgY2hlY2sgYmVsb3dcblx0XHRcdGlmIChpc19vcHRpb25fZWxlbWVudCAmJiBrZXkgPT09ICd2YWx1ZScgJiYgdmFsdWUgPT0gbnVsbCkge1xuXHRcdFx0XHQvLyBUaGUgPG9wdGlvbj4gZWxlbWVudCBpcyBhIHNwZWNpYWwgY2FzZSBiZWNhdXNlIHJlbW92aW5nIHRoZSB2YWx1ZSBhdHRyaWJ1dGUgbWVhbnNcblx0XHRcdFx0Ly8gdGhlIHZhbHVlIGlzIHNldCB0byB0aGUgdGV4dCBjb250ZW50IG9mIHRoZSBvcHRpb24gZWxlbWVudCwgYW5kIHNldHRpbmcgdGhlIHZhbHVlXG5cdFx0XHRcdC8vIHRvIG51bGwgb3IgdW5kZWZpbmVkIG1lYW5zIHRoZSB2YWx1ZSBpcyBzZXQgdG8gdGhlIHN0cmluZyBcIm51bGxcIiBvciBcInVuZGVmaW5lZFwiLlxuXHRcdFx0XHQvLyBUbyBhbGlnbiB3aXRoIGhvdyB3ZSBoYW5kbGUgdGhpcyBjYXNlIGluIG5vbi1zcHJlYWQtc2NlbmFyaW9zLCB0aGlzIGxvZ2ljIGlzIG5lZWRlZC5cblx0XHRcdFx0Ly8gVGhlcmUncyBhIHN1cGVyLWVkZ2UtY2FzZSBidWcgaGVyZSB0aGF0IGlzIGxlZnQgaW4gaW4gZmF2b3Igb2Ygc21hbGxlciBjb2RlIHNpemU6XG5cdFx0XHRcdC8vIEJlY2F1c2Ugb2YgdGhlIFwic2V0IG1pc3NpbmcgcHJvcHMgdG8gbnVsbFwiIGxvZ2ljIGFib3ZlLCB3ZSBjYW4ndCBkaWZmZXJlbnRpYXRlXG5cdFx0XHRcdC8vIGJldHdlZW4gYSBtaXNzaW5nIHZhbHVlIGFuZCBhbiBleHBsaWNpdGx5IHNldCB2YWx1ZSBvZiBudWxsIG9yIHVuZGVmaW5lZC4gVGhhdCBtZWFuc1xuXHRcdFx0XHQvLyB0aGF0IG9uY2Ugc2V0LCB0aGUgdmFsdWUgYXR0cmlidXRlIG9mIGFuIDxvcHRpb24+IGVsZW1lbnQgY2FuJ3QgYmUgcmVtb3ZlZC4gVGhpcyBpc1xuXHRcdFx0XHQvLyBhIHZlcnkgcmFyZSBlZGdlIGNhc2UsIGFuZCByZW1vdmluZyB0aGUgYXR0cmlidXRlIGFsdG9nZXRoZXIgaXNuJ3QgcG9zc2libGUgZWl0aGVyXG5cdFx0XHRcdC8vIGZvciB0aGUgPG9wdGlvbiB2YWx1ZT17dW5kZWZpbmVkfT4gY2FzZSwgc28gd2UncmUgbm90IGxvc2luZyBhbnkgZnVuY3Rpb25hbGl0eSBoZXJlLlxuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdGVsZW1lbnQudmFsdWUgPSBlbGVtZW50Ll9fdmFsdWUgPSAnJztcblx0XHRcdFx0Y3VycmVudFtrZXldID0gdmFsdWU7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoa2V5ID09PSAnY2xhc3MnKSB7XG5cdFx0XHRcdHZhciBpc19odG1sID0gZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJztcblx0XHRcdFx0c2V0X2NsYXNzKGVsZW1lbnQsIGlzX2h0bWwsIHZhbHVlLCBjc3NfaGFzaCwgcHJldj8uW0NMQVNTXSwgbmV4dFtDTEFTU10pO1xuXHRcdFx0XHRjdXJyZW50W2tleV0gPSB2YWx1ZTtcblx0XHRcdFx0Y3VycmVudFtDTEFTU10gPSBuZXh0W0NMQVNTXTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChrZXkgPT09ICdzdHlsZScpIHtcblx0XHRcdFx0c2V0X3N0eWxlKGVsZW1lbnQsIHZhbHVlLCBwcmV2Py5bU1RZTEVdLCBuZXh0W1NUWUxFXSk7XG5cdFx0XHRcdGN1cnJlbnRba2V5XSA9IHZhbHVlO1xuXHRcdFx0XHRjdXJyZW50W1NUWUxFXSA9IG5leHRbU1RZTEVdO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHByZXZfdmFsdWUgPSBjdXJyZW50W2tleV07XG5cblx0XHRcdC8vIFNraXAgaWYgdmFsdWUgaXMgdW5jaGFuZ2VkLCB1bmxlc3MgaXQncyBgdW5kZWZpbmVkYCBhbmQgdGhlIGVsZW1lbnQgc3RpbGwgaGFzIHRoZSBhdHRyaWJ1dGVcblx0XHRcdGlmICh2YWx1ZSA9PT0gcHJldl92YWx1ZSAmJiAhKHZhbHVlID09PSB1bmRlZmluZWQgJiYgZWxlbWVudC5oYXNBdHRyaWJ1dGUoa2V5KSkpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdGN1cnJlbnRba2V5XSA9IHZhbHVlO1xuXG5cdFx0XHR2YXIgcHJlZml4ID0ga2V5WzBdICsga2V5WzFdOyAvLyB0aGlzIGlzIGZhc3RlciB0aGFuIGtleS5zbGljZSgwLCAyKVxuXHRcdFx0aWYgKHByZWZpeCA9PT0gJyQkJykgY29udGludWU7XG5cblx0XHRcdGlmIChwcmVmaXggPT09ICdvbicpIHtcblx0XHRcdFx0LyoqIEB0eXBlIHt7IGNhcHR1cmU/OiB0cnVlIH19ICovXG5cdFx0XHRcdGNvbnN0IG9wdHMgPSB7fTtcblx0XHRcdFx0Y29uc3QgZXZlbnRfaGFuZGxlX2tleSA9ICckJCcgKyBrZXk7XG5cdFx0XHRcdGxldCBldmVudF9uYW1lID0ga2V5LnNsaWNlKDIpO1xuXHRcdFx0XHR2YXIgaXNfZGVsZWdhdGVkID0gY2FuX2RlbGVnYXRlX2V2ZW50KGV2ZW50X25hbWUpO1xuXG5cdFx0XHRcdGlmIChpc19jYXB0dXJlX2V2ZW50KGV2ZW50X25hbWUpKSB7XG5cdFx0XHRcdFx0ZXZlbnRfbmFtZSA9IGV2ZW50X25hbWUuc2xpY2UoMCwgLTcpO1xuXHRcdFx0XHRcdG9wdHMuY2FwdHVyZSA9IHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIWlzX2RlbGVnYXRlZCAmJiBwcmV2X3ZhbHVlKSB7XG5cdFx0XHRcdFx0Ly8gTGlzdGVuaW5nIHRvIHNhbWUgZXZlbnQgYnV0IGRpZmZlcmVudCBoYW5kbGVyIC0+IG91ciBoYW5kbGUgZnVuY3Rpb24gYmVsb3cgdGFrZXMgY2FyZSBvZiB0aGlzXG5cdFx0XHRcdFx0Ly8gSWYgd2Ugd2VyZSB0byByZW1vdmUgYW5kIGFkZCBsaXN0ZW5lcnMgaW4gdGhpcyBjYXNlLCBpdCBjb3VsZCBoYXBwZW4gdGhhdCB0aGUgZXZlbnQgaXMgXCJzd2FsbG93ZWRcIlxuXHRcdFx0XHRcdC8vICh0aGUgYnJvd3NlciBzZWVtcyB0byBub3Qga25vdyB5ZXQgdGhhdCBhIG5ldyBvbmUgZXhpc3RzIG5vdykgYW5kIGRvZXNuJ3QgcmVhY2ggdGhlIGhhbmRsZXJcblx0XHRcdFx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vc3ZlbHRlanMvc3ZlbHRlL2lzc3Vlcy8xMTkwM1xuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPSBudWxsKSBjb250aW51ZTtcblxuXHRcdFx0XHRcdGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBjdXJyZW50W2V2ZW50X2hhbmRsZV9rZXldLCBvcHRzKTtcblx0XHRcdFx0XHRjdXJyZW50W2V2ZW50X2hhbmRsZV9rZXldID0gbnVsbDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChpc19kZWxlZ2F0ZWQpIHtcblx0XHRcdFx0XHRkZWxlZ2F0ZWQoZXZlbnRfbmFtZSwgZWxlbWVudCwgdmFsdWUpO1xuXHRcdFx0XHRcdGRlbGVnYXRlKFtldmVudF9uYW1lXSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuXHRcdFx0XHRcdC8qKlxuXHRcdFx0XHRcdCAqIEB0aGlzIHthbnl9XG5cdFx0XHRcdFx0ICogQHBhcmFtIHtFdmVudH0gZXZ0XG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0ZnVuY3Rpb24gaGFuZGxlKGV2dCkge1xuXHRcdFx0XHRcdFx0Y3VycmVudFtrZXldLmNhbGwodGhpcywgZXZ0KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjdXJyZW50W2V2ZW50X2hhbmRsZV9rZXldID0gY3JlYXRlX2V2ZW50KGV2ZW50X25hbWUsIGVsZW1lbnQsIGhhbmRsZSwgb3B0cyk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKSB7XG5cdFx0XHRcdC8vIGF2b2lkIHVzaW5nIHRoZSBzZXR0ZXJcblx0XHRcdFx0c2V0X2F0dHJpYnV0ZShlbGVtZW50LCBrZXksIHZhbHVlKTtcblx0XHRcdH0gZWxzZSBpZiAoa2V5ID09PSAnYXV0b2ZvY3VzJykge1xuXHRcdFx0XHRhdXRvZm9jdXMoLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGVsZW1lbnQpLCBCb29sZWFuKHZhbHVlKSk7XG5cdFx0XHR9IGVsc2UgaWYgKCFpc19jdXN0b21fZWxlbWVudCAmJiAoa2V5ID09PSAnX192YWx1ZScgfHwgKGtleSA9PT0gJ3ZhbHVlJyAmJiB2YWx1ZSAhPSBudWxsKSkpIHtcblx0XHRcdFx0Ly8gQHRzLWlnbm9yZSBXZSdyZSBub3QgcnVubmluZyB0aGlzIGZvciBjdXN0b20gZWxlbWVudHMgYmVjYXVzZSBfX3ZhbHVlIGlzIGFjdHVhbGx5XG5cdFx0XHRcdC8vIGhvdyBMaXQgc3RvcmVzIHRoZSBjdXJyZW50IHZhbHVlIG9uIHRoZSBlbGVtZW50LCBhbmQgbWVzc2luZyB3aXRoIHRoYXQgd291bGQgYnJlYWsgdGhpbmdzLlxuXHRcdFx0XHRlbGVtZW50Ll9fdmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0Ly8gd2UgZG9uJ3Qgc2V0IHRoZSB2YWx1ZSBpZiBpdCBoYXNuJ3QgY2hhbmdlZC4gVGhpcyBzdXBwb3J0cyBpbnZhbGlkIG51bWJlciBpbnB1dHMgbGlrZSBgMWVgIGJlY2F1c2Vcblx0XHRcdFx0Ly8gMS4gdXNlciB0eXBlcyAxZVxuXHRcdFx0XHQvLyAyLiB0aGUgc3RhdGUgaXMgdXBkYXRlZCByZWFkaW5nIGUudGFyZ2V0LnZhbHVlIHdoaWNoIGlzICcnXG5cdFx0XHRcdC8vIDMuIHRoZSBzcHJlYWRlZCB2YWx1ZSBpcyAnJ1xuXHRcdFx0XHQvLyA0LiB1cGRhdGluZyBpbnB1dC52YWx1ZSB3b3VsZCB0aHVzLCBjbGVhciB0aGUgdXNlciB2YWx1ZVxuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0cHJldl92YWx1ZSA9PSBudWxsIHx8XG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdGVsZW1lbnQudmFsdWUgIT09IHZhbHVlIHx8XG5cdFx0XHRcdFx0KHZhbHVlID09PSAwICYmIGVsZW1lbnQubm9kZU5hbWUgPT09IFBST0dSRVNTX1RBRylcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdGVsZW1lbnQudmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChrZXkgPT09ICdzZWxlY3RlZCcgJiYgaXNfb3B0aW9uX2VsZW1lbnQpIHtcblx0XHRcdFx0c2V0X3NlbGVjdGVkKC8qKiBAdHlwZSB7SFRNTE9wdGlvbkVsZW1lbnR9ICovIChlbGVtZW50KSwgdmFsdWUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFyIG5hbWUgPSBrZXk7XG5cdFx0XHRcdGlmICghcHJlc2VydmVfYXR0cmlidXRlX2Nhc2UpIHtcblx0XHRcdFx0XHRuYW1lID0gbm9ybWFsaXplX2F0dHJpYnV0ZShuYW1lKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBpc19kZWZhdWx0ID0gbmFtZSA9PT0gJ2RlZmF1bHRWYWx1ZScgfHwgbmFtZSA9PT0gJ2RlZmF1bHRDaGVja2VkJztcblxuXHRcdFx0XHQvLyBBIHNlbGVjdCdzIGRlZmF1bHQgdmFsdWUgaXMgcmVwcmVzZW50ZWQgYnkgc2VsZWN0ZWQgb3B0aW9ucywgbm90IGEgcHJvcGVydHkuXG5cdFx0XHRcdGlmIChpc19zZWxlY3RfZWxlbWVudCAmJiBuYW1lID09PSAnZGVmYXVsdFZhbHVlJykgY29udGludWU7XG5cblx0XHRcdFx0aWYgKHZhbHVlID09IG51bGwgJiYgIWlzX2N1c3RvbV9lbGVtZW50ICYmICFpc19kZWZhdWx0KSB7XG5cdFx0XHRcdFx0YXR0cmlidXRlc1trZXldID0gbnVsbDtcblxuXHRcdFx0XHRcdGlmIChuYW1lID09PSAndmFsdWUnIHx8IG5hbWUgPT09ICdjaGVja2VkJykge1xuXHRcdFx0XHRcdFx0Ly8gcmVtb3ZpbmcgdmFsdWUvY2hlY2tlZCBhbHNvIHJlbW92ZXMgZGVmYXVsdFZhbHVlL2RlZmF1bHRDaGVja2VkIOKAlCBwcmVzZXJ2ZVxuXHRcdFx0XHRcdFx0bGV0IGlucHV0ID0gLyoqIEB0eXBlIHtIVE1MSW5wdXRFbGVtZW50fSAqLyAoZWxlbWVudCk7XG5cdFx0XHRcdFx0XHRjb25zdCB1c2VfZGVmYXVsdCA9IHByZXYgPT09IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRcdGlmIChuYW1lID09PSAndmFsdWUnKSB7XG5cdFx0XHRcdFx0XHRcdGxldCBwcmV2aW91cyA9IGlucHV0LmRlZmF1bHRWYWx1ZTtcblx0XHRcdFx0XHRcdFx0aW5wdXQucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuXHRcdFx0XHRcdFx0XHRpbnB1dC5kZWZhdWx0VmFsdWUgPSBwcmV2aW91cztcblx0XHRcdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdFx0XHRpbnB1dC52YWx1ZSA9IGlucHV0Ll9fdmFsdWUgPSB1c2VfZGVmYXVsdCA/IHByZXZpb3VzIDogbnVsbDtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGxldCBwcmV2aW91cyA9IGlucHV0LmRlZmF1bHRDaGVja2VkO1xuXHRcdFx0XHRcdFx0XHRpbnB1dC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG5cdFx0XHRcdFx0XHRcdGlucHV0LmRlZmF1bHRDaGVja2VkID0gcHJldmlvdXM7XG5cdFx0XHRcdFx0XHRcdGlucHV0LmNoZWNrZWQgPSB1c2VfZGVmYXVsdCA/IHByZXZpb3VzIDogZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGtleSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0XHRcdGlzX2RlZmF1bHQgfHxcblx0XHRcdFx0XHQoKGlzX2N1c3RvbV9lbGVtZW50IHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpICYmIHNldHRlcnMuaGFzKG5hbWUpKVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0ZWxlbWVudFtuYW1lXSA9IHZhbHVlO1xuXHRcdFx0XHRcdC8vIHJlbW92ZSBpdCBmcm9tIGF0dHJpYnV0ZXMncyBjYWNoZVxuXHRcdFx0XHRcdGlmIChuYW1lIGluIGF0dHJpYnV0ZXMpIGF0dHJpYnV0ZXNbbmFtZV0gPSBVTklOSVRJQUxJWkVEO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdHNldF9hdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgdmFsdWUsIHNraXBfd2FybmluZyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0gZmluYWxseSB7XG5cdFx0aWYgKGlzX2h5ZHJhdGluZ19jdXN0b21fZWxlbWVudCkge1xuXHRcdFx0c2V0X2h5ZHJhdGluZyh0cnVlKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gY3VycmVudDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnQgJiBFbGVtZW50Q1NTSW5saW5lU3R5bGV9IGVsZW1lbnRcbiAqIEBwYXJhbSB7KC4uLmV4cHJlc3Npb25zOiBhbnkpID0+IFJlY29yZDxzdHJpbmcgfCBzeW1ib2wsIGFueT59IGZuXG4gKiBAcGFyYW0ge0FycmF5PCgpID0+IGFueT59IHN5bmNcbiAqIEBwYXJhbSB7QXJyYXk8KCkgPT4gUHJvbWlzZTxhbnk+Pn0gYXN5bmNcbiAqIEBwYXJhbSB7QmxvY2tlcltdfSBibG9ja2Vyc1xuICogQHBhcmFtIHtzdHJpbmd9IFtjc3NfaGFzaF1cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Nob3VsZF9yZW1vdmVfZGVmYXVsdHNdXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtza2lwX3dhcm5pbmddXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRyaWJ1dGVfZWZmZWN0KFxuXHRlbGVtZW50LFxuXHRmbixcblx0c3luYyA9IFtdLFxuXHRhc3luYyA9IFtdLFxuXHRibG9ja2VycyA9IFtdLFxuXHRjc3NfaGFzaCxcblx0c2hvdWxkX3JlbW92ZV9kZWZhdWx0cyA9IGZhbHNlLFxuXHRza2lwX3dhcm5pbmcgPSBmYWxzZVxuKSB7XG5cdGZsYXR0ZW4oYmxvY2tlcnMsIHN5bmMsIGFzeW5jLCAodmFsdWVzKSA9PiB7XG5cdFx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nIHwgc3ltYm9sLCBhbnk+IHwgdW5kZWZpbmVkfSAqL1xuXHRcdHZhciBwcmV2ID0gdW5kZWZpbmVkO1xuXG5cdFx0LyoqIEB0eXBlIHtSZWNvcmQ8c3ltYm9sLCBFZmZlY3Q+fSAqL1xuXHRcdHZhciBlZmZlY3RzID0ge307XG5cblx0XHR2YXIgaXNfc2VsZWN0ID0gZWxlbWVudC5ub2RlTmFtZSA9PT0gU0VMRUNUX1RBRztcblx0XHR2YXIgaW5pdGVkID0gZmFsc2U7XG5cblx0XHRtYW5hZ2VkKCgpID0+IHtcblx0XHRcdHZhciBuZXh0ID0gZm4oLi4udmFsdWVzLm1hcChnZXQpKTtcblx0XHRcdC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZyB8IHN5bWJvbCwgYW55Pn0gKi9cblx0XHRcdHZhciBjdXJyZW50ID0gc2V0X2F0dHJpYnV0ZXMoXG5cdFx0XHRcdGVsZW1lbnQsXG5cdFx0XHRcdHByZXYsXG5cdFx0XHRcdG5leHQsXG5cdFx0XHRcdGNzc19oYXNoLFxuXHRcdFx0XHRzaG91bGRfcmVtb3ZlX2RlZmF1bHRzLFxuXHRcdFx0XHRza2lwX3dhcm5pbmdcblx0XHRcdCk7XG5cblx0XHRcdGlmIChpbml0ZWQgJiYgaXNfc2VsZWN0KSB7XG5cdFx0XHRcdHZhciBzZWxlY3QgPSAvKiogQHR5cGUge0hUTUxTZWxlY3RFbGVtZW50fSAqLyAoZWxlbWVudCk7XG5cblx0XHRcdFx0aWYgKCdkZWZhdWx0VmFsdWUnIGluIG5leHQpIHtcblx0XHRcdFx0XHRzZXRfZGVmYXVsdF9zZWxlY3RfdmFsdWUoc2VsZWN0LCBuZXh0LmRlZmF1bHRWYWx1ZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJ3ZhbHVlJyBpbiBuZXh0KSB7XG5cdFx0XHRcdFx0c2VsZWN0X29wdGlvbihzZWxlY3QsIG5leHQudmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IHN5bWJvbCBvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGVmZmVjdHMpKSB7XG5cdFx0XHRcdGlmICghbmV4dFtzeW1ib2xdKSBkZXN0cm95X2VmZmVjdChlZmZlY3RzW3N5bWJvbF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKGxldCBzeW1ib2wgb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhuZXh0KSkge1xuXHRcdFx0XHR2YXIgbiA9IG5leHRbc3ltYm9sXTtcblxuXHRcdFx0XHRpZiAoc3ltYm9sLmRlc2NyaXB0aW9uID09PSBBVFRBQ0hNRU5UX0tFWSAmJiAoIXByZXYgfHwgbiAhPT0gcHJldltzeW1ib2xdKSkge1xuXHRcdFx0XHRcdGlmIChlZmZlY3RzW3N5bWJvbF0pIGRlc3Ryb3lfZWZmZWN0KGVmZmVjdHNbc3ltYm9sXSk7XG5cdFx0XHRcdFx0ZWZmZWN0c1tzeW1ib2xdID0gYnJhbmNoKCgpID0+IGF0dGFjaChlbGVtZW50LCAoKSA9PiBuKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjdXJyZW50W3N5bWJvbF0gPSBuO1xuXHRcdFx0fVxuXG5cdFx0XHRwcmV2ID0gY3VycmVudDtcblx0XHR9KTtcblxuXHRcdGlmIChpc19zZWxlY3QpIHtcblx0XHRcdHZhciBzZWxlY3QgPSAvKiogQHR5cGUge0hUTUxTZWxlY3RFbGVtZW50fSAqLyAoZWxlbWVudCk7XG5cblx0XHRcdGVmZmVjdCgoKSA9PiB7XG5cdFx0XHRcdHZhciBhdHRycyA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZyB8IHN5bWJvbCwgYW55Pn0gKi8gKHByZXYpO1xuXG5cdFx0XHRcdGlmICgnZGVmYXVsdFZhbHVlJyBpbiBhdHRycykge1xuXHRcdFx0XHRcdHNldF9kZWZhdWx0X3NlbGVjdF92YWx1ZShzZWxlY3QsIGF0dHJzLmRlZmF1bHRWYWx1ZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzZWxlY3Rfb3B0aW9uKHNlbGVjdCwgYXR0cnMudmFsdWUsIHRydWUpO1xuXHRcdFx0XHRpbml0X3NlbGVjdChzZWxlY3QpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aW5pdGVkID0gdHJ1ZTtcblx0fSk7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudFxuICovXG5mdW5jdGlvbiBnZXRfYXR0cmlidXRlcyhlbGVtZW50KSB7XG5cdHJldHVybiAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcgfCBzeW1ib2wsIHVua25vd24+fSAqKi8gKFxuXHRcdC8qKiBAdHlwZSB7YW55fSAqLyAoZWxlbWVudClbQVRUUklCVVRFU19DQUNIRV0gPz89IHtcblx0XHRcdFtJU19DVVNUT01fRUxFTUVOVF06IGVsZW1lbnQubm9kZU5hbWUuaW5jbHVkZXMoJy0nKSxcblx0XHRcdFtJU19IVE1MXTogZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IE5BTUVTUEFDRV9IVE1MXG5cdFx0fVxuXHQpO1xufVxuXG4vKiogQHR5cGUge01hcDxzdHJpbmcsIFNldDxzdHJpbmc+Pn0gKi9cbnZhciBzZXR0ZXJzX2NhY2hlID0gbmV3IE1hcCgpO1xuXG4vKiogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50ICovXG5mdW5jdGlvbiBnZXRfc2V0dGVycyhlbGVtZW50KSB7XG5cdHZhciBjYWNoZV9rZXkgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnaXMnKSB8fCBlbGVtZW50Lm5vZGVOYW1lO1xuXHR2YXIgc2V0dGVycyA9IHNldHRlcnNfY2FjaGUuZ2V0KGNhY2hlX2tleSk7XG5cdGlmIChzZXR0ZXJzKSByZXR1cm4gc2V0dGVycztcblx0c2V0dGVyc19jYWNoZS5zZXQoY2FjaGVfa2V5LCAoc2V0dGVycyA9IG5ldyBTZXQoKSkpO1xuXG5cdHZhciBkZXNjcmlwdG9ycztcblx0dmFyIHByb3RvID0gZWxlbWVudDsgLy8gSW4gdGhlIGNhc2Ugb2YgY3VzdG9tIGVsZW1lbnRzIHRoZXJlIG1pZ2h0IGJlIHNldHRlcnMgb24gdGhlIGluc3RhbmNlXG5cdHZhciBlbGVtZW50X3Byb3RvID0gRWxlbWVudC5wcm90b3R5cGU7XG5cblx0Ly8gU3RvcCBhdCBFbGVtZW50LCBmcm9tIHRoZXJlIG9uIHRoZXJlJ3Mgb25seSB1bm5lY2Vzc2FyeSAoYW5kIGRhbmdlcm91cywgbGlrZSBpbm5lckhUTUwpIHNldHRlcnMgd2UncmUgbm90IGludGVyZXN0ZWQgaW5cblx0Ly8gRG8gbm90IHVzZSBjb25zdHJ1Y3Rvci5uYW1lIGhlcmUgYXMgdGhhdCdzIHVucmVsaWFibGUgaW4gc29tZSBicm93c2VyIGVudmlyb25tZW50c1xuXHR3aGlsZSAoZWxlbWVudF9wcm90byAhPT0gcHJvdG8pIHtcblx0XHRkZXNjcmlwdG9ycyA9IGdldF9kZXNjcmlwdG9ycyhwcm90byk7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gZGVzY3JpcHRvcnMpIHtcblx0XHRcdGlmIChcblx0XHRcdFx0ZGVzY3JpcHRvcnNba2V5XS5zZXQgJiZcblx0XHRcdFx0Ly8gYmV0dGVyIHNhZmUgdGhhbiBzb3JyeSwgd2UgZG9uJ3Qgd2FudCBzcHJlYWQgYXR0cmlidXRlcyB0byBtZXNzIHdpdGggSFRNTCBjb250ZW50XG5cdFx0XHRcdGtleSAhPT0gJ2lubmVySFRNTCcgJiZcblx0XHRcdFx0a2V5ICE9PSAndGV4dENvbnRlbnQnICYmXG5cdFx0XHRcdGtleSAhPT0gJ2lubmVyVGV4dCdcblx0XHRcdCkge1xuXHRcdFx0XHRzZXR0ZXJzLmFkZChrZXkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHByb3RvID0gZ2V0X3Byb3RvdHlwZV9vZihwcm90byk7XG5cdH1cblxuXHRyZXR1cm4gc2V0dGVycztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gZWxlbWVudFxuICogQHBhcmFtIHtzdHJpbmd9IGF0dHJpYnV0ZVxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKi9cbmZ1bmN0aW9uIGNoZWNrX3NyY19pbl9kZXZfaHlkcmF0aW9uKGVsZW1lbnQsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcblx0aWYgKCFERVYpIHJldHVybjtcblx0aWYgKGF0dHJpYnV0ZSA9PT0gJ3NyY3NldCcgJiYgc3Jjc2V0X3VybF9lcXVhbChlbGVtZW50LCB2YWx1ZSkpIHJldHVybjtcblx0aWYgKHNyY191cmxfZXF1YWwoZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKSA/PyAnJywgdmFsdWUpKSByZXR1cm47XG5cblx0dy5oeWRyYXRpb25fYXR0cmlidXRlX2NoYW5nZWQoXG5cdFx0YXR0cmlidXRlLFxuXHRcdGVsZW1lbnQub3V0ZXJIVE1MLnJlcGxhY2UoZWxlbWVudC5pbm5lckhUTUwsIGVsZW1lbnQuaW5uZXJIVE1MICYmICcuLi4nKSxcblx0XHRTdHJpbmcodmFsdWUpXG5cdCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGVsZW1lbnRfc3JjXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gc3JjX3VybF9lcXVhbChlbGVtZW50X3NyYywgdXJsKSB7XG5cdGlmIChlbGVtZW50X3NyYyA9PT0gdXJsKSByZXR1cm4gdHJ1ZTtcblx0cmV0dXJuIG5ldyBVUkwoZWxlbWVudF9zcmMsIGRvY3VtZW50LmJhc2VVUkkpLmhyZWYgPT09IG5ldyBVUkwodXJsLCBkb2N1bWVudC5iYXNlVVJJKS5ocmVmO1xufVxuXG4vKiogQHBhcmFtIHtzdHJpbmd9IHNyY3NldCAqL1xuZnVuY3Rpb24gc3BsaXRfc3Jjc2V0KHNyY3NldCkge1xuXHRyZXR1cm4gc3Jjc2V0LnNwbGl0KCcsJykubWFwKChzcmMpID0+IHNyYy50cmltKCkuc3BsaXQoJyAnKS5maWx0ZXIoQm9vbGVhbikpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTFNvdXJjZUVsZW1lbnQgfCBIVE1MSW1hZ2VFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gc3Jjc2V0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gc3Jjc2V0X3VybF9lcXVhbChlbGVtZW50LCBzcmNzZXQpIHtcblx0dmFyIGVsZW1lbnRfdXJscyA9IHNwbGl0X3NyY3NldChlbGVtZW50LnNyY3NldCk7XG5cdHZhciB1cmxzID0gc3BsaXRfc3Jjc2V0KHNyY3NldCk7XG5cblx0cmV0dXJuIChcblx0XHR1cmxzLmxlbmd0aCA9PT0gZWxlbWVudF91cmxzLmxlbmd0aCAmJlxuXHRcdHVybHMuZXZlcnkoXG5cdFx0XHQoW3VybCwgd2lkdGhdLCBpKSA9PlxuXHRcdFx0XHR3aWR0aCA9PT0gZWxlbWVudF91cmxzW2ldWzFdICYmXG5cdFx0XHRcdC8vIFdlIG5lZWQgdG8gdGVzdCBib3RoIHdheXMgYmVjYXVzZSBWaXRlIHdpbGwgY3JlYXRlIGFuIGEgZnVsbCBVUkwgd2l0aFxuXHRcdFx0XHQvLyBgbmV3IFVSTChhc3NldCwgaW1wb3J0Lm1ldGEudXJsKS5ocmVmYCBmb3IgdGhlIGNsaWVudCB3aGVuIGBiYXNlOiAnLi8nYCwgYW5kIHRoZVxuXHRcdFx0XHQvLyByZWxhdGl2ZSBVUkxzIGluc2lkZSBzcmNzZXQgYXJlIG5vdCBhdXRvbWF0aWNhbGx5IHJlc29sdmVkIHRvIGFic29sdXRlIFVSTHMgYnlcblx0XHRcdFx0Ly8gYnJvd3NlcnMgKGluIGNvbnRyYXN0IHRvIGltZy5zcmMpLiBUaGlzIG1lYW5zIGJvdGggU1NSIGFuZCBET00gY29kZSBjb3VsZFxuXHRcdFx0XHQvLyBjb250YWluIHJlbGF0aXZlIG9yIGFic29sdXRlIFVSTHMuXG5cdFx0XHRcdChzcmNfdXJsX2VxdWFsKGVsZW1lbnRfdXJsc1tpXVswXSwgdXJsKSB8fCBzcmNfdXJsX2VxdWFsKHVybCwgZWxlbWVudF91cmxzW2ldWzBdKSlcblx0XHQpXG5cdCk7XG59XG4iLCJpbXBvcnQgeyBoeWRyYXRpbmcsIHJlc2V0LCBzZXRfaHlkcmF0ZV9ub2RlLCBzZXRfaHlkcmF0aW5nIH0gZnJvbSAnLi4vaHlkcmF0aW9uLmpzJztcbmltcG9ydCB7IGNyZWF0ZV9jb21tZW50LCBjcmVhdGVfZWxlbWVudCB9IGZyb20gJy4uL29wZXJhdGlvbnMuanMnO1xuaW1wb3J0IHsgY3JlYXRlX3RydXN0ZWRfaHRtbCB9IGZyb20gJy4uL3JlY29uY2lsZXIuanMnO1xuaW1wb3J0IHsgYXR0YWNoIH0gZnJvbSAnLi9hdHRhY2htZW50cy5qcyc7XG5cbi8qKiBAdHlwZSB7Ym9vbGVhbiB8IG51bGx9ICovXG5sZXQgc3VwcG9ydGVkID0gbnVsbDtcblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgcmljaCBIVE1MIGNvbnRlbnQgaW5zaWRlIGA8b3B0aW9uPmAgZWxlbWVudHMuXG4gKiBNb2Rlcm4gYnJvd3NlcnMgcHJlc2VydmUgSFRNTCBlbGVtZW50cyBpbnNpZGUgb3B0aW9ucywgd2hpbGUgb2xkZXIgYnJvd3NlcnNcbiAqIHN0cmlwIHRoZW0gZHVyaW5nIHBhcnNpbmcsIGxlYXZpbmcgb25seSB0ZXh0IGNvbnRlbnQuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNfc3VwcG9ydGVkKCkge1xuXHRpZiAoc3VwcG9ydGVkID09PSBudWxsKSB7XG5cdFx0dmFyIHNlbGVjdCA9IGNyZWF0ZV9lbGVtZW50KCdzZWxlY3QnKTtcblx0XHRzZWxlY3QuaW5uZXJIVE1MID0gY3JlYXRlX3RydXN0ZWRfaHRtbCgnPG9wdGlvbj48c3Bhbj50PC9zcGFuPjwvb3B0aW9uPicpO1xuXHRcdHN1cHBvcnRlZCA9IC8qKiBAdHlwZSB7RWxlbWVudH0gKi8gKHNlbGVjdC5maXJzdENoaWxkKT8uZmlyc3RDaGlsZD8ubm9kZVR5cGUgPT09IDE7XG5cdH1cblxuXHRyZXR1cm4gc3VwcG9ydGVkO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0geyhuZXdfZWxlbWVudDogSFRNTEVsZW1lbnQpID0+IHZvaWR9IHVwZGF0ZV9lbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3RlZGNvbnRlbnQoZWxlbWVudCwgdXBkYXRlX2VsZW1lbnQpIHtcblx0Ly8gaWYgaXQncyBub3Qgc3VwcG9ydGVkIG5vIG5lZWQgZm9yIHNwZWNpYWwgbG9naWNcblx0aWYgKCFpc19zdXBwb3J0ZWQoKSkgcmV0dXJuO1xuXG5cdC8vIHdlIHVzZSB0aGUgYXR0YWNoIGZ1bmN0aW9uIGRpcmVjdGx5IGp1c3QgdG8gbWFrZSBzdXJlIGlzIGV4ZWN1dGVkIHdoZW4gaXMgbW91bnRlZCB0byB0aGUgZG9tXG5cdGF0dGFjaChlbGVtZW50LCAoKSA9PiAoKSA9PiB7XG5cdFx0Y29uc3Qgc2VsZWN0ID0gZWxlbWVudC5jbG9zZXN0KCdzZWxlY3QnKTtcblx0XHRpZiAoIXNlbGVjdCkgcmV0dXJuO1xuXG5cdFx0Y29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoZW50cmllcykgPT4ge1xuXHRcdFx0dmFyIHNlbGVjdGVkID0gZmFsc2U7XG5cblx0XHRcdGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuXHRcdFx0XHRpZiAoZW50cnkudGFyZ2V0ID09PSBlbGVtZW50KSB7XG5cdFx0XHRcdFx0Ly8gdGhlIGA8c2VsZWN0ZWRjb250ZW50PmAgYWxyZWFkeSBjaGFuZ2VkLCBubyBuZWVkIHRvIHJlcGxhY2UgaXRcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBpZiB0aGUgY2hhbmdlcyBkb2Vzbid0IGluY2x1ZGUgdGhlIHNlbGVjdGVkIGA8b3B0aW9uPmAgd2UgZG9uJ3QgbmVlZCB0byBkbyBhbnl0aGluZ1xuXHRcdFx0XHRzZWxlY3RlZCB8fD0gISFlbnRyeS50YXJnZXQucGFyZW50RWxlbWVudD8uY2xvc2VzdCgnb3B0aW9uJyk/LnNlbGVjdGVkO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc2VsZWN0ZWQpIHtcblx0XHRcdFx0Ly8gcmVwbGFjZSB0aGUgYDxzZWxlY3RlZGNvbnRlbnQ+YCB3aXRoIGEgY2xvbmVcblx0XHRcdFx0ZWxlbWVudC5yZXBsYWNlV2l0aCgoZWxlbWVudCA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChlbGVtZW50LmNsb25lTm9kZSh0cnVlKSkpKTtcblx0XHRcdFx0dXBkYXRlX2VsZW1lbnQoZWxlbWVudCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRvYnNlcnZlci5vYnNlcnZlKHNlbGVjdCwge1xuXHRcdFx0Y2hpbGRMaXN0OiB0cnVlLFxuXHRcdFx0Y2hhcmFjdGVyRGF0YTogdHJ1ZSxcblx0XHRcdHN1YnRyZWU6IHRydWVcblx0XHR9KTtcblxuXHRcdHJldHVybiAoKSA9PiB7XG5cdFx0XHRvYnNlcnZlci5kaXNjb25uZWN0KCk7XG5cdFx0fTtcblx0fSk7XG59XG5cbi8qKlxuICogSGFuZGxlcyByaWNoIEhUTUwgY29udGVudCBpbnNpZGUgYDxvcHRpb24+YCwgYDxvcHRncm91cD5gLCBvciBgPHNlbGVjdD5gIGVsZW1lbnRzIHdpdGggYnJvd3Nlci1zcGVjaWZpYyBicmFuY2hpbmcuXG4gKiBNb2Rlcm4gYnJvd3NlcnMgcHJlc2VydmUgSFRNTCBpbnNpZGUgb3B0aW9ucywgd2hpbGUgb2xkZXIgYnJvd3NlcnMgc3RyaXAgaXQgdG8gdGV4dCBvbmx5LlxuICpcbiAqIEBwYXJhbSB7SFRNTE9wdGlvbkVsZW1lbnQgfCBIVE1MT3B0R3JvdXBFbGVtZW50IHwgSFRNTFNlbGVjdEVsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gcHJvY2Vzc1xuICogQHBhcmFtIHsoKSA9PiB2b2lkfSByaWNoX2ZuIEZ1bmN0aW9uIHRvIHByb2Nlc3MgcmljaCBIVE1MIGNvbnRlbnQgKG1vZGVybiBicm93c2VycylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGN1c3RvbWl6YWJsZV9zZWxlY3QoZWxlbWVudCwgcmljaF9mbikge1xuXHR2YXIgd2FzX2h5ZHJhdGluZyA9IGh5ZHJhdGluZztcblxuXHRpZiAoIWlzX3N1cHBvcnRlZCgpKSB7XG5cdFx0c2V0X2h5ZHJhdGluZyhmYWxzZSk7XG5cdFx0ZWxlbWVudC50ZXh0Q29udGVudCA9ICcnO1xuXHRcdGVsZW1lbnQuYXBwZW5kKGNyZWF0ZV9jb21tZW50KCcnKSk7XG5cdH1cblxuXHR0cnkge1xuXHRcdHJpY2hfZm4oKTtcblx0fSBmaW5hbGx5IHtcblx0XHRpZiAod2FzX2h5ZHJhdGluZykge1xuXHRcdFx0aWYgKGh5ZHJhdGluZykge1xuXHRcdFx0XHRyZXNldChlbGVtZW50KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNldF9oeWRyYXRpbmcodHJ1ZSk7XG5cdFx0XHRcdHNldF9oeWRyYXRlX25vZGUoZWxlbWVudCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgeyBsaXN0ZW4sIHdpdGhvdXRfcmVhY3RpdmVfY29udGV4dCB9IGZyb20gJy4vc2hhcmVkLmpzJztcblxuLyoqXG4gKiBAcGFyYW0geyhhY3RpdmVFbGVtZW50OiBFbGVtZW50IHwgbnVsbCkgPT4gdm9pZH0gdXBkYXRlXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRfYWN0aXZlX2VsZW1lbnQodXBkYXRlKSB7XG5cdGxpc3Rlbihkb2N1bWVudCwgWydmb2N1c2luJywgJ2ZvY3Vzb3V0J10sIChldmVudCkgPT4ge1xuXHRcdGlmIChldmVudCAmJiBldmVudC50eXBlID09PSAnZm9jdXNvdXQnICYmIC8qKiBAdHlwZSB7Rm9jdXNFdmVudH0gKi8gKGV2ZW50KS5yZWxhdGVkVGFyZ2V0KSB7XG5cdFx0XHQvLyBUaGUgdGVzdHMgc3RpbGwgcGFzcyBpZiB3ZSByZW1vdmUgdGhpcywgYmVjYXVzZSBvZiBKU0RPTSBsaW1pdGF0aW9ucywgYnV0IGl0IGlzIG5lY2Vzc2FyeVxuXHRcdFx0Ly8gdG8gYXZvaWQgdGVtcG9yYXJpbHkgcmVzZXR0aW5nIHRvIGBkb2N1bWVudC5ib2R5YFxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFJlbW92aW5nIHRoZSBmb2N1c2VkIGVsZW1lbnQgZmlyZXMgYGZvY3Vzb3V0YCB3aGlsZSBhbiBlZmZlY3QgaXMgcnVubmluZ1xuXHRcdHdpdGhvdXRfcmVhY3RpdmVfY29udGV4dCgoKSA9PiB1cGRhdGUoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkpO1xuXHR9KTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgQmF0Y2ggfSBmcm9tICcuLi8uLi8uLi9yZWFjdGl2aXR5L2JhdGNoLmpzJyAqL1xuaW1wb3J0IHsgREVWIH0gZnJvbSAnZXNtLWVudic7XG5pbXBvcnQgeyByZW5kZXJfZWZmZWN0LCB0ZWFyZG93biB9IGZyb20gJy4uLy4uLy4uL3JlYWN0aXZpdHkvZWZmZWN0cy5qcyc7XG5pbXBvcnQgeyBsaXN0ZW5fdG9fZXZlbnRfYW5kX3Jlc2V0X2V2ZW50IH0gZnJvbSAnLi9zaGFyZWQuanMnO1xuaW1wb3J0ICogYXMgZSBmcm9tICcuLi8uLi8uLi9lcnJvcnMuanMnO1xuaW1wb3J0IHsgaXMgfSBmcm9tICcuLi8uLi8uLi9wcm94eS5qcyc7XG5pbXBvcnQgeyBxdWV1ZV9taWNyb190YXNrIH0gZnJvbSAnLi4vLi4vdGFzay5qcyc7XG5pbXBvcnQgeyBoeWRyYXRpbmcgfSBmcm9tICcuLi8uLi9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgdGljaywgdW50cmFjayB9IGZyb20gJy4uLy4uLy4uL3J1bnRpbWUuanMnO1xuaW1wb3J0IHsgY3VycmVudF9iYXRjaCwgcHJldmlvdXNfYmF0Y2ggfSBmcm9tICcuLi8uLi8uLi9yZWFjdGl2aXR5L2JhdGNoLmpzJztcbmltcG9ydCB7IGFzeW5jX21vZGVfZmxhZyB9IGZyb20gJy4uLy4uLy4uLy4uL2ZsYWdzL2luZGV4LmpzJztcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGlucHV0XG4gKiBAcGFyYW0geygpID0+IHVua25vd259IGdldFxuICogQHBhcmFtIHsodmFsdWU6IHVua25vd24pID0+IHZvaWR9IHNldFxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kX3ZhbHVlKGlucHV0LCBnZXQsIHNldCA9IGdldCkge1xuXHR2YXIgYmF0Y2hlcyA9IG5ldyBXZWFrU2V0KCk7XG5cblx0bGlzdGVuX3RvX2V2ZW50X2FuZF9yZXNldF9ldmVudChpbnB1dCwgJ2lucHV0JywgYXN5bmMgKGlzX3Jlc2V0KSA9PiB7XG5cdFx0aWYgKERFViAmJiBpbnB1dC50eXBlID09PSAnY2hlY2tib3gnKSB7XG5cdFx0XHQvLyBUT0RPIHNob3VsZCB0aGlzIGhhcHBlbiBpbiBwcm9kIHRvbz9cblx0XHRcdGUuYmluZF9pbnZhbGlkX2NoZWNrYm94X3ZhbHVlKCk7XG5cdFx0fVxuXG5cdFx0LyoqIEB0eXBlIHthbnl9ICovXG5cdFx0dmFyIHZhbHVlID0gaXNfcmVzZXQgPyBpbnB1dC5kZWZhdWx0VmFsdWUgOiBpbnB1dC52YWx1ZTtcblx0XHR2YWx1ZSA9IGlzX251bWJlcmxpa2VfaW5wdXQoaW5wdXQpID8gdG9fbnVtYmVyKHZhbHVlKSA6IHZhbHVlO1xuXHRcdHNldCh2YWx1ZSk7XG5cblx0XHRpZiAoY3VycmVudF9iYXRjaCAhPT0gbnVsbCkge1xuXHRcdFx0YmF0Y2hlcy5hZGQoY3VycmVudF9iYXRjaCk7XG5cdFx0fVxuXG5cdFx0Ly8gQmVjYXVzZSBgeyNlYWNoIC4uLn1gIGJsb2NrcyB3b3JrIGJ5IHVwZGF0aW5nIHNvdXJjZXMgaW5zaWRlIHRoZSBmbHVzaCxcblx0XHQvLyB3ZSBuZWVkIHRvIHdhaXQgYSB0aWNrIGJlZm9yZSBjaGVja2luZyB0byBzZWUgaWYgd2Ugc2hvdWxkIGZvcmNpYmx5XG5cdFx0Ly8gdXBkYXRlIHRoZSBpbnB1dCBhbmQgcmVzZXQgdGhlIHNlbGVjdGlvbiBzdGF0ZVxuXHRcdGF3YWl0IHRpY2soKTtcblxuXHRcdC8vIFJlc3BlY3QgYW55IHZhbGlkYXRpb24gaW4gYWNjZXNzb3JzXG5cdFx0aWYgKHZhbHVlICE9PSAodmFsdWUgPSBnZXQoKSkpIHtcblx0XHRcdHZhciBzdGFydCA9IGlucHV0LnNlbGVjdGlvblN0YXJ0O1xuXHRcdFx0dmFyIGVuZCA9IGlucHV0LnNlbGVjdGlvbkVuZDtcblx0XHRcdHZhciBsZW5ndGggPSBpbnB1dC52YWx1ZS5sZW5ndGg7XG5cblx0XHRcdC8vIHRoZSB2YWx1ZSBpcyBjb2VyY2VkIG9uIGFzc2lnbm1lbnRcblx0XHRcdGlucHV0LnZhbHVlID0gdmFsdWUgPz8gJyc7XG5cblx0XHRcdC8vIFJlc3RvcmUgc2VsZWN0aW9uXG5cdFx0XHRpZiAoZW5kICE9PSBudWxsKSB7XG5cdFx0XHRcdHZhciBuZXdfbGVuZ3RoID0gaW5wdXQudmFsdWUubGVuZ3RoO1xuXHRcdFx0XHQvLyBJZiBjdXJzb3Igd2FzIGF0IGVuZCBhbmQgbmV3IGlucHV0IGlzIGxvbmdlciwgbW92ZSBjdXJzb3IgdG8gbmV3IGVuZFxuXHRcdFx0XHRpZiAoc3RhcnQgPT09IGVuZCAmJiBlbmQgPT09IGxlbmd0aCAmJiBuZXdfbGVuZ3RoID4gbGVuZ3RoKSB7XG5cdFx0XHRcdFx0aW5wdXQuc2VsZWN0aW9uU3RhcnQgPSBuZXdfbGVuZ3RoO1xuXHRcdFx0XHRcdGlucHV0LnNlbGVjdGlvbkVuZCA9IG5ld19sZW5ndGg7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aW5wdXQuc2VsZWN0aW9uU3RhcnQgPSBzdGFydDtcblx0XHRcdFx0XHRpbnB1dC5zZWxlY3Rpb25FbmQgPSBNYXRoLm1pbihlbmQsIG5ld19sZW5ndGgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxuXHRpZiAoXG5cdFx0Ly8gSWYgd2UgYXJlIGh5ZHJhdGluZyBhbmQgdGhlIHZhbHVlIGhhcyBzaW5jZSBjaGFuZ2VkLFxuXHRcdC8vIHRoZW4gdXNlIHRoZSB1cGRhdGVkIHZhbHVlIGZyb20gdGhlIGlucHV0IGluc3RlYWQuXG5cdFx0KGh5ZHJhdGluZyAmJiBpbnB1dC5kZWZhdWx0VmFsdWUgIT09IGlucHV0LnZhbHVlKSB8fFxuXHRcdC8vIElmIGRlZmF1bHRWYWx1ZSBpcyBzZXQsIHRoZW4gdmFsdWUgPT0gZGVmYXVsdFZhbHVlXG5cdFx0Ly8gVE9ETyBTdmVsdGUgNjogcmVtb3ZlIGlucHV0LnZhbHVlIGNoZWNrIGFuZCBzZXQgdG8gZW1wdHkgc3RyaW5nP1xuXHRcdCh1bnRyYWNrKGdldCkgPT0gbnVsbCAmJiBpbnB1dC52YWx1ZSlcblx0KSB7XG5cdFx0c2V0KGlzX251bWJlcmxpa2VfaW5wdXQoaW5wdXQpID8gdG9fbnVtYmVyKGlucHV0LnZhbHVlKSA6IGlucHV0LnZhbHVlKTtcblxuXHRcdGlmIChjdXJyZW50X2JhdGNoICE9PSBudWxsKSB7XG5cdFx0XHRiYXRjaGVzLmFkZChjdXJyZW50X2JhdGNoKTtcblx0XHR9XG5cdH1cblxuXHRyZW5kZXJfZWZmZWN0KCgpID0+IHtcblx0XHRpZiAoREVWICYmIGlucHV0LnR5cGUgPT09ICdjaGVja2JveCcpIHtcblx0XHRcdC8vIFRPRE8gc2hvdWxkIHRoaXMgaGFwcGVuIGluIHByb2QgdG9vP1xuXHRcdFx0ZS5iaW5kX2ludmFsaWRfY2hlY2tib3hfdmFsdWUoKTtcblx0XHR9XG5cblx0XHR2YXIgdmFsdWUgPSBnZXQoKTtcblxuXHRcdGlmIChpbnB1dCA9PT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xuXHRcdFx0Ly8gSW4gc3luYyBtb2RlIHJlbmRlciBlZmZlY3RzIGFyZSBleGVjdXRlZCBkdXJpbmcgdHJlZSB0cmF2ZXJzYWwgLT4gbmVlZHMgY3VycmVudF9iYXRjaFxuXHRcdFx0Ly8gSW4gYXN5bmMgbW9kZSByZW5kZXIgZWZmZWN0cyBhcmUgZmx1c2hlZCBvbmNlIGJhdGNoIHJlc29sdmVkLCBhdCB3aGljaCBwb2ludCBjdXJyZW50X2JhdGNoIGlzIG51bGwgLT4gbmVlZHMgcHJldmlvdXNfYmF0Y2hcblx0XHRcdHZhciBiYXRjaCA9IC8qKiBAdHlwZSB7QmF0Y2h9ICovIChhc3luY19tb2RlX2ZsYWcgPyBwcmV2aW91c19iYXRjaCA6IGN1cnJlbnRfYmF0Y2gpO1xuXG5cdFx0XHQvLyBOZXZlciByZXdyaXRlIHRoZSBjb250ZW50cyBvZiBhIGZvY3VzZWQgaW5wdXQuIFdlIGNhbiBnZXQgaGVyZSBpZiwgZm9yIGV4YW1wbGUsXG5cdFx0XHQvLyBhbiB1cGRhdGUgaXMgZGVmZXJyZWQgYmVjYXVzZSBvZiBhc3luYyB3b3JrIGRlcGVuZGluZyBvbiB0aGUgaW5wdXQ6XG5cdFx0XHQvL1xuXHRcdFx0Ly8gPGlucHV0IGJpbmQ6dmFsdWU9e3F1ZXJ5fT5cblx0XHRcdC8vIDxwPnthd2FpdCBmaW5kKHF1ZXJ5KX08L3A+XG5cdFx0XHRpZiAoYmF0Y2hlcy5oYXMoYmF0Y2gpKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoaXNfbnVtYmVybGlrZV9pbnB1dChpbnB1dCkgJiYgdmFsdWUgPT09IHRvX251bWJlcihpbnB1dC52YWx1ZSkpIHtcblx0XHRcdC8vIGhhbmRsZXMgMCB2cyAwMCBjYXNlIChzZWUgaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL3N2ZWx0ZS9pc3N1ZXMvOTk1OSlcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoaW5wdXQudHlwZSA9PT0gJ2RhdGUnICYmICF2YWx1ZSAmJiAhaW5wdXQudmFsdWUpIHtcblx0XHRcdC8vIEhhbmRsZXMgdGhlIGNhc2Ugd2hlcmUgYSB0ZW1wb3JhcmlseSBpbnZhbGlkIGRhdGUgaXMgc2V0ICh3aGlsZSB0eXBpbmcsIGZvciBleGFtcGxlIHdpdGggYSBsZWFkaW5nIDAgZm9yIHRoZSBkYXkpXG5cdFx0XHQvLyBhbmQgcHJldmVudHMgdGhpcyBzdGF0ZSBmcm9tIGNsZWFyaW5nIHRoZSBvdGhlciBwYXJ0cyBvZiB0aGUgZGF0ZSBpbnB1dCAoc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9zdmVsdGUvaXNzdWVzLzc4OTcpXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gZG9uJ3Qgc2V0IHRoZSB2YWx1ZSBvZiB0aGUgaW5wdXQgaWYgaXQncyB0aGUgc2FtZSB0byBhbGxvd1xuXHRcdC8vIG1pbmxlbmd0aCB0byB3b3JrIHByb3Blcmx5XG5cdFx0aWYgKHZhbHVlICE9PSBpbnB1dC52YWx1ZSkge1xuXHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvciB0aGUgdmFsdWUgaXMgY29lcmNlZCBvbiBhc3NpZ25tZW50XG5cdFx0XHRpbnB1dC52YWx1ZSA9IHZhbHVlID8/ICcnO1xuXHRcdH1cblx0fSk7XG59XG5cbi8qKiBAdHlwZSB7U2V0PEhUTUxJbnB1dEVsZW1lbnRbXT59ICovXG5jb25zdCBwZW5kaW5nID0gbmV3IFNldCgpO1xuXG4vKipcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudFtdfSBpbnB1dHNcbiAqIEBwYXJhbSB7bnVsbCB8IFtudW1iZXJdfSBncm91cF9pbmRleFxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBpbnB1dFxuICogQHBhcmFtIHsoKSA9PiB1bmtub3dufSBnZXRcbiAqIEBwYXJhbSB7KHZhbHVlOiB1bmtub3duKSA9PiB2b2lkfSBzZXRcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9ncm91cChpbnB1dHMsIGdyb3VwX2luZGV4LCBpbnB1dCwgZ2V0LCBzZXQgPSBnZXQpIHtcblx0dmFyIGlzX2NoZWNrYm94ID0gaW5wdXQuZ2V0QXR0cmlidXRlKCd0eXBlJykgPT09ICdjaGVja2JveCc7XG5cdHZhciBiaW5kaW5nX2dyb3VwID0gaW5wdXRzO1xuXG5cdC8vIG5lZWRzIHRvIGJlIGxldCBvciByZWxhdGVkIGNvZGUgaXNuJ3QgdHJlZXNoYWtlbiBvdXQgaWYgaXQncyBhbHdheXMgZmFsc2Vcblx0bGV0IGh5ZHJhdGlvbl9taXNtYXRjaCA9IGZhbHNlO1xuXG5cdGlmIChncm91cF9pbmRleCAhPT0gbnVsbCkge1xuXHRcdGZvciAodmFyIGluZGV4IG9mIGdyb3VwX2luZGV4KSB7XG5cdFx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0XHRiaW5kaW5nX2dyb3VwID0gYmluZGluZ19ncm91cFtpbmRleF0gPz89IFtdO1xuXHRcdH1cblx0fVxuXG5cdGJpbmRpbmdfZ3JvdXAucHVzaChpbnB1dCk7XG5cblx0bGlzdGVuX3RvX2V2ZW50X2FuZF9yZXNldF9ldmVudChcblx0XHRpbnB1dCxcblx0XHQnY2hhbmdlJyxcblx0XHQoKSA9PiB7XG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHR2YXIgdmFsdWUgPSBpbnB1dC5fX3ZhbHVlO1xuXG5cdFx0XHRpZiAoaXNfY2hlY2tib3gpIHtcblx0XHRcdFx0dmFsdWUgPSBnZXRfYmluZGluZ19ncm91cF92YWx1ZShiaW5kaW5nX2dyb3VwLCB2YWx1ZSwgaW5wdXQuY2hlY2tlZCk7XG5cdFx0XHR9XG5cblx0XHRcdHNldCh2YWx1ZSk7XG5cdFx0fSxcblx0XHQvLyBUT0RPIGJldHRlciBkZWZhdWx0IHZhbHVlIGhhbmRsaW5nXG5cdFx0KCkgPT4gc2V0KGlzX2NoZWNrYm94ID8gW10gOiBudWxsKVxuXHQpO1xuXG5cdHJlbmRlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdHZhciB2YWx1ZSA9IGdldCgpO1xuXG5cdFx0Ly8gSWYgd2UgYXJlIGh5ZHJhdGluZyBhbmQgdGhlIHZhbHVlIGhhcyBzaW5jZSBjaGFuZ2VkLCB0aGVuIHVzZSB0aGUgdXBkYXRlIHZhbHVlXG5cdFx0Ly8gZnJvbSB0aGUgaW5wdXQgaW5zdGVhZC5cblx0XHRpZiAoaHlkcmF0aW5nICYmIGlucHV0LmRlZmF1bHRDaGVja2VkICE9PSBpbnB1dC5jaGVja2VkKSB7XG5cdFx0XHRoeWRyYXRpb25fbWlzbWF0Y2ggPSB0cnVlO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChpc19jaGVja2JveCkge1xuXHRcdFx0dmFsdWUgPSB2YWx1ZSB8fCBbXTtcblx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdGlucHV0LmNoZWNrZWQgPSB2YWx1ZS5pbmNsdWRlcyhpbnB1dC5fX3ZhbHVlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0aW5wdXQuY2hlY2tlZCA9IGlzKGlucHV0Ll9fdmFsdWUsIHZhbHVlKTtcblx0XHR9XG5cdH0pO1xuXG5cdHRlYXJkb3duKCgpID0+IHtcblx0XHR2YXIgaW5kZXggPSBiaW5kaW5nX2dyb3VwLmluZGV4T2YoaW5wdXQpO1xuXG5cdFx0aWYgKGluZGV4ICE9PSAtMSkge1xuXHRcdFx0YmluZGluZ19ncm91cC5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdH1cblx0fSk7XG5cblx0aWYgKCFwZW5kaW5nLmhhcyhiaW5kaW5nX2dyb3VwKSkge1xuXHRcdHBlbmRpbmcuYWRkKGJpbmRpbmdfZ3JvdXApO1xuXG5cdFx0cXVldWVfbWljcm9fdGFzaygoKSA9PiB7XG5cdFx0XHQvLyBuZWNlc3NhcnkgdG8gbWFpbnRhaW4gYmluZGluZyBncm91cCBvcmRlciBpbiBhbGwgaW5zZXJ0aW9uIHNjZW5hcmlvc1xuXHRcdFx0YmluZGluZ19ncm91cC5zb3J0KChhLCBiKSA9PiAoYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihiKSA9PT0gNCA/IC0xIDogMSkpO1xuXHRcdFx0cGVuZGluZy5kZWxldGUoYmluZGluZ19ncm91cCk7XG5cdFx0fSk7XG5cdH1cblxuXHRxdWV1ZV9taWNyb190YXNrKCgpID0+IHtcblx0XHRpZiAoaHlkcmF0aW9uX21pc21hdGNoKSB7XG5cdFx0XHR2YXIgdmFsdWU7XG5cblx0XHRcdGlmIChpc19jaGVja2JveCkge1xuXHRcdFx0XHR2YWx1ZSA9IGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlKGJpbmRpbmdfZ3JvdXAsIHZhbHVlLCBpbnB1dC5jaGVja2VkKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhciBoeWRyYXRpb25faW5wdXQgPSBiaW5kaW5nX2dyb3VwLmZpbmQoKGlucHV0KSA9PiBpbnB1dC5jaGVja2VkKTtcblx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHR2YWx1ZSA9IGh5ZHJhdGlvbl9pbnB1dD8uX192YWx1ZTtcblx0XHRcdH1cblxuXHRcdFx0c2V0KHZhbHVlKTtcblx0XHR9XG5cdH0pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gaW5wdXRcbiAqIEBwYXJhbSB7KCkgPT4gdW5rbm93bn0gZ2V0XG4gKiBAcGFyYW0geyh2YWx1ZTogdW5rbm93bikgPT4gdm9pZH0gc2V0XG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRfY2hlY2tlZChpbnB1dCwgZ2V0LCBzZXQgPSBnZXQpIHtcblx0bGlzdGVuX3RvX2V2ZW50X2FuZF9yZXNldF9ldmVudChpbnB1dCwgJ2NoYW5nZScsIChpc19yZXNldCkgPT4ge1xuXHRcdHZhciB2YWx1ZSA9IGlzX3Jlc2V0ID8gaW5wdXQuZGVmYXVsdENoZWNrZWQgOiBpbnB1dC5jaGVja2VkO1xuXHRcdHNldCh2YWx1ZSk7XG5cdH0pO1xuXG5cdGlmIChcblx0XHQvLyBJZiB3ZSBhcmUgaHlkcmF0aW5nIGFuZCB0aGUgdmFsdWUgaGFzIHNpbmNlIGNoYW5nZWQsXG5cdFx0Ly8gdGhlbiB1c2UgdGhlIHVwZGF0ZSB2YWx1ZSBmcm9tIHRoZSBpbnB1dCBpbnN0ZWFkLlxuXHRcdChoeWRyYXRpbmcgJiYgaW5wdXQuZGVmYXVsdENoZWNrZWQgIT09IGlucHV0LmNoZWNrZWQpIHx8XG5cdFx0Ly8gSWYgZGVmYXVsdENoZWNrZWQgaXMgc2V0LCB0aGVuIGNoZWNrZWQgPT0gZGVmYXVsdENoZWNrZWRcblx0XHR1bnRyYWNrKGdldCkgPT0gbnVsbFxuXHQpIHtcblx0XHRzZXQoaW5wdXQuY2hlY2tlZCk7XG5cdH1cblxuXHRyZW5kZXJfZWZmZWN0KCgpID0+IHtcblx0XHR2YXIgdmFsdWUgPSBnZXQoKTtcblx0XHRpbnB1dC5jaGVja2VkID0gQm9vbGVhbih2YWx1ZSk7XG5cdH0pO1xufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge0FycmF5PEhUTUxJbnB1dEVsZW1lbnQ+fSBncm91cFxuICogQHBhcmFtIHtWfSBfX3ZhbHVlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNoZWNrZWRcbiAqIEByZXR1cm5zIHtWW119XG4gKi9cbmZ1bmN0aW9uIGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlKGdyb3VwLCBfX3ZhbHVlLCBjaGVja2VkKSB7XG5cdC8qKiBAdHlwZSB7U2V0PFY+fSAqL1xuXHR2YXIgdmFsdWUgPSBuZXcgU2V0KCk7XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBncm91cC5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGlmIChncm91cFtpXS5jaGVja2VkKSB7XG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHR2YWx1ZS5hZGQoZ3JvdXBbaV0uX192YWx1ZSk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFjaGVja2VkKSB7XG5cdFx0dmFsdWUuZGVsZXRlKF9fdmFsdWUpO1xuXHR9XG5cblx0cmV0dXJuIEFycmF5LmZyb20odmFsdWUpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gaXNfbnVtYmVybGlrZV9pbnB1dChpbnB1dCkge1xuXHR2YXIgdHlwZSA9IGlucHV0LnR5cGU7XG5cdHJldHVybiB0eXBlID09PSAnbnVtYmVyJyB8fCB0eXBlID09PSAncmFuZ2UnO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICovXG5mdW5jdGlvbiB0b19udW1iZXIodmFsdWUpIHtcblx0cmV0dXJuIHZhbHVlID09PSAnJyA/IG51bGwgOiArdmFsdWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBpbnB1dFxuICogQHBhcmFtIHsoKSA9PiBGaWxlTGlzdCB8IG51bGx9IGdldFxuICogQHBhcmFtIHsodmFsdWU6IEZpbGVMaXN0IHwgbnVsbCkgPT4gdm9pZH0gc2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kX2ZpbGVzKGlucHV0LCBnZXQsIHNldCA9IGdldCkge1xuXHRsaXN0ZW5fdG9fZXZlbnRfYW5kX3Jlc2V0X2V2ZW50KGlucHV0LCAnY2hhbmdlJywgKCkgPT4ge1xuXHRcdHNldChpbnB1dC5maWxlcyk7XG5cdH0pO1xuXG5cdGlmIChcblx0XHQvLyBJZiB3ZSBhcmUgaHlkcmF0aW5nIGFuZCB0aGUgdmFsdWUgaGFzIHNpbmNlIGNoYW5nZWQsXG5cdFx0Ly8gdGhlbiB1c2UgdGhlIHVwZGF0ZWQgdmFsdWUgZnJvbSB0aGUgaW5wdXQgaW5zdGVhZC5cblx0XHRoeWRyYXRpbmcgJiZcblx0XHRpbnB1dC5maWxlc1xuXHQpIHtcblx0XHRzZXQoaW5wdXQuZmlsZXMpO1xuXHR9XG5cblx0cmVuZGVyX2VmZmVjdCgoKSA9PiB7XG5cdFx0aW5wdXQuZmlsZXMgPSBnZXQoKTtcblx0fSk7XG59XG4iLCJpbXBvcnQgeyByZW5kZXJfZWZmZWN0LCBlZmZlY3QsIHRlYXJkb3duIH0gZnJvbSAnLi4vLi4vLi4vcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcbmltcG9ydCB7IGxpc3RlbiB9IGZyb20gJy4vc2hhcmVkLmpzJztcblxuLyoqIEBwYXJhbSB7VGltZVJhbmdlc30gcmFuZ2VzICovXG5mdW5jdGlvbiB0aW1lX3Jhbmdlc190b19hcnJheShyYW5nZXMpIHtcblx0dmFyIGFycmF5ID0gW107XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRhcnJheS5wdXNoKHsgc3RhcnQ6IHJhbmdlcy5zdGFydChpKSwgZW5kOiByYW5nZXMuZW5kKGkpIH0pO1xuXHR9XG5cblx0cmV0dXJuIGFycmF5O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTFZpZGVvRWxlbWVudCB8IEhUTUxBdWRpb0VsZW1lbnR9IG1lZGlhXG4gKiBAcGFyYW0geygpID0+IG51bWJlciB8IHVuZGVmaW5lZH0gZ2V0XG4gKiBAcGFyYW0geyh2YWx1ZTogbnVtYmVyKSA9PiB2b2lkfSBzZXRcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9jdXJyZW50X3RpbWUobWVkaWEsIGdldCwgc2V0ID0gZ2V0KSB7XG5cdC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuXHR2YXIgcmFmX2lkO1xuXHQvKiogQHR5cGUge251bWJlcn0gKi9cblx0dmFyIHZhbHVlO1xuXG5cdC8vIElkZWFsbHksIGxpc3RlbmluZyB0byB0aW1ldXBkYXRlIHdvdWxkIGJlIGVub3VnaCwgYnV0IGl0IGZpcmVzIHRvbyBpbmZyZXF1ZW50bHkgZm9yIHRoZSBjdXJyZW50VGltZVxuXHQvLyBiaW5kaW5nLCB3aGljaCBpcyB3aHkgd2UgdXNlIGEgcmFmIGxvb3AsIHRvby4gV2UgYWRkaXRpb25hbGx5IHN0aWxsIGxpc3RlbiB0byB0aW1ldXBkYXRlIGJlY2F1c2Vcblx0Ly8gdGhlIHVzZXIgY291bGQgYmUgc2NydWJiaW5nIHRocm91Z2ggdGhlIHZpZGVvIHVzaW5nIHRoZSBuYXRpdmUgY29udHJvbHMgd2hlbiB0aGUgbWVkaWEgaXMgcGF1c2VkLlxuXHR2YXIgY2FsbGJhY2sgPSAoKSA9PiB7XG5cdFx0Y2FuY2VsQW5pbWF0aW9uRnJhbWUocmFmX2lkKTtcblxuXHRcdGlmICghbWVkaWEucGF1c2VkKSB7XG5cdFx0XHRyYWZfaWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spO1xuXHRcdH1cblxuXHRcdHZhciBuZXh0X3ZhbHVlID0gbWVkaWEuY3VycmVudFRpbWU7XG5cdFx0aWYgKHZhbHVlICE9PSBuZXh0X3ZhbHVlKSB7XG5cdFx0XHRzZXQoKHZhbHVlID0gbmV4dF92YWx1ZSkpO1xuXHRcdH1cblx0fTtcblxuXHRyYWZfaWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spO1xuXHRtZWRpYS5hZGRFdmVudExpc3RlbmVyKCd0aW1ldXBkYXRlJywgY2FsbGJhY2spO1xuXG5cdHJlbmRlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdHZhciBuZXh0X3ZhbHVlID0gTnVtYmVyKGdldCgpKTtcblxuXHRcdGlmICh2YWx1ZSAhPT0gbmV4dF92YWx1ZSAmJiAhaXNOYU4oLyoqIEB0eXBlIHthbnl9ICovIChuZXh0X3ZhbHVlKSkpIHtcblx0XHRcdG1lZGlhLmN1cnJlbnRUaW1lID0gdmFsdWUgPSBuZXh0X3ZhbHVlO1xuXHRcdH1cblx0fSk7XG5cblx0dGVhcmRvd24oKCkgPT4ge1xuXHRcdGNhbmNlbEFuaW1hdGlvbkZyYW1lKHJhZl9pZCk7XG5cdFx0bWVkaWEucmVtb3ZlRXZlbnRMaXN0ZW5lcigndGltZXVwZGF0ZScsIGNhbGxiYWNrKTtcblx0fSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MVmlkZW9FbGVtZW50IHwgSFRNTEF1ZGlvRWxlbWVudH0gbWVkaWFcbiAqIEBwYXJhbSB7KGFycmF5OiBBcnJheTx7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyIH0+KSA9PiB2b2lkfSBzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRfYnVmZmVyZWQobWVkaWEsIHNldCkge1xuXHQvKiogQHR5cGUge3sgc3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXI7IH1bXX0gKi9cblx0dmFyIGN1cnJlbnQ7XG5cblx0Ly8gYGJ1ZmZlcmVkYCBjYW4gdXBkYXRlIHdpdGhvdXQgZW1pdHRpbmcgYW55IGV2ZW50LCBzbyB3ZSBjaGVjayBpdCBvbiB2YXJpb3VzIGV2ZW50cy5cblx0Ly8gQnkgc3BlY3MsIGBidWZmZXJlZGAgYWx3YXlzIHJldHVybnMgYSBuZXcgb2JqZWN0LCBzbyB3ZSBoYXZlIHRvIGNvbXBhcmUgZGVlcGx5LlxuXHRsaXN0ZW4obWVkaWEsIFsnbG9hZGVkbWV0YWRhdGEnLCAncHJvZ3Jlc3MnLCAndGltZXVwZGF0ZScsICdzZWVraW5nJ10sICgpID0+IHtcblx0XHR2YXIgcmFuZ2VzID0gbWVkaWEuYnVmZmVyZWQ7XG5cblx0XHRpZiAoXG5cdFx0XHQhY3VycmVudCB8fFxuXHRcdFx0Y3VycmVudC5sZW5ndGggIT09IHJhbmdlcy5sZW5ndGggfHxcblx0XHRcdGN1cnJlbnQuc29tZSgocmFuZ2UsIGkpID0+IHJhbmdlcy5zdGFydChpKSAhPT0gcmFuZ2Uuc3RhcnQgfHwgcmFuZ2VzLmVuZChpKSAhPT0gcmFuZ2UuZW5kKVxuXHRcdCkge1xuXHRcdFx0Y3VycmVudCA9IHRpbWVfcmFuZ2VzX3RvX2FycmF5KHJhbmdlcyk7XG5cdFx0XHRzZXQoY3VycmVudCk7XG5cdFx0fVxuXHR9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxWaWRlb0VsZW1lbnQgfCBIVE1MQXVkaW9FbGVtZW50fSBtZWRpYVxuICogQHBhcmFtIHsoYXJyYXk6IEFycmF5PHsgc3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXIgfT4pID0+IHZvaWR9IHNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9zZWVrYWJsZShtZWRpYSwgc2V0KSB7XG5cdGxpc3RlbihtZWRpYSwgWydsb2FkZWRtZXRhZGF0YSddLCAoKSA9PiBzZXQodGltZV9yYW5nZXNfdG9fYXJyYXkobWVkaWEuc2Vla2FibGUpKSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MVmlkZW9FbGVtZW50IHwgSFRNTEF1ZGlvRWxlbWVudH0gbWVkaWFcbiAqIEBwYXJhbSB7KGFycmF5OiBBcnJheTx7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyIH0+KSA9PiB2b2lkfSBzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRfcGxheWVkKG1lZGlhLCBzZXQpIHtcblx0bGlzdGVuKG1lZGlhLCBbJ3RpbWV1cGRhdGUnXSwgKCkgPT4gc2V0KHRpbWVfcmFuZ2VzX3RvX2FycmF5KG1lZGlhLnBsYXllZCkpKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxWaWRlb0VsZW1lbnQgfCBIVE1MQXVkaW9FbGVtZW50fSBtZWRpYVxuICogQHBhcmFtIHsoc2Vla2luZzogYm9vbGVhbikgPT4gdm9pZH0gc2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kX3NlZWtpbmcobWVkaWEsIHNldCkge1xuXHRsaXN0ZW4obWVkaWEsIFsnc2Vla2luZycsICdzZWVrZWQnXSwgKCkgPT4gc2V0KG1lZGlhLnNlZWtpbmcpKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxWaWRlb0VsZW1lbnQgfCBIVE1MQXVkaW9FbGVtZW50fSBtZWRpYVxuICogQHBhcmFtIHsoc2Vla2luZzogYm9vbGVhbikgPT4gdm9pZH0gc2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kX2VuZGVkKG1lZGlhLCBzZXQpIHtcblx0bGlzdGVuKG1lZGlhLCBbJ3RpbWV1cGRhdGUnLCAnZW5kZWQnXSwgKCkgPT4gc2V0KG1lZGlhLmVuZGVkKSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MVmlkZW9FbGVtZW50IHwgSFRNTEF1ZGlvRWxlbWVudH0gbWVkaWFcbiAqIEBwYXJhbSB7KHJlYWR5X3N0YXRlOiBudW1iZXIpID0+IHZvaWR9IHNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9yZWFkeV9zdGF0ZShtZWRpYSwgc2V0KSB7XG5cdGxpc3Rlbihcblx0XHRtZWRpYSxcblx0XHRbJ2xvYWRlZG1ldGFkYXRhJywgJ2xvYWRlZGRhdGEnLCAnY2FucGxheScsICdjYW5wbGF5dGhyb3VnaCcsICdwbGF5aW5nJywgJ3dhaXRpbmcnLCAnZW1wdGllZCddLFxuXHRcdCgpID0+IHNldChtZWRpYS5yZWFkeVN0YXRlKVxuXHQpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTFZpZGVvRWxlbWVudCB8IEhUTUxBdWRpb0VsZW1lbnR9IG1lZGlhXG4gKiBAcGFyYW0geygpID0+IG51bWJlciB8IHVuZGVmaW5lZH0gZ2V0XG4gKiBAcGFyYW0geyhwbGF5YmFja19yYXRlOiBudW1iZXIpID0+IHZvaWR9IHNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9wbGF5YmFja19yYXRlKG1lZGlhLCBnZXQsIHNldCA9IGdldCkge1xuXHQvLyBOZWVkcyB0byBoYXBwZW4gYWZ0ZXIgZWxlbWVudCBpcyBpbnNlcnRlZCBpbnRvIHRoZSBkb20gKHdoaWNoIGlzIGd1YXJhbnRlZWQgYnkgdXNpbmcgZWZmZWN0KSxcblx0Ly8gZWxzZSBwbGF5YmFjayB3aWxsIGJlIHNldCBiYWNrIHRvIDEgYnkgdGhlIGJyb3dzZXJcblx0ZWZmZWN0KCgpID0+IHtcblx0XHR2YXIgdmFsdWUgPSBOdW1iZXIoZ2V0KCkpO1xuXG5cdFx0aWYgKHZhbHVlICE9PSBtZWRpYS5wbGF5YmFja1JhdGUgJiYgIWlzTmFOKHZhbHVlKSkge1xuXHRcdFx0bWVkaWEucGxheWJhY2tSYXRlID0gdmFsdWU7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBTdGFydCBsaXN0ZW5pbmcgdG8gcmF0ZWNoYW5nZSBldmVudHMgYWZ0ZXIgdGhlIGVsZW1lbnQgaXMgaW5zZXJ0ZWQgaW50byB0aGUgZG9tLFxuXHQvLyBlbHNlIHBsYXliYWNrIHdpbGwgYmUgc2V0IHRvIDEgYnkgdGhlIGJyb3dzZXJcblx0ZWZmZWN0KCgpID0+IHtcblx0XHRsaXN0ZW4obWVkaWEsIFsncmF0ZWNoYW5nZSddLCAoKSA9PiB7XG5cdFx0XHRzZXQobWVkaWEucGxheWJhY2tSYXRlKTtcblx0XHR9KTtcblx0fSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MVmlkZW9FbGVtZW50IHwgSFRNTEF1ZGlvRWxlbWVudH0gbWVkaWFcbiAqIEBwYXJhbSB7KCkgPT4gYm9vbGVhbiB8IHVuZGVmaW5lZH0gZ2V0XG4gKiBAcGFyYW0geyhwYXVzZWQ6IGJvb2xlYW4pID0+IHZvaWR9IHNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9wYXVzZWQobWVkaWEsIGdldCwgc2V0ID0gZ2V0KSB7XG5cdHZhciBwYXVzZWQgPSBnZXQoKTtcblxuXHR2YXIgdXBkYXRlID0gKCkgPT4ge1xuXHRcdGlmIChwYXVzZWQgIT09IG1lZGlhLnBhdXNlZCkge1xuXHRcdFx0c2V0KChwYXVzZWQgPSBtZWRpYS5wYXVzZWQpKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gSWYgc29tZW9uZSBzd2l0Y2hlcyB0aGUgc3JjIHdoaWxlIG1lZGlhIGlzIHBsYXlpbmcsIHRoZSBwbGF5ZXIgd2lsbCBwYXVzZS5cblx0Ly8gTGlzdGVuIHRvIHRoZSBjYW5wbGF5IGV2ZW50IHRvIGdldCBub3RpZmllZCBvZiB0aGlzIHNpdHVhdGlvbi5cblx0bGlzdGVuKG1lZGlhLCBbJ3BsYXknLCAncGF1c2UnLCAnY2FucGxheSddLCB1cGRhdGUsIHBhdXNlZCA9PSBudWxsKTtcblxuXHQvLyBOZWVkcyB0byBiZSBhbiBlZmZlY3QgdG8gZW5zdXJlIG1lZGlhIGVsZW1lbnQgaXMgbW91bnRlZDogZWxzZSwgaWYgcGF1c2VkIGlzIGBmYWxzZWAgKGkuZS4gc2hvdWxkIHBsYXkgcmlnaHQgYXdheSlcblx0Ly8gYSBcIlRoZSBwbGF5KCkgcmVxdWVzdCB3YXMgaW50ZXJydXB0ZWQgYnkgYSBuZXcgbG9hZCByZXF1ZXN0XCIgZXJyb3Igd291bGQgYmUgdGhyb3duIGJlY2F1c2UgdGhlIHJlc291cmNlIGlzbid0IGxvYWRlZCB5ZXQuXG5cdGVmZmVjdCgoKSA9PiB7XG5cdFx0aWYgKChwYXVzZWQgPSAhIWdldCgpKSAhPT0gbWVkaWEucGF1c2VkKSB7XG5cdFx0XHRpZiAocGF1c2VkKSB7XG5cdFx0XHRcdG1lZGlhLnBhdXNlKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtZWRpYS5wbGF5KCkuY2F0Y2goKGVycm9yKSA9PiB7XG5cdFx0XHRcdFx0c2V0KChwYXVzZWQgPSB0cnVlKSk7XG5cdFx0XHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MVmlkZW9FbGVtZW50IHwgSFRNTEF1ZGlvRWxlbWVudH0gbWVkaWFcbiAqIEBwYXJhbSB7KCkgPT4gbnVtYmVyIHwgdW5kZWZpbmVkfSBnZXRcbiAqIEBwYXJhbSB7KHZvbHVtZTogbnVtYmVyKSA9PiB2b2lkfSBzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRfdm9sdW1lKG1lZGlhLCBnZXQsIHNldCA9IGdldCkge1xuXHR2YXIgY2FsbGJhY2sgPSAoKSA9PiB7XG5cdFx0c2V0KG1lZGlhLnZvbHVtZSk7XG5cdH07XG5cblx0aWYgKGdldCgpID09IG51bGwpIHtcblx0XHRjYWxsYmFjaygpO1xuXHR9XG5cblx0bGlzdGVuKG1lZGlhLCBbJ3ZvbHVtZWNoYW5nZSddLCBjYWxsYmFjaywgZmFsc2UpO1xuXG5cdHJlbmRlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdHZhciB2YWx1ZSA9IE51bWJlcihnZXQoKSk7XG5cblx0XHRpZiAodmFsdWUgIT09IG1lZGlhLnZvbHVtZSAmJiAhaXNOYU4odmFsdWUpKSB7XG5cdFx0XHRtZWRpYS52b2x1bWUgPSB2YWx1ZTtcblx0XHR9XG5cdH0pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTFZpZGVvRWxlbWVudCB8IEhUTUxBdWRpb0VsZW1lbnR9IG1lZGlhXG4gKiBAcGFyYW0geygpID0+IGJvb2xlYW4gfCB1bmRlZmluZWR9IGdldFxuICogQHBhcmFtIHsobXV0ZWQ6IGJvb2xlYW4pID0+IHZvaWR9IHNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9tdXRlZChtZWRpYSwgZ2V0LCBzZXQgPSBnZXQpIHtcblx0dmFyIGNhbGxiYWNrID0gKCkgPT4ge1xuXHRcdHNldChtZWRpYS5tdXRlZCk7XG5cdH07XG5cblx0aWYgKGdldCgpID09IG51bGwpIHtcblx0XHRjYWxsYmFjaygpO1xuXHR9XG5cblx0bGlzdGVuKG1lZGlhLCBbJ3ZvbHVtZWNoYW5nZSddLCBjYWxsYmFjaywgZmFsc2UpO1xuXG5cdHJlbmRlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdHZhciB2YWx1ZSA9ICEhZ2V0KCk7XG5cblx0XHRpZiAobWVkaWEubXV0ZWQgIT09IHZhbHVlKSBtZWRpYS5tdXRlZCA9IHZhbHVlO1xuXHR9KTtcbn1cbiIsImltcG9ydCB7IGxpc3RlbiB9IGZyb20gJy4vc2hhcmVkLmpzJztcblxuLyoqXG4gKiBAcGFyYW0geyhvbmxpbmU6IGJvb2xlYW4pID0+IHZvaWR9IHVwZGF0ZVxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kX29ubGluZSh1cGRhdGUpIHtcblx0bGlzdGVuKHdpbmRvdywgWydvbmxpbmUnLCAnb2ZmbGluZSddLCAoKSA9PiB7XG5cdFx0dXBkYXRlKG5hdmlnYXRvci5vbkxpbmUpO1xuXHR9KTtcbn1cbiIsImltcG9ydCB7IHRlYXJkb3duIH0gZnJvbSAnLi4vLi4vLi4vcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcbmltcG9ydCB7IGdldF9kZXNjcmlwdG9yIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzLmpzJztcblxuLyoqXG4gKiBNYWtlcyBhbiBgZXhwb3J0YGVkIChub24tcHJvcCkgdmFyaWFibGUgYXZhaWxhYmxlIG9uIHRoZSBgJCRwcm9wc2Agb2JqZWN0XG4gKiBzbyB0aGF0IGNvbnN1bWVycyBjYW4gZG8gYGJpbmQ6eGAgb24gdGhlIGNvbXBvbmVudC5cbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBwcm9wc1xuICogQHBhcmFtIHtzdHJpbmd9IHByb3BcbiAqIEBwYXJhbSB7Vn0gdmFsdWVcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9wcm9wKHByb3BzLCBwcm9wLCB2YWx1ZSkge1xuXHR2YXIgZGVzYyA9IGdldF9kZXNjcmlwdG9yKHByb3BzLCBwcm9wKTtcblxuXHRpZiAoZGVzYyAmJiBkZXNjLnNldCkge1xuXHRcdHByb3BzW3Byb3BdID0gdmFsdWU7XG5cdFx0dGVhcmRvd24oKCkgPT4ge1xuXHRcdFx0cHJvcHNbcHJvcF0gPSBudWxsO1xuXHRcdH0pO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBlZmZlY3QsIHRlYXJkb3duIH0gZnJvbSAnLi4vLi4vLi4vcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcbmltcG9ydCB7IHVudHJhY2sgfSBmcm9tICcuLi8uLi8uLi9ydW50aW1lLmpzJztcblxuLyoqXG4gKiBXZSBjcmVhdGUgb25lIGxpc3RlbmVyIGZvciBhbGwgZWxlbWVudHNcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZ3JvdXBzLmdvb2dsZS5jb20vYS9jaHJvbWl1bS5vcmcvZy9ibGluay1kZXYvYy96Nmllbk9OVWI1QS9tL0Y1LVZjVVp0QkFBSiBFeHBsYW5hdGlvbn1cbiAqL1xuY2xhc3MgUmVzaXplT2JzZXJ2ZXJTaW5nbGV0b24ge1xuXHQvKiogKi9cblx0I2xpc3RlbmVycyA9IG5ldyBXZWFrTWFwKCk7XG5cblx0LyoqIEB0eXBlIHtSZXNpemVPYnNlcnZlciB8IHVuZGVmaW5lZH0gKi9cblx0I29ic2VydmVyO1xuXG5cdC8qKiBAdHlwZSB7UmVzaXplT2JzZXJ2ZXJPcHRpb25zfSAqL1xuXHQjb3B0aW9ucztcblxuXHQvKiogQHN0YXRpYyAqL1xuXHRzdGF0aWMgZW50cmllcyA9IG5ldyBXZWFrTWFwKCk7XG5cblx0LyoqIEBwYXJhbSB7UmVzaXplT2JzZXJ2ZXJPcHRpb25zfSBvcHRpb25zICovXG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcblx0XHR0aGlzLiNvcHRpb25zID0gb3B0aW9ucztcblx0fVxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnRcblx0ICogQHBhcmFtIHsoZW50cnk6IFJlc2l6ZU9ic2VydmVyRW50cnkpID0+IGFueX0gbGlzdGVuZXJcblx0ICovXG5cdG9ic2VydmUoZWxlbWVudCwgbGlzdGVuZXIpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy4jbGlzdGVuZXJzLmdldChlbGVtZW50KSB8fCBuZXcgU2V0KCk7XG5cdFx0bGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG5cblx0XHR0aGlzLiNsaXN0ZW5lcnMuc2V0KGVsZW1lbnQsIGxpc3RlbmVycyk7XG5cdFx0dGhpcy4jZ2V0T2JzZXJ2ZXIoKS5vYnNlcnZlKGVsZW1lbnQsIHRoaXMuI29wdGlvbnMpO1xuXG5cdFx0cmV0dXJuICgpID0+IHtcblx0XHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLiNsaXN0ZW5lcnMuZ2V0KGVsZW1lbnQpO1xuXHRcdFx0bGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG5cblx0XHRcdGlmIChsaXN0ZW5lcnMuc2l6ZSA9PT0gMCkge1xuXHRcdFx0XHR0aGlzLiNsaXN0ZW5lcnMuZGVsZXRlKGVsZW1lbnQpO1xuXHRcdFx0XHQvKiogQHR5cGUge1Jlc2l6ZU9ic2VydmVyfSAqLyAodGhpcy4jb2JzZXJ2ZXIpLnVub2JzZXJ2ZShlbGVtZW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblx0I2dldE9ic2VydmVyKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHR0aGlzLiNvYnNlcnZlciA/P1xuXHRcdFx0KHRoaXMuI29ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKFxuXHRcdFx0XHQvKiogQHBhcmFtIHthbnl9IGVudHJpZXMgKi8gKGVudHJpZXMpID0+IHtcblx0XHRcdFx0XHRmb3IgKHZhciBlbnRyeSBvZiBlbnRyaWVzKSB7XG5cdFx0XHRcdFx0XHRSZXNpemVPYnNlcnZlclNpbmdsZXRvbi5lbnRyaWVzLnNldChlbnRyeS50YXJnZXQsIGVudHJ5KTtcblx0XHRcdFx0XHRcdGZvciAodmFyIGxpc3RlbmVyIG9mIHRoaXMuI2xpc3RlbmVycy5nZXQoZW50cnkudGFyZ2V0KSB8fCBbXSkge1xuXHRcdFx0XHRcdFx0XHRsaXN0ZW5lcihlbnRyeSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHQpKVxuXHRcdCk7XG5cdH1cbn1cblxudmFyIHJlc2l6ZV9vYnNlcnZlcl9jb250ZW50X2JveCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgUmVzaXplT2JzZXJ2ZXJTaW5nbGV0b24oe1xuXHRib3g6ICdjb250ZW50LWJveCdcbn0pO1xuXG52YXIgcmVzaXplX29ic2VydmVyX2JvcmRlcl9ib3ggPSAvKiBAX19QVVJFX18gKi8gbmV3IFJlc2l6ZU9ic2VydmVyU2luZ2xldG9uKHtcblx0Ym94OiAnYm9yZGVyLWJveCdcbn0pO1xuXG52YXIgcmVzaXplX29ic2VydmVyX2RldmljZV9waXhlbF9jb250ZW50X2JveCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgUmVzaXplT2JzZXJ2ZXJTaW5nbGV0b24oe1xuXHRib3g6ICdkZXZpY2UtcGl4ZWwtY29udGVudC1ib3gnXG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7J2NvbnRlbnRSZWN0JyB8ICdjb250ZW50Qm94U2l6ZScgfCAnYm9yZGVyQm94U2l6ZScgfCAnZGV2aWNlUGl4ZWxDb250ZW50Qm94U2l6ZSd9IHR5cGVcbiAqIEBwYXJhbSB7KGVudHJ5OiBrZXlvZiBSZXNpemVPYnNlcnZlckVudHJ5KSA9PiB2b2lkfSBzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRfcmVzaXplX29ic2VydmVyKGVsZW1lbnQsIHR5cGUsIHNldCkge1xuXHR2YXIgb2JzZXJ2ZXIgPVxuXHRcdHR5cGUgPT09ICdjb250ZW50UmVjdCcgfHwgdHlwZSA9PT0gJ2NvbnRlbnRCb3hTaXplJ1xuXHRcdFx0PyByZXNpemVfb2JzZXJ2ZXJfY29udGVudF9ib3hcblx0XHRcdDogdHlwZSA9PT0gJ2JvcmRlckJveFNpemUnXG5cdFx0XHRcdD8gcmVzaXplX29ic2VydmVyX2JvcmRlcl9ib3hcblx0XHRcdFx0OiByZXNpemVfb2JzZXJ2ZXJfZGV2aWNlX3BpeGVsX2NvbnRlbnRfYm94O1xuXG5cdHZhciB1bnN1YiA9IG9ic2VydmVyLm9ic2VydmUoZWxlbWVudCwgLyoqIEBwYXJhbSB7YW55fSBlbnRyeSAqLyAoZW50cnkpID0+IHNldChlbnRyeVt0eXBlXSkpO1xuXHR0ZWFyZG93bih1bnN1Yik7XG59XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHsnY2xpZW50V2lkdGgnIHwgJ2NsaWVudEhlaWdodCcgfCAnb2Zmc2V0V2lkdGgnIHwgJ29mZnNldEhlaWdodCd9IHR5cGVcbiAqIEBwYXJhbSB7KHNpemU6IG51bWJlcikgPT4gdm9pZH0gc2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kX2VsZW1lbnRfc2l6ZShlbGVtZW50LCB0eXBlLCBzZXQpIHtcblx0dmFyIHVuc3ViID0gcmVzaXplX29ic2VydmVyX2JvcmRlcl9ib3gub2JzZXJ2ZShlbGVtZW50LCAoKSA9PiBzZXQoZWxlbWVudFt0eXBlXSkpO1xuXG5cdGVmZmVjdCgoKSA9PiB7XG5cdFx0Ly8gVGhlIHVwZGF0ZSBjb3VsZCBjb250YWluIHJlYWRzIHdoaWNoIHNob3VsZCBiZSBpZ25vcmVkXG5cdFx0dW50cmFjaygoKSA9PiBzZXQoZWxlbWVudFt0eXBlXSkpO1xuXHRcdHJldHVybiB1bnN1Yjtcblx0fSk7XG59XG4iLCIvKiogQGltcG9ydCB7IENvbXBvbmVudENvbnRleHQsIEVmZmVjdCB9IGZyb20gJyNjbGllbnQnICovXG5pbXBvcnQgeyBERVNUUk9ZSU5HLCBTVEFURV9TWU1CT0wgfSBmcm9tICcjY2xpZW50L2NvbnN0YW50cyc7XG5pbXBvcnQgeyBjb21wb25lbnRfY29udGV4dCwgbWFya19hc19jb21wb25lbnQgfSBmcm9tICcuLi8uLi8uLi9jb250ZXh0LmpzJztcbmltcG9ydCB7IGVmZmVjdCwgcmVuZGVyX2VmZmVjdCB9IGZyb20gJy4uLy4uLy4uL3JlYWN0aXZpdHkvZWZmZWN0cy5qcyc7XG5pbXBvcnQgeyBhY3RpdmVfZWZmZWN0LCB1bnRyYWNrIH0gZnJvbSAnLi4vLi4vLi4vcnVudGltZS5qcyc7XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IGJvdW5kX3ZhbHVlXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnRfb3JfY29tcG9uZW50XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNfYm91bmRfdGhpcyhib3VuZF92YWx1ZSwgZWxlbWVudF9vcl9jb21wb25lbnQpIHtcblx0cmV0dXJuIChcblx0XHRib3VuZF92YWx1ZSA9PT0gZWxlbWVudF9vcl9jb21wb25lbnQgfHwgYm91bmRfdmFsdWU/LltTVEFURV9TWU1CT0xdID09PSBlbGVtZW50X29yX2NvbXBvbmVudFxuXHQpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBlbGVtZW50X29yX2NvbXBvbmVudFxuICogQHBhcmFtIHsodmFsdWU6IHVua25vd24sIC4uLnBhcnRzOiB1bmtub3duW10pID0+IHZvaWR9IHVwZGF0ZVxuICogQHBhcmFtIHsoLi4ucGFydHM6IHVua25vd25bXSkgPT4gdW5rbm93bn0gZ2V0X3ZhbHVlXG4gKiBAcGFyYW0geygpID0+IHVua25vd25bXX0gW2dldF9wYXJ0c10gU2V0IGlmIHRoZSB0aGlzIGJpbmRpbmcgaXMgdXNlZCBpbnNpZGUgYW4gZWFjaCBibG9jayxcbiAqIFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJucyBhbGwgdGhlIHBhcnRzIG9mIHRoZSBlYWNoIGJsb2NrIGNvbnRleHQgdGhhdCBhcmUgdXNlZCBpbiB0aGUgZXhwcmVzc2lvblxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kX3RoaXMoXG5cdGVsZW1lbnRfb3JfY29tcG9uZW50ID0gbWFya19hc19jb21wb25lbnQoKSxcblx0dXBkYXRlLFxuXHRnZXRfdmFsdWUsXG5cdGdldF9wYXJ0c1xuKSB7XG5cdHZhciBjb21wb25lbnRfZWZmZWN0ID0gLyoqIEB0eXBlIHtDb21wb25lbnRDb250ZXh0fSAqLyAoY29tcG9uZW50X2NvbnRleHQpLnI7XG5cdHZhciBwYXJlbnQgPSAvKiogQHR5cGUge0VmZmVjdH0gKi8gKGFjdGl2ZV9lZmZlY3QpO1xuXG5cdGVmZmVjdCgoKSA9PiB7XG5cdFx0LyoqIEB0eXBlIHt1bmtub3duW119ICovXG5cdFx0dmFyIG9sZF9wYXJ0cztcblxuXHRcdC8qKiBAdHlwZSB7dW5rbm93bltdfSAqL1xuXHRcdHZhciBwYXJ0cztcblxuXHRcdHJlbmRlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdFx0b2xkX3BhcnRzID0gcGFydHM7XG5cdFx0XHQvLyBXZSBvbmx5IHRyYWNrIGNoYW5nZXMgdG8gdGhlIHBhcnRzLCBub3QgdGhlIHZhbHVlIGl0c2VsZiB0byBhdm9pZCB1bm5lY2Vzc2FyeSByZXJ1bnMuXG5cdFx0XHRwYXJ0cyA9IGdldF9wYXJ0cz8uKCkgfHwgW107XG5cblx0XHRcdHVudHJhY2soKCkgPT4ge1xuXHRcdFx0XHRpZiAoIWlzX2JvdW5kX3RoaXMoZ2V0X3ZhbHVlKC4uLnBhcnRzKSwgZWxlbWVudF9vcl9jb21wb25lbnQpKSB7XG5cdFx0XHRcdFx0dXBkYXRlKGVsZW1lbnRfb3JfY29tcG9uZW50LCAuLi5wYXJ0cyk7XG5cdFx0XHRcdFx0Ly8gSWYgdGhpcyBpcyBhbiBlZmZlY3QgcmVydW4gKGNhdXNlOiBlYWNoIGJsb2NrIGNvbnRleHQgY2hhbmdlcyksIHRoZW4gbnVsbGlmeSB0aGUgYmluZGluZyBhdFxuXHRcdFx0XHRcdC8vIHRoZSBwcmV2aW91cyBwb3NpdGlvbiBpZiBpdCBpc24ndCBhbHJlYWR5IHRha2VuIG92ZXIgYnkgYSBkaWZmZXJlbnQgZWZmZWN0LlxuXHRcdFx0XHRcdGlmIChvbGRfcGFydHMgJiYgaXNfYm91bmRfdGhpcyhnZXRfdmFsdWUoLi4ub2xkX3BhcnRzKSwgZWxlbWVudF9vcl9jb21wb25lbnQpKSB7XG5cdFx0XHRcdFx0XHR1cGRhdGUobnVsbCwgLi4ub2xkX3BhcnRzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuICgpID0+IHtcblx0XHRcdC8vIFdoZW4gdGhlIGJpbmQ6dGhpcyBlZmZlY3QgaXMgZGVzdHJveWVkLCB3ZSBnbyB1cCB0aGUgZWZmZWN0IHBhcmVudCBjaGFpbiB1bnRpbCB3ZSBmaW5kIHRoZSBsYXN0IHBhcmVudCBlZmZlY3QgdGhhdCBpcyBkZXN0cm95ZWQsXG5cdFx0XHQvLyBvciB0aGUgZWZmZWN0IGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudCBiaW5kOnRoaXMgaXMgaW4gKHdoaWNoZXZlciBjb21lcyBmaXJzdCkuIFRoYXQgd2F5IHdlIGNhbiB0aW1lIHRoZSBudWxsaW5nIG9mIHRoZSBiaW5kaW5nXG5cdFx0XHQvLyBhcyBjbG9zZSB0byB1c2VyL2RldmVsb3BlciBleHBlY3RhdGlvbiBhcyBwb3NzaWJsZS5cblx0XHRcdC8vIFRPRE8gU3ZlbHRlIDY6IERlY2lkZSBpZiB3ZSB3YW50IHRvIGtlZXAgdGhpcyBsb2dpYyBvciBqdXN0IGFsd2F5cyBudWxsIHRoZSBiaW5kaW5nIGluIHRoZSBjb21wb25lbnQgZWZmZWN0J3MgdGVhcmRvd25cblx0XHRcdC8vICh3aGljaCB3b3VsZCBiZSBzaW1wbGVyLCBidXQgbGVzcyBpbnR1aXRpdmUgaW4gc29tZSBjYXNlcywgYW5kIGJyZWFrcyB0aGUgYG9uZGVzdHJveS1iZWZvcmUtY2xlYW51cGAgdGVzdClcblx0XHRcdGxldCBwID0gcGFyZW50O1xuXHRcdFx0d2hpbGUgKHAgIT09IGNvbXBvbmVudF9lZmZlY3QgJiYgcC5wYXJlbnQgIT09IG51bGwgJiYgcC5wYXJlbnQuZiAmIERFU1RST1lJTkcpIHtcblx0XHRcdFx0cCA9IHAucGFyZW50O1xuXHRcdFx0fVxuXHRcdFx0Y29uc3QgdGVhcmRvd24gPSAoKSA9PiB7XG5cdFx0XHRcdGlmIChwYXJ0cyAmJiBpc19ib3VuZF90aGlzKGdldF92YWx1ZSguLi5wYXJ0cyksIGVsZW1lbnRfb3JfY29tcG9uZW50KSkge1xuXHRcdFx0XHRcdHVwZGF0ZShudWxsLCAuLi5wYXJ0cyk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHRjb25zdCBvcmlnaW5hbF90ZWFyZG93biA9IHAudGVhcmRvd247XG5cdFx0XHRwLnRlYXJkb3duID0gKCkgPT4ge1xuXHRcdFx0XHR0ZWFyZG93bigpO1xuXHRcdFx0XHRvcmlnaW5hbF90ZWFyZG93bj8uKCk7XG5cdFx0XHR9O1xuXHRcdH07XG5cdH0pO1xuXG5cdHJldHVybiBlbGVtZW50X29yX2NvbXBvbmVudDtcbn1cbiIsImltcG9ydCB7IHJlbmRlcl9lZmZlY3QsIHRlYXJkb3duIH0gZnJvbSAnLi4vLi4vLi4vcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcbmltcG9ydCB7IGxpc3RlbiB9IGZyb20gJy4vc2hhcmVkLmpzJztcblxuLyoqXG4gKiBAcGFyYW0geydpbm5lckhUTUwnIHwgJ3RleHRDb250ZW50JyB8ICdpbm5lclRleHQnfSBwcm9wZXJ0eVxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHsoKSA9PiB1bmtub3dufSBnZXRcbiAqIEBwYXJhbSB7KHZhbHVlOiB1bmtub3duKSA9PiB2b2lkfSBzZXRcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9jb250ZW50X2VkaXRhYmxlKHByb3BlcnR5LCBlbGVtZW50LCBnZXQsIHNldCA9IGdldCkge1xuXHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKCkgPT4ge1xuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRzZXQoZWxlbWVudFtwcm9wZXJ0eV0pO1xuXHR9KTtcblxuXHRyZW5kZXJfZWZmZWN0KCgpID0+IHtcblx0XHR2YXIgdmFsdWUgPSBnZXQoKTtcblxuXHRcdGlmIChlbGVtZW50W3Byb3BlcnR5XSAhPT0gdmFsdWUpIHtcblx0XHRcdGlmICh2YWx1ZSA9PSBudWxsKSB7XG5cdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0dmFyIG5vbl9udWxsX3ZhbHVlID0gZWxlbWVudFtwcm9wZXJ0eV07XG5cdFx0XHRcdHNldChub25fbnVsbF92YWx1ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdGVsZW1lbnRbcHJvcGVydHldID0gdmFsdWUgKyAnJztcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50X25hbWVcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHsodmFsdWU6IHVua25vd24pID0+IHZvaWR9IHNldFxuICogQHBhcmFtIHsoKSA9PiB1bmtub3dufSBbZ2V0XVxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kX3Byb3BlcnR5KHByb3BlcnR5LCBldmVudF9uYW1lLCBlbGVtZW50LCBzZXQsIGdldCkge1xuXHR2YXIgaGFuZGxlciA9ICgpID0+IHtcblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0c2V0KGVsZW1lbnRbcHJvcGVydHldKTtcblx0fTtcblxuXHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRfbmFtZSwgaGFuZGxlcik7XG5cblx0aWYgKGdldCkge1xuXHRcdHJlbmRlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0ZWxlbWVudFtwcm9wZXJ0eV0gPSBnZXQoKTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHRoYW5kbGVyKCk7XG5cdH1cblxuXHQvLyBAdHMtaWdub3JlXG5cdGlmIChlbGVtZW50ID09PSBkb2N1bWVudC5ib2R5IHx8IGVsZW1lbnQgPT09IHdpbmRvdyB8fCBlbGVtZW50ID09PSBkb2N1bWVudCkge1xuXHRcdHRlYXJkb3duKCgpID0+IHtcblx0XHRcdGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBoYW5kbGVyKTtcblx0XHR9KTtcblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7KHZhbHVlOiB1bmtub3duKSA9PiB2b2lkfSBzZXRcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9mb2N1c2VkKGVsZW1lbnQsIHNldCkge1xuXHRsaXN0ZW4oZWxlbWVudCwgWydmb2N1cycsICdibHVyJ10sICgpID0+IHtcblx0XHRzZXQoZWxlbWVudCA9PT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCk7XG5cdH0pO1xufVxuIiwiaW1wb3J0IHsgZWZmZWN0LCByZW5kZXJfZWZmZWN0LCB0ZWFyZG93biB9IGZyb20gJy4uLy4uLy4uL3JlYWN0aXZpdHkvZWZmZWN0cy5qcyc7XG5pbXBvcnQgeyBsaXN0ZW4sIHdpdGhvdXRfcmVhY3RpdmVfY29udGV4dCB9IGZyb20gJy4vc2hhcmVkLmpzJztcblxuLyoqXG4gKiBAcGFyYW0geyd4JyB8ICd5J30gdHlwZVxuICogQHBhcmFtIHsoKSA9PiBudW1iZXJ9IGdldFxuICogQHBhcmFtIHsodmFsdWU6IG51bWJlcikgPT4gdm9pZH0gc2V0XG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRfd2luZG93X3Njcm9sbCh0eXBlLCBnZXQsIHNldCA9IGdldCkge1xuXHR2YXIgaXNfc2Nyb2xsaW5nX3ggPSB0eXBlID09PSAneCc7XG5cblx0dmFyIHRhcmdldF9oYW5kbGVyID0gKCkgPT5cblx0XHR3aXRob3V0X3JlYWN0aXZlX2NvbnRleHQoKCkgPT4ge1xuXHRcdFx0c2Nyb2xsaW5nID0gdHJ1ZTtcblx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0XHRcdHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFyLCAxMDApOyAvLyBUT0RPIHVzZSBzY3JvbGxlbmQgZXZlbnQgaWYgc3VwcG9ydGVkIChvciB3aGVuIHN1cHBvcnRlZCBldmVyeXdoZXJlPylcblxuXHRcdFx0c2V0KHdpbmRvd1tpc19zY3JvbGxpbmdfeCA/ICdzY3JvbGxYJyA6ICdzY3JvbGxZJ10pO1xuXHRcdH0pO1xuXG5cdGFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRhcmdldF9oYW5kbGVyLCB7XG5cdFx0cGFzc2l2ZTogdHJ1ZVxuXHR9KTtcblxuXHR2YXIgc2Nyb2xsaW5nID0gZmFsc2U7XG5cblx0LyoqIEB0eXBlIHtSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0Pn0gKi9cblx0dmFyIHRpbWVvdXQ7XG5cdHZhciBjbGVhciA9ICgpID0+IHtcblx0XHRzY3JvbGxpbmcgPSBmYWxzZTtcblx0fTtcblx0dmFyIGZpcnN0ID0gdHJ1ZTtcblxuXHRyZW5kZXJfZWZmZWN0KCgpID0+IHtcblx0XHR2YXIgbGF0ZXN0X3ZhbHVlID0gZ2V0KCk7XG5cdFx0Ly8gRG9uJ3Qgc2Nyb2xsIHRvIHRoZSBpbml0aWFsIHZhbHVlIGZvciBhY2Nlc3NpYmlsaXR5IHJlYXNvbnNcblx0XHRpZiAoZmlyc3QpIHtcblx0XHRcdGZpcnN0ID0gZmFsc2U7XG5cdFx0fSBlbHNlIGlmICghc2Nyb2xsaW5nICYmIGxhdGVzdF92YWx1ZSAhPSBudWxsKSB7XG5cdFx0XHRzY3JvbGxpbmcgPSB0cnVlO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdFx0aWYgKGlzX3Njcm9sbGluZ194KSB7XG5cdFx0XHRcdHNjcm9sbFRvKGxhdGVzdF92YWx1ZSwgd2luZG93LnNjcm9sbFkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c2Nyb2xsVG8od2luZG93LnNjcm9sbFgsIGxhdGVzdF92YWx1ZSk7XG5cdFx0XHR9XG5cdFx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhciwgMTAwKTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIEJyb3dzZXJzIGRvbid0IGZpcmUgdGhlIHNjcm9sbCBldmVudCBmb3IgdGhlIGluaXRpYWwgc2Nyb2xsIHBvc2l0aW9uIHdoZW4gc2Nyb2xsIHN0eWxlIGlzbid0IHNldCB0byBzbW9vdGhcblx0ZWZmZWN0KHRhcmdldF9oYW5kbGVyKTtcblxuXHR0ZWFyZG93bigoKSA9PiB7XG5cdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGFyZ2V0X2hhbmRsZXIpO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0geydpbm5lcldpZHRoJyB8ICdpbm5lckhlaWdodCcgfCAnb3V0ZXJXaWR0aCcgfCAnb3V0ZXJIZWlnaHQnfSB0eXBlXG4gKiBAcGFyYW0geyhzaXplOiBudW1iZXIpID0+IHZvaWR9IHNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF93aW5kb3dfc2l6ZSh0eXBlLCBzZXQpIHtcblx0bGlzdGVuKHdpbmRvdywgWydyZXNpemUnXSwgKCkgPT4gd2l0aG91dF9yZWFjdGl2ZV9jb250ZXh0KCgpID0+IHNldCh3aW5kb3dbdHlwZV0pKSk7XG59XG4iLCIvKiogQGltcG9ydCB7IENvbXBvbmVudENvbnRleHRMZWdhY3kgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgcnVuLCBydW5fYWxsIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzLmpzJztcbmltcG9ydCB7IGNvbXBvbmVudF9jb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dC5qcyc7XG5pbXBvcnQgeyBkZXJpdmVkIH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9kZXJpdmVkcy5qcyc7XG5pbXBvcnQgeyB1c2VyX3ByZV9lZmZlY3QsIHVzZXJfZWZmZWN0IH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcbmltcG9ydCB7IGRlZXBfcmVhZF9zdGF0ZSwgZ2V0LCB1bnRyYWNrIH0gZnJvbSAnLi4vLi4vcnVudGltZS5qcyc7XG5cbi8qKlxuICogTGVnYWN5LW1vZGUgb25seTogQ2FsbCBgb25Nb3VudGAgY2FsbGJhY2tzIGFuZCBzZXQgdXAgYGJlZm9yZVVwZGF0ZWAvYGFmdGVyVXBkYXRlYCBlZmZlY3RzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpbW11dGFibGVdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0KGltbXV0YWJsZSA9IGZhbHNlKSB7XG5cdGNvbnN0IGNvbnRleHQgPSAvKiogQHR5cGUge0NvbXBvbmVudENvbnRleHRMZWdhY3l9ICovIChjb21wb25lbnRfY29udGV4dCk7XG5cblx0Y29uc3QgY2FsbGJhY2tzID0gY29udGV4dC5sLnU7XG5cdGlmICghY2FsbGJhY2tzKSByZXR1cm47XG5cblx0bGV0IHByb3BzID0gKCkgPT4gZGVlcF9yZWFkX3N0YXRlKGNvbnRleHQucyk7XG5cblx0aWYgKGltbXV0YWJsZSkge1xuXHRcdGxldCB2ZXJzaW9uID0gMDtcblx0XHRsZXQgcHJldiA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gKi8gKHt9KTtcblxuXHRcdC8vIEluIGxlZ2FjeSBpbW11dGFibGUgbW9kZSwgYmVmb3JlL2FmdGVyVXBkYXRlIG9ubHkgZmlyZSBpZiB0aGUgb2JqZWN0IGlkZW50aXR5IG9mIGEgcHJvcCBjaGFuZ2VzXG5cdFx0Y29uc3QgZCA9IGRlcml2ZWQoKCkgPT4ge1xuXHRcdFx0bGV0IGNoYW5nZWQgPSBmYWxzZTtcblx0XHRcdGNvbnN0IHByb3BzID0gY29udGV4dC5zO1xuXHRcdFx0Zm9yIChjb25zdCBrZXkgaW4gcHJvcHMpIHtcblx0XHRcdFx0aWYgKHByb3BzW2tleV0gIT09IHByZXZba2V5XSkge1xuXHRcdFx0XHRcdHByZXZba2V5XSA9IHByb3BzW2tleV07XG5cdFx0XHRcdFx0Y2hhbmdlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmIChjaGFuZ2VkKSB2ZXJzaW9uKys7XG5cdFx0XHRyZXR1cm4gdmVyc2lvbjtcblx0XHR9KTtcblxuXHRcdHByb3BzID0gKCkgPT4gZ2V0KGQpO1xuXHR9XG5cblx0Ly8gYmVmb3JlVXBkYXRlXG5cdGlmIChjYWxsYmFja3MuYi5sZW5ndGgpIHtcblx0XHR1c2VyX3ByZV9lZmZlY3QoKCkgPT4ge1xuXHRcdFx0b2JzZXJ2ZV9hbGwoY29udGV4dCwgcHJvcHMpO1xuXHRcdFx0cnVuX2FsbChjYWxsYmFja3MuYik7XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBvbk1vdW50IChtdXN0IHJ1biBiZWZvcmUgYWZ0ZXJVcGRhdGUpXG5cdHVzZXJfZWZmZWN0KCgpID0+IHtcblx0XHRjb25zdCBmbnMgPSB1bnRyYWNrKCgpID0+IGNhbGxiYWNrcy5tLm1hcChydW4pKTtcblx0XHRyZXR1cm4gKCkgPT4ge1xuXHRcdFx0Zm9yIChjb25zdCBmbiBvZiBmbnMpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGZuKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHR9KTtcblxuXHQvLyBhZnRlclVwZGF0ZVxuXHRpZiAoY2FsbGJhY2tzLmEubGVuZ3RoKSB7XG5cdFx0dXNlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdFx0b2JzZXJ2ZV9hbGwoY29udGV4dCwgcHJvcHMpO1xuXHRcdFx0cnVuX2FsbChjYWxsYmFja3MuYSk7XG5cdFx0fSk7XG5cdH1cbn1cblxuLyoqXG4gKiBJbnZva2UgdGhlIGdldHRlciBvZiBhbGwgc2lnbmFscyBhc3NvY2lhdGVkIHdpdGggYSBjb21wb25lbnRcbiAqIHNvIHRoZXkgY2FuIGJlIHJlZ2lzdGVyZWQgdG8gdGhlIGVmZmVjdCB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBpbi5cbiAqIEBwYXJhbSB7Q29tcG9uZW50Q29udGV4dExlZ2FjeX0gY29udGV4dFxuICogQHBhcmFtIHsoKCkgPT4gdm9pZCl9IHByb3BzXG4gKi9cbmZ1bmN0aW9uIG9ic2VydmVfYWxsKGNvbnRleHQsIHByb3BzKSB7XG5cdGlmIChjb250ZXh0Lmwucykge1xuXHRcdGZvciAoY29uc3Qgc2lnbmFsIG9mIGNvbnRleHQubC5zKSBnZXQoc2lnbmFsKTtcblx0fVxuXG5cdHByb3BzKCk7XG59XG4iLCJpbXBvcnQgeyBzZXQsIHNvdXJjZSB9IGZyb20gJy4uLy4uL3JlYWN0aXZpdHkvc291cmNlcy5qcyc7XG5pbXBvcnQgeyBnZXQgfSBmcm9tICcuLi8uLi9ydW50aW1lLmpzJztcbmltcG9ydCB7IGlzX2FycmF5IH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzLmpzJztcblxuLyoqXG4gKiBVbmRlciBzb21lIGNpcmN1bXN0YW5jZXMsIGltcG9ydHMgbWF5IGJlIHJlYWN0aXZlIGluIGxlZ2FjeSBtb2RlLiBJbiB0aGF0IGNhc2UsXG4gKiB0aGV5IHNob3VsZCBiZSB1c2luZyBgcmVhY3RpdmVfaW1wb3J0YCBhcyBwYXJ0IG9mIHRoZSB0cmFuc2Zvcm1hdGlvblxuICogQHBhcmFtIHsoKSA9PiBhbnl9IGZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFjdGl2ZV9pbXBvcnQoZm4pIHtcblx0dmFyIHMgPSBzb3VyY2UoMCk7XG5cblx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuXHRcdFx0c2V0KHMsIGdldChzKSArIDEpO1xuXHRcdFx0cmV0dXJuIGFyZ3VtZW50c1swXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Z2V0KHMpO1xuXHRcdFx0cmV0dXJuIGZuKCk7XG5cdFx0fVxuXHR9O1xufVxuXG4vKipcbiAqIEB0aGlzIHthbnl9XG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAkJHByb3BzXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWJibGVfZXZlbnQoJCRwcm9wcywgZXZlbnQpIHtcblx0dmFyIGV2ZW50cyA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgRnVuY3Rpb25bXSB8IEZ1bmN0aW9uPn0gKi8gKCQkcHJvcHMuJCRldmVudHMpPy5bXG5cdFx0ZXZlbnQudHlwZVxuXHRdO1xuXG5cdHZhciBjYWxsYmFja3MgPSBpc19hcnJheShldmVudHMpID8gZXZlbnRzLnNsaWNlKCkgOiBldmVudHMgPT0gbnVsbCA/IFtdIDogW2V2ZW50c107XG5cblx0Zm9yICh2YXIgZm4gb2YgY2FsbGJhY2tzKSB7XG5cdFx0Ly8gUHJlc2VydmUgXCJ0aGlzXCIgY29udGV4dFxuXHRcdGZuLmNhbGwodGhpcywgZXZlbnQpO1xuXHR9XG59XG5cbi8qKlxuICogVXNlZCB0byBzaW11bGF0ZSBgJG9uYCBvbiBhIGNvbXBvbmVudCBpbnN0YW5jZSB3aGVuIGBjb21wYXRpYmlsaXR5LmNvbXBvbmVudEFwaSA9PT0gNGBcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gJCRwcm9wc1xuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50X25hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGV2ZW50X2NhbGxiYWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRfbGVnYWN5X2V2ZW50X2xpc3RlbmVyKCQkcHJvcHMsIGV2ZW50X25hbWUsIGV2ZW50X2NhbGxiYWNrKSB7XG5cdCQkcHJvcHMuJCRldmVudHMgfHw9IHt9O1xuXHQkJHByb3BzLiQkZXZlbnRzW2V2ZW50X25hbWVdIHx8PSBbXTtcblx0JCRwcm9wcy4kJGV2ZW50c1tldmVudF9uYW1lXS5wdXNoKGV2ZW50X2NhbGxiYWNrKTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIHNpbXVsYXRlIGAkc2V0YCBvbiBhIGNvbXBvbmVudCBpbnN0YW5jZSB3aGVuIGBjb21wYXRpYmlsaXR5LmNvbXBvbmVudEFwaSA9PT0gNGAuXG4gKiBOZWVkcyBjb21wb25lbnQgYWNjZXNzb3JzIHNvIHRoYXQgaXQgY2FuIGNhbGwgdGhlIHNldHRlciBvZiB0aGUgcHJvcC4gVGhlcmVmb3JlIGRvZXNuJ3RcbiAqIHdvcmsgZm9yIHVwZGF0aW5nIHByb3BzIGluIGAkJHByb3BzYCBvciBgJCRyZXN0UHJvcHNgLlxuICogQHRoaXMge1JlY29yZDxzdHJpbmcsIGFueT59XG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59ICQkbmV3X3Byb3BzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVfbGVnYWN5X3Byb3BzKCQkbmV3X3Byb3BzKSB7XG5cdGZvciAodmFyIGtleSBpbiAkJG5ld19wcm9wcykge1xuXHRcdGlmIChrZXkgaW4gdGhpcykge1xuXHRcdFx0dGhpc1trZXldID0gJCRuZXdfcHJvcHNba2V5XTtcblx0XHR9XG5cdH1cbn1cbiIsIi8qKiBAaW1wb3J0IHsgU3RvcmVSZWZlcmVuY2VzQ29udGFpbmVyIH0gZnJvbSAnI2NsaWVudCcgKi9cbi8qKiBAaW1wb3J0IHsgU3RvcmUgfSBmcm9tICcjc2hhcmVkJyAqL1xuaW1wb3J0IHsgc3Vic2NyaWJlX3RvX3N0b3JlIH0gZnJvbSAnLi4vLi4vLi4vc3RvcmUvdXRpbHMuanMnO1xuaW1wb3J0IHsgZ2V0IGFzIGdldF9zdG9yZSB9IGZyb20gJy4uLy4uLy4uL3N0b3JlL3NoYXJlZC9pbmRleC5qcyc7XG5pbXBvcnQgeyBkZWZpbmVfcHJvcGVydHksIG5vb3AgfSBmcm9tICcuLi8uLi9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0IHsgZ2V0IH0gZnJvbSAnLi4vcnVudGltZS5qcyc7XG5pbXBvcnQgeyB0ZWFyZG93biB9IGZyb20gJy4vZWZmZWN0cy5qcyc7XG5pbXBvcnQgeyBtdXRhYmxlX3NvdXJjZSwgc2V0IH0gZnJvbSAnLi9zb3VyY2VzLmpzJztcbmltcG9ydCB7IERFViB9IGZyb20gJ2VzbS1lbnYnO1xuXG4vKipcbiAqIFdlIHNldCB0aGlzIHRvIGB0cnVlYCB3aGVuIHVwZGF0aW5nIGEgc3RvcmUgc28gdGhhdCB3ZSBjb3JyZWN0bHlcbiAqIHNjaGVkdWxlIGVmZmVjdHMgaWYgdGhlIHVwZGF0ZSB0YWtlcyBwbGFjZSBpbnNpZGUgYSBgJDpgIGVmZmVjdFxuICovXG5leHBvcnQgbGV0IGxlZ2FjeV9pc191cGRhdGluZ19zdG9yZSA9IGZhbHNlO1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBwcm9wIGN1cnJlbnRseSBiZWluZyByZWFkIGlzIGEgc3RvcmUgYmluZGluZywgYXMgaW5cbiAqIGA8Q2hpbGQgYmluZDp4PXskeX0gLz5gLiBJZiBpdCBpcywgd2UgdHJlYXQgdGhlIHByb3AgYXMgbXV0YWJsZSBldmVuIGluXG4gKiBydW5lcyBtb2RlLCBhbmQgc2tpcCBgYmluZGluZ19wcm9wZXJ0eV9ub25fcmVhY3RpdmVgIHZhbGlkYXRpb25cbiAqL1xubGV0IGlzX3N0b3JlX2JpbmRpbmcgPSBmYWxzZTtcblxubGV0IElTX1VOTU9VTlRFRCA9IFN5bWJvbCgndW5tb3VudGVkJyk7XG5cbi8qKlxuICogR2V0cyB0aGUgY3VycmVudCB2YWx1ZSBvZiBhIHN0b3JlLiBJZiB0aGUgc3RvcmUgaXNuJ3Qgc3Vic2NyaWJlZCB0byB5ZXQsIGl0IHdpbGwgY3JlYXRlIGEgcHJveHlcbiAqIHNpZ25hbCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aGVuIHRoZSBzdG9yZSBpcy4gVGhlIHN0b3JlIHJlZmVyZW5jZXMgY29udGFpbmVyIGlzIG5lZWRlZCB0b1xuICogdHJhY2sgcmVhc3NpZ25tZW50cyB0byBzdG9yZXMgYW5kIHRvIHRyYWNrIHRoZSBjb3JyZWN0IGNvbXBvbmVudCBjb250ZXh0LlxuICogQHRlbXBsYXRlIFZcbiAqIEBwYXJhbSB7U3RvcmU8Vj4gfCBudWxsIHwgdW5kZWZpbmVkfSBzdG9yZVxuICogQHBhcmFtIHtzdHJpbmd9IHN0b3JlX25hbWVcbiAqIEBwYXJhbSB7U3RvcmVSZWZlcmVuY2VzQ29udGFpbmVyfSBzdG9yZXNcbiAqIEByZXR1cm5zIHtWfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVfZ2V0KHN0b3JlLCBzdG9yZV9uYW1lLCBzdG9yZXMpIHtcblx0Y29uc3QgZW50cnkgPSAoc3RvcmVzW3N0b3JlX25hbWVdID8/PSB7XG5cdFx0c3RvcmU6IG51bGwsXG5cdFx0c291cmNlOiBtdXRhYmxlX3NvdXJjZSh1bmRlZmluZWQpLFxuXHRcdHVuc3Vic2NyaWJlOiBub29wXG5cdH0pO1xuXG5cdGlmIChERVYpIHtcblx0XHRlbnRyeS5zb3VyY2UubGFiZWwgPSBzdG9yZV9uYW1lO1xuXHR9XG5cblx0Ly8gaWYgdGhlIGNvbXBvbmVudCB0aGF0IHNldHVwIHRoaXMgaXMgYWxyZWFkeSB1bm1vdW50ZWQgd2UgZG9uJ3Qgd2FudCB0byByZWdpc3RlciBhIHN1YnNjcmlwdGlvblxuXHRpZiAoZW50cnkuc3RvcmUgIT09IHN0b3JlICYmICEoSVNfVU5NT1VOVEVEIGluIHN0b3JlcykpIHtcblx0XHRlbnRyeS51bnN1YnNjcmliZSgpO1xuXHRcdGVudHJ5LnN0b3JlID0gc3RvcmUgPz8gbnVsbDtcblxuXHRcdGlmIChzdG9yZSA9PSBudWxsKSB7XG5cdFx0XHRlbnRyeS5zb3VyY2UudiA9IHVuZGVmaW5lZDsgLy8gc2VlIHN5bmNocm9ub3VzIGNhbGxiYWNrIGNvbW1lbnQgYmVsb3dcblx0XHRcdGVudHJ5LnVuc3Vic2NyaWJlID0gbm9vcDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIGlzX3N5bmNocm9ub3VzX2NhbGxiYWNrID0gdHJ1ZTtcblxuXHRcdFx0ZW50cnkudW5zdWJzY3JpYmUgPSBzdWJzY3JpYmVfdG9fc3RvcmUoc3RvcmUsICh2KSA9PiB7XG5cdFx0XHRcdGlmIChpc19zeW5jaHJvbm91c19jYWxsYmFjaykge1xuXHRcdFx0XHRcdC8vIElmIHRoZSBmaXJzdCB1cGRhdGVzIHRvIHRoZSBzdG9yZSB2YWx1ZSAocG9zc2libHkgbXVsdGlwbGUgb2YgdGhlbSkgYXJlIHN5bmNocm9ub3VzbHlcblx0XHRcdFx0XHQvLyBpbnNpZGUgYSBkZXJpdmVkLCB3ZSB3aWxsIGhpdCB0aGUgYHN0YXRlX3Vuc2FmZV9tdXRhdGlvbmAgZXJyb3IgaWYgd2UgYHNldGAgdGhlIHZhbHVlXG5cdFx0XHRcdFx0ZW50cnkuc291cmNlLnYgPSB2O1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNldChlbnRyeS5zb3VyY2UsIHYpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0aXNfc3luY2hyb25vdXNfY2FsbGJhY2sgPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQvLyBpZiB0aGUgY29tcG9uZW50IHRoYXQgc2V0dXAgdGhpcyBzdG9yZXMgaXMgYWxyZWFkeSB1bm1vdW50ZWQgdGhlIHNvdXJjZSB3aWxsIGJlIG91dCBvZiBzeW5jXG5cdC8vIHNvIHdlIGp1c3QgdXNlIHRoZSBgZ2V0YCBmb3IgdGhlIHN0b3JlcywgbGVzcyBwZXJmb3JtYW50IGJ1dCBpdCBhdm9pZHMgdG8gY3JlYXRlIGEgbWVtb3J5IGxlYWtcblx0Ly8gYW5kIGl0IHdpbGwga2VlcCB0aGUgdmFsdWUgY29uc2lzdGVudFxuXHRpZiAoc3RvcmUgJiYgSVNfVU5NT1VOVEVEIGluIHN0b3Jlcykge1xuXHRcdHJldHVybiBnZXRfc3RvcmUoc3RvcmUpO1xuXHR9XG5cblx0cmV0dXJuIGdldChlbnRyeS5zb3VyY2UpO1xufVxuXG4vKipcbiAqIFVuc3Vic2NyaWJlIGZyb20gYSBzdG9yZSBpZiBpdCdzIG5vdCB0aGUgc2FtZSBhcyB0aGUgb25lIGluIHRoZSBzdG9yZSByZWZlcmVuY2VzIGNvbnRhaW5lci5cbiAqIFdlIG5lZWQgdGhpcyBpbiBhZGRpdGlvbiB0byBgc3RvcmVfZ2V0YCBiZWNhdXNlIHNvbWVvbmUgY291bGQgdW5zdWJzY3JpYmUgZnJvbSBhIHN0b3JlIGJ1dFxuICogdGhlbiBuZXZlciBzdWJzY3JpYmUgdG8gdGhlIG5ldyBvbmUgKGlmIGFueSksIGNhdXNpbmcgdGhlIHN1YnNjcmlwdGlvbiB0byBzdGF5IG9wZW4gd3JvbmdmdWxseS5cbiAqIEBwYXJhbSB7U3RvcmU8YW55PiB8IG51bGwgfCB1bmRlZmluZWR9IHN0b3JlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RvcmVfbmFtZVxuICogQHBhcmFtIHtTdG9yZVJlZmVyZW5jZXNDb250YWluZXJ9IHN0b3Jlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVfdW5zdWIoc3RvcmUsIHN0b3JlX25hbWUsIHN0b3Jlcykge1xuXHQvKiogQHR5cGUge1N0b3JlUmVmZXJlbmNlc0NvbnRhaW5lclsnJ10gfCB1bmRlZmluZWR9ICovXG5cdGxldCBlbnRyeSA9IHN0b3Jlc1tzdG9yZV9uYW1lXTtcblxuXHRpZiAoZW50cnkgJiYgZW50cnkuc3RvcmUgIT09IHN0b3JlKSB7XG5cdFx0Ly8gRG9uJ3QgcmVzZXQgc3RvcmUgeWV0LCBzbyB0aGF0IHN0b3JlX2dldCBhYm92ZSBjYW4gcmVzdWJzY3JpYmUgdG8gbmV3IHN0b3JlIGlmIG5lY2Vzc2FyeVxuXHRcdGVudHJ5LnVuc3Vic2NyaWJlKCk7XG5cdFx0ZW50cnkudW5zdWJzY3JpYmUgPSBub29wO1xuXHR9XG5cblx0cmV0dXJuIHN0b3JlO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5ldyB2YWx1ZSBvZiBhIHN0b3JlIGFuZCByZXR1cm5zIHRoYXQgdmFsdWUuXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHtTdG9yZTxWPn0gc3RvcmVcbiAqIEBwYXJhbSB7Vn0gdmFsdWVcbiAqIEByZXR1cm5zIHtWfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVfc2V0KHN0b3JlLCB2YWx1ZSkge1xuXHR1cGRhdGVfd2l0aF9mbGFnKHN0b3JlLCB2YWx1ZSk7XG5cdHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1N0b3JlUmVmZXJlbmNlc0NvbnRhaW5lcn0gc3RvcmVzXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RvcmVfbmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW52YWxpZGF0ZV9zdG9yZShzdG9yZXMsIHN0b3JlX25hbWUpIHtcblx0dmFyIGVudHJ5ID0gc3RvcmVzW3N0b3JlX25hbWVdO1xuXHRpZiAoZW50cnkuc3RvcmUgIT09IG51bGwpIHtcblx0XHRzdG9yZV9zZXQoZW50cnkuc3RvcmUsIGVudHJ5LnNvdXJjZS52KTtcblx0fVxufVxuXG4vKipcbiAqIFVuc3Vic2NyaWJlcyBmcm9tIGFsbCBhdXRvLXN1YnNjcmliZWQgc3RvcmVzIG9uIGRlc3Ryb3lcbiAqIEByZXR1cm5zIHtbU3RvcmVSZWZlcmVuY2VzQ29udGFpbmVyLCAoKT0+dm9pZF19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXR1cF9zdG9yZXMoKSB7XG5cdC8qKiBAdHlwZSB7U3RvcmVSZWZlcmVuY2VzQ29udGFpbmVyfSAqL1xuXHRjb25zdCBzdG9yZXMgPSB7fTtcblxuXHRmdW5jdGlvbiBjbGVhbnVwKCkge1xuXHRcdHRlYXJkb3duKCgpID0+IHtcblx0XHRcdGZvciAodmFyIHN0b3JlX25hbWUgaW4gc3RvcmVzKSB7XG5cdFx0XHRcdGNvbnN0IHJlZiA9IHN0b3Jlc1tzdG9yZV9uYW1lXTtcblx0XHRcdFx0cmVmLnVuc3Vic2NyaWJlKCk7XG5cdFx0XHR9XG5cdFx0XHRkZWZpbmVfcHJvcGVydHkoc3RvcmVzLCBJU19VTk1PVU5URUQsIHtcblx0XHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxuXG5cdHJldHVybiBbc3RvcmVzLCBjbGVhbnVwXTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1N0b3JlPFY+fSBzdG9yZVxuICogQHBhcmFtIHtWfSB2YWx1ZVxuICogQHRlbXBsYXRlIFZcbiAqL1xuZnVuY3Rpb24gdXBkYXRlX3dpdGhfZmxhZyhzdG9yZSwgdmFsdWUpIHtcblx0bGVnYWN5X2lzX3VwZGF0aW5nX3N0b3JlID0gdHJ1ZTtcblxuXHR0cnkge1xuXHRcdHN0b3JlLnNldCh2YWx1ZSk7XG5cdH0gZmluYWxseSB7XG5cdFx0bGVnYWN5X2lzX3VwZGF0aW5nX3N0b3JlID0gZmFsc2U7XG5cdH1cbn1cblxuLyoqXG4gKiBVcGRhdGVzIGEgc3RvcmUgd2l0aCBhIG5ldyB2YWx1ZS5cbiAqIEBwYXJhbSB7U3RvcmU8Vj59IHN0b3JlICB0aGUgc3RvcmUgdG8gdXBkYXRlXG4gKiBAcGFyYW0ge2FueX0gZXhwcmVzc2lvbiAgdGhlIGV4cHJlc3Npb24gdGhhdCBtdXRhdGVzIHRoZSBzdG9yZVxuICogQHBhcmFtIHtWfSBuZXdfdmFsdWUgIHRoZSBuZXcgc3RvcmUgdmFsdWVcbiAqIEB0ZW1wbGF0ZSBWXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZV9tdXRhdGUoc3RvcmUsIGV4cHJlc3Npb24sIG5ld192YWx1ZSkge1xuXHR1cGRhdGVfd2l0aF9mbGFnKHN0b3JlLCBuZXdfdmFsdWUpO1xuXHRyZXR1cm4gZXhwcmVzc2lvbjtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1N0b3JlPG51bWJlcj59IHN0b3JlXG4gKiBAcGFyYW0ge251bWJlcn0gc3RvcmVfdmFsdWVcbiAqIEBwYXJhbSB7MSB8IC0xfSBbZF1cbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVfc3RvcmUoc3RvcmUsIHN0b3JlX3ZhbHVlLCBkID0gMSkge1xuXHR1cGRhdGVfd2l0aF9mbGFnKHN0b3JlLCBzdG9yZV92YWx1ZSArIGQpO1xuXHRyZXR1cm4gc3RvcmVfdmFsdWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtTdG9yZTxudW1iZXI+fSBzdG9yZVxuICogQHBhcmFtIHtudW1iZXJ9IHN0b3JlX3ZhbHVlXG4gKiBAcGFyYW0gezEgfCAtMX0gW2RdXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlX3ByZV9zdG9yZShzdG9yZSwgc3RvcmVfdmFsdWUsIGQgPSAxKSB7XG5cdGNvbnN0IHZhbHVlID0gc3RvcmVfdmFsdWUgKyBkO1xuXHR1cGRhdGVfd2l0aF9mbGFnKHN0b3JlLCB2YWx1ZSk7XG5cdHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBDYWxsZWQgaW5zaWRlIHByb3AgZ2V0dGVycyB0byBjb21tdW5pY2F0ZSB0aGF0IHRoZSBwcm9wIGlzIGEgc3RvcmUgYmluZGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya19zdG9yZV9iaW5kaW5nKCkge1xuXHRpc19zdG9yZV9iaW5kaW5nID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgdHVwbGUgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBgZm4oKWAgcmVhZHMgYSBwcm9wIHRoYXQgaXMgYSBzdG9yZSBiaW5kaW5nLlxuICogVXNlZCB0byBwcmV2ZW50IGBiaW5kaW5nX3Byb3BlcnR5X25vbl9yZWFjdGl2ZWAgdmFsaWRhdGlvbiBmYWxzZSBwb3NpdGl2ZXMgYW5kXG4gKiBlbnN1cmUgdGhhdCB0aGVzZSBwcm9wcyBhcmUgdHJlYXRlZCBhcyBtdXRhYmxlIGV2ZW4gaW4gcnVuZXMgbW9kZVxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7KCkgPT4gVH0gZm5cbiAqIEByZXR1cm5zIHtbVCwgYm9vbGVhbl19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYXB0dXJlX3N0b3JlX2JpbmRpbmcoZm4pIHtcblx0dmFyIHByZXZpb3VzX2lzX3N0b3JlX2JpbmRpbmcgPSBpc19zdG9yZV9iaW5kaW5nO1xuXG5cdHRyeSB7XG5cdFx0aXNfc3RvcmVfYmluZGluZyA9IGZhbHNlO1xuXHRcdHJldHVybiBbZm4oKSwgaXNfc3RvcmVfYmluZGluZ107XG5cdH0gZmluYWxseSB7XG5cdFx0aXNfc3RvcmVfYmluZGluZyA9IHByZXZpb3VzX2lzX3N0b3JlX2JpbmRpbmc7XG5cdH1cbn1cbiIsIi8qKiBAaW1wb3J0IHsgRGVyaXZlZCwgRWZmZWN0LCBTb3VyY2UgfSBmcm9tICcuL3R5cGVzLmpzJyAqL1xuaW1wb3J0IHsgREVWIH0gZnJvbSAnZXNtLWVudic7XG5pbXBvcnQge1xuXHRQUk9QU19JU19CSU5EQUJMRSxcblx0UFJPUFNfSVNfSU1NVVRBQkxFLFxuXHRQUk9QU19JU19MQVpZX0lOSVRJQUwsXG5cdFBST1BTX0lTX1JVTkVTLFxuXHRQUk9QU19JU19VUERBVEVEXG59IGZyb20gJy4uLy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBnZXRfZGVzY3JpcHRvciwgaXNfZnVuY3Rpb24gfSBmcm9tICcuLi8uLi9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0IHsgc2V0LCBzb3VyY2UsIHVwZGF0ZSB9IGZyb20gJy4vc291cmNlcy5qcyc7XG5pbXBvcnQgeyBkZXJpdmVkLCBkZXJpdmVkX3NhZmVfZXF1YWwgfSBmcm9tICcuL2Rlcml2ZWRzLmpzJztcbmltcG9ydCB7XG5cdGFjdGl2ZV9lZmZlY3QsXG5cdGdldCxcblx0aXNfZGVzdHJveWluZ19lZmZlY3QsXG5cdHNldF9hY3RpdmVfZWZmZWN0LFxuXHR1bnRyYWNrXG59IGZyb20gJy4uL3J1bnRpbWUuanMnO1xuaW1wb3J0ICogYXMgZSBmcm9tICcuLi9lcnJvcnMuanMnO1xuaW1wb3J0IHsgREVTVFJPWUVELCBMRUdBQ1lfUFJPUFMsIFNUQVRFX1NZTUJPTCB9IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcbmltcG9ydCB7IHByb3h5IH0gZnJvbSAnLi4vcHJveHkuanMnO1xuaW1wb3J0IHsgY2FwdHVyZV9zdG9yZV9iaW5kaW5nIH0gZnJvbSAnLi9zdG9yZS5qcyc7XG5pbXBvcnQgeyBsZWdhY3lfbW9kZV9mbGFnIH0gZnJvbSAnLi4vLi4vZmxhZ3MvaW5kZXguanMnO1xuaW1wb3J0IHsgZWZmZWN0LCByZW5kZXJfZWZmZWN0IH0gZnJvbSAnLi9lZmZlY3RzLmpzJztcblxuLyoqXG4gKiBAcGFyYW0geygodmFsdWU/OiBudW1iZXIpID0+IG51bWJlcil9IGZuXG4gKiBAcGFyYW0gezEgfCAtMX0gW2RdXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlX3Byb3AoZm4sIGQgPSAxKSB7XG5cdGNvbnN0IHZhbHVlID0gZm4oKTtcblx0Zm4odmFsdWUgKyBkKTtcblx0cmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7KCh2YWx1ZT86IG51bWJlcikgPT4gbnVtYmVyKX0gZm5cbiAqIEBwYXJhbSB7MSB8IC0xfSBbZF1cbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVfcHJlX3Byb3AoZm4sIGQgPSAxKSB7XG5cdGNvbnN0IHZhbHVlID0gZm4oKSArIGQ7XG5cdGZuKHZhbHVlKTtcblx0cmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIFRoZSBwcm94eSBoYW5kbGVyIGZvciByZXN0IHByb3BzIChpLmUuIGBjb25zdCB7IHgsIC4uLnJlc3QgfSA9ICRwcm9wcygpYCkuXG4gKiBJcyBwYXNzZWQgdGhlIGZ1bGwgYCQkcHJvcHNgIG9iamVjdCBhbmQgZXhjbHVkZXMgdGhlIG5hbWVkIHByb3BzLlxuICogQHR5cGUge1Byb3h5SGFuZGxlcjx7IHByb3BzOiBSZWNvcmQ8c3RyaW5nIHwgc3ltYm9sLCB1bmtub3duPiwgZXhjbHVkZTogU2V0PHN0cmluZyB8IHN5bWJvbD4sIG5hbWU/OiBzdHJpbmcgfT59fVxuICovXG5jb25zdCByZXN0X3Byb3BzX2hhbmRsZXIgPSB7XG5cdGdldCh0YXJnZXQsIGtleSkge1xuXHRcdGlmICh0YXJnZXQuZXhjbHVkZS5oYXMoa2V5KSkgcmV0dXJuO1xuXHRcdHJldHVybiB0YXJnZXQucHJvcHNba2V5XTtcblx0fSxcblx0c2V0KHRhcmdldCwga2V5KSB7XG5cdFx0aWYgKERFVikge1xuXHRcdFx0Ly8gVE9ETyBzaG91bGQgdGhpcyBoYXBwZW4gaW4gcHJvZCB0b28/XG5cdFx0XHRlLnByb3BzX3Jlc3RfcmVhZG9ubHkoYCR7dGFyZ2V0Lm5hbWV9LiR7U3RyaW5nKGtleSl9YCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXHRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIHtcblx0XHRpZiAodGFyZ2V0LmV4Y2x1ZGUuaGFzKGtleSkpIHJldHVybjtcblx0XHRpZiAoa2V5IGluIHRhcmdldC5wcm9wcykge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxuXHRcdFx0XHR2YWx1ZTogdGFyZ2V0LnByb3BzW2tleV1cblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXHRoYXModGFyZ2V0LCBrZXkpIHtcblx0XHRpZiAodGFyZ2V0LmV4Y2x1ZGUuaGFzKGtleSkpIHJldHVybiBmYWxzZTtcblx0XHRyZXR1cm4ga2V5IGluIHRhcmdldC5wcm9wcztcblx0fSxcblx0b3duS2V5cyh0YXJnZXQpIHtcblx0XHRyZXR1cm4gUmVmbGVjdC5vd25LZXlzKHRhcmdldC5wcm9wcykuZmlsdGVyKChrZXkpID0+ICF0YXJnZXQuZXhjbHVkZS5oYXMoa2V5KSk7XG5cdH1cbn07XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gcHJvcHNcbiAqIEBwYXJhbSB7U2V0PHN0cmluZz59IGV4Y2x1ZGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZV1cbiAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn1cbiAqL1xuLyojX19OT19TSURFX0VGRkVDVFNfXyovXG5leHBvcnQgZnVuY3Rpb24gcmVzdF9wcm9wcyhwcm9wcywgZXhjbHVkZSwgbmFtZSkge1xuXHRyZXR1cm4gbmV3IFByb3h5KERFViA/IHsgcHJvcHMsIGV4Y2x1ZGUsIG5hbWUgfSA6IHsgcHJvcHMsIGV4Y2x1ZGUgfSwgcmVzdF9wcm9wc19oYW5kbGVyKTtcbn1cblxuLyoqXG4gKiBUaGUgcHJveHkgaGFuZGxlciBmb3IgbGVnYWN5ICQkcmVzdFByb3BzIGFuZCAkJHByb3BzXG4gKiBAdHlwZSB7UHJveHlIYW5kbGVyPHsgcHJvcHM6IFJlY29yZDxzdHJpbmcgfCBzeW1ib2wsIHVua25vd24+LCBleGNsdWRlOiBBcnJheTxzdHJpbmcgfCBzeW1ib2w+LCBzcGVjaWFsOiBSZWNvcmQ8c3RyaW5nIHwgc3ltYm9sLCAodj86IHVua25vd24pID0+IHVua25vd24+LCB2ZXJzaW9uOiBTb3VyY2U8bnVtYmVyPiwgcGFyZW50X2VmZmVjdDogRWZmZWN0IH0+fX1cbiAqL1xuY29uc3QgbGVnYWN5X3Jlc3RfcHJvcHNfaGFuZGxlciA9IHtcblx0Z2V0KHRhcmdldCwga2V5KSB7XG5cdFx0aWYgKHRhcmdldC5leGNsdWRlLmluY2x1ZGVzKGtleSkpIHJldHVybjtcblx0XHRnZXQodGFyZ2V0LnZlcnNpb24pO1xuXHRcdHJldHVybiBrZXkgaW4gdGFyZ2V0LnNwZWNpYWwgPyB0YXJnZXQuc3BlY2lhbFtrZXldKCkgOiB0YXJnZXQucHJvcHNba2V5XTtcblx0fSxcblx0c2V0KHRhcmdldCwga2V5LCB2YWx1ZSkge1xuXHRcdGlmICghKGtleSBpbiB0YXJnZXQuc3BlY2lhbCkpIHtcblx0XHRcdHZhciBwcmV2aW91c19lZmZlY3QgPSBhY3RpdmVfZWZmZWN0O1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRzZXRfYWN0aXZlX2VmZmVjdCh0YXJnZXQucGFyZW50X2VmZmVjdCk7XG5cblx0XHRcdFx0Ly8gSGFuZGxlIHByb3BzIHRoYXQgY2FuIHRlbXBvcmFyaWx5IGdldCBvdXQgb2Ygc3luYyB3aXRoIHRoZSBwYXJlbnRcblx0XHRcdFx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCAodj86IHVua25vd24pID0+IHVua25vd24+fSAqL1xuXHRcdFx0XHR0YXJnZXQuc3BlY2lhbFtrZXldID0gcHJvcChcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRnZXQgW2tleV0oKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB0YXJnZXQucHJvcHNba2V5XTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAoa2V5KSxcblx0XHRcdFx0XHRQUk9QU19JU19VUERBVEVEXG5cdFx0XHRcdCk7XG5cdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHRzZXRfYWN0aXZlX2VmZmVjdChwcmV2aW91c19lZmZlY3QpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRhcmdldC5zcGVjaWFsW2tleV0odmFsdWUpO1xuXHRcdHVwZGF0ZSh0YXJnZXQudmVyc2lvbik7IC8vICQkcHJvcHMgaXMgY29hcnNlLWdyYWluZWQ6IHdoZW4gJCRwcm9wcy54IGlzIHVwZGF0ZWQsIHVzYWdlcyBvZiAkJHByb3BzLnkgZXRjIGFyZSBhbHNvIHJlcnVuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cdGdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkge1xuXHRcdGlmICh0YXJnZXQuZXhjbHVkZS5pbmNsdWRlcyhrZXkpKSByZXR1cm47XG5cdFx0aWYgKGtleSBpbiB0YXJnZXQucHJvcHMpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcblx0XHRcdFx0dmFsdWU6IHRhcmdldC5wcm9wc1trZXldXG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblx0ZGVsZXRlUHJvcGVydHkodGFyZ2V0LCBrZXkpIHtcblx0XHQvLyBTdmVsdGUgNCBhbGxvd2VkIGZvciBkZWxldGlvbnMgb24gJCRyZXN0UHJvcHNcblx0XHRpZiAodGFyZ2V0LmV4Y2x1ZGUuaW5jbHVkZXMoa2V5KSkgcmV0dXJuIHRydWU7XG5cdFx0dGFyZ2V0LmV4Y2x1ZGUucHVzaChrZXkpO1xuXHRcdHVwZGF0ZSh0YXJnZXQudmVyc2lvbik7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cdGhhcyh0YXJnZXQsIGtleSkge1xuXHRcdGlmICh0YXJnZXQuZXhjbHVkZS5pbmNsdWRlcyhrZXkpKSByZXR1cm4gZmFsc2U7XG5cdFx0cmV0dXJuIGtleSBpbiB0YXJnZXQucHJvcHM7XG5cdH0sXG5cdG93bktleXModGFyZ2V0KSB7XG5cdFx0cmV0dXJuIFJlZmxlY3Qub3duS2V5cyh0YXJnZXQucHJvcHMpLmZpbHRlcigoa2V5KSA9PiAhdGFyZ2V0LmV4Y2x1ZGUuaW5jbHVkZXMoa2V5KSk7XG5cdH1cbn07XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gcHJvcHNcbiAqIEBwYXJhbSB7c3RyaW5nW119IGV4Y2x1ZGVcbiAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxlZ2FjeV9yZXN0X3Byb3BzKHByb3BzLCBleGNsdWRlKSB7XG5cdHJldHVybiBuZXcgUHJveHkoXG5cdFx0e1xuXHRcdFx0cHJvcHMsXG5cdFx0XHRleGNsdWRlLFxuXHRcdFx0c3BlY2lhbDoge30sXG5cdFx0XHR2ZXJzaW9uOiBzb3VyY2UoMCksXG5cdFx0XHQvLyBUT0RPIHRoaXMgaXMgb25seSBuZWNlc3NhcnkgYmVjYXVzZSB3ZSBuZWVkIHRvIHRyYWNrIGNvbXBvbmVudFxuXHRcdFx0Ly8gZGVzdHJ1Y3Rpb24gaW5zaWRlIGBwcm9wYCwgYmVjYXVzZSBvZiBgYmluZDp0aGlzYCwgYnV0IGl0XG5cdFx0XHQvLyBzZWVtcyBsaWtlbHkgdGhhdCB3ZSBjYW4gc2ltcGxpZnkgYGJpbmQ6dGhpc2AgaW5zdGVhZFxuXHRcdFx0cGFyZW50X2VmZmVjdDogLyoqIEB0eXBlIHtFZmZlY3R9ICovIChhY3RpdmVfZWZmZWN0KVxuXHRcdH0sXG5cdFx0bGVnYWN5X3Jlc3RfcHJvcHNfaGFuZGxlclxuXHQpO1xufVxuXG4vKipcbiAqIFRoZSBwcm94eSBoYW5kbGVyIGZvciBzcHJlYWQgcHJvcHMuIEhhbmRsZXMgdGhlIGluY29taW5nIGFycmF5IG9mIHByb3BzXG4gKiB0aGF0IGxvb2tzIGxpa2UgYCgpID0+IHsgZHluYW1pYzogcHJvcHMgfSwgeyBzdGF0aWM6IHByb3AgfSwgLi5gIGFuZCB3cmFwc1xuICogdGhlbSBzbyB0aGF0IHRoZSB3aG9sZSB0aGluZyBpcyBwYXNzZWQgdG8gdGhlIGNvbXBvbmVudCBhcyB0aGUgYCQkcHJvcHNgIGFyZ3VtZW50LlxuICogQHR5cGUge1Byb3h5SGFuZGxlcjx7IHByb3BzOiBBcnJheTxSZWNvcmQ8c3RyaW5nIHwgc3ltYm9sLCB1bmtub3duPiB8ICgoKSA9PiBSZWNvcmQ8c3RyaW5nIHwgc3ltYm9sLCB1bmtub3duPik+IH0+fX1cbiAqL1xuY29uc3Qgc3ByZWFkX3Byb3BzX2hhbmRsZXIgPSB7XG5cdGdldCh0YXJnZXQsIGtleSkge1xuXHRcdGxldCBpID0gdGFyZ2V0LnByb3BzLmxlbmd0aDtcblx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRsZXQgcCA9IHRhcmdldC5wcm9wc1tpXTtcblx0XHRcdGlmIChpc19mdW5jdGlvbihwKSkgcCA9IHAoKTtcblx0XHRcdGlmICh0eXBlb2YgcCA9PT0gJ29iamVjdCcgJiYgcCAhPT0gbnVsbCAmJiBrZXkgaW4gcCkgcmV0dXJuIHBba2V5XTtcblx0XHR9XG5cdH0sXG5cdHNldCh0YXJnZXQsIGtleSwgdmFsdWUpIHtcblx0XHRsZXQgaSA9IHRhcmdldC5wcm9wcy5sZW5ndGg7XG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0bGV0IHAgPSB0YXJnZXQucHJvcHNbaV07XG5cdFx0XHRpZiAoaXNfZnVuY3Rpb24ocCkpIHAgPSBwKCk7XG5cdFx0XHRjb25zdCBkZXNjID0gZ2V0X2Rlc2NyaXB0b3IocCwga2V5KTtcblx0XHRcdGlmIChkZXNjICYmIGRlc2Muc2V0KSB7XG5cdFx0XHRcdGRlc2Muc2V0KHZhbHVlKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblx0Z2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSB7XG5cdFx0bGV0IGkgPSB0YXJnZXQucHJvcHMubGVuZ3RoO1xuXHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdGxldCBwID0gdGFyZ2V0LnByb3BzW2ldO1xuXHRcdFx0aWYgKGlzX2Z1bmN0aW9uKHApKSBwID0gcCgpO1xuXHRcdFx0aWYgKHR5cGVvZiBwID09PSAnb2JqZWN0JyAmJiBwICE9PSBudWxsICYmIGtleSBpbiBwKSB7XG5cdFx0XHRcdGNvbnN0IGRlc2NyaXB0b3IgPSBnZXRfZGVzY3JpcHRvcihwLCBrZXkpO1xuXHRcdFx0XHRpZiAoZGVzY3JpcHRvciAmJiAhZGVzY3JpcHRvci5jb25maWd1cmFibGUpIHtcblx0XHRcdFx0XHQvLyBQcmV2ZW50IGEgXCJOb24tY29uZmlndXJhYmlsaXR5IFJlcG9ydCBFcnJvclwiOiBUaGUgdGFyZ2V0IGlzIGFuIGFycmF5LCBpdCBkb2VzXG5cdFx0XHRcdFx0Ly8gbm90IGFjdHVhbGx5IGNvbnRhaW4gdGhpcyBwcm9wZXJ0eS4gSWYgaXQgaXMgbm93IGRlc2NyaWJlZCBhcyBub24tY29uZmlndXJhYmxlLFxuXHRcdFx0XHRcdC8vIHRoZSBwcm94eSB0aHJvd3MgYSB2YWxpZGF0aW9uIGVycm9yLiBTZXR0aW5nIGl0IHRvIHRydWUgYXZvaWRzIHRoYXQuXG5cdFx0XHRcdFx0ZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBkZXNjcmlwdG9yO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0aGFzKHRhcmdldCwga2V5KSB7XG5cdFx0Ly8gVG8gcHJldmVudCBhIGZhbHNlIHBvc2l0aXZlIGBpc19lbnRyeV9wcm9wc2AgaW4gdGhlIGBwcm9wYCBmdW5jdGlvblxuXHRcdGlmIChrZXkgPT09IFNUQVRFX1NZTUJPTCB8fCBrZXkgPT09IExFR0FDWV9QUk9QUykgcmV0dXJuIGZhbHNlO1xuXG5cdFx0Zm9yIChsZXQgcCBvZiB0YXJnZXQucHJvcHMpIHtcblx0XHRcdGlmIChpc19mdW5jdGlvbihwKSkgcCA9IHAoKTtcblx0XHRcdGlmIChwICE9IG51bGwgJiYga2V5IGluIHApIHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblx0b3duS2V5cyh0YXJnZXQpIHtcblx0XHQvKiogQHR5cGUge0FycmF5PHN0cmluZyB8IHN5bWJvbD59ICovXG5cdFx0Y29uc3Qga2V5cyA9IFtdO1xuXG5cdFx0Zm9yIChsZXQgcCBvZiB0YXJnZXQucHJvcHMpIHtcblx0XHRcdGlmIChpc19mdW5jdGlvbihwKSkgcCA9IHAoKTtcblx0XHRcdGlmICghcCkgY29udGludWU7XG5cblx0XHRcdGZvciAoY29uc3Qga2V5IGluIHApIHtcblx0XHRcdFx0aWYgKCFrZXlzLmluY2x1ZGVzKGtleSkpIGtleXMucHVzaChrZXkpO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKGNvbnN0IGtleSBvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHApKSB7XG5cdFx0XHRcdGlmICgha2V5cy5pbmNsdWRlcyhrZXkpKSBrZXlzLnB1c2goa2V5KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4ga2V5cztcblx0fVxufTtcblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgKCgpID0+IFJlY29yZDxzdHJpbmcsIHVua25vd24+KT59IHByb3BzXG4gKiBAcmV0dXJucyB7YW55fVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3ByZWFkX3Byb3BzKC4uLnByb3BzKSB7XG5cdHJldHVybiBuZXcgUHJveHkoeyBwcm9wcyB9LCBzcHJlYWRfcHJvcHNfaGFuZGxlcik7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3Igc3luY2hyb25pemluZyBhIHBvc3NpYmx5IGJvdW5kIHByb3Agd2l0aCB0aGUgaW5uZXIgY29tcG9uZW50IHN0YXRlLlxuICogSXQgaXMgdXNlZCB3aGVuZXZlciB0aGUgY29tcGlsZXIgc2VlcyB0aGF0IHRoZSBjb21wb25lbnQgd3JpdGVzIHRvIHRoZSBwcm9wLCBvciB3aGVuIGl0IGhhcyBhIGRlZmF1bHQgcHJvcF92YWx1ZS5cbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBwcm9wc1xuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHBhcmFtIHtudW1iZXJ9IGZsYWdzXG4gKiBAcGFyYW0ge1YgfCAoKCkgPT4gVil9IFtmYWxsYmFja11cbiAqIEByZXR1cm5zIHsoKCkgPT4gViB8ICgoYXJnOiBWKSA9PiBWKSB8ICgoYXJnOiBWLCBtdXRhdGlvbjogYm9vbGVhbikgPT4gVikpfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvcChwcm9wcywga2V5LCBmbGFncywgZmFsbGJhY2spIHtcblx0dmFyIHJ1bmVzID0gIWxlZ2FjeV9tb2RlX2ZsYWcgfHwgKGZsYWdzICYgUFJPUFNfSVNfUlVORVMpICE9PSAwO1xuXHR2YXIgYmluZGFibGUgPSAoZmxhZ3MgJiBQUk9QU19JU19CSU5EQUJMRSkgIT09IDA7XG5cdHZhciBsYXp5ID0gKGZsYWdzICYgUFJPUFNfSVNfTEFaWV9JTklUSUFMKSAhPT0gMDtcblxuXHR2YXIgZmFsbGJhY2tfdmFsdWUgPSAvKiogQHR5cGUge1Z9ICovIChmYWxsYmFjayk7XG5cdHZhciBmYWxsYmFja19kaXJ0eSA9IHRydWU7XG5cdHZhciBmYWxsYmFja19zaWduYWwgPSAvKiogQHR5cGUge0Rlcml2ZWQ8Vj4gfCB1bmRlZmluZWR9ICovICh1bmRlZmluZWQpO1xuXG5cdHZhciBnZXRfZmFsbGJhY2sgPSAoKSA9PiB7XG5cdFx0aWYgKGxhenkgJiYgcnVuZXMpIHtcblx0XHRcdGZhbGxiYWNrX3NpZ25hbCA/Pz0gZGVyaXZlZCgvKiogQHR5cGUgeygpID0+IFZ9ICovIChmYWxsYmFjaykpO1xuXHRcdFx0cmV0dXJuIGdldChmYWxsYmFja19zaWduYWwpO1xuXHRcdH1cblxuXHRcdGlmIChmYWxsYmFja19kaXJ0eSkge1xuXHRcdFx0ZmFsbGJhY2tfZGlydHkgPSBmYWxzZTtcblxuXHRcdFx0ZmFsbGJhY2tfdmFsdWUgPSBsYXp5XG5cdFx0XHRcdD8gdW50cmFjaygvKiogQHR5cGUgeygpID0+IFZ9ICovIChmYWxsYmFjaykpXG5cdFx0XHRcdDogLyoqIEB0eXBlIHtWfSAqLyAoZmFsbGJhY2spO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxsYmFja192YWx1ZTtcblx0fTtcblxuXHQvKiogQHR5cGUgeygodjogVikgPT4gdm9pZCkgfCB1bmRlZmluZWR9ICovXG5cdGxldCBzZXR0ZXI7XG5cblx0aWYgKGJpbmRhYmxlKSB7XG5cdFx0Ly8gQ2FuIGJlIHRoZSBjYXNlIHdoZW4gc29tZW9uZSBkb2VzIGBtb3VudChDb21wb25lbnQsIHByb3BzKWAgd2l0aCBgbGV0IHByb3BzID0gJHN0YXRlKHsuLi59KWBcblx0XHQvLyBvciBgY3JlYXRlQ2xhc3NDb21wb25lbnQoQ29tcG9uZW50LCBwcm9wcylgXG5cdFx0dmFyIGlzX2VudHJ5X3Byb3BzID0gU1RBVEVfU1lNQk9MIGluIHByb3BzIHx8IExFR0FDWV9QUk9QUyBpbiBwcm9wcztcblxuXHRcdHNldHRlciA9XG5cdFx0XHRnZXRfZGVzY3JpcHRvcihwcm9wcywga2V5KT8uc2V0ID8/XG5cdFx0XHQoaXNfZW50cnlfcHJvcHMgJiYga2V5IGluIHByb3BzID8gKHYpID0+IChwcm9wc1trZXldID0gdikgOiB1bmRlZmluZWQpO1xuXHR9XG5cblx0LyoqIEB0eXBlIHtWfSAqL1xuXHR2YXIgaW5pdGlhbF92YWx1ZTtcblx0dmFyIGlzX3N0b3JlX3N1YiA9IGZhbHNlO1xuXG5cdGlmIChiaW5kYWJsZSkge1xuXHRcdFtpbml0aWFsX3ZhbHVlLCBpc19zdG9yZV9zdWJdID0gY2FwdHVyZV9zdG9yZV9iaW5kaW5nKCgpID0+IC8qKiBAdHlwZSB7Vn0gKi8gKHByb3BzW2tleV0pKTtcblx0fSBlbHNlIHtcblx0XHRpbml0aWFsX3ZhbHVlID0gLyoqIEB0eXBlIHtWfSAqLyAocHJvcHNba2V5XSk7XG5cdH1cblxuXHRpZiAoaW5pdGlhbF92YWx1ZSA9PT0gdW5kZWZpbmVkICYmIGZhbGxiYWNrICE9PSB1bmRlZmluZWQpIHtcblx0XHRpbml0aWFsX3ZhbHVlID0gZ2V0X2ZhbGxiYWNrKCk7XG5cblx0XHRpZiAoc2V0dGVyKSB7XG5cdFx0XHRpZiAocnVuZXMpIGUucHJvcHNfaW52YWxpZF92YWx1ZShrZXkpO1xuXHRcdFx0c2V0dGVyKGluaXRpYWxfdmFsdWUpO1xuXHRcdH1cblx0fVxuXG5cdC8qKiBAdHlwZSB7KCkgPT4gVn0gKi9cblx0dmFyIGdldHRlcjtcblxuXHRpZiAocnVuZXMpIHtcblx0XHRnZXR0ZXIgPSAoKSA9PiB7XG5cdFx0XHR2YXIgdmFsdWUgPSAvKiogQHR5cGUge1Z9ICovIChwcm9wc1trZXldKTtcblx0XHRcdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZ2V0X2ZhbGxiYWNrKCk7XG5cdFx0XHRmYWxsYmFja19kaXJ0eSA9IHRydWU7XG5cdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHRnZXR0ZXIgPSAoKSA9PiB7XG5cdFx0XHR2YXIgdmFsdWUgPSAvKiogQHR5cGUge1Z9ICovIChwcm9wc1trZXldKTtcblxuXHRcdFx0aWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0Ly8gaW4gbGVnYWN5IG1vZGUsIHdlIGRvbid0IHJldmVydCB0byB0aGUgZmFsbGJhY2sgdmFsdWVcblx0XHRcdFx0Ly8gaWYgdGhlIHByb3AgZ29lcyBmcm9tIGRlZmluZWQgdG8gdW5kZWZpbmVkLiBUaGUgZWFzaWVzdFxuXHRcdFx0XHQvLyB3YXkgdG8gbW9kZWwgdGhpcyBpcyB0byBtYWtlIHRoZSBmYWxsYmFjayB1bmRlZmluZWRcblx0XHRcdFx0Ly8gYXMgc29vbiBhcyB0aGUgcHJvcCBoYXMgYSB2YWx1ZVxuXHRcdFx0XHRmYWxsYmFja192YWx1ZSA9IC8qKiBAdHlwZSB7Vn0gKi8gKHVuZGVmaW5lZCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gZmFsbGJhY2tfdmFsdWUgOiB2YWx1ZTtcblx0XHR9O1xuXHR9XG5cblx0Ly8gcHJvcCBpcyBuZXZlciB3cml0dGVuIHRvIOKAlCB3ZSBvbmx5IG5lZWQgYSBnZXR0ZXJcblx0aWYgKHJ1bmVzICYmIChmbGFncyAmIFBST1BTX0lTX1VQREFURUQpID09PSAwKSB7XG5cdFx0cmV0dXJuIGdldHRlcjtcblx0fVxuXG5cdC8vIHByb3AgaXMgd3JpdHRlbiB0bywgYnV0IHRoZSBwYXJlbnQgY29tcG9uZW50IGhhZCBgYmluZDpmb29gIHdoaWNoXG5cdC8vIG1lYW5zIHdlIGNhbiBqdXN0IGNhbGwgYCQkcHJvcHMuZm9vID0gdmFsdWVgIGRpcmVjdGx5XG5cdGlmIChzZXR0ZXIpIHtcblx0XHR2YXIgbGVnYWN5X3BhcmVudCA9IHByb3BzLiQkbGVnYWN5O1xuXHRcdHJldHVybiAvKiogQHR5cGUgeygpID0+IFZ9ICovIChcblx0XHRcdGZ1bmN0aW9uICgvKiogQHR5cGUge1Z9ICovIHZhbHVlLCAvKiogQHR5cGUge2Jvb2xlYW59ICovIG11dGF0aW9uKSB7XG5cdFx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdC8vIFdlIGRvbid0IHdhbnQgdG8gbm90aWZ5IGlmIHRoZSB2YWx1ZSB3YXMgbXV0YXRlZCBhbmQgdGhlIHBhcmVudCBpcyBpbiBydW5lcyBtb2RlLlxuXHRcdFx0XHRcdC8vIEluIHRoYXQgY2FzZSB0aGUgc3RhdGUgcHJveHkgKGlmIGl0IGV4aXN0cykgc2hvdWxkIHRha2UgY2FyZSBvZiB0aGUgbm90aWZpY2F0aW9uLlxuXHRcdFx0XHRcdC8vIElmIHRoZSBwYXJlbnQgaXMgbm90IGluIHJ1bmVzIG1vZGUsIHdlIG5lZWQgdG8gbm90aWZ5IG9uIG11dGF0aW9uLCB0b28sIHRoYXQgdGhlIHByb3Bcblx0XHRcdFx0XHQvLyBoYXMgY2hhbmdlZCBiZWNhdXNlIHRoZSBwYXJlbnQgd2lsbCBub3QgYmUgYWJsZSB0byBkZXRlY3QgdGhlIGNoYW5nZSBvdGhlcndpc2UuXG5cdFx0XHRcdFx0aWYgKCFydW5lcyB8fCAhbXV0YXRpb24gfHwgbGVnYWN5X3BhcmVudCB8fCBpc19zdG9yZV9zdWIpIHtcblx0XHRcdFx0XHRcdC8qKiBAdHlwZSB7RnVuY3Rpb259ICovIChzZXR0ZXIpKG11dGF0aW9uID8gZ2V0dGVyKCkgOiB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGdldHRlcigpO1xuXHRcdFx0fVxuXHRcdCk7XG5cdH1cblxuXHQvLyBFaXRoZXIgcHJvcCBpcyB3cml0dGVuIHRvLCBidXQgdGhlcmUncyBubyBiaW5kaW5nLCB3aGljaCBtZWFucyB3ZVxuXHQvLyBjcmVhdGUgYSBkZXJpdmVkIHRoYXQgd2UgY2FuIHdyaXRlIHRvIGxvY2FsbHkuXG5cdC8vIE9yIHdlIGFyZSBpbiBsZWdhY3kgbW9kZSB3aGVyZSB3ZSBhbHdheXMgY3JlYXRlIGEgZGVyaXZlZCB0byByZXBsaWNhdGUgdGhhdFxuXHQvLyBTdmVsdGUgNCBkaWQgbm90IHRyaWdnZXIgdXBkYXRlcyB3aGVuIGEgcHJpbWl0aXZlIHZhbHVlIHdhcyB1cGRhdGVkIHRvIHRoZSBzYW1lIHZhbHVlLlxuXHR2YXIgb3ZlcnJpZGRlbiA9IGZhbHNlO1xuXG5cdHZhciBkID0gKChmbGFncyAmIFBST1BTX0lTX0lNTVVUQUJMRSkgIT09IDAgPyBkZXJpdmVkIDogZGVyaXZlZF9zYWZlX2VxdWFsKSgoKSA9PiB7XG5cdFx0b3ZlcnJpZGRlbiA9IGZhbHNlO1xuXHRcdHJldHVybiBnZXR0ZXIoKTtcblx0fSk7XG5cblx0aWYgKERFVikge1xuXHRcdGQubGFiZWwgPSBrZXk7XG5cdH1cblxuXHQvLyBDYXB0dXJlIHRoZSBpbml0aWFsIHZhbHVlIGlmIGl0J3MgYmluZGFibGVcblx0aWYgKGJpbmRhYmxlKSBnZXQoZCk7XG5cblx0dmFyIHBhcmVudF9lZmZlY3QgPSAvKiogQHR5cGUge0VmZmVjdH0gKi8gKGFjdGl2ZV9lZmZlY3QpO1xuXG5cdHJldHVybiAvKiogQHR5cGUgeygpID0+IFZ9ICovIChcblx0XHRmdW5jdGlvbiAoLyoqIEB0eXBlIHthbnl9ICovIHZhbHVlLCAvKiogQHR5cGUge2Jvb2xlYW59ICovIG11dGF0aW9uKSB7XG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Y29uc3QgbmV3X3ZhbHVlID0gbXV0YXRpb24gPyBnZXQoZCkgOiBydW5lcyAmJiBiaW5kYWJsZSA/IHByb3h5KHZhbHVlKSA6IHZhbHVlO1xuXG5cdFx0XHRcdHNldChkLCBuZXdfdmFsdWUpO1xuXHRcdFx0XHRvdmVycmlkZGVuID0gdHJ1ZTtcblxuXHRcdFx0XHRpZiAoZmFsbGJhY2tfdmFsdWUgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGZhbGxiYWNrX3ZhbHVlID0gbmV3X3ZhbHVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBzcGVjaWFsIGNhc2Ug4oCUIGF2b2lkIHJlY2FsY3VsYXRpbmcgdGhlIGRlcml2ZWQgaWYgd2UncmUgaW4gYVxuXHRcdFx0Ly8gdGVhcmRvd24gZnVuY3Rpb24gYW5kIHRoZSBwcm9wIHdhcyBvdmVycmlkZGVuIGxvY2FsbHksIG9yIHRoZVxuXHRcdFx0Ly8gY29tcG9uZW50IHdhcyBhbHJlYWR5IGRlc3Ryb3llZCAocGVvcGxlIGNvdWxkIGFjY2VzcyBwcm9wcyBpbiBhIHRpbWVvdXQpXG5cdFx0XHRpZiAoKGlzX2Rlc3Ryb3lpbmdfZWZmZWN0ICYmIG92ZXJyaWRkZW4pIHx8IChwYXJlbnRfZWZmZWN0LmYgJiBERVNUUk9ZRUQpICE9PSAwKSB7XG5cdFx0XHRcdHJldHVybiBkLnY7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBnZXQoZCk7XG5cdFx0fVxuXHQpO1xufVxuIiwiLyoqIEBpbXBvcnQgeyBCbG9ja2VyIH0gZnJvbSAnI2NsaWVudCcgKi9cbmltcG9ydCB7IGRldl9jdXJyZW50X2NvbXBvbmVudF9mdW5jdGlvbiB9IGZyb20gJy4vY29udGV4dC5qcyc7XG5pbXBvcnQgeyBGSUxFTkFNRSB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyByZW5kZXJfZWZmZWN0IH0gZnJvbSAnLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0ICogYXMgdyBmcm9tICcuL3dhcm5pbmdzLmpzJztcbmltcG9ydCB7IGNhcHR1cmVfc3RvcmVfYmluZGluZyB9IGZyb20gJy4vcmVhY3Rpdml0eS9zdG9yZS5qcyc7XG5pbXBvcnQgeyBydW5fYWZ0ZXJfYmxvY2tlcnMgfSBmcm9tICcuL3JlYWN0aXZpdHkvYXN5bmMuanMnO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBiaW5kaW5nXG4gKiBAcGFyYW0ge0Jsb2NrZXJbXX0gYmxvY2tlcnNcbiAqIEBwYXJhbSB7KCkgPT4gUmVjb3JkPHN0cmluZywgYW55Pn0gZ2V0X29iamVjdFxuICogQHBhcmFtIHsoKSA9PiBzdHJpbmd9IGdldF9wcm9wZXJ0eVxuICogQHBhcmFtIHtudW1iZXJ9IGxpbmVcbiAqIEBwYXJhbSB7bnVtYmVyfSBjb2x1bW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlX2JpbmRpbmcoYmluZGluZywgYmxvY2tlcnMsIGdldF9vYmplY3QsIGdldF9wcm9wZXJ0eSwgbGluZSwgY29sdW1uKSB7XG5cdHJ1bl9hZnRlcl9ibG9ja2VycyhibG9ja2VycywgKCkgPT4ge1xuXHRcdHZhciB3YXJuZWQgPSBmYWxzZTtcblxuXHRcdHZhciBmaWxlbmFtZSA9IGRldl9jdXJyZW50X2NvbXBvbmVudF9mdW5jdGlvbj8uW0ZJTEVOQU1FXTtcblxuXHRcdHJlbmRlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdFx0aWYgKHdhcm5lZCkgcmV0dXJuO1xuXG5cdFx0XHR2YXIgW29iamVjdCwgaXNfc3RvcmVfc3ViXSA9IGNhcHR1cmVfc3RvcmVfYmluZGluZyhnZXRfb2JqZWN0KTtcblxuXHRcdFx0aWYgKGlzX3N0b3JlX3N1YikgcmV0dXJuO1xuXG5cdFx0XHR2YXIgcHJvcGVydHkgPSBnZXRfcHJvcGVydHkoKTtcblxuXHRcdFx0dmFyIHJhbiA9IGZhbHNlO1xuXG5cdFx0XHQvLyBieSBtYWtpbmcgdGhlIChwb3NzaWJseSBmYWxzZSwgYnV0IGl0IHdvdWxkIGJlIGFuIGV4dHJlbWUgZWRnZSBjYXNlKSBhc3N1bXB0aW9uXG5cdFx0XHQvLyB0aGF0IGEgZ2V0dGVyIGhhcyBhIGNvcnJlc3BvbmRpbmcgc2V0dGVyLCB3ZSBjYW4gZGV0ZXJtaW5lIGlmIGEgcHJvcGVydHkgaXNcblx0XHRcdC8vIHJlYWN0aXZlIGJ5IHNlZWluZyBpZiB0aGlzIGVmZmVjdCBoYXMgZGVwZW5kZW5jaWVzXG5cdFx0XHR2YXIgZWZmZWN0ID0gcmVuZGVyX2VmZmVjdCgoKSA9PiB7XG5cdFx0XHRcdGlmIChyYW4pIHJldHVybjtcblxuXHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC1leHByZXNzaW9uc1xuXHRcdFx0XHRvYmplY3RbcHJvcGVydHldO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJhbiA9IHRydWU7XG5cblx0XHRcdGlmIChlZmZlY3QuZGVwcyA9PT0gbnVsbCkge1xuXHRcdFx0XHR2YXIgbG9jYXRpb24gPSBgJHtmaWxlbmFtZX06JHtsaW5lfToke2NvbHVtbn1gO1xuXHRcdFx0XHR3LmJpbmRpbmdfcHJvcGVydHlfbm9uX3JlYWN0aXZlKGJpbmRpbmcsIGxvY2F0aW9uKTtcblxuXHRcdFx0XHR3YXJuZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcbn1cbiIsImltcG9ydCB7IGNyZWF0ZUNsYXNzQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vLi4vLi4vbGVnYWN5L2xlZ2FjeS1jbGllbnQuanMnO1xuaW1wb3J0IHsgZWZmZWN0X3Jvb3QsIHJlbmRlcl9lZmZlY3QgfSBmcm9tICcuLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgYXBwZW5kIH0gZnJvbSAnLi4vdGVtcGxhdGUuanMnO1xuaW1wb3J0IHsgZGVmaW5lX3Byb3BlcnR5LCBnZXRfZGVzY3JpcHRvciwgb2JqZWN0X2tleXMgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0IHsgY3JlYXRlX2VsZW1lbnQgfSBmcm9tICcuLi9vcGVyYXRpb25zLmpzJztcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBDdXN0b21FbGVtZW50UHJvcERlZmluaXRpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYXR0cmlidXRlXVxuICogQHByb3BlcnR5IHtib29sZWFufSBbcmVmbGVjdF1cbiAqIEBwcm9wZXJ0eSB7J1N0cmluZyd8J0Jvb2xlYW4nfCdOdW1iZXInfCdBcnJheSd8J09iamVjdCd9IFt0eXBlXVxuICovXG5cbi8qKiBAdHlwZSB7YW55fSAqL1xubGV0IFN2ZWx0ZUVsZW1lbnQ7XG5cbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcblx0U3ZlbHRlRWxlbWVudCA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXHRcdC8qKiBUaGUgU3ZlbHRlIGNvbXBvbmVudCBjb25zdHJ1Y3RvciAqL1xuXHRcdCQkY3Rvcjtcblx0XHQvKiogU2xvdHMgKi9cblx0XHQkJHM7XG5cdFx0LyoqIEB0eXBlIHthbnl9IFRoZSBTdmVsdGUgY29tcG9uZW50IGluc3RhbmNlICovXG5cdFx0JCRjO1xuXHRcdC8qKiBXaGV0aGVyIG9yIG5vdCB0aGUgY3VzdG9tIGVsZW1lbnQgaXMgY29ubmVjdGVkICovXG5cdFx0JCRjbiA9IGZhbHNlO1xuXHRcdC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gQ29tcG9uZW50IHByb3BzIGRhdGEgKi9cblx0XHQkJGQgPSB7fTtcblx0XHQvKiogYHRydWVgIGlmIGN1cnJlbnRseSBpbiB0aGUgcHJvY2VzcyBvZiByZWZsZWN0aW5nIGNvbXBvbmVudCBwcm9wcyBiYWNrIHRvIGF0dHJpYnV0ZXMgKi9cblx0XHQkJHIgPSBmYWxzZTtcblx0XHQvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIEN1c3RvbUVsZW1lbnRQcm9wRGVmaW5pdGlvbj59IFByb3BzIGRlZmluaXRpb24gKG5hbWUsIHJlZmxlY3RlZCwgdHlwZSBldGMpICovXG5cdFx0JCRwX2QgPSB7fTtcblx0XHQvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3RbXT59IEV2ZW50IGxpc3RlbmVycyAqL1xuXHRcdCQkbCA9IHt9O1xuXHRcdC8qKiBAdHlwZSB7TWFwPEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3QsIEZ1bmN0aW9uPn0gRXZlbnQgbGlzdGVuZXIgdW5zdWJzY3JpYmUgZnVuY3Rpb25zICovXG5cdFx0JCRsX3UgPSBuZXcgTWFwKCk7XG5cdFx0LyoqIEB0eXBlIHthbnl9IFRoZSBtYW5hZ2VkIHJlbmRlciBlZmZlY3QgZm9yIHJlZmxlY3RpbmcgYXR0cmlidXRlcyAqL1xuXHRcdCQkbWU7XG5cdFx0LyoqIEB0eXBlIHtTaGFkb3dSb290IHwgbnVsbH0gVGhlIFNoYWRvd1Jvb3Qgb2YgdGhlIGN1c3RvbSBlbGVtZW50ICovXG5cdFx0JCRzaGFkb3dSb290ID0gbnVsbDtcblxuXHRcdC8qKlxuXHRcdCAqIEBwYXJhbSB7Kn0gJCRjb21wb25lbnRDdG9yXG5cdFx0ICogQHBhcmFtIHsqfSAkJHNsb3RzXG5cdFx0ICogQHBhcmFtIHtTaGFkb3dSb290SW5pdCB8IHVuZGVmaW5lZH0gc2hhZG93X3Jvb3RfaW5pdFxuXHRcdCAqL1xuXHRcdGNvbnN0cnVjdG9yKCQkY29tcG9uZW50Q3RvciwgJCRzbG90cywgc2hhZG93X3Jvb3RfaW5pdCkge1xuXHRcdFx0c3VwZXIoKTtcblx0XHRcdHRoaXMuJCRjdG9yID0gJCRjb21wb25lbnRDdG9yO1xuXHRcdFx0dGhpcy4kJHMgPSAkJHNsb3RzO1xuXG5cdFx0XHRpZiAoc2hhZG93X3Jvb3RfaW5pdCkge1xuXHRcdFx0XHQvLyBXZSBuZWVkIHRvIHN0b3JlIHRoZSByZWZlcmVuY2UgdG8gc2hhZG93IHJvb3QsIGJlY2F1c2UgYGNsb3NlZGAgc2hhZG93IHJvb3QgY2Fubm90IGJlXG5cdFx0XHRcdC8vIGFjY2Vzc2VkIHdpdGggYHRoaXMuc2hhZG93Um9vdGAuXG5cdFx0XHRcdHRoaXMuJCRzaGFkb3dSb290ID0gdGhpcy5hdHRhY2hTaGFkb3coc2hhZG93X3Jvb3RfaW5pdCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcblx0XHQgKiBAcGFyYW0ge0V2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3R9IGxpc3RlbmVyXG5cdFx0ICogQHBhcmFtIHtib29sZWFuIHwgQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnN9IFtvcHRpb25zXVxuXHRcdCAqL1xuXHRcdGFkZEV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIG9wdGlvbnMpIHtcblx0XHRcdC8vIFdlIGNhbid0IGRldGVybWluZSB1cGZyb250IGlmIHRoZSBldmVudCBpcyBhIGN1c3RvbSBldmVudCBvciBub3QsIHNvIHdlIGhhdmUgdG9cblx0XHRcdC8vIGxpc3RlbiB0byBib3RoLiBJZiBzb21lb25lIHVzZXMgYSBjdXN0b20gZXZlbnQgd2l0aCB0aGUgc2FtZSBuYW1lIGFzIGEgcmVndWxhclxuXHRcdFx0Ly8gYnJvd3NlciBldmVudCwgdGhpcyBmaXJlcyB0d2ljZSAtIHdlIGNhbid0IGF2b2lkIHRoYXQuXG5cdFx0XHR0aGlzLiQkbFt0eXBlXSA9IHRoaXMuJCRsW3R5cGVdIHx8IFtdO1xuXHRcdFx0dGhpcy4kJGxbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG5cdFx0XHRpZiAodGhpcy4kJGMpIHtcblx0XHRcdFx0Y29uc3QgdW5zdWIgPSB0aGlzLiQkYy4kb24odHlwZSwgbGlzdGVuZXIpO1xuXHRcdFx0XHR0aGlzLiQkbF91LnNldChsaXN0ZW5lciwgdW5zdWIpO1xuXHRcdFx0fVxuXHRcdFx0c3VwZXIuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucyk7XG5cdFx0fVxuXG5cdFx0LyoqXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcblx0XHQgKiBAcGFyYW0ge0V2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3R9IGxpc3RlbmVyXG5cdFx0ICogQHBhcmFtIHtib29sZWFuIHwgQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnN9IFtvcHRpb25zXVxuXHRcdCAqL1xuXHRcdHJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIG9wdGlvbnMpIHtcblx0XHRcdHN1cGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIG9wdGlvbnMpO1xuXHRcdFx0aWYgKHRoaXMuJCRjKSB7XG5cdFx0XHRcdGNvbnN0IHVuc3ViID0gdGhpcy4kJGxfdS5nZXQobGlzdGVuZXIpO1xuXHRcdFx0XHRpZiAodW5zdWIpIHtcblx0XHRcdFx0XHR1bnN1YigpO1xuXHRcdFx0XHRcdHRoaXMuJCRsX3UuZGVsZXRlKGxpc3RlbmVyKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGFzeW5jIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuXHRcdFx0dGhpcy4kJGNuID0gdHJ1ZTtcblx0XHRcdGlmICghdGhpcy4kJGMpIHtcblx0XHRcdFx0Ly8gV2Ugd2FpdCBvbmUgdGljayB0byBsZXQgcG9zc2libGUgY2hpbGQgc2xvdCBlbGVtZW50cyBiZSBjcmVhdGVkL21vdW50ZWRcblx0XHRcdFx0YXdhaXQgUHJvbWlzZS5yZXNvbHZlKCk7XG5cdFx0XHRcdGlmICghdGhpcy4kJGNuIHx8IHRoaXMuJCRjKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8qKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAqL1xuXHRcdFx0XHRmdW5jdGlvbiBjcmVhdGVfc2xvdChuYW1lKSB7XG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICogQHBhcmFtIHtFbGVtZW50fSBhbmNob3Jcblx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHRyZXR1cm4gKGFuY2hvcikgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3Qgc2xvdCA9IGNyZWF0ZV9lbGVtZW50KCdzbG90Jyk7XG5cdFx0XHRcdFx0XHRpZiAobmFtZSAhPT0gJ2RlZmF1bHQnKSBzbG90Lm5hbWUgPSBuYW1lO1xuXG5cdFx0XHRcdFx0XHRhcHBlbmQoYW5jaG9yLCBzbG90KTtcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gKi9cblx0XHRcdFx0Y29uc3QgJCRzbG90cyA9IHt9O1xuXHRcdFx0XHRjb25zdCBleGlzdGluZ19zbG90cyA9IGdldF9jdXN0b21fZWxlbWVudHNfc2xvdHModGhpcyk7XG5cdFx0XHRcdGZvciAoY29uc3QgbmFtZSBvZiB0aGlzLiQkcykge1xuXHRcdFx0XHRcdGlmIChuYW1lIGluIGV4aXN0aW5nX3Nsb3RzKSB7XG5cdFx0XHRcdFx0XHRpZiAobmFtZSA9PT0gJ2RlZmF1bHQnICYmICF0aGlzLiQkZC5jaGlsZHJlbikge1xuXHRcdFx0XHRcdFx0XHR0aGlzLiQkZC5jaGlsZHJlbiA9IGNyZWF0ZV9zbG90KG5hbWUpO1xuXHRcdFx0XHRcdFx0XHQkJHNsb3RzLmRlZmF1bHQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0JCRzbG90c1tuYW1lXSA9IGNyZWF0ZV9zbG90KG5hbWUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiB0aGlzLmF0dHJpYnV0ZXMpIHtcblx0XHRcdFx0XHQvLyB0aGlzLiQkZGF0YSB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgdGhpcy5hdHRyaWJ1dGVzXG5cdFx0XHRcdFx0Y29uc3QgbmFtZSA9IHRoaXMuJCRnX3AoYXR0cmlidXRlLm5hbWUpO1xuXHRcdFx0XHRcdGlmICghKG5hbWUgaW4gdGhpcy4kJGQpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLiQkZFtuYW1lXSA9IGdldF9jdXN0b21fZWxlbWVudF92YWx1ZShuYW1lLCBhdHRyaWJ1dGUudmFsdWUsIHRoaXMuJCRwX2QsICd0b1Byb3AnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gUG9ydCBvdmVyIHByb3BzIHRoYXQgd2VyZSBzZXQgcHJvZ3JhbW1hdGljYWxseSBiZWZvcmUgY2Ugd2FzIGluaXRpYWxpemVkXG5cdFx0XHRcdGZvciAoY29uc3Qga2V5IGluIHRoaXMuJCRwX2QpIHtcblx0XHRcdFx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0XHRcdFx0aWYgKCEoa2V5IGluIHRoaXMuJCRkKSAmJiB0aGlzW2tleV0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRcdFx0XHRcdFx0dGhpcy4kJGRba2V5XSA9IHRoaXNba2V5XTsgLy8gZG9uJ3QgdHJhbnNmb3JtLCB0aGVzZSB3ZXJlIHNldCB0aHJvdWdoIEphdmFTY3JpcHRcblx0XHRcdFx0XHRcdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0XHRcdFx0XHRcdGRlbGV0ZSB0aGlzW2tleV07IC8vIHJlbW92ZSB0aGUgcHJvcGVydHkgdGhhdCBzaGFkb3dzIHRoZSBnZXR0ZXIvc2V0dGVyXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuJCRjID0gY3JlYXRlQ2xhc3NDb21wb25lbnQoe1xuXHRcdFx0XHRcdGNvbXBvbmVudDogdGhpcy4kJGN0b3IsXG5cdFx0XHRcdFx0dGFyZ2V0OiB0aGlzLiQkc2hhZG93Um9vdCB8fCB0aGlzLFxuXHRcdFx0XHRcdHByb3BzOiB7XG5cdFx0XHRcdFx0XHQuLi50aGlzLiQkZCxcblx0XHRcdFx0XHRcdCQkc2xvdHMsXG5cdFx0XHRcdFx0XHQkJGhvc3Q6IHRoaXNcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdC8vIFJlZmxlY3QgY29tcG9uZW50IHByb3BzIGFzIGF0dHJpYnV0ZXNcblx0XHRcdFx0dGhpcy4kJG1lID0gZWZmZWN0X3Jvb3QoKCkgPT4ge1xuXHRcdFx0XHRcdHJlbmRlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy4kJHIgPSB0cnVlO1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCBrZXkgb2Ygb2JqZWN0X2tleXModGhpcy4kJGMpKSB7XG5cdFx0XHRcdFx0XHRcdGlmICghdGhpcy4kJHBfZFtrZXldPy5yZWZsZWN0KSBjb250aW51ZTtcblx0XHRcdFx0XHRcdFx0dGhpcy4kJGRba2V5XSA9IHRoaXMuJCRjW2tleV07XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGF0dHJpYnV0ZV92YWx1ZSA9IGdldF9jdXN0b21fZWxlbWVudF92YWx1ZShcblx0XHRcdFx0XHRcdFx0XHRrZXksXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy4kJGRba2V5XSxcblx0XHRcdFx0XHRcdFx0XHR0aGlzLiQkcF9kLFxuXHRcdFx0XHRcdFx0XHRcdCd0b0F0dHJpYnV0ZSdcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0aWYgKGF0dHJpYnV0ZV92YWx1ZSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5yZW1vdmVBdHRyaWJ1dGUodGhpcy4kJHBfZFtrZXldLmF0dHJpYnV0ZSB8fCBrZXkpO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc2V0QXR0cmlidXRlKHRoaXMuJCRwX2Rba2V5XS5hdHRyaWJ1dGUgfHwga2V5LCBhdHRyaWJ1dGVfdmFsdWUpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR0aGlzLiQkciA9IGZhbHNlO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRmb3IgKGNvbnN0IHR5cGUgaW4gdGhpcy4kJGwpIHtcblx0XHRcdFx0XHRmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMuJCRsW3R5cGVdKSB7XG5cdFx0XHRcdFx0XHRjb25zdCB1bnN1YiA9IHRoaXMuJCRjLiRvbih0eXBlLCBsaXN0ZW5lcik7XG5cdFx0XHRcdFx0XHR0aGlzLiQkbF91LnNldChsaXN0ZW5lciwgdW5zdWIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLiQkbCA9IHt9O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFdlIGRvbid0IG5lZWQgdGhpcyB3aGVuIHdvcmtpbmcgd2l0aGluIFN2ZWx0ZSBjb2RlLCBidXQgZm9yIGNvbXBhdGliaWxpdHkgb2YgcGVvcGxlIHVzaW5nIHRoaXMgb3V0c2lkZSBvZiBTdmVsdGVcblx0XHQvLyBhbmQgc2V0dGluZyBhdHRyaWJ1dGVzIHRocm91Z2ggc2V0QXR0cmlidXRlIGV0YywgdGhpcyBpcyBoZWxwZnVsXG5cblx0XHQvKipcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gYXR0clxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBfb2xkVmFsdWVcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gbmV3VmFsdWVcblx0XHQgKi9cblx0XHRhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ciwgX29sZFZhbHVlLCBuZXdWYWx1ZSkge1xuXHRcdFx0aWYgKHRoaXMuJCRyKSByZXR1cm47XG5cdFx0XHRhdHRyID0gdGhpcy4kJGdfcChhdHRyKTtcblx0XHRcdHRoaXMuJCRkW2F0dHJdID0gZ2V0X2N1c3RvbV9lbGVtZW50X3ZhbHVlKGF0dHIsIG5ld1ZhbHVlLCB0aGlzLiQkcF9kLCAndG9Qcm9wJyk7XG5cdFx0XHR0aGlzLiQkYz8uJHNldCh7IFthdHRyXTogdGhpcy4kJGRbYXR0cl0gfSk7XG5cdFx0fVxuXG5cdFx0ZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG5cdFx0XHR0aGlzLiQkY24gPSBmYWxzZTtcblx0XHRcdC8vIEluIGEgbWljcm90YXNrLCBiZWNhdXNlIHRoaXMgY291bGQgYmUgYSBtb3ZlIHdpdGhpbiB0aGUgRE9NXG5cdFx0XHRQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblx0XHRcdFx0aWYgKCF0aGlzLiQkY24gJiYgdGhpcy4kJGMpIHtcblx0XHRcdFx0XHR0aGlzLiQkYy4kZGVzdHJveSgpO1xuXHRcdFx0XHRcdHRoaXMuJCRtZSgpO1xuXHRcdFx0XHRcdHRoaXMuJCRjID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvKipcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gYXR0cmlidXRlX25hbWVcblx0XHQgKi9cblx0XHQkJGdfcChhdHRyaWJ1dGVfbmFtZSkge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0b2JqZWN0X2tleXModGhpcy4kJHBfZCkuZmluZChcblx0XHRcdFx0XHQoa2V5KSA9PlxuXHRcdFx0XHRcdFx0dGhpcy4kJHBfZFtrZXldLmF0dHJpYnV0ZSA9PT0gYXR0cmlidXRlX25hbWUgfHxcblx0XHRcdFx0XHRcdCghdGhpcy4kJHBfZFtrZXldLmF0dHJpYnV0ZSAmJiBrZXkudG9Mb3dlckNhc2UoKSA9PT0gYXR0cmlidXRlX25hbWUpXG5cdFx0XHRcdCkgfHwgYXR0cmlidXRlX25hbWVcblx0XHRcdCk7XG5cdFx0fVxuXHR9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgQ3VzdG9tRWxlbWVudFByb3BEZWZpbml0aW9uPn0gcHJvcHNfZGVmaW5pdGlvblxuICogQHBhcmFtIHsndG9BdHRyaWJ1dGUnIHwgJ3RvUHJvcCd9IFt0cmFuc2Zvcm1dXG4gKi9cbmZ1bmN0aW9uIGdldF9jdXN0b21fZWxlbWVudF92YWx1ZShwcm9wLCB2YWx1ZSwgcHJvcHNfZGVmaW5pdGlvbiwgdHJhbnNmb3JtKSB7XG5cdGNvbnN0IHR5cGUgPSBwcm9wc19kZWZpbml0aW9uW3Byb3BdPy50eXBlO1xuXHR2YWx1ZSA9IHR5cGUgPT09ICdCb29sZWFuJyAmJiB0eXBlb2YgdmFsdWUgIT09ICdib29sZWFuJyA/IHZhbHVlICE9IG51bGwgOiB2YWx1ZTtcblx0aWYgKCF0cmFuc2Zvcm0gfHwgIXByb3BzX2RlZmluaXRpb25bcHJvcF0pIHtcblx0XHRyZXR1cm4gdmFsdWU7XG5cdH0gZWxzZSBpZiAodHJhbnNmb3JtID09PSAndG9BdHRyaWJ1dGUnKSB7XG5cdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRjYXNlICdPYmplY3QnOlxuXHRcdFx0Y2FzZSAnQXJyYXknOlxuXHRcdFx0XHRyZXR1cm4gdmFsdWUgPT0gbnVsbCA/IG51bGwgOiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG5cdFx0XHRjYXNlICdCb29sZWFuJzpcblx0XHRcdFx0cmV0dXJuIHZhbHVlID8gJycgOiBudWxsO1xuXHRcdFx0Y2FzZSAnTnVtYmVyJzpcblx0XHRcdFx0cmV0dXJuIHZhbHVlID09IG51bGwgPyBudWxsIDogdmFsdWU7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0Y2FzZSAnT2JqZWN0Jzpcblx0XHRcdGNhc2UgJ0FycmF5Jzpcblx0XHRcdFx0cmV0dXJuIHZhbHVlICYmIEpTT04ucGFyc2UodmFsdWUpO1xuXHRcdFx0Y2FzZSAnQm9vbGVhbic6XG5cdFx0XHRcdHJldHVybiB2YWx1ZTsgLy8gY29udmVyc2lvbiBhbHJlYWR5IGhhbmRsZWQgYWJvdmVcblx0XHRcdGNhc2UgJ051bWJlcic6XG5cdFx0XHRcdHJldHVybiB2YWx1ZSAhPSBudWxsID8gK3ZhbHVlIDogdmFsdWU7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0fVxuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICovXG5mdW5jdGlvbiBnZXRfY3VzdG9tX2VsZW1lbnRzX3Nsb3RzKGVsZW1lbnQpIHtcblx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB0cnVlPn0gKi9cblx0Y29uc3QgcmVzdWx0ID0ge307XG5cdGVsZW1lbnQuY2hpbGROb2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG5cdFx0cmVzdWx0Wy8qKiBAdHlwZSB7RWxlbWVudH0gbm9kZSAqLyAobm9kZSkuc2xvdCB8fCAnZGVmYXVsdCddID0gdHJ1ZTtcblx0fSk7XG5cdHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQGludGVybmFsXG4gKlxuICogVHVybiBhIFN2ZWx0ZSBjb21wb25lbnQgaW50byBhIGN1c3RvbSBlbGVtZW50LlxuICogQHBhcmFtIHthbnl9IENvbXBvbmVudCAgQSBTdmVsdGUgY29tcG9uZW50IGZ1bmN0aW9uXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIEN1c3RvbUVsZW1lbnRQcm9wRGVmaW5pdGlvbj59IHByb3BzX2RlZmluaXRpb24gIFRoZSBwcm9wcyB0byBvYnNlcnZlXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBzbG90cyAgVGhlIHNsb3RzIHRvIGNyZWF0ZVxuICogQHBhcmFtIHtzdHJpbmdbXX0gZXhwb3J0cyAgRXhwbGljaXRseSBleHBvcnRlZCB2YWx1ZXMsIG90aGVyIHRoYW4gcHJvcHNcbiAqIEBwYXJhbSB7U2hhZG93Um9vdEluaXQgfCB1bmRlZmluZWR9IHNoYWRvd19yb290X2luaXQgIE9wdGlvbnMgcGFzc2VkIHRvIHNoYWRvdyBET00gY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7KGNlOiBuZXcgKCkgPT4gSFRNTEVsZW1lbnQpID0+IG5ldyAoKSA9PiBIVE1MRWxlbWVudH0gW2V4dGVuZF1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZV9jdXN0b21fZWxlbWVudChcblx0Q29tcG9uZW50LFxuXHRwcm9wc19kZWZpbml0aW9uLFxuXHRzbG90cyxcblx0ZXhwb3J0cyxcblx0c2hhZG93X3Jvb3RfaW5pdCxcblx0ZXh0ZW5kXG4pIHtcblx0bGV0IENsYXNzID0gY2xhc3MgZXh0ZW5kcyBTdmVsdGVFbGVtZW50IHtcblx0XHRjb25zdHJ1Y3RvcigpIHtcblx0XHRcdHN1cGVyKENvbXBvbmVudCwgc2xvdHMsIHNoYWRvd19yb290X2luaXQpO1xuXHRcdFx0dGhpcy4kJHBfZCA9IHByb3BzX2RlZmluaXRpb247XG5cdFx0fVxuXHRcdHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuXHRcdFx0cmV0dXJuIG9iamVjdF9rZXlzKHByb3BzX2RlZmluaXRpb24pLm1hcCgoa2V5KSA9PlxuXHRcdFx0XHQocHJvcHNfZGVmaW5pdGlvbltrZXldLmF0dHJpYnV0ZSB8fCBrZXkpLnRvTG93ZXJDYXNlKClcblx0XHRcdCk7XG5cdFx0fVxuXHR9O1xuXHRvYmplY3Rfa2V5cyhwcm9wc19kZWZpbml0aW9uKS5mb3JFYWNoKChwcm9wKSA9PiB7XG5cdFx0ZGVmaW5lX3Byb3BlcnR5KENsYXNzLnByb3RvdHlwZSwgcHJvcCwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy4kJGMgJiYgcHJvcCBpbiB0aGlzLiQkYyA/IHRoaXMuJCRjW3Byb3BdIDogdGhpcy4kJGRbcHJvcF07XG5cdFx0XHR9LFxuXHRcdFx0c2V0KHZhbHVlKSB7XG5cdFx0XHRcdHZhbHVlID0gZ2V0X2N1c3RvbV9lbGVtZW50X3ZhbHVlKHByb3AsIHZhbHVlLCBwcm9wc19kZWZpbml0aW9uKTtcblx0XHRcdFx0dGhpcy4kJGRbcHJvcF0gPSB2YWx1ZTtcblx0XHRcdFx0dmFyIGNvbXBvbmVudCA9IHRoaXMuJCRjO1xuXG5cdFx0XHRcdGlmIChjb21wb25lbnQpIHtcblx0XHRcdFx0XHQvLyAvLyBJZiB0aGUgaW5zdGFuY2UgaGFzIGFuIGFjY2Vzc29yLCB1c2UgdGhhdCBpbnN0ZWFkXG5cdFx0XHRcdFx0dmFyIHNldHRlciA9IGdldF9kZXNjcmlwdG9yKGNvbXBvbmVudCwgcHJvcCk/LmdldDtcblxuXHRcdFx0XHRcdGlmIChzZXR0ZXIpIHtcblx0XHRcdFx0XHRcdGNvbXBvbmVudFtwcm9wXSA9IHZhbHVlO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjb21wb25lbnQuJHNldCh7IFtwcm9wXTogdmFsdWUgfSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXHRleHBvcnRzLmZvckVhY2goKHByb3BlcnR5KSA9PiB7XG5cdFx0ZGVmaW5lX3Byb3BlcnR5KENsYXNzLnByb3RvdHlwZSwgcHJvcGVydHksIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuJCRjPy5bcHJvcGVydHldO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblx0aWYgKGV4dGVuZCkge1xuXHRcdC8vIEB0cy1leHBlY3QtZXJyb3IgLSBhc3NpZ25pbmcgaGVyZSBpcyBmaW5lXG5cdFx0Q2xhc3MgPSBleHRlbmQoQ2xhc3MpO1xuXHR9XG5cdENvbXBvbmVudC5lbGVtZW50ID0gLyoqIEB0eXBlIHthbnl9ICovIENsYXNzO1xuXHRyZXR1cm4gQ2xhc3M7XG59XG4iLCJpbXBvcnQgeyBTVEFURV9TWU1CT0wgfSBmcm9tICcjY2xpZW50L2NvbnN0YW50cyc7XG5pbXBvcnQgeyBzbmFwc2hvdCB9IGZyb20gJy4uLy4uL3NoYXJlZC9jbG9uZS5qcyc7XG5pbXBvcnQgKiBhcyB3IGZyb20gJy4uL3dhcm5pbmdzLmpzJztcbmltcG9ydCB7IHVudHJhY2sgfSBmcm9tICcuLi9ydW50aW1lLmpzJztcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kXG4gKiBAcGFyYW0gIHsuLi5hbnl9IG9iamVjdHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvZ19pZl9jb250YWluc19zdGF0ZShtZXRob2QsIC4uLm9iamVjdHMpIHtcblx0dW50cmFjaygoKSA9PiB7XG5cdFx0dHJ5IHtcblx0XHRcdGxldCBoYXNfc3RhdGUgPSBmYWxzZTtcblx0XHRcdGNvbnN0IHRyYW5zZm9ybWVkID0gW107XG5cblx0XHRcdGZvciAoY29uc3Qgb2JqIG9mIG9iamVjdHMpIHtcblx0XHRcdFx0aWYgKG9iaiAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiBTVEFURV9TWU1CT0wgaW4gb2JqKSB7XG5cdFx0XHRcdFx0dHJhbnNmb3JtZWQucHVzaChzbmFwc2hvdChvYmosIHRydWUpKTtcblx0XHRcdFx0XHRoYXNfc3RhdGUgPSB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRyYW5zZm9ybWVkLnB1c2gob2JqKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoaGFzX3N0YXRlKSB7XG5cdFx0XHRcdHcuY29uc29sZV9sb2dfc3RhdGUobWV0aG9kKTtcblxuXHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdFx0XHRjb25zb2xlLmxvZygnJWNbc25hcHNob3RdJywgJ2NvbG9yOiBncmV5JywgLi4udHJhbnNmb3JtZWQpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2gge1xuXHRcdFx0Ly8gRXJyb3JzIGNhbiBvY2N1ciB3aGVuIHRyeWluZyB0byBzbmFwc2hvdCBvYmplY3RzIHdpdGggZ2V0dGVycyB0aGF0IHRocm93IG9yIG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXMuXG5cdFx0fVxuXHR9KTtcblxuXHRyZXR1cm4gb2JqZWN0cztcbn1cbiIsImltcG9ydCB7IGFzeW5jX21vZGVfZmxhZyB9IGZyb20gJy4uL2ZsYWdzL2luZGV4LmpzJztcbmltcG9ydCB7IGh5ZHJhdGluZyB9IGZyb20gJy4vZG9tL2h5ZHJhdGlvbi5qcyc7XG5pbXBvcnQgKiBhcyB3IGZyb20gJy4vd2FybmluZ3MuanMnO1xuaW1wb3J0ICogYXMgZSBmcm9tICcuL2Vycm9ycy5qcyc7XG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHBhcmFtIHsoKSA9PiBUfSBmblxuICogQHJldHVybnMge1R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoeWRyYXRhYmxlKGtleSwgZm4pIHtcblx0aWYgKCFhc3luY19tb2RlX2ZsYWcpIHtcblx0XHRlLmV4cGVyaW1lbnRhbF9hc3luY19yZXF1aXJlZCgnaHlkcmF0YWJsZScpO1xuXHR9XG5cblx0aWYgKGh5ZHJhdGluZykge1xuXHRcdGNvbnN0IHN0b3JlID0gd2luZG93Ll9fc3ZlbHRlPy5oO1xuXG5cdFx0aWYgKHN0b3JlPy5oYXMoa2V5KSkge1xuXHRcdFx0cmV0dXJuIC8qKiBAdHlwZSB7VH0gKi8gKHN0b3JlLmdldChrZXkpKTtcblx0XHR9XG5cblx0XHRpZiAoREVWKSB7XG5cdFx0XHRlLmh5ZHJhdGFibGVfbWlzc2luZ19idXRfcmVxdWlyZWQoa2V5KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dy5oeWRyYXRhYmxlX21pc3NpbmdfYnV0X2V4cGVjdGVkKGtleSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGZuKCk7XG59XG4iLCIvKiogQGltcG9ydCB7IENvbXBvbmVudENvbnRleHQsIENvbXBvbmVudENvbnRleHRMZWdhY3kgfSBmcm9tICcjY2xpZW50JyAqL1xuLyoqIEBpbXBvcnQgeyBFdmVudERpc3BhdGNoZXIgfSBmcm9tICcuL2luZGV4LmpzJyAqL1xuLyoqIEBpbXBvcnQgeyBOb3RGdW5jdGlvbiB9IGZyb20gJy4vaW50ZXJuYWwvdHlwZXMuanMnICovXG5pbXBvcnQgeyBhY3RpdmVfcmVhY3Rpb24sIHVudHJhY2sgfSBmcm9tICcuL2ludGVybmFsL2NsaWVudC9ydW50aW1lLmpzJztcbmltcG9ydCB7IGlzX2FycmF5IH0gZnJvbSAnLi9pbnRlcm5hbC9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0IHsgdXNlcl9lZmZlY3QgfSBmcm9tICcuL2ludGVybmFsL2NsaWVudC9pbmRleC5qcyc7XG5pbXBvcnQgKiBhcyBlIGZyb20gJy4vaW50ZXJuYWwvY2xpZW50L2Vycm9ycy5qcyc7XG5pbXBvcnQgeyBsZWdhY3lfbW9kZV9mbGFnIH0gZnJvbSAnLi9pbnRlcm5hbC9mbGFncy9pbmRleC5qcyc7XG5pbXBvcnQgeyBjb21wb25lbnRfY29udGV4dCB9IGZyb20gJy4vaW50ZXJuYWwvY2xpZW50L2NvbnRleHQuanMnO1xuaW1wb3J0IHsgREVWIH0gZnJvbSAnZXNtLWVudic7XG5cbmlmIChERVYpIHtcblx0LyoqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBydW5lXG5cdCAqL1xuXHRmdW5jdGlvbiB0aHJvd19ydW5lX2Vycm9yKHJ1bmUpIHtcblx0XHRpZiAoIShydW5lIGluIGdsb2JhbFRoaXMpKSB7XG5cdFx0XHQvLyBUT0RPIGlmIHBlb3BsZSBzdGFydCBhZGp1c3RpbmcgdGhlIFwidGhpcyBjYW4gY29udGFpbiBydW5lc1wiIGNvbmZpZyB0aHJvdWdoIHYtcC1zIG1vcmUsIGFkanVzdCB0aGlzIG1lc3NhZ2Vcblx0XHRcdC8qKiBAdHlwZSB7YW55fSAqL1xuXHRcdFx0bGV0IHZhbHVlOyAvLyBsZXQncyBob3BlIG5vIG9uZSBtb2RpZmllcyB0aGlzIGdsb2JhbCwgYnV0IGJlbHRzIGFuZCBicmFjZXNcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShnbG9iYWxUaGlzLCBydW5lLCB7XG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcblx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGdldHRlci1yZXR1cm5cblx0XHRcdFx0Z2V0OiAoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRlLnJ1bmVfb3V0c2lkZV9zdmVsdGUocnVuZSk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNldDogKHYpID0+IHtcblx0XHRcdFx0XHR2YWx1ZSA9IHY7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdHRocm93X3J1bmVfZXJyb3IoJyRzdGF0ZScpO1xuXHR0aHJvd19ydW5lX2Vycm9yKCckZWZmZWN0Jyk7XG5cdHRocm93X3J1bmVfZXJyb3IoJyRkZXJpdmVkJyk7XG5cdHRocm93X3J1bmVfZXJyb3IoJyRpbnNwZWN0Jyk7XG5cdHRocm93X3J1bmVfZXJyb3IoJyRwcm9wcycpO1xuXHR0aHJvd19ydW5lX2Vycm9yKCckYmluZGFibGUnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIFtgQWJvcnRTaWduYWxgXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQWJvcnRTaWduYWwpIHRoYXQgYWJvcnRzIHdoZW4gdGhlIGN1cnJlbnQgW2Rlcml2ZWRdKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL3N2ZWx0ZS8kZGVyaXZlZCkgb3IgW2VmZmVjdF0oaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3Mvc3ZlbHRlLyRlZmZlY3QpIHJlLXJ1bnMgb3IgaXMgZGVzdHJveWVkLlxuICpcbiAqIE11c3QgYmUgY2FsbGVkIHdoaWxlIGEgZGVyaXZlZCBvciBlZmZlY3QgaXMgcnVubmluZy5cbiAqXG4gKiBgYGBzdmVsdGVcbiAqIDxzY3JpcHQ+XG4gKiBcdGltcG9ydCB7IGdldEFib3J0U2lnbmFsIH0gZnJvbSAnc3ZlbHRlJztcbiAqXG4gKiBcdGxldCB7IGlkIH0gPSAkcHJvcHMoKTtcbiAqXG4gKiBcdGFzeW5jIGZ1bmN0aW9uIGdldERhdGEoaWQpIHtcbiAqIFx0XHRjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAvaXRlbXMvJHtpZH1gLCB7XG4gKiBcdFx0XHRzaWduYWw6IGdldEFib3J0U2lnbmFsKClcbiAqIFx0XHR9KTtcbiAqXG4gKiBcdFx0cmV0dXJuIGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAqIFx0fVxuICpcbiAqIFx0Y29uc3QgZGF0YSA9ICRkZXJpdmVkKGF3YWl0IGdldERhdGEoaWQpKTtcbiAqIDwvc2NyaXB0PlxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBYm9ydFNpZ25hbCgpIHtcblx0aWYgKGFjdGl2ZV9yZWFjdGlvbiA9PT0gbnVsbCkge1xuXHRcdGUuZ2V0X2Fib3J0X3NpZ25hbF9vdXRzaWRlX3JlYWN0aW9uKCk7XG5cdH1cblxuXHRyZXR1cm4gKGFjdGl2ZV9yZWFjdGlvbi5hYyA/Pz0gbmV3IEFib3J0Q29udHJvbGxlcigpKS5zaWduYWw7XG59XG5cbi8qKlxuICogYG9uTW91bnRgLCBsaWtlIFtgJGVmZmVjdGBdKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL3N2ZWx0ZS8kZWZmZWN0KSwgc2NoZWR1bGVzIGEgZnVuY3Rpb24gdG8gcnVuIGFzIHNvb24gYXMgdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBtb3VudGVkIHRvIHRoZSBET00uXG4gKiBVbmxpa2UgYCRlZmZlY3RgLCB0aGUgcHJvdmlkZWQgZnVuY3Rpb24gb25seSBydW5zIG9uY2UuXG4gKlxuICogSXQgbXVzdCBiZSBjYWxsZWQgZHVyaW5nIHRoZSBjb21wb25lbnQncyBpbml0aWFsaXNhdGlvbiAoYnV0IGRvZXNuJ3QgbmVlZCB0byBsaXZlIF9pbnNpZGVfIHRoZSBjb21wb25lbnQ7XG4gKiBpdCBjYW4gYmUgY2FsbGVkIGZyb20gYW4gZXh0ZXJuYWwgbW9kdWxlKS4gSWYgYSBmdW5jdGlvbiBpcyByZXR1cm5lZCBfc3luY2hyb25vdXNseV8gZnJvbSBgb25Nb3VudGAsXG4gKiBpdCB3aWxsIGJlIGNhbGxlZCB3aGVuIHRoZSBjb21wb25lbnQgaXMgdW5tb3VudGVkLlxuICpcbiAqIGBvbk1vdW50YCBmdW5jdGlvbnMgZG8gbm90IHJ1biBkdXJpbmcgW3NlcnZlci1zaWRlIHJlbmRlcmluZ10oaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3Mvc3ZlbHRlL3N2ZWx0ZS1zZXJ2ZXIjcmVuZGVyKS5cbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHsoKSA9PiBOb3RGdW5jdGlvbjxUPiB8IFByb21pc2U8Tm90RnVuY3Rpb248VD4+IHwgKCgpID0+IGFueSl9IGZuXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uTW91bnQoZm4pIHtcblx0aWYgKGNvbXBvbmVudF9jb250ZXh0ID09PSBudWxsKSB7XG5cdFx0ZS5saWZlY3ljbGVfb3V0c2lkZV9jb21wb25lbnQoJ29uTW91bnQnKTtcblx0fVxuXG5cdGlmIChsZWdhY3lfbW9kZV9mbGFnICYmIGNvbXBvbmVudF9jb250ZXh0LmwgIT09IG51bGwpIHtcblx0XHRpbml0X3VwZGF0ZV9jYWxsYmFja3MoY29tcG9uZW50X2NvbnRleHQpLm0ucHVzaChmbik7XG5cdH0gZWxzZSB7XG5cdFx0dXNlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdFx0Y29uc3QgY2xlYW51cCA9IHVudHJhY2soZm4pO1xuXHRcdFx0aWYgKHR5cGVvZiBjbGVhbnVwID09PSAnZnVuY3Rpb24nKSByZXR1cm4gLyoqIEB0eXBlIHsoKSA9PiB2b2lkfSAqLyAoY2xlYW51cCk7XG5cdFx0fSk7XG5cdH1cbn1cblxuLyoqXG4gKiBTY2hlZHVsZXMgYSBjYWxsYmFjayB0byBydW4gaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBjb21wb25lbnQgaXMgdW5tb3VudGVkLlxuICpcbiAqIE91dCBvZiBgb25Nb3VudGAsIGBiZWZvcmVVcGRhdGVgLCBgYWZ0ZXJVcGRhdGVgIGFuZCBgb25EZXN0cm95YCwgdGhpcyBpcyB0aGVcbiAqIG9ubHkgb25lIHRoYXQgcnVucyBpbnNpZGUgYSBzZXJ2ZXItc2lkZSBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHsoKSA9PiBhbnl9IGZuXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uRGVzdHJveShmbikge1xuXHRpZiAoY29tcG9uZW50X2NvbnRleHQgPT09IG51bGwpIHtcblx0XHRlLmxpZmVjeWNsZV9vdXRzaWRlX2NvbXBvbmVudCgnb25EZXN0cm95Jyk7XG5cdH1cblxuXHRvbk1vdW50KCgpID0+ICgpID0+IHVudHJhY2soZm4pKTtcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgW1Q9YW55XVxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7VH0gW2RldGFpbF1cbiAqIEBwYXJhbSB7YW55fXBhcmFtc18wXG4gKiBAcmV0dXJucyB7Q3VzdG9tRXZlbnQ8VD59XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZV9jdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsLCB7IGJ1YmJsZXMgPSBmYWxzZSwgY2FuY2VsYWJsZSA9IGZhbHNlIH0gPSB7fSkge1xuXHRyZXR1cm4gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHsgZGV0YWlsLCBidWJibGVzLCBjYW5jZWxhYmxlIH0pO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gZXZlbnQgZGlzcGF0Y2hlciB0aGF0IGNhbiBiZSB1c2VkIHRvIGRpc3BhdGNoIFtjb21wb25lbnQgZXZlbnRzXShodHRwczovL3N2ZWx0ZS5kZXYvZG9jcy9zdmVsdGUvbGVnYWN5LW9uI0NvbXBvbmVudC1ldmVudHMpLlxuICogRXZlbnQgZGlzcGF0Y2hlcnMgYXJlIGZ1bmN0aW9ucyB0aGF0IGNhbiB0YWtlIHR3byBhcmd1bWVudHM6IGBuYW1lYCBhbmQgYGRldGFpbGAuXG4gKlxuICogQ29tcG9uZW50IGV2ZW50cyBjcmVhdGVkIHdpdGggYGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcmAgY3JlYXRlIGFcbiAqIFtDdXN0b21FdmVudF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0N1c3RvbUV2ZW50KS5cbiAqIFRoZXNlIGV2ZW50cyBkbyBub3QgW2J1YmJsZV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9MZWFybi9KYXZhU2NyaXB0L0J1aWxkaW5nX2Jsb2Nrcy9FdmVudHMjRXZlbnRfYnViYmxpbmdfYW5kX2NhcHR1cmUpLlxuICogVGhlIGBkZXRhaWxgIGFyZ3VtZW50IGNvcnJlc3BvbmRzIHRvIHRoZSBbQ3VzdG9tRXZlbnQuZGV0YWlsXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ3VzdG9tRXZlbnQvZGV0YWlsKVxuICogcHJvcGVydHkgYW5kIGNhbiBjb250YWluIGFueSB0eXBlIG9mIGRhdGEuXG4gKlxuICogVGhlIGV2ZW50IGRpc3BhdGNoZXIgY2FuIGJlIHR5cGVkIHRvIG5hcnJvdyB0aGUgYWxsb3dlZCBldmVudCBuYW1lcyBhbmQgdGhlIHR5cGUgb2YgdGhlIGBkZXRhaWxgIGFyZ3VtZW50OlxuICogYGBgdHNcbiAqIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyPHtcbiAqICBsb2FkZWQ6IG51bGw7IC8vIGRvZXMgbm90IHRha2UgYSBkZXRhaWwgYXJndW1lbnRcbiAqICBjaGFuZ2U6IHN0cmluZzsgLy8gdGFrZXMgYSBkZXRhaWwgYXJndW1lbnQgb2YgdHlwZSBzdHJpbmcsIHdoaWNoIGlzIHJlcXVpcmVkXG4gKiAgb3B0aW9uYWw6IG51bWJlciB8IG51bGw7IC8vIHRha2VzIGFuIG9wdGlvbmFsIGRldGFpbCBhcmd1bWVudCBvZiB0eXBlIG51bWJlclxuICogfT4oKTtcbiAqIGBgYFxuICpcbiAqIEBkZXByZWNhdGVkIFVzZSBjYWxsYmFjayBwcm9wcyBhbmQvb3IgdGhlIGAkaG9zdCgpYCBydW5lIGluc3RlYWQg4oCUIHNlZSBbbWlncmF0aW9uIGd1aWRlXShodHRwczovL3N2ZWx0ZS5kZXYvZG9jcy9zdmVsdGUvdjUtbWlncmF0aW9uLWd1aWRlI0V2ZW50LWNoYW5nZXMtQ29tcG9uZW50LWV2ZW50cylcbiAqIEB0ZW1wbGF0ZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gW0V2ZW50TWFwID0gYW55XVxuICogQHJldHVybnMge0V2ZW50RGlzcGF0Y2hlcjxFdmVudE1hcD59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFdmVudERpc3BhdGNoZXIoKSB7XG5cdGNvbnN0IGFjdGl2ZV9jb21wb25lbnRfY29udGV4dCA9IGNvbXBvbmVudF9jb250ZXh0O1xuXHRpZiAoYWN0aXZlX2NvbXBvbmVudF9jb250ZXh0ID09PSBudWxsKSB7XG5cdFx0ZS5saWZlY3ljbGVfb3V0c2lkZV9jb21wb25lbnQoJ2NyZWF0ZUV2ZW50RGlzcGF0Y2hlcicpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBwYXJhbSBbZGV0YWlsXVxuXHQgKiBAcGFyYW0gW29wdGlvbnNdXG5cdCAqL1xuXHRyZXR1cm4gKHR5cGUsIGRldGFpbCwgb3B0aW9ucykgPT4ge1xuXHRcdGNvbnN0IGV2ZW50cyA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgRnVuY3Rpb24gfCBGdW5jdGlvbltdPn0gKi8gKFxuXHRcdFx0YWN0aXZlX2NvbXBvbmVudF9jb250ZXh0LnMuJCRldmVudHNcblx0XHQpPy5bLyoqIEB0eXBlIHtzdHJpbmd9ICovICh0eXBlKV07XG5cblx0XHRpZiAoZXZlbnRzKSB7XG5cdFx0XHRjb25zdCBjYWxsYmFja3MgPSBpc19hcnJheShldmVudHMpID8gZXZlbnRzLnNsaWNlKCkgOiBbZXZlbnRzXTtcblx0XHRcdC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcblx0XHRcdC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cblx0XHRcdGNvbnN0IGV2ZW50ID0gY3JlYXRlX2N1c3RvbV9ldmVudCgvKiogQHR5cGUge3N0cmluZ30gKi8gKHR5cGUpLCBkZXRhaWwsIG9wdGlvbnMpO1xuXHRcdFx0Zm9yIChjb25zdCBmbiBvZiBjYWxsYmFja3MpIHtcblx0XHRcdFx0Zm4uY2FsbChhY3RpdmVfY29tcG9uZW50X2NvbnRleHQueCwgZXZlbnQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuICFldmVudC5kZWZhdWx0UHJldmVudGVkO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xufVxuXG4vLyBUT0RPIG1hcmsgYmVmb3JlVXBkYXRlIGFuZCBhZnRlclVwZGF0ZSBhcyBkZXByZWNhdGVkIGluIFN2ZWx0ZSA2XG5cbi8qKlxuICogU2NoZWR1bGVzIGEgY2FsbGJhY2sgdG8gcnVuIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIHVwZGF0ZWQgYWZ0ZXIgYW55IHN0YXRlIGNoYW5nZS5cbiAqXG4gKiBUaGUgZmlyc3QgdGltZSB0aGUgY2FsbGJhY2sgcnVucyB3aWxsIGJlIGJlZm9yZSB0aGUgaW5pdGlhbCBgb25Nb3VudGAuXG4gKlxuICogSW4gcnVuZXMgbW9kZSB1c2UgYCRlZmZlY3QucHJlYCBpbnN0ZWFkLlxuICpcbiAqIEBkZXByZWNhdGVkIFVzZSBbYCRlZmZlY3QucHJlYF0oaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3Mvc3ZlbHRlLyRlZmZlY3QjJGVmZmVjdC5wcmUpIGluc3RlYWRcbiAqIEBwYXJhbSB7KCkgPT4gdm9pZH0gZm5cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmVmb3JlVXBkYXRlKGZuKSB7XG5cdGlmIChjb21wb25lbnRfY29udGV4dCA9PT0gbnVsbCkge1xuXHRcdGUubGlmZWN5Y2xlX291dHNpZGVfY29tcG9uZW50KCdiZWZvcmVVcGRhdGUnKTtcblx0fVxuXG5cdGlmIChjb21wb25lbnRfY29udGV4dC5sID09PSBudWxsKSB7XG5cdFx0ZS5saWZlY3ljbGVfbGVnYWN5X29ubHkoJ2JlZm9yZVVwZGF0ZScpO1xuXHR9XG5cblx0aW5pdF91cGRhdGVfY2FsbGJhY2tzKGNvbXBvbmVudF9jb250ZXh0KS5iLnB1c2goZm4pO1xufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBhIGNhbGxiYWNrIHRvIHJ1biBpbW1lZGlhdGVseSBhZnRlciB0aGUgY29tcG9uZW50IGhhcyBiZWVuIHVwZGF0ZWQuXG4gKlxuICogVGhlIGZpcnN0IHRpbWUgdGhlIGNhbGxiYWNrIHJ1bnMgd2lsbCBiZSBhZnRlciB0aGUgaW5pdGlhbCBgb25Nb3VudGAuXG4gKlxuICogSW4gcnVuZXMgbW9kZSB1c2UgYCRlZmZlY3RgIGluc3RlYWQuXG4gKlxuICogQGRlcHJlY2F0ZWQgVXNlIFtgJGVmZmVjdGBdKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL3N2ZWx0ZS8kZWZmZWN0KSBpbnN0ZWFkXG4gKiBAcGFyYW0geygpID0+IHZvaWR9IGZuXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyVXBkYXRlKGZuKSB7XG5cdGlmIChjb21wb25lbnRfY29udGV4dCA9PT0gbnVsbCkge1xuXHRcdGUubGlmZWN5Y2xlX291dHNpZGVfY29tcG9uZW50KCdhZnRlclVwZGF0ZScpO1xuXHR9XG5cblx0aWYgKGNvbXBvbmVudF9jb250ZXh0LmwgPT09IG51bGwpIHtcblx0XHRlLmxpZmVjeWNsZV9sZWdhY3lfb25seSgnYWZ0ZXJVcGRhdGUnKTtcblx0fVxuXG5cdGluaXRfdXBkYXRlX2NhbGxiYWNrcyhjb21wb25lbnRfY29udGV4dCkuYS5wdXNoKGZuKTtcbn1cblxuLyoqXG4gKiBMZWdhY3ktbW9kZTogSW5pdCBjYWxsYmFja3Mgb2JqZWN0IGZvciBvbk1vdW50L2JlZm9yZVVwZGF0ZS9hZnRlclVwZGF0ZVxuICogQHBhcmFtIHtDb21wb25lbnRDb250ZXh0fSBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGluaXRfdXBkYXRlX2NhbGxiYWNrcyhjb250ZXh0KSB7XG5cdHZhciBsID0gLyoqIEB0eXBlIHtDb21wb25lbnRDb250ZXh0TGVnYWN5fSAqLyAoY29udGV4dCkubDtcblx0cmV0dXJuIChsLnUgPz89IHsgYTogW10sIGI6IFtdLCBtOiBbXSB9KTtcbn1cblxuZXhwb3J0IHsgZmx1c2hTeW5jLCBmb3JrIH0gZnJvbSAnLi9pbnRlcm5hbC9jbGllbnQvcmVhY3Rpdml0eS9iYXRjaC5qcyc7XG5leHBvcnQge1xuXHRjcmVhdGVDb250ZXh0LFxuXHRnZXRDb250ZXh0LFxuXHRnZXRBbGxDb250ZXh0cyxcblx0aGFzQ29udGV4dCxcblx0c2V0Q29udGV4dFxufSBmcm9tICcuL2ludGVybmFsL2NsaWVudC9jb250ZXh0LmpzJztcbmV4cG9ydCB7IGh5ZHJhdGFibGUgfSBmcm9tICcuL2ludGVybmFsL2NsaWVudC9oeWRyYXRhYmxlLmpzJztcbmV4cG9ydCB7IGh5ZHJhdGUsIG1vdW50LCB1bm1vdW50IH0gZnJvbSAnLi9pbnRlcm5hbC9jbGllbnQvcmVuZGVyLmpzJztcbmV4cG9ydCB7IHRpY2ssIHVudHJhY2ssIHNldHRsZWQgfSBmcm9tICcuL2ludGVybmFsL2NsaWVudC9ydW50aW1lLmpzJztcbmV4cG9ydCB7IGNyZWF0ZVJhd1NuaXBwZXQgfSBmcm9tICcuL2ludGVybmFsL2NsaWVudC9kb20vYmxvY2tzL3NuaXBwZXQuanMnO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2QkEsU0FBZ0Isc0JBQXNCO0NBQ3JDLE9BQU8sT0FBTyxjQUFjO0FBQzdCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnRUEsU0FBZ0IsV0FBVyxRQUFRLEtBQTZCLE1BQU87Q0FDdEUsUUFBUSxZQUFZO0VBQ25CLE1BQU0sRUFBRSxRQUFRLFlBQVksY0FBYyxPQUFPLFNBQVMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBRXJFLElBQUksUUFBUTtHQUNYLElBQUksTUFBTTtHQUNWLG9CQUFvQjtJQUNuQixNQUFNLE1BQU0sR0FBRztJQUNmLElBQUksS0FBSyxPQUFPLEdBQUc7R0FDcEIsQ0FBQztHQUNELE1BQU07RUFDUDtFQUVBLElBQUksU0FDSCxTQUFTLE9BQU87Q0FFbEI7QUFDRDs7Ozs7Ozs7O0FDcEdBLFNBQVMsUUFBUSxHQUFHLEdBQUcsVUFBVSxVQUFVO0NBQzFDLElBQUksTUFBTSxLQUFLLE9BQU8sTUFBTSxZQUFZLGdCQUFnQixHQUN2RCx1QkFBeUIsVUFBaUMsa0JBQWtCLFFBQVEsQ0FBRTtDQUd2RixPQUFPO0FBQ1I7Ozs7Ozs7O0FBU0EsU0FBZ0IsT0FBTyxRQUFRLFVBQVUsVUFBVSxLQUFLLFVBQVU7Q0FDakUsT0FBTyxRQUNOLGFBQWEsTUFDVCxPQUFPLFlBQVksTUFDcEIsYUFBYSxRQUNYLE9BQU8sY0FBYyxJQUFJLElBQzFCLGFBQWEsUUFDWCxPQUFPLGNBQWMsSUFBSSxJQUMxQixhQUFhLFFBQ1gsT0FBTyxjQUFj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YUEsU0FBZ0IsWUFBWSxJQUFJO0NBQy9CLElBQUksc0JBQXNCLE1BQ3pCLDRCQUE4QixhQUFhO0NBRzVDLElBQUksa0JBQWtCLE1BQU0sTUFDM0Isc0JBQXdCLGFBQWE7Q0FHdEMsc0JBQXNCLGlCQUFpQixDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUU7QUFDbkQ7Ozs7O0FBTUEsU0FBUyxzQkFBc0IsU0FBUztDQUN2QyxJQUFJLElBQTJDLFFBQVM7Q0FDeEQsT0FBUSxFQUFFLE1BQU07RUFBRSxHQUFHLENBQUM7RUFBRyxHQUFHLENBQUM7RUFBRyxHQUFHLENBQUM7Q0FBRTtBQUN2QyIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMiwzLDQsNSw2LDcsOCw5LDEwLDExLDEyLDEzLDE0LDE1LDE2LDE3LDE4LDE5LDIwLDIxLDIyLDIzLDI0LDI1LDI2LDI3LDI4LDI5LDMwLDMxLDMyLDMzLDM0LDM1LDM2LDM3LDM4LDM5LDQwLDQxLDQyLDQzLDQ0LDQ1LDQ2LDQ3LDQ4LDQ5LDUwLDUxLDUyLDUzXX0=