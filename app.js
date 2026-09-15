let mode="exam",quiz=[],current=0,startTime=null,timerInterval=null,selectedModule=null,selectedParagraph=null,elapsedSeconds=0;
const $=id=>document.getElementById(id);
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function moduleName(p){return p.split(" - ")[0].trim()}
function canonicalModule(m){let x=m.trim().replace(/\s+/g," ").toUpperCase();if(x==="I CONTRATTI DELLA PA")x="CONTRATTI DELLA PA";return x}
function moduleQuestions(m){return DOMANDE.filter(q=>canonicalModule(moduleName(q.paragraph))===canonicalModule(m))}
function makeQuestion(q){return {...q,options:shuffle([{text:q.correct,correct:true},{text:q.wrong1,correct:false},{text:q.wrong2,correct:false},{text:q.wrong3,correct:false}]),selected:null,checked:false}}
function startExam(){mode="exam";quiz=shuffle(DOMANDE).slice(0,30).map(makeQuestion);startQuiz("SIMULAZIONE ESAME")}
function startModule(m){mode="module";selectedModule=m;quiz=shuffle(moduleQuestions(m)).slice(0,30).map(makeQuestion);startQuiz("TEST DEL MODULO")}
function startParagraph(p){mode="paragraph";selectedParagraph=p;quiz=shuffle(DOMANDE.filter(q=>q.paragraph===p)).map(makeQuestion);startQuiz(p)}
function startQuiz(label){current=0;startTime=Date.now();clearInterval(timerInterval);timerInterval=setInterval(updateTimer,1000);$("quizModeLabel").textContent=label;show("quiz");hide("home");hide("moduleSelect");renderNav();renderQuestion();updateTimer()}
function updateTimer(){if(!startTime)return;let sec=Math.floor((Date.now()-startTime)/1000);$("timer").textContent=`${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`}
function renderNav(){$("questionNav").innerHTML="";quiz.forEach((q,i)=>{let b=document.createElement("button");b.className="qnav"+(i===current?" current":"")+(q.checked?(q.answer?" correct":" wrong"):"");b.textContent=i+1;b.onclick=()=>{current=i;renderNav();renderQuestion()};$("questionNav").appendChild(b)});$("score").textContent=`${quiz.filter(q=>q.answer===true).length} / ${quiz.filter(q=>q.checked).length}`}
function renderQuestion(){let q=quiz[current];$("progressText").textContent=`Domanda ${current+1} di ${quiz.length}`;$("chapterLabel").textContent=q.paragraph;$("questionHeader").textContent=`DOMANDA ${current+1}`;$("questionText").textContent=q.question;$("answers").innerHTML="";q.options.forEach((o,i)=>{let b=document.createElement("button");b.className="answer"+(q.checked?" disabled":"");if(q.checked&&o.correct)b.classList.add("correct");if(q.checked&&!o.correct&&q.selected===i)b.classList.add("wrong");b.innerHTML=`<span class="answer-letter">${"ABCD"[i]}</span><span class="answer-text">${esc(o.text)}</span>`;b.onclick=()=>choose(i);$("answers").appendChild(b)});let f=$("feedback");if(q.checked){f.className="feedback "+(q.answer?"ok":"no");f.innerHTML=q.answer?"✓ Risposta corretta!":`✕ Risposta errata. La risposta corretta è: <strong>${esc(q.options.find(o=>o.correct).text)}</strong>`}else f.className="feedback hidden";$("prevBtn").disabled=current===0;$("nextBtn").textContent=current===quiz.length-1?"TERMINA":"AVANTI →"}
function choose(i){let q=quiz[current];if(q.checked)return;q.selected=i;q.answer=q.options[i].correct;q.checked=true;renderNav();renderQuestion()}
function finish(){clearInterval(timerInterval);elapsedSeconds=startTime?Math.floor((Date.now()-startTime)/1000):elapsedSeconds;let correct=quiz.filter(q=>q.answer===true).length,total=quiz.length,wrong=quiz.filter(q=>q.checked&&q.answer!==true).length,unanswered=quiz.filter(q=>!q.checked).length,passed=mode==="exam"&&correct>=18;let mm=String(Math.floor(elapsedSeconds/60)).padStart(2,"0"),ss=String(elapsedSeconds%60).padStart(2,"0");$("resultIcon").textContent=mode==="exam"?(passed?"✓":"✕"):"✓";$("resultTitle").textContent=mode==="exam"?(passed?"TEST SUPERATO":"TEST NON SUPERATO"):"ESERCITAZIONE COMPLETATA";$("resultScore").textContent=`${correct} / ${total}`;$("resultText").innerHTML=`Tempo impiegato: <strong>${mm}:${ss}</strong><br>Corrette: <strong>${correct}</strong> · Sbagliate: <strong>${wrong}</strong> · Non risposte: <strong>${unanswered}</strong><br><br>${mode==="exam"?(passed?"Hai raggiunto almeno 18 risposte corrette su 30.":"Per superare il test servono almeno 18 risposte corrette su 30."):`Hai completato l'esercitazione con ${correct} risposte corrette su ${total}.`}`;$("resultModal").classList.remove("hidden")}
function reviewQuestions(){clearInterval(timerInterval);$("resultModal").classList.add("hidden");hide("home");hide("quiz");hide("moduleSelect");show("reviewPage");$("reviewList").innerHTML="";quiz.forEach((q,i)=>{let item=document.createElement("div");item.className="review-item";let status=q.checked?(q.answer?"✓ CORRETTA":"✕ ERRATA"):"— NON RISPOSTA",cls=q.checked?(q.answer?"correct":"wrong"):"",your=q.checked?q.options[q.selected].text:"Nessuna risposta",correct=q.options.find(o=>o.correct).text;item.innerHTML=`<div class="review-head"><span>DOMANDA ${i+1}</span><span class="review-status ${cls}">${status}</span></div><div class="review-question">${esc(q.question)}</div><div class="review-answer ${q.checked?"your":"unanswered"}"><span class="review-label">La tua risposta</span>${esc(your)}</div><div class="review-answer correct-answer"><span class="review-label">Risposta corretta</span>${esc(correct)}</div>`;$("reviewList").appendChild(item)});window.scrollTo(0,0)}
function downloadResults(){
  const { jsPDF } = window.jspdf;
  if(!jsPDF){ alert("La libreria PDF non è ancora pronta. Riprova tra un secondo."); return; }
  const correct=quiz.filter(q=>q.answer===true).length;
  const total=quiz.length;
  const wrong=quiz.filter(q=>q.checked&&q.answer!==true).length;
  const unanswered=quiz.filter(q=>!q.checked).length;
  const passed=mode==="exam"&&correct>=18;
  const mm=String(Math.floor(elapsedSeconds/60)).padStart(2,"0");
  const ss=String(elapsedSeconds%60).padStart(2,"0");
  const title=mode==="exam"?"SIMULAZIONE ESAME":mode==="module"?"TEST DEL MODULO":"ESERCITAZIONE PER PARAGRAFO";
  const doc=new jsPDF({unit:"mm",format:"a4"});
  const W=doc.internal.pageSize.getWidth();
  const H=doc.internal.pageSize.getHeight();
  const margin=16, textW=W-margin*2;
  let y=18;
  const addWrapped=(text,size=10,bold=false,space=4)=>{
    doc.setFont("helvetica",bold?"bold":"normal");doc.setFontSize(size);
    const lines=doc.splitTextToSize(String(text),textW);
    if(y+lines.length*(size*0.48)+space>H-15){doc.addPage();y=18;}
    doc.text(lines,margin,y);y+=lines.length*(size*0.48)+space;
  };
  doc.setFont("helvetica","bold");doc.setFontSize(18);doc.text("TEST PEGASO",margin,y);y+=9;
  addWrapped(title,13,true,5);
  addWrapped(`Risultato: ${correct}/${total}`,12,true,3);
  addWrapped(`Esito: ${mode==="exam"?(passed?"SUPERATO":"NON SUPERATO"):"ESERCITAZIONE COMPLETATA"}`,10,true,3);
  addWrapped(`Tempo impiegato: ${mm}:${ss}`,10,false,2);
  addWrapped(`Corrette: ${correct}   |   Sbagliate: ${wrong}   |   Non risposte: ${unanswered}`,10,false,7);
  doc.setDrawColor(180);doc.line(margin,y,W-margin,y);y+=7;

  quiz.forEach((q,i)=>{
    if(y>H-30){doc.addPage();y=18;}
    addWrapped(`DOMANDA ${i+1}`,11,true,3);
    addWrapped(q.question,10,true,4);
    const your=q.checked?q.options[q.selected].text:"Nessuna risposta";
    const ok=q.options.find(o=>o.correct).text;
    addWrapped(`La tua risposta: ${your}`,9,false,3);
    addWrapped(`Risposta corretta: ${ok}`,9,true,3);
    y+=2;
  });
  doc.save("Risultati_Test_Pegaso.pdf");
}
function show(id){$(id).classList.remove("hidden")}function hide(id){$(id).classList.add("hidden")}
function home(){clearInterval(timerInterval);$("resultModal").classList.add("hidden");show("home");hide("quiz");hide("moduleSelect");hide("reviewPage");$("timer").textContent="00:00"}
function openModules(){hide("home");show("moduleSelect");$("moduleArea").classList.add("hidden");let mods=[...new Set(DOMANDE.map(q=>canonicalModule(moduleName(q.paragraph))))];$("moduleList").innerHTML="";mods.forEach(m=>{let qs=moduleQuestions(m),ps=[...new Set(qs.map(q=>q.paragraph))],b=document.createElement("button");b.className="module-btn";b.innerHTML=`<strong>${esc(m)}</strong><span>${qs.length} domande · ${ps.length} paragrafi</span>`;b.onclick=()=>openModule(m);$("moduleList").appendChild(b)})}
function openModule(m){selectedModule=m;$("moduleArea").classList.remove("hidden");$("moduleTitle").textContent=m;$("moduleTestBtn").textContent=`🎯 TEST DEL MODULO — 30 DOMANDE MISTE`;let ps=[...new Set(moduleQuestions(m).map(q=>q.paragraph))];$("paragraphList").innerHTML="";ps.forEach((p,i)=>{let n=DOMANDE.filter(q=>q.paragraph===p).length;let display=p.includes(" - ")?p.split(" - ").slice(1).join(" - ").trim():p.trim();let b=document.createElement("button");b.className="chapter-btn";b.innerHTML=`<strong>${i+1}) ${esc(display)}</strong><span>${n} domande</span>`;b.onclick=()=>startParagraph(p);$("paragraphList").appendChild(b)});setTimeout(()=>{$("moduleArea").scrollIntoView({behavior:"smooth",block:"start"})},80)}
$("examMode").onclick=startExam;$("chapterMode").onclick=openModules;$("reviewBtn").onclick=reviewQuestions;$("downloadBtn").onclick=downloadResults;$("reviewBack").onclick=()=>{hide("reviewPage");$("resultModal").classList.remove("hidden")};$("moduleTestBtn").onclick=()=>startModule(selectedModule);$("finishBtn").onclick=()=>{if(!$("quiz").classList.contains("hidden"))finish()};$("prevBtn").onclick=()=>{if(current>0){current--;renderNav();renderQuestion()}};$("nextBtn").onclick=()=>{if(current<quiz.length-1){current++;renderNav();renderQuestion()}else finish()};$("retryBtn").onclick=()=>{$("resultModal").classList.add("hidden");mode==="exam"?startExam():mode==="module"?startModule(selectedModule):startParagraph(selectedParagraph)};$("homeBtn").onclick=home;document.querySelector("[data-back]").onclick=home;