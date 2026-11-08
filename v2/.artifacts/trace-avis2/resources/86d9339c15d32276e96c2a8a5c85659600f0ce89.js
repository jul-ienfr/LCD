import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/routes/hote/planning/+page.svelte");import "/node_modules/.vite/deps/svelte_internal_disclose-version.js?v=70f5904f";

_page[$.FILENAME] = 'src/routes/hote/planning/+page.svelte';

import * as $ from "/node_modules/.vite/deps/svelte_internal_client.js?v=70f5904f";

var root = $.add_locations($.from_html(`<p class="text-encre-douce"> </p>`), _page[$.FILENAME], [[22, 6]]);
var root_1 = $.add_locations($.from_html(`<section class="ui-carte space-y-3"><p class="text-encre-douce">Créez d’abord un logement pour planifier des séjours.</p> <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">Gérer les logements</a></section>`), _page[$.FILENAME], [[31, 4, [[32, 6], [35, 6]]]]);
var root_2 = $.add_locations($.from_html(`<option> </option>`), _page[$.FILENAME], [[69, 14]]);
var root_3 = $.add_locations($.from_html(`<option> </option>`), _page[$.FILENAME], [[95, 16]]);
var root_4 = $.add_locations($.from_html(`<p role="status"> </p>`), _page[$.FILENAME], [[128, 10]]);
var root_5 = $.add_locations($.from_html(`<th class="p-2 text-left font-medium"> </th>`), _page[$.FILENAME], [[147, 14]]);
var root_6 = $.add_locations($.from_html(`<li class="rounded bg-alerte-douce px-2 py-1 text-xs text-alerte">Bloqué</li>`), _page[$.FILENAME], [[163, 26]]);
var root_7 = $.add_locations($.from_html(`<li class="truncate rounded bg-surface2 px-2 py-1 text-xs"> </li>`), _page[$.FILENAME], [[168, 26]]);
var root_8 = $.add_locations($.from_html(`<li class="text-xs text-encre-faine"> </li>`), _page[$.FILENAME], [[173, 26]]);
var root_9 = $.add_locations($.from_html(`<div class="min-h-20 rounded-lg border border-bordure p-2"><span class="block text-xs text-encre-faine"> </span> <ul class="mt-1 space-y-1"><!> <!> <!></ul></div>`), _page[$.FILENAME], [[159, 20, [[160, 22], [161, 22]]]]);
var root_10 = $.add_locations($.from_html(`<td class="p-2 align-top"><!></td>`), _page[$.FILENAME], [[155, 16]]);
var root_11 = $.add_locations($.from_html(`<tr class="border-b border-bordure last:border-0"></tr>`), _page[$.FILENAME], [[153, 12]]);
var root_12 = $.add_locations($.from_html(`<p class="ui-carte border-dashed text-encre-douce">Aucune réservation sur ce mois pour ce logement.</p>`), _page[$.FILENAME], [[189, 8]]);

var root_13 = $.add_locations($.from_html(`<li class="space-y-1 p-4"><div class="flex flex-wrap items-center justify-between gap-2"><p class="font-medium"> </p> <span class="ui-badge"> </span></div> <p class="text-sm text-encre-douce"> </p> <div class="flex flex-wrap gap-3 text-sm"><a class="ui-lien" target="_blank" rel="noreferrer">Lien voyageur</a> <a class="ui-lien" target="_blank" rel="noreferrer">Contrat</a></div></li>`), _page[$.FILENAME], [
	[
		195,
		12,
		[
			[196, 14, [[197, 16], [201, 16]]],
			[203, 14],
			[208, 14, [[209, 16], [212, 16]]]
		]
	]
]);

var root_14 = $.add_locations($.from_html(`<ul class="divide-y divide-bordure overflow-hidden rounded-carte border border-bordure bg-surface"></ul>`), _page[$.FILENAME], [[193, 8]]);
var root_15 = $.add_locations($.from_html(`<p class="ui-carte border-dashed text-encre-douce">Aucun blocage sur ce mois pour ce logement.</p>`), _page[$.FILENAME], [[225, 8]]);
var root_16 = $.add_locations($.from_html(`<li class="flex flex-wrap items-center justify-between gap-2 p-4"><div><p class="font-medium"> </p> <p class="text-sm text-encre-douce"> </p></div> <span class="ui-badge ui-badge--alerte">bloqué</span></li>`), _page[$.FILENAME], [[231, 12, [[232, 14, [[233, 16], [234, 16]]], [236, 14]]]]);
var root_17 = $.add_locations($.from_html(`<ul class="divide-y divide-bordure overflow-hidden rounded-carte border border-bordure bg-surface"></ul>`), _page[$.FILENAME], [[229, 8]]);

var root_18 = $.add_locations($.from_html(`<div class="flex flex-wrap items-center gap-2"><a class="ui-bouton ui-bouton--secondaire ui-bouton--petit">← Mois précédent</a> <a class="ui-bouton ui-bouton--fantome ui-bouton--petit">Mois courant</a> <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit">Mois suivant →</a> <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href="/hote/planning/import">Importer un ICS</a> <form class="ml-auto flex flex-wrap items-end gap-2" method="GET" action="/hote/planning"><input type="hidden" name="mois"/> <label class="space-y-1"><span class="ui-label">Logement</span> <select class="ui-champ py-2" name="logement"></select></label> <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">Afficher</button></form></div> <section class="ui-carte space-y-4"><div class="space-y-1"><h2 class="text-lg font-semibold">Créer une réservation</h2> <p class="text-sm text-encre-douce">Le chevauchement avec une réservation existante est refusé.</p></div> <form method="POST" action="?/creer" class="space-y-4"><div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label class="space-y-2"><span class="ui-label">Logement</span> <select class="ui-champ" name="logementId" required=""></select></label> <label class="space-y-2"><span class="ui-label">Référence</span> <input class="ui-champ" name="ref" placeholder="resa-2026-001" required=""/></label> <label class="space-y-2"><span class="ui-label">Client (facultatif)</span> <input class="ui-champ" name="clientNom" placeholder="Nom du voyageur"/></label> <label class="space-y-2"><span class="ui-label">Voyageurs</span> <input class="ui-champ" name="voyageurs" type="number" min="1" max="20" value="2"/></label> <label class="space-y-2"><span class="ui-label">Début</span> <input class="ui-champ" name="debut" type="date" required=""/></label> <label class="space-y-2"><span class="ui-label">Fin (exclusive)</span> <input class="ui-champ" name="fin" type="date" required=""/></label> <label class="space-y-2"><span class="ui-label">Montant (€)</span> <input class="ui-champ" name="montantEuros" inputmode="decimal" value="0"/></label></div> <!> <button class="ui-bouton ui-bouton--primaire" type="submit">Créer la réservation</button></form></section> <section class="overflow-x-auto rounded-carte border border-bordure bg-surface"><table class="w-full min-w-[760px] border-collapse text-sm"><thead><tr class="border-b border-bordure bg-fond"></tr></thead><tbody></tbody></table></section> <section class="space-y-3"><h2 class="text-lg font-semibold">Réservations du mois</h2> <!></section> <section class="space-y-3"><h2 class="text-lg font-semibold">Blocages OTA du mois</h2> <!></section>`, 1), _page[$.FILENAME], [
	[
		40,
		4,
		[
			[41, 6],
			[47, 6],
			[53, 6],
			[59, 6],
			[63, 6, [[64, 8], [65, 8, [[66, 10], [67, 10]]], [75, 8]]]
		]
	],

	[
		81,
		4,
		[
			[82, 6, [[83, 8], [84, 8]]],
			[
				89,
				6,
				[
					[
						90,
						8,
						[
							[91, 10, [[92, 12], [93, 12]]],
							[101, 10, [[102, 12], [103, 12]]],
							[105, 10, [[106, 12], [107, 12]]],
							[109, 10, [[110, 12], [111, 12]]],
							[113, 10, [[114, 12], [115, 12]]],
							[117, 10, [[118, 12], [119, 12]]],
							[121, 10, [[122, 12], [123, 12]]]
						]
					],
					[136, 8]
				]
			]
		]
	],
	[142, 4, [[143, 6, [[144, 8, [[145, 10]]], [151, 8]]]]],
	[186, 4, [[187, 6]]],
	[222, 4, [[223, 6]]]
]);

var root_19 = $.add_locations($.from_html(`<main class="mx-auto max-w-6xl space-y-8 px-6 py-10"><header class="ui-entete space-y-2"><p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Espace hôte</p> <h1 class="text-3xl font-semibold tracking-tight"> </h1> <!></header> <!></main>`), _page[$.FILENAME], [[13, 0, [[14, 2, [[15, 4], [18, 4]]]]]]);

function _page($$anchor, $$props) {
	$.check_target(new.target);
	$.push($$props, true, _page);

	const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
	var $$exports = { ...$.legacy_api() };
	var main = root_19();

	$.head('asrvm5', ($$anchor) => {
		$.effect(() => {
			$.document.title = 'Planning — LCD Parc';
		});
	});

	var header = $.child(main);
	var h1 = $.sibling($.child(header), 2);
	var text = $.only_child(h1);
	var node = $.sibling(h1, 2);

	{
		var consequent = ($$anchor) => {
			var p = root();
			var text_1 = $.only_child(p);

			$.template_effect(() => $.set_text(text_1, `${$$props.data.logement.nom ?? ''} (${$$props.data.logement.code ?? ''}) · ${$$props.data.reservations.length ?? ''}
        réservation${$$props.data.reservations.length > 1 ? "s" : ""} · ${$$props.data.blocages.length ?? ''}
        blocage${$$props.data.blocages.length > 1 ? "s" : ""}`));

			$.append($$anchor, p);
		};

		$.add_svelte_meta(
			() => $.if(node, ($$render) => {
				if ($$props.data.logement) $$render(consequent);
			}),
			'if',
			_page,
			21,
			4
		);
	}

	$.reset(header);

	var node_1 = $.sibling(header, 2);

	{
		var consequent_1 = ($$anchor) => {
			var section = root_1();

			$.append($$anchor, section);
		};

		var consequent_8 = ($$anchor) => {
			var fragment = root_18();
			var div = $.first_child(fragment);
			var a = $.child(div);
			var a_1 = $.sibling(a, 2);
			var a_2 = $.sibling(a_1, 2);
			var form_1 = $.sibling(a_2, 4);
			var input = $.child(form_1);

			$.remove_input_defaults(input);

			var label = $.sibling(input, 2);
			var select = $.sibling($.child(label), 2);

			$.add_svelte_meta(
				() => $.each(select, 21, () => $$props.data.logements, (logement) => logement.id, ($$anchor, logement) => {
					var option = root_2();
					var text_2 = $.only_child(option, true);
					var option_value = {};

					$.template_effect(() => {
						$.set_selected(option, $.strict_equals($.get(logement).id, $$props.data.logement.id));
						$.set_text(text_2, $.get(logement).nom);

						if (option_value !== (option_value = $.get(logement).id)) {
							option.value = (option.__value = option_value) ?? '';
						}
					});

					$.append($$anchor, option);
				}),
				'each',
				_page,
				68,
				12
			);

			$.reset(select);
			$.reset(label);
			$.next(2);
			$.reset(form_1);
			$.reset(div);

			var section_1 = $.sibling(div, 2);
			var form_2 = $.sibling($.child(section_1), 2);
			var div_1 = $.child(form_2);
			var label_1 = $.child(div_1);
			var select_1 = $.sibling($.child(label_1), 2);

			$.add_svelte_meta(
				() => $.each(select_1, 21, () => $$props.data.logements, (logement) => logement.id, ($$anchor, logement) => {
					var option_1 = root_3();
					var text_3 = $.only_child(option_1);
					var option_1_value = {};

					$.template_effect(() => {
						$.set_selected(option_1, $.strict_equals($.get(logement).id, $$props.data.logement.id));
						$.set_text(text_3, `${$.get(logement).nom ?? ''} (${$.get(logement).code ?? ''})`);

						if (option_1_value !== (option_1_value = $.get(logement).id)) {
							option_1.value = (option_1.__value = option_1_value) ?? '';
						}
					});

					$.append($$anchor, option_1);
				}),
				'each',
				_page,
				94,
				14
			);

			$.reset(select_1);
			$.reset(label_1);

			var label_2 = $.sibling(label_1, 8);
			var input_2 = $.sibling($.child(label_2), 2);

			$.reset(label_2);

			var label_3 = $.sibling(label_2, 2);
			var input_3 = $.sibling($.child(label_3), 2);

			$.reset(label_3);
			$.next(2);
			$.reset(div_1);

			var node_2 = $.sibling(div_1, 2);

			{
				var consequent_2 = ($$anchor) => {
					var p_1 = root_4();
					var text_4 = $.only_child(p_1, true);

					$.template_effect(() => {
						$.set_class(p_1, 1, $.clsx($$props.form.ok
							? "ui-alerte ui-alerte--ok"
							: "ui-alerte ui-alerte--danger"));

						$.set_text(text_4, $$props.form.message);
					});

					$.append($$anchor, p_1);
				};

				$.add_svelte_meta(
					() => $.if(node_2, ($$render) => {
						if ($$props.form?.message) $$render(consequent_2);
					}),
					'if',
					_page,
					127,
					8
				);
			}

			$.next(2);
			$.reset(form_2);
			$.reset(section_1);

			var section_2 = $.sibling(section_1, 2);
			var table = $.child(section_2);
			var thead = $.child(table);
			var tr = $.child(thead);

			$.add_svelte_meta(
				() => $.each(tr, 21, () => jours, $.index, ($$anchor, jour) => {
					var th = root_5();
					var text_5 = $.only_child(th, true);

					$.template_effect(() => $.set_text(text_5, $.get(jour)));
					$.append($$anchor, th);
				}),
				'each',
				_page,
				146,
				12
			);

			$.reset(tr);
			$.reset(thead);

			var tbody = $.sibling(thead);

			$.add_svelte_meta(
				() => $.each(tbody, 21, () => $$props.data.grille, $.index, ($$anchor, semaine) => {
					var tr_1 = root_11();

					$.add_svelte_meta(
						() => $.each(tr_1, 21, () => $.get(semaine), $.index, ($$anchor, date) => {
							var td = root_10();
							var node_3 = $.child(td);

							{
								var consequent_5 = ($$anchor) => {
									const duJour = $.tag($.derived(() => $$props.data.reservations.filter((r) => r.debut <= $.get(date) && $.get(date) < r.fin)), 'duJour');

									$.get(duJour);

									const blocageJour = $.tag($.derived(() => $$props.data.blocages.filter((b) => b.debut <= $.get(date) && $.get(date) < b.fin)), 'blocageJour');

									$.get(blocageJour);

									var div_2 = root_9();
									var span = $.child(div_2);
									var text_6 = $.only_child(span, true);
									var ul = $.sibling(span, 2);
									var node_4 = $.child(ul);

									{
										var consequent_3 = ($$anchor) => {
											var li = root_6();

											$.append($$anchor, li);
										};

										$.add_svelte_meta(
											() => $.if(node_4, ($$render) => {
												if ($.get(blocageJour).length > 0) $$render(consequent_3);
											}),
											'if',
											_page,
											162,
											24
										);
									}

									var node_5 = $.sibling(node_4, 2);

									$.add_svelte_meta(
										() => $.each(node_5, 17, () => $.get(duJour).slice(0, 2), (reservation) => reservation.id, ($$anchor, reservation) => {
											var li_1 = root_7();
											var text_7 = $.only_child(li_1, true);

											$.template_effect(() => $.set_text(text_7, $.get(reservation).ref));
											$.append($$anchor, li_1);
										}),
										'each',
										_page,
										167,
										24
									);

									var node_6 = $.sibling(node_5, 2);

									{
										var consequent_4 = ($$anchor) => {
											var li_2 = root_8();
											var text_8 = $.only_child(li_2);

											$.template_effect(() => $.set_text(text_8, `+${$.get(duJour).length - 2}`));
											$.append($$anchor, li_2);
										};

										$.add_svelte_meta(
											() => $.if(node_6, ($$render) => {
												if ($.get(duJour).length > 2) $$render(consequent_4);
											}),
											'if',
											_page,
											172,
											24
										);
									}

									$.reset(ul);
									$.reset(div_2);
									$.template_effect(($0) => $.set_text(text_6, $0), [() => $.get(date).slice(8)]);
									$.append($$anchor, div_2);
								};

								$.add_svelte_meta(
									() => $.if(node_3, ($$render) => {
										if ($.get(date)) $$render(consequent_5);
									}),
									'if',
									_page,
									156,
									18
								);
							}

							$.reset(td);
							$.append($$anchor, td);
						}),
						'each',
						_page,
						154,
						14
					);

					$.reset(tr_1);
					$.append($$anchor, tr_1);
				}),
				'each',
				_page,
				152,
				10
			);

			$.reset(tbody);
			$.reset(table);
			$.reset(section_2);

			var section_3 = $.sibling(section_2, 2);
			var node_7 = $.sibling($.child(section_3), 2);

			{
				var consequent_6 = ($$anchor) => {
					var p_2 = root_12();

					$.append($$anchor, p_2);
				};

				var alternate = ($$anchor) => {
					var ul_1 = root_14();

					$.add_svelte_meta(
						() => $.each(ul_1, 21, () => $$props.data.reservations, (reservation) => reservation.id, ($$anchor, reservation) => {
							var li_3 = root_13();
							var div_3 = $.child(li_3);
							var p_3 = $.child(div_3);
							var text_9 = $.only_child(p_3);
							var span_1 = $.sibling(p_3, 2);
							var text_10 = $.only_child(span_1, true);

							$.reset(div_3);

							var p_4 = $.sibling(div_3, 2);
							var text_11 = $.only_child(p_4);
							var div_4 = $.sibling(p_4, 2);
							var a_3 = $.child(div_4);
							var a_4 = $.sibling(a_3, 2);

							$.reset(div_4);
							$.reset(li_3);

							$.template_effect(() => {
								$.set_text(text_9, `${$.get(reservation).ref ?? ''}
                  ${$.get(reservation).clientNom ? ` — ${$.get(reservation).clientNom}` : ""}`);

								$.set_text(text_10, $.get(reservation).statut);

								$.set_text(text_11, `${$.get(reservation).debut ?? ''} → ${$.get(reservation).fin ?? ''} · ${$.get(reservation).nuits ?? ''}
                nuit${$.get(reservation).nuits > 1 ? "s" : ""} · ${$.get(reservation).voyageurs ?? ''}
                voyageur${$.get(reservation).voyageurs > 1 ? "s" : ""} · ${$.get(reservation).montant ?? ''}`);

								$.set_attribute(a_3, 'href', $.get(reservation).lienVoyageur);
								$.set_attribute(a_4, 'href', $.get(reservation).lienContrat);
							});

							$.append($$anchor, li_3);
						}),
						'each',
						_page,
						194,
						10
					);

					$.reset(ul_1);
					$.append($$anchor, ul_1);
				};

				$.add_svelte_meta(
					() => $.if(node_7, ($$render) => {
						if ($.strict_equals($$props.data.reservations.length, 0)) $$render(consequent_6); else $$render(alternate, -1);
					}),
					'if',
					_page,
					188,
					6
				);
			}

			$.reset(section_3);

			var section_4 = $.sibling(section_3, 2);
			var node_8 = $.sibling($.child(section_4), 2);

			{
				var consequent_7 = ($$anchor) => {
					var p_5 = root_15();

					$.append($$anchor, p_5);
				};

				var alternate_1 = ($$anchor) => {
					var ul_2 = root_17();

					$.add_svelte_meta(
						() => $.each(ul_2, 21, () => $$props.data.blocages, (blocage) => blocage.id, ($$anchor, blocage) => {
							var li_4 = root_16();
							var div_5 = $.child(li_4);
							var p_6 = $.child(div_5);
							var text_12 = $.only_child(p_6, true);
							var p_7 = $.sibling(p_6, 2);
							var text_13 = $.only_child(p_7);

							$.reset(div_5);
							$.next(2);
							$.reset(li_4);

							$.template_effect(() => {
								$.set_text(text_12, $.get(blocage).motif ?? "Indisponibilité OTA");
								$.set_text(text_13, `${$.get(blocage).debut ?? ''} → ${$.get(blocage).fin ?? ''}`);
							});

							$.append($$anchor, li_4);
						}),
						'each',
						_page,
						230,
						10
					);

					$.reset(ul_2);
					$.append($$anchor, ul_2);
				};

				$.add_svelte_meta(
					() => $.if(node_8, ($$render) => {
						if ($.strict_equals($$props.data.blocages.length, 0)) $$render(consequent_7); else $$render(alternate_1, -1);
					}),
					'if',
					_page,
					224,
					6
				);
			}

			$.reset(section_4);

			$.template_effect(
				($0) => {
					$.set_attribute(a, 'href', `/hote/planning?mois=${$$props.data.moisPrecedent}&logement=${$$props.data.logement.id}`);
					$.set_attribute(a_1, 'href', $0);
					$.set_attribute(a_2, 'href', `/hote/planning?mois=${$$props.data.moisSuivant}&logement=${$$props.data.logement.id}`);
					$.set_value(input, $$props.data.mois);
					input_2.defaultValue = $$props.data.debutDefaut;
					input_3.defaultValue = $$props.data.finDefaut;
				},
				[
					() => `/hote/planning?mois=${$$props.data.aujourdHui.slice(0, 7)}&logement=${$$props.data.logement.id}`
				]
			);

			$.append($$anchor, fragment);
		};

		$.add_svelte_meta(
			() => $.if(node_1, ($$render) => {
				if ($$props.data.vide) $$render(consequent_1); else if ($$props.data.logement) $$render(consequent_8, 1);
			}),
			'if',
			_page,
			30,
			2
		);
	}

	$.reset(main);
	$.template_effect(() => $.set_text(text, `Planning — ${$$props.data.moisLabel ?? ''}`));
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
//# sourceMappingURL=data:application/json;base64,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OztlQUZILEtBQUc7O2VBREwsSUFBRyxBQUFEOzs7NEJBRXlCLGFBQU8sRUFBQyxLQUFLLElBQUkscUJBQXFCOytCQUN6QixhQUFPLEVBQUMsS0FBSyxZQUFLLGFBQU8sRUFBQyxHQUFHOzs7MEJBSHJFLElBQUcsQUFBRDs7Ozs7Ozs7YUFGTixJQUFHLEFBQUQ7d0JBQUYsSUFBRyxBQUFEOzs7OzswQkFMQSxhQUFLLFFBQVEsQ0FBQyxNQUFNLEVBQUssQ0FBQzs7Ozs7Ozs7O1dBRmhDLFNBQVEsQUFBRDs7OztxQkFyTEwsV0FFTyx1QkFBdUIsYUFBSyxhQUFhLGFBQWEsYUFBSyxRQUFRLENBQUMsRUFBRSxFQUFFO3FCQUkvRTtxQkFNQSxhQUVPLHVCQUF1QixhQUFLLFdBQVcsYUFBYSxhQUFLLFFBQVEsQ0FBQyxFQUFFLEVBQUU7aUJBUzNFLEtBQUssRUFBa0MsYUFBSyxJQUFJO0tBbUQ1QyxPQUFNLEFBQUQsZ0JBQXlELGFBQUssV0FBVztLQUk5RSxPQUFNLEFBQUQsZ0JBQXVELGFBQUssU0FBUzs7O1dBdEV6RSx1QkFBdUIsYUFBSyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsYUFBYSxhQUFLLFFBQVEsQ0FBQyxFQUFFLEVBQUU7Ozs7Ozs7OztRQW5CeEYsYUFBSyxJQUFJLG1DQVNKLGFBQUssUUFBUTs7Ozs7Ozs7O1NBMUJ4QixJQUFJO3dEQU1hLGFBQUssU0FBUztvQkFOL0IsSUFBSTs7O0FBTkciLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIitwYWdlLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0IGxhbmc9XCJ0c1wiPlxuICBpbXBvcnQgdHlwZSB7IEFjdGlvbkRhdGEsIFBhZ2VEYXRhIH0gZnJvbSBcIi4vJHR5cGVzXCI7XG5cbiAgbGV0IHsgZGF0YSwgZm9ybSB9OiB7IGRhdGE6IFBhZ2VEYXRhOyBmb3JtOiBBY3Rpb25EYXRhIH0gPSAkcHJvcHMoKTtcblxuICBjb25zdCBqb3VycyA9IFtcIkx1blwiLCBcIk1hclwiLCBcIk1lclwiLCBcIkpldVwiLCBcIlZlblwiLCBcIlNhbVwiLCBcIkRpbVwiXTtcbjwvc2NyaXB0PlxuXG48c3ZlbHRlOmhlYWQ+XG4gIDx0aXRsZT5QbGFubmluZyDigJQgTENEIFBhcmM8L3RpdGxlPlxuPC9zdmVsdGU6aGVhZD5cblxuPG1haW4gY2xhc3M9XCJteC1hdXRvIG1heC13LTZ4bCBzcGFjZS15LTggcHgtNiBweS0xMFwiPlxuICA8aGVhZGVyIGNsYXNzPVwidWktZW50ZXRlIHNwYWNlLXktMlwiPlxuICAgIDxwIGNsYXNzPVwidGV4dC1zbSBmb250LW1lZGl1bSB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IHRleHQtZW5jcmUtZmFpbmVcIj5cbiAgICAgIEVzcGFjZSBow7R0ZVxuICAgIDwvcD5cbiAgICA8aDEgY2xhc3M9XCJ0ZXh0LTN4bCBmb250LXNlbWlib2xkIHRyYWNraW5nLXRpZ2h0XCI+XG4gICAgICBQbGFubmluZyDigJQge2RhdGEubW9pc0xhYmVsfVxuICAgIDwvaDE+XG4gICAgeyNpZiBkYXRhLmxvZ2VtZW50fVxuICAgICAgPHAgY2xhc3M9XCJ0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICAgIHtkYXRhLmxvZ2VtZW50Lm5vbX0gKHtkYXRhLmxvZ2VtZW50LmNvZGV9KSDCtyB7ZGF0YS5yZXNlcnZhdGlvbnMubGVuZ3RofVxuICAgICAgICByw6lzZXJ2YXRpb257ZGF0YS5yZXNlcnZhdGlvbnMubGVuZ3RoID4gMSA/IFwic1wiIDogXCJcIn0gwrcge2RhdGEuYmxvY2FnZXMubGVuZ3RofVxuICAgICAgICBibG9jYWdle2RhdGEuYmxvY2FnZXMubGVuZ3RoID4gMSA/IFwic1wiIDogXCJcIn1cbiAgICAgIDwvcD5cbiAgICB7L2lmfVxuICA8L2hlYWRlcj5cblxuICB7I2lmIGRhdGEudmlkZX1cbiAgICA8c2VjdGlvbiBjbGFzcz1cInVpLWNhcnRlIHNwYWNlLXktM1wiPlxuICAgICAgPHAgY2xhc3M9XCJ0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICAgIENyw6lleiBk4oCZYWJvcmQgdW4gbG9nZW1lbnQgcG91ciBwbGFuaWZpZXIgZGVzIHPDqWpvdXJzLlxuICAgICAgPC9wPlxuICAgICAgPGEgY2xhc3M9XCJ1aS1ib3V0b24gdWktYm91dG9uLS1wcmltYWlyZVwiIGhyZWY9XCIvaG90ZS9sb2dlbWVudHNcIj5cbiAgICAgICAgR8OpcmVyIGxlcyBsb2dlbWVudHNcbiAgICAgIDwvYT5cbiAgICA8L3NlY3Rpb24+XG4gIHs6ZWxzZSBpZiBkYXRhLmxvZ2VtZW50fVxuICAgIDxkaXYgY2xhc3M9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgIDxhXG4gICAgICAgIGNsYXNzPVwidWktYm91dG9uIHVpLWJvdXRvbi0tc2Vjb25kYWlyZSB1aS1ib3V0b24tLXBldGl0XCJcbiAgICAgICAgaHJlZj17YC9ob3RlL3BsYW5uaW5nP21vaXM9JHtkYXRhLm1vaXNQcmVjZWRlbnR9JmxvZ2VtZW50PSR7ZGF0YS5sb2dlbWVudC5pZH1gfVxuICAgICAgPlxuICAgICAgICDihpAgTW9pcyBwcsOpY8OpZGVudFxuICAgICAgPC9hPlxuICAgICAgPGFcbiAgICAgICAgY2xhc3M9XCJ1aS1ib3V0b24gdWktYm91dG9uLS1mYW50b21lIHVpLWJvdXRvbi0tcGV0aXRcIlxuICAgICAgICBocmVmPXtgL2hvdGUvcGxhbm5pbmc/bW9pcz0ke2RhdGEuYXVqb3VyZEh1aS5zbGljZSgwLCA3KX0mbG9nZW1lbnQ9JHtkYXRhLmxvZ2VtZW50LmlkfWB9XG4gICAgICA+XG4gICAgICAgIE1vaXMgY291cmFudFxuICAgICAgPC9hPlxuICAgICAgPGFcbiAgICAgICAgY2xhc3M9XCJ1aS1ib3V0b24gdWktYm91dG9uLS1zZWNvbmRhaXJlIHVpLWJvdXRvbi0tcGV0aXRcIlxuICAgICAgICBocmVmPXtgL2hvdGUvcGxhbm5pbmc/bW9pcz0ke2RhdGEubW9pc1N1aXZhbnR9JmxvZ2VtZW50PSR7ZGF0YS5sb2dlbWVudC5pZH1gfVxuICAgICAgPlxuICAgICAgICBNb2lzIHN1aXZhbnQg4oaSXG4gICAgICA8L2E+XG4gICAgICA8YSBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLXNlY29uZGFpcmUgdWktYm91dG9uLS1wZXRpdFwiIGhyZWY9XCIvaG90ZS9wbGFubmluZy9pbXBvcnRcIj5cbiAgICAgICAgSW1wb3J0ZXIgdW4gSUNTXG4gICAgICA8L2E+XG5cbiAgICAgIDxmb3JtIGNsYXNzPVwibWwtYXV0byBmbGV4IGZsZXgtd3JhcCBpdGVtcy1lbmQgZ2FwLTJcIiBtZXRob2Q9XCJHRVRcIiBhY3Rpb249XCIvaG90ZS9wbGFubmluZ1wiPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJtb2lzXCIgdmFsdWU9e2RhdGEubW9pc30gLz5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwic3BhY2UteS0xXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1sYWJlbFwiPkxvZ2VtZW50PC9zcGFuPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3M9XCJ1aS1jaGFtcCBweS0yXCIgbmFtZT1cImxvZ2VtZW50XCI+XG4gICAgICAgICAgICB7I2VhY2ggZGF0YS5sb2dlbWVudHMgYXMgbG9nZW1lbnQgKGxvZ2VtZW50LmlkKX1cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT17bG9nZW1lbnQuaWR9IHNlbGVjdGVkPXtsb2dlbWVudC5pZCA9PT0gZGF0YS5sb2dlbWVudC5pZH0+XG4gICAgICAgICAgICAgICAge2xvZ2VtZW50Lm5vbX1cbiAgICAgICAgICAgICAgPC9vcHRpb24+XG4gICAgICAgICAgICB7L2VhY2h9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvbGFiZWw+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJ1aS1ib3V0b24gdWktYm91dG9uLS1zZWNvbmRhaXJlIHVpLWJvdXRvbi0tcGV0aXRcIiB0eXBlPVwic3VibWl0XCI+XG4gICAgICAgICAgQWZmaWNoZXJcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgPC9kaXY+XG5cbiAgICA8c2VjdGlvbiBjbGFzcz1cInVpLWNhcnRlIHNwYWNlLXktNFwiPlxuICAgICAgPGRpdiBjbGFzcz1cInNwYWNlLXktMVwiPlxuICAgICAgICA8aDIgY2xhc3M9XCJ0ZXh0LWxnIGZvbnQtc2VtaWJvbGRcIj5DcsOpZXIgdW5lIHLDqXNlcnZhdGlvbjwvaDI+XG4gICAgICAgIDxwIGNsYXNzPVwidGV4dC1zbSB0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICAgICAgTGUgY2hldmF1Y2hlbWVudCBhdmVjIHVuZSByw6lzZXJ2YXRpb24gZXhpc3RhbnRlIGVzdCByZWZ1c8OpLlxuICAgICAgICA8L3A+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGZvcm0gbWV0aG9kPVwiUE9TVFwiIGFjdGlvbj1cIj8vY3JlZXJcIiBjbGFzcz1cInNwYWNlLXktNFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZ3JpZCBnYXAtNCBzbTpncmlkLWNvbHMtMiBsZzpncmlkLWNvbHMtM1wiPlxuICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1sYWJlbFwiPkxvZ2VtZW50PC9zcGFuPlxuICAgICAgICAgICAgPHNlbGVjdCBjbGFzcz1cInVpLWNoYW1wXCIgbmFtZT1cImxvZ2VtZW50SWRcIiByZXF1aXJlZD5cbiAgICAgICAgICAgICAgeyNlYWNoIGRhdGEubG9nZW1lbnRzIGFzIGxvZ2VtZW50IChsb2dlbWVudC5pZCl9XG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT17bG9nZW1lbnQuaWR9IHNlbGVjdGVkPXtsb2dlbWVudC5pZCA9PT0gZGF0YS5sb2dlbWVudC5pZH0+XG4gICAgICAgICAgICAgICAgICB7bG9nZW1lbnQubm9tfSAoe2xvZ2VtZW50LmNvZGV9KVxuICAgICAgICAgICAgICAgIDwvb3B0aW9uPlxuICAgICAgICAgICAgICB7L2VhY2h9XG4gICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1sYWJlbFwiPlLDqWbDqXJlbmNlPC9zcGFuPlxuICAgICAgICAgICAgPGlucHV0IGNsYXNzPVwidWktY2hhbXBcIiBuYW1lPVwicmVmXCIgcGxhY2Vob2xkZXI9XCJyZXNhLTIwMjYtMDAxXCIgcmVxdWlyZWQgLz5cbiAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1sYWJlbFwiPkNsaWVudCAoZmFjdWx0YXRpZik8L3NwYW4+XG4gICAgICAgICAgICA8aW5wdXQgY2xhc3M9XCJ1aS1jaGFtcFwiIG5hbWU9XCJjbGllbnROb21cIiBwbGFjZWhvbGRlcj1cIk5vbSBkdSB2b3lhZ2V1clwiIC8+XG4gICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidWktbGFiZWxcIj5Wb3lhZ2V1cnM8L3NwYW4+XG4gICAgICAgICAgICA8aW5wdXQgY2xhc3M9XCJ1aS1jaGFtcFwiIG5hbWU9XCJ2b3lhZ2V1cnNcIiB0eXBlPVwibnVtYmVyXCIgbWluPVwiMVwiIG1heD1cIjIwXCIgdmFsdWU9XCIyXCIgLz5cbiAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1sYWJlbFwiPkTDqWJ1dDwvc3Bhbj5cbiAgICAgICAgICAgIDxpbnB1dCBjbGFzcz1cInVpLWNoYW1wXCIgbmFtZT1cImRlYnV0XCIgdHlwZT1cImRhdGVcIiBkZWZhdWx0VmFsdWU9e2RhdGEuZGVidXREZWZhdXR9IHJlcXVpcmVkIC8+XG4gICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidWktbGFiZWxcIj5GaW4gKGV4Y2x1c2l2ZSk8L3NwYW4+XG4gICAgICAgICAgICA8aW5wdXQgY2xhc3M9XCJ1aS1jaGFtcFwiIG5hbWU9XCJmaW5cIiB0eXBlPVwiZGF0ZVwiIGRlZmF1bHRWYWx1ZT17ZGF0YS5maW5EZWZhdXR9IHJlcXVpcmVkIC8+XG4gICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidWktbGFiZWxcIj5Nb250YW50ICjigqwpPC9zcGFuPlxuICAgICAgICAgICAgPGlucHV0IGNsYXNzPVwidWktY2hhbXBcIiBuYW1lPVwibW9udGFudEV1cm9zXCIgaW5wdXRtb2RlPVwiZGVjaW1hbFwiIHZhbHVlPVwiMFwiIC8+XG4gICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgeyNpZiBmb3JtPy5tZXNzYWdlfVxuICAgICAgICAgIDxwXG4gICAgICAgICAgICBjbGFzcz17Zm9ybS5vayA/IFwidWktYWxlcnRlIHVpLWFsZXJ0ZS0tb2tcIiA6IFwidWktYWxlcnRlIHVpLWFsZXJ0ZS0tZGFuZ2VyXCJ9XG4gICAgICAgICAgICByb2xlPVwic3RhdHVzXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICB7Zm9ybS5tZXNzYWdlfVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgey9pZn1cblxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwidWktYm91dG9uIHVpLWJvdXRvbi0tcHJpbWFpcmVcIiB0eXBlPVwic3VibWl0XCI+XG4gICAgICAgICAgQ3LDqWVyIGxhIHLDqXNlcnZhdGlvblxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICA8L3NlY3Rpb24+XG5cbiAgICA8c2VjdGlvbiBjbGFzcz1cIm92ZXJmbG93LXgtYXV0byByb3VuZGVkLWNhcnRlIGJvcmRlciBib3JkZXItYm9yZHVyZSBiZy1zdXJmYWNlXCI+XG4gICAgICA8dGFibGUgY2xhc3M9XCJ3LWZ1bGwgbWluLXctWzc2MHB4XSBib3JkZXItY29sbGFwc2UgdGV4dC1zbVwiPlxuICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgPHRyIGNsYXNzPVwiYm9yZGVyLWIgYm9yZGVyLWJvcmR1cmUgYmctZm9uZFwiPlxuICAgICAgICAgICAgeyNlYWNoIGpvdXJzIGFzIGpvdXJ9XG4gICAgICAgICAgICAgIDx0aCBjbGFzcz1cInAtMiB0ZXh0LWxlZnQgZm9udC1tZWRpdW1cIj57am91cn08L3RoPlxuICAgICAgICAgICAgey9lYWNofVxuICAgICAgICAgIDwvdHI+XG4gICAgICAgIDwvdGhlYWQ+XG4gICAgICAgIDx0Ym9keT5cbiAgICAgICAgICB7I2VhY2ggZGF0YS5ncmlsbGUgYXMgc2VtYWluZSwgaW5kZXh9XG4gICAgICAgICAgICA8dHIgY2xhc3M9XCJib3JkZXItYiBib3JkZXItYm9yZHVyZSBsYXN0OmJvcmRlci0wXCI+XG4gICAgICAgICAgICAgIHsjZWFjaCBzZW1haW5lIGFzIGRhdGUsIGNvbG9ubmV9XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwicC0yIGFsaWduLXRvcFwiPlxuICAgICAgICAgICAgICAgICAgeyNpZiBkYXRlfVxuICAgICAgICAgICAgICAgICAgICB7QGNvbnN0IGR1Sm91ciA9IGRhdGEucmVzZXJ2YXRpb25zLmZpbHRlcigocikgPT4gci5kZWJ1dCA8PSBkYXRlICYmIGRhdGUgPCByLmZpbil9XG4gICAgICAgICAgICAgICAgICAgIHtAY29uc3QgYmxvY2FnZUpvdXIgPSBkYXRhLmJsb2NhZ2VzLmZpbHRlcigoYikgPT4gYi5kZWJ1dCA8PSBkYXRlICYmIGRhdGUgPCBiLmZpbil9XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtaW4taC0yMCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItYm9yZHVyZSBwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImJsb2NrIHRleHQteHMgdGV4dC1lbmNyZS1mYWluZVwiPntkYXRlLnNsaWNlKDgpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3M9XCJtdC0xIHNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyNpZiBibG9jYWdlSm91ci5sZW5ndGggPiAwfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJyb3VuZGVkIGJnLWFsZXJ0ZS1kb3VjZSBweC0yIHB5LTEgdGV4dC14cyB0ZXh0LWFsZXJ0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsb3F1w6lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsvaWZ9XG4gICAgICAgICAgICAgICAgICAgICAgICB7I2VhY2ggZHVKb3VyLnNsaWNlKDAsIDIpIGFzIHJlc2VydmF0aW9uIChyZXNlcnZhdGlvbi5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzcz1cInRydW5jYXRlIHJvdW5kZWQgYmctc3VyZmFjZTIgcHgtMiBweS0xIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVzZXJ2YXRpb24ucmVmfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgey9lYWNofVxuICAgICAgICAgICAgICAgICAgICAgICAgeyNpZiBkdUpvdXIubGVuZ3RoID4gMn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwidGV4dC14cyB0ZXh0LWVuY3JlLWZhaW5lXCI+K3tkdUpvdXIubGVuZ3RoIC0gMn08L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgey9pZn1cbiAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIHsvaWZ9XG4gICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgey9lYWNofVxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICB7L2VhY2h9XG4gICAgICAgIDwvdGJvZHk+XG4gICAgICA8L3RhYmxlPlxuICAgIDwvc2VjdGlvbj5cblxuICAgIDxzZWN0aW9uIGNsYXNzPVwic3BhY2UteS0zXCI+XG4gICAgICA8aDIgY2xhc3M9XCJ0ZXh0LWxnIGZvbnQtc2VtaWJvbGRcIj5Sw6lzZXJ2YXRpb25zIGR1IG1vaXM8L2gyPlxuICAgICAgeyNpZiBkYXRhLnJlc2VydmF0aW9ucy5sZW5ndGggPT09IDB9XG4gICAgICAgIDxwIGNsYXNzPVwidWktY2FydGUgYm9yZGVyLWRhc2hlZCB0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICAgICAgQXVjdW5lIHLDqXNlcnZhdGlvbiBzdXIgY2UgbW9pcyBwb3VyIGNlIGxvZ2VtZW50LlxuICAgICAgICA8L3A+XG4gICAgICB7OmVsc2V9XG4gICAgICAgIDx1bCBjbGFzcz1cImRpdmlkZS15IGRpdmlkZS1ib3JkdXJlIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLWNhcnRlIGJvcmRlciBib3JkZXItYm9yZHVyZSBiZy1zdXJmYWNlXCI+XG4gICAgICAgICAgeyNlYWNoIGRhdGEucmVzZXJ2YXRpb25zIGFzIHJlc2VydmF0aW9uIChyZXNlcnZhdGlvbi5pZCl9XG4gICAgICAgICAgICA8bGkgY2xhc3M9XCJzcGFjZS15LTEgcC00XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3M9XCJmb250LW1lZGl1bVwiPlxuICAgICAgICAgICAgICAgICAge3Jlc2VydmF0aW9uLnJlZn1cbiAgICAgICAgICAgICAgICAgIHtyZXNlcnZhdGlvbi5jbGllbnROb20gPyBgIOKAlCAke3Jlc2VydmF0aW9uLmNsaWVudE5vbX1gIDogXCJcIn1cbiAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1iYWRnZVwiPntyZXNlcnZhdGlvbi5zdGF0dXR9PC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LXNtIHRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgICAgICAgICAgICB7cmVzZXJ2YXRpb24uZGVidXR9IOKGkiB7cmVzZXJ2YXRpb24uZmlufSDCtyB7cmVzZXJ2YXRpb24ubnVpdHN9XG4gICAgICAgICAgICAgICAgbnVpdHtyZXNlcnZhdGlvbi5udWl0cyA+IDEgPyBcInNcIiA6IFwiXCJ9IMK3IHtyZXNlcnZhdGlvbi52b3lhZ2V1cnN9XG4gICAgICAgICAgICAgICAgdm95YWdldXJ7cmVzZXJ2YXRpb24udm95YWdldXJzID4gMSA/IFwic1wiIDogXCJcIn0gwrcge3Jlc2VydmF0aW9uLm1vbnRhbnR9XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZsZXggZmxleC13cmFwIGdhcC0zIHRleHQtc21cIj5cbiAgICAgICAgICAgICAgICA8YSBjbGFzcz1cInVpLWxpZW5cIiBocmVmPXtyZXNlcnZhdGlvbi5saWVuVm95YWdldXJ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgICAgIExpZW4gdm95YWdldXJcbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgPGEgY2xhc3M9XCJ1aS1saWVuXCIgaHJlZj17cmVzZXJ2YXRpb24ubGllbkNvbnRyYXR9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgICAgIENvbnRyYXRcbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICB7L2VhY2h9XG4gICAgICAgIDwvdWw+XG4gICAgICB7L2lmfVxuICAgIDwvc2VjdGlvbj5cblxuICAgIDxzZWN0aW9uIGNsYXNzPVwic3BhY2UteS0zXCI+XG4gICAgICA8aDIgY2xhc3M9XCJ0ZXh0LWxnIGZvbnQtc2VtaWJvbGRcIj5CbG9jYWdlcyBPVEEgZHUgbW9pczwvaDI+XG4gICAgICB7I2lmIGRhdGEuYmxvY2FnZXMubGVuZ3RoID09PSAwfVxuICAgICAgICA8cCBjbGFzcz1cInVpLWNhcnRlIGJvcmRlci1kYXNoZWQgdGV4dC1lbmNyZS1kb3VjZVwiPlxuICAgICAgICAgIEF1Y3VuIGJsb2NhZ2Ugc3VyIGNlIG1vaXMgcG91ciBjZSBsb2dlbWVudC5cbiAgICAgICAgPC9wPlxuICAgICAgezplbHNlfVxuICAgICAgICA8dWwgY2xhc3M9XCJkaXZpZGUteSBkaXZpZGUtYm9yZHVyZSBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC1jYXJ0ZSBib3JkZXIgYm9yZGVyLWJvcmR1cmUgYmctc3VyZmFjZVwiPlxuICAgICAgICAgIHsjZWFjaCBkYXRhLmJsb2NhZ2VzIGFzIGJsb2NhZ2UgKGJsb2NhZ2UuaWQpfVxuICAgICAgICAgICAgPGxpIGNsYXNzPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBwLTRcIj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cImZvbnQtbWVkaXVtXCI+e2Jsb2NhZ2UubW90aWYgPz8gXCJJbmRpc3BvbmliaWxpdMOpIE9UQVwifTwvcD5cbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cInRleHQtc20gdGV4dC1lbmNyZS1kb3VjZVwiPntibG9jYWdlLmRlYnV0fSDihpIge2Jsb2NhZ2UuZmlufTwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidWktYmFkZ2UgdWktYmFkZ2UtLWFsZXJ0ZVwiPmJsb3F1w6k8L3NwYW4+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgIHsvZWFjaH1cbiAgICAgICAgPC91bD5cbiAgICAgIHsvaWZ9XG4gICAgPC9zZWN0aW9uPlxuICB7L2lmfVxuPC9tYWluPlxuIl0sImZpbGUiOiJDOi9Vc2Vycy9qdWxpZS9EZXNrdG9wL0xvY2F0aW9uIGNvdXJ0ZSBkdXJlZS92Mi9zcmMvcm91dGVzL2hvdGUvcGxhbm5pbmcvK3BhZ2Uuc3ZlbHRlIn0=