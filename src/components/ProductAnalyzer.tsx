import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Search, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ScoreCircle } from "./ScoreCircle";
import { ProductCard } from "./ProductCard";

interface AnalysisResult {
  url: string;
  meta: {
    title: string;
    image?: string;
    description?: string;
    price?: number;
    currency?: string;
    rating?: number;
  };
  ai: {
    score: number;
    short_review: string;
    pros: string[];
    cons: string[];
    sentiment_score: number;
  };
}

export const ProductAnalyzer = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error("Please enter a product URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (response.status === 402) {
          toast.error("AI credits exhausted. Please contact support.");
        } else {
          toast.error(errorData.error || "Failed to analyze product");
        }
        return;
      }

      const data = await response.json();
      setResult(data);
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Failed to analyze product. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-block">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Product AI Score
            </h1>
            <div className="h-1 bg-gradient-primary rounded-full mt-2"></div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get instant AI-powered insights on any product. Just paste the URL and let our AI analyze it.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="p-6 bg-gradient-card backdrop-blur-sm border-border/50 shadow-card animate-slide-up">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="url"
              placeholder="Paste product URL (Amazon, Flipkart, etc.)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              className="flex-1 bg-background/50 border-border/50 focus:border-primary text-lg h-14"
              disabled={loading}
            />
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow h-14 px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-scale-in">
            {/* Score Section */}
            <Card className="p-8 bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <ScoreCircle score={result.ai.score} />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">AI Analysis</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {result.ai.short_review}
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-success">
                        <TrendingUp className="h-5 w-5" />
                        <h4 className="font-semibold">Pros</h4>
                      </div>
                      <ul className="space-y-1">
                        {result.ai.pros.map((pro, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-success mt-1">•</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-destructive">
                        <TrendingDown className="h-5 w-5" />
                        <h4 className="font-semibold">Cons</h4>
                      </div>
                      <ul className="space-y-1">
                        {result.ai.cons.map((con, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-destructive mt-1">•</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Product Card */}
            <ProductCard product={result.meta} />

            {/* Info Banner */}
            <Card className="p-4 bg-secondary/50 border-accent/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  This analysis is AI-generated and cached for 24 hours. Scores are based on multiple factors including ratings, reviews, price fairness, and product quality indicators.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
