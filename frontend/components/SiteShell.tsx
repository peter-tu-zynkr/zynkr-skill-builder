import Link from "next/link";
import { ReactNode } from "react";

type Breadcrumb = {
  label: string;
  href?: string;
};

export function SiteShell({
  children,
  breadcrumbs = [],
}: {
  children: ReactNode;
  breadcrumbs?: Breadcrumb[];
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {breadcrumbs.length > 0 && (
        <div className="bg-white border-b border-zinc-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              ⚡ Zynkr
            </Link>
            {breadcrumbs.map((item, index) => (
              <BreadcrumbItem
                key={`${item.label}-${index}`}
                item={item}
                isLast={index === breadcrumbs.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 text-xs text-zinc-400 flex items-center justify-between gap-3 flex-wrap">
          <span>Zynkr AI Skill Directory</span>
          <span>Git-managed content, generated frontend data</span>
        </div>
      </footer>
    </div>
  );
}

function BreadcrumbItem({
  item,
  isLast,
}: {
  item: Breadcrumb;
  isLast: boolean;
}) {
  return (
    <>
      <span>/</span>
      {item.href && !isLast ? (
        <Link href={item.href} className="hover:text-zinc-900 transition-colors">
          {item.label}
        </Link>
      ) : (
        <span className="text-zinc-900 font-medium truncate">{item.label}</span>
      )}
    </>
  );
}
