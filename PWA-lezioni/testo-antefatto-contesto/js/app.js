const slides = [
  {
    title: "Testo, antefatto, contesto",
    menu: "Introduzione",
    type: "cover",
    accent: "#0f5f89",
    image: "Home.webp",
    body: "Un metodo per capire i testi e per orientarsi nella realtà.",
    hotspots: [
      { label: "TESTO", className: "testo", target: 2 },
      { label: "ANTEFATTO", className: "antefatto", target: 3 },
      { label: "CONTESTO", className: "contesto", target: 4 }
    ]
  },
  {
    title: "La mappa generale",
    menu: "La mappa generale",
    accent: "#607381",
    image: "Testo-antefatto-contesto.webp",
    question: "Prima separiamo. Poi impariamo a riconoscere.",
    lead: "La lezione parte da una situazione ordinata: il testo letterario. Solo dopo useremo lo stesso metodo nella realtà, dove tutto arriva mescolato.",
    cards: [
      ["TESTO", "Che cosa sta accadendo?", "#b83d31"],
      ["ANTEFATTO", "Come siamo arrivati fin qui?", "#587d32"],
      ["CONTESTO", "In quale mondo sta accadendo?", "#176ead"]
    ],
    message: "Nella realtà queste tre cose non sono separate. Le separiamo per imparare a riconoscerle."
  },
  {
    title: "Il testo",
    menu: "Il testo",
    accent: "#b83d31",
    image: "Testo.webp",
    className: "focus-text",
    question: "Che cosa sta accadendo?",
    lead: "Il testo è il brano, l'opera o il documento che leggiamo.",
    bullets: [
      "Si legge con attenzione.",
      "Si analizzano contenuto, forma e stile.",
      "Si ricavano informazioni, significati e messaggi.",
      "Si collega con antefatto e contesto."
    ],
    message: "Il testo è il punto di partenza della nostra analisi.",
    jump: { label: "Esplora nella vita →", target: 6 }
  },
  {
    title: "L'antefatto",
    menu: "L'antefatto",
    accent: "#587d32",
    image: "Antefatto.webp",
    className: "focus-antefatto",
    spot: ["42%", "45%"],
    question: "Come siamo arrivati a questo momento?",
    lead: "L'antefatto è l'insieme degli avvenimenti che precedono il testo e che sono necessari per comprenderlo.",
    bullets: [
      "Si ricostruisce la storia precedente.",
      "Si individuano personaggi, relazioni e cause.",
      "Si selezionano le informazioni realmente utili.",
      "Si comprende meglio ciò che accade nel testo."
    ],
    message: "L'antefatto ci aiuta a capire da dove viene la storia.",
    jump: { label: "Esplora nella vita →", target: 7 }
  },
  {
    title: "Il contesto",
    menu: "Il contesto",
    accent: "#176ead",
    image: "Contesto.webp",
    className: "focus-contesto",
    spot: ["72%", "48%"],
    question: "In quale mondo sta accadendo?",
    lead: "Il contesto è il mondo nel quale il testo nasce: epoca storica, società, cultura, idee, valori, credenze, lingua, ambiente.",
    bullets: [
      "La libreria rappresenta il grande scaffale del contesto.",
      "Non bisogna prendere tutto.",
      "Bisogna scegliere solo le informazioni che servono a capire quel testo."
    ],
    message: "Il contesto dà senso al testo e ne spiega il significato profondo.",
    jump: { label: "Esplora nella vita →", target: 8 }
  },
  {
    title: "Adesso chiudiamo il libro",
    menu: "Dalla teoria alla realtà",
    type: "transition",
    accent: "#b98616",
    lead: "Nella vita nessuno ci dice: questo è il testo, questo è l'antefatto, questo è il contesto. Nella realtà è tutto mescolato. Tocca a noi imparare a separarlo.",
    jump: { label: "Entriamo nella realtà", target: 6 }
  },
  {
    title: "La vita: testo",
    menu: "La vita: Testo",
    accent: "#b83d31",
    image: "Vita-testo.webp",
    question: "Che cosa sta accadendo?",
    lead: "Siamo in classe. Il professore sta spiegando davanti alla LIM. Gli studenti ascoltano, guardano e prendono appunti.",
    bullets: [
      "La lezione è davanti ai nostri occhi.",
      "La LIM mostra una presentazione.",
      "Questo presente diventa il nostro punto di partenza."
    ],
    message: "Questo è il nostro testo: ciò che sta accadendo davanti ai nostri occhi.",
    jump: { label: "← Torna al concetto", target: 2 }
  },
  {
    title: "La vita: antefatto",
    menu: "La vita: Antefatto",
    accent: "#587d32",
    image: "Vita-antefatto.webp",
    question: "Come siamo arrivati fin qui?",
    lead: "Per capire il presente, ricostruiamo la serie degli avvenimenti precedenti. Ma non tutto ciò che è accaduto prima è importante.",
    timeline: [
      "Ti svegli.",
      "Ti prepari.",
      "Esci di casa.",
      "Arrivi all'Istituto Einaudi.",
      "Suona la campanella.",
      "Il professore ha preparato la lezione.",
      "La lezione è iniziata.",
      "E ora siamo qui."
    ],
    message: "L'antefatto seleziona gli avvenimenti rilevanti che spiegano come siamo arrivati a questo momento.",
    jump: { label: "← Torna al concetto", target: 3 }
  },
  {
    title: "La vita: contesto",
    menu: "La vita: Contesto",
    accent: "#176ead",
    image: "Vita-contesto.webp",
    question: "In quale mondo sta accadendo?",
    lead: "La realtà che stiamo vivendo non si spiega soltanto guardando ciò che accade davanti a noi.",
    timeline: [
      "Classe",
      "Istituto Einaudi",
      "Foggia",
      "Italia",
      "Europa",
      "Mondo"
    ],
    bullets: [
      "Storia, società, famiglia, tecnologia e cultura.",
      "Lingua, economia, leggi, istituzioni e ambiente.",
      "Epoca storica: il tempo in cui viviamo."
    ],
    message: "Il contesto ci fa vedere il quadro completo.",
    jump: { label: "← Torna al concetto", target: 4 }
  },
  {
    title: "Conclusione",
    menu: "Conclusione",
    accent: "#607381",
    image: "Testo-antefatto-contesto.webp",
    question: "Comprendere significa collegare.",
    cards: [
      ["TESTO", "Che cosa sta accadendo?", "#b83d31"],
      ["ANTEFATTO", "Come siamo arrivati fin qui?", "#587d32"],
      ["CONTESTO", "In quale mondo sta accadendo?", "#176ead"]
    ],
    message: "Comprendere significa mettere ciò che vediamo in relazione con ciò che è accaduto prima e con il mondo che lo circonda.",
    jump: { label: "Torna alla mappa", target: 1 }
  }
];

const slideEl = document.querySelector("#slide");
const indexNav = document.querySelector("#indexNav");
const counter = document.querySelector("#counter");
const dots = document.querySelector("#dots");
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const indexBtn = document.querySelector("#indexBtn");
const indexPanel = document.querySelector("#indexPanel");
const closeIndexBtn = document.querySelector("#closeIndexBtn");
const fullscreenBtn = document.querySelector("#fullscreenBtn");

let current = Number(new URLSearchParams(window.location.search).get("slide")) || 0;
current = clamp(current, 0, slides.length - 1);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? Math.trunc(value) : min));
}

function imagePath(name) {
  return `./img/${name}`;
}

function renderIndex() {
  indexNav.innerHTML = slides.map((slide, index) => `
    <button class="index-item ${index === current ? "active" : ""}" type="button" style="--accent:${slide.accent}" data-target="${index}">
      <span>${index === 0 ? "H" : index + 1}</span>
      <strong>${slide.menu}</strong>
    </button>
  `).join("");
}

function renderDots() {
  dots.innerHTML = slides.map((_, index) => `<span class="dot ${index === current ? "active" : ""}"></span>`).join("");
}

function renderCards(cards) {
  if (!cards) return "";
  return `<div class="map-grid">${cards.map(([title, text, color]) => `
    <article class="concept-card" style="--accent:${color}; background:${color}">
      <h3>${title}</h3>
      <p>${text}</p>
    </article>
  `).join("")}</div>`;
}

function renderList(items, className = "") {
  if (!items) return "";
  return `<ul class="${className}">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function renderJump(jump) {
  if (!jump) return "";
  return `<div class="jump-row"><button class="jump-button" type="button" data-target="${jump.target}">${jump.label}</button></div>`;
}

function renderCover(slide) {
  return `<div class="visual"><div class="cover-art"><img src="${imagePath(slide.image)}" alt="Testo, antefatto, contesto. Un metodo per capire i testi e per orientarsi nella realtà. Libro aperto in biblioteca."></div></div>`;
}

function renderTransition(slide) {
  return `
    <div class="transition-inner">
      <h2>${slide.title}</h2>
      <p>${slide.lead}</p>
      ${renderJump(slide.jump)}
    </div>
  `;
}

function renderStandard(slide) {
  const visualClass = slide.image === "Testo-antefatto-contesto.webp" ? "visual contain" : "visual";
  return `
    <div class="${visualClass}">
      <img src="${imagePath(slide.image)}" alt="">
    </div>
    <article class="content">
      <p class="eyebrow">${current < 5 ? "Leggere un testo" : current < 9 ? "Leggere la realtà" : "Le tre domande"}</p>
      <h2>${slide.title}</h2>
      ${slide.question ? `<p class="question">${slide.question}</p>` : ""}
      ${slide.lead ? `<p class="lead">${slide.lead}</p>` : ""}
      ${renderCards(slide.cards)}
      ${renderList(slide.timeline, "timeline")}
      ${renderList(slide.bullets)}
      ${slide.message ? `<p class="message">${slide.message}</p>` : ""}
      ${renderJump(slide.jump)}
    </article>
  `;
}

function render() {
  const slide = slides[current];
  slideEl.className = `slide-card ${slide.type === "cover" ? "cover" : ""} ${slide.type === "transition" ? "transition-slide" : ""} ${slide.className || ""}`;
  slideEl.style.setProperty("--accent", slide.accent);
  if (slide.spot) {
    slideEl.style.setProperty("--spot-x", slide.spot[0]);
    slideEl.style.setProperty("--spot-y", slide.spot[1]);
  }

  if (slide.type === "cover") {
    slideEl.innerHTML = renderCover(slide);
  } else if (slide.type === "transition") {
    slideEl.innerHTML = renderTransition(slide);
  } else {
    slideEl.innerHTML = renderStandard(slide);
  }

  slideEl.scrollTop = 0;
  document.querySelectorAll('.concept-links button').forEach(button => {
    button.setAttribute('aria-current', Number(button.dataset.target) === current ? 'page' : 'false');
  });
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
  counter.textContent = `${current + 1} / ${slides.length}`;
  renderIndex();
  renderDots();
  history.replaceState(null, "", `?slide=${current}`);
}

function goTo(index) {
  if (indexPanel.open) indexPanel.close();
  current = clamp(index, 0, slides.length - 1);
  render();
  slideEl.focus({ preventScroll: true });
}

function next() {
  if (current < slides.length - 1) goTo(current + 1);
}

function prev() {
  if (current > 0) goTo(current - 1);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-target]");
  if (target) {
    goTo(Number(target.dataset.target));
  }
});

prevBtn.addEventListener("click", prev);
nextBtn.addEventListener("click", next);
indexBtn.addEventListener("click", () => {
  indexPanel.showModal();
  indexBtn.setAttribute("aria-expanded", "true");
  indexPanel.querySelector(".active")?.focus();
});
closeIndexBtn.addEventListener("click", () => indexPanel.close());
indexPanel.addEventListener("close", () => indexBtn.setAttribute("aria-expanded", "false"));
indexPanel.addEventListener("click", event => {
  if (event.target === indexPanel) {
    const rect = indexPanel.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) indexPanel.close();
  }
});

fullscreenBtn.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      fullscreenBtn.textContent = "Esci";
    } else {
      await document.exitFullscreen();
      fullscreenBtn.textContent = "Schermo intero";
    }
  } catch (error) {
    fullscreenBtn.textContent = "Non disponibile";
  }
});

document.addEventListener("fullscreenchange", () => {
  fullscreenBtn.textContent = document.fullscreenElement ? "Esci" : "Schermo intero";
});

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement?.tagName;
  if (indexPanel.open || ["INPUT", "TEXTAREA", "BUTTON", "A"].includes(tag)) return;
  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    next();
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    prev();
  }
  if (event.key === "Escape") {
    goTo(0);
  }
});

if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" }).catch(() => {});
  });
}

render();
