// SpeedArti Peintre V0.1 — moteur pur, DEMO uniquement.
// Chiffrage physique séparé du catalogue et du devis de production.
const round2 = value => Math.round((value + Number.EPSILON) * 100) / 100;
const sum = values => values.reduce((acc, value) => acc + value, 0);
const value = raw => (raw === '' || raw == null ? null : Number(raw));
const valid = n => Number.isFinite(n) && n >= 0;
const positive = raw => valid(value(raw)) && value(raw) > 0;
const number = raw => valid(value(raw)) ? value(raw) : 0;
const checkedMoney = raw => valid(value(raw)) ? round2(value(raw)) : null;
function warn(list, message) { if (!list.includes(message)) list.push(message); }
function assertPositive(raw, label) {
  if (!positive(raw)) throw Error(label + ' : valeur strictement positive obligatoire.');
  return value(raw);
}
function assertNonnegative(raw, label) {
  const n = value(raw);
  if (!valid(n)) throw Error(label + ' : valeur positive ou nulle obligatoire.');
  return n;
}
export function createDefaultState() {
  return {
    projectName: 'Chantier de démonstration',
    rooms: [{ id: 'piece-1', name: 'Pièce 1', length: 5, width: 4, height: 2.5, wallFinish: 'paint', ceiling: true, openings: [] }],
    coating: { label: 'Acrylique', layers: 2, yieldM2PerL: '', lossPct: 10, potSizeL: '', potPriceHT: '', hoursPerM2: '' },
    primer: { enabled: false, yieldM2PerL: '', potSizeL: '', potPriceHT: '', hoursPerM2: '' },
    preparation: { level: 'none', hoursPerM2: '' },
    woodwork: { areaM2: 0, layers: 2, yieldM2PerL: '', potSizeL: '', potPriceHT: '', hoursPerM2: '' },
    plinth: { enabled: false, hoursPerMl: '' },
    wallpaper: { rollWidthM: '', rollLengthM: '', rollPriceHT: '', lossPct: 20, hoursPerM2: '' },
    extras: [],
    labor: { hourlyRate: '', workers: 1 },
    vatRate: 20
  };
}
function geometry(state) {
  if (!Array.isArray(state.rooms) || state.rooms.length === 0) throw Error('Ajoutez au moins une pièce.');
  const rooms = state.rooms.map((room, i) => {
    const name = String(room.name || 'Pièce ' + (i + 1));
    const l = assertPositive(room.length, name + ' longueur');
    const w = assertPositive(room.width, name + ' largeur');
    const h = assertPositive(room.height, name + ' hauteur');
    if (!['paint','wallpaper','none'].includes(room.wallFinish)) throw Error(name + ' : revêtement inconnu.');
    const openings = Array.isArray(room.openings) ? room.openings : [];
    const totalOpeningArea = sum(openings.map((o,j) => {
      const q = assertNonnegative(o.count, name + ' ouverture ' + (j+1) + ' quantité');
      if (!Number.isInteger(q)) throw Error(name + ' : quantité d’ouverture entière obligatoire.');
      return assertPositive(o.width, 'Largeur ouverture') * assertPositive(o.height, 'Hauteur ouverture') * q;
    }));
    const grossWalls = 2 * (l + w) * h;
    if (totalOpeningArea > grossWalls + 0.00001) throw Error(name + ' : ouvertures supérieures à la surface des murs.');
    const netWalls = Math.max(0, grossWalls - totalOpeningArea);
    const plinthDeduction = sum(openings.filter(o => o.type === 'door').map(o => number(o.width) * number(o.count)));
    return {
      name, grossWalls, openingsM2: totalOpeningArea, netWalls, ceilingM2: room.ceiling ? l * w : 0,
      paintWallsM2: room.wallFinish === 'paint' ? netWalls : 0,
      wallpaperM2: room.wallFinish === 'wallpaper' ? netWalls : 0,
      plinthMl: Math.max(0, 2 * (l + w) - plinthDeduction)
    };
  });
  return {
    rooms,
    grossWallsM2: round2(sum(rooms.map(r => r.grossWalls))),
    openingsM2: round2(sum(rooms.map(r => r.openingsM2))),
    paintWallsM2: round2(sum(rooms.map(r => r.paintWallsM2))),
    wallpaperM2: round2(sum(rooms.map(r => r.wallpaperM2))),
    ceilingM2: round2(sum(rooms.map(r => r.ceilingM2))),
    plinthMl: round2(sum(rooms.map(r => r.plinthMl)))
  };
}
function liquidLine(lines, warnings, id, name, area, spec, layers, lossPct) {
  if (area <= 0) return;
  const yieldValue = value(spec.yieldM2PerL);
  const size = value(spec.potSizeL);
  const price = checkedMoney(spec.potPriceHT);
  const litresTheory = positive(yieldValue) ? area * layers / yieldValue : null;
  const litresRequired = litresTheory == null ? null : litresTheory * (1 + lossPct / 100);
  const pots = positive(size) && litresRequired != null ? Math.ceil(litresRequired / size) : null;
  if (litresTheory == null) warn(warnings, name + ' : rendement à renseigner (fiche technique fabricant).');
  if (!positive(size)) warn(warnings, name + ' : conditionnement du pot à renseigner.');
  if (price == null) warn(warnings, name + ' : prix HT du pot à confirmer.');
  lines.push({ id, name, category: 'materiel', quantity: pots, unit: 'pot', theoreticalLitres: litresTheory == null ? null : round2(litresTheory),
    requiredLitres: litresRequired == null ? null : round2(litresRequired), packSizeL: positive(size) ? size : null,
    priceHT: price, totalHT: pots == null || price == null ? null : round2(pots * price),
    priceSource: 'saisie artisan / catalogue à raccorder', billable: true });
}
function laborLine(lines, warnings, id, name, quantity, ratio, hourlyRate) {
  if (quantity <= 0) return;
  const h = value(ratio);
  if (!valid(h)) warn(warnings, name + ' : temps unitaire à confirmer.');
  if (hourlyRate == null) warn(warnings, 'Taux horaire artisan HT à confirmer.');
  const hours = valid(h) ? round2(quantity * h) : null;
  lines.push({id, name, category:'main_oeuvre', quantity: hours, unit:'h-homme',
    priceHT: hourlyRate, totalHT: hours == null || hourlyRate == null ? null : round2(hours * hourlyRate),
    billable:true, priceSource:'paramètres artisan à raccorder'});
}
export function calculateEstimate(state) {
  const g = geometry(state), warnings = [], lines = [], laborLines = [];
  const coat = state.coating || {}, primer = state.primer || {}, prep = state.preparation || {}, wood = state.woodwork || {}, wp = state.wallpaper || {};
  const paintArea = g.paintWallsM2 + g.ceilingM2;
  const woodArea = assertNonnegative(wood.areaM2 ?? 0, 'Surface boiseries');
  const layers = assertPositive(coat.layers, 'Nombre de couches');
  const woodLayers = assertPositive(wood.layers, 'Couches boiseries');
  const loss = assertNonnegative(coat.lossPct ?? 10,'Pertes peinture');
  const wpLoss = assertNonnegative(wp.lossPct ?? 20,'Pertes papier peint');
  if (loss > 100 || wpLoss > 100) throw Error('Pertes : pourcentage supérieur à 100 non accepté.');
  const hourlyRate = checkedMoney(state.labor?.hourlyRate);
  const workers = assertPositive(state.labor?.workers,'Nombre d’ouvriers');
  if (!Number.isInteger(workers)) throw Error('Nombre d’ouvriers : entier obligatoire.');
  const vat = assertNonnegative(state.vatRate,'TVA');
  if (![0,5.5,10,20].includes(vat)) throw Error('TVA : taux non proposé dans la démo.');

  liquidLine(lines,warnings,'paint','Peinture '+(coat.label||'finition'),paintArea,coat,layers,loss);
  laborLine(laborLines,warnings,'paint-labor','Application peinture ('+layers+' couches)',paintArea,coat.hoursPerM2,hourlyRate);

  if (primer.enabled && paintArea > 0) {
    liquidLine(lines,warnings,'primer','Sous-couche / primaire',paintArea,primer,1,loss);
    laborLine(laborLines,warnings,'primer-labor','Application primaire',paintArea,primer.hoursPerM2,hourlyRate);
  }
  if (prep.level && prep.level !== 'none' && paintArea > 0) {
    laborLine(laborLines,warnings,'prep-labor','Préparation supports niveau '+prep.level,paintArea,prep.hoursPerM2,hourlyRate);
    warn(warnings,'Préparation : consommables/enduit non inclus tant que leurs références et conditionnements ne sont pas sélectionnés.');
  }
  if (woodArea > 0) {
    liquidLine(lines,warnings,'wood-paint','Peinture boiseries',woodArea,wood,woodLayers,loss);
    laborLine(laborLines,warnings,'wood-labor','Application boiseries',woodArea,wood.hoursPerM2,hourlyRate);
  }
  if (state.plinth?.enabled && g.plinthMl > 0) {
    laborLine(laborLines,warnings,'plinth-labor','Peinture plinthes (hors fourniture)',g.plinthMl,state.plinth.hoursPerMl,hourlyRate);
    warn(warnings,'Plinthes : métrage seul, peinture et consommables spécifiques non chiffrés.');
  }
  if (g.wallpaperM2 > 0) {
    const width = value(wp.rollWidthM), length = value(wp.rollLengthM), price = checkedMoney(wp.rollPriceHT);
    const rolls = positive(width) && positive(length) ? Math.ceil(g.wallpaperM2 * (1 + wpLoss / 100) / (width * length)) : null;
    if (rolls == null) warn(warnings,'Papier peint : dimensions du rouleau à renseigner.');
    if (price == null) warn(warnings,'Papier peint : tarif du rouleau à confirmer.');
    warn(warnings,'Papier peint : quantité indicative par surface ; calepinage des lés et raccords à vérifier avant commande.');
    lines.push({id:'wallpaper',name:'Rouleaux papier peint',category:'materiel',quantity:rolls,unit:'rouleau',
      priceHT:price,totalHT:rolls==null||price==null?null:round2(rolls*price),priceSource:'saisie artisan',billable:true});
    laborLine(laborLines,warnings,'wallpaper-labor','Pose papier peint',g.wallpaperM2,wp.hoursPerM2,hourlyRate);
  }
  let extraHours = 0;
  const extras = Array.isArray(state.extras) ? state.extras : [];
  extras.forEach((extra,i) => {
    const name = String(extra.name||'').trim();
    if (!name) throw Error('Prestation spéciale '+(i+1)+' : nom obligatoire.');
    const qty = assertPositive(extra.quantity,'Quantité de '+name);
    const price = checkedMoney(extra.unitPriceHT);
    const hoursPerUnit = value(extra.hoursPerUnit);
    if (price == null) warn(warnings,name+' : prix forfaitaire (pose incluse) à confirmer.');
    if (!valid(hoursPerUnit)) warn(warnings,name+' : heures de planning à confirmer.');
    else extraHours += qty * hoursPerUnit;
    lines.push({id:'extra-'+i,name,category:'prestation_forfait',quantity:qty,unit:'unité',priceHT:price,
      totalHT:price==null?null:round2(qty*price),billable:true, laborIncluded:true,priceSource:'saisie artisan'});
  });
  const all = [...lines,...laborLines];
  const complete = all.every(l=>l.totalHT!==null);
  const confirmedHT = round2(sum(all.filter(l=>l.totalHT!==null).map(l=>l.totalHT)));
  const amount = complete ? confirmedHT : null;
  const tax = amount === null ? null : round2(amount * vat/100);
  const materialSum = list => list.every(l=>l.totalHT!==null) ? round2(sum(list.map(l=>l.totalHT))) : null;
  const hours = laborLines.every(l=>l.quantity!==null) ? round2(sum(laborLines.map(l=>l.quantity)) + extraHours) : null;
  warn(warnings,'TVA sélectionnée par l’artisan : éligibilité à contrôler selon la nature du chantier.');
  return {
    geometry:g, paintAreaM2:round2(paintArea), woodworkM2:round2(woodArea), lines:all,
    hoursMan:hours, durationHours:hours === null ? null : round2(hours/workers),
    materialsHT:materialSum(lines.filter(l=>l.category==='materiel')),
    laborHT:materialSum(laborLines),
    extrasHT:materialSum(lines.filter(l=>l.category==='prestation_forfait')),
    confirmedHT, totalHT:amount, vatRate:vat, vatHT:tax, ttc:amount===null?null:round2(amount+tax),
    complete, warnings
  };
}
