const input=document.getElementById("cmd");
async function send(){
 const text=input.value.trim(); if(!text)return;
 document.getElementById("result").textContent="Processing...";
 const r=await fetch("/api/command",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
 const d=await r.json();
 if(!d.ok){document.getElementById("result").textContent=d.error;return}
 document.getElementById("intent").textContent=d.intent;
 document.getElementById("conf").textContent=Math.round(d.confidence*100)+"%";
 document.getElementById("entities").textContent=JSON.stringify(d.entities);
 document.getElementById("action").textContent=d.action;
 document.getElementById("result").textContent=d.result;
}
function quick(t){input.value=t;send()}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR){
 const rec=new SR(); rec.lang="en-IN"; rec.continuous=false;
 rec.onstart=()=>{document.getElementById("voice").textContent="🎤 LISTENING..."};
 rec.onend=()=>{document.getElementById("voice").textContent="🎤 VOICE READY"};
 rec.onresult=e=>{input.value=e.results[0][0].transcript;send()};
 document.getElementById("voiceBtn").onclick=()=>rec.start();
}else document.getElementById("voiceBtn").textContent="Use Chrome for Voice";
setInterval(async()=>{
 try{const d=await (await fetch("/api/gesture-status")).json();
 document.getElementById("gesture").textContent=d.gesture||"Waiting...";
 document.getElementById("gaction").textContent=d.action||"—";
 document.getElementById("cam").textContent=d.running?"✋ CAMERA ACTIVE":"✋ CAMERA OFFLINE";
 }catch(e){}
},700);
