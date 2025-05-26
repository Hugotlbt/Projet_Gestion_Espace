// Éléments du DOM
const reservationsContainer = document.getElementById('reservations-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorContainer = document.getElementById('error-container');
const authAlert = document.getElementById('auth-alert');
const noReservations = document.getElementById('no-reservations');

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
        
        // Charger les réservations
        await loadReservations();
    } catch (error) {
        console.error('Erreur lors du chargement initial:', error);
        showError('Une erreur est survenue lors du chargement de la page.');
    }
});

// Fonction pour charger les réservations
async function loadReservations() {
    try {
        // Afficher le spinner de chargement
        loadingSpinner.style.display = 'flex';
        reservationsContainer.style.display = 'none';
        errorContainer.style.display = 'none';
        noReservations.style.display = 'none';
        
        // Récupérer les réservations depuis l'API
        const result = await reservations.getUserReservations();
        
        if (result.success) {
            // Afficher les réservations
            displayReservations(result.reservations);
        } else {
            // Afficher un message d'erreur
            showError(result.message || 'Impossible de récupérer vos réservations.');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des réservations:', error);
        showError('Une erreur est survenue lors du chargement des réservations.');
    } finally {
        // Masquer le spinner de chargement
        loadingSpinner.style.display = 'none';
    }
}

// Fonction pour afficher les réservations
function displayReservations(reservationsList) {
    // Vider le conteneur
    reservationsContainer.innerHTML = '';
    
    if (reservationsList.length === 0) {
        // Aucune réservation trouvée
        noReservations.style.display = 'block';
        return;
    }
    
    // Créer une carte pour chaque réservation
    reservationsList.forEach(reservation => {
        // Formater les dates
        const debutDate = new Date(reservation.reservation_debut);
        const finDate = new Date(reservation.reservation_fin);
        
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        
        const formattedDate = debutDate.toLocaleDateString('fr-FR', dateOptions);
        const formattedStartTime = debutDate.toLocaleTimeString('fr-FR', timeOptions);
        const formattedEndTime = finDate.toLocaleTimeString('fr-FR', timeOptions);
        
        // Déterminer la classe de badge en fonction du statut
        let statusClass = 'bg-secondary';
        if (reservation.statut === 'confirmée') {
            statusClass = 'bg-success';
        } else if (reservation.statut === 'en attente') {
            statusClass = 'bg-warning text-dark';
        } else if (reservation.statut === 'annulée') {
            statusClass = 'bg-danger';
        }
        
        const reservationCard = document.createElement('div');
        reservationCard.className = 'col-md-6 col-lg-4';
        reservationCard.innerHTML = `
            <div class="card reservation-card h-100">
                <div class="card-body">
                    <span class="badge ${statusClass} status-badge">${reservation.statut}</span>
                    <h5 class="card-title">${reservation.nom_espace}</h5>
                    
                    <div class="reservation-details">
                        <p><i class="bi bi-calendar-date"></i> ${formattedDate}</p>
                        <p><i class="bi bi-clock"></i> De ${formattedStartTime} à ${formattedEndTime}</p>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-outline-danger cancel-reservation-btn" data-id="${reservation.id_reservation}" ${reservation.statut === 'annulée' ? 'disabled' : ''}>
                        Annuler la réservation
                    </button>
                </div>
            </div>
        `;
        
        reservationsContainer.appendChild(reservationCard);
    });
    
    // Ajouter les écouteurs d'événements pour les boutons d'annulation
    const cancelButtons = document.querySelectorAll('.cancel-reservation-btn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const reservationId = event.target.dataset.id;
            if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
                try {
                    // Désactiver le bouton pendant le traitement
                    button.disabled = true;
                    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Annulation...';
                    
                    // Appeler l'API pour annuler la réservation
                    const result = await reservations.cancel(reservationId);
                    
                    if (result.success) {
                        // Mettre à jour l'affichage de la réservation
                        const card = button.closest('.reservation-card');
                        const statusBadge = card.querySelector('.status-badge');
                        
                        // Mettre à jour le badge de statut
                        statusBadge.classList.remove('bg-warning', 'bg-success', 'text-dark');
                        statusBadge.classList.add('bg-danger');
                        statusBadge.textContent = 'annulée';
                        
                        // Désactiver le bouton définitivement
                        button.disabled = true;
                        button.textContent = 'Réservation annulée';
                        
                        // Afficher un message de succès
                        const alertDiv = document.createElement('div');
                        alertDiv.className = 'alert alert-success mt-3';
                        alertDiv.textContent = 'Réservation annulée avec succès !';
                        reservationsContainer.insertAdjacentElement('beforebegin', alertDiv);
                        
                        // Supprimer l'alerte après 3 secondes
                        setTimeout(() => {
                            alertDiv.remove();
                        }, 3000);
                    } else {
                        // Réactiver le bouton
                        button.disabled = false;
                        button.textContent = 'Annuler la réservation';
                        
                        // Afficher un message d'erreur
                        alert(result.message || 'Erreur lors de l\'annulation de la réservation');
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'annulation de la réservation:', error);
                    
                    // Réactiver le bouton
                    button.disabled = false;
                    button.textContent = 'Annuler la réservation';
                    
                    // Afficher un message d'erreur
                    alert('Une erreur technique est survenue lors de l\'annulation de la réservation');
                }
            }
        });
    });
    
    // Afficher le conteneur
    reservationsContainer.style.display = 'flex';
}

// Fonction pour afficher un message d'erreur
function showError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    reservationsContainer.style.display = 'none';
}
