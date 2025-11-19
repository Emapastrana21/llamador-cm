document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    
    const notificationsContainer = document.getElementById('notifications');
    const patientsListUI = document.getElementById('patients');
    const enableSoundButton = document.getElementById('enable-sound');
    const notificationSound = document.getElementById('notification-sound');
    const videoPlayer = document.getElementById('promo-video');

    // --- ⏰ LÓGICA DEL RELOJ (NUEVO) ---
    const updateClock = () => {
        const now = new Date();
        // Hora
        const timeString = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('clock-time').textContent = timeString;
        // Fecha
        const dateString = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
        document.getElementById('clock-date').textContent = dateString;
    };
    setInterval(updateClock, 1000); // Actualizar cada segundo
    updateClock(); // Ejecutar ya

    // --- 🎬 REPRODUCTOR DE VIDEO ---
    let videoList = [];
    let currentVideoIndex = 0;

    const iniciarReproductor = async () => {
        try {
            const response = await fetch('/api/videos');
            videoList = await response.json();
            if (videoList.length > 0) {
                reproducirVideo(0);
            }
        } catch (error) {
            console.error("Error cargando videos:", error);
        }
    };

    const reproducirVideo = (index) => {
        if (videoList.length === 0) return;
        const videoName = videoList[index];
        videoPlayer.src = `/media/videos/${videoName}`;
        videoPlayer.play().catch(() => {}); // Ignorar error si falta interacción
    };

    videoPlayer.addEventListener('ended', () => {
        currentVideoIndex = (currentVideoIndex + 1) % videoList.length;
        reproducirVideo(currentVideoIndex);
    });

    // --- 📋 LISTA DE ESPERA ---
    // --- 📋 LÓGICA DE LA LISTA DE ESPERA ---
    const cargarPacientes = () => {
        // Pedimos al backend la lista
        fetch('/pacientes?nro_consultorio=')
            .then(response => response.json())
            .then(pacientes => {
                patientsListUI.innerHTML = ''; // Limpiamos la lista vieja
// --- ESTADO VACÍO (TEXTO CAMBIADO) ---
                if (pacientes.length === 0) {
                    patientsListUI.innerHTML = `
                        <div class="empty-state-container">
                            <div class="status-indicator">
                                <div class="pulse-ring"></div>
                                <div class="status-dot"></div>
                            </div>
                            <div class="status-text">
                                <h3>SALA DE ESPERA</h3>
                                <p>Aguarde a ser llamado</p>
                            </div>
                        </div>
                    `;
                } else {
                    // CASO B: Si SÍ hay pacientes (esto sigue igual)
                    pacientes.forEach(patient => {
                        const li = document.createElement('li');
                        li.setAttribute('data-id', patient.id);
                        // Agregamos un icono de usuario antes del nombre para más estilo
                        li.innerHTML = `<span class="patient-icon">👤</span> ${patient.nombre} ${patient.apellido}`;
                        patientsListUI.appendChild(li);
                    });
                }
                // ---------------------------------------
            });
    };

    socket.on('actualizar_lista', cargarPacientes);
    socket.on('nuevo_paciente', cargarPacientes);

    // --- 🔔 LLAMADOS (DISEÑO MEJORADO) ---
    socket.on('llamada', (data) => {
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('notification');
        
        // Estructura HTML mejorada para el CSS nuevo
        notificationElement.innerHTML = `
            <span class="name">${data.nombre} ${data.apellido}</span>
            <div class="details">
                ${data.especialidad}<br>
                <strong>CONSULTORIO ${data.nro_consultorio}</strong>
            </div>
        `;
        
        notificationsContainer.prepend(notificationElement);

        if (notificationSound) {
            notificationSound.currentTime = 0;
            notificationSound.play().catch(() => {});
            
            // Bajar volumen video temporalmente
            const vol = videoPlayer.volume;
            videoPlayer.volume = 0.1;
            setTimeout(() => { videoPlayer.volume = vol; }, 3000);
        }

        // Solo mostramos el último llamado grande (o máx 2) para no tapar
        if (notificationsContainer.children.length > 2) {
            notificationsContainer.removeChild(notificationsContainer.lastChild);
        }
    });

    // --- ACTIVAR SONIDO ---
    enableSoundButton.addEventListener('click', () => {
        if (notificationSound) {
            notificationSound.play().then(() => {
                notificationSound.pause();
                notificationSound.currentTime = 0;
            });
        }
        videoPlayer.muted = false;
        if(videoPlayer.paused && videoList.length > 0) videoPlayer.play();
        enableSoundButton.style.display = 'none';
    });

    // Inicio
    cargarPacientes();
    iniciarReproductor();
});