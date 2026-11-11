let encabezados = [];
let datos = [];

document.getElementById("btnCargar").addEventListener("click", async () => {

    const archivo = document.getElementById("archivoCSV").files[0];

    if (!archivo) {
        alert("Por favor, selecciona un archivo CSV.");
        return;
    }

    try {
        const buffer = await archivo.arrayBuffer();

        let contenido;

        try {
            contenido = new TextDecoder("utf-8", {
                fatal: true
            }).decode(buffer);
        } catch {
            contenido = new TextDecoder("windows-1252").decode(buffer);
        }

        const filas = convertirCSV(contenido);

        if (filas.length < 2) {
            alert("El archivo no contiene suficientes datos.");
            return;
        }

        encabezados = filas[0].map(campo => campo.trim());

        datos = filas.slice(1).filter(fila =>
            fila.some(campo => campo.trim() !== "")
        );

        mostrarTabla(datos);

        cargarColumnasNumericas();
    
        document.getElementById("filtro").value = "";
        document.getElementById("resultados").innerHTML = "";

        alert("Archivo cargado correctamente.");

    } catch (error) {
        console.error(error);
        alert("Ocurrió un error al leer el archivo CSV.");
    }

});

function convertirCSV(texto) {

    const filas = [];
    let fila = [];
    let campo = "";
    let entreComillas = false;

    texto = texto.replace(/^\uFEFF/, "");

    for (let i = 0; i < texto.length; i++) {

        const caracter = texto[i];

        if (caracter === '"') {

            if (entreComillas && texto[i + 1] === '"') {
                campo += '"';
                i++;
            } else {
                entreComillas = !entreComillas;
            }

        } else if (caracter === "," && !entreComillas) {

            fila.push(campo);
            campo = "";

        } else if (
            (caracter === "\n" || caracter === "\r") &&
            !entreComillas
        ) {

            if (caracter === "\r" && texto[i + 1] === "\n") {
                i++;
            }

            fila.push(campo);

            if (fila.some(valor => valor.trim() !== "")) {
                filas.push(fila);
            }

            fila = [];
            campo = "";

        } else {
            campo += caracter;
        }
    }

    fila.push(campo);

    if (fila.some(valor => valor.trim() !== "")) {
        filas.push(fila);
    }

    return filas;
}

function mostrarTabla(registros) {

    const contenedor = document.getElementById("tablaContenedor");

    contenedor.innerHTML = "";

    const tabla = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    const filaEncabezados = document.createElement("tr");

    encabezados.forEach(encabezado => {

        const th = document.createElement("th");
        th.textContent = encabezado;

        filaEncabezados.appendChild(th);

    });

    thead.appendChild(filaEncabezados);

    registros.forEach(registro => {

        const tr = document.createElement("tr");

        encabezados.forEach((_, indice) => {

            const td = document.createElement("td");

            td.textContent = registro[indice] ?? "";

            tr.appendChild(td);

        });

        tbody.appendChild(tr);

    });

    tabla.appendChild(thead);
    tabla.appendChild(tbody);

    contenedor.appendChild(tabla);
}

document.getElementById("btnFiltrar").addEventListener("click", () => {

    if (encabezados.length === 0) {
        alert("Primero debes cargar un archivo CSV.");
        return;
    }

    const busqueda = document.getElementById("filtro")
        .value.trim().toLowerCase();

    const datosFiltrados = datos.filter(fila => {

        return fila.some(campo =>
            campo.toLowerCase().includes(busqueda)
        );

    });

    mostrarTabla(datosFiltrados);

    if (datosFiltrados.length === 0) {
        alert("No se encontraron resultados.");
    }

});

function cargarColumnasNumericas() {

    const select = document.getElementById("columnaNumerica");

    select.innerHTML =
        '<option value="">Seleccionar columna</option>';

    encabezados.forEach((encabezado, indice) => {

        const esNumerica = datos.some(fila => {

            const valor = (fila[indice] ?? "").trim();

            return valor !== "" &&
                   Number.isFinite(Number(valor));

        });

        if (esNumerica) {

            const opcion = document.createElement("option");

            opcion.value = indice;
            opcion.textContent = encabezado;

            select.appendChild(opcion);
        }

    });

}

document.getElementById("btnCalcular").addEventListener("click", () => {

    const columna = document.getElementById("columnaNumerica").value;

    if (columna === "") {
        alert("Selecciona una columna numérica.");
        return;
    }

    const indice = Number(columna);

    const valores = datos
        .map(fila => (fila[indice] ?? "").trim())
        .filter(valor =>
            valor !== "" &&
            Number.isFinite(Number(valor))
        )
        .map(Number);

    if (valores.length === 0) {
        alert("No existen valores numéricos en esta columna.");
        return;
    }

    const suma = valores.reduce(
        (total, numero) => total + numero, 0
    );

    const promedio = suma / valores.length;

    const maximo = valores.reduce(
        (a, b) => Math.max(a, b)
    );

    const minimo = valores.reduce(
        (a, b) => Math.min(a, b)
    );

    const resultados = document.getElementById("resultados");

    resultados.innerHTML = "";

    const titulo = document.createElement("h3");
    titulo.textContent = "Resultados estadísticos";
    resultados.appendChild(titulo);

    const informacion = [
        ["Columna", encabezados[indice]],
        ["Datos analizados", valores.length],
        ["Promedio", promedio.toFixed(2)],
        ["Valor máximo", maximo],
        ["Valor mínimo", minimo]
    ];
    
    informacion.forEach(([nombre, valor]) => {

        const parrafo = document.createElement("p");
        parrafo.textContent = `${nombre}: ${valor}`;

        resultados.appendChild(parrafo);

    });

});

document.getElementById("btnDescargar").addEventListener("click", () => {

    const archivo = document.getElementById("archivoCSV").files[0];

    const resultados = document.getElementById("resultados");

    if (encabezados.length === 0 || !archivo) {
        alert("Primero debes cargar un archivo CSV.");
        return;
    }
    
    if (resultados.innerText.trim() === "") {
        alert("Primero debes calcular las estadísticas.");
        return;
    }

    let contenido = "REPORTE DE ANÁLISIS DE ARCHIVO CSV\n";
    contenido += "====================================\n\n";

    contenido += "Archivo analizado: " + archivo.name + "\n\n";

    contenido += "RESULTADOS ESTADÍSTICOS\n";
    contenido += "------------------------\n";

    contenido += resultados.innerText + "\n\n";

    contenido += "====================================\n";
    contenido += "Reporte generado automáticamente.\n";

    const blob = new Blob([contenido], {
        type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "resultados_estadisticos.txt";

    document.body.appendChild(enlace);

    enlace.click();

    document.body.removeChild(enlace);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    alert("Archivo TXT descargado correctamente.");
});