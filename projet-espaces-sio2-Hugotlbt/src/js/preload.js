//Ce script sera exécuté avant le chargement de la page
//Ce script a un accès aux API Node et Electron

const {contextBridge, ipcRenderer} = require('electron');

// Expose API pour l'inscription
contextBridge.exposeInMainWorld('inscription', {
    //fonction qui récupère les entrées utilisateur via IPC
    setUsers: (prenom, nom, mail, password) => ipcRenderer.invoke('users:add', prenom, nom, mail, password)
});

// Expose API pour la connexion
contextBridge.exposeInMainWorld('connexion', {
    login: (mail, password) => ipcRenderer.invoke('users:login', mail, password),
    getCurrentUser: () => ipcRenderer.invoke('users:current'),
    logout: () => ipcRenderer.invoke('users:logout')
});

// Expose API pour vérifier si l'utilisateur est connecté
contextBridge.exposeInMainWorld('auth', {
    isAuthenticated: () => ipcRenderer.invoke('auth:check'),
    getSessionData: () => ipcRenderer.invoke('session:get')
});

// Expose API pour la gestion des espaces
contextBridge.exposeInMainWorld('espaces', {
    getAll: () => ipcRenderer.invoke('espaces:getAll'),
    getById: (id) => ipcRenderer.invoke('espaces:getById', id)
});

// Expose API pour la gestion des réservations
contextBridge.exposeInMainWorld('reservations', {
    create: (espaceId, debut, fin) => ipcRenderer.invoke('reservations:create', espaceId, debut, fin),
    checkConflicts: (espaceId, debut, fin) => ipcRenderer.invoke('reservations:checkConflicts', espaceId, debut, fin),
    getUserReservations: () => ipcRenderer.invoke('reservations:getUserReservations'),
    cancel: (reservationId) => ipcRenderer.invoke('reservations:cancel', reservationId)
});