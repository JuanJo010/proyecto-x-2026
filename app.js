const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* ==========================================
   SISTEMA DE SEGURIDAD INTERNO (PRIVACIDAD)
   ========================================== */
// CAMBIA ESTO: Escribe aquí la contraseña secreta para tu sorpresa
const CONTRASEÑA_CORRECTA = "112753"; 

function verificarAcceso() {
  // Pedir la contraseña mediante un cuadro nativo elegante al cargar
  const intento = prompt("Este es un espacio privado. Por favor, introduce la clave de nuestro momento:");
  
  if (intento === CONTRASEÑA_CORRECTA) {
    // Si es correcta, permitimos que la app inicialice
    document.body.style.display = "block"; // Muestra la página
    render();
    setupGalleryHandlers(); 
    iniciarContador();
  } else {
    // Si falla, bloqueamos la pantalla para siempre
    alert("Clave incorrecta. No tienes acceso a estos recuerdos.");
    document.body.innerHTML = "<h1 style='color:var(--crimson); text-align:center; margin-top:20vh; font-family:sans-serif;'>Acceso Denegado</h1>";
    document.body.style.display = "block";
  }
}

// Ocultamos el body de inmediato antes de verificar para que no parpadee el contenido
document.documentElement.style.background = "#090205";

// El resto de tus variables de la base de datos
let memories = JSON.parse(localStorage.getItem('moments_db')) || [];
let mediaItems = [];
let vistaActual = 'gallery'; 

/* ==========================================
   SISTEMA DE PLAYLIST CONSTANTE
   ========================================== */
const playlist = [
  'music/cancion1.mp3',
  'music/cancion2.mp3'
];

let indiceActual = 0;
const reproductor = new Audio(playlist[indiceActual]);
reproductor.volume = 0.5;
reproductor.loop = false; 

reproductor.addEventListener('ended', () => {
  indiceActual++;
  if (indiceActual >= playlist.length) indiceActual = 0;
  reproductor.src = playlist[indiceActual];
  reproductor.play().catch(err => console.log("Error al pasar de canción:", err));
});

document.addEventListener('click', () => {
  if (reproductor.paused && $('#intro-letter')) {
    reproductor.play().catch(err => console.log("Audio esperando clic:", err));
  }
}, { once: true });


/* ==========================================
   1. ANIMACIÓN DE SALIDA DE LA CARTA
   ========================================== */
if ($('#enter-btn')) {
  $('#enter-btn').onclick = () => {
    const intro = $('#intro-letter');
    intro.style.transition = 'opacity 0.8s ease, visibility 0.8s';
    intro.style.opacity = '0';
    intro.style.visibility = 'hidden';
    setTimeout(() => {
      intro.remove();
    }, 800);
  };
}

/* ==========================================
   2. SISTEMA DE NAVEGACIÓN (TABS) Y QR (CORREGIDO)
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
    
    // Si la pestaña elegida es QR, lo generamos en ese mismo instante
    if (targetView === 'qr') {
      setTimeout(generarQR, 50); // Le damos 50ms para que la pestaña se vuelva visible antes de dibujar
    }
  };
});

function generarQR() {
  const contenedorQR = $('#qrcode');
  if (!contenedorQR) return;
  
  contenedorQR.innerHTML = "";
  
  const urlActual = window.location.href;
  
  // Generamos el QR con el tamaño correcto y bien definido
  new QRCode(contenedorQR, {
    text: urlActual,
    width: 256,
    height: 256,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

// LÓGICA DE DESCARGA CORREGIDA
if ($('#downloadQR')) {
  $('#downloadQR').onclick = () => {
    // Buscamos la imagen generada dentro del contenedor o el lienzo canvas
    const imgQR = $('#qrcode img')
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
      alert("Por favor, dale un segundo al QR para que termine de dibujarse.");
    }
  };
}/* ==========================================
   3. GESTIÓN DE NUEVA MEMORIA (BASE64)
   ========================================== */
if ($('#addBtn')) $('#addBtn').onclick = () => $('#modal').classList.remove('hidden');
if ($('#closeModal')) $('#closeModal').onclick = () => {
  $('#modal').classList.add('hidden');
  $('#memoryForm').reset();
  mediaItems = [];
};

if ($('#media')) {
  $('#media').onchange = (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    for (let file of files) {
      const lector = new FileReader();
      lector.onload = (evento) => {
        mediaItems.push({ src: evento.target.result, type: file.type });
        if (mediaItems.length === files.length) {
          alert("¡Foto procesada con éxito!");
        }
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
      title: $('#title').value || "Untitled Moment",
      date: $('#date').value || new Date().toISOString().split('T')[0],
      description: $('#description').value,
      cover: mediaItems[0] || null,
      favorite: false 
    };
    memories.unshift(nuevaMemoria);
    saveToDisk();
    mediaItems = [];
    $('#memoryForm').reset();
    render();
    $('#modal').classList.add('hidden');
  };
}

/* ==========================================
   4. LÓGICA DEL CONTADOR DE TIEMPO
   ========================================== */
function iniciarContador() {
  const sectionContador = $('#memoryOfDay');
  if (!sectionContador) return;

  sectionContador.classList.remove('hidden');
  const fechaInicio = new Date(2026, 0, 21, 18, 8, 0); 

  function actualizarContador() {
    const ahora = new Date();
    const diferenciaMilisegundos = ahora - fechaInicio;

    const unSegundo = 1000;
    const unMinuto = unSegundo * 60;
    const unaHora = unMinuto * 60;
    const unDia = unaHora * 24;

    const dias = Math.floor(diferenciaMilisegundos / unDia);
    const horas = Math.floor((diferenciaMilisegundos % unDia) / unaHora);
    const minutos = Math.floor((diferenciaMilisegundos % unaHora) / unMinuto);
    const segundos = Math.floor((diferenciaMilisegundos % unMinuto) / unSegundo);

    sectionContador.innerHTML = `
      <span class="label">Time weaving worlds together</span>
      <div class="counter-grid">
        <div class="counter-box"><span class="counter-number">${dias}</span><span class="counter-unit">Days</span></div>
        <div class="counter-box"><span class="counter-number">${horas}</span><span class="counter-unit">Hours</span></div>
        <div class="counter-box"><span class="counter-number">${minutos}</span><span class="counter-unit">Mins</span></div>
        <div class="counter-box"><span class="counter-number">${segundos}</span><span class="counter-unit">Secs</span></div>
      </div>
      <p id="modDate">...since the very first word changed our ordinary hours.</p>
    `;
  }
  actualizarContador();
  setInterval(actualizarContador, 1000);
}

/* ==========================================
   5. ACCIONES DE LA GALERÍA (BORRAR Y FAVORITOS)
   ========================================== */
function setupGalleryHandlers() {
  const contenedores = ['#gallery', '#favorites'];
  
  contenedores.forEach(selector => {
    const el = $(selector);
    if (!el) return;
    
    el.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        const idToDelete = parseInt(deleteBtn.getAttribute('data-id'));
        if (confirm("Are you sure you want to delete this memory?")) {
          memories = memories.filter(m => m.id !== idToDelete);
          saveToDisk();
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
        saveToDisk();
        render(); 
      }
    });
  });
}

function saveToDisk() {
  localStorage.setItem('moments_db', JSON.stringify(memories));
}

/* ==========================================
   6. RENDERIZAR EN PANTALLA
   ========================================== */
function render() {
  const contenedorDestino = vistaActual === 'gallery' ? $('#gallery') : $('#favorites');
  if (!contenedorDestino) return;

  if ($('#gallery')) $('#gallery').innerHTML = "";
  if ($('#favorites')) $('#favorites').innerHTML = "";

  const recuerdosFiltrados = vistaActual === 'gallery' ? memories : memories.filter(m => m.favorite === true);

  if (recuerdosFiltrados.length === 0) {
    const mensajeVacio = vistaActual === 'gallery'
      ? "No memories saved yet. Click '＋ New memory' to start."
      : "You haven't marked any memories as favorites yet. Tap the ✦ star on any photo!";
    contenedorDestino.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 40px;">${mensajeVacio}</p>`;
    return;
  }

  contenedorDestino.innerHTML = recuerdosFiltrados.map(m => {
    let mediaHTML = "";
    if (m.cover && m.cover.type && m.cover.type.startsWith("video")) {
      mediaHTML = `<video src="${m.cover.src}" muted loop autoplay></video>`;
    } else if (m.cover && m.cover.src) {
      mediaHTML = `<img src="${m.cover.src}" alt="${m.title}">`;
    } else {
      mediaHTML = `<img src="https://via.placeholder.com/400x250?text=Moment" style="filter: grayscale(1); opacity: 0.3;">`;
    }

    const claseFavorito = m.favorite ? 'fav-btn active' : 'fav-btn';

    return `
      <div class="gallery-card">
        <button class="${claseFavorito}" data-id="${m.id}" title="Mark as favorite">✦</button>
        <button class="delete-btn" data-id="${m.id}" title="Delete memory">✕</button>
        <div class="media-container"> ${mediaHTML} </div>
        <div class="info">
          <h3>${m.title}</h3>
          <small>${formatearFecha(m.date)}</small>
        </div>
      </div>
    `;
  }).join('');
}

function formatearFecha(fechaStr) {
  if(!fechaStr) return "";
  const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(fechaStr).toLocaleDateString(undefined, opciones);
}

// INICIALIZACIÓN DE SEGURIDAD AL CARGAR
document.addEventListener('DOMContentLoaded', () => {
  // Primero ocultamos el diseño por seguridad
  document.body.style.display = "none";
  // Llamamos a la verificación de contraseña
  verificarAcceso();
});