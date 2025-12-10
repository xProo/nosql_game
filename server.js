require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration MongoDB (depuis .env)
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "game_collection_db";
const COLLECTION_NAME = "games";

let db;
let gamesCollection;

// Connexion à MongoDB
async function connectDB() {
    try {
        const client = await MongoClient.connect(MONGODB_URI);
        db = client.db(DB_NAME);
        gamesCollection = db.collection(COLLECTION_NAME);
        console.log('✅ Connecté à MongoDB');
    } catch (error) {
        console.error('❌ Erreur de connexion MongoDB:', error);
        process.exit(1);
    }
}

// Validation des données
function validateGame(data, isUpdate = false) {
    const errors = [];
    const currentYear = new Date().getFullYear();

    if (!isUpdate || data.titre !== undefined) {
        if (!data.titre || typeof data.titre !== 'string' || data.titre.trim().length < 1) {
            errors.push('Le titre est requis et doit être une chaîne non vide');
        }
    }

    if (!isUpdate || data.genre !== undefined) {
        if (!Array.isArray(data.genre) || data.genre.length < 1) {
            errors.push('Le genre est requis et doit contenir au moins un élément');
        }
    }

    if (!isUpdate || data.plateforme !== undefined) {
        if (!Array.isArray(data.plateforme) || data.plateforme.length < 1) {
            errors.push('La plateforme est requise et doit contenir au moins un élément');
        }
    }

    if (data.annee_sortie !== undefined) {
        if (typeof data.annee_sortie !== 'number' || data.annee_sortie < 1970 || data.annee_sortie > currentYear) {
            errors.push(`L'année de sortie doit être entre 1970 et ${currentYear}`);
        }
    }

    if (data.metacritic_score !== undefined) {
        if (typeof data.metacritic_score !== 'number' || data.metacritic_score < 0 || data.metacritic_score > 100) {
            errors.push('Le score Metacritic doit être entre 0 et 100');
        }
    }

    if (data.temps_jeu_heures !== undefined) {
        if (typeof data.temps_jeu_heures !== 'number' || data.temps_jeu_heures < 0) {
            errors.push('Le temps de jeu doit être un nombre positif');
        }
    }

    return errors;
}

// ==================== ROUTES API ====================

// POST /api/games - Ajouter un nouveau jeu
app.post('/api/games', async (req, res) => {
    try {
        const errors = validateGame(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const newGame = {
            titre: req.body.titre.trim(),
            genre: req.body.genre,
            plateforme: req.body.plateforme,
            editeur: req.body.editeur || '',
            developpeur: req.body.developpeur || '',
            annee_sortie: req.body.annee_sortie || null,
            metacritic_score: req.body.metacritic_score || null,
            temps_jeu_heures: req.body.temps_jeu_heures || 0,
            termine: req.body.termine || false,
            favori: false,
            date_ajout: new Date(),
            date_modification: new Date()
        };

        const result = await gamesCollection.insertOne(newGame);
        newGame._id = result.insertedId;

        res.status(201).json({ success: true, data: newGame });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/games - Lister tous les jeux avec filtrage
app.get('/api/games', async (req, res) => {
    try {
        const filter = {};

        // Filtrage par genre
        if (req.query.genre) {
            filter.genre = { $in: [req.query.genre] };
        }

        // Filtrage par plateforme
        if (req.query.plateforme) {
            filter.plateforme = { $in: [req.query.plateforme] };
        }

        // Filtrage par statut terminé
        if (req.query.termine !== undefined) {
            filter.termine = req.query.termine === 'true';
        }

        // Filtrage par favoris
        if (req.query.favori !== undefined) {
            filter.favori = req.query.favori === 'true';
        }

        // Recherche par titre
        if (req.query.search) {
            filter.titre = { $regex: req.query.search, $options: 'i' };
        }

        const games = await gamesCollection.find(filter).sort({ date_ajout: -1 }).toArray();
        res.json({ success: true, count: games.length, data: games });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/games/:id - Obtenir un jeu spécifique
app.get('/api/games/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'ID invalide' });
        }

        const game = await gamesCollection.findOne({ _id: new ObjectId(req.params.id) });
        
        if (!game) {
            return res.status(404).json({ success: false, error: 'Jeu non trouvé' });
        }

        res.json({ success: true, data: game });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/games/:id - Modifier un jeu
app.put('/api/games/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'ID invalide' });
        }

        const errors = validateGame(req.body, true);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const updateData = { ...req.body, date_modification: new Date() };
        delete updateData._id;

        const result = await gamesCollection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ success: false, error: 'Jeu non trouvé' });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/games/:id - Supprimer un jeu
app.delete('/api/games/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'ID invalide' });
        }

        const result = await gamesCollection.deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, error: 'Jeu non trouvé' });
        }

        res.json({ success: true, message: 'Jeu supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/games/:id/favorite - Basculer le statut favori
app.post('/api/games/:id/favorite', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'ID invalide' });
        }

        const game = await gamesCollection.findOne({ _id: new ObjectId(req.params.id) });
        
        if (!game) {
            return res.status(404).json({ success: false, error: 'Jeu non trouvé' });
        }

        const result = await gamesCollection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: { favori: !game.favori, date_modification: new Date() } },
            { returnDocument: 'after' }
        );

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/stats - Statistiques de la collection
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await gamesCollection.aggregate([
            {
                $group: {
                    _id: null,
                    total_jeux: { $sum: 1 },
                    jeux_termines: { $sum: { $cond: ['$termine', 1, 0] } },
                    jeux_favoris: { $sum: { $cond: ['$favori', 1, 0] } },
                    temps_jeu_total: { $sum: '$temps_jeu_heures' },
                    score_moyen: { $avg: '$metacritic_score' }
                }
            }
        ]).toArray();

        const genreStats = await gamesCollection.aggregate([
            { $unwind: '$genre' },
            { $group: { _id: '$genre', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();

        const plateformeStats = await gamesCollection.aggregate([
            { $unwind: '$plateforme' },
            { $group: { _id: '$plateforme', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();

        res.json({
            success: true,
            data: {
                general: stats[0] || {
                    total_jeux: 0,
                    jeux_termines: 0,
                    jeux_favoris: 0,
                    temps_jeu_total: 0,
                    score_moyen: 0
                },
                par_genre: genreStats,
                par_plateforme: plateformeStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/games/export - Exporter les données en JSON
app.get('/api/export', async (req, res) => {
    try {
        const games = await gamesCollection.find({}).toArray();
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=game_collection_export.json');
        res.json({ exported_at: new Date(), total_games: games.length, games });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route principale - Interface graphique
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(` Serveur démarré sur http://localhost:${PORT}`);
        console.log(` API disponible sur http://localhost:${PORT}/api/games`);
    });
});

