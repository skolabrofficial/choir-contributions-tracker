import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentSchoolYear, SCHOOL_YEAR_MONTHS, MONTHLY_FEE } from "@/lib/schoolYearUtils";

export interface Payment {
  id: string;
  member_id: string;
  school_year: string;
  month: number;
  amount: number;
  paid_at: string;
  created_at: string;
}

export interface Surplus {
  id: string;
  member_id: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export function usePayments(memberId: string | null, schoolYear?: string) {
  const year = schoolYear || getCurrentSchoolYear();
  
  return useQuery({
    queryKey: ["payments", memberId, year],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("member_id", memberId)
        .eq("school_year", year)
        .order("month", { ascending: true });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!memberId,
  });
}

export function useSurplus(memberId: string | null) {
  return useQuery({
    queryKey: ["surplus", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from("surplus")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Surplus[];
    },
    enabled: !!memberId,
  });
}

export function useUnpaidMembers() {
  const currentYear = getCurrentSchoolYear();
  const currentMonth = new Date().getMonth() + 1;
  
  return useQuery({
    queryKey: ["unpaid-members", currentYear, currentMonth],
    queryFn: async () => {
      // Získáme všechny aktivní členy
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select("*")
        .eq("is_active", true);
      
      if (membersError) throw membersError;
      
      // Získáme všechny platby za aktuální měsíc
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("member_id")
        .eq("school_year", currentYear)
        .eq("month", currentMonth);
      
      if (paymentsError) throw paymentsError;
      
      const paidMemberIds = new Set(payments?.map(p => p.member_id) || []);
      
      // Vrátíme jen ty, co nemají zaplaceno a je školní měsíc
      const isSchoolMonth = SCHOOL_YEAR_MONTHS.includes(currentMonth);
      if (!isSchoolMonth) return [];
      
      return members?.filter(m => !paidMemberIds.has(m.id)) || [];
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      memberId, 
      amount 
    }: { 
      memberId: string; 
      amount: number;
    }) => {
      const schoolYear = getCurrentSchoolYear();
      
      // Získáme aktuální platby člena
      const { data: existingPayments, error: fetchError } = await supabase
        .from("payments")
        .select("month")
        .eq("member_id", memberId)
        .eq("school_year", schoolYear);
      
      if (fetchError) throw fetchError;
      
      const paidMonths = new Set(existingPayments?.map(p => p.month) || []);
      const unpaidMonths = SCHOOL_YEAR_MONTHS.filter(m => !paidMonths.has(m));
      
      let remainingAmount = amount;
      const paymentsToCreate: { member_id: string; school_year: string; month: number; amount: number }[] = [];
      
      // Postupně zaplatíme nezaplacené měsíce
      for (const month of unpaidMonths) {
        if (remainingAmount >= MONTHLY_FEE) {
          paymentsToCreate.push({
            member_id: memberId,
            school_year: schoolYear,
            month,
            amount: MONTHLY_FEE,
          });
          remainingAmount -= MONTHLY_FEE;
        } else {
          break;
        }
      }
      
      // Pokud něco zbylo, jde to do přebytku
      if (remainingAmount > 0) {
        const { error: surplusError } = await supabase
          .from("surplus")
          .insert({
            member_id: memberId,
            amount: remainingAmount,
            note: `Přebytek z platby ${amount} Kč`,
          });
        
        if (surplusError) throw surplusError;
      }
      
      // Vytvoříme platby
      if (paymentsToCreate.length > 0) {
        const { error: paymentsError } = await supabase
          .from("payments")
          .insert(paymentsToCreate);
        
        if (paymentsError) throw paymentsError;
      }
      
      return { paidMonths: paymentsToCreate.length, surplus: remainingAmount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["surplus"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-members"] });
      
      let message = `Zaplaceno ${result.paidMonths} měsíc${result.paidMonths === 1 ? '' : result.paidMonths < 5 ? 'e' : 'ů'}`;
      if (result.surplus > 0) {
        message += `, přebytek ${result.surplus} Kč`;
      }
      toast.success(message);
    },
    onError: (error) => {
      toast.error(`Chyba při platbě: ${error.message}`);
    },
  });
}

export function usePaySingleMonth() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      memberId, 
      month 
    }: { 
      memberId: string; 
      month: number;
    }) => {
      const schoolYear = getCurrentSchoolYear();
      
      const { error } = await supabase
        .from("payments")
        .insert({
          member_id: memberId,
          school_year: schoolYear,
          month,
          amount: MONTHLY_FEE,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-members"] });
      toast.success("Měsíc zaplacen");
    },
    onError: (error) => {
      toast.error(`Chyba při platbě: ${error.message}`);
    },
  });
}

export function useAllPaymentsForExport() {
  const currentYear = getCurrentSchoolYear();
  
  return useQuery({
    queryKey: ["all-payments-export", currentYear],
    queryFn: async () => {
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select("*")
        .eq("is_active", true)
        .order("last_name", { ascending: true });
      
      if (membersError) throw membersError;
      
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("school_year", currentYear);
      
      if (paymentsError) throw paymentsError;
      
      const { data: surplus, error: surplusError } = await supabase
        .from("surplus")
        .select("*");
      
      if (surplusError) throw surplusError;
      
      return { members, payments, surplus, schoolYear: currentYear };
    },
  });
}
