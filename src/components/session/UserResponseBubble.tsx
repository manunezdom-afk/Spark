export function UserResponseBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}
