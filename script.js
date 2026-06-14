const config = window.WEDDING_CONFIG;
const convidados = window.CONVIDADOS;

const params = new URLSearchParams(window.location.search);
const id = params.get("id") || "001";
const grupo = convidados.find(g => g.id === id) || convidados[0];

const $ = (sel) => document.querySelector(sel);
const guestTitle = $("#guestTitle");
const guestList = $("#guestList");
const totalConfirmed = $("#totalConfirmed");
const statusMsg = $("#statusMsg");
const confirmBtn = $("#confirmBtn");
const notGoingBtn = $("#notGoingBtn");

guestTitle.textContent = `Convite ${grupo.id}`;

function renderGuests() {
  guestList.innerHTML = "";
  grupo.convidados.forEach((nome, index) => {
    const label = document.createElement("label");
    label.className = "guest-item";
    label.innerHTML = `<input type="checkbox" value="${nome}" data-index="${index}"><span>${nome}</span>`;
    guestList.appendChild(label);
  });
  guestList.addEventListener("change", updateTotal);
}
function updateTotal() {
  totalConfirmed.textContent = document.querySelectorAll(".guest-item input:checked").length;
}
renderGuests();

function deadlineClosed() {
  return new Date() > new Date(config.prazoConfirmacaoISO);
}

async function saveConfirmation(status) {
  if (deadlineClosed()) {
    statusMsg.textContent = `O prazo de confirmação encerrou em ${config.prazoConfirmacaoTexto}.`;
    return;
  }

  const selected = [...document.querySelectorAll(".guest-item input:checked")].map(i => i.value);
  if (status === "confirmado" && selected.length === 0) {
    statusMsg.textContent = "Selecione pelo menos um nome para confirmar presença.";
    return;
  }

  const payload = {
    data: new Date().toISOString(),
    conviteId: grupo.id,
    convidadosAutorizados: grupo.convidados,
    confirmados: status === "nao_ira" ? [] : selected,
    status,
    mensagem: $("#message").value.trim(),
    userAgent: navigator.userAgent
  };

  localStorage.setItem(`confirmacao_${grupo.id}`, JSON.stringify(payload));

  if (config.appsScriptUrl && config.appsScriptUrl.startsWith("https://")) {
    try {
      await fetch(config.appsScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Falha ao enviar para Apps Script:", e);
    }
  }

  statusMsg.textContent = status === "nao_ira"
    ? "Resposta registrada. Sentiremos sua falta, mas agradecemos o carinho."
    : "Presença confirmada com sucesso. Estamos ansiosos para celebrar com vocês!";
}

confirmBtn.addEventListener("click", () => saveConfirmation("confirmado"));
notGoingBtn.addEventListener("click", () => saveConfirmation("nao_ira"));

$("#copyPix").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(config.pix);
    $("#copyPix").textContent = "PIX copiado!";
    setTimeout(() => $("#copyPix").textContent = "Copiar chave PIX", 2200);
  } catch {
    alert(`Chave PIX: ${config.pix}`);
  }
});

function tickCountdown() {
  const target = new Date(config.dataEventoISO).getTime();
  const now = Date.now();
  let diff = Math.max(0, target - now);
  const d = Math.floor(diff / (1000*60*60*24)); diff -= d*1000*60*60*24;
  const h = Math.floor(diff / (1000*60*60)); diff -= h*1000*60*60;
  const m = Math.floor(diff / (1000*60)); diff -= m*1000*60;
  const s = Math.floor(diff / 1000);
  $("#d").textContent = d;
  $("#h").textContent = h;
  $("#m").textContent = m;
  $("#s").textContent = s;
}
tickCountdown();
setInterval(tickCountdown, 1000);

if (deadlineClosed()) {
  statusMsg.textContent = `O prazo de confirmação encerrou em ${config.prazoConfirmacaoTexto}.`;
  confirmBtn.disabled = true;
  notGoingBtn.disabled = true;
  confirmBtn.style.opacity = ".55";
  notGoingBtn.style.opacity = ".55";
}
