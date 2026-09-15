let mode = "exam";
let quiz = [];
let current = 0;
let startTime = null;
let timerInterval = null;
let selectedModule = null;

const $ = id => document.getElementById(id);

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function clean(s){ return String(s ?? "").trim(); }

function makeQuestion(source, pool){
  const correct = clean(source.correct);
  let candidates = shuffle(pool.filter(x => clean(x.correct) && clean(x.correct) !== correct).map(x=>clean(x.correct)));
  candidates = [...new Set(candidates)];
  // Prefer distractors from the same chapter, then broaden if necessary.
  if(candidates.length < 3){
    candidates = [...new Set([
      ...candidates,
      ...shuffle(DOMANDE.filter(x=>clean(x.correct) && clean(x.correct)!==correct).map(x=>clean(x.correct)))
    ])];
  }
  const wrongs = candidates.slice(0,3);
  const options = shuffle([{text:correct,correct:true}, ...wrongs.map(text=>({text,correct:false}))]);
  return {...source, options, answer:null, checked:false};
}

function startExam(){
  mode="exam";
  quiz = shuffle(DOMANDE).slice(0,30).map(q=>makeQuestion(q, DOMANDE));
  startQuiz("SIMULAZIONE ESAME");
}
function startChapter(module, chapter){
  mode="chapter";
  const source = DOMANDE.filter(q=>q.module===module && q.chapter===chapter);
  const count = Math.min(30, source.length);
  quiz = shuffle(source).slice(0,count).map(q=>makeQuestion(q, source));
  startQuiz(chapter);
}
function startQuiz(label){
  current=0; startTime=Date.now();
  clearInterval(timerInterval);
  timerInterval=setInterval(updateTimer,1000);
  $("quizModeLabel").textContent=label;
  show("quiz"); hide("home"); hide("chapterSelect");
  renderNav(); renderQuestion(); updateTimer();
}
function updateTimer(){
  if(!startTime)return;
  const sec=Math.floor((Date.now()-startTime)/1000);
  const m=String(Math.floor(sec/60)).padStart(2,"0"), s=String(sec%60).padStart(2,"0");
  $("timer").textContent=`${m}:${s}`;
}
function renderNav(){
  $("questionNav").innerHTML="";
  quiz.forEach((q,i)=>{
    const b=document.createElement("button");
    b.className="qnav";
    b.textContent=i+1;
    if(i===current)b.classList.add("current");
    if(q.checked)b.classList.add(q.answer===true?"correct":"wrong");
    else if(q.answer!==null)b.classList.add("answered");
    b.onclick=()=>{current=i;renderNav();renderQuestion()};
    $("questionNav").appendChild(b);
  });
  const correct=quiz.filter(q=>q.answer===true).length;
  const answered=quiz.filter(q=>q.checked).length;
  $("score").textContent=`${correct} / ${answered}`;
}
function renderQuestion(){
  const q=quiz[current];
  $("progressText").textContent=`Domanda ${current+1} di ${quiz.length}`;
  $("chapterLabel").textContent=q.chapter || q.module || "";
  $("questionHeader").textContent=`DOMANDA ${current+1}`;
  $("questionText").textContent=q.question;
  $("answers").innerHTML="";
  q.options.forEach((opt,idx)=>{
    const row=document.createElement("button");
    row.className="answer";
    if(q.checked) row.classList.add("disabled");
    if(q.checked && opt.correct) row.classList.add("correct");
    if(q.checked && q.answer===false && q.options[q.selected]?.correct===false && idx===q.selected) row.classList.add("wrong");
    if(!q.checked && q.selected===idx) row.classList.add("selected");
    row.innerHTML=`<span class="answer-letter">${"ABCD"[idx]}</span><span class="answer-text">${escapeHtml(opt.text)}</span>`;
    row.onclick=()=>chooseAnswer(idx);
    $("answers").appendChild(row);
  });
  $("feedback").className="feedback hidden";
  if(q.checked){
    const f=$("feedback");
    f.className=`feedback ${q.answer===true?"ok":"no"}`;
    f.innerHTML=q.answer===true
      ? "✓ Risposta corretta!"
      : `✕ Risposta errata. La risposta corretta è: <strong>${escapeHtml(q.options.find(o=>o.correct).text)}</strong>`;
  }
  $("prevBtn").disabled=current===0;
  $("nextBtn").textContent=current===quiz.length-1?"TERMINA":"AVANTI →";
}
function chooseAnswer(idx){
  const q=quiz[current];
  if(q.checked)return;
  q.selected=idx;
  q.answer=q.options[idx].correct;
  q.checked=true;
  renderNav();renderQuestion();
}
function finish(){
  clearInterval(timerInterval);
  const correct=quiz.filter(q=>q.answer===true).length;
  const total=quiz.length;
  const passed=mode==="exam" ? correct>=18 : true;
  $("resultIcon").textContent=mode==="exam"?(passed?"✓":"✕"):"✓";
  $("resultTitle").textContent=mode==="exam"?(passed?"TEST SUPERATO":"TEST NON SUPERATO"):"ESERCITAZIONE COMPLETATA";
  $("resultScore").textContent=`${correct} / ${total}`;
  $("resultText").textContent=mode==="exam"
    ? (passed ? "Complimenti! Hai raggiunto almeno 18 risposte corrette su 30." : "Per superare il test servono almeno 18 risposte corrette su 30.")
    : `Hai risposto correttamente a ${correct} domande su ${total}.`;
  $("resultModal").classList.remove("hidden");
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
}
function show(id){$(id).classList.remove("hidden")}
function hide(id){$(id).classList.add("hidden")}
function goHome(){
  clearInterval(timerInterval); $("resultModal").classList.add("hidden");
  show("home");hide("quiz");hide("chapterSelect");$("timer").textContent="00:00";
}
function openChapterSelect(){
  hide("home");show("chapterSelect");
  const modules=[...new Set(DOMANDE.map(q=>q.module))];
  $("moduleList").innerHTML="";
  modules.forEach(m=>{
    const count=DOMANDE.filter(q=>q.module===m).length;
    const chapters=new Set(DOMANDE.filter(q=>q.module===m).map(q=>q.chapter)).size;
    const b=document.createElement("button");b.className="module-btn";
    b.innerHTML=`<strong>${escapeHtml(m)}</strong><span>${count} domande · ${chapters} capitoli</span>`;
    b.onclick=()=>openModule(m);$("moduleList").appendChild(b);
  });
}
function openModule(m){
  selectedModule=m;
  $("chapterArea").classList.remove("hidden");
  $("selectedModuleTitle").textContent=m;
  const chapters=[...new Set(DOMANDE.filter(q=>q.module===m).map(q=>q.chapter))];
  $("chapterList").innerHTML="";
  chapters.forEach(ch=>{
    const count=DOMANDE.filter(q=>q.module===m&&q.chapter===ch).length;
    const b=document.createElement("button");b.className="chapter-btn";
    b.textContent=`${ch} · ${count} domande`;
    b.onclick=()=>startChapter(m,ch);$("chapterList").appendChild(b);
  });
  $("chapterArea").scrollIntoView({behavior:"smooth"});
}

$("examMode").onclick=startExam;
$("chapterMode").onclick=openChapterSelect;
$("finishBtn").onclick=()=>{if(!$("quiz").classList.contains("hidden"))finish()};
$("prevBtn").onclick=()=>{if(current>0){current--;renderNav();renderQuestion()}};
$("nextBtn").onclick=()=>{if(current<quiz.length-1){current++;renderNav();renderQuestion()}else finish()};
$("retryBtn").onclick=()=>{$("resultModal").classList.add("hidden"); mode==="exam"?startExam():startChapter(selectedModule,quiz[0].chapter)};
$("homeBtn").onclick=goHome;
document.querySelector("[data-back]").onclick=goHome;
