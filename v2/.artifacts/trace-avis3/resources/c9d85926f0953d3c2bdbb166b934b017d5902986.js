import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/routes/hote/+layout.svelte");import "/node_modules/.vite/deps/svelte_internal_disclose-version.js?v=70f5904f";

_layout[$.FILENAME] = 'src/routes/hote/+layout.svelte';

import * as $ from "/node_modules/.vite/deps/svelte_internal_client.js?v=70f5904f";

var root = $.add_locations($.from_html(`<img class="size-8 rounded-lg object-contain" alt=""/>`), _layout[$.FILENAME], [[93, 10]]);
var root_1 = $.add_locations($.from_html(`<span class="grid size-8 place-items-center rounded-lg bg-accent text-sm font-black text-sur-accent"> </span>`), _layout[$.FILENAME], [[99, 10]]);
var root_2 = $.add_locations($.from_html(`<li><a class="ui-nav-lien whitespace-nowrap"> </a></li>`), _layout[$.FILENAME], [[121, 12, [[122, 14]]]]);
var root_3 = $.add_locations($.from_html(`<a class="ui-menu-lien"> </a>`), _layout[$.FILENAME], [[144, 20]]);
var root_4 = $.add_locations($.from_html(`<a class="ui-menu-lien"> </a>`), _layout[$.FILENAME], [[156, 20]]);
var root_5 = $.add_locations($.from_html(`<a class="ui-menu-lien"> </a>`), _layout[$.FILENAME], [[168, 20]]);
var root_6 = $.add_locations($.from_html(`<a class="ui-menu-lien"> </a>`), _layout[$.FILENAME], [[181, 22]]);
var root_7 = $.add_locations($.from_html(`<div class="ui-menu-groupe"><p class="ui-menu-titre">Administration</p> <!></div>`), _layout[$.FILENAME], [[178, 18, [[179, 20]]]]);
var root_8 = $.add_locations($.from_html(`<a class="ui-bouton ui-bouton--fantome ui-bouton--petit" href="/supervision/apparence">Apparence</a>`), _layout[$.FILENAME], [[199, 10]]);

var root_9 = $.add_locations($.from_html(`<div class="min-h-dvh bg-fond text-encre"><header class="sticky top-0 z-30 border-b border-bordure ui-verre"><div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3 lg:px-8"><a class="flex items-center gap-2.5 font-semibold tracking-tight" href="/hote"><!> <span class="leading-tight"><span class="block text-sm font-semibold"> </span> <span class="block text-[0.65rem] font-medium uppercase tracking-[0.14em] text-encre-faine">Espace hôte</span></span></a> <span class="ui-badge hidden sm:inline-flex"> </span> <nav class="order-last w-full md:order-none md:w-auto md:flex-1" aria-label="Navigation principale"><ul class="flex flex-wrap items-center gap-1"><!> <li class="shrink-0"><details class="ui-menu"><summary>Plus</summary> <div class="ui-menu-panneau"><div class="ui-menu-groupe"><p class="ui-menu-titre">Exploitation</p> <!></div> <div class="ui-menu-groupe"><p class="ui-menu-titre">Relation voyageur</p> <!></div> <div class="ui-menu-groupe"><p class="ui-menu-titre">Conformité</p> <!></div> <!></div></details></li></ul></nav> <div class="ml-auto flex items-center gap-2"><!> <a class="ui-bouton ui-bouton--fantome ui-bouton--petit" href="/">Voir le site</a> <form method="POST" action="/logout"><button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">Quitter</button></form></div></div></header> <!></div>`), _layout[$.FILENAME], [
	[
		88,
		0,
		[
			[
				89,
				2,
				[
					[
						90,
						4,
						[
							[91, 6, [[103, 8, [[104, 10], [105, 10]]]]],
							[111, 6],
							[
								115,
								6,
								[
									[
										119,
										8,
										[
											[
												131,
												10,
												[
													[
														132,
														12,
														[
															[133, 14],
															[
																140,
																14,
																[
																	[141, 16, [[142, 18]]],
																	[153, 16, [[154, 18]]],
																	[165, 16, [[166, 18]]]
																]
															]
														]
													]
												]
											]
										]
									]
								]
							],
							[197, 6, [[203, 8], [204, 8, [[205, 10]]]]]
						]
					]
				]
			]
		]
	]
]);

function _layout($$anchor, $$props) {
	$.check_target(new.target);
	$.push($$props, true, _layout);

	const principaux = [
		{ href: "/hote", libelle: "Tableau de bord" },
		{ href: "/hote/logements", libelle: "Logements" },
		{ href: "/hote/planning", libelle: "Planning" },
		{ href: "/hote/menage", libelle: "Ménage" },
		{ href: "/hote/factures", libelle: "Factures" },
		{ href: "/hote/compta", libelle: "Compta" },
		{ href: "/hote/messages", libelle: "Messages" }
	];

	const operations = [
		{ href: "/hote/prix", libelle: "Prix" },
		{ href: "/hote/etats-des-lieux", libelle: "États des lieux" },
		{ href: "/hote/entretien", libelle: "Entretien" },
		{ href: "/hote/missions", libelle: "Missions" },
		{ href: "/hote/dispatch", libelle: "Dispatch" },
		{ href: "/hote/cautions", libelle: "Cautions" },
		{ href: "/hote/extras", libelle: "Extras" },
		{ href: "/hote/stocks", libelle: "Stocks" },
		{ href: "/hote/inventaire", libelle: "Inventaire" },
		{ href: "/hote/logements", libelle: "Guides logement" }
	];

	const relation = [
		{ href: "/hote/assistant", libelle: "Assistant" },
		{ href: "/hote/avis", libelle: "Avis" },
		{ href: "/hote/questionnaires", libelle: "Questionnaires" },
		{ href: "/hote/objets-trouves", libelle: "Objets trouvés" },
		{ href: "/hote/sinistres", libelle: "Sinistres" },
		{ href: "/hote/tranquillite", libelle: "Tranquillité" },
		{ href: "/hote/tourisme", libelle: "Tourisme" },
		{ href: "/hote/phrases", libelle: "Phrases types" }
	];

	const conformite = [
		{ href: "/hote/annonce", libelle: "Annonce" },
		{ href: "/hote/onboarding", libelle: "Onboarding" },
		{ href: "/hote/formation", libelle: "Formation" },
		{ href: "/hote/police", libelle: "Police" },
		{ href: "/hote/rgpd", libelle: "RGPD" }
	];

	const administration = [
		{ href: "/hote/recherche", libelle: "Recherche" },
		{ href: "/hote/acces", libelle: "Accès" },
		{ href: "/hote/proprietaires", libelle: "Propriétaires" },
		{ href: "/hote/entite", libelle: "Entité" },
		{ href: "/hote/integrations", libelle: "Intégrations" },
		{ href: "/hote/audit", libelle: "Audit" },
		{ href: "/hote/utilisateurs", libelle: "Utilisateurs" },
		{ href: "/hote/securite", libelle: "Sécurité" }
	];

	const roleLibelle = {
		admin: "Administrateur",
		hote: "Hôte",
		comptable: "Comptable",
		presta: "Prestataire",
		proprietaire: "Propriétaire",
		commercial: "Commercial",
		super_admin: "Super-admin"
	};

	const estAdmin = $.tag($.derived(() => $.strict_equals($$props.data.utilisateur.role, "admin") || $$props.data.superAdmin), 'estAdmin');

	const actif = (href) => $.strict_equals(href, "/hote")
		? $.strict_equals($$props.data.chemin, href)
		: $$props.data.chemin.startsWith(href);

	const groupeActif = (liens) => liens.some((lien) => actif(lien.href));
	const plusActif = $.tag($.derived(() => groupeActif(operations) || groupeActif(relation) || groupeActif(conformite) || $.get(estAdmin) && groupeActif(administration)), 'plusActif');
	var $$exports = { ...$.legacy_api() };
	var div = root_9();
	var header = $.child(div);
	var div_1 = $.child(header);
	var a = $.child(div_1);
	var node = $.child(a);

	{
		var consequent = ($$anchor) => {
			var img = root();

			$.template_effect(() => $.set_attribute(img, 'src', $$props.data.apparence.identite.logoUrl));
			$.append($$anchor, img);
		};

		var alternate = ($$anchor) => {
			var span = root_1();
			var text = $.only_child(span, true);

			$.template_effect(($0) => $.set_text(text, $0), [() => $$props.data.apparence.identite.nom.slice(0, 1)]);
			$.append($$anchor, span);
		};

		$.add_svelte_meta(
			() => $.if(node, ($$render) => {
				if ($$props.data.apparence.identite.logoUrl) $$render(consequent); else $$render(alternate, -1);
			}),
			'if',
			_layout,
			92,
			8
		);
	}

	var span_1 = $.sibling(node, 2);
	var span_2 = $.child(span_1);
	var text_1 = $.only_child(span_2, true);

	$.next(2);
	$.reset(span_1);
	$.reset(a);

	var span_3 = $.sibling(a, 2);
	var text_2 = $.only_child(span_3, true);
	var nav = $.sibling(span_3, 2);
	var ul = $.child(nav);
	var node_1 = $.child(ul);

	$.add_svelte_meta(
		() => $.each(node_1, 17, () => principaux, (lien) => lien.href, ($$anchor, lien) => {
			var li = root_2();
			var a_1 = $.child(li);
			var text_3 = $.only_child(a_1, true);

			$.reset(li);

			$.template_effect(
				($0) => {
					$.set_attribute(a_1, 'href', $.get(lien).href);
					$.set_attribute(a_1, 'aria-current', $0);
					$.set_text(text_3, $.get(lien).libelle);
				},
				[() => actif($.get(lien).href) ? "page" : undefined]
			);

			$.append($$anchor, li);
		}),
		'each',
		_layout,
		120,
		10
	);

	var li_1 = $.sibling(node_1, 2);
	var details = $.child(li_1);
	var summary = $.child(details);
	var div_2 = $.sibling(summary, 2);
	var div_3 = $.child(div_2);
	var node_2 = $.sibling($.child(div_3), 2);

	$.add_svelte_meta(
		() => $.each(node_2, 17, () => operations, (lien) => lien.href, ($$anchor, lien) => {
			var a_2 = root_3();
			var text_4 = $.only_child(a_2, true);

			$.template_effect(
				($0) => {
					$.set_attribute(a_2, 'href', $.get(lien).href);
					$.set_attribute(a_2, 'aria-current', $0);
					$.set_text(text_4, $.get(lien).libelle);
				},
				[() => actif($.get(lien).href) ? "page" : undefined]
			);

			$.append($$anchor, a_2);
		}),
		'each',
		_layout,
		143,
		18
	);

	$.reset(div_3);

	var div_4 = $.sibling(div_3, 2);
	var node_3 = $.sibling($.child(div_4), 2);

	$.add_svelte_meta(
		() => $.each(node_3, 17, () => relation, (lien) => lien.href, ($$anchor, lien) => {
			var a_3 = root_4();
			var text_5 = $.only_child(a_3, true);

			$.template_effect(
				($0) => {
					$.set_attribute(a_3, 'href', $.get(lien).href);
					$.set_attribute(a_3, 'aria-current', $0);
					$.set_text(text_5, $.get(lien).libelle);
				},
				[() => actif($.get(lien).href) ? "page" : undefined]
			);

			$.append($$anchor, a_3);
		}),
		'each',
		_layout,
		155,
		18
	);

	$.reset(div_4);

	var div_5 = $.sibling(div_4, 2);
	var node_4 = $.sibling($.child(div_5), 2);

	$.add_svelte_meta(
		() => $.each(node_4, 17, () => conformite, (lien) => lien.href, ($$anchor, lien) => {
			var a_4 = root_5();
			var text_6 = $.only_child(a_4, true);

			$.template_effect(
				($0) => {
					$.set_attribute(a_4, 'href', $.get(lien).href);
					$.set_attribute(a_4, 'aria-current', $0);
					$.set_text(text_6, $.get(lien).libelle);
				},
				[() => actif($.get(lien).href) ? "page" : undefined]
			);

			$.append($$anchor, a_4);
		}),
		'each',
		_layout,
		167,
		18
	);

	$.reset(div_5);

	var node_5 = $.sibling(div_5, 2);

	{
		var consequent_1 = ($$anchor) => {
			var div_6 = root_7();
			var node_6 = $.sibling($.child(div_6), 2);

			$.add_svelte_meta(
				() => $.each(node_6, 17, () => administration, (lien) => lien.href, ($$anchor, lien) => {
					var a_5 = root_6();
					var text_7 = $.only_child(a_5, true);

					$.template_effect(
						($0) => {
							$.set_attribute(a_5, 'href', $.get(lien).href);
							$.set_attribute(a_5, 'aria-current', $0);
							$.set_text(text_7, $.get(lien).libelle);
						},
						[() => actif($.get(lien).href) ? "page" : undefined]
					);

					$.append($$anchor, a_5);
				}),
				'each',
				_layout,
				180,
				20
			);

			$.reset(div_6);
			$.append($$anchor, div_6);
		};

		$.add_svelte_meta(
			() => $.if(node_5, ($$render) => {
				if ($.get(estAdmin)) $$render(consequent_1);
			}),
			'if',
			_layout,
			177,
			16
		);
	}

	$.reset(div_2);
	$.reset(details);
	$.reset(li_1);
	$.reset(ul);
	$.reset(nav);

	var div_7 = $.sibling(nav, 2);
	var node_7 = $.child(div_7);

	{
		var consequent_2 = ($$anchor) => {
			var a_6 = root_8();

			$.append($$anchor, a_6);
		};

		$.add_svelte_meta(
			() => $.if(node_7, ($$render) => {
				if ($$props.data.superAdmin) $$render(consequent_2);
			}),
			'if',
			_layout,
			198,
			8
		);
	}

	$.next(4);
	$.reset(div_7);
	$.reset(div_1);
	$.reset(header);

	var node_8 = $.sibling(header, 2);

	$.add_svelte_meta(() => $.snippet(node_8, () => $$props.children), 'render', _layout, 213, 2);
	$.reset(div);

	$.template_effect(() => {
		$.set_text(text_1, $$props.data.apparence.identite.nom);
		$.set_text(text_2, roleLibelle[$$props.data.utilisateur.role] ?? $$props.data.utilisateur.role);
		$.set_class(summary, 1, `ui-bouton ui-bouton--petit ${$.get(plusActif) ? 'ui-bouton--primaire' : 'ui-bouton--secondaire'}`);
	});

	$.append($$anchor, div);

	return $.pop($$exports);
}

if (import.meta.hot) {
	_layout = $.hmr(_layout);

	import.meta.hot.acceptExports(["default"],(module) => {
		_layout[$.HMR].update(module.default);
	});
}

export default _layout;
//# sourceMappingURL=data:application/json;base64,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Ozs7O09BYUQsS0FBSSxBQUFEO2tDQUFILEtBQUksQUFBRDs7O21DQUVLLGNBQWMsR0FBSSxJQUFJLEtBQUUsSUFBSSxDQUFDLElBQUksYUFBZixJQUFJO1NBQzFCOytCQUFBOzs7O3VCQUFBLGFBRU8sVUFBSSxFQUFDLElBQUk7dUJBRmhCOzBCQUtFLFVBQUksRUFBQyxPQUFPOzthQUZDLEtBQUssQ0FBQyxVQUFJLEVBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxHQUFHLFNBQVM7Ozt3QkFIcEQ7Ozs7Ozs7O1dBSEosS0FBSSxBQUFEO3NCQUFILEtBQUksQUFBRDs7Ozs7Y0FERCxRQUFROzs7Ozs7Ozs7U0FyQ2QsS0FBSSxBQUFEO1NBUkwsT0FBTztTQURULElBQUcsQUFBRDtTQVpKLEVBQUU7U0FKSjs7S0FrRkEsS0FBSSxBQUFELGFBbEZIO3NCQWtGQSxLQUFJLEFBQUQ7Ozs7T0FFQyxHQUFFLEFBQUQ7O3NCQUFELEdBQUUsQUFBRDs7Ozs7UUFEQyxhQUFLLFVBQVU7Ozs7Ozs7Ozs7U0FEckIsS0FBSSxBQUFEO1NBM0dMLEtBQUksQUFBRDtTQURMLE1BQU07O3dCQUFOLE1BQU07OztTQURSLEdBQUc7OztxQkFnQmlELGFBQUssU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHO3FCQVF2RSxXQUFXLENBQUMsYUFBSyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksYUFBSyxXQUFXLENBQUMsSUFBSTtjQXFCckQsMENBQ29DLG1CQUMvQixxQkFBb0IsR0FDcEIsdUJBQXVCOzs7b0JBaEQxQyxHQUFHOzs7QUFGSSIsIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiK2xheW91dC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdCBsYW5nPVwidHNcIj5cbiAgaW1wb3J0IHR5cGUgeyBMYXlvdXREYXRhIH0gZnJvbSBcIi4vJHR5cGVzXCI7XG4gIGltcG9ydCB0eXBlIHsgU25pcHBldCB9IGZyb20gXCJzdmVsdGVcIjtcblxuICBsZXQge1xuICAgIGRhdGEsXG4gICAgY2hpbGRyZW4sXG4gIH06IHtcbiAgICBkYXRhOiBMYXlvdXREYXRhO1xuICAgIGNoaWxkcmVuOiBTbmlwcGV0O1xuICB9ID0gJHByb3BzKCk7XG5cbiAgY29uc3QgcHJpbmNpcGF1eCA9IFtcbiAgICB7IGhyZWY6IFwiL2hvdGVcIiwgbGliZWxsZTogXCJUYWJsZWF1IGRlIGJvcmRcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9sb2dlbWVudHNcIiwgbGliZWxsZTogXCJMb2dlbWVudHNcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9wbGFubmluZ1wiLCBsaWJlbGxlOiBcIlBsYW5uaW5nXCIgfSxcbiAgICB7IGhyZWY6IFwiL2hvdGUvbWVuYWdlXCIsIGxpYmVsbGU6IFwiTcOpbmFnZVwiIH0sXG4gICAgeyBocmVmOiBcIi9ob3RlL2ZhY3R1cmVzXCIsIGxpYmVsbGU6IFwiRmFjdHVyZXNcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9jb21wdGFcIiwgbGliZWxsZTogXCJDb21wdGFcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9tZXNzYWdlc1wiLCBsaWJlbGxlOiBcIk1lc3NhZ2VzXCIgfSxcbiAgXTtcblxuICBjb25zdCBvcGVyYXRpb25zID0gW1xuICAgIHsgaHJlZjogXCIvaG90ZS9wcml4XCIsIGxpYmVsbGU6IFwiUHJpeFwiIH0sXG4gICAgeyBocmVmOiBcIi9ob3RlL2V0YXRzLWRlcy1saWV1eFwiLCBsaWJlbGxlOiBcIsOJdGF0cyBkZXMgbGlldXhcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9lbnRyZXRpZW5cIiwgbGliZWxsZTogXCJFbnRyZXRpZW5cIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9taXNzaW9uc1wiLCBsaWJlbGxlOiBcIk1pc3Npb25zXCIgfSxcbiAgICB7IGhyZWY6IFwiL2hvdGUvZGlzcGF0Y2hcIiwgbGliZWxsZTogXCJEaXNwYXRjaFwiIH0sXG4gICAgeyBocmVmOiBcIi9ob3RlL2NhdXRpb25zXCIsIGxpYmVsbGU6IFwiQ2F1dGlvbnNcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9leHRyYXNcIiwgbGliZWxsZTogXCJFeHRyYXNcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9zdG9ja3NcIiwgbGliZWxsZTogXCJTdG9ja3NcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9pbnZlbnRhaXJlXCIsIGxpYmVsbGU6IFwiSW52ZW50YWlyZVwiIH0sXG4gICAgeyBocmVmOiBcIi9ob3RlL2xvZ2VtZW50c1wiLCBsaWJlbGxlOiBcIkd1aWRlcyBsb2dlbWVudFwiIH0sXG4gIF07XG5cbiAgY29uc3QgcmVsYXRpb24gPSBbXG4gICAgeyBocmVmOiBcIi9ob3RlL2Fzc2lzdGFudFwiLCBsaWJlbGxlOiBcIkFzc2lzdGFudFwiIH0sXG4gICAgeyBocmVmOiBcIi9ob3RlL2F2aXNcIiwgbGliZWxsZTogXCJBdmlzXCIgfSxcbiAgICB7IGhyZWY6IFwiL2hvdGUvcXVlc3Rpb25uYWlyZXNcIiwgbGliZWxsZTogXCJRdWVzdGlvbm5haXJlc1wiIH0sXG4gICAgeyBocmVmOiBcIi9ob3RlL29iamV0cy10cm91dmVzXCIsIGxpYmVsbGU6IFwiT2JqZXRzIHRyb3V2w6lzXCIgfSxcbiAgICB7IGhyZWY6IFwiL2hvdGUvc2luaXN0cmVzXCIsIGxpYmVsbGU6IFwiU2luaXN0cmVzXCIgfSxcbiAgICB7IGhyZWY6IFwiL2hvdGUvdHJhbnF1aWxsaXRlXCIsIGxpYmVsbGU6IFwiVHJhbnF1aWxsaXTDqVwiIH0sXG4gICAgeyBocmVmOiBcIi9ob3RlL3RvdXJpc21lXCIsIGxpYmVsbGU6IFwiVG91cmlzbWVcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9waHJhc2VzXCIsIGxpYmVsbGU6IFwiUGhyYXNlcyB0eXBlc1wiIH0sXG4gIF07XG5cbiAgY29uc3QgY29uZm9ybWl0ZSA9IFtcbiAgICB7IGhyZWY6IFwiL2hvdGUvYW5ub25jZVwiLCBsaWJlbGxlOiBcIkFubm9uY2VcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9vbmJvYXJkaW5nXCIsIGxpYmVsbGU6IFwiT25ib2FyZGluZ1wiIH0sXG4gICAgeyBocmVmOiBcIi9ob3RlL2Zvcm1hdGlvblwiLCBsaWJlbGxlOiBcIkZvcm1hdGlvblwiIH0sXG4gICAgeyBocmVmOiBcIi9ob3RlL3BvbGljZVwiLCBsaWJlbGxlOiBcIlBvbGljZVwiIH0sXG4gICAgeyBocmVmOiBcIi9ob3RlL3JncGRcIiwgbGliZWxsZTogXCJSR1BEXCIgfSxcbiAgXTtcblxuICBjb25zdCBhZG1pbmlzdHJhdGlvbiA9IFtcbiAgICB7IGhyZWY6IFwiL2hvdGUvcmVjaGVyY2hlXCIsIGxpYmVsbGU6IFwiUmVjaGVyY2hlXCIgfSxcbiAgICB7IGhyZWY6IFwiL2hvdGUvYWNjZXNcIiwgbGliZWxsZTogXCJBY2PDqHNcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9wcm9wcmlldGFpcmVzXCIsIGxpYmVsbGU6IFwiUHJvcHJpw6l0YWlyZXNcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9lbnRpdGVcIiwgbGliZWxsZTogXCJFbnRpdMOpXCIgfSxcbiAgICB7IGhyZWY6IFwiL2hvdGUvaW50ZWdyYXRpb25zXCIsIGxpYmVsbGU6IFwiSW50w6lncmF0aW9uc1wiIH0sXG4gICAgeyBocmVmOiBcIi9ob3RlL2F1ZGl0XCIsIGxpYmVsbGU6IFwiQXVkaXRcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS91dGlsaXNhdGV1cnNcIiwgbGliZWxsZTogXCJVdGlsaXNhdGV1cnNcIiB9LFxuICAgIHsgaHJlZjogXCIvaG90ZS9zZWN1cml0ZVwiLCBsaWJlbGxlOiBcIlPDqWN1cml0w6lcIiB9LFxuICBdO1xuXG4gIGNvbnN0IHJvbGVMaWJlbGxlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgIGFkbWluOiBcIkFkbWluaXN0cmF0ZXVyXCIsXG4gICAgaG90ZTogXCJIw7R0ZVwiLFxuICAgIGNvbXB0YWJsZTogXCJDb21wdGFibGVcIixcbiAgICBwcmVzdGE6IFwiUHJlc3RhdGFpcmVcIixcbiAgICBwcm9wcmlldGFpcmU6IFwiUHJvcHJpw6l0YWlyZVwiLFxuICAgIGNvbW1lcmNpYWw6IFwiQ29tbWVyY2lhbFwiLFxuICAgIHN1cGVyX2FkbWluOiBcIlN1cGVyLWFkbWluXCIsXG4gIH07XG5cbiAgY29uc3QgZXN0QWRtaW4gPSAkZGVyaXZlZChkYXRhLnV0aWxpc2F0ZXVyLnJvbGUgPT09IFwiYWRtaW5cIiB8fCBkYXRhLnN1cGVyQWRtaW4pO1xuICBjb25zdCBhY3RpZiA9IChocmVmOiBzdHJpbmcpID0+XG4gICAgaHJlZiA9PT0gXCIvaG90ZVwiID8gZGF0YS5jaGVtaW4gPT09IGhyZWYgOiBkYXRhLmNoZW1pbi5zdGFydHNXaXRoKGhyZWYpO1xuICBjb25zdCBncm91cGVBY3RpZiA9IChsaWVuczogeyBocmVmOiBzdHJpbmcgfVtdKSA9PiBsaWVucy5zb21lKChsaWVuKSA9PiBhY3RpZihsaWVuLmhyZWYpKTtcbiAgY29uc3QgcGx1c0FjdGlmID0gJGRlcml2ZWQoXG4gICAgZ3JvdXBlQWN0aWYob3BlcmF0aW9ucykgfHxcbiAgICAgIGdyb3VwZUFjdGlmKHJlbGF0aW9uKSB8fFxuICAgICAgZ3JvdXBlQWN0aWYoY29uZm9ybWl0ZSkgfHxcbiAgICAgIChlc3RBZG1pbiAmJiBncm91cGVBY3RpZihhZG1pbmlzdHJhdGlvbikpLFxuICApO1xuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJtaW4taC1kdmggYmctZm9uZCB0ZXh0LWVuY3JlXCI+XG4gIDxoZWFkZXIgY2xhc3M9XCJzdGlja3kgdG9wLTAgei0zMCBib3JkZXItYiBib3JkZXItYm9yZHVyZSB1aS12ZXJyZVwiPlxuICAgIDxkaXYgY2xhc3M9XCJteC1hdXRvIGZsZXggbWF4LXctN3hsIGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTMgcHgtNSBweS0zIGxnOnB4LThcIj5cbiAgICAgIDxhIGNsYXNzPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSBmb250LXNlbWlib2xkIHRyYWNraW5nLXRpZ2h0XCIgaHJlZj1cIi9ob3RlXCI+XG4gICAgICAgIHsjaWYgZGF0YS5hcHBhcmVuY2UuaWRlbnRpdGUubG9nb1VybH1cbiAgICAgICAgICA8aW1nXG4gICAgICAgICAgICBjbGFzcz1cInNpemUtOCByb3VuZGVkLWxnIG9iamVjdC1jb250YWluXCJcbiAgICAgICAgICAgIHNyYz17ZGF0YS5hcHBhcmVuY2UuaWRlbnRpdGUubG9nb1VybH1cbiAgICAgICAgICAgIGFsdD1cIlwiXG4gICAgICAgICAgLz5cbiAgICAgICAgezplbHNlfVxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZ3JpZCBzaXplLTggcGxhY2UtaXRlbXMtY2VudGVyIHJvdW5kZWQtbGcgYmctYWNjZW50IHRleHQtc20gZm9udC1ibGFjayB0ZXh0LXN1ci1hY2NlbnRcIj5cbiAgICAgICAgICAgIHtkYXRhLmFwcGFyZW5jZS5pZGVudGl0ZS5ub20uc2xpY2UoMCwgMSl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICB7L2lmfVxuICAgICAgICA8c3BhbiBjbGFzcz1cImxlYWRpbmctdGlnaHRcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImJsb2NrIHRleHQtc20gZm9udC1zZW1pYm9sZFwiPntkYXRhLmFwcGFyZW5jZS5pZGVudGl0ZS5ub219PC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYmxvY2sgdGV4dC1bMC42NXJlbV0gZm9udC1tZWRpdW0gdXBwZXJjYXNlIHRyYWNraW5nLVswLjE0ZW1dIHRleHQtZW5jcmUtZmFpbmVcIj5cbiAgICAgICAgICAgIEVzcGFjZSBow7R0ZVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9hPlxuXG4gICAgICA8c3BhbiBjbGFzcz1cInVpLWJhZGdlIGhpZGRlbiBzbTppbmxpbmUtZmxleFwiPlxuICAgICAgICB7cm9sZUxpYmVsbGVbZGF0YS51dGlsaXNhdGV1ci5yb2xlXSA/PyBkYXRhLnV0aWxpc2F0ZXVyLnJvbGV9XG4gICAgICA8L3NwYW4+XG5cbiAgICAgIDxuYXZcbiAgICAgICAgY2xhc3M9XCJvcmRlci1sYXN0IHctZnVsbCBtZDpvcmRlci1ub25lIG1kOnctYXV0byBtZDpmbGV4LTFcIlxuICAgICAgICBhcmlhLWxhYmVsPVwiTmF2aWdhdGlvbiBwcmluY2lwYWxlXCJcbiAgICAgID5cbiAgICAgICAgPHVsIGNsYXNzPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgeyNlYWNoIHByaW5jaXBhdXggYXMgbGllbiAobGllbi5ocmVmKX1cbiAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgICBjbGFzcz1cInVpLW5hdi1saWVuIHdoaXRlc3BhY2Utbm93cmFwXCJcbiAgICAgICAgICAgICAgICBocmVmPXtsaWVuLmhyZWZ9XG4gICAgICAgICAgICAgICAgYXJpYS1jdXJyZW50PXthY3RpZihsaWVuLmhyZWYpID8gXCJwYWdlXCIgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7bGllbi5saWJlbGxlfVxuICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgIHsvZWFjaH1cbiAgICAgICAgICA8bGkgY2xhc3M9XCJzaHJpbmstMFwiPlxuICAgICAgICAgICAgPGRldGFpbHMgY2xhc3M9XCJ1aS1tZW51XCI+XG4gICAgICAgICAgICAgIDxzdW1tYXJ5XG4gICAgICAgICAgICAgICAgY2xhc3M9XCJ1aS1ib3V0b24gdWktYm91dG9uLS1wZXRpdCB7cGx1c0FjdGlmXG4gICAgICAgICAgICAgICAgICA/ICd1aS1ib3V0b24tLXByaW1haXJlJ1xuICAgICAgICAgICAgICAgICAgOiAndWktYm91dG9uLS1zZWNvbmRhaXJlJ31cIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgUGx1c1xuICAgICAgICAgICAgICA8L3N1bW1hcnk+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ1aS1tZW51LXBhbm5lYXVcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidWktbWVudS1ncm91cGVcIj5cbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwidWktbWVudS10aXRyZVwiPkV4cGxvaXRhdGlvbjwvcD5cbiAgICAgICAgICAgICAgICAgIHsjZWFjaCBvcGVyYXRpb25zIGFzIGxpZW4gKGxpZW4uaHJlZil9XG4gICAgICAgICAgICAgICAgICAgIDxhXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ1aS1tZW51LWxpZW5cIlxuICAgICAgICAgICAgICAgICAgICAgIGhyZWY9e2xpZW4uaHJlZn1cbiAgICAgICAgICAgICAgICAgICAgICBhcmlhLWN1cnJlbnQ9e2FjdGlmKGxpZW4uaHJlZikgPyBcInBhZ2VcIiA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIHtsaWVuLmxpYmVsbGV9XG4gICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgIHsvZWFjaH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidWktbWVudS1ncm91cGVcIj5cbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwidWktbWVudS10aXRyZVwiPlJlbGF0aW9uIHZveWFnZXVyPC9wPlxuICAgICAgICAgICAgICAgICAgeyNlYWNoIHJlbGF0aW9uIGFzIGxpZW4gKGxpZW4uaHJlZil9XG4gICAgICAgICAgICAgICAgICAgIDxhXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ1aS1tZW51LWxpZW5cIlxuICAgICAgICAgICAgICAgICAgICAgIGhyZWY9e2xpZW4uaHJlZn1cbiAgICAgICAgICAgICAgICAgICAgICBhcmlhLWN1cnJlbnQ9e2FjdGlmKGxpZW4uaHJlZikgPyBcInBhZ2VcIiA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIHtsaWVuLmxpYmVsbGV9XG4gICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgIHsvZWFjaH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidWktbWVudS1ncm91cGVcIj5cbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwidWktbWVudS10aXRyZVwiPkNvbmZvcm1pdMOpPC9wPlxuICAgICAgICAgICAgICAgICAgeyNlYWNoIGNvbmZvcm1pdGUgYXMgbGllbiAobGllbi5ocmVmKX1cbiAgICAgICAgICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInVpLW1lbnUtbGllblwiXG4gICAgICAgICAgICAgICAgICAgICAgaHJlZj17bGllbi5ocmVmfVxuICAgICAgICAgICAgICAgICAgICAgIGFyaWEtY3VycmVudD17YWN0aWYobGllbi5ocmVmKSA/IFwicGFnZVwiIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAge2xpZW4ubGliZWxsZX1cbiAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgey9lYWNofVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsjaWYgZXN0QWRtaW59XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidWktbWVudS1ncm91cGVcIj5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3M9XCJ1aS1tZW51LXRpdHJlXCI+QWRtaW5pc3RyYXRpb248L3A+XG4gICAgICAgICAgICAgICAgICAgIHsjZWFjaCBhZG1pbmlzdHJhdGlvbiBhcyBsaWVuIChsaWVuLmhyZWYpfVxuICAgICAgICAgICAgICAgICAgICAgIDxhXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInVpLW1lbnUtbGllblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBocmVmPXtsaWVuLmhyZWZ9XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWN1cnJlbnQ9e2FjdGlmKGxpZW4uaHJlZikgPyBcInBhZ2VcIiA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7bGllbi5saWJlbGxlfVxuICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgey9lYWNofVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgey9pZn1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2RldGFpbHM+XG4gICAgICAgICAgPC9saT5cbiAgICAgICAgPC91bD5cbiAgICAgIDwvbmF2PlxuXG4gICAgICA8ZGl2IGNsYXNzPVwibWwtYXV0byBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICB7I2lmIGRhdGEuc3VwZXJBZG1pbn1cbiAgICAgICAgICA8YSBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLWZhbnRvbWUgdWktYm91dG9uLS1wZXRpdFwiIGhyZWY9XCIvc3VwZXJ2aXNpb24vYXBwYXJlbmNlXCI+XG4gICAgICAgICAgICBBcHBhcmVuY2VcbiAgICAgICAgICA8L2E+XG4gICAgICAgIHsvaWZ9XG4gICAgICAgIDxhIGNsYXNzPVwidWktYm91dG9uIHVpLWJvdXRvbi0tZmFudG9tZSB1aS1ib3V0b24tLXBldGl0XCIgaHJlZj1cIi9cIj5Wb2lyIGxlIHNpdGU8L2E+XG4gICAgICAgIDxmb3JtIG1ldGhvZD1cIlBPU1RcIiBhY3Rpb249XCIvbG9nb3V0XCI+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInVpLWJvdXRvbiB1aS1ib3V0b24tLWZhbnRvbWUgdWktYm91dG9uLS1wZXRpdFwiIHR5cGU9XCJzdWJtaXRcIj5cbiAgICAgICAgICAgIFF1aXR0ZXJcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9mb3JtPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvaGVhZGVyPlxuXG4gIHtAcmVuZGVyIGNoaWxkcmVuKCl9XG48L2Rpdj5cbiJdLCJmaWxlIjoiQzovVXNlcnMvanVsaWUvRGVza3RvcC9Mb2NhdGlvbiBjb3VydGUgZHVyZWUvdjIvc3JjL3JvdXRlcy9ob3RlLytsYXlvdXQuc3ZlbHRlIn0=