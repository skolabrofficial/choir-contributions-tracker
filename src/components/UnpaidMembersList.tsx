import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUnpaidMembers } from "@/hooks/usePayments";
import { getMonthName, getCurrentMonth, SCHOOL_YEAR_MONTHS } from "@/lib/schoolYearUtils";

interface UnpaidMembersListProps {
  onSelectMember: (memberId: string) => void;
}

export function UnpaidMembersList({ onSelectMember }: UnpaidMembersListProps) {
  const { data: unpaidMembers = [], isLoading } = useUnpaidMembers();
  const currentMonth = getCurrentMonth();
  const isSchoolMonth = SCHOOL_YEAR_MONTHS.includes(currentMonth);

  if (!isSchoolMonth) {
    return (
      <Card className="shadow-card animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-display">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            Prázdniny
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            V {getMonthName(currentMonth).toLowerCase()}u se příspěvky neplatí.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Načítám...
        </CardContent>
      </Card>
    );
  }

  if (unpaidMembers.length === 0) {
    return (
      <Card className="shadow-card border-success/30 bg-success/5 animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-display text-success">
            ✓ Všichni zaplatili
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Všichni členové mají zaplaceno za {getMonthName(currentMonth).toLowerCase()}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-warning/30 bg-warning/5 animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg font-display">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Nezaplaceno za {getMonthName(currentMonth).toLowerCase()}
          </span>
          <Badge variant="secondary" className="w-fit sm:ml-auto">
            {unpaidMembers.length} {unpaidMembers.length === 1 ? 'osoba' : unpaidMembers.length < 5 ? 'osoby' : 'osob'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {unpaidMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelectMember(member.id)}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-card hover:bg-accent text-xs sm:text-sm font-medium transition-colors shadow-sm hover:shadow-md active:scale-95"
            >
              {member.first_name} {member.last_name}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
