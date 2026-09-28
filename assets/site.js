// Study notes: shared behaviour for every page.
// - TOPICS is the one list of pages. Prev/next links, progress counts and the quiz page all read it,
//   so adding a page means adding one line here (and a link on its category page).
// - "Learned" ticks are stored in this browser only (localStorage). Losing them loses nothing important.

const TOPICS = [
  // God of War project (WadOfGore), in course order
  { cat: "gow", url: "gow/01-project-setup.html", title: "Project setup: modules, Build.cs, redirects" },
  { cat: "gow", url: "gow/02-gameplay-tags.html", title: "Native gameplay tags" },
  { cat: "gow", url: "gow/03-enhanced-input.html", title: "Data-driven Enhanced Input" },
  { cat: "gow", url: "gow/04-camera-movement.html", title: "Third-person camera and movement" },
  { cat: "gow", url: "gow/05-anim-instances.html", title: "Anim instances in C++" },
  { cat: "gow", url: "gow/06-ability-system.html", title: "Gameplay Ability System setup" },
  { cat: "gow", url: "gow/07-abilities-weapons.html", title: "Activation policy and the weapon" },
  { cat: "gow", url: "gow/08-cpp-toolkit.html", title: "The C++ vocabulary the course uses" },
  // C++
  { cat: "cpp", url: "cpp/pointers-references-const.html", title: "Values, references, pointers, const" },
  { cat: "cpp", url: "cpp/containers-move.html", title: "Containers move: the TArray reference bug" },
  { cat: "cpp", url: "cpp/includes-unity-builds.html", title: "Includes, unity builds, PCH, IWYU" },
  // Unreal internals
  { cat: "unreal", url: "unreal/garbage-collection.html", title: "Garbage collection and UPROPERTY" },
  { cat: "unreal", url: "unreal/asset-references.html", title: "Hard vs soft references" },
  { cat: "unreal", url: "unreal/tick-and-frame.html", title: "Tick controls and frame order" },
  { cat: "unreal", url: "unreal/many-objects.html", title: "2,000 tickers: managers, subsystems, instancing" },
  { cat: "unreal", url: "unreal/blueprint-cpp-boundary.html", title: "The Blueprint / C++ boundary" },
  // Performance
  { cat: "perf", url: "perf/profiling-triage.html", title: "22 fps, 20 minutes: profiling triage" },
  // Portfolio
  { cat: "portfolio", url: "portfolio/ai-authorship.html", title: "Your work vs the AI's, and how you verify" },
  { cat: "portfolio", url: "portfolio/custom-component.html", title: "Why a custom primitive component" },
  // Interview answers
  { cat: "behavioural", url: "behavioural/senior-disagrees.html", title: "A senior overrules you / a time you were wrong" },
  { cat: "behavioural", url: "behavioural/prioritising.html", title: "Six people, six tools, one month" },
];

const CATEGORIES = {
  gow: "God of War project",
  cpp: "C++",
  unreal: "Unreal internals",
  perf: "Performance",
  portfolio: "Portfolio",
  behavioural: "Interview answers",
};

// Site root, worked out from where this script was loaded, so links work at any folder depth
// and on GitHub Pages under /repo-name/.
const ROOT = (document.currentScript && document.currentScript.src)
  ? document.currentScript.src.replace(/assets\/site\.js.*$/, "")
  : "./";

function storeGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storeSet(key, value) {
  try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch (e) { /* private mode */ }
}
function isLearned(url) { return storeGet("learned:" + url) === "1"; }

// The page's own TOPICS entry, matched on the end of the URL.
function currentTopic() {
  const path = decodeURI(location.pathname).replace(/\\/g, "/");
  return TOPICS.find(t => path.endsWith("/" + t.url));
}

// Topic pages: add the "mark as learned" button and prev/next links within the category.
function buildPageEnd() {
  const end = document.querySelector(".page-end");
  const topic = currentTopic();
  if (!end || !topic) return;

  const btn = document.createElement("button");
  btn.className = "btn";
  const paint = () => {
    const done = isLearned(topic.url);
    btn.textContent = done ? "✓ Learned" : "Mark as learned";
    btn.classList.toggle("done", done);
  };
  btn.addEventListener("click", () => {
    storeSet("learned:" + topic.url, isLearned(topic.url) ? null : "1");
    paint();
  });
  paint();

  const siblings = TOPICS.filter(t => t.cat === topic.cat);
  const i = siblings.indexOf(topic);
  const pager = document.createElement("div");
  pager.className = "pager";
  if (i > 0) pager.appendChild(link(siblings[i - 1], "← Previous"));
  if (i < siblings.length - 1) pager.appendChild(link(siblings[i + 1], "Next →"));

  end.append(btn, pager);

  function link(t, label) {
    const a = document.createElement("a");
    a.className = "btn ghost";
    a.href = ROOT + t.url;
    a.textContent = label;
    a.title = t.title;
    return a;
  }
}

// Category and home pages: tick learned topics and show progress per category.
function markLists() {
  document.querySelectorAll(".topic-list a").forEach(a => {
    const url = a.href.replace(ROOT, "");
    if (isLearned(url)) a.classList.add("learned");
  });
  document.querySelectorAll("[data-progress]").forEach(el => {
    const cat = el.dataset.progress;
    const all = TOPICS.filter(t => t.cat === cat);
    const done = all.filter(t => isLearned(t.url)).length;
    el.textContent = done + " / " + all.length + " learned";
  });
}

// Quiz page: fetch topic pages, pull their questions, show a shuffled handful.
async function runQuiz() {
  const host = document.getElementById("quiz-host");
  if (!host) return;
  const select = document.getElementById("quiz-cat");
  const again = document.getElementById("quiz-again");
  const status = document.getElementById("quiz-status");

  let pool = [];
  try {
    const parser = new DOMParser();
    await Promise.all(TOPICS.map(async t => {
      const res = await fetch(ROOT + t.url);
      if (!res.ok) return;
      const doc = parser.parseFromString(await res.text(), "text/html");
      doc.querySelectorAll(".quiz details.q").forEach(q => pool.push({ topic: t, html: q.innerHTML }));
    }));
  } catch (e) {
    status.textContent = "Couldn't load the questions. The quiz page needs the site served over http "
      + "(GitHub Pages, or `python -m http.server` locally); opening the file directly blocks it.";
    return;
  }

  const draw = () => {
    const cat = select.value;
    const from = cat === "all" ? pool : pool.filter(p => p.topic.cat === cat);
    const picked = from.slice().sort(() => Math.random() - 0.5).slice(0, 5);
    host.innerHTML = "";
    picked.forEach(p => {
      const d = document.createElement("details");
      d.className = "q";
      d.innerHTML = p.html;
      const from = document.createElement("p");
      from.className = "hint";
      from.innerHTML = 'From <a href="' + ROOT + p.topic.url + '">' + p.topic.title + "</a>";
      d.querySelector(".a").appendChild(from);
      host.appendChild(d);
    });
    status.textContent = from.length + " questions in this pool. Showing 5.";
  };
  select.addEventListener("change", draw);
  again.addEventListener("click", draw);
  draw();
}

buildPageEnd();
markLists();
runQuiz();
