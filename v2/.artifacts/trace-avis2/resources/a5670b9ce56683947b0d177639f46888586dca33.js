import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/node_modules/@sveltejs/kit/src/runtime/components/root.svelte?v=70f5904f");import "/node_modules/.vite/deps/svelte_internal_disclose-version.js?v=70f5904f";

Root[$.FILENAME] = 'node_modules/@sveltejs/kit/src/runtime/components/root.svelte';

import * as $ from "/node_modules/.vite/deps/svelte_internal_client.js?v=70f5904f";
import { afterNavigate } from "/node_modules/@sveltejs/kit/src/runtime/app/navigation/index.js?v=70f5904f";

var root = $.add_locations($.from_html(`<div id="svelte-announcer" aria-live="assertive" aria-atomic="true" style="position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px"><!></div>`), Root[$.FILENAME], [[46, 1]]);
var root_1 = $.add_locations($.from_html(`<!> <!>`, 1), Root[$.FILENAME], []);

function Root($$anchor, $$props) {
	$.check_target(new.target);
	$.push($$props, true, Root);

	var $$ownership_validator = $.create_ownership_validator($$props);

	const node = $.wrap_snippet(Root, function ($$anchor, n = $.noop, depth = $.noop) {
		$.validate_snippet_args(...arguments);

		const failed = $.wrap_snippet(Root, function ($$anchor, error = $.noop) {
			$.validate_snippet_args(...arguments);

			var fragment = $.comment();
			var node_1 = $.first_child(fragment);

			$.add_svelte_meta(
				() => $.component(node_1, () => $.get(Error), ($$anchor, Error_1) => {
					Error_1($$anchor, {
						get error() {
							return error();
						}
					});
				}),
				'component',
				Root,
				27,
				2,
				{ componentTag: 'Error' }
			);

			$.append($$anchor, fragment);
		});

		const Component = $.tag($.derived(() => n().component), 'Component');
		const Error = $.tag($.derived(() => n().error), 'Error');
		const data = $.tag($.derived(() => n().data), 'data');
		var fragment_1 = $.comment();
		var node_2 = $.first_child(fragment_1);

		$.boundary(
			node_2,
			{
				get failed() {
					return $.get(Error) ? failed : undefined;
				},

				get onerror() {
					return $.get(Error) ? $$props.onerror : undefined;
				}
			},
			($$anchor) => {
				var fragment_2 = $.comment();
				var node_3 = $.first_child(fragment_2);

				{
					var consequent = ($$anchor) => {
						var fragment_3 = $.comment();
						var node_4 = $.first_child(fragment_3);

						$.add_svelte_meta(
							() => $.component(node_4, () => $.get(Component), ($$anchor, Component_1) => {
								$.bind_this(
									Component_1($$anchor, {
										get data() {
											return $.get(data);
										},

										get form() {
											return $$props.form;
										},

										get params() {
											return $$props.page.params;
										},

										children: $.wrap_snippet(Root, ($$anchor, $$slotProps) => {
											$.add_svelte_meta(() => node($$anchor, () => n().child, () => depth() + 1), 'render', Root, 34, 4);
										}),
										$$slots: { default: true }
									}),
									($$value) => $$ownership_validator.mutation('components', ['components', depth()], components()[depth()] = $$value, 33, 25),
									() => components()?.[depth()]
								);
							}),
							'component',
							Root,
							33,
							3,
							{ componentTag: 'Component' }
						);

						$.append($$anchor, fragment_3);
					};

					var alternate = ($$anchor) => {
						var fragment_5 = $.comment();
						var node_5 = $.first_child(fragment_5);

						$.add_svelte_meta(
							() => $.component(node_5, () => $.get(Component), ($$anchor, Component_2) => {
								$.bind_this(
									Component_2($$anchor, {
										get data() {
											return $.get(data);
										},

										get form() {
											return $$props.form;
										},

										get params() {
											return $$props.page.params;
										},

										get error() {
											return $$props.error;
										}
									}),
									($$value) => $$ownership_validator.mutation('components', ['components', depth()], components()[depth()] = $$value, 38, 25),
									() => components()?.[depth()]
								);
							}),
							'component',
							Root,
							38,
							3,
							{ componentTag: 'Component' }
						);

						$.append($$anchor, fragment_5);
					};

					$.add_svelte_meta(
						() => $.if(node_3, ($$render) => {
							if (n().child) $$render(consequent); else $$render(alternate, -1);
						}),
						'if',
						Root,
						31,
						2
					);
				}

				$.append($$anchor, fragment_2);
			}
		);

		$.append($$anchor, fragment_1);
	});

	const components = $.prop($$props, 'components', 7);
	let mounted = $.tag($.state(false), 'mounted');
	let navigated = $.tag($.state(false), 'navigated');
	let title = $.tag($.state(''), 'title');

	afterNavigate(() => {
		if ($.get(mounted)) {
			$.set(navigated, true);
			$.set(title, document.title || 'untitled page', true);
		} else {
			$.set(mounted, true);
		}
	});

	var $$exports = { ...$.legacy_api() };
	var fragment_6 = root_1();
	var node_6 = $.first_child(fragment_6);

	$.add_svelte_meta(() => node(node_6, () => $$props.tree, () => 0), 'render', Root, 43, 0);

	var node_7 = $.sibling(node_6, 2);

	{
		var consequent_2 = ($$anchor) => {
			var div = root();
			var node_8 = $.child(div);

			{
				var consequent_1 = ($$anchor) => {
					var text = $.text();

					$.template_effect(() => $.set_text(text, $.get(title)));
					$.append($$anchor, text);
				};

				$.add_svelte_meta(
					() => $.if(node_8, ($$render) => {
						if ($.get(navigated)) $$render(consequent_1);
					}),
					'if',
					Root,
					52,
					2
				);
			}

			$.reset(div);
			$.append($$anchor, div);
		};

		$.add_svelte_meta(
			() => $.if(node_7, ($$render) => {
				if ($.get(mounted)) $$render(consequent_2);
			}),
			'if',
			Root,
			45,
			0
		);
	}

	$.append($$anchor, fragment_6);

	return $.pop($$exports);
}

if (import.meta.hot) {
	Root = $.hmr(Root);

	import.meta.hot.acceptExports(["default"],(module) => {
		Root[$.HMR].update(module.default);
	});
}

export default Root;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQyxNQUFNLEdBQUcsYUFBYSxRQUFRLGlCQUFpQjs7Ozs7aUNBRGhELENBQUM7Ozs7OztPQW9CUyxJQUFJLDRDQUFDLENBQUMsQUFBWSxXQUFFLEtBQUssQUFBUTs7O1FBS2hDLE1BQU0sNENBQUMsS0FBSyxBQUFTOzs7Ozs7OztLQUM3QixPQUFPLEFBQUY7O2NBQUUsS0FBSzs7Ozs7Ozs7Ozs7Ozs7RUFMYixLQUFLLENBQUMsU0FBUyx5QkFBWSxDQUFDLEdBQUMsU0FBUyxnQkFBQztFQUN2QyxLQUFLLENBQUMsS0FBSyx5QkFBWSxDQUFDLEdBQUMsS0FBSyxZQUFDO0VBQy9CLEtBQUssQ0FBQyxJQUFJLHlCQUFZLENBQUMsR0FBQyxJQUFJLFdBQUM7Ozs7Ozs7O1lBTUwsV0FBSyxJQUFHLE1BQU0sR0FBRyxTQUFTOzs7O1lBQVcsV0FBSyxzQkFBYSxTQUFTOzs7Ozs7Ozs7Ozs7Ozs7U0FHdEYsV0FBVSxBQUFEOzt3QkFBZ0MsSUFBSTs7Ozs7Ozs7a0JBQWlCLGFBQUssTUFBTTs7OzttQ0FDaEUsSUFBSSxpQkFBQyxDQUFDLEdBQUMsS0FBSyxRQUFFLEtBQUssS0FBRyxDQUFDOzs7O2tGQURBLEtBQUssS0FBaEIsVUFBVSxHQUFDLEtBQUssR0FBQztlQUFqQixVQUFVLEtBQUMsS0FBSyxHQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztTQUt0QyxXQUFVLEFBQUQ7O3dCQUFnQyxJQUFJOzs7Ozs7OztrQkFBaUIsYUFBSyxNQUFNOzs7Ozs7O2tGQUF6QyxLQUFLLEtBQWhCLFVBQVUsR0FBQyxLQUFLLEdBQUM7ZUFBakIsVUFBVSxLQUFDLEtBQUssR0FBQzs7Ozs7Ozs7Ozs7Ozs7O1dBUG5DLENBQUMsR0FBQyxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7O0NBMUJiLEtBQUssQ0FBUyxVQUFVLG9DQUFnRDtDQUV4RSxHQUFHLENBQUMsT0FBTyxTQUFHLE9BQU8sQUFBRCxDQUFDLEtBQUssY0FBQztDQUMzQixHQUFHLENBQUMsU0FBUyxTQUFHLE9BQU8sQUFBRCxDQUFDLEtBQUssZ0JBQUM7Q0FDN0IsR0FBRyxDQUFDLEtBQUssU0FBRyxPQUFPLEFBQUQsQ0FBQyxFQUFFLFlBQUM7O0NBRXRCLGFBQWEsQ0FBQyxNQUFNO0VBQ25CLEVBQUUsUUFBRSxPQUFPLEdBQUU7R0FDWixlQUFTLEVBQUcsSUFBSTtHQUNoQixXQUFLLEVBQUcsUUFBUSxDQUFDLEtBQUssSUFBSSxlQUFlO0VBQzFDLENBQUMsTUFBTTtHQUNOLGFBQU8sRUFBRyxJQUFJO0VBQ2Y7Q0FDRCxDQUFDLENBQUM7Ozs7Ozt5QkF5Qk0sSUFBSSxtQ0FBTyxDQUFDOzs7Ozs7T0FHbkI7d0JBQUE7Ozs7OztvREFPRSxLQUFLOzs7Ozs7Z0JBREYsU0FBUzs7Ozs7Ozs7O1dBTmQ7c0JBQUE7Ozs7O2NBREcsT0FBTzs7Ozs7Ozs7Ozs7O0FBMUJKIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJyb290LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0IGxhbmc9XCJ0c1wiPlxuXHRpbXBvcnQgeyBhZnRlck5hdmlnYXRlIH0gZnJvbSAnJGFwcC9uYXZpZ2F0aW9uJztcblx0aW1wb3J0IHR5cGUgeyBQcm9wcywgUmVuZGVyTm9kZSB9IGZyb20gJy4uL3Byb3BzLnN2ZWx0ZS5qcyc7XG5cblx0Y29uc3QgeyBwYWdlLCBjb21wb25lbnRzLCBvbmVycm9yLCB0cmVlLCBmb3JtLCBlcnJvciB9OiBQcm9wcyA9ICRwcm9wcygpO1xuXG5cdGxldCBtb3VudGVkID0gJHN0YXRlKGZhbHNlKTtcblx0bGV0IG5hdmlnYXRlZCA9ICRzdGF0ZShmYWxzZSk7XG5cdGxldCB0aXRsZSA9ICRzdGF0ZSgnJyk7XG5cblx0YWZ0ZXJOYXZpZ2F0ZSgoKSA9PiB7XG5cdFx0aWYgKG1vdW50ZWQpIHtcblx0XHRcdG5hdmlnYXRlZCA9IHRydWU7XG5cdFx0XHR0aXRsZSA9IGRvY3VtZW50LnRpdGxlIHx8ICd1bnRpdGxlZCBwYWdlJztcblx0XHR9IGVsc2Uge1xuXHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0fVxuXHR9KTtcbjwvc2NyaXB0PlxuXG57I3NuaXBwZXQgbm9kZShuOiBSZW5kZXJOb2RlLCBkZXB0aDogbnVtYmVyKX1cblx0e2NvbnN0IENvbXBvbmVudCA9ICRkZXJpdmVkKG4uY29tcG9uZW50KX1cblx0e2NvbnN0IEVycm9yID0gJGRlcml2ZWQobi5lcnJvcil9XG5cdHtjb25zdCBkYXRhID0gJGRlcml2ZWQobi5kYXRhKX1cblxuXHR7I3NuaXBwZXQgZmFpbGVkKGVycm9yOiB1bmtub3duKX1cblx0XHQ8RXJyb3Ige2Vycm9yfSAvPlxuXHR7L3NuaXBwZXR9XG5cblx0PHN2ZWx0ZTpib3VuZGFyeSBmYWlsZWQ9e0Vycm9yID8gZmFpbGVkIDogdW5kZWZpbmVkfSBvbmVycm9yPXtFcnJvciA/IG9uZXJyb3IgOiB1bmRlZmluZWR9PlxuXHRcdHsjaWYgbi5jaGlsZH1cblx0XHRcdDwhLS0gc3ZlbHRlLWlnbm9yZSBiaW5kaW5nX3Byb3BlcnR5X25vbl9yZWFjdGl2ZSAtLT5cblx0XHRcdDxDb21wb25lbnQgYmluZDp0aGlzPXtjb21wb25lbnRzW2RlcHRoXX0ge2RhdGF9IHtmb3JtfSBwYXJhbXM9e3BhZ2UucGFyYW1zfT5cblx0XHRcdFx0e0ByZW5kZXIgbm9kZShuLmNoaWxkLCBkZXB0aCArIDEpfVxuXHRcdFx0PC9Db21wb25lbnQ+XG5cdFx0ezplbHNlfVxuXHRcdFx0PCEtLSBzdmVsdGUtaWdub3JlIGJpbmRpbmdfcHJvcGVydHlfbm9uX3JlYWN0aXZlIC0tPlxuXHRcdFx0PENvbXBvbmVudCBiaW5kOnRoaXM9e2NvbXBvbmVudHNbZGVwdGhdfSB7ZGF0YX0ge2Zvcm19IHBhcmFtcz17cGFnZS5wYXJhbXN9IHtlcnJvcn0gLz5cblx0XHR7L2lmfVxuXHQ8L3N2ZWx0ZTpib3VuZGFyeT5cbnsvc25pcHBldH1cblxue0ByZW5kZXIgbm9kZSh0cmVlLCAwKX1cblxueyNpZiBtb3VudGVkfVxuXHQ8ZGl2XG5cdFx0aWQ9XCJzdmVsdGUtYW5ub3VuY2VyXCJcblx0XHRhcmlhLWxpdmU9XCJhc3NlcnRpdmVcIlxuXHRcdGFyaWEtYXRvbWljPVwidHJ1ZVwiXG5cdFx0c3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDA7IHRvcDogMDsgY2xpcDogcmVjdCgwIDAgMCAwKTsgY2xpcC1wYXRoOiBpbnNldCg1MCUpOyBvdmVyZmxvdzogaGlkZGVuOyB3aGl0ZS1zcGFjZTogbm93cmFwOyB3aWR0aDogMXB4OyBoZWlnaHQ6IDFweFwiXG5cdD5cblx0XHR7I2lmIG5hdmlnYXRlZH1cblx0XHRcdHt0aXRsZX1cblx0XHR7L2lmfVxuXHQ8L2Rpdj5cbnsvaWZ9XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2p1bGllL0Rlc2t0b3AvTG9jYXRpb24gY291cnRlIGR1cmVlL3YyL25vZGVfbW9kdWxlcy9Ac3ZlbHRlanMva2l0L3NyYy9ydW50aW1lL2NvbXBvbmVudHMvcm9vdC5zdmVsdGUiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMF19