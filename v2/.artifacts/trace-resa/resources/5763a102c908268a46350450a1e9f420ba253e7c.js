import "/node_modules/.vite/deps/esm-env-D8Yi5ac9.js?v=70f5904f";
import { d as hydration_mismatch, n as await_reactivity_loss, o as derived_inert, r as await_waterfall, v as state_proxy_equality_mismatch } from "/node_modules/.vite/deps/warnings-BCxPSjeg.js?v=70f5904f";
import { a as legacy_mode_flag, o as tracing_mode_flag, t as async_mode_flag } from "/node_modules/.vite/deps/flags-qfBdqUK7.js?v=70f5904f";
// node_modules/svelte/src/internal/shared/utils.js
var is_array = Array.isArray;
var index_of = Array.prototype.indexOf;
var includes = Array.prototype.includes;
var array_from = Array.from;
var object_keys = Object.keys;
var define_property = Object.defineProperty;
var get_descriptor = Object.getOwnPropertyDescriptor;
var get_descriptors = Object.getOwnPropertyDescriptors;
var object_prototype = Object.prototype;
var array_prototype = Array.prototype;
var get_prototype_of = Object.getPrototypeOf;
var is_extensible = Object.isExtensible;
var has_own_property = Object.prototype.hasOwnProperty;
/**
* @param {any} thing
* @returns {thing is Function}
*/
function is_function(thing) {
	return typeof thing === "function";
}
var noop = () => {};
/**
* @template [T=any]
* @param {any} value
* @returns {value is PromiseLike<T>}
*/
function is_promise(value) {
	return typeof value?.then === "function";
}
/** @param {Function} fn */
function run$1(fn) {
	return fn();
}
/** @param {Array<() => void>} arr */
function run_all(arr) {
	for (var i = 0; i < arr.length; i++) arr[i]();
}
/**
* TODO replace with Promise.withResolvers once supported widely enough
* @template [T=void]
*/
function deferred() {
	/** @type {(value: T) => void} */
	var resolve;
	/** @type {(reason: any) => void} */
	var reject;
	return {
		promise: new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		}),
		resolve,
		reject
	};
}
/**
* @template V
* @param {V} value
* @param {V | (() => V)} fallback
* @param {boolean} [lazy]
* @returns {V}
*/
function fallback(value, fallback, lazy = false) {
	return value === void 0 ? lazy ? fallback() : fallback : value;
}
/**
* When encountering a situation like `let [a, b, c] = $derived(blah())`,
* we need to stash an intermediate value that `a`, `b`, and `c` derive
* from, in case it's an iterable
* @template T
* @param {ArrayLike<T> | Iterable<T>} value
* @param {number} [n]
* @returns {Array<T>}
*/
function to_array(value, n) {
	if (Array.isArray(value)) return value;
	if (n === void 0 || !(Symbol.iterator in value)) return Array.from(value);
	/** @type {T[]} */
	const array = [];
	for (const element of value) {
		array.push(element);
		if (array.length === n) break;
	}
	return array;
}
/**
* @param {Record<string | symbol, unknown>} obj
* @param {Array<string | symbol>} keys
* @returns {Record<string | symbol, unknown>}
*/
function exclude_from_object(obj, keys) {
	/** @type {Record<string | symbol, unknown>} */
	var result = {};
	for (var key in obj) if (!keys.includes(key)) result[key] = obj[key];
	for (var symbol of Object.getOwnPropertySymbols(obj)) if (Object.propertyIsEnumerable.call(obj, symbol) && !keys.includes(symbol)) result[symbol] = obj[symbol];
	return result;
}
// node_modules/svelte/src/internal/client/constants.js
/**
* An effect that does not destroy its child effects when it reruns.
* Runs as part of render effects, i.e. not eagerly as part of tree traversal or effect flushing.
*/
var MANAGED_EFFECT = 1 << 24;
var CLEAN = 1024;
var DIRTY = 2048;
var MAYBE_DIRTY = 4096;
var INERT = 8192;
var DESTROYED = 16384;
/** Set once a reaction has run for the first time */
var REACTION_RAN = 32768;
/** Effect is in the process of getting destroyed. Can be observed in child teardown functions */
var DESTROYING = 1 << 25;
/**
* 'Transparent' effects do not create a transition boundary.
* This is on a block effect 99% of the time but may also be on a branch effect if its parent block effect was pruned
*/
var EFFECT_TRANSPARENT = 65536;
var EAGER_EFFECT = 1 << 17;
var HEAD_EFFECT = 1 << 18;
var EFFECT_PRESERVED = 1 << 19;
var USER_EFFECT = 1 << 20;
var EFFECT_OFFSCREEN = 1 << 25;
var REACTION_IS_UPDATING = 1 << 21;
var ASYNC = 1 << 22;
var ERROR_VALUE = 1 << 23;
var STATE_SYMBOL = Symbol("$state");
/** Marks component export objects, so that `proxy(...)` leaves them untouched */
var COMPONENT_SYMBOL = Symbol("component");
var LEGACY_PROPS = Symbol("legacy props");
var LOADING_ATTR_SYMBOL = Symbol("");
var PROXY_PATH_SYMBOL = Symbol("proxy path");
var ATTRIBUTES_CACHE = Symbol("attributes");
var CLASS_CACHE = Symbol("class");
var STYLE_CACHE = Symbol("style");
var TEXT_CACHE = Symbol("text");
var FORM_RESET_HANDLER = Symbol("form reset");
/** An anchor might change, via this symbol on the original anchor we can tell HMR about the updated anchor */
var HMR_ANCHOR = Symbol("hmr anchor");
/** allow users to ignore aborted signal errors if `reason.name === 'StaleReactionError` */
var STALE_REACTION = new class StaleReactionError extends Error {
	name = "StaleReactionError";
	message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}();
var IS_XHTML = !!globalThis.document?.contentType && /* @__PURE__ */ globalThis.document.contentType.includes("xml");
// node_modules/svelte/src/constants.js
var HYDRATION_ERROR = {};
var UNINITIALIZED = Symbol("uninitialized");
var FILENAME = Symbol("filename");
var HMR = Symbol("hmr");
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var NAMESPACE_SVG = "http://www.w3.org/2000/svg";
var NAMESPACE_MATHML = "http://www.w3.org/1998/Math/MathML";
var ATTACHMENT_KEY = "@attach";
// node_modules/svelte/src/internal/client/dom/hydration.js
/** @import { TemplateNode } from '#client' */
/**
* Use this variable to guard everything related to hydration code so it can be treeshaken out
* if the user doesn't use the `hydrate` method and these code paths are therefore not needed.
*/
var hydrating = false;
/** @param {boolean} value */
function set_hydrating(value) {
	hydrating = value;
}
/**
* The node that is currently being hydrated. This starts out as the first node inside the opening
* <!--[--> comment, and updates each time a component calls `$.child(...)` or `$.sibling(...)`.
* When entering a block (e.g. `{#if ...}`), `hydrate_node` is the block opening comment; by the
* time we leave the block it is the closing comment, which serves as the block's anchor.
* @type {TemplateNode}
*/
var hydrate_node;
/** @param {TemplateNode | null} node */
function set_hydrate_node(node) {
	if (node === null) {
		hydration_mismatch();
		throw HYDRATION_ERROR;
	}
	return hydrate_node = node;
}
function hydrate_next() {
	return set_hydrate_node(/* @__PURE__ */ get_next_sibling(hydrate_node));
}
/** @param {TemplateNode} node */
function reset(node) {
	if (!hydrating) return;
	if (/* @__PURE__ */ get_next_sibling(hydrate_node) !== null) {
		hydration_mismatch();
		throw HYDRATION_ERROR;
	}
	hydrate_node = node;
}
/**
* @param {HTMLTemplateElement} template
*/
function hydrate_template(template) {
	if (hydrating) hydrate_node = template.content;
}
function next(count = 1) {
	if (hydrating) {
		var i = count;
		var node = hydrate_node;
		while (i--) node = /* @__PURE__ */ get_next_sibling(node);
		hydrate_node = node;
	}
}
/**
* Skips or removes (depending on {@link remove}) all nodes starting at `hydrate_node` up until the next hydration end comment
* @param {boolean} remove
*/
function skip_nodes(remove = true) {
	var depth = 0;
	var node = hydrate_node;
	while (true) {
		if (node.nodeType === 8) {
			var data = node.data;
			if (data === "]") {
				if (depth === 0) return node;
				depth -= 1;
			} else if (data === "[" || data === "[!" || data[0] === "[" && !isNaN(Number(data.slice(1)))) depth += 1;
		}
		var next = /* @__PURE__ */ get_next_sibling(node);
		if (remove) node.remove();
		node = next;
	}
}
/**
*
* @param {TemplateNode} node
*/
function read_hydration_instruction(node) {
	if (!node || node.nodeType !== 8) {
		hydration_mismatch();
		throw HYDRATION_ERROR;
	}
	return node.data;
}
// node_modules/svelte/src/internal/client/reactivity/equality.js
/** @import { Equals } from '#client' */
/** @type {Equals} */
function equals$1(value) {
	return value === this.v;
}
/**
* @param {unknown} a
* @param {unknown} b
* @returns {boolean}
*/
function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || a !== null && typeof a === "object" || typeof a === "function";
}
/** @type {Equals} */
function safe_equals(value) {
	return !safe_not_equal(value, this.v);
}
// node_modules/svelte/src/internal/shared/errors.js
/**
* Cannot use `%name%(...)` unless the `experimental.async` compiler option is `true`
* @param {string} name
* @returns {never}
*/
function experimental_async_required(name) {
	{
		const error = /* @__PURE__ */ new Error(`experimental_async_required\nCannot use \`${name}(...)\` unless the \`experimental.async\` compiler option is \`true\`\nhttps://svelte.dev/e/experimental_async_required`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Cannot use `{@render children(...)}` if the parent component uses `let:` directives. Consider using a named snippet instead
* @returns {never}
*/
function invalid_default_snippet() {
	{
		const error = /* @__PURE__ */ new Error(`invalid_default_snippet\nCannot use \`{@render children(...)}\` if the parent component uses \`let:\` directives. Consider using a named snippet instead\nhttps://svelte.dev/e/invalid_default_snippet`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* A snippet function was passed invalid arguments. Snippets should only be instantiated via `{@render ...}`
* @returns {never}
*/
function invalid_snippet_arguments() {
	{
		const error = /* @__PURE__ */ new Error(`invalid_snippet_arguments\nA snippet function was passed invalid arguments. Snippets should only be instantiated via \`{@render ...}\`\nhttps://svelte.dev/e/invalid_snippet_arguments`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* An invariant violation occurred, meaning Svelte's internal assumptions were flawed. This is a bug in Svelte, not your app — please open an issue at https://github.com/sveltejs/svelte, citing the following message: "%message%"
* @param {string} message
* @returns {never}
*/
function invariant_violation(message) {
	{
		const error = /* @__PURE__ */ new Error(`invariant_violation\nAn invariant violation occurred, meaning Svelte's internal assumptions were flawed. This is a bug in Svelte, not your app — please open an issue at https://github.com/sveltejs/svelte, citing the following message: "${message}"\nhttps://svelte.dev/e/invariant_violation`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* `%name%(...)` can only be used during component initialisation
* @param {string} name
* @returns {never}
*/
function lifecycle_outside_component(name) {
	{
		const error = /* @__PURE__ */ new Error(`lifecycle_outside_component\n\`${name}(...)\` can only be used during component initialisation\nhttps://svelte.dev/e/lifecycle_outside_component`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Context was not set in the current component or any of its ancestors
* @returns {never}
*/
function missing_context() {
	{
		const error = /* @__PURE__ */ new Error(`missing_context\nContext was not set in the current component or any of its ancestors\nhttps://svelte.dev/e/missing_context`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* `setContext` must be called when a component first initializes, not in a subsequent effect or after an `await` expression
* @returns {never}
*/
function set_context_after_init() {
	{
		const error = /* @__PURE__ */ new Error(`set_context_after_init\n\`setContext\` must be called when a component first initializes, not in a subsequent effect or after an \`await\` expression\nhttps://svelte.dev/e/set_context_after_init`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Attempted to render a snippet without a `{@render}` block. This would cause the snippet code to be stringified instead of its content being rendered to the DOM. To fix this, change `{snippet}` to `{@render snippet()}`.
* @returns {never}
*/
function snippet_without_render_tag() {
	{
		const error = /* @__PURE__ */ new Error(`snippet_without_render_tag\nAttempted to render a snippet without a \`{@render}\` block. This would cause the snippet code to be stringified instead of its content being rendered to the DOM. To fix this, change \`{snippet}\` to \`{@render snippet()}\`.\nhttps://svelte.dev/e/snippet_without_render_tag`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* `%name%` is not a store with a `subscribe` method
* @param {string} name
* @returns {never}
*/
function store_invalid_shape(name) {
	{
		const error = /* @__PURE__ */ new Error(`store_invalid_shape\n\`${name}\` is not a store with a \`subscribe\` method\nhttps://svelte.dev/e/store_invalid_shape`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* The `this` prop on `<svelte:element>` must be a string, if defined
* @returns {never}
*/
function svelte_element_invalid_this_value() {
	{
		const error = /* @__PURE__ */ new Error(`svelte_element_invalid_this_value\nThe \`this\` prop on \`<svelte:element>\` must be a string, if defined\nhttps://svelte.dev/e/svelte_element_invalid_this_value`);
		error.name = "Svelte error";
		throw error;
	}
}
// node_modules/svelte/src/internal/client/errors.js
/**
* Cannot create a `$derived(...)` with an `await` expression outside of an effect tree
* @returns {never}
*/
function async_derived_orphan() {
	{
		const error = /* @__PURE__ */ new Error(`async_derived_orphan\nCannot create a \`$derived(...)\` with an \`await\` expression outside of an effect tree\nhttps://svelte.dev/e/async_derived_orphan`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Using `bind:value` together with a checkbox input is not allowed. Use `bind:checked` instead
* @returns {never}
*/
function bind_invalid_checkbox_value() {
	{
		const error = /* @__PURE__ */ new Error(`bind_invalid_checkbox_value\nUsing \`bind:value\` together with a checkbox input is not allowed. Use \`bind:checked\` instead\nhttps://svelte.dev/e/bind_invalid_checkbox_value`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Calling `%method%` on a component instance (of %component%) is no longer valid in Svelte 5
* @param {string} method
* @param {string} component
* @returns {never}
*/
function component_api_changed(method, component) {
	{
		const error = /* @__PURE__ */ new Error(`component_api_changed\nCalling \`${method}\` on a component instance (of ${component}) is no longer valid in Svelte 5\nhttps://svelte.dev/e/component_api_changed`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Attempted to instantiate %component% with `new %name%`, which is no longer valid in Svelte 5. If this component is not under your control, set the `compatibility.componentApi` compiler option to `4` to keep it working.
* @param {string} component
* @param {string} name
* @returns {never}
*/
function component_api_invalid_new(component, name) {
	{
		const error = /* @__PURE__ */ new Error(`component_api_invalid_new\nAttempted to instantiate ${component} with \`new ${name}\`, which is no longer valid in Svelte 5. If this component is not under your control, set the \`compatibility.componentApi\` compiler option to \`4\` to keep it working.\nhttps://svelte.dev/e/component_api_invalid_new`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* A derived value cannot reference itself recursively
* @returns {never}
*/
function derived_references_self() {
	{
		const error = /* @__PURE__ */ new Error(`derived_references_self\nA derived value cannot reference itself recursively\nhttps://svelte.dev/e/derived_references_self`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Keyed each block has duplicate key `%value%` at indexes %a% and %b%
* @param {string} a
* @param {string} b
* @param {string | undefined | null} [value]
* @returns {never}
*/
function each_key_duplicate(a, b, value) {
	{
		const error = /* @__PURE__ */ new Error(`each_key_duplicate\n${value ? `Keyed each block has duplicate key \`${value}\` at indexes ${a} and ${b}` : `Keyed each block has duplicate key at indexes ${a} and ${b}`}\nhttps://svelte.dev/e/each_key_duplicate`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Keyed each block has key that is not idempotent — the key for item at index %index% was `%a%` but is now `%b%`. Keys must be the same each time for a given item
* @param {string} index
* @param {string} a
* @param {string} b
* @returns {never}
*/
function each_key_volatile(index, a, b) {
	{
		const error = /* @__PURE__ */ new Error(`each_key_volatile\nKeyed each block has key that is not idempotent — the key for item at index ${index} was \`${a}\` but is now \`${b}\`. Keys must be the same each time for a given item\nhttps://svelte.dev/e/each_key_volatile`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* `%rune%` cannot be used inside an effect cleanup function
* @param {string} rune
* @returns {never}
*/
function effect_in_teardown(rune) {
	{
		const error = /* @__PURE__ */ new Error(`effect_in_teardown\n\`${rune}\` cannot be used inside an effect cleanup function\nhttps://svelte.dev/e/effect_in_teardown`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Effect cannot be created inside a `$derived` value that was not itself created inside an effect
* @returns {never}
*/
function effect_in_unowned_derived() {
	{
		const error = /* @__PURE__ */ new Error(`effect_in_unowned_derived\nEffect cannot be created inside a \`$derived\` value that was not itself created inside an effect\nhttps://svelte.dev/e/effect_in_unowned_derived`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* `%rune%` can only be used inside an effect (e.g. during component initialisation)
* @param {string} rune
* @returns {never}
*/
function effect_orphan(rune) {
	{
		const error = /* @__PURE__ */ new Error(`effect_orphan\n\`${rune}\` can only be used inside an effect (e.g. during component initialisation)\nhttps://svelte.dev/e/effect_orphan`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* `$effect.pending()` can only be called inside an effect or derived
* @returns {never}
*/
function effect_pending_outside_reaction() {
	{
		const error = /* @__PURE__ */ new Error(`effect_pending_outside_reaction\n\`$effect.pending()\` can only be called inside an effect or derived\nhttps://svelte.dev/e/effect_pending_outside_reaction`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Maximum update depth exceeded. This typically indicates that an effect reads and writes the same piece of state
* @returns {never}
*/
function effect_update_depth_exceeded() {
	{
		const error = /* @__PURE__ */ new Error(`effect_update_depth_exceeded\nMaximum update depth exceeded. This typically indicates that an effect reads and writes the same piece of state\nhttps://svelte.dev/e/effect_update_depth_exceeded`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Cannot commit a fork that was already discarded
* @returns {never}
*/
function fork_discarded() {
	{
		const error = /* @__PURE__ */ new Error(`fork_discarded\nCannot commit a fork that was already discarded\nhttps://svelte.dev/e/fork_discarded`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Cannot create a fork inside an effect or when state changes are pending
* @returns {never}
*/
function fork_timing() {
	{
		const error = /* @__PURE__ */ new Error(`fork_timing\nCannot create a fork inside an effect or when state changes are pending\nhttps://svelte.dev/e/fork_timing`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* `getAbortSignal()` can only be called inside an effect or derived
* @returns {never}
*/
function get_abort_signal_outside_reaction() {
	{
		const error = /* @__PURE__ */ new Error(`get_abort_signal_outside_reaction\n\`getAbortSignal()\` can only be called inside an effect or derived\nhttps://svelte.dev/e/get_abort_signal_outside_reaction`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Expected to find a hydratable with key `%key%` during hydration, but did not.
* @param {string} key
* @returns {never}
*/
function hydratable_missing_but_required(key) {
	{
		const error = /* @__PURE__ */ new Error(`hydratable_missing_but_required\nExpected to find a hydratable with key \`${key}\` during hydration, but did not.\nhttps://svelte.dev/e/hydratable_missing_but_required`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Failed to hydrate the application
* @returns {never}
*/
function hydration_failed() {
	{
		const error = /* @__PURE__ */ new Error(`hydration_failed\nFailed to hydrate the application\nhttps://svelte.dev/e/hydration_failed`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Could not `{@render}` snippet due to the expression being `null` or `undefined`. Consider using optional chaining `{@render snippet?.()}`
* @returns {never}
*/
function invalid_snippet() {
	{
		const error = /* @__PURE__ */ new Error(`invalid_snippet\nCould not \`{@render}\` snippet due to the expression being \`null\` or \`undefined\`. Consider using optional chaining \`{@render snippet?.()}\`\nhttps://svelte.dev/e/invalid_snippet`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* `%name%(...)` cannot be used in runes mode
* @param {string} name
* @returns {never}
*/
function lifecycle_legacy_only(name) {
	{
		const error = /* @__PURE__ */ new Error(`lifecycle_legacy_only\n\`${name}(...)\` cannot be used in runes mode\nhttps://svelte.dev/e/lifecycle_legacy_only`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Cannot do `bind:%key%={undefined}` when `%key%` has a fallback value
* @param {string} key
* @returns {never}
*/
function props_invalid_value(key) {
	{
		const error = /* @__PURE__ */ new Error(`props_invalid_value\nCannot do \`bind:${key}={undefined}\` when \`${key}\` has a fallback value\nhttps://svelte.dev/e/props_invalid_value`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Rest element properties of `$props()` such as `%property%` are readonly
* @param {string} property
* @returns {never}
*/
function props_rest_readonly(property) {
	{
		const error = /* @__PURE__ */ new Error(`props_rest_readonly\nRest element properties of \`$props()\` such as \`${property}\` are readonly\nhttps://svelte.dev/e/props_rest_readonly`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* The `%rune%` rune is only available inside `.svelte` and `.svelte.js/ts` files
* @param {string} rune
* @returns {never}
*/
function rune_outside_svelte(rune) {
	{
		const error = /* @__PURE__ */ new Error(`rune_outside_svelte\nThe \`${rune}\` rune is only available inside \`.svelte\` and \`.svelte.js/ts\` files\nhttps://svelte.dev/e/rune_outside_svelte`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Property descriptors defined on `$state` objects must contain `value` and always be `enumerable`, `configurable` and `writable`.
* @returns {never}
*/
function state_descriptors_fixed() {
	{
		const error = /* @__PURE__ */ new Error(`state_descriptors_fixed\nProperty descriptors defined on \`$state\` objects must contain \`value\` and always be \`enumerable\`, \`configurable\` and \`writable\`.\nhttps://svelte.dev/e/state_descriptors_fixed`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Cannot set prototype of `$state` object
* @returns {never}
*/
function state_prototype_fixed() {
	{
		const error = /* @__PURE__ */ new Error(`state_prototype_fixed\nCannot set prototype of \`$state\` object\nhttps://svelte.dev/e/state_prototype_fixed`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* Updating state inside `$derived(...)`, `$inspect(...)` or a template expression is forbidden. If the value should not be reactive, declare it without `$state`
* @returns {never}
*/
function state_unsafe_mutation() {
	{
		const error = /* @__PURE__ */ new Error(`state_unsafe_mutation\nUpdating state inside \`$derived(...)\`, \`$inspect(...)\` or a template expression is forbidden. If the value should not be reactive, declare it without \`$state\`\nhttps://svelte.dev/e/state_unsafe_mutation`);
		error.name = "Svelte error";
		throw error;
	}
}
/**
* A `<svelte:boundary>` `reset` function cannot be called while an error is still being handled
* @returns {never}
*/
function svelte_boundary_reset_onerror() {
	{
		const error = /* @__PURE__ */ new Error(`svelte_boundary_reset_onerror\nA \`<svelte:boundary>\` \`reset\` function cannot be called while an error is still being handled\nhttps://svelte.dev/e/svelte_boundary_reset_onerror`);
		error.name = "Svelte error";
		throw error;
	}
}
// node_modules/svelte/src/internal/shared/warnings.js
var bold = "font-weight: bold";
var normal = "font-weight: normal";
/**
* `<svelte:element this="%tag%">` is a void element — it cannot have content
* @param {string} tag
*/
function dynamic_void_element_content(tag) {
	console.warn(`%c[svelte] dynamic_void_element_content\n%c\`<svelte:element this="${tag}">\` is a void element — it cannot have content\nhttps://svelte.dev/e/dynamic_void_element_content`, bold, normal);
}
/**
* The following properties cannot be cloned with `$state.snapshot` — the return value contains the originals:
* 
* %properties%
* @param {string | undefined | null} [properties]
*/
function state_snapshot_uncloneable(properties) {
	console.warn(`%c[svelte] state_snapshot_uncloneable\n%c${properties ? `The following properties cannot be cloned with \`$state.snapshot\` — the return value contains the originals:

${properties}` : "Value cannot be cloned with `$state.snapshot` — the original value was returned"}\nhttps://svelte.dev/e/state_snapshot_uncloneable`, bold, normal);
}
// node_modules/svelte/src/internal/shared/clone.js
/** @import { Snapshot } from './types' */
/**
* In dev, we keep track of which properties could not be cloned. In prod
* we don't bother, but we keep a dummy array around so that the
* signature stays the same
* @type {string[]}
*/
var empty = [];
/**
* @template T
* @param {T} value
* @param {boolean} [skip_warning]
* @param {boolean} [no_tojson]
* @returns {Snapshot<T>}
*/
function snapshot(value, skip_warning = false, no_tojson = false) {
	if (!skip_warning) {
		/** @type {string[]} */
		const paths = [];
		const copy = clone(value, /* @__PURE__ */ new Map(), "", paths, null, no_tojson);
		if (paths.length === 1 && paths[0] === "") state_snapshot_uncloneable();
		else if (paths.length > 0) {
			const slice = paths.length > 10 ? paths.slice(0, 7) : paths.slice(0, 10);
			const excess = paths.length - slice.length;
			let uncloned = slice.map((path) => `- <value>${path}`).join("\n");
			if (excess > 0) uncloned += `\n- ...and ${excess} more`;
			state_snapshot_uncloneable(uncloned);
		}
		return copy;
	}
	return clone(value, /* @__PURE__ */ new Map(), "", empty, null, no_tojson);
}
/**
* @template T
* @param {T} value
* @param {Map<T, Snapshot<T>>} cloned
* @param {string} path
* @param {string[]} paths
* @param {null | T} [original] The original value, if `value` was produced from a `toJSON` call
* @param {boolean} [no_tojson]
* @returns {Snapshot<T>}
*/
function clone(value, cloned, path, paths, original = null, no_tojson = false) {
	if (typeof value === "object" && value !== null) {
		var unwrapped = cloned.get(value);
		if (unwrapped !== void 0) return unwrapped;
		if (value instanceof Map) return new Map(value);
		if (value instanceof Set) return new Set(value);
		if (is_array(value)) {
			var copy = Array(value.length);
			cloned.set(value, copy);
			if (original !== null) cloned.set(original, copy);
			for (var i = 0; i < value.length; i += 1) {
				var element = value[i];
				if (i in value) copy[i] = clone(element, cloned, `${path}[${i}]`, paths, null, no_tojson);
			}
			return copy;
		}
		if (get_prototype_of(value) === object_prototype) {
			/** @type {Snapshot<any>} */
			copy = {};
			cloned.set(value, copy);
			if (original !== null) cloned.set(original, copy);
			for (var key of Object.keys(value)) copy[key] = clone(value[key], cloned, `${path}.${key}`, paths, null, no_tojson);
			return copy;
		}
		if (value instanceof Date) {
			value.getTime();
			return structuredClone(value);
		}
		if (typeof value.toJSON === "function" && !no_tojson) return clone(
			/** @type {T & { toJSON(): any } } */
			value.toJSON(),
			cloned,
			`${path}.toJSON()`,
			paths,
			value
		);
	}
	if (value instanceof EventTarget) return value;
	try {
		return structuredClone(value);
	} catch (e) {
		paths.push(path);
		return value;
	}
}
// node_modules/svelte/src/internal/client/dev/tracing.js
/** @import { Derived, Reaction, Value } from '#client' */
/**
* @typedef {{
*   traces: Error[];
* }} TraceEntry
*/
/** @type {{ reaction: Reaction | null, entries: Map<Value, TraceEntry> } | null} */
var tracing_expressions = null;
/**
* @param {Value} signal
* @param {TraceEntry} [entry]
*/
function log_entry(signal, entry) {
	const value = signal.v;
	if (value === UNINITIALIZED) return;
	const type = get_type(signal);
	const current_reaction = active_reaction;
	const dirty = signal.wv > current_reaction.wv || current_reaction.wv === 0;
	const style = dirty ? "color: CornflowerBlue; font-weight: bold" : "color: grey; font-weight: normal";
	console.groupCollapsed(signal.label ? `%c${type}%c ${signal.label}` : `%c${type}%c`, style, dirty ? "font-weight: normal" : style, typeof value === "object" && value !== null && STATE_SYMBOL in value ? snapshot(value, true) : value);
	if (type === "$derived") {
		const deps = new Set(
			/** @type {Derived} */
			signal.deps
		);
		for (const dep of deps) log_entry(dep);
	}
	if (signal.created) console.log(signal.created);
	if (dirty && signal.updated) {
		for (const updated of signal.updated.values()) if (updated.error) console.log(updated.error);
	}
	if (entry) for (var trace of entry.traces) console.log(trace);
	console.groupEnd();
}
/**
* @param {Value} signal
* @returns {'$state' | '$derived' | 'store'}
*/
function get_type(signal) {
	if ((signal.f & 4194306) !== 0) return "$derived";
	return signal.label?.startsWith("$") ? "store" : "$state";
}
/**
* @template T
* @param {() => string} label
* @param {() => T} fn
*/
function trace(label, fn) {
	var previously_tracing_expressions = tracing_expressions;
	try {
		tracing_expressions = {
			entries: /* @__PURE__ */ new Map(),
			reaction: active_reaction
		};
		var start = performance.now();
		var value = fn();
		var time = (performance.now() - start).toFixed(2);
		var prefix = untrack(label);
		if (!effect_tracking()) console.log(`${prefix} %cran outside of an effect (${time}ms)`, "color: grey");
		else if (tracing_expressions.entries.size === 0) console.log(`${prefix} %cno reactive dependencies (${time}ms)`, "color: grey");
		else {
			console.group(`${prefix} %c(${time}ms)`, "color: grey");
			var entries = tracing_expressions.entries;
			untrack(() => {
				for (const [signal, traces] of entries) log_entry(signal, traces);
			});
			tracing_expressions = null;
			console.groupEnd();
		}
		return value;
	} finally {
		tracing_expressions = previously_tracing_expressions;
	}
}
/**
* @template {Value} T
* @param {T} source
* @param {string} label
* @returns {T}
*/
function tag(source, label) {
	source.label = label;
	tag_proxy(source.v, label);
	return source;
}
/**
* @param {unknown} value
* @param {string} label
*/
function tag_proxy(value, label) {
	value?.[PROXY_PATH_SYMBOL]?.(label);
	return value;
}
/**
* @param {unknown} value
*/
function label(value) {
	if (typeof value === "symbol") return `Symbol(${value.description})`;
	if (typeof value === "function") return "<function>";
	if (typeof value === "object" && value) return "<object>";
	return String(value);
}
// node_modules/svelte/src/internal/shared/dev.js
/**
* @param {string} label
* @returns {Error & { stack: string } | null}
*/
function get_error(label) {
	const error = /* @__PURE__ */ new Error();
	const stack = get_stack();
	if (stack.length === 0) return null;
	stack.unshift("\n");
	define_property(error, "stack", { value: stack.join("\n") });
	define_property(error, "name", { value: label });
	return error;
}
/**
* @returns {string[]}
*/
function get_stack() {
	const limit = Error.stackTraceLimit;
	Error.stackTraceLimit = Infinity;
	const stack = (/* @__PURE__ */ new Error()).stack;
	Error.stackTraceLimit = limit;
	if (!stack) return [];
	const lines = stack.split("\n");
	const new_lines = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const posixified = line.replaceAll("\\", "/");
		if (line.trim() === "Error") continue;
		if (line.includes("validate_each_keys")) return [];
		if (posixified.includes("svelte/src/internal") || posixified.includes("node_modules/.vite")) continue;
		new_lines.push(line);
	}
	return new_lines;
}
/**
* @param {boolean} condition
* @param {string} message
*/
function invariant(condition, message) {
	if (!condition) invariant_violation(message);
}
// node_modules/svelte/src/internal/shared/context.js
/**
* @template T
* @param {(key: object) => T} get_context
* @param {(key: object, context: T) => T} set_context
* @param {(key: object) => boolean} has_context
* @returns {[() => T, (context: T) => T, () => boolean]}
*/
function create_context(get_context, set_context, has_context) {
	const key = {};
	return [
		() => {
			if (!has_context(key)) missing_context();
			return get_context(key);
		},
		(context) => set_context(key, context),
		() => has_context(key)
	];
}
/**
* @typedef {{ p: Context | null, c: Map<unknown, unknown> | null }} Context
*/
/**
* @param {Context} context
* @returns {Map<unknown, unknown> | null}
*/
function get_parent_context(context) {
	let parent = context.p;
	while (parent !== null && parent.c === null) parent = parent.p;
	return parent?.c ?? null;
}
/**
* @param {Context | null} context
* @param {string} name
* @returns {Map<unknown, unknown>}
*/
function get_or_init_context_map(context, name) {
	if (context === null) lifecycle_outside_component(name);
	return context.c ??= new Map(get_parent_context(context) || void 0);
}
// node_modules/svelte/src/internal/client/context.js
/** @import { ComponentContext, DevStackEntry, Effect } from '#client' */
/** @type {ComponentContext | null} */
var component_context = null;
/** @param {ComponentContext | null} context */
function set_component_context(context) {
	component_context = context;
}
/** @type {DevStackEntry | null} */
var dev_stack = null;
/** @param {DevStackEntry | null} stack */
function set_dev_stack(stack) {
	dev_stack = stack;
}
/**
* Execute a callback with a new dev stack entry
* @param {() => any} callback - Function to execute
* @param {DevStackEntry['type']} type - Type of block/component
* @param {any} component - Component function
* @param {number} line - Line number
* @param {number} column - Column number
* @param {Record<string, any>} [additional] - Any additional properties to add to the dev stack entry
* @returns {any}
*/
function add_svelte_meta(callback, type, component, line, column, additional) {
	const parent = dev_stack;
	dev_stack = {
		type,
		file: component[FILENAME],
		line,
		column,
		parent,
		...additional
	};
	try {
		return callback();
	} finally {
		dev_stack = parent;
	}
}
/**
* The current component function. Different from current component context:
* ```html
* <!-- App.svelte -->
* <Foo>
*   <Bar /> <!-- context == Foo.svelte, function == App.svelte -->
* </Foo>
* ```
* @type {ComponentContext['function']}
*/
var dev_current_component_function = null;
/** @param {ComponentContext['function']} fn */
function set_dev_current_component_function(fn) {
	dev_current_component_function = fn;
}
/**
* Returns a `[get, set, has]` triplet of functions for working with context in a type-safe way.
*
* `get` will throw an error if `set` has not yet been called in the current component or any of
* its ancestors.
*
* @template T
* @returns {[() => T, (context: T) => T, () => boolean]}
* @since 5.40.0
*/
function createContext() {
	return create_context(getContext, setContext, hasContext);
}
/**
* Retrieves the context set with the specified `key` in the current component or any of its
* ancestors. If multiple components set the same key, the value from the closest one is returned.
* A `setContext` call in the current component is only visible to `getContext` calls that run after it.
* Must be called during component initialisation.
*
* [`createContext`](https://svelte.dev/docs/svelte/svelte#createContext) is a type-safe alternative.
*
* @template T
* @param {any} key
* @returns {T}
*/
function getContext(key) {
	return get_or_init_context_map(component_context, "getContext").get(key);
}
/**
* Associates an arbitrary `context` object with the current component and the specified `key`
* and returns that object. The context is then available to the component itself and all of its
* descendants (including slotted content) with `getContext`.
*
* Like lifecycle functions, this must be called during component initialisation.
*
* [`createContext`](https://svelte.dev/docs/svelte/svelte#createContext) is a type-safe alternative.
*
* @template T
* @param {any} key
* @param {T} context
* @returns {T}
*/
function setContext(key, context) {
	const context_map = get_or_init_context_map(component_context, "setContext");
	if (async_mode_flag) {
		var flags = active_effect.f;
		if (!(!active_reaction && (flags & 32) !== 0 && !component_context.i)) set_context_after_init();
	}
	context_map.set(key, context);
	return context;
}
/**
* Checks whether a given `key` has been set in the context of the current component or any of
* its ancestors. Must be called during component initialisation.
*
* @param {any} key
* @returns {boolean}
*/
function hasContext(key) {
	return get_or_init_context_map(component_context, "hasContext").has(key);
}
/**
* Retrieves the whole context map that belongs to the current component, including entries
* inherited from its ancestors. Must be called during component initialisation. Useful, for
* example, if you programmatically create a component and want to pass the existing context to it.
*
* @template {Map<any, any>} [T=Map<any, any>]
* @returns {T}
*/
function getAllContexts() {
	return get_or_init_context_map(component_context, "getAllContexts");
}
/**
* @param {Record<string, unknown>} props
* @param {any} runes
* @param {Function} [fn]
* @returns {void}
*/
function push(props, runes = false, fn) {
	component_context = {
		p: component_context,
		i: false,
		c: null,
		e: null,
		s: props,
		x: null,
		r: active_effect,
		l: legacy_mode_flag && !runes ? {
			s: null,
			u: null,
			$: []
		} : null
	};
	component_context.function = fn;
	dev_current_component_function = fn;
}
/**
* @template {Record<string, any>} T
* @param {T} [component]
* @returns {T}
*/
function pop(component) {
	var context = component_context;
	var effects = context.e;
	if (effects !== null) {
		context.e = null;
		for (var fn of effects) create_user_effect(fn);
	}
	if (component !== void 0) context.x = component;
	context.i = true;
	component_context = context.p;
	dev_current_component_function = component_context?.function ?? null;
	return mark_as_component(component);
}
/**
* Add a symbol to the object (or create one if undefined) to mark it as a component so it isn't proxified.
* @param {any} component
*/
function mark_as_component(component = {}) {
	define_property(component, COMPONENT_SYMBOL, { value: true });
	return component;
}
/** @returns {boolean} */
function is_runes() {
	return !legacy_mode_flag || component_context !== null && component_context.l === null;
}
// node_modules/svelte/src/internal/client/dom/task.js
/** @type {Array<() => void>} */
var micro_tasks = [];
function run_micro_tasks() {
	var tasks = micro_tasks;
	micro_tasks = [];
	run_all(tasks);
}
/**
* @param {() => void} fn
*/
function queue_micro_task(fn) {
	if (micro_tasks.length === 0 && !is_flushing_sync) {
		var tasks = micro_tasks;
		queueMicrotask(() => {
			if (tasks === micro_tasks) run_micro_tasks();
		});
	}
	micro_tasks.push(fn);
}
/**
* Synchronously run any queued tasks.
*/
function flush_tasks() {
	while (micro_tasks.length > 0) run_micro_tasks();
}
// node_modules/svelte/src/internal/client/reactivity/status.js
/** @import { Derived, Signal } from '#client' */
var STATUS_MASK = ~(DIRTY | MAYBE_DIRTY | CLEAN);
/**
* @param {Signal} signal
* @param {number} status
*/
function set_signal_status(signal, status) {
	signal.f = signal.f & STATUS_MASK | status;
}
/**
* Set a derived's status to CLEAN or MAYBE_DIRTY based on its connection state.
* @param {Derived} derived
*/
function update_derived_status(derived) {
	if ((derived.f & 512) !== 0 || derived.deps === null) set_signal_status(derived, CLEAN);
	else set_signal_status(derived, MAYBE_DIRTY);
}
// node_modules/svelte/src/internal/client/reactivity/utils.js
/** @import { Effect } from '#client' */
/**
* @param {Effect} effect
* @param {Map<Effect, number>} dirty_reactions
*/
function defer_effect(effect, dirty_reactions) {
	if ((effect.f & 2048) !== 0) dirty_reactions.set(effect, DIRTY);
	else if ((effect.f & 4096) !== 0 && dirty_reactions.get(effect) !== 2048) dirty_reactions.set(effect, MAYBE_DIRTY);
	set_signal_status(effect, CLEAN);
}
// node_modules/svelte/src/internal/client/dev/debug.js
/**
* Stringify a derived function, removing `$.track_reactivity_loss` and `$.get` etc
* @param {Function} fn
*/
function stringify_derived(fn) {
	return `{${fn.toString().replace(/^async \(\) => /, "").replace(/^\(/, "").replace(/\$\.get\((.+?)\)/g, (_, name) => name).replace(/\$\.track_reactivity_loss\((.+?)\)\(\)/g, (_, name) => name).replace(/\)$/, "")}}`;
}
// node_modules/svelte/src/internal/client/dom/elements/misc.js
/**
* @param {HTMLElement} dom
* @param {boolean} value
* @returns {void}
*/
function autofocus(dom, value) {
	if (value) {
		const body = document.body;
		dom.autofocus = true;
		queue_micro_task(() => {
			if (document.activeElement === body) dom.focus();
		});
	}
}
/**
* The child of a textarea actually corresponds to the defaultValue property, so we need
* to remove it upon hydration to avoid a bug when someone resets the form value.
* @param {HTMLTextAreaElement} dom
* @returns {void}
*/
function remove_textarea_child(dom) {
	if (hydrating && /* @__PURE__ */ get_first_child(dom) !== null) clear_text_content(dom);
}
var listening_to_form_reset = false;
function add_form_reset_listener() {
	if (!listening_to_form_reset) {
		listening_to_form_reset = true;
		document.addEventListener("reset", (evt) => {
			Promise.resolve().then(() => {
				if (!evt.defaultPrevented) for (const e of evt.target.elements)
 /** @type {any} */ e[FORM_RESET_HANDLER]?.();
			});
		}, { capture: true });
	}
}
// node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
/**
* Fires the handler once immediately (unless corresponding arg is set to `false`),
* then listens to the given events until the render effect context is destroyed
* @param {EventTarget} target
* @param {Array<string>} events
* @param {(event?: Event) => void} handler
* @param {any} call_handler_immediately
*/
function listen(target, events, handler, call_handler_immediately = true) {
	if (call_handler_immediately) handler();
	for (var name of events) target.addEventListener(name, handler);
	teardown(() => {
		for (var name of events) target.removeEventListener(name, handler);
	});
}
/**
* @template T
* @param {() => T} fn
*/
function without_reactive_context(fn) {
	var previous_reaction = active_reaction;
	var previous_effect = active_effect;
	set_active_reaction(null);
	set_active_effect(null);
	try {
		return fn();
	} finally {
		set_active_reaction(previous_reaction);
		set_active_effect(previous_effect);
	}
}
/**
* Listen to the given event, and then instantiate a global form reset listener if not already done,
* to notify all bindings when the form is reset
* @param {HTMLElement} element
* @param {string} event
* @param {(is_reset?: true) => void} handler
* @param {(is_reset?: true) => void} [on_reset]
*/
function listen_to_event_and_reset_event(element, event, handler, on_reset = handler) {
	element.addEventListener(event, () => without_reactive_context(handler));
	const prev = element[FORM_RESET_HANDLER];
	if (prev)
 /** @type {any} */ element[FORM_RESET_HANDLER] = () => {
		prev();
		on_reset(true);
	};
	else
 /** @type {any} */ element[FORM_RESET_HANDLER] = () => on_reset(true);
	add_form_reset_listener();
}
// node_modules/svelte/src/internal/client/reactivity/async.js
/** @import { Blocker, Effect, Source, Value } from '#client' */
/**
* @param {Blocker[]} blockers
* @param {Array<() => any>} sync
* @param {Array<() => Promise<any>>} async
* @param {(values: Value[]) => any} fn
*/
function flatten(blockers, sync, async, fn) {
	const d = is_runes() ? derived : derived_safe_equal;
	var pending = blockers.filter((b) => !b.settled);
	var deriveds = sync.map(d);
	deriveds.forEach((d, i) => {
		d.label = sync[i].toString().replace("() => ", "").replaceAll("$.eager(() => ", "$state.eager(").replace(/\$\.get\((.+?)\)/g, (_, id) => id);
	});
	if (async.length === 0 && pending.length === 0) {
		fn(deriveds);
		return;
	}
	var parent = active_effect;
	var restore = capture();
	var blocker_promise = pending.length === 1 ? pending[0].promise : pending.length > 1 ? Promise.all(pending.map((b) => b.promise)) : null;
	/**
	* @param {Source[]} async
	*/
	function finish(async) {
		if ((parent.f & 16384) !== 0) return;
		restore();
		try {
			fn([...deriveds, ...async]);
		} catch (error) {
			invoke_error_boundary(error, parent);
		}
		unset_context();
	}
	var decrement_pending = increment_pending();
	if (async.length === 0) {
		/** @type {Promise<any>} */ blocker_promise.then(() => finish([])).finally(decrement_pending);
		return;
	}
	function run() {
		Promise.all(async.map((expression) => /* @__PURE__ */ async_derived(expression))).then(finish).catch((error) => invoke_error_boundary(error, parent)).finally(decrement_pending);
	}
	if (blocker_promise) blocker_promise.then(() => {
		if ((parent.f & 16384) !== 0) {
			decrement_pending();
			return;
		}
		restore();
		run();
		unset_context();
	});
	else run();
}
/**
* @param {Blocker[]} blockers
* @param {(values: Value[]) => any} fn
*/
function run_after_blockers(blockers, fn) {
	flatten(blockers, [], [], fn);
}
/**
* Captures the current effect context so that we can restore it after
* some asynchronous work has happened (so that e.g. `await a + b`
* causes `b` to be registered as a dependency).
*/
function capture() {
	var previous_effect = active_effect;
	var previous_reaction = active_reaction;
	var previous_component_context = component_context;
	var previous_batch = current_batch;
	var previous_dev_stack = dev_stack;
	return function restore(activate_batch = true) {
		set_active_effect(previous_effect);
		set_active_reaction(previous_reaction);
		set_component_context(previous_component_context);
		if (activate_batch && (previous_effect.f & 16384) === 0) {
			previous_batch?.activate();
			previous_batch?.apply();
		}
		set_reactivity_loss_tracker(null);
		set_dev_stack(previous_dev_stack);
	};
}
/** `true` between a `save` thunk restoring a context and the end of that synchronous segment */
var restored = false;
/**
* Wraps an `await` expression in such a way that the effect context that was
* active before the expression evaluated can be reapplied afterwards —
* `await a + b` becomes `(await $.save(a))() + b`
* @template T
* @param {Promise<T>} promise
* @returns {Promise<() => T>}
*/
async function save(promise) {
	var restore = capture();
	unsave();
	var value = await promise;
	return () => {
		restore();
		restored = true;
		return value;
	};
}
/**
* Unset the context if a `save` thunk restored it in the current synchronous segment,
* so that a foreign microtask can never run inside a restored reaction context.
* Called at every suspension point, and at the end of async expression bodies —
* `async () => (await $.save(a))().b` becomes `async () => { try { return (await $.save(a))().b; } finally { $.unsave(); } }`
* @template T
* @param {T} [value]
* @returns {T}
*/
function unsave(value) {
	if (restored) unset_context();
	return value;
}
/**
* Reset `current_async_effect` after the `promise` resolves, so
* that we can emit `await_reactivity_loss` warnings
* @template T
* @param {Promise<T>} promise
* @returns {Promise<() => T>}
*/
async function track_reactivity_loss(promise) {
	unsave();
	var previous_reactivity_loss_tracker = reactivity_loss_tracker;
	queueMicrotask(() => {
		if (reactivity_loss_tracker === previous_reactivity_loss_tracker) set_reactivity_loss_tracker(null);
	});
	var value = await promise;
	return () => {
		set_reactivity_loss_tracker(previous_reactivity_loss_tracker);
		queueMicrotask(() => {
			if (reactivity_loss_tracker === previous_reactivity_loss_tracker) set_reactivity_loss_tracker(null);
		});
		return value;
	};
}
/**
* Used in `for await` loops in DEV, so
* that we can emit `await_reactivity_loss` warnings
* after each `async_iterator` result resolves and
* after the `async_iterator` return resolves (if it runs)
* @template T
* @template TReturn
* @param {Iterable<T> | AsyncIterable<T>} iterable
* @returns {AsyncGenerator<T, TReturn | undefined>}
*/
async function* for_await_track_reactivity_loss(iterable) {
	/** @type {AsyncIterator<T, TReturn>} */
	const iterator = iterable[Symbol.asyncIterator]?.() ?? iterable[Symbol.iterator]?.();
	if (iterator === void 0) throw new TypeError("value is not async iterable");
	let invoke_return = true;
	try {
		while (true) {
			const { done, value } = (await track_reactivity_loss(iterator.next()))();
			if (done) {
				invoke_return = false;
				break;
			}
			var prev = reactivity_loss_tracker;
			try {
				yield value;
			} catch (e) {
				set_reactivity_loss_tracker(prev);
				if (iterator.return !== void 0) (await track_reactivity_loss(iterator.return()))();
				throw e;
			}
			set_reactivity_loss_tracker(prev);
		}
	} catch (error) {
		invoke_return = false;
		throw error;
	} finally {
		if (invoke_return && iterator.return !== void 0) return (await track_reactivity_loss(iterator.return()))().value;
	}
}
function unset_context(deactivate_batch = true) {
	restored = false;
	set_active_effect(null);
	set_active_reaction(null);
	set_component_context(null);
	if (deactivate_batch) current_batch?.deactivate();
	set_reactivity_loss_tracker(null);
	set_dev_stack(null);
}
/**
* @param {Array<() => void | Promise<void>>} thunks
*/
function run(thunks) {
	const restore = capture();
	const decrement_pending = increment_pending();
	var active = active_effect;
	/** @type {null | { error: any }} */
	var errored = null;
	/** @param {any} error */
	const handle_error = (error) => {
		errored = { error };
		if (!aborted(active)) invoke_error_boundary(error, active);
	};
	var promise = Promise.resolve(thunks[0]()).catch(handle_error);
	/** @type {Blocker} */
	var blocker = {
		promise,
		settled: false
	};
	var blockers = [blocker];
	promise.finally(() => {
		blocker.settled = true;
		unset_context();
	});
	for (const fn of thunks.slice(1)) {
		promise = promise.then(() => {
			restore();
			try {
				if (errored) throw errored.error;
				if (aborted(active)) throw STALE_REACTION;
				return fn();
			} finally {
				unset_context();
			}
		}).catch(handle_error);
		const blocker = {
			promise,
			settled: false
		};
		blockers.push(blocker);
		promise.finally(() => {
			blocker.settled = true;
			unset_context();
		});
	}
	promise.then(() => Promise.resolve()).finally(decrement_pending);
	return blockers;
}
/**
* @param {Blocker[]} blockers
*/
function wait(blockers) {
	return Promise.all(blockers.map((b) => b.promise));
}
/**
* @returns {(skip?: boolean) => void}
*/
function increment_pending() {
	var effect = active_effect;
	var boundary = effect.b;
	var batch = current_batch;
	var blocking = !!boundary?.is_rendered();
	boundary?.update_pending_count(1, batch);
	batch.increment(blocking, effect);
	return () => {
		boundary?.update_pending_count(-1, batch);
		batch.decrement(blocking, effect);
	};
}
// node_modules/svelte/src/internal/client/reactivity/deriveds.js
/** @import { Derived, Effect, Reaction, Source, Value } from '#client' */
/** @import { Batch } from './batch.js'; */
/** @import { Boundary } from '../dom/blocks/boundary.js'; */
/**
* This allows us to track 'reactivity loss' that occurs when signals
* are read after a non-context-restoring `await`. Dev-only
* @type {{ effect: Effect, effect_deps: Set<Value>, warned: boolean } | null}
*/
var reactivity_loss_tracker = null;
/** @param {{ effect: Effect, effect_deps: Set<Value>, warned: boolean } | null} v */
function set_reactivity_loss_tracker(v) {
	reactivity_loss_tracker = v;
}
var recent_async_deriveds = /* @__PURE__ */ new Set();
/**
* @template V
* @param {() => V} fn
* @returns {Derived<V>}
*/
/*#__NO_SIDE_EFFECTS__*/
function derived(fn) {
	var flags = 2 | DIRTY;
	if (active_effect !== null) active_effect.f |= EFFECT_PRESERVED;
	/** @type {Derived<V>} */
	const signal = {
		ctx: component_context,
		deps: null,
		effects: null,
		equals: equals$1,
		f: flags,
		fn,
		reactions: null,
		rv: 0,
		v: UNINITIALIZED,
		wv: 0,
		parent: active_effect,
		ac: null
	};
	if (tracing_mode_flag) signal.created = get_error("created at");
	return signal;
}
var OBSOLETE = Symbol("obsolete");
/**
* @template V
* @param {() => V | Promise<V>} fn
* @param {string} [label]
* @param {string} [location] If provided, print a warning if the value is not read immediately after update
* @returns {Promise<Source<V>>}
*/
/*#__NO_SIDE_EFFECTS__*/
function async_derived(fn, label, location) {
	let parent = active_effect;
	if (parent === null) async_derived_orphan();
	var promise = void 0;
	var signal = source(UNINITIALIZED);
	signal.label = label ?? stringify_derived(fn);
	var should_suspend = !active_reaction;
	/** @type {Set<ReturnType<typeof deferred<V>>>} */
	var deferreds = /* @__PURE__ */ new Set();
	async_effect(() => {
		var effect = active_effect;
		reactivity_loss_tracker = {
			effect,
			effect_deps: /* @__PURE__ */ new Set(),
			warned: false
		};
		/** @type {ReturnType<typeof deferred<V>>} */
		var d = deferred();
		promise = d.promise;
		try {
			Promise.resolve(fn()).then(d.resolve, (e) => {
				if (e !== STALE_REACTION) d.reject(e);
			}).finally(unset_context);
		} catch (error) {
			d.reject(error);
			unset_context();
		}
		if (reactivity_loss_tracker) {
			if (effect.deps !== null) for (let i = 0; i < skipped_deps; i += 1) reactivity_loss_tracker.effect_deps.add(effect.deps[i]);
			if (new_deps !== null) for (let i = 0; i < new_deps.length; i += 1) reactivity_loss_tracker.effect_deps.add(new_deps[i]);
		}
		reactivity_loss_tracker = null;
		var batch = current_batch;
		if (should_suspend) {
			if ((effect.f & 32768) !== 0) var decrement_pending = increment_pending();
			if (parent.b?.is_rendered()) batch.async_deriveds.get(effect)?.reject(OBSOLETE);
			else for (const d of deferreds.values()) d.reject(OBSOLETE);
			deferreds.add(d);
			batch.async_deriveds.set(effect, d);
		}
		/**
		* @param {any} value
		* @param {unknown} error
		*/
		const handler = (value, error = void 0) => {
			reactivity_loss_tracker = null;
			decrement_pending?.();
			deferreds.delete(d);
			if (error === OBSOLETE) return;
			batch.activate();
			if (error) {
				signal.f |= ERROR_VALUE;
				internal_set(signal, error);
			} else {
				if ((signal.f & 8388608) !== 0) signal.f ^= ERROR_VALUE;
				if (location !== void 0 && !signal.equals(value)) {
					recent_async_deriveds.add(signal);
					setTimeout(() => {
						if (recent_async_deriveds.has(signal) && (effect.f & 16384) === 0) {
							await_waterfall(signal.label, location);
							recent_async_deriveds.delete(signal);
						}
					});
				}
				internal_set(signal, value);
			}
			batch.deactivate();
		};
		d.promise.then(handler, (e) => handler(null, e || "unknown"));
	});
	teardown(() => {
		for (const d of deferreds) d.reject(OBSOLETE);
	});
	signal.f |= ASYNC;
	return new Promise((fulfil) => {
		/** @param {Promise<V>} p */
		function next(p) {
			function go() {
				if (p === promise) fulfil(signal);
				else next(promise);
			}
			p.then(go, go);
		}
		next(promise);
	});
}
/**
* @template V
* @param {() => V} fn
* @returns {Derived<V>}
*/
/*#__NO_SIDE_EFFECTS__*/
function user_derived(fn) {
	const d = /* @__PURE__ */ derived(fn);
	if (!async_mode_flag) push_reaction_value(d);
	return d;
}
/**
* @template V
* @param {() => V} fn
* @returns {Derived<V>}
*/
/*#__NO_SIDE_EFFECTS__*/
function derived_safe_equal(fn) {
	const signal = /* @__PURE__ */ derived(fn);
	signal.equals = safe_equals;
	return signal;
}
/**
* @param {Derived} derived
* @returns {void}
*/
function destroy_derived_effects(derived) {
	var effects = derived.effects;
	if (effects !== null) {
		derived.effects = null;
		for (var i = 0; i < effects.length; i += 1) destroy_effect(effects[i]);
	}
}
/**
* The currently updating deriveds, used to detect infinite recursion
* in dev mode and provide a nicer error than 'too much recursion'
* @type {Derived[]}
*/
var stack = [];
/**
* @template T
* @param {Derived} derived
* @returns {T}
*/
function execute_derived(derived) {
	var value;
	var prev_active_effect = active_effect;
	var parent = derived.parent;
	if (!is_destroying_effect && parent !== null && derived.v !== UNINITIALIZED && (parent.f & 24576) !== 0) {
		derived_inert();
		return derived.v;
	}
	set_active_effect(parent);
	{
		let prev_eager_effects = eager_effects;
		set_eager_effects(/* @__PURE__ */ new Set());
		try {
			if (includes.call(stack, derived)) derived_references_self();
			stack.push(derived);
			destroy_derived_effects(derived);
			value = update_reaction(derived);
		} finally {
			set_active_effect(prev_active_effect);
			set_eager_effects(prev_eager_effects);
			stack.pop();
		}
	}
	return value;
}
/**
* @param {Derived} derived
* @returns {void}
*/
function update_derived(derived) {
	var value = execute_derived(derived);
	if (!derived.equals(value)) {
		derived.wv = increment_write_version();
		if (!current_batch?.is_fork || derived.deps === null) {
			if (current_batch !== null) {
				current_batch.capture(derived, value, true);
				previous_batch?.capture(derived, value, true);
			} else derived.v = value;
			if (derived.deps === null) {
				set_signal_status(derived, CLEAN);
				return;
			}
		}
	}
	if (is_destroying_effect) return;
	if (batch_values !== null) {
		if (effect_tracking() || current_batch?.is_fork) batch_values.set(derived, value);
	} else update_derived_status(derived);
}
/**
* @param {Derived} derived
*/
function freeze_derived_effects(derived) {
	if (derived.effects === null) return;
	for (const e of derived.effects) if (e.teardown || e.ac) {
		e.teardown?.();
		if (e.ac !== null) without_reactive_context(() => {
			/** @type {AbortController} */ e.ac.abort(STALE_REACTION);
			e.ac = null;
		});
		if (e.fn !== null) e.teardown = noop;
		remove_reactions(e, 0);
		destroy_effect_children(e);
	}
}
/**
* @param {Derived} derived
*/
function unfreeze_derived_effects(derived) {
	if (derived.effects === null) return;
	for (const e of derived.effects) if (e.teardown && e.fn !== null) update_effect(e);
}
// node_modules/svelte/src/internal/client/reactivity/batch.js
/** @import { Fork } from 'svelte' */
/** @import { Derived, Effect, Reaction, Source, Value } from '#client' */
/** @type {Batch | null} */
var first_batch = null;
/** @type {Batch | null} */
var last_batch = null;
/** @type {Batch | null} */
var current_batch = null;
/**
* This is needed to avoid overwriting inputs
* @type {Batch | null}
*/
var previous_batch = null;
/**
* When time travelling (i.e. working in one batch, while other batches
* still have ongoing work), we ignore the real values of affected
* signals in favour of their values within the batch
* @type {Map<Value, any> | null}
*/
var batch_values = null;
/** @type {Effect | null} */
var last_scheduled_effect = null;
var is_flushing_sync = false;
var is_processing = false;
/**
* During traversal, this is an array. Newly created effects are (if not immediately
* executed) pushed to this array, rather than going through the scheduling
* rigamarole that would cause another turn of the flush loop.
* @type {Effect[] | null}
*/
var collected_effects = null;
/**
* An array of effects that are marked during traversal as a result of a `set`
* (not `internal_set`) call. These will be added to the next batch and
* trigger another `batch.process()`
* @type {Effect[] | null}
* @deprecated when we get rid of legacy mode and stores, we can get rid of this
*/
var legacy_updates = null;
var flush_count = 0;
/** @type {Set<Value>} */
var source_stacks = /* @__PURE__ */ new Set();
var uid = 1;
var Batch = class Batch {
	id = uid++;
	/** True as soon as `#process` was called */
	started = false;
	linked = true;
	/** @type {Batch | null} */
	prev = null;
	/** @type {Batch | null} */
	next = null;
	/** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
	async_deriveds = /* @__PURE__ */ new Map();
	/**
	* The current values of any signals that are updated in this batch.
	* Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
	* The keys of this map are identical to `this.previous`
	* @type {Map<Value, [any, boolean]>}
	*/
	current = /* @__PURE__ */ new Map();
	/**
	* The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
	* The keys of this map are identical to `this.current`
	* @type {Map<Value, any>}
	*/
	previous = /* @__PURE__ */ new Map();
	/**
	* When the batch is committed (and the DOM is updated), we need to remove old branches
	* and append new ones by calling the functions added inside (if/each/key/etc) blocks
	* @type {Set<(batch: Batch) => void>}
	*/
	#commit_callbacks = /* @__PURE__ */ new Set();
	/**
	* If a fork is discarded, we need to destroy any effects that are no longer needed
	* @type {Set<(batch: Batch) => void>}
	*/
	#discard_callbacks = /* @__PURE__ */ new Set();
	/**
	* The number of async effects that are currently in flight
	*/
	#pending = 0;
	/**
	* Async effects that are currently in flight, _not_ inside a pending boundary
	* @type {Map<Effect, number>}
	*/
	#blocking_pending = /* @__PURE__ */ new Map();
	/**
	* A deferred that resolves when the batch is committed, used with `settled()`
	* TODO replace with Promise.withResolvers once supported widely enough
	* @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
	*/
	#deferred = null;
	/**
	* Effects that were scheduled in this batch but not yet 'resolved' into the
	* root effects that need to be flushed. Resolving — the upwards traversal that
	* marks the path to each effect on the shared effect tree (see #resolve) — is
	* deferred until the batch is processed, so that the markers are created and
	* consumed within a single traversal. Scheduling into other batches (which can
	* happen concurrently, e.g. while a batch is committed) can therefore never
	* observe (and be confused by) this batch's markers.
	* May contain duplicates — deduplication happens during resolving
	* @type {Effect[]}
	*/
	#scheduled = [];
	/**
	* Effects created while this batch was active.
	* @type {Effect[]}
	*/
	#new_effects = [];
	/**
	* Deferred effects (which run after async work has completed) and their status (DIRTY or MAYBE_DIRTY)
	* @type {Map<Effect, number>}
	*/
	#dirty_reactions = /* @__PURE__ */ new Map();
	/**
	* A map of branches that still exist, but will be destroyed when this batch
	* is committed — we skip over these during `process`.
	* The value contains child effects that were dirty/maybe_dirty before being reset,
	* so they can be rescheduled if the branch survives.
	* @type {Map<Effect, { d: Effect[], m: Effect[] }>}
	*/
	#skipped_branches = /* @__PURE__ */ new Map();
	/**
	* Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
	* @type {Set<Effect>}
	*/
	#unskipped_branches = /* @__PURE__ */ new Set();
	is_fork = false;
	#decrement_queued = false;
	constructor() {
		if (last_batch === null) first_batch = last_batch = this;
		else {
			last_batch.next = this;
			this.prev = last_batch;
		}
		last_batch = this;
	}
	#is_deferred() {
		if (this.is_fork) return true;
		for (const effect of this.#blocking_pending.keys()) if (!this.#is_skipped(effect)) return true;
		return false;
	}
	/**
	* Whether `effect` is inside a branch that this batch skips
	* @param {Effect} effect
	*/
	#is_skipped(effect) {
		for (var e = effect; e !== null; e = e.parent) if (this.#skipped_branches.has(e)) return true;
		return false;
	}
	/**
	* Add an effect to the #skipped_branches map and reset its children
	* @param {Effect} effect
	*/
	skip_effect(effect) {
		if (!this.#skipped_branches.has(effect)) this.#skipped_branches.set(effect, {
			d: [],
			m: []
		});
		this.#unskipped_branches.delete(effect);
	}
	/**
	* Remove an effect from the #skipped_branches map and reschedule
	* any tracked dirty/maybe_dirty child effects
	* @param {Effect} effect
	* @param {(e: Effect) => void} callback
	*/
	unskip_effect(effect, callback = (e) => this.schedule(e)) {
		var tracked = this.#skipped_branches.get(effect);
		if (tracked) {
			this.#skipped_branches.delete(effect);
			for (var e of tracked.d) {
				set_signal_status(e, DIRTY);
				callback(e);
			}
			for (e of tracked.m) {
				set_signal_status(e, MAYBE_DIRTY);
				callback(e);
			}
		}
		this.#unskipped_branches.add(effect);
	}
	/**
	* Convert the effects that were scheduled in this batch into the root effects
	* that need to be traversed, marking the path to each effect (by clearing the
	* `CLEAN` flag on ancestor branches) so that the traversal can find them.
	* This happens right before traversal rather than at scheduling time, so that
	* the markers left on the (shared) effect tree are created and consumed within
	* a single traversal — scheduling into other batches can never observe them
	* @returns {Effect[]}
	*/
	#resolve() {
		/** @type {Effect[]} */
		var roots = [];
		for (const effect of this.#scheduled) {
			if ((effect.f & 16384) !== 0 || (effect.f & 6144) === 0) continue;
			var e = effect;
			var covered = false;
			while (e.parent !== null) {
				e = e.parent;
				var flags = e.f;
				if ((flags & 96) !== 0) {
					if ((flags & 1024) === 0) {
						covered = true;
						break;
					}
					e.f ^= CLEAN;
				}
			}
			if (!covered) roots.push(e);
		}
		this.#scheduled = [];
		return roots;
	}
	#process() {
		this.started = true;
		for (const value of this.current.keys()) source_stacks.add(value);
		for (const [e, status] of this.#dirty_reactions) {
			set_signal_status(e, status);
			this.schedule(e);
		}
		this.apply();
		/** @type {Effect[]} */
		var effects = collected_effects = [];
		/** @type {Effect[]} */
		var render_effects = [];
		/**
		* @type {Effect[]}
		* @deprecated when we get rid of legacy mode and stores, we can get rid of this
		*/
		var updates = legacy_updates = [];
		while (this.#scheduled.length > 0) {
			if (flush_count++ > 1e3) {
				this.#unlink();
				infinite_loop_guard();
			}
			for (const root of this.#resolve()) try {
				this.#traverse(root, effects, render_effects);
			} catch (e) {
				reset_all(root);
				if (!this.#is_deferred()) this.discard();
				throw e;
			}
		}
		current_batch = null;
		if (updates.length > 0) {
			var batch = Batch.ensure();
			for (const e of updates) batch.schedule(e);
		}
		collected_effects = null;
		legacy_updates = null;
		if (this.#is_deferred()) {
			this.#defer_effects(render_effects);
			this.#defer_effects(effects);
			for (const [e, t] of this.#skipped_branches) reset_branch(e, t);
			if (updates.length > 0)
 /** @type {Batch} */ current_batch.#process();
			return;
		}
		const earlier_batch = this.#find_earlier_batch();
		if (earlier_batch) {
			this.#defer_effects(render_effects);
			this.#defer_effects(effects);
			earlier_batch.#merge(this);
			return;
		}
		this.#dirty_reactions.clear();
		for (const fn of this.#commit_callbacks) fn(this);
		this.#commit_callbacks.clear();
		previous_batch = this;
		flush_queued_effects(render_effects);
		flush_queued_effects(effects);
		previous_batch = null;
		this.#deferred?.resolve();
		var next_batch = current_batch;
		if (this.#pending === 0 && (this.#scheduled.length === 0 || next_batch !== null)) {
			this.#unlink();
			if (async_mode_flag) {
				this.#commit();
				current_batch = next_batch;
			}
		}
		if (next_batch !== null) {
			old_values.clear();
			next_batch.#process();
		}
	}
	/**
	* Traverse the effect tree, executing effects or stashing
	* them for later execution as appropriate
	* @param {Effect} root
	* @param {Effect[]} effects
	* @param {Effect[]} render_effects
	*/
	#traverse(root, effects, render_effects) {
		root.f ^= CLEAN;
		var effect = root.first;
		while (effect !== null) {
			var flags = effect.f;
			var is_branch = (flags & 96) !== 0;
			if (!(is_branch && (flags & 1024) !== 0 || (flags & 8192) !== 0 || this.#skipped_branches.has(effect)) && effect.fn !== null) {
				if (is_branch) effect.f ^= CLEAN;
				else if ((flags & 4) !== 0) effects.push(effect);
				else if (async_mode_flag && (flags & 16777224) !== 0) render_effects.push(effect);
				else if (is_dirty(effect)) {
					if ((flags & 16) !== 0) this.add_dirty_reaction(effect, MAYBE_DIRTY);
					update_effect(effect);
				}
				var child = effect.first;
				if (child !== null) {
					effect = child;
					continue;
				}
			}
			while (effect !== null) {
				var next = effect.next;
				if (next !== null) {
					effect = next;
					break;
				}
				effect = effect.parent;
			}
		}
	}
	#find_earlier_batch() {
		for (var batch = this.prev; batch !== null; batch = batch.prev) if (!batch.is_fork && this.#intersects(batch)) return batch;
		return null;
	}
	/** @param {Batch} batch */
	#intersects(batch) {
		for (const [source, [, is_derived]] of this.current) {
			if (is_derived) continue;
			if (batch.current.has(source)) return true;
		}
		return false;
	}
	/**
	* @param {Batch} batch
	*/
	#merge(batch) {
		for (const [source, value] of batch.current) {
			if (!this.previous.has(source) && batch.previous.has(source)) this.previous.set(source, batch.previous.get(source));
			this.current.set(source, value);
		}
		for (const [effect, deferred] of batch.async_deriveds) {
			const d = this.async_deriveds.get(effect);
			if (d) deferred.promise.then(d.resolve).catch(d.reject);
		}
		batch.async_deriveds.clear();
		this.transfer_reactions(batch.#dirty_reactions);
		/**
		* mark all effects that depend on `batch.current`, except the
		* async effects that we just resolved (TODO unless they depend
		* on values in this batch that are NOT in the later batch?).
		* Through this we also will populate the correct #skipped_branches,
		* oncommit callbacks etc, so we don't need to merge them separately.
		* @param {Value} value
		*/
		const mark = (value) => {
			var reactions = value.reactions;
			if (reactions === null) return;
			if ((value.f & 2) !== 0 && (value.f & 6144) === 0) return;
			for (const reaction of reactions) {
				var flags = reaction.f;
				if ((flags & 2) !== 0) mark(reaction);
				else {
					var effect = reaction;
					if (flags & 4194320 && !this.async_deriveds.has(effect)) {
						this.#dirty_reactions.delete(effect);
						set_signal_status(effect, DIRTY);
						this.schedule(effect);
					}
				}
			}
		};
		for (const source of this.current.keys()) mark(source);
		this.oncommit(() => batch.discard());
		batch.#unlink();
		current_batch = this;
		this.#process();
	}
	/**
	* @param {Effect[]} effects
	*/
	#defer_effects(effects) {
		for (var i = 0; i < effects.length; i += 1) defer_effect(effects[i], this.#dirty_reactions);
	}
	/**
	* Associate a change to a given source with the current
	* batch, noting its previous and current values
	* @param {Value} source
	* @param {any} value
	* @param {boolean} [is_derived]
	*/
	capture(source, value, is_derived = false) {
		if (source.v !== UNINITIALIZED && !this.previous.has(source)) this.previous.set(source, source.v);
		if ((source.f & 8388608) === 0) {
			this.current.set(source, [value, is_derived]);
			batch_values?.set(source, value);
		}
		if (!this.is_fork) source.v = value;
	}
	activate() {
		current_batch = this;
	}
	deactivate() {
		current_batch = null;
		batch_values = null;
	}
	flush() {
		try {
			source_stacks.clear();
			is_processing = true;
			current_batch = this;
			this.#process();
		} finally {
			flush_count = 0;
			last_scheduled_effect = null;
			collected_effects = null;
			legacy_updates = null;
			is_processing = false;
			current_batch = null;
			batch_values = null;
			old_values.clear();
			for (const source of source_stacks) source.updated = null;
		}
	}
	discard() {
		for (const fn of this.#discard_callbacks) fn(this);
		this.#discard_callbacks.clear();
		for (const deferred of this.async_deriveds.values()) deferred.reject(OBSOLETE);
		this.#unlink();
		this.#deferred?.resolve();
	}
	/**
	* @param {Effect} effect
	*/
	register_created_effect(effect) {
		this.#new_effects.push(effect);
	}
	#commit() {
		for (let batch = first_batch; batch !== null; batch = batch.next) {
			var is_earlier = batch.id < this.id;
			/** @type {Source[]} */
			var sources = [];
			for (const [source, [value, is_derived]] of this.current) {
				if (batch.current.has(source)) {
					var batch_value = batch.current.get(source)[0];
					if (is_earlier && value !== batch_value) batch.current.set(source, [value, is_derived]);
					else continue;
				}
				sources.push(source);
			}
			if (is_earlier) for (const [effect, deferred] of this.async_deriveds) {
				const d = batch.async_deriveds.get(effect);
				if (d) deferred.promise.then(d.resolve).catch(d.reject);
			}
			var current = [...batch.current.keys()].filter((source) => !batch.current.get(source)[1]);
			if (!batch.started || current.length === 0) continue;
			var others = current.filter((source) => !this.current.has(source));
			if (others.length === 0) {
				if (is_earlier) batch.discard();
			} else if (sources.length > 0) {
				if (!batch.#decrement_queued) invariant(batch.#scheduled.length === 0, "Batch has scheduled effects");
				if (is_earlier) for (const unskipped of this.#unskipped_branches) batch.unskip_effect(unskipped, (e) => {
					if ((e.f & 4194320) !== 0) batch.schedule(e);
					else batch.#defer_effects([e]);
				});
				batch.activate();
				/** @type {Set<Value>} */
				var marked = /* @__PURE__ */ new Set();
				/** @type {Map<Reaction, boolean>} */
				var checked = /* @__PURE__ */ new Map();
				for (var source of sources) mark_effects(source, others, marked, checked);
				checked = /* @__PURE__ */ new Map();
				var current_unequal = [...batch.current].filter(([c, v1]) => {
					const v2 = this.current.get(c);
					if (!v2) return true;
					return v2[0] !== v1[0] || v2[1] !== v1[1];
				}).map(([c]) => c);
				if (current_unequal.length > 0) {
					for (const effect of this.#new_effects) if ((effect.f & 155648) === 0 && depends_on(effect, current_unequal, checked)) {
						if ((effect.f & 4194320) !== 0) {
							set_signal_status(effect, DIRTY);
							batch.schedule(effect);
						} else batch.add_dirty_reaction(effect, DIRTY);
					}
				}
				if (batch.#scheduled.length > 0 && !batch.#decrement_queued) {
					batch.apply();
					for (var root of batch.#resolve()) batch.#traverse(root, [], []);
				}
				batch.deactivate();
			}
		}
	}
	/**
	* @param {boolean} blocking
	* @param {Effect} effect
	*/
	increment(blocking, effect) {
		this.#pending += 1;
		if (blocking) {
			let blocking_pending_count = this.#blocking_pending.get(effect) ?? 0;
			this.#blocking_pending.set(effect, blocking_pending_count + 1);
		}
	}
	/**
	* @param {boolean} blocking
	* @param {Effect} effect
	*/
	decrement(blocking, effect) {
		this.#pending -= 1;
		if (blocking) {
			let blocking_pending_count = this.#blocking_pending.get(effect) ?? 0;
			if (blocking_pending_count === 1) this.#blocking_pending.delete(effect);
			else this.#blocking_pending.set(effect, blocking_pending_count - 1);
		}
		if (this.#decrement_queued) return;
		this.#decrement_queued = true;
		queue_micro_task(() => {
			this.#decrement_queued = false;
			if (this.linked) this.flush();
		});
	}
	/**
	* @param {Map<Effect, number>} dirty_reactions
	*/
	transfer_reactions(dirty_reactions) {
		for (const [effect, status] of dirty_reactions) this.add_dirty_reaction(effect, status);
		dirty_reactions.clear();
	}
	/**
	* @param {Effect} effect
	* @param {number} status
	*/
	add_dirty_reaction(effect, status) {
		if (status === 2048 || this.#dirty_reactions.get(effect) !== 2048) this.#dirty_reactions.set(effect, status);
	}
	/** @param {(batch: Batch) => void} fn */
	oncommit(fn) {
		this.#commit_callbacks.add(fn);
	}
	/** @param {(batch: Batch) => void} fn */
	ondiscard(fn) {
		this.#discard_callbacks.add(fn);
	}
	settled() {
		return (this.#deferred ??= deferred()).promise;
	}
	static ensure() {
		if (current_batch === null) {
			const batch = current_batch = new Batch();
			if (!is_processing && !is_flushing_sync) queue_micro_task(() => {
				if (!batch.started) batch.flush();
			});
		}
		return current_batch;
	}
	apply() {
		if (!async_mode_flag || !this.is_fork && this.prev === null && this.next === null) {
			batch_values = null;
			return;
		}
		batch_values = /* @__PURE__ */ new Map();
		for (const [source, [value]] of this.current) batch_values.set(source, value);
		for (let batch = first_batch; batch !== null; batch = batch.next) {
			if (batch === this || batch.is_fork) continue;
			if (batch.id >= this.id || !batch.#intersects(this)) {
				for (const [source, previous] of batch.previous) if (!batch_values.has(source)) batch_values.set(source, previous);
			}
		}
	}
	/**
	*
	* @param {Effect} effect
	*/
	schedule(effect) {
		last_scheduled_effect = effect;
		if (effect.b?.is_pending && (effect.f & 16777228) !== 0 && (effect.f & 32768) === 0) {
			effect.b.defer_effect(effect);
			return;
		}
		this.#scheduled.push(effect);
	}
	#unlink() {
		if (!this.linked) return;
		var prev = this.prev;
		var next = this.next;
		if (prev === null) first_batch = next;
		else prev.next = next;
		if (next === null) last_batch = prev;
		else next.prev = prev;
		this.linked = false;
	}
};
/**
* Synchronously flush any pending updates.
* Returns void if no callback is provided, otherwise returns the result of calling the callback.
* @template [T=void]
* @param {(() => T) | undefined} [fn]
* @returns {T}
*/
function flushSync(fn) {
	var was_flushing_sync = is_flushing_sync;
	var prev_previous_batch = previous_batch;
	previous_batch = null;
	is_flushing_sync = true;
	try {
		var result;
		if (fn) {
			flushSync();
			result = fn();
		}
		while (true) {
			flush_tasks();
			if (current_batch === null) return result;
			current_batch.flush();
		}
	} finally {
		is_flushing_sync = was_flushing_sync;
		previous_batch = prev_previous_batch;
	}
}
function infinite_loop_guard() {
	var updates = /* @__PURE__ */ new Map();
	for (const source of current_batch.current.keys()) for (const [stack, update] of source.updated ?? []) {
		var entry = updates.get(stack);
		if (!entry) {
			entry = {
				error: update.error,
				count: 0
			};
			updates.set(stack, entry);
		}
		entry.count += update.count;
	}
	for (const update of updates.values()) if (update.error) console.error(update.error);
	try {
		effect_update_depth_exceeded();
	} catch (error) {
		define_property(error, "stack", { value: "" });
		invoke_error_boundary(error, last_scheduled_effect);
	}
}
/** @type {Set<Effect> | null} */
var eager_block_effects = null;
/**
* @param {Array<Effect>} effects
* @returns {void}
*/
function flush_queued_effects(effects) {
	var length = effects.length;
	if (length === 0) return;
	var i = 0;
	while (i < length) {
		var effect = effects[i++];
		if ((effect.f & 24576) === 0 && is_dirty(effect)) {
			eager_block_effects = /* @__PURE__ */ new Set();
			update_effect(effect);
			if (effect.deps === null && effect.first === null && effect.nodes === null && effect.teardown === null && effect.ac === null) unlink_effect(effect);
			if (eager_block_effects?.size > 0) {
				old_values.clear();
				for (const e of eager_block_effects) {
					if ((e.f & 24576) !== 0) continue;
					/** @type {Effect[]} */
					const ordered_effects = [e];
					let ancestor = e.parent;
					while (ancestor !== null) {
						if (eager_block_effects.has(ancestor)) {
							eager_block_effects.delete(ancestor);
							ordered_effects.push(ancestor);
						}
						ancestor = ancestor.parent;
					}
					for (let j = ordered_effects.length - 1; j >= 0; j--) {
						const e = ordered_effects[j];
						if ((e.f & 24576) !== 0) continue;
						update_effect(e);
					}
				}
				eager_block_effects.clear();
			}
		}
	}
	eager_block_effects = null;
}
/**
* This is similar to `mark_reactions`, but it only marks async/block effects
* depending on `value` and at least one of the other `sources`, so that
* these effects can re-run after another batch has been committed
* @param {Value} value
* @param {Source[]} sources
* @param {Set<Value>} marked
* @param {Map<Reaction, boolean>} checked
*/
function mark_effects(value, sources, marked, checked) {
	if (marked.has(value)) return;
	marked.add(value);
	if (value.reactions !== null) for (const reaction of value.reactions) {
		const flags = reaction.f;
		if ((flags & 2) !== 0) mark_effects(reaction, sources, marked, checked);
		else if ((flags & 4194320) !== 0 && (flags & 2048) === 0 && depends_on(reaction, sources, checked)) {
			set_signal_status(reaction, DIRTY);
			schedule_effect(reaction);
		}
	}
}
/**
* When committing a fork, we need to trigger eager effects so that
* any `$state.eager(...)` expressions update immediately. This
* function allows us to discover them
* @param {Value} value
* @param {Set<Effect>} effects
*/
function mark_eager_effects(value, effects) {
	if (value.reactions === null) return;
	for (const reaction of value.reactions) {
		const flags = reaction.f;
		if ((flags & 2) !== 0) mark_eager_effects(reaction, effects);
		else if ((flags & 131072) !== 0) {
			set_signal_status(reaction, DIRTY);
			effects.add(reaction);
		}
	}
}
/**
* @param {Reaction} reaction
* @param {Source[]} sources
* @param {Map<Reaction, boolean>} checked
*/
function depends_on(reaction, sources, checked) {
	const depends = checked.get(reaction);
	if (depends !== void 0) return depends;
	if (reaction.deps !== null) for (const dep of reaction.deps) {
		if (includes.call(sources, dep)) return true;
		if ((dep.f & 2) !== 0 && depends_on(dep, sources, checked)) {
			checked.set(dep, true);
			return true;
		}
	}
	checked.set(reaction, false);
	return false;
}
/**
* @param {Effect} effect
* @returns {void}
*/
function schedule_effect(effect) {
	/** @type {Batch} */ current_batch.schedule(effect);
}
/** @type {Source<number>[]} */
var eager_versions = [];
function eager_flush() {
	flushSync(() => {
		const eager = eager_versions;
		eager_versions = [];
		for (const version of eager) update(version);
	});
}
/** @type {Map<Reaction, Source<number>>} */
var version_map = /* @__PURE__ */ new Map();
/**
* Implementation of `$state.eager(fn())`
* @template T
* @param {() => T} fn
* @returns {T}
*/
function eager(fn) {
	var initial = true;
	var value = void 0;
	if (active_reaction === null) return fn();
	let parent = active_reaction;
	let version = version_map.get(parent) ?? source(0);
	version_map.set(parent, version);
	version.label ??= "$state.eager version";
	teardown(() => {
		if (parent.f & 33554432) version_map.delete(parent);
	});
	get(version);
	eager_effect(() => {
		if (initial) {
			var previous_batch_values = batch_values;
			try {
				batch_values = null;
				value = fn();
			} finally {
				batch_values = previous_batch_values;
			}
			return;
		}
		if (eager_versions.length === 0) queue_micro_task(eager_flush);
		eager_versions.push(version);
	});
	initial = false;
	return value;
}
/**
* Mark all the effects inside a skipped branch CLEAN, so that
* they can be correctly rescheduled later. Tracks dirty and maybe_dirty
* effects so they can be rescheduled if the branch survives.
* @param {Effect} effect
* @param {{ d: Effect[], m: Effect[] }} tracked
*/
function reset_branch(effect, tracked) {
	if ((effect.f & 32) !== 0 && (effect.f & 1024) !== 0) return;
	if ((effect.f & 2048) !== 0) tracked.d.push(effect);
	else if ((effect.f & 4096) !== 0) tracked.m.push(effect);
	set_signal_status(effect, CLEAN);
	var e = effect.first;
	while (e !== null) {
		reset_branch(e, tracked);
		e = e.next;
	}
}
/**
* Mark an entire effect tree clean following an error
* @param {Effect} effect
*/
function reset_all(effect) {
	set_signal_status(effect, CLEAN);
	var e = effect.first;
	while (e !== null) {
		reset_all(e);
		e = e.next;
	}
}
/**
* Creates a 'fork', in which state changes are evaluated but not applied to the DOM.
* This is useful for speculatively loading data (for example) when you suspect that
* the user is about to take some action.
*
* Frameworks like SvelteKit can use this to preload data when the user touches or
* hovers over a link, making any subsequent navigation feel instantaneous.
*
* The `fn` parameter is a synchronous function that modifies some state. The
* state changes will be reverted after the fork is initialised, then reapplied
* if and when the fork is eventually committed.
*
* When it becomes clear that a fork will _not_ be committed (e.g. because the
* user navigated elsewhere), it must be discarded to avoid leaking memory.
*
* @param {() => void} fn
* @returns {Fork}
* @since 5.42
*/
function fork(fn) {
	if (!async_mode_flag) experimental_async_required("fork");
	if (current_batch !== null) fork_timing();
	flushSync();
	var batch = Batch.ensure();
	batch.is_fork = true;
	batch_values = /* @__PURE__ */ new Map();
	var committed = false;
	var settled = batch.settled();
	fn();
	flushSync();
	return {
		commit: async () => {
			if (committed) {
				await settled;
				return;
			}
			if (!batch.linked) fork_discarded();
			committed = true;
			batch.is_fork = false;
			for (var [source, [value]] of batch.current) {
				source.v = value;
				source.wv = increment_write_version();
			}
			flushSync(() => {
				/** @type {Set<Effect>} */
				var eager_effects = /* @__PURE__ */ new Set();
				for (var source of batch.current.keys()) mark_eager_effects(source, eager_effects);
				set_eager_effects(eager_effects);
				flush_eager_effects();
			});
			batch.flush();
			await settled;
		},
		discard: () => {
			for (var source of batch.current.keys()) source.wv = increment_write_version();
			if (!committed && batch.linked) batch.discard();
		}
	};
}
// node_modules/svelte/src/internal/client/reactivity/sources.js
/** @import { Derived, Effect, Source, Value } from '#client' */
/** @type {Set<Effect>} */
var eager_effects = /* @__PURE__ */ new Set();
/** @type {Map<Value, any>} */
var old_values = /* @__PURE__ */ new Map();
/**
* @param {Set<any>} v
*/
function set_eager_effects(v) {
	eager_effects = v;
}
var eager_effects_deferred = false;
function set_eager_effects_deferred() {
	eager_effects_deferred = true;
}
/**
* @template V
* @param {V} v
* @param {Error | null} [stack]
* @returns {Source<V>}
*/
function source(v, stack) {
	/** @type {Source<V>} */
	var signal = {
		f: 0,
		v,
		reactions: null,
		equals: equals$1,
		rv: 0,
		wv: 0
	};
	if (tracing_mode_flag) {
		signal.created = stack ?? get_error("created at");
		signal.updated = null;
		signal.set_during_effect = false;
		signal.trace = null;
	}
	return signal;
}
/**
* @template V
* @param {V} v
* @param {Error | null} [stack]
*/
/*#__NO_SIDE_EFFECTS__*/
function state(v, stack) {
	const s = source(v, stack);
	push_reaction_value(s);
	return s;
}
/**
* @template V
* @param {V} initial_value
* @param {boolean} [immutable]
* @returns {Source<V>}
*/
/*#__NO_SIDE_EFFECTS__*/
function mutable_source(initial_value, immutable = false, trackable = true) {
	const s = source(initial_value);
	if (!immutable) s.equals = safe_equals;
	if (legacy_mode_flag && trackable && component_context !== null && component_context.l !== null) (component_context.l.s ??= []).push(s);
	return s;
}
/**
* @template V
* @param {Value<V>} source
* @param {V} value
*/
function mutate(source, value) {
	set(source, untrack(() => get(source)));
	return value;
}
/**
* @template V
* @param {Value<V>} source
* @param {V} value
* @param {boolean} [should_proxy]
* @returns {V}
*/
function set(source, value, should_proxy = false) {
	if (active_reaction !== null && (!untracking || (active_reaction.f & 131072) !== 0) && is_runes() && (active_reaction.f & 4325394) !== 0 && (current_sources === null || !current_sources.has(source))) state_unsafe_mutation();
	let new_value = should_proxy ? proxy(value) : value;
	tag_proxy(new_value, source.label);
	return internal_set(source, new_value, legacy_updates);
}
/**
* A set of signals we have already seen while traversing in mark_reactions.
* Not always set to balance the common case of sources only having a couple
* of (transitive) dependencies (where always creating a Set would be bad for perf)
* with the edge case of extremely deep or wide dependency arrays with cycles.
* @type {Set<any> | null}
*/
var seen = null;
/** Number of transitive dependencies, see {@link seen} for more info */
var count_deps = 0;
/**
* @template V
* @param {Value<V>} source
* @param {V} value
* @param {Effect[] | null} [updated_during_traversal]
* @returns {V}
*/
function internal_set(source, value, updated_during_traversal = null) {
	if (!source.equals(value)) {
		if (is_destroying_effect) old_values.set(source, value);
		else if (!old_values.has(source)) old_values.set(source, source.v);
		var batch = Batch.ensure();
		batch.capture(source, value);
		if (tracing_mode_flag || active_effect !== null) {
			source.updated ??= /* @__PURE__ */ new Map();
			const count = (source.updated.get("")?.count ?? 0) + 1;
			source.updated.set("", {
				error: null,
				count
			});
			if (tracing_mode_flag || count > 5) {
				const error = get_error("updated at");
				if (error !== null) {
					let entry = source.updated.get(error.stack);
					if (!entry) {
						entry = {
							error,
							count: 0
						};
						source.updated.set(error.stack, entry);
					}
					entry.count++;
				}
			}
		}
		if (active_effect !== null) source.set_during_effect = true;
		if ((source.f & 2) !== 0) {
			const derived = source;
			if ((source.f & 2048) !== 0) execute_derived(derived);
			if (batch_values === null) update_derived_status(derived);
		}
		source.wv = increment_write_version();
		seen = null;
		count_deps = 0;
		mark_reactions(source, DIRTY, updated_during_traversal);
		seen = null;
		if (is_runes() && active_effect !== null && (active_effect.f & 1024) !== 0 && (active_effect.f & 96) === 0) {
			if (untracked_writes === null) set_untracked_writes([source]);
			else untracked_writes.push(source);
		}
		if (!batch.is_fork && eager_effects.size > 0 && !eager_effects_deferred) flush_eager_effects();
	}
	return value;
}
function flush_eager_effects() {
	eager_effects_deferred = false;
	for (const effect of eager_effects) {
		if ((effect.f & 1024) !== 0) set_signal_status(effect, MAYBE_DIRTY);
		let dirty;
		try {
			dirty = is_dirty(effect);
		} catch {
			dirty = true;
		}
		if (dirty) update_effect(effect);
	}
	eager_effects.clear();
}
/**
* @template {number | bigint} T
* @param {Source<T>} source
* @param {1 | -1} [d]
* @returns {T}
*/
function update(source, d = 1) {
	var value = get(source);
	var result = d === 1 ? value++ : value--;
	set(source, value);
	return result;
}
/**
* @template {number | bigint} T
* @param {Source<T>} source
* @param {1 | -1} [d]
* @returns {T}
*/
function update_pre(source, d = 1) {
	var value = get(source);
	return set(source, d === 1 ? ++value : --value);
}
/**
* Silently (without using `get`) increment a source
* @param {Source<number>} source
*/
function increment(source) {
	set(source, source.v + 1);
}
/**
* @param {Value} signal
* @param {number} status should be DIRTY or MAYBE_DIRTY
* @param {Effect[] | null} updated_during_traversal
* @returns {void}
*/
function mark_reactions(signal, status, updated_during_traversal) {
	var reactions = signal.reactions;
	if (reactions === null) return;
	var runes = is_runes();
	var length = reactions.length;
	count_deps += length;
	if (count_deps > 1e5 && seen === null) seen = /* @__PURE__ */ new Set();
	if (seen !== null) {
		if (seen.has(signal)) return;
		seen.add(signal);
	}
	for (var i = 0; i < length; i++) {
		var reaction = reactions[i];
		var flags = reaction.f;
		if (!runes && reaction === active_effect) continue;
		var not_dirty = (flags & DIRTY) === 0;
		if (not_dirty) set_signal_status(reaction, status);
		if ((flags & 131072) !== 0) eager_effects.add(reaction);
		else if ((flags & 2) !== 0) {
			var derived = reaction;
			batch_values?.delete(derived);
			mark_reactions(derived, MAYBE_DIRTY, updated_during_traversal);
		} else if (not_dirty) {
			var effect = reaction;
			if ((flags & 16) !== 0 && eager_block_effects !== null) eager_block_effects.add(effect);
			if (updated_during_traversal !== null) updated_during_traversal.push(effect);
			else schedule_effect(effect);
		}
	}
}
// node_modules/svelte/src/internal/client/proxy.js
/** @import { Source } from '#client' */
var regex_is_valid_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
/**
* @template T
* @param {T} value
* @returns {T}
*/
function proxy(value) {
	if (typeof value !== "object" || value === null || STATE_SYMBOL in value || COMPONENT_SYMBOL in value) return value;
	const prototype = get_prototype_of(value);
	if (prototype !== object_prototype && prototype !== array_prototype) return value;
	/** @type {Map<any, Source<any>>} */
	var sources = /* @__PURE__ */ new Map();
	var is_proxied_array = is_array(value);
	var version = /* @__PURE__ */ state(0);
	var stack = tracing_mode_flag ? get_error("created at") : null;
	var parent_version = update_version;
	/**
	* Executes the proxy in the context of the reaction it was originally created in, if any
	* @template T
	* @param {() => T} fn
	*/
	var with_parent = (fn) => {
		if (update_version === parent_version) return fn();
		var reaction = active_reaction;
		var version = update_version;
		set_active_reaction(null);
		set_update_version(parent_version);
		var result = fn();
		set_active_reaction(reaction);
		set_update_version(version);
		return result;
	};
	if (is_proxied_array) {
		sources.set("length", /* @__PURE__ */ state(
			/** @type {any[]} */
			value.length,
			stack
		));
		value = inspectable_array(value);
	}
	/** Used in dev for $inspect.trace() */
	var path = "";
	let updating = false;
	/** @param {string} new_path */
	function update_path(new_path) {
		if (updating) return;
		updating = true;
		path = new_path;
		tag(version, `${path} version`);
		for (const [prop, source] of sources) tag(source, get_label(path, prop));
		updating = false;
	}
	return new Proxy(value, {
		defineProperty(_, prop, descriptor) {
			if (!("value" in descriptor) || descriptor.configurable === false || descriptor.enumerable === false || descriptor.writable === false) state_descriptors_fixed();
			var s = sources.get(prop);
			if (s === void 0) with_parent(() => {
				var s = /* @__PURE__ */ state(descriptor.value, stack);
				sources.set(prop, s);
				if (typeof prop === "string") tag(s, get_label(path, prop));
				return s;
			});
			else set(s, descriptor.value, true);
			return true;
		},
		deleteProperty(target, prop) {
			var s = sources.get(prop);
			if (s === void 0) {
				if (prop in target) {
					const s = with_parent(() => /* @__PURE__ */ state(UNINITIALIZED, stack));
					sources.set(prop, s);
					increment(version);
					tag(s, get_label(path, prop));
				}
			} else {
				set(s, UNINITIALIZED);
				increment(version);
			}
			return true;
		},
		get(target, prop, receiver) {
			if (prop === STATE_SYMBOL) return value;
			if (prop === PROXY_PATH_SYMBOL) return update_path;
			var s = sources.get(prop);
			var exists = prop in target;
			if (s === void 0 && (!exists || get_descriptor(target, prop)?.writable)) {
				s = with_parent(() => {
					var s = /* @__PURE__ */ state(proxy(exists ? target[prop] : UNINITIALIZED), stack);
					tag(s, get_label(path, prop));
					return s;
				});
				sources.set(prop, s);
			}
			if (s !== void 0) {
				var v = get(s);
				return v === UNINITIALIZED ? void 0 : v;
			}
			return Reflect.get(target, prop, receiver);
		},
		getOwnPropertyDescriptor(target, prop) {
			this.has?.(target, prop);
			var descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
			var s = sources.get(prop);
			if (s !== void 0) {
				var value = get(s);
				if (value === UNINITIALIZED) return;
				if (descriptor && "value" in descriptor) descriptor.value = value;
				else return {
					enumerable: true,
					configurable: true,
					value,
					writable: true
				};
			}
			return descriptor;
		},
		has(target, prop) {
			if (prop === STATE_SYMBOL) return true;
			var s = sources.get(prop);
			var has = s !== void 0 && s.v !== UNINITIALIZED || Reflect.has(target, prop);
			if (s !== void 0 || (active_effect !== null || active_reaction !== null) && (!has || get_descriptor(target, prop)?.writable)) {
				if (s === void 0) {
					s = with_parent(() => {
						var s = /* @__PURE__ */ state(has ? proxy(target[prop]) : UNINITIALIZED, stack);
						tag(s, get_label(path, prop));
						return s;
					});
					sources.set(prop, s);
				}
				if (get(s) === UNINITIALIZED) return false;
			}
			return has;
		},
		set(target, prop, value, receiver) {
			var s = sources.get(prop);
			var has = prop in target;
			if (is_proxied_array && prop === "length") for (var i = value; i < s.v; i += 1) {
				var other_s = sources.get(i + "");
				if (other_s !== void 0) set(other_s, UNINITIALIZED);
				else if (i in target) {
					other_s = with_parent(() => /* @__PURE__ */ state(UNINITIALIZED, stack));
					sources.set(i + "", other_s);
					tag(other_s, get_label(path, i));
				}
			}
			if (s === void 0) {
				if (!has || get_descriptor(target, prop)?.writable) {
					s = with_parent(() => /* @__PURE__ */ state(void 0, stack));
					tag(s, get_label(path, prop));
					set(s, proxy(value));
					sources.set(prop, s);
				}
			} else {
				has = s.v !== UNINITIALIZED;
				var p = with_parent(() => proxy(value));
				set(s, p);
			}
			var descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
			if (descriptor?.set) descriptor.set.call(receiver, value);
			if (!has) {
				if (is_proxied_array && typeof prop === "string") {
					var ls = sources.get("length");
					var n = Number(prop);
					if (Number.isInteger(n) && n >= ls.v) set(ls, n + 1);
				}
				increment(version);
			}
			return true;
		},
		ownKeys(target) {
			get(version);
			var own_keys = Reflect.ownKeys(target).filter((key) => {
				var source = sources.get(key);
				return source === void 0 || source.v !== UNINITIALIZED;
			});
			for (var [key, source] of sources) if (source.v !== UNINITIALIZED && !(key in target)) own_keys.push(key);
			return own_keys;
		},
		setPrototypeOf() {
			state_prototype_fixed();
		}
	});
}
/**
* @param {string} path
* @param {string | symbol} prop
*/
function get_label(path, prop) {
	if (typeof prop === "symbol") return `${path}[Symbol(${prop.description ?? ""})]`;
	if (regex_is_valid_identifier.test(prop)) return `${path}.${prop}`;
	return /^\d+$/.test(prop) ? `${path}[${prop}]` : `${path}['${prop}']`;
}
/**
* @param {any} value
*/
function get_proxied_value(value) {
	try {
		if (value !== null && typeof value === "object" && STATE_SYMBOL in value) return value[STATE_SYMBOL];
	} catch {}
	return value;
}
/**
* @param {any} a
* @param {any} b
*/
function is(a, b) {
	return Object.is(get_proxied_value(a), get_proxied_value(b));
}
var ARRAY_MUTATING_METHODS = /* @__PURE__ */ new Set([
	"copyWithin",
	"fill",
	"pop",
	"push",
	"reverse",
	"shift",
	"sort",
	"splice",
	"unshift"
]);
/**
* Wrap array mutating methods so $inspect is triggered only once and
* to prevent logging an array in intermediate state (e.g. with an empty slot)
* @param {any[]} array
*/
function inspectable_array(array) {
	return new Proxy(array, { get(target, prop, receiver) {
		var value = Reflect.get(target, prop, receiver);
		if (!ARRAY_MUTATING_METHODS.has(prop)) return value;
		/**
		* @this {any[]}
		* @param {any[]} args
		*/
		return function(...args) {
			set_eager_effects_deferred();
			var result = value.apply(this, args);
			flush_eager_effects();
			return result;
		};
	} });
}
// node_modules/svelte/src/internal/client/dev/equality.js
function init_array_prototype_warnings() {
	const array_prototype = Array.prototype;
	const cleanup = Array.__svelte_cleanup;
	if (cleanup) cleanup();
	const { indexOf, lastIndexOf, includes } = array_prototype;
	array_prototype.indexOf = function(item, from_index) {
		const index = indexOf.call(this, item, from_index);
		if (index === -1) {
			for (let i = from_index ?? 0; i < this.length; i += 1) if (get_proxied_value(this[i]) === item) {
				state_proxy_equality_mismatch("array.indexOf(...)");
				break;
			}
		}
		return index;
	};
	array_prototype.lastIndexOf = function(item, from_index) {
		const index = lastIndexOf.call(this, item, from_index ?? this.length - 1);
		if (index === -1) {
			for (let i = 0; i <= (from_index ?? this.length - 1); i += 1) if (get_proxied_value(this[i]) === item) {
				state_proxy_equality_mismatch("array.lastIndexOf(...)");
				break;
			}
		}
		return index;
	};
	array_prototype.includes = function(item, from_index) {
		const has = includes.call(this, item, from_index);
		if (!has) {
			for (let i = 0; i < this.length; i += 1) if (get_proxied_value(this[i]) === item) {
				state_proxy_equality_mismatch("array.includes(...)");
				break;
			}
		}
		return has;
	};
	Array.__svelte_cleanup = () => {
		array_prototype.indexOf = indexOf;
		array_prototype.lastIndexOf = lastIndexOf;
		array_prototype.includes = includes;
	};
}
/**
* @param {any} a
* @param {any} b
* @param {boolean} equal
* @returns {boolean}
*/
function strict_equals(a, b, equal = true) {
	try {
		if (a === b !== (get_proxied_value(a) === get_proxied_value(b))) state_proxy_equality_mismatch(equal ? "===" : "!==");
	} catch {}
	return a === b === equal;
}
/**
* @param {any} a
* @param {any} b
* @param {boolean} equal
* @returns {boolean}
*/
function equals(a, b, equal = true) {
	if (a == b !== (get_proxied_value(a) == get_proxied_value(b))) state_proxy_equality_mismatch(equal ? "==" : "!=");
	return a == b === equal;
}
// node_modules/svelte/src/internal/client/dom/operations.js
/** @import { Effect, TemplateNode } from '#client' */
/** @type {Window} */
var $window;
/** @type {Document} */
var $document;
/** @type {boolean} */
var is_firefox;
/** @type {() => Node | null} */
var first_child_getter;
/** @type {() => Node | null} */
var next_sibling_getter;
/**
* Initialize these lazily to avoid issues when using the runtime in a server context
* where these globals are not available while avoiding a separate server entry point
*/
function init_operations() {
	if ($window !== void 0) return;
	$window = window;
	$document = document;
	is_firefox = /Firefox/.test(navigator.userAgent);
	var element_prototype = Element.prototype;
	var node_prototype = Node.prototype;
	var text_prototype = Text.prototype;
	first_child_getter = get_descriptor(node_prototype, "firstChild").get;
	next_sibling_getter = get_descriptor(node_prototype, "nextSibling").get;
	if (is_extensible(element_prototype)) {
		/** @type {any} */ element_prototype[CLASS_CACHE] = void 0;
		/** @type {any} */ element_prototype[ATTRIBUTES_CACHE] = null;
		/** @type {any} */ element_prototype[STYLE_CACHE] = void 0;
		element_prototype.__e = void 0;
	}
	if (is_extensible(text_prototype))
 /** @type {any} */ text_prototype[TEXT_CACHE] = void 0;
	element_prototype.__svelte_meta = null;
	init_array_prototype_warnings();
}
/**
* @param {string} value
* @returns {Text}
*/
function create_text(value = "") {
	return document.createTextNode(value);
}
/**
* @template {Node} N
* @param {N} node
*/
/*@__NO_SIDE_EFFECTS__*/
function get_first_child(node) {
	return first_child_getter.call(node);
}
/**
* @template {Node} N
* @param {N} node
*/
/*@__NO_SIDE_EFFECTS__*/
function get_next_sibling(node) {
	return next_sibling_getter.call(node);
}
/**
* Don't mark this as side-effect-free, hydration needs to walk all nodes
* @template {Node} N
* @param {N} node
* @param {boolean} is_text
* @returns {TemplateNode | null}
*/
function child(node, is_text) {
	if (!hydrating) return /* @__PURE__ */ get_first_child(node);
	var child = /* @__PURE__ */ get_first_child(hydrate_node);
	if (child === null) child = hydrate_node.appendChild(create_text());
	else if (is_text && child.nodeType !== 3) {
		var text = create_text();
		child?.before(text);
		set_hydrate_node(text);
		return text;
	}
	if (is_text) merge_text_nodes(child);
	set_hydrate_node(child);
	return child;
}
/**
* Don't mark this as side-effect-free, hydration needs to walk all nodes
* @param {TemplateNode} node
* @param {boolean} [is_text]
* @returns {TemplateNode | null}
*/
function first_child(node, is_text = false) {
	if (!hydrating) {
		var first = /* @__PURE__ */ get_first_child(node);
		if (first instanceof Comment && first.data === "") return /* @__PURE__ */ get_next_sibling(first);
		return first;
	}
	if (is_text) {
		if (hydrate_node?.nodeType !== 3) {
			var text = create_text();
			hydrate_node?.before(text);
			set_hydrate_node(text);
			return text;
		}
		merge_text_nodes(hydrate_node);
	}
	return hydrate_node;
}
/**
* `child`, for the very common case of an element with exactly one child. Resetting the
* hydration cursor is part of the same step, so the compiler doesn't have to emit a
* separate `reset` call for every `<p>{text}</p>` in an app.
* Don't mark this as side-effect-free, hydration needs to walk all nodes
* @param {TemplateNode} node
* @param {boolean} [is_text]
* @returns {TemplateNode | null}
*/
function only_child(node, is_text = false) {
	if (!hydrating) return /* @__PURE__ */ get_first_child(node);
	var first = child(node, is_text);
	reset(node);
	return first;
}
/**
* Don't mark this as side-effect-free, hydration needs to walk all nodes
* @param {TemplateNode} node
* @param {number} count
* @param {boolean} is_text
* @returns {TemplateNode | null}
*/
function sibling(node, count = 1, is_text = false) {
	let next_sibling = hydrating ? hydrate_node : node;
	var last_sibling;
	while (count--) {
		last_sibling = next_sibling;
		next_sibling = /* @__PURE__ */ get_next_sibling(next_sibling);
	}
	if (!hydrating) return next_sibling;
	if (is_text) {
		if (next_sibling?.nodeType !== 3) {
			var text = create_text();
			if (next_sibling === null) last_sibling?.after(text);
			else next_sibling.before(text);
			set_hydrate_node(text);
			return text;
		}
		merge_text_nodes(next_sibling);
	}
	set_hydrate_node(next_sibling);
	return next_sibling;
}
/**
* @template {Node} N
* @param {N} node
* @returns {void}
*/
function clear_text_content(node) {
	node.textContent = "";
}
/**
* Returns `true` if we're updating the current block, for example `condition` in
* an `{#if condition}` block just changed. In this case, the branch should be
* appended (or removed) at the same time as other updates within the
* current `<svelte:boundary>`
*/
function should_defer_append() {
	if (!async_mode_flag) return false;
	if (eager_block_effects !== null) return false;
	return (active_effect.f & REACTION_RAN) !== 0;
}
/**
* Branching here is intentional and load-bearing for perf. `createElement(tag)`
* hits a fast path in Blink that `createElementNS(NAMESPACE_HTML, tag)` doesn't,
* and passing an explicit `undefined` as the trailing options arg measurably
* slows both APIs. Funnelling every case through a single `createElementNS(ns,
* tag, options)` call would be smaller but slower on the HTML path.
*
* @template {keyof HTMLElementTagNameMap | string} T
* @param {T} tag
* @param {string} [namespace]
* @param {string} [is]
* @returns {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element}
*/
function create_element(tag, namespace, is) {
	if (namespace == null || namespace === "http://www.w3.org/1999/xhtml") return is ? document.createElement(tag, { is }) : document.createElement(tag);
	return is ? document.createElementNS(namespace, tag, { is }) : document.createElementNS(namespace, tag);
}
function create_fragment() {
	return document.createDocumentFragment();
}
/**
* @param {string} data
* @returns
*/
function create_comment(data = "") {
	return document.createComment(data);
}
/**
* @param {Element} element
* @param {string} key
* @param {string} value
* @returns
*/
function set_attribute(element, key, value = "") {
	if (key.startsWith("xlink:")) {
		element.setAttributeNS("http://www.w3.org/1999/xlink", key, value);
		return;
	}
	return element.setAttribute(key, value);
}
/**
* Browsers split text nodes larger than 65536 bytes when parsing.
* For hydration to succeed, we need to stitch them back together
* @param {Text} text
*/
function merge_text_nodes(text) {
	if (text.nodeValue.length < 65536) return;
	let next = text.nextSibling;
	while (next !== null && next.nodeType === 3) {
		next.remove();
		/** @type {string} */ text.nodeValue += next.nodeValue;
		next = text.nextSibling;
	}
}
// node_modules/svelte/src/internal/client/error-handling.js
/** @import { Derived, Effect } from '#client' */
/** @import { Boundary } from './dom/blocks/boundary.js' */
var adjustments = /* @__PURE__ */ new WeakMap();
/**
* @param {unknown} error
*/
function handle_error(error) {
	var effect = active_effect;
	if (effect === null) {
		/** @type {Derived} */ active_reaction.f |= ERROR_VALUE;
		return error;
	}
	if (error instanceof Error && !adjustments.has(error)) adjustments.set(error, get_adjustments(error, effect));
	if ((effect.f & 32768) === 0 && (effect.f & 4) === 0) {
		if (!effect.parent && error instanceof Error) apply_adjustments(error);
		throw error;
	}
	invoke_error_boundary(error, effect);
}
/**
* @param {unknown} error
* @param {Effect | null} effect
*/
function invoke_error_boundary(error, effect) {
	if (error === HYDRATION_ERROR) throw error;
	if (effect !== null && (effect.f & 16384) !== 0) return;
	while (effect !== null) {
		if ((effect.f & 128) !== 0 && (effect.f & 33570816) === 0) {
			if ((effect.f & 32768) === 0) throw error;
			try {
				/** @type {Boundary} */ effect.b.error(error);
				return;
			} catch (e) {
				error = e;
			}
		}
		effect = effect.parent;
	}
	if (error instanceof Error) apply_adjustments(error);
	throw error;
}
/**
* Add useful information to the error message/stack in development
* @param {Error} error
* @param {Effect} effect
*/
function get_adjustments(error, effect) {
	const message_descriptor = get_descriptor(error, "message");
	if (message_descriptor && !message_descriptor.configurable) return;
	var indent = is_firefox ? "  " : "	";
	var component_stack = `\n${indent}in ${effect.fn?.name || "<unknown>"}`;
	var context = effect.ctx;
	while (context !== null) {
		component_stack += `\n${indent}in ${context.function?.[FILENAME].split("/").pop()}`;
		context = context.p;
	}
	return {
		message: error.message + `\n${component_stack}\n`,
		stack: error.stack?.split("\n").filter((line) => !line.includes("svelte/src/internal")).join("\n")
	};
}
/**
* @param {Error} error
*/
function apply_adjustments(error) {
	const adjusted = adjustments.get(error);
	if (adjusted) {
		define_property(error, "message", { value: adjusted.message });
		define_property(error, "stack", { value: adjusted.stack });
	}
}
// node_modules/svelte/src/internal/client/reactivity/effects.js
/** @import { Blocker, ComponentContext, ComponentContextLegacy, Derived, Effect, TemplateNode, TransitionManager } from '#client' */
/**
* @param {'$effect' | '$effect.pre' | '$inspect'} rune
*/
function validate_effect(rune) {
	if (active_effect === null) {
		if (active_reaction === null) effect_orphan(rune);
		effect_in_unowned_derived();
	}
	if (is_destroying_effect) effect_in_teardown(rune);
}
/**
* @param {Effect} effect
* @param {Effect} parent_effect
*/
function push_effect(effect, parent_effect) {
	var parent_last = parent_effect.last;
	if (parent_last === null) parent_effect.last = parent_effect.first = effect;
	else {
		parent_last.next = effect;
		effect.prev = parent_last;
		parent_effect.last = effect;
	}
}
/**
* @param {number} type
* @param {null | (() => void | (() => void))} fn
* @returns {Effect}
*/
function create_effect(type, fn) {
	var parent = active_effect;
	while (parent !== null && (parent.f & 131072) !== 0) parent = parent.parent;
	if (parent !== null && (parent.f & 8192) !== 0) type |= INERT;
	/** @type {Effect} */
	var effect = {
		ctx: component_context,
		deps: null,
		nodes: null,
		f: type | DIRTY | 512,
		first: null,
		fn,
		last: null,
		next: null,
		parent,
		b: parent && parent.b,
		prev: null,
		teardown: null,
		wv: 0,
		ac: null
	};
	effect.component_function = dev_current_component_function;
	current_batch?.register_created_effect(effect);
	/** @type {Effect | null} */
	var e = effect;
	if ((type & 4) !== 0) {
		if (collected_effects !== null) collected_effects.push(effect);
		else Batch.ensure().schedule(effect);
	} else if (fn !== null) {
		try {
			update_effect(effect);
		} catch (e) {
			destroy_effect(effect);
			throw e;
		}
		if (e.deps === null && e.teardown === null && e.nodes === null && e.first === e.last && (e.f & 524288) === 0) {
			e = e.first;
			if ((type & 16) !== 0 && (type & 65536) !== 0 && e !== null) e.f |= EFFECT_TRANSPARENT;
		}
	}
	if (e !== null) {
		e.parent = parent;
		if (parent !== null) push_effect(e, parent);
		if (active_reaction !== null && (active_reaction.f & 2) !== 0 && (type & 64) === 0) {
			var derived = active_reaction;
			(derived.effects ??= []).push(e);
		}
	}
	return effect;
}
/**
* Internal representation of `$effect.tracking()`
* @returns {boolean}
*/
function effect_tracking() {
	return active_reaction !== null && !untracking;
}
/**
* @param {() => void} fn
*/
function teardown(fn) {
	const effect = create_effect(8, null);
	set_signal_status(effect, CLEAN);
	effect.teardown = fn;
	return effect;
}
/**
* Internal representation of `$effect(...)`
* @param {() => void | (() => void)} fn
*/
function user_effect(fn) {
	validate_effect("$effect");
	define_property(fn, "name", { value: "$effect" });
	var flags = active_effect.f;
	if (!active_reaction && (flags & 32) !== 0 && component_context !== null && !component_context.i) {
		var context = component_context;
		(context.e ??= []).push(fn);
	} else return create_user_effect(fn);
}
/**
* @param {() => void | (() => void)} fn
*/
function create_user_effect(fn) {
	return create_effect(4 | USER_EFFECT, fn);
}
/**
* Internal representation of `$effect.pre(...)`
* @param {() => void | (() => void)} fn
* @returns {Effect}
*/
function user_pre_effect(fn) {
	validate_effect("$effect.pre");
	define_property(fn, "name", { value: "$effect.pre" });
	return create_effect(8 | USER_EFFECT, fn);
}
/** @param {() => void | (() => void)} fn */
function eager_effect(fn) {
	return create_effect(EAGER_EFFECT, fn);
}
/**
* Internal representation of `$effect.root(...)`
* @param {() => void | (() => void)} fn
* @returns {() => void}
*/
function effect_root(fn) {
	Batch.ensure();
	const effect = create_effect(64 | EFFECT_PRESERVED, fn);
	return () => {
		destroy_effect(effect);
	};
}
/**
* An effect root whose children can transition out
* @param {() => void} fn
* @returns {(options?: { outro?: boolean }) => Promise<void>}
*/
function component_root(fn) {
	Batch.ensure();
	const effect = create_effect(64 | EFFECT_PRESERVED, fn);
	return (options = {}) => {
		return new Promise((fulfil) => {
			if (options.outro) pause_effect(effect, () => {
				destroy_effect(effect);
				fulfil(void 0);
			});
			else {
				destroy_effect(effect);
				fulfil(void 0);
			}
		});
	};
}
/**
* @param {() => void | (() => void)} fn
* @returns {Effect}
*/
function effect(fn) {
	return create_effect(4, fn);
}
/**
* Internal representation of `$: ..`
* @param {() => any} deps
* @param {() => void | (() => void)} fn
*/
function legacy_pre_effect(deps, fn) {
	var context = component_context;
	/** @type {{ effect: null | Effect, ran: boolean, deps: () => any }} */
	var token = {
		effect: null,
		ran: false,
		deps
	};
	context.l.$.push(token);
	token.effect = render_effect(() => {
		deps();
		if (token.ran) return;
		token.ran = true;
		var effect = active_effect;
		try {
			set_active_effect(effect.parent);
			untrack(fn);
		} finally {
			set_active_effect(effect);
		}
	});
}
function legacy_pre_effect_reset() {
	var context = component_context;
	render_effect(() => {
		for (var token of context.l.$) {
			token.deps();
			var effect = token.effect;
			if ((effect.f & 1024) !== 0 && effect.deps !== null) set_signal_status(effect, MAYBE_DIRTY);
			if (is_dirty(effect)) update_effect(effect);
			token.ran = false;
		}
	});
}
/**
* @param {() => void | (() => void)} fn
* @returns {Effect}
*/
function async_effect(fn) {
	return create_effect(ASYNC | EFFECT_PRESERVED, fn);
}
/**
* @param {() => void | (() => void)} fn
* @returns {Effect}
*/
function render_effect(fn, flags = 0) {
	return create_effect(8 | flags, fn);
}
/**
* @param {(...expressions: any) => void | (() => void)} fn
* @param {Array<() => any>} sync
* @param {Array<() => Promise<any>>} async
* @param {Blocker[]} blockers
*/
function template_effect(fn, sync = [], async = [], blockers = []) {
	flatten(blockers, sync, async, (values) => {
		create_effect(8, () => {
			fn(...values.map(get));
		});
	});
}
/**
* Like `template_effect`, but with an effect which is deferred until the batch commits
* @param {(...expressions: any) => void | (() => void)} fn
* @param {Array<() => any>} sync
* @param {Array<() => Promise<any>>} async
* @param {Blocker[]} blockers
*/
function deferred_template_effect(fn, sync = [], async = [], blockers = []) {
	flatten(blockers, sync, async, (values) => {
		create_effect(4, () => fn(...values.map(get)));
	});
}
/**
* @param {(() => void)} fn
* @param {number} flags
*/
function block(fn, flags = 0) {
	var effect = create_effect(16 | flags, fn);
	effect.dev_stack = dev_stack;
	return effect;
}
/**
* @param {(() => void)} fn
* @param {number} flags
*/
function managed(fn, flags = 0) {
	var effect = create_effect(MANAGED_EFFECT | flags, fn);
	effect.dev_stack = dev_stack;
	return effect;
}
/**
* @param {(() => void)} fn
*/
function branch(fn) {
	return create_effect(32 | EFFECT_PRESERVED, fn);
}
/**
* @param {Effect} effect
*/
function execute_effect_teardown(effect) {
	var teardown = effect.teardown;
	if (teardown !== null) {
		const previously_destroying_effect = is_destroying_effect;
		const previous_reaction = active_reaction;
		set_is_destroying_effect(true);
		set_active_reaction(null);
		try {
			teardown.call(null);
		} catch (error) {
			invoke_error_boundary(error, effect.parent);
		} finally {
			set_is_destroying_effect(previously_destroying_effect);
			set_active_reaction(previous_reaction);
		}
	}
}
/**
* @param {Effect} signal
* @param {boolean} remove_dom
* @returns {void}
*/
function destroy_effect_children(signal, remove_dom = false) {
	var effect = signal.first;
	signal.first = signal.last = null;
	while (effect !== null) {
		const controller = effect.ac;
		if (controller !== null) without_reactive_context(() => {
			controller.abort(STALE_REACTION);
		});
		var next = effect.next;
		if ((effect.f & 64) !== 0) effect.parent = null;
		else destroy_effect(effect, remove_dom);
		effect = next;
	}
}
/**
* @param {Effect} signal
* @returns {void}
*/
function destroy_block_effect_children(signal) {
	var effect = signal.first;
	while (effect !== null) {
		var next = effect.next;
		if ((effect.f & 32) === 0) destroy_effect(effect);
		effect = next;
	}
}
/**
* @param {Effect} effect
* @param {boolean} [remove_dom]
* @returns {void}
*/
function destroy_effect(effect, remove_dom = true) {
	var removed = false;
	if ((remove_dom || (effect.f & 262144) !== 0) && effect.nodes !== null && effect.nodes.end !== null) {
		remove_effect_dom(effect.nodes.start, effect.nodes.end);
		removed = true;
	}
	effect.f |= DESTROYING;
	destroy_effect_children(effect, remove_dom && !removed);
	remove_reactions(effect, 0);
	var transitions = effect.nodes && effect.nodes.t;
	if (transitions !== null) for (const transition of transitions) transition.stop();
	execute_effect_teardown(effect);
	effect.f ^= DESTROYING;
	effect.f |= DESTROYED;
	var parent = effect.parent;
	if (parent !== null && parent.first !== null) unlink_effect(effect);
	effect.component_function = null;
	effect.next = effect.prev = effect.teardown = effect.ctx = effect.deps = effect.fn = effect.nodes = effect.ac = effect.b = null;
}
/**
*
* @param {TemplateNode | null} node
* @param {TemplateNode} end
*/
function remove_effect_dom(node, end) {
	while (node !== null) {
		/** @type {TemplateNode | null} */
		var next = node === end ? null : /* @__PURE__ */ get_next_sibling(node);
		node.remove();
		node = next;
	}
}
/**
* Detach an effect from the effect tree, freeing up memory and
* reducing the amount of work that happens on subsequent traversals
* @param {Effect} effect
*/
function unlink_effect(effect) {
	var parent = effect.parent;
	var prev = effect.prev;
	var next = effect.next;
	if (prev !== null) prev.next = next;
	if (next !== null) next.prev = prev;
	if (parent !== null) {
		if (parent.first === effect) parent.first = next;
		if (parent.last === effect) parent.last = prev;
	}
}
/**
* When a block effect is removed, we don't immediately destroy it or yank it
* out of the DOM, because it might have transitions. Instead, we 'pause' it.
* It stays around (in memory, and in the DOM) until outro transitions have
* completed, and if the state change is reversed then we _resume_ it.
* A paused effect does not update, and the DOM subtree becomes inert.
* @param {Effect} effect
* @param {() => void} [callback]
* @param {boolean} [destroy]
*/
function pause_effect(effect, callback, destroy = true) {
	/** @type {TransitionManager[]} */
	var transitions = [];
	effect.f |= 256;
	pause_children(effect, transitions, true);
	var fn = () => {
		if (destroy) destroy_effect(effect);
		if (callback) callback();
	};
	var remaining = transitions.length;
	if (remaining > 0) {
		var check = () => --remaining || fn();
		for (var transition of transitions) transition.out(check);
	} else fn();
}
/**
* @param {Effect} effect
* @param {TransitionManager[]} transitions
* @param {boolean} local
*/
function pause_children(effect, transitions, local) {
	if ((effect.f & 8192) !== 0) return;
	effect.f ^= INERT;
	var t = effect.nodes && effect.nodes.t;
	if (t !== null) {
		for (const transition of t) if (transition.is_global || local) transitions.push(transition);
	}
	var child = effect.first;
	while (child !== null) {
		var sibling = child.next;
		if ((child.f & 64) === 0) {
			var transparent = (child.f & 65536) !== 0 || (child.f & 32) !== 0 && (effect.f & 16) !== 0;
			pause_children(child, transitions, transparent ? local : false);
		}
		child = sibling;
	}
}
/**
* The opposite of `pause_effect`. We call this if (for example)
* `x` becomes falsy then truthy: `{#if x}...{/if}`
* @param {Effect} effect
*/
function resume_effect(effect) {
	effect.f &= -257;
	resume_children(effect, true);
}
/**
* @param {Effect} effect
* @param {boolean} local
*/
function resume_children(effect, local) {
	if ((effect.f & 256) !== 0) return;
	if ((effect.f & 8192) === 0) return;
	effect.f ^= INERT;
	if ((effect.f & 1024) === 0) {
		set_signal_status(effect, DIRTY);
		Batch.ensure().schedule(effect);
	}
	var child = effect.first;
	while (child !== null) {
		var sibling = child.next;
		var transparent = (child.f & 65536) !== 0 || (child.f & 32) !== 0;
		resume_children(child, transparent ? local : false);
		child = sibling;
	}
	var t = effect.nodes && effect.nodes.t;
	if (t !== null) {
		for (const transition of t) if (transition.is_global || local) transition.in();
	}
}
function aborted(effect = active_effect) {
	return (effect.f & DESTROYED) !== 0;
}
/**
* @param {Effect} effect
* @param {DocumentFragment} fragment
*/
function move_effect(effect, fragment) {
	if (!effect.nodes) return;
	/** @type {TemplateNode | null} */
	var node = effect.nodes.start;
	var end = effect.nodes.end;
	while (node !== null) {
		/** @type {TemplateNode | null} */
		var next = node === end ? null : /* @__PURE__ */ get_next_sibling(node);
		fragment.append(node);
		node = next;
	}
}
// node_modules/svelte/src/internal/client/legacy.js
/** @import { Value } from '#client' */
/**
* @type {Set<Value> | null}
* @deprecated
*/
var captured_signals = null;
/**
* Capture an array of all the signals that are read when `fn` is called
* @template T
* @param {() => T} fn
*/
function capture_signals(fn) {
	var previous_captured_signals = captured_signals;
	try {
		captured_signals = /* @__PURE__ */ new Set();
		untrack(fn);
		if (previous_captured_signals !== null) for (var signal of captured_signals) previous_captured_signals.add(signal);
		return captured_signals;
	} finally {
		captured_signals = previous_captured_signals;
	}
}
/**
* Invokes a function and captures all signals that are read during the invocation,
* then invalidates them.
* @param {() => any} fn
* @deprecated
*/
function invalidate_inner_signals(fn) {
	for (var signal of capture_signals(fn)) internal_set(signal, signal.v);
}
// node_modules/svelte/src/internal/client/runtime.js
/** @import { Derived, Effect, Reaction, Source, Value } from '#client' */
var is_destroying_effect = false;
/** @param {boolean} value */
function set_is_destroying_effect(value) {
	is_destroying_effect = value;
}
/** @type {null | Reaction} */
var active_reaction = null;
var untracking = false;
/** @param {null | Reaction} reaction */
function set_active_reaction(reaction) {
	active_reaction = reaction;
}
/** @type {null | Effect} */
var active_effect = null;
/** @param {null | Effect} effect */
function set_active_effect(effect) {
	active_effect = effect;
}
/**
* When sources are created within a reaction, reading and writing
* them within that reaction should not cause a re-run
* @type {null | Set<Value>}
*/
var current_sources = null;
/** @param {Value} value */
function push_reaction_value(value) {
	if (active_reaction !== null && (!async_mode_flag && (active_reaction.f & 2097152) !== 0 || (active_reaction.f & 2) !== 0)) (current_sources ??= /* @__PURE__ */ new Set()).add(value);
}
/**
* The dependencies of the reaction that is currently being executed. In many cases,
* the dependencies are unchanged between runs, and so this will be `null` unless
* and until a new dependency is accessed — we track this via `skipped_deps`
* @type {null | Value[]}
*/
var new_deps = null;
var skipped_deps = 0;
/**
* Tracks writes that the effect it's executed in doesn't listen to yet,
* so that the dependency can be added to the effect later on if it then reads it
* @type {null | Value[]}
*/
var untracked_writes = null;
/** @param {null | Value[]} value */
function set_untracked_writes(value) {
	untracked_writes = value;
}
/**
* @type {number} Used by sources and deriveds for handling updates.
* Version starts from 1 so that unowned deriveds differentiate between a created effect and a run one for tracing
**/
var write_version = 1;
/** @type {number} Used to version each read of a source of derived to avoid duplicating dependencies inside a reaction */
var read_version = 0;
var update_version = read_version;
/** @param {number} value */
function set_update_version(value) {
	update_version = value;
}
function increment_write_version() {
	return ++write_version;
}
/**
* Determines whether a derived or effect is dirty.
* If it is MAYBE_DIRTY, will set the status to CLEAN
* @param {Reaction} reaction
* @returns {boolean}
*/
function is_dirty(reaction) {
	var flags = reaction.f;
	if ((flags & 2048) !== 0) return true;
	if ((flags & 4096) !== 0) {
		var dependencies = reaction.deps;
		var length = dependencies.length;
		for (var i = 0; i < length; i++) {
			var dependency = dependencies[i];
			if (is_dirty(dependency)) update_derived(dependency);
			if (dependency.wv > reaction.wv) return true;
		}
		if ((flags & 512) !== 0 && batch_values === null) set_signal_status(reaction, CLEAN);
	}
	return false;
}
/**
* @param {Value} signal
* @param {Effect} effect
* @param {boolean} [root]
*/
function schedule_possible_effect_self_invalidation(signal, effect, root = true) {
	var reactions = signal.reactions;
	if (reactions === null) return;
	if (!async_mode_flag && current_sources !== null && current_sources.has(signal)) return;
	for (var i = 0; i < reactions.length; i++) {
		var reaction = reactions[i];
		if ((reaction.f & 2) !== 0) schedule_possible_effect_self_invalidation(reaction, effect, false);
		else if (effect === reaction) {
			if (root) set_signal_status(reaction, DIRTY);
			else if ((reaction.f & 1024) !== 0) set_signal_status(reaction, MAYBE_DIRTY);
			schedule_effect(reaction);
		}
	}
}
/** @param {Reaction} reaction */
function update_reaction(reaction) {
	var previous_deps = new_deps;
	var previous_skipped_deps = skipped_deps;
	var previous_untracked_writes = untracked_writes;
	var previous_reaction = active_reaction;
	var previous_sources = current_sources;
	var previous_component_context = component_context;
	var previous_untracking = untracking;
	var previous_update_version = update_version;
	var flags = reaction.f;
	new_deps = null;
	skipped_deps = 0;
	untracked_writes = null;
	active_reaction = (flags & 96) === 0 ? reaction : null;
	current_sources = null;
	set_component_context(reaction.ctx);
	untracking = false;
	update_version = ++read_version;
	if (reaction.ac !== null) {
		without_reactive_context(() => {
			/** @type {AbortController} */ reaction.ac.abort(STALE_REACTION);
		});
		reaction.ac = null;
	}
	try {
		reaction.f |= REACTION_IS_UPDATING;
		var fn = reaction.fn;
		var result = fn();
		reaction.f |= REACTION_RAN;
		var deps = update_dependencies(reaction);
		if (is_runes() && untracked_writes !== null && !untracking && deps !== null && (reaction.f & 6146) === 0) for (var i = 0; i < untracked_writes.length; i++) schedule_possible_effect_self_invalidation(untracked_writes[i], reaction);
		if (previous_reaction !== null && previous_reaction !== reaction) {
			read_version++;
			if (previous_reaction.deps !== null) for (let i = 0; i < previous_skipped_deps; i += 1) previous_reaction.deps[i].rv = read_version;
			if (previous_deps !== null) for (const dep of previous_deps) dep.rv = read_version;
			if (untracked_writes !== null) {
				if (previous_untracked_writes === null) previous_untracked_writes = untracked_writes;
				else previous_untracked_writes.push(...untracked_writes);
			}
		}
		if ((reaction.f & 8388608) !== 0) reaction.f ^= ERROR_VALUE;
		return result;
	} catch (error) {
		update_dependencies(reaction);
		return handle_error(error);
	} finally {
		reaction.f ^= REACTION_IS_UPDATING;
		new_deps = previous_deps;
		skipped_deps = previous_skipped_deps;
		untracked_writes = previous_untracked_writes;
		active_reaction = previous_reaction;
		current_sources = previous_sources;
		set_component_context(previous_component_context);
		untracking = previous_untracking;
		update_version = previous_update_version;
	}
}
/**
* @param {Reaction} reaction
*/
function update_dependencies(reaction) {
	var deps = reaction.deps;
	var is_fork = current_batch?.is_fork;
	if (new_deps !== null) {
		var i;
		if (!is_fork) remove_reactions(reaction, skipped_deps);
		if (deps !== null && skipped_deps > 0) {
			deps.length = skipped_deps + new_deps.length;
			for (i = 0; i < new_deps.length; i++) deps[skipped_deps + i] = new_deps[i];
		} else reaction.deps = deps = new_deps;
		if (effect_tracking() && (reaction.f & 512) !== 0) for (i = skipped_deps; i < deps.length; i++) (deps[i].reactions ??= []).push(reaction);
	} else if (!is_fork && deps !== null && skipped_deps < deps.length) {
		remove_reactions(reaction, skipped_deps);
		deps.length = skipped_deps;
	}
	return deps;
}
/**
* @template V
* @param {Reaction} signal
* @param {Value<V>} dependency
* @returns {void}
*/
function remove_reaction(signal, dependency) {
	let reactions = dependency.reactions;
	if (reactions !== null) {
		var index = index_of.call(reactions, signal);
		if (index !== -1) {
			var new_length = reactions.length - 1;
			if (new_length === 0) reactions = dependency.reactions = null;
			else {
				reactions[index] = reactions[new_length];
				reactions.pop();
			}
		}
	}
	if (reactions === null && (dependency.f & 2) !== 0 && (new_deps === null || !includes.call(new_deps, dependency))) {
		var derived = dependency;
		if ((derived.f & 512) !== 0) derived.f ^= 512;
		if (derived.v !== UNINITIALIZED) update_derived_status(derived);
		if (derived.ac !== null) without_reactive_context(() => {
			/** @type {AbortController} */ derived.ac.abort(STALE_REACTION);
			derived.ac = null;
			set_signal_status(derived, DIRTY);
		});
		freeze_derived_effects(derived);
		remove_reactions(derived, 0);
	}
}
/**
* @param {Reaction} signal
* @param {number} start_index
* @returns {void}
*/
function remove_reactions(signal, start_index) {
	var dependencies = signal.deps;
	if (dependencies === null) return;
	for (var i = start_index; i < dependencies.length; i++) remove_reaction(signal, dependencies[i]);
}
/**
* @param {Effect} effect
* @returns {void}
*/
function update_effect(effect) {
	var flags = effect.f;
	if ((flags & 16384) !== 0) return;
	set_signal_status(effect, CLEAN);
	var previous_effect = active_effect;
	active_effect = effect;
	var previous_component_fn = dev_current_component_function;
	set_dev_current_component_function(effect.component_function);
	var previous_stack = dev_stack;
	set_dev_stack(effect.dev_stack ?? dev_stack);
	try {
		if ((flags & 16777232) !== 0) destroy_block_effect_children(effect);
		else destroy_effect_children(effect);
		execute_effect_teardown(effect);
		var teardown = update_reaction(effect);
		effect.teardown = typeof teardown === "function" ? teardown : null;
		effect.wv = write_version;
		if (tracing_mode_flag && (effect.f & 2048) !== 0 && effect.deps !== null) {
			for (var dep of effect.deps) if (dep.set_during_effect) {
				dep.wv = increment_write_version();
				dep.set_during_effect = false;
			}
		}
	} finally {
		active_effect = previous_effect;
		set_dev_current_component_function(previous_component_fn);
		set_dev_stack(previous_stack);
	}
}
/**
* Returns a promise that resolves once any pending state changes have been applied.
* @returns {Promise<void>}
*/
async function tick() {
	if (async_mode_flag) return new Promise((f) => {
		requestAnimationFrame(() => f());
		setTimeout(() => f());
	});
	await Promise.resolve();
	flushSync();
}
/**
* Returns a promise that resolves once any state changes, and asynchronous work resulting from them,
* have resolved and the DOM has been updated
* @returns {Promise<void>}
* @since 5.36
*/
function settled() {
	return Batch.ensure().settled();
}
/**
* @template V
* @param {Value<V>} signal
* @returns {V}
*/
function get(signal) {
	var is_derived = (signal.f & 2) !== 0;
	captured_signals?.add(signal);
	if (active_reaction !== null && !untracking) {
		if (!(active_effect !== null && (active_effect.f & 16384) !== 0) && (current_sources === null || !current_sources.has(signal))) {
			var deps = active_reaction.deps;
			if ((active_reaction.f & 2097152) !== 0) {
				if (signal.rv < read_version) {
					signal.rv = read_version;
					if (new_deps === null && deps !== null && deps[skipped_deps] === signal) skipped_deps++;
					else if (new_deps === null) new_deps = [signal];
					else new_deps.push(signal);
				}
			} else {
				active_reaction.deps ??= [];
				if (!includes.call(active_reaction.deps, signal)) active_reaction.deps.push(signal);
				var reactions = signal.reactions;
				if (reactions === null) signal.reactions = [active_reaction];
				else if (!includes.call(reactions, active_reaction)) reactions.push(active_reaction);
			}
		}
	}
	if (!untracking && reactivity_loss_tracker && current_batch === null && previous_batch === null && !reactivity_loss_tracker.warned && (reactivity_loss_tracker.effect.f & 2097152) === 0 && !reactivity_loss_tracker.effect_deps.has(signal)) {
		reactivity_loss_tracker.warned = true;
		await_reactivity_loss(signal.label);
		var trace = get_error("traced at");
		if (trace) console.warn(trace);
	}
	recent_async_deriveds.delete(signal);
	if (tracing_mode_flag && !untracking && tracing_expressions !== null && active_reaction !== null && tracing_expressions.reaction === active_reaction) {
		if (signal.trace) signal.trace();
		else {
			trace = get_error("traced at");
			if (trace) {
				var entry = tracing_expressions.entries.get(signal);
				if (entry === void 0) {
					entry = { traces: [] };
					tracing_expressions.entries.set(signal, entry);
				}
				var last = entry.traces[entry.traces.length - 1];
				if (trace.stack !== last?.stack) entry.traces.push(trace);
			}
		}
	}
	if (is_destroying_effect && old_values.has(signal)) return old_values.get(signal);
	if (is_derived) {
		var derived = signal;
		if (is_destroying_effect) {
			var value = derived.v;
			if ((derived.f & 1024) === 0 && derived.reactions !== null || depends_on_old_values(derived)) value = execute_derived(derived);
			old_values.set(derived, value);
			return value;
		}
		var should_connect = (derived.f & 512) === 0 && !untracking && active_reaction !== null && (active_reaction.f & 512) !== 0;
		var is_new = (derived.f & REACTION_RAN) === 0;
		if (is_dirty(derived)) {
			if (should_connect) derived.f |= 512;
			update_derived(derived);
		}
		if (should_connect && !is_new) {
			unfreeze_derived_effects(derived);
			reconnect(derived);
		}
	}
	if (batch_values?.has(signal)) return batch_values.get(signal);
	if ((signal.f & 8388608) !== 0) throw signal.v;
	return signal.v;
}
/**
* (Re)connect a disconnected derived, so that it is notified
* of changes in `mark_reactions`
* @param {Derived} derived
*/
function reconnect(derived) {
	derived.f |= 512;
	if (derived.deps === null) return;
	for (const dep of derived.deps) {
		var reactions = dep.reactions;
		if (reactions === null) dep.reactions = [derived];
		else if (!includes.call(reactions, derived)) reactions.push(derived);
		if ((dep.f & 2) !== 0 && (dep.f & 512) === 0) {
			unfreeze_derived_effects(dep);
			reconnect(dep);
		}
	}
}
/** @param {Derived} derived */
function depends_on_old_values(derived) {
	if (derived.v === UNINITIALIZED) return true;
	if (derived.deps === null) return false;
	for (const dep of derived.deps) {
		if (old_values.has(dep)) return true;
		if ((dep.f & 2) !== 0 && depends_on_old_values(dep)) return true;
	}
	return false;
}
/**
* Like `get`, but checks for `undefined`. Used for `var` declarations because they can be accessed before being declared
* @template V
* @param {Value<V> | undefined} signal
* @returns {V | undefined}
*/
function safe_get(signal) {
	return signal && get(signal);
}
/**
* When used inside a [`$derived`](https://svelte.dev/docs/svelte/$derived) or [`$effect`](https://svelte.dev/docs/svelte/$effect),
* any state read inside `fn` will not be treated as a dependency.
*
* ```ts
* $effect(() => {
*   // this will run when `data` changes, but not when `time` changes
*   save(data, {
*     timestamp: untrack(() => time)
*   });
* });
* ```
* @template T
* @param {() => T} fn
* @returns {T}
*/
function untrack(fn) {
	var previous_untracking = untracking;
	try {
		untracking = true;
		return fn();
	} finally {
		untracking = previous_untracking;
	}
}
/**
* Possibly traverse an object and read all its properties so that they're all reactive in case this is `$state`.
* Does only check first level of an object for performance reasons (heuristic should be good for 99% of all cases).
* @param {any} value
* @returns {void}
*/
function deep_read_state(value) {
	if (typeof value !== "object" || !value || value instanceof EventTarget) return;
	if (STATE_SYMBOL in value) deep_read(value);
	else if (!Array.isArray(value)) for (let key in value) {
		const prop = value[key];
		if (typeof prop === "object" && prop && STATE_SYMBOL in prop) deep_read(prop);
	}
}
/**
* Deeply traverse an object and read all its properties
* so that they're all reactive in case this is `$state`
* @param {any} value
* @param {Set<any>} visited
* @returns {void}
*/
function deep_read(value, visited = /* @__PURE__ */ new Set()) {
	if (typeof value === "object" && value !== null && !(value instanceof EventTarget) && !visited.has(value)) {
		visited.add(value);
		if (value instanceof Date) value.getTime();
		for (let key in value) try {
			deep_read(value[key], visited);
		} catch (e) {}
		const proto = get_prototype_of(value);
		if (proto !== Object.prototype && proto !== Array.prototype && proto !== Map.prototype && proto !== Set.prototype && proto !== Date.prototype) {
			const descriptors = get_descriptors(proto);
			for (let key in descriptors) {
				const get = descriptors[key].get;
				if (get) try {
					get.call(value);
				} catch (e) {}
			}
		}
	}
}
export { only_child as $, NAMESPACE_SVG as $n, hasContext as $t, remove_effect_dom as A, invalid_default_snippet as An, is_array as Ar, run as At, $window as B, hydrating as Bn, add_form_reset_listener as Bt, effect_root as C, invalid_snippet as Cn, define_property as Cr, async_derived as Ct, managed as D, rune_outside_svelte as Dn, get_descriptors as Dr, capture as Dt, legacy_pre_effect_reset as E, props_rest_readonly as En, get_descriptor as Er, user_derived as Et, user_effect as F, svelte_element_invalid_this_value as Fn, run$1 as Fr, unset_context as Ft, create_fragment as G, set_hydrating as Gn, queue_micro_task as Gt, clear_text_content as H, read_hydration_instruction as Hn, remove_textarea_child as Ht, user_pre_effect as I, safe_not_equal as In, run_all as Ir, wait as It, get_first_child as J, FILENAME as Jn, createContext as Jt, create_text as K, skip_nodes as Kn, add_svelte_meta as Kt, validate_effect as L, hydrate_next as Ln, to_array as Lr, listen as Lt, resume_effect as M, lifecycle_outside_component as Mn, is_promise as Mr, save as Mt, teardown as N, snippet_without_render_tag as Nn, noop as Nr, track_reactivity_loss as Nt, move_effect as O, svelte_boundary_reset_onerror as On, get_prototype_of as Or, flatten as Ot, template_effect as P, store_invalid_shape as Pn, object_keys as Pr, unsave as Pt, merge_text_nodes as Q, NAMESPACE_MATHML as Qn, getContext as Qt, invoke_error_boundary as R, hydrate_node as Rn, listen_to_event_and_reset_event as Rt, effect as S, hydration_failed as Sn, deferred as Sr, previous_batch as St, legacy_pre_effect as T, props_invalid_value as Tn, fallback as Tr, derived_safe_equal as Tt, create_comment as U, reset as Un, defer_effect as Ut, child as V, next as Vn, autofocus as Vt, create_element as W, set_hydrate_node as Wn, set_signal_status as Wt, init_operations as X, HYDRATION_ERROR as Xn, dev_stack as Xt, get_next_sibling as Y, HMR as Yn, dev_current_component_function as Yt, is_firefox as Z, NAMESPACE_HTML as Zn, getAllContexts as Zt, branch as _, each_key_duplicate as _n, REACTION_RAN as _r, current_batch as _t, get as a, set_component_context as an, DIRTY as ar, is as at, destroy_effect as b, get_abort_signal_outside_reaction as bn, TEXT_CACHE as br, fork as bt, set_active_effect as c, label as cn, EFFECT_TRANSPARENT as cr, internal_set as ct, tick as d, trace as dn, HMR_ANCHOR as dr, set as dt, is_runes as en, UNINITIALIZED as er, set_attribute as et, untrack as f, snapshot as fn, INERT as fr, source as ft, block as g, component_api_invalid_new as gn, MAYBE_DIRTY as gr, Batch as gt, aborted as h, component_api_changed as hn, LOADING_ATTR_SYMBOL as hr, update_pre as ht, deep_read_state as i, setContext as in, DESTROYING as ir, strict_equals as it, render_effect as j, invalid_snippet_arguments as jn, is_function as jr, run_after_blockers as jt, pause_effect as k, experimental_async_required as kn, has_own_property as kr, for_await_track_reactivity_loss as kt, set_active_reaction as l, tag as ln, FORM_RESET_HANDLER as lr, mutable_source as lt, invalidate_inner_signals as m, bind_invalid_checkbox_value as mn, LEGACY_PROPS as mr, update as mt, active_reaction as n, pop as nn, CLASS_CACHE as nr, sibling as nt, is_destroying_effect as o, set_dev_current_component_function as on, EFFECT_OFFSCREEN as or, proxy as ot, update_version as p, dynamic_void_element_content as pn, IS_XHTML as pr, state as pt, first_child as q, ATTACHMENT_KEY as qn, component_context as qt, deep_read as r, push as rn, DESTROYED as rr, equals as rt, safe_get as s, get_error as sn, EFFECT_PRESERVED as sr, increment as st, active_effect as t, mark_as_component as tn, ATTRIBUTES_CACHE as tr, should_defer_append as tt, settled as u, tag_proxy as un, HEAD_EFFECT as ur, mutate as ut, component_root as v, each_key_volatile as vn, STATE_SYMBOL as vr, eager as vt, effect_tracking as w, lifecycle_legacy_only as wn, exclude_from_object as wr, derived as wt, eager_effect as x, hydratable_missing_but_required as xn, array_from as xr, is_flushing_sync as xt, deferred_template_effect as y, effect_pending_outside_reaction as yn, STYLE_CACHE as yr, flushSync as yt, $document as z, hydrate_template as zn, without_reactive_context as zt };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVudGltZS1CT0ZYSTQ2ZS5qcyIsIm5hbWVzIjpbInJ1biIsImVxdWFscyJdLCJzb3VyY2VzIjpbIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvc2hhcmVkL3V0aWxzLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvY29uc3RhbnRzLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9jb25zdGFudHMuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vaHlkcmF0aW9uLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvcmVhY3Rpdml0eS9lcXVhbGl0eS5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvc2hhcmVkL2Vycm9ycy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2Vycm9ycy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvc2hhcmVkL3dhcm5pbmdzLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9zaGFyZWQvY2xvbmUuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kZXYvdHJhY2luZy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvc2hhcmVkL2Rldi5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvc2hhcmVkL2NvbnRleHQuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9jb250ZXh0LmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL3Rhc2suanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9yZWFjdGl2aXR5L3N0YXR1cy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L3JlYWN0aXZpdHkvdXRpbHMuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kZXYvZGVidWcuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vZWxlbWVudHMvbWlzYy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9lbGVtZW50cy9iaW5kaW5ncy9zaGFyZWQuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9yZWFjdGl2aXR5L2FzeW5jLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvcmVhY3Rpdml0eS9kZXJpdmVkcy5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L3JlYWN0aXZpdHkvYmF0Y2guanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9yZWFjdGl2aXR5L3NvdXJjZXMuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9wcm94eS5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2Rldi9lcXVhbGl0eS5qcyIsIi4uLy4uL3N2ZWx0ZS9zcmMvaW50ZXJuYWwvY2xpZW50L2RvbS9vcGVyYXRpb25zLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZXJyb3ItaGFuZGxpbmcuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9yZWFjdGl2aXR5L2VmZmVjdHMuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9sZWdhY3kuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9ydW50aW1lLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFN0b3JlIHRoZSByZWZlcmVuY2VzIHRvIGdsb2JhbHMgaW4gY2FzZSBzb21lb25lIHRyaWVzIHRvIG1vbmtleSBwYXRjaCB0aGVzZSwgY2F1c2luZyB0aGUgYmVsb3dcbi8vIHRvIGRlLW9wdCAodGhpcyBvY2N1cnMgb2Z0ZW4gd2hlbiB1c2luZyBwb3B1bGFyIGV4dGVuc2lvbnMpLlxuZXhwb3J0IHZhciBpc19hcnJheSA9IEFycmF5LmlzQXJyYXk7XG5leHBvcnQgdmFyIGluZGV4X29mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2Y7XG5leHBvcnQgdmFyIGluY2x1ZGVzID0gQXJyYXkucHJvdG90eXBlLmluY2x1ZGVzO1xuZXhwb3J0IHZhciBhcnJheV9mcm9tID0gQXJyYXkuZnJvbTtcbmV4cG9ydCB2YXIgb2JqZWN0X2tleXMgPSBPYmplY3Qua2V5cztcbmV4cG9ydCB2YXIgZGVmaW5lX3Byb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xuZXhwb3J0IHZhciBnZXRfZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG5leHBvcnQgdmFyIGdldF9kZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzO1xuZXhwb3J0IHZhciBvYmplY3RfcHJvdG90eXBlID0gT2JqZWN0LnByb3RvdHlwZTtcbmV4cG9ydCB2YXIgYXJyYXlfcHJvdG90eXBlID0gQXJyYXkucHJvdG90eXBlO1xuZXhwb3J0IHZhciBnZXRfcHJvdG90eXBlX29mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mO1xuZXhwb3J0IHZhciBpc19leHRlbnNpYmxlID0gT2JqZWN0LmlzRXh0ZW5zaWJsZTtcbmV4cG9ydCB2YXIgaGFzX293bl9wcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IHRoaW5nXG4gKiBAcmV0dXJucyB7dGhpbmcgaXMgRnVuY3Rpb259XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc19mdW5jdGlvbih0aGluZykge1xuXHRyZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nO1xufVxuXG5leHBvcnQgY29uc3Qgbm9vcCA9ICgpID0+IHt9O1xuXG4vLyBBZGFwdGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL3RoZW4vaXMtcHJvbWlzZS9ibG9iL21hc3Rlci9pbmRleC5qc1xuLy8gRGlzdHJpYnV0ZWQgdW5kZXIgTUlUIExpY2Vuc2UgaHR0cHM6Ly9naXRodWIuY29tL3RoZW4vaXMtcHJvbWlzZS9ibG9iL21hc3Rlci9MSUNFTlNFXG5cbi8qKlxuICogQHRlbXBsYXRlIFtUPWFueV1cbiAqIEBwYXJhbSB7YW55fSB2YWx1ZVxuICogQHJldHVybnMge3ZhbHVlIGlzIFByb21pc2VMaWtlPFQ+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNfcHJvbWlzZSh2YWx1ZSkge1xuXHRyZXR1cm4gdHlwZW9mIHZhbHVlPy50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuXG4vKiogQHBhcmFtIHtGdW5jdGlvbn0gZm4gKi9cbmV4cG9ydCBmdW5jdGlvbiBydW4oZm4pIHtcblx0cmV0dXJuIGZuKCk7XG59XG5cbi8qKiBAcGFyYW0ge0FycmF5PCgpID0+IHZvaWQ+fSBhcnIgKi9cbmV4cG9ydCBmdW5jdGlvbiBydW5fYWxsKGFycikge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHRcdGFycltpXSgpO1xuXHR9XG59XG5cbi8qKlxuICogVE9ETyByZXBsYWNlIHdpdGggUHJvbWlzZS53aXRoUmVzb2x2ZXJzIG9uY2Ugc3VwcG9ydGVkIHdpZGVseSBlbm91Z2hcbiAqIEB0ZW1wbGF0ZSBbVD12b2lkXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVmZXJyZWQoKSB7XG5cdC8qKiBAdHlwZSB7KHZhbHVlOiBUKSA9PiB2b2lkfSAqL1xuXHR2YXIgcmVzb2x2ZTtcblxuXHQvKiogQHR5cGUgeyhyZWFzb246IGFueSkgPT4gdm9pZH0gKi9cblx0dmFyIHJlamVjdDtcblxuXHQvKiogQHR5cGUge1Byb21pc2U8VD59ICovXG5cdHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG5cdFx0cmVzb2x2ZSA9IHJlcztcblx0XHRyZWplY3QgPSByZWo7XG5cdH0pO1xuXG5cdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0cmV0dXJuIHsgcHJvbWlzZSwgcmVzb2x2ZSwgcmVqZWN0IH07XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIFZcbiAqIEBwYXJhbSB7Vn0gdmFsdWVcbiAqIEBwYXJhbSB7ViB8ICgoKSA9PiBWKX0gZmFsbGJhY2tcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2xhenldXG4gKiBAcmV0dXJucyB7Vn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZhbGxiYWNrKHZhbHVlLCBmYWxsYmFjaywgbGF6eSA9IGZhbHNlKSB7XG5cdHJldHVybiB2YWx1ZSA9PT0gdW5kZWZpbmVkXG5cdFx0PyBsYXp5XG5cdFx0XHQ/IC8qKiBAdHlwZSB7KCkgPT4gVn0gKi8gKGZhbGxiYWNrKSgpXG5cdFx0XHQ6IC8qKiBAdHlwZSB7Vn0gKi8gKGZhbGxiYWNrKVxuXHRcdDogdmFsdWU7XG59XG5cbi8qKlxuICogV2hlbiBlbmNvdW50ZXJpbmcgYSBzaXR1YXRpb24gbGlrZSBgbGV0IFthLCBiLCBjXSA9ICRkZXJpdmVkKGJsYWgoKSlgLFxuICogd2UgbmVlZCB0byBzdGFzaCBhbiBpbnRlcm1lZGlhdGUgdmFsdWUgdGhhdCBgYWAsIGBiYCwgYW5kIGBjYCBkZXJpdmVcbiAqIGZyb20sIGluIGNhc2UgaXQncyBhbiBpdGVyYWJsZVxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7QXJyYXlMaWtlPFQ+IHwgSXRlcmFibGU8VD59IHZhbHVlXG4gKiBAcGFyYW0ge251bWJlcn0gW25dXG4gKiBAcmV0dXJucyB7QXJyYXk8VD59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b19hcnJheSh2YWx1ZSwgbikge1xuXHQvLyByZXR1cm4gYXJyYXlzIHVuY2hhbmdlZFxuXHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRyZXR1cm4gdmFsdWU7XG5cdH1cblxuXHQvLyBpZiB2YWx1ZSBpcyBub3QgaXRlcmFibGUsIG9yIGBuYCBpcyB1bnNwZWNpZmllZCAoaW5kaWNhdGVzIGEgcmVzdFxuXHQvLyBlbGVtZW50LCB3aGljaCBtZWFucyB3ZSdyZSBub3QgY29uY2VybmVkIGFib3V0IHVuYm91bmRlZCBpdGVyYWJsZXMpXG5cdC8vIGNvbnZlcnQgdG8gYW4gYXJyYXkgd2l0aCBgQXJyYXkuZnJvbWBcblx0aWYgKG4gPT09IHVuZGVmaW5lZCB8fCAhKFN5bWJvbC5pdGVyYXRvciBpbiB2YWx1ZSkpIHtcblx0XHRyZXR1cm4gQXJyYXkuZnJvbSh2YWx1ZSk7XG5cdH1cblxuXHQvLyBvdGhlcndpc2UsIHBvcHVsYXRlIGFuIGFycmF5IHdpdGggYG5gIHZhbHVlc1xuXG5cdC8qKiBAdHlwZSB7VFtdfSAqL1xuXHRjb25zdCBhcnJheSA9IFtdO1xuXG5cdGZvciAoY29uc3QgZWxlbWVudCBvZiB2YWx1ZSkge1xuXHRcdGFycmF5LnB1c2goZWxlbWVudCk7XG5cdFx0aWYgKGFycmF5Lmxlbmd0aCA9PT0gbikgYnJlYWs7XG5cdH1cblxuXHRyZXR1cm4gYXJyYXk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nIHwgc3ltYm9sLCB1bmtub3duPn0gb2JqXG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZyB8IHN5bWJvbD59IGtleXNcbiAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nIHwgc3ltYm9sLCB1bmtub3duPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4Y2x1ZGVfZnJvbV9vYmplY3Qob2JqLCBrZXlzKSB7XG5cdC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZyB8IHN5bWJvbCwgdW5rbm93bj59ICovXG5cdHZhciByZXN1bHQgPSB7fTtcblxuXHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG5cdFx0aWYgKCFrZXlzLmluY2x1ZGVzKGtleSkpIHtcblx0XHRcdHJlc3VsdFtrZXldID0gb2JqW2tleV07XG5cdFx0fVxuXHR9XG5cblx0Zm9yICh2YXIgc3ltYm9sIG9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqKSkge1xuXHRcdGlmIChPYmplY3QucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChvYmosIHN5bWJvbCkgJiYgIWtleXMuaW5jbHVkZXMoc3ltYm9sKSkge1xuXHRcdFx0cmVzdWx0W3N5bWJvbF0gPSBvYmpbc3ltYm9sXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuIiwiLy8gR2VuZXJhbCBmbGFnc1xuZXhwb3J0IGNvbnN0IERFUklWRUQgPSAxIDw8IDE7XG5leHBvcnQgY29uc3QgRUZGRUNUID0gMSA8PCAyO1xuZXhwb3J0IGNvbnN0IFJFTkRFUl9FRkZFQ1QgPSAxIDw8IDM7XG4vKipcbiAqIEFuIGVmZmVjdCB0aGF0IGRvZXMgbm90IGRlc3Ryb3kgaXRzIGNoaWxkIGVmZmVjdHMgd2hlbiBpdCByZXJ1bnMuXG4gKiBSdW5zIGFzIHBhcnQgb2YgcmVuZGVyIGVmZmVjdHMsIGkuZS4gbm90IGVhZ2VybHkgYXMgcGFydCBvZiB0cmVlIHRyYXZlcnNhbCBvciBlZmZlY3QgZmx1c2hpbmcuXG4gKi9cbmV4cG9ydCBjb25zdCBNQU5BR0VEX0VGRkVDVCA9IDEgPDwgMjQ7XG4vKipcbiAqIEFuIGVmZmVjdCB0aGF0IGRvZXMgbm90IGRlc3Ryb3kgaXRzIGNoaWxkIGVmZmVjdHMgd2hlbiBpdCByZXJ1bnMgKGxpa2UgTUFOQUdFRF9FRkZFQ1QpLlxuICogUnVucyBlYWdlcmx5IGFzIHBhcnQgb2YgdHJlZSB0cmF2ZXJzYWwgb3IgZWZmZWN0IGZsdXNoaW5nLlxuICovXG5leHBvcnQgY29uc3QgQkxPQ0tfRUZGRUNUID0gMSA8PCA0O1xuZXhwb3J0IGNvbnN0IEJSQU5DSF9FRkZFQ1QgPSAxIDw8IDU7XG5leHBvcnQgY29uc3QgUk9PVF9FRkZFQ1QgPSAxIDw8IDY7XG5leHBvcnQgY29uc3QgQk9VTkRBUllfRUZGRUNUID0gMSA8PCA3O1xuLyoqXG4gKiBTZXQgb24gdGhlIGVmZmVjdCB0aGF0IGBwYXVzZV9lZmZlY3RgIHdhcyBjYWxsZWQgb24sIGkuZS4gdGhlIHJvb3Qgb2YgYSBwYXVzZWQgc3VidHJlZSxcbiAqIGFzIG9wcG9zZWQgdG8gaXRzIGRlc2NlbmRhbnRzIHdoaWNoIGFyZSBtZXJlbHkgYElORVJUYC4gVGhpcyBhbGxvd3MgYHJlc3VtZV9lZmZlY3RgIG9uXG4gKiBhbiBhbmNlc3RvciB0byBza2lwIHN1YnRyZWVzIHRoYXQgd2VyZSBwYXVzZWQgZm9yIHRoZWlyIG93biByZWFzb25zIChzdWNoIGFzIGEgYmxvY2tcbiAqIHdob3NlIGNvbmRpdGlvbiBpcyBzdGlsbCBmYWxzZSkgcmF0aGVyIHRoYW4gcmVzdXJyZWN0aW5nIHRoZW1cbiAqL1xuZXhwb3J0IGNvbnN0IFBBVVNFRCA9IDEgPDwgODtcbi8qKlxuICogSW5kaWNhdGVzIHRoYXQgYSByZWFjdGlvbiBpcyBjb25uZWN0ZWQgdG8gYW4gZWZmZWN0IHJvb3Qg4oCUIGVpdGhlciBpdCBpcyBhbiBlZmZlY3QsXG4gKiBvciBpdCBpcyBhIGRlcml2ZWQgdGhhdCBpcyBkZXBlbmRlZCBvbiBieSBhdCBsZWFzdCBvbmUgZWZmZWN0LiBJZiBhIGRlcml2ZWQgaGFzXG4gKiBubyBkZXBlbmRlbnRzLCB3ZSBjYW4gZGlzY29ubmVjdCBpdCBmcm9tIHRoZSBncmFwaCwgYWxsb3dpbmcgaXQgdG8gZWl0aGVyIGJlXG4gKiBHQydkIG9yIHJlY29ubmVjdGVkIGxhdGVyIGlmIGFuIGVmZmVjdCBjb21lcyB0byBkZXBlbmQgb24gaXQgYWdhaW5cbiAqL1xuZXhwb3J0IGNvbnN0IENPTk5FQ1RFRCA9IDEgPDwgOTtcbmV4cG9ydCBjb25zdCBDTEVBTiA9IDEgPDwgMTA7XG5leHBvcnQgY29uc3QgRElSVFkgPSAxIDw8IDExO1xuZXhwb3J0IGNvbnN0IE1BWUJFX0RJUlRZID0gMSA8PCAxMjtcbmV4cG9ydCBjb25zdCBJTkVSVCA9IDEgPDwgMTM7XG5leHBvcnQgY29uc3QgREVTVFJPWUVEID0gMSA8PCAxNDtcbi8qKiBTZXQgb25jZSBhIHJlYWN0aW9uIGhhcyBydW4gZm9yIHRoZSBmaXJzdCB0aW1lICovXG5leHBvcnQgY29uc3QgUkVBQ1RJT05fUkFOID0gMSA8PCAxNTtcbi8qKiBFZmZlY3QgaXMgaW4gdGhlIHByb2Nlc3Mgb2YgZ2V0dGluZyBkZXN0cm95ZWQuIENhbiBiZSBvYnNlcnZlZCBpbiBjaGlsZCB0ZWFyZG93biBmdW5jdGlvbnMgKi9cbmV4cG9ydCBjb25zdCBERVNUUk9ZSU5HID0gMSA8PCAyNTtcblxuLy8gRmxhZ3MgZXhjbHVzaXZlIHRvIGVmZmVjdHNcbi8qKlxuICogJ1RyYW5zcGFyZW50JyBlZmZlY3RzIGRvIG5vdCBjcmVhdGUgYSB0cmFuc2l0aW9uIGJvdW5kYXJ5LlxuICogVGhpcyBpcyBvbiBhIGJsb2NrIGVmZmVjdCA5OSUgb2YgdGhlIHRpbWUgYnV0IG1heSBhbHNvIGJlIG9uIGEgYnJhbmNoIGVmZmVjdCBpZiBpdHMgcGFyZW50IGJsb2NrIGVmZmVjdCB3YXMgcHJ1bmVkXG4gKi9cbmV4cG9ydCBjb25zdCBFRkZFQ1RfVFJBTlNQQVJFTlQgPSAxIDw8IDE2O1xuZXhwb3J0IGNvbnN0IEVBR0VSX0VGRkVDVCA9IDEgPDwgMTc7XG5leHBvcnQgY29uc3QgSEVBRF9FRkZFQ1QgPSAxIDw8IDE4O1xuZXhwb3J0IGNvbnN0IEVGRkVDVF9QUkVTRVJWRUQgPSAxIDw8IDE5O1xuZXhwb3J0IGNvbnN0IFVTRVJfRUZGRUNUID0gMSA8PCAyMDtcbmV4cG9ydCBjb25zdCBFRkZFQ1RfT0ZGU0NSRUVOID0gMSA8PCAyNTtcblxuLy8gRmxhZ3MgdXNlZCBmb3IgYXN5bmNcbmV4cG9ydCBjb25zdCBSRUFDVElPTl9JU19VUERBVElORyA9IDEgPDwgMjE7XG5leHBvcnQgY29uc3QgQVNZTkMgPSAxIDw8IDIyO1xuXG5leHBvcnQgY29uc3QgRVJST1JfVkFMVUUgPSAxIDw8IDIzO1xuXG5leHBvcnQgY29uc3QgU1RBVEVfU1lNQk9MID0gU3ltYm9sKCckc3RhdGUnKTtcbi8qKiBNYXJrcyBjb21wb25lbnQgZXhwb3J0IG9iamVjdHMsIHNvIHRoYXQgYHByb3h5KC4uLilgIGxlYXZlcyB0aGVtIHVudG91Y2hlZCAqL1xuZXhwb3J0IGNvbnN0IENPTVBPTkVOVF9TWU1CT0wgPSBTeW1ib2woJ2NvbXBvbmVudCcpO1xuZXhwb3J0IGNvbnN0IExFR0FDWV9QUk9QUyA9IFN5bWJvbCgnbGVnYWN5IHByb3BzJyk7XG5leHBvcnQgY29uc3QgTE9BRElOR19BVFRSX1NZTUJPTCA9IFN5bWJvbCgnJyk7XG5leHBvcnQgY29uc3QgUFJPWFlfUEFUSF9TWU1CT0wgPSBTeW1ib2woJ3Byb3h5IHBhdGgnKTtcbmV4cG9ydCBjb25zdCBBVFRSSUJVVEVTX0NBQ0hFID0gU3ltYm9sKCdhdHRyaWJ1dGVzJyk7XG5leHBvcnQgY29uc3QgQ0xBU1NfQ0FDSEUgPSBTeW1ib2woJ2NsYXNzJyk7XG5leHBvcnQgY29uc3QgU1RZTEVfQ0FDSEUgPSBTeW1ib2woJ3N0eWxlJyk7XG5leHBvcnQgY29uc3QgVEVYVF9DQUNIRSA9IFN5bWJvbCgndGV4dCcpO1xuZXhwb3J0IGNvbnN0IEZPUk1fUkVTRVRfSEFORExFUiA9IFN5bWJvbCgnZm9ybSByZXNldCcpO1xuLyoqIEFuIGFuY2hvciBtaWdodCBjaGFuZ2UsIHZpYSB0aGlzIHN5bWJvbCBvbiB0aGUgb3JpZ2luYWwgYW5jaG9yIHdlIGNhbiB0ZWxsIEhNUiBhYm91dCB0aGUgdXBkYXRlZCBhbmNob3IgKi9cbmV4cG9ydCBjb25zdCBITVJfQU5DSE9SID0gU3ltYm9sKCdobXIgYW5jaG9yJyk7XG5cbi8qKiBhbGxvdyB1c2VycyB0byBpZ25vcmUgYWJvcnRlZCBzaWduYWwgZXJyb3JzIGlmIGByZWFzb24ubmFtZSA9PT0gJ1N0YWxlUmVhY3Rpb25FcnJvcmAgKi9cbmV4cG9ydCBjb25zdCBTVEFMRV9SRUFDVElPTiA9IG5ldyAoY2xhc3MgU3RhbGVSZWFjdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuXHRuYW1lID0gJ1N0YWxlUmVhY3Rpb25FcnJvcic7XG5cdG1lc3NhZ2UgPSAnVGhlIHJlYWN0aW9uIHRoYXQgY2FsbGVkIGBnZXRBYm9ydFNpZ25hbCgpYCB3YXMgcmUtcnVuIG9yIGRlc3Ryb3llZCc7XG59KSgpO1xuXG5leHBvcnQgY29uc3QgSVNfWEhUTUwgPVxuXHQvLyBXZSBnb3R0YSB3cml0ZSBpdCBsaWtlIHRoaXMgYmVjYXVzZSBhZnRlciBkb3dubGV2ZWxpbmcgdGhlIHB1cmUgY29tbWVudCBtYXkgZW5kIHVwIGluIHRoZSB3cm9uZyBsb2NhdGlvblxuXHQhIWdsb2JhbFRoaXMuZG9jdW1lbnQ/LmNvbnRlbnRUeXBlICYmXG5cdC8qIEBfX1BVUkVfXyAqLyBnbG9iYWxUaGlzLmRvY3VtZW50LmNvbnRlbnRUeXBlLmluY2x1ZGVzKCd4bWwnKTtcbmV4cG9ydCBjb25zdCBFTEVNRU5UX05PREUgPSAxO1xuZXhwb3J0IGNvbnN0IFRFWFRfTk9ERSA9IDM7XG5leHBvcnQgY29uc3QgQ09NTUVOVF9OT0RFID0gODtcbmV4cG9ydCBjb25zdCBET0NVTUVOVF9GUkFHTUVOVF9OT0RFID0gMTE7XG4iLCJleHBvcnQgY29uc3QgRUFDSF9JVEVNX1JFQUNUSVZFID0gMTtcbmV4cG9ydCBjb25zdCBFQUNIX0lOREVYX1JFQUNUSVZFID0gMSA8PCAxO1xuLyoqIFNlZSBFYWNoQmxvY2sgaW50ZXJmYWNlIG1ldGFkYXRhLmlzX2NvbnRyb2xsZWQgZm9yIGFuIGV4cGxhbmF0aW9uIHdoYXQgdGhpcyBpcyAqL1xuZXhwb3J0IGNvbnN0IEVBQ0hfSVNfQ09OVFJPTExFRCA9IDEgPDwgMjtcbmV4cG9ydCBjb25zdCBFQUNIX0lTX0FOSU1BVEVEID0gMSA8PCAzO1xuZXhwb3J0IGNvbnN0IEVBQ0hfSVRFTV9JTU1VVEFCTEUgPSAxIDw8IDQ7XG5cbmV4cG9ydCBjb25zdCBQUk9QU19JU19JTU1VVEFCTEUgPSAxO1xuZXhwb3J0IGNvbnN0IFBST1BTX0lTX1JVTkVTID0gMSA8PCAxO1xuZXhwb3J0IGNvbnN0IFBST1BTX0lTX1VQREFURUQgPSAxIDw8IDI7XG5leHBvcnQgY29uc3QgUFJPUFNfSVNfQklOREFCTEUgPSAxIDw8IDM7XG5leHBvcnQgY29uc3QgUFJPUFNfSVNfTEFaWV9JTklUSUFMID0gMSA8PCA0O1xuXG5leHBvcnQgY29uc3QgVFJBTlNJVElPTl9JTiA9IDE7XG5leHBvcnQgY29uc3QgVFJBTlNJVElPTl9PVVQgPSAxIDw8IDE7XG5leHBvcnQgY29uc3QgVFJBTlNJVElPTl9HTE9CQUwgPSAxIDw8IDI7XG5cbmV4cG9ydCBjb25zdCBURU1QTEFURV9GUkFHTUVOVCA9IDE7XG5leHBvcnQgY29uc3QgVEVNUExBVEVfVVNFX0lNUE9SVF9OT0RFID0gMSA8PCAxO1xuZXhwb3J0IGNvbnN0IFRFTVBMQVRFX1VTRV9TVkcgPSAxIDw8IDI7XG5leHBvcnQgY29uc3QgVEVNUExBVEVfVVNFX01BVEhNTCA9IDEgPDwgMztcblxuZXhwb3J0IGNvbnN0IEhZRFJBVElPTl9TVEFSVCA9ICdbJztcbi8qKiB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYHs6ZWxzZX0uLi5gIGJsb2NrIHdhcyByZW5kZXJlZCAqL1xuZXhwb3J0IGNvbnN0IEhZRFJBVElPTl9TVEFSVF9FTFNFID0gJ1shJztcbi8qKiB1c2VkIHRvIGluZGljYXRlIHRoYXQgYSBib3VuZGFyeSdzIGBmYWlsZWRgIHNuaXBwZXQgd2FzIHJlbmRlcmVkIG9uIHRoZSBzZXJ2ZXIgKi9cbmV4cG9ydCBjb25zdCBIWURSQVRJT05fU1RBUlRfRkFJTEVEID0gJ1s/JztcbmV4cG9ydCBjb25zdCBIWURSQVRJT05fRU5EID0gJ10nO1xuZXhwb3J0IGNvbnN0IEhZRFJBVElPTl9FUlJPUiA9IHt9O1xuXG5leHBvcnQgY29uc3QgRUxFTUVOVF9JU19OQU1FU1BBQ0VEID0gMTtcbmV4cG9ydCBjb25zdCBFTEVNRU5UX1BSRVNFUlZFX0FUVFJJQlVURV9DQVNFID0gMSA8PCAxO1xuZXhwb3J0IGNvbnN0IEVMRU1FTlRfSVNfSU5QVVQgPSAxIDw8IDI7XG5cbmV4cG9ydCBjb25zdCBVTklOSVRJQUxJWkVEID0gU3ltYm9sKCd1bmluaXRpYWxpemVkJyk7XG5cbi8vIERldi10aW1lIGNvbXBvbmVudCBwcm9wZXJ0aWVzXG5leHBvcnQgY29uc3QgRklMRU5BTUUgPSBTeW1ib2woJ2ZpbGVuYW1lJyk7XG5leHBvcnQgY29uc3QgSE1SID0gU3ltYm9sKCdobXInKTtcblxuZXhwb3J0IGNvbnN0IE5BTUVTUEFDRV9IVE1MID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwnO1xuZXhwb3J0IGNvbnN0IE5BTUVTUEFDRV9TVkcgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuZXhwb3J0IGNvbnN0IE5BTUVTUEFDRV9NQVRITUwgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTCc7XG5cbi8vIHdlIHVzZSBhIGxpc3Qgb2YgaWdub3JhYmxlIHJ1bnRpbWUgd2FybmluZ3MgYmVjYXVzZSBub3QgZXZlcnkgcnVudGltZSB3YXJuaW5nXG4vLyBjYW4gYmUgaWdub3JlZCBhbmQgd2Ugd2FudCB0byBrZWVwIHRoZSB2YWxpZGF0aW9uIGZvciBzdmVsdGUtaWdub3JlIGluIHBsYWNlXG5leHBvcnQgY29uc3QgSUdOT1JBQkxFX1JVTlRJTUVfV0FSTklOR1MgPSAvKiogQHR5cGUge2NvbnN0fSAqLyAoW1xuXHQnYXdhaXRfd2F0ZXJmYWxsJyxcblx0J2F3YWl0X3JlYWN0aXZpdHlfbG9zcycsXG5cdCdzdGF0ZV9zbmFwc2hvdF91bmNsb25lYWJsZScsXG5cdCdiaW5kaW5nX3Byb3BlcnR5X25vbl9yZWFjdGl2ZScsXG5cdCdoeWRyYXRpb25fYXR0cmlidXRlX2NoYW5nZWQnLFxuXHQnaHlkcmF0aW9uX2h0bWxfY2hhbmdlZCcsXG5cdCdvd25lcnNoaXBfaW52YWxpZF9iaW5kaW5nJyxcblx0J293bmVyc2hpcF9pbnZhbGlkX211dGF0aW9uJ1xuXSk7XG5cbi8qKlxuICogV2hpdGVzcGFjZSBpbnNpZGUgb25lIG9mIHRoZXNlIGVsZW1lbnRzIHdpbGwgbm90IHJlc3VsdCBpblxuICogYSB3aGl0ZXNwYWNlIG5vZGUgYmVpbmcgY3JlYXRlZCBpbiBhbnkgY2lyY3Vtc3RhbmNlcy4gKFRoaXNcbiAqIGxpc3QgaXMgYWxtb3N0IGNlcnRhaW5seSB2ZXJ5IGluY29tcGxldGUpXG4gKiBUT0RPIHRoaXMgaXMgY3VycmVudGx5IHVudXNlZFxuICovXG5leHBvcnQgY29uc3QgRUxFTUVOVFNfV0lUSE9VVF9URVhUID0gWydhdWRpbycsICdkYXRhbGlzdCcsICdkbCcsICdvcHRncm91cCcsICdzZWxlY3QnLCAndmlkZW8nXTtcblxuZXhwb3J0IGNvbnN0IEFUVEFDSE1FTlRfS0VZID0gJ0BhdHRhY2gnO1xuIiwiLyoqIEBpbXBvcnQgeyBUZW1wbGF0ZU5vZGUgfSBmcm9tICcjY2xpZW50JyAqL1xuXG5pbXBvcnQgeyBDT01NRU5UX05PREUgfSBmcm9tICcjY2xpZW50L2NvbnN0YW50cyc7XG5pbXBvcnQge1xuXHRIWURSQVRJT05fRU5ELFxuXHRIWURSQVRJT05fRVJST1IsXG5cdEhZRFJBVElPTl9TVEFSVCxcblx0SFlEUkFUSU9OX1NUQVJUX0VMU0Vcbn0gZnJvbSAnLi4vLi4vLi4vY29uc3RhbnRzLmpzJztcbmltcG9ydCAqIGFzIHcgZnJvbSAnLi4vd2FybmluZ3MuanMnO1xuaW1wb3J0IHsgZ2V0X25leHRfc2libGluZyB9IGZyb20gJy4vb3BlcmF0aW9ucy5qcyc7XG5cbi8qKlxuICogVXNlIHRoaXMgdmFyaWFibGUgdG8gZ3VhcmQgZXZlcnl0aGluZyByZWxhdGVkIHRvIGh5ZHJhdGlvbiBjb2RlIHNvIGl0IGNhbiBiZSB0cmVlc2hha2VuIG91dFxuICogaWYgdGhlIHVzZXIgZG9lc24ndCB1c2UgdGhlIGBoeWRyYXRlYCBtZXRob2QgYW5kIHRoZXNlIGNvZGUgcGF0aHMgYXJlIHRoZXJlZm9yZSBub3QgbmVlZGVkLlxuICovXG5leHBvcnQgbGV0IGh5ZHJhdGluZyA9IGZhbHNlO1xuXG4vKiogQHBhcmFtIHtib29sZWFufSB2YWx1ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldF9oeWRyYXRpbmcodmFsdWUpIHtcblx0aHlkcmF0aW5nID0gdmFsdWU7XG59XG5cbi8qKlxuICogVGhlIG5vZGUgdGhhdCBpcyBjdXJyZW50bHkgYmVpbmcgaHlkcmF0ZWQuIFRoaXMgc3RhcnRzIG91dCBhcyB0aGUgZmlyc3Qgbm9kZSBpbnNpZGUgdGhlIG9wZW5pbmdcbiAqIDwhLS1bLS0+IGNvbW1lbnQsIGFuZCB1cGRhdGVzIGVhY2ggdGltZSBhIGNvbXBvbmVudCBjYWxscyBgJC5jaGlsZCguLi4pYCBvciBgJC5zaWJsaW5nKC4uLilgLlxuICogV2hlbiBlbnRlcmluZyBhIGJsb2NrIChlLmcuIGB7I2lmIC4uLn1gKSwgYGh5ZHJhdGVfbm9kZWAgaXMgdGhlIGJsb2NrIG9wZW5pbmcgY29tbWVudDsgYnkgdGhlXG4gKiB0aW1lIHdlIGxlYXZlIHRoZSBibG9jayBpdCBpcyB0aGUgY2xvc2luZyBjb21tZW50LCB3aGljaCBzZXJ2ZXMgYXMgdGhlIGJsb2NrJ3MgYW5jaG9yLlxuICogQHR5cGUge1RlbXBsYXRlTm9kZX1cbiAqL1xuZXhwb3J0IGxldCBoeWRyYXRlX25vZGU7XG5cbi8qKiBAcGFyYW0ge1RlbXBsYXRlTm9kZSB8IG51bGx9IG5vZGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRfaHlkcmF0ZV9ub2RlKG5vZGUpIHtcblx0aWYgKG5vZGUgPT09IG51bGwpIHtcblx0XHR3Lmh5ZHJhdGlvbl9taXNtYXRjaCgpO1xuXHRcdHRocm93IEhZRFJBVElPTl9FUlJPUjtcblx0fVxuXG5cdHJldHVybiAoaHlkcmF0ZV9ub2RlID0gbm9kZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoeWRyYXRlX25leHQoKSB7XG5cdHJldHVybiBzZXRfaHlkcmF0ZV9ub2RlKGdldF9uZXh0X3NpYmxpbmcoaHlkcmF0ZV9ub2RlKSk7XG59XG5cbi8qKiBAcGFyYW0ge1RlbXBsYXRlTm9kZX0gbm9kZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0KG5vZGUpIHtcblx0aWYgKCFoeWRyYXRpbmcpIHJldHVybjtcblxuXHQvLyBJZiB0aGUgbm9kZSBoYXMgcmVtYWluaW5nIHNpYmxpbmdzLCBzb21ldGhpbmcgaGFzIGdvbmUgd3Jvbmdcblx0aWYgKGdldF9uZXh0X3NpYmxpbmcoaHlkcmF0ZV9ub2RlKSAhPT0gbnVsbCkge1xuXHRcdHcuaHlkcmF0aW9uX21pc21hdGNoKCk7XG5cdFx0dGhyb3cgSFlEUkFUSU9OX0VSUk9SO1xuXHR9XG5cblx0aHlkcmF0ZV9ub2RlID0gbm9kZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxUZW1wbGF0ZUVsZW1lbnR9IHRlbXBsYXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoeWRyYXRlX3RlbXBsYXRlKHRlbXBsYXRlKSB7XG5cdGlmIChoeWRyYXRpbmcpIHtcblx0XHQvLyBAdHMtZXhwZWN0LWVycm9yIFRlbXBsYXRlTm9kZSBkb2Vzbid0IGluY2x1ZGUgRG9jdW1lbnRGcmFnbWVudCwgYnV0IGl0J3MgYWN0dWFsbHkgZmluZVxuXHRcdGh5ZHJhdGVfbm9kZSA9IHRlbXBsYXRlLmNvbnRlbnQ7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHQoY291bnQgPSAxKSB7XG5cdGlmIChoeWRyYXRpbmcpIHtcblx0XHR2YXIgaSA9IGNvdW50O1xuXHRcdHZhciBub2RlID0gaHlkcmF0ZV9ub2RlO1xuXG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0bm9kZSA9IC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoZ2V0X25leHRfc2libGluZyhub2RlKSk7XG5cdFx0fVxuXG5cdFx0aHlkcmF0ZV9ub2RlID0gbm9kZTtcblx0fVxufVxuXG4vKipcbiAqIFNraXBzIG9yIHJlbW92ZXMgKGRlcGVuZGluZyBvbiB7QGxpbmsgcmVtb3ZlfSkgYWxsIG5vZGVzIHN0YXJ0aW5nIGF0IGBoeWRyYXRlX25vZGVgIHVwIHVudGlsIHRoZSBuZXh0IGh5ZHJhdGlvbiBlbmQgY29tbWVudFxuICogQHBhcmFtIHtib29sZWFufSByZW1vdmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNraXBfbm9kZXMocmVtb3ZlID0gdHJ1ZSkge1xuXHR2YXIgZGVwdGggPSAwO1xuXHR2YXIgbm9kZSA9IGh5ZHJhdGVfbm9kZTtcblxuXHR3aGlsZSAodHJ1ZSkge1xuXHRcdGlmIChub2RlLm5vZGVUeXBlID09PSBDT01NRU5UX05PREUpIHtcblx0XHRcdHZhciBkYXRhID0gLyoqIEB0eXBlIHtDb21tZW50fSAqLyAobm9kZSkuZGF0YTtcblxuXHRcdFx0aWYgKGRhdGEgPT09IEhZRFJBVElPTl9FTkQpIHtcblx0XHRcdFx0aWYgKGRlcHRoID09PSAwKSByZXR1cm4gbm9kZTtcblx0XHRcdFx0ZGVwdGggLT0gMTtcblx0XHRcdH0gZWxzZSBpZiAoXG5cdFx0XHRcdGRhdGEgPT09IEhZRFJBVElPTl9TVEFSVCB8fFxuXHRcdFx0XHRkYXRhID09PSBIWURSQVRJT05fU1RBUlRfRUxTRSB8fFxuXHRcdFx0XHQvLyBcIlsxXCIsIFwiWzJcIiwgZXRjLiBmb3IgaWYgYmxvY2tzXG5cdFx0XHRcdChkYXRhWzBdID09PSAnWycgJiYgIWlzTmFOKE51bWJlcihkYXRhLnNsaWNlKDEpKSkpXG5cdFx0XHQpIHtcblx0XHRcdFx0ZGVwdGggKz0gMTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR2YXIgbmV4dCA9IC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoZ2V0X25leHRfc2libGluZyhub2RlKSk7XG5cdFx0aWYgKHJlbW92ZSkgbm9kZS5yZW1vdmUoKTtcblx0XHRub2RlID0gbmV4dDtcblx0fVxufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0ge1RlbXBsYXRlTm9kZX0gbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZF9oeWRyYXRpb25faW5zdHJ1Y3Rpb24obm9kZSkge1xuXHRpZiAoIW5vZGUgfHwgbm9kZS5ub2RlVHlwZSAhPT0gQ09NTUVOVF9OT0RFKSB7XG5cdFx0dy5oeWRyYXRpb25fbWlzbWF0Y2goKTtcblx0XHR0aHJvdyBIWURSQVRJT05fRVJST1I7XG5cdH1cblxuXHRyZXR1cm4gLyoqIEB0eXBlIHtDb21tZW50fSAqLyAobm9kZSkuZGF0YTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgRXF1YWxzIH0gZnJvbSAnI2NsaWVudCcgKi9cblxuLyoqIEB0eXBlIHtFcXVhbHN9ICovXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxzKHZhbHVlKSB7XG5cdHJldHVybiB2YWx1ZSA9PT0gdGhpcy52O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gYVxuICogQHBhcmFtIHt1bmtub3dufSBiXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhZmVfbm90X2VxdWFsKGEsIGIpIHtcblx0cmV0dXJuIGEgIT0gYVxuXHRcdD8gYiA9PSBiXG5cdFx0OiBhICE9PSBiIHx8IChhICE9PSBudWxsICYmIHR5cGVvZiBhID09PSAnb2JqZWN0JykgfHwgdHlwZW9mIGEgPT09ICdmdW5jdGlvbic7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSBhXG4gKiBAcGFyYW0ge3Vua25vd259IGJcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gbm90X2VxdWFsKGEsIGIpIHtcblx0cmV0dXJuIGEgIT09IGI7XG59XG5cbi8qKiBAdHlwZSB7RXF1YWxzfSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhZmVfZXF1YWxzKHZhbHVlKSB7XG5cdHJldHVybiAhc2FmZV9ub3RfZXF1YWwodmFsdWUsIHRoaXMudik7XG59XG4iLCIvKiBUaGlzIGZpbGUgaXMgZ2VuZXJhdGVkIGJ5IHNjcmlwdHMvcHJvY2Vzcy1tZXNzYWdlcy9pbmRleC5qcy4gRG8gbm90IGVkaXQhICovXG5cbmltcG9ydCB7IERFViB9IGZyb20gJ2VzbS1lbnYnO1xuXG4vKipcbiAqIENhbm5vdCB1c2UgYCVuYW1lJSguLi4pYCB1bmxlc3MgdGhlIGBleHBlcmltZW50YWwuYXN5bmNgIGNvbXBpbGVyIG9wdGlvbiBpcyBgdHJ1ZWBcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJucyB7bmV2ZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHBlcmltZW50YWxfYXN5bmNfcmVxdWlyZWQobmFtZSkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGV4cGVyaW1lbnRhbF9hc3luY19yZXF1aXJlZFxcbkNhbm5vdCB1c2UgXFxgJHtuYW1lfSguLi4pXFxgIHVubGVzcyB0aGUgXFxgZXhwZXJpbWVudGFsLmFzeW5jXFxgIGNvbXBpbGVyIG9wdGlvbiBpcyBcXGB0cnVlXFxgXFxuaHR0cHM6Ly9zdmVsdGUuZGV2L2UvZXhwZXJpbWVudGFsX2FzeW5jX3JlcXVpcmVkYCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL2V4cGVyaW1lbnRhbF9hc3luY19yZXF1aXJlZGApO1xuXHR9XG59XG5cbi8qKlxuICogQ2Fubm90IHVzZSBge0ByZW5kZXIgY2hpbGRyZW4oLi4uKX1gIGlmIHRoZSBwYXJlbnQgY29tcG9uZW50IHVzZXMgYGxldDpgIGRpcmVjdGl2ZXMuIENvbnNpZGVyIHVzaW5nIGEgbmFtZWQgc25pcHBldCBpbnN0ZWFkXG4gKiBAcmV0dXJucyB7bmV2ZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZhbGlkX2RlZmF1bHRfc25pcHBldCgpIHtcblx0aWYgKERFVikge1xuXHRcdGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBpbnZhbGlkX2RlZmF1bHRfc25pcHBldFxcbkNhbm5vdCB1c2UgXFxge0ByZW5kZXIgY2hpbGRyZW4oLi4uKX1cXGAgaWYgdGhlIHBhcmVudCBjb21wb25lbnQgdXNlcyBcXGBsZXQ6XFxgIGRpcmVjdGl2ZXMuIENvbnNpZGVyIHVzaW5nIGEgbmFtZWQgc25pcHBldCBpbnN0ZWFkXFxuaHR0cHM6Ly9zdmVsdGUuZGV2L2UvaW52YWxpZF9kZWZhdWx0X3NuaXBwZXRgKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvaW52YWxpZF9kZWZhdWx0X3NuaXBwZXRgKTtcblx0fVxufVxuXG4vKipcbiAqIEEgc25pcHBldCBmdW5jdGlvbiB3YXMgcGFzc2VkIGludmFsaWQgYXJndW1lbnRzLiBTbmlwcGV0cyBzaG91bGQgb25seSBiZSBpbnN0YW50aWF0ZWQgdmlhIGB7QHJlbmRlciAuLi59YFxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW52YWxpZF9zbmlwcGV0X2FyZ3VtZW50cygpIHtcblx0aWYgKERFVikge1xuXHRcdGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBpbnZhbGlkX3NuaXBwZXRfYXJndW1lbnRzXFxuQSBzbmlwcGV0IGZ1bmN0aW9uIHdhcyBwYXNzZWQgaW52YWxpZCBhcmd1bWVudHMuIFNuaXBwZXRzIHNob3VsZCBvbmx5IGJlIGluc3RhbnRpYXRlZCB2aWEgXFxge0ByZW5kZXIgLi4ufVxcYFxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2ludmFsaWRfc25pcHBldF9hcmd1bWVudHNgKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvaW52YWxpZF9zbmlwcGV0X2FyZ3VtZW50c2ApO1xuXHR9XG59XG5cbi8qKlxuICogQW4gaW52YXJpYW50IHZpb2xhdGlvbiBvY2N1cnJlZCwgbWVhbmluZyBTdmVsdGUncyBpbnRlcm5hbCBhc3N1bXB0aW9ucyB3ZXJlIGZsYXdlZC4gVGhpcyBpcyBhIGJ1ZyBpbiBTdmVsdGUsIG5vdCB5b3VyIGFwcCDigJQgcGxlYXNlIG9wZW4gYW4gaXNzdWUgYXQgaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL3N2ZWx0ZSwgY2l0aW5nIHRoZSBmb2xsb3dpbmcgbWVzc2FnZTogXCIlbWVzc2FnZSVcIlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludmFyaWFudF92aW9sYXRpb24obWVzc2FnZSkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGludmFyaWFudF92aW9sYXRpb25cXG5BbiBpbnZhcmlhbnQgdmlvbGF0aW9uIG9jY3VycmVkLCBtZWFuaW5nIFN2ZWx0ZSdzIGludGVybmFsIGFzc3VtcHRpb25zIHdlcmUgZmxhd2VkLiBUaGlzIGlzIGEgYnVnIGluIFN2ZWx0ZSwgbm90IHlvdXIgYXBwIOKAlCBwbGVhc2Ugb3BlbiBhbiBpc3N1ZSBhdCBodHRwczovL2dpdGh1Yi5jb20vc3ZlbHRlanMvc3ZlbHRlLCBjaXRpbmcgdGhlIGZvbGxvd2luZyBtZXNzYWdlOiBcIiR7bWVzc2FnZX1cIlxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2ludmFyaWFudF92aW9sYXRpb25gKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvaW52YXJpYW50X3Zpb2xhdGlvbmApO1xuXHR9XG59XG5cbi8qKlxuICogYCVuYW1lJSguLi4pYCBjYW4gb25seSBiZSB1c2VkIGR1cmluZyBjb21wb25lbnQgaW5pdGlhbGlzYXRpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJucyB7bmV2ZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaWZlY3ljbGVfb3V0c2lkZV9jb21wb25lbnQobmFtZSkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGxpZmVjeWNsZV9vdXRzaWRlX2NvbXBvbmVudFxcblxcYCR7bmFtZX0oLi4uKVxcYCBjYW4gb25seSBiZSB1c2VkIGR1cmluZyBjb21wb25lbnQgaW5pdGlhbGlzYXRpb25cXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9saWZlY3ljbGVfb3V0c2lkZV9jb21wb25lbnRgKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvbGlmZWN5Y2xlX291dHNpZGVfY29tcG9uZW50YCk7XG5cdH1cbn1cblxuLyoqXG4gKiBDb250ZXh0IHdhcyBub3Qgc2V0IGluIHRoZSBjdXJyZW50IGNvbXBvbmVudCBvciBhbnkgb2YgaXRzIGFuY2VzdG9yc1xuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWlzc2luZ19jb250ZXh0KCkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYG1pc3NpbmdfY29udGV4dFxcbkNvbnRleHQgd2FzIG5vdCBzZXQgaW4gdGhlIGN1cnJlbnQgY29tcG9uZW50IG9yIGFueSBvZiBpdHMgYW5jZXN0b3JzXFxuaHR0cHM6Ly9zdmVsdGUuZGV2L2UvbWlzc2luZ19jb250ZXh0YCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL21pc3NpbmdfY29udGV4dGApO1xuXHR9XG59XG5cbi8qKlxuICogYHNldENvbnRleHRgIG11c3QgYmUgY2FsbGVkIHdoZW4gYSBjb21wb25lbnQgZmlyc3QgaW5pdGlhbGl6ZXMsIG5vdCBpbiBhIHN1YnNlcXVlbnQgZWZmZWN0IG9yIGFmdGVyIGFuIGBhd2FpdGAgZXhwcmVzc2lvblxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0X2NvbnRleHRfYWZ0ZXJfaW5pdCgpIHtcblx0aWYgKERFVikge1xuXHRcdGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBzZXRfY29udGV4dF9hZnRlcl9pbml0XFxuXFxgc2V0Q29udGV4dFxcYCBtdXN0IGJlIGNhbGxlZCB3aGVuIGEgY29tcG9uZW50IGZpcnN0IGluaXRpYWxpemVzLCBub3QgaW4gYSBzdWJzZXF1ZW50IGVmZmVjdCBvciBhZnRlciBhbiBcXGBhd2FpdFxcYCBleHByZXNzaW9uXFxuaHR0cHM6Ly9zdmVsdGUuZGV2L2Uvc2V0X2NvbnRleHRfYWZ0ZXJfaW5pdGApO1xuXG5cdFx0ZXJyb3IubmFtZSA9ICdTdmVsdGUgZXJyb3InO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBodHRwczovL3N2ZWx0ZS5kZXYvZS9zZXRfY29udGV4dF9hZnRlcl9pbml0YCk7XG5cdH1cbn1cblxuLyoqXG4gKiBBdHRlbXB0ZWQgdG8gcmVuZGVyIGEgc25pcHBldCB3aXRob3V0IGEgYHtAcmVuZGVyfWAgYmxvY2suIFRoaXMgd291bGQgY2F1c2UgdGhlIHNuaXBwZXQgY29kZSB0byBiZSBzdHJpbmdpZmllZCBpbnN0ZWFkIG9mIGl0cyBjb250ZW50IGJlaW5nIHJlbmRlcmVkIHRvIHRoZSBET00uIFRvIGZpeCB0aGlzLCBjaGFuZ2UgYHtzbmlwcGV0fWAgdG8gYHtAcmVuZGVyIHNuaXBwZXQoKX1gLlxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc25pcHBldF93aXRob3V0X3JlbmRlcl90YWcoKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgc25pcHBldF93aXRob3V0X3JlbmRlcl90YWdcXG5BdHRlbXB0ZWQgdG8gcmVuZGVyIGEgc25pcHBldCB3aXRob3V0IGEgXFxge0ByZW5kZXJ9XFxgIGJsb2NrLiBUaGlzIHdvdWxkIGNhdXNlIHRoZSBzbmlwcGV0IGNvZGUgdG8gYmUgc3RyaW5naWZpZWQgaW5zdGVhZCBvZiBpdHMgY29udGVudCBiZWluZyByZW5kZXJlZCB0byB0aGUgRE9NLiBUbyBmaXggdGhpcywgY2hhbmdlIFxcYHtzbmlwcGV0fVxcYCB0byBcXGB7QHJlbmRlciBzbmlwcGV0KCl9XFxgLlxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL3NuaXBwZXRfd2l0aG91dF9yZW5kZXJfdGFnYCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL3NuaXBwZXRfd2l0aG91dF9yZW5kZXJfdGFnYCk7XG5cdH1cbn1cblxuLyoqXG4gKiBgJW5hbWUlYCBpcyBub3QgYSBzdG9yZSB3aXRoIGEgYHN1YnNjcmliZWAgbWV0aG9kXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVfaW52YWxpZF9zaGFwZShuYW1lKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgc3RvcmVfaW52YWxpZF9zaGFwZVxcblxcYCR7bmFtZX1cXGAgaXMgbm90IGEgc3RvcmUgd2l0aCBhIFxcYHN1YnNjcmliZVxcYCBtZXRob2RcXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9zdG9yZV9pbnZhbGlkX3NoYXBlYCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL3N0b3JlX2ludmFsaWRfc2hhcGVgKTtcblx0fVxufVxuXG4vKipcbiAqIFRoZSBgdGhpc2AgcHJvcCBvbiBgPHN2ZWx0ZTplbGVtZW50PmAgbXVzdCBiZSBhIHN0cmluZywgaWYgZGVmaW5lZFxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3ZlbHRlX2VsZW1lbnRfaW52YWxpZF90aGlzX3ZhbHVlKCkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYHN2ZWx0ZV9lbGVtZW50X2ludmFsaWRfdGhpc192YWx1ZVxcblRoZSBcXGB0aGlzXFxgIHByb3Agb24gXFxgPHN2ZWx0ZTplbGVtZW50PlxcYCBtdXN0IGJlIGEgc3RyaW5nLCBpZiBkZWZpbmVkXFxuaHR0cHM6Ly9zdmVsdGUuZGV2L2Uvc3ZlbHRlX2VsZW1lbnRfaW52YWxpZF90aGlzX3ZhbHVlYCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL3N2ZWx0ZV9lbGVtZW50X2ludmFsaWRfdGhpc192YWx1ZWApO1xuXHR9XG59IiwiLyogVGhpcyBmaWxlIGlzIGdlbmVyYXRlZCBieSBzY3JpcHRzL3Byb2Nlc3MtbWVzc2FnZXMvaW5kZXguanMuIERvIG5vdCBlZGl0ISAqL1xuXG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcblxuZXhwb3J0ICogIGZyb20gJy4uL3NoYXJlZC9lcnJvcnMuanMnO1xuXG4vKipcbiAqIENhbm5vdCBjcmVhdGUgYSBgJGRlcml2ZWQoLi4uKWAgd2l0aCBhbiBgYXdhaXRgIGV4cHJlc3Npb24gb3V0c2lkZSBvZiBhbiBlZmZlY3QgdHJlZVxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXN5bmNfZGVyaXZlZF9vcnBoYW4oKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgYXN5bmNfZGVyaXZlZF9vcnBoYW5cXG5DYW5ub3QgY3JlYXRlIGEgXFxgJGRlcml2ZWQoLi4uKVxcYCB3aXRoIGFuIFxcYGF3YWl0XFxgIGV4cHJlc3Npb24gb3V0c2lkZSBvZiBhbiBlZmZlY3QgdHJlZVxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2FzeW5jX2Rlcml2ZWRfb3JwaGFuYCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL2FzeW5jX2Rlcml2ZWRfb3JwaGFuYCk7XG5cdH1cbn1cblxuLyoqXG4gKiBVc2luZyBgYmluZDp2YWx1ZWAgdG9nZXRoZXIgd2l0aCBhIGNoZWNrYm94IGlucHV0IGlzIG5vdCBhbGxvd2VkLiBVc2UgYGJpbmQ6Y2hlY2tlZGAgaW5zdGVhZFxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9pbnZhbGlkX2NoZWNrYm94X3ZhbHVlKCkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGJpbmRfaW52YWxpZF9jaGVja2JveF92YWx1ZVxcblVzaW5nIFxcYGJpbmQ6dmFsdWVcXGAgdG9nZXRoZXIgd2l0aCBhIGNoZWNrYm94IGlucHV0IGlzIG5vdCBhbGxvd2VkLiBVc2UgXFxgYmluZDpjaGVja2VkXFxgIGluc3RlYWRcXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9iaW5kX2ludmFsaWRfY2hlY2tib3hfdmFsdWVgKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvYmluZF9pbnZhbGlkX2NoZWNrYm94X3ZhbHVlYCk7XG5cdH1cbn1cblxuLyoqXG4gKiBDb21wb25lbnQgJWNvbXBvbmVudCUgaGFzIGFuIGV4cG9ydCBuYW1lZCBgJWtleSVgIHRoYXQgYSBjb25zdW1lciBjb21wb25lbnQgaXMgdHJ5aW5nIHRvIGFjY2VzcyB1c2luZyBgYmluZDola2V5JWAsIHdoaWNoIGlzIGRpc2FsbG93ZWQuIEluc3RlYWQsIHVzZSBgYmluZDp0aGlzYCAoZS5nLiBgPCVuYW1lJSBiaW5kOnRoaXM9e2NvbXBvbmVudH0gLz5gKSBhbmQgdGhlbiBhY2Nlc3MgdGhlIHByb3BlcnR5IG9uIHRoZSBib3VuZCBjb21wb25lbnQgaW5zdGFuY2UgKGUuZy4gYGNvbXBvbmVudC4la2V5JWApXG4gKiBAcGFyYW0ge3N0cmluZ30gY29tcG9uZW50XG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZF9pbnZhbGlkX2V4cG9ydChjb21wb25lbnQsIGtleSwgbmFtZSkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGJpbmRfaW52YWxpZF9leHBvcnRcXG5Db21wb25lbnQgJHtjb21wb25lbnR9IGhhcyBhbiBleHBvcnQgbmFtZWQgXFxgJHtrZXl9XFxgIHRoYXQgYSBjb25zdW1lciBjb21wb25lbnQgaXMgdHJ5aW5nIHRvIGFjY2VzcyB1c2luZyBcXGBiaW5kOiR7a2V5fVxcYCwgd2hpY2ggaXMgZGlzYWxsb3dlZC4gSW5zdGVhZCwgdXNlIFxcYGJpbmQ6dGhpc1xcYCAoZS5nLiBcXGA8JHtuYW1lfSBiaW5kOnRoaXM9e2NvbXBvbmVudH0gLz5cXGApIGFuZCB0aGVuIGFjY2VzcyB0aGUgcHJvcGVydHkgb24gdGhlIGJvdW5kIGNvbXBvbmVudCBpbnN0YW5jZSAoZS5nLiBcXGBjb21wb25lbnQuJHtrZXl9XFxgKVxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2JpbmRfaW52YWxpZF9leHBvcnRgKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvYmluZF9pbnZhbGlkX2V4cG9ydGApO1xuXHR9XG59XG5cbi8qKlxuICogQSBjb21wb25lbnQgaXMgYXR0ZW1wdGluZyB0byBiaW5kIHRvIGEgbm9uLWJpbmRhYmxlIHByb3BlcnR5IGAla2V5JWAgYmVsb25naW5nIHRvICVjb21wb25lbnQlIChpLmUuIGA8JW5hbWUlIGJpbmQ6JWtleSU9ey4uLn0+YCkuIFRvIG1hcmsgYSBwcm9wZXJ0eSBhcyBiaW5kYWJsZTogYGxldCB7ICVrZXklID0gJGJpbmRhYmxlKCkgfSA9ICRwcm9wcygpYFxuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHBhcmFtIHtzdHJpbmd9IGNvbXBvbmVudFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRfbm90X2JpbmRhYmxlKGtleSwgY29tcG9uZW50LCBuYW1lKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgYmluZF9ub3RfYmluZGFibGVcXG5BIGNvbXBvbmVudCBpcyBhdHRlbXB0aW5nIHRvIGJpbmQgdG8gYSBub24tYmluZGFibGUgcHJvcGVydHkgXFxgJHtrZXl9XFxgIGJlbG9uZ2luZyB0byAke2NvbXBvbmVudH0gKGkuZS4gXFxgPCR7bmFtZX0gYmluZDoke2tleX09ey4uLn0+XFxgKS4gVG8gbWFyayBhIHByb3BlcnR5IGFzIGJpbmRhYmxlOiBcXGBsZXQgeyAke2tleX0gPSAkYmluZGFibGUoKSB9ID0gJHByb3BzKClcXGBcXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9iaW5kX25vdF9iaW5kYWJsZWApO1xuXG5cdFx0ZXJyb3IubmFtZSA9ICdTdmVsdGUgZXJyb3InO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBodHRwczovL3N2ZWx0ZS5kZXYvZS9iaW5kX25vdF9iaW5kYWJsZWApO1xuXHR9XG59XG5cbi8qKlxuICogQ2FsbGluZyBgJW1ldGhvZCVgIG9uIGEgY29tcG9uZW50IGluc3RhbmNlIChvZiAlY29tcG9uZW50JSkgaXMgbm8gbG9uZ2VyIHZhbGlkIGluIFN2ZWx0ZSA1XG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kXG4gKiBAcGFyYW0ge3N0cmluZ30gY29tcG9uZW50XG4gKiBAcmV0dXJucyB7bmV2ZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRfYXBpX2NoYW5nZWQobWV0aG9kLCBjb21wb25lbnQpIHtcblx0aWYgKERFVikge1xuXHRcdGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBjb21wb25lbnRfYXBpX2NoYW5nZWRcXG5DYWxsaW5nIFxcYCR7bWV0aG9kfVxcYCBvbiBhIGNvbXBvbmVudCBpbnN0YW5jZSAob2YgJHtjb21wb25lbnR9KSBpcyBubyBsb25nZXIgdmFsaWQgaW4gU3ZlbHRlIDVcXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9jb21wb25lbnRfYXBpX2NoYW5nZWRgKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvY29tcG9uZW50X2FwaV9jaGFuZ2VkYCk7XG5cdH1cbn1cblxuLyoqXG4gKiBBdHRlbXB0ZWQgdG8gaW5zdGFudGlhdGUgJWNvbXBvbmVudCUgd2l0aCBgbmV3ICVuYW1lJWAsIHdoaWNoIGlzIG5vIGxvbmdlciB2YWxpZCBpbiBTdmVsdGUgNS4gSWYgdGhpcyBjb21wb25lbnQgaXMgbm90IHVuZGVyIHlvdXIgY29udHJvbCwgc2V0IHRoZSBgY29tcGF0aWJpbGl0eS5jb21wb25lbnRBcGlgIGNvbXBpbGVyIG9wdGlvbiB0byBgNGAgdG8ga2VlcCBpdCB3b3JraW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbXBvbmVudFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudF9hcGlfaW52YWxpZF9uZXcoY29tcG9uZW50LCBuYW1lKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgY29tcG9uZW50X2FwaV9pbnZhbGlkX25ld1xcbkF0dGVtcHRlZCB0byBpbnN0YW50aWF0ZSAke2NvbXBvbmVudH0gd2l0aCBcXGBuZXcgJHtuYW1lfVxcYCwgd2hpY2ggaXMgbm8gbG9uZ2VyIHZhbGlkIGluIFN2ZWx0ZSA1LiBJZiB0aGlzIGNvbXBvbmVudCBpcyBub3QgdW5kZXIgeW91ciBjb250cm9sLCBzZXQgdGhlIFxcYGNvbXBhdGliaWxpdHkuY29tcG9uZW50QXBpXFxgIGNvbXBpbGVyIG9wdGlvbiB0byBcXGA0XFxgIHRvIGtlZXAgaXQgd29ya2luZy5cXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9jb21wb25lbnRfYXBpX2ludmFsaWRfbmV3YCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL2NvbXBvbmVudF9hcGlfaW52YWxpZF9uZXdgKTtcblx0fVxufVxuXG4vKipcbiAqIEEgZGVyaXZlZCB2YWx1ZSBjYW5ub3QgcmVmZXJlbmNlIGl0c2VsZiByZWN1cnNpdmVseVxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVyaXZlZF9yZWZlcmVuY2VzX3NlbGYoKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgZGVyaXZlZF9yZWZlcmVuY2VzX3NlbGZcXG5BIGRlcml2ZWQgdmFsdWUgY2Fubm90IHJlZmVyZW5jZSBpdHNlbGYgcmVjdXJzaXZlbHlcXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9kZXJpdmVkX3JlZmVyZW5jZXNfc2VsZmApO1xuXG5cdFx0ZXJyb3IubmFtZSA9ICdTdmVsdGUgZXJyb3InO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBodHRwczovL3N2ZWx0ZS5kZXYvZS9kZXJpdmVkX3JlZmVyZW5jZXNfc2VsZmApO1xuXHR9XG59XG5cbi8qKlxuICogS2V5ZWQgZWFjaCBibG9jayBoYXMgZHVwbGljYXRlIGtleSBgJXZhbHVlJWAgYXQgaW5kZXhlcyAlYSUgYW5kICViJVxuICogQHBhcmFtIHtzdHJpbmd9IGFcbiAqIEBwYXJhbSB7c3RyaW5nfSBiXG4gKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZCB8IG51bGx9IFt2YWx1ZV1cbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVhY2hfa2V5X2R1cGxpY2F0ZShhLCBiLCB2YWx1ZSkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGVhY2hfa2V5X2R1cGxpY2F0ZVxcbiR7dmFsdWVcblx0XHRcdD8gYEtleWVkIGVhY2ggYmxvY2sgaGFzIGR1cGxpY2F0ZSBrZXkgXFxgJHt2YWx1ZX1cXGAgYXQgaW5kZXhlcyAke2F9IGFuZCAke2J9YFxuXHRcdFx0OiBgS2V5ZWQgZWFjaCBibG9jayBoYXMgZHVwbGljYXRlIGtleSBhdCBpbmRleGVzICR7YX0gYW5kICR7Yn1gfVxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2VhY2hfa2V5X2R1cGxpY2F0ZWApO1xuXG5cdFx0ZXJyb3IubmFtZSA9ICdTdmVsdGUgZXJyb3InO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBodHRwczovL3N2ZWx0ZS5kZXYvZS9lYWNoX2tleV9kdXBsaWNhdGVgKTtcblx0fVxufVxuXG4vKipcbiAqIEtleWVkIGVhY2ggYmxvY2sgaGFzIGtleSB0aGF0IGlzIG5vdCBpZGVtcG90ZW50IOKAlCB0aGUga2V5IGZvciBpdGVtIGF0IGluZGV4ICVpbmRleCUgd2FzIGAlYSVgIGJ1dCBpcyBub3cgYCViJWAuIEtleXMgbXVzdCBiZSB0aGUgc2FtZSBlYWNoIHRpbWUgZm9yIGEgZ2l2ZW4gaXRlbVxuICogQHBhcmFtIHtzdHJpbmd9IGluZGV4XG4gKiBAcGFyYW0ge3N0cmluZ30gYVxuICogQHBhcmFtIHtzdHJpbmd9IGJcbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVhY2hfa2V5X3ZvbGF0aWxlKGluZGV4LCBhLCBiKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgZWFjaF9rZXlfdm9sYXRpbGVcXG5LZXllZCBlYWNoIGJsb2NrIGhhcyBrZXkgdGhhdCBpcyBub3QgaWRlbXBvdGVudCDigJQgdGhlIGtleSBmb3IgaXRlbSBhdCBpbmRleCAke2luZGV4fSB3YXMgXFxgJHthfVxcYCBidXQgaXMgbm93IFxcYCR7Yn1cXGAuIEtleXMgbXVzdCBiZSB0aGUgc2FtZSBlYWNoIHRpbWUgZm9yIGEgZ2l2ZW4gaXRlbVxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2VhY2hfa2V5X3ZvbGF0aWxlYCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL2VhY2hfa2V5X3ZvbGF0aWxlYCk7XG5cdH1cbn1cblxuLyoqXG4gKiBgJXJ1bmUlYCBjYW5ub3QgYmUgdXNlZCBpbnNpZGUgYW4gZWZmZWN0IGNsZWFudXAgZnVuY3Rpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBydW5lXG4gKiBAcmV0dXJucyB7bmV2ZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlZmZlY3RfaW5fdGVhcmRvd24ocnVuZSkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGVmZmVjdF9pbl90ZWFyZG93blxcblxcYCR7cnVuZX1cXGAgY2Fubm90IGJlIHVzZWQgaW5zaWRlIGFuIGVmZmVjdCBjbGVhbnVwIGZ1bmN0aW9uXFxuaHR0cHM6Ly9zdmVsdGUuZGV2L2UvZWZmZWN0X2luX3RlYXJkb3duYCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL2VmZmVjdF9pbl90ZWFyZG93bmApO1xuXHR9XG59XG5cbi8qKlxuICogRWZmZWN0IGNhbm5vdCBiZSBjcmVhdGVkIGluc2lkZSBhIGAkZGVyaXZlZGAgdmFsdWUgdGhhdCB3YXMgbm90IGl0c2VsZiBjcmVhdGVkIGluc2lkZSBhbiBlZmZlY3RcbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVmZmVjdF9pbl91bm93bmVkX2Rlcml2ZWQoKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgZWZmZWN0X2luX3Vub3duZWRfZGVyaXZlZFxcbkVmZmVjdCBjYW5ub3QgYmUgY3JlYXRlZCBpbnNpZGUgYSBcXGAkZGVyaXZlZFxcYCB2YWx1ZSB0aGF0IHdhcyBub3QgaXRzZWxmIGNyZWF0ZWQgaW5zaWRlIGFuIGVmZmVjdFxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2VmZmVjdF9pbl91bm93bmVkX2Rlcml2ZWRgKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvZWZmZWN0X2luX3Vub3duZWRfZGVyaXZlZGApO1xuXHR9XG59XG5cbi8qKlxuICogYCVydW5lJWAgY2FuIG9ubHkgYmUgdXNlZCBpbnNpZGUgYW4gZWZmZWN0IChlLmcuIGR1cmluZyBjb21wb25lbnQgaW5pdGlhbGlzYXRpb24pXG4gKiBAcGFyYW0ge3N0cmluZ30gcnVuZVxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWZmZWN0X29ycGhhbihydW5lKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgZWZmZWN0X29ycGhhblxcblxcYCR7cnVuZX1cXGAgY2FuIG9ubHkgYmUgdXNlZCBpbnNpZGUgYW4gZWZmZWN0IChlLmcuIGR1cmluZyBjb21wb25lbnQgaW5pdGlhbGlzYXRpb24pXFxuaHR0cHM6Ly9zdmVsdGUuZGV2L2UvZWZmZWN0X29ycGhhbmApO1xuXG5cdFx0ZXJyb3IubmFtZSA9ICdTdmVsdGUgZXJyb3InO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBodHRwczovL3N2ZWx0ZS5kZXYvZS9lZmZlY3Rfb3JwaGFuYCk7XG5cdH1cbn1cblxuLyoqXG4gKiBgJGVmZmVjdC5wZW5kaW5nKClgIGNhbiBvbmx5IGJlIGNhbGxlZCBpbnNpZGUgYW4gZWZmZWN0IG9yIGRlcml2ZWRcbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVmZmVjdF9wZW5kaW5nX291dHNpZGVfcmVhY3Rpb24oKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgZWZmZWN0X3BlbmRpbmdfb3V0c2lkZV9yZWFjdGlvblxcblxcYCRlZmZlY3QucGVuZGluZygpXFxgIGNhbiBvbmx5IGJlIGNhbGxlZCBpbnNpZGUgYW4gZWZmZWN0IG9yIGRlcml2ZWRcXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9lZmZlY3RfcGVuZGluZ19vdXRzaWRlX3JlYWN0aW9uYCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL2VmZmVjdF9wZW5kaW5nX291dHNpZGVfcmVhY3Rpb25gKTtcblx0fVxufVxuXG4vKipcbiAqIE1heGltdW0gdXBkYXRlIGRlcHRoIGV4Y2VlZGVkLiBUaGlzIHR5cGljYWxseSBpbmRpY2F0ZXMgdGhhdCBhbiBlZmZlY3QgcmVhZHMgYW5kIHdyaXRlcyB0aGUgc2FtZSBwaWVjZSBvZiBzdGF0ZVxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWZmZWN0X3VwZGF0ZV9kZXB0aF9leGNlZWRlZCgpIHtcblx0aWYgKERFVikge1xuXHRcdGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBlZmZlY3RfdXBkYXRlX2RlcHRoX2V4Y2VlZGVkXFxuTWF4aW11bSB1cGRhdGUgZGVwdGggZXhjZWVkZWQuIFRoaXMgdHlwaWNhbGx5IGluZGljYXRlcyB0aGF0IGFuIGVmZmVjdCByZWFkcyBhbmQgd3JpdGVzIHRoZSBzYW1lIHBpZWNlIG9mIHN0YXRlXFxuaHR0cHM6Ly9zdmVsdGUuZGV2L2UvZWZmZWN0X3VwZGF0ZV9kZXB0aF9leGNlZWRlZGApO1xuXG5cdFx0ZXJyb3IubmFtZSA9ICdTdmVsdGUgZXJyb3InO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBodHRwczovL3N2ZWx0ZS5kZXYvZS9lZmZlY3RfdXBkYXRlX2RlcHRoX2V4Y2VlZGVkYCk7XG5cdH1cbn1cblxuLyoqXG4gKiBDYW5ub3QgdXNlIGBmbHVzaFN5bmNgIGluc2lkZSBhbiBlZmZlY3RcbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsdXNoX3N5bmNfaW5fZWZmZWN0KCkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGZsdXNoX3N5bmNfaW5fZWZmZWN0XFxuQ2Fubm90IHVzZSBcXGBmbHVzaFN5bmNcXGAgaW5zaWRlIGFuIGVmZmVjdFxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2ZsdXNoX3N5bmNfaW5fZWZmZWN0YCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL2ZsdXNoX3N5bmNfaW5fZWZmZWN0YCk7XG5cdH1cbn1cblxuLyoqXG4gKiBDYW5ub3QgY29tbWl0IGEgZm9yayB0aGF0IHdhcyBhbHJlYWR5IGRpc2NhcmRlZFxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ya19kaXNjYXJkZWQoKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgZm9ya19kaXNjYXJkZWRcXG5DYW5ub3QgY29tbWl0IGEgZm9yayB0aGF0IHdhcyBhbHJlYWR5IGRpc2NhcmRlZFxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2ZvcmtfZGlzY2FyZGVkYCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL2ZvcmtfZGlzY2FyZGVkYCk7XG5cdH1cbn1cblxuLyoqXG4gKiBDYW5ub3QgY3JlYXRlIGEgZm9yayBpbnNpZGUgYW4gZWZmZWN0IG9yIHdoZW4gc3RhdGUgY2hhbmdlcyBhcmUgcGVuZGluZ1xuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ya190aW1pbmcoKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgZm9ya190aW1pbmdcXG5DYW5ub3QgY3JlYXRlIGEgZm9yayBpbnNpZGUgYW4gZWZmZWN0IG9yIHdoZW4gc3RhdGUgY2hhbmdlcyBhcmUgcGVuZGluZ1xcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2ZvcmtfdGltaW5nYCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL2ZvcmtfdGltaW5nYCk7XG5cdH1cbn1cblxuLyoqXG4gKiBgZ2V0QWJvcnRTaWduYWwoKWAgY2FuIG9ubHkgYmUgY2FsbGVkIGluc2lkZSBhbiBlZmZlY3Qgb3IgZGVyaXZlZFxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0X2Fib3J0X3NpZ25hbF9vdXRzaWRlX3JlYWN0aW9uKCkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGdldF9hYm9ydF9zaWduYWxfb3V0c2lkZV9yZWFjdGlvblxcblxcYGdldEFib3J0U2lnbmFsKClcXGAgY2FuIG9ubHkgYmUgY2FsbGVkIGluc2lkZSBhbiBlZmZlY3Qgb3IgZGVyaXZlZFxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2dldF9hYm9ydF9zaWduYWxfb3V0c2lkZV9yZWFjdGlvbmApO1xuXG5cdFx0ZXJyb3IubmFtZSA9ICdTdmVsdGUgZXJyb3InO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBodHRwczovL3N2ZWx0ZS5kZXYvZS9nZXRfYWJvcnRfc2lnbmFsX291dHNpZGVfcmVhY3Rpb25gKTtcblx0fVxufVxuXG4vKipcbiAqIEV4cGVjdGVkIHRvIGZpbmQgYSBoeWRyYXRhYmxlIHdpdGgga2V5IGAla2V5JWAgZHVyaW5nIGh5ZHJhdGlvbiwgYnV0IGRpZCBub3QuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gKiBAcmV0dXJucyB7bmV2ZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoeWRyYXRhYmxlX21pc3NpbmdfYnV0X3JlcXVpcmVkKGtleSkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGh5ZHJhdGFibGVfbWlzc2luZ19idXRfcmVxdWlyZWRcXG5FeHBlY3RlZCB0byBmaW5kIGEgaHlkcmF0YWJsZSB3aXRoIGtleSBcXGAke2tleX1cXGAgZHVyaW5nIGh5ZHJhdGlvbiwgYnV0IGRpZCBub3QuXFxuaHR0cHM6Ly9zdmVsdGUuZGV2L2UvaHlkcmF0YWJsZV9taXNzaW5nX2J1dF9yZXF1aXJlZGApO1xuXG5cdFx0ZXJyb3IubmFtZSA9ICdTdmVsdGUgZXJyb3InO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBodHRwczovL3N2ZWx0ZS5kZXYvZS9oeWRyYXRhYmxlX21pc3NpbmdfYnV0X3JlcXVpcmVkYCk7XG5cdH1cbn1cblxuLyoqXG4gKiBGYWlsZWQgdG8gaHlkcmF0ZSB0aGUgYXBwbGljYXRpb25cbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGh5ZHJhdGlvbl9mYWlsZWQoKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgaHlkcmF0aW9uX2ZhaWxlZFxcbkZhaWxlZCB0byBoeWRyYXRlIHRoZSBhcHBsaWNhdGlvblxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL2h5ZHJhdGlvbl9mYWlsZWRgKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvaHlkcmF0aW9uX2ZhaWxlZGApO1xuXHR9XG59XG5cbi8qKlxuICogQ291bGQgbm90IGB7QHJlbmRlcn1gIHNuaXBwZXQgZHVlIHRvIHRoZSBleHByZXNzaW9uIGJlaW5nIGBudWxsYCBvciBgdW5kZWZpbmVkYC4gQ29uc2lkZXIgdXNpbmcgb3B0aW9uYWwgY2hhaW5pbmcgYHtAcmVuZGVyIHNuaXBwZXQ/LigpfWBcbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludmFsaWRfc25pcHBldCgpIHtcblx0aWYgKERFVikge1xuXHRcdGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBpbnZhbGlkX3NuaXBwZXRcXG5Db3VsZCBub3QgXFxge0ByZW5kZXJ9XFxgIHNuaXBwZXQgZHVlIHRvIHRoZSBleHByZXNzaW9uIGJlaW5nIFxcYG51bGxcXGAgb3IgXFxgdW5kZWZpbmVkXFxgLiBDb25zaWRlciB1c2luZyBvcHRpb25hbCBjaGFpbmluZyBcXGB7QHJlbmRlciBzbmlwcGV0Py4oKX1cXGBcXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9pbnZhbGlkX3NuaXBwZXRgKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvaW52YWxpZF9zbmlwcGV0YCk7XG5cdH1cbn1cblxuLyoqXG4gKiBgJW5hbWUlKC4uLilgIGNhbm5vdCBiZSB1c2VkIGluIHJ1bmVzIG1vZGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJucyB7bmV2ZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaWZlY3ljbGVfbGVnYWN5X29ubHkobmFtZSkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGxpZmVjeWNsZV9sZWdhY3lfb25seVxcblxcYCR7bmFtZX0oLi4uKVxcYCBjYW5ub3QgYmUgdXNlZCBpbiBydW5lcyBtb2RlXFxuaHR0cHM6Ly9zdmVsdGUuZGV2L2UvbGlmZWN5Y2xlX2xlZ2FjeV9vbmx5YCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL2xpZmVjeWNsZV9sZWdhY3lfb25seWApO1xuXHR9XG59XG5cbi8qKlxuICogQ2Fubm90IGRvIGBiaW5kOiVrZXklPXt1bmRlZmluZWR9YCB3aGVuIGAla2V5JWAgaGFzIGEgZmFsbGJhY2sgdmFsdWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3BzX2ludmFsaWRfdmFsdWUoa2V5KSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgcHJvcHNfaW52YWxpZF92YWx1ZVxcbkNhbm5vdCBkbyBcXGBiaW5kOiR7a2V5fT17dW5kZWZpbmVkfVxcYCB3aGVuIFxcYCR7a2V5fVxcYCBoYXMgYSBmYWxsYmFjayB2YWx1ZVxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL3Byb3BzX2ludmFsaWRfdmFsdWVgKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvcHJvcHNfaW52YWxpZF92YWx1ZWApO1xuXHR9XG59XG5cbi8qKlxuICogUmVzdCBlbGVtZW50IHByb3BlcnRpZXMgb2YgYCRwcm9wcygpYCBzdWNoIGFzIGAlcHJvcGVydHklYCBhcmUgcmVhZG9ubHlcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eVxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvcHNfcmVzdF9yZWFkb25seShwcm9wZXJ0eSkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYHByb3BzX3Jlc3RfcmVhZG9ubHlcXG5SZXN0IGVsZW1lbnQgcHJvcGVydGllcyBvZiBcXGAkcHJvcHMoKVxcYCBzdWNoIGFzIFxcYCR7cHJvcGVydHl9XFxgIGFyZSByZWFkb25seVxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL3Byb3BzX3Jlc3RfcmVhZG9ubHlgKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2UvcHJvcHNfcmVzdF9yZWFkb25seWApO1xuXHR9XG59XG5cbi8qKlxuICogVGhlIGAlcnVuZSVgIHJ1bmUgaXMgb25seSBhdmFpbGFibGUgaW5zaWRlIGAuc3ZlbHRlYCBhbmQgYC5zdmVsdGUuanMvdHNgIGZpbGVzXG4gKiBAcGFyYW0ge3N0cmluZ30gcnVuZVxuICogQHJldHVybnMge25ldmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcnVuZV9vdXRzaWRlX3N2ZWx0ZShydW5lKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgcnVuZV9vdXRzaWRlX3N2ZWx0ZVxcblRoZSBcXGAke3J1bmV9XFxgIHJ1bmUgaXMgb25seSBhdmFpbGFibGUgaW5zaWRlIFxcYC5zdmVsdGVcXGAgYW5kIFxcYC5zdmVsdGUuanMvdHNcXGAgZmlsZXNcXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9ydW5lX291dHNpZGVfc3ZlbHRlYCk7XG5cblx0XHRlcnJvci5uYW1lID0gJ1N2ZWx0ZSBlcnJvcic7XG5cblx0XHR0aHJvdyBlcnJvcjtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYGh0dHBzOi8vc3ZlbHRlLmRldi9lL3J1bmVfb3V0c2lkZV9zdmVsdGVgKTtcblx0fVxufVxuXG4vKipcbiAqIFByb3BlcnR5IGRlc2NyaXB0b3JzIGRlZmluZWQgb24gYCRzdGF0ZWAgb2JqZWN0cyBtdXN0IGNvbnRhaW4gYHZhbHVlYCBhbmQgYWx3YXlzIGJlIGBlbnVtZXJhYmxlYCwgYGNvbmZpZ3VyYWJsZWAgYW5kIGB3cml0YWJsZWAuXG4gKiBAcmV0dXJucyB7bmV2ZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGF0ZV9kZXNjcmlwdG9yc19maXhlZCgpIHtcblx0aWYgKERFVikge1xuXHRcdGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBzdGF0ZV9kZXNjcmlwdG9yc19maXhlZFxcblByb3BlcnR5IGRlc2NyaXB0b3JzIGRlZmluZWQgb24gXFxgJHN0YXRlXFxgIG9iamVjdHMgbXVzdCBjb250YWluIFxcYHZhbHVlXFxgIGFuZCBhbHdheXMgYmUgXFxgZW51bWVyYWJsZVxcYCwgXFxgY29uZmlndXJhYmxlXFxgIGFuZCBcXGB3cml0YWJsZVxcYC5cXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9zdGF0ZV9kZXNjcmlwdG9yc19maXhlZGApO1xuXG5cdFx0ZXJyb3IubmFtZSA9ICdTdmVsdGUgZXJyb3InO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBodHRwczovL3N2ZWx0ZS5kZXYvZS9zdGF0ZV9kZXNjcmlwdG9yc19maXhlZGApO1xuXHR9XG59XG5cbi8qKlxuICogQ2Fubm90IHNldCBwcm90b3R5cGUgb2YgYCRzdGF0ZWAgb2JqZWN0XG4gKiBAcmV0dXJucyB7bmV2ZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGF0ZV9wcm90b3R5cGVfZml4ZWQoKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgc3RhdGVfcHJvdG90eXBlX2ZpeGVkXFxuQ2Fubm90IHNldCBwcm90b3R5cGUgb2YgXFxgJHN0YXRlXFxgIG9iamVjdFxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL3N0YXRlX3Byb3RvdHlwZV9maXhlZGApO1xuXG5cdFx0ZXJyb3IubmFtZSA9ICdTdmVsdGUgZXJyb3InO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBodHRwczovL3N2ZWx0ZS5kZXYvZS9zdGF0ZV9wcm90b3R5cGVfZml4ZWRgKTtcblx0fVxufVxuXG4vKipcbiAqIFVwZGF0aW5nIHN0YXRlIGluc2lkZSBgJGRlcml2ZWQoLi4uKWAsIGAkaW5zcGVjdCguLi4pYCBvciBhIHRlbXBsYXRlIGV4cHJlc3Npb24gaXMgZm9yYmlkZGVuLiBJZiB0aGUgdmFsdWUgc2hvdWxkIG5vdCBiZSByZWFjdGl2ZSwgZGVjbGFyZSBpdCB3aXRob3V0IGAkc3RhdGVgXG4gKiBAcmV0dXJucyB7bmV2ZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGF0ZV91bnNhZmVfbXV0YXRpb24oKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgc3RhdGVfdW5zYWZlX211dGF0aW9uXFxuVXBkYXRpbmcgc3RhdGUgaW5zaWRlIFxcYCRkZXJpdmVkKC4uLilcXGAsIFxcYCRpbnNwZWN0KC4uLilcXGAgb3IgYSB0ZW1wbGF0ZSBleHByZXNzaW9uIGlzIGZvcmJpZGRlbi4gSWYgdGhlIHZhbHVlIHNob3VsZCBub3QgYmUgcmVhY3RpdmUsIGRlY2xhcmUgaXQgd2l0aG91dCBcXGAkc3RhdGVcXGBcXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9zdGF0ZV91bnNhZmVfbXV0YXRpb25gKTtcblxuXHRcdGVycm9yLm5hbWUgPSAnU3ZlbHRlIGVycm9yJztcblxuXHRcdHRocm93IGVycm9yO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcihgaHR0cHM6Ly9zdmVsdGUuZGV2L2Uvc3RhdGVfdW5zYWZlX211dGF0aW9uYCk7XG5cdH1cbn1cblxuLyoqXG4gKiBBIGA8c3ZlbHRlOmJvdW5kYXJ5PmAgYHJlc2V0YCBmdW5jdGlvbiBjYW5ub3QgYmUgY2FsbGVkIHdoaWxlIGFuIGVycm9yIGlzIHN0aWxsIGJlaW5nIGhhbmRsZWRcbiAqIEByZXR1cm5zIHtuZXZlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN2ZWx0ZV9ib3VuZGFyeV9yZXNldF9vbmVycm9yKCkge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYHN2ZWx0ZV9ib3VuZGFyeV9yZXNldF9vbmVycm9yXFxuQSBcXGA8c3ZlbHRlOmJvdW5kYXJ5PlxcYCBcXGByZXNldFxcYCBmdW5jdGlvbiBjYW5ub3QgYmUgY2FsbGVkIHdoaWxlIGFuIGVycm9yIGlzIHN0aWxsIGJlaW5nIGhhbmRsZWRcXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9zdmVsdGVfYm91bmRhcnlfcmVzZXRfb25lcnJvcmApO1xuXG5cdFx0ZXJyb3IubmFtZSA9ICdTdmVsdGUgZXJyb3InO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBodHRwczovL3N2ZWx0ZS5kZXYvZS9zdmVsdGVfYm91bmRhcnlfcmVzZXRfb25lcnJvcmApO1xuXHR9XG59IiwiLyogVGhpcyBmaWxlIGlzIGdlbmVyYXRlZCBieSBzY3JpcHRzL3Byb2Nlc3MtbWVzc2FnZXMvaW5kZXguanMuIERvIG5vdCBlZGl0ISAqL1xuXG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcblxudmFyIGJvbGQgPSAnZm9udC13ZWlnaHQ6IGJvbGQnO1xudmFyIG5vcm1hbCA9ICdmb250LXdlaWdodDogbm9ybWFsJztcblxuLyoqXG4gKiBgPHN2ZWx0ZTplbGVtZW50IHRoaXM9XCIldGFnJVwiPmAgaXMgYSB2b2lkIGVsZW1lbnQg4oCUIGl0IGNhbm5vdCBoYXZlIGNvbnRlbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGR5bmFtaWNfdm9pZF9lbGVtZW50X2NvbnRlbnQodGFnKSB7XG5cdGlmIChERVYpIHtcblx0XHRjb25zb2xlLndhcm4oYCVjW3N2ZWx0ZV0gZHluYW1pY192b2lkX2VsZW1lbnRfY29udGVudFxcbiVjXFxgPHN2ZWx0ZTplbGVtZW50IHRoaXM9XCIke3RhZ31cIj5cXGAgaXMgYSB2b2lkIGVsZW1lbnQg4oCUIGl0IGNhbm5vdCBoYXZlIGNvbnRlbnRcXG5odHRwczovL3N2ZWx0ZS5kZXYvZS9keW5hbWljX3ZvaWRfZWxlbWVudF9jb250ZW50YCwgYm9sZCwgbm9ybWFsKTtcblx0fSBlbHNlIHtcblx0XHRjb25zb2xlLndhcm4oYGh0dHBzOi8vc3ZlbHRlLmRldi9lL2R5bmFtaWNfdm9pZF9lbGVtZW50X2NvbnRlbnRgKTtcblx0fVxufVxuXG4vKipcbiAqIFRoZSBmb2xsb3dpbmcgcHJvcGVydGllcyBjYW5ub3QgYmUgY2xvbmVkIHdpdGggYCRzdGF0ZS5zbmFwc2hvdGAg4oCUIHRoZSByZXR1cm4gdmFsdWUgY29udGFpbnMgdGhlIG9yaWdpbmFsczpcbiAqIFxuICogJXByb3BlcnRpZXMlXG4gKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZCB8IG51bGx9IFtwcm9wZXJ0aWVzXVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RhdGVfc25hcHNob3RfdW5jbG9uZWFibGUocHJvcGVydGllcykge1xuXHRpZiAoREVWKSB7XG5cdFx0Y29uc29sZS53YXJuKFxuXHRcdFx0YCVjW3N2ZWx0ZV0gc3RhdGVfc25hcHNob3RfdW5jbG9uZWFibGVcXG4lYyR7cHJvcGVydGllc1xuXHRcdFx0XHQ/IGBUaGUgZm9sbG93aW5nIHByb3BlcnRpZXMgY2Fubm90IGJlIGNsb25lZCB3aXRoIFxcYCRzdGF0ZS5zbmFwc2hvdFxcYCDigJQgdGhlIHJldHVybiB2YWx1ZSBjb250YWlucyB0aGUgb3JpZ2luYWxzOlxuXG4ke3Byb3BlcnRpZXN9YFxuXHRcdFx0XHQ6ICdWYWx1ZSBjYW5ub3QgYmUgY2xvbmVkIHdpdGggYCRzdGF0ZS5zbmFwc2hvdGAg4oCUIHRoZSBvcmlnaW5hbCB2YWx1ZSB3YXMgcmV0dXJuZWQnfVxcbmh0dHBzOi8vc3ZlbHRlLmRldi9lL3N0YXRlX3NuYXBzaG90X3VuY2xvbmVhYmxlYCxcblx0XHRcdGJvbGQsXG5cdFx0XHRub3JtYWxcblx0XHQpO1xuXHR9IGVsc2Uge1xuXHRcdGNvbnNvbGUud2FybihgaHR0cHM6Ly9zdmVsdGUuZGV2L2Uvc3RhdGVfc25hcHNob3RfdW5jbG9uZWFibGVgKTtcblx0fVxufSIsIi8qKiBAaW1wb3J0IHsgU25hcHNob3QgfSBmcm9tICcuL3R5cGVzJyAqL1xuaW1wb3J0IHsgREVWIH0gZnJvbSAnZXNtLWVudic7XG5pbXBvcnQgKiBhcyB3IGZyb20gJy4vd2FybmluZ3MuanMnO1xuaW1wb3J0IHsgZ2V0X3Byb3RvdHlwZV9vZiwgaXNfYXJyYXksIG9iamVjdF9wcm90b3R5cGUgfSBmcm9tICcuL3V0aWxzLmpzJztcblxuLyoqXG4gKiBJbiBkZXYsIHdlIGtlZXAgdHJhY2sgb2Ygd2hpY2ggcHJvcGVydGllcyBjb3VsZCBub3QgYmUgY2xvbmVkLiBJbiBwcm9kXG4gKiB3ZSBkb24ndCBib3RoZXIsIGJ1dCB3ZSBrZWVwIGEgZHVtbXkgYXJyYXkgYXJvdW5kIHNvIHRoYXQgdGhlXG4gKiBzaWduYXR1cmUgc3RheXMgdGhlIHNhbWVcbiAqIEB0eXBlIHtzdHJpbmdbXX1cbiAqL1xuY29uc3QgZW1wdHkgPSBbXTtcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfSB2YWx1ZVxuICogQHBhcmFtIHtib29sZWFufSBbc2tpcF93YXJuaW5nXVxuICogQHBhcmFtIHtib29sZWFufSBbbm9fdG9qc29uXVxuICogQHJldHVybnMge1NuYXBzaG90PFQ+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gc25hcHNob3QodmFsdWUsIHNraXBfd2FybmluZyA9IGZhbHNlLCBub190b2pzb24gPSBmYWxzZSkge1xuXHRpZiAoREVWICYmICFza2lwX3dhcm5pbmcpIHtcblx0XHQvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuXHRcdGNvbnN0IHBhdGhzID0gW107XG5cblx0XHRjb25zdCBjb3B5ID0gY2xvbmUodmFsdWUsIG5ldyBNYXAoKSwgJycsIHBhdGhzLCBudWxsLCBub190b2pzb24pO1xuXHRcdGlmIChwYXRocy5sZW5ndGggPT09IDEgJiYgcGF0aHNbMF0gPT09ICcnKSB7XG5cdFx0XHQvLyB2YWx1ZSBjb3VsZCBub3QgYmUgY2xvbmVkXG5cdFx0XHR3LnN0YXRlX3NuYXBzaG90X3VuY2xvbmVhYmxlKCk7XG5cdFx0fSBlbHNlIGlmIChwYXRocy5sZW5ndGggPiAwKSB7XG5cdFx0XHQvLyBzb21lIHByb3BlcnRpZXMgY291bGQgbm90IGJlIGNsb25lZFxuXHRcdFx0Y29uc3Qgc2xpY2UgPSBwYXRocy5sZW5ndGggPiAxMCA/IHBhdGhzLnNsaWNlKDAsIDcpIDogcGF0aHMuc2xpY2UoMCwgMTApO1xuXHRcdFx0Y29uc3QgZXhjZXNzID0gcGF0aHMubGVuZ3RoIC0gc2xpY2UubGVuZ3RoO1xuXG5cdFx0XHRsZXQgdW5jbG9uZWQgPSBzbGljZS5tYXAoKHBhdGgpID0+IGAtIDx2YWx1ZT4ke3BhdGh9YCkuam9pbignXFxuJyk7XG5cdFx0XHRpZiAoZXhjZXNzID4gMCkgdW5jbG9uZWQgKz0gYFxcbi0gLi4uYW5kICR7ZXhjZXNzfSBtb3JlYDtcblxuXHRcdFx0dy5zdGF0ZV9zbmFwc2hvdF91bmNsb25lYWJsZSh1bmNsb25lZCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvcHk7XG5cdH1cblxuXHRyZXR1cm4gY2xvbmUodmFsdWUsIG5ldyBNYXAoKSwgJycsIGVtcHR5LCBudWxsLCBub190b2pzb24pO1xufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1R9IHZhbHVlXG4gKiBAcGFyYW0ge01hcDxULCBTbmFwc2hvdDxUPj59IGNsb25lZFxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAqIEBwYXJhbSB7c3RyaW5nW119IHBhdGhzXG4gKiBAcGFyYW0ge251bGwgfCBUfSBbb3JpZ2luYWxdIFRoZSBvcmlnaW5hbCB2YWx1ZSwgaWYgYHZhbHVlYCB3YXMgcHJvZHVjZWQgZnJvbSBhIGB0b0pTT05gIGNhbGxcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vX3RvanNvbl1cbiAqIEByZXR1cm5zIHtTbmFwc2hvdDxUPn1cbiAqL1xuZnVuY3Rpb24gY2xvbmUodmFsdWUsIGNsb25lZCwgcGF0aCwgcGF0aHMsIG9yaWdpbmFsID0gbnVsbCwgbm9fdG9qc29uID0gZmFsc2UpIHtcblx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcblx0XHR2YXIgdW53cmFwcGVkID0gY2xvbmVkLmdldCh2YWx1ZSk7XG5cdFx0aWYgKHVud3JhcHBlZCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdW53cmFwcGVkO1xuXG5cdFx0aWYgKHZhbHVlIGluc3RhbmNlb2YgTWFwKSByZXR1cm4gLyoqIEB0eXBlIHtTbmFwc2hvdDxUPn0gKi8gKG5ldyBNYXAodmFsdWUpKTtcblx0XHRpZiAodmFsdWUgaW5zdGFuY2VvZiBTZXQpIHJldHVybiAvKiogQHR5cGUge1NuYXBzaG90PFQ+fSAqLyAobmV3IFNldCh2YWx1ZSkpO1xuXG5cdFx0aWYgKGlzX2FycmF5KHZhbHVlKSkge1xuXHRcdFx0dmFyIGNvcHkgPSAvKiogQHR5cGUge1NuYXBzaG90PGFueT59ICovIChBcnJheSh2YWx1ZS5sZW5ndGgpKTtcblx0XHRcdGNsb25lZC5zZXQodmFsdWUsIGNvcHkpO1xuXG5cdFx0XHRpZiAob3JpZ2luYWwgIT09IG51bGwpIHtcblx0XHRcdFx0Y2xvbmVkLnNldChvcmlnaW5hbCwgY29weSk7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0dmFyIGVsZW1lbnQgPSB2YWx1ZVtpXTtcblx0XHRcdFx0aWYgKGkgaW4gdmFsdWUpIHtcblx0XHRcdFx0XHRjb3B5W2ldID0gY2xvbmUoZWxlbWVudCwgY2xvbmVkLCBERVYgPyBgJHtwYXRofVske2l9XWAgOiBwYXRoLCBwYXRocywgbnVsbCwgbm9fdG9qc29uKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gY29weTtcblx0XHR9XG5cblx0XHRpZiAoZ2V0X3Byb3RvdHlwZV9vZih2YWx1ZSkgPT09IG9iamVjdF9wcm90b3R5cGUpIHtcblx0XHRcdC8qKiBAdHlwZSB7U25hcHNob3Q8YW55Pn0gKi9cblx0XHRcdGNvcHkgPSB7fTtcblx0XHRcdGNsb25lZC5zZXQodmFsdWUsIGNvcHkpO1xuXG5cdFx0XHRpZiAob3JpZ2luYWwgIT09IG51bGwpIHtcblx0XHRcdFx0Y2xvbmVkLnNldChvcmlnaW5hbCwgY29weSk7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAodmFyIGtleSBvZiBPYmplY3Qua2V5cyh2YWx1ZSkpIHtcblx0XHRcdFx0Y29weVtrZXldID0gY2xvbmUoXG5cdFx0XHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRcdFx0XHRcdHZhbHVlW2tleV0sXG5cdFx0XHRcdFx0Y2xvbmVkLFxuXHRcdFx0XHRcdERFViA/IGAke3BhdGh9LiR7a2V5fWAgOiBwYXRoLFxuXHRcdFx0XHRcdHBhdGhzLFxuXHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdFx0bm9fdG9qc29uXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBjb3B5O1xuXHRcdH1cblxuXHRcdGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcblx0XHRcdC8vIEVuc3VyZSBTdmVsdGVEYXRlIHNuYXBzaG90cyBhcmUgdHJhY2tlZFxuXHRcdFx0dmFsdWUuZ2V0VGltZSgpO1xuXHRcdFx0cmV0dXJuIC8qKiBAdHlwZSB7U25hcHNob3Q8VD59ICovIChzdHJ1Y3R1cmVkQ2xvbmUodmFsdWUpKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mICgvKiogQHR5cGUge1QgJiB7IHRvSlNPTj86IGFueSB9IH0gKi8gKHZhbHVlKS50b0pTT04pID09PSAnZnVuY3Rpb24nICYmICFub190b2pzb24pIHtcblx0XHRcdHJldHVybiBjbG9uZShcblx0XHRcdFx0LyoqIEB0eXBlIHtUICYgeyB0b0pTT04oKTogYW55IH0gfSAqLyAodmFsdWUpLnRvSlNPTigpLFxuXHRcdFx0XHRjbG9uZWQsXG5cdFx0XHRcdERFViA/IGAke3BhdGh9LnRvSlNPTigpYCA6IHBhdGgsXG5cdFx0XHRcdHBhdGhzLFxuXHRcdFx0XHQvLyBBc3NvY2lhdGUgdGhlIGluc3RhbmNlIHdpdGggdGhlIHRvSlNPTiBjbG9uZVxuXHRcdFx0XHR2YWx1ZVxuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRpZiAodmFsdWUgaW5zdGFuY2VvZiBFdmVudFRhcmdldCkge1xuXHRcdC8vIGNhbid0IGJlIGNsb25lZFxuXHRcdHJldHVybiAvKiogQHR5cGUge1NuYXBzaG90PFQ+fSAqLyAodmFsdWUpO1xuXHR9XG5cblx0dHJ5IHtcblx0XHRyZXR1cm4gLyoqIEB0eXBlIHtTbmFwc2hvdDxUPn0gKi8gKHN0cnVjdHVyZWRDbG9uZSh2YWx1ZSkpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKERFVikge1xuXHRcdFx0cGF0aHMucHVzaChwYXRoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gLyoqIEB0eXBlIHtTbmFwc2hvdDxUPn0gKi8gKHZhbHVlKTtcblx0fVxufVxuIiwiLyoqIEBpbXBvcnQgeyBEZXJpdmVkLCBSZWFjdGlvbiwgVmFsdWUgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgVU5JTklUSUFMSVpFRCB9IGZyb20gJy4uLy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBzbmFwc2hvdCB9IGZyb20gJy4uLy4uL3NoYXJlZC9jbG9uZS5qcyc7XG5pbXBvcnQgeyBERVJJVkVELCBBU1lOQywgUFJPWFlfUEFUSF9TWU1CT0wsIFNUQVRFX1NZTUJPTCB9IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcbmltcG9ydCB7IGVmZmVjdF90cmFja2luZyB9IGZyb20gJy4uL3JlYWN0aXZpdHkvZWZmZWN0cy5qcyc7XG5pbXBvcnQgeyBhY3RpdmVfcmVhY3Rpb24sIHVudHJhY2sgfSBmcm9tICcuLi9ydW50aW1lLmpzJztcblxuLyoqXG4gKiBAdHlwZWRlZiB7e1xuICogICB0cmFjZXM6IEVycm9yW107XG4gKiB9fSBUcmFjZUVudHJ5XG4gKi9cblxuLyoqIEB0eXBlIHt7IHJlYWN0aW9uOiBSZWFjdGlvbiB8IG51bGwsIGVudHJpZXM6IE1hcDxWYWx1ZSwgVHJhY2VFbnRyeT4gfSB8IG51bGx9ICovXG5leHBvcnQgbGV0IHRyYWNpbmdfZXhwcmVzc2lvbnMgPSBudWxsO1xuXG4vKipcbiAqIEBwYXJhbSB7VmFsdWV9IHNpZ25hbFxuICogQHBhcmFtIHtUcmFjZUVudHJ5fSBbZW50cnldXG4gKi9cbmZ1bmN0aW9uIGxvZ19lbnRyeShzaWduYWwsIGVudHJ5KSB7XG5cdGNvbnN0IHZhbHVlID0gc2lnbmFsLnY7XG5cblx0aWYgKHZhbHVlID09PSBVTklOSVRJQUxJWkVEKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgdHlwZSA9IGdldF90eXBlKHNpZ25hbCk7XG5cdGNvbnN0IGN1cnJlbnRfcmVhY3Rpb24gPSAvKiogQHR5cGUge1JlYWN0aW9ufSAqLyAoYWN0aXZlX3JlYWN0aW9uKTtcblx0Y29uc3QgZGlydHkgPSBzaWduYWwud3YgPiBjdXJyZW50X3JlYWN0aW9uLnd2IHx8IGN1cnJlbnRfcmVhY3Rpb24ud3YgPT09IDA7XG5cdGNvbnN0IHN0eWxlID0gZGlydHlcblx0XHQ/ICdjb2xvcjogQ29ybmZsb3dlckJsdWU7IGZvbnQtd2VpZ2h0OiBib2xkJ1xuXHRcdDogJ2NvbG9yOiBncmV5OyBmb250LXdlaWdodDogbm9ybWFsJztcblxuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRjb25zb2xlLmdyb3VwQ29sbGFwc2VkKFxuXHRcdHNpZ25hbC5sYWJlbCA/IGAlYyR7dHlwZX0lYyAke3NpZ25hbC5sYWJlbH1gIDogYCVjJHt0eXBlfSVjYCxcblx0XHRzdHlsZSxcblx0XHRkaXJ0eSA/ICdmb250LXdlaWdodDogbm9ybWFsJyA6IHN0eWxlLFxuXHRcdHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgU1RBVEVfU1lNQk9MIGluIHZhbHVlXG5cdFx0XHQ/IHNuYXBzaG90KHZhbHVlLCB0cnVlKVxuXHRcdFx0OiB2YWx1ZVxuXHQpO1xuXG5cdGlmICh0eXBlID09PSAnJGRlcml2ZWQnKSB7XG5cdFx0Y29uc3QgZGVwcyA9IG5ldyBTZXQoLyoqIEB0eXBlIHtEZXJpdmVkfSAqLyAoc2lnbmFsKS5kZXBzKTtcblx0XHRmb3IgKGNvbnN0IGRlcCBvZiBkZXBzKSB7XG5cdFx0XHRsb2dfZW50cnkoZGVwKTtcblx0XHR9XG5cdH1cblxuXHRpZiAoc2lnbmFsLmNyZWF0ZWQpIHtcblx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdGNvbnNvbGUubG9nKHNpZ25hbC5jcmVhdGVkKTtcblx0fVxuXG5cdGlmIChkaXJ0eSAmJiBzaWduYWwudXBkYXRlZCkge1xuXHRcdGZvciAoY29uc3QgdXBkYXRlZCBvZiBzaWduYWwudXBkYXRlZC52YWx1ZXMoKSkge1xuXHRcdFx0aWYgKHVwZGF0ZWQuZXJyb3IpIHtcblx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRcdFx0Y29uc29sZS5sb2codXBkYXRlZC5lcnJvcik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aWYgKGVudHJ5KSB7XG5cdFx0Zm9yICh2YXIgdHJhY2Ugb2YgZW50cnkudHJhY2VzKSB7XG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdFx0Y29uc29sZS5sb2codHJhY2UpO1xuXHRcdH1cblx0fVxuXG5cdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdGNvbnNvbGUuZ3JvdXBFbmQoKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1ZhbHVlfSBzaWduYWxcbiAqIEByZXR1cm5zIHsnJHN0YXRlJyB8ICckZGVyaXZlZCcgfCAnc3RvcmUnfVxuICovXG5mdW5jdGlvbiBnZXRfdHlwZShzaWduYWwpIHtcblx0aWYgKChzaWduYWwuZiAmIChERVJJVkVEIHwgQVNZTkMpKSAhPT0gMCkgcmV0dXJuICckZGVyaXZlZCc7XG5cdHJldHVybiBzaWduYWwubGFiZWw/LnN0YXJ0c1dpdGgoJyQnKSA/ICdzdG9yZScgOiAnJHN0YXRlJztcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHsoKSA9PiBzdHJpbmd9IGxhYmVsXG4gKiBAcGFyYW0geygpID0+IFR9IGZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFjZShsYWJlbCwgZm4pIHtcblx0dmFyIHByZXZpb3VzbHlfdHJhY2luZ19leHByZXNzaW9ucyA9IHRyYWNpbmdfZXhwcmVzc2lvbnM7XG5cblx0dHJ5IHtcblx0XHR0cmFjaW5nX2V4cHJlc3Npb25zID0geyBlbnRyaWVzOiBuZXcgTWFwKCksIHJlYWN0aW9uOiBhY3RpdmVfcmVhY3Rpb24gfTtcblxuXHRcdHZhciBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdHZhciB2YWx1ZSA9IGZuKCk7XG5cdFx0dmFyIHRpbWUgPSAocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkudG9GaXhlZCgyKTtcblxuXHRcdHZhciBwcmVmaXggPSB1bnRyYWNrKGxhYmVsKTtcblxuXHRcdGlmICghZWZmZWN0X3RyYWNraW5nKCkpIHtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0XHRjb25zb2xlLmxvZyhgJHtwcmVmaXh9ICVjcmFuIG91dHNpZGUgb2YgYW4gZWZmZWN0ICgke3RpbWV9bXMpYCwgJ2NvbG9yOiBncmV5Jyk7XG5cdFx0fSBlbHNlIGlmICh0cmFjaW5nX2V4cHJlc3Npb25zLmVudHJpZXMuc2l6ZSA9PT0gMCkge1xuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRcdGNvbnNvbGUubG9nKGAke3ByZWZpeH0gJWNubyByZWFjdGl2ZSBkZXBlbmRlbmNpZXMgKCR7dGltZX1tcylgLCAnY29sb3I6IGdyZXknKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRcdGNvbnNvbGUuZ3JvdXAoYCR7cHJlZml4fSAlYygke3RpbWV9bXMpYCwgJ2NvbG9yOiBncmV5Jyk7XG5cblx0XHRcdHZhciBlbnRyaWVzID0gdHJhY2luZ19leHByZXNzaW9ucy5lbnRyaWVzO1xuXG5cdFx0XHR1bnRyYWNrKCgpID0+IHtcblx0XHRcdFx0Zm9yIChjb25zdCBbc2lnbmFsLCB0cmFjZXNdIG9mIGVudHJpZXMpIHtcblx0XHRcdFx0XHRsb2dfZW50cnkoc2lnbmFsLCB0cmFjZXMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0dHJhY2luZ19leHByZXNzaW9ucyA9IG51bGw7XG5cblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0XHRjb25zb2xlLmdyb3VwRW5kKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHZhbHVlO1xuXHR9IGZpbmFsbHkge1xuXHRcdHRyYWNpbmdfZXhwcmVzc2lvbnMgPSBwcmV2aW91c2x5X3RyYWNpbmdfZXhwcmVzc2lvbnM7XG5cdH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUge1ZhbHVlfSBUXG4gKiBAcGFyYW0ge1R9IHNvdXJjZVxuICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsXG4gKiBAcmV0dXJucyB7VH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRhZyhzb3VyY2UsIGxhYmVsKSB7XG5cdHNvdXJjZS5sYWJlbCA9IGxhYmVsO1xuXHR0YWdfcHJveHkoc291cmNlLnYsIGxhYmVsKTtcblxuXHRyZXR1cm4gc291cmNlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYWJlbFxuICovXG5leHBvcnQgZnVuY3Rpb24gdGFnX3Byb3h5KHZhbHVlLCBsYWJlbCkge1xuXHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdHZhbHVlPy5bUFJPWFlfUEFUSF9TWU1CT0xdPy4obGFiZWwpO1xuXHRyZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbGFiZWwodmFsdWUpIHtcblx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N5bWJvbCcpIHJldHVybiBgU3ltYm9sKCR7dmFsdWUuZGVzY3JpcHRpb259KWA7XG5cdGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHJldHVybiAnPGZ1bmN0aW9uPic7XG5cdGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlKSByZXR1cm4gJzxvYmplY3Q+Jztcblx0cmV0dXJuIFN0cmluZyh2YWx1ZSk7XG59XG4iLCJpbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7IGRlZmluZV9wcm9wZXJ0eSB9IGZyb20gJy4vdXRpbHMuanMnO1xuaW1wb3J0ICogYXMgZSBmcm9tICcuL2Vycm9ycy5qcyc7XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsXG4gKiBAcmV0dXJucyB7RXJyb3IgJiB7IHN0YWNrOiBzdHJpbmcgfSB8IG51bGx9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRfZXJyb3IobGFiZWwpIHtcblx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoKTtcblx0Y29uc3Qgc3RhY2sgPSBnZXRfc3RhY2soKTtcblxuXHRpZiAoc3RhY2subGVuZ3RoID09PSAwKSB7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHRzdGFjay51bnNoaWZ0KCdcXG4nKTtcblxuXHRkZWZpbmVfcHJvcGVydHkoZXJyb3IsICdzdGFjaycsIHtcblx0XHR2YWx1ZTogc3RhY2suam9pbignXFxuJylcblx0fSk7XG5cblx0ZGVmaW5lX3Byb3BlcnR5KGVycm9yLCAnbmFtZScsIHtcblx0XHR2YWx1ZTogbGFiZWxcblx0fSk7XG5cblx0cmV0dXJuIC8qKiBAdHlwZSB7RXJyb3IgJiB7IHN0YWNrOiBzdHJpbmcgfX0gKi8gKGVycm9yKTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7c3RyaW5nW119XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRfc3RhY2soKSB7XG5cdC8vIEB0cy1pZ25vcmUgLSBkb2Vzbid0IGV4aXN0IGV2ZXJ5d2hlcmVcblx0Y29uc3QgbGltaXQgPSBFcnJvci5zdGFja1RyYWNlTGltaXQ7XG5cdC8vIEB0cy1pZ25vcmUgLSBkb2Vzbid0IGV4aXN0IGV2ZXJ5d2hlcmVcblx0RXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID0gSW5maW5pdHk7XG5cdGNvbnN0IHN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2s7XG5cdC8vIEB0cy1pZ25vcmUgLSBkb2Vzbid0IGV4aXN0IGV2ZXJ5d2hlcmVcblx0RXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID0gbGltaXQ7XG5cblx0aWYgKCFzdGFjaykgcmV0dXJuIFtdO1xuXG5cdGNvbnN0IGxpbmVzID0gc3RhY2suc3BsaXQoJ1xcbicpO1xuXHRjb25zdCBuZXdfbGluZXMgPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y29uc3QgbGluZSA9IGxpbmVzW2ldO1xuXHRcdGNvbnN0IHBvc2l4aWZpZWQgPSBsaW5lLnJlcGxhY2VBbGwoJ1xcXFwnLCAnLycpO1xuXG5cdFx0aWYgKGxpbmUudHJpbSgpID09PSAnRXJyb3InKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiAobGluZS5pbmNsdWRlcygndmFsaWRhdGVfZWFjaF9rZXlzJykpIHtcblx0XHRcdHJldHVybiBbXTtcblx0XHR9XG5cblx0XHRpZiAocG9zaXhpZmllZC5pbmNsdWRlcygnc3ZlbHRlL3NyYy9pbnRlcm5hbCcpIHx8IHBvc2l4aWZpZWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy8udml0ZScpKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRuZXdfbGluZXMucHVzaChsaW5lKTtcblx0fVxuXG5cdHJldHVybiBuZXdfbGluZXM7XG59XG5cbi8qKlxuICogQHBhcmFtIHtib29sZWFufSBjb25kaXRpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZhcmlhbnQoY29uZGl0aW9uLCBtZXNzYWdlKSB7XG5cdGlmICghREVWKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdpbnZhcmlhbnQoLi4uKSB3YXMgbm90IGd1YXJkZWQgYnkgaWYgKERFViknKTtcblx0fVxuXG5cdGlmICghY29uZGl0aW9uKSBlLmludmFyaWFudF92aW9sYXRpb24obWVzc2FnZSk7XG59XG4iLCJpbXBvcnQgeyBsaWZlY3ljbGVfb3V0c2lkZV9jb21wb25lbnQsIG1pc3NpbmdfY29udGV4dCB9IGZyb20gJy4vZXJyb3JzLmpzJztcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHsoa2V5OiBvYmplY3QpID0+IFR9IGdldF9jb250ZXh0XG4gKiBAcGFyYW0geyhrZXk6IG9iamVjdCwgY29udGV4dDogVCkgPT4gVH0gc2V0X2NvbnRleHRcbiAqIEBwYXJhbSB7KGtleTogb2JqZWN0KSA9PiBib29sZWFufSBoYXNfY29udGV4dFxuICogQHJldHVybnMge1soKSA9PiBULCAoY29udGV4dDogVCkgPT4gVCwgKCkgPT4gYm9vbGVhbl19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVfY29udGV4dChnZXRfY29udGV4dCwgc2V0X2NvbnRleHQsIGhhc19jb250ZXh0KSB7XG5cdGNvbnN0IGtleSA9IHt9O1xuXG5cdHJldHVybiBbXG5cdFx0KCkgPT4ge1xuXHRcdFx0aWYgKCFoYXNfY29udGV4dChrZXkpKSB7XG5cdFx0XHRcdG1pc3NpbmdfY29udGV4dCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZ2V0X2NvbnRleHQoa2V5KTtcblx0XHR9LFxuXHRcdChjb250ZXh0KSA9PiBzZXRfY29udGV4dChrZXksIGNvbnRleHQpLFxuXHRcdCgpID0+IGhhc19jb250ZXh0KGtleSlcblx0XTtcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7eyBwOiBDb250ZXh0IHwgbnVsbCwgYzogTWFwPHVua25vd24sIHVua25vd24+IHwgbnVsbCB9fSBDb250ZXh0XG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge0NvbnRleHR9IGNvbnRleHRcbiAqIEByZXR1cm5zIHtNYXA8dW5rbm93biwgdW5rbm93bj4gfCBudWxsfVxuICovXG5mdW5jdGlvbiBnZXRfcGFyZW50X2NvbnRleHQoY29udGV4dCkge1xuXHRsZXQgcGFyZW50ID0gY29udGV4dC5wO1xuXHR3aGlsZSAocGFyZW50ICE9PSBudWxsICYmIHBhcmVudC5jID09PSBudWxsKSB7XG5cdFx0cGFyZW50ID0gcGFyZW50LnA7XG5cdH1cblx0cmV0dXJuIHBhcmVudD8uYyA/PyBudWxsO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7Q29udGV4dCB8IG51bGx9IGNvbnRleHRcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJucyB7TWFwPHVua25vd24sIHVua25vd24+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0X29yX2luaXRfY29udGV4dF9tYXAoY29udGV4dCwgbmFtZSkge1xuXHRpZiAoY29udGV4dCA9PT0gbnVsbCkge1xuXHRcdGxpZmVjeWNsZV9vdXRzaWRlX2NvbXBvbmVudChuYW1lKTtcblx0fVxuXG5cdHJldHVybiAoY29udGV4dC5jID8/PSBuZXcgTWFwKGdldF9wYXJlbnRfY29udGV4dChjb250ZXh0KSB8fCB1bmRlZmluZWQpKTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgQ29tcG9uZW50Q29udGV4dCwgRGV2U3RhY2tFbnRyeSwgRWZmZWN0IH0gZnJvbSAnI2NsaWVudCcgKi9cbmltcG9ydCB7IERFViB9IGZyb20gJ2VzbS1lbnYnO1xuaW1wb3J0ICogYXMgZSBmcm9tICcuL2Vycm9ycy5qcyc7XG5pbXBvcnQgeyBhY3RpdmVfZWZmZWN0LCBhY3RpdmVfcmVhY3Rpb24gfSBmcm9tICcuL3J1bnRpbWUuanMnO1xuaW1wb3J0IHsgY3JlYXRlX3VzZXJfZWZmZWN0IH0gZnJvbSAnLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgYXN5bmNfbW9kZV9mbGFnLCBsZWdhY3lfbW9kZV9mbGFnIH0gZnJvbSAnLi4vZmxhZ3MvaW5kZXguanMnO1xuaW1wb3J0IHsgRklMRU5BTUUgfSBmcm9tICcuLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgQlJBTkNIX0VGRkVDVCwgQ09NUE9ORU5UX1NZTUJPTCB9IGZyb20gJy4vY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IGRlZmluZV9wcm9wZXJ0eSB9IGZyb20gJy4uL3NoYXJlZC91dGlscy5qcyc7XG5pbXBvcnQgeyBjcmVhdGVfY29udGV4dCwgZ2V0X29yX2luaXRfY29udGV4dF9tYXAgfSBmcm9tICcuLi9zaGFyZWQvY29udGV4dC5qcyc7XG5cbi8qKiBAdHlwZSB7Q29tcG9uZW50Q29udGV4dCB8IG51bGx9ICovXG5leHBvcnQgbGV0IGNvbXBvbmVudF9jb250ZXh0ID0gbnVsbDtcblxuLyoqIEBwYXJhbSB7Q29tcG9uZW50Q29udGV4dCB8IG51bGx9IGNvbnRleHQgKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRfY29tcG9uZW50X2NvbnRleHQoY29udGV4dCkge1xuXHRjb21wb25lbnRfY29udGV4dCA9IGNvbnRleHQ7XG59XG5cbi8qKiBAdHlwZSB7RGV2U3RhY2tFbnRyeSB8IG51bGx9ICovXG5leHBvcnQgbGV0IGRldl9zdGFjayA9IG51bGw7XG5cbi8qKiBAcGFyYW0ge0RldlN0YWNrRW50cnkgfCBudWxsfSBzdGFjayAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldF9kZXZfc3RhY2soc3RhY2spIHtcblx0ZGV2X3N0YWNrID0gc3RhY2s7XG59XG5cbi8qKlxuICogRXhlY3V0ZSBhIGNhbGxiYWNrIHdpdGggYSBuZXcgZGV2IHN0YWNrIGVudHJ5XG4gKiBAcGFyYW0geygpID0+IGFueX0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBleGVjdXRlXG4gKiBAcGFyYW0ge0RldlN0YWNrRW50cnlbJ3R5cGUnXX0gdHlwZSAtIFR5cGUgb2YgYmxvY2svY29tcG9uZW50XG4gKiBAcGFyYW0ge2FueX0gY29tcG9uZW50IC0gQ29tcG9uZW50IGZ1bmN0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gbGluZSAtIExpbmUgbnVtYmVyXG4gKiBAcGFyYW0ge251bWJlcn0gY29sdW1uIC0gQ29sdW1uIG51bWJlclxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbYWRkaXRpb25hbF0gLSBBbnkgYWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRvIGFkZCB0byB0aGUgZGV2IHN0YWNrIGVudHJ5XG4gKiBAcmV0dXJucyB7YW55fVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkX3N2ZWx0ZV9tZXRhKGNhbGxiYWNrLCB0eXBlLCBjb21wb25lbnQsIGxpbmUsIGNvbHVtbiwgYWRkaXRpb25hbCkge1xuXHRjb25zdCBwYXJlbnQgPSBkZXZfc3RhY2s7XG5cblx0ZGV2X3N0YWNrID0ge1xuXHRcdHR5cGUsXG5cdFx0ZmlsZTogY29tcG9uZW50W0ZJTEVOQU1FXSxcblx0XHRsaW5lLFxuXHRcdGNvbHVtbixcblx0XHRwYXJlbnQsXG5cdFx0Li4uYWRkaXRpb25hbFxuXHR9O1xuXG5cdHRyeSB7XG5cdFx0cmV0dXJuIGNhbGxiYWNrKCk7XG5cdH0gZmluYWxseSB7XG5cdFx0ZGV2X3N0YWNrID0gcGFyZW50O1xuXHR9XG59XG5cbi8qKlxuICogVGhlIGN1cnJlbnQgY29tcG9uZW50IGZ1bmN0aW9uLiBEaWZmZXJlbnQgZnJvbSBjdXJyZW50IGNvbXBvbmVudCBjb250ZXh0OlxuICogYGBgaHRtbFxuICogPCEtLSBBcHAuc3ZlbHRlIC0tPlxuICogPEZvbz5cbiAqICAgPEJhciAvPiA8IS0tIGNvbnRleHQgPT0gRm9vLnN2ZWx0ZSwgZnVuY3Rpb24gPT0gQXBwLnN2ZWx0ZSAtLT5cbiAqIDwvRm9vPlxuICogYGBgXG4gKiBAdHlwZSB7Q29tcG9uZW50Q29udGV4dFsnZnVuY3Rpb24nXX1cbiAqL1xuZXhwb3J0IGxldCBkZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb24gPSBudWxsO1xuXG4vKiogQHBhcmFtIHtDb21wb25lbnRDb250ZXh0WydmdW5jdGlvbiddfSBmbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldF9kZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb24oZm4pIHtcblx0ZGV2X2N1cnJlbnRfY29tcG9uZW50X2Z1bmN0aW9uID0gZm47XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGBbZ2V0LCBzZXQsIGhhc11gIHRyaXBsZXQgb2YgZnVuY3Rpb25zIGZvciB3b3JraW5nIHdpdGggY29udGV4dCBpbiBhIHR5cGUtc2FmZSB3YXkuXG4gKlxuICogYGdldGAgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiBgc2V0YCBoYXMgbm90IHlldCBiZWVuIGNhbGxlZCBpbiB0aGUgY3VycmVudCBjb21wb25lbnQgb3IgYW55IG9mXG4gKiBpdHMgYW5jZXN0b3JzLlxuICpcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcmV0dXJucyB7WygpID0+IFQsIChjb250ZXh0OiBUKSA9PiBULCAoKSA9PiBib29sZWFuXX1cbiAqIEBzaW5jZSA1LjQwLjBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbnRleHQoKSB7XG5cdHJldHVybiAvKiogQHR5cGUge1soKSA9PiBULCAoY29udGV4dDogVCkgPT4gVCwgKCkgPT4gYm9vbGVhbl19ICovIChcblx0XHRjcmVhdGVfY29udGV4dChnZXRDb250ZXh0LCBzZXRDb250ZXh0LCBoYXNDb250ZXh0KVxuXHQpO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgY29udGV4dCBzZXQgd2l0aCB0aGUgc3BlY2lmaWVkIGBrZXlgIGluIHRoZSBjdXJyZW50IGNvbXBvbmVudCBvciBhbnkgb2YgaXRzXG4gKiBhbmNlc3RvcnMuIElmIG11bHRpcGxlIGNvbXBvbmVudHMgc2V0IHRoZSBzYW1lIGtleSwgdGhlIHZhbHVlIGZyb20gdGhlIGNsb3Nlc3Qgb25lIGlzIHJldHVybmVkLlxuICogQSBgc2V0Q29udGV4dGAgY2FsbCBpbiB0aGUgY3VycmVudCBjb21wb25lbnQgaXMgb25seSB2aXNpYmxlIHRvIGBnZXRDb250ZXh0YCBjYWxscyB0aGF0IHJ1biBhZnRlciBpdC5cbiAqIE11c3QgYmUgY2FsbGVkIGR1cmluZyBjb21wb25lbnQgaW5pdGlhbGlzYXRpb24uXG4gKlxuICogW2BjcmVhdGVDb250ZXh0YF0oaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3Mvc3ZlbHRlL3N2ZWx0ZSNjcmVhdGVDb250ZXh0KSBpcyBhIHR5cGUtc2FmZSBhbHRlcm5hdGl2ZS5cbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHthbnl9IGtleVxuICogQHJldHVybnMge1R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0KGtleSkge1xuXHRjb25zdCBjb250ZXh0X21hcCA9IGdldF9vcl9pbml0X2NvbnRleHRfbWFwKGNvbXBvbmVudF9jb250ZXh0LCAnZ2V0Q29udGV4dCcpO1xuXHRjb25zdCByZXN1bHQgPSAvKiogQHR5cGUge1R9ICovIChjb250ZXh0X21hcC5nZXQoa2V5KSk7XG5cdHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQXNzb2NpYXRlcyBhbiBhcmJpdHJhcnkgYGNvbnRleHRgIG9iamVjdCB3aXRoIHRoZSBjdXJyZW50IGNvbXBvbmVudCBhbmQgdGhlIHNwZWNpZmllZCBga2V5YFxuICogYW5kIHJldHVybnMgdGhhdCBvYmplY3QuIFRoZSBjb250ZXh0IGlzIHRoZW4gYXZhaWxhYmxlIHRvIHRoZSBjb21wb25lbnQgaXRzZWxmIGFuZCBhbGwgb2YgaXRzXG4gKiBkZXNjZW5kYW50cyAoaW5jbHVkaW5nIHNsb3R0ZWQgY29udGVudCkgd2l0aCBgZ2V0Q29udGV4dGAuXG4gKlxuICogTGlrZSBsaWZlY3ljbGUgZnVuY3Rpb25zLCB0aGlzIG11c3QgYmUgY2FsbGVkIGR1cmluZyBjb21wb25lbnQgaW5pdGlhbGlzYXRpb24uXG4gKlxuICogW2BjcmVhdGVDb250ZXh0YF0oaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3Mvc3ZlbHRlL3N2ZWx0ZSNjcmVhdGVDb250ZXh0KSBpcyBhIHR5cGUtc2FmZSBhbHRlcm5hdGl2ZS5cbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHthbnl9IGtleVxuICogQHBhcmFtIHtUfSBjb250ZXh0XG4gKiBAcmV0dXJucyB7VH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldENvbnRleHQoa2V5LCBjb250ZXh0KSB7XG5cdGNvbnN0IGNvbnRleHRfbWFwID0gZ2V0X29yX2luaXRfY29udGV4dF9tYXAoY29tcG9uZW50X2NvbnRleHQsICdzZXRDb250ZXh0Jyk7XG5cblx0aWYgKGFzeW5jX21vZGVfZmxhZykge1xuXHRcdHZhciBmbGFncyA9IC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAoYWN0aXZlX2VmZmVjdCkuZjtcblx0XHR2YXIgdmFsaWQgPVxuXHRcdFx0IWFjdGl2ZV9yZWFjdGlvbiAmJlxuXHRcdFx0KGZsYWdzICYgQlJBTkNIX0VGRkVDVCkgIT09IDAgJiZcblx0XHRcdC8vIHBvcCgpIHJ1bnMgc3luY2hyb25vdXNseSwgc28gdGhpcyBpbmRpY2F0ZXMgd2UncmUgc2V0dGluZyBjb250ZXh0IGFmdGVyIGFuIGF3YWl0XG5cdFx0XHQhKC8qKiBAdHlwZSB7Q29tcG9uZW50Q29udGV4dH0gKi8gKGNvbXBvbmVudF9jb250ZXh0KS5pKTtcblxuXHRcdGlmICghdmFsaWQpIHtcblx0XHRcdGUuc2V0X2NvbnRleHRfYWZ0ZXJfaW5pdCgpO1xuXHRcdH1cblx0fVxuXG5cdGNvbnRleHRfbWFwLnNldChrZXksIGNvbnRleHQpO1xuXHRyZXR1cm4gY29udGV4dDtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIGdpdmVuIGBrZXlgIGhhcyBiZWVuIHNldCBpbiB0aGUgY29udGV4dCBvZiB0aGUgY3VycmVudCBjb21wb25lbnQgb3IgYW55IG9mXG4gKiBpdHMgYW5jZXN0b3JzLiBNdXN0IGJlIGNhbGxlZCBkdXJpbmcgY29tcG9uZW50IGluaXRpYWxpc2F0aW9uLlxuICpcbiAqIEBwYXJhbSB7YW55fSBrZXlcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzQ29udGV4dChrZXkpIHtcblx0Y29uc3QgY29udGV4dF9tYXAgPSBnZXRfb3JfaW5pdF9jb250ZXh0X21hcChjb21wb25lbnRfY29udGV4dCwgJ2hhc0NvbnRleHQnKTtcblx0cmV0dXJuIGNvbnRleHRfbWFwLmhhcyhrZXkpO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgd2hvbGUgY29udGV4dCBtYXAgdGhhdCBiZWxvbmdzIHRvIHRoZSBjdXJyZW50IGNvbXBvbmVudCwgaW5jbHVkaW5nIGVudHJpZXNcbiAqIGluaGVyaXRlZCBmcm9tIGl0cyBhbmNlc3RvcnMuIE11c3QgYmUgY2FsbGVkIGR1cmluZyBjb21wb25lbnQgaW5pdGlhbGlzYXRpb24uIFVzZWZ1bCwgZm9yXG4gKiBleGFtcGxlLCBpZiB5b3UgcHJvZ3JhbW1hdGljYWxseSBjcmVhdGUgYSBjb21wb25lbnQgYW5kIHdhbnQgdG8gcGFzcyB0aGUgZXhpc3RpbmcgY29udGV4dCB0byBpdC5cbiAqXG4gKiBAdGVtcGxhdGUge01hcDxhbnksIGFueT59IFtUPU1hcDxhbnksIGFueT5dXG4gKiBAcmV0dXJucyB7VH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbENvbnRleHRzKCkge1xuXHRjb25zdCBjb250ZXh0X21hcCA9IGdldF9vcl9pbml0X2NvbnRleHRfbWFwKGNvbXBvbmVudF9jb250ZXh0LCAnZ2V0QWxsQ29udGV4dHMnKTtcblx0cmV0dXJuIC8qKiBAdHlwZSB7VH0gKi8gKGNvbnRleHRfbWFwKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBwcm9wc1xuICogQHBhcmFtIHthbnl9IHJ1bmVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1c2gocHJvcHMsIHJ1bmVzID0gZmFsc2UsIGZuKSB7XG5cdGNvbXBvbmVudF9jb250ZXh0ID0ge1xuXHRcdHA6IGNvbXBvbmVudF9jb250ZXh0LFxuXHRcdGk6IGZhbHNlLFxuXHRcdGM6IG51bGwsXG5cdFx0ZTogbnVsbCxcblx0XHRzOiBwcm9wcyxcblx0XHR4OiBudWxsLFxuXHRcdHI6IC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAoYWN0aXZlX2VmZmVjdCksXG5cdFx0bDogbGVnYWN5X21vZGVfZmxhZyAmJiAhcnVuZXMgPyB7IHM6IG51bGwsIHU6IG51bGwsICQ6IFtdIH0gOiBudWxsXG5cdH07XG5cblx0aWYgKERFVikge1xuXHRcdC8vIGNvbXBvbmVudCBmdW5jdGlvblxuXHRcdGNvbXBvbmVudF9jb250ZXh0LmZ1bmN0aW9uID0gZm47XG5cdFx0ZGV2X2N1cnJlbnRfY29tcG9uZW50X2Z1bmN0aW9uID0gZm47XG5cdH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUge1JlY29yZDxzdHJpbmcsIGFueT59IFRcbiAqIEBwYXJhbSB7VH0gW2NvbXBvbmVudF1cbiAqIEByZXR1cm5zIHtUfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcG9wKGNvbXBvbmVudCkge1xuXHR2YXIgY29udGV4dCA9IC8qKiBAdHlwZSB7Q29tcG9uZW50Q29udGV4dH0gKi8gKGNvbXBvbmVudF9jb250ZXh0KTtcblx0dmFyIGVmZmVjdHMgPSBjb250ZXh0LmU7XG5cblx0aWYgKGVmZmVjdHMgIT09IG51bGwpIHtcblx0XHRjb250ZXh0LmUgPSBudWxsO1xuXG5cdFx0Zm9yICh2YXIgZm4gb2YgZWZmZWN0cykge1xuXHRcdFx0Y3JlYXRlX3VzZXJfZWZmZWN0KGZuKTtcblx0XHR9XG5cdH1cblxuXHRpZiAoY29tcG9uZW50ICE9PSB1bmRlZmluZWQpIHtcblx0XHRjb250ZXh0LnggPSBjb21wb25lbnQ7XG5cdH1cblxuXHRjb250ZXh0LmkgPSB0cnVlO1xuXG5cdGNvbXBvbmVudF9jb250ZXh0ID0gY29udGV4dC5wO1xuXG5cdGlmIChERVYpIHtcblx0XHRkZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb24gPSBjb21wb25lbnRfY29udGV4dD8uZnVuY3Rpb24gPz8gbnVsbDtcblx0fVxuXG5cdHJldHVybiBtYXJrX2FzX2NvbXBvbmVudChjb21wb25lbnQpO1xufVxuXG4vKipcbiAqIEFkZCBhIHN5bWJvbCB0byB0aGUgb2JqZWN0IChvciBjcmVhdGUgb25lIGlmIHVuZGVmaW5lZCkgdG8gbWFyayBpdCBhcyBhIGNvbXBvbmVudCBzbyBpdCBpc24ndCBwcm94aWZpZWQuXG4gKiBAcGFyYW0ge2FueX0gY29tcG9uZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrX2FzX2NvbXBvbmVudChjb21wb25lbnQgPSB7fSkge1xuXHRkZWZpbmVfcHJvcGVydHkoY29tcG9uZW50LCBDT01QT05FTlRfU1lNQk9MLCB7IHZhbHVlOiB0cnVlIH0pO1xuXHRyZXR1cm4gY29tcG9uZW50O1xufVxuXG4vKiogQHJldHVybnMge2Jvb2xlYW59ICovXG5leHBvcnQgZnVuY3Rpb24gaXNfcnVuZXMoKSB7XG5cdHJldHVybiAhbGVnYWN5X21vZGVfZmxhZyB8fCAoY29tcG9uZW50X2NvbnRleHQgIT09IG51bGwgJiYgY29tcG9uZW50X2NvbnRleHQubCA9PT0gbnVsbCk7XG59XG4iLCJpbXBvcnQgeyBydW5fYWxsIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3V0aWxzLmpzJztcbmltcG9ydCB7IGlzX2ZsdXNoaW5nX3N5bmMgfSBmcm9tICcuLi9yZWFjdGl2aXR5L2JhdGNoLmpzJztcblxuLyoqIEB0eXBlIHtBcnJheTwoKSA9PiB2b2lkPn0gKi9cbmxldCBtaWNyb190YXNrcyA9IFtdO1xuXG5mdW5jdGlvbiBydW5fbWljcm9fdGFza3MoKSB7XG5cdHZhciB0YXNrcyA9IG1pY3JvX3Rhc2tzO1xuXHRtaWNyb190YXNrcyA9IFtdO1xuXHRydW5fYWxsKHRhc2tzKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0geygpID0+IHZvaWR9IGZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWV1ZV9taWNyb190YXNrKGZuKSB7XG5cdGlmIChtaWNyb190YXNrcy5sZW5ndGggPT09IDAgJiYgIWlzX2ZsdXNoaW5nX3N5bmMpIHtcblx0XHR2YXIgdGFza3MgPSBtaWNyb190YXNrcztcblx0XHRxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG5cdFx0XHQvLyBJZiB0aGlzIGlzIGZhbHNlLCBhIGZsdXNoU3luYyBoYXBwZW5lZCBpbiB0aGUgbWVhbnRpbWUuIERvIF9ub3RfIHJ1biBuZXcgc2NoZWR1bGVkIG1pY3JvdGFza3MgaW4gdGhhdCBjYXNlXG5cdFx0XHQvLyBhcyB0aGUgb3JkZXJpbmcgb2YgbWljcm90YXNrcyB3b3VsZCBiZSBicm9rZW4gYXQgdGhhdCBwb2ludCAtIGNvbnNpZGVyIHRoaXMgY2FzZTpcblx0XHRcdC8vIC0gcXVldWVfbWljcm9fdGFzayBzY2hlZHVsZXMgbWljcm90YXNrIEEgdG8gZmx1c2ggdGFzayBYXG5cdFx0XHQvLyAtIHN5bmNocm9ub3VzbHkgYWZ0ZXIsIGZsdXNoU3luYyBydW5zLCBwcm9jZXNzaW5nIHRhc2sgWFxuXHRcdFx0Ly8gLSBzeW5jaHJvbm91c2x5IGFmdGVyLCBzb21lIG90aGVyIG1pY3JvdGFzayBCIGlzIHNjaGVkdWxlZCwgYnV0IG5vdCB0aHJvdWdoIHF1ZXVlX21pY3JvX3Rhc2sgYnV0IGZvciBleGFtcGxlIGEgUHJvbWlzZS5yZXNvbHZlKCkgaW4gdXNlciBjb2RlXG5cdFx0XHQvLyAtIHN5bmNocm9ub3VzbHkgYWZ0ZXIsIHF1ZXVlX21pY3JvX3Rhc2sgc2NoZWR1bGVzIG1pY3JvdGFzayBDIHRvIGZsdXNoIHRhc2sgWVxuXHRcdFx0Ly8gLSBvbmUgdGljayBsYXRlciwgbWljcm90YXNrIEEgbm93IHJlc29sdmVzLCBmbHVzaGluZyB0YXNrIFkgYmVmb3JlIG1pY3JvdGFzayBCLCB3aGljaCBpcyBpbmNvcnJlY3Rcblx0XHRcdC8vIFRoaXMgaWYgY2hlY2sgcHJldmVudHMgdGhhdCByYWNlIGNvbmRpdGlvbiAodGhhdCByZWFsaXN0aWNhbGx5IHdpbGwgb25seSBoYXBwZW4gaW4gdGVzdHMpXG5cdFx0XHRpZiAodGFza3MgPT09IG1pY3JvX3Rhc2tzKSBydW5fbWljcm9fdGFza3MoKTtcblx0XHR9KTtcblx0fVxuXG5cdG1pY3JvX3Rhc2tzLnB1c2goZm4pO1xufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcnVuIGFueSBxdWV1ZWQgdGFza3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaF90YXNrcygpIHtcblx0d2hpbGUgKG1pY3JvX3Rhc2tzLmxlbmd0aCA+IDApIHtcblx0XHRydW5fbWljcm9fdGFza3MoKTtcblx0fVxufVxuIiwiLyoqIEBpbXBvcnQgeyBEZXJpdmVkLCBTaWduYWwgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgQ0xFQU4sIENPTk5FQ1RFRCwgRElSVFksIE1BWUJFX0RJUlRZIH0gZnJvbSAnI2NsaWVudC9jb25zdGFudHMnO1xuXG5jb25zdCBTVEFUVVNfTUFTSyA9IH4oRElSVFkgfCBNQVlCRV9ESVJUWSB8IENMRUFOKTtcblxuLyoqXG4gKiBAcGFyYW0ge1NpZ25hbH0gc2lnbmFsXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhdHVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRfc2lnbmFsX3N0YXR1cyhzaWduYWwsIHN0YXR1cykge1xuXHRzaWduYWwuZiA9IChzaWduYWwuZiAmIFNUQVRVU19NQVNLKSB8IHN0YXR1cztcbn1cblxuLyoqXG4gKiBTZXQgYSBkZXJpdmVkJ3Mgc3RhdHVzIHRvIENMRUFOIG9yIE1BWUJFX0RJUlRZIGJhc2VkIG9uIGl0cyBjb25uZWN0aW9uIHN0YXRlLlxuICogQHBhcmFtIHtEZXJpdmVkfSBkZXJpdmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVfZGVyaXZlZF9zdGF0dXMoZGVyaXZlZCkge1xuXHQvLyBPbmx5IG1hcmsgYXMgTUFZQkVfRElSVFkgaWYgZGlzY29ubmVjdGVkIGFuZCBoYXMgZGVwZW5kZW5jaWVzLlxuXHRpZiAoKGRlcml2ZWQuZiAmIENPTk5FQ1RFRCkgIT09IDAgfHwgZGVyaXZlZC5kZXBzID09PSBudWxsKSB7XG5cdFx0c2V0X3NpZ25hbF9zdGF0dXMoZGVyaXZlZCwgQ0xFQU4pO1xuXHR9IGVsc2Uge1xuXHRcdHNldF9zaWduYWxfc3RhdHVzKGRlcml2ZWQsIE1BWUJFX0RJUlRZKTtcblx0fVxufVxuIiwiLyoqIEBpbXBvcnQgeyBFZmZlY3QgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgQ0xFQU4sIERJUlRZLCBNQVlCRV9ESVJUWSB9IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcbmltcG9ydCB7IHNldF9zaWduYWxfc3RhdHVzIH0gZnJvbSAnLi9zdGF0dXMuanMnO1xuXG4vKipcbiAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3RcbiAqIEBwYXJhbSB7TWFwPEVmZmVjdCwgbnVtYmVyPn0gZGlydHlfcmVhY3Rpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWZlcl9lZmZlY3QoZWZmZWN0LCBkaXJ0eV9yZWFjdGlvbnMpIHtcblx0aWYgKChlZmZlY3QuZiAmIERJUlRZKSAhPT0gMCkge1xuXHRcdGRpcnR5X3JlYWN0aW9ucy5zZXQoZWZmZWN0LCBESVJUWSk7XG5cdH0gZWxzZSBpZiAoKGVmZmVjdC5mICYgTUFZQkVfRElSVFkpICE9PSAwICYmIGRpcnR5X3JlYWN0aW9ucy5nZXQoZWZmZWN0KSAhPT0gRElSVFkpIHtcblx0XHRkaXJ0eV9yZWFjdGlvbnMuc2V0KGVmZmVjdCwgTUFZQkVfRElSVFkpO1xuXHR9XG5cblx0Ly8gbWFyayBhcyBjbGVhbiBzbyB0aGV5IGdldCBzY2hlZHVsZWQgaWYgdGhleSBkZXBlbmQgb24gcGVuZGluZyBhc3luYyBzdGF0ZVxuXHRzZXRfc2lnbmFsX3N0YXR1cyhlZmZlY3QsIENMRUFOKTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgRGVyaXZlZCwgRWZmZWN0LCBWYWx1ZSB9IGZyb20gJyNjbGllbnQnICovXG5cbmltcG9ydCB7XG5cdEJMT0NLX0VGRkVDVCxcblx0Qk9VTkRBUllfRUZGRUNULFxuXHRCUkFOQ0hfRUZGRUNULFxuXHRDTEVBTixcblx0Q09OTkVDVEVELFxuXHRERVJJVkVELFxuXHRESVJUWSxcblx0RUZGRUNULFxuXHRBU1lOQyxcblx0REVTVFJPWUVELFxuXHRJTkVSVCxcblx0TUFZQkVfRElSVFksXG5cdFJFTkRFUl9FRkZFQ1QsXG5cdFJPT1RfRUZGRUNULFxuXHRNQU5BR0VEX0VGRkVDVFxufSBmcm9tICcjY2xpZW50L2NvbnN0YW50cyc7XG5pbXBvcnQgeyBzbmFwc2hvdCB9IGZyb20gJy4uLy4uL3NoYXJlZC9jbG9uZS5qcyc7XG5pbXBvcnQgeyB1bnRyYWNrIH0gZnJvbSAnLi4vcnVudGltZS5qcyc7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJvb3QoZWZmZWN0KSB7XG5cdHdoaWxlIChlZmZlY3QucGFyZW50ICE9PSBudWxsKSB7XG5cdFx0ZWZmZWN0ID0gZWZmZWN0LnBhcmVudDtcblx0fVxuXG5cdHJldHVybiBlZmZlY3Q7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3RcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYXBwZW5kX2VmZmVjdFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZWZmZWN0X2xhYmVsKGVmZmVjdCwgYXBwZW5kX2VmZmVjdCA9IGZhbHNlKSB7XG5cdGNvbnN0IGZsYWdzID0gZWZmZWN0LmY7XG5cblx0bGV0IGxhYmVsID0gYCh1bmtub3duICR7YXBwZW5kX2VmZmVjdCA/ICdlZmZlY3QnIDogJyd9KWA7XG5cblx0aWYgKChmbGFncyAmIFJPT1RfRUZGRUNUKSAhPT0gMCkge1xuXHRcdGxhYmVsID0gJ3Jvb3QnO1xuXHR9IGVsc2UgaWYgKChmbGFncyAmIEJPVU5EQVJZX0VGRkVDVCkgIT09IDApIHtcblx0XHRsYWJlbCA9ICdib3VuZGFyeSc7XG5cdH0gZWxzZSBpZiAoKGZsYWdzICYgQkxPQ0tfRUZGRUNUKSAhPT0gMCkge1xuXHRcdGxhYmVsID0gJ2Jsb2NrJztcblx0fSBlbHNlIGlmICgoZmxhZ3MgJiBNQU5BR0VEX0VGRkVDVCkgIT09IDApIHtcblx0XHRsYWJlbCA9ICdtYW5hZ2VkJztcblx0fSBlbHNlIGlmICgoZmxhZ3MgJiBBU1lOQykgIT09IDApIHtcblx0XHRsYWJlbCA9ICdhc3luYyc7XG5cdH0gZWxzZSBpZiAoKGZsYWdzICYgQlJBTkNIX0VGRkVDVCkgIT09IDApIHtcblx0XHRsYWJlbCA9ICdicmFuY2gnO1xuXHR9IGVsc2UgaWYgKChmbGFncyAmIFJFTkRFUl9FRkZFQ1QpICE9PSAwKSB7XG5cdFx0bGFiZWwgPSAncmVuZGVyIGVmZmVjdCc7XG5cdH0gZWxzZSBpZiAoKGZsYWdzICYgRUZGRUNUKSAhPT0gMCkge1xuXHRcdGxhYmVsID0gJ2VmZmVjdCc7XG5cdH1cblxuXHRpZiAoYXBwZW5kX2VmZmVjdCAmJiAhbGFiZWwuZW5kc1dpdGgoJ2VmZmVjdCcpKSB7XG5cdFx0bGFiZWwgKz0gJyBlZmZlY3QnO1xuXHR9XG5cblx0cmV0dXJuIGxhYmVsO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3RcbiAqIEBwYXJhbSB7RWZmZWN0W119IGhpZ2hsaWdodGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2dfZWZmZWN0X3RyZWUoZWZmZWN0LCBoaWdobGlnaHRlZCA9IFtdLCBkZXB0aCA9IDAsIGlzX3JlYWNoYWJsZSA9IHRydWUpIHtcblx0Y29uc3QgZmxhZ3MgPSBlZmZlY3QuZjtcblx0bGV0IGxhYmVsID0gZWZmZWN0X2xhYmVsKGVmZmVjdCk7XG5cblx0bGV0IHN0YXR1cyA9XG5cdFx0KGZsYWdzICYgQ0xFQU4pICE9PSAwID8gJ2NsZWFuJyA6IChmbGFncyAmIE1BWUJFX0RJUlRZKSAhPT0gMCA/ICdtYXliZSBkaXJ0eScgOiAnZGlydHknO1xuXG5cdGxldCBzdHlsZXMgPSBbYGZvbnQtd2VpZ2h0OiAke3N0YXR1cyA9PT0gJ2NsZWFuJyA/ICdub3JtYWwnIDogJ2JvbGQnfWBdO1xuXG5cdGlmIChzdGF0dXMgIT09ICdjbGVhbicgJiYgIWlzX3JlYWNoYWJsZSkge1xuXHRcdGxhYmVsID0gYOKaoO+4jyAke2xhYmVsfWA7XG5cdFx0c3R5bGVzLnB1c2goYGNvbG9yOiByZWRgKTtcblx0fVxuXG5cdGlmICgoZmxhZ3MgJiBJTkVSVCkgIT09IDApIHtcblx0XHRzdHlsZXMucHVzaCgnZm9udC1zdHlsZTogaXRhbGljJyk7XG5cdH1cblxuXHRpZiAoaGlnaGxpZ2h0ZWQuaW5jbHVkZXMoZWZmZWN0KSkge1xuXHRcdHN0eWxlcy5wdXNoKCdiYWNrZ3JvdW5kLWNvbG9yOiB5ZWxsb3cnKTtcblx0fVxuXG5cdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdGNvbnNvbGUuZ3JvdXAoYCVjJHtsYWJlbH0gKCR7c3RhdHVzfSlgLCBzdHlsZXMuam9pbignOyAnKSk7XG5cblx0aWYgKGRlcHRoID09PSAwKSB7XG5cdFx0Y29uc3QgY2FsbHNpdGUgPSBuZXcgRXJyb3IoKS5zdGFja1xuXHRcdFx0Py5zcGxpdCgnXFxuJylbMl1cblx0XHRcdC5yZXBsYWNlKC9cXHMrYXQgKD86IFxcdytcXCg/KT8oLispXFwpPy8sIChtLCAkMSkgPT4gJDEucmVwbGFjZSgvXFw/W146XSsvLCAnJykpO1xuXG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRjb25zb2xlLmxvZyhjYWxsc2l0ZSk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRjb25zb2xlLmdyb3VwQ29sbGFwc2VkKGAlY2ZuYCwgYGZvbnQtd2VpZ2h0OiBub3JtYWxgKTtcblx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdGNvbnNvbGUubG9nKGVmZmVjdC5mbik7XG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRjb25zb2xlLmdyb3VwRW5kKCk7XG5cdH1cblxuXHRpZiAoZWZmZWN0LmRlcHMgIT09IG51bGwpIHtcblx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdGNvbnNvbGUuZ3JvdXBDb2xsYXBzZWQoJyVjZGVwcycsICdmb250LXdlaWdodDogbm9ybWFsJyk7XG5cblx0XHRmb3IgKGNvbnN0IGRlcCBvZiBlZmZlY3QuZGVwcykge1xuXHRcdFx0bG9nX2RlcChkZXApO1xuXHRcdH1cblxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0Y29uc29sZS5ncm91cEVuZCgpO1xuXHR9XG5cblx0aWYgKGVmZmVjdC5ub2Rlcykge1xuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0Y29uc29sZS5sb2coZWZmZWN0Lm5vZGVzLnN0YXJ0KTtcblxuXHRcdGlmIChlZmZlY3Qubm9kZXMuc3RhcnQgIT09IGVmZmVjdC5ub2Rlcy5lbmQpIHtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0XHRjb25zb2xlLmxvZyhlZmZlY3Qubm9kZXMuZW5kKTtcblx0XHR9XG5cdH1cblxuXHR2YXIgY2hpbGRfaXNfcmVhY2hhYmxlID0gaXNfcmVhY2hhYmxlICYmICgoZmxhZ3MgJiBCUkFOQ0hfRUZGRUNUKSA9PT0gMCB8fCAoZmxhZ3MgJiBDTEVBTikgPT09IDApO1xuXG5cdGxldCBjaGlsZCA9IGVmZmVjdC5maXJzdDtcblx0d2hpbGUgKGNoaWxkICE9PSBudWxsKSB7XG5cdFx0bG9nX2VmZmVjdF90cmVlKGNoaWxkLCBoaWdobGlnaHRlZCwgZGVwdGggKyAxLCBjaGlsZF9pc19yZWFjaGFibGUpO1xuXHRcdGNoaWxkID0gY2hpbGQubmV4dDtcblx0fVxuXG5cdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdGNvbnNvbGUuZ3JvdXBFbmQoKTtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIHtWYWx1ZX0gZGVwXG4gKi9cbmZ1bmN0aW9uIGxvZ19kZXAoZGVwKSB7XG5cdGlmICgoZGVwLmYgJiBERVJJVkVEKSAhPT0gMCkge1xuXHRcdGNvbnN0IGRlcml2ZWQgPSAvKiogQHR5cGUge0Rlcml2ZWR9ICovIChkZXApO1xuXG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRjb25zb2xlLmdyb3VwQ29sbGFwc2VkKFxuXHRcdFx0YCVjJGRlcml2ZWQgJWMke2RlcC5sYWJlbCA/PyAnPHVua25vd24+J31gLFxuXHRcdFx0J2ZvbnQtd2VpZ2h0OiBib2xkOyBjb2xvcjogQ29ybmZsb3dlckJsdWUnLFxuXHRcdFx0J2ZvbnQtd2VpZ2h0OiBub3JtYWwnLFxuXHRcdFx0dW50cmFjaygoKSA9PiBzbmFwc2hvdChkZXJpdmVkLnYpKVxuXHRcdCk7XG5cblx0XHRpZiAoZGVyaXZlZC5kZXBzKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGQgb2YgZGVyaXZlZC5kZXBzKSB7XG5cdFx0XHRcdGxvZ19kZXAoZCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRjb25zb2xlLmdyb3VwRW5kKCk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRjb25zb2xlLmxvZyhcblx0XHRcdGAlYyRzdGF0ZSAlYyR7ZGVwLmxhYmVsID8/ICc8dW5rbm93bj4nfWAsXG5cdFx0XHQnZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiBDb3JuZmxvd2VyQmx1ZScsXG5cdFx0XHQnZm9udC13ZWlnaHQ6IG5vcm1hbCcsXG5cdFx0XHR1bnRyYWNrKCgpID0+IHNuYXBzaG90KGRlcC52KSlcblx0XHQpO1xuXHR9XG59XG5cbi8qKlxuICogTG9ncyBhbGwgcmVhY3Rpb25zIG9mIGEgc291cmNlIG9yIGRlcml2ZWQgdHJhbnNpdGl2ZWx5XG4gKiBAcGFyYW0ge0Rlcml2ZWQgfCBWYWx1ZX0gc2lnbmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2dfcmVhY3Rpb25zKHNpZ25hbCkge1xuXHQvKiogQHR5cGUge1NldDxEZXJpdmVkIHwgVmFsdWU+fSAqL1xuXHRjb25zdCB2aXNpdGVkID0gbmV3IFNldCgpO1xuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGZsYWcgbmFtZXMgdGhhdCBhcmUgc2V0IG9uIHRoZSBnaXZlbiBmbGFncyBiaXRtYXNrXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBmbGFnc1xuXHQgKiBAcmV0dXJucyB7c3RyaW5nW119XG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRfZGVyaXZlZF9mbGFnX25hbWVzKGZsYWdzKSB7XG5cdFx0LyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cblx0XHRjb25zdCBuYW1lcyA9IFtdO1xuXG5cdFx0aWYgKChmbGFncyAmIENMRUFOKSAhPT0gMCkgbmFtZXMucHVzaCgnQ0xFQU4nKTtcblx0XHRpZiAoKGZsYWdzICYgRElSVFkpICE9PSAwKSBuYW1lcy5wdXNoKCdESVJUWScpO1xuXHRcdGlmICgoZmxhZ3MgJiBNQVlCRV9ESVJUWSkgIT09IDApIG5hbWVzLnB1c2goJ01BWUJFX0RJUlRZJyk7XG5cdFx0aWYgKChmbGFncyAmIENPTk5FQ1RFRCkgIT09IDApIG5hbWVzLnB1c2goJ0NPTk5FQ1RFRCcpO1xuXHRcdGlmICgoZmxhZ3MgJiBJTkVSVCkgIT09IDApIG5hbWVzLnB1c2goJ0lORVJUJyk7XG5cdFx0aWYgKChmbGFncyAmIERFU1RST1lFRCkgIT09IDApIG5hbWVzLnB1c2goJ0RFU1RST1lFRCcpO1xuXG5cdFx0cmV0dXJuIG5hbWVzO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7RGVyaXZlZCB8IFZhbHVlfSBkXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBkZXB0aFxuXHQgKi9cblx0ZnVuY3Rpb24gbG9nX2Rlcml2ZWQoZCwgZGVwdGgpIHtcblx0XHRjb25zdCBmbGFncyA9IGQuZjtcblx0XHRjb25zdCBmbGFnX25hbWVzID0gZ2V0X2Rlcml2ZWRfZmxhZ19uYW1lcyhmbGFncyk7XG5cdFx0Y29uc3QgZmxhZ3Nfc3RyID0gZmxhZ19uYW1lcy5sZW5ndGggPiAwID8gYCgke2ZsYWdfbmFtZXMuam9pbignLCAnKX0pYCA6ICcobm8gZmxhZ3MpJztcblxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0Y29uc29sZS5ncm91cChcblx0XHRcdGAlYyR7ZmxhZ3MgJiBERVJJVkVEID8gJyRkZXJpdmVkJyA6ICckc3RhdGUnfSAlYyR7ZC5sYWJlbCA/PyAnPHVua25vd24+J30gJWMke2ZsYWdzX3N0cn1gLFxuXHRcdFx0J2ZvbnQtd2VpZ2h0OiBib2xkOyBjb2xvcjogQ29ybmZsb3dlckJsdWUnLFxuXHRcdFx0J2ZvbnQtd2VpZ2h0OiBub3JtYWw7IGNvbG9yOiBpbmhlcml0Jyxcblx0XHRcdCdmb250LXdlaWdodDogbm9ybWFsOyBjb2xvcjogZ3JheSdcblx0XHQpO1xuXG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRjb25zb2xlLmxvZyh1bnRyYWNrKCgpID0+IHNuYXBzaG90KGQudikpKTtcblxuXHRcdGlmICgnZm4nIGluIGQpIHtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0XHRjb25zb2xlLmxvZygnJWNmbjonLCAnZm9udC13ZWlnaHQ6IGJvbGQnLCBkLmZuKTtcblx0XHR9XG5cblx0XHRpZiAoZC5yZWFjdGlvbnMgIT09IG51bGwgJiYgZC5yZWFjdGlvbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRcdGNvbnNvbGUuZ3JvdXAoJyVjcmVhY3Rpb25zJywgJ2ZvbnQtd2VpZ2h0OiBib2xkJyk7XG5cblx0XHRcdGZvciAoY29uc3QgcmVhY3Rpb24gb2YgZC5yZWFjdGlvbnMpIHtcblx0XHRcdFx0aWYgKChyZWFjdGlvbi5mICYgREVSSVZFRCkgIT09IDApIHtcblx0XHRcdFx0XHRjb25zdCBkZXJpdmVkX3JlYWN0aW9uID0gLyoqIEB0eXBlIHtEZXJpdmVkfSAqLyAocmVhY3Rpb24pO1xuXG5cdFx0XHRcdFx0aWYgKHZpc2l0ZWQuaGFzKGRlcml2ZWRfcmVhY3Rpb24pKSB7XG5cdFx0XHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXG5cdFx0XHRcdFx0XHRcdGAlYyRkZXJpdmVkICVjJHtkZXJpdmVkX3JlYWN0aW9uLmxhYmVsID8/ICc8dW5rbm93bj4nfSAlYyhhbHJlYWR5IHNlZW4pYCxcblx0XHRcdFx0XHRcdFx0J2ZvbnQtd2VpZ2h0OiBib2xkOyBjb2xvcjogQ29ybmZsb3dlckJsdWUnLFxuXHRcdFx0XHRcdFx0XHQnZm9udC13ZWlnaHQ6IG5vcm1hbDsgY29sb3I6IGluaGVyaXQnLFxuXHRcdFx0XHRcdFx0XHQnZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiBvcmFuZ2UnXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR2aXNpdGVkLmFkZChkZXJpdmVkX3JlYWN0aW9uKTtcblx0XHRcdFx0XHRcdGxvZ19kZXJpdmVkKGRlcml2ZWRfcmVhY3Rpb24sIGRlcHRoICsgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIEl0J3MgYW4gZWZmZWN0XG5cdFx0XHRcdFx0Y29uc3QgbGFiZWwgPSBlZmZlY3RfbGFiZWwoLyoqIEB0eXBlIHtFZmZlY3R9ICovIChyZWFjdGlvbiksIHRydWUpO1xuXHRcdFx0XHRcdGNvbnN0IHN0YXR1cyA9IChmbGFncyAmIE1BWUJFX0RJUlRZKSAhPT0gMCA/ICdtYXliZSBkaXJ0eScgOiAnZGlydHknO1xuXG5cdFx0XHRcdFx0Ly8gQ29sbGVjdCBwYXJlbnQgc3RhdHVzZXNcblx0XHRcdFx0XHQvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuXHRcdFx0XHRcdGNvbnN0IHBhcmVudF9zdGF0dXNlcyA9IFtdO1xuXHRcdFx0XHRcdGxldCBzaG93ID0gZmFsc2U7XG5cdFx0XHRcdFx0bGV0IGN1cnJlbnQgPSAvKiogQHR5cGUge0VmZmVjdH0gKi8gKHJlYWN0aW9uKS5wYXJlbnQ7XG5cdFx0XHRcdFx0d2hpbGUgKGN1cnJlbnQgIT09IG51bGwpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHBhcmVudF9mbGFncyA9IGN1cnJlbnQuZjtcblx0XHRcdFx0XHRcdGlmICgocGFyZW50X2ZsYWdzICYgKFJPT1RfRUZGRUNUIHwgQlJBTkNIX0VGRkVDVCkpICE9PSAwKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHBhcmVudF9zdGF0dXMgPSAocGFyZW50X2ZsYWdzICYgQ0xFQU4pICE9PSAwID8gJ2NsZWFuJyA6ICdub3QgY2xlYW4nO1xuXHRcdFx0XHRcdFx0XHRpZiAocGFyZW50X3N0YXR1cyA9PT0gJ2NsZWFuJyAmJiBwYXJlbnRfc3RhdHVzZXMuaW5jbHVkZXMoJ25vdCBjbGVhbicpKSBzaG93ID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0cGFyZW50X3N0YXR1c2VzLnB1c2gocGFyZW50X3N0YXR1cyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAoIWN1cnJlbnQucGFyZW50KSBicmVhaztcblx0XHRcdFx0XHRcdGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBDaGVjayBpZiByZWFjdGlvbiBpcyByZWFjaGFibGUgZnJvbSByb290XG5cdFx0XHRcdFx0Y29uc3Qgc2Vlbl9lZmZlY3RzID0gbmV3IFNldCgpO1xuXHRcdFx0XHRcdGxldCByZWFjaGFibGUgPSBmYWxzZTtcblx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHQgKiBAcGFyYW0ge0VmZmVjdCB8IG51bGx9IGVmZmVjdFxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdGZ1bmN0aW9uIGNoZWNrX3JlYWNoYWJsZShlZmZlY3QpIHtcblx0XHRcdFx0XHRcdGlmIChlZmZlY3QgPT09IG51bGwgfHwgcmVhY2hhYmxlKSByZXR1cm47XG5cdFx0XHRcdFx0XHRpZiAoZWZmZWN0ID09PSByZWFjdGlvbikge1xuXHRcdFx0XHRcdFx0XHRyZWFjaGFibGUgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAoZWZmZWN0LmYgJiBERVNUUk9ZRUQpIHJldHVybjtcblx0XHRcdFx0XHRcdGlmIChzZWVuX2VmZmVjdHMuaGFzKGVmZmVjdCkpIHtcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCcnKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHNlZW5fZWZmZWN0cy5hZGQoZWZmZWN0KTtcblx0XHRcdFx0XHRcdGxldCBjaGlsZCA9IGVmZmVjdC5maXJzdDtcblx0XHRcdFx0XHRcdHdoaWxlIChjaGlsZCAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRjaGVja19yZWFjaGFibGUoY2hpbGQpO1xuXHRcdFx0XHRcdFx0XHRjaGlsZCA9IGNoaWxkLm5leHQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRpZiAoY3VycmVudCkgY2hlY2tfcmVhY2hhYmxlKGN1cnJlbnQpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcblx0XHRcdFx0XHRcdFx0YCVj4pqg77iPIENpcmN1bGFyIHJlZmVyZW5jZSBkZXRlY3RlZCBpbiBlZmZlY3QgdHJlZWAsXG5cdFx0XHRcdFx0XHRcdCdmb250LXdlaWdodDogYm9sZDsgY29sb3I6IHJlZCcsXG5cdFx0XHRcdFx0XHRcdHNlZW5fZWZmZWN0c1xuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIXJlYWNoYWJsZSkge1xuXHRcdFx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0XHRgJWPimqDvuI8gRWZmZWN0IGlzIE5PVCByZWFjaGFibGUgZnJvbSBpdHMgcGFyZW50IGNoYWluYCxcblx0XHRcdFx0XHRcdFx0J2ZvbnQtd2VpZ2h0OiBib2xkOyBjb2xvcjogcmVkJ1xuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb25zdCBwYXJlbnRfc3RhdHVzX3N0ciA9IHNob3cgPyBgICgke3BhcmVudF9zdGF0dXNlcy5qb2luKCcsICcpfSlgIDogJyc7XG5cblx0XHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0YCVjJHtsYWJlbH0gKCR7c3RhdHVzfSkke3BhcmVudF9zdGF0dXNfc3RyfWAsXG5cdFx0XHRcdFx0XHRgZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiAke3BhcmVudF9zdGF0dXNfc3RyID8gJ3JlZCcgOiAnZ3JlZW4nfWAsXG5cdFx0XHRcdFx0XHRyZWFjdGlvblxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRcdGNvbnNvbGUuZ3JvdXBFbmQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRcdGNvbnNvbGUubG9nKCclY25vIHJlYWN0aW9ucycsICdmb250LXN0eWxlOiBpdGFsaWM7IGNvbG9yOiBncmF5Jyk7XG5cdFx0fVxuXG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRjb25zb2xlLmdyb3VwRW5kKCk7XG5cdH1cblxuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRjb25zb2xlLmdyb3VwKGAlY0Rlcml2ZWQgUmVhY3Rpb25zIEdyYXBoYCwgJ2ZvbnQtd2VpZ2h0OiBib2xkOyBjb2xvcjogcHVycGxlJyk7XG5cblx0dmlzaXRlZC5hZGQoc2lnbmFsKTtcblx0bG9nX2Rlcml2ZWQoc2lnbmFsLCAwKTtcblxuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRjb25zb2xlLmdyb3VwRW5kKCk7XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGFuIGVmZmVjdCB0cmVlIGFuZCBsb2dzIGJyYW5jaGVzIHdoZXJlIGEgbm9uLWNsZWFuIGJyYW5jaCBleGlzdHMgYmVsb3cgYSBjbGVhbiBicmFuY2hcbiAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvZ19pbmNvbnNpc3RlbnRfYnJhbmNoZXMoZWZmZWN0KSB7XG5cdGNvbnN0IHJvb3RfZWZmZWN0ID0gcm9vdChlZmZlY3QpO1xuXG5cdC8qKlxuXHQgKiBAdHlwZWRlZiB7e1xuXHQgKiAgIGVmZmVjdDogRWZmZWN0LFxuXHQgKiAgIHN0YXR1czogJ2NsZWFuJyB8ICdtYXliZSBkaXJ0eScgfCAnZGlydHknLFxuXHQgKiAgIHBhcmVudF9jbGVhbjogYm9vbGVhbixcblx0ICogICBjaGlsZHJlbjogQnJhbmNoSW5mb1tdXG5cdCAqIH19IEJyYW5jaEluZm9cblx0ICovXG5cblx0LyoqXG5cdCAqIENvbGxlY3RzIGJyYW5jaCBlZmZlY3RzIGZyb20gdGhlIHRyZWVcblx0ICogQHBhcmFtIHtFZmZlY3R9IGVmZlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IHBhcmVudF9jbGVhbiAtIHdoZXRoZXIgYW55IGFuY2VzdG9yIGJyYW5jaCBpcyBjbGVhblxuXHQgKiBAcmV0dXJucyB7QnJhbmNoSW5mb1tdfVxuXHQgKi9cblx0ZnVuY3Rpb24gY29sbGVjdF9icmFuY2hlcyhlZmYsIHBhcmVudF9jbGVhbikge1xuXHRcdC8qKiBAdHlwZSB7QnJhbmNoSW5mb1tdfSAqL1xuXHRcdGNvbnN0IGJyYW5jaGVzID0gW107XG5cdFx0Y29uc3QgZmxhZ3MgPSBlZmYuZjtcblx0XHRjb25zdCBpc19icmFuY2ggPSAoZmxhZ3MgJiBCUkFOQ0hfRUZGRUNUKSAhPT0gMDtcblxuXHRcdGlmIChpc19icmFuY2gpIHtcblx0XHRcdGNvbnN0IHN0YXR1cyA9XG5cdFx0XHRcdChmbGFncyAmIENMRUFOKSAhPT0gMCA/ICdjbGVhbicgOiAoZmxhZ3MgJiBNQVlCRV9ESVJUWSkgIT09IDAgPyAnbWF5YmUgZGlydHknIDogJ2RpcnR5JztcblxuXHRcdFx0LyoqIEB0eXBlIHtCcmFuY2hJbmZvW119ICovXG5cdFx0XHRjb25zdCBjaGlsZF9icmFuY2hlcyA9IFtdO1xuXG5cdFx0XHRsZXQgY2hpbGQgPSBlZmYuZmlyc3Q7XG5cdFx0XHR3aGlsZSAoY2hpbGQgIT09IG51bGwpIHtcblx0XHRcdFx0Y2hpbGRfYnJhbmNoZXMucHVzaCguLi5jb2xsZWN0X2JyYW5jaGVzKGNoaWxkLCBzdGF0dXMgPT09ICdjbGVhbicpKTtcblx0XHRcdFx0Y2hpbGQgPSBjaGlsZC5uZXh0O1xuXHRcdFx0fVxuXG5cdFx0XHRicmFuY2hlcy5wdXNoKHtcblx0XHRcdFx0ZWZmZWN0OiBlZmYsXG5cdFx0XHRcdHN0YXR1cyxcblx0XHRcdFx0cGFyZW50X2NsZWFuLFxuXHRcdFx0XHRjaGlsZHJlbjogY2hpbGRfYnJhbmNoZXNcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBOb3QgYSBicmFuY2gsIGNvbnRpbnVlIHRyYXZlcnNpbmdcblx0XHRcdGxldCBjaGlsZCA9IGVmZi5maXJzdDtcblx0XHRcdHdoaWxlIChjaGlsZCAhPT0gbnVsbCkge1xuXHRcdFx0XHRicmFuY2hlcy5wdXNoKC4uLmNvbGxlY3RfYnJhbmNoZXMoY2hpbGQsIHBhcmVudF9jbGVhbikpO1xuXHRcdFx0XHRjaGlsZCA9IGNoaWxkLm5leHQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGJyYW5jaGVzO1xuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiBhIGJyYW5jaCB0cmVlIGNvbnRhaW5zIGFueSBpbmNvbnNpc3RlbmNpZXMgKG5vbi1jbGVhbiBiZWxvdyBjbGVhbilcblx0ICogQHBhcmFtIHtCcmFuY2hJbmZvfSBicmFuY2hcblx0ICogQHBhcmFtIHtib29sZWFufSBhbmNlc3Rvcl9jbGVhblxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdGZ1bmN0aW9uIGhhc19pbmNvbnNpc3RlbmN5KGJyYW5jaCwgYW5jZXN0b3JfY2xlYW4pIHtcblx0XHRjb25zdCBpc19pbmNvbnNpc3RlbnQgPSBhbmNlc3Rvcl9jbGVhbiAmJiBicmFuY2guc3RhdHVzICE9PSAnY2xlYW4nO1xuXHRcdGlmIChpc19pbmNvbnNpc3RlbnQpIHJldHVybiB0cnVlO1xuXG5cdFx0Y29uc3QgbmV3X2FuY2VzdG9yX2NsZWFuID0gYW5jZXN0b3JfY2xlYW4gfHwgYnJhbmNoLnN0YXR1cyA9PT0gJ2NsZWFuJztcblx0XHRmb3IgKGNvbnN0IGNoaWxkIG9mIGJyYW5jaC5jaGlsZHJlbikge1xuXHRcdFx0aWYgKGhhc19pbmNvbnNpc3RlbmN5KGNoaWxkLCBuZXdfYW5jZXN0b3JfY2xlYW4pKSByZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIExvZ3MgYSBicmFuY2ggYW5kIGl0cyBjaGlsZHJlbiwgYnV0IG9ubHkgaWYgdGhlcmUgYXJlIGluY29uc2lzdGVuY2llc1xuXHQgKiBAcGFyYW0ge0JyYW5jaEluZm99IGJyYW5jaFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGFuY2VzdG9yX2NsZWFuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBkZXB0aFxuXHQgKi9cblx0ZnVuY3Rpb24gbG9nX2JyYW5jaChicmFuY2gsIGFuY2VzdG9yX2NsZWFuLCBkZXB0aCkge1xuXHRcdGNvbnN0IGlzX2luY29uc2lzdGVudCA9IGFuY2VzdG9yX2NsZWFuICYmIGJyYW5jaC5zdGF0dXMgIT09ICdjbGVhbic7XG5cdFx0Y29uc3QgbmV3X2FuY2VzdG9yX2NsZWFuID0gYW5jZXN0b3JfY2xlYW4gfHwgYnJhbmNoLnN0YXR1cyA9PT0gJ2NsZWFuJztcblxuXHRcdC8vIE9ubHkgbG9nIGlmIHRoaXMgYnJhbmNoIG9yIGFueSBkZXNjZW5kYW50IGhhcyBhbiBpbmNvbnNpc3RlbmN5XG5cdFx0aWYgKCFoYXNfaW5jb25zaXN0ZW5jeShicmFuY2gsIGFuY2VzdG9yX2NsZWFuKSAmJiAhaXNfaW5jb25zaXN0ZW50KSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3R5bGUgPSBpc19pbmNvbnNpc3RlbnRcblx0XHRcdD8gJ2ZvbnQtd2VpZ2h0OiBib2xkOyBjb2xvcjogcmVkJ1xuXHRcdFx0OiBicmFuY2guc3RhdHVzID09PSAnY2xlYW4nXG5cdFx0XHRcdD8gJ2ZvbnQtd2VpZ2h0OiBub3JtYWw7IGNvbG9yOiBncmVlbidcblx0XHRcdFx0OiAnZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiBvcmFuZ2UnO1xuXG5cdFx0Y29uc3Qgd2FybmluZyA9IGlzX2luY29uc2lzdGVudCA/ICcg4pqg77iPIElOQ09OU0lTVEVOVCcgOiAnJztcblxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0Y29uc29sZS5ncm91cChgJWNicmFuY2ggKCR7YnJhbmNoLnN0YXR1c30pJHt3YXJuaW5nfWAsIHN0eWxlKTtcblxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0Y29uc29sZS5sb2coJyVjZWZmZWN0OicsICdmb250LXdlaWdodDogYm9sZCcsIGJyYW5jaC5lZmZlY3QpO1xuXG5cdFx0aWYgKGJyYW5jaC5lZmZlY3QuZm4pIHtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG5cdFx0XHRjb25zb2xlLmxvZygnJWNmbjonLCAnZm9udC13ZWlnaHQ6IGJvbGQnLCBicmFuY2guZWZmZWN0LmZuKTtcblx0XHR9XG5cblx0XHRpZiAoYnJhbmNoLmVmZmVjdC5kZXBzICE9PSBudWxsKSB7XG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdFx0Y29uc29sZS5ncm91cENvbGxhcHNlZCgnJWNkZXBzJywgJ2ZvbnQtd2VpZ2h0OiBub3JtYWwnKTtcblx0XHRcdGZvciAoY29uc3QgZGVwIG9mIGJyYW5jaC5lZmZlY3QuZGVwcykge1xuXHRcdFx0XHRsb2dfZGVwKGRlcCk7XG5cdFx0XHR9XG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdFx0Y29uc29sZS5ncm91cEVuZCgpO1xuXHRcdH1cblxuXHRcdGlmIChpc19pbmNvbnNpc3RlbnQpIHtcblx0XHRcdGxvZ19lZmZlY3RfdHJlZShicmFuY2guZWZmZWN0KTtcblx0XHR9IGVsc2UgaWYgKGJyYW5jaC5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdFx0Y29uc29sZS5ncm91cCgnJWNjaGlsZCBicmFuY2hlcycsICdmb250LXdlaWdodDogYm9sZCcpO1xuXHRcdFx0Zm9yIChjb25zdCBjaGlsZCBvZiBicmFuY2guY2hpbGRyZW4pIHtcblx0XHRcdFx0bG9nX2JyYW5jaChjaGlsZCwgbmV3X2FuY2VzdG9yX2NsZWFuLCBkZXB0aCArIDEpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRcdGNvbnNvbGUuZ3JvdXBFbmQoKTtcblx0XHR9XG5cblx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdGNvbnNvbGUuZ3JvdXBFbmQoKTtcblx0fVxuXG5cdGNvbnN0IGJyYW5jaGVzID0gY29sbGVjdF9icmFuY2hlcyhyb290X2VmZmVjdCwgZmFsc2UpO1xuXG5cdC8vIENoZWNrIGlmIHRoZXJlIGFyZSBhbnkgaW5jb25zaXN0ZW5jaWVzIGF0IGFsbFxuXHRsZXQgaGFzX2FueV9pbmNvbnNpc3RlbmN5ID0gZmFsc2U7XG5cdGZvciAoY29uc3QgYnJhbmNoIG9mIGJyYW5jaGVzKSB7XG5cdFx0aWYgKGhhc19pbmNvbnNpc3RlbmN5KGJyYW5jaCwgZmFsc2UpKSB7XG5cdFx0XHRoYXNfYW55X2luY29uc2lzdGVuY3kgPSB0cnVlO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFoYXNfYW55X2luY29uc2lzdGVuY3kpIHtcblx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdGNvbnNvbGUubG9nKCclY05vIGluY29uc2lzdGVudCBicmFuY2hlcyBmb3VuZCcsICdmb250LXdlaWdodDogYm9sZDsgY29sb3I6IGdyZWVuJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0Y29uc29sZS5ncm91cChgJWNJbmNvbnNpc3RlbnQgQnJhbmNoZXMgKG5vbi1jbGVhbiBiZWxvdyBjbGVhbilgLCAnZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiByZWQnKTtcblxuXHRmb3IgKGNvbnN0IGJyYW5jaCBvZiBicmFuY2hlcykge1xuXHRcdGxvZ19icmFuY2goYnJhbmNoLCBmYWxzZSwgMCk7XG5cdH1cblxuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRjb25zb2xlLmdyb3VwRW5kKCk7XG5cblx0cmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogU3RyaW5naWZ5IGEgZGVyaXZlZCBmdW5jdGlvbiwgcmVtb3ZpbmcgYCQudHJhY2tfcmVhY3Rpdml0eV9sb3NzYCBhbmQgYCQuZ2V0YCBldGNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnlfZGVyaXZlZChmbikge1xuXHRyZXR1cm4gYHske2ZuXG5cdFx0LnRvU3RyaW5nKClcblx0XHQucmVwbGFjZSgvXmFzeW5jIFxcKFxcKSA9PiAvLCAnJylcblx0XHQucmVwbGFjZSgvXlxcKC8sICcnKVxuXHRcdC5yZXBsYWNlKC9cXCRcXC5nZXRcXCgoLis/KVxcKS9nLCAoXywgbmFtZSkgPT4gbmFtZSlcblx0XHQucmVwbGFjZSgvXFwkXFwudHJhY2tfcmVhY3Rpdml0eV9sb3NzXFwoKC4rPylcXClcXChcXCkvZywgKF8sIG5hbWUpID0+IG5hbWUpXG5cdFx0LnJlcGxhY2UoL1xcKSQvLCAnJyl9fWA7XG59XG4iLCJpbXBvcnQgeyBoeWRyYXRpbmcgfSBmcm9tICcuLi9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgY2xlYXJfdGV4dF9jb250ZW50LCBnZXRfZmlyc3RfY2hpbGQgfSBmcm9tICcuLi9vcGVyYXRpb25zLmpzJztcbmltcG9ydCB7IHF1ZXVlX21pY3JvX3Rhc2sgfSBmcm9tICcuLi90YXNrLmpzJztcbmltcG9ydCB7IEZPUk1fUkVTRVRfSEFORExFUiB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy5qcyc7XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZG9tXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF1dG9mb2N1cyhkb20sIHZhbHVlKSB7XG5cdGlmICh2YWx1ZSkge1xuXHRcdGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXHRcdGRvbS5hdXRvZm9jdXMgPSB0cnVlO1xuXG5cdFx0cXVldWVfbWljcm9fdGFzaygoKSA9PiB7XG5cdFx0XHRpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gYm9keSkge1xuXHRcdFx0XHRkb20uZm9jdXMoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufVxuXG4vKipcbiAqIFRoZSBjaGlsZCBvZiBhIHRleHRhcmVhIGFjdHVhbGx5IGNvcnJlc3BvbmRzIHRvIHRoZSBkZWZhdWx0VmFsdWUgcHJvcGVydHksIHNvIHdlIG5lZWRcbiAqIHRvIHJlbW92ZSBpdCB1cG9uIGh5ZHJhdGlvbiB0byBhdm9pZCBhIGJ1ZyB3aGVuIHNvbWVvbmUgcmVzZXRzIHRoZSBmb3JtIHZhbHVlLlxuICogQHBhcmFtIHtIVE1MVGV4dEFyZWFFbGVtZW50fSBkb21cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlX3RleHRhcmVhX2NoaWxkKGRvbSkge1xuXHRpZiAoaHlkcmF0aW5nICYmIGdldF9maXJzdF9jaGlsZChkb20pICE9PSBudWxsKSB7XG5cdFx0Y2xlYXJfdGV4dF9jb250ZW50KGRvbSk7XG5cdH1cbn1cblxubGV0IGxpc3RlbmluZ190b19mb3JtX3Jlc2V0ID0gZmFsc2U7XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRfZm9ybV9yZXNldF9saXN0ZW5lcigpIHtcblx0aWYgKCFsaXN0ZW5pbmdfdG9fZm9ybV9yZXNldCkge1xuXHRcdGxpc3RlbmluZ190b19mb3JtX3Jlc2V0ID0gdHJ1ZTtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0J3Jlc2V0Jyxcblx0XHRcdChldnQpID0+IHtcblx0XHRcdFx0Ly8gTmVlZHMgdG8gaGFwcGVuIG9uZSB0aWNrIGxhdGVyIG9yIGVsc2UgdGhlIGRvbSBwcm9wZXJ0aWVzIG9mIHRoZSBmb3JtXG5cdFx0XHRcdC8vIGVsZW1lbnRzIGhhdmUgbm90IHVwZGF0ZWQgdG8gdGhlaXIgcmVzZXQgdmFsdWVzIHlldFxuXHRcdFx0XHRQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRpZiAoIWV2dC5kZWZhdWx0UHJldmVudGVkKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IGUgb2YgLyoqQHR5cGUge0hUTUxGb3JtRWxlbWVudH0gKi8gKGV2dC50YXJnZXQpLmVsZW1lbnRzKSB7XG5cdFx0XHRcdFx0XHRcdC8qKiBAdHlwZSB7YW55fSAqLyAoZSlbRk9STV9SRVNFVF9IQU5ETEVSXT8uKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHQvLyBJbiB0aGUgY2FwdHVyZSBwaGFzZSB0byBndWFyYW50ZWUgd2UgZ2V0IG5vdGljZWQgb2YgaXQgKG5vIHBvc3NpYmlsaXR5IG9mIHN0b3BQcm9wYWdhdGlvbilcblx0XHRcdHsgY2FwdHVyZTogdHJ1ZSB9XG5cdFx0KTtcblx0fVxufVxuIiwiaW1wb3J0IHsgdGVhcmRvd24gfSBmcm9tICcuLi8uLi8uLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHtcblx0YWN0aXZlX2VmZmVjdCxcblx0YWN0aXZlX3JlYWN0aW9uLFxuXHRzZXRfYWN0aXZlX2VmZmVjdCxcblx0c2V0X2FjdGl2ZV9yZWFjdGlvblxufSBmcm9tICcuLi8uLi8uLi9ydW50aW1lLmpzJztcbmltcG9ydCB7IEZPUk1fUkVTRVRfSEFORExFUiB9IGZyb20gJy4uLy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBhZGRfZm9ybV9yZXNldF9saXN0ZW5lciB9IGZyb20gJy4uL21pc2MuanMnO1xuXG4vKipcbiAqIEZpcmVzIHRoZSBoYW5kbGVyIG9uY2UgaW1tZWRpYXRlbHkgKHVubGVzcyBjb3JyZXNwb25kaW5nIGFyZyBpcyBzZXQgdG8gYGZhbHNlYCksXG4gKiB0aGVuIGxpc3RlbnMgdG8gdGhlIGdpdmVuIGV2ZW50cyB1bnRpbCB0aGUgcmVuZGVyIGVmZmVjdCBjb250ZXh0IGlzIGRlc3Ryb3llZFxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0XG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZz59IGV2ZW50c1xuICogQHBhcmFtIHsoZXZlbnQ/OiBFdmVudCkgPT4gdm9pZH0gaGFuZGxlclxuICogQHBhcmFtIHthbnl9IGNhbGxfaGFuZGxlcl9pbW1lZGlhdGVseVxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlzdGVuKHRhcmdldCwgZXZlbnRzLCBoYW5kbGVyLCBjYWxsX2hhbmRsZXJfaW1tZWRpYXRlbHkgPSB0cnVlKSB7XG5cdGlmIChjYWxsX2hhbmRsZXJfaW1tZWRpYXRlbHkpIHtcblx0XHRoYW5kbGVyKCk7XG5cdH1cblxuXHRmb3IgKHZhciBuYW1lIG9mIGV2ZW50cykge1xuXHRcdHRhcmdldC5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGhhbmRsZXIpO1xuXHR9XG5cblx0dGVhcmRvd24oKCkgPT4ge1xuXHRcdGZvciAodmFyIG5hbWUgb2YgZXZlbnRzKSB7XG5cdFx0XHR0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyKTtcblx0XHR9XG5cdH0pO1xufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0geygpID0+IFR9IGZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRob3V0X3JlYWN0aXZlX2NvbnRleHQoZm4pIHtcblx0dmFyIHByZXZpb3VzX3JlYWN0aW9uID0gYWN0aXZlX3JlYWN0aW9uO1xuXHR2YXIgcHJldmlvdXNfZWZmZWN0ID0gYWN0aXZlX2VmZmVjdDtcblx0c2V0X2FjdGl2ZV9yZWFjdGlvbihudWxsKTtcblx0c2V0X2FjdGl2ZV9lZmZlY3QobnVsbCk7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIGZuKCk7XG5cdH0gZmluYWxseSB7XG5cdFx0c2V0X2FjdGl2ZV9yZWFjdGlvbihwcmV2aW91c19yZWFjdGlvbik7XG5cdFx0c2V0X2FjdGl2ZV9lZmZlY3QocHJldmlvdXNfZWZmZWN0KTtcblx0fVxufVxuXG4vKipcbiAqIExpc3RlbiB0byB0aGUgZ2l2ZW4gZXZlbnQsIGFuZCB0aGVuIGluc3RhbnRpYXRlIGEgZ2xvYmFsIGZvcm0gcmVzZXQgbGlzdGVuZXIgaWYgbm90IGFscmVhZHkgZG9uZSxcbiAqIHRvIG5vdGlmeSBhbGwgYmluZGluZ3Mgd2hlbiB0aGUgZm9ybSBpcyByZXNldFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0geyhpc19yZXNldD86IHRydWUpID0+IHZvaWR9IGhhbmRsZXJcbiAqIEBwYXJhbSB7KGlzX3Jlc2V0PzogdHJ1ZSkgPT4gdm9pZH0gW29uX3Jlc2V0XVxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlzdGVuX3RvX2V2ZW50X2FuZF9yZXNldF9ldmVudChlbGVtZW50LCBldmVudCwgaGFuZGxlciwgb25fcmVzZXQgPSBoYW5kbGVyKSB7XG5cdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgKCkgPT4gd2l0aG91dF9yZWFjdGl2ZV9jb250ZXh0KGhhbmRsZXIpKTtcblx0Y29uc3QgcHJldiA9IC8qKiBAdHlwZSB7YW55fSAqLyAoZWxlbWVudClbRk9STV9SRVNFVF9IQU5ETEVSXTtcblx0aWYgKHByZXYpIHtcblx0XHQvLyBzcGVjaWFsIGNhc2UgZm9yIGNoZWNrYm94IHRoYXQgY2FuIGhhdmUgbXVsdGlwbGUgYmluZHMgKGdyb3VwICYgY2hlY2tlZClcblx0XHQvKiogQHR5cGUge2FueX0gKi8gKGVsZW1lbnQpW0ZPUk1fUkVTRVRfSEFORExFUl0gPSAoKSA9PiB7XG5cdFx0XHRwcmV2KCk7XG5cdFx0XHRvbl9yZXNldCh0cnVlKTtcblx0XHR9O1xuXHR9IGVsc2Uge1xuXHRcdC8qKiBAdHlwZSB7YW55fSAqLyAoZWxlbWVudClbRk9STV9SRVNFVF9IQU5ETEVSXSA9ICgpID0+IG9uX3Jlc2V0KHRydWUpO1xuXHR9XG5cblx0YWRkX2Zvcm1fcmVzZXRfbGlzdGVuZXIoKTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgQmxvY2tlciwgRWZmZWN0LCBTb3VyY2UsIFZhbHVlIH0gZnJvbSAnI2NsaWVudCcgKi9cbmltcG9ydCB7IERFU1RST1lFRCwgU1RBTEVfUkVBQ1RJT04gfSBmcm9tICcjY2xpZW50L2NvbnN0YW50cyc7XG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7XG5cdGNvbXBvbmVudF9jb250ZXh0LFxuXHRkZXZfc3RhY2ssXG5cdGlzX3J1bmVzLFxuXHRzZXRfY29tcG9uZW50X2NvbnRleHQsXG5cdHNldF9kZXZfc3RhY2tcbn0gZnJvbSAnLi4vY29udGV4dC5qcyc7XG5pbXBvcnQgeyBpbnZva2VfZXJyb3JfYm91bmRhcnkgfSBmcm9tICcuLi9lcnJvci1oYW5kbGluZy5qcyc7XG5pbXBvcnQge1xuXHRhY3RpdmVfZWZmZWN0LFxuXHRhY3RpdmVfcmVhY3Rpb24sXG5cdHNldF9hY3RpdmVfZWZmZWN0LFxuXHRzZXRfYWN0aXZlX3JlYWN0aW9uXG59IGZyb20gJy4uL3J1bnRpbWUuanMnO1xuaW1wb3J0IHsgQmF0Y2gsIGN1cnJlbnRfYmF0Y2ggfSBmcm9tICcuL2JhdGNoLmpzJztcbmltcG9ydCB7XG5cdGFzeW5jX2Rlcml2ZWQsXG5cdHJlYWN0aXZpdHlfbG9zc190cmFja2VyLFxuXHRkZXJpdmVkLFxuXHRkZXJpdmVkX3NhZmVfZXF1YWwsXG5cdHNldF9yZWFjdGl2aXR5X2xvc3NfdHJhY2tlclxufSBmcm9tICcuL2Rlcml2ZWRzLmpzJztcbmltcG9ydCB7IGFib3J0ZWQgfSBmcm9tICcuL2VmZmVjdHMuanMnO1xuXG4vKipcbiAqIEBwYXJhbSB7QmxvY2tlcltdfSBibG9ja2Vyc1xuICogQHBhcmFtIHtBcnJheTwoKSA9PiBhbnk+fSBzeW5jXG4gKiBAcGFyYW0ge0FycmF5PCgpID0+IFByb21pc2U8YW55Pj59IGFzeW5jXG4gKiBAcGFyYW0geyh2YWx1ZXM6IFZhbHVlW10pID0+IGFueX0gZm5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4oYmxvY2tlcnMsIHN5bmMsIGFzeW5jLCBmbikge1xuXHRjb25zdCBkID0gaXNfcnVuZXMoKSA/IGRlcml2ZWQgOiBkZXJpdmVkX3NhZmVfZXF1YWw7XG5cblx0Ly8gRmlsdGVyIG91dCBhbHJlYWR5LXNldHRsZWQgYmxvY2tlcnMgLSBubyBuZWVkIHRvIHdhaXQgZm9yIHRoZW1cblx0dmFyIHBlbmRpbmcgPSBibG9ja2Vycy5maWx0ZXIoKGIpID0+ICFiLnNldHRsZWQpO1xuXG5cdHZhciBkZXJpdmVkcyA9IHN5bmMubWFwKGQpO1xuXG5cdGlmIChERVYpIHtcblx0XHRkZXJpdmVkcy5mb3JFYWNoKChkLCBpKSA9PiB7XG5cdFx0XHQvLyBUT0RPIHRoaXMgaXMga2luZGEgdXNlZnVsIGZvciBkZWJ1Z2dpbmcgYnV0IGEgbG91c3kgaW1wbGVtZW50YXRpb24g4oCUXG5cdFx0XHQvLyBtYXliZSB0aGUgY29tcGlsZXIgY291bGQgcGFzcyB0aHJvdWdoIHRoZSB0ZW1wbGF0ZSBzdHJpbmdcblx0XHRcdGQubGFiZWwgPSBzeW5jW2ldXG5cdFx0XHRcdC50b1N0cmluZygpXG5cdFx0XHRcdC5yZXBsYWNlKCcoKSA9PiAnLCAnJylcblx0XHRcdFx0LnJlcGxhY2VBbGwoJyQuZWFnZXIoKCkgPT4gJywgJyRzdGF0ZS5lYWdlcignKVxuXHRcdFx0XHQucmVwbGFjZSgvXFwkXFwuZ2V0XFwoKC4rPylcXCkvZywgKF8sIGlkKSA9PiBpZCk7XG5cdFx0fSk7XG5cdH1cblxuXHRpZiAoYXN5bmMubGVuZ3RoID09PSAwICYmIHBlbmRpbmcubGVuZ3RoID09PSAwKSB7XG5cdFx0Zm4oZGVyaXZlZHMpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdHZhciBwYXJlbnQgPSAvKiogQHR5cGUge0VmZmVjdH0gKi8gKGFjdGl2ZV9lZmZlY3QpO1xuXG5cdHZhciByZXN0b3JlID0gY2FwdHVyZSgpO1xuXHR2YXIgYmxvY2tlcl9wcm9taXNlID1cblx0XHRwZW5kaW5nLmxlbmd0aCA9PT0gMVxuXHRcdFx0PyBwZW5kaW5nWzBdLnByb21pc2Vcblx0XHRcdDogcGVuZGluZy5sZW5ndGggPiAxXG5cdFx0XHRcdD8gUHJvbWlzZS5hbGwocGVuZGluZy5tYXAoKGIpID0+IGIucHJvbWlzZSkpXG5cdFx0XHRcdDogbnVsbDtcblxuXHQvKipcblx0ICogQHBhcmFtIHtTb3VyY2VbXX0gYXN5bmNcblx0ICovXG5cdGZ1bmN0aW9uIGZpbmlzaChhc3luYykge1xuXHRcdGlmICgocGFyZW50LmYgJiBERVNUUk9ZRUQpICE9PSAwKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmVzdG9yZSgpO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGZuKFsuLi5kZXJpdmVkcywgLi4uYXN5bmNdKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0aW52b2tlX2Vycm9yX2JvdW5kYXJ5KGVycm9yLCBwYXJlbnQpO1xuXHRcdH1cblxuXHRcdHVuc2V0X2NvbnRleHQoKTtcblx0fVxuXG5cdHZhciBkZWNyZW1lbnRfcGVuZGluZyA9IGluY3JlbWVudF9wZW5kaW5nKCk7XG5cblx0Ly8gRmFzdCBwYXRoOiBibG9ja2VycyBidXQgbm8gYXN5bmMgZXhwcmVzc2lvbnNcblx0aWYgKGFzeW5jLmxlbmd0aCA9PT0gMCkge1xuXHRcdC8qKiBAdHlwZSB7UHJvbWlzZTxhbnk+fSAqLyAoYmxvY2tlcl9wcm9taXNlKS50aGVuKCgpID0+IGZpbmlzaChbXSkpLmZpbmFsbHkoZGVjcmVtZW50X3BlbmRpbmcpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdC8vIEZ1bGwgcGF0aDogaGFzIGFzeW5jIGV4cHJlc3Npb25zXG5cdGZ1bmN0aW9uIHJ1bigpIHtcblx0XHRQcm9taXNlLmFsbChhc3luYy5tYXAoKGV4cHJlc3Npb24pID0+IGFzeW5jX2Rlcml2ZWQoZXhwcmVzc2lvbikpKVxuXHRcdFx0LnRoZW4oZmluaXNoKVxuXHRcdFx0LmNhdGNoKChlcnJvcikgPT4gaW52b2tlX2Vycm9yX2JvdW5kYXJ5KGVycm9yLCBwYXJlbnQpKVxuXHRcdFx0LmZpbmFsbHkoZGVjcmVtZW50X3BlbmRpbmcpO1xuXHR9XG5cblx0aWYgKGJsb2NrZXJfcHJvbWlzZSkge1xuXHRcdGJsb2NrZXJfcHJvbWlzZS50aGVuKCgpID0+IHtcblx0XHRcdGlmICgocGFyZW50LmYgJiBERVNUUk9ZRUQpICE9PSAwKSB7XG5cdFx0XHRcdGRlY3JlbWVudF9wZW5kaW5nKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0cmVzdG9yZSgpO1xuXHRcdFx0cnVuKCk7XG5cdFx0XHR1bnNldF9jb250ZXh0KCk7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0cnVuKCk7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0Jsb2NrZXJbXX0gYmxvY2tlcnNcbiAqIEBwYXJhbSB7KHZhbHVlczogVmFsdWVbXSkgPT4gYW55fSBmblxuICovXG5leHBvcnQgZnVuY3Rpb24gcnVuX2FmdGVyX2Jsb2NrZXJzKGJsb2NrZXJzLCBmbikge1xuXHRmbGF0dGVuKGJsb2NrZXJzLCBbXSwgW10sIGZuKTtcbn1cblxuLyoqXG4gKiBDYXB0dXJlcyB0aGUgY3VycmVudCBlZmZlY3QgY29udGV4dCBzbyB0aGF0IHdlIGNhbiByZXN0b3JlIGl0IGFmdGVyXG4gKiBzb21lIGFzeW5jaHJvbm91cyB3b3JrIGhhcyBoYXBwZW5lZCAoc28gdGhhdCBlLmcuIGBhd2FpdCBhICsgYmBcbiAqIGNhdXNlcyBgYmAgdG8gYmUgcmVnaXN0ZXJlZCBhcyBhIGRlcGVuZGVuY3kpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FwdHVyZSgpIHtcblx0dmFyIHByZXZpb3VzX2VmZmVjdCA9IC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAoYWN0aXZlX2VmZmVjdCk7XG5cdHZhciBwcmV2aW91c19yZWFjdGlvbiA9IGFjdGl2ZV9yZWFjdGlvbjtcblx0dmFyIHByZXZpb3VzX2NvbXBvbmVudF9jb250ZXh0ID0gY29tcG9uZW50X2NvbnRleHQ7XG5cdHZhciBwcmV2aW91c19iYXRjaCA9IC8qKiBAdHlwZSB7QmF0Y2h9ICovIChjdXJyZW50X2JhdGNoKTtcblxuXHRpZiAoREVWKSB7XG5cdFx0dmFyIHByZXZpb3VzX2Rldl9zdGFjayA9IGRldl9zdGFjaztcblx0fVxuXG5cdHJldHVybiBmdW5jdGlvbiByZXN0b3JlKGFjdGl2YXRlX2JhdGNoID0gdHJ1ZSkge1xuXHRcdHNldF9hY3RpdmVfZWZmZWN0KHByZXZpb3VzX2VmZmVjdCk7XG5cdFx0c2V0X2FjdGl2ZV9yZWFjdGlvbihwcmV2aW91c19yZWFjdGlvbik7XG5cdFx0c2V0X2NvbXBvbmVudF9jb250ZXh0KHByZXZpb3VzX2NvbXBvbmVudF9jb250ZXh0KTtcblxuXHRcdGlmIChhY3RpdmF0ZV9iYXRjaCAmJiAocHJldmlvdXNfZWZmZWN0LmYgJiBERVNUUk9ZRUQpID09PSAwKSB7XG5cdFx0XHQvLyBUT0RPIHdlIG9ubHkgbmVlZCBvcHRpb25hbCBjaGFpbmluZyBoZXJlIGJlY2F1c2UgYHsjYXdhaXQgLi4ufWAgYmxvY2tzXG5cdFx0XHQvLyBhcmUgYW5vbWFsb3VzLiBPbmNlIHdlIHJldGlyZSB0aGVtIHdlIGNhbiBnZXQgcmlkIG9mIGl0XG5cdFx0XHRwcmV2aW91c19iYXRjaD8uYWN0aXZhdGUoKTtcblx0XHRcdHByZXZpb3VzX2JhdGNoPy5hcHBseSgpO1xuXHRcdH1cblxuXHRcdGlmIChERVYpIHtcblx0XHRcdHNldF9yZWFjdGl2aXR5X2xvc3NfdHJhY2tlcihudWxsKTtcblx0XHRcdHNldF9kZXZfc3RhY2socHJldmlvdXNfZGV2X3N0YWNrKTtcblx0XHR9XG5cdH07XG59XG5cbi8qKiBgdHJ1ZWAgYmV0d2VlbiBhIGBzYXZlYCB0aHVuayByZXN0b3JpbmcgYSBjb250ZXh0IGFuZCB0aGUgZW5kIG9mIHRoYXQgc3luY2hyb25vdXMgc2VnbWVudCAqL1xudmFyIHJlc3RvcmVkID0gZmFsc2U7XG5cbi8qKlxuICogV3JhcHMgYW4gYGF3YWl0YCBleHByZXNzaW9uIGluIHN1Y2ggYSB3YXkgdGhhdCB0aGUgZWZmZWN0IGNvbnRleHQgdGhhdCB3YXNcbiAqIGFjdGl2ZSBiZWZvcmUgdGhlIGV4cHJlc3Npb24gZXZhbHVhdGVkIGNhbiBiZSByZWFwcGxpZWQgYWZ0ZXJ3YXJkcyDigJRcbiAqIGBhd2FpdCBhICsgYmAgYmVjb21lcyBgKGF3YWl0ICQuc2F2ZShhKSkoKSArIGJgXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtQcm9taXNlPFQ+fSBwcm9taXNlXG4gKiBAcmV0dXJucyB7UHJvbWlzZTwoKSA9PiBUPn1cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhdmUocHJvbWlzZSkge1xuXHR2YXIgcmVzdG9yZSA9IGNhcHR1cmUoKTtcblx0Ly8gdGhlIGNvbnRleHQgcmVzdG9yZWQgYnkgYW4gZWFybGllciBgc2F2ZWAgaW4gdGhpcyBleHByZXNzaW9uIG11c3Qgbm90XG5cdC8vIG91dGxpdmUgdGhlIHN5bmNocm9ub3VzIHNlZ21lbnQgdGhhdCBpcyBhYm91dCB0byBlbmQgYXQgdGhpcyBgYXdhaXRgXG5cdHVuc2F2ZSgpO1xuXHR2YXIgdmFsdWUgPSBhd2FpdCBwcm9taXNlO1xuXG5cdHJldHVybiAoKSA9PiB7XG5cdFx0cmVzdG9yZSgpO1xuXHRcdHJlc3RvcmVkID0gdHJ1ZTtcblx0XHRyZXR1cm4gdmFsdWU7XG5cdH07XG59XG5cbi8qKlxuICogVW5zZXQgdGhlIGNvbnRleHQgaWYgYSBgc2F2ZWAgdGh1bmsgcmVzdG9yZWQgaXQgaW4gdGhlIGN1cnJlbnQgc3luY2hyb25vdXMgc2VnbWVudCxcbiAqIHNvIHRoYXQgYSBmb3JlaWduIG1pY3JvdGFzayBjYW4gbmV2ZXIgcnVuIGluc2lkZSBhIHJlc3RvcmVkIHJlYWN0aW9uIGNvbnRleHQuXG4gKiBDYWxsZWQgYXQgZXZlcnkgc3VzcGVuc2lvbiBwb2ludCwgYW5kIGF0IHRoZSBlbmQgb2YgYXN5bmMgZXhwcmVzc2lvbiBib2RpZXMg4oCUXG4gKiBgYXN5bmMgKCkgPT4gKGF3YWl0ICQuc2F2ZShhKSkoKS5iYCBiZWNvbWVzIGBhc3luYyAoKSA9PiB7IHRyeSB7IHJldHVybiAoYXdhaXQgJC5zYXZlKGEpKSgpLmI7IH0gZmluYWxseSB7ICQudW5zYXZlKCk7IH0gfWBcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1R9IFt2YWx1ZV1cbiAqIEByZXR1cm5zIHtUfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5zYXZlKHZhbHVlKSB7XG5cdGlmIChyZXN0b3JlZCkgdW5zZXRfY29udGV4dCgpO1xuXHRyZXR1cm4gLyoqIEB0eXBlIHtUfSAqLyAodmFsdWUpO1xufVxuXG4vKipcbiAqIFJlc2V0IGBjdXJyZW50X2FzeW5jX2VmZmVjdGAgYWZ0ZXIgdGhlIGBwcm9taXNlYCByZXNvbHZlcywgc29cbiAqIHRoYXQgd2UgY2FuIGVtaXQgYGF3YWl0X3JlYWN0aXZpdHlfbG9zc2Agd2FybmluZ3NcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1Byb21pc2U8VD59IHByb21pc2VcbiAqIEByZXR1cm5zIHtQcm9taXNlPCgpID0+IFQ+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdHJhY2tfcmVhY3Rpdml0eV9sb3NzKHByb21pc2UpIHtcblx0dW5zYXZlKCk7XG5cdHZhciBwcmV2aW91c19yZWFjdGl2aXR5X2xvc3NfdHJhY2tlciA9IHJlYWN0aXZpdHlfbG9zc190cmFja2VyO1xuXHQvLyBFbnN1cmUgdGhhdCB1bnJlbGF0ZWQgcmVhZHMgYWZ0ZXIgYW4gYXN5bmMgb3BlcmF0aW9uIGlzIGtpY2tlZCBvZmYgZG9uJ3QgY2F1c2UgZmFsc2UgcG9zaXRpdmVzXG5cdHF1ZXVlTWljcm90YXNrKCgpID0+IHtcblx0XHRpZiAocmVhY3Rpdml0eV9sb3NzX3RyYWNrZXIgPT09IHByZXZpb3VzX3JlYWN0aXZpdHlfbG9zc190cmFja2VyKSB7XG5cdFx0XHRzZXRfcmVhY3Rpdml0eV9sb3NzX3RyYWNrZXIobnVsbCk7XG5cdFx0fVxuXHR9KTtcblxuXHR2YXIgdmFsdWUgPSBhd2FpdCBwcm9taXNlO1xuXG5cdHJldHVybiAoKSA9PiB7XG5cdFx0c2V0X3JlYWN0aXZpdHlfbG9zc190cmFja2VyKHByZXZpb3VzX3JlYWN0aXZpdHlfbG9zc190cmFja2VyKTtcblx0XHQvLyBXaGlsZSB0aGlzIGNhbiByZXN1bHQgaW4gZmFsc2UgbmVnYXRpdmVzIGl0IGFsc28gZ3VhcmRzIGFnYWluc3QgdGhlIG1vcmUgaW1wb3J0YW50XG5cdFx0Ly8gZmFsc2UgcG9zaXRpdmVzIHRoYXQgd291bGQgb2NjdXIgaWYgdGhpcyBpcyB0aGUgbGFzdCBpbiBhIGNoYWluIG9mIGFzeW5jIG9wZXJhdGlvbnMsXG5cdFx0Ly8gYW5kIHRoZSByZWFjdGl2aXR5X2xvc3NfdHJhY2tlciB3b3VsZCB0aGVuIHN0YXkgYXJvdW5kIHVudGlsIHRoZSBuZXh0IGFzeW5jIG9wZXJhdGlvbiBoYXBwZW5zLlxuXHRcdHF1ZXVlTWljcm90YXNrKCgpID0+IHtcblx0XHRcdGlmIChyZWFjdGl2aXR5X2xvc3NfdHJhY2tlciA9PT0gcHJldmlvdXNfcmVhY3Rpdml0eV9sb3NzX3RyYWNrZXIpIHtcblx0XHRcdFx0c2V0X3JlYWN0aXZpdHlfbG9zc190cmFja2VyKG51bGwpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHZhbHVlO1xuXHR9O1xufVxuXG4vKipcbiAqIFVzZWQgaW4gYGZvciBhd2FpdGAgbG9vcHMgaW4gREVWLCBzb1xuICogdGhhdCB3ZSBjYW4gZW1pdCBgYXdhaXRfcmVhY3Rpdml0eV9sb3NzYCB3YXJuaW5nc1xuICogYWZ0ZXIgZWFjaCBgYXN5bmNfaXRlcmF0b3JgIHJlc3VsdCByZXNvbHZlcyBhbmRcbiAqIGFmdGVyIHRoZSBgYXN5bmNfaXRlcmF0b3JgIHJldHVybiByZXNvbHZlcyAoaWYgaXQgcnVucylcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAdGVtcGxhdGUgVFJldHVyblxuICogQHBhcmFtIHtJdGVyYWJsZTxUPiB8IEFzeW5jSXRlcmFibGU8VD59IGl0ZXJhYmxlXG4gKiBAcmV0dXJucyB7QXN5bmNHZW5lcmF0b3I8VCwgVFJldHVybiB8IHVuZGVmaW5lZD59XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogZm9yX2F3YWl0X3RyYWNrX3JlYWN0aXZpdHlfbG9zcyhpdGVyYWJsZSkge1xuXHQvLyBUaGlzIGlzIGJhc2VkIG9uIHRoZSBhbGdvcml0aG1zIGRlc2NyaWJlZCBpbiBFQ01BLTI2Mjpcblx0Ly8gRm9ySW4vT2ZCb2R5RXZhbHVhdGlvblxuXHQvLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi9tdWx0aXBhZ2UvZWNtYXNjcmlwdC1sYW5ndWFnZS1zdGF0ZW1lbnRzLWFuZC1kZWNsYXJhdGlvbnMuaHRtbCNzZWMtcnVudGltZS1zZW1hbnRpY3MtZm9yaW4tZGl2LW9mYm9keWV2YWx1YXRpb24tbGhzLXN0bXQtaXRlcmF0b3ItbGhza2luZC1sYWJlbHNldFxuXHQvLyBBc3luY0l0ZXJhdG9yQ2xvc2Vcblx0Ly8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvbXVsdGlwYWdlL2Fic3RyYWN0LW9wZXJhdGlvbnMuaHRtbCNzZWMtYXN5bmNpdGVyYXRvcmNsb3NlXG5cblx0LyoqIEB0eXBlIHtBc3luY0l0ZXJhdG9yPFQsIFRSZXR1cm4+fSAqL1xuXHQvLyBAdHMtaWdub3JlXG5cdGNvbnN0IGl0ZXJhdG9yID0gaXRlcmFibGVbU3ltYm9sLmFzeW5jSXRlcmF0b3JdPy4oKSA/PyBpdGVyYWJsZVtTeW1ib2wuaXRlcmF0b3JdPy4oKTtcblxuXHRpZiAoaXRlcmF0b3IgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbHVlIGlzIG5vdCBhc3luYyBpdGVyYWJsZScpO1xuXHR9XG5cblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZWxlc3MtYXNzaWdubWVudFxuXHRsZXQgaW52b2tlX3JldHVybiA9IHRydWU7XG5cblx0dHJ5IHtcblx0XHR3aGlsZSAodHJ1ZSkge1xuXHRcdFx0Y29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gKGF3YWl0IHRyYWNrX3JlYWN0aXZpdHlfbG9zcyhpdGVyYXRvci5uZXh0KCkpKSgpO1xuXHRcdFx0aWYgKGRvbmUpIHtcblx0XHRcdFx0aW52b2tlX3JldHVybiA9IGZhbHNlO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHRcdHZhciBwcmV2ID0gcmVhY3Rpdml0eV9sb3NzX3RyYWNrZXI7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR5aWVsZCB2YWx1ZTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0c2V0X3JlYWN0aXZpdHlfbG9zc190cmFja2VyKHByZXYpO1xuXHRcdFx0XHQvLyBJZiB0aGUgeWllbGQgdGhyb3dzLCB3ZSBuZWVkIHRvIGNhbGwgYHJldHVybmAgYnV0IG5vdCByZXR1cm4gaXRzIHZhbHVlLCBpbnN0ZWFkIHJldGhyb3dcblx0XHRcdFx0aWYgKGl0ZXJhdG9yLnJldHVybiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0KGF3YWl0IHRyYWNrX3JlYWN0aXZpdHlfbG9zcyhpdGVyYXRvci5yZXR1cm4oKSkpKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdH1cblx0XHRcdHNldF9yZWFjdGl2aXR5X2xvc3NfdHJhY2tlcihwcmV2KTtcblx0XHR9XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0aW52b2tlX3JldHVybiA9IGZhbHNlO1xuXHRcdHRocm93IGVycm9yO1xuXHR9IGZpbmFsbHkge1xuXHRcdC8vIElmIHRoZSBpdGVyYXRvciBoYWQgYW4gYWJydXB0IGNvbXBsZXRpb24gKGJyZWFrKSBhbmQgYHJldHVybmAgaXMgZGVmaW5lZCBvbiB0aGUgaXRlcmF0b3IsIGNhbGwgaXQgYW5kIHJldHVybiB0aGUgdmFsdWVcblx0XHRpZiAoaW52b2tlX3JldHVybiAmJiBpdGVyYXRvci5yZXR1cm4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuc2FmZS1maW5hbGx5XG5cdFx0XHRyZXR1cm4gLyoqIEB0eXBlIHtUUmV0dXJufSAqLyAoKGF3YWl0IHRyYWNrX3JlYWN0aXZpdHlfbG9zcyhpdGVyYXRvci5yZXR1cm4oKSkpKCkudmFsdWUpO1xuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5zZXRfY29udGV4dChkZWFjdGl2YXRlX2JhdGNoID0gdHJ1ZSkge1xuXHRyZXN0b3JlZCA9IGZhbHNlO1xuXHRzZXRfYWN0aXZlX2VmZmVjdChudWxsKTtcblx0c2V0X2FjdGl2ZV9yZWFjdGlvbihudWxsKTtcblx0c2V0X2NvbXBvbmVudF9jb250ZXh0KG51bGwpO1xuXHRpZiAoZGVhY3RpdmF0ZV9iYXRjaCkgY3VycmVudF9iYXRjaD8uZGVhY3RpdmF0ZSgpO1xuXG5cdGlmIChERVYpIHtcblx0XHRzZXRfcmVhY3Rpdml0eV9sb3NzX3RyYWNrZXIobnVsbCk7XG5cdFx0c2V0X2Rldl9zdGFjayhudWxsKTtcblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8KCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD4+fSB0aHVua3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJ1bih0aHVua3MpIHtcblx0Y29uc3QgcmVzdG9yZSA9IGNhcHR1cmUoKTtcblxuXHRjb25zdCBkZWNyZW1lbnRfcGVuZGluZyA9IGluY3JlbWVudF9wZW5kaW5nKCk7XG5cblx0dmFyIGFjdGl2ZSA9IC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAoYWN0aXZlX2VmZmVjdCk7XG5cblx0LyoqIEB0eXBlIHtudWxsIHwgeyBlcnJvcjogYW55IH19ICovXG5cdHZhciBlcnJvcmVkID0gbnVsbDtcblxuXHQvKiogQHBhcmFtIHthbnl9IGVycm9yICovXG5cdGNvbnN0IGhhbmRsZV9lcnJvciA9IChlcnJvcikgPT4ge1xuXHRcdGVycm9yZWQgPSB7IGVycm9yIH07IC8vIHdyYXAgaW4gb2JqZWN0IGluIGNhc2UgYSBwcm9taXNlIHJlamVjdHMgd2l0aCBhIGZhbHN5IHZhbHVlXG5cblx0XHRpZiAoIWFib3J0ZWQoYWN0aXZlKSkge1xuXHRcdFx0aW52b2tlX2Vycm9yX2JvdW5kYXJ5KGVycm9yLCBhY3RpdmUpO1xuXHRcdH1cblx0fTtcblxuXHR2YXIgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSh0aHVua3NbMF0oKSkuY2F0Y2goaGFuZGxlX2Vycm9yKTtcblxuXHQvKiogQHR5cGUge0Jsb2NrZXJ9ICovXG5cdHZhciBibG9ja2VyID0geyBwcm9taXNlLCBzZXR0bGVkOiBmYWxzZSB9O1xuXHR2YXIgYmxvY2tlcnMgPSBbYmxvY2tlcl07XG5cblx0cHJvbWlzZS5maW5hbGx5KCgpID0+IHtcblx0XHRibG9ja2VyLnNldHRsZWQgPSB0cnVlO1xuXHRcdHVuc2V0X2NvbnRleHQoKTtcblx0fSk7XG5cblx0Zm9yIChjb25zdCBmbiBvZiB0aHVua3Muc2xpY2UoMSkpIHtcblx0XHRwcm9taXNlID0gcHJvbWlzZVxuXHRcdFx0LnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRyZXN0b3JlKCk7XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRpZiAoZXJyb3JlZCkge1xuXHRcdFx0XHRcdFx0dGhyb3cgZXJyb3JlZC5lcnJvcjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoYWJvcnRlZChhY3RpdmUpKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBTVEFMRV9SRUFDVElPTjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gZm4oKTtcblx0XHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0XHQvLyBXZSBnb3R0YSB1bnNldCBjb250ZXh0IGRpcmVjdGx5IGluIGNhc2UgdGhlIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlLCBpbiB3aGljaCBjYXNlXG5cdFx0XHRcdFx0Ly8gdW5zZXRfY29udGV4dCBpbiAuZmluYWxseSgpIHdvdWxkIGJlIHRvbyBsYXRlIC4uLlxuXHRcdFx0XHRcdHVuc2V0X2NvbnRleHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChoYW5kbGVfZXJyb3IpO1xuXG5cdFx0Y29uc3QgYmxvY2tlciA9IHsgcHJvbWlzZSwgc2V0dGxlZDogZmFsc2UgfTtcblx0XHRibG9ja2Vycy5wdXNoKGJsb2NrZXIpO1xuXG5cdFx0cHJvbWlzZS5maW5hbGx5KCgpID0+IHtcblx0XHRcdGJsb2NrZXIuc2V0dGxlZCA9IHRydWU7XG5cdFx0XHQvLyAuLi4gYnV0IHdlIGFsc28gbmVlZCBpdCBhZnRlciBzdWNoIGEgcHJvbWlzZSBoYXMgcmVzb2x2ZWQgaW4gY2FzZSBpdCByZXN0b3JlcyBvdXIgY29udGV4dFxuXHRcdFx0dW5zZXRfY29udGV4dCgpO1xuXHRcdH0pO1xuXHR9XG5cblx0cHJvbWlzZVxuXHRcdC8vIHdhaXQgb25lIG1vcmUgdGljaywgc28gdGhhdCB0ZW1wbGF0ZSBlZmZlY3RzIGFyZVxuXHRcdC8vIGd1YXJhbnRlZWQgdG8gcnVuIGJlZm9yZSBgJGVmZmVjdCguLi4pYFxuXHRcdC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZSgpKVxuXHRcdC5maW5hbGx5KGRlY3JlbWVudF9wZW5kaW5nKTtcblxuXHRyZXR1cm4gYmxvY2tlcnM7XG59XG5cbi8qKlxuICogQHBhcmFtIHtCbG9ja2VyW119IGJsb2NrZXJzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3YWl0KGJsb2NrZXJzKSB7XG5cdHJldHVybiBQcm9taXNlLmFsbChibG9ja2Vycy5tYXAoKGIpID0+IGIucHJvbWlzZSkpO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHsoc2tpcD86IGJvb2xlYW4pID0+IHZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZW1lbnRfcGVuZGluZygpIHtcblx0dmFyIGVmZmVjdCA9IC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAoYWN0aXZlX2VmZmVjdCk7XG5cdHZhciBib3VuZGFyeSA9IGVmZmVjdC5iOyAvLyB1bmRlZmluZWQgaWYgY2FsbGVkIG91dHNpZGUgdGhlIHJlbmRlciB0cmVlLCBlLmcuIGEgc3RhbmRhbG9uZSAkZWZmZWN0LnJvb3Rcblx0dmFyIGJhdGNoID0gLyoqIEB0eXBlIHtCYXRjaH0gKi8gKGN1cnJlbnRfYmF0Y2gpO1xuXHR2YXIgYmxvY2tpbmcgPSAhIWJvdW5kYXJ5Py5pc19yZW5kZXJlZCgpO1xuXG5cdGJvdW5kYXJ5Py51cGRhdGVfcGVuZGluZ19jb3VudCgxLCBiYXRjaCk7XG5cdGJhdGNoLmluY3JlbWVudChibG9ja2luZywgZWZmZWN0KTtcblxuXHRyZXR1cm4gKCkgPT4ge1xuXHRcdGJvdW5kYXJ5Py51cGRhdGVfcGVuZGluZ19jb3VudCgtMSwgYmF0Y2gpO1xuXHRcdGJhdGNoLmRlY3JlbWVudChibG9ja2luZywgZWZmZWN0KTtcblx0fTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgRGVyaXZlZCwgRWZmZWN0LCBSZWFjdGlvbiwgU291cmNlLCBWYWx1ZSB9IGZyb20gJyNjbGllbnQnICovXG4vKiogQGltcG9ydCB7IEJhdGNoIH0gZnJvbSAnLi9iYXRjaC5qcyc7ICovXG4vKiogQGltcG9ydCB7IEJvdW5kYXJ5IH0gZnJvbSAnLi4vZG9tL2Jsb2Nrcy9ib3VuZGFyeS5qcyc7ICovXG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7XG5cdEVSUk9SX1ZBTFVFLFxuXHRERVJJVkVELFxuXHRESVJUWSxcblx0RUZGRUNUX1BSRVNFUlZFRCxcblx0U1RBTEVfUkVBQ1RJT04sXG5cdEFTWU5DLFxuXHRERVNUUk9ZRUQsXG5cdENMRUFOLFxuXHRSRUFDVElPTl9SQU4sXG5cdElORVJUXG59IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcbmltcG9ydCB7XG5cdGFjdGl2ZV9yZWFjdGlvbixcblx0YWN0aXZlX2VmZmVjdCxcblx0dXBkYXRlX3JlYWN0aW9uLFxuXHRpbmNyZW1lbnRfd3JpdGVfdmVyc2lvbixcblx0c2V0X2FjdGl2ZV9lZmZlY3QsXG5cdHB1c2hfcmVhY3Rpb25fdmFsdWUsXG5cdGlzX2Rlc3Ryb3lpbmdfZWZmZWN0LFxuXHR1cGRhdGVfZWZmZWN0LFxuXHRyZW1vdmVfcmVhY3Rpb25zLFxuXHRza2lwcGVkX2RlcHMsXG5cdG5ld19kZXBzXG59IGZyb20gJy4uL3J1bnRpbWUuanMnO1xuaW1wb3J0IHsgd2l0aG91dF9yZWFjdGl2ZV9jb250ZXh0IH0gZnJvbSAnLi4vZG9tL2VsZW1lbnRzL2JpbmRpbmdzL3NoYXJlZC5qcyc7XG5pbXBvcnQgeyBlcXVhbHMsIHNhZmVfZXF1YWxzIH0gZnJvbSAnLi9lcXVhbGl0eS5qcyc7XG5pbXBvcnQgKiBhcyBlIGZyb20gJy4uL2Vycm9ycy5qcyc7XG5pbXBvcnQgKiBhcyB3IGZyb20gJy4uL3dhcm5pbmdzLmpzJztcbmltcG9ydCB7XG5cdGFzeW5jX2VmZmVjdCxcblx0ZGVzdHJveV9lZmZlY3QsXG5cdGRlc3Ryb3lfZWZmZWN0X2NoaWxkcmVuLFxuXHRlZmZlY3RfdHJhY2tpbmcsXG5cdHRlYXJkb3duXG59IGZyb20gJy4vZWZmZWN0cy5qcyc7XG5pbXBvcnQgeyBlYWdlcl9lZmZlY3RzLCBpbnRlcm5hbF9zZXQsIHNldF9lYWdlcl9lZmZlY3RzLCBzb3VyY2UgfSBmcm9tICcuL3NvdXJjZXMuanMnO1xuaW1wb3J0IHsgZ2V0X2Vycm9yIH0gZnJvbSAnLi4vLi4vc2hhcmVkL2Rldi5qcyc7XG5pbXBvcnQgeyBhc3luY19tb2RlX2ZsYWcsIHRyYWNpbmdfbW9kZV9mbGFnIH0gZnJvbSAnLi4vLi4vZmxhZ3MvaW5kZXguanMnO1xuaW1wb3J0IHsgY29tcG9uZW50X2NvbnRleHQgfSBmcm9tICcuLi9jb250ZXh0LmpzJztcbmltcG9ydCB7IFVOSU5JVElBTElaRUQgfSBmcm9tICcuLi8uLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgYmF0Y2hfdmFsdWVzLCBjdXJyZW50X2JhdGNoLCBwcmV2aW91c19iYXRjaCB9IGZyb20gJy4vYmF0Y2guanMnO1xuaW1wb3J0IHsgaW5jcmVtZW50X3BlbmRpbmcsIHVuc2V0X2NvbnRleHQgfSBmcm9tICcuL2FzeW5jLmpzJztcbmltcG9ydCB7IGRlZmVycmVkLCBpbmNsdWRlcywgbm9vcCB9IGZyb20gJy4uLy4uL3NoYXJlZC91dGlscy5qcyc7XG5pbXBvcnQgeyBzZXRfc2lnbmFsX3N0YXR1cywgdXBkYXRlX2Rlcml2ZWRfc3RhdHVzIH0gZnJvbSAnLi9zdGF0dXMuanMnO1xuaW1wb3J0IHsgc3RyaW5naWZ5X2Rlcml2ZWQgfSBmcm9tICcuLi9kZXYvZGVidWcuanMnO1xuXG4vKipcbiAqIFRoaXMgYWxsb3dzIHVzIHRvIHRyYWNrICdyZWFjdGl2aXR5IGxvc3MnIHRoYXQgb2NjdXJzIHdoZW4gc2lnbmFsc1xuICogYXJlIHJlYWQgYWZ0ZXIgYSBub24tY29udGV4dC1yZXN0b3JpbmcgYGF3YWl0YC4gRGV2LW9ubHlcbiAqIEB0eXBlIHt7IGVmZmVjdDogRWZmZWN0LCBlZmZlY3RfZGVwczogU2V0PFZhbHVlPiwgd2FybmVkOiBib29sZWFuIH0gfCBudWxsfVxuICovXG5leHBvcnQgbGV0IHJlYWN0aXZpdHlfbG9zc190cmFja2VyID0gbnVsbDtcblxuLyoqIEBwYXJhbSB7eyBlZmZlY3Q6IEVmZmVjdCwgZWZmZWN0X2RlcHM6IFNldDxWYWx1ZT4sIHdhcm5lZDogYm9vbGVhbiB9IHwgbnVsbH0gdiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldF9yZWFjdGl2aXR5X2xvc3NfdHJhY2tlcih2KSB7XG5cdHJlYWN0aXZpdHlfbG9zc190cmFja2VyID0gdjtcbn1cblxuZXhwb3J0IGNvbnN0IHJlY2VudF9hc3luY19kZXJpdmVkcyA9IG5ldyBTZXQoKTtcblxuLyoqXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHsoKSA9PiBWfSBmblxuICogQHJldHVybnMge0Rlcml2ZWQ8Vj59XG4gKi9cbi8qI19fTk9fU0lERV9FRkZFQ1RTX18qL1xuZXhwb3J0IGZ1bmN0aW9uIGRlcml2ZWQoZm4pIHtcblx0dmFyIGZsYWdzID0gREVSSVZFRCB8IERJUlRZO1xuXG5cdGlmIChhY3RpdmVfZWZmZWN0ICE9PSBudWxsKSB7XG5cdFx0Ly8gU2luY2UgZGVyaXZlZHMgYXJlIGV2YWx1YXRlZCBsYXppbHksIGFueSBlZmZlY3RzIGNyZWF0ZWQgaW5zaWRlIHRoZW0gYXJlXG5cdFx0Ly8gY3JlYXRlZCB0b28gbGF0ZSB0byBlbnN1cmUgdGhhdCB0aGUgcGFyZW50IGVmZmVjdCBpcyBhZGRlZCB0byB0aGUgdHJlZVxuXHRcdGFjdGl2ZV9lZmZlY3QuZiB8PSBFRkZFQ1RfUFJFU0VSVkVEO1xuXHR9XG5cblx0LyoqIEB0eXBlIHtEZXJpdmVkPFY+fSAqL1xuXHRjb25zdCBzaWduYWwgPSB7XG5cdFx0Y3R4OiBjb21wb25lbnRfY29udGV4dCxcblx0XHRkZXBzOiBudWxsLFxuXHRcdGVmZmVjdHM6IG51bGwsXG5cdFx0ZXF1YWxzLFxuXHRcdGY6IGZsYWdzLFxuXHRcdGZuLFxuXHRcdHJlYWN0aW9uczogbnVsbCxcblx0XHRydjogMCxcblx0XHR2OiAvKiogQHR5cGUge1Z9ICovIChVTklOSVRJQUxJWkVEKSxcblx0XHR3djogMCxcblx0XHRwYXJlbnQ6IGFjdGl2ZV9lZmZlY3QsXG5cdFx0YWM6IG51bGxcblx0fTtcblxuXHRpZiAoREVWICYmIHRyYWNpbmdfbW9kZV9mbGFnKSB7XG5cdFx0c2lnbmFsLmNyZWF0ZWQgPSBnZXRfZXJyb3IoJ2NyZWF0ZWQgYXQnKTtcblx0fVxuXG5cdHJldHVybiBzaWduYWw7XG59XG5cbmV4cG9ydCBjb25zdCBPQlNPTEVURSA9IFN5bWJvbCgnb2Jzb2xldGUnKTtcblxuLyoqXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHsoKSA9PiBWIHwgUHJvbWlzZTxWPn0gZm5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbbGFiZWxdXG4gKiBAcGFyYW0ge3N0cmluZ30gW2xvY2F0aW9uXSBJZiBwcm92aWRlZCwgcHJpbnQgYSB3YXJuaW5nIGlmIHRoZSB2YWx1ZSBpcyBub3QgcmVhZCBpbW1lZGlhdGVseSBhZnRlciB1cGRhdGVcbiAqIEByZXR1cm5zIHtQcm9taXNlPFNvdXJjZTxWPj59XG4gKi9cbi8qI19fTk9fU0lERV9FRkZFQ1RTX18qL1xuZXhwb3J0IGZ1bmN0aW9uIGFzeW5jX2Rlcml2ZWQoZm4sIGxhYmVsLCBsb2NhdGlvbikge1xuXHRsZXQgcGFyZW50ID0gLyoqIEB0eXBlIHtFZmZlY3QgfCBudWxsfSAqLyAoYWN0aXZlX2VmZmVjdCk7XG5cblx0aWYgKHBhcmVudCA9PT0gbnVsbCkge1xuXHRcdGUuYXN5bmNfZGVyaXZlZF9vcnBoYW4oKTtcblx0fVxuXG5cdHZhciBwcm9taXNlID0gLyoqIEB0eXBlIHtQcm9taXNlPFY+fSAqLyAoLyoqIEB0eXBlIHt1bmtub3dufSAqLyAodW5kZWZpbmVkKSk7XG5cdHZhciBzaWduYWwgPSBzb3VyY2UoLyoqIEB0eXBlIHtWfSAqLyAoVU5JTklUSUFMSVpFRCkpO1xuXG5cdGlmIChERVYpIHNpZ25hbC5sYWJlbCA9IGxhYmVsID8/IHN0cmluZ2lmeV9kZXJpdmVkKGZuKTtcblxuXHQvLyBvbmx5IHN1c3BlbmQgaW4gYXN5bmMgZGVyaXZlZHMgY3JlYXRlZCBvbiBpbml0aWFsaXNhdGlvblxuXHR2YXIgc2hvdWxkX3N1c3BlbmQgPSAhYWN0aXZlX3JlYWN0aW9uO1xuXG5cdC8qKiBAdHlwZSB7U2V0PFJldHVyblR5cGU8dHlwZW9mIGRlZmVycmVkPFY+Pj59ICovXG5cdHZhciBkZWZlcnJlZHMgPSBuZXcgU2V0KCk7XG5cblx0YXN5bmNfZWZmZWN0KCgpID0+IHtcblx0XHR2YXIgZWZmZWN0ID0gLyoqIEB0eXBlIHtFZmZlY3R9ICovIChhY3RpdmVfZWZmZWN0KTtcblxuXHRcdGlmIChERVYpIHtcblx0XHRcdHJlYWN0aXZpdHlfbG9zc190cmFja2VyID0geyBlZmZlY3QsIGVmZmVjdF9kZXBzOiBuZXcgU2V0KCksIHdhcm5lZDogZmFsc2UgfTtcblx0XHR9XG5cblx0XHQvKiogQHR5cGUge1JldHVyblR5cGU8dHlwZW9mIGRlZmVycmVkPFY+Pn0gKi9cblx0XHR2YXIgZCA9IGRlZmVycmVkKCk7XG5cdFx0cHJvbWlzZSA9IGQucHJvbWlzZTtcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBJZiB0aGlzIGNvZGUgaXMgY2hhbmdlZCBhdCBzb21lIHBvaW50LCBtYWtlIHN1cmUgdG8gc3RpbGwgYWNjZXNzIHRoZSB0aGVuIHByb3BlcnR5XG5cdFx0XHQvLyBvZiBmbigpIHRvIHJlYWQgYW55IHNpZ25hbHMgaXQgbWlnaHQgYWNjZXNzLCBzbyB0aGF0IHdlIHRyYWNrIHRoZW0gYXMgZGVwZW5kZW5jaWVzLlxuXHRcdFx0Ly8gV2UgY2FsbCBgdW5zZXRfY29udGV4dGAgdG8gdW5kbyBhbnkgYHNhdmVgIGNhbGxzIHRoYXQgaGFwcGVuIGluc2lkZSBgZm4oKWBcblx0XHRcdFByb21pc2UucmVzb2x2ZShmbigpKVxuXHRcdFx0XHQudGhlbihkLnJlc29sdmUsIChlKSA9PiB7XG5cdFx0XHRcdFx0Ly8gaWYgdGhlIHByb21pc2Ugd2FzIHJlamVjdGVkIGJ5IHRoZSB1c2VyLCB2aWEgYGdldEFib3J0U2lnbmFsYCwgdGhlblxuXHRcdFx0XHRcdC8vIHdhaXQgZm9yIGEgc3Vic2VxdWVudCByZXNvbHV0aW9uIGluc3RlYWQgb2YgZmx1c2hpbmcgdGhlIGJhdGNoXG5cdFx0XHRcdFx0aWYgKGUgIT09IFNUQUxFX1JFQUNUSU9OKSBkLnJlamVjdChlKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0LmZpbmFsbHkodW5zZXRfY29udGV4dCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGQucmVqZWN0KGVycm9yKTtcblx0XHRcdHVuc2V0X2NvbnRleHQoKTtcblx0XHR9XG5cblx0XHRpZiAoREVWKSB7XG5cdFx0XHRpZiAocmVhY3Rpdml0eV9sb3NzX3RyYWNrZXIpIHtcblx0XHRcdFx0Ly8gUmV1c2VkIGRlcHMgZnJvbSBwcmV2aW91cyBydW4gKGluZGljZXMgMCB0byBza2lwcGVkX2RlcHMtMSlcblx0XHRcdFx0Ly8gV2UgZGVsaWJlcmF0ZWx5IG9ubHkgdHJhY2sgZGlyZWN0IGRlcGVuZGVuY2llcyBvZiB0aGUgYXN5bmMgZXhwcmVzc2lvbiB0byBlbmNvdXJhZ2Vcblx0XHRcdFx0Ly8gZGVwZW5kZW5jaWVzIGJlaW5nIGRpcmVjdGx5IHZpc2libGUgYXQgdGhlIHBvaW50IG9mIHRoZSBleHByZXNzaW9uXG5cdFx0XHRcdGlmIChlZmZlY3QuZGVwcyAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc2tpcHBlZF9kZXBzOyBpICs9IDEpIHtcblx0XHRcdFx0XHRcdHJlYWN0aXZpdHlfbG9zc190cmFja2VyLmVmZmVjdF9kZXBzLmFkZChlZmZlY3QuZGVwc1tpXSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gTmV3IGRlcHMgZGlzY292ZXJlZCB0aGlzIHJ1blxuXHRcdFx0XHRpZiAobmV3X2RlcHMgIT09IG51bGwpIHtcblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG5ld19kZXBzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0XHRyZWFjdGl2aXR5X2xvc3NfdHJhY2tlci5lZmZlY3RfZGVwcy5hZGQobmV3X2RlcHNbaV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZWFjdGl2aXR5X2xvc3NfdHJhY2tlciA9IG51bGw7XG5cdFx0fVxuXG5cdFx0dmFyIGJhdGNoID0gLyoqIEB0eXBlIHtCYXRjaH0gKi8gKGN1cnJlbnRfYmF0Y2gpO1xuXG5cdFx0aWYgKHNob3VsZF9zdXNwZW5kKSB7XG5cdFx0XHQvLyB3ZSBvbmx5IGluY3JlbWVudCB0aGUgYmF0Y2gncyBwZW5kaW5nIHN0YXRlIGZvciB1cGRhdGVzLCBub3QgY3JlYXRpb24sIG90aGVyd2lzZVxuXHRcdFx0Ly8gd2Ugd2lsbCBkZWNyZW1lbnQgdG8gemVybyBiZWZvcmUgdGhlIHdvcmsgdGhhdCBkZXBlbmRzIG9uIHRoaXMgcHJvbWlzZSAoZS5nLiBhXG5cdFx0XHQvLyB0ZW1wbGF0ZSBlZmZlY3QpIGhhcyBpbml0aWFsaXplZCwgY2F1c2luZyB0aGUgYmF0Y2ggdG8gcmVzb2x2ZSBwcmVtYXR1cmVseVxuXHRcdFx0aWYgKChlZmZlY3QuZiAmIFJFQUNUSU9OX1JBTikgIT09IDApIHtcblx0XHRcdFx0dmFyIGRlY3JlbWVudF9wZW5kaW5nID0gaW5jcmVtZW50X3BlbmRpbmcoKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKFxuXHRcdFx0XHQvLyBib3VuZGFyeSBjYW4gYmUgbnVsbCBpZiB0aGUgYXN5bmMgZGVyaXZlZCBpcyBpbnNpZGUgYW4gJGVmZmVjdC5yb290IG5vdCBjb25uZWN0ZWQgdG8gdGhlIGNvbXBvbmVudCByZW5kZXIgdHJlZVxuXHRcdFx0XHRwYXJlbnQuYj8uaXNfcmVuZGVyZWQoKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGJhdGNoLmFzeW5jX2Rlcml2ZWRzLmdldChlZmZlY3QpPy5yZWplY3QoT0JTT0xFVEUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gV2hpbGUgdGhlIGJvdW5kYXJ5IGlzIHN0aWxsIHNob3dpbmcgcGVuZGluZywgYSBuZXcgcnVuIHN1cGVyc2VkZXMgYWxsIG9sZGVyIGluLWZsaWdodCBydW5zXG5cdFx0XHRcdC8vIGZvciB0aGlzIGFzeW5jIGV4cHJlc3Npb24uIENhbmNlbCBlYWdlcmx5IHNvIHJlc29sdXRpb24gY2Fubm90IGNvbW1pdCBzdGFsZSB2YWx1ZXMuXG5cdFx0XHRcdGZvciAoY29uc3QgZCBvZiBkZWZlcnJlZHMudmFsdWVzKCkpIHtcblx0XHRcdFx0XHRkLnJlamVjdChPQlNPTEVURSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0ZGVmZXJyZWRzLmFkZChkKTtcblx0XHRcdGJhdGNoLmFzeW5jX2Rlcml2ZWRzLnNldChlZmZlY3QsIGQpO1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIEBwYXJhbSB7YW55fSB2YWx1ZVxuXHRcdCAqIEBwYXJhbSB7dW5rbm93bn0gZXJyb3Jcblx0XHQgKi9cblx0XHRjb25zdCBoYW5kbGVyID0gKHZhbHVlLCBlcnJvciA9IHVuZGVmaW5lZCkgPT4ge1xuXHRcdFx0aWYgKERFVikge1xuXHRcdFx0XHRyZWFjdGl2aXR5X2xvc3NfdHJhY2tlciA9IG51bGw7XG5cdFx0XHR9XG5cblx0XHRcdGRlY3JlbWVudF9wZW5kaW5nPy4oKTtcblx0XHRcdGRlZmVycmVkcy5kZWxldGUoZCk7XG5cblx0XHRcdGlmIChlcnJvciA9PT0gT0JTT0xFVEUpIHJldHVybjtcblxuXHRcdFx0YmF0Y2guYWN0aXZhdGUoKTtcblxuXHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdHNpZ25hbC5mIHw9IEVSUk9SX1ZBTFVFO1xuXG5cdFx0XHRcdC8vIEB0cy1leHBlY3QtZXJyb3IgdGhlIGVycm9yIGlzIHRoZSB3cm9uZyB0eXBlLCBidXQgd2UgZG9uJ3QgY2FyZVxuXHRcdFx0XHRpbnRlcm5hbF9zZXQoc2lnbmFsLCBlcnJvcik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoKHNpZ25hbC5mICYgRVJST1JfVkFMVUUpICE9PSAwKSB7XG5cdFx0XHRcdFx0c2lnbmFsLmYgXj0gRVJST1JfVkFMVUU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoREVWICYmIGxvY2F0aW9uICE9PSB1bmRlZmluZWQgJiYgIXNpZ25hbC5lcXVhbHModmFsdWUpKSB7XG5cdFx0XHRcdFx0cmVjZW50X2FzeW5jX2Rlcml2ZWRzLmFkZChzaWduYWwpO1xuXG5cdFx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAocmVjZW50X2FzeW5jX2Rlcml2ZWRzLmhhcyhzaWduYWwpICYmIChlZmZlY3QuZiAmIERFU1RST1lFRCkgPT09IDApIHtcblx0XHRcdFx0XHRcdFx0dy5hd2FpdF93YXRlcmZhbGwoLyoqIEB0eXBlIHtzdHJpbmd9ICovIChzaWduYWwubGFiZWwpLCBsb2NhdGlvbik7XG5cdFx0XHRcdFx0XHRcdHJlY2VudF9hc3luY19kZXJpdmVkcy5kZWxldGUoc2lnbmFsKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGludGVybmFsX3NldChzaWduYWwsIHZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0YmF0Y2guZGVhY3RpdmF0ZSgpO1xuXHRcdH07XG5cblx0XHRkLnByb21pc2UudGhlbihoYW5kbGVyLCAoZSkgPT4gaGFuZGxlcihudWxsLCBlIHx8ICd1bmtub3duJykpO1xuXHR9KTtcblxuXHR0ZWFyZG93bigoKSA9PiB7XG5cdFx0Zm9yIChjb25zdCBkIG9mIGRlZmVycmVkcykge1xuXHRcdFx0ZC5yZWplY3QoT0JTT0xFVEUpO1xuXHRcdH1cblx0fSk7XG5cblx0aWYgKERFVikge1xuXHRcdC8vIGFkZCBhIGZsYWcgdGhhdCBsZXRzIHRoaXMgYmUgcHJpbnRlZCBhcyBhIGRlcml2ZWRcblx0XHQvLyB3aGVuIHVzaW5nIGAkaW5zcGVjdC50cmFjZSgpYFxuXHRcdHNpZ25hbC5mIHw9IEFTWU5DO1xuXHR9XG5cblx0cmV0dXJuIG5ldyBQcm9taXNlKChmdWxmaWwpID0+IHtcblx0XHQvKiogQHBhcmFtIHtQcm9taXNlPFY+fSBwICovXG5cdFx0ZnVuY3Rpb24gbmV4dChwKSB7XG5cdFx0XHRmdW5jdGlvbiBnbygpIHtcblx0XHRcdFx0aWYgKHAgPT09IHByb21pc2UpIHtcblx0XHRcdFx0XHRmdWxmaWwoc2lnbmFsKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBpZiB0aGUgZWZmZWN0IHJlLXJ1bnMgYmVmb3JlIHRoZSBpbml0aWFsIHByb21pc2Vcblx0XHRcdFx0XHQvLyByZXNvbHZlcywgZGVsYXkgcmVzb2x1dGlvbiB1bnRpbCB3ZSBoYXZlIGEgdmFsdWVcblx0XHRcdFx0XHRuZXh0KHByb21pc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHAudGhlbihnbywgZ28pO1xuXHRcdH1cblxuXHRcdG5leHQocHJvbWlzZSk7XG5cdH0pO1xufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0geygpID0+IFZ9IGZuXG4gKiBAcmV0dXJucyB7RGVyaXZlZDxWPn1cbiAqL1xuLyojX19OT19TSURFX0VGRkVDVFNfXyovXG5leHBvcnQgZnVuY3Rpb24gdXNlcl9kZXJpdmVkKGZuKSB7XG5cdGNvbnN0IGQgPSBkZXJpdmVkKGZuKTtcblxuXHRpZiAoIWFzeW5jX21vZGVfZmxhZykgcHVzaF9yZWFjdGlvbl92YWx1ZShkKTtcblxuXHRyZXR1cm4gZDtcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHsoKSA9PiBWfSBmblxuICogQHJldHVybnMge0Rlcml2ZWQ8Vj59XG4gKi9cbi8qI19fTk9fU0lERV9FRkZFQ1RTX18qL1xuZXhwb3J0IGZ1bmN0aW9uIGRlcml2ZWRfc2FmZV9lcXVhbChmbikge1xuXHRjb25zdCBzaWduYWwgPSBkZXJpdmVkKGZuKTtcblx0c2lnbmFsLmVxdWFscyA9IHNhZmVfZXF1YWxzO1xuXHRyZXR1cm4gc2lnbmFsO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7RGVyaXZlZH0gZGVyaXZlZFxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95X2Rlcml2ZWRfZWZmZWN0cyhkZXJpdmVkKSB7XG5cdHZhciBlZmZlY3RzID0gZGVyaXZlZC5lZmZlY3RzO1xuXG5cdGlmIChlZmZlY3RzICE9PSBudWxsKSB7XG5cdFx0ZGVyaXZlZC5lZmZlY3RzID0gbnVsbDtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZWZmZWN0cy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0ZGVzdHJveV9lZmZlY3QoLyoqIEB0eXBlIHtFZmZlY3R9ICovIChlZmZlY3RzW2ldKSk7XG5cdFx0fVxuXHR9XG59XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSB1cGRhdGluZyBkZXJpdmVkcywgdXNlZCB0byBkZXRlY3QgaW5maW5pdGUgcmVjdXJzaW9uXG4gKiBpbiBkZXYgbW9kZSBhbmQgcHJvdmlkZSBhIG5pY2VyIGVycm9yIHRoYW4gJ3RvbyBtdWNoIHJlY3Vyc2lvbidcbiAqIEB0eXBlIHtEZXJpdmVkW119XG4gKi9cbmxldCBzdGFjayA9IFtdO1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge0Rlcml2ZWR9IGRlcml2ZWRcbiAqIEByZXR1cm5zIHtUfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZV9kZXJpdmVkKGRlcml2ZWQpIHtcblx0dmFyIHZhbHVlO1xuXHR2YXIgcHJldl9hY3RpdmVfZWZmZWN0ID0gYWN0aXZlX2VmZmVjdDtcblx0dmFyIHBhcmVudCA9IGRlcml2ZWQucGFyZW50O1xuXG5cdGlmIChcblx0XHQhaXNfZGVzdHJveWluZ19lZmZlY3QgJiZcblx0XHRwYXJlbnQgIT09IG51bGwgJiZcblx0XHRkZXJpdmVkLnYgIT09IFVOSU5JVElBTElaRUQgJiYgLy8gaWYgaXQgd2FzIG5ldmVyIGV2YWx1YXRlZCBiZWZvcmUsIGl0J3MgZ3VhcmFudGVlZCB0byBmYWlsIGRvd25zdHJlYW0sIHNvIHdlIHRyeSB0byBleGVjdXRlIGluc3RlYWRcblx0XHQocGFyZW50LmYgJiAoREVTVFJPWUVEIHwgSU5FUlQpKSAhPT0gMFxuXHQpIHtcblx0XHR3LmRlcml2ZWRfaW5lcnQoKTtcblxuXHRcdHJldHVybiBkZXJpdmVkLnY7XG5cdH1cblxuXHRzZXRfYWN0aXZlX2VmZmVjdChwYXJlbnQpO1xuXG5cdGlmIChERVYpIHtcblx0XHRsZXQgcHJldl9lYWdlcl9lZmZlY3RzID0gZWFnZXJfZWZmZWN0cztcblx0XHRzZXRfZWFnZXJfZWZmZWN0cyhuZXcgU2V0KCkpO1xuXHRcdHRyeSB7XG5cdFx0XHRpZiAoaW5jbHVkZXMuY2FsbChzdGFjaywgZGVyaXZlZCkpIHtcblx0XHRcdFx0ZS5kZXJpdmVkX3JlZmVyZW5jZXNfc2VsZigpO1xuXHRcdFx0fVxuXG5cdFx0XHRzdGFjay5wdXNoKGRlcml2ZWQpO1xuXG5cdFx0XHRkZXN0cm95X2Rlcml2ZWRfZWZmZWN0cyhkZXJpdmVkKTtcblx0XHRcdHZhbHVlID0gdXBkYXRlX3JlYWN0aW9uKGRlcml2ZWQpO1xuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRzZXRfYWN0aXZlX2VmZmVjdChwcmV2X2FjdGl2ZV9lZmZlY3QpO1xuXHRcdFx0c2V0X2VhZ2VyX2VmZmVjdHMocHJldl9lYWdlcl9lZmZlY3RzKTtcblx0XHRcdHN0YWNrLnBvcCgpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHR0cnkge1xuXHRcdFx0ZGVzdHJveV9kZXJpdmVkX2VmZmVjdHMoZGVyaXZlZCk7XG5cdFx0XHR2YWx1ZSA9IHVwZGF0ZV9yZWFjdGlvbihkZXJpdmVkKTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0c2V0X2FjdGl2ZV9lZmZlY3QocHJldl9hY3RpdmVfZWZmZWN0KTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtEZXJpdmVkfSBkZXJpdmVkXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZV9kZXJpdmVkKGRlcml2ZWQpIHtcblx0dmFyIHZhbHVlID0gZXhlY3V0ZV9kZXJpdmVkKGRlcml2ZWQpO1xuXG5cdGlmICghZGVyaXZlZC5lcXVhbHModmFsdWUpKSB7XG5cdFx0ZGVyaXZlZC53diA9IGluY3JlbWVudF93cml0ZV92ZXJzaW9uKCk7XG5cblx0XHQvLyBpbiBhIGZvcmssIHdlIGRvbid0IHVwZGF0ZSB0aGUgdW5kZXJseWluZyB2YWx1ZSwganVzdCBgYmF0Y2hfdmFsdWVzYC5cblx0XHQvLyB0aGUgdW5kZXJseWluZyB2YWx1ZSB3aWxsIGJlIHVwZGF0ZWQgd2hlbiB0aGUgZm9yayBpcyBjb21taXR0ZWQuXG5cdFx0Ly8gb3RoZXJ3aXNlLCB0aGUgbmV4dCB0aW1lIHdlIGdldCBoZXJlIGFmdGVyIGEgJ3JlYWwgd29ybGQnIHN0YXRlXG5cdFx0Ly8gY2hhbmdlLCBgZGVyaXZlZC5lcXVhbHNgIG1heSBpbmNvcnJlY3RseSByZXR1cm4gYHRydWVgXG5cdFx0aWYgKCFjdXJyZW50X2JhdGNoPy5pc19mb3JrIHx8IGRlcml2ZWQuZGVwcyA9PT0gbnVsbCkge1xuXHRcdFx0aWYgKGN1cnJlbnRfYmF0Y2ggIT09IG51bGwpIHtcblx0XHRcdFx0Ly8gV2UgYWxzbyB3cml0ZSB0byBwcmV2aW91c19iYXRjaCBiZWNhdXNlIGlmIGl0IGV4aXN0cywgaXQgaXMgYSBzaWduIHRoYXQgd2UncmVcblx0XHRcdFx0Ly8gY3VycmVudGx5IGluIHRoZSBwcm9jZXNzIG9mIGZsdXNoaW5nIGVmZmVjdHMuIFRoZXNlIHVwZGF0ZXMgdG8gZGVyaXZlZHMgbWF5IGJlbG9uZ1xuXHRcdFx0XHQvLyB0byB0aGUgcHJldmlvdXMgYmF0Y2gsIG5vdCB0aGUgbmV3IG9uZSAod2hpY2ggY2FuIGFscmVhZHkgZXhpc3QgaWYgYW4gZWFybGllclxuXHRcdFx0XHQvLyBlZmZlY3Qgd3JvdGUgdG8gYSBzb3VyY2UpLiBUaGlzIGNhbiBjYXVzZSBidWdzIHdoZW4gcnVubmluZyBiYXRjaC4jY29tbWl0KCkgbGF0ZXIsXG5cdFx0XHRcdC8vIGJ1dCBub3QgYWRkaW5nIGl0IHRvIGN1cnJlbnRfYmF0Y2ggY2FuLCB0b28sIHNvIHdlIGFkZCBpdCB0byBib3RoLlxuXHRcdFx0XHQvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL3N2ZWx0ZS9wdWxsLzE4MTE3IGZvciBtb3JlIGRldGFpbHMuXG5cdFx0XHRcdGN1cnJlbnRfYmF0Y2guY2FwdHVyZShkZXJpdmVkLCB2YWx1ZSwgdHJ1ZSk7XG5cdFx0XHRcdHByZXZpb3VzX2JhdGNoPy5jYXB0dXJlKGRlcml2ZWQsIHZhbHVlLCB0cnVlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRlcml2ZWQudiA9IHZhbHVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBkZXJpdmVkcyB3aXRob3V0IGRlcGVuZGVuY2llcyBzaG91bGQgbmV2ZXIgYmUgcmVjb21wdXRlZFxuXHRcdFx0aWYgKGRlcml2ZWQuZGVwcyA9PT0gbnVsbCkge1xuXHRcdFx0XHRzZXRfc2lnbmFsX3N0YXR1cyhkZXJpdmVkLCBDTEVBTik7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBkb24ndCBtYXJrIGRlcml2ZWQgY2xlYW4gaWYgd2UncmUgcmVhZGluZyBpdCBpbnNpZGUgYVxuXHQvLyBjbGVhbnVwIGZ1bmN0aW9uLCBvciBpdCB3aWxsIGNhY2hlIGEgc3RhbGUgdmFsdWVcblx0aWYgKGlzX2Rlc3Ryb3lpbmdfZWZmZWN0KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Ly8gRHVyaW5nIHRpbWUgdHJhdmVsaW5nIHdlIGRvbid0IHdhbnQgdG8gcmVzZXQgdGhlIHN0YXR1cyBzbyB0aGF0XG5cdC8vIHRyYXZlcnNhbCBvZiB0aGUgZ3JhcGggaW4gdGhlIG90aGVyIGJhdGNoZXMgc3RpbGwgaGFwcGVuc1xuXHRpZiAoYmF0Y2hfdmFsdWVzICE9PSBudWxsKSB7XG5cdFx0Ly8gb25seSBjYWNoZSB0aGUgdmFsdWUgaWYgd2UncmUgaW4gYSB0cmFja2luZyBjb250ZXh0LCBvdGhlcndpc2Ugd2Ugd29uJ3Rcblx0XHQvLyBjbGVhciB0aGUgY2FjaGUgaW4gYG1hcmtfcmVhY3Rpb25zYCB3aGVuIGRlcGVuZGVuY2llcyBhcmUgdXBkYXRlZFxuXHRcdGlmIChlZmZlY3RfdHJhY2tpbmcoKSB8fCBjdXJyZW50X2JhdGNoPy5pc19mb3JrKSB7XG5cdFx0XHRiYXRjaF92YWx1ZXMuc2V0KGRlcml2ZWQsIHZhbHVlKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0dXBkYXRlX2Rlcml2ZWRfc3RhdHVzKGRlcml2ZWQpO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtEZXJpdmVkfSBkZXJpdmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcmVlemVfZGVyaXZlZF9lZmZlY3RzKGRlcml2ZWQpIHtcblx0aWYgKGRlcml2ZWQuZWZmZWN0cyA9PT0gbnVsbCkgcmV0dXJuO1xuXG5cdGZvciAoY29uc3QgZSBvZiBkZXJpdmVkLmVmZmVjdHMpIHtcblx0XHQvLyBpZiB0aGUgZWZmZWN0IGhhcyBhIHRlYXJkb3duIGZ1bmN0aW9uIG9yIGFib3J0IHNpZ25hbCwgY2FsbCBpdFxuXHRcdGlmIChlLnRlYXJkb3duIHx8IGUuYWMpIHtcblx0XHRcdGUudGVhcmRvd24/LigpO1xuXHRcdFx0aWYgKGUuYWMgIT09IG51bGwpIHtcblx0XHRcdFx0d2l0aG91dF9yZWFjdGl2ZV9jb250ZXh0KCgpID0+IHtcblx0XHRcdFx0XHQvKiogQHR5cGUge0Fib3J0Q29udHJvbGxlcn0gKi8gKGUuYWMpLmFib3J0KFNUQUxFX1JFQUNUSU9OKTtcblx0XHRcdFx0XHRlLmFjID0gbnVsbDtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIG1ha2UgaXQgYSBub29wIHNvIGl0IGRvZXNuJ3QgZ2V0IGNhbGxlZCBhZ2FpbiBpZiB0aGUgZGVyaXZlZFxuXHRcdFx0Ly8gaXMgdW5mcm96ZW4uIHdlIGRvbid0IHNldCBpdCB0byBgbnVsbGAsIGJlY2F1c2UgdGhlIGV4aXN0ZW5jZVxuXHRcdFx0Ly8gb2YgYSB0ZWFyZG93biBmdW5jdGlvbiBpcyB3aGF0IGRldGVybWluZXMgd2hldGhlciB0aGVcblx0XHRcdC8vIGVmZmVjdCBydW5zIGFnYWluIGR1cmluZyB1bmZyZWV6aW5nIChidXQgbm90IGZvciB0ZWFyZG93bi1vbmx5IGVmZmVjdHMpXG5cdFx0XHRpZiAoZS5mbiAhPT0gbnVsbCkgZS50ZWFyZG93biA9IG5vb3A7XG5cblx0XHRcdHJlbW92ZV9yZWFjdGlvbnMoZSwgMCk7XG5cdFx0XHRkZXN0cm95X2VmZmVjdF9jaGlsZHJlbihlKTtcblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0Rlcml2ZWR9IGRlcml2ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuZnJlZXplX2Rlcml2ZWRfZWZmZWN0cyhkZXJpdmVkKSB7XG5cdGlmIChkZXJpdmVkLmVmZmVjdHMgPT09IG51bGwpIHJldHVybjtcblxuXHRmb3IgKGNvbnN0IGUgb2YgZGVyaXZlZC5lZmZlY3RzKSB7XG5cdFx0Ly8gaWYgdGhlIGVmZmVjdCB3YXMgcHJldmlvdXNseSBmcm96ZW4g4oCUIGluZGljYXRlZCBieSB0aGUgcHJlc2VuY2Vcblx0XHQvLyBvZiBhIHRlYXJkb3duIGZ1bmN0aW9uIOKAlCB1bmZyZWV6ZSBpdFxuXHRcdGlmIChlLnRlYXJkb3duICYmIGUuZm4gIT09IG51bGwpIHtcblx0XHRcdHVwZGF0ZV9lZmZlY3QoZSk7XG5cdFx0fVxuXHR9XG59XG4iLCIvKiogQGltcG9ydCB7IEZvcmsgfSBmcm9tICdzdmVsdGUnICovXG4vKiogQGltcG9ydCB7IERlcml2ZWQsIEVmZmVjdCwgUmVhY3Rpb24sIFNvdXJjZSwgVmFsdWUgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHtcblx0QkxPQ0tfRUZGRUNULFxuXHRCUkFOQ0hfRUZGRUNULFxuXHRDTEVBTixcblx0REVTVFJPWUVELFxuXHRESVJUWSxcblx0RUZGRUNULFxuXHRBU1lOQyxcblx0SU5FUlQsXG5cdFJFTkRFUl9FRkZFQ1QsXG5cdFJPT1RfRUZGRUNULFxuXHRNQVlCRV9ESVJUWSxcblx0REVSSVZFRCxcblx0RUFHRVJfRUZGRUNULFxuXHRFUlJPUl9WQUxVRSxcblx0TUFOQUdFRF9FRkZFQ1QsXG5cdFJFQUNUSU9OX1JBTixcblx0REVTVFJPWUlOR1xufSBmcm9tICcjY2xpZW50L2NvbnN0YW50cyc7XG5pbXBvcnQgeyBhc3luY19tb2RlX2ZsYWcgfSBmcm9tICcuLi8uLi9mbGFncy9pbmRleC5qcyc7XG5pbXBvcnQgeyBkZWZlcnJlZCwgZGVmaW5lX3Byb3BlcnR5LCBpbmNsdWRlcyB9IGZyb20gJy4uLy4uL3NoYXJlZC91dGlscy5qcyc7XG5pbXBvcnQge1xuXHRhY3RpdmVfcmVhY3Rpb24sXG5cdGdldCxcblx0aW5jcmVtZW50X3dyaXRlX3ZlcnNpb24sXG5cdGlzX2RpcnR5LFxuXHR1cGRhdGVfZWZmZWN0XG59IGZyb20gJy4uL3J1bnRpbWUuanMnO1xuaW1wb3J0ICogYXMgZSBmcm9tICcuLi9lcnJvcnMuanMnO1xuaW1wb3J0IHsgZmx1c2hfdGFza3MsIHF1ZXVlX21pY3JvX3Rhc2sgfSBmcm9tICcuLi9kb20vdGFzay5qcyc7XG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7IGludm9rZV9lcnJvcl9ib3VuZGFyeSB9IGZyb20gJy4uL2Vycm9yLWhhbmRsaW5nLmpzJztcbmltcG9ydCB7IGZsdXNoX2VhZ2VyX2VmZmVjdHMsIG9sZF92YWx1ZXMsIHNldF9lYWdlcl9lZmZlY3RzLCBzb3VyY2UsIHVwZGF0ZSB9IGZyb20gJy4vc291cmNlcy5qcyc7XG5pbXBvcnQgeyBlYWdlcl9lZmZlY3QsIHRlYXJkb3duLCB1bmxpbmtfZWZmZWN0IH0gZnJvbSAnLi9lZmZlY3RzLmpzJztcbmltcG9ydCB7IGRlZmVyX2VmZmVjdCB9IGZyb20gJy4vdXRpbHMuanMnO1xuaW1wb3J0IHsgVU5JTklUSUFMSVpFRCB9IGZyb20gJy4uLy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBzZXRfc2lnbmFsX3N0YXR1cyB9IGZyb20gJy4vc3RhdHVzLmpzJztcbmltcG9ydCB7IGludmFyaWFudCB9IGZyb20gJy4uLy4uL3NoYXJlZC9kZXYuanMnO1xuaW1wb3J0IHsgbG9nX2VmZmVjdF90cmVlIH0gZnJvbSAnLi4vZGV2L2RlYnVnLmpzJztcbmltcG9ydCB7IE9CU09MRVRFIH0gZnJvbSAnLi9kZXJpdmVkcy5qcyc7XG5cbi8qKiBAdHlwZSB7QmF0Y2ggfCBudWxsfSAqL1xubGV0IGZpcnN0X2JhdGNoID0gbnVsbDtcblxuLyoqIEB0eXBlIHtCYXRjaCB8IG51bGx9ICovXG5sZXQgbGFzdF9iYXRjaCA9IG51bGw7XG5cbi8qKiBAdHlwZSB7QmF0Y2ggfCBudWxsfSAqL1xuZXhwb3J0IGxldCBjdXJyZW50X2JhdGNoID0gbnVsbDtcblxuLyoqXG4gKiBUaGlzIGlzIG5lZWRlZCB0byBhdm9pZCBvdmVyd3JpdGluZyBpbnB1dHNcbiAqIEB0eXBlIHtCYXRjaCB8IG51bGx9XG4gKi9cbmV4cG9ydCBsZXQgcHJldmlvdXNfYmF0Y2ggPSBudWxsO1xuXG4vKipcbiAqIFdoZW4gdGltZSB0cmF2ZWxsaW5nIChpLmUuIHdvcmtpbmcgaW4gb25lIGJhdGNoLCB3aGlsZSBvdGhlciBiYXRjaGVzXG4gKiBzdGlsbCBoYXZlIG9uZ29pbmcgd29yayksIHdlIGlnbm9yZSB0aGUgcmVhbCB2YWx1ZXMgb2YgYWZmZWN0ZWRcbiAqIHNpZ25hbHMgaW4gZmF2b3VyIG9mIHRoZWlyIHZhbHVlcyB3aXRoaW4gdGhlIGJhdGNoXG4gKiBAdHlwZSB7TWFwPFZhbHVlLCBhbnk+IHwgbnVsbH1cbiAqL1xuZXhwb3J0IGxldCBiYXRjaF92YWx1ZXMgPSBudWxsO1xuXG4vKiogQHR5cGUge0VmZmVjdCB8IG51bGx9ICovXG5sZXQgbGFzdF9zY2hlZHVsZWRfZWZmZWN0ID0gbnVsbDtcblxuZXhwb3J0IGxldCBpc19mbHVzaGluZ19zeW5jID0gZmFsc2U7XG5sZXQgaXNfcHJvY2Vzc2luZyA9IGZhbHNlO1xuXG4vKipcbiAqIER1cmluZyB0cmF2ZXJzYWwsIHRoaXMgaXMgYW4gYXJyYXkuIE5ld2x5IGNyZWF0ZWQgZWZmZWN0cyBhcmUgKGlmIG5vdCBpbW1lZGlhdGVseVxuICogZXhlY3V0ZWQpIHB1c2hlZCB0byB0aGlzIGFycmF5LCByYXRoZXIgdGhhbiBnb2luZyB0aHJvdWdoIHRoZSBzY2hlZHVsaW5nXG4gKiByaWdhbWFyb2xlIHRoYXQgd291bGQgY2F1c2UgYW5vdGhlciB0dXJuIG9mIHRoZSBmbHVzaCBsb29wLlxuICogQHR5cGUge0VmZmVjdFtdIHwgbnVsbH1cbiAqL1xuZXhwb3J0IGxldCBjb2xsZWN0ZWRfZWZmZWN0cyA9IG51bGw7XG5cbi8qKlxuICogQW4gYXJyYXkgb2YgZWZmZWN0cyB0aGF0IGFyZSBtYXJrZWQgZHVyaW5nIHRyYXZlcnNhbCBhcyBhIHJlc3VsdCBvZiBhIGBzZXRgXG4gKiAobm90IGBpbnRlcm5hbF9zZXRgKSBjYWxsLiBUaGVzZSB3aWxsIGJlIGFkZGVkIHRvIHRoZSBuZXh0IGJhdGNoIGFuZFxuICogdHJpZ2dlciBhbm90aGVyIGBiYXRjaC5wcm9jZXNzKClgXG4gKiBAdHlwZSB7RWZmZWN0W10gfCBudWxsfVxuICogQGRlcHJlY2F0ZWQgd2hlbiB3ZSBnZXQgcmlkIG9mIGxlZ2FjeSBtb2RlIGFuZCBzdG9yZXMsIHdlIGNhbiBnZXQgcmlkIG9mIHRoaXNcbiAqL1xuZXhwb3J0IGxldCBsZWdhY3lfdXBkYXRlcyA9IG51bGw7XG5cbnZhciBmbHVzaF9jb3VudCA9IDA7XG5cbi8qKiBAdHlwZSB7U2V0PFZhbHVlPn0gKi9cbnZhciBzb3VyY2Vfc3RhY2tzID0gbmV3IFNldCgpO1xuXG5sZXQgdWlkID0gMTtcblxuZXhwb3J0IGNsYXNzIEJhdGNoIHtcblx0aWQgPSB1aWQrKztcblxuXHQvKiogVHJ1ZSBhcyBzb29uIGFzIGAjcHJvY2Vzc2Agd2FzIGNhbGxlZCAqL1xuXHRzdGFydGVkID0gZmFsc2U7XG5cblx0bGlua2VkID0gdHJ1ZTtcblxuXHQvKiogQHR5cGUge0JhdGNoIHwgbnVsbH0gKi9cblx0cHJldiA9IG51bGw7XG5cblx0LyoqIEB0eXBlIHtCYXRjaCB8IG51bGx9ICovXG5cdG5leHQgPSBudWxsO1xuXG5cdC8qKiBAdHlwZSB7TWFwPEVmZmVjdCwgUmV0dXJuVHlwZTx0eXBlb2YgZGVmZXJyZWQ8YW55Pj4+fSAqL1xuXHRhc3luY19kZXJpdmVkcyA9IG5ldyBNYXAoKTtcblxuXHQvKipcblx0ICogVGhlIGN1cnJlbnQgdmFsdWVzIG9mIGFueSBzaWduYWxzIHRoYXQgYXJlIHVwZGF0ZWQgaW4gdGhpcyBiYXRjaC5cblx0ICogVHVwbGUgZm9ybWF0OiBbdmFsdWUsIGlzX2Rlcml2ZWRdIChub3RlOiBpc19kZXJpdmVkIGlzIGZhbHNlIGZvciBkZXJpdmVkcywgdG9vLCBpZiB0aGV5IHdlcmUgb3ZlcnJpZGRlbiB2aWEgYXNzaWdubWVudClcblx0ICogVGhlIGtleXMgb2YgdGhpcyBtYXAgYXJlIGlkZW50aWNhbCB0byBgdGhpcy5wcmV2aW91c2Bcblx0ICogQHR5cGUge01hcDxWYWx1ZSwgW2FueSwgYm9vbGVhbl0+fVxuXHQgKi9cblx0Y3VycmVudCA9IG5ldyBNYXAoKTtcblxuXHQvKipcblx0ICogVGhlIHZhbHVlcyBvZiBhbnkgc2lnbmFscyAoc291cmNlcyBhbmQgZGVyaXZlZHMpIHRoYXQgYXJlIHVwZGF0ZWQgaW4gdGhpcyBiYXRjaCBfYmVmb3JlXyB0aG9zZSB1cGRhdGVzIHRvb2sgcGxhY2UuXG5cdCAqIFRoZSBrZXlzIG9mIHRoaXMgbWFwIGFyZSBpZGVudGljYWwgdG8gYHRoaXMuY3VycmVudGBcblx0ICogQHR5cGUge01hcDxWYWx1ZSwgYW55Pn1cblx0ICovXG5cdHByZXZpb3VzID0gbmV3IE1hcCgpO1xuXG5cdC8qKlxuXHQgKiBXaGVuIHRoZSBiYXRjaCBpcyBjb21taXR0ZWQgKGFuZCB0aGUgRE9NIGlzIHVwZGF0ZWQpLCB3ZSBuZWVkIHRvIHJlbW92ZSBvbGQgYnJhbmNoZXNcblx0ICogYW5kIGFwcGVuZCBuZXcgb25lcyBieSBjYWxsaW5nIHRoZSBmdW5jdGlvbnMgYWRkZWQgaW5zaWRlIChpZi9lYWNoL2tleS9ldGMpIGJsb2Nrc1xuXHQgKiBAdHlwZSB7U2V0PChiYXRjaDogQmF0Y2gpID0+IHZvaWQ+fVxuXHQgKi9cblx0I2NvbW1pdF9jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG5cblx0LyoqXG5cdCAqIElmIGEgZm9yayBpcyBkaXNjYXJkZWQsIHdlIG5lZWQgdG8gZGVzdHJveSBhbnkgZWZmZWN0cyB0aGF0IGFyZSBubyBsb25nZXIgbmVlZGVkXG5cdCAqIEB0eXBlIHtTZXQ8KGJhdGNoOiBCYXRjaCkgPT4gdm9pZD59XG5cdCAqL1xuXHQjZGlzY2FyZF9jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG5cblx0LyoqXG5cdCAqIFRoZSBudW1iZXIgb2YgYXN5bmMgZWZmZWN0cyB0aGF0IGFyZSBjdXJyZW50bHkgaW4gZmxpZ2h0XG5cdCAqL1xuXHQjcGVuZGluZyA9IDA7XG5cblx0LyoqXG5cdCAqIEFzeW5jIGVmZmVjdHMgdGhhdCBhcmUgY3VycmVudGx5IGluIGZsaWdodCwgX25vdF8gaW5zaWRlIGEgcGVuZGluZyBib3VuZGFyeVxuXHQgKiBAdHlwZSB7TWFwPEVmZmVjdCwgbnVtYmVyPn1cblx0ICovXG5cdCNibG9ja2luZ19wZW5kaW5nID0gbmV3IE1hcCgpO1xuXG5cdC8qKlxuXHQgKiBBIGRlZmVycmVkIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgYmF0Y2ggaXMgY29tbWl0dGVkLCB1c2VkIHdpdGggYHNldHRsZWQoKWBcblx0ICogVE9ETyByZXBsYWNlIHdpdGggUHJvbWlzZS53aXRoUmVzb2x2ZXJzIG9uY2Ugc3VwcG9ydGVkIHdpZGVseSBlbm91Z2hcblx0ICogQHR5cGUge3sgcHJvbWlzZTogUHJvbWlzZTx2b2lkPiwgcmVzb2x2ZTogKHZhbHVlPzogYW55KSA9PiB2b2lkLCByZWplY3Q6IChyZWFzb246IHVua25vd24pID0+IHZvaWQgfSB8IG51bGx9XG5cdCAqL1xuXHQjZGVmZXJyZWQgPSBudWxsO1xuXG5cdC8qKlxuXHQgKiBFZmZlY3RzIHRoYXQgd2VyZSBzY2hlZHVsZWQgaW4gdGhpcyBiYXRjaCBidXQgbm90IHlldCAncmVzb2x2ZWQnIGludG8gdGhlXG5cdCAqIHJvb3QgZWZmZWN0cyB0aGF0IG5lZWQgdG8gYmUgZmx1c2hlZC4gUmVzb2x2aW5nIOKAlCB0aGUgdXB3YXJkcyB0cmF2ZXJzYWwgdGhhdFxuXHQgKiBtYXJrcyB0aGUgcGF0aCB0byBlYWNoIGVmZmVjdCBvbiB0aGUgc2hhcmVkIGVmZmVjdCB0cmVlIChzZWUgI3Jlc29sdmUpIOKAlCBpc1xuXHQgKiBkZWZlcnJlZCB1bnRpbCB0aGUgYmF0Y2ggaXMgcHJvY2Vzc2VkLCBzbyB0aGF0IHRoZSBtYXJrZXJzIGFyZSBjcmVhdGVkIGFuZFxuXHQgKiBjb25zdW1lZCB3aXRoaW4gYSBzaW5nbGUgdHJhdmVyc2FsLiBTY2hlZHVsaW5nIGludG8gb3RoZXIgYmF0Y2hlcyAod2hpY2ggY2FuXG5cdCAqIGhhcHBlbiBjb25jdXJyZW50bHksIGUuZy4gd2hpbGUgYSBiYXRjaCBpcyBjb21taXR0ZWQpIGNhbiB0aGVyZWZvcmUgbmV2ZXJcblx0ICogb2JzZXJ2ZSAoYW5kIGJlIGNvbmZ1c2VkIGJ5KSB0aGlzIGJhdGNoJ3MgbWFya2Vycy5cblx0ICogTWF5IGNvbnRhaW4gZHVwbGljYXRlcyDigJQgZGVkdXBsaWNhdGlvbiBoYXBwZW5zIGR1cmluZyByZXNvbHZpbmdcblx0ICogQHR5cGUge0VmZmVjdFtdfVxuXHQgKi9cblx0I3NjaGVkdWxlZCA9IFtdO1xuXG5cdC8qKlxuXHQgKiBFZmZlY3RzIGNyZWF0ZWQgd2hpbGUgdGhpcyBiYXRjaCB3YXMgYWN0aXZlLlxuXHQgKiBAdHlwZSB7RWZmZWN0W119XG5cdCAqL1xuXHQjbmV3X2VmZmVjdHMgPSBbXTtcblxuXHQvKipcblx0ICogRGVmZXJyZWQgZWZmZWN0cyAod2hpY2ggcnVuIGFmdGVyIGFzeW5jIHdvcmsgaGFzIGNvbXBsZXRlZCkgYW5kIHRoZWlyIHN0YXR1cyAoRElSVFkgb3IgTUFZQkVfRElSVFkpXG5cdCAqIEB0eXBlIHtNYXA8RWZmZWN0LCBudW1iZXI+fVxuXHQgKi9cblx0I2RpcnR5X3JlYWN0aW9ucyA9IG5ldyBNYXAoKTtcblxuXHQvKipcblx0ICogQSBtYXAgb2YgYnJhbmNoZXMgdGhhdCBzdGlsbCBleGlzdCwgYnV0IHdpbGwgYmUgZGVzdHJveWVkIHdoZW4gdGhpcyBiYXRjaFxuXHQgKiBpcyBjb21taXR0ZWQg4oCUIHdlIHNraXAgb3ZlciB0aGVzZSBkdXJpbmcgYHByb2Nlc3NgLlxuXHQgKiBUaGUgdmFsdWUgY29udGFpbnMgY2hpbGQgZWZmZWN0cyB0aGF0IHdlcmUgZGlydHkvbWF5YmVfZGlydHkgYmVmb3JlIGJlaW5nIHJlc2V0LFxuXHQgKiBzbyB0aGV5IGNhbiBiZSByZXNjaGVkdWxlZCBpZiB0aGUgYnJhbmNoIHN1cnZpdmVzLlxuXHQgKiBAdHlwZSB7TWFwPEVmZmVjdCwgeyBkOiBFZmZlY3RbXSwgbTogRWZmZWN0W10gfT59XG5cdCAqL1xuXHQjc2tpcHBlZF9icmFuY2hlcyA9IG5ldyBNYXAoKTtcblxuXHQvKipcblx0ICogSW52ZXJzZSBvZiAjc2tpcHBlZF9icmFuY2hlcyB3aGljaCB3ZSBuZWVkIHRvIHRlbGwgcHJpb3IgYmF0Y2hlcyB0byB1bnNraXAgdGhlbSB3aGVuIGNvbW1pdHRpbmdcblx0ICogQHR5cGUge1NldDxFZmZlY3Q+fVxuXHQgKi9cblx0I3Vuc2tpcHBlZF9icmFuY2hlcyA9IG5ldyBTZXQoKTtcblxuXHRpc19mb3JrID0gZmFsc2U7XG5cblx0I2RlY3JlbWVudF9xdWV1ZWQgPSBmYWxzZTtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRpZiAobGFzdF9iYXRjaCA9PT0gbnVsbCkge1xuXHRcdFx0Zmlyc3RfYmF0Y2ggPSBsYXN0X2JhdGNoID0gdGhpcztcblx0XHR9IGVsc2Uge1xuXHRcdFx0bGFzdF9iYXRjaC5uZXh0ID0gdGhpcztcblx0XHRcdHRoaXMucHJldiA9IGxhc3RfYmF0Y2g7XG5cdFx0fVxuXG5cdFx0bGFzdF9iYXRjaCA9IHRoaXM7XG5cdH1cblxuXHQjaXNfZGVmZXJyZWQoKSB7XG5cdFx0aWYgKHRoaXMuaXNfZm9yaykgcmV0dXJuIHRydWU7XG5cblx0XHRmb3IgKGNvbnN0IGVmZmVjdCBvZiB0aGlzLiNibG9ja2luZ19wZW5kaW5nLmtleXMoKSkge1xuXHRcdFx0Ly8gcGVuZGluZyB3b3JrIGluc2lkZSBhIHNraXBwZWQgYnJhbmNoIGRvZXNuJ3QgYmxvY2ssIHRoZSBicmFuY2ggaXMgZ29pbmcgdG8gYmUgZGVzdHJveWVkXG5cdFx0XHRpZiAoIXRoaXMuI2lzX3NraXBwZWQoZWZmZWN0KSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvKipcblx0ICogV2hldGhlciBgZWZmZWN0YCBpcyBpbnNpZGUgYSBicmFuY2ggdGhhdCB0aGlzIGJhdGNoIHNraXBzXG5cdCAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3Rcblx0ICovXG5cdCNpc19za2lwcGVkKGVmZmVjdCkge1xuXHRcdGZvciAodmFyIGUgPSAvKiogQHR5cGUge0VmZmVjdCB8IG51bGx9ICovIChlZmZlY3QpOyBlICE9PSBudWxsOyBlID0gZS5wYXJlbnQpIHtcblx0XHRcdGlmICh0aGlzLiNza2lwcGVkX2JyYW5jaGVzLmhhcyhlKSkgcmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFkZCBhbiBlZmZlY3QgdG8gdGhlICNza2lwcGVkX2JyYW5jaGVzIG1hcCBhbmQgcmVzZXQgaXRzIGNoaWxkcmVuXG5cdCAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3Rcblx0ICovXG5cdHNraXBfZWZmZWN0KGVmZmVjdCkge1xuXHRcdGlmICghdGhpcy4jc2tpcHBlZF9icmFuY2hlcy5oYXMoZWZmZWN0KSkge1xuXHRcdFx0dGhpcy4jc2tpcHBlZF9icmFuY2hlcy5zZXQoZWZmZWN0LCB7IGQ6IFtdLCBtOiBbXSB9KTtcblx0XHR9XG5cdFx0dGhpcy4jdW5za2lwcGVkX2JyYW5jaGVzLmRlbGV0ZShlZmZlY3QpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJlbW92ZSBhbiBlZmZlY3QgZnJvbSB0aGUgI3NraXBwZWRfYnJhbmNoZXMgbWFwIGFuZCByZXNjaGVkdWxlXG5cdCAqIGFueSB0cmFja2VkIGRpcnR5L21heWJlX2RpcnR5IGNoaWxkIGVmZmVjdHNcblx0ICogQHBhcmFtIHtFZmZlY3R9IGVmZmVjdFxuXHQgKiBAcGFyYW0geyhlOiBFZmZlY3QpID0+IHZvaWR9IGNhbGxiYWNrXG5cdCAqL1xuXHR1bnNraXBfZWZmZWN0KGVmZmVjdCwgY2FsbGJhY2sgPSAoZSkgPT4gdGhpcy5zY2hlZHVsZShlKSkge1xuXHRcdHZhciB0cmFja2VkID0gdGhpcy4jc2tpcHBlZF9icmFuY2hlcy5nZXQoZWZmZWN0KTtcblx0XHRpZiAodHJhY2tlZCkge1xuXHRcdFx0dGhpcy4jc2tpcHBlZF9icmFuY2hlcy5kZWxldGUoZWZmZWN0KTtcblxuXHRcdFx0Zm9yICh2YXIgZSBvZiB0cmFja2VkLmQpIHtcblx0XHRcdFx0c2V0X3NpZ25hbF9zdGF0dXMoZSwgRElSVFkpO1xuXHRcdFx0XHRjYWxsYmFjayhlKTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yIChlIG9mIHRyYWNrZWQubSkge1xuXHRcdFx0XHRzZXRfc2lnbmFsX3N0YXR1cyhlLCBNQVlCRV9ESVJUWSk7XG5cdFx0XHRcdGNhbGxiYWNrKGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLiN1bnNraXBwZWRfYnJhbmNoZXMuYWRkKGVmZmVjdCk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydCB0aGUgZWZmZWN0cyB0aGF0IHdlcmUgc2NoZWR1bGVkIGluIHRoaXMgYmF0Y2ggaW50byB0aGUgcm9vdCBlZmZlY3RzXG5cdCAqIHRoYXQgbmVlZCB0byBiZSB0cmF2ZXJzZWQsIG1hcmtpbmcgdGhlIHBhdGggdG8gZWFjaCBlZmZlY3QgKGJ5IGNsZWFyaW5nIHRoZVxuXHQgKiBgQ0xFQU5gIGZsYWcgb24gYW5jZXN0b3IgYnJhbmNoZXMpIHNvIHRoYXQgdGhlIHRyYXZlcnNhbCBjYW4gZmluZCB0aGVtLlxuXHQgKiBUaGlzIGhhcHBlbnMgcmlnaHQgYmVmb3JlIHRyYXZlcnNhbCByYXRoZXIgdGhhbiBhdCBzY2hlZHVsaW5nIHRpbWUsIHNvIHRoYXRcblx0ICogdGhlIG1hcmtlcnMgbGVmdCBvbiB0aGUgKHNoYXJlZCkgZWZmZWN0IHRyZWUgYXJlIGNyZWF0ZWQgYW5kIGNvbnN1bWVkIHdpdGhpblxuXHQgKiBhIHNpbmdsZSB0cmF2ZXJzYWwg4oCUIHNjaGVkdWxpbmcgaW50byBvdGhlciBiYXRjaGVzIGNhbiBuZXZlciBvYnNlcnZlIHRoZW1cblx0ICogQHJldHVybnMge0VmZmVjdFtdfVxuXHQgKi9cblx0I3Jlc29sdmUoKSB7XG5cdFx0LyoqIEB0eXBlIHtFZmZlY3RbXX0gKi9cblx0XHR2YXIgcm9vdHMgPSBbXTtcblxuXHRcdGZvciAoY29uc3QgZWZmZWN0IG9mIHRoaXMuI3NjaGVkdWxlZCkge1xuXHRcdFx0Ly8gc2tpcCBlZmZlY3RzIHRoYXQgYXJlIGRlc3Ryb3llZCwgb3IgdGhhdCBhbHJlYWR5IHJhbiAoZS5nLiBiZWNhdXNlXG5cdFx0XHQvLyB0aGV5IHdlcmUgcmVhY2hlZCBieSB0aGUgdHJhdmVyc2FsIHRoYXQgcHJlY2VkZWQgYSBkcmFpbiBpdGVyYXRpb24sXG5cdFx0XHQvLyBvciBiZWNhdXNlIHRoZXkgd2VyZSBzY2hlZHVsZWQgdHdpY2UpXG5cdFx0XHRpZiAoKGVmZmVjdC5mICYgREVTVFJPWUVEKSAhPT0gMCB8fCAoZWZmZWN0LmYgJiAoRElSVFkgfCBNQVlCRV9ESVJUWSkpID09PSAwKSBjb250aW51ZTtcblxuXHRcdFx0dmFyIGUgPSBlZmZlY3Q7XG5cdFx0XHR2YXIgY292ZXJlZCA9IGZhbHNlO1xuXG5cdFx0XHR3aGlsZSAoZS5wYXJlbnQgIT09IG51bGwpIHtcblx0XHRcdFx0ZSA9IGUucGFyZW50O1xuXHRcdFx0XHR2YXIgZmxhZ3MgPSBlLmY7XG5cblx0XHRcdFx0aWYgKChmbGFncyAmIChST09UX0VGRkVDVCB8IEJSQU5DSF9FRkZFQ1QpKSAhPT0gMCkge1xuXHRcdFx0XHRcdGlmICgoZmxhZ3MgJiBDTEVBTikgPT09IDApIHtcblx0XHRcdFx0XHRcdC8vIHRoZSBwYXRoIHRvIHRoZSByb290IHdhcyBhbHJlYWR5IG1hcmtlZCwgbWVhbmluZyB0aGVcblx0XHRcdFx0XHRcdC8vIHJvb3Qgd2FzIGFscmVhZHkgY29sbGVjdGVkIOKAlCBub3RoaW5nIGxlZnQgdG8gZG9cblx0XHRcdFx0XHRcdGNvdmVyZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0ZS5mIF49IENMRUFOO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICghY292ZXJlZCkge1xuXHRcdFx0XHRyb290cy5wdXNoKGUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuI3NjaGVkdWxlZCA9IFtdO1xuXG5cdFx0cmV0dXJuIHJvb3RzO1xuXHR9XG5cblx0I3Byb2Nlc3MoKSB7XG5cdFx0dGhpcy5zdGFydGVkID0gdHJ1ZTtcblxuXHRcdGlmIChERVYpIHtcblx0XHRcdC8vIHRyYWNrIGFsbCB0aGUgdmFsdWVzIHRoYXQgd2VyZSB1cGRhdGVkIGR1cmluZyB0aGlzIGZsdXNoLFxuXHRcdFx0Ly8gc28gdGhhdCB0aGV5IGNhbiBiZSByZXNldCBhZnRlcndhcmRzXG5cdFx0XHRmb3IgKGNvbnN0IHZhbHVlIG9mIHRoaXMuY3VycmVudC5rZXlzKCkpIHtcblx0XHRcdFx0c291cmNlX3N0YWNrcy5hZGQodmFsdWUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFdlIGFsd2F5cyByZXNjaGVkdWxlIHByZXZpb3VzbHktZGVmZXJyZWQgZWZmZWN0cywgbm90IGp1c3Qgd2hlblxuXHRcdC8vICNpc19kZWZlcnJlZCgpIGlzIHRydWUsIGJlY2F1c2UgdHJhdmVyc2luZyB0aGUgdHJlZSBjb3VsZCBtYWtlXG5cdFx0Ly8gYW4gaWYgYmxvY2sgdGhhdCBjb250YWlucyB0aGUgbGFzdCBibG9ja2luZyBwZW5kaW5nIGVmZmVjdCBmYWxzeSxcblx0XHQvLyBjYXVzaW5nIHRoZSBibG9jayB0byBubyBsb25nZXIgYmUgZGVmZXJyZWQuXG5cdFx0Zm9yIChjb25zdCBbZSwgc3RhdHVzXSBvZiB0aGlzLiNkaXJ0eV9yZWFjdGlvbnMpIHtcblx0XHRcdHNldF9zaWduYWxfc3RhdHVzKGUsIHN0YXR1cyk7XG5cdFx0XHR0aGlzLnNjaGVkdWxlKGUpO1xuXHRcdH1cblxuXHRcdHRoaXMuYXBwbHkoKTtcblxuXHRcdC8qKiBAdHlwZSB7RWZmZWN0W119ICovXG5cdFx0dmFyIGVmZmVjdHMgPSAoY29sbGVjdGVkX2VmZmVjdHMgPSBbXSk7XG5cblx0XHQvKiogQHR5cGUge0VmZmVjdFtdfSAqL1xuXHRcdHZhciByZW5kZXJfZWZmZWN0cyA9IFtdO1xuXG5cdFx0LyoqXG5cdFx0ICogQHR5cGUge0VmZmVjdFtdfVxuXHRcdCAqIEBkZXByZWNhdGVkIHdoZW4gd2UgZ2V0IHJpZCBvZiBsZWdhY3kgbW9kZSBhbmQgc3RvcmVzLCB3ZSBjYW4gZ2V0IHJpZCBvZiB0aGlzXG5cdFx0ICovXG5cdFx0dmFyIHVwZGF0ZXMgPSAobGVnYWN5X3VwZGF0ZXMgPSBbXSk7XG5cblx0XHQvLyBFZmZlY3RzIGNhbiBiZSBzY2hlZHVsZWQgZHVyaW5nIHRyYXZlcnNhbCAoZS5nLiBiZWNhdXNlIGEgcGFyZW50IGVhY2gvYXdhaXQvZXRjXG5cdFx0Ly8gYmxvY2sgdXBkYXRlZCBhbiBpbnRlcm5hbCBzb3VyY2UsIG9yIGJlY2F1c2UgYW4gZWZmZWN0IGludmFsaWRhdGVkIGl0c2VsZilcblx0XHQvLyBoZW5jZSB3ZSBsb29wIHVudGlsIHRoZXJlIGFyZSBubyBtb3JlIHNjaGVkdWxlZCBlZmZlY3RzLlxuXHRcdHdoaWxlICh0aGlzLiNzY2hlZHVsZWQubGVuZ3RoID4gMCkge1xuXHRcdFx0aWYgKGZsdXNoX2NvdW50KysgPiAxMDAwKSB7XG5cdFx0XHRcdHRoaXMuI3VubGluaygpO1xuXHRcdFx0XHRpbmZpbml0ZV9sb29wX2d1YXJkKCk7IC8vIFRPRE8gdHJ5IHRvIHJlc2V0X2FsbCgpIGhlcmU/XG5cdFx0XHR9XG5cblx0XHRcdGZvciAoY29uc3Qgcm9vdCBvZiB0aGlzLiNyZXNvbHZlKCkpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR0aGlzLiN0cmF2ZXJzZShyb290LCBlZmZlY3RzLCByZW5kZXJfZWZmZWN0cyk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRyZXNldF9hbGwocm9vdCk7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlcmUncyBubyBhc3luYyB3b3JrIGxlZnQsIHRoaXMgYnJhbmNoIGlzIG5vdyBkZWFkIGFuZCBuZWVkc1xuXHRcdFx0XHRcdC8vIHRvIGJlIGRpc2NhcmRlZCB0byBub3QgYmVjb21lIGEgem9tYmllIHRoYXQgaXMgbmV2ZXIgY2xlYW5lZCB1cC5cblx0XHRcdFx0XHQvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL3N2ZWx0ZS9pc3N1ZXMvMTgyMjEjaXNzdWVjb21tZW50LTQ0OTc5MTg0MTRcblx0XHRcdFx0XHQvLyBmb3IgYSAobm9uLW1pbmltYWwpIHJlcHJvZHVjdGlvbiB0aGF0IGRlbW9uc3RyYXRlcyBhIGNhc2Ugd2hlcmUgdGhpcyBpcyBuZWNlc3Nhcnlcblx0XHRcdFx0XHQvLyB0byBub3QgZ2V0IGZvbGxvdy11cCBmYWxzZS1wb3NpdGl2ZXMgdmlhIFwiYmF0Y2ggaGFzIHNjaGVkdWxlZCByb290c1wiIGludmFyaWFudCBlcnJvcnMuXG5cdFx0XHRcdFx0aWYgKCF0aGlzLiNpc19kZWZlcnJlZCgpKSB0aGlzLmRpc2NhcmQoKTtcblx0XHRcdFx0XHR0aHJvdyBlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gYW55IHdyaXRlcyBzaG91bGQgdGFrZSBlZmZlY3QgaW4gYSBzdWJzZXF1ZW50IGJhdGNoXG5cdFx0Y3VycmVudF9iYXRjaCA9IG51bGw7XG5cblx0XHRpZiAodXBkYXRlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHR2YXIgYmF0Y2ggPSBCYXRjaC5lbnN1cmUoKTtcblx0XHRcdGZvciAoY29uc3QgZSBvZiB1cGRhdGVzKSB7XG5cdFx0XHRcdGJhdGNoLnNjaGVkdWxlKGUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbGxlY3RlZF9lZmZlY3RzID0gbnVsbDtcblx0XHRsZWdhY3lfdXBkYXRlcyA9IG51bGw7XG5cblx0XHQvLyBpZiB0aGUgYmF0Y2ggaGFzIG91dHN0YW5kaW5nIHBlbmRpbmcgd29yaywgc3Rhc2ggZWZmZWN0cyBhbmQgYmFpbFxuXHRcdGlmICh0aGlzLiNpc19kZWZlcnJlZCgpKSB7XG5cdFx0XHR0aGlzLiNkZWZlcl9lZmZlY3RzKHJlbmRlcl9lZmZlY3RzKTtcblx0XHRcdHRoaXMuI2RlZmVyX2VmZmVjdHMoZWZmZWN0cyk7XG5cblx0XHRcdGZvciAoY29uc3QgW2UsIHRdIG9mIHRoaXMuI3NraXBwZWRfYnJhbmNoZXMpIHtcblx0XHRcdFx0cmVzZXRfYnJhbmNoKGUsIHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodXBkYXRlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdC8qKiBAdHlwZSB7QmF0Y2h9ICovICgvKiogQHR5cGUge3Vua25vd259ICovIChjdXJyZW50X2JhdGNoKSkuI3Byb2Nlc3MoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGVhcmxpZXJfYmF0Y2ggPSB0aGlzLiNmaW5kX2VhcmxpZXJfYmF0Y2goKTtcblxuXHRcdGlmIChlYXJsaWVyX2JhdGNoKSB7XG5cdFx0XHQvLyBJZiB0aGlzIGJhdGNoIGNvbGxlY3RlZCBkZWZlcnJlZCBlZmZlY3RzIGR1cmluZyB0cmF2ZXJzYWwsIHRoZXkgc3RpbGwgbmVlZFxuXHRcdFx0Ly8gdG8gcnVuIGFmdGVyIGJlaW5nIG1lcmdlZCBpbnRvIHRoZSBlYXJsaWVyIGJhdGNoLlxuXHRcdFx0dGhpcy4jZGVmZXJfZWZmZWN0cyhyZW5kZXJfZWZmZWN0cyk7XG5cdFx0XHR0aGlzLiNkZWZlcl9lZmZlY3RzKGVmZmVjdHMpO1xuXHRcdFx0ZWFybGllcl9iYXRjaC4jbWVyZ2UodGhpcyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gY2xlYXIgZWZmZWN0cy4gVGhvc2UgdGhhdCBhcmUgc3RpbGwgbmVlZGVkIHdpbGwgYmUgcmVzY2hlZHVsZWQgdGhyb3VnaCB1bnNraXBwaW5nIHRoZSBza2lwcGVkIGJyYW5jaGVzLlxuXHRcdHRoaXMuI2RpcnR5X3JlYWN0aW9ucy5jbGVhcigpO1xuXG5cdFx0Ly8gYXBwZW5kL3JlbW92ZSBicmFuY2hlc1xuXHRcdGZvciAoY29uc3QgZm4gb2YgdGhpcy4jY29tbWl0X2NhbGxiYWNrcykgZm4odGhpcyk7XG5cdFx0dGhpcy4jY29tbWl0X2NhbGxiYWNrcy5jbGVhcigpO1xuXG5cdFx0cHJldmlvdXNfYmF0Y2ggPSB0aGlzO1xuXHRcdGZsdXNoX3F1ZXVlZF9lZmZlY3RzKHJlbmRlcl9lZmZlY3RzKTtcblx0XHRmbHVzaF9xdWV1ZWRfZWZmZWN0cyhlZmZlY3RzKTtcblx0XHRwcmV2aW91c19iYXRjaCA9IG51bGw7XG5cblx0XHR0aGlzLiNkZWZlcnJlZD8ucmVzb2x2ZSgpO1xuXG5cdFx0dmFyIG5leHRfYmF0Y2ggPSAvKiogQHR5cGUge0JhdGNoIHwgbnVsbH0gKi8gKC8qKiBAdHlwZSB7dW5rbm93bn0gKi8gKGN1cnJlbnRfYmF0Y2gpKTtcblxuXHRcdGlmICh0aGlzLiNwZW5kaW5nID09PSAwICYmICh0aGlzLiNzY2hlZHVsZWQubGVuZ3RoID09PSAwIHx8IG5leHRfYmF0Y2ggIT09IG51bGwpKSB7XG5cdFx0XHR0aGlzLiN1bmxpbmsoKTtcblxuXHRcdFx0Ly8gT3JkZXIgbWF0dGVycyBoZXJlIC0gd2UgbmVlZCB0byBjb21taXQgYW5kIFRIRU4gY29udGludWUgZmx1c2hpbmcgbmV3IGJhdGNoZXMsIG5vdCB0aGUgb3RoZXIgd2F5IGFyb3VuZCxcblx0XHRcdC8vIGVsc2Ugd2UgY291bGQgc3RhcnQgZmx1c2hpbmcgYSBuZXcgYmF0Y2ggYW5kIHRoZW4sIGlmIGl0IGhhcyBwZW5kaW5nIHdvcmssIHJlYmFzZSBpdCByaWdodCBhZnRlcndhcmRzLCB3aGljaCBpcyB3cm9uZy5cblx0XHRcdC8vIEluIHN5bmMgbW9kZSBmbHVzaFN5bmMgY2FuIGNhdXNlICNjb21taXQgdG8gd3JvbmdmdWxseSB0aGluayB0aGF0IHRoZXJlIG5lZWRzIHRvIGJlIGEgcmViYXNlLCBzbyB3ZSBvbmx5IGRvIGl0IGluIGFzeW5jIG1vZGVcblx0XHRcdC8vIFRPRE8gZml4IHRoZSB1bmRlcmx5aW5nIGNhdXNlLCBvdGhlcndpc2UgdGhpcyB3aWxsIGxpa2VseSByZWdyZXNzIHdoZW4gbm9uLWFzeW5jIG1vZGUgaXMgcmVtb3ZlZFxuXHRcdFx0aWYgKGFzeW5jX21vZGVfZmxhZykge1xuXHRcdFx0XHR0aGlzLiNjb21taXQoKTtcblx0XHRcdFx0Ly8gUmViYXNlcyBjYW4gYWN0aXZhdGUgb3RoZXIgYmF0Y2hlcyBvciBudWxsIGl0IG91dCwgdGhlcmVmb3JlIHJlc3RvcmUgdGhlIG5ldyBvbmUgaGVyZVxuXHRcdFx0XHRjdXJyZW50X2JhdGNoID0gbmV4dF9iYXRjaDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAobmV4dF9iYXRjaCAhPT0gbnVsbCkge1xuXHRcdFx0b2xkX3ZhbHVlcy5jbGVhcigpO1xuXHRcdFx0bmV4dF9iYXRjaC4jcHJvY2VzcygpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBUcmF2ZXJzZSB0aGUgZWZmZWN0IHRyZWUsIGV4ZWN1dGluZyBlZmZlY3RzIG9yIHN0YXNoaW5nXG5cdCAqIHRoZW0gZm9yIGxhdGVyIGV4ZWN1dGlvbiBhcyBhcHByb3ByaWF0ZVxuXHQgKiBAcGFyYW0ge0VmZmVjdH0gcm9vdFxuXHQgKiBAcGFyYW0ge0VmZmVjdFtdfSBlZmZlY3RzXG5cdCAqIEBwYXJhbSB7RWZmZWN0W119IHJlbmRlcl9lZmZlY3RzXG5cdCAqL1xuXHQjdHJhdmVyc2Uocm9vdCwgZWZmZWN0cywgcmVuZGVyX2VmZmVjdHMpIHtcblx0XHRyb290LmYgXj0gQ0xFQU47XG5cblx0XHR2YXIgZWZmZWN0ID0gcm9vdC5maXJzdDtcblxuXHRcdHdoaWxlIChlZmZlY3QgIT09IG51bGwpIHtcblx0XHRcdHZhciBmbGFncyA9IGVmZmVjdC5mO1xuXHRcdFx0dmFyIGlzX2JyYW5jaCA9IChmbGFncyAmIChCUkFOQ0hfRUZGRUNUIHwgUk9PVF9FRkZFQ1QpKSAhPT0gMDtcblx0XHRcdHZhciBpc19za2lwcGFibGVfYnJhbmNoID0gaXNfYnJhbmNoICYmIChmbGFncyAmIENMRUFOKSAhPT0gMDtcblxuXHRcdFx0dmFyIHNraXAgPSBpc19za2lwcGFibGVfYnJhbmNoIHx8IChmbGFncyAmIElORVJUKSAhPT0gMCB8fCB0aGlzLiNza2lwcGVkX2JyYW5jaGVzLmhhcyhlZmZlY3QpO1xuXG5cdFx0XHRpZiAoIXNraXAgJiYgZWZmZWN0LmZuICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc19icmFuY2gpIHtcblx0XHRcdFx0XHRlZmZlY3QuZiBePSBDTEVBTjtcblx0XHRcdFx0fSBlbHNlIGlmICgoZmxhZ3MgJiBFRkZFQ1QpICE9PSAwKSB7XG5cdFx0XHRcdFx0ZWZmZWN0cy5wdXNoKGVmZmVjdCk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoYXN5bmNfbW9kZV9mbGFnICYmIChmbGFncyAmIChSRU5ERVJfRUZGRUNUIHwgTUFOQUdFRF9FRkZFQ1QpKSAhPT0gMCkge1xuXHRcdFx0XHRcdHJlbmRlcl9lZmZlY3RzLnB1c2goZWZmZWN0KTtcblx0XHRcdFx0fSBlbHNlIGlmIChpc19kaXJ0eShlZmZlY3QpKSB7XG5cdFx0XHRcdFx0aWYgKChmbGFncyAmIEJMT0NLX0VGRkVDVCkgIT09IDApIHRoaXMuYWRkX2RpcnR5X3JlYWN0aW9uKGVmZmVjdCwgTUFZQkVfRElSVFkpO1xuXHRcdFx0XHRcdHVwZGF0ZV9lZmZlY3QoZWZmZWN0KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBjaGlsZCA9IGVmZmVjdC5maXJzdDtcblxuXHRcdFx0XHRpZiAoY2hpbGQgIT09IG51bGwpIHtcblx0XHRcdFx0XHRlZmZlY3QgPSBjaGlsZDtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR3aGlsZSAoZWZmZWN0ICE9PSBudWxsKSB7XG5cdFx0XHRcdHZhciBuZXh0ID0gZWZmZWN0Lm5leHQ7XG5cblx0XHRcdFx0aWYgKG5leHQgIT09IG51bGwpIHtcblx0XHRcdFx0XHRlZmZlY3QgPSBuZXh0O1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWZmZWN0ID0gZWZmZWN0LnBhcmVudDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQjZmluZF9lYXJsaWVyX2JhdGNoKCkge1xuXHRcdGZvciAodmFyIGJhdGNoID0gdGhpcy5wcmV2OyBiYXRjaCAhPT0gbnVsbDsgYmF0Y2ggPSBiYXRjaC5wcmV2KSB7XG5cdFx0XHRpZiAoIWJhdGNoLmlzX2ZvcmsgJiYgdGhpcy4jaW50ZXJzZWN0cyhiYXRjaCkpIHJldHVybiBiYXRjaDtcblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdC8qKiBAcGFyYW0ge0JhdGNofSBiYXRjaCAqL1xuXHQjaW50ZXJzZWN0cyhiYXRjaCkge1xuXHRcdGZvciAoY29uc3QgW3NvdXJjZSwgWywgaXNfZGVyaXZlZF1dIG9mIHRoaXMuY3VycmVudCkge1xuXHRcdFx0aWYgKGlzX2Rlcml2ZWQpIGNvbnRpbnVlO1xuXHRcdFx0aWYgKGJhdGNoLmN1cnJlbnQuaGFzKHNvdXJjZSkpIHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0JhdGNofSBiYXRjaFxuXHQgKi9cblx0I21lcmdlKGJhdGNoKSB7XG5cdFx0Zm9yIChjb25zdCBbc291cmNlLCB2YWx1ZV0gb2YgYmF0Y2guY3VycmVudCkge1xuXHRcdFx0aWYgKCF0aGlzLnByZXZpb3VzLmhhcyhzb3VyY2UpICYmIGJhdGNoLnByZXZpb3VzLmhhcyhzb3VyY2UpKSB7XG5cdFx0XHRcdHRoaXMucHJldmlvdXMuc2V0KHNvdXJjZSwgYmF0Y2gucHJldmlvdXMuZ2V0KHNvdXJjZSkpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmN1cnJlbnQuc2V0KHNvdXJjZSwgdmFsdWUpO1xuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgW2VmZmVjdCwgZGVmZXJyZWRdIG9mIGJhdGNoLmFzeW5jX2Rlcml2ZWRzKSB7XG5cdFx0XHRjb25zdCBkID0gdGhpcy5hc3luY19kZXJpdmVkcy5nZXQoZWZmZWN0KTtcblx0XHRcdGlmIChkKSBkZWZlcnJlZC5wcm9taXNlLnRoZW4oZC5yZXNvbHZlKS5jYXRjaChkLnJlamVjdCk7XG5cdFx0fVxuXG5cdFx0Ly8gQ2xlYXIgdGhlbSBvciBlbHNlIHRob3NlIHRoYXQgYXJlIHN0aWxsIHBlbmRpbmcgbWlnaHQgZ2V0IHJlamVjdGVkIG9uIGRpc2NhcmQgKGFmdGVyIG1lcmdlZC1pbnRvIGJhdGNoIGlzIGRvbmUpLlxuXHRcdC8vIFRoaXMgY2FuIGhhcHBlbiB3aGVuIGJhdGNoIFkgbWVyZ2VkIGludG8gWCBhbmQgWSBoYXMgYSBwZW5kaW5nIGJvdW5kYXJ5IGFuZCB0aGVyZWZvcmUgc3RpbGwtcGVuZGluZyBhc3luYyBkZXJpdmVkcyBpbnNpZGUuXG5cdFx0YmF0Y2guYXN5bmNfZGVyaXZlZHMuY2xlYXIoKTtcblxuXHRcdC8vIE1hcmsgaXMgbm90IGd1YXJhbnRlZWQgbm90IHRvdWNoIHRoZXNlLCBzbyB3ZSB0cmFuc2ZlciB0aGVtXG5cdFx0dGhpcy50cmFuc2Zlcl9yZWFjdGlvbnMoYmF0Y2guI2RpcnR5X3JlYWN0aW9ucyk7XG5cblx0XHQvKipcblx0XHQgKiBtYXJrIGFsbCBlZmZlY3RzIHRoYXQgZGVwZW5kIG9uIGBiYXRjaC5jdXJyZW50YCwgZXhjZXB0IHRoZVxuXHRcdCAqIGFzeW5jIGVmZmVjdHMgdGhhdCB3ZSBqdXN0IHJlc29sdmVkIChUT0RPIHVubGVzcyB0aGV5IGRlcGVuZFxuXHRcdCAqIG9uIHZhbHVlcyBpbiB0aGlzIGJhdGNoIHRoYXQgYXJlIE5PVCBpbiB0aGUgbGF0ZXIgYmF0Y2g/KS5cblx0XHQgKiBUaHJvdWdoIHRoaXMgd2UgYWxzbyB3aWxsIHBvcHVsYXRlIHRoZSBjb3JyZWN0ICNza2lwcGVkX2JyYW5jaGVzLFxuXHRcdCAqIG9uY29tbWl0IGNhbGxiYWNrcyBldGMsIHNvIHdlIGRvbid0IG5lZWQgdG8gbWVyZ2UgdGhlbSBzZXBhcmF0ZWx5LlxuXHRcdCAqIEBwYXJhbSB7VmFsdWV9IHZhbHVlXG5cdFx0ICovXG5cdFx0Y29uc3QgbWFyayA9ICh2YWx1ZSkgPT4ge1xuXHRcdFx0dmFyIHJlYWN0aW9ucyA9IHZhbHVlLnJlYWN0aW9ucztcblx0XHRcdGlmIChyZWFjdGlvbnMgPT09IG51bGwpIHJldHVybjtcblx0XHRcdC8vIHNraXAgaWYgdmFsdWUgaXMgZGVyaXZlZCBhbmQgaXMgbmVpdGhlciBkaXJ0eSBub3IgbWF5YmUgZGlydHkuIHRyYW5zaXRpdmVcblx0XHRcdC8vIGRlcml2ZWRzIChhIGRlcml2ZWQgZGVwZW5kaW5nIG9uIGFub3RoZXIgZGVyaXZlZCkgYXJlIG9ubHkgTUFZQkVfRElSVFksIHNvXG5cdFx0XHQvLyB3ZSBtdXN0IGNvbnRpbnVlIHRyYXZlcnNpbmcgdGhlbSB0byByZWFjaCB0aGUgZWZmZWN0cyB0aGF0IGRlcGVuZCBvbiB0aGVtXG5cdFx0XHRpZiAoKHZhbHVlLmYgJiBERVJJVkVEKSAhPT0gMCAmJiAodmFsdWUuZiAmIChESVJUWSB8IE1BWUJFX0RJUlRZKSkgPT09IDApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKGNvbnN0IHJlYWN0aW9uIG9mIHJlYWN0aW9ucykge1xuXHRcdFx0XHR2YXIgZmxhZ3MgPSByZWFjdGlvbi5mO1xuXG5cdFx0XHRcdGlmICgoZmxhZ3MgJiBERVJJVkVEKSAhPT0gMCkge1xuXHRcdFx0XHRcdG1hcmsoLyoqIEB0eXBlIHtEZXJpdmVkfSAqLyAocmVhY3Rpb24pKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2YXIgZWZmZWN0ID0gLyoqIEB0eXBlIHtFZmZlY3R9ICovIChyZWFjdGlvbik7XG5cblx0XHRcdFx0XHRpZiAoZmxhZ3MgJiAoQVNZTkMgfCBCTE9DS19FRkZFQ1QpICYmICF0aGlzLmFzeW5jX2Rlcml2ZWRzLmhhcyhlZmZlY3QpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLiNkaXJ0eV9yZWFjdGlvbnMuZGVsZXRlKGVmZmVjdCk7XG5cdFx0XHRcdFx0XHRzZXRfc2lnbmFsX3N0YXR1cyhlZmZlY3QsIERJUlRZKTtcblx0XHRcdFx0XHRcdHRoaXMuc2NoZWR1bGUoZWZmZWN0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Zm9yIChjb25zdCBzb3VyY2Ugb2YgdGhpcy5jdXJyZW50LmtleXMoKSkge1xuXHRcdFx0bWFyayhzb3VyY2UpO1xuXHRcdH1cblxuXHRcdHRoaXMub25jb21taXQoKCkgPT4gYmF0Y2guZGlzY2FyZCgpKTtcblx0XHRiYXRjaC4jdW5saW5rKCk7XG5cblx0XHRjdXJyZW50X2JhdGNoID0gdGhpcztcblx0XHR0aGlzLiNwcm9jZXNzKCk7XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIHtFZmZlY3RbXX0gZWZmZWN0c1xuXHQgKi9cblx0I2RlZmVyX2VmZmVjdHMoZWZmZWN0cykge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZWZmZWN0cy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0ZGVmZXJfZWZmZWN0KGVmZmVjdHNbaV0sIHRoaXMuI2RpcnR5X3JlYWN0aW9ucyk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEFzc29jaWF0ZSBhIGNoYW5nZSB0byBhIGdpdmVuIHNvdXJjZSB3aXRoIHRoZSBjdXJyZW50XG5cdCAqIGJhdGNoLCBub3RpbmcgaXRzIHByZXZpb3VzIGFuZCBjdXJyZW50IHZhbHVlc1xuXHQgKiBAcGFyYW0ge1ZhbHVlfSBzb3VyY2Vcblx0ICogQHBhcmFtIHthbnl9IHZhbHVlXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzX2Rlcml2ZWRdXG5cdCAqL1xuXHRjYXB0dXJlKHNvdXJjZSwgdmFsdWUsIGlzX2Rlcml2ZWQgPSBmYWxzZSkge1xuXHRcdGlmIChzb3VyY2UudiAhPT0gVU5JTklUSUFMSVpFRCAmJiAhdGhpcy5wcmV2aW91cy5oYXMoc291cmNlKSkge1xuXHRcdFx0dGhpcy5wcmV2aW91cy5zZXQoc291cmNlLCBzb3VyY2Uudik7XG5cdFx0fVxuXG5cdFx0Ly8gRG9uJ3Qgc2F2ZSBlcnJvcnMgaW4gYGJhdGNoX3ZhbHVlc2AsIG9yIHRoZXkgd29uJ3QgYmUgdGhyb3duIGluIGBydW50aW1lLmpzI2dldGBcblx0XHRpZiAoKHNvdXJjZS5mICYgRVJST1JfVkFMVUUpID09PSAwKSB7XG5cdFx0XHR0aGlzLmN1cnJlbnQuc2V0KHNvdXJjZSwgW3ZhbHVlLCBpc19kZXJpdmVkXSk7XG5cdFx0XHRiYXRjaF92YWx1ZXM/LnNldChzb3VyY2UsIHZhbHVlKTtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuaXNfZm9yaykge1xuXHRcdFx0c291cmNlLnYgPSB2YWx1ZTtcblx0XHR9XG5cdH1cblxuXHRhY3RpdmF0ZSgpIHtcblx0XHRjdXJyZW50X2JhdGNoID0gdGhpcztcblx0fVxuXG5cdGRlYWN0aXZhdGUoKSB7XG5cdFx0Y3VycmVudF9iYXRjaCA9IG51bGw7XG5cdFx0YmF0Y2hfdmFsdWVzID0gbnVsbDtcblx0fVxuXG5cdGZsdXNoKCkge1xuXHRcdHRyeSB7XG5cdFx0XHRpZiAoREVWKSB7XG5cdFx0XHRcdHNvdXJjZV9zdGFja3MuY2xlYXIoKTtcblx0XHRcdH1cblxuXHRcdFx0aXNfcHJvY2Vzc2luZyA9IHRydWU7XG5cdFx0XHRjdXJyZW50X2JhdGNoID0gdGhpcztcblxuXHRcdFx0dGhpcy4jcHJvY2VzcygpO1xuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRmbHVzaF9jb3VudCA9IDA7XG5cdFx0XHRsYXN0X3NjaGVkdWxlZF9lZmZlY3QgPSBudWxsO1xuXHRcdFx0Y29sbGVjdGVkX2VmZmVjdHMgPSBudWxsO1xuXHRcdFx0bGVnYWN5X3VwZGF0ZXMgPSBudWxsO1xuXHRcdFx0aXNfcHJvY2Vzc2luZyA9IGZhbHNlO1xuXG5cdFx0XHRjdXJyZW50X2JhdGNoID0gbnVsbDtcblx0XHRcdGJhdGNoX3ZhbHVlcyA9IG51bGw7XG5cblx0XHRcdG9sZF92YWx1ZXMuY2xlYXIoKTtcblxuXHRcdFx0aWYgKERFVikge1xuXHRcdFx0XHRmb3IgKGNvbnN0IHNvdXJjZSBvZiBzb3VyY2Vfc3RhY2tzKSB7XG5cdFx0XHRcdFx0c291cmNlLnVwZGF0ZWQgPSBudWxsO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZGlzY2FyZCgpIHtcblx0XHRmb3IgKGNvbnN0IGZuIG9mIHRoaXMuI2Rpc2NhcmRfY2FsbGJhY2tzKSBmbih0aGlzKTtcblx0XHR0aGlzLiNkaXNjYXJkX2NhbGxiYWNrcy5jbGVhcigpO1xuXG5cdFx0Zm9yIChjb25zdCBkZWZlcnJlZCBvZiB0aGlzLmFzeW5jX2Rlcml2ZWRzLnZhbHVlcygpKSB7XG5cdFx0XHRkZWZlcnJlZC5yZWplY3QoT0JTT0xFVEUpO1xuXHRcdH1cblxuXHRcdHRoaXMuI3VubGluaygpO1xuXHRcdHRoaXMuI2RlZmVycmVkPy5yZXNvbHZlKCk7XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIHtFZmZlY3R9IGVmZmVjdFxuXHQgKi9cblx0cmVnaXN0ZXJfY3JlYXRlZF9lZmZlY3QoZWZmZWN0KSB7XG5cdFx0dGhpcy4jbmV3X2VmZmVjdHMucHVzaChlZmZlY3QpO1xuXHR9XG5cblx0I2NvbW1pdCgpIHtcblx0XHQvLyBJZiB0aGVyZSBhcmUgb3RoZXIgcGVuZGluZyBiYXRjaGVzLCB0aGV5IG5vdyBuZWVkIHRvIGJlICdyZWJhc2VkJyDigJRcblx0XHQvLyBpbiBvdGhlciB3b3Jkcywgd2UgcmUtcnVuIGJsb2NrL2FzeW5jIGVmZmVjdHMgd2l0aCB0aGUgbmV3bHlcblx0XHQvLyBjb21taXR0ZWQgc3RhdGUsIHVubGVzcyB0aGUgYmF0Y2ggaW4gcXVlc3Rpb24gaGFzIGEgbW9yZVxuXHRcdC8vIHJlY2VudCB2YWx1ZSBmb3IgYSBnaXZlbiBzb3VyY2Vcblx0XHRmb3IgKGxldCBiYXRjaCA9IGZpcnN0X2JhdGNoOyBiYXRjaCAhPT0gbnVsbDsgYmF0Y2ggPSBiYXRjaC5uZXh0KSB7XG5cdFx0XHR2YXIgaXNfZWFybGllciA9IGJhdGNoLmlkIDwgdGhpcy5pZDtcblxuXHRcdFx0LyoqIEB0eXBlIHtTb3VyY2VbXX0gKi9cblx0XHRcdHZhciBzb3VyY2VzID0gW107XG5cblx0XHRcdGZvciAoY29uc3QgW3NvdXJjZSwgW3ZhbHVlLCBpc19kZXJpdmVkXV0gb2YgdGhpcy5jdXJyZW50KSB7XG5cdFx0XHRcdGlmIChiYXRjaC5jdXJyZW50Lmhhcyhzb3VyY2UpKSB7XG5cdFx0XHRcdFx0dmFyIGJhdGNoX3ZhbHVlID0gLyoqIEB0eXBlIHtbYW55LCBib29sZWFuXX0gKi8gKGJhdGNoLmN1cnJlbnQuZ2V0KHNvdXJjZSkpWzBdOyAvLyBmYXN0ZXIgdGhhbiBkZXN0cnVjdHVyaW5nXG5cblx0XHRcdFx0XHRpZiAoaXNfZWFybGllciAmJiB2YWx1ZSAhPT0gYmF0Y2hfdmFsdWUpIHtcblx0XHRcdFx0XHRcdC8vIGJyaW5nIHRoZSB2YWx1ZSB1cCB0byBkYXRlXG5cdFx0XHRcdFx0XHRiYXRjaC5jdXJyZW50LnNldChzb3VyY2UsIFt2YWx1ZSwgaXNfZGVyaXZlZF0pO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyBzYW1lIHZhbHVlIG9yIGxhdGVyIGJhdGNoIGhhcyBtb3JlIHJlY2VudCB2YWx1ZSxcblx0XHRcdFx0XHRcdC8vIG5vIG5lZWQgdG8gcmUtcnVuIHRoZXNlIGVmZmVjdHNcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHNvdXJjZXMucHVzaChzb3VyY2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoaXNfZWFybGllcikge1xuXHRcdFx0XHQvLyBUT0RPIGRvIHdlIG5lZWQgdG8gcmVzdGFydCB0aGVzZSBpbiBzb21lIGNhc2VzLCBpbnN0ZWFkIG9mXG5cdFx0XHRcdC8vIGltbWVkaWF0ZWx5IHJlc29sdmluZyB0aGVtPyBMaWtlbHkgbm90IGJlY2F1c2Ugb2YgaG93IHRoaXMuYXBwbHkoKSB3b3Jrcy5cblx0XHRcdFx0Zm9yIChjb25zdCBbZWZmZWN0LCBkZWZlcnJlZF0gb2YgdGhpcy5hc3luY19kZXJpdmVkcykge1xuXHRcdFx0XHRcdGNvbnN0IGQgPSBiYXRjaC5hc3luY19kZXJpdmVkcy5nZXQoZWZmZWN0KTtcblx0XHRcdFx0XHRpZiAoZCkgZGVmZXJyZWQucHJvbWlzZS50aGVuKGQucmVzb2x2ZSkuY2F0Y2goZC5yZWplY3QpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHZhciBjdXJyZW50ID0gWy4uLmJhdGNoLmN1cnJlbnQua2V5cygpXS5maWx0ZXIoXG5cdFx0XHRcdChzb3VyY2UpID0+ICEoLyoqIEB0eXBlIHtbYW55LCBib29sZWFuXX0gKi8gKGJhdGNoLmN1cnJlbnQuZ2V0KHNvdXJjZSkpWzFdKVxuXHRcdFx0KTtcblxuXHRcdFx0Ly8gSWYgbm90IHN0YXJ0ZWQgeWV0IG9yIG5vIHNvdXJjZXMgdG8gdXBkYXRlICh3aGljaCBpcyBlLmcuIHBvc3NpYmxlIGZvciB0aGUgdmVyeSBmaXJzdCBiYXRjaCkgdGhlbiBiYWlsXG5cdFx0XHRpZiAoIWJhdGNoLnN0YXJ0ZWQgfHwgY3VycmVudC5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuXG5cdFx0XHQvLyBSZS1ydW4gYXN5bmMvYmxvY2sgZWZmZWN0cyB0aGF0IGRlcGVuZCBvbiBkaXN0aW5jdCB2YWx1ZXMgY2hhbmdlZCBpbiBib3RoIGJhdGNoZXMgKGlnbm9yaW5nIGRlcml2ZWRzKVxuXHRcdFx0dmFyIG90aGVycyA9IGN1cnJlbnQuZmlsdGVyKChzb3VyY2UpID0+ICF0aGlzLmN1cnJlbnQuaGFzKHNvdXJjZSkpO1xuXG5cdFx0XHRpZiAob3RoZXJzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRpZiAoaXNfZWFybGllcikge1xuXHRcdFx0XHRcdC8vIHRoaXMgYmF0Y2ggaXMgbm93IG9ic29sZXRlIGFuZCBjYW4gYmUgZGlzY2FyZGVkXG5cdFx0XHRcdFx0YmF0Y2guZGlzY2FyZCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKHNvdXJjZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHQvLyBUaGUgbWljcm90YXNrIHF1ZXVlIGNhbiBjb250YWluIHRoZSBiYXRjaCBhbHJlYWR5IHNjaGVkdWxlZCB0byBydW4gcmlnaHRcblx0XHRcdFx0Ly8gYWZ0ZXIgdGhpcyBvbmUgaXMgZmluaXNoZWQsIHNvIHRocm93aW5nIHRoZSBpbnZhcmlhbnQgd291bGQgYmUgd3JvbmcgaGVyZS5cblx0XHRcdFx0aWYgKERFViAmJiAhYmF0Y2guI2RlY3JlbWVudF9xdWV1ZWQpIHtcblx0XHRcdFx0XHRpbnZhcmlhbnQoYmF0Y2guI3NjaGVkdWxlZC5sZW5ndGggPT09IDAsICdCYXRjaCBoYXMgc2NoZWR1bGVkIGVmZmVjdHMnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEEgYmF0Y2ggd2FzIHVuc2tpcHBlZCBpbiBhIGxhdGVyIGJhdGNoIC0+IHRlbGwgcHJpb3IgYmF0Y2hlcyB0byB1bnNraXAgaXQsIHRvb1xuXHRcdFx0XHRpZiAoaXNfZWFybGllcikge1xuXHRcdFx0XHRcdGZvciAoY29uc3QgdW5za2lwcGVkIG9mIHRoaXMuI3Vuc2tpcHBlZF9icmFuY2hlcykge1xuXHRcdFx0XHRcdFx0YmF0Y2gudW5za2lwX2VmZmVjdCh1bnNraXBwZWQsIChlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGlmICgoZS5mICYgKEJMT0NLX0VGRkVDVCB8IEFTWU5DKSkgIT09IDApIHtcblx0XHRcdFx0XHRcdFx0XHRiYXRjaC5zY2hlZHVsZShlKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRiYXRjaC4jZGVmZXJfZWZmZWN0cyhbZV0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRiYXRjaC5hY3RpdmF0ZSgpO1xuXG5cdFx0XHRcdC8qKiBAdHlwZSB7U2V0PFZhbHVlPn0gKi9cblx0XHRcdFx0dmFyIG1hcmtlZCA9IG5ldyBTZXQoKTtcblxuXHRcdFx0XHQvKiogQHR5cGUge01hcDxSZWFjdGlvbiwgYm9vbGVhbj59ICovXG5cdFx0XHRcdHZhciBjaGVja2VkID0gbmV3IE1hcCgpO1xuXG5cdFx0XHRcdGZvciAodmFyIHNvdXJjZSBvZiBzb3VyY2VzKSB7XG5cdFx0XHRcdFx0bWFya19lZmZlY3RzKHNvdXJjZSwgb3RoZXJzLCBtYXJrZWQsIGNoZWNrZWQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2hlY2tlZCA9IG5ldyBNYXAoKTtcblx0XHRcdFx0dmFyIGN1cnJlbnRfdW5lcXVhbCA9IFsuLi5iYXRjaC5jdXJyZW50XVxuXHRcdFx0XHRcdC5maWx0ZXIoKFtjLCB2MV0pID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHYyID0gdGhpcy5jdXJyZW50LmdldChjKTtcblx0XHRcdFx0XHRcdGlmICghdjIpIHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdFx0Ly8gRWl0aGVyIHRoZWlyIHZhbHVlcyBhcmUgZGlmZmVyZW50IG9yIG9uZSBpcyBhIGRlcml2ZWQgYnV0IG5vdCB0aGUgb3RoZXJcblx0XHRcdFx0XHRcdHJldHVybiB2MlswXSAhPT0gdjFbMF0gfHwgdjJbMV0gIT09IHYxWzFdO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0Lm1hcCgoW2NdKSA9PiBjKTtcblxuXHRcdFx0XHRpZiAoY3VycmVudF91bmVxdWFsLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRmb3IgKGNvbnN0IGVmZmVjdCBvZiB0aGlzLiNuZXdfZWZmZWN0cykge1xuXHRcdFx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdFx0XHQoZWZmZWN0LmYgJiAoREVTVFJPWUVEIHwgSU5FUlQgfCBFQUdFUl9FRkZFQ1QpKSA9PT0gMCAmJlxuXHRcdFx0XHRcdFx0XHRkZXBlbmRzX29uKGVmZmVjdCwgY3VycmVudF91bmVxdWFsLCBjaGVja2VkKVxuXHRcdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRcdGlmICgoZWZmZWN0LmYgJiAoQVNZTkMgfCBCTE9DS19FRkZFQ1QpKSAhPT0gMCkge1xuXHRcdFx0XHRcdFx0XHRcdHNldF9zaWduYWxfc3RhdHVzKGVmZmVjdCwgRElSVFkpO1xuXHRcdFx0XHRcdFx0XHRcdGJhdGNoLnNjaGVkdWxlKGVmZmVjdCk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0YmF0Y2guYWRkX2RpcnR5X3JlYWN0aW9uKGVmZmVjdCwgRElSVFkpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gT25seSBhcHBseSBhbmQgdHJhdmVyc2Ugd2hlbiB3ZSBrbm93IHdlIHRyaWdnZXJlZCBhc3luYyB3b3JrIHdpdGggbWFya2luZyB0aGUgZWZmZWN0c1xuXHRcdFx0XHQvLyBhbmQga25vdyB0aGlzIHdvbid0IHJ1biBhbnl3YXkgcmlnaHQgYWZ0ZXJ3YXJkc1xuXHRcdFx0XHRpZiAoYmF0Y2guI3NjaGVkdWxlZC5sZW5ndGggPiAwICYmICFiYXRjaC4jZGVjcmVtZW50X3F1ZXVlZCkge1xuXHRcdFx0XHRcdGJhdGNoLmFwcGx5KCk7XG5cblx0XHRcdFx0XHRmb3IgKHZhciByb290IG9mIGJhdGNoLiNyZXNvbHZlKCkpIHtcblx0XHRcdFx0XHRcdGJhdGNoLiN0cmF2ZXJzZShyb290LCBbXSwgW10pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJhdGNoLmRlYWN0aXZhdGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIHtib29sZWFufSBibG9ja2luZ1xuXHQgKiBAcGFyYW0ge0VmZmVjdH0gZWZmZWN0XG5cdCAqL1xuXHRpbmNyZW1lbnQoYmxvY2tpbmcsIGVmZmVjdCkge1xuXHRcdHRoaXMuI3BlbmRpbmcgKz0gMTtcblxuXHRcdGlmIChibG9ja2luZykge1xuXHRcdFx0bGV0IGJsb2NraW5nX3BlbmRpbmdfY291bnQgPSB0aGlzLiNibG9ja2luZ19wZW5kaW5nLmdldChlZmZlY3QpID8/IDA7XG5cdFx0XHR0aGlzLiNibG9ja2luZ19wZW5kaW5nLnNldChlZmZlY3QsIGJsb2NraW5nX3BlbmRpbmdfY291bnQgKyAxKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIHtib29sZWFufSBibG9ja2luZ1xuXHQgKiBAcGFyYW0ge0VmZmVjdH0gZWZmZWN0XG5cdCAqL1xuXHRkZWNyZW1lbnQoYmxvY2tpbmcsIGVmZmVjdCkge1xuXHRcdHRoaXMuI3BlbmRpbmcgLT0gMTtcblxuXHRcdGlmIChibG9ja2luZykge1xuXHRcdFx0bGV0IGJsb2NraW5nX3BlbmRpbmdfY291bnQgPSB0aGlzLiNibG9ja2luZ19wZW5kaW5nLmdldChlZmZlY3QpID8/IDA7XG5cblx0XHRcdGlmIChibG9ja2luZ19wZW5kaW5nX2NvdW50ID09PSAxKSB7XG5cdFx0XHRcdHRoaXMuI2Jsb2NraW5nX3BlbmRpbmcuZGVsZXRlKGVmZmVjdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLiNibG9ja2luZ19wZW5kaW5nLnNldChlZmZlY3QsIGJsb2NraW5nX3BlbmRpbmdfY291bnQgLSAxKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAodGhpcy4jZGVjcmVtZW50X3F1ZXVlZCkgcmV0dXJuO1xuXHRcdHRoaXMuI2RlY3JlbWVudF9xdWV1ZWQgPSB0cnVlO1xuXG5cdFx0cXVldWVfbWljcm9fdGFzaygoKSA9PiB7XG5cdFx0XHR0aGlzLiNkZWNyZW1lbnRfcXVldWVkID0gZmFsc2U7XG5cblx0XHRcdGlmICh0aGlzLmxpbmtlZCkge1xuXHRcdFx0XHR0aGlzLmZsdXNoKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIHtNYXA8RWZmZWN0LCBudW1iZXI+fSBkaXJ0eV9yZWFjdGlvbnNcblx0ICovXG5cdHRyYW5zZmVyX3JlYWN0aW9ucyhkaXJ0eV9yZWFjdGlvbnMpIHtcblx0XHRmb3IgKGNvbnN0IFtlZmZlY3QsIHN0YXR1c10gb2YgZGlydHlfcmVhY3Rpb25zKSB7XG5cdFx0XHR0aGlzLmFkZF9kaXJ0eV9yZWFjdGlvbihlZmZlY3QsIHN0YXR1cyk7XG5cdFx0fVxuXG5cdFx0ZGlydHlfcmVhY3Rpb25zLmNsZWFyKCk7XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIHtFZmZlY3R9IGVmZmVjdFxuXHQgKiBAcGFyYW0ge251bWJlcn0gc3RhdHVzXG5cdCAqL1xuXHRhZGRfZGlydHlfcmVhY3Rpb24oZWZmZWN0LCBzdGF0dXMpIHtcblx0XHRpZiAoc3RhdHVzID09PSBESVJUWSB8fCB0aGlzLiNkaXJ0eV9yZWFjdGlvbnMuZ2V0KGVmZmVjdCkgIT09IERJUlRZKSB7XG5cdFx0XHR0aGlzLiNkaXJ0eV9yZWFjdGlvbnMuc2V0KGVmZmVjdCwgc3RhdHVzKTtcblx0XHR9XG5cdH1cblxuXHQvKiogQHBhcmFtIHsoYmF0Y2g6IEJhdGNoKSA9PiB2b2lkfSBmbiAqL1xuXHRvbmNvbW1pdChmbikge1xuXHRcdHRoaXMuI2NvbW1pdF9jYWxsYmFja3MuYWRkKGZuKTtcblx0fVxuXG5cdC8qKiBAcGFyYW0geyhiYXRjaDogQmF0Y2gpID0+IHZvaWR9IGZuICovXG5cdG9uZGlzY2FyZChmbikge1xuXHRcdHRoaXMuI2Rpc2NhcmRfY2FsbGJhY2tzLmFkZChmbik7XG5cdH1cblxuXHRzZXR0bGVkKCkge1xuXHRcdHJldHVybiAodGhpcy4jZGVmZXJyZWQgPz89IGRlZmVycmVkKCkpLnByb21pc2U7XG5cdH1cblxuXHRzdGF0aWMgZW5zdXJlKCkge1xuXHRcdGlmIChjdXJyZW50X2JhdGNoID09PSBudWxsKSB7XG5cdFx0XHRjb25zdCBiYXRjaCA9IChjdXJyZW50X2JhdGNoID0gbmV3IEJhdGNoKCkpO1xuXG5cdFx0XHRpZiAoIWlzX3Byb2Nlc3NpbmcgJiYgIWlzX2ZsdXNoaW5nX3N5bmMpIHtcblx0XHRcdFx0cXVldWVfbWljcm9fdGFzaygoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKCFiYXRjaC5zdGFydGVkKSB7XG5cdFx0XHRcdFx0XHRiYXRjaC5mbHVzaCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGN1cnJlbnRfYmF0Y2g7XG5cdH1cblxuXHRhcHBseSgpIHtcblx0XHRpZiAoIWFzeW5jX21vZGVfZmxhZyB8fCAoIXRoaXMuaXNfZm9yayAmJiB0aGlzLnByZXYgPT09IG51bGwgJiYgdGhpcy5uZXh0ID09PSBudWxsKSkge1xuXHRcdFx0YmF0Y2hfdmFsdWVzID0gbnVsbDtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgYmF0Y2hlcywgd2UgYXJlICd0aW1lIHRyYXZlbGxpbmcnIOKAlFxuXHRcdC8vIHdlIG5lZWQgdG8gb3ZlcnJpZGUgdmFsdWVzIHdpdGggdGhlIG9uZXMgaW4gdGhpcyBiYXRjaC4uLlxuXHRcdGJhdGNoX3ZhbHVlcyA9IG5ldyBNYXAoKTtcblx0XHRmb3IgKGNvbnN0IFtzb3VyY2UsIFt2YWx1ZV1dIG9mIHRoaXMuY3VycmVudCkge1xuXHRcdFx0YmF0Y2hfdmFsdWVzLnNldChzb3VyY2UsIHZhbHVlKTtcblx0XHR9XG5cblx0XHQvLyAuLi5hbmQgdW5kbyBjaGFuZ2VzIGJlbG9uZ2luZyB0byBvdGhlciBiYXRjaGVzIHVubGVzcyB0aGV5IGludGVyc2VjdFxuXHRcdGZvciAobGV0IGJhdGNoID0gZmlyc3RfYmF0Y2g7IGJhdGNoICE9PSBudWxsOyBiYXRjaCA9IGJhdGNoLm5leHQpIHtcblx0XHRcdGlmIChiYXRjaCA9PT0gdGhpcyB8fCBiYXRjaC5pc19mb3JrKSBjb250aW51ZTtcblxuXHRcdFx0Ly8gU2luY2UgdGhlIGxhdHRlciBiYXRjaCBtZXJnZXMgaW50byB0aGUgZWFybGllciAoaWYgaXQgcmVzb2x2ZXMgYmVmb3JlIHRoZSBlYXJsaWVyIG9uZSksXG5cdFx0XHQvLyB3ZSB0cmVhdCB0aGUgZWFybGllciB2YWx1ZXMgYXMgXCJhbHJlYWR5IGFwcGxpZWRcIi4gVGhpcyB3YXkgd2UgZG9uJ3QgbmVlZCB0byByZXJ1biBhc3luY1xuXHRcdFx0Ly8gZWZmZWN0cyBvZiB0aGUgZWFybGllciBiYXRjaCBpbiBjYXNlIHRoZXkgYXJlIG1lcmdlZC5cblx0XHRcdC8vIEFzIGEgcmVzdWx0IHlvdSBjYW4gdGhpbmsgb2YgYmF0Y2hfdmFsdWVzIGFzIGhhdmluZyB0aGUgbGF0ZXN0IHZhbHVlcyBvZiBhbGwgaW50ZXJzZWN0aW5nXG5cdFx0XHQvLyBiYXRjaGVzIHVwIHVudGlsIHRoaXMgYmF0Y2guXG5cdFx0XHRpZiAoYmF0Y2guaWQgPj0gdGhpcy5pZCB8fCAhYmF0Y2guI2ludGVyc2VjdHModGhpcykpIHtcblx0XHRcdFx0Zm9yIChjb25zdCBbc291cmNlLCBwcmV2aW91c10gb2YgYmF0Y2gucHJldmlvdXMpIHtcblx0XHRcdFx0XHRpZiAoIWJhdGNoX3ZhbHVlcy5oYXMoc291cmNlKSkge1xuXHRcdFx0XHRcdFx0YmF0Y2hfdmFsdWVzLnNldChzb3VyY2UsIHByZXZpb3VzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICpcblx0ICogQHBhcmFtIHtFZmZlY3R9IGVmZmVjdFxuXHQgKi9cblx0c2NoZWR1bGUoZWZmZWN0KSB7XG5cdFx0bGFzdF9zY2hlZHVsZWRfZWZmZWN0ID0gZWZmZWN0O1xuXG5cdFx0Ly8gZGVmZXIgcmVuZGVyIGVmZmVjdHMgaW5zaWRlIGEgcGVuZGluZyBib3VuZGFyeVxuXHRcdC8vIFRPRE8gdGhlIGBSRUFDVElPTl9SQU5gIGNoZWNrIGlzIG9ubHkgbmVjZXNzYXJ5IGJlY2F1c2Ugb2YgbGVnYWN5IGAkOmAgZWZmZWN0cyBBRkFJQ1Qg4oCUIHdlIGNhbiByZW1vdmUgbGF0ZXJcblx0XHRpZiAoXG5cdFx0XHRlZmZlY3QuYj8uaXNfcGVuZGluZyAmJlxuXHRcdFx0KGVmZmVjdC5mICYgKEVGRkVDVCB8IFJFTkRFUl9FRkZFQ1QgfCBNQU5BR0VEX0VGRkVDVCkpICE9PSAwICYmXG5cdFx0XHQoZWZmZWN0LmYgJiBSRUFDVElPTl9SQU4pID09PSAwXG5cdFx0KSB7XG5cdFx0XHRlZmZlY3QuYi5kZWZlcl9lZmZlY3QoZWZmZWN0KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLiNzY2hlZHVsZWQucHVzaChlZmZlY3QpO1xuXHR9XG5cblx0I3VubGluaygpIHtcblx0XHQvLyAjbWVyZ2UgY2FsbHMgI3VubGluaywgZGlzY2FyZCBsYXRlciBvbiBkb2VzIGl0IGFnYWluIC0gcHJldmVudFxuXHRcdC8vIHJ1bm5pbmcgaXQgbXVsdGlwbGUgdGltZXMgdG8gbm90IGNvcnJ1cHQgdGhlIGxpbmtlZCBsaXN0XG5cdFx0aWYgKCF0aGlzLmxpbmtlZCkgcmV0dXJuO1xuXG5cdFx0dmFyIHByZXYgPSB0aGlzLnByZXY7XG5cdFx0dmFyIG5leHQgPSB0aGlzLm5leHQ7XG5cblx0XHRpZiAocHJldiA9PT0gbnVsbCkge1xuXHRcdFx0Zmlyc3RfYmF0Y2ggPSBuZXh0O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwcmV2Lm5leHQgPSBuZXh0O1xuXHRcdH1cblxuXHRcdGlmIChuZXh0ID09PSBudWxsKSB7XG5cdFx0XHRsYXN0X2JhdGNoID0gcHJldjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bmV4dC5wcmV2ID0gcHJldjtcblx0XHR9XG5cblx0XHR0aGlzLmxpbmtlZCA9IGZhbHNlO1xuXHR9XG59XG5cbi8vIFRPRE8gU3ZlbHRlQDYgdGhpbmsgYWJvdXQgcmVtb3ZpbmcgdGhlIGNhbGxiYWNrIGFyZ3VtZW50LlxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IGZsdXNoIGFueSBwZW5kaW5nIHVwZGF0ZXMuXG4gKiBSZXR1cm5zIHZvaWQgaWYgbm8gY2FsbGJhY2sgaXMgcHJvdmlkZWQsIG90aGVyd2lzZSByZXR1cm5zIHRoZSByZXN1bHQgb2YgY2FsbGluZyB0aGUgY2FsbGJhY2suXG4gKiBAdGVtcGxhdGUgW1Q9dm9pZF1cbiAqIEBwYXJhbSB7KCgpID0+IFQpIHwgdW5kZWZpbmVkfSBbZm5dXG4gKiBAcmV0dXJucyB7VH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsdXNoU3luYyhmbikge1xuXHR2YXIgd2FzX2ZsdXNoaW5nX3N5bmMgPSBpc19mbHVzaGluZ19zeW5jO1xuXHR2YXIgcHJldl9wcmV2aW91c19iYXRjaCA9IHByZXZpb3VzX2JhdGNoO1xuXHRwcmV2aW91c19iYXRjaCA9IG51bGw7XG5cdGlzX2ZsdXNoaW5nX3N5bmMgPSB0cnVlO1xuXG5cdHRyeSB7XG5cdFx0dmFyIHJlc3VsdDtcblxuXHRcdGlmIChmbikge1xuXHRcdFx0Zmx1c2hTeW5jKCk7IC8vIGZsdXNoIGFueXRoaW5nIHBlbmRpbmcgdGhyb3VnaCB0aGUgd2hpbGUgbG9vcCBiZWxvd1xuXG5cdFx0XHRyZXN1bHQgPSBmbigpO1xuXHRcdH1cblxuXHRcdHdoaWxlICh0cnVlKSB7XG5cdFx0XHRmbHVzaF90YXNrcygpO1xuXG5cdFx0XHRpZiAoY3VycmVudF9iYXRjaCA9PT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gLyoqIEB0eXBlIHtUfSAqLyAocmVzdWx0KTtcblx0XHRcdH1cblxuXHRcdFx0Y3VycmVudF9iYXRjaC5mbHVzaCgpO1xuXHRcdH1cblx0fSBmaW5hbGx5IHtcblx0XHRpc19mbHVzaGluZ19zeW5jID0gd2FzX2ZsdXNoaW5nX3N5bmM7XG5cdFx0cHJldmlvdXNfYmF0Y2ggPSBwcmV2X3ByZXZpb3VzX2JhdGNoO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGluZmluaXRlX2xvb3BfZ3VhcmQoKSB7XG5cdGlmIChERVYpIHtcblx0XHR2YXIgdXBkYXRlcyA9IG5ldyBNYXAoKTtcblxuXHRcdGZvciAoY29uc3Qgc291cmNlIG9mIC8qKiBAdHlwZSB7QmF0Y2h9ICovIChjdXJyZW50X2JhdGNoKS5jdXJyZW50LmtleXMoKSkge1xuXHRcdFx0Zm9yIChjb25zdCBbc3RhY2ssIHVwZGF0ZV0gb2Ygc291cmNlLnVwZGF0ZWQgPz8gW10pIHtcblx0XHRcdFx0dmFyIGVudHJ5ID0gdXBkYXRlcy5nZXQoc3RhY2spO1xuXG5cdFx0XHRcdGlmICghZW50cnkpIHtcblx0XHRcdFx0XHRlbnRyeSA9IHsgZXJyb3I6IHVwZGF0ZS5lcnJvciwgY291bnQ6IDAgfTtcblx0XHRcdFx0XHR1cGRhdGVzLnNldChzdGFjaywgZW50cnkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZW50cnkuY291bnQgKz0gdXBkYXRlLmNvdW50O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgdXBkYXRlIG9mIHVwZGF0ZXMudmFsdWVzKCkpIHtcblx0XHRcdGlmICh1cGRhdGUuZXJyb3IpIHtcblx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRcdFx0Y29uc29sZS5lcnJvcih1cGRhdGUuZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRyeSB7XG5cdFx0ZS5lZmZlY3RfdXBkYXRlX2RlcHRoX2V4Y2VlZGVkKCk7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0aWYgKERFVikge1xuXHRcdFx0Ly8gc3RhY2sgY29udGFpbnMgbm8gdXNlZnVsIGluZm9ybWF0aW9uLCByZXBsYWNlIGl0XG5cdFx0XHRkZWZpbmVfcHJvcGVydHkoZXJyb3IsICdzdGFjaycsIHsgdmFsdWU6ICcnIH0pO1xuXHRcdH1cblxuXHRcdC8vIEJlc3QgZWZmb3J0OiBpbnZva2UgdGhlIGJvdW5kYXJ5IG5lYXJlc3QgdGhlIG1vc3QgcmVjZW50XG5cdFx0Ly8gZWZmZWN0IGFuZCBob3BlIHRoYXQgaXQncyByZWxldmFudCB0byB0aGUgaW5maW5pdGUgbG9vcFxuXHRcdGludm9rZV9lcnJvcl9ib3VuZGFyeShlcnJvciwgbGFzdF9zY2hlZHVsZWRfZWZmZWN0KTtcblx0fVxufVxuXG4vKiogQHR5cGUge1NldDxFZmZlY3Q+IHwgbnVsbH0gKi9cbmV4cG9ydCBsZXQgZWFnZXJfYmxvY2tfZWZmZWN0cyA9IG51bGw7XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxFZmZlY3Q+fSBlZmZlY3RzXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gZmx1c2hfcXVldWVkX2VmZmVjdHMoZWZmZWN0cykge1xuXHR2YXIgbGVuZ3RoID0gZWZmZWN0cy5sZW5ndGg7XG5cdGlmIChsZW5ndGggPT09IDApIHJldHVybjtcblxuXHR2YXIgaSA9IDA7XG5cblx0d2hpbGUgKGkgPCBsZW5ndGgpIHtcblx0XHR2YXIgZWZmZWN0ID0gZWZmZWN0c1tpKytdO1xuXG5cdFx0aWYgKChlZmZlY3QuZiAmIChERVNUUk9ZRUQgfCBJTkVSVCkpID09PSAwICYmIGlzX2RpcnR5KGVmZmVjdCkpIHtcblx0XHRcdGVhZ2VyX2Jsb2NrX2VmZmVjdHMgPSBuZXcgU2V0KCk7XG5cblx0XHRcdHVwZGF0ZV9lZmZlY3QoZWZmZWN0KTtcblxuXHRcdFx0Ly8gRWZmZWN0cyB3aXRoIG5vIGRlcGVuZGVuY2llcyBvciB0ZWFyZG93biBkbyBub3QgZ2V0IGFkZGVkIHRvIHRoZSBlZmZlY3QgdHJlZS5cblx0XHRcdC8vIERlZmVycmVkIGVmZmVjdHMgKGUuZy4gYCRlZmZlY3QoLi4uKWApIF9hcmVfIGFkZGVkIHRvIHRoZSB0cmVlIGJlY2F1c2Ugd2Vcblx0XHRcdC8vIGRvbid0IGtub3cgaWYgd2UgbmVlZCB0byBrZWVwIHRoZW0gdW50aWwgdGhleSBhcmUgZXhlY3V0ZWQuIERvaW5nIHRoZSBjaGVja1xuXHRcdFx0Ly8gaGVyZSAocmF0aGVyIHRoYW4gaW4gYHVwZGF0ZV9lZmZlY3RgKSBhbGxvd3MgdXMgdG8gc2tpcCB0aGUgd29yayBmb3Jcblx0XHRcdC8vIGltbWVkaWF0ZSBlZmZlY3RzLlxuXHRcdFx0aWYgKFxuXHRcdFx0XHRlZmZlY3QuZGVwcyA9PT0gbnVsbCAmJlxuXHRcdFx0XHRlZmZlY3QuZmlyc3QgPT09IG51bGwgJiZcblx0XHRcdFx0ZWZmZWN0Lm5vZGVzID09PSBudWxsICYmXG5cdFx0XHRcdGVmZmVjdC50ZWFyZG93biA9PT0gbnVsbCAmJlxuXHRcdFx0XHRlZmZlY3QuYWMgPT09IG51bGxcblx0XHRcdCkge1xuXHRcdFx0XHQvLyByZW1vdmUgdGhpcyBlZmZlY3QgZnJvbSB0aGUgZ3JhcGhcblx0XHRcdFx0dW5saW5rX2VmZmVjdChlZmZlY3QpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiB1cGRhdGVfZWZmZWN0KCkgaGFzIGEgZmx1c2hTeW5jKCkgaW4gaXQsIHdlIG1heSBoYXZlIGZsdXNoZWQgYW5vdGhlciBmbHVzaF9xdWV1ZWRfZWZmZWN0cygpLFxuXHRcdFx0Ly8gd2hpY2ggYWxyZWFkeSBoYW5kbGVkIHRoaXMgbG9naWMgYW5kIGRpZCBzZXQgZWFnZXJfYmxvY2tfZWZmZWN0cyB0byBudWxsLlxuXHRcdFx0aWYgKGVhZ2VyX2Jsb2NrX2VmZmVjdHM/LnNpemUgPiAwKSB7XG5cdFx0XHRcdG9sZF92YWx1ZXMuY2xlYXIoKTtcblxuXHRcdFx0XHRmb3IgKGNvbnN0IGUgb2YgZWFnZXJfYmxvY2tfZWZmZWN0cykge1xuXHRcdFx0XHRcdC8vIFNraXAgZWFnZXIgZWZmZWN0cyB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIHVubW91bnRlZFxuXHRcdFx0XHRcdGlmICgoZS5mICYgKERFU1RST1lFRCB8IElORVJUKSkgIT09IDApIGNvbnRpbnVlO1xuXG5cdFx0XHRcdFx0Ly8gUnVuIGVmZmVjdHMgaW4gb3JkZXIgZnJvbSBhbmNlc3RvciB0byBkZXNjZW5kYW50LCBlbHNlIHdlIGNvdWxkIHJ1biBpbnRvIG51bGxwb2ludGVyc1xuXHRcdFx0XHRcdC8qKiBAdHlwZSB7RWZmZWN0W119ICovXG5cdFx0XHRcdFx0Y29uc3Qgb3JkZXJlZF9lZmZlY3RzID0gW2VdO1xuXHRcdFx0XHRcdGxldCBhbmNlc3RvciA9IGUucGFyZW50O1xuXHRcdFx0XHRcdHdoaWxlIChhbmNlc3RvciAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0aWYgKGVhZ2VyX2Jsb2NrX2VmZmVjdHMuaGFzKGFuY2VzdG9yKSkge1xuXHRcdFx0XHRcdFx0XHRlYWdlcl9ibG9ja19lZmZlY3RzLmRlbGV0ZShhbmNlc3Rvcik7XG5cdFx0XHRcdFx0XHRcdG9yZGVyZWRfZWZmZWN0cy5wdXNoKGFuY2VzdG9yKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGZvciAobGV0IGogPSBvcmRlcmVkX2VmZmVjdHMubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcblx0XHRcdFx0XHRcdGNvbnN0IGUgPSBvcmRlcmVkX2VmZmVjdHNbal07XG5cdFx0XHRcdFx0XHQvLyBTa2lwIGVhZ2VyIGVmZmVjdHMgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiB1bm1vdW50ZWRcblx0XHRcdFx0XHRcdGlmICgoZS5mICYgKERFU1RST1lFRCB8IElORVJUKSkgIT09IDApIGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0dXBkYXRlX2VmZmVjdChlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlYWdlcl9ibG9ja19lZmZlY3RzLmNsZWFyKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZWFnZXJfYmxvY2tfZWZmZWN0cyA9IG51bGw7XG59XG5cbi8qKlxuICogVGhpcyBpcyBzaW1pbGFyIHRvIGBtYXJrX3JlYWN0aW9uc2AsIGJ1dCBpdCBvbmx5IG1hcmtzIGFzeW5jL2Jsb2NrIGVmZmVjdHNcbiAqIGRlcGVuZGluZyBvbiBgdmFsdWVgIGFuZCBhdCBsZWFzdCBvbmUgb2YgdGhlIG90aGVyIGBzb3VyY2VzYCwgc28gdGhhdFxuICogdGhlc2UgZWZmZWN0cyBjYW4gcmUtcnVuIGFmdGVyIGFub3RoZXIgYmF0Y2ggaGFzIGJlZW4gY29tbWl0dGVkXG4gKiBAcGFyYW0ge1ZhbHVlfSB2YWx1ZVxuICogQHBhcmFtIHtTb3VyY2VbXX0gc291cmNlc1xuICogQHBhcmFtIHtTZXQ8VmFsdWU+fSBtYXJrZWRcbiAqIEBwYXJhbSB7TWFwPFJlYWN0aW9uLCBib29sZWFuPn0gY2hlY2tlZFxuICovXG5mdW5jdGlvbiBtYXJrX2VmZmVjdHModmFsdWUsIHNvdXJjZXMsIG1hcmtlZCwgY2hlY2tlZCkge1xuXHRpZiAobWFya2VkLmhhcyh2YWx1ZSkpIHJldHVybjtcblx0bWFya2VkLmFkZCh2YWx1ZSk7XG5cblx0aWYgKHZhbHVlLnJlYWN0aW9ucyAhPT0gbnVsbCkge1xuXHRcdGZvciAoY29uc3QgcmVhY3Rpb24gb2YgdmFsdWUucmVhY3Rpb25zKSB7XG5cdFx0XHRjb25zdCBmbGFncyA9IHJlYWN0aW9uLmY7XG5cblx0XHRcdGlmICgoZmxhZ3MgJiBERVJJVkVEKSAhPT0gMCkge1xuXHRcdFx0XHRtYXJrX2VmZmVjdHMoLyoqIEB0eXBlIHtEZXJpdmVkfSAqLyAocmVhY3Rpb24pLCBzb3VyY2VzLCBtYXJrZWQsIGNoZWNrZWQpO1xuXHRcdFx0fSBlbHNlIGlmIChcblx0XHRcdFx0KGZsYWdzICYgKEFTWU5DIHwgQkxPQ0tfRUZGRUNUKSkgIT09IDAgJiZcblx0XHRcdFx0KGZsYWdzICYgRElSVFkpID09PSAwICYmXG5cdFx0XHRcdGRlcGVuZHNfb24ocmVhY3Rpb24sIHNvdXJjZXMsIGNoZWNrZWQpXG5cdFx0XHQpIHtcblx0XHRcdFx0c2V0X3NpZ25hbF9zdGF0dXMocmVhY3Rpb24sIERJUlRZKTtcblx0XHRcdFx0c2NoZWR1bGVfZWZmZWN0KC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAocmVhY3Rpb24pKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBXaGVuIGNvbW1pdHRpbmcgYSBmb3JrLCB3ZSBuZWVkIHRvIHRyaWdnZXIgZWFnZXIgZWZmZWN0cyBzbyB0aGF0XG4gKiBhbnkgYCRzdGF0ZS5lYWdlciguLi4pYCBleHByZXNzaW9ucyB1cGRhdGUgaW1tZWRpYXRlbHkuIFRoaXNcbiAqIGZ1bmN0aW9uIGFsbG93cyB1cyB0byBkaXNjb3ZlciB0aGVtXG4gKiBAcGFyYW0ge1ZhbHVlfSB2YWx1ZVxuICogQHBhcmFtIHtTZXQ8RWZmZWN0Pn0gZWZmZWN0c1xuICovXG5mdW5jdGlvbiBtYXJrX2VhZ2VyX2VmZmVjdHModmFsdWUsIGVmZmVjdHMpIHtcblx0aWYgKHZhbHVlLnJlYWN0aW9ucyA9PT0gbnVsbCkgcmV0dXJuO1xuXG5cdGZvciAoY29uc3QgcmVhY3Rpb24gb2YgdmFsdWUucmVhY3Rpb25zKSB7XG5cdFx0Y29uc3QgZmxhZ3MgPSByZWFjdGlvbi5mO1xuXG5cdFx0aWYgKChmbGFncyAmIERFUklWRUQpICE9PSAwKSB7XG5cdFx0XHRtYXJrX2VhZ2VyX2VmZmVjdHMoLyoqIEB0eXBlIHtEZXJpdmVkfSAqLyAocmVhY3Rpb24pLCBlZmZlY3RzKTtcblx0XHR9IGVsc2UgaWYgKChmbGFncyAmIEVBR0VSX0VGRkVDVCkgIT09IDApIHtcblx0XHRcdHNldF9zaWduYWxfc3RhdHVzKHJlYWN0aW9uLCBESVJUWSk7XG5cdFx0XHRlZmZlY3RzLmFkZCgvKiogQHR5cGUge0VmZmVjdH0gKi8gKHJlYWN0aW9uKSk7XG5cdFx0fVxuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWFjdGlvbn0gcmVhY3Rpb25cbiAqIEBwYXJhbSB7U291cmNlW119IHNvdXJjZXNcbiAqIEBwYXJhbSB7TWFwPFJlYWN0aW9uLCBib29sZWFuPn0gY2hlY2tlZFxuICovXG5mdW5jdGlvbiBkZXBlbmRzX29uKHJlYWN0aW9uLCBzb3VyY2VzLCBjaGVja2VkKSB7XG5cdGNvbnN0IGRlcGVuZHMgPSBjaGVja2VkLmdldChyZWFjdGlvbik7XG5cdGlmIChkZXBlbmRzICE9PSB1bmRlZmluZWQpIHJldHVybiBkZXBlbmRzO1xuXG5cdGlmIChyZWFjdGlvbi5kZXBzICE9PSBudWxsKSB7XG5cdFx0Zm9yIChjb25zdCBkZXAgb2YgcmVhY3Rpb24uZGVwcykge1xuXHRcdFx0aWYgKGluY2x1ZGVzLmNhbGwoc291cmNlcywgZGVwKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKChkZXAuZiAmIERFUklWRUQpICE9PSAwICYmIGRlcGVuZHNfb24oLyoqIEB0eXBlIHtEZXJpdmVkfSAqLyAoZGVwKSwgc291cmNlcywgY2hlY2tlZCkpIHtcblx0XHRcdFx0Y2hlY2tlZC5zZXQoLyoqIEB0eXBlIHtEZXJpdmVkfSAqLyAoZGVwKSwgdHJ1ZSk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGNoZWNrZWQuc2V0KHJlYWN0aW9uLCBmYWxzZSk7XG5cblx0cmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3RcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVfZWZmZWN0KGVmZmVjdCkge1xuXHQvKiogQHR5cGUge0JhdGNofSAqLyAoY3VycmVudF9iYXRjaCkuc2NoZWR1bGUoZWZmZWN0KTtcbn1cblxuLyoqIEB0eXBlIHtTb3VyY2U8bnVtYmVyPltdfSAqL1xubGV0IGVhZ2VyX3ZlcnNpb25zID0gW107XG5cbmZ1bmN0aW9uIGVhZ2VyX2ZsdXNoKCkge1xuXHRmbHVzaFN5bmMoKCkgPT4ge1xuXHRcdGNvbnN0IGVhZ2VyID0gZWFnZXJfdmVyc2lvbnM7XG5cdFx0ZWFnZXJfdmVyc2lvbnMgPSBbXTtcblx0XHRmb3IgKGNvbnN0IHZlcnNpb24gb2YgZWFnZXIpIHtcblx0XHRcdHVwZGF0ZSh2ZXJzaW9uKTtcblx0XHR9XG5cdH0pO1xufVxuXG4vKiogQHR5cGUge01hcDxSZWFjdGlvbiwgU291cmNlPG51bWJlcj4+fSAqL1xudmFyIHZlcnNpb25fbWFwID0gbmV3IE1hcCgpO1xuXG4vKipcbiAqIEltcGxlbWVudGF0aW9uIG9mIGAkc3RhdGUuZWFnZXIoZm4oKSlgXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHsoKSA9PiBUfSBmblxuICogQHJldHVybnMge1R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlYWdlcihmbikge1xuXHR2YXIgaW5pdGlhbCA9IHRydWU7XG5cdHZhciB2YWx1ZSA9IC8qKiBAdHlwZSB7VH0gKi8gKHVuZGVmaW5lZCk7XG5cblx0aWYgKGFjdGl2ZV9yZWFjdGlvbiA9PT0gbnVsbCkge1xuXHRcdHJldHVybiBmbigpO1xuXHR9XG5cblx0bGV0IHBhcmVudCA9IGFjdGl2ZV9yZWFjdGlvbjtcblxuXHRsZXQgdmVyc2lvbiA9IHZlcnNpb25fbWFwLmdldChwYXJlbnQpID8/IHNvdXJjZSgwKTtcblx0dmVyc2lvbl9tYXAuc2V0KHBhcmVudCwgdmVyc2lvbik7XG5cblx0aWYgKERFVikge1xuXHRcdHZlcnNpb24ubGFiZWwgPz89ICckc3RhdGUuZWFnZXIgdmVyc2lvbic7XG5cdH1cblxuXHR0ZWFyZG93bigoKSA9PiB7XG5cdFx0aWYgKHBhcmVudC5mICYgREVTVFJPWUlORykgdmVyc2lvbl9tYXAuZGVsZXRlKHBhcmVudCk7XG5cdH0pO1xuXG5cdGdldCh2ZXJzaW9uKTtcblxuXHRlYWdlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdGlmIChpbml0aWFsKSB7XG5cdFx0XHQvLyB0aGUgZmlyc3QgdGltZSB0aGlzIHJ1bnMsIHdlIGNyZWF0ZSBhbiBlYWdlciBlZmZlY3Rcblx0XHRcdC8vIHRoYXQgd2lsbCBydW4gZWFnZXJseSB3aGVuZXZlciB0aGUgZXhwcmVzc2lvbiBjaGFuZ2VzXG5cdFx0XHR2YXIgcHJldmlvdXNfYmF0Y2hfdmFsdWVzID0gYmF0Y2hfdmFsdWVzO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRiYXRjaF92YWx1ZXMgPSBudWxsO1xuXHRcdFx0XHR2YWx1ZSA9IGZuKCk7XG5cdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHRiYXRjaF92YWx1ZXMgPSBwcmV2aW91c19iYXRjaF92YWx1ZXM7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyB0aGUgc2Vjb25kIHRpbWUgdGhpcyBlZmZlY3QgcnVucywgaXQncyB0byBzY2hlZHVsZSBhXG5cdFx0Ly8gYHZlcnNpb25gIHVwZGF0ZS4gc2luY2UgdGhpcyB3aWxsIHJlY3JlYXRlIHRoZSBlZmZlY3QsXG5cdFx0Ly8gd2UgZG9uJ3QgbmVlZCB0byBldmFsdWF0ZSB0aGUgZXhwcmVzc2lvbiBoZXJlXG5cdFx0aWYgKGVhZ2VyX3ZlcnNpb25zLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cXVldWVfbWljcm9fdGFzayhlYWdlcl9mbHVzaCk7XG5cdFx0fVxuXG5cdFx0ZWFnZXJfdmVyc2lvbnMucHVzaCh2ZXJzaW9uKTtcblx0fSk7XG5cblx0aW5pdGlhbCA9IGZhbHNlO1xuXG5cdHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBNYXJrIGFsbCB0aGUgZWZmZWN0cyBpbnNpZGUgYSBza2lwcGVkIGJyYW5jaCBDTEVBTiwgc28gdGhhdFxuICogdGhleSBjYW4gYmUgY29ycmVjdGx5IHJlc2NoZWR1bGVkIGxhdGVyLiBUcmFja3MgZGlydHkgYW5kIG1heWJlX2RpcnR5XG4gKiBlZmZlY3RzIHNvIHRoZXkgY2FuIGJlIHJlc2NoZWR1bGVkIGlmIHRoZSBicmFuY2ggc3Vydml2ZXMuXG4gKiBAcGFyYW0ge0VmZmVjdH0gZWZmZWN0XG4gKiBAcGFyYW0ge3sgZDogRWZmZWN0W10sIG06IEVmZmVjdFtdIH19IHRyYWNrZWRcbiAqL1xuZnVuY3Rpb24gcmVzZXRfYnJhbmNoKGVmZmVjdCwgdHJhY2tlZCkge1xuXHQvLyBjbGVhbiBicmFuY2ggPSBub3RoaW5nIGRpcnR5IGluc2lkZSwgbm8gbmVlZCB0byB0cmF2ZXJzZSBmdXJ0aGVyXG5cdGlmICgoZWZmZWN0LmYgJiBCUkFOQ0hfRUZGRUNUKSAhPT0gMCAmJiAoZWZmZWN0LmYgJiBDTEVBTikgIT09IDApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZiAoKGVmZmVjdC5mICYgRElSVFkpICE9PSAwKSB7XG5cdFx0dHJhY2tlZC5kLnB1c2goZWZmZWN0KTtcblx0fSBlbHNlIGlmICgoZWZmZWN0LmYgJiBNQVlCRV9ESVJUWSkgIT09IDApIHtcblx0XHR0cmFja2VkLm0ucHVzaChlZmZlY3QpO1xuXHR9XG5cblx0c2V0X3NpZ25hbF9zdGF0dXMoZWZmZWN0LCBDTEVBTik7XG5cblx0dmFyIGUgPSBlZmZlY3QuZmlyc3Q7XG5cdHdoaWxlIChlICE9PSBudWxsKSB7XG5cdFx0cmVzZXRfYnJhbmNoKGUsIHRyYWNrZWQpO1xuXHRcdGUgPSBlLm5leHQ7XG5cdH1cbn1cblxuLyoqXG4gKiBNYXJrIGFuIGVudGlyZSBlZmZlY3QgdHJlZSBjbGVhbiBmb2xsb3dpbmcgYW4gZXJyb3JcbiAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3RcbiAqL1xuZnVuY3Rpb24gcmVzZXRfYWxsKGVmZmVjdCkge1xuXHRzZXRfc2lnbmFsX3N0YXR1cyhlZmZlY3QsIENMRUFOKTtcblxuXHR2YXIgZSA9IGVmZmVjdC5maXJzdDtcblx0d2hpbGUgKGUgIT09IG51bGwpIHtcblx0XHRyZXNldF9hbGwoZSk7XG5cdFx0ZSA9IGUubmV4dDtcblx0fVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSAnZm9yaycsIGluIHdoaWNoIHN0YXRlIGNoYW5nZXMgYXJlIGV2YWx1YXRlZCBidXQgbm90IGFwcGxpZWQgdG8gdGhlIERPTS5cbiAqIFRoaXMgaXMgdXNlZnVsIGZvciBzcGVjdWxhdGl2ZWx5IGxvYWRpbmcgZGF0YSAoZm9yIGV4YW1wbGUpIHdoZW4geW91IHN1c3BlY3QgdGhhdFxuICogdGhlIHVzZXIgaXMgYWJvdXQgdG8gdGFrZSBzb21lIGFjdGlvbi5cbiAqXG4gKiBGcmFtZXdvcmtzIGxpa2UgU3ZlbHRlS2l0IGNhbiB1c2UgdGhpcyB0byBwcmVsb2FkIGRhdGEgd2hlbiB0aGUgdXNlciB0b3VjaGVzIG9yXG4gKiBob3ZlcnMgb3ZlciBhIGxpbmssIG1ha2luZyBhbnkgc3Vic2VxdWVudCBuYXZpZ2F0aW9uIGZlZWwgaW5zdGFudGFuZW91cy5cbiAqXG4gKiBUaGUgYGZuYCBwYXJhbWV0ZXIgaXMgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiB0aGF0IG1vZGlmaWVzIHNvbWUgc3RhdGUuIFRoZVxuICogc3RhdGUgY2hhbmdlcyB3aWxsIGJlIHJldmVydGVkIGFmdGVyIHRoZSBmb3JrIGlzIGluaXRpYWxpc2VkLCB0aGVuIHJlYXBwbGllZFxuICogaWYgYW5kIHdoZW4gdGhlIGZvcmsgaXMgZXZlbnR1YWxseSBjb21taXR0ZWQuXG4gKlxuICogV2hlbiBpdCBiZWNvbWVzIGNsZWFyIHRoYXQgYSBmb3JrIHdpbGwgX25vdF8gYmUgY29tbWl0dGVkIChlLmcuIGJlY2F1c2UgdGhlXG4gKiB1c2VyIG5hdmlnYXRlZCBlbHNld2hlcmUpLCBpdCBtdXN0IGJlIGRpc2NhcmRlZCB0byBhdm9pZCBsZWFraW5nIG1lbW9yeS5cbiAqXG4gKiBAcGFyYW0geygpID0+IHZvaWR9IGZuXG4gKiBAcmV0dXJucyB7Rm9ya31cbiAqIEBzaW5jZSA1LjQyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JrKGZuKSB7XG5cdGlmICghYXN5bmNfbW9kZV9mbGFnKSB7XG5cdFx0ZS5leHBlcmltZW50YWxfYXN5bmNfcmVxdWlyZWQoJ2ZvcmsnKTtcblx0fVxuXG5cdGlmIChjdXJyZW50X2JhdGNoICE9PSBudWxsKSB7XG5cdFx0ZS5mb3JrX3RpbWluZygpO1xuXHR9XG5cblx0Zmx1c2hTeW5jKCk7XG5cblx0dmFyIGJhdGNoID0gQmF0Y2guZW5zdXJlKCk7XG5cdGJhdGNoLmlzX2ZvcmsgPSB0cnVlO1xuXHRiYXRjaF92YWx1ZXMgPSBuZXcgTWFwKCk7XG5cblx0dmFyIGNvbW1pdHRlZCA9IGZhbHNlO1xuXHR2YXIgc2V0dGxlZCA9IGJhdGNoLnNldHRsZWQoKTtcblxuXHRmbigpO1xuXHRmbHVzaFN5bmMoKTtcblxuXHRyZXR1cm4ge1xuXHRcdGNvbW1pdDogYXN5bmMgKCkgPT4ge1xuXHRcdFx0aWYgKGNvbW1pdHRlZCkge1xuXHRcdFx0XHRhd2FpdCBzZXR0bGVkO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmICghYmF0Y2gubGlua2VkKSB7XG5cdFx0XHRcdGUuZm9ya19kaXNjYXJkZWQoKTtcblx0XHRcdH1cblxuXHRcdFx0Y29tbWl0dGVkID0gdHJ1ZTtcblxuXHRcdFx0YmF0Y2guaXNfZm9yayA9IGZhbHNlO1xuXG5cdFx0XHQvLyBhcHBseSBjaGFuZ2VzIGFuZCB1cGRhdGUgd3JpdGUgdmVyc2lvbnMgc28gZGVyaXZlZHMgc2VlIHRoZSBjaGFuZ2Vcblx0XHRcdGZvciAodmFyIFtzb3VyY2UsIFt2YWx1ZV1dIG9mIGJhdGNoLmN1cnJlbnQpIHtcblx0XHRcdFx0c291cmNlLnYgPSB2YWx1ZTtcblx0XHRcdFx0c291cmNlLnd2ID0gaW5jcmVtZW50X3dyaXRlX3ZlcnNpb24oKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gdHJpZ2dlciBhbnkgYCRzdGF0ZS5lYWdlciguLi4pYCBleHByZXNzaW9ucyB3aXRoIHRoZSBuZXcgc3RhdGUuXG5cdFx0XHQvLyBlYWdlciBlZmZlY3RzIGRvbid0IGdldCBzY2hlZHVsZWQgbGlrZSBvdGhlciBlZmZlY3RzLCBzbyB3ZVxuXHRcdFx0Ly8gY2FuJ3QganVzdCBlbmNvdW50ZXIgdGhlbSBkdXJpbmcgdHJhdmVyc2FsLCB3ZSBuZWVkIHRvXG5cdFx0XHQvLyBwcm9hY3RpdmVseSBmbHVzaCB0aGVtXG5cdFx0XHQvLyBUT0RPIG1heWJlIHRoZXJlJ3MgYSBiZXR0ZXIgaW1wbGVtZW50YXRpb24/XG5cdFx0XHRmbHVzaFN5bmMoKCkgPT4ge1xuXHRcdFx0XHQvKiogQHR5cGUge1NldDxFZmZlY3Q+fSAqL1xuXHRcdFx0XHR2YXIgZWFnZXJfZWZmZWN0cyA9IG5ldyBTZXQoKTtcblxuXHRcdFx0XHRmb3IgKHZhciBzb3VyY2Ugb2YgYmF0Y2guY3VycmVudC5rZXlzKCkpIHtcblx0XHRcdFx0XHRtYXJrX2VhZ2VyX2VmZmVjdHMoc291cmNlLCBlYWdlcl9lZmZlY3RzKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHNldF9lYWdlcl9lZmZlY3RzKGVhZ2VyX2VmZmVjdHMpO1xuXHRcdFx0XHRmbHVzaF9lYWdlcl9lZmZlY3RzKCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0YmF0Y2guZmx1c2goKTtcblx0XHRcdGF3YWl0IHNldHRsZWQ7XG5cdFx0fSxcblx0XHRkaXNjYXJkOiAoKSA9PiB7XG5cdFx0XHQvLyBjYXVzZSBhbnkgTUFZQkVfRElSVFkgZGVyaXZlZHMgdG8gdXBkYXRlXG5cdFx0XHQvLyBpZiB0aGV5IGRlcGVuZCBvbiB0aGluZ3MgdGhhdCBjaGFuZ2VkXG5cdFx0XHQvLyBpbnNpZGUgdGhlIGRpc2NhcmRlZCBmb3JrXG5cdFx0XHRmb3IgKHZhciBzb3VyY2Ugb2YgYmF0Y2guY3VycmVudC5rZXlzKCkpIHtcblx0XHRcdFx0c291cmNlLnd2ID0gaW5jcmVtZW50X3dyaXRlX3ZlcnNpb24oKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFjb21taXR0ZWQgJiYgYmF0Y2gubGlua2VkKSB7XG5cdFx0XHRcdGJhdGNoLmRpc2NhcmQoKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG59XG5cbi8qKlxuICogRm9yY2libHkgcmVtb3ZlIGFsbCBjdXJyZW50IGJhdGNoZXMsIHRvIHByZXZlbnQgY3Jvc3MtdGFsayBiZXR3ZWVuIHRlc3RzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhcigpIHtcblx0Zmlyc3RfYmF0Y2ggPSBsYXN0X2JhdGNoID0gbnVsbDtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgRGVyaXZlZCwgRWZmZWN0LCBTb3VyY2UsIFZhbHVlIH0gZnJvbSAnI2NsaWVudCcgKi9cbmltcG9ydCB7IERFViB9IGZyb20gJ2VzbS1lbnYnO1xuaW1wb3J0IHtcblx0YWN0aXZlX3JlYWN0aW9uLFxuXHRhY3RpdmVfZWZmZWN0LFxuXHR1bnRyYWNrZWRfd3JpdGVzLFxuXHRnZXQsXG5cdHNldF91bnRyYWNrZWRfd3JpdGVzLFxuXHR1bnRyYWNrLFxuXHRpbmNyZW1lbnRfd3JpdGVfdmVyc2lvbixcblx0dXBkYXRlX2VmZmVjdCxcblx0Y3VycmVudF9zb3VyY2VzLFxuXHRpc19kaXJ0eSxcblx0dW50cmFja2luZyxcblx0aXNfZGVzdHJveWluZ19lZmZlY3QsXG5cdHB1c2hfcmVhY3Rpb25fdmFsdWVcbn0gZnJvbSAnLi4vcnVudGltZS5qcyc7XG5pbXBvcnQgeyBlcXVhbHMsIHNhZmVfZXF1YWxzIH0gZnJvbSAnLi9lcXVhbGl0eS5qcyc7XG5pbXBvcnQge1xuXHRDTEVBTixcblx0REVSSVZFRCxcblx0RElSVFksXG5cdEJSQU5DSF9FRkZFQ1QsXG5cdEVBR0VSX0VGRkVDVCxcblx0TUFZQkVfRElSVFksXG5cdEJMT0NLX0VGRkVDVCxcblx0Uk9PVF9FRkZFQ1QsXG5cdEFTWU5DXG59IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcbmltcG9ydCAqIGFzIGUgZnJvbSAnLi4vZXJyb3JzLmpzJztcbmltcG9ydCB7IGxlZ2FjeV9tb2RlX2ZsYWcsIHRyYWNpbmdfbW9kZV9mbGFnIH0gZnJvbSAnLi4vLi4vZmxhZ3MvaW5kZXguanMnO1xuaW1wb3J0IHsgdGFnX3Byb3h5IH0gZnJvbSAnLi4vZGV2L3RyYWNpbmcuanMnO1xuaW1wb3J0IHsgZ2V0X2Vycm9yIH0gZnJvbSAnLi4vLi4vc2hhcmVkL2Rldi5qcyc7XG5pbXBvcnQgeyBjb21wb25lbnRfY29udGV4dCwgaXNfcnVuZXMgfSBmcm9tICcuLi9jb250ZXh0LmpzJztcbmltcG9ydCB7XG5cdEJhdGNoLFxuXHRiYXRjaF92YWx1ZXMsXG5cdGVhZ2VyX2Jsb2NrX2VmZmVjdHMsXG5cdHNjaGVkdWxlX2VmZmVjdCxcblx0bGVnYWN5X3VwZGF0ZXNcbn0gZnJvbSAnLi9iYXRjaC5qcyc7XG5pbXBvcnQgeyBwcm94eSB9IGZyb20gJy4uL3Byb3h5LmpzJztcbmltcG9ydCB7IGV4ZWN1dGVfZGVyaXZlZCB9IGZyb20gJy4vZGVyaXZlZHMuanMnO1xuaW1wb3J0IHsgc2V0X3NpZ25hbF9zdGF0dXMsIHVwZGF0ZV9kZXJpdmVkX3N0YXR1cyB9IGZyb20gJy4vc3RhdHVzLmpzJztcblxuLyoqIEB0eXBlIHtTZXQ8RWZmZWN0Pn0gKi9cbmV4cG9ydCBsZXQgZWFnZXJfZWZmZWN0cyA9IG5ldyBTZXQoKTtcblxuLyoqIEB0eXBlIHtNYXA8VmFsdWUsIGFueT59ICovXG5leHBvcnQgY29uc3Qgb2xkX3ZhbHVlcyA9IG5ldyBNYXAoKTtcblxuLyoqXG4gKiBAcGFyYW0ge1NldDxhbnk+fSB2XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRfZWFnZXJfZWZmZWN0cyh2KSB7XG5cdGVhZ2VyX2VmZmVjdHMgPSB2O1xufVxuXG5sZXQgZWFnZXJfZWZmZWN0c19kZWZlcnJlZCA9IGZhbHNlO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0X2VhZ2VyX2VmZmVjdHNfZGVmZXJyZWQoKSB7XG5cdGVhZ2VyX2VmZmVjdHNfZGVmZXJyZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge1Z9IHZcbiAqIEBwYXJhbSB7RXJyb3IgfCBudWxsfSBbc3RhY2tdXG4gKiBAcmV0dXJucyB7U291cmNlPFY+fVxuICovXG4vLyBUT0RPIHJlbmFtZSB0aGlzIHRvIGBzdGF0ZWAgdGhyb3VnaG91dCB0aGUgY29kZWJhc2VcbmV4cG9ydCBmdW5jdGlvbiBzb3VyY2Uodiwgc3RhY2spIHtcblx0LyoqIEB0eXBlIHtTb3VyY2U8Vj59ICovXG5cdHZhciBzaWduYWwgPSB7XG5cdFx0ZjogMCxcblx0XHR2LFxuXHRcdHJlYWN0aW9uczogbnVsbCxcblx0XHRlcXVhbHMsXG5cdFx0cnY6IDAsXG5cdFx0d3Y6IDBcblx0fTtcblxuXHRpZiAoREVWICYmIHRyYWNpbmdfbW9kZV9mbGFnKSB7XG5cdFx0c2lnbmFsLmNyZWF0ZWQgPSBzdGFjayA/PyBnZXRfZXJyb3IoJ2NyZWF0ZWQgYXQnKTtcblx0XHRzaWduYWwudXBkYXRlZCA9IG51bGw7XG5cdFx0c2lnbmFsLnNldF9kdXJpbmdfZWZmZWN0ID0gZmFsc2U7XG5cdFx0c2lnbmFsLnRyYWNlID0gbnVsbDtcblx0fVxuXG5cdHJldHVybiBzaWduYWw7XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIFZcbiAqIEBwYXJhbSB7Vn0gdlxuICogQHBhcmFtIHtFcnJvciB8IG51bGx9IFtzdGFja11cbiAqL1xuLyojX19OT19TSURFX0VGRkVDVFNfXyovXG5leHBvcnQgZnVuY3Rpb24gc3RhdGUodiwgc3RhY2spIHtcblx0Y29uc3QgcyA9IHNvdXJjZSh2LCBzdGFjayk7XG5cblx0cHVzaF9yZWFjdGlvbl92YWx1ZShzKTtcblxuXHRyZXR1cm4gcztcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHtWfSBpbml0aWFsX3ZhbHVlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpbW11dGFibGVdXG4gKiBAcmV0dXJucyB7U291cmNlPFY+fVxuICovXG4vKiNfX05PX1NJREVfRUZGRUNUU19fKi9cbmV4cG9ydCBmdW5jdGlvbiBtdXRhYmxlX3NvdXJjZShpbml0aWFsX3ZhbHVlLCBpbW11dGFibGUgPSBmYWxzZSwgdHJhY2thYmxlID0gdHJ1ZSkge1xuXHRjb25zdCBzID0gc291cmNlKGluaXRpYWxfdmFsdWUpO1xuXHRpZiAoIWltbXV0YWJsZSkge1xuXHRcdHMuZXF1YWxzID0gc2FmZV9lcXVhbHM7XG5cdH1cblxuXHQvLyBiaW5kIHRoZSBzaWduYWwgdG8gdGhlIGNvbXBvbmVudCBjb250ZXh0LCBpbiBjYXNlIHdlIG5lZWQgdG9cblx0Ly8gdHJhY2sgdXBkYXRlcyB0byB0cmlnZ2VyIGJlZm9yZVVwZGF0ZS9hZnRlclVwZGF0ZSBjYWxsYmFja3Ncblx0aWYgKGxlZ2FjeV9tb2RlX2ZsYWcgJiYgdHJhY2thYmxlICYmIGNvbXBvbmVudF9jb250ZXh0ICE9PSBudWxsICYmIGNvbXBvbmVudF9jb250ZXh0LmwgIT09IG51bGwpIHtcblx0XHQoY29tcG9uZW50X2NvbnRleHQubC5zID8/PSBbXSkucHVzaChzKTtcblx0fVxuXG5cdHJldHVybiBzO1xufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge1ZhbHVlPFY+fSBzb3VyY2VcbiAqIEBwYXJhbSB7Vn0gdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG11dGF0ZShzb3VyY2UsIHZhbHVlKSB7XG5cdHNldChcblx0XHRzb3VyY2UsXG5cdFx0dW50cmFjaygoKSA9PiBnZXQoc291cmNlKSlcblx0KTtcblx0cmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge1ZhbHVlPFY+fSBzb3VyY2VcbiAqIEBwYXJhbSB7Vn0gdmFsdWVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Nob3VsZF9wcm94eV1cbiAqIEByZXR1cm5zIHtWfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0KHNvdXJjZSwgdmFsdWUsIHNob3VsZF9wcm94eSA9IGZhbHNlKSB7XG5cdGlmIChcblx0XHRhY3RpdmVfcmVhY3Rpb24gIT09IG51bGwgJiZcblx0XHQvLyBzaW5jZSB3ZSBhcmUgdW50cmFja2luZyB0aGUgZnVuY3Rpb24gaW5zaWRlIGAkaW5zcGVjdC53aXRoYCB3ZSBuZWVkIHRvIGFkZCB0aGlzIGNoZWNrXG5cdFx0Ly8gdG8gZW5zdXJlIHdlIGVycm9yIGlmIHN0YXRlIGlzIHNldCBpbnNpZGUgYW4gaW5zcGVjdCBlZmZlY3Rcblx0XHQoIXVudHJhY2tpbmcgfHwgKGFjdGl2ZV9yZWFjdGlvbi5mICYgRUFHRVJfRUZGRUNUKSAhPT0gMCkgJiZcblx0XHRpc19ydW5lcygpICYmXG5cdFx0KGFjdGl2ZV9yZWFjdGlvbi5mICYgKERFUklWRUQgfCBCTE9DS19FRkZFQ1QgfCBBU1lOQyB8IEVBR0VSX0VGRkVDVCkpICE9PSAwICYmXG5cdFx0KGN1cnJlbnRfc291cmNlcyA9PT0gbnVsbCB8fCAhY3VycmVudF9zb3VyY2VzLmhhcyhzb3VyY2UpKVxuXHQpIHtcblx0XHRlLnN0YXRlX3Vuc2FmZV9tdXRhdGlvbigpO1xuXHR9XG5cblx0bGV0IG5ld192YWx1ZSA9IHNob3VsZF9wcm94eSA/IHByb3h5KHZhbHVlKSA6IHZhbHVlO1xuXG5cdGlmIChERVYpIHtcblx0XHR0YWdfcHJveHkobmV3X3ZhbHVlLCAvKiogQHR5cGUge3N0cmluZ30gKi8gKHNvdXJjZS5sYWJlbCkpO1xuXHR9XG5cblx0cmV0dXJuIGludGVybmFsX3NldChzb3VyY2UsIG5ld192YWx1ZSwgbGVnYWN5X3VwZGF0ZXMpO1xufVxuXG4vKipcbiAqIEEgc2V0IG9mIHNpZ25hbHMgd2UgaGF2ZSBhbHJlYWR5IHNlZW4gd2hpbGUgdHJhdmVyc2luZyBpbiBtYXJrX3JlYWN0aW9ucy5cbiAqIE5vdCBhbHdheXMgc2V0IHRvIGJhbGFuY2UgdGhlIGNvbW1vbiBjYXNlIG9mIHNvdXJjZXMgb25seSBoYXZpbmcgYSBjb3VwbGVcbiAqIG9mICh0cmFuc2l0aXZlKSBkZXBlbmRlbmNpZXMgKHdoZXJlIGFsd2F5cyBjcmVhdGluZyBhIFNldCB3b3VsZCBiZSBiYWQgZm9yIHBlcmYpXG4gKiB3aXRoIHRoZSBlZGdlIGNhc2Ugb2YgZXh0cmVtZWx5IGRlZXAgb3Igd2lkZSBkZXBlbmRlbmN5IGFycmF5cyB3aXRoIGN5Y2xlcy5cbiAqIEB0eXBlIHtTZXQ8YW55PiB8IG51bGx9XG4gKi9cbnZhciBzZWVuID0gbnVsbDtcbi8qKiBOdW1iZXIgb2YgdHJhbnNpdGl2ZSBkZXBlbmRlbmNpZXMsIHNlZSB7QGxpbmsgc2Vlbn0gZm9yIG1vcmUgaW5mbyAqL1xudmFyIGNvdW50X2RlcHMgPSAwO1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge1ZhbHVlPFY+fSBzb3VyY2VcbiAqIEBwYXJhbSB7Vn0gdmFsdWVcbiAqIEBwYXJhbSB7RWZmZWN0W10gfCBudWxsfSBbdXBkYXRlZF9kdXJpbmdfdHJhdmVyc2FsXVxuICogQHJldHVybnMge1Z9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbF9zZXQoc291cmNlLCB2YWx1ZSwgdXBkYXRlZF9kdXJpbmdfdHJhdmVyc2FsID0gbnVsbCkge1xuXHRpZiAoIXNvdXJjZS5lcXVhbHModmFsdWUpKSB7XG5cdFx0aWYgKGlzX2Rlc3Ryb3lpbmdfZWZmZWN0KSB7XG5cdFx0XHRvbGRfdmFsdWVzLnNldChzb3VyY2UsIHZhbHVlKTtcblx0XHR9IGVsc2UgaWYgKCFvbGRfdmFsdWVzLmhhcyhzb3VyY2UpKSB7XG5cdFx0XHQvLyBvbmx5IHJlY29yZCB0aGUgdmFsdWUgZnJvbSBiZWZvcmUgdGhlIGZpcnN0IHdyaXRlIGluIHRoaXMgZmx1c2gsIG90aGVyd2lzZSBhXG5cdFx0XHQvLyB0ZWFyZG93biB3b3VsZCBzZWUgdGhlIHZhbHVlIGZyb20gYmVmb3JlIHdoaWNoZXZlciB3cml0ZSBoYXBwZW5lZCB0byBiZSBsYXN0XG5cdFx0XHRvbGRfdmFsdWVzLnNldChzb3VyY2UsIHNvdXJjZS52KTtcblx0XHR9XG5cblx0XHR2YXIgYmF0Y2ggPSBCYXRjaC5lbnN1cmUoKTtcblx0XHRiYXRjaC5jYXB0dXJlKHNvdXJjZSwgdmFsdWUpO1xuXG5cdFx0aWYgKERFVikge1xuXHRcdFx0aWYgKHRyYWNpbmdfbW9kZV9mbGFnIHx8IGFjdGl2ZV9lZmZlY3QgIT09IG51bGwpIHtcblx0XHRcdFx0c291cmNlLnVwZGF0ZWQgPz89IG5ldyBNYXAoKTtcblxuXHRcdFx0XHQvLyBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgd2hlbiBub3QgdXNpbmcgJGluc3BlY3QudHJhY2UsIHdlIG9ubHkgc3RhcnQgY29sbGVjdGluZyBzdGFjayB0cmFjZXNcblx0XHRcdFx0Ly8gYWZ0ZXIgdGhlIHNhbWUgc291cmNlIGhhcyBiZWVuIHVwZGF0ZWQgbW9yZSB0aGFuIDUgdGltZXMgaW4gdGhlIHNhbWUgZmx1c2ggY3ljbGUuXG5cdFx0XHRcdGNvbnN0IGNvdW50ID0gKHNvdXJjZS51cGRhdGVkLmdldCgnJyk/LmNvdW50ID8/IDApICsgMTtcblx0XHRcdFx0c291cmNlLnVwZGF0ZWQuc2V0KCcnLCB7IGVycm9yOiAvKiogQHR5cGUge2FueX0gKi8gKG51bGwpLCBjb3VudCB9KTtcblxuXHRcdFx0XHRpZiAodHJhY2luZ19tb2RlX2ZsYWcgfHwgY291bnQgPiA1KSB7XG5cdFx0XHRcdFx0Y29uc3QgZXJyb3IgPSBnZXRfZXJyb3IoJ3VwZGF0ZWQgYXQnKTtcblxuXHRcdFx0XHRcdGlmIChlcnJvciAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0bGV0IGVudHJ5ID0gc291cmNlLnVwZGF0ZWQuZ2V0KGVycm9yLnN0YWNrKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFlbnRyeSkge1xuXHRcdFx0XHRcdFx0XHRlbnRyeSA9IHsgZXJyb3IsIGNvdW50OiAwIH07XG5cdFx0XHRcdFx0XHRcdHNvdXJjZS51cGRhdGVkLnNldChlcnJvci5zdGFjaywgZW50cnkpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRlbnRyeS5jb3VudCsrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoYWN0aXZlX2VmZmVjdCAhPT0gbnVsbCkge1xuXHRcdFx0XHRzb3VyY2Uuc2V0X2R1cmluZ19lZmZlY3QgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICgoc291cmNlLmYgJiBERVJJVkVEKSAhPT0gMCkge1xuXHRcdFx0Y29uc3QgZGVyaXZlZCA9IC8qKiBAdHlwZSB7RGVyaXZlZH0gKi8gKHNvdXJjZSk7XG5cblx0XHRcdC8vIGlmIHdlIGFyZSBhc3NpZ25pbmcgdG8gYSBkaXJ0eSBkZXJpdmVkIHdlIHNldCBpdCB0byBjbGVhbi9tYXliZSBkaXJ0eSBidXQgd2UgYWxzbyBlYWdlcmx5IGV4ZWN1dGUgaXQgdG8gdHJhY2sgdGhlIGRlcGVuZGVuY2llc1xuXHRcdFx0aWYgKChzb3VyY2UuZiAmIERJUlRZKSAhPT0gMCkge1xuXHRcdFx0XHRleGVjdXRlX2Rlcml2ZWQoZGVyaXZlZCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIER1cmluZyB0aW1lIHRyYXZlbGluZyB3ZSBkb24ndCB3YW50IHRvIHJlc2V0IHRoZSBzdGF0dXMgc28gdGhhdFxuXHRcdFx0Ly8gdHJhdmVyc2FsIG9mIHRoZSBncmFwaCBpbiB0aGUgb3RoZXIgYmF0Y2hlcyBzdGlsbCBoYXBwZW5zXG5cdFx0XHRpZiAoYmF0Y2hfdmFsdWVzID09PSBudWxsKSB7XG5cdFx0XHRcdHVwZGF0ZV9kZXJpdmVkX3N0YXR1cyhkZXJpdmVkKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRzb3VyY2Uud3YgPSBpbmNyZW1lbnRfd3JpdGVfdmVyc2lvbigpO1xuXG5cdFx0Ly8gRm9yIGRlYnVnZ2luZywgaW4gY2FzZSB5b3Ugd2FudCB0byBrbm93IHdoaWNoIHJlYWN0aW9ucyBhcmUgYmVpbmcgc2NoZWR1bGVkOlxuXHRcdC8vIGxvZ19yZWFjdGlvbnMoc291cmNlKTtcblx0XHRzZWVuID0gbnVsbDtcblx0XHRjb3VudF9kZXBzID0gMDtcblx0XHRtYXJrX3JlYWN0aW9ucyhzb3VyY2UsIERJUlRZLCB1cGRhdGVkX2R1cmluZ190cmF2ZXJzYWwpO1xuXHRcdHNlZW4gPSBudWxsO1xuXG5cdFx0Ly8gSXQncyBwb3NzaWJsZSB0aGF0IHRoZSBjdXJyZW50IHJlYWN0aW9uIG1pZ2h0IG5vdCBoYXZlIHVwLXRvLWRhdGUgZGVwZW5kZW5jaWVzXG5cdFx0Ly8gd2hpbHN0IGl0J3MgYWN0aXZlbHkgcnVubmluZy4gU28gaW4gdGhlIGNhc2Ugb2YgZW5zdXJpbmcgaXQgcmVnaXN0ZXJzIHRoZSByZWFjdGlvblxuXHRcdC8vIHByb3Blcmx5IGZvciBpdHNlbGYsIHdlIG5lZWQgdG8gZW5zdXJlIHRoZSBjdXJyZW50IGVmZmVjdCBhY3R1YWxseSBnZXRzXG5cdFx0Ly8gc2NoZWR1bGVkLiBpLmU6IGAkZWZmZWN0KCgpID0+IHgrKylgXG5cdFx0aWYgKFxuXHRcdFx0aXNfcnVuZXMoKSAmJlxuXHRcdFx0YWN0aXZlX2VmZmVjdCAhPT0gbnVsbCAmJlxuXHRcdFx0KGFjdGl2ZV9lZmZlY3QuZiAmIENMRUFOKSAhPT0gMCAmJlxuXHRcdFx0KGFjdGl2ZV9lZmZlY3QuZiAmIChCUkFOQ0hfRUZGRUNUIHwgUk9PVF9FRkZFQ1QpKSA9PT0gMFxuXHRcdCkge1xuXHRcdFx0aWYgKHVudHJhY2tlZF93cml0ZXMgPT09IG51bGwpIHtcblx0XHRcdFx0c2V0X3VudHJhY2tlZF93cml0ZXMoW3NvdXJjZV0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dW50cmFja2VkX3dyaXRlcy5wdXNoKHNvdXJjZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCFiYXRjaC5pc19mb3JrICYmIGVhZ2VyX2VmZmVjdHMuc2l6ZSA+IDAgJiYgIWVhZ2VyX2VmZmVjdHNfZGVmZXJyZWQpIHtcblx0XHRcdGZsdXNoX2VhZ2VyX2VmZmVjdHMoKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaF9lYWdlcl9lZmZlY3RzKCkge1xuXHRlYWdlcl9lZmZlY3RzX2RlZmVycmVkID0gZmFsc2U7XG5cblx0Zm9yIChjb25zdCBlZmZlY3Qgb2YgZWFnZXJfZWZmZWN0cykge1xuXHRcdC8vIE1hcmsgY2xlYW4gaW5zcGVjdC1lZmZlY3RzIGFzIG1heWJlIGRpcnR5IGFuZCB0aGVuIGNoZWNrIHRoZWlyIGRpcnRpbmVzc1xuXHRcdC8vIGluc3RlYWQgb2YganVzdCB1cGRhdGluZyB0aGUgZWZmZWN0cyAtIHRoaXMgd2F5IHdlIGF2b2lkIG92ZXJmaXJpbmcuXG5cdFx0aWYgKChlZmZlY3QuZiAmIENMRUFOKSAhPT0gMCkge1xuXHRcdFx0c2V0X3NpZ25hbF9zdGF0dXMoZWZmZWN0LCBNQVlCRV9ESVJUWSk7XG5cdFx0fVxuXG5cdFx0bGV0IGRpcnR5O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGRpcnR5ID0gaXNfZGlydHkoZWZmZWN0KTtcblx0XHR9IGNhdGNoIHtcblx0XHRcdC8vIERpcnR5LWNoZWNraW5nIGNhbiBldmFsdWF0ZSBkZXJpdmVkIGRlcGVuZGVuY2llcyBhbmQgdGhyb3cgaW4gY2FzZXMgd2hlcmVcblx0XHRcdC8vIHBhcmVudCBlZmZlY3RzIGFyZSBhYm91dCB0byBkZXN0cm95IHRoaXMgZWFnZXIgZWZmZWN0LiBSdW4gdGhlIGVmZmVjdCBzb1xuXHRcdFx0Ly8gaXRzIG93biBlcnJvciBoYW5kbGluZyBjYW4gZGVhbCB3aXRoIHRyYW5zaWVudCBmYWlsdXJlcy5cblx0XHRcdGRpcnR5ID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoZGlydHkpIHtcblx0XHRcdHVwZGF0ZV9lZmZlY3QoZWZmZWN0KTtcblx0XHR9XG5cdH1cblxuXHRlYWdlcl9lZmZlY3RzLmNsZWFyKCk7XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIHtudW1iZXIgfCBiaWdpbnR9IFRcbiAqIEBwYXJhbSB7U291cmNlPFQ+fSBzb3VyY2VcbiAqIEBwYXJhbSB7MSB8IC0xfSBbZF1cbiAqIEByZXR1cm5zIHtUfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlKHNvdXJjZSwgZCA9IDEpIHtcblx0dmFyIHZhbHVlID0gZ2V0KHNvdXJjZSk7XG5cdHZhciByZXN1bHQgPSBkID09PSAxID8gdmFsdWUrKyA6IHZhbHVlLS07XG5cblx0c2V0KHNvdXJjZSwgdmFsdWUpO1xuXG5cdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUge251bWJlciB8IGJpZ2ludH0gVFxuICogQHBhcmFtIHtTb3VyY2U8VD59IHNvdXJjZVxuICogQHBhcmFtIHsxIHwgLTF9IFtkXVxuICogQHJldHVybnMge1R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVfcHJlKHNvdXJjZSwgZCA9IDEpIHtcblx0dmFyIHZhbHVlID0gZ2V0KHNvdXJjZSk7XG5cblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdXNlbGVzcy1hc3NpZ25tZW50IC0tIGArK2AvYC0tYCB1c2VkIGZvciByZXR1cm4gdmFsdWUsIG5vdCBzaWRlIGVmZmVjdCBvbiBgdmFsdWVgXG5cdHJldHVybiBzZXQoc291cmNlLCBkID09PSAxID8gKyt2YWx1ZSA6IC0tdmFsdWUpO1xufVxuXG4vKipcbiAqIFNpbGVudGx5ICh3aXRob3V0IHVzaW5nIGBnZXRgKSBpbmNyZW1lbnQgYSBzb3VyY2VcbiAqIEBwYXJhbSB7U291cmNlPG51bWJlcj59IHNvdXJjZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50KHNvdXJjZSkge1xuXHRzZXQoc291cmNlLCBzb3VyY2UudiArIDEpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7VmFsdWV9IHNpZ25hbFxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXR1cyBzaG91bGQgYmUgRElSVFkgb3IgTUFZQkVfRElSVFlcbiAqIEBwYXJhbSB7RWZmZWN0W10gfCBudWxsfSB1cGRhdGVkX2R1cmluZ190cmF2ZXJzYWxcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5mdW5jdGlvbiBtYXJrX3JlYWN0aW9ucyhzaWduYWwsIHN0YXR1cywgdXBkYXRlZF9kdXJpbmdfdHJhdmVyc2FsKSB7XG5cdHZhciByZWFjdGlvbnMgPSBzaWduYWwucmVhY3Rpb25zO1xuXHRpZiAocmVhY3Rpb25zID09PSBudWxsKSByZXR1cm47XG5cblx0dmFyIHJ1bmVzID0gaXNfcnVuZXMoKTtcblx0dmFyIGxlbmd0aCA9IHJlYWN0aW9ucy5sZW5ndGg7XG5cblx0Y291bnRfZGVwcyArPSBsZW5ndGg7XG5cdC8vIEFjdGl2YXRlIHRoZSBgc2VlbmAgU2V0IGlmIHdlIHRoaW5rIGZyb20gdGhlIHVudXN1YWxseSBoaWdoIG51bWJlciBvZiBkZXBzIHRoYXRcblx0Ly8gdGhlcmUgbWlnaHQgYmUgY3ljbGVzIGluIHRoZSBncmFwaCwgdG8gYXZvaWQgcmVwZWF0ZWQgbG9va3VwcyBmb3IgcmVhY3Rpb25zXG5cdC8vIEV4YW1wbGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9zdmVsdGUvaXNzdWVzLzE2NjU4IGhhcyBhIGdyYXBoIHdpdGggb25lIHNvdXJjZVxuXHQvLyByZWFjaGluZyB+MTAwMDAgZGlzdGluY3QgZGVyaXZlZHMvZWZmZWN0cyBlYWNoLCByZXN1bHRpbmcgaW4gNjUgbWlsbGlvbiB3YWxrcyB0aHJvdWdoIHJlcGVhdGVkIHZpc2l0cy5cblx0aWYgKGNvdW50X2RlcHMgPiAxMDAwMDAgJiYgc2VlbiA9PT0gbnVsbCkgc2VlbiA9IG5ldyBTZXQoKTtcblxuXHRpZiAoc2VlbiAhPT0gbnVsbCkge1xuXHRcdGlmIChzZWVuLmhhcyhzaWduYWwpKSByZXR1cm47XG5cdFx0c2Vlbi5hZGQoc2lnbmFsKTtcblx0fVxuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgcmVhY3Rpb24gPSByZWFjdGlvbnNbaV07XG5cdFx0dmFyIGZsYWdzID0gcmVhY3Rpb24uZjtcblxuXHRcdC8vIEluIGxlZ2FjeSBtb2RlLCBza2lwIHRoZSBjdXJyZW50IGVmZmVjdCB0byBwcmV2ZW50IGluZmluaXRlIGxvb3BzXG5cdFx0aWYgKCFydW5lcyAmJiByZWFjdGlvbiA9PT0gYWN0aXZlX2VmZmVjdCkgY29udGludWU7XG5cblx0XHR2YXIgbm90X2RpcnR5ID0gKGZsYWdzICYgRElSVFkpID09PSAwO1xuXG5cdFx0Ly8gZG9uJ3Qgc2V0IGEgRElSVFkgcmVhY3Rpb24gdG8gTUFZQkVfRElSVFlcblx0XHRpZiAobm90X2RpcnR5KSB7XG5cdFx0XHRzZXRfc2lnbmFsX3N0YXR1cyhyZWFjdGlvbiwgc3RhdHVzKTtcblx0XHR9XG5cblx0XHRpZiAoKGZsYWdzICYgRUFHRVJfRUZGRUNUKSAhPT0gMCkge1xuXHRcdFx0Ly8gRWFnZXIgZWZmZWN0cyBuZWVkIHRvIHJ1biBpbW1lZGlhdGVseTpcblx0XHRcdC8vIC0gZm9yICRpbnNwZWN0IHNvIHRoYXQgdGhlIHN0YWNrIHRyYWNlIG1ha2VzIHNlbnNlXG5cdFx0XHQvLyAtIGZvciAkc3RhdGUuZWFnZXIgYmVjYXVzZSB0aGV5IG1pZ2h0IGJlIHdpdGhvdXQgYW4gZWZmZWN0IHBhcmVudFxuXHRcdFx0ZWFnZXJfZWZmZWN0cy5hZGQoLyoqIEB0eXBlIHtFZmZlY3R9ICovIChyZWFjdGlvbikpO1xuXHRcdH0gZWxzZSBpZiAoKGZsYWdzICYgREVSSVZFRCkgIT09IDApIHtcblx0XHRcdHZhciBkZXJpdmVkID0gLyoqIEB0eXBlIHtEZXJpdmVkfSAqLyAocmVhY3Rpb24pO1xuXG5cdFx0XHRiYXRjaF92YWx1ZXM/LmRlbGV0ZShkZXJpdmVkKTtcblx0XHRcdG1hcmtfcmVhY3Rpb25zKGRlcml2ZWQsIE1BWUJFX0RJUlRZLCB1cGRhdGVkX2R1cmluZ190cmF2ZXJzYWwpO1xuXHRcdH0gZWxzZSBpZiAobm90X2RpcnR5KSB7XG5cdFx0XHR2YXIgZWZmZWN0ID0gLyoqIEB0eXBlIHtFZmZlY3R9ICovIChyZWFjdGlvbik7XG5cblx0XHRcdGlmICgoZmxhZ3MgJiBCTE9DS19FRkZFQ1QpICE9PSAwICYmIGVhZ2VyX2Jsb2NrX2VmZmVjdHMgIT09IG51bGwpIHtcblx0XHRcdFx0ZWFnZXJfYmxvY2tfZWZmZWN0cy5hZGQoZWZmZWN0KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHVwZGF0ZWRfZHVyaW5nX3RyYXZlcnNhbCAhPT0gbnVsbCkge1xuXHRcdFx0XHR1cGRhdGVkX2R1cmluZ190cmF2ZXJzYWwucHVzaChlZmZlY3QpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c2NoZWR1bGVfZWZmZWN0KGVmZmVjdCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG4iLCIvKiogQGltcG9ydCB7IFNvdXJjZSB9IGZyb20gJyNjbGllbnQnICovXG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7XG5cdGdldCxcblx0YWN0aXZlX2VmZmVjdCxcblx0dXBkYXRlX3ZlcnNpb24sXG5cdGFjdGl2ZV9yZWFjdGlvbixcblx0c2V0X3VwZGF0ZV92ZXJzaW9uLFxuXHRzZXRfYWN0aXZlX3JlYWN0aW9uXG59IGZyb20gJy4vcnVudGltZS5qcyc7XG5pbXBvcnQge1xuXHRhcnJheV9wcm90b3R5cGUsXG5cdGdldF9kZXNjcmlwdG9yLFxuXHRnZXRfcHJvdG90eXBlX29mLFxuXHRpc19hcnJheSxcblx0b2JqZWN0X3Byb3RvdHlwZVxufSBmcm9tICcuLi9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0IHtcblx0c3RhdGUgYXMgc291cmNlLFxuXHRzZXQsXG5cdGluY3JlbWVudCxcblx0Zmx1c2hfZWFnZXJfZWZmZWN0cyxcblx0c2V0X2VhZ2VyX2VmZmVjdHNfZGVmZXJyZWRcbn0gZnJvbSAnLi9yZWFjdGl2aXR5L3NvdXJjZXMuanMnO1xuaW1wb3J0IHsgQ09NUE9ORU5UX1NZTUJPTCwgUFJPWFlfUEFUSF9TWU1CT0wsIFNUQVRFX1NZTUJPTCB9IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcbmltcG9ydCB7IFVOSU5JVElBTElaRUQgfSBmcm9tICcuLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0ICogYXMgZSBmcm9tICcuL2Vycm9ycy5qcyc7XG5pbXBvcnQgeyB0YWcgfSBmcm9tICcuL2Rldi90cmFjaW5nLmpzJztcbmltcG9ydCB7IGdldF9lcnJvciB9IGZyb20gJy4uL3NoYXJlZC9kZXYuanMnO1xuaW1wb3J0IHsgdHJhY2luZ19tb2RlX2ZsYWcgfSBmcm9tICcuLi9mbGFncy9pbmRleC5qcyc7XG5cbi8vIFRPRE8gbW92ZSBhbGwgcmVnZXhlcyBpbnRvIHNoYXJlZCBtb2R1bGU/XG5jb25zdCByZWdleF9pc192YWxpZF9pZGVudGlmaWVyID0gL15bYS16QS1aXyRdW2EtekEtWl8kMC05XSokLztcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfSB2YWx1ZVxuICogQHJldHVybnMge1R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm94eSh2YWx1ZSkge1xuXHQvLyBpZiBub24tcHJveHlhYmxlLCBhIGNvbXBvbmVudCBpbnN0YW5jZSwgb3IgYWxyZWFkeSBhIHByb3h5LCByZXR1cm4gYHZhbHVlYFxuXHRpZiAoXG5cdFx0dHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyB8fFxuXHRcdHZhbHVlID09PSBudWxsIHx8XG5cdFx0U1RBVEVfU1lNQk9MIGluIHZhbHVlIHx8XG5cdFx0Q09NUE9ORU5UX1NZTUJPTCBpbiB2YWx1ZVxuXHQpIHtcblx0XHRyZXR1cm4gdmFsdWU7XG5cdH1cblxuXHRjb25zdCBwcm90b3R5cGUgPSBnZXRfcHJvdG90eXBlX29mKHZhbHVlKTtcblxuXHRpZiAocHJvdG90eXBlICE9PSBvYmplY3RfcHJvdG90eXBlICYmIHByb3RvdHlwZSAhPT0gYXJyYXlfcHJvdG90eXBlKSB7XG5cdFx0cmV0dXJuIHZhbHVlO1xuXHR9XG5cblx0LyoqIEB0eXBlIHtNYXA8YW55LCBTb3VyY2U8YW55Pj59ICovXG5cdHZhciBzb3VyY2VzID0gbmV3IE1hcCgpO1xuXHR2YXIgaXNfcHJveGllZF9hcnJheSA9IGlzX2FycmF5KHZhbHVlKTtcblx0dmFyIHZlcnNpb24gPSBzb3VyY2UoMCk7XG5cblx0dmFyIHN0YWNrID0gREVWICYmIHRyYWNpbmdfbW9kZV9mbGFnID8gZ2V0X2Vycm9yKCdjcmVhdGVkIGF0JykgOiBudWxsO1xuXHR2YXIgcGFyZW50X3ZlcnNpb24gPSB1cGRhdGVfdmVyc2lvbjtcblxuXHQvKipcblx0ICogRXhlY3V0ZXMgdGhlIHByb3h5IGluIHRoZSBjb250ZXh0IG9mIHRoZSByZWFjdGlvbiBpdCB3YXMgb3JpZ2luYWxseSBjcmVhdGVkIGluLCBpZiBhbnlcblx0ICogQHRlbXBsYXRlIFRcblx0ICogQHBhcmFtIHsoKSA9PiBUfSBmblxuXHQgKi9cblx0dmFyIHdpdGhfcGFyZW50ID0gKGZuKSA9PiB7XG5cdFx0aWYgKHVwZGF0ZV92ZXJzaW9uID09PSBwYXJlbnRfdmVyc2lvbikge1xuXHRcdFx0cmV0dXJuIGZuKCk7XG5cdFx0fVxuXG5cdFx0Ly8gY2hpbGQgc291cmNlIGlzIGJlaW5nIGNyZWF0ZWQgYWZ0ZXIgdGhlIGluaXRpYWwgcHJveHkg4oCUXG5cdFx0Ly8gcHJldmVudCBpdCBmcm9tIGJlaW5nIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCByZWFjdGlvblxuXHRcdHZhciByZWFjdGlvbiA9IGFjdGl2ZV9yZWFjdGlvbjtcblx0XHR2YXIgdmVyc2lvbiA9IHVwZGF0ZV92ZXJzaW9uO1xuXG5cdFx0c2V0X2FjdGl2ZV9yZWFjdGlvbihudWxsKTtcblx0XHRzZXRfdXBkYXRlX3ZlcnNpb24ocGFyZW50X3ZlcnNpb24pO1xuXG5cdFx0dmFyIHJlc3VsdCA9IGZuKCk7XG5cblx0XHRzZXRfYWN0aXZlX3JlYWN0aW9uKHJlYWN0aW9uKTtcblx0XHRzZXRfdXBkYXRlX3ZlcnNpb24odmVyc2lvbik7XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9O1xuXG5cdGlmIChpc19wcm94aWVkX2FycmF5KSB7XG5cdFx0Ly8gV2UgbmVlZCB0byBjcmVhdGUgdGhlIGxlbmd0aCBzb3VyY2UgZWFnZXJseSB0byBlbnN1cmUgdGhhdFxuXHRcdC8vIG11dGF0aW9ucyB0byB0aGUgYXJyYXkgYXJlIHByb3Blcmx5IHN5bmNlZCB3aXRoIG91ciBwcm94eVxuXHRcdHNvdXJjZXMuc2V0KCdsZW5ndGgnLCBzb3VyY2UoLyoqIEB0eXBlIHthbnlbXX0gKi8gKHZhbHVlKS5sZW5ndGgsIHN0YWNrKSk7XG5cdFx0aWYgKERFVikge1xuXHRcdFx0dmFsdWUgPSAvKiogQHR5cGUge2FueX0gKi8gKGluc3BlY3RhYmxlX2FycmF5KC8qKiBAdHlwZSB7YW55W119ICovICh2YWx1ZSkpKTtcblx0XHR9XG5cdH1cblxuXHQvKiogVXNlZCBpbiBkZXYgZm9yICRpbnNwZWN0LnRyYWNlKCkgKi9cblx0dmFyIHBhdGggPSAnJztcblx0bGV0IHVwZGF0aW5nID0gZmFsc2U7XG5cdC8qKiBAcGFyYW0ge3N0cmluZ30gbmV3X3BhdGggKi9cblx0ZnVuY3Rpb24gdXBkYXRlX3BhdGgobmV3X3BhdGgpIHtcblx0XHRpZiAodXBkYXRpbmcpIHJldHVybjtcblx0XHR1cGRhdGluZyA9IHRydWU7XG5cdFx0cGF0aCA9IG5ld19wYXRoO1xuXG5cdFx0dGFnKHZlcnNpb24sIGAke3BhdGh9IHZlcnNpb25gKTtcblxuXHRcdC8vIHJlbmFtZSBhbGwgY2hpbGQgc291cmNlcyBhbmQgY2hpbGQgcHJveGllc1xuXHRcdGZvciAoY29uc3QgW3Byb3AsIHNvdXJjZV0gb2Ygc291cmNlcykge1xuXHRcdFx0dGFnKHNvdXJjZSwgZ2V0X2xhYmVsKHBhdGgsIHByb3ApKTtcblx0XHR9XG5cdFx0dXBkYXRpbmcgPSBmYWxzZTtcblx0fVxuXG5cdHJldHVybiBuZXcgUHJveHkoLyoqIEB0eXBlIHthbnl9ICovICh2YWx1ZSksIHtcblx0XHRkZWZpbmVQcm9wZXJ0eShfLCBwcm9wLCBkZXNjcmlwdG9yKSB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdCEoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSB8fFxuXHRcdFx0XHRkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9PT0gZmFsc2UgfHxcblx0XHRcdFx0ZGVzY3JpcHRvci5lbnVtZXJhYmxlID09PSBmYWxzZSB8fFxuXHRcdFx0XHRkZXNjcmlwdG9yLndyaXRhYmxlID09PSBmYWxzZVxuXHRcdFx0KSB7XG5cdFx0XHRcdC8vIHdlIGRpc2FsbG93IG5vbi1iYXNpYyBkZXNjcmlwdG9ycywgYmVjYXVzZSB1bmxlc3MgdGhleSBhcmUgYXBwbGllZCB0byB0aGVcblx0XHRcdFx0Ly8gdGFyZ2V0IG9iamVjdCDigJQgd2hpY2ggd2UgYXZvaWQsIHNvIHRoYXQgc3RhdGUgY2FuIGJlIGZvcmtlZCDigJQgd2Ugd2lsbCBydW5cblx0XHRcdFx0Ly8gYWZvdWwgb2YgdGhlIHZhcmlvdXMgaW52YXJpYW50c1xuXHRcdFx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9Qcm94eS9Qcm94eS9nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IjaW52YXJpYW50c1xuXHRcdFx0XHRlLnN0YXRlX2Rlc2NyaXB0b3JzX2ZpeGVkKCk7XG5cdFx0XHR9XG5cdFx0XHR2YXIgcyA9IHNvdXJjZXMuZ2V0KHByb3ApO1xuXHRcdFx0aWYgKHMgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHR3aXRoX3BhcmVudCgoKSA9PiB7XG5cdFx0XHRcdFx0dmFyIHMgPSBzb3VyY2UoZGVzY3JpcHRvci52YWx1ZSwgc3RhY2spO1xuXHRcdFx0XHRcdHNvdXJjZXMuc2V0KHByb3AsIHMpO1xuXHRcdFx0XHRcdGlmIChERVYgJiYgdHlwZW9mIHByb3AgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0XHR0YWcocywgZ2V0X2xhYmVsKHBhdGgsIHByb3ApKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHM7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c2V0KHMsIGRlc2NyaXB0b3IudmFsdWUsIHRydWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9LFxuXG5cdFx0ZGVsZXRlUHJvcGVydHkodGFyZ2V0LCBwcm9wKSB7XG5cdFx0XHR2YXIgcyA9IHNvdXJjZXMuZ2V0KHByb3ApO1xuXG5cdFx0XHRpZiAocyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGlmIChwcm9wIGluIHRhcmdldCkge1xuXHRcdFx0XHRcdGNvbnN0IHMgPSB3aXRoX3BhcmVudCgoKSA9PiBzb3VyY2UoVU5JTklUSUFMSVpFRCwgc3RhY2spKTtcblx0XHRcdFx0XHRzb3VyY2VzLnNldChwcm9wLCBzKTtcblx0XHRcdFx0XHRpbmNyZW1lbnQodmVyc2lvbik7XG5cblx0XHRcdFx0XHRpZiAoREVWKSB7XG5cdFx0XHRcdFx0XHR0YWcocywgZ2V0X2xhYmVsKHBhdGgsIHByb3ApKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNldChzLCBVTklOSVRJQUxJWkVEKTtcblx0XHRcdFx0aW5jcmVtZW50KHZlcnNpb24pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9LFxuXG5cdFx0Z2V0KHRhcmdldCwgcHJvcCwgcmVjZWl2ZXIpIHtcblx0XHRcdGlmIChwcm9wID09PSBTVEFURV9TWU1CT0wpIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoREVWICYmIHByb3AgPT09IFBST1hZX1BBVEhfU1lNQk9MKSB7XG5cdFx0XHRcdHJldHVybiB1cGRhdGVfcGF0aDtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHMgPSBzb3VyY2VzLmdldChwcm9wKTtcblx0XHRcdHZhciBleGlzdHMgPSBwcm9wIGluIHRhcmdldDtcblxuXHRcdFx0Ly8gY3JlYXRlIGEgc291cmNlLCBidXQgb25seSBpZiBpdCdzIGFuIG93biBwcm9wZXJ0eSBhbmQgbm90IGEgcHJvdG90eXBlIHByb3BlcnR5XG5cdFx0XHRpZiAocyA9PT0gdW5kZWZpbmVkICYmICghZXhpc3RzIHx8IGdldF9kZXNjcmlwdG9yKHRhcmdldCwgcHJvcCk/LndyaXRhYmxlKSkge1xuXHRcdFx0XHRzID0gd2l0aF9wYXJlbnQoKCkgPT4ge1xuXHRcdFx0XHRcdHZhciBwID0gcHJveHkoZXhpc3RzID8gdGFyZ2V0W3Byb3BdIDogVU5JTklUSUFMSVpFRCk7XG5cdFx0XHRcdFx0dmFyIHMgPSBzb3VyY2UocCwgc3RhY2spO1xuXG5cdFx0XHRcdFx0aWYgKERFVikge1xuXHRcdFx0XHRcdFx0dGFnKHMsIGdldF9sYWJlbChwYXRoLCBwcm9wKSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHM7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHNvdXJjZXMuc2V0KHByb3AsIHMpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHZhciB2ID0gZ2V0KHMpO1xuXHRcdFx0XHRyZXR1cm4gdiA9PT0gVU5JTklUSUFMSVpFRCA/IHVuZGVmaW5lZCA6IHY7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSZWZsZWN0LmdldCh0YXJnZXQsIHByb3AsIHJlY2VpdmVyKTtcblx0XHR9LFxuXG5cdFx0Z2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgcHJvcCkge1xuXHRcdFx0dGhpcy5oYXM/Lih0YXJnZXQsIHByb3ApO1xuXG5cdFx0XHR2YXIgZGVzY3JpcHRvciA9IFJlZmxlY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgcHJvcCk7XG5cdFx0XHR2YXIgcyA9IHNvdXJjZXMuZ2V0KHByb3ApO1xuXG5cdFx0XHRpZiAocyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHZhciB2YWx1ZSA9IGdldChzKTtcblxuXHRcdFx0XHRpZiAodmFsdWUgPT09IFVOSU5JVElBTElaRUQpIHtcblx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGRlc2NyaXB0b3IgJiYgJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSB7XG5cdFx0XHRcdFx0ZGVzY3JpcHRvci52YWx1ZSA9IHZhbHVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdFx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxuXHRcdFx0XHRcdFx0dmFsdWUsXG5cdFx0XHRcdFx0XHR3cml0YWJsZTogdHJ1ZVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGRlc2NyaXB0b3I7XG5cdFx0fSxcblxuXHRcdGhhcyh0YXJnZXQsIHByb3ApIHtcblx0XHRcdGlmIChwcm9wID09PSBTVEFURV9TWU1CT0wpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBzID0gc291cmNlcy5nZXQocHJvcCk7XG5cdFx0XHR2YXIgaGFzID0gKHMgIT09IHVuZGVmaW5lZCAmJiBzLnYgIT09IFVOSU5JVElBTElaRUQpIHx8IFJlZmxlY3QuaGFzKHRhcmdldCwgcHJvcCk7XG5cblx0XHRcdGlmIChcblx0XHRcdFx0cyAhPT0gdW5kZWZpbmVkIHx8XG5cdFx0XHRcdCgoYWN0aXZlX2VmZmVjdCAhPT0gbnVsbCB8fCBhY3RpdmVfcmVhY3Rpb24gIT09IG51bGwpICYmXG5cdFx0XHRcdFx0KCFoYXMgfHwgZ2V0X2Rlc2NyaXB0b3IodGFyZ2V0LCBwcm9wKT8ud3JpdGFibGUpKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGlmIChzID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRzID0gd2l0aF9wYXJlbnQoKCkgPT4ge1xuXHRcdFx0XHRcdFx0dmFyIHAgPSBoYXMgPyBwcm94eSh0YXJnZXRbcHJvcF0pIDogVU5JTklUSUFMSVpFRDtcblx0XHRcdFx0XHRcdHZhciBzID0gc291cmNlKHAsIHN0YWNrKTtcblxuXHRcdFx0XHRcdFx0aWYgKERFVikge1xuXHRcdFx0XHRcdFx0XHR0YWcocywgZ2V0X2xhYmVsKHBhdGgsIHByb3ApKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIHM7XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRzb3VyY2VzLnNldChwcm9wLCBzKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciB2YWx1ZSA9IGdldChzKTtcblx0XHRcdFx0aWYgKHZhbHVlID09PSBVTklOSVRJQUxJWkVEKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBoYXM7XG5cdFx0fSxcblxuXHRcdHNldCh0YXJnZXQsIHByb3AsIHZhbHVlLCByZWNlaXZlcikge1xuXHRcdFx0dmFyIHMgPSBzb3VyY2VzLmdldChwcm9wKTtcblx0XHRcdHZhciBoYXMgPSBwcm9wIGluIHRhcmdldDtcblxuXHRcdFx0Ly8gdmFyaWFibGUubGVuZ3RoID0gdmFsdWUgLT4gY2xlYXIgYWxsIHNpZ25hbHMgd2l0aCBpbmRleCA+PSB2YWx1ZVxuXHRcdFx0aWYgKGlzX3Byb3hpZWRfYXJyYXkgJiYgcHJvcCA9PT0gJ2xlbmd0aCcpIHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IHZhbHVlOyBpIDwgLyoqIEB0eXBlIHtTb3VyY2U8bnVtYmVyPn0gKi8gKHMpLnY7IGkgKz0gMSkge1xuXHRcdFx0XHRcdHZhciBvdGhlcl9zID0gc291cmNlcy5nZXQoaSArICcnKTtcblx0XHRcdFx0XHRpZiAob3RoZXJfcyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRzZXQob3RoZXJfcywgVU5JTklUSUFMSVpFRCk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChpIGluIHRhcmdldCkge1xuXHRcdFx0XHRcdFx0Ly8gSWYgdGhlIGl0ZW0gZXhpc3RzIGluIHRoZSBvcmlnaW5hbCwgd2UgbmVlZCB0byBjcmVhdGUgYW4gdW5pbml0aWFsaXplZCBzb3VyY2UsXG5cdFx0XHRcdFx0XHQvLyBlbHNlIGEgbGF0ZXIgcmVhZCBvZiB0aGUgcHJvcGVydHkgd291bGQgcmVzdWx0IGluIGEgc291cmNlIGJlaW5nIGNyZWF0ZWQgd2l0aFxuXHRcdFx0XHRcdFx0Ly8gdGhlIHZhbHVlIG9mIHRoZSBvcmlnaW5hbCBpdGVtIGF0IHRoYXQgaW5kZXguXG5cdFx0XHRcdFx0XHRvdGhlcl9zID0gd2l0aF9wYXJlbnQoKCkgPT4gc291cmNlKFVOSU5JVElBTElaRUQsIHN0YWNrKSk7XG5cdFx0XHRcdFx0XHRzb3VyY2VzLnNldChpICsgJycsIG90aGVyX3MpO1xuXG5cdFx0XHRcdFx0XHRpZiAoREVWKSB7XG5cdFx0XHRcdFx0XHRcdHRhZyhvdGhlcl9zLCBnZXRfbGFiZWwocGF0aCwgaSkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiB3ZSBoYXZlbid0IHlldCBjcmVhdGVkIGEgc291cmNlIGZvciB0aGlzIHByb3BlcnR5LCB3ZSBuZWVkIHRvIGVuc3VyZVxuXHRcdFx0Ly8gd2UgZG8gc28gb3RoZXJ3aXNlIGlmIHdlIHJlYWQgaXQgbGF0ZXIsIHRoZW4gdGhlIHdyaXRlIHdvbid0IGJlIHRyYWNrZWQgYW5kXG5cdFx0XHQvLyB0aGUgaGV1cmlzdGljcyBvZiBlZmZlY3RzIHdpbGwgYmUgZGlmZmVyZW50IHZzIGlmIHdlIGhhZCByZWFkIHRoZSBwcm94aWVkXG5cdFx0XHQvLyBvYmplY3QgcHJvcGVydHkgYmVmb3JlIHdyaXRpbmcgdG8gdGhhdCBwcm9wZXJ0eS5cblx0XHRcdGlmIChzID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0aWYgKCFoYXMgfHwgZ2V0X2Rlc2NyaXB0b3IodGFyZ2V0LCBwcm9wKT8ud3JpdGFibGUpIHtcblx0XHRcdFx0XHRzID0gd2l0aF9wYXJlbnQoKCkgPT4gc291cmNlKHVuZGVmaW5lZCwgc3RhY2spKTtcblxuXHRcdFx0XHRcdGlmIChERVYpIHtcblx0XHRcdFx0XHRcdHRhZyhzLCBnZXRfbGFiZWwocGF0aCwgcHJvcCkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRzZXQocywgcHJveHkodmFsdWUpKTtcblxuXHRcdFx0XHRcdHNvdXJjZXMuc2V0KHByb3AsIHMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRoYXMgPSBzLnYgIT09IFVOSU5JVElBTElaRUQ7XG5cblx0XHRcdFx0dmFyIHAgPSB3aXRoX3BhcmVudCgoKSA9PiBwcm94eSh2YWx1ZSkpO1xuXHRcdFx0XHRzZXQocywgcCk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBkZXNjcmlwdG9yID0gUmVmbGVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBwcm9wKTtcblxuXHRcdFx0Ly8gU2V0IHRoZSBuZXcgdmFsdWUgYmVmb3JlIHVwZGF0aW5nIGFueSBzaWduYWxzIHNvIHRoYXQgYW55IGxpc3RlbmVycyBnZXQgdGhlIG5ldyB2YWx1ZVxuXHRcdFx0aWYgKGRlc2NyaXB0b3I/LnNldCkge1xuXHRcdFx0XHRkZXNjcmlwdG9yLnNldC5jYWxsKHJlY2VpdmVyLCB2YWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghaGFzKSB7XG5cdFx0XHRcdC8vIElmIHdlIGhhdmUgbXV0YXRlZCBhbiBhcnJheSBkaXJlY3RseSwgd2UgbWlnaHQgbmVlZCB0b1xuXHRcdFx0XHQvLyBzaWduYWwgdGhhdCBsZW5ndGggaGFzIGFsc28gY2hhbmdlZC4gRG8gaXQgYmVmb3JlIHVwZGF0aW5nIG1ldGFkYXRhXG5cdFx0XHRcdC8vIHRvIGVuc3VyZSB0aGF0IGl0ZXJhdGluZyBvdmVyIHRoZSBhcnJheSBhcyBhIHJlc3VsdCBvZiBhIG1ldGFkYXRhIHVwZGF0ZVxuXHRcdFx0XHQvLyB3aWxsIG5vdCBjYXVzZSB0aGUgbGVuZ3RoIHRvIGJlIG91dCBvZiBzeW5jLlxuXHRcdFx0XHRpZiAoaXNfcHJveGllZF9hcnJheSAmJiB0eXBlb2YgcHJvcCA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHR2YXIgbHMgPSAvKiogQHR5cGUge1NvdXJjZTxudW1iZXI+fSAqLyAoc291cmNlcy5nZXQoJ2xlbmd0aCcpKTtcblx0XHRcdFx0XHR2YXIgbiA9IE51bWJlcihwcm9wKTtcblxuXHRcdFx0XHRcdGlmIChOdW1iZXIuaXNJbnRlZ2VyKG4pICYmIG4gPj0gbHMudikge1xuXHRcdFx0XHRcdFx0c2V0KGxzLCBuICsgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aW5jcmVtZW50KHZlcnNpb24pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9LFxuXG5cdFx0b3duS2V5cyh0YXJnZXQpIHtcblx0XHRcdGdldCh2ZXJzaW9uKTtcblxuXHRcdFx0dmFyIG93bl9rZXlzID0gUmVmbGVjdC5vd25LZXlzKHRhcmdldCkuZmlsdGVyKChrZXkpID0+IHtcblx0XHRcdFx0dmFyIHNvdXJjZSA9IHNvdXJjZXMuZ2V0KGtleSk7XG5cdFx0XHRcdHJldHVybiBzb3VyY2UgPT09IHVuZGVmaW5lZCB8fCBzb3VyY2UudiAhPT0gVU5JTklUSUFMSVpFRDtcblx0XHRcdH0pO1xuXG5cdFx0XHRmb3IgKHZhciBba2V5LCBzb3VyY2VdIG9mIHNvdXJjZXMpIHtcblx0XHRcdFx0aWYgKHNvdXJjZS52ICE9PSBVTklOSVRJQUxJWkVEICYmICEoa2V5IGluIHRhcmdldCkpIHtcblx0XHRcdFx0XHRvd25fa2V5cy5wdXNoKGtleSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG93bl9rZXlzO1xuXHRcdH0sXG5cblx0XHRzZXRQcm90b3R5cGVPZigpIHtcblx0XHRcdGUuc3RhdGVfcHJvdG90eXBlX2ZpeGVkKCk7XG5cdFx0fVxuXHR9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtzdHJpbmcgfCBzeW1ib2x9IHByb3BcbiAqL1xuZnVuY3Rpb24gZ2V0X2xhYmVsKHBhdGgsIHByb3ApIHtcblx0aWYgKHR5cGVvZiBwcm9wID09PSAnc3ltYm9sJykgcmV0dXJuIGAke3BhdGh9W1N5bWJvbCgke3Byb3AuZGVzY3JpcHRpb24gPz8gJyd9KV1gO1xuXHRpZiAocmVnZXhfaXNfdmFsaWRfaWRlbnRpZmllci50ZXN0KHByb3ApKSByZXR1cm4gYCR7cGF0aH0uJHtwcm9wfWA7XG5cdHJldHVybiAvXlxcZCskLy50ZXN0KHByb3ApID8gYCR7cGF0aH1bJHtwcm9wfV1gIDogYCR7cGF0aH1bJyR7cHJvcH0nXWA7XG59XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRfcHJveGllZF92YWx1ZSh2YWx1ZSkge1xuXHR0cnkge1xuXHRcdGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIFNUQVRFX1NZTUJPTCBpbiB2YWx1ZSkge1xuXHRcdFx0cmV0dXJuIHZhbHVlW1NUQVRFX1NZTUJPTF07XG5cdFx0fVxuXHR9IGNhdGNoIHtcblx0XHQvLyB0aGUgYWJvdmUgaWYgY2hlY2sgY2FuIHRocm93IGFuIGVycm9yIGlmIHRoZSB2YWx1ZSBpbiBxdWVzdGlvblxuXHRcdC8vIGlzIHRoZSBjb250ZW50V2luZG93IG9mIGFuIGlmcmFtZSBvbiBhbm90aGVyIGRvbWFpbiwgaW4gd2hpY2hcblx0XHQvLyBjYXNlIHdlIHdhbnQgdG8ganVzdCByZXR1cm4gdGhlIHZhbHVlIChiZWNhdXNlIGl0J3MgZGVmaW5pdGVseVxuXHRcdC8vIG5vdCBhIHByb3hpZWQgdmFsdWUpIHNvIHdlIGRvbid0IGJyZWFrIGFueSBKYXZhU2NyaXB0IGludGVyYWN0aW5nXG5cdFx0Ly8gd2l0aCB0aGF0IGlmcmFtZSAoc3VjaCBhcyB2YXJpb3VzIHBheW1lbnQgY29tcGFuaWVzIGNsaWVudCBzaWRlXG5cdFx0Ly8gSmF2YVNjcmlwdCBsaWJyYXJpZXMgaW50ZXJhY3Rpbmcgd2l0aCB0aGVpciBpZnJhbWVzIG9uIHRoZSBzYW1lXG5cdFx0Ly8gZG9tYWluKVxuXHR9XG5cblx0cmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBhXG4gKiBAcGFyYW0ge2FueX0gYlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXMoYSwgYikge1xuXHRyZXR1cm4gT2JqZWN0LmlzKGdldF9wcm94aWVkX3ZhbHVlKGEpLCBnZXRfcHJveGllZF92YWx1ZShiKSk7XG59XG5cbmNvbnN0IEFSUkFZX01VVEFUSU5HX01FVEhPRFMgPSBuZXcgU2V0KFtcblx0J2NvcHlXaXRoaW4nLFxuXHQnZmlsbCcsXG5cdCdwb3AnLFxuXHQncHVzaCcsXG5cdCdyZXZlcnNlJyxcblx0J3NoaWZ0Jyxcblx0J3NvcnQnLFxuXHQnc3BsaWNlJyxcblx0J3Vuc2hpZnQnXG5dKTtcblxuLyoqXG4gKiBXcmFwIGFycmF5IG11dGF0aW5nIG1ldGhvZHMgc28gJGluc3BlY3QgaXMgdHJpZ2dlcmVkIG9ubHkgb25jZSBhbmRcbiAqIHRvIHByZXZlbnQgbG9nZ2luZyBhbiBhcnJheSBpbiBpbnRlcm1lZGlhdGUgc3RhdGUgKGUuZy4gd2l0aCBhbiBlbXB0eSBzbG90KVxuICogQHBhcmFtIHthbnlbXX0gYXJyYXlcbiAqL1xuZnVuY3Rpb24gaW5zcGVjdGFibGVfYXJyYXkoYXJyYXkpIHtcblx0cmV0dXJuIG5ldyBQcm94eShhcnJheSwge1xuXHRcdGdldCh0YXJnZXQsIHByb3AsIHJlY2VpdmVyKSB7XG5cdFx0XHR2YXIgdmFsdWUgPSBSZWZsZWN0LmdldCh0YXJnZXQsIHByb3AsIHJlY2VpdmVyKTtcblx0XHRcdGlmICghQVJSQVlfTVVUQVRJTkdfTUVUSE9EUy5oYXMoLyoqIEB0eXBlIHtzdHJpbmd9ICovIChwcm9wKSkpIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvKipcblx0XHRcdCAqIEB0aGlzIHthbnlbXX1cblx0XHRcdCAqIEBwYXJhbSB7YW55W119IGFyZ3Ncblx0XHRcdCAqL1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG5cdFx0XHRcdHNldF9lYWdlcl9lZmZlY3RzX2RlZmVycmVkKCk7XG5cdFx0XHRcdHZhciByZXN1bHQgPSB2YWx1ZS5hcHBseSh0aGlzLCBhcmdzKTtcblx0XHRcdFx0Zmx1c2hfZWFnZXJfZWZmZWN0cygpO1xuXHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdFx0fTtcblx0XHR9XG5cdH0pO1xufVxuIiwiaW1wb3J0ICogYXMgdyBmcm9tICcuLi93YXJuaW5ncy5qcyc7XG5pbXBvcnQgeyBnZXRfcHJveGllZF92YWx1ZSB9IGZyb20gJy4uL3Byb3h5LmpzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRfYXJyYXlfcHJvdG90eXBlX3dhcm5pbmdzKCkge1xuXHRjb25zdCBhcnJheV9wcm90b3R5cGUgPSBBcnJheS5wcm90b3R5cGU7XG5cdC8vIFRoZSBSRVBMIGVuZHMgdXAgaGVyZSBvdmVyIGFuZCBvdmVyLCBhbmQgdGhpcyBwcmV2ZW50cyBpdCBmcm9tIGFkZGluZyBtb3JlIGFuZCBtb3JlIHBhdGNoZXNcblx0Ly8gb2YgdGhlIHNhbWUga2luZCB0byB0aGUgcHJvdG90eXBlLCB3aGljaCB3b3VsZCBzbG93IGRvd24gZXZlcnl0aGluZyBvdmVyIHRpbWUuXG5cdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0Y29uc3QgY2xlYW51cCA9IEFycmF5Ll9fc3ZlbHRlX2NsZWFudXA7XG5cdGlmIChjbGVhbnVwKSB7XG5cdFx0Y2xlYW51cCgpO1xuXHR9XG5cblx0Y29uc3QgeyBpbmRleE9mLCBsYXN0SW5kZXhPZiwgaW5jbHVkZXMgfSA9IGFycmF5X3Byb3RvdHlwZTtcblxuXHRhcnJheV9wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIChpdGVtLCBmcm9tX2luZGV4KSB7XG5cdFx0Y29uc3QgaW5kZXggPSBpbmRleE9mLmNhbGwodGhpcywgaXRlbSwgZnJvbV9pbmRleCk7XG5cblx0XHRpZiAoaW5kZXggPT09IC0xKSB7XG5cdFx0XHRmb3IgKGxldCBpID0gZnJvbV9pbmRleCA/PyAwOyBpIDwgdGhpcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRpZiAoZ2V0X3Byb3hpZWRfdmFsdWUodGhpc1tpXSkgPT09IGl0ZW0pIHtcblx0XHRcdFx0XHR3LnN0YXRlX3Byb3h5X2VxdWFsaXR5X21pc21hdGNoKCdhcnJheS5pbmRleE9mKC4uLiknKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBpbmRleDtcblx0fTtcblxuXHRhcnJheV9wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiAoaXRlbSwgZnJvbV9pbmRleCkge1xuXHRcdC8vIHdlIG5lZWQgdG8gc3BlY2lmeSB0aGlzLmxlbmd0aCAtIDEgYmVjYXVzZSBpdCdzIHByb2JhYmx5IHVzaW5nIHNvbWV0aGluZyBsaWtlXG5cdFx0Ly8gYGFyZ3VtZW50c2AgaW5zaWRlIHNvIHBhc3NpbmcgdW5kZWZpbmVkIGlzIGRpZmZlcmVudCBmcm9tIG5vdCBwYXNzaW5nIGFueXRoaW5nXG5cdFx0Y29uc3QgaW5kZXggPSBsYXN0SW5kZXhPZi5jYWxsKHRoaXMsIGl0ZW0sIGZyb21faW5kZXggPz8gdGhpcy5sZW5ndGggLSAxKTtcblxuXHRcdGlmIChpbmRleCA9PT0gLTEpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDw9IChmcm9tX2luZGV4ID8/IHRoaXMubGVuZ3RoIC0gMSk7IGkgKz0gMSkge1xuXHRcdFx0XHRpZiAoZ2V0X3Byb3hpZWRfdmFsdWUodGhpc1tpXSkgPT09IGl0ZW0pIHtcblx0XHRcdFx0XHR3LnN0YXRlX3Byb3h5X2VxdWFsaXR5X21pc21hdGNoKCdhcnJheS5sYXN0SW5kZXhPZiguLi4pJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gaW5kZXg7XG5cdH07XG5cblx0YXJyYXlfcHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24gKGl0ZW0sIGZyb21faW5kZXgpIHtcblx0XHRjb25zdCBoYXMgPSBpbmNsdWRlcy5jYWxsKHRoaXMsIGl0ZW0sIGZyb21faW5kZXgpO1xuXG5cdFx0aWYgKCFoYXMpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRpZiAoZ2V0X3Byb3hpZWRfdmFsdWUodGhpc1tpXSkgPT09IGl0ZW0pIHtcblx0XHRcdFx0XHR3LnN0YXRlX3Byb3h5X2VxdWFsaXR5X21pc21hdGNoKCdhcnJheS5pbmNsdWRlcyguLi4pJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gaGFzO1xuXHR9O1xuXG5cdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0QXJyYXkuX19zdmVsdGVfY2xlYW51cCA9ICgpID0+IHtcblx0XHRhcnJheV9wcm90b3R5cGUuaW5kZXhPZiA9IGluZGV4T2Y7XG5cdFx0YXJyYXlfcHJvdG90eXBlLmxhc3RJbmRleE9mID0gbGFzdEluZGV4T2Y7XG5cdFx0YXJyYXlfcHJvdG90eXBlLmluY2x1ZGVzID0gaW5jbHVkZXM7XG5cdH07XG59XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IGFcbiAqIEBwYXJhbSB7YW55fSBiXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGVxdWFsXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmljdF9lcXVhbHMoYSwgYiwgZXF1YWwgPSB0cnVlKSB7XG5cdC8vIHRyeS1jYXRjaCBuZWVkZWQgYmVjYXVzZSB0aGlzIHRyaWVzIHRvIHJlYWQgcHJvcGVydGllcyBvZiBgYWAgYW5kIGBiYCxcblx0Ly8gd2hpY2ggY291bGQgYmUgZGlzYWxsb3dlZCBmb3IgZXhhbXBsZSBpbiBhIHNlY3VyZSBjb250ZXh0XG5cdHRyeSB7XG5cdFx0aWYgKChhID09PSBiKSAhPT0gKGdldF9wcm94aWVkX3ZhbHVlKGEpID09PSBnZXRfcHJveGllZF92YWx1ZShiKSkpIHtcblx0XHRcdHcuc3RhdGVfcHJveHlfZXF1YWxpdHlfbWlzbWF0Y2goZXF1YWwgPyAnPT09JyA6ICchPT0nKTtcblx0XHR9XG5cdH0gY2F0Y2gge31cblxuXHRyZXR1cm4gKGEgPT09IGIpID09PSBlcXVhbDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gYVxuICogQHBhcmFtIHthbnl9IGJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZXF1YWxcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxzKGEsIGIsIGVxdWFsID0gdHJ1ZSkge1xuXHRpZiAoKGEgPT0gYikgIT09IChnZXRfcHJveGllZF92YWx1ZShhKSA9PSBnZXRfcHJveGllZF92YWx1ZShiKSkpIHtcblx0XHR3LnN0YXRlX3Byb3h5X2VxdWFsaXR5X21pc21hdGNoKGVxdWFsID8gJz09JyA6ICchPScpO1xuXHR9XG5cblx0cmV0dXJuIChhID09IGIpID09PSBlcXVhbDtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgRWZmZWN0LCBUZW1wbGF0ZU5vZGUgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgaHlkcmF0ZV9ub2RlLCBoeWRyYXRpbmcsIHJlc2V0LCBzZXRfaHlkcmF0ZV9ub2RlIH0gZnJvbSAnLi9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgREVWIH0gZnJvbSAnZXNtLWVudic7XG5pbXBvcnQgeyBpbml0X2FycmF5X3Byb3RvdHlwZV93YXJuaW5ncyB9IGZyb20gJy4uL2Rldi9lcXVhbGl0eS5qcyc7XG5pbXBvcnQgeyBnZXRfZGVzY3JpcHRvciwgaXNfZXh0ZW5zaWJsZSB9IGZyb20gJy4uLy4uL3NoYXJlZC91dGlscy5qcyc7XG5pbXBvcnQgeyBhY3RpdmVfZWZmZWN0IH0gZnJvbSAnLi4vcnVudGltZS5qcyc7XG5pbXBvcnQgeyBhc3luY19tb2RlX2ZsYWcgfSBmcm9tICcuLi8uLi9mbGFncy9pbmRleC5qcyc7XG5pbXBvcnQge1xuXHRBVFRSSUJVVEVTX0NBQ0hFLFxuXHRDTEFTU19DQUNIRSxcblx0UkVBQ1RJT05fUkFOLFxuXHRTVFlMRV9DQUNIRSxcblx0VEVYVF9DQUNIRSxcblx0VEVYVF9OT0RFXG59IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcbmltcG9ydCB7IGVhZ2VyX2Jsb2NrX2VmZmVjdHMgfSBmcm9tICcuLi9yZWFjdGl2aXR5L2JhdGNoLmpzJztcbmltcG9ydCB7IE5BTUVTUEFDRV9IVE1MIH0gZnJvbSAnLi4vLi4vLi4vY29uc3RhbnRzLmpzJztcblxuLy8gZXhwb3J0IHRoZXNlIGZvciByZWZlcmVuY2UgaW4gdGhlIGNvbXBpbGVkIGNvZGUsIG1ha2luZyBnbG9iYWwgbmFtZSBkZWR1cGxpY2F0aW9uIHVubmVjZXNzYXJ5XG4vKiogQHR5cGUge1dpbmRvd30gKi9cbmV4cG9ydCB2YXIgJHdpbmRvdztcblxuLyoqIEB0eXBlIHtEb2N1bWVudH0gKi9cbmV4cG9ydCB2YXIgJGRvY3VtZW50O1xuXG4vKiogQHR5cGUge2Jvb2xlYW59ICovXG5leHBvcnQgdmFyIGlzX2ZpcmVmb3g7XG5cbi8qKiBAdHlwZSB7KCkgPT4gTm9kZSB8IG51bGx9ICovXG52YXIgZmlyc3RfY2hpbGRfZ2V0dGVyO1xuLyoqIEB0eXBlIHsoKSA9PiBOb2RlIHwgbnVsbH0gKi9cbnZhciBuZXh0X3NpYmxpbmdfZ2V0dGVyO1xuXG4vKipcbiAqIEluaXRpYWxpemUgdGhlc2UgbGF6aWx5IHRvIGF2b2lkIGlzc3VlcyB3aGVuIHVzaW5nIHRoZSBydW50aW1lIGluIGEgc2VydmVyIGNvbnRleHRcbiAqIHdoZXJlIHRoZXNlIGdsb2JhbHMgYXJlIG5vdCBhdmFpbGFibGUgd2hpbGUgYXZvaWRpbmcgYSBzZXBhcmF0ZSBzZXJ2ZXIgZW50cnkgcG9pbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRfb3BlcmF0aW9ucygpIHtcblx0aWYgKCR3aW5kb3cgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdCR3aW5kb3cgPSB3aW5kb3c7XG5cdCRkb2N1bWVudCA9IGRvY3VtZW50O1xuXHRpc19maXJlZm94ID0gL0ZpcmVmb3gvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cblx0dmFyIGVsZW1lbnRfcHJvdG90eXBlID0gRWxlbWVudC5wcm90b3R5cGU7XG5cdHZhciBub2RlX3Byb3RvdHlwZSA9IE5vZGUucHJvdG90eXBlO1xuXHR2YXIgdGV4dF9wcm90b3R5cGUgPSBUZXh0LnByb3RvdHlwZTtcblxuXHQvLyBAdHMtaWdub3JlXG5cdGZpcnN0X2NoaWxkX2dldHRlciA9IGdldF9kZXNjcmlwdG9yKG5vZGVfcHJvdG90eXBlLCAnZmlyc3RDaGlsZCcpLmdldDtcblx0Ly8gQHRzLWlnbm9yZVxuXHRuZXh0X3NpYmxpbmdfZ2V0dGVyID0gZ2V0X2Rlc2NyaXB0b3Iobm9kZV9wcm90b3R5cGUsICduZXh0U2libGluZycpLmdldDtcblxuXHRpZiAoaXNfZXh0ZW5zaWJsZShlbGVtZW50X3Byb3RvdHlwZSkpIHtcblx0XHQvLyB0aGUgZm9sbG93aW5nIGFzc2lnbm1lbnRzIGltcHJvdmUgcGVyZiBvZiBsb29rdXBzIG9uIERPTSBub2Rlc1xuXHRcdC8qKiBAdHlwZSB7YW55fSAqLyAoZWxlbWVudF9wcm90b3R5cGUpW0NMQVNTX0NBQ0hFXSA9IHVuZGVmaW5lZDtcblx0XHQvKiogQHR5cGUge2FueX0gKi8gKGVsZW1lbnRfcHJvdG90eXBlKVtBVFRSSUJVVEVTX0NBQ0hFXSA9IG51bGw7XG5cdFx0LyoqIEB0eXBlIHthbnl9ICovIChlbGVtZW50X3Byb3RvdHlwZSlbU1RZTEVfQ0FDSEVdID0gdW5kZWZpbmVkO1xuXHRcdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0XHRlbGVtZW50X3Byb3RvdHlwZS5fX2UgPSB1bmRlZmluZWQ7XG5cdH1cblxuXHRpZiAoaXNfZXh0ZW5zaWJsZSh0ZXh0X3Byb3RvdHlwZSkpIHtcblx0XHQvKiogQHR5cGUge2FueX0gKi8gKHRleHRfcHJvdG90eXBlKVtURVhUX0NBQ0hFXSA9IHVuZGVmaW5lZDtcblx0fVxuXG5cdGlmIChERVYpIHtcblx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0ZWxlbWVudF9wcm90b3R5cGUuX19zdmVsdGVfbWV0YSA9IG51bGw7XG5cblx0XHRpbml0X2FycmF5X3Byb3RvdHlwZV93YXJuaW5ncygpO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7VGV4dH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZV90ZXh0KHZhbHVlID0gJycpIHtcblx0cmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUge05vZGV9IE5cbiAqIEBwYXJhbSB7Tn0gbm9kZVxuICovXG4vKkBfX05PX1NJREVfRUZGRUNUU19fKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRfZmlyc3RfY2hpbGQobm9kZSkge1xuXHRyZXR1cm4gLyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGUgfCBudWxsfSAqLyAoZmlyc3RfY2hpbGRfZ2V0dGVyLmNhbGwobm9kZSkpO1xufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7Tm9kZX0gTlxuICogQHBhcmFtIHtOfSBub2RlXG4gKi9cbi8qQF9fTk9fU0lERV9FRkZFQ1RTX18qL1xuZXhwb3J0IGZ1bmN0aW9uIGdldF9uZXh0X3NpYmxpbmcobm9kZSkge1xuXHRyZXR1cm4gLyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGUgfCBudWxsfSAqLyAobmV4dF9zaWJsaW5nX2dldHRlci5jYWxsKG5vZGUpKTtcbn1cblxuLyoqXG4gKiBEb24ndCBtYXJrIHRoaXMgYXMgc2lkZS1lZmZlY3QtZnJlZSwgaHlkcmF0aW9uIG5lZWRzIHRvIHdhbGsgYWxsIG5vZGVzXG4gKiBAdGVtcGxhdGUge05vZGV9IE5cbiAqIEBwYXJhbSB7Tn0gbm9kZVxuICogQHBhcmFtIHtib29sZWFufSBpc190ZXh0XG4gKiBAcmV0dXJucyB7VGVtcGxhdGVOb2RlIHwgbnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoaWxkKG5vZGUsIGlzX3RleHQpIHtcblx0aWYgKCFoeWRyYXRpbmcpIHtcblx0XHRyZXR1cm4gZ2V0X2ZpcnN0X2NoaWxkKG5vZGUpO1xuXHR9XG5cblx0dmFyIGNoaWxkID0gZ2V0X2ZpcnN0X2NoaWxkKGh5ZHJhdGVfbm9kZSk7XG5cblx0Ly8gQ2hpbGQgY2FuIGJlIG51bGwgaWYgd2UgaGF2ZSBhbiBlbGVtZW50IHdpdGggYSBzaW5nbGUgY2hpbGQsIGxpa2UgYDxwPnt0ZXh0fTwvcD5gLCB3aGVyZSBgdGV4dGAgaXMgZW1wdHlcblx0aWYgKGNoaWxkID09PSBudWxsKSB7XG5cdFx0Y2hpbGQgPSBoeWRyYXRlX25vZGUuYXBwZW5kQ2hpbGQoY3JlYXRlX3RleHQoKSk7XG5cdH0gZWxzZSBpZiAoaXNfdGV4dCAmJiBjaGlsZC5ub2RlVHlwZSAhPT0gVEVYVF9OT0RFKSB7XG5cdFx0dmFyIHRleHQgPSBjcmVhdGVfdGV4dCgpO1xuXHRcdGNoaWxkPy5iZWZvcmUodGV4dCk7XG5cdFx0c2V0X2h5ZHJhdGVfbm9kZSh0ZXh0KTtcblx0XHRyZXR1cm4gdGV4dDtcblx0fVxuXG5cdGlmIChpc190ZXh0KSB7XG5cdFx0bWVyZ2VfdGV4dF9ub2RlcygvKiogQHR5cGUge1RleHR9ICovIChjaGlsZCkpO1xuXHR9XG5cblx0c2V0X2h5ZHJhdGVfbm9kZShjaGlsZCk7XG5cdHJldHVybiBjaGlsZDtcbn1cblxuLyoqXG4gKiBEb24ndCBtYXJrIHRoaXMgYXMgc2lkZS1lZmZlY3QtZnJlZSwgaHlkcmF0aW9uIG5lZWRzIHRvIHdhbGsgYWxsIG5vZGVzXG4gKiBAcGFyYW0ge1RlbXBsYXRlTm9kZX0gbm9kZVxuICogQHBhcmFtIHtib29sZWFufSBbaXNfdGV4dF1cbiAqIEByZXR1cm5zIHtUZW1wbGF0ZU5vZGUgfCBudWxsfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmlyc3RfY2hpbGQobm9kZSwgaXNfdGV4dCA9IGZhbHNlKSB7XG5cdGlmICghaHlkcmF0aW5nKSB7XG5cdFx0dmFyIGZpcnN0ID0gZ2V0X2ZpcnN0X2NoaWxkKG5vZGUpO1xuXG5cdFx0Ly8gVE9ETyBwcmV2ZW50IHVzZXIgY29tbWVudHMgd2l0aCB0aGUgZW1wdHkgc3RyaW5nIHdoZW4gcHJlc2VydmVDb21tZW50cyBpcyB0cnVlXG5cdFx0aWYgKGZpcnN0IGluc3RhbmNlb2YgQ29tbWVudCAmJiBmaXJzdC5kYXRhID09PSAnJykgcmV0dXJuIGdldF9uZXh0X3NpYmxpbmcoZmlyc3QpO1xuXG5cdFx0cmV0dXJuIGZpcnN0O1xuXHR9XG5cblx0aWYgKGlzX3RleHQpIHtcblx0XHQvLyBpZiBhbiB7ZXhwcmVzc2lvbn0gaXMgZW1wdHkgZHVyaW5nIFNTUiwgdGhlcmUgbWlnaHQgYmUgbm9cblx0XHQvLyB0ZXh0IG5vZGUgdG8gaHlkcmF0ZSDigJQgd2UgbXVzdCB0aGVyZWZvcmUgY3JlYXRlIG9uZVxuXHRcdGlmIChoeWRyYXRlX25vZGU/Lm5vZGVUeXBlICE9PSBURVhUX05PREUpIHtcblx0XHRcdHZhciB0ZXh0ID0gY3JlYXRlX3RleHQoKTtcblxuXHRcdFx0aHlkcmF0ZV9ub2RlPy5iZWZvcmUodGV4dCk7XG5cdFx0XHRzZXRfaHlkcmF0ZV9ub2RlKHRleHQpO1xuXHRcdFx0cmV0dXJuIHRleHQ7XG5cdFx0fVxuXG5cdFx0bWVyZ2VfdGV4dF9ub2RlcygvKiogQHR5cGUge1RleHR9ICovIChoeWRyYXRlX25vZGUpKTtcblx0fVxuXG5cdHJldHVybiBoeWRyYXRlX25vZGU7XG59XG5cbi8qKlxuICogYGNoaWxkYCwgZm9yIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIG9mIGFuIGVsZW1lbnQgd2l0aCBleGFjdGx5IG9uZSBjaGlsZC4gUmVzZXR0aW5nIHRoZVxuICogaHlkcmF0aW9uIGN1cnNvciBpcyBwYXJ0IG9mIHRoZSBzYW1lIHN0ZXAsIHNvIHRoZSBjb21waWxlciBkb2Vzbid0IGhhdmUgdG8gZW1pdCBhXG4gKiBzZXBhcmF0ZSBgcmVzZXRgIGNhbGwgZm9yIGV2ZXJ5IGA8cD57dGV4dH08L3A+YCBpbiBhbiBhcHAuXG4gKiBEb24ndCBtYXJrIHRoaXMgYXMgc2lkZS1lZmZlY3QtZnJlZSwgaHlkcmF0aW9uIG5lZWRzIHRvIHdhbGsgYWxsIG5vZGVzXG4gKiBAcGFyYW0ge1RlbXBsYXRlTm9kZX0gbm9kZVxuICogQHBhcmFtIHtib29sZWFufSBbaXNfdGV4dF1cbiAqIEByZXR1cm5zIHtUZW1wbGF0ZU5vZGUgfCBudWxsfVxuICovXG5leHBvcnQgZnVuY3Rpb24gb25seV9jaGlsZChub2RlLCBpc190ZXh0ID0gZmFsc2UpIHtcblx0aWYgKCFoeWRyYXRpbmcpIHtcblx0XHRyZXR1cm4gZ2V0X2ZpcnN0X2NoaWxkKG5vZGUpO1xuXHR9XG5cblx0dmFyIGZpcnN0ID0gY2hpbGQobm9kZSwgaXNfdGV4dCk7XG5cdHJlc2V0KG5vZGUpO1xuXG5cdHJldHVybiBmaXJzdDtcbn1cblxuLyoqXG4gKiBEb24ndCBtYXJrIHRoaXMgYXMgc2lkZS1lZmZlY3QtZnJlZSwgaHlkcmF0aW9uIG5lZWRzIHRvIHdhbGsgYWxsIG5vZGVzXG4gKiBAcGFyYW0ge1RlbXBsYXRlTm9kZX0gbm9kZVxuICogQHBhcmFtIHtudW1iZXJ9IGNvdW50XG4gKiBAcGFyYW0ge2Jvb2xlYW59IGlzX3RleHRcbiAqIEByZXR1cm5zIHtUZW1wbGF0ZU5vZGUgfCBudWxsfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2libGluZyhub2RlLCBjb3VudCA9IDEsIGlzX3RleHQgPSBmYWxzZSkge1xuXHRsZXQgbmV4dF9zaWJsaW5nID0gaHlkcmF0aW5nID8gaHlkcmF0ZV9ub2RlIDogbm9kZTtcblx0dmFyIGxhc3Rfc2libGluZztcblxuXHR3aGlsZSAoY291bnQtLSkge1xuXHRcdGxhc3Rfc2libGluZyA9IG5leHRfc2libGluZztcblx0XHRuZXh0X3NpYmxpbmcgPSAvKiogQHR5cGUge1RlbXBsYXRlTm9kZX0gKi8gKGdldF9uZXh0X3NpYmxpbmcobmV4dF9zaWJsaW5nKSk7XG5cdH1cblxuXHRpZiAoIWh5ZHJhdGluZykge1xuXHRcdHJldHVybiBuZXh0X3NpYmxpbmc7XG5cdH1cblxuXHRpZiAoaXNfdGV4dCkge1xuXHRcdC8vIGlmIGEgc2libGluZyB7ZXhwcmVzc2lvbn0gaXMgZW1wdHkgZHVyaW5nIFNTUiwgdGhlcmUgbWlnaHQgYmUgbm9cblx0XHQvLyB0ZXh0IG5vZGUgdG8gaHlkcmF0ZSDigJQgd2UgbXVzdCB0aGVyZWZvcmUgY3JlYXRlIG9uZVxuXHRcdGlmIChuZXh0X3NpYmxpbmc/Lm5vZGVUeXBlICE9PSBURVhUX05PREUpIHtcblx0XHRcdHZhciB0ZXh0ID0gY3JlYXRlX3RleHQoKTtcblx0XHRcdC8vIElmIHRoZSBuZXh0IHNpYmxpbmcgaXMgYG51bGxgIGFuZCB3ZSdyZSBoYW5kbGluZyB0ZXh0IHRoZW4gaXQncyBiZWNhdXNlXG5cdFx0XHQvLyB0aGUgU1NSIGNvbnRlbnQgd2FzIGVtcHR5IGZvciB0aGUgdGV4dCwgc28gd2UgbmVlZCB0byBnZW5lcmF0ZSBhIG5ldyB0ZXh0XG5cdFx0XHQvLyBub2RlIGFuZCBpbnNlcnQgaXQgYWZ0ZXIgdGhlIGxhc3Qgc2libGluZ1xuXHRcdFx0aWYgKG5leHRfc2libGluZyA9PT0gbnVsbCkge1xuXHRcdFx0XHRsYXN0X3NpYmxpbmc/LmFmdGVyKHRleHQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bmV4dF9zaWJsaW5nLmJlZm9yZSh0ZXh0KTtcblx0XHRcdH1cblx0XHRcdHNldF9oeWRyYXRlX25vZGUodGV4dCk7XG5cdFx0XHRyZXR1cm4gdGV4dDtcblx0XHR9XG5cblx0XHRtZXJnZV90ZXh0X25vZGVzKC8qKiBAdHlwZSB7VGV4dH0gKi8gKG5leHRfc2libGluZykpO1xuXHR9XG5cblx0c2V0X2h5ZHJhdGVfbm9kZShuZXh0X3NpYmxpbmcpO1xuXHRyZXR1cm4gbmV4dF9zaWJsaW5nO1xufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7Tm9kZX0gTlxuICogQHBhcmFtIHtOfSBub2RlXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyX3RleHRfY29udGVudChub2RlKSB7XG5cdG5vZGUudGV4dENvbnRlbnQgPSAnJztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGB0cnVlYCBpZiB3ZSdyZSB1cGRhdGluZyB0aGUgY3VycmVudCBibG9jaywgZm9yIGV4YW1wbGUgYGNvbmRpdGlvbmAgaW5cbiAqIGFuIGB7I2lmIGNvbmRpdGlvbn1gIGJsb2NrIGp1c3QgY2hhbmdlZC4gSW4gdGhpcyBjYXNlLCB0aGUgYnJhbmNoIHNob3VsZCBiZVxuICogYXBwZW5kZWQgKG9yIHJlbW92ZWQpIGF0IHRoZSBzYW1lIHRpbWUgYXMgb3RoZXIgdXBkYXRlcyB3aXRoaW4gdGhlXG4gKiBjdXJyZW50IGA8c3ZlbHRlOmJvdW5kYXJ5PmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZF9kZWZlcl9hcHBlbmQoKSB7XG5cdGlmICghYXN5bmNfbW9kZV9mbGFnKSByZXR1cm4gZmFsc2U7XG5cdGlmIChlYWdlcl9ibG9ja19lZmZlY3RzICE9PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cblx0dmFyIGZsYWdzID0gLyoqIEB0eXBlIHtFZmZlY3R9ICovIChhY3RpdmVfZWZmZWN0KS5mO1xuXHRyZXR1cm4gKGZsYWdzICYgUkVBQ1RJT05fUkFOKSAhPT0gMDtcbn1cblxuLyoqXG4gKiBCcmFuY2hpbmcgaGVyZSBpcyBpbnRlbnRpb25hbCBhbmQgbG9hZC1iZWFyaW5nIGZvciBwZXJmLiBgY3JlYXRlRWxlbWVudCh0YWcpYFxuICogaGl0cyBhIGZhc3QgcGF0aCBpbiBCbGluayB0aGF0IGBjcmVhdGVFbGVtZW50TlMoTkFNRVNQQUNFX0hUTUwsIHRhZylgIGRvZXNuJ3QsXG4gKiBhbmQgcGFzc2luZyBhbiBleHBsaWNpdCBgdW5kZWZpbmVkYCBhcyB0aGUgdHJhaWxpbmcgb3B0aW9ucyBhcmcgbWVhc3VyYWJseVxuICogc2xvd3MgYm90aCBBUElzLiBGdW5uZWxsaW5nIGV2ZXJ5IGNhc2UgdGhyb3VnaCBhIHNpbmdsZSBgY3JlYXRlRWxlbWVudE5TKG5zLFxuICogdGFnLCBvcHRpb25zKWAgY2FsbCB3b3VsZCBiZSBzbWFsbGVyIGJ1dCBzbG93ZXIgb24gdGhlIEhUTUwgcGF0aC5cbiAqXG4gKiBAdGVtcGxhdGUge2tleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcCB8IHN0cmluZ30gVFxuICogQHBhcmFtIHtUfSB0YWdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbbmFtZXNwYWNlXVxuICogQHBhcmFtIHtzdHJpbmd9IFtpc11cbiAqIEByZXR1cm5zIHtUIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwID8gSFRNTEVsZW1lbnRUYWdOYW1lTWFwW1RdIDogRWxlbWVudH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZV9lbGVtZW50KHRhZywgbmFtZXNwYWNlLCBpcykge1xuXHRpZiAobmFtZXNwYWNlID09IG51bGwgfHwgbmFtZXNwYWNlID09PSBOQU1FU1BBQ0VfSFRNTCkge1xuXHRcdHJldHVybiAvKiogQHR5cGUge1QgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXAgPyBIVE1MRWxlbWVudFRhZ05hbWVNYXBbVF0gOiBFbGVtZW50fSAqLyAoXG5cdFx0XHRpcyA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnLCB7IGlzIH0pIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpXG5cdFx0KTtcblx0fVxuXHRyZXR1cm4gLyoqIEB0eXBlIHtUIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwID8gSFRNTEVsZW1lbnRUYWdOYW1lTWFwW1RdIDogRWxlbWVudH0gKi8gKFxuXHRcdGlzID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnLCB7IGlzIH0pIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnKVxuXHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlX2ZyYWdtZW50KCkge1xuXHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlX2NvbW1lbnQoZGF0YSA9ICcnKSB7XG5cdHJldHVybiBkb2N1bWVudC5jcmVhdGVDb21tZW50KGRhdGEpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZShlbGVtZW50LCBrZXksIHZhbHVlID0gJycpIHtcblx0aWYgKGtleS5zdGFydHNXaXRoKCd4bGluazonKSkge1xuXHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBrZXksIHZhbHVlKTtcblx0XHRyZXR1cm47XG5cdH1cblx0cmV0dXJuIGVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xufVxuXG4vKipcbiAqIEJyb3dzZXJzIHNwbGl0IHRleHQgbm9kZXMgbGFyZ2VyIHRoYW4gNjU1MzYgYnl0ZXMgd2hlbiBwYXJzaW5nLlxuICogRm9yIGh5ZHJhdGlvbiB0byBzdWNjZWVkLCB3ZSBuZWVkIHRvIHN0aXRjaCB0aGVtIGJhY2sgdG9nZXRoZXJcbiAqIEBwYXJhbSB7VGV4dH0gdGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VfdGV4dF9ub2Rlcyh0ZXh0KSB7XG5cdGlmICgvKiogQHR5cGUge3N0cmluZ30gKi8gKHRleHQubm9kZVZhbHVlKS5sZW5ndGggPCA2NTUzNikge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGxldCBuZXh0ID0gdGV4dC5uZXh0U2libGluZztcblxuXHR3aGlsZSAobmV4dCAhPT0gbnVsbCAmJiBuZXh0Lm5vZGVUeXBlID09PSBURVhUX05PREUpIHtcblx0XHRuZXh0LnJlbW92ZSgpO1xuXG5cdFx0LyoqIEB0eXBlIHtzdHJpbmd9ICovICh0ZXh0Lm5vZGVWYWx1ZSkgKz0gLyoqIEB0eXBlIHtzdHJpbmd9ICovIChuZXh0Lm5vZGVWYWx1ZSk7XG5cblx0XHRuZXh0ID0gdGV4dC5uZXh0U2libGluZztcblx0fVxufVxuIiwiLyoqIEBpbXBvcnQgeyBEZXJpdmVkLCBFZmZlY3QgfSBmcm9tICcjY2xpZW50JyAqL1xuLyoqIEBpbXBvcnQgeyBCb3VuZGFyeSB9IGZyb20gJy4vZG9tL2Jsb2Nrcy9ib3VuZGFyeS5qcycgKi9cbmltcG9ydCB7IERFViB9IGZyb20gJ2VzbS1lbnYnO1xuaW1wb3J0IHsgRklMRU5BTUUsIEhZRFJBVElPTl9FUlJPUiB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBpc19maXJlZm94IH0gZnJvbSAnLi9kb20vb3BlcmF0aW9ucy5qcyc7XG5pbXBvcnQge1xuXHRFUlJPUl9WQUxVRSxcblx0Qk9VTkRBUllfRUZGRUNULFxuXHRSRUFDVElPTl9SQU4sXG5cdEVGRkVDVCxcblx0REVTVFJPWUVELFxuXHRERVNUUk9ZSU5HXG59IGZyb20gJy4vY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IGRlZmluZV9wcm9wZXJ0eSwgZ2V0X2Rlc2NyaXB0b3IgfSBmcm9tICcuLi9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0IHsgYWN0aXZlX2VmZmVjdCwgYWN0aXZlX3JlYWN0aW9uIH0gZnJvbSAnLi9ydW50aW1lLmpzJztcblxuY29uc3QgYWRqdXN0bWVudHMgPSBuZXcgV2Vha01hcCgpO1xuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gZXJyb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZV9lcnJvcihlcnJvcikge1xuXHR2YXIgZWZmZWN0ID0gYWN0aXZlX2VmZmVjdDtcblxuXHQvLyBmb3IgdW5vd25lZCBkZXJpdmVkcywgZG9uJ3QgdGhyb3cgdW50aWwgd2UgcmVhZCB0aGUgdmFsdWVcblx0aWYgKGVmZmVjdCA9PT0gbnVsbCkge1xuXHRcdC8qKiBAdHlwZSB7RGVyaXZlZH0gKi8gKGFjdGl2ZV9yZWFjdGlvbikuZiB8PSBFUlJPUl9WQUxVRTtcblx0XHRyZXR1cm4gZXJyb3I7XG5cdH1cblxuXHRpZiAoREVWICYmIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgIWFkanVzdG1lbnRzLmhhcyhlcnJvcikpIHtcblx0XHRhZGp1c3RtZW50cy5zZXQoZXJyb3IsIGdldF9hZGp1c3RtZW50cyhlcnJvciwgZWZmZWN0KSk7XG5cdH1cblxuXHQvLyBpZiB0aGUgZXJyb3Igb2NjdXJyZWQgd2hpbGUgY3JlYXRpbmcgdGhpcyBzdWJ0cmVlLCB3ZSBsZXQgaXRcblx0Ly8gYnViYmxlIHVwIHVudGlsIGl0IGhpdHMgYSBib3VuZGFyeSB0aGF0IGNhbiBoYW5kbGUgaXQsIHVubGVzc1xuXHQvLyBpdCdzIGFuICRlZmZlY3QgaW4gd2hpY2ggY2FzZSBpdCBkb2Vzbid0IHJ1biBpbW1lZGlhdGVseVxuXHRpZiAoKGVmZmVjdC5mICYgUkVBQ1RJT05fUkFOKSA9PT0gMCAmJiAoZWZmZWN0LmYgJiBFRkZFQ1QpID09PSAwKSB7XG5cdFx0aWYgKERFViAmJiAhZWZmZWN0LnBhcmVudCAmJiBlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG5cdFx0XHRhcHBseV9hZGp1c3RtZW50cyhlcnJvcik7XG5cdFx0fVxuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH1cblxuXHQvLyBvdGhlcndpc2Ugd2UgYnViYmxlIHVwIHRoZSBlZmZlY3QgdHJlZSBvdXJzZWx2ZXNcblx0aW52b2tlX2Vycm9yX2JvdW5kYXJ5KGVycm9yLCBlZmZlY3QpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gZXJyb3JcbiAqIEBwYXJhbSB7RWZmZWN0IHwgbnVsbH0gZWZmZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZva2VfZXJyb3JfYm91bmRhcnkoZXJyb3IsIGVmZmVjdCkge1xuXHRpZiAoZXJyb3IgPT09IEhZRFJBVElPTl9FUlJPUikge1xuXHRcdHRocm93IGVycm9yO1xuXHR9XG5cblx0aWYgKGVmZmVjdCAhPT0gbnVsbCAmJiAoZWZmZWN0LmYgJiBERVNUUk9ZRUQpICE9PSAwKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0d2hpbGUgKGVmZmVjdCAhPT0gbnVsbCkge1xuXHRcdC8vIFNraXAgYm91bmRhcmllcyB0aGF0IGFyZSBkZXN0cm95ZWQvZGVzdHJveWluZyBhbmQgY2Fubm90IG1lYW5pbmdmdWxseSBoYW5kbGUgdGhlIGVycm9yLlxuXHRcdGlmICgoZWZmZWN0LmYgJiBCT1VOREFSWV9FRkZFQ1QpICE9PSAwICYmIChlZmZlY3QuZiAmIChERVNUUk9ZRUQgfCBERVNUUk9ZSU5HKSkgPT09IDApIHtcblx0XHRcdGlmICgoZWZmZWN0LmYgJiBSRUFDVElPTl9SQU4pID09PSAwKSB7XG5cdFx0XHRcdC8vIHdlIGFyZSBzdGlsbCBjcmVhdGluZyB0aGUgYm91bmRhcnkgZWZmZWN0XG5cdFx0XHRcdHRocm93IGVycm9yO1xuXHRcdFx0fVxuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHQvKiogQHR5cGUge0JvdW5kYXJ5fSAqLyAoZWZmZWN0LmIpLmVycm9yKGVycm9yKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRlcnJvciA9IGU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZWZmZWN0ID0gZWZmZWN0LnBhcmVudDtcblx0fVxuXG5cdGlmIChERVYgJiYgZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdGFwcGx5X2FkanVzdG1lbnRzKGVycm9yKTtcblx0fVxuXG5cdHRocm93IGVycm9yO1xufVxuXG4vKipcbiAqIEFkZCB1c2VmdWwgaW5mb3JtYXRpb24gdG8gdGhlIGVycm9yIG1lc3NhZ2Uvc3RhY2sgaW4gZGV2ZWxvcG1lbnRcbiAqIEBwYXJhbSB7RXJyb3J9IGVycm9yXG4gKiBAcGFyYW0ge0VmZmVjdH0gZWZmZWN0XG4gKi9cbmZ1bmN0aW9uIGdldF9hZGp1c3RtZW50cyhlcnJvciwgZWZmZWN0KSB7XG5cdGNvbnN0IG1lc3NhZ2VfZGVzY3JpcHRvciA9IGdldF9kZXNjcmlwdG9yKGVycm9yLCAnbWVzc2FnZScpO1xuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIHdhcyBhbHJlYWR5IGNoYW5nZWQgYW5kIGl0J3Mgbm90IGNvbmZpZ3VyYWJsZSB3ZSBjYW4ndCBjaGFuZ2UgaXRcblx0Ly8gb3IgaXQgd2lsbCB0aHJvdyBhIGRpZmZlcmVudCBlcnJvciBzd2FsbG93aW5nIHRoZSBvcmlnaW5hbCBlcnJvclxuXHRpZiAobWVzc2FnZV9kZXNjcmlwdG9yICYmICFtZXNzYWdlX2Rlc2NyaXB0b3IuY29uZmlndXJhYmxlKSByZXR1cm47XG5cblx0dmFyIGluZGVudCA9IGlzX2ZpcmVmb3ggPyAnICAnIDogJ1xcdCc7XG5cdHZhciBjb21wb25lbnRfc3RhY2sgPSBgXFxuJHtpbmRlbnR9aW4gJHtlZmZlY3QuZm4/Lm5hbWUgfHwgJzx1bmtub3duPid9YDtcblx0dmFyIGNvbnRleHQgPSBlZmZlY3QuY3R4O1xuXG5cdHdoaWxlIChjb250ZXh0ICE9PSBudWxsKSB7XG5cdFx0Y29tcG9uZW50X3N0YWNrICs9IGBcXG4ke2luZGVudH1pbiAke2NvbnRleHQuZnVuY3Rpb24/LltGSUxFTkFNRV0uc3BsaXQoJy8nKS5wb3AoKX1gO1xuXHRcdGNvbnRleHQgPSBjb250ZXh0LnA7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgKyBgXFxuJHtjb21wb25lbnRfc3RhY2t9XFxuYCxcblx0XHRzdGFjazogZXJyb3Iuc3RhY2tcblx0XHRcdD8uc3BsaXQoJ1xcbicpXG5cdFx0XHQuZmlsdGVyKChsaW5lKSA9PiAhbGluZS5pbmNsdWRlcygnc3ZlbHRlL3NyYy9pbnRlcm5hbCcpKVxuXHRcdFx0LmpvaW4oJ1xcbicpXG5cdH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtFcnJvcn0gZXJyb3JcbiAqL1xuZnVuY3Rpb24gYXBwbHlfYWRqdXN0bWVudHMoZXJyb3IpIHtcblx0Y29uc3QgYWRqdXN0ZWQgPSBhZGp1c3RtZW50cy5nZXQoZXJyb3IpO1xuXG5cdGlmIChhZGp1c3RlZCkge1xuXHRcdGRlZmluZV9wcm9wZXJ0eShlcnJvciwgJ21lc3NhZ2UnLCB7XG5cdFx0XHR2YWx1ZTogYWRqdXN0ZWQubWVzc2FnZVxuXHRcdH0pO1xuXG5cdFx0ZGVmaW5lX3Byb3BlcnR5KGVycm9yLCAnc3RhY2snLCB7XG5cdFx0XHR2YWx1ZTogYWRqdXN0ZWQuc3RhY2tcblx0XHR9KTtcblx0fVxufVxuIiwiLyoqIEBpbXBvcnQgeyBCbG9ja2VyLCBDb21wb25lbnRDb250ZXh0LCBDb21wb25lbnRDb250ZXh0TGVnYWN5LCBEZXJpdmVkLCBFZmZlY3QsIFRlbXBsYXRlTm9kZSwgVHJhbnNpdGlvbk1hbmFnZXIgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHtcblx0aXNfZGlydHksXG5cdGFjdGl2ZV9lZmZlY3QsXG5cdGFjdGl2ZV9yZWFjdGlvbixcblx0dXBkYXRlX2VmZmVjdCxcblx0Z2V0LFxuXHRpc19kZXN0cm95aW5nX2VmZmVjdCxcblx0cmVtb3ZlX3JlYWN0aW9ucyxcblx0c2V0X2FjdGl2ZV9yZWFjdGlvbixcblx0c2V0X2lzX2Rlc3Ryb3lpbmdfZWZmZWN0LFxuXHR1bnRyYWNrLFxuXHR1bnRyYWNraW5nLFxuXHRzZXRfYWN0aXZlX2VmZmVjdFxufSBmcm9tICcuLi9ydW50aW1lLmpzJztcbmltcG9ydCB7XG5cdERJUlRZLFxuXHRCUkFOQ0hfRUZGRUNULFxuXHRSRU5ERVJfRUZGRUNULFxuXHRFRkZFQ1QsXG5cdERFU1RST1lFRCxcblx0SU5FUlQsXG5cdEJMT0NLX0VGRkVDVCxcblx0Uk9PVF9FRkZFQ1QsXG5cdEVGRkVDVF9UUkFOU1BBUkVOVCxcblx0REVSSVZFRCxcblx0Q0xFQU4sXG5cdEVBR0VSX0VGRkVDVCxcblx0SEVBRF9FRkZFQ1QsXG5cdE1BWUJFX0RJUlRZLFxuXHRFRkZFQ1RfUFJFU0VSVkVELFxuXHRTVEFMRV9SRUFDVElPTixcblx0VVNFUl9FRkZFQ1QsXG5cdEFTWU5DLFxuXHRDT05ORUNURUQsXG5cdE1BTkFHRURfRUZGRUNULFxuXHRERVNUUk9ZSU5HLFxuXHRQQVVTRURcbn0gZnJvbSAnI2NsaWVudC9jb25zdGFudHMnO1xuaW1wb3J0IHsgaW52b2tlX2Vycm9yX2JvdW5kYXJ5IH0gZnJvbSAnLi4vZXJyb3ItaGFuZGxpbmcuanMnO1xuaW1wb3J0ICogYXMgZSBmcm9tICcuLi9lcnJvcnMuanMnO1xuaW1wb3J0IHsgREVWIH0gZnJvbSAnZXNtLWVudic7XG5pbXBvcnQgeyBkZWZpbmVfcHJvcGVydHkgfSBmcm9tICcuLi8uLi9zaGFyZWQvdXRpbHMuanMnO1xuaW1wb3J0IHsgZ2V0X25leHRfc2libGluZyB9IGZyb20gJy4uL2RvbS9vcGVyYXRpb25zLmpzJztcbmltcG9ydCB7IGNvbXBvbmVudF9jb250ZXh0LCBkZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb24sIGRldl9zdGFjayB9IGZyb20gJy4uL2NvbnRleHQuanMnO1xuaW1wb3J0IHsgQmF0Y2gsIGNvbGxlY3RlZF9lZmZlY3RzLCBjdXJyZW50X2JhdGNoIH0gZnJvbSAnLi9iYXRjaC5qcyc7XG5pbXBvcnQgeyBmbGF0dGVuIH0gZnJvbSAnLi9hc3luYy5qcyc7XG5pbXBvcnQgeyB3aXRob3V0X3JlYWN0aXZlX2NvbnRleHQgfSBmcm9tICcuLi9kb20vZWxlbWVudHMvYmluZGluZ3Mvc2hhcmVkLmpzJztcbmltcG9ydCB7IHNldF9zaWduYWxfc3RhdHVzIH0gZnJvbSAnLi9zdGF0dXMuanMnO1xuXG4vKipcbiAqIEBwYXJhbSB7JyRlZmZlY3QnIHwgJyRlZmZlY3QucHJlJyB8ICckaW5zcGVjdCd9IHJ1bmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlX2VmZmVjdChydW5lKSB7XG5cdGlmIChhY3RpdmVfZWZmZWN0ID09PSBudWxsKSB7XG5cdFx0aWYgKGFjdGl2ZV9yZWFjdGlvbiA9PT0gbnVsbCkge1xuXHRcdFx0ZS5lZmZlY3Rfb3JwaGFuKHJ1bmUpO1xuXHRcdH1cblxuXHRcdGUuZWZmZWN0X2luX3Vub3duZWRfZGVyaXZlZCgpO1xuXHR9XG5cblx0aWYgKGlzX2Rlc3Ryb3lpbmdfZWZmZWN0KSB7XG5cdFx0ZS5lZmZlY3RfaW5fdGVhcmRvd24ocnVuZSk7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VmZmVjdH0gZWZmZWN0XG4gKiBAcGFyYW0ge0VmZmVjdH0gcGFyZW50X2VmZmVjdFxuICovXG5mdW5jdGlvbiBwdXNoX2VmZmVjdChlZmZlY3QsIHBhcmVudF9lZmZlY3QpIHtcblx0dmFyIHBhcmVudF9sYXN0ID0gcGFyZW50X2VmZmVjdC5sYXN0O1xuXHRpZiAocGFyZW50X2xhc3QgPT09IG51bGwpIHtcblx0XHRwYXJlbnRfZWZmZWN0Lmxhc3QgPSBwYXJlbnRfZWZmZWN0LmZpcnN0ID0gZWZmZWN0O1xuXHR9IGVsc2Uge1xuXHRcdHBhcmVudF9sYXN0Lm5leHQgPSBlZmZlY3Q7XG5cdFx0ZWZmZWN0LnByZXYgPSBwYXJlbnRfbGFzdDtcblx0XHRwYXJlbnRfZWZmZWN0Lmxhc3QgPSBlZmZlY3Q7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gdHlwZVxuICogQHBhcmFtIHtudWxsIHwgKCgpID0+IHZvaWQgfCAoKCkgPT4gdm9pZCkpfSBmblxuICogQHJldHVybnMge0VmZmVjdH1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlX2VmZmVjdCh0eXBlLCBmbikge1xuXHR2YXIgcGFyZW50ID0gYWN0aXZlX2VmZmVjdDtcblxuXHRpZiAoREVWKSB7XG5cdFx0Ly8gRW5zdXJlIHRoZSBwYXJlbnQgaXMgbmV2ZXIgYW4gaW5zcGVjdCBlZmZlY3Rcblx0XHR3aGlsZSAocGFyZW50ICE9PSBudWxsICYmIChwYXJlbnQuZiAmIEVBR0VSX0VGRkVDVCkgIT09IDApIHtcblx0XHRcdHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG5cdFx0fVxuXHR9XG5cblx0aWYgKHBhcmVudCAhPT0gbnVsbCAmJiAocGFyZW50LmYgJiBJTkVSVCkgIT09IDApIHtcblx0XHR0eXBlIHw9IElORVJUO1xuXHR9XG5cblx0LyoqIEB0eXBlIHtFZmZlY3R9ICovXG5cdHZhciBlZmZlY3QgPSB7XG5cdFx0Y3R4OiBjb21wb25lbnRfY29udGV4dCxcblx0XHRkZXBzOiBudWxsLFxuXHRcdG5vZGVzOiBudWxsLFxuXHRcdGY6IHR5cGUgfCBESVJUWSB8IENPTk5FQ1RFRCxcblx0XHRmaXJzdDogbnVsbCxcblx0XHRmbixcblx0XHRsYXN0OiBudWxsLFxuXHRcdG5leHQ6IG51bGwsXG5cdFx0cGFyZW50LFxuXHRcdGI6IHBhcmVudCAmJiBwYXJlbnQuYixcblx0XHRwcmV2OiBudWxsLFxuXHRcdHRlYXJkb3duOiBudWxsLFxuXHRcdHd2OiAwLFxuXHRcdGFjOiBudWxsXG5cdH07XG5cblx0aWYgKERFVikge1xuXHRcdGVmZmVjdC5jb21wb25lbnRfZnVuY3Rpb24gPSBkZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb247XG5cdH1cblxuXHRjdXJyZW50X2JhdGNoPy5yZWdpc3Rlcl9jcmVhdGVkX2VmZmVjdChlZmZlY3QpO1xuXG5cdC8qKiBAdHlwZSB7RWZmZWN0IHwgbnVsbH0gKi9cblx0dmFyIGUgPSBlZmZlY3Q7XG5cblx0aWYgKCh0eXBlICYgRUZGRUNUKSAhPT0gMCkge1xuXHRcdGlmIChjb2xsZWN0ZWRfZWZmZWN0cyAhPT0gbnVsbCkge1xuXHRcdFx0Ly8gY3JlYXRlZCBkdXJpbmcgdHJhdmVyc2FsIOKAlCBjb2xsZWN0IGFuZCBydW4gYWZ0ZXJ3YXJkc1xuXHRcdFx0Y29sbGVjdGVkX2VmZmVjdHMucHVzaChlZmZlY3QpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBzY2hlZHVsZSBmb3IgbGF0ZXJcblx0XHRcdEJhdGNoLmVuc3VyZSgpLnNjaGVkdWxlKGVmZmVjdCk7XG5cdFx0fVxuXHR9IGVsc2UgaWYgKGZuICE9PSBudWxsKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHVwZGF0ZV9lZmZlY3QoZWZmZWN0KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRkZXN0cm95X2VmZmVjdChlZmZlY3QpO1xuXHRcdFx0dGhyb3cgZTtcblx0XHR9XG5cblx0XHQvLyBpZiBhbiBlZmZlY3QgZG9lc24ndCBuZWVkIHRvIGJlIGtlcHQgaW4gdGhlIHRyZWUgKGJlY2F1c2UgaXRcblx0XHQvLyB3b24ndCByZS1ydW4sIGhhcyBubyBET00sIGFuZCBoYXMgbm8gdGVhcmRvd24gZXRjKVxuXHRcdC8vIHRoZW4gd2Ugc2tpcCBpdCBhbmQgZ28gdG8gaXRzIGNoaWxkIChpZiBhbnkpXG5cdFx0aWYgKFxuXHRcdFx0ZS5kZXBzID09PSBudWxsICYmXG5cdFx0XHRlLnRlYXJkb3duID09PSBudWxsICYmXG5cdFx0XHRlLm5vZGVzID09PSBudWxsICYmXG5cdFx0XHRlLmZpcnN0ID09PSBlLmxhc3QgJiYgLy8gZWl0aGVyIGBudWxsYCwgb3IgYSBzaW5ndWxhciBjaGlsZFxuXHRcdFx0KGUuZiAmIEVGRkVDVF9QUkVTRVJWRUQpID09PSAwXG5cdFx0KSB7XG5cdFx0XHRlID0gZS5maXJzdDtcblx0XHRcdGlmICgodHlwZSAmIEJMT0NLX0VGRkVDVCkgIT09IDAgJiYgKHR5cGUgJiBFRkZFQ1RfVFJBTlNQQVJFTlQpICE9PSAwICYmIGUgIT09IG51bGwpIHtcblx0XHRcdFx0ZS5mIHw9IEVGRkVDVF9UUkFOU1BBUkVOVDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpZiAoZSAhPT0gbnVsbCkge1xuXHRcdGUucGFyZW50ID0gcGFyZW50O1xuXG5cdFx0aWYgKHBhcmVudCAhPT0gbnVsbCkge1xuXHRcdFx0cHVzaF9lZmZlY3QoZSwgcGFyZW50KTtcblx0XHR9XG5cblx0XHQvLyBpZiB3ZSdyZSBpbiBhIGRlcml2ZWQsIGFkZCB0aGUgZWZmZWN0IHRoZXJlIHRvb1xuXHRcdGlmIChcblx0XHRcdGFjdGl2ZV9yZWFjdGlvbiAhPT0gbnVsbCAmJlxuXHRcdFx0KGFjdGl2ZV9yZWFjdGlvbi5mICYgREVSSVZFRCkgIT09IDAgJiZcblx0XHRcdCh0eXBlICYgUk9PVF9FRkZFQ1QpID09PSAwXG5cdFx0KSB7XG5cdFx0XHR2YXIgZGVyaXZlZCA9IC8qKiBAdHlwZSB7RGVyaXZlZH0gKi8gKGFjdGl2ZV9yZWFjdGlvbik7XG5cdFx0XHQoZGVyaXZlZC5lZmZlY3RzID8/PSBbXSkucHVzaChlKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZWZmZWN0O1xufVxuXG4vKipcbiAqIEludGVybmFsIHJlcHJlc2VudGF0aW9uIG9mIGAkZWZmZWN0LnRyYWNraW5nKClgXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVmZmVjdF90cmFja2luZygpIHtcblx0cmV0dXJuIGFjdGl2ZV9yZWFjdGlvbiAhPT0gbnVsbCAmJiAhdW50cmFja2luZztcbn1cblxuLyoqXG4gKiBAcGFyYW0geygpID0+IHZvaWR9IGZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZWFyZG93bihmbikge1xuXHRjb25zdCBlZmZlY3QgPSBjcmVhdGVfZWZmZWN0KFJFTkRFUl9FRkZFQ1QsIG51bGwpO1xuXHRzZXRfc2lnbmFsX3N0YXR1cyhlZmZlY3QsIENMRUFOKTtcblx0ZWZmZWN0LnRlYXJkb3duID0gZm47XG5cdHJldHVybiBlZmZlY3Q7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgcmVwcmVzZW50YXRpb24gb2YgYCRlZmZlY3QoLi4uKWBcbiAqIEBwYXJhbSB7KCkgPT4gdm9pZCB8ICgoKSA9PiB2b2lkKX0gZm5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZXJfZWZmZWN0KGZuKSB7XG5cdHZhbGlkYXRlX2VmZmVjdCgnJGVmZmVjdCcpO1xuXG5cdGlmIChERVYpIHtcblx0XHRkZWZpbmVfcHJvcGVydHkoZm4sICduYW1lJywge1xuXHRcdFx0dmFsdWU6ICckZWZmZWN0J1xuXHRcdH0pO1xuXHR9XG5cblx0Ly8gTm9uLW5lc3RlZCBgJGVmZmVjdCguLi4pYCBpbiBhIGNvbXBvbmVudCBzaG91bGQgYmUgZGVmZXJyZWRcblx0Ly8gdW50aWwgdGhlIGNvbXBvbmVudCBpcyBtb3VudGVkXG5cdHZhciBmbGFncyA9IC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAoYWN0aXZlX2VmZmVjdCkuZjtcblx0dmFyIGRlZmVyID1cblx0XHQhYWN0aXZlX3JlYWN0aW9uICYmXG5cdFx0KGZsYWdzICYgQlJBTkNIX0VGRkVDVCkgIT09IDAgJiZcblx0XHRjb21wb25lbnRfY29udGV4dCAhPT0gbnVsbCAmJlxuXHRcdCFjb21wb25lbnRfY29udGV4dC5pO1xuXG5cdGlmIChkZWZlcikge1xuXHRcdC8vIFRvcC1sZXZlbCBgJGVmZmVjdCguLi4pYCBpbiBhbiB1bm1vdW50ZWQgY29tcG9uZW50IOKAlCBkZWZlciB1bnRpbCBtb3VudFxuXHRcdHZhciBjb250ZXh0ID0gLyoqIEB0eXBlIHtDb21wb25lbnRDb250ZXh0fSAqLyAoY29tcG9uZW50X2NvbnRleHQpO1xuXHRcdChjb250ZXh0LmUgPz89IFtdKS5wdXNoKGZuKTtcblx0fSBlbHNlIHtcblx0XHQvLyBFdmVyeXRoaW5nIGVsc2Ug4oCUIGNyZWF0ZSBpbW1lZGlhdGVseVxuXHRcdHJldHVybiBjcmVhdGVfdXNlcl9lZmZlY3QoZm4pO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHsoKSA9PiB2b2lkIHwgKCgpID0+IHZvaWQpfSBmblxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlX3VzZXJfZWZmZWN0KGZuKSB7XG5cdHJldHVybiBjcmVhdGVfZWZmZWN0KEVGRkVDVCB8IFVTRVJfRUZGRUNULCBmbik7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgcmVwcmVzZW50YXRpb24gb2YgYCRlZmZlY3QucHJlKC4uLilgXG4gKiBAcGFyYW0geygpID0+IHZvaWQgfCAoKCkgPT4gdm9pZCl9IGZuXG4gKiBAcmV0dXJucyB7RWZmZWN0fVxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlcl9wcmVfZWZmZWN0KGZuKSB7XG5cdHZhbGlkYXRlX2VmZmVjdCgnJGVmZmVjdC5wcmUnKTtcblx0aWYgKERFVikge1xuXHRcdGRlZmluZV9wcm9wZXJ0eShmbiwgJ25hbWUnLCB7XG5cdFx0XHR2YWx1ZTogJyRlZmZlY3QucHJlJ1xuXHRcdH0pO1xuXHR9XG5cdHJldHVybiBjcmVhdGVfZWZmZWN0KFJFTkRFUl9FRkZFQ1QgfCBVU0VSX0VGRkVDVCwgZm4pO1xufVxuXG4vKiogQHBhcmFtIHsoKSA9PiB2b2lkIHwgKCgpID0+IHZvaWQpfSBmbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVhZ2VyX2VmZmVjdChmbikge1xuXHRyZXR1cm4gY3JlYXRlX2VmZmVjdChFQUdFUl9FRkZFQ1QsIGZuKTtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCByZXByZXNlbnRhdGlvbiBvZiBgJGVmZmVjdC5yb290KC4uLilgXG4gKiBAcGFyYW0geygpID0+IHZvaWQgfCAoKCkgPT4gdm9pZCl9IGZuXG4gKiBAcmV0dXJucyB7KCkgPT4gdm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVmZmVjdF9yb290KGZuKSB7XG5cdEJhdGNoLmVuc3VyZSgpO1xuXHRjb25zdCBlZmZlY3QgPSBjcmVhdGVfZWZmZWN0KFJPT1RfRUZGRUNUIHwgRUZGRUNUX1BSRVNFUlZFRCwgZm4pO1xuXG5cdHJldHVybiAoKSA9PiB7XG5cdFx0ZGVzdHJveV9lZmZlY3QoZWZmZWN0KTtcblx0fTtcbn1cblxuLyoqXG4gKiBBbiBlZmZlY3Qgcm9vdCB3aG9zZSBjaGlsZHJlbiBjYW4gdHJhbnNpdGlvbiBvdXRcbiAqIEBwYXJhbSB7KCkgPT4gdm9pZH0gZm5cbiAqIEByZXR1cm5zIHsob3B0aW9ucz86IHsgb3V0cm8/OiBib29sZWFuIH0pID0+IFByb21pc2U8dm9pZD59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRfcm9vdChmbikge1xuXHRCYXRjaC5lbnN1cmUoKTtcblx0Y29uc3QgZWZmZWN0ID0gY3JlYXRlX2VmZmVjdChST09UX0VGRkVDVCB8IEVGRkVDVF9QUkVTRVJWRUQsIGZuKTtcblxuXHRyZXR1cm4gKG9wdGlvbnMgPSB7fSkgPT4ge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgoZnVsZmlsKSA9PiB7XG5cdFx0XHRpZiAob3B0aW9ucy5vdXRybykge1xuXHRcdFx0XHRwYXVzZV9lZmZlY3QoZWZmZWN0LCAoKSA9PiB7XG5cdFx0XHRcdFx0ZGVzdHJveV9lZmZlY3QoZWZmZWN0KTtcblx0XHRcdFx0XHRmdWxmaWwodW5kZWZpbmVkKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkZXN0cm95X2VmZmVjdChlZmZlY3QpO1xuXHRcdFx0XHRmdWxmaWwodW5kZWZpbmVkKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcbn1cblxuLyoqXG4gKiBAcGFyYW0geygpID0+IHZvaWQgfCAoKCkgPT4gdm9pZCl9IGZuXG4gKiBAcmV0dXJucyB7RWZmZWN0fVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWZmZWN0KGZuKSB7XG5cdHJldHVybiBjcmVhdGVfZWZmZWN0KEVGRkVDVCwgZm4pO1xufVxuXG4vKipcbiAqIEludGVybmFsIHJlcHJlc2VudGF0aW9uIG9mIGAkOiAuLmBcbiAqIEBwYXJhbSB7KCkgPT4gYW55fSBkZXBzXG4gKiBAcGFyYW0geygpID0+IHZvaWQgfCAoKCkgPT4gdm9pZCl9IGZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWdhY3lfcHJlX2VmZmVjdChkZXBzLCBmbikge1xuXHR2YXIgY29udGV4dCA9IC8qKiBAdHlwZSB7Q29tcG9uZW50Q29udGV4dExlZ2FjeX0gKi8gKGNvbXBvbmVudF9jb250ZXh0KTtcblxuXHQvKiogQHR5cGUge3sgZWZmZWN0OiBudWxsIHwgRWZmZWN0LCByYW46IGJvb2xlYW4sIGRlcHM6ICgpID0+IGFueSB9fSAqL1xuXHR2YXIgdG9rZW4gPSB7IGVmZmVjdDogbnVsbCwgcmFuOiBmYWxzZSwgZGVwcyB9O1xuXG5cdGNvbnRleHQubC4kLnB1c2godG9rZW4pO1xuXG5cdHRva2VuLmVmZmVjdCA9IHJlbmRlcl9lZmZlY3QoKCkgPT4ge1xuXHRcdGRlcHMoKTtcblxuXHRcdC8vIElmIHRoaXMgbGVnYWN5IHByZSBlZmZlY3QgaGFzIGFscmVhZHkgcnVuIGJlZm9yZSB0aGUgZW5kIG9mIHRoZSByZXNldCwgdGhlblxuXHRcdC8vIGJhaWwgb3V0IHRvIGVtdWxhdGUgdGhlIHNhbWUgYmVoYXZpb3IuXG5cdFx0aWYgKHRva2VuLnJhbikgcmV0dXJuO1xuXG5cdFx0dG9rZW4ucmFuID0gdHJ1ZTtcblxuXHRcdHZhciBlZmZlY3QgPSAvKiogQHR5cGUge0VmZmVjdH0gKi8gKGFjdGl2ZV9lZmZlY3QpO1xuXG5cdFx0Ly8gaGVyZSwgd2UgbGllOiBieSBzZXR0aW5nIGBhY3RpdmVfZWZmZWN0YCB0byBiZSB0aGUgcGFyZW50IGJyYW5jaCwgYW55IHdyaXRlc1xuXHRcdC8vIHRoYXQgaGFwcGVuIGluc2lkZSBgZm5gIHdpbGwgX25vdF8gY2F1c2UgYW4gdW5uZWNlc3NhcnkgcmVzY2hlZHVsZSwgYmVjYXVzZVxuXHRcdC8vIHRoZSBhZmZlY3RlZCBlZmZlY3RzIHdpbGwgYmUgY2hpbGRyZW4gb2YgYGFjdGl2ZV9lZmZlY3RgLiB0aGlzIGlzIHNhZmVcblx0XHQvLyBiZWNhdXNlIHRoZXNlIGVmZmVjdHMgYXJlIGtub3duIHRvIHJ1biBpbiB0aGUgY29ycmVjdCBvcmRlclxuXHRcdHRyeSB7XG5cdFx0XHRzZXRfYWN0aXZlX2VmZmVjdChlZmZlY3QucGFyZW50KTtcblx0XHRcdHVudHJhY2soZm4pO1xuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRzZXRfYWN0aXZlX2VmZmVjdChlZmZlY3QpO1xuXHRcdH1cblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsZWdhY3lfcHJlX2VmZmVjdF9yZXNldCgpIHtcblx0dmFyIGNvbnRleHQgPSAvKiogQHR5cGUge0NvbXBvbmVudENvbnRleHRMZWdhY3l9ICovIChjb21wb25lbnRfY29udGV4dCk7XG5cblx0cmVuZGVyX2VmZmVjdCgoKSA9PiB7XG5cdFx0Ly8gUnVuIGRpcnR5IGAkOmAgc3RhdGVtZW50c1xuXHRcdGZvciAodmFyIHRva2VuIG9mIGNvbnRleHQubC4kKSB7XG5cdFx0XHR0b2tlbi5kZXBzKCk7XG5cblx0XHRcdHZhciBlZmZlY3QgPSB0b2tlbi5lZmZlY3Q7XG5cblx0XHRcdC8vIElmIHRoZSBlZmZlY3QgaXMgQ0xFQU4sIHRoZW4gbWFrZSBpdCBNQVlCRV9ESVJUWS4gVGhpcyBlbnN1cmVzIHdlIHRyYXZlcnNlIHRocm91Z2hcblx0XHRcdC8vIHRoZSBlZmZlY3RzIGRlcGVuZGVuY2llcyBhbmQgY29ycmVjdGx5IGVuc3VyZSBlYWNoIGRlcGVuZGVuY3kgaXMgdXAtdG8tZGF0ZS5cblx0XHRcdGlmICgoZWZmZWN0LmYgJiBDTEVBTikgIT09IDAgJiYgZWZmZWN0LmRlcHMgIT09IG51bGwpIHtcblx0XHRcdFx0c2V0X3NpZ25hbF9zdGF0dXMoZWZmZWN0LCBNQVlCRV9ESVJUWSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChpc19kaXJ0eShlZmZlY3QpKSB7XG5cdFx0XHRcdHVwZGF0ZV9lZmZlY3QoZWZmZWN0KTtcblx0XHRcdH1cblxuXHRcdFx0dG9rZW4ucmFuID0gZmFsc2U7XG5cdFx0fVxuXHR9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0geygpID0+IHZvaWQgfCAoKCkgPT4gdm9pZCl9IGZuXG4gKiBAcmV0dXJucyB7RWZmZWN0fVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXN5bmNfZWZmZWN0KGZuKSB7XG5cdHJldHVybiBjcmVhdGVfZWZmZWN0KEFTWU5DIHwgRUZGRUNUX1BSRVNFUlZFRCwgZm4pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7KCkgPT4gdm9pZCB8ICgoKSA9PiB2b2lkKX0gZm5cbiAqIEByZXR1cm5zIHtFZmZlY3R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJfZWZmZWN0KGZuLCBmbGFncyA9IDApIHtcblx0cmV0dXJuIGNyZWF0ZV9lZmZlY3QoUkVOREVSX0VGRkVDVCB8IGZsYWdzLCBmbik7XG59XG5cbi8qKlxuICogQHBhcmFtIHsoLi4uZXhwcmVzc2lvbnM6IGFueSkgPT4gdm9pZCB8ICgoKSA9PiB2b2lkKX0gZm5cbiAqIEBwYXJhbSB7QXJyYXk8KCkgPT4gYW55Pn0gc3luY1xuICogQHBhcmFtIHtBcnJheTwoKSA9PiBQcm9taXNlPGFueT4+fSBhc3luY1xuICogQHBhcmFtIHtCbG9ja2VyW119IGJsb2NrZXJzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZV9lZmZlY3QoZm4sIHN5bmMgPSBbXSwgYXN5bmMgPSBbXSwgYmxvY2tlcnMgPSBbXSkge1xuXHRmbGF0dGVuKGJsb2NrZXJzLCBzeW5jLCBhc3luYywgKHZhbHVlcykgPT4ge1xuXHRcdGNyZWF0ZV9lZmZlY3QoUkVOREVSX0VGRkVDVCwgKCkgPT4ge1xuXHRcdFx0Zm4oLi4udmFsdWVzLm1hcChnZXQpKTtcblx0XHR9KTtcblx0fSk7XG59XG5cbi8qKlxuICogTGlrZSBgdGVtcGxhdGVfZWZmZWN0YCwgYnV0IHdpdGggYW4gZWZmZWN0IHdoaWNoIGlzIGRlZmVycmVkIHVudGlsIHRoZSBiYXRjaCBjb21taXRzXG4gKiBAcGFyYW0geyguLi5leHByZXNzaW9uczogYW55KSA9PiB2b2lkIHwgKCgpID0+IHZvaWQpfSBmblxuICogQHBhcmFtIHtBcnJheTwoKSA9PiBhbnk+fSBzeW5jXG4gKiBAcGFyYW0ge0FycmF5PCgpID0+IFByb21pc2U8YW55Pj59IGFzeW5jXG4gKiBAcGFyYW0ge0Jsb2NrZXJbXX0gYmxvY2tlcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmVycmVkX3RlbXBsYXRlX2VmZmVjdChmbiwgc3luYyA9IFtdLCBhc3luYyA9IFtdLCBibG9ja2VycyA9IFtdKSB7XG5cdGZsYXR0ZW4oYmxvY2tlcnMsIHN5bmMsIGFzeW5jLCAodmFsdWVzKSA9PiB7XG5cdFx0Y3JlYXRlX2VmZmVjdChFRkZFQ1QsICgpID0+IGZuKC4uLnZhbHVlcy5tYXAoZ2V0KSkpO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0geygoKSA9PiB2b2lkKX0gZm5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmbGFnc1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvY2soZm4sIGZsYWdzID0gMCkge1xuXHR2YXIgZWZmZWN0ID0gY3JlYXRlX2VmZmVjdChCTE9DS19FRkZFQ1QgfCBmbGFncywgZm4pO1xuXHRpZiAoREVWKSB7XG5cdFx0ZWZmZWN0LmRldl9zdGFjayA9IGRldl9zdGFjaztcblx0fVxuXHRyZXR1cm4gZWZmZWN0O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7KCgpID0+IHZvaWQpfSBmblxuICogQHBhcmFtIHtudW1iZXJ9IGZsYWdzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYW5hZ2VkKGZuLCBmbGFncyA9IDApIHtcblx0dmFyIGVmZmVjdCA9IGNyZWF0ZV9lZmZlY3QoTUFOQUdFRF9FRkZFQ1QgfCBmbGFncywgZm4pO1xuXHRpZiAoREVWKSB7XG5cdFx0ZWZmZWN0LmRldl9zdGFjayA9IGRldl9zdGFjaztcblx0fVxuXHRyZXR1cm4gZWZmZWN0O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7KCgpID0+IHZvaWQpfSBmblxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJhbmNoKGZuKSB7XG5cdHJldHVybiBjcmVhdGVfZWZmZWN0KEJSQU5DSF9FRkZFQ1QgfCBFRkZFQ1RfUFJFU0VSVkVELCBmbik7XG59XG5cbi8qKlxuICogQHBhcmFtIHtFZmZlY3R9IGVmZmVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZV9lZmZlY3RfdGVhcmRvd24oZWZmZWN0KSB7XG5cdHZhciB0ZWFyZG93biA9IGVmZmVjdC50ZWFyZG93bjtcblx0aWYgKHRlYXJkb3duICE9PSBudWxsKSB7XG5cdFx0Y29uc3QgcHJldmlvdXNseV9kZXN0cm95aW5nX2VmZmVjdCA9IGlzX2Rlc3Ryb3lpbmdfZWZmZWN0O1xuXHRcdGNvbnN0IHByZXZpb3VzX3JlYWN0aW9uID0gYWN0aXZlX3JlYWN0aW9uO1xuXHRcdHNldF9pc19kZXN0cm95aW5nX2VmZmVjdCh0cnVlKTtcblx0XHRzZXRfYWN0aXZlX3JlYWN0aW9uKG51bGwpO1xuXHRcdHRyeSB7XG5cdFx0XHR0ZWFyZG93bi5jYWxsKG51bGwpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHQvLyBSb3V0ZSB0ZWFyZG93biBlcnJvcnMgdGhyb3VnaCB0aGUgYm91bmRhcnkgc3lzdGVtIHNvIHRoYXQgYSBsaXZlXG5cdFx0XHQvLyBhbmNlc3RvciA8c3ZlbHRlOmJvdW5kYXJ5PiBjYW4gaGFuZGxlIHRoZW0uIEJvdW5kYXJpZXMgdGhhdCBhcmVcblx0XHRcdC8vIHRoZW1zZWx2ZXMgbWlkLXRlYXJkb3duIGFyZSBza2lwcGVkIGJ5IGludm9rZV9lcnJvcl9ib3VuZGFyeS5cblx0XHRcdGludm9rZV9lcnJvcl9ib3VuZGFyeShlcnJvciwgZWZmZWN0LnBhcmVudCk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHNldF9pc19kZXN0cm95aW5nX2VmZmVjdChwcmV2aW91c2x5X2Rlc3Ryb3lpbmdfZWZmZWN0KTtcblx0XHRcdHNldF9hY3RpdmVfcmVhY3Rpb24ocHJldmlvdXNfcmVhY3Rpb24pO1xuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7RWZmZWN0fSBzaWduYWxcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gcmVtb3ZlX2RvbVxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95X2VmZmVjdF9jaGlsZHJlbihzaWduYWwsIHJlbW92ZV9kb20gPSBmYWxzZSkge1xuXHR2YXIgZWZmZWN0ID0gc2lnbmFsLmZpcnN0O1xuXHRzaWduYWwuZmlyc3QgPSBzaWduYWwubGFzdCA9IG51bGw7XG5cblx0d2hpbGUgKGVmZmVjdCAhPT0gbnVsbCkge1xuXHRcdGNvbnN0IGNvbnRyb2xsZXIgPSBlZmZlY3QuYWM7XG5cblx0XHRpZiAoY29udHJvbGxlciAhPT0gbnVsbCkge1xuXHRcdFx0d2l0aG91dF9yZWFjdGl2ZV9jb250ZXh0KCgpID0+IHtcblx0XHRcdFx0Y29udHJvbGxlci5hYm9ydChTVEFMRV9SRUFDVElPTik7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHR2YXIgbmV4dCA9IGVmZmVjdC5uZXh0O1xuXG5cdFx0aWYgKChlZmZlY3QuZiAmIFJPT1RfRUZGRUNUKSAhPT0gMCkge1xuXHRcdFx0Ly8gdGhpcyBpcyBub3cgYW4gaW5kZXBlbmRlbnQgcm9vdFxuXHRcdFx0ZWZmZWN0LnBhcmVudCA9IG51bGw7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlc3Ryb3lfZWZmZWN0KGVmZmVjdCwgcmVtb3ZlX2RvbSk7XG5cdFx0fVxuXG5cdFx0ZWZmZWN0ID0gbmV4dDtcblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7RWZmZWN0fSBzaWduYWxcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveV9ibG9ja19lZmZlY3RfY2hpbGRyZW4oc2lnbmFsKSB7XG5cdHZhciBlZmZlY3QgPSBzaWduYWwuZmlyc3Q7XG5cblx0d2hpbGUgKGVmZmVjdCAhPT0gbnVsbCkge1xuXHRcdHZhciBuZXh0ID0gZWZmZWN0Lm5leHQ7XG5cdFx0aWYgKChlZmZlY3QuZiAmIEJSQU5DSF9FRkZFQ1QpID09PSAwKSB7XG5cdFx0XHRkZXN0cm95X2VmZmVjdChlZmZlY3QpO1xuXHRcdH1cblx0XHRlZmZlY3QgPSBuZXh0O1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtFZmZlY3R9IGVmZmVjdFxuICogQHBhcmFtIHtib29sZWFufSBbcmVtb3ZlX2RvbV1cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveV9lZmZlY3QoZWZmZWN0LCByZW1vdmVfZG9tID0gdHJ1ZSkge1xuXHR2YXIgcmVtb3ZlZCA9IGZhbHNlO1xuXG5cdGlmIChcblx0XHQocmVtb3ZlX2RvbSB8fCAoZWZmZWN0LmYgJiBIRUFEX0VGRkVDVCkgIT09IDApICYmXG5cdFx0ZWZmZWN0Lm5vZGVzICE9PSBudWxsICYmXG5cdFx0ZWZmZWN0Lm5vZGVzLmVuZCAhPT0gbnVsbFxuXHQpIHtcblx0XHRyZW1vdmVfZWZmZWN0X2RvbShlZmZlY3Qubm9kZXMuc3RhcnQsIC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoZWZmZWN0Lm5vZGVzLmVuZCkpO1xuXHRcdHJlbW92ZWQgPSB0cnVlO1xuXHR9XG5cblx0ZWZmZWN0LmYgfD0gREVTVFJPWUlORztcblx0ZGVzdHJveV9lZmZlY3RfY2hpbGRyZW4oZWZmZWN0LCByZW1vdmVfZG9tICYmICFyZW1vdmVkKTtcblx0cmVtb3ZlX3JlYWN0aW9ucyhlZmZlY3QsIDApO1xuXG5cdHZhciB0cmFuc2l0aW9ucyA9IGVmZmVjdC5ub2RlcyAmJiBlZmZlY3Qubm9kZXMudDtcblxuXHRpZiAodHJhbnNpdGlvbnMgIT09IG51bGwpIHtcblx0XHRmb3IgKGNvbnN0IHRyYW5zaXRpb24gb2YgdHJhbnNpdGlvbnMpIHtcblx0XHRcdHRyYW5zaXRpb24uc3RvcCgpO1xuXHRcdH1cblx0fVxuXG5cdGV4ZWN1dGVfZWZmZWN0X3RlYXJkb3duKGVmZmVjdCk7XG5cblx0ZWZmZWN0LmYgXj0gREVTVFJPWUlORztcblx0ZWZmZWN0LmYgfD0gREVTVFJPWUVEO1xuXG5cdHZhciBwYXJlbnQgPSBlZmZlY3QucGFyZW50O1xuXG5cdC8vIElmIHRoZSBwYXJlbnQgZG9lc24ndCBoYXZlIGFueSBjaGlsZHJlbiwgdGhlbiBza2lwIHRoaXMgd29yayBhbHRvZ2V0aGVyXG5cdGlmIChwYXJlbnQgIT09IG51bGwgJiYgcGFyZW50LmZpcnN0ICE9PSBudWxsKSB7XG5cdFx0dW5saW5rX2VmZmVjdChlZmZlY3QpO1xuXHR9XG5cblx0aWYgKERFVikge1xuXHRcdGVmZmVjdC5jb21wb25lbnRfZnVuY3Rpb24gPSBudWxsO1xuXHR9XG5cblx0Ly8gYGZpcnN0YCBhbmQgYGNoaWxkYCBhcmUgbnVsbGVkIG91dCBpbiBkZXN0cm95X2VmZmVjdF9jaGlsZHJlblxuXHQvLyB3ZSBkb24ndCBudWxsIG91dCBgcGFyZW50YCBzbyB0aGF0IGVycm9yIHByb3BhZ2F0aW9uIGNhbiB3b3JrIGNvcnJlY3RseVxuXHRlZmZlY3QubmV4dCA9XG5cdFx0ZWZmZWN0LnByZXYgPVxuXHRcdGVmZmVjdC50ZWFyZG93biA9XG5cdFx0ZWZmZWN0LmN0eCA9XG5cdFx0ZWZmZWN0LmRlcHMgPVxuXHRcdGVmZmVjdC5mbiA9XG5cdFx0ZWZmZWN0Lm5vZGVzID1cblx0XHRlZmZlY3QuYWMgPVxuXHRcdGVmZmVjdC5iID1cblx0XHRcdG51bGw7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7VGVtcGxhdGVOb2RlIHwgbnVsbH0gbm9kZVxuICogQHBhcmFtIHtUZW1wbGF0ZU5vZGV9IGVuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlX2VmZmVjdF9kb20obm9kZSwgZW5kKSB7XG5cdHdoaWxlIChub2RlICE9PSBudWxsKSB7XG5cdFx0LyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGUgfCBudWxsfSAqL1xuXHRcdHZhciBuZXh0ID0gbm9kZSA9PT0gZW5kID8gbnVsbCA6IGdldF9uZXh0X3NpYmxpbmcobm9kZSk7XG5cblx0XHRub2RlLnJlbW92ZSgpO1xuXHRcdG5vZGUgPSBuZXh0O1xuXHR9XG59XG5cbi8qKlxuICogRGV0YWNoIGFuIGVmZmVjdCBmcm9tIHRoZSBlZmZlY3QgdHJlZSwgZnJlZWluZyB1cCBtZW1vcnkgYW5kXG4gKiByZWR1Y2luZyB0aGUgYW1vdW50IG9mIHdvcmsgdGhhdCBoYXBwZW5zIG9uIHN1YnNlcXVlbnQgdHJhdmVyc2Fsc1xuICogQHBhcmFtIHtFZmZlY3R9IGVmZmVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5saW5rX2VmZmVjdChlZmZlY3QpIHtcblx0dmFyIHBhcmVudCA9IGVmZmVjdC5wYXJlbnQ7XG5cdHZhciBwcmV2ID0gZWZmZWN0LnByZXY7XG5cdHZhciBuZXh0ID0gZWZmZWN0Lm5leHQ7XG5cblx0aWYgKHByZXYgIT09IG51bGwpIHByZXYubmV4dCA9IG5leHQ7XG5cdGlmIChuZXh0ICE9PSBudWxsKSBuZXh0LnByZXYgPSBwcmV2O1xuXG5cdGlmIChwYXJlbnQgIT09IG51bGwpIHtcblx0XHRpZiAocGFyZW50LmZpcnN0ID09PSBlZmZlY3QpIHBhcmVudC5maXJzdCA9IG5leHQ7XG5cdFx0aWYgKHBhcmVudC5sYXN0ID09PSBlZmZlY3QpIHBhcmVudC5sYXN0ID0gcHJldjtcblx0fVxufVxuXG4vKipcbiAqIFdoZW4gYSBibG9jayBlZmZlY3QgaXMgcmVtb3ZlZCwgd2UgZG9uJ3QgaW1tZWRpYXRlbHkgZGVzdHJveSBpdCBvciB5YW5rIGl0XG4gKiBvdXQgb2YgdGhlIERPTSwgYmVjYXVzZSBpdCBtaWdodCBoYXZlIHRyYW5zaXRpb25zLiBJbnN0ZWFkLCB3ZSAncGF1c2UnIGl0LlxuICogSXQgc3RheXMgYXJvdW5kIChpbiBtZW1vcnksIGFuZCBpbiB0aGUgRE9NKSB1bnRpbCBvdXRybyB0cmFuc2l0aW9ucyBoYXZlXG4gKiBjb21wbGV0ZWQsIGFuZCBpZiB0aGUgc3RhdGUgY2hhbmdlIGlzIHJldmVyc2VkIHRoZW4gd2UgX3Jlc3VtZV8gaXQuXG4gKiBBIHBhdXNlZCBlZmZlY3QgZG9lcyBub3QgdXBkYXRlLCBhbmQgdGhlIERPTSBzdWJ0cmVlIGJlY29tZXMgaW5lcnQuXG4gKiBAcGFyYW0ge0VmZmVjdH0gZWZmZWN0XG4gKiBAcGFyYW0geygpID0+IHZvaWR9IFtjYWxsYmFja11cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2Rlc3Ryb3ldXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXVzZV9lZmZlY3QoZWZmZWN0LCBjYWxsYmFjaywgZGVzdHJveSA9IHRydWUpIHtcblx0LyoqIEB0eXBlIHtUcmFuc2l0aW9uTWFuYWdlcltdfSAqL1xuXHR2YXIgdHJhbnNpdGlvbnMgPSBbXTtcblxuXHRlZmZlY3QuZiB8PSBQQVVTRUQ7XG5cdHBhdXNlX2NoaWxkcmVuKGVmZmVjdCwgdHJhbnNpdGlvbnMsIHRydWUpO1xuXG5cdHZhciBmbiA9ICgpID0+IHtcblx0XHRpZiAoZGVzdHJveSkgZGVzdHJveV9lZmZlY3QoZWZmZWN0KTtcblx0XHRpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG5cdH07XG5cblx0dmFyIHJlbWFpbmluZyA9IHRyYW5zaXRpb25zLmxlbmd0aDtcblx0aWYgKHJlbWFpbmluZyA+IDApIHtcblx0XHR2YXIgY2hlY2sgPSAoKSA9PiAtLXJlbWFpbmluZyB8fCBmbigpO1xuXHRcdGZvciAodmFyIHRyYW5zaXRpb24gb2YgdHJhbnNpdGlvbnMpIHtcblx0XHRcdHRyYW5zaXRpb24ub3V0KGNoZWNrKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Zm4oKTtcblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3RcbiAqIEBwYXJhbSB7VHJhbnNpdGlvbk1hbmFnZXJbXX0gdHJhbnNpdGlvbnNcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gbG9jYWxcbiAqL1xuZnVuY3Rpb24gcGF1c2VfY2hpbGRyZW4oZWZmZWN0LCB0cmFuc2l0aW9ucywgbG9jYWwpIHtcblx0aWYgKChlZmZlY3QuZiAmIElORVJUKSAhPT0gMCkgcmV0dXJuO1xuXHRlZmZlY3QuZiBePSBJTkVSVDtcblxuXHR2YXIgdCA9IGVmZmVjdC5ub2RlcyAmJiBlZmZlY3Qubm9kZXMudDtcblxuXHRpZiAodCAhPT0gbnVsbCkge1xuXHRcdGZvciAoY29uc3QgdHJhbnNpdGlvbiBvZiB0KSB7XG5cdFx0XHRpZiAodHJhbnNpdGlvbi5pc19nbG9iYWwgfHwgbG9jYWwpIHtcblx0XHRcdFx0dHJhbnNpdGlvbnMucHVzaCh0cmFuc2l0aW9uKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR2YXIgY2hpbGQgPSBlZmZlY3QuZmlyc3Q7XG5cblx0d2hpbGUgKGNoaWxkICE9PSBudWxsKSB7XG5cdFx0dmFyIHNpYmxpbmcgPSBjaGlsZC5uZXh0O1xuXG5cdFx0Ly8gSWYgdGhpcyBjaGlsZCBpcyBhIHJvb3QgZWZmZWN0LCB0aGVuIGl0IHdpbGwgYmVjb21lIGFuIGluZGVwZW5kZW50IHJvb3Qgd2hlbiBpdHMgcGFyZW50XG5cdFx0Ly8gaXMgZGVzdHJveWVkLCBpdCBzaG91bGQgdGhlcmVmb3JlIG5vdCBiZWNvbWUgaW5lcnQgbm9yIHBhcnRha2UgaW4gdHJhbnNpdGlvbnMuXG5cdFx0aWYgKChjaGlsZC5mICYgUk9PVF9FRkZFQ1QpID09PSAwKSB7XG5cdFx0XHR2YXIgdHJhbnNwYXJlbnQgPVxuXHRcdFx0XHQoY2hpbGQuZiAmIEVGRkVDVF9UUkFOU1BBUkVOVCkgIT09IDAgfHxcblx0XHRcdFx0Ly8gSWYgdGhpcyBpcyBhIGJyYW5jaCBlZmZlY3Qgd2l0aG91dCBhIGJsb2NrIGVmZmVjdCBwYXJlbnQsXG5cdFx0XHRcdC8vIGl0IG1lYW5zIHRoZSBwYXJlbnQgYmxvY2sgZWZmZWN0IHdhcyBwcnVuZWQuIEluIHRoYXQgY2FzZSxcblx0XHRcdFx0Ly8gdHJhbnNwYXJlbmN5IGluZm9ybWF0aW9uIHdhcyB0cmFuc2ZlcnJlZCB0byB0aGUgYnJhbmNoIGVmZmVjdC5cblx0XHRcdFx0KChjaGlsZC5mICYgQlJBTkNIX0VGRkVDVCkgIT09IDAgJiYgKGVmZmVjdC5mICYgQkxPQ0tfRUZGRUNUKSAhPT0gMCk7XG5cdFx0XHQvLyBUT0RPIHdlIGRvbid0IG5lZWQgdG8gY2FsbCBwYXVzZV9jaGlsZHJlbiByZWN1cnNpdmVseSB3aXRoIGEgbGlua2VkIGxpc3QgaW4gcGxhY2Vcblx0XHRcdC8vIGl0J3Mgc2xpZ2h0bHkgbW9yZSBpbnZvbHZlZCB0aG91Z2ggYXMgd2UgaGF2ZSB0byBhY2NvdW50IGZvciBgdHJhbnNwYXJlbnRgIGNoYW5naW5nXG5cdFx0XHQvLyB0aHJvdWdoIHRoZSB0cmVlLlxuXHRcdFx0cGF1c2VfY2hpbGRyZW4oY2hpbGQsIHRyYW5zaXRpb25zLCB0cmFuc3BhcmVudCA/IGxvY2FsIDogZmFsc2UpO1xuXHRcdH1cblxuXHRcdGNoaWxkID0gc2libGluZztcblx0fVxufVxuXG4vKipcbiAqIFRoZSBvcHBvc2l0ZSBvZiBgcGF1c2VfZWZmZWN0YC4gV2UgY2FsbCB0aGlzIGlmIChmb3IgZXhhbXBsZSlcbiAqIGB4YCBiZWNvbWVzIGZhbHN5IHRoZW4gdHJ1dGh5OiBgeyNpZiB4fS4uLnsvaWZ9YFxuICogQHBhcmFtIHtFZmZlY3R9IGVmZmVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzdW1lX2VmZmVjdChlZmZlY3QpIHtcblx0ZWZmZWN0LmYgJj0gflBBVVNFRDtcblx0cmVzdW1lX2NoaWxkcmVuKGVmZmVjdCwgdHJ1ZSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtFZmZlY3R9IGVmZmVjdFxuICogQHBhcmFtIHtib29sZWFufSBsb2NhbFxuICovXG5mdW5jdGlvbiByZXN1bWVfY2hpbGRyZW4oZWZmZWN0LCBsb2NhbCkge1xuXHQvLyB0aGlzIHN1YnRyZWUgd2FzIHBhdXNlZCBmb3IgaXRzIG93biByZWFzb25zIChlLmcuIGEgYmxvY2sgd2hvc2UgY29uZGl0aW9uXG5cdC8vIGlzIHN0aWxsIGZhbHNlKSDigJQgaXRzIGNvbnRyb2xsZXIgd2lsbCByZXN1bWUgb3IgZGVzdHJveSBpdFxuXHRpZiAoKGVmZmVjdC5mICYgUEFVU0VEKSAhPT0gMCkgcmV0dXJuO1xuXG5cdGlmICgoZWZmZWN0LmYgJiBJTkVSVCkgPT09IDApIHJldHVybjtcblx0ZWZmZWN0LmYgXj0gSU5FUlQ7XG5cblx0Ly8gSWYgYSBkZXBlbmRlbmN5IG9mIHRoaXMgZWZmZWN0IGNoYW5nZWQgd2hpbGUgaXQgd2FzIHBhdXNlZCxcblx0Ly8gc2NoZWR1bGUgdGhlIGVmZmVjdCB0byB1cGRhdGUuIHdlIGRvbid0IHVzZSBgaXNfZGlydHlgXG5cdC8vIGhlcmUgYmVjYXVzZSB3ZSBkb24ndCB3YW50IHRvIGVhZ2VybHkgcmVjb21wdXRlIGEgZGVyaXZlZCBsaWtlXG5cdC8vIGB7I2lmIGZvb317Zm9vLmJhcigpfXsvaWZ9YCBpZiBgZm9vYCBpcyBub3cgYHVuZGVmaW5lZFxuXHRpZiAoKGVmZmVjdC5mICYgQ0xFQU4pID09PSAwKSB7XG5cdFx0c2V0X3NpZ25hbF9zdGF0dXMoZWZmZWN0LCBESVJUWSk7XG5cdFx0QmF0Y2guZW5zdXJlKCkuc2NoZWR1bGUoZWZmZWN0KTsgLy8gQXNzdW1wdGlvbjogVGhpcyBoYXBwZW5zIGR1cmluZyB0aGUgY29tbWl0IHBoYXNlIG9mIHRoZSBiYXRjaCwgY2F1c2luZyBhbm90aGVyIGZsdXNoLCBidXQgaXQncyBzYWZlXG5cdH1cblxuXHR2YXIgY2hpbGQgPSBlZmZlY3QuZmlyc3Q7XG5cblx0d2hpbGUgKGNoaWxkICE9PSBudWxsKSB7XG5cdFx0dmFyIHNpYmxpbmcgPSBjaGlsZC5uZXh0O1xuXHRcdHZhciB0cmFuc3BhcmVudCA9IChjaGlsZC5mICYgRUZGRUNUX1RSQU5TUEFSRU5UKSAhPT0gMCB8fCAoY2hpbGQuZiAmIEJSQU5DSF9FRkZFQ1QpICE9PSAwO1xuXHRcdC8vIFRPRE8gd2UgZG9uJ3QgbmVlZCB0byBjYWxsIHJlc3VtZV9jaGlsZHJlbiByZWN1cnNpdmVseSB3aXRoIGEgbGlua2VkIGxpc3QgaW4gcGxhY2Vcblx0XHQvLyBpdCdzIHNsaWdodGx5IG1vcmUgaW52b2x2ZWQgdGhvdWdoIGFzIHdlIGhhdmUgdG8gYWNjb3VudCBmb3IgYHRyYW5zcGFyZW50YCBjaGFuZ2luZ1xuXHRcdC8vIHRocm91Z2ggdGhlIHRyZWUuXG5cdFx0cmVzdW1lX2NoaWxkcmVuKGNoaWxkLCB0cmFuc3BhcmVudCA/IGxvY2FsIDogZmFsc2UpO1xuXHRcdGNoaWxkID0gc2libGluZztcblx0fVxuXG5cdHZhciB0ID0gZWZmZWN0Lm5vZGVzICYmIGVmZmVjdC5ub2Rlcy50O1xuXG5cdGlmICh0ICE9PSBudWxsKSB7XG5cdFx0Zm9yIChjb25zdCB0cmFuc2l0aW9uIG9mIHQpIHtcblx0XHRcdGlmICh0cmFuc2l0aW9uLmlzX2dsb2JhbCB8fCBsb2NhbCkge1xuXHRcdFx0XHR0cmFuc2l0aW9uLmluKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhYm9ydGVkKGVmZmVjdCA9IC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAoYWN0aXZlX2VmZmVjdCkpIHtcblx0cmV0dXJuIChlZmZlY3QuZiAmIERFU1RST1lFRCkgIT09IDA7XG59XG5cbi8qKlxuICogQHBhcmFtIHtFZmZlY3R9IGVmZmVjdFxuICogQHBhcmFtIHtEb2N1bWVudEZyYWdtZW50fSBmcmFnbWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gbW92ZV9lZmZlY3QoZWZmZWN0LCBmcmFnbWVudCkge1xuXHRpZiAoIWVmZmVjdC5ub2RlcykgcmV0dXJuO1xuXG5cdC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlIHwgbnVsbH0gKi9cblx0dmFyIG5vZGUgPSBlZmZlY3Qubm9kZXMuc3RhcnQ7XG5cdHZhciBlbmQgPSBlZmZlY3Qubm9kZXMuZW5kO1xuXG5cdHdoaWxlIChub2RlICE9PSBudWxsKSB7XG5cdFx0LyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGUgfCBudWxsfSAqL1xuXHRcdHZhciBuZXh0ID0gbm9kZSA9PT0gZW5kID8gbnVsbCA6IGdldF9uZXh0X3NpYmxpbmcobm9kZSk7XG5cblx0XHRmcmFnbWVudC5hcHBlbmQobm9kZSk7XG5cdFx0bm9kZSA9IG5leHQ7XG5cdH1cbn1cbiIsIi8qKiBAaW1wb3J0IHsgVmFsdWUgfSBmcm9tICcjY2xpZW50JyAqL1xuaW1wb3J0IHsgaW50ZXJuYWxfc2V0IH0gZnJvbSAnLi9yZWFjdGl2aXR5L3NvdXJjZXMuanMnO1xuaW1wb3J0IHsgdW50cmFjayB9IGZyb20gJy4vcnVudGltZS5qcyc7XG5cbi8qKlxuICogQHR5cGUge1NldDxWYWx1ZT4gfCBudWxsfVxuICogQGRlcHJlY2F0ZWRcbiAqL1xuZXhwb3J0IGxldCBjYXB0dXJlZF9zaWduYWxzID0gbnVsbDtcblxuLyoqXG4gKiBDYXB0dXJlIGFuIGFycmF5IG9mIGFsbCB0aGUgc2lnbmFscyB0aGF0IGFyZSByZWFkIHdoZW4gYGZuYCBpcyBjYWxsZWRcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0geygpID0+IFR9IGZuXG4gKi9cbmZ1bmN0aW9uIGNhcHR1cmVfc2lnbmFscyhmbikge1xuXHR2YXIgcHJldmlvdXNfY2FwdHVyZWRfc2lnbmFscyA9IGNhcHR1cmVkX3NpZ25hbHM7XG5cblx0dHJ5IHtcblx0XHRjYXB0dXJlZF9zaWduYWxzID0gbmV3IFNldCgpO1xuXG5cdFx0dW50cmFjayhmbik7XG5cblx0XHRpZiAocHJldmlvdXNfY2FwdHVyZWRfc2lnbmFscyAhPT0gbnVsbCkge1xuXHRcdFx0Zm9yICh2YXIgc2lnbmFsIG9mIGNhcHR1cmVkX3NpZ25hbHMpIHtcblx0XHRcdFx0cHJldmlvdXNfY2FwdHVyZWRfc2lnbmFscy5hZGQoc2lnbmFsKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY2FwdHVyZWRfc2lnbmFscztcblx0fSBmaW5hbGx5IHtcblx0XHRjYXB0dXJlZF9zaWduYWxzID0gcHJldmlvdXNfY2FwdHVyZWRfc2lnbmFscztcblx0fVxufVxuXG4vKipcbiAqIEludm9rZXMgYSBmdW5jdGlvbiBhbmQgY2FwdHVyZXMgYWxsIHNpZ25hbHMgdGhhdCBhcmUgcmVhZCBkdXJpbmcgdGhlIGludm9jYXRpb24sXG4gKiB0aGVuIGludmFsaWRhdGVzIHRoZW0uXG4gKiBAcGFyYW0geygpID0+IGFueX0gZm5cbiAqIEBkZXByZWNhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZhbGlkYXRlX2lubmVyX3NpZ25hbHMoZm4pIHtcblx0Zm9yICh2YXIgc2lnbmFsIG9mIGNhcHR1cmVfc2lnbmFscyhmbikpIHtcblx0XHRpbnRlcm5hbF9zZXQoc2lnbmFsLCBzaWduYWwudik7XG5cdH1cbn1cbiIsIi8qKiBAaW1wb3J0IHsgRGVyaXZlZCwgRWZmZWN0LCBSZWFjdGlvbiwgU291cmNlLCBWYWx1ZSB9IGZyb20gJyNjbGllbnQnICovXG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7IGdldF9kZXNjcmlwdG9ycywgZ2V0X3Byb3RvdHlwZV9vZiwgaW5jbHVkZXMsIGluZGV4X29mIH0gZnJvbSAnLi4vc2hhcmVkL3V0aWxzLmpzJztcbmltcG9ydCB7XG5cdGRlc3Ryb3lfYmxvY2tfZWZmZWN0X2NoaWxkcmVuLFxuXHRkZXN0cm95X2VmZmVjdF9jaGlsZHJlbixcblx0ZWZmZWN0X3RyYWNraW5nLFxuXHRleGVjdXRlX2VmZmVjdF90ZWFyZG93blxufSBmcm9tICcuL3JlYWN0aXZpdHkvZWZmZWN0cy5qcyc7XG5pbXBvcnQge1xuXHRESVJUWSxcblx0TUFZQkVfRElSVFksXG5cdENMRUFOLFxuXHRERVJJVkVELFxuXHRERVNUUk9ZRUQsXG5cdEJSQU5DSF9FRkZFQ1QsXG5cdFNUQVRFX1NZTUJPTCxcblx0QkxPQ0tfRUZGRUNULFxuXHRST09UX0VGRkVDVCxcblx0Q09OTkVDVEVELFxuXHRSRUFDVElPTl9JU19VUERBVElORyxcblx0U1RBTEVfUkVBQ1RJT04sXG5cdEVSUk9SX1ZBTFVFLFxuXHRNQU5BR0VEX0VGRkVDVCxcblx0UkVBQ1RJT05fUkFOXG59IGZyb20gJy4vY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IG9sZF92YWx1ZXMgfSBmcm9tICcuL3JlYWN0aXZpdHkvc291cmNlcy5qcyc7XG5pbXBvcnQge1xuXHRyZWFjdGl2aXR5X2xvc3NfdHJhY2tlcixcblx0ZXhlY3V0ZV9kZXJpdmVkLFxuXHRmcmVlemVfZGVyaXZlZF9lZmZlY3RzLFxuXHRyZWNlbnRfYXN5bmNfZGVyaXZlZHMsXG5cdHVuZnJlZXplX2Rlcml2ZWRfZWZmZWN0cyxcblx0dXBkYXRlX2Rlcml2ZWRcbn0gZnJvbSAnLi9yZWFjdGl2aXR5L2Rlcml2ZWRzLmpzJztcbmltcG9ydCB7IGFzeW5jX21vZGVfZmxhZywgdHJhY2luZ19tb2RlX2ZsYWcgfSBmcm9tICcuLi9mbGFncy9pbmRleC5qcyc7XG5pbXBvcnQgeyB0cmFjaW5nX2V4cHJlc3Npb25zIH0gZnJvbSAnLi9kZXYvdHJhY2luZy5qcyc7XG5pbXBvcnQgeyBnZXRfZXJyb3IgfSBmcm9tICcuLi9zaGFyZWQvZGV2LmpzJztcbmltcG9ydCB7XG5cdGNvbXBvbmVudF9jb250ZXh0LFxuXHRkZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb24sXG5cdGRldl9zdGFjayxcblx0aXNfcnVuZXMsXG5cdHNldF9jb21wb25lbnRfY29udGV4dCxcblx0c2V0X2Rldl9jdXJyZW50X2NvbXBvbmVudF9mdW5jdGlvbixcblx0c2V0X2Rldl9zdGFja1xufSBmcm9tICcuL2NvbnRleHQuanMnO1xuaW1wb3J0IHtcblx0QmF0Y2gsXG5cdGJhdGNoX3ZhbHVlcyxcblx0Y3VycmVudF9iYXRjaCxcblx0Zmx1c2hTeW5jLFxuXHRwcmV2aW91c19iYXRjaCxcblx0c2NoZWR1bGVfZWZmZWN0XG59IGZyb20gJy4vcmVhY3Rpdml0eS9iYXRjaC5qcyc7XG5pbXBvcnQgeyBoYW5kbGVfZXJyb3IgfSBmcm9tICcuL2Vycm9yLWhhbmRsaW5nLmpzJztcbmltcG9ydCB7IFVOSU5JVElBTElaRUQgfSBmcm9tICcuLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgY2FwdHVyZWRfc2lnbmFscyB9IGZyb20gJy4vbGVnYWN5LmpzJztcbmltcG9ydCB7IHdpdGhvdXRfcmVhY3RpdmVfY29udGV4dCB9IGZyb20gJy4vZG9tL2VsZW1lbnRzL2JpbmRpbmdzL3NoYXJlZC5qcyc7XG5pbXBvcnQgeyBzZXRfc2lnbmFsX3N0YXR1cywgdXBkYXRlX2Rlcml2ZWRfc3RhdHVzIH0gZnJvbSAnLi9yZWFjdGl2aXR5L3N0YXR1cy5qcyc7XG5pbXBvcnQgKiBhcyB3IGZyb20gJy4vd2FybmluZ3MuanMnO1xuXG5leHBvcnQgbGV0IGlzX2Rlc3Ryb3lpbmdfZWZmZWN0ID0gZmFsc2U7XG5cbi8qKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlICovXG5leHBvcnQgZnVuY3Rpb24gc2V0X2lzX2Rlc3Ryb3lpbmdfZWZmZWN0KHZhbHVlKSB7XG5cdGlzX2Rlc3Ryb3lpbmdfZWZmZWN0ID0gdmFsdWU7XG59XG5cbi8qKiBAdHlwZSB7bnVsbCB8IFJlYWN0aW9ufSAqL1xuZXhwb3J0IGxldCBhY3RpdmVfcmVhY3Rpb24gPSBudWxsO1xuXG5leHBvcnQgbGV0IHVudHJhY2tpbmcgPSBmYWxzZTtcblxuLyoqIEBwYXJhbSB7bnVsbCB8IFJlYWN0aW9ufSByZWFjdGlvbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldF9hY3RpdmVfcmVhY3Rpb24ocmVhY3Rpb24pIHtcblx0YWN0aXZlX3JlYWN0aW9uID0gcmVhY3Rpb247XG59XG5cbi8qKiBAdHlwZSB7bnVsbCB8IEVmZmVjdH0gKi9cbmV4cG9ydCBsZXQgYWN0aXZlX2VmZmVjdCA9IG51bGw7XG5cbi8qKiBAcGFyYW0ge251bGwgfCBFZmZlY3R9IGVmZmVjdCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldF9hY3RpdmVfZWZmZWN0KGVmZmVjdCkge1xuXHRhY3RpdmVfZWZmZWN0ID0gZWZmZWN0O1xufVxuXG4vKipcbiAqIFdoZW4gc291cmNlcyBhcmUgY3JlYXRlZCB3aXRoaW4gYSByZWFjdGlvbiwgcmVhZGluZyBhbmQgd3JpdGluZ1xuICogdGhlbSB3aXRoaW4gdGhhdCByZWFjdGlvbiBzaG91bGQgbm90IGNhdXNlIGEgcmUtcnVuXG4gKiBAdHlwZSB7bnVsbCB8IFNldDxWYWx1ZT59XG4gKi9cbmV4cG9ydCBsZXQgY3VycmVudF9zb3VyY2VzID0gbnVsbDtcblxuLyoqIEBwYXJhbSB7VmFsdWV9IHZhbHVlICovXG5leHBvcnQgZnVuY3Rpb24gcHVzaF9yZWFjdGlvbl92YWx1ZSh2YWx1ZSkge1xuXHRpZiAoXG5cdFx0YWN0aXZlX3JlYWN0aW9uICE9PSBudWxsICYmXG5cdFx0KCghYXN5bmNfbW9kZV9mbGFnICYmIChhY3RpdmVfcmVhY3Rpb24uZiAmIFJFQUNUSU9OX0lTX1VQREFUSU5HKSAhPT0gMCkgfHxcblx0XHRcdChhY3RpdmVfcmVhY3Rpb24uZiAmIERFUklWRUQpICE9PSAwKVxuXHQpIHtcblx0XHQoY3VycmVudF9zb3VyY2VzID8/PSBuZXcgU2V0KCkpLmFkZCh2YWx1ZSk7XG5cdH1cbn1cblxuLyoqXG4gKiBUaGUgZGVwZW5kZW5jaWVzIG9mIHRoZSByZWFjdGlvbiB0aGF0IGlzIGN1cnJlbnRseSBiZWluZyBleGVjdXRlZC4gSW4gbWFueSBjYXNlcyxcbiAqIHRoZSBkZXBlbmRlbmNpZXMgYXJlIHVuY2hhbmdlZCBiZXR3ZWVuIHJ1bnMsIGFuZCBzbyB0aGlzIHdpbGwgYmUgYG51bGxgIHVubGVzc1xuICogYW5kIHVudGlsIGEgbmV3IGRlcGVuZGVuY3kgaXMgYWNjZXNzZWQg4oCUIHdlIHRyYWNrIHRoaXMgdmlhIGBza2lwcGVkX2RlcHNgXG4gKiBAdHlwZSB7bnVsbCB8IFZhbHVlW119XG4gKi9cbmV4cG9ydCBsZXQgbmV3X2RlcHMgPSBudWxsO1xuXG5leHBvcnQgbGV0IHNraXBwZWRfZGVwcyA9IDA7XG5cbi8qKlxuICogVHJhY2tzIHdyaXRlcyB0aGF0IHRoZSBlZmZlY3QgaXQncyBleGVjdXRlZCBpbiBkb2Vzbid0IGxpc3RlbiB0byB5ZXQsXG4gKiBzbyB0aGF0IHRoZSBkZXBlbmRlbmN5IGNhbiBiZSBhZGRlZCB0byB0aGUgZWZmZWN0IGxhdGVyIG9uIGlmIGl0IHRoZW4gcmVhZHMgaXRcbiAqIEB0eXBlIHtudWxsIHwgVmFsdWVbXX1cbiAqL1xuZXhwb3J0IGxldCB1bnRyYWNrZWRfd3JpdGVzID0gbnVsbDtcblxuLyoqIEBwYXJhbSB7bnVsbCB8IFZhbHVlW119IHZhbHVlICovXG5leHBvcnQgZnVuY3Rpb24gc2V0X3VudHJhY2tlZF93cml0ZXModmFsdWUpIHtcblx0dW50cmFja2VkX3dyaXRlcyA9IHZhbHVlO1xufVxuXG4vKipcbiAqIEB0eXBlIHtudW1iZXJ9IFVzZWQgYnkgc291cmNlcyBhbmQgZGVyaXZlZHMgZm9yIGhhbmRsaW5nIHVwZGF0ZXMuXG4gKiBWZXJzaW9uIHN0YXJ0cyBmcm9tIDEgc28gdGhhdCB1bm93bmVkIGRlcml2ZWRzIGRpZmZlcmVudGlhdGUgYmV0d2VlbiBhIGNyZWF0ZWQgZWZmZWN0IGFuZCBhIHJ1biBvbmUgZm9yIHRyYWNpbmdcbiAqKi9cbmV4cG9ydCBsZXQgd3JpdGVfdmVyc2lvbiA9IDE7XG5cbi8qKiBAdHlwZSB7bnVtYmVyfSBVc2VkIHRvIHZlcnNpb24gZWFjaCByZWFkIG9mIGEgc291cmNlIG9mIGRlcml2ZWQgdG8gYXZvaWQgZHVwbGljYXRpbmcgZGVwZW5kZW5jaWVzIGluc2lkZSBhIHJlYWN0aW9uICovXG5sZXQgcmVhZF92ZXJzaW9uID0gMDtcblxuZXhwb3J0IGxldCB1cGRhdGVfdmVyc2lvbiA9IHJlYWRfdmVyc2lvbjtcblxuLyoqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldF91cGRhdGVfdmVyc2lvbih2YWx1ZSkge1xuXHR1cGRhdGVfdmVyc2lvbiA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50X3dyaXRlX3ZlcnNpb24oKSB7XG5cdHJldHVybiArK3dyaXRlX3ZlcnNpb247XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgZGVyaXZlZCBvciBlZmZlY3QgaXMgZGlydHkuXG4gKiBJZiBpdCBpcyBNQVlCRV9ESVJUWSwgd2lsbCBzZXQgdGhlIHN0YXR1cyB0byBDTEVBTlxuICogQHBhcmFtIHtSZWFjdGlvbn0gcmVhY3Rpb25cbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNfZGlydHkocmVhY3Rpb24pIHtcblx0dmFyIGZsYWdzID0gcmVhY3Rpb24uZjtcblxuXHRpZiAoKGZsYWdzICYgRElSVFkpICE9PSAwKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRpZiAoKGZsYWdzICYgTUFZQkVfRElSVFkpICE9PSAwKSB7XG5cdFx0dmFyIGRlcGVuZGVuY2llcyA9IC8qKiBAdHlwZSB7VmFsdWVbXX0gKi8gKHJlYWN0aW9uLmRlcHMpO1xuXHRcdHZhciBsZW5ndGggPSBkZXBlbmRlbmNpZXMubGVuZ3RoO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGRlcGVuZGVuY3kgPSBkZXBlbmRlbmNpZXNbaV07XG5cblx0XHRcdGlmIChpc19kaXJ0eSgvKiogQHR5cGUge0Rlcml2ZWR9ICovIChkZXBlbmRlbmN5KSkpIHtcblx0XHRcdFx0dXBkYXRlX2Rlcml2ZWQoLyoqIEB0eXBlIHtEZXJpdmVkfSAqLyAoZGVwZW5kZW5jeSkpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGVwZW5kZW5jeS53diA+IHJlYWN0aW9uLnd2KSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChcblx0XHRcdChmbGFncyAmIENPTk5FQ1RFRCkgIT09IDAgJiZcblx0XHRcdC8vIER1cmluZyB0aW1lIHRyYXZlbGluZyB3ZSBkb24ndCB3YW50IHRvIHJlc2V0IHRoZSBzdGF0dXMgc28gdGhhdFxuXHRcdFx0Ly8gdHJhdmVyc2FsIG9mIHRoZSBncmFwaCBpbiB0aGUgb3RoZXIgYmF0Y2hlcyBzdGlsbCBoYXBwZW5zXG5cdFx0XHRiYXRjaF92YWx1ZXMgPT09IG51bGxcblx0XHQpIHtcblx0XHRcdHNldF9zaWduYWxfc3RhdHVzKHJlYWN0aW9uLCBDTEVBTik7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7VmFsdWV9IHNpZ25hbFxuICogQHBhcmFtIHtFZmZlY3R9IGVmZmVjdFxuICogQHBhcmFtIHtib29sZWFufSBbcm9vdF1cbiAqL1xuZnVuY3Rpb24gc2NoZWR1bGVfcG9zc2libGVfZWZmZWN0X3NlbGZfaW52YWxpZGF0aW9uKHNpZ25hbCwgZWZmZWN0LCByb290ID0gdHJ1ZSkge1xuXHR2YXIgcmVhY3Rpb25zID0gc2lnbmFsLnJlYWN0aW9ucztcblx0aWYgKHJlYWN0aW9ucyA9PT0gbnVsbCkgcmV0dXJuO1xuXG5cdGlmICghYXN5bmNfbW9kZV9mbGFnICYmIGN1cnJlbnRfc291cmNlcyAhPT0gbnVsbCAmJiBjdXJyZW50X3NvdXJjZXMuaGFzKHNpZ25hbCkpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuXHRcdHZhciByZWFjdGlvbiA9IHJlYWN0aW9uc1tpXTtcblxuXHRcdGlmICgocmVhY3Rpb24uZiAmIERFUklWRUQpICE9PSAwKSB7XG5cdFx0XHRzY2hlZHVsZV9wb3NzaWJsZV9lZmZlY3Rfc2VsZl9pbnZhbGlkYXRpb24oLyoqIEB0eXBlIHtEZXJpdmVkfSAqLyAocmVhY3Rpb24pLCBlZmZlY3QsIGZhbHNlKTtcblx0XHR9IGVsc2UgaWYgKGVmZmVjdCA9PT0gcmVhY3Rpb24pIHtcblx0XHRcdGlmIChyb290KSB7XG5cdFx0XHRcdHNldF9zaWduYWxfc3RhdHVzKHJlYWN0aW9uLCBESVJUWSk7XG5cdFx0XHR9IGVsc2UgaWYgKChyZWFjdGlvbi5mICYgQ0xFQU4pICE9PSAwKSB7XG5cdFx0XHRcdHNldF9zaWduYWxfc3RhdHVzKHJlYWN0aW9uLCBNQVlCRV9ESVJUWSk7XG5cdFx0XHR9XG5cdFx0XHRzY2hlZHVsZV9lZmZlY3QoLyoqIEB0eXBlIHtFZmZlY3R9ICovIChyZWFjdGlvbikpO1xuXHRcdH1cblx0fVxufVxuXG4vKiogQHBhcmFtIHtSZWFjdGlvbn0gcmVhY3Rpb24gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVfcmVhY3Rpb24ocmVhY3Rpb24pIHtcblx0dmFyIHByZXZpb3VzX2RlcHMgPSBuZXdfZGVwcztcblx0dmFyIHByZXZpb3VzX3NraXBwZWRfZGVwcyA9IHNraXBwZWRfZGVwcztcblx0dmFyIHByZXZpb3VzX3VudHJhY2tlZF93cml0ZXMgPSB1bnRyYWNrZWRfd3JpdGVzO1xuXHR2YXIgcHJldmlvdXNfcmVhY3Rpb24gPSBhY3RpdmVfcmVhY3Rpb247XG5cdHZhciBwcmV2aW91c19zb3VyY2VzID0gY3VycmVudF9zb3VyY2VzO1xuXHR2YXIgcHJldmlvdXNfY29tcG9uZW50X2NvbnRleHQgPSBjb21wb25lbnRfY29udGV4dDtcblx0dmFyIHByZXZpb3VzX3VudHJhY2tpbmcgPSB1bnRyYWNraW5nO1xuXHR2YXIgcHJldmlvdXNfdXBkYXRlX3ZlcnNpb24gPSB1cGRhdGVfdmVyc2lvbjtcblxuXHR2YXIgZmxhZ3MgPSByZWFjdGlvbi5mO1xuXG5cdG5ld19kZXBzID0gLyoqIEB0eXBlIHtudWxsIHwgVmFsdWVbXX0gKi8gKG51bGwpO1xuXHRza2lwcGVkX2RlcHMgPSAwO1xuXHR1bnRyYWNrZWRfd3JpdGVzID0gbnVsbDtcblx0YWN0aXZlX3JlYWN0aW9uID0gKGZsYWdzICYgKEJSQU5DSF9FRkZFQ1QgfCBST09UX0VGRkVDVCkpID09PSAwID8gcmVhY3Rpb24gOiBudWxsO1xuXG5cdGN1cnJlbnRfc291cmNlcyA9IG51bGw7XG5cdHNldF9jb21wb25lbnRfY29udGV4dChyZWFjdGlvbi5jdHgpO1xuXHR1bnRyYWNraW5nID0gZmFsc2U7XG5cdHVwZGF0ZV92ZXJzaW9uID0gKytyZWFkX3ZlcnNpb247XG5cblx0aWYgKHJlYWN0aW9uLmFjICE9PSBudWxsKSB7XG5cdFx0d2l0aG91dF9yZWFjdGl2ZV9jb250ZXh0KCgpID0+IHtcblx0XHRcdC8qKiBAdHlwZSB7QWJvcnRDb250cm9sbGVyfSAqLyAocmVhY3Rpb24uYWMpLmFib3J0KFNUQUxFX1JFQUNUSU9OKTtcblx0XHR9KTtcblxuXHRcdHJlYWN0aW9uLmFjID0gbnVsbDtcblx0fVxuXG5cdHRyeSB7XG5cdFx0cmVhY3Rpb24uZiB8PSBSRUFDVElPTl9JU19VUERBVElORztcblx0XHR2YXIgZm4gPSAvKiogQHR5cGUge0Z1bmN0aW9ufSAqLyAocmVhY3Rpb24uZm4pO1xuXHRcdHZhciByZXN1bHQgPSBmbigpO1xuXHRcdHJlYWN0aW9uLmYgfD0gUkVBQ1RJT05fUkFOO1xuXHRcdHZhciBkZXBzID0gdXBkYXRlX2RlcGVuZGVuY2llcyhyZWFjdGlvbik7XG5cblx0XHQvLyBJZiB3ZSdyZSBpbnNpZGUgYW4gZWZmZWN0IGFuZCB3ZSBoYXZlIHVudHJhY2tlZCB3cml0ZXMsIHRoZW4gd2UgbmVlZCB0b1xuXHRcdC8vIGVuc3VyZSB0aGF0IGlmIGFueSBvZiB0aG9zZSB1bnRyYWNrZWQgd3JpdGVzIHJlc3VsdCBpbiByZS1pbnZhbGlkYXRpb25cblx0XHQvLyBvZiB0aGUgY3VycmVudCBlZmZlY3QsIHRoZW4gdGhhdCBoYXBwZW5zIGFjY29yZGluZ2x5XG5cdFx0aWYgKFxuXHRcdFx0aXNfcnVuZXMoKSAmJlxuXHRcdFx0dW50cmFja2VkX3dyaXRlcyAhPT0gbnVsbCAmJlxuXHRcdFx0IXVudHJhY2tpbmcgJiZcblx0XHRcdGRlcHMgIT09IG51bGwgJiZcblx0XHRcdChyZWFjdGlvbi5mICYgKERFUklWRUQgfCBNQVlCRV9ESVJUWSB8IERJUlRZKSkgPT09IDBcblx0XHQpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgLyoqIEB0eXBlIHtTb3VyY2VbXX0gKi8gKHVudHJhY2tlZF93cml0ZXMpLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHNjaGVkdWxlX3Bvc3NpYmxlX2VmZmVjdF9zZWxmX2ludmFsaWRhdGlvbihcblx0XHRcdFx0XHR1bnRyYWNrZWRfd3JpdGVzW2ldLFxuXHRcdFx0XHRcdC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAocmVhY3Rpb24pXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSWYgd2UgYXJlIHJldHVybmluZyB0byBhbiBwcmV2aW91cyByZWFjdGlvbiB0aGVuXG5cdFx0Ly8gd2UgbmVlZCB0byBpbmNyZW1lbnQgdGhlIHJlYWQgdmVyc2lvbiB0byBlbnN1cmUgdGhhdFxuXHRcdC8vIGFueSBkZXBlbmRlbmNpZXMgaW4gdGhpcyByZWFjdGlvbiBhcmVuJ3QgbWFya2VkIHdpdGhcblx0XHQvLyB0aGUgc2FtZSB2ZXJzaW9uXG5cdFx0aWYgKHByZXZpb3VzX3JlYWN0aW9uICE9PSBudWxsICYmIHByZXZpb3VzX3JlYWN0aW9uICE9PSByZWFjdGlvbikge1xuXHRcdFx0cmVhZF92ZXJzaW9uKys7XG5cblx0XHRcdC8vIHVwZGF0ZSB0aGUgYHJ2YCBvZiB0aGUgcHJldmlvdXMgcmVhY3Rpb24ncyBkZXBzIOKAlCBib3RoIGV4aXN0aW5nIGFuZCBuZXcg4oCUXG5cdFx0XHQvLyBzbyB0aGF0IHRoZXkgYXJlIG5vdCBhZGRlZCBhZ2FpblxuXHRcdFx0aWYgKHByZXZpb3VzX3JlYWN0aW9uLmRlcHMgIT09IG51bGwpIHtcblx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBwcmV2aW91c19za2lwcGVkX2RlcHM7IGkgKz0gMSkge1xuXHRcdFx0XHRcdHByZXZpb3VzX3JlYWN0aW9uLmRlcHNbaV0ucnYgPSByZWFkX3ZlcnNpb247XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKHByZXZpb3VzX2RlcHMgIT09IG51bGwpIHtcblx0XHRcdFx0Zm9yIChjb25zdCBkZXAgb2YgcHJldmlvdXNfZGVwcykge1xuXHRcdFx0XHRcdGRlcC5ydiA9IHJlYWRfdmVyc2lvbjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAodW50cmFja2VkX3dyaXRlcyAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAocHJldmlvdXNfdW50cmFja2VkX3dyaXRlcyA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdHByZXZpb3VzX3VudHJhY2tlZF93cml0ZXMgPSB1bnRyYWNrZWRfd3JpdGVzO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHByZXZpb3VzX3VudHJhY2tlZF93cml0ZXMucHVzaCguLi4vKiogQHR5cGUge1NvdXJjZVtdfSAqLyAodW50cmFja2VkX3dyaXRlcykpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKChyZWFjdGlvbi5mICYgRVJST1JfVkFMVUUpICE9PSAwKSB7XG5cdFx0XHRyZWFjdGlvbi5mIF49IEVSUk9SX1ZBTFVFO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gc3RpbGwgY29tbWl0IHRoZSBkZXBzIHJlYWQgYmVmb3JlIHRoZSB0aHJvdywgb3RoZXJ3aXNlIGRlcml2ZWRzIGNvbm5lY3RlZCBieSB0aGlzIHJ1biBrZWVwIG5vIHJlYWRlciBhbmQgdGhlIHJlYWN0aW9uIG5ldmVyIHJlLXJ1bnMgd2hlbiB0aGV5IGNoYW5nZVxuXHRcdHVwZGF0ZV9kZXBlbmRlbmNpZXMocmVhY3Rpb24pO1xuXG5cdFx0cmV0dXJuIGhhbmRsZV9lcnJvcihlcnJvcik7XG5cdH0gZmluYWxseSB7XG5cdFx0cmVhY3Rpb24uZiBePSBSRUFDVElPTl9JU19VUERBVElORztcblx0XHRuZXdfZGVwcyA9IHByZXZpb3VzX2RlcHM7XG5cdFx0c2tpcHBlZF9kZXBzID0gcHJldmlvdXNfc2tpcHBlZF9kZXBzO1xuXHRcdHVudHJhY2tlZF93cml0ZXMgPSBwcmV2aW91c191bnRyYWNrZWRfd3JpdGVzO1xuXHRcdGFjdGl2ZV9yZWFjdGlvbiA9IHByZXZpb3VzX3JlYWN0aW9uO1xuXHRcdGN1cnJlbnRfc291cmNlcyA9IHByZXZpb3VzX3NvdXJjZXM7XG5cdFx0c2V0X2NvbXBvbmVudF9jb250ZXh0KHByZXZpb3VzX2NvbXBvbmVudF9jb250ZXh0KTtcblx0XHR1bnRyYWNraW5nID0gcHJldmlvdXNfdW50cmFja2luZztcblx0XHR1cGRhdGVfdmVyc2lvbiA9IHByZXZpb3VzX3VwZGF0ZV92ZXJzaW9uO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWFjdGlvbn0gcmVhY3Rpb25cbiAqL1xuZnVuY3Rpb24gdXBkYXRlX2RlcGVuZGVuY2llcyhyZWFjdGlvbikge1xuXHR2YXIgZGVwcyA9IHJlYWN0aW9uLmRlcHM7XG5cblx0Ly8gRG9uJ3QgcmVtb3ZlIHJlYWN0aW9ucyBkdXJpbmcgZm9yaztcblx0Ly8gdGhleSBtdXN0IHJlbWFpbiBmb3Igd2hlbiBmb3JrIGlzIGRpc2NhcmRlZFxuXHR2YXIgaXNfZm9yayA9IGN1cnJlbnRfYmF0Y2g/LmlzX2Zvcms7XG5cblx0aWYgKG5ld19kZXBzICE9PSBudWxsKSB7XG5cdFx0dmFyIGk7XG5cblx0XHRpZiAoIWlzX2ZvcmspIHtcblx0XHRcdHJlbW92ZV9yZWFjdGlvbnMocmVhY3Rpb24sIHNraXBwZWRfZGVwcyk7XG5cdFx0fVxuXG5cdFx0aWYgKGRlcHMgIT09IG51bGwgJiYgc2tpcHBlZF9kZXBzID4gMCkge1xuXHRcdFx0ZGVwcy5sZW5ndGggPSBza2lwcGVkX2RlcHMgKyBuZXdfZGVwcy5sZW5ndGg7XG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgbmV3X2RlcHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0ZGVwc1tza2lwcGVkX2RlcHMgKyBpXSA9IG5ld19kZXBzW2ldO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZWFjdGlvbi5kZXBzID0gZGVwcyA9IG5ld19kZXBzO1xuXHRcdH1cblxuXHRcdGlmIChlZmZlY3RfdHJhY2tpbmcoKSAmJiAocmVhY3Rpb24uZiAmIENPTk5FQ1RFRCkgIT09IDApIHtcblx0XHRcdGZvciAoaSA9IHNraXBwZWRfZGVwczsgaSA8IGRlcHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0KGRlcHNbaV0ucmVhY3Rpb25zID8/PSBbXSkucHVzaChyZWFjdGlvbik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2UgaWYgKCFpc19mb3JrICYmIGRlcHMgIT09IG51bGwgJiYgc2tpcHBlZF9kZXBzIDwgZGVwcy5sZW5ndGgpIHtcblx0XHRyZW1vdmVfcmVhY3Rpb25zKHJlYWN0aW9uLCBza2lwcGVkX2RlcHMpO1xuXHRcdGRlcHMubGVuZ3RoID0gc2tpcHBlZF9kZXBzO1xuXHR9XG5cblx0cmV0dXJuIGRlcHM7XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIFZcbiAqIEBwYXJhbSB7UmVhY3Rpb259IHNpZ25hbFxuICogQHBhcmFtIHtWYWx1ZTxWPn0gZGVwZW5kZW5jeVxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIHJlbW92ZV9yZWFjdGlvbihzaWduYWwsIGRlcGVuZGVuY3kpIHtcblx0bGV0IHJlYWN0aW9ucyA9IGRlcGVuZGVuY3kucmVhY3Rpb25zO1xuXHRpZiAocmVhY3Rpb25zICE9PSBudWxsKSB7XG5cdFx0dmFyIGluZGV4ID0gaW5kZXhfb2YuY2FsbChyZWFjdGlvbnMsIHNpZ25hbCk7XG5cdFx0aWYgKGluZGV4ICE9PSAtMSkge1xuXHRcdFx0dmFyIG5ld19sZW5ndGggPSByZWFjdGlvbnMubGVuZ3RoIC0gMTtcblx0XHRcdGlmIChuZXdfbGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdHJlYWN0aW9ucyA9IGRlcGVuZGVuY3kucmVhY3Rpb25zID0gbnVsbDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFN3YXAgd2l0aCBsYXN0IGVsZW1lbnQgYW5kIHRoZW4gcmVtb3ZlLlxuXHRcdFx0XHRyZWFjdGlvbnNbaW5kZXhdID0gcmVhY3Rpb25zW25ld19sZW5ndGhdO1xuXHRcdFx0XHRyZWFjdGlvbnMucG9wKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gSWYgdGhlIGRlcml2ZWQgaGFzIG5vIHJlYWN0aW9ucywgdGhlbiB3ZSBjYW4gZGlzY29ubmVjdCBpdCBmcm9tIHRoZSBncmFwaCxcblx0Ly8gYWxsb3dpbmcgaXQgdG8gZWl0aGVyIHJlY29ubmVjdCBpbiB0aGUgZnV0dXJlLCBvciBiZSBHQydkIGJ5IHRoZSBWTS5cblx0aWYgKFxuXHRcdHJlYWN0aW9ucyA9PT0gbnVsbCAmJlxuXHRcdChkZXBlbmRlbmN5LmYgJiBERVJJVkVEKSAhPT0gMCAmJlxuXHRcdC8vIERlc3Ryb3lpbmcgYSBjaGlsZCBlZmZlY3Qgd2hpbGUgdXBkYXRpbmcgYSBwYXJlbnQgZWZmZWN0IGNhbiBjYXVzZSBhIGRlcGVuZGVuY3kgdG8gYXBwZWFyXG5cdFx0Ly8gdG8gYmUgdW51c2VkLCB3aGVuIGluIGZhY3QgaXQgaXMgdXNlZCBieSB0aGUgY3VycmVudGx5LXVwZGF0aW5nIHBhcmVudC4gQ2hlY2tpbmcgYG5ld19kZXBzYFxuXHRcdC8vIGFsbG93cyB1cyB0byBza2lwIHRoZSBleHBlbnNpdmUgd29yayBvZiBkaXNjb25uZWN0aW5nIGFuZCBpbW1lZGlhdGVseSByZWNvbm5lY3RpbmcgaXRcblx0XHQobmV3X2RlcHMgPT09IG51bGwgfHwgIWluY2x1ZGVzLmNhbGwobmV3X2RlcHMsIGRlcGVuZGVuY3kpKVxuXHQpIHtcblx0XHR2YXIgZGVyaXZlZCA9IC8qKiBAdHlwZSB7RGVyaXZlZH0gKi8gKGRlcGVuZGVuY3kpO1xuXG5cdFx0aWYgKChkZXJpdmVkLmYgJiBDT05ORUNURUQpICE9PSAwKSB7XG5cdFx0XHRkZXJpdmVkLmYgXj0gQ09OTkVDVEVEO1xuXHRcdH1cblxuXHRcdC8vIEluIGEgZm9yayBpdCdzIHBvc3NpYmxlIHRoYXQgYSBkZXJpdmVkIGlzIGV4ZWN1dGVkIGFuZCBnZXRzIHJlYWN0aW9ucywgdGhlbiBjb21taXRzLCBidXQgaXNcblx0XHQvLyBuZXZlciByZS1leGVjdXRlZC4gVGhpcyBpcyBwb3NzaWJsZSB3aGVuIHRoZSBkZXJpdmVkIGlzIG9ubHkgZXhlY3V0ZWQgb25jZSBpbiB0aGUgY29udGV4dFxuXHRcdC8vIG9mIGEgbmV3IGJyYW5jaCB3aGljaCBoYXBwZW5zIGJlZm9yZSBmb3JrLmNvbW1pdCgpIHJ1bnMuIEluIHRoaXMgY2FzZSwgdGhlIGRlcml2ZWQgc3RpbGwgaGFzXG5cdFx0Ly8gVU5JTklUSUFMSVpFRCBhcyBpdHMgdmFsdWUsIGFuZCB0aGVuIHdoZW4gaXQncyBsb3NpbmcgaXRzIHJlYWN0aW9ucyB3ZSBuZWVkIHRvIGVuc3VyZSBpdCBzdGF5c1xuXHRcdC8vIERJUlRZIHNvIGl0IGlzIHJlZXhlY3V0ZWQgb25jZSBzb21lb25lIHdhbnRzIGl0cyB2YWx1ZSBhZ2Fpbi5cblx0XHRpZiAoZGVyaXZlZC52ICE9PSBVTklOSVRJQUxJWkVEKSB7XG5cdFx0XHR1cGRhdGVfZGVyaXZlZF9zdGF0dXMoZGVyaXZlZCk7XG5cdFx0fVxuXG5cdFx0Ly8gQ2FsbCBhYm9ydCBjb250cm9sbGVyLCBub29uZSdzIGxpc3RlbmluZyB0byB0aGlzIGRlcml2ZWQgYW55bW9yZVxuXHRcdGlmIChkZXJpdmVkLmFjICE9PSBudWxsKSB7XG5cdFx0XHR3aXRob3V0X3JlYWN0aXZlX2NvbnRleHQoKCkgPT4ge1xuXHRcdFx0XHQvKiogQHR5cGUge0Fib3J0Q29udHJvbGxlcn0gKi8gKGRlcml2ZWQuYWMpLmFib3J0KFNUQUxFX1JFQUNUSU9OKTtcblx0XHRcdFx0ZGVyaXZlZC5hYyA9IG51bGw7XG5cdFx0XHRcdC8vIGVuc3VyZSBpdCByZXJ1bnMgcmlnaHQgYXdheSBuZXh0IHRpbWUgaW5zdGVhZCBvZiBwb3RlbnRpYWxseSByZXR1cm5pbmcgYSByZWplY3RlZCBwcm9taXNlIGFzIGl0cyB2YWx1ZVxuXHRcdFx0XHRzZXRfc2lnbmFsX3N0YXR1cyhkZXJpdmVkLCBESVJUWSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBmcmVlemUgYW55IGVmZmVjdHMgaW5zaWRlIHRoaXMgZGVyaXZlZFxuXHRcdGZyZWV6ZV9kZXJpdmVkX2VmZmVjdHMoZGVyaXZlZCk7XG5cblx0XHQvLyBEaXNjb25uZWN0IGFueSByZWFjdGlvbnMgb3duZWQgYnkgdGhpcyByZWFjdGlvblxuXHRcdHJlbW92ZV9yZWFjdGlvbnMoZGVyaXZlZCwgMCk7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlYWN0aW9ufSBzaWduYWxcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydF9pbmRleFxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVfcmVhY3Rpb25zKHNpZ25hbCwgc3RhcnRfaW5kZXgpIHtcblx0dmFyIGRlcGVuZGVuY2llcyA9IHNpZ25hbC5kZXBzO1xuXHRpZiAoZGVwZW5kZW5jaWVzID09PSBudWxsKSByZXR1cm47XG5cblx0Zm9yICh2YXIgaSA9IHN0YXJ0X2luZGV4OyBpIDwgZGVwZW5kZW5jaWVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0cmVtb3ZlX3JlYWN0aW9uKHNpZ25hbCwgZGVwZW5kZW5jaWVzW2ldKTtcblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3RcbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlX2VmZmVjdChlZmZlY3QpIHtcblx0dmFyIGZsYWdzID0gZWZmZWN0LmY7XG5cblx0aWYgKChmbGFncyAmIERFU1RST1lFRCkgIT09IDApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRzZXRfc2lnbmFsX3N0YXR1cyhlZmZlY3QsIENMRUFOKTtcblxuXHR2YXIgcHJldmlvdXNfZWZmZWN0ID0gYWN0aXZlX2VmZmVjdDtcblxuXHRhY3RpdmVfZWZmZWN0ID0gZWZmZWN0O1xuXG5cdGlmIChERVYpIHtcblx0XHR2YXIgcHJldmlvdXNfY29tcG9uZW50X2ZuID0gZGV2X2N1cnJlbnRfY29tcG9uZW50X2Z1bmN0aW9uO1xuXHRcdHNldF9kZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb24oZWZmZWN0LmNvbXBvbmVudF9mdW5jdGlvbik7XG5cdFx0dmFyIHByZXZpb3VzX3N0YWNrID0gLyoqIEB0eXBlIHthbnl9ICovIChkZXZfc3RhY2spO1xuXHRcdC8vIG9ubHkgYmxvY2sgZWZmZWN0cyBoYXZlIGEgZGV2IHN0YWNrLCBrZWVwIHRoZSBjdXJyZW50IG9uZSBvdGhlcndpc2Vcblx0XHRzZXRfZGV2X3N0YWNrKGVmZmVjdC5kZXZfc3RhY2sgPz8gZGV2X3N0YWNrKTtcblx0fVxuXG5cdHRyeSB7XG5cdFx0aWYgKChmbGFncyAmIChCTE9DS19FRkZFQ1QgfCBNQU5BR0VEX0VGRkVDVCkpICE9PSAwKSB7XG5cdFx0XHRkZXN0cm95X2Jsb2NrX2VmZmVjdF9jaGlsZHJlbihlZmZlY3QpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZXN0cm95X2VmZmVjdF9jaGlsZHJlbihlZmZlY3QpO1xuXHRcdH1cblxuXHRcdGV4ZWN1dGVfZWZmZWN0X3RlYXJkb3duKGVmZmVjdCk7XG5cdFx0dmFyIHRlYXJkb3duID0gdXBkYXRlX3JlYWN0aW9uKGVmZmVjdCk7XG5cdFx0ZWZmZWN0LnRlYXJkb3duID0gdHlwZW9mIHRlYXJkb3duID09PSAnZnVuY3Rpb24nID8gdGVhcmRvd24gOiBudWxsO1xuXHRcdGVmZmVjdC53diA9IHdyaXRlX3ZlcnNpb247XG5cblx0XHQvLyBJbiBERVYsIGluY3JlbWVudCB2ZXJzaW9ucyBvZiBhbnkgc291cmNlcyB0aGF0IHdlcmUgd3JpdHRlbiB0byBkdXJpbmcgdGhlIGVmZmVjdCxcblx0XHQvLyBzbyB0aGF0IHRoZXkgYXJlIGNvcnJlY3RseSBtYXJrZWQgYXMgZGlydHkgd2hlbiB0aGUgZWZmZWN0IHJlLXJ1bnNcblx0XHRpZiAoREVWICYmIHRyYWNpbmdfbW9kZV9mbGFnICYmIChlZmZlY3QuZiAmIERJUlRZKSAhPT0gMCAmJiBlZmZlY3QuZGVwcyAhPT0gbnVsbCkge1xuXHRcdFx0Zm9yICh2YXIgZGVwIG9mIGVmZmVjdC5kZXBzKSB7XG5cdFx0XHRcdGlmIChkZXAuc2V0X2R1cmluZ19lZmZlY3QpIHtcblx0XHRcdFx0XHRkZXAud3YgPSBpbmNyZW1lbnRfd3JpdGVfdmVyc2lvbigpO1xuXHRcdFx0XHRcdGRlcC5zZXRfZHVyaW5nX2VmZmVjdCA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGZpbmFsbHkge1xuXHRcdGFjdGl2ZV9lZmZlY3QgPSBwcmV2aW91c19lZmZlY3Q7XG5cblx0XHRpZiAoREVWKSB7XG5cdFx0XHRzZXRfZGV2X2N1cnJlbnRfY29tcG9uZW50X2Z1bmN0aW9uKHByZXZpb3VzX2NvbXBvbmVudF9mbik7XG5cdFx0XHRzZXRfZGV2X3N0YWNrKHByZXZpb3VzX3N0YWNrKTtcblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIG9uY2UgYW55IHBlbmRpbmcgc3RhdGUgY2hhbmdlcyBoYXZlIGJlZW4gYXBwbGllZC5cbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGljaygpIHtcblx0aWYgKGFzeW5jX21vZGVfZmxhZykge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgoZikgPT4ge1xuXHRcdFx0Ly8gUmFjZSB0aGVtIGFnYWluc3QgZWFjaCBvdGhlciAtIGluIGFsbW9zdCBhbGwgY2FzZXMgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHdpbGwgZmlyZSBmaXJzdCxcblx0XHRcdC8vIGJ1dCBlLmcuIGluIGNhc2UgdGhlIHdpbmRvdyBpcyBub3QgZm9jdXNlZCBvciBhIHZpZXcgdHJhbnNpdGlvbiBoYXBwZW5zLCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcblx0XHRcdC8vIHdpbGwgYmUgZGVsYXllZCBhbmQgc2V0VGltZW91dCBoZWxwcyB1cyByZXNvbHZlIGZhc3QgZW5vdWdoIGluIHRoYXQgY2FzZVxuXHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IGYoKSk7XG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IGYoKSk7XG5cdFx0fSk7XG5cdH1cblxuXHRhd2FpdCBQcm9taXNlLnJlc29sdmUoKTtcblxuXHQvLyBCeSBjYWxsaW5nIGZsdXNoU3luYyB3ZSBndWFyYW50ZWUgdGhhdCBhbnkgcGVuZGluZyBzdGF0ZSBjaGFuZ2VzIGFyZSBhcHBsaWVkIGFmdGVyIG9uZSB0aWNrLlxuXHQvLyBUT0RPIGxvb2sgaW50byB3aGV0aGVyIHdlIGNhbiBtYWtlIGZsdXNoaW5nIHN1YnNlcXVlbnQgdXBkYXRlcyBzeW5jaHJvbm91c2x5IGluIHRoZSBmdXR1cmUuXG5cdGZsdXNoU3luYygpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgb25jZSBhbnkgc3RhdGUgY2hhbmdlcywgYW5kIGFzeW5jaHJvbm91cyB3b3JrIHJlc3VsdGluZyBmcm9tIHRoZW0sXG4gKiBoYXZlIHJlc29sdmVkIGFuZCB0aGUgRE9NIGhhcyBiZWVuIHVwZGF0ZWRcbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICogQHNpbmNlIDUuMzZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldHRsZWQoKSB7XG5cdHJldHVybiBCYXRjaC5lbnN1cmUoKS5zZXR0bGVkKCk7XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIFZcbiAqIEBwYXJhbSB7VmFsdWU8Vj59IHNpZ25hbFxuICogQHJldHVybnMge1Z9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXQoc2lnbmFsKSB7XG5cdHZhciBmbGFncyA9IHNpZ25hbC5mO1xuXHR2YXIgaXNfZGVyaXZlZCA9IChmbGFncyAmIERFUklWRUQpICE9PSAwO1xuXG5cdGNhcHR1cmVkX3NpZ25hbHM/LmFkZChzaWduYWwpO1xuXG5cdC8vIFJlZ2lzdGVyIHRoZSBkZXBlbmRlbmN5IG9uIHRoZSBjdXJyZW50IHJlYWN0aW9uIHNpZ25hbC5cblx0aWYgKGFjdGl2ZV9yZWFjdGlvbiAhPT0gbnVsbCAmJiAhdW50cmFja2luZykge1xuXHRcdC8vIGlmIHdlJ3JlIGluIGEgZGVyaXZlZCB0aGF0IGlzIGJlaW5nIHJlYWQgaW5zaWRlIGFuIF9hc3luY18gZGVyaXZlZCxcblx0XHQvLyBpdCdzIHBvc3NpYmxlIHRoYXQgdGhlIGVmZmVjdCB3YXMgYWxyZWFkeSBkZXN0cm95ZWQuIEluIHRoaXMgY2FzZSxcblx0XHQvLyB3ZSBkb24ndCBhZGQgdGhlIGRlcGVuZGVuY3ksIGJlY2F1c2UgdGhhdCB3b3VsZCBjcmVhdGUgYSBtZW1vcnkgbGVha1xuXHRcdHZhciBkZXN0cm95ZWQgPSBhY3RpdmVfZWZmZWN0ICE9PSBudWxsICYmIChhY3RpdmVfZWZmZWN0LmYgJiBERVNUUk9ZRUQpICE9PSAwO1xuXG5cdFx0aWYgKCFkZXN0cm95ZWQgJiYgKGN1cnJlbnRfc291cmNlcyA9PT0gbnVsbCB8fCAhY3VycmVudF9zb3VyY2VzLmhhcyhzaWduYWwpKSkge1xuXHRcdFx0dmFyIGRlcHMgPSBhY3RpdmVfcmVhY3Rpb24uZGVwcztcblxuXHRcdFx0aWYgKChhY3RpdmVfcmVhY3Rpb24uZiAmIFJFQUNUSU9OX0lTX1VQREFUSU5HKSAhPT0gMCkge1xuXHRcdFx0XHQvLyB3ZSdyZSBpbiB0aGUgZWZmZWN0IGluaXQvdXBkYXRlIGN5Y2xlXG5cdFx0XHRcdGlmIChzaWduYWwucnYgPCByZWFkX3ZlcnNpb24pIHtcblx0XHRcdFx0XHRzaWduYWwucnYgPSByZWFkX3ZlcnNpb247XG5cblx0XHRcdFx0XHQvLyBJZiB0aGUgc2lnbmFsIGlzIGFjY2Vzc2luZyB0aGUgc2FtZSBkZXBlbmRlbmNpZXMgaW4gdGhlIHNhbWVcblx0XHRcdFx0XHQvLyBvcmRlciBhcyBpdCBkaWQgbGFzdCB0aW1lLCBpbmNyZW1lbnQgYHNraXBwZWRfZGVwc2Bcblx0XHRcdFx0XHQvLyByYXRoZXIgdGhhbiB1cGRhdGluZyBgbmV3X2RlcHNgLCB3aGljaCBjcmVhdGVzIEdDIGNvc3Rcblx0XHRcdFx0XHRpZiAobmV3X2RlcHMgPT09IG51bGwgJiYgZGVwcyAhPT0gbnVsbCAmJiBkZXBzW3NraXBwZWRfZGVwc10gPT09IHNpZ25hbCkge1xuXHRcdFx0XHRcdFx0c2tpcHBlZF9kZXBzKys7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChuZXdfZGVwcyA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0bmV3X2RlcHMgPSBbc2lnbmFsXTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0bmV3X2RlcHMucHVzaChzaWduYWwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gV2UncmUgYWRkaW5nIGEgZGVwZW5kZW5jeSBvdXRzaWRlIHRoZSBpbml0L3VwZGF0ZSBjeWNsZSAoaS5lLiBhZnRlciBhbiBgYXdhaXRgKS5cblx0XHRcdFx0Ly8gV2UgaGF2ZSB0byBkZWR1cGxpY2F0ZSBkZXBzL3JlYWN0aW9ucyBpbiB0aGlzIGNhc2Ugb3IgcmVtb3ZlX3JlYWN0aW9ucyBjb3VsZFxuXHRcdFx0XHQvLyBkaXNjb25uZWN0IGRlcHMvcmVhY3Rpb25zIHRoYXQgYXJlIGFjdHVhbGx5IHN0aWxsIGluIHVzZSAoaWYgc2tpcF9kZXBzIHNheXNcblx0XHRcdFx0Ly8gXCJkaXNjb25uZWN0IGFsbCBhZnRlciB0aGlzIGluZGV4XCIgYW5kIHNvbWUgb2YgdGhlIHNpZ25hbHMgYXJlIGFsc28gcHJlc2VudCBpblxuXHRcdFx0XHQvLyBsaXN0IHByaW9yIHRvIHRoZSBjdXRvZmYgaW5kZXgsIGkuZS4gdGhhdCBzaG91bGQgYmUga2VwdCkuXG5cdFx0XHRcdGFjdGl2ZV9yZWFjdGlvbi5kZXBzID8/PSBbXTtcblx0XHRcdFx0aWYgKCFpbmNsdWRlcy5jYWxsKGFjdGl2ZV9yZWFjdGlvbi5kZXBzLCBzaWduYWwpKSB7XG5cdFx0XHRcdFx0YWN0aXZlX3JlYWN0aW9uLmRlcHMucHVzaChzaWduYWwpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIHJlYWN0aW9ucyA9IHNpZ25hbC5yZWFjdGlvbnM7XG5cblx0XHRcdFx0aWYgKHJlYWN0aW9ucyA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdHNpZ25hbC5yZWFjdGlvbnMgPSBbYWN0aXZlX3JlYWN0aW9uXTtcblx0XHRcdFx0fSBlbHNlIGlmICghaW5jbHVkZXMuY2FsbChyZWFjdGlvbnMsIGFjdGl2ZV9yZWFjdGlvbikpIHtcblx0XHRcdFx0XHRyZWFjdGlvbnMucHVzaChhY3RpdmVfcmVhY3Rpb24pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aWYgKERFVikge1xuXHRcdGlmIChcblx0XHRcdCF1bnRyYWNraW5nICYmXG5cdFx0XHRyZWFjdGl2aXR5X2xvc3NfdHJhY2tlciAmJlxuXHRcdFx0Ly8gQnkgY2hlY2tpbmcgdGhhdCBjdXJyZW50L3ByZXZpb3VzIGJhdGNoIGFyZSBudWxsIHdlIGZpbHRlciBvdXQgZmFsc2UgcG9zaXRpdmVzLlxuXHRcdFx0Ly8gcmVhY3Rpdml0eV9sb3NzX3RyYWNrZXIgaXMgb25seSByZXNldCBhZnRlciBhIG1pY3JvdGFzaywgc28gaWYgYSBmbHVzaCBoYXBwZW5zXG5cdFx0XHQvLyBiZWZvcmUgdGhhdCwgd2UgZ2V0IHdhcm5pbmdzIGZvciB0aGluZ3Mgd2Ugc2hvdWxkbid0IHdhcm4gb24uXG5cdFx0XHRjdXJyZW50X2JhdGNoID09PSBudWxsICYmXG5cdFx0XHRwcmV2aW91c19iYXRjaCA9PT0gbnVsbCAmJlxuXHRcdFx0IXJlYWN0aXZpdHlfbG9zc190cmFja2VyLndhcm5lZCAmJlxuXHRcdFx0KHJlYWN0aXZpdHlfbG9zc190cmFja2VyLmVmZmVjdC5mICYgUkVBQ1RJT05fSVNfVVBEQVRJTkcpID09PSAwICYmXG5cdFx0XHQhcmVhY3Rpdml0eV9sb3NzX3RyYWNrZXIuZWZmZWN0X2RlcHMuaGFzKHNpZ25hbClcblx0XHQpIHtcblx0XHRcdHJlYWN0aXZpdHlfbG9zc190cmFja2VyLndhcm5lZCA9IHRydWU7XG5cblx0XHRcdHcuYXdhaXRfcmVhY3Rpdml0eV9sb3NzKC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAoc2lnbmFsLmxhYmVsKSk7XG5cblx0XHRcdHZhciB0cmFjZSA9IGdldF9lcnJvcigndHJhY2VkIGF0Jyk7XG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuXHRcdFx0aWYgKHRyYWNlKSBjb25zb2xlLndhcm4odHJhY2UpO1xuXHRcdH1cblxuXHRcdHJlY2VudF9hc3luY19kZXJpdmVkcy5kZWxldGUoc2lnbmFsKTtcblxuXHRcdGlmIChcblx0XHRcdHRyYWNpbmdfbW9kZV9mbGFnICYmXG5cdFx0XHQhdW50cmFja2luZyAmJlxuXHRcdFx0dHJhY2luZ19leHByZXNzaW9ucyAhPT0gbnVsbCAmJlxuXHRcdFx0YWN0aXZlX3JlYWN0aW9uICE9PSBudWxsICYmXG5cdFx0XHR0cmFjaW5nX2V4cHJlc3Npb25zLnJlYWN0aW9uID09PSBhY3RpdmVfcmVhY3Rpb25cblx0XHQpIHtcblx0XHRcdC8vIFVzZWQgd2hlbiBtYXBwaW5nIHN0YXRlIGJldHdlZW4gc3BlY2lhbCBibG9ja3MgbGlrZSBgZWFjaGBcblx0XHRcdGlmIChzaWduYWwudHJhY2UpIHtcblx0XHRcdFx0c2lnbmFsLnRyYWNlKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0cmFjZSA9IGdldF9lcnJvcigndHJhY2VkIGF0Jyk7XG5cblx0XHRcdFx0aWYgKHRyYWNlKSB7XG5cdFx0XHRcdFx0dmFyIGVudHJ5ID0gdHJhY2luZ19leHByZXNzaW9ucy5lbnRyaWVzLmdldChzaWduYWwpO1xuXG5cdFx0XHRcdFx0aWYgKGVudHJ5ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdGVudHJ5ID0geyB0cmFjZXM6IFtdIH07XG5cdFx0XHRcdFx0XHR0cmFjaW5nX2V4cHJlc3Npb25zLmVudHJpZXMuc2V0KHNpZ25hbCwgZW50cnkpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHZhciBsYXN0ID0gZW50cnkudHJhY2VzW2VudHJ5LnRyYWNlcy5sZW5ndGggLSAxXTtcblxuXHRcdFx0XHRcdC8vIHRyYWNlcyBjYW4gYmUgZHVwbGljYXRlZCwgZS5nLiBieSBgc25hcHNob3RgIGludm9raW5nIGJvdGhcblx0XHRcdFx0XHQvLyBib3RoIGBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JgIGFuZCBgZ2V0YCB0cmFwcyBhdCBvbmNlXG5cdFx0XHRcdFx0aWYgKHRyYWNlLnN0YWNrICE9PSBsYXN0Py5zdGFjaykge1xuXHRcdFx0XHRcdFx0ZW50cnkudHJhY2VzLnB1c2godHJhY2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmIChpc19kZXN0cm95aW5nX2VmZmVjdCAmJiBvbGRfdmFsdWVzLmhhcyhzaWduYWwpKSB7XG5cdFx0cmV0dXJuIG9sZF92YWx1ZXMuZ2V0KHNpZ25hbCk7XG5cdH1cblxuXHRpZiAoaXNfZGVyaXZlZCkge1xuXHRcdHZhciBkZXJpdmVkID0gLyoqIEB0eXBlIHtEZXJpdmVkfSAqLyAoc2lnbmFsKTtcblxuXHRcdGlmIChpc19kZXN0cm95aW5nX2VmZmVjdCkge1xuXHRcdFx0dmFyIHZhbHVlID0gZGVyaXZlZC52O1xuXG5cdFx0XHQvLyBpZiB0aGUgZGVyaXZlZCBpcyBkaXJ0eSBhbmQgaGFzIHJlYWN0aW9ucywgb3IgZGVwZW5kcyBvbiB0aGUgdmFsdWVzIHRoYXQganVzdCBjaGFuZ2VkLCByZS1leGVjdXRlXG5cdFx0XHQvLyAoYSBkZXJpdmVkIGNhbiBiZSBtYXliZV9kaXJ0eSBkdWUgdG8gdGhlIGVmZmVjdCBkZXN0cm95IHJlbW92aW5nIGl0cyBsYXN0IHJlYWN0aW9uKVxuXHRcdFx0aWYgKFxuXHRcdFx0XHQoKGRlcml2ZWQuZiAmIENMRUFOKSA9PT0gMCAmJiBkZXJpdmVkLnJlYWN0aW9ucyAhPT0gbnVsbCkgfHxcblx0XHRcdFx0ZGVwZW5kc19vbl9vbGRfdmFsdWVzKGRlcml2ZWQpXG5cdFx0XHQpIHtcblx0XHRcdFx0dmFsdWUgPSBleGVjdXRlX2Rlcml2ZWQoZGVyaXZlZCk7XG5cdFx0XHR9XG5cblx0XHRcdG9sZF92YWx1ZXMuc2V0KGRlcml2ZWQsIHZhbHVlKTtcblxuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH1cblxuXHRcdC8vIGNvbm5lY3QgZGlzY29ubmVjdGVkIGRlcml2ZWRzIHdoZW4gcmVhZGluZyB0aGVtIGluc2lkZSBhIGNvbm5lY3RlZCByZWFjdGlvblxuXHRcdHZhciBzaG91bGRfY29ubmVjdCA9XG5cdFx0XHQoZGVyaXZlZC5mICYgQ09OTkVDVEVEKSA9PT0gMCAmJlxuXHRcdFx0IXVudHJhY2tpbmcgJiZcblx0XHRcdGFjdGl2ZV9yZWFjdGlvbiAhPT0gbnVsbCAmJlxuXHRcdFx0KGFjdGl2ZV9yZWFjdGlvbi5mICYgQ09OTkVDVEVEKSAhPT0gMDtcblxuXHRcdHZhciBpc19uZXcgPSAoZGVyaXZlZC5mICYgUkVBQ1RJT05fUkFOKSA9PT0gMDtcblxuXHRcdGlmIChpc19kaXJ0eShkZXJpdmVkKSkge1xuXHRcdFx0aWYgKHNob3VsZF9jb25uZWN0KSB7XG5cdFx0XHRcdC8vIHNldCB0aGUgZmxhZyBiZWZvcmUgYHVwZGF0ZV9kZXJpdmVkYCwgc28gdGhhdCB0aGUgZGVyaXZlZFxuXHRcdFx0XHQvLyBpcyBhZGRlZCBhcyBhIHJlYWN0aW9uIHRvIGl0cyBkZXBlbmRlbmNpZXNcblx0XHRcdFx0ZGVyaXZlZC5mIHw9IENPTk5FQ1RFRDtcblx0XHRcdH1cblxuXHRcdFx0dXBkYXRlX2Rlcml2ZWQoZGVyaXZlZCk7XG5cdFx0fVxuXG5cdFx0aWYgKHNob3VsZF9jb25uZWN0ICYmICFpc19uZXcpIHtcblx0XHRcdHVuZnJlZXplX2Rlcml2ZWRfZWZmZWN0cyhkZXJpdmVkKTtcblx0XHRcdHJlY29ubmVjdChkZXJpdmVkKTtcblx0XHR9XG5cdH1cblxuXHRpZiAoYmF0Y2hfdmFsdWVzPy5oYXMoc2lnbmFsKSkge1xuXHRcdHJldHVybiBiYXRjaF92YWx1ZXMuZ2V0KHNpZ25hbCk7XG5cdH1cblxuXHRpZiAoKHNpZ25hbC5mICYgRVJST1JfVkFMVUUpICE9PSAwKSB7XG5cdFx0dGhyb3cgc2lnbmFsLnY7XG5cdH1cblxuXHRyZXR1cm4gc2lnbmFsLnY7XG59XG5cbi8qKlxuICogKFJlKWNvbm5lY3QgYSBkaXNjb25uZWN0ZWQgZGVyaXZlZCwgc28gdGhhdCBpdCBpcyBub3RpZmllZFxuICogb2YgY2hhbmdlcyBpbiBgbWFya19yZWFjdGlvbnNgXG4gKiBAcGFyYW0ge0Rlcml2ZWR9IGRlcml2ZWRcbiAqL1xuZnVuY3Rpb24gcmVjb25uZWN0KGRlcml2ZWQpIHtcblx0ZGVyaXZlZC5mIHw9IENPTk5FQ1RFRDtcblxuXHRpZiAoZGVyaXZlZC5kZXBzID09PSBudWxsKSByZXR1cm47XG5cblx0Zm9yIChjb25zdCBkZXAgb2YgZGVyaXZlZC5kZXBzKSB7XG5cdFx0dmFyIHJlYWN0aW9ucyA9IGRlcC5yZWFjdGlvbnM7XG5cblx0XHRpZiAocmVhY3Rpb25zID09PSBudWxsKSB7XG5cdFx0XHRkZXAucmVhY3Rpb25zID0gW2Rlcml2ZWRdO1xuXHRcdH0gZWxzZSBpZiAoIWluY2x1ZGVzLmNhbGwocmVhY3Rpb25zLCBkZXJpdmVkKSkge1xuXHRcdFx0cmVhY3Rpb25zLnB1c2goZGVyaXZlZCk7XG5cdFx0fVxuXG5cdFx0aWYgKChkZXAuZiAmIERFUklWRUQpICE9PSAwICYmIChkZXAuZiAmIENPTk5FQ1RFRCkgPT09IDApIHtcblx0XHRcdHVuZnJlZXplX2Rlcml2ZWRfZWZmZWN0cygvKiogQHR5cGUge0Rlcml2ZWR9ICovIChkZXApKTtcblx0XHRcdHJlY29ubmVjdCgvKiogQHR5cGUge0Rlcml2ZWR9ICovIChkZXApKTtcblx0XHR9XG5cdH1cbn1cblxuLyoqIEBwYXJhbSB7RGVyaXZlZH0gZGVyaXZlZCAqL1xuZnVuY3Rpb24gZGVwZW5kc19vbl9vbGRfdmFsdWVzKGRlcml2ZWQpIHtcblx0aWYgKGRlcml2ZWQudiA9PT0gVU5JTklUSUFMSVpFRCkgcmV0dXJuIHRydWU7IC8vIHdlIGRvbid0IGtub3csIHNvIGFzc3VtZSB0aGUgd29yc3Rcblx0aWYgKGRlcml2ZWQuZGVwcyA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG5cdGZvciAoY29uc3QgZGVwIG9mIGRlcml2ZWQuZGVwcykge1xuXHRcdGlmIChvbGRfdmFsdWVzLmhhcyhkZXApKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoKGRlcC5mICYgREVSSVZFRCkgIT09IDAgJiYgZGVwZW5kc19vbl9vbGRfdmFsdWVzKC8qKiBAdHlwZSB7RGVyaXZlZH0gKi8gKGRlcCkpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogTGlrZSBgZ2V0YCwgYnV0IGNoZWNrcyBmb3IgYHVuZGVmaW5lZGAuIFVzZWQgZm9yIGB2YXJgIGRlY2xhcmF0aW9ucyBiZWNhdXNlIHRoZXkgY2FuIGJlIGFjY2Vzc2VkIGJlZm9yZSBiZWluZyBkZWNsYXJlZFxuICogQHRlbXBsYXRlIFZcbiAqIEBwYXJhbSB7VmFsdWU8Vj4gfCB1bmRlZmluZWR9IHNpZ25hbFxuICogQHJldHVybnMge1YgfCB1bmRlZmluZWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYWZlX2dldChzaWduYWwpIHtcblx0cmV0dXJuIHNpZ25hbCAmJiBnZXQoc2lnbmFsKTtcbn1cblxuLyoqXG4gKiBXaGVuIHVzZWQgaW5zaWRlIGEgW2AkZGVyaXZlZGBdKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL3N2ZWx0ZS8kZGVyaXZlZCkgb3IgW2AkZWZmZWN0YF0oaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3Mvc3ZlbHRlLyRlZmZlY3QpLFxuICogYW55IHN0YXRlIHJlYWQgaW5zaWRlIGBmbmAgd2lsbCBub3QgYmUgdHJlYXRlZCBhcyBhIGRlcGVuZGVuY3kuXG4gKlxuICogYGBgdHNcbiAqICRlZmZlY3QoKCkgPT4ge1xuICogICAvLyB0aGlzIHdpbGwgcnVuIHdoZW4gYGRhdGFgIGNoYW5nZXMsIGJ1dCBub3Qgd2hlbiBgdGltZWAgY2hhbmdlc1xuICogICBzYXZlKGRhdGEsIHtcbiAqICAgICB0aW1lc3RhbXA6IHVudHJhY2soKCkgPT4gdGltZSlcbiAqICAgfSk7XG4gKiB9KTtcbiAqIGBgYFxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7KCkgPT4gVH0gZm5cbiAqIEByZXR1cm5zIHtUfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdW50cmFjayhmbikge1xuXHR2YXIgcHJldmlvdXNfdW50cmFja2luZyA9IHVudHJhY2tpbmc7XG5cdHRyeSB7XG5cdFx0dW50cmFja2luZyA9IHRydWU7XG5cdFx0cmV0dXJuIGZuKCk7XG5cdH0gZmluYWxseSB7XG5cdFx0dW50cmFja2luZyA9IHByZXZpb3VzX3VudHJhY2tpbmc7XG5cdH1cbn1cblxuLyoqXG4gKiBQb3NzaWJseSB0cmF2ZXJzZSBhbiBvYmplY3QgYW5kIHJlYWQgYWxsIGl0cyBwcm9wZXJ0aWVzIHNvIHRoYXQgdGhleSdyZSBhbGwgcmVhY3RpdmUgaW4gY2FzZSB0aGlzIGlzIGAkc3RhdGVgLlxuICogRG9lcyBvbmx5IGNoZWNrIGZpcnN0IGxldmVsIG9mIGFuIG9iamVjdCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoaGV1cmlzdGljIHNob3VsZCBiZSBnb29kIGZvciA5OSUgb2YgYWxsIGNhc2VzKS5cbiAqIEBwYXJhbSB7YW55fSB2YWx1ZVxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWVwX3JlYWRfc3RhdGUodmFsdWUpIHtcblx0aWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgfHwgIXZhbHVlIHx8IHZhbHVlIGluc3RhbmNlb2YgRXZlbnRUYXJnZXQpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZiAoU1RBVEVfU1lNQk9MIGluIHZhbHVlKSB7XG5cdFx0ZGVlcF9yZWFkKHZhbHVlKTtcblx0fSBlbHNlIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRmb3IgKGxldCBrZXkgaW4gdmFsdWUpIHtcblx0XHRcdGNvbnN0IHByb3AgPSB2YWx1ZVtrZXldO1xuXHRcdFx0aWYgKHR5cGVvZiBwcm9wID09PSAnb2JqZWN0JyAmJiBwcm9wICYmIFNUQVRFX1NZTUJPTCBpbiBwcm9wKSB7XG5cdFx0XHRcdGRlZXBfcmVhZChwcm9wKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBEZWVwbHkgdHJhdmVyc2UgYW4gb2JqZWN0IGFuZCByZWFkIGFsbCBpdHMgcHJvcGVydGllc1xuICogc28gdGhhdCB0aGV5J3JlIGFsbCByZWFjdGl2ZSBpbiBjYXNlIHRoaXMgaXMgYCRzdGF0ZWBcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZVxuICogQHBhcmFtIHtTZXQ8YW55Pn0gdmlzaXRlZFxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWVwX3JlYWQodmFsdWUsIHZpc2l0ZWQgPSBuZXcgU2V0KCkpIHtcblx0aWYgKFxuXHRcdHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiZcblx0XHR2YWx1ZSAhPT0gbnVsbCAmJlxuXHRcdC8vIFdlIGRvbid0IHdhbnQgdG8gdHJhdmVyc2UgRE9NIGVsZW1lbnRzXG5cdFx0ISh2YWx1ZSBpbnN0YW5jZW9mIEV2ZW50VGFyZ2V0KSAmJlxuXHRcdCF2aXNpdGVkLmhhcyh2YWx1ZSlcblx0KSB7XG5cdFx0dmlzaXRlZC5hZGQodmFsdWUpO1xuXHRcdC8vIFdoZW4gd29ya2luZyB3aXRoIGEgcG9zc2libGUgU3ZlbHRlRGF0ZSwgdGhpc1xuXHRcdC8vIHdpbGwgZW5zdXJlIHdlIGNhcHR1cmUgY2hhbmdlcyB0byBpdC5cblx0XHRpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XG5cdFx0XHR2YWx1ZS5nZXRUaW1lKCk7XG5cdFx0fVxuXHRcdGZvciAobGV0IGtleSBpbiB2YWx1ZSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZGVlcF9yZWFkKHZhbHVlW2tleV0sIHZpc2l0ZWQpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHQvLyBjb250aW51ZVxuXHRcdFx0fVxuXHRcdH1cblx0XHRjb25zdCBwcm90byA9IGdldF9wcm90b3R5cGVfb2YodmFsdWUpO1xuXHRcdGlmIChcblx0XHRcdHByb3RvICE9PSBPYmplY3QucHJvdG90eXBlICYmXG5cdFx0XHRwcm90byAhPT0gQXJyYXkucHJvdG90eXBlICYmXG5cdFx0XHRwcm90byAhPT0gTWFwLnByb3RvdHlwZSAmJlxuXHRcdFx0cHJvdG8gIT09IFNldC5wcm90b3R5cGUgJiZcblx0XHRcdHByb3RvICE9PSBEYXRlLnByb3RvdHlwZVxuXHRcdCkge1xuXHRcdFx0Y29uc3QgZGVzY3JpcHRvcnMgPSBnZXRfZGVzY3JpcHRvcnMocHJvdG8pO1xuXHRcdFx0Zm9yIChsZXQga2V5IGluIGRlc2NyaXB0b3JzKSB7XG5cdFx0XHRcdGNvbnN0IGdldCA9IGRlc2NyaXB0b3JzW2tleV0uZ2V0O1xuXHRcdFx0XHRpZiAoZ2V0KSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGdldC5jYWxsKHZhbHVlKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHQvLyBjb250aW51ZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7O0FBRUEsSUFBVyxXQUFXLE1BQU07QUFDNUIsSUFBVyxXQUFXLE1BQU0sVUFBVTtBQUN0QyxJQUFXLFdBQVcsTUFBTSxVQUFVO0FBQ3RDLElBQVcsYUFBYSxNQUFNO0FBQzlCLElBQVcsY0FBYyxPQUFPO0FBQ2hDLElBQVcsa0JBQWtCLE9BQU87QUFDcEMsSUFBVyxpQkFBaUIsT0FBTztBQUNuQyxJQUFXLGtCQUFrQixPQUFPO0FBQ3BDLElBQVcsbUJBQW1CLE9BQU87QUFDckMsSUFBVyxrQkFBa0IsTUFBTTtBQUNuQyxJQUFXLG1CQUFtQixPQUFPO0FBQ3JDLElB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QUNULElBQUksQ0FBQyxNQUFNLFFBQVEsS0FBSyxHQUM5QixLQUFLLElBQUksT0FBTyxPQUFPO0VBQ3RCLE1BQU0sT0FBTyxNQUFNO0VBQ25CLElBQUksT0FBTyxTQUFTLFlBQVksUUFBUSxnQkFBZ0IsTUFDdkQsVUFBVSxJQUFJO0NBRWhCO0FBRUY7Ozs7Ozs7O0FBU0EsU0FBZ0IsVUFBVSxPQUFPLDBCQUFVLElBQUksSUFBSSxHQUFHO0NBQ3JELElBQ0MsT0FBTyxVQUFVLFlBQ2pCLFVBQVUsUUFFVixFQUFFLGlCQUFpQixnQkFDbkIsQ0FBQyxRQUFRLElBQUksS0FBSyxHQUNqQjtFQUNELFFBQVEsSUFBSSxLQUFLO0VBR2pCLElBQUksaUJBQWlCLE1BQ3BCLE1BQU0sUUFBUTtFQUVmLEtBQUssSUFBSSxPQUFPLE9BQ2YsSUFBSTtHQUNILFVBQVUsTUFBTSxNQUFNLE9BQU87RUFDOUIsU0FBUyxHQUFHLENBRVo7RUFFRCxNQUFNLFFBQVEsaUJBQWlCLEtBQUs7RUFDcEMsSUFDQyxVQUFVLE9BQU8sYUFDakIsVUFBVSxNQUFNLGFBQ2hCLFVBQVUsSUFBSSxhQUNkLFVBQVUsSUFBSSxhQUNkLFVBQVUsS0FBSyxXQUNkO0dBQ0QsTUFBTSxjQUFjLGdCQUFnQixLQUFLO0dBQ3pDLEtBQUssSUFBSSxPQUFPLGFBQWE7SUFDNUIsTUFBTSxNQUFNLFlBQVksSUFBSSxDQUFDO0lBQzdCLElBQUksS0FDSCxJQUFJO0tBQ0gsSUFBSSxLQUFLLEtBQUs7SUFDZixTQUFTLEdBQUcsQ0FFWjtHQUVGO0VBQ0Q7Q0FDRDtBQUNEIiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTUsMTYsMTcsMTgsMTksMjAsMjEsMjIsMjMsMjQsMjUsMjYsMjcsMjgsMjldfQ==