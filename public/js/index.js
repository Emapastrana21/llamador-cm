// GUARDIA DE SEGURIDAD
if (!localStorage.getItem('usuario_autorizado')) {
    window.location.href = '/login.html';
}
document.addEventListener('DOMContentLoaded', () => {
    // Conectamos este panel al servidor de Sockets
    const socket = io();

    // Obtenemos los elementos del HTML
    const notificationElement = document.getElementById('notification');
    const consultarBtn = document.getElementById('consultar-btn');
    const consultorioSelect = document.getElementById('consultorio-select');
    const listaPacientesUI = document.getElementById('pacientes-lista');

    // --- 1. LÓGICA DE SOCKETS (Qué hacer cuando el servidor avisa) ---

    // El servidor avisa que se envió una llamada (para mostrar un feedback)
    socket.on('llamada', (data) => {
        notificationElement.textContent = `Llamando a ${data.nombre} ${data.apellido}`;
        notificationElement.style.display = 'block';
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 3000); // 3 segundos
    });

    // El servidor avisa que la lista cambió (alguien se registró o fue atendido)
    socket.on('actualizar_lista', () => {
        console.log('Socket: "actualizar_lista" recibido. Recargando pacientes...');
        consultarPacientes(); // Volvemos a pedir la lista
    });

    socket.on('nuevo_paciente', () => {
        console.log('Socket: "nuevo_paciente" recibido. Recargando pacientes...');
        consultarPacientes(); // Volvemos a pedir la lista
    });

    // --- 2. LÓGICA DE BOTONES (Qué hacer cuando el médico hace clic) ---

    // Función para el botón "Llamar"
    window.llamarPaciente = (id) => {
        // Usamos fetch con POST al endpoint /llamar/:id
        fetch(`/llamar/${id}`, {
            method: 'POST'
        })
        .then(response => {
            if (!response.ok) console.error('Error al llamar');
        })
        .catch(err => console.error('Error de red:', err));
    };

    // Función para los botones "Atendido" y "No Atendido"
    window.marcarAtendido = (id, motivo) => {
        // Usamos fetch con PATCH al endpoint /atendido/:id
        fetch(`/atendido/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ motivo }), // Enviamos el motivo
        })
        .then(response => {
            if (!response.ok) console.error('Error al marcar atendido');
            // No hacemos nada más, el socket 'actualizar_lista' se encargará
        })
        .catch(err => console.error('Error de red:', err));
    };

    // --- 3. LÓGICA DE VISTA (Dibujar la lista) ---

    // Función principal para pedir y dibujar la lista de pacientes
    const consultarPacientes = () => {
        const nroConsultorio = consultorioSelect.value;
        
        // Pedimos al backend la lista, filtrando por consultorio
        fetch(`/pacientes?nro_consultorio=${nroConsultorio}`)
            .then(response => response.json())
            .then(pacientes => {
                listaPacientesUI.innerHTML = ''; // Limpiar la lista
                
                // Dibujar cada paciente
                pacientes.forEach(paciente => {
                    const item = document.createElement('li');
                    item.setAttribute('data-id', paciente.id);
                    
                    const horario = new Date(paciente.horario).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// ... dentro del forEach ...
                    
                    // HTML interno MEJORADO para cada item
                    item.innerHTML = `
                        <div class="card-content">
                            <div class="card-header">
                                <span class="patient-name">${paciente.nombre} ${paciente.apellido}</span>
                                <span class="patient-time">${horario}</span>
                            </div>
                            <div class="card-details">
                                <span class="detail-badge">📝 ${paciente.especialidad}</span>
                                <span class="detail-text">DNI: ${paciente.dni}</span>
                            </div>
                        </div>
                        
                        <div class="btn-container">
                            <button onclick="llamarPaciente(${paciente.id})" class="btn btn-llamar">📢 Llamar</button>
                            <button onclick="marcarAtendido(${paciente.id}, 'ATENDIDO')" class="btn btn-atendido">✅ Atendido</button>
                            <button onclick="marcarAtendido(${paciente.id}, 'NO ATENDIDO')" class="btn btn-no-atendido">❌ Ausente</button>
                        </div>
                    `;
                    listaPacientesUI.appendChild(item);
                    // ...
                });
            });
    };

    // --- 4. INICIO ---

    // Conectar el botón "Consultar" a la función
    consultarBtn.addEventListener('click', consultarPacientes);
    
    // Cargar la lista de pacientes apenas se abre la página
    consultarPacientes(); 
// ... (todo tu código anterior) ...
    
    // Cargar la lista de pacientes apenas se abre la página
    consultarPacientes(); 

    // ==================================================
    //      ⬇️  Cambio de historial  ⬇️
    // ==================================================

    const tabEspera = document.getElementById('tab-espera');
    const tabHistorial = document.getElementById('tab-historial');
    const vistaEspera = document.getElementById('vista-espera');
    const vistaHistorial = document.getElementById('vista-historial');
    const historialBody = document.getElementById('historial-body');

    // Función para cambiar de pestaña
    const cambiarPestaña = (tab) => {
        if (tab === 'espera') {
            vistaEspera.style.display = 'block';
            vistaHistorial.style.display = 'none';
            tabEspera.classList.add('active');
            tabHistorial.classList.remove('active');
            consultarPacientes(); // Refrescar espera
        } else {
            vistaEspera.style.display = 'none';
            vistaHistorial.style.display = 'block';
            tabEspera.classList.remove('active');
            tabHistorial.classList.add('active');
            cargarHistorial(); // Cargar datos de la tabla
        }
    };

    tabEspera.addEventListener('click', () => cambiarPestaña('espera'));
    tabHistorial.addEventListener('click', () => cambiarPestaña('historial'));

    // Función para pedir el historial al backend
    const cargarHistorial = () => {
        fetch('/historial')
            .then(res => res.json())
            .then(pacientes => {
                historialBody.innerHTML = ''; // Limpiar tabla
                
                pacientes.forEach(p => {
                    const fecha = new Date(p.horario);
                    const hora = fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    // Determinar color del estado
                    const estadoClass = p.motivo === 'ATENDIDO' ? 'status-ok' : 'status-no';
                    
                    const row = `
                        <tr>
                            <td>${hora}</td>
                            <td>${p.nombre} ${p.apellido}</td>
                            <td>${p.dni}</td>
                            <td>${p.especialidad}</td>
                            <td><span class="badge ${estadoClass}">${p.motivo}</span></td>
                        </tr>
                    `;
                    historialBody.innerHTML += row;
                });
            });
    };

    // Si llega un socket de actualización, y estamos viendo el historial, refrescarlo
    socket.on('actualizar_lista', () => {
        if (vistaHistorial.style.display === 'block') {
            cargarHistorial();
        }
    });

});