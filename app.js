const STORAGE_KEY = "persona-talk-state-v1";

const defaults = {
  activeCharacterId: "luna",
  activePersonaId: "eu-real",
  activeTopic: "namoro",
  characters: [
    {
      id: "luna",
      name: "Luna",
      bio: "Conselheira afetuosa para conversas sobre namoro, duvidas, sinais e insegurancas.",
      style: "Fala com carinho, faz perguntas boas e ajuda a separar medo de fatos."
    },
    {
      id: "caio",
      name: "Caio",
      bio: "Amigo direto, leal e pratico para amizade, limites e conversas dificeis.",
      style: "Fala de forma simples, honesta e protetora, sem julgar."
    },
    {
      id: "mira",
      name: "Mira",
      bio: "Persona reflexiva para autoestima, autocuidado e padroes emocionais.",
      style: "Fala com calma, acolhe o sentimento e sugere pequenos proximos passos."
    }
  ],
  personas: [
    {
      id: "eu-real",
      name: "Eu real",
      bio: "Minha persona principal para falar sobre vida, namoro e amizades.",
      style: "Gosto de respostas humanas, diretas e acolhedoras."
    }
  ],
  memory: [
    "Gosto de conversas sinceras e sem joguinhos.",
    "Quero conselhos sobre namoro e amizade com cuidado emocional."
  ],
  chats: {}
};

let state = loadState();

const characterList = document.querySelector("#characterList");
const personaSelect = document.querySelector("#personaSelect");
const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const topicSelect = document.querySelector("#topicSelect");
const activeCharacterName = document.querySelector("#activeCharacterName");
const activeCharacterBio = document.querySelector("#activeCharacterBio");
const topicLabel = document.querySelector("#topicLabel");
const memoryPreview = document.querySelector("#memoryPreview");
const memoryList = document.querySelector("#memoryList");
const editorDialog = document.querySelector("#editorDialog");
const editorForm = document.querySelector("#editorForm");
const memoryDialog = document.querySelector("#memoryDialog");

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaults);

  try {
    return { ...structuredClone(defaults), ...JSON.parse(saved) };
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function activeCharacter() {
  return state.characters.find((item) => item.id === state.activeCharacterId) || state.characters[0];
}

function activePersona() {
  return state.personas.find((item) => item.id === state.activePersonaId) || state.personas[0];
}

function chatKey() {
  return `${state.activePersonaId}:${state.activeCharacterId}`;
}

function currentChat() {
  const key = chatKey();
  state.chats[key] ||= [];
  return state.chats[key];
}

function render() {
  renderCharacters();
  renderPersonas();
  renderChat();
  renderMemory();

  const character = activeCharacter();
  activeCharacterName.textContent = character.name;
  activeCharacterBio.textContent = character.bio;
  topicSelect.value = state.activeTopic;
  topicLabel.textContent = topicSelect.options[topicSelect.selectedIndex].text;
}

function renderCharacters() {
  characterList.innerHTML = "";
  state.characters.forEach((character) => {
    const button = document.createElement("button");
    button.className = `character-card${character.id === state.activeCharacterId ? " active" : ""}`;
    button.innerHTML = `<strong>${escapeHtml(character.name)}</strong><span>${escapeHtml(character.bio)}</span>`;
    button.addEventListener("click", () => {
      state.activeCharacterId = character.id;
      saveState();
      render();
    });
    button.addEventListener("dblclick", () => openEditor("character", character));
    characterList.appendChild(button);
  });
}

function renderPersonas() {
  personaSelect.innerHTML = "";
  state.personas.forEach((persona) => {
    const option = document.createElement("option");
    option.value = persona.id;
    option.textContent = persona.name;
    personaSelect.appendChild(option);
  });
  personaSelect.value = state.activePersonaId;
}

function renderChat() {
  const messages = currentChat();
  chatLog.innerHTML = "";

  if (!messages.length) {
    addMessageNode({
      role: "ai",
      name: activeCharacter().name,
      text: firstMessage()
    });
    return;
  }

  messages.forEach(addMessageNode);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addMessageNode(message) {
  const wrapper = document.createElement("article");
  wrapper.className = `message ${message.role === "user" ? "user" : "ai"}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = `<small>${escapeHtml(message.name)}</small>${linkify(escapeHtml(message.text))}`;

  wrapper.appendChild(bubble);
  chatLog.appendChild(wrapper);
}

function renderMemory() {
  memoryPreview.innerHTML = "";
  memoryList.innerHTML = "";

  const visible = state.memory.slice(-5);
  const previewItems = visible.length ? visible : ["Nenhuma memoria salva ainda."];
  previewItems.forEach((text) => {
    const item = document.createElement("div");
    item.className = "memory-item";
    item.textContent = text;
    memoryPreview.appendChild(item);
  });

  state.memory.forEach((text, index) => {
    const item = document.createElement("div");
    item.className = "memory-item";
    const span = document.createElement("span");
    span.textContent = text;
    const remove = document.createElement("button");
    remove.className = "icon-button";
    remove.type = "button";
    remove.textContent = "x";
    remove.title = "Remover memoria";
    remove.addEventListener("click", () => {
      state.memory.splice(index, 1);
      saveState();
      renderMemory();
    });
    item.append(span, remove);
    memoryList.appendChild(item);
  });
}

function firstMessage() {
  const character = activeCharacter();
  const persona = activePersona();
  return `Oi, ${persona.name}. Eu sou ${character.name}. ${character.bio} Me conta o que aconteceu e eu vou lembrar dos pontos importantes para te acompanhar melhor.`;
}

function makeReply(text) {
  const character = activeCharacter();
  const persona = activePersona();
  const memory = state.memory.slice(-4).join(" ");
  const tone = character.style.toLowerCase();
  const topic = state.activeTopic;
  const lower = text.toLowerCase();

  const openers = {
    namoro: "Sobre namoro, eu olharia para atitude constante mais do que para promessa bonita.",
    amizade: "Em amizade, o ponto central costuma ser reciprocidade: quem cuida tambem precisa ser cuidado.",
    conflitos: "Em conflito, a meta nao e vencer a conversa; e sair dela com mais clareza e respeito.",
    autoestima: "Antes de decidir pelo medo, vale separar o que voce sente do que de fato aconteceu.",
    livre: "Pelo que voce contou, tem uma camada emocional importante ai."
  };

  const cues = [];
  if (lower.includes("mensagem") || lower.includes("responder")) {
    cues.push("Se for responder, mande algo curto, especifico e sem se explicar demais.");
  }
  if (lower.includes("ciume") || lower.includes("insegur")) {
    cues.push("Ciume e inseguranca pedem cuidado: trate como sinal para conversar, nao como prova contra voce.");
  }
  if (lower.includes("termin") || lower.includes("afastar")) {
    cues.push("Se existe afastamento, observe padrao, frequencia e disposicao da pessoa para reparar.");
  }
  if (lower.includes("amig")) {
    cues.push("Uma amizade boa pode ter fases, mas nao deveria fazer voce se sentir sempre em divida.");
  }
  if (!cues.length) {
    cues.push("Eu comecaria perguntando: qual fato concreto voce tem, e qual parte e imaginacao tentando te proteger?");
  }

  const memoryLine = memory ? `Eu estou levando em conta que ${memory}` : "Ainda tenho pouca memoria sobre voce, entao vou cuidar para nao presumir demais.";
  const toneLine = tone.includes("diret") ? "Minha leitura direta:" : "Minha leitura com calma:";

  return `${toneLine} ${openers[topic]} ${cues.join(" ")} ${memoryLine} Um bom proximo passo para ${persona.name} seria escrever o que voce quer preservar nessa relacao e qual limite precisa ficar claro agora.`;
}

function learnFrom(text) {
  const patterns = [
    /meu nome e ([^,.!?]+)/i,
    /me chamo ([^,.!?]+)/i,
    /eu gosto de ([^,.!?]+)/i,
    /eu nao gosto de ([^,.!?]+)/i,
    /para mim ([^,.!?]+)/i
  ];

  patterns.forEach((pattern) => {
    const match = text.match(pattern);
    if (!match) return;
    const fact = match[0].trim();
    if (fact.length > 8 && !state.memory.some((item) => item.toLowerCase() === fact.toLowerCase())) {
      state.memory.push(fact);
    }
  });

  if (state.memory.length > 80) {
    state.memory = state.memory.slice(-80);
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  const messages = currentChat();
  messages.push({ role: "user", name: activePersona().name, text, at: new Date().toISOString() });
  learnFrom(text);
  messages.push({ role: "ai", name: activeCharacter().name, text: makeReply(text), at: new Date().toISOString() });
  messageInput.value = "";
  saveState();
  render();
});

topicSelect.addEventListener("change", () => {
  state.activeTopic = topicSelect.value;
  saveState();
  render();
});

personaSelect.addEventListener("change", () => {
  state.activePersonaId = personaSelect.value;
  saveState();
  render();
});

document.querySelector("#newCharacterBtn").addEventListener("click", () => {
  openEditor("character", {
    id: "",
    name: "Novo personagem",
    bio: "Descreva em que tipo de conversa esse personagem ajuda.",
    style: "Explique o tom de voz e o jeito de aconselhar."
  });
});

document.querySelector("#newPersonaBtn").addEventListener("click", () => {
  openEditor("persona", {
    id: "",
    name: "Nova persona",
    bio: "Descreva essa versao de voce.",
    style: "Explique como voce quer ser tratado nessa persona."
  });
});

document.querySelector("#editPersonaBtn").addEventListener("click", () => openEditor("persona", activePersona()));

document.querySelector("#memoryBtn").addEventListener("click", () => {
  renderMemory();
  memoryDialog.showModal();
});

document.querySelector("#addMemoryBtn").addEventListener("click", () => {
  const input = document.querySelector("#memoryInput");
  const value = input.value.trim();
  if (!value) return;
  state.memory.push(value);
  input.value = "";
  saveState();
  render();
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "personatalk-backup.json";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#importInput").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  const data = JSON.parse(await file.text());
  state = { ...structuredClone(defaults), ...data };
  saveState();
  render();
  event.target.value = "";
});

document.querySelectorAll(".quick").forEach((button) => {
  button.addEventListener("click", () => {
    messageInput.value = button.dataset.prompt;
    messageInput.focus();
  });
});

editorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const kind = document.querySelector("#editorKind").value;
  const id = document.querySelector("#editorId").value || uid(kind);
  const record = {
    id,
    name: document.querySelector("#editorName").value.trim(),
    bio: document.querySelector("#editorBio").value.trim(),
    style: document.querySelector("#editorStyle").value.trim()
  };

  const collection = kind === "character" ? state.characters : state.personas;
  const existing = collection.findIndex((item) => item.id === id);
  if (existing >= 0) collection[existing] = record;
  else collection.push(record);

  if (kind === "character") state.activeCharacterId = id;
  if (kind === "persona") state.activePersonaId = id;
  saveState();
  editorDialog.close();
  render();
});

document.querySelector("#deleteBtn").addEventListener("click", () => {
  const kind = document.querySelector("#editorKind").value;
  const id = document.querySelector("#editorId").value;
  if (!id) return editorDialog.close();

  if (kind === "character" && state.characters.length > 1) {
    state.characters = state.characters.filter((item) => item.id !== id);
    state.activeCharacterId = state.characters[0].id;
  }

  if (kind === "persona" && state.personas.length > 1) {
    state.personas = state.personas.filter((item) => item.id !== id);
    state.activePersonaId = state.personas[0].id;
  }

  saveState();
  editorDialog.close();
  render();
});

function openEditor(kind, record) {
  document.querySelector("#editorTitle").textContent = kind === "character" ? "Editar personagem" : "Editar persona";
  document.querySelector("#editorKind").value = kind;
  document.querySelector("#editorId").value = record.id;
  document.querySelector("#editorName").value = record.name;
  document.querySelector("#editorBio").value = record.bio;
  document.querySelector("#editorStyle").value = record.style;
  document.querySelector("#deleteBtn").style.visibility = record.id ? "visible" : "hidden";
  editorDialog.showModal();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linkify(value) {
  return value.replace(/\n/g, "<br>");
}

render();
