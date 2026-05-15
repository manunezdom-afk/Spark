import type { ReactNode } from "react";

/**
 * Header unificado para todas las páginas internas.
 * Garantiza un mismo h1 (peso, tamaño, tracking, color) y subtítulo
 * en cualquier sección, evitando que cada página invente el suyo.
 *
 * Uso:
 *   <PageHeader title="Temas" description="..." action={<NewTopicDialog />} />
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between flex-wrap gap-4 mb-10">
      <div className="flex flex-col gap-2 min-w-0">
        <h1 className="text-3xl md:text-[40px] font-medium tracking-tight text-ink leading-[1.1]">
          {title}
        </h1>
        {description && (
          <p className="text-[14.5px] text-ink-secondary leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
