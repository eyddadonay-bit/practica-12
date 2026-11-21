const API_URL = "https://6aff18853a0e70bc8d54980b.mockapi.io/V1/CATALOGO";
const FALLBACK_IMG = "https://placehold.co/600x400/1e2430/e5e7eb?text=Sin+Imagen";

// Credenciales del administrador (cámbialas si gustas)
const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

let productosCache = [];
let adminAutenticado = false;

// Referencias del DOM
const btnVistaCatalogo = document.getElementById("btnVistaCatalogo");
const btnVistaAdmin = document.getElementById("btnVistaAdmin");
const vistaCatalogo = document.getElementById("vistaCatalogo");
const vistaAdmin = document.getElementById("vistaAdmin");

const inputBuscar = document.getElementById("inputBuscar");
const estadoCatalogo = document.getElementById("estadoCatalogo");
const catalogoEl = document.getElementById("catalogo");

const loginBox = document.getElementById("loginBox");
const panelCrud = document.getElementById("panelCrud");
const formLogin = document.getElementById("formLogin");
const btnLogout = document.getElementById("btnLogout");

const formProducto = document.getElementById("formProducto");
const tituloForm = document.getElementById("tituloForm");
const editIdInput = document.getElementById("editId");
const btnGuardarProducto = document.getElementById("btnGuardarProducto");
const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
const tablaAdminBody = document.getElementById("tablaAdminBody");

const modalDetalle = document.getElementById("modalDetalle");
const detalleBody = document.getElementById("detalleBody");
const cerrarModal = document.getElementById("cerrarModal");
const toastEl = document.getElementById("toast");

// Notificación emergente (Toast)
function mostrarToast(mensaje) {
  toastEl.textContent = mensaje;
  toastEl.classList.remove("oculto");
  clearTimeout(mostrarToast.timer);
  mostrarToast.timer = setTimeout(() => toastEl.classList.add("oculto"), 4200);
}

// Obtener la imagen guardada en MockAPI o respaldo
function obtenerImagenTenis(item) {
  if (item.IMAGEN && item.IMAGEN.trim().startsWith("http")) {
    return item.IMAGEN.trim();
  }
  return FALLBACK_IMG;
}

// Navegación entre Catálogo y Panel de Administración
function cambiarVista(vista) {
  if (vista === "catalogo") {
    vistaCatalogo.classList.remove("oculto");
    vistaAdmin.classList.add("oculto");
    btnVistaCatalogo.classList.add("activo");
    btnVistaAdmin.classList.remove("activo");
    obtenerCatalogo();
  } else {
    vistaCatalogo.classList.add("oculto");
    vistaAdmin.classList.remove("oculto");
    btnVistaCatalogo.classList.remove("activo");
    btnVistaAdmin.classList.add("activo");
    actualizarEstadoAdmin();
  }
}

btnVistaCatalogo.addEventListener("click", () => cambiarVista("catalogo"));
btnVistaAdmin.addEventListener("click", () => cambiarVista("admin"));

function actualizarEstadoAdmin() {
  if (adminAutenticado) {
    loginBox.classList.add("oculto");
    panelCrud.classList.remove("oculto");
    renderizarTablaAdmin(productosCache);
  } else {
    loginBox.classList.remove("oculto");
    panelCrud.classList.add("oculto");
  }
}

// Login de Administración
formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("loginUsuario").value.trim();
  const pass = document.getElementById("loginClave").value.trim();

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    adminAutenticado = true;
    formLogin.reset();
    actualizarEstadoAdmin();
    obtenerCatalogo();
    mostrarToast("Sesión de administrador iniciada");
  } else {
    mostrarToast("Usuario o contraseña incorrectos");
  }
});

btnLogout.addEventListener("click", () => {
  adminAutenticado = false;
  resetearFormularioProducto();
  actualizarEstadoAdmin();
  mostrarToast("Sesión cerrada");
});

// 1. GET: Traer todos los productos de MockAPI
async function obtenerCatalogo() {
  try {
    estadoCatalogo.textContent = "Cargando productos...";
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    productosCache = await res.json();
    aplicarFiltroBusqueda();
    if (adminAutenticado) renderizarTablaAdmin(productosCache);
  } catch (error) {
    console.error("Error en GET:", error);
    estadoCatalogo.textContent = "Error al conectar con MockAPI.";
  }
}

// Buscador con lupa
function aplicarFiltroBusqueda() {
  const q = inputBuscar.value.trim().toLowerCase();
  const filtrados = productosCache.filter((p) => {
    const texto = `${p.NOMBRE} ${p.MARCA} ${p.COLOR} ${p.CATEGORIA} ${p.TALLA}`.toLowerCase();
    return texto.includes(q);
  });

  estadoCatalogo.textContent = `Mostrando ${filtrados.length} de ${productosCache.length} tenis`;
  renderizarCatalogo(filtrados);
}

inputBuscar.addEventListener("input", aplicarFiltroBusqueda);

// Renderizar tarjetas del catálogo con total dinámico y compra
function renderizarCatalogo(lista) {
  catalogoEl.innerHTML = "";

  if (!lista.length) {
    catalogoEl.innerHTML = `<p style="color:#9ca3af;">No se encontraron tenis con ese filtro.</p>`;
    return;
  }

  lista.forEach((item) => {
    const stockNum = Number(item.STOCK) || 0;
    const precioNum = Number(item.PRECIO) || 0;
    const agotado = stockNum <= 0;
    const imgSrc = obtenerImagenTenis(item);

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${imgSrc}" alt="${item.NOMBRE}" onerror="this.src='${FALLBACK_IMG}'" />
      <div class="card-body">
        <span class="marca-cat">${item.MARCA} • ${item.CATEGORIA}</span>
        <h2>${item.NOMBRE}</h2>
        <p class="meta">Talla: <strong>${item.TALLA}</strong> | Color: ${item.COLOR}</p>
        <div class="precio-stock">
          <span class="precio">Bs ${precioNum}</span>
          <span class="stock ${agotado ? "agotado" : ""}">
            ${agotado ? "Agotado" : `Stock: ${stockNum}`}
          </span>
        </div>

        <p class="meta subtotal-texto" style="margin-top:0.45rem; color:#93c5fd;">
          ${agotado ? "Sin unidades disponibles" : `Total a pagar: <strong>Bs ${precioNum}</strong>`}
        </p>

        <div class="compra-box">
          <input
            type="number"
            class="input-cant"
            min="1"
            max="${Math.max(stockNum, 1)}"
            value="1"
            ${agotado ? "disabled" : ""}
          />
          <button class="btn btn-comprar" ${agotado ? "disabled" : ""}>
            ${agotado ? "Sin stock" : "Comprar"}
          </button>
        </div>

        <button class="btn btn-detalle" data-id="${item.id}">Ver detalle (GET ID)</button>
      </div>
    `;

    const btnComprar = card.querySelector(".btn-comprar");
    const inputCant = card.querySelector(".input-cant");
    const subtotalTexto = card.querySelector(".subtotal-texto");

    if (!agotado) {
      // Actualiza el total en vivo al cambiar la cantidad
      inputCant.addEventListener("input", () => {
        const cant = Math.max(1, parseInt(inputCant.value, 10) || 1);
        const totalCalc = precioNum * cant;
        subtotalTexto.innerHTML = `Total a pagar: <strong>Bs ${totalCalc}</strong>`;
      });

      btnComprar.addEventListener("click", () => {
        const cant = parseInt(inputCant.value, 10);
        comprarProducto(item, cant);
      });
    }

    // 2. Evento para consultar por ID (GET /:id)
    card.querySelector(".btn-detalle").addEventListener("click", () => {
      obtenerProductoPorId(item.id);
    });

    catalogoEl.appendChild(card);
  });
}

// Comprar: valida stock, calcula total, resta STOCK y actualiza en MockAPI (PUT)
async function comprarProducto(producto, cantidad) {
  const stockActual = Number(producto.STOCK) || 0;
  const precioUnitario = Number(producto.PRECIO) || 0;

  if (!cantidad || cantidad < 1) {
    mostrarToast("Ingresa una cantidad válida (mínimo 1)");
    return;
  }
  if (cantidad > stockActual) {
    mostrarToast(`Solo hay ${stockActual} unidades disponibles`);
    return;
  }

  const nuevoStock = stockActual - cantidad;
  const totalCompra = precioUnitario * cantidad;
  const payload = {
    ...producto,
    STOCK: nuevoStock
  };

  try {
    const res = await fetch(`${API_URL}/${producto.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    mostrarToast(
      `Compraste ${cantidad}x ${producto.NOMBRE} | Total: Bs ${totalCompra} | Stock restante: ${nuevoStock}`
    );
    await obtenerCatalogo();
  } catch (error) {
    console.error("Error al restar stock:", error);
    mostrarToast("No se pudo actualizar el stock");
  }
}

// 2. GET /:id: Obtener detalle de un producto específico por su ID
async function obtenerProductoPorId(id) {
  try {
    modalDetalle.classList.remove("oculto");
    detalleBody.innerHTML = "<p>Consultando producto por ID...</p>";

    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    const prod = await res.json();
    const imgSrc = obtenerImagenTenis(prod);

    detalleBody.innerHTML = `
      <img class="detalle-img" src="${imgSrc}" alt="${prod.NOMBRE}" onerror="this.src='${FALLBACK_IMG}'" />
      <span class="marca-cat">${prod.MARCA} • ${prod.CATEGORIA} (ID: ${prod.id})</span>
      <h2>${prod.NOMBRE}</h2>
      <p class="meta" style="margin-top:0.4rem;">${prod.DESCRIPCION || "Sin descripción"}</p>
      <div class="detalle-datos">
        <div><strong>Precio:</strong> Bs ${prod.PRECIO}</div>
        <div><strong>Stock:</strong> ${prod.STOCK}</div>
        <div><strong>Talla:</strong> ${prod.TALLA}</div>
        <div><strong>Color:</strong> ${prod.COLOR}</div>
      </div>
    `;
  } catch (error) {
    console.error("Error en GET /:id:", error);
    detalleBody.innerHTML = "<p>Error al obtener el detalle.</p>";
  }
}

cerrarModal.addEventListener("click", () => modalDetalle.classList.add("oculto"));
modalDetalle.addEventListener("click", (e) => {
  if (e.target === modalDetalle) modalDetalle.classList.add("oculto");
});

// ADMIN CRUD: Renderizar tabla de gestión
function renderizarTablaAdmin(lista) {
  tablaAdminBody.innerHTML = "";

  lista.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.NOMBRE}</td>
      <td>${p.MARCA}</td>
      <td>${p.TALLA}</td>
      <td>Bs ${p.PRECIO}</td>
      <td>${p.STOCK}</td>
      <td class="acciones-td">
        <button class="btn btn-editar" data-id="${p.id}">Editar</button>
        <button class="btn btn-peligro" data-id="${p.id}">Eliminar</button>
      </td>
    `;

    tr.querySelector(".btn-editar").addEventListener("click", () => cargarEdicion(p));
    tr.querySelector(".btn-peligro").addEventListener("click", () => eliminarProducto(p.id, p.NOMBRE));

    tablaAdminBody.appendChild(tr);
  });
}

function cargarEdicion(p) {
  editIdInput.value = p.id;
  document.getElementById("NOMBRE").value = p.NOMBRE || "";
  document.getElementById("MARCA").value = p.MARCA || "";
  document.getElementById("TALLA").value = p.TALLA || "";
  document.getElementById("COLOR").value = p.COLOR || "";
  document.getElementById("CATEGORIA").value = p.CATEGORIA || "";
  document.getElementById("PRECIO").value = p.PRECIO || "";
  document.getElementById("STOCK").value = p.STOCK ?? 0;
  document.getElementById("IMAGEN").value = p.IMAGEN || "";
  document.getElementById("DESCRIPCION").value = p.DESCRIPCION || "";

  tituloForm.textContent = `Editando tenis #${p.id}`;
  btnGuardarProducto.textContent = "Actualizar Tenis";
  btnCancelarEdicion.classList.remove("oculto");
}

function resetearFormularioProducto() {
  formProducto.reset();
  editIdInput.value = "";
  tituloForm.textContent = "Agregar nuevo tenis";
  btnGuardarProducto.textContent = "Guardar Tenis";
  btnCancelarEdicion.classList.add("oculto");
}

btnCancelarEdicion.addEventListener("click", resetearFormularioProducto);

// 3. POST (Crear) y PUT (Editar) desde el Panel Admin
formProducto.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idEdit = editIdInput.value;
  const datos = {
    NOMBRE: document.getElementById("NOMBRE").value.trim(),
    MARCA: document.getElementById("MARCA").value.trim(),
    TALLA: Number(document.getElementById("TALLA").value),
    COLOR: document.getElementById("COLOR").value.trim(),
    CATEGORIA: document.getElementById("CATEGORIA").value.trim(),
    PRECIO: Number(document.getElementById("PRECIO").value),
    STOCK: Number(document.getElementById("STOCK").value),
    IMAGEN: document.getElementById("IMAGEN").value.trim() || FALLBACK_IMG,
    DESCRIPCION: document.getElementById("DESCRIPCION").value.trim()
  };

  try {
    const url = idEdit ? `${API_URL}/${idEdit}` : API_URL;
    const metodo = idEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    mostrarToast(idEdit ? "Tenis actualizado correctamente" : "Tenis agregado al catálogo");
    resetearFormularioProducto();
    await obtenerCatalogo();
  } catch (error) {
    console.error("Error guardando producto:", error);
    mostrarToast("Error al guardar en MockAPI");
  }
});

// 4. DELETE: Eliminar producto
async function eliminarProducto(id, nombre) {
  const confirmar = confirm(`¿Eliminar "${nombre}" (ID ${id})?`);
  if (!confirmar) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    mostrarToast(`"${nombre}" eliminado`);
    await obtenerCatalogo();
  } catch (error) {
    console.error("Error en DELETE:", error);
    mostrarToast("No se pudo eliminar el producto");
  }
}

// Iniciar aplicación cargando el catálogo
obtenerCatalogo();