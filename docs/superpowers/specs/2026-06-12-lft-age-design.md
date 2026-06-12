# Design — Âge (date de naissance) + statut LFT + page LFT

**Date :** 2026-06-12
**Projet :** The-Hub-website (Next.js App Router, MongoDB, NextAuth Discord)
**Statut :** Approuvé (design)

## Objectif

Permettre aux joueurs d'indiquer leur **âge** (via date de naissance, pour qu'il reste à jour
automatiquement) et de se déclarer **LFT** (« Looking For Team »). Ajouter une page publique
listant tous les joueurs LFT, filtrable et triable par âge, rôle, pays, et par recherche de nom.

## Décisions clés (validées)

- **Mécanisme LFT** : simple toggle sur la page profil `/me` (pas de modal au login).
- **Affichage de l'âge** : on stocke la date de naissance mais on n'affiche **que l'âge calculé**
  (ex. « 21 ans »). La date exacte reste privée, jamais renvoyée au client.
- **DOB optionnelle partout** : un joueur peut être LFT sans renseigner sa date. Les joueurs sans
  DOB apparaissent dans la liste LFT mais sans âge, et sont exclus quand un filtre d'âge est actif.
- **Filtres page LFT** : rôle, pays, âge (tranche), recherche par nom.

## 1. Modèle de données

Étendre `WebProfile` dans `src/lib/db/types.ts` :

```typescript
export interface WebProfile {
  // ... champs existants ...
  /** Date de naissance ISO "YYYY-MM-DD". Stockée telle quelle, jamais exposée en clair. */
  date_of_birth?: string;
  /** Le joueur se déclare « Looking For Team ». */
  lft_enabled?: boolean;
  /** Mis à jour quand lft_enabled passe à true ; sert au tri (LFT récents en premier). */
  lft_updated_at?: Date;
}
```

Étendre `WebProfileWrite` dans `src/lib/db/profile-write.ts` :

```typescript
export interface WebProfileWrite {
  // ... champs existants ...
  date_of_birth: string; // "" si non renseigné
  lft_enabled: boolean;
}
```

`updateWebProfile` :
- écrit `date_of_birth` (`""` → champ retiré via `$unset` pour rester propre) ;
- écrit `lft_enabled` ;
- positionne `lft_updated_at = new Date()` **uniquement** lors d'une transition `false → true`
  (lecture du doc existant avant écriture, ou comparaison côté action). Si `lft_enabled` repasse
  à `false`, on n'efface pas `lft_updated_at` (sans importance car non listé).

**L'âge n'est jamais persisté** — toujours dérivé de `date_of_birth`.

## 2. Calcul de l'âge et utilitaires (`src/lib/profile/age.ts`)

Module pur, sans dépendance DB, facilement testable :

- `computeAge(dob: string, now: Date): number | null`
  Renvoie l'âge en années pleines, ou `null` si `dob` absent/invalide. Gère l'anniversaire non
  encore passé dans l'année et les années bissextiles (29 février).
- `ageRangeToDobWindow(minAge?, maxAge?, now: Date): { gte?: string; lte?: string }`
  Convertit une tranche d'âge en fenêtre de dates `date_of_birth` pour une requête Mongo efficace
  (pas de calcul par document). Ex. `minAge=18` ⇒ `date_of_birth <= (today - 18 ans)`.
- `isValidDob(dob: string, now: Date): boolean`
  Valide le format `YYYY-MM-DD`, date réelle, born ≤ aujourd'hui, âge ∈ [13, 100].

Constantes : `MIN_AGE = 13`, `MAX_AGE = 100`.

## 3. Validation (`src/lib/profile/schema.ts`)

Étendre `profileSchema` (Zod) :

- `date_of_birth` : `string` optionnel ; `""` accepté (= non renseigné) ; sinon doit passer
  `isValidDob`. Message d'erreur clair (« Âge invalide (13–100 ans) »).
- `lft_enabled` : coercition depuis la valeur de la checkbox (`"on"`/absent → boolean), defaut `false`.

## 4. Formulaire `/me`

`src/components/MeForm.tsx` + `src/app/me/actions.ts` :

- Champ **date de naissance** : `<input type="date" name="date_of_birth">`, optionnel, pré-rempli
  avec la valeur existante. Libellé indiquant que seul l'âge sera visible publiquement.
- **Toggle LFT** : interrupteur accessible (checkbox stylée, `name="lft_enabled"`, `aria-*`),
  pré-coché selon l'état courant.
- `saveProfile` : inclut les deux nouveaux champs dans le `FormData` parsé, valide via le schéma,
  appelle `updateWebProfile`, revalide les chemins existants **plus** le tag de cache LFT (§5).

## 5. Accès données LFT (`src/lib/db/lft.ts`)

```typescript
export interface LftFilters {
  roles?: string[];
  nationality?: string;
  minAge?: number;
  maxAge?: number;
  query?: string; // recherche pseudo
}

export interface LftPlayer {
  userId: string;
  username: string;
  avatar: string | null;
  roles: string[];
  nationality?: string;
  age: number | null;
}

export async function getLftPlayers(filters: LftFilters, limit?: number): Promise<LftPlayer[]>;
```

Requête sur `web_profiles` avec `lft_enabled: true`. Construction du filtre Mongo :

- **rôle** : `roles: { $in: filters.roles }` si non vide.
- **pays** : `nationality: filters.nationality` si fourni et valide (`isCountryCode`).
- **âge** : via `ageRangeToDobWindow` → contraintes `date_of_birth: { $gte, $lte }`. Comme un filtre
  d'âge implique l'existence d'une date, ces joueurs ont forcément un `date_of_birth`.
- **nom** : `discord_username: { $regex: escapeRegex(q), $options: "i" }`, `q` plafonné à 100 car.
  (réutiliser l'utilitaire d'échappement de `search.ts`).

Tri : `lft_updated_at` décroissant. `limit` par défaut raisonnable (ex. 100). L'âge de chaque
joueur est calculé via `computeAge` après lecture. Variante cachée avec `unstable_cache` +
tag `LFT_PLAYERS_TAG`, invalidée par `revalidateTag` dans `saveProfile`.

## 6. Page `/lft` (`src/app/lft/page.tsx`)

- **Server component**, rendu dynamique (dépend des search params), suivant le pattern
  leaderboard/search existant.
- Lit les filtres depuis l'URL : `?role=&country=&minAge=&maxAge=&q=`. Parsing défensif (valeurs
  inconnues ignorées).
- Barre de filtres :
  - rôle → chips de toggle (réutiliser le style de `RolesPicker`) ;
  - pays → `FlagSelect` ;
  - âge → deux sélecteurs / champs min & max ;
  - recherche → input texte.
  Soumission via navigation (form GET ou liens) qui met à jour les search params.
- Résultats : grille de **cartes joueur** (composant réutilisable, ex. `LftCard`) affichant Avatar,
  pseudo, rôles, drapeau pays, âge (« — » si inconnu). Chaque carte est un lien vers `/player/[id]`.
- État vide : message « Aucun joueur LFT pour ces critères ».
- **Navigation** : ajouter un lien `/lft` dans la barre de navigation principale.

## 7. Sécurité & vie privée

- `date_of_birth` n'est **jamais** inclus dans les types/objets renvoyés au client (`LftPlayer`,
  props de page, JSON-LD). Seul `age` (entier) sort.
- Recherche : regex échappée + longueur plafonnée (défense ReDoS/DoS, cohérent avec `search.ts`).
- Search params validés/normalisés côté serveur avant requête Mongo.
- Aucune nouvelle route API ; lecture publique uniquement de profils déjà publics.

## 8. Tests

Unitaires (`age.test.ts`, extension de `schema` tests, `lft` query builder) :

- `computeAge` : âge exact, anniversaire pas encore passé cette année, né un 29 février, dob absente/invalide → `null`.
- `ageRangeToDobWindow` : bornes min seule, max seule, les deux, aucune.
- `isValidDob` : format invalide, date future, < 13 ans, > 100 ans, limites exactes 13 et 100.
- `escapeRegex` / plafonnement du nom (réutilisé).
- Construction du filtre `getLftPlayers` (avec mock DB) : chaque filtre individuel + combinaison.

Respecter le seuil de couverture du projet (gate CI à 80 %).

## Hors périmètre (YAGNI)

- Pas de modal au login.
- Pas de notifications / alertes LFT.
- Pas de pagination avancée (limite simple suffit au volume actuel).
- Pas de stockage de l'âge (toujours dérivé).
