
// simulador.js


// Configuración
const HORARIOS_LABORALES = {
    'Lunes': '9:00 AM - 6:00 PM',
    'Martes': '9:00 AM - 6:00 PM',
    'Miércoles': '9:00 AM - 6:00 PM',
    'Jueves': '9:00 AM - 6:00 PM',
    'Viernes': '9:00 AM - 6:00 PM',
    'Sábado': '9:00 AM - 1:00 PM'
};

const MENSAJES_ERROR = {
    nombre: 'El nombre debe tener al menos 2 palabras.',
    dni: 'El DNI debe tener entre 7 y 8 dígitos.',
    telefono: 'El teléfono debe tener al menos 10 dígitos.',
    email: 'Por favor, ingresa un correo electrónico válido.',
    consultorio: 'Por favor, selecciona un consultorio.',
    dia: 'Por favor, selecciona un día válido.'
};

// Clase principal 
class GestorTurnos {
    constructor() {
        this.turnos = this.cargarTurnos();
        this.inicializar();
    }

    // Inicialización 
    inicializar() {
        this.configurarEventos();
        this.actualizarHistorial();
    }

    // Configuración de eventos 
    configurarEventos() {
        // Botones principales
        document.getElementById('btnPedirTurno')?.addEventListener('click', () => this.abrirFormulario());
        document.getElementById('btnVerHistorial')?.addEventListener('click', () => this.mostrarHistorial());
        document.getElementById('btnConfirmarTurno')?.addEventListener('click', () => this.procesarTurno());
        document.getElementById('btnLimpiarHistorial')?.addEventListener('click', () => this.limpiarHistorial());

        // Validación en tiempo real
        ['nombre', 'dni', 'telefono', 'email', 'consultorio'].forEach(campo => {
            const input = document.getElementById(campo);
            if (input) {
                input.addEventListener('blur', () => this.validarCampo(campo, input.value));
                input.addEventListener('input', () => this.limpiarError(campo));
            }
        });

        // Actualizar el resumen
        document.getElementById('dia')?.addEventListener('change', () => this.mostrarResumen());
        document.getElementById('consultorio')?.addEventListener('change', () => this.mostrarResumen());
    }

    // Abrir el formulario
    abrirFormulario() {
        document.getElementById('formularioTurno').reset();
        this.limpiarTodosLosErrores();
        this.ocultarResumen();
        new bootstrap.Modal(document.getElementById('turnoModal')).show();
    }

    // Procesar el turno 
    procesarTurno() {
        const datos = this.recopilarDatos();

        if (this.validarFormulario(datos)) {
            this.guardarTurno(datos);
            this.mostrarConfirmacion();
            bootstrap.Modal.getInstance(document.getElementById('turnoModal')).hide();
            this.actualizarHistorial();
        }
    }

    // Recopilar los datos del formulario
    recopilarDatos() {
        const formData = new FormData(document.getElementById('formularioTurno'));
        const datos = {};

        for (let [key, value] of formData.entries()) {
            datos[key] = value.trim();
        }

        datos.fechaCreacion = new Date().toLocaleString('es-AR');
        datos.id = Date.now();

        return datos;
    }

    // Validación 
    validarFormulario(datos) {
        const camposObligatorios = ['nombre', 'dni', 'telefono', 'email', 'consultorio', 'dia'];
        let esValido = true;

        camposObligatorios.forEach(campo => {
            if (!datos[campo] || !this.validarCampo(campo, datos[campo])) {
                this.mostrarError(campo, MENSAJES_ERROR[campo]);
                esValido = false;
            }
        });

        return esValido;
    }

    // Validación por campos individuales
    validarCampo(campo, valor) {
        if (!valor || valor.trim().length === 0) return false;

        const validaciones = {
            nombre: () => valor.trim().split(' ').filter(p => p.length > 0).length >= 2,
            dni: () => /^\d+$/.test(valor) && valor.length >= 7 && valor.length <= 8,
            telefono: () => /^\d+$/.test(valor) && valor.length >= 10,
            email: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor),
            consultorio: () => ['Colonia Tirolesa', 'Villa Carlos Paz'].includes(valor),
            dia: () => Object.keys(HORARIOS_LABORALES).includes(valor)
        };

        return validaciones[campo] ? validaciones[campo]() : true;
    }

    // Mostrar los errores
    mostrarError(campo, mensaje) {
        const input = document.getElementById(campo);
        const errorDiv = document.getElementById(campo + 'Error');

        if (input && errorDiv) {
            input.classList.add('is-invalid');
            errorDiv.textContent = mensaje;
        }
    }

    // Limpiar los errores
    limpiarError(campo) {
        const input = document.getElementById(campo);
        const errorDiv = document.getElementById(campo + 'Error');

        if (input && errorDiv) {
            input.classList.remove('is-invalid');
            errorDiv.textContent = '';
        }
    }

    // Limpiar todos los errores
    limpiarTodosLosErrores() {
        ['nombre', 'dni', 'telefono', 'email', 'consultorio', 'dia'].forEach(campo => this.limpiarError(campo));
    }

    // Mostrar el resumen
    mostrarResumen() {
        const dia = document.getElementById('dia').value;
        const consultorio = document.getElementById('consultorio').value;
        const resumenDiv = document.getElementById('resumenTurno');
        const resumenContenido = document.getElementById('resumenContenido');

        if (dia && consultorio && resumenDiv && resumenContenido) {
            resumenContenido.innerHTML = `
                <strong>Consultorio:</strong> ${consultorio}<br>
                <strong>Día:</strong> ${dia}<br>
                <strong>Horario:</strong> ${HORARIOS_LABORALES[dia]}<br>
                <small class="text-muted">Nos pondremos en contacto contigo para confirmar el horario específico.</small>
            `;
            resumenDiv.style.display = 'block';
        } else {
            this.ocultarResumen();
        }
    }

    // Ocultar el resumen
    ocultarResumen() {
        const resumenDiv = document.getElementById('resumenTurno');
        if (resumenDiv) resumenDiv.style.display = 'none';
    }

    // Guardar el turno
    guardarTurno(datos) {
        this.turnos.push(datos);
        localStorage.setItem('turnosVitalis', JSON.stringify(this.turnos));
    }

    // Cargar los turnos
    cargarTurnos() {
        const turnosGuardados = localStorage.getItem('turnosVitalis');
        return turnosGuardados ? JSON.parse(turnosGuardados) : [];
    }

    // Mostrar la confirmación
    mostrarConfirmacion() {
        const notificacion = document.createElement('div');
        notificacion.className = 'alert alert-success position-fixed';
        notificacion.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        notificacion.innerHTML = `
            <h6>¡Turno confirmado exitosamente!</h6>
            <p>Nos pondremos en contacto contigo pronto para confirmar el horario específico.</p>
            <small>¡Gracias por elegir Vitalis!</small>
        `;

        document.body.appendChild(notificacion);
        setTimeout(() => notificacion.remove(), 5000);
    }

    // Mostrar el historial
    mostrarHistorial() {
        this.actualizarHistorial();
        new bootstrap.Modal(document.getElementById('historialModal')).show();
    }

    // Actualizar el historial
    actualizarHistorial() {
        const historialContenido = document.getElementById('historialContenido');
        if (!historialContenido) return;

        if (this.turnos.length === 0) {
            historialContenido.innerHTML = '<p class="text-muted">No hay turnos registrados.</p>';
            return;
        }

        const html = this.turnos.map((turno, index) => `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">Turno #${index + 1}</h6>
                        <p class="card-text">
                            <strong>Nombre:</strong> ${turno.nombre}<br>
                            <strong>DNI:</strong> ${turno.dni}<br>
                            <strong>Teléfono:</strong> ${turno.telefono}<br>
                            <strong>Email:</strong> ${turno.email}<br>
                            <strong>Consultorio:</strong> ${turno.consultorio}<br>
                            <strong>Día:</strong> ${turno.dia}<br>
                            <strong>Horario:</strong> ${HORARIOS_LABORALES[turno.dia]}<br>
                            ${turno.tratamiento ? `<strong>Tratamiento:</strong> ${turno.tratamiento}<br>` : ''}
                            <strong>Fecha de solicitud:</strong> ${turno.fechaCreacion}
                        </p>
                        ${turno.observaciones ? `<small class="text-muted"><strong>Observaciones:</strong> ${turno.observaciones}</small>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        historialContenido.innerHTML = `<div class="row">${html}</div>`;
    }

    // Borrar el historial
    limpiarHistorial() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los turnos registrados?')) {
            this.turnos = [];
            localStorage.removeItem('turnosVitalis');
            this.actualizarHistorial();
        }
    }
}

// Iniciar el simulador cuando Bootstrap esté listo
function inicializarSimulador() {
    if (typeof bootstrap !== 'undefined') {
        window.gestorTurnos = new GestorTurnos();
    } else {
        setTimeout(inicializarSimulador, 100);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarSimulador);