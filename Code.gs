function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === 'registrarAsistencia') {
    try {
      const id_escaneado = e.parameter.id_escaneado || '';
      if (!id_escaneado) throw new Error('ID escaneado vacío.');
      const mensaje = registrarAsistencia({ id_escaneado: id_escaneado });
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', message: mensaje }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Sin parámetros → sirve el HTML (por si alguien entra directo a la URL /exec)
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Registro de Asistencia')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function registrarAsistencia(datos) {
  const nombreHoja = 'Registro_Asistencia';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = ss.getSheetByName(nombreHoja);

  if (!hoja) {
    hoja = ss.insertSheet(nombreHoja);
    hoja.appendRow(['ID Registro', 'ID Escaneado', 'Fecha', 'Hora', 'Usuario']);
  }

  const ahora = new Date();
  const idRegistro = "REG-" + ahora.getTime();
  const fecha = Utilities.formatDate(ahora, "America/Mexico_City", "dd/MM/yyyy");
  const hora  = Utilities.formatDate(ahora, "America/Mexico_City", "HH:mm:ss");
  const usuario = Session.getActiveUser().getEmail() || "Anónimo";

  hoja.appendRow([idRegistro, datos.id_escaneado, fecha, hora, usuario]);
  return "Asistencia registrada correctamente.";
}
