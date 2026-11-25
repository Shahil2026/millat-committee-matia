"use strict";
/* ============================================================
   Millat Committee Moti Nagar Matia — Server Version App
   Data layer: Supabase (config.js) | DEMO mode agar config
   placeholder ho to localStorage par chalta hai.
   Saare committee writes PIN ke saath RPC se hote hain.
   ============================================================ */

const CFG = window.MC_CONFIG || {};
const DEMO = !CFG.SUPABASE_URL || CFG.SUPABASE_URL.includes("YOUR-PROJECT") || !CFG.SUPABASE_ANON_KEY || CFG.SUPABASE_ANON_KEY.includes("YOUR-");
let sb = null;
if (!DEMO && window.supabase) sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

const INCOME_HEADS = ["Nikah Khawani", "Juma Token", "Donation Box", "Chanda", "Sadqa", "Lillah", "Fitra", "Zakat", "Ramzan Chanda", "Eid Chanda", "Jalsha Chanda", "Madarsa Chanda", "Qurbani Fund", "Any (Other)"];
const EXPENSE_HEADS = ["Imam Salary", "Bijli Bill", "Safai", "Marammat", "Any (Other)"];

const NASIHAT = [
  { ar: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", hi: "Beshak Allah sabr karne walon ke saath hai.", src: "Qur'an 2:153" },
  { ar: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", hi: "Tum me sabse behtar wo hai jo Qur'an seekhe aur sikhaye.", src: "Bukhari" },
  { ar: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ", hi: "Aamaal ka daromadar niyyaton par hai.", src: "Bukhari, Muslim" },
  { ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا", hi: "Aur kaho: Aye mere Rab, mere ilm me izafa farma.", src: "Qur'an 20:114" },
  { ar: "الطُّهُورُ شَطْرُ الْإِيمَانِ", hi: "Paaki-safai aadha imaan hai.", src: "Muslim" },
  { ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", hi: "Beshak mushkil ke saath aasani hai.", src: "Qur'an 94:5" },
  { ar: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ", hi: "Allah ko sabse pasandeeda amal wo hai jo hamesha ho, chahe thoda ho.", src: "Bukhari" },
  { ar: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ", hi: "Neki aur parhezgari me ek dusre ki madad karo.", src: "Qur'an 5:2" },
  { ar: "مَنْ بَنَىٰ مَسْجِدًا لِلَّهِ بَنَى اللَّهُ لَهُ بَيْتًا فِي الْجَنَّةِ", hi: "Jo Allah ke liye masjid banaye, Allah uske liye jannat me ghar banata hai.", src: "Bukhari, Muslim" },
  { ar: "الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ", hi: "Raham karne walon par Rahman raham karta hai.", src: "Tirmizi" },
  { ar: "إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ", hi: "Allah pasand karta hai ki jab koi kaam karo to use achhi tarah karo.", src: "Tabarani" },
  { ar: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ", hi: "Namaz qayam karo aur zakat ada karo.", src: "Qur'an 2:43" },
  { ar: "الصَّدَقَةُ تُطْفِئُ الْخَطِيئَةَ كَمَا يُطْفِئُ الْمَاءُ النَّارَ", hi: "Sadqa gunaah ko aise bujhata hai jaise paani aag ko.", src: "Tirmizi" },
  { ar: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", hi: "Aye imaan walo, sabr aur namaz se madad lo.", src: "Qur'an 2:153" }
];

/* ---------------- DEMO data (sirf placeholder config par) ---------------- */
const DEMO_KEY = "mc_demo_db_v1";
function demoSeed() {
  const houses = [
    { id: "h1", house_no: 1, head_name: "Md Salim", mobile: "9000000001" },
    { id: "h2", house_no: 2, head_name: "Umar Faruk", mobile: "9000000002" },
    { id: "h3", house_no: 3, head_name: "Md Rustam", mobile: "9000000003" }
  ];
  const months = ["2026-09", "2026-10", "2026-11"];
  const charges = []; let cid = 1;
  houses.forEach(h => months.forEach(m => charges.push({ id: "c" + (cid++), house_id: h.id, month: m, amount: 150 })));
  return {
    pin: "1234",
    settings: defaultSettings(),
    houses,
    charges,
    payments: [
      { id: "p1", house_id: "h1", amount: 450, method: "cash", note: "3 mahine", date: "2026-11-05" },
      { id: "p2", house_id: "h2", amount: 150, method: "upi", note: "", date: "2026-11-08" }
    ],
    claims: [],
    income: [ { id: "i1", head: "Juma Token", amount: 850, date: "2026-11-13", note: "Juma collection" } ],
    expenses: [ { id: "e1", head: "Bijli Bill", amount: 640, date: "2026-11-10", note: "" } ],
    announcements: [ { id: "a1", title: "Juma Namaz", body: "Juma ki namaz dopahar 1:30 baje hogi.", date: "2026-11-13" } ],
    namaz: { fajr: "5:00", dhuhr: "1:30", asr: "3:45", maghrib: "5:15", isha: "7:30", juma: "1:30", note: "" },
    suggestions: []
  };
}
function defaultSettings() {
  return {
    committee_name: "Millat Committee Moti Nagar Matia",
    address: "Vill- Matia, Po- Matia, Ps- Laxmipur, Dist- Jamui, BR 811312",
    monthly_fee: 150,
    upi_id: "9931882079@ybl",
    sanchalak: {
      "Sardar": ["Md Salim", "Umar Faruk", "Md Rustam"],
      "Secretary": ["Md Salim", "Umar Faruk"],
      "Khazanchi": ["Md Salman Ansari", "Saddam Hussain", "Sadakat Husain", "Md Faiyaz"],
      "Imam Sahab": ["Inzmamul Haque"]
    }
  };
}
function demoDB() {
  try { const d = JSON.parse(localStorage.getItem(DEMO_KEY)); if (d) return d; } catch (e) {}
  const d = demoSeed(); localStorage.setItem(DEMO_KEY, JSON.stringify(d)); return d;
}
function demoSave(d) { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); }
const uid = () => "x" + Math.random().toString(36).slice(2, 10);

/* Khata calculation: payments FIFO se charges par lagte hain */
function computeKhata(db, houseId) {
  const charges = db.charges.filter(c => c.house_id === houseId).sort((a, b) => a.month < b.month ? -1 : 1);
  const payments = db.payments.filter(p => p.house_id === houseId).sort((a, b) => a.date < b.date ? -1 : 1);
  let pool = payments.reduce((s, p) => s + Number(p.amount), 0);
  const rows = charges.map(c => {
    const paid = Math.min(pool, Number(c.amount)); pool -= paid;
    return { month: c.month, amount: Number(c.amount), paid, due: Number(c.amount) - paid };
  });
  const totalBill = rows.reduce((s, r) => s + r.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  return { rows, payments, totalBill, totalPaid, totalDue: Math.max(0, totalBill - totalPaid), advance: Math.max(0, totalPaid - totalBill) };
}
function totals(db) {
  const feePaid = db.payments.reduce((s, p) => s + Number(p.amount), 0);
  const other = db.income.reduce((s, i) => s + Number(i.amount), 0);
  const exp = db.expenses.reduce((s, e) => s + Number(e.amount), 0);
  return { income: feePaid + other, expense: exp, balance: feePaid + other - exp };
}

/* ---------------- API layer ---------------- */
const api = {
  async getSettings() {
    if (DEMO) return demoDB().settings;
    const { data } = await sb.from("settings").select("*").eq("id", 1).single();
    return data || defaultSettings();
  },
  async getPublic() {
    if (DEMO) {
      const db = demoDB();
      const t = totals(db);
      const dues = db.houses.reduce((s, h) => s + computeKhata(db, h.id).totalDue, 0);
      return { settings: db.settings, announcements: db.announcements, namaz: db.namaz,
               income: db.income, expenses: db.expenses,
               summary: { income: t.income, expense: t.expense, balance: t.balance, total_dues: dues, houses: db.houses.length, advance_total: db.houses.reduce((sm, h) => sm + computeKhata(db, h.id).advance, 0) } };
    }
    const [s, ann, nam, inc, exp, sum] = await Promise.all([
      sb.from("settings").select("*").eq("id", 1).single(),
      sb.from("announcements").select("*").order("date", { ascending: false }),
      sb.from("namaz_times").select("*").eq("id", 1).single(),
      sb.from("income_entries").select("*").order("date", { ascending: false }),
      sb.from("expense_entries").select("*").order("date", { ascending: false }),
      sb.rpc("get_public_summary")
    ]);
    return { settings: s.data || defaultSettings(), announcements: ann.data || [], namaz: nam.data || {},
             income: inc.data || [], expenses: exp.data || [], summary: sum.data || {} };
  },
  async searchHouse(q) {
    if (DEMO) {
      const db = demoDB(); q = String(q).trim().toLowerCase();
      return db.houses.filter(h => String(h.house_no) === q || h.mobile === q || h.head_name.toLowerCase().includes(q))
        .map(h => ({ house_id: h.id, house_no: h.house_no, head_name: h.head_name, total_due: computeKhata(db, h.id).totalDue }));
    }
    const { data, error } = await sb.rpc("search_house", { p_query: q });
    if (error) throw error; return data || [];
  },
  async getKhata(houseId, proof) {
    if (DEMO) {
      const db = demoDB(); const h = db.houses.find(x => x.id === houseId);
      if (!h) throw new Error("Ghar nahi mila");
      if (!(h.mobile === proof.trim() || h.head_name.toLowerCase() === proof.trim().toLowerCase()))
        throw new Error("Tasdeek fail — registered mobile ya mukhiya ka sahi naam daalein");
      const k = computeKhata(db, houseId);
      return { house: h, rows: k.rows, payments: k.payments, total_due: k.totalDue, total_bill: k.totalBill, total_paid: k.totalPaid, advance: k.advance, upi_id: db.settings.upi_id };
    }
    const { data, error } = await sb.rpc("get_house_khata", { p_house_id: houseId, p_proof: proof });
    if (error) throw error; if (data && data.error) throw new Error(data.error); return data;
  },
  async submitClaim(houseId, mobile, amount, ref) {
    if (DEMO) {
      const db = demoDB(); const h = db.houses.find(x => x.id === houseId);
      if (!h || h.mobile !== mobile.trim()) throw new Error("Mobile number is ghar se match nahi hua");
      db.claims.push({ id: uid(), house_id: houseId, amount: Number(amount), ref: ref || "", status: "pending", date: new Date().toISOString().slice(0, 10) });
      demoSave(db); return true;
    }
    const { data, error } = await sb.rpc("submit_claim", { p_house_id: houseId, p_mobile: mobile, p_amount: amount, p_ref: ref || "" });
    if (error) throw error; if (data && data.error) throw new Error(data.error); return true;
  },
  async addSuggestion(name, message) {
    if (DEMO) { const db = demoDB(); db.suggestions.push({ id: uid(), name, message, date: new Date().toISOString().slice(0, 10) }); demoSave(db); return true; }
    const { error } = await sb.from("suggestions").insert({ name, message });
    if (error) throw error; return true;
  },
  async monthlyReport(month) {
    if (DEMO) {
      const db = demoDB();
      const fee = db.payments.filter(p => p.date.startsWith(month)).reduce((s, p) => s + Number(p.amount), 0);
      const inc = db.income.filter(i => i.date.startsWith(month));
      const exp = db.expenses.filter(e => e.date.startsWith(month));
      return { month, fee_income: fee, income: inc, expenses: exp,
               total_income: fee + inc.reduce((s, i) => s + Number(i.amount), 0),
               total_expense: exp.reduce((s, e) => s + Number(e.amount), 0) };
    }
    const { data, error } = await sb.rpc("get_monthly_report", { p_month: month });
    if (error) throw error; return data;
  },
  /* ---- Committee (PIN) ---- */
  async verifyPin(pin) {
    if (DEMO) return demoDB().pin === pin;
    const { data, error } = await sb.rpc("verify_pin", { p_pin: pin });
    if (error) throw error; return !!data;
  },
  async rpc(name, args) {
    const { data, error } = await sb.rpc(name, args);
    if (error) throw error; if (data && data.error) throw new Error(data.error); return data;
  },
  async adminDashboard(pin) {
    if (DEMO) {
      const db = demoDB(); const t = totals(db);
      const claims = db.claims.filter(c => c.status === "pending").map(c => ({ ...c, house_no: (db.houses.find(h => h.id === c.house_id) || {}).house_no, head_name: (db.houses.find(h => h.id === c.house_id) || {}).head_name }));
      const months = [...new Set(db.charges.map(c => c.month))].sort();
      return { houses: db.houses.length, balance: t.balance, total_dues: db.houses.reduce((s, h) => s + computeKhata(db, h.id).totalDue, 0), pending_claims: claims, charge_months: months };
    }
    return this.rpc("admin_dashboard", { p_pin: pin });
  },
  async adminHouses(pin) {
    if (DEMO) { const db = demoDB(); return db.houses.map(h => ({ ...h, total_due: computeKhata(db, h.id).totalDue })); }
    return this.rpc("admin_list_houses", { p_pin: pin });
  },
  async adminDefaulters(pin) {
    const hs = await this.adminHouses(pin);
    return hs.filter(h => Number(h.total_due) > 0);
  },
  async adminKhata(pin, houseId) {
    if (DEMO) {
      const db = demoDB(); const h = db.houses.find(x => x.id === houseId);
      if (!h) throw new Error("Ghar nahi mila");
      const k = computeKhata(db, houseId);
      const rows = k.rows.map(r => ({ ...r, id: (db.charges.find(c => c.house_id === houseId && c.month === r.month) || {}).id }));
      return { house: h, rows, payments: k.payments, total_due: k.totalDue, total_bill: k.totalBill, total_paid: k.totalPaid, advance: k.advance, upi_id: db.settings.upi_id };
    }
    return this.rpc("admin_get_khata", { p_pin: pin, p_house_id: houseId });
  },
  async adminBackup(pin) {
    if (DEMO) return demoDB();
    return this.rpc("admin_export_backup", { p_pin: pin });
  },
  async adminSuggestions(pin) {
    if (DEMO) return demoDB().suggestions;
    return this.rpc("admin_list_suggestions", { p_pin: pin });
  }
};

/* ---------------- UI helpers ---------------- */
const $root = document.getElementById("viewRoot");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rs = n => "₹" + Number(n || 0).toLocaleString("en-IN");
const monthName = m => { const [y, mo] = String(m).split("-"); const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; return (names[Number(mo) - 1] || m) + " " + y; };
let PUB = null;           // public data cache
let STATE = { view: "home", khataHouse: null, khata: null };

function nasihatOfDay() {
  const now = new Date();
  const dayIdx = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return NASIHAT[dayIdx % NASIHAT.length];
}
function homeMetaText() {
  const s = PUB.summary || {};
  return `कुल ${s.houses ?? ""} घर • इमाम साहब फ़ीस ${rs(PUB.settings.monthly_fee)}/घर/महीना • कुल बकाया ${rs(s.total_dues)}${Number(s.advance_total) > 0 ? ` • <span class="paid">Advance jama ${rs(s.advance_total)}</span>` : ""}`;
}
function homeListHTML(list) {
  return (list || []).slice(0, 3).map(i => `<div class="list-item"><span>${esc(i.head)} <span class="muted">${esc(i.date)}</span></span><b>${rs(i.amount)}</b></div>`).join("") || '<p class="muted">अभी कोई entry नहीं</p>';
}
function startClock() {
  const tick = () => {
    const el = document.getElementById("liveClock"); if (!el) return;
    const now = new Date();
    const t = now.toLocaleTimeString("en-IN", { hour12: true }).toUpperCase();
    const d = now.toLocaleDateString("hi-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    el.textContent = "🕐 " + t + " • " + d;
  };
  tick();
  if (window._clockTimer) clearInterval(window._clockTimer);
  window._clockTimer = setInterval(tick, 1000);
}
/* ---------- Auto refresh: har 5 second me taaza data ---------- */
function startAutoRefresh() {
  if (window._arTimer) clearInterval(window._arTimer);
  window._arTimer = setInterval(autoRefresh, 5000);
}
async function autoRefresh() {
  if (document.hidden) return;
  if (document.getElementById("modalRoot").innerHTML) return;              // modal khula hai to disturb na karo
  if (!document.getElementById("pinSheet").classList.contains("hidden")) return;
  const ae = document.activeElement;
  if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && ae.value) return;  // kuch likha ja raha hai
  if (STATE.view === "committee") return;                                   // admin kaam kar raha hai
  try {
    const fresh = await api.getPublic();
    const changed = JSON.stringify(fresh.summary) !== JSON.stringify(PUB ? PUB.summary : null)
      || JSON.stringify((fresh.income || []).slice(0, 3)) !== JSON.stringify(PUB ? (PUB.income || []).slice(0, 3) : null)
      || JSON.stringify((fresh.expenses || []).slice(0, 3)) !== JSON.stringify(PUB ? (PUB.expenses || []).slice(0, 3) : null)
      || JSON.stringify(fresh.announcements) !== JSON.stringify(PUB ? PUB.announcements : null)
      || JSON.stringify(fresh.namaz) !== JSON.stringify(PUB ? PUB.namaz : null);
    PUB = fresh; applySettings();
    if (STATE.view === "home") {
      if (changed) patchHome();
    } else if (STATE.view === "khata" && STATE.khataHouse && STATE.proof) {
      const pb = document.getElementById("payBox");
      if (pb && pb.innerHTML) return;                                        // payment form khula hai
      const k = await api.getKhata(STATE.khataHouse, STATE.proof);
      if (!STATE.khata || k.total_paid !== STATE.khata.total_paid || k.total_due !== STATE.khata.total_due || Number(k.advance || 0) !== Number(STATE.khata.advance || 0) || k.payments.length !== STATE.khata.payments.length) {
        STATE.khata = k; renderKhataTab();
      }
    } else if (STATE.view === "report") {
      const rm = document.getElementById("repMonth");
      const cur = new Date().toISOString().slice(0, 7);
      if (changed && rm && rm.value === cur) renderReport();
    } else if (STATE.view === "namaz" || STATE.view === "sanchalak") {
      if (changed) go(STATE.view);
    }
  } catch (e) { /* network hichki — agle 5 sec me phir koshish */ }
}
function patchHome() {
  const board = document.getElementById("homeBoard"); if (!board) return;
  const s = PUB.summary || {};
  const amts = board.querySelectorAll(".amt");
  if (amts[0]) amts[0].textContent = rs(s.income);
  if (amts[1]) amts[1].textContent = rs(s.expense);
  if (amts[2]) amts[2].textContent = rs(s.balance);
  const meta = document.getElementById("homeMeta"); if (meta) meta.innerHTML = homeMetaText();
  const il = document.getElementById("homeIncList"); if (il) il.innerHTML = homeListHTML(PUB.income);
  const el = document.getElementById("homeExpList"); if (el) el.innerHTML = homeListHTML(PUB.expenses);
}
function setNav(view) {
  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.toggle("active", b.dataset.nav === view));
}
async function go(view, arg) {
  STATE.view = view; setNav(view);
  window.scrollTo(0, 0);
  try { PUB = await api.getPublic(); } catch (e) { if (!PUB) throw e; }
  if (view === "home") renderHome();
  else if (view === "khata") renderKhataTab(arg);
  else if (view === "report") renderReport();
  else if (view === "namaz") renderNamaz();
  else if (view === "sanchalak") renderSanchalak();
  else if (view === "committee") renderCommittee();
}

/* ---------------- HOME ---------------- */
function renderHome() {
  const s = PUB.summary || {}; const n = nasihatOfDay();
  $root.innerHTML = `
  <div class="card">
    <h2>🔍 अपना खाता खोजें</h2>
    <div class="search-box">
      <input id="hq" placeholder="घर नं. / नाम / मोबाइल नंबर">
      <button class="btn primary" id="hSearch">खोजें</button>
    </div>
    <p class="muted" style="font-size:12.5px;margin:8px 0 0">सिर्फ़ घर नंबर, मुखिया का नाम या रजिस्टर्ड मोबाइल — किसी एक से खाता खुल जाएगा।</p>
    <div id="hResults"></div>
  </div>
  <div class="nasihat">
    <div class="tag">🌙 आज की नसीहत</div>
    <div class="ar">${esc(n.ar)}</div>
    <div class="hi">${esc(n.hi)}</div>
    <div class="src">— ${esc(n.src)}</div>
  </div>
  <div class="card">
    <h2>💰 Committee का हिसाब <span class="ar-lbl">الحساب</span></h2>
    <div class="balance-board" id="homeBoard">
      <div><div class="amt">${rs(s.income)}</div><div class="lbl">कुल आमदनी</div></div>
      <div><div class="amt">${rs(s.expense)}</div><div class="lbl">कुल ख़र्चा</div></div>
      <div><div class="amt">${rs(s.balance)}</div><div class="lbl">बचा पैसा</div></div>
    </div>
    <p class="muted" style="font-size:13px;margin:10px 0 0" id="homeMeta">${homeMetaText()}</p>
  </div>
  <div class="card">
    <h2>📋 आमदनी (ताज़ा) <span class="ar-lbl">الإيرادات</span></h2>
    <div id="homeIncList">${homeListHTML(PUB.income)}</div>
    <h2 style="margin-top:14px">🧾 ख़र्चा (ताज़ा)</h2>
    <div id="homeExpList">${homeListHTML(PUB.expenses)}</div>
  </div>
  <div class="card">
    <h2>✉️ सुझाव / शिकायत</h2>
    <input id="sgName" placeholder="आपका नाम">
    <textarea id="sgMsg" rows="3" placeholder="अपना सुझाव या शिकायत लिखें"></textarea>
    <button class="btn gold block" id="sgSend">Committee को भेजें</button>
    <p id="sgOk" class="muted"></p>
  </div>`;
  document.getElementById("hSearch").onclick = doSearch;
  document.getElementById("hq").addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });
  document.getElementById("sgSend").onclick = async () => {
    const name = document.getElementById("sgName").value.trim(), msg = document.getElementById("sgMsg").value.trim();
    if (!name || !msg) return alert("नाम और संदेश दोनों लिखें");
    await api.addSuggestion(name, msg);
    document.getElementById("sgOk").textContent = "✅ भेज दिया गया. शुक्रिया!";
    document.getElementById("sgName").value = ""; document.getElementById("sgMsg").value = "";
  };
}
async function doSearch() {
  const q = document.getElementById("hq").value.trim();
  const box = document.getElementById("hResults");
  if (!q) { box.innerHTML = '<p class="error">पहले कुछ लिखें</p>'; return; }
  box.innerHTML = '<p class="muted">खोज रहे हैं…</p>';
  try {
    const res = await api.searchHouse(q);
    if (!res.length) { box.innerHTML = '<p class="error">कोई घर नहीं मिला. घर नं. / नाम / मोबाइल ठीक से डालकर फिर कोशिश करें।</p>'; return; }
    box.innerHTML = res.map(h => `
      <div class="list-item"><span>🏠 घर नं. ${esc(h.house_no)} — ${esc(h.head_name)}<br>
      <span class="${Number(h.total_due) > 0 ? "due" : "paid"}">बकाया: ${rs(h.total_due)}</span></span>
      <button class="btn small primary" onclick="openVerify('${h.house_id}')">खाता खोलें</button></div>`).join("");
  } catch (e) { box.innerHTML = '<p class="error">' + esc(e.message) + "</p>"; }
}
function openVerify(houseId) {
  showModal(`
    <h3>🔐 तसदीक़</h3>
    <p class="muted">इस घर का रजिस्टर्ड मोबाइल नंबर या मुखिया का पूरा नाम डालें — खाता सिर्फ़ उसी को दिखेगा।</p>
    <input id="vfProof" placeholder="मोबाइल नंबर या मुखिया का नाम">
    <p id="vfErr" class="error"></p>
    <div class="row"><button class="btn ghost" onclick="closeModal()">Cancel</button>
    <button class="btn primary" id="vfGo">खाता देखें</button></div>`);
  document.getElementById("vfGo").onclick = async () => {
    const proof = document.getElementById("vfProof").value.trim();
    try {
      const k = await api.getKhata(houseId, proof);
      STATE.khataHouse = houseId; STATE.khata = k; STATE.proof = proof;
      closeModal(); go("khata");
    } catch (e) { document.getElementById("vfErr").textContent = e.message; }
  };
}

/* ---------------- KHATA TAB ---------------- */
function renderKhataTab() {
  const k = STATE.khata;
  if (!k) {
    $root.innerHTML = `<div class="card khata-head"><h2>📒 मेरा खाता</h2>
      <p class="muted">पहले Home पर जाकर अपना घर खोजें, फिर तसदीक़ करके खाता खोलें।</p>
      <button class="btn primary" onclick="go('home')">Home पर खोजें</button></div>`;
    return;
  }
  const h = k.house;
  $root.innerHTML = `
  <div class="card">
    <div class="khata-head">
      <h2>🏠 घर नं. ${esc(h.house_no)} — ${esc(h.head_name)}</h2>
      <div class="big-due ${k.total_due > 0 ? "due" : "paid"}">कुल बकाया: ${rs(k.total_due)}</div>
      ${Number(k.advance) > 0 ? `<div class="big-due paid" style="font-size:17px">✅ Advance जमा: ${rs(k.advance)} <span style="font-size:12.5px">(आगे के बिल में adjust होगा)</span></div>` : ""}
      <p class="muted">कुल बिल ${rs(k.total_bill)} • कुल दिया ${rs(k.total_paid)}</p>
    </div>
    <table><tr><th>महीना</th><th class="num">बिल</th><th class="num">दिया</th><th class="num">बाकी</th></tr>
    ${k.rows.map(r => `<tr><td>${monthName(r.month)}</td><td class="num">${rs(r.amount)}</td><td class="num">${rs(r.paid)}</td><td class="num ${r.due > 0 ? "due" : "paid"}">${rs(r.due)}</td></tr>`).join("")}
    </table>
    <div class="row" style="margin-top:12px">
      <button class="btn gold" id="payBtn">💳 UPI से भुगतान करें</button>
      <button class="btn ghost" id="khataPdf">⬇️ खाता PDF Download</button>
      <button class="btn gold" id="khataWa">🟢 WhatsApp पर खाता</button>
    </div>
    <div id="payBox"></div>
  </div>
  <div class="card">
    <h2>💵 Payment History</h2>
    ${k.payments.length ? k.payments.map(p => `<div class="list-item"><span>${esc(p.date)} • ${p.method === "upi" ? "UPI" : "Cash"} ${esc(String(p.note || "").replace(/^UPI claim\s*/i, "Ref: "))}</span><b>${rs(p.amount)}</b>
      <button class="btn small ghost" onclick='showReceipt(${JSON.stringify(p.id)})'>रसीद</button></div>`).join("") : '<p class="muted">अभी कोई payment नहीं</p>'}
  </div>`;
  document.getElementById("khataPdf").onclick = () => printKhata(k);
  document.getElementById("khataWa").onclick = () => {
    const lines = ["Millat Committee Moti Nagar Matia — मेरा खाता", "घर नं. " + h.house_no + " — " + h.head_name, "कुल बिल: " + rs(k.total_bill) + " • कुल दिया: " + rs(k.total_paid) + " • बकाया: " + rs(k.total_due), "", ...k.rows.filter(r => r.due > 0).map(r => monthName(r.month) + ": बाकी " + rs(r.due))];
    window.open("https://wa.me/?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  };
  document.getElementById("payBtn").onclick = () => {
    const upi = k.upi_id || PUB.settings.upi_id;
    const due = Number(k.total_due || 0);
    const proofIsMobile = /^\d{10}$/.test(STATE.proof || "");
    document.getElementById("payBox").innerHTML = `
      <div class="receipt" style="margin-top:12px">
        <h3>UPI Payment</h3>
        <p>Committee UPI ID: <b>${esc(upi)}</b> <button class="btn small ghost" id="cpUpi">📋 Copy</button></p>
        <img alt="UPI QR" style="width:170px;height:170px;display:block;margin:8px auto" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("upi://pay?pa=" + upi + "&pn=Millat Committee" + (due > 0 ? "&am=" + due : "") + "&cu=INR")}">
        <p class="muted" style="text-align:center;font-size:12.5px">QR scan karke bhi pay kar sakte hain</p>
        <label>Kitna pay karna hai (₹)</label>
        <input id="payAmt" type="number" value="${due > 0 ? due : ""}" placeholder="रक़म ₹">
        <a class="btn primary block" id="upiGo" href="#">📱 UPI App से Pay करें</a>
        <p class="muted" style="font-size:13px">UPI app khulega — waha payment pura karein। Uske baad neeche दावा (claim) bhejna na bhoolein — ख़ज़ांची ki तसदीक़ ke baad hi बकाया kam hoga।</p>
        <hr>
        <h3>Payment का दावा भेजें</h3>
        ${proofIsMobile ? "" : '<input id="clMob" type="number" placeholder="रजिस्टर्ड मोबाइल नंबर (10 अंक)">'}
        <input id="clAmt" type="number" placeholder="कितना दिया (₹)">
        <input id="clRef" placeholder="UPI Ref / Transaction ID (अगर हो)">
        <button class="btn gold block" id="clSend">✅ दावा भेजें</button>
        <p id="clMsg" class="muted"></p>
      </div>`;
    const syncLink = () => {
      const a = Number(document.getElementById("payAmt").value);
      const link = "upi://pay?pa=" + encodeURIComponent(upi) + "&pn=" + encodeURIComponent("Millat Committee") + (a > 0 ? "&am=" + a : "") + "&cu=INR&tn=" + encodeURIComponent("Ghar " + h.house_no + " Imam Fees");
      document.getElementById("upiGo").href = link;
      const ca = document.getElementById("clAmt"); if (ca && a > 0 && !ca.value) ca.value = a;
    };
    document.getElementById("payAmt").addEventListener("input", syncLink); syncLink();
    document.getElementById("cpUpi").onclick = async () => { try { await navigator.clipboard.writeText(upi); alert("UPI ID copy ho gaya: " + upi); } catch (e) { alert("UPI ID: " + upi); } };
    document.getElementById("clSend").onclick = async () => {
      const amt = Number(document.getElementById("clAmt").value);
      const ref = document.getElementById("clRef").value.trim();
      const msg = document.getElementById("clMsg");
      const btn = document.getElementById("clSend");
      if (!amt || amt <= 0) { msg.textContent = "❌ Sahi rakam daalein"; return; }
      const mobile = proofIsMobile ? STATE.proof : (document.getElementById("clMob").value || "").trim();
      if (!/^\d{10}$/.test(mobile)) { msg.textContent = "❌ Sahi 10-ank ka registered mobile number daalein"; return; }
      btn.disabled = true; msg.textContent = "Bhej rahe hain…";
      try {
        await api.submitClaim(STATE.khataHouse, mobile, amt, ref);
        msg.textContent = "✅ दावा bhej diya gaya! Khazanchi ki tasdeeq ke baad bakaya kam ho jayega।";
        btn.textContent = "✅ दावा Bhej Diya Gaya";
      } catch (e) { msg.textContent = "❌ " + e.message; btn.disabled = false; }
    };
  };
}
function showReceipt(paymentId) {
  const k = STATE.khata; if (!k) return;
  const p = k.payments.find(x => x.id === paymentId); if (!p) return;
  const html = receiptHTML(k.house, p);
  showModal(html + `<div class="row" style="margin-top:10px"><button class="btn ghost" onclick="closeModal()">बंद करें</button>
    <button class="btn primary" onclick="printReceipt()">⬇️ PDF Download</button>
    <button class="btn gold" onclick="shareReceiptWa()">🟢 WhatsApp</button></div>`);
  window._lastReceipt = { house: k.house, payment: p };
}
function shareReceiptWa() {
  const r = window._lastReceipt; if (!r) return;
  const t = ["🧾 Millat Committee Moti Nagar Matia — Payment रसीद", "रसीद नं.: " + receiptNo(r.payment), "घर नं. " + r.house.house_no + " — " + r.house.head_name, "रक़म: " + rs(r.payment.amount) + " (" + (r.payment.method === "upi" ? "UPI" : "Cash") + ")", "तारीख़: " + r.payment.date, "✔ तसदीक़शुदा — Jazakallah Khairan"].join("\n");
  window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank");
}
function receiptNo(p) { return "MC-" + String(p.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase(); }
function amountWords(n) {
  n = Math.floor(Math.abs(Number(n) || 0)); if (n === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = x => x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : "");
  const three = x => (Math.floor(x / 100) ? ones[Math.floor(x / 100)] + " Hundred " : "") + two(x % 100);
  let out = "";
  const cr = Math.floor(n / 10000000); n %= 10000000;
  const lk = Math.floor(n / 100000); n %= 100000;
  const th = Math.floor(n / 1000); n %= 1000;
  if (cr) out += three(cr) + " Crore ";
  if (lk) out += two(lk) + " Lakh ";
  if (th) out += two(th) + " Thousand ";
  if (n) out += three(n);
  return out.trim();
}
function receiptHTML(house, p) {
  const k = STATE.khata;
  const nowStr = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  return `<div class="receipt">
    <div class="rc-band"><div class="rc-name">Millat Committee Moti Nagar Matia</div>
    <div class="rc-addr">Vill- Matia, Po- Matia, Ps- Laxmipur, Dist- Jamui, BR 811312</div>
    <div class="rc-title">PAYMENT रसीद</div></div>
    <div class="rc-row"><span>रसीद नं.</span><b>${receiptNo(p)}</b></div>
    <div class="rc-row"><span>तारीख़</span><b>${esc(p.date)}</b></div>
    <div class="rc-row"><span>घर नं. / नाम</span><b>घर ${esc(house.house_no)} — ${esc(house.head_name)}</b></div>
    ${house.mobile ? `<div class="rc-row"><span>मोबाइल</span><b>${esc(house.mobile)}</b></div>` : ""}
    <div class="rc-row"><span>तरीका</span><b>${p.method === "upi" ? "UPI (Online)" : "Cash (नकद)"}</b></div>
    ${p.note ? `<div class="rc-row"><span>नोट</span><b>${esc(p.note)}</b></div>` : ""}
    <div class="rc-amt">${rs(p.amount)}</div>
    <div class="rc-words">Rupees ${amountWords(p.amount)} Only</div>
    ${k ? `<div class="rc-row"><span>कुल बिल / दिया / बकाया</span><b>${rs(k.total_bill)} / ${rs(k.total_paid)} / ${rs(k.total_due)}</b></div>` : ""}
    ${k && Number(k.advance) > 0 ? `<div class="rc-row"><span>Advance जमा (आगे adjust होगा)</span><b>${rs(k.advance)}</b></div>` : ""}
    <div class="rc-row"><span>रसीद बनी</span><b>${nowStr}</b></div>
    <p class="paid">✔ तसदीक़शुदा — Jazakallah Khairan</p>
    <p class="rc-foot">Ye computer-generated raseed hai — Millat Committee Moti Nagar Matia</p></div>`;
}
function printReceipt() { if (window._lastReceipt) printDoc("Payment Receipt — " + receiptNo(window._lastReceipt.payment), receiptHTML(window._lastReceipt.house, window._lastReceipt.payment)); }
function printKhata(k) {
  printDoc("Khata — Ghar No. " + k.house.house_no, `<h2>Millat Committee Moti Nagar Matia</h2>
    <p>घर नं. ${esc(k.house.house_no)} — ${esc(k.house.head_name)} • कुल बकाया: ${rs(k.total_due)}</p>
    <table border="1" cellspacing="0" cellpadding="6"><tr><th>महीना</th><th>बिल</th><th>दिया</th><th>बाकी</th></tr>
    ${k.rows.map(r => `<tr><td>${monthName(r.month)}</td><td>${rs(r.amount)}</td><td>${rs(r.paid)}</td><td>${rs(r.due)}</td></tr>`).join("")}</table>`);
}
function printDoc(title, html) {
  const nowStr = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  const letterhead = `<div class="lh">
    <div class="lh-bis">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
    <div class="lh-name">Millat Committee Moti Nagar Matia</div>
    <div class="lh-ar">ملّت کمیٹی — موٹی نگر، ماتیا</div>
    <div class="lh-addr">Vill- Matia, Po- Matia, Ps- Laxmipur, Dist- Jamui, BR 811312</div>
    <div class="lh-rule"></div>
    <div class="lh-title">${esc(title)}</div>
  </div>`;
  const doc = `<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>body{font-family:'Hind','Noto Sans Devanagari',sans-serif;color:#14352a;margin:24px}h2{color:#0e5a41}table{border-collapse:collapse;width:100%}td,th{padding:6px 8px;text-align:left}.lh{text-align:center;margin-bottom:18px}.lh-bis{font-size:19px;color:#8a6d00}.lh-name{font-size:25px;font-weight:800;color:#0e5a41;margin-top:6px}.lh-ar{font-size:15px;color:#555}.lh-addr{font-size:12.5px;color:#666;margin-top:2px}.lh-rule{height:3px;background:linear-gradient(90deg,transparent,#c9a227,#0e5a41,#c9a227,transparent);margin:10px 0 8px;border-radius:2px}.lh-title{display:inline-block;background:#0e5a41;color:#fff;font-weight:700;padding:4px 18px;border-radius:999px;font-size:14.5px}.doc-foot{margin-top:22px;border-top:1px dashed #bbb;padding-top:8px;font-size:11.5px;color:#888;text-align:center}.receipt{border:2px solid #0e5a41;border-radius:14px;padding:0;overflow:hidden;max-width:480px;margin:0 auto}.rc-band{background:#0e5a41;color:#fff;text-align:center;padding:14px 10px}.rc-name{font-size:19px;font-weight:700}.rc-addr{font-size:12px;opacity:.9}.rc-title{display:inline-block;margin-top:8px;background:#c9a227;color:#14352a;font-weight:700;padding:2px 14px;border-radius:999px;font-size:13px}.rc-row{display:flex;justify-content:space-between;gap:10px;padding:7px 14px;border-bottom:1px dashed #cfd8d2;font-size:14px}.rc-amt{text-align:center;font-size:30px;font-weight:800;color:#0e5a41;padding:10px 0 0}.rc-words{text-align:center;font-size:13px;color:#555;padding-bottom:8px}.paid{text-align:center;color:#0e5a41;font-weight:700}.rc-foot{text-align:center;font-size:11px;color:#888;padding:0 10px 12px}</style></head>
  <body>${letterhead}${html}<div class="doc-foot">Printed: ${nowStr} • Millat Committee Moti Nagar Matia — ye computer-generated dastavej hai</div></body></html>`;
  if (window.AndroidPrinter && window.AndroidPrinter.printHtml) { window.AndroidPrinter.printHtml(doc); return; }
  const w = window.open("", "_blank");
  if (w) { w.document.write(doc); w.document.close(); w.focus(); setTimeout(() => { try { w.print(); } catch (e) {} }, 350); return; }
  const pa = document.getElementById("printArea");
  pa.innerHTML = letterhead + html;
  window.print();
}

/* ---------------- REPORT ---------------- */
async function renderReport() {
  const cur = new Date().toISOString().slice(0, 7);
  $root.innerHTML = `
  <div class="card"><h2>📊 Monthly Report <span class="ar-lbl">التقرير الشهري</span></h2>
    <div class="row"><input type="month" id="repMonth" value="${cur}"><button class="btn primary" id="repGo">देखें</button></div>
    <div id="repBody"></div>
    <button class="btn gold block" id="repPdf" style="margin-top:10px">⬇️ Report PDF Download</button>
  </div>
  <div class="card"><h2>📈 हिसाब सारांश</h2>
    <div class="balance-board">
      <div><div class="amt">${rs(PUB.summary.income)}</div><div class="lbl">कुल आमदनी</div></div>
      <div><div class="amt">${rs(PUB.summary.expense)}</div><div class="lbl">कुल ख़र्चा</div></div>
      <div><div class="amt">${rs(PUB.summary.balance)}</div><div class="lbl">बचा पैसा</div></div>
    </div>
    <button class="btn ghost block" id="waShare" style="margin-top:12px">🟢 हिसाब WhatsApp पर भेजें</button>
  </div>`;
  const load = async () => {
    const m = document.getElementById("repMonth").value || cur;
    const r = await api.monthlyReport(m);
    STATE._report = r;
    const incRows = (r.income || []).map(i => `<div class="list-item"><span>${esc(i.head)}</span><b>${rs(i.amount)}</b></div>`).join("");
    const expRows = (r.expenses || []).map(e => `<div class="list-item"><span>${esc(e.head)}</span><b>${rs(e.amount)}</b></div>`).join("");
    document.getElementById("repBody").innerHTML = `
      <h3>${monthName(m)}</h3>
      <div class="list-item"><span>🏠 घर फ़ीस (वसूली)</span><b>${rs(r.fee_income)}</b></div>${incRows}
      <div class="list-item"><span><b>कुल आमदनी</b></span><b>${rs(r.total_income)}</b></div>
      ${expRows}
      <div class="list-item"><span><b>कुल ख़र्चा</b></span><b>${rs(r.total_expense)}</b></div>
      <div class="list-item"><span><b>Balance</b></span><b class="${r.total_income - r.total_expense >= 0 ? "paid" : "due"}">${rs(r.total_income - r.total_expense)}</b></div>
      ${Number(r.advance_total) > 0 ? `<div class="list-item"><span>✅ Advance जमा (घरों के पास, कुल)</span><b class="paid">${rs(r.advance_total)}</b></div>` : ""}`;
  };
  document.getElementById("repGo").onclick = load; load();
  document.getElementById("repPdf").onclick = () => {
    const r = STATE._report; if (!r) return;
    printDoc("Monthly Report " + monthName(r.month), `
      <p>घर फ़ीस वसूली: ${rs(r.fee_income)}</p>
      ${(r.income || []).map(i => `<p>${esc(i.head)}: ${rs(i.amount)}</p>`).join("")}
      <p><b>कुल आमदनी: ${rs(r.total_income)}</b></p>
      ${(r.expenses || []).map(e => `<p>${esc(e.head)}: ${rs(e.amount)}</p>`).join("")}
      <p><b>कुल ख़र्चा: ${rs(r.total_expense)}</b></p><p><b>Balance: ${rs(r.total_income - r.total_expense)}</b></p>
      ${Number(r.advance_total) > 0 ? `<p><b>Advance जमा (कुल): ${rs(r.advance_total)}</b></p>` : ""}`);
  };
  document.getElementById("waShare").onclick = () => {
    const s = PUB.summary;
    const txt = `Millat Committee Moti Nagar Matia — हिसाब%0Aकुल आमदनी: ${rs(s.income)}%0Aकुल ख़र्चा: ${rs(s.expense)}%0Aबचा पैसा: ${rs(s.balance)}%0Aकुल बकाया: ${rs(s.total_dues)}`;
    window.open("https://wa.me/?text=" + txt, "_blank");
  };
}

/* ---------------- NAMAZ / ELAAN ---------------- */
function renderNamaz() {
  const n = PUB.namaz || {};
  const row = (ar, hi, t) => `<div class="list-item"><span>${hi} <span class="muted">${ar}</span></span><b>${esc(t || "-")}</b></div>`;
  $root.innerHTML = `
  <div class="card"><h2>🕌 नमाज़ का समय</h2>
    ${row("الفجر", "फ़ज्र", n.fajr)}${row("الظهر", "ज़ुहर", n.dhuhr)}${row("العصر", "अस्र", n.asr)}
    ${row("المغرب", "मग़रिब", n.maghrib)}${row("العشاء", "इशा", n.isha)}${row("الجمعة", "जुमा", n.juma)}
    ${n.note ? `<p class="muted">${esc(n.note)}</p>` : ""}
  </div>
  <div class="card"><h2>📢 ऐलान Board</h2>
    ${(PUB.announcements || []).map(a => `<div style="padding:8px 0;border-bottom:1px solid #eee"><b>${esc(a.title)}</b> <span class="muted">${esc(a.date)}</span><br>${esc(a.body)}</div>`).join("") || '<p class="muted">कोई ऐलान नहीं</p>'}
  </div>`;
}

/* ---------------- SANCHALAK ---------------- */
function renderSanchalak() {
  const s = PUB.settings.sanchalak || {};
  $root.innerHTML = `<div class="card"><h2>👥 संचालक (Committee) <span class="ar-lbl">اللجنة</span></h2>
    ${Object.entries(s).map(([role, names]) => `<h3>${esc(role)}</h3>` + (names || []).map(n => `<div class="list-item"><span>👤 ${esc(n)}</span></div>`).join("")).join("")}
    <p class="muted" style="margin-top:10px">${esc(PUB.settings.committee_name)}<br>${esc(PUB.settings.address)}</p></div>`;
}

/* ---------------- Modal ---------------- */
function showModal(html) { document.getElementById("modalRoot").innerHTML = `<div class="modal"><div class="modal-card">${html}</div></div>`; }
function closeModal() { document.getElementById("modalRoot").innerHTML = ""; }

/* ---------------- COMMITTEE MODE ---------------- */
let PIN = sessionStorage.getItem("mc_pin") || "";
async function adminWrite(rpcName, args, demoFn) {
  if (DEMO) { const db = demoDB(); const r = demoFn(db); demoSave(db); PUB = null; return r; }
  return api.rpc(rpcName, { p_pin: PIN, ...args });
}
function renderCommittee() {
  if (!PIN) {
    $root.innerHTML = `<div class="card khata-head"><h2>🔒 Committee Mode</h2>
      <p class="muted">Committee Mode खोलने के लिए नीचे वाले 🔒 Committee बटन से PIN डालें।</p></div>`;
    openPinSheet(); return;
  }
  $root.innerHTML = `
  <div class="card"><h2>🔓 Committee Mode</h2>
    <div class="tabs" id="cTabs">
      ${["Dashboard", "घर", "बिल", "Payment", "आमदनी", "ख़र्चा", "बाकी List", "ऐलान/नमाज़", "सुझाव", "Settings"].map((t, i) => `<button data-ct="${i}" class="${i === 0 ? "active" : ""}">${t}</button>`).join("")}
    </div>
    <div id="cBody"></div>
    <div class="row" style="margin-top:12px">
      <button class="btn gold" id="backupBtn">⬇️ पूरा Backup (JSON)</button>
      <button class="btn danger" id="logoutBtn">Lock करें</button>
    </div>
  </div>`;
  document.querySelectorAll("#cTabs button").forEach(b => b.onclick = () => {
    document.querySelectorAll("#cTabs button").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); cTab(Number(b.dataset.ct));
  });
  document.getElementById("logoutBtn").onclick = () => { PIN = ""; sessionStorage.removeItem("mc_pin"); go("home"); };
  document.getElementById("backupBtn").onclick = async () => {
    const data = await api.adminBackup(PIN);
    const text = JSON.stringify(data, null, 2);
    if (window.AndroidPrinter && window.AndroidPrinter.saveTextFile) { window.AndroidPrinter.saveTextFile("millat-committee-backup.json", text); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = "millat-committee-backup.json"; a.click();
  };
  cTab(0);
}
async function cTab(i) {
  const body = document.getElementById("cBody"); if (!body) return;
  body.innerHTML = '<p class="muted">लोड हो रहा है…</p>';
  try {
    if (i === 0) { // Dashboard
      const d = await api.adminDashboard(PIN);
      body.innerHTML = `
        <div class="balance-board">
          <div><div class="amt">${rs(d.balance)}</div><div class="lbl">Balance</div></div>
          <div><div class="amt">${rs(d.total_dues)}</div><div class="lbl">कुल बकाया</div></div>
          <div><div class="amt">${d.houses}</div><div class="lbl">कुल घर</div></div>
        </div>
        <h3 style="margin-top:14px">⏳ Pending Payment दावे (${(d.pending_claims || []).length})</h3>
        ${(d.pending_claims || []).map(c => `<div class="list-item"><span>घर ${esc(c.house_no)} — ${esc(c.head_name || "")}<br>${rs(c.amount)} • ${esc(c.date || "")} ${esc(c.ref || "")}</span>
          <span><button class="btn small primary" onclick="decideClaim('${c.id}',true)">✔ Approve</button>
          <button class="btn small danger" onclick="decideClaim('${c.id}',false)">✖</button></span></div>`).join("") || '<p class="muted">कोई pending दावा नहीं</p>'}
        <h3 style="margin-top:14px">📆 इस महीने का हिसाब</h3>
        <div id="dashMonth"><p class="muted">लोड हो रहा है…</p></div>
        <h3 style="margin-top:14px">📅 बने हुए बिल-महीने</h3>
        ${(d.charge_months || []).map(m => `<span class="pill">${monthName(m)}</span>`).join(" ") || '<p class="muted">अभी कोई बिल नहीं बना</p>'}`;
    }
      api.monthlyReport(new Date().toISOString().slice(0, 7)).then(r => {
        const el = document.getElementById("dashMonth"); if (!el) return;
        el.innerHTML = `<div class="list-item"><span>🏠 घर फ़ीस वसूली (${monthName(r.month)})</span><b>${rs(r.fee_income)}</b></div>
        <div class="list-item"><span>कुल आमदनी / ख़र्चा</span><b>${rs(r.total_income)} / ${rs(r.total_expense)}</b></div>`;
      }).catch(() => { const el = document.getElementById("dashMonth"); if (el) el.innerHTML = ""; });
    if (i === 1) { // Houses
      const hs = await api.adminHouses(PIN);
      body.innerHTML = `
        <h3>➕ नया घर जोड़ें / बदलें</h3>
        <input id="hhId" type="hidden">
        <div class="row"><input id="hhNo" type="number" placeholder="घर नं."><input id="hhName" placeholder="मुखिया का नाम"></div>
        <input id="hhMob" placeholder="मोबाइल नंबर (10 अंक)">
        <button class="btn primary block" id="hhSave">Save करें</button>
        <h3 style="margin-top:14px">🏠 सारे घर (${hs.length})</h3>
        <input id="hhFilter" placeholder="🔍 घर खोजें — नं. / नाम / मोबाइल">
        <div id="hhList"></div>
        <button class="btn ghost block" id="hhPdf" style="margin-top:10px">⬇️ सारे घरों की List PDF Download</button>`;
      window._houses = hs;
      document.getElementById("hhSave").onclick = async () => {
        const payload = { house_no: Number(document.getElementById("hhNo").value), head_name: document.getElementById("hhName").value.trim(), mobile: document.getElementById("hhMob").value.trim() };
        const id = document.getElementById("hhId").value || null;
        if (!payload.house_no || !payload.head_name || !/^\d{10}$/.test(payload.mobile)) return alert("घर नं., नाम और सही 10-अंक मोबाइल डालें");
        await adminWrite("admin_upsert_house", { p_house_id: id, p_house_no: payload.house_no, p_head_name: payload.head_name, p_mobile: payload.mobile }, db => {
          if (id) { const h = db.houses.find(x => x.id === id); Object.assign(h, payload); }
          else db.houses.push({ id: uid(), ...payload });
        });
        alert("✅ Save हो गया"); cTab(1);
      };
      const drawHouses = list => {
        document.getElementById("hhList").innerHTML = list.map(h => `<div class="list-item"><span>घर ${esc(h.house_no)} — ${esc(h.head_name)}<br><span class="muted">${esc(h.mobile)}</span> • <span class="${Number(h.total_due) > 0 ? "due" : "paid"}">बकाया ${rs(h.total_due)}</span></span>
          <span><button class="btn small primary" onclick="manageHouse('${h.id}')">📒 Manage</button>
          <button class="btn small ghost" onclick='editHouse(${JSON.stringify(h.id)})'>✏️</button>
          <button class="btn small danger" onclick="delHouse('${h.id}')">🗑</button></span></div>`).join("") || '<p class="muted">कोई घर नहीं मिला</p>';
      };
      drawHouses(hs);
      document.getElementById("hhFilter").addEventListener("input", e => {
        const q = e.target.value.trim().toLowerCase();
        drawHouses(!q ? hs : hs.filter(h => String(h.house_no).includes(q) || h.head_name.toLowerCase().includes(q) || String(h.mobile).includes(q)));
      });
      document.getElementById("hhPdf").onclick = () => printDoc("Sare Gharon ki List", `<table border="1" cellspacing="0" cellpadding="6"><tr><th>घर नं.</th><th>मुखिया</th><th>मोबाइल</th><th>बकाया</th></tr>${hs.map(h => `<tr><td>${esc(h.house_no)}</td><td>${esc(h.head_name)}</td><td>${esc(h.mobile)}</td><td>${rs(h.total_due)}</td></tr>`).join("")}</table><p>कुल घर: ${hs.length} • कुल बकाया: ${rs(hs.reduce((a, h) => a + Number(h.total_due || 0), 0))}</p>`);
    }
    if (i === 2) { // Bills
      const d = await api.adminDashboard(PIN);
      const cur = new Date().toISOString().slice(0, 7);
      body.innerHTML = `
        <h3>🧾 Monthly बिल बनाएं (₹${PUB ? PUB.settings.monthly_fee : 150}/घर)</h3>
        <div class="row"><input type="month" id="billMonth" value="${cur}"><button class="btn primary" id="billGen">सब घरों का बिल बनाएं</button></div>
        <p class="muted" style="font-size:13px">एक महीने का बिल दोबारा नहीं बनेगा (dedupe लगा है)।</p>
        <p id="billMsg"></p>
        <h3 style="margin-top:14px">बने हुए महीने</h3>
        ${(d.charge_months || []).map(m => `<div class="list-item"><span>${monthName(m)}</span>
          <button class="btn small danger" onclick="delMonth('${m}')">पूरा महीना हटाएं</button></div>`).join("") || '<p class="muted">कोई बिल नहीं</p>'}`;
      document.getElementById("billGen").onclick = async () => {
        const m = document.getElementById("billMonth").value; if (!m) return;
        const fee = PUB.settings.monthly_fee;
        const n = await adminWrite("admin_generate_charges", { p_month: m, p_amount: fee }, db => {
          let c = 0; db.houses.forEach(h => { if (!db.charges.some(x => x.house_id === h.id && x.month === m)) { db.charges.push({ id: uid(), house_id: h.id, month: m, amount: fee }); c++; } }); return c;
        });
        document.getElementById("billMsg").textContent = `✅ ${n} घरों का बिल बना (${monthName(m)})`;
        setTimeout(() => cTab(2), 900);
      };
    }
    if (i === 3) { // Cash payment
      const hs = await api.adminHouses(PIN);
      body.innerHTML = `
        <h3>💵 Cash Payment Entry</h3>
        <select id="cpHouse">${hs.map(h => `<option value="${h.id}">घर ${esc(h.house_no)} — ${esc(h.head_name)} (बकाया ${rs(h.total_due)})</option>`).join("")}</select>
        <div class="row"><input id="cpAmt" type="number" placeholder="रक़म ₹"><input id="cpDate" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
        <input id="cpNote" placeholder="नोट (optional)">
        <button class="btn primary block" id="cpSave">Payment जोड़ें</button>
        <p class="muted" style="font-size:13px;margin-top:8px">UPI दावों की तसदीक़ Dashboard tab पर होती है।</p>`;
      document.getElementById("cpSave").onclick = async () => {
        const amt = Number(document.getElementById("cpAmt").value); if (!amt) return alert("रक़म डालें");
        await adminWrite("admin_record_payment", { p_house_id: document.getElementById("cpHouse").value, p_amount: amt, p_method: "cash", p_note: document.getElementById("cpNote").value, p_date: document.getElementById("cpDate").value }, db => {
          db.payments.push({ id: uid(), house_id: document.getElementById("cpHouse").value, amount: amt, method: "cash", note: document.getElementById("cpNote").value, date: document.getElementById("cpDate").value });
        });
        alert("✅ Payment जुड़ गया"); cTab(3);
      };
    }
    if (i === 4 || i === 5) { // Income / Expense
      const isInc = i === 4;
      const entries = isInc ? (PUB ? PUB.income : []) : (PUB ? PUB.expenses : []);
      const heads = isInc ? INCOME_HEADS : EXPENSE_HEADS;
      body.innerHTML = `
        <h3>${isInc ? "📥 आमदनी" : "📤 ख़र्चा"} — Entry जोड़ें/बदलें</h3>
        <input id="ieId" type="hidden">
        <div class="row"><select id="ieHead">${heads.map(h => `<option>${h}</option>`).join("")}</select><input id="ieAmt" type="number" placeholder="रक़म ₹"></div>
        <div class="row"><input id="ieDate" type="date" value="${new Date().toISOString().slice(0, 10)}"><input id="ieNote" placeholder="नोट"></div>
        <button class="btn primary block" id="ieSave">Save करें</button>
        <h3 style="margin-top:14px">Entries</h3>
        <div id="ieList">${entries.map(e => `<div class="list-item"><span>${esc(e.head)} • ${esc(e.date)}<br><span class="muted">${esc(e.note || "")}</span></span><b>${rs(e.amount)}</b>
          <span><button class="btn small ghost" onclick='editEntry(${isInc},${JSON.stringify(e.id)})'>✏️</button>
          <button class="btn small danger" onclick="delEntry(${isInc},'${e.id}')">🗑</button></span></div>`).join("") || '<p class="muted">कोई entry नहीं</p>'}</div>`;
      window._entries = entries;
      document.getElementById("ieSave").onclick = async () => {
        const amt = Number(document.getElementById("ieAmt").value); if (!amt) return alert("रक़म डालें");
        const payload = { head: document.getElementById("ieHead").value, amount: amt, date: document.getElementById("ieDate").value, note: document.getElementById("ieNote").value };
        const id = document.getElementById("ieId").value || null;
        await adminWrite(isInc ? "admin_upsert_income" : "admin_upsert_expense", { p_id: id, p_head: payload.head, p_amount: payload.amount, p_date: payload.date, p_note: payload.note }, db => {
          const arr = isInc ? db.income : db.expenses;
          if (id) Object.assign(arr.find(x => x.id === id), payload); else arr.push({ id: uid(), ...payload });
        });
        PUB = await api.getPublic(); alert("✅ Save हो गया"); cTab(i);
      };
    }
    if (i === 6) { // Defaulters
      const defs = await api.adminDefaulters(PIN);
      body.innerHTML = `<h3>📋 बाकी List (${defs.length} घर)</h3>
        ${defs.map(h => `<div class="list-item"><span>घर ${esc(h.house_no)} — ${esc(h.head_name)}<br><span class="muted">${esc(h.mobile)}</span></span>
          <span class="due">${rs(h.total_due)}</span>
          <button class="btn small gold" onclick="waReminder('${h.id}')">🟢 Reminder</button></div>`).join("") || '<p class="muted">किसी का बकाया नहीं 🎉</p>'}
        <button class="btn ghost block" id="defPdf" style="margin-top:10px">⬇️ बाकी List PDF Download</button>`;
      window._defs = defs;
      document.getElementById("defPdf").onclick = () => printDoc("Bakaya List", `<table border="1" cellspacing="0" cellpadding="6"><tr><th>घर नं.</th><th>नाम</th><th>मोबाइल</th><th>बकाया</th></tr>${defs.map(h => `<tr><td>${esc(h.house_no)}</td><td>${esc(h.head_name)}</td><td>${esc(h.mobile)}</td><td>${rs(h.total_due)}</td></tr>`).join("")}</table>`);
    }
    if (i === 7) { // Elaan / Namaz
      const n = PUB.namaz || {};
      body.innerHTML = `
        <h3>📢 नया ऐलान</h3>
        <input id="anTitle" placeholder="ऐलान का title"><textarea id="anBody" rows="2" placeholder="ऐलान की details"></textarea>
        <button class="btn primary block" id="anSave">ऐलान लगाएं</button>
        ${(PUB.announcements || []).map(a => `<div class="list-item"><span><b>${esc(a.title)}</b> <span class="muted">${esc(a.date)}</span></span>
          <button class="btn small danger" onclick="delAnnouncement('${a.id}')">🗑</button></div>`).join("")}
        <h3 style="margin-top:16px">🕌 नमाज़ समय बदलें</h3>
        ${[["fajr", "फ़ज्र"], ["dhuhr", "ज़ुहर"], ["asr", "अस्र"], ["maghrib", "मग़रिब"], ["isha", "इशा"], ["juma", "जुमा"]].map(([k, l]) => `<div class="row"><label style="align-self:center">${l}</label><input id="nz_${k}" value="${esc(n[k] || "")}" placeholder="जैसे 5:00"></div>`).join("")}
        <input id="nz_note" value="${esc(n.note || "")}" placeholder="नोट (optional)">
        <button class="btn primary block" id="nzSave">समय Save करें</button>`;
      document.getElementById("anSave").onclick = async () => {
        const title = document.getElementById("anTitle").value.trim(), b = document.getElementById("anBody").value.trim();
        if (!title) return alert("Title लिखें");
        await adminWrite("admin_upsert_announcement", { p_id: null, p_title: title, p_body: b, p_date: new Date().toISOString().slice(0, 10) }, db => db.announcements.unshift({ id: uid(), title, body: b, date: new Date().toISOString().slice(0, 10) }));
        PUB = await api.getPublic(); alert("✅ ऐलान लग गया"); cTab(7);
      };
      document.getElementById("nzSave").onclick = async () => {
        const data = {}; ["fajr", "dhuhr", "asr", "maghrib", "isha", "juma"].forEach(k => data[k] = document.getElementById("nz_" + k).value);
        data.note = document.getElementById("nz_note").value;
        await adminWrite("admin_update_namaz", { p_data: data }, db => { db.namaz = { ...db.namaz, ...data }; });
        PUB = await api.getPublic(); alert("✅ समय बदल गया"); cTab(7);
      };
    }
    if (i === 8) { // Suggestions
      const sg = await api.adminSuggestions(PIN);
      body.innerHTML = `<h3>✉️ सुझाव / शिकायत (${sg.length})</h3>` +
        (sg.map(s => `<div style="padding:8px 0;border-bottom:1px solid #eee"><b>${esc(s.name)}</b> <span class="muted">${esc(s.date || "")}</span><br>${esc(s.message)}</div>`).join("") || '<p class="muted">कोई सुझाव नहीं</p>');
    }
    if (i === 9) { // Settings + PIN change
      const s = PUB.settings;
      body.innerHTML = `
        <h3>⚙️ Settings</h3>
        <label>Committee का नाम</label><input id="stName" value="${esc(s.committee_name)}">
        <label>पता</label><input id="stAddr" value="${esc(s.address)}">
        <div class="row"><div><label>महीना फ़ीस ₹</label><input id="stFee" type="number" value="${esc(s.monthly_fee)}"></div>
        <div><label>UPI ID</label><input id="stUpi" value="${esc(s.upi_id)}"></div></div>
        <button class="btn primary block" id="stSave">Settings Save करें</button>
        <h3 style="margin-top:16px">🔑 PIN बदलें</h3>
        <input id="npPin" type="password" inputmode="numeric" placeholder="नया PIN">
        <button class="btn gold block" id="npSave">नया PIN लगाएं</button>
        <p class="muted" style="font-size:13px">PIN सिर्फ़ Committee Mode के अंदर, पुराना PIN डालकर ही बदलता है।</p>
        <h3 style="margin-top:16px">🆘 Recovery Code बदलें</h3>
        <input id="rcNew" placeholder="Naya recovery code (kam se kam 8 akshar)" style="text-transform:uppercase">
        <button class="btn gold block" id="rcSave">Recovery Code लगाएं</button>
        <p class="muted" style="font-size:13px">Recovery code sirf Sardar/Secretary ke paas kagaz par rakhein — PIN bhoolne par isi se reset hoga। Code badalte hi purana code bekaar ho jayega।</p>`;
      document.getElementById("stSave").onclick = async () => {
        const data = { committee_name: document.getElementById("stName").value, address: document.getElementById("stAddr").value, monthly_fee: Number(document.getElementById("stFee").value), upi_id: document.getElementById("stUpi").value, sanchalak: s.sanchalak };
        await adminWrite("admin_update_settings", { p_data: data }, db => { db.settings = { ...db.settings, ...data }; });
        PUB = await api.getPublic(); applySettings(); alert("✅ Settings save हो गईं");
      };
      document.getElementById("npSave").onclick = async () => {
        const np = document.getElementById("npPin").value.trim(); if (np.length < 4) return alert("PIN कम से कम 4 अंक का हो");
        if (DEMO) { const db = demoDB(); db.pin = np; demoSave(db); }
        else await api.rpc("change_pin", { p_old: PIN, p_new: np });
        PIN = np; sessionStorage.setItem("mc_pin", np); alert("✅ PIN बदल गया");
      };
      document.getElementById("rcSave").onclick = async () => {
        const rc = document.getElementById("rcNew").value.trim().toUpperCase();
        if (rc.length < 8) return alert("Recovery code kam se kam 8 akshar ka ho");
        if (!confirm("Naya recovery code lagayein? Purana code turant bekaar ho jayega।")) return;
        if (DEMO) { const db = demoDB(); db.recovery = rc; demoSave(db); }
        else await api.rpc("set_recovery_code", { p_pin: PIN, p_recovery: rc });
        document.getElementById("rcNew").value = "";
        alert("✅ Recovery code lag gaya — use kagaz par likh kar Sardar/Secretary ko dein");
      };
    }
  } catch (e) { body.innerHTML = '<p class="error">' + esc(e.message) + "</p>"; }
}
async function decideClaim(id, approve) {
  await adminWrite("admin_decide_claim", { p_claim_id: id, p_approve: approve }, db => {
    const c = db.claims.find(x => x.id === id); if (!c) return;
    c.status = approve ? "approved" : "rejected";
    if (approve) db.payments.push({ id: uid(), house_id: c.house_id, amount: c.amount, method: "upi", note: "UPI claim " + (c.ref || ""), date: new Date().toISOString().slice(0, 10) });
  });
  alert(approve ? "✅ Approve हो गया — बकाया कम हो गया" : "Claim reject हो गया"); cTab(0);
}
function editHouse(id) {
  const h = (window._houses || []).find(x => x.id === id); if (!h) return;
  document.getElementById("hhId").value = h.id;
  document.getElementById("hhNo").value = h.house_no;
  document.getElementById("hhName").value = h.head_name;
  document.getElementById("hhMob").value = h.mobile;
  window.scrollTo(0, 0);
}
async function manageHouse(houseId) {
  const body = document.getElementById("cBody"); if (!body) return;
  body.innerHTML = '<p class="muted">खाता लोड हो रहा है…</p>';
  try {
    const k = await api.adminKhata(PIN, houseId);
    const h = k.house;
    STATE.khata = k; STATE.khataHouse = houseId;
    const cur = new Date().toISOString().slice(0, 7);
    body.innerHTML = `
      <button class="btn small ghost" onclick="cTab(1)">⬅️ सारे घर</button>
      <h3 style="margin-top:10px">🏠 घर ${esc(h.house_no)} — ${esc(h.head_name)}</h3>
      <p class="muted">${esc(h.mobile || "")} • कुल बिल ${rs(k.total_bill)} • कुल दिया ${rs(k.total_paid)}</p>
      <div class="big-due ${k.total_due > 0 ? "due" : "paid"}">कुल बकाया: ${rs(k.total_due)}</div>
      ${Number(k.advance) > 0 ? `<div class="big-due paid" style="font-size:16px">✅ Advance जमा: ${rs(k.advance)}</div>` : ""}
      <h3 style="margin-top:14px">🧾 बिल (Dues)</h3>
      <table><tr><th>महीना</th><th class="num">बिल</th><th class="num">दिया</th><th class="num">बाकी</th><th></th></tr>
      ${k.rows.map(r => `<tr><td>${monthName(r.month)}</td><td class="num">${rs(r.amount)}</td><td class="num">${rs(r.paid)}</td><td class="num ${r.due > 0 ? "due" : "paid"}">${rs(r.due)}</td>
        <td><button class="btn small danger" onclick="adminDelCharge('${r.id}','${houseId}')">🗑</button></td></tr>`).join("") || '<tr><td colspan="5" class="muted">कोई बिल नहीं</td></tr>'}
      </table>
      <div class="row" style="margin-top:10px"><input type="month" id="acMonth" value="${cur}"><input id="acAmt" type="number" value="${PUB ? PUB.settings.monthly_fee : 150}"></div>
      <button class="btn primary block" id="acAdd">➕ इस घर का बिल लगाएं</button>
      <h3 style="margin-top:16px">💵 Payment जोड़ें</h3>
      <div class="row"><input id="apAmt" type="number" placeholder="रक़म ₹"><select id="apMethod"><option value="cash">Cash</option><option value="upi">UPI</option></select></div>
      <div class="row"><input id="apDate" type="date" value="${new Date().toISOString().slice(0, 10)}"><input id="apNote" placeholder="नोट (optional)"></div>
      <button class="btn primary block" id="apAdd">Payment जोड़ें (Paid करें)</button>
      <h3 style="margin-top:16px">💰 Payment History</h3>
      ${k.payments.map(p => `<div class="list-item"><span>${esc(p.date)} • ${p.method === "upi" ? "UPI" : "Cash"} ${esc(String(p.note || "").replace(/^UPI claim\s*/i, "Ref: "))}</span><b>${rs(p.amount)}</b>
        <span><button class="btn small ghost" onclick='showReceipt(${JSON.stringify(p.id)})'>रसीद</button>
        <button class="btn small danger" onclick="adminDelPayment('${p.id}','${houseId}')">🗑</button></span></div>`).join("") || '<p class="muted">अभी कोई payment नहीं</p>'}
      <button class="btn gold block" style="margin-top:12px" onclick="window.open('https://wa.me/91${esc(h.mobile || "")}?text=${encodeURIComponent("Assalamu Alaikum, " + h.head_name + " (Ghar No. " + h.house_no + ") — Millat Committee Moti Nagar Matia: aapka Imam Sahab fees bakaya " + rs(k.total_due) + " hai. Meherbani karke jama kar dein. Jazakallah.")}','_blank')">🟢 WhatsApp Reminder भेजें</button>`;
    document.getElementById("acAdd").onclick = async () => {
      const m = document.getElementById("acMonth").value, amt = Number(document.getElementById("acAmt").value);
      if (!m || !amt) return alert("महीना और रक़म डालें");
      await adminWrite("admin_add_charge", { p_house_id: houseId, p_month: m, p_amount: amt }, db => {
        const ex = db.charges.find(x => x.house_id === houseId && x.month === m);
        if (ex) ex.amount = amt; else db.charges.push({ id: uid(), house_id: houseId, month: m, amount: amt });
      });
      alert("✅ बिल लग गया"); manageHouse(houseId);
    };
    document.getElementById("apAdd").onclick = async () => {
      const amt = Number(document.getElementById("apAmt").value); if (!amt) return alert("रक़म डालें");
      const method = document.getElementById("apMethod").value, date = document.getElementById("apDate").value, note = document.getElementById("apNote").value;
      await adminWrite("admin_record_payment", { p_house_id: houseId, p_amount: amt, p_method: method, p_note: note, p_date: date }, db => {
        db.payments.push({ id: uid(), house_id: houseId, amount: amt, method, note, date });
      });
      alert("✅ Payment जुड़ गया"); manageHouse(houseId);
    };
  } catch (e) { body.innerHTML = '<p class="error">' + esc(e.message) + '</p><button class="btn ghost" onclick="cTab(1)">⬅️ वापस</button>'; }
}
async function adminDelCharge(chargeId, houseId) {
  if (!chargeId) return alert("Is bill ko hataya nahi ja sakta");
  if (!confirm("ये बिल (due) हटाएं?")) return;
  await adminWrite("admin_delete_charge", { p_charge_id: chargeId }, db => { db.charges = db.charges.filter(x => x.id !== chargeId); });
  manageHouse(houseId);
}
async function adminDelPayment(payId, houseId) {
  if (!confirm("ये payment हटाएं? बकाया बढ़ जाएगा।")) return;
  await adminWrite("admin_delete_payment", { p_payment_id: payId }, db => { db.payments = db.payments.filter(x => x.id !== payId); });
  manageHouse(houseId);
}
async function delHouse(id) {
  if (!confirm("ये घर हटाएं? उसका हिसाब भी हट जाएगा।")) return;
  await adminWrite("admin_delete_house", { p_house_id: id }, db => {
    db.houses = db.houses.filter(x => x.id !== id);
    db.charges = db.charges.filter(x => x.house_id !== id);
    db.payments = db.payments.filter(x => x.house_id !== id);
  });
  cTab(1);
}
async function delMonth(m) {
  if (!confirm(monthName(m) + " का पूरा बिल हटाएं?")) return;
  await adminWrite("admin_delete_charge_month", { p_month: m }, db => { db.charges = db.charges.filter(x => x.month !== m); });
  alert("✅ महीना हट गया"); cTab(2);
}
function editEntry(isInc, id) {
  const e = (window._entries || []).find(x => x.id === id); if (!e) return;
  document.getElementById("ieId").value = e.id;
  document.getElementById("ieHead").value = e.head;
  document.getElementById("ieAmt").value = e.amount;
  document.getElementById("ieDate").value = e.date;
  document.getElementById("ieNote").value = e.note || "";
}
async function delEntry(isInc, id) {
  if (!confirm("ये entry हटाएं?")) return;
  await adminWrite(isInc ? "admin_delete_income" : "admin_delete_expense", { p_id: id }, db => {
    if (isInc) db.income = db.income.filter(x => x.id !== id); else db.expenses = db.expenses.filter(x => x.id !== id);
  });
  PUB = await api.getPublic(); cTab(isInc ? 4 : 5);
}
async function delAnnouncement(id) {
  if (!confirm("ये ऐलान हटाएं?")) return;
  await adminWrite("admin_delete_announcement", { p_id: id }, db => { db.announcements = db.announcements.filter(x => x.id !== id); });
  PUB = await api.getPublic(); cTab(7);
}
function waReminder(houseId) {
  const h = (window._defs || []).find(x => x.id === houseId); if (!h) return;
  const msg = `Assalamu Alaikum, ${h.head_name} (Ghar No. ${h.house_no}) — Millat Committee Moti Nagar Matia ki taraf se yaad-dihani: aapka Imam Sahab fees bakaya ${rs(h.total_due)} hai. Meherbani karke jama kar dein. Jazakallah.`;
  showModal(`<h3>🟢 WhatsApp Reminder</h3>
    <p><b>Number:</b> ${esc(h.mobile)}</p>
    <p style="background:#eef6f1;padding:10px;border-radius:10px">${esc(msg)}</p>
    <div class="row"><button class="btn ghost" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="window.open('https://wa.me/91${esc(h.mobile)}?text=${encodeURIComponent(msg)}','_blank');closeModal()">✔ Pakka — भेजें</button></div>`);
}

/* ---------------- PIN sheet / init ---------------- */
function openPinSheet() { document.getElementById("pinSheet").classList.remove("hidden"); document.getElementById("pinError").textContent = ""; }
document.getElementById("committeeBtn").onclick = () => { if (PIN) go("committee"); else openPinSheet(); };
document.getElementById("pinCancel").onclick = () => document.getElementById("pinSheet").classList.add("hidden");
document.getElementById("pinGo").onclick = async () => {
  const pin = document.getElementById("pinInput").value.trim();
  try {
    if (await api.verifyPin(pin)) {
      PIN = pin; sessionStorage.setItem("mc_pin", pin);
      document.getElementById("pinSheet").classList.add("hidden");
      document.getElementById("pinInput").value = "";
      go("committee");
    } else document.getElementById("pinError").textContent = "❌ Galat PIN";
  } catch (e) { document.getElementById("pinError").textContent = e.message; }
};
document.getElementById("forgotLink").onclick = e => { e.preventDefault(); document.getElementById("resetBox").classList.toggle("hidden"); };
document.getElementById("rcGo").onclick = async () => {
  const code = document.getElementById("rcCode").value.trim().toUpperCase();
  const np = document.getElementById("rcNewPin").value.trim();
  const msg = document.getElementById("rcMsg");
  if (!code || np.length < 4) { msg.textContent = "Recovery code aur kam se kam 4 ank ka naya PIN daalein"; return; }
  try {
    let ok;
    if (DEMO) { const db = demoDB(); ok = db.recovery && db.recovery === code; if (ok) { db.pin = np; demoSave(db); } else throw new Error("Galat recovery code"); }
    else { const { data, error } = await sb.rpc("reset_pin_with_recovery", { p_recovery: code, p_new_pin: np }); if (error) throw error; if (data && data.error) throw new Error(data.error); ok = true; }
    if (ok) {
      PIN = np; sessionStorage.setItem("mc_pin", np);
      document.getElementById("pinSheet").classList.add("hidden");
      document.getElementById("rcCode").value = ""; document.getElementById("rcNewPin").value = ""; msg.textContent = "";
      alert("✅ PIN reset ho gaya — naya PIN lag gaya hai");
      go("committee");
    }
  } catch (e) { msg.textContent = e.message; }
};
document.querySelectorAll(".bottom-nav button").forEach(b => b.onclick = () => go(b.dataset.nav));
function applySettings() {
  if (!PUB) return;
  document.getElementById("committeeName").textContent = PUB.settings.committee_name;
  document.getElementById("committeeAddress").textContent = PUB.settings.address;
}
(async function init() {
  if (DEMO) document.getElementById("setupNotice").classList.remove("hidden");
  try { PUB = await api.getPublic(); applySettings(); } catch (e) { console.warn(e); }
  startClock();
  startAutoRefresh();
  renderHome();
})();
