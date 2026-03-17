// auth.js - Centrale Unica Protezione, Identità e Sessione
//Inizializzo le funzioni di autenticazione, gestione sessione e dati utente e con esso le variabili da salvare in localStorage e sessionStorage
//Uso windows per rendere le funzioni che personalizzo globali e accessibili da tutti i file

// --- 1. PROTEZIONE ACCESSO (AUTH GUARD): Calcola prefisso relativo per redirect (pagine in sottocartelle)
//mi riporta al nodo radice se sono in una pagina che è in una sottocartella
const AUTH_PREFIX = (window.location.pathname.includes('/playlist/') || window.location.pathname.includes('/profilo/') || window.location.pathname.includes('/community/')) ? '../' : ''; 

(function checkAuth() {
    const user = sessionStorage.getItem("utenteLoggato");
    const path = window.location.pathname;
    const publicPages = ["login.html", "register.html"]; // Pagine accessibili senza login
    const isPublic = publicPages.some(page => path.includes(page)); 

    if (!user && !isPublic) {
        window.location.href = AUTH_PREFIX + "profilo/login.html"; 
    }
})();

// --- 2. FUNZIONI DI SESSIONE (CENTRALIZZATE) ---
// riceve i dati
window.login = function(email, password) {
    const savedUsers = JSON.parse(localStorage.getItem("utenti")) || []; 
    const utente = savedUsers.find(u => u.email === email && u.password === password);

    if (utente) {
        sessionStorage.setItem("utenteLoggato", JSON.stringify(utente));
        window.location.href = AUTH_PREFIX + "home2.html";
        return true; // Login riuscito
    }
    return false; // Login fallito
};

window.logout = function() {
    sessionStorage.removeItem("utenteLoggato");
    window.location.href = AUTH_PREFIX + "profilo/login.html";
};

// --- 3. IDENTITÀ UTENTE ---
window.getCurrentUser = () => {
    try { return JSON.parse(sessionStorage.getItem("utenteLoggato")); } 
    catch (e) { return null; }
};

window.getCurrentUserEmail = () => {
    const user = window.getCurrentUser();
    return user ? user.email : null;
};

// --- 4. GESTIONE DATI (ISOLATA E PUBBLICA) ---  
window.saveUserData = (key, data) => {   
    const email = window.getCurrentUserEmail();
    if (email) localStorage.setItem(`${email}_${key}`, JSON.stringify(data));
};

window.getUserData = (key) => {          
    const email = window.getCurrentUserEmail();   
    if (!email) return null;
    const data = localStorage.getItem(`${email}_${key}`);
    return data ? JSON.parse(data) : null;
};

window.savePublicData = (key, data) => localStorage.setItem(`global_${key}`, JSON.stringify(data));
window.getPublicData = (key) => {
    const data = localStorage.getItem(`global_${key}`);
    return data ? JSON.parse(data) : null;
};

