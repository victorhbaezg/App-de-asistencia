function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === 'registrarAsistencia') {
    try {
      const id_escaneado = validarIdEscaneado(e.parameter.id_escaneado);
      const mensaje = registrarAsistencia({ id_escaneado: id_escaneado });
      return makeJSON({ status: 'ok', message: mensaje });
    } catch (err) {
      return makeJSON({ status: 'error', message: err.message });
    }
  }

  // Sin parametros: sirve el HTML si existe un archivo llamado Index.
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Registro de Asistencia')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const id_escaneado = validarIdEscaneado(body.id_escaneado);
    const mensaje = registrarAsistencia({ id_escaneado: id_escaneado });
    return makeJSON({ status: 'ok', message: mensaje });
  } catch (err) {
    return makeJSON({ status: 'error', message: err.message });
  }
}

function makeJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function validarIdEscaneado(valor) {
  const id = String(valor || '').trim().replace(/\s+/g, '').toUpperCase();

  if (!id) throw new Error('ID escaneado vacio.');
  if (id === '{ID}' || /[{}]/.test(id)) throw new Error('El QR contiene una plantilla, no un ID real.');
  if (id.length < 2) throw new Error('ID escaneado demasiado corto.');
  if (id.length > 80) throw new Error('ID escaneado demasiado largo.');

  return id;
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
  const idRegistro = 'REG-' + ahora.getTime();
  const fecha = Utilities.formatDate(ahora, 'America/Mexico_City', 'dd/MM/yyyy');
  const hora = Utilities.formatDate(ahora, 'America/Mexico_City', 'HH:mm:ss');
  const usuario = Session.getActiveUser().getEmail() || 'Anonimo';

  // Evita conflictos si varios celulares registran asistencia al mismo tiempo.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    hoja.appendRow([idRegistro, datos.id_escaneado, fecha, hora, usuario]);
  } finally {
    lock.releaseLock();
  }

  return 'Asistencia registrada correctamente.';
}
