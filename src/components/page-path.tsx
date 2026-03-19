import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PagePathItem {
  label: string;
  href?: string;
}

interface PagePathProps {
  items: PagePathItem[];
  className?: string;
}

export function PagePath({ items, className }: PagePathProps) {
  return (
    <nav aria-label="Page path" className={["ui-path", className].filter(Boolean).join(" ")}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={`${item.label}-${index}`} className="ui-path-item">
            {item.href && !isLast ? (
              <Link href={item.href} className="ui-path-link">
                {item.label}
              </Link>
            ) : (
              <span className="ui-path-current">{item.label}</span>
            )}
            {!isLast ? <ChevronRight className="size-3.5 text-[color:var(--muted)]" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
