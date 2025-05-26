// Vérifier l'authentification de l'utilisateur
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const isAuthenticated = await auth.isAuthenticated();
        
        // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
        if (!isAuthenticated) {
            window.location.href = 'connexion.html';
            return;
        }
        
        // Récupérer les informations de l'utilisateur connecté
        const user = await connexion.getCurrentUser();
        
        // Afficher les informations de l'utilisateur
        displayUserInfo(user);
        
        // Ajouter le bouton de déconnexion au menu
        addLogoutButton();
        
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
    }
});

// Fonction pour afficher les informations de l'utilisateur
function displayUserInfo(user) {
    if (!user) return;
    
    const mainElement = document.querySelector('main');
    
    if (mainElement) {
        // Créer un élément pour afficher les informations de l'utilisateur
        const userInfoDiv = document.createElement('div');
        userInfoDiv.className = 'user-info mt-4';
        userInfoDiv.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Bienvenue ${user.prenom} ${user.nom}</h5>
                    <p class="card-text">Vous êtes connecté avec l'email: ${user.email}</p>
                </div>
            </div>
        `;
        
        // Ajouter l'élément après le contenu principal
        mainElement.insertAdjacentElement('afterend', userInfoDiv);
    }
}

// Fonction pour ajouter le bouton de déconnexion
function addLogoutButton() {
    const container = document.querySelector('.container');
    
    if (container) {
        const logoutButton = document.createElement('button');
        logoutButton.id = 'logoutButton';
        logoutButton.className = 'btn btn-danger mt-4';
        logoutButton.textContent = 'Déconnexion';
        
        // Ajouter le gestionnaire d'événement pour la déconnexion
        logoutButton.addEventListener('click', async () => {
            try {
                // Appeler l'API de déconnexion
                const result = await connexion.logout();
                
                if (result.success) {
                    // Rediriger vers la page de connexion
                    window.location.href = 'connexion.html';
                }
            } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
            }
        });
        
        // Ajouter le bouton à la fin du conteneur
        container.appendChild(logoutButton);
    }
}