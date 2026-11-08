import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/routes/+layout.svelte");import "/node_modules/.vite/deps/svelte_internal_disclose-version.js?v=70f5904f";

_layout[$.FILENAME] = 'src/routes/+layout.svelte';

import * as $ from "/node_modules/.vite/deps/svelte_internal_client.js?v=70f5904f";
import "/node_modules/@fontsource-variable/fraunces/index.css";
import "/node_modules/@fontsource-variable/inter/index.css";
import "/src/app.css?t=1793092726872";
import { styleTheme, themeResolu } from "/src/lib/apparence.ts";

var root = $.add_locations($.from_html(`<!> <link rel="icon" href="/favicon.svg" type="image/svg+xml"/> <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"/> <meta name="theme-color" media="(prefers-color-scheme: light)"/> <meta name="theme-color" media="(prefers-color-scheme: dark)"/>`, 1), _layout[$.FILENAME], [[17, 2], [18, 2], [19, 2], [20, 2]]);
var root_1 = $.add_locations($.from_html(`<div class="apercu-bandeau" role="status"><span>Aperçu du brouillon — visible uniquement par vous.</span> <form method="POST" action="/apercu/fin"><button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">Quitter l’aperçu</button></form></div>`), _layout[$.FILENAME], [[24, 2, [[25, 4], [26, 4, [[27, 6]]]]]]);
var root_2 = $.add_locations($.from_html(`<!> <div class="apparence"><!></div>`, 1), _layout[$.FILENAME], [[34, 0]]);

function _layout($$anchor, $$props) {
	$.check_target(new.target);
	$.push($$props, true, _layout);

	const theme = $.tag($.derived(() => themeResolu($$props.data.apparence)), 'theme');
	const css = $.tag($.derived(() => styleTheme($.get(theme))), 'css');
	var $$exports = { ...$.legacy_api() };
	var fragment_1 = root_2();

	$.head('12qhfyh', ($$anchor) => {
		var fragment = root();
		var node = $.first_child(fragment);

		$.html(node, () => `<style>${$.get(css)} *{}</style>`);

		var meta = $.sibling(node, 6);
		var meta_1 = $.sibling(meta, 2);

		$.template_effect(() => {
			$.set_attribute(meta, 'content', $.get(theme).clair.accent);
			$.set_attribute(meta_1, 'content', $.get(theme).sombre.accent);
		});

		$.append($$anchor, fragment);
	});

	var node_1 = $.first_child(fragment_1);

	{
		var consequent = ($$anchor) => {
			var div = root_1();

			$.append($$anchor, div);
		};

		$.add_svelte_meta(
			() => $.if(node_1, ($$render) => {
				if ($$props.data.apercu) $$render(consequent);
			}),
			'if',
			_layout,
			23,
			0
		);
	}

	var div_1 = $.sibling(node_1, 2);
	var node_2 = $.child(div_1);

	$.add_svelte_meta(() => $.snippet(node_2, () => $$props.children), 'render', _layout, 39, 2);
	$.reset(div_1);

	$.template_effect(() => {
		$.set_attribute(div_1, 'data-nav', $.get(theme).variantes.nav);
		$.set_attribute(div_1, 'data-entete', $.get(theme).variantes.entete);
	});

	$.append($$anchor, fragment_1);

	return $.pop($$exports);
}

if (import.meta.hot) {
	_layout = $.hmr(_layout);

	import.meta.hot.acceptExports(["default"],(module) => {
		_layout[$.HMR].update(module.default);
	});
}

export default _layout;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDRSxNQUFNLENBQUMsK0JBQStCO0FBQ3RDLE1BQU0sQ0FBQyw0QkFBNEI7QUFDbkMsTUFBTSxDQUFDLFlBQVk7QUFFbkIsTUFBTSxHQUFHLFVBQVUsRUFBRSxXQUFXLFFBQVEsaUJBQWlCOzs7Ozs7b0NBTDNELENBQUM7Ozs7Q0FVQyxLQUFLLENBQUMsS0FBSyx5QkFBWSxXQUFXLENBQUMsYUFBSyxTQUFTLENBQUMsWUFBQztDQUNuRCxLQUFLLENBQUMsR0FBRyx5QkFBWSxVQUFVLE9BQUMsS0FBSyxFQUFDLFVBQUM7Ozs7Q0FHeEMsTUFBTSxBQUFLOzs7O3FCQUNILGdCQUFVLEdBQUcsZUFBVTs7TUFHN0IsSUFBSTtNQUNKLE1BQUssQUFBRCxhQURKLElBQUk7OzttQkFBSixJQUFJLGFBQTZCLFdBQUssRUFBQyxLQUFLLENBQUMsTUFBTTttQkFDbkQsTUFBSyxBQUFELGFBQTZCLFdBQUssRUFBQyxNQUFNLENBQUMsTUFBTTs7Ozs7Ozs7OztPQUlwRCxHQUFHOztzQkFBSCxHQUFHOzs7OztRQURELGFBQUssTUFBTTs7Ozs7Ozs7O0tBV2Y7c0JBQUE7OztTQUFBOzs7a0JBQUEsbUJBRVcsV0FBSyxFQUFDLFNBQVMsQ0FBQyxHQUFHO2tCQUY5QixzQkFHYyxXQUFLLEVBQUMsU0FBUyxDQUFDLE1BQU07Ozs7OztBQXhCN0IiLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIitsYXlvdXQuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQgbGFuZz1cInRzXCI+XG4gIGltcG9ydCBcIkBmb250c291cmNlLXZhcmlhYmxlL2ZyYXVuY2VzXCI7XG4gIGltcG9ydCBcIkBmb250c291cmNlLXZhcmlhYmxlL2ludGVyXCI7XG4gIGltcG9ydCBcIi4uL2FwcC5jc3NcIjtcbiAgaW1wb3J0IHR5cGUgeyBTbmlwcGV0IH0gZnJvbSBcInN2ZWx0ZVwiO1xuICBpbXBvcnQgeyBzdHlsZVRoZW1lLCB0aGVtZVJlc29sdSB9IGZyb20gXCJAL2xpYi9hcHBhcmVuY2VcIjtcbiAgaW1wb3J0IHR5cGUgeyBMYXlvdXREYXRhIH0gZnJvbSBcIi4vJHR5cGVzXCI7XG5cbiAgbGV0IHsgZGF0YSwgY2hpbGRyZW4gfTogeyBkYXRhOiBMYXlvdXREYXRhOyBjaGlsZHJlbjogU25pcHBldCB9ID0gJHByb3BzKCk7XG5cbiAgY29uc3QgdGhlbWUgPSAkZGVyaXZlZCh0aGVtZVJlc29sdShkYXRhLmFwcGFyZW5jZSkpO1xuICBjb25zdCBjc3MgPSAkZGVyaXZlZChzdHlsZVRoZW1lKHRoZW1lKSk7XG48L3NjcmlwdD5cblxuPHN2ZWx0ZTpoZWFkPlxuICB7QGh0bWwgYDxzdHlsZT4ke2Nzc308L3N0eWxlPmB9XG4gIDxsaW5rIHJlbD1cImljb25cIiBocmVmPVwiL2Zhdmljb24uc3ZnXCIgdHlwZT1cImltYWdlL3N2Zyt4bWxcIiAvPlxuICA8bGluayByZWw9XCJhcHBsZS10b3VjaC1pY29uXCIgaHJlZj1cIi9pY29ucy9hcHBsZS10b3VjaC1pY29uLnBuZ1wiIC8+XG4gIDxtZXRhIG5hbWU9XCJ0aGVtZS1jb2xvclwiIGNvbnRlbnQ9e3RoZW1lLmNsYWlyLmFjY2VudH0gbWVkaWE9XCIocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KVwiIC8+XG4gIDxtZXRhIG5hbWU9XCJ0aGVtZS1jb2xvclwiIGNvbnRlbnQ9e3RoZW1lLnNvbWJyZS5hY2NlbnR9IG1lZGlhPVwiKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKVwiIC8+XG48L3N2ZWx0ZTpoZWFkPlxuXG57I2lmIGRhdGEuYXBlcmN1fVxuICA8ZGl2IGNsYXNzPVwiYXBlcmN1LWJhbmRlYXVcIiByb2xlPVwic3RhdHVzXCI+XG4gICAgPHNwYW4+QXBlcsOndSBkdSBicm91aWxsb24g4oCUIHZpc2libGUgdW5pcXVlbWVudCBwYXIgdm91cy48L3NwYW4+XG4gICAgPGZvcm0gbWV0aG9kPVwiUE9TVFwiIGFjdGlvbj1cIi9hcGVyY3UvZmluXCI+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwidWktYm91dG9uIHVpLWJvdXRvbi0tZmFudG9tZSB1aS1ib3V0b24tLXBldGl0XCIgdHlwZT1cInN1Ym1pdFwiPlxuICAgICAgICBRdWl0dGVyIGzigJlhcGVyw6d1XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Zvcm0+XG4gIDwvZGl2Plxuey9pZn1cblxuPGRpdlxuICBjbGFzcz1cImFwcGFyZW5jZVwiXG4gIGRhdGEtbmF2PXt0aGVtZS52YXJpYW50ZXMubmF2fVxuICBkYXRhLWVudGV0ZT17dGhlbWUudmFyaWFudGVzLmVudGV0ZX1cbj5cbiAge0ByZW5kZXIgY2hpbGRyZW4oKX1cbjwvZGl2PlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qdWxpZS9EZXNrdG9wL0xvY2F0aW9uIGNvdXJ0ZSBkdXJlZS92Mi9zcmMvcm91dGVzLytsYXlvdXQuc3ZlbHRlIn0=