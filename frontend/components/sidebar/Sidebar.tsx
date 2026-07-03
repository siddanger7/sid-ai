export default function Sidebar() {
  return (
    <aside className="w-72 border-r border-white/10 bg-white/5 backdrop-blur-xl">

      <div className="p-6">

        <button className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700">

          + New Chat

        </button>

      </div>

      <div className="px-5">

        <h3 className="mb-3 text-xs uppercase tracking-widest text-gray-400">
          Recent
        </h3>

        <button className="mb-2 w-full rounded-xl bg-white/5 p-4 text-left text-white transition hover:bg-white/10">

          👋 Welcome Chat

        </button>

      </div>

    </aside>
  );
}