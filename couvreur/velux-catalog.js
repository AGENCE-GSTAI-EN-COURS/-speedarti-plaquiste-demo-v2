window.SpeedArtiVeluxCatalog={
  version:"2026-10-13-v2",
  pricing_rule:{
    source_type:"prix web publics observés",
    artisan_discount_pct:15,
    rule:"prix_artisan_estime_ht = prix_public_ht × 0,85",
    warning:"Le -15 % est une règle d'estimation SpeedArti demandée pour la démo, pas un tarif professionnel VELUX contractuel."
  },
  dimensions:{
    CK02:{width_cm:55,height_cm:78},
    CK04:{width_cm:55,height_cm:98},
    MK04:{width_cm:78,height_cm:98},
    MK06:{width_cm:78,height_cm:118},
    MK08:{width_cm:78,height_cm:140},
    PK06:{width_cm:94,height_cm:118},
    PK08:{width_cm:94,height_cm:140},
    PK10:{width_cm:94,height_cm:160},
    SK06:{width_cm:114,height_cm:118},
    SK08:{width_cm:114,height_cm:140},
    UK04:{width_cm:134,height_cm:98},
    UK08:{width_cm:134,height_cm:140}
  },
  installation_source:{
    name:"Tarif VELUX France 2026",
    published:"2026",
    source:"VELUX France ContentHub — tarif raccords et produits d'installation",
    pricing:"prix publics conseillés HT"
  },
  flashing_catalog:{
    size_order:["CK02","CK04","MK04","MK06","MK08","PK06","PK08","PK10","SK06","SK08","UK04","UK08"],
    EDW:{label:"Raccord tuiles — pose standard",roof:"tuiles",pose:"standard",max_relief_mm:120,price_0000:[82,84,94,99,105,112,117,121,116,123,123,133],price_2000:[117,120,134,141,149,159,168,173,166,176,176,190],note:"Tuiles ≤ 120 mm de relief"},
    EDP:{label:"Raccord tuiles plates — pose standard",roof:"tuiles plates",pose:"standard",price_0000:[87,89,99,105,111,118,125,129,123,131,131,141],price_2000:[124,127,142,149,158,169,178,184,176,187,187,202],note:"Tuiles plates de longueur < 300 mm"},
    EDL:{label:"Raccord ardoises — pose standard",roof:"ardoises",pose:"standard",price_0000:[79,81,90,95,100,107,113,117,112,118,118,128],price_2000:[112,115,129,135,143,153,161,166,160,169,169,183],note:"Ardoises < 8 mm"},
    EDJ:{label:"Raccord tuiles — pose encastrée",roof:"tuiles",pose:"encastree",max_relief_mm:90,price_0000:[98,101,113,118,126,134,141,146,140,148,148,160],price_2000:[140,144,161,169,179,191,201,208,200,212,212,228],note:"Tuiles ≤ 90 mm de relief"},
    EDN:{label:"Raccord ardoises — pose encastrée",roof:"ardoises",pose:"encastree",price_0000:[98,101,113,118,126,134,141,146,140,148,148,160],price_2000:[140,144,161,169,179,191,201,208,200,212,212,228],note:"Ardoises < 8 mm"}
  },
  accessory_catalog:{
    BFX1000:{label:"Collerette d'étanchéité BFX — pose standard",price:[28,29,32,34,36,38,40,42,40,42,42,46],note:"Pour écran de sous-toiture"},
    BFX1000F:{label:"Collerette d'étanchéité BFX — pose encastrée",price:[35,36,40,42,45,48,50,52,50,53,53,57],note:"Pour écran de sous-toiture"},
    BBX0000:{label:"Collerette pare-vapeur BBX",price:[28,29,32,34,36,38,40,42,40,42,42,46],note:"Étanchéité à l'air / pare-vapeur"},
    BBX1000:{label:"Kit finition intérieure avec pare-vapeur BBX",price:[40,41,46,48,51,54,57,59,57,60,60,65],note:"Kit finition intérieure incluant le pare-vapeur"}
  },
  products:[
    {id:"velux-ggl-standard-ck02",brand:"VELUX",model:"GGL",range:"Standard",operation:"rotation",size_code:"CK02",public_ht:224.17,public_ttc:269,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-standard-mk04",brand:"VELUX",model:"GGL",range:"Standard",operation:"rotation",size_code:"MK04",public_ht:267.50,public_ttc:321,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-standard-mk06",brand:"VELUX",model:"GGL",range:"Standard",operation:"rotation",size_code:"MK06",public_ht:293.33,public_ttc:352,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-standard-sk06",brand:"VELUX",model:"GGL",range:"Standard",operation:"rotation",size_code:"SK06",public_ht:357.50,public_ttc:429,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-standard-uk04",brand:"VELUX",model:"GGL",range:"Standard",operation:"rotation",size_code:"UK04",public_ht:365.83,public_ttc:439,source:"Tecnomat 2026-10"},

    {id:"velux-ggl-confort-ck02",brand:"VELUX",model:"GGL",range:"Confort",operation:"rotation",size_code:"CK02",public_ht:295.00,public_ttc:354,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-confort-mk06",brand:"VELUX",model:"GGL",range:"Confort",operation:"rotation",size_code:"MK06",public_ht:395.83,public_ttc:475,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-confort-mk08",brand:"VELUX",model:"GGL",range:"Confort",operation:"rotation",size_code:"MK08",public_ht:420.00,public_ttc:504,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-confort-sk06",brand:"VELUX",model:"GGL",range:"Confort",operation:"rotation",size_code:"SK06",public_ht:465.83,public_ttc:559,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-confort-sk08",brand:"VELUX",model:"GGL",range:"Confort",operation:"rotation",size_code:"SK08",public_ht:540.83,public_ttc:649,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-confort-uk04",brand:"VELUX",model:"GGL",range:"Confort",operation:"rotation",size_code:"UK04",public_ht:482.50,public_ttc:579,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-confort-uk08",brand:"VELUX",model:"GGL",range:"Confort",operation:"rotation",size_code:"UK08",public_ht:604.17,public_ttc:725,source:"Tecnomat 2026-10"},

    {id:"velux-ggl-toutconfort-ck02",brand:"VELUX",model:"GGL",range:"Tout confort",operation:"rotation",size_code:"CK02",public_ht:369.17,public_ttc:443,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-toutconfort-mk04",brand:"VELUX",model:"GGL",range:"Tout confort",operation:"rotation",size_code:"MK04",public_ht:454.17,public_ttc:545,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-toutconfort-mk08",brand:"VELUX",model:"GGL",range:"Tout confort",operation:"rotation",size_code:"MK08",public_ht:532.50,public_ttc:639,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-toutconfort-sk06",brand:"VELUX",model:"GGL",range:"Tout confort",operation:"rotation",size_code:"SK06",public_ht:574.17,public_ttc:689,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-toutconfort-uk04",brand:"VELUX",model:"GGL",range:"Tout confort",operation:"rotation",size_code:"UK04",public_ht:620.83,public_ttc:745,source:"Tecnomat 2026-10"},
    {id:"velux-ggl-toutconfort-uk08",brand:"VELUX",model:"GGL",range:"Tout confort",operation:"rotation",size_code:"UK08",public_ht:705.83,public_ttc:847,source:"Tecnomat 2026-10"},

    {id:"velux-ggu-confort-ck02",brand:"VELUX",model:"GGU",range:"Confort",operation:"rotation",size_code:"CK02",public_ht:375.83,public_ttc:451,source:"Tecnomat 2026-10"},
    {id:"velux-ggu-confort-mk06",brand:"VELUX",model:"GGU",range:"Confort",operation:"rotation",size_code:"MK06",public_ht:504.17,public_ttc:605,source:"Tecnomat 2026-10"},
    {id:"velux-ggu-confort-uk04",brand:"VELUX",model:"GGU",range:"Confort",operation:"rotation",size_code:"UK04",public_ht:632.50,public_ttc:759,source:"Tecnomat 2026-10"},

    {id:"velux-gpl-confort-mk06",brand:"VELUX",model:"GPL",range:"Confort",operation:"projection",size_code:"MK06",public_ht:599.17,public_ttc:719,source:"Tecnomat 2026-10"},
    {id:"velux-gpl-confort-uk04",brand:"VELUX",model:"GPL",range:"Confort",operation:"projection",size_code:"UK04",public_ht:674.17,public_ttc:809,source:"Tecnomat 2026-10"},
    {id:"velux-gpu-confort-mk06",brand:"VELUX",model:"GPU",range:"Confort",operation:"projection",size_code:"MK06",public_ht:707.50,public_ttc:849,source:"Tecnomat 2026-10"},
    {id:"velux-gpu-confort-sk06",brand:"VELUX",model:"GPU",range:"Confort",operation:"projection",size_code:"SK06",public_ht:824.17,public_ttc:989,source:"Tecnomat 2026-10"}
  ]
};
(function(C){
  const d=C.pricing_rule.artisan_discount_pct/100;
  const artisan=v=>Math.round(Number(v||0)*(1-d)*100)/100;
  const sizeIndex=size=>C.flashing_catalog.size_order.indexOf(size);
  for(const p of C.products){
    const dim=C.dimensions[p.size_code]||{};
    p.width_cm=dim.width_cm||null;
    p.height_cm=dim.height_cm||null;
    p.artisan_ht=artisan(p.public_ht);
    p.reference=[p.model,p.size_code,p.range].join(" ");
  }
  C.getFlashing=function(code,size,withKit){
    const f=C.flashing_catalog[code],i=sizeIndex(size);
    if(!f||i<0)return null;
    const variant=withKit?"2000":"0000";
    const public_ht=(withKit?f.price_2000:f.price_0000)?.[i];
    if(!Number.isFinite(public_ht))return null;
    return {code,variant,reference:`${code} ${size} ${variant}`,label:f.label,note:f.note,roof:f.roof,pose:f.pose,size_code:size,includes_bdx_bfx:!!withKit,public_ht,artisan_ht:artisan(public_ht),source:C.installation_source.source};
  };
  C.getAccessory=function(code,size){
    const a=C.accessory_catalog[code],i=sizeIndex(size);
    if(!a||i<0)return null;
    const public_ht=a.price?.[i];
    if(!Number.isFinite(public_ht))return null;
    return {code,reference:`${code.replace(/(1000F|1000|0000)$/,'')} ${size} ${code.match(/(1000F|1000|0000)$/)?.[1]||''}`.trim(),label:a.label,note:a.note,size_code:size,public_ht,artisan_ht:artisan(public_ht),source:C.installation_source.source};
  };
  C.flashingOptions=function(size){return Object.keys(C.flashing_catalog).filter(k=>k!=="size_order").map(code=>C.getFlashing(code,size,false)).filter(Boolean)};
})(window.SpeedArtiVeluxCatalog);
