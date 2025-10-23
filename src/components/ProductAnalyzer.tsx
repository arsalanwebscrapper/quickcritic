import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScoreCircle } from "./ScoreCircle";
import { MiniScoreCard } from "./MiniScoreCard";
import { StoreLink } from "./StoreLink";

interface AnalysisResult {
  url: string;
  meta: {
    title: string | null;
    image: string | null;
    description: string | null;
    price: number | null;
    currency: string | null;
    rating: number | null;
  };
  ai: {
    score: number;
    short_review: string;
    pros: string[];
    cons: string[];
    sentiment_score: number;
    category?: string;
    category_scores?: { label: string; score: number }[];
    stores?: { name: string; url: string; price?: string }[];
    reviews_summary?: string;
    sources_count?: number;
  };
}

export const ProductAnalyzer = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        "analyze-product",
        {
          body: { url: url.trim() },
        }
      );

      if (functionError) {
        console.error("Function error:", functionError);
        toast({
          title: "Error",
          description: functionError.message || "Failed to analyze product",
          variant: "destructive",
        });
        return;
      }

      if (!functionData || !functionData.ai) {
        toast({
          title: "Error",
          description: "No analysis data received. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setResult(functionData);
      toast({
        title: "Success",
        description: "Product analyzed successfully!",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            QuickCritic
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            AI-Powered Product Analysis
          </p>
        </div>

        <Card className="p-4 md:p-6 bg-gradient-card backdrop-blur-sm border-border/50 shadow-card animate-slide-up">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Enter product URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
              className="flex-1 bg-background/50"
            />
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 w-full md:w-auto"
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </Card>

        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Product Image */}
            {result.meta.image && (
              <div className="w-full max-w-md mx-auto">
                <img
                  src={result.meta.image}
                  alt={result.meta.title || "Product"}
                  className="w-full h-auto rounded-lg border border-border/50 shadow-card"
                />
              </div>
            )}

            {/* Product Name */}
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                {result.meta.title || "Product"}
              </h2>
              {result.meta.description && (
                <p className="text-muted-foreground text-sm md:text-base mt-2">
                  {result.meta.description}
                </p>
              )}
            </div>

            {/* Available Stores */}
            {result.ai.stores && result.ai.stores.length > 0 && (
              <Card className="p-4 md:p-6 bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
                <h3 className="text-lg font-semibold mb-4 text-primary">Available On:</h3>
                <div className="space-y-2">
                  {result.ai.stores.map((store, idx) => (
                    <StoreLink
                      key={idx}
                      name={store.name}
                      url={store.url}
                      price={store.price}
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* AI Score */}
            <div className="flex justify-center">
              <ScoreCircle score={result.ai.score} />
            </div>

            {/* Category-specific Scores */}
            {result.ai.category_scores && result.ai.category_scores.length > 0 && (
              <Card className="p-4 md:p-6 bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
                <h3 className="text-lg font-semibold mb-4 text-primary text-center">
                  Score Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {result.ai.category_scores.map((item, idx) => (
                    <MiniScoreCard key={idx} label={item.label} score={item.score} />
                  ))}
                </div>
              </Card>
            )}

            {/* AI Summary */}
            <Card className="p-4 md:p-6 bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
              <h3 className="text-lg font-semibold mb-4 text-primary">AI Summary</h3>
              <p className="text-foreground text-sm md:text-base leading-relaxed mb-4">
                {result.ai.short_review}
              </p>

              {result.ai.reviews_summary && (
                <>
                  <div className="border-t border-border/50 my-4" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {result.ai.sources_count && (
                        <span>Sources Analysed ({result.ai.sources_count})</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                      {result.ai.reviews_summary}
                    </p>
                  </div>
                </>
              )}
            </Card>

            {/* Pros and Cons */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 md:p-6 bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
                <h3 className="text-lg font-semibold mb-4 text-success">
                  Key Strengths ({result.ai.pros.length})
                </h3>
                <ul className="space-y-2">
                  {result.ai.pros.map((pro, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-success mt-1">✓</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-4 md:p-6 bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
                <h3 className="text-lg font-semibold mb-4 text-destructive">
                  Key Limitations ({result.ai.cons.length})
                </h3>
                <ul className="space-y-2">
                  {result.ai.cons.map((con, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-destructive mt-1">✗</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
