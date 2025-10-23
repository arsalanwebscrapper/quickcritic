import { ExternalLink } from "lucide-react";

interface StoreLinkProps {
  name: string;
  url: string;
  price?: string;
}

export const StoreLink = ({ name, url, price }: StoreLinkProps) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-primary/50 transition-all"
    >
      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">{name}</span>
        {price && <span className="text-xs text-primary">{price}</span>}
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </a>
  );
};
