
document.getElementById('formularioRecuperacion').addEventListener('submit', generarCorreos);
let correos = [];
let correo="";
let numeroAleatorio="";

function generarCorreos(event) {
    event.preventDefault(); 
    correo = document.getElementById("correo").value.trim();//correo a cual se va a dirigir 
    numeroAleatorio = Math.floor(10000 + Math.random() * 90000);//cofigo que se va a enviar para luego validarlo
    if (!correo) {
        alert("⚠️ Por favor ingresa un correo válido");
        return;
    }
    enviarCodigoPorCorreo(correo, numeroAleatorio);
    agregarCampoVerificacion();
}

function agregarCampoVerificacion() {//limpia la interfaz y agrega lo necesario para la validacion
    const container = document.getElementById("codigo-container");
    container.innerHTML = "";
    const container2 = document.getElementById("formularioRecuperacion");
    container2.innerHTML = "";
    const inputCodigo = document.createElement("input");
    inputCodigo.type = "text";
    inputCodigo.id = "codigoIngresado";
    inputCodigo.placeholder = "Ingrese el código";
    
    // Crear botón de verificación
    const botonVerificar = document.createElement("button");
    botonVerificar.textContent = "VERIFICAR";
    botonVerificar.classList.add("verificar");
    botonVerificar.addEventListener("click", verificarCodigo);

    // Agregar elementos al contenedor
    container.appendChild(inputCodigo);
    container.appendChild(botonVerificar);
}

function verificarCodigo() {//verifica el codigo generado con el codigo puesto por el usuario
    let codigoIngresado = document.getElementById("codigoIngresado").value.trim();
    if (numeroAleatorio == codigoIngresado) {
        mostrarCampoNuevaContrasena();
    } else {
        alert("Código incorrecto. Intenta de nuevo.");
    }
}

function mostrarCampoNuevaContrasena() {//limpia la interfaz y agrega lo necesario para el cambio de contraseña
    const container = document.getElementById("codigo-container");
    container.innerHTML = "";

    // Crear input para la nueva contraseña
    const inputContrasena = document.createElement("input");
    inputContrasena.type = "password";
    inputContrasena.id = "nuevaContrasena";
    inputContrasena.placeholder = "Nueva contraseña";

    // Crear botón para guardar la nueva contraseña
    const botonGuardar = document.createElement("button");
    botonGuardar.textContent = "GUARDAR CONTRASEÑA";
    botonGuardar.classList.add("guardar");
    botonGuardar.addEventListener("click", guardarNuevaContrasena);

    container.appendChild(inputContrasena);
    container.appendChild(botonGuardar);
}

function guardarNuevaContrasena() {//edita el usuario con la nueva contraseña
    let contrasena = document.getElementById("nuevaContrasena").value.trim();
    if (!contrasena) {
        alert("⚠️ Por favor ingresa una nueva contraseña.");
        return;
    }

    fetch("https://facturafast.onrender.com/actualizarContrasena", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ contrasena, correo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Contraseña actualizada correctamente.");
            window.location.href = "../html/index.html";
        } else {
            alert("Error al actualizar la contraseña.");
        }
    })
    .catch(error => console.error("Error:", error));
}

function enviarCodigoPorCorreo(correo, codigo) {//genera un correo con el codigo
    fetch("https://facturafast.onrender.com/generarCorreo", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ correo, codigo })
    })
    .then(response => response.json())
    .then(data => console.log("Respuesta del servidor:", data))
    .catch(error => console.error("Error al enviar correo:", error));
}