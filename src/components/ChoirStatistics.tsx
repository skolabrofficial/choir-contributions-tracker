import { Users, Wallet, TrendingUp, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChoirStats } from "@/hooks/useChoirStats";
import { getCurrentSchoolYear } from "@/lib/schoolYearUtils";

export function ChoirStatistics() {
  const { data: stats, isLoading } = useChoirStats();

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Načítám statistiky...
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', { 
      style: 'currency', 
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-base sm:text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Statistiky sboru • {getCurrentSchoolYear()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Celkem vybráno</span>
            <span className="font-bold text-success">
              {formatCurrency(stats.totalCollected)} z {formatCurrency(stats.totalExpected)}
            </span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full gradient-success rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${Math.min(100, stats.percentCollected)}%` }}
            >
              {stats.percentCollected >= 15 && (
                <span className="text-[10px] font-bold text-success-foreground">
                  {stats.percentCollected.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Zbývá vybrat: <strong className="text-foreground">{formatCurrency(stats.totalRemaining)}</strong></span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-lg sm:text-xl font-bold">{stats.totalMembers}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Členů celkem</div>
          </div>
          
          <div className="p-3 rounded-lg bg-success/10 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
            <div className="text-lg sm:text-xl font-bold text-success">{stats.fullyPaidMembers}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Celý rok</div>
          </div>
          
          <div className="p-3 rounded-lg bg-warning/10 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
            <div className="text-lg sm:text-xl font-bold text-warning">{stats.partiallyPaidMembers}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Částečně</div>
          </div>
          
          <div className="p-3 rounded-lg bg-destructive/10 text-center">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <div className="text-lg sm:text-xl font-bold text-destructive">{stats.unpaidMembers}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Nezaplatili</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
