import { useState } from "react";
import { Trip, Enrollment } from "../types";

interface AdminPageProps {
  trips: Trip[];
  onAddTrip: (trip: Trip) => void;
  onUpdateTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;
}

const emptyForm = {
  id: "",
  title: "",
  destination: "",
  description: "",
  type: "Cultuurtrip",
  startDate: "",
  endDate: "",
  maxEnrollments: 20,
  imageUrl: "",
};

type AdminView = "trips" | "enrollments";

export default function AdminPage({ trips, onAddTrip, onUpdateTrip, onDeleteTrip }: AdminPageProps) {
  const [view, setView] = useState<AdminView>("trips");
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const selectedTrip = trips.find((t) => t.id === selectedTripId) ?? null;
  const allEnrollments: Array<Enrollment & { tripTitle: string }> = trips.flatMap((t) =>
    t.enrollments.map((e) => ({ ...e, tripTitle: t.title }))
  );

  function openAdd() {
    setEditingTrip(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(trip: Trip) {
    setEditingTrip(trip);
    setForm({
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      description: trip.description,
      type: trip.type,
      startDate: trip.startDate,
      endDate: trip.endDate,
      maxEnrollments: trip.maxEnrollments,
      imageUrl: trip.imageUrl,
    });
    setFormError("");
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id || !form.title || !form.destination || !form.startDate || !form.endDate) {
      setFormError("Vul alle verplichte velden in.");
      return;
    }
    if (!editingTrip && trips.find((t) => t.id === form.id)) {
      setFormError("Reis-ID bestaat al.");
      return;
    }
    const tripData: Trip = {
      ...form,
      maxEnrollments: Number(form.maxEnrollments),
      enrollments: editingTrip ? editingTrip.enrollments : [],
    };
    if (editingTrip) {
      onUpdateTrip(tripData);
    } else {
      onAddTrip(tripData);
    }
    setShowForm(false);
  }

  function confirmDelete(id: string) {
    setDeleteConfirm(id);
  }

  function doDelete() {
    if (deleteConfirm) {
      onDeleteTrip(deleteConfirm);
      if (selectedTripId === deleteConfirm) setSelectedTripId(null);
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1">Beheer</p>
            <h1 className="font-display text-4xl text-[var(--primary)]">Administratie</h1>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-[var(--secondary)] rounded-lg p-1 gap-1">
              {(["trips", "enrollments"] as AdminView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    view === v
                      ? "bg-white text-[var(--primary)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                  }`}
                >
                  {v === "trips" ? "Reizen" : "Inschrijvingen"}
                </button>
              ))}
            </div>
            {view === "trips" && (
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:bg-[#b06a6b] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nieuwe reis
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Totaal reizen", value: trips.length },
            { label: "Totaal inschrijvingen", value: allEnrollments.length },
            { label: "Volzet reizen", value: trips.filter((t) => t.enrollments.length >= t.maxEnrollments).length },
            { label: "Beschikbare plaatsen", value: trips.reduce((s, t) => s + Math.max(0, t.maxEnrollments - t.enrollments.length), 0) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)]">
              <div className="font-display text-3xl text-[var(--primary)] font-semibold">{value}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* Trips view */}
        {view === "trips" && (
          <div className="flex gap-6">
            {/* Trip list */}
            <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="font-semibold text-[var(--primary)]">Alle reizen</h2>
                <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-1 rounded-full">{trips.length} reizen</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {trips.map((trip) => {
                  const spotsLeft = trip.maxEnrollments - trip.enrollments.length;
                  const pct = Math.round((trip.enrollments.length / trip.maxEnrollments) * 100);
                  const isSelected = selectedTripId === trip.id;
                  return (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedTripId(isSelected ? null : trip.id)}
                      className={`px-6 py-4 cursor-pointer transition-colors ${
                        isSelected ? "bg-[var(--secondary)]" : "hover:bg-[var(--background)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-[var(--muted-foreground)]">{trip.id}</span>
                            <span className="text-xs bg-[var(--secondary)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full">{trip.type}</span>
                          </div>
                          <p className="font-semibold text-[var(--primary)] truncate">{trip.title}</p>
                          <p className="text-sm text-[var(--muted-foreground)]">{trip.destination}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${spotsLeft === 0 ? "bg-[#C78283]" : "bg-[#744253]"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                              {trip.enrollments.length}/{trip.maxEnrollments}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(trip); }}
                            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors"
                            title="Aanpassen"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmDelete(trip.id); }}
                            className="p-2 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Verwijderen"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {trips.length === 0 && (
                  <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    <p className="font-display text-lg">Nog geen reizen</p>
                    <p className="text-sm mt-1">Voeg een eerste reis toe om te beginnen.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Trip detail / enrollments */}
            {selectedTrip && (
              <div className="w-80 shrink-0 bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="h-36 overflow-hidden bg-[var(--muted)]">
                  <img src={selectedTrip.imageUrl} alt={selectedTrip.destination} className="w-full h-full object-cover" />
                </div>
                <div className="p-5">
                  <p className="font-mono text-xs text-[var(--muted-foreground)] mb-1">{selectedTrip.id}</p>
                  <h3 className="font-display text-lg font-semibold text-[var(--primary)] mb-1">{selectedTrip.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mb-3">{selectedTrip.destination}</p>
                  <div className="text-xs text-[var(--muted-foreground)] space-y-1 mb-4 border-t border-[var(--border)] pt-3">
                    <div className="flex justify-between"><span>Begin</span><span className="font-medium text-[var(--foreground)]">{new Date(selectedTrip.startDate).toLocaleDateString("nl-BE")}</span></div>
                    <div className="flex justify-between"><span>Einde</span><span className="font-medium text-[var(--foreground)]">{new Date(selectedTrip.endDate).toLocaleDateString("nl-BE")}</span></div>
                    <div className="flex justify-between"><span>Max. inschrijvingen</span><span className="font-medium text-[var(--foreground)]">{selectedTrip.maxEnrollments}</span></div>
                    <div className="flex justify-between"><span>Ingeschreven</span><span className="font-semibold text-[var(--accent)]">{selectedTrip.enrollments.length}</span></div>
                  </div>

                  <h4 className="font-semibold text-sm text-[var(--primary)] mb-2">Inschrijvingen</h4>
                  {selectedTrip.enrollments.length === 0 ? (
                    <p className="text-xs text-[var(--muted-foreground)] italic">Nog geen inschrijvingen.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedTrip.enrollments.map((e, i) => (
                        <div key={i} className="bg-[var(--secondary)] rounded-lg p-3 text-xs">
                          <div className="font-semibold text-[var(--primary)]">{e.studentNumber}</div>
                          <div className="text-[var(--muted-foreground)]">ID: {e.identityCardNumber}</div>
                          {e.remarks && <div className="text-[var(--muted-foreground)] italic mt-1">"{e.remarks}"</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enrollments view */}
        {view === "enrollments" && (
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--primary)]">Alle inschrijvingen</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--secondary)]">
                    {["Studentnummer", "Reis", "Reis-ID", "Identiteitsnr.", "Opmerkingen"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {allEnrollments.map((e, i) => (
                    <tr key={i} className="hover:bg-[var(--background)] transition-colors">
                      <td className="px-6 py-4 font-mono text-[var(--primary)] font-semibold">{e.studentNumber}</td>
                      <td className="px-6 py-4 text-[var(--foreground)]">{e.tripTitle}</td>
                      <td className="px-6 py-4 font-mono text-xs text-[var(--muted-foreground)]">{e.reisId}</td>
                      <td className="px-6 py-4 font-mono text-xs text-[var(--muted-foreground)]">{e.identityCardNumber}</td>
                      <td className="px-6 py-4 text-[var(--muted-foreground)] italic text-xs">{e.remarks || "—"}</td>
                    </tr>
                  ))}
                  {allEnrollments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                        Nog geen inschrijvingen.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-6 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-display text-2xl text-[var(--primary)]">
                {editingTrip ? "Reis aanpassen" : "Nieuwe reis"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Reis-ID *</label>
                  <input
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    disabled={!!editingTrip}
                    placeholder="REIS-006"
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:bg-[var(--secondary)] disabled:text-[var(--muted-foreground)] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] bg-white"
                  >
                    {["Cultuurtrip", "Stedentrip", "Natuurtrip", "Avontuurtrip", "Studiereis"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Titel *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Rome & The Eternal City"
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Bestemming *</label>
                <input
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="Rome, Italië"
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Omschrijving</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Begindatum *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Einddatum *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Max. inschrijvingen</label>
                <input
                  type="number"
                  min={1}
                  value={form.maxEnrollments}
                  onChange={(e) => setForm({ ...form, maxEnrollments: parseInt(e.target.value) || 0 })}
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Afbeelding URL</label>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:bg-[#b06a6b] transition-colors"
                >
                  {editingTrip ? "Opslaan" : "Reis toevoegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-semibold text-[var(--primary)] mb-2">Reis verwijderen?</h3>
            <p className="text-[var(--muted-foreground)] text-sm mb-6">
              Dit verwijdert ook alle inschrijvingen voor deze reis. Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors">
                Annuleren
              </button>
              <button onClick={doDelete} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
