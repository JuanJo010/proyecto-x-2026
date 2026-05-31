const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* ==========================================
   SISTEMA DE SEGURIDAD (CONTRASEÑA)
   ========================================== */
const CONTRASEÑA_CORRECTA = "112753";

function verificarAcceso() {
  const intento = prompt("Este es un espacio privado. Por favor, introduce la clave de nuestro momento:");
  
  if (intento === CONTRASEÑA_CORRECTA) {
    crearParticulas(); 
    render();          
    setupGalleryHandlers(); 
    iniciarContador(); 
  } else {
    alert("Clave incorrecta. No tienes acceso a estos recuerdos.");
    document.body.innerHTML = "<h1 style='color:#e63956; text-align:center; margin-top:35vh; font-family:sans-serif; font-weight:300; letter-spacing:1px;'>Acceso Denegado</h1>";
  }
}

let memories = JSON.parse(localStorage.getItem('moments_db')) || [];
let mediaItems = [];
let vistaActual = 'gallery'; 

/* ==========================================
   PLAYLIST DE MÚSICA CONSTANTE EN LOOP
   ========================================== */
const playlist = [
  'cancion1.mp3',
  'cancion2.mp3'
];

let indiceActual = 0;
const reproductor = new Audio(playlist[indiceActual]);
reproductor.volume = 0.5;

reproductor.addEventListener('ended', () => {
  indiceActual++;
  if (indiceActual >= playlist.length) {
    indiceActual = 0; 
  }
  reproductor.src = playlist[indiceActual];
  reproductor.play().catch(err => console.log("Pista siguiente bloqueada:", err));
});

if ($('#enter-btn')) {
  $('#enter-btn').onclick = () => {
    reproductor.play().catch(err => console.log("Audio esperando acción:", err));
    const intro = $('#intro-letter');
    if (intro) {
      intro.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.8s';
      intro.style.opacity = '0';
      intro.style.visibility = 'hidden';
      setTimeout(() => { intro.remove(); }, 800);
    }
  };
}

/* ==========================================
   PARTÍCULAS EN MOVIMIENTO CONSTANTE
   ========================================== */
function crearParticulas() {
  const container = $('#particles-container');
  if (!container) return;
  const numParticulas = 30;
  
  for(let i=0; i<numParticulas; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    
    const size = Math.random() * 6 + 4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    
    p.style.left = `${Math.random() * 100}vw`;
    p.style.animationDuration = `${Math.random() * 12 + 8}s`; 
    p.style.animationDelay = `${Math.random() * 8}s`;
    
    container.appendChild(p);
  }
}

/* ==========================================
   NAVEGACIÓN INTERNA Y DIBUJADO DE QR
   ========================================== */
$$('.tab').forEach(tab => {
  tab.onclick = (e) => {
    $$('.tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    $$('.view').forEach(view => view.classList.remove('active'));
    
    const targetView = e.target.getAttribute('data-view');
    $(`#view-${targetView}`).classList.add('active');
    
    if (targetView === 'gallery' || targetView === 'favorites') {
      vistaActual = targetView;
      render();
    }
    
    if (targetView === 'qr') {
      setTimeout(generarQR, 50);
    }
  };
});

function generarQR() {
  const contenedorQR = $('#qrcode');
  if (!contenedorQR) return;
  
  contenedorQR.innerHTML = "";
  const urlActual = window.location.href; 
  
  new QRCode(contenedorQR, {
    text: urlActual,
    width: 256,
    height: 256,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

if ($('#downloadQR')) {
  $('#downloadQR').onclick = () => {
    const img = $('#qrcode img');
    const canvas = $('#qrcode canvas');
    let urlDescarga = "";
    
    if (img && img.src && !img.src.startsWith('data:image/svg+xml')) {
      urlDescarga = img.src;
    } else if (canvas) {
      urlDescarga = canvas.toDataURL("image/png");
    }
    
    if (urlDescarga) {
      const enlace = document.createElement('a');
      enlace.href = urlDescarga;
      enlace.download = 'nuestro-momento-qr.png';
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
    } else {
      alert("Espera un instante a que el código termine de estructurarse.");
    }
  };
}

/* ==========================================
   SISTEMA DE MODAL (ABRIR Y CERRAR TOTALMENTE REALINEADO)
   ========================================== */
const modalElement = $('#modal');

if ($('#addBtn')) {
  $('#addBtn').onclick = () => {
    if (modalElement) modalElement.classList.remove('hidden');
  };
}

function forzarCierreModal() {
  if (modalElement) {
    modalElement.classList.add('hidden');
    const form = $('#memoryForm');
    if (form) form.reset();
    mediaItems = [];
  }
}

if ($('#closeModal')) $('#closeModal').onclick = forzarCierreModal;

if (modalElement) {
  modalElement.onclick = (e) => {
    if (e.target === modalElement) forzarCierreModal();
  };
}

if ($('#media')) {
  $('#media').onchange = (e) => {
    const files = e.target.files;
    if (files.length === 0) return;
    mediaItems = []; // Reiniciamos para evitar acumulaciones masivas

    for (let file of files) {
      const lector = new FileReader();
      lector.onload = (evento) => {
        mediaItems.push({ src: evento.target.result, type: file.type });
      };
      lector.readAsDataURL(file);
    }
  };
}

if ($('#memoryForm')) {
  $('#memoryForm').onsubmit = (e) => {
    e.preventDefault();
    
    const nuevaMemoria = {
      id: Date.now(),
      title: $('#title').value || "Momento Juntos",
      date: $('#date').value || new Date().toISOString().split('T')[0],
      description: $('#description').value,
      cover: mediaItems[0] || null,
      favorite: false 
    };
    
    memories.unshift(nuevaMemoria);
    localStorage.setItem('moments_db', JSON.stringify(memories));
    
    render();
    forzarCierreModal(); // Desaparece al instante
  };
}

/* ==========================================
   RECUADRO DEL TIEMPO CONOCIÉNDONOS
   ========================================== */
function iniciarContador() {
  const sectionContador = $('#memoryOfDay');
  if (!sectionContador) return;

  sectionContador.classList.remove('hidden');
  const fechaInicio = new Date(2026, 0, 21, 18, 8, 0); 

  function actualizarContador() {
    const ahora = new Date();
    const diff = ahora - fechaInicio;

    const unSegundo = 1000;
    const unMinuto = unSegundo * 60;
    const unaHora = unMinuto * 60;
    const unDia = unaHora * 24;

    const dias = Math.floor(diff / unDia);
    const horas = Math.floor((diff % unDia) / unaHora);
    const minutes = Math.floor((diff % unaHora) / unMinuto);
    const segundos = Math.floor((diff % unMinuto) / unSegundo);

    sectionContador.innerHTML = `
      <span class="label">El tiempo que llevamos construyendo nuestro mundo</span>
      <div class="counter-grid">
        <div class="counter-box"><span class="counter-number">${dias}</span><span class="counter-unit">Días</span></div>
        <div class="counter-box"><span class="counter-number">${horas}</span><span class="counter-unit">Horas</span></div>
        <div class="counter-box"><span class="counter-number">${minutes}</span><span class="counter-unit">Min</span></div>
        <div class="counter-box"><span class="counter-number">${segundos}</span><span class="counter-unit">Seg</span></div>
      </div>
      <p id="modDate">...desde que una palabra ordinaria dio inicio a nuestra historia extraordinaria.</p>
    `;
  }
  actualizarContador();
  setInterval(actualizarContador, 1000);
}

/* ==========================================
   MANEJADORES INTERNOS DE MINIATURA
   ========================================== */
function setupGalleryHandlers() {
  ['#gallery', '#favorites'].forEach(selector => {
    const el = $(selector);
    if (!el) return;
    
    el.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        const idToDelete = parseInt(deleteBtn.getAttribute('data-id'));
        if (confirm("¿Estás seguro de que deseas eliminar permanentemente esta memoria de nuestro espacio?")) {
          memories = memories.filter(m => m.id !== idToDelete);
          localStorage.setItem('moments_db', JSON.stringify(memories));
          render();
        }
        return;
      }

      const favBtn = e.target.closest('.fav-btn');
      if (favBtn) {
        const idToFav = parseInt(favBtn.getAttribute('data-id'));
        memories = memories.map(m => {
          if (m.id === idToFav) return { ...m, favorite: !m.favorite };
          return m;
        });
        localStorage.setItem('moments_db', JSON.stringify(memories));
        render(); 
      }
    });
  });
}

/* ==========================================
   RENDERIZADOR GENERAL DE TARJETAS MINIATURA
   ========================================== */
function render() {
  const contenedorDestino = vistaActual === 'gallery' ? $('#gallery') : $('#favorites');
  if (!contenedorDestino) return;

  if ($('#gallery')) $('#gallery').innerHTML = "";
  if ($('#favorites')) $('#favorites').innerHTML = "";

  const recuerdosFiltrados = vistaActual === 'gallery' ? memories : memories.filter(m => m.favorite === true);

  if (recuerdosFiltrados.length === 0) {
    const mensajeVacio = vistaActual === 'gallery'
      ? "No hay recuerdos guardados aún. Presiona '＋ New memory' para empezar."
      : "No has marcado ninguna memoria como favorita todavía. Presiona la estrella ✦ en tus fotos.";
    contenedorDestino.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 50px; font-style: italic;">${mensajeVacio}</p>`;
    return;
  }

  contenedorDestino.innerHTML = recuerdosFiltrados.map(m => {
    let mediaHTML = "";
    if (m.cover && m.cover.type && m.cover.type.startsWith("video")) {
      mediaHTML = `<video src="${m.cover.src}" muted loop autoplay playsinline></video>`;
    } else if (m.cover && m.cover.src) {
      mediaHTML = `<img src="${m.cover.src}" alt="${m.title}">`;
    }

    const claseFavorito = m.favorite ? 'fav-btn active' : 'fav-btn';

    return `
      <div class="gallery-card">
        <button class="${claseFavorito}" data-id="${m.id}" title="Guardar en Favoritos">✦</button>
        <button class="delete-btn" data-id="${m.id}" title="Eliminar Recuerdo">✕</button>
        <div class="media-container"> ${mediaHTML} </div>
        <div class="info">
          <h3>${m.title}</h3>
          <small>${new Date(m.date).toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric'})}</small>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  verificarAcceso();
});