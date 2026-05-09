(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&n(c)}).observe(document,{childList:!0,subtree:!0});function o(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function n(r){if(r.ep)return;r.ep=!0;const a=o(r);fetch(r.href,a)}})();const k="http://localhost:3000/api/v1",y=k.replace(/\/$/,""),w="kc_token",$="kc_user";function g(){return localStorage.getItem(w)}function _(t){t&&localStorage.setItem(w,t)}function O(){localStorage.removeItem(w)}function C(){const t=localStorage.getItem($);if(!t)return null;try{return JSON.parse(t)}catch{return null}}function L(t){localStorage.setItem($,JSON.stringify(t||null))}function U(){localStorage.removeItem($)}function T(){O(),U()}function R(t,e){return t?typeof t=="string"?t:t.error?t.error:t.message?t.message:e:e}async function d(t,e={}){const o=g(),n={...e.body?{"Content-Type":"application/json"}:{},...e.headers||{}};o&&(n.Authorization=`Bearer ${o}`);const r=await fetch(`${y}${t}`,{...e,headers:n,body:e.body?JSON.stringify(e.body):void 0});let a=null;if((r.headers.get("content-type")||"").includes("application/json")?a=await r.json():r.ok||(a=await r.text()),!r.ok){const l=R(a,"Request failed");throw r.status===401&&T(),new Error(l)}return a}async function M(t){var n;const e=await d("/auth/register",{method:"POST",body:t}),o=(n=e==null?void 0:e.session)==null?void 0:n.access_token;return o&&_(o),e!=null&&e.user&&L(e.user),e}async function N(t){var n;const e=await d("/auth/login",{method:"POST",body:t}),o=(n=e==null?void 0:e.session)==null?void 0:n.access_token;return o&&_(o),e!=null&&e.user&&L(e.user),e}async function j(){try{await d("/auth/logout",{method:"POST"})}finally{T()}}async function H(){return d("/auth/me")}async function V(t){return d("/auth/profile",{method:"PUT",body:t})}function F(t){return d("/storefronts",{method:"POST",body:t})}function K(){return d("/storefronts/my")}function z(t,e){return d(`/storefronts/${t}`,{method:"PUT",body:e})}async function x(t,e,o){const n=g(),r=new FormData;r.append(o,e);const a=await fetch(`${y}/storefronts/${t}/upload-image`,{method:"POST",headers:n?{Authorization:`Bearer ${n}`}:void 0,body:r}),c=await a.json();if(!a.ok)throw new Error((c==null?void 0:c.error)||"Failed to upload image");return c}function Q(t){return d("/products",{method:"POST",body:t})}function W(t){return d(`/products/${t}`,{method:"DELETE"})}async function J(t,e){const o=g(),n=new FormData;n.append("image",e);const r=await fetch(`${y}/products/${t}/upload-image`,{method:"POST",headers:o?{Authorization:`Bearer ${o}`}:void 0,body:n}),a=await r.json();if(!r.ok)throw new Error((a==null?void 0:a.error)||"Failed to upload product image");return a}async function G(t,{onChunk:e,onDone:o}){const n=g(),r=await fetch(`${y}/advisor/chat`,{method:"POST",headers:{"Content-Type":"application/json",...n?{Authorization:`Bearer ${n}`}:{}},body:JSON.stringify(t)});if(!r.ok||!r.body){const f=await r.json().catch(()=>null);throw new Error((f==null?void 0:f.error)||"Advisor request failed")}const a=r.body.getReader(),c=new TextDecoder;let l="";for(;;){const{done:f,value:B}=await a.read();if(f)break;l+=c.decode(B,{stream:!0});const E=l.split(`

`);l=E.pop()||"";for(const I of E){const S=I.split(`
`).find(D=>D.startsWith("data: "));if(!S)continue;const q=S.replace("data: ",""),h=JSON.parse(q);h.type==="chunk"&&(e==null||e(h.text)),h.type==="done"&&(o==null||o(h))}}}function Y(t){return d("/badges/request",{method:"POST",body:t})}function X(){return d("/badges/my")}function Z(t){return d(`/badges/generate-qr/${t}`,{method:"POST"})}function ee(){return d("/analytics/my")}function te(t){return t?`
    <section class="panel">
      <h2>Analytics Summary</h2>
      <div class="kpis">
        <div class="kpi"><span>Total Views</span><strong>${t.total_views}</strong></div>
        <div class="kpi"><span>Views This Month</span><strong>${t.views_this_month}</strong></div>
        <div class="kpi"><span>WhatsApp Clicks</span><strong>${t.whatsapp_clicks}</strong></div>
        <div class="kpi"><span>Badge Scans</span><strong>${t.badge_scans}</strong></div>
      </div>
      <h3>Top Products</h3>
      <ul>
        ${(t.top_products||[]).map(e=>`<li>${e.name}: ${e.views} views</li>`).join("")||"<li>No product views yet</li>"}
      </ul>
    </section>
  `:'<section class="panel"><h2>Analytics</h2><p>No analytics available yet.</p></section>'}function re(){return`
    <section class="panel">
      <h2>AI Business Advisor (Gemini)</h2>
      <div id="advisor-output" class="chat-box"></div>
      <form id="advisor-form" class="chat-form">
        <textarea required name="message" rows="3" placeholder="Ask in Urdu or English..."></textarea>
        <button class="btn">Ask advisor</button>
      </form>
    </section>
  `}function oe(t,e){return t!=null&&t.id?`
    <section class="panel">
      <h2>Authenticity Badge</h2>
      ${e?`
        <div class="badge-card">
          <p><strong>Code:</strong> ${e.badge_code}</p>
          <p><strong>Status:</strong> ${e.status}</p>
          <p><strong>QR:</strong> ${e.qr_code_url?`<a href="${e.qr_code_url}" target="_blank">Open QR</a>`:"Not generated"}</p>
          <button id="generate-qr-btn" class="btn btn-outline" data-badge-code="${e.badge_code}">Generate QR</button>
        </div>
      `:`
        <form id="badge-request-form" class="form-grid" data-storefront-id="${t.id}">
          <input required name="business_type" type="text" placeholder="Business type" />
          <input required name="years_in_business" type="number" min="0" placeholder="Years in business" />
          <input required name="address" type="text" placeholder="Address" />
          <textarea name="description" rows="2" placeholder="Description"></textarea>
          <button class="btn">Request badge</button>
        </form>
      `}
    </section>
  `:'<section class="panel"><h2>Badges</h2><p>Create a storefront first.</p></section>'}function ne({userEmail:t}){return`
    <div class="app-shell">
      <header class="topbar">
        <div>
          <h1>KashmirConnect Dashboard</h1>
          <p>Manage storefront, products, AI advisor, badges and analytics.</p>
        </div>
        <div class="topbar-right">
          <span class="chip">${t||"User"}</span>
          <button id="logout-btn" class="btn btn-outline">Logout</button>
        </div>
      </header>
      <nav class="tabs">
        <button data-tab="profile" class="tab active">Profile</button>
        <button data-tab="storefront" class="tab">Storefront</button>
        <button data-tab="products" class="tab">Products</button>
        <button data-tab="advisor" class="tab">AI Advisor</button>
        <button data-tab="badges" class="tab">Badges</button>
        <button data-tab="analytics" class="tab">Analytics</button>
      </nav>
      <main id="view-root" class="view-root"></main>
    </div>
  `}function A(){return`
    <div class="auth-shell">
      <section class="panel">
        <h2>Welcome to KashmirConnect</h2>
        <p>Use your account to manage your digital storefront.</p>
        <div class="auth-grid">
          <form id="login-form" class="panel-form">
            <h3>Login</h3>
            <input required name="email" type="email" placeholder="Email" />
            <input required name="password" type="password" placeholder="Password" />
            <button class="btn">Login</button>
          </form>
          <form id="register-form" class="panel-form">
            <h3>Register</h3>
            <input required name="full_name" type="text" placeholder="Full name" />
            <input required name="email" type="email" placeholder="Email" />
            <input required name="password" type="password" placeholder="Password (min 6 chars)" />
            <input name="phone" type="text" placeholder="Phone (optional)" />
            <input name="business_name" type="text" placeholder="Business name (optional)" />
            <input name="district" type="text" placeholder="District (optional)" />
            <select name="sector">
              <option value="">Select sector (optional)</option>
              <option value="handicrafts">Handicrafts</option>
              <option value="agriculture">Agriculture</option>
              <option value="tourism">Tourism</option>
              <option value="food">Food</option>
              <option value="other">Other</option>
            </select>
            <button class="btn">Create account</button>
          </form>
        </div>
      </section>
    </div>
  `}function ae(t,e=[]){return t!=null&&t.id?`
    <section class="panel">
      <h2>Products</h2>
      <form id="create-product-form" class="form-grid" data-storefront-id="${t.id}">
        <input required name="name" type="text" placeholder="Product name" />
        <textarea name="description" rows="2" placeholder="Description"></textarea>
        <input name="price" type="number" min="0" step="0.01" placeholder="Price" />
        <input name="price_unit" type="text" placeholder="Price unit (piece, kg, etc)" />
        <input name="category" type="text" placeholder="Category" />
        <button class="btn">Add product</button>
      </form>
      <div class="list">
        ${e.map(o=>`
          <article class="list-item">
            <div>
              <h4>${o.name}</h4>
              <p>${o.description||"-"}</p>
              <small>Price: ${o.price||"-"} ${o.price_unit||""}</small>
            </div>
            <div class="actions">
              <button data-delete-product="${o.id}" class="btn btn-outline">Delete</button>
              <form data-upload-product-image="${o.id}">
                <input type="file" name="image" accept="image/*" required />
                <button class="btn btn-outline">Upload image</button>
              </form>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `:'<section class="panel"><h2>Products</h2><p>Create a storefront first.</p></section>'}function se(t={}){return`
    <section class="panel">
      <h2>Profile</h2>
      <form id="profile-form" class="form-grid">
        <input name="full_name" type="text" placeholder="Full name" value="${t.full_name||""}" />
        <input name="phone" type="text" placeholder="Phone" value="${t.phone||""}" />
        <input name="business_name" type="text" placeholder="Business name" value="${t.business_name||""}" />
        <input name="district" type="text" placeholder="District" value="${t.district||""}" />
        <select name="sector">
          <option value="">Select sector</option>
          ${["handicrafts","agriculture","tourism","food","other"].map(e=>`<option value="${e}" ${t.sector===e?"selected":""}>${e}</option>`).join("")}
        </select>
        <textarea name="bio" rows="3" placeholder="Bio">${t.bio||""}</textarea>
        <button class="btn">Save profile</button>
      </form>
    </section>
  `}function ie(t){const e=(t==null?void 0:t.storefront)||null;return e?`
    <section class="panel">
      <h2>Storefront</h2>
      <p>Public URL: <a target="_blank" href="https://${e.public_url}">${e.public_url}</a></p>
      <form id="update-storefront-form" class="form-grid" data-id="${e.id}">
        <input name="business_name" type="text" placeholder="Business name" value="${e.business_name||""}" />
        <input name="tagline" type="text" placeholder="Tagline" value="${e.tagline||""}" />
        <textarea name="description" rows="3" placeholder="Description">${e.description||""}</textarea>
        <input name="sector" type="text" placeholder="Sector" value="${e.sector||""}" />
        <input name="district" type="text" placeholder="District" value="${e.district||""}" />
        <input name="phone" type="text" placeholder="Phone" value="${e.phone||""}" />
        <input name="whatsapp" type="text" placeholder="WhatsApp" value="${e.whatsapp||""}" />
        <input name="email" type="email" placeholder="Business email" value="${e.email||""}" />
        <input name="instagram" type="text" placeholder="Instagram handle" value="${e.instagram||""}" />
        <button class="btn">Update storefront</button>
      </form>
      <div class="row">
        <form id="upload-cover-form" data-id="${e.id}">
          <label>Upload cover image</label>
          <input name="cover" type="file" accept="image/*" required />
          <button class="btn btn-outline">Upload cover</button>
        </form>
        <form id="upload-logo-form" data-id="${e.id}">
          <label>Upload logo image</label>
          <input name="logo" type="file" accept="image/*" required />
          <button class="btn btn-outline">Upload logo</button>
        </form>
      </div>
    </section>
  `:`
      <section class="panel">
        <h2>Create Storefront</h2>
        <form id="create-storefront-form" class="form-grid">
          <input required name="business_name" type="text" placeholder="Business name" />
          <input name="tagline" type="text" placeholder="Tagline" />
          <textarea name="description" rows="3" placeholder="Description"></textarea>
          <input required name="sector" type="text" placeholder="Sector" />
          <input name="district" type="text" placeholder="District" />
          <input name="phone" type="text" placeholder="Phone" />
          <input name="whatsapp" type="text" placeholder="WhatsApp" />
          <input name="email" type="email" placeholder="Business email" />
          <input name="instagram" type="text" placeholder="Instagram handle" />
          <button class="btn">Create storefront</button>
        </form>
      </section>
    `}function s(t,e="info"){const o=document.getElementById("toast-root");if(!o)return;const n=document.createElement("div");n.className=`toast toast-${e}`,n.textContent=t,o.appendChild(n),setTimeout(()=>n.classList.add("visible"),30),setTimeout(()=>{n.classList.remove("visible"),setTimeout(()=>n.remove(),250)},2600)}const v=document.getElementById("app"),i={activeTab:"profile",profile:null,storefrontData:null,badge:null,analytics:null};function p(t){const e=new FormData(t),o=Object.fromEntries(e.entries());return Object.keys(o).forEach(n=>{o[n]===""&&delete o[n]}),o}async function m(){i.profile=await H(),i.storefrontData=await K(),i.badge=await X(),i.analytics=await ee().catch(()=>null)}function ce(){if(!document.getElementById("toast-root")){const t=document.createElement("div");t.id="toast-root",document.body.appendChild(t)}}function P(){const t=document.getElementById("login-form"),e=document.getElementById("register-form");t==null||t.addEventListener("submit",async o=>{o.preventDefault();try{await N(p(t)),s("Logged in","success"),await b()}catch(n){s(n.message,"error")}}),e==null||e.addEventListener("submit",async o=>{o.preventDefault();try{await M(p(e)),s("Registered successfully","success"),await b()}catch(n){s(n.message,"error")}})}function de(){var t;(t=document.getElementById("logout-btn"))==null||t.addEventListener("click",async()=>{await j(),s("Logged out","info"),await b()}),document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{i.activeTab=e.dataset.tab,document.querySelectorAll(".tab").forEach(o=>o.classList.remove("active")),e.classList.add("active"),u()})})}function le(){var t;(t=document.getElementById("profile-form"))==null||t.addEventListener("submit",async e=>{e.preventDefault();try{await V(p(e.target)),await m(),s("Profile updated","success"),u()}catch(o){s(o.message,"error")}})}function ue(){var t,e,o,n;(t=document.getElementById("create-storefront-form"))==null||t.addEventListener("submit",async r=>{r.preventDefault();try{await F(p(r.target)),await m(),s("Storefront created","success"),u()}catch(a){s(a.message,"error")}}),(e=document.getElementById("update-storefront-form"))==null||e.addEventListener("submit",async r=>{r.preventDefault();const a=r.target.dataset.id;try{await z(a,p(r.target)),await m(),s("Storefront updated","success"),u()}catch(c){s(c.message,"error")}}),(o=document.getElementById("upload-cover-form"))==null||o.addEventListener("submit",async r=>{r.preventDefault();const a=r.target.dataset.id,c=r.target.cover.files[0];if(c)try{await x(a,c,"cover"),s("Cover image uploaded","success")}catch(l){s(l.message,"error")}}),(n=document.getElementById("upload-logo-form"))==null||n.addEventListener("submit",async r=>{r.preventDefault();const a=r.target.dataset.id,c=r.target.logo.files[0];if(c)try{await x(a,c,"logo"),s("Logo uploaded","success")}catch(l){s(l.message,"error")}})}function pe(){var t;(t=document.getElementById("create-product-form"))==null||t.addEventListener("submit",async e=>{e.preventDefault();const o=e.target.dataset.storefrontId,n=p(e.target);n.price&&(n.price=Number(n.price));try{await Q({...n,storefront_id:o}),await m(),s("Product created","success"),u()}catch(r){s(r.message,"error")}}),document.querySelectorAll("[data-delete-product]").forEach(e=>{e.addEventListener("click",async()=>{try{await W(e.dataset.deleteProduct),await m(),s("Product deleted","success"),u()}catch(o){s(o.message,"error")}})}),document.querySelectorAll("form[data-upload-product-image]").forEach(e=>{e.addEventListener("submit",async o=>{o.preventDefault();const n=e.dataset.uploadProductImage,r=e.querySelector('input[name="image"]').files[0];if(r)try{await J(n,r),s("Product image uploaded","success")}catch(a){s(a.message,"error")}})})}function me(){const t=document.getElementById("advisor-form"),e=document.getElementById("advisor-output");!t||!e||t.addEventListener("submit",async o=>{o.preventDefault();const n=p(t);e.textContent=`Thinking...
`;try{await G(n,{onChunk:r=>{e.textContent+=r,e.scrollTop=e.scrollHeight},onDone:r=>{e.textContent+=`

[Used ${r.queries_used}/${r.queries_limit} free monthly queries]`}})}catch(r){s(r.message,"error")}})}function fe(){var t,e;(t=document.getElementById("badge-request-form"))==null||t.addEventListener("submit",async o=>{o.preventDefault();const n=o.target.dataset.storefrontId,r=p(o.target);r.years_in_business=Number(r.years_in_business||0);try{await Y({...r,storefront_id:n}),await m(),s("Badge request submitted","success"),u()}catch(a){s(a.message,"error")}}),(e=document.getElementById("generate-qr-btn"))==null||e.addEventListener("click",async o=>{try{await Z(o.target.dataset.badgeCode),await m(),s("QR generated","success"),u()}catch(n){s(n.message,"error")}})}function ge(){i.activeTab==="profile"&&le(),i.activeTab==="storefront"&&ue(),i.activeTab==="products"&&pe(),i.activeTab==="advisor"&&me(),i.activeTab==="badges"&&fe()}function u(){var e,o,n;const t=document.getElementById("view-root");t&&(i.activeTab==="profile"&&(t.innerHTML=se(i.profile)),i.activeTab==="storefront"&&(t.innerHTML=ie(i.storefrontData)),i.activeTab==="products"&&(t.innerHTML=ae((e=i.storefrontData)==null?void 0:e.storefront,((o=i.storefrontData)==null?void 0:o.products)||[])),i.activeTab==="advisor"&&(t.innerHTML=re()),i.activeTab==="badges"&&(t.innerHTML=oe((n=i.storefrontData)==null?void 0:n.storefront,i.badge)),i.activeTab==="analytics"&&(t.innerHTML=te(i.analytics)),ge())}async function b(){var t;if(ce(),!g()){v.innerHTML=A(),P();return}try{await m()}catch(e){T(),s(e.message||"Session expired. Login again.","error"),v.innerHTML=A(),P();return}v.innerHTML=ne({userEmail:(t=C())==null?void 0:t.email}),de(),u()}b();
