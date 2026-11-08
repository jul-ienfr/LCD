import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/routes/hote/onboarding/+page.svelte");import "/node_modules/.vite/deps/svelte_internal_disclose-version.js?v=70f5904f";

_page[$.FILENAME] = 'src/routes/hote/onboarding/+page.svelte';

import * as $ from "/node_modules/.vite/deps/svelte_internal_client.js?v=70f5904f";

var root = $.add_locations($.from_html(`<p class="ui-alerte ui-alerte--ok" role="status">Vérification copropriété enregistrée.</p>`), _page[$.FILENAME], [[28, 4]]);
var root_1 = $.add_locations($.from_html(`<p class="ui-alerte ui-alerte--ok" role="status">Publication mise à jour.</p>`), _page[$.FILENAME], [[33, 4]]);

var root_2 = $.add_locations(
	$.from_html(`<p class="ui-alerte ui-alerte--danger" role="alert">Publication refusée : vérifiez d’abord la copropriété et le statut actif du
      logement.</p>`),
	_page[$.FILENAME],
	[[38, 4]]
);

var root_3 = $.add_locations($.from_html(`<p class="ui-alerte ui-alerte--danger" role="alert"> </p>`), _page[$.FILENAME], [[43, 4]]);
var root_4 = $.add_locations($.from_html(`<section class="ui-carte space-y-3 text-center"><h2 class="text-lg font-semibold">Aucun logement</h2> <p class="text-sm text-encre-douce">Créez un premier logement pour démarrer l’onboarding.</p> <a class="ui-bouton ui-bouton--encre" href="/hote/logements">Créer un logement</a></section>`), _page[$.FILENAME], [[51, 4, [[52, 6], [53, 6], [56, 6]]]]);
var root_5 = $.add_locations($.from_html(`<a> </a>`), _page[$.FILENAME], [[65, 10]]);
var root_6 = $.add_locations($.from_html(`<nav class="flex flex-wrap gap-2" aria-label="Choisir un logement"></nav>`), _page[$.FILENAME], [[63, 6]]);
var root_7 = $.add_locations($.from_html(`<span class="ui-badge ui-badge--accent">Prêt à réserver</span>`), _page[$.FILENAME], [[88, 10]]);
var root_8 = $.add_locations($.from_html(`<span class="ui-badge ui-badge--alerte">Non publiable</span>`), _page[$.FILENAME], [[90, 10]]);

var root_9 = $.add_locations($.from_html(`<form method="POST" action="?/copro" class="mt-4 flex flex-wrap items-center gap-4 border-t border-bordure pt-4"><input type="hidden" name="logementId"/> <label class="flex items-start gap-3 rounded-xl border border-bordure p-3 text-sm"><input class="mt-1" name="coproVerifiee" type="checkbox"/> <span><span class="font-medium">Règlement, PV et accord du syndic vérifiés</span> <span class="mt-0.5 block text-encre-douce">Décochez pour remasquer le logement.</span></span></label> <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">Enregistrer</button></form>`), _page[$.FILENAME], [
	[
		134,
		12,
		[
			[139, 14],
			[140, 14, [[143, 16], [149, 16, [[150, 18], [153, 18]]]]],
			[158, 14]
		]
	]
]);

var root_10 = $.add_locations($.from_html(`<p class="mt-2 text-sm text-alerte">Vérifiez la copropriété avant de publier.</p>`), _page[$.FILENAME], [[197, 16]]);

var root_11 = $.add_locations(
	$.from_html(`<div class="mt-4 border-t border-bordure pt-4"><p class="text-sm text-encre-douce">État de publication : <span class="font-semibold"> </span>. Un logement en brouillon n’apparaît jamais sur /reserver,
                même vérifié.</p> <form method="POST" action="?/publication" class="mt-3 flex flex-wrap items-center gap-3"><input type="hidden" name="logementId"/> <input type="hidden" name="publication"/> <button class="ui-bouton ui-bouton--encre ui-bouton--petit" type="submit"> </button></form> <!></div>`),
	_page[$.FILENAME],
	[
		[
			165,
			12,
			[
				[166, 14, [[168, 16]]],
				[173, 14, [[178, 16], [179, 16], [186, 16]]]
			]
		]
	]
);

var root_12 = $.add_locations($.from_html(`<a class="mt-3 inline-block text-sm underline"> </a>`), _page[$.FILENAME], [[205, 12]]);

var root_13 = $.add_locations($.from_html(`<li class="ui-carte--p5 rounded-2xl border border-bordure bg-surface shadow-sm"><div class="flex flex-wrap items-start justify-between gap-3"><div class="flex items-start gap-3"><span aria-hidden="true"> </span> <div><h3 class="font-semibold"> </h3> <p class="mt-1 max-w-2xl text-sm text-encre-douce"> </p></div></div> <span> </span></div> <!> <!> <!></li>`), _page[$.FILENAME], [
	[
		106,
		8,
		[
			[
				107,
				10,
				[
					[108, 12, [[109, 14], [117, 14, [[118, 16], [119, 16]]]]],
					[124, 12]
				]
			]
		]
	]
]);

var root_14 = $.add_locations($.from_html(`<!> <section class="ui-carte space-y-3"><div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-lg font-semibold"> </h2> <p class="mt-1 text-sm text-encre-douce"> </p></div> <!></div> <div aria-hidden="true" class="h-2 w-full overflow-hidden rounded-full bg-surface-2"><div class="h-full rounded-full bg-accent"></div></div></section> <ol class="space-y-3"></ol> <p class="text-sm text-encre-douce"> </p>`, 1), _page[$.FILENAME], [
	[
		77,
		4,
		[[78, 6, [[79, 8, [[80, 10], [83, 10]]]]], [93, 6, [[97, 8]]]]
	],
	[104, 4],
	[213, 4]
]);

var root_15 = $.add_locations(
	$.from_html(`<main class="mx-auto max-w-4xl space-y-8 px-6 py-12"><header class="flex flex-wrap items-end justify-between gap-4"><div class="space-y-2"><p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Nouveau logement · conformité</p> <h1 class="text-3xl font-semibold tracking-tight">Onboarding</h1> <p class="max-w-2xl text-encre-douce">Les conditions réelles avant qu’un logement puisse être proposé aux
        voyageurs. Aucune case n’est décorative : chaque étape est vérifiée sur
        les données enregistrées.</p></div> <a class="text-sm underline" href="/hote">Retour au tableau de bord</a></header> <!> <!> <!> <!> <footer class="flex flex-wrap gap-4 border-t border-bordure pt-4 text-sm"><a class="underline" href="/hote/annonce">Conformité de l’annonce</a> <a class="underline" href="/hote/logements">Logements</a> <a class="underline" href="/hote">Tableau de bord</a></footer></main>`),
	_page[$.FILENAME],
	[
		[
			11,
			0,
			[
				[12, 2, [[13, 4, [[14, 6], [17, 6], [18, 6]]], [24, 4]]],
				[220, 2, [[221, 4], [222, 4], [223, 4]]]
			]
		]
	]
);

function _page($$anchor, $$props) {
	$.check_target(new.target);
	$.push($$props, true, _page);

	var $$exports = { ...$.legacy_api() };
	var main = root_15();

	$.head('vkjxn5', ($$anchor) => {
		$.effect(() => {
			$.document.title = 'Onboarding — Espace hôte';
		});
	});

	var node = $.sibling($.child(main), 2);

	{
		var consequent = ($$anchor) => {
			var p = root();

			$.append($$anchor, p);
		};

		$.add_svelte_meta(
			() => $.if(node, ($$render) => {
				if ($$props.data.copro) $$render(consequent);
			}),
			'if',
			_page,
			27,
			2
		);
	}

	var node_1 = $.sibling(node, 2);

	{
		var consequent_1 = ($$anchor) => {
			var p_1 = root_1();

			$.append($$anchor, p_1);
		};

		$.add_svelte_meta(
			() => $.if(node_1, ($$render) => {
				if ($$props.data.publication) $$render(consequent_1);
			}),
			'if',
			_page,
			32,
			2
		);
	}

	var node_2 = $.sibling(node_1, 2);

	{
		var consequent_2 = ($$anchor) => {
			var p_2 = root_2();

			$.append($$anchor, p_2);
		};

		var consequent_3 = ($$anchor) => {
			var p_3 = root_3();
			var text = $.only_child(p_3, true);

			$.template_effect(() => $.set_text(text, $.strict_equals($$props.data.erreur, "inattendu") ? "Erreur inattendue. Réessayez." : $$props.data.erreur));
			$.append($$anchor, p_3);
		};

		$.add_svelte_meta(
			() => $.if(node_2, ($$render) => {
				if ($.strict_equals($$props.data.erreur, "publication")) $$render(consequent_2); else if ($$props.data.erreur) $$render(consequent_3, 1);
			}),
			'if',
			_page,
			37,
			2
		);
	}

	var node_3 = $.sibling(node_2, 2);

	{
		var consequent_4 = ($$anchor) => {
			var section = root_4();

			$.append($$anchor, section);
		};

		var alternate_1 = ($$anchor) => {
			const logement = $.tag($.derived(() => $$props.data.logement), 'logement');

			$.get(logement);

			var fragment = root_14();
			var node_4 = $.first_child(fragment);

			{
				var consequent_5 = ($$anchor) => {
					var nav = root_6();

					$.add_svelte_meta(
						() => $.each(nav, 21, () => $$props.data.logements, (choix) => choix.id, ($$anchor, choix) => {
							var a = root_5();
							var text_1 = $.only_child(a, true);

							$.template_effect(() => {
								$.set_class(a, 1, $.clsx($.strict_equals($.get(choix).id, $.get(logement).id)
									? "ui-bouton ui-bouton--primaire ui-bouton--petit"
									: "ui-bouton ui-bouton--secondaire ui-bouton--petit"));

								$.set_attribute(a, 'href', `/hote/onboarding?logement=${$.get(choix).id}`);
								$.set_text(text_1, $.get(choix).nom);
							});

							$.append($$anchor, a);
						}),
						'each',
						_page,
						64,
						8
					);

					$.reset(nav);
					$.append($$anchor, nav);
				};

				$.add_svelte_meta(
					() => $.if(node_4, ($$render) => {
						if ($$props.data.logements.length > 1) $$render(consequent_5);
					}),
					'if',
					_page,
					62,
					4
				);
			}

			var section_1 = $.sibling(node_4, 2);
			var div = $.child(section_1);
			var div_1 = $.child(div);
			var h2 = $.child(div_1);
			var text_2 = $.only_child(h2);
			var p_4 = $.sibling(h2, 2);
			var text_3 = $.only_child(p_4);

			$.reset(div_1);

			var node_5 = $.sibling(div_1, 2);

			{
				var consequent_6 = ($$anchor) => {
					var span = root_7();

					$.append($$anchor, span);
				};

				var alternate = ($$anchor) => {
					var span_1 = root_8();

					$.append($$anchor, span_1);
				};

				$.add_svelte_meta(
					() => $.if(node_5, ($$render) => {
						if ($$props.data.pret) $$render(consequent_6); else $$render(alternate, -1);
					}),
					'if',
					_page,
					87,
					8
				);
			}

			$.reset(div);

			var div_2 = $.sibling(div, 2);
			var div_3 = $.only_child(div_2);

			$.reset(section_1);

			var ol = $.sibling(section_1, 2);

			$.add_svelte_meta(
				() => $.each(ol, 21, () => $$props.data.etapes, (etape) => etape.code, ($$anchor, etape) => {
					var li = root_13();
					var div_4 = $.child(li);
					var div_5 = $.child(div_4);
					var span_2 = $.child(div_5);
					var text_4 = $.only_child(span_2, true);
					var div_6 = $.sibling(span_2, 2);
					var h3 = $.child(div_6);
					var text_5 = $.only_child(h3, true);
					var p_5 = $.sibling(h3, 2);
					var text_6 = $.only_child(p_5, true);

					$.reset(div_6);
					$.reset(div_5);

					var span_3 = $.sibling(div_5, 2);
					var text_7 = $.only_child(span_3, true);

					$.reset(div_4);

					var node_6 = $.sibling(div_4, 2);

					{
						var consequent_7 = ($$anchor) => {
							var form = root_9();
							var input = $.child(form);

							$.remove_input_defaults(input);

							var label = $.sibling(input, 2);
							var input_1 = $.child(label);

							$.next(2);
							$.reset(label);
							$.next(2);
							$.reset(form);

							$.template_effect(() => {
								$.set_value(input, $.get(logement).id);
								input_1.defaultChecked = $.get(logement).coproVerifiee;
							});

							$.append($$anchor, form);
						};

						$.add_svelte_meta(
							() => $.if(node_6, ($$render) => {
								if ($.strict_equals($.get(etape).code, "copro")) $$render(consequent_7);
							}),
							'if',
							_page,
							133,
							10
						);
					}

					var node_7 = $.sibling(node_6, 2);

					{
						var consequent_9 = ($$anchor) => {
							var div_7 = root_11();
							var p_6 = $.child(div_7);
							var span_4 = $.sibling($.child(p_6));
							var text_8 = $.only_child(span_4, true);

							$.next();
							$.reset(p_6);

							var form_1 = $.sibling(p_6, 2);
							var input_2 = $.child(form_1);

							$.remove_input_defaults(input_2);

							var input_3 = $.sibling(input_2, 2);

							$.remove_input_defaults(input_3);

							var button = $.sibling(input_3, 2);
							var text_9 = $.only_child(button, true);

							$.reset(form_1);

							var node_8 = $.sibling(form_1, 2);

							{
								var consequent_8 = ($$anchor) => {
									var p_7 = root_10();

									$.append($$anchor, p_7);
								};

								$.add_svelte_meta(
									() => $.if(node_8, ($$render) => {
										if ($.strict_equals($.get(logement).publication, "publiee", false) && !$$props.data.peutPublier) $$render(consequent_8);
									}),
									'if',
									_page,
									196,
									14
								);
							}

							$.reset(div_7);

							$.template_effect(() => {
								$.set_text(text_8, $.strict_equals($.get(logement).publication, "publiee") ? "publié" : "brouillon");
								$.set_value(input_2, $.get(logement).id);
								$.set_value(input_3, $.strict_equals($.get(logement).publication, "publiee") ? "brouillon" : "publiee");
								button.disabled = $.strict_equals($.get(logement).publication, "publiee", false) && !$$props.data.peutPublier;
								$.set_text(text_9, $.strict_equals($.get(logement).publication, "publiee") ? "Dépublier le logement" : "Publier le logement");
							});

							$.append($$anchor, div_7);
						};

						$.add_svelte_meta(
							() => $.if(node_7, ($$render) => {
								if ($.strict_equals($.get(etape).code, "golive")) $$render(consequent_9);
							}),
							'if',
							_page,
							164,
							10
						);
					}

					var node_9 = $.sibling(node_7, 2);

					{
						var consequent_10 = ($$anchor) => {
							var a_1 = root_12();
							var text_10 = $.only_child(a_1, true);

							$.template_effect(() => {
								$.set_attribute(a_1, 'href', $.get(etape).lien.href);
								$.set_text(text_10, $.get(etape).lien.label);
							});

							$.append($$anchor, a_1);
						};

						$.add_svelte_meta(
							() => $.if(node_9, ($$render) => {
								if ($.get(etape).lien) $$render(consequent_10);
							}),
							'if',
							_page,
							204,
							10
						);
					}

					$.reset(li);

					$.template_effect(() => {
						$.set_class(span_2, 1, $.clsx($.get(etape).fait
							? "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-fond"
							: "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-bordure text-xs font-bold text-encre-faine"));

						$.set_text(text_4, $.get(etape).fait ? "✓" : "");
						$.set_text(text_5, $.get(etape).titre);
						$.set_text(text_6, $.get(etape).detail);

						$.set_class(span_3, 1, $.clsx($.get(etape).fait
							? "ui-badge ui-badge--accent"
							: "ui-badge ui-badge--alerte"));

						$.set_text(text_7, $.get(etape).fait ? "Fait" : "À faire");
					});

					$.append($$anchor, li);
				}),
				'each',
				_page,
				105,
				6
			);

			$.reset(ol);

			var p_8 = $.sibling(ol, 2);
			var text_11 = $.only_child(p_8, true);

			$.template_effect(() => {
				$.set_text(text_2, `Avancement — ${$.get(logement).nom ?? ''}`);
				$.set_text(text_3, `${$$props.data.faites ?? ''} / ${$$props.data.etapes.length ?? ''} étapes · ${$$props.data.pourcentage ?? ''} %`);
				$.set_style(div_3, `width: ${$$props.data.pourcentage}%`);

				$.set_text(text_11, $$props.data.pret
					? `Le logement est visible sur /reserver?tenant=${$$props.data.tenantSlug}.`
					: "Tant que les étapes 1 à 5 ne sont pas complètes, le logement n’apparaît pas sur la page de réservation publique.");
			});

			$.append($$anchor, fragment);
		};

		$.add_svelte_meta(
			() => $.if(node_3, ($$render) => {
				if (!$$props.data.logement) $$render(consequent_4); else $$render(alternate_1, -1);
			}),
			'if',
			_page,
			50,
			2
		);
	}

	$.next(2);
	$.reset(main);
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
//# sourceMappingURL=data:application/json;base64,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R0ssV0FBSyxFQUFDLEtBQUs7eUJBRW5DLFdBQUssRUFBQyxNQUFNOztrQkFJbEIsa0JBQ1EsV0FBSyxFQUFDO1NBQ1QsMkJBQTBCO1NBQzFCLDJCQUEyQjs7eUJBRTlCLFdBQUssRUFBQyxJQUFJLEdBQUcsTUFBTSxHQUFHLFNBQVM7Ozt3QkF2QnJDLEVBQUU7Ozs7Ozs7O1dBRk4sRUFBRTs7T0E2R0YsR0FBRSxBQUFELGFBN0dELEVBQUU7OEJBNkdGLEdBQUUsQUFBRDs7O3VDQXBJb0IsY0FBUSxFQUFDLEdBQUc7MEJBR3pCLGFBQUssTUFBTSxZQUFLLGFBQUssTUFBTSxDQUFDLE1BQU0sbUJBQVksYUFBSyxXQUFXO2dCQWFsRSxPQUVRLFVBQVUsYUFBSyxXQUFXLEdBQUc7O3dCQW1IdkMsYUFBSztPQUNGLGdEQUFnRCxhQUFLLFVBQVUsR0FBRTtPQUNqRSxrSEFBa0g7Ozs7Ozs7O1FBdEtySCxDQUFDLGFBQUssUUFBUTs7Ozs7Ozs7OztTQXZDcEIsSUFBSTtvQkFBSixJQUFJOzs7QUFORyIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiK3BhZ2Uuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQgbGFuZz1cInRzXCI+XG4gIGltcG9ydCB0eXBlIHsgUGFnZURhdGEgfSBmcm9tIFwiLi8kdHlwZXNcIjtcblxuICBsZXQgeyBkYXRhIH06IHsgZGF0YTogUGFnZURhdGEgfSA9ICRwcm9wcygpO1xuPC9zY3JpcHQ+XG5cbjxzdmVsdGU6aGVhZD5cbiAgPHRpdGxlPk9uYm9hcmRpbmcg4oCUIEVzcGFjZSBow7R0ZTwvdGl0bGU+XG48L3N2ZWx0ZTpoZWFkPlxuXG48bWFpbiBjbGFzcz1cIm14LWF1dG8gbWF4LXctNHhsIHNwYWNlLXktOCBweC02IHB5LTEyXCI+XG4gIDxoZWFkZXIgY2xhc3M9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1lbmQganVzdGlmeS1iZXR3ZWVuIGdhcC00XCI+XG4gICAgPGRpdiBjbGFzcz1cInNwYWNlLXktMlwiPlxuICAgICAgPHAgY2xhc3M9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgdGV4dC1lbmNyZS1mYWluZVwiPlxuICAgICAgICBOb3V2ZWF1IGxvZ2VtZW50IMK3IGNvbmZvcm1pdMOpXG4gICAgICA8L3A+XG4gICAgICA8aDEgY2xhc3M9XCJ0ZXh0LTN4bCBmb250LXNlbWlib2xkIHRyYWNraW5nLXRpZ2h0XCI+T25ib2FyZGluZzwvaDE+XG4gICAgICA8cCBjbGFzcz1cIm1heC13LTJ4bCB0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICAgIExlcyBjb25kaXRpb25zIHLDqWVsbGVzIGF2YW50IHF14oCZdW4gbG9nZW1lbnQgcHVpc3NlIMOqdHJlIHByb3Bvc8OpIGF1eFxuICAgICAgICB2b3lhZ2V1cnMuIEF1Y3VuZSBjYXNlIG7igJllc3QgZMOpY29yYXRpdmUgOiBjaGFxdWUgw6l0YXBlIGVzdCB2w6lyaWZpw6llIHN1clxuICAgICAgICBsZXMgZG9ubsOpZXMgZW5yZWdpc3Ryw6llcy5cbiAgICAgIDwvcD5cbiAgICA8L2Rpdj5cbiAgICA8YSBjbGFzcz1cInRleHQtc20gdW5kZXJsaW5lXCIgaHJlZj1cIi9ob3RlXCI+UmV0b3VyIGF1IHRhYmxlYXUgZGUgYm9yZDwvYT5cbiAgPC9oZWFkZXI+XG5cbiAgeyNpZiBkYXRhLmNvcHJvfVxuICAgIDxwIGNsYXNzPVwidWktYWxlcnRlIHVpLWFsZXJ0ZS0tb2tcIiByb2xlPVwic3RhdHVzXCI+XG4gICAgICBWw6lyaWZpY2F0aW9uIGNvcHJvcHJpw6l0w6kgZW5yZWdpc3Ryw6llLlxuICAgIDwvcD5cbiAgey9pZn1cbiAgeyNpZiBkYXRhLnB1YmxpY2F0aW9ufVxuICAgIDxwIGNsYXNzPVwidWktYWxlcnRlIHVpLWFsZXJ0ZS0tb2tcIiByb2xlPVwic3RhdHVzXCI+XG4gICAgICBQdWJsaWNhdGlvbiBtaXNlIMOgIGpvdXIuXG4gICAgPC9wPlxuICB7L2lmfVxuICB7I2lmIGRhdGEuZXJyZXVyID09PSBcInB1YmxpY2F0aW9uXCJ9XG4gICAgPHAgY2xhc3M9XCJ1aS1hbGVydGUgdWktYWxlcnRlLS1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj5cbiAgICAgIFB1YmxpY2F0aW9uIHJlZnVzw6llIDogdsOpcmlmaWV6IGTigJlhYm9yZCBsYSBjb3Byb3ByacOpdMOpIGV0IGxlIHN0YXR1dCBhY3RpZiBkdVxuICAgICAgbG9nZW1lbnQuXG4gICAgPC9wPlxuICB7OmVsc2UgaWYgZGF0YS5lcnJldXJ9XG4gICAgPHAgY2xhc3M9XCJ1aS1hbGVydGUgdWktYWxlcnRlLS1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj5cbiAgICAgIHtkYXRhLmVycmV1ciA9PT0gXCJpbmF0dGVuZHVcIlxuICAgICAgICA/IFwiRXJyZXVyIGluYXR0ZW5kdWUuIFLDqWVzc2F5ZXouXCJcbiAgICAgICAgOiBkYXRhLmVycmV1cn1cbiAgICA8L3A+XG4gIHsvaWZ9XG5cbiAgeyNpZiAhZGF0YS5sb2dlbWVudH1cbiAgICA8c2VjdGlvbiBjbGFzcz1cInVpLWNhcnRlIHNwYWNlLXktMyB0ZXh0LWNlbnRlclwiPlxuICAgICAgPGgyIGNsYXNzPVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+QXVjdW4gbG9nZW1lbnQ8L2gyPlxuICAgICAgPHAgY2xhc3M9XCJ0ZXh0LXNtIHRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgICAgQ3LDqWV6IHVuIHByZW1pZXIgbG9nZW1lbnQgcG91ciBkw6ltYXJyZXIgbOKAmW9uYm9hcmRpbmcuXG4gICAgICA8L3A+XG4gICAgICA8YSBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLWVuY3JlXCIgaHJlZj1cIi9ob3RlL2xvZ2VtZW50c1wiPlxuICAgICAgICBDcsOpZXIgdW4gbG9nZW1lbnRcbiAgICAgIDwvYT5cbiAgICA8L3NlY3Rpb24+XG4gIHs6ZWxzZX1cbiAgICB7QGNvbnN0IGxvZ2VtZW50ID0gZGF0YS5sb2dlbWVudH1cbiAgICB7I2lmIGRhdGEubG9nZW1lbnRzLmxlbmd0aCA+IDF9XG4gICAgICA8bmF2IGNsYXNzPVwiZmxleCBmbGV4LXdyYXAgZ2FwLTJcIiBhcmlhLWxhYmVsPVwiQ2hvaXNpciB1biBsb2dlbWVudFwiPlxuICAgICAgICB7I2VhY2ggZGF0YS5sb2dlbWVudHMgYXMgY2hvaXggKGNob2l4LmlkKX1cbiAgICAgICAgICA8YVxuICAgICAgICAgICAgY2xhc3M9e2Nob2l4LmlkID09PSBsb2dlbWVudC5pZFxuICAgICAgICAgICAgICA/IFwidWktYm91dG9uIHVpLWJvdXRvbi0tcHJpbWFpcmUgdWktYm91dG9uLS1wZXRpdFwiXG4gICAgICAgICAgICAgIDogXCJ1aS1ib3V0b24gdWktYm91dG9uLS1zZWNvbmRhaXJlIHVpLWJvdXRvbi0tcGV0aXRcIn1cbiAgICAgICAgICAgIGhyZWY9e2AvaG90ZS9vbmJvYXJkaW5nP2xvZ2VtZW50PSR7Y2hvaXguaWR9YH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICB7Y2hvaXgubm9tfVxuICAgICAgICAgIDwvYT5cbiAgICAgICAgey9lYWNofVxuICAgICAgPC9uYXY+XG4gICAgey9pZn1cblxuICAgIDxzZWN0aW9uIGNsYXNzPVwidWktY2FydGUgc3BhY2UteS0zXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiPlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxoMiBjbGFzcz1cInRleHQtbGcgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgQXZhbmNlbWVudCDigJQge2xvZ2VtZW50Lm5vbX1cbiAgICAgICAgICA8L2gyPlxuICAgICAgICAgIDxwIGNsYXNzPVwibXQtMSB0ZXh0LXNtIHRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgICAgICAgIHtkYXRhLmZhaXRlc30gLyB7ZGF0YS5ldGFwZXMubGVuZ3RofSDDqXRhcGVzIMK3IHtkYXRhLnBvdXJjZW50YWdlfSAlXG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgeyNpZiBkYXRhLnByZXR9XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1iYWRnZSB1aS1iYWRnZS0tYWNjZW50XCI+UHLDqnQgw6AgcsOpc2VydmVyPC9zcGFuPlxuICAgICAgICB7OmVsc2V9XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1iYWRnZSB1aS1iYWRnZS0tYWxlcnRlXCI+Tm9uIHB1YmxpYWJsZTwvc3Bhbj5cbiAgICAgICAgey9pZn1cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdlxuICAgICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxuICAgICAgICBjbGFzcz1cImgtMiB3LWZ1bGwgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtZnVsbCBiZy1zdXJmYWNlLTJcIlxuICAgICAgPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY2xhc3M9XCJoLWZ1bGwgcm91bmRlZC1mdWxsIGJnLWFjY2VudFwiXG4gICAgICAgICAgc3R5bGU9e2B3aWR0aDogJHtkYXRhLnBvdXJjZW50YWdlfSVgfVxuICAgICAgICA+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L3NlY3Rpb24+XG5cbiAgICA8b2wgY2xhc3M9XCJzcGFjZS15LTNcIj5cbiAgICAgIHsjZWFjaCBkYXRhLmV0YXBlcyBhcyBldGFwZSAoZXRhcGUuY29kZSl9XG4gICAgICAgIDxsaSBjbGFzcz1cInVpLWNhcnRlLS1wNSByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLWJvcmR1cmUgYmctc3VyZmFjZSBzaGFkb3ctc21cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtc3RhcnQganVzdGlmeS1iZXR3ZWVuIGdhcC0zXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleCBpdGVtcy1zdGFydCBnYXAtM1wiPlxuICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgY2xhc3M9e2V0YXBlLmZhaXRcbiAgICAgICAgICAgICAgICAgID8gXCJtdC0wLjUgZmxleCBoLTYgdy02IHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkLWZ1bGwgYmctYWNjZW50IHRleHQteHMgZm9udC1ib2xkIHRleHQtZm9uZFwiXG4gICAgICAgICAgICAgICAgICA6IFwibXQtMC41IGZsZXggaC02IHctNiBzaHJpbmstMCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItYm9yZHVyZSB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWVuY3JlLWZhaW5lXCJ9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7ZXRhcGUuZmFpdCA/IFwi4pyTXCIgOiBcIlwifVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzPVwiZm9udC1zZW1pYm9sZFwiPntldGFwZS50aXRyZX08L2gzPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwibXQtMSBtYXgtdy0yeGwgdGV4dC1zbSB0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICAgICAgICAgICAgICB7ZXRhcGUuZGV0YWlsfVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgIGNsYXNzPXtldGFwZS5mYWl0XG4gICAgICAgICAgICAgICAgPyBcInVpLWJhZGdlIHVpLWJhZGdlLS1hY2NlbnRcIlxuICAgICAgICAgICAgICAgIDogXCJ1aS1iYWRnZSB1aS1iYWRnZS0tYWxlcnRlXCJ9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHtldGFwZS5mYWl0ID8gXCJGYWl0XCIgOiBcIsOAIGZhaXJlXCJ9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7I2lmIGV0YXBlLmNvZGUgPT09IFwiY29wcm9cIn1cbiAgICAgICAgICAgIDxmb3JtXG4gICAgICAgICAgICAgIG1ldGhvZD1cIlBPU1RcIlxuICAgICAgICAgICAgICBhY3Rpb249XCI/L2NvcHJvXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJtdC00IGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtNCBib3JkZXItdCBib3JkZXItYm9yZHVyZSBwdC00XCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwibG9nZW1lbnRJZFwiIHZhbHVlPXtsb2dlbWVudC5pZH0gLz5cbiAgICAgICAgICAgICAgPGxhYmVsXG4gICAgICAgICAgICAgICAgY2xhc3M9XCJmbGV4IGl0ZW1zLXN0YXJ0IGdhcC0zIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1ib3JkdXJlIHAtMyB0ZXh0LXNtXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgY2xhc3M9XCJtdC0xXCJcbiAgICAgICAgICAgICAgICAgIGRlZmF1bHRDaGVja2VkPXtsb2dlbWVudC5jb3Byb1ZlcmlmaWVlfVxuICAgICAgICAgICAgICAgICAgbmFtZT1cImNvcHJvVmVyaWZpZWVcIlxuICAgICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJmb250LW1lZGl1bVwiPlxuICAgICAgICAgICAgICAgICAgICBSw6hnbGVtZW50LCBQViBldCBhY2NvcmQgZHUgc3luZGljIHbDqXJpZmnDqXNcbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibXQtMC41IGJsb2NrIHRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgICAgICAgICAgICAgICAgRMOpY29jaGV6IHBvdXIgcmVtYXNxdWVyIGxlIGxvZ2VtZW50LlxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLXByaW1haXJlIHVpLWJvdXRvbi0tcGV0aXRcIiB0eXBlPVwic3VibWl0XCI+XG4gICAgICAgICAgICAgICAgRW5yZWdpc3RyZXJcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgey9pZn1cblxuICAgICAgICAgIHsjaWYgZXRhcGUuY29kZSA9PT0gXCJnb2xpdmVcIn1cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtdC00IGJvcmRlci10IGJvcmRlci1ib3JkdXJlIHB0LTRcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LXNtIHRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgICAgICAgICAgICDDiXRhdCBkZSBwdWJsaWNhdGlvbiA6XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgICAgICAgICB7bG9nZW1lbnQucHVibGljYXRpb24gPT09IFwicHVibGllZVwiID8gXCJwdWJsacOpXCIgOiBcImJyb3VpbGxvblwifVxuICAgICAgICAgICAgICAgIDwvc3Bhbj4uIFVuIGxvZ2VtZW50IGVuIGJyb3VpbGxvbiBu4oCZYXBwYXJhw650IGphbWFpcyBzdXIgL3Jlc2VydmVyLFxuICAgICAgICAgICAgICAgIG3Dqm1lIHbDqXJpZmnDqS5cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICA8Zm9ybVxuICAgICAgICAgICAgICAgIG1ldGhvZD1cIlBPU1RcIlxuICAgICAgICAgICAgICAgIGFjdGlvbj1cIj8vcHVibGljYXRpb25cIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwibXQtMyBmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTNcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwibG9nZW1lbnRJZFwiIHZhbHVlPXtsb2dlbWVudC5pZH0gLz5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJoaWRkZW5cIlxuICAgICAgICAgICAgICAgICAgbmFtZT1cInB1YmxpY2F0aW9uXCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtsb2dlbWVudC5wdWJsaWNhdGlvbiA9PT0gXCJwdWJsaWVlXCJcbiAgICAgICAgICAgICAgICAgICAgPyBcImJyb3VpbGxvblwiXG4gICAgICAgICAgICAgICAgICAgIDogXCJwdWJsaWVlXCJ9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLWVuY3JlIHVpLWJvdXRvbi0tcGV0aXRcIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2xvZ2VtZW50LnB1YmxpY2F0aW9uICE9PSBcInB1YmxpZWVcIiAmJiAhZGF0YS5wZXV0UHVibGllcn1cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtsb2dlbWVudC5wdWJsaWNhdGlvbiA9PT0gXCJwdWJsaWVlXCJcbiAgICAgICAgICAgICAgICAgICAgPyBcIkTDqXB1YmxpZXIgbGUgbG9nZW1lbnRcIlxuICAgICAgICAgICAgICAgICAgICA6IFwiUHVibGllciBsZSBsb2dlbWVudFwifVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICAgIHsjaWYgbG9nZW1lbnQucHVibGljYXRpb24gIT09IFwicHVibGllZVwiICYmICFkYXRhLnBldXRQdWJsaWVyfVxuICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwibXQtMiB0ZXh0LXNtIHRleHQtYWxlcnRlXCI+XG4gICAgICAgICAgICAgICAgICBWw6lyaWZpZXogbGEgY29wcm9wcmnDqXTDqSBhdmFudCBkZSBwdWJsaWVyLlxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgey9pZn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIHsvaWZ9XG5cbiAgICAgICAgICB7I2lmIGV0YXBlLmxpZW59XG4gICAgICAgICAgICA8YSBjbGFzcz1cIm10LTMgaW5saW5lLWJsb2NrIHRleHQtc20gdW5kZXJsaW5lXCIgaHJlZj17ZXRhcGUubGllbi5ocmVmfT5cbiAgICAgICAgICAgICAge2V0YXBlLmxpZW4ubGFiZWx9XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgey9pZn1cbiAgICAgICAgPC9saT5cbiAgICAgIHsvZWFjaH1cbiAgICA8L29sPlxuXG4gICAgPHAgY2xhc3M9XCJ0ZXh0LXNtIHRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgIHtkYXRhLnByZXRcbiAgICAgICAgPyBgTGUgbG9nZW1lbnQgZXN0IHZpc2libGUgc3VyIC9yZXNlcnZlcj90ZW5hbnQ9JHtkYXRhLnRlbmFudFNsdWd9LmBcbiAgICAgICAgOiBcIlRhbnQgcXVlIGxlcyDDqXRhcGVzIDEgw6AgNSBuZSBzb250IHBhcyBjb21wbMOodGVzLCBsZSBsb2dlbWVudCBu4oCZYXBwYXJhw650IHBhcyBzdXIgbGEgcGFnZSBkZSByw6lzZXJ2YXRpb24gcHVibGlxdWUuXCJ9XG4gICAgPC9wPlxuICB7L2lmfVxuXG4gIDxmb290ZXIgY2xhc3M9XCJmbGV4IGZsZXgtd3JhcCBnYXAtNCBib3JkZXItdCBib3JkZXItYm9yZHVyZSBwdC00IHRleHQtc21cIj5cbiAgICA8YSBjbGFzcz1cInVuZGVybGluZVwiIGhyZWY9XCIvaG90ZS9hbm5vbmNlXCI+Q29uZm9ybWl0w6kgZGUgbOKAmWFubm9uY2U8L2E+XG4gICAgPGEgY2xhc3M9XCJ1bmRlcmxpbmVcIiBocmVmPVwiL2hvdGUvbG9nZW1lbnRzXCI+TG9nZW1lbnRzPC9hPlxuICAgIDxhIGNsYXNzPVwidW5kZXJsaW5lXCIgaHJlZj1cIi9ob3RlXCI+VGFibGVhdSBkZSBib3JkPC9hPlxuICA8L2Zvb3Rlcj5cbjwvbWFpbj5cbiJdLCJmaWxlIjoiQzovVXNlcnMvanVsaWUvRGVza3RvcC9Mb2NhdGlvbiBjb3VydGUgZHVyZWUvdjIvc3JjL3JvdXRlcy9ob3RlL29uYm9hcmRpbmcvK3BhZ2Uuc3ZlbHRlIn0=