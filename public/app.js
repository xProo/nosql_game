// Configuration API
const API_URL = '/api';

// État de l'application
let games = [];
let genres = new Set();
let plateformes = new Set();

// Éléments DOM
const gamesGrid = document.getElementById('games-grid');
const emptyState = document.getElementById('empty-state');
const gameModal = document.getElementById('game-modal');
const gameForm = document.getElementById('game-form');
const searchInput = document.getElementById('search-input');
const filterGenre = document.getElementById('filter-genre');
const filterPlateforme = document.getElementById('filter-plateforme');
const filterStatus = document.getElementById('filter-status');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadGames();
    setupEventListeners();
});

// Configuration des événements
function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Boutons
    document.getElementById('btn-add-game').addEventListener('click', openAddModal);
    document.getElementById('btn-export').addEventListener('click', exportGames);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('btn-cancel').addEventListener('click', closeModal);

    // Formulaire
    gameForm.addEventListener('submit', handleFormSubmit);

    // Filtres et recherche
    searchInput.addEventListener('input', debounce(filterGames, 300));
    filterGenre.addEventListener('change', filterGames);
    filterPlateforme.addEventListener('change', filterGames);
    filterStatus.addEventListener('change', filterGames);

    // Fermer modal en cliquant à l'extérieur
    gameModal.addEventListener('click', (e) => {
        if (e.target === gameModal) closeModal();
    });
}

// Chargement des jeux
async function loadGames() {
    try {
        const response = await fetch(`${API_URL}/games`);
        const data = await response.json();
        
        if (data.success) {
            games = data.data;
            updateFilters();
            renderGames(games);
            loadStats();
        }
    } catch (error) {
        showToast('Erreur de chargement des jeux', 'error');
        console.error(error);
    }
}

// Mise à jour des filtres
function updateFilters() {
    genres.clear();
    plateformes.clear();

    games.forEach(game => {
        game.genre.forEach(g => genres.add(g));
        game.plateforme.forEach(p => plateformes.add(p));
    });

    // Mise à jour des options de genre
    filterGenre.innerHTML = '<option value="">Tous les genres</option>';
    [...genres].sort().forEach(g => {
        filterGenre.innerHTML += `<option value="${g}">${g}</option>`;
    });

    // Mise à jour des options de plateforme
    filterPlateforme.innerHTML = '<option value="">Toutes les plateformes</option>';
    [...plateformes].sort().forEach(p => {
        filterPlateforme.innerHTML += `<option value="${p}">${p}</option>`;
    });
}

// Filtrage des jeux
function filterGames() {
    const search = searchInput.value.toLowerCase();
    const genre = filterGenre.value;
    const plateforme = filterPlateforme.value;
    const status = filterStatus.value;

    let filtered = games.filter(game => {
        // Recherche par titre
        if (search && !game.titre.toLowerCase().includes(search)) {
            return false;
        }

        // Filtre par genre
        if (genre && !game.genre.includes(genre)) {
            return false;
        }

        // Filtre par plateforme
        if (plateforme && !game.plateforme.includes(plateforme)) {
            return false;
        }

        // Filtre par statut
        if (status) {
            if (status === 'termine-true' && !game.termine) return false;
            if (status === 'termine-false' && game.termine) return false;
            if (status === 'favori-true' && !game.favori) return false;
        }

        return true;
    });

    renderGames(filtered);
}

// Rendu des jeux
function renderGames(gamesToRender) {
    if (gamesToRender.length === 0) {
        gamesGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    gamesGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    gamesGrid.innerHTML = gamesToRender.map(game => createGameCard(game)).join('');

    // Ajouter les événements aux boutons
    document.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    document.querySelectorAll('.action-btn.favorite').forEach(btn => {
        btn.addEventListener('click', () => toggleFavorite(btn.dataset.id));
    });

    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => deleteGame(btn.dataset.id));
    });
}

// Création d'une carte de jeu
function createGameCard(game) {
    const scoreClass = game.metacritic_score >= 75 ? 'score-high' : 
                       game.metacritic_score >= 50 ? 'score-mid' : 'score-low';

    return `
        <div class="game-card">
            <div class="game-card-header">
                <h3 class="game-title">${escapeHtml(game.titre)}</h3>
                <div class="game-meta">
                    ${game.genre.slice(0, 3).map(g => `<span class="game-badge genre">${escapeHtml(g)}</span>`).join('')}
                </div>
            </div>
            <div class="game-card-body">
                <div class="game-info">
                    <div class="info-item">
                        <span class="info-label">Développeur</span>
                        <span class="info-value">${escapeHtml(game.developpeur || '-')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Année</span>
                        <span class="info-value">${game.annee_sortie || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Temps de jeu</span>
                        <span class="info-value">${game.temps_jeu_heures || 0}h</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Score</span>
                        ${game.metacritic_score !== null ? 
                            `<span class="game-score ${scoreClass}">${game.metacritic_score}/100</span>` : 
                            '<span class="info-value">-</span>'}
                    </div>
                </div>
                <div class="game-meta">
                    ${game.plateforme.map(p => `<span class="game-badge platform">${escapeHtml(p)}</span>`).join('')}
                </div>
            </div>
            <div class="game-card-footer">
                <div class="game-status">
                    <span class="status-badge ${game.termine ? 'status-completed' : 'status-playing'}">
                        ${game.termine ? '✅ Terminé' : '🎮 En cours'}
                    </span>
                </div>
                <div class="game-actions">
                    <button class="action-btn favorite ${game.favori ? 'active' : ''}" data-id="${game._id}" title="Favori">
                        ${game.favori ? '⭐' : '☆'}
                    </button>
                    <button class="action-btn edit" data-id="${game._id}" title="Modifier">✏️</button>
                    <button class="action-btn delete" data-id="${game._id}" title="Supprimer">🗑️</button>
                </div>
            </div>
        </div>
    `;
}

// Ouvrir modal d'ajout
function openAddModal() {
    document.getElementById('modal-title').textContent = 'Ajouter un jeu';
    document.getElementById('game-id').value = '';
    gameForm.reset();
    gameModal.classList.add('active');
}

// Ouvrir modal de modification
function openEditModal(id) {
    const game = games.find(g => g._id === id);
    if (!game) return;

    document.getElementById('modal-title').textContent = 'Modifier le jeu';
    document.getElementById('game-id').value = game._id;
    document.getElementById('titre').value = game.titre;
    document.getElementById('genre').value = game.genre.join(', ');
    document.getElementById('plateforme').value = game.plateforme.join(', ');
    document.getElementById('editeur').value = game.editeur || '';
    document.getElementById('developpeur').value = game.developpeur || '';
    document.getElementById('annee_sortie').value = game.annee_sortie || '';
    document.getElementById('metacritic_score').value = game.metacritic_score || '';
    document.getElementById('temps_jeu_heures').value = game.temps_jeu_heures || '';
    document.getElementById('termine').checked = game.termine;

    gameModal.classList.add('active');
}

// Fermer modal
function closeModal() {
    gameModal.classList.remove('active');
}

// Gestion du formulaire
async function handleFormSubmit(e) {
    e.preventDefault();

    const gameId = document.getElementById('game-id').value;
    const gameData = {
        titre: document.getElementById('titre').value.trim(),
        genre: document.getElementById('genre').value.split(',').map(g => g.trim()).filter(g => g),
        plateforme: document.getElementById('plateforme').value.split(',').map(p => p.trim()).filter(p => p),
        editeur: document.getElementById('editeur').value.trim(),
        developpeur: document.getElementById('developpeur').value.trim(),
        annee_sortie: parseInt(document.getElementById('annee_sortie').value) || null,
        metacritic_score: parseInt(document.getElementById('metacritic_score').value) || null,
        temps_jeu_heures: parseFloat(document.getElementById('temps_jeu_heures').value) || 0,
        termine: document.getElementById('termine').checked
    };

    try {
        const url = gameId ? `${API_URL}/games/${gameId}` : `${API_URL}/games`;
        const method = gameId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameData)
        });

        const data = await response.json();

        if (data.success) {
            showToast(gameId ? 'Jeu modifié avec succès' : 'Jeu ajouté avec succès', 'success');
            closeModal();
            loadGames();
        } else {
            showToast(data.errors?.join(', ') || data.error, 'error');
        }
    } catch (error) {
        showToast('Erreur lors de la sauvegarde', 'error');
        console.error(error);
    }
}

// Basculer favori
async function toggleFavorite(id) {
    try {
        const response = await fetch(`${API_URL}/games/${id}/favorite`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            const game = games.find(g => g._id === id);
            if (game) {
                game.favori = data.data.favori;
                renderGames(games);
                showToast(game.favori ? 'Ajouté aux favoris' : 'Retiré des favoris', 'success');
            }
        }
    } catch (error) {
        showToast('Erreur lors de la mise à jour', 'error');
    }
}

// Supprimer un jeu
async function deleteGame(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce jeu ?')) return;

    try {
        const response = await fetch(`${API_URL}/games/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('Jeu supprimé avec succès', 'success');
            loadGames();
        }
    } catch (error) {
        showToast('Erreur lors de la suppression', 'error');
    }
}

// Exporter les jeux
async function exportGames() {
    try {
        window.location.href = `${API_URL}/export`;
        showToast('Export en cours...', 'success');
    } catch (error) {
        showToast('Erreur lors de l\'export', 'error');
    }
}

// Charger les statistiques
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();

        if (data.success) {
            const stats = data.data;
            
            // Mise à jour des cartes de stats
            document.getElementById('stat-total').textContent = stats.general.total_jeux || 0;
            document.getElementById('stat-completed').textContent = stats.general.jeux_termines || 0;
            document.getElementById('stat-favorites').textContent = stats.general.jeux_favoris || 0;
            document.getElementById('stat-playtime').textContent = `${stats.general.temps_jeu_total || 0}h`;
            document.getElementById('stat-avg-score').textContent = 
                stats.general.score_moyen ? Math.round(stats.general.score_moyen) : '-';

            // Graphique des genres
            renderChart('genre-chart', stats.par_genre, stats.general.total_jeux);

            // Graphique des plateformes
            renderChart('platform-chart', stats.par_plateforme, stats.general.total_jeux);
        }
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// Rendu d'un graphique en barres
function renderChart(containerId, data, total) {
    const container = document.getElementById(containerId);
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">Aucune donnée</p>';
        return;
    }

    const maxCount = Math.max(...data.map(d => d.count));

    container.innerHTML = data.slice(0, 6).map(item => `
        <div class="chart-bar">
            <span class="chart-bar-label">${escapeHtml(item._id)}</span>
            <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${(item.count / maxCount) * 100}%">
                    <span class="chart-bar-value">${item.count}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Changer d'onglet
function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    if (tabName === 'stats') {
        loadStats();
    }
}

// Afficher une notification toast
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Utilitaires
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

