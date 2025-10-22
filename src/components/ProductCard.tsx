import { Card } from "@/components/ui/card";
import { Star, DollarSign } from "lucide-react";

interface ProductCardProps {
  product: {
    title: string;
    image?: string;
    description?: string;
    price?: number;
    currency?: string;
    rating?: number;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Card className="p-6 bg-gradient-card backdrop-blur-sm border-border/50 shadow-card overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6">
        {product.image && (
          <div className="flex-shrink-0">
            <img
              src={product.image}
              alt={product.title}
              className="w-full md:w-48 h-48 object-cover rounded-lg border border-border/50"
            />
          </div>
        )}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {product.price && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">
                  {product.currency} {product.price.toLocaleString()}
                </span>
              </div>
            )}
            {product.rating && (
              <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 rounded-lg border border-warning/20">
                <Star className="h-5 w-5 text-warning fill-warning" />
                <span className="font-semibold text-lg">{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
