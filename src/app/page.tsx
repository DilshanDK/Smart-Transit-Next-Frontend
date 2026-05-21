import ThemeToggle from "./components/theme-toggle";

export default function Home() {
  return (
    <div className="app-shell min-h-screen">
      <header className="mx-auto w-full max-w-6xl px-6 pt-6">
        <div className="surface flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="brand-dot" />
            <div>
              <p className="text-sm text-muted">TransitFlow</p>
              <h1 className="text-lg font-semibold">Admin Portal</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-outline" type="button">
              Live Map
            </button>
            <button className="btn-outline" type="button">
              Reports
            </button>
            <ThemeToggle />
            <button className="btn-primary" type="button">
              New Report
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[240px,1fr]">
        <aside className="surface flex flex-col gap-3 p-4">
          <button className="nav-item active" type="button">
            Dashboard
          </button>
          <button className="nav-item" type="button">
            Fleet Tracking
          </button>
          <button className="nav-item" type="button">
            Journeys
          </button>
          <button className="nav-item" type="button">
            Revenue
          </button>
          <button className="nav-item" type="button">
            Drivers
          </button>
          <button className="nav-item" type="button">
            Settings
          </button>
        </aside>

        <main className="flex flex-col gap-6">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="card p-4">
              <p className="text-sm text-muted">Live buses</p>
              <p className="mt-3 text-2xl font-semibold">24</p>
              <p className="mt-2 text-sm text-muted">+4 since last hour</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-muted">Journeys today</p>
              <p className="mt-3 text-2xl font-semibold">1,284</p>
              <p className="mt-2 text-sm text-muted">92% completed</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-muted">Revenue</p>
              <p className="mt-3 text-2xl font-semibold">LKR 182,400</p>
              <p className="mt-2 text-sm text-muted">+8% week over week</p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Live route map</p>
                  <h2 className="mt-2 text-lg font-semibold">Colombo - Kandy</h2>
                </div>
                <span className="badge">
                  <span className="brand-dot" />
                  Live
                </span>
              </div>
              <div className="surface-variant mt-4 flex h-56 items-center justify-center text-sm text-muted">
                Map preview (OSM)
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted">
                <span>4 buses active</span>
                <span>ETA: 12 min</span>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Recent journeys</p>
                  <h2 className="mt-2 text-lg font-semibold">Tap activity</h2>
                </div>
                <button className="btn-outline" type="button">
                  View all
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {[
                  ["Route 120", "Tap on", "LKR 0.00"],
                  ["Bus ND-2931", "Tap off", "LKR 180.00"],
                  ["Route 122", "Tap off", "LKR 140.00"],
                ].map(([route, status, amount]) => (
                  <div
                    key={`${route}-${status}`}
                    className="surface-variant flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{route}</p>
                      <p className="text-muted">{status}</p>
                    </div>
                    <span className="font-semibold">{amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Driver shift status</p>
                <h2 className="mt-2 text-lg font-semibold">Active shifts</h2>
              </div>
              <button className="btn-primary" type="button">
                Export
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["Driver 1021", "On shift", "Bus ND-2931"],
                ["Driver 1044", "On shift", "Bus ND-2945"],
                ["Driver 1078", "Break", "Bus KD-8821"],
              ].map(([driver, status, bus]) => (
                <div key={driver} className="surface-variant p-4 text-sm">
                  <p className="font-semibold">{driver}</p>
                  <p className="text-muted">{status}</p>
                  <p className="mt-2">{bus}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
