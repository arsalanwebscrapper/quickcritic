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
    if (score >= 80) return "from-[hsl(142,76%,36%)] to-[hsl(158,64%,52%)]";
    if (score >= 60) return "from-[hsl(38,92%,50%)] to-[hsl(48,96%,53%)]";
    return "from-[hsl(0,84%,60%)] to-[hsl(15,87%,67%)]";
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
          stroke="url(#scoreGradient)"
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className={`stop-color-[${getScoreColor(score).split(' ')[0].replace('from-', '')}]`} />
            <stop offset="100%" className={`stop-color-[${getScoreColor(score).split(' ')[1].replace('to-', '')}]`} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-6xl font-bold bg-gradient-to-br ${getScoreColor(score)} bg-clip-text text-transparent`}>
          {displayScore}
        </div>
        <div className="text-sm text-muted-foreground mt-1">AI Score</div>
      </div>
    </div>
  );
};
