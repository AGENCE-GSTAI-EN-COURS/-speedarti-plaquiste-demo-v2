-- SPEEDARTI TERRASSIER — PROPOSITION DE SCHEMA V1.3 (NON EXECUTEE)
-- Cible : environnement STAGING uniquement. Ne jamais appliquer directement à SpeedArti V2.
-- Dépendance PostgreSQL : gen_random_uuid().
-- Données de démo sans compte utilisateur; l'UI GitHub Pages reste stockée localement.
create schema if not exists terrassier_staging;

create table if not exists terrassier_staging.famille (
 code text primary key,
 designation text not null,
 ordre integer not null default 0,
 actif boolean not null default true
);

create table if not exists terrassier_staging.prestation (
 code text primary key,
 famille_code text not null references terrassier_staging.famille(code),
 designation text not null,
 recette_code text not null,
 statut text not null default 'indicatif' check (statut in ('indicatif','a_valider','certifie')),
 ordre integer not null default 0,
 actif boolean not null default true,
 details text
);
create index if not exists terrassier_prestation_famille_idx on terrassier_staging.prestation(famille_code,ordre);

create table if not exists terrassier_staging.champ_prestation (
 prestation_code text not null references terrassier_staging.prestation(code),
 code text not null,
 libelle text not null,
 unite text,
 type_champ text not null default 'decimal' check (type_champ in ('decimal','entier','liste','boolean','texte')),
 obligatoire boolean not null default true,
 minimum numeric,
 valeur_defaut jsonb,
 ordre integer not null default 0,
 primary key (prestation_code, code)
);

create table if not exists terrassier_staging.tarif_reference (
 code text primary key,
 designation text not null,
 unite text not null,
 prix_ht numeric(14,4),
 devise char(3) not null default 'EUR',
 origine text not null,
 fournisseur text,
 date_verification date,
 statut text not null default 'a_valider'
   check(statut in ('historique','provision','a_valider','verifie')),
 check (prix_ht is null or prix_ht >= 0)
);

create table if not exists terrassier_staging.recette_ligne (
 id uuid primary key default gen_random_uuid(),
 prestation_code text not null references terrassier_staging.prestation(code),
 tarif_code text references terrassier_staging.tarif_reference(code),
 nature text not null check (nature in ('materiau','main_oeuvre','engin','transport','securite')),
 expression_quantite text not null,
 coefficient_perte numeric(8,4) not null default 1,
 ordre integer not null default 0,
 statut text not null default 'a_valider',
 commentaire text
);

create table if not exists terrassier_staging.option_complementaire (
 code text primary key,
 libelle text not null,
 tarif_code text not null references terrassier_staging.tarif_reference(code),
 unite text not null,
 quantite_defaut numeric(12,3) not null default 1,
 actif boolean not null default true,
 description text
);
create table if not exists terrassier_staging.prestation_option (
 prestation_code text not null references terrassier_staging.prestation(code),
 option_code text not null references terrassier_staging.option_complementaire(code),
 primary key (prestation_code, option_code)
);

create table if not exists terrassier_staging.chantier (
 id uuid primary key default gen_random_uuid(),
 proprietaire_id uuid not null,
 reference text,
 nom text not null,
 etat text not null default 'brouillon' check(etat in ('brouillon','en_revision','termine')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists terrassier_chantier_owner_idx on terrassier_staging.chantier(proprietaire_id);

-- UNE LIGNE PAR PRESTATION SELECTIONNEE. Le même code peut apparaître plusieurs fois.
-- Aucune unicité imposée sur (chantier_id, prestation_code).
create table if not exists terrassier_staging.chantier_prestation (
 id uuid primary key default gen_random_uuid(),
 chantier_id uuid not null references terrassier_staging.chantier(id) on delete cascade,
 prestation_code text not null references terrassier_staging.prestation(code),
 ordre integer not null default 0,
 dimensions jsonb not null default '{}'::jsonb,
 parametres jsonb not null default '{}'::jsonb,
 equipe jsonb not null default '{"pelletiers":1,"aides":0}'::jsonb,
 evacuation jsonb not null default '{"mode":"sur_place","distance_km":0}'::jsonb,
 corrections jsonb not null default '{}'::jsonb,
 commentaire text
);
create index if not exists terrassier_chantier_prestation_idx on terrassier_staging.chantier_prestation(chantier_id,ordre);

create table if not exists terrassier_staging.chantier_option (
 chantier_prestation_id uuid not null references terrassier_staging.chantier_prestation(id) on delete cascade,
 option_code text not null references terrassier_staging.option_complementaire(code),
 quantite numeric(14,3) not null check(quantite>=0),
 prix_ht_override numeric(14,4) check(prix_ht_override is null or prix_ht_override>=0),
 primary key (chantier_prestation_id,option_code)
);

create table if not exists terrassier_staging.tarif_personnalise (
 proprietaire_id uuid not null,
 tarif_code text not null references terrassier_staging.tarif_reference(code),
 prix_ht numeric(14,4) not null check(prix_ht>=0),
 origine text,
 date_verification date,
 primary key (proprietaire_id,tarif_code)
);

-- Sécurité par défaut : aucune table de staging lisible depuis un client anonyme.
-- Avant tout raccordement Supabase, une politique isolée par proprietaire_id,
-- une validation du lien auth.uid(), des tests RLS et un rollback seront nécessaires.
alter table terrassier_staging.chantier enable row level security;
alter table terrassier_staging.chantier_prestation enable row level security;
alter table terrassier_staging.chantier_option enable row level security;
alter table terrassier_staging.tarif_personnalise enable row level security;