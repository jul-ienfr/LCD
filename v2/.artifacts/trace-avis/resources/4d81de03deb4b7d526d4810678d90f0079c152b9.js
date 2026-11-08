import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/node_modules/@sveltejs/kit/src/runtime/components/error.svelte?v=70f5904f");import "/node_modules/.vite/deps/svelte_internal_disclose-version.js?v=70f5904f";

Error[$.FILENAME] = 'node_modules/@sveltejs/kit/src/runtime/components/error.svelte';

import * as $ from "/node_modules/.vite/deps/svelte_internal_client.js?v=70f5904f";
import { page } from "/node_modules/@sveltejs/kit/src/runtime/app/state/index.js?v=70f5904f";

var root = $.add_locations($.from_html(`<h1> </h1> <p> </p>`, 1), Error[$.FILENAME], [[7, 0], [8, 0]]);

function Error($$anchor, $$props) {
	$.check_target(new.target);
	$.push($$props, true, Error);

	var $$exports = { ...$.legacy_api() };
	var fragment = root();
	var h1 = $.first_child(fragment);
	var text = $.only_child(h1, true);
	var p = $.sibling(h1, 2);
	var text_1 = $.only_child(p, true);

	$.template_effect(() => {
		$.set_text(text, page.status);
		$.set_text(text_1, page.error?.message);
	});

	$.append($$anchor, fragment);

	return $.pop($$exports);
}

if (import.meta.hot) {
	Error = $.hmr(Error);

	import.meta.hot.acceptExports(["default"],(module) => {
		Error[$.HMR].update(module.default);
	});
}

export default Error;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7QUFHQyxNQUFNLEdBQUcsSUFBSSxRQUFRLFlBQVk7Ozs7a0NBRGxDLENBQUM7Ozs7OztLQUlBLEVBQUU7eUJBQUYsRUFBRTtLQUNGLENBQUMsYUFERCxFQUFFOzJCQUNGLENBQUM7OzttQkFERyxJQUFJLENBQUMsTUFBTTtxQkFDWixJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU87Ozs7OztBQUhmIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJlcnJvci5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHN2ZWx0ZTpvcHRpb25zIHJ1bmVzPXt0cnVlfSAvPlxuXG48c2NyaXB0PlxuXHRpbXBvcnQgeyBwYWdlIH0gZnJvbSAnJGFwcC9zdGF0ZSc7XG48L3NjcmlwdD5cblxuPGgxPntwYWdlLnN0YXR1c308L2gxPlxuPHA+e3BhZ2UuZXJyb3I/Lm1lc3NhZ2V9PC9wPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qdWxpZS9EZXNrdG9wL0xvY2F0aW9uIGNvdXJ0ZSBkdXJlZS92Mi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvcnVudGltZS9jb21wb25lbnRzL2Vycm9yLnN2ZWx0ZSIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswXX0=