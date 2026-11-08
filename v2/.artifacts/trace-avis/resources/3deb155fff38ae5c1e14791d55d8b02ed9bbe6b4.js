import "/node_modules/.vite/deps/esm-env-D8Yi5ac9.js?v=70f5904f";
import { $n as NAMESPACE_SVG, Ar as is_array, Bn as hydrating, Cr as define_property, G as create_fragment, Gn as set_hydrating, Gt as queue_micro_task, H as clear_text_content, Hn as read_hydration_instruction, I as user_pre_effect, J as get_first_child, Jn as FILENAME, K as create_text, Kn as skip_nodes, Ln as hydrate_next, Mn as lifecycle_outside_component, Nr as noop, O as move_effect, On as svelte_boundary_reset_onerror, Q as merge_text_nodes, Qn as NAMESPACE_MATHML, R as invoke_error_boundary, Rn as hydrate_node, Sn as hydration_failed, U as create_comment, Ut as defer_effect, Vn as next, W as create_element, Wn as set_hydrate_node, Wt as set_signal_status, X as init_operations, Xn as HYDRATION_ERROR, Y as get_next_sibling, Yt as dev_current_component_function, Z as is_firefox, _ as branch, _t as current_batch, a as get, an as set_component_context, b as destroy_effect, br as TEXT_CACHE, c as set_active_effect, cr as EFFECT_TRANSPARENT, ct as internal_set, dt as set, et as set_attribute, ft as source, g as block, gr as MAYBE_DIRTY, gt as Batch, ir as DESTROYING, k as pause_effect, l as set_active_reaction, ln as tag, lt as mutable_source, mr as LEGACY_PROPS, n as active_reaction, nn as pop, pr as IS_XHTML, qt as component_context, rn as push, rr as DESTROYED, sr as EFFECT_PRESERVED, t as active_effect, tn as mark_as_component, v as component_root, xr as array_from, yn as effect_pending_outside_reaction, yt as flushSync } from "/node_modules/.vite/deps/runtime-BOFXI46e.js?v=70f5904f";
import { d as hydration_mismatch, m as lifecycle_double_unmount, p as legacy_recursive_reactive_block, y as svelte_boundary_reset_noop } from "/node_modules/.vite/deps/warnings-BCxPSjeg.js?v=70f5904f";
import { t as async_mode_flag } from "/node_modules/.vite/deps/flags-qfBdqUK7.js?v=70f5904f";
import { c as on, s as handle_event_propagation, t as all_registered_events, u as root_event_handles } from "/node_modules/.vite/deps/events-21uQP6Br.js?v=70f5904f";
import { t as createSubscriber } from "/node_modules/.vite/deps/create-subscriber-CPAtLkyQ.js?v=70f5904f";
// node_modules/svelte/src/utils.js
var regex_return_characters = /\r/g;
/**
* @param {string} str
* @returns {string}
*/
function hash(str) {
	str = str.replace(regex_return_characters, "");
	let hash = 5381;
	let i = str.length;
	while (i--) hash = (hash << 5) - hash ^ str.charCodeAt(i);
	return (hash >>> 0).toString(36);
}
var VOID_ELEMENT_NAMES = [
	"area",
	"base",
	"br",
	"col",
	"command",
	"embed",
	"hr",
	"img",
	"input",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
];
/**
* Returns `true` if `name` is of a void element
* @param {string} name
*/
function is_void(name) {
	return VOID_ELEMENT_NAMES.includes(name) || name.toLowerCase() === "!doctype";
}
/**
* @param {string} name
*/
function is_capture_event(name) {
	return name.endsWith("capture") && name !== "gotpointercapture" && name !== "lostpointercapture";
}
/** List of Element events that will be delegated */
var DELEGATED_EVENTS = [
	"beforeinput",
	"click",
	"change",
	"dblclick",
	"contextmenu",
	"focusin",
	"focusout",
	"input",
	"keydown",
	"keyup",
	"mousedown",
	"mousemove",
	"mouseout",
	"mouseover",
	"mouseup",
	"pointerdown",
	"pointermove",
	"pointerout",
	"pointerover",
	"pointerup",
	"touchend",
	"touchmove",
	"touchstart"
];
/**
* Returns `true` if `event_name` is a delegated event
* @param {string} event_name
*/
function can_delegate_event(event_name) {
	return DELEGATED_EVENTS.includes(event_name);
}
/**
* Attributes that are boolean, i.e. they are present or not present.
*/
var DOM_BOOLEAN_ATTRIBUTES = [
	"allowfullscreen",
	"async",
	"autofocus",
	"autoplay",
	"checked",
	"controls",
	"default",
	"disabled",
	"formnovalidate",
	"indeterminate",
	"inert",
	"ismap",
	"loop",
	"multiple",
	"muted",
	"nomodule",
	"novalidate",
	"open",
	"playsinline",
	"readonly",
	"required",
	"reversed",
	"seamless",
	"selected",
	"webkitdirectory",
	"defer",
	"disablepictureinpicture",
	"disableremoteplayback"
];
/**
* @type {Record<string, string>}
* List of attribute names that should be aliased to their property names
* because they behave differently between setting them as an attribute and
* setting them as a property.
*/
var ATTRIBUTE_ALIASES = {
	formnovalidate: "formNoValidate",
	ismap: "isMap",
	nomodule: "noModule",
	playsinline: "playsInline",
	readonly: "readOnly",
	defaultvalue: "defaultValue",
	defaultchecked: "defaultChecked",
	srcobject: "srcObject",
	novalidate: "noValidate",
	allowfullscreen: "allowFullscreen",
	disablepictureinpicture: "disablePictureInPicture",
	disableremoteplayback: "disableRemotePlayback"
};
/**
* @param {string} name
*/
function normalize_attribute(name) {
	name = name.toLowerCase();
	return ATTRIBUTE_ALIASES[name] ?? name;
}
[...DOM_BOOLEAN_ATTRIBUTES];
/**
* Subset of delegated events which should be passive by default.
* These two are already passive via browser defaults on window, document and body.
* But since
* - we're delegating them
* - they happen often
* - they apply to mobile which is generally less performant
* we're marking them as passive by default for other elements, too.
*/
var PASSIVE_EVENTS = ["touchstart", "touchmove"];
/**
* Returns `true` if `name` is a passive event
* @param {string} name
*/
function is_passive_event(name) {
	return PASSIVE_EVENTS.includes(name);
}
/** List of elements that require raw contents and should not have SSR comments put in them */
var RAW_TEXT_ELEMENTS = [
	"textarea",
	"script",
	"style",
	"title"
];
/** @param {string} name */
function is_raw_text_element(name) {
	return RAW_TEXT_ELEMENTS.includes(name);
}
/**
* Prevent devtools trying to make `location` a clickable link by inserting a zero-width space
* @template {string | undefined} T
* @param {T} location
* @returns {T};
*/
function sanitize_location(location) {
	return location?.replace(/\//g, "/​");
}
// node_modules/svelte/src/internal/client/dom/reconciler.js
var policy = globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { 
/** @param {string} html */
createHTML: (html) => {
	return html;
} });
/** @param {string} html */
function create_trusted_html(html) {
	return policy?.createHTML(html) ?? html;
}
/**
* @param {string} html
*/
function create_fragment_from_html(html) {
	var elem = create_element("template");
	elem.innerHTML = create_trusted_html(html.replaceAll("<!>", "<!---->"));
	return elem.content;
}
// node_modules/svelte/src/internal/client/dom/template.js
/** @import { Effect, EffectNodes, TemplateNode } from '#client' */
/** @import { TemplateStructure } from './types' */
var TEMPLATE_TAG = IS_XHTML ? "template" : "TEMPLATE";
var SCRIPT_TAG = IS_XHTML ? "script" : "SCRIPT";
/**
* @param {TemplateNode} start
* @param {TemplateNode | null} end
*/
function assign_nodes(start, end) {
	var effect = active_effect;
	if (effect.nodes === null) effect.nodes = {
		start,
		end,
		a: null,
		t: null
	};
}
/**
* @param {string} content
* @param {number} flags
* @returns {() => Node | Node[]}
*/
/*#__NO_SIDE_EFFECTS__*/
function from_html(content, flags) {
	var is_fragment = (flags & 1) !== 0;
	var use_import_node = (flags & 2) !== 0;
	/** @type {Node} */
	var node;
	/**
	* Whether or not the first item is a text/element node. If not, we need to
	* create an additional comment node to act as `effect.nodes.start`
	*/
	var has_start = !content.startsWith("<!>");
	return () => {
		if (hydrating) {
			assign_nodes(hydrate_node, null);
			return hydrate_node;
		}
		if (node === void 0) {
			node = create_fragment_from_html(has_start ? content : "<!>" + content);
			if (!is_fragment) node = /* @__PURE__ */ get_first_child(node);
		}
		var clone = use_import_node || is_firefox ? document.importNode(node, true) : node.cloneNode(true);
		if (is_fragment) {
			var start = /* @__PURE__ */ get_first_child(clone);
			var end = clone.lastChild;
			assign_nodes(start, end);
		} else assign_nodes(clone, clone);
		return clone;
	};
}
/**
* @param {string} content
* @param {number} flags
* @param {'svg' | 'math'} ns
* @returns {() => Node | Node[]}
*/
/*#__NO_SIDE_EFFECTS__*/
function from_namespace(content, flags, ns = "svg") {
	/**
	* Whether or not the first item is a text/element node. If not, we need to
	* create an additional comment node to act as `effect.nodes.start`
	*/
	var has_start = !content.startsWith("<!>");
	var is_fragment = (flags & 1) !== 0;
	var wrapped = `<${ns}>${has_start ? content : "<!>" + content}</${ns}>`;
	/** @type {Element | DocumentFragment} */
	var node;
	return () => {
		if (hydrating) {
			assign_nodes(hydrate_node, null);
			return hydrate_node;
		}
		if (!node) {
			var fragment = create_fragment_from_html(wrapped);
			var root = /* @__PURE__ */ get_first_child(fragment);
			if (is_fragment) {
				node = document.createDocumentFragment();
				while (/* @__PURE__ */ get_first_child(root)) node.appendChild(/* @__PURE__ */ get_first_child(root));
			} else node = /* @__PURE__ */ get_first_child(root);
		}
		var clone = node.cloneNode(true);
		if (is_fragment) {
			var start = /* @__PURE__ */ get_first_child(clone);
			var end = clone.lastChild;
			assign_nodes(start, end);
		} else assign_nodes(clone, clone);
		return clone;
	};
}
/**
* @param {string} content
* @param {number} flags
*/
/*#__NO_SIDE_EFFECTS__*/
function from_svg(content, flags) {
	return /* @__PURE__ */ from_namespace(content, flags, "svg");
}
/**
* @param {string} content
* @param {number} flags
*/
/*#__NO_SIDE_EFFECTS__*/
function from_mathml(content, flags) {
	return /* @__PURE__ */ from_namespace(content, flags, "math");
}
/**
* @param {TemplateStructure[]} structure
* @param {typeof NAMESPACE_SVG | typeof NAMESPACE_MATHML | undefined} [ns]
*/
function fragment_from_tree(structure, ns) {
	var fragment = create_fragment();
	for (var item of structure) {
		if (typeof item === "string") {
			fragment.append(create_text(item));
			continue;
		}
		if (item === void 0 || item[0][0] === "/") {
			fragment.append(create_comment(item ? item[0].slice(3) : ""));
			continue;
		}
		const [name, attributes, ...children] = item;
		const namespace = name === "svg" ? NAMESPACE_SVG : name === "math" ? NAMESPACE_MATHML : ns;
		var element = create_element(name, namespace, attributes?.is);
		for (var key in attributes) set_attribute(element, key, attributes[key]);
		if (children.length > 0) (element.nodeName === TEMPLATE_TAG ? element.content : element).append(fragment_from_tree(children, element.nodeName === "foreignObject" ? void 0 : namespace));
		fragment.append(element);
	}
	return fragment;
}
/**
* @param {TemplateStructure[]} structure
* @param {number} flags
* @returns {() => Node | Node[]}
*/
/*#__NO_SIDE_EFFECTS__*/
function from_tree(structure, flags) {
	var is_fragment = (flags & 1) !== 0;
	var use_import_node = (flags & 2) !== 0;
	/** @type {Node} */
	var node;
	return () => {
		if (hydrating) {
			assign_nodes(hydrate_node, null);
			return hydrate_node;
		}
		if (node === void 0) {
			node = fragment_from_tree(structure, (flags & 4) !== 0 ? NAMESPACE_SVG : (flags & 8) !== 0 ? NAMESPACE_MATHML : void 0);
			if (!is_fragment) node = /* @__PURE__ */ get_first_child(node);
		}
		var clone = use_import_node || is_firefox ? document.importNode(node, true) : node.cloneNode(true);
		if (is_fragment) {
			var start = /* @__PURE__ */ get_first_child(clone);
			var end = clone.lastChild;
			assign_nodes(start, end);
		} else assign_nodes(clone, clone);
		return clone;
	};
}
/**
* @param {() => Element | DocumentFragment} fn
*/
function with_script(fn) {
	return () => run_scripts(fn());
}
/**
* Creating a document fragment from HTML that contains script tags will not execute
* the scripts. We need to replace the script tags with new ones so that they are executed.
* @param {Element | DocumentFragment} node
* @returns {Node | Node[]}
*/
function run_scripts(node) {
	if (hydrating) return node;
	const is_fragment = node.nodeType === 11;
	const scripts = node.nodeName === SCRIPT_TAG ? [node] : node.querySelectorAll("script");
	const effect = active_effect;
	for (const script of scripts) {
		const clone = create_element("script");
		for (var attribute of script.attributes) clone.setAttribute(attribute.name, attribute.value);
		clone.textContent = script.textContent;
		if (is_fragment ? node.firstChild === script : node === script) effect.nodes.start = clone;
		if (is_fragment ? node.lastChild === script : node === script) effect.nodes.end = clone;
		script.replaceWith(clone);
	}
	return node;
}
/**
* Don't mark this as side-effect-free, hydration needs to walk all nodes
* @param {any} value
*/
function text(value = "") {
	if (!hydrating) {
		var t = create_text(value + "");
		assign_nodes(t, t);
		return t;
	}
	var node = hydrate_node;
	if (node.nodeType !== 3) {
		node.before(node = create_text());
		set_hydrate_node(node);
	} else merge_text_nodes(node);
	assign_nodes(node, node);
	return node;
}
/**
* @returns {TemplateNode | DocumentFragment}
*/
function comment() {
	if (hydrating) {
		assign_nodes(hydrate_node, null);
		return hydrate_node;
	}
	var frag = document.createDocumentFragment();
	var start = document.createComment("");
	var anchor = create_text();
	frag.append(start, anchor);
	assign_nodes(start, anchor);
	return frag;
}
/**
* Assign the created (or in hydration mode, traversed) dom elements to the current block
* and insert the elements into the dom (in client mode).
* @param {Text | Comment | Element} anchor
* @param {DocumentFragment | Element} dom
*/
function append(anchor, dom) {
	if (hydrating) {
		var effect = active_effect;
		if ((effect.f & 32768) === 0 || effect.nodes.end === null) effect.nodes.end = hydrate_node;
		hydrate_next();
		return;
	}
	if (anchor === null) return;
	anchor.before(dom);
}
/**
* Create (or hydrate) an unique UID for the component instance.
*/
function props_id() {
	if (hydrating && hydrate_node && hydrate_node.nodeType === 8 && hydrate_node.textContent?.startsWith(`$`)) {
		const id = hydrate_node.textContent.substring(1);
		hydrate_next();
		return id;
	}
	(window.__svelte ??= {}).uid ??= 1;
	return `c${window.__svelte.uid++}`;
}
// node_modules/svelte/src/internal/client/dom/blocks/boundary.js
/** @import { Effect, Source, TemplateNode, } from '#client' */
/**
* @typedef {{
* 	 onerror?: ((error: unknown, reset: () => void) => void) | null;
*   failed?: ((anchor: Node, error: () => unknown, reset: () => () => void) => void) | null;
*   pending?: ((anchor: Node) => void) | null;
* }} BoundaryProps
*/
var flags = EFFECT_TRANSPARENT | EFFECT_PRESERVED;
/**
* @param {TemplateNode} node
* @param {BoundaryProps} props
* @param {((anchor: Node) => void)} children
* @param {((error: unknown) => unknown) | undefined} [transform_error]
* @returns {void}
*/
function boundary(node, props, children, transform_error) {
	new Boundary(node, props, children, transform_error);
}
var Boundary = class {
	/** @type {Boundary | null} */
	parent;
	is_pending = false;
	/**
	* API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
	* Inherited from parent boundary, or defaults to identity.
	* @type {(error: unknown) => unknown}
	*/
	transform_error;
	/** @type {TemplateNode} */
	#anchor;
	/** @type {TemplateNode | null} */
	#hydrate_open = hydrating ? hydrate_node : null;
	/** @type {BoundaryProps} */
	#props;
	/** @type {((anchor: Node) => void)} */
	#children;
	/** @type {Effect} */
	#effect;
	/** @type {Effect | null} */
	#main_effect = null;
	/** @type {Effect | null} */
	#pending_effect = null;
	/** @type {Effect | null} */
	#failed_effect = null;
	/** @type {DocumentFragment | null} */
	#offscreen_fragment = null;
	#local_pending_count = 0;
	#pending_count = 0;
	#pending_count_update_queued = false;
	/** @type {Map<Effect, number>} */
	#dirty_reactions = /* @__PURE__ */ new Map();
	/**
	* A source containing the number of pending async deriveds/expressions.
	* Only created if `$effect.pending()` is used inside the boundary,
	* otherwise updating the source results in needless `Batch.ensure()`
	* calls followed by no-op flushes
	* @type {Source<number> | null}
	*/
	#effect_pending = null;
	#effect_pending_subscriber = createSubscriber(() => {
		this.#effect_pending = source(this.#local_pending_count);
		tag(this.#effect_pending, "$effect.pending()");
		return () => {
			this.#effect_pending = null;
		};
	});
	/**
	* @param {TemplateNode} node
	* @param {BoundaryProps} props
	* @param {((anchor: Node) => void)} children
	* @param {((error: unknown) => unknown) | undefined} [transform_error]
	*/
	constructor(node, props, children, transform_error) {
		this.#anchor = node;
		this.#props = props;
		this.#children = (anchor) => {
			var effect = active_effect;
			effect.b = this;
			effect.f |= 128;
			children(anchor);
		};
		this.parent = active_effect.b;
		this.transform_error = transform_error ?? this.parent?.transform_error ?? ((e) => e);
		this.#effect = block(() => {
			if (hydrating) {
				const comment_data = read_hydration_instruction(this.#hydrate_open);
				hydrate_next();
				const server_rendered_pending = comment_data === "[!";
				if (comment_data.startsWith("[?")) {
					const serialized_error = JSON.parse(comment_data.slice(2));
					this.#hydrate_failed_content(serialized_error);
				} else if (server_rendered_pending) this.#hydrate_pending_content();
				else this.#hydrate_resolved_content();
			} else this.#render();
		}, flags);
		if (hydrating) this.#anchor = hydrate_node;
	}
	#hydrate_resolved_content() {
		try {
			this.#main_effect = branch(() => this.#children(this.#anchor));
		} catch (error) {
			this.error(error);
		}
	}
	/**
	* @param {unknown} error The deserialized error from the server's hydration comment
	*/
	#hydrate_failed_content(error) {
		const failed = this.#props.failed;
		const { reset, invoke_onerror } = this.#create_reset(error);
		queue_micro_task(invoke_onerror);
		if (!failed) return;
		this.#failed_effect = branch(() => {
			failed(this.#anchor, () => error, () => reset);
		});
	}
	/**
	* Creates the `reset` function for a failed boundary, along with a function
	* that invokes `onerror` with it (if provided)
	* @param {unknown} error
	* @returns {{ reset: () => void, invoke_onerror: () => void }}
	*/
	#create_reset(error) {
		var did_reset = false;
		var calling_on_error = false;
		const reset = () => {
			if (this.#is_destroyed()) return;
			if (did_reset) {
				svelte_boundary_reset_noop();
				return;
			}
			did_reset = true;
			if (calling_on_error) svelte_boundary_reset_onerror();
			if (this.#failed_effect !== null) pause_effect(this.#failed_effect, () => {
				this.#failed_effect = null;
			});
			this.#run(() => {
				this.#render();
			});
		};
		const invoke_onerror = () => {
			if (this.#is_destroyed()) return;
			try {
				calling_on_error = true;
				this.#props.onerror?.(error, reset);
				calling_on_error = false;
			} catch (err) {
				invoke_error_boundary(err, this.#effect && this.#effect.parent);
			}
		};
		return {
			reset,
			invoke_onerror
		};
	}
	#is_destroyed() {
		return (this.#effect.f & (DESTROYED | DESTROYING)) !== 0;
	}
	#hydrate_pending_content() {
		const pending = this.#props.pending;
		if (!pending) return;
		this.is_pending = true;
		this.#pending_effect = branch(() => pending(this.#anchor));
		queue_micro_task(() => {
			if (this.#is_destroyed()) return;
			var fragment = this.#offscreen_fragment = document.createDocumentFragment();
			var anchor = create_text();
			var handled = false;
			fragment.append(anchor);
			this.#main_effect = this.#run(() => {
				try {
					return branch(() => this.#children(anchor));
				} catch (error) {
					try {
						this.error(error);
						handled = true;
					} catch (error) {
						invoke_error_boundary(error, this.#effect.parent);
					}
					return null;
				}
			});
			if (this.#main_effect === null) {
				this.#offscreen_fragment = null;
				if (handled) this.#resolve(current_batch);
				return;
			}
			if (this.#pending_count === 0) {
				this.#anchor.before(fragment);
				this.#offscreen_fragment = null;
				pause_effect(this.#pending_effect, () => {
					this.#pending_effect = null;
				});
				this.#resolve(current_batch);
			}
		});
	}
	#render() {
		try {
			this.is_pending = this.has_pending_snippet();
			this.#pending_count = 0;
			this.#local_pending_count = 0;
			this.#main_effect = branch(() => {
				this.#children(this.#anchor);
			});
			if (this.#pending_count > 0) {
				var fragment = this.#offscreen_fragment = document.createDocumentFragment();
				move_effect(this.#main_effect, fragment);
				const pending = this.#props.pending;
				this.#pending_effect = branch(() => pending(this.#anchor));
			} else this.#resolve(current_batch);
		} catch (error) {
			this.error(error);
		}
	}
	/**
	* @param {Batch} batch
	*/
	#resolve(batch) {
		this.is_pending = false;
		batch.transfer_reactions(this.#dirty_reactions);
	}
	/**
	* Defer an effect inside a pending boundary until the boundary resolves
	* @param {Effect} effect
	*/
	defer_effect(effect) {
		defer_effect(effect, this.#dirty_reactions);
	}
	/**
	* Returns `false` if the effect exists inside a boundary whose pending snippet is shown
	* @returns {boolean}
	*/
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#props.pending;
	}
	/**
	* @template T
	* @param {() => T} fn
	*/
	#run(fn) {
		var previous_effect = active_effect;
		var previous_reaction = active_reaction;
		var previous_ctx = component_context;
		set_active_effect(this.#effect);
		set_active_reaction(this.#effect);
		set_component_context(this.#effect.ctx);
		try {
			Batch.ensure();
			return fn();
		} finally {
			set_active_effect(previous_effect);
			set_active_reaction(previous_reaction);
			set_component_context(previous_ctx);
		}
	}
	/**
	* Updates the pending count associated with the currently visible pending snippet,
	* if any, such that we can replace the snippet with content once work is done
	* @param {1 | -1} d
	* @param {Batch} batch
	*/
	#update_pending_count(d, batch) {
		if (!this.has_pending_snippet()) {
			if (this.parent) this.parent.#update_pending_count(d, batch);
			return;
		}
		this.#pending_count += d;
		if (this.#pending_count === 0) {
			this.#resolve(batch);
			if (this.#pending_effect) pause_effect(this.#pending_effect, () => {
				this.#pending_effect = null;
			});
			if (this.#offscreen_fragment) {
				this.#anchor.before(this.#offscreen_fragment);
				this.#offscreen_fragment = null;
			}
		}
	}
	/**
	* Update the source that powers `$effect.pending()` inside this boundary,
	* and controls when the current `pending` snippet (if any) is removed.
	* Do not call from inside the class
	* @param {1 | -1} d
	* @param {Batch} batch
	*/
	update_pending_count(d, batch) {
		this.#update_pending_count(d, batch);
		this.#local_pending_count += d;
		if (!this.#effect_pending || this.#pending_count_update_queued) return;
		this.#pending_count_update_queued = true;
		queue_micro_task(() => {
			this.#pending_count_update_queued = false;
			if (this.#effect_pending) internal_set(this.#effect_pending, this.#local_pending_count);
		});
	}
	get_effect_pending() {
		this.#effect_pending_subscriber();
		return get(this.#effect_pending);
	}
	/** @param {unknown} error */
	error(error) {
		if (error === HYDRATION_ERROR) throw error;
		if (!this.#props.onerror && !this.#props.failed) throw error;
		if (current_batch?.is_fork) {
			if (this.#main_effect) current_batch.skip_effect(this.#main_effect);
			if (this.#pending_effect) current_batch.skip_effect(this.#pending_effect);
			if (this.#failed_effect) current_batch.skip_effect(this.#failed_effect);
			current_batch.oncommit(() => {
				if (!this.#is_destroyed()) this.#handle_error(error);
			});
		} else this.#handle_error(error);
	}
	/**
	* @param {unknown} error
	*/
	#handle_error(error) {
		if (this.#main_effect) {
			destroy_effect(this.#main_effect);
			this.#main_effect = null;
		}
		if (this.#pending_effect) {
			destroy_effect(this.#pending_effect);
			this.#pending_effect = null;
		}
		if (this.#failed_effect) {
			destroy_effect(this.#failed_effect);
			this.#failed_effect = null;
		}
		if (hydrating) {
			set_hydrate_node(this.#hydrate_open);
			next();
			set_hydrate_node(skip_nodes());
		}
		let failed = this.#props.failed;
		/** @param {unknown} transformed_error */
		const handle_error_result = (transformed_error) => {
			if (this.#is_destroyed()) return;
			const { reset, invoke_onerror } = this.#create_reset(transformed_error);
			invoke_onerror();
			if (failed && !this.#is_destroyed()) this.#failed_effect = this.#run(() => {
				try {
					return branch(() => {
						var effect = active_effect;
						effect.b = this;
						effect.f |= 128;
						failed(this.#anchor, () => transformed_error, () => reset);
					});
				} catch (error) {
					invoke_error_boundary(error, this.#effect.parent);
					return null;
				}
			});
		};
		queue_micro_task(() => {
			if (this.#is_destroyed()) return;
			/** @type {unknown} */
			var result;
			try {
				result = this.transform_error(error);
			} catch (e) {
				invoke_error_boundary(e, this.#effect && this.#effect.parent);
				return;
			}
			if (result !== null && typeof result === "object" && typeof result.then === "function")
 /** @type {any} */ result.then(
				handle_error_result,
				/** @param {unknown} e */
				(e) => invoke_error_boundary(e, this.#effect && this.#effect.parent)
			);
			else handle_error_result(result);
		});
	}
};
function pending() {
	if (active_effect === null) effect_pending_outside_reaction();
	var boundary = active_effect.b;
	if (boundary === null) return 0;
	return boundary.get_effect_pending();
}
// node_modules/svelte/src/internal/client/render.js
/** @import { ComponentContext, Effect, EffectNodes, TemplateNode } from '#client' */
/** @import { Component, ComponentType, SvelteComponent, MountOptions } from '../../index.js' */
/**
* This is normally true — block effects should run their intro transitions —
* but is false during hydration (unless `options.intro` is `true`) and
* when creating the children of a `<svelte:element>` that just changed tag
*/
var should_intro = true;
/** @param {boolean} value */
function set_should_intro(value) {
	should_intro = value;
}
/**
* @param {Element} text
* @param {string} value
* @returns {void}
*/
function set_text(text, value) {
	var str = value == null ? "" : typeof value === "object" ? `${value}` : value;
	if (str !== (text[TEXT_CACHE] ??= text.nodeValue)) {
		/** @type {any} */ text[TEXT_CACHE] = str;
		text.nodeValue = `${str}`;
	}
}
/**
* Mounts a component to the given target and returns the exports and potentially the props (if compiled with `accessors: true`) of the component.
* Transitions will play during the initial render unless the `intro` option is set to `false`.
*
* @template {Record<string, any>} Props
* @template {Record<string, any>} Exports
* @param {ComponentType<SvelteComponent<Props>> | Component<Props, Exports, any>} component
* @param {MountOptions<Props>} options
* @returns {Exports}
*/
function mount(component, options) {
	return _mount(component, options);
}
/**
* Hydrates a component on the given target and returns the exports and potentially the props (if compiled with `accessors: true`) of the component
*
* @template {Record<string, any>} Props
* @template {Record<string, any>} Exports
* @param {ComponentType<SvelteComponent<Props>> | Component<Props, Exports, any>} component
* @param {{} extends Props ? {
* 		target: Document | Element | ShadowRoot;
* 		props?: Props;
* 		events?: Record<string, (e: any) => any>;
*  	context?: Map<any, any>;
* 		intro?: boolean;
* 		recover?: boolean;
*		transformError?: (error: unknown) => unknown;
* 	} : {
* 		target: Document | Element | ShadowRoot;
* 		props: Props;
* 		events?: Record<string, (e: any) => any>;
*  	context?: Map<any, any>;
* 		intro?: boolean;
* 		recover?: boolean;
*		transformError?: (error: unknown) => unknown;
* 	}} options
* @returns {Exports}
*/
function hydrate(component, options) {
	init_operations();
	options.intro = options.intro ?? false;
	const target = options.target;
	const was_hydrating = hydrating;
	const previous_hydrate_node = hydrate_node;
	try {
		var anchor = /* @__PURE__ */ get_first_child(target);
		while (anchor && (anchor.nodeType !== 8 || anchor.data !== "[")) anchor = /* @__PURE__ */ get_next_sibling(anchor);
		if (!anchor) throw HYDRATION_ERROR;
		set_hydrating(true);
		set_hydrate_node(anchor);
		const instance = _mount(component, {
			...options,
			anchor
		});
		set_hydrating(false);
		return instance;
	} catch (error) {
		if (error instanceof Error && error.message.split("\n").some((line) => line.startsWith("https://svelte.dev/e/"))) throw error;
		if (error !== HYDRATION_ERROR) console.warn("Failed to hydrate: ", error);
		if (options.recover === false) hydration_failed();
		init_operations();
		clear_text_content(target);
		set_hydrating(false);
		return mount(component, options);
	} finally {
		set_hydrating(was_hydrating);
		set_hydrate_node(previous_hydrate_node);
	}
}
/** @type {Map<EventTarget, Map<string, number>>} */
var listeners = /* @__PURE__ */ new Map();
/**
* @template {Record<string, any>} Exports
* @param {ComponentType<SvelteComponent<any>> | Component<any>} Component
* @param {MountOptions} options
* @returns {Exports}
*/
function _mount(Component, { target, anchor, props = {}, events, context, intro = true, transformError }) {
	init_operations();
	/** @type {Exports} */
	var component = void 0;
	var unmount = component_root(() => {
		var anchor_node = anchor ?? target.appendChild(create_text());
		boundary(anchor_node, { pending: () => {} }, (anchor_node) => {
			push({});
			var ctx = component_context;
			if (context) ctx.c = context;
			if (events)
 /** @type {any} */ props.$$events = events;
			if (hydrating) assign_nodes(anchor_node, null);
			should_intro = intro;
			component = Component(anchor_node, props) || mark_as_component();
			should_intro = true;
			if (hydrating) {
				/** @type {Effect & { nodes: EffectNodes }} */ active_effect.nodes.end = hydrate_node;
				if (hydrate_node === null || hydrate_node.nodeType !== 8 || hydrate_node.data !== "]") {
					hydration_mismatch();
					throw HYDRATION_ERROR;
				}
			}
			pop();
		}, transformError);
		/** @type {Set<string>} */
		var registered_events = /* @__PURE__ */ new Set();
		/** @param {Array<string>} events */
		var event_handle = (events) => {
			for (var i = 0; i < events.length; i++) {
				var event_name = events[i];
				if (registered_events.has(event_name)) continue;
				registered_events.add(event_name);
				var passive = is_passive_event(event_name);
				for (const node of [target, document]) {
					var counts = listeners.get(node);
					if (counts === void 0) {
						counts = /* @__PURE__ */ new Map();
						listeners.set(node, counts);
					}
					var count = counts.get(event_name);
					if (count === void 0) {
						node.addEventListener(event_name, handle_event_propagation, { passive });
						counts.set(event_name, 1);
					} else counts.set(event_name, count + 1);
				}
			}
		};
		event_handle(array_from(all_registered_events));
		root_event_handles.add(event_handle);
		return () => {
			for (var event_name of registered_events) for (const node of [target, document]) {
				var counts = listeners.get(node);
				var count = counts.get(event_name);
				if (--count == 0) {
					node.removeEventListener(event_name, handle_event_propagation);
					counts.delete(event_name);
					if (counts.size === 0) listeners.delete(node);
				} else counts.set(event_name, count);
			}
			root_event_handles.delete(event_handle);
			if (anchor_node !== anchor) anchor_node.parentNode?.removeChild(anchor_node);
		};
	});
	mounted_components.set(component, unmount);
	return component;
}
/**
* References of the components that were mounted or hydrated.
* Uses a `WeakMap` to avoid memory leaks.
*/
var mounted_components = /* @__PURE__ */ new WeakMap();
/**
* Unmounts a component that was previously mounted using `mount` or `hydrate`.
*
* Since 5.13.0, if `options.outro` is `true`, [transitions](https://svelte.dev/docs/svelte/transition) will play before the component is removed from the DOM.
*
* Returns a `Promise` that resolves after transitions have completed if `options.outro` is true, or immediately otherwise (prior to 5.13.0, returns `void`).
*
* ```js
* import { mount, unmount } from 'svelte';
* import App from './App.svelte';
*
* const app = mount(App, { target: document.body });
*
* // later...
* unmount(app, { outro: true });
* ```
* @param {Record<string, any>} component
* @param {{ outro?: boolean }} [options]
* @returns {Promise<void>}
*/
function unmount(component, options) {
	const fn = mounted_components.get(component);
	if (fn) {
		mounted_components.delete(component);
		return fn(options);
	}
	lifecycle_double_unmount();
	return Promise.resolve();
}
// node_modules/svelte/src/internal/client/dom/legacy/event-modifiers.js
/**
* Substitute for the `trusted` event modifier
* @deprecated
* @param {(event: Event, ...args: Array<unknown>) => void} fn
* @returns {(event: Event, ...args: unknown[]) => void}
*/
function trusted(fn) {
	return function(...args) {
		if (args[0].isTrusted) fn?.apply(this, args);
	};
}
/**
* Substitute for the `self` event modifier
* @deprecated
* @param {(event: Event, ...args: Array<unknown>) => void} fn
* @returns {(event: Event, ...args: unknown[]) => void}
*/
function self(fn) {
	return function(...args) {
		if (args[0].target === this) fn?.apply(this, args);
	};
}
/**
* Substitute for the `stopPropagation` event modifier
* @deprecated
* @param {(event: Event, ...args: Array<unknown>) => void} fn
* @returns {(event: Event, ...args: unknown[]) => void}
*/
function stopPropagation(fn) {
	return function(...args) {
		args[0].stopPropagation();
		return fn?.apply(this, args);
	};
}
/**
* Substitute for the `once` event modifier
* @deprecated
* @param {(event: Event, ...args: Array<unknown>) => void} fn
* @returns {(event: Event, ...args: unknown[]) => void}
*/
function once(fn) {
	var ran = false;
	return function(...args) {
		if (ran) return;
		ran = true;
		return fn?.apply(this, args);
	};
}
/**
* Substitute for the `stopImmediatePropagation` event modifier
* @deprecated
* @param {(event: Event, ...args: Array<unknown>) => void} fn
* @returns {(event: Event, ...args: unknown[]) => void}
*/
function stopImmediatePropagation(fn) {
	return function(...args) {
		args[0].stopImmediatePropagation();
		return fn?.apply(this, args);
	};
}
/**
* Substitute for the `preventDefault` event modifier
* @deprecated
* @param {(event: Event, ...args: Array<unknown>) => void} fn
* @returns {(event: Event, ...args: unknown[]) => void}
*/
function preventDefault(fn) {
	return function(...args) {
		args[0].preventDefault();
		return fn?.apply(this, args);
	};
}
/**
* Substitute for the `passive` event modifier, implemented as an action
* @deprecated
* @param {HTMLElement} node
* @param {[event: string, handler: () => EventListener]} options
*/
function passive(node, [event, handler]) {
	user_pre_effect(() => {
		return on(node, event, handler() ?? noop, { passive: true });
	});
}
/**
* Substitute for the `nonpassive` event modifier, implemented as an action
* @deprecated
* @param {HTMLElement} node
* @param {[event: string, handler: () => EventListener]} options
*/
function nonpassive(node, [event, handler]) {
	user_pre_effect(() => {
		return on(node, event, handler() ?? noop, { passive: false });
	});
}
// node_modules/svelte/src/legacy/legacy-client.js
/** @import { ComponentConstructorOptions, ComponentType, SvelteComponent, Component } from 'svelte' */
/**
* Takes the same options as a Svelte 4 component and the component function and returns a Svelte 4 compatible component.
*
* @deprecated Use this only as a temporary solution to migrate your imperative component code to Svelte 5.
*
* @template {Record<string, any>} Props
* @template {Record<string, any>} Exports
* @template {Record<string, any>} Events
* @template {Record<string, any>} Slots
*
* @param {ComponentConstructorOptions<Props> & {
* 	component: ComponentType<SvelteComponent<Props, Events, Slots>> | Component<Props>;
* }} options
* @returns {SvelteComponent<Props, Events, Slots> & Exports}
*/
function createClassComponent(options) {
	return new Svelte4Component(options);
}
/**
* Takes the component function and returns a Svelte 4 compatible component constructor.
*
* @deprecated Use this only as a temporary solution to migrate your imperative component code to Svelte 5.
*
* @template {Record<string, any>} Props
* @template {Record<string, any>} Exports
* @template {Record<string, any>} Events
* @template {Record<string, any>} Slots
*
* @param {SvelteComponent<Props, Events, Slots> | Component<Props>} component
* @returns {ComponentType<SvelteComponent<Props, Events, Slots> & Exports>}
*/
function asClassComponent(component) {
	return class extends Svelte4Component {
		/** @param {any} options */
		constructor(options) {
			super({
				component,
				...options
			});
		}
	};
}
/**
* Support using the component as both a class and function during the transition period
* @typedef  {{new (o: ComponentConstructorOptions): SvelteComponent;(...args: Parameters<Component<Record<string, any>>>): ReturnType<Component<Record<string, any>, Record<string, any>>>;}} LegacyComponentType
*/
var Svelte4Component = class {
	/** @type {any} */
	#events;
	/** @type {Record<string, any>} */
	#instance;
	/**
	* @param {ComponentConstructorOptions & {
	*  component: any;
	* }} options
	*/
	constructor(options) {
		var sources = /* @__PURE__ */ new Map();
		/**
		* @param {string | symbol} key
		* @param {unknown} value
		*/
		var add_source = (key, value) => {
			var s = /* @__PURE__ */ mutable_source(value, false, false);
			sources.set(key, s);
			return s;
		};
		const props = new Proxy({
			...options.props || {},
			$$events: {}
		}, {
			get(target, prop) {
				return get(sources.get(prop) ?? add_source(prop, Reflect.get(target, prop)));
			},
			has(target, prop) {
				if (prop === LEGACY_PROPS) return true;
				get(sources.get(prop) ?? add_source(prop, Reflect.get(target, prop)));
				return Reflect.has(target, prop);
			},
			set(target, prop, value) {
				set(sources.get(prop) ?? add_source(prop, value), value);
				return Reflect.set(target, prop, value);
			}
		});
		this.#instance = (options.hydrate ? hydrate : mount)(options.component, {
			target: options.target,
			anchor: options.anchor,
			props,
			context: options.context,
			intro: options.intro ?? false,
			recover: options.recover,
			transformError: options.transformError
		});
		if (!async_mode_flag && (!options?.props?.$$host || options.sync === false)) flushSync();
		this.#events = props.$$events;
		for (const key of Object.keys(this.#instance)) {
			if (key === "$set" || key === "$destroy" || key === "$on") continue;
			define_property(this, key, {
				get() {
					return this.#instance[key];
				},
				/** @param {any} value */
				set(value) {
					this.#instance[key] = value;
				},
				enumerable: true
			});
		}
		this.#instance.$set = (next) => {
			Object.assign(props, next);
		};
		this.#instance.$destroy = () => {
			unmount(this.#instance);
		};
	}
	/** @param {Record<string, any>} props */
	$set(props) {
		this.#instance.$set(props);
	}
	/**
	* @param {string} event
	* @param {(...args: any[]) => any} callback
	* @returns {any}
	*/
	$on(event, callback) {
		this.#events[event] = this.#events[event] || [];
		/** @param {any[]} args */
		const cb = (...args) => callback.call(this, ...args);
		this.#events[event].push(cb);
		return () => {
			this.#events[event] = this.#events[event].filter(
				/** @param {any} fn */
				(fn) => fn !== cb
			);
		};
	}
	$destroy() {
		this.#instance.$destroy();
	}
};
/**
* Runs the given function once immediately on the server, and works like `$effect.pre` on the client.
*
* @deprecated Use this only as a temporary solution to migrate your component code to Svelte 5.
* @param {() => void | (() => void)} fn
* @returns {void}
*/
function run(fn) {
	user_pre_effect(() => {
		fn();
		var effect = active_effect;
		if ((effect.f & 2048) !== 0) {
			let filename = "a file (we can't know which one)";
			filename = dev_current_component_function?.[FILENAME] ?? filename;
			legacy_recursive_reactive_block(filename);
			set_signal_status(effect, MAYBE_DIRTY);
		}
	});
}
/**
* Function to mimic the multiple listeners available in svelte 4
* @deprecated
* @param {EventListener[]} handlers
* @returns {EventListener}
*/
function handlers(...handlers) {
	return function(event) {
		const { stopImmediatePropagation } = event;
		let stopped = false;
		event.stopImmediatePropagation = () => {
			stopped = true;
			stopImmediatePropagation.call(event);
		};
		const errors = [];
		for (const handler of handlers) {
			try {
				handler?.call(this, event);
			} catch (e) {
				errors.push(e);
			}
			if (stopped) break;
		}
		for (let error of errors) queueMicrotask(() => {
			throw error;
		});
	};
}
/**
* Function to create a `bubble` function that mimic the behavior of `on:click` without handler available in svelte 4.
* @deprecated Use this only as a temporary solution to migrate your automatically delegated events in Svelte 5.
*/
function createBubbler() {
	const active_component_context = component_context;
	if (active_component_context === null) lifecycle_outside_component("createBubbler");
	return (type) => (event) => {
		const events = active_component_context.s.$$events?.[type];
		if (events) {
			const callbacks = is_array(events) ? events.slice() : [events];
			for (const fn of callbacks) fn.call(active_component_context.x, event);
			return !event.defaultPrevented;
		}
		return true;
	};
}
export { text as A, sanitize_location as B, assign_nodes as C, from_svg as D, from_mathml as E, hash as F, is_capture_event as I, is_raw_text_element as L, create_fragment_from_html as M, create_trusted_html as N, from_tree as O, can_delegate_event as P, is_void as R, append as S, from_html as T, set_text as _, run as a, boundary as b, passive as c, stopImmediatePropagation as d, stopPropagation as f, set_should_intro as g, mount as h, handlers as i, with_script as j, props_id as k, preventDefault as l, hydrate as m, createBubbler as n, nonpassive as o, trusted as p, createClassComponent as r, once as s, asClassComponent as t, self as u, should_intro as v, comment as w, pending as x, unmount as y, normalize_attribute as z };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVnYWN5LWNsaWVudC1DZ05xVVpyVC5qcyIsIm5hbWVzIjpbXSwic291cmNlcyI6WyIuLi8uLi9zdmVsdGUvc3JjL3V0aWxzLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL3JlY29uY2lsZXIuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vdGVtcGxhdGUuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2ludGVybmFsL2NsaWVudC9kb20vYmxvY2tzL2JvdW5kYXJ5LmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvcmVuZGVyLmpzIiwiLi4vLi4vc3ZlbHRlL3NyYy9pbnRlcm5hbC9jbGllbnQvZG9tL2xlZ2FjeS9ldmVudC1tb2RpZmllcnMuanMiLCIuLi8uLi9zdmVsdGUvc3JjL2xlZ2FjeS9sZWdhY3ktY2xpZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHJlZ2V4X3JldHVybl9jaGFyYWN0ZXJzID0gL1xcci9nO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNoKHN0cikge1xuXHRzdHIgPSBzdHIucmVwbGFjZShyZWdleF9yZXR1cm5fY2hhcmFjdGVycywgJycpO1xuXHRsZXQgaGFzaCA9IDUzODE7XG5cdGxldCBpID0gc3RyLmxlbmd0aDtcblxuXHR3aGlsZSAoaS0tKSBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgXiBzdHIuY2hhckNvZGVBdChpKTtcblx0cmV0dXJuIChoYXNoID4+PiAwKS50b1N0cmluZygzNik7XG59XG5cbmNvbnN0IFZPSURfRUxFTUVOVF9OQU1FUyA9IFtcblx0J2FyZWEnLFxuXHQnYmFzZScsXG5cdCdicicsXG5cdCdjb2wnLFxuXHQnY29tbWFuZCcsXG5cdCdlbWJlZCcsXG5cdCdocicsXG5cdCdpbWcnLFxuXHQnaW5wdXQnLFxuXHQna2V5Z2VuJyxcblx0J2xpbmsnLFxuXHQnbWV0YScsXG5cdCdwYXJhbScsXG5cdCdzb3VyY2UnLFxuXHQndHJhY2snLFxuXHQnd2JyJ1xuXTtcblxuLyoqXG4gKiBSZXR1cm5zIGB0cnVlYCBpZiBgbmFtZWAgaXMgb2YgYSB2b2lkIGVsZW1lbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc192b2lkKG5hbWUpIHtcblx0cmV0dXJuIFZPSURfRUxFTUVOVF9OQU1FUy5pbmNsdWRlcyhuYW1lKSB8fCBuYW1lLnRvTG93ZXJDYXNlKCkgPT09ICchZG9jdHlwZSc7XG59XG5cbmNvbnN0IFJFU0VSVkVEX1dPUkRTID0gW1xuXHQnYXJndW1lbnRzJyxcblx0J2F3YWl0Jyxcblx0J2JyZWFrJyxcblx0J2Nhc2UnLFxuXHQnY2F0Y2gnLFxuXHQnY2xhc3MnLFxuXHQnY29uc3QnLFxuXHQnY29udGludWUnLFxuXHQnZGVidWdnZXInLFxuXHQnZGVmYXVsdCcsXG5cdCdkZWxldGUnLFxuXHQnZG8nLFxuXHQnZWxzZScsXG5cdCdlbnVtJyxcblx0J2V2YWwnLFxuXHQnZXhwb3J0Jyxcblx0J2V4dGVuZHMnLFxuXHQnZmFsc2UnLFxuXHQnZmluYWxseScsXG5cdCdmb3InLFxuXHQnZnVuY3Rpb24nLFxuXHQnaWYnLFxuXHQnaW1wbGVtZW50cycsXG5cdCdpbXBvcnQnLFxuXHQnaW4nLFxuXHQnaW5zdGFuY2VvZicsXG5cdCdpbnRlcmZhY2UnLFxuXHQnbGV0Jyxcblx0J25ldycsXG5cdCdudWxsJyxcblx0J3BhY2thZ2UnLFxuXHQncHJpdmF0ZScsXG5cdCdwcm90ZWN0ZWQnLFxuXHQncHVibGljJyxcblx0J3JldHVybicsXG5cdCdzdGF0aWMnLFxuXHQnc3VwZXInLFxuXHQnc3dpdGNoJyxcblx0J3RoaXMnLFxuXHQndGhyb3cnLFxuXHQndHJ1ZScsXG5cdCd0cnknLFxuXHQndHlwZW9mJyxcblx0J3ZhcicsXG5cdCd2b2lkJyxcblx0J3doaWxlJyxcblx0J3dpdGgnLFxuXHQneWllbGQnXG5dO1xuXG4vKipcbiAqIFJldHVybnMgYHRydWVgIGlmIGB3b3JkYCBpcyBhIHJlc2VydmVkIEphdmFTY3JpcHQga2V5d29yZFxuICogQHBhcmFtIHtzdHJpbmd9IHdvcmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzX3Jlc2VydmVkKHdvcmQpIHtcblx0cmV0dXJuIFJFU0VSVkVEX1dPUkRTLmluY2x1ZGVzKHdvcmQpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc19jYXB0dXJlX2V2ZW50KG5hbWUpIHtcblx0cmV0dXJuIG5hbWUuZW5kc1dpdGgoJ2NhcHR1cmUnKSAmJiBuYW1lICE9PSAnZ290cG9pbnRlcmNhcHR1cmUnICYmIG5hbWUgIT09ICdsb3N0cG9pbnRlcmNhcHR1cmUnO1xufVxuXG4vKiogTGlzdCBvZiBFbGVtZW50IGV2ZW50cyB0aGF0IHdpbGwgYmUgZGVsZWdhdGVkICovXG5jb25zdCBERUxFR0FURURfRVZFTlRTID0gW1xuXHQnYmVmb3JlaW5wdXQnLFxuXHQnY2xpY2snLFxuXHQnY2hhbmdlJyxcblx0J2RibGNsaWNrJyxcblx0J2NvbnRleHRtZW51Jyxcblx0J2ZvY3VzaW4nLFxuXHQnZm9jdXNvdXQnLFxuXHQnaW5wdXQnLFxuXHQna2V5ZG93bicsXG5cdCdrZXl1cCcsXG5cdCdtb3VzZWRvd24nLFxuXHQnbW91c2Vtb3ZlJyxcblx0J21vdXNlb3V0Jyxcblx0J21vdXNlb3ZlcicsXG5cdCdtb3VzZXVwJyxcblx0J3BvaW50ZXJkb3duJyxcblx0J3BvaW50ZXJtb3ZlJyxcblx0J3BvaW50ZXJvdXQnLFxuXHQncG9pbnRlcm92ZXInLFxuXHQncG9pbnRlcnVwJyxcblx0J3RvdWNoZW5kJyxcblx0J3RvdWNobW92ZScsXG5cdCd0b3VjaHN0YXJ0J1xuXTtcblxuLyoqXG4gKiBSZXR1cm5zIGB0cnVlYCBpZiBgZXZlbnRfbmFtZWAgaXMgYSBkZWxlZ2F0ZWQgZXZlbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudF9uYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5fZGVsZWdhdGVfZXZlbnQoZXZlbnRfbmFtZSkge1xuXHRyZXR1cm4gREVMRUdBVEVEX0VWRU5UUy5pbmNsdWRlcyhldmVudF9uYW1lKTtcbn1cblxuLyoqXG4gKiBBdHRyaWJ1dGVzIHRoYXQgYXJlIGJvb2xlYW4sIGkuZS4gdGhleSBhcmUgcHJlc2VudCBvciBub3QgcHJlc2VudC5cbiAqL1xuY29uc3QgRE9NX0JPT0xFQU5fQVRUUklCVVRFUyA9IFtcblx0J2FsbG93ZnVsbHNjcmVlbicsXG5cdCdhc3luYycsXG5cdCdhdXRvZm9jdXMnLFxuXHQnYXV0b3BsYXknLFxuXHQnY2hlY2tlZCcsXG5cdCdjb250cm9scycsXG5cdCdkZWZhdWx0Jyxcblx0J2Rpc2FibGVkJyxcblx0J2Zvcm1ub3ZhbGlkYXRlJyxcblx0J2luZGV0ZXJtaW5hdGUnLFxuXHQnaW5lcnQnLFxuXHQnaXNtYXAnLFxuXHQnbG9vcCcsXG5cdCdtdWx0aXBsZScsXG5cdCdtdXRlZCcsXG5cdCdub21vZHVsZScsXG5cdCdub3ZhbGlkYXRlJyxcblx0J29wZW4nLFxuXHQncGxheXNpbmxpbmUnLFxuXHQncmVhZG9ubHknLFxuXHQncmVxdWlyZWQnLFxuXHQncmV2ZXJzZWQnLFxuXHQnc2VhbWxlc3MnLFxuXHQnc2VsZWN0ZWQnLFxuXHQnd2Via2l0ZGlyZWN0b3J5Jyxcblx0J2RlZmVyJyxcblx0J2Rpc2FibGVwaWN0dXJlaW5waWN0dXJlJyxcblx0J2Rpc2FibGVyZW1vdGVwbGF5YmFjaydcbl07XG5cbi8qKlxuICogUmV0dXJucyBgdHJ1ZWAgaWYgYG5hbWVgIGlzIGEgYm9vbGVhbiBhdHRyaWJ1dGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc19ib29sZWFuX2F0dHJpYnV0ZShuYW1lKSB7XG5cdHJldHVybiBET01fQk9PTEVBTl9BVFRSSUJVVEVTLmluY2x1ZGVzKG5hbWUpO1xufVxuXG4vKipcbiAqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fVxuICogTGlzdCBvZiBhdHRyaWJ1dGUgbmFtZXMgdGhhdCBzaG91bGQgYmUgYWxpYXNlZCB0byB0aGVpciBwcm9wZXJ0eSBuYW1lc1xuICogYmVjYXVzZSB0aGV5IGJlaGF2ZSBkaWZmZXJlbnRseSBiZXR3ZWVuIHNldHRpbmcgdGhlbSBhcyBhbiBhdHRyaWJ1dGUgYW5kXG4gKiBzZXR0aW5nIHRoZW0gYXMgYSBwcm9wZXJ0eS5cbiAqL1xuY29uc3QgQVRUUklCVVRFX0FMSUFTRVMgPSB7XG5cdC8vIG5vIGBjbGFzczogJ2NsYXNzTmFtZSdgIGJlY2F1c2Ugd2UgaGFuZGxlIHRoYXQgc2VwYXJhdGVseVxuXHRmb3Jtbm92YWxpZGF0ZTogJ2Zvcm1Ob1ZhbGlkYXRlJyxcblx0aXNtYXA6ICdpc01hcCcsXG5cdG5vbW9kdWxlOiAnbm9Nb2R1bGUnLFxuXHRwbGF5c2lubGluZTogJ3BsYXlzSW5saW5lJyxcblx0cmVhZG9ubHk6ICdyZWFkT25seScsXG5cdGRlZmF1bHR2YWx1ZTogJ2RlZmF1bHRWYWx1ZScsXG5cdGRlZmF1bHRjaGVja2VkOiAnZGVmYXVsdENoZWNrZWQnLFxuXHRzcmNvYmplY3Q6ICdzcmNPYmplY3QnLFxuXHRub3ZhbGlkYXRlOiAnbm9WYWxpZGF0ZScsXG5cdGFsbG93ZnVsbHNjcmVlbjogJ2FsbG93RnVsbHNjcmVlbicsXG5cdGRpc2FibGVwaWN0dXJlaW5waWN0dXJlOiAnZGlzYWJsZVBpY3R1cmVJblBpY3R1cmUnLFxuXHRkaXNhYmxlcmVtb3RlcGxheWJhY2s6ICdkaXNhYmxlUmVtb3RlUGxheWJhY2snXG59O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVfYXR0cmlidXRlKG5hbWUpIHtcblx0bmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcblx0cmV0dXJuIEFUVFJJQlVURV9BTElBU0VTW25hbWVdID8/IG5hbWU7XG59XG5cbmNvbnN0IERPTV9QUk9QRVJUSUVTID0gW1xuXHQuLi5ET01fQk9PTEVBTl9BVFRSSUJVVEVTLFxuXHQnZm9ybU5vVmFsaWRhdGUnLFxuXHQnaXNNYXAnLFxuXHQnbm9Nb2R1bGUnLFxuXHQncGxheXNJbmxpbmUnLFxuXHQncmVhZE9ubHknLFxuXHQndmFsdWUnLFxuXHQndm9sdW1lJyxcblx0J2RlZmF1bHRWYWx1ZScsXG5cdCdkZWZhdWx0Q2hlY2tlZCcsXG5cdCdzcmNPYmplY3QnLFxuXHQnbm9WYWxpZGF0ZScsXG5cdCdhbGxvd0Z1bGxzY3JlZW4nLFxuXHQnZGlzYWJsZVBpY3R1cmVJblBpY3R1cmUnLFxuXHQnZGlzYWJsZVJlbW90ZVBsYXliYWNrJ1xuXTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNfZG9tX3Byb3BlcnR5KG5hbWUpIHtcblx0cmV0dXJuIERPTV9QUk9QRVJUSUVTLmluY2x1ZGVzKG5hbWUpO1xufVxuXG5jb25zdCBOT05fU1RBVElDX1BST1BFUlRJRVMgPSBbJ2F1dG9mb2N1cycsICdtdXRlZCcsICdkZWZhdWx0VmFsdWUnLCAnZGVmYXVsdENoZWNrZWQnXTtcblxuLyoqXG4gKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZ2l2ZW4gYXR0cmlidXRlIGNhbm5vdCBiZSBzZXQgdGhyb3VnaCB0aGUgdGVtcGxhdGVcbiAqIHN0cmluZywgaS5lLiBuZWVkcyBzb21lIGtpbmQgb2YgSmF2YVNjcmlwdCBoYW5kbGluZyB0byB3b3JrLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbm5vdF9iZV9zZXRfc3RhdGljYWxseShuYW1lKSB7XG5cdHJldHVybiBOT05fU1RBVElDX1BST1BFUlRJRVMuaW5jbHVkZXMobmFtZSk7XG59XG5cbi8qKlxuICogU3Vic2V0IG9mIGRlbGVnYXRlZCBldmVudHMgd2hpY2ggc2hvdWxkIGJlIHBhc3NpdmUgYnkgZGVmYXVsdC5cbiAqIFRoZXNlIHR3byBhcmUgYWxyZWFkeSBwYXNzaXZlIHZpYSBicm93c2VyIGRlZmF1bHRzIG9uIHdpbmRvdywgZG9jdW1lbnQgYW5kIGJvZHkuXG4gKiBCdXQgc2luY2VcbiAqIC0gd2UncmUgZGVsZWdhdGluZyB0aGVtXG4gKiAtIHRoZXkgaGFwcGVuIG9mdGVuXG4gKiAtIHRoZXkgYXBwbHkgdG8gbW9iaWxlIHdoaWNoIGlzIGdlbmVyYWxseSBsZXNzIHBlcmZvcm1hbnRcbiAqIHdlJ3JlIG1hcmtpbmcgdGhlbSBhcyBwYXNzaXZlIGJ5IGRlZmF1bHQgZm9yIG90aGVyIGVsZW1lbnRzLCB0b28uXG4gKi9cbmNvbnN0IFBBU1NJVkVfRVZFTlRTID0gWyd0b3VjaHN0YXJ0JywgJ3RvdWNobW92ZSddO1xuXG4vKipcbiAqIFJldHVybnMgYHRydWVgIGlmIGBuYW1lYCBpcyBhIHBhc3NpdmUgZXZlbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc19wYXNzaXZlX2V2ZW50KG5hbWUpIHtcblx0cmV0dXJuIFBBU1NJVkVfRVZFTlRTLmluY2x1ZGVzKG5hbWUpO1xufVxuXG5jb25zdCBDT05URU5UX0VESVRBQkxFX0JJTkRJTkdTID0gWyd0ZXh0Q29udGVudCcsICdpbm5lckhUTUwnLCAnaW5uZXJUZXh0J107XG5cbi8qKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzX2NvbnRlbnRfZWRpdGFibGVfYmluZGluZyhuYW1lKSB7XG5cdHJldHVybiBDT05URU5UX0VESVRBQkxFX0JJTkRJTkdTLmluY2x1ZGVzKG5hbWUpO1xufVxuXG5jb25zdCBMT0FEX0VSUk9SX0VMRU1FTlRTID0gW1xuXHQnYm9keScsXG5cdCdlbWJlZCcsXG5cdCdpZnJhbWUnLFxuXHQnaW1nJyxcblx0J2xpbmsnLFxuXHQnb2JqZWN0Jyxcblx0J3NjcmlwdCcsXG5cdCdzdHlsZScsXG5cdCd0cmFjaydcbl07XG5cbi8qKlxuICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGVsZW1lbnQgZW1pdHMgYGxvYWRgIGFuZCBgZXJyb3JgIGV2ZW50c1xuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzX2xvYWRfZXJyb3JfZWxlbWVudChuYW1lKSB7XG5cdHJldHVybiBMT0FEX0VSUk9SX0VMRU1FTlRTLmluY2x1ZGVzKG5hbWUpO1xufVxuXG5jb25zdCBTVkdfRUxFTUVOVFMgPSBbXG5cdCdhbHRHbHlwaCcsXG5cdCdhbHRHbHlwaERlZicsXG5cdCdhbHRHbHlwaEl0ZW0nLFxuXHQnYW5pbWF0ZScsXG5cdCdhbmltYXRlQ29sb3InLFxuXHQnYW5pbWF0ZU1vdGlvbicsXG5cdCdhbmltYXRlVHJhbnNmb3JtJyxcblx0J2NpcmNsZScsXG5cdCdjbGlwUGF0aCcsXG5cdCdjb2xvci1wcm9maWxlJyxcblx0J2N1cnNvcicsXG5cdCdkZWZzJyxcblx0J2Rlc2MnLFxuXHQnZGlzY2FyZCcsXG5cdCdlbGxpcHNlJyxcblx0J2ZlQmxlbmQnLFxuXHQnZmVDb2xvck1hdHJpeCcsXG5cdCdmZUNvbXBvbmVudFRyYW5zZmVyJyxcblx0J2ZlQ29tcG9zaXRlJyxcblx0J2ZlQ29udm9sdmVNYXRyaXgnLFxuXHQnZmVEaWZmdXNlTGlnaHRpbmcnLFxuXHQnZmVEaXNwbGFjZW1lbnRNYXAnLFxuXHQnZmVEaXN0YW50TGlnaHQnLFxuXHQnZmVEcm9wU2hhZG93Jyxcblx0J2ZlRmxvb2QnLFxuXHQnZmVGdW5jQScsXG5cdCdmZUZ1bmNCJyxcblx0J2ZlRnVuY0cnLFxuXHQnZmVGdW5jUicsXG5cdCdmZUdhdXNzaWFuQmx1cicsXG5cdCdmZUltYWdlJyxcblx0J2ZlTWVyZ2UnLFxuXHQnZmVNZXJnZU5vZGUnLFxuXHQnZmVNb3JwaG9sb2d5Jyxcblx0J2ZlT2Zmc2V0Jyxcblx0J2ZlUG9pbnRMaWdodCcsXG5cdCdmZVNwZWN1bGFyTGlnaHRpbmcnLFxuXHQnZmVTcG90TGlnaHQnLFxuXHQnZmVUaWxlJyxcblx0J2ZlVHVyYnVsZW5jZScsXG5cdCdmaWx0ZXInLFxuXHQnZm9udCcsXG5cdCdmb250LWZhY2UnLFxuXHQnZm9udC1mYWNlLWZvcm1hdCcsXG5cdCdmb250LWZhY2UtbmFtZScsXG5cdCdmb250LWZhY2Utc3JjJyxcblx0J2ZvbnQtZmFjZS11cmknLFxuXHQnZm9yZWlnbk9iamVjdCcsXG5cdCdnJyxcblx0J2dseXBoJyxcblx0J2dseXBoUmVmJyxcblx0J2hhdGNoJyxcblx0J2hhdGNocGF0aCcsXG5cdCdoa2VybicsXG5cdCdpbWFnZScsXG5cdCdsaW5lJyxcblx0J2xpbmVhckdyYWRpZW50Jyxcblx0J21hcmtlcicsXG5cdCdtYXNrJyxcblx0J21lc2gnLFxuXHQnbWVzaGdyYWRpZW50Jyxcblx0J21lc2hwYXRjaCcsXG5cdCdtZXNocm93Jyxcblx0J21ldGFkYXRhJyxcblx0J21pc3NpbmctZ2x5cGgnLFxuXHQnbXBhdGgnLFxuXHQncGF0aCcsXG5cdCdwYXR0ZXJuJyxcblx0J3BvbHlnb24nLFxuXHQncG9seWxpbmUnLFxuXHQncmFkaWFsR3JhZGllbnQnLFxuXHQncmVjdCcsXG5cdCdzZXQnLFxuXHQnc29saWRjb2xvcicsXG5cdCdzdG9wJyxcblx0J3N2ZycsXG5cdCdzd2l0Y2gnLFxuXHQnc3ltYm9sJyxcblx0J3RleHQnLFxuXHQndGV4dFBhdGgnLFxuXHQndHJlZicsXG5cdCd0c3BhbicsXG5cdCd1bmtub3duJyxcblx0J3VzZScsXG5cdCd2aWV3Jyxcblx0J3ZrZXJuJ1xuXTtcblxuLyoqIEBwYXJhbSB7c3RyaW5nfSBuYW1lICovXG5leHBvcnQgZnVuY3Rpb24gaXNfc3ZnKG5hbWUpIHtcblx0cmV0dXJuIFNWR19FTEVNRU5UUy5pbmNsdWRlcyhuYW1lKTtcbn1cblxuY29uc3QgTUFUSE1MX0VMRU1FTlRTID0gW1xuXHQnYW5ub3RhdGlvbicsXG5cdCdhbm5vdGF0aW9uLXhtbCcsXG5cdCdtYWN0aW9uJyxcblx0J21hdGgnLFxuXHQnbWVycm9yJyxcblx0J21mcmFjJyxcblx0J21pJyxcblx0J21tdWx0aXNjcmlwdHMnLFxuXHQnbW4nLFxuXHQnbW8nLFxuXHQnbW92ZXInLFxuXHQnbXBhZGRlZCcsXG5cdCdtcGhhbnRvbScsXG5cdCdtcHJlc2NyaXB0cycsXG5cdCdtcm9vdCcsXG5cdCdtcm93Jyxcblx0J21zJyxcblx0J21zcGFjZScsXG5cdCdtc3FydCcsXG5cdCdtc3R5bGUnLFxuXHQnbXN1YicsXG5cdCdtc3Vic3VwJyxcblx0J21zdXAnLFxuXHQnbXRhYmxlJyxcblx0J210ZCcsXG5cdCdtdGV4dCcsXG5cdCdtdHInLFxuXHQnbXVuZGVyJyxcblx0J211bmRlcm92ZXInLFxuXHQnc2VtYW50aWNzJ1xuXTtcblxuLyoqIEBwYXJhbSB7c3RyaW5nfSBuYW1lICovXG5leHBvcnQgZnVuY3Rpb24gaXNfbWF0aG1sKG5hbWUpIHtcblx0cmV0dXJuIE1BVEhNTF9FTEVNRU5UUy5pbmNsdWRlcyhuYW1lKTtcbn1cblxuY29uc3QgU1RBVEVfQ1JFQVRJT05fUlVORVMgPSAvKiogQHR5cGUge2NvbnN0fSAqLyAoW1xuXHQnJHN0YXRlJyxcblx0JyRzdGF0ZS5yYXcnLFxuXHQnJGRlcml2ZWQnLFxuXHQnJGRlcml2ZWQuYnknXG5dKTtcblxuZXhwb3J0IGNvbnN0IFJVTkVTID0gLyoqIEB0eXBlIHtjb25zdH0gKi8gKFtcblx0Li4uU1RBVEVfQ1JFQVRJT05fUlVORVMsXG5cdCckc3RhdGUuZWFnZXInLFxuXHQnJHN0YXRlLnNuYXBzaG90Jyxcblx0JyRwcm9wcycsXG5cdCckcHJvcHMuaWQnLFxuXHQnJGJpbmRhYmxlJyxcblx0JyRlZmZlY3QnLFxuXHQnJGVmZmVjdC5wcmUnLFxuXHQnJGVmZmVjdC50cmFja2luZycsXG5cdCckZWZmZWN0LnJvb3QnLFxuXHQnJGVmZmVjdC5wZW5kaW5nJyxcblx0JyRpbnNwZWN0Jyxcblx0JyRpbnNwZWN0KCkud2l0aCcsXG5cdCckaW5zcGVjdC50cmFjZScsXG5cdCckaG9zdCdcbl0pO1xuXG4vKiogQHR5cGVkZWYge3R5cGVvZiBSVU5FU1tudW1iZXJdfSBSdW5lTmFtZSAqL1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJucyB7bmFtZSBpcyBSdW5lTmFtZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzX3J1bmUobmFtZSkge1xuXHRyZXR1cm4gUlVORVMuaW5jbHVkZXMoLyoqIEB0eXBlIHtSdW5lTmFtZX0gKi8gKG5hbWUpKTtcbn1cblxuLyoqIEB0eXBlZGVmIHt0eXBlb2YgU1RBVEVfQ1JFQVRJT05fUlVORVNbbnVtYmVyXX0gU3RhdGVDcmVhdGlvblJ1bmVOYW1lICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm5zIHtuYW1lIGlzIFN0YXRlQ3JlYXRpb25SdW5lTmFtZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzX3N0YXRlX2NyZWF0aW9uX3J1bmUobmFtZSkge1xuXHRyZXR1cm4gU1RBVEVfQ1JFQVRJT05fUlVORVMuaW5jbHVkZXMoLyoqIEB0eXBlIHtTdGF0ZUNyZWF0aW9uUnVuZU5hbWV9ICovIChuYW1lKSk7XG59XG5cbi8qKiBMaXN0IG9mIGVsZW1lbnRzIHRoYXQgcmVxdWlyZSByYXcgY29udGVudHMgYW5kIHNob3VsZCBub3QgaGF2ZSBTU1IgY29tbWVudHMgcHV0IGluIHRoZW0gKi9cbmNvbnN0IFJBV19URVhUX0VMRU1FTlRTID0gLyoqIEB0eXBlIHtjb25zdH0gKi8gKFsndGV4dGFyZWEnLCAnc2NyaXB0JywgJ3N0eWxlJywgJ3RpdGxlJ10pO1xuXG4vKiogQHBhcmFtIHtzdHJpbmd9IG5hbWUgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc19yYXdfdGV4dF9lbGVtZW50KG5hbWUpIHtcblx0cmV0dXJuIFJBV19URVhUX0VMRU1FTlRTLmluY2x1ZGVzKC8qKiBAdHlwZSB7dHlwZW9mIFJBV19URVhUX0VMRU1FTlRTW251bWJlcl19ICovIChuYW1lKSk7XG59XG5cbi8vIE1hdGNoZXMgdmFsaWQgSFRNTC9TVkcvTWF0aE1MIGVsZW1lbnQgbmFtZXMgYW5kIGN1c3RvbSBlbGVtZW50IG5hbWVzLlxuLy8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvY3VzdG9tLWVsZW1lbnRzLmh0bWwjdmFsaWQtY3VzdG9tLWVsZW1lbnQtbmFtZVxuLy9cbi8vIFN0YW5kYXJkIGVsZW1lbnRzOiBBU0NJSSBhbHBoYSBzdGFydCwgZm9sbG93ZWQgYnkgQVNDSUkgYWxwaGFudW1lcmljcy5cbi8vIEN1c3RvbSBlbGVtZW50czogQVNDSUkgYWxwaGEgc3RhcnQsIGZvbGxvd2VkIGJ5IGFueSBtaXggb2YgUENFTkNoYXIgKHdoaWNoXG4vLyBpbmNsdWRlcyBBU0NJSSBhbHBoYW51bWVyaWNzLCBgLWAsIGAuYCwgYF9gLCBhbmQgc3BlY2lmaWVkIFVuaWNvZGUgcmFuZ2VzKSxcbi8vIHdpdGggYXQgbGVhc3Qgb25lIGh5cGhlbiByZXF1aXJlZCBzb21ld2hlcmUgYWZ0ZXIgdGhlIGZpcnN0IGNoYXJhY3Rlci5cbi8vXG4vLyBSZWplY3RzIHN0cmluZ3MgY29udGFpbmluZyB3aGl0ZXNwYWNlLCBxdW90ZXMsIGFuZ2xlIGJyYWNrZXRzLCBzbGFzaGVzLCBlcXVhbHMsXG4vLyBvciBvdGhlciBjaGFyYWN0ZXJzIHRoYXQgY291bGQgYnJlYWsgb3V0IG9mIGEgdGFnLW5hbWUgdG9rZW4gYW5kIGVuYWJsZSBtYXJrdXAgaW5qZWN0aW9uLlxuZXhwb3J0IGNvbnN0IFJFR0VYX1ZBTElEX1RBR19OQU1FID1cblx0L15bYS16QS1aXVthLXpBLVowLTldKigtW2EtekEtWjAtOS5cXC1fXFx1MDBCN1xcdTAwQzAtXFx1MDBENlxcdTAwRDgtXFx1MDBGNlxcdTAwRjgtXFx1MDM3RFxcdTAzN0YtXFx1MUZGRlxcdTIwMEMtXFx1MjAwRFxcdTIwM0YtXFx1MjA0MFxcdTIwNzAtXFx1MjE4RlxcdTJDMDAtXFx1MkZFRlxcdTMwMDEtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZGRFxcdXsxMDAwMH0tXFx1e0VGRkZGfV0qKT8kL3U7XG5cbi8qKlxuICogUHJldmVudCBkZXZ0b29scyB0cnlpbmcgdG8gbWFrZSBgbG9jYXRpb25gIGEgY2xpY2thYmxlIGxpbmsgYnkgaW5zZXJ0aW5nIGEgemVyby13aWR0aCBzcGFjZVxuICogQHRlbXBsYXRlIHtzdHJpbmcgfCB1bmRlZmluZWR9IFRcbiAqIEBwYXJhbSB7VH0gbG9jYXRpb25cbiAqIEByZXR1cm5zIHtUfTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplX2xvY2F0aW9uKGxvY2F0aW9uKSB7XG5cdHJldHVybiAvKiogQHR5cGUge1R9ICovIChsb2NhdGlvbj8ucmVwbGFjZSgvXFwvL2csICcvXFx1MjAwYicpKTtcbn1cbiIsImltcG9ydCB7IGNyZWF0ZV9lbGVtZW50IH0gZnJvbSAnLi9vcGVyYXRpb25zLmpzJztcblxuY29uc3QgcG9saWN5ID1cblx0Ly8gV2UgZ290dGEgd3JpdGUgaXQgbGlrZSB0aGlzIGJlY2F1c2UgYWZ0ZXIgZG93bmxldmVsaW5nIHRoZSBwdXJlIGNvbW1lbnQgbWF5IGVuZCB1cCBpbiB0aGUgd3JvbmcgbG9jYXRpb25cblx0Z2xvYmFsVGhpcz8ud2luZG93Py50cnVzdGVkVHlwZXMgJiZcblx0LyogQF9fUFVSRV9fICovIGdsb2JhbFRoaXMud2luZG93LnRydXN0ZWRUeXBlcy5jcmVhdGVQb2xpY3koJ3N2ZWx0ZS10cnVzdGVkLWh0bWwnLCB7XG5cdFx0LyoqIEBwYXJhbSB7c3RyaW5nfSBodG1sICovXG5cdFx0Y3JlYXRlSFRNTDogKGh0bWwpID0+IHtcblx0XHRcdHJldHVybiBodG1sO1xuXHRcdH1cblx0fSk7XG5cbi8qKiBAcGFyYW0ge3N0cmluZ30gaHRtbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZV90cnVzdGVkX2h0bWwoaHRtbCkge1xuXHRyZXR1cm4gLyoqIEB0eXBlIHtzdHJpbmd9ICovIChwb2xpY3k/LmNyZWF0ZUhUTUwoaHRtbCkgPz8gaHRtbCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZV9mcmFnbWVudF9mcm9tX2h0bWwoaHRtbCkge1xuXHR2YXIgZWxlbSA9IGNyZWF0ZV9lbGVtZW50KCd0ZW1wbGF0ZScpO1xuXHRlbGVtLmlubmVySFRNTCA9IGNyZWF0ZV90cnVzdGVkX2h0bWwoaHRtbC5yZXBsYWNlQWxsKCc8IT4nLCAnPCEtLS0tPicpKTsgLy8gWEhUTUwgY29tcGxpYW5jZVxuXHRyZXR1cm4gZWxlbS5jb250ZW50O1xufVxuIiwiLyoqIEBpbXBvcnQgeyBFZmZlY3QsIEVmZmVjdE5vZGVzLCBUZW1wbGF0ZU5vZGUgfSBmcm9tICcjY2xpZW50JyAqL1xuLyoqIEBpbXBvcnQgeyBUZW1wbGF0ZVN0cnVjdHVyZSB9IGZyb20gJy4vdHlwZXMnICovXG5pbXBvcnQgeyBoeWRyYXRlX25leHQsIGh5ZHJhdGVfbm9kZSwgaHlkcmF0aW5nLCBzZXRfaHlkcmF0ZV9ub2RlIH0gZnJvbSAnLi9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHtcblx0Y3JlYXRlX3RleHQsXG5cdGdldF9maXJzdF9jaGlsZCxcblx0Z2V0X25leHRfc2libGluZyxcblx0aXNfZmlyZWZveCxcblx0Y3JlYXRlX2VsZW1lbnQsXG5cdGNyZWF0ZV9mcmFnbWVudCxcblx0Y3JlYXRlX2NvbW1lbnQsXG5cdHNldF9hdHRyaWJ1dGUsXG5cdG1lcmdlX3RleHRfbm9kZXNcbn0gZnJvbSAnLi9vcGVyYXRpb25zLmpzJztcbmltcG9ydCB7IGNyZWF0ZV9mcmFnbWVudF9mcm9tX2h0bWwgfSBmcm9tICcuL3JlY29uY2lsZXIuanMnO1xuaW1wb3J0IHsgYWN0aXZlX2VmZmVjdCB9IGZyb20gJy4uL3J1bnRpbWUuanMnO1xuaW1wb3J0IHtcblx0TkFNRVNQQUNFX01BVEhNTCxcblx0TkFNRVNQQUNFX1NWRyxcblx0VEVNUExBVEVfRlJBR01FTlQsXG5cdFRFTVBMQVRFX1VTRV9JTVBPUlRfTk9ERSxcblx0VEVNUExBVEVfVVNFX01BVEhNTCxcblx0VEVNUExBVEVfVVNFX1NWR1xufSBmcm9tICcuLi8uLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHtcblx0Q09NTUVOVF9OT0RFLFxuXHRET0NVTUVOVF9GUkFHTUVOVF9OT0RFLFxuXHRJU19YSFRNTCxcblx0UkVBQ1RJT05fUkFOLFxuXHRURVhUX05PREVcbn0gZnJvbSAnI2NsaWVudC9jb25zdGFudHMnO1xuXG5jb25zdCBURU1QTEFURV9UQUcgPSBJU19YSFRNTCA/ICd0ZW1wbGF0ZScgOiAnVEVNUExBVEUnO1xuY29uc3QgU0NSSVBUX1RBRyA9IElTX1hIVE1MID8gJ3NjcmlwdCcgOiAnU0NSSVBUJztcblxuLyoqXG4gKiBAcGFyYW0ge1RlbXBsYXRlTm9kZX0gc3RhcnRcbiAqIEBwYXJhbSB7VGVtcGxhdGVOb2RlIHwgbnVsbH0gZW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ25fbm9kZXMoc3RhcnQsIGVuZCkge1xuXHR2YXIgZWZmZWN0ID0gLyoqIEB0eXBlIHtFZmZlY3R9ICovIChhY3RpdmVfZWZmZWN0KTtcblx0aWYgKGVmZmVjdC5ub2RlcyA9PT0gbnVsbCkge1xuXHRcdGVmZmVjdC5ub2RlcyA9IHsgc3RhcnQsIGVuZCwgYTogbnVsbCwgdDogbnVsbCB9O1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbnRlbnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBmbGFnc1xuICogQHJldHVybnMgeygpID0+IE5vZGUgfCBOb2RlW119XG4gKi9cbi8qI19fTk9fU0lERV9FRkZFQ1RTX18qL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21faHRtbChjb250ZW50LCBmbGFncykge1xuXHR2YXIgaXNfZnJhZ21lbnQgPSAoZmxhZ3MgJiBURU1QTEFURV9GUkFHTUVOVCkgIT09IDA7XG5cdHZhciB1c2VfaW1wb3J0X25vZGUgPSAoZmxhZ3MgJiBURU1QTEFURV9VU0VfSU1QT1JUX05PREUpICE9PSAwO1xuXG5cdC8qKiBAdHlwZSB7Tm9kZX0gKi9cblx0dmFyIG5vZGU7XG5cblx0LyoqXG5cdCAqIFdoZXRoZXIgb3Igbm90IHRoZSBmaXJzdCBpdGVtIGlzIGEgdGV4dC9lbGVtZW50IG5vZGUuIElmIG5vdCwgd2UgbmVlZCB0b1xuXHQgKiBjcmVhdGUgYW4gYWRkaXRpb25hbCBjb21tZW50IG5vZGUgdG8gYWN0IGFzIGBlZmZlY3Qubm9kZXMuc3RhcnRgXG5cdCAqL1xuXHR2YXIgaGFzX3N0YXJ0ID0gIWNvbnRlbnQuc3RhcnRzV2l0aCgnPCE+Jyk7XG5cblx0cmV0dXJuICgpID0+IHtcblx0XHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0XHRhc3NpZ25fbm9kZXMoaHlkcmF0ZV9ub2RlLCBudWxsKTtcblx0XHRcdHJldHVybiBoeWRyYXRlX25vZGU7XG5cdFx0fVxuXG5cdFx0aWYgKG5vZGUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0bm9kZSA9IGNyZWF0ZV9mcmFnbWVudF9mcm9tX2h0bWwoaGFzX3N0YXJ0ID8gY29udGVudCA6ICc8IT4nICsgY29udGVudCk7XG5cdFx0XHRpZiAoIWlzX2ZyYWdtZW50KSBub2RlID0gLyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGV9ICovIChnZXRfZmlyc3RfY2hpbGQobm9kZSkpO1xuXHRcdH1cblxuXHRcdHZhciBjbG9uZSA9IC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoXG5cdFx0XHR1c2VfaW1wb3J0X25vZGUgfHwgaXNfZmlyZWZveCA/IGRvY3VtZW50LmltcG9ydE5vZGUobm9kZSwgdHJ1ZSkgOiBub2RlLmNsb25lTm9kZSh0cnVlKVxuXHRcdCk7XG5cblx0XHRpZiAoaXNfZnJhZ21lbnQpIHtcblx0XHRcdHZhciBzdGFydCA9IC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoZ2V0X2ZpcnN0X2NoaWxkKGNsb25lKSk7XG5cdFx0XHR2YXIgZW5kID0gLyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGV9ICovIChjbG9uZS5sYXN0Q2hpbGQpO1xuXG5cdFx0XHRhc3NpZ25fbm9kZXMoc3RhcnQsIGVuZCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFzc2lnbl9ub2RlcyhjbG9uZSwgY2xvbmUpO1xuXHRcdH1cblxuXHRcdHJldHVybiBjbG9uZTtcblx0fTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29udGVudFxuICogQHBhcmFtIHtudW1iZXJ9IGZsYWdzXG4gKiBAcGFyYW0geydzdmcnIHwgJ21hdGgnfSBuc1xuICogQHJldHVybnMgeygpID0+IE5vZGUgfCBOb2RlW119XG4gKi9cbi8qI19fTk9fU0lERV9FRkZFQ1RTX18qL1xuZnVuY3Rpb24gZnJvbV9uYW1lc3BhY2UoY29udGVudCwgZmxhZ3MsIG5zID0gJ3N2ZycpIHtcblx0LyoqXG5cdCAqIFdoZXRoZXIgb3Igbm90IHRoZSBmaXJzdCBpdGVtIGlzIGEgdGV4dC9lbGVtZW50IG5vZGUuIElmIG5vdCwgd2UgbmVlZCB0b1xuXHQgKiBjcmVhdGUgYW4gYWRkaXRpb25hbCBjb21tZW50IG5vZGUgdG8gYWN0IGFzIGBlZmZlY3Qubm9kZXMuc3RhcnRgXG5cdCAqL1xuXHR2YXIgaGFzX3N0YXJ0ID0gIWNvbnRlbnQuc3RhcnRzV2l0aCgnPCE+Jyk7XG5cblx0dmFyIGlzX2ZyYWdtZW50ID0gKGZsYWdzICYgVEVNUExBVEVfRlJBR01FTlQpICE9PSAwO1xuXHR2YXIgd3JhcHBlZCA9IGA8JHtuc30+JHtoYXNfc3RhcnQgPyBjb250ZW50IDogJzwhPicgKyBjb250ZW50fTwvJHtuc30+YDtcblxuXHQvKiogQHR5cGUge0VsZW1lbnQgfCBEb2N1bWVudEZyYWdtZW50fSAqL1xuXHR2YXIgbm9kZTtcblxuXHRyZXR1cm4gKCkgPT4ge1xuXHRcdGlmIChoeWRyYXRpbmcpIHtcblx0XHRcdGFzc2lnbl9ub2RlcyhoeWRyYXRlX25vZGUsIG51bGwpO1xuXHRcdFx0cmV0dXJuIGh5ZHJhdGVfbm9kZTtcblx0XHR9XG5cblx0XHRpZiAoIW5vZGUpIHtcblx0XHRcdHZhciBmcmFnbWVudCA9IC8qKiBAdHlwZSB7RG9jdW1lbnRGcmFnbWVudH0gKi8gKGNyZWF0ZV9mcmFnbWVudF9mcm9tX2h0bWwod3JhcHBlZCkpO1xuXHRcdFx0dmFyIHJvb3QgPSAvKiogQHR5cGUge0VsZW1lbnR9ICovIChnZXRfZmlyc3RfY2hpbGQoZnJhZ21lbnQpKTtcblxuXHRcdFx0aWYgKGlzX2ZyYWdtZW50KSB7XG5cdFx0XHRcdG5vZGUgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cdFx0XHRcdHdoaWxlIChnZXRfZmlyc3RfY2hpbGQocm9vdCkpIHtcblx0XHRcdFx0XHRub2RlLmFwcGVuZENoaWxkKC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoZ2V0X2ZpcnN0X2NoaWxkKHJvb3QpKSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5vZGUgPSAvKiogQHR5cGUge0VsZW1lbnR9ICovIChnZXRfZmlyc3RfY2hpbGQocm9vdCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHZhciBjbG9uZSA9IC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAobm9kZS5jbG9uZU5vZGUodHJ1ZSkpO1xuXG5cdFx0aWYgKGlzX2ZyYWdtZW50KSB7XG5cdFx0XHR2YXIgc3RhcnQgPSAvKiogQHR5cGUge1RlbXBsYXRlTm9kZX0gKi8gKGdldF9maXJzdF9jaGlsZChjbG9uZSkpO1xuXHRcdFx0dmFyIGVuZCA9IC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoY2xvbmUubGFzdENoaWxkKTtcblxuXHRcdFx0YXNzaWduX25vZGVzKHN0YXJ0LCBlbmQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhc3NpZ25fbm9kZXMoY2xvbmUsIGNsb25lKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gY2xvbmU7XG5cdH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbnRlbnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBmbGFnc1xuICovXG4vKiNfX05PX1NJREVfRUZGRUNUU19fKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tX3N2Zyhjb250ZW50LCBmbGFncykge1xuXHRyZXR1cm4gZnJvbV9uYW1lc3BhY2UoY29udGVudCwgZmxhZ3MsICdzdmcnKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29udGVudFxuICogQHBhcmFtIHtudW1iZXJ9IGZsYWdzXG4gKi9cbi8qI19fTk9fU0lERV9FRkZFQ1RTX18qL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21fbWF0aG1sKGNvbnRlbnQsIGZsYWdzKSB7XG5cdHJldHVybiBmcm9tX25hbWVzcGFjZShjb250ZW50LCBmbGFncywgJ21hdGgnKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1RlbXBsYXRlU3RydWN0dXJlW119IHN0cnVjdHVyZVxuICogQHBhcmFtIHt0eXBlb2YgTkFNRVNQQUNFX1NWRyB8IHR5cGVvZiBOQU1FU1BBQ0VfTUFUSE1MIHwgdW5kZWZpbmVkfSBbbnNdXG4gKi9cbmZ1bmN0aW9uIGZyYWdtZW50X2Zyb21fdHJlZShzdHJ1Y3R1cmUsIG5zKSB7XG5cdHZhciBmcmFnbWVudCA9IGNyZWF0ZV9mcmFnbWVudCgpO1xuXG5cdGZvciAodmFyIGl0ZW0gb2Ygc3RydWN0dXJlKSB7XG5cdFx0aWYgKHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJykge1xuXHRcdFx0ZnJhZ21lbnQuYXBwZW5kKGNyZWF0ZV90ZXh0KGl0ZW0pKTtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdC8vIGlmIGBwcmVzZXJ2ZUNvbW1lbnRzID09PSB0cnVlYCwgY29tbWVudHMgYXJlIHJlcHJlc2VudGVkIGFzIGBbJy8vIDxkYXRhPiddYFxuXHRcdGlmIChpdGVtID09PSB1bmRlZmluZWQgfHwgaXRlbVswXVswXSA9PT0gJy8nKSB7XG5cdFx0XHRmcmFnbWVudC5hcHBlbmQoY3JlYXRlX2NvbW1lbnQoaXRlbSA/IGl0ZW1bMF0uc2xpY2UoMykgOiAnJykpO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0Y29uc3QgW25hbWUsIGF0dHJpYnV0ZXMsIC4uLmNoaWxkcmVuXSA9IGl0ZW07XG5cblx0XHRjb25zdCBuYW1lc3BhY2UgPSBuYW1lID09PSAnc3ZnJyA/IE5BTUVTUEFDRV9TVkcgOiBuYW1lID09PSAnbWF0aCcgPyBOQU1FU1BBQ0VfTUFUSE1MIDogbnM7XG5cblx0XHR2YXIgZWxlbWVudCA9IGNyZWF0ZV9lbGVtZW50KG5hbWUsIG5hbWVzcGFjZSwgYXR0cmlidXRlcz8uaXMpO1xuXG5cdFx0Zm9yICh2YXIga2V5IGluIGF0dHJpYnV0ZXMpIHtcblx0XHRcdHNldF9hdHRyaWJ1dGUoZWxlbWVudCwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuXHRcdH1cblxuXHRcdGlmIChjaGlsZHJlbi5sZW5ndGggPiAwKSB7XG5cdFx0XHR2YXIgdGFyZ2V0ID1cblx0XHRcdFx0ZWxlbWVudC5ub2RlTmFtZSA9PT0gVEVNUExBVEVfVEFHXG5cdFx0XHRcdFx0PyAvKiogQHR5cGUge0hUTUxUZW1wbGF0ZUVsZW1lbnR9ICovIChlbGVtZW50KS5jb250ZW50XG5cdFx0XHRcdFx0OiBlbGVtZW50O1xuXG5cdFx0XHR0YXJnZXQuYXBwZW5kKFxuXHRcdFx0XHRmcmFnbWVudF9mcm9tX3RyZWUoY2hpbGRyZW4sIGVsZW1lbnQubm9kZU5hbWUgPT09ICdmb3JlaWduT2JqZWN0JyA/IHVuZGVmaW5lZCA6IG5hbWVzcGFjZSlcblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0ZnJhZ21lbnQuYXBwZW5kKGVsZW1lbnQpO1xuXHR9XG5cblx0cmV0dXJuIGZyYWdtZW50O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7VGVtcGxhdGVTdHJ1Y3R1cmVbXX0gc3RydWN0dXJlXG4gKiBAcGFyYW0ge251bWJlcn0gZmxhZ3NcbiAqIEByZXR1cm5zIHsoKSA9PiBOb2RlIHwgTm9kZVtdfVxuICovXG4vKiNfX05PX1NJREVfRUZGRUNUU19fKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tX3RyZWUoc3RydWN0dXJlLCBmbGFncykge1xuXHR2YXIgaXNfZnJhZ21lbnQgPSAoZmxhZ3MgJiBURU1QTEFURV9GUkFHTUVOVCkgIT09IDA7XG5cdHZhciB1c2VfaW1wb3J0X25vZGUgPSAoZmxhZ3MgJiBURU1QTEFURV9VU0VfSU1QT1JUX05PREUpICE9PSAwO1xuXG5cdC8qKiBAdHlwZSB7Tm9kZX0gKi9cblx0dmFyIG5vZGU7XG5cblx0cmV0dXJuICgpID0+IHtcblx0XHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0XHRhc3NpZ25fbm9kZXMoaHlkcmF0ZV9ub2RlLCBudWxsKTtcblx0XHRcdHJldHVybiBoeWRyYXRlX25vZGU7XG5cdFx0fVxuXG5cdFx0aWYgKG5vZGUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc3QgbnMgPVxuXHRcdFx0XHQoZmxhZ3MgJiBURU1QTEFURV9VU0VfU1ZHKSAhPT0gMFxuXHRcdFx0XHRcdD8gTkFNRVNQQUNFX1NWR1xuXHRcdFx0XHRcdDogKGZsYWdzICYgVEVNUExBVEVfVVNFX01BVEhNTCkgIT09IDBcblx0XHRcdFx0XHRcdD8gTkFNRVNQQUNFX01BVEhNTFxuXHRcdFx0XHRcdFx0OiB1bmRlZmluZWQ7XG5cblx0XHRcdG5vZGUgPSBmcmFnbWVudF9mcm9tX3RyZWUoc3RydWN0dXJlLCBucyk7XG5cdFx0XHRpZiAoIWlzX2ZyYWdtZW50KSBub2RlID0gLyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGV9ICovIChnZXRfZmlyc3RfY2hpbGQobm9kZSkpO1xuXHRcdH1cblxuXHRcdHZhciBjbG9uZSA9IC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoXG5cdFx0XHR1c2VfaW1wb3J0X25vZGUgfHwgaXNfZmlyZWZveCA/IGRvY3VtZW50LmltcG9ydE5vZGUobm9kZSwgdHJ1ZSkgOiBub2RlLmNsb25lTm9kZSh0cnVlKVxuXHRcdCk7XG5cblx0XHRpZiAoaXNfZnJhZ21lbnQpIHtcblx0XHRcdHZhciBzdGFydCA9IC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoZ2V0X2ZpcnN0X2NoaWxkKGNsb25lKSk7XG5cdFx0XHR2YXIgZW5kID0gLyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGV9ICovIChjbG9uZS5sYXN0Q2hpbGQpO1xuXG5cdFx0XHRhc3NpZ25fbm9kZXMoc3RhcnQsIGVuZCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFzc2lnbl9ub2RlcyhjbG9uZSwgY2xvbmUpO1xuXHRcdH1cblxuXHRcdHJldHVybiBjbG9uZTtcblx0fTtcbn1cblxuLyoqXG4gKiBAcGFyYW0geygpID0+IEVsZW1lbnQgfCBEb2N1bWVudEZyYWdtZW50fSBmblxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aF9zY3JpcHQoZm4pIHtcblx0cmV0dXJuICgpID0+IHJ1bl9zY3JpcHRzKGZuKCkpO1xufVxuXG4vKipcbiAqIENyZWF0aW5nIGEgZG9jdW1lbnQgZnJhZ21lbnQgZnJvbSBIVE1MIHRoYXQgY29udGFpbnMgc2NyaXB0IHRhZ3Mgd2lsbCBub3QgZXhlY3V0ZVxuICogdGhlIHNjcmlwdHMuIFdlIG5lZWQgdG8gcmVwbGFjZSB0aGUgc2NyaXB0IHRhZ3Mgd2l0aCBuZXcgb25lcyBzbyB0aGF0IHRoZXkgYXJlIGV4ZWN1dGVkLlxuICogQHBhcmFtIHtFbGVtZW50IHwgRG9jdW1lbnRGcmFnbWVudH0gbm9kZVxuICogQHJldHVybnMge05vZGUgfCBOb2RlW119XG4gKi9cbmZ1bmN0aW9uIHJ1bl9zY3JpcHRzKG5vZGUpIHtcblx0Ly8gc2NyaXB0cyB3ZXJlIFNTUidkLCBpbiB3aGljaCBjYXNlIHRoZXkgd2lsbCBydW5cblx0aWYgKGh5ZHJhdGluZykgcmV0dXJuIG5vZGU7XG5cblx0Y29uc3QgaXNfZnJhZ21lbnQgPSBub2RlLm5vZGVUeXBlID09PSBET0NVTUVOVF9GUkFHTUVOVF9OT0RFO1xuXHRjb25zdCBzY3JpcHRzID1cblx0XHQvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAobm9kZSkubm9kZU5hbWUgPT09IFNDUklQVF9UQUdcblx0XHRcdD8gWy8qKiBAdHlwZSB7SFRNTFNjcmlwdEVsZW1lbnR9ICovIChub2RlKV1cblx0XHRcdDogbm9kZS5xdWVyeVNlbGVjdG9yQWxsKCdzY3JpcHQnKTtcblxuXHRjb25zdCBlZmZlY3QgPSAvKiogQHR5cGUge0VmZmVjdCAmIHsgbm9kZXM6IEVmZmVjdE5vZGVzIH19ICovIChhY3RpdmVfZWZmZWN0KTtcblxuXHRmb3IgKGNvbnN0IHNjcmlwdCBvZiBzY3JpcHRzKSB7XG5cdFx0Y29uc3QgY2xvbmUgPSBjcmVhdGVfZWxlbWVudCgnc2NyaXB0Jyk7XG5cdFx0Zm9yICh2YXIgYXR0cmlidXRlIG9mIHNjcmlwdC5hdHRyaWJ1dGVzKSB7XG5cdFx0XHRjbG9uZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLm5hbWUsIGF0dHJpYnV0ZS52YWx1ZSk7XG5cdFx0fVxuXG5cdFx0Y2xvbmUudGV4dENvbnRlbnQgPSBzY3JpcHQudGV4dENvbnRlbnQ7XG5cblx0XHQvLyBUaGUgc2NyaXB0IGhhcyBjaGFuZ2VkIC0gaWYgaXQncyBhdCB0aGUgZWRnZXMsIHRoZSBlZmZlY3Qgbm93IHBvaW50cyBhdCBkZWFkIG5vZGVzXG5cdFx0aWYgKGlzX2ZyYWdtZW50ID8gbm9kZS5maXJzdENoaWxkID09PSBzY3JpcHQgOiBub2RlID09PSBzY3JpcHQpIHtcblx0XHRcdGVmZmVjdC5ub2Rlcy5zdGFydCA9IGNsb25lO1xuXHRcdH1cblx0XHRpZiAoaXNfZnJhZ21lbnQgPyBub2RlLmxhc3RDaGlsZCA9PT0gc2NyaXB0IDogbm9kZSA9PT0gc2NyaXB0KSB7XG5cdFx0XHRlZmZlY3Qubm9kZXMuZW5kID0gY2xvbmU7XG5cdFx0fVxuXG5cdFx0c2NyaXB0LnJlcGxhY2VXaXRoKGNsb25lKTtcblx0fVxuXHRyZXR1cm4gbm9kZTtcbn1cblxuLyoqXG4gKiBEb24ndCBtYXJrIHRoaXMgYXMgc2lkZS1lZmZlY3QtZnJlZSwgaHlkcmF0aW9uIG5lZWRzIHRvIHdhbGsgYWxsIG5vZGVzXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHQodmFsdWUgPSAnJykge1xuXHRpZiAoIWh5ZHJhdGluZykge1xuXHRcdHZhciB0ID0gY3JlYXRlX3RleHQodmFsdWUgKyAnJyk7XG5cdFx0YXNzaWduX25vZGVzKHQsIHQpO1xuXHRcdHJldHVybiB0O1xuXHR9XG5cblx0dmFyIG5vZGUgPSBoeWRyYXRlX25vZGU7XG5cblx0aWYgKG5vZGUubm9kZVR5cGUgIT09IFRFWFRfTk9ERSkge1xuXHRcdC8vIGlmIGFuIHtleHByZXNzaW9ufSBpcyBlbXB0eSBkdXJpbmcgU1NSLCB3ZSBuZWVkIHRvIGluc2VydCBhbiBlbXB0eSB0ZXh0IG5vZGVcblx0XHRub2RlLmJlZm9yZSgobm9kZSA9IGNyZWF0ZV90ZXh0KCkpKTtcblx0XHRzZXRfaHlkcmF0ZV9ub2RlKG5vZGUpO1xuXHR9IGVsc2Uge1xuXHRcdG1lcmdlX3RleHRfbm9kZXMoLyoqIEB0eXBlIHtUZXh0fSAqLyAobm9kZSkpO1xuXHR9XG5cblx0YXNzaWduX25vZGVzKG5vZGUsIG5vZGUpO1xuXHRyZXR1cm4gbm9kZTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7VGVtcGxhdGVOb2RlIHwgRG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbW1lbnQoKSB7XG5cdC8vIHdlJ3JlIG5vdCBkZWxlZ2F0aW5nIHRvIGB0ZW1wbGF0ZWAgaGVyZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29uc1xuXHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0YXNzaWduX25vZGVzKGh5ZHJhdGVfbm9kZSwgbnVsbCk7XG5cdFx0cmV0dXJuIGh5ZHJhdGVfbm9kZTtcblx0fVxuXG5cdHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHR2YXIgc3RhcnQgPSBkb2N1bWVudC5jcmVhdGVDb21tZW50KCcnKTtcblx0dmFyIGFuY2hvciA9IGNyZWF0ZV90ZXh0KCk7XG5cdGZyYWcuYXBwZW5kKHN0YXJ0LCBhbmNob3IpO1xuXG5cdGFzc2lnbl9ub2RlcyhzdGFydCwgYW5jaG9yKTtcblxuXHRyZXR1cm4gZnJhZztcbn1cblxuLyoqXG4gKiBBc3NpZ24gdGhlIGNyZWF0ZWQgKG9yIGluIGh5ZHJhdGlvbiBtb2RlLCB0cmF2ZXJzZWQpIGRvbSBlbGVtZW50cyB0byB0aGUgY3VycmVudCBibG9ja1xuICogYW5kIGluc2VydCB0aGUgZWxlbWVudHMgaW50byB0aGUgZG9tIChpbiBjbGllbnQgbW9kZSkuXG4gKiBAcGFyYW0ge1RleHQgfCBDb21tZW50IHwgRWxlbWVudH0gYW5jaG9yXG4gKiBAcGFyYW0ge0RvY3VtZW50RnJhZ21lbnQgfCBFbGVtZW50fSBkb21cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZChhbmNob3IsIGRvbSkge1xuXHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0dmFyIGVmZmVjdCA9IC8qKiBAdHlwZSB7RWZmZWN0ICYgeyBub2RlczogRWZmZWN0Tm9kZXMgfX0gKi8gKGFjdGl2ZV9lZmZlY3QpO1xuXG5cdFx0Ly8gV2hlbiBoeWRyYXRpbmcgYW5kIG91dGVyIGNvbXBvbmVudCBhbmQgYW4gaW5uZXIgY29tcG9uZW50IGlzIGFzeW5jLCBpLmUuIGJsb2NrZWQgb24gYSBwcm9taXNlLFxuXHRcdC8vIHRoZW4gYnkgdGhlIHRpbWUgdGhlIGlubmVyIHJlc29sdmVzIHdlIGhhdmUgYWxyZWFkeSBhZHZhbmNlZCB0byB0aGUgZW5kIG9mIHRoZSBoeWRyYXRlZCBub2Rlc1xuXHRcdC8vIG9mIHRoZSBwYXJlbnQgY29tcG9uZW50LiBDaGVjayBmb3IgZGVmaW5lZCBmb3IgdGhhdCByZWFzb24gdG8gYXZvaWQgcmV3aW5kaW5nIHRoZSBwYXJlbnQncyBlbmQgbWFya2VyLlxuXHRcdGlmICgoZWZmZWN0LmYgJiBSRUFDVElPTl9SQU4pID09PSAwIHx8IGVmZmVjdC5ub2Rlcy5lbmQgPT09IG51bGwpIHtcblx0XHRcdGVmZmVjdC5ub2Rlcy5lbmQgPSBoeWRyYXRlX25vZGU7XG5cdFx0fVxuXG5cdFx0aHlkcmF0ZV9uZXh0KCk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aWYgKGFuY2hvciA9PT0gbnVsbCkge1xuXHRcdC8vIGVkZ2UgY2FzZSDigJQgdm9pZCBgPHN2ZWx0ZTplbGVtZW50PmAgd2l0aCBjb250ZW50XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0YW5jaG9yLmJlZm9yZSgvKiogQHR5cGUge05vZGV9ICovIChkb20pKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgKG9yIGh5ZHJhdGUpIGFuIHVuaXF1ZSBVSUQgZm9yIHRoZSBjb21wb25lbnQgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9wc19pZCgpIHtcblx0aWYgKFxuXHRcdGh5ZHJhdGluZyAmJlxuXHRcdGh5ZHJhdGVfbm9kZSAmJlxuXHRcdGh5ZHJhdGVfbm9kZS5ub2RlVHlwZSA9PT0gQ09NTUVOVF9OT0RFICYmXG5cdFx0aHlkcmF0ZV9ub2RlLnRleHRDb250ZW50Py5zdGFydHNXaXRoKGAkYClcblx0KSB7XG5cdFx0Y29uc3QgaWQgPSBoeWRyYXRlX25vZGUudGV4dENvbnRlbnQuc3Vic3RyaW5nKDEpO1xuXHRcdGh5ZHJhdGVfbmV4dCgpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXG5cdC8vIEB0cy1leHBlY3QtZXJyb3IgVGhpcyB3YXkgd2UgZW5zdXJlIHRoZSBpZCBpcyB1bmlxdWUgZXZlbiBhY3Jvc3MgU3ZlbHRlIHJ1bnRpbWVzXG5cdCh3aW5kb3cuX19zdmVsdGUgPz89IHt9KS51aWQgPz89IDE7XG5cblx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRyZXR1cm4gYGMke3dpbmRvdy5fX3N2ZWx0ZS51aWQrK31gO1xufVxuIiwiLyoqIEBpbXBvcnQgeyBFZmZlY3QsIFNvdXJjZSwgVGVtcGxhdGVOb2RlLCB9IGZyb20gJyNjbGllbnQnICovXG5pbXBvcnQge1xuXHRCT1VOREFSWV9FRkZFQ1QsXG5cdERFU1RST1lFRCxcblx0REVTVFJPWUlORyxcblx0RUZGRUNUX1BSRVNFUlZFRCxcblx0RUZGRUNUX1RSQU5TUEFSRU5UXG59IGZyb20gJyNjbGllbnQvY29uc3RhbnRzJztcbmltcG9ydCB7XG5cdEhZRFJBVElPTl9FUlJPUixcblx0SFlEUkFUSU9OX1NUQVJUX0VMU0UsXG5cdEhZRFJBVElPTl9TVEFSVF9GQUlMRURcbn0gZnJvbSAnLi4vLi4vLi4vLi4vY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IGNvbXBvbmVudF9jb250ZXh0LCBzZXRfY29tcG9uZW50X2NvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0LmpzJztcbmltcG9ydCB7IGludm9rZV9lcnJvcl9ib3VuZGFyeSB9IGZyb20gJy4uLy4uL2Vycm9yLWhhbmRsaW5nLmpzJztcbmltcG9ydCB7XG5cdGJsb2NrLFxuXHRicmFuY2gsXG5cdGRlc3Ryb3lfZWZmZWN0LFxuXHRtb3ZlX2VmZmVjdCxcblx0cGF1c2VfZWZmZWN0XG59IGZyb20gJy4uLy4uL3JlYWN0aXZpdHkvZWZmZWN0cy5qcyc7XG5pbXBvcnQge1xuXHRhY3RpdmVfZWZmZWN0LFxuXHRhY3RpdmVfcmVhY3Rpb24sXG5cdGdldCxcblx0c2V0X2FjdGl2ZV9lZmZlY3QsXG5cdHNldF9hY3RpdmVfcmVhY3Rpb25cbn0gZnJvbSAnLi4vLi4vcnVudGltZS5qcyc7XG5pbXBvcnQge1xuXHRoeWRyYXRlX25leHQsXG5cdGh5ZHJhdGVfbm9kZSxcblx0aHlkcmF0aW5nLFxuXHRuZXh0LFxuXHRyZWFkX2h5ZHJhdGlvbl9pbnN0cnVjdGlvbixcblx0c2tpcF9ub2Rlcyxcblx0c2V0X2h5ZHJhdGVfbm9kZVxufSBmcm9tICcuLi9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgcXVldWVfbWljcm9fdGFzayB9IGZyb20gJy4uL3Rhc2suanMnO1xuaW1wb3J0ICogYXMgZSBmcm9tICcuLi8uLi9lcnJvcnMuanMnO1xuaW1wb3J0ICogYXMgdyBmcm9tICcuLi8uLi93YXJuaW5ncy5qcyc7XG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7IEJhdGNoLCBjdXJyZW50X2JhdGNoIH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS9iYXRjaC5qcyc7XG5pbXBvcnQgeyBpbnRlcm5hbF9zZXQsIHNvdXJjZSB9IGZyb20gJy4uLy4uL3JlYWN0aXZpdHkvc291cmNlcy5qcyc7XG5pbXBvcnQgeyB0YWcgfSBmcm9tICcuLi8uLi9kZXYvdHJhY2luZy5qcyc7XG5pbXBvcnQgeyBjcmVhdGVTdWJzY3JpYmVyIH0gZnJvbSAnLi4vLi4vLi4vLi4vcmVhY3Rpdml0eS9jcmVhdGUtc3Vic2NyaWJlci5qcyc7XG5pbXBvcnQgeyBjcmVhdGVfdGV4dCB9IGZyb20gJy4uL29wZXJhdGlvbnMuanMnO1xuaW1wb3J0IHsgZGVmZXJfZWZmZWN0IH0gZnJvbSAnLi4vLi4vcmVhY3Rpdml0eS91dGlscy5qcyc7XG5cbi8qKlxuICogQHR5cGVkZWYge3tcbiAqIFx0IG9uZXJyb3I/OiAoKGVycm9yOiB1bmtub3duLCByZXNldDogKCkgPT4gdm9pZCkgPT4gdm9pZCkgfCBudWxsO1xuICogICBmYWlsZWQ/OiAoKGFuY2hvcjogTm9kZSwgZXJyb3I6ICgpID0+IHVua25vd24sIHJlc2V0OiAoKSA9PiAoKSA9PiB2b2lkKSA9PiB2b2lkKSB8IG51bGw7XG4gKiAgIHBlbmRpbmc/OiAoKGFuY2hvcjogTm9kZSkgPT4gdm9pZCkgfCBudWxsO1xuICogfX0gQm91bmRhcnlQcm9wc1xuICovXG5cbnZhciBmbGFncyA9IEVGRkVDVF9UUkFOU1BBUkVOVCB8IEVGRkVDVF9QUkVTRVJWRUQ7XG5cbi8qKlxuICogQHBhcmFtIHtUZW1wbGF0ZU5vZGV9IG5vZGVcbiAqIEBwYXJhbSB7Qm91bmRhcnlQcm9wc30gcHJvcHNcbiAqIEBwYXJhbSB7KChhbmNob3I6IE5vZGUpID0+IHZvaWQpfSBjaGlsZHJlblxuICogQHBhcmFtIHsoKGVycm9yOiB1bmtub3duKSA9PiB1bmtub3duKSB8IHVuZGVmaW5lZH0gW3RyYW5zZm9ybV9lcnJvcl1cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gYm91bmRhcnkobm9kZSwgcHJvcHMsIGNoaWxkcmVuLCB0cmFuc2Zvcm1fZXJyb3IpIHtcblx0bmV3IEJvdW5kYXJ5KG5vZGUsIHByb3BzLCBjaGlsZHJlbiwgdHJhbnNmb3JtX2Vycm9yKTtcbn1cblxuZXhwb3J0IGNsYXNzIEJvdW5kYXJ5IHtcblx0LyoqIEB0eXBlIHtCb3VuZGFyeSB8IG51bGx9ICovXG5cdHBhcmVudDtcblxuXHRpc19wZW5kaW5nID0gZmFsc2U7XG5cblx0LyoqXG5cdCAqIEFQSS1sZXZlbCB0cmFuc2Zvcm1FcnJvciB0cmFuc2Zvcm0gZnVuY3Rpb24uIFRyYW5zZm9ybXMgZXJyb3JzIGJlZm9yZSB0aGV5IHJlYWNoIHRoZSBgZmFpbGVkYCBzbmlwcGV0LlxuXHQgKiBJbmhlcml0ZWQgZnJvbSBwYXJlbnQgYm91bmRhcnksIG9yIGRlZmF1bHRzIHRvIGlkZW50aXR5LlxuXHQgKiBAdHlwZSB7KGVycm9yOiB1bmtub3duKSA9PiB1bmtub3dufVxuXHQgKi9cblx0dHJhbnNmb3JtX2Vycm9yO1xuXG5cdC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqL1xuXHQjYW5jaG9yO1xuXG5cdC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlIHwgbnVsbH0gKi9cblx0I2h5ZHJhdGVfb3BlbiA9IGh5ZHJhdGluZyA/IGh5ZHJhdGVfbm9kZSA6IG51bGw7XG5cblx0LyoqIEB0eXBlIHtCb3VuZGFyeVByb3BzfSAqL1xuXHQjcHJvcHM7XG5cblx0LyoqIEB0eXBlIHsoKGFuY2hvcjogTm9kZSkgPT4gdm9pZCl9ICovXG5cdCNjaGlsZHJlbjtcblxuXHQvKiogQHR5cGUge0VmZmVjdH0gKi9cblx0I2VmZmVjdDtcblxuXHQvKiogQHR5cGUge0VmZmVjdCB8IG51bGx9ICovXG5cdCNtYWluX2VmZmVjdCA9IG51bGw7XG5cblx0LyoqIEB0eXBlIHtFZmZlY3QgfCBudWxsfSAqL1xuXHQjcGVuZGluZ19lZmZlY3QgPSBudWxsO1xuXG5cdC8qKiBAdHlwZSB7RWZmZWN0IHwgbnVsbH0gKi9cblx0I2ZhaWxlZF9lZmZlY3QgPSBudWxsO1xuXG5cdC8qKiBAdHlwZSB7RG9jdW1lbnRGcmFnbWVudCB8IG51bGx9ICovXG5cdCNvZmZzY3JlZW5fZnJhZ21lbnQgPSBudWxsO1xuXG5cdCNsb2NhbF9wZW5kaW5nX2NvdW50ID0gMDtcblx0I3BlbmRpbmdfY291bnQgPSAwO1xuXHQjcGVuZGluZ19jb3VudF91cGRhdGVfcXVldWVkID0gZmFsc2U7XG5cblx0LyoqIEB0eXBlIHtNYXA8RWZmZWN0LCBudW1iZXI+fSAqL1xuXHQjZGlydHlfcmVhY3Rpb25zID0gbmV3IE1hcCgpO1xuXG5cdC8qKlxuXHQgKiBBIHNvdXJjZSBjb250YWluaW5nIHRoZSBudW1iZXIgb2YgcGVuZGluZyBhc3luYyBkZXJpdmVkcy9leHByZXNzaW9ucy5cblx0ICogT25seSBjcmVhdGVkIGlmIGAkZWZmZWN0LnBlbmRpbmcoKWAgaXMgdXNlZCBpbnNpZGUgdGhlIGJvdW5kYXJ5LFxuXHQgKiBvdGhlcndpc2UgdXBkYXRpbmcgdGhlIHNvdXJjZSByZXN1bHRzIGluIG5lZWRsZXNzIGBCYXRjaC5lbnN1cmUoKWBcblx0ICogY2FsbHMgZm9sbG93ZWQgYnkgbm8tb3AgZmx1c2hlc1xuXHQgKiBAdHlwZSB7U291cmNlPG51bWJlcj4gfCBudWxsfVxuXHQgKi9cblx0I2VmZmVjdF9wZW5kaW5nID0gbnVsbDtcblxuXHQjZWZmZWN0X3BlbmRpbmdfc3Vic2NyaWJlciA9IGNyZWF0ZVN1YnNjcmliZXIoKCkgPT4ge1xuXHRcdHRoaXMuI2VmZmVjdF9wZW5kaW5nID0gc291cmNlKHRoaXMuI2xvY2FsX3BlbmRpbmdfY291bnQpO1xuXG5cdFx0aWYgKERFVikge1xuXHRcdFx0dGFnKHRoaXMuI2VmZmVjdF9wZW5kaW5nLCAnJGVmZmVjdC5wZW5kaW5nKCknKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKCkgPT4ge1xuXHRcdFx0dGhpcy4jZWZmZWN0X3BlbmRpbmcgPSBudWxsO1xuXHRcdH07XG5cdH0pO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge1RlbXBsYXRlTm9kZX0gbm9kZVxuXHQgKiBAcGFyYW0ge0JvdW5kYXJ5UHJvcHN9IHByb3BzXG5cdCAqIEBwYXJhbSB7KChhbmNob3I6IE5vZGUpID0+IHZvaWQpfSBjaGlsZHJlblxuXHQgKiBAcGFyYW0geygoZXJyb3I6IHVua25vd24pID0+IHVua25vd24pIHwgdW5kZWZpbmVkfSBbdHJhbnNmb3JtX2Vycm9yXVxuXHQgKi9cblx0Y29uc3RydWN0b3Iobm9kZSwgcHJvcHMsIGNoaWxkcmVuLCB0cmFuc2Zvcm1fZXJyb3IpIHtcblx0XHR0aGlzLiNhbmNob3IgPSBub2RlO1xuXHRcdHRoaXMuI3Byb3BzID0gcHJvcHM7XG5cblx0XHR0aGlzLiNjaGlsZHJlbiA9IChhbmNob3IpID0+IHtcblx0XHRcdHZhciBlZmZlY3QgPSAvKiogQHR5cGUge0VmZmVjdH0gKi8gKGFjdGl2ZV9lZmZlY3QpO1xuXG5cdFx0XHRlZmZlY3QuYiA9IHRoaXM7XG5cdFx0XHRlZmZlY3QuZiB8PSBCT1VOREFSWV9FRkZFQ1Q7XG5cblx0XHRcdGNoaWxkcmVuKGFuY2hvcik7XG5cdFx0fTtcblxuXHRcdHRoaXMucGFyZW50ID0gLyoqIEB0eXBlIHtFZmZlY3R9ICovIChhY3RpdmVfZWZmZWN0KS5iO1xuXG5cdFx0Ly8gSW5oZXJpdCB0cmFuc2Zvcm1fZXJyb3IgZnJvbSBwYXJlbnQgYm91bmRhcnksIG9yIHVzZSB0aGUgcHJvdmlkZWQgb25lLCBvciBkZWZhdWx0IHRvIGlkZW50aXR5XG5cdFx0dGhpcy50cmFuc2Zvcm1fZXJyb3IgPSB0cmFuc2Zvcm1fZXJyb3IgPz8gdGhpcy5wYXJlbnQ/LnRyYW5zZm9ybV9lcnJvciA/PyAoKGUpID0+IGUpO1xuXG5cdFx0dGhpcy4jZWZmZWN0ID0gYmxvY2soKCkgPT4ge1xuXHRcdFx0aWYgKGh5ZHJhdGluZykge1xuXHRcdFx0XHRjb25zdCBjb21tZW50X2RhdGEgPSByZWFkX2h5ZHJhdGlvbl9pbnN0cnVjdGlvbihcblx0XHRcdFx0XHQvKiogQHR5cGUge1RlbXBsYXRlTm9kZX0gKi8gKHRoaXMuI2h5ZHJhdGVfb3Blbilcblx0XHRcdFx0KTtcblx0XHRcdFx0aHlkcmF0ZV9uZXh0KCk7XG5cblx0XHRcdFx0Y29uc3Qgc2VydmVyX3JlbmRlcmVkX3BlbmRpbmcgPSBjb21tZW50X2RhdGEgPT09IEhZRFJBVElPTl9TVEFSVF9FTFNFO1xuXHRcdFx0XHRjb25zdCBzZXJ2ZXJfcmVuZGVyZWRfZmFpbGVkID0gY29tbWVudF9kYXRhLnN0YXJ0c1dpdGgoSFlEUkFUSU9OX1NUQVJUX0ZBSUxFRCk7XG5cblx0XHRcdFx0aWYgKHNlcnZlcl9yZW5kZXJlZF9mYWlsZWQpIHtcblx0XHRcdFx0XHQvLyBTZXJ2ZXIgcmVuZGVyZWQgdGhlIGZhaWxlZCBzbmlwcGV0IC0gaHlkcmF0ZSBpdC5cblx0XHRcdFx0XHQvLyBUaGUgc2VyaWFsaXplZCBlcnJvciBpcyBlbWJlZGRlZCBpbiB0aGUgY29tbWVudDogPCEtLVs/PGpzb24+LS0+XG5cdFx0XHRcdFx0Y29uc3Qgc2VyaWFsaXplZF9lcnJvciA9IEpTT04ucGFyc2UoY29tbWVudF9kYXRhLnNsaWNlKEhZRFJBVElPTl9TVEFSVF9GQUlMRUQubGVuZ3RoKSk7XG5cdFx0XHRcdFx0dGhpcy4jaHlkcmF0ZV9mYWlsZWRfY29udGVudChzZXJpYWxpemVkX2Vycm9yKTtcblx0XHRcdFx0fSBlbHNlIGlmIChzZXJ2ZXJfcmVuZGVyZWRfcGVuZGluZykge1xuXHRcdFx0XHRcdHRoaXMuI2h5ZHJhdGVfcGVuZGluZ19jb250ZW50KCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy4jaHlkcmF0ZV9yZXNvbHZlZF9jb250ZW50KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuI3JlbmRlcigpO1xuXHRcdFx0fVxuXHRcdH0sIGZsYWdzKTtcblxuXHRcdGlmIChoeWRyYXRpbmcpIHtcblx0XHRcdHRoaXMuI2FuY2hvciA9IGh5ZHJhdGVfbm9kZTtcblx0XHR9XG5cdH1cblxuXHQjaHlkcmF0ZV9yZXNvbHZlZF9jb250ZW50KCkge1xuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLiNtYWluX2VmZmVjdCA9IGJyYW5jaCgoKSA9PiB0aGlzLiNjaGlsZHJlbih0aGlzLiNhbmNob3IpKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvcihlcnJvcik7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7dW5rbm93bn0gZXJyb3IgVGhlIGRlc2VyaWFsaXplZCBlcnJvciBmcm9tIHRoZSBzZXJ2ZXIncyBoeWRyYXRpb24gY29tbWVudFxuXHQgKi9cblx0I2h5ZHJhdGVfZmFpbGVkX2NvbnRlbnQoZXJyb3IpIHtcblx0XHRjb25zdCBmYWlsZWQgPSB0aGlzLiNwcm9wcy5mYWlsZWQ7XG5cdFx0Y29uc3QgeyByZXNldCwgaW52b2tlX29uZXJyb3IgfSA9IHRoaXMuI2NyZWF0ZV9yZXNldChlcnJvcik7XG5cblx0XHQvLyBgb25lcnJvcmAgbWF5IG11dGF0ZSBzdGF0ZSwgd2hpY2ggaXMgZGlzYWxsb3dlZCB3aGlsZSBoeWRyYXRpbmdcblx0XHRxdWV1ZV9taWNyb190YXNrKGludm9rZV9vbmVycm9yKTtcblxuXHRcdGlmICghZmFpbGVkKSByZXR1cm47XG5cblx0XHR0aGlzLiNmYWlsZWRfZWZmZWN0ID0gYnJhbmNoKCgpID0+IHtcblx0XHRcdGZhaWxlZChcblx0XHRcdFx0dGhpcy4jYW5jaG9yLFxuXHRcdFx0XHQoKSA9PiBlcnJvcixcblx0XHRcdFx0KCkgPT4gcmVzZXRcblx0XHRcdCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyB0aGUgYHJlc2V0YCBmdW5jdGlvbiBmb3IgYSBmYWlsZWQgYm91bmRhcnksIGFsb25nIHdpdGggYSBmdW5jdGlvblxuXHQgKiB0aGF0IGludm9rZXMgYG9uZXJyb3JgIHdpdGggaXQgKGlmIHByb3ZpZGVkKVxuXHQgKiBAcGFyYW0ge3Vua25vd259IGVycm9yXG5cdCAqIEByZXR1cm5zIHt7IHJlc2V0OiAoKSA9PiB2b2lkLCBpbnZva2Vfb25lcnJvcjogKCkgPT4gdm9pZCB9fVxuXHQgKi9cblx0I2NyZWF0ZV9yZXNldChlcnJvcikge1xuXHRcdHZhciBkaWRfcmVzZXQgPSBmYWxzZTtcblx0XHR2YXIgY2FsbGluZ19vbl9lcnJvciA9IGZhbHNlO1xuXG5cdFx0Y29uc3QgcmVzZXQgPSAoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy4jaXNfZGVzdHJveWVkKCkpIHJldHVybjtcblxuXHRcdFx0aWYgKGRpZF9yZXNldCkge1xuXHRcdFx0XHR3LnN2ZWx0ZV9ib3VuZGFyeV9yZXNldF9ub29wKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0ZGlkX3Jlc2V0ID0gdHJ1ZTtcblxuXHRcdFx0aWYgKGNhbGxpbmdfb25fZXJyb3IpIHtcblx0XHRcdFx0ZS5zdmVsdGVfYm91bmRhcnlfcmVzZXRfb25lcnJvcigpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy4jZmFpbGVkX2VmZmVjdCAhPT0gbnVsbCkge1xuXHRcdFx0XHRwYXVzZV9lZmZlY3QodGhpcy4jZmFpbGVkX2VmZmVjdCwgKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuI2ZhaWxlZF9lZmZlY3QgPSBudWxsO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy4jcnVuKCgpID0+IHtcblx0XHRcdFx0dGhpcy4jcmVuZGVyKCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0Y29uc3QgaW52b2tlX29uZXJyb3IgPSAoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy4jaXNfZGVzdHJveWVkKCkpIHJldHVybjtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y2FsbGluZ19vbl9lcnJvciA9IHRydWU7XG5cdFx0XHRcdHRoaXMuI3Byb3BzLm9uZXJyb3I/LihlcnJvciwgcmVzZXQpO1xuXHRcdFx0XHRjYWxsaW5nX29uX2Vycm9yID0gZmFsc2U7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0aW52b2tlX2Vycm9yX2JvdW5kYXJ5KGVyciwgdGhpcy4jZWZmZWN0ICYmIHRoaXMuI2VmZmVjdC5wYXJlbnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRyZXR1cm4geyByZXNldCwgaW52b2tlX29uZXJyb3IgfTtcblx0fVxuXG5cdCNpc19kZXN0cm95ZWQoKSB7XG5cdFx0cmV0dXJuICh0aGlzLiNlZmZlY3QuZiAmIChERVNUUk9ZRUQgfCBERVNUUk9ZSU5HKSkgIT09IDA7XG5cdH1cblxuXHQjaHlkcmF0ZV9wZW5kaW5nX2NvbnRlbnQoKSB7XG5cdFx0Y29uc3QgcGVuZGluZyA9IHRoaXMuI3Byb3BzLnBlbmRpbmc7XG5cdFx0aWYgKCFwZW5kaW5nKSByZXR1cm47XG5cblx0XHR0aGlzLmlzX3BlbmRpbmcgPSB0cnVlO1xuXHRcdHRoaXMuI3BlbmRpbmdfZWZmZWN0ID0gYnJhbmNoKCgpID0+IHBlbmRpbmcodGhpcy4jYW5jaG9yKSk7XG5cblx0XHRxdWV1ZV9taWNyb190YXNrKCgpID0+IHtcblx0XHRcdGlmICh0aGlzLiNpc19kZXN0cm95ZWQoKSkgcmV0dXJuO1xuXG5cdFx0XHR2YXIgZnJhZ21lbnQgPSAodGhpcy4jb2Zmc2NyZWVuX2ZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTtcblx0XHRcdHZhciBhbmNob3IgPSBjcmVhdGVfdGV4dCgpO1xuXHRcdFx0dmFyIGhhbmRsZWQgPSBmYWxzZTtcblxuXHRcdFx0ZnJhZ21lbnQuYXBwZW5kKGFuY2hvcik7XG5cblx0XHRcdHRoaXMuI21haW5fZWZmZWN0ID0gdGhpcy4jcnVuKCgpID0+IHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRyZXR1cm4gYnJhbmNoKCgpID0+IHRoaXMuI2NoaWxkcmVuKGFuY2hvcikpO1xuXHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHR0aGlzLmVycm9yKGVycm9yKTtcblx0XHRcdFx0XHRcdGhhbmRsZWQgPSB0cnVlO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0XHRpbnZva2VfZXJyb3JfYm91bmRhcnkoZXJyb3IsIHRoaXMuI2VmZmVjdC5wYXJlbnQpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKHRoaXMuI21haW5fZWZmZWN0ID09PSBudWxsKSB7XG5cdFx0XHRcdHRoaXMuI29mZnNjcmVlbl9mcmFnbWVudCA9IG51bGw7XG5cdFx0XHRcdGlmIChoYW5kbGVkKSB0aGlzLiNyZXNvbHZlKC8qKiBAdHlwZSB7QmF0Y2h9ICovIChjdXJyZW50X2JhdGNoKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMuI3BlbmRpbmdfY291bnQgPT09IDApIHtcblx0XHRcdFx0dGhpcy4jYW5jaG9yLmJlZm9yZShmcmFnbWVudCk7XG5cdFx0XHRcdHRoaXMuI29mZnNjcmVlbl9mcmFnbWVudCA9IG51bGw7XG5cblx0XHRcdFx0cGF1c2VfZWZmZWN0KC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAodGhpcy4jcGVuZGluZ19lZmZlY3QpLCAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy4jcGVuZGluZ19lZmZlY3QgPSBudWxsO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHR0aGlzLiNyZXNvbHZlKC8qKiBAdHlwZSB7QmF0Y2h9ICovIChjdXJyZW50X2JhdGNoKSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQjcmVuZGVyKCkge1xuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLmlzX3BlbmRpbmcgPSB0aGlzLmhhc19wZW5kaW5nX3NuaXBwZXQoKTtcblx0XHRcdHRoaXMuI3BlbmRpbmdfY291bnQgPSAwO1xuXHRcdFx0dGhpcy4jbG9jYWxfcGVuZGluZ19jb3VudCA9IDA7XG5cblx0XHRcdHRoaXMuI21haW5fZWZmZWN0ID0gYnJhbmNoKCgpID0+IHtcblx0XHRcdFx0dGhpcy4jY2hpbGRyZW4odGhpcy4jYW5jaG9yKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAodGhpcy4jcGVuZGluZ19jb3VudCA+IDApIHtcblx0XHRcdFx0dmFyIGZyYWdtZW50ID0gKHRoaXMuI29mZnNjcmVlbl9mcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSk7XG5cdFx0XHRcdG1vdmVfZWZmZWN0KHRoaXMuI21haW5fZWZmZWN0LCBmcmFnbWVudCk7XG5cblx0XHRcdFx0Y29uc3QgcGVuZGluZyA9IC8qKiBAdHlwZSB7KGFuY2hvcjogTm9kZSkgPT4gdm9pZH0gKi8gKHRoaXMuI3Byb3BzLnBlbmRpbmcpO1xuXHRcdFx0XHR0aGlzLiNwZW5kaW5nX2VmZmVjdCA9IGJyYW5jaCgoKSA9PiBwZW5kaW5nKHRoaXMuI2FuY2hvcikpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy4jcmVzb2x2ZSgvKiogQHR5cGUge0JhdGNofSAqLyAoY3VycmVudF9iYXRjaCkpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yKGVycm9yKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIHtCYXRjaH0gYmF0Y2hcblx0ICovXG5cdCNyZXNvbHZlKGJhdGNoKSB7XG5cdFx0dGhpcy5pc19wZW5kaW5nID0gZmFsc2U7XG5cblx0XHQvLyBhbnkgZWZmZWN0cyB0aGF0IHdlcmUgcHJldmlvdXNseSBkZWZlcnJlZCBzaG91bGQgYmUgdHJhbnNmZXJyZWRcblx0XHQvLyB0byB0aGUgYmF0Y2gsIHdoaWNoIHdpbGwgZmx1c2ggaW4gdGhlIG5leHQgbWljcm90YXNrXG5cdFx0YmF0Y2gudHJhbnNmZXJfcmVhY3Rpb25zKHRoaXMuI2RpcnR5X3JlYWN0aW9ucyk7XG5cdH1cblxuXHQvKipcblx0ICogRGVmZXIgYW4gZWZmZWN0IGluc2lkZSBhIHBlbmRpbmcgYm91bmRhcnkgdW50aWwgdGhlIGJvdW5kYXJ5IHJlc29sdmVzXG5cdCAqIEBwYXJhbSB7RWZmZWN0fSBlZmZlY3Rcblx0ICovXG5cdGRlZmVyX2VmZmVjdChlZmZlY3QpIHtcblx0XHRkZWZlcl9lZmZlY3QoZWZmZWN0LCB0aGlzLiNkaXJ0eV9yZWFjdGlvbnMpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgYGZhbHNlYCBpZiB0aGUgZWZmZWN0IGV4aXN0cyBpbnNpZGUgYSBib3VuZGFyeSB3aG9zZSBwZW5kaW5nIHNuaXBwZXQgaXMgc2hvd25cblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRpc19yZW5kZXJlZCgpIHtcblx0XHRyZXR1cm4gIXRoaXMuaXNfcGVuZGluZyAmJiAoIXRoaXMucGFyZW50IHx8IHRoaXMucGFyZW50LmlzX3JlbmRlcmVkKCkpO1xuXHR9XG5cblx0aGFzX3BlbmRpbmdfc25pcHBldCgpIHtcblx0XHRyZXR1cm4gISF0aGlzLiNwcm9wcy5wZW5kaW5nO1xuXHR9XG5cblx0LyoqXG5cdCAqIEB0ZW1wbGF0ZSBUXG5cdCAqIEBwYXJhbSB7KCkgPT4gVH0gZm5cblx0ICovXG5cdCNydW4oZm4pIHtcblx0XHR2YXIgcHJldmlvdXNfZWZmZWN0ID0gYWN0aXZlX2VmZmVjdDtcblx0XHR2YXIgcHJldmlvdXNfcmVhY3Rpb24gPSBhY3RpdmVfcmVhY3Rpb247XG5cdFx0dmFyIHByZXZpb3VzX2N0eCA9IGNvbXBvbmVudF9jb250ZXh0O1xuXG5cdFx0c2V0X2FjdGl2ZV9lZmZlY3QodGhpcy4jZWZmZWN0KTtcblx0XHRzZXRfYWN0aXZlX3JlYWN0aW9uKHRoaXMuI2VmZmVjdCk7XG5cdFx0c2V0X2NvbXBvbmVudF9jb250ZXh0KHRoaXMuI2VmZmVjdC5jdHgpO1xuXG5cdFx0dHJ5IHtcblx0XHRcdEJhdGNoLmVuc3VyZSgpO1xuXHRcdFx0cmV0dXJuIGZuKCk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHNldF9hY3RpdmVfZWZmZWN0KHByZXZpb3VzX2VmZmVjdCk7XG5cdFx0XHRzZXRfYWN0aXZlX3JlYWN0aW9uKHByZXZpb3VzX3JlYWN0aW9uKTtcblx0XHRcdHNldF9jb21wb25lbnRfY29udGV4dChwcmV2aW91c19jdHgpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBwZW5kaW5nIGNvdW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudGx5IHZpc2libGUgcGVuZGluZyBzbmlwcGV0LFxuXHQgKiBpZiBhbnksIHN1Y2ggdGhhdCB3ZSBjYW4gcmVwbGFjZSB0aGUgc25pcHBldCB3aXRoIGNvbnRlbnQgb25jZSB3b3JrIGlzIGRvbmVcblx0ICogQHBhcmFtIHsxIHwgLTF9IGRcblx0ICogQHBhcmFtIHtCYXRjaH0gYmF0Y2hcblx0ICovXG5cdCN1cGRhdGVfcGVuZGluZ19jb3VudChkLCBiYXRjaCkge1xuXHRcdGlmICghdGhpcy5oYXNfcGVuZGluZ19zbmlwcGV0KCkpIHtcblx0XHRcdGlmICh0aGlzLnBhcmVudCkge1xuXHRcdFx0XHR0aGlzLnBhcmVudC4jdXBkYXRlX3BlbmRpbmdfY291bnQoZCwgYmF0Y2gpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBpZiB0aGVyZSdzIG5vIHBhcmVudCwgd2UncmUgaW4gYSBzY29wZSB3aXRoIG5vIHBlbmRpbmcgc25pcHBldFxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuI3BlbmRpbmdfY291bnQgKz0gZDtcblxuXHRcdGlmICh0aGlzLiNwZW5kaW5nX2NvdW50ID09PSAwKSB7XG5cdFx0XHR0aGlzLiNyZXNvbHZlKGJhdGNoKTtcblxuXHRcdFx0aWYgKHRoaXMuI3BlbmRpbmdfZWZmZWN0KSB7XG5cdFx0XHRcdHBhdXNlX2VmZmVjdCh0aGlzLiNwZW5kaW5nX2VmZmVjdCwgKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuI3BlbmRpbmdfZWZmZWN0ID0gbnVsbDtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLiNvZmZzY3JlZW5fZnJhZ21lbnQpIHtcblx0XHRcdFx0dGhpcy4jYW5jaG9yLmJlZm9yZSh0aGlzLiNvZmZzY3JlZW5fZnJhZ21lbnQpO1xuXHRcdFx0XHR0aGlzLiNvZmZzY3JlZW5fZnJhZ21lbnQgPSBudWxsO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgdGhlIHNvdXJjZSB0aGF0IHBvd2VycyBgJGVmZmVjdC5wZW5kaW5nKClgIGluc2lkZSB0aGlzIGJvdW5kYXJ5LFxuXHQgKiBhbmQgY29udHJvbHMgd2hlbiB0aGUgY3VycmVudCBgcGVuZGluZ2Agc25pcHBldCAoaWYgYW55KSBpcyByZW1vdmVkLlxuXHQgKiBEbyBub3QgY2FsbCBmcm9tIGluc2lkZSB0aGUgY2xhc3Ncblx0ICogQHBhcmFtIHsxIHwgLTF9IGRcblx0ICogQHBhcmFtIHtCYXRjaH0gYmF0Y2hcblx0ICovXG5cdHVwZGF0ZV9wZW5kaW5nX2NvdW50KGQsIGJhdGNoKSB7XG5cdFx0dGhpcy4jdXBkYXRlX3BlbmRpbmdfY291bnQoZCwgYmF0Y2gpO1xuXG5cdFx0dGhpcy4jbG9jYWxfcGVuZGluZ19jb3VudCArPSBkO1xuXG5cdFx0aWYgKCF0aGlzLiNlZmZlY3RfcGVuZGluZyB8fCB0aGlzLiNwZW5kaW5nX2NvdW50X3VwZGF0ZV9xdWV1ZWQpIHJldHVybjtcblx0XHR0aGlzLiNwZW5kaW5nX2NvdW50X3VwZGF0ZV9xdWV1ZWQgPSB0cnVlO1xuXG5cdFx0cXVldWVfbWljcm9fdGFzaygoKSA9PiB7XG5cdFx0XHR0aGlzLiNwZW5kaW5nX2NvdW50X3VwZGF0ZV9xdWV1ZWQgPSBmYWxzZTtcblx0XHRcdGlmICh0aGlzLiNlZmZlY3RfcGVuZGluZykge1xuXHRcdFx0XHRpbnRlcm5hbF9zZXQodGhpcy4jZWZmZWN0X3BlbmRpbmcsIHRoaXMuI2xvY2FsX3BlbmRpbmdfY291bnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Z2V0X2VmZmVjdF9wZW5kaW5nKCkge1xuXHRcdHRoaXMuI2VmZmVjdF9wZW5kaW5nX3N1YnNjcmliZXIoKTtcblx0XHRyZXR1cm4gZ2V0KC8qKiBAdHlwZSB7U291cmNlPG51bWJlcj59ICovICh0aGlzLiNlZmZlY3RfcGVuZGluZykpO1xuXHR9XG5cblx0LyoqIEBwYXJhbSB7dW5rbm93bn0gZXJyb3IgKi9cblx0ZXJyb3IoZXJyb3IpIHtcblx0XHRpZiAoZXJyb3IgPT09IEhZRFJBVElPTl9FUlJPUikge1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgd2UgaGF2ZSBub3RoaW5nIHRvIGNhcHR1cmUgdGhlIGVycm9yLCBvciBpZiB3ZSBoaXQgYW4gZXJyb3Igd2hpbGVcblx0XHQvLyByZW5kZXJpbmcgdGhlIGZhbGxiYWNrLCByZS10aHJvdyBmb3IgYW5vdGhlciBib3VuZGFyeSB0byBoYW5kbGVcblx0XHRpZiAoIXRoaXMuI3Byb3BzLm9uZXJyb3IgJiYgIXRoaXMuI3Byb3BzLmZhaWxlZCkge1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXG5cdFx0aWYgKGN1cnJlbnRfYmF0Y2g/LmlzX2ZvcmspIHtcblx0XHRcdGlmICh0aGlzLiNtYWluX2VmZmVjdCkgY3VycmVudF9iYXRjaC5za2lwX2VmZmVjdCh0aGlzLiNtYWluX2VmZmVjdCk7XG5cdFx0XHRpZiAodGhpcy4jcGVuZGluZ19lZmZlY3QpIGN1cnJlbnRfYmF0Y2guc2tpcF9lZmZlY3QodGhpcy4jcGVuZGluZ19lZmZlY3QpO1xuXHRcdFx0aWYgKHRoaXMuI2ZhaWxlZF9lZmZlY3QpIGN1cnJlbnRfYmF0Y2guc2tpcF9lZmZlY3QodGhpcy4jZmFpbGVkX2VmZmVjdCk7XG5cblx0XHRcdGN1cnJlbnRfYmF0Y2gub25jb21taXQoKCkgPT4ge1xuXHRcdFx0XHRpZiAoIXRoaXMuI2lzX2Rlc3Ryb3llZCgpKSB0aGlzLiNoYW5kbGVfZXJyb3IoZXJyb3IpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuI2hhbmRsZV9lcnJvcihlcnJvcik7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7dW5rbm93bn0gZXJyb3Jcblx0ICovXG5cdCNoYW5kbGVfZXJyb3IoZXJyb3IpIHtcblx0XHRpZiAodGhpcy4jbWFpbl9lZmZlY3QpIHtcblx0XHRcdGRlc3Ryb3lfZWZmZWN0KHRoaXMuI21haW5fZWZmZWN0KTtcblx0XHRcdHRoaXMuI21haW5fZWZmZWN0ID0gbnVsbDtcblx0XHR9XG5cblx0XHRpZiAodGhpcy4jcGVuZGluZ19lZmZlY3QpIHtcblx0XHRcdGRlc3Ryb3lfZWZmZWN0KHRoaXMuI3BlbmRpbmdfZWZmZWN0KTtcblx0XHRcdHRoaXMuI3BlbmRpbmdfZWZmZWN0ID0gbnVsbDtcblx0XHR9XG5cblx0XHRpZiAodGhpcy4jZmFpbGVkX2VmZmVjdCkge1xuXHRcdFx0ZGVzdHJveV9lZmZlY3QodGhpcy4jZmFpbGVkX2VmZmVjdCk7XG5cdFx0XHR0aGlzLiNmYWlsZWRfZWZmZWN0ID0gbnVsbDtcblx0XHR9XG5cblx0XHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0XHRzZXRfaHlkcmF0ZV9ub2RlKC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAodGhpcy4jaHlkcmF0ZV9vcGVuKSk7XG5cdFx0XHRuZXh0KCk7XG5cdFx0XHRzZXRfaHlkcmF0ZV9ub2RlKHNraXBfbm9kZXMoKSk7XG5cdFx0fVxuXG5cdFx0bGV0IGZhaWxlZCA9IHRoaXMuI3Byb3BzLmZhaWxlZDtcblxuXHRcdC8qKiBAcGFyYW0ge3Vua25vd259IHRyYW5zZm9ybWVkX2Vycm9yICovXG5cdFx0Y29uc3QgaGFuZGxlX2Vycm9yX3Jlc3VsdCA9ICh0cmFuc2Zvcm1lZF9lcnJvcikgPT4ge1xuXHRcdFx0aWYgKHRoaXMuI2lzX2Rlc3Ryb3llZCgpKSByZXR1cm47XG5cblx0XHRcdGNvbnN0IHsgcmVzZXQsIGludm9rZV9vbmVycm9yIH0gPSB0aGlzLiNjcmVhdGVfcmVzZXQodHJhbnNmb3JtZWRfZXJyb3IpO1xuXG5cdFx0XHRpbnZva2Vfb25lcnJvcigpO1xuXG5cdFx0XHRpZiAoZmFpbGVkICYmICF0aGlzLiNpc19kZXN0cm95ZWQoKSkge1xuXHRcdFx0XHR0aGlzLiNmYWlsZWRfZWZmZWN0ID0gdGhpcy4jcnVuKCgpID0+IHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGJyYW5jaCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdC8vIGVycm9ycyBpbiBgZmFpbGVkYCBzbmlwcGV0cyBjYXVzZSB0aGUgYm91bmRhcnkgdG8gZXJyb3IgYWdhaW5cblx0XHRcdFx0XHRcdFx0Ly8gVE9ETyBTdmVsdGUgNjogcmV2aXNpdCB0aGlzIGRlY2lzaW9uLCBtb3N0IGxpa2VseSBiZXR0ZXIgdG8gZ28gdG8gcGFyZW50IGJvdW5kYXJ5IGluc3RlYWRcblx0XHRcdFx0XHRcdFx0dmFyIGVmZmVjdCA9IC8qKiBAdHlwZSB7RWZmZWN0fSAqLyAoYWN0aXZlX2VmZmVjdCk7XG5cblx0XHRcdFx0XHRcdFx0ZWZmZWN0LmIgPSB0aGlzO1xuXHRcdFx0XHRcdFx0XHRlZmZlY3QuZiB8PSBCT1VOREFSWV9FRkZFQ1Q7XG5cblx0XHRcdFx0XHRcdFx0ZmFpbGVkKFxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuI2FuY2hvcixcblx0XHRcdFx0XHRcdFx0XHQoKSA9PiB0cmFuc2Zvcm1lZF9lcnJvcixcblx0XHRcdFx0XHRcdFx0XHQoKSA9PiByZXNldFxuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRcdGludm9rZV9lcnJvcl9ib3VuZGFyeShlcnJvciwgLyoqIEB0eXBlIHtFZmZlY3R9ICovICh0aGlzLiNlZmZlY3QucGFyZW50KSk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRxdWV1ZV9taWNyb190YXNrKCgpID0+IHtcblx0XHRcdGlmICh0aGlzLiNpc19kZXN0cm95ZWQoKSkgcmV0dXJuO1xuXG5cdFx0XHQvLyBSdW4gdGhlIGVycm9yIHRocm91Z2ggdGhlIEFQSS1sZXZlbCB0cmFuc2Zvcm1FcnJvciB0cmFuc2Zvcm0gKGUuZy4gU3ZlbHRlS2l0J3MgaGFuZGxlRXJyb3IpXG5cdFx0XHQvKiogQHR5cGUge3Vua25vd259ICovXG5cdFx0XHR2YXIgcmVzdWx0O1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmVzdWx0ID0gdGhpcy50cmFuc2Zvcm1fZXJyb3IoZXJyb3IpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpbnZva2VfZXJyb3JfYm91bmRhcnkoZSwgdGhpcy4jZWZmZWN0ICYmIHRoaXMuI2VmZmVjdC5wYXJlbnQpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmIChcblx0XHRcdFx0cmVzdWx0ICE9PSBudWxsICYmXG5cdFx0XHRcdHR5cGVvZiByZXN1bHQgPT09ICdvYmplY3QnICYmXG5cdFx0XHRcdHR5cGVvZiAoLyoqIEB0eXBlIHthbnl9ICovIChyZXN1bHQpLnRoZW4pID09PSAnZnVuY3Rpb24nXG5cdFx0XHQpIHtcblx0XHRcdFx0Ly8gdHJhbnNmb3JtRXJyb3IgcmV0dXJuZWQgYSBQcm9taXNlIOKAlCB3YWl0IGZvciBpdFxuXHRcdFx0XHQvKiogQHR5cGUge2FueX0gKi8gKHJlc3VsdCkudGhlbihcblx0XHRcdFx0XHRoYW5kbGVfZXJyb3JfcmVzdWx0LFxuXHRcdFx0XHRcdC8qKiBAcGFyYW0ge3Vua25vd259IGUgKi9cblx0XHRcdFx0XHQoZSkgPT4gaW52b2tlX2Vycm9yX2JvdW5kYXJ5KGUsIHRoaXMuI2VmZmVjdCAmJiB0aGlzLiNlZmZlY3QucGFyZW50KVxuXHRcdFx0XHQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gU3luY2hyb25vdXMgcmVzdWx0IOKAlCBoYW5kbGUgaW1tZWRpYXRlbHlcblx0XHRcdFx0aGFuZGxlX2Vycm9yX3Jlc3VsdChyZXN1bHQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwZW5kaW5nKCkge1xuXHRpZiAoYWN0aXZlX2VmZmVjdCA9PT0gbnVsbCkge1xuXHRcdGUuZWZmZWN0X3BlbmRpbmdfb3V0c2lkZV9yZWFjdGlvbigpO1xuXHR9XG5cblx0dmFyIGJvdW5kYXJ5ID0gYWN0aXZlX2VmZmVjdC5iO1xuXG5cdGlmIChib3VuZGFyeSA9PT0gbnVsbCkge1xuXHRcdHJldHVybiAwOyAvLyBUT0RPIGV2ZW50dWFsbHkgd2Ugd2lsbCBuZWVkIHRoaXMgdG8gYmUgZ2xvYmFsXG5cdH1cblxuXHRyZXR1cm4gYm91bmRhcnkuZ2V0X2VmZmVjdF9wZW5kaW5nKCk7XG59XG4iLCIvKiogQGltcG9ydCB7IENvbXBvbmVudENvbnRleHQsIEVmZmVjdCwgRWZmZWN0Tm9kZXMsIFRlbXBsYXRlTm9kZSB9IGZyb20gJyNjbGllbnQnICovXG4vKiogQGltcG9ydCB7IENvbXBvbmVudCwgQ29tcG9uZW50VHlwZSwgU3ZlbHRlQ29tcG9uZW50LCBNb3VudE9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbmRleC5qcycgKi9cbmltcG9ydCB7IERFViB9IGZyb20gJ2VzbS1lbnYnO1xuaW1wb3J0IHtcblx0Y2xlYXJfdGV4dF9jb250ZW50LFxuXHRjcmVhdGVfdGV4dCxcblx0Z2V0X2ZpcnN0X2NoaWxkLFxuXHRnZXRfbmV4dF9zaWJsaW5nLFxuXHRpbml0X29wZXJhdGlvbnNcbn0gZnJvbSAnLi9kb20vb3BlcmF0aW9ucy5qcyc7XG5pbXBvcnQgeyBIWURSQVRJT05fRU5ELCBIWURSQVRJT05fRVJST1IsIEhZRFJBVElPTl9TVEFSVCB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBhY3RpdmVfZWZmZWN0IH0gZnJvbSAnLi9ydW50aW1lLmpzJztcbmltcG9ydCB7IHB1c2gsIHBvcCwgY29tcG9uZW50X2NvbnRleHQsIG1hcmtfYXNfY29tcG9uZW50IH0gZnJvbSAnLi9jb250ZXh0LmpzJztcbmltcG9ydCB7IGNvbXBvbmVudF9yb290IH0gZnJvbSAnLi9yZWFjdGl2aXR5L2VmZmVjdHMuanMnO1xuaW1wb3J0IHsgaHlkcmF0ZV9ub2RlLCBoeWRyYXRpbmcsIHNldF9oeWRyYXRlX25vZGUsIHNldF9oeWRyYXRpbmcgfSBmcm9tICcuL2RvbS9oeWRyYXRpb24uanMnO1xuaW1wb3J0IHsgYXJyYXlfZnJvbSB9IGZyb20gJy4uL3NoYXJlZC91dGlscy5qcyc7XG5pbXBvcnQge1xuXHRhbGxfcmVnaXN0ZXJlZF9ldmVudHMsXG5cdGhhbmRsZV9ldmVudF9wcm9wYWdhdGlvbixcblx0cm9vdF9ldmVudF9oYW5kbGVzXG59IGZyb20gJy4vZG9tL2VsZW1lbnRzL2V2ZW50cy5qcyc7XG5pbXBvcnQgKiBhcyB3IGZyb20gJy4vd2FybmluZ3MuanMnO1xuaW1wb3J0ICogYXMgZSBmcm9tICcuL2Vycm9ycy5qcyc7XG5pbXBvcnQgeyBhc3NpZ25fbm9kZXMgfSBmcm9tICcuL2RvbS90ZW1wbGF0ZS5qcyc7XG5pbXBvcnQgeyBpc19wYXNzaXZlX2V2ZW50IH0gZnJvbSAnLi4vLi4vdXRpbHMuanMnO1xuaW1wb3J0IHsgQ09NTUVOVF9OT0RFLCBURVhUX0NBQ0hFIH0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgYm91bmRhcnkgfSBmcm9tICcuL2RvbS9ibG9ja3MvYm91bmRhcnkuanMnO1xuXG4vKipcbiAqIFRoaXMgaXMgbm9ybWFsbHkgdHJ1ZSDigJQgYmxvY2sgZWZmZWN0cyBzaG91bGQgcnVuIHRoZWlyIGludHJvIHRyYW5zaXRpb25zIOKAlFxuICogYnV0IGlzIGZhbHNlIGR1cmluZyBoeWRyYXRpb24gKHVubGVzcyBgb3B0aW9ucy5pbnRyb2AgaXMgYHRydWVgKSBhbmRcbiAqIHdoZW4gY3JlYXRpbmcgdGhlIGNoaWxkcmVuIG9mIGEgYDxzdmVsdGU6ZWxlbWVudD5gIHRoYXQganVzdCBjaGFuZ2VkIHRhZ1xuICovXG5leHBvcnQgbGV0IHNob3VsZF9pbnRybyA9IHRydWU7XG5cbi8qKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlICovXG5leHBvcnQgZnVuY3Rpb24gc2V0X3Nob3VsZF9pbnRybyh2YWx1ZSkge1xuXHRzaG91bGRfaW50cm8gPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRleHRcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRfdGV4dCh0ZXh0LCB2YWx1ZSkge1xuXHQvLyBGb3Igb2JqZWN0cywgd2UgYXBwbHkgc3RyaW5nIGNvZXJjaW9uICh3aGljaCBtaWdodCBtYWtlIHRoaW5ncyBsaWtlICRzdGF0ZSBhcnJheSByZWZlcmVuY2VzIGluIHRoZSB0ZW1wbGF0ZSByZWFjdGl2ZSkgYmVmb3JlIGRpZmZpbmdcblx0dmFyIHN0ciA9IHZhbHVlID09IG51bGwgPyAnJyA6IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgPyBgJHt2YWx1ZX1gIDogdmFsdWU7XG5cdC8vIHByZXR0aWVyLWlnbm9yZVxuXHRpZiAoc3RyICE9PSAoLyoqIEB0eXBlIHthbnl9ICovICh0ZXh0KVtURVhUX0NBQ0hFXSA/Pz0gdGV4dC5ub2RlVmFsdWUpKSB7XG5cdFx0LyoqIEB0eXBlIHthbnl9ICovICh0ZXh0KVtURVhUX0NBQ0hFXSA9IHN0cjtcblx0XHR0ZXh0Lm5vZGVWYWx1ZSA9IGAke3N0cn1gO1xuXHR9XG59XG5cbi8qKlxuICogTW91bnRzIGEgY29tcG9uZW50IHRvIHRoZSBnaXZlbiB0YXJnZXQgYW5kIHJldHVybnMgdGhlIGV4cG9ydHMgYW5kIHBvdGVudGlhbGx5IHRoZSBwcm9wcyAoaWYgY29tcGlsZWQgd2l0aCBgYWNjZXNzb3JzOiB0cnVlYCkgb2YgdGhlIGNvbXBvbmVudC5cbiAqIFRyYW5zaXRpb25zIHdpbGwgcGxheSBkdXJpbmcgdGhlIGluaXRpYWwgcmVuZGVyIHVubGVzcyB0aGUgYGludHJvYCBvcHRpb24gaXMgc2V0IHRvIGBmYWxzZWAuXG4gKlxuICogQHRlbXBsYXRlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBQcm9wc1xuICogQHRlbXBsYXRlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBFeHBvcnRzXG4gKiBAcGFyYW0ge0NvbXBvbmVudFR5cGU8U3ZlbHRlQ29tcG9uZW50PFByb3BzPj4gfCBDb21wb25lbnQ8UHJvcHMsIEV4cG9ydHMsIGFueT59IGNvbXBvbmVudFxuICogQHBhcmFtIHtNb3VudE9wdGlvbnM8UHJvcHM+fSBvcHRpb25zXG4gKiBAcmV0dXJucyB7RXhwb3J0c31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdW50KGNvbXBvbmVudCwgb3B0aW9ucykge1xuXHRyZXR1cm4gX21vdW50KGNvbXBvbmVudCwgb3B0aW9ucyk7XG59XG5cbi8qKlxuICogSHlkcmF0ZXMgYSBjb21wb25lbnQgb24gdGhlIGdpdmVuIHRhcmdldCBhbmQgcmV0dXJucyB0aGUgZXhwb3J0cyBhbmQgcG90ZW50aWFsbHkgdGhlIHByb3BzIChpZiBjb21waWxlZCB3aXRoIGBhY2Nlc3NvcnM6IHRydWVgKSBvZiB0aGUgY29tcG9uZW50XG4gKlxuICogQHRlbXBsYXRlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBQcm9wc1xuICogQHRlbXBsYXRlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBFeHBvcnRzXG4gKiBAcGFyYW0ge0NvbXBvbmVudFR5cGU8U3ZlbHRlQ29tcG9uZW50PFByb3BzPj4gfCBDb21wb25lbnQ8UHJvcHMsIEV4cG9ydHMsIGFueT59IGNvbXBvbmVudFxuICogQHBhcmFtIHt7fSBleHRlbmRzIFByb3BzID8ge1xuICogXHRcdHRhcmdldDogRG9jdW1lbnQgfCBFbGVtZW50IHwgU2hhZG93Um9vdDtcbiAqIFx0XHRwcm9wcz86IFByb3BzO1xuICogXHRcdGV2ZW50cz86IFJlY29yZDxzdHJpbmcsIChlOiBhbnkpID0+IGFueT47XG4gKiAgXHRjb250ZXh0PzogTWFwPGFueSwgYW55PjtcbiAqIFx0XHRpbnRybz86IGJvb2xlYW47XG4gKiBcdFx0cmVjb3Zlcj86IGJvb2xlYW47XG4gKlx0XHR0cmFuc2Zvcm1FcnJvcj86IChlcnJvcjogdW5rbm93bikgPT4gdW5rbm93bjtcbiAqIFx0fSA6IHtcbiAqIFx0XHR0YXJnZXQ6IERvY3VtZW50IHwgRWxlbWVudCB8IFNoYWRvd1Jvb3Q7XG4gKiBcdFx0cHJvcHM6IFByb3BzO1xuICogXHRcdGV2ZW50cz86IFJlY29yZDxzdHJpbmcsIChlOiBhbnkpID0+IGFueT47XG4gKiAgXHRjb250ZXh0PzogTWFwPGFueSwgYW55PjtcbiAqIFx0XHRpbnRybz86IGJvb2xlYW47XG4gKiBcdFx0cmVjb3Zlcj86IGJvb2xlYW47XG4gKlx0XHR0cmFuc2Zvcm1FcnJvcj86IChlcnJvcjogdW5rbm93bikgPT4gdW5rbm93bjtcbiAqIFx0fX0gb3B0aW9uc1xuICogQHJldHVybnMge0V4cG9ydHN9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoeWRyYXRlKGNvbXBvbmVudCwgb3B0aW9ucykge1xuXHRpbml0X29wZXJhdGlvbnMoKTtcblx0b3B0aW9ucy5pbnRybyA9IG9wdGlvbnMuaW50cm8gPz8gZmFsc2U7XG5cdGNvbnN0IHRhcmdldCA9IG9wdGlvbnMudGFyZ2V0O1xuXHRjb25zdCB3YXNfaHlkcmF0aW5nID0gaHlkcmF0aW5nO1xuXHRjb25zdCBwcmV2aW91c19oeWRyYXRlX25vZGUgPSBoeWRyYXRlX25vZGU7XG5cblx0dHJ5IHtcblx0XHR2YXIgYW5jaG9yID0gZ2V0X2ZpcnN0X2NoaWxkKHRhcmdldCk7XG5cblx0XHR3aGlsZSAoXG5cdFx0XHRhbmNob3IgJiZcblx0XHRcdChhbmNob3Iubm9kZVR5cGUgIT09IENPTU1FTlRfTk9ERSB8fCAvKiogQHR5cGUge0NvbW1lbnR9ICovIChhbmNob3IpLmRhdGEgIT09IEhZRFJBVElPTl9TVEFSVClcblx0XHQpIHtcblx0XHRcdGFuY2hvciA9IGdldF9uZXh0X3NpYmxpbmcoYW5jaG9yKTtcblx0XHR9XG5cblx0XHRpZiAoIWFuY2hvcikge1xuXHRcdFx0dGhyb3cgSFlEUkFUSU9OX0VSUk9SO1xuXHRcdH1cblxuXHRcdHNldF9oeWRyYXRpbmcodHJ1ZSk7XG5cdFx0c2V0X2h5ZHJhdGVfbm9kZSgvKiogQHR5cGUge0NvbW1lbnR9ICovIChhbmNob3IpKTtcblxuXHRcdGNvbnN0IGluc3RhbmNlID0gX21vdW50KGNvbXBvbmVudCwgeyAuLi5vcHRpb25zLCBhbmNob3IgfSk7XG5cblx0XHRzZXRfaHlkcmF0aW5nKGZhbHNlKTtcblxuXHRcdHJldHVybiAvKiogIEB0eXBlIHtFeHBvcnRzfSAqLyAoaW5zdGFuY2UpO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIHJlLXRocm93IFN2ZWx0ZSBlcnJvcnMgLSB0aGV5IGFyZSBjZXJ0YWlubHkgbm90IHJlbGF0ZWQgdG8gaHlkcmF0aW9uXG5cdFx0aWYgKFxuXHRcdFx0ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJlxuXHRcdFx0ZXJyb3IubWVzc2FnZS5zcGxpdCgnXFxuJykuc29tZSgobGluZSkgPT4gbGluZS5zdGFydHNXaXRoKCdodHRwczovL3N2ZWx0ZS5kZXYvZS8nKSlcblx0XHQpIHtcblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblx0XHRpZiAoZXJyb3IgIT09IEhZRFJBVElPTl9FUlJPUikge1xuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblx0XHRcdGNvbnNvbGUud2FybignRmFpbGVkIHRvIGh5ZHJhdGU6ICcsIGVycm9yKTtcblx0XHR9XG5cblx0XHRpZiAob3B0aW9ucy5yZWNvdmVyID09PSBmYWxzZSkge1xuXHRcdFx0ZS5oeWRyYXRpb25fZmFpbGVkKCk7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgYW4gZXJyb3Igb2NjdXJyZWQgYWJvdmUsIHRoZSBvcGVyYXRpb25zIG1pZ2h0IG5vdCB5ZXQgaGF2ZSBiZWVuIGluaXRpYWxpc2VkLlxuXHRcdGluaXRfb3BlcmF0aW9ucygpO1xuXHRcdGNsZWFyX3RleHRfY29udGVudCh0YXJnZXQpO1xuXG5cdFx0c2V0X2h5ZHJhdGluZyhmYWxzZSk7XG5cdFx0cmV0dXJuIG1vdW50KGNvbXBvbmVudCwgb3B0aW9ucyk7XG5cdH0gZmluYWxseSB7XG5cdFx0c2V0X2h5ZHJhdGluZyh3YXNfaHlkcmF0aW5nKTtcblx0XHRzZXRfaHlkcmF0ZV9ub2RlKHByZXZpb3VzX2h5ZHJhdGVfbm9kZSk7XG5cdH1cbn1cblxuLyoqIEB0eXBlIHtNYXA8RXZlbnRUYXJnZXQsIE1hcDxzdHJpbmcsIG51bWJlcj4+fSAqL1xuY29uc3QgbGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gRXhwb3J0c1xuICogQHBhcmFtIHtDb21wb25lbnRUeXBlPFN2ZWx0ZUNvbXBvbmVudDxhbnk+PiB8IENvbXBvbmVudDxhbnk+fSBDb21wb25lbnRcbiAqIEBwYXJhbSB7TW91bnRPcHRpb25zfSBvcHRpb25zXG4gKiBAcmV0dXJucyB7RXhwb3J0c31cbiAqL1xuZnVuY3Rpb24gX21vdW50KFxuXHRDb21wb25lbnQsXG5cdHsgdGFyZ2V0LCBhbmNob3IsIHByb3BzID0ge30sIGV2ZW50cywgY29udGV4dCwgaW50cm8gPSB0cnVlLCB0cmFuc2Zvcm1FcnJvciB9XG4pIHtcblx0aW5pdF9vcGVyYXRpb25zKCk7XG5cblx0LyoqIEB0eXBlIHtFeHBvcnRzfSAqL1xuXHQvLyBAdHMtZXhwZWN0LWVycm9yIHdpbGwgYmUgZGVmaW5lZCBiZWNhdXNlIHRoZSByZW5kZXIgZWZmZWN0IHJ1bnMgc3luY2hyb25vdXNseVxuXHR2YXIgY29tcG9uZW50ID0gdW5kZWZpbmVkO1xuXG5cdHZhciB1bm1vdW50ID0gY29tcG9uZW50X3Jvb3QoKCkgPT4ge1xuXHRcdHZhciBhbmNob3Jfbm9kZSA9IGFuY2hvciA/PyB0YXJnZXQuYXBwZW5kQ2hpbGQoY3JlYXRlX3RleHQoKSk7XG5cblx0XHRib3VuZGFyeShcblx0XHRcdC8qKiBAdHlwZSB7VGVtcGxhdGVOb2RlfSAqLyAoYW5jaG9yX25vZGUpLFxuXHRcdFx0e1xuXHRcdFx0XHRwZW5kaW5nOiAoKSA9PiB7fVxuXHRcdFx0fSxcblx0XHRcdChhbmNob3Jfbm9kZSkgPT4ge1xuXHRcdFx0XHRwdXNoKHt9KTtcblx0XHRcdFx0dmFyIGN0eCA9IC8qKiBAdHlwZSB7Q29tcG9uZW50Q29udGV4dH0gKi8gKGNvbXBvbmVudF9jb250ZXh0KTtcblx0XHRcdFx0aWYgKGNvbnRleHQpIGN0eC5jID0gY29udGV4dDtcblxuXHRcdFx0XHRpZiAoZXZlbnRzKSB7XG5cdFx0XHRcdFx0Ly8gV2UgY2FuJ3Qgc3ByZWFkIHRoZSBvYmplY3Qgb3IgZWxzZSB3ZSdkIGxvc2UgdGhlIHN0YXRlIHByb3h5IHN0dWZmLCBpZiBpdCBpcyBvbmVcblx0XHRcdFx0XHQvKiogQHR5cGUge2FueX0gKi8gKHByb3BzKS4kJGV2ZW50cyA9IGV2ZW50cztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChoeWRyYXRpbmcpIHtcblx0XHRcdFx0XHRhc3NpZ25fbm9kZXMoLyoqIEB0eXBlIHtUZW1wbGF0ZU5vZGV9ICovIChhbmNob3Jfbm9kZSksIG51bGwpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c2hvdWxkX2ludHJvID0gaW50cm87XG5cdFx0XHRcdC8vIEB0cy1leHBlY3QtZXJyb3IgdGhlIHB1YmxpYyB0eXBpbmdzIGFyZSBub3Qgd2hhdCB0aGUgYWN0dWFsIGZ1bmN0aW9uIGxvb2tzIGxpa2Vcblx0XHRcdFx0Y29tcG9uZW50ID0gQ29tcG9uZW50KGFuY2hvcl9ub2RlLCBwcm9wcykgfHwgbWFya19hc19jb21wb25lbnQoKTtcblx0XHRcdFx0c2hvdWxkX2ludHJvID0gdHJ1ZTtcblxuXHRcdFx0XHRpZiAoaHlkcmF0aW5nKSB7XG5cdFx0XHRcdFx0LyoqIEB0eXBlIHtFZmZlY3QgJiB7IG5vZGVzOiBFZmZlY3ROb2RlcyB9fSAqLyAoYWN0aXZlX2VmZmVjdCkubm9kZXMuZW5kID0gaHlkcmF0ZV9ub2RlO1xuXG5cdFx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdFx0aHlkcmF0ZV9ub2RlID09PSBudWxsIHx8XG5cdFx0XHRcdFx0XHRoeWRyYXRlX25vZGUubm9kZVR5cGUgIT09IENPTU1FTlRfTk9ERSB8fFxuXHRcdFx0XHRcdFx0LyoqIEB0eXBlIHtDb21tZW50fSAqLyAoaHlkcmF0ZV9ub2RlKS5kYXRhICE9PSBIWURSQVRJT05fRU5EXG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHR3Lmh5ZHJhdGlvbl9taXNtYXRjaCgpO1xuXHRcdFx0XHRcdFx0dGhyb3cgSFlEUkFUSU9OX0VSUk9SO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBvcCgpO1xuXHRcdFx0fSxcblx0XHRcdHRyYW5zZm9ybUVycm9yXG5cdFx0KTtcblxuXHRcdC8vIFNldHVwIGV2ZW50IGRlbGVnYXRpb24gX2FmdGVyXyBjb21wb25lbnQgaXMgbW91bnRlZCAtIGlmIGFuIGVycm9yIHdvdWxkIGhhcHBlbiBkdXJpbmcgbW91bnQsIGl0IHdvdWxkIG90aGVyd2lzZSBub3QgYmUgY2xlYW5lZCB1cFxuXHRcdC8qKiBAdHlwZSB7U2V0PHN0cmluZz59ICovXG5cdFx0dmFyIHJlZ2lzdGVyZWRfZXZlbnRzID0gbmV3IFNldCgpO1xuXG5cdFx0LyoqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gZXZlbnRzICovXG5cdFx0dmFyIGV2ZW50X2hhbmRsZSA9IChldmVudHMpID0+IHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBldmVudF9uYW1lID0gZXZlbnRzW2ldO1xuXG5cdFx0XHRcdGlmIChyZWdpc3RlcmVkX2V2ZW50cy5oYXMoZXZlbnRfbmFtZSkpIGNvbnRpbnVlO1xuXHRcdFx0XHRyZWdpc3RlcmVkX2V2ZW50cy5hZGQoZXZlbnRfbmFtZSk7XG5cblx0XHRcdFx0dmFyIHBhc3NpdmUgPSBpc19wYXNzaXZlX2V2ZW50KGV2ZW50X25hbWUpO1xuXG5cdFx0XHRcdC8vIEFkZCB0aGUgZXZlbnQgbGlzdGVuZXIgdG8gYm90aCB0aGUgY29udGFpbmVyIGFuZCB0aGUgZG9jdW1lbnQuXG5cdFx0XHRcdC8vIFRoZSBjb250YWluZXIgbGlzdGVuZXIgZW5zdXJlcyB3ZSBjYXRjaCBldmVudHMgZnJvbSB3aXRoaW4gaW4gY2FzZVxuXHRcdFx0XHQvLyB0aGUgb3V0ZXIgY29udGVudCBzdG9wcyBwcm9wYWdhdGlvbiBvZiB0aGUgZXZlbnQuXG5cdFx0XHRcdC8vXG5cdFx0XHRcdC8vIFRoZSBkb2N1bWVudCBsaXN0ZW5lciBlbnN1cmVzIHdlIGNhdGNoIGV2ZW50cyB0aGF0IG9yaWdpbmF0ZSBmcm9tIGVsZW1lbnRzIHRoYXQgd2VyZVxuXHRcdFx0XHQvLyBtYW51YWxseSBtb3ZlZCBvdXRzaWRlIG9mIHRoZSBjb250YWluZXIgKGUuZy4gdmlhIG1hbnVhbCBwb3J0YWxzKS5cblx0XHRcdFx0Zm9yIChjb25zdCBub2RlIG9mIFt0YXJnZXQsIGRvY3VtZW50XSkge1xuXHRcdFx0XHRcdHZhciBjb3VudHMgPSBsaXN0ZW5lcnMuZ2V0KG5vZGUpO1xuXG5cdFx0XHRcdFx0aWYgKGNvdW50cyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRjb3VudHMgPSBuZXcgTWFwKCk7XG5cdFx0XHRcdFx0XHRsaXN0ZW5lcnMuc2V0KG5vZGUsIGNvdW50cyk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dmFyIGNvdW50ID0gY291bnRzLmdldChldmVudF9uYW1lKTtcblxuXHRcdFx0XHRcdGlmIChjb3VudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRfbmFtZSwgaGFuZGxlX2V2ZW50X3Byb3BhZ2F0aW9uLCB7IHBhc3NpdmUgfSk7XG5cdFx0XHRcdFx0XHRjb3VudHMuc2V0KGV2ZW50X25hbWUsIDEpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjb3VudHMuc2V0KGV2ZW50X25hbWUsIGNvdW50ICsgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGV2ZW50X2hhbmRsZShhcnJheV9mcm9tKGFsbF9yZWdpc3RlcmVkX2V2ZW50cykpO1xuXHRcdHJvb3RfZXZlbnRfaGFuZGxlcy5hZGQoZXZlbnRfaGFuZGxlKTtcblxuXHRcdHJldHVybiAoKSA9PiB7XG5cdFx0XHRmb3IgKHZhciBldmVudF9uYW1lIG9mIHJlZ2lzdGVyZWRfZXZlbnRzKSB7XG5cdFx0XHRcdGZvciAoY29uc3Qgbm9kZSBvZiBbdGFyZ2V0LCBkb2N1bWVudF0pIHtcblx0XHRcdFx0XHR2YXIgY291bnRzID0gLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBudW1iZXI+fSAqLyAobGlzdGVuZXJzLmdldChub2RlKSk7XG5cdFx0XHRcdFx0dmFyIGNvdW50ID0gLyoqIEB0eXBlIHtudW1iZXJ9ICovIChjb3VudHMuZ2V0KGV2ZW50X25hbWUpKTtcblxuXHRcdFx0XHRcdGlmICgtLWNvdW50ID09IDApIHtcblx0XHRcdFx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBoYW5kbGVfZXZlbnRfcHJvcGFnYXRpb24pO1xuXHRcdFx0XHRcdFx0Y291bnRzLmRlbGV0ZShldmVudF9uYW1lKTtcblxuXHRcdFx0XHRcdFx0aWYgKGNvdW50cy5zaXplID09PSAwKSB7XG5cdFx0XHRcdFx0XHRcdGxpc3RlbmVycy5kZWxldGUobm9kZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNvdW50cy5zZXQoZXZlbnRfbmFtZSwgY291bnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyb290X2V2ZW50X2hhbmRsZXMuZGVsZXRlKGV2ZW50X2hhbmRsZSk7XG5cblx0XHRcdGlmIChhbmNob3Jfbm9kZSAhPT0gYW5jaG9yKSB7XG5cdFx0XHRcdGFuY2hvcl9ub2RlLnBhcmVudE5vZGU/LnJlbW92ZUNoaWxkKGFuY2hvcl9ub2RlKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9KTtcblxuXHRtb3VudGVkX2NvbXBvbmVudHMuc2V0KGNvbXBvbmVudCwgdW5tb3VudCk7XG5cdHJldHVybiBjb21wb25lbnQ7XG59XG5cbi8qKlxuICogUmVmZXJlbmNlcyBvZiB0aGUgY29tcG9uZW50cyB0aGF0IHdlcmUgbW91bnRlZCBvciBoeWRyYXRlZC5cbiAqIFVzZXMgYSBgV2Vha01hcGAgdG8gYXZvaWQgbWVtb3J5IGxlYWtzLlxuICovXG5sZXQgbW91bnRlZF9jb21wb25lbnRzID0gbmV3IFdlYWtNYXAoKTtcblxuLyoqXG4gKiBVbm1vdW50cyBhIGNvbXBvbmVudCB0aGF0IHdhcyBwcmV2aW91c2x5IG1vdW50ZWQgdXNpbmcgYG1vdW50YCBvciBgaHlkcmF0ZWAuXG4gKlxuICogU2luY2UgNS4xMy4wLCBpZiBgb3B0aW9ucy5vdXRyb2AgaXMgYHRydWVgLCBbdHJhbnNpdGlvbnNdKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL3N2ZWx0ZS90cmFuc2l0aW9uKSB3aWxsIHBsYXkgYmVmb3JlIHRoZSBjb21wb25lbnQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBET00uXG4gKlxuICogUmV0dXJucyBhIGBQcm9taXNlYCB0aGF0IHJlc29sdmVzIGFmdGVyIHRyYW5zaXRpb25zIGhhdmUgY29tcGxldGVkIGlmIGBvcHRpb25zLm91dHJvYCBpcyB0cnVlLCBvciBpbW1lZGlhdGVseSBvdGhlcndpc2UgKHByaW9yIHRvIDUuMTMuMCwgcmV0dXJucyBgdm9pZGApLlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgeyBtb3VudCwgdW5tb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG4gKiBpbXBvcnQgQXBwIGZyb20gJy4vQXBwLnN2ZWx0ZSc7XG4gKlxuICogY29uc3QgYXBwID0gbW91bnQoQXBwLCB7IHRhcmdldDogZG9jdW1lbnQuYm9keSB9KTtcbiAqXG4gKiAvLyBsYXRlci4uLlxuICogdW5tb3VudChhcHAsIHsgb3V0cm86IHRydWUgfSk7XG4gKiBgYGBcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gY29tcG9uZW50XG4gKiBAcGFyYW0ge3sgb3V0cm8/OiBib29sZWFuIH19IFtvcHRpb25zXVxuICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bm1vdW50KGNvbXBvbmVudCwgb3B0aW9ucykge1xuXHRjb25zdCBmbiA9IG1vdW50ZWRfY29tcG9uZW50cy5nZXQoY29tcG9uZW50KTtcblxuXHRpZiAoZm4pIHtcblx0XHRtb3VudGVkX2NvbXBvbmVudHMuZGVsZXRlKGNvbXBvbmVudCk7XG5cdFx0cmV0dXJuIGZuKG9wdGlvbnMpO1xuXHR9XG5cblx0aWYgKERFVikge1xuXHRcdHcubGlmZWN5Y2xlX2RvdWJsZV91bm1vdW50KCk7XG5cdH1cblxuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG59XG4iLCJpbXBvcnQgeyBub29wIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzLmpzJztcbmltcG9ydCB7IHVzZXJfcHJlX2VmZmVjdCB9IGZyb20gJy4uLy4uL3JlYWN0aXZpdHkvZWZmZWN0cy5qcyc7XG5pbXBvcnQgeyBvbiB9IGZyb20gJy4uL2VsZW1lbnRzL2V2ZW50cy5qcyc7XG5cbi8qKlxuICogU3Vic3RpdHV0ZSBmb3IgdGhlIGB0cnVzdGVkYCBldmVudCBtb2RpZmllclxuICogQGRlcHJlY2F0ZWRcbiAqIEBwYXJhbSB7KGV2ZW50OiBFdmVudCwgLi4uYXJnczogQXJyYXk8dW5rbm93bj4pID0+IHZvaWR9IGZuXG4gKiBAcmV0dXJucyB7KGV2ZW50OiBFdmVudCwgLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJ1c3RlZChmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcblx0XHR2YXIgZXZlbnQgPSAvKiogQHR5cGUge0V2ZW50fSAqLyAoYXJnc1swXSk7XG5cdFx0aWYgKGV2ZW50LmlzVHJ1c3RlZCkge1xuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0Zm4/LmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHRcdH1cblx0fTtcbn1cblxuLyoqXG4gKiBTdWJzdGl0dXRlIGZvciB0aGUgYHNlbGZgIGV2ZW50IG1vZGlmaWVyXG4gKiBAZGVwcmVjYXRlZFxuICogQHBhcmFtIHsoZXZlbnQ6IEV2ZW50LCAuLi5hcmdzOiBBcnJheTx1bmtub3duPikgPT4gdm9pZH0gZm5cbiAqIEByZXR1cm5zIHsoZXZlbnQ6IEV2ZW50LCAuLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZWxmKGZuKSB7XG5cdHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuXHRcdHZhciBldmVudCA9IC8qKiBAdHlwZSB7RXZlbnR9ICovIChhcmdzWzBdKTtcblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0aWYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcykge1xuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0Zm4/LmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHRcdH1cblx0fTtcbn1cblxuLyoqXG4gKiBTdWJzdGl0dXRlIGZvciB0aGUgYHN0b3BQcm9wYWdhdGlvbmAgZXZlbnQgbW9kaWZpZXJcbiAqIEBkZXByZWNhdGVkXG4gKiBAcGFyYW0geyhldmVudDogRXZlbnQsIC4uLmFyZ3M6IEFycmF5PHVua25vd24+KSA9PiB2b2lkfSBmblxuICogQHJldHVybnMgeyhldmVudDogRXZlbnQsIC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbihmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcblx0XHR2YXIgZXZlbnQgPSAvKiogQHR5cGUge0V2ZW50fSAqLyAoYXJnc1swXSk7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdHJldHVybiBmbj8uYXBwbHkodGhpcywgYXJncyk7XG5cdH07XG59XG5cbi8qKlxuICogU3Vic3RpdHV0ZSBmb3IgdGhlIGBvbmNlYCBldmVudCBtb2RpZmllclxuICogQGRlcHJlY2F0ZWRcbiAqIEBwYXJhbSB7KGV2ZW50OiBFdmVudCwgLi4uYXJnczogQXJyYXk8dW5rbm93bj4pID0+IHZvaWR9IGZuXG4gKiBAcmV0dXJucyB7KGV2ZW50OiBFdmVudCwgLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gb25jZShmbikge1xuXHR2YXIgcmFuID0gZmFsc2U7XG5cblx0cmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG5cdFx0aWYgKHJhbikgcmV0dXJuO1xuXHRcdHJhbiA9IHRydWU7XG5cblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0cmV0dXJuIGZuPy5hcHBseSh0aGlzLCBhcmdzKTtcblx0fTtcbn1cblxuLyoqXG4gKiBTdWJzdGl0dXRlIGZvciB0aGUgYHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbmAgZXZlbnQgbW9kaWZpZXJcbiAqIEBkZXByZWNhdGVkXG4gKiBAcGFyYW0geyhldmVudDogRXZlbnQsIC4uLmFyZ3M6IEFycmF5PHVua25vd24+KSA9PiB2b2lkfSBmblxuICogQHJldHVybnMgeyhldmVudDogRXZlbnQsIC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbihmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcblx0XHR2YXIgZXZlbnQgPSAvKiogQHR5cGUge0V2ZW50fSAqLyAoYXJnc1swXSk7XG5cdFx0ZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdHJldHVybiBmbj8uYXBwbHkodGhpcywgYXJncyk7XG5cdH07XG59XG5cbi8qKlxuICogU3Vic3RpdHV0ZSBmb3IgdGhlIGBwcmV2ZW50RGVmYXVsdGAgZXZlbnQgbW9kaWZpZXJcbiAqIEBkZXByZWNhdGVkXG4gKiBAcGFyYW0geyhldmVudDogRXZlbnQsIC4uLmFyZ3M6IEFycmF5PHVua25vd24+KSA9PiB2b2lkfSBmblxuICogQHJldHVybnMgeyhldmVudDogRXZlbnQsIC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByZXZlbnREZWZhdWx0KGZuKSB7XG5cdHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuXHRcdHZhciBldmVudCA9IC8qKiBAdHlwZSB7RXZlbnR9ICovIChhcmdzWzBdKTtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRyZXR1cm4gZm4/LmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHR9O1xufVxuXG4vKipcbiAqIFN1YnN0aXR1dGUgZm9yIHRoZSBgcGFzc2l2ZWAgZXZlbnQgbW9kaWZpZXIsIGltcGxlbWVudGVkIGFzIGFuIGFjdGlvblxuICogQGRlcHJlY2F0ZWRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5vZGVcbiAqIEBwYXJhbSB7W2V2ZW50OiBzdHJpbmcsIGhhbmRsZXI6ICgpID0+IEV2ZW50TGlzdGVuZXJdfSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXNzaXZlKG5vZGUsIFtldmVudCwgaGFuZGxlcl0pIHtcblx0dXNlcl9wcmVfZWZmZWN0KCgpID0+IHtcblx0XHRyZXR1cm4gb24obm9kZSwgZXZlbnQsIGhhbmRsZXIoKSA/PyBub29wLCB7XG5cdFx0XHRwYXNzaXZlOiB0cnVlXG5cdFx0fSk7XG5cdH0pO1xufVxuXG4vKipcbiAqIFN1YnN0aXR1dGUgZm9yIHRoZSBgbm9ucGFzc2l2ZWAgZXZlbnQgbW9kaWZpZXIsIGltcGxlbWVudGVkIGFzIGFuIGFjdGlvblxuICogQGRlcHJlY2F0ZWRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5vZGVcbiAqIEBwYXJhbSB7W2V2ZW50OiBzdHJpbmcsIGhhbmRsZXI6ICgpID0+IEV2ZW50TGlzdGVuZXJdfSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub25wYXNzaXZlKG5vZGUsIFtldmVudCwgaGFuZGxlcl0pIHtcblx0dXNlcl9wcmVfZWZmZWN0KCgpID0+IHtcblx0XHRyZXR1cm4gb24obm9kZSwgZXZlbnQsIGhhbmRsZXIoKSA/PyBub29wLCB7XG5cdFx0XHRwYXNzaXZlOiBmYWxzZVxuXHRcdH0pO1xuXHR9KTtcbn1cbiIsIi8qKiBAaW1wb3J0IHsgQ29tcG9uZW50Q29uc3RydWN0b3JPcHRpb25zLCBDb21wb25lbnRUeXBlLCBTdmVsdGVDb21wb25lbnQsIENvbXBvbmVudCB9IGZyb20gJ3N2ZWx0ZScgKi9cbmltcG9ydCB7IERJUlRZLCBMRUdBQ1lfUFJPUFMsIE1BWUJFX0RJUlRZIH0gZnJvbSAnLi4vaW50ZXJuYWwvY2xpZW50L2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyB1c2VyX3ByZV9lZmZlY3QgfSBmcm9tICcuLi9pbnRlcm5hbC9jbGllbnQvcmVhY3Rpdml0eS9lZmZlY3RzLmpzJztcbmltcG9ydCB7IG11dGFibGVfc291cmNlLCBzZXQgfSBmcm9tICcuLi9pbnRlcm5hbC9jbGllbnQvcmVhY3Rpdml0eS9zb3VyY2VzLmpzJztcbmltcG9ydCB7IGh5ZHJhdGUsIG1vdW50LCB1bm1vdW50IH0gZnJvbSAnLi4vaW50ZXJuYWwvY2xpZW50L3JlbmRlci5qcyc7XG5pbXBvcnQgeyBhY3RpdmVfZWZmZWN0LCBnZXQgfSBmcm9tICcuLi9pbnRlcm5hbC9jbGllbnQvcnVudGltZS5qcyc7XG5pbXBvcnQgeyBmbHVzaFN5bmMgfSBmcm9tICcuLi9pbnRlcm5hbC9jbGllbnQvcmVhY3Rpdml0eS9iYXRjaC5qcyc7XG5pbXBvcnQgeyBkZWZpbmVfcHJvcGVydHksIGlzX2FycmF5IH0gZnJvbSAnLi4vaW50ZXJuYWwvc2hhcmVkL3V0aWxzLmpzJztcbmltcG9ydCAqIGFzIGUgZnJvbSAnLi4vaW50ZXJuYWwvY2xpZW50L2Vycm9ycy5qcyc7XG5pbXBvcnQgKiBhcyB3IGZyb20gJy4uL2ludGVybmFsL2NsaWVudC93YXJuaW5ncy5qcyc7XG5pbXBvcnQgeyBERVYgfSBmcm9tICdlc20tZW52JztcbmltcG9ydCB7IEZJTEVOQU1FIH0gZnJvbSAnLi4vY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IGNvbXBvbmVudF9jb250ZXh0LCBkZXZfY3VycmVudF9jb21wb25lbnRfZnVuY3Rpb24gfSBmcm9tICcuLi9pbnRlcm5hbC9jbGllbnQvY29udGV4dC5qcyc7XG5pbXBvcnQgeyBhc3luY19tb2RlX2ZsYWcgfSBmcm9tICcuLi9pbnRlcm5hbC9mbGFncy9pbmRleC5qcyc7XG5pbXBvcnQgeyBzZXRfc2lnbmFsX3N0YXR1cyB9IGZyb20gJy4uL2ludGVybmFsL2NsaWVudC9yZWFjdGl2aXR5L3N0YXR1cy5qcyc7XG5cbi8qKlxuICogVGFrZXMgdGhlIHNhbWUgb3B0aW9ucyBhcyBhIFN2ZWx0ZSA0IGNvbXBvbmVudCBhbmQgdGhlIGNvbXBvbmVudCBmdW5jdGlvbiBhbmQgcmV0dXJucyBhIFN2ZWx0ZSA0IGNvbXBhdGlibGUgY29tcG9uZW50LlxuICpcbiAqIEBkZXByZWNhdGVkIFVzZSB0aGlzIG9ubHkgYXMgYSB0ZW1wb3Jhcnkgc29sdXRpb24gdG8gbWlncmF0ZSB5b3VyIGltcGVyYXRpdmUgY29tcG9uZW50IGNvZGUgdG8gU3ZlbHRlIDUuXG4gKlxuICogQHRlbXBsYXRlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBQcm9wc1xuICogQHRlbXBsYXRlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBFeHBvcnRzXG4gKiBAdGVtcGxhdGUge1JlY29yZDxzdHJpbmcsIGFueT59IEV2ZW50c1xuICogQHRlbXBsYXRlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBTbG90c1xuICpcbiAqIEBwYXJhbSB7Q29tcG9uZW50Q29uc3RydWN0b3JPcHRpb25zPFByb3BzPiAmIHtcbiAqIFx0Y29tcG9uZW50OiBDb21wb25lbnRUeXBlPFN2ZWx0ZUNvbXBvbmVudDxQcm9wcywgRXZlbnRzLCBTbG90cz4+IHwgQ29tcG9uZW50PFByb3BzPjtcbiAqIH19IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtTdmVsdGVDb21wb25lbnQ8UHJvcHMsIEV2ZW50cywgU2xvdHM+ICYgRXhwb3J0c31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNsYXNzQ29tcG9uZW50KG9wdGlvbnMpIHtcblx0Ly8gQHRzLWV4cGVjdC1lcnJvciAkJHByb3BfZGVmIGV0YyBhcmUgbm90IGFjdHVhbGx5IGRlZmluZWRcblx0cmV0dXJuIG5ldyBTdmVsdGU0Q29tcG9uZW50KG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIFRha2VzIHRoZSBjb21wb25lbnQgZnVuY3Rpb24gYW5kIHJldHVybnMgYSBTdmVsdGUgNCBjb21wYXRpYmxlIGNvbXBvbmVudCBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBAZGVwcmVjYXRlZCBVc2UgdGhpcyBvbmx5IGFzIGEgdGVtcG9yYXJ5IHNvbHV0aW9uIHRvIG1pZ3JhdGUgeW91ciBpbXBlcmF0aXZlIGNvbXBvbmVudCBjb2RlIHRvIFN2ZWx0ZSA1LlxuICpcbiAqIEB0ZW1wbGF0ZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gUHJvcHNcbiAqIEB0ZW1wbGF0ZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gRXhwb3J0c1xuICogQHRlbXBsYXRlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBFdmVudHNcbiAqIEB0ZW1wbGF0ZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gU2xvdHNcbiAqXG4gKiBAcGFyYW0ge1N2ZWx0ZUNvbXBvbmVudDxQcm9wcywgRXZlbnRzLCBTbG90cz4gfCBDb21wb25lbnQ8UHJvcHM+fSBjb21wb25lbnRcbiAqIEByZXR1cm5zIHtDb21wb25lbnRUeXBlPFN2ZWx0ZUNvbXBvbmVudDxQcm9wcywgRXZlbnRzLCBTbG90cz4gJiBFeHBvcnRzPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzQ2xhc3NDb21wb25lbnQoY29tcG9uZW50KSB7XG5cdC8vIEB0cy1leHBlY3QtZXJyb3IgJCRwcm9wX2RlZiBldGMgYXJlIG5vdCBhY3R1YWxseSBkZWZpbmVkXG5cdHJldHVybiBjbGFzcyBleHRlbmRzIFN2ZWx0ZTRDb21wb25lbnQge1xuXHRcdC8qKiBAcGFyYW0ge2FueX0gb3B0aW9ucyAqL1xuXHRcdGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcblx0XHRcdHN1cGVyKHtcblx0XHRcdFx0Y29tcG9uZW50LFxuXHRcdFx0XHQuLi5vcHRpb25zXG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59XG5cbi8qKlxuICogU3VwcG9ydCB1c2luZyB0aGUgY29tcG9uZW50IGFzIGJvdGggYSBjbGFzcyBhbmQgZnVuY3Rpb24gZHVyaW5nIHRoZSB0cmFuc2l0aW9uIHBlcmlvZFxuICogQHR5cGVkZWYgIHt7bmV3IChvOiBDb21wb25lbnRDb25zdHJ1Y3Rvck9wdGlvbnMpOiBTdmVsdGVDb21wb25lbnQ7KC4uLmFyZ3M6IFBhcmFtZXRlcnM8Q29tcG9uZW50PFJlY29yZDxzdHJpbmcsIGFueT4+Pik6IFJldHVyblR5cGU8Q29tcG9uZW50PFJlY29yZDxzdHJpbmcsIGFueT4sIFJlY29yZDxzdHJpbmcsIGFueT4+Pjt9fSBMZWdhY3lDb21wb25lbnRUeXBlXG4gKi9cblxuY2xhc3MgU3ZlbHRlNENvbXBvbmVudCB7XG5cdC8qKiBAdHlwZSB7YW55fSAqL1xuXHQjZXZlbnRzO1xuXG5cdC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gKi9cblx0I2luc3RhbmNlO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0NvbXBvbmVudENvbnN0cnVjdG9yT3B0aW9ucyAmIHtcblx0ICogIGNvbXBvbmVudDogYW55O1xuXHQgKiB9fSBvcHRpb25zXG5cdCAqL1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0dmFyIHNvdXJjZXMgPSBuZXcgTWFwKCk7XG5cblx0XHQvKipcblx0XHQgKiBAcGFyYW0ge3N0cmluZyB8IHN5bWJvbH0ga2V5XG5cdFx0ICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuXHRcdCAqL1xuXHRcdHZhciBhZGRfc291cmNlID0gKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdHZhciBzID0gbXV0YWJsZV9zb3VyY2UodmFsdWUsIGZhbHNlLCBmYWxzZSk7XG5cdFx0XHRzb3VyY2VzLnNldChrZXksIHMpO1xuXHRcdFx0cmV0dXJuIHM7XG5cdFx0fTtcblxuXHRcdC8vIFJlcGxpY2F0ZSBjb2Fyc2UtZ3JhaW5lZCBwcm9wcyB0aHJvdWdoIGEgcHJveHkgdGhhdCBoYXMgYSB2ZXJzaW9uIHNvdXJjZSBmb3Jcblx0XHQvLyBlYWNoIHByb3BlcnR5LCB3aGljaCBpcyBpbmNyZW1lbnRlZCBvbiB1cGRhdGVzIHRvIHRoZSBwcm9wZXJ0eSBpdHNlbGYuIERvIG5vdFxuXHRcdC8vIHVzZSBvdXIgJHN0YXRlIHByb3h5IGJlY2F1c2UgdGhhdCBvbmUgaGFzIGZpbmUtZ3JhaW5lZCByZWFjdGl2aXR5LlxuXHRcdGNvbnN0IHByb3BzID0gbmV3IFByb3h5KFxuXHRcdFx0eyAuLi4ob3B0aW9ucy5wcm9wcyB8fCB7fSksICQkZXZlbnRzOiB7fSB9LFxuXHRcdFx0e1xuXHRcdFx0XHRnZXQodGFyZ2V0LCBwcm9wKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGdldChzb3VyY2VzLmdldChwcm9wKSA/PyBhZGRfc291cmNlKHByb3AsIFJlZmxlY3QuZ2V0KHRhcmdldCwgcHJvcCkpKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0aGFzKHRhcmdldCwgcHJvcCkge1xuXHRcdFx0XHRcdC8vIE5lY2Vzc2FyeSB0byBub3QgdGhyb3cgXCJpbnZhbGlkIGJpbmRpbmdcIiB2YWxpZGF0aW9uIGVycm9ycyBvbiB0aGUgY29tcG9uZW50IHNpZGVcblx0XHRcdFx0XHRpZiAocHJvcCA9PT0gTEVHQUNZX1BST1BTKSByZXR1cm4gdHJ1ZTtcblxuXHRcdFx0XHRcdGdldChzb3VyY2VzLmdldChwcm9wKSA/PyBhZGRfc291cmNlKHByb3AsIFJlZmxlY3QuZ2V0KHRhcmdldCwgcHJvcCkpKTtcblx0XHRcdFx0XHRyZXR1cm4gUmVmbGVjdC5oYXModGFyZ2V0LCBwcm9wKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0c2V0KHRhcmdldCwgcHJvcCwgdmFsdWUpIHtcblx0XHRcdFx0XHRzZXQoc291cmNlcy5nZXQocHJvcCkgPz8gYWRkX3NvdXJjZShwcm9wLCB2YWx1ZSksIHZhbHVlKTtcblx0XHRcdFx0XHRyZXR1cm4gUmVmbGVjdC5zZXQodGFyZ2V0LCBwcm9wLCB2YWx1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHQpO1xuXG5cdFx0dGhpcy4jaW5zdGFuY2UgPSAob3B0aW9ucy5oeWRyYXRlID8gaHlkcmF0ZSA6IG1vdW50KShvcHRpb25zLmNvbXBvbmVudCwge1xuXHRcdFx0dGFyZ2V0OiBvcHRpb25zLnRhcmdldCxcblx0XHRcdGFuY2hvcjogb3B0aW9ucy5hbmNob3IsXG5cdFx0XHRwcm9wcyxcblx0XHRcdGNvbnRleHQ6IG9wdGlvbnMuY29udGV4dCxcblx0XHRcdGludHJvOiBvcHRpb25zLmludHJvID8/IGZhbHNlLFxuXHRcdFx0cmVjb3Zlcjogb3B0aW9ucy5yZWNvdmVyLFxuXHRcdFx0dHJhbnNmb3JtRXJyb3I6IG9wdGlvbnMudHJhbnNmb3JtRXJyb3Jcblx0XHR9KTtcblxuXHRcdC8vIFdlIGRvbid0IGZsdXNoU3luYyBmb3IgY3VzdG9tIGVsZW1lbnQgd3JhcHBlcnMgb3IgaWYgdGhlIHVzZXIgZG9lc24ndCB3YW50IGl0LFxuXHRcdC8vIG9yIGlmIHdlJ3JlIGluIGFzeW5jIG1vZGUgc2luY2UgYGZsdXNoU3luYygpYCB3aWxsIGZhaWxcblx0XHRpZiAoIWFzeW5jX21vZGVfZmxhZyAmJiAoIW9wdGlvbnM/LnByb3BzPy4kJGhvc3QgfHwgb3B0aW9ucy5zeW5jID09PSBmYWxzZSkpIHtcblx0XHRcdGZsdXNoU3luYygpO1xuXHRcdH1cblxuXHRcdHRoaXMuI2V2ZW50cyA9IHByb3BzLiQkZXZlbnRzO1xuXG5cdFx0Zm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXModGhpcy4jaW5zdGFuY2UpKSB7XG5cdFx0XHRpZiAoa2V5ID09PSAnJHNldCcgfHwga2V5ID09PSAnJGRlc3Ryb3knIHx8IGtleSA9PT0gJyRvbicpIGNvbnRpbnVlO1xuXHRcdFx0ZGVmaW5lX3Byb3BlcnR5KHRoaXMsIGtleSwge1xuXHRcdFx0XHRnZXQoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuI2luc3RhbmNlW2tleV07XG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8qKiBAcGFyYW0ge2FueX0gdmFsdWUgKi9cblx0XHRcdFx0c2V0KHZhbHVlKSB7XG5cdFx0XHRcdFx0dGhpcy4jaW5zdGFuY2Vba2V5XSA9IHZhbHVlO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHR0aGlzLiNpbnN0YW5jZS4kc2V0ID0gLyoqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gbmV4dCAqLyAobmV4dCkgPT4ge1xuXHRcdFx0T2JqZWN0LmFzc2lnbihwcm9wcywgbmV4dCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuI2luc3RhbmNlLiRkZXN0cm95ID0gKCkgPT4ge1xuXHRcdFx0dW5tb3VudCh0aGlzLiNpbnN0YW5jZSk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHByb3BzICovXG5cdCRzZXQocHJvcHMpIHtcblx0XHR0aGlzLiNpbnN0YW5jZS4kc2V0KHByb3BzKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRcblx0ICogQHBhcmFtIHsoLi4uYXJnczogYW55W10pID0+IGFueX0gY2FsbGJhY2tcblx0ICogQHJldHVybnMge2FueX1cblx0ICovXG5cdCRvbihldmVudCwgY2FsbGJhY2spIHtcblx0XHR0aGlzLiNldmVudHNbZXZlbnRdID0gdGhpcy4jZXZlbnRzW2V2ZW50XSB8fCBbXTtcblxuXHRcdC8qKiBAcGFyYW0ge2FueVtdfSBhcmdzICovXG5cdFx0Y29uc3QgY2IgPSAoLi4uYXJncykgPT4gY2FsbGJhY2suY2FsbCh0aGlzLCAuLi5hcmdzKTtcblx0XHR0aGlzLiNldmVudHNbZXZlbnRdLnB1c2goY2IpO1xuXHRcdHJldHVybiAoKSA9PiB7XG5cdFx0XHR0aGlzLiNldmVudHNbZXZlbnRdID0gdGhpcy4jZXZlbnRzW2V2ZW50XS5maWx0ZXIoLyoqIEBwYXJhbSB7YW55fSBmbiAqLyAoZm4pID0+IGZuICE9PSBjYik7XG5cdFx0fTtcblx0fVxuXG5cdCRkZXN0cm95KCkge1xuXHRcdHRoaXMuI2luc3RhbmNlLiRkZXN0cm95KCk7XG5cdH1cbn1cblxuLyoqXG4gKiBSdW5zIHRoZSBnaXZlbiBmdW5jdGlvbiBvbmNlIGltbWVkaWF0ZWx5IG9uIHRoZSBzZXJ2ZXIsIGFuZCB3b3JrcyBsaWtlIGAkZWZmZWN0LnByZWAgb24gdGhlIGNsaWVudC5cbiAqXG4gKiBAZGVwcmVjYXRlZCBVc2UgdGhpcyBvbmx5IGFzIGEgdGVtcG9yYXJ5IHNvbHV0aW9uIHRvIG1pZ3JhdGUgeW91ciBjb21wb25lbnQgY29kZSB0byBTdmVsdGUgNS5cbiAqIEBwYXJhbSB7KCkgPT4gdm9pZCB8ICgoKSA9PiB2b2lkKX0gZm5cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcnVuKGZuKSB7XG5cdHVzZXJfcHJlX2VmZmVjdCgoKSA9PiB7XG5cdFx0Zm4oKTtcblx0XHR2YXIgZWZmZWN0ID0gLyoqIEB0eXBlIHtpbXBvcnQoJyNjbGllbnQnKS5FZmZlY3R9ICovIChhY3RpdmVfZWZmZWN0KTtcblx0XHQvLyBJZiB0aGUgZWZmZWN0IGlzIGltbWVkaWF0ZWx5IG1hZGUgZGlydHkgYWdhaW4sIG1hcmsgaXQgYXMgbWF5YmUgZGlydHkgdG8gZW11bGF0ZSBsZWdhY3kgYmVoYXZpb3VyXG5cdFx0aWYgKChlZmZlY3QuZiAmIERJUlRZKSAhPT0gMCkge1xuXHRcdFx0bGV0IGZpbGVuYW1lID0gXCJhIGZpbGUgKHdlIGNhbid0IGtub3cgd2hpY2ggb25lKVwiO1xuXHRcdFx0aWYgKERFVikge1xuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdGZpbGVuYW1lID0gZGV2X2N1cnJlbnRfY29tcG9uZW50X2Z1bmN0aW9uPy5bRklMRU5BTUVdID8/IGZpbGVuYW1lO1xuXHRcdFx0fVxuXHRcdFx0dy5sZWdhY3lfcmVjdXJzaXZlX3JlYWN0aXZlX2Jsb2NrKGZpbGVuYW1lKTtcblx0XHRcdHNldF9zaWduYWxfc3RhdHVzKGVmZmVjdCwgTUFZQkVfRElSVFkpO1xuXHRcdH1cblx0fSk7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gbWltaWMgdGhlIG11bHRpcGxlIGxpc3RlbmVycyBhdmFpbGFibGUgaW4gc3ZlbHRlIDRcbiAqIEBkZXByZWNhdGVkXG4gKiBAcGFyYW0ge0V2ZW50TGlzdGVuZXJbXX0gaGFuZGxlcnNcbiAqIEByZXR1cm5zIHtFdmVudExpc3RlbmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlcnMoLi4uaGFuZGxlcnMpIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdGNvbnN0IHsgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIH0gPSBldmVudDtcblx0XHRsZXQgc3RvcHBlZCA9IGZhbHNlO1xuXG5cdFx0ZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uID0gKCkgPT4ge1xuXHRcdFx0c3RvcHBlZCA9IHRydWU7XG5cdFx0XHRzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24uY2FsbChldmVudCk7XG5cdFx0fTtcblxuXHRcdGNvbnN0IGVycm9ycyA9IFtdO1xuXG5cdFx0Zm9yIChjb25zdCBoYW5kbGVyIG9mIGhhbmRsZXJzKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHQvLyBAdHMtZXhwZWN0LWVycm9yIGB0aGlzYCBpcyBub3QgdHlwZWRcblx0XHRcdFx0aGFuZGxlcj8uY2FsbCh0aGlzLCBldmVudCk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGVycm9ycy5wdXNoKGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc3RvcHBlZCkge1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGxldCBlcnJvciBvZiBlcnJvcnMpIHtcblx0XHRcdHF1ZXVlTWljcm90YXNrKCgpID0+IHtcblx0XHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gY3JlYXRlIGEgYGJ1YmJsZWAgZnVuY3Rpb24gdGhhdCBtaW1pYyB0aGUgYmVoYXZpb3Igb2YgYG9uOmNsaWNrYCB3aXRob3V0IGhhbmRsZXIgYXZhaWxhYmxlIGluIHN2ZWx0ZSA0LlxuICogQGRlcHJlY2F0ZWQgVXNlIHRoaXMgb25seSBhcyBhIHRlbXBvcmFyeSBzb2x1dGlvbiB0byBtaWdyYXRlIHlvdXIgYXV0b21hdGljYWxseSBkZWxlZ2F0ZWQgZXZlbnRzIGluIFN2ZWx0ZSA1LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQnViYmxlcigpIHtcblx0Y29uc3QgYWN0aXZlX2NvbXBvbmVudF9jb250ZXh0ID0gY29tcG9uZW50X2NvbnRleHQ7XG5cdGlmIChhY3RpdmVfY29tcG9uZW50X2NvbnRleHQgPT09IG51bGwpIHtcblx0XHRlLmxpZmVjeWNsZV9vdXRzaWRlX2NvbXBvbmVudCgnY3JlYXRlQnViYmxlcicpO1xuXHR9XG5cblx0cmV0dXJuICgvKipAdHlwZSB7c3RyaW5nfSovIHR5cGUpID0+ICgvKipAdHlwZSB7RXZlbnR9Ki8gZXZlbnQpID0+IHtcblx0XHRjb25zdCBldmVudHMgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIEZ1bmN0aW9uIHwgRnVuY3Rpb25bXT59ICovIChcblx0XHRcdGFjdGl2ZV9jb21wb25lbnRfY29udGV4dC5zLiQkZXZlbnRzXG5cdFx0KT8uWy8qKiBAdHlwZSB7YW55fSAqLyAodHlwZSldO1xuXG5cdFx0aWYgKGV2ZW50cykge1xuXHRcdFx0Y29uc3QgY2FsbGJhY2tzID0gaXNfYXJyYXkoZXZlbnRzKSA/IGV2ZW50cy5zbGljZSgpIDogW2V2ZW50c107XG5cdFx0XHRmb3IgKGNvbnN0IGZuIG9mIGNhbGxiYWNrcykge1xuXHRcdFx0XHRmbi5jYWxsKGFjdGl2ZV9jb21wb25lbnRfY29udGV4dC54LCBldmVudCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gIWV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQ7XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xufVxuXG5leHBvcnQge1xuXHRvbmNlLFxuXHRwcmV2ZW50RGVmYXVsdCxcblx0c2VsZixcblx0c3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uLFxuXHRzdG9wUHJvcGFnYXRpb24sXG5cdHRydXN0ZWQsXG5cdHBhc3NpdmUsXG5cdG5vbnBhc3NpdmVcbn0gZnJvbSAnLi4vaW50ZXJuYWwvY2xpZW50L2RvbS9sZWdhY3kvZXZlbnQtbW9kaWZpZXJzLmpzJztcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBLElBQU0sMEJBQTBCOzs7OztBQU1oQyxTQUFnQixLQUFLLEtBQUs7Q0FDekIsTUFBTSxJQUFJLFFBQVEseUJBQXlCLEVBQUU7Q0FDN0MsSUFBSSxPQUFPO0NBQ1gsSUFBSSxJQUFJLElBQUk7Q0FFWixPQUFPLEtBQUssUUFBUyxRQUFRLEtBQUssT0FBUSxJQUFJLFdBQVcsQ0FBQztDQUMx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