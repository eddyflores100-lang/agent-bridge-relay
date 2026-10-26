/* Agent Bridge PATCH REMOTO — vive en bridge/patch.js (repo GitHub).
 * Se aplica via CDP en el mundo MAIN de cada pestaña (immune a CSP).
 * EDITAR ESTE ARCHIVO = actualizar la logica de TODAS las extensiones
 * instaladas. Cero reinstalaciones. Versioned por __v.
 */
(function () {
  const V = "2.5.0";
  if (window.__ABPATCH && window.__ABPATCH.__v === V) {
    return { already: true, patched: true, version: V };
  }
  const P = window.__ABPATCH = { __v: V, results: {}, status: {} };

  /* ==================== utilidades ==================== */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
  const txt = (el) => (el && (el.innerText || el.value || el.textContent) || "").trim();
  const hidden = () => document.visibilityState === "hidden";
  const beat = (ms) => (hidden() ? Promise.resolve() : sleep(ms)); // en 2º plano: sin ritmo

  async function waitFor(fn, maxMs, step) {
    maxMs = maxMs || 4000; step = step || 70;
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      try { const v = fn(); if (v) return v; } catch (e) { /* sigue */ }
      await sleep(step);
    }
    return null;
  }

  function setNativeValue(el, value) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) desc.set.call(el, value); else el.value = value;
  }

  /** Rellena input/textarea de forma React-friendly (setter nativo + eventos). */
  async function typeInto(el, value) {
    el.focus();
    el.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
    clickEl(el, true);
    setNativeValue(el, "");
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" }));
    await beat(50);
    setNativeValue(el, value);
    el.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
    await beat(40);
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return el.value === value;
  }

  function clickEl(el, soft) {
    if (!el) return false;
    if (!soft && el.scrollIntoView) el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    const o = { bubbles: true, cancelable: true, view: window, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 };
    el.dispatchEvent(new PointerEvent("pointerdown", { ...o, pointerId: 1 }));
    el.dispatchEvent(new MouseEvent("mousedown", o));
    el.dispatchEvent(new PointerEvent("pointerup", { ...o, pointerId: 1 }));
    el.dispatchEvent(new MouseEvent("mouseup", o));
    el.dispatchEvent(new MouseEvent("click", o));
    return true;
  }

  function challengeNow() {
    const t = norm(txt(document.body));
    if (document.querySelector('iframe[src*="challenges.cloudflare.com"], #challenge-form, #cf-challenge-running')) return "cloudflare";
    if (document.querySelector('iframe[src*="hcaptcha.com"]') && /select.*images|verify you are human/.test(t)) return "hcaptcha";
    if (/checking your browser|just a moment|attention required/.test(t)) return "interstitial";
    if (/unusual traffic|confirm you are human/.test(t) && !$("#application_form")) return "recaptcha_interstitial";
    return null;
  }

  /* ==================== config por defecto (editable remoto) ==================== */
  const CFG = {
    first_name: "Edison",
    last_name: "Flores",
    email: "eddyflores100@gmail.com",
    portfolio: "https://github.com/eddyflores100-lang",
    salary_text: "USD 1,000 - 1,400 / month, negotiable (remote contract)",
    tools_text: "WordPress, Shopify, HTML/CSS/JS, AI chatbots (WhatsApp), n8n, Make, Zapier, CRM integrations",
    cover_letter: ""
  };

  /* ==================== escaneo del formulario ==================== */
  function currentSelect(qid) {
    const inp = $("input#" + CSS.escape(qid));
    if (!inp) return null;
    const vc = inp.closest(".select__value-container") ||
      $(".select__value-container:has(input#" + CSS.escape(qid) + ")");
    if (!vc) return null;
    const sv = $(".single-value", vc);
    return sv && txt(sv) ? txt(sv) : null;
  }

  function scanForm() {
    const root = $("#application_form") || $("form") || document;
    const out = {
      url: location.href.slice(0, 300), title: document.title.slice(0, 120),
      challenge: challengeNow(),
      texts: [], files: [], dropdowns: [], radios: [], buttons: []
    };
    const labels = {};
    $$("label[for]", root).forEach((l) => { labels[l.getAttribute("for")] = norm(txt(l)); });
    // qids de react-select ANTES del escaneo de texto (para excluir sus inputs)
    const ddQids = new Set();
    $$("[id$='-placeholder']", root).forEach((p) => {
      const m = p.id.match(/react-select-(.+)-placeholder/);
      if (m) ddQids.add(m[1]);
    });
    $$("input, textarea", root).forEach((el) => {
      const id = el.id || "";
      const ty = el.tagName === "TEXTAREA" ? "textarea" : (el.getAttribute("type") || "text").toLowerCase();
      if (["hidden", "submit", "button", "search", "image"].indexOf(ty) >= 0) return;
      if (ty === "radio" || ty === "checkbox") return; // van en la seccion radios
      if (/^iti-/.test(id) || id === "country") return; // widget telefono / dropdown country
      if (el.getAttribute("role") === "combobox" || el.closest(".select__value-container") || ddQids.has(id)) return; // react-select
      if (ty === "file") { out.files.push({ id, name: el.name || "" }); return; }
      const lab = labels[id] || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "";
      out.texts.push({
        id, tag: el.tagName.toLowerCase(), type: ty,
        label: lab.slice(0, 140), value: (el.value || "").slice(0, 90),
        required: !!el.required
      });
    });
    const seen = new Set();
    $$("[id$='-placeholder']").forEach((p) => {
      const m = p.id.match(/react-select-(.+)-placeholder/);
      if (!m) return;
      const qid = m[1];
      if (seen.has(qid)) return;
      seen.add(qid);
      const inp = $("input#" + CSS.escape(qid));
      const lab = (inp && (labels[qid] || inp.getAttribute("aria-label") || "")) || "";
      out.dropdowns.push({ id: qid, label: lab.slice(0, 140), value: currentSelect(qid) });
    });
    const groups = {};
    $$("input[type=radio]", root).forEach((r) => { (groups[r.name] = groups[r.name] || []).push(r); });
    Object.keys(groups).forEach((name) => {
      const radios = groups[name];
      const opts = radios.map((r) => {
        const lb = r.closest("label") || (r.id && document.querySelector('label[for="' + CSS.escape(r.id) + '"]'));
        return txt(lb).slice(0, 90);
      });
      let lab = "";
      // label de la PREGUNTA: legend del fieldset, o primer label que no sea una opcion
      const box = radios[0] && radios[0].closest("li,fieldset");
      if (box) {
        const lg = box.tagName === "FIELDSET" ? box.querySelector("legend") : null;
        if (lg) lab = norm(txt(lg));
        if (!lab) {
          const optTexts = new Set(opts.map(norm));
          for (const lb of box.querySelectorAll("label")) {
            const t = norm(txt(lb));
            if (t && !optTexts.has(t)) { lab = t; break; }
          }
        }
      }
      if (!lab) { for (const r of radios) { if (r.id && labels[r.id]) { lab = labels[r.id]; break; } } }
      out.radios.push({ name, label: lab, options: opts, checked: radios.findIndex((r) => r.checked) });
    });
    $$("button", root).forEach((b) => {
      const t = txt(b);
      if (!t) return;
      if (b.type === "submit" || /submit|send|enviar|apply/i.test(t))
        out.buttons.push({ type: b.type || "button", text: t.slice(0, 60) });
    });
    return out;
  }

  /* ==================== reglas de eleccion (dropdowns/radios) ==================== */
  function pickOption(label, opts) {
    const l = norm(label);
    const T = opts.map(norm);
    const find = (re) => opts.findIndex((t) => re.test(norm(t)));
    const yesNo = (wantYes) => {
      const re = wantYes ? /^yes\b|^si\b|yes,|s\u00ed,|currently/ : /^no\b|not |never|don't|do not/;
      let i = opts.findIndex((t) => { const n = norm(t); return wantYes ? (n === "yes" || n === "si" || n.startsWith("yes") || n.startsWith("s\u00ed")) : (n === "no" || n.startsWith("no,") || n.startsWith("no ") || n === "not applicable" || n === "no/never"); });
      if (i >= 0) return i;
      return find(wantYes ? /\byes\b|\bs\u00ed\b/ : /\bno\b/);
    };
    if (/salary|expectation/.test(l)) return 0;
    if (/notice/.test(l)) { let i = find(/immedi/); return i >= 0 ? i : 0; }
    if (/authorized to work|legally authorized/.test(l)) return yesNo(true);
    if (/sponsor/.test(l)) return yesNo(false);
    if (/relocate|relocation/.test(l)) return yesNo(false);
    if (/remote/.test(l)) return yesNo(true);
    if (/english/.test(l)) return yesNo(true);
    if (/how did you hear/.test(l)) { let i = find(/other|internet|linkedin|google/); return i >= 0 ? i : 0; }
    if (/currently.*(wpp|work|employ|freelanc)|intern, freelancer, or employee/.test(l)) return yesNo(false);
    if (/how old|your age|age range/.test(l)) { let i = find(/prefer not|no answer|rather not/); if (i >= 0) return i; i = find(/^(25|26|27|28|29|30)/); return i >= 0 ? i : 0; }
    if (/gender/.test(l)) { let i = find(/(^|\s)male(\s|$)/); if (i >= 0) return i; i = find(/prefer not|rather not/); return i >= 0 ? i : 0; }
    if (/transgender/.test(l)) return yesNo(false);
    if (/hispanic|latino/.test(l)) return yesNo(true);
    if (/race|ethnicity/.test(l)) { let i = find(/white|hispanic|prefer/); return i >= 0 ? i : 0; }
    if (/veteran/.test(l)) return yesNo(false);
    if (/disability|disabled/.test(l)) { let i = find(/prefer not|rather not|no,? i don't|no,? i do not/); return i >= 0 ? i : 0; }
    if (/country/.test(l)) { let i = find(/ecuador/); return i >= 0 ? i : 0; }
    if (/first name|nombre/.test(l)) return 0;
    // generica: primera opcion con contenido que no sea 'select...'
    let i = opts.findIndex((t) => { const n = norm(t); return n && !/select|choose|eligir|elegir/.test(n.slice(0, 8)); });
    return i >= 0 ? i : 0;
  }

  /* ==================== dropdown react-select ==================== */
  async function chooseDropdown(qid, label) {
    const cur = currentSelect(qid);
    if (cur) return { id: qid, value: cur, skipped: true };
    const inp = $("input#" + CSS.escape(qid));
    if (!inp) return { id: qid, error: "input no encontrado" };
    // intento 1: click
    clickEl(inp);
    await beat(200);
    let listbox = await waitFor(() => $("div[id^='react-select-" + CSS.escape(qid) + "-listbox']") ||
      $$("div[id^='react-select-'][id$='-listbox']").find((d) => $("div[id^='" + d.id.replace("-listbox", "-option-") + "']")), 2500);
    // intento 2: teclado (ArrowDown abre el menu aunque el click sintetico no)
    if (!listbox) {
      inp.focus();
      ["keydown", "keypress", "keyup"].forEach((ty) => inp.dispatchEvent(new KeyboardEvent(ty, { key: "ArrowDown", bubbles: true, cancelable: true })));
      await beat(250);
      listbox = await waitFor(() => $$("div[id$='-listbox']").find((d) => d.id.includes("-" + qid + "-") || $("div[id^='react-select-" + CSS.escape(qid) + "-option-']", d)), 2500);
    }
    if (!listbox) return { id: qid, error: "menu no abrio" };
    // leer opciones
    const optEls = $$("[id^='react-select-" + CSS.escape(qid) + "-option-']", listbox.parentElement || document);
    const texts = optEls.map(txt);
    if (!texts.length) return { id: qid, error: "sin opciones" };
    const idx = pickOption(label, texts);
    const chosen = optEls[idx >= 0 ? idx : 0];
    clickEl(chosen);
    await beat(180);
    let val = await waitFor(() => currentSelect(qid), 2500);
    if (!val) {
      // fallback teclado: ArrowDown x(idx+1) + Enter
      inp.focus();
      for (let i = 0; i <= idx; i++) {
        ["keydown", "keyup"].forEach((ty) => inp.dispatchEvent(new KeyboardEvent(ty, { key: "ArrowDown", bubbles: true, cancelable: true })));
        await beat(90);
      }
      ["keydown", "keyup"].forEach((ty) => inp.dispatchEvent(new KeyboardEvent(ty, { key: "Enter", bubbles: true, cancelable: true })));
      await beat(200);
      val = await waitFor(() => currentSelect(qid), 2500);
    }
    return { id: qid, value: val, options: texts.length, picked: texts[idx >= 0 ? idx : 0] };
  }

  /* ==================== radios ==================== */
  async function answerRadio(group) {
    if (group.checked >= 0) return { name: group.name, value: group.options[group.checked] || "?", skipped: true };
    const idx = pickOption(group.label, group.options);
    const radios = $$("input[type=radio][name='" + CSS.escape(group.name) + "']");
    const el = radios[idx >= 0 ? idx : 0];
    if (!el) return { name: group.name, error: "radio desaparecido" };
    if (!el.checked) el.click(); // click nativo: dispara input/change de verdad
    await beat(60);
    const li = el.closest("li");
    return { name: group.name, value: group.options[idx >= 0 ? idx : 0], verified: el.checked, label: group.label.slice(0, 60) };
  }

  /* ==================== mapeo de campos de texto ==================== */
  function textValueFor(id, label, cfg) {
    const l = norm(label);
    const idl = norm(id);
    if (idl === "first_name" || /first name|nombre(\s|$)/.test(l)) return cfg.first_name;
    if (idl === "last_name" || /last name|apellido/.test(l)) return cfg.last_name;
    if (idl === "email" || ty_email(label) || /correo|e-mail/.test(l)) return cfg.email;
    if (/salary|expectation/.test(l)) return cfg.salary_text;
    if (/portfolio|website|github|url/.test(l) && !/linkedin/.test(l)) return cfg.portfolio;
    if (/linkedin/.test(l)) return cfg.linkedin || cfg.portfolio;
    if (/cover letter|carta de presentaci|motivaci/.test(l)) return cfg.cover_letter != null ? cfg.cover_letter : "";
    if (/tools|software|stack|experience with|technolog/.test(l)) return cfg.tools_text;
    if (/phone|telefono|celular|m\u00f3vil|movil/.test(l)) return cfg.phone || "";
    if (/location|ciudad|city/.test(l)) return cfg.location || "";
    return null;
  }
  function ty_email(label) { return /email/.test(norm(label)); }

  /* ==================== FILLJOB: el flujo completo ==================== */
  P.fillJob = async function (args) {
    args = args || {};
    const cfg = Object.assign({}, CFG, args.data || {});
    const report = {
      key: args.key || null, url: location.href.slice(0, 200),
      filled: [], skipped: [], dropdowns: [], radios: [], pending: [],
      needsFile: false, submitted: false, challenge: null
    };
    // 0) challenge?
    const ch = challengeNow();
    if (ch) { report.challenge = ch; return report; }
    // 1) ya enviada?
    const bodyTxt = norm(txt(document.body));
    if (/thank you for (your )?(application|applying)|application (was )?(submitted|received)|we (have )?received your|gracias por (tu )?(aplicaci\u00f3n|postular)/.test(bodyTxt)) {
      report.submitted = true; report.already = true;
      return report;
    }
    // 2) escanear
    const form = scanForm();
    if (!form.texts.length && !form.dropdowns.length && !form.radios.length && !form.files.length) {
      report.error = "sin formulario visible (posible redirect o challenge)";
      report.challenge = challengeNow() || undefined;
      return report;
    }
    report.needsFile = form.files.length > 0;
    // 3) campos de texto
    for (const f of form.texts) {
      if ((f.value || "").trim()) { report.skipped.push(f.id + " (ya tenia valor)"); continue; }
      let val = textValueFor(f.id, f.label, cfg);
      if (val == null && f.type === "email") val = cfg.email;
      if (val == null) { report.pending.push({ id: f.id, label: f.label, why: "sin regla" }); continue; }
      if (val === "") { report.skipped.push(f.id + " (sin dato)"); continue; }
      const el = f.id ? document.getElementById(f.id) : null;
      if (!el) { report.pending.push({ id: f.id, why: "elemento desaparecido" }); continue; }
      const ok = await typeInto(el, val);
      report[ok ? "filled" : "pending"].push(ok ? f.id + "=" + val.slice(0, 30) : { id: f.id, why: "no persistio" });
      await beat(90);
    }
    // 4) cover letter (textarea con label especifico)
    const covTa = $$("textarea").find((ta) => /cover letter|carta|why|motivaci/.test(norm((ta.id && (labelsById(ta.id) || "")) + " " + (ta.getAttribute("aria-label") || "") + " " + (ta.getAttribute("placeholder") || ""))));
    if (covTa && !txt(covTa) && cfg.cover_letter) {
      const ok = await typeInto(covTa, cfg.cover_letter);
      report[ok ? "filled" : "pending"].push(ok ? "cover_letter" : { id: "cover_letter", why: "no persistio" });
    }
    // 5) dropdowns
    for (const d of form.dropdowns) {
      const r = await chooseDropdown(d.id, d.label);
      report.dropdowns.push(r);
      if (r.error) report.pending.push({ id: d.id, why: "dropdown: " + r.error });
      await beat(70);
    }
    // 6) radios
    for (const g of form.radios) {
      const r = await answerRadio(g);
      report.radios.push(r);
      if (r.error) report.pending.push({ id: g.name, why: "radio: " + r.error });
      await beat(50);
    }
    // 7) submit
    if (args.submit === false) { report.note = "submit omitido (submit:false)"; return report; }
    const before = txt(document.body).slice(0, 4000);
    let btn = $('button[type="submit"]') || $$("button,input[type=submit]").find((b) => /submit application|submit|enviar|send application|apply/i.test(txt(b)));
    if (!btn) { report.error = "boton submit no encontrado"; return report; }
    clickEl(btn);
    // 8) confirmacion o errores de validacion
    const conf = await waitFor(() => {
      const t = norm(txt(document.body));
      if (/thank you for (your )?(application|applying)|application (was )?(submitted|received)|we (have )?received your|gracias por (tu )?(aplicaci\u00f3n|postular)|application received/.test(t)) return "ok";
      if (/please (fix|complete|fill)|required|must be completed|can't be blank|cannot be blank|invalid/i.test(t) && t !== norm(before)) return "validation";
      return null;
    }, 14000, 400);
    if (conf === "ok") {
      report.submitted = true;
      report.confirmation = txt(document.body).slice(0, 160).replace(/\s+/g, " ");
    } else if (conf === "validation") {
      report.submitted = false;
      report.validation = "errores de validacion tras submit";
      // capturar mensajes de error visibles
      report.errors = $$("[class*='error'],[role=alert]").map(txt).filter(Boolean).slice(0, 8);
      // y pendientes reales: campos requeridos vacios
      const form2 = scanForm();
      report.pending = report.pending.concat(
        form2.texts.filter((f) => f.required && !(f.value || "").trim()).map((f) => ({ id: f.id, why: "requerido vacio" })),
        form2.dropdowns.filter((d) => !d.value).map((d) => ({ id: d.id, why: "dropdown requerido vacio" }))
      );
    } else {
      report.submitted = false;
      report.error = "sin confirmacion en 14s (posible captcha al enviar)";
      report.challenge = challengeNow() || undefined;
    }
    return report;
  };

  function labelsById(id) {
    const l = document.querySelector('label[for="' + CSS.escape(id) + '"]');
    return l ? txt(l) : "";
  }

  /* ==================== API del patch ==================== */
  P.scanForm = scanForm;
  P.pickOption = pickOption;
  P.version = () => V;
  return { patched: true, version: V };
})();
