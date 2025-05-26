// Éléments du DOM
const espaceDetails = document.getElementById('espace-details');
const loadingSpinner = document.getElementById('loading-spinner');
const errorContainer = document.getElementById('error-container');
const authAlert = document.getElementById('auth-alert');

// Éléments pour afficher les détails de l'espace
const espaceNom = document.getElementById('espace-nom');
const espaceDescription = document.getElementById('espace-description');
const espaceEquipements = document.getElementById('espace-equipements');
const espaceCapacite = document.getElementById('espace-capacite');

// Éléments du formulaire de réservation
const reservationForm = document.getElementById('reservation-form');
const reservationDate = document.getElementById('reservation-date');
const reservationStart = document.getElementById('reservation-start');
const reservationEnd = document.getElementById('reservation-end');
const dateFeedback = document.getElementById('date-feedback');
const startFeedback = document.getElementById('start-feedback');
const endFeedback = document.getElementById('end-feedback');
const conflictAlert = document.getElementById('conflict-alert');
const reservationBtn = document.getElementById('reservation-btn');

// Variable pour stocker l'ID de l'espace
let currentEspaceId = null;

// Récupérer l'ID de l'espace depuis l'URL
function getEspaceIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Vérifier l'authentification
        const isAuthenticated = await auth.isAuthenticated();
        
        if (!isAuthenticated) {
            // L'utilisateur n'est pas connecté, afficher l'alerte
            authAlert.style.display = 'block';
            loadingSpinner.style.display = 'none';
            return;
        }
        
        // Récupérer l'ID de l'espace
        const espaceId = getEspaceIdFromUrl();
        
        if (!espaceId) {
            // Aucun ID d'espace spécifié
            showError('Aucun espace spécifié.');
            return;
        }
        
        // Charger les détails de l'espace
        await loadEspaceDetails(espaceId);
    } catch (error) {
        console.error('Erreur lors du chargement initial:', error);
        showError('Une erreur est survenue lors du chargement de la page.');
    }
});

// Fonction pour charger les détails d'un espace
async function loadEspaceDetails(espaceId) {
    try {
        // Afficher le spinner de chargement
        loadingSpinner.style.display = 'flex';
        espaceDetails.style.display = 'none';
        errorContainer.style.display = 'none';
        
        // Récupérer les détails de l'espace depuis l'API
        const result = await espaces.getById(espaceId);
        
        if (result.success) {
            // Afficher les détails de l'espace
            displayEspaceDetails(result.espace);
        } else {
            // Afficher un message d'erreur
            showError(result.message || 'Impossible de récupérer les détails de l\'espace.');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des détails de l\'espace:', error);
        showError('Une erreur est survenue lors du chargement des détails de l\'espace.');
    } finally {
        // Masquer le spinner de chargement
        loadingSpinner.style.display = 'none';
    }
}

// Fonction pour afficher les détails d'un espace
function displayEspaceDetails(espace) {
    // Stocker l'ID de l'espace pour la réservation
    currentEspaceId = espace.id_espace;
    
    // Définir le titre de la page
    document.title = `${espace.nom_espace} - Détails de l'espace`;
    
    // Remplir les éléments avec les détails de l'espace
    espaceNom.textContent = espace.nom_espace;
    espaceDescription.textContent = espace.description;
    espaceCapacite.textContent = espace.capacite;
    
    // Afficher les équipements
    const equipements = espace.equipement.split(',').map(item => item.trim());
    espaceEquipements.innerHTML = equipements.map(equipement => 
        `<span class="badge bg-primary equipment-badge">${equipement}</span>`
    ).join('');
    
    // Initialiser le formulaire de réservation
    initReservationForm();
    
    // Afficher les détails
    espaceDetails.style.display = 'block';
}

// Initialiser le formulaire de réservation
function initReservationForm() {
    // Définir la date minimale à aujourd'hui
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    reservationDate.min = formattedDate;
    
    // Définir la date par défaut à aujourd'hui
    reservationDate.value = formattedDate;
    
    // Définir les heures par défaut
    reservationStart.value = '09:00';
    reservationEnd.value = '10:00';
    
    // Ajouter les écouteurs d'événements pour la validation en temps réel
    reservationDate.addEventListener('input', validateDate);
    reservationStart.addEventListener('input', validateTime);
    reservationEnd.addEventListener('input', validateTime);
    
    // Ajouter l'écouteur d'événement pour la soumission du formulaire
    reservationForm.addEventListener('submit', handleReservationSubmit);
}

// Valider la date
function validateDate() {
    const selectedDate = new Date(reservationDate.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        reservationDate.classList.add('is-invalid');
        dateFeedback.textContent = 'La date doit être aujourd\'hui ou dans le futur.';
        return false;
    } else {
        reservationDate.classList.remove('is-invalid');
        reservationDate.classList.add('is-valid');
        return true;
    }
}

// Valider les heures
function validateTime() {
    const start = reservationStart.value;
    const end = reservationEnd.value;
    
    let isValid = true;
    
    // Vérifier que l'heure de début est remplie
    if (!start) {
        reservationStart.classList.add('is-invalid');
        startFeedback.textContent = 'Veuillez sélectionner une heure de début.';
        isValid = false;
    } else {
        reservationStart.classList.remove('is-invalid');
        reservationStart.classList.add('is-valid');
    }
    
    // Vérifier que l'heure de fin est remplie
    if (!end) {
        reservationEnd.classList.add('is-invalid');
        endFeedback.textContent = 'Veuillez sélectionner une heure de fin.';
        isValid = false;
    } else {
        reservationEnd.classList.remove('is-invalid');
    }
    
    // Vérifier que l'heure de fin est postérieure à l'heure de début
    if (start && end && end <= start) {
        reservationEnd.classList.add('is-invalid');
        endFeedback.textContent = 'L\'heure de fin doit être postérieure à l\'heure de début.';
        isValid = false;
    } else if (end) {
        reservationEnd.classList.add('is-valid');
    }
    
    return isValid;
}

// Vérifier les conflits de réservation
async function checkConflicts() {
    try {
        // Construire les dates de début et de fin
        const dateStr = reservationDate.value;
        const startStr = reservationStart.value;
        const endStr = reservationEnd.value;
        
        const debut = `${dateStr}T${startStr}:00`;
        const fin = `${dateStr}T${endStr}:00`;
        
        // Vérifier les conflits
        const result = await reservations.checkConflicts(currentEspaceId, debut, fin);
        
        if (result.success && result.hasConflicts) {
            conflictAlert.style.display = 'block';
            return true;
        } else {
            conflictAlert.style.display = 'none';
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de la vérification des conflits:', error);
        return false;
    }
}

// Gérer la soumission du formulaire de réservation
async function handleReservationSubmit(event) {
    event.preventDefault();
    
    // Valider le formulaire
    const isDateValid = validateDate();
    const isTimeValid = validateTime();
    
    if (!isDateValid || !isTimeValid) {
        return;
    }
    
    // Vérifier les conflits
    const hasConflicts = await checkConflicts();
    if (hasConflicts) {
        return;
    }
    
    // Désactiver le bouton pendant le traitement
    reservationBtn.disabled = true;
    reservationBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Traitement...';
    
    try {
        // Construire les dates de début et de fin
        const dateStr = reservationDate.value;
        const startStr = reservationStart.value;
        const endStr = reservationEnd.value;
        
        const debut = `${dateStr}T${startStr}:00`;
        const fin = `${dateStr}T${endStr}:00`;
        
        // Créer la réservation
        const result = await reservations.create(currentEspaceId, debut, fin);
        
        if (result.success) {
            // Afficher un message de succès
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-success mt-3';
            alertDiv.textContent = 'Réservation créée avec succès ! Redirection vers vos réservations...';
            reservationForm.insertAdjacentElement('beforebegin', alertDiv);
            
            // Rediriger vers la page des réservations après 2 secondes
            setTimeout(() => {
                window.location.href = 'reservations.html';
            }, 2000);
        } else {
            // Afficher un message d'erreur
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger mt-3';
            alertDiv.textContent = result.message || 'Erreur lors de la création de la réservation';
            reservationForm.insertAdjacentElement('beforebegin', alertDiv);
            
            // Réactiver le bouton
            reservationBtn.disabled = false;
            reservationBtn.textContent = 'Réserver cet espace';
        }
    } catch (error) {
        console.error('Erreur lors de la création de la réservation:', error);
        
        // Afficher un message d'erreur
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger mt-3';
        alertDiv.textContent = 'Erreur technique lors de la création de la réservation';
        reservationForm.insertAdjacentElement('beforebegin', alertDiv);
        
        // Réactiver le bouton
        reservationBtn.disabled = false;
        reservationBtn.textContent = 'Réserver cet espace';
    }
}

// Fonction pour afficher un message d'erreur
function showError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    espaceDetails.style.display = 'none';
}
