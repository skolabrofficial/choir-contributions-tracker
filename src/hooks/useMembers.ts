import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female';
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("is_active", true)
        .order("last_name", { ascending: true });
      
      if (error) throw error;
      return data as Member[];
    },
  });
}

export function useMember(id: string | null) {
  return useQuery({
    queryKey: ["member", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Member | null;
    },
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (member: Omit<Member, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("members")
        .insert(member)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Člen byl úspěšně přidán");
    },
    onError: (error) => {
      toast.error(`Chyba při přidávání člena: ${error.message}`);
    },
  });
}

export function useImportMembers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (members: Omit<Member, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from("members")
        .insert(members)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success(`Importováno ${data.length} členů`);
    },
    onError: (error) => {
      toast.error(`Chyba při importu: ${error.message}`);
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("members")
        .update({ is_active: false })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Člen byl odebrán");
    },
    onError: (error) => {
      toast.error(`Chyba při odebírání člena: ${error.message}`);
    },
  });
}
