(function(){
  const C=window.SpeedArtiRoofCatalog;
  if(!C||!Array.isArray(C.products)) return;
  const battenCorrections={
    'edilians-standard-14-vario':{min:2.86,mean:3.15,max:3.50,gauge_min_mm:285,gauge_mean_mm:317,gauge_max_mm:350,source:'EDILIANS Encyclopédie 2026 — STANDARD 14 VARIO'},
    'edilians-arboise-ecaille':{min:4.54,mean:4.54,max:4.54,gauge_min_mm:220,gauge_mean_mm:220,gauge_max_mm:220,source:'EDILIANS Encyclopédie 2026 — ARBOISE ÉCAILLE'},
    'edilians-beauvoise-graphite':{min:4.08,mean:4.08,max:4.08,gauge_min_mm:245,gauge_mean_mm:245,gauge_max_mm:245,source:'EDILIANS Encyclopédie 2026 — BEAUVOISE GRAPHITE'},
    'edilians-plate-ecaille-pressee-17x27':{min:10.00,mean:10.53,max:11.11,gauge_min_mm:90,gauge_mean_mm:95,gauge_max_mm:100,source:'EDILIANS Encyclopédie 2026 — PLATE ÉCAILLE PRESSÉE 17X27'},
    'edilians-plate-elixir-16x27':{min:10.53,mean:11.11,max:11.70,gauge_min_mm:85,gauge_mean_mm:90,gauge_max_mm:95,source:'EDILIANS Encyclopédie 2026 — PLATE ELIXIR 16X27'},
    'edilians-plate-rectangulaire-pressee-17x27':{min:10.00,mean:10.53,max:11.11,gauge_min_mm:90,gauge_mean_mm:95,gauge_max_mm:100,source:'EDILIANS Encyclopédie 2026 — PLATE RECTANGULAIRE PRESSÉE 17X27'},
    'edilians-plate-restauration-16x27':{min:10.53,mean:11.11,max:11.70,gauge_min_mm:85,gauge_mean_mm:90,gauge_max_mm:95,source:'EDILIANS Encyclopédie 2026 — PLATE RESTAURATION 16X27'},
    'edilians-plate-tradition-17x27':{min:10.00,mean:10.53,max:11.11,gauge_min_mm:90,gauge_mean_mm:95,gauge_max_mm:100,source:'EDILIANS Encyclopédie 2026 — PLATE TRADITION 17X27'},
    'terreal-double-canal-languedoc-aspect-vieux-pays':{min:2.5,mean:2.5,max:2.5,source:'TERREAL Guide Canal & Grands Moules du Sud — DCL aspect Vieux Pays'},
    'terreal-cote-de-beaune':{min:2.5,mean:2.5,max:2.5,source:'TERREAL Guide Grands Moules du Nord — Côte de Beaune'},
    'terreal-cote-de-nuits-pv':{min:2.9,mean:2.9,max:2.9,source:'TERREAL Guide Grands Moules du Nord — Côte de Nuits PV'},
    'terreal-losangee':{min:2.7,mean:2.9,max:3.1,source:'TERREAL Guide Grands Moules du Nord — Losangée'},
    'terreal-montchanin-losangee':{min:2.7,mean:2.9,max:3.1,source:'TERREAL Guide Grands Moules du Nord — Montchanin Losangée'},
    'terreal-tuile-a-cote-universelle':{min:2.7,mean:2.9,max:3.1,source:'TERREAL Guide Grands Moules du Nord — Tuile à Côte Universelle'},
    'terreal-volnay-pv':{min:2.5,mean:2.5,max:2.5,source:'TERREAL Guide Grands Moules du Nord — Volnay PV'},
    'terreal-volnay-pv-version-tandem':{min:2.5,mean:2.5,max:2.5,source:'TERREAL Guide Grands Moules du Nord — Volnay PV Tandem'},
    'terreal-double-canal-languedoc':{min:2.5,mean:2.5,max:2.5,source:'TERREAL Guide Canal & Grands Moules du Sud — DCL'},
    'terreal-heritage-canal':{min:2.40,mean:2.46,max:2.53,gauge_min_mm:396,gauge_mean_mm:406,gauge_max_mm:416,source:'TERREAL Guide Canal & Grands Moules du Sud — Héritage Canal, calcul depuis pureau 39,6–41,6 cm'},
    'terreal-romane-azur':{min:2.23,mean:2.23,max:2.23,source:'TERREAL Guide Canal & Grands Moules du Sud — Romane Azur'},
    'terreal-romane-reno':{min:2.8,mean:2.8,max:2.8,source:'TERREAL Guide Canal & Grands Moules du Sud — Romane Réno'},
    'terreal-rully':{min:6.25,mean:6.25,max:6.25,gauge_min_mm:160,gauge_mean_mm:160,gauge_max_mm:160,source:'TERREAL Guide Grands Moules du Nord — Rully'},
    'edilians-mediane-plus':{min:2.66,mean:2.72,max:2.78,gauge_min_mm:360,gauge_mean_mm:368,gauge_max_mm:376,source:'EDILIANS Encyclopédie 2026 — MÉDIANE PLUS Gélis'},
    'edilians-double-tenord':{min:3.70,mean:3.85,max:4.00,gauge_min_mm:250,gauge_mean_mm:260,gauge_max_mm:270,source:'EDILIANS Encyclopédie 2026 — DOUBLE TÉNORD'},
    'edilians-hp-13-evolutive':{min:2.85,mean:3.17,max:3.57,gauge_min_mm:280,gauge_mean_mm:315,gauge_max_mm:350,source:'EDILIANS Encyclopédie 2026 — HP 13 ÉVOLUTIVE'},
    'edilians-losangee-ste-foy':{min:2.63,mean:2.81,max:3.03,gauge_min_mm:330,gauge_mean_mm:355,gauge_max_mm:380,source:'EDILIANS Encyclopédie 2026 — LOSANGÉE Ste Foy'},
    'edilians-plein-sud-reabilis':{min:2.47,mean:2.55,max:2.63,gauge_min_mm:380,gauge_mean_mm:392,gauge_max_mm:404,source:'EDILIANS Encyclopédie 2026 — PLEIN SUD RÉABILIS'},
    'edilians-plate-artis-17x27':{min:10.00,mean:10.53,max:11.11,gauge_min_mm:90,gauge_mean_mm:95,gauge_max_mm:100,source:'EDILIANS Encyclopédie 2026 — PLATE ARTIS 17X27'}
  };
  const priceCorrections={
    'edilians-mediane-plus':{
      unit_price_ht:4.38,
      currency:'EUR',
      price_type:'public_catalogue_benchmark',
      source:'Point.P — prix catalogue public Médiane Plus Rouergue relevé 2026-10-21, conversion TTC vers HT à 20%',
      source_url:'https://www.pointp.fr/p/couverture/tuile-mediane-plus-gelis-101-rouergue-84-A6427698'
    }
  };
  const corrections={
    'edilians-beauvoise-graphite':{min:20.2,max:20.7,source:'EDILIANS Encyclopédie 2026 — BEAUVOISE GRAPHITE'},
    'edilians-plate-17x27':{min:59.5,max:66.1,source:'EDILIANS Encyclopédie 2026 — PLATE 17X27'},
    'edilians-plate-artis-17x27':{min:59,max:65,source:'EDILIANS Encyclopédie 2026 — PLATE ARTIS 17X27'},
    'edilians-plate-ecaille-pressee-17x27':{min:58.8,max:65.3,source:'EDILIANS Encyclopédie 2026 — PLATE ÉCAILLE PRESSÉE 17X27'},
    'edilians-plate-elixir-16x27':{min:65.7,max:73.5,source:'EDILIANS Encyclopédie 2026 — PLATE ELIXIR 16X27'},
    'edilians-plate-rectangulaire-pressee-17x27':{min:58.8,max:65.3,source:'EDILIANS Encyclopédie 2026 — PLATE RECTANGULAIRE PRESSÉE 17X27'},
    'edilians-plate-restauration-16x27':{min:65.7,max:73.5,source:'EDILIANS Encyclopédie 2026 — PLATE RESTAURATION 16X27'},
    'edilians-plate-tradition-17x27':{min:59.5,max:66.1,source:'EDILIANS Encyclopédie 2026 — PLATE TRADITION 17X27'},
    'edilians-canal-charentaise-a-blocage':{min:34.8,max:34.8,source:'EDILIANS Encyclopédie 2026 — CANAL CHARENTAISE À BLOCAGE : 17,4/m² couvert seul ×2 couvert+courant'},
    'edilians-canal-quintescia':{min:24.8,max:27,source:'EDILIANS Encyclopédie 2026 — CANAL QUINTESCIA : 12,4–13,5/m² couvert seul ×2 couvert+courant'},
    'edilians-double-tenord':{min:9.35,max:10.10,source:'EDILIANS Encyclopédie 2026 — DOUBLE TÉNORD'},
    'edilians-hp-13-evolutive':{min:13.3,max:16.6,source:'EDILIANS Encyclopédie 2026 — HP 13 ÉVOLUTIVE'},
    'edilians-losangee-ste-foy':{min:11.5,max:13.3,source:'EDILIANS Encyclopédie 2026 — LOSANGÉE Ste Foy'},
    'edilians-standard-14-vario':{min:14,max:17,source:'EDILIANS Encyclopédie 2026 — STANDARD 14 VARIO'},
    'edilians-plein-sud-reabilis':{min:9.6,max:11.4,source:'EDILIANS Encyclopédie 2026 — PLEIN SUD RÉABILIS'},
    'edilians-alpha-10':{min:10.5,max:10.5,source:'EDILIANS Encyclopédie 2026 — ALPHA 10'},
    'edilians-double-hp-20':{min:9.5,max:9.5,source:'EDILIANS Encyclopédie 2026 — DOUBLE HP 20'},
    'edilians-jura-10':{min:10,max:10,source:'EDILIANS Encyclopédie 2026 — JURA 10'},
    'edilians-pv-10':{min:10,max:10,source:'EDILIANS Encyclopédie 2026 — PV 10'},
    'edilians-omega-10':{min:10,max:10,source:'EDILIANS Encyclopédie 2026 — OMÉGA 10'},
    'edilians-omega-13':{min:13,max:13,source:'EDILIANS Encyclopédie 2026 — OMÉGA 13'},
    'edilians-tenord':{min:18.7,max:20.2,source:'EDILIANS Encyclopédie 2026 — TÉNORD, selon recouvrement'},
    'edilians-plate-stretto':{min:25.1,max:26.9,source:'EDILIANS Encyclopédie 2026 — PLATE STRETTO, selon recouvrement'},
    'monier-canal-midi':{min:10.5,max:12.9,source:'MONIER — Canal Midi, selon recouvrement'},
    'monier-canal-midi-patinee':{min:10.5,max:12.9,source:'MONIER — Canal Midi Patinée, selon recouvrement'},
    'monier-posifix-midi':{min:10.5,max:12.9,source:'MONIER — Posifix Midi, selon recouvrement'},
    'monier-medoc':{min:12.1,max:15.2,source:'MONIER — Médoc, selon recouvrement'},
    'monier-medoc-patinee':{min:12.1,max:15.2,source:'MONIER — Médoc Patinée, selon recouvrement'},
    'monier-posifix-medoc':{min:12.1,max:15.2,source:'MONIER — Posifix Médoc, selon recouvrement'},
    'monier-systeme-stop':{min:15.9,max:16.6,source:'MONIER — Système Stop'},
    'terreal-girondine':{min:12.6,max:15.9,source:'TERREAL — Girondine, selon recouvrement'},
    'terreal-languedocienne':{min:10.7,max:13.2,source:'TERREAL — Languedocienne, selon recouvrement'},
    'terreal-vendeenne':{min:17.5,max:22.9,source:'TERREAL — Vendéenne, selon recouvrement'},
    'terreal-canal-evolution':{min:9.2,max:11.6,source:'TERREAL Guide Canal & Grands Moules du Sud — Canal Évolution'},
    'terreal-canal-origine':{min:10.7,max:13.2,source:'TERREAL Guide Canal & Grands Moules du Sud — Canal Origine'},
    'terreal-canalaverou-evo':{min:17,max:18.7,source:'TERREAL Guide Canal & Grands Moules du Sud — Canalavérou EVO'},
    'terreal-double-canal-languedoc-aspect-vieux-pays':{min:9.5,max:10,source:'TERREAL Guide Canal & Grands Moules du Sud — DCL aspect Vieux Pays'},
    'edilians-arboise-ecaille':{min:22.5,max:22.5,source:'EDILIANS Encyclopédie 2026 — ARBOISE ÉCAILLE'}
  };
  for(const p of C.products){
    const pc=priceCorrections[p.id];
    if(pc){
      p.pricing={...(p.pricing||{}),...pc};
    }
    const bc=battenCorrections[p.id];
    if(bc){
      p.technical=p.technical||{};
      p.technical.battens_linear_m_per_m2={min:bc.min,max:bc.max,mean:bc.mean};
      p.technical.battens_linear_m_per_m2_source=bc.source;
      p.technical.gauge={min:bc.gauge_min_mm,max:bc.gauge_max_mm,mean:bc.gauge_mean_mm};
      p.technical.gauge_unit='mm';
    }
    const c=corrections[p.id];
    if(!c||p.technical?.tiles_per_m2) continue;
    p.technical=p.technical||{};
    p.technical.tiles_per_m2={min:c.min,max:c.max,mean:(c.min+c.max)/2};
    p.technical.tiles_per_m2_source=c.source;
    p.validation=p.validation||{};
    if(Array.isArray(p.validation.missing_required_fields)){
      p.validation.missing_required_fields=p.validation.missing_required_fields.filter(x=>x!=='tiles_per_m2');
    }
    p.validation.catalogue_correction='source_fabricant_auditee';
  }
  C.corrections={version:'2026-10-21-v7',count:Object.keys(corrections).length,batten_count:Object.keys(battenCorrections).length,price_count:Object.keys(priceCorrections).length};
})();