// public/js/index.js

// --- 1. GUARDIA DE SEGURIDAD ---
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
    
    // Elementos de Pestañas e Historial
    const tabEspera = document.getElementById('tab-espera');
    const tabHistorial = document.getElementById('tab-historial');
    const vistaEspera = document.getElementById('vista-espera');
    const vistaHistorial = document.getElementById('vista-historial');
    const historialBody = document.getElementById('historial-body');
    const btnReset = document.getElementById('btn-reset');

    // --- 2. LÓGICA DE SOCKETS (Centralizada) ---

    // Feedback visual cuando se llama a alguien
    socket.on('llamada', (data) => {
        notificationElement.textContent = `Llamando a ${data.nombre} ${data.apellido}`;
        notificationElement.style.display = 'block';
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 3000);
    });

    // Cuando cambia la lista (nuevo paciente, atendido, o reset)
    socket.on('actualizar_lista', () => {
        console.log('Socket: Actualizando datos...');
        // Si estamos viendo la espera, recargamos la espera
        if (vistaEspera.style.display !== 'none') {
            consultarPacientes();
        }
        // Si estamos viendo el historial, recargamos el historial
        if (vistaHistorial.style.display !== 'none') {
            cargarHistorial();
        }
    });

    socket.on('nuevo_paciente', () => {
        // Solo nos interesa recargar la lista de espera
        if (vistaEspera.style.display !== 'none') {
            consultarPacientes();
        }
    });

    // --- 3. FUNCIONES GLOBALES (Para los botones en el HTML) ---

    window.llamarPaciente = (id) => {
        fetch(`/llamar/${id}`, { method: 'POST' })
            .then(res => { if (!res.ok) console.error('Error al llamar'); })
            .catch(err => console.error('Error de red:', err));
    };

    window.marcarAtendido = (id, motivo) => {
        fetch(`/atendido/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivo }),
        })
        .then(res => { if (!res.ok) console.error('Error al marcar'); })
        .catch(err => console.error('Error de red:', err));
    };

    // --- 4. LÓGICA DE VISTA (Dibujar Listas) ---

    // A. Lista de Espera
    const consultarPacientes = () => {
        const nroConsultorio = consultorioSelect.value;
        fetch(`/pacientes?nro_consultorio=${nroConsultorio}`)
            .then(response => response.json())
            .then(pacientes => {
                listaPacientesUI.innerHTML = ''; 
                pacientes.forEach(paciente => {
                    const item = document.createElement('li');
                    item.setAttribute('data-id', paciente.id);
                    
                    const horario = new Date(paciente.horario).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                });
            });
    };

    // B. Lista de Historial
    const cargarHistorial = () => {
        fetch('/historial')
            .then(res => res.json())
            .then(pacientes => {
                historialBody.innerHTML = '';
                pacientes.forEach(p => {
                    const fecha = new Date(p.horario);
                    const hora = fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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

    // --- 5. PESTAÑAS Y EVENTOS ---

    const cambiarPestaña = (tab) => {
        if (tab === 'espera') {
            vistaEspera.style.display = 'block';
            vistaHistorial.style.display = 'none';
            tabEspera.classList.add('active');
            tabHistorial.classList.remove('active');
            consultarPacientes();
        } else {
            vistaEspera.style.display = 'none';
            vistaHistorial.style.display = 'block';
            tabEspera.classList.remove('active');
            tabHistorial.classList.add('active');
            cargarHistorial();
        }
    };

    tabEspera.addEventListener('click', () => cambiarPestaña('espera'));
    tabHistorial.addEventListener('click', () => cambiarPestaña('historial'));
    consultarBtn.addEventListener('click', consultarPacientes);

    // --- 6. BOTÓN RESET (Cerrar Día) ---
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            Swal.fire({
                title: '¿Cerrar el día?',
                text: "Esto borrará TODOS los pacientes y el historial. No se puede deshacer.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, borrar todo',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const res = await fetch('/api/reset', { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) {
                        Swal.fire('¡Borrado!', 'Sistema reiniciado.', 'success');
                        // Actualizamos la vista actual
                        vistaEspera.style.display !== 'none' ? consultarPacientes() : cargarHistorial();
                    }
                }
            });
        });
    }

    // --- 7. INICIALIZACIÓN ---
    consultarPacientes(); 
});