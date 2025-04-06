let idTemp=-1;
let productos=[];
let productosFacturar = [];

// Recuperar el rol del usuario o establecer "empleado" por defecto
let userRole = localStorage.getItem("userRole") || "empleado";
updateProductList();

document.addEventListener("DOMContentLoaded", function () {
    // Obtener datos del usuario y el rol almacenado
    const user = localStorage.getItem("loggedInUser");
    const role = localStorage.getItem("userRole") || "Admin"; // Admin por defecto

    if (user) {
        document.getElementById("loggedInUserLabel").textContent = `(${user})`;
    }
    document.getElementById("userRoleDisplay").textContent = role; // Mostrar el rol actual

    // Aplicar restricciones de acceso según el rol
    updateRoleRestrictions(role);

    // Si el usuario es Admin, ir a "Productos". Si es Empleado, ir a "Facturación"
    if (role === "Admin") {
        changeTab("productos");
    } else {
        changeTab("facturacion");
    }
});

function changeUserRole() {
    const usuario = localStorage.getItem("loggedInUser"); // Obtener el usuario guardado
    let currentRole = localStorage.getItem("userRole") || "Admin"; // Obtener el rol actual

    if (!usuario) {
        alert("No hay un usuario autenticado.");
        return;
    }

    // Pedir la contraseña antes de cambiar el rol
    const contrasena = prompt(`Introduce tu contraseña para cambiar a ${currentRole === "Admin" ? "Empleado" : "Admin"}:`);

    if (!contrasena) {
        alert("Debes ingresar tu contraseña.");
        return;
    }

    // Validar la contraseña con el servidor
    fetch("https://facturafast.onrender.com/verify-password", {
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
        if (data.valid) {
            // Cambiar entre "Admin" y "Empleado"
            let newRole = currentRole === "Admin" ? "Empleado" : "Admin";
            localStorage.setItem("userRole", newRole); // Guardar el nuevo rol
            document.getElementById("userRoleDisplay").textContent = newRole; // Mostrar el nuevo rol
            alert(`Rol cambiado a ${newRole}`);

            // Aplicar restricciones
            updateRoleRestrictions(newRole);

            // Si el usuario cambia a "Empleado", ir a "Facturación"
            if (newRole === "Empleado") {
                changeTab("facturacion");
            }
        } else {
            alert(" Contraseña incorrecta. No puedes cambiar el rol.");
        }
    })
    .catch(error => console.error("Error en la verificación:", error));
}

// Función para deshabilitar la pestaña de "Productos" si el rol es "Empleado"
function updateRoleRestrictions(role) {
    const productosTab = document.getElementById("productosTab");

    if (role === "Empleado") {
        productosTab.disabled = true; 
        productosTab.style.opacity = "0.5";  
        productosTab.style.cursor = "not-allowed"; 
    } else {
        productosTab.disabled = false; 
        productosTab.style.opacity = "1";
        productosTab.style.cursor = "pointer";
    }
}

//Función para cambiar de pestaña
function changeTab(tabId) {
    // Ocultar todas las pestañas
    const allTabs = document.querySelectorAll(".tab-content");
    allTabs.forEach(tab => tab.style.display = "none");

    // Quitar la clase "active" de todos los botones de pestañas
    const allTabButtons = document.querySelectorAll(".tab-button");
    allTabButtons.forEach(button => button.classList.remove("active"));

    // Mostrar la pestaña seleccionada y activar su botón
    document.getElementById(tabId).style.display = "block";
    document.querySelector(`[onclick="changeTab('${tabId}')"]`).classList.add("active");
}


document.getElementById("productType").addEventListener("change", function () {
    const selectedType = this.value;
    const quantityInput = document.getElementById("productQuantity");

    if (selectedType === "servicio") {
        quantityInput.disabled = true;
        quantityInput.value = ''; //limpiar el valor
    } else {
        quantityInput.disabled = false;
    }
});

//guarda los datos
document.getElementById('productForm').addEventListener('submit', function(event) {
    event.preventDefault();

    let nombre = document.getElementById('productName').value;
    let descripcion = document.getElementById('productDescription').value;
    let tipo = document.getElementById('productType').value;
    let cantidad = parseInt(document.getElementById('productQuantity').value);
    if(tipo=="servicio"){
        cantidad=1;
    }
    let precio = parseFloat(document.getElementById('productPrice').value);
    let usuario = localStorage.getItem("loggedInUser");
    console.log(usuario);

    if (!nombre || !descripcion || !tipo || isNaN(cantidad) || isNaN(precio)) {
        alert("Todos los campos son obligatorios");
        return;
    }
    if(idTemp==-1){
        fetch("https://facturafast.onrender.com/guardarProductos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, descripcion, cantidad, precio, usuario, tipo}) 
        })
        .then(response => response.json())
        .then(data => {
            console.log("Producto agregado:", data);
            alert("Producto agregado correctamente");
            updateProductList(); // Actualiza la lista después de agregar
        })
        .catch(err => {
            console.error("Error al agregar producto:", err);
            alert("Error al agregar el producto");
        });
    }else{
        fetch("https://facturafast.onrender.com/editar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, descripcion, tipo, cantidad, precio, idTemp }) 
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert("Producto editado correctamente");
                updateProductList();
                idTemp=-1;
            } else {
                alert("Error: " + data.error);
            }
        })
        .catch(err => {
            console.error("Error al editar producto:", err);
            alert("Error al editar el producto");
        });
    }
    this.reset();
});

function cerrar(){
    window.location.href = "/index.html"; 
}

function updateProductList() {
    let productosLista = document.getElementById("productList");
    productosLista.innerHTML = ""; // Limpiar la lista
    let productSelect = document.getElementById("productSelect"); // Asegúrate de obtener el elemento select
    productSelect.innerHTML = ""; // Limpiar el select antes de agregar nuevas opciones
    productos = [];
    let usuario = localStorage.getItem("loggedInUser");
    fetch("https://facturafast.onrender.com/productos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ usuario }) // Enviar el usuario en el body
    })
    .then(response => response.json())
    .then(results => {
        console.log("Resultados obtenidos del servidor:", results);  // Para ver la estructura
        productosLista.innerHTML = ""; 
        results.forEach((product) => {
            let li = document.createElement("li");
            productos.push(product);
            if(product.tipo!="servicio"){
                li.innerHTML = `
                ${product.nombre} - ${product.descripcion} | 
                Tipo: ${product.tipo} |  
                Cantidad: ${product.cantidad} | 
                Precio: ₡${parseFloat(product.precio).toFixed(2)}
                <span class="button-container">
                <button class="edit-button btn btn-edit" onclick="editProduct(${product.idproducto})">
                    📝
                </button>
            </span>
            `;
            }else{
                li.innerHTML = `
                ${product.nombre} - ${product.descripcion} | 
                Tipo: ${product.tipo} |  
                Precio: ₡${parseFloat(product.precio).toFixed(2)}
                <span class="button-container">
                <button class="edit-button btn btn-edit" onclick="editProduct(${product.idproducto})">
                    📝
                </button>
            </span>
            `;
            }
            
            productosLista.appendChild(li);
            let option = document.createElement('option');
            option.value = product.idproducto; 
            option.textContent = `${product.nombre}`;
            productSelect.appendChild(option);
        });
    })
    .catch(err => console.error("Error al obtener productos:", err));
}

function eliminarProducto(idProducto) {
    fetch("https://facturafast.onrender.com/eliminarProducto", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ idProducto }) 
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert("Producto borrado correctamente");
            updateProductList();
            idTemp=-1;
        } else {
            alert("Error: " + data.error);
        }
    })
    .catch(err => {
        console.error("Error al editar producto:", err);
        alert("Error al eliminar el producto");
    });
}


function editProduct(idProducto) {
    fetch("https://facturafast.onrender.com/editarMostrar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ idProducto }) 
    })
    .then(response => response.json())
    .then(data => {
        if (data.producto) { // Verificar que se recibió un producto
            const product = data.producto;
            document.getElementById('productName').value = product.nombre;
            document.getElementById('productDescription').value = product.descripcion;
            document.getElementById('productType').value = product.tipo;
            document.getElementById('productQuantity').value = product.cantidad;
            document.getElementById('productPrice').value = product.precio;
            idTemp=idProducto;
        } else {
            console.error("Error: Producto no encontrado");
        }
    })
    .catch(err => console.error("Error al obtener el producto:", err));
}

document.getElementById('invoiceForm').addEventListener('submit', agregarFactura);

function agregarFactura(event) {
    event.preventDefault();

    let id = document.getElementById('productSelect').value;
    let cantidad = parseInt(document.getElementById('cantidadFacturacion').value);
    let listaFacturacion = document.getElementById('listaFacturacion');
    let totalAmountElement = document.getElementById('totalAmount'); 
    let totalAmount = parseFloat(totalAmountElement.textContent) || 0;

    if (!id) {
        alert("Seleccione un producto válido.");
        return;
    }

    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Ingrese una cantidad válida.");
        return;
    }

    let ProductoSeleccionado = productos.find(p => p.idproducto == id);

    if (!ProductoSeleccionado) {
        alert("Error: Producto no encontrado en el inventario.");
        return;
    }

    if(ProductoSeleccionado.tipo!="servicio"){
        if(ProductoSeleccionado.cantidad<cantidad){
            alert("Cantidad sobrepasada del inventario.");
            return;
        }
    }
    

    let productoEnLista = productosFacturar.find(p => p.idproducto == id);

    if (productoEnLista) {
        alert("Producto ya agregado.");
        return;
    }

    let li = document.createElement('li');
    li.innerHTML = `
        ${ProductoSeleccionado.nombre} - ${ProductoSeleccionado.descripcion} | Cantidad: ${cantidad} | Precio: ₡${(ProductoSeleccionado.precio * cantidad).toFixed(2)}
        <span class="button-container">
            <button class="edit-button btn btn-edit" onclick="editProductFacturacion(${ProductoSeleccionado.idproducto})">
                📝
            </button>
            <button class="delete-button btn btn-delete" onclick="eliminarProductoFacturacion(${ProductoSeleccionado.idproducto})">
                🗑️
            </button>
        </span>
    `;
    listaFacturacion.appendChild(li);
    listaFacturacion.appendChild(li);
    //agrega productos a lista a facturar
    productosFacturar.push({ ...ProductoSeleccionado, cantidad });
    //muestra el precio segun los productos
    let total = (totalAmount+(ProductoSeleccionado.precio*cantidad));
    console.log(total);
    totalAmountElement.textContent = total.toFixed(2);
    // Limpiar la cantidad ingresada después de agregar
    document.getElementById('cantidadFacturacion').value = "";
}

function editProductFacturacion(id) {
    let ProductoSeleccionado = productosFacturar.find(p => p.idproducto == id);

    //validaciones
    if (!ProductoSeleccionado) {
        alert("Error: Producto no encontrado en la factura.");
        return;
    }

    let nuevaCantidad = parseInt(prompt(`Introduzca la nueva cantidad para ${ProductoSeleccionado.nombre}:`, ProductoSeleccionado.cantidad));

    if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) {
        alert("Cantidad inválida. Intente de nuevo.");
        return;
    }
    let ProductoSeleccionado2 = productos.find(p => p.idproducto == id)
    if(ProductoSeleccionado2.tipo!="servicio"){
        if (nuevaCantidad > ProductoSeleccionado2.cantidad) {
            alert("La cantidad no puede exceder el inventario disponible.");
            return;
        }
    }
    
    let totalAmountElement = document.getElementById('totalAmount'); 

    // Calcular el total antes de la modificación
    let totalAmount = parseFloat(totalAmountElement.textContent) || 0;
    totalAmount -= ProductoSeleccionado.precio * ProductoSeleccionado.cantidad;
    ProductoSeleccionado.cantidad = nuevaCantidad;
    totalAmount += ProductoSeleccionado.precio * ProductoSeleccionado.cantidad;
    totalAmountElement.textContent = totalAmount.toFixed(2);
    actualizarListaFacturacion();
}

function eliminarProductoFacturacion(id) {
    let totalAmountElement = document.getElementById('totalAmount');
    let totalAmount = parseFloat(totalAmountElement.textContent) || 0;

    // Buscar el índice del producto en la lista
    let index = productosFacturar.findIndex(p => p.idproducto == id);

    if (index === -1) {
        alert("Error: Producto no encontrado en la factura.");
        return;
    }

    // Obtener el producto antes de eliminarlo para restarlo del total
    let ProductoSeleccionado = productosFacturar[index];
    totalAmount -= ProductoSeleccionado.precio * ProductoSeleccionado.cantidad;
    productosFacturar.splice(index, 1);
    totalAmountElement.textContent = totalAmount.toFixed(2);
    actualizarListaFacturacion();
}

function actualizarListaFacturacion() {
    //Carga los datos facturados para poder verlos
    let listaFacturacion = document.getElementById('listaFacturacion');
    listaFacturacion.innerHTML = "";

    productosFacturar.forEach(producto => {
        let li = document.createElement('li');
        li.innerHTML = `
        ${producto.nombre} - ${producto.descripcion} | 
        Cantidad: ${producto.cantidad} | 
        Precio: ₡${(producto.precio * producto.cantidad).toFixed(2)}
        <span class="button-container">
            <button class="edit-button btn btn-edit" onclick="editProductFacturacion(${producto.idproducto})">
                📝
            </button>
            <button class="delete-button btn btn-delete" onclick="eliminarProductoFacturacion(${producto.idproducto})">
                🗑️
            </button>
        </span>
    `;
    listaFacturacion.appendChild(li);
    });
}

async function generarFactura() {
    try {
        let totalAmountElement = document.getElementById('totalAmount');
        let montoTotal = parseFloat(totalAmountElement.textContent) || 0;

        let fechaHoy = new Date();
        let fechaLocal = new Date(fechaHoy.getTime() - (6 * 60 * 60 * 1000)); // Ajuste para Costa Rica
        let fecha = fechaLocal.toISOString().split('T')[0]; 

        console.log("📅 Fecha formateada:", fecha);

        let facturaResponse = await fetch("https://facturafast.onrender.com/generarFactura", {//genera una factura con los datos
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fecha, montoTotal }) 
        });

        let facturaData = await facturaResponse.json();
        if (!facturaData.message) {
            alert("Error al generar la factura");
            return;
        }

        let fkFactura = -1;
        let obtenerUltimaFactura = await fetch("https://facturafast.onrender.com/obtenerUltimo", {//obtiene el dato de la ultima factura para poder hacer la relacion con los productos
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        let facturaUltima = await obtenerUltimaFactura.json();
        if (facturaUltima.length > 0) {
            fkFactura = facturaUltima[0].idfactura;
        } else {
            alert("Error: No se encontró la última factura generada.");
            return;
        }

        let productosFactura = [];
        for (let producto of productosFacturar) {
            let ProductoSeleccionado = productos.find(p => p.idproducto == producto.idproducto);
            let cantidad = producto.cantidad;
            let monto = producto.precio * cantidad;
            let idTemp = producto.idproducto;
            let nuevaCantidadDisponible;
            let tipo = producto.tipo;
            if(tipo!="servicio"){
                nuevaCantidadDisponible = Math.round(ProductoSeleccionado.cantidad - cantidad);
            }else{
                nuevaCantidadDisponible = Math.round(ProductoSeleccionado.cantidad);
            }

            await fetch("https://facturafast.onrender.com/editar", {//edita el inventario segun menos los productos facturados
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    nombre: producto.nombre, 
                    descripcion: producto.descripcion, 
                    cantidad: nuevaCantidadDisponible, 
                    precio: producto.precio,
                    tipo: producto.tipo, 
                    idTemp 
                })
            });

            let idProducto = idTemp;
            let fkUsuario = localStorage.getItem("loggedInUser");

            await fetch("https://facturafast.onrender.com/generarFacturaDetallada", {//genera facturasdetalladas con relacion a facturas
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idProducto, monto , cantidad, fkFactura, fkUsuario }) 
            });

            productosFactura.push({
                nombre: producto.nombre,
                tipo: producto.tipo, 
                cantidad: producto.cantidad,
                monto: producto.precio * producto.cantidad
            });
        }

        let pdfResponse = await fetch("https://facturafast.onrender.com/generarPDF", {//genera pdf con los datos de la factura
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idFactura: fkFactura, fecha, montoTotal, productos: productosFactura })
        });

        if (pdfResponse.ok) {
            let blob = await pdfResponse.blob();
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = url;
            a.download = `factura_${fkFactura}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            alert("Error al generar el PDF");
        }

        listaFacturacion.innerHTML = "";
        let totalAmount = 0;
        totalAmountElement.textContent = totalAmount.toFixed(2);
        productosFacturar=[];
        updateProductList();

        alert("Factura generada correctamente.");
    } catch (error) {
        console.error("Error en la generación de la factura:", error);
        alert("Hubo un error al generar la factura. Por favor, intente nuevamente.");
    }
}

function cargarFacturas() {
    let filtro = document.getElementById("filtroFacturas").value;
    let endpoint = "";

    // Determinar el endpoint según la opción seleccionada
    if (filtro === "todas") {
        endpoint = "/obtenerFacturas";
    } else if (filtro === "masVendidos") {
        endpoint = "/mayorProductoVendido";
    } else if (filtro === "mensual") {
        endpoint = "/ventasMensuales";
    } else if (filtro === "semanal") {
        endpoint = "/ventasSemanales";
    }
    let usuario = localStorage.getItem("loggedInUser"); // Obtener el usuario guardado
    fetch(`https://facturafast.onrender.com${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ usuario })
    })
    .then(response => response.json())
    .then(data => {
        let invoiceRecords = document.getElementById("invoiceRecords");
        invoiceRecords.innerHTML = "";  // Limpiar la lista

        // Dependiendo del filtro, mostrar los datos
        if (filtro === "todas") {//va a mostrar todas las facturas
            if (data.length > 0) {
                data.forEach(factura => {
                    let li = document.createElement("li");
                    let fechaOriginal = new Date(factura.fecha);
                    let fechaFormateada = fechaOriginal.toISOString().split('T')[0];
                    li.textContent = `Factura #${factura.idfactura} - Total: ₡${factura.montototal} - Fecha: ${fechaFormateada}`;
                    invoiceRecords.appendChild(li);
                });
            } else {
                invoiceRecords.innerHTML = "No se encontraron facturas.";
            }
        } else if (filtro === "masVendidos") {//va a mostrar el producto mas vendido
            if (data.length > 0) {
                let producto = data[0]; 
                let li = document.createElement("li");
                li.textContent = `Producto: ${producto.nombre} - Vendidos: ${producto.totalvendido}`;
                invoiceRecords.appendChild(li);
            } else {
                invoiceRecords.innerHTML = "No se encontraron productos más vendidos.";
            }
        } else if (filtro === "mensual" || filtro === "semanal") {//muestra los montos totales segun las fechas
            if (data.length > 0) {
                data.forEach(venta => {
                    let li = document.createElement("li");
                    if (filtro === "semanal") {
                        li.textContent = `Esta semana - Total: ₡${venta.total}`;
                    } else {
                        li.textContent = `Fecha: ${venta.fecha} - Total: ₡${venta.total}`;
                    }
                    invoiceRecords.appendChild(li);
                });
            } else {
                invoiceRecords.innerHTML = "No se encontraron ventas en el periodo seleccionado.";
            }
        }
    })
    .catch(err => {
        console.error("Error al obtener los registros de facturas:", err);
        alert("Error al cargar los datos.");
    });
}

