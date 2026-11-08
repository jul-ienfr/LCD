import { injectQuery as __vite__injectQuery } from "/@vite/client";import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/node_modules/@sveltejs/kit/src/runtime/client/client.js?v=70f5904f");/** @import { LoadEvent, NavigationEvent } from '@sveltejs/kit' */
/** @import { ActionResult } from '$app/forms' */
/** @import { AfterNavigate, BeforeNavigate, GotoOptions, Navigation, NavigationTarget, NavigationType, OnNavigate } from '$app/navigation' */
/** @import { RemoteFunctionDataNode, ServerNodesResponse, ServerRedirectNode } from 'types' */
/** @import { NavigationFinished, NavigationIntent } from './types.js' */
/** @import { CacheEntry } from './remote-functions/cache.svelte.js' */
/** @import { Query } from './remote-functions/query/instance.svelte.js' */
/** @import { LiveQuery } from './remote-functions/query-live/instance.svelte.js' */
import { DEV } from "/node_modules/.vite/deps/@sveltejs_kit_n_esm-env.js?v=70f5904f";
import { settled, tick, fork, onMount, hydrate, mount } from "/node_modules/.vite/deps/svelte.js?v=70f5904f";
import { HttpError, Redirect, SvelteKitError, HandledHttpError } from "/node_modules/@sveltejs/kit/src/exports/internal/index.js?v=70f5904f";
import { decode_pathname, strip_hash, make_trackable, normalize_path } from "/node_modules/@sveltejs/kit/src/utils/url.js?v=70f5904f";
import { dev_fetch, initial_fetch, lock_fetch, subsequent_fetch, unlock_fetch } from "/node_modules/@sveltejs/kit/src/runtime/client/fetcher.js?v=70f5904f";
import { parse_routes, parse_server_route } from "/node_modules/@sveltejs/kit/src/runtime/client/parse.js?v=70f5904f";
import * as storage from "/node_modules/@sveltejs/kit/src/runtime/client/session-storage.js?v=70f5904f";
import { blur_active_element, reset_focus } from "/node_modules/@sveltejs/kit/src/runtime/client/focus.js?v=70f5904f";
import { disable_scroll_handling, restore_scroll } from "/node_modules/@sveltejs/kit/src/runtime/client/scroll.js?v=70f5904f";
import {
	find_anchor,
	resolve_url,
	get_link_info,
	get_router_options,
	is_external_url,
	origin,
	scroll_state,
	load_css
} from "/node_modules/@sveltejs/kit/src/runtime/client/utils.js?v=70f5904f";
import { base, set_match_implementation } from "/node_modules/@sveltejs/kit/src/runtime/app/paths/internal/client.js?v=70f5904f";
import * as devalue from "/node_modules/.vite/deps/@sveltejs_kit_n_devalue.js?v=70f5904f";
import {
	HISTORY_INFO_KEY,
	HISTORY_METADATA_KEY,
	PRELOAD_PRIORITIES,
	SNAPSHOT_KEY
} from "/node_modules/@sveltejs/kit/src/runtime/client/constants.js?v=70f5904f";
import {
	capture_navigation_snapshot,
	current_registrations,
	delete_navigation_snapshot,
	init_snapshots,
	persist_navigation_snapshots,
	restore_navigation_snapshot
} from "/node_modules/@sveltejs/kit/src/runtime/client/snapshots.js?v=70f5904f";
import { validate_page_exports } from "/node_modules/@sveltejs/kit/src/utils/exports.js?v=70f5904f";
import { add_deprecated_handle_error_properties } from "/node_modules/@sveltejs/kit/src/utils/error.js?v=70f5904f";
import { noop } from "/node_modules/@sveltejs/kit/src/utils/functions.js?v=70f5904f";
import {
	INVALIDATED_PARAM,
	TRAILING_SLASH_PARAM,
	create_remote_key,
	validate_depends,
	validate_load_response,
	fetch_cache_url
} from "/node_modules/@sveltejs/kit/src/runtime/shared.js?v=70f5904f";

import { page, updated, notify_version, update_page, set_navigation } from "/node_modules/@sveltejs/kit/src/runtime/app/state/client.svelte.js?v=70f5904f";
import { payload } from "/node_modules/@sveltejs/kit/src/runtime/client/payload.js?v=70f5904f";
import {
	add_data_suffix,
	add_resolution_suffix,
	route_id_resolution_pathname
} from "/node_modules/@sveltejs/kit/src/runtime/pathname.js?v=70f5904f";
import { noop_span } from "/node_modules/@sveltejs/kit/src/telemetry.js?v=70f5904f";
import { read_ndjson } from "/node_modules/@sveltejs/kit/src/runtime/client/ndjson.js?v=70f5904f";
import Root from "/node_modules/@sveltejs/kit/src/runtime/components/root.svelte?v=70f5904f";
import { Props, RenderNode } from "/node_modules/@sveltejs/kit/src/runtime/props.svelte.js?v=70f5904f";
import { init_transport, parse, stringify } from "/node_modules/@sveltejs/kit/src/runtime/app/internal/transport.js?v=70f5904f";
import { build_error_chain, nearest_error_pages } from "/node_modules/@sveltejs/kit/src/runtime/error-chain.js?v=70f5904f";
import * as e from "/node_modules/@sveltejs/kit/src/messages/client-errors.js?v=70f5904f";
import * as w from "/node_modules/@sveltejs/kit/src/messages/client-warnings.js?v=70f5904f";
import * as shared_errors from "/node_modules/@sveltejs/kit/src/messages/shared-errors.js?v=70f5904f";
import { capture_error } from "/node_modules/@sveltejs/kit/src/messages/internal/shared.js?v=70f5904f";

/**
 * @typedef {{
 *   historyIndex: number;
 *   navigationIndex: number;
 *   pageUrl?: string;
 *   state: string;
 *   persistState: boolean;
 *   resetIndex: number;
 * }} HistoryMetadata
 */

export { load_css };
const ICON_REL_ATTRIBUTES = new Set(['icon', 'shortcut icon', 'apple-touch-icon']);

let errored = false;

/**
 * `reset` functions for `<svelte:boundary>`s in the generated root that have
 * failed. A failed boundary stays failed until `reset()` is called — prop
 * updates alone don't re-render its content — so without resetting, a client
 * navigation away from a render error would leave the stale `+error.svelte`
 * mounted. The boundary's `onerror` populates this array; `navigate` drains it
 * after applying the new props. See sveltejs/kit#15694.
 * @type {Set<() => void>}
 */
const resetters = new Set();

// We track information associated with each history entry in sessionStorage,
// rather than on history.state itself, because when navigation is driven by
// popstate it's too late to access the options or update the focus position associated with the
// state we're navigating from
/**
 * @type {Record<number, { scroll?: { x: number; y: number }; resetIndex?: number }>}
 */
const history_info = storage.get(HISTORY_INFO_KEY) ?? {};

/**
 * navigation index -> any
 * @type {Record<string, any[]>}
 * @deprecated TODO 4.0 get rid of this
 */
const snapshots = storage.get(SNAPSHOT_KEY) ?? {};

init_snapshots(() => (started && !is_navigating && !updating ? current_history_index : null));

/** @type {Props} */
let props;

if (DEV) {
	let warned = false;

	const current_module_url = import.meta.url.split('?')[0]; // remove query params that vite adds to the URL when it is loaded from node_modules

	const warn = () => {
		if (warned) return;

		// Rather than saving a pointer to the original history methods, which would prevent monkeypatching by other libs,
		// inspect the stack trace to see if we're being called from within SvelteKit.
		let stack = new Error().stack?.split('\n');
		if (!stack) return;
		if (!stack[0].includes('https:') && !stack[0].includes('http:')) stack = stack.slice(1); // Chrome includes the error message in the stack

		// skip over `warn` and the place where `warn` was called
		const frame = stack[2];

		// Ignore calls that happen inside dependencies, including SvelteKit.
		// The second condition is only relevant when developing SvelteKit and running it, as there's no node_modules in the stack then (but we still do it to not get repeatedly confused)
		// `frame` can be falsy if we came from an anonymous function
		if (frame?.includes('node_modules') || frame?.includes(current_module_url)) return;

		warned = true;

		w.history_api_conflict();
	};

	const push_state = history.pushState;
	history.pushState = (...args) => {
		warn();
		return push_state.apply(history, args);
	};

	const replace_state = history.replaceState;
	history.replaceState = (...args) => {
		warn();
		return replace_state.apply(history, args);
	};
}

/** @param {number} index */
function capture_scroll(index) {
	history_info[index].scroll = scroll_state();
}

/**
 * @param {number} index
 * @param {Pick<HistoryMetadata, 'resetIndex'>} options
 */
function set_history_options(index, options) {
	history_info[index] = {
		...history_info[index],
		resetIndex: options.resetIndex
	};
}

/**
 * @param {number} current_history_index
 * @param {number} current_navigation_index
 */
function clear_onward_history(current_history_index, current_navigation_index) {
	// if we navigated back, then pushed a new state, we can
	// release memory by pruning the scroll/snapshot lookup
	// the new entry reuses the first abandoned index, so its slot must start clean
	delete_navigation_snapshot(current_history_index);
	let i = current_history_index + 1;
	while (history_info[i]) {
		delete history_info[i];
		delete_navigation_snapshot(i);
		i += 1;
	}

	i = current_navigation_index + 1;
	while (snapshots[i]) {
		delete snapshots[i];
		i += 1;
	}
}

/**
 * Loads `href` the old-fashioned way, with a full page reload.
 * Returns a `Promise` that never resolves (to prevent any
 * subsequent work, e.g. history manipulation, from happening)
 * @param {URL} url
 * @param {boolean} [replace] if `true`, will replace the current `history` entry rather than creating a new one with `pushState`
 * @returns {Promise<any>} a promise that never resolves
 */
function native_navigation(url, replace = false) {
	if (replace) {
		location.replace(url.href);
	} else {
		location.href = url.href;
	}
	return new Promise(noop);
}

/**
 * Checks whether a service worker is registered, and if it is,
 * tries to update it.
 */
async function update_service_worker() {
	try {
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.getRegistration(base || '/');
			if (registration) {
				await registration.update();
			}
		}
	} catch {
		// A failed service worker update must not prevent the fallback document navigation.
	}
}

/** @type {import('types').CSRRoute[]} All routes of the app. Only available when router.resolution=client */
let routes;
/** @type {import('types').CSRPageNodeLoader} */
let default_layout_loader;
/** @type {import('types').CSRPageNodeLoader} */
let default_error_loader;
/** @type {HTMLElement} */
let container;
/** @type {HTMLElement} */
let target;

/** @type {import('./types.js').SvelteKitApp} */
export let app;

/**
 * Data that was serialized during SSR for queries/forms/commands, stored as
 * `{ v }` (value) or `{ e }` (error) nodes so that failed states survive hydration.
 * Entries are deleted as they are consumed (when the corresponding resource is created).
 * @type {Record<string, RemoteFunctionDataNode>}
 */
export const query_responses = {};

/**
 * Data that was serialized during SSR for prerender functions, stored as
 * `{ v }` (value) or `{ e }` (error) nodes.
 * This persists across client-side navigations.
 * @type {Record<string, RemoteFunctionDataNode>}
 */
export const prerender_responses = {};

/** @type {Array<((url: URL) => boolean)>} */
const invalidated = [];

/** @type {{id: string, token: {}, promise: Promise<import('./types.js').NavigationResult>, fork: Promise<import('svelte').Fork | null> | null} | null} */
let load_cache = null;

function discard_load_cache() {
	void load_cache?.fork?.then((f) => f?.discard());
	load_cache = null;
	current_a = { element: undefined, href: undefined };
}

/**
 * @type {Map<string, Promise<URL>>}
 * Cache for client-side rerouting, since it could contain async calls which we want to
 * avoid running multiple times which would slow down navigations (e.g. else preloading
 * wouldn't help because on navigation it would be called again). Since `reroute` should be
 * a pure function (i.e. always return the same) value it's safe to cache across navigations.
 * The server reroute calls don't need to be cached because they are called using `import(...)`
 * which is cached per the JS spec.
 */
const reroute_cache = new Map();

/**
 * Sentinel for a route that exists but has no code to preload, i.e. a `+server.js` with no
 * `+page`. Cached like a parsed route so that repeated `preloadCode(id)` calls for the same
 * id don't re-request it.
 */
const ENDPOINT_ONLY = Symbol('endpoint only');

/**
 * Cache of route ID -> parsed route for server-side route resolution.
 * Populated whenever a server route resolution occurs (`match`, link preloading,
 * hydration), so that `preloadCode(id)` doesn't need an extra server round trip.
 * Lives until full page reload.
 * @type {Map<string, import('types').CSRRoute | typeof ENDPOINT_ONLY>}
 */
const route_id_cache = new Map();

/**
 * Parse a server-provided route and record it in `route_id_cache`, so that a subsequent
 * `preloadCode(id)` for the same route doesn't need another server round trip. Always use
 * this rather than calling `parse_server_route` directly.
 * @param {import('types').CSRRouteServer} server_route
 * @returns {import('types').CSRRoute}
 */
function parse_and_cache_server_route(server_route) {
	const route = parse_server_route(server_route, app.nodes);
	route_id_cache.set(route.id, route);
	return route;
}

/**
 * Note on before_navigate_callbacks, on_navigate_callbacks and after_navigate_callbacks:
 * do not re-assign as some closures keep references to these Sets
 */
/** @type {Set<(navigation: BeforeNavigate) => void>} */
const before_navigate_callbacks = new Set();

/** @type {Set<(navigation: OnNavigate) => import('types').MaybePromise<(() => void) | void>>} */
const on_navigate_callbacks = new Set();

/** @type {Set<(navigation: AfterNavigate) => void>} */
const after_navigate_callbacks = new Set();

/** @type {import('./types.js').NavigationState & { nav: NavigationEvent }} */
let current = {
	branch: [],
	error: null,
	// @ts-ignore - we need the initial value to be null
	url: null,
	// @ts-ignore - we need the initial value to be null
	nav: null
};

/** this being true means we SSR'd */
let hydrated = false;
let started = false;
let updating = false;
let is_navigating = false;
/** @type {HistoryMetadata | null} */
let hash_navigating = null;
/** True as soon as there happened one client-side navigation (excluding the SvelteKit-initialized initial one when in SPA mode) */
let has_navigated = false;

let force_invalidation = false;

/** @type {number} keeping track of the history index in order to prevent popstate navigation events if needed */
let current_history_index;

/** @type {number} */
let current_navigation_index;

/** @type {number} */
let current_reset_index;

/**
 * @param {any} [state]
 * @returns {HistoryMetadata | undefined}
 */
function get_history_metadata(state = history.state) {
	return state?.[HISTORY_METADATA_KEY];
}

/** @type {{}} Token for the latest navigation. Updated on new navigations */
let navigation_token;

/**
 * @type {{}}
 * The latest invalidate(All) token. Superseeded by both later invalidate(All)s and navigations.
 * This is separate to navigation_token because an invalidate(All) might be triggered while a navigation
 * is in progress, and we want to be able to finish this navigation (unless the invalidation finishes before
 * it and redirects, in which case we will do the redirect triggered by the invalidation).
 */
let invalidation_token;

/**
 * A set of tokens which are associated to current preloads.
 * If a preload becomes a real navigation, it's removed from the set.
 * If a preload token is in the set and the preload errors, the error
 * handling logic (for example reloading) is skipped.
 */
/** @type {Set<{}>} */
const preload_tokens = new Set();

/** @type {Promise<void> | null} */
let pending_invalidate;

/**
 * @type {Map<string, Map<string, CacheEntry<Query<any>>>>}
 * A map of query id -> payload -> query internals for all active queries.
 */
export const query_map = new Map();

/**
 * @type {Map<string, Map<string, CacheEntry<LiveQuery<any>>>>}
 * A map of id -> payload -> live query internals for all active queries.
 */
export const live_query_map = new Map();

set_match_implementation(async (url) => {
	if (typeof url === 'string') {
		url = new URL(url, location.href);
	}

	const intent = await get_navigation_intent(url, false);

	if (intent) {
		return {
			id: /** @type {import('$app/types').RouteId} */ (intent.route.id),
			params: intent.params
		};
	}

	return null;
});

let embedded_start = Promise.resolve();

/**
 * TODO this indirection is a grotesque workaround for the fact that multiple apps
 * can operate on the same shared mutable state. This is fundamentally unsound,
 * and the `start`/`_start` distinction does not fix it, but it does get the
 * tests passing. We need to rethink this whole thing but not right now
 * @param {import('./types.js').SvelteKitApp} _app
 * @param {HTMLElement} _target
 * @param {Parameters<typeof _hydrate>[1]} [data]
 */
export function start(_app, _target, data) {
	if (__SVELTEKIT_EMBEDDED__) {
		const start_promise = embedded_start.then(() => _start(_app, _target, data));
		embedded_start = start_promise.catch(noop);
		return start_promise;
	}

	return _start(_app, _target, data);
}

/**
 * @template T
 * @param {Map<string, Map<string, T>>} map
 * @returns {Generator<[string, T]>} every entry of the cache map, keyed by remote key
 */
function* cache_entries(map) {
	for (const [id, entries] of map) {
		for (const [payload, entry] of entries) {
			yield [create_remote_key(id, payload), entry];
		}
	}
}

/**
 * @param {import('./types.js').SvelteKitApp} _app
 * @param {HTMLElement} _target
 * @param {Parameters<typeof _hydrate>[1]} [data]
 */
async function _start(_app, _target, data) {
	if (DEV && _target === document.body) {
		w.app_body_unwrapped({ tag: '%sveltekit.body%' });
	}

	if (payload.data) {
		const { q = {}, p = {}, l = {}, f = {} } = payload.data;

		// store the whole nodes — error records seed the corresponding
		// resources in a failed state when they are created during hydration
		for (const k in q) query_responses[k] = q[k];
		for (const k in l) query_responses[k] = l[k];
		for (const k in f) query_responses[k] = f[k];
		for (const k in p) prerender_responses[k] = p[k];
	}

	// detect basic auth credentials in the current URL
	// https://github.com/sveltejs/kit/pull/11179
	// if so, refresh the page without credentials
	if (document.URL !== location.href) {
		// eslint-disable-next-line no-self-assign
		location.href = location.href;
	}

	app = _app;

	init_transport(app.hooks.transport ?? {});

	await _app.hooks.init?.();

	routes = __SVELTEKIT_CLIENT_ROUTING__ ? parse_routes(_app) : [];
	container = __SVELTEKIT_EMBEDDED__ ? _target : document.documentElement;
	target = _target;

	// we import the root layout/error nodes eagerly, so that
	// connectivity errors after initialisation don't nuke the app
	default_layout_loader = _app.nodes[0];
	default_error_loader = _app.nodes[1];

	const [root_layout] = await Promise.all([default_layout_loader(), default_error_loader()]);

	// the root boundary stays unarmed: the root +error.svelte renders at the node below it
	const tree = new RenderNode(root_layout.component, undefined);

	props = new Props({
		page,
		tree,
		form: undefined,
		error: undefined,
		onerror: (_, reset) => resetters.add(reset)
	});

	const history_metadata = get_history_metadata();
	current_history_index = history_metadata?.historyIndex ?? 0;
	current_navigation_index = history_metadata?.navigationIndex ?? 0;
	current_reset_index = history_metadata?.resetIndex ?? 0;

	if (!current_history_index) {
		// we use Date.now() as an offset so that cross-document navigations
		// within the app don't result in data loss
		current_history_index = current_navigation_index = current_reset_index = Date.now();

		// create initial history entry, so we can return here
		history.replaceState(
			{
				...history.state,
				[HISTORY_METADATA_KEY]: {
					historyIndex: current_history_index,
					navigationIndex: current_navigation_index,
					state: stringify({}),
					persistState: false,
					resetIndex: current_history_index
				}
			},
			''
		);
	}

	set_history_options(
		current_history_index,
		/** @type {HistoryMetadata} */ (get_history_metadata())
	);

	// if we reload the page, or Cmd-Shift-T back to it,
	// recover scroll position
	const scroll = history_info[current_history_index]?.scroll;
	function restore_reload_scroll() {
		if (scroll) {
			history.scrollRestoration = 'manual';
			scrollTo(scroll.x, scroll.y);
		}
	}

	if (data) {
		restore_reload_scroll();

		await _hydrate(target, data);
	} else {
		await navigate({
			type: 'enter',
			url: resolve_url(app.hash ? decode_hash(new URL(location.href)) : location.href),
			replace_state: true,
			state: history_metadata?.persistState ? parse(history_metadata.state) : {},
			persist_state: history_metadata?.persistState ?? false
		});

		restore_reload_scroll();
	}

	_start_router();
}

async function _invalidate(reset_page_state = true) {
	// Accept all invalidations as they come, don't swallow any while another invalidation
	// is running because subsequent invalidations may make earlier ones outdated,
	// but batch multiple synchronous invalidations.
	await (pending_invalidate ||= Promise.resolve());
	if (pending_invalidate === null) return;
	pending_invalidate = null;

	const token = (invalidation_token = {});
	const nav_token = navigation_token;
	const prev_current = current;
	const intent = await get_navigation_intent(current.url, true);

	// Clear preload, it might be affected by the invalidation.
	// Also solves an edge case where a preload is triggered, the navigation for it
	// was then triggered and is still running while the invalidation kicks in,
	// at which point the invalidation should take over and "win".
	discard_load_cache();

	// Rerun queries
	/** @type {Map<string, Promise<void>>} */
	const live_query_reconnects = new Map();
	if (force_invalidation) {
		for (const [, { resource }] of cache_entries(query_map)) {
			void resource.refresh();
		}

		for (const [key, { resource }] of cache_entries(live_query_map)) {
			const promise = resource.reconnect();
			promise.catch(noop);
			live_query_reconnects.set(key, promise);
		}
	}

	const prev_state = page.state;
	const prev_shallow = page.shallow;
	const navigation_result = intent && (await load_route(intent));
	if (!navigation_result || token !== invalidation_token || nav_token !== navigation_token) {
		return;
	}

	if (navigation_result.type === 'redirect') {
		return _goto(
			new URL(navigation_result.location, current.url).href,
			{ replace: true },
			1,
			token
		);
	}

	// a navigation applied its result while the invalidation was loading,
	// so the invalidation contains outdated data for a page we are no longer on
	if (current !== prev_current) {
		return;
	}

	apply_navigation_result(navigation_result);

	// Preserve `page.state` when invalidating without resetting it (e.g. `refresh`/`refreshAll`).
	// Must run after `apply_navigation_result`, which overwrites `state`/`shallow` with the fresh
	// page object's `{}`/`null` values when the page changed.
	if (!reset_page_state) {
		update_page({ state: prev_state });
	}

	update_page({ shallow: prev_shallow });
	current = { ...navigation_result.state, nav: current.nav };
	reset_invalidation();

	// only wait for promises that are connected to queries that still exist
	/** @type {Promise<any>[]} */
	const promises = [];
	for (const [, { resource }] of cache_entries(query_map)) {
		promises.push(resource);
	}
	for (const [key] of cache_entries(live_query_map)) {
		const promise = live_query_reconnects.get(key);
		if (promise) {
			promises.push(promise);
		}
	}

	// Don't use allSettled yet because it's too new
	await Promise.all(promises).catch(noop);
}

function reset_invalidation() {
	invalidated.length = 0;
	force_invalidation = false;
}

let warned_snapshot_export = false;

/**
 * @param {number} index
 * @deprecated TODO 4.0 get rid of this
 */
function capture_snapshot(index) {
	if (props.components.some((c) => c?.snapshot)) {
		if (DEV && !warned_snapshot_export) {
			warned_snapshot_export = true;
			w.snapshot_export_deprecated();
		}
		snapshots[index] = props.components.map((c) => c?.snapshot?.capture());
	}
}

/**
 * @param {number} index
 * @deprecated TODO 4.0 get rid of this
 */
function restore_snapshot(index) {
	snapshots[index]?.forEach((value, i) => {
		props.components[i]?.snapshot?.restore(value);
	});
}

function persist_state() {
	capture_scroll(current_history_index);
	storage.set(HISTORY_INFO_KEY, history_info);

	capture_snapshot(current_navigation_index);
	storage.set(SNAPSHOT_KEY, snapshots);

	persist_navigation_snapshots(current_history_index);
}

/**
 * @param {string | URL} url
 * @param {{ type?: NavigationType; replace?: boolean; reset?: boolean; refreshAll?: boolean; invalidate?: Array<string | URL | ((url: URL) => boolean)>; state?: Record<string, any>; persistState?: boolean; event?: Event; action_result?: ActionResult }} [options]
 * @param {number} [redirect_count]
 * @param {{}} [nav_token]
 * @param {NavigationIntent | undefined} [intent] navigation intent, when already known by the caller (avoids recomputing it)
 * @returns {Promise<void>}
 */
export async function _goto(url, options = {}, redirect_count = 0, nav_token = {}, intent) {
	/** @type {Set<string>} */
	let query_keys;
	/** @type {Set<string>} */
	let live_query_keys;

	// Clear preload cache when refreshAll is true to ensure fresh data
	// after form submissions or explicit invalidations
	if (options.refreshAll) {
		discard_load_cache();
	}

	await navigate({
		type: options.type ?? 'goto',
		url: resolve_url(url),
		reset: options.reset,
		replace_state: options.replace,
		state: options.state,
		persist_state: options.persistState,
		event: options.event,
		action_result: options.action_result,
		redirect_count,
		nav_token,
		intent,
		accept: () => {
			if (options.refreshAll) {
				force_invalidation = true;
				query_keys = new Set();
				for (const [key, entry] of cache_entries(query_map)) {
					// don't refresh yet, as some queries will be unrendered,
					// but clear caches so that newly rendered queries
					// don't use stale data. TODO same for `live_query_map`
					entry.resource?.reset();
					query_keys.add(key);
				}
				live_query_keys = new Set();
				for (const [key] of cache_entries(live_query_map)) {
					live_query_keys.add(key);
				}
			}

			if (options.invalidate) {
				options.invalidate.forEach(push_invalidated);
			}
		}
	});

	if (options.refreshAll) {
		// TODO the ticks shouldn't be necessary, something inside Svelte itself is buggy
		// when a query in a layout that still exists after page change is refreshed earlier than this
		void tick()
			.then(tick)
			.then(() => {
				for (const [key, { resource }] of cache_entries(query_map)) {
					if (query_keys?.has(key)) {
						void resource.start();
					}
				}
				for (const [key, { resource }] of cache_entries(live_query_map)) {
					if (live_query_keys?.has(key)) {
						void resource.reconnect();
					}
				}
			});
	}
}

/** @param {import('./types.js').NavigationIntent} intent */
async function _preload_data(intent) {
	// Reuse the existing pending preload if it's for the same navigation.
	// Prevents an edge case where same preload is triggered multiple times,
	// then a later one is becoming the real navigation and the preload tokens
	// get out of sync.
	if (intent.id !== load_cache?.id) {
		discard_load_cache();

		const preload = {};
		preload_tokens.add(preload);
		load_cache = {
			id: intent.id,
			token: preload,
			promise: load_route({ ...intent, preload }).finally(() => {
				preload_tokens.delete(preload);
			}),
			fork: null
		};

		load_cache.promise.catch(discard_load_cache);

		if (__SVELTEKIT_FORK_PRELOADS__) {
			const lc = load_cache;

			lc.fork = lc.promise.then((result) => {
				// if load_cache was discarded before load_cache.promise could
				// resolve, bail rather than creating an orphan fork
				if (lc === load_cache && result.type === 'loaded') {
					try {
						return fork(() => {
							apply_navigation_result(result);
						});
					} catch {
						// if it errors, it's because the experimental flag isn't enabled in Svelte
					}
				}

				return null;
			});
		}
	}

	return load_cache.promise;
}

/**
 * Fetch and parse the route with the given ID from the server-side route resolution endpoint.
 * Returns `ENDPOINT_ONLY` if the route exists but has no code to preload, or `undefined` if
 * there is no such route. Only used when `router.resolution === 'server'`.
 * @param {string} id
 * @returns {Promise<import('types').CSRRoute | typeof ENDPOINT_ONLY | undefined>}
 */
async function load_route_by_id(id) {
	/** @type {{ route?: import('types').CSRRouteServer, endpoint_only?: boolean }} */
	let module;

	try {
		module = await import(
			/* @vite-ignore */
			__vite__injectQuery(base + route_id_resolution_pathname(id), 'import')
		);
	} catch {
		// if there's no module at that path the response is a 404 (or, on a static
		// host, fallback HTML with the wrong MIME type) and the import rejects —
		// treat it the same as an unknown route rather than surfacing a cryptic error
		return;
	}

	if (module.endpoint_only) {
		// The route exists, it just has no code to preload.
		route_id_cache.set(id, ENDPOINT_ONLY);
		return ENDPOINT_ONLY;
	}

	if (!module.route) return;

	return parse_and_cache_server_route(module.route);
}

/**
 * Import the modules for a route's layout and leaf nodes, without running `load` functions.
 * @param {import('types').CSRRoute} route
 * @returns {Promise<void>}
 */
async function load_route_nodes(route) {
	await Promise.all(
		/** @type {[has_server_load: boolean, node_loader: import('types').CSRPageNodeLoader][]} */ (
			[...route.layouts, route.leaf].filter(Boolean)
		).map(([, node_loader]) => node_loader())
	);
}

/**
 * @param {URL} url
 * @returns {Promise<void>}
 */
async function _preload_code(url) {
	const route = (await get_navigation_intent(url, false))?.route;

	if (route) {
		await load_route_nodes(route);
	}
}

/**
 * @param {import('./types.js').NavigationFinished} result
 * @param {HTMLElement} target
 * @param {boolean} should_hydrate
 */
async function initialize(result, target, should_hydrate) {
	if (__SVELTEKIT_DEV__ && result.state.error && document.querySelector('vite-error-overlay'))
		return;

	/** @type {NavigationEvent} */
	const nav = {
		params: current.params,
		route: { id: current.route?.id ?? null },
		url: new URL(location.href)
	};

	current = {
		...result.state,
		nav
	};

	// Removes the style node we used to avoid FOUC during development
	if (__SVELTEKIT_DEV__) {
		const style = document.querySelector('style[data-sveltekit]');
		if (style) style.remove();
	}

	apply_navigation_result(result);

	// TODO treeshake `hydrate` in csr mode
	const render = should_hydrate ? hydrate : mount;

	render(Root, {
		target,
		props,
		transformError: /** @param {unknown} e */ async (e) => {
			const error = await handle_error(e, current.nav);
			update_page({ error, status: error.status });
			return error;
		}
	});

	// Wait for a microtask in case svelte experimental async is enabled,
	// which causes component script blocks to run asynchronously
	void (await Promise.resolve());

	if (should_hydrate) {
		/** @type {AfterNavigate} */
		const navigation = {
			from: null,
			to: {
				...nav,
				scroll: history_info[current_history_index]?.scroll ?? scroll_state()
			},
			willUnload: false,
			type: 'enter',
			shallow: false,
			complete: Promise.resolve()
		};

		after_navigate_callbacks.forEach((fn) => fn(navigation));
	}

	restore_snapshot(current_navigation_index);
	restore_navigation_snapshot(current_history_index);

	started = true;
}

/**
 *
 * @param {{
 *   url: URL;
 *   params: Record<string, string>;
 *   branch: Array<import('./types.js').BranchNode | undefined>;
 *   errors?: Array<import('types').CSRPageNodeLoader | undefined>;
 *   status?: number;
 *   error: App.Error | null;
 *   route: import('types').CSRRoute | null;
 *   form?: Record<string, any> | null;
 * }} opts
 */
async function get_navigation_result_from_branch({
	url,
	params,
	branch,
	errors,
	status,
	error,
	route,
	form
}) {
	/** @type {import('types').TrailingSlash} */
	let slash = 'never';

	// if `paths.base === '/a/b/c`, then the root route is always `/a/b/c/`, regardless of
	// the `trailingSlash` route option, so that relative paths to JS and CSS work
	if (base && (url.pathname === base || url.pathname === base + '/')) {
		slash = 'always';
	} else {
		for (const node of branch) {
			if (node?.slash !== undefined) slash = node.slash;
		}
	}

	url.pathname = normalize_path(url.pathname, slash);
	// eslint-disable-next-line no-self-assign
	url.search = url.search; // turn `/?` into `/`

	/** @type {import('./types.js').NavigationFinished} */
	const result = {
		type: 'loaded',
		state: {
			url,
			params,
			branch,
			error,
			route
		},
		props: {
			page: { ...page },
			tree: /** @type {RenderNode} */ ({})
		}
	};

	if (error) {
		result.props.error = error;
	}

	if (form !== undefined) {
		result.props.form = form;
	}

	let data = {};
	let data_changed = !page;

	const error_components =
		errors &&
		(await build_error_chain(branch, errors, (loader) => loader().then((e) => e.component)));

	let current_node = result.props.tree;
	let current_depth = 1;

	/** @type {RenderNode | undefined} */
	let previous_node = props.tree;

	for (let i = 0; i < branch.length; i += 1) {
		const node = branch[i];
		const prev = current.branch[i];

		if (!node) continue;

		if (
			// if an ancestor node in this path changed, `data_changed` is already true and the
			// accumulated `data` differs from the previous render, so we must re-merge
			data_changed ||
			!previous_node ||
			node?.data !== prev?.data
		) {
			current_node.data = { ...data, ...node.data };
			data_changed = true;
		} else {
			// use existing object — prevents effects re-running unnecessarily
			current_node.data = previous_node.data;
		}

		data = current_node.data;

		if (i < branch.length - 1) {
			let next_index = i + 1;
			while (next_index < branch.length && !branch[next_index]) {
				next_index += 1;
			}

			const next = branch[next_index];

			if (next) {
				current_node = current_node.child = new RenderNode(
					next.node.component,
					error_components?.[current_depth++]
				);

				previous_node = previous_node?.child;
			}
		}
	}

	const page_changed =
		!current.url ||
		url.href !== current.url.href ||
		current.error !== error ||
		(form !== undefined && form !== page.form) ||
		data_changed;

	if (page_changed) {
		result.props.page = {
			error,
			params,
			route: {
				id: route?.id ?? null
			},
			state: {},
			shallow: null,
			status: status ?? error?.status ?? 200,
			url: new URL(url),
			form: form ?? null,
			data
		};
	}

	return result;
}

/**
 * Call the universal load function of the given node, if it exists.
 *
 * @param {{
 *   loader: import('types').CSRPageNodeLoader;
 * 	 parent: () => Promise<Record<string, any>>;
 *   url: URL;
 *   params: Record<string, string>;
 *   route: { id: string | null };
 * 	 server_data_node: import('./types.js').DataNode | null;
 * }} options
 * @returns {Promise<import('./types.js').BranchNode>}
 */
async function load_node({ loader, parent, url, params, route, server_data_node }) {
	/** @type {Record<string, any> | null} */
	let data = null;

	let is_tracking = true;

	/** @type {import('types').Uses} */
	const uses = {
		dependencies: new Set(),
		params: new Set(),
		parent: false,
		route: false,
		url: false,
		search_params: new Set()
	};

	const node = await loader();

	if (DEV) {
		validate_page_exports(node.universal);

		if (node.universal && app.hash) {
			const options = Object.keys(node.universal).filter((o) => o !== 'load');

			if (options.length > 0) {
				shared_errors.router_hash_page_options({
					source: /** @type {string} */ (route.id),
					options: options.map((o) => `'${o}'`).join(', ')
				});
			}
		}
	}

	if (__SVELTEKIT_HAS_UNIVERSAL_LOAD__ && node.universal?.load) {
		/** @param {string[]} deps */
		function depends(...deps) {
			for (const dep of deps) {
				if (DEV) validate_depends(/** @type {string} */ (route.id), dep);

				const { href } = new URL(dep, url);
				uses.dependencies.add(href);
			}
		}

		/** @type {LoadEvent} */
		const load_input = {
			tracing: { enabled: false, root: noop_span, current: noop_span },
			route: new Proxy(route, {
				get: (target, key) => {
					if (is_tracking) {
						uses.route = true;
					}
					return target[/** @type {'id'} */ (key)];
				}
			}),
			params: new Proxy(params, {
				get: (target, key) => {
					if (is_tracking) {
						uses.params.add(/** @type {string} */ (key));
					}
					return target[/** @type {string} */ (key)];
				}
			}),
			data: server_data_node?.data ?? null,
			url: make_trackable(
				url,
				() => {
					if (is_tracking) {
						uses.url = true;
					}
				},
				(param) => {
					if (is_tracking) {
						uses.search_params.add(param);
					}
				},
				app.hash
			),
			async fetch(resource, init) {
				if (resource instanceof Request) {
					// we're not allowed to modify the received `Request` object, so in order
					// to fixup relative urls we create a new equivalent `init` object instead
					init = {
						// the request body must be consumed in memory until browsers
						// implement streaming request bodies and/or the body getter
						body:
							resource.method === 'GET' || resource.method === 'HEAD'
								? undefined
								: await resource.blob(),
						cache: resource.cache,
						credentials: resource.credentials,
						// the server sets headers to `undefined` if there are no headers but
						// the client defaults to an empty Headers object in the Request object.
						// To keep the two values in sync, we explicitly set the headers to `undefined`.
						// Also, not sure why, but sometimes 0 is evaluated as truthy so we need to
						// explicitly compare the headers length to a number here
						headers: [...resource.headers].length > 0 ? resource?.headers : undefined,
						integrity: resource.integrity,
						keepalive: resource.keepalive,
						method: resource.method,
						mode: resource.mode,
						redirect: resource.redirect,
						referrer: resource.referrer,
						referrerPolicy: resource.referrerPolicy,
						signal: resource.signal,
						...init
					};
				}

				const { resolved, promise } = resolve_fetch_url(resource, init, url);

				if (is_tracking) {
					depends(resolved.href);
				}

				return promise;
			},
			setHeaders: noop,
			depends,
			parent() {
				if (is_tracking) {
					uses.parent = true;
				}
				return parent();
			},
			untrack(fn) {
				is_tracking = false;
				try {
					return fn();
				} finally {
					is_tracking = true;
				}
			}
		};

		if (DEV) {
			try {
				lock_fetch();
				data = (await node.universal.load.call(null, load_input)) ?? null;
				validate_load_response(data, `related to route '${route.id}'`);
			} finally {
				unlock_fetch();
			}
		} else {
			data = (await node.universal.load.call(null, load_input)) ?? null;
		}
	}

	return {
		node,
		loader,
		server: server_data_node,
		universal: node.universal?.load ? { type: 'data', data, uses } : null,
		data: data ?? server_data_node?.data ?? null,
		slash: node.universal?.trailingSlash ?? server_data_node?.slash
	};
}

/**
 * @param {Request | string | URL} input
 * @param {RequestInit | undefined} init
 * @param {URL} url
 */
function resolve_fetch_url(input, init, url) {
	// we must fixup relative urls so they are resolved from the target page
	const resolved = new URL(input instanceof Request ? input.url : input, url);

	const requested = fetch_cache_url(resolved, url);

	const promise = started
		? subsequent_fetch(requested, resolved.href, init)
		: initial_fetch(requested, init);

	return { resolved, promise };
}

/**
 * @param {boolean} parent_changed
 * @param {boolean} route_changed
 * @param {boolean} url_changed
 * @param {Set<string>} search_params_changed
 * @param {import('types').Uses | undefined} uses
 * @param {Record<string, string>} params
 */
function has_changed(
	parent_changed,
	route_changed,
	url_changed,
	search_params_changed,
	uses,
	params
) {
	if (force_invalidation) return true;

	if (!uses) return false;

	if (uses.parent && parent_changed) return true;
	if (uses.route && route_changed) return true;
	if (uses.url && url_changed) return true;

	for (const tracked_params of uses.search_params) {
		if (search_params_changed.has(tracked_params)) return true;
	}

	for (const param of uses.params) {
		if (params[param] !== current.params[param]) return true;
	}

	for (const href of uses.dependencies) {
		if (invalidated.some((fn) => fn(new URL(href)))) return true;
	}

	return false;
}

/**
 * @param {import('types').ServerDataNode | import('types').ServerDataSkippedNode | null} node
 * @param {import('./types.js').DataNode | null} [previous]
 * @returns {import('./types.js').DataNode | null}
 */
function create_data_node(node, previous) {
	if (node?.type === 'data') return node;
	if (node?.type === 'skip') return previous ?? null;
	return null;
}

/**
 * @param {URL | null} old_url
 * @param {URL} new_url
 */
function diff_search_params(old_url, new_url) {
	if (!old_url) return new Set(new_url.searchParams.keys());

	const changed = new Set([...old_url.searchParams.keys(), ...new_url.searchParams.keys()]);

	for (const key of changed) {
		const old_values = old_url.searchParams.getAll(key).sort();
		const new_values = new_url.searchParams.getAll(key).sort();

		if (
			old_values.length === new_values.length &&
			old_values.every((value, i) => value === new_values[i])
		) {
			changed.delete(key);
		}
	}

	return changed;
}

/**
 * @overload
 * @param {import('./types.js').NavigationIntent & { action_result?: ActionResult }} intent
 * @returns {Promise<import('./types.js').NavigationResult | undefined>}
 */
/**
 * @overload
 * @param {import('./types.js').NavigationIntent & { preload: {} }} intent
 * @returns {Promise<import('./types.js').NavigationResult>}
 */
/**
 * @param {import('./types.js').NavigationIntent & { preload?: {}; action_result?: ActionResult }} intent
 * @returns {Promise<import('./types.js').NavigationResult | undefined>}
 */
async function load_route({ id, invalidating, url, params, route, preload, action_result }) {
	if (!action_result && load_cache?.id === id) {
		// the preload becomes the real navigation
		preload_tokens.delete(load_cache.token);
		return load_cache.promise;
	}

	const { errors, layouts, leaf } = route;

	const loaders = [...layouts, leaf];
	const leaf_index = loaders.length - 1;
	const action_error = action_result?.type === 'error';

	// preload modules to avoid waterfall, but handle rejections
	// so they don't get reported to Sentry et al (we don't need
	// to act on the failures at this point)
	errors.forEach((loader) => loader?.().catch(noop));
	loaders.forEach((loader) => loader?.[1]().catch(noop));

	/** @type {import('types').ServerNodesResponse | import('types').ServerRedirectNode | null} */
	let server_data = null;
	const url_changed = current.url ? id !== get_page_key(current.url) : false;
	// current.route is null after an error-page render, so a missing route counts as changed
	const route_changed = !current.route || route.id !== current.route.id;
	const search_params_changed = diff_search_params(current.url, url);

	let parent_invalid = false;

	if (__SVELTEKIT_HAS_SERVER_LOAD__) {
		const invalid_server_nodes = loaders.map((loader, i) => {
			if (action_error && i === leaf_index) return false;

			const previous = current.branch[i];

			const invalid =
				!!loader?.[0] &&
				(previous?.loader !== loader[1] ||
					has_changed(
						parent_invalid,
						route_changed,
						url_changed,
						search_params_changed,
						previous.server?.uses,
						params
					));

			if (invalid) {
				// For the next one
				parent_invalid = true;
			}

			return invalid;
		});

		if (invalid_server_nodes.some(Boolean)) {
			try {
				server_data = await load_data(url, invalid_server_nodes);
			} catch (error) {
				const handled_error = await handle_error(error, { url, params, route: { id } });

				if (preload && preload_tokens.has(preload)) {
					throw handled_error;
				}

				return load_root_error_page({
					error: handled_error,
					url,
					route
				});
			}

			if (server_data.type === 'redirect') {
				return server_data;
			}
		}
	}

	const server_data_nodes = server_data?.nodes;

	let parent_changed = false;

	const branch_promises = loaders.map(async (loader, i) => {
		if (!loader || (action_error && i === leaf_index)) return;

		/** @type {import('./types.js').BranchNode | undefined} */
		const previous = current.branch[i];

		const server_data_node = server_data_nodes?.[i];

		// reuse data from previous load if it's still valid
		const valid =
			(!server_data_node || server_data_node.type === 'skip') &&
			loader[1] === previous?.loader &&
			!has_changed(
				parent_changed,
				route_changed,
				url_changed,
				search_params_changed,
				previous.universal?.uses,
				params
			);
		if (valid) return previous;

		parent_changed = true;

		if (server_data_node?.type === 'error') {
			// rethrow and catch below
			throw new HandledHttpError(server_data_node.error);
		}

		return load_node({
			loader: loader[1],
			url,
			params,
			route,
			parent: async () => {
				const data = {};
				for (let j = 0; j < i; j += 1) {
					Object.assign(data, (await branch_promises[j])?.data);
				}
				return data;
			},
			server_data_node: create_data_node(
				// server_data_node is undefined if it wasn't reloaded from the server;
				// and if current loader uses server data, we want to reuse previous data.
				server_data_node === undefined && loader[0] ? { type: 'skip' } : (server_data_node ?? null),
				loader[0] ? previous?.server : undefined
			)
		});
	});

	// if we don't do this, rejections will be unhandled
	for (const p of branch_promises) p.catch(noop);

	/** @type {Array<import('./types.js').BranchNode | undefined>} */
	const branch = [];

	for (let i = 0; i < loaders.length; i += 1) {
		if (loaders[i]) {
			try {
				branch.push(await branch_promises[i]);
			} catch (err) {
				if (err instanceof Redirect) {
					return {
						type: 'redirect',
						status: err.status,
						location: err.location
					};
				}

				if (preload && preload_tokens.has(preload)) {
					throw await handle_error(err, { params, url, route: { id: route.id } });
				}

				/** @type {App.Error} */
				let error;

				if (server_data_nodes?.includes(/** @type {import('types').ServerErrorNode} */ (err))) {
					// this is the server error rethrown above, reconstruct but don't invoke
					// the client error handler; it should've already been handled on the server
					error = /** @type {import('types').ServerErrorNode} */ (err).error;
				} else if (err instanceof HttpError) {
					error = await handle_error(err, { params, url, route: { id: route.id } });
				} else {
					// Referenced node could have been removed due to redeploy, check
					if (await updated.check()) {
						// Before reloading, try to update the service worker if it exists
						await update_service_worker();
						return await native_navigation(url);
					}

					error = await handle_error(err, { params, url, route: { id: route.id } });
				}

				return load_route_error({
					i,
					branch,
					errors,
					error,
					url,
					params,
					route
				});
			}
		} else {
			// push an empty slot so we can rewind past gaps to the
			// layout that corresponds with an +error.svelte page
			branch.push(undefined);
		}
	}

	if (action_result?.type === 'error') {
		// render the nearest error boundary of the route the action belongs to,
		// as a native form submission would
		return load_route_error({
			i: loaders.length,
			branch,
			errors,
			error: action_result.error,
			status: action_result.status,
			url,
			params,
			route
		});
	}

	return get_navigation_result_from_branch({
		url,
		params,
		branch,
		errors,
		error: null,
		route,
		status: action_result?.status,
		// `error` results returned above, `redirect` results are never passed here
		form:
			action_result?.type === 'success' || action_result?.type === 'failure'
				? (action_result.data ?? null)
				: // Reset `form` on navigation, but not invalidation
					invalidating
					? undefined
					: null
	});
}

/**
 * @param {number} i Start index to backtrack from
 * @param {Array<import('./types.js').BranchNode | undefined>} branch Branch to backtrack
 * @param {Array<import('types').CSRPageNodeLoader | undefined>} errors All error pages for this branch
 * @returns {Promise<Array<import('./types.js').BranchNode | undefined> | undefined>} the branch truncated at the error page's depth
 */
async function load_nearest_error_page(i, branch, errors) {
	for (const { error, idx } of nearest_error_pages(i, branch, errors)) {
		try {
			return branch.slice(0, idx).concat({
				node: await error(),
				loader: error,
				data: {},
				server: null,
				universal: null
			});
		} catch {
			continue;
		}
	}
}

/**
 * @param {{
 *   i: number;
 *   branch: Array<import('./types.js').BranchNode | undefined>;
 *   errors: Array<import('types').CSRPageNodeLoader | undefined>;
 *   error: App.Error;
 *   status?: number;
 *   url: URL;
 *   params: Record<string, string>;
 *   route: import('./types.js').NavigationIntent['route'];
 * }} opts
 */
async function load_route_error({ i, branch, errors, error, status, url, params, route }) {
	const error_branch = await load_nearest_error_page(i, branch, errors);
	if (error_branch) {
		return get_navigation_result_from_branch({
			url,
			params,
			branch: error_branch,
			errors,
			error,
			status,
			route
		});
	}

	return server_fallback(url, { id: route.id }, error);
}

/**
 * @param {{
 *   error: App.Error;
 *   url: URL;
 *   route: { id: string | null }
 * }} opts
 * @returns {Promise<import('./types.js').NavigationFinished | undefined>} returns `undefined` in case of a redirect
 */
async function load_root_error_page({ error, url, route }) {
	/** @type {Record<string, string>} */
	const params = {}; // error page does not have params

	/** @type {import('types').ServerDataNode | null} */
	let server_data_node = null;

	if (__SVELTEKIT_HAS_SERVER_LOAD__) {
		const default_layout_has_server_load = app.server_loads[0] === 0;

		if (default_layout_has_server_load) {
			// TODO post-https://github.com/sveltejs/kit/discussions/6124 we can use
			// existing root layout data
			try {
				const server_data = await load_data(url, [true]);

				if (
					server_data.type !== 'data' ||
					(server_data.nodes[0] && server_data.nodes[0].type !== 'data')
				) {
					throw 0;
				}

				server_data_node = server_data.nodes[0] ?? null;
			} catch (e) {
				// at this point we have no choice but to fall back to the server, if it wouldn't
				// bring us right back here, turning this into an endless loop.
				// if __data.json returned 404, the route doesn't exist — don't reload or we loop
				if (
					!(e instanceof HttpError && e.status === 404) &&
					(url.origin !== origin || url.pathname !== location.pathname || hydrated)
				) {
					return await native_navigation(url);
				}
			}
		}
	}

	try {
		const root_layout = await load_node({
			loader: default_layout_loader,
			url,
			params,
			route,
			parent: () => Promise.resolve({}),
			server_data_node: create_data_node(server_data_node)
		});

		/** @type {import('./types.js').BranchNode} */
		const root_error = {
			node: await default_error_loader(),
			loader: default_error_loader,
			universal: null,
			server: null,
			data: null
		};

		return get_navigation_result_from_branch({
			url,
			params,
			branch: [root_layout, root_error],
			error,
			errors: [],
			route: null
		});
	} catch (error) {
		// client-side navigation if the root layout loader throws a redirect while
		// rendering the default error page
		if (error instanceof Redirect) {
			await _goto(new URL(error.location, location.href));
			return;
		}

		// otherwise, render the static error page
		const error_template = await app.get_error_template();
		const handled = await handle_error(error, { url, params, route });
		const message = String(handled?.message ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		const html = error_template({ status: handled.status, message });
		const parsed = new DOMParser().parseFromString(html, 'text/html');
		document.documentElement.replaceChild(document.adoptNode(parsed.head), document.head);
		document.documentElement.replaceChild(document.adoptNode(parsed.body), document.body);

		throw error;
	}
}

/**
 * Resolve the relative rerouted URL for a client-side navigation
 * @param {URL} url
 * @returns {Promise<URL | undefined>}
 */
async function get_rerouted_url(url) {
	const href = url.href;

	if (reroute_cache.has(href)) {
		return reroute_cache.get(href);
	}

	let rerouted;

	try {
		const promise = (async () => {
			// reroute could alter the given URL, so we pass a copy
			let rerouted =
				(await app.hooks.reroute({
					url: new URL(url),
					fetch: async (input, init) => {
						return resolve_fetch_url(input, init, url).promise;
					}
				})) ?? url;

			if (typeof rerouted === 'string') {
				const tmp = new URL(url); // do not mutate the incoming URL

				if (app.hash) {
					tmp.hash = rerouted;
				} else {
					tmp.pathname = rerouted;
				}

				rerouted = tmp;
			}

			return rerouted;
		})();

		reroute_cache.set(href, promise);
		rerouted = await promise;
	} catch (e) {
		reroute_cache.delete(href);
		if (DEV) {
			// in development, print the error...
			console.error(e);

			// ...and pause execution, since otherwise we will immediately reload the page
			debugger; // eslint-disable-line
		}

		// fall back to native navigation
		return;
	}

	return rerouted;
}

/**
 * Resolve the full info (which route, params, etc.) for a client-side navigation from the URL,
 * taking the reroute hook into account. If this isn't a client-side-navigation (or the URL is undefined),
 * returns undefined.
 * @param {URL | undefined} url
 * @param {boolean} invalidating
 * @returns {Promise<import('./types.js').NavigationIntent | undefined>}
 */
export async function get_navigation_intent(url, invalidating) {
	if (!url) return;
	if (is_external_url(url, base, app.hash)) return;

	if (__SVELTEKIT_CLIENT_ROUTING__) {
		const rerouted = await get_rerouted_url(url);
		if (!rerouted) return;

		const path = get_url_path(rerouted);

		for (const route of routes) {
			const params = route.exec(path);

			if (params) {
				return {
					id: get_page_key(url),
					invalidating,
					route,
					params,
					url
				};
			}
		}
	} else {
		/** @type {{ route?: import('types').CSRRouteServer, params: Record<string, string>}} */
		const { route, params } = await import(
			/* @vite-ignore */
			__vite__injectQuery(add_resolution_suffix(url.pathname), 'import')
		);

		if (!route) return;

		return {
			id: get_page_key(url),
			invalidating,
			route: parse_and_cache_server_route(route),
			params,
			url
		};
	}
}

/** @param {URL} url */
function get_url_path(url) {
	return (
		decode_pathname(
			app.hash ? url.hash.replace(/^#/, '').replace(/[?#].+/, '') : url.pathname.slice(base.length)
		) || '/'
	);
}

/** @param {URL} url */
function get_page_key(url) {
	return (app.hash ? url.hash.replace(/^#/, '') : url.pathname) + url.search;
}

/**
 * @param {{
 *   url: URL;
 *   type: Navigation["type"];
 *   intent?: import('./types.js').NavigationIntent;
 *   delta?: number;
 *   event?: PopStateEvent | MouseEvent;
 *   scroll?: { x: number, y: number };
 *   shallow?: boolean;
 *   target?: { params: Record<string, string> | null; route: { id: string } | null; url: URL };
 * }} opts
 */
function _before_navigate({ url, type, intent, delta, event, scroll, shallow = false, target }) {
	let should_block = false;

	const nav = create_navigation(current, intent, url, type, scroll ?? null, shallow, target);

	if (nav.navigation.type === 'popstate' && delta !== undefined) {
		nav.navigation.delta = delta;
	}

	if (event !== undefined) {
		// @ts-ignore
		nav.navigation.event = event;
	}

	const cancellable = {
		...nav.navigation,
		cancel: () => {
			should_block = true;
			nav.reject(new Error('navigation cancelled'));
		}
	};

	if (!is_navigating) {
		// Don't run the event during redirects
		// TODO this isn't fully right: if you do a goto(...) while another goto(...) is in progress,
		// or you click a link while a navigation is in progress, the beforNavigate calls are not triggered,
		// and maybe they should be?
		before_navigate_callbacks.forEach((fn) => fn(cancellable));
	}

	return should_block ? null : nav;
}

/**
 * @param {{
 *   type: NavigationType;
 *   url: URL;
 *   popped?: {
 *     state: Record<string, any>;
 *     scroll?: { x: number, y: number };
 *     delta: number;
 *     shallow: { params: Record<string, string> | null; route: { id: string } | null; url: URL } | null;
 *   };
 *   reset?: boolean;
 *   replace_state?: boolean;
 *   state?: Record<string, any>;
 *   persist_state?: boolean;
 *   redirect_count?: number;
 *   nav_token?: {};
 *   accept?: () => void;
 *   block?: () => void;
 *   event?: Event;
 *   intent?: NavigationIntent | undefined;
 *   action_result?: ActionResult;
 * }} opts
 * @returns {Promise<void>}
 */
async function navigate({
	type,
	url,
	popped,
	reset = true,
	replace_state,
	state = {},
	persist_state = false,
	redirect_count = 0,
	nav_token = {},
	accept = noop,
	block = noop,
	event,
	intent,
	action_result
}) {
	const prev_token = navigation_token;
	const prev_invalidation_token = invalidation_token;
	navigation_token = invalidation_token = nav_token;

	intent ??= await get_navigation_intent(url, false);
	const nav =
		type === 'enter'
			? create_navigation(current, intent, url, type)
			: _before_navigate({
					url,
					type,
					delta: popped?.delta,
					intent,
					scroll: popped?.scroll,
					shallow: !!popped?.shallow,
					target: popped?.shallow ?? undefined,
					// @ts-ignore
					event
				});

	if (!nav) {
		block();
		if (navigation_token === nav_token) navigation_token = prev_token;
		if (invalidation_token === nav_token) invalidation_token = prev_invalidation_token;
		return;
	}

	// store this before calling `accept()`, which may change the index
	const previous_history_index = current_history_index;
	const previous_navigation_index = current_navigation_index;
	const previous_snapshot_registrations = current_registrations();

	accept();

	is_navigating = true;

	if (started && nav.navigation.type !== 'enter') {
		set_navigation(nav.navigation);
	}

	let navigation_result = intent && (await load_route({ ...intent, action_result }));

	if (!navigation_result) {
		const external = is_external_url(url, base, app.hash);
		// Special case for hash mode during DEV: If someone accidentally forgets to use a hash for the link,
		// they would end up here in an endless loop. Fall back to error page in that case
		const missing_hash = external && DEV && app.hash;

		if (external && !missing_hash) {
			return await native_navigation(url, replace_state);
		}

		navigation_result = await server_fallback(
			url,
			{ id: null },
			await handle_error(
				new SvelteKitError(
					404,
					'Not Found',
					`Not found: ${url.pathname}${missing_hash ? ' (did you forget the hash?)' : ''}`
				),
				{ url, params: {}, route: { id: null } }
			),
			replace_state
		);
	}

	// if this is an internal navigation intent, use the normalized
	// URL for the rest of the function
	url = intent?.url || url;

	// abort if user navigated during update
	if (navigation_token !== nav_token) {
		nav.reject(new Error('navigation aborted'));
		return;
	}

	if (!navigation_result) return;

	if (navigation_result.type === 'redirect') {
		// whatwg fetch spec https://fetch.spec.whatwg.org/#http-redirect-fetch says to error after 20 redirects
		if (redirect_count < 20) {
			// a preloaded redirect has been consumed; a later hop back to this route must load afresh
			if (load_cache?.id === intent?.id) discard_load_cache();

			await navigate({
				type,
				url: new URL(navigation_result.location, url),
				popped,
				reset,
				replace_state,
				state,
				persist_state,
				redirect_count: redirect_count + 1,
				nav_token
			});

			nav.fulfil(undefined);
			return;
		}

		navigation_result = await load_root_error_page({
			error: await handle_error(
				capture_error(() => e.redirect_loop({ url: url.href })),
				{
					url,
					params: {},
					route: { id: null }
				}
			),
			url,
			route: { id: null }
		});

		if (!navigation_result) return;
	} else if (/** @type {number} */ (navigation_result.props.page.status) >= 400) {
		if (await updated.check()) {
			// Before reloading, try to update the service worker if it exists
			await update_service_worker();
			return await native_navigation(url, replace_state);
		}
	}

	// reset invalidation only after a finished navigation. If there are redirects or
	// additional invalidations, they should get the same invalidation treatment
	reset_invalidation();

	updating = true;

	if (!popped) {
		// popstate captures the source entry synchronously, before the traversal is resolved
		capture_scroll(previous_history_index);
		capture_snapshot(previous_navigation_index);
		if (replace_state) {
			delete_navigation_snapshot(previous_history_index);
		} else {
			capture_navigation_snapshot(previous_history_index);
		}
	}

	// ensure the url pathname matches the page's trailing slash option
	if (navigation_result.props.page.url.pathname !== url.pathname) {
		url.pathname = navigation_result.props.page.url.pathname;
	}

	if (popped) {
		state = popped.state;
	} else {
		// we immediately serialize-then-parse to ensure that the value is
		// serializable, and to prevent the developer from dangerously
		// relying on the identity of the serialized objects
		const serialized_state = stringify(state);
		state = parse(serialized_state);

		// Store the serialized state so the browser history can preserve custom transport values.
		// This is a new navigation, rather than a popstate.
		const change = replace_state ? 0 : 1;
		if (type !== 'enter') {
			if (reset) current_reset_index += 1;
		}

		const entry = {
			[HISTORY_METADATA_KEY]: /** @satisfies {HistoryMetadata} */ ({
				historyIndex: (current_history_index += change),
				navigationIndex: (current_navigation_index += change),
				state: serialized_state,
				persistState: persist_state,
				resetIndex: current_reset_index
			})
		};

		const fn = replace_state ? history.replaceState : history.pushState;
		fn.call(history, entry, '', url);
		set_history_options(current_history_index, entry[HISTORY_METADATA_KEY]);

		if (!replace_state) {
			clear_onward_history(current_history_index, current_navigation_index);
		}
	}

	// also compare ids to avoid using wrong fork (e.g. a new one could've been added while navigating)
	const load_cache_fork = intent && load_cache?.id === intent.id ? load_cache.fork : null;
	// reset preload synchronously after the history state has been set to avoid race conditions
	if (load_cache?.fork && !load_cache_fork) {
		// discard fork of different route
		discard_load_cache();
	} else {
		load_cache = null;
		current_a = { element: undefined, href: undefined };
	}

	navigation_result.props.page.state = state;
	navigation_result.props.page.shallow = popped?.shallow ?? null;

	/**
	 * @type {Promise<void> | undefined}
	 */
	let commit_promise;
	if (started) {
		await run_on_navigate_callbacks(/** @type {OnNavigate} */ (nav.navigation));

		// Type-casts are save because we know this resolved a proper SvelteKit route
		const target = popped?.shallow
			? {
					params: navigation_result.state.params,
					route: { id: navigation_result.state.route?.id ?? null },
					url: navigation_result.state.url
				}
			: /** @type {NavigationTarget} */ (nav.navigation.to);
		current = {
			...navigation_result.state,
			nav: {
				params: /** @type {Record<string, any>} */ (target.params),
				route: target.route,
				url: target.url
			}
		};

		// reset url before updating page store
		if (navigation_result.props.page) {
			navigation_result.props.page.url = url;
		}

		// Remove focus before updating the component tree, so that blur/focusout
		// handlers fire while the old component's data is still valid (#14575)
		blur_active_element(reset);

		const fork = load_cache_fork && (await load_cache_fork);

		if (fork) {
			commit_promise = fork.commit();
			// `fork.commit()` applies the preloaded state synchronously before the
			// first `await`, so reset any previously-failed boundaries now so the
			// stale `+error.svelte` is torn down. See sveltejs/kit#15694.
			for (const reset_boundary of resetters) {
				reset_boundary();
			}
			resetters.clear();
		} else {
			apply_navigation_result(navigation_result);

			// Reset boundaries that failed on a previous navigation once the new props have
			// flushed (see sveltejs/kit#15694). Resetting first re-renders the old content at
			// a depth the new tree may not have, stranding the stale `+error.svelte`.
			commit_promise = settled().then(() => {
				for (const reset_boundary of resetters) {
					reset_boundary();
				}
				resetters.clear();
			});
		}

		has_navigated = true;
	} else {
		await initialize(navigation_result, target, false);
	}

	const finished = await finish_navigation(
		nav,
		nav_token,
		url,
		popped?.scroll,
		reset,
		commit_promise
	);
	if (!finished) return;

	if (type === 'popstate') {
		restore_snapshot(current_navigation_index);
	}
	// new and replaced entries have no stored values, so this only resets there
	restore_navigation_snapshot(current_history_index, previous_snapshot_registrations);

	set_navigation(null);

	updating = false;
}

/**
 * Runs the `onNavigate` callbacks and registers any functions they return to run after the navigation
 * @param {OnNavigate} navigation
 */
async function run_on_navigate_callbacks(navigation) {
	const after_navigate = (
		await Promise.all(
			// eslint-disable-next-line @typescript-eslint/await-thenable -- we need to await because they can be asynchronous
			Array.from(on_navigate_callbacks, (fn) => fn(navigation))
		)
	).filter(/** @returns {value is () => void} */ (value) => typeof value === 'function');

	if (after_navigate.length > 0) {
		function cleanup() {
			after_navigate.forEach((fn) => after_navigate_callbacks.delete(fn));
		}

		after_navigate.push(cleanup);
		after_navigate.forEach((fn) => after_navigate_callbacks.add(fn));
	}
}

/**
 * Settles the navigation once `updated` resolves. Returns `false` if a newer navigation
 * superseded it in the meantime, in which case the caller must stop
 * @param {ReturnType<typeof create_navigation>} nav
 * @param {{}} nav_token
 * @param {URL} url
 * @param {{ x: number, y: number } | null | undefined} popped_scroll the scroll position to restore for popstate navigations
 * @param {boolean} reset
 * @param {Promise<void> | undefined} updated
 */
async function finish_navigation(nav, nav_token, url, popped_scroll, reset, updated) {
	await updated;

	if (navigation_token !== nav_token) {
		nav.reject(new Error('navigation aborted'));
		return false;
	}

	restore_scroll(url, reset, popped_scroll);
	if (reset && document.activeElement === document.body) {
		reset_focus(url);
	}

	is_navigating = false;

	nav.fulfil(undefined);

	// Update to.scroll to the actual scroll position after navigation completed
	if (nav.navigation.to) {
		nav.navigation.to.scroll = scroll_state();
	}

	after_navigate_callbacks.forEach((fn) => fn(/** @type {AfterNavigate} */ (nav.navigation)));

	return true;
}

/**
 * Does a full page reload if it wouldn't result in an endless loop in the SPA case
 * @param {URL} url
 * @param {{ id: string | null }} route
 * @param {App.Error} error
 * @param {boolean} [replace_state]
 * @returns {Promise<import('./types.js').NavigationFinished | undefined>}
 */
async function server_fallback(url, route, error, replace_state) {
	if (url.origin === origin && url.pathname === location.pathname && !hydrated) {
		// We would reload the same page we're currently on, which isn't hydrated,
		// which means no SSR, which means we would end up in an endless loop
		return await load_root_error_page({
			error,
			url,
			route
		});
	}

	if (DEV && error.status !== 404) {
		w.full_reload_after_error();

		debugger; // eslint-disable-line
	}

	return await native_navigation(url, replace_state);
}

if (import.meta.hot) {
	import.meta.hot.on('vite:beforeUpdate', () => {
		if (current.error) location.reload();
	});
}

/** @typedef {(typeof PRELOAD_PRIORITIES)['hover'] | (typeof PRELOAD_PRIORITIES)['tap']} PreloadDataPriority */

/**
 * The anchor element whose href is being preloaded. It is reset after navigation
 * or changes when a different anchor element is being preloaded.
 * @type {{ element: Element | SVGAElement | undefined; href: string | SVGAnimatedString | undefined }}
 */
let current_a = { element: undefined, href: undefined };

function setup_preload() {
	/** @type {NodeJS.Timeout} */
	let mousemove_timeout;
	/** @type {HTMLAnchorElement | SVGAElement | undefined} */
	let hovered_a;
	/** @type {PreloadDataPriority} */
	let current_priority;

	function clear_hover_preload() {
		clearTimeout(mousemove_timeout);
		hovered_a?.removeEventListener('mousemove', start_hover_preload);
		hovered_a?.removeEventListener('mouseleave', clear_hover_preload);
		hovered_a = undefined;
	}

	function start_hover_preload() {
		clearTimeout(mousemove_timeout);
		mousemove_timeout = setTimeout(() => {
			if (!hovered_a) return;
			void preload(hovered_a, PRELOAD_PRIORITIES.hover);
		}, 20);
	}

	// Use mouseover initially instead of mousemove to avoid cluttering the event queue
	container.addEventListener('mouseover', (event) => {
		if (!(event.target instanceof Element)) return;

		const a = find_anchor(event.target, container);
		if (!a || a === hovered_a) return;

		clear_hover_preload();
		hovered_a = a;

		const options = get_router_options(a);

		if (
			options.preload_code < PRELOAD_PRIORITIES.hover &&
			options.preload_data < PRELOAD_PRIORITIES.hover
		) {
			// don't add event listeners if no preloading will happen
			return;
		}

		// Instead of just preloading right away, we start a mousemove listener to implement
		// "mouse comes to a rest" behavior. This avoid false positives when you just move
		// your mouse across the screen and happen to pass over a link.
		a.addEventListener('mousemove', start_hover_preload);
		a.addEventListener('mouseleave', clear_hover_preload, { once: true });

		start_hover_preload();
	});

	/** @param {Event} event */
	function tap(event) {
		if (event.defaultPrevented) return;

		const a = find_anchor(/** @type {Element} */ (event.composedPath()[0]), container);
		if (!a) return;

		void preload(a, PRELOAD_PRIORITIES.tap);
	}

	container.addEventListener('mousedown', tap);
	container.addEventListener('touchstart', tap, { passive: true });

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					void _preload_code(new URL(/** @type {HTMLAnchorElement} */ (entry.target).href));
					observer.unobserve(entry.target);
				}
			}
		},
		{ threshold: 0 }
	);

	/**
	 * @param {HTMLAnchorElement | SVGAElement} a
	 * @param {PreloadDataPriority} priority
	 */
	async function preload(a, priority) {
		// we don't want to preload data again if the user has already hovered/tapped
		const interacted =
			a === current_a.element && a?.href === current_a.href && priority >= current_priority;
		if (!a || interacted) return;

		const { url, external, download } = get_link_info(a, base, app.hash);
		if (external || download) return;

		const options = get_router_options(a);

		// we don't want to preload data for a page we're already on
		const same_url = url && get_page_key(current.url) === get_page_key(url);
		if (options.reload || same_url) return;

		if (priority <= options.preload_data) {
			current_a = { element: a, href: a.href };
			// we don't want to preload data again on tap if we've already preloaded it on hover
			current_priority = PRELOAD_PRIORITIES.tap;

			const intent = await get_navigation_intent(url, false);
			if (!intent) return;

			if (DEV) {
				void _preload_data(intent).catch((error) => {
					w.preload_data_failed({ path: intent.url.pathname, message: error.message });
				});
			} else {
				void _preload_data(intent).catch(noop);
			}
		} else if (priority <= options.preload_code) {
			current_a = { element: a, href: a.href };
			current_priority = priority;
			void _preload_code(/** @type {URL} */ (url));
		}
	}

	function after_navigate() {
		observer.disconnect();

		for (const a of container.querySelectorAll('a')) {
			const { url, external, download } = get_link_info(a, base, app.hash);
			if (external || download) continue;

			const options = get_router_options(a);
			if (options.reload) continue;

			if (options.preload_code === PRELOAD_PRIORITIES.viewport) {
				observer.observe(a);
			}

			if (options.preload_code === PRELOAD_PRIORITIES.eager) {
				void _preload_code(/** @type {URL} */ (url));
			}
		}
	}

	after_navigate_callbacks.add(after_navigate);
	after_navigate();
}

/**
 * @param {unknown} error
 * @param {NavigationEvent} event
 * @returns {Promise<App.Error>}
 */
export async function handle_error(error, event) {
	if (error instanceof HandledHttpError) {
		return error.body;
	}

	/** @type {import('@sveltejs/kit/hooks').ClientCaughtError} */
	let caught;

	if (error instanceof HttpError) {
		caught = { kind: 'app', error: error.body };
	} else if (error instanceof SvelteKitError) {
		caught = { kind: 'framework', error: { status: error.status, message: error.text } };
	} else {
		caught = { kind: 'unknown', error };
	}

	if (DEV && caught.kind !== 'app') {
		errored = true;
		w.hmr_reload_after_error();
	}

	const fallback =
		caught.kind === 'unknown' ? { status: 500, message: 'Internal Error' } : caught.error;

	const input = { ...caught, event };
	if (DEV) add_deprecated_handle_error_properties(input, fallback);

	const app_error = await app.hooks.handleError(input);

	// the hook returns only the properties it wants to override; anything it omits
	// (including by returning nothing at all) is inherited from the caught error
	return { ...fallback, ...app_error };
}

/**
 * @template {Function} T
 * @param {Set<T>} callbacks
 * @param {T} callback
 */
function add_navigation_callback(callbacks, callback) {
	onMount(() => {
		callbacks.add(callback);

		return () => {
			callbacks.delete(callback);
		};
	});
}

/**
 * A lifecycle function that runs the supplied `callback` when the current component mounts, and also whenever we navigate to a URL.
 *
 * `afterNavigate` must be called during a component initialization. It remains active as long as the component is mounted.
 * @param {(navigation: AfterNavigate) => void} callback
 * @returns {void}
 */
export function afterNavigate(callback) {
	add_navigation_callback(after_navigate_callbacks, callback);
}

/**
 * A navigation interceptor that triggers before we navigate to a URL, whether by clicking a link, calling `goto(...)`, or using the browser back/forward controls.
 *
 * Calling `cancel()` will prevent the navigation from completing. If `navigation.type === 'leave'` — meaning the user is navigating away from the app (or closing the tab) — calling `cancel` will trigger the native browser unload confirmation dialog. In this case, the navigation may or may not be cancelled depending on the user's response.
 *
 * When a navigation isn't to a SvelteKit-owned route (and therefore controlled by SvelteKit's client-side router), `navigation.to.route.id` will be `null`.
 *
 * If the navigation will (if not cancelled) cause the document to unload — in other words `'leave'` navigations and `'link'` navigations where `navigation.to.route === null` — `navigation.willUnload` is `true`.
 *
 * `beforeNavigate` must be called during a component initialization. It remains active as long as the component is mounted.
 * @param {(navigation: BeforeNavigate) => void} callback
 * @returns {void}
 */
export function beforeNavigate(callback) {
	add_navigation_callback(before_navigate_callbacks, callback);
}

/**
 * A lifecycle function that runs the supplied `callback` immediately before we navigate to a new URL except during full-page navigations.
 *
 * If you return a `Promise`, SvelteKit will wait for it to resolve before completing the navigation. This allows you to — for example — use `document.startViewTransition`. Avoid promises that are slow to resolve, since navigation will appear stalled to the user.
 *
 * If a function (or a `Promise` that resolves to a function) is returned from the callback, it will be called once the DOM has updated.
 *
 * `onNavigate` must be called during a component initialization. It remains active as long as the component is mounted.
 * @param {(navigation: OnNavigate) => import('types').MaybePromise<(() => void) | void>} callback
 * @returns {void}
 */
export function onNavigate(callback) {
	add_navigation_callback(on_navigate_callbacks, callback);
}

/**
 * If called when the page is being updated following a navigation (in `onMount` or `afterNavigate` or an action, for example), this disables SvelteKit's built-in scroll handling.
 * This is generally discouraged, since it breaks user expectations.
 * @returns {void}
 */
export function disableScrollHandling() {
	if (DEV && started && !updating) {
		e.scroll_handling_outside_navigation();
	}

	if (updating || !started) {
		disable_scroll_handling();
	}
}

let warned_on_invalidate_all = false;
let warned_on_replace_state = false;
let warned_on_push_state = false;
let warned_on_replace_state_function = false;

/**
 * @param {string | URL} url
 * @param {'goto' | 'pushState' | 'replaceState'} caller
 */
async function resolve_intent(url, caller) {
	const resolved = new URL(resolve_url(url));

	if (resolved.origin !== origin) {
		e.navigation_external_url({ caller, url: String(url) });
	}

	const intent = await get_navigation_intent(resolved, false);

	if (!intent) {
		e.navigation_route_missing({ caller, url: String(url) });
	}

	return intent;
}

/**
 * Allows you to navigate programmatically to a given route, with control over details such as whether scroll and focus are reset
 * (as they would be with a regular navigation) or preserved.
 *
 * Returns a Promise that resolves when SvelteKit navigates (or fails to navigate, in which case the promise rejects) or the state change has been applied.
 *
 * `goto` is intended for navigations to routes that belong to the app, and will reject if a route cannot be resolved.
 * For external URLs, use `window.location = url` to perform a full-page navigation instead of calling `goto(url)`.
 *
 * @param {string | URL} url Where to navigate to. Note that if you've set [`config.paths.base`](https://svelte.dev/docs/kit/@sveltejs-kit-vite#paths) and the URL is root-relative, you need to prepend the base path if you want to navigate within the app.
 * @param {GotoOptions} [opts] Options related to the navigation
 * @returns {Promise<void>}
 */
export async function goto(url, opts = {}) {
	if (DEV) {
		if ('replaceState' in opts && !warned_on_replace_state) {
			warned_on_replace_state = true;
			w.goto_replace_state_deprecated({ value: String(opts.replaceState) });
		}

		if ('noScroll' in opts || 'keepFocus' in opts) {
			e.goto_options_removed();
		}
	}

	const replace = opts.replace ?? opts.replaceState ?? false;

	const intent = await resolve_intent(url, 'goto');

	if (opts.shallow) {
		return update_state(
			intent,
			opts.state ?? {},
			{
				replace,
				persist_state: opts.persistState ?? false,
				reset: opts.reset ?? false
			},
			'goto'
		);
	}

	if (DEV && 'invalidateAll' in opts && !warned_on_invalidate_all) {
		warned_on_invalidate_all = true;
		w.goto_invalidate_all_deprecated({ value: String(opts.invalidateAll) });
	}

	return _goto(
		intent.url,
		{ ...opts, replace, refreshAll: opts.refreshAll ?? opts.invalidateAll },
		0,
		{},
		intent
	);
}

/**
 * Causes any `load` functions belonging to the currently active page to re-run if they depend on the `url` in question, via `fetch` or `depends`. Returns a `Promise` that resolves when the page is subsequently updated.
 *
 * If the argument is given as a `string` or `URL`, it must resolve to the same URL that was passed to `fetch` or `depends` (including query parameters).
 * To create a custom identifier, use a string beginning with `[a-z]+:` (e.g. `custom:state`) — this is a valid URL.
 *
 * The `function` argument can be used define a custom predicate. It receives the full `URL` and causes `load` to rerun if `true` is returned.
 * This can be useful if you want to invalidate based on a pattern instead of a exact match.
 *
 * ```ts
 * // Example: Match '/path' regardless of the query parameters
 * import { invalidate } from '$app/navigation';
 *
 * invalidate((url) => url.pathname === '/path');
 * ```
 * @param {string | URL | ((url: URL) => boolean)} resource The invalidated URL
 * @param {boolean} [keepState] If `true`, the current `page.state` will be preserved. Otherwise, it will be reset to an empty object. `false` by default.
 * @returns {Promise<void>}
 */
export function invalidate(resource, keepState = false) {
	push_invalidated(resource);
	return _invalidate(!keepState);
}

/**
 * @param {string | URL | ((url: URL) => boolean)} resource The invalidated URL
 */
function push_invalidated(resource) {
	if (typeof resource === 'function') {
		invalidated.push(resource);
	} else {
		const { href } = new URL(resource, location.href);
		invalidated.push((url) => url.href === href);
	}
}

/**
 * Causes all `load` and `query` functions belonging to the currently active page to re-run. Returns a `Promise` that resolves when the page is subsequently updated.
 *
 * Note that this resets `page.state` to an empty object. If you want to preserve `page.state` (for example when using [shallow routing](https://svelte.dev/docs/kit/shallow-routing)), use `refreshAll` instead.
 *
 * @deprecated Use [`refreshAll`](https://svelte.dev/docs/kit/$app-navigation#refreshAll) instead. Unlike `invalidateAll`, `refreshAll` does not reset `page.state`.
 * @returns {Promise<void>}
 */
export function invalidateAll() {
	force_invalidation = true;
	return _invalidate();
}

/**
 * Causes all currently active remote functions to refresh, and all `load` functions belonging to the currently active page to re-run.
 * Returns a `Promise` that resolves when the page is subsequently updated.
 * @returns {Promise<void>}
 */
export function refreshAll() {
	force_invalidation = true;
	return _invalidate(false);
}

/**
 * Programmatically preloads the given page, which means
 *  1. ensuring that the code for the page is loaded, and
 *  2. calling the page's load function with the appropriate options.
 *
 * This is the same behaviour that SvelteKit triggers when the user taps or mouses over an `<a>` element with `data-sveltekit-preload-data`.
 * If the next navigation is to `href`, the values returned from load will be used, making navigation instantaneous.
 * Returns a Promise that resolves with the result of running the new route's `load` functions once the preload is complete.
 *
 * @param {string} href Page to preload
 * @returns {Promise<({ type: 'loaded'; data: Record<string, any> } | { type: 'redirect'; location: string } | { type: 'error'; error: App.Error }) & { status: number; }>}
 */
export async function preloadData(href) {
	const url = resolve_url(href);
	const intent = await get_navigation_intent(url, false);

	if (!intent) {
		e.preload_url_outside_app({ url: url.href });
	}

	/** @type {Awaited<ReturnType<typeof _preload_data>>} */
	let result;

	try {
		result = await _preload_data(intent);
	} catch (error) {
		// `load_route` throws the handled error (an `App.Error` with a `status`)
		// when a preload fails, so surface it in the documented `{ type: 'error' }` shape
		const handled = /** @type {App.Error & { status?: number }} */ (error);
		return {
			type: 'error',
			status: handled?.status ?? 500,
			error: handled
		};
	}

	if (result.type === 'redirect') {
		return {
			type: result.type,
			status: result.status,
			location: result.location
		};
	}

	const { status, data } = result.props.page ?? page;

	return { type: result.type, status, data };
}

/**
 * Programmatically imports the code for routes that haven't yet been fetched.
 * Typically, you might call this to speed up subsequent navigation.
 *
 * Takes a route ID such as `/about` or `/blog/[slug]`. Unlike pathnames, route IDs
 * are never prefixed with the app's [base path](https://svelte.dev/docs/kit/@sveltejs-kit-vite#paths).
 * If you have a pathname rather than a route ID, you can convert it with
 * [`match`](https://svelte.dev/docs/kit/$app-paths#match) from `$app/paths`:
 *
 * ```js
 * import { match } from '$app/paths';
 * import { preloadCode } from '$app/navigation';
 *
 * const matched = await match('/blog/hello-world');
 * if (matched) await preloadCode(matched.id);
 * ```
 *
 * Unlike `preloadData`, this won't call `load` functions.
 * Returns a Promise that resolves when the modules have been imported.
 *
 * @param {import('$app/types').RouteId} id
 * @returns {Promise<void>}
 */
export async function preloadCode(id) {
	if (DEV && id[0] !== '/') {
		e.preload_invalid_route_id({ id });
	}

	const route = __SVELTEKIT_CLIENT_ROUTING__
		? routes.find((r) => r.id === id)
		: (route_id_cache.get(id) ?? (await load_route_by_id(id)));

	if (route === ENDPOINT_ONLY) {
		if (DEV) {
			w.preload_code_endpoint_only({ id });
		}

		return;
	}

	if (!route) {
		if (DEV) {
			// warn rather than throw, since under client routing an endpoint-only route id is
			// indistinguishable from a typo — the client manifest only contains routes with a `+page`
			// the most common migration mistake is passing a pathname, which used to work
			const candidates = [id];
			if (base && id.startsWith(base)) candidates.push(id.slice(base.length) || '/');

			if (
				__SVELTEKIT_CLIENT_ROUTING__ &&
				candidates.some((path) => routes.some((r) => r.exec(path)))
			) {
				w.preload_route_is_pathname({ id });
			} else {
				w.preload_route_missing({ id });
			}
		}

		return;
	}

	await load_route_nodes(route);
}

/**
 * Programmatically create a new history entry with the given `page.state`. Used for [shallow routing](https://svelte.dev/docs/kit/shallow-routing).
 *
 * @deprecated Use `goto(url, { state, shallow: true })` instead.
 * @param {string | URL} url
 * @param {App.PageState} state
 * @returns {Promise<void>}
 */
export async function pushState(url, state) {
	if (DEV && !warned_on_push_state) {
		warned_on_push_state = true;
		w.push_state_deprecated();
	}

	const intent = await resolve_intent(url, 'pushState');

	await update_state(
		intent,
		state,
		{ replace: false, persist_state: false, reset: false },
		'pushState'
	);
}

/**
 * Programmatically replace the current history entry with the given `page.state`. Used for [shallow routing](https://svelte.dev/docs/kit/shallow-routing).
 *
 * @deprecated Use `goto(url, { state, shallow: true, replace: true })` instead.
 * @param {string | URL} url
 * @param {App.PageState} state
 * @returns {Promise<void>}
 */
export async function replaceState(url, state) {
	if (DEV && !warned_on_replace_state_function) {
		warned_on_replace_state_function = true;
		w.replace_state_deprecated();
	}

	const intent = await resolve_intent(url, 'replaceState');

	await update_state(
		intent,
		state,
		{ replace: true, persist_state: false, reset: false },
		'replaceState'
	);
}

/**
 * @param {NavigationIntent} intent
 * @param {App.PageState} state
 * @param {{ replace: boolean; persist_state: boolean; reset: boolean; }} options
 * @param {'goto' | 'pushState' | 'replaceState'} caller
 */
async function update_state(intent, state, { replace, persist_state, reset }, caller) {
	const url = intent.url;
	const previous_snapshot_registrations = current_registrations();

	if (DEV && !started) {
		e.navigation_before_start({ caller });
	}

	const nav =
		// For backwards compatibility we don't trigger navigation hooks etc for push/replaceState
		caller === 'goto' ? _before_navigate({ url, type: 'goto', intent, shallow: true }) : undefined;

	if (!nav && caller === 'goto') return;

	const nav_token = {};

	if (nav) {
		navigation_token = invalidation_token = nav_token;
		is_navigating = true;
		set_navigation(nav.navigation);
		updating = true;
	}

	if (replace) {
		delete_navigation_snapshot(current_history_index);
	} else {
		capture_scroll(current_history_index);
		capture_navigation_snapshot(current_history_index);
	}
	if (reset) current_reset_index += 1;

	// as above, serialize-then-parse to prevent bugs
	const serialized_state = stringify(state);
	state = parse(serialized_state);

	const entry = {
		[HISTORY_METADATA_KEY]: /** @satisfies {HistoryMetadata} */ ({
			historyIndex: (current_history_index += replace ? 0 : 1),
			navigationIndex: current_navigation_index,
			pageUrl: page.url.href,
			state: serialized_state,
			persistState: persist_state,
			resetIndex: current_reset_index
		})
	};

	const fn = replace ? history.replaceState : history.pushState;
	fn.call(history, entry, '', url);
	set_history_options(current_history_index, entry[HISTORY_METADATA_KEY]);

	if (!replace) {
		has_navigated = true;
		clear_onward_history(current_history_index, current_navigation_index);
	}

	if (nav) {
		await run_on_navigate_callbacks(/** @type {OnNavigate} */ (nav.navigation));
	}

	blur_active_element(reset);

	update_page({
		state,
		shallow: {
			params: intent?.params ?? null,
			route: intent ? { id: intent.route.id } : null,
			url
		}
	});

	if (nav) {
		const finished = await finish_navigation(nav, nav_token, url, null, reset, settled());
		if (!finished) return;
	}

	restore_navigation_snapshot(current_history_index, previous_snapshot_registrations);

	if (nav) {
		set_navigation(null);
		updating = false;
	}
}

/**
 * Updates the `form` property of the current page with the given data and updates `page.status`.
 * In case of an error, it renders the nearest error page. In case of a redirect, it navigates to
 * the redirect location.
 * @template {Record<string, unknown> | undefined} Success
 * @template {Record<string, unknown> | undefined} Failure
 * @param {ActionResult<Success, Failure>} result
 * @returns {Promise<void>}
 */
export async function applyAction(result) {
	if (result.type === 'redirect') {
		await _goto(result.location, { refreshAll: true });
		return;
	}

	if (result.type === 'error') {
		await set_nearest_error_page(result.error);
	} else {
		update_page({
			form: result.data,
			status: result.status
		});

		/** @type {Record<string, any>} */
		// this brings Svelte's view of the world in line with SvelteKit's
		// after use:enhance reset the form....
		props.form = null;

		// ...so that setting the `form` prop takes effect and isn't ignored
		await tick();
		props.form = result.data;

		if (result.type === 'success') {
			reset_focus(/** @type {URL} */ (page.url));
		}
	}
}

/**
 * Whether a submission should update the current page in place rather than navigating — either
 * because it lands where we already are, or because the result carries no location at all
 * (hand-constructed results, which have always applied in place).
 * @param {string | undefined} value
 */
export function is_current_location(value) {
	if (value === undefined) return true;

	const destination = resolve_url(value);
	const current = new URL(location.href);
	if (destination.origin !== current.origin || destination.pathname !== current.pathname)
		return false;

	const keys = new Set([...destination.searchParams.keys(), ...current.searchParams.keys()]);
	for (const key of keys) {
		const destination_values = destination.searchParams.getAll(key).sort();
		const current_values = current.searchParams.getAll(key).sort();

		if (
			destination_values.length !== current_values.length ||
			destination_values.some((value, i) => value !== current_values[i])
		) {
			return false;
		}
	}

	return true;
}

/**
 * Navigate to where a form submission should land, rendering that page with the given result
 * — what the browser would do for a native submission.
 * @param {string} location
 * @param {ActionResult} result
 * @param {boolean} refresh_all
 * @returns {Promise<void>}
 */
export function apply_action_navigation(location, result, refresh_all) {
	return _goto(location, {
		type: 'form',
		refreshAll: refresh_all,
		action_result: result
	});
}

/**
 * @param {App.Error} error
 */
export async function set_nearest_error_page(error) {
	const url = new URL(location.href);

	const { branch, route } = current;
	if (!route) return;

	const error_branch = await load_nearest_error_page(current.branch.length, branch, route.errors);
	if (error_branch) {
		const navigation_result = await get_navigation_result_from_branch({
			url,
			params: current.params,
			branch: error_branch,
			error,
			errors: route.errors,
			route
		});

		current = { ...navigation_result.state, nav: current.nav };

		apply_navigation_result(navigation_result);

		void tick().then(() => reset_focus(current.url));
	}
}

function _start_router() {
	history.scrollRestoration = 'manual';

	addEventListener('beforeunload', (e) => {
		let should_block = false;

		persist_state();

		if (!is_navigating) {
			const nav = create_navigation(current, undefined, null, 'leave');

			// If we're navigating, beforeNavigate was already called. If we end up in here during navigation,
			// it's due to an external or full-page-reload link, for which we don't want to call the hook again.
			/** @type {BeforeNavigate} */
			const navigation = {
				...nav.navigation,
				cancel: () => {
					should_block = true;
					nav.reject(new Error('navigation cancelled'));
				}
			};

			before_navigate_callbacks.forEach((fn) => fn(navigation));
		}

		if (should_block) {
			e.preventDefault();
			e.returnValue = '';
		}
	});
	addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			persist_state();
		} else {
			// the tab just became visible — a good time to check for a new deployment
			void updated.check();
		}
	});

	addEventListener('focus', () => {
		void updated.check();
	});

	// @ts-expect-error this isn't supported everywhere yet
	if (!navigator.connection?.saveData) {
		setup_preload();
	}

	/** @param {MouseEvent} event */
	container.addEventListener('click', async (event) => {
		// Adapted from https://github.com/visionmedia/page.js
		// MIT license https://github.com/visionmedia/page.js#license
		if (event.button) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		if (event.defaultPrevented) return;

		const a = find_anchor(/** @type {Element} */ (event.composedPath()[0]), container);
		if (!a) return;

		const { url, external, target, download } = get_link_info(a, base, app.hash);
		if (!url) return;

		// bail out before `beforeNavigate` if link opens in a different tab
		if (target === '_parent' || target === '_top') {
			if (window.parent !== window) return;
		} else if (target && target !== '_self') {
			return;
		}

		const options = get_router_options(a);
		const is_svg_a_element = a instanceof SVGAElement;

		// Ignore URL protocols that differ to the current one and are not http(s) (e.g. `mailto:`, `tel:`, `myapp:`, etc.)
		// This may be wrong when the protocol is x: and the link goes to y:.. which should be treated as an external
		// navigation, but it's not clear how to handle that case and it's not likely to come up in practice.
		// See:
		// - https://github.com/sveltejs/kit/issues/4045
		// - https://github.com/sveltejs/kit/issues/5725
		// - https://github.com/sveltejs/kit/issues/6496
		if (
			!is_svg_a_element &&
			url.protocol !== location.protocol &&
			!(url.protocol === 'https:' || url.protocol === 'http:')
		)
			return;

		if (download) return;

		const [nonhash, hash] = (app.hash ? url.hash.replace(/^#/, '') : url.href).split('#');
		const same_pathname = nonhash === strip_hash(location);

		// Ignore the following but fire beforeNavigate
		if (external || (options.reload && (!same_pathname || !hash))) {
			if (_before_navigate({ url, type: 'link', event })) {
				// set `navigating` to `true` to prevent `beforeNavigate` callbacks
				// being called when the page unloads
				is_navigating = true;
			} else {
				event.preventDefault();
			}

			return;
		}

		// Check if new url only differs by hash and use the browser default behavior in that case
		// This will ensure the `hashchange` event is fired
		// Removing the hash does a full page navigation in the browser, so make sure a hash is present
		if (hash !== undefined && same_pathname) {
			// If we are trying to navigate to the same hash, we should only
			// attempt to scroll to that element and avoid any history changes.
			// Otherwise a fragment navigation creates a new entry with a null history state,
			// which browsers handle differently: https://github.com/whatwg/html/issues/6213
			const [, current_hash] = current.url.href.split('#');
			if (current_hash === hash) {
				event.preventDefault();

				// We're already on /# and click on a link that goes to /#, or we're on
				// /#top and click on a link that goes to /#top. In those cases just go to
				// the top of the page, and avoid a history change.
				if (hash === '' || (hash === 'top' && a.ownerDocument.getElementById('top') === null)) {
					scrollTo({ top: 0 });
				} else {
					const element = a.ownerDocument.getElementById(decodeURIComponent(hash));
					if (element) {
						element.scrollIntoView();
						element.focus();
					}
				}

				return;
			}
			// set this flag to distinguish between navigations triggered by
			// clicking a hash link and those triggered by popstate. We gotta retrieve
			// history metadata here because the hashchange event will occur after history.state was updated
			hash_navigating = {
				.../** @type {HistoryMetadata} */ (get_history_metadata()),
				resetIndex: current_reset_index + (options.reset ? 1 : 0)
			};

			capture_scroll(current_history_index);

			update_url(url);

			if (!options.replace_state) return;

			// hashchange event shouldn't occur if the router is replacing state.
			hash_navigating = null;
		}

		event.preventDefault();

		// allow the browser to repaint before navigating —
		// this prevents INP scores being penalised
		await new Promise((fulfil) => {
			requestAnimationFrame(() => {
				setTimeout(fulfil, 0);
			});

			setTimeout(fulfil, 100); // fallback for edge case where rAF doesn't fire because e.g. tab was backgrounded
		});

		const changed = url.href !== location.href;

		await _goto(url, {
			type: 'link',
			reset: options.reset,
			replace: options.replace_state ?? !changed,
			refreshAll: !changed,
			event
		});
	});

	container.addEventListener('submit', (event) => {
		if (event.defaultPrevented) return;

		const form = /** @type {HTMLFormElement} */ (
			HTMLFormElement.prototype.cloneNode.call(event.target)
		);

		const submitter = /** @type {HTMLButtonElement | HTMLInputElement | null} */ (event.submitter);

		const target = submitter?.formTarget || form.target;

		if (target === '_blank') return;

		const method = submitter?.formMethod || form.method;

		if (method !== 'get') return;

		// It is impossible to use form actions with hash router, so we just ignore handling them here
		const url = new URL(
			(submitter?.hasAttribute('formaction') && submitter?.formAction) || form.action
		);

		if (is_external_url(url, base, false)) return;

		const event_form = /** @type {HTMLFormElement} */ (event.target);

		const options = get_router_options(event_form);
		if (options.reload) return;

		event.preventDefault();
		event.stopPropagation();

		const data = new FormData(event_form, submitter);

		// @ts-expect-error `URLSearchParams(fd)` is kosher, but typescript doesn't know that
		url.search = new URLSearchParams(data).toString();

		void navigate({
			type: 'form',
			url,
			reset: options.reset,
			replace_state: options.replace_state ?? url.href === location.href,
			event
		});
	});

	addEventListener('popstate', async (event) => {
		const history_metadata = get_history_metadata(event.state);

		if (history_metadata?.historyIndex) {
			const history_index = history_metadata.historyIndex;
			const source_info = history_info[current_history_index];

			// if a popstate-driven navigation is cancelled, we need to counteract it
			// with history.go, which means we end up back here, hence this check
			if (history_index === current_history_index) return;

			navigation_token = invalidation_token = {};

			const delta = history_index - current_history_index;
			const reset_index = history_metadata.resetIndex;
			const reset = reset_index !== (source_info?.resetIndex ?? current_reset_index);
			const scroll = history_info[history_index]?.scroll;
			const state = parse(history_metadata.state);
			const url = new URL(history_metadata.pageUrl ?? location.href);
			const navigation_index = history_metadata.navigationIndex;
			const is_hash_change =
				current.url && (location.href + current.url.href).includes('#') // check if even has a hash
					? strip_hash(location) === strip_hash(current.url)
					: false;
			const shallow =
				navigation_index === current_navigation_index &&
				((has_navigated &&
					(history_metadata.pageUrl === undefined || history_metadata.pageUrl === location.href)) ||
					is_hash_change);
			const shallow_url = history_metadata.pageUrl ? new URL(location.href) : null;

			// the browser has already traversed, so record the source entry and move the
			// indices before anything async: a navigation that starts while this one
			// resolves must build on the entry we are actually on
			const previous_history_index = current_history_index;
			const previous_navigation_index = current_navigation_index;
			const previous_reset_index = current_reset_index;
			capture_scroll(previous_history_index);
			if (!shallow) capture_snapshot(previous_navigation_index);
			capture_navigation_snapshot(previous_history_index);
			current_history_index = history_index;
			current_navigation_index = navigation_index;
			current_reset_index = reset_index;

			const token = navigation_token;
			const shallow_intent = shallow_url
				? await get_navigation_intent(shallow_url, false)
				: undefined;
			if (navigation_token !== token) return;
			const shallow_target = shallow_url
				? {
						params: shallow_intent?.params ?? null,
						route: shallow_intent ? { id: shallow_intent.route.id } : null,
						url: shallow_url
					}
				: null;

			if (shallow) {
				// We don't need to navigate, we just need to update scroll and/or state.
				// This happens with hash links and `pushState`/`replaceState`. The
				// exception is if we haven't navigated yet, since we could have
				// got here after a modal navigation then a reload

				blur_active_element(reset);

				update_page({
					state,
					shallow: shallow_target
				});

				update_url(url);

				if (reset && scroll) scrollTo(scroll.x, scroll.y);
				restore_navigation_snapshot(current_history_index, current_registrations());
				// the token above aborted any in-flight navigation, and nothing else will clear it
				is_navigating = false;
				set_navigation(null);
				return;
			}

			await navigate({
				type: 'popstate',
				url,
				reset,
				popped: {
					state,
					scroll,
					delta,
					shallow: shallow_target
				},
				block: () => {
					current_history_index = previous_history_index;
					current_navigation_index = previous_navigation_index;
					current_reset_index = previous_reset_index;
					history.go(-delta);
				},
				nav_token: token,
				event
			});
		} else {
			// since popstate event is also emitted when an anchor referencing the same
			// document is clicked, we have to check that the router isn't already handling
			// the navigation. otherwise we would be updating the page store twice.
			if (!hash_navigating) {
				const url = new URL(location.href);
				update_url(url);

				// if the user edits the hash via the browser URL bar, trigger a full-page
				// reload to align with pathname router behavior
				if (app.hash) {
					location.reload();
				}
			}
		}
	});

	addEventListener('hashchange', () => {
		// if the hashchange happened as a result of clicking on a link,
		// we need to update history, otherwise we have to leave it alone
		if (hash_navigating) {
			const history_metadata = hash_navigating;
			hash_navigating = null;
			current_reset_index = history_metadata.resetIndex;
			history.replaceState(
				{
					...history.state,
					[HISTORY_METADATA_KEY]: {
						...history_metadata,
						historyIndex: ++current_history_index,
						navigationIndex: current_navigation_index
					}
				},
				'',
				location.href
			);
			set_history_options(current_history_index, history_metadata);
		}
	});

	// fix link[rel=icon], because browsers will occasionally try to load relative
	// URLs after a pushState/replaceState, resulting in a 404 — see
	// https://github.com/sveltejs/kit/issues/3748#issuecomment-1125980897
	for (const link of document.querySelectorAll('link')) {
		if (ICON_REL_ATTRIBUTES.has(link.rel)) {
			link.href = link.href; // eslint-disable-line
		}
	}

	addEventListener('pageshow', (event) => {
		// If the user navigates to another site and then uses the back button and
		// bfcache hits, we need to set navigating to null, the site doesn't know
		// the navigation away from it was successful.
		// Info about bfcache here: https://web.dev/bfcache
		if (event.persisted) {
			set_navigation(null);

			// pages restored from bfcache don't re-run the `start` script
			// so we need to restore the scroll position manually here
			const scroll = history_info[current_history_index]?.scroll;
			if (scroll) {
				scrollTo(scroll.x, scroll.y);
			}
		}
	});

	/**
	 * @param {URL} url
	 */
	function update_url(url) {
		current.url = url;
		update_page({ url });
	}
}

/**
 * @param {HTMLElement} target
 * @param {import('./types.js').HydrateOptions} opts
 * @returns {Promise<void>}
 */
async function _hydrate(
	target,
	{ status, error, node_ids, params, route, server_route, data: server_data_nodes, form }
) {
	hydrated = true;

	const url = new URL(location.href);

	/** @type {import('types').CSRRoute | undefined} */
	let parsed_route;

	if (__SVELTEKIT_CLIENT_ROUTING__) {
		if (!__SVELTEKIT_EMBEDDED__) {
			// See https://github.com/sveltejs/kit/pull/4935#issuecomment-1328093358 for one motivation
			// of determining the params on the client side.
			({ params = {}, route = { id: null } } = (await get_navigation_intent(url, false)) || {});
		}

		parsed_route = routes.find(({ id }) => id === route.id);
	} else {
		// undefined in case of 404
		if (server_route) {
			parsed_route = route = parse_and_cache_server_route(server_route);
		} else {
			route = { id: null };
			params = {};
		}
	}

	/** @type {import('./types.js').NavigationFinished | undefined} */
	let result;
	let should_hydrate = true;

	try {
		const branch_promises = node_ids.map(async (n, i) => {
			const server_data_node = server_data_nodes[i];
			// Type isn't completely accurate, we still need to deserialize uses
			if (server_data_node?.uses) {
				server_data_node.uses = deserialize_uses(server_data_node.uses);
			}

			return load_node({
				loader: app.nodes[n],
				url,
				params,
				route,
				parent: async () => {
					const data = {};
					for (let j = 0; j < i; j += 1) {
						Object.assign(data, (await branch_promises[j]).data);
					}
					return data;
				},
				server_data_node: create_data_node(server_data_node)
			});
		});

		/** @type {Array<import('./types.js').BranchNode | undefined>} */
		const branch = await Promise.all(branch_promises);

		// server-side will have compacted the branch, reinstate empty slots
		// so that error boundaries can be lined up correctly
		if (parsed_route) {
			const layouts = parsed_route.layouts;
			for (let i = 0; i < layouts.length; i++) {
				if (!layouts[i]) {
					branch.splice(i, 0, undefined);
				}
			}
		}

		result = await get_navigation_result_from_branch({
			url,
			params,
			branch,
			status,
			error,
			errors: parsed_route?.errors, // TODO load earlier?
			form,
			route: parsed_route ?? null
		});
	} catch (error) {
		if (error instanceof Redirect) {
			// this is a real edge case — `load` would need to return
			// a redirect but only in the browser
			return await native_navigation(new URL(error.location, location.href));
		}

		const handled_error = await handle_error(error, { url, params, route });

		result = await load_root_error_page({
			error: handled_error,
			url,
			route
		});

		target.textContent = '';
		should_hydrate = false;
	}

	// Exit early when we encounter a redirect while loading the root error page.
	// In this case, `initialize` will be called later on
	if (!result) return;

	if (result.props.page) {
		const history_metadata = get_history_metadata();
		result.props.page.state = history_metadata?.persistState ? parse(history_metadata.state) : {};
	}

	await initialize(result, target, should_hydrate);
}

/**
 * @param {URL} url
 * @param {boolean[]} invalid
 * @returns {Promise<import('types').ServerNodesResponse | import('types').ServerRedirectNode>}
 */
async function load_data(url, invalid) {
	for (const key of url.searchParams.keys()) {
		if (key.startsWith('x-sveltekit-')) {
			e.reserved_query_parameter({ key });
		}
	}

	const data_url = new URL(url);
	data_url.pathname = add_data_suffix(url.pathname);
	if (url.pathname.endsWith('/')) {
		data_url.searchParams.append(TRAILING_SLASH_PARAM, '1');
	}
	data_url.searchParams.append(INVALIDATED_PARAM, invalid.map((i) => (i ? '1' : '0')).join(''));

	// use window.fetch directly to allow using a 3rd party-patched fetch implementation
	const fetcher = DEV ? dev_fetch : window.fetch;
	const res = await fetcher(data_url.href, {});

	// detect new deployments from the response header
	notify_version(res.headers.get('x-sveltekit-version'));

	if (!res.ok) {
		// if `__data.json` doesn't exist or the server has an internal error,
		// avoid parsing the HTML error page as a JSON
		/** @type {App.Error} */
		let error = { status: res.status, message: 'Internal Error' };

		if (res.headers.get('content-type')?.includes('application/json')) {
			error = { status: res.status, ...(await res.json()) };
		} else if (res.status === 404) {
			error.message = 'Not Found';
		}

		throw new HandledHttpError(error);
	}

	return new Promise((resolve, reject) => {
		process_stream(resolve, res).catch(reject);
	});

	// TODO edge case handling necessary? stream() read fails?
}

/**
 * @param {(value: ServerNodesResponse | ServerRedirectNode) => void} resolve
 * @param {Response} res
 * @returns {Promise<void>}
 */
async function process_stream(resolve, res) {
	const reader = /** @type {ReadableStream<Uint8Array>} */ (res.body).getReader();

	/**
	 * Map of deferred promises that will be resolved by a subsequent chunk of data
	 * @type {Map<string, import('types').Deferred>}
	 */
	const deferreds = new Map();

	/**
	 * @param {any} data
	 */
	function deserialize(data) {
		return devalue.unflatten(data, {
			...app.decoders,
			Promise: (id) => {
				return new Promise((fulfil, reject) => {
					deferreds.set(id, { fulfil, reject });
				});
			}
		});
	}

	for await (const node of read_ndjson(reader)) {
		if (node.type === 'redirect') {
			return resolve(node);
		}

		if (node.type === 'data') {
			// This is the first (and possibly only, if no pending promises) chunk
			node.nodes?.forEach((/** @type {any} */ node) => {
				if (node?.type === 'data') {
					node.uses = deserialize_uses(node.uses);
					node.data = deserialize(node.data);
				}
			});

			resolve(node);
		} else if (node.type === 'chunk') {
			// This is a subsequent chunk containing deferred data
			const { id, data, error } = node;
			const deferred = /** @type {import('types').Deferred} */ (deferreds.get(id));
			deferreds.delete(id);

			if (error) {
				deferred.reject(deserialize(error));
			} else {
				deferred.fulfil(deserialize(data));
			}
		}
	}
}

/**
 * @param {any} uses
 * @return {import('types').Uses}
 */
function deserialize_uses(uses) {
	return {
		dependencies: new Set(uses?.dependencies ?? []),
		params: new Set(uses?.params ?? []),
		parent: !!uses?.parent,
		route: !!uses?.route,
		url: !!uses?.url,
		search_params: new Set(uses?.search_params ?? [])
	};
}

/**
 * @template {NavigationType} T
 * @param {import('./types.js').NavigationState} current
 * @param {import('./types.js').NavigationIntent | undefined} intent
 * @param {URL | null} url
 * @param {T} type
 * @param {{ x: number, y: number } | null} [target_scroll] The scroll position for the target (for popstate navigations)
 * @param {boolean} [shallow]
 * @param {{ params: Record<string, string> | null; route: { id: string } | null; url: URL }} [target]
 */
function create_navigation(
	current,
	intent,
	url,
	type,
	target_scroll = null,
	shallow = false,
	target
) {
	/** @type {(value: any) => void} */
	let fulfil;

	/** @type {(error: any) => void} */
	let reject;

	const complete = new Promise((f, r) => {
		fulfil = f;
		reject = r;
	});

	// Handle any errors off-chain so that it doesn't show up as an unhandled rejection
	complete.catch(noop);

	/** @type {(Navigation | AfterNavigate) & { type: T }} */
	const navigation = /** @type {any} */ ({
		from: {
			params: current.params,
			route: { id: current.route?.id ?? null },
			url: current.url,
			scroll: scroll_state()
		},
		to: url && {
			params: target ? target.params : (intent?.params ?? null),
			route: { id: target ? (target.route?.id ?? null) : (intent?.route?.id ?? null) },
			url: target?.url ?? url,
			scroll: target_scroll
		},
		willUnload: !shallow && !intent,
		type,
		shallow,
		complete
	});

	return {
		navigation,
		// @ts-expect-error
		fulfil,
		// @ts-expect-error
		reject
	};
}

/**
 * @param {URL} url
 * @returns {URL}
 */
function decode_hash(url) {
	const new_url = new URL(url);
	// Safari, for some reason, does change # to %23, when entered through the address bar
	new_url.hash = decodeURIComponent(url.hash);
	return new_url;
}

if (DEV) {
	if (import.meta.hot) {
		import.meta.hot.on('vite:beforeUpdate', () => {
			if (errored) {
				location.reload();
			}
		});
	}
}

/**
 * @param {NavigationFinished} result
 */
function apply_navigation_result(result) {
	update_page(result.props.page);

	props.tree.data = result.props.tree.data;
	props.tree.child = result.props.tree.child;

	if ('form' in result.props) {
		props.form = result.props.form;
	}

	if ('error' in result.props) {
		props.error = result.props.error;
	}
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsaWVudC5qcz92PTcwZjU5MDRmIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGluamVjdFF1ZXJ5IGFzIF9fdml0ZV9faW5qZWN0UXVlcnkgfSBmcm9tIFwiL0B2aXRlL2NsaWVudFwiO2ltcG9ydCB7IGNyZWF0ZUhvdENvbnRleHQgYXMgX192aXRlX19jcmVhdGVIb3RDb250ZXh0IH0gZnJvbSBcIi9Adml0ZS9jbGllbnRcIjtpbXBvcnQubWV0YS5ob3QgPSBfX3ZpdGVfX2NyZWF0ZUhvdENvbnRleHQoXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvY2xpZW50L2NsaWVudC5qcz92PTcwZjU5MDRmXCIpOy8qKiBAaW1wb3J0IHsgTG9hZEV2ZW50LCBOYXZpZ2F0aW9uRXZlbnQgfSBmcm9tICdAc3ZlbHRlanMva2l0JyAqL1xuLyoqIEBpbXBvcnQgeyBBY3Rpb25SZXN1bHQgfSBmcm9tICckYXBwL2Zvcm1zJyAqL1xuLyoqIEBpbXBvcnQgeyBBZnRlck5hdmlnYXRlLCBCZWZvcmVOYXZpZ2F0ZSwgR290b09wdGlvbnMsIE5hdmlnYXRpb24sIE5hdmlnYXRpb25UYXJnZXQsIE5hdmlnYXRpb25UeXBlLCBPbk5hdmlnYXRlIH0gZnJvbSAnJGFwcC9uYXZpZ2F0aW9uJyAqL1xuLyoqIEBpbXBvcnQgeyBSZW1vdGVGdW5jdGlvbkRhdGFOb2RlLCBTZXJ2ZXJOb2Rlc1Jlc3BvbnNlLCBTZXJ2ZXJSZWRpcmVjdE5vZGUgfSBmcm9tICd0eXBlcycgKi9cbi8qKiBAaW1wb3J0IHsgTmF2aWdhdGlvbkZpbmlzaGVkLCBOYXZpZ2F0aW9uSW50ZW50IH0gZnJvbSAnLi90eXBlcy5qcycgKi9cbi8qKiBAaW1wb3J0IHsgQ2FjaGVFbnRyeSB9IGZyb20gJy4vcmVtb3RlLWZ1bmN0aW9ucy9jYWNoZS5zdmVsdGUuanMnICovXG4vKiogQGltcG9ydCB7IFF1ZXJ5IH0gZnJvbSAnLi9yZW1vdGUtZnVuY3Rpb25zL3F1ZXJ5L2luc3RhbmNlLnN2ZWx0ZS5qcycgKi9cbi8qKiBAaW1wb3J0IHsgTGl2ZVF1ZXJ5IH0gZnJvbSAnLi9yZW1vdGUtZnVuY3Rpb25zL3F1ZXJ5LWxpdmUvaW5zdGFuY2Uuc3ZlbHRlLmpzJyAqL1xuaW1wb3J0IHsgREVWIH0gZnJvbSBcIi9ub2RlX21vZHVsZXMvLnZpdGUvZGVwcy9Ac3ZlbHRlanNfa2l0X25fZXNtLWVudi5qcz92PTcwZjU5MDRmXCI7XG5pbXBvcnQgeyBzZXR0bGVkLCB0aWNrLCBmb3JrLCBvbk1vdW50LCBoeWRyYXRlLCBtb3VudCB9IGZyb20gXCIvbm9kZV9tb2R1bGVzLy52aXRlL2RlcHMvc3ZlbHRlLmpzP3Y9NzBmNTkwNGZcIjtcbmltcG9ydCB7IEh0dHBFcnJvciwgUmVkaXJlY3QsIFN2ZWx0ZUtpdEVycm9yLCBIYW5kbGVkSHR0cEVycm9yIH0gZnJvbSBcIi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvZXhwb3J0cy9pbnRlcm5hbC9pbmRleC5qcz92PTcwZjU5MDRmXCI7XG5pbXBvcnQgeyBkZWNvZGVfcGF0aG5hbWUsIHN0cmlwX2hhc2gsIG1ha2VfdHJhY2thYmxlLCBub3JtYWxpemVfcGF0aCB9IGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3V0aWxzL3VybC5qcz92PTcwZjU5MDRmXCI7XG5pbXBvcnQgeyBkZXZfZmV0Y2gsIGluaXRpYWxfZmV0Y2gsIGxvY2tfZmV0Y2gsIHN1YnNlcXVlbnRfZmV0Y2gsIHVubG9ja19mZXRjaCB9IGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvY2xpZW50L2ZldGNoZXIuanM/dj03MGY1OTA0ZlwiO1xuaW1wb3J0IHsgcGFyc2Vfcm91dGVzLCBwYXJzZV9zZXJ2ZXJfcm91dGUgfSBmcm9tIFwiL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL2NsaWVudC9wYXJzZS5qcz92PTcwZjU5MDRmXCI7XG5pbXBvcnQgKiBhcyBzdG9yYWdlIGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvY2xpZW50L3Nlc3Npb24tc3RvcmFnZS5qcz92PTcwZjU5MDRmXCI7XG5pbXBvcnQgeyBibHVyX2FjdGl2ZV9lbGVtZW50LCByZXNldF9mb2N1cyB9IGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvY2xpZW50L2ZvY3VzLmpzP3Y9NzBmNTkwNGZcIjtcbmltcG9ydCB7IGRpc2FibGVfc2Nyb2xsX2hhbmRsaW5nLCByZXN0b3JlX3Njcm9sbCB9IGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvY2xpZW50L3Njcm9sbC5qcz92PTcwZjU5MDRmXCI7XG5pbXBvcnQge1xuXHRmaW5kX2FuY2hvcixcblx0cmVzb2x2ZV91cmwsXG5cdGdldF9saW5rX2luZm8sXG5cdGdldF9yb3V0ZXJfb3B0aW9ucyxcblx0aXNfZXh0ZXJuYWxfdXJsLFxuXHRvcmlnaW4sXG5cdHNjcm9sbF9zdGF0ZSxcblx0bG9hZF9jc3Ncbn0gZnJvbSBcIi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvcnVudGltZS9jbGllbnQvdXRpbHMuanM/dj03MGY1OTA0ZlwiO1xuaW1wb3J0IHsgYmFzZSwgc2V0X21hdGNoX2ltcGxlbWVudGF0aW9uIH0gZnJvbSBcIi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvcnVudGltZS9hcHAvcGF0aHMvaW50ZXJuYWwvY2xpZW50LmpzP3Y9NzBmNTkwNGZcIjtcbmltcG9ydCAqIGFzIGRldmFsdWUgZnJvbSBcIi9ub2RlX21vZHVsZXMvLnZpdGUvZGVwcy9Ac3ZlbHRlanNfa2l0X25fZGV2YWx1ZS5qcz92PTcwZjU5MDRmXCI7XG5pbXBvcnQge1xuXHRISVNUT1JZX0lORk9fS0VZLFxuXHRISVNUT1JZX01FVEFEQVRBX0tFWSxcblx0UFJFTE9BRF9QUklPUklUSUVTLFxuXHRTTkFQU0hPVF9LRVlcbn0gZnJvbSBcIi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvcnVudGltZS9jbGllbnQvY29uc3RhbnRzLmpzP3Y9NzBmNTkwNGZcIjtcbmltcG9ydCB7XG5cdGNhcHR1cmVfbmF2aWdhdGlvbl9zbmFwc2hvdCxcblx0Y3VycmVudF9yZWdpc3RyYXRpb25zLFxuXHRkZWxldGVfbmF2aWdhdGlvbl9zbmFwc2hvdCxcblx0aW5pdF9zbmFwc2hvdHMsXG5cdHBlcnNpc3RfbmF2aWdhdGlvbl9zbmFwc2hvdHMsXG5cdHJlc3RvcmVfbmF2aWdhdGlvbl9zbmFwc2hvdFxufSBmcm9tIFwiL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL2NsaWVudC9zbmFwc2hvdHMuanM/dj03MGY1OTA0ZlwiO1xuaW1wb3J0IHsgdmFsaWRhdGVfcGFnZV9leHBvcnRzIH0gZnJvbSBcIi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvdXRpbHMvZXhwb3J0cy5qcz92PTcwZjU5MDRmXCI7XG5pbXBvcnQgeyBhZGRfZGVwcmVjYXRlZF9oYW5kbGVfZXJyb3JfcHJvcGVydGllcyB9IGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3V0aWxzL2Vycm9yLmpzP3Y9NzBmNTkwNGZcIjtcbmltcG9ydCB7IG5vb3AgfSBmcm9tIFwiL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy91dGlscy9mdW5jdGlvbnMuanM/dj03MGY1OTA0ZlwiO1xuaW1wb3J0IHtcblx0SU5WQUxJREFURURfUEFSQU0sXG5cdFRSQUlMSU5HX1NMQVNIX1BBUkFNLFxuXHRjcmVhdGVfcmVtb3RlX2tleSxcblx0dmFsaWRhdGVfZGVwZW5kcyxcblx0dmFsaWRhdGVfbG9hZF9yZXNwb25zZSxcblx0ZmV0Y2hfY2FjaGVfdXJsXG59IGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvc2hhcmVkLmpzP3Y9NzBmNTkwNGZcIjtcblxuaW1wb3J0IHsgcGFnZSwgdXBkYXRlZCwgbm90aWZ5X3ZlcnNpb24sIHVwZGF0ZV9wYWdlLCBzZXRfbmF2aWdhdGlvbiB9IGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvYXBwL3N0YXRlL2NsaWVudC5zdmVsdGUuanM/dj03MGY1OTA0ZlwiO1xuaW1wb3J0IHsgcGF5bG9hZCB9IGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvY2xpZW50L3BheWxvYWQuanM/dj03MGY1OTA0ZlwiO1xuaW1wb3J0IHtcblx0YWRkX2RhdGFfc3VmZml4LFxuXHRhZGRfcmVzb2x1dGlvbl9zdWZmaXgsXG5cdHJvdXRlX2lkX3Jlc29sdXRpb25fcGF0aG5hbWVcbn0gZnJvbSBcIi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvcnVudGltZS9wYXRobmFtZS5qcz92PTcwZjU5MDRmXCI7XG5pbXBvcnQgeyBub29wX3NwYW4gfSBmcm9tIFwiL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy90ZWxlbWV0cnkuanM/dj03MGY1OTA0ZlwiO1xuaW1wb3J0IHsgcmVhZF9uZGpzb24gfSBmcm9tIFwiL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL2NsaWVudC9uZGpzb24uanM/dj03MGY1OTA0ZlwiO1xuaW1wb3J0IFJvb3QgZnJvbSBcIi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvcnVudGltZS9jb21wb25lbnRzL3Jvb3Quc3ZlbHRlP3Y9NzBmNTkwNGZcIjtcbmltcG9ydCB7IFByb3BzLCBSZW5kZXJOb2RlIH0gZnJvbSBcIi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvcnVudGltZS9wcm9wcy5zdmVsdGUuanM/dj03MGY1OTA0ZlwiO1xuaW1wb3J0IHsgaW5pdF90cmFuc3BvcnQsIHBhcnNlLCBzdHJpbmdpZnkgfSBmcm9tIFwiL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL2FwcC9pbnRlcm5hbC90cmFuc3BvcnQuanM/dj03MGY1OTA0ZlwiO1xuaW1wb3J0IHsgYnVpbGRfZXJyb3JfY2hhaW4sIG5lYXJlc3RfZXJyb3JfcGFnZXMgfSBmcm9tIFwiL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL2Vycm9yLWNoYWluLmpzP3Y9NzBmNTkwNGZcIjtcbmltcG9ydCAqIGFzIGUgZnJvbSBcIi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvbWVzc2FnZXMvY2xpZW50LWVycm9ycy5qcz92PTcwZjU5MDRmXCI7XG5pbXBvcnQgKiBhcyB3IGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL21lc3NhZ2VzL2NsaWVudC13YXJuaW5ncy5qcz92PTcwZjU5MDRmXCI7XG5pbXBvcnQgKiBhcyBzaGFyZWRfZXJyb3JzIGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL21lc3NhZ2VzL3NoYXJlZC1lcnJvcnMuanM/dj03MGY1OTA0ZlwiO1xuaW1wb3J0IHsgY2FwdHVyZV9lcnJvciB9IGZyb20gXCIvbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL21lc3NhZ2VzL2ludGVybmFsL3NoYXJlZC5qcz92PTcwZjU5MDRmXCI7XG5cbi8qKlxuICogQHR5cGVkZWYge3tcbiAqICAgaGlzdG9yeUluZGV4OiBudW1iZXI7XG4gKiAgIG5hdmlnYXRpb25JbmRleDogbnVtYmVyO1xuICogICBwYWdlVXJsPzogc3RyaW5nO1xuICogICBzdGF0ZTogc3RyaW5nO1xuICogICBwZXJzaXN0U3RhdGU6IGJvb2xlYW47XG4gKiAgIHJlc2V0SW5kZXg6IG51bWJlcjtcbiAqIH19IEhpc3RvcnlNZXRhZGF0YVxuICovXG5cbmV4cG9ydCB7IGxvYWRfY3NzIH07XG5jb25zdCBJQ09OX1JFTF9BVFRSSUJVVEVTID0gbmV3IFNldChbJ2ljb24nLCAnc2hvcnRjdXQgaWNvbicsICdhcHBsZS10b3VjaC1pY29uJ10pO1xuXG5sZXQgZXJyb3JlZCA9IGZhbHNlO1xuXG4vKipcbiAqIGByZXNldGAgZnVuY3Rpb25zIGZvciBgPHN2ZWx0ZTpib3VuZGFyeT5gcyBpbiB0aGUgZ2VuZXJhdGVkIHJvb3QgdGhhdCBoYXZlXG4gKiBmYWlsZWQuIEEgZmFpbGVkIGJvdW5kYXJ5IHN0YXlzIGZhaWxlZCB1bnRpbCBgcmVzZXQoKWAgaXMgY2FsbGVkIOKAlCBwcm9wXG4gKiB1cGRhdGVzIGFsb25lIGRvbid0IHJlLXJlbmRlciBpdHMgY29udGVudCDigJQgc28gd2l0aG91dCByZXNldHRpbmcsIGEgY2xpZW50XG4gKiBuYXZpZ2F0aW9uIGF3YXkgZnJvbSBhIHJlbmRlciBlcnJvciB3b3VsZCBsZWF2ZSB0aGUgc3RhbGUgYCtlcnJvci5zdmVsdGVgXG4gKiBtb3VudGVkLiBUaGUgYm91bmRhcnkncyBgb25lcnJvcmAgcG9wdWxhdGVzIHRoaXMgYXJyYXk7IGBuYXZpZ2F0ZWAgZHJhaW5zIGl0XG4gKiBhZnRlciBhcHBseWluZyB0aGUgbmV3IHByb3BzLiBTZWUgc3ZlbHRlanMva2l0IzE1Njk0LlxuICogQHR5cGUge1NldDwoKSA9PiB2b2lkPn1cbiAqL1xuY29uc3QgcmVzZXR0ZXJzID0gbmV3IFNldCgpO1xuXG4vLyBXZSB0cmFjayBpbmZvcm1hdGlvbiBhc3NvY2lhdGVkIHdpdGggZWFjaCBoaXN0b3J5IGVudHJ5IGluIHNlc3Npb25TdG9yYWdlLFxuLy8gcmF0aGVyIHRoYW4gb24gaGlzdG9yeS5zdGF0ZSBpdHNlbGYsIGJlY2F1c2Ugd2hlbiBuYXZpZ2F0aW9uIGlzIGRyaXZlbiBieVxuLy8gcG9wc3RhdGUgaXQncyB0b28gbGF0ZSB0byBhY2Nlc3MgdGhlIG9wdGlvbnMgb3IgdXBkYXRlIHRoZSBmb2N1cyBwb3NpdGlvbiBhc3NvY2lhdGVkIHdpdGggdGhlXG4vLyBzdGF0ZSB3ZSdyZSBuYXZpZ2F0aW5nIGZyb21cbi8qKlxuICogQHR5cGUge1JlY29yZDxudW1iZXIsIHsgc2Nyb2xsPzogeyB4OiBudW1iZXI7IHk6IG51bWJlciB9OyByZXNldEluZGV4PzogbnVtYmVyIH0+fVxuICovXG5jb25zdCBoaXN0b3J5X2luZm8gPSBzdG9yYWdlLmdldChISVNUT1JZX0lORk9fS0VZKSA/PyB7fTtcblxuLyoqXG4gKiBuYXZpZ2F0aW9uIGluZGV4IC0+IGFueVxuICogQHR5cGUge1JlY29yZDxzdHJpbmcsIGFueVtdPn1cbiAqIEBkZXByZWNhdGVkIFRPRE8gNC4wIGdldCByaWQgb2YgdGhpc1xuICovXG5jb25zdCBzbmFwc2hvdHMgPSBzdG9yYWdlLmdldChTTkFQU0hPVF9LRVkpID8/IHt9O1xuXG5pbml0X3NuYXBzaG90cygoKSA9PiAoc3RhcnRlZCAmJiAhaXNfbmF2aWdhdGluZyAmJiAhdXBkYXRpbmcgPyBjdXJyZW50X2hpc3RvcnlfaW5kZXggOiBudWxsKSk7XG5cbi8qKiBAdHlwZSB7UHJvcHN9ICovXG5sZXQgcHJvcHM7XG5cbmlmIChERVYpIHtcblx0bGV0IHdhcm5lZCA9IGZhbHNlO1xuXG5cdGNvbnN0IGN1cnJlbnRfbW9kdWxlX3VybCA9IGltcG9ydC5tZXRhLnVybC5zcGxpdCgnPycpWzBdOyAvLyByZW1vdmUgcXVlcnkgcGFyYW1zIHRoYXQgdml0ZSBhZGRzIHRvIHRoZSBVUkwgd2hlbiBpdCBpcyBsb2FkZWQgZnJvbSBub2RlX21vZHVsZXNcblxuXHRjb25zdCB3YXJuID0gKCkgPT4ge1xuXHRcdGlmICh3YXJuZWQpIHJldHVybjtcblxuXHRcdC8vIFJhdGhlciB0aGFuIHNhdmluZyBhIHBvaW50ZXIgdG8gdGhlIG9yaWdpbmFsIGhpc3RvcnkgbWV0aG9kcywgd2hpY2ggd291bGQgcHJldmVudCBtb25rZXlwYXRjaGluZyBieSBvdGhlciBsaWJzLFxuXHRcdC8vIGluc3BlY3QgdGhlIHN0YWNrIHRyYWNlIHRvIHNlZSBpZiB3ZSdyZSBiZWluZyBjYWxsZWQgZnJvbSB3aXRoaW4gU3ZlbHRlS2l0LlxuXHRcdGxldCBzdGFjayA9IG5ldyBFcnJvcigpLnN0YWNrPy5zcGxpdCgnXFxuJyk7XG5cdFx0aWYgKCFzdGFjaykgcmV0dXJuO1xuXHRcdGlmICghc3RhY2tbMF0uaW5jbHVkZXMoJ2h0dHBzOicpICYmICFzdGFja1swXS5pbmNsdWRlcygnaHR0cDonKSkgc3RhY2sgPSBzdGFjay5zbGljZSgxKTsgLy8gQ2hyb21lIGluY2x1ZGVzIHRoZSBlcnJvciBtZXNzYWdlIGluIHRoZSBzdGFja1xuXG5cdFx0Ly8gc2tpcCBvdmVyIGB3YXJuYCBhbmQgdGhlIHBsYWNlIHdoZXJlIGB3YXJuYCB3YXMgY2FsbGVkXG5cdFx0Y29uc3QgZnJhbWUgPSBzdGFja1syXTtcblxuXHRcdC8vIElnbm9yZSBjYWxscyB0aGF0IGhhcHBlbiBpbnNpZGUgZGVwZW5kZW5jaWVzLCBpbmNsdWRpbmcgU3ZlbHRlS2l0LlxuXHRcdC8vIFRoZSBzZWNvbmQgY29uZGl0aW9uIGlzIG9ubHkgcmVsZXZhbnQgd2hlbiBkZXZlbG9waW5nIFN2ZWx0ZUtpdCBhbmQgcnVubmluZyBpdCwgYXMgdGhlcmUncyBubyBub2RlX21vZHVsZXMgaW4gdGhlIHN0YWNrIHRoZW4gKGJ1dCB3ZSBzdGlsbCBkbyBpdCB0byBub3QgZ2V0IHJlcGVhdGVkbHkgY29uZnVzZWQpXG5cdFx0Ly8gYGZyYW1lYCBjYW4gYmUgZmFsc3kgaWYgd2UgY2FtZSBmcm9tIGFuIGFub255bW91cyBmdW5jdGlvblxuXHRcdGlmIChmcmFtZT8uaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpIHx8IGZyYW1lPy5pbmNsdWRlcyhjdXJyZW50X21vZHVsZV91cmwpKSByZXR1cm47XG5cblx0XHR3YXJuZWQgPSB0cnVlO1xuXG5cdFx0dy5oaXN0b3J5X2FwaV9jb25mbGljdCgpO1xuXHR9O1xuXG5cdGNvbnN0IHB1c2hfc3RhdGUgPSBoaXN0b3J5LnB1c2hTdGF0ZTtcblx0aGlzdG9yeS5wdXNoU3RhdGUgPSAoLi4uYXJncykgPT4ge1xuXHRcdHdhcm4oKTtcblx0XHRyZXR1cm4gcHVzaF9zdGF0ZS5hcHBseShoaXN0b3J5LCBhcmdzKTtcblx0fTtcblxuXHRjb25zdCByZXBsYWNlX3N0YXRlID0gaGlzdG9yeS5yZXBsYWNlU3RhdGU7XG5cdGhpc3RvcnkucmVwbGFjZVN0YXRlID0gKC4uLmFyZ3MpID0+IHtcblx0XHR3YXJuKCk7XG5cdFx0cmV0dXJuIHJlcGxhY2Vfc3RhdGUuYXBwbHkoaGlzdG9yeSwgYXJncyk7XG5cdH07XG59XG5cbi8qKiBAcGFyYW0ge251bWJlcn0gaW5kZXggKi9cbmZ1bmN0aW9uIGNhcHR1cmVfc2Nyb2xsKGluZGV4KSB7XG5cdGhpc3RvcnlfaW5mb1tpbmRleF0uc2Nyb2xsID0gc2Nyb2xsX3N0YXRlKCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gKiBAcGFyYW0ge1BpY2s8SGlzdG9yeU1ldGFkYXRhLCAncmVzZXRJbmRleCc+fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHNldF9oaXN0b3J5X29wdGlvbnMoaW5kZXgsIG9wdGlvbnMpIHtcblx0aGlzdG9yeV9pbmZvW2luZGV4XSA9IHtcblx0XHQuLi5oaXN0b3J5X2luZm9baW5kZXhdLFxuXHRcdHJlc2V0SW5kZXg6IG9wdGlvbnMucmVzZXRJbmRleFxuXHR9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50X2hpc3RvcnlfaW5kZXhcbiAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50X25hdmlnYXRpb25faW5kZXhcbiAqL1xuZnVuY3Rpb24gY2xlYXJfb253YXJkX2hpc3RvcnkoY3VycmVudF9oaXN0b3J5X2luZGV4LCBjdXJyZW50X25hdmlnYXRpb25faW5kZXgpIHtcblx0Ly8gaWYgd2UgbmF2aWdhdGVkIGJhY2ssIHRoZW4gcHVzaGVkIGEgbmV3IHN0YXRlLCB3ZSBjYW5cblx0Ly8gcmVsZWFzZSBtZW1vcnkgYnkgcHJ1bmluZyB0aGUgc2Nyb2xsL3NuYXBzaG90IGxvb2t1cFxuXHQvLyB0aGUgbmV3IGVudHJ5IHJldXNlcyB0aGUgZmlyc3QgYWJhbmRvbmVkIGluZGV4LCBzbyBpdHMgc2xvdCBtdXN0IHN0YXJ0IGNsZWFuXG5cdGRlbGV0ZV9uYXZpZ2F0aW9uX3NuYXBzaG90KGN1cnJlbnRfaGlzdG9yeV9pbmRleCk7XG5cdGxldCBpID0gY3VycmVudF9oaXN0b3J5X2luZGV4ICsgMTtcblx0d2hpbGUgKGhpc3RvcnlfaW5mb1tpXSkge1xuXHRcdGRlbGV0ZSBoaXN0b3J5X2luZm9baV07XG5cdFx0ZGVsZXRlX25hdmlnYXRpb25fc25hcHNob3QoaSk7XG5cdFx0aSArPSAxO1xuXHR9XG5cblx0aSA9IGN1cnJlbnRfbmF2aWdhdGlvbl9pbmRleCArIDE7XG5cdHdoaWxlIChzbmFwc2hvdHNbaV0pIHtcblx0XHRkZWxldGUgc25hcHNob3RzW2ldO1xuXHRcdGkgKz0gMTtcblx0fVxufVxuXG4vKipcbiAqIExvYWRzIGBocmVmYCB0aGUgb2xkLWZhc2hpb25lZCB3YXksIHdpdGggYSBmdWxsIHBhZ2UgcmVsb2FkLlxuICogUmV0dXJucyBhIGBQcm9taXNlYCB0aGF0IG5ldmVyIHJlc29sdmVzICh0byBwcmV2ZW50IGFueVxuICogc3Vic2VxdWVudCB3b3JrLCBlLmcuIGhpc3RvcnkgbWFuaXB1bGF0aW9uLCBmcm9tIGhhcHBlbmluZylcbiAqIEBwYXJhbSB7VVJMfSB1cmxcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3JlcGxhY2VdIGlmIGB0cnVlYCwgd2lsbCByZXBsYWNlIHRoZSBjdXJyZW50IGBoaXN0b3J5YCBlbnRyeSByYXRoZXIgdGhhbiBjcmVhdGluZyBhIG5ldyBvbmUgd2l0aCBgcHVzaFN0YXRlYFxuICogQHJldHVybnMge1Byb21pc2U8YW55Pn0gYSBwcm9taXNlIHRoYXQgbmV2ZXIgcmVzb2x2ZXNcbiAqL1xuZnVuY3Rpb24gbmF0aXZlX25hdmlnYXRpb24odXJsLCByZXBsYWNlID0gZmFsc2UpIHtcblx0aWYgKHJlcGxhY2UpIHtcblx0XHRsb2NhdGlvbi5yZXBsYWNlKHVybC5ocmVmKTtcblx0fSBlbHNlIHtcblx0XHRsb2NhdGlvbi5ocmVmID0gdXJsLmhyZWY7XG5cdH1cblx0cmV0dXJuIG5ldyBQcm9taXNlKG5vb3ApO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgc2VydmljZSB3b3JrZXIgaXMgcmVnaXN0ZXJlZCwgYW5kIGlmIGl0IGlzLFxuICogdHJpZXMgdG8gdXBkYXRlIGl0LlxuICovXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVfc2VydmljZV93b3JrZXIoKSB7XG5cdHRyeSB7XG5cdFx0aWYgKCdzZXJ2aWNlV29ya2VyJyBpbiBuYXZpZ2F0b3IpIHtcblx0XHRcdGNvbnN0IHJlZ2lzdHJhdGlvbiA9IGF3YWl0IG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmdldFJlZ2lzdHJhdGlvbihiYXNlIHx8ICcvJyk7XG5cdFx0XHRpZiAocmVnaXN0cmF0aW9uKSB7XG5cdFx0XHRcdGF3YWl0IHJlZ2lzdHJhdGlvbi51cGRhdGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gY2F0Y2gge1xuXHRcdC8vIEEgZmFpbGVkIHNlcnZpY2Ugd29ya2VyIHVwZGF0ZSBtdXN0IG5vdCBwcmV2ZW50IHRoZSBmYWxsYmFjayBkb2N1bWVudCBuYXZpZ2F0aW9uLlxuXHR9XG59XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLkNTUlJvdXRlW119IEFsbCByb3V0ZXMgb2YgdGhlIGFwcC4gT25seSBhdmFpbGFibGUgd2hlbiByb3V0ZXIucmVzb2x1dGlvbj1jbGllbnQgKi9cbmxldCByb3V0ZXM7XG4vKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5DU1JQYWdlTm9kZUxvYWRlcn0gKi9cbmxldCBkZWZhdWx0X2xheW91dF9sb2FkZXI7XG4vKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5DU1JQYWdlTm9kZUxvYWRlcn0gKi9cbmxldCBkZWZhdWx0X2Vycm9yX2xvYWRlcjtcbi8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovXG5sZXQgY29udGFpbmVyO1xuLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi9cbmxldCB0YXJnZXQ7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuL3R5cGVzLmpzJykuU3ZlbHRlS2l0QXBwfSAqL1xuZXhwb3J0IGxldCBhcHA7XG5cbi8qKlxuICogRGF0YSB0aGF0IHdhcyBzZXJpYWxpemVkIGR1cmluZyBTU1IgZm9yIHF1ZXJpZXMvZm9ybXMvY29tbWFuZHMsIHN0b3JlZCBhc1xuICogYHsgdiB9YCAodmFsdWUpIG9yIGB7IGUgfWAgKGVycm9yKSBub2RlcyBzbyB0aGF0IGZhaWxlZCBzdGF0ZXMgc3Vydml2ZSBoeWRyYXRpb24uXG4gKiBFbnRyaWVzIGFyZSBkZWxldGVkIGFzIHRoZXkgYXJlIGNvbnN1bWVkICh3aGVuIHRoZSBjb3JyZXNwb25kaW5nIHJlc291cmNlIGlzIGNyZWF0ZWQpLlxuICogQHR5cGUge1JlY29yZDxzdHJpbmcsIFJlbW90ZUZ1bmN0aW9uRGF0YU5vZGU+fVxuICovXG5leHBvcnQgY29uc3QgcXVlcnlfcmVzcG9uc2VzID0ge307XG5cbi8qKlxuICogRGF0YSB0aGF0IHdhcyBzZXJpYWxpemVkIGR1cmluZyBTU1IgZm9yIHByZXJlbmRlciBmdW5jdGlvbnMsIHN0b3JlZCBhc1xuICogYHsgdiB9YCAodmFsdWUpIG9yIGB7IGUgfWAgKGVycm9yKSBub2Rlcy5cbiAqIFRoaXMgcGVyc2lzdHMgYWNyb3NzIGNsaWVudC1zaWRlIG5hdmlnYXRpb25zLlxuICogQHR5cGUge1JlY29yZDxzdHJpbmcsIFJlbW90ZUZ1bmN0aW9uRGF0YU5vZGU+fVxuICovXG5leHBvcnQgY29uc3QgcHJlcmVuZGVyX3Jlc3BvbnNlcyA9IHt9O1xuXG4vKiogQHR5cGUge0FycmF5PCgodXJsOiBVUkwpID0+IGJvb2xlYW4pPn0gKi9cbmNvbnN0IGludmFsaWRhdGVkID0gW107XG5cbi8qKiBAdHlwZSB7e2lkOiBzdHJpbmcsIHRva2VuOiB7fSwgcHJvbWlzZTogUHJvbWlzZTxpbXBvcnQoJy4vdHlwZXMuanMnKS5OYXZpZ2F0aW9uUmVzdWx0PiwgZm9yazogUHJvbWlzZTxpbXBvcnQoJ3N2ZWx0ZScpLkZvcmsgfCBudWxsPiB8IG51bGx9IHwgbnVsbH0gKi9cbmxldCBsb2FkX2NhY2hlID0gbnVsbDtcblxuZnVuY3Rpb24gZGlzY2FyZF9sb2FkX2NhY2hlKCkge1xuXHR2b2lkIGxvYWRfY2FjaGU/LmZvcms/LnRoZW4oKGYpID0+IGY/LmRpc2NhcmQoKSk7XG5cdGxvYWRfY2FjaGUgPSBudWxsO1xuXHRjdXJyZW50X2EgPSB7IGVsZW1lbnQ6IHVuZGVmaW5lZCwgaHJlZjogdW5kZWZpbmVkIH07XG59XG5cbi8qKlxuICogQHR5cGUge01hcDxzdHJpbmcsIFByb21pc2U8VVJMPj59XG4gKiBDYWNoZSBmb3IgY2xpZW50LXNpZGUgcmVyb3V0aW5nLCBzaW5jZSBpdCBjb3VsZCBjb250YWluIGFzeW5jIGNhbGxzIHdoaWNoIHdlIHdhbnQgdG9cbiAqIGF2b2lkIHJ1bm5pbmcgbXVsdGlwbGUgdGltZXMgd2hpY2ggd291bGQgc2xvdyBkb3duIG5hdmlnYXRpb25zIChlLmcuIGVsc2UgcHJlbG9hZGluZ1xuICogd291bGRuJ3QgaGVscCBiZWNhdXNlIG9uIG5hdmlnYXRpb24gaXQgd291bGQgYmUgY2FsbGVkIGFnYWluKS4gU2luY2UgYHJlcm91dGVgIHNob3VsZCBiZVxuICogYSBwdXJlIGZ1bmN0aW9uIChpLmUuIGFsd2F5cyByZXR1cm4gdGhlIHNhbWUpIHZhbHVlIGl0J3Mgc2FmZSB0byBjYWNoZSBhY3Jvc3MgbmF2aWdhdGlvbnMuXG4gKiBUaGUgc2VydmVyIHJlcm91dGUgY2FsbHMgZG9uJ3QgbmVlZCB0byBiZSBjYWNoZWQgYmVjYXVzZSB0aGV5IGFyZSBjYWxsZWQgdXNpbmcgYGltcG9ydCguLi4pYFxuICogd2hpY2ggaXMgY2FjaGVkIHBlciB0aGUgSlMgc3BlYy5cbiAqL1xuY29uc3QgcmVyb3V0ZV9jYWNoZSA9IG5ldyBNYXAoKTtcblxuLyoqXG4gKiBTZW50aW5lbCBmb3IgYSByb3V0ZSB0aGF0IGV4aXN0cyBidXQgaGFzIG5vIGNvZGUgdG8gcHJlbG9hZCwgaS5lLiBhIGArc2VydmVyLmpzYCB3aXRoIG5vXG4gKiBgK3BhZ2VgLiBDYWNoZWQgbGlrZSBhIHBhcnNlZCByb3V0ZSBzbyB0aGF0IHJlcGVhdGVkIGBwcmVsb2FkQ29kZShpZClgIGNhbGxzIGZvciB0aGUgc2FtZVxuICogaWQgZG9uJ3QgcmUtcmVxdWVzdCBpdC5cbiAqL1xuY29uc3QgRU5EUE9JTlRfT05MWSA9IFN5bWJvbCgnZW5kcG9pbnQgb25seScpO1xuXG4vKipcbiAqIENhY2hlIG9mIHJvdXRlIElEIC0+IHBhcnNlZCByb3V0ZSBmb3Igc2VydmVyLXNpZGUgcm91dGUgcmVzb2x1dGlvbi5cbiAqIFBvcHVsYXRlZCB3aGVuZXZlciBhIHNlcnZlciByb3V0ZSByZXNvbHV0aW9uIG9jY3VycyAoYG1hdGNoYCwgbGluayBwcmVsb2FkaW5nLFxuICogaHlkcmF0aW9uKSwgc28gdGhhdCBgcHJlbG9hZENvZGUoaWQpYCBkb2Vzbid0IG5lZWQgYW4gZXh0cmEgc2VydmVyIHJvdW5kIHRyaXAuXG4gKiBMaXZlcyB1bnRpbCBmdWxsIHBhZ2UgcmVsb2FkLlxuICogQHR5cGUge01hcDxzdHJpbmcsIGltcG9ydCgndHlwZXMnKS5DU1JSb3V0ZSB8IHR5cGVvZiBFTkRQT0lOVF9PTkxZPn1cbiAqL1xuY29uc3Qgcm91dGVfaWRfY2FjaGUgPSBuZXcgTWFwKCk7XG5cbi8qKlxuICogUGFyc2UgYSBzZXJ2ZXItcHJvdmlkZWQgcm91dGUgYW5kIHJlY29yZCBpdCBpbiBgcm91dGVfaWRfY2FjaGVgLCBzbyB0aGF0IGEgc3Vic2VxdWVudFxuICogYHByZWxvYWRDb2RlKGlkKWAgZm9yIHRoZSBzYW1lIHJvdXRlIGRvZXNuJ3QgbmVlZCBhbm90aGVyIHNlcnZlciByb3VuZCB0cmlwLiBBbHdheXMgdXNlXG4gKiB0aGlzIHJhdGhlciB0aGFuIGNhbGxpbmcgYHBhcnNlX3NlcnZlcl9yb3V0ZWAgZGlyZWN0bHkuXG4gKiBAcGFyYW0ge2ltcG9ydCgndHlwZXMnKS5DU1JSb3V0ZVNlcnZlcn0gc2VydmVyX3JvdXRlXG4gKiBAcmV0dXJucyB7aW1wb3J0KCd0eXBlcycpLkNTUlJvdXRlfVxuICovXG5mdW5jdGlvbiBwYXJzZV9hbmRfY2FjaGVfc2VydmVyX3JvdXRlKHNlcnZlcl9yb3V0ZSkge1xuXHRjb25zdCByb3V0ZSA9IHBhcnNlX3NlcnZlcl9yb3V0ZShzZXJ2ZXJfcm91dGUsIGFwcC5ub2Rlcyk7XG5cdHJvdXRlX2lkX2NhY2hlLnNldChyb3V0ZS5pZCwgcm91dGUpO1xuXHRyZXR1cm4gcm91dGU7XG59XG5cbi8qKlxuICogTm90ZSBvbiBiZWZvcmVfbmF2aWdhdGVfY2FsbGJhY2tzLCBvbl9uYXZpZ2F0ZV9jYWxsYmFja3MgYW5kIGFmdGVyX25hdmlnYXRlX2NhbGxiYWNrczpcbiAqIGRvIG5vdCByZS1hc3NpZ24gYXMgc29tZSBjbG9zdXJlcyBrZWVwIHJlZmVyZW5jZXMgdG8gdGhlc2UgU2V0c1xuICovXG4vKiogQHR5cGUge1NldDwobmF2aWdhdGlvbjogQmVmb3JlTmF2aWdhdGUpID0+IHZvaWQ+fSAqL1xuY29uc3QgYmVmb3JlX25hdmlnYXRlX2NhbGxiYWNrcyA9IG5ldyBTZXQoKTtcblxuLyoqIEB0eXBlIHtTZXQ8KG5hdmlnYXRpb246IE9uTmF2aWdhdGUpID0+IGltcG9ydCgndHlwZXMnKS5NYXliZVByb21pc2U8KCgpID0+IHZvaWQpIHwgdm9pZD4+fSAqL1xuY29uc3Qgb25fbmF2aWdhdGVfY2FsbGJhY2tzID0gbmV3IFNldCgpO1xuXG4vKiogQHR5cGUge1NldDwobmF2aWdhdGlvbjogQWZ0ZXJOYXZpZ2F0ZSkgPT4gdm9pZD59ICovXG5jb25zdCBhZnRlcl9uYXZpZ2F0ZV9jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuL3R5cGVzLmpzJykuTmF2aWdhdGlvblN0YXRlICYgeyBuYXY6IE5hdmlnYXRpb25FdmVudCB9fSAqL1xubGV0IGN1cnJlbnQgPSB7XG5cdGJyYW5jaDogW10sXG5cdGVycm9yOiBudWxsLFxuXHQvLyBAdHMtaWdub3JlIC0gd2UgbmVlZCB0aGUgaW5pdGlhbCB2YWx1ZSB0byBiZSBudWxsXG5cdHVybDogbnVsbCxcblx0Ly8gQHRzLWlnbm9yZSAtIHdlIG5lZWQgdGhlIGluaXRpYWwgdmFsdWUgdG8gYmUgbnVsbFxuXHRuYXY6IG51bGxcbn07XG5cbi8qKiB0aGlzIGJlaW5nIHRydWUgbWVhbnMgd2UgU1NSJ2QgKi9cbmxldCBoeWRyYXRlZCA9IGZhbHNlO1xubGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbmxldCB1cGRhdGluZyA9IGZhbHNlO1xubGV0IGlzX25hdmlnYXRpbmcgPSBmYWxzZTtcbi8qKiBAdHlwZSB7SGlzdG9yeU1ldGFkYXRhIHwgbnVsbH0gKi9cbmxldCBoYXNoX25hdmlnYXRpbmcgPSBudWxsO1xuLyoqIFRydWUgYXMgc29vbiBhcyB0aGVyZSBoYXBwZW5lZCBvbmUgY2xpZW50LXNpZGUgbmF2aWdhdGlvbiAoZXhjbHVkaW5nIHRoZSBTdmVsdGVLaXQtaW5pdGlhbGl6ZWQgaW5pdGlhbCBvbmUgd2hlbiBpbiBTUEEgbW9kZSkgKi9cbmxldCBoYXNfbmF2aWdhdGVkID0gZmFsc2U7XG5cbmxldCBmb3JjZV9pbnZhbGlkYXRpb24gPSBmYWxzZTtcblxuLyoqIEB0eXBlIHtudW1iZXJ9IGtlZXBpbmcgdHJhY2sgb2YgdGhlIGhpc3RvcnkgaW5kZXggaW4gb3JkZXIgdG8gcHJldmVudCBwb3BzdGF0ZSBuYXZpZ2F0aW9uIGV2ZW50cyBpZiBuZWVkZWQgKi9cbmxldCBjdXJyZW50X2hpc3RvcnlfaW5kZXg7XG5cbi8qKiBAdHlwZSB7bnVtYmVyfSAqL1xubGV0IGN1cnJlbnRfbmF2aWdhdGlvbl9pbmRleDtcblxuLyoqIEB0eXBlIHtudW1iZXJ9ICovXG5sZXQgY3VycmVudF9yZXNldF9pbmRleDtcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gW3N0YXRlXVxuICogQHJldHVybnMge0hpc3RvcnlNZXRhZGF0YSB8IHVuZGVmaW5lZH1cbiAqL1xuZnVuY3Rpb24gZ2V0X2hpc3RvcnlfbWV0YWRhdGEoc3RhdGUgPSBoaXN0b3J5LnN0YXRlKSB7XG5cdHJldHVybiBzdGF0ZT8uW0hJU1RPUllfTUVUQURBVEFfS0VZXTtcbn1cblxuLyoqIEB0eXBlIHt7fX0gVG9rZW4gZm9yIHRoZSBsYXRlc3QgbmF2aWdhdGlvbi4gVXBkYXRlZCBvbiBuZXcgbmF2aWdhdGlvbnMgKi9cbmxldCBuYXZpZ2F0aW9uX3Rva2VuO1xuXG4vKipcbiAqIEB0eXBlIHt7fX1cbiAqIFRoZSBsYXRlc3QgaW52YWxpZGF0ZShBbGwpIHRva2VuLiBTdXBlcnNlZWRlZCBieSBib3RoIGxhdGVyIGludmFsaWRhdGUoQWxsKXMgYW5kIG5hdmlnYXRpb25zLlxuICogVGhpcyBpcyBzZXBhcmF0ZSB0byBuYXZpZ2F0aW9uX3Rva2VuIGJlY2F1c2UgYW4gaW52YWxpZGF0ZShBbGwpIG1pZ2h0IGJlIHRyaWdnZXJlZCB3aGlsZSBhIG5hdmlnYXRpb25cbiAqIGlzIGluIHByb2dyZXNzLCBhbmQgd2Ugd2FudCB0byBiZSBhYmxlIHRvIGZpbmlzaCB0aGlzIG5hdmlnYXRpb24gKHVubGVzcyB0aGUgaW52YWxpZGF0aW9uIGZpbmlzaGVzIGJlZm9yZVxuICogaXQgYW5kIHJlZGlyZWN0cywgaW4gd2hpY2ggY2FzZSB3ZSB3aWxsIGRvIHRoZSByZWRpcmVjdCB0cmlnZ2VyZWQgYnkgdGhlIGludmFsaWRhdGlvbikuXG4gKi9cbmxldCBpbnZhbGlkYXRpb25fdG9rZW47XG5cbi8qKlxuICogQSBzZXQgb2YgdG9rZW5zIHdoaWNoIGFyZSBhc3NvY2lhdGVkIHRvIGN1cnJlbnQgcHJlbG9hZHMuXG4gKiBJZiBhIHByZWxvYWQgYmVjb21lcyBhIHJlYWwgbmF2aWdhdGlvbiwgaXQncyByZW1vdmVkIGZyb20gdGhlIHNldC5cbiAqIElmIGEgcHJlbG9hZCB0b2tlbiBpcyBpbiB0aGUgc2V0IGFuZCB0aGUgcHJlbG9hZCBlcnJvcnMsIHRoZSBlcnJvclxuICogaGFuZGxpbmcgbG9naWMgKGZvciBleGFtcGxlIHJlbG9hZGluZykgaXMgc2tpcHBlZC5cbiAqL1xuLyoqIEB0eXBlIHtTZXQ8e30+fSAqL1xuY29uc3QgcHJlbG9hZF90b2tlbnMgPSBuZXcgU2V0KCk7XG5cbi8qKiBAdHlwZSB7UHJvbWlzZTx2b2lkPiB8IG51bGx9ICovXG5sZXQgcGVuZGluZ19pbnZhbGlkYXRlO1xuXG4vKipcbiAqIEB0eXBlIHtNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBDYWNoZUVudHJ5PFF1ZXJ5PGFueT4+Pj59XG4gKiBBIG1hcCBvZiBxdWVyeSBpZCAtPiBwYXlsb2FkIC0+IHF1ZXJ5IGludGVybmFscyBmb3IgYWxsIGFjdGl2ZSBxdWVyaWVzLlxuICovXG5leHBvcnQgY29uc3QgcXVlcnlfbWFwID0gbmV3IE1hcCgpO1xuXG4vKipcbiAqIEB0eXBlIHtNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBDYWNoZUVudHJ5PExpdmVRdWVyeTxhbnk+Pj4+fVxuICogQSBtYXAgb2YgaWQgLT4gcGF5bG9hZCAtPiBsaXZlIHF1ZXJ5IGludGVybmFscyBmb3IgYWxsIGFjdGl2ZSBxdWVyaWVzLlxuICovXG5leHBvcnQgY29uc3QgbGl2ZV9xdWVyeV9tYXAgPSBuZXcgTWFwKCk7XG5cbnNldF9tYXRjaF9pbXBsZW1lbnRhdGlvbihhc3luYyAodXJsKSA9PiB7XG5cdGlmICh0eXBlb2YgdXJsID09PSAnc3RyaW5nJykge1xuXHRcdHVybCA9IG5ldyBVUkwodXJsLCBsb2NhdGlvbi5ocmVmKTtcblx0fVxuXG5cdGNvbnN0IGludGVudCA9IGF3YWl0IGdldF9uYXZpZ2F0aW9uX2ludGVudCh1cmwsIGZhbHNlKTtcblxuXHRpZiAoaW50ZW50KSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGlkOiAvKiogQHR5cGUge2ltcG9ydCgnJGFwcC90eXBlcycpLlJvdXRlSWR9ICovIChpbnRlbnQucm91dGUuaWQpLFxuXHRcdFx0cGFyYW1zOiBpbnRlbnQucGFyYW1zXG5cdFx0fTtcblx0fVxuXG5cdHJldHVybiBudWxsO1xufSk7XG5cbmxldCBlbWJlZGRlZF9zdGFydCA9IFByb21pc2UucmVzb2x2ZSgpO1xuXG4vKipcbiAqIFRPRE8gdGhpcyBpbmRpcmVjdGlvbiBpcyBhIGdyb3Rlc3F1ZSB3b3JrYXJvdW5kIGZvciB0aGUgZmFjdCB0aGF0IG11bHRpcGxlIGFwcHNcbiAqIGNhbiBvcGVyYXRlIG9uIHRoZSBzYW1lIHNoYXJlZCBtdXRhYmxlIHN0YXRlLiBUaGlzIGlzIGZ1bmRhbWVudGFsbHkgdW5zb3VuZCxcbiAqIGFuZCB0aGUgYHN0YXJ0YC9gX3N0YXJ0YCBkaXN0aW5jdGlvbiBkb2VzIG5vdCBmaXggaXQsIGJ1dCBpdCBkb2VzIGdldCB0aGVcbiAqIHRlc3RzIHBhc3NpbmcuIFdlIG5lZWQgdG8gcmV0aGluayB0aGlzIHdob2xlIHRoaW5nIGJ1dCBub3QgcmlnaHQgbm93XG4gKiBAcGFyYW0ge2ltcG9ydCgnLi90eXBlcy5qcycpLlN2ZWx0ZUtpdEFwcH0gX2FwcFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gX3RhcmdldFxuICogQHBhcmFtIHtQYXJhbWV0ZXJzPHR5cGVvZiBfaHlkcmF0ZT5bMV19IFtkYXRhXVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RhcnQoX2FwcCwgX3RhcmdldCwgZGF0YSkge1xuXHRpZiAoX19TVkVMVEVLSVRfRU1CRURERURfXykge1xuXHRcdGNvbnN0IHN0YXJ0X3Byb21pc2UgPSBlbWJlZGRlZF9zdGFydC50aGVuKCgpID0+IF9zdGFydChfYXBwLCBfdGFyZ2V0LCBkYXRhKSk7XG5cdFx0ZW1iZWRkZWRfc3RhcnQgPSBzdGFydF9wcm9taXNlLmNhdGNoKG5vb3ApO1xuXHRcdHJldHVybiBzdGFydF9wcm9taXNlO1xuXHR9XG5cblx0cmV0dXJuIF9zdGFydChfYXBwLCBfdGFyZ2V0LCBkYXRhKTtcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBUPj59IG1hcFxuICogQHJldHVybnMge0dlbmVyYXRvcjxbc3RyaW5nLCBUXT59IGV2ZXJ5IGVudHJ5IG9mIHRoZSBjYWNoZSBtYXAsIGtleWVkIGJ5IHJlbW90ZSBrZXlcbiAqL1xuZnVuY3Rpb24qIGNhY2hlX2VudHJpZXMobWFwKSB7XG5cdGZvciAoY29uc3QgW2lkLCBlbnRyaWVzXSBvZiBtYXApIHtcblx0XHRmb3IgKGNvbnN0IFtwYXlsb2FkLCBlbnRyeV0gb2YgZW50cmllcykge1xuXHRcdFx0eWllbGQgW2NyZWF0ZV9yZW1vdGVfa2V5KGlkLCBwYXlsb2FkKSwgZW50cnldO1xuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL3R5cGVzLmpzJykuU3ZlbHRlS2l0QXBwfSBfYXBwXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBfdGFyZ2V0XG4gKiBAcGFyYW0ge1BhcmFtZXRlcnM8dHlwZW9mIF9oeWRyYXRlPlsxXX0gW2RhdGFdXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIF9zdGFydChfYXBwLCBfdGFyZ2V0LCBkYXRhKSB7XG5cdGlmIChERVYgJiYgX3RhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuXHRcdHcuYXBwX2JvZHlfdW53cmFwcGVkKHsgdGFnOiAnJXN2ZWx0ZWtpdC5ib2R5JScgfSk7XG5cdH1cblxuXHRpZiAocGF5bG9hZC5kYXRhKSB7XG5cdFx0Y29uc3QgeyBxID0ge30sIHAgPSB7fSwgbCA9IHt9LCBmID0ge30gfSA9IHBheWxvYWQuZGF0YTtcblxuXHRcdC8vIHN0b3JlIHRoZSB3aG9sZSBub2RlcyDigJQgZXJyb3IgcmVjb3JkcyBzZWVkIHRoZSBjb3JyZXNwb25kaW5nXG5cdFx0Ly8gcmVzb3VyY2VzIGluIGEgZmFpbGVkIHN0YXRlIHdoZW4gdGhleSBhcmUgY3JlYXRlZCBkdXJpbmcgaHlkcmF0aW9uXG5cdFx0Zm9yIChjb25zdCBrIGluIHEpIHF1ZXJ5X3Jlc3BvbnNlc1trXSA9IHFba107XG5cdFx0Zm9yIChjb25zdCBrIGluIGwpIHF1ZXJ5X3Jlc3BvbnNlc1trXSA9IGxba107XG5cdFx0Zm9yIChjb25zdCBrIGluIGYpIHF1ZXJ5X3Jlc3BvbnNlc1trXSA9IGZba107XG5cdFx0Zm9yIChjb25zdCBrIGluIHApIHByZXJlbmRlcl9yZXNwb25zZXNba10gPSBwW2tdO1xuXHR9XG5cblx0Ly8gZGV0ZWN0IGJhc2ljIGF1dGggY3JlZGVudGlhbHMgaW4gdGhlIGN1cnJlbnQgVVJMXG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9raXQvcHVsbC8xMTE3OVxuXHQvLyBpZiBzbywgcmVmcmVzaCB0aGUgcGFnZSB3aXRob3V0IGNyZWRlbnRpYWxzXG5cdGlmIChkb2N1bWVudC5VUkwgIT09IGxvY2F0aW9uLmhyZWYpIHtcblx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tc2VsZi1hc3NpZ25cblx0XHRsb2NhdGlvbi5ocmVmID0gbG9jYXRpb24uaHJlZjtcblx0fVxuXG5cdGFwcCA9IF9hcHA7XG5cblx0aW5pdF90cmFuc3BvcnQoYXBwLmhvb2tzLnRyYW5zcG9ydCA/PyB7fSk7XG5cblx0YXdhaXQgX2FwcC5ob29rcy5pbml0Py4oKTtcblxuXHRyb3V0ZXMgPSBfX1NWRUxURUtJVF9DTElFTlRfUk9VVElOR19fID8gcGFyc2Vfcm91dGVzKF9hcHApIDogW107XG5cdGNvbnRhaW5lciA9IF9fU1ZFTFRFS0lUX0VNQkVEREVEX18gPyBfdGFyZ2V0IDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHR0YXJnZXQgPSBfdGFyZ2V0O1xuXG5cdC8vIHdlIGltcG9ydCB0aGUgcm9vdCBsYXlvdXQvZXJyb3Igbm9kZXMgZWFnZXJseSwgc28gdGhhdFxuXHQvLyBjb25uZWN0aXZpdHkgZXJyb3JzIGFmdGVyIGluaXRpYWxpc2F0aW9uIGRvbid0IG51a2UgdGhlIGFwcFxuXHRkZWZhdWx0X2xheW91dF9sb2FkZXIgPSBfYXBwLm5vZGVzWzBdO1xuXHRkZWZhdWx0X2Vycm9yX2xvYWRlciA9IF9hcHAubm9kZXNbMV07XG5cblx0Y29uc3QgW3Jvb3RfbGF5b3V0XSA9IGF3YWl0IFByb21pc2UuYWxsKFtkZWZhdWx0X2xheW91dF9sb2FkZXIoKSwgZGVmYXVsdF9lcnJvcl9sb2FkZXIoKV0pO1xuXG5cdC8vIHRoZSByb290IGJvdW5kYXJ5IHN0YXlzIHVuYXJtZWQ6IHRoZSByb290ICtlcnJvci5zdmVsdGUgcmVuZGVycyBhdCB0aGUgbm9kZSBiZWxvdyBpdFxuXHRjb25zdCB0cmVlID0gbmV3IFJlbmRlck5vZGUocm9vdF9sYXlvdXQuY29tcG9uZW50LCB1bmRlZmluZWQpO1xuXG5cdHByb3BzID0gbmV3IFByb3BzKHtcblx0XHRwYWdlLFxuXHRcdHRyZWUsXG5cdFx0Zm9ybTogdW5kZWZpbmVkLFxuXHRcdGVycm9yOiB1bmRlZmluZWQsXG5cdFx0b25lcnJvcjogKF8sIHJlc2V0KSA9PiByZXNldHRlcnMuYWRkKHJlc2V0KVxuXHR9KTtcblxuXHRjb25zdCBoaXN0b3J5X21ldGFkYXRhID0gZ2V0X2hpc3RvcnlfbWV0YWRhdGEoKTtcblx0Y3VycmVudF9oaXN0b3J5X2luZGV4ID0gaGlzdG9yeV9tZXRhZGF0YT8uaGlzdG9yeUluZGV4ID8/IDA7XG5cdGN1cnJlbnRfbmF2aWdhdGlvbl9pbmRleCA9IGhpc3RvcnlfbWV0YWRhdGE/Lm5hdmlnYXRpb25JbmRleCA/PyAwO1xuXHRjdXJyZW50X3Jlc2V0X2luZGV4ID0gaGlzdG9yeV9tZXRhZGF0YT8ucmVzZXRJbmRleCA/PyAwO1xuXG5cdGlmICghY3VycmVudF9oaXN0b3J5X2luZGV4KSB7XG5cdFx0Ly8gd2UgdXNlIERhdGUubm93KCkgYXMgYW4gb2Zmc2V0IHNvIHRoYXQgY3Jvc3MtZG9jdW1lbnQgbmF2aWdhdGlvbnNcblx0XHQvLyB3aXRoaW4gdGhlIGFwcCBkb24ndCByZXN1bHQgaW4gZGF0YSBsb3NzXG5cdFx0Y3VycmVudF9oaXN0b3J5X2luZGV4ID0gY3VycmVudF9uYXZpZ2F0aW9uX2luZGV4ID0gY3VycmVudF9yZXNldF9pbmRleCA9IERhdGUubm93KCk7XG5cblx0XHQvLyBjcmVhdGUgaW5pdGlhbCBoaXN0b3J5IGVudHJ5LCBzbyB3ZSBjYW4gcmV0dXJuIGhlcmVcblx0XHRoaXN0b3J5LnJlcGxhY2VTdGF0ZShcblx0XHRcdHtcblx0XHRcdFx0Li4uaGlzdG9yeS5zdGF0ZSxcblx0XHRcdFx0W0hJU1RPUllfTUVUQURBVEFfS0VZXToge1xuXHRcdFx0XHRcdGhpc3RvcnlJbmRleDogY3VycmVudF9oaXN0b3J5X2luZGV4LFxuXHRcdFx0XHRcdG5hdmlnYXRpb25JbmRleDogY3VycmVudF9uYXZpZ2F0aW9uX2luZGV4LFxuXHRcdFx0XHRcdHN0YXRlOiBzdHJpbmdpZnkoe30pLFxuXHRcdFx0XHRcdHBlcnNpc3RTdGF0ZTogZmFsc2UsXG5cdFx0XHRcdFx0cmVzZXRJbmRleDogY3VycmVudF9oaXN0b3J5X2luZGV4XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHQnJ1xuXHRcdCk7XG5cdH1cblxuXHRzZXRfaGlzdG9yeV9vcHRpb25zKFxuXHRcdGN1cnJlbnRfaGlzdG9yeV9pbmRleCxcblx0XHQvKiogQHR5cGUge0hpc3RvcnlNZXRhZGF0YX0gKi8gKGdldF9oaXN0b3J5X21ldGFkYXRhKCkpXG5cdCk7XG5cblx0Ly8gaWYgd2UgcmVsb2FkIHRoZSBwYWdlLCBvciBDbWQtU2hpZnQtVCBiYWNrIHRvIGl0LFxuXHQvLyByZWNvdmVyIHNjcm9sbCBwb3NpdGlvblxuXHRjb25zdCBzY3JvbGwgPSBoaXN0b3J5X2luZm9bY3VycmVudF9oaXN0b3J5X2luZGV4XT8uc2Nyb2xsO1xuXHRmdW5jdGlvbiByZXN0b3JlX3JlbG9hZF9zY3JvbGwoKSB7XG5cdFx0aWYgKHNjcm9sbCkge1xuXHRcdFx0aGlzdG9yeS5zY3JvbGxSZXN0b3JhdGlvbiA9ICdtYW51YWwnO1xuXHRcdFx0c2Nyb2xsVG8oc2Nyb2xsLngsIHNjcm9sbC55KTtcblx0XHR9XG5cdH1cblxuXHRpZiAoZGF0YSkge1xuXHRcdHJlc3RvcmVfcmVsb2FkX3Njcm9sbCgpO1xuXG5cdFx0YXdhaXQgX2h5ZHJhdGUodGFyZ2V0LCBkYXRhKTtcblx0fSBlbHNlIHtcblx0XHRhd2FpdCBuYXZpZ2F0ZSh7XG5cdFx0XHR0eXBlOiAnZW50ZXInLFxuXHRcdFx0dXJsOiByZXNvbHZlX3VybChhcHAuaGFzaCA/IGRlY29kZV9oYXNoKG5ldyBVUkwobG9jYXRpb24uaHJlZikpIDogbG9jYXRpb24uaHJlZiksXG5cdFx0XHRyZXBsYWNlX3N0YXRlOiB0cnVlLFxuXHRcdFx0c3RhdGU6IGhpc3RvcnlfbWV0YWRhdGE/LnBlcnNpc3RTdGF0ZSA/IHBhcnNlKGhpc3RvcnlfbWV0YWRhdGEuc3RhdGUpIDoge30sXG5cdFx0XHRwZXJzaXN0X3N0YXRlOiBoaXN0b3J5X21ldGFkYXRhPy5wZXJzaXN0U3RhdGUgPz8gZmFsc2Vcblx0XHR9KTtcblxuXHRcdHJlc3RvcmVfcmVsb2FkX3Njcm9sbCgpO1xuXHR9XG5cblx0X3N0YXJ0X3JvdXRlcigpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBfaW52YWxpZGF0ZShyZXNldF9wYWdlX3N0YXRlID0gdHJ1ZSkge1xuXHQvLyBBY2NlcHQgYWxsIGludmFsaWRhdGlvbnMgYXMgdGhleSBjb21lLCBkb24ndCBzd2FsbG93IGFueSB3aGlsZSBhbm90aGVyIGludmFsaWRhdGlvblxuXHQvLyBpcyBydW5uaW5nIGJlY2F1c2Ugc3Vic2VxdWVudCBpbnZhbGlkYXRpb25zIG1heSBtYWtlIGVhcmxpZXIgb25lcyBvdXRkYXRlZCxcblx0Ly8gYnV0IGJhdGNoIG11bHRpcGxlIHN5bmNocm9ub3VzIGludmFsaWRhdGlvbnMuXG5cdGF3YWl0IChwZW5kaW5nX2ludmFsaWRhdGUgfHw9IFByb21pc2UucmVzb2x2ZSgpKTtcblx0aWYgKHBlbmRpbmdfaW52YWxpZGF0ZSA9PT0gbnVsbCkgcmV0dXJuO1xuXHRwZW5kaW5nX2ludmFsaWRhdGUgPSBudWxsO1xuXG5cdGNvbnN0IHRva2VuID0gKGludmFsaWRhdGlvbl90b2tlbiA9IHt9KTtcblx0Y29uc3QgbmF2X3Rva2VuID0gbmF2aWdhdGlvbl90b2tlbjtcblx0Y29uc3QgcHJldl9jdXJyZW50ID0gY3VycmVudDtcblx0Y29uc3QgaW50ZW50ID0gYXdhaXQgZ2V0X25hdmlnYXRpb25faW50ZW50KGN1cnJlbnQudXJsLCB0cnVlKTtcblxuXHQvLyBDbGVhciBwcmVsb2FkLCBpdCBtaWdodCBiZSBhZmZlY3RlZCBieSB0aGUgaW52YWxpZGF0aW9uLlxuXHQvLyBBbHNvIHNvbHZlcyBhbiBlZGdlIGNhc2Ugd2hlcmUgYSBwcmVsb2FkIGlzIHRyaWdnZXJlZCwgdGhlIG5hdmlnYXRpb24gZm9yIGl0XG5cdC8vIHdhcyB0aGVuIHRyaWdnZXJlZCBhbmQgaXMgc3RpbGwgcnVubmluZyB3aGlsZSB0aGUgaW52YWxpZGF0aW9uIGtpY2tzIGluLFxuXHQvLyBhdCB3aGljaCBwb2ludCB0aGUgaW52YWxpZGF0aW9uIHNob3VsZCB0YWtlIG92ZXIgYW5kIFwid2luXCIuXG5cdGRpc2NhcmRfbG9hZF9jYWNoZSgpO1xuXG5cdC8vIFJlcnVuIHF1ZXJpZXNcblx0LyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBQcm9taXNlPHZvaWQ+Pn0gKi9cblx0Y29uc3QgbGl2ZV9xdWVyeV9yZWNvbm5lY3RzID0gbmV3IE1hcCgpO1xuXHRpZiAoZm9yY2VfaW52YWxpZGF0aW9uKSB7XG5cdFx0Zm9yIChjb25zdCBbLCB7IHJlc291cmNlIH1dIG9mIGNhY2hlX2VudHJpZXMocXVlcnlfbWFwKSkge1xuXHRcdFx0dm9pZCByZXNvdXJjZS5yZWZyZXNoKCk7XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCBba2V5LCB7IHJlc291cmNlIH1dIG9mIGNhY2hlX2VudHJpZXMobGl2ZV9xdWVyeV9tYXApKSB7XG5cdFx0XHRjb25zdCBwcm9taXNlID0gcmVzb3VyY2UucmVjb25uZWN0KCk7XG5cdFx0XHRwcm9taXNlLmNhdGNoKG5vb3ApO1xuXHRcdFx0bGl2ZV9xdWVyeV9yZWNvbm5lY3RzLnNldChrZXksIHByb21pc2UpO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IHByZXZfc3RhdGUgPSBwYWdlLnN0YXRlO1xuXHRjb25zdCBwcmV2X3NoYWxsb3cgPSBwYWdlLnNoYWxsb3c7XG5cdGNvbnN0IG5hdmlnYXRpb25fcmVzdWx0ID0gaW50ZW50ICYmIChhd2FpdCBsb2FkX3JvdXRlKGludGVudCkpO1xuXHRpZiAoIW5hdmlnYXRpb25fcmVzdWx0IHx8IHRva2VuICE9PSBpbnZhbGlkYXRpb25fdG9rZW4gfHwgbmF2X3Rva2VuICE9PSBuYXZpZ2F0aW9uX3Rva2VuKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aWYgKG5hdmlnYXRpb25fcmVzdWx0LnR5cGUgPT09ICdyZWRpcmVjdCcpIHtcblx0XHRyZXR1cm4gX2dvdG8oXG5cdFx0XHRuZXcgVVJMKG5hdmlnYXRpb25fcmVzdWx0LmxvY2F0aW9uLCBjdXJyZW50LnVybCkuaHJlZixcblx0XHRcdHsgcmVwbGFjZTogdHJ1ZSB9LFxuXHRcdFx0MSxcblx0XHRcdHRva2VuXG5cdFx0KTtcblx0fVxuXG5cdC8vIGEgbmF2aWdhdGlvbiBhcHBsaWVkIGl0cyByZXN1bHQgd2hpbGUgdGhlIGludmFsaWRhdGlvbiB3YXMgbG9hZGluZyxcblx0Ly8gc28gdGhlIGludmFsaWRhdGlvbiBjb250YWlucyBvdXRkYXRlZCBkYXRhIGZvciBhIHBhZ2Ugd2UgYXJlIG5vIGxvbmdlciBvblxuXHRpZiAoY3VycmVudCAhPT0gcHJldl9jdXJyZW50KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0YXBwbHlfbmF2aWdhdGlvbl9yZXN1bHQobmF2aWdhdGlvbl9yZXN1bHQpO1xuXG5cdC8vIFByZXNlcnZlIGBwYWdlLnN0YXRlYCB3aGVuIGludmFsaWRhdGluZyB3aXRob3V0IHJlc2V0dGluZyBpdCAoZS5nLiBgcmVmcmVzaGAvYHJlZnJlc2hBbGxgKS5cblx0Ly8gTXVzdCBydW4gYWZ0ZXIgYGFwcGx5X25hdmlnYXRpb25fcmVzdWx0YCwgd2hpY2ggb3ZlcndyaXRlcyBgc3RhdGVgL2BzaGFsbG93YCB3aXRoIHRoZSBmcmVzaFxuXHQvLyBwYWdlIG9iamVjdCdzIGB7fWAvYG51bGxgIHZhbHVlcyB3aGVuIHRoZSBwYWdlIGNoYW5nZWQuXG5cdGlmICghcmVzZXRfcGFnZV9zdGF0ZSkge1xuXHRcdHVwZGF0ZV9wYWdlKHsgc3RhdGU6IHByZXZfc3RhdGUgfSk7XG5cdH1cblxuXHR1cGRhdGVfcGFnZSh7IHNoYWxsb3c6IHByZXZfc2hhbGxvdyB9KTtcblx0Y3VycmVudCA9IHsgLi4ubmF2aWdhdGlvbl9yZXN1bHQuc3RhdGUsIG5hdjogY3VycmVudC5uYXYgfTtcblx0cmVzZXRfaW52YWxpZGF0aW9uKCk7XG5cblx0Ly8gb25seSB3YWl0IGZvciBwcm9taXNlcyB0aGF0IGFyZSBjb25uZWN0ZWQgdG8gcXVlcmllcyB0aGF0IHN0aWxsIGV4aXN0XG5cdC8qKiBAdHlwZSB7UHJvbWlzZTxhbnk+W119ICovXG5cdGNvbnN0IHByb21pc2VzID0gW107XG5cdGZvciAoY29uc3QgWywgeyByZXNvdXJjZSB9XSBvZiBjYWNoZV9lbnRyaWVzKHF1ZXJ5X21hcCkpIHtcblx0XHRwcm9taXNlcy5wdXNoKHJlc291cmNlKTtcblx0fVxuXHRmb3IgKGNvbnN0IFtrZXldIG9mIGNhY2hlX2VudHJpZXMobGl2ZV9xdWVyeV9tYXApKSB7XG5cdFx0Y29uc3QgcHJvbWlzZSA9IGxpdmVfcXVlcnlfcmVjb25uZWN0cy5nZXQoa2V5KTtcblx0XHRpZiAocHJvbWlzZSkge1xuXHRcdFx0cHJvbWlzZXMucHVzaChwcm9taXNlKTtcblx0XHR9XG5cdH1cblxuXHQvLyBEb24ndCB1c2UgYWxsU2V0dGxlZCB5ZXQgYmVjYXVzZSBpdCdzIHRvbyBuZXdcblx0YXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpLmNhdGNoKG5vb3ApO1xufVxuXG5mdW5jdGlvbiByZXNldF9pbnZhbGlkYXRpb24oKSB7XG5cdGludmFsaWRhdGVkLmxlbmd0aCA9IDA7XG5cdGZvcmNlX2ludmFsaWRhdGlvbiA9IGZhbHNlO1xufVxuXG5sZXQgd2FybmVkX3NuYXBzaG90X2V4cG9ydCA9IGZhbHNlO1xuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICogQGRlcHJlY2F0ZWQgVE9ETyA0LjAgZ2V0IHJpZCBvZiB0aGlzXG4gKi9cbmZ1bmN0aW9uIGNhcHR1cmVfc25hcHNob3QoaW5kZXgpIHtcblx0aWYgKHByb3BzLmNvbXBvbmVudHMuc29tZSgoYykgPT4gYz8uc25hcHNob3QpKSB7XG5cdFx0aWYgKERFViAmJiAhd2FybmVkX3NuYXBzaG90X2V4cG9ydCkge1xuXHRcdFx0d2FybmVkX3NuYXBzaG90X2V4cG9ydCA9IHRydWU7XG5cdFx0XHR3LnNuYXBzaG90X2V4cG9ydF9kZXByZWNhdGVkKCk7XG5cdFx0fVxuXHRcdHNuYXBzaG90c1tpbmRleF0gPSBwcm9wcy5jb21wb25lbnRzLm1hcCgoYykgPT4gYz8uc25hcHNob3Q/LmNhcHR1cmUoKSk7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAqIEBkZXByZWNhdGVkIFRPRE8gNC4wIGdldCByaWQgb2YgdGhpc1xuICovXG5mdW5jdGlvbiByZXN0b3JlX3NuYXBzaG90KGluZGV4KSB7XG5cdHNuYXBzaG90c1tpbmRleF0/LmZvckVhY2goKHZhbHVlLCBpKSA9PiB7XG5cdFx0cHJvcHMuY29tcG9uZW50c1tpXT8uc25hcHNob3Q/LnJlc3RvcmUodmFsdWUpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcGVyc2lzdF9zdGF0ZSgpIHtcblx0Y2FwdHVyZV9zY3JvbGwoY3VycmVudF9oaXN0b3J5X2luZGV4KTtcblx0c3RvcmFnZS5zZXQoSElTVE9SWV9JTkZPX0tFWSwgaGlzdG9yeV9pbmZvKTtcblxuXHRjYXB0dXJlX3NuYXBzaG90KGN1cnJlbnRfbmF2aWdhdGlvbl9pbmRleCk7XG5cdHN0b3JhZ2Uuc2V0KFNOQVBTSE9UX0tFWSwgc25hcHNob3RzKTtcblxuXHRwZXJzaXN0X25hdmlnYXRpb25fc25hcHNob3RzKGN1cnJlbnRfaGlzdG9yeV9pbmRleCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmcgfCBVUkx9IHVybFxuICogQHBhcmFtIHt7IHR5cGU/OiBOYXZpZ2F0aW9uVHlwZTsgcmVwbGFjZT86IGJvb2xlYW47IHJlc2V0PzogYm9vbGVhbjsgcmVmcmVzaEFsbD86IGJvb2xlYW47IGludmFsaWRhdGU/OiBBcnJheTxzdHJpbmcgfCBVUkwgfCAoKHVybDogVVJMKSA9PiBib29sZWFuKT47IHN0YXRlPzogUmVjb3JkPHN0cmluZywgYW55PjsgcGVyc2lzdFN0YXRlPzogYm9vbGVhbjsgZXZlbnQ/OiBFdmVudDsgYWN0aW9uX3Jlc3VsdD86IEFjdGlvblJlc3VsdCB9fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7bnVtYmVyfSBbcmVkaXJlY3RfY291bnRdXG4gKiBAcGFyYW0ge3t9fSBbbmF2X3Rva2VuXVxuICogQHBhcmFtIHtOYXZpZ2F0aW9uSW50ZW50IHwgdW5kZWZpbmVkfSBbaW50ZW50XSBuYXZpZ2F0aW9uIGludGVudCwgd2hlbiBhbHJlYWR5IGtub3duIGJ5IHRoZSBjYWxsZXIgKGF2b2lkcyByZWNvbXB1dGluZyBpdClcbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gX2dvdG8odXJsLCBvcHRpb25zID0ge30sIHJlZGlyZWN0X2NvdW50ID0gMCwgbmF2X3Rva2VuID0ge30sIGludGVudCkge1xuXHQvKiogQHR5cGUge1NldDxzdHJpbmc+fSAqL1xuXHRsZXQgcXVlcnlfa2V5cztcblx0LyoqIEB0eXBlIHtTZXQ8c3RyaW5nPn0gKi9cblx0bGV0IGxpdmVfcXVlcnlfa2V5cztcblxuXHQvLyBDbGVhciBwcmVsb2FkIGNhY2hlIHdoZW4gcmVmcmVzaEFsbCBpcyB0cnVlIHRvIGVuc3VyZSBmcmVzaCBkYXRhXG5cdC8vIGFmdGVyIGZvcm0gc3VibWlzc2lvbnMgb3IgZXhwbGljaXQgaW52YWxpZGF0aW9uc1xuXHRpZiAob3B0aW9ucy5yZWZyZXNoQWxsKSB7XG5cdFx0ZGlzY2FyZF9sb2FkX2NhY2hlKCk7XG5cdH1cblxuXHRhd2FpdCBuYXZpZ2F0ZSh7XG5cdFx0dHlwZTogb3B0aW9ucy50eXBlID8/ICdnb3RvJyxcblx0XHR1cmw6IHJlc29sdmVfdXJsKHVybCksXG5cdFx0cmVzZXQ6IG9wdGlvbnMucmVzZXQsXG5cdFx0cmVwbGFjZV9zdGF0ZTogb3B0aW9ucy5yZXBsYWNlLFxuXHRcdHN0YXRlOiBvcHRpb25zLnN0YXRlLFxuXHRcdHBlcnNpc3Rfc3RhdGU6IG9wdGlvbnMucGVyc2lzdFN0YXRlLFxuXHRcdGV2ZW50OiBvcHRpb25zLmV2ZW50LFxuXHRcdGFjdGlvbl9yZXN1bHQ6IG9wdGlvbnMuYWN0aW9uX3Jlc3VsdCxcblx0XHRyZWRpcmVjdF9jb3VudCxcblx0XHRuYXZfdG9rZW4sXG5cdFx0aW50ZW50LFxuXHRcdGFjY2VwdDogKCkgPT4ge1xuXHRcdFx0aWYgKG9wdGlvbnMucmVmcmVzaEFsbCkge1xuXHRcdFx0XHRmb3JjZV9pbnZhbGlkYXRpb24gPSB0cnVlO1xuXHRcdFx0XHRxdWVyeV9rZXlzID0gbmV3IFNldCgpO1xuXHRcdFx0XHRmb3IgKGNvbnN0IFtrZXksIGVudHJ5XSBvZiBjYWNoZV9lbnRyaWVzKHF1ZXJ5X21hcCkpIHtcblx0XHRcdFx0XHQvLyBkb24ndCByZWZyZXNoIHlldCwgYXMgc29tZSBxdWVyaWVzIHdpbGwgYmUgdW5yZW5kZXJlZCxcblx0XHRcdFx0XHQvLyBidXQgY2xlYXIgY2FjaGVzIHNvIHRoYXQgbmV3bHkgcmVuZGVyZWQgcXVlcmllc1xuXHRcdFx0XHRcdC8vIGRvbid0IHVzZSBzdGFsZSBkYXRhLiBUT0RPIHNhbWUgZm9yIGBsaXZlX3F1ZXJ5X21hcGBcblx0XHRcdFx0XHRlbnRyeS5yZXNvdXJjZT8ucmVzZXQoKTtcblx0XHRcdFx0XHRxdWVyeV9rZXlzLmFkZChrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGxpdmVfcXVlcnlfa2V5cyA9IG5ldyBTZXQoKTtcblx0XHRcdFx0Zm9yIChjb25zdCBba2V5XSBvZiBjYWNoZV9lbnRyaWVzKGxpdmVfcXVlcnlfbWFwKSkge1xuXHRcdFx0XHRcdGxpdmVfcXVlcnlfa2V5cy5hZGQoa2V5KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAob3B0aW9ucy5pbnZhbGlkYXRlKSB7XG5cdFx0XHRcdG9wdGlvbnMuaW52YWxpZGF0ZS5mb3JFYWNoKHB1c2hfaW52YWxpZGF0ZWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0aWYgKG9wdGlvbnMucmVmcmVzaEFsbCkge1xuXHRcdC8vIFRPRE8gdGhlIHRpY2tzIHNob3VsZG4ndCBiZSBuZWNlc3NhcnksIHNvbWV0aGluZyBpbnNpZGUgU3ZlbHRlIGl0c2VsZiBpcyBidWdneVxuXHRcdC8vIHdoZW4gYSBxdWVyeSBpbiBhIGxheW91dCB0aGF0IHN0aWxsIGV4aXN0cyBhZnRlciBwYWdlIGNoYW5nZSBpcyByZWZyZXNoZWQgZWFybGllciB0aGFuIHRoaXNcblx0XHR2b2lkIHRpY2soKVxuXHRcdFx0LnRoZW4odGljaylcblx0XHRcdC50aGVuKCgpID0+IHtcblx0XHRcdFx0Zm9yIChjb25zdCBba2V5LCB7IHJlc291cmNlIH1dIG9mIGNhY2hlX2VudHJpZXMocXVlcnlfbWFwKSkge1xuXHRcdFx0XHRcdGlmIChxdWVyeV9rZXlzPy5oYXMoa2V5KSkge1xuXHRcdFx0XHRcdFx0dm9pZCByZXNvdXJjZS5zdGFydCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRmb3IgKGNvbnN0IFtrZXksIHsgcmVzb3VyY2UgfV0gb2YgY2FjaGVfZW50cmllcyhsaXZlX3F1ZXJ5X21hcCkpIHtcblx0XHRcdFx0XHRpZiAobGl2ZV9xdWVyeV9rZXlzPy5oYXMoa2V5KSkge1xuXHRcdFx0XHRcdFx0dm9pZCByZXNvdXJjZS5yZWNvbm5lY3QoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHR9XG59XG5cbi8qKiBAcGFyYW0ge2ltcG9ydCgnLi90eXBlcy5qcycpLk5hdmlnYXRpb25JbnRlbnR9IGludGVudCAqL1xuYXN5bmMgZnVuY3Rpb24gX3ByZWxvYWRfZGF0YShpbnRlbnQpIHtcblx0Ly8gUmV1c2UgdGhlIGV4aXN0aW5nIHBlbmRpbmcgcHJlbG9hZCBpZiBpdCdzIGZvciB0aGUgc2FtZSBuYXZpZ2F0aW9uLlxuXHQvLyBQcmV2ZW50cyBhbiBlZGdlIGNhc2Ugd2hlcmUgc2FtZSBwcmVsb2FkIGlzIHRyaWdnZXJlZCBtdWx0aXBsZSB0aW1lcyxcblx0Ly8gdGhlbiBhIGxhdGVyIG9uZSBpcyBiZWNvbWluZyB0aGUgcmVhbCBuYXZpZ2F0aW9uIGFuZCB0aGUgcHJlbG9hZCB0b2tlbnNcblx0Ly8gZ2V0IG91dCBvZiBzeW5jLlxuXHRpZiAoaW50ZW50LmlkICE9PSBsb2FkX2NhY2hlPy5pZCkge1xuXHRcdGRpc2NhcmRfbG9hZF9jYWNoZSgpO1xuXG5cdFx0Y29uc3QgcHJlbG9hZCA9IHt9O1xuXHRcdHByZWxvYWRfdG9rZW5zLmFkZChwcmVsb2FkKTtcblx0XHRsb2FkX2NhY2hlID0ge1xuXHRcdFx0aWQ6IGludGVudC5pZCxcblx0XHRcdHRva2VuOiBwcmVsb2FkLFxuXHRcdFx0cHJvbWlzZTogbG9hZF9yb3V0ZSh7IC4uLmludGVudCwgcHJlbG9hZCB9KS5maW5hbGx5KCgpID0+IHtcblx0XHRcdFx0cHJlbG9hZF90b2tlbnMuZGVsZXRlKHByZWxvYWQpO1xuXHRcdFx0fSksXG5cdFx0XHRmb3JrOiBudWxsXG5cdFx0fTtcblxuXHRcdGxvYWRfY2FjaGUucHJvbWlzZS5jYXRjaChkaXNjYXJkX2xvYWRfY2FjaGUpO1xuXG5cdFx0aWYgKF9fU1ZFTFRFS0lUX0ZPUktfUFJFTE9BRFNfXykge1xuXHRcdFx0Y29uc3QgbGMgPSBsb2FkX2NhY2hlO1xuXG5cdFx0XHRsYy5mb3JrID0gbGMucHJvbWlzZS50aGVuKChyZXN1bHQpID0+IHtcblx0XHRcdFx0Ly8gaWYgbG9hZF9jYWNoZSB3YXMgZGlzY2FyZGVkIGJlZm9yZSBsb2FkX2NhY2hlLnByb21pc2UgY291bGRcblx0XHRcdFx0Ly8gcmVzb2x2ZSwgYmFpbCByYXRoZXIgdGhhbiBjcmVhdGluZyBhbiBvcnBoYW4gZm9ya1xuXHRcdFx0XHRpZiAobGMgPT09IGxvYWRfY2FjaGUgJiYgcmVzdWx0LnR5cGUgPT09ICdsb2FkZWQnKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdHJldHVybiBmb3JrKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0YXBwbHlfbmF2aWdhdGlvbl9yZXN1bHQocmVzdWx0KTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0gY2F0Y2gge1xuXHRcdFx0XHRcdFx0Ly8gaWYgaXQgZXJyb3JzLCBpdCdzIGJlY2F1c2UgdGhlIGV4cGVyaW1lbnRhbCBmbGFnIGlzbid0IGVuYWJsZWQgaW4gU3ZlbHRlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gbG9hZF9jYWNoZS5wcm9taXNlO1xufVxuXG4vKipcbiAqIEZldGNoIGFuZCBwYXJzZSB0aGUgcm91dGUgd2l0aCB0aGUgZ2l2ZW4gSUQgZnJvbSB0aGUgc2VydmVyLXNpZGUgcm91dGUgcmVzb2x1dGlvbiBlbmRwb2ludC5cbiAqIFJldHVybnMgYEVORFBPSU5UX09OTFlgIGlmIHRoZSByb3V0ZSBleGlzdHMgYnV0IGhhcyBubyBjb2RlIHRvIHByZWxvYWQsIG9yIGB1bmRlZmluZWRgIGlmXG4gKiB0aGVyZSBpcyBubyBzdWNoIHJvdXRlLiBPbmx5IHVzZWQgd2hlbiBgcm91dGVyLnJlc29sdXRpb24gPT09ICdzZXJ2ZXInYC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHJldHVybnMge1Byb21pc2U8aW1wb3J0KCd0eXBlcycpLkNTUlJvdXRlIHwgdHlwZW9mIEVORFBPSU5UX09OTFkgfCB1bmRlZmluZWQ+fVxuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkX3JvdXRlX2J5X2lkKGlkKSB7XG5cdC8qKiBAdHlwZSB7eyByb3V0ZT86IGltcG9ydCgndHlwZXMnKS5DU1JSb3V0ZVNlcnZlciwgZW5kcG9pbnRfb25seT86IGJvb2xlYW4gfX0gKi9cblx0bGV0IG1vZHVsZTtcblxuXHR0cnkge1xuXHRcdG1vZHVsZSA9IGF3YWl0IGltcG9ydChcblx0XHRcdC8qIEB2aXRlLWlnbm9yZSAqL1xuXHRcdFx0X192aXRlX19pbmplY3RRdWVyeShiYXNlICsgcm91dGVfaWRfcmVzb2x1dGlvbl9wYXRobmFtZShpZCksICdpbXBvcnQnKVxuXHRcdCk7XG5cdH0gY2F0Y2gge1xuXHRcdC8vIGlmIHRoZXJlJ3Mgbm8gbW9kdWxlIGF0IHRoYXQgcGF0aCB0aGUgcmVzcG9uc2UgaXMgYSA0MDQgKG9yLCBvbiBhIHN0YXRpY1xuXHRcdC8vIGhvc3QsIGZhbGxiYWNrIEhUTUwgd2l0aCB0aGUgd3JvbmcgTUlNRSB0eXBlKSBhbmQgdGhlIGltcG9ydCByZWplY3RzIOKAlFxuXHRcdC8vIHRyZWF0IGl0IHRoZSBzYW1lIGFzIGFuIHVua25vd24gcm91dGUgcmF0aGVyIHRoYW4gc3VyZmFjaW5nIGEgY3J5cHRpYyBlcnJvclxuXHRcdHJldHVybjtcblx0fVxuXG5cdGlmIChtb2R1bGUuZW5kcG9pbnRfb25seSkge1xuXHRcdC8vIFRoZSByb3V0ZSBleGlzdHMsIGl0IGp1c3QgaGFzIG5vIGNvZGUgdG8gcHJlbG9hZC5cblx0XHRyb3V0ZV9pZF9jYWNoZS5zZXQoaWQsIEVORFBPSU5UX09OTFkpO1xuXHRcdHJldHVybiBFTkRQT0lOVF9PTkxZO1xuXHR9XG5cblx0aWYgKCFtb2R1bGUucm91dGUpIHJldHVybjtcblxuXHRyZXR1cm4gcGFyc2VfYW5kX2NhY2hlX3NlcnZlcl9yb3V0ZShtb2R1bGUucm91dGUpO1xufVxuXG4vKipcbiAqIEltcG9ydCB0aGUgbW9kdWxlcyBmb3IgYSByb3V0ZSdzIGxheW91dCBhbmQgbGVhZiBub2Rlcywgd2l0aG91dCBydW5uaW5nIGBsb2FkYCBmdW5jdGlvbnMuXG4gKiBAcGFyYW0ge2ltcG9ydCgndHlwZXMnKS5DU1JSb3V0ZX0gcm91dGVcbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkX3JvdXRlX25vZGVzKHJvdXRlKSB7XG5cdGF3YWl0IFByb21pc2UuYWxsKFxuXHRcdC8qKiBAdHlwZSB7W2hhc19zZXJ2ZXJfbG9hZDogYm9vbGVhbiwgbm9kZV9sb2FkZXI6IGltcG9ydCgndHlwZXMnKS5DU1JQYWdlTm9kZUxvYWRlcl1bXX0gKi8gKFxuXHRcdFx0Wy4uLnJvdXRlLmxheW91dHMsIHJvdXRlLmxlYWZdLmZpbHRlcihCb29sZWFuKVxuXHRcdCkubWFwKChbLCBub2RlX2xvYWRlcl0pID0+IG5vZGVfbG9hZGVyKCkpXG5cdCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtVUkx9IHVybFxuICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIF9wcmVsb2FkX2NvZGUodXJsKSB7XG5cdGNvbnN0IHJvdXRlID0gKGF3YWl0IGdldF9uYXZpZ2F0aW9uX2ludGVudCh1cmwsIGZhbHNlKSk/LnJvdXRlO1xuXG5cdGlmIChyb3V0ZSkge1xuXHRcdGF3YWl0IGxvYWRfcm91dGVfbm9kZXMocm91dGUpO1xuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5OYXZpZ2F0aW9uRmluaXNoZWR9IHJlc3VsdFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0XG4gKiBAcGFyYW0ge2Jvb2xlYW59IHNob3VsZF9oeWRyYXRlXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemUocmVzdWx0LCB0YXJnZXQsIHNob3VsZF9oeWRyYXRlKSB7XG5cdGlmIChfX1NWRUxURUtJVF9ERVZfXyAmJiByZXN1bHQuc3RhdGUuZXJyb3IgJiYgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcigndml0ZS1lcnJvci1vdmVybGF5JykpXG5cdFx0cmV0dXJuO1xuXG5cdC8qKiBAdHlwZSB7TmF2aWdhdGlvbkV2ZW50fSAqL1xuXHRjb25zdCBuYXYgPSB7XG5cdFx0cGFyYW1zOiBjdXJyZW50LnBhcmFtcyxcblx0XHRyb3V0ZTogeyBpZDogY3VycmVudC5yb3V0ZT8uaWQgPz8gbnVsbCB9LFxuXHRcdHVybDogbmV3IFVSTChsb2NhdGlvbi5ocmVmKVxuXHR9O1xuXG5cdGN1cnJlbnQgPSB7XG5cdFx0Li4ucmVzdWx0LnN0YXRlLFxuXHRcdG5hdlxuXHR9O1xuXG5cdC8vIFJlbW92ZXMgdGhlIHN0eWxlIG5vZGUgd2UgdXNlZCB0byBhdm9pZCBGT1VDIGR1cmluZyBkZXZlbG9wbWVudFxuXHRpZiAoX19TVkVMVEVLSVRfREVWX18pIHtcblx0XHRjb25zdCBzdHlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3N0eWxlW2RhdGEtc3ZlbHRla2l0XScpO1xuXHRcdGlmIChzdHlsZSkgc3R5bGUucmVtb3ZlKCk7XG5cdH1cblxuXHRhcHBseV9uYXZpZ2F0aW9uX3Jlc3VsdChyZXN1bHQpO1xuXG5cdC8vIFRPRE8gdHJlZXNoYWtlIGBoeWRyYXRlYCBpbiBjc3IgbW9kZVxuXHRjb25zdCByZW5kZXIgPSBzaG91bGRfaHlkcmF0ZSA/IGh5ZHJhdGUgOiBtb3VudDtcblxuXHRyZW5kZXIoUm9vdCwge1xuXHRcdHRhcmdldCxcblx0XHRwcm9wcyxcblx0XHR0cmFuc2Zvcm1FcnJvcjogLyoqIEBwYXJhbSB7dW5rbm93bn0gZSAqLyBhc3luYyAoZSkgPT4ge1xuXHRcdFx0Y29uc3QgZXJyb3IgPSBhd2FpdCBoYW5kbGVfZXJyb3IoZSwgY3VycmVudC5uYXYpO1xuXHRcdFx0dXBkYXRlX3BhZ2UoeyBlcnJvciwgc3RhdHVzOiBlcnJvci5zdGF0dXMgfSk7XG5cdFx0XHRyZXR1cm4gZXJyb3I7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBXYWl0IGZvciBhIG1pY3JvdGFzayBpbiBjYXNlIHN2ZWx0ZSBleHBlcmltZW50YWwgYXN5bmMgaXMgZW5hYmxlZCxcblx0Ly8gd2hpY2ggY2F1c2VzIGNvbXBvbmVudCBzY3JpcHQgYmxvY2tzIHRvIHJ1biBhc3luY2hyb25vdXNseVxuXHR2b2lkIChhd2FpdCBQcm9taXNlLnJlc29sdmUoKSk7XG5cblx0aWYgKHNob3VsZF9oeWRyYXRlKSB7XG5cdFx0LyoqIEB0eXBlIHtBZnRlck5hdmlnYXRlfSAqL1xuXHRcdGNvbnN0IG5hdmlnYXRpb24gPSB7XG5cdFx0XHRmcm9tOiBudWxsLFxuXHRcdFx0dG86IHtcblx0XHRcdFx0Li4ubmF2LFxuXHRcdFx0XHRzY3JvbGw6IGhpc3RvcnlfaW5mb1tjdXJyZW50X2hpc3RvcnlfaW5kZXhdPy5zY3JvbGwgPz8gc2Nyb2xsX3N0YXRlKClcblx0XHRcdH0sXG5cdFx0XHR3aWxsVW5sb2FkOiBmYWxzZSxcblx0XHRcdHR5cGU6ICdlbnRlcicsXG5cdFx0XHRzaGFsbG93OiBmYWxzZSxcblx0XHRcdGNvbXBsZXRlOiBQcm9taXNlLnJlc29sdmUoKVxuXHRcdH07XG5cblx0XHRhZnRlcl9uYXZpZ2F0ZV9jYWxsYmFja3MuZm9yRWFjaCgoZm4pID0+IGZuKG5hdmlnYXRpb24pKTtcblx0fVxuXG5cdHJlc3RvcmVfc25hcHNob3QoY3VycmVudF9uYXZpZ2F0aW9uX2luZGV4KTtcblx0cmVzdG9yZV9uYXZpZ2F0aW9uX3NuYXBzaG90KGN1cnJlbnRfaGlzdG9yeV9pbmRleCk7XG5cblx0c3RhcnRlZCA9IHRydWU7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7e1xuICogICB1cmw6IFVSTDtcbiAqICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICogICBicmFuY2g6IEFycmF5PGltcG9ydCgnLi90eXBlcy5qcycpLkJyYW5jaE5vZGUgfCB1bmRlZmluZWQ+O1xuICogICBlcnJvcnM/OiBBcnJheTxpbXBvcnQoJ3R5cGVzJykuQ1NSUGFnZU5vZGVMb2FkZXIgfCB1bmRlZmluZWQ+O1xuICogICBzdGF0dXM/OiBudW1iZXI7XG4gKiAgIGVycm9yOiBBcHAuRXJyb3IgfCBudWxsO1xuICogICByb3V0ZTogaW1wb3J0KCd0eXBlcycpLkNTUlJvdXRlIHwgbnVsbDtcbiAqICAgZm9ybT86IFJlY29yZDxzdHJpbmcsIGFueT4gfCBudWxsO1xuICogfX0gb3B0c1xuICovXG5hc3luYyBmdW5jdGlvbiBnZXRfbmF2aWdhdGlvbl9yZXN1bHRfZnJvbV9icmFuY2goe1xuXHR1cmwsXG5cdHBhcmFtcyxcblx0YnJhbmNoLFxuXHRlcnJvcnMsXG5cdHN0YXR1cyxcblx0ZXJyb3IsXG5cdHJvdXRlLFxuXHRmb3JtXG59KSB7XG5cdC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLlRyYWlsaW5nU2xhc2h9ICovXG5cdGxldCBzbGFzaCA9ICduZXZlcic7XG5cblx0Ly8gaWYgYHBhdGhzLmJhc2UgPT09ICcvYS9iL2NgLCB0aGVuIHRoZSByb290IHJvdXRlIGlzIGFsd2F5cyBgL2EvYi9jL2AsIHJlZ2FyZGxlc3Mgb2Zcblx0Ly8gdGhlIGB0cmFpbGluZ1NsYXNoYCByb3V0ZSBvcHRpb24sIHNvIHRoYXQgcmVsYXRpdmUgcGF0aHMgdG8gSlMgYW5kIENTUyB3b3JrXG5cdGlmIChiYXNlICYmICh1cmwucGF0aG5hbWUgPT09IGJhc2UgfHwgdXJsLnBhdGhuYW1lID09PSBiYXNlICsgJy8nKSkge1xuXHRcdHNsYXNoID0gJ2Fsd2F5cyc7XG5cdH0gZWxzZSB7XG5cdFx0Zm9yIChjb25zdCBub2RlIG9mIGJyYW5jaCkge1xuXHRcdFx0aWYgKG5vZGU/LnNsYXNoICE9PSB1bmRlZmluZWQpIHNsYXNoID0gbm9kZS5zbGFzaDtcblx0XHR9XG5cdH1cblxuXHR1cmwucGF0aG5hbWUgPSBub3JtYWxpemVfcGF0aCh1cmwucGF0aG5hbWUsIHNsYXNoKTtcblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNlbGYtYXNzaWduXG5cdHVybC5zZWFyY2ggPSB1cmwuc2VhcmNoOyAvLyB0dXJuIGAvP2AgaW50byBgL2BcblxuXHQvKiogQHR5cGUge2ltcG9ydCgnLi90eXBlcy5qcycpLk5hdmlnYXRpb25GaW5pc2hlZH0gKi9cblx0Y29uc3QgcmVzdWx0ID0ge1xuXHRcdHR5cGU6ICdsb2FkZWQnLFxuXHRcdHN0YXRlOiB7XG5cdFx0XHR1cmwsXG5cdFx0XHRwYXJhbXMsXG5cdFx0XHRicmFuY2gsXG5cdFx0XHRlcnJvcixcblx0XHRcdHJvdXRlXG5cdFx0fSxcblx0XHRwcm9wczoge1xuXHRcdFx0cGFnZTogeyAuLi5wYWdlIH0sXG5cdFx0XHR0cmVlOiAvKiogQHR5cGUge1JlbmRlck5vZGV9ICovICh7fSlcblx0XHR9XG5cdH07XG5cblx0aWYgKGVycm9yKSB7XG5cdFx0cmVzdWx0LnByb3BzLmVycm9yID0gZXJyb3I7XG5cdH1cblxuXHRpZiAoZm9ybSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzdWx0LnByb3BzLmZvcm0gPSBmb3JtO1xuXHR9XG5cblx0bGV0IGRhdGEgPSB7fTtcblx0bGV0IGRhdGFfY2hhbmdlZCA9ICFwYWdlO1xuXG5cdGNvbnN0IGVycm9yX2NvbXBvbmVudHMgPVxuXHRcdGVycm9ycyAmJlxuXHRcdChhd2FpdCBidWlsZF9lcnJvcl9jaGFpbihicmFuY2gsIGVycm9ycywgKGxvYWRlcikgPT4gbG9hZGVyKCkudGhlbigoZSkgPT4gZS5jb21wb25lbnQpKSk7XG5cblx0bGV0IGN1cnJlbnRfbm9kZSA9IHJlc3VsdC5wcm9wcy50cmVlO1xuXHRsZXQgY3VycmVudF9kZXB0aCA9IDE7XG5cblx0LyoqIEB0eXBlIHtSZW5kZXJOb2RlIHwgdW5kZWZpbmVkfSAqL1xuXHRsZXQgcHJldmlvdXNfbm9kZSA9IHByb3BzLnRyZWU7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBicmFuY2gubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRjb25zdCBub2RlID0gYnJhbmNoW2ldO1xuXHRcdGNvbnN0IHByZXYgPSBjdXJyZW50LmJyYW5jaFtpXTtcblxuXHRcdGlmICghbm9kZSkgY29udGludWU7XG5cblx0XHRpZiAoXG5cdFx0XHQvLyBpZiBhbiBhbmNlc3RvciBub2RlIGluIHRoaXMgcGF0aCBjaGFuZ2VkLCBgZGF0YV9jaGFuZ2VkYCBpcyBhbHJlYWR5IHRydWUgYW5kIHRoZVxuXHRcdFx0Ly8gYWNjdW11bGF0ZWQgYGRhdGFgIGRpZmZlcnMgZnJvbSB0aGUgcHJldmlvdXMgcmVuZGVyLCBzbyB3ZSBtdXN0IHJlLW1lcmdlXG5cdFx0XHRkYXRhX2NoYW5nZWQgfHxcblx0XHRcdCFwcmV2aW91c19ub2RlIHx8XG5cdFx0XHRub2RlPy5kYXRhICE9PSBwcmV2Py5kYXRhXG5cdFx0KSB7XG5cdFx0XHRjdXJyZW50X25vZGUuZGF0YSA9IHsgLi4uZGF0YSwgLi4ubm9kZS5kYXRhIH07XG5cdFx0XHRkYXRhX2NoYW5nZWQgPSB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyB1c2UgZXhpc3Rpbmcgb2JqZWN0IOKAlCBwcmV2ZW50cyBlZmZlY3RzIHJlLXJ1bm5pbmcgdW5uZWNlc3NhcmlseVxuXHRcdFx0Y3VycmVudF9ub2RlLmRhdGEgPSBwcmV2aW91c19ub2RlLmRhdGE7XG5cdFx0fVxuXG5cdFx0ZGF0YSA9IGN1cnJlbnRfbm9kZS5kYXRhO1xuXG5cdFx0aWYgKGkgPCBicmFuY2gubGVuZ3RoIC0gMSkge1xuXHRcdFx0bGV0IG5leHRfaW5kZXggPSBpICsgMTtcblx0XHRcdHdoaWxlIChuZXh0X2luZGV4IDwgYnJhbmNoLmxlbmd0aCAmJiAhYnJhbmNoW25leHRfaW5kZXhdKSB7XG5cdFx0XHRcdG5leHRfaW5kZXggKz0gMTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgbmV4dCA9IGJyYW5jaFtuZXh0X2luZGV4XTtcblxuXHRcdFx0aWYgKG5leHQpIHtcblx0XHRcdFx0Y3VycmVudF9ub2RlID0gY3VycmVudF9ub2RlLmNoaWxkID0gbmV3IFJlbmRlck5vZGUoXG5cdFx0XHRcdFx0bmV4dC5ub2RlLmNvbXBvbmVudCxcblx0XHRcdFx0XHRlcnJvcl9jb21wb25lbnRzPy5bY3VycmVudF9kZXB0aCsrXVxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdHByZXZpb3VzX25vZGUgPSBwcmV2aW91c19ub2RlPy5jaGlsZDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRjb25zdCBwYWdlX2NoYW5nZWQgPVxuXHRcdCFjdXJyZW50LnVybCB8fFxuXHRcdHVybC5ocmVmICE9PSBjdXJyZW50LnVybC5ocmVmIHx8XG5cdFx0Y3VycmVudC5lcnJvciAhPT0gZXJyb3IgfHxcblx0XHQoZm9ybSAhPT0gdW5kZWZpbmVkICYmIGZvcm0gIT09IHBhZ2UuZm9ybSkgfHxcblx0XHRkYXRhX2NoYW5nZWQ7XG5cblx0aWYgKHBhZ2VfY2hhbmdlZCkge1xuXHRcdHJlc3VsdC5wcm9wcy5wYWdlID0ge1xuXHRcdFx0ZXJyb3IsXG5cdFx0XHRwYXJhbXMsXG5cdFx0XHRyb3V0ZToge1xuXHRcdFx0XHRpZDogcm91dGU/LmlkID8/IG51bGxcblx0XHRcdH0sXG5cdFx0XHRzdGF0ZToge30sXG5cdFx0XHRzaGFsbG93OiBudWxsLFxuXHRcdFx0c3RhdHVzOiBzdGF0dXMgPz8gZXJyb3I/LnN0YXR1cyA/PyAyMDAsXG5cdFx0XHR1cmw6IG5ldyBVUkwodXJsKSxcblx0XHRcdGZvcm06IGZvcm0gPz8gbnVsbCxcblx0XHRcdGRhdGFcblx0XHR9O1xuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBDYWxsIHRoZSB1bml2ZXJzYWwgbG9hZCBmdW5jdGlvbiBvZiB0aGUgZ2l2ZW4gbm9kZSwgaWYgaXQgZXhpc3RzLlxuICpcbiAqIEBwYXJhbSB7e1xuICogICBsb2FkZXI6IGltcG9ydCgndHlwZXMnKS5DU1JQYWdlTm9kZUxvYWRlcjtcbiAqIFx0IHBhcmVudDogKCkgPT4gUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBhbnk+PjtcbiAqICAgdXJsOiBVUkw7XG4gKiAgIHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAqICAgcm91dGU6IHsgaWQ6IHN0cmluZyB8IG51bGwgfTtcbiAqIFx0IHNlcnZlcl9kYXRhX25vZGU6IGltcG9ydCgnLi90eXBlcy5qcycpLkRhdGFOb2RlIHwgbnVsbDtcbiAqIH19IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtQcm9taXNlPGltcG9ydCgnLi90eXBlcy5qcycpLkJyYW5jaE5vZGU+fVxuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkX25vZGUoeyBsb2FkZXIsIHBhcmVudCwgdXJsLCBwYXJhbXMsIHJvdXRlLCBzZXJ2ZXJfZGF0YV9ub2RlIH0pIHtcblx0LyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgbnVsbH0gKi9cblx0bGV0IGRhdGEgPSBudWxsO1xuXG5cdGxldCBpc190cmFja2luZyA9IHRydWU7XG5cblx0LyoqIEB0eXBlIHtpbXBvcnQoJ3R5cGVzJykuVXNlc30gKi9cblx0Y29uc3QgdXNlcyA9IHtcblx0XHRkZXBlbmRlbmNpZXM6IG5ldyBTZXQoKSxcblx0XHRwYXJhbXM6IG5ldyBTZXQoKSxcblx0XHRwYXJlbnQ6IGZhbHNlLFxuXHRcdHJvdXRlOiBmYWxzZSxcblx0XHR1cmw6IGZhbHNlLFxuXHRcdHNlYXJjaF9wYXJhbXM6IG5ldyBTZXQoKVxuXHR9O1xuXG5cdGNvbnN0IG5vZGUgPSBhd2FpdCBsb2FkZXIoKTtcblxuXHRpZiAoREVWKSB7XG5cdFx0dmFsaWRhdGVfcGFnZV9leHBvcnRzKG5vZGUudW5pdmVyc2FsKTtcblxuXHRcdGlmIChub2RlLnVuaXZlcnNhbCAmJiBhcHAuaGFzaCkge1xuXHRcdFx0Y29uc3Qgb3B0aW9ucyA9IE9iamVjdC5rZXlzKG5vZGUudW5pdmVyc2FsKS5maWx0ZXIoKG8pID0+IG8gIT09ICdsb2FkJyk7XG5cblx0XHRcdGlmIChvcHRpb25zLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0c2hhcmVkX2Vycm9ycy5yb3V0ZXJfaGFzaF9wYWdlX29wdGlvbnMoe1xuXHRcdFx0XHRcdHNvdXJjZTogLyoqIEB0eXBlIHtzdHJpbmd9ICovIChyb3V0ZS5pZCksXG5cdFx0XHRcdFx0b3B0aW9uczogb3B0aW9ucy5tYXAoKG8pID0+IGAnJHtvfSdgKS5qb2luKCcsICcpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmIChfX1NWRUxURUtJVF9IQVNfVU5JVkVSU0FMX0xPQURfXyAmJiBub2RlLnVuaXZlcnNhbD8ubG9hZCkge1xuXHRcdC8qKiBAcGFyYW0ge3N0cmluZ1tdfSBkZXBzICovXG5cdFx0ZnVuY3Rpb24gZGVwZW5kcyguLi5kZXBzKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGRlcCBvZiBkZXBzKSB7XG5cdFx0XHRcdGlmIChERVYpIHZhbGlkYXRlX2RlcGVuZHMoLyoqIEB0eXBlIHtzdHJpbmd9ICovIChyb3V0ZS5pZCksIGRlcCk7XG5cblx0XHRcdFx0Y29uc3QgeyBocmVmIH0gPSBuZXcgVVJMKGRlcCwgdXJsKTtcblx0XHRcdFx0dXNlcy5kZXBlbmRlbmNpZXMuYWRkKGhyZWYpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8qKiBAdHlwZSB7TG9hZEV2ZW50fSAqL1xuXHRcdGNvbnN0IGxvYWRfaW5wdXQgPSB7XG5cdFx0XHR0cmFjaW5nOiB7IGVuYWJsZWQ6IGZhbHNlLCByb290OiBub29wX3NwYW4sIGN1cnJlbnQ6IG5vb3Bfc3BhbiB9LFxuXHRcdFx0cm91dGU6IG5ldyBQcm94eShyb3V0ZSwge1xuXHRcdFx0XHRnZXQ6ICh0YXJnZXQsIGtleSkgPT4ge1xuXHRcdFx0XHRcdGlmIChpc190cmFja2luZykge1xuXHRcdFx0XHRcdFx0dXNlcy5yb3V0ZSA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiB0YXJnZXRbLyoqIEB0eXBlIHsnaWQnfSAqLyAoa2V5KV07XG5cdFx0XHRcdH1cblx0XHRcdH0pLFxuXHRcdFx0cGFyYW1zOiBuZXcgUHJveHkocGFyYW1zLCB7XG5cdFx0XHRcdGdldDogKHRhcmdldCwga2V5KSA9PiB7XG5cdFx0XHRcdFx0aWYgKGlzX3RyYWNraW5nKSB7XG5cdFx0XHRcdFx0XHR1c2VzLnBhcmFtcy5hZGQoLyoqIEB0eXBlIHtzdHJpbmd9ICovIChrZXkpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRhcmdldFsvKiogQHR5cGUge3N0cmluZ30gKi8gKGtleSldO1xuXHRcdFx0XHR9XG5cdFx0XHR9KSxcblx0XHRcdGRhdGE6IHNlcnZlcl9kYXRhX25vZGU/LmRhdGEgPz8gbnVsbCxcblx0XHRcdHVybDogbWFrZV90cmFja2FibGUoXG5cdFx0XHRcdHVybCxcblx0XHRcdFx0KCkgPT4ge1xuXHRcdFx0XHRcdGlmIChpc190cmFja2luZykge1xuXHRcdFx0XHRcdFx0dXNlcy51cmwgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0KHBhcmFtKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGlzX3RyYWNraW5nKSB7XG5cdFx0XHRcdFx0XHR1c2VzLnNlYXJjaF9wYXJhbXMuYWRkKHBhcmFtKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGFwcC5oYXNoXG5cdFx0XHQpLFxuXHRcdFx0YXN5bmMgZmV0Y2gocmVzb3VyY2UsIGluaXQpIHtcblx0XHRcdFx0aWYgKHJlc291cmNlIGluc3RhbmNlb2YgUmVxdWVzdCkge1xuXHRcdFx0XHRcdC8vIHdlJ3JlIG5vdCBhbGxvd2VkIHRvIG1vZGlmeSB0aGUgcmVjZWl2ZWQgYFJlcXVlc3RgIG9iamVjdCwgc28gaW4gb3JkZXJcblx0XHRcdFx0XHQvLyB0byBmaXh1cCByZWxhdGl2ZSB1cmxzIHdlIGNyZWF0ZSBhIG5ldyBlcXVpdmFsZW50IGBpbml0YCBvYmplY3QgaW5zdGVhZFxuXHRcdFx0XHRcdGluaXQgPSB7XG5cdFx0XHRcdFx0XHQvLyB0aGUgcmVxdWVzdCBib2R5IG11c3QgYmUgY29uc3VtZWQgaW4gbWVtb3J5IHVudGlsIGJyb3dzZXJzXG5cdFx0XHRcdFx0XHQvLyBpbXBsZW1lbnQgc3RyZWFtaW5nIHJlcXVlc3QgYm9kaWVzIGFuZC9vciB0aGUgYm9keSBnZXR0ZXJcblx0XHRcdFx0XHRcdGJvZHk6XG5cdFx0XHRcdFx0XHRcdHJlc291cmNlLm1ldGhvZCA9PT0gJ0dFVCcgfHwgcmVzb3VyY2UubWV0aG9kID09PSAnSEVBRCdcblx0XHRcdFx0XHRcdFx0XHQ/IHVuZGVmaW5lZFxuXHRcdFx0XHRcdFx0XHRcdDogYXdhaXQgcmVzb3VyY2UuYmxvYigpLFxuXHRcdFx0XHRcdFx0Y2FjaGU6IHJlc291cmNlLmNhY2hlLFxuXHRcdFx0XHRcdFx0Y3JlZGVudGlhbHM6IHJlc291cmNlLmNyZWRlbnRpYWxzLFxuXHRcdFx0XHRcdFx0Ly8gdGhlIHNlcnZlciBzZXRzIGhlYWRlcnMgdG8gYHVuZGVmaW5lZGAgaWYgdGhlcmUgYXJlIG5vIGhlYWRlcnMgYnV0XG5cdFx0XHRcdFx0XHQvLyB0aGUgY2xpZW50IGRlZmF1bHRzIHRvIGFuIGVtcHR5IEhlYWRlcnMgb2JqZWN0IGluIHRoZSBSZXF1ZXN0IG9iamVjdC5cblx0XHRcdFx0XHRcdC8vIFRvIGtlZXAgdGhlIHR3byB2YWx1ZXMgaW4gc3luYywgd2UgZXhwbGljaXRseSBzZXQgdGhlIGhlYWRlcnMgdG8gYHVuZGVmaW5lZGAuXG5cdFx0XHRcdFx0XHQvLyBBbHNvLCBub3Qgc3VyZSB3aHksIGJ1dCBzb21ldGltZXMgMCBpcyBldmFsdWF0ZWQgYXMgdHJ1dGh5IHNvIHdlIG5lZWQgdG9cblx0XHRcdFx0XHRcdC8vIGV4cGxpY2l0bHkgY29tcGFyZSB0aGUgaGVhZGVycyBsZW5ndGggdG8gYSBudW1iZXIgaGVyZVxuXHRcdFx0XHRcdFx0aGVhZGVyczogWy4uLnJlc291cmNlLmhlYWRlcnNdLmxlbmd0aCA+IDAgPyByZXNvdXJjZT8uaGVhZGVycyA6IHVuZGVmaW5lZCxcblx0XHRcdFx0XHRcdGludGVncml0eTogcmVzb3VyY2UuaW50ZWdyaXR5LFxuXHRcdFx0XHRcdFx0a2VlcGFsaXZlOiByZXNvdXJjZS5rZWVwYWxpdmUsXG5cdFx0XHRcdFx0XHRtZXRob2Q6IHJlc291cmNlLm1ldGhvZCxcblx0XHRcdFx0XHRcdG1vZGU6IHJlc291cmNlLm1vZGUsXG5cdFx0XHRcdFx0XHRyZWRpcmVjdDogcmVzb3VyY2UucmVkaXJlY3QsXG5cdFx0XHRcdFx0XHRyZWZlcnJlcjogcmVzb3VyY2UucmVmZXJyZXIsXG5cdFx0XHRcdFx0XHRyZWZlcnJlclBvbGljeTogcmVzb3VyY2UucmVmZXJyZXJQb2xpY3ksXG5cdFx0XHRcdFx0XHRzaWduYWw6IHJlc291cmNlLnNpZ25hbCxcblx0XHRcdFx0XHRcdC4uLmluaXRcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgeyByZXNvbHZlZCwgcHJvbWlzZSB9ID0gcmVzb2x2ZV9mZXRjaF91cmwocmVzb3VyY2UsIGluaXQsIHVybCk7XG5cblx0XHRcdFx0aWYgKGlzX3RyYWNraW5nKSB7XG5cdFx0XHRcdFx0ZGVwZW5kcyhyZXNvbHZlZC5ocmVmKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBwcm9taXNlO1xuXHRcdFx0fSxcblx0XHRcdHNldEhlYWRlcnM6IG5vb3AsXG5cdFx0XHRkZXBlbmRzLFxuXHRcdFx0cGFyZW50KCkge1xuXHRcdFx0XHRpZiAoaXNfdHJhY2tpbmcpIHtcblx0XHRcdFx0XHR1c2VzLnBhcmVudCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHBhcmVudCgpO1xuXHRcdFx0fSxcblx0XHRcdHVudHJhY2soZm4pIHtcblx0XHRcdFx0aXNfdHJhY2tpbmcgPSBmYWxzZTtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRyZXR1cm4gZm4oKTtcblx0XHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0XHRpc190cmFja2luZyA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKERFVikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bG9ja19mZXRjaCgpO1xuXHRcdFx0XHRkYXRhID0gKGF3YWl0IG5vZGUudW5pdmVyc2FsLmxvYWQuY2FsbChudWxsLCBsb2FkX2lucHV0KSkgPz8gbnVsbDtcblx0XHRcdFx0dmFsaWRhdGVfbG9hZF9yZXNwb25zZShkYXRhLCBgcmVsYXRlZCB0byByb3V0ZSAnJHtyb3V0ZS5pZH0nYCk7XG5cdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHR1bmxvY2tfZmV0Y2goKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGF0YSA9IChhd2FpdCBub2RlLnVuaXZlcnNhbC5sb2FkLmNhbGwobnVsbCwgbG9hZF9pbnB1dCkpID8/IG51bGw7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRub2RlLFxuXHRcdGxvYWRlcixcblx0XHRzZXJ2ZXI6IHNlcnZlcl9kYXRhX25vZGUsXG5cdFx0dW5pdmVyc2FsOiBub2RlLnVuaXZlcnNhbD8ubG9hZCA/IHsgdHlwZTogJ2RhdGEnLCBkYXRhLCB1c2VzIH0gOiBudWxsLFxuXHRcdGRhdGE6IGRhdGEgPz8gc2VydmVyX2RhdGFfbm9kZT8uZGF0YSA/PyBudWxsLFxuXHRcdHNsYXNoOiBub2RlLnVuaXZlcnNhbD8udHJhaWxpbmdTbGFzaCA/PyBzZXJ2ZXJfZGF0YV9ub2RlPy5zbGFzaFxuXHR9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVxdWVzdCB8IHN0cmluZyB8IFVSTH0gaW5wdXRcbiAqIEBwYXJhbSB7UmVxdWVzdEluaXQgfCB1bmRlZmluZWR9IGluaXRcbiAqIEBwYXJhbSB7VVJMfSB1cmxcbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZV9mZXRjaF91cmwoaW5wdXQsIGluaXQsIHVybCkge1xuXHQvLyB3ZSBtdXN0IGZpeHVwIHJlbGF0aXZlIHVybHMgc28gdGhleSBhcmUgcmVzb2x2ZWQgZnJvbSB0aGUgdGFyZ2V0IHBhZ2Vcblx0Y29uc3QgcmVzb2x2ZWQgPSBuZXcgVVJMKGlucHV0IGluc3RhbmNlb2YgUmVxdWVzdCA/IGlucHV0LnVybCA6IGlucHV0LCB1cmwpO1xuXG5cdGNvbnN0IHJlcXVlc3RlZCA9IGZldGNoX2NhY2hlX3VybChyZXNvbHZlZCwgdXJsKTtcblxuXHRjb25zdCBwcm9taXNlID0gc3RhcnRlZFxuXHRcdD8gc3Vic2VxdWVudF9mZXRjaChyZXF1ZXN0ZWQsIHJlc29sdmVkLmhyZWYsIGluaXQpXG5cdFx0OiBpbml0aWFsX2ZldGNoKHJlcXVlc3RlZCwgaW5pdCk7XG5cblx0cmV0dXJuIHsgcmVzb2x2ZWQsIHByb21pc2UgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHBhcmVudF9jaGFuZ2VkXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHJvdXRlX2NoYW5nZWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdXJsX2NoYW5nZWRcbiAqIEBwYXJhbSB7U2V0PHN0cmluZz59IHNlYXJjaF9wYXJhbXNfY2hhbmdlZFxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuVXNlcyB8IHVuZGVmaW5lZH0gdXNlc1xuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSBwYXJhbXNcbiAqL1xuZnVuY3Rpb24gaGFzX2NoYW5nZWQoXG5cdHBhcmVudF9jaGFuZ2VkLFxuXHRyb3V0ZV9jaGFuZ2VkLFxuXHR1cmxfY2hhbmdlZCxcblx0c2VhcmNoX3BhcmFtc19jaGFuZ2VkLFxuXHR1c2VzLFxuXHRwYXJhbXNcbikge1xuXHRpZiAoZm9yY2VfaW52YWxpZGF0aW9uKSByZXR1cm4gdHJ1ZTtcblxuXHRpZiAoIXVzZXMpIHJldHVybiBmYWxzZTtcblxuXHRpZiAodXNlcy5wYXJlbnQgJiYgcGFyZW50X2NoYW5nZWQpIHJldHVybiB0cnVlO1xuXHRpZiAodXNlcy5yb3V0ZSAmJiByb3V0ZV9jaGFuZ2VkKSByZXR1cm4gdHJ1ZTtcblx0aWYgKHVzZXMudXJsICYmIHVybF9jaGFuZ2VkKSByZXR1cm4gdHJ1ZTtcblxuXHRmb3IgKGNvbnN0IHRyYWNrZWRfcGFyYW1zIG9mIHVzZXMuc2VhcmNoX3BhcmFtcykge1xuXHRcdGlmIChzZWFyY2hfcGFyYW1zX2NoYW5nZWQuaGFzKHRyYWNrZWRfcGFyYW1zKSkgcmV0dXJuIHRydWU7XG5cdH1cblxuXHRmb3IgKGNvbnN0IHBhcmFtIG9mIHVzZXMucGFyYW1zKSB7XG5cdFx0aWYgKHBhcmFtc1twYXJhbV0gIT09IGN1cnJlbnQucGFyYW1zW3BhcmFtXSkgcmV0dXJuIHRydWU7XG5cdH1cblxuXHRmb3IgKGNvbnN0IGhyZWYgb2YgdXNlcy5kZXBlbmRlbmNpZXMpIHtcblx0XHRpZiAoaW52YWxpZGF0ZWQuc29tZSgoZm4pID0+IGZuKG5ldyBVUkwoaHJlZikpKSkgcmV0dXJuIHRydWU7XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJ3R5cGVzJykuU2VydmVyRGF0YU5vZGUgfCBpbXBvcnQoJ3R5cGVzJykuU2VydmVyRGF0YVNraXBwZWROb2RlIHwgbnVsbH0gbm9kZVxuICogQHBhcmFtIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5EYXRhTm9kZSB8IG51bGx9IFtwcmV2aW91c11cbiAqIEByZXR1cm5zIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5EYXRhTm9kZSB8IG51bGx9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZV9kYXRhX25vZGUobm9kZSwgcHJldmlvdXMpIHtcblx0aWYgKG5vZGU/LnR5cGUgPT09ICdkYXRhJykgcmV0dXJuIG5vZGU7XG5cdGlmIChub2RlPy50eXBlID09PSAnc2tpcCcpIHJldHVybiBwcmV2aW91cyA/PyBudWxsO1xuXHRyZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VSTCB8IG51bGx9IG9sZF91cmxcbiAqIEBwYXJhbSB7VVJMfSBuZXdfdXJsXG4gKi9cbmZ1bmN0aW9uIGRpZmZfc2VhcmNoX3BhcmFtcyhvbGRfdXJsLCBuZXdfdXJsKSB7XG5cdGlmICghb2xkX3VybCkgcmV0dXJuIG5ldyBTZXQobmV3X3VybC5zZWFyY2hQYXJhbXMua2V5cygpKTtcblxuXHRjb25zdCBjaGFuZ2VkID0gbmV3IFNldChbLi4ub2xkX3VybC5zZWFyY2hQYXJhbXMua2V5cygpLCAuLi5uZXdfdXJsLnNlYXJjaFBhcmFtcy5rZXlzKCldKTtcblxuXHRmb3IgKGNvbnN0IGtleSBvZiBjaGFuZ2VkKSB7XG5cdFx0Y29uc3Qgb2xkX3ZhbHVlcyA9IG9sZF91cmwuc2VhcmNoUGFyYW1zLmdldEFsbChrZXkpLnNvcnQoKTtcblx0XHRjb25zdCBuZXdfdmFsdWVzID0gbmV3X3VybC5zZWFyY2hQYXJhbXMuZ2V0QWxsKGtleSkuc29ydCgpO1xuXG5cdFx0aWYgKFxuXHRcdFx0b2xkX3ZhbHVlcy5sZW5ndGggPT09IG5ld192YWx1ZXMubGVuZ3RoICYmXG5cdFx0XHRvbGRfdmFsdWVzLmV2ZXJ5KCh2YWx1ZSwgaSkgPT4gdmFsdWUgPT09IG5ld192YWx1ZXNbaV0pXG5cdFx0KSB7XG5cdFx0XHRjaGFuZ2VkLmRlbGV0ZShrZXkpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBjaGFuZ2VkO1xufVxuXG4vKipcbiAqIEBvdmVybG9hZFxuICogQHBhcmFtIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5OYXZpZ2F0aW9uSW50ZW50ICYgeyBhY3Rpb25fcmVzdWx0PzogQWN0aW9uUmVzdWx0IH19IGludGVudFxuICogQHJldHVybnMge1Byb21pc2U8aW1wb3J0KCcuL3R5cGVzLmpzJykuTmF2aWdhdGlvblJlc3VsdCB8IHVuZGVmaW5lZD59XG4gKi9cbi8qKlxuICogQG92ZXJsb2FkXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi90eXBlcy5qcycpLk5hdmlnYXRpb25JbnRlbnQgJiB7IHByZWxvYWQ6IHt9IH19IGludGVudFxuICogQHJldHVybnMge1Byb21pc2U8aW1wb3J0KCcuL3R5cGVzLmpzJykuTmF2aWdhdGlvblJlc3VsdD59XG4gKi9cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5OYXZpZ2F0aW9uSW50ZW50ICYgeyBwcmVsb2FkPzoge307IGFjdGlvbl9yZXN1bHQ/OiBBY3Rpb25SZXN1bHQgfX0gaW50ZW50XG4gKiBAcmV0dXJucyB7UHJvbWlzZTxpbXBvcnQoJy4vdHlwZXMuanMnKS5OYXZpZ2F0aW9uUmVzdWx0IHwgdW5kZWZpbmVkPn1cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZF9yb3V0ZSh7IGlkLCBpbnZhbGlkYXRpbmcsIHVybCwgcGFyYW1zLCByb3V0ZSwgcHJlbG9hZCwgYWN0aW9uX3Jlc3VsdCB9KSB7XG5cdGlmICghYWN0aW9uX3Jlc3VsdCAmJiBsb2FkX2NhY2hlPy5pZCA9PT0gaWQpIHtcblx0XHQvLyB0aGUgcHJlbG9hZCBiZWNvbWVzIHRoZSByZWFsIG5hdmlnYXRpb25cblx0XHRwcmVsb2FkX3Rva2Vucy5kZWxldGUobG9hZF9jYWNoZS50b2tlbik7XG5cdFx0cmV0dXJuIGxvYWRfY2FjaGUucHJvbWlzZTtcblx0fVxuXG5cdGNvbnN0IHsgZXJyb3JzLCBsYXlvdXRzLCBsZWFmIH0gPSByb3V0ZTtcblxuXHRjb25zdCBsb2FkZXJzID0gWy4uLmxheW91dHMsIGxlYWZdO1xuXHRjb25zdCBsZWFmX2luZGV4ID0gbG9hZGVycy5sZW5ndGggLSAxO1xuXHRjb25zdCBhY3Rpb25fZXJyb3IgPSBhY3Rpb25fcmVzdWx0Py50eXBlID09PSAnZXJyb3InO1xuXG5cdC8vIHByZWxvYWQgbW9kdWxlcyB0byBhdm9pZCB3YXRlcmZhbGwsIGJ1dCBoYW5kbGUgcmVqZWN0aW9uc1xuXHQvLyBzbyB0aGV5IGRvbid0IGdldCByZXBvcnRlZCB0byBTZW50cnkgZXQgYWwgKHdlIGRvbid0IG5lZWRcblx0Ly8gdG8gYWN0IG9uIHRoZSBmYWlsdXJlcyBhdCB0aGlzIHBvaW50KVxuXHRlcnJvcnMuZm9yRWFjaCgobG9hZGVyKSA9PiBsb2FkZXI/LigpLmNhdGNoKG5vb3ApKTtcblx0bG9hZGVycy5mb3JFYWNoKChsb2FkZXIpID0+IGxvYWRlcj8uWzFdKCkuY2F0Y2gobm9vcCkpO1xuXG5cdC8qKiBAdHlwZSB7aW1wb3J0KCd0eXBlcycpLlNlcnZlck5vZGVzUmVzcG9uc2UgfCBpbXBvcnQoJ3R5cGVzJykuU2VydmVyUmVkaXJlY3ROb2RlIHwgbnVsbH0gKi9cblx0bGV0IHNlcnZlcl9kYXRhID0gbnVsbDtcblx0Y29uc3QgdXJsX2NoYW5nZWQgPSBjdXJyZW50LnVybCA/IGlkICE9PSBnZXRfcGFnZV9rZXkoY3VycmVudC51cmwpIDogZmFsc2U7XG5cdC8vIGN1cnJlbnQucm91dGUgaXMgbnVsbCBhZnRlciBhbiBlcnJvci1wYWdlIHJlbmRlciwgc28gYSBtaXNzaW5nIHJvdXRlIGNvdW50cyBhcyBjaGFuZ2VkXG5cdGNvbnN0IHJvdXRlX2NoYW5nZWQgPSAhY3VycmVudC5yb3V0ZSB8fCByb3V0ZS5pZCAhPT0gY3VycmVudC5yb3V0ZS5pZDtcblx0Y29uc3Qgc2VhcmNoX3BhcmFtc19jaGFuZ2VkID0gZGlmZl9zZWFyY2hfcGFyYW1zKGN1cnJlbnQudXJsLCB1cmwpO1xuXG5cdGxldCBwYXJlbnRfaW52YWxpZCA9IGZhbHNlO1xuXG5cdGlmIChfX1NWRUxURUtJVF9IQVNfU0VSVkVSX0xPQURfXykge1xuXHRcdGNvbnN0IGludmFsaWRfc2VydmVyX25vZGVzID0gbG9hZGVycy5tYXAoKGxvYWRlciwgaSkgPT4ge1xuXHRcdFx0aWYgKGFjdGlvbl9lcnJvciAmJiBpID09PSBsZWFmX2luZGV4KSByZXR1cm4gZmFsc2U7XG5cblx0XHRcdGNvbnN0IHByZXZpb3VzID0gY3VycmVudC5icmFuY2hbaV07XG5cblx0XHRcdGNvbnN0IGludmFsaWQgPVxuXHRcdFx0XHQhIWxvYWRlcj8uWzBdICYmXG5cdFx0XHRcdChwcmV2aW91cz8ubG9hZGVyICE9PSBsb2FkZXJbMV0gfHxcblx0XHRcdFx0XHRoYXNfY2hhbmdlZChcblx0XHRcdFx0XHRcdHBhcmVudF9pbnZhbGlkLFxuXHRcdFx0XHRcdFx0cm91dGVfY2hhbmdlZCxcblx0XHRcdFx0XHRcdHVybF9jaGFuZ2VkLFxuXHRcdFx0XHRcdFx0c2VhcmNoX3BhcmFtc19jaGFuZ2VkLFxuXHRcdFx0XHRcdFx0cHJldmlvdXMuc2VydmVyPy51c2VzLFxuXHRcdFx0XHRcdFx0cGFyYW1zXG5cdFx0XHRcdFx0KSk7XG5cblx0XHRcdGlmIChpbnZhbGlkKSB7XG5cdFx0XHRcdC8vIEZvciB0aGUgbmV4dCBvbmVcblx0XHRcdFx0cGFyZW50X2ludmFsaWQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gaW52YWxpZDtcblx0XHR9KTtcblxuXHRcdGlmIChpbnZhbGlkX3NlcnZlcl9ub2Rlcy5zb21lKEJvb2xlYW4pKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRzZXJ2ZXJfZGF0YSA9IGF3YWl0IGxvYWRfZGF0YSh1cmwsIGludmFsaWRfc2VydmVyX25vZGVzKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnN0IGhhbmRsZWRfZXJyb3IgPSBhd2FpdCBoYW5kbGVfZXJyb3IoZXJyb3IsIHsgdXJsLCBwYXJhbXMsIHJvdXRlOiB7IGlkIH0gfSk7XG5cblx0XHRcdFx0aWYgKHByZWxvYWQgJiYgcHJlbG9hZF90b2tlbnMuaGFzKHByZWxvYWQpKSB7XG5cdFx0XHRcdFx0dGhyb3cgaGFuZGxlZF9lcnJvcjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBsb2FkX3Jvb3RfZXJyb3JfcGFnZSh7XG5cdFx0XHRcdFx0ZXJyb3I6IGhhbmRsZWRfZXJyb3IsXG5cdFx0XHRcdFx0dXJsLFxuXHRcdFx0XHRcdHJvdXRlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc2VydmVyX2RhdGEudHlwZSA9PT0gJ3JlZGlyZWN0Jykge1xuXHRcdFx0XHRyZXR1cm4gc2VydmVyX2RhdGE7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Y29uc3Qgc2VydmVyX2RhdGFfbm9kZXMgPSBzZXJ2ZXJfZGF0YT8ubm9kZXM7XG5cblx0bGV0IHBhcmVudF9jaGFuZ2VkID0gZmFsc2U7XG5cblx0Y29uc3QgYnJhbmNoX3Byb21pc2VzID0gbG9hZGVycy5tYXAoYXN5bmMgKGxvYWRlciwgaSkgPT4ge1xuXHRcdGlmICghbG9hZGVyIHx8IChhY3Rpb25fZXJyb3IgJiYgaSA9PT0gbGVhZl9pbmRleCkpIHJldHVybjtcblxuXHRcdC8qKiBAdHlwZSB7aW1wb3J0KCcuL3R5cGVzLmpzJykuQnJhbmNoTm9kZSB8IHVuZGVmaW5lZH0gKi9cblx0XHRjb25zdCBwcmV2aW91cyA9IGN1cnJlbnQuYnJhbmNoW2ldO1xuXG5cdFx0Y29uc3Qgc2VydmVyX2RhdGFfbm9kZSA9IHNlcnZlcl9kYXRhX25vZGVzPy5baV07XG5cblx0XHQvLyByZXVzZSBkYXRhIGZyb20gcHJldmlvdXMgbG9hZCBpZiBpdCdzIHN0aWxsIHZhbGlkXG5cdFx0Y29uc3QgdmFsaWQgPVxuXHRcdFx0KCFzZXJ2ZXJfZGF0YV9ub2RlIHx8IHNlcnZlcl9kYXRhX25vZGUudHlwZSA9PT0gJ3NraXAnKSAmJlxuXHRcdFx0bG9hZGVyWzFdID09PSBwcmV2aW91cz8ubG9hZGVyICYmXG5cdFx0XHQhaGFzX2NoYW5nZWQoXG5cdFx0XHRcdHBhcmVudF9jaGFuZ2VkLFxuXHRcdFx0XHRyb3V0ZV9jaGFuZ2VkLFxuXHRcdFx0XHR1cmxfY2hhbmdlZCxcblx0XHRcdFx0c2VhcmNoX3BhcmFtc19jaGFuZ2VkLFxuXHRcdFx0XHRwcmV2aW91cy51bml2ZXJzYWw/LnVzZXMsXG5cdFx0XHRcdHBhcmFtc1xuXHRcdFx0KTtcblx0XHRpZiAodmFsaWQpIHJldHVybiBwcmV2aW91cztcblxuXHRcdHBhcmVudF9jaGFuZ2VkID0gdHJ1ZTtcblxuXHRcdGlmIChzZXJ2ZXJfZGF0YV9ub2RlPy50eXBlID09PSAnZXJyb3InKSB7XG5cdFx0XHQvLyByZXRocm93IGFuZCBjYXRjaCBiZWxvd1xuXHRcdFx0dGhyb3cgbmV3IEhhbmRsZWRIdHRwRXJyb3Ioc2VydmVyX2RhdGFfbm9kZS5lcnJvcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGxvYWRfbm9kZSh7XG5cdFx0XHRsb2FkZXI6IGxvYWRlclsxXSxcblx0XHRcdHVybCxcblx0XHRcdHBhcmFtcyxcblx0XHRcdHJvdXRlLFxuXHRcdFx0cGFyZW50OiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGRhdGEgPSB7fTtcblx0XHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBpOyBqICs9IDEpIHtcblx0XHRcdFx0XHRPYmplY3QuYXNzaWduKGRhdGEsIChhd2FpdCBicmFuY2hfcHJvbWlzZXNbal0pPy5kYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gZGF0YTtcblx0XHRcdH0sXG5cdFx0XHRzZXJ2ZXJfZGF0YV9ub2RlOiBjcmVhdGVfZGF0YV9ub2RlKFxuXHRcdFx0XHQvLyBzZXJ2ZXJfZGF0YV9ub2RlIGlzIHVuZGVmaW5lZCBpZiBpdCB3YXNuJ3QgcmVsb2FkZWQgZnJvbSB0aGUgc2VydmVyO1xuXHRcdFx0XHQvLyBhbmQgaWYgY3VycmVudCBsb2FkZXIgdXNlcyBzZXJ2ZXIgZGF0YSwgd2Ugd2FudCB0byByZXVzZSBwcmV2aW91cyBkYXRhLlxuXHRcdFx0XHRzZXJ2ZXJfZGF0YV9ub2RlID09PSB1bmRlZmluZWQgJiYgbG9hZGVyWzBdID8geyB0eXBlOiAnc2tpcCcgfSA6IChzZXJ2ZXJfZGF0YV9ub2RlID8/IG51bGwpLFxuXHRcdFx0XHRsb2FkZXJbMF0gPyBwcmV2aW91cz8uc2VydmVyIDogdW5kZWZpbmVkXG5cdFx0XHQpXG5cdFx0fSk7XG5cdH0pO1xuXG5cdC8vIGlmIHdlIGRvbid0IGRvIHRoaXMsIHJlamVjdGlvbnMgd2lsbCBiZSB1bmhhbmRsZWRcblx0Zm9yIChjb25zdCBwIG9mIGJyYW5jaF9wcm9taXNlcykgcC5jYXRjaChub29wKTtcblxuXHQvKiogQHR5cGUge0FycmF5PGltcG9ydCgnLi90eXBlcy5qcycpLkJyYW5jaE5vZGUgfCB1bmRlZmluZWQ+fSAqL1xuXHRjb25zdCBicmFuY2ggPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGxvYWRlcnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRpZiAobG9hZGVyc1tpXSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YnJhbmNoLnB1c2goYXdhaXQgYnJhbmNoX3Byb21pc2VzW2ldKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRpZiAoZXJyIGluc3RhbmNlb2YgUmVkaXJlY3QpIHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0dHlwZTogJ3JlZGlyZWN0Jyxcblx0XHRcdFx0XHRcdHN0YXR1czogZXJyLnN0YXR1cyxcblx0XHRcdFx0XHRcdGxvY2F0aW9uOiBlcnIubG9jYXRpb25cblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHByZWxvYWQgJiYgcHJlbG9hZF90b2tlbnMuaGFzKHByZWxvYWQpKSB7XG5cdFx0XHRcdFx0dGhyb3cgYXdhaXQgaGFuZGxlX2Vycm9yKGVyciwgeyBwYXJhbXMsIHVybCwgcm91dGU6IHsgaWQ6IHJvdXRlLmlkIH0gfSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKiogQHR5cGUge0FwcC5FcnJvcn0gKi9cblx0XHRcdFx0bGV0IGVycm9yO1xuXG5cdFx0XHRcdGlmIChzZXJ2ZXJfZGF0YV9ub2Rlcz8uaW5jbHVkZXMoLyoqIEB0eXBlIHtpbXBvcnQoJ3R5cGVzJykuU2VydmVyRXJyb3JOb2RlfSAqLyAoZXJyKSkpIHtcblx0XHRcdFx0XHQvLyB0aGlzIGlzIHRoZSBzZXJ2ZXIgZXJyb3IgcmV0aHJvd24gYWJvdmUsIHJlY29uc3RydWN0IGJ1dCBkb24ndCBpbnZva2Vcblx0XHRcdFx0XHQvLyB0aGUgY2xpZW50IGVycm9yIGhhbmRsZXI7IGl0IHNob3VsZCd2ZSBhbHJlYWR5IGJlZW4gaGFuZGxlZCBvbiB0aGUgc2VydmVyXG5cdFx0XHRcdFx0ZXJyb3IgPSAvKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5TZXJ2ZXJFcnJvck5vZGV9ICovIChlcnIpLmVycm9yO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGVyciBpbnN0YW5jZW9mIEh0dHBFcnJvcikge1xuXHRcdFx0XHRcdGVycm9yID0gYXdhaXQgaGFuZGxlX2Vycm9yKGVyciwgeyBwYXJhbXMsIHVybCwgcm91dGU6IHsgaWQ6IHJvdXRlLmlkIH0gfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gUmVmZXJlbmNlZCBub2RlIGNvdWxkIGhhdmUgYmVlbiByZW1vdmVkIGR1ZSB0byByZWRlcGxveSwgY2hlY2tcblx0XHRcdFx0XHRpZiAoYXdhaXQgdXBkYXRlZC5jaGVjaygpKSB7XG5cdFx0XHRcdFx0XHQvLyBCZWZvcmUgcmVsb2FkaW5nLCB0cnkgdG8gdXBkYXRlIHRoZSBzZXJ2aWNlIHdvcmtlciBpZiBpdCBleGlzdHNcblx0XHRcdFx0XHRcdGF3YWl0IHVwZGF0ZV9zZXJ2aWNlX3dvcmtlcigpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGF3YWl0IG5hdGl2ZV9uYXZpZ2F0aW9uKHVybCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0ZXJyb3IgPSBhd2FpdCBoYW5kbGVfZXJyb3IoZXJyLCB7IHBhcmFtcywgdXJsLCByb3V0ZTogeyBpZDogcm91dGUuaWQgfSB9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBsb2FkX3JvdXRlX2Vycm9yKHtcblx0XHRcdFx0XHRpLFxuXHRcdFx0XHRcdGJyYW5jaCxcblx0XHRcdFx0XHRlcnJvcnMsXG5cdFx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdFx0dXJsLFxuXHRcdFx0XHRcdHBhcmFtcyxcblx0XHRcdFx0XHRyb3V0ZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gcHVzaCBhbiBlbXB0eSBzbG90IHNvIHdlIGNhbiByZXdpbmQgcGFzdCBnYXBzIHRvIHRoZVxuXHRcdFx0Ly8gbGF5b3V0IHRoYXQgY29ycmVzcG9uZHMgd2l0aCBhbiArZXJyb3Iuc3ZlbHRlIHBhZ2Vcblx0XHRcdGJyYW5jaC5wdXNoKHVuZGVmaW5lZCk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKGFjdGlvbl9yZXN1bHQ/LnR5cGUgPT09ICdlcnJvcicpIHtcblx0XHQvLyByZW5kZXIgdGhlIG5lYXJlc3QgZXJyb3IgYm91bmRhcnkgb2YgdGhlIHJvdXRlIHRoZSBhY3Rpb24gYmVsb25ncyB0byxcblx0XHQvLyBhcyBhIG5hdGl2ZSBmb3JtIHN1Ym1pc3Npb24gd291bGRcblx0XHRyZXR1cm4gbG9hZF9yb3V0ZV9lcnJvcih7XG5cdFx0XHRpOiBsb2FkZXJzLmxlbmd0aCxcblx0XHRcdGJyYW5jaCxcblx0XHRcdGVycm9ycyxcblx0XHRcdGVycm9yOiBhY3Rpb25fcmVzdWx0LmVycm9yLFxuXHRcdFx0c3RhdHVzOiBhY3Rpb25fcmVzdWx0LnN0YXR1cyxcblx0XHRcdHVybCxcblx0XHRcdHBhcmFtcyxcblx0XHRcdHJvdXRlXG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gZ2V0X25hdmlnYXRpb25fcmVzdWx0X2Zyb21fYnJhbmNoKHtcblx0XHR1cmwsXG5cdFx0cGFyYW1zLFxuXHRcdGJyYW5jaCxcblx0XHRlcnJvcnMsXG5cdFx0ZXJyb3I6IG51bGwsXG5cdFx0cm91dGUsXG5cdFx0c3RhdHVzOiBhY3Rpb25fcmVzdWx0Py5zdGF0dXMsXG5cdFx0Ly8gYGVycm9yYCByZXN1bHRzIHJldHVybmVkIGFib3ZlLCBgcmVkaXJlY3RgIHJlc3VsdHMgYXJlIG5ldmVyIHBhc3NlZCBoZXJlXG5cdFx0Zm9ybTpcblx0XHRcdGFjdGlvbl9yZXN1bHQ/LnR5cGUgPT09ICdzdWNjZXNzJyB8fCBhY3Rpb25fcmVzdWx0Py50eXBlID09PSAnZmFpbHVyZSdcblx0XHRcdFx0PyAoYWN0aW9uX3Jlc3VsdC5kYXRhID8/IG51bGwpXG5cdFx0XHRcdDogLy8gUmVzZXQgYGZvcm1gIG9uIG5hdmlnYXRpb24sIGJ1dCBub3QgaW52YWxpZGF0aW9uXG5cdFx0XHRcdFx0aW52YWxpZGF0aW5nXG5cdFx0XHRcdFx0PyB1bmRlZmluZWRcblx0XHRcdFx0XHQ6IG51bGxcblx0fSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IGkgU3RhcnQgaW5kZXggdG8gYmFja3RyYWNrIGZyb21cbiAqIEBwYXJhbSB7QXJyYXk8aW1wb3J0KCcuL3R5cGVzLmpzJykuQnJhbmNoTm9kZSB8IHVuZGVmaW5lZD59IGJyYW5jaCBCcmFuY2ggdG8gYmFja3RyYWNrXG4gKiBAcGFyYW0ge0FycmF5PGltcG9ydCgndHlwZXMnKS5DU1JQYWdlTm9kZUxvYWRlciB8IHVuZGVmaW5lZD59IGVycm9ycyBBbGwgZXJyb3IgcGFnZXMgZm9yIHRoaXMgYnJhbmNoXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxBcnJheTxpbXBvcnQoJy4vdHlwZXMuanMnKS5CcmFuY2hOb2RlIHwgdW5kZWZpbmVkPiB8IHVuZGVmaW5lZD59IHRoZSBicmFuY2ggdHJ1bmNhdGVkIGF0IHRoZSBlcnJvciBwYWdlJ3MgZGVwdGhcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZF9uZWFyZXN0X2Vycm9yX3BhZ2UoaSwgYnJhbmNoLCBlcnJvcnMpIHtcblx0Zm9yIChjb25zdCB7IGVycm9yLCBpZHggfSBvZiBuZWFyZXN0X2Vycm9yX3BhZ2VzKGksIGJyYW5jaCwgZXJyb3JzKSkge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gYnJhbmNoLnNsaWNlKDAsIGlkeCkuY29uY2F0KHtcblx0XHRcdFx0bm9kZTogYXdhaXQgZXJyb3IoKSxcblx0XHRcdFx0bG9hZGVyOiBlcnJvcixcblx0XHRcdFx0ZGF0YToge30sXG5cdFx0XHRcdHNlcnZlcjogbnVsbCxcblx0XHRcdFx0dW5pdmVyc2FsOiBudWxsXG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIHtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7e1xuICogICBpOiBudW1iZXI7XG4gKiAgIGJyYW5jaDogQXJyYXk8aW1wb3J0KCcuL3R5cGVzLmpzJykuQnJhbmNoTm9kZSB8IHVuZGVmaW5lZD47XG4gKiAgIGVycm9yczogQXJyYXk8aW1wb3J0KCd0eXBlcycpLkNTUlBhZ2VOb2RlTG9hZGVyIHwgdW5kZWZpbmVkPjtcbiAqICAgZXJyb3I6IEFwcC5FcnJvcjtcbiAqICAgc3RhdHVzPzogbnVtYmVyO1xuICogICB1cmw6IFVSTDtcbiAqICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICogICByb3V0ZTogaW1wb3J0KCcuL3R5cGVzLmpzJykuTmF2aWdhdGlvbkludGVudFsncm91dGUnXTtcbiAqIH19IG9wdHNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZF9yb3V0ZV9lcnJvcih7IGksIGJyYW5jaCwgZXJyb3JzLCBlcnJvciwgc3RhdHVzLCB1cmwsIHBhcmFtcywgcm91dGUgfSkge1xuXHRjb25zdCBlcnJvcl9icmFuY2ggPSBhd2FpdCBsb2FkX25lYXJlc3RfZXJyb3JfcGFnZShpLCBicmFuY2gsIGVycm9ycyk7XG5cdGlmIChlcnJvcl9icmFuY2gpIHtcblx0XHRyZXR1cm4gZ2V0X25hdmlnYXRpb25fcmVzdWx0X2Zyb21fYnJhbmNoKHtcblx0XHRcdHVybCxcblx0XHRcdHBhcmFtcyxcblx0XHRcdGJyYW5jaDogZXJyb3JfYnJhbmNoLFxuXHRcdFx0ZXJyb3JzLFxuXHRcdFx0ZXJyb3IsXG5cdFx0XHRzdGF0dXMsXG5cdFx0XHRyb3V0ZVxuXHRcdH0pO1xuXHR9XG5cblx0cmV0dXJuIHNlcnZlcl9mYWxsYmFjayh1cmwsIHsgaWQ6IHJvdXRlLmlkIH0sIGVycm9yKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3tcbiAqICAgZXJyb3I6IEFwcC5FcnJvcjtcbiAqICAgdXJsOiBVUkw7XG4gKiAgIHJvdXRlOiB7IGlkOiBzdHJpbmcgfCBudWxsIH1cbiAqIH19IG9wdHNcbiAqIEByZXR1cm5zIHtQcm9taXNlPGltcG9ydCgnLi90eXBlcy5qcycpLk5hdmlnYXRpb25GaW5pc2hlZCB8IHVuZGVmaW5lZD59IHJldHVybnMgYHVuZGVmaW5lZGAgaW4gY2FzZSBvZiBhIHJlZGlyZWN0XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWRfcm9vdF9lcnJvcl9wYWdlKHsgZXJyb3IsIHVybCwgcm91dGUgfSkge1xuXHQvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHN0cmluZz59ICovXG5cdGNvbnN0IHBhcmFtcyA9IHt9OyAvLyBlcnJvciBwYWdlIGRvZXMgbm90IGhhdmUgcGFyYW1zXG5cblx0LyoqIEB0eXBlIHtpbXBvcnQoJ3R5cGVzJykuU2VydmVyRGF0YU5vZGUgfCBudWxsfSAqL1xuXHRsZXQgc2VydmVyX2RhdGFfbm9kZSA9IG51bGw7XG5cblx0aWYgKF9fU1ZFTFRFS0lUX0hBU19TRVJWRVJfTE9BRF9fKSB7XG5cdFx0Y29uc3QgZGVmYXVsdF9sYXlvdXRfaGFzX3NlcnZlcl9sb2FkID0gYXBwLnNlcnZlcl9sb2Fkc1swXSA9PT0gMDtcblxuXHRcdGlmIChkZWZhdWx0X2xheW91dF9oYXNfc2VydmVyX2xvYWQpIHtcblx0XHRcdC8vIFRPRE8gcG9zdC1odHRwczovL2dpdGh1Yi5jb20vc3ZlbHRlanMva2l0L2Rpc2N1c3Npb25zLzYxMjQgd2UgY2FuIHVzZVxuXHRcdFx0Ly8gZXhpc3Rpbmcgcm9vdCBsYXlvdXQgZGF0YVxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3Qgc2VydmVyX2RhdGEgPSBhd2FpdCBsb2FkX2RhdGEodXJsLCBbdHJ1ZV0pO1xuXG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHRzZXJ2ZXJfZGF0YS50eXBlICE9PSAnZGF0YScgfHxcblx0XHRcdFx0XHQoc2VydmVyX2RhdGEubm9kZXNbMF0gJiYgc2VydmVyX2RhdGEubm9kZXNbMF0udHlwZSAhPT0gJ2RhdGEnKVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHR0aHJvdyAwO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c2VydmVyX2RhdGFfbm9kZSA9IHNlcnZlcl9kYXRhLm5vZGVzWzBdID8/IG51bGw7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdC8vIGF0IHRoaXMgcG9pbnQgd2UgaGF2ZSBubyBjaG9pY2UgYnV0IHRvIGZhbGwgYmFjayB0byB0aGUgc2VydmVyLCBpZiBpdCB3b3VsZG4ndFxuXHRcdFx0XHQvLyBicmluZyB1cyByaWdodCBiYWNrIGhlcmUsIHR1cm5pbmcgdGhpcyBpbnRvIGFuIGVuZGxlc3MgbG9vcC5cblx0XHRcdFx0Ly8gaWYgX19kYXRhLmpzb24gcmV0dXJuZWQgNDA0LCB0aGUgcm91dGUgZG9lc24ndCBleGlzdCDigJQgZG9uJ3QgcmVsb2FkIG9yIHdlIGxvb3Bcblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdCEoZSBpbnN0YW5jZW9mIEh0dHBFcnJvciAmJiBlLnN0YXR1cyA9PT0gNDA0KSAmJlxuXHRcdFx0XHRcdCh1cmwub3JpZ2luICE9PSBvcmlnaW4gfHwgdXJsLnBhdGhuYW1lICE9PSBsb2NhdGlvbi5wYXRobmFtZSB8fCBoeWRyYXRlZClcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0cmV0dXJuIGF3YWl0IG5hdGl2ZV9uYXZpZ2F0aW9uKHVybCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR0cnkge1xuXHRcdGNvbnN0IHJvb3RfbGF5b3V0ID0gYXdhaXQgbG9hZF9ub2RlKHtcblx0XHRcdGxvYWRlcjogZGVmYXVsdF9sYXlvdXRfbG9hZGVyLFxuXHRcdFx0dXJsLFxuXHRcdFx0cGFyYW1zLFxuXHRcdFx0cm91dGUsXG5cdFx0XHRwYXJlbnQ6ICgpID0+IFByb21pc2UucmVzb2x2ZSh7fSksXG5cdFx0XHRzZXJ2ZXJfZGF0YV9ub2RlOiBjcmVhdGVfZGF0YV9ub2RlKHNlcnZlcl9kYXRhX25vZGUpXG5cdFx0fSk7XG5cblx0XHQvKiogQHR5cGUge2ltcG9ydCgnLi90eXBlcy5qcycpLkJyYW5jaE5vZGV9ICovXG5cdFx0Y29uc3Qgcm9vdF9lcnJvciA9IHtcblx0XHRcdG5vZGU6IGF3YWl0IGRlZmF1bHRfZXJyb3JfbG9hZGVyKCksXG5cdFx0XHRsb2FkZXI6IGRlZmF1bHRfZXJyb3JfbG9hZGVyLFxuXHRcdFx0dW5pdmVyc2FsOiBudWxsLFxuXHRcdFx0c2VydmVyOiBudWxsLFxuXHRcdFx0ZGF0YTogbnVsbFxuXHRcdH07XG5cblx0XHRyZXR1cm4gZ2V0X25hdmlnYXRpb25fcmVzdWx0X2Zyb21fYnJhbmNoKHtcblx0XHRcdHVybCxcblx0XHRcdHBhcmFtcyxcblx0XHRcdGJyYW5jaDogW3Jvb3RfbGF5b3V0LCByb290X2Vycm9yXSxcblx0XHRcdGVycm9yLFxuXHRcdFx0ZXJyb3JzOiBbXSxcblx0XHRcdHJvdXRlOiBudWxsXG5cdFx0fSk7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gY2xpZW50LXNpZGUgbmF2aWdhdGlvbiBpZiB0aGUgcm9vdCBsYXlvdXQgbG9hZGVyIHRocm93cyBhIHJlZGlyZWN0IHdoaWxlXG5cdFx0Ly8gcmVuZGVyaW5nIHRoZSBkZWZhdWx0IGVycm9yIHBhZ2Vcblx0XHRpZiAoZXJyb3IgaW5zdGFuY2VvZiBSZWRpcmVjdCkge1xuXHRcdFx0YXdhaXQgX2dvdG8obmV3IFVSTChlcnJvci5sb2NhdGlvbiwgbG9jYXRpb24uaHJlZikpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIG90aGVyd2lzZSwgcmVuZGVyIHRoZSBzdGF0aWMgZXJyb3IgcGFnZVxuXHRcdGNvbnN0IGVycm9yX3RlbXBsYXRlID0gYXdhaXQgYXBwLmdldF9lcnJvcl90ZW1wbGF0ZSgpO1xuXHRcdGNvbnN0IGhhbmRsZWQgPSBhd2FpdCBoYW5kbGVfZXJyb3IoZXJyb3IsIHsgdXJsLCBwYXJhbXMsIHJvdXRlIH0pO1xuXHRcdGNvbnN0IG1lc3NhZ2UgPSBTdHJpbmcoaGFuZGxlZD8ubWVzc2FnZSA/PyAnJylcblx0XHRcdC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG5cdFx0XHQucmVwbGFjZSgvPC9nLCAnJmx0OycpXG5cdFx0XHQucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xuXHRcdGNvbnN0IGh0bWwgPSBlcnJvcl90ZW1wbGF0ZSh7IHN0YXR1czogaGFuZGxlZC5zdGF0dXMsIG1lc3NhZ2UgfSk7XG5cdFx0Y29uc3QgcGFyc2VkID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XG5cdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcGxhY2VDaGlsZChkb2N1bWVudC5hZG9wdE5vZGUocGFyc2VkLmhlYWQpLCBkb2N1bWVudC5oZWFkKTtcblx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVwbGFjZUNoaWxkKGRvY3VtZW50LmFkb3B0Tm9kZShwYXJzZWQuYm9keSksIGRvY3VtZW50LmJvZHkpO1xuXG5cdFx0dGhyb3cgZXJyb3I7XG5cdH1cbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSByZWxhdGl2ZSByZXJvdXRlZCBVUkwgZm9yIGEgY2xpZW50LXNpZGUgbmF2aWdhdGlvblxuICogQHBhcmFtIHtVUkx9IHVybFxuICogQHJldHVybnMge1Byb21pc2U8VVJMIHwgdW5kZWZpbmVkPn1cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2V0X3Jlcm91dGVkX3VybCh1cmwpIHtcblx0Y29uc3QgaHJlZiA9IHVybC5ocmVmO1xuXG5cdGlmIChyZXJvdXRlX2NhY2hlLmhhcyhocmVmKSkge1xuXHRcdHJldHVybiByZXJvdXRlX2NhY2hlLmdldChocmVmKTtcblx0fVxuXG5cdGxldCByZXJvdXRlZDtcblxuXHR0cnkge1xuXHRcdGNvbnN0IHByb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuXHRcdFx0Ly8gcmVyb3V0ZSBjb3VsZCBhbHRlciB0aGUgZ2l2ZW4gVVJMLCBzbyB3ZSBwYXNzIGEgY29weVxuXHRcdFx0bGV0IHJlcm91dGVkID1cblx0XHRcdFx0KGF3YWl0IGFwcC5ob29rcy5yZXJvdXRlKHtcblx0XHRcdFx0XHR1cmw6IG5ldyBVUkwodXJsKSxcblx0XHRcdFx0XHRmZXRjaDogYXN5bmMgKGlucHV0LCBpbml0KSA9PiB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzb2x2ZV9mZXRjaF91cmwoaW5wdXQsIGluaXQsIHVybCkucHJvbWlzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pKSA/PyB1cmw7XG5cblx0XHRcdGlmICh0eXBlb2YgcmVyb3V0ZWQgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdGNvbnN0IHRtcCA9IG5ldyBVUkwodXJsKTsgLy8gZG8gbm90IG11dGF0ZSB0aGUgaW5jb21pbmcgVVJMXG5cblx0XHRcdFx0aWYgKGFwcC5oYXNoKSB7XG5cdFx0XHRcdFx0dG1wLmhhc2ggPSByZXJvdXRlZDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0bXAucGF0aG5hbWUgPSByZXJvdXRlZDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJlcm91dGVkID0gdG1wO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcmVyb3V0ZWQ7XG5cdFx0fSkoKTtcblxuXHRcdHJlcm91dGVfY2FjaGUuc2V0KGhyZWYsIHByb21pc2UpO1xuXHRcdHJlcm91dGVkID0gYXdhaXQgcHJvbWlzZTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHJlcm91dGVfY2FjaGUuZGVsZXRlKGhyZWYpO1xuXHRcdGlmIChERVYpIHtcblx0XHRcdC8vIGluIGRldmVsb3BtZW50LCBwcmludCB0aGUgZXJyb3IuLi5cblx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cblx0XHRcdC8vIC4uLmFuZCBwYXVzZSBleGVjdXRpb24sIHNpbmNlIG90aGVyd2lzZSB3ZSB3aWxsIGltbWVkaWF0ZWx5IHJlbG9hZCB0aGUgcGFnZVxuXHRcdFx0ZGVidWdnZXI7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblx0XHR9XG5cblx0XHQvLyBmYWxsIGJhY2sgdG8gbmF0aXZlIG5hdmlnYXRpb25cblx0XHRyZXR1cm47XG5cdH1cblxuXHRyZXR1cm4gcmVyb3V0ZWQ7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgZnVsbCBpbmZvICh3aGljaCByb3V0ZSwgcGFyYW1zLCBldGMuKSBmb3IgYSBjbGllbnQtc2lkZSBuYXZpZ2F0aW9uIGZyb20gdGhlIFVSTCxcbiAqIHRha2luZyB0aGUgcmVyb3V0ZSBob29rIGludG8gYWNjb3VudC4gSWYgdGhpcyBpc24ndCBhIGNsaWVudC1zaWRlLW5hdmlnYXRpb24gKG9yIHRoZSBVUkwgaXMgdW5kZWZpbmVkKSxcbiAqIHJldHVybnMgdW5kZWZpbmVkLlxuICogQHBhcmFtIHtVUkwgfCB1bmRlZmluZWR9IHVybFxuICogQHBhcmFtIHtib29sZWFufSBpbnZhbGlkYXRpbmdcbiAqIEByZXR1cm5zIHtQcm9taXNlPGltcG9ydCgnLi90eXBlcy5qcycpLk5hdmlnYXRpb25JbnRlbnQgfCB1bmRlZmluZWQ+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0X25hdmlnYXRpb25faW50ZW50KHVybCwgaW52YWxpZGF0aW5nKSB7XG5cdGlmICghdXJsKSByZXR1cm47XG5cdGlmIChpc19leHRlcm5hbF91cmwodXJsLCBiYXNlLCBhcHAuaGFzaCkpIHJldHVybjtcblxuXHRpZiAoX19TVkVMVEVLSVRfQ0xJRU5UX1JPVVRJTkdfXykge1xuXHRcdGNvbnN0IHJlcm91dGVkID0gYXdhaXQgZ2V0X3Jlcm91dGVkX3VybCh1cmwpO1xuXHRcdGlmICghcmVyb3V0ZWQpIHJldHVybjtcblxuXHRcdGNvbnN0IHBhdGggPSBnZXRfdXJsX3BhdGgocmVyb3V0ZWQpO1xuXG5cdFx0Zm9yIChjb25zdCByb3V0ZSBvZiByb3V0ZXMpIHtcblx0XHRcdGNvbnN0IHBhcmFtcyA9IHJvdXRlLmV4ZWMocGF0aCk7XG5cblx0XHRcdGlmIChwYXJhbXMpIHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRpZDogZ2V0X3BhZ2Vfa2V5KHVybCksXG5cdFx0XHRcdFx0aW52YWxpZGF0aW5nLFxuXHRcdFx0XHRcdHJvdXRlLFxuXHRcdFx0XHRcdHBhcmFtcyxcblx0XHRcdFx0XHR1cmxcblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0LyoqIEB0eXBlIHt7IHJvdXRlPzogaW1wb3J0KCd0eXBlcycpLkNTUlJvdXRlU2VydmVyLCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz59fSAqL1xuXHRcdGNvbnN0IHsgcm91dGUsIHBhcmFtcyB9ID0gYXdhaXQgaW1wb3J0KFxuXHRcdFx0LyogQHZpdGUtaWdub3JlICovXG5cdFx0XHRfX3ZpdGVfX2luamVjdFF1ZXJ5KGFkZF9yZXNvbHV0aW9uX3N1ZmZpeCh1cmwucGF0aG5hbWUpLCAnaW1wb3J0Jylcblx0XHQpO1xuXG5cdFx0aWYgKCFyb3V0ZSkgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGlkOiBnZXRfcGFnZV9rZXkodXJsKSxcblx0XHRcdGludmFsaWRhdGluZyxcblx0XHRcdHJvdXRlOiBwYXJzZV9hbmRfY2FjaGVfc2VydmVyX3JvdXRlKHJvdXRlKSxcblx0XHRcdHBhcmFtcyxcblx0XHRcdHVybFxuXHRcdH07XG5cdH1cbn1cblxuLyoqIEBwYXJhbSB7VVJMfSB1cmwgKi9cbmZ1bmN0aW9uIGdldF91cmxfcGF0aCh1cmwpIHtcblx0cmV0dXJuIChcblx0XHRkZWNvZGVfcGF0aG5hbWUoXG5cdFx0XHRhcHAuaGFzaCA/IHVybC5oYXNoLnJlcGxhY2UoL14jLywgJycpLnJlcGxhY2UoL1s/I10uKy8sICcnKSA6IHVybC5wYXRobmFtZS5zbGljZShiYXNlLmxlbmd0aClcblx0XHQpIHx8ICcvJ1xuXHQpO1xufVxuXG4vKiogQHBhcmFtIHtVUkx9IHVybCAqL1xuZnVuY3Rpb24gZ2V0X3BhZ2Vfa2V5KHVybCkge1xuXHRyZXR1cm4gKGFwcC5oYXNoID8gdXJsLmhhc2gucmVwbGFjZSgvXiMvLCAnJykgOiB1cmwucGF0aG5hbWUpICsgdXJsLnNlYXJjaDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3tcbiAqICAgdXJsOiBVUkw7XG4gKiAgIHR5cGU6IE5hdmlnYXRpb25bXCJ0eXBlXCJdO1xuICogICBpbnRlbnQ/OiBpbXBvcnQoJy4vdHlwZXMuanMnKS5OYXZpZ2F0aW9uSW50ZW50O1xuICogICBkZWx0YT86IG51bWJlcjtcbiAqICAgZXZlbnQ/OiBQb3BTdGF0ZUV2ZW50IHwgTW91c2VFdmVudDtcbiAqICAgc2Nyb2xsPzogeyB4OiBudW1iZXIsIHk6IG51bWJlciB9O1xuICogICBzaGFsbG93PzogYm9vbGVhbjtcbiAqICAgdGFyZ2V0PzogeyBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCBudWxsOyByb3V0ZTogeyBpZDogc3RyaW5nIH0gfCBudWxsOyB1cmw6IFVSTCB9O1xuICogfX0gb3B0c1xuICovXG5mdW5jdGlvbiBfYmVmb3JlX25hdmlnYXRlKHsgdXJsLCB0eXBlLCBpbnRlbnQsIGRlbHRhLCBldmVudCwgc2Nyb2xsLCBzaGFsbG93ID0gZmFsc2UsIHRhcmdldCB9KSB7XG5cdGxldCBzaG91bGRfYmxvY2sgPSBmYWxzZTtcblxuXHRjb25zdCBuYXYgPSBjcmVhdGVfbmF2aWdhdGlvbihjdXJyZW50LCBpbnRlbnQsIHVybCwgdHlwZSwgc2Nyb2xsID8/IG51bGwsIHNoYWxsb3csIHRhcmdldCk7XG5cblx0aWYgKG5hdi5uYXZpZ2F0aW9uLnR5cGUgPT09ICdwb3BzdGF0ZScgJiYgZGVsdGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdG5hdi5uYXZpZ2F0aW9uLmRlbHRhID0gZGVsdGE7XG5cdH1cblxuXHRpZiAoZXZlbnQgIT09IHVuZGVmaW5lZCkge1xuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRuYXYubmF2aWdhdGlvbi5ldmVudCA9IGV2ZW50O1xuXHR9XG5cblx0Y29uc3QgY2FuY2VsbGFibGUgPSB7XG5cdFx0Li4ubmF2Lm5hdmlnYXRpb24sXG5cdFx0Y2FuY2VsOiAoKSA9PiB7XG5cdFx0XHRzaG91bGRfYmxvY2sgPSB0cnVlO1xuXHRcdFx0bmF2LnJlamVjdChuZXcgRXJyb3IoJ25hdmlnYXRpb24gY2FuY2VsbGVkJykpO1xuXHRcdH1cblx0fTtcblxuXHRpZiAoIWlzX25hdmlnYXRpbmcpIHtcblx0XHQvLyBEb24ndCBydW4gdGhlIGV2ZW50IGR1cmluZyByZWRpcmVjdHNcblx0XHQvLyBUT0RPIHRoaXMgaXNuJ3QgZnVsbHkgcmlnaHQ6IGlmIHlvdSBkbyBhIGdvdG8oLi4uKSB3aGlsZSBhbm90aGVyIGdvdG8oLi4uKSBpcyBpbiBwcm9ncmVzcyxcblx0XHQvLyBvciB5b3UgY2xpY2sgYSBsaW5rIHdoaWxlIGEgbmF2aWdhdGlvbiBpcyBpbiBwcm9ncmVzcywgdGhlIGJlZm9yTmF2aWdhdGUgY2FsbHMgYXJlIG5vdCB0cmlnZ2VyZWQsXG5cdFx0Ly8gYW5kIG1heWJlIHRoZXkgc2hvdWxkIGJlP1xuXHRcdGJlZm9yZV9uYXZpZ2F0ZV9jYWxsYmFja3MuZm9yRWFjaCgoZm4pID0+IGZuKGNhbmNlbGxhYmxlKSk7XG5cdH1cblxuXHRyZXR1cm4gc2hvdWxkX2Jsb2NrID8gbnVsbCA6IG5hdjtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3tcbiAqICAgdHlwZTogTmF2aWdhdGlvblR5cGU7XG4gKiAgIHVybDogVVJMO1xuICogICBwb3BwZWQ/OiB7XG4gKiAgICAgc3RhdGU6IFJlY29yZDxzdHJpbmcsIGFueT47XG4gKiAgICAgc2Nyb2xsPzogeyB4OiBudW1iZXIsIHk6IG51bWJlciB9O1xuICogICAgIGRlbHRhOiBudW1iZXI7XG4gKiAgICAgc2hhbGxvdzogeyBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCBudWxsOyByb3V0ZTogeyBpZDogc3RyaW5nIH0gfCBudWxsOyB1cmw6IFVSTCB9IHwgbnVsbDtcbiAqICAgfTtcbiAqICAgcmVzZXQ/OiBib29sZWFuO1xuICogICByZXBsYWNlX3N0YXRlPzogYm9vbGVhbjtcbiAqICAgc3RhdGU/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICogICBwZXJzaXN0X3N0YXRlPzogYm9vbGVhbjtcbiAqICAgcmVkaXJlY3RfY291bnQ/OiBudW1iZXI7XG4gKiAgIG5hdl90b2tlbj86IHt9O1xuICogICBhY2NlcHQ/OiAoKSA9PiB2b2lkO1xuICogICBibG9jaz86ICgpID0+IHZvaWQ7XG4gKiAgIGV2ZW50PzogRXZlbnQ7XG4gKiAgIGludGVudD86IE5hdmlnYXRpb25JbnRlbnQgfCB1bmRlZmluZWQ7XG4gKiAgIGFjdGlvbl9yZXN1bHQ/OiBBY3Rpb25SZXN1bHQ7XG4gKiB9fSBvcHRzXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbmF2aWdhdGUoe1xuXHR0eXBlLFxuXHR1cmwsXG5cdHBvcHBlZCxcblx0cmVzZXQgPSB0cnVlLFxuXHRyZXBsYWNlX3N0YXRlLFxuXHRzdGF0ZSA9IHt9LFxuXHRwZXJzaXN0X3N0YXRlID0gZmFsc2UsXG5cdHJlZGlyZWN0X2NvdW50ID0gMCxcblx0bmF2X3Rva2VuID0ge30sXG5cdGFjY2VwdCA9IG5vb3AsXG5cdGJsb2NrID0gbm9vcCxcblx0ZXZlbnQsXG5cdGludGVudCxcblx0YWN0aW9uX3Jlc3VsdFxufSkge1xuXHRjb25zdCBwcmV2X3Rva2VuID0gbmF2aWdhdGlvbl90b2tlbjtcblx0Y29uc3QgcHJldl9pbnZhbGlkYXRpb25fdG9rZW4gPSBpbnZhbGlkYXRpb25fdG9rZW47XG5cdG5hdmlnYXRpb25fdG9rZW4gPSBpbnZhbGlkYXRpb25fdG9rZW4gPSBuYXZfdG9rZW47XG5cblx0aW50ZW50ID8/PSBhd2FpdCBnZXRfbmF2aWdhdGlvbl9pbnRlbnQodXJsLCBmYWxzZSk7XG5cdGNvbnN0IG5hdiA9XG5cdFx0dHlwZSA9PT0gJ2VudGVyJ1xuXHRcdFx0PyBjcmVhdGVfbmF2aWdhdGlvbihjdXJyZW50LCBpbnRlbnQsIHVybCwgdHlwZSlcblx0XHRcdDogX2JlZm9yZV9uYXZpZ2F0ZSh7XG5cdFx0XHRcdFx0dXJsLFxuXHRcdFx0XHRcdHR5cGUsXG5cdFx0XHRcdFx0ZGVsdGE6IHBvcHBlZD8uZGVsdGEsXG5cdFx0XHRcdFx0aW50ZW50LFxuXHRcdFx0XHRcdHNjcm9sbDogcG9wcGVkPy5zY3JvbGwsXG5cdFx0XHRcdFx0c2hhbGxvdzogISFwb3BwZWQ/LnNoYWxsb3csXG5cdFx0XHRcdFx0dGFyZ2V0OiBwb3BwZWQ/LnNoYWxsb3cgPz8gdW5kZWZpbmVkLFxuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRldmVudFxuXHRcdFx0XHR9KTtcblxuXHRpZiAoIW5hdikge1xuXHRcdGJsb2NrKCk7XG5cdFx0aWYgKG5hdmlnYXRpb25fdG9rZW4gPT09IG5hdl90b2tlbikgbmF2aWdhdGlvbl90b2tlbiA9IHByZXZfdG9rZW47XG5cdFx0aWYgKGludmFsaWRhdGlvbl90b2tlbiA9PT0gbmF2X3Rva2VuKSBpbnZhbGlkYXRpb25fdG9rZW4gPSBwcmV2X2ludmFsaWRhdGlvbl90b2tlbjtcblx0XHRyZXR1cm47XG5cdH1cblxuXHQvLyBzdG9yZSB0aGlzIGJlZm9yZSBjYWxsaW5nIGBhY2NlcHQoKWAsIHdoaWNoIG1heSBjaGFuZ2UgdGhlIGluZGV4XG5cdGNvbnN0IHByZXZpb3VzX2hpc3RvcnlfaW5kZXggPSBjdXJyZW50X2hpc3RvcnlfaW5kZXg7XG5cdGNvbnN0IHByZXZpb3VzX25hdmlnYXRpb25faW5kZXggPSBjdXJyZW50X25hdmlnYXRpb25faW5kZXg7XG5cdGNvbnN0IHByZXZpb3VzX3NuYXBzaG90X3JlZ2lzdHJhdGlvbnMgPSBjdXJyZW50X3JlZ2lzdHJhdGlvbnMoKTtcblxuXHRhY2NlcHQoKTtcblxuXHRpc19uYXZpZ2F0aW5nID0gdHJ1ZTtcblxuXHRpZiAoc3RhcnRlZCAmJiBuYXYubmF2aWdhdGlvbi50eXBlICE9PSAnZW50ZXInKSB7XG5cdFx0c2V0X25hdmlnYXRpb24obmF2Lm5hdmlnYXRpb24pO1xuXHR9XG5cblx0bGV0IG5hdmlnYXRpb25fcmVzdWx0ID0gaW50ZW50ICYmIChhd2FpdCBsb2FkX3JvdXRlKHsgLi4uaW50ZW50LCBhY3Rpb25fcmVzdWx0IH0pKTtcblxuXHRpZiAoIW5hdmlnYXRpb25fcmVzdWx0KSB7XG5cdFx0Y29uc3QgZXh0ZXJuYWwgPSBpc19leHRlcm5hbF91cmwodXJsLCBiYXNlLCBhcHAuaGFzaCk7XG5cdFx0Ly8gU3BlY2lhbCBjYXNlIGZvciBoYXNoIG1vZGUgZHVyaW5nIERFVjogSWYgc29tZW9uZSBhY2NpZGVudGFsbHkgZm9yZ2V0cyB0byB1c2UgYSBoYXNoIGZvciB0aGUgbGluayxcblx0XHQvLyB0aGV5IHdvdWxkIGVuZCB1cCBoZXJlIGluIGFuIGVuZGxlc3MgbG9vcC4gRmFsbCBiYWNrIHRvIGVycm9yIHBhZ2UgaW4gdGhhdCBjYXNlXG5cdFx0Y29uc3QgbWlzc2luZ19oYXNoID0gZXh0ZXJuYWwgJiYgREVWICYmIGFwcC5oYXNoO1xuXG5cdFx0aWYgKGV4dGVybmFsICYmICFtaXNzaW5nX2hhc2gpIHtcblx0XHRcdHJldHVybiBhd2FpdCBuYXRpdmVfbmF2aWdhdGlvbih1cmwsIHJlcGxhY2Vfc3RhdGUpO1xuXHRcdH1cblxuXHRcdG5hdmlnYXRpb25fcmVzdWx0ID0gYXdhaXQgc2VydmVyX2ZhbGxiYWNrKFxuXHRcdFx0dXJsLFxuXHRcdFx0eyBpZDogbnVsbCB9LFxuXHRcdFx0YXdhaXQgaGFuZGxlX2Vycm9yKFxuXHRcdFx0XHRuZXcgU3ZlbHRlS2l0RXJyb3IoXG5cdFx0XHRcdFx0NDA0LFxuXHRcdFx0XHRcdCdOb3QgRm91bmQnLFxuXHRcdFx0XHRcdGBOb3QgZm91bmQ6ICR7dXJsLnBhdGhuYW1lfSR7bWlzc2luZ19oYXNoID8gJyAoZGlkIHlvdSBmb3JnZXQgdGhlIGhhc2g/KScgOiAnJ31gXG5cdFx0XHRcdCksXG5cdFx0XHRcdHsgdXJsLCBwYXJhbXM6IHt9LCByb3V0ZTogeyBpZDogbnVsbCB9IH1cblx0XHRcdCksXG5cdFx0XHRyZXBsYWNlX3N0YXRlXG5cdFx0KTtcblx0fVxuXG5cdC8vIGlmIHRoaXMgaXMgYW4gaW50ZXJuYWwgbmF2aWdhdGlvbiBpbnRlbnQsIHVzZSB0aGUgbm9ybWFsaXplZFxuXHQvLyBVUkwgZm9yIHRoZSByZXN0IG9mIHRoZSBmdW5jdGlvblxuXHR1cmwgPSBpbnRlbnQ/LnVybCB8fCB1cmw7XG5cblx0Ly8gYWJvcnQgaWYgdXNlciBuYXZpZ2F0ZWQgZHVyaW5nIHVwZGF0ZVxuXHRpZiAobmF2aWdhdGlvbl90b2tlbiAhPT0gbmF2X3Rva2VuKSB7XG5cdFx0bmF2LnJlamVjdChuZXcgRXJyb3IoJ25hdmlnYXRpb24gYWJvcnRlZCcpKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZiAoIW5hdmlnYXRpb25fcmVzdWx0KSByZXR1cm47XG5cblx0aWYgKG5hdmlnYXRpb25fcmVzdWx0LnR5cGUgPT09ICdyZWRpcmVjdCcpIHtcblx0XHQvLyB3aGF0d2cgZmV0Y2ggc3BlYyBodHRwczovL2ZldGNoLnNwZWMud2hhdHdnLm9yZy8jaHR0cC1yZWRpcmVjdC1mZXRjaCBzYXlzIHRvIGVycm9yIGFmdGVyIDIwIHJlZGlyZWN0c1xuXHRcdGlmIChyZWRpcmVjdF9jb3VudCA8IDIwKSB7XG5cdFx0XHQvLyBhIHByZWxvYWRlZCByZWRpcmVjdCBoYXMgYmVlbiBjb25zdW1lZDsgYSBsYXRlciBob3AgYmFjayB0byB0aGlzIHJvdXRlIG11c3QgbG9hZCBhZnJlc2hcblx0XHRcdGlmIChsb2FkX2NhY2hlPy5pZCA9PT0gaW50ZW50Py5pZCkgZGlzY2FyZF9sb2FkX2NhY2hlKCk7XG5cblx0XHRcdGF3YWl0IG5hdmlnYXRlKHtcblx0XHRcdFx0dHlwZSxcblx0XHRcdFx0dXJsOiBuZXcgVVJMKG5hdmlnYXRpb25fcmVzdWx0LmxvY2F0aW9uLCB1cmwpLFxuXHRcdFx0XHRwb3BwZWQsXG5cdFx0XHRcdHJlc2V0LFxuXHRcdFx0XHRyZXBsYWNlX3N0YXRlLFxuXHRcdFx0XHRzdGF0ZSxcblx0XHRcdFx0cGVyc2lzdF9zdGF0ZSxcblx0XHRcdFx0cmVkaXJlY3RfY291bnQ6IHJlZGlyZWN0X2NvdW50ICsgMSxcblx0XHRcdFx0bmF2X3Rva2VuXG5cdFx0XHR9KTtcblxuXHRcdFx0bmF2LmZ1bGZpbCh1bmRlZmluZWQpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdG5hdmlnYXRpb25fcmVzdWx0ID0gYXdhaXQgbG9hZF9yb290X2Vycm9yX3BhZ2Uoe1xuXHRcdFx0ZXJyb3I6IGF3YWl0IGhhbmRsZV9lcnJvcihcblx0XHRcdFx0Y2FwdHVyZV9lcnJvcigoKSA9PiBlLnJlZGlyZWN0X2xvb3AoeyB1cmw6IHVybC5ocmVmIH0pKSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHVybCxcblx0XHRcdFx0XHRwYXJhbXM6IHt9LFxuXHRcdFx0XHRcdHJvdXRlOiB7IGlkOiBudWxsIH1cblx0XHRcdFx0fVxuXHRcdFx0KSxcblx0XHRcdHVybCxcblx0XHRcdHJvdXRlOiB7IGlkOiBudWxsIH1cblx0XHR9KTtcblxuXHRcdGlmICghbmF2aWdhdGlvbl9yZXN1bHQpIHJldHVybjtcblx0fSBlbHNlIGlmICgvKiogQHR5cGUge251bWJlcn0gKi8gKG5hdmlnYXRpb25fcmVzdWx0LnByb3BzLnBhZ2Uuc3RhdHVzKSA+PSA0MDApIHtcblx0XHRpZiAoYXdhaXQgdXBkYXRlZC5jaGVjaygpKSB7XG5cdFx0XHQvLyBCZWZvcmUgcmVsb2FkaW5nLCB0cnkgdG8gdXBkYXRlIHRoZSBzZXJ2aWNlIHdvcmtlciBpZiBpdCBleGlzdHNcblx0XHRcdGF3YWl0IHVwZGF0ZV9zZXJ2aWNlX3dvcmtlcigpO1xuXHRcdFx0cmV0dXJuIGF3YWl0IG5hdGl2ZV9uYXZpZ2F0aW9uKHVybCwgcmVwbGFjZV9zdGF0ZSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gcmVzZXQgaW52YWxpZGF0aW9uIG9ubHkgYWZ0ZXIgYSBmaW5pc2hlZCBuYXZpZ2F0aW9uLiBJZiB0aGVyZSBhcmUgcmVkaXJlY3RzIG9yXG5cdC8vIGFkZGl0aW9uYWwgaW52YWxpZGF0aW9ucywgdGhleSBzaG91bGQgZ2V0IHRoZSBzYW1lIGludmFsaWRhdGlvbiB0cmVhdG1lbnRcblx0cmVzZXRfaW52YWxpZGF0aW9uKCk7XG5cblx0dXBkYXRpbmcgPSB0cnVlO1xuXG5cdGlmICghcG9wcGVkKSB7XG5cdFx0Ly8gcG9wc3RhdGUgY2FwdHVyZXMgdGhlIHNvdXJjZSBlbnRyeSBzeW5jaHJvbm91c2x5LCBiZWZvcmUgdGhlIHRyYXZlcnNhbCBpcyByZXNvbHZlZFxuXHRcdGNhcHR1cmVfc2Nyb2xsKHByZXZpb3VzX2hpc3RvcnlfaW5kZXgpO1xuXHRcdGNhcHR1cmVfc25hcHNob3QocHJldmlvdXNfbmF2aWdhdGlvbl9pbmRleCk7XG5cdFx0aWYgKHJlcGxhY2Vfc3RhdGUpIHtcblx0XHRcdGRlbGV0ZV9uYXZpZ2F0aW9uX3NuYXBzaG90KHByZXZpb3VzX2hpc3RvcnlfaW5kZXgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjYXB0dXJlX25hdmlnYXRpb25fc25hcHNob3QocHJldmlvdXNfaGlzdG9yeV9pbmRleCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gZW5zdXJlIHRoZSB1cmwgcGF0aG5hbWUgbWF0Y2hlcyB0aGUgcGFnZSdzIHRyYWlsaW5nIHNsYXNoIG9wdGlvblxuXHRpZiAobmF2aWdhdGlvbl9yZXN1bHQucHJvcHMucGFnZS51cmwucGF0aG5hbWUgIT09IHVybC5wYXRobmFtZSkge1xuXHRcdHVybC5wYXRobmFtZSA9IG5hdmlnYXRpb25fcmVzdWx0LnByb3BzLnBhZ2UudXJsLnBhdGhuYW1lO1xuXHR9XG5cblx0aWYgKHBvcHBlZCkge1xuXHRcdHN0YXRlID0gcG9wcGVkLnN0YXRlO1xuXHR9IGVsc2Uge1xuXHRcdC8vIHdlIGltbWVkaWF0ZWx5IHNlcmlhbGl6ZS10aGVuLXBhcnNlIHRvIGVuc3VyZSB0aGF0IHRoZSB2YWx1ZSBpc1xuXHRcdC8vIHNlcmlhbGl6YWJsZSwgYW5kIHRvIHByZXZlbnQgdGhlIGRldmVsb3BlciBmcm9tIGRhbmdlcm91c2x5XG5cdFx0Ly8gcmVseWluZyBvbiB0aGUgaWRlbnRpdHkgb2YgdGhlIHNlcmlhbGl6ZWQgb2JqZWN0c1xuXHRcdGNvbnN0IHNlcmlhbGl6ZWRfc3RhdGUgPSBzdHJpbmdpZnkoc3RhdGUpO1xuXHRcdHN0YXRlID0gcGFyc2Uoc2VyaWFsaXplZF9zdGF0ZSk7XG5cblx0XHQvLyBTdG9yZSB0aGUgc2VyaWFsaXplZCBzdGF0ZSBzbyB0aGUgYnJvd3NlciBoaXN0b3J5IGNhbiBwcmVzZXJ2ZSBjdXN0b20gdHJhbnNwb3J0IHZhbHVlcy5cblx0XHQvLyBUaGlzIGlzIGEgbmV3IG5hdmlnYXRpb24sIHJhdGhlciB0aGFuIGEgcG9wc3RhdGUuXG5cdFx0Y29uc3QgY2hhbmdlID0gcmVwbGFjZV9zdGF0ZSA/IDAgOiAxO1xuXHRcdGlmICh0eXBlICE9PSAnZW50ZXInKSB7XG5cdFx0XHRpZiAocmVzZXQpIGN1cnJlbnRfcmVzZXRfaW5kZXggKz0gMTtcblx0XHR9XG5cblx0XHRjb25zdCBlbnRyeSA9IHtcblx0XHRcdFtISVNUT1JZX01FVEFEQVRBX0tFWV06IC8qKiBAc2F0aXNmaWVzIHtIaXN0b3J5TWV0YWRhdGF9ICovICh7XG5cdFx0XHRcdGhpc3RvcnlJbmRleDogKGN1cnJlbnRfaGlzdG9yeV9pbmRleCArPSBjaGFuZ2UpLFxuXHRcdFx0XHRuYXZpZ2F0aW9uSW5kZXg6IChjdXJyZW50X25hdmlnYXRpb25faW5kZXggKz0gY2hhbmdlKSxcblx0XHRcdFx0c3RhdGU6IHNlcmlhbGl6ZWRfc3RhdGUsXG5cdFx0XHRcdHBlcnNpc3RTdGF0ZTogcGVyc2lzdF9zdGF0ZSxcblx0XHRcdFx0cmVzZXRJbmRleDogY3VycmVudF9yZXNldF9pbmRleFxuXHRcdFx0fSlcblx0XHR9O1xuXG5cdFx0Y29uc3QgZm4gPSByZXBsYWNlX3N0YXRlID8gaGlzdG9yeS5yZXBsYWNlU3RhdGUgOiBoaXN0b3J5LnB1c2hTdGF0ZTtcblx0XHRmbi5jYWxsKGhpc3RvcnksIGVudHJ5LCAnJywgdXJsKTtcblx0XHRzZXRfaGlzdG9yeV9vcHRpb25zKGN1cnJlbnRfaGlzdG9yeV9pbmRleCwgZW50cnlbSElTVE9SWV9NRVRBREFUQV9LRVldKTtcblxuXHRcdGlmICghcmVwbGFjZV9zdGF0ZSkge1xuXHRcdFx0Y2xlYXJfb253YXJkX2hpc3RvcnkoY3VycmVudF9oaXN0b3J5X2luZGV4LCBjdXJyZW50X25hdmlnYXRpb25faW5kZXgpO1xuXHRcdH1cblx0fVxuXG5cdC8vIGFsc28gY29tcGFyZSBpZHMgdG8gYXZvaWQgdXNpbmcgd3JvbmcgZm9yayAoZS5nLiBhIG5ldyBvbmUgY291bGQndmUgYmVlbiBhZGRlZCB3aGlsZSBuYXZpZ2F0aW5nKVxuXHRjb25zdCBsb2FkX2NhY2hlX2ZvcmsgPSBpbnRlbnQgJiYgbG9hZF9jYWNoZT8uaWQgPT09IGludGVudC5pZCA/IGxvYWRfY2FjaGUuZm9yayA6IG51bGw7XG5cdC8vIHJlc2V0IHByZWxvYWQgc3luY2hyb25vdXNseSBhZnRlciB0aGUgaGlzdG9yeSBzdGF0ZSBoYXMgYmVlbiBzZXQgdG8gYXZvaWQgcmFjZSBjb25kaXRpb25zXG5cdGlmIChsb2FkX2NhY2hlPy5mb3JrICYmICFsb2FkX2NhY2hlX2ZvcmspIHtcblx0XHQvLyBkaXNjYXJkIGZvcmsgb2YgZGlmZmVyZW50IHJvdXRlXG5cdFx0ZGlzY2FyZF9sb2FkX2NhY2hlKCk7XG5cdH0gZWxzZSB7XG5cdFx0bG9hZF9jYWNoZSA9IG51bGw7XG5cdFx0Y3VycmVudF9hID0geyBlbGVtZW50OiB1bmRlZmluZWQsIGhyZWY6IHVuZGVmaW5lZCB9O1xuXHR9XG5cblx0bmF2aWdhdGlvbl9yZXN1bHQucHJvcHMucGFnZS5zdGF0ZSA9IHN0YXRlO1xuXHRuYXZpZ2F0aW9uX3Jlc3VsdC5wcm9wcy5wYWdlLnNoYWxsb3cgPSBwb3BwZWQ/LnNoYWxsb3cgPz8gbnVsbDtcblxuXHQvKipcblx0ICogQHR5cGUge1Byb21pc2U8dm9pZD4gfCB1bmRlZmluZWR9XG5cdCAqL1xuXHRsZXQgY29tbWl0X3Byb21pc2U7XG5cdGlmIChzdGFydGVkKSB7XG5cdFx0YXdhaXQgcnVuX29uX25hdmlnYXRlX2NhbGxiYWNrcygvKiogQHR5cGUge09uTmF2aWdhdGV9ICovIChuYXYubmF2aWdhdGlvbikpO1xuXG5cdFx0Ly8gVHlwZS1jYXN0cyBhcmUgc2F2ZSBiZWNhdXNlIHdlIGtub3cgdGhpcyByZXNvbHZlZCBhIHByb3BlciBTdmVsdGVLaXQgcm91dGVcblx0XHRjb25zdCB0YXJnZXQgPSBwb3BwZWQ/LnNoYWxsb3dcblx0XHRcdD8ge1xuXHRcdFx0XHRcdHBhcmFtczogbmF2aWdhdGlvbl9yZXN1bHQuc3RhdGUucGFyYW1zLFxuXHRcdFx0XHRcdHJvdXRlOiB7IGlkOiBuYXZpZ2F0aW9uX3Jlc3VsdC5zdGF0ZS5yb3V0ZT8uaWQgPz8gbnVsbCB9LFxuXHRcdFx0XHRcdHVybDogbmF2aWdhdGlvbl9yZXN1bHQuc3RhdGUudXJsXG5cdFx0XHRcdH1cblx0XHRcdDogLyoqIEB0eXBlIHtOYXZpZ2F0aW9uVGFyZ2V0fSAqLyAobmF2Lm5hdmlnYXRpb24udG8pO1xuXHRcdGN1cnJlbnQgPSB7XG5cdFx0XHQuLi5uYXZpZ2F0aW9uX3Jlc3VsdC5zdGF0ZSxcblx0XHRcdG5hdjoge1xuXHRcdFx0XHRwYXJhbXM6IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gKi8gKHRhcmdldC5wYXJhbXMpLFxuXHRcdFx0XHRyb3V0ZTogdGFyZ2V0LnJvdXRlLFxuXHRcdFx0XHR1cmw6IHRhcmdldC51cmxcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gcmVzZXQgdXJsIGJlZm9yZSB1cGRhdGluZyBwYWdlIHN0b3JlXG5cdFx0aWYgKG5hdmlnYXRpb25fcmVzdWx0LnByb3BzLnBhZ2UpIHtcblx0XHRcdG5hdmlnYXRpb25fcmVzdWx0LnByb3BzLnBhZ2UudXJsID0gdXJsO1xuXHRcdH1cblxuXHRcdC8vIFJlbW92ZSBmb2N1cyBiZWZvcmUgdXBkYXRpbmcgdGhlIGNvbXBvbmVudCB0cmVlLCBzbyB0aGF0IGJsdXIvZm9jdXNvdXRcblx0XHQvLyBoYW5kbGVycyBmaXJlIHdoaWxlIHRoZSBvbGQgY29tcG9uZW50J3MgZGF0YSBpcyBzdGlsbCB2YWxpZCAoIzE0NTc1KVxuXHRcdGJsdXJfYWN0aXZlX2VsZW1lbnQocmVzZXQpO1xuXG5cdFx0Y29uc3QgZm9yayA9IGxvYWRfY2FjaGVfZm9yayAmJiAoYXdhaXQgbG9hZF9jYWNoZV9mb3JrKTtcblxuXHRcdGlmIChmb3JrKSB7XG5cdFx0XHRjb21taXRfcHJvbWlzZSA9IGZvcmsuY29tbWl0KCk7XG5cdFx0XHQvLyBgZm9yay5jb21taXQoKWAgYXBwbGllcyB0aGUgcHJlbG9hZGVkIHN0YXRlIHN5bmNocm9ub3VzbHkgYmVmb3JlIHRoZVxuXHRcdFx0Ly8gZmlyc3QgYGF3YWl0YCwgc28gcmVzZXQgYW55IHByZXZpb3VzbHktZmFpbGVkIGJvdW5kYXJpZXMgbm93IHNvIHRoZVxuXHRcdFx0Ly8gc3RhbGUgYCtlcnJvci5zdmVsdGVgIGlzIHRvcm4gZG93bi4gU2VlIHN2ZWx0ZWpzL2tpdCMxNTY5NC5cblx0XHRcdGZvciAoY29uc3QgcmVzZXRfYm91bmRhcnkgb2YgcmVzZXR0ZXJzKSB7XG5cdFx0XHRcdHJlc2V0X2JvdW5kYXJ5KCk7XG5cdFx0XHR9XG5cdFx0XHRyZXNldHRlcnMuY2xlYXIoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXBwbHlfbmF2aWdhdGlvbl9yZXN1bHQobmF2aWdhdGlvbl9yZXN1bHQpO1xuXG5cdFx0XHQvLyBSZXNldCBib3VuZGFyaWVzIHRoYXQgZmFpbGVkIG9uIGEgcHJldmlvdXMgbmF2aWdhdGlvbiBvbmNlIHRoZSBuZXcgcHJvcHMgaGF2ZVxuXHRcdFx0Ly8gZmx1c2hlZCAoc2VlIHN2ZWx0ZWpzL2tpdCMxNTY5NCkuIFJlc2V0dGluZyBmaXJzdCByZS1yZW5kZXJzIHRoZSBvbGQgY29udGVudCBhdFxuXHRcdFx0Ly8gYSBkZXB0aCB0aGUgbmV3IHRyZWUgbWF5IG5vdCBoYXZlLCBzdHJhbmRpbmcgdGhlIHN0YWxlIGArZXJyb3Iuc3ZlbHRlYC5cblx0XHRcdGNvbW1pdF9wcm9taXNlID0gc2V0dGxlZCgpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRmb3IgKGNvbnN0IHJlc2V0X2JvdW5kYXJ5IG9mIHJlc2V0dGVycykge1xuXHRcdFx0XHRcdHJlc2V0X2JvdW5kYXJ5KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzZXR0ZXJzLmNsZWFyKCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRoYXNfbmF2aWdhdGVkID0gdHJ1ZTtcblx0fSBlbHNlIHtcblx0XHRhd2FpdCBpbml0aWFsaXplKG5hdmlnYXRpb25fcmVzdWx0LCB0YXJnZXQsIGZhbHNlKTtcblx0fVxuXG5cdGNvbnN0IGZpbmlzaGVkID0gYXdhaXQgZmluaXNoX25hdmlnYXRpb24oXG5cdFx0bmF2LFxuXHRcdG5hdl90b2tlbixcblx0XHR1cmwsXG5cdFx0cG9wcGVkPy5zY3JvbGwsXG5cdFx0cmVzZXQsXG5cdFx0Y29tbWl0X3Byb21pc2Vcblx0KTtcblx0aWYgKCFmaW5pc2hlZCkgcmV0dXJuO1xuXG5cdGlmICh0eXBlID09PSAncG9wc3RhdGUnKSB7XG5cdFx0cmVzdG9yZV9zbmFwc2hvdChjdXJyZW50X25hdmlnYXRpb25faW5kZXgpO1xuXHR9XG5cdC8vIG5ldyBhbmQgcmVwbGFjZWQgZW50cmllcyBoYXZlIG5vIHN0b3JlZCB2YWx1ZXMsIHNvIHRoaXMgb25seSByZXNldHMgdGhlcmVcblx0cmVzdG9yZV9uYXZpZ2F0aW9uX3NuYXBzaG90KGN1cnJlbnRfaGlzdG9yeV9pbmRleCwgcHJldmlvdXNfc25hcHNob3RfcmVnaXN0cmF0aW9ucyk7XG5cblx0c2V0X25hdmlnYXRpb24obnVsbCk7XG5cblx0dXBkYXRpbmcgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBSdW5zIHRoZSBgb25OYXZpZ2F0ZWAgY2FsbGJhY2tzIGFuZCByZWdpc3RlcnMgYW55IGZ1bmN0aW9ucyB0aGV5IHJldHVybiB0byBydW4gYWZ0ZXIgdGhlIG5hdmlnYXRpb25cbiAqIEBwYXJhbSB7T25OYXZpZ2F0ZX0gbmF2aWdhdGlvblxuICovXG5hc3luYyBmdW5jdGlvbiBydW5fb25fbmF2aWdhdGVfY2FsbGJhY2tzKG5hdmlnYXRpb24pIHtcblx0Y29uc3QgYWZ0ZXJfbmF2aWdhdGUgPSAoXG5cdFx0YXdhaXQgUHJvbWlzZS5hbGwoXG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2F3YWl0LXRoZW5hYmxlIC0tIHdlIG5lZWQgdG8gYXdhaXQgYmVjYXVzZSB0aGV5IGNhbiBiZSBhc3luY2hyb25vdXNcblx0XHRcdEFycmF5LmZyb20ob25fbmF2aWdhdGVfY2FsbGJhY2tzLCAoZm4pID0+IGZuKG5hdmlnYXRpb24pKVxuXHRcdClcblx0KS5maWx0ZXIoLyoqIEByZXR1cm5zIHt2YWx1ZSBpcyAoKSA9PiB2b2lkfSAqLyAodmFsdWUpID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyk7XG5cblx0aWYgKGFmdGVyX25hdmlnYXRlLmxlbmd0aCA+IDApIHtcblx0XHRmdW5jdGlvbiBjbGVhbnVwKCkge1xuXHRcdFx0YWZ0ZXJfbmF2aWdhdGUuZm9yRWFjaCgoZm4pID0+IGFmdGVyX25hdmlnYXRlX2NhbGxiYWNrcy5kZWxldGUoZm4pKTtcblx0XHR9XG5cblx0XHRhZnRlcl9uYXZpZ2F0ZS5wdXNoKGNsZWFudXApO1xuXHRcdGFmdGVyX25hdmlnYXRlLmZvckVhY2goKGZuKSA9PiBhZnRlcl9uYXZpZ2F0ZV9jYWxsYmFja3MuYWRkKGZuKSk7XG5cdH1cbn1cblxuLyoqXG4gKiBTZXR0bGVzIHRoZSBuYXZpZ2F0aW9uIG9uY2UgYHVwZGF0ZWRgIHJlc29sdmVzLiBSZXR1cm5zIGBmYWxzZWAgaWYgYSBuZXdlciBuYXZpZ2F0aW9uXG4gKiBzdXBlcnNlZGVkIGl0IGluIHRoZSBtZWFudGltZSwgaW4gd2hpY2ggY2FzZSB0aGUgY2FsbGVyIG11c3Qgc3RvcFxuICogQHBhcmFtIHtSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVfbmF2aWdhdGlvbj59IG5hdlxuICogQHBhcmFtIHt7fX0gbmF2X3Rva2VuXG4gKiBAcGFyYW0ge1VSTH0gdXJsXG4gKiBAcGFyYW0ge3sgeDogbnVtYmVyLCB5OiBudW1iZXIgfSB8IG51bGwgfCB1bmRlZmluZWR9IHBvcHBlZF9zY3JvbGwgdGhlIHNjcm9sbCBwb3NpdGlvbiB0byByZXN0b3JlIGZvciBwb3BzdGF0ZSBuYXZpZ2F0aW9uc1xuICogQHBhcmFtIHtib29sZWFufSByZXNldFxuICogQHBhcmFtIHtQcm9taXNlPHZvaWQ+IHwgdW5kZWZpbmVkfSB1cGRhdGVkXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZpbmlzaF9uYXZpZ2F0aW9uKG5hdiwgbmF2X3Rva2VuLCB1cmwsIHBvcHBlZF9zY3JvbGwsIHJlc2V0LCB1cGRhdGVkKSB7XG5cdGF3YWl0IHVwZGF0ZWQ7XG5cblx0aWYgKG5hdmlnYXRpb25fdG9rZW4gIT09IG5hdl90b2tlbikge1xuXHRcdG5hdi5yZWplY3QobmV3IEVycm9yKCduYXZpZ2F0aW9uIGFib3J0ZWQnKSk7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cmVzdG9yZV9zY3JvbGwodXJsLCByZXNldCwgcG9wcGVkX3Njcm9sbCk7XG5cdGlmIChyZXNldCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBkb2N1bWVudC5ib2R5KSB7XG5cdFx0cmVzZXRfZm9jdXModXJsKTtcblx0fVxuXG5cdGlzX25hdmlnYXRpbmcgPSBmYWxzZTtcblxuXHRuYXYuZnVsZmlsKHVuZGVmaW5lZCk7XG5cblx0Ly8gVXBkYXRlIHRvLnNjcm9sbCB0byB0aGUgYWN0dWFsIHNjcm9sbCBwb3NpdGlvbiBhZnRlciBuYXZpZ2F0aW9uIGNvbXBsZXRlZFxuXHRpZiAobmF2Lm5hdmlnYXRpb24udG8pIHtcblx0XHRuYXYubmF2aWdhdGlvbi50by5zY3JvbGwgPSBzY3JvbGxfc3RhdGUoKTtcblx0fVxuXG5cdGFmdGVyX25hdmlnYXRlX2NhbGxiYWNrcy5mb3JFYWNoKChmbikgPT4gZm4oLyoqIEB0eXBlIHtBZnRlck5hdmlnYXRlfSAqLyAobmF2Lm5hdmlnYXRpb24pKSk7XG5cblx0cmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogRG9lcyBhIGZ1bGwgcGFnZSByZWxvYWQgaWYgaXQgd291bGRuJ3QgcmVzdWx0IGluIGFuIGVuZGxlc3MgbG9vcCBpbiB0aGUgU1BBIGNhc2VcbiAqIEBwYXJhbSB7VVJMfSB1cmxcbiAqIEBwYXJhbSB7eyBpZDogc3RyaW5nIHwgbnVsbCB9fSByb3V0ZVxuICogQHBhcmFtIHtBcHAuRXJyb3J9IGVycm9yXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXBsYWNlX3N0YXRlXVxuICogQHJldHVybnMge1Byb21pc2U8aW1wb3J0KCcuL3R5cGVzLmpzJykuTmF2aWdhdGlvbkZpbmlzaGVkIHwgdW5kZWZpbmVkPn1cbiAqL1xuYXN5bmMgZnVuY3Rpb24gc2VydmVyX2ZhbGxiYWNrKHVybCwgcm91dGUsIGVycm9yLCByZXBsYWNlX3N0YXRlKSB7XG5cdGlmICh1cmwub3JpZ2luID09PSBvcmlnaW4gJiYgdXJsLnBhdGhuYW1lID09PSBsb2NhdGlvbi5wYXRobmFtZSAmJiAhaHlkcmF0ZWQpIHtcblx0XHQvLyBXZSB3b3VsZCByZWxvYWQgdGhlIHNhbWUgcGFnZSB3ZSdyZSBjdXJyZW50bHkgb24sIHdoaWNoIGlzbid0IGh5ZHJhdGVkLFxuXHRcdC8vIHdoaWNoIG1lYW5zIG5vIFNTUiwgd2hpY2ggbWVhbnMgd2Ugd291bGQgZW5kIHVwIGluIGFuIGVuZGxlc3MgbG9vcFxuXHRcdHJldHVybiBhd2FpdCBsb2FkX3Jvb3RfZXJyb3JfcGFnZSh7XG5cdFx0XHRlcnJvcixcblx0XHRcdHVybCxcblx0XHRcdHJvdXRlXG5cdFx0fSk7XG5cdH1cblxuXHRpZiAoREVWICYmIGVycm9yLnN0YXR1cyAhPT0gNDA0KSB7XG5cdFx0dy5mdWxsX3JlbG9hZF9hZnRlcl9lcnJvcigpO1xuXG5cdFx0ZGVidWdnZXI7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblx0fVxuXG5cdHJldHVybiBhd2FpdCBuYXRpdmVfbmF2aWdhdGlvbih1cmwsIHJlcGxhY2Vfc3RhdGUpO1xufVxuXG5pZiAoaW1wb3J0Lm1ldGEuaG90KSB7XG5cdGltcG9ydC5tZXRhLmhvdC5vbigndml0ZTpiZWZvcmVVcGRhdGUnLCAoKSA9PiB7XG5cdFx0aWYgKGN1cnJlbnQuZXJyb3IpIGxvY2F0aW9uLnJlbG9hZCgpO1xuXHR9KTtcbn1cblxuLyoqIEB0eXBlZGVmIHsodHlwZW9mIFBSRUxPQURfUFJJT1JJVElFUylbJ2hvdmVyJ10gfCAodHlwZW9mIFBSRUxPQURfUFJJT1JJVElFUylbJ3RhcCddfSBQcmVsb2FkRGF0YVByaW9yaXR5ICovXG5cbi8qKlxuICogVGhlIGFuY2hvciBlbGVtZW50IHdob3NlIGhyZWYgaXMgYmVpbmcgcHJlbG9hZGVkLiBJdCBpcyByZXNldCBhZnRlciBuYXZpZ2F0aW9uXG4gKiBvciBjaGFuZ2VzIHdoZW4gYSBkaWZmZXJlbnQgYW5jaG9yIGVsZW1lbnQgaXMgYmVpbmcgcHJlbG9hZGVkLlxuICogQHR5cGUge3sgZWxlbWVudDogRWxlbWVudCB8IFNWR0FFbGVtZW50IHwgdW5kZWZpbmVkOyBocmVmOiBzdHJpbmcgfCBTVkdBbmltYXRlZFN0cmluZyB8IHVuZGVmaW5lZCB9fVxuICovXG5sZXQgY3VycmVudF9hID0geyBlbGVtZW50OiB1bmRlZmluZWQsIGhyZWY6IHVuZGVmaW5lZCB9O1xuXG5mdW5jdGlvbiBzZXR1cF9wcmVsb2FkKCkge1xuXHQvKiogQHR5cGUge05vZGVKUy5UaW1lb3V0fSAqL1xuXHRsZXQgbW91c2Vtb3ZlX3RpbWVvdXQ7XG5cdC8qKiBAdHlwZSB7SFRNTEFuY2hvckVsZW1lbnQgfCBTVkdBRWxlbWVudCB8IHVuZGVmaW5lZH0gKi9cblx0bGV0IGhvdmVyZWRfYTtcblx0LyoqIEB0eXBlIHtQcmVsb2FkRGF0YVByaW9yaXR5fSAqL1xuXHRsZXQgY3VycmVudF9wcmlvcml0eTtcblxuXHRmdW5jdGlvbiBjbGVhcl9ob3Zlcl9wcmVsb2FkKCkge1xuXHRcdGNsZWFyVGltZW91dChtb3VzZW1vdmVfdGltZW91dCk7XG5cdFx0aG92ZXJlZF9hPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBzdGFydF9ob3Zlcl9wcmVsb2FkKTtcblx0XHRob3ZlcmVkX2E/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCBjbGVhcl9ob3Zlcl9wcmVsb2FkKTtcblx0XHRob3ZlcmVkX2EgPSB1bmRlZmluZWQ7XG5cdH1cblxuXHRmdW5jdGlvbiBzdGFydF9ob3Zlcl9wcmVsb2FkKCkge1xuXHRcdGNsZWFyVGltZW91dChtb3VzZW1vdmVfdGltZW91dCk7XG5cdFx0bW91c2Vtb3ZlX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGlmICghaG92ZXJlZF9hKSByZXR1cm47XG5cdFx0XHR2b2lkIHByZWxvYWQoaG92ZXJlZF9hLCBQUkVMT0FEX1BSSU9SSVRJRVMuaG92ZXIpO1xuXHRcdH0sIDIwKTtcblx0fVxuXG5cdC8vIFVzZSBtb3VzZW92ZXIgaW5pdGlhbGx5IGluc3RlYWQgb2YgbW91c2Vtb3ZlIHRvIGF2b2lkIGNsdXR0ZXJpbmcgdGhlIGV2ZW50IHF1ZXVlXG5cdGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCAoZXZlbnQpID0+IHtcblx0XHRpZiAoIShldmVudC50YXJnZXQgaW5zdGFuY2VvZiBFbGVtZW50KSkgcmV0dXJuO1xuXG5cdFx0Y29uc3QgYSA9IGZpbmRfYW5jaG9yKGV2ZW50LnRhcmdldCwgY29udGFpbmVyKTtcblx0XHRpZiAoIWEgfHwgYSA9PT0gaG92ZXJlZF9hKSByZXR1cm47XG5cblx0XHRjbGVhcl9ob3Zlcl9wcmVsb2FkKCk7XG5cdFx0aG92ZXJlZF9hID0gYTtcblxuXHRcdGNvbnN0IG9wdGlvbnMgPSBnZXRfcm91dGVyX29wdGlvbnMoYSk7XG5cblx0XHRpZiAoXG5cdFx0XHRvcHRpb25zLnByZWxvYWRfY29kZSA8IFBSRUxPQURfUFJJT1JJVElFUy5ob3ZlciAmJlxuXHRcdFx0b3B0aW9ucy5wcmVsb2FkX2RhdGEgPCBQUkVMT0FEX1BSSU9SSVRJRVMuaG92ZXJcblx0XHQpIHtcblx0XHRcdC8vIGRvbid0IGFkZCBldmVudCBsaXN0ZW5lcnMgaWYgbm8gcHJlbG9hZGluZyB3aWxsIGhhcHBlblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEluc3RlYWQgb2YganVzdCBwcmVsb2FkaW5nIHJpZ2h0IGF3YXksIHdlIHN0YXJ0IGEgbW91c2Vtb3ZlIGxpc3RlbmVyIHRvIGltcGxlbWVudFxuXHRcdC8vIFwibW91c2UgY29tZXMgdG8gYSByZXN0XCIgYmVoYXZpb3IuIFRoaXMgYXZvaWQgZmFsc2UgcG9zaXRpdmVzIHdoZW4geW91IGp1c3QgbW92ZVxuXHRcdC8vIHlvdXIgbW91c2UgYWNyb3NzIHRoZSBzY3JlZW4gYW5kIGhhcHBlbiB0byBwYXNzIG92ZXIgYSBsaW5rLlxuXHRcdGEuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgc3RhcnRfaG92ZXJfcHJlbG9hZCk7XG5cdFx0YS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgY2xlYXJfaG92ZXJfcHJlbG9hZCwgeyBvbmNlOiB0cnVlIH0pO1xuXG5cdFx0c3RhcnRfaG92ZXJfcHJlbG9hZCgpO1xuXHR9KTtcblxuXHQvKiogQHBhcmFtIHtFdmVudH0gZXZlbnQgKi9cblx0ZnVuY3Rpb24gdGFwKGV2ZW50KSB7XG5cdFx0aWYgKGV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHJldHVybjtcblxuXHRcdGNvbnN0IGEgPSBmaW5kX2FuY2hvcigvKiogQHR5cGUge0VsZW1lbnR9ICovIChldmVudC5jb21wb3NlZFBhdGgoKVswXSksIGNvbnRhaW5lcik7XG5cdFx0aWYgKCFhKSByZXR1cm47XG5cblx0XHR2b2lkIHByZWxvYWQoYSwgUFJFTE9BRF9QUklPUklUSUVTLnRhcCk7XG5cdH1cblxuXHRjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGFwKTtcblx0Y29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0YXAsIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcblxuXHRjb25zdCBvYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihcblx0XHQoZW50cmllcykgPT4ge1xuXHRcdFx0Zm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG5cdFx0XHRcdGlmIChlbnRyeS5pc0ludGVyc2VjdGluZykge1xuXHRcdFx0XHRcdHZvaWQgX3ByZWxvYWRfY29kZShuZXcgVVJMKC8qKiBAdHlwZSB7SFRNTEFuY2hvckVsZW1lbnR9ICovIChlbnRyeS50YXJnZXQpLmhyZWYpKTtcblx0XHRcdFx0XHRvYnNlcnZlci51bm9ic2VydmUoZW50cnkudGFyZ2V0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0eyB0aHJlc2hvbGQ6IDAgfVxuXHQpO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0hUTUxBbmNob3JFbGVtZW50IHwgU1ZHQUVsZW1lbnR9IGFcblx0ICogQHBhcmFtIHtQcmVsb2FkRGF0YVByaW9yaXR5fSBwcmlvcml0eVxuXHQgKi9cblx0YXN5bmMgZnVuY3Rpb24gcHJlbG9hZChhLCBwcmlvcml0eSkge1xuXHRcdC8vIHdlIGRvbid0IHdhbnQgdG8gcHJlbG9hZCBkYXRhIGFnYWluIGlmIHRoZSB1c2VyIGhhcyBhbHJlYWR5IGhvdmVyZWQvdGFwcGVkXG5cdFx0Y29uc3QgaW50ZXJhY3RlZCA9XG5cdFx0XHRhID09PSBjdXJyZW50X2EuZWxlbWVudCAmJiBhPy5ocmVmID09PSBjdXJyZW50X2EuaHJlZiAmJiBwcmlvcml0eSA+PSBjdXJyZW50X3ByaW9yaXR5O1xuXHRcdGlmICghYSB8fCBpbnRlcmFjdGVkKSByZXR1cm47XG5cblx0XHRjb25zdCB7IHVybCwgZXh0ZXJuYWwsIGRvd25sb2FkIH0gPSBnZXRfbGlua19pbmZvKGEsIGJhc2UsIGFwcC5oYXNoKTtcblx0XHRpZiAoZXh0ZXJuYWwgfHwgZG93bmxvYWQpIHJldHVybjtcblxuXHRcdGNvbnN0IG9wdGlvbnMgPSBnZXRfcm91dGVyX29wdGlvbnMoYSk7XG5cblx0XHQvLyB3ZSBkb24ndCB3YW50IHRvIHByZWxvYWQgZGF0YSBmb3IgYSBwYWdlIHdlJ3JlIGFscmVhZHkgb25cblx0XHRjb25zdCBzYW1lX3VybCA9IHVybCAmJiBnZXRfcGFnZV9rZXkoY3VycmVudC51cmwpID09PSBnZXRfcGFnZV9rZXkodXJsKTtcblx0XHRpZiAob3B0aW9ucy5yZWxvYWQgfHwgc2FtZV91cmwpIHJldHVybjtcblxuXHRcdGlmIChwcmlvcml0eSA8PSBvcHRpb25zLnByZWxvYWRfZGF0YSkge1xuXHRcdFx0Y3VycmVudF9hID0geyBlbGVtZW50OiBhLCBocmVmOiBhLmhyZWYgfTtcblx0XHRcdC8vIHdlIGRvbid0IHdhbnQgdG8gcHJlbG9hZCBkYXRhIGFnYWluIG9uIHRhcCBpZiB3ZSd2ZSBhbHJlYWR5IHByZWxvYWRlZCBpdCBvbiBob3ZlclxuXHRcdFx0Y3VycmVudF9wcmlvcml0eSA9IFBSRUxPQURfUFJJT1JJVElFUy50YXA7XG5cblx0XHRcdGNvbnN0IGludGVudCA9IGF3YWl0IGdldF9uYXZpZ2F0aW9uX2ludGVudCh1cmwsIGZhbHNlKTtcblx0XHRcdGlmICghaW50ZW50KSByZXR1cm47XG5cblx0XHRcdGlmIChERVYpIHtcblx0XHRcdFx0dm9pZCBfcHJlbG9hZF9kYXRhKGludGVudCkuY2F0Y2goKGVycm9yKSA9PiB7XG5cdFx0XHRcdFx0dy5wcmVsb2FkX2RhdGFfZmFpbGVkKHsgcGF0aDogaW50ZW50LnVybC5wYXRobmFtZSwgbWVzc2FnZTogZXJyb3IubWVzc2FnZSB9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2b2lkIF9wcmVsb2FkX2RhdGEoaW50ZW50KS5jYXRjaChub29wKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHByaW9yaXR5IDw9IG9wdGlvbnMucHJlbG9hZF9jb2RlKSB7XG5cdFx0XHRjdXJyZW50X2EgPSB7IGVsZW1lbnQ6IGEsIGhyZWY6IGEuaHJlZiB9O1xuXHRcdFx0Y3VycmVudF9wcmlvcml0eSA9IHByaW9yaXR5O1xuXHRcdFx0dm9pZCBfcHJlbG9hZF9jb2RlKC8qKiBAdHlwZSB7VVJMfSAqLyAodXJsKSk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gYWZ0ZXJfbmF2aWdhdGUoKSB7XG5cdFx0b2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuXG5cdFx0Zm9yIChjb25zdCBhIG9mIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdhJykpIHtcblx0XHRcdGNvbnN0IHsgdXJsLCBleHRlcm5hbCwgZG93bmxvYWQgfSA9IGdldF9saW5rX2luZm8oYSwgYmFzZSwgYXBwLmhhc2gpO1xuXHRcdFx0aWYgKGV4dGVybmFsIHx8IGRvd25sb2FkKSBjb250aW51ZTtcblxuXHRcdFx0Y29uc3Qgb3B0aW9ucyA9IGdldF9yb3V0ZXJfb3B0aW9ucyhhKTtcblx0XHRcdGlmIChvcHRpb25zLnJlbG9hZCkgY29udGludWU7XG5cblx0XHRcdGlmIChvcHRpb25zLnByZWxvYWRfY29kZSA9PT0gUFJFTE9BRF9QUklPUklUSUVTLnZpZXdwb3J0KSB7XG5cdFx0XHRcdG9ic2VydmVyLm9ic2VydmUoYSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChvcHRpb25zLnByZWxvYWRfY29kZSA9PT0gUFJFTE9BRF9QUklPUklUSUVTLmVhZ2VyKSB7XG5cdFx0XHRcdHZvaWQgX3ByZWxvYWRfY29kZSgvKiogQHR5cGUge1VSTH0gKi8gKHVybCkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGFmdGVyX25hdmlnYXRlX2NhbGxiYWNrcy5hZGQoYWZ0ZXJfbmF2aWdhdGUpO1xuXHRhZnRlcl9uYXZpZ2F0ZSgpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gZXJyb3JcbiAqIEBwYXJhbSB7TmF2aWdhdGlvbkV2ZW50fSBldmVudFxuICogQHJldHVybnMge1Byb21pc2U8QXBwLkVycm9yPn1cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZV9lcnJvcihlcnJvciwgZXZlbnQpIHtcblx0aWYgKGVycm9yIGluc3RhbmNlb2YgSGFuZGxlZEh0dHBFcnJvcikge1xuXHRcdHJldHVybiBlcnJvci5ib2R5O1xuXHR9XG5cblx0LyoqIEB0eXBlIHtpbXBvcnQoJ0BzdmVsdGVqcy9raXQvaG9va3MnKS5DbGllbnRDYXVnaHRFcnJvcn0gKi9cblx0bGV0IGNhdWdodDtcblxuXHRpZiAoZXJyb3IgaW5zdGFuY2VvZiBIdHRwRXJyb3IpIHtcblx0XHRjYXVnaHQgPSB7IGtpbmQ6ICdhcHAnLCBlcnJvcjogZXJyb3IuYm9keSB9O1xuXHR9IGVsc2UgaWYgKGVycm9yIGluc3RhbmNlb2YgU3ZlbHRlS2l0RXJyb3IpIHtcblx0XHRjYXVnaHQgPSB7IGtpbmQ6ICdmcmFtZXdvcmsnLCBlcnJvcjogeyBzdGF0dXM6IGVycm9yLnN0YXR1cywgbWVzc2FnZTogZXJyb3IudGV4dCB9IH07XG5cdH0gZWxzZSB7XG5cdFx0Y2F1Z2h0ID0geyBraW5kOiAndW5rbm93bicsIGVycm9yIH07XG5cdH1cblxuXHRpZiAoREVWICYmIGNhdWdodC5raW5kICE9PSAnYXBwJykge1xuXHRcdGVycm9yZWQgPSB0cnVlO1xuXHRcdHcuaG1yX3JlbG9hZF9hZnRlcl9lcnJvcigpO1xuXHR9XG5cblx0Y29uc3QgZmFsbGJhY2sgPVxuXHRcdGNhdWdodC5raW5kID09PSAndW5rbm93bicgPyB7IHN0YXR1czogNTAwLCBtZXNzYWdlOiAnSW50ZXJuYWwgRXJyb3InIH0gOiBjYXVnaHQuZXJyb3I7XG5cblx0Y29uc3QgaW5wdXQgPSB7IC4uLmNhdWdodCwgZXZlbnQgfTtcblx0aWYgKERFVikgYWRkX2RlcHJlY2F0ZWRfaGFuZGxlX2Vycm9yX3Byb3BlcnRpZXMoaW5wdXQsIGZhbGxiYWNrKTtcblxuXHRjb25zdCBhcHBfZXJyb3IgPSBhd2FpdCBhcHAuaG9va3MuaGFuZGxlRXJyb3IoaW5wdXQpO1xuXG5cdC8vIHRoZSBob29rIHJldHVybnMgb25seSB0aGUgcHJvcGVydGllcyBpdCB3YW50cyB0byBvdmVycmlkZTsgYW55dGhpbmcgaXQgb21pdHNcblx0Ly8gKGluY2x1ZGluZyBieSByZXR1cm5pbmcgbm90aGluZyBhdCBhbGwpIGlzIGluaGVyaXRlZCBmcm9tIHRoZSBjYXVnaHQgZXJyb3Jcblx0cmV0dXJuIHsgLi4uZmFsbGJhY2ssIC4uLmFwcF9lcnJvciB9O1xufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7RnVuY3Rpb259IFRcbiAqIEBwYXJhbSB7U2V0PFQ+fSBjYWxsYmFja3NcbiAqIEBwYXJhbSB7VH0gY2FsbGJhY2tcbiAqL1xuZnVuY3Rpb24gYWRkX25hdmlnYXRpb25fY2FsbGJhY2soY2FsbGJhY2tzLCBjYWxsYmFjaykge1xuXHRvbk1vdW50KCgpID0+IHtcblx0XHRjYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcblxuXHRcdHJldHVybiAoKSA9PiB7XG5cdFx0XHRjYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcblx0XHR9O1xuXHR9KTtcbn1cblxuLyoqXG4gKiBBIGxpZmVjeWNsZSBmdW5jdGlvbiB0aGF0IHJ1bnMgdGhlIHN1cHBsaWVkIGBjYWxsYmFja2Agd2hlbiB0aGUgY3VycmVudCBjb21wb25lbnQgbW91bnRzLCBhbmQgYWxzbyB3aGVuZXZlciB3ZSBuYXZpZ2F0ZSB0byBhIFVSTC5cbiAqXG4gKiBgYWZ0ZXJOYXZpZ2F0ZWAgbXVzdCBiZSBjYWxsZWQgZHVyaW5nIGEgY29tcG9uZW50IGluaXRpYWxpemF0aW9uLiBJdCByZW1haW5zIGFjdGl2ZSBhcyBsb25nIGFzIHRoZSBjb21wb25lbnQgaXMgbW91bnRlZC5cbiAqIEBwYXJhbSB7KG5hdmlnYXRpb246IEFmdGVyTmF2aWdhdGUpID0+IHZvaWR9IGNhbGxiYWNrXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyTmF2aWdhdGUoY2FsbGJhY2spIHtcblx0YWRkX25hdmlnYXRpb25fY2FsbGJhY2soYWZ0ZXJfbmF2aWdhdGVfY2FsbGJhY2tzLCBjYWxsYmFjayk7XG59XG5cbi8qKlxuICogQSBuYXZpZ2F0aW9uIGludGVyY2VwdG9yIHRoYXQgdHJpZ2dlcnMgYmVmb3JlIHdlIG5hdmlnYXRlIHRvIGEgVVJMLCB3aGV0aGVyIGJ5IGNsaWNraW5nIGEgbGluaywgY2FsbGluZyBgZ290byguLi4pYCwgb3IgdXNpbmcgdGhlIGJyb3dzZXIgYmFjay9mb3J3YXJkIGNvbnRyb2xzLlxuICpcbiAqIENhbGxpbmcgYGNhbmNlbCgpYCB3aWxsIHByZXZlbnQgdGhlIG5hdmlnYXRpb24gZnJvbSBjb21wbGV0aW5nLiBJZiBgbmF2aWdhdGlvbi50eXBlID09PSAnbGVhdmUnYCDigJQgbWVhbmluZyB0aGUgdXNlciBpcyBuYXZpZ2F0aW5nIGF3YXkgZnJvbSB0aGUgYXBwIChvciBjbG9zaW5nIHRoZSB0YWIpIOKAlCBjYWxsaW5nIGBjYW5jZWxgIHdpbGwgdHJpZ2dlciB0aGUgbmF0aXZlIGJyb3dzZXIgdW5sb2FkIGNvbmZpcm1hdGlvbiBkaWFsb2cuIEluIHRoaXMgY2FzZSwgdGhlIG5hdmlnYXRpb24gbWF5IG9yIG1heSBub3QgYmUgY2FuY2VsbGVkIGRlcGVuZGluZyBvbiB0aGUgdXNlcidzIHJlc3BvbnNlLlxuICpcbiAqIFdoZW4gYSBuYXZpZ2F0aW9uIGlzbid0IHRvIGEgU3ZlbHRlS2l0LW93bmVkIHJvdXRlIChhbmQgdGhlcmVmb3JlIGNvbnRyb2xsZWQgYnkgU3ZlbHRlS2l0J3MgY2xpZW50LXNpZGUgcm91dGVyKSwgYG5hdmlnYXRpb24udG8ucm91dGUuaWRgIHdpbGwgYmUgYG51bGxgLlxuICpcbiAqIElmIHRoZSBuYXZpZ2F0aW9uIHdpbGwgKGlmIG5vdCBjYW5jZWxsZWQpIGNhdXNlIHRoZSBkb2N1bWVudCB0byB1bmxvYWQg4oCUIGluIG90aGVyIHdvcmRzIGAnbGVhdmUnYCBuYXZpZ2F0aW9ucyBhbmQgYCdsaW5rJ2AgbmF2aWdhdGlvbnMgd2hlcmUgYG5hdmlnYXRpb24udG8ucm91dGUgPT09IG51bGxgIOKAlCBgbmF2aWdhdGlvbi53aWxsVW5sb2FkYCBpcyBgdHJ1ZWAuXG4gKlxuICogYGJlZm9yZU5hdmlnYXRlYCBtdXN0IGJlIGNhbGxlZCBkdXJpbmcgYSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb24uIEl0IHJlbWFpbnMgYWN0aXZlIGFzIGxvbmcgYXMgdGhlIGNvbXBvbmVudCBpcyBtb3VudGVkLlxuICogQHBhcmFtIHsobmF2aWdhdGlvbjogQmVmb3JlTmF2aWdhdGUpID0+IHZvaWR9IGNhbGxiYWNrXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJlZm9yZU5hdmlnYXRlKGNhbGxiYWNrKSB7XG5cdGFkZF9uYXZpZ2F0aW9uX2NhbGxiYWNrKGJlZm9yZV9uYXZpZ2F0ZV9jYWxsYmFja3MsIGNhbGxiYWNrKTtcbn1cblxuLyoqXG4gKiBBIGxpZmVjeWNsZSBmdW5jdGlvbiB0aGF0IHJ1bnMgdGhlIHN1cHBsaWVkIGBjYWxsYmFja2AgaW1tZWRpYXRlbHkgYmVmb3JlIHdlIG5hdmlnYXRlIHRvIGEgbmV3IFVSTCBleGNlcHQgZHVyaW5nIGZ1bGwtcGFnZSBuYXZpZ2F0aW9ucy5cbiAqXG4gKiBJZiB5b3UgcmV0dXJuIGEgYFByb21pc2VgLCBTdmVsdGVLaXQgd2lsbCB3YWl0IGZvciBpdCB0byByZXNvbHZlIGJlZm9yZSBjb21wbGV0aW5nIHRoZSBuYXZpZ2F0aW9uLiBUaGlzIGFsbG93cyB5b3UgdG8g4oCUIGZvciBleGFtcGxlIOKAlCB1c2UgYGRvY3VtZW50LnN0YXJ0Vmlld1RyYW5zaXRpb25gLiBBdm9pZCBwcm9taXNlcyB0aGF0IGFyZSBzbG93IHRvIHJlc29sdmUsIHNpbmNlIG5hdmlnYXRpb24gd2lsbCBhcHBlYXIgc3RhbGxlZCB0byB0aGUgdXNlci5cbiAqXG4gKiBJZiBhIGZ1bmN0aW9uIChvciBhIGBQcm9taXNlYCB0aGF0IHJlc29sdmVzIHRvIGEgZnVuY3Rpb24pIGlzIHJldHVybmVkIGZyb20gdGhlIGNhbGxiYWNrLCBpdCB3aWxsIGJlIGNhbGxlZCBvbmNlIHRoZSBET00gaGFzIHVwZGF0ZWQuXG4gKlxuICogYG9uTmF2aWdhdGVgIG11c3QgYmUgY2FsbGVkIGR1cmluZyBhIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbi4gSXQgcmVtYWlucyBhY3RpdmUgYXMgbG9uZyBhcyB0aGUgY29tcG9uZW50IGlzIG1vdW50ZWQuXG4gKiBAcGFyYW0geyhuYXZpZ2F0aW9uOiBPbk5hdmlnYXRlKSA9PiBpbXBvcnQoJ3R5cGVzJykuTWF5YmVQcm9taXNlPCgoKSA9PiB2b2lkKSB8IHZvaWQ+fSBjYWxsYmFja1xuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvbk5hdmlnYXRlKGNhbGxiYWNrKSB7XG5cdGFkZF9uYXZpZ2F0aW9uX2NhbGxiYWNrKG9uX25hdmlnYXRlX2NhbGxiYWNrcywgY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIElmIGNhbGxlZCB3aGVuIHRoZSBwYWdlIGlzIGJlaW5nIHVwZGF0ZWQgZm9sbG93aW5nIGEgbmF2aWdhdGlvbiAoaW4gYG9uTW91bnRgIG9yIGBhZnRlck5hdmlnYXRlYCBvciBhbiBhY3Rpb24sIGZvciBleGFtcGxlKSwgdGhpcyBkaXNhYmxlcyBTdmVsdGVLaXQncyBidWlsdC1pbiBzY3JvbGwgaGFuZGxpbmcuXG4gKiBUaGlzIGlzIGdlbmVyYWxseSBkaXNjb3VyYWdlZCwgc2luY2UgaXQgYnJlYWtzIHVzZXIgZXhwZWN0YXRpb25zLlxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNhYmxlU2Nyb2xsSGFuZGxpbmcoKSB7XG5cdGlmIChERVYgJiYgc3RhcnRlZCAmJiAhdXBkYXRpbmcpIHtcblx0XHRlLnNjcm9sbF9oYW5kbGluZ19vdXRzaWRlX25hdmlnYXRpb24oKTtcblx0fVxuXG5cdGlmICh1cGRhdGluZyB8fCAhc3RhcnRlZCkge1xuXHRcdGRpc2FibGVfc2Nyb2xsX2hhbmRsaW5nKCk7XG5cdH1cbn1cblxubGV0IHdhcm5lZF9vbl9pbnZhbGlkYXRlX2FsbCA9IGZhbHNlO1xubGV0IHdhcm5lZF9vbl9yZXBsYWNlX3N0YXRlID0gZmFsc2U7XG5sZXQgd2FybmVkX29uX3B1c2hfc3RhdGUgPSBmYWxzZTtcbmxldCB3YXJuZWRfb25fcmVwbGFjZV9zdGF0ZV9mdW5jdGlvbiA9IGZhbHNlO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nIHwgVVJMfSB1cmxcbiAqIEBwYXJhbSB7J2dvdG8nIHwgJ3B1c2hTdGF0ZScgfCAncmVwbGFjZVN0YXRlJ30gY2FsbGVyXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVfaW50ZW50KHVybCwgY2FsbGVyKSB7XG5cdGNvbnN0IHJlc29sdmVkID0gbmV3IFVSTChyZXNvbHZlX3VybCh1cmwpKTtcblxuXHRpZiAocmVzb2x2ZWQub3JpZ2luICE9PSBvcmlnaW4pIHtcblx0XHRlLm5hdmlnYXRpb25fZXh0ZXJuYWxfdXJsKHsgY2FsbGVyLCB1cmw6IFN0cmluZyh1cmwpIH0pO1xuXHR9XG5cblx0Y29uc3QgaW50ZW50ID0gYXdhaXQgZ2V0X25hdmlnYXRpb25faW50ZW50KHJlc29sdmVkLCBmYWxzZSk7XG5cblx0aWYgKCFpbnRlbnQpIHtcblx0XHRlLm5hdmlnYXRpb25fcm91dGVfbWlzc2luZyh7IGNhbGxlciwgdXJsOiBTdHJpbmcodXJsKSB9KTtcblx0fVxuXG5cdHJldHVybiBpbnRlbnQ7XG59XG5cbi8qKlxuICogQWxsb3dzIHlvdSB0byBuYXZpZ2F0ZSBwcm9ncmFtbWF0aWNhbGx5IHRvIGEgZ2l2ZW4gcm91dGUsIHdpdGggY29udHJvbCBvdmVyIGRldGFpbHMgc3VjaCBhcyB3aGV0aGVyIHNjcm9sbCBhbmQgZm9jdXMgYXJlIHJlc2V0XG4gKiAoYXMgdGhleSB3b3VsZCBiZSB3aXRoIGEgcmVndWxhciBuYXZpZ2F0aW9uKSBvciBwcmVzZXJ2ZWQuXG4gKlxuICogUmV0dXJucyBhIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIFN2ZWx0ZUtpdCBuYXZpZ2F0ZXMgKG9yIGZhaWxzIHRvIG5hdmlnYXRlLCBpbiB3aGljaCBjYXNlIHRoZSBwcm9taXNlIHJlamVjdHMpIG9yIHRoZSBzdGF0ZSBjaGFuZ2UgaGFzIGJlZW4gYXBwbGllZC5cbiAqXG4gKiBgZ290b2AgaXMgaW50ZW5kZWQgZm9yIG5hdmlnYXRpb25zIHRvIHJvdXRlcyB0aGF0IGJlbG9uZyB0byB0aGUgYXBwLCBhbmQgd2lsbCByZWplY3QgaWYgYSByb3V0ZSBjYW5ub3QgYmUgcmVzb2x2ZWQuXG4gKiBGb3IgZXh0ZXJuYWwgVVJMcywgdXNlIGB3aW5kb3cubG9jYXRpb24gPSB1cmxgIHRvIHBlcmZvcm0gYSBmdWxsLXBhZ2UgbmF2aWdhdGlvbiBpbnN0ZWFkIG9mIGNhbGxpbmcgYGdvdG8odXJsKWAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmcgfCBVUkx9IHVybCBXaGVyZSB0byBuYXZpZ2F0ZSB0by4gTm90ZSB0aGF0IGlmIHlvdSd2ZSBzZXQgW2Bjb25maWcucGF0aHMuYmFzZWBdKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL2tpdC9Ac3ZlbHRlanMta2l0LXZpdGUjcGF0aHMpIGFuZCB0aGUgVVJMIGlzIHJvb3QtcmVsYXRpdmUsIHlvdSBuZWVkIHRvIHByZXBlbmQgdGhlIGJhc2UgcGF0aCBpZiB5b3Ugd2FudCB0byBuYXZpZ2F0ZSB3aXRoaW4gdGhlIGFwcC5cbiAqIEBwYXJhbSB7R290b09wdGlvbnN9IFtvcHRzXSBPcHRpb25zIHJlbGF0ZWQgdG8gdGhlIG5hdmlnYXRpb25cbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ290byh1cmwsIG9wdHMgPSB7fSkge1xuXHRpZiAoREVWKSB7XG5cdFx0aWYgKCdyZXBsYWNlU3RhdGUnIGluIG9wdHMgJiYgIXdhcm5lZF9vbl9yZXBsYWNlX3N0YXRlKSB7XG5cdFx0XHR3YXJuZWRfb25fcmVwbGFjZV9zdGF0ZSA9IHRydWU7XG5cdFx0XHR3LmdvdG9fcmVwbGFjZV9zdGF0ZV9kZXByZWNhdGVkKHsgdmFsdWU6IFN0cmluZyhvcHRzLnJlcGxhY2VTdGF0ZSkgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCdub1Njcm9sbCcgaW4gb3B0cyB8fCAna2VlcEZvY3VzJyBpbiBvcHRzKSB7XG5cdFx0XHRlLmdvdG9fb3B0aW9uc19yZW1vdmVkKCk7XG5cdFx0fVxuXHR9XG5cblx0Y29uc3QgcmVwbGFjZSA9IG9wdHMucmVwbGFjZSA/PyBvcHRzLnJlcGxhY2VTdGF0ZSA/PyBmYWxzZTtcblxuXHRjb25zdCBpbnRlbnQgPSBhd2FpdCByZXNvbHZlX2ludGVudCh1cmwsICdnb3RvJyk7XG5cblx0aWYgKG9wdHMuc2hhbGxvdykge1xuXHRcdHJldHVybiB1cGRhdGVfc3RhdGUoXG5cdFx0XHRpbnRlbnQsXG5cdFx0XHRvcHRzLnN0YXRlID8/IHt9LFxuXHRcdFx0e1xuXHRcdFx0XHRyZXBsYWNlLFxuXHRcdFx0XHRwZXJzaXN0X3N0YXRlOiBvcHRzLnBlcnNpc3RTdGF0ZSA/PyBmYWxzZSxcblx0XHRcdFx0cmVzZXQ6IG9wdHMucmVzZXQgPz8gZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHQnZ290bydcblx0XHQpO1xuXHR9XG5cblx0aWYgKERFViAmJiAnaW52YWxpZGF0ZUFsbCcgaW4gb3B0cyAmJiAhd2FybmVkX29uX2ludmFsaWRhdGVfYWxsKSB7XG5cdFx0d2FybmVkX29uX2ludmFsaWRhdGVfYWxsID0gdHJ1ZTtcblx0XHR3LmdvdG9faW52YWxpZGF0ZV9hbGxfZGVwcmVjYXRlZCh7IHZhbHVlOiBTdHJpbmcob3B0cy5pbnZhbGlkYXRlQWxsKSB9KTtcblx0fVxuXG5cdHJldHVybiBfZ290byhcblx0XHRpbnRlbnQudXJsLFxuXHRcdHsgLi4ub3B0cywgcmVwbGFjZSwgcmVmcmVzaEFsbDogb3B0cy5yZWZyZXNoQWxsID8/IG9wdHMuaW52YWxpZGF0ZUFsbCB9LFxuXHRcdDAsXG5cdFx0e30sXG5cdFx0aW50ZW50XG5cdCk7XG59XG5cbi8qKlxuICogQ2F1c2VzIGFueSBgbG9hZGAgZnVuY3Rpb25zIGJlbG9uZ2luZyB0byB0aGUgY3VycmVudGx5IGFjdGl2ZSBwYWdlIHRvIHJlLXJ1biBpZiB0aGV5IGRlcGVuZCBvbiB0aGUgYHVybGAgaW4gcXVlc3Rpb24sIHZpYSBgZmV0Y2hgIG9yIGBkZXBlbmRzYC4gUmV0dXJucyBhIGBQcm9taXNlYCB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHBhZ2UgaXMgc3Vic2VxdWVudGx5IHVwZGF0ZWQuXG4gKlxuICogSWYgdGhlIGFyZ3VtZW50IGlzIGdpdmVuIGFzIGEgYHN0cmluZ2Agb3IgYFVSTGAsIGl0IG11c3QgcmVzb2x2ZSB0byB0aGUgc2FtZSBVUkwgdGhhdCB3YXMgcGFzc2VkIHRvIGBmZXRjaGAgb3IgYGRlcGVuZHNgIChpbmNsdWRpbmcgcXVlcnkgcGFyYW1ldGVycykuXG4gKiBUbyBjcmVhdGUgYSBjdXN0b20gaWRlbnRpZmllciwgdXNlIGEgc3RyaW5nIGJlZ2lubmluZyB3aXRoIGBbYS16XSs6YCAoZS5nLiBgY3VzdG9tOnN0YXRlYCkg4oCUIHRoaXMgaXMgYSB2YWxpZCBVUkwuXG4gKlxuICogVGhlIGBmdW5jdGlvbmAgYXJndW1lbnQgY2FuIGJlIHVzZWQgZGVmaW5lIGEgY3VzdG9tIHByZWRpY2F0ZS4gSXQgcmVjZWl2ZXMgdGhlIGZ1bGwgYFVSTGAgYW5kIGNhdXNlcyBgbG9hZGAgdG8gcmVydW4gaWYgYHRydWVgIGlzIHJldHVybmVkLlxuICogVGhpcyBjYW4gYmUgdXNlZnVsIGlmIHlvdSB3YW50IHRvIGludmFsaWRhdGUgYmFzZWQgb24gYSBwYXR0ZXJuIGluc3RlYWQgb2YgYSBleGFjdCBtYXRjaC5cbiAqXG4gKiBgYGB0c1xuICogLy8gRXhhbXBsZTogTWF0Y2ggJy9wYXRoJyByZWdhcmRsZXNzIG9mIHRoZSBxdWVyeSBwYXJhbWV0ZXJzXG4gKiBpbXBvcnQgeyBpbnZhbGlkYXRlIH0gZnJvbSAnJGFwcC9uYXZpZ2F0aW9uJztcbiAqXG4gKiBpbnZhbGlkYXRlKCh1cmwpID0+IHVybC5wYXRobmFtZSA9PT0gJy9wYXRoJyk7XG4gKiBgYGBcbiAqIEBwYXJhbSB7c3RyaW5nIHwgVVJMIHwgKCh1cmw6IFVSTCkgPT4gYm9vbGVhbil9IHJlc291cmNlIFRoZSBpbnZhbGlkYXRlZCBVUkxcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2tlZXBTdGF0ZV0gSWYgYHRydWVgLCB0aGUgY3VycmVudCBgcGFnZS5zdGF0ZWAgd2lsbCBiZSBwcmVzZXJ2ZWQuIE90aGVyd2lzZSwgaXQgd2lsbCBiZSByZXNldCB0byBhbiBlbXB0eSBvYmplY3QuIGBmYWxzZWAgYnkgZGVmYXVsdC5cbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW52YWxpZGF0ZShyZXNvdXJjZSwga2VlcFN0YXRlID0gZmFsc2UpIHtcblx0cHVzaF9pbnZhbGlkYXRlZChyZXNvdXJjZSk7XG5cdHJldHVybiBfaW52YWxpZGF0ZSgha2VlcFN0YXRlKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZyB8IFVSTCB8ICgodXJsOiBVUkwpID0+IGJvb2xlYW4pfSByZXNvdXJjZSBUaGUgaW52YWxpZGF0ZWQgVVJMXG4gKi9cbmZ1bmN0aW9uIHB1c2hfaW52YWxpZGF0ZWQocmVzb3VyY2UpIHtcblx0aWYgKHR5cGVvZiByZXNvdXJjZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGludmFsaWRhdGVkLnB1c2gocmVzb3VyY2UpO1xuXHR9IGVsc2Uge1xuXHRcdGNvbnN0IHsgaHJlZiB9ID0gbmV3IFVSTChyZXNvdXJjZSwgbG9jYXRpb24uaHJlZik7XG5cdFx0aW52YWxpZGF0ZWQucHVzaCgodXJsKSA9PiB1cmwuaHJlZiA9PT0gaHJlZik7XG5cdH1cbn1cblxuLyoqXG4gKiBDYXVzZXMgYWxsIGBsb2FkYCBhbmQgYHF1ZXJ5YCBmdW5jdGlvbnMgYmVsb25naW5nIHRvIHRoZSBjdXJyZW50bHkgYWN0aXZlIHBhZ2UgdG8gcmUtcnVuLiBSZXR1cm5zIGEgYFByb21pc2VgIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgcGFnZSBpcyBzdWJzZXF1ZW50bHkgdXBkYXRlZC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyByZXNldHMgYHBhZ2Uuc3RhdGVgIHRvIGFuIGVtcHR5IG9iamVjdC4gSWYgeW91IHdhbnQgdG8gcHJlc2VydmUgYHBhZ2Uuc3RhdGVgIChmb3IgZXhhbXBsZSB3aGVuIHVzaW5nIFtzaGFsbG93IHJvdXRpbmddKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL2tpdC9zaGFsbG93LXJvdXRpbmcpKSwgdXNlIGByZWZyZXNoQWxsYCBpbnN0ZWFkLlxuICpcbiAqIEBkZXByZWNhdGVkIFVzZSBbYHJlZnJlc2hBbGxgXShodHRwczovL3N2ZWx0ZS5kZXYvZG9jcy9raXQvJGFwcC1uYXZpZ2F0aW9uI3JlZnJlc2hBbGwpIGluc3RlYWQuIFVubGlrZSBgaW52YWxpZGF0ZUFsbGAsIGByZWZyZXNoQWxsYCBkb2VzIG5vdCByZXNldCBgcGFnZS5zdGF0ZWAuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludmFsaWRhdGVBbGwoKSB7XG5cdGZvcmNlX2ludmFsaWRhdGlvbiA9IHRydWU7XG5cdHJldHVybiBfaW52YWxpZGF0ZSgpO1xufVxuXG4vKipcbiAqIENhdXNlcyBhbGwgY3VycmVudGx5IGFjdGl2ZSByZW1vdGUgZnVuY3Rpb25zIHRvIHJlZnJlc2gsIGFuZCBhbGwgYGxvYWRgIGZ1bmN0aW9ucyBiZWxvbmdpbmcgdG8gdGhlIGN1cnJlbnRseSBhY3RpdmUgcGFnZSB0byByZS1ydW4uXG4gKiBSZXR1cm5zIGEgYFByb21pc2VgIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgcGFnZSBpcyBzdWJzZXF1ZW50bHkgdXBkYXRlZC5cbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaEFsbCgpIHtcblx0Zm9yY2VfaW52YWxpZGF0aW9uID0gdHJ1ZTtcblx0cmV0dXJuIF9pbnZhbGlkYXRlKGZhbHNlKTtcbn1cblxuLyoqXG4gKiBQcm9ncmFtbWF0aWNhbGx5IHByZWxvYWRzIHRoZSBnaXZlbiBwYWdlLCB3aGljaCBtZWFuc1xuICogIDEuIGVuc3VyaW5nIHRoYXQgdGhlIGNvZGUgZm9yIHRoZSBwYWdlIGlzIGxvYWRlZCwgYW5kXG4gKiAgMi4gY2FsbGluZyB0aGUgcGFnZSdzIGxvYWQgZnVuY3Rpb24gd2l0aCB0aGUgYXBwcm9wcmlhdGUgb3B0aW9ucy5cbiAqXG4gKiBUaGlzIGlzIHRoZSBzYW1lIGJlaGF2aW91ciB0aGF0IFN2ZWx0ZUtpdCB0cmlnZ2VycyB3aGVuIHRoZSB1c2VyIHRhcHMgb3IgbW91c2VzIG92ZXIgYW4gYDxhPmAgZWxlbWVudCB3aXRoIGBkYXRhLXN2ZWx0ZWtpdC1wcmVsb2FkLWRhdGFgLlxuICogSWYgdGhlIG5leHQgbmF2aWdhdGlvbiBpcyB0byBgaHJlZmAsIHRoZSB2YWx1ZXMgcmV0dXJuZWQgZnJvbSBsb2FkIHdpbGwgYmUgdXNlZCwgbWFraW5nIG5hdmlnYXRpb24gaW5zdGFudGFuZW91cy5cbiAqIFJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgcmVzdWx0IG9mIHJ1bm5pbmcgdGhlIG5ldyByb3V0ZSdzIGBsb2FkYCBmdW5jdGlvbnMgb25jZSB0aGUgcHJlbG9hZCBpcyBjb21wbGV0ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaHJlZiBQYWdlIHRvIHByZWxvYWRcbiAqIEByZXR1cm5zIHtQcm9taXNlPCh7IHR5cGU6ICdsb2FkZWQnOyBkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IH0gfCB7IHR5cGU6ICdyZWRpcmVjdCc7IGxvY2F0aW9uOiBzdHJpbmcgfSB8IHsgdHlwZTogJ2Vycm9yJzsgZXJyb3I6IEFwcC5FcnJvciB9KSAmIHsgc3RhdHVzOiBudW1iZXI7IH0+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJlbG9hZERhdGEoaHJlZikge1xuXHRjb25zdCB1cmwgPSByZXNvbHZlX3VybChocmVmKTtcblx0Y29uc3QgaW50ZW50ID0gYXdhaXQgZ2V0X25hdmlnYXRpb25faW50ZW50KHVybCwgZmFsc2UpO1xuXG5cdGlmICghaW50ZW50KSB7XG5cdFx0ZS5wcmVsb2FkX3VybF9vdXRzaWRlX2FwcCh7IHVybDogdXJsLmhyZWYgfSk7XG5cdH1cblxuXHQvKiogQHR5cGUge0F3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgX3ByZWxvYWRfZGF0YT4+fSAqL1xuXHRsZXQgcmVzdWx0O1xuXG5cdHRyeSB7XG5cdFx0cmVzdWx0ID0gYXdhaXQgX3ByZWxvYWRfZGF0YShpbnRlbnQpO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIGBsb2FkX3JvdXRlYCB0aHJvd3MgdGhlIGhhbmRsZWQgZXJyb3IgKGFuIGBBcHAuRXJyb3JgIHdpdGggYSBgc3RhdHVzYClcblx0XHQvLyB3aGVuIGEgcHJlbG9hZCBmYWlscywgc28gc3VyZmFjZSBpdCBpbiB0aGUgZG9jdW1lbnRlZCBgeyB0eXBlOiAnZXJyb3InIH1gIHNoYXBlXG5cdFx0Y29uc3QgaGFuZGxlZCA9IC8qKiBAdHlwZSB7QXBwLkVycm9yICYgeyBzdGF0dXM/OiBudW1iZXIgfX0gKi8gKGVycm9yKTtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2Vycm9yJyxcblx0XHRcdHN0YXR1czogaGFuZGxlZD8uc3RhdHVzID8/IDUwMCxcblx0XHRcdGVycm9yOiBoYW5kbGVkXG5cdFx0fTtcblx0fVxuXG5cdGlmIChyZXN1bHQudHlwZSA9PT0gJ3JlZGlyZWN0Jykge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiByZXN1bHQudHlwZSxcblx0XHRcdHN0YXR1czogcmVzdWx0LnN0YXR1cyxcblx0XHRcdGxvY2F0aW9uOiByZXN1bHQubG9jYXRpb25cblx0XHR9O1xuXHR9XG5cblx0Y29uc3QgeyBzdGF0dXMsIGRhdGEgfSA9IHJlc3VsdC5wcm9wcy5wYWdlID8/IHBhZ2U7XG5cblx0cmV0dXJuIHsgdHlwZTogcmVzdWx0LnR5cGUsIHN0YXR1cywgZGF0YSB9O1xufVxuXG4vKipcbiAqIFByb2dyYW1tYXRpY2FsbHkgaW1wb3J0cyB0aGUgY29kZSBmb3Igcm91dGVzIHRoYXQgaGF2ZW4ndCB5ZXQgYmVlbiBmZXRjaGVkLlxuICogVHlwaWNhbGx5LCB5b3UgbWlnaHQgY2FsbCB0aGlzIHRvIHNwZWVkIHVwIHN1YnNlcXVlbnQgbmF2aWdhdGlvbi5cbiAqXG4gKiBUYWtlcyBhIHJvdXRlIElEIHN1Y2ggYXMgYC9hYm91dGAgb3IgYC9ibG9nL1tzbHVnXWAuIFVubGlrZSBwYXRobmFtZXMsIHJvdXRlIElEc1xuICogYXJlIG5ldmVyIHByZWZpeGVkIHdpdGggdGhlIGFwcCdzIFtiYXNlIHBhdGhdKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL2tpdC9Ac3ZlbHRlanMta2l0LXZpdGUjcGF0aHMpLlxuICogSWYgeW91IGhhdmUgYSBwYXRobmFtZSByYXRoZXIgdGhhbiBhIHJvdXRlIElELCB5b3UgY2FuIGNvbnZlcnQgaXQgd2l0aFxuICogW2BtYXRjaGBdKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL2tpdC8kYXBwLXBhdGhzI21hdGNoKSBmcm9tIGAkYXBwL3BhdGhzYDpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IHsgbWF0Y2ggfSBmcm9tICckYXBwL3BhdGhzJztcbiAqIGltcG9ydCB7IHByZWxvYWRDb2RlIH0gZnJvbSAnJGFwcC9uYXZpZ2F0aW9uJztcbiAqXG4gKiBjb25zdCBtYXRjaGVkID0gYXdhaXQgbWF0Y2goJy9ibG9nL2hlbGxvLXdvcmxkJyk7XG4gKiBpZiAobWF0Y2hlZCkgYXdhaXQgcHJlbG9hZENvZGUobWF0Y2hlZC5pZCk7XG4gKiBgYGBcbiAqXG4gKiBVbmxpa2UgYHByZWxvYWREYXRhYCwgdGhpcyB3b24ndCBjYWxsIGBsb2FkYCBmdW5jdGlvbnMuXG4gKiBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIG1vZHVsZXMgaGF2ZSBiZWVuIGltcG9ydGVkLlxuICpcbiAqIEBwYXJhbSB7aW1wb3J0KCckYXBwL3R5cGVzJykuUm91dGVJZH0gaWRcbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJlbG9hZENvZGUoaWQpIHtcblx0aWYgKERFViAmJiBpZFswXSAhPT0gJy8nKSB7XG5cdFx0ZS5wcmVsb2FkX2ludmFsaWRfcm91dGVfaWQoeyBpZCB9KTtcblx0fVxuXG5cdGNvbnN0IHJvdXRlID0gX19TVkVMVEVLSVRfQ0xJRU5UX1JPVVRJTkdfX1xuXHRcdD8gcm91dGVzLmZpbmQoKHIpID0+IHIuaWQgPT09IGlkKVxuXHRcdDogKHJvdXRlX2lkX2NhY2hlLmdldChpZCkgPz8gKGF3YWl0IGxvYWRfcm91dGVfYnlfaWQoaWQpKSk7XG5cblx0aWYgKHJvdXRlID09PSBFTkRQT0lOVF9PTkxZKSB7XG5cdFx0aWYgKERFVikge1xuXHRcdFx0dy5wcmVsb2FkX2NvZGVfZW5kcG9pbnRfb25seSh7IGlkIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybjtcblx0fVxuXG5cdGlmICghcm91dGUpIHtcblx0XHRpZiAoREVWKSB7XG5cdFx0XHQvLyB3YXJuIHJhdGhlciB0aGFuIHRocm93LCBzaW5jZSB1bmRlciBjbGllbnQgcm91dGluZyBhbiBlbmRwb2ludC1vbmx5IHJvdXRlIGlkIGlzXG5cdFx0XHQvLyBpbmRpc3Rpbmd1aXNoYWJsZSBmcm9tIGEgdHlwbyDigJQgdGhlIGNsaWVudCBtYW5pZmVzdCBvbmx5IGNvbnRhaW5zIHJvdXRlcyB3aXRoIGEgYCtwYWdlYFxuXHRcdFx0Ly8gdGhlIG1vc3QgY29tbW9uIG1pZ3JhdGlvbiBtaXN0YWtlIGlzIHBhc3NpbmcgYSBwYXRobmFtZSwgd2hpY2ggdXNlZCB0byB3b3JrXG5cdFx0XHRjb25zdCBjYW5kaWRhdGVzID0gW2lkXTtcblx0XHRcdGlmIChiYXNlICYmIGlkLnN0YXJ0c1dpdGgoYmFzZSkpIGNhbmRpZGF0ZXMucHVzaChpZC5zbGljZShiYXNlLmxlbmd0aCkgfHwgJy8nKTtcblxuXHRcdFx0aWYgKFxuXHRcdFx0XHRfX1NWRUxURUtJVF9DTElFTlRfUk9VVElOR19fICYmXG5cdFx0XHRcdGNhbmRpZGF0ZXMuc29tZSgocGF0aCkgPT4gcm91dGVzLnNvbWUoKHIpID0+IHIuZXhlYyhwYXRoKSkpXG5cdFx0XHQpIHtcblx0XHRcdFx0dy5wcmVsb2FkX3JvdXRlX2lzX3BhdGhuYW1lKHsgaWQgfSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR3LnByZWxvYWRfcm91dGVfbWlzc2luZyh7IGlkIH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybjtcblx0fVxuXG5cdGF3YWl0IGxvYWRfcm91dGVfbm9kZXMocm91dGUpO1xufVxuXG4vKipcbiAqIFByb2dyYW1tYXRpY2FsbHkgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnkgd2l0aCB0aGUgZ2l2ZW4gYHBhZ2Uuc3RhdGVgLiBVc2VkIGZvciBbc2hhbGxvdyByb3V0aW5nXShodHRwczovL3N2ZWx0ZS5kZXYvZG9jcy9raXQvc2hhbGxvdy1yb3V0aW5nKS5cbiAqXG4gKiBAZGVwcmVjYXRlZCBVc2UgYGdvdG8odXJsLCB7IHN0YXRlLCBzaGFsbG93OiB0cnVlIH0pYCBpbnN0ZWFkLlxuICogQHBhcmFtIHtzdHJpbmcgfCBVUkx9IHVybFxuICogQHBhcmFtIHtBcHAuUGFnZVN0YXRlfSBzdGF0ZVxuICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwdXNoU3RhdGUodXJsLCBzdGF0ZSkge1xuXHRpZiAoREVWICYmICF3YXJuZWRfb25fcHVzaF9zdGF0ZSkge1xuXHRcdHdhcm5lZF9vbl9wdXNoX3N0YXRlID0gdHJ1ZTtcblx0XHR3LnB1c2hfc3RhdGVfZGVwcmVjYXRlZCgpO1xuXHR9XG5cblx0Y29uc3QgaW50ZW50ID0gYXdhaXQgcmVzb2x2ZV9pbnRlbnQodXJsLCAncHVzaFN0YXRlJyk7XG5cblx0YXdhaXQgdXBkYXRlX3N0YXRlKFxuXHRcdGludGVudCxcblx0XHRzdGF0ZSxcblx0XHR7IHJlcGxhY2U6IGZhbHNlLCBwZXJzaXN0X3N0YXRlOiBmYWxzZSwgcmVzZXQ6IGZhbHNlIH0sXG5cdFx0J3B1c2hTdGF0ZSdcblx0KTtcbn1cblxuLyoqXG4gKiBQcm9ncmFtbWF0aWNhbGx5IHJlcGxhY2UgdGhlIGN1cnJlbnQgaGlzdG9yeSBlbnRyeSB3aXRoIHRoZSBnaXZlbiBgcGFnZS5zdGF0ZWAuIFVzZWQgZm9yIFtzaGFsbG93IHJvdXRpbmddKGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzL2tpdC9zaGFsbG93LXJvdXRpbmcpLlxuICpcbiAqIEBkZXByZWNhdGVkIFVzZSBgZ290byh1cmwsIHsgc3RhdGUsIHNoYWxsb3c6IHRydWUsIHJlcGxhY2U6IHRydWUgfSlgIGluc3RlYWQuXG4gKiBAcGFyYW0ge3N0cmluZyB8IFVSTH0gdXJsXG4gKiBAcGFyYW0ge0FwcC5QYWdlU3RhdGV9IHN0YXRlXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcGxhY2VTdGF0ZSh1cmwsIHN0YXRlKSB7XG5cdGlmIChERVYgJiYgIXdhcm5lZF9vbl9yZXBsYWNlX3N0YXRlX2Z1bmN0aW9uKSB7XG5cdFx0d2FybmVkX29uX3JlcGxhY2Vfc3RhdGVfZnVuY3Rpb24gPSB0cnVlO1xuXHRcdHcucmVwbGFjZV9zdGF0ZV9kZXByZWNhdGVkKCk7XG5cdH1cblxuXHRjb25zdCBpbnRlbnQgPSBhd2FpdCByZXNvbHZlX2ludGVudCh1cmwsICdyZXBsYWNlU3RhdGUnKTtcblxuXHRhd2FpdCB1cGRhdGVfc3RhdGUoXG5cdFx0aW50ZW50LFxuXHRcdHN0YXRlLFxuXHRcdHsgcmVwbGFjZTogdHJ1ZSwgcGVyc2lzdF9zdGF0ZTogZmFsc2UsIHJlc2V0OiBmYWxzZSB9LFxuXHRcdCdyZXBsYWNlU3RhdGUnXG5cdCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtOYXZpZ2F0aW9uSW50ZW50fSBpbnRlbnRcbiAqIEBwYXJhbSB7QXBwLlBhZ2VTdGF0ZX0gc3RhdGVcbiAqIEBwYXJhbSB7eyByZXBsYWNlOiBib29sZWFuOyBwZXJzaXN0X3N0YXRlOiBib29sZWFuOyByZXNldDogYm9vbGVhbjsgfX0gb3B0aW9uc1xuICogQHBhcmFtIHsnZ290bycgfCAncHVzaFN0YXRlJyB8ICdyZXBsYWNlU3RhdGUnfSBjYWxsZXJcbiAqL1xuYXN5bmMgZnVuY3Rpb24gdXBkYXRlX3N0YXRlKGludGVudCwgc3RhdGUsIHsgcmVwbGFjZSwgcGVyc2lzdF9zdGF0ZSwgcmVzZXQgfSwgY2FsbGVyKSB7XG5cdGNvbnN0IHVybCA9IGludGVudC51cmw7XG5cdGNvbnN0IHByZXZpb3VzX3NuYXBzaG90X3JlZ2lzdHJhdGlvbnMgPSBjdXJyZW50X3JlZ2lzdHJhdGlvbnMoKTtcblxuXHRpZiAoREVWICYmICFzdGFydGVkKSB7XG5cdFx0ZS5uYXZpZ2F0aW9uX2JlZm9yZV9zdGFydCh7IGNhbGxlciB9KTtcblx0fVxuXG5cdGNvbnN0IG5hdiA9XG5cdFx0Ly8gRm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdlIGRvbid0IHRyaWdnZXIgbmF2aWdhdGlvbiBob29rcyBldGMgZm9yIHB1c2gvcmVwbGFjZVN0YXRlXG5cdFx0Y2FsbGVyID09PSAnZ290bycgPyBfYmVmb3JlX25hdmlnYXRlKHsgdXJsLCB0eXBlOiAnZ290bycsIGludGVudCwgc2hhbGxvdzogdHJ1ZSB9KSA6IHVuZGVmaW5lZDtcblxuXHRpZiAoIW5hdiAmJiBjYWxsZXIgPT09ICdnb3RvJykgcmV0dXJuO1xuXG5cdGNvbnN0IG5hdl90b2tlbiA9IHt9O1xuXG5cdGlmIChuYXYpIHtcblx0XHRuYXZpZ2F0aW9uX3Rva2VuID0gaW52YWxpZGF0aW9uX3Rva2VuID0gbmF2X3Rva2VuO1xuXHRcdGlzX25hdmlnYXRpbmcgPSB0cnVlO1xuXHRcdHNldF9uYXZpZ2F0aW9uKG5hdi5uYXZpZ2F0aW9uKTtcblx0XHR1cGRhdGluZyA9IHRydWU7XG5cdH1cblxuXHRpZiAocmVwbGFjZSkge1xuXHRcdGRlbGV0ZV9uYXZpZ2F0aW9uX3NuYXBzaG90KGN1cnJlbnRfaGlzdG9yeV9pbmRleCk7XG5cdH0gZWxzZSB7XG5cdFx0Y2FwdHVyZV9zY3JvbGwoY3VycmVudF9oaXN0b3J5X2luZGV4KTtcblx0XHRjYXB0dXJlX25hdmlnYXRpb25fc25hcHNob3QoY3VycmVudF9oaXN0b3J5X2luZGV4KTtcblx0fVxuXHRpZiAocmVzZXQpIGN1cnJlbnRfcmVzZXRfaW5kZXggKz0gMTtcblxuXHQvLyBhcyBhYm92ZSwgc2VyaWFsaXplLXRoZW4tcGFyc2UgdG8gcHJldmVudCBidWdzXG5cdGNvbnN0IHNlcmlhbGl6ZWRfc3RhdGUgPSBzdHJpbmdpZnkoc3RhdGUpO1xuXHRzdGF0ZSA9IHBhcnNlKHNlcmlhbGl6ZWRfc3RhdGUpO1xuXG5cdGNvbnN0IGVudHJ5ID0ge1xuXHRcdFtISVNUT1JZX01FVEFEQVRBX0tFWV06IC8qKiBAc2F0aXNmaWVzIHtIaXN0b3J5TWV0YWRhdGF9ICovICh7XG5cdFx0XHRoaXN0b3J5SW5kZXg6IChjdXJyZW50X2hpc3RvcnlfaW5kZXggKz0gcmVwbGFjZSA/IDAgOiAxKSxcblx0XHRcdG5hdmlnYXRpb25JbmRleDogY3VycmVudF9uYXZpZ2F0aW9uX2luZGV4LFxuXHRcdFx0cGFnZVVybDogcGFnZS51cmwuaHJlZixcblx0XHRcdHN0YXRlOiBzZXJpYWxpemVkX3N0YXRlLFxuXHRcdFx0cGVyc2lzdFN0YXRlOiBwZXJzaXN0X3N0YXRlLFxuXHRcdFx0cmVzZXRJbmRleDogY3VycmVudF9yZXNldF9pbmRleFxuXHRcdH0pXG5cdH07XG5cblx0Y29uc3QgZm4gPSByZXBsYWNlID8gaGlzdG9yeS5yZXBsYWNlU3RhdGUgOiBoaXN0b3J5LnB1c2hTdGF0ZTtcblx0Zm4uY2FsbChoaXN0b3J5LCBlbnRyeSwgJycsIHVybCk7XG5cdHNldF9oaXN0b3J5X29wdGlvbnMoY3VycmVudF9oaXN0b3J5X2luZGV4LCBlbnRyeVtISVNUT1JZX01FVEFEQVRBX0tFWV0pO1xuXG5cdGlmICghcmVwbGFjZSkge1xuXHRcdGhhc19uYXZpZ2F0ZWQgPSB0cnVlO1xuXHRcdGNsZWFyX29ud2FyZF9oaXN0b3J5KGN1cnJlbnRfaGlzdG9yeV9pbmRleCwgY3VycmVudF9uYXZpZ2F0aW9uX2luZGV4KTtcblx0fVxuXG5cdGlmIChuYXYpIHtcblx0XHRhd2FpdCBydW5fb25fbmF2aWdhdGVfY2FsbGJhY2tzKC8qKiBAdHlwZSB7T25OYXZpZ2F0ZX0gKi8gKG5hdi5uYXZpZ2F0aW9uKSk7XG5cdH1cblxuXHRibHVyX2FjdGl2ZV9lbGVtZW50KHJlc2V0KTtcblxuXHR1cGRhdGVfcGFnZSh7XG5cdFx0c3RhdGUsXG5cdFx0c2hhbGxvdzoge1xuXHRcdFx0cGFyYW1zOiBpbnRlbnQ/LnBhcmFtcyA/PyBudWxsLFxuXHRcdFx0cm91dGU6IGludGVudCA/IHsgaWQ6IGludGVudC5yb3V0ZS5pZCB9IDogbnVsbCxcblx0XHRcdHVybFxuXHRcdH1cblx0fSk7XG5cblx0aWYgKG5hdikge1xuXHRcdGNvbnN0IGZpbmlzaGVkID0gYXdhaXQgZmluaXNoX25hdmlnYXRpb24obmF2LCBuYXZfdG9rZW4sIHVybCwgbnVsbCwgcmVzZXQsIHNldHRsZWQoKSk7XG5cdFx0aWYgKCFmaW5pc2hlZCkgcmV0dXJuO1xuXHR9XG5cblx0cmVzdG9yZV9uYXZpZ2F0aW9uX3NuYXBzaG90KGN1cnJlbnRfaGlzdG9yeV9pbmRleCwgcHJldmlvdXNfc25hcHNob3RfcmVnaXN0cmF0aW9ucyk7XG5cblx0aWYgKG5hdikge1xuXHRcdHNldF9uYXZpZ2F0aW9uKG51bGwpO1xuXHRcdHVwZGF0aW5nID0gZmFsc2U7XG5cdH1cbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBgZm9ybWAgcHJvcGVydHkgb2YgdGhlIGN1cnJlbnQgcGFnZSB3aXRoIHRoZSBnaXZlbiBkYXRhIGFuZCB1cGRhdGVzIGBwYWdlLnN0YXR1c2AuXG4gKiBJbiBjYXNlIG9mIGFuIGVycm9yLCBpdCByZW5kZXJzIHRoZSBuZWFyZXN0IGVycm9yIHBhZ2UuIEluIGNhc2Ugb2YgYSByZWRpcmVjdCwgaXQgbmF2aWdhdGVzIHRvXG4gKiB0aGUgcmVkaXJlY3QgbG9jYXRpb24uXG4gKiBAdGVtcGxhdGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkfSBTdWNjZXNzXG4gKiBAdGVtcGxhdGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkfSBGYWlsdXJlXG4gKiBAcGFyYW0ge0FjdGlvblJlc3VsdDxTdWNjZXNzLCBGYWlsdXJlPn0gcmVzdWx0XG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFwcGx5QWN0aW9uKHJlc3VsdCkge1xuXHRpZiAocmVzdWx0LnR5cGUgPT09ICdyZWRpcmVjdCcpIHtcblx0XHRhd2FpdCBfZ290byhyZXN1bHQubG9jYXRpb24sIHsgcmVmcmVzaEFsbDogdHJ1ZSB9KTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZiAocmVzdWx0LnR5cGUgPT09ICdlcnJvcicpIHtcblx0XHRhd2FpdCBzZXRfbmVhcmVzdF9lcnJvcl9wYWdlKHJlc3VsdC5lcnJvcik7XG5cdH0gZWxzZSB7XG5cdFx0dXBkYXRlX3BhZ2Uoe1xuXHRcdFx0Zm9ybTogcmVzdWx0LmRhdGEsXG5cdFx0XHRzdGF0dXM6IHJlc3VsdC5zdGF0dXNcblx0XHR9KTtcblxuXHRcdC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gKi9cblx0XHQvLyB0aGlzIGJyaW5ncyBTdmVsdGUncyB2aWV3IG9mIHRoZSB3b3JsZCBpbiBsaW5lIHdpdGggU3ZlbHRlS2l0J3Ncblx0XHQvLyBhZnRlciB1c2U6ZW5oYW5jZSByZXNldCB0aGUgZm9ybS4uLi5cblx0XHRwcm9wcy5mb3JtID0gbnVsbDtcblxuXHRcdC8vIC4uLnNvIHRoYXQgc2V0dGluZyB0aGUgYGZvcm1gIHByb3AgdGFrZXMgZWZmZWN0IGFuZCBpc24ndCBpZ25vcmVkXG5cdFx0YXdhaXQgdGljaygpO1xuXHRcdHByb3BzLmZvcm0gPSByZXN1bHQuZGF0YTtcblxuXHRcdGlmIChyZXN1bHQudHlwZSA9PT0gJ3N1Y2Nlc3MnKSB7XG5cdFx0XHRyZXNldF9mb2N1cygvKiogQHR5cGUge1VSTH0gKi8gKHBhZ2UudXJsKSk7XG5cdFx0fVxuXHR9XG59XG5cbi8qKlxuICogV2hldGhlciBhIHN1Ym1pc3Npb24gc2hvdWxkIHVwZGF0ZSB0aGUgY3VycmVudCBwYWdlIGluIHBsYWNlIHJhdGhlciB0aGFuIG5hdmlnYXRpbmcg4oCUIGVpdGhlclxuICogYmVjYXVzZSBpdCBsYW5kcyB3aGVyZSB3ZSBhbHJlYWR5IGFyZSwgb3IgYmVjYXVzZSB0aGUgcmVzdWx0IGNhcnJpZXMgbm8gbG9jYXRpb24gYXQgYWxsXG4gKiAoaGFuZC1jb25zdHJ1Y3RlZCByZXN1bHRzLCB3aGljaCBoYXZlIGFsd2F5cyBhcHBsaWVkIGluIHBsYWNlKS5cbiAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNfY3VycmVudF9sb2NhdGlvbih2YWx1ZSkge1xuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7XG5cblx0Y29uc3QgZGVzdGluYXRpb24gPSByZXNvbHZlX3VybCh2YWx1ZSk7XG5cdGNvbnN0IGN1cnJlbnQgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuXHRpZiAoZGVzdGluYXRpb24ub3JpZ2luICE9PSBjdXJyZW50Lm9yaWdpbiB8fCBkZXN0aW5hdGlvbi5wYXRobmFtZSAhPT0gY3VycmVudC5wYXRobmFtZSlcblx0XHRyZXR1cm4gZmFsc2U7XG5cblx0Y29uc3Qga2V5cyA9IG5ldyBTZXQoWy4uLmRlc3RpbmF0aW9uLnNlYXJjaFBhcmFtcy5rZXlzKCksIC4uLmN1cnJlbnQuc2VhcmNoUGFyYW1zLmtleXMoKV0pO1xuXHRmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG5cdFx0Y29uc3QgZGVzdGluYXRpb25fdmFsdWVzID0gZGVzdGluYXRpb24uc2VhcmNoUGFyYW1zLmdldEFsbChrZXkpLnNvcnQoKTtcblx0XHRjb25zdCBjdXJyZW50X3ZhbHVlcyA9IGN1cnJlbnQuc2VhcmNoUGFyYW1zLmdldEFsbChrZXkpLnNvcnQoKTtcblxuXHRcdGlmIChcblx0XHRcdGRlc3RpbmF0aW9uX3ZhbHVlcy5sZW5ndGggIT09IGN1cnJlbnRfdmFsdWVzLmxlbmd0aCB8fFxuXHRcdFx0ZGVzdGluYXRpb25fdmFsdWVzLnNvbWUoKHZhbHVlLCBpKSA9PiB2YWx1ZSAhPT0gY3VycmVudF92YWx1ZXNbaV0pXG5cdFx0KSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogTmF2aWdhdGUgdG8gd2hlcmUgYSBmb3JtIHN1Ym1pc3Npb24gc2hvdWxkIGxhbmQsIHJlbmRlcmluZyB0aGF0IHBhZ2Ugd2l0aCB0aGUgZ2l2ZW4gcmVzdWx0XG4gKiDigJQgd2hhdCB0aGUgYnJvd3NlciB3b3VsZCBkbyBmb3IgYSBuYXRpdmUgc3VibWlzc2lvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSBsb2NhdGlvblxuICogQHBhcmFtIHtBY3Rpb25SZXN1bHR9IHJlc3VsdFxuICogQHBhcmFtIHtib29sZWFufSByZWZyZXNoX2FsbFxuICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseV9hY3Rpb25fbmF2aWdhdGlvbihsb2NhdGlvbiwgcmVzdWx0LCByZWZyZXNoX2FsbCkge1xuXHRyZXR1cm4gX2dvdG8obG9jYXRpb24sIHtcblx0XHR0eXBlOiAnZm9ybScsXG5cdFx0cmVmcmVzaEFsbDogcmVmcmVzaF9hbGwsXG5cdFx0YWN0aW9uX3Jlc3VsdDogcmVzdWx0XG5cdH0pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7QXBwLkVycm9yfSBlcnJvclxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0X25lYXJlc3RfZXJyb3JfcGFnZShlcnJvcikge1xuXHRjb25zdCB1cmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuXG5cdGNvbnN0IHsgYnJhbmNoLCByb3V0ZSB9ID0gY3VycmVudDtcblx0aWYgKCFyb3V0ZSkgcmV0dXJuO1xuXG5cdGNvbnN0IGVycm9yX2JyYW5jaCA9IGF3YWl0IGxvYWRfbmVhcmVzdF9lcnJvcl9wYWdlKGN1cnJlbnQuYnJhbmNoLmxlbmd0aCwgYnJhbmNoLCByb3V0ZS5lcnJvcnMpO1xuXHRpZiAoZXJyb3JfYnJhbmNoKSB7XG5cdFx0Y29uc3QgbmF2aWdhdGlvbl9yZXN1bHQgPSBhd2FpdCBnZXRfbmF2aWdhdGlvbl9yZXN1bHRfZnJvbV9icmFuY2goe1xuXHRcdFx0dXJsLFxuXHRcdFx0cGFyYW1zOiBjdXJyZW50LnBhcmFtcyxcblx0XHRcdGJyYW5jaDogZXJyb3JfYnJhbmNoLFxuXHRcdFx0ZXJyb3IsXG5cdFx0XHRlcnJvcnM6IHJvdXRlLmVycm9ycyxcblx0XHRcdHJvdXRlXG5cdFx0fSk7XG5cblx0XHRjdXJyZW50ID0geyAuLi5uYXZpZ2F0aW9uX3Jlc3VsdC5zdGF0ZSwgbmF2OiBjdXJyZW50Lm5hdiB9O1xuXG5cdFx0YXBwbHlfbmF2aWdhdGlvbl9yZXN1bHQobmF2aWdhdGlvbl9yZXN1bHQpO1xuXG5cdFx0dm9pZCB0aWNrKCkudGhlbigoKSA9PiByZXNldF9mb2N1cyhjdXJyZW50LnVybCkpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIF9zdGFydF9yb3V0ZXIoKSB7XG5cdGhpc3Rvcnkuc2Nyb2xsUmVzdG9yYXRpb24gPSAnbWFudWFsJztcblxuXHRhZGRFdmVudExpc3RlbmVyKCdiZWZvcmV1bmxvYWQnLCAoZSkgPT4ge1xuXHRcdGxldCBzaG91bGRfYmxvY2sgPSBmYWxzZTtcblxuXHRcdHBlcnNpc3Rfc3RhdGUoKTtcblxuXHRcdGlmICghaXNfbmF2aWdhdGluZykge1xuXHRcdFx0Y29uc3QgbmF2ID0gY3JlYXRlX25hdmlnYXRpb24oY3VycmVudCwgdW5kZWZpbmVkLCBudWxsLCAnbGVhdmUnKTtcblxuXHRcdFx0Ly8gSWYgd2UncmUgbmF2aWdhdGluZywgYmVmb3JlTmF2aWdhdGUgd2FzIGFscmVhZHkgY2FsbGVkLiBJZiB3ZSBlbmQgdXAgaW4gaGVyZSBkdXJpbmcgbmF2aWdhdGlvbixcblx0XHRcdC8vIGl0J3MgZHVlIHRvIGFuIGV4dGVybmFsIG9yIGZ1bGwtcGFnZS1yZWxvYWQgbGluaywgZm9yIHdoaWNoIHdlIGRvbid0IHdhbnQgdG8gY2FsbCB0aGUgaG9vayBhZ2Fpbi5cblx0XHRcdC8qKiBAdHlwZSB7QmVmb3JlTmF2aWdhdGV9ICovXG5cdFx0XHRjb25zdCBuYXZpZ2F0aW9uID0ge1xuXHRcdFx0XHQuLi5uYXYubmF2aWdhdGlvbixcblx0XHRcdFx0Y2FuY2VsOiAoKSA9PiB7XG5cdFx0XHRcdFx0c2hvdWxkX2Jsb2NrID0gdHJ1ZTtcblx0XHRcdFx0XHRuYXYucmVqZWN0KG5ldyBFcnJvcignbmF2aWdhdGlvbiBjYW5jZWxsZWQnKSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdGJlZm9yZV9uYXZpZ2F0ZV9jYWxsYmFja3MuZm9yRWFjaCgoZm4pID0+IGZuKG5hdmlnYXRpb24pKTtcblx0XHR9XG5cblx0XHRpZiAoc2hvdWxkX2Jsb2NrKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRlLnJldHVyblZhbHVlID0gJyc7XG5cdFx0fVxuXHR9KTtcblx0YWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsICgpID0+IHtcblx0XHRpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAnaGlkZGVuJykge1xuXHRcdFx0cGVyc2lzdF9zdGF0ZSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyB0aGUgdGFiIGp1c3QgYmVjYW1lIHZpc2libGUg4oCUIGEgZ29vZCB0aW1lIHRvIGNoZWNrIGZvciBhIG5ldyBkZXBsb3ltZW50XG5cdFx0XHR2b2lkIHVwZGF0ZWQuY2hlY2soKTtcblx0XHR9XG5cdH0pO1xuXG5cdGFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4ge1xuXHRcdHZvaWQgdXBkYXRlZC5jaGVjaygpO1xuXHR9KTtcblxuXHQvLyBAdHMtZXhwZWN0LWVycm9yIHRoaXMgaXNuJ3Qgc3VwcG9ydGVkIGV2ZXJ5d2hlcmUgeWV0XG5cdGlmICghbmF2aWdhdG9yLmNvbm5lY3Rpb24/LnNhdmVEYXRhKSB7XG5cdFx0c2V0dXBfcHJlbG9hZCgpO1xuXHR9XG5cblx0LyoqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgKi9cblx0Y29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKGV2ZW50KSA9PiB7XG5cdFx0Ly8gQWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS92aXNpb25tZWRpYS9wYWdlLmpzXG5cdFx0Ly8gTUlUIGxpY2Vuc2UgaHR0cHM6Ly9naXRodWIuY29tL3Zpc2lvbm1lZGlhL3BhZ2UuanMjbGljZW5zZVxuXHRcdGlmIChldmVudC5idXR0b24pIHJldHVybjtcblx0XHRpZiAoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5IHx8IGV2ZW50LnNoaWZ0S2V5IHx8IGV2ZW50LmFsdEtleSkgcmV0dXJuO1xuXHRcdGlmIChldmVudC5kZWZhdWx0UHJldmVudGVkKSByZXR1cm47XG5cblx0XHRjb25zdCBhID0gZmluZF9hbmNob3IoLyoqIEB0eXBlIHtFbGVtZW50fSAqLyAoZXZlbnQuY29tcG9zZWRQYXRoKClbMF0pLCBjb250YWluZXIpO1xuXHRcdGlmICghYSkgcmV0dXJuO1xuXG5cdFx0Y29uc3QgeyB1cmwsIGV4dGVybmFsLCB0YXJnZXQsIGRvd25sb2FkIH0gPSBnZXRfbGlua19pbmZvKGEsIGJhc2UsIGFwcC5oYXNoKTtcblx0XHRpZiAoIXVybCkgcmV0dXJuO1xuXG5cdFx0Ly8gYmFpbCBvdXQgYmVmb3JlIGBiZWZvcmVOYXZpZ2F0ZWAgaWYgbGluayBvcGVucyBpbiBhIGRpZmZlcmVudCB0YWJcblx0XHRpZiAodGFyZ2V0ID09PSAnX3BhcmVudCcgfHwgdGFyZ2V0ID09PSAnX3RvcCcpIHtcblx0XHRcdGlmICh3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cpIHJldHVybjtcblx0XHR9IGVsc2UgaWYgKHRhcmdldCAmJiB0YXJnZXQgIT09ICdfc2VsZicpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBvcHRpb25zID0gZ2V0X3JvdXRlcl9vcHRpb25zKGEpO1xuXHRcdGNvbnN0IGlzX3N2Z19hX2VsZW1lbnQgPSBhIGluc3RhbmNlb2YgU1ZHQUVsZW1lbnQ7XG5cblx0XHQvLyBJZ25vcmUgVVJMIHByb3RvY29scyB0aGF0IGRpZmZlciB0byB0aGUgY3VycmVudCBvbmUgYW5kIGFyZSBub3QgaHR0cChzKSAoZS5nLiBgbWFpbHRvOmAsIGB0ZWw6YCwgYG15YXBwOmAsIGV0Yy4pXG5cdFx0Ly8gVGhpcyBtYXkgYmUgd3Jvbmcgd2hlbiB0aGUgcHJvdG9jb2wgaXMgeDogYW5kIHRoZSBsaW5rIGdvZXMgdG8geTouLiB3aGljaCBzaG91bGQgYmUgdHJlYXRlZCBhcyBhbiBleHRlcm5hbFxuXHRcdC8vIG5hdmlnYXRpb24sIGJ1dCBpdCdzIG5vdCBjbGVhciBob3cgdG8gaGFuZGxlIHRoYXQgY2FzZSBhbmQgaXQncyBub3QgbGlrZWx5IHRvIGNvbWUgdXAgaW4gcHJhY3RpY2UuXG5cdFx0Ly8gU2VlOlxuXHRcdC8vIC0gaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL2tpdC9pc3N1ZXMvNDA0NVxuXHRcdC8vIC0gaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL2tpdC9pc3N1ZXMvNTcyNVxuXHRcdC8vIC0gaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL2tpdC9pc3N1ZXMvNjQ5NlxuXHRcdGlmIChcblx0XHRcdCFpc19zdmdfYV9lbGVtZW50ICYmXG5cdFx0XHR1cmwucHJvdG9jb2wgIT09IGxvY2F0aW9uLnByb3RvY29sICYmXG5cdFx0XHQhKHVybC5wcm90b2NvbCA9PT0gJ2h0dHBzOicgfHwgdXJsLnByb3RvY29sID09PSAnaHR0cDonKVxuXHRcdClcblx0XHRcdHJldHVybjtcblxuXHRcdGlmIChkb3dubG9hZCkgcmV0dXJuO1xuXG5cdFx0Y29uc3QgW25vbmhhc2gsIGhhc2hdID0gKGFwcC5oYXNoID8gdXJsLmhhc2gucmVwbGFjZSgvXiMvLCAnJykgOiB1cmwuaHJlZikuc3BsaXQoJyMnKTtcblx0XHRjb25zdCBzYW1lX3BhdGhuYW1lID0gbm9uaGFzaCA9PT0gc3RyaXBfaGFzaChsb2NhdGlvbik7XG5cblx0XHQvLyBJZ25vcmUgdGhlIGZvbGxvd2luZyBidXQgZmlyZSBiZWZvcmVOYXZpZ2F0ZVxuXHRcdGlmIChleHRlcm5hbCB8fCAob3B0aW9ucy5yZWxvYWQgJiYgKCFzYW1lX3BhdGhuYW1lIHx8ICFoYXNoKSkpIHtcblx0XHRcdGlmIChfYmVmb3JlX25hdmlnYXRlKHsgdXJsLCB0eXBlOiAnbGluaycsIGV2ZW50IH0pKSB7XG5cdFx0XHRcdC8vIHNldCBgbmF2aWdhdGluZ2AgdG8gYHRydWVgIHRvIHByZXZlbnQgYGJlZm9yZU5hdmlnYXRlYCBjYWxsYmFja3Ncblx0XHRcdFx0Ly8gYmVpbmcgY2FsbGVkIHdoZW4gdGhlIHBhZ2UgdW5sb2Fkc1xuXHRcdFx0XHRpc19uYXZpZ2F0aW5nID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBDaGVjayBpZiBuZXcgdXJsIG9ubHkgZGlmZmVycyBieSBoYXNoIGFuZCB1c2UgdGhlIGJyb3dzZXIgZGVmYXVsdCBiZWhhdmlvciBpbiB0aGF0IGNhc2Vcblx0XHQvLyBUaGlzIHdpbGwgZW5zdXJlIHRoZSBgaGFzaGNoYW5nZWAgZXZlbnQgaXMgZmlyZWRcblx0XHQvLyBSZW1vdmluZyB0aGUgaGFzaCBkb2VzIGEgZnVsbCBwYWdlIG5hdmlnYXRpb24gaW4gdGhlIGJyb3dzZXIsIHNvIG1ha2Ugc3VyZSBhIGhhc2ggaXMgcHJlc2VudFxuXHRcdGlmIChoYXNoICE9PSB1bmRlZmluZWQgJiYgc2FtZV9wYXRobmFtZSkge1xuXHRcdFx0Ly8gSWYgd2UgYXJlIHRyeWluZyB0byBuYXZpZ2F0ZSB0byB0aGUgc2FtZSBoYXNoLCB3ZSBzaG91bGQgb25seVxuXHRcdFx0Ly8gYXR0ZW1wdCB0byBzY3JvbGwgdG8gdGhhdCBlbGVtZW50IGFuZCBhdm9pZCBhbnkgaGlzdG9yeSBjaGFuZ2VzLlxuXHRcdFx0Ly8gT3RoZXJ3aXNlIGEgZnJhZ21lbnQgbmF2aWdhdGlvbiBjcmVhdGVzIGEgbmV3IGVudHJ5IHdpdGggYSBudWxsIGhpc3Rvcnkgc3RhdGUsXG5cdFx0XHQvLyB3aGljaCBicm93c2VycyBoYW5kbGUgZGlmZmVyZW50bHk6IGh0dHBzOi8vZ2l0aHViLmNvbS93aGF0d2cvaHRtbC9pc3N1ZXMvNjIxM1xuXHRcdFx0Y29uc3QgWywgY3VycmVudF9oYXNoXSA9IGN1cnJlbnQudXJsLmhyZWYuc3BsaXQoJyMnKTtcblx0XHRcdGlmIChjdXJyZW50X2hhc2ggPT09IGhhc2gpIHtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0XHQvLyBXZSdyZSBhbHJlYWR5IG9uIC8jIGFuZCBjbGljayBvbiBhIGxpbmsgdGhhdCBnb2VzIHRvIC8jLCBvciB3ZSdyZSBvblxuXHRcdFx0XHQvLyAvI3RvcCBhbmQgY2xpY2sgb24gYSBsaW5rIHRoYXQgZ29lcyB0byAvI3RvcC4gSW4gdGhvc2UgY2FzZXMganVzdCBnbyB0b1xuXHRcdFx0XHQvLyB0aGUgdG9wIG9mIHRoZSBwYWdlLCBhbmQgYXZvaWQgYSBoaXN0b3J5IGNoYW5nZS5cblx0XHRcdFx0aWYgKGhhc2ggPT09ICcnIHx8IChoYXNoID09PSAndG9wJyAmJiBhLm93bmVyRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvcCcpID09PSBudWxsKSkge1xuXHRcdFx0XHRcdHNjcm9sbFRvKHsgdG9wOiAwIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnN0IGVsZW1lbnQgPSBhLm93bmVyRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVjb2RlVVJJQ29tcG9uZW50KGhhc2gpKTtcblx0XHRcdFx0XHRpZiAoZWxlbWVudCkge1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5zY3JvbGxJbnRvVmlldygpO1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5mb2N1cygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdC8vIHNldCB0aGlzIGZsYWcgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBuYXZpZ2F0aW9ucyB0cmlnZ2VyZWQgYnlcblx0XHRcdC8vIGNsaWNraW5nIGEgaGFzaCBsaW5rIGFuZCB0aG9zZSB0cmlnZ2VyZWQgYnkgcG9wc3RhdGUuIFdlIGdvdHRhIHJldHJpZXZlXG5cdFx0XHQvLyBoaXN0b3J5IG1ldGFkYXRhIGhlcmUgYmVjYXVzZSB0aGUgaGFzaGNoYW5nZSBldmVudCB3aWxsIG9jY3VyIGFmdGVyIGhpc3Rvcnkuc3RhdGUgd2FzIHVwZGF0ZWRcblx0XHRcdGhhc2hfbmF2aWdhdGluZyA9IHtcblx0XHRcdFx0Li4uLyoqIEB0eXBlIHtIaXN0b3J5TWV0YWRhdGF9ICovIChnZXRfaGlzdG9yeV9tZXRhZGF0YSgpKSxcblx0XHRcdFx0cmVzZXRJbmRleDogY3VycmVudF9yZXNldF9pbmRleCArIChvcHRpb25zLnJlc2V0ID8gMSA6IDApXG5cdFx0XHR9O1xuXG5cdFx0XHRjYXB0dXJlX3Njcm9sbChjdXJyZW50X2hpc3RvcnlfaW5kZXgpO1xuXG5cdFx0XHR1cGRhdGVfdXJsKHVybCk7XG5cblx0XHRcdGlmICghb3B0aW9ucy5yZXBsYWNlX3N0YXRlKSByZXR1cm47XG5cblx0XHRcdC8vIGhhc2hjaGFuZ2UgZXZlbnQgc2hvdWxkbid0IG9jY3VyIGlmIHRoZSByb3V0ZXIgaXMgcmVwbGFjaW5nIHN0YXRlLlxuXHRcdFx0aGFzaF9uYXZpZ2F0aW5nID0gbnVsbDtcblx0XHR9XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0Ly8gYWxsb3cgdGhlIGJyb3dzZXIgdG8gcmVwYWludCBiZWZvcmUgbmF2aWdhdGluZyDigJRcblx0XHQvLyB0aGlzIHByZXZlbnRzIElOUCBzY29yZXMgYmVpbmcgcGVuYWxpc2VkXG5cdFx0YXdhaXQgbmV3IFByb21pc2UoKGZ1bGZpbCkgPT4ge1xuXHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblx0XHRcdFx0c2V0VGltZW91dChmdWxmaWwsIDApO1xuXHRcdFx0fSk7XG5cblx0XHRcdHNldFRpbWVvdXQoZnVsZmlsLCAxMDApOyAvLyBmYWxsYmFjayBmb3IgZWRnZSBjYXNlIHdoZXJlIHJBRiBkb2Vzbid0IGZpcmUgYmVjYXVzZSBlLmcuIHRhYiB3YXMgYmFja2dyb3VuZGVkXG5cdFx0fSk7XG5cblx0XHRjb25zdCBjaGFuZ2VkID0gdXJsLmhyZWYgIT09IGxvY2F0aW9uLmhyZWY7XG5cblx0XHRhd2FpdCBfZ290byh1cmwsIHtcblx0XHRcdHR5cGU6ICdsaW5rJyxcblx0XHRcdHJlc2V0OiBvcHRpb25zLnJlc2V0LFxuXHRcdFx0cmVwbGFjZTogb3B0aW9ucy5yZXBsYWNlX3N0YXRlID8/ICFjaGFuZ2VkLFxuXHRcdFx0cmVmcmVzaEFsbDogIWNoYW5nZWQsXG5cdFx0XHRldmVudFxuXHRcdH0pO1xuXHR9KTtcblxuXHRjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgKGV2ZW50KSA9PiB7XG5cdFx0aWYgKGV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHJldHVybjtcblxuXHRcdGNvbnN0IGZvcm0gPSAvKiogQHR5cGUge0hUTUxGb3JtRWxlbWVudH0gKi8gKFxuXHRcdFx0SFRNTEZvcm1FbGVtZW50LnByb3RvdHlwZS5jbG9uZU5vZGUuY2FsbChldmVudC50YXJnZXQpXG5cdFx0KTtcblxuXHRcdGNvbnN0IHN1Ym1pdHRlciA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnQgfCBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbH0gKi8gKGV2ZW50LnN1Ym1pdHRlcik7XG5cblx0XHRjb25zdCB0YXJnZXQgPSBzdWJtaXR0ZXI/LmZvcm1UYXJnZXQgfHwgZm9ybS50YXJnZXQ7XG5cblx0XHRpZiAodGFyZ2V0ID09PSAnX2JsYW5rJykgcmV0dXJuO1xuXG5cdFx0Y29uc3QgbWV0aG9kID0gc3VibWl0dGVyPy5mb3JtTWV0aG9kIHx8IGZvcm0ubWV0aG9kO1xuXG5cdFx0aWYgKG1ldGhvZCAhPT0gJ2dldCcpIHJldHVybjtcblxuXHRcdC8vIEl0IGlzIGltcG9zc2libGUgdG8gdXNlIGZvcm0gYWN0aW9ucyB3aXRoIGhhc2ggcm91dGVyLCBzbyB3ZSBqdXN0IGlnbm9yZSBoYW5kbGluZyB0aGVtIGhlcmVcblx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKFxuXHRcdFx0KHN1Ym1pdHRlcj8uaGFzQXR0cmlidXRlKCdmb3JtYWN0aW9uJykgJiYgc3VibWl0dGVyPy5mb3JtQWN0aW9uKSB8fCBmb3JtLmFjdGlvblxuXHRcdCk7XG5cblx0XHRpZiAoaXNfZXh0ZXJuYWxfdXJsKHVybCwgYmFzZSwgZmFsc2UpKSByZXR1cm47XG5cblx0XHRjb25zdCBldmVudF9mb3JtID0gLyoqIEB0eXBlIHtIVE1MRm9ybUVsZW1lbnR9ICovIChldmVudC50YXJnZXQpO1xuXG5cdFx0Y29uc3Qgb3B0aW9ucyA9IGdldF9yb3V0ZXJfb3B0aW9ucyhldmVudF9mb3JtKTtcblx0XHRpZiAob3B0aW9ucy5yZWxvYWQpIHJldHVybjtcblxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHRjb25zdCBkYXRhID0gbmV3IEZvcm1EYXRhKGV2ZW50X2Zvcm0sIHN1Ym1pdHRlcik7XG5cblx0XHQvLyBAdHMtZXhwZWN0LWVycm9yIGBVUkxTZWFyY2hQYXJhbXMoZmQpYCBpcyBrb3NoZXIsIGJ1dCB0eXBlc2NyaXB0IGRvZXNuJ3Qga25vdyB0aGF0XG5cdFx0dXJsLnNlYXJjaCA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoZGF0YSkudG9TdHJpbmcoKTtcblxuXHRcdHZvaWQgbmF2aWdhdGUoe1xuXHRcdFx0dHlwZTogJ2Zvcm0nLFxuXHRcdFx0dXJsLFxuXHRcdFx0cmVzZXQ6IG9wdGlvbnMucmVzZXQsXG5cdFx0XHRyZXBsYWNlX3N0YXRlOiBvcHRpb25zLnJlcGxhY2Vfc3RhdGUgPz8gdXJsLmhyZWYgPT09IGxvY2F0aW9uLmhyZWYsXG5cdFx0XHRldmVudFxuXHRcdH0pO1xuXHR9KTtcblxuXHRhZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIGFzeW5jIChldmVudCkgPT4ge1xuXHRcdGNvbnN0IGhpc3RvcnlfbWV0YWRhdGEgPSBnZXRfaGlzdG9yeV9tZXRhZGF0YShldmVudC5zdGF0ZSk7XG5cblx0XHRpZiAoaGlzdG9yeV9tZXRhZGF0YT8uaGlzdG9yeUluZGV4KSB7XG5cdFx0XHRjb25zdCBoaXN0b3J5X2luZGV4ID0gaGlzdG9yeV9tZXRhZGF0YS5oaXN0b3J5SW5kZXg7XG5cdFx0XHRjb25zdCBzb3VyY2VfaW5mbyA9IGhpc3RvcnlfaW5mb1tjdXJyZW50X2hpc3RvcnlfaW5kZXhdO1xuXG5cdFx0XHQvLyBpZiBhIHBvcHN0YXRlLWRyaXZlbiBuYXZpZ2F0aW9uIGlzIGNhbmNlbGxlZCwgd2UgbmVlZCB0byBjb3VudGVyYWN0IGl0XG5cdFx0XHQvLyB3aXRoIGhpc3RvcnkuZ28sIHdoaWNoIG1lYW5zIHdlIGVuZCB1cCBiYWNrIGhlcmUsIGhlbmNlIHRoaXMgY2hlY2tcblx0XHRcdGlmIChoaXN0b3J5X2luZGV4ID09PSBjdXJyZW50X2hpc3RvcnlfaW5kZXgpIHJldHVybjtcblxuXHRcdFx0bmF2aWdhdGlvbl90b2tlbiA9IGludmFsaWRhdGlvbl90b2tlbiA9IHt9O1xuXG5cdFx0XHRjb25zdCBkZWx0YSA9IGhpc3RvcnlfaW5kZXggLSBjdXJyZW50X2hpc3RvcnlfaW5kZXg7XG5cdFx0XHRjb25zdCByZXNldF9pbmRleCA9IGhpc3RvcnlfbWV0YWRhdGEucmVzZXRJbmRleDtcblx0XHRcdGNvbnN0IHJlc2V0ID0gcmVzZXRfaW5kZXggIT09IChzb3VyY2VfaW5mbz8ucmVzZXRJbmRleCA/PyBjdXJyZW50X3Jlc2V0X2luZGV4KTtcblx0XHRcdGNvbnN0IHNjcm9sbCA9IGhpc3RvcnlfaW5mb1toaXN0b3J5X2luZGV4XT8uc2Nyb2xsO1xuXHRcdFx0Y29uc3Qgc3RhdGUgPSBwYXJzZShoaXN0b3J5X21ldGFkYXRhLnN0YXRlKTtcblx0XHRcdGNvbnN0IHVybCA9IG5ldyBVUkwoaGlzdG9yeV9tZXRhZGF0YS5wYWdlVXJsID8/IGxvY2F0aW9uLmhyZWYpO1xuXHRcdFx0Y29uc3QgbmF2aWdhdGlvbl9pbmRleCA9IGhpc3RvcnlfbWV0YWRhdGEubmF2aWdhdGlvbkluZGV4O1xuXHRcdFx0Y29uc3QgaXNfaGFzaF9jaGFuZ2UgPVxuXHRcdFx0XHRjdXJyZW50LnVybCAmJiAobG9jYXRpb24uaHJlZiArIGN1cnJlbnQudXJsLmhyZWYpLmluY2x1ZGVzKCcjJykgLy8gY2hlY2sgaWYgZXZlbiBoYXMgYSBoYXNoXG5cdFx0XHRcdFx0PyBzdHJpcF9oYXNoKGxvY2F0aW9uKSA9PT0gc3RyaXBfaGFzaChjdXJyZW50LnVybClcblx0XHRcdFx0XHQ6IGZhbHNlO1xuXHRcdFx0Y29uc3Qgc2hhbGxvdyA9XG5cdFx0XHRcdG5hdmlnYXRpb25faW5kZXggPT09IGN1cnJlbnRfbmF2aWdhdGlvbl9pbmRleCAmJlxuXHRcdFx0XHQoKGhhc19uYXZpZ2F0ZWQgJiZcblx0XHRcdFx0XHQoaGlzdG9yeV9tZXRhZGF0YS5wYWdlVXJsID09PSB1bmRlZmluZWQgfHwgaGlzdG9yeV9tZXRhZGF0YS5wYWdlVXJsID09PSBsb2NhdGlvbi5ocmVmKSkgfHxcblx0XHRcdFx0XHRpc19oYXNoX2NoYW5nZSk7XG5cdFx0XHRjb25zdCBzaGFsbG93X3VybCA9IGhpc3RvcnlfbWV0YWRhdGEucGFnZVVybCA/IG5ldyBVUkwobG9jYXRpb24uaHJlZikgOiBudWxsO1xuXG5cdFx0XHQvLyB0aGUgYnJvd3NlciBoYXMgYWxyZWFkeSB0cmF2ZXJzZWQsIHNvIHJlY29yZCB0aGUgc291cmNlIGVudHJ5IGFuZCBtb3ZlIHRoZVxuXHRcdFx0Ly8gaW5kaWNlcyBiZWZvcmUgYW55dGhpbmcgYXN5bmM6IGEgbmF2aWdhdGlvbiB0aGF0IHN0YXJ0cyB3aGlsZSB0aGlzIG9uZVxuXHRcdFx0Ly8gcmVzb2x2ZXMgbXVzdCBidWlsZCBvbiB0aGUgZW50cnkgd2UgYXJlIGFjdHVhbGx5IG9uXG5cdFx0XHRjb25zdCBwcmV2aW91c19oaXN0b3J5X2luZGV4ID0gY3VycmVudF9oaXN0b3J5X2luZGV4O1xuXHRcdFx0Y29uc3QgcHJldmlvdXNfbmF2aWdhdGlvbl9pbmRleCA9IGN1cnJlbnRfbmF2aWdhdGlvbl9pbmRleDtcblx0XHRcdGNvbnN0IHByZXZpb3VzX3Jlc2V0X2luZGV4ID0gY3VycmVudF9yZXNldF9pbmRleDtcblx0XHRcdGNhcHR1cmVfc2Nyb2xsKHByZXZpb3VzX2hpc3RvcnlfaW5kZXgpO1xuXHRcdFx0aWYgKCFzaGFsbG93KSBjYXB0dXJlX3NuYXBzaG90KHByZXZpb3VzX25hdmlnYXRpb25faW5kZXgpO1xuXHRcdFx0Y2FwdHVyZV9uYXZpZ2F0aW9uX3NuYXBzaG90KHByZXZpb3VzX2hpc3RvcnlfaW5kZXgpO1xuXHRcdFx0Y3VycmVudF9oaXN0b3J5X2luZGV4ID0gaGlzdG9yeV9pbmRleDtcblx0XHRcdGN1cnJlbnRfbmF2aWdhdGlvbl9pbmRleCA9IG5hdmlnYXRpb25faW5kZXg7XG5cdFx0XHRjdXJyZW50X3Jlc2V0X2luZGV4ID0gcmVzZXRfaW5kZXg7XG5cblx0XHRcdGNvbnN0IHRva2VuID0gbmF2aWdhdGlvbl90b2tlbjtcblx0XHRcdGNvbnN0IHNoYWxsb3dfaW50ZW50ID0gc2hhbGxvd191cmxcblx0XHRcdFx0PyBhd2FpdCBnZXRfbmF2aWdhdGlvbl9pbnRlbnQoc2hhbGxvd191cmwsIGZhbHNlKVxuXHRcdFx0XHQ6IHVuZGVmaW5lZDtcblx0XHRcdGlmIChuYXZpZ2F0aW9uX3Rva2VuICE9PSB0b2tlbikgcmV0dXJuO1xuXHRcdFx0Y29uc3Qgc2hhbGxvd190YXJnZXQgPSBzaGFsbG93X3VybFxuXHRcdFx0XHQ/IHtcblx0XHRcdFx0XHRcdHBhcmFtczogc2hhbGxvd19pbnRlbnQ/LnBhcmFtcyA/PyBudWxsLFxuXHRcdFx0XHRcdFx0cm91dGU6IHNoYWxsb3dfaW50ZW50ID8geyBpZDogc2hhbGxvd19pbnRlbnQucm91dGUuaWQgfSA6IG51bGwsXG5cdFx0XHRcdFx0XHR1cmw6IHNoYWxsb3dfdXJsXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHQ6IG51bGw7XG5cblx0XHRcdGlmIChzaGFsbG93KSB7XG5cdFx0XHRcdC8vIFdlIGRvbid0IG5lZWQgdG8gbmF2aWdhdGUsIHdlIGp1c3QgbmVlZCB0byB1cGRhdGUgc2Nyb2xsIGFuZC9vciBzdGF0ZS5cblx0XHRcdFx0Ly8gVGhpcyBoYXBwZW5zIHdpdGggaGFzaCBsaW5rcyBhbmQgYHB1c2hTdGF0ZWAvYHJlcGxhY2VTdGF0ZWAuIFRoZVxuXHRcdFx0XHQvLyBleGNlcHRpb24gaXMgaWYgd2UgaGF2ZW4ndCBuYXZpZ2F0ZWQgeWV0LCBzaW5jZSB3ZSBjb3VsZCBoYXZlXG5cdFx0XHRcdC8vIGdvdCBoZXJlIGFmdGVyIGEgbW9kYWwgbmF2aWdhdGlvbiB0aGVuIGEgcmVsb2FkXG5cblx0XHRcdFx0Ymx1cl9hY3RpdmVfZWxlbWVudChyZXNldCk7XG5cblx0XHRcdFx0dXBkYXRlX3BhZ2Uoe1xuXHRcdFx0XHRcdHN0YXRlLFxuXHRcdFx0XHRcdHNoYWxsb3c6IHNoYWxsb3dfdGFyZ2V0XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHVwZGF0ZV91cmwodXJsKTtcblxuXHRcdFx0XHRpZiAocmVzZXQgJiYgc2Nyb2xsKSBzY3JvbGxUbyhzY3JvbGwueCwgc2Nyb2xsLnkpO1xuXHRcdFx0XHRyZXN0b3JlX25hdmlnYXRpb25fc25hcHNob3QoY3VycmVudF9oaXN0b3J5X2luZGV4LCBjdXJyZW50X3JlZ2lzdHJhdGlvbnMoKSk7XG5cdFx0XHRcdC8vIHRoZSB0b2tlbiBhYm92ZSBhYm9ydGVkIGFueSBpbi1mbGlnaHQgbmF2aWdhdGlvbiwgYW5kIG5vdGhpbmcgZWxzZSB3aWxsIGNsZWFyIGl0XG5cdFx0XHRcdGlzX25hdmlnYXRpbmcgPSBmYWxzZTtcblx0XHRcdFx0c2V0X25hdmlnYXRpb24obnVsbCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgbmF2aWdhdGUoe1xuXHRcdFx0XHR0eXBlOiAncG9wc3RhdGUnLFxuXHRcdFx0XHR1cmwsXG5cdFx0XHRcdHJlc2V0LFxuXHRcdFx0XHRwb3BwZWQ6IHtcblx0XHRcdFx0XHRzdGF0ZSxcblx0XHRcdFx0XHRzY3JvbGwsXG5cdFx0XHRcdFx0ZGVsdGEsXG5cdFx0XHRcdFx0c2hhbGxvdzogc2hhbGxvd190YXJnZXRcblx0XHRcdFx0fSxcblx0XHRcdFx0YmxvY2s6ICgpID0+IHtcblx0XHRcdFx0XHRjdXJyZW50X2hpc3RvcnlfaW5kZXggPSBwcmV2aW91c19oaXN0b3J5X2luZGV4O1xuXHRcdFx0XHRcdGN1cnJlbnRfbmF2aWdhdGlvbl9pbmRleCA9IHByZXZpb3VzX25hdmlnYXRpb25faW5kZXg7XG5cdFx0XHRcdFx0Y3VycmVudF9yZXNldF9pbmRleCA9IHByZXZpb3VzX3Jlc2V0X2luZGV4O1xuXHRcdFx0XHRcdGhpc3RvcnkuZ28oLWRlbHRhKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0bmF2X3Rva2VuOiB0b2tlbixcblx0XHRcdFx0ZXZlbnRcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBzaW5jZSBwb3BzdGF0ZSBldmVudCBpcyBhbHNvIGVtaXR0ZWQgd2hlbiBhbiBhbmNob3IgcmVmZXJlbmNpbmcgdGhlIHNhbWVcblx0XHRcdC8vIGRvY3VtZW50IGlzIGNsaWNrZWQsIHdlIGhhdmUgdG8gY2hlY2sgdGhhdCB0aGUgcm91dGVyIGlzbid0IGFscmVhZHkgaGFuZGxpbmdcblx0XHRcdC8vIHRoZSBuYXZpZ2F0aW9uLiBvdGhlcndpc2Ugd2Ugd291bGQgYmUgdXBkYXRpbmcgdGhlIHBhZ2Ugc3RvcmUgdHdpY2UuXG5cdFx0XHRpZiAoIWhhc2hfbmF2aWdhdGluZykge1xuXHRcdFx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuXHRcdFx0XHR1cGRhdGVfdXJsKHVybCk7XG5cblx0XHRcdFx0Ly8gaWYgdGhlIHVzZXIgZWRpdHMgdGhlIGhhc2ggdmlhIHRoZSBicm93c2VyIFVSTCBiYXIsIHRyaWdnZXIgYSBmdWxsLXBhZ2Vcblx0XHRcdFx0Ly8gcmVsb2FkIHRvIGFsaWduIHdpdGggcGF0aG5hbWUgcm91dGVyIGJlaGF2aW9yXG5cdFx0XHRcdGlmIChhcHAuaGFzaCkge1xuXHRcdFx0XHRcdGxvY2F0aW9uLnJlbG9hZCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxuXHRhZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgKCkgPT4ge1xuXHRcdC8vIGlmIHRoZSBoYXNoY2hhbmdlIGhhcHBlbmVkIGFzIGEgcmVzdWx0IG9mIGNsaWNraW5nIG9uIGEgbGluayxcblx0XHQvLyB3ZSBuZWVkIHRvIHVwZGF0ZSBoaXN0b3J5LCBvdGhlcndpc2Ugd2UgaGF2ZSB0byBsZWF2ZSBpdCBhbG9uZVxuXHRcdGlmIChoYXNoX25hdmlnYXRpbmcpIHtcblx0XHRcdGNvbnN0IGhpc3RvcnlfbWV0YWRhdGEgPSBoYXNoX25hdmlnYXRpbmc7XG5cdFx0XHRoYXNoX25hdmlnYXRpbmcgPSBudWxsO1xuXHRcdFx0Y3VycmVudF9yZXNldF9pbmRleCA9IGhpc3RvcnlfbWV0YWRhdGEucmVzZXRJbmRleDtcblx0XHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Li4uaGlzdG9yeS5zdGF0ZSxcblx0XHRcdFx0XHRbSElTVE9SWV9NRVRBREFUQV9LRVldOiB7XG5cdFx0XHRcdFx0XHQuLi5oaXN0b3J5X21ldGFkYXRhLFxuXHRcdFx0XHRcdFx0aGlzdG9yeUluZGV4OiArK2N1cnJlbnRfaGlzdG9yeV9pbmRleCxcblx0XHRcdFx0XHRcdG5hdmlnYXRpb25JbmRleDogY3VycmVudF9uYXZpZ2F0aW9uX2luZGV4XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHQnJyxcblx0XHRcdFx0bG9jYXRpb24uaHJlZlxuXHRcdFx0KTtcblx0XHRcdHNldF9oaXN0b3J5X29wdGlvbnMoY3VycmVudF9oaXN0b3J5X2luZGV4LCBoaXN0b3J5X21ldGFkYXRhKTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIGZpeCBsaW5rW3JlbD1pY29uXSwgYmVjYXVzZSBicm93c2VycyB3aWxsIG9jY2FzaW9uYWxseSB0cnkgdG8gbG9hZCByZWxhdGl2ZVxuXHQvLyBVUkxzIGFmdGVyIGEgcHVzaFN0YXRlL3JlcGxhY2VTdGF0ZSwgcmVzdWx0aW5nIGluIGEgNDA0IOKAlCBzZWVcblx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3N2ZWx0ZWpzL2tpdC9pc3N1ZXMvMzc0OCNpc3N1ZWNvbW1lbnQtMTEyNTk4MDg5N1xuXHRmb3IgKGNvbnN0IGxpbmsgb2YgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnbGluaycpKSB7XG5cdFx0aWYgKElDT05fUkVMX0FUVFJJQlVURVMuaGFzKGxpbmsucmVsKSkge1xuXHRcdFx0bGluay5ocmVmID0gbGluay5ocmVmOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cdFx0fVxuXHR9XG5cblx0YWRkRXZlbnRMaXN0ZW5lcigncGFnZXNob3cnLCAoZXZlbnQpID0+IHtcblx0XHQvLyBJZiB0aGUgdXNlciBuYXZpZ2F0ZXMgdG8gYW5vdGhlciBzaXRlIGFuZCB0aGVuIHVzZXMgdGhlIGJhY2sgYnV0dG9uIGFuZFxuXHRcdC8vIGJmY2FjaGUgaGl0cywgd2UgbmVlZCB0byBzZXQgbmF2aWdhdGluZyB0byBudWxsLCB0aGUgc2l0ZSBkb2Vzbid0IGtub3dcblx0XHQvLyB0aGUgbmF2aWdhdGlvbiBhd2F5IGZyb20gaXQgd2FzIHN1Y2Nlc3NmdWwuXG5cdFx0Ly8gSW5mbyBhYm91dCBiZmNhY2hlIGhlcmU6IGh0dHBzOi8vd2ViLmRldi9iZmNhY2hlXG5cdFx0aWYgKGV2ZW50LnBlcnNpc3RlZCkge1xuXHRcdFx0c2V0X25hdmlnYXRpb24obnVsbCk7XG5cblx0XHRcdC8vIHBhZ2VzIHJlc3RvcmVkIGZyb20gYmZjYWNoZSBkb24ndCByZS1ydW4gdGhlIGBzdGFydGAgc2NyaXB0XG5cdFx0XHQvLyBzbyB3ZSBuZWVkIHRvIHJlc3RvcmUgdGhlIHNjcm9sbCBwb3NpdGlvbiBtYW51YWxseSBoZXJlXG5cdFx0XHRjb25zdCBzY3JvbGwgPSBoaXN0b3J5X2luZm9bY3VycmVudF9oaXN0b3J5X2luZGV4XT8uc2Nyb2xsO1xuXHRcdFx0aWYgKHNjcm9sbCkge1xuXHRcdFx0XHRzY3JvbGxUbyhzY3JvbGwueCwgc2Nyb2xsLnkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7VVJMfSB1cmxcblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZV91cmwodXJsKSB7XG5cdFx0Y3VycmVudC51cmwgPSB1cmw7XG5cdFx0dXBkYXRlX3BhZ2UoeyB1cmwgfSk7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXRcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL3R5cGVzLmpzJykuSHlkcmF0ZU9wdGlvbnN9IG9wdHNcbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICovXG5hc3luYyBmdW5jdGlvbiBfaHlkcmF0ZShcblx0dGFyZ2V0LFxuXHR7IHN0YXR1cywgZXJyb3IsIG5vZGVfaWRzLCBwYXJhbXMsIHJvdXRlLCBzZXJ2ZXJfcm91dGUsIGRhdGE6IHNlcnZlcl9kYXRhX25vZGVzLCBmb3JtIH1cbikge1xuXHRoeWRyYXRlZCA9IHRydWU7XG5cblx0Y29uc3QgdXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblxuXHQvKiogQHR5cGUge2ltcG9ydCgndHlwZXMnKS5DU1JSb3V0ZSB8IHVuZGVmaW5lZH0gKi9cblx0bGV0IHBhcnNlZF9yb3V0ZTtcblxuXHRpZiAoX19TVkVMVEVLSVRfQ0xJRU5UX1JPVVRJTkdfXykge1xuXHRcdGlmICghX19TVkVMVEVLSVRfRU1CRURERURfXykge1xuXHRcdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9raXQvcHVsbC80OTM1I2lzc3VlY29tbWVudC0xMzI4MDkzMzU4IGZvciBvbmUgbW90aXZhdGlvblxuXHRcdFx0Ly8gb2YgZGV0ZXJtaW5pbmcgdGhlIHBhcmFtcyBvbiB0aGUgY2xpZW50IHNpZGUuXG5cdFx0XHQoeyBwYXJhbXMgPSB7fSwgcm91dGUgPSB7IGlkOiBudWxsIH0gfSA9IChhd2FpdCBnZXRfbmF2aWdhdGlvbl9pbnRlbnQodXJsLCBmYWxzZSkpIHx8IHt9KTtcblx0XHR9XG5cblx0XHRwYXJzZWRfcm91dGUgPSByb3V0ZXMuZmluZCgoeyBpZCB9KSA9PiBpZCA9PT0gcm91dGUuaWQpO1xuXHR9IGVsc2Uge1xuXHRcdC8vIHVuZGVmaW5lZCBpbiBjYXNlIG9mIDQwNFxuXHRcdGlmIChzZXJ2ZXJfcm91dGUpIHtcblx0XHRcdHBhcnNlZF9yb3V0ZSA9IHJvdXRlID0gcGFyc2VfYW5kX2NhY2hlX3NlcnZlcl9yb3V0ZShzZXJ2ZXJfcm91dGUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyb3V0ZSA9IHsgaWQ6IG51bGwgfTtcblx0XHRcdHBhcmFtcyA9IHt9O1xuXHRcdH1cblx0fVxuXG5cdC8qKiBAdHlwZSB7aW1wb3J0KCcuL3R5cGVzLmpzJykuTmF2aWdhdGlvbkZpbmlzaGVkIHwgdW5kZWZpbmVkfSAqL1xuXHRsZXQgcmVzdWx0O1xuXHRsZXQgc2hvdWxkX2h5ZHJhdGUgPSB0cnVlO1xuXG5cdHRyeSB7XG5cdFx0Y29uc3QgYnJhbmNoX3Byb21pc2VzID0gbm9kZV9pZHMubWFwKGFzeW5jIChuLCBpKSA9PiB7XG5cdFx0XHRjb25zdCBzZXJ2ZXJfZGF0YV9ub2RlID0gc2VydmVyX2RhdGFfbm9kZXNbaV07XG5cdFx0XHQvLyBUeXBlIGlzbid0IGNvbXBsZXRlbHkgYWNjdXJhdGUsIHdlIHN0aWxsIG5lZWQgdG8gZGVzZXJpYWxpemUgdXNlc1xuXHRcdFx0aWYgKHNlcnZlcl9kYXRhX25vZGU/LnVzZXMpIHtcblx0XHRcdFx0c2VydmVyX2RhdGFfbm9kZS51c2VzID0gZGVzZXJpYWxpemVfdXNlcyhzZXJ2ZXJfZGF0YV9ub2RlLnVzZXMpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbG9hZF9ub2RlKHtcblx0XHRcdFx0bG9hZGVyOiBhcHAubm9kZXNbbl0sXG5cdFx0XHRcdHVybCxcblx0XHRcdFx0cGFyYW1zLFxuXHRcdFx0XHRyb3V0ZSxcblx0XHRcdFx0cGFyZW50OiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgZGF0YSA9IHt9O1xuXHRcdFx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgaTsgaiArPSAxKSB7XG5cdFx0XHRcdFx0XHRPYmplY3QuYXNzaWduKGRhdGEsIChhd2FpdCBicmFuY2hfcHJvbWlzZXNbal0pLmRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gZGF0YTtcblx0XHRcdFx0fSxcblx0XHRcdFx0c2VydmVyX2RhdGFfbm9kZTogY3JlYXRlX2RhdGFfbm9kZShzZXJ2ZXJfZGF0YV9ub2RlKVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvKiogQHR5cGUge0FycmF5PGltcG9ydCgnLi90eXBlcy5qcycpLkJyYW5jaE5vZGUgfCB1bmRlZmluZWQ+fSAqL1xuXHRcdGNvbnN0IGJyYW5jaCA9IGF3YWl0IFByb21pc2UuYWxsKGJyYW5jaF9wcm9taXNlcyk7XG5cblx0XHQvLyBzZXJ2ZXItc2lkZSB3aWxsIGhhdmUgY29tcGFjdGVkIHRoZSBicmFuY2gsIHJlaW5zdGF0ZSBlbXB0eSBzbG90c1xuXHRcdC8vIHNvIHRoYXQgZXJyb3IgYm91bmRhcmllcyBjYW4gYmUgbGluZWQgdXAgY29ycmVjdGx5XG5cdFx0aWYgKHBhcnNlZF9yb3V0ZSkge1xuXHRcdFx0Y29uc3QgbGF5b3V0cyA9IHBhcnNlZF9yb3V0ZS5sYXlvdXRzO1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsYXlvdXRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICghbGF5b3V0c1tpXSkge1xuXHRcdFx0XHRcdGJyYW5jaC5zcGxpY2UoaSwgMCwgdW5kZWZpbmVkKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJlc3VsdCA9IGF3YWl0IGdldF9uYXZpZ2F0aW9uX3Jlc3VsdF9mcm9tX2JyYW5jaCh7XG5cdFx0XHR1cmwsXG5cdFx0XHRwYXJhbXMsXG5cdFx0XHRicmFuY2gsXG5cdFx0XHRzdGF0dXMsXG5cdFx0XHRlcnJvcixcblx0XHRcdGVycm9yczogcGFyc2VkX3JvdXRlPy5lcnJvcnMsIC8vIFRPRE8gbG9hZCBlYXJsaWVyP1xuXHRcdFx0Zm9ybSxcblx0XHRcdHJvdXRlOiBwYXJzZWRfcm91dGUgPz8gbnVsbFxuXHRcdH0pO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdGlmIChlcnJvciBpbnN0YW5jZW9mIFJlZGlyZWN0KSB7XG5cdFx0XHQvLyB0aGlzIGlzIGEgcmVhbCBlZGdlIGNhc2Ug4oCUIGBsb2FkYCB3b3VsZCBuZWVkIHRvIHJldHVyblxuXHRcdFx0Ly8gYSByZWRpcmVjdCBidXQgb25seSBpbiB0aGUgYnJvd3NlclxuXHRcdFx0cmV0dXJuIGF3YWl0IG5hdGl2ZV9uYXZpZ2F0aW9uKG5ldyBVUkwoZXJyb3IubG9jYXRpb24sIGxvY2F0aW9uLmhyZWYpKTtcblx0XHR9XG5cblx0XHRjb25zdCBoYW5kbGVkX2Vycm9yID0gYXdhaXQgaGFuZGxlX2Vycm9yKGVycm9yLCB7IHVybCwgcGFyYW1zLCByb3V0ZSB9KTtcblxuXHRcdHJlc3VsdCA9IGF3YWl0IGxvYWRfcm9vdF9lcnJvcl9wYWdlKHtcblx0XHRcdGVycm9yOiBoYW5kbGVkX2Vycm9yLFxuXHRcdFx0dXJsLFxuXHRcdFx0cm91dGVcblx0XHR9KTtcblxuXHRcdHRhcmdldC50ZXh0Q29udGVudCA9ICcnO1xuXHRcdHNob3VsZF9oeWRyYXRlID0gZmFsc2U7XG5cdH1cblxuXHQvLyBFeGl0IGVhcmx5IHdoZW4gd2UgZW5jb3VudGVyIGEgcmVkaXJlY3Qgd2hpbGUgbG9hZGluZyB0aGUgcm9vdCBlcnJvciBwYWdlLlxuXHQvLyBJbiB0aGlzIGNhc2UsIGBpbml0aWFsaXplYCB3aWxsIGJlIGNhbGxlZCBsYXRlciBvblxuXHRpZiAoIXJlc3VsdCkgcmV0dXJuO1xuXG5cdGlmIChyZXN1bHQucHJvcHMucGFnZSkge1xuXHRcdGNvbnN0IGhpc3RvcnlfbWV0YWRhdGEgPSBnZXRfaGlzdG9yeV9tZXRhZGF0YSgpO1xuXHRcdHJlc3VsdC5wcm9wcy5wYWdlLnN0YXRlID0gaGlzdG9yeV9tZXRhZGF0YT8ucGVyc2lzdFN0YXRlID8gcGFyc2UoaGlzdG9yeV9tZXRhZGF0YS5zdGF0ZSkgOiB7fTtcblx0fVxuXG5cdGF3YWl0IGluaXRpYWxpemUocmVzdWx0LCB0YXJnZXQsIHNob3VsZF9oeWRyYXRlKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VSTH0gdXJsXG4gKiBAcGFyYW0ge2Jvb2xlYW5bXX0gaW52YWxpZFxuICogQHJldHVybnMge1Byb21pc2U8aW1wb3J0KCd0eXBlcycpLlNlcnZlck5vZGVzUmVzcG9uc2UgfCBpbXBvcnQoJ3R5cGVzJykuU2VydmVyUmVkaXJlY3ROb2RlPn1cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZF9kYXRhKHVybCwgaW52YWxpZCkge1xuXHRmb3IgKGNvbnN0IGtleSBvZiB1cmwuc2VhcmNoUGFyYW1zLmtleXMoKSkge1xuXHRcdGlmIChrZXkuc3RhcnRzV2l0aCgneC1zdmVsdGVraXQtJykpIHtcblx0XHRcdGUucmVzZXJ2ZWRfcXVlcnlfcGFyYW1ldGVyKHsga2V5IH0pO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGRhdGFfdXJsID0gbmV3IFVSTCh1cmwpO1xuXHRkYXRhX3VybC5wYXRobmFtZSA9IGFkZF9kYXRhX3N1ZmZpeCh1cmwucGF0aG5hbWUpO1xuXHRpZiAodXJsLnBhdGhuYW1lLmVuZHNXaXRoKCcvJykpIHtcblx0XHRkYXRhX3VybC5zZWFyY2hQYXJhbXMuYXBwZW5kKFRSQUlMSU5HX1NMQVNIX1BBUkFNLCAnMScpO1xuXHR9XG5cdGRhdGFfdXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoSU5WQUxJREFURURfUEFSQU0sIGludmFsaWQubWFwKChpKSA9PiAoaSA/ICcxJyA6ICcwJykpLmpvaW4oJycpKTtcblxuXHQvLyB1c2Ugd2luZG93LmZldGNoIGRpcmVjdGx5IHRvIGFsbG93IHVzaW5nIGEgM3JkIHBhcnR5LXBhdGNoZWQgZmV0Y2ggaW1wbGVtZW50YXRpb25cblx0Y29uc3QgZmV0Y2hlciA9IERFViA/IGRldl9mZXRjaCA6IHdpbmRvdy5mZXRjaDtcblx0Y29uc3QgcmVzID0gYXdhaXQgZmV0Y2hlcihkYXRhX3VybC5ocmVmLCB7fSk7XG5cblx0Ly8gZGV0ZWN0IG5ldyBkZXBsb3ltZW50cyBmcm9tIHRoZSByZXNwb25zZSBoZWFkZXJcblx0bm90aWZ5X3ZlcnNpb24ocmVzLmhlYWRlcnMuZ2V0KCd4LXN2ZWx0ZWtpdC12ZXJzaW9uJykpO1xuXG5cdGlmICghcmVzLm9rKSB7XG5cdFx0Ly8gaWYgYF9fZGF0YS5qc29uYCBkb2Vzbid0IGV4aXN0IG9yIHRoZSBzZXJ2ZXIgaGFzIGFuIGludGVybmFsIGVycm9yLFxuXHRcdC8vIGF2b2lkIHBhcnNpbmcgdGhlIEhUTUwgZXJyb3IgcGFnZSBhcyBhIEpTT05cblx0XHQvKiogQHR5cGUge0FwcC5FcnJvcn0gKi9cblx0XHRsZXQgZXJyb3IgPSB7IHN0YXR1czogcmVzLnN0YXR1cywgbWVzc2FnZTogJ0ludGVybmFsIEVycm9yJyB9O1xuXG5cdFx0aWYgKHJlcy5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJyk/LmluY2x1ZGVzKCdhcHBsaWNhdGlvbi9qc29uJykpIHtcblx0XHRcdGVycm9yID0geyBzdGF0dXM6IHJlcy5zdGF0dXMsIC4uLihhd2FpdCByZXMuanNvbigpKSB9O1xuXHRcdH0gZWxzZSBpZiAocmVzLnN0YXR1cyA9PT0gNDA0KSB7XG5cdFx0XHRlcnJvci5tZXNzYWdlID0gJ05vdCBGb3VuZCc7XG5cdFx0fVxuXG5cdFx0dGhyb3cgbmV3IEhhbmRsZWRIdHRwRXJyb3IoZXJyb3IpO1xuXHR9XG5cblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRwcm9jZXNzX3N0cmVhbShyZXNvbHZlLCByZXMpLmNhdGNoKHJlamVjdCk7XG5cdH0pO1xuXG5cdC8vIFRPRE8gZWRnZSBjYXNlIGhhbmRsaW5nIG5lY2Vzc2FyeT8gc3RyZWFtKCkgcmVhZCBmYWlscz9cbn1cblxuLyoqXG4gKiBAcGFyYW0geyh2YWx1ZTogU2VydmVyTm9kZXNSZXNwb25zZSB8IFNlcnZlclJlZGlyZWN0Tm9kZSkgPT4gdm9pZH0gcmVzb2x2ZVxuICogQHBhcmFtIHtSZXNwb25zZX0gcmVzXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc19zdHJlYW0ocmVzb2x2ZSwgcmVzKSB7XG5cdGNvbnN0IHJlYWRlciA9IC8qKiBAdHlwZSB7UmVhZGFibGVTdHJlYW08VWludDhBcnJheT59ICovIChyZXMuYm9keSkuZ2V0UmVhZGVyKCk7XG5cblx0LyoqXG5cdCAqIE1hcCBvZiBkZWZlcnJlZCBwcm9taXNlcyB0aGF0IHdpbGwgYmUgcmVzb2x2ZWQgYnkgYSBzdWJzZXF1ZW50IGNodW5rIG9mIGRhdGFcblx0ICogQHR5cGUge01hcDxzdHJpbmcsIGltcG9ydCgndHlwZXMnKS5EZWZlcnJlZD59XG5cdCAqL1xuXHRjb25zdCBkZWZlcnJlZHMgPSBuZXcgTWFwKCk7XG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7YW55fSBkYXRhXG5cdCAqL1xuXHRmdW5jdGlvbiBkZXNlcmlhbGl6ZShkYXRhKSB7XG5cdFx0cmV0dXJuIGRldmFsdWUudW5mbGF0dGVuKGRhdGEsIHtcblx0XHRcdC4uLmFwcC5kZWNvZGVycyxcblx0XHRcdFByb21pc2U6IChpZCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKGZ1bGZpbCwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdFx0ZGVmZXJyZWRzLnNldChpZCwgeyBmdWxmaWwsIHJlamVjdCB9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRmb3IgYXdhaXQgKGNvbnN0IG5vZGUgb2YgcmVhZF9uZGpzb24ocmVhZGVyKSkge1xuXHRcdGlmIChub2RlLnR5cGUgPT09ICdyZWRpcmVjdCcpIHtcblx0XHRcdHJldHVybiByZXNvbHZlKG5vZGUpO1xuXHRcdH1cblxuXHRcdGlmIChub2RlLnR5cGUgPT09ICdkYXRhJykge1xuXHRcdFx0Ly8gVGhpcyBpcyB0aGUgZmlyc3QgKGFuZCBwb3NzaWJseSBvbmx5LCBpZiBubyBwZW5kaW5nIHByb21pc2VzKSBjaHVua1xuXHRcdFx0bm9kZS5ub2Rlcz8uZm9yRWFjaCgoLyoqIEB0eXBlIHthbnl9ICovIG5vZGUpID0+IHtcblx0XHRcdFx0aWYgKG5vZGU/LnR5cGUgPT09ICdkYXRhJykge1xuXHRcdFx0XHRcdG5vZGUudXNlcyA9IGRlc2VyaWFsaXplX3VzZXMobm9kZS51c2VzKTtcblx0XHRcdFx0XHRub2RlLmRhdGEgPSBkZXNlcmlhbGl6ZShub2RlLmRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmVzb2x2ZShub2RlKTtcblx0XHR9IGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gJ2NodW5rJykge1xuXHRcdFx0Ly8gVGhpcyBpcyBhIHN1YnNlcXVlbnQgY2h1bmsgY29udGFpbmluZyBkZWZlcnJlZCBkYXRhXG5cdFx0XHRjb25zdCB7IGlkLCBkYXRhLCBlcnJvciB9ID0gbm9kZTtcblx0XHRcdGNvbnN0IGRlZmVycmVkID0gLyoqIEB0eXBlIHtpbXBvcnQoJ3R5cGVzJykuRGVmZXJyZWR9ICovIChkZWZlcnJlZHMuZ2V0KGlkKSk7XG5cdFx0XHRkZWZlcnJlZHMuZGVsZXRlKGlkKTtcblxuXHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChkZXNlcmlhbGl6ZShlcnJvcikpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVmZXJyZWQuZnVsZmlsKGRlc2VyaWFsaXplKGRhdGEpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gdXNlc1xuICogQHJldHVybiB7aW1wb3J0KCd0eXBlcycpLlVzZXN9XG4gKi9cbmZ1bmN0aW9uIGRlc2VyaWFsaXplX3VzZXModXNlcykge1xuXHRyZXR1cm4ge1xuXHRcdGRlcGVuZGVuY2llczogbmV3IFNldCh1c2VzPy5kZXBlbmRlbmNpZXMgPz8gW10pLFxuXHRcdHBhcmFtczogbmV3IFNldCh1c2VzPy5wYXJhbXMgPz8gW10pLFxuXHRcdHBhcmVudDogISF1c2VzPy5wYXJlbnQsXG5cdFx0cm91dGU6ICEhdXNlcz8ucm91dGUsXG5cdFx0dXJsOiAhIXVzZXM/LnVybCxcblx0XHRzZWFyY2hfcGFyYW1zOiBuZXcgU2V0KHVzZXM/LnNlYXJjaF9wYXJhbXMgPz8gW10pXG5cdH07XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIHtOYXZpZ2F0aW9uVHlwZX0gVFxuICogQHBhcmFtIHtpbXBvcnQoJy4vdHlwZXMuanMnKS5OYXZpZ2F0aW9uU3RhdGV9IGN1cnJlbnRcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL3R5cGVzLmpzJykuTmF2aWdhdGlvbkludGVudCB8IHVuZGVmaW5lZH0gaW50ZW50XG4gKiBAcGFyYW0ge1VSTCB8IG51bGx9IHVybFxuICogQHBhcmFtIHtUfSB0eXBlXG4gKiBAcGFyYW0ge3sgeDogbnVtYmVyLCB5OiBudW1iZXIgfSB8IG51bGx9IFt0YXJnZXRfc2Nyb2xsXSBUaGUgc2Nyb2xsIHBvc2l0aW9uIGZvciB0aGUgdGFyZ2V0IChmb3IgcG9wc3RhdGUgbmF2aWdhdGlvbnMpXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtzaGFsbG93XVxuICogQHBhcmFtIHt7IHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IG51bGw7IHJvdXRlOiB7IGlkOiBzdHJpbmcgfSB8IG51bGw7IHVybDogVVJMIH19IFt0YXJnZXRdXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZV9uYXZpZ2F0aW9uKFxuXHRjdXJyZW50LFxuXHRpbnRlbnQsXG5cdHVybCxcblx0dHlwZSxcblx0dGFyZ2V0X3Njcm9sbCA9IG51bGwsXG5cdHNoYWxsb3cgPSBmYWxzZSxcblx0dGFyZ2V0XG4pIHtcblx0LyoqIEB0eXBlIHsodmFsdWU6IGFueSkgPT4gdm9pZH0gKi9cblx0bGV0IGZ1bGZpbDtcblxuXHQvKiogQHR5cGUgeyhlcnJvcjogYW55KSA9PiB2b2lkfSAqL1xuXHRsZXQgcmVqZWN0O1xuXG5cdGNvbnN0IGNvbXBsZXRlID0gbmV3IFByb21pc2UoKGYsIHIpID0+IHtcblx0XHRmdWxmaWwgPSBmO1xuXHRcdHJlamVjdCA9IHI7XG5cdH0pO1xuXG5cdC8vIEhhbmRsZSBhbnkgZXJyb3JzIG9mZi1jaGFpbiBzbyB0aGF0IGl0IGRvZXNuJ3Qgc2hvdyB1cCBhcyBhbiB1bmhhbmRsZWQgcmVqZWN0aW9uXG5cdGNvbXBsZXRlLmNhdGNoKG5vb3ApO1xuXG5cdC8qKiBAdHlwZSB7KE5hdmlnYXRpb24gfCBBZnRlck5hdmlnYXRlKSAmIHsgdHlwZTogVCB9fSAqL1xuXHRjb25zdCBuYXZpZ2F0aW9uID0gLyoqIEB0eXBlIHthbnl9ICovICh7XG5cdFx0ZnJvbToge1xuXHRcdFx0cGFyYW1zOiBjdXJyZW50LnBhcmFtcyxcblx0XHRcdHJvdXRlOiB7IGlkOiBjdXJyZW50LnJvdXRlPy5pZCA/PyBudWxsIH0sXG5cdFx0XHR1cmw6IGN1cnJlbnQudXJsLFxuXHRcdFx0c2Nyb2xsOiBzY3JvbGxfc3RhdGUoKVxuXHRcdH0sXG5cdFx0dG86IHVybCAmJiB7XG5cdFx0XHRwYXJhbXM6IHRhcmdldCA/IHRhcmdldC5wYXJhbXMgOiAoaW50ZW50Py5wYXJhbXMgPz8gbnVsbCksXG5cdFx0XHRyb3V0ZTogeyBpZDogdGFyZ2V0ID8gKHRhcmdldC5yb3V0ZT8uaWQgPz8gbnVsbCkgOiAoaW50ZW50Py5yb3V0ZT8uaWQgPz8gbnVsbCkgfSxcblx0XHRcdHVybDogdGFyZ2V0Py51cmwgPz8gdXJsLFxuXHRcdFx0c2Nyb2xsOiB0YXJnZXRfc2Nyb2xsXG5cdFx0fSxcblx0XHR3aWxsVW5sb2FkOiAhc2hhbGxvdyAmJiAhaW50ZW50LFxuXHRcdHR5cGUsXG5cdFx0c2hhbGxvdyxcblx0XHRjb21wbGV0ZVxuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdG5hdmlnYXRpb24sXG5cdFx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRcdGZ1bGZpbCxcblx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0cmVqZWN0XG5cdH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtVUkx9IHVybFxuICogQHJldHVybnMge1VSTH1cbiAqL1xuZnVuY3Rpb24gZGVjb2RlX2hhc2godXJsKSB7XG5cdGNvbnN0IG5ld191cmwgPSBuZXcgVVJMKHVybCk7XG5cdC8vIFNhZmFyaSwgZm9yIHNvbWUgcmVhc29uLCBkb2VzIGNoYW5nZSAjIHRvICUyMywgd2hlbiBlbnRlcmVkIHRocm91Z2ggdGhlIGFkZHJlc3MgYmFyXG5cdG5ld191cmwuaGFzaCA9IGRlY29kZVVSSUNvbXBvbmVudCh1cmwuaGFzaCk7XG5cdHJldHVybiBuZXdfdXJsO1xufVxuXG5pZiAoREVWKSB7XG5cdGlmIChpbXBvcnQubWV0YS5ob3QpIHtcblx0XHRpbXBvcnQubWV0YS5ob3Qub24oJ3ZpdGU6YmVmb3JlVXBkYXRlJywgKCkgPT4ge1xuXHRcdFx0aWYgKGVycm9yZWQpIHtcblx0XHRcdFx0bG9jYXRpb24ucmVsb2FkKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge05hdmlnYXRpb25GaW5pc2hlZH0gcmVzdWx0XG4gKi9cbmZ1bmN0aW9uIGFwcGx5X25hdmlnYXRpb25fcmVzdWx0KHJlc3VsdCkge1xuXHR1cGRhdGVfcGFnZShyZXN1bHQucHJvcHMucGFnZSk7XG5cblx0cHJvcHMudHJlZS5kYXRhID0gcmVzdWx0LnByb3BzLnRyZWUuZGF0YTtcblx0cHJvcHMudHJlZS5jaGlsZCA9IHJlc3VsdC5wcm9wcy50cmVlLmNoaWxkO1xuXG5cdGlmICgnZm9ybScgaW4gcmVzdWx0LnByb3BzKSB7XG5cdFx0cHJvcHMuZm9ybSA9IHJlc3VsdC5wcm9wcy5mb3JtO1xuXHR9XG5cblx0aWYgKCdlcnJvcicgaW4gcmVzdWx0LnByb3BzKSB7XG5cdFx0cHJvcHMuZXJyb3IgPSByZXN1bHQucHJvcHMuZXJyb3I7XG5cdH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ25VLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNoRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUM3SSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDOUYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3hFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3RFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMxRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ25GLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDcEYsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDNUcs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LEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUN6RSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUN0RSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNO0FBQzNFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUM3RSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSztBQUN2RCxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FB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QUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDOztBQUV2SSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUNyRCxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzs7QUFFeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsU0FBUyxDQUFDLFNBQVM7QUFDdEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxD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QUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLO0FBQzNDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVztBQUMvQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQztBQUNoRCxDQUFDLENBQUM7QUFDRixNQUFNLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXJDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFdEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENB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QUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztBQUN4RixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDekIsQ0FBQyxDQUFDO0FBQ0YsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUU3QyxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVTtBQUNyRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVU7QUFDaEYsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUk7QUFDaEYsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07QUFDL0IsQ0FBQyxDQUFD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Q0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTztBQUN4RSxDQUFDLENBQUM7QUFDRixNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUV2Qyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO0FBQ25DLENBQUM7O0FBRUQsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDOztBQUV2RCxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2IsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNULENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7QUFDcEUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQzs7QUFFRCxDQUFDLE1BQU0sQ0FBQyxJQUFJO0FBQ1osQ0FBQyxDQUFDOztBQUVGLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFdEMsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDOUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLE9BQU87QUFDOUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUN6RSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO0FBQ3BFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzlDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ2hELENBQUMsQ0FBQztBQUNGLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNDLENBQUMsRUFBRSxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7QUFDNUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxhQUFhO0FBQ3RCLENBQUM7O0FBRUQsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNuQzs7QUFFQSxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztBQUNiLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztBQUNuRixDQUFDLENBQUM7QUFDRixRQUFRLENBQUMsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDN0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMxQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNoRCxDQUFDLENBQUM7QUFDRixDQUFDO0FBQ0Q7O0FBRUEsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDOUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDaEQsQ0FBQyxDQUFDO0FBQ0YsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDM0MsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkQsQ0FBQzs7QUFFRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUk7O0FBRXpELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNwRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQzlELENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRCxDQUFDOztBQUVELENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO0FBQ2pELENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0FBQ3pDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUNwQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQ3RDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSTtBQUMvQixDQUFDOztBQUVELENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJOztBQUVYLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUUxQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFMUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWU7QUFDeEUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU87O0FBRWpCLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUN0RCxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDNUQsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDdEMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7O0FBRXJDLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRTNGLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDdEYsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLENBQUM7O0FBRTlELENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxJQUFJO0FBQ04sQ0FBQyxDQUFDLElBQUk7QUFDTixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUztBQUNqQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUztBQUNsQixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUs7QUFDNUMsQ0FBQyxDQUFDLENBQUM7O0FBRUgsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDaEQsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1RCxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xFLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXhELENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQzdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztBQUMzRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztBQUN6QyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUVyRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQ3BELENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWTtBQUN0QixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUs7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztBQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMscUJBQXFCO0FBQ3hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyx3QkFBd0I7QUFDOUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsS0FBSztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDakIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDOztBQUVELENBQUMsbUJBQW1CO0FBQ3BCLENBQUMsQ0FBQyxxQkFBcUI7QUFDdkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDeEQsQ0FBQyxDQUFDOztBQUVGLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDcEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQ25CLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxNQUFNO0FBQzNELENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztBQUNsQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDZCxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUM7QUFDRixDQUFDOztBQUVELENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDWCxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQzs7QUFFekIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQzlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNSLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDO0FBQ2pCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztBQUNuRixDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJO0FBQ3RCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3RSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUVKLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQ3pCLENBQUM7O0FBRUQsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNoQjs7QUFFQSxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO0FBQzNFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUTtBQUM5RSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxhQUFhO0FBQ2hELENBQUMsS0FBSyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNqRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTTtBQUN4QyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxJQUFJOztBQUUxQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCO0FBQ25DLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsT0FBTztBQUM3QixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDOztBQUU5RCxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxZQUFZO0FBQzNELENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7QUFDOUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDM0UsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUM5RCxDQUFDLGtCQUFrQixDQUFDLENBQUM7O0FBRXJCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ1YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6QyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUN6QixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQzNELENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDMUIsQ0FBQyxDQUFDOztBQUVGLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztBQUNuRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7QUFDdEIsQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUMxQyxDQUFDLENBQUM7QUFDRixDQUFDOztBQUVELENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUs7QUFDOUIsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTztBQUNsQyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMvRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUMzRixDQUFDLENBQUMsTUFBTTtBQUNSLENBQUM7O0FBRUQsQ0FBQyxFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDNUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLO0FBQ2QsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSTtBQUN4RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDOztBQUVELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTztBQUN0RSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztBQUMzRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxNQUFNO0FBQ1IsQ0FBQzs7QUFFRCxDQUFDLHVCQUF1QixDQUFDLGlCQUFpQixDQUFDOztBQUUzQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDMUYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTztBQUMxRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLENBQUM7O0FBRUQsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDM0QsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDOztBQUVyQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDcEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDMUQsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ3pCLENBQUM7QUFDRCxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztBQUNwRCxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztBQUNoRCxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDZixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUN6QixDQUFDLENBQUM7QUFDRixDQUFDOztBQUVELENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDOUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQ3hDOztBQUVBLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDM0I7O0FBRUEsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxLQUFLOztBQUVsQyxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO0FBQ25DLENBQUMsQ0FBQztBQUNGLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUNoRCxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsSUFBSTtBQUNoQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDeEUsQ0FBQztBQUNEOztBQUVBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDbkMsQ0FBQyxDQUFDO0FBQ0YsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBQy9DLENBQUMsQ0FBQyxDQUFDO0FBQ0g7O0FBRUEsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQyxjQUFjLENBQUMscUJBQXFCLENBQUM7QUFDdEMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsWUFBWSxDQUFDOztBQUU1QyxDQUFDLGdCQUFnQixDQUFDLHdCQUF3QixDQUFDO0FBQzNDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxTQUFTLENBQUM7O0FBRXJDLENBQUMsNEJBQTRCLENBQUMscUJBQXFCLENBQUM7QUFDcEQ7O0FBRUEsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPO0FBQ3RRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxjQUFjO0FBQ2xDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7QUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUU7QUFDNUgsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQzFCLENBQUMsQ0FBQztBQUNGLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDM0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQixDQUFDLEdBQUcsQ0FBQyxVQUFVO0FBQ2YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQixDQUFDLEdBQUcsQ0FBQyxlQUFlOztBQUVwQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNoRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUM7QUFDdkMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDdEIsQ0FBQzs7QUFFRCxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDaEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDOUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUM7QUFDdkIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLO0FBQ3RCLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTztBQUNoQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUs7QUFDdEIsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZO0FBQ3JDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSztBQUN0QixDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWE7QUFDdEMsQ0FBQyxDQUFDLGNBQWM7QUFDaEIsQ0FBQyxDQUFDLFNBQVM7QUFDWCxDQUFDLENBQUMsTUFBTTtBQUNSLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSTtBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQ3pELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVU7QUFDN0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztBQUNoRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYztBQUMzRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDOztBQUVILENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDO0FBQ2hELENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUM7O0FBRUgsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7QUFDOUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUM1RixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUNaLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUk7QUFDYixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDaEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDckUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMs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TyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDcEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ1QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQztBQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNiLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO0FBQzNFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRUosQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSTtBQUNmLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQztBQUNGLENBQUM7O0FBRUQsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU87QUFDMUI7O0FBRUEsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUTtBQUM3RixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMxRixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMxRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDakYsQ0FBQyxDQUFDO0FBQ0YsS0FBSyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEYsQ0FBQyxHQUFHLENBQUMsTUFBTTs7QUFFWCxDQUFDLEdBQUcsQ0FBQztBQUNMLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsNEJBQTRCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUN4RSxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNULENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3ZFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7QUFDMUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUMzRSxDQUFDLENBQUMsTUFBTTtBQUNSLENBQUM7O0FBRUQsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTztBQUNyRCxDQUFDLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUM7QUFDdkMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxhQUFhO0FBQ3RCLENBQUM7O0FBRUQsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNOztBQUUxQixDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ2xEOztBQUVBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUztBQUMzRixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQzFCLENBQUMsQ0FBQztBQUNGLEtBQUssQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUc7QUFDbEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5RixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU87QUFDaEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzFDLENBQUMsQ0FBQztBQUNGOztBQUVBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQzFCLENBQUMsQ0FBQztBQUNGLEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2xDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7O0FBRS9ELENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDWixDQUFDLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztBQUMvQixDQUFDO0FBQ0Q7O0FBRUEsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUNwRCxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3hCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDO0FBQ0YsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDMUQsQ0FBQyxFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM1RixDQUFDLENBQUMsTUFBTTs7QUFFUixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO0FBQzlCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDYixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU07QUFDeEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJO0FBQzVCLENBQUMsQ0FBQzs7QUFFRixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDWCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUs7QUFDakIsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDOztBQUVGLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ3hELENBQUMsRUFBRSxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztBQUMvRCxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNCLENBQUM7O0FBRUQsQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUM7O0FBRWhDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7QUFDcEMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSzs7QUFFaEQsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDZCxDQUFDLENBQUMsTUFBTTtBQUNSLENBQUMsQ0FBQyxLQUFLO0FBQ1AsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO0FBQ25ELENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUs7QUFDZixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQzs7QUFFSCxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPO0FBQ3JFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO0FBQ2hELENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDOztBQUUvQixDQUFDLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSTtBQUNiLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQ1YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7QUFDeEUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUs7QUFDcEIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSztBQUNqQixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO0FBQzdCLENBQUMsQ0FBQyxDQUFDOztBQUVILENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDMUQsQ0FBQzs7QUFFRCxDQUFDLGdCQUFnQixDQUFDLHdCQUF3QixDQUFDO0FBQzNDLENBQUMsMkJBQTJCLENBQUMscUJBQXFCLENBQUM7O0FBRW5ELENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ2Y7O0FBRUEsQ0FBQyxDQUFDO0FBQ0YsQ0FBQztBQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDWCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRztBQUNiLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ25DLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQy9ELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDbEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSTtBQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDM0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ3RDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDO0FBQ0YsS0FBSyxDQUFDLFFBQVEsQ0FBQyxpQ0FBaUMsQ0FBQztBQUNqRCxDQUFDLEdBQUc7QUFDSixDQUFDLE1BQU07QUFDUCxDQUFDLE1BQU07QUFDUCxDQUFDLE1BQU07QUFDUCxDQUFDLE1BQU07QUFDUCxDQUFDLEtBQUs7QUFDTixDQUFDLEtBQUs7QUFDTixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFDNUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQzs7QUFFcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO0FBQ3JGLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDM0UsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNSLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLO0FBQ3BELENBQUMsQ0FBQztBQUNGLENBQUM7O0FBRUQsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNuRCxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQ3JDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUFFOUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztBQUN0RCxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDVCxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQ04sQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNULENBQUMsQ0FBQyxDQUFDLE1BQU07QUFDVCxDQUFDLENBQUMsQ0FBQyxLQUFLO0FBQ1IsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNULENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEMsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDOztBQUVGLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDWixDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDNUIsQ0FBQzs7QUFFRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSTtBQUMxQixDQUFDOztBQUVELENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2QsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7O0FBRXpCLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDO0FBQ3hCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNWLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7O0FBRTFGLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJO0FBQ3JDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFdEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQ3JDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUk7O0FBRS9CLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ3hCLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzs7QUFFaEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUTs7QUFFckIsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNuRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0FBQ3pFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2pCLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEQsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ3RCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ1QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQztBQUN4RCxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSTtBQUN6QyxDQUFDLENBQUM7O0FBRUYsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUk7O0FBRTFCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6QixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUM3RCxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDOztBQUVILENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7O0FBRWxDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVO0FBQ3RELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVM7QUFDeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN2QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRUwsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEtBQUs7QUFDeEMsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUM7QUFDRixDQUFDOztBQUVELENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztBQUNwQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDaEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzlDLENBQUMsQ0FBQyxZQUFZOztBQUVkLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDbkIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxLQUFLO0FBQ1IsQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNULENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ1YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUk7QUFDaEIsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQ3pDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ3JCLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDOztBQUVELENBQUMsTUFBTSxDQUFDLE1BQU07QUFDZDs7QUFFQSxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTTtBQUNuRSxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNYLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGlCQUFpQjtBQUM5QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMvQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRztBQUNiLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ25DLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQzNELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztBQUNyRCxDQUFDLENBQUM7QUFDRixLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3pDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSTs7QUFFaEIsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJOztBQUV2QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNkLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSztBQUNmLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLO0FBQ2QsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUs7QUFDWixDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztBQUN6QixDQUFDLENBQUM7O0FBRUYsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTVCLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDVixDQUFDLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQzs7QUFFdkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2xDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDO0FBQzNDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO0FBQzdDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBQ0YsQ0FBQzs7QUFFRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QixDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQzs7QUFFcEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ3RDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDOztBQUVGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztBQUN6QixDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25FLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM3QyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3RCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2xELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9DLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWM7QUFDdEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQ1AsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNWLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ3JCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0FBQ3pFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUN4RSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQzNELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDNUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtBQUNWLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtBQUM3RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLO0FBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDO0FBQ3hFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTTtBQUM3RSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNyRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztBQUMvRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzNELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVM7QUFDL0UsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU07QUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUk7QUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVE7QUFDakMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVE7QUFDakMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsUUFBUSxDQUFDLGNBQWM7QUFDN0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU07QUFDN0Is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R0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUk7QUFDMUQsQ0FBQzs7QUFFRCxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN2QyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJO0FBQzlELENBQUM7O0FBRUQsQ0FBQyxNQUFNLENBQUMsS0FBSztBQUNiOztBQUVBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFGLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRO0FBQzFELENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFF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Q3JGLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ3ZFLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQztBQUMzRCxDQUFDLENBQUM7QUFDRixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUN2RSxDQUFDLENBQUM7QUFDRixLQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVGLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDOUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDbEMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztBQUN6QyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPO0FBQzNCLENBQUM7O0FBRUQsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7O0FBRXhDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDbkMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7O0FBRXJELENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFN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QyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUs7O0FBRTdDLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsS0FBSzs7QUFFM0IsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFELENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU07O0FBRTNELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7O0FBRXBDLENBQUMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRWpELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNqRCxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNkLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0Is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LEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUk7QUFDN0UsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDL0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUM7O0FBRUgsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0FBQzVDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7O0FBRS9DLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRWxCLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDWixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTTtBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUVKLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNoRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFSixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLOztBQUViLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN2RSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztBQUMzRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUs7QUFDdkUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDekMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5RSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDWCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDbEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFD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Q0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDO0FBQzlDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7QUFDaEYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztBQUNqRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMvSCxDQUFDLENBQUM7QUFDRixLQUFLLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzFELENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ3RFLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDdEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLO0FBQ2pCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1osQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJO0FBQ2hCLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDZixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNWLENBQUMsQ0FBQyxDQUFDLFFBQVE7QUFDWCxDQUFDLENBQUM7QUFDRixDQUFDO0FBQ0Q7O0FBRUEsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNYLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNO0FBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDL0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDakUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLO0FBQ3JCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU07QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUc7QUFDYixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNuQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUM7QUFDRixLQUFLLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUYsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ3RFLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDbkIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxpQ0FBaUMsQ0FBQztBQUMzQyxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQ04sQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNULENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFlBQVk7QUFDdkIsQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNULENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDUixDQUFDLENBQUMsQ0FBQyxNQUFNO0FBQ1QsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQzs7QUFFRCxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3JEOztBQUVBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDWCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUs7QUFDckIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUc7QUFDYixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM1RyxDQUFDLENBQUM7QUFDRixLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQzs7QUFFaEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDcEQsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUk7O0FBRTVCLENBQUMsRUFBRSxDQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUNwQyxDQUFDLENBQUMsS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFbEUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLDhCQUE4QixDQUFDLENBQUM7QUFDdEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7QUFDeEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRXBELENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDbEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ2xFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ1osQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFSixDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDbkQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDcEYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENB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Q0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU87QUFDeEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUc7O0FBRWQsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNyQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDOztBQUU1RCxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUTtBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDWCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUTtBQUM1QixDQUFDLENBQUMsQ0FB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O0FBQzNCLENBQUMsTUFBTSxDQUFDO0FBQ1IsQ0FBQyxDQUFDLGVBQWU7QUFDakIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTTtBQUMvRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNULENBQUMsQ0FBQztBQUNGOztBQUVBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0QixRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTTtBQUMzRTs7QUFFQSxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ1gsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUc7QUFDYixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGdCQUFnQjtBQUNuRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsVUFBVTtBQUN2QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUM7QUFDRixRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hHLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSzs7QUFFekIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDOztBQUUzRixDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoRSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDOUIsQ0FBQzs7QUFFRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNULENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSztBQUM5QixDQUFDOztBQUVELENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVO0FBQ25CLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDdEIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDaEQsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDOztBQUVGLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNyQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUTtBQUM5RixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUztBQUNyRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDN0IsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM1RCxDQUFDOztBQUVELENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQ2pDOztBQUVBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDWCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsY0FBYztBQUN6QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRztBQUNiLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDeEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDeEcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFh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Q0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzNDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQzs7QUFFRCxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDdEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztBQUM1QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUc7O0FBRXpCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUNuQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzdDLENBQUMsQ0FBQyxNQUFNO0FBQ1IsQ0FBQzs7QUFFRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxNQUFNOztBQUUvQixDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUM1QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO0FBQ2pHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDdkYsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7QUFFMUQsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ2pELENBQUMsQ0FBQyxDQUFD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QUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztBQUN2RSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDdEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLO0FBQ2hFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzNDLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDVCxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQzs7QUFFN0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7QUFDL0UsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDbkYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQzVFLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM1QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQzs7QUFFRixDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ3RCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNSLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3BELENBQUM7O0FBRUQsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCO0FBQ3pDLENBQUMsQ0FBQyxHQUFHO0FBQ0wsQ0FBQyxDQUFDLFNBQVM7QUFDWCxDQUFDLENBQUMsR0FBRztBQUNMLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNO0FBQ2hCLENBQUMsQ0FBQyxLQUFLO0FBQ1AsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU07O0FBRXRCLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyx3QkFBd0IsQ0FBQztBQUM1QyxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ3hFLENBQUMsMkJBQTJCLENBQUMscUJBQXFCLENBQUMsQ0FBQywrQkFBK0IsQ0FBQzs7QUFFcEYsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDOztBQUVyQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSztBQUNqQjs7QUFFQSxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM1RixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQUNGLEtBQUssQ0FBQyxRQUFRLENBQUMseUJBQXlCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDckQsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO0FBQ3pHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUM7QUFDM0QsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXZGLENBQUMsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDdEUsQ0FBQyxDQUFDOztBQUVGLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUM5QixDQUFDLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNsRSxDQUFDO0FBQ0Q7O0FBRUEsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDOUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2hFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7QUFDakQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDbEgsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDdEMsQ0FBQyxDQUFDO0FBQ0YsS0FBSyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNyRixDQUFDLEtBQUssQ0FBQyxPQUFPOztBQUVkLENBQUMsRUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNyQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDN0MsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLO0FBQ2QsQ0FBQzs7QUFFRCxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxhQUFhLENBQUM7QUFDMUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4RCxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQztBQUNsQixDQUFDOztBQUVELENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxLQUFLOztBQUV0QixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDOztBQUV0QixDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztBQUNwRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDeEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDM0MsQ0FBQzs7QUFFRCxDQUFDLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzs7QUFFNUYsQ0FBQyxNQUFNLENBQUMsSUFBSTtBQUNaOztBQUVBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDL0UsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsYUFBYTtBQUNsQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUN6RSxDQUFDLENBQUM7QUFDRixLQUFLLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNqRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMvRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUTtBQUMzRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUM7QUFDbkUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUM7QUFDcEMsQ0FBQyxDQUFDLENBQUMsS0FBSztBQUNSLENBQUMsQ0FBQyxDQUFDLEdBQUc7QUFDTixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDOztBQUVELENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUM7O0FBRTdCLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO0FBQzlCLENBQUM7O0FBRUQsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLGFBQWEsQ0FBQztBQUNuRDs7QUFFQSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEMsQ0FBQyxDQUFDLENBQUM7QUFDSDs7QUFFQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQzs7QUFFOUcsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztBQUN2RSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTO0FBQ2hFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN0RyxDQUFDLENBQUM7QUFDRixHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRXZELFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzdCLENBQUMsR0FBRyxDQUFDLGlCQUFpQjtBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQzFELENBQUMsR0FBRyxDQUFDLFNBQVM7QUFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7QUFDbEMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCOztBQUVyQixDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQztBQUNqQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDO0FBQ2xFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUM7QUFDbkUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUztBQUN2QixDQUFDOztBQUVELENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztBQUNoQyxDQUFDLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDO0FBQ2pDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTTtBQUN6QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztBQUNwRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ1IsQ0FBQzs7QUFFRCxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7QUFDL0UsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEQsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU07O0FBRWhELENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNoRCxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTTs7QUFFbkMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFZixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDOztBQUV2QyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEQsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUM7QUFDN0MsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO0FBQ3RELENBQUMsQ0FBQyxDQUFDLE1BQU07QUFDVCxDQUFDLENBQUM7O0FBRUYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7QUFDN0UsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztBQUNoRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ2hFLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDO0FBQ3RELENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBRXZFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDOztBQUVILENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTTs7QUFFcEMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ3BGLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU07O0FBRWhCLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQztBQUN6QyxDQUFDOztBQUVELENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDN0MsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOztBQUVqRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0I7QUFDMUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNoQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUM5QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3RGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQixDQUFDLENBQUM7O0FBRUYsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzdDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztBQUN6RSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztBQUNuQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQjtBQUN4RixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTTs7QUFFOUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDdEUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNOztBQUVsQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDOztBQUV2QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDO0FBQzVELENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUM7QUFDekUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTTs7QUFFeEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDeEMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDbEYsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLEdBQUc7O0FBRTVDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDekQsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNOztBQUV0QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNaLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ2pGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNWLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQzFDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUMvQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDM0MsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFFBQVE7QUFDOUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMvQyxDQUFDLENBQUM7QUFDRixDQUFDOztBQUVELENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFdkIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0FBQ3ZFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFROztBQUVyQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7QUFDeEMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVE7O0FBRS9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM3RCxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDOztBQUVILENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxRCxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDaEQsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUM7QUFDRixDQUFDOztBQUVELENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQztBQUM3QyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ2pCOztBQUVBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO0FBQy9CLENBQUMsQ0FBQztBQUNGLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN4QyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJO0FBQ25CLENBQUM7O0FBRUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUMsR0FBRyxDQUFDLE1BQU07O0FBRVgsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQzdDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RGLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNSLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDckMsQ0FBQzs7QUFFRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ25DLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDaEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQzVCLENBQUM7O0FBRUQsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUs7O0FBRXZGLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ25DLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsc0NBQXNDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDOztBQUVqRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7O0FBRXJELENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztBQUMzRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQ3pFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNyQzs7QUFFQSxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3hCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNkLENBQUMsQ0FBQztBQUNGLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN0RCxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQzs7QUFFekIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO0FBQzdCLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDSDs7QUFFQSxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUc7QUFDbkksQ0FBQztBQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsT0FBTztBQUMxSCxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJO0FBQ2pCLENBQUMsQ0FBQztBQUNGLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsdUJBQXVCLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDNUQ7O0FBRUEsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRO0FBQ2xLLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUTtBQUNwVixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUMzSixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDbE4sQ0FBQztBQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsT0FBTztBQUMzSCxDQUFDLENBQUMs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RCxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFELENBQUM7O0FBRUQsQ0FBQyxNQUFNLENBQUMsTUFBTTtBQUNkOztBQUVBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzVILENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTO0FBQzVELENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPO0FBQzFKLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVE7QUFDckgsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsSCxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxP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LEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7QUFDeEosQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRztBQUNuSCxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRO0FBQzdJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSztBQUMzRixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztBQUNyRCxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQy9DLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO0FBQzVFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTztBQUN6SixDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDMUIsQ0FBQyxDQUFDO0FBQ0YsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4RCxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztBQUMzQixDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDL0I7O0FBRUEsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7QUFDNUUsQ0FBQyxDQUFDO0FBQ0YsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3BDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUNyQyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDNUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ1IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO0FBQ25ELENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUM5QyxDQUFDO0FBQ0Q7O0FBRUEsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsT0FBTztBQUNwSyxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FB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SUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQzNJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxhQUFhO0FBQ25ILENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVE7QUFDM0gsQ0FBQztBQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFLLENBQUMsQ0FBQztBQUNGLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4QyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7QUFDOUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDOztBQUV2RCxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM5QyxDQUFDOztBQUVELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUMsR0FBRyxDQUFDLE1BQU07O0FBRVgsQ0FBQyxHQUFHLENBQUM7QUFDTCxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztBQUN0QyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUMxRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUN4RSxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ1QsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUc7QUFDakMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDVixDQUFDLENBQUMsQ0FBQztBQUNILENBQUM7O0FBRUQsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDVCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSTtBQUNwQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTTtBQUN4QixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDOztBQUVELENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJOztBQUVuRCxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNDOztBQUVBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPO0FBQzdFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVTtBQUNuRSxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDaEYsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ3RHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztBQUNyRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO0FBQzVFLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztBQUNoRCxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxL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Q0FBQyxDQUFDLENBQUMsSUFBSTtBQUM1RixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0FBQzdFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUVqRixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDLDRCQUE0QixDQUFDLENBQUM7QUFDbEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNWLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxF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QUFDUixDQUFDLENBQUMsV0FBVyxDQUFDO0FBQ2QsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUk7QUFDcEIsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRUosQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25DLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUNuRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJOztBQUVuQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDL0QsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNkLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSTs7QUFFMUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFD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LENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVTtBQUNwRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUs7QUFDdEcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDdEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVTtBQUNyQixDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQ2xELENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUVKLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM1RCxDQUFDLENBQUM7O0FBRUYsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNyQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLGdCQUFnQixDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQzdDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ1QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUNuRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDOztBQUVILENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3RCLENBQUMsQ0FBQyxDQUFDOztBQUVILENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDO0FBQ3JELENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdEMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ2pCLENBQUM7O0FBRUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0FBQ3RELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUN4RCxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU07QUFDMUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNO0FBQzlFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNOztBQUVwQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDcEYsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTTs7QUFFaEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDOUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTTs7QUFFbEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDbkUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2pELENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDM0MsQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNULENBQUMsQ0FBQzs7QUFFRixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLENBQUMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsV0FBVzs7QUFFbkQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDcEgsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDdkcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRO0FBQ3RHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDOUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDOUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDOUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFELENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLE1BQU07O0FBRVQsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU07O0FBRXRCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkYsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7O0FBRXhELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0FBQ25DLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUM5RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDbEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNWLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDOztBQUVILENBQUMsQ0FBQyxDQUFDLE1BQU07QUFDVCxDQUFDLENBQUM7O0FBRUYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztBQUN4RixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztBQUNoRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0FBQzFGLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDM0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztBQUMvRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTztBQUNyRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLO0FBQ25GLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUMvRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZELENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDOztBQUUxQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDekUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7QUFDNUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU07QUFDdEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxD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TSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU07O0FBRWpDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU07O0FBRXJELENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTTs7QUFFOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO0FBQzVGLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRztBQUNyQixDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQzVFLENBQUMsQ0FBQyxDQUFDOztBQUVILENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNOztBQUUvQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxD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QUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7QUFDcEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUM7QUFDaEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOztBQUVoRCxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQzs7QUFFOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDVixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFTixDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7O0FBRW5CLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNyRCxDQUFDLENBQUMsQ0FBQyxDQUFDLDJCQUEyQixDQUFDLHFCQUFxQixDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO0FBQy9FLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxL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QUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRTlGLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDdkUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUs7QUFDL0MsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFN0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUM3QyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzs7QUFFdkQsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNkLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSztBQUN2RSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxD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VSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7QUFDNUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztBQUNoRCxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUU1QixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqQixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QixDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVE7QUFDbEIsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDOztBQUVELENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQy9DLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ3ZCLENBQUMsQ0FBQzs7QUFFRixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3BFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDNUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRUwsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztBQUNyRCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDbkMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQy9FLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDOztBQUV2QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNkLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNWLENBQUMsQ0FBQyxDQUFDLENBQUMs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QUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNuRixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRztBQUMxQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNYLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNqQyxDQUFDLENBQUMsSUFBSTtBQUNOLENBQUMsQ0FBQyxPQUFPO0FBQ1QsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUM7O0FBRUgsQ0FBQyxNQUFNLENBQUM7QUFDUixDQUFDLENBQUMsVUFBVTtBQUNaLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDaEIsQ0FBQyxDQUFDLE1BQU07QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDO0FBQ2hCLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUNGOztBQUVBLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHO0FBQ2hCLENBQUMsQ0FBQztBQUNGLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDMUIsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUNwRixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDNUMsQ0FBQyxNQUFNLENBQUMsT0FBTztBQUNmOztBQUVBLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ1QsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoRCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNyQixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDO0FBQ0Q7O0FBRUEsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQztBQUNGLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN6QyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQzs7QUFFL0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSTtBQUN6QyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLOztBQUUzQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJO0FBQ2hDLENBQUM7O0FBRUQsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSztBQUNsQyxDQUFDO0FBQ0Q7In0=