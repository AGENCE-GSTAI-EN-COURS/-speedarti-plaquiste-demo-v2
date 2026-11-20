(function(){
  const catalogue=window.SpeedArtiRoofCatalog,data=window.SpeedArtiRoofPrices;
  if(!catalogue||!data)return;
  for(const p of catalogue.products){
    const entry=data.model_prices[p.id];if(!entry)continue;
    const pro=entry.professional,publicPrice=entry.public_benchmark;
    p.pricing={currency:'EUR',price_type:pro?'professional_supplier':'public_market_benchmark',unit_price_ht:pro?pro.unit_price_ht:publicPrice.unit_price_ht,source:pro?`Tarif professionnel HT du ${pro.observed_at}`:publicPrice.source,observed_at:pro?.observed_at??publicPrice.observed_at,color_observed:pro?.color_observed??null,color_policy:entry.color_policy,public_benchmark:publicPrice,professional_observation:pro,professional_discount_applied:0};
  }
  catalogue.priced_accessories=data.accessories;
  catalogue.price_version=data.version;
})();
