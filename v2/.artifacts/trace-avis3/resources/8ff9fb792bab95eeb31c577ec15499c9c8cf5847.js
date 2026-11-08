import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/routes/hote/logements/+page.svelte");import "/node_modules/.vite/deps/svelte_internal_disclose-version.js?v=70f5904f";

_page[$.FILENAME] = 'src/routes/hote/logements/+page.svelte';

import * as $ from "/node_modules/.vite/deps/svelte_internal_client.js?v=70f5904f";

var root = $.add_locations($.from_html(`<p role="status"> </p>`), _page[$.FILENAME], [[73, 8]]);
var root_1 = $.add_locations($.from_html(`<p class="ui-carte border-dashed text-encre-douce">Aucun logement pour ce tenant. Créez le premier ci-dessus.</p>`), _page[$.FILENAME], [[93, 6]]);
var root_2 = $.add_locations($.from_html(`<span class="ui-badge ui-badge--alerte">copro à vérifier</span>`), _page[$.FILENAME], [[109, 16]]);

var root_3 = $.add_locations($.from_html(`<li class="flex flex-wrap items-center justify-between gap-3 p-4"><div><p class="font-medium"> </p> <p class="text-sm text-encre-faine"> </p></div> <div class="flex flex-wrap items-center gap-2"><!> <span class="ui-badge"> </span> <span class="ui-badge"> </span> <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit">Guide</a></div></li>`), _page[$.FILENAME], [
	[
		99,
		10,
		[
			[100, 12, [[101, 14], [102, 14]]],
			[107, 12, [[111, 14], [112, 14], [113, 14]]]
		]
	]
]);

var root_4 = $.add_locations($.from_html(`<ul class="divide-y divide-bordure overflow-hidden rounded-carte border border-bordure bg-surface"></ul>`), _page[$.FILENAME], [[97, 6]]);

var root_5 = $.add_locations($.from_html(`<main class="mx-auto max-w-4xl space-y-8 px-6 py-10"><header class="ui-entete space-y-2"><p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Espace hôte</p> <div class="flex flex-wrap items-end justify-between gap-3"><h1 class="text-3xl font-semibold tracking-tight">Logements</h1> <a class="ui-lien text-sm"> </a></div> <p class="text-encre-douce">Tenant : <span class="font-medium"> </span></p></header> <section class="ui-carte space-y-4"><div class="space-y-1"><h2 class="text-lg font-semibold">Ajouter un logement</h2> <p class="text-sm text-encre-douce">Le code est stable et unique par tenant. Toute création est auditée.</p></div> <form method="POST" action="?/creer" class="space-y-4"><div class="grid gap-4 sm:grid-cols-2"><label class="space-y-2"><span class="ui-label">Code</span> <input class="ui-champ" name="code" placeholder="log-1" pattern="[a-z0-9][a-z0-9-]{0,30}[a-z0-9]" required=""/> <span class="block text-xs text-encre-faine">minuscules, chiffres, tirets — stable dans les URL</span></label> <label class="space-y-2"><span class="ui-label">Nom</span> <input class="ui-champ" name="nom" placeholder="Santa Severa" required=""/></label></div> <label class="space-y-2"><span class="ui-label">Adresse (facultatif)</span> <input class="ui-champ" name="adresse" placeholder="Saint-Laurent-du-Var"/></label> <!> <button class="ui-bouton ui-bouton--primaire" type="submit">Créer le logement</button></form></section> <section class="space-y-3"><h2 class="text-lg font-semibold"> </h2> <!></section></main>`), _page[$.FILENAME], [
	[
		11,
		0,
		[
			[
				12,
				2,
				[[13, 4], [16, 4, [[17, 6], [18, 6]]], [22, 4, [[23, 15]]]]
			],

			[
				27,
				2,
				[
					[28, 4, [[29, 6], [30, 6]]],
					[
						35,
						4,
						[
							[
								36,
								6,
								[
									[37, 8, [[38, 10], [39, 10], [47, 10]]],
									[51, 8, [[52, 10], [53, 10]]]
								]
							],
							[62, 6, [[63, 8], [64, 8]]],
							[81, 6]
						]
					]
				]
			],
			[87, 2, [[88, 4]]]
		]
	]
]);

function _page($$anchor, $$props) {
	$.check_target(new.target);
	$.push($$props, true, _page);

	var $$exports = { ...$.legacy_api() };
	var main = root_5();

	$.head('khe41o', ($$anchor) => {
		$.effect(() => {
			$.document.title = 'Logements — LCD Parc';
		});
	});

	var header = $.child(main);
	var div = $.sibling($.child(header), 2);
	var a = $.sibling($.child(div), 2);
	var text = $.only_child(a, true);

	$.reset(div);

	var p = $.sibling(div, 2);
	var span = $.sibling($.child(p));
	var text_1 = $.only_child(span, true);

	$.reset(p);
	$.reset(header);

	var section = $.sibling(header, 2);
	var form_1 = $.sibling($.child(section), 2);
	var div_1 = $.child(form_1);
	var label = $.child(div_1);
	var input = $.sibling($.child(label), 2);

	$.remove_input_defaults(input);
	$.next(2);
	$.reset(label);

	var label_1 = $.sibling(label, 2);
	var input_1 = $.sibling($.child(label_1), 2);

	$.remove_input_defaults(input_1);
	$.reset(label_1);
	$.reset(div_1);

	var label_2 = $.sibling(div_1, 2);
	var input_2 = $.sibling($.child(label_2), 2);

	$.remove_input_defaults(input_2);
	$.reset(label_2);

	var node = $.sibling(label_2, 2);

	{
		var consequent = ($$anchor) => {
			var p_1 = root();
			var text_2 = $.only_child(p_1, true);

			$.template_effect(() => {
				$.set_class(p_1, 1, $.clsx($$props.form.ok
					? "ui-alerte ui-alerte--ok"
					: "ui-alerte ui-alerte--danger"));

				$.set_text(text_2, $$props.form.message);
			});

			$.append($$anchor, p_1);
		};

		$.add_svelte_meta(
			() => $.if(node, ($$render) => {
				if ($$props.form?.message) $$render(consequent);
			}),
			'if',
			_page,
			72,
			6
		);
	}

	$.next(2);
	$.reset(form_1);
	$.reset(section);

	var section_1 = $.sibling(section, 2);
	var h2 = $.child(section_1);
	var text_3 = $.only_child(h2);
	var node_1 = $.sibling(h2, 2);

	{
		var consequent_1 = ($$anchor) => {
			var p_2 = root_1();

			$.append($$anchor, p_2);
		};

		var alternate = ($$anchor) => {
			var ul = root_4();

			$.add_svelte_meta(
				() => $.each(ul, 21, () => $$props.data.logements, (logement) => logement.id, ($$anchor, logement) => {
					var li = root_3();
					var div_2 = $.child(li);
					var p_3 = $.child(div_2);
					var text_4 = $.only_child(p_3, true);
					var p_4 = $.sibling(p_3, 2);
					var text_5 = $.only_child(p_4);

					$.reset(div_2);

					var div_3 = $.sibling(div_2, 2);
					var node_2 = $.child(div_3);

					{
						var consequent_2 = ($$anchor) => {
							var span_1 = root_2();

							$.append($$anchor, span_1);
						};

						$.add_svelte_meta(
							() => $.if(node_2, ($$render) => {
								if (!$.get(logement).coproVerifiee) $$render(consequent_2);
							}),
							'if',
							_page,
							108,
							14
						);
					}

					var span_2 = $.sibling(node_2, 2);
					var text_6 = $.only_child(span_2, true);
					var span_3 = $.sibling(span_2, 2);
					var text_7 = $.only_child(span_3, true);
					var a_1 = $.sibling(span_3, 2);

					$.reset(div_3);
					$.reset(li);

					$.template_effect(() => {
						$.set_text(text_4, $.get(logement).nom);

						$.set_text(text_5, `${$.get(logement).code ?? ''}
                ${$.get(logement).adresse ? ` — ${$.get(logement).adresse}` : ""}`);

						$.set_text(text_6, $.get(logement).statut);
						$.set_text(text_7, $.get(logement).publication);
						$.set_attribute(a_1, 'href', `/hote/logements/${$.get(logement).id}`);
					});

					$.append($$anchor, li);
				}),
				'each',
				_page,
				98,
				8
			);

			$.reset(ul);
			$.append($$anchor, ul);
		};

		$.add_svelte_meta(
			() => $.if(node_1, ($$render) => {
				if ($.strict_equals($$props.data.logements.length, 0)) $$render(consequent_1); else $$render(alternate, -1);
			}),
			'if',
			_page,
			92,
			4
		);
	}

	$.reset(section_1);
	$.reset(main);

	$.template_effect(() => {
		$.set_attribute(a, 'href', $$props.data.tous ? "/hote/logements" : "/hote/logements?tous=1");
		$.set_text(text, $$props.data.tous ? "Masquer les archivés" : "Afficher les archivés");
		$.set_text(text_1, $$props.data.tenantId);
		$.set_value(input, $$props.form?.code ?? "");
		$.set_value(input_1, $$props.form?.nom ?? "");
		$.set_value(input_2, $$props.form?.adresse ?? "");
		$.set_text(text_3, `${$$props.data.logements.length ?? ''} logement${$$props.data.logements.length > 1 ? "s" : ""}`);
	});

	$.append($$anchor, main);

	return $.pop($$exports);
}

if (import.meta.hot) {
	_page = $.hmr(_page);

	import.meta.hot.acceptExports(["default"],(module) => {
		_page[$.HMR].update(module.default);
	});
}

export default _page;
//# sourceMappingURL=data:application/json;base64,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LGNBQU0sR0FBRyxJQUFJLEVBQUU7Y0FPekIsU0FJUSxjQUFNLE9BQU8sSUFBSSxFQUFFO3dCQXFCN0IsYUFBSyxTQUFTLENBQUMsTUFBTSxrQkFBVyxhQUFLLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxFQUFFOzs7b0JBOUUxRSxJQUFJOzs7QUFORyIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiK3BhZ2Uuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQgbGFuZz1cInRzXCI+XG4gIGltcG9ydCB0eXBlIHsgQWN0aW9uRGF0YSwgUGFnZURhdGEgfSBmcm9tIFwiLi8kdHlwZXNcIjtcblxuICBsZXQgeyBkYXRhLCBmb3JtIH06IHsgZGF0YTogUGFnZURhdGE7IGZvcm06IEFjdGlvbkRhdGEgfSA9ICRwcm9wcygpO1xuPC9zY3JpcHQ+XG5cbjxzdmVsdGU6aGVhZD5cbiAgPHRpdGxlPkxvZ2VtZW50cyDigJQgTENEIFBhcmM8L3RpdGxlPlxuPC9zdmVsdGU6aGVhZD5cblxuPG1haW4gY2xhc3M9XCJteC1hdXRvIG1heC13LTR4bCBzcGFjZS15LTggcHgtNiBweS0xMFwiPlxuICA8aGVhZGVyIGNsYXNzPVwidWktZW50ZXRlIHNwYWNlLXktMlwiPlxuICAgIDxwIGNsYXNzPVwidGV4dC1zbSBmb250LW1lZGl1bSB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IHRleHQtZW5jcmUtZmFpbmVcIj5cbiAgICAgIEVzcGFjZSBow7R0ZVxuICAgIDwvcD5cbiAgICA8ZGl2IGNsYXNzPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtZW5kIGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiPlxuICAgICAgPGgxIGNsYXNzPVwidGV4dC0zeGwgZm9udC1zZW1pYm9sZCB0cmFja2luZy10aWdodFwiPkxvZ2VtZW50czwvaDE+XG4gICAgICA8YSBjbGFzcz1cInVpLWxpZW4gdGV4dC1zbVwiIGhyZWY9e2RhdGEudG91cyA/IFwiL2hvdGUvbG9nZW1lbnRzXCIgOiBcIi9ob3RlL2xvZ2VtZW50cz90b3VzPTFcIn0+XG4gICAgICAgIHtkYXRhLnRvdXMgPyBcIk1hc3F1ZXIgbGVzIGFyY2hpdsOpc1wiIDogXCJBZmZpY2hlciBsZXMgYXJjaGl2w6lzXCJ9XG4gICAgICA8L2E+XG4gICAgPC9kaXY+XG4gICAgPHAgY2xhc3M9XCJ0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICBUZW5hbnQgOiA8c3BhbiBjbGFzcz1cImZvbnQtbWVkaXVtXCI+e2RhdGEudGVuYW50SWR9PC9zcGFuPlxuICAgIDwvcD5cbiAgPC9oZWFkZXI+XG5cbiAgPHNlY3Rpb24gY2xhc3M9XCJ1aS1jYXJ0ZSBzcGFjZS15LTRcIj5cbiAgICA8ZGl2IGNsYXNzPVwic3BhY2UteS0xXCI+XG4gICAgICA8aDIgY2xhc3M9XCJ0ZXh0LWxnIGZvbnQtc2VtaWJvbGRcIj5Bam91dGVyIHVuIGxvZ2VtZW50PC9oMj5cbiAgICAgIDxwIGNsYXNzPVwidGV4dC1zbSB0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICAgIExlIGNvZGUgZXN0IHN0YWJsZSBldCB1bmlxdWUgcGFyIHRlbmFudC4gVG91dGUgY3LDqWF0aW9uIGVzdCBhdWRpdMOpZS5cbiAgICAgIDwvcD5cbiAgICA8L2Rpdj5cblxuICAgIDxmb3JtIG1ldGhvZD1cIlBPU1RcIiBhY3Rpb249XCI/L2NyZWVyXCIgY2xhc3M9XCJzcGFjZS15LTRcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJncmlkIGdhcC00IHNtOmdyaWQtY29scy0yXCI+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cInNwYWNlLXktMlwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwidWktbGFiZWxcIj5Db2RlPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgY2xhc3M9XCJ1aS1jaGFtcFwiXG4gICAgICAgICAgICBuYW1lPVwiY29kZVwiXG4gICAgICAgICAgICBwbGFjZWhvbGRlcj1cImxvZy0xXCJcbiAgICAgICAgICAgIHBhdHRlcm49XCJbYS16MC05XVthLXowLTktXSYjMTIzOzAsMzAmIzEyNTtbYS16MC05XVwiXG4gICAgICAgICAgICB2YWx1ZT17Zm9ybT8uY29kZSA/PyBcIlwifVxuICAgICAgICAgICAgcmVxdWlyZWRcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYmxvY2sgdGV4dC14cyB0ZXh0LWVuY3JlLWZhaW5lXCI+XG4gICAgICAgICAgICBtaW51c2N1bGVzLCBjaGlmZnJlcywgdGlyZXRzIOKAlCBzdGFibGUgZGFucyBsZXMgVVJMXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2xhYmVsPlxuICAgICAgICA8bGFiZWwgY2xhc3M9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInVpLWxhYmVsXCI+Tm9tPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgY2xhc3M9XCJ1aS1jaGFtcFwiXG4gICAgICAgICAgICBuYW1lPVwibm9tXCJcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU2FudGEgU2V2ZXJhXCJcbiAgICAgICAgICAgIHZhbHVlPXtmb3JtPy5ub20gPz8gXCJcIn1cbiAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9sYWJlbD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGxhYmVsIGNsYXNzPVwic3BhY2UteS0yXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwidWktbGFiZWxcIj5BZHJlc3NlIChmYWN1bHRhdGlmKTwvc3Bhbj5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgY2xhc3M9XCJ1aS1jaGFtcFwiXG4gICAgICAgICAgbmFtZT1cImFkcmVzc2VcIlxuICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU2FpbnQtTGF1cmVudC1kdS1WYXJcIlxuICAgICAgICAgIHZhbHVlPXtmb3JtPy5hZHJlc3NlID8/IFwiXCJ9XG4gICAgICAgIC8+XG4gICAgICA8L2xhYmVsPlxuXG4gICAgICB7I2lmIGZvcm0/Lm1lc3NhZ2V9XG4gICAgICAgIDxwXG4gICAgICAgICAgY2xhc3M9e2Zvcm0ub2sgPyBcInVpLWFsZXJ0ZSB1aS1hbGVydGUtLW9rXCIgOiBcInVpLWFsZXJ0ZSB1aS1hbGVydGUtLWRhbmdlclwifVxuICAgICAgICAgIHJvbGU9XCJzdGF0dXNcIlxuICAgICAgICA+XG4gICAgICAgICAge2Zvcm0ubWVzc2FnZX1cbiAgICAgICAgPC9wPlxuICAgICAgey9pZn1cblxuICAgICAgPGJ1dHRvbiBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLXByaW1haXJlXCIgdHlwZT1cInN1Ym1pdFwiPlxuICAgICAgICBDcsOpZXIgbGUgbG9nZW1lbnRcbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZm9ybT5cbiAgPC9zZWN0aW9uPlxuXG4gIDxzZWN0aW9uIGNsYXNzPVwic3BhY2UteS0zXCI+XG4gICAgPGgyIGNsYXNzPVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+XG4gICAgICB7ZGF0YS5sb2dlbWVudHMubGVuZ3RofSBsb2dlbWVudHtkYXRhLmxvZ2VtZW50cy5sZW5ndGggPiAxID8gXCJzXCIgOiBcIlwifVxuICAgIDwvaDI+XG5cbiAgICB7I2lmIGRhdGEubG9nZW1lbnRzLmxlbmd0aCA9PT0gMH1cbiAgICAgIDxwIGNsYXNzPVwidWktY2FydGUgYm9yZGVyLWRhc2hlZCB0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICAgIEF1Y3VuIGxvZ2VtZW50IHBvdXIgY2UgdGVuYW50LiBDcsOpZXogbGUgcHJlbWllciBjaS1kZXNzdXMuXG4gICAgICA8L3A+XG4gICAgezplbHNlfVxuICAgICAgPHVsIGNsYXNzPVwiZGl2aWRlLXkgZGl2aWRlLWJvcmR1cmUgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtY2FydGUgYm9yZGVyIGJvcmRlci1ib3JkdXJlIGJnLXN1cmZhY2VcIj5cbiAgICAgICAgeyNlYWNoIGRhdGEubG9nZW1lbnRzIGFzIGxvZ2VtZW50IChsb2dlbWVudC5pZCl9XG4gICAgICAgICAgPGxpIGNsYXNzPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMyBwLTRcIj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxwIGNsYXNzPVwiZm9udC1tZWRpdW1cIj57bG9nZW1lbnQubm9tfTwvcD5cbiAgICAgICAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LXNtIHRleHQtZW5jcmUtZmFpbmVcIj5cbiAgICAgICAgICAgICAgICB7bG9nZW1lbnQuY29kZX1cbiAgICAgICAgICAgICAgICB7bG9nZW1lbnQuYWRyZXNzZSA/IGAg4oCUICR7bG9nZW1lbnQuYWRyZXNzZX1gIDogXCJcIn1cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgIHsjaWYgIWxvZ2VtZW50LmNvcHJvVmVyaWZpZWV9XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1iYWRnZSB1aS1iYWRnZS0tYWxlcnRlXCI+Y29wcm8gw6AgdsOpcmlmaWVyPC9zcGFuPlxuICAgICAgICAgICAgICB7L2lmfVxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInVpLWJhZGdlXCI+e2xvZ2VtZW50LnN0YXR1dH08L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidWktYmFkZ2VcIj57bG9nZW1lbnQucHVibGljYXRpb259PC9zcGFuPlxuICAgICAgICAgICAgICA8YSBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLXNlY29uZGFpcmUgdWktYm91dG9uLS1wZXRpdFwiIGhyZWY9e2AvaG90ZS9sb2dlbWVudHMvJHtsb2dlbWVudC5pZH1gfT5cbiAgICAgICAgICAgICAgICBHdWlkZVxuICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2xpPlxuICAgICAgICB7L2VhY2h9XG4gICAgICA8L3VsPlxuICAgIHsvaWZ9XG4gIDwvc2VjdGlvbj5cbjwvbWFpbj5cbiJdLCJmaWxlIjoiQzovVXNlcnMvanVsaWUvRGVza3RvcC9Mb2NhdGlvbiBjb3VydGUgZHVyZWUvdjIvc3JjL3JvdXRlcy9ob3RlL2xvZ2VtZW50cy8rcGFnZS5zdmVsdGUifQ==