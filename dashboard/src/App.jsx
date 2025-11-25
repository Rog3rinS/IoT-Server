import { useEffect, useState } from "react";

export default function App() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchReadings() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/readings?limit=50");
      const data = await res.json();
      setReadings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReadings();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-900 p-6 text-white flex flex-col gap-6 items-center">
      <h1 className="text-4xl font-extrabold tracking-wide drop-shadow-md">IoT Dashboard</h1>

      <button
        onClick={fetchReadings}
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition font-semibold shadow-lg disabled:opacity-50"
      >
        {loading ? "Carregando..." : "Atualizar"}
      </button>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {readings.map((r) => (
          <div
            key={r.id}
            className="p-5 rounded-2xl bg-white/10 backdrop-blur-md shadow-xl border border-white/20 hover:bg-white/20 transition flex flex-col gap-2"
          >
            <h2 className="text-2xl font-bold drop-shadow">{r.sensor_type || "Desconhecido"}</h2>
            <p className="text-lg">Valor: <span className="font-semibold">{r.value}</span></p>
            <p className="text-sm opacity-80">Unidade: {r.unit || "-"}</p>
            <p className="text-xs opacity-60">{r.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
