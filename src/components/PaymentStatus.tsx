import { useState } from "react";
import { Check, X, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Member } from "@/hooks/useMembers";
import { usePayments, useSurplus, useDeletePayment, Payment } from "@/hooks/usePayments";
import { getPaymentLabel } from "@/lib/genderUtils";
import { 
  getMonthNameShort, 
  getMonthName,
  getSchoolYearMonthsOrdered, 
  getCurrentSchoolYear,
  getTotalYearlyFee,
  MONTHLY_FEE
} from "@/lib/schoolYearUtils";

interface PaymentStatusProps {
  member: Member;
}

export function PaymentStatus({ member }: PaymentStatusProps) {
  const { data: payments = [], isLoading } = usePayments(member.id);
  const { data: surplus = [] } = useSurplus(member.id);
  const deletePayment = useDeletePayment();
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  
  const schoolYearMonths = getSchoolYearMonthsOrdered();
  const paidMonths = new Set(payments.map(p => p.month));
  const paidCount = paidMonths.size;
  const totalMonths = schoolYearMonths.length;
  const totalPaid = paidCount * MONTHLY_FEE;
  const totalSurplus = surplus.reduce((acc, s) => acc + s.amount, 0);
  
  const isPaidAll = paidCount === totalMonths;
  const progressPercent = (paidCount / totalMonths) * 100;

  const handleUndoPayment = async () => {
    if (paymentToDelete) {
      await deletePayment.mutateAsync(paymentToDelete.id);
      setPaymentToDelete(null);
    }
  };

  const getPaymentForMonth = (month: number) => {
    return payments.find(p => p.month === month);
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Načítám platby...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-card animate-fade-in">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg sm:text-xl flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <span className="truncate">
              {getPaymentLabel(member.gender as 'male' | 'female')}{" "}
              <span className="text-primary">{member.first_name} {member.last_name}</span>
            </span>
            {isPaidAll ? (
              <Badge className="bg-success text-success-foreground w-fit">
                Celý rok zaplacen
              </Badge>
            ) : (
              <Badge variant="outline" className="w-fit">
                {paidCount}/{totalMonths} měsíců
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Zaplaceno</span>
              <span className="font-medium">{totalPaid} Kč z {getTotalYearlyFee()} Kč</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full gradient-success rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Month grid - responsive */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Školní rok {getCurrentSchoolYear()}
            </h4>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
              {schoolYearMonths.map((month) => {
                const isPaid = paidMonths.has(month);
                const payment = getPaymentForMonth(month);
                return (
                  <div
                    key={month}
                    className={`
                      relative group flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-all
                      ${isPaid 
                        ? 'bg-success/10 border-success/30 text-success' 
                        : 'bg-card border-border text-muted-foreground'
                      }
                    `}
                  >
                    <span className="text-[10px] sm:text-xs font-medium">{getMonthNameShort(month)}</span>
                    <span className="mt-0.5 sm:mt-1">
                      {isPaid ? (
                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <X className="h-3 w-3 sm:h-4 sm:w-4 opacity-40" />
                      )}
                    </span>
                    {isPaid && payment && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setPaymentToDelete(payment)}
                      >
                        <Undo2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Najeďte myší na zaplacený měsíc pro možnost zrušení platby
            </p>
          </div>

          {/* Surplus info */}
          {totalSurplus > 0 && (
            <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Přebytek</span>
                <span className="font-bold text-primary">{totalSurplus} Kč</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Bude použit v dalším školním roce
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zrušit platbu?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete zrušit platbu za {paymentToDelete ? getMonthName(paymentToDelete.month).toLowerCase() : ''}?
              Tato akce se nedá vrátit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ne, ponechat</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUndoPayment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ano, zrušit platbu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
