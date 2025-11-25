document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    
    // Elementos
    const callingListUI = document.getElementById('notifications-list');
    const waitingListUI = document.getElementById('patients-list');
    const callingPanel = document.getElementById('col-calling'); // Panel central para el flash
    const videoElement = document.getElementById('promo-video');
    const imageElement = document.getElementById('static-banner');
    const notificationSound = document.getElementById('notification-sound');
    const enableSoundBtn = document.getElementById('enable-sound');

    // 1. RELOJ
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock-time').textContent = now.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'});
        document.getElementById('clock-date').textContent = now.toLocaleDateString('es-AR', {weekday:'long', day:'numeric', month:'long'});
    }, 1000);

    // 2. VIDEO INTELIGENTE (10 min)
    let videoList = [];
    const INTERVALO_VIDEO = 10 * 60 * 1000; 

    const cargarVideos = async () => {
        try {
            const res = await fetch('/api/videos');
            videoList = await res.json();
            if(videoList.length > 0) setTimeout(reproducirSecuencia, 5000);
        } catch (e) { console.error(e); }
    };

    const reproducirSecuencia = () => {
        if(videoList.length === 0) return;
        imageElement.style.display = 'none';
        videoElement.style.display = 'block';
        
        const randomVideo = videoList[Math.floor(Math.random() * videoList.length)];
        videoElement.src = `/media/videos/${randomVideo}`;
        videoElement.volume = 0.5;
        videoElement.play().catch(() => {});

        videoElement.onended = () => {
            videoElement.style.display = 'none';
            imageElement.style.display = 'block';
            setTimeout(reproducirSecuencia, INTERVALO_VIDEO);
        };
    };

    // 3. GESTIÓN DE LISTAS
    const cargarListas = () => {
        fetch('/pacientes?nro_consultorio=')
            .then(r => r.json())
            .then(pacientes => {
                waitingListUI.innerHTML = '';
                if (pacientes.length === 0) {
                    waitingListUI.innerHTML = '<div class="empty-message">SALA DE ESPERA VACÍA</div>';
                } else {
                    pacientes.forEach(p => {
                        const li = document.createElement('li');
                        li.innerHTML = `<span>👤 ${p.nombre} ${p.apellido}</span> <span style="font-size:0.8em; opacity:0.7">${p.especialidad}</span>`;
                        waitingListUI.appendChild(li);
                    });
                }
            });
    };

    socket.on('actualizar_lista', cargarListas);
    socket.on('nuevo_paciente', cargarListas);

    // 4. LLAMADA (Con Efecto Flash)
    socket.on('llamada', (data) => {
        // Activar Flash en la columna central
        callingPanel.classList.remove('flash-effect'); // Reiniciar si ya estaba
        void callingPanel.offsetWidth; // Truco para reiniciar animación
        callingPanel.classList.add('flash-effect');

        // Crear tarjeta
        const card = document.createElement('div');
        card.className = 'call-card';
        card.innerHTML = `
            <h3>${data.nombre} ${data.apellido}</h3>
            <p>${data.especialidad}</p>
            <div class="call-room">CONSULTORIO ${data.nro_consultorio}</div>
        `;
        callingListUI.prepend(card);

        if(notificationSound) {
            notificationSound.currentTime = 0;
            notificationSound.play().catch(() => {});
        }

        // Solo mantenemos 1 cartel gigante (el más importante)
        if(callingListUI.children.length > 1) {
            callingListUI.removeChild(callingListUI.lastChild);
        }
    });

    // 5. DETECTOR DE DESCONEXIÓN (Seguridad)
    socket.on('disconnect', () => {
        const offlineMsg = document.createElement('div');
        offlineMsg.id = 'offline-overlay';
        offlineMsg.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999; font-size:2rem; text-align:center;";
        offlineMsg.innerHTML = "<h1>⚠️ SISTEMA DESCONECTADO</h1><p>Intentando reconectar...</p>";
        document.body.appendChild(offlineMsg);
    });

    socket.on('connect', () => {
        const existingOverlay = document.getElementById('offline-overlay');
        if (existingOverlay) existingOverlay.remove();
        cargarListas(); // Recargar datos al volver
    });

    // Inicio
    enableSoundBtn.addEventListener('click', () => {
        notificationSound.play().then(() => { notificationSound.pause(); notificationSound.currentTime=0; });
        enableSoundBtn.style.display = 'none';
    });

    cargarListas();
    cargarVideos();
});