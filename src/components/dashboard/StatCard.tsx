import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  delay?: number;
}

export const StatCard = ({ label, value, change, positive, delay = 0 }: StatCardProps) => (
  <Card 
    className="glass-card animate-slide-up hover:border-primary/30 transition-all duration-300"
    style={{ animationDelay: `${delay}ms` }}
  >
    <CardContent className="p-5">
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <div className={`flex items-center gap-1 text-sm font-medium ${positive ? 'text-chart-3' : 'text-destructive'}`}>
          {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{change}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);
