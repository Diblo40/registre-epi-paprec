# 📋 Dossier Technique et Historique du Projet : Registre EPI PAPREC

> **Document de référence à destination de toute IA ou développeur reprenant le projet.**
> Ce dossier récapitule l'ensemble de l'architecture, la stack technique, les demandes utilisateur traitées, les bugs résolus et le rôle de chaque fichier de la plateforme **Registre EPI PAPREC** (`paprec-epi-register`).

---

## 🛠️ 1. Vue d'Ensemble et Stack Technique

- **Nom du projet** : Registre & Gestion des Équipements de Protection Individuelle (EPI) - PAPREC
- **Dépôt GitHub** : `https://github.com/Diblo40/registre-epi-paprec.git` (Branche `main`)
- **Hébergement** : GitHub Pages (Déploiement statique automatique)
- **Technologies utilisées** :
  - **HTML5 / CSS3 (Vanilla)** : Interface utilisateur moderne avec palette Paprec, cartes modernes, modales interactives et design réactif.
  - **JavaScript (ES6+ Vanilla)** : Logique applicative sans framework ni build step, chargement non-bloquant via scripts avec `defer` et bust de cache (`?v=29.0`).
  - **Base de Données Cloud (Supabase PostgreSQL)** : Synchronisation en temps réel et stockage centralisé multi-appareils via API REST PostgREST et WebSockets Realtime.
  - **Chart.js** : Graphiques interactifs de suivi financier des dépenses EPI.
  - **FontAwesome 6.5.0 & Google Fonts (Outfit, Plus Jakarta Sans)** : Iconographie et typographie institutionnelle.

---

## 📁 2. Structure du Code Source & Rôle des Fichiers

```
paprec-epi-register/
├── index.html                 # Structure HTML complète (navigation, onglets, formulaires, modales)
├── app_v8.js                  # Cœur de la logique JS (état local, requêtes Supabase, rendus DOM, graphiques)
├── styles.css                 # Style global (variables CSS, mise en page, cartes, badges, modales, impression)
├── assets/
│   └── img/
│       └── paprec_logo.png    # Logo officiel Paprec (utilisé sur le header et les modèles de décharges)
├── create_shortcut.ps1        # Script PowerShell de création de raccourci sur le bureau
└── .nojekyll                  # Fichier de configuration pour la compatibilité GitHub Pages
```

### Détail des Fichiers Clés :

#### 1. `index.html`
- **Navigation par Onglets** :
  - `#tab-stock` : Synthèse & Gestion du Stock EPI (recherche, alertes stock bas, tableau des articles).
  - `#tab-attributions` : Historique des dotations et remises d'EPI aux collaborateurs.
  - `#tab-invoices` : Registre des Factures d'Achat & Approvisionnement.
  - `#tab-finances` : Dashboard Financier (Graphiques des dépenses globales par période et catégorie).
  - `#tab-personnel` : Gestion des Salariés / Collaborateurs.
- **Modales d'Impression & Saisie** :
  - Modale de décharge individuelle de dotation d'EPI avec logo officiel Paprec et zone de signature.

#### 2. `app_v8.js`
- **Variables d'État Locales** :
  - `epiList` : Catalogue des EPI (nom, stock global, stock par taille, stock min, durée de vie, notes).
  - `employees` : Liste des salariés de l'agence.
  - `attributions` : Historique complet des dotations distribuées.
  - `invoices` : Registre des factures d'achat saisies.
  - `history` : Journal d'évènements partagé et synchronisé avec le cloud.
- **Synchronisation Cloud Supabase** :
  - URL Supabase : `https://wilukbpvjfdyxahasmmt.supabase.co`
  - Clé API : `sb_publishable_P9MiaaGJqJ2f6zAFvHwXZA_jYHlF830`
  - Fonctions génériques : `dbGet(table)`, `dbInsert(table, data)`, `dbUpdate(table, key, val, updates)`, `dbDelete(table, key, val)`.
  - Écoute WebSocket Realtime : Mise à jour instantanée des données si un autre utilisateur effectue une action sur un autre poste.

---

## 🚀 3. Récapitulatif des Demandes Utilisateur & Corrections Effectuées

### 🔹 1. Restauration de l'Achat Talkie-Walkie & Historique
- **Demande** : L'achat de Talkies-Walkies a été effectué mais n'apparaissait plus dans l'onglet des factures.
- **Correction** :
  - Ré-injection et sécurisation de la facture Talkie-Walkie par défaut (`FAC-2026-TW4`, 4 unités à 85.00 € = 340.00 €).
  - Correction de l'algorithme d'initialisation pour que cet achat soit conservé et synchronisé.

### 🔹 2. Refonte du Module Financier (Graphique des Dépenses EPI)
- **Demande** : Suppression du suivi d'évolution des prix unitaires au profit d'un graphique simple et clair des **dépenses globales en EPI avec des filtres par période/catégorie**.
- **Correction** :
  - Remplacement de l'ancien graphique de tendance de prix par un graphique en barres des dépenses cumulées (en €) généré via **Chart.js**.
  - Ajout de filtres interactifs dans l'onglet Finances : Filtrage par année, par catégorie d'EPI et par article spécifique.
  - Calcul dynamique du coût total des achats à partir des données de facturation.

### 🔹 3. Intégration du Logo Officiel PAPREC
- **Demande** : Remplacement de l'ancien logo générique par le logo officiel PAPREC transmis par l'utilisateur, à la fois sur l'application et sur les modèles d'impression des décharges de dotation.
- **Correction** :
  - Enregistrement de l'image officielle dans `assets/img/paprec_logo.png`.
  - Mise à jour du header / barre latérale dans `index.html`.
  - Intégration de l'image dans l'en-tête du document d'impression des décharges de remise d'EPI (`printDischargeClean()`).

### 🔹 4. Résolution du Bug de Synchronisation Cloud des Factures (`HTTP 400 Bad Request`)
- **Demande** : Le journal de facture ne s'actualisait pas et ne se synchronisait pas correctement avec le cloud.
- **Diagnostic Technique** :
  - Lors de la soumission du formulaire d'ajout de facture (`#form-add-invoice`), le code exécutait :
    `await dbUpdate('epi_list', 'name', epiName, { stock: totalStock, notes: cloudNotes, unitPrice: unitPrice });`
  - Cependant, la table PostgreSQL `epi_list` sur Supabase comporte les colonnes `['id', 'name', 'stock', 'min_stock', 'lifespan_months', 'notes']` et **ne possède pas de colonne `unitPrice`**.
  - Supabase renvoyait une erreur `400 Bad Request : Could not find the 'unitPrice' column of 'epi_list'`. Cette exception stoppait brutalement le script JS **avant** l'exécution de l'insertion dans la table `history` (`dbInsert('history', cloudHistLog)`).
- **Correction** :
  - Retrait du champ `unitPrice` dans le payload de mise à jour de `epi_list`.
  - Enveloppement des requêtes cloud dans un bloc `try...catch` defensif pour éviter tout blocage du navigateur en cas d'instabilité réseau.

### 🔹 5. Résolution du Bug de Disparition des Factures au Rafraîchissement (`CTRL+F5`)
- **Demande** : En rafraîchissant la page, l'application réinitialisait les factures et annulait les modifications.
- **Diagnostic Technique** :
  - Dans la fonction `loadData()`, la reconstruction cloud contenait la ligne destructrice suivante :
    `invoices = invoices.filter(i => i.id && !i.id.toString().startsWith("fac_cloud_"));`
  - À chaque rechargement de la page, toutes les factures identifiées par `fac_cloud_` étaient **purgées du tableau en mémoire local**. Si l'historique cloud n'avait pas encore généré le log correspondant, la facture était définitivement effacée.
- **Correction** :
  - Suppression complète du filtre destructeur `fac_cloud_`.
  - Remplacement par une détection stricte des doublons basée sur la combinaison `(invoiceNumber, epiName, size, quantity)` lors du chargement. Les factures stockées dans `localStorage` et dans le cloud restent ainsi parfaitement intactes à chaque rafraîchissement.

---

## 🗄️ 4. Schéma des Données Cloud (Supabase)

Pour toute intervention directe en base de données ou via script :

### Table `epi_list`
- `id` (integer / primary key)
- `name` (text, ex: `"Gants de manutention"`)
- `stock` (integer, stock total cumulé)
- `min_stock` (integer)
- `lifespan_months` (integer)
- `notes` (text, inclut les tailles au format `__SIZES_JSON__[{...}]`)

### Table `history`
- `id` (integer / primary key)
- `date` (text / timestamp)
- `employeeName` (text, ex: `"Fournisseur: PROLIANS"` pour les factures ou nom du salarié pour une attribution)
- `epi` (text, nom de l'EPI)
- `action` (text, ex: `"Achat / Appro"` ou `"Attribution"`)
- `notes` (text, contient les métadonnées de facture au format : `Facture:FAC-123 | Qté:10 | PU:15.00 | Size:L | Total:150.00 | ...`)

---

## 💡 5. Recommandations pour la Prochaine IA / Développeur

1. **Versionnement des Assets** : Lors de toute modification du fichier `app_v8.js`, penser à incrémenter le paramètre de version dans `index.html` (ex: `app_v8.js?v=30.0`) afin de forcer l'invalidation du cache des navigateurs clients.
2. **Gestion des Tailles d'EPI** : Les stocks par taille (S, M, L, XL, etc.) sont sérialisés dans la colonne `notes` sous le marqueur `__SIZES_JSON__`. Toujours utiliser les fonctions utilitaires prévues dans `app_v8.js` pour manipuler ce JSON sans altérer les notes textuelles.
3. **Synchronisation Hybride** : Le système fonctionne en **Cloud First avec fallback LocalStorage**. L'état local est sauvegardé via `saveLocalState()`. Toute modification d'entité doit impérativement déclencher la mise à jour Supabase ET le `saveLocalState()`.
