const DATA = window.COURSE_DATA;
const app = document.getElementById("app");
const homeTemplate = document.getElementById("homeTemplate");
const unitTemplate = document.getElementById("unitTemplate");
const STORE_KEY = "cantoneseCodaTrainerProgress.v1";

let state = loadState();
let currentUnitId = null;
let currentRecognition = null;
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

function speak(text) {
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
    const tile = el("button", { class: `unit-tile ${complete ? "complete" : ""}`, type: "button", onclick: () => renderUnit(unit.id) }, [
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
  document.getElementById("backHomeBtn").addEventListener("click", renderHome);
  document.getElementById("unitDay").textContent = `第 ${unit.id} 日`;
  document.getElementById("unitTitle").textContent = `Day ${unit.id}`;
  document.getElementById("unitFocus").textContent = TAKE_HOME_MESSAGES[unit.id] || unit.focus;
  const drillTextNode = document.getElementById("dailyDrillText");
  drillTextNode.textContent = unit.extraDrill;
  const drillRhymes = document.getElementById("dailyDrillRhymes");
  const drillHelp = document.getElementById("dailyDrillHelp");
  if (drillRhymes) {
    const rhymes = unit.extraDrill.match(/\*[a-z]+/gi) || [];
    drillRhymes.innerHTML = "";
    rhymes.slice(0, 2).forEach(rhyme => {
      drillRhymes.append(el("span", { class: "rhyme-pill-big", text: rhyme }));
    });
  }
  if (drillHelp) {
    drillHelp.innerHTML = "";
    const phone = makeSvgIcon("phone", "手機");
    phone.classList.add("inline-phone-icon");
    drillHelp.append(phone, el("span", { text: " 建議用手機打；或者用 TypeDuck 網頁。" }));
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
  card.append(el("p", { class: "instruction", text: conciseInstruction(module.type) }));

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
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supportNote = el("p", { class: "note compact-note", text: SpeechRecognition ? "請讀：呢個係X字。只會接受最高排名答案為正確。" : "瀏覽器唔支援語音識別，請用「完成」。" });
  card.append(supportNote);

  function logAsr(message) {
    const ts = new Date().toLocaleTimeString("zh-HK", { hour12: false });
    const line = `${ts} ${message}`;
    if (!window.__asrLogs) window.__asrLogs = [];
    window.__asrLogs.unshift(line);
    if (window.__asrLogs.length > 120) window.__asrLogs.length = 120;
    if (typeof console !== "undefined" && console.debug) console.debug(line);
  }

  function maybeComplete() {
    if (completeSet.size === words.length) setModuleComplete(unit.id, moduleIndex, true);
  }

  const row = el("div", { class: "production-row" });

  words.forEach(word => {
    const item = el("div", { class: "production-chip" });
    const result = el("div", { class: "asr-result" });
    const fb = el("div", { class: "feedback" });
    const jp = el("div", { class: "jyutping" });

    const listenBtn = iconButton("listen", "聽", () => speak(word));
    const speakBtn = iconButton("record", "錄音", null, "primary-btn icon-btn record-btn");
    const manualBtn = iconTextButton("check", "完成", "手動完成");

    function markCorrect(message) {
      completeSet.add(word);
      jp.textContent = jyutping(word);
      fb.textContent = message || "✓";
      fb.className = "feedback good";
      maybeComplete();
    }

    manualBtn.addEventListener("click", () => markCorrect("✓ 已手動完成"));

    speakBtn.addEventListener("click", () => {
      if (!SpeechRecognition) {
        fb.textContent = "瀏覽器唔支援語音識別。請朗讀後按「完成」。";
        fb.className = "feedback bad";
        logAsr(`[${word}] 不支援 SpeechRecognition`);
        return;
      }

      if (currentRecognition) {
        currentRecognition.manualAbort = true;
        currentRecognition.abort();
        logAsr(`[${word}] 已中止上一個識別`);
      }

      const yueLangs = ["yue-Hant-HK", "yue-HK", "yue"];
      const seen = [];

      fb.textContent = "聆聽中…";
      fb.className = "feedback";
      result.textContent = "";

      const startAttempt = (langIndex) => {
        let gotResult = false;
        let matched = false;
        let endedByError = false;
        let timedOut = false;
        let heardSound = false;
        let heardSpeech = false;
        let allowRetry = false;
        let recognition;

        try {
          recognition = new SpeechRecognition();
        } catch {
          fb.textContent = "語音識別初始化失敗，請改用 Chrome / Safari，或者先按「完成」。";
          fb.className = "feedback bad";
          logAsr(`[${word}] 初始化失敗`);
          return;
        }

        currentRecognition = recognition;
        recognition.lang = yueLangs[langIndex];
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 5;

        const timeoutId = setTimeout(() => {
          timedOut = true;
          logAsr(`[${word}] 3s timeout -> stop()`);
          try {
            recognition.stop();
          } catch {
            logAsr(`[${word}] timeout stop 失敗`);
          }
        }, 3000);

        recognition.onstart = () => {
          fb.textContent = "錄音就緒，請讀出。";
          fb.className = "feedback";
          speakBtn.classList.add("recording");
          logAsr(`[${word}] onstart lang=${recognition.lang}`);
        };
        recognition.onaudiostart = () => logAsr(`[${word}] onaudiostart`);
        recognition.onsoundstart = () => {
          heardSound = true;
          logAsr(`[${word}] onsoundstart`);
        };
        recognition.onspeechstart = () => {
          heardSpeech = true;
          logAsr(`[${word}] onspeechstart`);
        };
        recognition.onspeechend = () => logAsr(`[${word}] onspeechend`);

        recognition.onresult = event => {
          const latest = event.results[event.results.length - 1];
          if (!latest) return;
          const alternatives = Array.from(latest).map(r => r.transcript.trim()).filter(Boolean);
          if (!alternatives.length) return;
          gotResult = true;
          alternatives.forEach(text => {
            if (!seen.includes(text)) seen.push(text);
          });
          logAsr(`[${word}] onresult final=${latest.isFinal} -> ${alternatives.join(" | ")}`);
          result.textContent = `識別：${seen.join(" / ")}`;

          const carryEval = evaluateCarrySentenceRanking(seen, word);
          if (carryEval.accept) {
            matched = true;
            markCorrect("✓");
            clearTimeout(timeoutId);
            recognition.manualAbort = true;
            recognition.abort();
          } else if (latest.isFinal) {
            const top = carryEval.candidates.slice(0, 3).map(c => c.char).join("、");
            fb.textContent = top ? `收到文字，候選：${top}` : "收到文字，核對中…";
            fb.className = "feedback";
          }
        };

        recognition.onerror = event => {
          if (recognition.manualAbort) return;
          endedByError = true;
          logAsr(`[${word}] onerror ${event.error}`);
          if (event.error === "language-not-supported" && langIndex < yueLangs.length - 1) {
            allowRetry = true;
            return;
          }
          if (event.error === "not-allowed") {
            fb.textContent = "未有咪高峰權限。請允許麥克風後再試。";
          } else if (event.error === "no-speech") {
            fb.textContent = "收唔到聲音，請再朗讀一次。";
          } else if (event.error === "language-not-supported") {
            fb.textContent = "瀏覽器唔支援 yue 語音識別。請改用最新版 Chrome。";
          } else {
            fb.textContent = "語音識別失敗。可以再試一次，或者朗讀後按「完成」。";
          }
          fb.className = "feedback bad";
        };

        recognition.onend = () => {
          clearTimeout(timeoutId);
          currentRecognition = null;
          speakBtn.classList.remove("recording");
          logAsr(`[${word}] onend gotResult=${gotResult} matched=${matched} timeout=${timedOut} heardSound=${heardSound} heardSpeech=${heardSpeech}`);
          if (recognition.manualAbort) return;
          if (completeSet.has(word) || matched) return;

          if (allowRetry) {
            logAsr(`[${word}] 語言重試 -> ${yueLangs[langIndex + 1]}`);
            startAttempt(langIndex + 1);
            return;
          }

          if (gotResult) {
            const carryEval = evaluateCarrySentenceRanking(seen, word);
            const topText = carryEval.candidates.slice(0, 3).map(c => `${c.char}（${c.jp}）`).join("、");
            if (!carryEval.hasCarryForm) {
              fb.textContent = "✗ 請用完整句式：呢個係X字。";
            } else if (topText) {
              fb.textContent = `✗ 最高排名唔係目標字。候選：${topText}。請再讀：呢個係${word}字。`;
            } else {
              fb.textContent = `✗ 未認到關鍵字。請再讀：呢個係${word}字。`;
            }
          } else if (timedOut && !endedByError) {
            fb.textContent = "3秒內未有文字結果。請靠近咪高峰、大聲少少，再試一次。";
          } else if (!endedByError) {
            if (!heardSound) {
              fb.textContent = "未收到聲音。請檢查咪高峰權限，再讀一次。";
            } else if (!heardSpeech) {
              fb.textContent = "收到環境聲，但未收到清楚語音。請靠近咪高峰、慢啲讀。";
            } else {
              fb.textContent = "收到語音但未轉到文字。請大聲少少再試，或者按「完成」。";
            }
          }

          if (fb.textContent === "聆聽中…") {
            fb.textContent = "未完成語音轉文字。請再試一次，或者按「完成」。";
          }
          fb.className = "feedback bad";
        };

        try {
          recognition.start();
        } catch {
          clearTimeout(timeoutId);
          fb.textContent = "語音識別啟動失敗。請再試，或者朗讀後按「完成」。";
          fb.className = "feedback bad";
          logAsr(`[${word}] start() 失敗`);
        }
      };

      startAttempt(0);
    });

    item.append(
      el("span", { class: "chip-char", text: word }),
      el("div", { class: "production-controls" }, [listenBtn, speakBtn, manualBtn]),
      jp,
      result,
      fb
    );
    row.append(item);
  });

  card.append(row);
}

function conciseInstruction(type) {
  if (type === "perc") return "聽一次，分 -n/-ng 或 -t/-k。";
  if (type === "prod") return "聽、讀、錄；讀到同音都算啱。";
  if (type === "quiz") return "先按「全部播放」，再揀答案。";
  if (type === "type") return "只填拼音／韻母。";
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
      img.replaceWith(el("div", { class: "image-placeholder", text: `提示圖未搵到：${hint}.png` }));
    };
    img.src = candidates[index];
    card.append(img);
  }
  const item = el("div", { class: "type-item" });
  item.append(el("p", { class: "type-note", text: "輸入漢字或拼音均可（唔計聲調）。" }));
  const sentence = el("div", { class: "type-sentence" });
  const parts = parseTypeSentence(module.data);
  const blanks = [];
  const hintWords = [];
  const inputList = el("div", { class: "type-input-list" });

  parts.forEach((part, blankIndex) => {
    if (part.type === "text") {
      sentence.append(document.createTextNode(part.value));
      return;
    }

    hintWords.push(part.value);
    sentence.append(el("span", { class: "inline-blank", text: "＿＿" }));

    const wrapper = el("div", { class: "type-input-row" });
    const jp = el("span", { class: "jyutping" });
    const input = el("input", { type: "text", maxlength: 30, placeholder: `答案 ${blankIndex + 1}`, "aria-label": `Answer ${blankIndex + 1}` });
    const fb = el("span", { class: "feedback" });
    const prompt = el("span", { class: "wrong-prompt" });
    wrapper.append(input, fb, jp, prompt);
    inputList.append(wrapper);
    blanks.push({ answer: part.value, input, fb, jp, prompt });
  });

  const hintWrap = el("div", { class: "type-hints" });
  hintWords.forEach(word => {
    hintWrap.append(el("span", { class: "hint-chip", text: word }));
  });

  const checkBtn = iconTextButton("check", "檢查", "檢查答案", null, "primary-btn icon-text-btn");
  const listenBtn = iconTextButton("listen", "全句", "聽全句", () => speak(module.data.replace(/\[|\]/g, "")));
  const moduleFb = el("div", { class: "feedback" });

  checkBtn.addEventListener("click", () => {
    let allCorrect = true;
    blanks.forEach(blank => {
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
        const targetJp = jyutping(blank.answer);
        blank.prompt.textContent = `請輸入「${blank.answer}」或其拼音「${targetJp}」（唔計聲調）。`;
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
  });

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

function transcriptMatchesTarget(text, targetWord) {
  const normalized = normalizeAsrText(text);
  if (!normalized) return false;
  if (normalized.includes(targetWord)) return true;

  const targetJp = jyutping(targetWord);
  if (targetJp === "?") return false;
  const targetParsed = parseJyutping(targetJp);

  // 1) If ASR returned Jyutping-like latin tokens, compare directly.
  const romanizedTokens = extractJyutpingLikeTokens(normalized);
  for (const token of romanizedTokens) {
    if (isJyutpingMatch(token, targetParsed)) return true;
  }

  // 2) If ASR returned Han chars, map each char to Jyutping and compare.
  for (const ch of Array.from(normalized)) {
    const chJp = jyutping(ch);
    if (chJp === "?") continue;
    if (isJyutpingMatch(chJp, targetParsed)) return true;
  }

  return false;
}

function normalizeAsrText(text) {
  return (text || "").toLowerCase().replace(/[\s，。,.!?！？]/g, "");
}

function typeAnswerMatchesTarget(value, answer) {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  if (trimmed === answer) return true;
  const targetJp = jyutping(answer);
  if (targetJp === "?") return false;
  const norm = s => s.toLowerCase().replace(/[\s\-]/g, "");
  if (norm(trimmed) === norm(targetJp)) return true;
  const noTone = s => norm(s).replace(/[1-6]/g, "");
  const inputNoTone = noTone(trimmed);
  const targetNoTone = noTone(targetJp);
  if (inputNoTone.length >= 2 && inputNoTone === targetNoTone) return true;
  return false;
}

function extractJyutpingLikeTokens(text) {
  const tokens = text.match(/[a-z]+[1-6]?/g);
  return tokens || [];
}

function isJyutpingMatch(candidateJp, targetParsed) {
  const parsed = parseJyutping(candidateJp);
  if (!parsed.base || !targetParsed.base) return false;

  // Exact base match is required; tone can vary in ASR but coda must stay exact.
  if (parsed.base !== targetParsed.base) return false;
  if (parsed.coda !== targetParsed.coda) return false;
  return true;
}

function nearestCharacterSuggestion(alternatives, targetWord) {
  const targetJp = jyutping(targetWord);
  if (!targetJp || targetJp === "?") return null;

  const targetParts = parseJyutping(targetJp);
  const byCandidate = new Map();

  alternatives.forEach(alt => {
    const normalized = (alt || "").replace(/[\s，。,.!?！？]/g, "");
    Array.from(normalized).forEach(ch => {
      const jp = jyutping(ch);
      if (!jp || jp === "?") return;

      const candidateParts = parseJyutping(jp);
      const baseDistance = levenshtein(candidateParts.base, targetParts.base);
      const tonePenalty = candidateParts.tone === targetParts.tone ? 0 : 0.3;
      const codaPenalty = candidateParts.coda === targetParts.coda ? 0 : 0.9;
      const score = baseDistance + tonePenalty + codaPenalty;

      const key = `${ch}|${jp}`;
      const prev = byCandidate.get(key);
      if (!prev) {
        byCandidate.set(key, { char: ch, jp, score, count: 1 });
      } else {
        prev.count += 1;
        prev.score = Math.min(prev.score, score);
      }
    });
  });

  const candidates = Array.from(byCandidate.values())
    .sort((a, b) => (a.score - b.score) || (b.count - a.count) || a.char.localeCompare(b.char));

  if (!candidates.length) return null;

  const best = candidates[0];
  const second = candidates[1];
  const ambiguous = Boolean(second && Math.abs(second.score - best.score) <= 0.15);
  return { best, candidates, ambiguous };
}

function evaluateCarrySentenceRanking(alternatives, targetWord) {
  const candidates = rankCarrySentenceCandidates(alternatives);
  const best = candidates[0] || null;
  const hasCarryForm = alternatives.some(alt => {
    const text = normalizeAsrText(alt);
    return text.includes("呢個係") && text.includes("字");
  });
  const targetJp = jyutping(targetWord);
  const accept = Boolean(best && (best.char === targetWord || (targetJp !== "?" && best.jp === targetJp)));
  return { accept, hasCarryForm, candidates };
}

function rankCarrySentenceCandidates(alternatives) {
  const scoreMap = new Map();

  alternatives.forEach(alt => {
    const raw = normalizeAsrText(alt);
    if (!raw) return;

    const startIdx = raw.indexOf("係");
    const endIdx = raw.indexOf("字", startIdx + 1);
    const between = startIdx >= 0 && endIdx > startIdx ? raw.slice(startIdx + 1, endIdx) : raw;
    const chars = Array.from(between).filter(ch => /\p{Script=Han}/u.test(ch));
    if (!chars.length) return;

    chars.forEach((ch, idx) => {
      const jp = jyutping(ch);
      if (jp === "?") return;
      const key = `${ch}|${jp}`;
      const baseScore = 1;
      const endBonus = idx === chars.length - 1 ? 0.7 : 0;
      const singleBonus = chars.length === 1 ? 0.8 : 0;
      const score = baseScore + endBonus + singleBonus;
      const prev = scoreMap.get(key);
      if (!prev) {
        scoreMap.set(key, { char: ch, jp, score, count: 1 });
      } else {
        prev.count += 1;
        prev.score += score;
      }
    });
  });

  return Array.from(scoreMap.values())
    .sort((a, b) => (b.score - a.score) || (b.count - a.count) || a.char.localeCompare(b.char));
}

function parseJyutping(jp) {
  const syllable = (jp || "").trim().split(/\s+/).at(-1) || "";
  const toneMatch = syllable.match(/[1-6]$/);
  const tone = toneMatch ? toneMatch[0] : "";
  const base = syllable.replace(/[1-6]/g, "").toLowerCase();
  return { base, tone, coda: codaFromBase(base) };
}

function codaFromBase(base) {
  if (base.endsWith("ng")) return "ng";
  if (base.endsWith("n")) return "n";
  if (base.endsWith("k")) return "k";
  if (base.endsWith("t")) return "t";
  return "";
}

function levenshtein(a, b) {
  const x = a || "";
  const y = b || "";
  const dp = Array.from({ length: x.length + 1 }, () => Array(y.length + 1).fill(0));
  for (let i = 0; i <= x.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= y.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= x.length; i += 1) {
    for (let j = 1; j <= y.length; j += 1) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[x.length][y.length];
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

renderHome();
