interface MiniScoreCardProps {
  label: string;
  score: number;
}

export const MiniScoreCard = ({ label, score }: MiniScoreCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-card/50 rounded-lg border border-border/50">
      <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
        {score}
      </div>
      <div className="text-xs text-muted-foreground text-center">{label}</div>
    </div>
  );
};
