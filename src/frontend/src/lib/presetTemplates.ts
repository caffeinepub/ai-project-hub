export interface PresetTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  code: string;
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "preset-ai-trainer",
    name: "AI Trainer (Class 6 Only)",
    category: "LiveWebApp",
    icon: "🧠",
    description:
      "Login/signup → member page with AI chat all members can use. Only Class 6 users can train the AI via natural language.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Trainer</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    :root {
      --bg: #080800;
      --surface: #0f0f00;
      --surface2: #1a1800;
      --border: #2a2500;
      --gold: #c9a227;
      --gold-light: #f0c040;
      --gold-dim: #c9a22733;
      --gold-border: #c9a22755;
      --text: #f5f0e0;
      --muted: #8a7f5a;
      --danger: #e05252;
      --success: #4caf7d;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; min-height: 100vh; }

    /* scrollbar */
    ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: var(--bg); } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

    /* AUTH */
    #auth-screen { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:1rem; background: radial-gradient(ellipse at 50% 0%, #2a200055 0%, transparent 70%); }
    .auth-card { background: var(--surface); border: 1px solid var(--gold-border); border-radius: 1.25rem; padding: 2.25rem; width: 100%; max-width: 390px; box-shadow: 0 0 60px #c9a22715; }
    .auth-logo { display:flex; align-items:center; gap:0.65rem; margin-bottom:0.4rem; }
    .auth-logo .icon { font-size:1.6rem; }
    .auth-logo h1 { font-size:1.45rem; font-weight:700; background: linear-gradient(135deg, var(--gold-light), var(--gold)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .auth-sub { color: var(--muted); font-size:0.82rem; margin-bottom:1.75rem; }
    .field { margin-bottom:1.1rem; }
    .field label { display:block; font-size:0.75rem; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; margin-bottom:0.35rem; }
    .field input, .field select { width:100%; padding:0.65rem 0.85rem; border-radius:0.6rem; background: var(--bg); border:1px solid var(--border); color:var(--text); font-size:0.875rem; outline:none; transition: border-color .15s; }
    .field input:focus, .field select:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-dim); }
    .btn { width:100%; padding:0.7rem; border-radius:0.6rem; font-size:0.9rem; font-weight:700; cursor:pointer; border:none; transition:all .15s; letter-spacing:.02em; }
    .btn-gold { background: linear-gradient(135deg, var(--gold), #a07c10); color:#080800; }
    .btn-gold:hover { filter:brightness(1.12); }
    .btn-ghost { background:transparent; border:1px solid var(--gold-border); color:var(--muted); margin-top:0.6rem; }
    .btn-ghost:hover { border-color:var(--gold); color:var(--gold); }
    .auth-err { color:var(--danger); font-size:0.78rem; margin-top:0.6rem; min-height:1.2em; }
    .divider { display:flex; align-items:center; gap:0.75rem; margin:1rem 0; color:var(--muted); font-size:0.75rem; }
    .divider::before, .divider::after { content:''; flex:1; height:1px; background:var(--border); }

    /* APP */
    #app-screen { display:none; flex-direction:column; min-height:100vh; }
    header { display:flex; align-items:center; justify-content:space-between; padding:0.8rem 1.4rem; background:var(--surface); border-bottom:1px solid var(--gold-border); }
    .header-brand { display:flex; align-items:center; gap:0.55rem; }
    .header-brand .logo-text { font-size:1rem; font-weight:700; background:linear-gradient(135deg,var(--gold-light),var(--gold)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .badge { font-size:0.68rem; padding:0.2rem 0.6rem; border-radius:999px; font-weight:700; letter-spacing:.04em; }
    .badge-gold { background:var(--gold-dim); color:var(--gold-light); border:1px solid var(--gold-border); }
    .badge-member { background:#1a2e1a; color:#4caf7d; border:1px solid #2e5a3055; }
    .header-right { display:flex; align-items:center; gap:0.8rem; }
    .header-user { font-size:0.78rem; color:var(--muted); }
    .sign-out-btn { font-size:0.75rem; padding:0.3rem 0.75rem; border-radius:0.45rem; background:transparent; border:1px solid var(--border); color:var(--muted); cursor:pointer; transition:all .15s; }
    .sign-out-btn:hover { border-color:var(--gold-border); color:var(--gold); }

    .tabs { display:flex; gap:0; padding:0 1.4rem; background:var(--surface); border-bottom:1px solid var(--gold-border); }
    .tab-btn { padding:0.65rem 1.1rem; font-size:0.82rem; font-weight:600; cursor:pointer; background:transparent; border:none; color:var(--muted); border-bottom:2px solid transparent; transition:all .15s; }
    .tab-btn:hover { color:var(--gold); }
    .tab-btn.active { color:var(--gold-light); border-bottom-color:var(--gold); }

    main { flex:1; padding:1.75rem 1.4rem; max-width:800px; margin:0 auto; width:100%; }

    /* CHAT */
    #chat-tab { display:none; }
    .chat-header { margin-bottom:1rem; }
    .chat-header h2 { font-size:1rem; font-weight:700; color:var(--gold-light); margin-bottom:0.2rem; }
    .chat-header p { font-size:0.78rem; color:var(--muted); }
    .chat-messages { background:var(--surface); border:1px solid var(--gold-border); border-radius:0.9rem; padding:1rem; min-height:340px; max-height:440px; overflow-y:auto; display:flex; flex-direction:column; gap:0.8rem; margin-bottom:0.8rem; }
    .msg { padding:0.6rem 0.9rem; border-radius:0.7rem; font-size:0.875rem; max-width:88%; line-height:1.5; }
    .msg.ai { background:var(--surface2); border:1px solid var(--gold-border); align-self:flex-start; color:var(--text); }
    .msg.ai .msg-label { font-size:0.65rem; font-weight:700; color:var(--gold); text-transform:uppercase; letter-spacing:.06em; margin-bottom:0.3rem; }
    .msg.user { background:linear-gradient(135deg,#3a2c00,#2a2000); border:1px solid var(--gold-border); align-self:flex-end; color:var(--text); }
    .chat-input-row { display:flex; gap:0.6rem; }
    .chat-input-row input { flex:1; padding:0.65rem 0.9rem; background:var(--surface); border:1px solid var(--border); border-radius:0.6rem; color:var(--text); font-size:0.875rem; outline:none; transition:border-color .15s; }
    .chat-input-row input:focus { border-color:var(--gold); box-shadow:0 0 0 3px var(--gold-dim); }
    .send-btn { padding:0.65rem 1.2rem; background:linear-gradient(135deg,var(--gold),#a07c10); color:#080800; border:none; border-radius:0.6rem; cursor:pointer; font-weight:700; font-size:0.875rem; transition:filter .15s; }
    .send-btn:hover { filter:brightness(1.12); }

    /* TRAIN */
    #train-tab { display:none; }
    .train-locked { background:var(--surface); border:1px solid var(--border); border-radius:0.9rem; padding:2.5rem; text-align:center; }
    .train-locked .lock-icon { font-size:2.5rem; margin-bottom:0.75rem; }
    .train-locked h3 { font-size:1rem; font-weight:700; color:var(--gold-light); margin-bottom:0.4rem; }
    .train-locked p { font-size:0.82rem; color:var(--muted); line-height:1.6; }
    .knowledge-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
    .knowledge-header h2 { font-size:1rem; font-weight:700; color:var(--gold-light); }
    .knowledge-count { font-size:0.75rem; color:var(--muted); background:var(--surface2); border:1px solid var(--border); padding:0.2rem 0.6rem; border-radius:999px; }
    .knowledge-list { display:flex; flex-direction:column; gap:0.45rem; margin-bottom:0.9rem; max-height:320px; overflow-y:auto; }
    .knowledge-item { background:var(--surface); border:1px solid var(--border); border-radius:0.6rem; padding:0.65rem 1rem; font-size:0.82rem; display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem; transition:border-color .15s; }
    .knowledge-item:hover { border-color:var(--gold-border); }
    .knowledge-item span { flex:1; line-height:1.5; color:var(--text); }
    .del-btn { background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:0.78rem; opacity:0.7; transition:opacity .15s; flex-shrink:0; padding:0.1rem 0.3rem; border-radius:0.3rem; }
    .del-btn:hover { opacity:1; background:#e0525215; }
    .teach-row { display:flex; gap:0.6rem; }
    .teach-row input { flex:1; padding:0.65rem 0.9rem; background:var(--surface); border:1px solid var(--border); border-radius:0.6rem; color:var(--text); font-size:0.875rem; outline:none; transition:border-color .15s; }
    .teach-row input:focus { border-color:var(--gold); box-shadow:0 0 0 3px var(--gold-dim); }
    .knowledge-empty { text-align:center; color:var(--muted); font-size:0.82rem; padding:2rem; }

    /* ADMIN */
    #admin-tab { display:none; }
    .section-title { font-size:1rem; font-weight:700; color:var(--gold-light); margin-bottom:1rem; }
    .member-table { width:100%; border-collapse:collapse; font-size:0.82rem; }
    .member-table th { text-align:left; color:var(--muted); padding:0.55rem 0.85rem; border-bottom:1px solid var(--border); font-weight:600; text-transform:uppercase; font-size:0.68rem; letter-spacing:.05em; }
    .member-table td { padding:0.6rem 0.85rem; border-bottom:1px solid var(--border); }
    .member-table tr:last-child td { border-bottom:none; }
    .member-table tbody tr:hover td { background:var(--surface2); }
    .role-badge { font-size:0.68rem; padding:0.18rem 0.55rem; border-radius:999px; font-weight:700; letter-spacing:.04em; }
    .role-class6 { background:var(--gold-dim); color:var(--gold-light); border:1px solid var(--gold-border); }
    .role-member { background:#1a2e1a; color:#4caf7d; border:1px solid #2e5a3055; }
    .role-admin { background:#1e1020; color:#c084fc; border:1px solid #7c3aed55; }
    .add-member-form { background:var(--surface); border:1px solid var(--gold-border); border-radius:0.9rem; padding:1.25rem; margin-top:1.75rem; }
    .add-member-form h3 { font-size:0.88rem; font-weight:700; color:var(--gold); margin-bottom:0.85rem; }
    .inline-fields { display:flex; gap:0.5rem; flex-wrap:wrap; }
    .inline-fields input, .inline-fields select { flex:1; min-width:120px; padding:0.55rem 0.75rem; background:var(--bg); border:1px solid var(--border); border-radius:0.5rem; color:var(--text); font-size:0.82rem; outline:none; transition:border-color .15s; }
    .inline-fields input:focus, .inline-fields select:focus { border-color:var(--gold); }
    .inline-fields select option { background:var(--bg); }
    .add-btn { padding:0.55rem 1.1rem; background:linear-gradient(135deg,var(--gold),#a07c10); color:#080800; border:none; border-radius:0.5rem; font-size:0.82rem; font-weight:700; cursor:pointer; transition:filter .15s; white-space:nowrap; }
    .add-btn:hover { filter:brightness(1.12); }
    .no-members { text-align:center; color:var(--muted); font-size:0.82rem; padding:1.5rem; }
  </style>
</head>
<body>

<!-- AUTH -->
<div id="auth-screen">
  <div id="login-card" class="auth-card">
    <div class="auth-logo"><span class="icon">🧠</span><h1>AI Trainer</h1></div>
    <p class="auth-sub">Sign in to access your AI workspace</p>
    <div class="field"><label>Username</label><input id="login-user" placeholder="your username" autocomplete="username" /></div>
    <div class="field"><label>Password</label><input id="login-pass" type="password" placeholder="••••••••" autocomplete="current-password" /></div>
    <button class="btn btn-gold" onclick="doLogin()">Sign In</button>
    <div class="divider">or</div>
    <button class="btn btn-ghost" onclick="showSignup()">Create account</button>
    <p class="auth-err" id="login-err"></p>
  </div>
  <div id="signup-card" class="auth-card" style="display:none">
    <div class="auth-logo"><span class="icon">✨</span><h1>Create Account</h1></div>
    <p class="auth-sub">Join the AI Trainer workspace</p>
    <div class="field"><label>Username</label><input id="su-user" placeholder="choose a username" autocomplete="username" /></div>
    <div class="field"><label>Password</label><input id="su-pass" type="password" placeholder="••••••••" autocomplete="new-password" /></div>
    <div class="field"><label>Invite Code <span style="font-weight:400;text-transform:none;letter-spacing:0">(optional — for Class 6 access)</span></label><input id="su-code" placeholder="CLASS6INVITE" /></div>
    <button class="btn btn-gold" onclick="doSignup()">Create Account</button>
    <div class="divider">or</div>
    <button class="btn btn-ghost" onclick="showLogin()">Back to sign in</button>
    <p class="auth-err" id="signup-err"></p>
  </div>
</div>

<!-- APP -->
<div id="app-screen">
  <header>
    <div class="header-brand">
      <span style="font-size:1.3rem">🧠</span>
      <span class="logo-text">AI Trainer</span>
      <span class="badge badge-gold" id="role-badge"></span>
    </div>
    <div class="header-right">
      <span class="header-user" id="header-user"></span>
      <button class="sign-out-btn" onclick="signOut()">Sign out</button>
    </div>
  </header>
  <div class="tabs">
    <button class="tab-btn active" id="tab-chat-btn" onclick="switchTab('chat')">💬 Chat</button>
    <button class="tab-btn" id="tab-train-btn" onclick="switchTab('train')">🎓 Train AI</button>
    <button class="tab-btn" id="tab-admin-btn" onclick="switchTab('admin')" style="display:none">⚙️ Admin</button>
  </div>
  <main>
    <!-- CHAT -->
    <div id="chat-tab">
      <div class="chat-header">
        <h2>Chat with your AI</h2>
        <p>The AI uses everything it has been taught to answer your questions.</p>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="msg ai"><div class="msg-label">AI</div>Hello! I'm your trained AI assistant. Ask me anything.</div>
      </div>
      <div class="chat-input-row">
        <input id="chat-input" placeholder="Ask the AI…" onkeydown="if(event.key==='Enter')sendChat()" />
        <button class="send-btn" onclick="sendChat()">Send</button>
      </div>
    </div>

    <!-- TRAIN -->
    <div id="train-tab">
      <div id="train-locked" class="train-locked" style="display:none">
        <div class="lock-icon">🔒</div>
        <h3>Training Restricted</h3>
        <p>Only Class 6 members can train the AI.<br/>Contact an admin to upgrade your access level.</p>
      </div>
      <div id="train-panel" style="display:none">
        <div class="knowledge-header">
          <h2 class="section-title" style="margin-bottom:0">AI Knowledge Base</h2>
          <span class="knowledge-count" id="knowledge-count">0 entries</span>
        </div>
        <p style="font-size:0.78rem;color:var(--muted);margin-bottom:0.9rem">Teach the AI facts, behaviors, and responses in plain natural language.</p>
        <ul class="knowledge-list" id="knowledge-list"></ul>
        <div class="teach-row">
          <input id="teach-input" placeholder="e.g. Always greet users warmly. Our support email is help@example.com." onkeydown="if(event.key==='Enter')teachAI()" />
          <button class="send-btn" onclick="teachAI()">Teach</button>
        </div>
      </div>
    </div>

    <!-- ADMIN -->
    <div id="admin-tab">
      <p class="section-title">Member Management</p>
      <table class="member-table">
        <thead><tr><th>Username</th><th>Role</th><th>Action</th></tr></thead>
        <tbody id="member-tbody"></tbody>
      </table>
      <div class="add-member-form">
        <h3>➕ Add Member</h3>
        <div class="inline-fields">
          <input id="new-u" placeholder="Username" />
          <input id="new-p" type="password" placeholder="Password" />
          <select id="new-r"><option value="member">Member</option><option value="class6">Class 6</option><option value="admin">Admin</option></select>
          <button class="add-btn" onclick="addMember()">Add</button>
        </div>
      </div>
    </div>
  </main>
</div>

<script>
const DB_KEY='ai-trainer-db';
function loadDB(){try{return JSON.parse(localStorage.getItem(DB_KEY));}catch{return null;}}
function saveDB(db){localStorage.setItem(DB_KEY,JSON.stringify(db));}
function initDB(){
  let db=loadDB();
  if(!db){
    db={
      members:[
        {username:'admin',password:'admin123',role:'admin'},
        {username:'trainer',password:'trainer123',role:'class6'},
        {username:'member1',password:'member123',role:'member'}
      ],
      knowledge:[
        'My name is AI Trainer. I help answer questions based on what I have been taught.',
        'Always be concise, helpful, and friendly in your responses.'
      ]
    };
    saveDB(db);
  }
  return db;
}
let db=initDB(), currentUser=null;

function showLogin(){document.getElementById('login-card').style.display='';document.getElementById('signup-card').style.display='none';}
function showSignup(){document.getElementById('login-card').style.display='none';document.getElementById('signup-card').style.display='';}

function doLogin(){
  const u=document.getElementById('login-user').value.trim().toLowerCase();
  const p=document.getElementById('login-pass').value;
  const m=db.members.find(x=>x.username.toLowerCase()===u&&x.password===p);
  if(!m){document.getElementById('login-err').textContent='Incorrect username or password.';return;}
  currentUser=m; enterApp();
}

function doSignup(){
  const u=document.getElementById('su-user').value.trim();
  const p=document.getElementById('su-pass').value;
  const code=document.getElementById('su-code').value.trim();
  if(!u||!p){document.getElementById('signup-err').textContent='Username and password are required.';return;}
  if(db.members.find(m=>m.username.toLowerCase()===u.toLowerCase())){document.getElementById('signup-err').textContent='That username is already taken.';return;}
  const role=code==='CLASS6INVITE'?'class6':'member';
  const nm={username:u,password:p,role};
  db.members.push(nm);saveDB(db);currentUser=nm;enterApp();
}

function signOut(){
  currentUser=null;
  document.getElementById('auth-screen').style.display='flex';
  document.getElementById('app-screen').style.display='none';
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
  document.getElementById('login-err').textContent='';
  showLogin();
}

function enterApp(){
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('app-screen').style.display='flex';
  document.getElementById('header-user').textContent=currentUser.username;
  const badge=document.getElementById('role-badge');
  const isAdmin=currentUser.role==='admin';
  const isClass6=currentUser.role==='class6'||isAdmin;
  if(isAdmin){badge.textContent='Admin';badge.className='badge badge-gold';}
  else if(isClass6){badge.textContent='Class 6';badge.className='badge badge-gold';}
  else{badge.textContent='Member';badge.className='badge badge-member';}
  document.getElementById('tab-admin-btn').style.display=isAdmin?'':'none';
  document.getElementById('train-panel').style.display=isClass6?'':'none';
  document.getElementById('train-locked').style.display=isClass6?'none':'';
  switchTab('chat');
  renderKnowledge();
  if(isAdmin)renderMembers();
}

function switchTab(n){
  ['chat','train','admin'].forEach(t=>{
    document.getElementById(t+'-tab').style.display=t===n?'block':'none';
    const b=document.getElementById('tab-'+t+'-btn');
    if(b)b.classList.toggle('active',t===n);
  });
}

async function sendChat(){
  const input=document.getElementById('chat-input');
  const text=input.value.trim();
  if(!text)return;
  input.value='';
  appendMsg(text,'user');
  const knowledge=db.knowledge.join('\n');
  const sys='You are a helpful AI assistant. Use the following knowledge to guide your answers:\n'+knowledge+'\n\nIf the knowledge does not cover the question, answer as best you can.';
  const thinking=appendMsg('…','ai');
  try{
    const r=await fetch('https://text.pollinations.ai/openai',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'openai',messages:[{role:'system',content:sys},{role:'user',content:text}],seed:42})
    });
    const d=await r.json();
    const reply=d.choices?.[0]?.message?.content||'I had trouble responding. Please try again.';
    thinking.querySelector('.msg-content').textContent=reply;
  }catch{
    thinking.querySelector('.msg-content').textContent='Could not reach the AI service. Please try again.';
  }
}

function appendMsg(text,role){
  const box=document.getElementById('chat-messages');
  const el=document.createElement('div');
  el.className='msg '+role;
  if(role==='ai'){
    el.innerHTML='<div class="msg-label">AI</div><div class="msg-content">'+escapeHTML(text)+'</div>';
  } else {
    el.textContent=text;
  }
  box.appendChild(el);
  box.scrollTop=box.scrollHeight;
  return el;
}

function teachAI(){
  const input=document.getElementById('teach-input');
  const text=input.value.trim();
  if(!text)return;
  db.knowledge.push(text);saveDB(db);input.value='';
  renderKnowledge();
}

function deleteKnowledge(i){
  db.knowledge.splice(i,1);saveDB(db);renderKnowledge();
}

function renderKnowledge(){
  const list=document.getElementById('knowledge-list');
  const count=document.getElementById('knowledge-count');
  if(!list)return;
  list.innerHTML='';
  if(db.knowledge.length===0){
    list.innerHTML='<li class="knowledge-empty">No knowledge entries yet. Teach the AI something!</li>';
  } else {
    db.knowledge.forEach((item,i)=>{
      const li=document.createElement('li');
      li.className='knowledge-item';
      li.innerHTML='<span>'+escapeHTML(item)+'</span><button class="del-btn" onclick="deleteKnowledge('+i+')" title="Remove">✕ Remove</button>';
      list.appendChild(li);
    });
  }
  if(count)count.textContent=db.knowledge.length+' entr'+(db.knowledge.length===1?'y':'ies');
}

function renderMembers(){
  const tbody=document.getElementById('member-tbody');
  if(!tbody)return;
  tbody.innerHTML='';
  if(db.members.length===0){tbody.innerHTML='<tr><td colspan="3" class="no-members">No members yet.</td></tr>';return;}
  db.members.forEach((m,i)=>{
    const rc=m.role==='class6'?'role-badge role-class6':m.role==='admin'?'role-badge role-admin':'role-badge role-member';
    const rl=m.role==='class6'?'Class 6':m.role.charAt(0).toUpperCase()+m.role.slice(1);
    tbody.innerHTML+='<tr><td>'+escapeHTML(m.username)+'</td><td><span class="'+rc+'">'+rl+'</span></td><td><button class="del-btn" onclick="removeMember('+i+')'+'" title="Remove">✕</button></td></tr>';
  });
}

function addMember(){
  const u=document.getElementById('new-u').value.trim();
  const p=document.getElementById('new-p').value;
  const r=document.getElementById('new-r').value;
  if(!u||!p)return;
  if(db.members.find(m=>m.username.toLowerCase()===u.toLowerCase()))return;
  db.members.push({username:u,password:p,role:r});saveDB(db);
  document.getElementById('new-u').value='';document.getElementById('new-p').value='';
  renderMembers();
}

function removeMember(i){
  if(db.members[i].username===currentUser.username)return;
  db.members.splice(i,1);saveDB(db);renderMembers();
}

function escapeHTML(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
</script>
</body>
</html>`,
  },
  {
    id: "preset-member-portal",
    name: "Member Portal + Admin",
    category: "LiveWebApp",
    icon: "👥",
    description:
      "Real-time login/signup leading to a member page with admin controls for managing members and roles.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Member Portal</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    :root {
      --bg: #080800;
      --surface: #0f0f00;
      --surface2: #1a1800;
      --border: #2a2500;
      --gold: #c9a227;
      --gold-light: #f0c040;
      --gold-dim: #c9a22733;
      --gold-border: #c9a22755;
      --text: #f5f0e0;
      --muted: #8a7f5a;
      --danger: #e05252;
      --success: #4caf7d;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; min-height: 100vh; }
    ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: var(--bg); } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

    /* AUTH */
    #auth-screen { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:1rem; background:radial-gradient(ellipse at 50% 0%, #2a200055 0%, transparent 70%); }
    .auth-card { background:var(--surface); border:1px solid var(--gold-border); border-radius:1.25rem; padding:2.25rem; width:100%; max-width:390px; box-shadow:0 0 60px #c9a22715; }
    .auth-logo { display:flex; align-items:center; gap:0.65rem; margin-bottom:0.4rem; }
    .auth-logo .icon { font-size:1.6rem; }
    .auth-logo h1 { font-size:1.45rem; font-weight:700; background:linear-gradient(135deg,var(--gold-light),var(--gold)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .auth-sub { color:var(--muted); font-size:0.82rem; margin-bottom:1.75rem; }
    .field { margin-bottom:1.1rem; }
    .field label { display:block; font-size:0.75rem; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; margin-bottom:0.35rem; }
    .field input { width:100%; padding:0.65rem 0.85rem; border-radius:0.6rem; background:var(--bg); border:1px solid var(--border); color:var(--text); font-size:0.875rem; outline:none; transition:border-color .15s; }
    .field input:focus { border-color:var(--gold); box-shadow:0 0 0 3px var(--gold-dim); }
    .btn { width:100%; padding:0.7rem; border-radius:0.6rem; font-size:0.9rem; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
    .btn-gold { background:linear-gradient(135deg,var(--gold),#a07c10); color:#080800; }
    .btn-gold:hover { filter:brightness(1.12); }
    .btn-ghost { background:transparent; border:1px solid var(--gold-border); color:var(--muted); margin-top:0.6rem; }
    .btn-ghost:hover { border-color:var(--gold); color:var(--gold); }
    .auth-err { color:var(--danger); font-size:0.78rem; margin-top:0.6rem; min-height:1.2em; }
    .divider { display:flex; align-items:center; gap:0.75rem; margin:1rem 0; color:var(--muted); font-size:0.75rem; }
    .divider::before, .divider::after { content:''; flex:1; height:1px; background:var(--border); }

    /* APP */
    #app-screen { display:none; flex-direction:column; min-height:100vh; }
    header { display:flex; align-items:center; justify-content:space-between; padding:0.8rem 1.4rem; background:var(--surface); border-bottom:1px solid var(--gold-border); }
    .header-brand { display:flex; align-items:center; gap:0.55rem; }
    .logo-text { font-size:1rem; font-weight:700; background:linear-gradient(135deg,var(--gold-light),var(--gold)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .badge { font-size:0.68rem; padding:0.2rem 0.6rem; border-radius:999px; font-weight:700; letter-spacing:.04em; }
    .badge-gold { background:var(--gold-dim); color:var(--gold-light); border:1px solid var(--gold-border); }
    .badge-member { background:#1a2e1a; color:var(--success); border:1px solid #2e5a3055; }
    .badge-admin { background:#1e1020; color:#c084fc; border:1px solid #7c3aed55; }
    .header-right { display:flex; align-items:center; gap:0.8rem; }
    .header-user { font-size:0.78rem; color:var(--muted); }
    .sign-out-btn { font-size:0.75rem; padding:0.3rem 0.75rem; border-radius:0.45rem; background:transparent; border:1px solid var(--border); color:var(--muted); cursor:pointer; transition:all .15s; }
    .sign-out-btn:hover { border-color:var(--gold-border); color:var(--gold); }
    .tabs { display:flex; padding:0 1.4rem; background:var(--surface); border-bottom:1px solid var(--gold-border); }
    .tab-btn { padding:0.65rem 1.1rem; font-size:0.82rem; font-weight:600; cursor:pointer; background:transparent; border:none; color:var(--muted); border-bottom:2px solid transparent; transition:all .15s; }
    .tab-btn:hover { color:var(--gold); }
    .tab-btn.active { color:var(--gold-light); border-bottom-color:var(--gold); }
    main { flex:1; padding:1.75rem 1.4rem; max-width:800px; margin:0 auto; width:100%; }
    #member-tab, #admin-tab { display:none; }

    /* MEMBER */
    .welcome-banner { background:linear-gradient(135deg,#1a1500,#0f0d00); border:1px solid var(--gold-border); border-radius:0.9rem; padding:1.5rem 1.75rem; margin-bottom:1.5rem; position:relative; overflow:hidden; }
    .welcome-banner::before { content:''; position:absolute; top:-40px; right:-40px; width:160px; height:160px; background:radial-gradient(circle,var(--gold-dim),transparent 70%); }
    .welcome-banner h3 { font-size:1.15rem; font-weight:700; color:var(--gold-light); margin-bottom:0.3rem; }
    .welcome-banner p { font-size:0.82rem; color:var(--muted); }
    .section-title { font-size:0.75rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.07em; margin-bottom:0.65rem; }
    .online-list { display:flex; flex-direction:column; gap:0.4rem; }
    .online-item { display:flex; align-items:center; gap:0.7rem; font-size:0.83rem; padding:0.6rem 0.9rem; background:var(--surface); border:1px solid var(--border); border-radius:0.6rem; transition:border-color .15s; }
    .online-item:hover { border-color:var(--gold-border); }
    .dot { width:8px; height:8px; border-radius:50%; background:var(--success); box-shadow:0 0 6px var(--success); flex-shrink:0; }
    .online-item .name { font-weight:500; color:var(--text); }
    .online-item .role-tag { margin-left:auto; font-size:0.68rem; color:var(--muted); }

    /* ADMIN */
    .admin-section-title { font-size:1rem; font-weight:700; color:var(--gold-light); margin-bottom:1rem; }
    .member-table { width:100%; border-collapse:collapse; font-size:0.82rem; }
    .member-table th { text-align:left; color:var(--muted); padding:0.55rem 0.85rem; border-bottom:1px solid var(--border); font-weight:600; text-transform:uppercase; font-size:0.68rem; letter-spacing:.05em; }
    .member-table td { padding:0.6rem 0.85rem; border-bottom:1px solid var(--border); }
    .member-table tr:last-child td { border-bottom:none; }
    .member-table tbody tr:hover td { background:var(--surface2); }
    .role-badge { font-size:0.68rem; padding:0.18rem 0.55rem; border-radius:999px; font-weight:700; letter-spacing:.04em; }
    .rb-member { background:#1a2e1a; color:var(--success); border:1px solid #2e5a3055; }
    .rb-admin { background:#1e1020; color:#c084fc; border:1px solid #7c3aed55; }
    .del-btn { background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:0.78rem; opacity:0.7; transition:opacity .15s; }
    .del-btn:hover { opacity:1; }
    .add-form { background:var(--surface); border:1px solid var(--gold-border); border-radius:0.9rem; padding:1.25rem; margin-top:1.75rem; }
    .add-form h3 { font-size:0.88rem; font-weight:700; color:var(--gold); margin-bottom:0.85rem; }
    .inline-fields { display:flex; gap:0.5rem; flex-wrap:wrap; }
    .inline-fields input, .inline-fields select { flex:1; min-width:120px; padding:0.55rem 0.75rem; background:var(--bg); border:1px solid var(--border); border-radius:0.5rem; color:var(--text); font-size:0.82rem; outline:none; transition:border-color .15s; }
    .inline-fields input:focus, .inline-fields select:focus { border-color:var(--gold); }
    .inline-fields select option { background:var(--bg); }
    .add-btn { padding:0.55rem 1.1rem; background:linear-gradient(135deg,var(--gold),#a07c10); color:#080800; border:none; border-radius:0.5rem; font-size:0.82rem; font-weight:700; cursor:pointer; transition:filter .15s; white-space:nowrap; }
    .add-btn:hover { filter:brightness(1.12); }
  </style>
</head>
<body>

<!-- AUTH -->
<div id="auth-screen">
  <div id="login-card" class="auth-card">
    <div class="auth-logo"><span class="icon">👥</span><h1>Member Portal</h1></div>
    <p class="auth-sub">Sign in to your workspace</p>
    <div class="field"><label>Username</label><input id="l-user" placeholder="username" autocomplete="username" /></div>
    <div class="field"><label>Password</label><input id="l-pass" type="password" placeholder="••••••••" autocomplete="current-password" /></div>
    <button class="btn btn-gold" onclick="doLogin()">Sign In</button>
    <div class="divider">or</div>
    <button class="btn btn-ghost" onclick="showSignup()">Create account</button>
    <p class="auth-err" id="login-err"></p>
  </div>
  <div id="signup-card" class="auth-card" style="display:none">
    <div class="auth-logo"><span class="icon">✨</span><h1>Create Account</h1></div>
    <p class="auth-sub">Join the member workspace</p>
    <div class="field"><label>Username</label><input id="s-user" placeholder="choose a username" autocomplete="username" /></div>
    <div class="field"><label>Password</label><input id="s-pass" type="password" placeholder="••••••••" autocomplete="new-password" /></div>
    <button class="btn btn-gold" onclick="doSignup()">Create Account</button>
    <div class="divider">or</div>
    <button class="btn btn-ghost" onclick="showLogin()">Back to sign in</button>
    <p class="auth-err" id="signup-err"></p>
  </div>
</div>

<!-- APP -->
<div id="app-screen">
  <header>
    <div class="header-brand">
      <span style="font-size:1.3rem">👥</span>
      <span class="logo-text">Member Portal</span>
      <span class="badge" id="role-pill"></span>
    </div>
    <div class="header-right">
      <span class="header-user" id="header-user"></span>
      <button class="sign-out-btn" onclick="signOut()">Sign out</button>
    </div>
  </header>
  <div class="tabs">
    <button class="tab-btn active" id="tab-member-btn" onclick="switchTab('member')">🏠 Members</button>
    <button class="tab-btn" id="tab-admin-btn" onclick="switchTab('admin')" style="display:none">⚙️ Admin</button>
  </div>
  <main>
    <div id="member-tab">
      <div class="welcome-banner">
        <h3 id="welcome-title">Welcome back!</h3>
        <p id="welcome-role">You are signed in as a member.</p>
      </div>
      <p class="section-title">All Members</p>
      <div class="online-list" id="online-list"></div>
    </div>
    <div id="admin-tab">
      <p class="admin-section-title">Member Management</p>
      <table class="member-table">
        <thead><tr><th>Username</th><th>Role</th><th>Action</th></tr></thead>
        <tbody id="member-tbody"></tbody>
      </table>
      <div class="add-form">
        <h3>➕ Add Member</h3>
        <div class="inline-fields">
          <input id="nm-u" placeholder="Username" />
          <input id="nm-p" type="password" placeholder="Password" />
          <select id="nm-r"><option value="member">Member</option><option value="admin">Admin</option></select>
          <button class="add-btn" onclick="addMember()">Add</button>
        </div>
      </div>
    </div>
  </main>
</div>

<script>
const DB_KEY='member-portal-db';
function loadDB(){try{return JSON.parse(localStorage.getItem(DB_KEY));}catch{return null;}}
function saveDB(db){localStorage.setItem(DB_KEY,JSON.stringify(db));}
function initDB(){
  let db=loadDB();
  if(!db){
    db={members:[
      {username:'admin',password:'admin123',role:'admin'},
      {username:'alice',password:'alice123',role:'member'},
      {username:'bob',password:'bob123',role:'member'}
    ]};
    saveDB(db);
  }
  return db;
}
let db=initDB(),currentUser=null;
function showLogin(){document.getElementById('login-card').style.display='';document.getElementById('signup-card').style.display='none';}
function showSignup(){document.getElementById('login-card').style.display='none';document.getElementById('signup-card').style.display='';}
function doLogin(){
  const u=document.getElementById('l-user').value.trim().toLowerCase();
  const p=document.getElementById('l-pass').value;
  const m=db.members.find(x=>x.username.toLowerCase()===u&&x.password===p);
  if(!m){document.getElementById('login-err').textContent='Incorrect username or password.';return;}
  currentUser=m;enterApp();
}
function doSignup(){
  const u=document.getElementById('s-user').value.trim();
  const p=document.getElementById('s-pass').value;
  if(!u||!p){document.getElementById('signup-err').textContent='Username and password are required.';return;}
  if(db.members.find(m=>m.username.toLowerCase()===u.toLowerCase())){document.getElementById('signup-err').textContent='That username is already taken.';return;}
  const nm={username:u,password:p,role:'member'};
  db.members.push(nm);saveDB(db);currentUser=nm;enterApp();
}
function signOut(){
  currentUser=null;
  document.getElementById('auth-screen').style.display='flex';
  document.getElementById('app-screen').style.display='none';
  document.getElementById('l-user').value='';document.getElementById('l-pass').value='';
  document.getElementById('login-err').textContent='';
  showLogin();
}
function enterApp(){
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('app-screen').style.display='flex';
  document.getElementById('header-user').textContent=currentUser.username;
  document.getElementById('welcome-title').textContent='Welcome, '+currentUser.username+'!';
  const isAdmin=currentUser.role==='admin';
  const pill=document.getElementById('role-pill');
  if(isAdmin){pill.textContent='Admin';pill.className='badge badge-admin';document.getElementById('welcome-role').textContent='You have admin access.';}
  else{pill.textContent='Member';pill.className='badge badge-member';document.getElementById('welcome-role').textContent='You are signed in as a member.';}
  document.getElementById('tab-admin-btn').style.display=isAdmin?'':'none';
  switchTab('member');
  renderOnline();
  if(isAdmin)renderMembers();
}
function switchTab(n){
  ['member','admin'].forEach(t=>{
    document.getElementById(t+'-tab').style.display=t===n?'block':'none';
    const b=document.getElementById('tab-'+t+'-btn');
    if(b)b.classList.toggle('active',t===n);
  });
}
function renderOnline(){
  const list=document.getElementById('online-list');
  list.innerHTML='';
  db.members.forEach(m=>{
    const div=document.createElement('div');
    div.className='online-item';
    const roleLabel=m.role==='admin'?'Admin':'Member';
    div.innerHTML='<span class="dot"></span><span class="name">'+escapeHTML(m.username)+'</span><span class="role-tag">'+roleLabel+'</span>';
    list.appendChild(div);
  });
}
function renderMembers(){
  const tbody=document.getElementById('member-tbody');
  tbody.innerHTML='';
  db.members.forEach((m,i)=>{
    const bc=m.role==='admin'?'role-badge rb-admin':'role-badge rb-member';
    const bl=m.role==='admin'?'Admin':'Member';
    tbody.innerHTML+='<tr><td>'+escapeHTML(m.username)+'</td><td><span class="'+bc+'">'+bl+'</span></td><td><button class="del-btn" onclick="removeMember('+i+')">Remove</button></td></tr>';
  });
}
function addMember(){
  const u=document.getElementById('nm-u').value.trim();
  const p=document.getElementById('nm-p').value;
  const r=document.getElementById('nm-r').value;
  if(!u||!p)return;
  if(db.members.find(m=>m.username.toLowerCase()===u.toLowerCase()))return;
  db.members.push({username:u,password:p,role:r});saveDB(db);
  document.getElementById('nm-u').value='';document.getElementById('nm-p').value='';
  renderMembers();renderOnline();
}
function removeMember(i){
  if(db.members[i].username===currentUser.username)return;
  db.members.splice(i,1);saveDB(db);renderMembers();renderOnline();
}
function escapeHTML(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
</script>
</body>
</html>`,
  },
];
