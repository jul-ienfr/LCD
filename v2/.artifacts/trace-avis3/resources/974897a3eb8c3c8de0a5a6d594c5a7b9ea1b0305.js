import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/routes/hote/planning/+page.svelte");import "/node_modules/.vite/deps/svelte_internal_disclose-version.js?v=70f5904f";

_page[$.FILENAME] = 'src/routes/hote/planning/+page.svelte';

import * as $ from "/node_modules/.vite/deps/svelte_internal_client.js?v=70f5904f";

var root = $.add_locations($.from_html(`<p class="text-encre-douce"> </p>`), _page[$.FILENAME], [[22, 6]]);
var root_1 = $.add_locations($.from_html(`<section class="ui-carte space-y-3"><p class="text-encre-douce">Créez d’abord un logement pour planifier des séjours.</p> <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">Gérer les logements</a></section>`), _page[$.FILENAME], [[31, 4, [[32, 6], [35, 6]]]]);
var root_2 = $.add_locations($.from_html(`<option> </option>`), _page[$.FILENAME], [[69, 14]]);
var root_3 = $.add_locations($.from_html(`<option> </option>`), _page[$.FILENAME], [[95, 16]]);
var root_4 = $.add_locations($.from_html(`<p class="ui-alerte ui-alerte--ok" role="status"> </p>`), _page[$.FILENAME], [[128, 10]]);
var root_5 = $.add_locations($.from_html(`<p role="status"> </p>`), _page[$.FILENAME], [[133, 10]]);
var root_6 = $.add_locations($.from_html(`<th class="p-2 text-left font-medium"> </th>`), _page[$.FILENAME], [[152, 14]]);
var root_7 = $.add_locations($.from_html(`<li class="rounded bg-alerte-douce px-2 py-1 text-xs text-alerte">Bloqué</li>`), _page[$.FILENAME], [[168, 26]]);
var root_8 = $.add_locations($.from_html(`<li class="truncate rounded bg-surface2 px-2 py-1 text-xs"> </li>`), _page[$.FILENAME], [[173, 26]]);
var root_9 = $.add_locations($.from_html(`<li class="text-xs text-encre-faine"> </li>`), _page[$.FILENAME], [[178, 26]]);
var root_10 = $.add_locations($.from_html(`<div class="min-h-20 rounded-lg border border-bordure p-2"><span class="block text-xs text-encre-faine"> </span> <ul class="mt-1 space-y-1"><!> <!> <!></ul></div>`), _page[$.FILENAME], [[164, 20, [[165, 22], [166, 22]]]]);
var root_11 = $.add_locations($.from_html(`<td class="p-2 align-top"><!></td>`), _page[$.FILENAME], [[160, 16]]);
var root_12 = $.add_locations($.from_html(`<tr class="border-b border-bordure last:border-0"></tr>`), _page[$.FILENAME], [[158, 12]]);
var root_13 = $.add_locations($.from_html(`<p class="ui-carte border-dashed text-encre-douce">Aucune réservation sur ce mois pour ce logement.</p>`), _page[$.FILENAME], [[194, 8]]);

var root_14 = $.add_locations($.from_html(`<li class="space-y-1 p-4"><div class="flex flex-wrap items-center justify-between gap-2"><p class="font-medium"> </p> <span class="ui-badge"> </span></div> <p class="text-sm text-encre-douce"> </p> <div class="flex flex-wrap gap-3 text-sm"><a class="ui-lien" target="_blank" rel="noreferrer">Lien voyageur</a> <a class="ui-lien" target="_blank" rel="noreferrer">Contrat</a></div></li>`), _page[$.FILENAME], [
	[
		200,
		12,
		[
			[201, 14, [[202, 16], [206, 16]]],
			[208, 14],
			[213, 14, [[214, 16], [217, 16]]]
		]
	]
]);

var root_15 = $.add_locations($.from_html(`<ul class="divide-y divide-bordure overflow-hidden rounded-carte border border-bordure bg-surface"></ul>`), _page[$.FILENAME], [[198, 8]]);
var root_16 = $.add_locations($.from_html(`<p class="ui-carte border-dashed text-encre-douce">Aucun blocage sur ce mois pour ce logement.</p>`), _page[$.FILENAME], [[230, 8]]);
var root_17 = $.add_locations($.from_html(`<li class="flex flex-wrap items-center justify-between gap-2 p-4"><div><p class="font-medium"> </p> <p class="text-sm text-encre-douce"> </p></div> <span class="ui-badge ui-badge--alerte">bloqué</span></li>`), _page[$.FILENAME], [[236, 12, [[237, 14, [[238, 16], [239, 16]]], [241, 14]]]]);
var root_18 = $.add_locations($.from_html(`<ul class="divide-y divide-bordure overflow-hidden rounded-carte border border-bordure bg-surface"></ul>`), _page[$.FILENAME], [[234, 8]]);

var root_19 = $.add_locations($.from_html(`<div class="flex flex-wrap items-center gap-2"><a class="ui-bouton ui-bouton--secondaire ui-bouton--petit">← Mois précédent</a> <a class="ui-bouton ui-bouton--fantome ui-bouton--petit">Mois courant</a> <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit">Mois suivant →</a> <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href="/hote/planning/import">Importer un ICS</a> <form class="ml-auto flex flex-wrap items-end gap-2" method="GET" action="/hote/planning"><input type="hidden" name="mois"/> <label class="space-y-1"><span class="ui-label">Logement</span> <select class="ui-champ py-2" name="logement"></select></label> <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">Afficher</button></form></div> <section class="ui-carte space-y-4"><div class="space-y-1"><h2 class="text-lg font-semibold">Créer une réservation</h2> <p class="text-sm text-encre-douce">Le chevauchement avec une réservation existante est refusé.</p></div> <form method="POST" action="?/creer" class="space-y-4"><div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label class="space-y-2"><span class="ui-label">Logement</span> <select class="ui-champ" name="logementId" required=""></select></label> <label class="space-y-2"><span class="ui-label">Référence</span> <input class="ui-champ" name="ref" placeholder="resa-2026-001" required=""/></label> <label class="space-y-2"><span class="ui-label">Client (facultatif)</span> <input class="ui-champ" name="clientNom" placeholder="Nom du voyageur"/></label> <label class="space-y-2"><span class="ui-label">Voyageurs</span> <input class="ui-champ" name="voyageurs" type="number" min="1" max="20" value="2"/></label> <label class="space-y-2"><span class="ui-label">Début</span> <input class="ui-champ" name="debut" type="date" required=""/></label> <label class="space-y-2"><span class="ui-label">Fin (exclusive)</span> <input class="ui-champ" name="fin" type="date" required=""/></label> <label class="space-y-2"><span class="ui-label">Montant (€)</span> <input class="ui-champ" name="montantEuros" inputmode="decimal" value="0"/></label></div> <!> <!> <button class="ui-bouton ui-bouton--primaire" type="submit">Créer la réservation</button></form></section> <section class="overflow-x-auto rounded-carte border border-bordure bg-surface"><table class="w-full min-w-[760px] border-collapse text-sm"><thead><tr class="border-b border-bordure bg-fond"></tr></thead><tbody></tbody></table></section> <section class="space-y-3"><h2 class="text-lg font-semibold">Réservations du mois</h2> <!></section> <section class="space-y-3"><h2 class="text-lg font-semibold">Blocages OTA du mois</h2> <!></section>`, 1), _page[$.FILENAME], [
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
					[141, 8]
				]
			]
		]
	],
	[147, 4, [[148, 6, [[149, 8, [[150, 10]]], [156, 8]]]]],
	[191, 4, [[192, 6]]],
	[227, 4, [[228, 6]]]
]);

var root_20 = $.add_locations($.from_html(`<main class="mx-auto max-w-6xl space-y-8 px-6 py-10"><header class="ui-entete space-y-2"><p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Espace hôte</p> <h1 class="text-3xl font-semibold tracking-tight"> </h1> <!></header> <!></main>`), _page[$.FILENAME], [[13, 0, [[14, 2, [[15, 4], [18, 4]]]]]]);

function _page($$anchor, $$props) {
	$.check_target(new.target);
	$.push($$props, true, _page);

	const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
	var $$exports = { ...$.legacy_api() };
	var main = root_20();

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

		var consequent_9 = ($$anchor) => {
			var fragment = root_19();
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
					var text_4 = $.only_child(p_1);

					$.template_effect(() => $.set_text(text_4, `Réservation ${$$props.data.creation.ref ?? ''} créée (${$$props.data.creation.debut ?? ''} → ${$$props.data.creation.fin ?? ''}).`));
					$.append($$anchor, p_1);
				};

				$.add_svelte_meta(
					() => $.if(node_2, ($$render) => {
						if ($$props.data.creation) $$render(consequent_2);
					}),
					'if',
					_page,
					127,
					8
				);
			}

			var node_3 = $.sibling(node_2, 2);

			{
				var consequent_3 = ($$anchor) => {
					var p_2 = root_5();
					var text_5 = $.only_child(p_2, true);

					$.template_effect(() => {
						$.set_class(p_2, 1, $.clsx($$props.form.ok
							? "ui-alerte ui-alerte--ok"
							: "ui-alerte ui-alerte--danger"));

						$.set_text(text_5, $$props.form.message);
					});

					$.append($$anchor, p_2);
				};

				$.add_svelte_meta(
					() => $.if(node_3, ($$render) => {
						if ($$props.form?.message) $$render(consequent_3);
					}),
					'if',
					_page,
					132,
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
					var th = root_6();
					var text_6 = $.only_child(th, true);

					$.template_effect(() => $.set_text(text_6, $.get(jour)));
					$.append($$anchor, th);
				}),
				'each',
				_page,
				151,
				12
			);

			$.reset(tr);
			$.reset(thead);

			var tbody = $.sibling(thead);

			$.add_svelte_meta(
				() => $.each(tbody, 21, () => $$props.data.grille, $.index, ($$anchor, semaine) => {
					var tr_1 = root_12();

					$.add_svelte_meta(
						() => $.each(tr_1, 21, () => $.get(semaine), $.index, ($$anchor, date) => {
							var td = root_11();
							var node_4 = $.child(td);

							{
								var consequent_6 = ($$anchor) => {
									const duJour = $.tag($.derived(() => $$props.data.reservations.filter((r) => r.debut <= $.get(date) && $.get(date) < r.fin)), 'duJour');

									$.get(duJour);

									const blocageJour = $.tag($.derived(() => $$props.data.blocages.filter((b) => b.debut <= $.get(date) && $.get(date) < b.fin)), 'blocageJour');

									$.get(blocageJour);

									var div_2 = root_10();
									var span = $.child(div_2);
									var text_7 = $.only_child(span, true);
									var ul = $.sibling(span, 2);
									var node_5 = $.child(ul);

									{
										var consequent_4 = ($$anchor) => {
											var li = root_7();

											$.append($$anchor, li);
										};

										$.add_svelte_meta(
											() => $.if(node_5, ($$render) => {
												if ($.get(blocageJour).length > 0) $$render(consequent_4);
											}),
											'if',
											_page,
											167,
											24
										);
									}

									var node_6 = $.sibling(node_5, 2);

									$.add_svelte_meta(
										() => $.each(node_6, 17, () => $.get(duJour).slice(0, 2), (reservation) => reservation.id, ($$anchor, reservation) => {
											var li_1 = root_8();
											var text_8 = $.only_child(li_1, true);

											$.template_effect(() => $.set_text(text_8, $.get(reservation).ref));
											$.append($$anchor, li_1);
										}),
										'each',
										_page,
										172,
										24
									);

									var node_7 = $.sibling(node_6, 2);

									{
										var consequent_5 = ($$anchor) => {
											var li_2 = root_9();
											var text_9 = $.only_child(li_2);

											$.template_effect(() => $.set_text(text_9, `+${$.get(duJour).length - 2}`));
											$.append($$anchor, li_2);
										};

										$.add_svelte_meta(
											() => $.if(node_7, ($$render) => {
												if ($.get(duJour).length > 2) $$render(consequent_5);
											}),
											'if',
											_page,
											177,
											24
										);
									}

									$.reset(ul);
									$.reset(div_2);
									$.template_effect(($0) => $.set_text(text_7, $0), [() => $.get(date).slice(8)]);
									$.append($$anchor, div_2);
								};

								$.add_svelte_meta(
									() => $.if(node_4, ($$render) => {
										if ($.get(date)) $$render(consequent_6);
									}),
									'if',
									_page,
									161,
									18
								);
							}

							$.reset(td);
							$.append($$anchor, td);
						}),
						'each',
						_page,
						159,
						14
					);

					$.reset(tr_1);
					$.append($$anchor, tr_1);
				}),
				'each',
				_page,
				157,
				10
			);

			$.reset(tbody);
			$.reset(table);
			$.reset(section_2);

			var section_3 = $.sibling(section_2, 2);
			var node_8 = $.sibling($.child(section_3), 2);

			{
				var consequent_7 = ($$anchor) => {
					var p_3 = root_13();

					$.append($$anchor, p_3);
				};

				var alternate = ($$anchor) => {
					var ul_1 = root_15();

					$.add_svelte_meta(
						() => $.each(ul_1, 21, () => $$props.data.reservations, (reservation) => reservation.id, ($$anchor, reservation) => {
							var li_3 = root_14();
							var div_3 = $.child(li_3);
							var p_4 = $.child(div_3);
							var text_10 = $.only_child(p_4);
							var span_1 = $.sibling(p_4, 2);
							var text_11 = $.only_child(span_1, true);

							$.reset(div_3);

							var p_5 = $.sibling(div_3, 2);
							var text_12 = $.only_child(p_5);
							var div_4 = $.sibling(p_5, 2);
							var a_3 = $.child(div_4);
							var a_4 = $.sibling(a_3, 2);

							$.reset(div_4);
							$.reset(li_3);

							$.template_effect(() => {
								$.set_text(text_10, `${$.get(reservation).ref ?? ''}
                  ${$.get(reservation).clientNom ? ` — ${$.get(reservation).clientNom}` : ""}`);

								$.set_text(text_11, $.get(reservation).statut);

								$.set_text(text_12, `${$.get(reservation).debut ?? ''} → ${$.get(reservation).fin ?? ''} · ${$.get(reservation).nuits ?? ''}
                nuit${$.get(reservation).nuits > 1 ? "s" : ""} · ${$.get(reservation).voyageurs ?? ''}
                voyageur${$.get(reservation).voyageurs > 1 ? "s" : ""} · ${$.get(reservation).montant ?? ''}`);

								$.set_attribute(a_3, 'href', $.get(reservation).lienVoyageur);
								$.set_attribute(a_4, 'href', $.get(reservation).lienContrat);
							});

							$.append($$anchor, li_3);
						}),
						'each',
						_page,
						199,
						10
					);

					$.reset(ul_1);
					$.append($$anchor, ul_1);
				};

				$.add_svelte_meta(
					() => $.if(node_8, ($$render) => {
						if ($.strict_equals($$props.data.reservations.length, 0)) $$render(consequent_7); else $$render(alternate, -1);
					}),
					'if',
					_page,
					193,
					6
				);
			}

			$.reset(section_3);

			var section_4 = $.sibling(section_3, 2);
			var node_9 = $.sibling($.child(section_4), 2);

			{
				var consequent_8 = ($$anchor) => {
					var p_6 = root_16();

					$.append($$anchor, p_6);
				};

				var alternate_1 = ($$anchor) => {
					var ul_2 = root_18();

					$.add_svelte_meta(
						() => $.each(ul_2, 21, () => $$props.data.blocages, (blocage) => blocage.id, ($$anchor, blocage) => {
							var li_4 = root_17();
							var div_5 = $.child(li_4);
							var p_7 = $.child(div_5);
							var text_13 = $.only_child(p_7, true);
							var p_8 = $.sibling(p_7, 2);
							var text_14 = $.only_child(p_8);

							$.reset(div_5);
							$.next(2);
							$.reset(li_4);

							$.template_effect(() => {
								$.set_text(text_13, $.get(blocage).motif ?? "Indisponibilité OTA");
								$.set_text(text_14, `${$.get(blocage).debut ?? ''} → ${$.get(blocage).fin ?? ''}`);
							});

							$.append($$anchor, li_4);
						}),
						'each',
						_page,
						235,
						10
					);

					$.reset(ul_2);
					$.append($$anchor, ul_2);
				};

				$.add_svelte_meta(
					() => $.if(node_9, ($$render) => {
						if ($.strict_equals($$props.data.blocages.length, 0)) $$render(consequent_8); else $$render(alternate_1, -1);
					}),
					'if',
					_page,
					229,
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
				if ($$props.data.vide) $$render(consequent_1); else if ($$props.data.logement) $$render(consequent_9, 1);
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
//# sourceMappingURL=data:application/json;base64,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S0FBRSxPQUFPLENBQUMsRUFBRSxhQUFuQixPQUFPO1dBQzVCLElBQUcsQUFBRDtXQUNBLEtBQUcsV0FETCxJQUFHLEFBQUQ7V0FFRSxHQUFFLEFBQUQsV0FESCxLQUFHO2tDQUNELEdBQUUsQUFBRDtXQUNELEdBQUUsQUFBRCxhQURELEdBQUUsQUFBRDtrQ0FDRCxHQUFFLEFBQUQ7O2VBRkgsS0FBRzs7ZUFETCxJQUFHLEFBQUQ7Ozs0QkFFeUIsYUFBTyxFQUFDLEtBQUssSUFBSSxxQkFBcUI7K0JBQ3pCLGFBQU8sRUFBQyxLQUFLLFlBQUssYUFBTyxFQUFDLEdBQUc7OzswQkFIckUsSUFBRyxBQUFEOzs7Ozs7OzthQUZOLElBQUcsQUFBRDt3QkFBRixJQUFHLEFBQUQ7Ozs7OzBCQUxBLGFBQUssUUFBUSxDQUFDLE1BQU0sRUFBSyxDQUFDOzs7Ozs7Ozs7V0FGaEMsU0FBUSxBQUFEOzs7O3FCQTFMTCxXQUVPLHVCQUF1QixhQUFLLGFBQWEsYUFBYSxhQUFLLFFBQVEsQ0FBQyxFQUFFLEVBQUU7cUJBSS9FO3FCQU1BLGFBRU8sdUJBQXVCLGFBQUssV0FBVyxhQUFhLGFBQUssUUFBUSxDQUFDLEVBQUUsRUFBRTtpQkFTM0UsS0FBSyxFQUFrQyxhQUFLLElBQUk7S0FtRDVDLE9BQU0sQUFBRCxnQkFBeUQsYUFBSyxXQUFXO0tBSTlFLE9BQU0sQUFBRCxnQkFBdUQsYUFBSyxTQUFTOzs7V0F0RXpFLHVCQUF1QixhQUFLLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxhQUFhLGFBQUssUUFBUSxDQUFDLEVBQUUsRUFBRTs7Ozs7Ozs7O1FBbkJ4RixhQUFLLElBQUksbUNBU0osYUFBSyxRQUFROzs7Ozs7Ozs7U0ExQnhCLElBQUk7d0RBTWEsYUFBSyxTQUFTO29CQU4vQixJQUFJOzs7QUFORyIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiK3BhZ2Uuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQgbGFuZz1cInRzXCI+XG4gIGltcG9ydCB0eXBlIHsgQWN0aW9uRGF0YSwgUGFnZURhdGEgfSBmcm9tIFwiLi8kdHlwZXNcIjtcblxuICBsZXQgeyBkYXRhLCBmb3JtIH06IHsgZGF0YTogUGFnZURhdGE7IGZvcm06IEFjdGlvbkRhdGEgfSA9ICRwcm9wcygpO1xuXG4gIGNvbnN0IGpvdXJzID0gW1wiTHVuXCIsIFwiTWFyXCIsIFwiTWVyXCIsIFwiSmV1XCIsIFwiVmVuXCIsIFwiU2FtXCIsIFwiRGltXCJdO1xuPC9zY3JpcHQ+XG5cbjxzdmVsdGU6aGVhZD5cbiAgPHRpdGxlPlBsYW5uaW5nIOKAlCBMQ0QgUGFyYzwvdGl0bGU+XG48L3N2ZWx0ZTpoZWFkPlxuXG48bWFpbiBjbGFzcz1cIm14LWF1dG8gbWF4LXctNnhsIHNwYWNlLXktOCBweC02IHB5LTEwXCI+XG4gIDxoZWFkZXIgY2xhc3M9XCJ1aS1lbnRldGUgc3BhY2UteS0yXCI+XG4gICAgPHAgY2xhc3M9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgdGV4dC1lbmNyZS1mYWluZVwiPlxuICAgICAgRXNwYWNlIGjDtHRlXG4gICAgPC9wPlxuICAgIDxoMSBjbGFzcz1cInRleHQtM3hsIGZvbnQtc2VtaWJvbGQgdHJhY2tpbmctdGlnaHRcIj5cbiAgICAgIFBsYW5uaW5nIOKAlCB7ZGF0YS5tb2lzTGFiZWx9XG4gICAgPC9oMT5cbiAgICB7I2lmIGRhdGEubG9nZW1lbnR9XG4gICAgICA8cCBjbGFzcz1cInRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgICAge2RhdGEubG9nZW1lbnQubm9tfSAoe2RhdGEubG9nZW1lbnQuY29kZX0pIMK3IHtkYXRhLnJlc2VydmF0aW9ucy5sZW5ndGh9XG4gICAgICAgIHLDqXNlcnZhdGlvbntkYXRhLnJlc2VydmF0aW9ucy5sZW5ndGggPiAxID8gXCJzXCIgOiBcIlwifSDCtyB7ZGF0YS5ibG9jYWdlcy5sZW5ndGh9XG4gICAgICAgIGJsb2NhZ2V7ZGF0YS5ibG9jYWdlcy5sZW5ndGggPiAxID8gXCJzXCIgOiBcIlwifVxuICAgICAgPC9wPlxuICAgIHsvaWZ9XG4gIDwvaGVhZGVyPlxuXG4gIHsjaWYgZGF0YS52aWRlfVxuICAgIDxzZWN0aW9uIGNsYXNzPVwidWktY2FydGUgc3BhY2UteS0zXCI+XG4gICAgICA8cCBjbGFzcz1cInRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgICAgQ3LDqWV6IGTigJlhYm9yZCB1biBsb2dlbWVudCBwb3VyIHBsYW5pZmllciBkZXMgc8Opam91cnMuXG4gICAgICA8L3A+XG4gICAgICA8YSBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLXByaW1haXJlXCIgaHJlZj1cIi9ob3RlL2xvZ2VtZW50c1wiPlxuICAgICAgICBHw6lyZXIgbGVzIGxvZ2VtZW50c1xuICAgICAgPC9hPlxuICAgIDwvc2VjdGlvbj5cbiAgezplbHNlIGlmIGRhdGEubG9nZW1lbnR9XG4gICAgPGRpdiBjbGFzcz1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgPGFcbiAgICAgICAgY2xhc3M9XCJ1aS1ib3V0b24gdWktYm91dG9uLS1zZWNvbmRhaXJlIHVpLWJvdXRvbi0tcGV0aXRcIlxuICAgICAgICBocmVmPXtgL2hvdGUvcGxhbm5pbmc/bW9pcz0ke2RhdGEubW9pc1ByZWNlZGVudH0mbG9nZW1lbnQ9JHtkYXRhLmxvZ2VtZW50LmlkfWB9XG4gICAgICA+XG4gICAgICAgIOKGkCBNb2lzIHByw6ljw6lkZW50XG4gICAgICA8L2E+XG4gICAgICA8YVxuICAgICAgICBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLWZhbnRvbWUgdWktYm91dG9uLS1wZXRpdFwiXG4gICAgICAgIGhyZWY9e2AvaG90ZS9wbGFubmluZz9tb2lzPSR7ZGF0YS5hdWpvdXJkSHVpLnNsaWNlKDAsIDcpfSZsb2dlbWVudD0ke2RhdGEubG9nZW1lbnQuaWR9YH1cbiAgICAgID5cbiAgICAgICAgTW9pcyBjb3VyYW50XG4gICAgICA8L2E+XG4gICAgICA8YVxuICAgICAgICBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLXNlY29uZGFpcmUgdWktYm91dG9uLS1wZXRpdFwiXG4gICAgICAgIGhyZWY9e2AvaG90ZS9wbGFubmluZz9tb2lzPSR7ZGF0YS5tb2lzU3VpdmFudH0mbG9nZW1lbnQ9JHtkYXRhLmxvZ2VtZW50LmlkfWB9XG4gICAgICA+XG4gICAgICAgIE1vaXMgc3VpdmFudCDihpJcbiAgICAgIDwvYT5cbiAgICAgIDxhIGNsYXNzPVwidWktYm91dG9uIHVpLWJvdXRvbi0tc2Vjb25kYWlyZSB1aS1ib3V0b24tLXBldGl0XCIgaHJlZj1cIi9ob3RlL3BsYW5uaW5nL2ltcG9ydFwiPlxuICAgICAgICBJbXBvcnRlciB1biBJQ1NcbiAgICAgIDwvYT5cblxuICAgICAgPGZvcm0gY2xhc3M9XCJtbC1hdXRvIGZsZXggZmxleC13cmFwIGl0ZW1zLWVuZCBnYXAtMlwiIG1ldGhvZD1cIkdFVFwiIGFjdGlvbj1cIi9ob3RlL3BsYW5uaW5nXCI+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIm1vaXNcIiB2YWx1ZT17ZGF0YS5tb2lzfSAvPlxuICAgICAgICA8bGFiZWwgY2xhc3M9XCJzcGFjZS15LTFcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInVpLWxhYmVsXCI+TG9nZW1lbnQ8L3NwYW4+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzcz1cInVpLWNoYW1wIHB5LTJcIiBuYW1lPVwibG9nZW1lbnRcIj5cbiAgICAgICAgICAgIHsjZWFjaCBkYXRhLmxvZ2VtZW50cyBhcyBsb2dlbWVudCAobG9nZW1lbnQuaWQpfVxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPXtsb2dlbWVudC5pZH0gc2VsZWN0ZWQ9e2xvZ2VtZW50LmlkID09PSBkYXRhLmxvZ2VtZW50LmlkfT5cbiAgICAgICAgICAgICAgICB7bG9nZW1lbnQubm9tfVxuICAgICAgICAgICAgICA8L29wdGlvbj5cbiAgICAgICAgICAgIHsvZWFjaH1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLXNlY29uZGFpcmUgdWktYm91dG9uLS1wZXRpdFwiIHR5cGU9XCJzdWJtaXRcIj5cbiAgICAgICAgICBBZmZpY2hlclxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICA8L2Rpdj5cblxuICAgIDxzZWN0aW9uIGNsYXNzPVwidWktY2FydGUgc3BhY2UteS00XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwic3BhY2UteS0xXCI+XG4gICAgICAgIDxoMiBjbGFzcz1cInRleHQtbGcgZm9udC1zZW1pYm9sZFwiPkNyw6llciB1bmUgcsOpc2VydmF0aW9uPC9oMj5cbiAgICAgICAgPHAgY2xhc3M9XCJ0ZXh0LXNtIHRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgICAgICBMZSBjaGV2YXVjaGVtZW50IGF2ZWMgdW5lIHLDqXNlcnZhdGlvbiBleGlzdGFudGUgZXN0IHJlZnVzw6kuXG4gICAgICAgIDwvcD5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8Zm9ybSBtZXRob2Q9XCJQT1NUXCIgYWN0aW9uPVwiPy9jcmVlclwiIGNsYXNzPVwic3BhY2UteS00XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJncmlkIGdhcC00IHNtOmdyaWQtY29scy0yIGxnOmdyaWQtY29scy0zXCI+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInVpLWxhYmVsXCI+TG9nZW1lbnQ8L3NwYW4+XG4gICAgICAgICAgICA8c2VsZWN0IGNsYXNzPVwidWktY2hhbXBcIiBuYW1lPVwibG9nZW1lbnRJZFwiIHJlcXVpcmVkPlxuICAgICAgICAgICAgICB7I2VhY2ggZGF0YS5sb2dlbWVudHMgYXMgbG9nZW1lbnQgKGxvZ2VtZW50LmlkKX1cbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPXtsb2dlbWVudC5pZH0gc2VsZWN0ZWQ9e2xvZ2VtZW50LmlkID09PSBkYXRhLmxvZ2VtZW50LmlkfT5cbiAgICAgICAgICAgICAgICAgIHtsb2dlbWVudC5ub219ICh7bG9nZW1lbnQuY29kZX0pXG4gICAgICAgICAgICAgICAgPC9vcHRpb24+XG4gICAgICAgICAgICAgIHsvZWFjaH1cbiAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInVpLWxhYmVsXCI+UsOpZsOpcmVuY2U8L3NwYW4+XG4gICAgICAgICAgICA8aW5wdXQgY2xhc3M9XCJ1aS1jaGFtcFwiIG5hbWU9XCJyZWZcIiBwbGFjZWhvbGRlcj1cInJlc2EtMjAyNi0wMDFcIiByZXF1aXJlZCAvPlxuICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInVpLWxhYmVsXCI+Q2xpZW50IChmYWN1bHRhdGlmKTwvc3Bhbj5cbiAgICAgICAgICAgIDxpbnB1dCBjbGFzcz1cInVpLWNoYW1wXCIgbmFtZT1cImNsaWVudE5vbVwiIHBsYWNlaG9sZGVyPVwiTm9tIGR1IHZveWFnZXVyXCIgLz5cbiAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1sYWJlbFwiPlZveWFnZXVyczwvc3Bhbj5cbiAgICAgICAgICAgIDxpbnB1dCBjbGFzcz1cInVpLWNoYW1wXCIgbmFtZT1cInZveWFnZXVyc1wiIHR5cGU9XCJudW1iZXJcIiBtaW49XCIxXCIgbWF4PVwiMjBcIiB2YWx1ZT1cIjJcIiAvPlxuICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInVpLWxhYmVsXCI+RMOpYnV0PC9zcGFuPlxuICAgICAgICAgICAgPGlucHV0IGNsYXNzPVwidWktY2hhbXBcIiBuYW1lPVwiZGVidXRcIiB0eXBlPVwiZGF0ZVwiIGRlZmF1bHRWYWx1ZT17ZGF0YS5kZWJ1dERlZmF1dH0gcmVxdWlyZWQgLz5cbiAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1sYWJlbFwiPkZpbiAoZXhjbHVzaXZlKTwvc3Bhbj5cbiAgICAgICAgICAgIDxpbnB1dCBjbGFzcz1cInVpLWNoYW1wXCIgbmFtZT1cImZpblwiIHR5cGU9XCJkYXRlXCIgZGVmYXVsdFZhbHVlPXtkYXRhLmZpbkRlZmF1dH0gcmVxdWlyZWQgLz5cbiAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1sYWJlbFwiPk1vbnRhbnQgKOKCrCk8L3NwYW4+XG4gICAgICAgICAgICA8aW5wdXQgY2xhc3M9XCJ1aS1jaGFtcFwiIG5hbWU9XCJtb250YW50RXVyb3NcIiBpbnB1dG1vZGU9XCJkZWNpbWFsXCIgdmFsdWU9XCIwXCIgLz5cbiAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7I2lmIGRhdGEuY3JlYXRpb259XG4gICAgICAgICAgPHAgY2xhc3M9XCJ1aS1hbGVydGUgdWktYWxlcnRlLS1va1wiIHJvbGU9XCJzdGF0dXNcIj5cbiAgICAgICAgICAgIFLDqXNlcnZhdGlvbiB7ZGF0YS5jcmVhdGlvbi5yZWZ9IGNyw6nDqWUgKHtkYXRhLmNyZWF0aW9uLmRlYnV0fSDihpIge2RhdGEuY3JlYXRpb24uZmlufSkuXG4gICAgICAgICAgPC9wPlxuICAgICAgICB7L2lmfVxuICAgICAgICB7I2lmIGZvcm0/Lm1lc3NhZ2V9XG4gICAgICAgICAgPHBcbiAgICAgICAgICAgIGNsYXNzPXtmb3JtLm9rID8gXCJ1aS1hbGVydGUgdWktYWxlcnRlLS1va1wiIDogXCJ1aS1hbGVydGUgdWktYWxlcnRlLS1kYW5nZXJcIn1cbiAgICAgICAgICAgIHJvbGU9XCJzdGF0dXNcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHtmb3JtLm1lc3NhZ2V9XG4gICAgICAgICAgPC9wPlxuICAgICAgICB7L2lmfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJ1aS1ib3V0b24gdWktYm91dG9uLS1wcmltYWlyZVwiIHR5cGU9XCJzdWJtaXRcIj5cbiAgICAgICAgICBDcsOpZXIgbGEgcsOpc2VydmF0aW9uXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIDwvc2VjdGlvbj5cblxuICAgIDxzZWN0aW9uIGNsYXNzPVwib3ZlcmZsb3cteC1hdXRvIHJvdW5kZWQtY2FydGUgYm9yZGVyIGJvcmRlci1ib3JkdXJlIGJnLXN1cmZhY2VcIj5cbiAgICAgIDx0YWJsZSBjbGFzcz1cInctZnVsbCBtaW4tdy1bNzYwcHhdIGJvcmRlci1jb2xsYXBzZSB0ZXh0LXNtXCI+XG4gICAgICAgIDx0aGVhZD5cbiAgICAgICAgICA8dHIgY2xhc3M9XCJib3JkZXItYiBib3JkZXItYm9yZHVyZSBiZy1mb25kXCI+XG4gICAgICAgICAgICB7I2VhY2ggam91cnMgYXMgam91cn1cbiAgICAgICAgICAgICAgPHRoIGNsYXNzPVwicC0yIHRleHQtbGVmdCBmb250LW1lZGl1bVwiPntqb3VyfTwvdGg+XG4gICAgICAgICAgICB7L2VhY2h9XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgPC90aGVhZD5cbiAgICAgICAgPHRib2R5PlxuICAgICAgICAgIHsjZWFjaCBkYXRhLmdyaWxsZSBhcyBzZW1haW5lLCBpbmRleH1cbiAgICAgICAgICAgIDx0ciBjbGFzcz1cImJvcmRlci1iIGJvcmRlci1ib3JkdXJlIGxhc3Q6Ym9yZGVyLTBcIj5cbiAgICAgICAgICAgICAgeyNlYWNoIHNlbWFpbmUgYXMgZGF0ZSwgY29sb25uZX1cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJwLTIgYWxpZ24tdG9wXCI+XG4gICAgICAgICAgICAgICAgICB7I2lmIGRhdGV9XG4gICAgICAgICAgICAgICAgICAgIHtAY29uc3QgZHVKb3VyID0gZGF0YS5yZXNlcnZhdGlvbnMuZmlsdGVyKChyKSA9PiByLmRlYnV0IDw9IGRhdGUgJiYgZGF0ZSA8IHIuZmluKX1cbiAgICAgICAgICAgICAgICAgICAge0Bjb25zdCBibG9jYWdlSm91ciA9IGRhdGEuYmxvY2FnZXMuZmlsdGVyKChiKSA9PiBiLmRlYnV0IDw9IGRhdGUgJiYgZGF0ZSA8IGIuZmluKX1cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1pbi1oLTIwIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1ib3JkdXJlIHAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYmxvY2sgdGV4dC14cyB0ZXh0LWVuY3JlLWZhaW5lXCI+e2RhdGUuc2xpY2UoOCl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzcz1cIm10LTEgc3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7I2lmIGJsb2NhZ2VKb3VyLmxlbmd0aCA+IDB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzcz1cInJvdW5kZWQgYmctYWxlcnRlLWRvdWNlIHB4LTIgcHktMSB0ZXh0LXhzIHRleHQtYWxlcnRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQmxvcXXDqVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgey9pZn1cbiAgICAgICAgICAgICAgICAgICAgICAgIHsjZWFjaCBkdUpvdXIuc2xpY2UoMCwgMikgYXMgcmVzZXJ2YXRpb24gKHJlc2VydmF0aW9uLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwidHJ1bmNhdGUgcm91bmRlZCBiZy1zdXJmYWNlMiBweC0yIHB5LTEgdGV4dC14c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZXNlcnZhdGlvbi5yZWZ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICB7L2VhY2h9XG4gICAgICAgICAgICAgICAgICAgICAgICB7I2lmIGR1Sm91ci5sZW5ndGggPiAyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJ0ZXh0LXhzIHRleHQtZW5jcmUtZmFpbmVcIj4re2R1Sm91ci5sZW5ndGggLSAyfTwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICB7L2lmfVxuICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgey9pZn1cbiAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICB7L2VhY2h9XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIHsvZWFjaH1cbiAgICAgICAgPC90Ym9keT5cbiAgICAgIDwvdGFibGU+XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPHNlY3Rpb24gY2xhc3M9XCJzcGFjZS15LTNcIj5cbiAgICAgIDxoMiBjbGFzcz1cInRleHQtbGcgZm9udC1zZW1pYm9sZFwiPlLDqXNlcnZhdGlvbnMgZHUgbW9pczwvaDI+XG4gICAgICB7I2lmIGRhdGEucmVzZXJ2YXRpb25zLmxlbmd0aCA9PT0gMH1cbiAgICAgICAgPHAgY2xhc3M9XCJ1aS1jYXJ0ZSBib3JkZXItZGFzaGVkIHRleHQtZW5jcmUtZG91Y2VcIj5cbiAgICAgICAgICBBdWN1bmUgcsOpc2VydmF0aW9uIHN1ciBjZSBtb2lzIHBvdXIgY2UgbG9nZW1lbnQuXG4gICAgICAgIDwvcD5cbiAgICAgIHs6ZWxzZX1cbiAgICAgICAgPHVsIGNsYXNzPVwiZGl2aWRlLXkgZGl2aWRlLWJvcmR1cmUgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtY2FydGUgYm9yZGVyIGJvcmRlci1ib3JkdXJlIGJnLXN1cmZhY2VcIj5cbiAgICAgICAgICB7I2VhY2ggZGF0YS5yZXNlcnZhdGlvbnMgYXMgcmVzZXJ2YXRpb24gKHJlc2VydmF0aW9uLmlkKX1cbiAgICAgICAgICAgIDxsaSBjbGFzcz1cInNwYWNlLXktMSBwLTRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cImZvbnQtbWVkaXVtXCI+XG4gICAgICAgICAgICAgICAgICB7cmVzZXJ2YXRpb24ucmVmfVxuICAgICAgICAgICAgICAgICAge3Jlc2VydmF0aW9uLmNsaWVudE5vbSA/IGAg4oCUICR7cmVzZXJ2YXRpb24uY2xpZW50Tm9tfWAgOiBcIlwifVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInVpLWJhZGdlXCI+e3Jlc2VydmF0aW9uLnN0YXR1dH08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzcz1cInRleHQtc20gdGV4dC1lbmNyZS1kb3VjZVwiPlxuICAgICAgICAgICAgICAgIHtyZXNlcnZhdGlvbi5kZWJ1dH0g4oaSIHtyZXNlcnZhdGlvbi5maW59IMK3IHtyZXNlcnZhdGlvbi5udWl0c31cbiAgICAgICAgICAgICAgICBudWl0e3Jlc2VydmF0aW9uLm51aXRzID4gMSA/IFwic1wiIDogXCJcIn0gwrcge3Jlc2VydmF0aW9uLnZveWFnZXVyc31cbiAgICAgICAgICAgICAgICB2b3lhZ2V1cntyZXNlcnZhdGlvbi52b3lhZ2V1cnMgPiAxID8gXCJzXCIgOiBcIlwifSDCtyB7cmVzZXJ2YXRpb24ubW9udGFudH1cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleCBmbGV4LXdyYXAgZ2FwLTMgdGV4dC1zbVwiPlxuICAgICAgICAgICAgICAgIDxhIGNsYXNzPVwidWktbGllblwiIGhyZWY9e3Jlc2VydmF0aW9uLmxpZW5Wb3lhZ2V1cn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICAgICAgTGllbiB2b3lhZ2V1clxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICA8YSBjbGFzcz1cInVpLWxpZW5cIiBocmVmPXtyZXNlcnZhdGlvbi5saWVuQ29udHJhdH0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICAgICAgQ29udHJhdFxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgIHsvZWFjaH1cbiAgICAgICAgPC91bD5cbiAgICAgIHsvaWZ9XG4gICAgPC9zZWN0aW9uPlxuXG4gICAgPHNlY3Rpb24gY2xhc3M9XCJzcGFjZS15LTNcIj5cbiAgICAgIDxoMiBjbGFzcz1cInRleHQtbGcgZm9udC1zZW1pYm9sZFwiPkJsb2NhZ2VzIE9UQSBkdSBtb2lzPC9oMj5cbiAgICAgIHsjaWYgZGF0YS5ibG9jYWdlcy5sZW5ndGggPT09IDB9XG4gICAgICAgIDxwIGNsYXNzPVwidWktY2FydGUgYm9yZGVyLWRhc2hlZCB0ZXh0LWVuY3JlLWRvdWNlXCI+XG4gICAgICAgICAgQXVjdW4gYmxvY2FnZSBzdXIgY2UgbW9pcyBwb3VyIGNlIGxvZ2VtZW50LlxuICAgICAgICA8L3A+XG4gICAgICB7OmVsc2V9XG4gICAgICAgIDx1bCBjbGFzcz1cImRpdmlkZS15IGRpdmlkZS1ib3JkdXJlIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLWNhcnRlIGJvcmRlciBib3JkZXItYm9yZHVyZSBiZy1zdXJmYWNlXCI+XG4gICAgICAgICAgeyNlYWNoIGRhdGEuYmxvY2FnZXMgYXMgYmxvY2FnZSAoYmxvY2FnZS5pZCl9XG4gICAgICAgICAgICA8bGkgY2xhc3M9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHAtNFwiPlxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwiZm9udC1tZWRpdW1cIj57YmxvY2FnZS5tb3RpZiA/PyBcIkluZGlzcG9uaWJpbGl0w6kgT1RBXCJ9PC9wPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC1zbSB0ZXh0LWVuY3JlLWRvdWNlXCI+e2Jsb2NhZ2UuZGVidXR9IOKGkiB7YmxvY2FnZS5maW59PC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ1aS1iYWRnZSB1aS1iYWRnZS0tYWxlcnRlXCI+YmxvcXXDqTwvc3Bhbj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgey9lYWNofVxuICAgICAgICA8L3VsPlxuICAgICAgey9pZn1cbiAgICA8L3NlY3Rpb24+XG4gIHsvaWZ9XG48L21haW4+XG4iXSwiZmlsZSI6IkM6L1VzZXJzL2p1bGllL0Rlc2t0b3AvTG9jYXRpb24gY291cnRlIGR1cmVlL3YyL3NyYy9yb3V0ZXMvaG90ZS9wbGFubmluZy8rcGFnZS5zdmVsdGUifQ==