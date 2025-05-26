const InscriptionForm = document.querySelector('#inscriptionForm');
const prenomInput = document.querySelector('#inputPrenom');
const nomInput = document.querySelector('#inputNom');
const emailInput = document.querySelector('#inputEmail');
const passwordInput = document.querySelector('#inputPassword');
const confirmPasswordInput = document.querySelector('#confirmPassword');
const mailError = document.querySelector('#mailError');
const passwordError = document.querySelector('#passwordError');
const confirmPasswordError = document.querySelector('#confirmPasswordError');
const submitButton = document.querySelector('#ajoutUsers');
const authAlert = document.createElement('div');

// Vérifier si l'utilisateur est déjà connecté
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const isAuthenticated = await auth.isAuthenticated();
        
        if (isAuthenticated) {
            // Créer une alerte pour informer l'utilisateur
            authAlert.className = 'alert alert-warning';
            authAlert.innerHTML = `
                <p>Vous êtes déjà connecté. Vous n'avez pas besoin de créer un nouveau compte.</p>
                <a href="espaces.html" class="btn btn-primary">Voir les espaces</a>
                <button id="logoutBtn" class="btn btn-outline-secondary ms-2">Se déconnecter</button>
            `;
            
            // Insérer l'alerte avant le formulaire
            InscriptionForm.parentNode.insertBefore(authAlert, InscriptionForm);
            
            // Masquer le formulaire
            InscriptionForm.style.display = 'none';
            
            // Ajouter un écouteur d'événement pour le bouton de déconnexion
            setTimeout(() => {
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    console.log('Ajout de l\'event listener sur le bouton de déconnexion (inscription)');
                    logoutBtn.addEventListener('click', async function(e) {
                        e.preventDefault();
                        console.log('Clic sur le bouton de déconnexion (inscription)');
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
                    console.error('Bouton de déconnexion non trouvé (inscription)');
                }
            }, 100); // Petit délai pour s'assurer que le DOM est prêt
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
    }
});

// Fonction de validation d'email professionnel
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Fonction de validation de mot de passe
function isValidPassword(password) {
    return password.length >= 8;
}

// Fonction de validation de correspondance des mots de passe
function doPasswordsMatch(password, confirmPassword) {
    return password === confirmPassword;
}

// Validation en temps réel pour l'email
emailInput.addEventListener('input', () => {
    const email = emailInput.value;
    if (!isValidEmail(email)) {
        emailInput.classList.add('is-invalid');
        mailError.textContent = 'Veuillez entrer un email valide.';
    } else {
        emailInput.classList.remove('is-invalid');
        emailInput.classList.add('is-valid');
    }
});

// Validation en temps réel pour le mot de passe
passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    if (!isValidPassword(password)) {
        passwordInput.classList.add('is-invalid');
        passwordError.textContent = 'Le mot de passe doit faire au moins 8 caractères.';
    } else {
        passwordInput.classList.remove('is-invalid');
        passwordInput.classList.add('is-valid');
    }
    
    // Vérifier la correspondance si le champ de confirmation est déjà rempli
    if (confirmPasswordInput.value) {
        validatePasswordMatch();
    }
});

// Validation en temps réel pour la confirmation du mot de passe
confirmPasswordInput.addEventListener('input', validatePasswordMatch);

function validatePasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (!doPasswordsMatch(password, confirmPassword)) {
        confirmPasswordInput.classList.add('is-invalid');
        confirmPasswordError.textContent = 'Les mots de passe ne correspondent pas.';
    } else {
        confirmPasswordInput.classList.remove('is-invalid');
        confirmPasswordInput.classList.add('is-valid');
    }
}

// Fonction d'inscription
async function registerUser() {
    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    console.log('Vérification des données du formulaire:');
    console.log('Prénom:', prenom);
    console.log('Nom:', nom);
    console.log('Email:', email);
    console.log('Mot de passe rempli:', password ? 'Oui' : 'Non');
    console.log('Confirmation mot de passe remplie:', confirmPassword ? 'Oui' : 'Non');
    console.log('Mots de passe identiques:', password === confirmPassword ? 'Oui' : 'Non');
    
    // Vérification des champs
    if (!prenom || !nom || !email || !password || !confirmPassword) {
        console.error('Erreur: Tous les champs sont obligatoires');
        return { success: false, message: 'Tous les champs sont obligatoires' };
    }
    
    if (!isValidEmail(email)) {
        console.error('Erreur: Format d\'email invalide');
        return { success: false, message: 'Format d\'email invalide' };
    }
    
    if (!isValidPassword(password)) {
        console.error('Erreur: Le mot de passe doit faire au moins 8 caractères');
        return { success: false, message: 'Le mot de passe doit faire au moins 8 caractères' };
    }
    
    if (password !== confirmPassword) {
        console.error('Erreur: Les mots de passe ne correspondent pas');
        return { success: false, message: 'Les mots de passe ne correspondent pas' };
    }
    
    try {
        console.log('Appel de l\'API d\'inscription avec les données validées');
        // Appel à l'API d'inscription
        const result = await inscription.setUsers(prenom, nom, email, password);
        console.log('Résultat de l\'inscription:', result);
        return result;
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        return { success: false, message: 'Erreur technique lors de l\'inscription' };
    }
}

// Gestionnaire d'événement pour la soumission du formulaire
InscriptionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Désactiver le bouton pendant le traitement
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Traitement...';
    
    const result = await registerUser();
    
    // Réactiver le bouton
    submitButton.disabled = false;
    submitButton.textContent = 'Créer son compte';
    
    if (result.success) {
        // Afficher un message de succès
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success mt-3';
        alertDiv.textContent = 'Inscription réussie ! Redirection vers la page de connexion...';
        InscriptionForm.insertAdjacentElement('beforebegin', alertDiv);
        
        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
            window.location.href = 'connexion.html';
        }, 2000);
    } else {
        // Afficher un message d'erreur
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger mt-3';
        alertDiv.textContent = result.message || 'Erreur lors de l\'inscription';
        InscriptionForm.insertAdjacentElement('beforebegin', alertDiv);
    }
});