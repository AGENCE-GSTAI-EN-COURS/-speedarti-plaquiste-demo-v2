// Adaptateur de contrat PURE — aucune connexion réseau ni écriture dans SpeedArti.
export const STATUS='PREPARED_NOT_CONNECTED';
export function buildPeintreIntegrationDraft(state,result) {
  if (!result || !Array.isArray(result.lines)) throw Error('Résultat Peintre invalide.');
  const missing=result.lines.filter(line=>line.totalHT===null).map(line=>line.id);
  return {
    schema:'speedarti.peintre.draft.v0.1',metier:'peintre',status:STATUS,
    integration_allowed:false, // Activation uniquement après revue du contrat de production.
    ready_for_devis:false,
    compatibility_issues:[
      'Raccordement catalogue réel et identifiants article_id à valider.',
      'TVA par ligne et service TVA SpeedArti à raccorder.',
      'Contrôle des consommables préparation/plinthes et calepinage papier peint à compléter.',
      'Connaissances Ángel à enrichir dans la base existante après validation.'
    ],
    chantier:{nom_calcul:String(state?.projectName||''),pieces:(state?.rooms||[]).map(r=>({nom:r.name,longueur:r.length,largeur:r.width,hauteur:r.height,ouvertures:r.openings||[],finition_murs:r.wallFinish,plafond:!!r.ceiling}))},
    surfaces:{murs_peints_m2:result.geometry.paintWallsM2,plafonds_m2:result.geometry.ceilingM2,papier_peint_m2:result.geometry.wallpaperM2,boiseries_m2:result.woodworkM2},
    lignes:result.lines.map(l=>({code_demo:l.id,article_id:null,description:l.name,unite:l.unit,quantite:l.quantity,prix_unitaire_ht:l.priceHT,total_ht:l.totalHT,forfait_pose_incluse:!!l.laborIncluded, a_confirmer:l.totalHT===null})),
    main_oeuvre:{heures_homme:result.hoursMan,duree_estimee_heures:result.durationHours},
    totaux_provisoires:{ht:result.totalHT,tva_ht:result.vatHT,ttc:result.ttc},
    missing_price_or_quantity:missing,
    knowledge_angel:'PENDING_EXISTING_KB_MERGE',
    raccordements:{client_id:null,chantier_id:null,calcul_id:null,devis_id:null}
  };
}
