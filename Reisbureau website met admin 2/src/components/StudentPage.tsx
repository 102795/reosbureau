import { useState } from "react";
import { Trip, Enrollment } from "../types";

interface StudentPageProps {
  trips: Trip[];
  onEnroll: (reisId: string, enrollment: Enrollment) => void;
  onUnenroll: (reisId: string, studentNumber: string) => void;
}

export default function StudentPage({ trips, onEnroll, onUnenroll }: StudentPageProps) {
  const [studentNumber, setStudentNumber] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [filterType, setFilterType] = useState("Alle");
  const [enrollForm, setEnrollForm] = useState({ identityCardNumber: "", remarks: "" });
  const [enrollError, setEnrollError] = useState("");
  const [enrollSuccess, setEnrollSuccess] = useState("");
  const [tab, setTab] = useState<"all" | "mine">("all");

  const types = ["Alle", ...Array.from(new Set(trips.map((t) => t.type)))];
  const filtered = filterType === "Alle" ? trips : trips.filter((t) => t.type === filterType);
  const myEnrollments = loggedIn ? trips.filter((t) => t.enrollments.some((e) => e.studentNumber === studentNumber)) : [];

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginInput.trim()) {
      setLoginError("Voer je studentennummer in.");
      return;
    }
    setStudentNumber(loginInput.trim());
    setLoggedIn(true);
  }

  function isEnrolled(trip: Trip) {
    return trip.enrollments.some((e) => e.studentNumber === studentNumber);
  }

  function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTrip) return;
    if (!enrollForm.identityCardNumber) {
      setEnrollError("Identiteitskaartnummer is verplicht.");
      return;
    }
    onEnroll(selectedTrip.id, {
      studentNumber,
      reisId: selectedTrip.id,
      identityCardNumber: enrollForm.identityCardNumber,
      remarks: enrollForm.remarks,
    });
    setEnrollForm({ identityCardNumber: "", remarks: "" });
    setEnrollError("");
    setEnrollSuccess(`Je bent ingeschreven voor "${selectedTrip.title}".`);
    setTimeout(() => setEnrollSuccess(""), 4000);
    setSelectedTrip(null);
  }

  function handleUnenroll(reisId: string) {
    onUnenroll(reisId, studentNumber);
    setEnrollSuccess("Uitgeschreven.");
    setTimeout(() => setEnrollSuccess(""), 3000);
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[var(--primary)] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="font-display text-4xl text-[var(--primary)] mb-2">Studentenportaal</h1>
            <p className="text-[var(--muted-foreground)]">Log in met je studentennummer om reizen te bekijken en je in te schrijven.</p>
          </div>
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 shadow-sm">
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{loginError}</div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Studentennummer</label>
                <input
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="s123456"
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] font-mono"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-semibold hover:bg-[#5a3240] transition-colors"
              >
                Inloggen
              </button>
            </form>
            <p className="text-xs text-center text-[var(--muted-foreground)] mt-5">
              Je gegevens zijn al gekend in ons systeem. Je hoeft je niet te registreren.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1">Student</p>
            <h1 className="font-display text-4xl text-[var(--primary)]">Mijn reisportaal</h1>
            <p className="text-[var(--muted-foreground)] mt-1 font-mono text-sm">{studentNumber}</p>
          </div>
          <div className="flex items-center gap-4">
            {enrollSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {enrollSuccess}
              </div>
            )}
            <button
              onClick={() => { setLoggedIn(false); setLoginInput(""); setStudentNumber(""); }}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors px-3 py-2 border border-[var(--border)] rounded-lg"
            >
              Uitloggen
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[var(--secondary)] rounded-lg p-1 w-fit gap-1 mb-8">
          {[{ key: "all", label: "Alle reizen" }, { key: "mine", label: `Mijn inschrijvingen (${myEnrollments.length})` }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as "all" | "mine")}
              className={`px-5 py-2 text-sm font-medium rounded transition-colors ${
                tab === key
                  ? "bg-white text-[var(--primary)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* All trips */}
        {tab === "all" && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                    filterType === type
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((trip) => {
                const enrolled = isEnrolled(trip);
                const spotsLeft = trip.maxEnrollments - trip.enrollments.length;
                const isFull = spotsLeft === 0;
                return (
                  <article key={trip.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 group">
                    <div className="relative h-48 bg-[var(--muted)] overflow-hidden">
                      <img
                        src={trip.imageUrl}
                        alt={trip.destination}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold text-[var(--primary)] px-3 py-1 rounded-full">{trip.type}</span>
                        {enrolled && (
                          <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Ingeschreven</span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="font-mono text-xs text-[var(--muted-foreground)] mb-1">{trip.id}</p>
                      <h3 className="font-display text-xl font-semibold text-[var(--primary)] mb-1">{trip.title}</h3>
                      <p className="text-sm text-[var(--muted-foreground)] mb-3 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        {trip.destination}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-4 line-clamp-2">{trip.description}</p>
                      <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mb-4">
                        <span>{new Date(trip.startDate).toLocaleDateString("nl-BE", { day: "numeric", month: "short" })} – {new Date(trip.endDate).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span className="ml-auto font-semibold" style={{ color: isFull ? "#C78283" : "#744253" }}>
                          {isFull ? "Volzet" : `${spotsLeft} vrije plaatsen`}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedTrip(trip)}
                        disabled={isFull && !enrolled}
                        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                          enrolled
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : isFull
                            ? "bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-not-allowed"
                            : "bg-[var(--accent)] text-white hover:bg-[#b06a6b]"
                        }`}
                      >
                        {enrolled ? "Bekijken / Uitschrijven" : isFull ? "Volzet" : "Inschrijven"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {/* My enrollments */}
        {tab === "mine" && (
          <div>
            {myEnrollments.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[var(--secondary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl text-[var(--primary)] mb-2">Nog geen inschrijvingen</h3>
                <p className="text-[var(--muted-foreground)] mb-6">Bekijk de beschikbare reizen en schrijf je in.</p>
                <button onClick={() => setTab("all")} className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-semibold text-sm hover:bg-[#5a3240] transition-colors">
                  Bekijk reizen
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myEnrollments.map((trip) => {
                  const enrollment = trip.enrollments.find((e) => e.studentNumber === studentNumber)!;
                  return (
                    <div key={trip.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden flex gap-0">
                      <div className="w-32 shrink-0 bg-[var(--muted)] overflow-hidden">
                        <img src={trip.imageUrl} alt={trip.destination} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 p-5 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-[var(--muted-foreground)]">{trip.id}</span>
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">Ingeschreven</span>
                          </div>
                          <h3 className="font-display text-lg font-semibold text-[var(--primary)]">{trip.title}</h3>
                          <p className="text-sm text-[var(--muted-foreground)] mb-2">{trip.destination}</p>
                          <div className="flex gap-6 text-xs text-[var(--muted-foreground)]">
                            <span>{new Date(trip.startDate).toLocaleDateString("nl-BE")} → {new Date(trip.endDate).toLocaleDateString("nl-BE")}</span>
                            <span>ID: <span className="font-mono font-medium">{enrollment.identityCardNumber}</span></span>
                            {enrollment.remarks && <span className="italic">"{enrollment.remarks}"</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnenroll(trip.id)}
                          className="shrink-0 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                        >
                          Uitschrijven
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enroll / detail modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="relative h-52 bg-[var(--muted)] overflow-hidden rounded-t-2xl">
              <img src={selectedTrip.imageUrl} alt={selectedTrip.destination} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={() => { setSelectedTrip(null); setEnrollForm({ identityCardNumber: "", remarks: "" }); setEnrollError(""); }}
                className="absolute top-4 right-4 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-5">
                <p className="text-white/70 text-xs font-mono">{selectedTrip.id}</p>
                <h2 className="font-display text-2xl text-white font-semibold">{selectedTrip.title}</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                <div className="bg-[var(--secondary)] rounded-lg p-3">
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">Bestemming</p>
                  <p className="font-medium text-[var(--primary)]">{selectedTrip.destination}</p>
                </div>
                <div className="bg-[var(--secondary)] rounded-lg p-3">
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">Type</p>
                  <p className="font-medium text-[var(--primary)]">{selectedTrip.type}</p>
                </div>
                <div className="bg-[var(--secondary)] rounded-lg p-3">
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">Periode</p>
                  <p className="font-medium text-[var(--primary)] text-xs">{new Date(selectedTrip.startDate).toLocaleDateString("nl-BE")} → {new Date(selectedTrip.endDate).toLocaleDateString("nl-BE")}</p>
                </div>
                <div className="bg-[var(--secondary)] rounded-lg p-3">
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">Plaatsen</p>
                  <p className="font-medium" style={{ color: selectedTrip.enrollments.length >= selectedTrip.maxEnrollments ? "#C78283" : "#744253" }}>
                    {selectedTrip.enrollments.length}/{selectedTrip.maxEnrollments}
                  </p>
                </div>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6">{selectedTrip.description}</p>

              {isEnrolled(selectedTrip) ? (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                    <p className="text-emerald-700 font-semibold text-sm">Je bent ingeschreven voor deze reis.</p>
                  </div>
                  <button
                    onClick={() => { handleUnenroll(selectedTrip.id); setSelectedTrip(null); }}
                    className="w-full py-3 border border-red-200 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors"
                  >
                    Uitschrijven
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnroll} className="space-y-4">
                  <h3 className="font-semibold text-[var(--primary)] text-sm uppercase tracking-wide">Inschrijvingsformulier</h3>
                  {enrollError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{enrollError}</div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Studentennummer</label>
                    <input value={studentNumber} disabled className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--secondary)] text-[var(--muted-foreground)] font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Identiteitskaartnummer *</label>
                    <input
                      value={enrollForm.identityCardNumber}
                      onChange={(e) => setEnrollForm({ ...enrollForm, identityCardNumber: e.target.value })}
                      placeholder="BE123456"
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                      Opmerkingen <span className="normal-case font-normal text-[var(--muted-foreground)]">(dieet, lichamelijke klachten…)</span>
                    </label>
                    <textarea
                      value={enrollForm.remarks}
                      onChange={(e) => setEnrollForm({ ...enrollForm, remarks: e.target.value })}
                      rows={3}
                      placeholder="Optionele opmerkingen voor de begeleider…"
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setSelectedTrip(null)} className="flex-1 py-3 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors">
                      Annuleren
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:bg-[#b06a6b] transition-colors">
                      Inschrijven
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
