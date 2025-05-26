// Processus principal

const {app, BrowserWindow,ipcMain, Menu, dialog} = require("electron")
const path = require('path');
const mysql = require('mysql2/promise')
require('dotenv').config()
const bcrypt = require('bcrypt');

// Utiliser un objet simple pour stocker les données de session
// Nous évitons d'utiliser electron-store pour le moment
const store = {
    data: {},
    get: function(key) {
        return this.data[key];
    },
    set: function(key, value) {
        this.data[key] = value;
        return value;
    },
    delete: function(key) {
        delete this.data[key];
    }
};


// Fenetre principale
let window;

// Configuration de l'acces a la BDD
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit : 10, // Le nombre maximal de connexion simultanée dans le pool
    waitForConnections : true,
    queueLimit : 0
}

// Créer le pool de connexion
const pool = mysql.createPool(dbConfig)

// Tester la connexion
async function testConnexion(){
    try {
        // Afficher les paramètres de connexion (sans le mot de passe pour la sécurité)
        console.log('Tentative de connexion avec les paramètres suivants:')
        console.log('Host:', process.env.DB_HOST)
        console.log('Port:', process.env.DB_PORT)
        console.log('User:', process.env.DB_USER)
        console.log('Database:', process.env.DB_NAME)
        
        // Demander une connexion au pool
        const connexion = await pool.getConnection()
        console.log('Connexion avec la base de données etablie')
        connexion.release() // Rend la connexion disponible dans le pool
    } catch (error) {
        console.error('Erreur de connexion à la base de données:', error.message)
        console.error('Code erreur:', error.code)
        console.error('Détails complets:', error)
    }
}

testConnexion()
// Créer la fenetre principal
function createWindow(){
    window = new BrowserWindow({
        width: 800,
        height : 600,
        webPreferences : {
            nodeIntegration : false, // Acces au API Node depuis notre processus de rendu
            contextIsolation : true,
            sandbox: true,
            preload : path.join(__dirname,'src/js/preload.js')
        }

    })
    window.webContents.openDevTools()
// Creation du menu
    createMenu()

    window.loadFile('src/pages/index.html')

}

// Fonction permettant de crée un menu personnalisé
function createMenu(){
    // Crée un tableau qui va representer le menu -> modele
    const template = [
        {
            label : 'App',
            submenu : [
                {
                    label : 'Accueil',
                    click : () => window.loadFile('src/pages/index.html')
                },
                {
                    type: 'separator'
                },
                {
                    label : "Quitter",
                    accelerator : process.platform === 'darwin' ? 'Cmd+Q':'Ctrl+Q',
                    click : () => app.quit()
                }
            ]
        },

        {
            label : 'Connexion',
            submenu: [
                {
                    label: "Connexion",
                    click: () => window.loadFile('src/pages/connexion.html')
                },
                {
                    label: "Inscription",
                    click: () => window.loadFile('src/pages/inscription.html')
                }
            ]

        },

        {
            label : 'Espaces',
            submenu: [
                {
                    label: "Liste des espaces",
                    click: () => window.loadFile('src/pages/espaces.html')
                }
            ]
        },

        {
            label : 'Reservations',
            submenu: [
                {
                    label: "Mes réservations",
                    click: () => window.loadFile('src/pages/reservations.html')
                }
            ]
        }

    ]


    // Crée le menu a partir du modele
    const menu = Menu.buildFromTemplate(template)
    // Définir le menu comme etant le menu de l'application
    Menu.setApplicationMenu(menu)

}

// Attendre l'initialisation de l'application au démarrage
app.whenReady().then( () => {

    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0){
            createWindow()
        }
    })
})

app.on('window-all-closed',() => {
    if (process.platform !== 'darwin'){
        app.quit()
    }
})

// Fonction pour ajouter un utilisateur
async function setUsers(prenom, nom, mail, password) {
    let connection;
    try {
        // Obtenir une connexion depuis le pool
        connection = await pool.getConnection();
        console.log('Connexion à la base de données obtenue pour l\'inscription');
        
        // Vérifier si l'email existe déjà
        console.log('Vérification si l\'email existe déjà:', mail);
        const [existingUsers] = await connection.query('SELECT * FROM users WHERE mail_user = ?', [mail]);
        
        if (existingUsers.length > 0) {
            console.log('Email déjà utilisé');
            throw new Error('Cet email est déjà utilisé');
        }
        
        const createdAt = new Date();
        const formattedDate = createdAt.toISOString().slice(0, 19).replace('T', ' ');
        console.log('Date de création formatée:', formattedDate);
        
        // Hachage du mot de passe
        console.log('Hachage du mot de passe...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Mot de passe haché avec succès');
        
        // Insertion de l'utilisateur dans la base de données
        console.log('Tentative d\'insertion dans la base de données...');
        const result = await connection.query(
            'INSERT INTO users (prenom_user, nom_user, mail_user, password_user, createdAt) VALUES (?, ?, ?, ?, ?)', 
            [prenom, nom, mail, hashedPassword, formattedDate]
        );
        
        console.log('Utilisateur inséré avec succès:', result);
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'ajout d\'un utilisateur:', error);
        console.error('Message d\'erreur:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    } finally {
        // Libérer la connexion dans tous les cas
        if (connection) {
            console.log('Libération de la connexion à la base de données');
            connection.release();
        }
    }
}

// Fonction pour connecter un utilisateur
async function loginUser(mail, password) {
    try {
        console.log('Tentative de connexion avec l\'email:', mail);
        const [users] = await pool.query('SELECT * FROM users WHERE mail_user = ?', [mail]);
        
        if (users.length === 0) {
            console.log('Aucun utilisateur trouvé avec cet email');
            return { success: false, message: 'Email ou mot de passe incorrect' };
        }
        
        console.log('Utilisateur trouvé dans la base de données:', users[0]);
        const user = users[0];
        const match = await bcrypt.compare(password, user.password_user);
        
        if (!match) {
            console.log('Mot de passe incorrect');
            return { success: false, message: 'Email ou mot de passe incorrect' };
        }
        
        console.log('Authentification réussie');
        
        // Créer un objet utilisateur sans le mot de passe pour la session
        const sessionUser = {
            id: user.id_user,
            prenom: user.prenom_user,
            nom: user.nom_user,
            email: user.mail_user
        };
        
        console.log('Objet utilisateur pour la session:', sessionUser);
        
        // Sauvegarder l'utilisateur dans le store
        store.set('user', sessionUser);
        store.set('isAuthenticated', true);
        
        console.log('Données utilisateur sauvegardées dans le store');
        console.log('Utilisateur dans le store:', store.get('user'));
        console.log('isAuthenticated dans le store:', store.get('isAuthenticated'));
        
        return { success: true, user: sessionUser };
    } catch (error) {
        console.error('Erreur lors de la connexion:', error.message);
        throw error;
    }
}

// Handler pour l'inscription
ipcMain.handle("users:add", async (event, prenom, nom, mail, password) => {
    try {
        console.log('Tentative d\'inscription avec les paramètres suivants:');
        console.log('Prénom:', prenom);
        console.log('Nom:', nom);
        console.log('Email:', mail);
        console.log('Mot de passe: [MASQUÉ]');
        
        await setUsers(prenom, nom, mail, password);
        console.log('Inscription réussie!');
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        if (error.message === 'Cet email est déjà utilisé') {
            return { success: false, message: error.message };
        }
        dialog.showErrorBox('Erreur technique', 'Impossible d\'ajouter un utilisateur: ' + error.message);
        return { success: false, message: 'Erreur technique: ' + error.message };
    }
});

// Handler pour la connexion
ipcMain.handle("users:login", async (event, mail, password) => {
    try {
        return await loginUser(mail, password);
    } catch (error) {
        console.error('Erreur de connexion:', error);
        return { success: false, message: 'Erreur technique lors de la connexion' };
    }
});

// Handler pour récupérer l'utilisateur courant
ipcMain.handle("users:current", (event) => {
    return store.get('user') || null;
});

// Handler pour la déconnexion
ipcMain.handle("users:logout", (event) => {
    console.log('Début de la déconnexion');
    console.log('Utilisateur avant déconnexion:', store.get('user'));
    console.log('isAuthenticated avant déconnexion:', store.get('isAuthenticated'));
    
    // Supprimer les données de session
    store.delete('user');
    store.set('isAuthenticated', false);
    
    console.log('Utilisateur après déconnexion:', store.get('user'));
    console.log('isAuthenticated après déconnexion:', store.get('isAuthenticated'));
    console.log('Déconnexion terminée avec succès');
    
    return { success: true };
});

// Handler pour vérifier si l'utilisateur est connecté
ipcMain.handle("auth:check", (event) => {
    return store.get('isAuthenticated') || false;
});

// Handler pour récupérer les données de session
ipcMain.handle("session:get", (event) => {
    return store.get('user') || null;
});

// Fonction pour vérifier les conflits de réservation
async function checkReservationConflicts(espaceId, debut, fin, reservationId = null) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        console.log(`Vérification des conflits pour l'espace ${espaceId} du ${debut} au ${fin}`);
        
        // Requête pour vérifier les conflits en excluant les réservations annulées
        let query = `
            SELECT * FROM reservation 
            WHERE espace_reservation = ? 
            AND statut != 'annulée' 
            AND (
                (reservation_debut <= ? AND reservation_fin > ?) OR
                (reservation_debut < ? AND reservation_fin >= ?) OR
                (reservation_debut >= ? AND reservation_fin <= ?)
            )
        `;
        
        let params = [espaceId, fin, debut, fin, debut, debut, fin];
        
        // Si on modifie une réservation existante, exclure cette réservation de la vérification
        if (reservationId) {
            query += ' AND id_reservation != ?';
            params.push(reservationId);
        }
        
        const [conflits] = await connection.query(query, params);
        
        console.log(`Résultat de la vérification des conflits:`, conflits);
        
        return conflits.length > 0 ? conflits : false;
    } catch (error) {
        console.error('Erreur lors de la vérification des conflits de réservation:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Fonction pour créer une réservation
async function createReservation(userId, espaceId, debut, fin) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Vérifier les conflits
        const conflits = await checkReservationConflicts(espaceId, debut, fin);
        if (conflits) {
            throw new Error('Conflit de réservation: cet espace est déjà réservé pour cette période');
        }
        
        // Insérer la réservation
        const [result] = await connection.query(
            'INSERT INTO reservation (utilisateur_reservation, espace_reservation, reservation_debut, reservation_fin, statut) VALUES (?, ?, ?, ?, ?)',
            [userId, espaceId, debut, fin, 'en attente']
        );
        
        console.log('Réservation créée avec succès, ID:', result.insertId);
        return result.insertId;
    } catch (error) {
        console.error('Erreur lors de la création de la réservation:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Fonction pour récupérer les réservations d'un utilisateur
async function getUserReservations(userId) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Récupérer les réservations avec les informations sur l'espace
        const [reservations] = await connection.query(`
            SELECT r.*, e.nom_espace 
            FROM reservation r
            JOIN espace e ON r.espace_reservation = e.id_espace
            WHERE r.utilisateur_reservation = ?
            ORDER BY r.reservation_debut ASC
        `, [userId]);
        
        console.log(`${reservations.length} réservations récupérées pour l'utilisateur ${userId}`);
        return reservations;
    } catch (error) {
        console.error('Erreur lors de la récupération des réservations:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Fonction pour annuler une réservation
async function cancelReservation(reservationId, userId) {
    let connection;
    try {
        console.log(`Début de l'annulation de la réservation ${reservationId} pour l'utilisateur ${userId}`);
        connection = await pool.getConnection();
        console.log('Connexion à la base de données obtenue pour l\'annulation');
        
        // Vérifier que la réservation existe et appartient à l'utilisateur
        console.log(`Vérification de la réservation ${reservationId} pour l'utilisateur ${userId}`);
        const [reservations] = await connection.query(
            'SELECT * FROM reservation WHERE id_reservation = ? AND utilisateur_reservation = ?',
            [reservationId, userId]
        );
        
        console.log(`Résultat de la vérification:`, reservations);
        
        if (reservations.length === 0) {
            console.log(`Aucune réservation trouvée avec l'ID ${reservationId} pour l'utilisateur ${userId}`);
            
            // Vérifier si la réservation existe sans le filtre utilisateur
            const [allReservations] = await connection.query(
                'SELECT * FROM reservation WHERE id_reservation = ?',
                [reservationId]
            );
            
            if (allReservations.length > 0) {
                console.log(`La réservation ${reservationId} existe mais appartient à l'utilisateur ${allReservations[0].utilisateur_reservation} et non à ${userId}`);
            } else {
                console.log(`Aucune réservation trouvée avec l'ID ${reservationId}`);
            }
            
            throw new Error('Réservation introuvable ou vous n\'avez pas les droits pour l\'annuler');
        }
        
        // Vérifier que la réservation n'est pas déjà annulée
        if (reservations[0].statut === 'annulée') {
            console.log(`La réservation ${reservationId} est déjà annulée`);
            throw new Error('Cette réservation est déjà annulée');
        }
        
        // Mettre à jour le statut de la réservation
        console.log(`Mise à jour du statut de la réservation ${reservationId} à 'annulée'`);
        await connection.query(
            'UPDATE reservation SET statut = ? WHERE id_reservation = ?',
            ['annulée', reservationId]
        );
        
        console.log(`Réservation ${reservationId} annulée avec succès`);
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'annulation de la réservation:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Fonction pour récupérer tous les espaces
async function getAllEspaces() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Connexion à la base de données obtenue pour récupérer les espaces');
        
        const [espaces] = await connection.query('SELECT * FROM espace');
        console.log(`${espaces.length} espaces récupérés`);
        
        return espaces;
    } catch (error) {
        console.error('Erreur lors de la récupération des espaces:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Fonction pour récupérer un espace par son ID
async function getEspaceById(id) {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log(`Connexion à la base de données obtenue pour récupérer l'espace ${id}`);
        
        const [espaces] = await connection.query('SELECT * FROM espace WHERE id_espace = ?', [id]);
        
        if (espaces.length === 0) {
            throw new Error('Espace non trouvé');
        }
        
        console.log('Espace récupéré:', espaces[0]);
        return espaces[0];
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'espace ${id}:`, error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Handler pour récupérer tous les espaces
ipcMain.handle("espaces:getAll", async (event) => {
    try {
        const espaces = await getAllEspaces();
        return { success: true, espaces };
    } catch (error) {
        console.error('Erreur lors de la récupération des espaces:', error);
        return { success: false, message: 'Erreur lors de la récupération des espaces' };
    }
});

// Handler pour récupérer un espace par son ID
ipcMain.handle("espaces:getById", async (event, id) => {
    try {
        const espace = await getEspaceById(id);
        return { success: true, espace };
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'espace ${id}:`, error);
        return { 
            success: false, 
            message: error.message === 'Espace non trouvé' ? error.message : 'Erreur lors de la récupération de l\'espace' 
        };
    }
});

// Handler pour créer une réservation
ipcMain.handle("reservations:create", async (event, espaceId, debut, fin) => {
    try {
        // Vérifier que l'utilisateur est connecté
        const user = store.get('user');
        if (!user) {
            return { success: false, message: 'Vous devez être connecté pour réserver un espace' };
        }
        
        console.log('Utilisateur connecté:', user);
        console.log('ID de l\'utilisateur pour la réservation:', user.id);
        
        // Créer la réservation
        const reservationId = await createReservation(user.id, espaceId, debut, fin);
        
        return { 
            success: true, 
            reservationId,
            message: 'Réservation créée avec succès' 
        };
    } catch (error) {
        console.error('Erreur lors de la création de la réservation:', error);
        return { 
            success: false, 
            message: error.message.includes('Conflit') ? error.message : 'Erreur lors de la création de la réservation' 
        };
    }
});

// Handler pour vérifier les conflits de réservation
ipcMain.handle("reservations:checkConflicts", async (event, espaceId, debut, fin) => {
    try {
        const conflits = await checkReservationConflicts(espaceId, debut, fin);
        return { 
            success: true, 
            hasConflicts: !!conflits,
            conflicts: conflits || []
        };
    } catch (error) {
        console.error('Erreur lors de la vérification des conflits:', error);
        return { success: false, message: 'Erreur lors de la vérification des conflits' };
    }
});

// Handler pour récupérer les réservations d'un utilisateur
ipcMain.handle("reservations:getUserReservations", async (event) => {
    try {
        // Déboguer l'authentification
        console.log('Vérification de l\'authentification pour getUserReservations');
        console.log('isAuthenticated:', store.get('isAuthenticated'));
        console.log('Données utilisateur:', store.get('user'));
        
        const user = store.get('user');
        if (!user) {
            console.log('Aucun utilisateur trouvé dans le store');
            return { success: false, message: 'Utilisateur non connecté' };
        }
        
        console.log('Utilisateur trouvé:', user);
        console.log('ID de l\'utilisateur pour les réservations:', user.id);
        
        const reservations = await getUserReservations(user.id);
        return { success: true, reservations };
    } catch (error) {
        console.error('Erreur lors de la récupération des réservations:', error);
        return { success: false, message: 'Erreur lors de la récupération des réservations' };
    }
});

// Handler pour annuler une réservation
ipcMain.handle("reservations:cancel", async (event, reservationId) => {
    try {
        // Déboguer l'authentification
        console.log('Vérification de l\'authentification pour annuler une réservation');
        console.log('isAuthenticated:', store.get('isAuthenticated'));
        console.log('Données utilisateur:', store.get('user'));
        console.log('ID de réservation à annuler:', reservationId);
        
        const user = store.get('user');
        if (!user) {
            console.log('Aucun utilisateur trouvé dans le store pour l\'annulation');
            return { success: false, message: 'Utilisateur non connecté' };
        }
        
        console.log('Utilisateur trouvé pour l\'annulation:', user);
        console.log('ID de l\'utilisateur pour l\'annulation:', user.id);
        
        await cancelReservation(reservationId, user.id);
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de l\'annulation de la réservation:', error);
        return { success: false, message: error.message || 'Erreur lors de l\'annulation de la réservation' };
    }
});
