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

							$.remove_input_defaults(input_1);
							$.next(2);
							$.reset(label);
							$.next(2);
							$.reset(form);

							$.template_effect(() => {
								$.set_value(input, $.get(logement).id);
								$.set_checked(input_1, $.get(logement).coproVerifiee);
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
//# sourceMappingURL=data:application/json;base64,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RTt5QkFHSyxXQUFLLEVBQUMsS0FBSzt5QkFFbkMsV0FBSyxFQUFDLE1BQU07O2tCQUlsQixrQkFDUSxXQUFLLEVBQUM7U0FDVCwyQkFBMEI7U0FDMUIsMkJBQTJCOzt5QkFFOUIsV0FBSyxFQUFDLElBQUksR0FBRyxNQUFNLEdBQUcsU0FBUzs7O3dCQXZCckMsRUFBRTs7Ozs7Ozs7V0FGTixFQUFFOztPQTZHRixHQUFFLEFBQUQsYUE3R0QsRUFBRTs4QkE2R0YsR0FBRSxBQUFEOzs7dUNBcElvQixjQUFRLEVBQUMsR0FBRzswQkFHekIsYUFBSyxNQUFNLFlBQUssYUFBSyxNQUFNLENBQUMsTUFBTSxtQkFBWSxhQUFLLFdBQVc7Z0JBYWxFLE9BRVEsVUFBVSxhQUFLLFdBQVcsR0FBRzs7d0JBbUh2QyxhQUFLO09BQ0YsZ0RBQWdELGFBQUssVUFBVSxHQUFFO09BQ2pFLGtIQUFrSDs7Ozs7Ozs7UUF0S3JILENBQUMsYUFBSyxRQUFROzs7Ozs7Ozs7O1NBdkNwQixJQUFJO29CQUFKLElBQUk7OztBQU5HIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyIrcGFnZS5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdCBsYW5nPVwidHNcIj5cbiAgaW1wb3J0IHR5cGUgeyBQYWdlRGF0YSB9IGZyb20gXCIuLyR0eXBlc1wiO1xuXG4gIGxldCB7IGRhdGEgfTogeyBkYXRhOiBQYWdlRGF0YSB9ID0gJHByb3BzKCk7XG48L3NjcmlwdD5cblxuPHN2ZWx0ZTpoZWFkPlxuICA8dGl0bGU+T25ib2FyZGluZyDigJQgRXNwYWNlIGjDtHRlPC90aXRsZT5cbjwvc3ZlbHRlOmhlYWQ+XG5cbjxtYWluIGNsYXNzPVwibXgtYXV0byBtYXgtdy00eGwgc3BhY2UteS04IHB4LTYgcHktMTJcIj5cbiAgPGhlYWRlciBjbGFzcz1cImZsZXggZmxleC13cmFwIGl0ZW1zLWVuZCBqdXN0aWZ5LWJldHdlZW4gZ2FwLTRcIj5cbiAgICA8ZGl2IGNsYXNzPVwic3BhY2UteS0yXCI+XG4gICAgICA8cCBjbGFzcz1cInRleHQtc20gZm9udC1tZWRpdW0gdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCB0ZXh0LWVuY3JlLWZhaW5lXCI+XG4gICAgICAgIE5vdXZlYXUgbG9nZW1lbnQgwrcgY29uZm9ybWl0w6lcbiAgICAgIDwvcD5cbiAgICAgIDxoMSBjbGFzcz1cInRleHQtM3hsIGZvbnQtc2VtaWJvbGQgdHJhY2tpbmctdGlnaHRcIj5PbmJvYXJkaW5nPC9oMT5cbiAgICAgIDxwIGNsYXNzPVwibWF4LXctMnhsIHRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgICAgTGVzIGNvbmRpdGlvbnMgcsOpZWxsZXMgYXZhbnQgcXXigJl1biBsb2dlbWVudCBwdWlzc2Ugw6p0cmUgcHJvcG9zw6kgYXV4XG4gICAgICAgIHZveWFnZXVycy4gQXVjdW5lIGNhc2UgbuKAmWVzdCBkw6ljb3JhdGl2ZSA6IGNoYXF1ZSDDqXRhcGUgZXN0IHbDqXJpZmnDqWUgc3VyXG4gICAgICAgIGxlcyBkb25uw6llcyBlbnJlZ2lzdHLDqWVzLlxuICAgICAgPC9wPlxuICAgIDwvZGl2PlxuICAgIDxhIGNsYXNzPVwidGV4dC1zbSB1bmRlcmxpbmVcIiBocmVmPVwiL2hvdGVcIj5SZXRvdXIgYXUgdGFibGVhdSBkZSBib3JkPC9hPlxuICA8L2hlYWRlcj5cblxuICB7I2lmIGRhdGEuY29wcm99XG4gICAgPHAgY2xhc3M9XCJ1aS1hbGVydGUgdWktYWxlcnRlLS1va1wiIHJvbGU9XCJzdGF0dXNcIj5cbiAgICAgIFbDqXJpZmljYXRpb24gY29wcm9wcmnDqXTDqSBlbnJlZ2lzdHLDqWUuXG4gICAgPC9wPlxuICB7L2lmfVxuICB7I2lmIGRhdGEucHVibGljYXRpb259XG4gICAgPHAgY2xhc3M9XCJ1aS1hbGVydGUgdWktYWxlcnRlLS1va1wiIHJvbGU9XCJzdGF0dXNcIj5cbiAgICAgIFB1YmxpY2F0aW9uIG1pc2Ugw6Agam91ci5cbiAgICA8L3A+XG4gIHsvaWZ9XG4gIHsjaWYgZGF0YS5lcnJldXIgPT09IFwicHVibGljYXRpb25cIn1cbiAgICA8cCBjbGFzcz1cInVpLWFsZXJ0ZSB1aS1hbGVydGUtLWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPlxuICAgICAgUHVibGljYXRpb24gcmVmdXPDqWUgOiB2w6lyaWZpZXogZOKAmWFib3JkIGxhIGNvcHJvcHJpw6l0w6kgZXQgbGUgc3RhdHV0IGFjdGlmIGR1XG4gICAgICBsb2dlbWVudC5cbiAgICA8L3A+XG4gIHs6ZWxzZSBpZiBkYXRhLmVycmV1cn1cbiAgICA8cCBjbGFzcz1cInVpLWFsZXJ0ZSB1aS1hbGVydGUtLWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPlxuICAgICAge2RhdGEuZXJyZXVyID09PSBcImluYXR0ZW5kdVwiXG4gICAgICAgID8gXCJFcnJldXIgaW5hdHRlbmR1ZS4gUsOpZXNzYXllei5cIlxuICAgICAgICA6IGRhdGEuZXJyZXVyfVxuICAgIDwvcD5cbiAgey9pZn1cblxuICB7I2lmICFkYXRhLmxvZ2VtZW50fVxuICAgIDxzZWN0aW9uIGNsYXNzPVwidWktY2FydGUgc3BhY2UteS0zIHRleHQtY2VudGVyXCI+XG4gICAgICA8aDIgY2xhc3M9XCJ0ZXh0LWxnIGZvbnQtc2VtaWJvbGRcIj5BdWN1biBsb2dlbWVudDwvaDI+XG4gICAgICA8cCBjbGFzcz1cInRleHQtc20gdGV4dC1lbmNyZS1kb3VjZVwiPlxuICAgICAgICBDcsOpZXogdW4gcHJlbWllciBsb2dlbWVudCBwb3VyIGTDqW1hcnJlciBs4oCZb25ib2FyZGluZy5cbiAgICAgIDwvcD5cbiAgICAgIDxhIGNsYXNzPVwidWktYm91dG9uIHVpLWJvdXRvbi0tZW5jcmVcIiBocmVmPVwiL2hvdGUvbG9nZW1lbnRzXCI+XG4gICAgICAgIENyw6llciB1biBsb2dlbWVudFxuICAgICAgPC9hPlxuICAgIDwvc2VjdGlvbj5cbiAgezplbHNlfVxuICAgIHtAY29uc3QgbG9nZW1lbnQgPSBkYXRhLmxvZ2VtZW50fVxuICAgIHsjaWYgZGF0YS5sb2dlbWVudHMubGVuZ3RoID4gMX1cbiAgICAgIDxuYXYgY2xhc3M9XCJmbGV4IGZsZXgtd3JhcCBnYXAtMlwiIGFyaWEtbGFiZWw9XCJDaG9pc2lyIHVuIGxvZ2VtZW50XCI+XG4gICAgICAgIHsjZWFjaCBkYXRhLmxvZ2VtZW50cyBhcyBjaG9peCAoY2hvaXguaWQpfVxuICAgICAgICAgIDxhXG4gICAgICAgICAgICBjbGFzcz17Y2hvaXguaWQgPT09IGxvZ2VtZW50LmlkXG4gICAgICAgICAgICAgID8gXCJ1aS1ib3V0b24gdWktYm91dG9uLS1wcmltYWlyZSB1aS1ib3V0b24tLXBldGl0XCJcbiAgICAgICAgICAgICAgOiBcInVpLWJvdXRvbiB1aS1ib3V0b24tLXNlY29uZGFpcmUgdWktYm91dG9uLS1wZXRpdFwifVxuICAgICAgICAgICAgaHJlZj17YC9ob3RlL29uYm9hcmRpbmc/bG9nZW1lbnQ9JHtjaG9peC5pZH1gfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHtjaG9peC5ub219XG4gICAgICAgICAgPC9hPlxuICAgICAgICB7L2VhY2h9XG4gICAgICA8L25hdj5cbiAgICB7L2lmfVxuXG4gICAgPHNlY3Rpb24gY2xhc3M9XCJ1aS1jYXJ0ZSBzcGFjZS15LTNcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zXCI+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGgyIGNsYXNzPVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgICBBdmFuY2VtZW50IOKAlCB7bG9nZW1lbnQubm9tfVxuICAgICAgICAgIDwvaDI+XG4gICAgICAgICAgPHAgY2xhc3M9XCJtdC0xIHRleHQtc20gdGV4dC1lbmNyZS1kb3VjZVwiPlxuICAgICAgICAgICAge2RhdGEuZmFpdGVzfSAvIHtkYXRhLmV0YXBlcy5sZW5ndGh9IMOpdGFwZXMgwrcge2RhdGEucG91cmNlbnRhZ2V9ICVcbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7I2lmIGRhdGEucHJldH1cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInVpLWJhZGdlIHVpLWJhZGdlLS1hY2NlbnRcIj5QcsOqdCDDoCByw6lzZXJ2ZXI8L3NwYW4+XG4gICAgICAgIHs6ZWxzZX1cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInVpLWJhZGdlIHVpLWJhZGdlLS1hbGVydGVcIj5Ob24gcHVibGlhYmxlPC9zcGFuPlxuICAgICAgICB7L2lmfVxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2XG4gICAgICAgIGFyaWEtaGlkZGVuPVwidHJ1ZVwiXG4gICAgICAgIGNsYXNzPVwiaC0yIHctZnVsbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC1mdWxsIGJnLXN1cmZhY2UtMlwiXG4gICAgICA+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICBjbGFzcz1cImgtZnVsbCByb3VuZGVkLWZ1bGwgYmctYWNjZW50XCJcbiAgICAgICAgICBzdHlsZT17YHdpZHRoOiAke2RhdGEucG91cmNlbnRhZ2V9JWB9XG4gICAgICAgID48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvc2VjdGlvbj5cblxuICAgIDxvbCBjbGFzcz1cInNwYWNlLXktM1wiPlxuICAgICAgeyNlYWNoIGRhdGEuZXRhcGVzIGFzIGV0YXBlIChldGFwZS5jb2RlKX1cbiAgICAgICAgPGxpIGNsYXNzPVwidWktY2FydGUtLXA1IHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItYm9yZHVyZSBiZy1zdXJmYWNlIHNoYWRvdy1zbVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1zdGFydCBqdXN0aWZ5LWJldHdlZW4gZ2FwLTNcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4IGl0ZW1zLXN0YXJ0IGdhcC0zXCI+XG4gICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgICAgICAgICAgICBjbGFzcz17ZXRhcGUuZmFpdFxuICAgICAgICAgICAgICAgICAgPyBcIm10LTAuNSBmbGV4IGgtNiB3LTYgc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJvdW5kZWQtZnVsbCBiZy1hY2NlbnQgdGV4dC14cyBmb250LWJvbGQgdGV4dC1mb25kXCJcbiAgICAgICAgICAgICAgICAgIDogXCJtdC0wLjUgZmxleCBoLTYgdy02IHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci1ib3JkdXJlIHRleHQteHMgZm9udC1ib2xkIHRleHQtZW5jcmUtZmFpbmVcIn1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtldGFwZS5mYWl0ID8gXCLinJNcIiA6IFwiXCJ9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDMgY2xhc3M9XCJmb250LXNlbWlib2xkXCI+e2V0YXBlLnRpdHJlfTwvaDM+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3M9XCJtdC0xIG1heC13LTJ4bCB0ZXh0LXNtIHRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgICAgICAgICAgICAgIHtldGFwZS5kZXRhaWx9XG4gICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgY2xhc3M9e2V0YXBlLmZhaXRcbiAgICAgICAgICAgICAgICA/IFwidWktYmFkZ2UgdWktYmFkZ2UtLWFjY2VudFwiXG4gICAgICAgICAgICAgICAgOiBcInVpLWJhZGdlIHVpLWJhZGdlLS1hbGVydGVcIn1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge2V0YXBlLmZhaXQgPyBcIkZhaXRcIiA6IFwiw4AgZmFpcmVcIn1cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsjaWYgZXRhcGUuY29kZSA9PT0gXCJjb3Byb1wifVxuICAgICAgICAgICAgPGZvcm1cbiAgICAgICAgICAgICAgbWV0aG9kPVwiUE9TVFwiXG4gICAgICAgICAgICAgIGFjdGlvbj1cIj8vY29wcm9cIlxuICAgICAgICAgICAgICBjbGFzcz1cIm10LTQgZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC00IGJvcmRlci10IGJvcmRlci1ib3JkdXJlIHB0LTRcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJsb2dlbWVudElkXCIgdmFsdWU9e2xvZ2VtZW50LmlkfSAvPlxuICAgICAgICAgICAgICA8bGFiZWxcbiAgICAgICAgICAgICAgICBjbGFzcz1cImZsZXggaXRlbXMtc3RhcnQgZ2FwLTMgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWJvcmR1cmUgcC0zIHRleHQtc21cIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICBjbGFzcz1cIm10LTFcIlxuICAgICAgICAgICAgICAgICAgY2hlY2tlZD17bG9nZW1lbnQuY29wcm9WZXJpZmllZX1cbiAgICAgICAgICAgICAgICAgIG5hbWU9XCJjb3Byb1ZlcmlmaWVlXCJcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZm9udC1tZWRpdW1cIj5cbiAgICAgICAgICAgICAgICAgICAgUsOoZ2xlbWVudCwgUFYgZXQgYWNjb3JkIGR1IHN5bmRpYyB2w6lyaWZpw6lzXG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm10LTAuNSBibG9jayB0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICAgICAgICAgICAgICAgIETDqWNvY2hleiBwb3VyIHJlbWFzcXVlciBsZSBsb2dlbWVudC5cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJ1aS1ib3V0b24gdWktYm91dG9uLS1wcmltYWlyZSB1aS1ib3V0b24tLXBldGl0XCIgdHlwZT1cInN1Ym1pdFwiPlxuICAgICAgICAgICAgICAgIEVucmVnaXN0cmVyXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgIHsvaWZ9XG5cbiAgICAgICAgICB7I2lmIGV0YXBlLmNvZGUgPT09IFwiZ29saXZlXCJ9XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibXQtNCBib3JkZXItdCBib3JkZXItYm9yZHVyZSBwdC00XCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC1zbSB0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICAgICAgICAgICAgw4l0YXQgZGUgcHVibGljYXRpb24gOlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgICAge2xvZ2VtZW50LnB1YmxpY2F0aW9uID09PSBcInB1YmxpZWVcIiA/IFwicHVibGnDqVwiIDogXCJicm91aWxsb25cIn1cbiAgICAgICAgICAgICAgICA8L3NwYW4+LiBVbiBsb2dlbWVudCBlbiBicm91aWxsb24gbuKAmWFwcGFyYcOudCBqYW1haXMgc3VyIC9yZXNlcnZlcixcbiAgICAgICAgICAgICAgICBtw6ptZSB2w6lyaWZpw6kuXG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgPGZvcm1cbiAgICAgICAgICAgICAgICBtZXRob2Q9XCJQT1NUXCJcbiAgICAgICAgICAgICAgICBhY3Rpb249XCI/L3B1YmxpY2F0aW9uXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cIm10LTMgZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0zXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cImxvZ2VtZW50SWRcIiB2YWx1ZT17bG9nZW1lbnQuaWR9IC8+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwiaGlkZGVuXCJcbiAgICAgICAgICAgICAgICAgIG5hbWU9XCJwdWJsaWNhdGlvblwiXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17bG9nZW1lbnQucHVibGljYXRpb24gPT09IFwicHVibGllZVwiXG4gICAgICAgICAgICAgICAgICAgID8gXCJicm91aWxsb25cIlxuICAgICAgICAgICAgICAgICAgICA6IFwicHVibGllZVwifVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ1aS1ib3V0b24gdWktYm91dG9uLS1lbmNyZSB1aS1ib3V0b24tLXBldGl0XCJcbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtsb2dlbWVudC5wdWJsaWNhdGlvbiAhPT0gXCJwdWJsaWVlXCIgJiYgIWRhdGEucGV1dFB1YmxpZXJ9XG4gICAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7bG9nZW1lbnQucHVibGljYXRpb24gPT09IFwicHVibGllZVwiXG4gICAgICAgICAgICAgICAgICAgID8gXCJEw6lwdWJsaWVyIGxlIGxvZ2VtZW50XCJcbiAgICAgICAgICAgICAgICAgICAgOiBcIlB1YmxpZXIgbGUgbG9nZW1lbnRcIn1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgICAgICB7I2lmIGxvZ2VtZW50LnB1YmxpY2F0aW9uICE9PSBcInB1YmxpZWVcIiAmJiAhZGF0YS5wZXV0UHVibGllcn1cbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cIm10LTIgdGV4dC1zbSB0ZXh0LWFsZXJ0ZVwiPlxuICAgICAgICAgICAgICAgICAgVsOpcmlmaWV6IGxhIGNvcHJvcHJpw6l0w6kgYXZhbnQgZGUgcHVibGllci5cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgIHsvaWZ9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICB7L2lmfVxuXG4gICAgICAgICAgeyNpZiBldGFwZS5saWVufVxuICAgICAgICAgICAgPGEgY2xhc3M9XCJtdC0zIGlubGluZS1ibG9jayB0ZXh0LXNtIHVuZGVybGluZVwiIGhyZWY9e2V0YXBlLmxpZW4uaHJlZn0+XG4gICAgICAgICAgICAgIHtldGFwZS5saWVuLmxhYmVsfVxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIHsvaWZ9XG4gICAgICAgIDwvbGk+XG4gICAgICB7L2VhY2h9XG4gICAgPC9vbD5cblxuICAgIDxwIGNsYXNzPVwidGV4dC1zbSB0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICB7ZGF0YS5wcmV0XG4gICAgICAgID8gYExlIGxvZ2VtZW50IGVzdCB2aXNpYmxlIHN1ciAvcmVzZXJ2ZXI/dGVuYW50PSR7ZGF0YS50ZW5hbnRTbHVnfS5gXG4gICAgICAgIDogXCJUYW50IHF1ZSBsZXMgw6l0YXBlcyAxIMOgIDUgbmUgc29udCBwYXMgY29tcGzDqHRlcywgbGUgbG9nZW1lbnQgbuKAmWFwcGFyYcOudCBwYXMgc3VyIGxhIHBhZ2UgZGUgcsOpc2VydmF0aW9uIHB1YmxpcXVlLlwifVxuICAgIDwvcD5cbiAgey9pZn1cblxuICA8Zm9vdGVyIGNsYXNzPVwiZmxleCBmbGV4LXdyYXAgZ2FwLTQgYm9yZGVyLXQgYm9yZGVyLWJvcmR1cmUgcHQtNCB0ZXh0LXNtXCI+XG4gICAgPGEgY2xhc3M9XCJ1bmRlcmxpbmVcIiBocmVmPVwiL2hvdGUvYW5ub25jZVwiPkNvbmZvcm1pdMOpIGRlIGzigJlhbm5vbmNlPC9hPlxuICAgIDxhIGNsYXNzPVwidW5kZXJsaW5lXCIgaHJlZj1cIi9ob3RlL2xvZ2VtZW50c1wiPkxvZ2VtZW50czwvYT5cbiAgICA8YSBjbGFzcz1cInVuZGVybGluZVwiIGhyZWY9XCIvaG90ZVwiPlRhYmxlYXUgZGUgYm9yZDwvYT5cbiAgPC9mb290ZXI+XG48L21haW4+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2p1bGllL0Rlc2t0b3AvTG9jYXRpb24gY291cnRlIGR1cmVlL3YyL3NyYy9yb3V0ZXMvaG90ZS9vbmJvYXJkaW5nLytwYWdlLnN2ZWx0ZSJ9