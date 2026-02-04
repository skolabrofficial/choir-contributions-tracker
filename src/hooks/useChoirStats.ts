import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentSchoolYear, getSchoolYearMonthsOrdered, MONTHLY_FEE } from "@/lib/schoolYearUtils";

export interface ChoirStats {
  totalMembers: number;
  totalCollected: number;
  totalRemaining: number;
  totalExpected: number;
  percentCollected: number;
  fullyPaidMembers: number;
  partiallyPaidMembers: number;
  unpaidMembers: number;
}

export function useChoirStats() {
  const currentYear = getCurrentSchoolYear();
  const schoolYearMonths = getSchoolYearMonthsOrdered();
  const monthsCount = schoolYearMonths.length;
  
  return useQuery({
    queryKey: ["choir-stats", currentYear],
    queryFn: async (): Promise<ChoirStats> => {
      // Získáme všechny aktivní členy
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select("id")
        .eq("is_active", true);
      
      if (membersError) throw membersError;
      
      const totalMembers = members?.length || 0;
      
      // Získáme všechny platby za aktuální školní rok
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("member_id, month, amount")
        .eq("school_year", currentYear);
      
      if (paymentsError) throw paymentsError;
      
      // Spočítáme platby pro každého člena
      const paymentsByMember = new Map<string, Set<number>>();
      let totalCollected = 0;
      
      payments?.forEach(p => {
        if (!paymentsByMember.has(p.member_id)) {
          paymentsByMember.set(p.member_id, new Set());
        }
        paymentsByMember.get(p.member_id)!.add(p.month);
        totalCollected += p.amount;
      });
      
      // Spočítáme statistiky
      let fullyPaidMembers = 0;
      let partiallyPaidMembers = 0;
      let unpaidMembers = 0;
      
      members?.forEach(member => {
        const paidMonths = paymentsByMember.get(member.id);
        if (!paidMonths || paidMonths.size === 0) {
          unpaidMembers++;
        } else if (paidMonths.size >= monthsCount) {
          fullyPaidMembers++;
        } else {
          partiallyPaidMembers++;
        }
      });
      
      const totalExpected = totalMembers * monthsCount * MONTHLY_FEE;
      const totalRemaining = totalExpected - totalCollected;
      const percentCollected = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
      
      return {
        totalMembers,
        totalCollected,
        totalRemaining: Math.max(0, totalRemaining),
        totalExpected,
        percentCollected,
        fullyPaidMembers,
        partiallyPaidMembers,
        unpaidMembers,
      };
    },
  });
}
