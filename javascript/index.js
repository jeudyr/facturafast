document.getElementById('login').addEventListener('submit', function(event) {
    event.preventDefault(); // Evitar recargar la página

    let usuario = document.getElementById('usuario').value;
    let contrasena = document.getElementById('contrasena').value;

    console.log("🔍 Datos a enviar:", { usuario, contrasena });

    fetch("https://facturafast.onrender.com/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario: usuario,
            contrasena: contrasena
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {       
            // Guardar usuario en localStorage para usarlo en la otra página
            localStorage.setItem("loggedInUser", data.user.usuario);

            // Redirigir a la página principal
            window.location.href = "/Principal.html"; 
        } else {
            console.error("Error:", data.error);
            alert(" Credenciales incorrectas");
        }
    })
    .catch(error => console.error("Error en la petición:", error));
});


