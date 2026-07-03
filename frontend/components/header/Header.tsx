export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-8 py-5 backdrop-blur-xl">

      <div>

        <h1 className="text-2xl font-bold">

          sid.ai

        </h1>

        <p className="text-sm text-gray-400">

          Your Personal AI Assistant

        </p>

      </div>

      <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-white transition hover:bg-white/10">

        Settings

      </button>

    </header>
  );
}