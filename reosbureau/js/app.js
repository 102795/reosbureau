/* Horizon Reizen — front-end logica (vanilla JS, praat met api.php) */

const app = document.getElementById('app');

const state = {
  page: 'home',
  trips: [],
  loading: true,

  // student portaal
  loggedIn: false,
  studentNumber: '',
  loginInput: '',
  loginError: '',
  selectedTripId: null,      // trip open in enroll/detail modal
  filterType: 'Alle',
  enrollForm: { identityCardNumber: '', remarks: '' },
  enrollError: '',
  enrollSuccess: '',
  tab: 'all',                // 'all' | 'mine'

  // admin
  adminLoggedIn: false,       // wordt bevestigd door de server (sessie), niet enkel client-side
  adminLoginInput: '',
  adminLoginError: '',
  adminView: 'trips',        // 'trips' | 'enrollments'
  showForm: false,
  editingTripId: null,
  form: emptyTripForm(),
  adminSelectedTripId: null,
  deleteConfirmId: null,
  formError: '',
};

function emptyTripForm() {
  return {
    id: '', title: '', destination: '', description: '',
    type: 'Cultuurtrip', startDate: '', endDate: '',
    maxEnrollments: 20, imageUrl: '',
  };
}

/* ---------- API helpers ---------- */

async function apiGet(action) {
  const res = await fetch(`api.php?action=${action}`);
  return res.json();
}

async function apiPost(action, body) {
  const res = await fetch(`api.php?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Er ging iets mis.');
  return data;
}

async function loadTrips() {
  state.loading = true;
  state.trips = await apiGet('list');
  state.loading = false;
  render();
}

/* ---------- Utilities ---------- */

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

function fmtDate(iso, opts) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('nl-BE', opts || {});
}

function findTrip(id) {
  return state.trips.find((t) => t.id === id) || null;
}

function isEnrolled(trip) {
  return trip.enrollments.some((e) => e.studentNumber === state.studentNumber);
}

function spotsLeft(trip) {
  return trip.maxEnrollments - trip.enrollments.length;
}

/* ---------- Navigation ---------- */

function navigate(page) {
  state.page = page;
  document.querySelectorAll('.nav-link').forEach((el) => {
    el.classList.toggle('active', el.dataset.nav === page);
  });
  render();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  // Bij het openen van het adminscherm bij de server controleren of er
  // nog een geldige (ingelogde) sessie bestaat, zodat een pagina-herlaad
  // niet zomaar terug naar het login-scherm gaat en andersom.
  if (page === 'admin') {
    apiGet('admin-check').then((res) => {
      if (res.loggedIn !== state.adminLoggedIn) {
        state.adminLoggedIn = res.loggedIn;
        render();
      }
    });
  }
}

document.querySelectorAll('[data-nav]').forEach((el) => {
  el.addEventListener('click', () => navigate(el.dataset.nav));
});

/* ---------- Render dispatch ---------- */

function render() {
  if (state.loading) {
    app.innerHTML = `<div class="page-loading">Bezig met laden…</div>`;
    return;
  }
  if (state.page === 'home') app.innerHTML = renderHome();
  else if (state.page === 'student') app.innerHTML = renderStudent();
  else if (state.page === 'admin') app.innerHTML = renderAdmin();

  attachHandlers();
}

/* =======================================================================
   HOME
   ======================================================================= */

function renderHome() {
  const featured = state.trips.slice(0, 3);
  const totalEnrollments = state.trips.reduce((s, t) => s + t.enrollments.length, 0);

  const cards = featured.map((trip) => {
    const left = spotsLeft(trip);
    const full = left <= 0;
    return `
      <article class="trip-card" data-goto-student>
        <div class="trip-card-img-wrap">
          <img src="${esc(trip.imageUrl)}" alt="${esc(trip.destination)}">
          <div class="badge-top-left"><span class="badge">${esc(trip.type)}</span></div>
          ${full ? `<div class="full-overlay"><span>Volzet</span></div>` : ''}
        </div>
        <div class="trip-card-body">
          <p class="trip-id">${esc(trip.id)}</p>
          <h3 class="trip-title">${esc(trip.title)}</h3>
          <p class="trip-dest">${esc(trip.destination)}</p>
          <div class="trip-meta-row">
            <span>${esc(fmtDate(trip.startDate, { day: 'numeric', month: 'short', year: 'numeric' }))}</span>
            <span class="spots-left ${full ? 'full' : 'open'}">${full ? 'Volzet' : `${left} plaatsen vrij`}</span>
          </div>
        </div>
      </article>`;
  }).join('');

  return `
  <div class="page" style="padding-top:0;">
    <section class="hero">
      <img class="hero-img" src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1600&h=900&fit=crop&auto=format" alt="Reiziger uitkijkend over een berglandschap bij zonsondergang">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-inner">
          <p class="hero-eyebrow">Studentiereizen</p>
          <h1 class="hero-title">De wereld<br><em>wacht</em> op jou.</h1>
          <p class="hero-desc">Ontdek curated reizen speciaal voor studenten. Cultuur, natuur en avontuur. Zorgvuldig samengesteld voor onvergetelijke ervaringen.</p>
          <div class="hero-actions">
            <button class="btn btn-accent" data-goto-student>Bekijk reizen</button>
            <button class="btn btn-outline-white" data-goto-student>Inschrijven</button>
          </div>
        </div>
      </div>
      <div class="stats-wrap">
        <div class="stats-align">
          <div class="stats-bar">
            <div class="stat"><div class="stat-value">${state.trips.length}</div><div class="stat-label">Actieve reizen</div></div>
            <div class="stat"><div class="stat-value">${totalEnrollments}</div><div class="stat-label">Inschrijvingen</div></div>
            <div class="stat"><div class="stat-value">5</div><div class="stat-label">Bestemmingen</div></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Uitgelicht</p>
          <h2 class="section-title">Komende reizen</h2>
        </div>
        <button class="link-muted" data-goto-student>Alle reizen bekijken →</button>
      </div>
      <div class="grid grid-3">${cards}</div>
    </section>

    <section class="cta-section">
      <div class="cta-grid">
        <div>
          <p class="eyebrow">Voor studenten</p>
          <h2 class="cta-title">Klaar om de wereld te verkennen?</h2>
          <p class="cta-desc">Log in met je studentennummer, kies een reis die je aanspreekt en schrijf je in. Eenvoudig, snel en overzichtelijk.</p>
          <button class="btn btn-accent" data-goto-student>Naar studentenportaal</button>
        </div>
        <div class="feature-grid">
          <div class="feature-box"><div class="feature-icon"></div><p class="feature-title">Diverse bestemmingen</p><p class="feature-desc">Van stedentrips tot natuurreizen</p></div>
          <div class="feature-box"><div class="feature-icon"></div><p class="feature-title">Eenvoudig inschrijven</p><p class="feature-desc">In enkele stappen geregeld</p></div>
          <div class="feature-box"><div class="feature-icon"></div><p class="feature-title">Groepsreizen</p><p class="feature-desc">Samen op avontuur met medestudenten</p></div>
          <div class="feature-box"><div class="feature-icon"></div><p class="feature-title">Uitschrijven mogelijk</p><p class="feature-desc">Tot de sluitingsdatum</p></div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-inner">
        <span class="footer-brand">Horizon Reizen</span>
        <span>© 2026 — Alle rechten voorbehouden</span>
      </div>
    </footer>
  </div>`;
}

/* =======================================================================
   STUDENT PORTAL
   ======================================================================= */

function renderStudent() {
  if (!state.loggedIn) return renderStudentLogin();

  const myTrips = state.trips.filter((t) => t.enrollments.some((e) => e.studentNumber === state.studentNumber));
  const types = ['Alle', ...Array.from(new Set(state.trips.map((t) => t.type)))];
  const filtered = state.filterType === 'Alle' ? state.trips : state.trips.filter((t) => t.type === state.filterType);

  const chips = types.map((type) => `
    <button class="chip ${state.filterType === type ? 'active' : ''}" data-filter-type="${esc(type)}">${esc(type)}</button>
  `).join('');

  const tripCards = filtered.map((trip) => {
    const enrolled = isEnrolled(trip);
    const left = spotsLeft(trip);
    const full = left <= 0;
    return `
      <article class="trip-card" data-open-trip="${esc(trip.id)}">
        <div class="trip-card-img-wrap">
          <img src="${esc(trip.imageUrl)}" alt="${esc(trip.destination)}">
          <div class="badges-row">
            <span class="badge">${esc(trip.type)}</span>
            ${enrolled ? `<span class="badge badge-enrolled">Ingeschreven</span>` : ''}
          </div>
        </div>
        <div class="trip-card-body">
          <p class="trip-id">${esc(trip.id)}</p>
          <h3 class="trip-title">${esc(trip.title)}</h3>
          <p class="trip-dest">${esc(trip.destination)}</p>
          <p class="trip-desc">${esc(trip.description)}</p>
          <div class="trip-meta-row gap">
            <span>${esc(fmtDate(trip.startDate, { day: 'numeric', month: 'short' }))} – ${esc(fmtDate(trip.endDate, { day: 'numeric', month: 'short', year: 'numeric' }))}</span>
            <span class="spots-left ${full ? 'full' : 'open'}" style="margin-left:auto;">${full ? 'Volzet' : `${left} vrije plaatsen`}</span>
          </div>
        </div>
        <div class="trip-card-footer">
          <button class="btn btn-block ${enrolled ? 'btn-outline' : full ? 'btn-disabled' : 'btn-accent'}" data-open-trip="${esc(trip.id)}" ${full && !enrolled ? 'disabled' : ''}>
            ${enrolled ? 'Bekijken / Uitschrijven' : full ? 'Volzet' : 'Inschrijven'}
          </button>
        </div>
      </article>`;
  }).join('');

  const mineHtml = myTrips.length === 0 ? `
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </div>
      <h3>Nog geen inschrijvingen</h3>
      <p>Bekijk de beschikbare reizen en schrijf je in.</p>
      <button class="btn btn-primary" data-set-tab="all">Bekijk reizen</button>
    </div>
  ` : myTrips.map((trip) => {
    const enrollment = trip.enrollments.find((e) => e.studentNumber === state.studentNumber);
    return `
      <div class="enroll-row">
        <div class="enroll-row-img"><img src="${esc(trip.imageUrl)}" alt="${esc(trip.destination)}"></div>
        <div class="enroll-row-body">
          <div>
            <div class="admin-row-tags"><span class="id">${esc(trip.id)}</span><span class="badge badge-enrolled" style="font-size:.75rem;">Ingeschreven</span></div>
            <h3 class="trip-title" style="font-size:1.125rem;">${esc(trip.title)}</h3>
            <p class="trip-dest" style="margin-bottom:8px;">${esc(trip.destination)}</p>
            <div class="enroll-row-meta">
              <span>${esc(fmtDate(trip.startDate))} → ${esc(fmtDate(trip.endDate))}</span>
              <span>ID: <strong style="font-family:monospace;">${esc(enrollment.identityCardNumber)}</strong></span>
              ${enrollment.remarks ? `<span style="font-style:italic;">"${esc(enrollment.remarks)}"</span>` : ''}
            </div>
          </div>
          <button class="btn btn-danger-outline btn-sm" data-unenroll="${esc(trip.id)}">Uitschrijven</button>
        </div>
      </div>`;
  }).join('');

  return `
  <div class="page">
    <div class="page-inner">
      <div class="page-header">
        <div>
          <p class="page-subeyebrow">Student</p>
          <h1 class="page-title">Mijn reisportaal</h1>
          <p class="page-mono">${esc(state.studentNumber)}</p>
        </div>
        <div style="display:flex;align-items:center;gap:16px;">
          ${state.enrollSuccess ? `<div class="alert alert-success">${iconCheck()} ${esc(state.enrollSuccess)}</div>` : ''}
          <button class="btn btn-outline btn-sm" id="btn-logout">Uitloggen</button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab-btn ${state.tab === 'all' ? 'active' : ''}" data-set-tab="all">Alle reizen</button>
        <button class="tab-btn ${state.tab === 'mine' ? 'active' : ''}" data-set-tab="mine">Mijn inschrijvingen (${myTrips.length})</button>
      </div>

      ${state.tab === 'all' ? `
        <div class="chip-row">${chips}</div>
        <div class="grid grid-3">${tripCards || `<p style="color:var(--muted-foreground);">Geen reizen gevonden.</p>`}</div>
      ` : `<div>${mineHtml}</div>`}
    </div>
    ${renderTripModal()}
  </div>`;
}

function renderStudentLogin() {
  return `
  <div class="page">
    <div class="login-wrap">
      <div class="login-box">
        <div class="login-header">
          <div class="login-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h1 class="page-title" style="font-size:2.25rem;">Studentenportaal</h1>
          <p>Log in met je studentennummer om reizen te bekijken en je in te schrijven.</p>
        </div>
        <div class="card-panel">
          <form id="login-form">
            ${state.loginError ? `<div class="alert alert-error" style="margin-bottom:16px;">${esc(state.loginError)}</div>` : ''}
            <div class="field field-mono">
              <label>Studentennummer</label>
              <input type="text" id="login-input" placeholder="s123456" autofocus value="${esc(state.loginInput)}">
            </div>
            <button type="submit" class="btn btn-primary btn-block">Inloggen</button>
          </form>
          <p class="login-hint">Je gegevens zijn al gekend in ons systeem. Je hoeft je niet te registreren.</p>
        </div>
      </div>
    </div>
  </div>`;
}

function renderTripModal() {
  const trip = state.selectedTripId ? findTrip(state.selectedTripId) : null;
  if (!trip) return '';
  const enrolled = isEnrolled(trip);
  const left = spotsLeft(trip);
  const full = left <= 0;

  return `
  <div class="modal-overlay" id="trip-modal-overlay">
    <div class="modal-box">
      <div class="modal-hero">
        <img src="${esc(trip.imageUrl)}" alt="${esc(trip.destination)}">
        <div class="modal-hero-overlay"></div>
        <button class="modal-close" id="close-trip-modal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="modal-hero-text">
          <p class="id">${esc(trip.id)}</p>
          <h2>${esc(trip.title)}</h2>
        </div>
      </div>
      <div class="modal-body">
        <div class="info-grid">
          <div class="info-box"><p class="label">Bestemming</p><p class="value">${esc(trip.destination)}</p></div>
          <div class="info-box"><p class="label">Type</p><p class="value">${esc(trip.type)}</p></div>
          <div class="info-box"><p class="label">Periode</p><p class="value" style="font-size:.75rem;">${esc(fmtDate(trip.startDate))} → ${esc(fmtDate(trip.endDate))}</p></div>
          <div class="info-box"><p class="label">Plaatsen</p><p class="value" style="color:${full ? '#C78283' : '#744253'};">${trip.enrollments.length}/${trip.maxEnrollments}</p></div>
        </div>
        <p class="modal-desc">${esc(trip.description)}</p>

        ${enrolled ? `
          <div class="enrolled-box"><p>Je bent ingeschreven voor deze reis.</p></div>
          <button class="btn btn-danger-outline btn-block" data-unenroll-close="${esc(trip.id)}">Uitschrijven</button>
        ` : `
          <form id="enroll-form">
            <p class="form-label-strong">Inschrijvingsformulier</p>
            ${state.enrollError ? `<div class="alert alert-error">${esc(state.enrollError)}</div>` : ''}
            <div class="field field-mono">
              <label>Studentennummer</label>
              <input value="${esc(state.studentNumber)}" disabled>
            </div>
            <div class="field field-mono">
              <label>Identiteitskaartnummer *</label>
              <input type="text" id="enroll-idcard" placeholder="BE123456" value="${esc(state.enrollForm.identityCardNumber)}">
            </div>
            <div class="field">
              <label>Opmerkingen <span class="optional">(dieet, lichamelijke klachten…)</span></label>
              <textarea id="enroll-remarks" rows="3" placeholder="Optionele opmerkingen voor de begeleider…">${esc(state.enrollForm.remarks)}</textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" style="flex:1;" id="cancel-enroll">Annuleren</button>
              <button type="submit" class="btn btn-accent" style="flex:1;">Inschrijven</button>
            </div>
          </form>
        `}
      </div>
    </div>
  </div>`;
}

function iconCheck() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
}

/* =======================================================================
   ADMIN
   ======================================================================= */

function renderAdminLogin() {
  return `
  <div class="page">
    <div class="login-wrap">
      <div class="login-box">
        <div class="login-header">
          <div class="login-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 class="page-title" style="font-size:2.25rem;">Beheerderslogin</h1>
          <p>Log in met het wachtwoord van het GLR om reizen en inschrijvingen te beheren.</p>
        </div>
        <div class="card-panel">
          <form id="admin-login-form">
            ${state.adminLoginError ? `<div class="alert alert-error" style="margin-bottom:16px;">${esc(state.adminLoginError)}</div>` : ''}
            <div class="field field-mono">
              <label>Wachtwoord</label>
              <input type="password" id="admin-login-input" placeholder="••••••••" autofocus value="${esc(state.adminLoginInput)}">
            </div>
            <button type="submit" class="btn btn-primary btn-block">Inloggen</button>
          </form>
        </div>
      </div>
    </div>
  </div>`;
}

function renderAdmin() {
  if (!state.adminLoggedIn) return renderAdminLogin();

  const allEnrollments = state.trips.flatMap((t) => t.enrollments.map((e) => ({ ...e, tripTitle: t.title })));
  const selected = state.adminSelectedTripId ? findTrip(state.adminSelectedTripId) : null;

  const stats = [
    { label: 'Totaal reizen', value: state.trips.length },
    { label: 'Totaal inschrijvingen', value: allEnrollments.length },
    { label: 'Volzet reizen', value: state.trips.filter((t) => t.enrollments.length >= t.maxEnrollments).length },
    { label: 'Beschikbare plaatsen', value: state.trips.reduce((s, t) => s + Math.max(0, t.maxEnrollments - t.enrollments.length), 0) },
  ].map((s) => `<div class="stat-card"><div class="value">${s.value}</div><div class="label">${esc(s.label)}</div></div>`).join('');

  const rows = state.trips.map((trip) => {
    const left = spotsLeft(trip);
    const pct = Math.round((trip.enrollments.length / trip.maxEnrollments) * 100);
    const isSel = state.adminSelectedTripId === trip.id;
    return `
      <div class="admin-row ${isSel ? 'selected' : ''}" data-select-admin-trip="${esc(trip.id)}">
        <div class="admin-row-top">
          <div class="admin-row-info">
            <div class="admin-row-tags"><span class="id">${esc(trip.id)}</span><span class="type">${esc(trip.type)}</span></div>
            <p class="admin-row-title">${esc(trip.title)}</p>
            <p class="admin-row-dest">${esc(trip.destination)}</p>
            <div class="progress-row">
              <div class="progress-track"><div class="progress-fill ${left <= 0 ? 'full' : ''}" style="width:${pct}%;"></div></div>
              <span class="progress-count">${trip.enrollments.length}/${trip.maxEnrollments}</span>
            </div>
          </div>
          <div class="admin-row-actions">
            <button class="icon-btn" title="Aanpassen" data-edit-trip="${esc(trip.id)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn danger" title="Verwijderen" data-delete-trip="${esc(trip.id)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }).join('') || `<div class="admin-empty"><p class="title">Nog geen reizen</p><p style="font-size:.875rem;margin-top:4px;">Voeg een eerste reis toe om te beginnen.</p></div>`;

  const detailPanel = !selected ? '' : `
    <div class="detail-panel">
      <div class="detail-img"><img src="${esc(selected.imageUrl)}" alt="${esc(selected.destination)}"></div>
      <div class="detail-body">
        <p class="trip-id">${esc(selected.id)}</p>
        <h3 class="trip-title" style="font-size:1.125rem;">${esc(selected.title)}</h3>
        <p class="trip-dest" style="margin-bottom:0;">${esc(selected.destination)}</p>
        <div class="detail-list">
          <div class="row"><span>Begin</span><span>${esc(fmtDate(selected.startDate))}</span></div>
          <div class="row"><span>Einde</span><span>${esc(fmtDate(selected.endDate))}</span></div>
          <div class="row"><span>Max. inschrijvingen</span><span>${selected.maxEnrollments}</span></div>
          <div class="row"><span>Ingeschreven</span><span class="accent">${selected.enrollments.length}</span></div>
        </div>
        <div class="detail-enrollments">
          <h4>Inschrijvingen</h4>
          ${selected.enrollments.length === 0
            ? `<p style="font-size:.75rem;color:var(--muted-foreground);font-style:italic;">Nog geen inschrijvingen.</p>`
            : selected.enrollments.map((e) => `
              <div class="detail-enroll-item">
                <div class="who">${esc(e.studentNumber)}</div>
                <div class="id">ID: ${esc(e.identityCardNumber)}</div>
                ${e.remarks ? `<div class="remarks">"${esc(e.remarks)}"</div>` : ''}
              </div>`).join('')}
        </div>
      </div>
    </div>`;

  const enrollmentsTable = `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Studentnummer</th><th>Reis</th><th>Reis-ID</th><th>Identiteitsnr.</th><th>Opmerkingen</th></tr></thead>
        <tbody>
          ${allEnrollments.length === 0 ? `<tr><td colspan="5" class="table-empty">Nog geen inschrijvingen.</td></tr>` :
            allEnrollments.map((e) => `
              <tr>
                <td class="student">${esc(e.studentNumber)}</td>
                <td>${esc(e.tripTitle)}</td>
                <td class="rid">${esc(e.reisId)}</td>
                <td class="rid">${esc(e.identityCardNumber)}</td>
                <td class="remarks">${e.remarks ? esc(e.remarks) : '—'}</td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  return `
  <div class="page">
    <div class="page-inner">
      <div class="page-header">
        <div>
          <p class="page-subeyebrow">Beheer</p>
          <h1 class="page-title">Administratie</h1>
        </div>
        <div class="admin-toolbar">
          <div class="tabs" style="margin-bottom:0;">
            <button class="tab-btn ${state.adminView === 'trips' ? 'active' : ''}" data-admin-view="trips">Reizen</button>
            <button class="tab-btn ${state.adminView === 'enrollments' ? 'active' : ''}" data-admin-view="enrollments">Inschrijvingen</button>
          </div>
          ${state.adminView === 'trips' ? `<button class="btn btn-accent btn-sm" id="btn-open-add">+ Nieuwe reis</button>` : ''}
          <button class="btn btn-outline btn-sm" id="btn-admin-logout">Uitloggen</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:32px;">${stats}</div>

      ${state.adminView === 'trips' ? `
        <div class="admin-layout">
          <div class="admin-list">
            <div class="admin-list-head"><h2>Alle reizen</h2><span class="count-pill">${state.trips.length} reizen</span></div>
            <div>${rows}</div>
          </div>
          ${detailPanel}
        </div>
      ` : enrollmentsTable}
    </div>

    ${renderAdminForm()}
    ${renderDeleteConfirm()}
  </div>`;
}

function renderAdminForm() {
  if (!state.showForm) return '';
  const f = state.form;
  const editing = !!state.editingTripId;
  const types = ['Cultuurtrip', 'Stedentrip', 'Natuurtrip', 'Avontuurtrip', 'Studiereis'];

  return `
  <div class="modal-overlay" id="admin-form-overlay">
    <div class="modal-box">
      <div class="modal-header-row">
        <h2 class="page-title" style="font-size:1.5rem;">${editing ? 'Reis aanpassen' : 'Nieuwe reis'}</h2>
        <button class="modal-close plain" id="close-admin-form">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form class="modal-form" id="trip-form">
        ${state.formError ? `<div class="alert alert-error">${esc(state.formError)}</div>` : ''}
        <div class="form-row-2">
          <div class="field field-mono">
            <label>Reis-ID *</label>
            <input type="text" id="f-id" placeholder="REIS-006" value="${esc(f.id)}" ${editing ? 'disabled' : ''}>
          </div>
          <div class="field">
            <label>Type</label>
            <select id="f-type">
              ${types.map((t) => `<option ${f.type === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field">
          <label>Titel *</label>
          <input type="text" id="f-title" placeholder="Rome & The Eternal City" value="${esc(f.title)}">
        </div>
        <div class="field">
          <label>Bestemming *</label>
          <input type="text" id="f-destination" placeholder="Rome, Italië" value="${esc(f.destination)}">
        </div>
        <div class="field">
          <label>Omschrijving</label>
          <textarea id="f-description" rows="3">${esc(f.description)}</textarea>
        </div>
        <div class="form-row-2">
          <div class="field">
            <label>Begindatum *</label>
            <input type="date" id="f-startDate" value="${esc(f.startDate)}">
          </div>
          <div class="field">
            <label>Einddatum *</label>
            <input type="date" id="f-endDate" value="${esc(f.endDate)}">
          </div>
        </div>
        <div class="field">
          <label>Max. inschrijvingen</label>
          <input type="number" min="1" id="f-maxEnrollments" value="${esc(String(f.maxEnrollments))}">
        </div>
        <div class="field">
          <label>Afbeelding URL</label>
          <input type="text" id="f-imageUrl" placeholder="https://images.unsplash.com/..." value="${esc(f.imageUrl)}">
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" style="flex:1;" id="cancel-admin-form">Annuleren</button>
          <button type="submit" class="btn btn-accent" style="flex:1;">${editing ? 'Opslaan' : 'Reis toevoegen'}</button>
        </div>
      </form>
    </div>
  </div>`;
}

function renderDeleteConfirm() {
  if (!state.deleteConfirmId) return '';
  return `
  <div class="modal-overlay" id="delete-confirm-overlay">
    <div class="modal-box narrow">
      <div class="icon-red">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
      </div>
      <h3 class="page-title" style="font-size:1.25rem;">Reis verwijderen?</h3>
      <p style="color:var(--muted-foreground);font-size:.875rem;margin:8px 0 24px;">Dit verwijdert ook alle inschrijvingen voor deze reis. Deze actie kan niet ongedaan worden gemaakt.</p>
      <div class="form-actions">
        <button class="btn btn-outline" style="flex:1;" id="cancel-delete">Annuleren</button>
        <button class="btn btn-danger" style="flex:1;" id="confirm-delete">Verwijderen</button>
      </div>
    </div>
  </div>`;
}

/* =======================================================================
   EVENT HANDLERS
   ======================================================================= */

function attachHandlers() {
  // Global "go to student portal" triggers (home page CTAs, trip cards)
  app.querySelectorAll('[data-goto-student]').forEach((el) => {
    el.addEventListener('click', () => navigate('student'));
  });

  if (state.page === 'student') attachStudentHandlers();
  if (state.page === 'admin') attachAdminHandlers();
}

/* ---- Student handlers ---- */

function attachStudentHandlers() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = document.getElementById('login-input').value.trim();
      if (!val) {
        state.loginError = 'Voer je studentennummer in.';
        render();
        return;
      }
      // Controleer bij de server of dit studentnummer bekend is (studenten
      // staan al vooraf in de database — er is geen registratie mogelijk).
      try {
        await apiPost('student-login', { studentNumber: val });
        state.studentNumber = val;
        state.loggedIn = true;
        state.loginError = '';
        render();
      } catch (err) {
        state.loginError = err.message;
        render();
      }
    });
    return;
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    state.loggedIn = false;
    state.loginInput = '';
    state.studentNumber = '';
    state.tab = 'all';
    render();
  });

  app.querySelectorAll('[data-set-tab]').forEach((el) => {
    el.addEventListener('click', () => { state.tab = el.dataset.setTab; render(); });
  });

  app.querySelectorAll('[data-filter-type]').forEach((el) => {
    el.addEventListener('click', () => { state.filterType = el.dataset.filterType; render(); });
  });

  app.querySelectorAll('[data-open-trip]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (el.disabled) return;
      state.selectedTripId = el.dataset.openTrip;
      state.enrollForm = { identityCardNumber: '', remarks: '' };
      state.enrollError = '';
      render();
    });
  });

  app.querySelectorAll('[data-unenroll]').forEach((el) => {
    el.addEventListener('click', () => doUnenroll(el.dataset.unenroll));
  });

  const closeModal = document.getElementById('close-trip-modal');
  if (closeModal) closeModal.addEventListener('click', () => { state.selectedTripId = null; render(); });

  const overlay = document.getElementById('trip-modal-overlay');
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) { state.selectedTripId = null; render(); } });

  const cancelEnroll = document.getElementById('cancel-enroll');
  if (cancelEnroll) cancelEnroll.addEventListener('click', () => { state.selectedTripId = null; render(); });

  const unenrollClose = document.querySelector('[data-unenroll-close]');
  if (unenrollClose) unenrollClose.addEventListener('click', async () => {
    await doUnenroll(unenrollClose.dataset.unenrollClose, false);
    state.selectedTripId = null;
    render();
  });

  const enrollForm = document.getElementById('enroll-form');
  if (enrollForm) enrollForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idcard = document.getElementById('enroll-idcard').value.trim();
    const remarks = document.getElementById('enroll-remarks').value.trim();
    if (!idcard) {
      state.enrollError = 'Identiteitskaartnummer is verplicht.';
      render();
      return;
    }
    const trip = findTrip(state.selectedTripId);
    try {
      await apiPost('enroll', {
        reisId: state.selectedTripId,
        studentNumber: state.studentNumber,
        identityCardNumber: idcard,
        remarks,
      });
      trip.enrollments.push({ studentNumber: state.studentNumber, reisId: trip.id, identityCardNumber: idcard, remarks });
      state.enrollError = '';
      state.enrollSuccess = `Je bent ingeschreven voor "${trip.title}".`;
      state.selectedTripId = null;
      render();
      setTimeout(() => { state.enrollSuccess = ''; render(); }, 4000);
    } catch (err) {
      state.enrollError = err.message;
      render();
    }
  });
}

async function doUnenroll(reisId, doRender = true) {
  const trip = findTrip(reisId);
  try {
    await apiPost('unenroll', { reisId, studentNumber: state.studentNumber });
    trip.enrollments = trip.enrollments.filter((e) => e.studentNumber !== state.studentNumber);
    state.enrollSuccess = 'Uitgeschreven.';
    if (doRender) render();
    setTimeout(() => { state.enrollSuccess = ''; render(); }, 3000);
  } catch (err) {
    alert(err.message);
  }
}

/* ---- Admin handlers ---- */

function attachAdminHandlers() {
  // Login-formulier van de beheerder (enkel aanwezig als nog niet ingelogd)
  const adminLoginForm = document.getElementById('admin-login-form');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const wachtwoord = document.getElementById('admin-login-input').value;
      if (!wachtwoord) {
        state.adminLoginError = 'Voer het wachtwoord in.';
        render();
        return;
      }
      try {
        await apiPost('admin-login', { wachtwoord });
        state.adminLoggedIn = true;
        state.adminLoginError = '';
        state.adminLoginInput = '';
        render();
      } catch (err) {
        state.adminLoginError = err.message;
        render();
      }
    });
    return;
  }

  const adminLogoutBtn = document.getElementById('btn-admin-logout');
  if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', async () => {
    try { await apiPost('admin-logout'); } catch (err) { /* sessie is hoe dan ook lokaal beëindigd */ }
    state.adminLoggedIn = false;
    state.adminView = 'trips';
    render();
  });

  app.querySelectorAll('[data-admin-view]').forEach((el) => {
    el.addEventListener('click', () => { state.adminView = el.dataset.adminView; render(); });
  });

  const addBtn = document.getElementById('btn-open-add');
  if (addBtn) addBtn.addEventListener('click', () => {
    state.editingTripId = null;
    state.form = emptyTripForm();
    state.formError = '';
    state.showForm = true;
    render();
  });

  app.querySelectorAll('[data-select-admin-trip]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.selectAdminTrip;
      state.adminSelectedTripId = state.adminSelectedTripId === id ? null : id;
      render();
    });
  });

  app.querySelectorAll('[data-edit-trip]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const trip = findTrip(el.dataset.editTrip);
      state.editingTripId = trip.id;
      state.form = {
        id: trip.id, title: trip.title, destination: trip.destination,
        description: trip.description, type: trip.type, startDate: trip.startDate,
        endDate: trip.endDate, maxEnrollments: trip.maxEnrollments, imageUrl: trip.imageUrl,
      };
      state.formError = '';
      state.showForm = true;
      render();
    });
  });

  app.querySelectorAll('[data-delete-trip]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      state.deleteConfirmId = el.dataset.deleteTrip;
      render();
    });
  });

  const closeForm = document.getElementById('close-admin-form');
  if (closeForm) closeForm.addEventListener('click', () => { state.showForm = false; render(); });
  const cancelForm = document.getElementById('cancel-admin-form');
  if (cancelForm) cancelForm.addEventListener('click', () => { state.showForm = false; render(); });
  const formOverlay = document.getElementById('admin-form-overlay');
  if (formOverlay) formOverlay.addEventListener('click', (e) => { if (e.target === formOverlay) { state.showForm = false; render(); } });

  const tripForm = document.getElementById('trip-form');
  if (tripForm) tripForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = {
      id: document.getElementById('f-id').value.trim(),
      title: document.getElementById('f-title').value.trim(),
      destination: document.getElementById('f-destination').value.trim(),
      description: document.getElementById('f-description').value.trim(),
      type: document.getElementById('f-type').value,
      startDate: document.getElementById('f-startDate').value,
      endDate: document.getElementById('f-endDate').value,
      maxEnrollments: parseInt(document.getElementById('f-maxEnrollments').value, 10) || 0,
      imageUrl: document.getElementById('f-imageUrl').value.trim(),
    };
    if (!f.id || !f.title || !f.destination || !f.startDate || !f.endDate) {
      state.formError = 'Vul alle verplichte velden in.';
      render();
      return;
    }
    try {
      if (state.editingTripId) {
        await apiPost('update', f);
        const idx = state.trips.findIndex((t) => t.id === f.id);
        state.trips[idx] = { ...state.trips[idx], ...f };
      } else {
        const created = await apiPost('add', f);
        state.trips.push(created);
      }
      state.showForm = false;
      state.formError = '';
      render();
    } catch (err) {
      state.formError = err.message;
      render();
    }
  });

  const cancelDelete = document.getElementById('cancel-delete');
  if (cancelDelete) cancelDelete.addEventListener('click', () => { state.deleteConfirmId = null; render(); });
  const confirmDelete = document.getElementById('confirm-delete');
  if (confirmDelete) confirmDelete.addEventListener('click', async () => {
    try {
      await apiPost('delete', { id: state.deleteConfirmId });
      state.trips = state.trips.filter((t) => t.id !== state.deleteConfirmId);
      if (state.adminSelectedTripId === state.deleteConfirmId) state.adminSelectedTripId = null;
      state.deleteConfirmId = null;
      render();
    } catch (err) {
      alert(err.message);
      state.deleteConfirmId = null;
      render();
    }
  });
  const deleteOverlay = document.getElementById('delete-confirm-overlay');
  if (deleteOverlay) deleteOverlay.addEventListener('click', (e) => { if (e.target === deleteOverlay) { state.deleteConfirmId = null; render(); } });
}

/* ---------- Init ---------- */

document.querySelector('.nav-link[data-nav="home"]').classList.add('active');
loadTrips();
