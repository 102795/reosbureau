import { Trip, Page } from "../types";

interface HomePageProps {
  trips: Trip[];
  onNavigate: (page: Page) => void;
}

export default function HomePage({ trips, onNavigate }: HomePageProps) {
  const featured = trips.slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero */}
      <section className="relative h-screen flex items-end overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1600&h=900&fit=crop&auto=format"
          alt="Reiziger uitkijkend over een berglandschap bij zonsondergang"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#744253] via-[#744253]/50 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 w-full">
          <div className="max-w-2xl">
            <p className="text-[var(--accent)] text-sm font-medium tracking-widest uppercase mb-4">
              Studentiereizen
            </p>
            <h1 className="font-display text-6xl md:text-7xl text-white leading-[0.95] mb-6">
              De wereld<br />
              <em className="not-italic text-[var(--accent)]">wacht</em> op jou.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-xl">
              Ontdek curated reizen speciaal voor studenten. Cultuur, natuur en avontuur —
              zorgvuldig samengesteld voor onvergetelijke ervaringen.
            </p>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => onNavigate("student")}
                className="px-8 py-4 bg-[var(--accent)] text-white font-semibold rounded hover:bg-[#b06a6b] transition-colors text-sm tracking-wide"
              >
                Bekijk reizen
              </button>
              <button
                onClick={() => onNavigate("student")}
                className="px-8 py-4 border border-white/30 text-white font-semibold rounded hover:bg-white/10 transition-colors text-sm tracking-wide"
              >
                Inschrijven
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 right-0 left-0 z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-end">
              <div className="bg-white rounded-tl-xl rounded-tr-xl grid grid-cols-3 divide-x divide-[var(--border)] overflow-hidden">
                {[
                  { value: trips.length.toString(), label: "Actieve reizen" },
                  { value: trips.reduce((s, t) => s + t.enrollments.length, 0).toString(), label: "Inschrijvingen" },
                  { value: "5", label: "Bestemmingen" },
                ].map(({ value, label }) => (
                  <div key={label} className="px-8 py-5 text-center">
                    <div className="font-display text-3xl text-[var(--primary)] font-semibold">{value}</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1 uppercase tracking-wide font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured trips */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-2">Uitgelicht</p>
            <h2 className="font-display text-4xl md:text-5xl text-[var(--primary)]">
              Komende reizen
            </h2>
          </div>
          <button
            onClick={() => onNavigate("student")}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors underline underline-offset-4"
          >
            Alle reizen bekijken →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((trip) => {
            const spotsLeft = trip.maxEnrollments - trip.enrollments.length;
            const isFull = spotsLeft === 0;
            return (
              <article
                key={trip.id}
                className="group bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => onNavigate("student")}
              >
                <div className="relative h-52 overflow-hidden bg-[var(--muted)]">
                  <img
                    src={trip.imageUrl}
                    alt={trip.destination}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold text-[var(--primary)] px-3 py-1 rounded-full">
                      {trip.type}
                    </span>
                  </div>
                  {isFull && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm bg-red-600 px-4 py-2 rounded">Volzet</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-[var(--muted-foreground)] font-mono mb-2">{trip.id}</p>
                  <h3 className="font-display text-xl font-semibold text-[var(--primary)] mb-1">{trip.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mb-4 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    {trip.destination}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>{new Date(trip.startDate).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className={isFull ? "text-red-500 font-semibold" : "text-emerald-600 font-semibold"}>
                      {isFull ? "Volzet" : `${spotsLeft} plaatsen vrij`}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-[var(--primary)] text-white py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-3">Voor studenten</p>
            <h2 className="font-display text-4xl md:text-5xl mb-6 leading-tight">
              Klaar om de wereld te verkennen?
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              Log in met je studentennummer, kies een reis die je aanspreekt en schrijf je in.
              Eenvoudig, snel en overzichtelijk.
            </p>
            <button
              onClick={() => onNavigate("student")}
              className="px-8 py-4 bg-[var(--accent)] text-white font-semibold rounded hover:bg-[#b06a6b] transition-colors text-sm tracking-wide"
            >
              Naar studentenportaal
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🗺️", title: "Diverse bestemmingen", desc: "Van stedentrips tot natuurreizen" },
              { icon: "📋", title: "Eenvoudig inschrijven", desc: "In enkele stappen geregeld" },
              { icon: "👥", title: "Groepsreizen", desc: "Samen op avontuur met medestudenten" },
              { icon: "✅", title: "Uitschrijven mogelijk", desc: "Tot de sluitingsdatum" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-semibold text-sm mb-1">{title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-[var(--muted-foreground)]">
          <span className="font-display font-semibold text-[var(--primary)]">Horizon Reizen</span>
          <span>© 2026 — Alle rechten voorbehouden</span>
        </div>
      </footer>
    </div>
  );
}
