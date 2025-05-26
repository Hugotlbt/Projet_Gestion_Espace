// Éléments du DOM
const espacesContainer = document.getElementById('espaces-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorContainer = document.getElementById('error-container');
const authAlert = document.getElementById('auth-alert');

// Vérifier si l'utilisateur est connecté
let isAuthenticated = false;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Vérifier l'authentification
        isAuthenticated = await auth.isAuthenticated();
        
        // Afficher ou masquer l'alerte d'authentification
        authAlert.style.display = isAuthenticated ? 'none' : 'block';
        
        // Charger les espaces
        await loadEspaces();
    } catch (error) {
        console.error('Erreur lors du chargement initial:', error);
        showError('Une erreur est survenue lors du chargement de la page.');
    }
});

// Fonction pour charger tous les espaces
async function loadEspaces() {
    try {
        // Afficher le spinner de chargement
        loadingSpinner.style.display = 'flex';
        espacesContainer.style.display = 'none';
        errorContainer.style.display = 'none';
        
        // Récupérer les espaces depuis l'API
        const result = await espaces.getAll();
        
        if (result.success) {
            // Afficher les espaces
            displayEspaces(result.espaces);
        } else {
            // Afficher un message d'erreur
            showError(result.message || 'Impossible de récupérer les espaces.');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des espaces:', error);
        showError('Une erreur est survenue lors du chargement des espaces.');
    } finally {
        // Masquer le spinner de chargement
        loadingSpinner.style.display = 'none';
    }
}

// Fonction pour afficher les espaces
function displayEspaces(espaces) {
    // Vider le conteneur
    espacesContainer.innerHTML = '';
    
    if (espaces.length === 0) {
        // Aucun espace trouvé
        espacesContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">Aucun espace de réunion disponible.</div></div>';
        espacesContainer.style.display = 'block';
        return;
    }
    
    // Créer une carte pour chaque espace
    espaces.forEach(espace => {
        const equipements = espace.equipement.split(',').map(item => item.trim());
        
        const espaceCard = document.createElement('div');
        espaceCard.className = 'col-md-4';
        espaceCard.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${espace.nom_espace}</h5>
                    <p class="space-capacity"><i class="bi bi-people-fill"></i> Capacité: ${espace.capacite} personnes</p>
                    <div class="mb-3">
                        ${equipements.map(equipement => 
                            `<span class="badge bg-secondary equipment-badge">${equipement}</span>`
                        ).join('')}
                    </div>
                    <p class="card-text">${espace.description.substring(0, 100)}${espace.description.length > 100 ? '...' : ''}</p>
                </div>
                <div class="card-footer">
                    <a href="espace-details.html?id=${espace.id_espace}" class="btn btn-primary ${isAuthenticated ? '' : 'disabled'}" 
                       ${!isAuthenticated ? 'data-bs-toggle="tooltip" title="Connectez-vous pour voir les détails"' : ''}>
                        Voir les détails
                    </a>
                </div>
            </div>
        `;
        
        espacesContainer.appendChild(espaceCard);
    });
    
    // Afficher le conteneur
    espacesContainer.style.display = 'flex';
}

// Fonction pour afficher un message d'erreur
function showError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    espacesContainer.style.display = 'none';
}
