document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    
    // --- ELEMENTOS DEL DOM ---
    const callingListUI = document.getElementById('notifications-list'); // Izquierda
    const waitingListUI = document.getElementById('patients-list');      // Derecha
    const callingPanel = document.getElementById('col-calling');         // Para el flash
    const notificationSound = document.getElementById('notification-sound');
    const enableSoundBtn = document.getElementById('enable-sound');

    // --- 1. RELOJ (Hora y Fecha) ---
    const updateClock = () => {
        const now = new Date();
        // Usamos timeZone para asegurar hora argentina
        document.getElementById('clock-time').textContent = now.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'});
        document.getElementById('clock-date').textContent = now.toLocaleDateString('es-AR', {weekday:'long', day:'numeric', month:'long'});
    };
    setInterval(updateClock, 1000);
    updateClock(); // Ejecutar ya

    // --- 2. FUNCIÓN: HABLAR (Text-to-Speech) ---
    // Esto reemplaza al video como elemento "Wow"
    const hablar = (texto) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-AR'; // Intenta acento local
            utterance.rate = 0.9;     // Velocidad clara
            window.speechSynthesis.speak(utterance);
        }
    };

    // --- 3. GESTIÓN DE LISTA DE ESPERA ---
    const cargarListas = () => {
        fetch('/pacientes?nro_consultorio=') // Pide todos los pacientes
            .then(r => r.json())
            .then(pacientes => {
                waitingListUI.innerHTML = '';
                
                if (pacientes.length === 0) {
                    waitingListUI.innerHTML = '<div class="empty-message">SALA DE ESPERA VACÍA</div>';
                } else {
                    // Mostramos solo los primeros 8 para que entre bien en pantalla
                    const proximos = pacientes.slice(0, 8);
                    
                    proximos.forEach(p => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <span>👤 ${p.nombre} ${p.apellido}</span> 
                            <span style="font-size:0.8em; opacity:0.7">${p.especialidad}</span>
                        `;
                        waitingListUI.appendChild(li);
                    });
                }
            })
            .catch(err => console.error("Error cargando lista:", err));
    };

    // Escuchar eventos de actualización
    socket.on('actualizar_lista', cargarListas);
    socket.on('nuevo_paciente', cargarListas);

    // --- 4. LLAMADA (Core del sistema) ---
    socket.on('llamada', (data) => {
        // A. Efecto visual (Flash) en la columna
        callingPanel.classList.remove('flash-effect'); 
        void callingPanel.offsetWidth; // Truco para reiniciar animación CSS
        callingPanel.classList.add('flash-effect');

        // B. Crear la tarjeta visual
        const card = document.createElement('div');
        card.className = 'call-card';
        // Animación de entrada suave (requiere el CSS que te pasé antes)
        card.style.animation = 'slideInLeft 0.5s ease';
        
        card.innerHTML = `
            <div class="call-info">
                <h3>${data.nombre} ${data.apellido}</h3>
                <p>${data.especialidad}</p>
            </div>
            <div class="call-room">
                <span>PASAR AL</span>
                CONSULTORIO ${data.nro_consultorio}
            </div>
        `;
        
        // Insertar arriba de todo (el más nuevo primero)
        callingListUI.prepend(card);

        // C. Audio y Voz
        if(notificationSound) {
            notificationSound.currentTime = 0;
            notificationSound.play()
                .then(() => {
                    // Esperamos 1.5 seg (que termine el ding-dong) y luego habla
                    setTimeout(() => {
                        hablar(`Paciente ${data.apellido}, consultorio ${data.nro_consultorio}`);
                    }, 1500);
                })
                .catch(e => console.log("Falta interacción para audio. Clickea el botón rojo.", e));
        }

        // D. Limpieza de historial visual
        // IMPORTANTE: Dejamos 3 tarjetas en vez de 1.
        // La primera se ve grande, las otras bajan.
        if(callingListUI.children.length > 3) {
            callingListUI.removeChild(callingListUI.lastChild);
        }
        
        // Actualizamos la lista de espera (para sacar al que acabamos de llamar)
        cargarListas();
    });

    // --- 5. DETECTOR DE DESCONEXIÓN (Seguridad) ---
    socket.on('disconnect', () => {
        const offlineMsg = document.createElement('div');
        offlineMsg.id = 'offline-overlay';
        offlineMsg.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999; font-size:2rem; text-align:center;";
        offlineMsg.innerHTML = "<h1>⚠️ SISTEMA DESCONECTADO</h1><p>Reconectando...</p>";
        document.body.appendChild(offlineMsg);
    });

    socket.on('connect', () => {
        const existingOverlay = document.getElementById('offline-overlay');
        if (existingOverlay) existingOverlay.remove();
        cargarListas(); // Recargar datos al volver
    });

    // --- INICIALIZACIÓN ---
    // Botón rojo para activar audio (requisito de Chrome)
    enableSoundBtn.addEventListener('click', () => {
        notificationSound.play().then(() => { 
            notificationSound.pause(); 
            notificationSound.currentTime=0; 
        });
        enableSoundBtn.style.display = 'none';
    });

    // Carga inicial
    cargarListas();
});