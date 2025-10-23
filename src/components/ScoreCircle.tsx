import { useEffect, useState } from "react";

interface ScoreCircleProps {
  score: number;
}

export const ScoreCircle = ({ score }: ScoreCircleProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = score / 50;
      const interval = setInterval(() => {
        current += increment;
        if (current >= score) {
          setDisplayScore(score);
          clearInterval(interval);
        } else {
          setDisplayScore(Math.floor(current));
        }
      }, 20);
      return () => clearInterval(interval);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "hsl(142, 76%, 36%)";
    if (score >= 60) return "hsl(38, 92%, 50%)";
    return "hsl(0, 84%, 60%)";
  };

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="relative w-48 h-48">
      <svg className="transform -rotate-90 w-48 h-48">
        {/* Background circle */}
        <circle
          cx="96"
          cy="96"
          r="80"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          fill="none"
          className="opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx="96"
          cy="96"
          r="80"
          stroke={getScoreColor(score)}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-6xl font-bold" style={{ color: getScoreColor(score) }}>
          {displayScore}
        </div>
        <div className="text-sm text-muted-foreground mt-1">/ 100</div>
      </div>
    </div>
  );
};
