// Script para manejar el formulario de turnos de Vitalis
// Variables globales
const HORARIOS_LABORALES = {
    'Lunes': '9:00 AM - 6:00 PM',
    'Martes': '9:00 AM - 6:00 PM',
    'Miércoles': '9:00 AM - 6:00 PM',
    'Jueves': '9:00 AM - 6:00 PM',
    'Viernes': '9:00 AM - 6:00 PM',
    'Sábado': '9:00 AM - 1:00 PM'
};

const DIAS_DISPONIBLES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MENSAJES_ERROR = {
    nombre: 'El nombre debe tener al menos 2 palabras y solo letras.',
    dni: 'El DNI debe tener entre 7 y 8 dígitos numéricos.',
    telefono: 'El teléfono debe tener al menos 10 dígitos numéricos.',
    email: 'Por favor, ingresa un correo electrónico válido.',
    dia: 'Por favor, selecciona un número válido entre 1 y 6.'
};

class TurnoManager {
    constructor() {
        // Variables de instancia
        this.datosUsuario = {};
        this.datosTurno = {};
        this.contadorIntentos = 0;
        this.maxIntentos = 3;
        this.init();
    }

    init() {
        // Función de inicio
        console.log('Inicializando simulador de turnos...');
        let botonTurno = document.querySelector('.nav-item.user-icon button');

        if (botonTurno) {
            botonTurno.addEventListener('click', () => this.iniciarFormulario());
            console.log('Botón de turno encontrado y configurado');
        } else {
            console.error('No se encontró el botón de turno');
        }
    }

    async iniciarFormulario() {
        // Función principal que coordina todo el proceso
        try {
            console.log('Iniciando formulario de turno...');
            this.contadorIntentos = 0;

            const datosPersonalesCompletados = await this.recolectarDatosPersonales();
            if (!datosPersonalesCompletados) {
                return; // El usuario cancela
            }

            const datosTurnoCompletados = await this.recolectarDatosTurno();
            if (!datosTurnoCompletados) {
                return; // El usuario cancela
            }

            await this.mostrarConfirmacion();
        } catch (error) {
            console.error('Error en el formulario:', error);
            alert('Ha ocurrido un error en el formulario. Por favor, inténtalo nuevamente.');
        }
    }

    async recolectarDatosPersonales() {
        // Función para recolectar datos personales con validaciones
        console.log('Recolectando datos personales...');

        const camposRequeridos = [
            { nombre: 'nombre', tipo: 'text', validacion: this.validarNombre },
            { nombre: 'DNI', tipo: 'text', validacion: this.validarDNI },
            { nombre: 'telefono', tipo: 'tel', validacion: this.validarTelefono },
            { nombre: 'email', tipo: 'email', validacion: this.validarEmail }
        ];

        //  procesar cada campo
        for (let i = 0; i < camposRequeridos.length; i++) {
            const campo = camposRequeridos[i];
            let valorValido = false;

            //  validación
            while (!valorValido && this.contadorIntentos < this.maxIntentos) {
                const valor = await this.pedirDato(`Por favor, ingresa tu ${campo.nombre}:`, campo.tipo);

                if (valor === null) {
                    alert('Formulario cancelado');
                    return false;
                }

                if (campo.validacion(valor)) {
                    this.datosUsuario[campo.nombre] = valor.trim();
                    valorValido = true;
                    console.log(`${campo.nombre} validado correctamente`);
                } else {
                    alert(MENSAJES_ERROR[campo.nombre]);
                    this.contadorIntentos++;

                    if (this.contadorIntentos >= this.maxIntentos) {
                        alert('Has excedido el número máximo de intentos. El formulario se reiniciará.');
                        return false;
                    }
                }
            }
        }

        console.log('Datos personales recolectados exitosamente');
        return true;
    }

    async recolectarDatosTurno() {
        //  recolectar datos del turno
        console.log('Recolectando datos del turno...');

        let mensajeDias = 'Selecciona el dia para tu turno:\n';
        for (let i = 0; i < DIAS_DISPONIBLES.length; i++) {
            mensajeDias += `${i + 1}. ${DIAS_DISPONIBLES[i]}\n`;
        }
        mensajeDias += '\nIngresa el número del día (1-6):';

        const diaSeleccionado = await this.pedirDato(mensajeDias, 'text');

        if (diaSeleccionado === null) {
            alert('Formulario cancelado');
            return false;
        }

        const diaNumero = parseInt(diaSeleccionado);

        //  validar el dia
        if (isNaN(diaNumero)) {
            alert(MENSAJES_ERROR.dia);
            return await this.recolectarDatosTurno();
        }

        if (diaNumero < 1 || diaNumero > DIAS_DISPONIBLES.length) {
            alert(MENSAJES_ERROR.dia);
            return await this.recolectarDatosTurno();
        }

        this.datosTurno = {
            dia: DIAS_DISPONIBLES[diaNumero - 1],
            horario: HORARIOS_LABORALES[DIAS_DISPONIBLES[diaNumero - 1]]
        };

        console.log('Datos del turno recolectados exitosamente');
        return true;
    }

    async mostrarConfirmacion() {
        //  mostrar confirmacion
        console.log('Mostrando confirmacion...');

        const resumen = this.generarResumen();
        const confirmacion = await this.pedirDato(
            `${resumen}\n\n¿Los datos son correctos? (si/no):`,
            'text'
        );

        if (confirmacion === null) {
            alert('Formulario cancelado');
            return false;
        }

        //  manejar la respuesta
        if (confirmacion.toLowerCase() === 'si' || confirmacion.toLowerCase() === 'sí') {
            this.mostrarConfirmacionExitosa();
            return true;
        } else if (confirmacion.toLowerCase() === 'no' || confirmacion.toLowerCase() === 'n') {
            alert('Vamos a empezar de nuevo con el formulario.');
            this.limpiarDatos();
            await this.iniciarFormulario();
            return true;
        } else {
            alert('Por favor, responde "si" o "no".');
            return await this.mostrarConfirmacion();
        }
    }

    generarResumen() {
        // Función para generar el resumen de datos
        console.log('Generando resumen...');

        let resumen = '=== RESUMEN DE TURNO ===\n\n';
        resumen += 'DATOS PERSONALES:\n';

        //  mostrar datos personales
        for (const [clave, valor] of Object.entries(this.datosUsuario)) {
            resumen += `• ${clave.charAt(0).toUpperCase() + clave.slice(1)}: ${valor}\n`;
        }

        resumen += '\nDATOS DEL TURNO:\n';
        resumen += `• Día: ${this.datosTurno.dia}\n`;
        resumen += `• Horario: ${this.datosTurno.horario}\n`;

        resumen += '\nHORARIOS DISPONIBLES:\n';
        //  mostrar horarios
        for (const [dia, horario] of Object.entries(HORARIOS_LABORALES)) {
            resumen += `• ${dia}: ${horario}\n`;
        }

        return resumen;
    }

    mostrarConfirmacionExitosa() {
        // Función para mostrar confirmacion exitosa
        console.log('Mostrando confirmacion exitosa...');

        const mensaje = `¡Turno confirmado exitosamente!\n\n${this.generarResumen()}\nNos pondremos en contacto contigo pronto para confirmar el horario específico.\n\n¡Gracias por elegir Vitalis!`;

        alert(mensaje);
        console.log('Turno confirmado exitosamente');
    }

    limpiarDatos() {
        // Función para limpiar datos
        console.log('Limpiando datos...');
        this.datosUsuario = {};
        this.datosTurno = {};
        this.contadorIntentos = 0;
    }

    async pedirDato(mensaje, tipo) {
        // Función para pedir datos al usuario
        return new Promise((resolve) => {
            const valor = prompt(mensaje);
            resolve(valor);
        });
    }

    // Funciones de validación
    validarNombre(nombre) {
        if (!nombre || nombre.trim().length < 3) return false;
        const palabras = nombre.trim().split(' ').filter(palabra => palabra.length > 0);
        if (palabras.length < 2) return false;
        const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre);
        return soloLetras;
    }

    validarDNI(dni) {
        if (!dni) return false;
        const soloNumeros = /^\d+$/.test(dni);
        return soloNumeros && dni.length >= 7 && dni.length <= 8;
    }

    validarTelefono(telefono) {
        if (!telefono) return false;
        const soloNumeros = /^\d+$/.test(telefono);
        return soloNumeros && telefono.length >= 10;
    }

    validarEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Función de inicialización
function inicializarSimulador() {
    console.log('Inicializando simulador...');
    new TurnoManager();
}

// Inicializar el manager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarSimulador);
