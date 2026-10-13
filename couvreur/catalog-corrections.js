(function(){
  const C=window.SpeedArtiRoofCatalog;
  if(!C||!Array.isArray(C.products)) return;
  const corrections={
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
  C.corrections={version:'2026-10-13-v3',count:Object.keys(corrections).length};
})();