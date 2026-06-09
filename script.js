'use strict';
/* ════════════════════════════════════════════
   SHIKAKU — GAME LOGIC
   75 designed levels + infinite mode (deterministic)
   + difficulty modes + weekly missions
   ════════════════════════════════════════════ */

// ═══════════ CONSTANTS ═══════════
const AVATARS = ['😎','🦁','🐯','🦊','🐺','🦅','🐉','💀','🤖','👾','🌙','⚡','🔥','🌊','🎭','🏆','👑','🐲','🦂','🦈'];
const REGION_COLORS = ['#c8ff57','#57c8ff','#ff7a57','#c457ff','#ffd700','#57ffb8','#ff57a2','#576bff','#ffc857','#8cff57','#ff57e6','#57ffe6','#e657ff','#57a2ff','#ff8c57','#57ff8c'];
const DIFFICULTY = ['easy','easy','easy','easy','easy','easy','easy','easy','easy','easy','easy','easy','easy','easy','easy','easy','easy','easy','easy','easy','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','medium','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard','hard'];
const XP_PER_LEVEL = [0,100,250,450,700,1000,1350,1750,2200,2700,3250,3900,4600,5400,6300,7300,8400,9600,11000,12500,14200,16000,18000,20200];

const DIFF_MODES = {
  easy:   { id:'easy',   name:'سهل',  icon:'🟢', timeMul:1.4, coinMul:0.7, xpMul:0.7, desc:'وقت أطول • مكافأة أقل' },
  normal: { id:'normal', name:'عادي', icon:'🟡', timeMul:1.0, coinMul:1.0, xpMul:1.0, desc:'التوازن الكلاسيكي' },
  expert: { id:'expert', name:'خبير', icon:'🔴', timeMul:0.6, coinMul:1.8, xpMul:1.8, desc:'وقت أقل • مكافآت ×1.8' },
};

function getLevelReward(idx){
  const tier=Math.floor(idx/5);
  // ✅ مكافآت مُخفَّضة لخلق تحدٍّ أكبر (العملات أصبحت أندر فيزيد الاعتماد على المهارة والمتجر)
  const coins=4+tier*5+(idx%5)*1;
  const xp=12+tier*10+(idx%5)*3;
  let item=null;
  if(idx%3===1) item={icon:'💡',name:'تلميح',key:'hint'};
  else if(idx%5===4) item={icon:'🛡️',name:'حماية',key:'shield'};
  else if(idx%4===2) item={icon:'⏱️',name:'وقت إضافي',key:'extraTime'};
  const AV={4:'🦁',9:'🦊',14:'🐉',19:'⚡',24:'🐺',29:'💀',34:'🤖',39:'🌊',44:'🎭',49:'👑',54:'🐲',59:'🔥',64:'🦂',69:'🦈',74:'🏆'};
  return { coins, xp, item, avatarUnlock:AV[idx]||null };
}

// ═══════════ PUZZLES (100, all verified solvable) ═══════════
const PUZZLES = [
  { name:'البداية', rows:3, cols:3, time:60, numbers:[{r:1,c:1,val:9}] },
  { name:'أولى الخطوات', rows:3, cols:3, time:66, numbers:[{r:0,c:0,val:4},{r:0,c:2,val:3},{r:2,c:0,val:2}] },
  { name:'تسخين', rows:3, cols:3, time:66, numbers:[{r:1,c:0,val:4},{r:0,c:2,val:2},{r:2,c:1,val:3}] },
  { name:'انطلاقة', rows:4, cols:4, time:94, numbers:[{r:1,c:1,val:4},{r:1,c:3,val:4},{r:2,c:1,val:4},{r:2,c:3,val:2},{r:3,c:3,val:2}] },
  { name:'أساسيات', rows:4, cols:4, time:94, numbers:[{r:0,c:1,val:4},{r:0,c:3,val:4},{r:2,c:0,val:2},{r:3,c:1,val:4},{r:3,c:3,val:2}] },
  { name:'تمرين', rows:4, cols:4, time:94, numbers:[{r:1,c:1,val:4},{r:1,c:3,val:4},{r:2,c:0,val:3},{r:2,c:3,val:2},{r:3,c:1,val:3}] },
  { name:'تحدٍ بسيط', rows:4, cols:4, time:94, numbers:[{r:1,c:1,val:4},{r:1,c:2,val:3},{r:0,c:3,val:3},{r:2,c:1,val:4},{r:3,c:2,val:2}] },
  { name:'خطوة للأمام', rows:4, cols:4, time:94, numbers:[{r:0,c:0,val:3},{r:0,c:3,val:3},{r:1,c:2,val:4},{r:3,c:3,val:3},{r:3,c:1,val:3}] },
  { name:'إيقاع', rows:5, cols:5, time:130, numbers:[{r:0,c:1,val:4},{r:3,c:4,val:4},{r:2,c:0,val:4},{r:3,c:2,val:4},{r:3,c:3,val:3},{r:4,c:0,val:4},{r:4,c:3,val:2}] },
  { name:'تركيز', rows:5, cols:5, time:130, numbers:[{r:0,c:1,val:4},{r:2,c:2,val:3},{r:1,c:3,val:4},{r:0,c:4,val:2},{r:2,c:1,val:2},{r:3,c:4,val:3},{r:3,c:1,val:3},{r:4,c:3,val:4}] },
  { name:'عقدة صغيرة', rows:5, cols:5, time:130, numbers:[{r:0,c:1,val:4},{r:0,c:2,val:4},{r:1,c:4,val:3},{r:2,c:0,val:4},{r:3,c:1,val:4},{r:3,c:2,val:4},{r:3,c:4,val:2}] },
  { name:'منعطف', rows:5, cols:5, time:130, numbers:[{r:2,c:0,val:4},{r:0,c:3,val:4},{r:1,c:1,val:3},{r:3,c:4,val:4},{r:2,c:2,val:4},{r:3,c:3,val:3},{r:4,c:2,val:3}] },
  { name:'تفكير', rows:5, cols:5, time:130, numbers:[{r:1,c:0,val:4},{r:0,c:3,val:3},{r:1,c:3,val:4},{r:1,c:4,val:4},{r:2,c:0,val:2},{r:4,c:1,val:4},{r:4,c:3,val:4}] },
  { name:'اشتعال', rows:5, cols:5, time:130, numbers:[{r:0,c:2,val:4},{r:0,c:4,val:3},{r:1,c:0,val:3},{r:1,c:2,val:6},{r:1,c:3,val:4},{r:4,c:4,val:2},{r:4,c:2,val:3}] },
  { name:'صعود', rows:6, cols:6, time:174, numbers:[{r:2,c:0,val:4},{r:0,c:2,val:2},{r:0,c:4,val:4},{r:3,c:5,val:4},{r:1,c:1,val:3},{r:1,c:2,val:4},{r:4,c:3,val:3},{r:3,c:4,val:3},{r:4,c:1,val:4},{r:5,c:5,val:2},{r:5,c:3,val:3}] },
  { name:'تحدي العقل', rows:6, cols:6, time:174, numbers:[{r:2,c:0,val:4},{r:2,c:1,val:4},{r:2,c:2,val:4},{r:1,c:3,val:4},{r:0,c:5,val:4},{r:2,c:3,val:4},{r:5,c:0,val:4},{r:4,c:3,val:4},{r:5,c:3,val:4}] },
  { name:'مناورة', rows:6, cols:6, time:174, numbers:[{r:3,c:0,val:4},{r:0,c:2,val:3},{r:0,c:4,val:4},{r:3,c:1,val:4},{r:2,c:2,val:4},{r:2,c:4,val:4},{r:4,c:2,val:4},{r:4,c:0,val:2},{r:4,c:4,val:4},{r:5,c:1,val:3}] },
  { name:'شبكة محكمة', rows:6, cols:6, time:174, numbers:[{r:0,c:0,val:3},{r:0,c:3,val:4},{r:0,c:5,val:4},{r:1,c:2,val:4},{r:1,c:3,val:4},{r:3,c:3,val:4},{r:3,c:4,val:3},{r:4,c:2,val:4},{r:5,c:5,val:2},{r:5,c:2,val:4}] },
  { name:'إصرار', rows:6, cols:6, time:174, numbers:[{r:0,c:1,val:2},{r:1,c:2,val:4},{r:1,c:4,val:4},{r:2,c:0,val:4},{r:2,c:1,val:4},{r:2,c:3,val:3},{r:5,c:5,val:4},{r:3,c:2,val:4},{r:5,c:4,val:3},{r:5,c:1,val:4}] },
  { name:'تسارع', rows:6, cols:6, time:174, numbers:[{r:0,c:3,val:4},{r:2,c:4,val:4},{r:3,c:5,val:4},{r:2,c:1,val:4},{r:1,c:2,val:2},{r:5,c:2,val:4},{r:4,c:3,val:4},{r:3,c:1,val:4},{r:4,c:4,val:4},{r:5,c:1,val:2}] },
  { name:'احتراف مبكر', rows:6, cols:6, time:174, numbers:[{r:0,c:0,val:3},{r:0,c:3,val:4},{r:0,c:5,val:4},{r:2,c:0,val:4},{r:1,c:1,val:3},{r:1,c:2,val:3},{r:3,c:3,val:4},{r:4,c:3,val:4},{r:5,c:5,val:2},{r:5,c:1,val:3},{r:5,c:4,val:2}] },
  { name:'عقبة', rows:6, cols:6, time:174, numbers:[{r:0,c:2,val:4},{r:2,c:4,val:4},{r:2,c:5,val:4},{r:3,c:0,val:4},{r:2,c:1,val:4},{r:3,c:3,val:4},{r:3,c:1,val:4},{r:4,c:5,val:2},{r:5,c:3,val:4},{r:5,c:5,val:2}] },
  { name:'الطريق يضيق', rows:7, cols:7, time:226, numbers:[{r:3,c:0,val:4},{r:0,c:3,val:4},{r:0,c:5,val:4},{r:3,c:1,val:4},{r:4,c:2,val:4},{r:4,c:3,val:4},{r:4,c:4,val:4},{r:5,c:5,val:4},{r:4,c:6,val:4},{r:4,c:0,val:3},{r:5,c:3,val:4},{r:6,c:3,val:3},{r:6,c:4,val:3}] },
  { name:'منطق حاد', rows:7, cols:7, time:226, numbers:[{r:0,c:3,val:4},{r:1,c:5,val:4},{r:3,c:6,val:4},{r:2,c:1,val:4},{r:2,c:2,val:4},{r:3,c:3,val:3},{r:2,c:4,val:4},{r:3,c:5,val:4},{r:3,c:0,val:4},{r:3,c:1,val:4},{r:4,c:3,val:3},{r:6,c:6,val:3},{r:6,c:2,val:2},{r:6,c:5,val:2}] },
  { name:'استراتيجية', rows:7, cols:7, time:226, numbers:[{r:2,c:0,val:3},{r:0,c:4,val:4},{r:0,c:6,val:6},{r:3,c:1,val:4},{r:4,c:2,val:4},{r:2,c:3,val:4},{r:3,c:0,val:4},{r:3,c:4,val:4},{r:4,c:4,val:4},{r:4,c:5,val:3},{r:6,c:6,val:3},{r:6,c:2,val:4},{r:6,c:4,val:2}] },
  { name:'عزيمة', rows:7, cols:7, time:226, numbers:[{r:0,c:0,val:4},{r:0,c:4,val:4},{r:2,c:6,val:4},{r:2,c:2,val:4},{r:1,c:4,val:4},{r:2,c:5,val:3},{r:2,c:0,val:4},{r:3,c:1,val:4},{r:4,c:4,val:4},{r:5,c:5,val:4},{r:5,c:2,val:4},{r:5,c:4,val:2},{r:6,c:1,val:2},{r:6,c:5,val:2}] },
  { name:'اختبار', rows:7, cols:7, time:226, numbers:[{r:0,c:1,val:4},{r:2,c:2,val:3},{r:1,c:3,val:4},{r:0,c:4,val:4},{r:1,c:6,val:4},{r:3,c:1,val:4},{r:3,c:5,val:4},{r:2,c:6,val:4},{r:6,c:2,val:4},{r:4,c:1,val:6},{r:5,c:3,val:4},{r:6,c:4,val:4}] },
  { name:'تعقيد', rows:7, cols:7, time:226, numbers:[{r:0,c:2,val:4},{r:1,c:4,val:4},{r:0,c:6,val:4},{r:1,c:3,val:4},{r:4,c:0,val:4},{r:4,c:1,val:4},{r:4,c:2,val:4},{r:3,c:4,val:4},{r:4,c:5,val:4},{r:5,c:4,val:4},{r:5,c:6,val:3},{r:6,c:2,val:3},{r:6,c:5,val:3}] },
  { name:'محنة', rows:7, cols:7, time:226, numbers:[{r:0,c:0,val:4},{r:0,c:3,val:4},{r:0,c:4,val:4},{r:1,c:5,val:4},{r:0,c:6,val:2},{r:3,c:0,val:4},{r:4,c:2,val:3},{r:3,c:3,val:3},{r:3,c:6,val:4},{r:5,c:0,val:4},{r:5,c:4,val:4},{r:5,c:3,val:2},{r:6,c:3,val:4},{r:6,c:6,val:3}] },
  { name:'يقظة', rows:7, cols:7, time:226, numbers:[{r:3,c:0,val:4},{r:0,c:4,val:4},{r:0,c:6,val:4},{r:3,c:1,val:4},{r:2,c:2,val:4},{r:3,c:4,val:3},{r:3,c:6,val:4},{r:4,c:2,val:4},{r:4,c:0,val:2},{r:4,c:6,val:3},{r:5,c:2,val:3},{r:6,c:4,val:4},{r:6,c:6,val:2},{r:6,c:1,val:2},{r:6,c:3,val:2}] },
  { name:'احتدام', rows:7, cols:7, time:226, numbers:[{r:0,c:0,val:4},{r:0,c:4,val:4},{r:1,c:5,val:4},{r:2,c:1,val:4},{r:3,c:2,val:4},{r:3,c:3,val:3},{r:4,c:5,val:4},{r:4,c:6,val:4},{r:4,c:0,val:4},{r:3,c:1,val:4},{r:5,c:3,val:4},{r:5,c:2,val:2},{r:6,c:5,val:4}] },
  { name:'الأستاذ', rows:7, cols:7, time:226, numbers:[{r:0,c:1,val:4},{r:0,c:4,val:3},{r:0,c:5,val:4},{r:1,c:0,val:3},{r:3,c:3,val:4},{r:2,c:1,val:3},{r:2,c:5,val:4},{r:3,c:6,val:4},{r:4,c:0,val:4},{r:4,c:1,val:4},{r:4,c:4,val:4},{r:6,c:1,val:4},{r:5,c:3,val:2},{r:6,c:6,val:2}] },
  { name:'خبير ناشئ', rows:8, cols:8, time:286, numbers:[{r:0,c:0,val:4},{r:0,c:4,val:4},{r:0,c:6,val:4},{r:0,c:7,val:4},{r:2,c:0,val:4},{r:2,c:1,val:4},{r:2,c:2,val:5},{r:4,c:3,val:5},{r:2,c:4,val:4},{r:5,c:4,val:4},{r:7,c:6,val:4},{r:6,c:7,val:4},{r:5,c:0,val:3},{r:7,c:1,val:3},{r:6,c:3,val:4},{r:7,c:3,val:4}] },
  { name:'شطارة', rows:8, cols:8, time:286, numbers:[{r:0,c:1,val:4},{r:1,c:4,val:4},{r:1,c:7,val:4},{r:1,c:0,val:4},{r:2,c:1,val:4},{r:5,c:4,val:4},{r:3,c:5,val:3},{r:3,c:6,val:4},{r:3,c:7,val:4},{r:3,c:0,val:4},{r:3,c:1,val:4},{r:4,c:2,val:4},{r:4,c:3,val:5},{r:6,c:5,val:3},{r:7,c:4,val:2},{r:7,c:7,val:4},{r:7,c:1,val:3}] },
  { name:'تحدي الكبار', rows:8, cols:8, time:286, numbers:[{r:0,c:1,val:3},{r:0,c:3,val:4},{r:0,c:6,val:4},{r:2,c:7,val:4},{r:1,c:0,val:4},{r:4,c:2,val:4},{r:2,c:3,val:4},{r:4,c:0,val:4},{r:3,c:3,val:4},{r:3,c:5,val:4},{r:3,c:6,val:5},{r:4,c:7,val:4},{r:6,c:0,val:4},{r:7,c:2,val:3},{r:6,c:5,val:4},{r:7,c:1,val:2},{r:7,c:5,val:3}] },
  { name:'دهاء', rows:8, cols:8, time:286, numbers:[{r:0,c:2,val:4},{r:0,c:7,val:4},{r:1,c:2,val:4},{r:2,c:5,val:4},{r:1,c:6,val:4},{r:1,c:7,val:4},{r:2,c:0,val:4},{r:2,c:2,val:3},{r:4,c:2,val:4},{r:4,c:4,val:4},{r:7,c:5,val:5},{r:5,c:1,val:4},{r:6,c:6,val:4},{r:6,c:1,val:6},{r:6,c:3,val:4},{r:7,c:6,val:2}] },
  { name:'إحكام', rows:8, cols:8, time:286, numbers:[{r:2,c:0,val:4},{r:1,c:1,val:4},{r:0,c:3,val:4},{r:0,c:7,val:4},{r:2,c:3,val:3},{r:2,c:4,val:4},{r:1,c:5,val:4},{r:5,c:6,val:5},{r:3,c:1,val:3},{r:2,c:2,val:4},{r:7,c:0,val:4},{r:5,c:3,val:4},{r:4,c:7,val:4},{r:6,c:1,val:3},{r:5,c:4,val:4},{r:7,c:2,val:2},{r:7,c:6,val:2},{r:7,c:4,val:2}] },
  { name:'ضغط', rows:8, cols:8, time:286, numbers:[{r:0,c:0,val:4},{r:1,c:2,val:4},{r:0,c:3,val:4},{r:2,c:7,val:4},{r:1,c:3,val:3},{r:2,c:6,val:3},{r:2,c:4,val:5},{r:3,c:1,val:3},{r:3,c:3,val:4},{r:3,c:4,val:5},{r:3,c:5,val:3},{r:5,c:0,val:4},{r:5,c:7,val:4},{r:5,c:2,val:3},{r:7,c:3,val:3},{r:7,c:1,val:2},{r:7,c:5,val:4},{r:7,c:7,val:2}] },
  { name:'مصيدة', rows:8, cols:8, time:286, numbers:[{r:0,c:1,val:4},{r:0,c:6,val:4},{r:2,c:1,val:4},{r:1,c:4,val:4},{r:5,c:6,val:5},{r:4,c:7,val:4},{r:2,c:2,val:4},{r:4,c:3,val:3},{r:5,c:4,val:4},{r:4,c:5,val:3},{r:7,c:0,val:5},{r:6,c:1,val:5},{r:5,c:3,val:3},{r:5,c:5,val:3},{r:7,c:7,val:3},{r:6,c:2,val:2},{r:7,c:4,val:2},{r:6,c:6,val:2}] },
  { name:'تخطيط', rows:8, cols:8, time:286, numbers:[{r:1,c:1,val:4},{r:1,c:2,val:4},{r:0,c:3,val:4},{r:0,c:5,val:4},{r:4,c:7,val:5},{r:2,c:0,val:3},{r:3,c:1,val:3},{r:2,c:3,val:4},{r:3,c:3,val:4},{r:4,c:5,val:4},{r:5,c:6,val:4},{r:6,c:2,val:3},{r:6,c:0,val:4},{r:5,c:5,val:4},{r:6,c:7,val:2},{r:7,c:3,val:4},{r:7,c:5,val:4}] },
  { name:'بصيرة', rows:8, cols:8, time:286, numbers:[{r:0,c:0,val:4},{r:0,c:3,val:4},{r:0,c:5,val:2},{r:0,c:6,val:4},{r:0,c:7,val:4},{r:1,c:4,val:4},{r:2,c:1,val:4},{r:3,c:0,val:5},{r:4,c:5,val:4},{r:4,c:1,val:4},{r:4,c:3,val:3},{r:6,c:6,val:3},{r:6,c:7,val:4},{r:7,c:2,val:3},{r:5,c:3,val:4},{r:7,c:1,val:4},{r:7,c:4,val:4}] },
  { name:'محترف', rows:8, cols:8, time:286, numbers:[{r:1,c:0,val:4},{r:1,c:2,val:4},{r:0,c:3,val:4},{r:0,c:7,val:4},{r:2,c:3,val:4},{r:1,c:4,val:5},{r:2,c:5,val:5},{r:2,c:6,val:4},{r:2,c:0,val:4},{r:2,c:1,val:4},{r:4,c:2,val:4},{r:7,c:7,val:4},{r:6,c:3,val:3},{r:5,c:6,val:3},{r:7,c:1,val:4},{r:6,c:4,val:4}] },
  { name:'إتقان', rows:8, cols:8, time:286, numbers:[{r:2,c:0,val:4},{r:0,c:3,val:3},{r:2,c:4,val:4},{r:2,c:5,val:5},{r:3,c:6,val:5},{r:0,c:7,val:3},{r:1,c:1,val:4},{r:1,c:3,val:4},{r:4,c:1,val:5},{r:4,c:2,val:3},{r:4,c:7,val:4},{r:5,c:0,val:4},{r:7,c:4,val:4},{r:5,c:3,val:3},{r:6,c:5,val:4},{r:6,c:2,val:2},{r:7,c:6,val:3}] },
  { name:'براعة', rows:8, cols:8, time:286, numbers:[{r:0,c:2,val:5},{r:1,c:5,val:3},{r:3,c:6,val:4},{r:2,c:7,val:4},{r:5,c:0,val:5},{r:2,c:1,val:4},{r:1,c:2,val:4},{r:2,c:3,val:3},{r:1,c:4,val:4},{r:5,c:5,val:4},{r:4,c:3,val:4},{r:5,c:6,val:3},{r:6,c:7,val:3},{r:6,c:1,val:4},{r:5,c:4,val:3},{r:7,c:0,val:2},{r:7,c:2,val:2},{r:7,c:5,val:3}] },
  { name:'عبقرية', rows:9, cols:9, time:354, numbers:[{r:1,c:0,val:4},{r:3,c:2,val:4},{r:0,c:3,val:5},{r:0,c:5,val:3},{r:3,c:7,val:4},{r:0,c:8,val:5},{r:3,c:4,val:5},{r:1,c:5,val:4},{r:2,c:6,val:4},{r:3,c:0,val:4},{r:7,c:0,val:4},{r:4,c:1,val:4},{r:4,c:7,val:4},{r:7,c:3,val:4},{r:5,c:5,val:4},{r:6,c:6,val:4},{r:5,c:8,val:4},{r:8,c:1,val:3},{r:6,c:2,val:2},{r:7,c:4,val:3},{r:8,c:0,val:1},{r:8,c:2,val:1},{r:8,c:7,val:1}] },
  { name:'سيد الشبكة', rows:9, cols:9, time:354, numbers:[{r:0,c:2,val:4},{r:0,c:4,val:3},{r:0,c:6,val:4},{r:2,c:7,val:4},{r:2,c:8,val:5},{r:3,c:0,val:3},{r:3,c:1,val:4},{r:3,c:2,val:3},{r:1,c:3,val:4},{r:2,c:5,val:3},{r:2,c:6,val:4},{r:6,c:4,val:5},{r:5,c:0,val:5},{r:4,c:2,val:4},{r:6,c:7,val:3},{r:8,c:1,val:4},{r:8,c:3,val:4},{r:7,c:5,val:4},{r:6,c:8,val:3},{r:6,c:6,val:2},{r:7,c:7,val:1},{r:8,c:2,val:1},{r:8,c:4,val:1},{r:8,c:6,val:3}] },
  { name:'تحدي صعب', rows:9, cols:9, time:354, numbers:[{r:1,c:0,val:4},{r:0,c:3,val:3},{r:0,c:4,val:4},{r:1,c:8,val:4},{r:1,c:1,val:4},{r:3,c:5,val:4},{r:1,c:6,val:1},{r:3,c:7,val:4},{r:2,c:1,val:4},{r:2,c:3,val:4},{r:2,c:6,val:4},{r:4,c:3,val:4},{r:7,c:4,val:4},{r:7,c:8,val:4},{r:6,c:0,val:4},{r:6,c:3,val:4},{r:5,c:5,val:4},{r:8,c:7,val:4},{r:6,c:6,val:2},{r:7,c:0,val:1},{r:7,c:2,val:4},{r:7,c:3,val:2},{r:8,c:0,val:1},{r:8,c:4,val:1},{r:8,c:6,val:1},{r:8,c:8,val:1}] },
  { name:'معضلة', rows:9, cols:9, time:354, numbers:[{r:0,c:0,val:4},{r:0,c:5,val:4},{r:0,c:8,val:3},{r:2,c:0,val:4},{r:2,c:2,val:4},{r:4,c:3,val:4},{r:2,c:7,val:4},{r:4,c:8,val:4},{r:5,c:4,val:4},{r:4,c:5,val:4},{r:4,c:2,val:4},{r:6,c:6,val:5},{r:6,c:7,val:4},{r:5,c:2,val:4},{r:5,c:8,val:4},{r:6,c:0,val:3},{r:6,c:3,val:4},{r:8,c:5,val:3},{r:7,c:0,val:4},{r:7,c:2,val:2},{r:7,c:7,val:1},{r:8,c:4,val:2},{r:8,c:6,val:2}] },
  { name:'صراع', rows:9, cols:9, time:354, numbers:[{r:1,c:0,val:4},{r:0,c:1,val:2},{r:0,c:2,val:4},{r:0,c:5,val:3},{r:0,c:6,val:3},{r:2,c:7,val:4},{r:1,c:8,val:3},{r:3,c:3,val:4},{r:1,c:5,val:4},{r:3,c:1,val:4},{r:3,c:4,val:4},{r:4,c:6,val:4},{r:6,c:8,val:5},{r:4,c:0,val:3},{r:4,c:2,val:4},{r:6,c:7,val:3},{r:6,c:3,val:4},{r:8,c:5,val:4},{r:7,c:6,val:3},{r:7,c:1,val:3},{r:7,c:0,val:2},{r:7,c:4,val:1},{r:8,c:7,val:2},{r:8,c:2,val:1},{r:8,c:4,val:1},{r:8,c:6,val:1},{r:8,c:8,val:1}] },
  { name:'إرادة', rows:9, cols:9, time:354, numbers:[{r:2,c:0,val:4},{r:0,c:1,val:5},{r:1,c:2,val:4},{r:0,c:5,val:4},{r:3,c:7,val:4},{r:1,c:8,val:3},{r:2,c:4,val:4},{r:2,c:5,val:4},{r:1,c:6,val:4},{r:4,c:3,val:5},{r:5,c:4,val:4},{r:5,c:8,val:4},{r:6,c:0,val:4},{r:6,c:2,val:5},{r:6,c:7,val:3},{r:6,c:1,val:2},{r:7,c:5,val:4},{r:7,c:6,val:3},{r:7,c:1,val:2},{r:7,c:4,val:1},{r:8,c:7,val:4},{r:8,c:0,val:1},{r:8,c:4,val:2},{r:8,c:6,val:1}] },
  { name:'تفوق', rows:9, cols:9, time:354, numbers:[{r:1,c:1,val:4},{r:1,c:2,val:3},{r:1,c:4,val:4},{r:0,c:5,val:3},{r:3,c:8,val:4},{r:1,c:5,val:4},{r:5,c:7,val:5},{r:3,c:0,val:4},{r:2,c:1,val:4},{r:2,c:4,val:4},{r:5,c:2,val:4},{r:3,c:5,val:4},{r:5,c:4,val:4},{r:4,c:8,val:5},{r:7,c:5,val:3},{r:7,c:6,val:4},{r:7,c:1,val:4},{r:8,c:3,val:3},{r:8,c:4,val:3},{r:6,c:7,val:3},{r:7,c:2,val:1},{r:8,c:1,val:2},{r:8,c:2,val:1},{r:8,c:5,val:1}] },
  { name:'نخبة', rows:9, cols:9, time:354, numbers:[{r:2,c:0,val:4},{r:0,c:1,val:5},{r:1,c:7,val:4},{r:0,c:8,val:3},{r:3,c:1,val:3},{r:1,c:3,val:4},{r:3,c:2,val:4},{r:3,c:3,val:4},{r:2,c:4,val:3},{r:2,c:5,val:4},{r:6,c:6,val:5},{r:3,c:7,val:5},{r:3,c:8,val:4},{r:6,c:0,val:3},{r:6,c:1,val:4},{r:6,c:4,val:4},{r:6,c:3,val:4},{r:8,c:5,val:3},{r:7,c:0,val:1},{r:8,c:6,val:4},{r:7,c:8,val:1},{r:8,c:2,val:3},{r:8,c:3,val:1},{r:8,c:8,val:1}] },
  { name:'جبروت', rows:9, cols:9, time:354, numbers:[{r:0,c:0,val:4},{r:0,c:3,val:4},{r:1,c:6,val:4},{r:0,c:7,val:2},{r:4,c:1,val:4},{r:2,c:2,val:4},{r:3,c:4,val:4},{r:2,c:7,val:5},{r:5,c:8,val:5},{r:4,c:5,val:4},{r:2,c:6,val:2},{r:7,c:2,val:5},{r:6,c:3,val:4},{r:7,c:0,val:4},{r:4,c:6,val:3},{r:6,c:1,val:4},{r:7,c:4,val:3},{r:7,c:5,val:2},{r:7,c:7,val:4},{r:8,c:3,val:2},{r:8,c:6,val:2},{r:8,c:0,val:1},{r:8,c:2,val:1},{r:8,c:4,val:1},{r:8,c:5,val:1},{r:8,c:7,val:2}] },
  { name:'ذروة', rows:9, cols:9, time:354, numbers:[{r:2,c:0,val:5},{r:2,c:1,val:4},{r:0,c:2,val:5},{r:1,c:7,val:4},{r:2,c:2,val:4},{r:2,c:5,val:4},{r:2,c:6,val:4},{r:5,c:7,val:5},{r:4,c:8,val:3},{r:3,c:3,val:4},{r:4,c:1,val:4},{r:7,c:2,val:5},{r:4,c:3,val:4},{r:5,c:4,val:5},{r:5,c:5,val:3},{r:8,c:0,val:4},{r:7,c:6,val:4},{r:8,c:8,val:4},{r:7,c:5,val:1},{r:7,c:7,val:2},{r:8,c:1,val:1},{r:8,c:3,val:1},{r:8,c:5,val:1}] },
  { name:'استعراض', rows:9, cols:9, time:354, numbers:[{r:0,c:4,val:5},{r:3,c:5,val:5},{r:0,c:6,val:4},{r:0,c:8,val:4},{r:1,c:0,val:4},{r:4,c:2,val:4},{r:1,c:3,val:3},{r:2,c:4,val:4},{r:2,c:7,val:4},{r:2,c:8,val:4},{r:4,c:0,val:4},{r:4,c:1,val:4},{r:4,c:3,val:5},{r:5,c:6,val:5},{r:8,c:2,val:4},{r:7,c:4,val:4},{r:5,c:5,val:3},{r:6,c:7,val:4},{r:8,c:1,val:4},{r:8,c:5,val:1},{r:8,c:7,val:1},{r:8,c:8,val:1}] },
  { name:'أسطوري', rows:9, cols:9, time:354, numbers:[{r:0,c:0,val:4},{r:0,c:1,val:4},{r:1,c:2,val:4},{r:0,c:3,val:4},{r:0,c:8,val:4},{r:1,c:6,val:4},{r:2,c:7,val:3},{r:1,c:8,val:4},{r:2,c:3,val:5},{r:3,c:4,val:2},{r:3,c:6,val:4},{r:4,c:0,val:3},{r:4,c:2,val:4},{r:6,c:4,val:5},{r:4,c:7,val:4},{r:5,c:6,val:4},{r:7,c:8,val:4},{r:6,c:2,val:4},{r:7,c:0,val:1},{r:8,c:3,val:2},{r:8,c:6,val:4},{r:8,c:2,val:3},{r:8,c:7,val:1}] },
  { name:'لا يُقهر', rows:10, cols:10, time:430, numbers:[{r:0,c:0,val:3},{r:0,c:3,val:4},{r:1,c:5,val:4},{r:0,c:6,val:4},{r:0,c:9,val:4},{r:2,c:1,val:4},{r:2,c:2,val:4},{r:3,c:4,val:4},{r:2,c:7,val:4},{r:2,c:9,val:4},{r:6,c:0,val:4},{r:5,c:1,val:5},{r:6,c:5,val:4},{r:6,c:6,val:4},{r:5,c:7,val:4},{r:3,c:8,val:4},{r:6,c:3,val:4},{r:6,c:2,val:4},{r:7,c:4,val:4},{r:6,c:9,val:4},{r:7,c:0,val:1},{r:7,c:8,val:4},{r:8,c:0,val:2},{r:8,c:3,val:1},{r:8,c:5,val:4},{r:9,c:1,val:4},{r:9,c:8,val:4}] },
  { name:'تحفة', rows:10, cols:10, time:430, numbers:[{r:1,c:0,val:4},{r:0,c:3,val:4},{r:0,c:5,val:3},{r:3,c:6,val:4},{r:3,c:7,val:5},{r:1,c:8,val:4},{r:2,c:1,val:4},{r:1,c:2,val:4},{r:1,c:4,val:3},{r:3,c:8,val:5},{r:3,c:9,val:4},{r:5,c:2,val:4},{r:5,c:3,val:4},{r:5,c:5,val:4},{r:8,c:0,val:5},{r:4,c:4,val:4},{r:6,c:6,val:4},{r:5,c:1,val:4},{r:5,c:7,val:4},{r:8,c:9,val:4},{r:7,c:2,val:4},{r:9,c:5,val:3},{r:9,c:8,val:3},{r:9,c:4,val:2},{r:9,c:6,val:2},{r:9,c:0,val:4},{r:9,c:7,val:1}] },
  { name:'هيمنة', rows:10, cols:10, time:430, numbers:[{r:0,c:0,val:4},{r:0,c:2,val:4},{r:1,c:5,val:5},{r:1,c:7,val:4},{r:0,c:8,val:4},{r:3,c:1,val:4},{r:1,c:2,val:3},{r:4,c:3,val:4},{r:1,c:4,val:3},{r:2,c:7,val:4},{r:3,c:6,val:4},{r:4,c:0,val:4},{r:8,c:2,val:5},{r:5,c:4,val:3},{r:4,c:6,val:4},{r:8,c:1,val:4},{r:5,c:3,val:4},{r:7,c:5,val:4},{r:5,c:6,val:4},{r:6,c:8,val:4},{r:7,c:4,val:3},{r:7,c:6,val:3},{r:9,c:9,val:3},{r:8,c:0,val:1},{r:8,c:7,val:4},{r:8,c:8,val:1},{r:9,c:1,val:3},{r:9,c:3,val:1},{r:9,c:5,val:1},{r:9,c:8,val:1}] },
  { name:'سطوة', rows:10, cols:10, time:430, numbers:[{r:1,c:0,val:5},{r:0,c:2,val:3},{r:0,c:4,val:3},{r:0,c:6,val:4},{r:0,c:8,val:4},{r:3,c:9,val:4},{r:2,c:2,val:4},{r:3,c:3,val:4},{r:2,c:8,val:4},{r:3,c:1,val:4},{r:3,c:6,val:3},{r:4,c:7,val:4},{r:4,c:5,val:4},{r:6,c:6,val:4},{r:4,c:9,val:4},{r:6,c:0,val:4},{r:8,c:2,val:4},{r:8,c:3,val:4},{r:5,c:8,val:4},{r:8,c:4,val:4},{r:8,c:5,val:4},{r:7,c:0,val:2},{r:9,c:1,val:3},{r:7,c:7,val:3},{r:9,c:8,val:3},{r:9,c:6,val:2},{r:8,c:9,val:2},{r:9,c:0,val:1},{r:9,c:2,val:1},{r:9,c:3,val:1}] },
  { name:'عملاق', rows:10, cols:10, time:430, numbers:[{r:0,c:0,val:4},{r:1,c:4,val:4},{r:0,c:6,val:4},{r:1,c:9,val:6},{r:1,c:0,val:3},{r:1,c:1,val:4},{r:5,c:2,val:5},{r:4,c:3,val:4},{r:1,c:6,val:4},{r:3,c:5,val:5},{r:4,c:6,val:3},{r:2,c:7,val:4},{r:6,c:8,val:5},{r:5,c:0,val:4},{r:6,c:4,val:4},{r:5,c:1,val:4},{r:5,c:3,val:4},{r:8,c:6,val:5},{r:8,c:2,val:3},{r:7,c:7,val:4},{r:8,c:9,val:3},{r:8,c:5,val:3},{r:7,c:8,val:3},{r:9,c:0,val:2},{r:8,c:4,val:1},{r:9,c:1,val:4},{r:9,c:9,val:1}] },
  { name:'بطل', rows:10, cols:10, time:430, numbers:[{r:0,c:0,val:4},{r:0,c:1,val:3},{r:1,c:4,val:4},{r:0,c:8,val:4},{r:1,c:9,val:4},{r:1,c:1,val:5},{r:1,c:3,val:4},{r:1,c:7,val:4},{r:2,c:7,val:3},{r:5,c:8,val:5},{r:3,c:3,val:4},{r:3,c:6,val:4},{r:5,c:7,val:4},{r:5,c:0,val:5},{r:5,c:4,val:4},{r:4,c:9,val:4},{r:8,c:2,val:4},{r:7,c:3,val:4},{r:6,c:5,val:4},{r:6,c:6,val:4},{r:8,c:1,val:4},{r:8,c:7,val:4},{r:8,c:4,val:1},{r:9,c:9,val:2},{r:9,c:0,val:1},{r:9,c:4,val:4},{r:9,c:7,val:3}] },
  { name:'صانع المعجزات', rows:10, cols:10, time:430, numbers:[{r:0,c:0,val:4},{r:0,c:6,val:5},{r:0,c:7,val:4},{r:0,c:9,val:4},{r:2,c:3,val:4},{r:1,c:5,val:4},{r:2,c:6,val:4},{r:2,c:0,val:4},{r:2,c:1,val:3},{r:2,c:8,val:4},{r:3,c:9,val:4},{r:5,c:2,val:4},{r:3,c:3,val:3},{r:7,c:3,val:4},{r:5,c:5,val:4},{r:5,c:7,val:4},{r:6,c:1,val:4},{r:8,c:6,val:4},{r:6,c:0,val:4},{r:9,c:4,val:4},{r:8,c:5,val:3},{r:7,c:9,val:4},{r:9,c:2,val:3},{r:8,c:3,val:1},{r:8,c:9,val:3},{r:9,c:1,val:1},{r:9,c:3,val:1},{r:9,c:6,val:3},{r:9,c:8,val:2}] },
  { name:'خارق', rows:10, cols:10, time:430, numbers:[{r:0,c:2,val:4},{r:1,c:4,val:4},{r:0,c:5,val:4},{r:2,c:6,val:5},{r:2,c:7,val:4},{r:0,c:8,val:5},{r:1,c:9,val:6},{r:1,c:3,val:4},{r:3,c:0,val:4},{r:2,c:3,val:4},{r:6,c:0,val:4},{r:7,c:1,val:4},{r:4,c:2,val:4},{r:5,c:3,val:4},{r:5,c:5,val:5},{r:5,c:7,val:4},{r:5,c:6,val:5},{r:6,c:8,val:3},{r:6,c:3,val:4},{r:9,c:4,val:4},{r:9,c:9,val:4},{r:8,c:1,val:4},{r:9,c:2,val:2},{r:9,c:7,val:4},{r:9,c:5,val:1}] },
  { name:'جبار', rows:10, cols:10, time:430, numbers:[{r:0,c:0,val:4},{r:0,c:2,val:4},{r:3,c:4,val:4},{r:3,c:5,val:4},{r:2,c:6,val:4},{r:0,c:7,val:4},{r:0,c:9,val:3},{r:2,c:0,val:4},{r:2,c:7,val:4},{r:4,c:8,val:5},{r:4,c:0,val:4},{r:4,c:1,val:4},{r:3,c:3,val:4},{r:5,c:9,val:5},{r:5,c:4,val:4},{r:4,c:6,val:3},{r:7,c:1,val:3},{r:8,c:2,val:4},{r:9,c:4,val:4},{r:8,c:5,val:4},{r:9,c:7,val:4},{r:9,c:0,val:3},{r:9,c:3,val:3},{r:7,c:6,val:1},{r:7,c:8,val:1},{r:9,c:1,val:2},{r:9,c:6,val:2},{r:9,c:9,val:4},{r:9,c:2,val:1}] },
  { name:'طوفان', rows:10, cols:10, time:430, numbers:[{r:1,c:1,val:4},{r:0,c:2,val:4},{r:0,c:3,val:4},{r:0,c:7,val:6},{r:1,c:8,val:3},{r:4,c:9,val:5},{r:3,c:3,val:4},{r:2,c:4,val:5},{r:2,c:5,val:4},{r:2,c:6,val:5},{r:3,c:0,val:4},{r:2,c:1,val:5},{r:4,c:8,val:4},{r:6,c:2,val:4},{r:7,c:3,val:4},{r:7,c:5,val:5},{r:8,c:9,val:4},{r:6,c:0,val:3},{r:7,c:4,val:4},{r:8,c:6,val:4},{r:8,c:7,val:3},{r:7,c:1,val:1},{r:8,c:8,val:2},{r:9,c:2,val:4},{r:9,c:0,val:1},{r:9,c:3,val:1},{r:9,c:9,val:3}] },
  { name:'إعصار', rows:10, cols:10, time:430, numbers:[{r:0,c:0,val:5},{r:1,c:6,val:4},{r:0,c:7,val:4},{r:1,c:8,val:4},{r:1,c:9,val:5},{r:2,c:0,val:4},{r:2,c:2,val:4},{r:4,c:4,val:4},{r:2,c:5,val:4},{r:2,c:6,val:5},{r:3,c:1,val:3},{r:6,c:3,val:4},{r:4,c:0,val:3},{r:4,c:7,val:2},{r:8,c:8,val:5},{r:5,c:0,val:4},{r:9,c:2,val:5},{r:5,c:4,val:4},{r:8,c:9,val:4},{r:7,c:5,val:3},{r:9,c:7,val:4},{r:9,c:0,val:3},{r:7,c:1,val:1},{r:9,c:3,val:3},{r:7,c:6,val:3},{r:8,c:1,val:2},{r:9,c:4,val:1},{r:9,c:5,val:1},{r:9,c:8,val:2}] },
  { name:'قمة', rows:10, cols:10, time:430, numbers:[{r:0,c:0,val:4},{r:0,c:5,val:4},{r:0,c:6,val:4},{r:4,c:0,val:5},{r:3,c:1,val:3},{r:1,c:2,val:3},{r:3,c:3,val:4},{r:2,c:7,val:6},{r:4,c:9,val:4},{r:6,c:4,val:5},{r:2,c:5,val:4},{r:3,c:7,val:4},{r:6,c:8,val:4},{r:6,c:1,val:5},{r:4,c:2,val:4},{r:8,c:3,val:5},{r:6,c:6,val:4},{r:7,c:7,val:3},{r:8,c:9,val:4},{r:7,c:0,val:3},{r:8,c:5,val:3},{r:9,c:4,val:3},{r:7,c:8,val:1},{r:9,c:2,val:2},{r:9,c:8,val:4},{r:9,c:0,val:2},{r:9,c:5,val:1},{r:9,c:6,val:1},{r:9,c:9,val:1}] },
  { name:'تتويج', rows:11, cols:11, time:514, numbers:[{r:0,c:0,val:4},{r:0,c:4,val:4},{r:0,c:6,val:4},{r:0,c:7,val:4},{r:3,c:8,val:4},{r:1,c:10,val:4},{r:1,c:1,val:4},{r:1,c:2,val:4},{r:1,c:3,val:5},{r:2,c:5,val:6},{r:4,c:6,val:3},{r:5,c:9,val:4},{r:4,c:10,val:4},{r:6,c:0,val:4},{r:6,c:1,val:4},{r:7,c:4,val:4},{r:5,c:8,val:4},{r:6,c:2,val:2},{r:7,c:6,val:4},{r:9,c:3,val:4},{r:6,c:8,val:4},{r:8,c:0,val:4},{r:7,c:2,val:3},{r:7,c:10,val:4},{r:8,c:4,val:4},{r:8,c:9,val:4},{r:10,c:0,val:4},{r:10,c:7,val:4},{r:10,c:8,val:4},{r:9,c:10,val:1},{r:10,c:4,val:4},{r:10,c:10,val:1}] },
  { name:'ملحمة', rows:11, cols:11, time:514, numbers:[{r:0,c:0,val:4},{r:0,c:1,val:4},{r:0,c:5,val:4},{r:0,c:7,val:4},{r:0,c:8,val:4},{r:1,c:10,val:3},{r:4,c:1,val:4},{r:1,c:2,val:6},{r:2,c:4,val:6},{r:4,c:6,val:5},{r:2,c:8,val:4},{r:4,c:9,val:5},{r:5,c:10,val:3},{r:4,c:0,val:3},{r:5,c:2,val:4},{r:5,c:5,val:4},{r:4,c:7,val:5},{r:6,c:8,val:4},{r:9,c:1,val:5},{r:6,c:3,val:4},{r:9,c:10,val:4},{r:9,c:0,val:4},{r:7,c:4,val:4},{r:7,c:6,val:4},{r:9,c:9,val:4},{r:8,c:3,val:6},{r:10,c:5,val:3},{r:10,c:8,val:3},{r:9,c:7,val:1},{r:10,c:1,val:1},{r:10,c:7,val:1},{r:10,c:10,val:1}] },
  { name:'وحش الأرقام', rows:11, cols:11, time:514, numbers:[{r:0,c:1,val:4},{r:1,c:2,val:4},{r:0,c:4,val:4},{r:0,c:9,val:5},{r:1,c:10,val:4},{r:1,c:6,val:4},{r:1,c:9,val:6},{r:2,c:0,val:6},{r:2,c:3,val:5},{r:2,c:5,val:4},{r:3,c:5,val:4},{r:4,c:0,val:4},{r:7,c:2,val:4},{r:4,c:6,val:4},{r:6,c:8,val:4},{r:6,c:10,val:3},{r:7,c:4,val:4},{r:6,c:5,val:4},{r:7,c:6,val:4},{r:5,c:7,val:4},{r:6,c:0,val:4},{r:9,c:3,val:4},{r:10,c:9,val:4},{r:8,c:10,val:2},{r:8,c:1,val:3},{r:10,c:8,val:3},{r:10,c:1,val:4},{r:10,c:2,val:2},{r:9,c:6,val:4},{r:9,c:10,val:1},{r:10,c:4,val:4},{r:10,c:10,val:1}] },
  { name:'الكابوس', rows:11, cols:11, time:514, numbers:[{r:0,c:0,val:4},{r:0,c:5,val:4},{r:3,c:8,val:5},{r:1,c:9,val:5},{r:1,c:10,val:2},{r:2,c:0,val:4},{r:1,c:3,val:3},{r:2,c:6,val:4},{r:6,c:7,val:6},{r:2,c:3,val:4},{r:4,c:4,val:4},{r:4,c:10,val:4},{r:4,c:0,val:4},{r:3,c:5,val:4},{r:8,c:2,val:5},{r:4,c:3,val:4},{r:6,c:0,val:4},{r:5,c:5,val:4},{r:8,c:8,val:4},{r:5,c:9,val:4},{r:7,c:4,val:4},{r:9,c:10,val:4},{r:7,c:0,val:4},{r:8,c:1,val:4},{r:7,c:6,val:4},{r:9,c:7,val:4},{r:10,c:3,val:3},{r:9,c:2,val:1},{r:9,c:6,val:4},{r:9,c:8,val:4},{r:10,c:2,val:1},{r:10,c:4,val:1},{r:10,c:10,val:1}] },
  { name:'نهائي', rows:11, cols:11, time:514, numbers:[{r:0,c:0,val:5},{r:0,c:5,val:4},{r:0,c:9,val:5},{r:1,c:0,val:4},{r:1,c:4,val:4},{r:4,c:6,val:4},{r:1,c:10,val:4},{r:2,c:1,val:2},{r:2,c:2,val:4},{r:2,c:3,val:4},{r:2,c:7,val:4},{r:3,c:8,val:4},{r:5,c:10,val:4},{r:3,c:0,val:4},{r:7,c:1,val:5},{r:5,c:5,val:5},{r:7,c:8,val:4},{r:8,c:9,val:5},{r:5,c:4,val:5},{r:8,c:6,val:4},{r:7,c:3,val:4},{r:7,c:7,val:5},{r:7,c:10,val:4},{r:7,c:0,val:4},{r:9,c:1,val:3},{r:9,c:3,val:4},{r:10,c:8,val:3},{r:10,c:6,val:4},{r:9,c:9,val:2},{r:10,c:4,val:3},{r:10,c:10,val:1}] },
  { name:'الأسطورة', rows:11, cols:11, time:514, numbers:[{r:0,c:1,val:5},{r:0,c:6,val:4},{r:1,c:9,val:4},{r:4,c:10,val:5},{r:1,c:3,val:4},{r:1,c:5,val:4},{r:4,c:6,val:4},{r:3,c:7,val:4},{r:3,c:8,val:3},{r:5,c:0,val:4},{r:2,c:1,val:4},{r:2,c:3,val:4},{r:3,c:5,val:4},{r:8,c:1,val:5},{r:4,c:2,val:4},{r:4,c:8,val:5},{r:4,c:9,val:3},{r:5,c:6,val:4},{r:8,c:10,val:5},{r:6,c:0,val:5},{r:8,c:3,val:6},{r:7,c:5,val:4},{r:7,c:6,val:4},{r:9,c:9,val:4},{r:10,c:2,val:3},{r:10,c:6,val:3},{r:10,c:7,val:3},{r:9,c:1,val:2},{r:9,c:3,val:2},{r:10,c:4,val:2},{r:9,c:8,val:2},{r:10,c:5,val:1},{r:10,c:10,val:1}] },
  { name:'الخاتمة الكبرى', rows:11, cols:11, time:514, numbers:[{r:0,c:1,val:2},{r:0,c:2,val:4},{r:3,c:3,val:4},{r:3,c:4,val:5},{r:0,c:8,val:4},{r:0,c:10,val:4},{r:2,c:0,val:4},{r:3,c:5,val:4},{r:1,c:7,val:4},{r:1,c:8,val:5},{r:3,c:9,val:4},{r:3,c:10,val:3},{r:5,c:0,val:4},{r:3,c:1,val:4},{r:4,c:6,val:3},{r:3,c:7,val:4},{r:4,c:2,val:4},{r:6,c:4,val:4},{r:6,c:10,val:3},{r:6,c:2,val:4},{r:8,c:6,val:4},{r:9,c:8,val:4},{r:10,c:9,val:5},{r:10,c:0,val:4},{r:10,c:1,val:4},{r:8,c:4,val:4},{r:8,c:5,val:4},{r:9,c:7,val:4},{r:8,c:2,val:4},{r:9,c:10,val:3},{r:10,c:2,val:1},{r:10,c:3,val:1},{r:10,c:6,val:1},{r:10,c:8,val:1}] },
  // ═══════════ المراحل الجديدة 76→100 (مُولّدة برمجياً ومتحقَّقة: تغطية كاملة بلا تداخل) ═══════════
  { name:'هاوية', rows:11, cols:11, time:524, numbers:[{r:0,c:0,val:4},{r:0,c:3,val:4},{r:1,c:5,val:4},{r:0,c:7,val:4},{r:1,c:10,val:3},{r:1,c:6,val:4},{r:2,c:7,val:3},{r:1,c:8,val:4},{r:3,c:0,val:4},{r:2,c:1,val:4},{r:4,c:3,val:4},{r:3,c:4,val:4},{r:5,c:5,val:4},{r:3,c:9,val:4},{r:4,c:10,val:4},{r:4,c:1,val:4},{r:4,c:7,val:4},{r:6,c:6,val:4},{r:6,c:8,val:4},{r:6,c:0,val:4},{r:6,c:5,val:4},{r:10,c:2,val:4},{r:8,c:4,val:4},{r:9,c:5,val:4},{r:10,c:8,val:4},{r:8,c:9,val:4},{r:9,c:0,val:4},{r:9,c:7,val:3},{r:9,c:3,val:4},{r:9,c:6,val:2},{r:10,c:9,val:4},{r:10,c:1,val:2}], _solution:[{r1:0,c1:0,r2:1,c2:1,ni:0},{r1:0,c1:2,r2:1,c2:3,ni:1},{r1:0,c1:4,r2:1,c2:5,ni:2},{r1:0,c1:6,r2:0,c2:9,ni:3},{r1:0,c1:10,r2:2,c2:10,ni:4},{r1:1,c1:6,r2:4,c2:6,ni:5},{r1:1,c1:7,r2:3,c2:7,ni:6},{r1:1,c1:8,r2:2,c2:9,ni:7},{r1:2,c1:0,r2:5,c2:0,ni:8},{r1:2,c1:1,r2:3,c2:2,ni:9},{r1:2,c1:3,r2:5,c2:3,ni:10},{r1:2,c1:4,r2:5,c2:4,ni:11},{r1:2,c1:5,r2:5,c2:5,ni:12},{r1:3,c1:8,r2:4,c2:9,ni:13},{r1:3,c1:10,r2:6,c2:10,ni:14},{r1:4,c1:1,r2:5,c2:2,ni:15},{r1:4,c1:7,r2:7,c2:7,ni:16},{r1:5,c1:6,r2:8,c2:6,ni:17},{r1:5,c1:8,r2:6,c2:9,ni:18},{r1:6,c1:0,r2:7,c2:1,ni:19},{r1:6,c1:2,r2:6,c2:5,ni:20},{r1:7,c1:2,r2:10,c2:2,ni:21},{r1:7,c1:3,r2:8,c2:4,ni:22},{r1:7,c1:5,r2:10,c2:5,ni:23},{r1:7,c1:8,r2:10,c2:8,ni:24},{r1:7,c1:9,r2:8,c2:10,ni:25},{r1:8,c1:0,r2:9,c2:1,ni:26},{r1:8,c1:7,r2:10,c2:7,ni:27},{r1:9,c1:3,r2:10,c2:4,ni:28},{r1:9,c1:6,r2:10,c2:6,ni:29},{r1:9,c1:9,r2:10,c2:10,ni:30},{r1:10,c1:0,r2:10,c2:1,ni:31}] },
  { name:'سديم', rows:11, cols:11, time:524, numbers:[{r:0,c:0,val:4},{r:0,c:2,val:4},{r:0,c:7,val:4},{r:0,c:8,val:3},{r:1,c:4,val:4},{r:1,c:5,val:4},{r:2,c:7,val:4},{r:3,c:8,val:4},{r:2,c:9,val:3},{r:3,c:10,val:3},{r:2,c:2,val:4},{r:5,c:0,val:4},{r:3,c:3,val:3},{r:4,c:5,val:4},{r:4,c:6,val:3},{r:4,c:1,val:4},{r:7,c:2,val:4},{r:6,c:3,val:4},{r:5,c:9,val:3},{r:5,c:10,val:4},{r:7,c:4,val:4},{r:6,c:7,val:4},{r:9,c:6,val:4},{r:9,c:0,val:3},{r:10,c:5,val:4},{r:7,c:7,val:4},{r:7,c:9,val:4},{r:9,c:1,val:3},{r:9,c:2,val:4},{r:8,c:10,val:2},{r:10,c:4,val:2},{r:9,c:8,val:4},{r:10,c:0,val:1},{r:10,c:3,val:2},{r:10,c:6,val:1},{r:10,c:10,val:1}], _solution:[{r1:0,c1:0,r2:1,c2:1,ni:0},{r1:0,c1:2,r2:1,c2:3,ni:1},{r1:0,c1:4,r2:0,c2:7,ni:2},{r1:0,c1:8,r2:0,c2:10,ni:3},{r1:1,c1:4,r2:4,c2:4,ni:4},{r1:1,c1:5,r2:2,c2:6,ni:5},{r1:1,c1:7,r2:4,c2:7,ni:6},{r1:1,c1:8,r2:4,c2:8,ni:7},{r1:1,c1:9,r2:3,c2:9,ni:8},{r1:1,c1:10,r2:3,c2:10,ni:9},{r1:2,c1:0,r2:2,c2:3,ni:10},{r1:3,c1:0,r2:6,c2:0,ni:11},{r1:3,c1:1,r2:3,c2:3,ni:12},{r1:3,c1:5,r2:6,c2:5,ni:13},{r1:3,c1:6,r2:5,c2:6,ni:14},{r1:4,c1:1,r2:7,c2:1,ni:15},{r1:4,c1:2,r2:7,c2:2,ni:16},{r1:4,c1:3,r2:7,c2:3,ni:17},{r1:4,c1:9,r2:6,c2:9,ni:18},{r1:4,c1:10,r2:7,c2:10,ni:19},{r1:5,c1:4,r2:8,c2:4,ni:20},{r1:5,c1:7,r2:6,c2:8,ni:21},{r1:6,c1:6,r2:9,c2:6,ni:22},{r1:7,c1:0,r2:9,c2:0,ni:23},{r1:7,c1:5,r2:10,c2:5,ni:24},{r1:7,c1:7,r2:8,c2:8,ni:25},{r1:7,c1:9,r2:10,c2:9,ni:26},{r1:8,c1:1,r2:10,c2:1,ni:27},{r1:8,c1:2,r2:9,c2:3,ni:28},{r1:8,c1:10,r2:9,c2:10,ni:29},{r1:9,c1:4,r2:10,c2:4,ni:30},{r1:9,c1:7,r2:10,c2:8,ni:31},{r1:10,c1:0,r2:10,c2:0,ni:32},{r1:10,c1:2,r2:10,c2:3,ni:33},{r1:10,c1:6,r2:10,c2:6,ni:34},{r1:10,c1:10,r2:10,c2:10,ni:35}] },
  { name:'المتاهة', rows:11, cols:11, time:524, numbers:[{r:0,c:0,val:4},{r:0,c:4,val:4},{r:0,c:6,val:4},{r:1,c:7,val:4},{r:0,c:9,val:4},{r:0,c:10,val:3},{r:1,c:1,val:4},{r:1,c:2,val:4},{r:4,c:3,val:4},{r:3,c:4,val:4},{r:3,c:5,val:4},{r:3,c:8,val:4},{r:4,c:9,val:3},{r:4,c:1,val:4},{r:6,c:10,val:4},{r:5,c:6,val:4},{r:7,c:7,val:4},{r:5,c:2,val:4},{r:5,c:9,val:3},{r:6,c:3,val:4},{r:6,c:5,val:4},{r:9,c:8,val:4},{r:7,c:3,val:4},{r:9,c:10,val:4},{r:8,c:1,val:4},{r:8,c:5,val:6},{r:9,c:7,val:3},{r:10,c:9,val:3},{r:9,c:1,val:4},{r:10,c:0,val:2},{r:10,c:2,val:4},{r:10,c:6,val:1},{r:10,c:8,val:1}], _solution:[{r1:0,c1:0,r2:0,c2:3,ni:0},{r1:0,c1:4,r2:1,c2:5,ni:1},{r1:0,c1:6,r2:3,c2:6,ni:2},{r1:0,c1:7,r2:3,c2:7,ni:3},{r1:0,c1:8,r2:1,c2:9,ni:4},{r1:0,c1:10,r2:2,c2:10,ni:5},{r1:1,c1:0,r2:2,c2:1,ni:6},{r1:1,c1:2,r2:4,c2:2,ni:7},{r1:1,c1:3,r2:4,c2:3,ni:8},{r1:2,c1:4,r2:5,c2:4,ni:9},{r1:2,c1:5,r2:5,c2:5,ni:10},{r1:2,c1:8,r2:5,c2:8,ni:11},{r1:2,c1:9,r2:4,c2:9,ni:12},{r1:3,c1:0,r2:4,c2:1,ni:13},{r1:3,c1:10,r2:6,c2:10,ni:14},{r1:4,c1:6,r2:7,c2:6,ni:15},{r1:4,c1:7,r2:7,c2:7,ni:16},{r1:5,c1:0,r2:5,c2:3,ni:17},{r1:5,c1:9,r2:7,c2:9,ni:18},{r1:6,c1:0,r2:6,c2:3,ni:19},{r1:6,c1:4,r2:7,c2:5,ni:20},{r1:6,c1:8,r2:9,c2:8,ni:21},{r1:7,c1:0,r2:7,c2:3,ni:22},{r1:7,c1:10,r2:10,c2:10,ni:23},{r1:8,c1:0,r2:8,c2:3,ni:24},{r1:8,c1:4,r2:9,c2:6,ni:25},{r1:8,c1:7,r2:10,c2:7,ni:26},{r1:8,c1:9,r2:10,c2:9,ni:27},{r1:9,c1:0,r2:9,c2:3,ni:28},{r1:10,c1:0,r2:10,c2:1,ni:29},{r1:10,c1:2,r2:10,c2:5,ni:30},{r1:10,c1:6,r2:10,c2:6,ni:31},{r1:10,c1:8,r2:10,c2:8,ni:32}] },
  { name:'برج', rows:11, cols:11, time:524, numbers:[{r:1,c:0,val:4},{r:0,c:4,val:4},{r:2,c:6,val:4},{r:1,c:8,val:4},{r:3,c:9,val:4},{r:2,c:10,val:4},{r:2,c:2,val:4},{r:4,c:4,val:4},{r:1,c:5,val:4},{r:5,c:0,val:4},{r:5,c:1,val:4},{r:3,c:8,val:4},{r:5,c:2,val:4},{r:3,c:3,val:4},{r:4,c:6,val:4},{r:4,c:10,val:4},{r:5,c:4,val:4},{r:6,c:8,val:4},{r:6,c:1,val:4},{r:8,c:4,val:4},{r:6,c:6,val:4},{r:9,c:7,val:4},{r:7,c:2,val:4},{r:9,c:3,val:4},{r:10,c:8,val:4},{r:7,c:9,val:3},{r:8,c:0,val:3},{r:8,c:1,val:1},{r:9,c:6,val:4},{r:9,c:10,val:3},{r:10,c:1,val:2},{r:10,c:7,val:4},{r:10,c:9,val:1}], _solution:[{r1:0,c1:0,r2:1,c2:1,ni:0},{r1:0,c1:2,r2:0,c2:5,ni:1},{r1:0,c1:6,r2:3,c2:6,ni:2},{r1:0,c1:7,r2:1,c2:8,ni:3},{r1:0,c1:9,r2:3,c2:9,ni:4},{r1:0,c1:10,r2:3,c2:10,ni:5},{r1:1,c1:2,r2:2,c2:3,ni:6},{r1:1,c1:4,r2:4,c2:4,ni:7},{r1:1,c1:5,r2:4,c2:5,ni:8},{r1:2,c1:0,r2:5,c2:0,ni:9},{r1:2,c1:1,r2:5,c2:1,ni:10},{r1:2,c1:7,r2:3,c2:8,ni:11},{r1:3,c1:2,r2:6,c2:2,ni:12},{r1:3,c1:3,r2:6,c2:3,ni:13},{r1:4,c1:6,r2:4,c2:9,ni:14},{r1:4,c1:10,r2:7,c2:10,ni:15},{r1:5,c1:4,r2:5,c2:7,ni:16},{r1:5,c1:8,r2:6,c2:9,ni:17},{r1:6,c1:0,r2:7,c2:1,ni:18},{r1:6,c1:4,r2:9,c2:4,ni:19},{r1:6,c1:5,r2:7,c2:6,ni:20},{r1:6,c1:7,r2:9,c2:7,ni:21},{r1:7,c1:2,r2:10,c2:2,ni:22},{r1:7,c1:3,r2:10,c2:3,ni:23},{r1:7,c1:8,r2:10,c2:8,ni:24},{r1:7,c1:9,r2:9,c2:9,ni:25},{r1:8,c1:0,r2:10,c2:0,ni:26},{r1:8,c1:1,r2:8,c2:1,ni:27},{r1:8,c1:5,r2:9,c2:6,ni:28},{r1:8,c1:10,r2:10,c2:10,ni:29},{r1:9,c1:1,r2:10,c2:1,ni:30},{r1:10,c1:4,r2:10,c2:7,ni:31},{r1:10,c1:9,r2:10,c2:9,ni:32}] },
  { name:'إعصار ثانٍ', rows:11, cols:11, time:524, numbers:[{r:2,c:0,val:4},{r:0,c:1,val:4},{r:0,c:8,val:4},{r:2,c:9,val:3},{r:1,c:10,val:4},{r:1,c:4,val:4},{r:1,c:6,val:4},{r:3,c:1,val:4},{r:2,c:3,val:4},{r:2,c:6,val:4},{r:3,c:7,val:4},{r:4,c:8,val:4},{r:3,c:3,val:4},{r:3,c:9,val:4},{r:4,c:0,val:4},{r:4,c:3,val:4},{r:7,c:10,val:4},{r:5,c:3,val:3},{r:6,c:5,val:3},{r:9,c:1,val:4},{r:7,c:3,val:4},{r:9,c:4,val:4},{r:6,c:7,val:4},{r:8,c:8,val:3},{r:9,c:9,val:4},{r:10,c:0,val:3},{r:8,c:2,val:3},{r:10,c:3,val:3},{r:9,c:6,val:4},{r:10,c:7,val:3},{r:8,c:10,val:3},{r:9,c:8,val:1},{r:10,c:1,val:1},{r:10,c:6,val:3},{r:10,c:8,val:1}], _solution:[{r1:0,c1:0,r2:3,c2:0,ni:0},{r1:0,c1:1,r2:0,c2:4,ni:1},{r1:0,c1:5,r2:0,c2:8,ni:2},{r1:0,c1:9,r2:2,c2:9,ni:3},{r1:0,c1:10,r2:3,c2:10,ni:4},{r1:1,c1:1,r2:1,c2:4,ni:5},{r1:1,c1:5,r2:1,c2:8,ni:6},{r1:2,c1:1,r2:5,c2:1,ni:7},{r1:2,c1:2,r2:2,c2:5,ni:8},{r1:2,c1:6,r2:5,c2:6,ni:9},{r1:2,c1:7,r2:5,c2:7,ni:10},{r1:2,c1:8,r2:5,c2:8,ni:11},{r1:3,c1:2,r2:3,c2:5,ni:12},{r1:3,c1:9,r2:6,c2:9,ni:13},{r1:4,c1:0,r2:7,c2:0,ni:14},{r1:4,c1:2,r2:4,c2:5,ni:15},{r1:4,c1:10,r2:7,c2:10,ni:16},{r1:5,c1:2,r2:5,c2:4,ni:17},{r1:5,c1:5,r2:7,c2:5,ni:18},{r1:6,c1:1,r2:9,c2:1,ni:19},{r1:6,c1:2,r2:7,c2:3,ni:20},{r1:6,c1:4,r2:9,c2:4,ni:21},{r1:6,c1:6,r2:7,c2:7,ni:22},{r1:6,c1:8,r2:8,c2:8,ni:23},{r1:7,c1:9,r2:10,c2:9,ni:24},{r1:8,c1:0,r2:10,c2:0,ni:25},{r1:8,c1:2,r2:10,c2:2,ni:26},{r1:8,c1:3,r2:10,c2:3,ni:27},{r1:8,c1:5,r2:9,c2:6,ni:28},{r1:8,c1:7,r2:10,c2:7,ni:29},{r1:8,c1:10,r2:10,c2:10,ni:30},{r1:9,c1:8,r2:9,c2:8,ni:31},{r1:10,c1:1,r2:10,c2:1,ni:32},{r1:10,c1:4,r2:10,c2:6,ni:33},{r1:10,c1:8,r2:10,c2:8,ni:34}] },
  { name:'الهاوية الكبرى', rows:11, cols:11, time:524, numbers:[{r:2,c:0,val:4},{r:0,c:1,val:3},{r:0,c:5,val:4},{r:0,c:9,val:3},{r:1,c:1,val:3},{r:3,c:4,val:3},{r:1,c:5,val:3},{r:1,c:6,val:4},{r:4,c:10,val:4},{r:2,c:1,val:4},{r:5,c:3,val:4},{r:2,c:6,val:4},{r:3,c:8,val:4},{r:7,c:0,val:4},{r:4,c:2,val:4},{r:4,c:5,val:4},{r:4,c:9,val:4},{r:5,c:4,val:3},{r:6,c:7,val:3},{r:7,c:10,val:3},{r:8,c:1,val:4},{r:6,c:3,val:4},{r:7,c:5,val:4},{r:8,c:6,val:4},{r:6,c:8,val:4},{r:8,c:0,val:3},{r:10,c:3,val:6},{r:8,c:4,val:4},{r:8,c:8,val:4},{r:8,c:9,val:4},{r:10,c:1,val:1},{r:10,c:7,val:4},{r:10,c:9,val:2},{r:10,c:10,val:1}], _solution:[{r1:0,c1:0,r2:3,c2:0,ni:0},{r1:0,c1:1,r2:0,c2:3,ni:1},{r1:0,c1:4,r2:0,c2:7,ni:2},{r1:0,c1:8,r2:0,c2:10,ni:3},{r1:1,c1:1,r2:1,c2:3,ni:4},{r1:1,c1:4,r2:3,c2:4,ni:5},{r1:1,c1:5,r2:3,c2:5,ni:6},{r1:1,c1:6,r2:1,c2:9,ni:7},{r1:1,c1:10,r2:4,c2:10,ni:8},{r1:2,c1:1,r2:3,c2:2,ni:9},{r1:2,c1:3,r2:5,c2:3,ni:10},{r1:2,c1:6,r2:3,c2:7,ni:11},{r1:2,c1:8,r2:3,c2:9,ni:12},{r1:4,c1:0,r2:7,c2:0,ni:13},{r1:4,c1:1,r2:5,c2:2,ni:14},{r1:4,c1:4,r2:4,c2:7,ni:15},{r1:4,c1:8,r2:5,c2:9,ni:16},{r1:5,c1:4,r2:5,c2:6,ni:17},{r1:5,c1:7,r2:7,c2:7,ni:18},{r1:5,c1:10,r2:7,c2:10,ni:19},{r1:6,c1:1,r2:9,c2:1,ni:20},{r1:6,c1:2,r2:7,c2:3,ni:21},{r1:6,c1:4,r2:7,c2:5,ni:22},{r1:6,c1:6,r2:9,c2:6,ni:23},{r1:6,c1:8,r2:7,c2:9,ni:24},{r1:8,c1:0,r2:10,c2:0,ni:25},{r1:8,c1:2,r2:10,c2:3,ni:26},{r1:8,c1:4,r2:9,c2:5,ni:27},{r1:8,c1:7,r2:9,c2:8,ni:28},{r1:8,c1:9,r2:9,c2:10,ni:29},{r1:10,c1:1,r2:10,c2:1,ni:30},{r1:10,c1:4,r2:10,c2:7,ni:31},{r1:10,c1:8,r2:10,c2:9,ni:32},{r1:10,c1:10,r2:10,c2:10,ni:33}] },
  { name:'عاصفة', rows:11, cols:11, time:524, numbers:[{r:1,c:0,val:4},{r:1,c:1,val:4},{r:0,c:5,val:4},{r:1,c:6,val:4},{r:0,c:8,val:4},{r:1,c:3,val:4},{r:3,c:4,val:4},{r:4,c:5,val:4},{r:1,c:7,val:3},{r:2,c:10,val:3},{r:2,c:7,val:4},{r:2,c:9,val:4},{r:3,c:3,val:6},{r:6,c:0,val:4},{r:4,c:1,val:4},{r:4,c:6,val:3},{r:6,c:10,val:3},{r:5,c:6,val:3},{r:5,c:7,val:4},{r:7,c:8,val:3},{r:8,c:2,val:4},{r:6,c:4,val:4},{r:8,c:5,val:4},{r:8,c:6,val:4},{r:6,c:9,val:4},{r:8,c:10,val:4},{r:9,c:1,val:4},{r:9,c:4,val:4},{r:9,c:8,val:2},{r:9,c:7,val:1},{r:10,c:0,val:3},{r:10,c:5,val:4},{r:10,c:9,val:3}], _solution:[{r1:0,c1:0,r2:3,c2:0,ni:0},{r1:0,c1:1,r2:3,c2:1,ni:1},{r1:0,c1:2,r2:0,c2:5,ni:2},{r1:0,c1:6,r2:3,c2:6,ni:3},{r1:0,c1:7,r2:0,c2:10,ni:4},{r1:1,c1:2,r2:2,c2:3,ni:5},{r1:1,c1:4,r2:4,c2:4,ni:6},{r1:1,c1:5,r2:4,c2:5,ni:7},{r1:1,c1:7,r2:1,c2:9,ni:8},{r1:1,c1:10,r2:3,c2:10,ni:9},{r1:2,c1:7,r2:3,c2:8,ni:10},{r1:2,c1:9,r2:5,c2:9,ni:11},{r1:3,c1:2,r2:5,c2:3,ni:12},{r1:4,c1:0,r2:7,c2:0,ni:13},{r1:4,c1:1,r2:7,c2:1,ni:14},{r1:4,c1:6,r2:4,c2:8,ni:15},{r1:4,c1:10,r2:6,c2:10,ni:16},{r1:5,c1:4,r2:5,c2:6,ni:17},{r1:5,c1:7,r2:8,c2:7,ni:18},{r1:5,c1:8,r2:7,c2:8,ni:19},{r1:6,c1:2,r2:9,c2:2,ni:20},{r1:6,c1:3,r2:7,c2:4,ni:21},{r1:6,c1:5,r2:9,c2:5,ni:22},{r1:6,c1:6,r2:9,c2:6,ni:23},{r1:6,c1:9,r2:9,c2:9,ni:24},{r1:7,c1:10,r2:10,c2:10,ni:25},{r1:8,c1:0,r2:9,c2:1,ni:26},{r1:8,c1:3,r2:9,c2:4,ni:27},{r1:8,c1:8,r2:9,c2:8,ni:28},{r1:9,c1:7,r2:9,c2:7,ni:29},{r1:10,c1:0,r2:10,c2:2,ni:30},{r1:10,c1:3,r2:10,c2:6,ni:31},{r1:10,c1:7,r2:10,c2:9,ni:32}] },
  { name:'زلزال', rows:11, cols:11, time:524, numbers:[{r:2,c:0,val:4},{r:0,c:1,val:4},{r:0,c:5,val:4},{r:0,c:10,val:4},{r:1,c:4,val:4},{r:2,c:7,val:4},{r:3,c:9,val:4},{r:3,c:10,val:4},{r:2,c:1,val:4},{r:3,c:2,val:3},{r:2,c:5,val:4},{r:4,c:3,val:4},{r:3,c:7,val:4},{r:6,c:0,val:3},{r:4,c:7,val:3},{r:6,c:8,val:4},{r:5,c:5,val:4},{r:8,c:6,val:4},{r:8,c:7,val:4},{r:6,c:10,val:4},{r:6,c:1,val:4},{r:6,c:3,val:4},{r:6,c:4,val:4},{r:10,c:0,val:4},{r:8,c:9,val:3},{r:9,c:10,val:4},{r:8,c:1,val:3},{r:8,c:2,val:1},{r:9,c:4,val:4},{r:8,c:8,val:2},{r:9,c:2,val:1},{r:10,c:7,val:4},{r:10,c:4,val:4},{r:10,c:8,val:2}], _solution:[{r1:0,c1:0,r2:3,c2:0,ni:0},{r1:0,c1:1,r2:0,c2:4,ni:1},{r1:0,c1:5,r2:1,c2:6,ni:2},{r1:0,c1:7,r2:0,c2:10,ni:3},{r1:1,c1:1,r2:1,c2:4,ni:4},{r1:1,c1:7,r2:2,c2:8,ni:5},{r1:1,c1:9,r2:4,c2:9,ni:6},{r1:1,c1:10,r2:4,c2:10,ni:7},{r1:2,c1:1,r2:5,c2:1,ni:8},{r1:2,c1:2,r2:4,c2:2,ni:9},{r1:2,c1:3,r2:2,c2:6,ni:10},{r1:3,c1:3,r2:4,c2:4,ni:11},{r1:3,c1:5,r2:3,c2:8,ni:12},{r1:4,c1:0,r2:6,c2:0,ni:13},{r1:4,c1:5,r2:4,c2:7,ni:14},{r1:4,c1:8,r2:7,c2:8,ni:15},{r1:5,c1:2,r2:5,c2:5,ni:16},{r1:5,c1:6,r2:8,c2:6,ni:17},{r1:5,c1:7,r2:8,c2:7,ni:18},{r1:5,c1:9,r2:6,c2:10,ni:19},{r1:6,c1:1,r2:7,c2:2,ni:20},{r1:6,c1:3,r2:9,c2:3,ni:21},{r1:6,c1:4,r2:7,c2:5,ni:22},{r1:7,c1:0,r2:10,c2:0,ni:23},{r1:7,c1:9,r2:9,c2:9,ni:24},{r1:7,c1:10,r2:10,c2:10,ni:25},{r1:8,c1:1,r2:10,c2:1,ni:26},{r1:8,c1:2,r2:8,c2:2,ni:27},{r1:8,c1:4,r2:9,c2:5,ni:28},{r1:8,c1:8,r2:9,c2:8,ni:29},{r1:9,c1:2,r2:9,c2:2,ni:30},{r1:9,c1:6,r2:10,c2:7,ni:31},{r1:10,c1:2,r2:10,c2:5,ni:32},{r1:10,c1:8,r2:10,c2:9,ni:33}] },
  { name:'بركان', rows:11, cols:11, time:524, numbers:[{r:0,c:1,val:4},{r:3,c:4,val:4},{r:1,c:6,val:4},{r:1,c:7,val:3},{r:1,c:8,val:4},{r:2,c:10,val:4},{r:2,c:0,val:4},{r:3,c:1,val:4},{r:1,c:3,val:4},{r:3,c:5,val:3},{r:3,c:6,val:4},{r:2,c:8,val:4},{r:3,c:9,val:4},{r:3,c:3,val:4},{r:3,c:7,val:4},{r:7,c:4,val:4},{r:6,c:10,val:4},{r:6,c:1,val:4},{r:5,c:3,val:4},{r:8,c:5,val:4},{r:6,c:6,val:4},{r:6,c:8,val:4},{r:8,c:0,val:4},{r:7,c:2,val:4},{r:10,c:3,val:4},{r:9,c:7,val:4},{r:10,c:4,val:3},{r:8,c:8,val:4},{r:10,c:10,val:3},{r:10,c:1,val:4},{r:9,c:5,val:2},{r:10,c:6,val:1},{r:10,c:8,val:1},{r:10,c:9,val:1}], _solution:[{r1:0,c1:0,r2:0,c2:3,ni:0},{r1:0,c1:4,r2:3,c2:4,ni:1},{r1:0,c1:5,r2:1,c2:6,ni:2},{r1:0,c1:7,r2:2,c2:7,ni:3},{r1:0,c1:8,r2:1,c2:9,ni:4},{r1:0,c1:10,r2:3,c2:10,ni:5},{r1:1,c1:0,r2:4,c2:0,ni:6},{r1:1,c1:1,r2:4,c2:1,ni:7},{r1:1,c1:2,r2:2,c2:3,ni:8},{r1:2,c1:5,r2:4,c2:5,ni:9},{r1:2,c1:6,r2:5,c2:6,ni:10},{r1:2,c1:8,r2:5,c2:8,ni:11},{r1:2,c1:9,r2:5,c2:9,ni:12},{r1:3,c1:2,r2:4,c2:3,ni:13},{r1:3,c1:7,r2:6,c2:7,ni:14},{r1:4,c1:4,r2:7,c2:4,ni:15},{r1:4,c1:10,r2:7,c2:10,ni:16},{r1:5,c1:0,r2:6,c2:1,ni:17},{r1:5,c1:2,r2:6,c2:3,ni:18},{r1:5,c1:5,r2:8,c2:5,ni:19},{r1:6,c1:6,r2:9,c2:6,ni:20},{r1:6,c1:8,r2:7,c2:9,ni:21},{r1:7,c1:0,r2:8,c2:1,ni:22},{r1:7,c1:2,r2:10,c2:2,ni:23},{r1:7,c1:3,r2:10,c2:3,ni:24},{r1:7,c1:7,r2:10,c2:7,ni:25},{r1:8,c1:4,r2:10,c2:4,ni:26},{r1:8,c1:8,r2:9,c2:9,ni:27},{r1:8,c1:10,r2:10,c2:10,ni:28},{r1:9,c1:0,r2:10,c2:1,ni:29},{r1:9,c1:5,r2:10,c2:5,ni:30},{r1:10,c1:6,r2:10,c2:6,ni:31},{r1:10,c1:8,r2:10,c2:8,ni:32},{r1:10,c1:9,r2:10,c2:9,ni:33}] },
  { name:'طوفان عظيم', rows:11, cols:11, time:524, numbers:[{r:2,c:0,val:4},{r:0,c:2,val:4},{r:0,c:6,val:4},{r:1,c:8,val:4},{r:1,c:9,val:4},{r:2,c:10,val:4},{r:2,c:2,val:6},{r:2,c:4,val:3},{r:3,c:5,val:4},{r:2,c:8,val:4},{r:6,c:1,val:4},{r:4,c:2,val:4},{r:7,c:0,val:4},{r:4,c:5,val:4},{r:4,c:9,val:4},{r:4,c:10,val:4},{r:6,c:3,val:4},{r:5,c:8,val:4},{r:6,c:4,val:4},{r:6,c:9,val:4},{r:7,c:2,val:3},{r:8,c:6,val:4},{r:7,c:9,val:4},{r:9,c:0,val:4},{r:8,c:4,val:4},{r:8,c:10,val:3},{r:9,c:3,val:4},{r:9,c:8,val:4},{r:10,c:0,val:4},{r:10,c:5,val:4},{r:10,c:9,val:2}], _solution:[{r1:0,c1:0,r2:3,c2:0,ni:0},{r1:0,c1:1,r2:0,c2:4,ni:1},{r1:0,c1:5,r2:1,c2:6,ni:2},{r1:0,c1:7,r2:1,c2:8,ni:3},{r1:0,c1:9,r2:3,c2:9,ni:4},{r1:0,c1:10,r2:3,c2:10,ni:5},{r1:1,c1:1,r2:2,c2:3,ni:6},{r1:1,c1:4,r2:3,c2:4,ni:7},{r1:2,c1:5,r2:3,c2:6,ni:8},{r1:2,c1:7,r2:3,c2:8,ni:9},{r1:3,c1:1,r2:6,c2:1,ni:10},{r1:3,c1:2,r2:4,c2:3,ni:11},{r1:4,c1:0,r2:7,c2:0,ni:12},{r1:4,c1:4,r2:5,c2:5,ni:13},{r1:4,c1:6,r2:4,c2:9,ni:14},{r1:4,c1:10,r2:7,c2:10,ni:15},{r1:5,c1:2,r2:6,c2:3,ni:16},{r1:5,c1:6,r2:5,c2:9,ni:17},{r1:6,c1:4,r2:7,c2:5,ni:18},{r1:6,c1:6,r2:6,c2:9,ni:19},{r1:7,c1:1,r2:7,c2:3,ni:20},{r1:7,c1:6,r2:8,c2:7,ni:21},{r1:7,c1:8,r2:8,c2:9,ni:22},{r1:8,c1:0,r2:9,c2:1,ni:23},{r1:8,c1:2,r2:8,c2:5,ni:24},{r1:8,c1:10,r2:10,c2:10,ni:25},{r1:9,c1:2,r2:9,c2:5,ni:26},{r1:9,c1:6,r2:9,c2:9,ni:27},{r1:10,c1:0,r2:10,c2:3,ni:28},{r1:10,c1:4,r2:10,c2:7,ni:29},{r1:10,c1:8,r2:10,c2:9,ni:30}] },
  { name:'المعبد', rows:11, cols:11, time:524, numbers:[{r:1,c:0,val:4},{r:3,c:2,val:4},{r:0,c:6,val:4},{r:0,c:7,val:4},{r:2,c:8,val:3},{r:1,c:10,val:4},{r:1,c:6,val:4},{r:3,c:0,val:2},{r:3,c:1,val:4},{r:4,c:3,val:4},{r:3,c:4,val:4},{r:3,c:6,val:3},{r:5,c:9,val:4},{r:2,c:10,val:4},{r:3,c:8,val:4},{r:6,c:0,val:4},{r:7,c:2,val:4},{r:5,c:4,val:4},{r:7,c:5,val:4},{r:6,c:7,val:4},{r:7,c:6,val:4},{r:7,c:1,val:4},{r:8,c:3,val:4},{r:6,c:9,val:4},{r:7,c:8,val:3},{r:8,c:0,val:3},{r:10,c:2,val:3},{r:8,c:4,val:3},{r:9,c:5,val:3},{r:10,c:7,val:3},{r:8,c:10,val:4},{r:9,c:6,val:2},{r:10,c:1,val:1},{r:10,c:3,val:1},{r:10,c:10,val:3}], _solution:[{r1:0,c1:0,r2:1,c2:1,ni:0},{r1:0,c1:2,r2:3,c2:2,ni:1},{r1:0,c1:3,r2:0,c2:6,ni:2},{r1:0,c1:7,r2:3,c2:7,ni:3},{r1:0,c1:8,r2:2,c2:8,ni:4},{r1:0,c1:9,r2:1,c2:10,ni:5},{r1:1,c1:3,r2:1,c2:6,ni:6},{r1:2,c1:0,r2:3,c2:0,ni:7},{r1:2,c1:1,r2:5,c2:1,ni:8},{r1:2,c1:3,r2:5,c2:3,ni:9},{r1:2,c1:4,r2:3,c2:5,ni:10},{r1:2,c1:6,r2:4,c2:6,ni:11},{r1:2,c1:9,r2:5,c2:9,ni:12},{r1:2,c1:10,r2:5,c2:10,ni:13},{r1:3,c1:8,r2:6,c2:8,ni:14},{r1:4,c1:0,r2:7,c2:0,ni:15},{r1:4,c1:2,r2:7,c2:2,ni:16},{r1:4,c1:4,r2:7,c2:4,ni:17},{r1:4,c1:5,r2:7,c2:5,ni:18},{r1:4,c1:7,r2:7,c2:7,ni:19},{r1:5,c1:6,r2:8,c2:6,ni:20},{r1:6,c1:1,r2:9,c2:1,ni:21},{r1:6,c1:3,r2:9,c2:3,ni:22},{r1:6,c1:9,r2:7,c2:10,ni:23},{r1:7,c1:8,r2:9,c2:8,ni:24},{r1:8,c1:0,r2:10,c2:0,ni:25},{r1:8,c1:2,r2:10,c2:2,ni:26},{r1:8,c1:4,r2:10,c2:4,ni:27},{r1:8,c1:5,r2:10,c2:5,ni:28},{r1:8,c1:7,r2:10,c2:7,ni:29},{r1:8,c1:9,r2:9,c2:10,ni:30},{r1:9,c1:6,r2:10,c2:6,ni:31},{r1:10,c1:1,r2:10,c2:1,ni:32},{r1:10,c1:3,r2:10,c2:3,ni:33},{r1:10,c1:8,r2:10,c2:10,ni:34}] },
  { name:'القلعة', rows:11, cols:11, time:524, numbers:[{r:0,c:2,val:4},{r:0,c:5,val:4},{r:0,c:8,val:4},{r:2,c:9,val:4},{r:3,c:10,val:4},{r:1,c:3,val:4},{r:3,c:4,val:4},{r:2,c:6,val:4},{r:2,c:7,val:4},{r:3,c:1,val:4},{r:4,c:2,val:3},{r:3,c:3,val:3},{r:4,c:5,val:4},{r:5,c:6,val:4},{r:6,c:0,val:4},{r:6,c:1,val:4},{r:5,c:8,val:4},{r:6,c:10,val:4},{r:6,c:2,val:4},{r:5,c:3,val:4},{r:7,c:7,val:4},{r:8,c:8,val:4},{r:7,c:9,val:3},{r:7,c:3,val:4},{r:9,c:4,val:4},{r:7,c:6,val:4},{r:9,c:1,val:4},{r:9,c:10,val:3},{r:10,c:2,val:2},{r:9,c:5,val:4},{r:9,c:7,val:1},{r:9,c:9,val:1},{r:10,c:1,val:2},{r:10,c:8,val:3}], _solution:[{r1:0,c1:0,r2:0,c2:3,ni:0},{r1:0,c1:4,r2:0,c2:7,ni:1},{r1:0,c1:8,r2:3,c2:8,ni:2},{r1:0,c1:9,r2:3,c2:9,ni:3},{r1:0,c1:10,r2:3,c2:10,ni:4},{r1:1,c1:0,r2:1,c2:3,ni:5},{r1:1,c1:4,r2:4,c2:4,ni:6},{r1:1,c1:5,r2:2,c2:6,ni:7},{r1:1,c1:7,r2:4,c2:7,ni:8},{r1:2,c1:0,r2:3,c2:1,ni:9},{r1:2,c1:2,r2:4,c2:2,ni:10},{r1:2,c1:3,r2:4,c2:3,ni:11},{r1:3,c1:5,r2:6,c2:5,ni:12},{r1:3,c1:6,r2:6,c2:6,ni:13},{r1:4,c1:0,r2:7,c2:0,ni:14},{r1:4,c1:1,r2:7,c2:1,ni:15},{r1:4,c1:8,r2:5,c2:9,ni:16},{r1:4,c1:10,r2:7,c2:10,ni:17},{r1:5,c1:2,r2:8,c2:2,ni:18},{r1:5,c1:3,r2:6,c2:4,ni:19},{r1:5,c1:7,r2:8,c2:7,ni:20},{r1:6,c1:8,r2:9,c2:8,ni:21},{r1:6,c1:9,r2:8,c2:9,ni:22},{r1:7,c1:3,r2:10,c2:3,ni:23},{r1:7,c1:4,r2:10,c2:4,ni:24},{r1:7,c1:5,r2:8,c2:6,ni:25},{r1:8,c1:0,r2:9,c2:1,ni:26},{r1:8,c1:10,r2:10,c2:10,ni:27},{r1:9,c1:2,r2:10,c2:2,ni:28},{r1:9,c1:5,r2:10,c2:6,ni:29},{r1:9,c1:7,r2:9,c2:7,ni:30},{r1:9,c1:9,r2:9,c2:9,ni:31},{r1:10,c1:0,r2:10,c2:1,ni:32},{r1:10,c1:7,r2:10,c2:9,ni:33}] },
  { name:'الحصن', rows:11, cols:11, time:524, numbers:[{r:0,c:0,val:3},{r:3,c:3,val:4},{r:0,c:4,val:4},{r:0,c:8,val:4},{r:3,c:10,val:4},{r:1,c:0,val:4},{r:1,c:1,val:2},{r:3,c:2,val:4},{r:2,c:6,val:4},{r:1,c:8,val:4},{r:3,c:4,val:4},{r:4,c:5,val:4},{r:3,c:1,val:4},{r:3,c:9,val:4},{r:6,c:3,val:4},{r:4,c:8,val:4},{r:5,c:10,val:4},{r:6,c:0,val:4},{r:7,c:2,val:4},{r:5,c:6,val:4},{r:6,c:5,val:4},{r:8,c:6,val:3},{r:7,c:8,val:4},{r:7,c:9,val:2},{r:7,c:1,val:4},{r:8,c:3,val:4},{r:9,c:5,val:3},{r:8,c:8,val:2},{r:8,c:9,val:4},{r:9,c:0,val:2},{r:9,c:2,val:2},{r:9,c:6,val:2},{r:9,c:7,val:4},{r:10,c:3,val:1},{r:10,c:4,val:1},{r:10,c:9,val:2}], _solution:[{r1:0,c1:0,r2:0,c2:2,ni:0},{r1:0,c1:3,r2:3,c2:3,ni:1},{r1:0,c1:4,r2:1,c2:5,ni:2},{r1:0,c1:6,r2:0,c2:9,ni:3},{r1:0,c1:10,r2:3,c2:10,ni:4},{r1:1,c1:0,r2:4,c2:0,ni:5},{r1:1,c1:1,r2:2,c2:1,ni:6},{r1:1,c1:2,r2:4,c2:2,ni:7},{r1:1,c1:6,r2:2,c2:7,ni:8},{r1:1,c1:8,r2:2,c2:9,ni:9},{r1:2,c1:4,r2:5,c2:4,ni:10},{r1:2,c1:5,r2:5,c2:5,ni:11},{r1:3,c1:1,r2:6,c2:1,ni:12},{r1:3,c1:6,r2:3,c2:9,ni:13},{r1:4,c1:3,r2:7,c2:3,ni:14},{r1:4,c1:6,r2:4,c2:9,ni:15},{r1:4,c1:10,r2:7,c2:10,ni:16},{r1:5,c1:0,r2:8,c2:0,ni:17},{r1:5,c1:2,r2:8,c2:2,ni:18},{r1:5,c1:6,r2:5,c2:9,ni:19},{r1:6,c1:4,r2:7,c2:5,ni:20},{r1:6,c1:6,r2:8,c2:6,ni:21},{r1:6,c1:7,r2:7,c2:8,ni:22},{r1:6,c1:9,r2:7,c2:9,ni:23},{r1:7,c1:1,r2:10,c2:1,ni:24},{r1:8,c1:3,r2:9,c2:4,ni:25},{r1:8,c1:5,r2:10,c2:5,ni:26},{r1:8,c1:7,r2:8,c2:8,ni:27},{r1:8,c1:9,r2:9,c2:10,ni:28},{r1:9,c1:0,r2:10,c2:0,ni:29},{r1:9,c1:2,r2:10,c2:2,ni:30},{r1:9,c1:6,r2:10,c2:6,ni:31},{r1:9,c1:7,r2:10,c2:8,ni:32},{r1:10,c1:3,r2:10,c2:3,ni:33},{r1:10,c1:4,r2:10,c2:4,ni:34},{r1:10,c1:9,r2:10,c2:10,ni:35}] },
  { name:'المنارة', rows:12, cols:12, time:616, numbers:[{r:0,c:3,val:4},{r:1,c:5,val:4},{r:1,c:6,val:4},{r:3,c:8,val:4},{r:0,c:10,val:4},{r:3,c:11,val:4},{r:1,c:1,val:4},{r:3,c:1,val:4},{r:2,c:3,val:4},{r:2,c:7,val:4},{r:4,c:9,val:3},{r:2,c:10,val:4},{r:3,c:2,val:4},{r:5,c:3,val:4},{r:5,c:4,val:4},{r:6,c:5,val:4},{r:5,c:0,val:4},{r:4,c:6,val:4},{r:6,c:7,val:4},{r:6,c:8,val:3},{r:6,c:11,val:4},{r:8,c:9,val:4},{r:9,c:0,val:4},{r:7,c:1,val:4},{r:8,c:10,val:4},{r:7,c:2,val:4},{r:10,c:8,val:4},{r:8,c:3,val:4},{r:8,c:5,val:4},{r:10,c:11,val:4},{r:9,c:7,val:4},{r:10,c:9,val:3},{r:11,c:1,val:4},{r:10,c:2,val:4},{r:11,c:6,val:4},{r:10,c:10,val:2},{r:11,c:3,val:4},{r:11,c:8,val:1}], _solution:[{r1:0,c1:0,r2:0,c2:3,ni:0},{r1:0,c1:4,r2:1,c2:5,ni:1},{r1:0,c1:6,r2:1,c2:7,ni:2},{r1:0,c1:8,r2:3,c2:8,ni:3},{r1:0,c1:9,r2:1,c2:10,ni:4},{r1:0,c1:11,r2:3,c2:11,ni:5},{r1:1,c1:0,r2:1,c2:3,ni:6},{r1:2,c1:0,r2:3,c2:1,ni:7},{r1:2,c1:2,r2:2,c2:5,ni:8},{r1:2,c1:6,r2:3,c2:7,ni:9},{r1:2,c1:9,r2:4,c2:9,ni:10},{r1:2,c1:10,r2:5,c2:10,ni:11},{r1:3,c1:2,r2:6,c2:2,ni:12},{r1:3,c1:3,r2:6,c2:3,ni:13},{r1:3,c1:4,r2:6,c2:4,ni:14},{r1:3,c1:5,r2:6,c2:5,ni:15},{r1:4,c1:0,r2:5,c2:1,ni:16},{r1:4,c1:6,r2:7,c2:6,ni:17},{r1:4,c1:7,r2:7,c2:7,ni:18},{r1:4,c1:8,r2:6,c2:8,ni:19},{r1:4,c1:11,r2:7,c2:11,ni:20},{r1:5,c1:9,r2:8,c2:9,ni:21},{r1:6,c1:0,r2:9,c2:0,ni:22},{r1:6,c1:1,r2:9,c2:1,ni:23},{r1:6,c1:10,r2:9,c2:10,ni:24},{r1:7,c1:2,r2:7,c2:5,ni:25},{r1:7,c1:8,r2:10,c2:8,ni:26},{r1:8,c1:2,r2:9,c2:3,ni:27},{r1:8,c1:4,r2:8,c2:7,ni:28},{r1:8,c1:11,r2:11,c2:11,ni:29},{r1:9,c1:4,r2:9,c2:7,ni:30},{r1:9,c1:9,r2:11,c2:9,ni:31},{r1:10,c1:0,r2:11,c2:1,ni:32},{r1:10,c1:2,r2:10,c2:5,ni:33},{r1:10,c1:6,r2:11,c2:7,ni:34},{r1:10,c1:10,r2:11,c2:10,ni:35},{r1:11,c1:2,r2:11,c2:5,ni:36},{r1:11,c1:8,r2:11,c2:8,ni:37}] },
  { name:'الإمبراطور', rows:12, cols:12, time:616, numbers:[{r:3,c:0,val:4},{r:0,c:3,val:4},{r:1,c:5,val:4},{r:0,c:7,val:4},{r:0,c:9,val:4},{r:3,c:10,val:4},{r:1,c:11,val:4},{r:1,c:3,val:4},{r:2,c:1,val:3},{r:2,c:2,val:4},{r:3,c:4,val:4},{r:2,c:7,val:4},{r:3,c:8,val:4},{r:6,c:0,val:3},{r:4,c:2,val:4},{r:5,c:5,val:4},{r:4,c:6,val:4},{r:5,c:10,val:4},{r:6,c:1,val:4},{r:5,c:6,val:4},{r:6,c:2,val:4},{r:7,c:3,val:4},{r:7,c:7,val:4},{r:6,c:10,val:4},{r:8,c:0,val:4},{r:7,c:8,val:4},{r:9,c:3,val:4},{r:11,c:5,val:4},{r:8,c:7,val:4},{r:8,c:10,val:2},{r:10,c:1,val:3},{r:10,c:6,val:4},{r:10,c:8,val:4},{r:9,c:11,val:4},{r:11,c:3,val:4},{r:10,c:4,val:1},{r:11,c:0,val:1},{r:11,c:4,val:1},{r:11,c:9,val:4},{r:11,c:11,val:2}], _solution:[{r1:0,c1:0,r2:3,c2:0,ni:0},{r1:0,c1:1,r2:0,c2:4,ni:1},{r1:0,c1:5,r2:3,c2:5,ni:2},{r1:0,c1:6,r2:1,c2:7,ni:3},{r1:0,c1:8,r2:1,c2:9,ni:4},{r1:0,c1:10,r2:3,c2:10,ni:5},{r1:0,c1:11,r2:3,c2:11,ni:6},{r1:1,c1:1,r2:1,c2:4,ni:7},{r1:2,c1:1,r2:4,c2:1,ni:8},{r1:2,c1:2,r2:3,c2:3,ni:9},{r1:2,c1:4,r2:5,c2:4,ni:10},{r1:2,c1:6,r2:2,c2:9,ni:11},{r1:3,c1:6,r2:3,c2:9,ni:12},{r1:4,c1:0,r2:6,c2:0,ni:13},{r1:4,c1:2,r2:5,c2:3,ni:14},{r1:4,c1:5,r2:7,c2:5,ni:15},{r1:4,c1:6,r2:4,c2:9,ni:16},{r1:4,c1:10,r2:5,c2:11,ni:17},{r1:5,c1:1,r2:8,c2:1,ni:18},{r1:5,c1:6,r2:5,c2:9,ni:19},{r1:6,c1:2,r2:9,c2:2,ni:20},{r1:6,c1:3,r2:7,c2:4,ni:21},{r1:6,c1:6,r2:7,c2:7,ni:22},{r1:6,c1:8,r2:6,c2:11,ni:23},{r1:7,c1:0,r2:10,c2:0,ni:24},{r1:7,c1:8,r2:7,c2:11,ni:25},{r1:8,c1:3,r2:9,c2:4,ni:26},{r1:8,c1:5,r2:11,c2:5,ni:27},{r1:8,c1:6,r2:8,c2:9,ni:28},{r1:8,c1:10,r2:8,c2:11,ni:29},{r1:9,c1:1,r2:11,c2:1,ni:30},{r1:9,c1:6,r2:10,c2:7,ni:31},{r1:9,c1:8,r2:10,c2:9,ni:32},{r1:9,c1:10,r2:10,c2:11,ni:33},{r1:10,c1:2,r2:11,c2:3,ni:34},{r1:10,c1:4,r2:10,c2:4,ni:35},{r1:11,c1:0,r2:11,c2:0,ni:36},{r1:11,c1:4,r2:11,c2:4,ni:37},{r1:11,c1:6,r2:11,c2:9,ni:38},{r1:11,c1:10,r2:11,c2:11,ni:39}] },
  { name:'التنين الأعظم', rows:12, cols:12, time:616, numbers:[{r:1,c:0,val:4},{r:0,c:4,val:4},{r:1,c:6,val:4},{r:1,c:8,val:3},{r:0,c:10,val:4},{r:1,c:11,val:3},{r:1,c:3,val:4},{r:3,c:4,val:3},{r:4,c:5,val:4},{r:3,c:0,val:4},{r:4,c:1,val:4},{r:2,c:7,val:4},{r:3,c:9,val:4},{r:3,c:3,val:4},{r:6,c:8,val:4},{r:4,c:11,val:2},{r:4,c:4,val:3},{r:4,c:6,val:2},{r:4,c:7,val:4},{r:4,c:10,val:4},{r:5,c:3,val:4},{r:5,c:5,val:4},{r:7,c:11,val:4},{r:7,c:0,val:3},{r:6,c:1,val:3},{r:8,c:6,val:4},{r:9,c:9,val:4},{r:8,c:10,val:4},{r:7,c:3,val:4},{r:7,c:4,val:4},{r:7,c:8,val:3},{r:9,c:7,val:4},{r:9,c:0,val:4},{r:9,c:2,val:4},{r:10,c:5,val:3},{r:10,c:11,val:3},{r:10,c:6,val:1},{r:11,c:8,val:2},{r:10,c:10,val:4},{r:11,c:1,val:4},{r:11,c:4,val:1},{r:11,c:6,val:1}], _solution:[{r1:0,c1:0,r2:1,c2:1,ni:0},{r1:0,c1:2,r2:0,c2:5,ni:1},{r1:0,c1:6,r2:1,c2:7,ni:2},{r1:0,c1:8,r2:2,c2:8,ni:3},{r1:0,c1:9,r2:1,c2:10,ni:4},{r1:0,c1:11,r2:2,c2:11,ni:5},{r1:1,c1:2,r2:2,c2:3,ni:6},{r1:1,c1:4,r2:3,c2:4,ni:7},{r1:1,c1:5,r2:4,c2:5,ni:8},{r1:2,c1:0,r2:5,c2:0,ni:9},{r1:2,c1:1,r2:5,c2:1,ni:10},{r1:2,c1:6,r2:3,c2:7,ni:11},{r1:2,c1:9,r2:3,c2:10,ni:12},{r1:3,c1:2,r2:4,c2:3,ni:13},{r1:3,c1:8,r2:6,c2:8,ni:14},{r1:3,c1:11,r2:4,c2:11,ni:15},{r1:4,c1:4,r2:6,c2:4,ni:16},{r1:4,c1:6,r2:5,c2:6,ni:17},{r1:4,c1:7,r2:7,c2:7,ni:18},{r1:4,c1:9,r2:5,c2:10,ni:19},{r1:5,c1:2,r2:6,c2:3,ni:20},{r1:5,c1:5,r2:8,c2:5,ni:21},{r1:5,c1:11,r2:8,c2:11,ni:22},{r1:6,c1:0,r2:8,c2:0,ni:23},{r1:6,c1:1,r2:8,c2:1,ni:24},{r1:6,c1:6,r2:9,c2:6,ni:25},{r1:6,c1:9,r2:9,c2:9,ni:26},{r1:6,c1:10,r2:9,c2:10,ni:27},{r1:7,c1:2,r2:8,c2:3,ni:28},{r1:7,c1:4,r2:10,c2:4,ni:29},{r1:7,c1:8,r2:9,c2:8,ni:30},{r1:8,c1:7,r2:11,c2:7,ni:31},{r1:9,c1:0,r2:10,c2:1,ni:32},{r1:9,c1:2,r2:10,c2:3,ni:33},{r1:9,c1:5,r2:11,c2:5,ni:34},{r1:9,c1:11,r2:11,c2:11,ni:35},{r1:10,c1:6,r2:10,c2:6,ni:36},{r1:10,c1:8,r2:11,c2:8,ni:37},{r1:10,c1:9,r2:11,c2:10,ni:38},{r1:11,c1:0,r2:11,c2:3,ni:39},{r1:11,c1:4,r2:11,c2:4,ni:40},{r1:11,c1:6,r2:11,c2:6,ni:41}] },
  { name:'الفينيق', rows:12, cols:12, time:616, numbers:[{r:0,c:2,val:3},{r:0,c:3,val:4},{r:1,c:4,val:4},{r:3,c:5,val:4},{r:0,c:7,val:4},{r:0,c:10,val:3},{r:3,c:11,val:4},{r:2,c:0,val:4},{r:1,c:2,val:3},{r:1,c:6,val:4},{r:4,c:8,val:4},{r:1,c:9,val:2},{r:4,c:0,val:3},{r:6,c:1,val:4},{r:5,c:6,val:3},{r:4,c:7,val:4},{r:3,c:10,val:4},{r:5,c:2,val:4},{r:5,c:3,val:4},{r:4,c:4,val:4},{r:5,c:5,val:4},{r:6,c:11,val:3},{r:5,c:10,val:3},{r:8,c:0,val:4},{r:7,c:6,val:4},{r:7,c:9,val:4},{r:7,c:10,val:4},{r:7,c:1,val:4},{r:7,c:7,val:3},{r:8,c:11,val:3},{r:8,c:3,val:4},{r:10,c:4,val:6},{r:9,c:8,val:4},{r:10,c:0,val:1},{r:10,c:2,val:4},{r:11,c:7,val:4},{r:10,c:10,val:4},{r:11,c:0,val:2},{r:11,c:4,val:2},{r:11,c:10,val:4}], _solution:[{r1:0,c1:0,r2:0,c2:2,ni:0},{r1:0,c1:3,r2:3,c2:3,ni:1},{r1:0,c1:4,r2:3,c2:4,ni:2},{r1:0,c1:5,r2:3,c2:5,ni:3},{r1:0,c1:6,r2:0,c2:9,ni:4},{r1:0,c1:10,r2:2,c2:10,ni:5},{r1:0,c1:11,r2:3,c2:11,ni:6},{r1:1,c1:0,r2:2,c2:1,ni:7},{r1:1,c1:2,r2:3,c2:2,ni:8},{r1:1,c1:6,r2:2,c2:7,ni:9},{r1:1,c1:8,r2:4,c2:8,ni:10},{r1:1,c1:9,r2:2,c2:9,ni:11},{r1:3,c1:0,r2:5,c2:0,ni:12},{r1:3,c1:1,r2:6,c2:1,ni:13},{r1:3,c1:6,r2:5,c2:6,ni:14},{r1:3,c1:7,r2:6,c2:7,ni:15},{r1:3,c1:9,r2:4,c2:10,ni:16},{r1:4,c1:2,r2:7,c2:2,ni:17},{r1:4,c1:3,r2:7,c2:3,ni:18},{r1:4,c1:4,r2:7,c2:4,ni:19},{r1:4,c1:5,r2:7,c2:5,ni:20},{r1:4,c1:11,r2:6,c2:11,ni:21},{r1:5,c1:8,r2:5,c2:10,ni:22},{r1:6,c1:0,r2:9,c2:0,ni:23},{r1:6,c1:6,r2:9,c2:6,ni:24},{r1:6,c1:8,r2:7,c2:9,ni:25},{r1:6,c1:10,r2:9,c2:10,ni:26},{r1:7,c1:1,r2:10,c2:1,ni:27},{r1:7,c1:7,r2:9,c2:7,ni:28},{r1:7,c1:11,r2:9,c2:11,ni:29},{r1:8,c1:2,r2:9,c2:3,ni:30},{r1:8,c1:4,r2:10,c2:5,ni:31},{r1:8,c1:8,r2:9,c2:9,ni:32},{r1:10,c1:0,r2:10,c2:0,ni:33},{r1:10,c1:2,r2:11,c2:3,ni:34},{r1:10,c1:6,r2:11,c2:7,ni:35},{r1:10,c1:8,r2:10,c2:11,ni:36},{r1:11,c1:0,r2:11,c2:1,ni:37},{r1:11,c1:4,r2:11,c2:5,ni:38},{r1:11,c1:8,r2:11,c2:11,ni:39}] },
  { name:'العملاق الأخير', rows:12, cols:12, time:616, numbers:[{r:0,c:0,val:4},{r:3,c:1,val:4},{r:0,c:2,val:4},{r:1,c:4,val:4},{r:1,c:5,val:4},{r:3,c:6,val:4},{r:1,c:7,val:4},{r:3,c:9,val:4},{r:1,c:10,val:4},{r:2,c:2,val:4},{r:2,c:3,val:4},{r:4,c:7,val:4},{r:3,c:8,val:4},{r:3,c:11,val:4},{r:4,c:0,val:4},{r:6,c:1,val:3},{r:5,c:5,val:4},{r:5,c:6,val:2},{r:5,c:9,val:6},{r:7,c:2,val:4},{r:6,c:4,val:4},{r:6,c:7,val:4},{r:7,c:10,val:4},{r:7,c:11,val:3},{r:7,c:1,val:4},{r:7,c:5,val:4},{r:8,c:0,val:4},{r:8,c:4,val:2},{r:8,c:6,val:4},{r:9,c:9,val:4},{r:11,c:10,val:4},{r:9,c:3,val:4},{r:9,c:8,val:4},{r:9,c:11,val:2},{r:11,c:2,val:4},{r:11,c:4,val:4},{r:11,c:6,val:2},{r:11,c:1,val:1},{r:11,c:8,val:2},{r:11,c:11,val:1}], _solution:[{r1:0,c1:0,r2:3,c2:0,ni:0},{r1:0,c1:1,r2:3,c2:1,ni:1},{r1:0,c1:2,r2:1,c2:3,ni:2},{r1:0,c1:4,r2:3,c2:4,ni:3},{r1:0,c1:5,r2:3,c2:5,ni:4},{r1:0,c1:6,r2:3,c2:6,ni:5},{r1:0,c1:7,r2:1,c2:8,ni:6},{r1:0,c1:9,r2:3,c2:9,ni:7},{r1:0,c1:10,r2:1,c2:11,ni:8},{r1:2,c1:2,r2:5,c2:2,ni:9},{r1:2,c1:3,r2:5,c2:3,ni:10},{r1:2,c1:7,r2:5,c2:7,ni:11},{r1:2,c1:8,r2:5,c2:8,ni:12},{r1:2,c1:10,r2:3,c2:11,ni:13},{r1:4,c1:0,r2:7,c2:0,ni:14},{r1:4,c1:1,r2:6,c2:1,ni:15},{r1:4,c1:4,r2:5,c2:5,ni:16},{r1:4,c1:6,r2:5,c2:6,ni:17},{r1:4,c1:9,r2:5,c2:11,ni:18},{r1:6,c1:2,r2:9,c2:2,ni:19},{r1:6,c1:3,r2:6,c2:6,ni:20},{r1:6,c1:7,r2:7,c2:8,ni:21},{r1:6,c1:9,r2:7,c2:10,ni:22},{r1:6,c1:11,r2:8,c2:11,ni:23},{r1:7,c1:1,r2:10,c2:1,ni:24},{r1:7,c1:3,r2:7,c2:6,ni:25},{r1:8,c1:0,r2:11,c2:0,ni:26},{r1:8,c1:3,r2:8,c2:4,ni:27},{r1:8,c1:5,r2:8,c2:8,ni:28},{r1:8,c1:9,r2:11,c2:9,ni:29},{r1:8,c1:10,r2:11,c2:10,ni:30},{r1:9,c1:3,r2:9,c2:6,ni:31},{r1:9,c1:7,r2:10,c2:8,ni:32},{r1:9,c1:11,r2:10,c2:11,ni:33},{r1:10,c1:2,r2:11,c2:3,ni:34},{r1:10,c1:4,r2:11,c2:5,ni:35},{r1:10,c1:6,r2:11,c2:6,ni:36},{r1:11,c1:1,r2:11,c2:1,ni:37},{r1:11,c1:7,r2:11,c2:8,ni:38},{r1:11,c1:11,r2:11,c2:11,ni:39}] },
  { name:'سيد الأسرار', rows:12, cols:12, time:616, numbers:[{r:0,c:0,val:4},{r:1,c:2,val:4},{r:2,c:3,val:4},{r:0,c:6,val:4},{r:0,c:8,val:4},{r:3,c:10,val:4},{r:3,c:11,val:4},{r:1,c:4,val:2},{r:2,c:6,val:3},{r:1,c:7,val:4},{r:4,c:0,val:4},{r:2,c:1,val:4},{r:2,c:4,val:4},{r:3,c:9,val:6},{r:4,c:2,val:4},{r:4,c:6,val:4},{r:4,c:10,val:4},{r:5,c:11,val:4},{r:5,c:2,val:3},{r:7,c:5,val:4},{r:5,c:7,val:4},{r:7,c:9,val:4},{r:6,c:0,val:4},{r:6,c:2,val:4},{r:7,c:3,val:4},{r:7,c:8,val:4},{r:8,c:3,val:4},{r:11,c:6,val:4},{r:9,c:10,val:4},{r:10,c:11,val:4},{r:9,c:3,val:4},{r:9,c:5,val:3},{r:9,c:8,val:6},{r:10,c:0,val:3},{r:11,c:3,val:2},{r:10,c:4,val:1},{r:11,c:2,val:3},{r:11,c:4,val:1},{r:11,c:7,val:2},{r:11,c:9,val:1}], _solution:[{r1:0,c1:0,r2:1,c2:1,ni:0},{r1:0,c1:2,r2:3,c2:2,ni:1},{r1:0,c1:3,r2:3,c2:3,ni:2},{r1:0,c1:4,r2:0,c2:7,ni:3},{r1:0,c1:8,r2:1,c2:9,ni:4},{r1:0,c1:10,r2:3,c2:10,ni:5},{r1:0,c1:11,r2:3,c2:11,ni:6},{r1:1,c1:4,r2:1,c2:5,ni:7},{r1:1,c1:6,r2:3,c2:6,ni:8},{r1:1,c1:7,r2:4,c2:7,ni:9},{r1:2,c1:0,r2:5,c2:0,ni:10},{r1:2,c1:1,r2:5,c2:1,ni:11},{r1:2,c1:4,r2:3,c2:5,ni:12},{r1:2,c1:8,r2:4,c2:9,ni:13},{r1:4,c1:2,r2:4,c2:5,ni:14},{r1:4,c1:6,r2:7,c2:6,ni:15},{r1:4,c1:10,r2:7,c2:10,ni:16},{r1:4,c1:11,r2:7,c2:11,ni:17},{r1:5,c1:2,r2:5,c2:4,ni:18},{r1:5,c1:5,r2:8,c2:5,ni:19},{r1:5,c1:7,r2:6,c2:8,ni:20},{r1:5,c1:9,r2:8,c2:9,ni:21},{r1:6,c1:0,r2:9,c2:0,ni:22},{r1:6,c1:1,r2:7,c2:2,ni:23},{r1:6,c1:3,r2:7,c2:4,ni:24},{r1:7,c1:7,r2:8,c2:8,ni:25},{r1:8,c1:1,r2:8,c2:4,ni:26},{r1:8,c1:6,r2:11,c2:6,ni:27},{r1:8,c1:10,r2:11,c2:10,ni:28},{r1:8,c1:11,r2:11,c2:11,ni:29},{r1:9,c1:1,r2:9,c2:4,ni:30},{r1:9,c1:5,r2:11,c2:5,ni:31},{r1:9,c1:7,r2:10,c2:9,ni:32},{r1:10,c1:0,r2:10,c2:2,ni:33},{r1:10,c1:3,r2:11,c2:3,ni:34},{r1:10,c1:4,r2:10,c2:4,ni:35},{r1:11,c1:0,r2:11,c2:2,ni:36},{r1:11,c1:4,r2:11,c2:4,ni:37},{r1:11,c1:7,r2:11,c2:8,ni:38},{r1:11,c1:9,r2:11,c2:9,ni:39}] },
  { name:'حكيم الشبكة', rows:12, cols:12, time:616, numbers:[{r:2,c:0,val:4},{r:0,c:1,val:4},{r:0,c:2,val:3},{r:0,c:6,val:4},{r:1,c:8,val:4},{r:1,c:9,val:4},{r:1,c:11,val:4},{r:1,c:4,val:4},{r:5,c:3,val:4},{r:3,c:4,val:4},{r:2,c:7,val:4},{r:2,c:10,val:4},{r:5,c:11,val:4},{r:6,c:2,val:4},{r:5,c:5,val:4},{r:4,c:7,val:4},{r:6,c:8,val:4},{r:4,c:1,val:4},{r:4,c:9,val:4},{r:7,c:6,val:4},{r:7,c:7,val:3},{r:6,c:0,val:4},{r:9,c:1,val:4},{r:6,c:4,val:4},{r:7,c:11,val:4},{r:7,c:2,val:4},{r:8,c:5,val:4},{r:9,c:8,val:3},{r:9,c:4,val:4},{r:9,c:7,val:4},{r:8,c:9,val:4},{r:9,c:11,val:4},{r:9,c:6,val:3},{r:10,c:0,val:4},{r:10,c:4,val:4},{r:10,c:9,val:3},{r:11,c:2,val:1},{r:11,c:5,val:1},{r:11,c:9,val:3}], _solution:[{r1:0,c1:0,r2:3,c2:0,ni:0},{r1:0,c1:1,r2:3,c2:1,ni:1},{r1:0,c1:2,r2:2,c2:2,ni:2},{r1:0,c1:3,r2:0,c2:6,ni:3},{r1:0,c1:7,r2:1,c2:8,ni:4},{r1:0,c1:9,r2:3,c2:9,ni:5},{r1:0,c1:10,r2:1,c2:11,ni:6},{r1:1,c1:3,r2:1,c2:6,ni:7},{r1:2,c1:3,r2:5,c2:3,ni:8},{r1:2,c1:4,r2:5,c2:4,ni:9},{r1:2,c1:5,r2:2,c2:8,ni:10},{r1:2,c1:10,r2:5,c2:10,ni:11},{r1:2,c1:11,r2:5,c2:11,ni:12},{r1:3,c1:2,r2:6,c2:2,ni:13},{r1:3,c1:5,r2:6,c2:5,ni:14},{r1:3,c1:6,r2:4,c2:7,ni:15},{r1:3,c1:8,r2:6,c2:8,ni:16},{r1:4,c1:0,r2:5,c2:1,ni:17},{r1:4,c1:9,r2:7,c2:9,ni:18},{r1:5,c1:6,r2:8,c2:6,ni:19},{r1:5,c1:7,r2:7,c2:7,ni:20},{r1:6,c1:0,r2:9,c2:0,ni:21},{r1:6,c1:1,r2:9,c2:1,ni:22},{r1:6,c1:3,r2:7,c2:4,ni:23},{r1:6,c1:10,r2:7,c2:11,ni:24},{r1:7,c1:2,r2:10,c2:2,ni:25},{r1:7,c1:5,r2:10,c2:5,ni:26},{r1:7,c1:8,r2:9,c2:8,ni:27},{r1:8,c1:3,r2:9,c2:4,ni:28},{r1:8,c1:7,r2:11,c2:7,ni:29},{r1:8,c1:9,r2:9,c2:10,ni:30},{r1:8,c1:11,r2:11,c2:11,ni:31},{r1:9,c1:6,r2:11,c2:6,ni:32},{r1:10,c1:0,r2:11,c2:1,ni:33},{r1:10,c1:3,r2:11,c2:4,ni:34},{r1:10,c1:8,r2:10,c2:10,ni:35},{r1:11,c1:2,r2:11,c2:2,ni:36},{r1:11,c1:5,r2:11,c2:5,ni:37},{r1:11,c1:8,r2:11,c2:10,ni:38}] },
  { name:'الخالد', rows:12, cols:12, time:616, numbers:[{r:1,c:1,val:4},{r:1,c:2,val:3},{r:0,c:6,val:4},{r:1,c:7,val:4},{r:0,c:10,val:4},{r:1,c:11,val:4},{r:1,c:4,val:4},{r:3,c:5,val:4},{r:1,c:6,val:4},{r:4,c:0,val:4},{r:2,c:1,val:3},{r:3,c:8,val:4},{r:3,c:9,val:4},{r:3,c:2,val:4},{r:3,c:3,val:4},{r:5,c:7,val:4},{r:5,c:9,val:4},{r:4,c:11,val:4},{r:6,c:1,val:3},{r:6,c:4,val:4},{r:5,c:5,val:4},{r:7,c:6,val:4},{r:8,c:0,val:3},{r:6,c:9,val:4},{r:8,c:2,val:4},{r:10,c:4,val:4},{r:7,c:8,val:4},{r:7,c:10,val:4},{r:9,c:1,val:4},{r:10,c:11,val:4},{r:9,c:0,val:3},{r:10,c:3,val:4},{r:9,c:8,val:4},{r:10,c:9,val:4},{r:10,c:8,val:4},{r:11,c:4,val:4},{r:11,c:7,val:4},{r:11,c:10,val:1}], _solution:[{r1:0,c1:0,r2:1,c2:1,ni:0},{r1:0,c1:2,r2:2,c2:2,ni:1},{r1:0,c1:3,r2:0,c2:6,ni:2},{r1:0,c1:7,r2:1,c2:8,ni:3},{r1:0,c1:9,r2:1,c2:10,ni:4},{r1:0,c1:11,r2:3,c2:11,ni:5},{r1:1,c1:3,r2:2,c2:4,ni:6},{r1:1,c1:5,r2:4,c2:5,ni:7},{r1:1,c1:6,r2:4,c2:6,ni:8},{r1:2,c1:0,r2:5,c2:0,ni:9},{r1:2,c1:1,r2:4,c2:1,ni:10},{r1:2,c1:7,r2:3,c2:8,ni:11},{r1:2,c1:9,r2:3,c2:10,ni:12},{r1:3,c1:2,r2:6,c2:2,ni:13},{r1:3,c1:3,r2:4,c2:4,ni:14},{r1:4,c1:7,r2:5,c2:8,ni:15},{r1:4,c1:9,r2:5,c2:10,ni:16},{r1:4,c1:11,r2:7,c2:11,ni:17},{r1:5,c1:1,r2:7,c2:1,ni:18},{r1:5,c1:3,r2:6,c2:4,ni:19},{r1:5,c1:5,r2:8,c2:5,ni:20},{r1:5,c1:6,r2:8,c2:6,ni:21},{r1:6,c1:0,r2:8,c2:0,ni:22},{r1:6,c1:7,r2:6,c2:10,ni:23},{r1:7,c1:2,r2:8,c2:3,ni:24},{r1:7,c1:4,r2:10,c2:4,ni:25},{r1:7,c1:7,r2:8,c2:8,ni:26},{r1:7,c1:9,r2:8,c2:10,ni:27},{r1:8,c1:1,r2:11,c2:1,ni:28},{r1:8,c1:11,r2:11,c2:11,ni:29},{r1:9,c1:0,r2:11,c2:0,ni:30},{r1:9,c1:2,r2:10,c2:3,ni:31},{r1:9,c1:5,r2:9,c2:8,ni:32},{r1:9,c1:9,r2:10,c2:10,ni:33},{r1:10,c1:5,r2:10,c2:8,ni:34},{r1:11,c1:2,r2:11,c2:5,ni:35},{r1:11,c1:6,r2:11,c2:9,ni:36},{r1:11,c1:10,r2:11,c2:10,ni:37}] },
  { name:'الأبدية', rows:12, cols:12, time:616, numbers:[{r:0,c:3,val:4},{r:0,c:7,val:4},{r:1,c:8,val:4},{r:1,c:11,val:4},{r:1,c:1,val:4},{r:1,c:2,val:4},{r:2,c:4,val:3},{r:1,c:6,val:3},{r:2,c:5,val:2},{r:2,c:10,val:4},{r:2,c:11,val:3},{r:3,c:0,val:4},{r:4,c:5,val:3},{r:3,c:7,val:4},{r:5,c:10,val:3},{r:4,c:0,val:4},{r:4,c:4,val:4},{r:4,c:9,val:4},{r:5,c:1,val:4},{r:5,c:3,val:2},{r:8,c:6,val:4},{r:6,c:8,val:4},{r:6,c:9,val:4},{r:8,c:11,val:4},{r:6,c:2,val:4},{r:7,c:3,val:4},{r:8,c:5,val:4},{r:8,c:10,val:3},{r:7,c:0,val:4},{r:8,c:8,val:4},{r:10,c:4,val:4},{r:9,c:0,val:4},{r:9,c:6,val:4},{r:9,c:10,val:3},{r:9,c:11,val:3},{r:11,c:2,val:4},{r:10,c:7,val:4},{r:11,c:9,val:2},{r:11,c:1,val:2},{r:11,c:6,val:3},{r:11,c:8,val:1}], _solution:[{r1:0,c1:0,r2:0,c2:3,ni:0},{r1:0,c1:4,r2:0,c2:7,ni:1},{r1:0,c1:8,r2:1,c2:9,ni:2},{r1:0,c1:10,r2:1,c2:11,ni:3},{r1:1,c1:0,r2:2,c2:1,ni:4},{r1:1,c1:2,r2:2,c2:3,ni:5},{r1:1,c1:4,r2:3,c2:4,ni:6},{r1:1,c1:5,r2:1,c2:7,ni:7},{r1:2,c1:5,r2:2,c2:6,ni:8},{r1:2,c1:7,r2:2,c2:10,ni:9},{r1:2,c1:11,r2:4,c2:11,ni:10},{r1:3,c1:0,r2:3,c2:3,ni:11},{r1:3,c1:5,r2:5,c2:5,ni:12},{r1:3,c1:6,r2:3,c2:9,ni:13},{r1:3,c1:10,r2:5,c2:10,ni:14},{r1:4,c1:0,r2:4,c2:3,ni:15},{r1:4,c1:4,r2:7,c2:4,ni:16},{r1:4,c1:6,r2:4,c2:9,ni:17},{r1:5,c1:0,r2:6,c2:1,ni:18},{r1:5,c1:2,r2:5,c2:3,ni:19},{r1:5,c1:6,r2:8,c2:6,ni:20},{r1:5,c1:7,r2:6,c2:8,ni:21},{r1:5,c1:9,r2:8,c2:9,ni:22},{r1:5,c1:11,r2:8,c2:11,ni:23},{r1:6,c1:2,r2:9,c2:2,ni:24},{r1:6,c1:3,r2:9,c2:3,ni:25},{r1:6,c1:5,r2:9,c2:5,ni:26},{r1:6,c1:10,r2:8,c2:10,ni:27},{r1:7,c1:0,r2:8,c2:1,ni:28},{r1:7,c1:7,r2:8,c2:8,ni:29},{r1:8,c1:4,r2:11,c2:4,ni:30},{r1:9,c1:0,r2:10,c2:1,ni:31},{r1:9,c1:6,r2:9,c2:9,ni:32},{r1:9,c1:10,r2:11,c2:10,ni:33},{r1:9,c1:11,r2:11,c2:11,ni:34},{r1:10,c1:2,r2:11,c2:3,ni:35},{r1:10,c1:5,r2:10,c2:8,ni:36},{r1:10,c1:9,r2:11,c2:9,ni:37},{r1:11,c1:0,r2:11,c2:1,ni:38},{r1:11,c1:5,r2:11,c2:7,ni:39},{r1:11,c1:8,r2:11,c2:8,ni:40}] },
  { name:'ما لا نهاية', rows:12, cols:12, time:616, numbers:[{r:0,c:1,val:4},{r:0,c:3,val:3},{r:0,c:6,val:4},{r:1,c:9,val:4},{r:2,c:10,val:4},{r:0,c:11,val:3},{r:1,c:4,val:4},{r:2,c:6,val:4},{r:3,c:7,val:4},{r:4,c:8,val:4},{r:3,c:0,val:4},{r:2,c:4,val:4},{r:5,c:5,val:4},{r:3,c:2,val:3},{r:6,c:4,val:4},{r:6,c:11,val:4},{r:5,c:1,val:4},{r:4,c:3,val:4},{r:5,c:9,val:3},{r:5,c:10,val:4},{r:6,c:6,val:4},{r:5,c:8,val:4},{r:6,c:0,val:3},{r:6,c:2,val:4},{r:7,c:5,val:3},{r:9,c:4,val:4},{r:8,c:7,val:4},{r:9,c:9,val:4},{r:8,c:11,val:4},{r:11,c:1,val:4},{r:10,c:2,val:4},{r:11,c:3,val:4},{r:11,c:10,val:4},{r:11,c:0,val:3},{r:9,c:6,val:4},{r:10,c:7,val:4},{r:11,c:5,val:4},{r:11,c:8,val:2},{r:11,c:11,val:1}], _solution:[{r1:0,c1:0,r2:1,c2:1,ni:0},{r1:0,c1:2,r2:0,c2:4,ni:1},{r1:0,c1:5,r2:0,c2:8,ni:2},{r1:0,c1:9,r2:3,c2:9,ni:3},{r1:0,c1:10,r2:3,c2:10,ni:4},{r1:0,c1:11,r2:2,c2:11,ni:5},{r1:1,c1:2,r2:1,c2:5,ni:6},{r1:1,c1:6,r2:4,c2:6,ni:7},{r1:1,c1:7,r2:4,c2:7,ni:8},{r1:1,c1:8,r2:4,c2:8,ni:9},{r1:2,c1:0,r2:5,c2:0,ni:10},{r1:2,c1:1,r2:2,c2:4,ni:11},{r1:2,c1:5,r2:5,c2:5,ni:12},{r1:3,c1:1,r2:3,c2:3,ni:13},{r1:3,c1:4,r2:6,c2:4,ni:14},{r1:3,c1:11,r2:6,c2:11,ni:15},{r1:4,c1:1,r2:7,c2:1,ni:16},{r1:4,c1:2,r2:5,c2:3,ni:17},{r1:4,c1:9,r2:6,c2:9,ni:18},{r1:4,c1:10,r2:7,c2:10,ni:19},{r1:5,c1:6,r2:6,c2:7,ni:20},{r1:5,c1:8,r2:8,c2:8,ni:21},{r1:6,c1:0,r2:8,c2:0,ni:22},{r1:6,c1:2,r2:7,c2:3,ni:23},{r1:6,c1:5,r2:8,c2:5,ni:24},{r1:7,c1:4,r2:10,c2:4,ni:25},{r1:7,c1:6,r2:8,c2:7,ni:26},{r1:7,c1:9,r2:10,c2:9,ni:27},{r1:7,c1:11,r2:10,c2:11,ni:28},{r1:8,c1:1,r2:11,c2:1,ni:29},{r1:8,c1:2,r2:11,c2:2,ni:30},{r1:8,c1:3,r2:11,c2:3,ni:31},{r1:8,c1:10,r2:11,c2:10,ni:32},{r1:9,c1:0,r2:11,c2:0,ni:33},{r1:9,c1:5,r2:10,c2:6,ni:34},{r1:9,c1:7,r2:10,c2:8,ni:35},{r1:11,c1:4,r2:11,c2:7,ni:36},{r1:11,c1:8,r2:11,c2:9,ni:37},{r1:11,c1:11,r2:11,c2:11,ni:38}] },
  { name:'العرش', rows:12, cols:12, time:616, numbers:[{r:0,c:1,val:4},{r:0,c:4,val:4},{r:0,c:8,val:3},{r:0,c:10,val:4},{r:2,c:11,val:3},{r:3,c:2,val:4},{r:1,c:4,val:4},{r:2,c:7,val:4},{r:2,c:1,val:4},{r:2,c:5,val:4},{r:3,c:9,val:4},{r:4,c:10,val:4},{r:3,c:5,val:4},{r:4,c:7,val:4},{r:5,c:8,val:3},{r:4,c:11,val:4},{r:6,c:0,val:4},{r:7,c:1,val:4},{r:4,c:4,val:4},{r:5,c:5,val:4},{r:5,c:6,val:3},{r:6,c:4,val:4},{r:9,c:8,val:4},{r:6,c:9,val:4},{r:9,c:2,val:3},{r:7,c:3,val:4},{r:9,c:4,val:4},{r:10,c:5,val:4},{r:8,c:7,val:4},{r:8,c:11,val:4},{r:8,c:1,val:4},{r:8,c:6,val:4},{r:8,c:10,val:4},{r:11,c:1,val:4},{r:11,c:2,val:2},{r:11,c:9,val:4},{r:10,c:10,val:1},{r:11,c:3,val:2},{r:11,c:5,val:1},{r:11,c:7,val:1},{r:11,c:11,val:2}], _solution:[{r1:0,c1:0,r2:1,c2:1,ni:0},{r1:0,c1:2,r2:0,c2:5,ni:1},{r1:0,c1:6,r2:0,c2:8,ni:2},{r1:0,c1:9,r2:1,c2:10,ni:3},{r1:0,c1:11,r2:2,c2:11,ni:4},{r1:1,c1:2,r2:4,c2:2,ni:5},{r1:1,c1:3,r2:1,c2:6,ni:6},{r1:1,c1:7,r2:2,c2:8,ni:7},{r1:2,c1:0,r2:3,c2:1,ni:8},{r1:2,c1:3,r2:2,c2:6,ni:9},{r1:2,c1:9,r2:5,c2:9,ni:10},{r1:2,c1:10,r2:5,c2:10,ni:11},{r1:3,c1:3,r2:3,c2:6,ni:12},{r1:3,c1:7,r2:6,c2:7,ni:13},{r1:3,c1:8,r2:5,c2:8,ni:14},{r1:3,c1:11,r2:6,c2:11,ni:15},{r1:4,c1:0,r2:7,c2:0,ni:16},{r1:4,c1:1,r2:7,c2:1,ni:17},{r1:4,c1:3,r2:4,c2:6,ni:18},{r1:5,c1:2,r2:5,c2:5,ni:19},{r1:5,c1:6,r2:7,c2:6,ni:20},{r1:6,c1:2,r2:6,c2:5,ni:21},{r1:6,c1:8,r2:9,c2:8,ni:22},{r1:6,c1:9,r2:7,c2:10,ni:23},{r1:7,c1:2,r2:9,c2:2,ni:24},{r1:7,c1:3,r2:10,c2:3,ni:25},{r1:7,c1:4,r2:10,c2:4,ni:26},{r1:7,c1:5,r2:10,c2:5,ni:27},{r1:7,c1:7,r2:10,c2:7,ni:28},{r1:7,c1:11,r2:10,c2:11,ni:29},{r1:8,c1:0,r2:9,c2:1,ni:30},{r1:8,c1:6,r2:11,c2:6,ni:31},{r1:8,c1:9,r2:9,c2:10,ni:32},{r1:10,c1:0,r2:11,c2:1,ni:33},{r1:10,c1:2,r2:11,c2:2,ni:34},{r1:10,c1:8,r2:11,c2:9,ni:35},{r1:10,c1:10,r2:10,c2:10,ni:36},{r1:11,c1:3,r2:11,c2:4,ni:37},{r1:11,c1:5,r2:11,c2:5,ni:38},{r1:11,c1:7,r2:11,c2:7,ni:39},{r1:11,c1:10,r2:11,c2:11,ni:40}] },
  { name:'الأسطورة الكبرى', rows:12, cols:12, time:616, numbers:[{r:0,c:0,val:4},{r:0,c:2,val:4},{r:1,c:3,val:4},{r:0,c:5,val:3},{r:3,c:8,val:4},{r:0,c:9,val:4},{r:1,c:11,val:4},{r:1,c:7,val:3},{r:2,c:1,val:4},{r:3,c:5,val:4},{r:2,c:7,val:4},{r:3,c:10,val:4},{r:3,c:1,val:4},{r:5,c:2,val:4},{r:4,c:3,val:4},{r:6,c:4,val:4},{r:5,c:0,val:3},{r:5,c:6,val:4},{r:4,c:8,val:4},{r:4,c:10,val:4},{r:4,c:11,val:4},{r:6,c:5,val:4},{r:7,c:7,val:3},{r:7,c:8,val:3},{r:7,c:9,val:4},{r:7,c:0,val:4},{r:7,c:3,val:3},{r:9,c:4,val:4},{r:11,c:1,val:4},{r:9,c:2,val:3},{r:11,c:3,val:4},{r:8,c:6,val:4},{r:8,c:10,val:4},{r:9,c:11,val:4},{r:9,c:8,val:4},{r:11,c:6,val:4},{r:10,c:9,val:2},{r:11,c:0,val:1},{r:11,c:2,val:1},{r:11,c:4,val:1},{r:11,c:8,val:2}], _solution:[{r1:0,c1:0,r2:3,c2:0,ni:0},{r1:0,c1:1,r2:1,c2:2,ni:1},{r1:0,c1:3,r2:1,c2:4,ni:2},{r1:0,c1:5,r2:0,c2:7,ni:3},{r1:0,c1:8,r2:3,c2:8,ni:4},{r1:0,c1:9,r2:1,c2:10,ni:5},{r1:0,c1:11,r2:3,c2:11,ni:6},{r1:1,c1:5,r2:1,c2:7,ni:7},{r1:2,c1:1,r2:2,c2:4,ni:8},{r1:2,c1:5,r2:3,c2:6,ni:9},{r1:2,c1:7,r2:5,c2:7,ni:10},{r1:2,c1:9,r2:3,c2:10,ni:11},{r1:3,c1:1,r2:6,c2:1,ni:12},{r1:3,c1:2,r2:6,c2:2,ni:13},{r1:3,c1:3,r2:6,c2:3,ni:14},{r1:3,c1:4,r2:6,c2:4,ni:15},{r1:4,c1:0,r2:6,c2:0,ni:16},{r1:4,c1:5,r2:5,c2:6,ni:17},{r1:4,c1:8,r2:5,c2:9,ni:18},{r1:4,c1:10,r2:7,c2:10,ni:19},{r1:4,c1:11,r2:7,c2:11,ni:20},{r1:6,c1:5,r2:7,c2:6,ni:21},{r1:6,c1:7,r2:8,c2:7,ni:22},{r1:6,c1:8,r2:8,c2:8,ni:23},{r1:6,c1:9,r2:9,c2:9,ni:24},{r1:7,c1:0,r2:10,c2:0,ni:25},{r1:7,c1:1,r2:7,c2:3,ni:26},{r1:7,c1:4,r2:10,c2:4,ni:27},{r1:8,c1:1,r2:11,c2:1,ni:28},{r1:8,c1:2,r2:10,c2:2,ni:29},{r1:8,c1:3,r2:11,c2:3,ni:30},{r1:8,c1:5,r2:9,c2:6,ni:31},{r1:8,c1:10,r2:11,c2:10,ni:32},{r1:8,c1:11,r2:11,c2:11,ni:33},{r1:9,c1:7,r2:10,c2:8,ni:34},{r1:10,c1:5,r2:11,c2:6,ni:35},{r1:10,c1:9,r2:11,c2:9,ni:36},{r1:11,c1:0,r2:11,c2:0,ni:37},{r1:11,c1:2,r2:11,c2:2,ni:38},{r1:11,c1:4,r2:11,c2:4,ni:39},{r1:11,c1:7,r2:11,c2:8,ni:40}] },
];

// ✅ المراحل تحتوي 100 مستوى، لكن DIFFICULTY فيه 75 فقط → نُكمل البقية كـ"صعب"
// (المراحل 76→100 هي الأكبر حجماً 11×11 و12×12 = الأصعب، فيتدرّج الترتيب: الأول أسهل، الأخير أصعب)
while(DIFFICULTY.length<PUZZLES.length) DIFFICULTY.push('hard');

const SHOP_ITEMS = [
  { key:'hint',      icon:'💡', name:'تلميح',      desc:'يحل منطقة واحدة تلقائياً عند التعلّق',          price:400 },
  { key:'extraTime', icon:'⏱️', name:'وقت إضافي',  desc:'يضيف 30 ثانية للمؤقت فوراً',                    price:500 },
  { key:'shield',    icon:'🛡️', name:'حماية',      desc:'إذا انتهى الوقت لا تخسر قلباً (يُحفظ قلبك)',     price:600 },
  { key:'bundle',    icon:'🎁', name:'حزمة مميزة', desc:'2 تلميح + 1 حماية + 2 وقت إضافي',              price:800, bundle:{hint:2,shield:1,extraTime:2} },
];

// ═══════════ ACHIEVEMENTS ═══════════
const ACHIEVEMENTS = [
  { id:'first_win',  icon:'🎯', name:'الخطوة الأولى', desc:'أكمل أول مستوى',               target:1,   type:'completed',        reward:{coins:20} },
  { id:'five',       icon:'🖐️', name:'بداية قوية',    desc:'أكمل 5 مستويات',               target:5,   type:'completed',        reward:{coins:50} },
  { id:'ten',        icon:'🔟', name:'محترف',         desc:'أكمل 10 مستويات',              target:10,  type:'completed',        reward:{coins:100,avatar:'⚡'} },
  { id:'tf',         icon:'🎖️', name:'مثابر',         desc:'أكمل 25 مستوى',                target:25,  type:'completed',        reward:{coins:150,avatar:'🦂'} },
  { id:'fifty',      icon:'🏆', name:'بطل الشبكة',    desc:'أكمل 50 مستوى',                target:50,  type:'completed',        reward:{coins:250,avatar:'🐲'} },
  { id:'all',        icon:'👑', name:'الملك',         desc:'أكمل كل المستويات الـ100',     target:100, type:'completed',        reward:{coins:500,avatar:'🎭'} },
  { id:'s3',         icon:'🔥', name:'مشتعل',         desc:'حقق سلسلة 3',                  target:3,   type:'maxStreak',        reward:{coins:40} },
  { id:'s5',         icon:'🌋', name:'لا يُوقف',       desc:'حقق سلسلة 5',                  target:5,   type:'maxStreak',        reward:{coins:80,avatar:'🌊'} },
  { id:'s10',        icon:'☄️', name:'إعصار',         desc:'حقق سلسلة 10',                 target:10,  type:'maxStreak',        reward:{coins:160,avatar:'🦈'} },
  { id:'p3',         icon:'⭐', name:'الكمال',        desc:'3 نجوم في 3 مستويات',          target:3,   type:'perfectCount',     reward:{coins:60} },
  { id:'p15',        icon:'🌟', name:'النجم الساطع',  desc:'3 نجوم في 15 مستوى',           target:15,  type:'perfectCount',     reward:{coins:200} },
  { id:'exp5',       icon:'🔴', name:'خبير حقيقي',    desc:'افز بـ5 مستويات (خبير)',       target:5,   type:'expertWins',       reward:{coins:150,avatar:'💀'} },
  { id:'inf10',      icon:'♾️', name:'بلا حدود',      desc:'صِل للغز #10 لا نهائي',         target:10,  type:'infiniteBest',     reward:{coins:120,avatar:'👾'} },
  { id:'rich',       icon:'💰', name:'ثري',           desc:'اجمع 500 عملة',                target:500, type:'totalCoinsEarned', reward:{coins:100,avatar:'🐉'} },
  { id:'rich2',      icon:'💎', name:'فاحش الثراء',   desc:'اجمع 2000 عملة',               target:2000,type:'totalCoinsEarned', reward:{coins:300,avatar:'👑'} },
  { id:'d3',         icon:'📅', name:'منتظم',         desc:'العب 3 تحديات يومية',          target:3,   type:'dailyPlayed',      reward:{coins:75} },
  { id:'d7',         icon:'🗓️', name:'الملتزم',       desc:'العب 7 تحديات يومية',          target:7,   type:'dailyPlayed',      reward:{coins:150} },
];

// ═══════════ WEEKLY MISSIONS ═══════════
const MISSION_POOL = [
  { id:'win_levels',   icon:'🎯', text:'أكمل {t} مستويات',         targets:[5,8,12],   metric:'levelWin' },
  { id:'earn_stars',   icon:'⭐', text:'اجمع {t} نجمة',            targets:[10,18,25], metric:'stars' },
  { id:'perfect_wins', icon:'🌟', text:'احصل على 3 نجوم {t} مرات', targets:[3,5,8],    metric:'perfect' },
  { id:'expert_wins',  icon:'🔴', text:'افز {t} مرات بوضع الخبير', targets:[2,3,5],    metric:'expert' },
  { id:'big_combo',    icon:'🎇', text:'حقق كومبو {t} في مستوى',   targets:[4,5,6],    metric:'maxCombo' },
  { id:'play_games',   icon:'🎮', text:'العب {t} مباريات',         targets:[8,12,18],  metric:'games' },
];
const MISSION_REWARDS = [ {coins:60,xp:40}, {coins:100,xp:70}, {coins:180,xp:120} ];

// ═══════════ PLAYER STATE ═══════════
const DEFAULT_PLAYER = {
  name:'اللاعب', level:1, xp:0, coins:0, avatar:'😎',
  completedLevels:[], stars:{}, inventory:{}, unlockedAvatars:['😎'],
  bestTimes:{}, streak:0, maxStreak:0, totalPlayed:0,
  totalCoinsEarned:0, perfectCount:0, dailyPlayed:0,
  unlockedAchievements:[], lastDailyDate:null, dailyStreak:0,
  expertWins:0, infiniteBest:0,
  hearts:5, lastHeartTime:0,   // ✅ نظام القلوب: 5 قلوب، يتجدّد قلب كل 20 دقيقة
  missionWeek:null, missions:null, missionProgress:{}, missionsClaimed:[],
  rewardedLevels:{},   // ✅ يسجّل أي (مرحلة+صعوبة) أُعطيت مكافأتها — لمنع التكرار اللانهائي
};
let player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
function savePlayer(){ try{ localStorage.setItem('shikaku_v4',JSON.stringify(player)); }catch(e){} }
function loadPlayer(){ try{ const d=localStorage.getItem('shikaku_v4'); if(d) player=Object.assign(JSON.parse(JSON.stringify(DEFAULT_PLAYER)),JSON.parse(d)); }catch(e){} }

// ═══════════ HEARTS SYSTEM (نظام القلوب) ═══════════
const MAX_HEARTS=5;                 // أقصى عدد قلوب
const HEART_REGEN_MS=20*60*1000;    // 20 دقيقة لكل قلب
// نحسب القلوب المستردّة بناءً على الوقت المنقضي (يعمل حتى لو أُغلق التطبيق)
function refreshHearts(){
  if(player.hearts>=MAX_HEARTS){ player.lastHeartTime=0; return; }
  if(!player.lastHeartTime){ player.lastHeartTime=Date.now(); savePlayer(); return; }
  const elapsed=Date.now()-player.lastHeartTime;
  const gained=Math.floor(elapsed/HEART_REGEN_MS);
  if(gained>0){
    player.hearts=Math.min(MAX_HEARTS,player.hearts+gained);
    // نحتفظ بالوقت المتبقّي من آخر فترة (لئلا نخسر الكسر)
    player.lastHeartTime=player.hearts>=MAX_HEARTS?0:player.lastHeartTime+gained*HEART_REGEN_MS;
    savePlayer();
  }
}
// الوقت المتبقّي (ms) لاسترداد القلب التالي
function timeToNextHeart(){
  if(player.hearts>=MAX_HEARTS||!player.lastHeartTime) return 0;
  return Math.max(0,HEART_REGEN_MS-(Date.now()-player.lastHeartTime));
}
// خسارة قلب (تُستدعى عند الخسارة)
function loseHeart(){
  refreshHearts();
  if(player.hearts>0){
    if(player.hearts===MAX_HEARTS) player.lastHeartTime=Date.now(); // نبدأ عدّاد التجديد من أول خسارة
    player.hearts--;
    savePlayer();
  }
  updateHeartsUI();
}
// تحديث عرض القلوب في كل الشاشات
function updateHeartsUI(){
  refreshHearts();
  const txt='❤️'.repeat(player.hearts)+'🖤'.repeat(MAX_HEARTS-player.hearts);
  document.querySelectorAll('.hearts-display').forEach(el=>el.textContent=txt);
  // مؤقّت التجديد
  const ms=timeToNextHeart();
  document.querySelectorAll('.hearts-timer').forEach(el=>{
    if(player.hearts>=MAX_HEARTS) el.textContent='القلوب ممتلئة';
    else { const m=Math.floor(ms/60000),s=Math.floor((ms%60000)/1000); el.textContent='القلب التالي بعد '+m+':'+String(s).padStart(2,'0'); }
  });
}
// نشغّل عدّاداً يحدّث القلوب كل ثانية على الشاشة الرئيسية
let heartTimer=setInterval(()=>{ if(document.getElementById('home-screen')&&document.getElementById('home-screen').classList.contains('active')) updateHeartsUI(); },1000);
// التحقق قبل بدء أي مرحلة: هل يملك قلباً؟
function hasHeart(){ refreshHearts(); return player.hearts>0; }

// ═══════════ SOUND ═══════════
let soundOn=true, audioCtx=null;
function loadSound(){ soundOn=localStorage.getItem('shikaku_sound')!=='off'; updateSoundBtn(); }
function updateSoundBtn(){ const b=document.getElementById('sound-btn'); if(b) b.textContent=soundOn?'🔊':'🔇'; }
function toggleSound(){ soundOn=!soundOn; localStorage.setItem('shikaku_sound',soundOn?'on':'off'); updateSoundBtn(); if(soundOn) playSound('click'); }
function ensureAudio(){ if(!audioCtx){ try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } }
function tone(f,d,t='sine',v=0.15){ if(!soundOn)return; ensureAudio(); if(!audioCtx)return; const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.type=t; o.frequency.value=f; o.connect(g); g.connect(audioCtx.destination); g.gain.setValueAtTime(v,audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d); o.start(); o.stop(audioCtx.currentTime+d); }
function playSound(type){
  if(!soundOn)return;
  switch(type){
    case 'place':   tone(440,.12,'triangle',.12); break;
    case 'combo':   tone(660,.1,'square',.1); setTimeout(()=>tone(880,.12,'square',.1),60); break;
    case 'error':   tone(160,.18,'sawtooth',.12); break;
    case 'win':     [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.2,'triangle',.13),i*90)); break;
    case 'lose':    [392,330,262].forEach((f,i)=>setTimeout(()=>tone(f,.25,'sine',.12),i*120)); break;
    case 'levelup': [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>tone(f,.18,'triangle',.13),i*70)); break;
    case 'coin':    tone(880,.08,'square',.08); setTimeout(()=>tone(1175,.1,'square',.08),50); break;
    case 'click':   tone(330,.05,'sine',.06); break;
    case 'achieve': [659,784,988,1319].forEach((f,i)=>setTimeout(()=>tone(f,.2,'triangle',.14),i*80)); break;
  }
}
function vibrate(ms){ if(navigator.vibrate) try{ navigator.vibrate(ms); }catch(e){} }

// ═══════════ THEME ═══════════
let isDark=true;
function loadTheme(){ isDark=(localStorage.getItem('shikaku_theme')||'dark')==='dark'; applyTheme(); }
function applyTheme(){ document.body.setAttribute('data-theme',isDark?'dark':'light'); ['theme-icon','theme-icon3'].forEach(id=>{const e=document.getElementById(id); if(e) e.textContent=isDark?'☀️':'🌙';}); }
function toggleTheme(){ isDark=!isDark; localStorage.setItem('shikaku_theme',isDark?'dark':'light'); applyTheme(); playSound('click'); }

// ═══════════ SEEDED RNG (deterministic) ═══════════
function seededRng(seed){ let s=(seed>>>0)||1; return ()=>{ s=(Math.imul(s,1664525)+1013904223)>>>0; return s/4294967296; }; }

// ═══════════ SOLVER ═══════════
function solvePuzzle(puz){
  const {rows,cols,numbers}=puz;
  const board=new Array(rows*cols).fill(-1);
  function rects(ni){ const n=numbers[ni],out=[]; for(let r1=0;r1<rows;r1++)for(let c1=0;c1<cols;c1++)for(let r2=r1;r2<rows;r2++)for(let c2=c1;c2<cols;c2++){ if((r2-r1+1)*(c2-c1+1)!==n.val)continue; if(n.r<r1||n.r>r2||n.c<c1||n.c>c2)continue; out.push({r1,c1,r2,c2}); } return out; }
  const AR=numbers.map((_,i)=>rects(i));
  const order=numbers.map((_,i)=>i).sort((a,b)=>AR[a].length-AR[b].length);
  const can=(rc,b)=>{ for(let r=rc.r1;r<=rc.r2;r++)for(let c=rc.c1;c<=rc.c2;c++)if(b[r*cols+c]!==-1)return false; return true; };
  const put=(rc,ri,b)=>{ for(let r=rc.r1;r<=rc.r2;r++)for(let c=rc.c1;c<=rc.c2;c++)b[r*cols+c]=ri; };
  const rem=(rc,b)=>{ for(let r=rc.r1;r<=rc.r2;r++)for(let c=rc.c1;c<=rc.c2;c++)b[r*cols+c]=-1; };
  let sol=null, nodes=0;
  function bt(k){ if(++nodes>2000000) return true; if(k===order.length){ if(board.every(v=>v!==-1)){ sol=board.slice(); return true; } return false; } const ni=order[k]; for(const rc of AR[ni]) if(can(rc,board)){ put(rc,ni,board); if(bt(k+1)) return true; rem(rc,board); } return false; }
  bt(0);
  if(!sol) return null;
  return numbers.map((_,ni)=>{ let r1=rows,c1=cols,r2=0,c2=0; for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(sol[r*cols+c]===ni){r1=Math.min(r1,r);c1=Math.min(c1,c);r2=Math.max(r2,r);c2=Math.max(c2,c);} return {r1,c1,r2,c2,ni}; });
}

// ═══════════ INFINITE PUZZLE GENERATOR (deterministic by N) ═══════════
function genInfinitePuzzle(n){
  const tier=Math.min(Math.floor((n-1)/8),5);
  const size=4+tier; // 4x4 .. 9x9 (kept solver-friendly)
  const maxRect=size<=5?3:4;
  // try many deterministic seeds; return the FIRST that the solver verifies.
  for(let attempt=0;attempt<400;attempt++){
    const rand=seededRng(900000+n*2654435761+attempt*40503);
    const ri=k=>Math.floor(rand()*k);
    const board=Array.from({length:size},()=>new Array(size).fill(-1));
    const regions=[]; let rid=0,ok=true;
    for(let r=0;r<size&&ok;r++)for(let c=0;c<size;c++){
      if(board[r][c]!==-1)continue;
      const sizes=[];
      for(let h=1;h<=Math.min(maxRect,size-r);h++)for(let w=1;w<=Math.min(maxRect,size-c);w++) if(h*w<=maxRect*2) sizes.push([h,w]);
      for(let i=sizes.length-1;i>0;i--){const j=ri(i+1);[sizes[i],sizes[j]]=[sizes[j],sizes[i]];}
      sizes.sort((a,b)=>(Math.abs(a[0]*a[1]-4)+rand()*3)-(Math.abs(b[0]*b[1]-4)+rand()*3));
      let placed=false;
      for(const[h,w]of sizes){ let fits=true; for(let rr=r;rr<r+h&&fits;rr++)for(let cc=c;cc<c+w;cc++)if(board[rr][cc]!==-1){fits=false;break;} if(!fits)continue; for(let rr=r;rr<r+h;rr++)for(let cc=c;cc<c+w;cc++)board[rr][cc]=rid; regions.push({r1:r,c1:c,r2:r+h-1,c2:c+w-1,val:h*w}); rid++; placed=true; break; }
      if(!placed){ok=false;break;}
    }
    if(!ok||regions.length<3)continue;
    const numbers=regions.map(reg=>({r:reg.r1+ri(reg.r2-reg.r1+1),c:reg.c1+ri(reg.c2-reg.c1+1),val:reg.val}));
    // ✅ الحل مضمون بالبناء: نفس صيغة solvePuzzle ({r1,c1,r2,c2,ni}) — ترتيب regions يطابق numbers
    const solution=regions.map((reg,i)=>({r1:reg.r1,c1:reg.c1,r2:reg.r2,c2:reg.c2,ni:i}));
    // التقسيم صالح بالبناء (يغطي كل الخلايا دون تداخل) → نتخطّى الحلّال نهائياً (تحسين أداء)
    return { rows:size, cols:size, time:Math.round(size*size*4+40), numbers, _solution:solution, name:'لغز لا نهائي #'+n };
  }
  // fallback: smaller guaranteed-simple grid
  const fr=seededRng(123457+n);
  const sz=4; const b=Array.from({length:sz},()=>new Array(sz).fill(-1)); const regs=[]; let id=0;
  for(let r=0;r<sz;r++)for(let c=0;c<sz;c++){ if(b[r][c]!==-1)continue; const h=Math.min(1+Math.floor(fr()*2),sz-r),w=Math.min(1+Math.floor(fr()*2),sz-c); for(let rr=r;rr<r+h;rr++)for(let cc=c;cc<c+w;cc++)b[rr][cc]=id; regs.push({r1:r,c1:c,r2:r+h-1,c2:c+w-1,val:h*w}); id++; }
  const nums=regs.map(g=>({r:g.r1,c:g.c1,val:g.val}));
  // ✅ التقاط الحل بالبناء في الـ fallback أيضاً
  const sol=regs.map((g,i)=>({r1:g.r1,c1:g.c1,r2:g.r2,c2:g.c2,ni:i}));
  return { rows:sz, cols:sz, time:120, numbers:nums, _solution:sol, name:'لغز لا نهائي #'+n };
}

// ═══════════ SCREENS ═══════════
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  playSound('click');
  if(id==='home-screen')         updateHomeUI();
  if(id==='levels-screen')       renderLevels();
  if(id==='profile-screen')      renderProfile();
  if(id==='shop-screen')         renderShop();
  if(id==='achievements-screen') renderAchievements();
  if(id==='missions-screen')     renderMissions();
}

// ═══════════ HOME UI ═══════════
function updateHomeUI(){
  // ✅ البروفايل الجديد في الزاوية
  document.getElementById('home-player-name').textContent=player.name;
  document.getElementById('home-level-txt').textContent='Lv.'+player.level;
  document.getElementById('home-coins').textContent='🪙 '+player.coins;
  document.getElementById('home-avatar').textContent=player.avatar;
  // الإحصائيات
  document.getElementById('stat-completed').textContent=player.completedLevels.length;
  document.getElementById('stat-streak').textContent=player.streak;
  document.getElementById('stat-infinite').textContent=player.infiniteBest||0;
  // التحدي اليومي والمهام
  document.getElementById('daily-teaser-status').textContent=isDailyDone()?'✓ تم اليوم — عُد غداً':'مكافأة كبيرة!';
  updateHeartsUI();
  ensureMissions();
  const claimable=player.missions.filter(m=>(player.missionProgress[m.id]||0)>=m.target&&!player.missionsClaimed.includes(m.id)).length;
  document.getElementById('missions-teaser').textContent=claimable>0?(claimable+' جاهزة للاستلام! 🎁'):'3 مهام بانتظارك';
}
function setXpBar(barId,txtId,maxId){
  const lvl=player.level,xp=player.xp;
  const a=XP_PER_LEVEL[Math.min(lvl-1,XP_PER_LEVEL.length-1)]||0;
  const b=XP_PER_LEVEL[Math.min(lvl,XP_PER_LEVEL.length-1)]||a+2000;
  const pct=b>a?Math.min(100,((xp-a)/(b-a))*100):100;
  document.getElementById(barId).style.width=pct+'%';
  document.getElementById(txtId).textContent=xp+' XP';
  document.getElementById(maxId).textContent=b+' XP';
}

// ═══════════ LEVELS ═══════════
function renderLevels(){
  document.getElementById('levels-coins').textContent='🪙 '+player.coins;
  const done=player.completedLevels.length;
  document.getElementById('levels-progress-fill').style.width=(done/PUZZLES.length*100)+'%';
  document.getElementById('levels-progress-txt').textContent=done+' / '+PUZZLES.length;
  const grid=document.getElementById('levels-grid'); grid.innerHTML='';
  PUZZLES.forEach((puz,i)=>{
    const unlocked=i===0||player.completedLevels.includes(i-1);
    const isDone=player.completedLevels.includes(i);
    const stars=player.stars[i]||0;
    const diff=DIFFICULTY[i]||'medium';
    const dl={easy:'سهل',medium:'متوسط',hard:'صعب'}[diff];
    const card=document.createElement('div');
    card.className='level-card'+(isDone?' completed':'')+(unlocked?'':' locked');
    card.innerHTML=`<div class="level-diff diff-${diff}">${dl}</div>${isDone?'<div class="level-done-badge">✓</div>':''}<div class="level-num">${i+1}</div><div class="level-name">${puz.name}</div><div class="level-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><div class="level-size-badge">${puz.rows}×${puz.cols}</div>${unlocked?'':'<div style="font-size:1.1rem;margin-top:4px">🔒</div>'}`;
    if(unlocked) card.onclick=()=>openModePicker(i);
    grid.appendChild(card);
  });
}

// ═══════════ GAME STATE ═══════════
let currentLevel=0, timerInterval=null, timeLeft=0, totalTime=0;
let dragStart=null, isDragging=false;
let completedRegions=[], cells=[], puzzle=null, selectedAvatar=null;
let shieldActive=false, combo=0, comboMultiplier=1, timerPaused=false;
// ✅ timerStarted: هل بدأ الوقت (لمَس اللاعب الشبكة)؟  levelWon: هل فاز بالمرحلة؟
// خصم القلب عند الخروج يعتمد الآن على timerStarted (لا على وجود تحديد)
let timerStarted=false, levelWon=false;
let isDailyMode=false, isInfiniteMode=false, infiniteLevel=1;
let currentMode='normal', maxComboReached=0, moveHistory=[];
// ✅ عدد مرات التراجع المتبقية حسب الصعوبة: سهل=2، عادي=1، خبير=0
let undoLeft=1;

// ═══════════ DYNAMIC GRID SIZING (fits iPhone + iPad) ═══════════
function computeCellSize(rows,cols){
  const vw=window.innerWidth, vh=window.innerHeight;
  // available area: full width minus padding, height minus topbar+combo+pips+actions
  const availW=Math.min(vw,720)-28;
  const availH=vh-(64+44+44+58+40); // topbar, combo, pips, actions, breathing room
  const gap=3, pad=14;
  const cw=Math.floor((availW-pad-gap*(cols-1))/cols);
  const ch=Math.floor((availH-pad-gap*(rows-1))/rows);
  let cell=Math.min(cw,ch);
  cell=Math.max(20,Math.min(cell,64)); // clamp 20..64px
  document.documentElement.style.setProperty('--cell',cell+'px');
}

// ═══════════ START LEVEL ═══════════
function startLevel(idx){
  if(!hasHeart()){ showHeartsEmpty(); return; }   // ✅ لا قلوب = لا لعب
  isDailyMode=false; isInfiniteMode=false; currentLevel=idx;
  puzzle=JSON.parse(JSON.stringify(PUZZLES[idx]));
  beginPuzzle(DIFF_MODES[currentMode]||DIFF_MODES.normal, false);
  const mode=DIFF_MODES[currentMode]||DIFF_MODES.normal;
  document.getElementById('game-badge').textContent=mode.icon+' L'+(idx+1);
  document.getElementById('game-level-name').textContent=puzzle.name;
}
function startDaily(){
  isDailyMode=true; isInfiniteMode=false;
  puzzle=JSON.parse(JSON.stringify(dailyPuzzle));
  beginPuzzle(DIFF_MODES.normal, true);
  document.getElementById('game-badge').textContent='📅';
  document.getElementById('game-level-name').textContent='التحدي اليومي';
}
function startInfinite(n){
  isInfiniteMode=true; isDailyMode=false; infiniteLevel=n;
  const p=genInfinitePuzzle(n);
  if(!p){ showToast('تعذّر توليد اللغز','error','❌'); return; }
  puzzle=p;
  beginPuzzle(DIFF_MODES.normal, true);
  document.getElementById('game-badge').textContent='♾️ #'+n;
  document.getElementById('game-level-name').textContent='الوضع اللانهائي';
}
function beginPuzzle(mode, isSpecial){
  completedRegions=[]; shieldActive=false; combo=0; comboMultiplier=1; maxComboReached=0; moveHistory=[];
  paidHeartThisSession = false; // ✅ تصفير عند بدء كل مرحلة جديدة
  timerStarted=false; levelWon=false; // ✅ الوقت مُجمَّد حتى أول لمسة، ولم يُفز بعد
  // ✅ عدد التراجع حسب الصعوبة: سهل=2، عادي=1، خبير=0 (في اللانهائي/اليومي نعامله كعادي)
  const effMode=isSpecial?'normal':currentMode;
  undoLeft=effMode==='easy'?2:effMode==='expert'?0:1;
  // ✅ إن حمل اللغز حلّاً جاهزاً (اللانهائي) نستخدمه؛ وإلا نحلّ (المراحل الـ75 + اليومي)
  if(!puzzle._solution) puzzle._solution=solvePuzzle(puzzle);
  if(!puzzle._solution){ showToast('خطأ في اللغز!','error','❌'); return; }
  showScreen('game-screen');
  updateItemCounts();
  document.getElementById('shield-bar').classList.remove('on');
  updateComboUI(); updateUndoBtn();
  computeCellSize(puzzle.rows,puzzle.cols);
  buildGrid(); renderProgress();
  const t=isSpecial?puzzle.time:Math.round(puzzle.time*mode.timeMul);
  startTimer(t);
  showToast('المس الشبكة لبدء الوقت','info','👆'); // ✅ تنبيه أن الوقت مُجمَّد حتى أول لمسة
}
function updateItemCounts(){
  document.getElementById('hint-count').textContent='('+(player.inventory.hint||0)+')';
  document.getElementById('shield-count').textContent='('+(player.inventory.shield||0)+')';
  document.getElementById('extra-count').textContent='('+(player.inventory.extraTime||0)+')';
}

// ═══════════ GRID ═══════════
function buildGrid(){
  clearRegionLayer();   // نمسح تظليل المنطقة السابق قبل إعادة البناء
  const {rows,cols,numbers}=puzzle;
  const table=document.getElementById('grid-table'); table.innerHTML=''; cells=[];
  for(let r=0;r<rows;r++){
    const tr=document.createElement('tr'); cells[r]=[];
    for(let c=0;c<cols;c++){
      const td=document.createElement('td'); td.className='grid-cell'; td.dataset.r=r; td.dataset.c=c;
      const ni=numbers.findIndex(n=>n.r===r&&n.c===c);
      if(ni!==-1){ td.classList.add('has-number'); const sp=document.createElement('div'); sp.className='cell-number'; sp.textContent=numbers[ni].val; td.appendChild(sp); }
      cells[r][c]=td; tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  const con=document.getElementById('grid-container');
  con.onmousedown=startDrag; con.onmousemove=moveDrag; con.onmouseup=endDrag;
  con.ontouchstart=e=>{e.preventDefault();startDrag(e.touches[0]);};
  con.ontouchmove=e=>{e.preventDefault();moveDrag(e.touches[0]);};
  con.ontouchend=e=>{e.preventDefault();endDrag(e.changedTouches[0]);};
  // ✅ مربعات التشتيت: تظهر بعد 2 ثانية في المراحل 51+ (وليس في اللانهائي أو اليومي)
  if(!isInfiniteMode && !isDailyMode && currentLevel>=50){
    setTimeout(drawDecoyRects, 2000);
  }
}

// ═══════════ DRAG ═══════════
// ✅ حساب الخلية رياضياً من إحداثيات الإصبع نسبةً لأبعاد الجدول (يحل مشكلة اللمسة المزدوجة على iOS)
function getCellAt(x,y){
  const table=document.getElementById('grid-table');
  const rect=table.getBoundingClientRect();
  // نتأكد أن اللمسة داخل حدود الجدول (مع هامش بسيط 2px للحواف)
  if(x<rect.left-2||x>rect.right+2||y<rect.top-2||y>rect.bottom+2) return null;
  // نحسب رقم العمود والصف بقسمة الإزاحة على عرض/ارتفاع الخلية الواحدة
  const cellW=rect.width/puzzle.cols;
  const cellH=rect.height/puzzle.rows;
  // ✅ نراعي اتجاه RTL: في rtl يظهر العمود 0 على اليمين، فنعكس المحور الأفقي
  const rtl=getComputedStyle(table).direction==='rtl';
  let c=rtl
    ? Math.floor((rect.right-x)/cellW)   // RTL: نقيس من الحافة اليمنى
    : Math.floor((x-rect.left)/cellW);   // LTR: نقيس من الحافة اليسرى
  let r=Math.floor((y-rect.top)/cellH);
  // نضبط القيم داخل حدود الشبكة (clamp) لتفادي تجاوز الأطراف
  c=Math.max(0,Math.min(puzzle.cols-1,c));
  r=Math.max(0,Math.min(puzzle.rows-1,r));
  return {r,c};
}
function getRect(a,b){ return {r1:Math.min(a.r,b.r),c1:Math.min(a.c,b.c),r2:Math.max(a.r,b.r),c2:Math.max(a.c,b.c)}; }
function startDrag(e){ ensureTimerStarted(); const cell=getCellAt(e.clientX,e.clientY); if(!cell)return; dragStart=cell; isDragging=true; updatePreview(cell); }
function moveDrag(e){ if(!isDragging||!dragStart)return; const cell=getCellAt(e.clientX,e.clientY); if(!cell)return; updatePreview(cell); }
function endDrag(e){ if(!isDragging)return; isDragging=false; const cell=getCellAt(e.clientX,e.clientY); if(cell)tryPlace(cell); dragStart=null; clearPreview(); }
function updatePreview(end){ clearPreview(); if(!dragStart)return; const rect=getRect(dragStart,end); const valid=isValidPlacement(rect); for(let r=rect.r1;r<=rect.r2;r++)for(let c=rect.c1;c<=rect.c2;c++){ cells[r][c].classList.add('preview'); if(!valid)cells[r][c].classList.add('invalid'); } }
function clearPreview(){ document.querySelectorAll('.grid-cell.preview').forEach(el=>el.classList.remove('preview','invalid')); }

// ═══════════ PLACEMENT ═══════════
function isValidPlacement(rect){
  const {r1,c1,r2,c2}=rect; const area=(r2-r1+1)*(c2-c1+1);
  const nums=puzzle.numbers.filter(n=>n.r>=r1&&n.r<=r2&&n.c>=c1&&n.c<=c2);
  if(nums.length!==1||nums[0].val!==area) return false;
  for(const reg of completedRegions) if(rectsOverlap(rect,reg)) return false;
  return true;
}
function rectsOverlap(a,b){ return a.r1<=b.r2&&a.r2>=b.r1&&a.c1<=b.c2&&a.c2>=b.c1; }
function tryPlace(end){
  if(!dragStart)return;
  const rect=getRect(dragStart,end);
  if(!isValidPlacement(rect)){
    for(let r=rect.r1;r<=rect.r2;r++)for(let c=rect.c1;c<=rect.c2;c++){ const cell=cells[r][c]; cell.classList.remove('shake'); void cell.offsetWidth; cell.classList.add('shake'); }
    combo=0; updateComboUI(); playSound('error'); vibrate(60);
    // ✅ عقوبة الخطأ: −5 ثوانٍ عند كل رسمة خاطئة
    timeLeft=Math.max(1,timeLeft-5); updateTimerUI();
    showToast('❌ خطأ! −5 ثوانٍ','error','⏱️');
    return;
  }
  const ni=puzzle.numbers.findIndex(n=>n.r>=rect.r1&&n.r<=rect.r2&&n.c>=rect.c1&&n.c<=rect.c2);
  const ci=completedRegions.length%REGION_COLORS.length;
  const reg={...rect,ni,colorIdx:ci};
  completedRegions.push(reg); moveHistory.push(reg);
  paintRegion(rect,ci); renderProgress();
  combo++; comboMultiplier=combo>=5?2:combo>=3?1.5:1; maxComboReached=Math.max(maxComboReached,combo);
  updateComboUI(); updateUndoBtn();
  playSound(combo>=3?'combo':'place'); vibrate(20);
  for(let r=rect.r1;r<=rect.r2;r++)for(let c=rect.c1;c<=rect.c2;c++){ const cell=cells[r][c]; cell.classList.remove('pop-in'); void cell.offsetWidth; cell.classList.add('pop-in'); }
  const mr=Math.round((rect.r1+rect.r2)/2),mc=Math.round((rect.c1+rect.c2)/2);
  if(cells[mr]&&cells[mr][mc]) spawnFloatScore(cells[mr][mc]);
  const total=puzzle.rows*puzzle.cols;
  const cov=completedRegions.reduce((a,r)=>a+(r.r2-r.r1+1)*(r.c2-r.c1+1),0);
  if(completedRegions.length===puzzle.numbers.length&&cov===total) setTimeout(()=>handleWin(false),250);
}
function paintRegion(rect,ci){
  const color=REGION_COLORS[ci%REGION_COLORS.length];
  const con=document.getElementById('grid-container');
  // نتأكد من وجود طبقة التظليل فوق الشبكة
  let layer=document.getElementById('region-layer');
  if(!layer){ layer=document.createElement('div'); layer.id='region-layer'; con.appendChild(layer); }
  // نحسب موضع المنطقة من الإحداثيات الفعلية المرئية (getBoundingClientRect) لضمان الدقة
  const conRect=con.getBoundingClientRect();
  const aR=cells[rect.r1][rect.c1].getBoundingClientRect();   // الخلية العليا-اليسرى
  const bR=cells[rect.r2][rect.c2].getBoundingClientRect();   // الخلية السفلى-اليمنى
  // الموضع نسبةً للحاوية + هامش بسيط (pad) ليبتعد الإطار عن المربعات قليلاً كما في التصميم
  const pad=2;
  const left=Math.min(aR.left,bR.left)-conRect.left-pad;
  const top=Math.min(aR.top,bR.top)-conRect.top-pad;
  const right=Math.max(aR.right,bR.right)-conRect.left+pad;
  const bottom=Math.max(aR.bottom,bR.bottom)-conRect.top+pad;
  // نرسم إطاراً واحداً حول المنطقة كاملة (بلا تعبئة خلفية — فقط حدود ملوّنة سميكة كالتصميم)
  const box=document.createElement('div');
  box.className='region-fill';
  box.style.left=left+'px'; box.style.top=top+'px';
  box.style.width=(right-left)+'px'; box.style.height=(bottom-top)+'px';
  box.style.borderColor=color;
  box.style.backgroundColor=color+'22';        // ✅ تعبئة شفافة خفيفة داخل الإطار
  box.style.boxShadow='0 0 8px '+color+'66';    // توهّج خفيف بنفس اللون
  layer.appendChild(box);
  // ✅ أُزيلت علامة الصح كلياً — نكتفي بوضع كلاس الإكمال على الخلايا
  for(let r=rect.r1;r<=rect.r2;r++)for(let c=rect.c1;c<=rect.c2;c++){
    cells[r][c].classList.add('completed-cell');
  }
}
// نمسح طبقة التظليل عند إعادة بناء الشبكة
function clearRegionLayer(){ const l=document.getElementById('region-layer'); if(l) l.innerHTML=''; }
// نعيد رسم كل المناطق المكتملة (مفيد بعد تغيير حجم الشاشة)
function repaintRegions(){ clearRegionLayer(); completedRegions.forEach(reg=>paintRegion(reg,reg.colorIdx!==undefined?reg.colorIdx:0)); }

// ═══════════ DECOY RECTS (مربعات التشتيت الوهمية — تظهر بعد المرحلة 50) ═══════════
function drawDecoyRects(){
  // لا نرسم إن انتهت اللعبة أو تغيّرت الشاشة
  if(!puzzle || !document.getElementById('game-screen').classList.contains('active')) return;
  const {rows,cols,numbers}=puzzle;
  const con=document.getElementById('grid-container');
  // عدد المربعات: 2 للمراحل 51-80، 3 للمراحل 81+
  const count=currentLevel>=80?3:2;
  // توليد حتمي: نفس المرحلة = نفس المربعات دائماً
  const rng=seededRng(currentLevel*9999+7);
  const decoys=[];
  let tries=0;
  while(decoys.length<count && tries<300){
    tries++;
    const r1=Math.floor(rng()*rows);
    const c1=Math.floor(rng()*cols);
    // حجم المربع: 1×2 أو 2×1 أو 2×2 فقط (لا تشغل مساحة كبيرة تربك الشبكة)
    const r2=Math.min(rows-1, r1+Math.floor(rng()*2)+1);
    const c2=Math.min(cols-1, c1+Math.floor(rng()*2)+1);
    const rect={r1,c1,r2,c2};
    // شرط ١: لا تحتوي أي رقم حقيقي من اللغز
    const hasNum=numbers.some(n=>n.r>=r1&&n.r<=r2&&n.c>=c1&&n.c<=c2);
    // شرط ٢: لا تتداخل مع بعضها
    const overlapsOther=decoys.some(d=>rectsOverlap(d,rect));
    // شرط ٣: لا تتداخل مع الحل الفعلي (التأكد أن لا يمكن للاعب وضعها كمنطقة صحيحة)
    const validAsRegion=isValidPlacement(rect); // إن كانت صالحة كحل، نرفضها
    if(!hasNum && !overlapsOther && !validAsRegion) decoys.push(rect);
  }
  // نرسم المربعات على طبقة التظليل
  let layer=document.getElementById('region-layer');
  if(!layer){ layer=document.createElement('div'); layer.id='region-layer'; con.appendChild(layer); }
  const conRect=con.getBoundingClientRect();
  const DECOY_COLORS=['#ff4444','#ff8800','#cc44ff'];
  decoys.forEach((rect,i)=>{
    if(!cells[rect.r1]||!cells[rect.r2]) return;
    const aR=cells[rect.r1][rect.c1].getBoundingClientRect();
    const bR=cells[rect.r2][rect.c2].getBoundingClientRect();
    const pad=2;
    const left=Math.min(aR.left,bR.left)-conRect.left-pad;
    const top=Math.min(aR.top,bR.top)-conRect.top-pad;
    const right=Math.max(aR.right,bR.right)-conRect.left+pad;
    const bottom=Math.max(aR.bottom,bR.bottom)-conRect.top+pad;
    const color=DECOY_COLORS[i%DECOY_COLORS.length];
    const box=document.createElement('div');
    box.className='region-fill decoy-rect';
    box.style.left=left+'px'; box.style.top=top+'px';
    box.style.width=(right-left)+'px'; box.style.height=(bottom-top)+'px';
    box.style.borderColor=color;
    box.style.backgroundColor=color+'18';   // تعبئة شفافة خفيفة
    box.style.boxShadow='0 0 6px '+color+'55';
    // اللمس يُخفي المربع الوهمي بتأثير تلاشٍ
    box.addEventListener('pointerdown',e=>{ e.stopPropagation(); box.style.opacity='0'; setTimeout(()=>box.remove(),300); });
    layer.appendChild(box);
  });
}
function spawnFloatScore(cell){
  const r=cell.getBoundingClientRect(); const el=document.createElement('div'); el.className='float-score';
  el.textContent='+'+Math.round(10*comboMultiplier); el.style.left=r.left+r.width/2+'px'; el.style.top=r.top+'px';
  el.style.color=comboMultiplier>=2?'var(--gold)':'var(--accent)'; document.body.appendChild(el); setTimeout(()=>el.remove(),1000);
}
function updateComboUI(){
  const bar=document.getElementById('combo-bar'); document.getElementById('combo-val').textContent=combo;
  if(combo>=2){ bar.classList.add('active'); document.getElementById('combo-bonus').textContent=combo>=5?'×2 مضاعفة!':combo>=3?'×1.5 قريب!':'تقدّم!'; }
  else { bar.classList.remove('active'); document.getElementById('combo-bonus').textContent=''; }
}
function renderProgress(){
  const row=document.getElementById('progress-row'); row.innerHTML='';
  const done=completedRegions.map(r=>r.ni);
  puzzle.numbers.forEach((n,i)=>{ const pip=document.createElement('div'); pip.className='region-pip'+(done.includes(i)?' done':''); pip.textContent=n.val; if(done.includes(i)) pip.style.borderColor=REGION_COLORS[done.indexOf(i)%REGION_COLORS.length]; row.appendChild(pip); });
}

// ═══════════ TIMER ═══════════
function startTimer(s){
  // ✅ يبدأ المؤقّت مُجمَّداً (timerPaused=true) حتى يلمس اللاعب الشبكة (ensureTimerStarted)
  clearInterval(timerInterval); timerInterval=null; timeLeft=s; totalTime=s; timerPaused=true; updateTimerUI();
  timerInterval=setInterval(()=>{ if(timerPaused)return; timeLeft--; updateTimerUI(); if(timeLeft<=0){ clearInterval(timerInterval); timerInterval=null; handleTimeUp(); } },1000);
}
// ✅ تُستدعى عند أول لمسة على الشبكة: تُشغّل الوقت لأول مرة
function ensureTimerStarted(){
  if(!timerStarted && !levelWon){ timerStarted=true; timerPaused=false; }
}
function resumeTimer(){ timerPaused=false; }
function updateTimerUI(){
  const disp=document.getElementById('timer-display'),fill=document.getElementById('timer-ring-fill');
  disp.textContent=fmtTime(timeLeft);
  const pct=Math.max(0,timeLeft/totalTime),circ=2*Math.PI*16;
  fill.style.strokeDashoffset=circ*(1-pct);
  fill.style.stroke=pct<0.25?'var(--danger)':pct<0.5?'#ffb347':'var(--accent)';
  if(timeLeft<=15) disp.classList.add('warning'); else disp.classList.remove('warning');
}
function handleTimeUp(){
  if(shieldActive){
    // ✅ الحماية الجديدة: لا تُكمل المرحلة ولا تمنح نجمة — فقط تحفظ القلب من النقصان
    shieldActive=false; document.getElementById('shield-bar').classList.remove('on');
    showToast('🛡️ الحماية حفظت قلبك!','success','🛡️');
    playSound('lose'); vibrate([80,40,80]);
    handleLose(true);   // خسارة لكن بدون فقدان قلب
  }
  else { playSound('lose'); vibrate([80,40,80]); handleLose(false); }
}
function fmtTime(s){ const m=Math.floor(s/60),sc=s%60; return m>0?`${m}:${String(sc).padStart(2,'0')}`:String(s); }

// ═══════════ WIN ═══════════
function handleWin(shieldSave){
  clearInterval(timerInterval); playSound('win'); vibrate([30,30,60]);
  const elapsed=totalTime-timeLeft;
  const stars=shieldSave?1:(timeLeft>totalTime*0.5?3:timeLeft>totalTime*0.2?2:1);
  if(isDailyMode){ return handleDailyWin(elapsed,stars); }
  if(isInfiniteMode){ return handleInfiniteWin(elapsed,stars); }
  levelWon=true; timerStarted=false; // ✅ فاز: الخروج للقائمة بعدها لا يخصم قلباً

  const mode=DIFF_MODES[currentMode]||DIFF_MODES.normal;
  const reward=getLevelReward(currentLevel);

  // ✅ مفتاح فريد لكل (مرحلة + مستوى صعوبة): "5_normal" ، "5_easy" ، "5_expert"
  const rewardKey=currentLevel+'_'+currentMode;
  if(!player.rewardedLevels) player.rewardedLevels={};   // حماية للحفظات القديمة
  const firstClear=!player.rewardedLevels[rewardKey];    // هل هذه أول مرة على هذه الصعوبة؟

  // المكافآت تُحسب فقط في أول مرة، وإلا تبقى أصفاراً
  let streakBonus=0, baseXP=0, comboBonus=0, totalXP=0, totalCoins=0;
  if(firstClear){
    streakBonus=Math.min(player.streak*5,50);
    baseXP=Math.round(reward.xp*mode.xpMul);
    comboBonus=Math.round((comboMultiplier-1)*baseXP);
    totalXP=baseXP+streakBonus+comboBonus;
    totalCoins=Math.round(reward.coins*mode.coinMul)+Math.floor(player.streak/3)*5;
  }

  // ── تحديثات تحدث دائماً (سجلّ المهارة، ليس مكافأة قابلة للتكرار) ──
  if(!player.completedLevels.includes(currentLevel)) player.completedLevels.push(currentLevel);
  const prev=player.stars[currentLevel]||0; player.stars[currentLevel]=Math.max(prev,stars);
  if(stars===3&&prev<3) player.perfectCount++;
  if(!player.bestTimes[currentLevel]||elapsed<player.bestTimes[currentLevel]) player.bestTimes[currentLevel]=elapsed;

  // ── مكافآت لا تُمنح إلا أول مرة على هذه الصعوبة (تشمل السلسلة والمهام) ──
  if(firstClear){
    player.rewardedLevels[rewardKey]=true;   // علّم هذه (المرحلة+الصعوبة) كمُكافأة
    player.coins+=totalCoins; player.totalCoinsEarned+=totalCoins; player.xp+=totalXP;
    player.streak++; player.maxStreak=Math.max(player.maxStreak,player.streak); player.totalPlayed++;
    if(currentMode==='expert') player.expertWins=(player.expertWins||0)+1;
    if(reward.item) player.inventory[reward.item.key]=(player.inventory[reward.item.key]||0)+1;
    if(reward.avatarUnlock&&!player.unlockedAvatars.includes(reward.avatarUnlock)) player.unlockedAvatars.push(reward.avatarUnlock);
    updateMissions({levelWin:1,stars,mode:currentMode,combo:maxComboReached});
  }

  const oldLv=player.level; player.level=calcLevel(); savePlayer();

  const icons=['🎉','🥳','🏆','✨','🎊'];
  document.getElementById('win-icon').textContent=shieldSave?'🛡️':icons[Math.floor(Math.random()*icons.length)];
  const nb=document.getElementById('win-next-btn'); nb.textContent='▶ المستوى التالي'; nb.style.display=currentLevel+1<PUZZLES.length?'':'none';
  const rd=document.getElementById('win-rewards'); rd.innerHTML='';
  if(firstClear){
    addRI(rd,'🪙','+'+totalCoins+' عملة',mode.id==='expert'?'×1.8':'');
    addRI(rd,'⭐','+'+totalXP+' XP','');
    if(streakBonus>0) addRI(rd,'🔥','مكافأة السلسلة','+'+streakBonus);
    if(comboBonus>0)  addRI(rd,'🎯','مكافأة الكومبو','+'+comboBonus);
  } else {
    // إعادة لعب بنفس الصعوبة → لا مكافأة جديدة
    addRI(rd,'✅','أكملتها مسبقاً بهذه الصعوبة','لا مكافأة');
  }
  addRI(rd,'🏅','النجوم','★'.repeat(stars)+'☆'.repeat(3-stars));
  if(firstClear&&reward.item) addRI(rd,reward.item.icon,reward.item.name+' مكتسب!','جديد');
  if(firstClear&&reward.avatarUnlock) addRI(rd,reward.avatarUnlock,'صورة رمزية مفتوحة!','');
  document.getElementById('win-sub').textContent=`${mode.icon} ${fmtTime(elapsed)} — ${stars===3?'مثالي! 🌟':stars===2?'ممتاز! 👏':'أحسنت! 👍'}`;
  openOverlay('win-overlay'); launchParticles();
  if(player.level>oldLv) setTimeout(()=>{ playSound('levelup'); showLevelUp(player.level,oldLv); },1400);
  setTimeout(checkAchievements,600);
}
function handleInfiniteWin(elapsed,stars){
  const coins=20+infiniteLevel*3, xp=30+infiniteLevel*4;
  player.coins+=coins; player.totalCoinsEarned+=coins; player.xp+=xp; player.totalPlayed++;
  player.streak++; player.maxStreak=Math.max(player.maxStreak,player.streak);
  player.infiniteBest=Math.max(player.infiniteBest||0,infiniteLevel);
  updateMissions({levelWin:1,stars,mode:'infinite',combo:maxComboReached});
  const oldLv=player.level; player.level=calcLevel(); savePlayer();
  document.getElementById('win-icon').textContent='♾️';
  const nb=document.getElementById('win-next-btn'); nb.textContent='▶ اللغز التالي'; nb.style.display='';
  const rd=document.getElementById('win-rewards'); rd.innerHTML='';
  addRI(rd,'🪙','+'+coins+' عملة',''); addRI(rd,'⭐','+'+xp+' XP','');
  addRI(rd,'♾️','لغز #'+infiniteLevel,''); addRI(rd,'🏅','النجوم','★'.repeat(stars)+'☆'.repeat(3-stars));
  document.getElementById('win-sub').textContent=`لغز #${infiniteLevel} — أفضل وصول: #${player.infiniteBest}`;
  openOverlay('win-overlay'); launchParticles();
  if(player.level>oldLv) setTimeout(()=>{ playSound('levelup'); showLevelUp(player.level,oldLv); },1400);
  setTimeout(checkAchievements,600);
}
function calcLevel(){ let nl=1; for(let i=1;i<XP_PER_LEVEL.length;i++) if(player.xp>=XP_PER_LEVEL[i]) nl=i+1; else break; return nl; }
function addRI(parent,icon,text,val){ const d=document.createElement('div'); d.className='reward-item'; d.innerHTML=`<div class="reward-icon">${icon}</div><div class="reward-text">${text}</div><div class="reward-val">${val}</div>`; parent.appendChild(d); }
function showLevelUp(nLv,oLv){
  document.getElementById('levelup-title').textContent='🚀 المستوى '+nLv+'!';
  document.getElementById('levelup-sub').textContent='من '+oLv+' إلى '+nLv+' — رائع!';
  const r=document.getElementById('levelup-rewards'); r.innerHTML='';
  const b=getLevelReward(Math.max(0,nLv-2)); if(b.avatarUnlock) addRI(r,b.avatarUnlock,'صورة رمزية جديدة!','');
  addRI(r,'🎯','استمر وافتح المزيد!','');
  openOverlay('levelup-overlay'); launchParticles();
}
function handleLose(keepHeart){
  player.streak=0;
  timerStarted=false; // ✅ انتهت المحاولة: الخروج للقائمة بعدها لا يخصم قلباً إضافياً
  if(!keepHeart) loseHeart();   // ✅ مع الحماية لا ننقص قلباً
  savePlayer(); openOverlay('lose-overlay'); updateHeartsUI();
  // نُحدّث رسالة نافذة الخسارة حسب الحالة
  const sub=document.getElementById('lose-sub');
  if(sub) sub.textContent=keepHeart?'🛡️ الحماية حفظت قلبك — لم ينقص أي قلب':'السلسلة انكسرت — حاول مجدداً!';
}

// ═══════════ عدّاد الإعلان البيني ═══════════
// نُظهر الإعلان كل 3 مراحل فقط (وليس بعد كل مرحلة)
// AD_FREQUENCY = 3 → إعلان بعد كل 3 مراحل مكتملة
const AD_FREQUENCY = 3;
let levelsSinceLastAd = 0; // عدّاد المراحل المكتملة منذ آخر إعلان

function nextLevel(){
  closeOverlay('win-overlay');
  // اليومي يخرج للقائمة الرئيسية بلا إعلان بيني
  if(isDailyMode){ showScreen('home-screen'); return; }

  // دالة الانتقال للمرحلة/اللغز التالي
  const goNext = ()=>{
    if(isInfiniteMode){ startInfinite(infiniteLevel+1); return; }
    const nx=currentLevel+1;
    if(nx<PUZZLES.length) startLevel(nx);
    else showScreen('levels-screen');
  };

  // ✅ زِد العدّاد، وأظهر الإعلان فقط عند الوصول للحد
  levelsSinceLastAd++;
  if(levelsSinceLastAd >= AD_FREQUENCY){
    levelsSinceLastAd = 0;       // أعد التصفير
    showInterstitialAd(goNext);  // أظهر الإعلان ثم انتقل
  } else {
    goNext();                    // انتقل مباشرة بلا إعلان
  }
}
function retryLevel(){ if(!hasHeart()){ closeOverlay('lose-overlay'); showHeartsEmpty(); return; } closeOverlay('lose-overlay'); if(isInfiniteMode) startInfinite(infiniteLevel); else if(isDailyMode) startDaily(); else startLevel(currentLevel); }
function resetPuzzle(){
  completedRegions=[]; moveHistory=[];
  // ✅ نعيد ضبط عداد التراجع عند إعادة تشغيل المرحلة
  const isSpecial=isInfiniteMode||isDailyMode;
  const effMode=isSpecial?'normal':currentMode;
  undoLeft=effMode==='easy'?2:effMode==='expert'?0:1;
  // ✅ ينقص قلب فقط إن بدأ الوقت ولم يفز ولم يدفع مسبقاً (مراحل عادية)
  if(!isSpecial && timerStarted && !levelWon && !paidHeartThisSession){
    loseHeart(); savePlayer(); updateHeartsUI();
    showToast('💔 خسرت قلباً بسبب إعادة المرحلة!','error','💔');
    paidHeartThisSession=true;
  }
  timerStarted=false; levelWon=false; // ✅ الوقت يُجمَّد حتى أول لمسة
  buildGrid(); renderProgress(); combo=0; comboMultiplier=1; updateComboUI(); updateUndoBtn(); startTimer(totalTime); playSound('click');
}
// ═══════════ PAUSE MENU ═══════════
// تتبع: هل دفع اللاعب قلباً بالإعادة في هذه الجلسة؟
let paidHeartThisSession = false;

function openPauseMenu(){
  timerPaused = true;
  const isSpecial = isInfiniteMode || isDailyMode;
  const engaged = timerStarted && !levelWon; // ✅ بدأ الوقت ولم يفز = خروجه يكلّف قلباً
  // نص الـ sub حسب الحالة
  let sub = '';
  if(isSpecial){
    sub = 'اللعبة متوقفة مؤقتاً';
  } else if(!engaged){
    sub = 'لم يبدأ الوقت بعد — يمكنك الخروج بحرية';
  } else if(paidHeartThisSession){
    sub = 'أعدت المرحلة مسبقاً — الخروج بدون خسارة إضافية';
  } else {
    sub = 'في حال الخروج أو الإعادة<br><span style="color:var(--danger);font-weight:700">💔 ستخسر قلباً!</span>';
  }
  document.getElementById('pause-sub').innerHTML = sub;
  // زر الإعادة: نخفيه إن كان وضعاً خاصاً
  const resetBtn = document.getElementById('pause-reset-btn');
  resetBtn.style.display = isSpecial ? 'none' : '';
  // نص زر الخروج حسب الحالة
  const quitBtn = document.getElementById('pause-quit-btn');
  const willLose = engaged && !paidHeartThisSession;
  quitBtn.textContent = willLose ? '🚪 الخروج 💔' : '🚪 الخروج';
  openOverlay('pause-overlay');
}

function closePauseMenu(){
  closeOverlay('pause-overlay');
  if(timerStarted && !levelWon) resumeTimer(); // ✅ لا نُشغّل الوقت إن لم يكن بدأ أصلاً
}

function pauseDoReset(){
  closeOverlay('pause-overlay');
  // ✅ ينقص قلب فقط إن: بدأ الوقت + لم يدفع مسبقاً
  if(timerStarted && !levelWon && !paidHeartThisSession){
    loseHeart(); savePlayer(); updateHeartsUI();
    showToast('💔 خسرت قلباً بسبب إعادة المرحلة!','error','💔');
    paidHeartThisSession = true;
  }
  // إعادة المرحلة
  completedRegions=[]; moveHistory=[];
  const isSpecial=isInfiniteMode||isDailyMode;
  const effMode=isSpecial?'normal':currentMode;
  undoLeft=effMode==='easy'?2:effMode==='expert'?0:1;
  timerStarted=false; levelWon=false; // ✅ الوقت يُجمَّد من جديد حتى أول لمسة
  buildGrid(); renderProgress(); combo=0; comboMultiplier=1; updateComboUI(); updateUndoBtn(); startTimer(totalTime); playSound('click');
}

function pauseDoQuit(){
  closeOverlay('pause-overlay');
  const isSpecial = isInfiniteMode || isDailyMode;
  // ✅ ينقص قلب فقط إن: مراحل عادية + بدأ الوقت + لم يفز + لم يدفع مسبقاً
  if(!isSpecial && timerStarted && !levelWon && !paidHeartThisSession){
    loseHeart(); savePlayer(); updateHeartsUI();
    showToast('💔 خسرت قلباً بسبب الخروج!','error','💔');
  }
  paidHeartThisSession = false;
  if(isSpecial) showScreen('home-screen'); else showScreen('levels-screen');
  clearInterval(timerInterval); timerInterval=null;
  playSound('click');
}

function backToMenuFromGame(){ pauseDoQuit(); }
function confirmQuit(){ openPauseMenu(); }
function confirmReset(){ openPauseMenu(); }
function undoMove(){
  // ✅ خبير: التراجع مقيّد تماماً
  if(undoLeft<=0){
    const msg=currentMode==='expert'?'↩️ التراجع غير متاح في وضع الخبير!':'↩️ استنفدت كل محاولات التراجع!';
    showToast(msg,'error','↩️'); return;
  }
  if(moveHistory.length===0){ showToast('لا شيء للتراجع','info','↩️'); return; }
  undoLeft--;
  moveHistory.pop(); completedRegions=moveHistory.slice();
  buildGrid(); completedRegions.forEach((reg,i)=>paintRegion(reg,reg.colorIdx!==undefined?reg.colorIdx:i%REGION_COLORS.length));
  renderProgress(); combo=0; comboMultiplier=1; updateComboUI(); updateUndoBtn(); playSound('click');
  // ✅ عقوبة التراجع: −10 ثوانٍ (محافظ عليها)
  timeLeft=Math.max(1,timeLeft-10); updateTimerUI();
  showToast('↩️ تراجع! −10 ثوانٍ'+(undoLeft>0?' (متبقٍ: '+undoLeft+')':''),'error','⏱️');
}
function updateUndoBtn(){
  const b=document.getElementById('btn-undo');
  if(!b) return;
  // الزر معطّل إن: لا حركات للتراجع، أو نفد رصيد التراجع، أو الوضع خبير
  b.disabled=(moveHistory.length===0||undoLeft<=0);
  // نعرض العداد المتبقي داخل الزر
  const label=currentMode==='expert'?'↩️ (0)':'↩️ ('+undoLeft+')';
  b.innerHTML=label;
}

// ═══════════ ITEMS ═══════════
function useHint(){
  if((player.inventory.hint||0)<=0){ showToast('لا تلميحات! اشترِ من المتجر 🛒','error','💡'); return; }
  const done=completedRegions.map(r=>r.ni);
  const unreg=puzzle._solution&&puzzle._solution.find(reg=>!done.includes(reg.ni));
  if(!unreg||completedRegions.some(cr=>rectsOverlap(cr,unreg))){ showToast('لا يمكن وضع تلميح الآن','error','❌'); return; }
  player.inventory.hint--; if(player.inventory.hint<=0) delete player.inventory.hint;
  savePlayer(); updateItemCounts();
  const ci=completedRegions.length%REGION_COLORS.length;
  const reg={...unreg,colorIdx:ci}; completedRegions.push(reg); moveHistory.push(reg);
  paintRegion(unreg,ci); renderProgress(); combo=0; comboMultiplier=1; updateComboUI(); updateUndoBtn(); playSound('place');
  showToast('💡 تم وضع منطقة','info','💡');
  const cov=completedRegions.reduce((a,r)=>a+(r.r2-r.r1+1)*(r.c2-r.c1+1),0);
  if(completedRegions.length===puzzle.numbers.length&&cov===puzzle.rows*puzzle.cols) setTimeout(()=>handleWin(false),300);
}
function useShield(){
  if((player.inventory.shield||0)<=0){ showToast('لا حماية! اشترِ من المتجر 🛒','error','🛡️'); return; }
  if(shieldActive){ showToast('الحماية مفعّلة بالفعل!','info','🛡️'); return; }
  player.inventory.shield--; if(player.inventory.shield<=0) delete player.inventory.shield;
  savePlayer(); updateItemCounts(); shieldActive=true;
  document.getElementById('shield-bar').classList.add('on'); playSound('coin'); showToast('🛡️ الحماية مفعّلة!','success','🛡️');
}
function useExtraTime(){
  if((player.inventory.extraTime||0)<=0){ showToast('لا وقت إضافي! اشترِ من المتجر 🛒','error','⏱️'); return; }
  player.inventory.extraTime--; if(player.inventory.extraTime<=0) delete player.inventory.extraTime;
  savePlayer(); updateItemCounts(); timeLeft+=30; totalTime+=30; updateTimerUI(); playSound('coin'); showToast('⏱️ +30 ثانية!','gold','⏱️');
}
function showItemsGuide(){ openOverlay('items-guide-overlay'); }

// ═══════════ SHOP ═══════════
function renderShop(){
  document.getElementById('shop-coins').textContent='🪙 '+player.coins;
  const grid=document.getElementById('shop-grid'); grid.innerHTML='';
  SHOP_ITEMS.forEach(item=>{
    const afford=player.coins>=item.price;
    const el=document.createElement('div'); el.className='shop-item';
    el.innerHTML=`<div class="shop-item-icon">${item.icon}</div><div class="shop-item-info"><div class="shop-item-name">${item.name}</div><div class="shop-item-desc">${item.desc}</div></div><button class="shop-buy-btn" ${afford?'':'disabled'}>🪙 ${item.price}</button>`;
    el.querySelector('button').onclick=()=>buyItem(item); grid.appendChild(el);
  });
}
function buyItem(item){
  if(player.coins<item.price){ showToast('عملات غير كافية!','error','🪙'); return; }
  player.coins-=item.price;
  if(item.bundle) Object.entries(item.bundle).forEach(([k,n])=>player.inventory[k]=(player.inventory[k]||0)+n);
  else player.inventory[item.key]=(player.inventory[item.key]||0)+1;
  savePlayer(); renderShop(); playSound('coin'); vibrate(30); showToast('تم شراء '+item.name+'! ✓','success','🛒');
}

// ═══════════ ADS (إعلان وهمي: عدّاد 30ث ثم مكافأة) ═══════════
let adTimer=null, adReward=null;
// نوع المكافأة: 'coins' (+100) أو 'heart' (+1 قلب)
function watchAd(type){
  adReward=type;
  let secs=30;
  const titleEl=document.getElementById('ad-title');
  const countEl=document.getElementById('ad-count');
  const claimBtn=document.getElementById('ad-claim-btn');
  const skipBtn=document.getElementById('ad-skip-btn');
  titleEl.textContent=type==='heart'?'شاهد إعلاناً لتربح قلباً ❤️':'شاهد إعلاناً لتربح 100 عملة 🪙';
  claimBtn.style.display='none';
  skipBtn.style.display='none';
  countEl.textContent=secs;
  openOverlay('ad-overlay');
  clearInterval(adTimer);
  adTimer=setInterval(()=>{
    secs--; countEl.textContent=secs;
    if(secs<=0){
      clearInterval(adTimer);
      countEl.textContent='✓';
      claimBtn.style.display='';   // زر استلام المكافأة بعد انتهاء الإعلان
    }
  },1000);
}
// استلام مكافأة الإعلان
function claimAdReward(){
  if(adReward==='heart'){
    refreshHearts();
    player.hearts=Math.min(MAX_HEARTS,player.hearts+1);
    if(player.hearts>=MAX_HEARTS) player.lastHeartTime=0;
    savePlayer(); updateHeartsUI();
    showToast('❤️ +1 قلب!','success','❤️');
  } else {
    player.coins+=100; player.totalCoinsEarned+=100; savePlayer();
    showToast('🪙 +100 عملة!','gold','🪙');
    playSound('coin');
  }
  closeOverlay('ad-overlay');
  updateHomeUI(); if(document.getElementById('shop-screen').classList.contains('active')) renderShop();
}
// إغلاق الإعلان قبل اكتماله (لا مكافأة)
function cancelAd(){ clearInterval(adTimer); closeOverlay('ad-overlay'); }

// ═══════════ INTERSTITIAL AD (إعلان بيني بعد كل مرحلة) ═══════════
// يظهر تلقائياً عند الانتقال للمرحلة التالية:
//   • أول 5 ثوانٍ إجبارية (لا زر تخطي)
//   • بعدها يظهر زر "تخطي" (بدون مكافأة)
//   • إذا أكمل 30 ثانية → يأخذ +20 عملة كمكافأة على المشاهدة
let interTimerFull=null, interTimerSkip=null, interCallback=null;

function showInterstitialAd(onDone){
  // نحفظ الدالة التي ستُستدعى بعد إغلاق الإعلان (للانتقال للمرحلة التالية)
  interCallback = (typeof onDone === 'function') ? onDone : null;
  let skipSecs = 5;    // عدّاد التخطي
  let fullSecs = 30;   // عدّاد المشاهدة الكاملة

  const countEl  = document.getElementById('inter-count');
  const skipBtn  = document.getElementById('inter-skip-btn');
  const skipNum  = document.getElementById('inter-skip-num');
  const skipHint = document.getElementById('inter-skip-hint');
  const claimBtn = document.getElementById('inter-claim-btn');

  // إعادة ضبط الواجهة قبل الفتح
  countEl.textContent     = fullSecs;
  skipNum.textContent     = skipSecs;
  skipBtn.style.display   = 'none';   // زر التخطي مخفي حتى انتهاء عدّاد 5ث
  claimBtn.style.display  = 'none';   // زر الاستلام مخفي حتى اكتمال 30ث
  skipHint.style.display  = '';       // عداد نصي "يمكن التخطي بعد X ثوانٍ"

  openOverlay('interstitial-overlay');

  // عدّاد التخطي (5 ثوانٍ): بعدها يظهر زر "تخطي" ويختفي العدّاد النصي
  clearInterval(interTimerSkip);
  interTimerSkip = setInterval(()=>{
    skipSecs--;
    if(skipSecs<=0){
      clearInterval(interTimerSkip); interTimerSkip=null;
      skipBtn.style.display  = '';      // أظهر زر التخطي
      skipHint.style.display = 'none';  // أخفِ النص التحذيري
    } else {
      skipNum.textContent = skipSecs;
    }
  }, 1000);

  // عدّاد المشاهدة الكاملة (30 ثانية): بعدها زر "استلم المكافأة"
  clearInterval(interTimerFull);
  interTimerFull = setInterval(()=>{
    fullSecs--;
    countEl.textContent = fullSecs;
    if(fullSecs<=0){
      clearInterval(interTimerFull); interTimerFull=null;
      countEl.textContent     = '✓';
      skipBtn.style.display   = 'none';
      skipHint.style.display  = 'none';
      claimBtn.style.display  = '';   // أظهر زر استلام المكافأة
    }
  }, 1000);
}

// تنظيف المؤقتات وإغلاق نافذة الإعلان البيني
function _cleanupInterstitial(){
  clearInterval(interTimerSkip); interTimerSkip=null;
  clearInterval(interTimerFull); interTimerFull=null;
  closeOverlay('interstitial-overlay');
}

// تخطي الإعلان (بدون مكافأة) — الزر يظهر فقط بعد مرور 5 ثوانٍ
function skipInterstitial(){
  _cleanupInterstitial();
  const cb = interCallback; interCallback = null;
  if(cb) cb();   // ننتقل للمرحلة التالية
}

// استلام مكافأة المشاهدة الكاملة (+20 عملة)
function claimInterstitialReward(){
  player.coins += 20; player.totalCoinsEarned += 20;
  savePlayer();
  showToast('🪙 +20 عملة على المشاهدة!','gold','🪙');
  playSound('coin');
  _cleanupInterstitial();
  const cb = interCallback; interCallback = null;
  if(cb) cb();   // ننتقل للمرحلة التالية
}

// ═══════════ نافذة نفاد القلوب ═══════════
function showHeartsEmpty(){
  updateHeartsUI();
  openOverlay('hearts-overlay');
}

// ═══════════ ACHIEVEMENTS ═══════════
function getAchProgress(a){
  switch(a.type){
    case 'completed': return player.completedLevels.length;
    case 'maxStreak': return player.maxStreak||0;
    case 'perfectCount': return player.perfectCount||0;
    case 'totalCoinsEarned': return player.totalCoinsEarned||0;
    case 'dailyPlayed': return player.dailyPlayed||0;
    case 'expertWins': return player.expertWins||0;
    case 'infiniteBest': return player.infiniteBest||0;
    default: return 0;
  }
}
function renderAchievements(){
  const body=document.getElementById('ach-body'); body.innerHTML=''; let unlocked=0;
  ACHIEVEMENTS.forEach(a=>{
    const prog=getAchProgress(a), isU=player.unlockedAchievements.includes(a.id); if(isU)unlocked++;
    const pct=Math.min(100,prog/a.target*100);
    const rt='🪙'+a.reward.coins+(a.reward.avatar?' +'+a.reward.avatar:'');
    const el=document.createElement('div'); el.className='ach-item '+(isU?'unlocked':'locked');
    el.innerHTML=`<div class="ach-icon">${a.icon}</div><div class="ach-info"><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div>${isU?'':`<div class="ach-progress-bar"><div class="ach-progress-fill" style="width:${pct}%"></div></div>`}</div>${isU?'<div class="ach-check">✓</div>':`<div class="ach-reward">${rt}</div>`}`;
    body.appendChild(el);
  });
  document.getElementById('ach-progress').textContent=unlocked+'/'+ACHIEVEMENTS.length;
}
function checkAchievements(){
  let newly=null;
  for(const a of ACHIEVEMENTS){
    if(player.unlockedAchievements.includes(a.id)) continue;
    if(getAchProgress(a)>=a.target){
      player.unlockedAchievements.push(a.id); player.coins+=a.reward.coins; player.totalCoinsEarned+=a.reward.coins;
      if(a.reward.avatar&&!player.unlockedAvatars.includes(a.reward.avatar)) player.unlockedAvatars.push(a.reward.avatar);
      if(!newly) newly=a;
    }
  }
  if(newly){
    savePlayer();
    setTimeout(()=>{
      document.getElementById('ach-unlock-icon').textContent=newly.icon;
      document.getElementById('ach-unlock-name').textContent=newly.name+' — '+newly.desc;
      const r=document.getElementById('ach-unlock-rewards'); r.innerHTML='';
      addRI(r,'🪙','+'+newly.reward.coins+' عملة',''); if(newly.reward.avatar) addRI(r,newly.reward.avatar,'صورة رمزية جديدة!','');
      playSound('achieve'); openOverlay('ach-unlock-overlay'); launchParticles();
    }, document.getElementById('win-overlay').classList.contains('active')?0:200);
  }
}

// ═══════════ DAILY ═══════════
let dailyPuzzle=null;
function todayStr(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function isDailyDone(){ return player.lastDailyDate===todayStr(); }
function genDailyPuzzle(){
  const seed=todayStr().split('-').reduce((a,n)=>a+parseInt(n),0);
  const pool=PUZZLES.filter(p=>p.rows>=5&&p.rows<=7);
  const base=pool[seed%pool.length];
  dailyPuzzle={...base,name:'التحدي اليومي',time:base.time+30,numbers:base.numbers.map(n=>({...n}))};
}
function openDailyChallenge(){ genDailyPuzzle(); if(isDailyDone()){ showToast('لعبت تحدي اليوم! عُد غداً 📅','info','📅'); return; } startDaily(); }
function handleDailyWin(elapsed,stars){
  const today=todayStr();
  const y=new Date(); y.setDate(y.getDate()-1);
  const wasYest=player.lastDailyDate===(y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate());
  player.dailyStreak=wasYest?(player.dailyStreak||0)+1:1; player.lastDailyDate=today; player.dailyPlayed++;
  const coins=80+player.dailyStreak*10, xp=120;
  player.coins+=coins; player.totalCoinsEarned+=coins; player.xp+=xp; player.totalPlayed++;
  player.inventory.hint=(player.inventory.hint||0)+1;
  updateMissions({levelWin:1,stars,mode:'daily',combo:maxComboReached});
  const oldLv=player.level; player.level=calcLevel(); savePlayer();
  document.getElementById('win-icon').textContent='📅';
  document.getElementById('win-next-btn').style.display='none';
  const rd=document.getElementById('win-rewards'); rd.innerHTML='';
  addRI(rd,'🪙','+'+coins+' عملة',''); addRI(rd,'⭐','+'+xp+' XP','');
  addRI(rd,'💡','تلميح مجاني!','جديد'); addRI(rd,'📅','سلسلة يومية','×'+player.dailyStreak);
  document.getElementById('win-sub').textContent='تحدي اليوم مكتمل! عُد غداً 🎯';
  openOverlay('win-overlay'); launchParticles();
  if(player.level>oldLv) setTimeout(()=>{ playSound('levelup'); showLevelUp(player.level,oldLv); },1400);
  setTimeout(checkAchievements,600);
}

// ═══════════ MISSIONS ═══════════
function isoWeekId(){
  const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+3-((d.getDay()+6)%7));
  const w1=new Date(d.getFullYear(),0,4);
  const wk=1+Math.round(((d-w1)/86400000-3+((w1.getDay()+6)%7))/7);
  return d.getFullYear()+'-W'+wk;
}
function ensureMissions(){
  const wk=isoWeekId();
  if(player.missionWeek!==wk||!player.missions){
    const seed=wk.split('').reduce((a,ch)=>a+ch.charCodeAt(0),0);
    const rand=seededRng(seed*2654435761);
    const pool=MISSION_POOL.slice();
    for(let i=pool.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    player.missions=pool.slice(0,3).map((m,slot)=>({ id:m.id, icon:m.icon, metric:m.metric, text:m.text.replace('{t}',m.targets[slot]), target:m.targets[slot], slot }));
    player.missionWeek=wk; player.missionProgress={}; player.missionsClaimed=[]; savePlayer();
  }
}
function updateMissions(ev){
  if(!player.missions) return;
  player.missions.forEach(m=>{
    let inc=0;
    if(m.metric==='levelWin'&&ev.levelWin) inc=ev.levelWin;
    else if(m.metric==='stars'&&ev.stars) inc=ev.stars;
    else if(m.metric==='perfect'&&ev.stars===3) inc=1;
    else if(m.metric==='expert'&&ev.mode==='expert') inc=1;
    else if(m.metric==='games') inc=1;
    else if(m.metric==='maxCombo') player.missionProgress[m.id]=Math.max(player.missionProgress[m.id]||0,ev.combo||0);
    if(inc) player.missionProgress[m.id]=(player.missionProgress[m.id]||0)+inc;
  });
  savePlayer();
}
function renderMissions(){
  ensureMissions();
  document.getElementById('missions-week').textContent='تتجدد كل أسبوع • '+player.missionWeek;
  const body=document.getElementById('missions-body'); body.innerHTML='';
  player.missions.forEach(m=>{
    const prog=Math.min(player.missionProgress[m.id]||0,m.target);
    const done=prog>=m.target, claimed=player.missionsClaimed.includes(m.id);
    const rw=MISSION_REWARDS[m.slot]||MISSION_REWARDS[0]; const pct=Math.round(prog/m.target*100);
    const el=document.createElement('div'); el.className='mission-item'+(done?' done':'');
    el.innerHTML=`<div class="mission-icon">${m.icon}</div><div class="mission-info"><div class="mission-text">${m.text}</div><div class="mission-bar"><div class="mission-fill" style="width:${pct}%"></div></div><div class="mission-prog">${prog}/${m.target}</div></div><div class="mission-action">${claimed?'<span class="mission-claimed">✓ استُلمت</span>':done?`<button class="mission-claim-btn">🪙${rw.coins}</button>`:`<span class="mission-reward">🪙${rw.coins}</span>`}</div>`;
    if(done&&!claimed) el.querySelector('.mission-claim-btn').onclick=()=>claimMission(m);
    body.appendChild(el);
  });
}
function claimMission(m){
  if(player.missionsClaimed.includes(m.id)) return;
  const rw=MISSION_REWARDS[m.slot]||MISSION_REWARDS[0];
  player.coins+=rw.coins; player.totalCoinsEarned+=rw.coins; player.xp+=rw.xp; player.missionsClaimed.push(m.id);
  player.level=calcLevel(); savePlayer(); renderMissions(); playSound('coin'); launchParticles();
  showToast('مهمة مكتملة! +'+rw.coins+' عملة','gold','🎁'); checkAchievements();
}

// ═══════════ MODE PICKER + INFINITE ENTRY ═══════════
let pendingLevelIdx=0;
function openModePicker(idx){
  pendingLevelIdx=idx;
  const g=document.getElementById('mode-picker-grid'); g.innerHTML='';
  Object.values(DIFF_MODES).forEach(m=>{
    const el=document.createElement('div'); el.className='mode-opt'+(currentMode===m.id?' selected':'');
    el.innerHTML=`<div class="mode-opt-icon">${m.icon}</div><div><div class="mode-opt-name">${m.name}</div><div class="mode-opt-desc">${m.desc}</div></div>`;
    el.onclick=()=>{ currentMode=m.id; localStorage.setItem('shikaku_mode',m.id); closeOverlay('mode-overlay'); startLevel(pendingLevelIdx); };
    g.appendChild(el);
  });
  openOverlay('mode-overlay');
}
function startInfiniteFromMenu(){ if(!hasHeart()){ showHeartsEmpty(); return; } startInfinite((player.infiniteBest||0)+1); }

// ═══════════ PROFILE ═══════════
function renderProfile(){
  document.getElementById('profile-big-avatar').childNodes[0].textContent=player.avatar;
  document.getElementById('profile-name-big').innerHTML=player.name+' ✏️';
  document.getElementById('profile-level-big').textContent='المستوى '+player.level;
  setXpBar('profile-xp-bar','profile-xp-txt','profile-xp-max');
  const sr=document.getElementById('profile-stats-row'); sr.innerHTML='';
  [[player.completedLevels.length,'مكتملة'],[player.coins,'🪙'],[player.streak,'🔥'],[player.maxStreak||0,'أطول'],
   [player.infiniteBest||0,'♾️'],[player.totalPlayed||0,'مباريات'],[player.unlockedAchievements.length,'🏅'],[player.perfectCount||0,'⭐']
  ].forEach(([v,l])=>{ const b=document.createElement('div'); b.className='stat-box'; b.innerHTML=`<div class="stat-val">${v}</div><div class="stat-lbl">${l}</div>`; sr.appendChild(b); });
  const inv=document.getElementById('inventory-grid'); inv.innerHTML='';
  const ITEMS={hint:{icon:'💡',name:'تلميح',badge:'يحل منطقة',color:'var(--accent)'},extraTime:{icon:'⏱️',name:'وقت',badge:'+30ث',color:'var(--gold)'},shield:{icon:'🛡️',name:'حماية',badge:'ينقذ',color:'var(--accent2)'}};
  let has=false;
  Object.entries(player.inventory||{}).forEach(([k,c])=>{ if(c<=0)return; has=true; const info=ITEMS[k]||{icon:'?',name:k,badge:'',color:'var(--text-dim)'}; const it=document.createElement('div'); it.className='inventory-item'; it.innerHTML=`${info.icon}<div class="inventory-item-count">${c}</div><div class="inventory-item-name">${info.name}</div><div class="inventory-item-badge" style="background:${info.color}22;color:${info.color}">${info.badge}</div>`; inv.appendChild(it); });
  if(!has) inv.innerHTML='<div style="color:var(--text-dim);font-size:.85rem;padding:8px">أكمل مستويات أو اشترِ من المتجر 🎯</div>';
  const ag=document.getElementById('avatar-select-grid'); ag.innerHTML='';
  AVATARS.forEach(av=>{ const u=player.unlockedAvatars.includes(av); const o=document.createElement('div'); o.className='avatar-opt'+(player.avatar===av?' selected':'')+(u?'':' av-locked'); o.innerHTML=av+(u?'':'<div class="av-lock-icon">🔒</div>'); if(u) o.onclick=()=>{ document.querySelectorAll('#avatar-select-grid .avatar-opt').forEach(a=>a.classList.remove('selected')); o.classList.add('selected'); selectedAvatar=av; playSound('click'); }; ag.appendChild(o); });
  selectedAvatar=player.avatar;
}
function saveAvatar(){ if(selectedAvatar){ player.avatar=selectedAvatar; savePlayer(); renderProfile(); showToast('تم حفظ الصورة!','success','🖼️'); playSound('coin'); } }
function openAvatarPicker(){
  const g=document.getElementById('avatar-picker-grid'); g.innerHTML='';
  AVATARS.forEach(av=>{ const u=player.unlockedAvatars.includes(av); const o=document.createElement('div'); o.className='avatar-opt'+(player.avatar===av?' selected':'')+(u?'':' av-locked'); o.innerHTML=av+(u?'':'<div class="av-lock-icon">🔒</div>'); if(u) o.onclick=()=>{ document.querySelectorAll('#avatar-picker-grid .avatar-opt').forEach(a=>a.classList.remove('selected')); o.classList.add('selected'); selectedAvatar=av; }; g.appendChild(o); });
  selectedAvatar=player.avatar; openOverlay('avatar-overlay');
}
function confirmAvatar(){ if(selectedAvatar){ player.avatar=selectedAvatar; savePlayer(); renderProfile(); updateHomeUI(); } closeOverlay('avatar-overlay'); showToast('تم التحديث!','success','✅'); }
// ✅ بديل prompt المحجوب على iOS: نفتح نافذة الإدخال المخصّصة
function editName(){
  const input=document.getElementById('name-input');
  input.value=player.name||'';            // نملأ الحقل بالاسم الحالي
  openOverlay('name-overlay');
  setTimeout(()=>input.focus(),100);      // تأخير بسيط ليظهر الكيبورد بعد فتح النافذة
}
// تأكيد الاسم الجديد من داخل النافذة
function confirmNameChange(){
  const v=document.getElementById('name-input').value;
  if(v&&v.trim()){
    player.name=v.trim().slice(0,12);     // حد أقصى 12 حرفاً (مطابق لـ maxlength)
    savePlayer(); renderProfile(); updateHomeUI();
    showToast('تم تغيير الاسم!','success','✏️');
  }
  closeOverlay('name-overlay');
}

// ═══════════ RESET PROGRESS (إعادة تعيين التقدم الكامل) ═══════════
function confirmResetProgress(){
  document.getElementById('confirm-icon').textContent='🗑️';
  document.getElementById('confirm-title').textContent='إعادة تعيين التقدم';
  document.getElementById('confirm-sub').textContent='سيُحذف كل تقدمك وعملاتك ومستوياتك. لا يمكن التراجع!';
  document.getElementById('confirm-yes').onclick=()=>{ localStorage.removeItem('shikaku_v4'); player=JSON.parse(JSON.stringify(DEFAULT_PLAYER)); ensureMissions(); savePlayer(); closeOverlay('confirm-overlay'); showScreen('home-screen'); showToast('تمت إعادة التعيين','info','🗑️'); };
  openOverlay('confirm-overlay');
}

// ═══════════ OVERLAYS + TOAST ═══════════
function openOverlay(id){ document.getElementById(id).classList.add('active'); }
function closeOverlay(id){ document.getElementById(id).classList.remove('active'); }
let toastTimer=null;
function showToast(msg,type='info',icon=''){
  const t=document.getElementById('toast');
  document.getElementById('toast-icon').textContent=icon; document.getElementById('toast-msg').textContent=msg;
  t.className='toast show '+type; clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2800);
}

// ═══════════ PARTICLES ═══════════
const canvas=document.getElementById('particles-canvas'); const ctx=canvas.getContext('2d');
let particles=[], animFrame=null;
function launchParticles(){
  canvas.width=window.innerWidth; canvas.height=window.innerHeight; canvas.classList.add('active'); particles=[];
  const colors=['#c8ff57','#57c8ff','#ffd700','#ff7a57','#57ffb8','#c457ff'];
  for(let i=0;i<90;i++) particles.push({ x:Math.random()*canvas.width, y:canvas.height*0.4+Math.random()*canvas.height*0.2, vx:(Math.random()-0.5)*9, vy:-(Math.random()*13+4), r:Math.random()*6+3, color:colors[Math.floor(Math.random()*colors.length)], life:1, decay:Math.random()*0.018+0.01, shape:Math.random()>0.5?'circle':'rect', rot:Math.random()*Math.PI });
  cancelAnimationFrame(animFrame); animParticles();
  setTimeout(()=>{ canvas.classList.remove('active'); particles=[]; },3200);
}
function animParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.35; p.rot+=0.1; p.life-=p.decay; if(p.life<=0)return; ctx.save(); ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.color; ctx.translate(p.x,p.y); ctx.rotate(p.rot); if(p.shape==='circle'){ ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill(); } else ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2); ctx.restore(); });
  particles=particles.filter(p=>p.life>0);
  if(particles.length>0) animFrame=requestAnimationFrame(animParticles);
}

// ═══════════ RESIZE (re-fit grid) ═══════════
let resizeTimer=null;
window.addEventListener('resize',()=>{ if(!puzzle)return; if(!document.getElementById('game-screen').classList.contains('active'))return; clearTimeout(resizeTimer); resizeTimer=setTimeout(()=>{ computeCellSize(puzzle.rows,puzzle.cols); repaintRegions(); },150); });

// ═══════════ INIT ═══════════
loadPlayer(); loadTheme(); loadSound(); refreshHearts();
currentMode=localStorage.getItem('shikaku_mode')||'normal';
ensureMissions(); genDailyPuzzle(); updateHomeUI();
document.body.addEventListener('touchstart',()=>ensureAudio(),{once:true});
document.body.addEventListener('mousedown',()=>ensureAudio(),{once:true});

// ═══════════ AUTO-PAUSE عند مغادرة التطبيق (لتفادي خسارة الوقت ظلماً) ═══════════
document.addEventListener('visibilitychange',()=>{
  // يعمل فقط أثناء اللعب الفعلي: شاشة اللعبة ظاهرة ومؤقّت شغّال
  const inGame=document.getElementById('game-screen').classList.contains('active');
  if(document.hidden && inGame && timerInterval){
    timerPaused=true;   // أوقف العدّ عند المغادرة (يُستأنف عبر resumeTimer من زر المتابعة)
  }
});
