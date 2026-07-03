export default function MessageInput() {
  return (
    <div className="border-t border-white/10 bg-white/5 p-6 backdrop-blur-xl">

      <div className="mx-auto flex max-w-5xl gap-4">

        <input
          type="text"
          placeholder="Message sid.ai..."
          className="flex-1 rounded-xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
        />

        <button className="rounded-xl bg-blue-600 px-8 text-white transition hover:bg-blue-700">

          Send

        </button>

      </div>

    </div>
  );
}