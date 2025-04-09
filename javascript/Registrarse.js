let usuario;
let contrasena;
let nombre;
let apellidos;
let correo;
let celular;
let codigo=-1;
document.getElementById('registrar').addEventListener('submit', generar);


async function generar(event) {
    event.preventDefault();  
    let validar = await mantenerDatos();//mantiene los datos y hace sus respectivas validaciones
    if(validar==false){
        return;
    } 
    const Valido = await validarExistencia();//valida si el usuario y el correo ya han sido utilizados
    if (Valido==false){
        return;
    } 

    generarCorreos();
}


function generarCorreos() {
    codigo = Math.floor(10000 + Math.random() * 90000);//codifo para la verificacion
    if (!correo) {
        alert("⚠️ Por favor ingresa un correo válido");
        return;
    }
    enviarCodigoPorCorreo(correo, codigo);
    agregarCampoVerificacion();
}


function enviarCodigoPorCorreo(correo, codigo) {//genera un correo con el codigo
    fetch("https://facturafast.onrender.com/generarCorreoVerificacion", {
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

function agregarCampoVerificacion() {//actualiza la intefaz para la validacion
    const contain = document.getElementById("registrar");
    contain.innerHTML = "";
    const container = document.getElementById("codigo-container");
    container.innerHTML = "";
    const inputCodigo = document.createElement("input");
    inputCodigo.type = "text";
    inputCodigo.id = "codigoIngresado";
    inputCodigo.placeholder = "Ingrese el código enviado a el correo";
    
    // Crear botón de verificación
    const botonVerificar = document.createElement("button");
    botonVerificar.textContent = "VERIFICAR";
    botonVerificar.classList.add("verificar");
    botonVerificar.addEventListener("click", verificarCodigo);

    // Agregar elementos al contenedor
    container.appendChild(inputCodigo);
    container.appendChild(botonVerificar);
}

function verificarCodigo() {//verifica el codigo generado con el puesto por el usuario
    let codigoIngresado = document.getElementById("codigoIngresado").value.trim();
    console.log(codigo);
    if (codigo == codigoIngresado) {
        const container = document.getElementById("codigo-container");
        container.innerHTML = "";
        guardarDatos();
    } else {
        alert("Código incorrecto. Intenta de nuevo.");
    }
}

async function mantenerDatos() {
    event.preventDefault(); 

    usuario = document.getElementById('usuario').value;
    contrasena = document.getElementById('contrasena').value;
    nombre = document.getElementById('nombre').value;
    apellidos = document.getElementById('apellidos').value;
    correo = document.getElementById('correo').value.trim();
    celular = document.getElementById('celular').value;

    // Verificar que todos los campos estén completos
    if (!usuario || !contrasena || !nombre || !apellidos || !correo || !celular) {
        alert("Todos los campos son obligatorios");
        return false;
    }

    // Expresión regular para validar el formato del correo
    let correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (contrasena.length <= 5 || contrasena.length >=30) {
        alert("La contraseña no puede ser, intente con otra");
        return false;
    }

    if (!correoValido.test(correo)) {//valida el correo
        alert("Por favor ingresa un correo electrónico válido");
        return false;
    }

    let celularValido = /^\d{8}$/;
    if (!celularValido.test(celular)) {//valida el numero de celular
        alert("Por favor ingresa un número de celular válido de 8 dígitos");
        return false;
    }
    let soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!soloLetras.test(nombre)) {
        alert("El nombre no debe contener números ni caracteres especiales");
        return false;
    }
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();

    // Validar y formatear apellidos (sin números, primeras letras en mayúscula)
    if (!soloLetras.test(apellidos)) {
        alert("Los apellidos no deben contener números ni caracteres especiales");
        return false;
    }
    apellidos = apellidos
        .split(" ")
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
        .join(" ");

    return true;
}

function guardarDatos(){//guarda los datos a la tabla
    console.log("🔍 Datos a enviar:", { usuario, contrasena, nombre, apellidos, correo, celular });
    fetch("https://facturafast.onrender.com/usuarios", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ usuario, contrasena, nombre, apellidos, correo, celular }) 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }
        return response.json();
    })
    .then(data => {
        alert("Usuario agregado correctamente");
        window.location.href = "../html/index.html"
        document.getElementById('registrar').reset(); //Limpiar el formulario
    })
    .catch(err => {
        console.error("Error al agregar usuario:", err);
        alert("Usuario ya utlizado");
    });
}

async function validarExistencia() {//valida si ya existe el correo y el usuario
    const correoValido = await validarCorreo();
    
    if (correoValido==false){
        return false;
    }

    const usuarioValido = await validarUsuario();
    console.log(usuarioValido);
    if (usuarioValido ==false){
        return false;
    } 

    return true;
}

async function validarCorreo() {
    try {
        console.log(correo);
        const response = await fetch("https://facturafast.onrender.com/verificarCorreo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                correo: correo 
            })
        });

        const data = await response.json();

        if (!data.valid) {
            alert("correo electronico ya registrado");
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error en la petición:", error);
        return false;
    }
}

async function validarUsuario() {
    console.log(usuario);
    try {
        const response = await fetch("https://facturafast.onrender.com/verificarUsuario", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario: usuario
            })
        });

        const data = await response.json();

        if (!data.valid) {
            alert("Usuario ya registrado");
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error en la petición:", error);
        return false;
    }
}


