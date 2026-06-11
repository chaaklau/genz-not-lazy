const DATA = window.COURSE_DATA;
const app = document.getElementById("app");
const homeTemplate = document.getElementById("homeTemplate");
const unitTemplate = document.getElementById("unitTemplate");
const STORE_KEY = "cantoneseCodaTrainerProgress.v1";
const JYUTPING_AUDIO_BASE = "audio/jyutping/";

let state = loadState();
let currentUnitId = null;
let currentSampleAudio = null;
let samplePlaybackToken = 0;
let sharedMicStream = null;
let activeStopRecording = null;
const TAKE_HOME_MESSAGES = {
  1: "舌尖前收係 -n，舌根後收係 -ng。",
  2: "讀 -ng 唔好頂牙，尾音要開口。",
  3: "on/ong 要分清：前後位置最重要。",
  4: "-t 係前閂，-k 係後閂。",
  5: "oe 韻只配 -ng，唔配 -n。",
  6: "e 韻只配 -ng，唔配 -n。",
  7: "ok/ot：後閂同前閂要清晰。",
  8: "ak/at：尾音位置決定準確度。",
  9: "字形可提示，但要靠口腔位置確認。",
  10: "字形加口感，-t/-k 一次過分清。"
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function unitState(unitId) {
  if (!state[unitId]) state[unitId] = { modules: {}, dailyDrill: false };
  if (!state[unitId].modules) state[unitId].modules = {};
  return state[unitId];
}

function setModuleComplete(unitId, moduleIndex, complete = true) {
  const us = unitState(unitId);
  us.modules[moduleIndex] = complete;
  saveState();
  refreshUnitProgress(unitId);
}

function setDailyDrillComplete(unitId, complete) {
  unitState(unitId).dailyDrill = complete;
  saveState();
  refreshUnitProgress(unitId);
}

function isModuleComplete(unitId, moduleIndex) {
  return Boolean(unitState(unitId).modules[moduleIndex]);
}

function isUnitComplete(unit) {
  const us = unitState(unit.id);
  return unit.modules.every((_, idx) => us.modules[idx]) && us.dailyDrill;
}

function completedUnitCount() {
  return DATA.units.filter(isUnitComplete).length;
}

function splitWords(input) {
  if (Array.isArray(input)) return input;
  return Array.from(input.replace(/!/g, "").replace(/\s+/g, ""));
}

function parseQuiz(input) {
  const items = [];
  let correctIndex = -1;
  let markNext = false;
  for (const ch of Array.from(input.replace(/\s+/g, ""))) {
    if (ch === "!") {
      markNext = true;
      continue;
    }
    if (markNext) {
      correctIndex = items.length;
      markNext = false;
    }
    items.push(ch);
  }
  return { items, correctIndex };
}

function jyutping(word) {
  if (DATA.lexicon[word]) return DATA.lexicon[word];
  if (Array.from(word).every(ch => DATA.lexicon[ch])) {
    return Array.from(word).map(ch => DATA.lexicon[ch]).join(" ");
  }
  return "?";
}

function codaOf(word) {
  const jp = jyutping(word);
  const finalSyllable = jp.trim().split(/\s+/).at(-1) || "";
  const noTone = finalSyllable.replace(/[1-6]/g, "").toLowerCase();
  if (noTone.endsWith("ng")) return "-ng";
  if (noTone.endsWith("n")) return "-n";
  if (noTone.endsWith("k")) return "-k";
  if (noTone.endsWith("t")) return "-t";
  return "?";
}

function targetsForUnit(unit) {
  return unit.title.includes("t/k") ? ["-t", "-k"] : ["-n", "-ng"];
}

const RHYME_SUGGESTIONS = {
  ang: ["hang", "zang", "dang", "sang", "gang"],
  an: ["fan", "jan", "san", "man", "gan"],
  aang: ["paang", "maang", "caang", "laang", "haang"],
  aan: ["faan", "taan", "waan", "maan", "baan"],
  ong: ["fong", "cong", "wong", "gong", "hong"],
  on: ["gon", "hon", "on", "ngon"],
  aak: ["zaak", "paak", "gaak", "baak", "caak"],
  aat: ["saat", "caat", "waat", "faat", "zaat"],
  oeng: ["zoeng", "joeng", "soeng", "coeng", "loeng"],
  eng: ["beng", "zeng", "geng", "teng", "deng"],
  ok: ["bok", "mok", "gok", "zok", "hok"],
  ot: ["got", "hot"],
  ak: ["mak", "hak", "dak", "zak", "lak"],
  at: ["fat", "jat", "mat", "sat", "zat"]
};

function rhymeBody(rhyme) {
  return String(rhyme || "").replace(/^-/, "");
}

function suggestedSyllablesForRhyme(rhyme) {
  return RHYME_SUGGESTIONS[rhymeBody(rhyme)] || [];
}

function sampleUrlsFromJyutping(jp) {
  if (!jp || jp === "?") return [];
  return jp.trim().split(/\s+/).filter(Boolean).map(syllable => `${JYUTPING_AUDIO_BASE}${encodeURIComponent(syllable.toLowerCase())}.mp3`);
}

function sampleUrlsForText(text) {
  const exact = jyutping(text);
  if (exact !== "?") return sampleUrlsFromJyutping(exact);

  const compactChars = Array.from(String(text).replace(/[!！?？。，,、\s]/g, ""));
  if (compactChars.length > 1 && compactChars.every(ch => DATA.lexicon[ch])) {
    return compactChars.flatMap(ch => sampleUrlsFromJyutping(DATA.lexicon[ch]));
  }

  return [];
}

function stopCurrentSample() {
  samplePlaybackToken += 1;
  if (currentSampleAudio) {
    currentSampleAudio.pause();
    currentSampleAudio.currentTime = 0;
    currentSampleAudio = null;
  }
}

function playOneSample(url, token) {
  return new Promise((resolve, reject) => {
    if (token !== samplePlaybackToken) {
      resolve();
      return;
    }

    const audio = new Audio(url);
    currentSampleAudio = audio;
    audio.preload = "auto";
    audio.addEventListener("ended", resolve, { once: true });
    audio.addEventListener("error", reject, { once: true });
    audio.play().catch(reject);
  });
}

async function playSampleSequence(urls, token) {
  for (const url of urls) {
    if (token !== samplePlaybackToken) return;
    await playOneSample(url, token);
  }
}

function speakWithSynth(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-HK";
  utterance.rate = 0.75;
  const voices = window.speechSynthesis.getVoices();
  const hkVoice = voices.find(v => /zh[-_]HK/i.test(v.lang)) || voices.find(v => /Cantonese|Hong Kong|Sinji/i.test(v.name));
  if (hkVoice) utterance.voice = hkVoice;
  window.speechSynthesis.speak(utterance);
}

function speak(text) {
  stopCurrentSample();
  if (window.speechSynthesis) window.speechSynthesis.cancel();

  const urls = sampleUrlsForText(text);
  if (!urls.length) {
    speakWithSynth(text);
    return;
  }

  const token = samplePlaybackToken;
  playSampleSequence(urls, token).catch(() => {
    if (token === samplePlaybackToken) speakWithSynth(text);
  });
}

async function getSharedMicStream() {
  if (sharedMicStream && sharedMicStream.active) return sharedMicStream;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("media-devices-unavailable");
  }
  sharedMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return sharedMicStream;
}

function makeSvgIcon(type, label = "") {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add("icon-svg");

  const stroke = (d) => {
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", d);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "currentColor");
    p.setAttribute("stroke-width", "1.8");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    return p;
  };

  if (type === "listen") {
    svg.append(stroke("M4 9v6"), stroke("M8 6v12"), stroke("M12 10v4"), stroke("M16 8v8"), stroke("M20 11v2"));
  }
  if (type === "play") {
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M8 5v14l11-7Z");
    p.setAttribute("fill", "currentColor");
    svg.append(p);
  }
  if (type === "record") {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", "12");
    c.setAttribute("cy", "10");
    c.setAttribute("r", "4");
    c.setAttribute("fill", "currentColor");
    svg.append(c, stroke("M6 10a6 6 0 0 0 12 0"), stroke("M12 16v4"), stroke("M9 20h6"));
  }
  if (type === "phone") {
    svg.append(stroke("M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"), stroke("M11 18h2"));
  }
  if (type === "check") {
    svg.append(stroke("M20 6 9 17l-5-5"));
  }
  if (type === "reset") {
    svg.append(stroke("M3 12a9 9 0 1 0 3-6.7"), stroke("M3 4v6h6"));
  }
  if (type === "back") {
    svg.append(stroke("M19 12H5"), stroke("M12 19l-7-7 7-7"));
  }
  if (type === "dumbbell") {
    svg.append(
      stroke("M6 7v10"),
      stroke("M10 8v8"),
      stroke("M14 8v8"),
      stroke("M18 7v10"),
      stroke("M6 12h12"),
      stroke("M3 10v4"),
      stroke("M21 10v4")
    );
  }
  if (type === "timer") {
    svg.append(stroke("M10 2h4"), stroke("M12 14l3-3"), stroke("M7 4.5 5.5 3"), stroke("M17 4.5 18.5 3"));
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", "12");
    c.setAttribute("cy", "13");
    c.setAttribute("r", "7");
    c.setAttribute("fill", "none");
    c.setAttribute("stroke", "currentColor");
    c.setAttribute("stroke-width", "1.8");
    svg.append(c);
  }
  if (type === "mouth-small") {
    svg.append(stroke("M5 13c2.2-2 11.8-2 14 0"), stroke("M7.5 13.2c1.2 1.2 7.8 1.2 9 0"));
  }
  if (type === "mouth-big") {
    const e = document.createElementNS(ns, "ellipse");
    e.setAttribute("cx", "12");
    e.setAttribute("cy", "13");
    e.setAttribute("rx", "5.5");
    e.setAttribute("ry", "4");
    e.setAttribute("fill", "none");
    e.setAttribute("stroke", "currentColor");
    e.setAttribute("stroke-width", "1.8");
    svg.append(e);
  }

  if (label) svg.setAttribute("aria-label", label);
  return svg;
}

function iconButton(type, title, onClick, className = "small-btn icon-btn") {
  const btn = el("button", { class: className, type: "button", title, "aria-label": title, onclick: onClick });
  btn.append(makeSvgIcon(type, title));
  return btn;
}

function iconTextButton(type, text, title = text, onClick, className = "small-btn icon-text-btn") {
  const btn = el("button", { class: className, type: "button", title, "aria-label": title, onclick: onClick });
  btn.append(makeSvgIcon(type, title), el("span", { text }));
  return btn;
}

function addLeadingIcon(button, type) {
  if (!button || button.querySelector(".icon-svg")) return;
  button.prepend(makeSvgIcon(type, button.getAttribute("aria-label") || button.textContent.trim()));
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else if (value !== undefined && value !== null) node.setAttribute(key, value);
  });
  children.forEach(child => node.append(child));
  return node;
}

function unitIdFromHash() {
  const match = window.location.hash.match(/^#day-(\d+)$/);
  if (!match) return null;
  const unitId = Number(match[1]);
  return DATA.units.some(unit => unit.id === unitId) ? unitId : null;
}

function homeUrl() {
  return `${window.location.pathname}${window.location.search}`;
}

function navigateHome() {
  if (window.location.hash) window.history.replaceState({ view: "home" }, "", homeUrl());
  renderHome();
}

function navigateUnit(unitId) {
  const hash = `#day-${unitId}`;
  if (window.location.hash !== hash) window.history.pushState({ view: "unit", unitId }, "", hash);
  renderUnit(unitId);
}

function renderRoute() {
  const unitId = unitIdFromHash();
  if (unitId) {
    renderUnit(unitId);
    return;
  }
  if (window.location.hash) window.history.replaceState({ view: "home" }, "", homeUrl());
  renderHome();
}

function renderHome() {
  currentUnitId = null;
  app.innerHTML = "";
  app.append(homeTemplate.content.cloneNode(true));
  const introGymIcon = document.getElementById("introGymIcon");
  if (introGymIcon) introGymIcon.append(makeSvgIcon("dumbbell", "每日加操"));
  const unitList = document.getElementById("unitList");
  const overall = document.getElementById("overallProgress");
  overall.textContent = `已完成 ${completedUnitCount()} / ${DATA.units.length} 日`;

  DATA.units.forEach(unit => {
    const complete = isUnitComplete(unit);
    const tile = el("button", { class: `unit-tile ${complete ? "complete" : ""}`, type: "button", onclick: () => navigateUnit(unit.id) }, [
      el("p", { class: "eyebrow", text: `第 ${unit.id} 日` }),
      el("h3", {}, [makeSvgIcon(unit.id % 2 ? "timer" : "dumbbell"), el("span", { text: `Day ${unit.id}` })]),
      el("p", { class: "note", text: TAKE_HOME_MESSAGES[unit.id] || unit.focus }),
      el("span", { class: "pill", text: complete ? "✓ 已完成" : "☐ 未完成" })
    ]);
    unitList.append(tile);
  });
}

function renderUnit(unitId) {
  currentUnitId = unitId;
  const unit = DATA.units.find(u => u.id === unitId);
  app.innerHTML = "";
  app.append(unitTemplate.content.cloneNode(true));
  addLeadingIcon(document.getElementById("backHomeBtn"), "back");
  document.getElementById("backHomeBtn").addEventListener("click", navigateHome);
  document.getElementById("unitDay").textContent = `第 ${unit.id} 日`;
  document.getElementById("unitTitle").textContent = `Day ${unit.id}`;
  document.getElementById("unitFocus").textContent = TAKE_HOME_MESSAGES[unit.id] || unit.focus;
  const drillTextNode = document.getElementById("dailyDrillText");
  drillTextNode.textContent = unit.extraDrill;
  const drillRhymes = document.getElementById("dailyDrillRhymes");
  const drillHelp = document.getElementById("dailyDrillHelp");
  if (drillRhymes) {
    const rhymes = Array.from(new Set(unit.extraDrill.match(/-[a-z]+/gi) || []));
    drillRhymes.innerHTML = "";
    rhymes.slice(0, 2).forEach(rhyme => {
      const body = rhymeBody(rhyme);
      drillRhymes.append(el("div", { class: "rhyme-practice" }, [
        el("span", { class: "rhyme-pill-big", text: rhyme }),
        el("span", { class: "pattern-chip", text: `*${body}` }),
        el("span", { class: "example-chip", text: suggestedSyllablesForRhyme(rhyme).join(" / ") })
      ]));
    });
  }
  if (drillHelp) {
    drillHelp.innerHTML = "";
    const phone = makeSvgIcon("phone", "手機");
    phone.classList.add("inline-phone-icon");
    const firstRhyme = rhymeBody((unit.extraDrill.match(/-[a-z]+/i) || [""])[0]);
    const examples = suggestedSyllablesForRhyme(firstRhyme).slice(0, 3).join(" / ");
    const exampleText = firstRhyme ? `例如 *${firstRhyme}，再試 ${examples}。` : "";
    drillHelp.append(phone, el("span", { text: ` 手機用 Initial-Rhyme layout：先打 Wildcard * + Rhyme，下面列最多 5 個常見例子。${exampleText}按 TypeDuck icon 開網頁版。` }));
  }

  const dailyDrillCheck = document.getElementById("dailyDrillCheck");
  dailyDrillCheck.checked = Boolean(unitState(unit.id).dailyDrill);
  dailyDrillCheck.addEventListener("change", () => setDailyDrillComplete(unit.id, dailyDrillCheck.checked));

  const moduleList = document.getElementById("moduleList");
  unit.modules.forEach((module, idx) => {
    moduleList.append(renderModule(unit, module, idx));
  });
  refreshUnitProgress(unit.id);
}

function renderModule(unit, module, moduleIndex) {
  const card = el("section", { class: `card module-card ${module.type}-module`, id: `module-${moduleIndex}` });
  const header = el("div", { class: "module-header" }, [
    el("h3", { text: module.title }),
    el("span", { class: "pill", id: `module-status-${moduleIndex}`, text: isModuleComplete(unit.id, moduleIndex) ? "✓ 已完成" : "未完成" })
  ]);
  card.append(header);
  card.append(el("p", { class: "instruction", text: module.instruction || conciseInstruction(module.type) }));

  if (module.type === "perc") renderPerception(card, unit, module, moduleIndex);
  if (module.type === "prod") renderProduction(card, unit, module, moduleIndex);
  if (module.type === "quiz") renderQuiz(card, unit, module, moduleIndex);
  if (module.type === "type") renderTypePractice(card, unit, module, moduleIndex);

  return card;
}

function renderPerception(card, unit, module, moduleIndex) {
  const words = splitWords(module.data);
  const targets = targetsForUnit(unit);
  const layout = el("div", { class: "perc-layout" });
  const bank = el("div", { class: "word-bank" });
  const zoneWrap = el("div", { class: "target-zone-wrap" });
  const correctSet = new Set();

  targets.forEach(target => {
    const zone = el("div", { class: "target-zone" });
    zone.dataset.target = target;
    zone.append(
      el("div", { class: "zone-title", text: target }),
      el("div", { class: "zone-list" })
    );
    zone.addEventListener("dragover", e => {
      e.preventDefault();
      zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", e => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      const word = e.dataTransfer.getData("text/plain");
      checkPerception(word, target);
    });
    zoneWrap.append(zone);
  });

  function maybeComplete() {
    if (correctSet.size === words.length) setModuleComplete(unit.id, moduleIndex, true);
  }

  function checkPerception(word, selectedTarget) {
    const correctTarget = codaOf(word);
    const item = card.querySelector(`[data-word="${CSS.escape(word)}"]`);
    if (!item) return;
    const fb = item.querySelector(".feedback");
    const jp = item.querySelector(".jyutping");
    if (item.dataset.locked === "true") return;
    if (selectedTarget === correctTarget) {
      fb.textContent = "✓";
      fb.className = "feedback good";
      jp.textContent = jyutping(word);
      const zoneList = zoneWrap.querySelector(`[data-target="${correctTarget}"] .zone-list`);
      if (zoneList) {
        zoneList.append(item);
        item.dataset.locked = "true";
        item.draggable = false;
        const buttons = item.querySelector(".target-buttons");
        if (buttons) buttons.remove();
      }
      correctSet.add(word);
      maybeComplete();
    } else {
      fb.textContent = "✗ 聽多次個錄音然後試多次吖~";
      fb.className = "feedback bad";
    }
  }

  words.forEach(word => {
    const item = el("div", { class: "word-card", draggable: "true" });
    item.dataset.word = word;
    item.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", word));
    item.append(el("div", { class: "jyutping" }));
    item.append(el("div", { class: "item-header" }, [
      el("span", { class: "word-char", text: word }),
      iconButton("listen", "聽字", () => speak(word))
    ]));
    const buttons = el("div", { class: "target-buttons" });
    targets.forEach(target => {
      buttons.append(el("button", { class: "target-btn", type: "button", onclick: () => checkPerception(word, target), text: target }));
    });
    item.append(buttons);
    item.append(el("div", { class: "feedback" }));
    bank.append(item);
  });

  layout.append(bank, zoneWrap);
  card.append(layout);
}

function renderQuiz(card, unit, module, moduleIndex) {
  const { items, correctIndex } = parseQuiz(module.data);
  const options = el("div", { class: "quiz-options" });
  const fb = el("div", { class: "feedback" });
  let solved = false;

  const listenAll = iconTextButton("play", "全部", "全部播放", () => {
    if (!solved) speak(items.join("，"));
  });

  if (targetsForUnit(unit).includes("-ng")) {
    const hint = el("div", { class: "mouth-legend" });
    const nItem = el("div", { class: "mouth-item" }, [
      el("span", { class: "mouth-label", text: "-n" }),
      makeSvgIcon("mouth-small", "-n 細口形")
    ]);
    const ngItem = el("div", { class: "mouth-item" }, [
      el("span", { class: "mouth-label", text: "-ng" }),
      makeSvgIcon("mouth-big", "-ng 開口形")
    ]);
    hint.append(nItem, ngItem);
    card.append(hint);
  }

  items.forEach((word, idx) => {
    const btn = el("button", { class: "option-btn", type: "button" });
    btn.append(el("span", { class: "jyutping" }));
    btn.append(el("span", { class: "word-char", text: word }));
    btn.append(el("span", { class: "subtle-action", text: "選擇" }));
    btn.addEventListener("click", () => {
      if (solved) return;
      if (idx === correctIndex) {
        solved = true;
        listenAll.disabled = true;
        fb.textContent = "✓";
        fb.className = "feedback good";
        options.querySelectorAll(".option-btn").forEach((option, optionIdx) => {
          option.querySelector(".jyutping").textContent = jyutping(items[optionIdx]);
        });
        setModuleComplete(unit.id, moduleIndex, true);
      } else {
        fb.textContent = "✗ 聽多次個錄音然後試多次吖~";
        fb.className = "feedback bad";
      }
    });
    options.append(btn);
  });

  card.append(listenAll, options, fb);
}

function renderProduction(card, unit, module, moduleIndex) {
  const words = splitWords(module.data);
  const completeSet = new Set();
  const canRecord = Boolean(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const supportNote = el("p", {
    class: "note compact-note",
    text: canRecord
      ? "先聽 sample，再錄自己版本；可反覆聽兩邊比較。錄過或按「完成」就會計入。"
      : "瀏覽器唔支援錄音。請聽 sample 跟讀後按「完成」。"
  });
  card.append(supportNote);

  function maybeComplete() {
    if (completeSet.size === words.length) setModuleComplete(unit.id, moduleIndex, true);
  }

  const row = el("div", { class: "production-row" });

  words.forEach(word => {
    const item = el("div", { class: "production-chip shadow-chip" });
    const status = el("div", { class: "shadow-status", text: "未錄音" });
    const fb = el("div", { class: "feedback" });
    const jp = el("div", { class: "jyutping", text: jyutping(word) });

    const listenBtn = iconButton("listen", "聽 sample", () => speak(word));
    const recordBtn = iconTextButton("record", "錄音", "開始錄音", null, "primary-btn icon-text-btn record-btn");
    const playMineBtn = iconButton("play", "聽自己", null);
    const manualBtn = iconTextButton("check", "完成", "標記完成");
    let recorder = null;
    let chunks = [];
    let recordingUrl = "";
    let recordingTimeout = null;

    function markCorrect(message) {
      completeSet.add(word);
      fb.textContent = message || "✓";
      fb.className = "feedback good";
      maybeComplete();
    }

    function setRecordButtonText(text) {
      const label = recordBtn.querySelector("span");
      if (label) label.textContent = text;
    }

    function clearRecordingUrl() {
      if (!recordingUrl) return;
      URL.revokeObjectURL(recordingUrl);
      recordingUrl = "";
    }

    function stopRecording() {
      if (recorder && recorder.state === "recording") recorder.stop();
    }

    function finishRecording() {
      clearTimeout(recordingTimeout);
      recordingTimeout = null;
      recordBtn.classList.remove("recording");
      setRecordButtonText("再錄");
      recordBtn.setAttribute("title", "重新錄音");
      recordBtn.setAttribute("aria-label", "重新錄音");
      if (activeStopRecording === stopRecording) activeStopRecording = null;

      if (!chunks.length) {
        status.textContent = "未收到錄音，請再試。";
        fb.textContent = "錄音未成功。";
        fb.className = "feedback bad";
        return;
      }

      const blob = new Blob(chunks, { type: recorder && recorder.mimeType ? recorder.mimeType : "audio/webm" });
      clearRecordingUrl();
      recordingUrl = URL.createObjectURL(blob);
      playMineBtn.disabled = false;
      status.textContent = "可聽自己，再同 sample 比較。";
      markCorrect("✓ 已錄音");
    }

    async function startRecording() {
      if (!canRecord) {
        fb.textContent = "呢個瀏覽器唔支援錄音，請跟讀後按「完成」。";
        fb.className = "feedback bad";
        return;
      }

      try {
        if (activeStopRecording) activeStopRecording();
        const stream = await getSharedMicStream();
        chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.addEventListener("dataavailable", event => {
          if (event.data && event.data.size > 0) chunks.push(event.data);
        });
        recorder.addEventListener("stop", finishRecording, { once: true });
        recorder.addEventListener("error", () => {
          clearTimeout(recordingTimeout);
          recordBtn.classList.remove("recording");
          setRecordButtonText("錄音");
          status.textContent = "錄音失敗，請再試。";
          fb.textContent = "錄音失敗。";
          fb.className = "feedback bad";
          if (activeStopRecording === stopRecording) activeStopRecording = null;
        }, { once: true });

        recorder.start();
        activeStopRecording = stopRecording;
        recordBtn.classList.add("recording");
        setRecordButtonText("停止");
        recordBtn.setAttribute("title", "停止錄音");
        recordBtn.setAttribute("aria-label", "停止錄音");
        status.textContent = "錄緊，讀完可按停止。";
        fb.textContent = "";
        fb.className = "feedback";
        recordingTimeout = setTimeout(stopRecording, 4500);
      } catch (error) {
        status.textContent = "未能開啟咪高峰。";
        fb.textContent = "請允許咪高峰權限，或者跟讀後按「完成」。";
        fb.className = "feedback bad";
      }
    }

    manualBtn.addEventListener("click", () => markCorrect("✓ 已完成"));
    playMineBtn.disabled = true;
    playMineBtn.addEventListener("click", () => {
      if (!recordingUrl) return;
      new Audio(recordingUrl).play();
    });
    recordBtn.addEventListener("click", () => {
      if (recorder && recorder.state === "recording") {
        stopRecording();
        return;
      }
      startRecording();
    });

    item.append(
      el("span", { class: "chip-char", text: word }),
      jp,
      el("div", { class: "shadow-controls" }, [listenBtn, recordBtn, playMineBtn, manualBtn]),
      status,
      fb
    );
    row.append(item);
  });

  card.append(row);
}

function conciseInstruction(type) {
  if (type === "perc") return "聽一次，分 -n/-ng 或 -t/-k。";
  if (type === "prod") return "先聽 sample，錄自己版本，再反覆比較。";
  if (type === "quiz") return "先按「全部播放」，再揀答案。";
  if (type === "type") return "請打晒成個漢字／詞。";
  return "完成練習。";
}

function parseTypeSentence(sentence) {
  const parts = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(sentence)) !== null) {
    if (match.index > lastIndex) parts.push({ type: "text", value: sentence.slice(lastIndex, match.index) });
    parts.push({ type: "blank", value: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < sentence.length) parts.push({ type: "text", value: sentence.slice(lastIndex) });
  return parts;
}

function renderTypePractice(card, unit, module, moduleIndex) {
  if (module.hint) {
    const img = el("img", { class: "hint-image", alt: `提示圖 ${module.hint}` });
    const hint = String(module.hint);
    const dotIndex = hint.indexOf(".");
    const main = dotIndex >= 0 ? hint.slice(0, dotIndex) : hint;
    const paddedMain = main.length === 1 ? `0${main}` : main;
    const suffix = dotIndex >= 0 ? hint.slice(dotIndex) : "";
    const candidates = [
      `pics/${hint}.jpg`,
      `pics/${paddedMain}${suffix}.jpg`,
      `pics/${paddedMain}.jpg`,
      `pics/${main}.jpg`,
      `pics/${hint}.png`,
      `pics/${paddedMain}${suffix}.png`,
      `pics/${paddedMain}.png`,
      `pics/${main}.png`
    ];
    let index = 0;
    img.onerror = () => {
      index += 1;
      if (index < candidates.length) {
        img.src = candidates[index];
        return;
      }
      img.replaceWith(el("div", { class: "image-placeholder", text: `提示圖未搵到：${hint}.jpg` }));
    };
    img.src = candidates[index];
    card.append(img);
  }
  const item = el("div", { class: "type-item" });
  item.append(el("p", { class: "type-note", text: "請輸入完整漢字答案；唔使輸入拼音／韻母。" }));
  const sentence = el("div", { class: "type-sentence" });
  const parts = parseTypeSentence(module.data);
  const blanks = [];
  const hintWords = [];
  const inputList = el("div", { class: "type-input-list" });
  let blankCount = 0;

  parts.forEach(part => {
    if (part.type === "text") {
      sentence.append(document.createTextNode(part.value));
      return;
    }

    blankCount += 1;
    hintWords.push(part.value);
    sentence.append(el("span", { class: "inline-blank", text: "＿＿" }));

    const wrapper = el("div", { class: "type-input-row" });
    const jp = el("span", { class: "jyutping" });
    const input = el("input", { type: "text", maxlength: 30, placeholder: `答案 ${blankCount}`, "aria-label": `Answer ${blankCount}` });
    const fb = el("span", { class: "feedback" });
    const prompt = el("span", { class: "wrong-prompt" });
    wrapper.append(input, fb, jp, prompt);
    inputList.append(wrapper);
    blanks.push({ answer: part.value, input, fb, jp, prompt });
  });

  const hintWrap = el("div", { class: "type-hints" });
  hintWords.forEach((word, index) => {
    hintWrap.append(el("span", { class: "hint-chip", text: `答案 ${index + 1}: ${Array.from(word).length}字` }));
  });

  const checkBtn = iconTextButton("check", "檢查", "檢查答案", null, "primary-btn icon-text-btn");
  const listenBtn = iconTextButton("listen", "全句", "聽全句", () => speak(module.data.replace(/\[|\]/g, "")));
  const moduleFb = el("div", { class: "feedback" });

  function clearTypeFeedback(blank) {
    blank.fb.textContent = "";
    blank.fb.className = "feedback";
    blank.jp.textContent = "";
    blank.prompt.classList.remove("visible");
  }

  function checkTypeAnswers() {
    let allCorrect = true;
    blanks.forEach(blank => {
      blank.input.disabled = false;
      const value = blank.input.value.trim();
      if (typeAnswerMatchesTarget(value, blank.answer)) {
        blank.fb.textContent = "✓";
        blank.fb.className = "feedback good";
        blank.jp.textContent = jyutping(blank.answer);
        blank.prompt.classList.remove("visible");
      } else {
        allCorrect = false;
        blank.fb.textContent = "✗";
        blank.fb.className = "feedback bad";
        blank.jp.textContent = "";
        blank.prompt.textContent = `請輸入完整答案「${blank.answer}」。`;
        blank.prompt.classList.add("visible");
      }
    });
    if (allCorrect) {
      moduleFb.textContent = "✓ 已完成";
      moduleFb.className = "feedback good";
      setModuleComplete(unit.id, moduleIndex, true);
    } else {
      moduleFb.textContent = "請改正紅色交叉嘅答案，再試多次。";
      moduleFb.className = "feedback bad";
    }
  }

  blanks.forEach(blank => {
    blank.input.addEventListener("input", () => {
      clearTypeFeedback(blank);
      if (moduleFb.classList.contains("bad")) {
        moduleFb.textContent = "";
        moduleFb.className = "feedback";
      }
    });
    blank.input.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      checkTypeAnswers();
    });
  });

  checkBtn.addEventListener("click", checkTypeAnswers);

  item.append(sentence, hintWrap, inputList, el("div", { class: "production-controls" }, [listenBtn, checkBtn]), moduleFb);
  card.append(item);
}

function refreshUnitProgress(unitId) {
  if (currentUnitId !== unitId) return;
  const unit = DATA.units.find(u => u.id === unitId);
  const us = unitState(unit.id);
  const completedModules = unit.modules.filter((_, idx) => us.modules[idx]).length;
  const totalItems = unit.modules.length + 1;
  const doneItems = completedModules + (us.dailyDrill ? 1 : 0);

  const unitProgress = document.getElementById("unitProgress");
  if (unitProgress) unitProgress.textContent = `已完成 ${doneItems} / ${totalItems} 項`;

  unit.modules.forEach((_, idx) => {
    const status = document.getElementById(`module-status-${idx}`);
    if (status) status.textContent = us.modules[idx] ? "✓ 已完成" : "未完成";
  });

  const checklist = document.getElementById("dailyChecklist");
  if (checklist) {
    checklist.innerHTML = "";
    unit.modules.forEach((module, idx) => {
      checklist.append(el("li", {}, [
        checkbox(us.modules[idx]),
        el("span", { text: module.title })
      ]));
    });
    checklist.append(el("li", {}, [
      checkbox(us.dailyDrill),
      el("span", { text: "每日額外 TypeDuck 練習" })
    ]));
  }

  const dayCompleteMessage = document.getElementById("dayCompleteMessage");
  if (dayCompleteMessage) {
    if (isUnitComplete(unit)) {
      dayCompleteMessage.textContent = `今日完成！你已經完成第 ${unit.id} 日訓練。`;
    } else {
      dayCompleteMessage.textContent = "";
    }
  }
}

function typeAnswerMatchesTarget(value, answer) {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  const compact = s => String(s).replace(/\s+/g, "");
  return compact(trimmed) === compact(answer);
}

function checkbox(checked) {
  const input = el("input", { type: "checkbox", disabled: "true" });
  input.checked = Boolean(checked);
  return input;
}

document.getElementById("resetProgressBtn").addEventListener("click", () => {
  if (!confirm("要重設全部進度嗎？")) return;
  state = {};
  saveState();
  currentUnitId ? renderUnit(currentUnitId) : renderHome();
});
addLeadingIcon(document.getElementById("resetProgressBtn"), "reset");

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {};
}

window.addEventListener("popstate", renderRoute);
window.addEventListener("hashchange", renderRoute);

renderRoute();
