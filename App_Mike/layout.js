// layout.js - Gestisce Footer, Sidebar e API Globali
// QUESTO FILE È IL "VIGILE URBANO" CHE COORDINA I DIVERSI REPARTI

// --- 🧩REPARTO 1: STATO GLOBALE inizializzazione Variabili volatili che servono al player per funzionare ---
let isPlaying = false; // Stato di riproduzione
let currentProgressMs = 0; // Tempo corrente in ms

// AL CARICAMENTO DELLA PAGINA:
document.addEventListener("DOMContentLoaded", function() { // DOMContentLoaded = evento: aspetta che il DOM sia pronto prima di chiamare le funzioni
    renderGlobalPlayer();   // Disegna il player (vuoto o pieno)
    renderGlobalSidebar();  // Disegna la barra laterale 
    restorePlayerState();   // WORKFLOW 4 (stao del sistema): Recupera (eventualmente) il brano dal localStorage
});

// --- 🧩REPARTO 2: API SPOTIFY (accesso token) --- 
const CLIENT_ID = "e558f9e897dc418695730d1be799b3b0";
const CLIENT_SECRET = "647e6b66e15e4ea0ac545edec114f532";

// '../' se siamo in una sottocartella, '' altrimenti. Questa variabile viene usata per costruire i link della Sidebar riga 120
const REL_PREFIX = (window.location.pathname.includes('/playlist/') || window.location.pathname.includes('/profilo/') || window.location.pathname.includes('/community/')) ? '../' : ''; 

// Ottiene il TOKEN per cercare le canzoni
window.getAccessToken = async function() { // Funzione asincrona per ottenere il token senza bloccare l'esecuzione della pagina

    //preparo i nomi dei cassetti in local storage e degli oggetti associati ad essi 
    const TOKEN_KEY = "spotify_access_token"; // spotify_access_token: per memorizzare il token in memoria
    const EXPIRATION_KEY = "spotify_token_expiration"; // per memorizzare la scadenza
    const ONE_HOUR = 3600 * 1000; // Un'ora in millisecondi

    //verifico se in localStorage c'è già un token valido (non scaduto) per evitare richieste inutili all'API di Spotify e migliorare le prestazioni
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const expiration = localStorage.getItem(EXPIRATION_KEY);
    const now = Date.now();

    // Se il token esiste ed è ancora valido, lo riusa
    if (storedToken && expiration && now < parseInt(expiration)) { 
        return storedToken; 
    }

    try { //se il token è scaduto o nn c'è (primo accesso) ne chiede uno nuovo
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET)
            },
            body: "grant_type=client_credentials"
        });
        const data = await response.json(); //attende la risposta e la CONVERTE in json
        
        if (data.access_token) { //access_token = chiave di accesso, se presente procede con il salvataggio
            localStorage.setItem(TOKEN_KEY, data.access_token);  //finalmente memorizza i valori inizializzati sopra
            localStorage.setItem(EXPIRATION_KEY, (now + ONE_HOUR).toString());
            return data.access_token;
        }
        return null;

    } catch (error) {
        console.error("Errore Token:", error);
        return null;
    }
}

// --- 🧩REPARTO 3: LOGICA PLAYER (Workflow 4 - Salva lo stato del Sistema, NON visualizza ancora li player) ---

// Chiamata quando clicchi su una canzone in Home o Ricerca
window.selezionaBrano = function(img, title, artist, year, artistId, albumName, durationMs) {
    
    // Conversione durata da millisecondi a minuti:secondi
    let formattedDuration = "--:--";
    if (durationMs) {
        const min = Math.floor(durationMs / 60000);
        const sec = ((durationMs % 60000) / 1000).toFixed(0);
        formattedDuration = min + ":" + (sec < 10 ? '0' : '') + sec;
    }

    // 1. DEFINIZIONE OGGETTO (Il Brano Scelto)
    // Creiamo l'oggetto temporaneo con i dati del brano cliccato
    const newTrack = {
        id: Date.now(),
        img: img,
        title: title,
        artist: artist,
        album: albumName || "Singolo",
        year: year || "",
        duration: formattedDuration, 
        durationMs: durationMs || 0 
    };
    
    currentProgressMs = 0;

    // 2. MEMORIZZAZIONE IMMEDIATA (Il Salvagente)
    // Salviamo direttamente in LocalStorage per sopravvivere al cambio pagina
    localStorage.setItem('current_track', JSON.stringify(newTrack));

    // Aggiorna subito la grafica del player
    window.updateGlobalPlayerUI(newTrack, true);
}

// --- 🧩REPARTO 4: INIEZIONE SIDEBAR: NAVIGAZIONE & LIBRERIA (Workflow 2 - Dati Privati Isolati) ---

function renderGlobalSidebar() {
    const sbContainer = document.getElementById('global-sidebar-container'); //id contenuto in tutti i files aventi una sidebar (qundi prelevato da altri file)
    if (!sbContainer) return;

    //identificazione posizione file tramite path (per evidenziare la voce di menu attiva e per costruire i link corretti)
    const path = window.location.pathname;
    const isHome = path.includes('home2.html');
    const isSearch = path.includes('ricerca.html');
    const isComm = path.includes('community.html') || path.includes('x.community.html');

    //da qui crea la sidebar
    const navItemStyle = "padding: 8px 16px; display: flex; align-items: center; gap: 16px; font-weight: 600; border-radius: 4px; transition: 0.3s; cursor: pointer; text-decoration: none;";
    const activeColor = "color: white; background-color: #282828;";
    const inactiveColor = "color: #b3b3b3;";

    //1.Logo 2.opzioni di navigazione 3.libreria playlist
    sbContainer.innerHTML = ` 
        <div style="padding: 0 16px 20px;">
            <h4 class="text-white"><i class="fab fa-spotify me-2"></i>Spotify</h4>
        </div>
    
        <nav class="d-flex flex-column">
            <a href="${REL_PREFIX}home2.html" style="text-decoration: none;">
                <div style="${navItemStyle} ${isHome ? activeColor : inactiveColor}" 
                     onmouseover="this.style.color='white'" onmouseout="this.style.color='${isHome ? 'white' : '#b3b3b3'}'">
                    <i class="fas fa-home" style="font-size: 24px; width: 24px; text-align: center;"></i> Home
                </div>
            </a>
            
            ${!isHome ? `
            <a href="${REL_PREFIX}playlist/ricerca.html" style="text-decoration: none;">
                <div style="${navItemStyle} ${isSearch ? activeColor : inactiveColor}"
                     onmouseover="this.style.color='white'" onmouseout="this.style.color='${isSearch ? 'white' : '#b3b3b3'}'">
                    <i class="fas fa-search" style="font-size: 24px; width: 24px; text-align: center;"></i> Cerca
                </div>
            </a>
            ` : ''}

            <a href="${REL_PREFIX}community/community.html" style="text-decoration: none;">
                <div style="${navItemStyle} ${isComm ? activeColor : inactiveColor}"
                     onmouseover="this.style.color='white'" onmouseout="this.style.color='${isComm ? 'white' : '#b3b3b3'}'">
                    <i class="fas fa-users" style="font-size: 24px; width: 24px; text-align: center;"></i> Community
                </div>
            </a>
        </nav>
        

        <div class="mt-4"></div> <hr class="text-secondary mx-3">
        
        
        <div class="px-3 mb-2 mt-2 d-flex justify-content-between align-items-center" style="color: #b3b3b3;">
            <div class="fw-bold" style="font-size: 1rem;">La tua libreria</div>
        </div>

        <div class="d-flex align-items-center gap-3 px-3 py-2" 
             style="cursor: pointer; transition: 0.2s; color: #b3b3b3;"
             onmouseover="this.style.color='white'" onmouseout="this.style.color='#b3b3b3'"
             onclick="creaNuovaPlaylistGlobal()">
            <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 2px; background-color: #b3b3b3; color: black;">
                <i class="fas fa-plus" style="font-size: 12px;"></i>
            </div>
            <span class="fw-bold" style="font-size: 0.9rem;">Crea Playlist</span>
        </div>


        <div class="px-3 mt-3 mb-2">
             <input type="text" id="globalPlaylistFilter" 
                    style="background-color: #1f1f1f; border: none; border-radius: 4px; color: white; padding: 6px 12px; width: 100%; font-size: 0.85rem; outline: none;" 
                    placeholder="Cerca nelle playlist..." 
                    onkeyup="renderGlobalPlaylists()">
        </div>
        
        <div class="px-3" id="globalSidebarPlaylists" style="overflow-y: auto; flex-grow: 1; height: 100%; margin-top: 5px;"></div>
    `;
    // Dopo aver disegnato la sidebar, la riempie di playlist
    renderGlobalPlaylists();
}

//NOTA: le fuzioni che seguono l'iniezione sono a supporto della sidebar

// Disegna la lista delle playlist nella sidebar (Workflow 2 - dati isolati)
function renderGlobalPlaylists() { 
    ////barra di ricerca playlist: preleva informazione digitata dall'utente
    const inputElement = document.getElementById('globalPlaylistFilter');
    const filterText = inputElement ? inputElement.value : ""; 
    
     //per l'inserimento dinamico delle playlist nella sidebar
    const container = document.getElementById('globalSidebarPlaylists');
    if(!container) return;
    
        // 1. RICHIESTA DI PRELIEVO AL WRAPPER
    const playlists = window.getUserData('spotify_playlists') || []; // Chiede ad auth.js
    
        //Pulisce il contenuto precedente della sidebar inserito nella chiamata precedente di questa funzione (ogni lettera nella barra di ricerca è una chiamata nuova)
    container.innerHTML = ""; 
    
        // 2. FILTRAGGIO E CREAZIONE DEGLI ELEMENTI (se nn ho scritto nulla nella barra include tutto, altrimenti solo quelli che matchano)
    const filtered = playlists.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase())); 

    filtered.forEach(pl => { 
        const div = document.createElement('div');
        div.style.cssText = "display: block; margin-bottom: 12px; font-size: 0.9rem; cursor: pointer; transition: 0.2s; color: #b3b3b3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
        div.innerText = pl.name;
        div.onclick = () => window.location.href = `${REL_PREFIX}playlist/playlist.html?id=${pl.id}`; //mi spedisce al file playlist.html con in query string l'id della playlist cliccata (es. playlist.html?id=123456)
        container.appendChild(div); 
    });
}

// Creazione nuova playlist vuota
window.creaNuovaPlaylistGlobal = function() {
     let playlists = window.getUserData('spotify_playlists') || [];
     const newId = 'pl_' + Date.now();
     const newPl = { id: newId, name: 'Nuova Playlist', tracks: [] };
     playlists.push(newPl);
     window.saveUserData('spotify_playlists', playlists);
     window.location.href = `${REL_PREFIX}playlist/playlist.html?id=${newId}`;
}


// --- 🧩REPARTO 5: INIEZIONE PLAYER UI & PROGETTAZIONE MODALE SALVATAGGIO ---+
function renderGlobalPlayer() {
    const playerContainer = document.getElementById('global-player-container');
    // Se non trova il container (es. pagina login), esce
    if (!playerContainer) return;

    // Contiene: Sinistra (Info), Centro (Controlli), Destra (Volume)
    playerContainer.innerHTML = `
    <div class="player-bar" style="position: fixed; bottom: 0; left: 0; width: 100%; height: 90px; background-color: #181818; border-top: 1px solid #282828; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; z-index: 200;">
        <div class="d-flex align-items-center" style="width: 30%;">
            <img id="global-album-art" src="https://picsum.photos/50" class="rounded me-3" style="width: 50px; height: 50px; object-fit: cover;">
            <div style="overflow: hidden; margin-right: 15px;">
                <div id="global-song-title" class="text-white fw-bold text-truncate" style="font-size: 0.9rem; max-width: 150px;">-</div>
                <div id="global-song-artist" style="font-size: 0.75rem; color: #b3b3b3;">-</div>
                <div id="global-song-meta" style="font-size: 0.65rem; color: #727272;"></div>
            </div>
        </div>
        
        <div class="d-flex flex-column align-items-center" style="width: 40%;">
            <div class="d-flex align-items-center gap-3 mb-1 text-secondary">
                <div id="globalPlayBtn" class="bg-white rounded-circle d-flex justify-content-center align-items-center" style="width:32px; height:32px; cursor: pointer;">
                    <i id="globalPlayIcon" class="fas fa-play text-black"></i>
                </div>
            </div>
            <div class="d-flex align-items-center w-100 gap-2">
                <span id="global-time-current" style="font-size:0.7rem; min-width: 30px; text-align: right;">0:00</span>
                <div id="globalProgressContainer" class="flex-grow-1 bg-secondary rounded" style="height:4px; cursor: pointer;">
                    <div id="globalProgressBar" class="bg-white rounded" style="width:0%; height:100%;"></div>
                </div>
                <span id="global-time-end" style="font-size:0.7rem; min-width: 30px;">--:--</span>
            </div>
        </div>

        <div class="d-flex justify-content-end align-items-center gap-2 text-secondary" style="width: 30%;">
            <i class="fas fa-plus-circle fs-5 btn-add-playlist" style="cursor: pointer; margin-right: 15px; transition: 0.3s;" 
               onmouseover="this.style.color='#1db954'; this.style.transform='scale(1.1)'" 
               onmouseout="this.style.color='#b3b3b3'; this.style.transform='scale(1)'"
               onclick="if(window.apriModalSalvataggio) window.apriModalSalvataggio(); else alert('Funzione non disponibile in questa pagina');" 
               title="Aggiungi a playlist"></i>
            <i class="fas fa-volume-up"></i>

            <div id="globalVolumeContainer" class="bg-secondary rounded" style="width:80px; height:4px; cursor: pointer;">
                <div id="globalVolumeBar" class="bg-white rounded" style="width:70%; height:100%;"></div>
            </div>
        </div>
    </div>`;
    
    // Attivazione ascoltatori eventi (click play, click barra)
    setupGlobalInteractions();
}

//NOTA CHE: le fuzioni qui sotto sono a supporto della precedente iniezione

// interattività bottoni del player
function setupGlobalInteractions() {
    const btn = document.getElementById('globalPlayBtn');
    
    //player
    if(btn){
        btn.onclick = function() {
            isPlaying = !isPlaying; // booleano
            updatePlayIcon();       // Cambia l'icona
        };
    }
    
    //click sulle barre (volume e progresso)
    const setupBar = (cid, bid) => { //funzione matematica per calcolare la percentuale di click
    // const (invece di function) serve a creare una funzione "usa e getta" valida solo dentro setupGlobalInteractions
        const c = document.getElementById(cid); // Container
        const b = document.getElementById(bid); // Barra interna
        if(c) c.onclick = (e) => {
            const rect = c.getBoundingClientRect();
            let pct = ((e.clientX - rect.left) / rect.width) * 100; // Calcola percentuale click
            b.style.width = Math.max(0, Math.min(100, pct)) + '%';
        };
    };
    setupBar('globalProgressContainer', 'globalProgressBar'); // chiamata per la Barra progresso
    setupBar('globalVolumeContainer', 'globalVolumeBar'); // chiamata per la Barra volume
}

// Recupera lo stato al refresh della pagina
function restorePlayerState() {
    const currentTrack = JSON.parse(localStorage.getItem('current_track'));
    if (currentTrack) window.updateGlobalPlayerUI(currentTrack, false); // false = non avvia la riproduzione automatica, solo aggiorna UI
}

// --- GESTIONE TIMER E UI ---

// Aggiorna l'icona Play/Pausa
function updatePlayIcon() {
    const icon = document.getElementById('globalPlayIcon');
    if (icon) {
        icon.className = isPlaying ? 'fas fa-pause text-black' : 'fas fa-play text-black';
    }
}

// Aggiorna tutti i testi e le immagini del player (UI) al cambio brano
window.updateGlobalPlayerUI = function(track, autoPlay = false) {
    const art = document.getElementById('global-album-art');
    const title = document.getElementById('global-song-title');
    const artist = document.getElementById('global-song-artist');
    const meta = document.getElementById('global-song-meta');
    const timeEnd = document.getElementById('global-time-end');

    if(art) art.src = track.img;
    if(title) title.innerText = track.title;
    if(artist) artist.innerText = track.artist;
    if(meta) meta.innerText = track.year || "";

    if(timeEnd && track.duration) {
        timeEnd.innerText = track.duration;
    }

    localStorage.setItem('current_track', JSON.stringify(track)); // Sincronizza localStorage

    if(autoPlay) {
        isPlaying = true;
        updatePlayIcon();
    } else {
        updatePlayIcon();
    }
}

// Popola la lista delle playlist nel Modal di salvataggio
window.populatePlaylistList = function(elementId, callback) {
    //element id è associato a modalplaylist che in home2 è la posizione del modale che visualizza le playlists
    //quindi qui lo ripemio di playlists
    const playlists = window.getUserData('spotify_playlists') || [];
    const ul = document.getElementById(elementId);
    if(!ul) return; 
    ul.innerHTML = "";
    
    if(playlists.length === 0) {
        ul.innerHTML = "<li class='list-group-item bg-dark text-white'>Nessuna playlist trovata.</li>";
        return;
    }

    playlists.forEach(pl => {
        const li = document.createElement('li');
        li.className = "list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center";
        li.style.cursor = "pointer";
        
        li.innerHTML = `
            <div>
                <div class="fw-bold">${pl.name}</div>
                <div class="small text-secondary">${pl.tracks.length} brani</div>
            </div>
            <i class="fas fa-plus-circle text-success fs-5"></i>
        `;
        
        li.onmouseover = () => li.style.backgroundColor = "#333";
        li.onmouseout = () => li.style.backgroundColor = "transparent";
        
        li.onclick = () => callback(pl); // Esegue l'azione passata come callback (il salvataggio)
        ul.appendChild(li);
    });
}

// Gestisce l'apertura del Modal e il salvataggio effettivo
window.apriModalSalvataggio = function() {
    let currentTrackData = JSON.parse(localStorage.getItem('current_track'));

    if (!currentTrackData) {
        alert("Nessun brano in riproduzione da salvare!");
        return;
    }

    // Riempie la lista e definisce cosa succede al click (callback)
     window.populatePlaylistList('modalPlaylistList', (pl) => {
        //ricerca paylist
        let playlists = window.getUserData('spotify_playlists') || [];
        let target = playlists.find(p => p.id === pl.id); // Trova la playlist selezionata
        
        //aggiunta brano
        if(target) {
            target.tracks.push(currentTrackData); // Aggiunge il brano all'array
            window.saveUserData('spotify_playlists', playlists); // Salva nel DB (Workflow 2)
            alert(`Brano aggiunto a: ${target.name}`);
        }

        // Chiude il modal usando Bootstrap
        const modalEl = document.getElementById('saveModal');
        const modalInstance = (window.bootstrap && bootstrap.Modal.getInstance(modalEl)) || new bootstrap.Modal(modalEl);
        modalInstance.hide();
    });
    
    // Mostra il modal
    if(window.bootstrap) {// Controlla se Bootstrap è caricato
        const modalInstance = new bootstrap.Modal(document.getElementById('saveModal')); //legge le istruzioni in ricerca.html ecc per costruire il modal
        modalInstance.show();
    }
}