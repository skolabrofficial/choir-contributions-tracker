import { useState } from "react";
import { CreditCard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Member } from "@/hooks/useMembers";
import { usePayments, usePaySingleMonth, useCreatePayment } from "@/hooks/usePayments";
import { getMemberLabelGenitive } from "@/lib/genderUtils";
import { 
  getMonthName, 
  getCurrentMonth, 
  getSchoolYearMonthsOrdered,
  SCHOOL_YEAR_MONTHS
} from "@/lib/schoolYearUtils";

interface PaymentActionsProps {
  member: Member;
}

export function PaymentActions({ member }: PaymentActionsProps) {
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const { data: payments = [] } = usePayments(member.id);
  const paySingleMonth = usePaySingleMonth();
  const createPayment = useCreatePayment();
  
  const currentMonth = getCurrentMonth();
  const paidMonths = new Set(payments.map(p => p.month));
  const schoolYearMonths = getSchoolYearMonthsOrdered();
  const unpaidMonths = schoolYearMonths.filter(m => !paidMonths.has(m));
  
  const isCurrentMonthPaid = paidMonths.has(currentMonth);
  const isCurrentMonthInSchoolYear = SCHOOL_YEAR_MONTHS.includes(currentMonth);
  
  // Najdi první nezaplacený měsíc
  const firstUnpaidMonth = unpaidMonths[0];
  
  // Má se zobrazit "Zaplatit tento měsíc" nebo "Zaplatit příští měsíc"?
  const showPayThisMonth = isCurrentMonthInSchoolYear && !isCurrentMonthPaid;
  const nextMonthToPay = showPayThisMonth ? currentMonth : firstUnpaidMonth;

  const handleQuickPay = async () => {
    if (nextMonthToPay) {
      await paySingleMonth.mutateAsync({ memberId: member.id, month: nextMonthToPay });
    }
  };

  const handlePayAmount = async (amount: number) => {
    await createPayment.mutateAsync({ memberId: member.id, amount });
    setPayDialogOpen(false);
  };

  const isPending = paySingleMonth.isPending || createPayment.isPending;
  const allPaid = unpaidMonths.length === 0;

  return (
    <>
      <Card className="shadow-card animate-fade-in">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Zaplatit příspěvek
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {allPaid ? (
            <p className="text-center text-muted-foreground py-4">
              Všechny měsíce jsou zaplaceny! 🎉
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleQuickPay}
                disabled={isPending || !nextMonthToPay}
                className="h-14 text-base gradient-gold hover:opacity-90 transition-opacity"
              >
                {showPayThisMonth ? (
                  <>Zaplatit {getMonthName(currentMonth).toLowerCase()}</>
                ) : nextMonthToPay ? (
                  <>Zaplatit {getMonthName(nextMonthToPay).toLowerCase()}</>
                ) : (
                  <>Vše zaplaceno</>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setPayDialogOpen(true)}
                disabled={isPending}
                className="h-14 text-base"
              >
                <Banknote className="mr-2 h-5 w-5" />
                Zaplatit částku
              </Button>
            </div>
          )}
          
          {!allPaid && (
            <p className="text-xs text-center text-muted-foreground">
              Zbývá zaplatit: {unpaidMonths.map(m => getMonthName(m).toLowerCase()).join(", ")}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Platba {getMemberLabelGenitive(member.gender as 'male' | 'female')}{" "}
              {member.first_name}
            </DialogTitle>
            <DialogDescription>
              Kolik {getMemberLabelGenitive(member.gender as 'male' | 'female')} dává?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[100, 200, 500, 1000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => handlePayAmount(amount)}
                disabled={isPending}
                className="h-16 text-xl font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {amount} Kč
              </Button>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            {unpaidMonths.length} nezaplacených měsíců = {unpaidMonths.length * 100} Kč
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
