// Sélection des éléments du formulaire
const loginForm = document.querySelector('.form-signin');
const emailInput = document.querySelector('#inputEmail');
const passwordInput = document.querySelector('#inputPassword');
const submitButton = document.querySelector('#loginButton');
const errorAlert = document.querySelector('#loginError');

// Vérifier si l'utilisateur est déjà connecté
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const isAuthenticated = await auth.isAuthenticated();
        if (isAuthenticated) {
            // Créer une alerte pour informer l'utilisateur
            const authAlert = document.createElement('div');
            authAlert.className = 'alert alert-info';
            authAlert.innerHTML = `
                <p>Vous êtes déjà connecté.</p>
                <a href="espaces.html" class="btn btn-primary">Voir les espaces</a>
                <button id="logoutBtn" class="btn btn-outline-secondary ms-2">Se déconnecter</button>
            `;
            
            // Insérer l'alerte avant le formulaire
            loginForm.parentNode.insertBefore(authAlert, loginForm);
            
            // Masquer le formulaire
            loginForm.style.display = 'none';
            
            // Ajouter un écouteur d'événement pour le bouton de déconnexion
            setTimeout(() => {
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    console.log('Ajout de l\'event listener sur le bouton de déconnexion (connexion)');
                    logoutBtn.addEventListener('click', async function(e) {
                        e.preventDefault();
                        console.log('Clic sur le bouton de déconnexion (connexion)');
                        try {
                            // Utiliser l'API connexion au lieu de auth pour la déconnexion
                            await connexion.logout();
                            console.log('Déconnexion réussie, rechargement de la page');
                            window.location.reload();
                        } catch (error) {
                            console.error('Erreur lors de la déconnexion:', error);
                            alert('Erreur lors de la déconnexion. Veuillez réessayer.');
                        }
                    });
                } else {
                    console.error('Bouton de déconnexion non trouvé (connexion)');
                }
            }, 100); // Petit délai pour s'assurer que le DOM est prêt
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
    }
});

// Fonction de validation d'email
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Validation en temps réel pour l'email
emailInput.addEventListener('input', () => {
    const email = emailInput.value;
    if (!isValidEmail(email)) {
        emailInput.classList.add('is-invalid');
    } else {
        emailInput.classList.remove('is-invalid');
        emailInput.classList.add('is-valid');
    }
});

// Validation en temps réel pour le mot de passe
passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    if (!password) {
        passwordInput.classList.add('is-invalid');
    } else {
        passwordInput.classList.remove('is-invalid');
        passwordInput.classList.add('is-valid');
    }
});

// Fonction de connexion
async function loginUser() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Vérification des champs
    if (!email || !password) {
        return { success: false, message: 'Tous les champs sont obligatoires' };
    }
    
    if (!isValidEmail(email)) {
        return { success: false, message: 'Format d\'email invalide' };
    }
    
    try {
        // Appel à l'API de connexion
        const result = await connexion.login(email, password);
        return result;
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        return { success: false, message: 'Erreur technique lors de la connexion' };
    }
}

// Gestionnaire d'événement pour la soumission du formulaire
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Masquer les messages d'erreur précédents
    if (errorAlert) {
        errorAlert.style.display = 'none';
    }
    
    // Désactiver le bouton pendant le traitement
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connexion...';
    
    const result = await loginUser();
    
    // Réactiver le bouton
    submitButton.disabled = false;
    submitButton.textContent = 'Se connecter';
    
    if (result.success) {
        // Rediriger vers la page d'accueil
        window.location.href = 'index.html';
    } else {
        // Afficher un message d'erreur
        if (!errorAlert) {
            const alertDiv = document.createElement('div');
            alertDiv.id = 'loginError';
            alertDiv.className = 'alert alert-danger mt-3';
            alertDiv.textContent = result.message || 'Email ou mot de passe incorrect';
            loginForm.insertAdjacentElement('beforebegin', alertDiv);
        } else {
            errorAlert.style.display = 'block';
            errorAlert.textContent = result.message || 'Email ou mot de passe incorrect';
        }
    }
});