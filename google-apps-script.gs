function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);

  let presencas = ss.getSheetByName("Presenças");
  if (!presencas) {
    presencas = ss.insertSheet("Presenças");
    presencas.appendRow(["Data", "Convite", "Nome", "Presença", "Mensagem"]);
  }

  const confirmados = data.confirmados || [];
  const autorizados = data.convidadosAutorizados || [];
  const mensagem = data.mensagem || "";

  autorizados.forEach(function(nome) {
    const presente = confirmados.indexOf(nome) >= 0 ? "Sim" : "Não";
    presencas.appendRow([new Date(), data.conviteId, nome, presente, mensagem]);
  });

  let resumo = ss.getSheetByName("Resumo");
  if (!resumo) {
    resumo = ss.insertSheet("Resumo");
    resumo.appendRow(["Data", "Convite", "Status", "Total Confirmado", "Confirmados", "Mensagem"]);
  }
  resumo.appendRow([new Date(), data.conviteId, data.status, confirmados.length, confirmados.join(", "), mensagem]);

  return ContentService
    .createTextOutput(JSON.stringify({ok: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
