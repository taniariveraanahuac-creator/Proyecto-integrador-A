/* =====================================================================
   CONFIGURACIÓN · el único archivo que hay que editar
   ---------------------------------------------------------------------
   apiUrl: pega aquí la URL de tu aplicación web de Apps Script
           (termina en /exec). Mientras esté vacía, la página funciona
           en modo de demostración y guarda solo en cada navegador.
   ===================================================================== */
window.PI_CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycby4U1tycQePreTdXWnIYPKg-zQWt7zoELZkK9J_2HGOFzRRJHBbfJqICrRr94PmkCEx/exec",

  // Cada cuántos segundos se actualiza lo que captura el resto del equipo.
  segundosSincronizacion: 5,

  // Integrantes por equipo y fotos (opcional). La lista de alumnos vive en la hoja «Alumnos».
  //   maximo / minimo: tamaño del equipo que muestra el contador «x de N seleccionados».
  //   fotos: "Nombre completo": "https://liga-a-la-foto.jpg". Sin foto se muestran iniciales.
  equipo: {
    maximo: 6,
    minimo: 3,
    fotos: {
      // "Sofía Ximena Álvarez García": "https://…/sofia.jpg"
    }
  }
};
