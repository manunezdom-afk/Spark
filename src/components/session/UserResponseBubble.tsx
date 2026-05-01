export function UserResponseBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-spark/[0.06] border border-spark/15 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
        {text}
      </div>
    </div>
  );
}
