# Prompt de design — Landing page Buvette Club

## Produit

**Buvette Club** est une caisse enregistreuse PWA pour les buvettes de clubs sportifs (pétanque, foot, tennis…).
Elle s'installe comme une vraie app sur tablette iPad ou Android, fonctionne **100 % hors-ligne**, et se configure en 5 minutes.

**Ce que l'app fait :**
- Encaisser des commandes en quelques taps (bière, vin, soda, snacks — catalogue personnalisable)
- Accepter espèces et carte bancaire
- Suivre le bilan de la journée en temps réel (total, répartition espèces/carte, quantités vendues par produit)
- Clôturer la caisse en fin de journée avec vérification du fond de caisse
- Consulter l'historique de toutes les journées précédentes

**Modèle commercial :** licence annuelle par club, activée via un code. Pas d'abonnement mensuel, pas de compte à créer.

---

## Public cible

Bénévoles et trésoriers de clubs sportifs amateurs en France.
Personnes peu techniques, habituées à gérer la buvette avec un carnet ou une caisse physique.
Clubs de 50 à 500 membres, événements réguliers (matchs, tournois, repas de fin de saison).

---

## Ton & identité visuelle

- **Ambiance :** chaleureuse, conviviale, légèrement sportive. Pas corporate.
- **Pas de dark mode par défaut** — la page est destinée à être lue sur ordinateur ou mobile en plein jour.
- **Iconographie :** illustrations simples et flat (pas de photos stock génériques). Quelques emojis assumés.

### Palette de couleurs (reprendre exactement celles de l'app)

| Rôle | Nom variable | Valeur hex |
|---|---|---|
| Fond principal | `--cream` | `#F6F1E8` |
| Fond papier (cartes) | `--paper` | `#FFFCF6` |
| Fond cream foncé (hover) | `--cream-deep` | `#ECE3D2` |
| Texte principal | `--ink` | `#1F1B16` |
| Texte secondaire | `--ink-soft` | `#5C544A` |
| Texte discret | `--ink-mute` | `#9A9084` |
| Séparateur | `--line` | `#E1D8C5` |
| **Vert club (CTA, bouton primaire)** | `--club` | `#1F6F3F` |
| Vert club foncé (hover) | `--club-deep` | `#144D2B` |
| Vert club très clair (badge) | `--club-soft` | `#E3EFE7` |
| **Ambré / espèces** | `--amber` | `#B47A1E` |
| Ambré très clair (badge) | `--amber-soft` | `#F3E6CC` |
| **Bleu / carte** | `--blue` | `#2F6BBB` |
| Bleu très clair (badge) | `--blue-soft` | `#DCE7F6` |
| Danger | `--danger` | `#B33A2B` |

La landing doit utiliser **les mêmes valeurs** pour que l'utilisateur reconnaisse visuellement le produit en arrivant sur la page.

Le fond général est `--cream` (#F6F1E8), un blanc cassé chaud légèrement parchemin. Les cartes et panneaux posés dessus utilisent `--paper` (#FFFCF6), légèrement plus lumineux.

Le vert `--club` (#1F6F3F) est la couleur d'action principale : tous les boutons CTA, les liens importants, les éléments mis en valeur.

L'ambré `--amber` (#B47A1E) et le bleu `--blue` (#2F6BBB) sont les deux couleurs de paiement — ils peuvent être réutilisés sur la landing pour illustrer les modes d'encaissement.

### Typographie

- **Police principale : Inter** (Google Fonts) — `font-feature-settings: "ss01", "cv11"`, antialiasing activé.
- Hiérarchie : titres en `font-weight: 700–800`, corps en `400–500`, labels en `600`.
- Pas de police décorative — la sobriété de l'Inter convient au contexte bénévole/associatif.

### Formes & espacements

- Coins arrondis généreux : `border-radius: 14px` pour les boutons, `24px` pour les cartes/modales.
- Boutons d'action principaux : hauteur `72px`, texte `22px font-weight: 700` — conçus pour les doigts sur tablette.
- Ombres légères et chaudes : `box-shadow: 0 2px 6px rgba(0,0,0,0.08)` — pas d'ombres agressives.
- Transitions courtes : `120–200ms ease` — réactif sans être brusque.

---

## Structure de la page (sections, dans l'ordre)

### 1. Hero
- Titre accrocheur : mettre en avant la simplicité et le fait que ça marche sans internet
- Sous-titre : "La caisse pour votre buvette de club. Zéro réseau requis."
- CTA primaire : "Essayer gratuitement" (ou "Demander une démo")
- CTA secondaire : "Voir comment ça marche"
- Visuel : mockup de tablette montrant l'écran de commande avec les gros boutons produits

### 2. Problème / contexte
- Courte section empathique : "Vous gérez encore la buvette avec un carnet et une calculette ?"
- 3 points douleur : erreurs de caisse, difficile de faire le bilan, pas adapté aux bénévoles qui changent chaque année

### 3. Fonctionnalités clés (3–4 cartes)
- **Encaissement rapide** — commande en 3 taps, produits gros et lisibles
- **100 % hors-ligne** — fonctionne même sans Wi-Fi ni 4G au terrain
- **Bilan automatique** — totaux, espèces vs carte, quantités par produit
- **Historique complet** — retrouvez les chiffres de n'importe quelle journée passée

### 4. Comment ça marche (étapes)
1. Activez votre licence avec votre code club
2. Configurez vos produits et prix
3. Installez l'app sur votre tablette
4. Encaissez dès le premier match

### 5. Tarif
- Prix simple et honnête : licence annuelle, un seul tarif, pour tout le club
- Mettre en avant : pas d'abonnement mensuel, pas de surprise, renouvellement optionnel
- CTA : "Obtenir une licence"

### 6. Témoignage (placeholder)
- Citation fictive ou vide à remplir : trésorier d'un club de pétanque, 2 lignes max

### 7. Footer
- Nom du produit, lien contact, mention légale minimaliste

---

## Contraintes techniques de la landing

- Page statique HTML/CSS/JS vanilla (pas de framework) — ou Astro si on veut des composants
- Responsive mobile-first
- Pas de tracking analytics pour l'instant
- Formulaire de contact simple (mailto: ou Netlify Forms)
- Hébergée sur le même VPS, sous-domaine `buvette.petanquedutelegraphe.fr` (racine `/`)
- L'app PWA elle-même est à `/app`
