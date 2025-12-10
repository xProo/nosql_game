# 🎮 Game Collection API

API RESTful pour gérer une collection de jeux vidéo avec une interface graphique moderne.

## 📋 Prérequis

- **Node.js** (v16 ou supérieur)
- **MongoDB** (v6 ou supérieur) - doit être en cours d'exécution sur `localhost:27017`

## 🚀 Installation

1. **Ouvrez un terminal dans le dossier du projet** :
```bash
cd GameCollectionAPI
```

2. **Installez les dépendances** :
```bash
npm install
```

3. **Assurez-vous que MongoDB est lancé** :
   - Windows : Vérifiez que le service MongoDB est démarré
   - Ou lancez MongoDB manuellement

4. **Démarrez le serveur** :
```bash
npm start
```

5. **Ouvrez votre navigateur** :
```
http://localhost:3000
```

## 📡 Endpoints API

### CRUD de base

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/games` | Ajouter un nouveau jeu |
| `GET` | `/api/games` | Lister tous les jeux |
| `GET` | `/api/games/:id` | Obtenir un jeu spécifique |
| `PUT` | `/api/games/:id` | Modifier un jeu |
| `DELETE` | `/api/games/:id` | Supprimer un jeu |

### Fonctionnalités avancées

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/games/:id/favorite` | Basculer le statut favori |
| `GET` | `/api/stats` | Statistiques de la collection |
| `GET` | `/api/export` | Exporter les données en JSON |

### Filtrage et recherche

```
GET /api/games?genre=RPG
GET /api/games?plateforme=PC
GET /api/games?termine=true
GET /api/games?favori=true
GET /api/games?search=zelda
```

## 📝 Structure d'un jeu

```json
{
  "titre": "The Legend of Zelda: Breath of the Wild",
  "genre": ["Action", "Aventure", "RPG"],
  "plateforme": ["Nintendo Switch"],
  "editeur": "Nintendo",
  "developpeur": "Nintendo EPD",
  "annee_sortie": 2017,
  "metacritic_score": 97,
  "temps_jeu_heures": 85,
  "termine": true
}
```

## 🎨 Fonctionnalités de l'interface

- ✅ Ajout/modification/suppression de jeux
- ✅ Recherche en temps réel
- ✅ Filtrage par genre, plateforme, statut
- ✅ Système de favoris
- ✅ Statistiques détaillées
- ✅ Export des données
- ✅ Design moderne et responsive

## 🛠️ Technologies utilisées

- **Backend** : Node.js, Express.js
- **Base de données** : MongoDB
- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **Fonts** : Orbitron, Rajdhani (Google Fonts)

## 📁 Structure du projet

```
GameCollectionAPI/
├── server.js          # Serveur Express et routes API
├── package.json       # Dépendances npm
├── README.md          # Documentation
└── public/
    ├── index.html     # Page principale
    ├── style.css      # Styles CSS
    └── app.js         # Logique JavaScript
```

