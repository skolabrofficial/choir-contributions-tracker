import { useState, useRef } from "react";
import { Upload, FileText, Users, Loader2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useImportMembers, useMembers } from "@/hooks/useMembers";
import { useImportPayments } from "@/hooks/usePayments";
import { detectGender } from "@/lib/genderUtils";
import { getCurrentSchoolYear, getSchoolYearMonthsOrdered } from "@/lib/schoolYearUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [membersText, setMembersText] = useState("");
  const [paymentsText, setPaymentsText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const membersFileRef = useRef<HTMLInputElement>(null);
  const paymentsFileRef = useRef<HTMLInputElement>(null);
  
  const importMembers = useImportMembers();
  const importPayments = useImportPayments();
  const { data: existingMembers = [] } = useMembers();

  const parseMembersFromText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const members: { first_name: string; last_name: string; gender: 'male' | 'female'; email: string | null; phone: string | null; is_active: boolean }[] = [];
    
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      const nameParts = parts[0].split(/\s+/).filter(p => p);
      
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        members.push({
          first_name: firstName,
          last_name: lastName,
          gender: detectGender(firstName),
          email: parts[1] || null,
          phone: parts[2] || null,
          is_active: true,
        });
      }
    }
    
    return members;
  };

  const parsePaymentsFromText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const payments: { member_id: string; school_year: string; month: number; amount: number }[] = [];
    const schoolYear = getCurrentSchoolYear();
    const monthNames: Record<string, number> = {
      'září': 9, 'zář': 9, '9': 9,
      'říjen': 10, 'říj': 10, '10': 10,
      'listopad': 11, 'lis': 11, '11': 11,
      'prosinec': 12, 'pro': 12, '12': 12,
      'leden': 1, 'led': 1, '1': 1,
      'únor': 2, 'úno': 2, '2': 2,
      'březen': 3, 'bře': 3, '3': 3,
      'duben': 4, 'dub': 4, '4': 4,
      'květen': 5, 'kvě': 5, '5': 5,
      'červen': 6, 'čer': 6, '6': 6,
    };
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      const dashIndex = line.indexOf('-');
      const separator = colonIndex > 0 ? colonIndex : dashIndex;
      
      if (separator > 0) {
        const namePart = line.substring(0, separator).trim();
        const monthsPart = line.substring(separator + 1).trim().toLowerCase();
        
        const nameParts = namePart.split(/\s+/).filter(p => p);
        const member = existingMembers.find(m => {
          const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
          const searchName = nameParts.join(' ').toLowerCase();
          return fullName === searchName || fullName.includes(searchName);
        });
        
        if (member) {
          if (monthsPart.includes('vše') || monthsPart.includes('celý rok') || monthsPart.includes('komplet')) {
            for (const month of getSchoolYearMonthsOrdered()) {
              payments.push({
                member_id: member.id,
                school_year: schoolYear,
                month,
                amount: 100,
              });
            }
          } else {
            for (const [name, num] of Object.entries(monthNames)) {
              if (monthsPart.includes(name)) {
                payments.push({
                  member_id: member.id,
                  school_year: schoolYear,
                  month: num,
                  amount: 100,
                });
              }
            }
          }
        }
      }
    }
    
    return payments;
  };

  const handleFileUpload = async (file: File, type: 'members' | 'payments') => {
    setUploadingFile(type);
    
    try {
      // For text files, read directly
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        const text = await file.text();
        if (type === 'members') {
          setMembersText(text);
        } else {
          setPaymentsText(text);
        }
        toast.success("Soubor načten");
        return;
      }

      // For PDF and other files, use the edge function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
        {
          method: 'POST',
          body: formData,
          headers: session?.access_token 
            ? { 'Authorization': `Bearer ${session.access_token}` }
            : {},
        }
      );

      if (!response.ok) {
        throw new Error('Nepodařilo se zpracovat soubor');
      }

      const result = await response.json();
      
      if (type === 'members' && result.data?.length > 0) {
        // Convert AI result to member format
        const members = result.data.map((m: { first_name: string; last_name: string }) => ({
          first_name: m.first_name,
          last_name: m.last_name,
          gender: detectGender(m.first_name),
          email: null,
          phone: null,
          is_active: true,
        }));
        
        await importMembers.mutateAsync(members);
        setOpen(false);
      } else if (type === 'payments' && result.data?.length > 0) {
        // Convert AI result to payments format
        const schoolYear = getCurrentSchoolYear();
        const payments: { member_id: string; school_year: string; month: number; amount: number }[] = [];
        
        for (const item of result.data) {
          const member = existingMembers.find(m => {
            const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
            return fullName === item.name?.toLowerCase() || fullName.includes(item.name?.toLowerCase() || '');
          });
          
          if (member && item.months?.length > 0) {
            for (const month of item.months) {
              payments.push({
                member_id: member.id,
                school_year: schoolYear,
                month,
                amount: 100,
              });
            }
          }
        }
        
        if (payments.length > 0) {
          await importPayments.mutateAsync(payments);
          setOpen(false);
        } else {
          toast.error("Nepodařilo se přiřadit platby ke členům");
        }
      } else {
        toast.error("V souboru nebyla nalezena žádná data");
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error("Chyba při zpracování souboru");
    } finally {
      setUploadingFile(null);
    }
  };

  const handleImportMembers = async () => {
    setIsProcessing(true);
    try {
      const members = parseMembersFromText(membersText);
      if (members.length === 0) {
        toast.error("Nebyli nalezeni žádní členové k importu");
        return;
      }
      await importMembers.mutateAsync(members);
      setMembersText("");
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportPayments = async () => {
    setIsProcessing(true);
    try {
      const payments = parsePaymentsFromText(paymentsText);
      if (payments.length === 0) {
        toast.error("Nebyly nalezeny žádné platby k importu. Ujistěte se, že členové existují v systému.");
        return;
      }
      await importPayments.mutateAsync(payments);
      setPaymentsText("");
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 sm:h-12">
          <Upload className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Import dat</span>
          <span className="sm:hidden">Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Import dat</DialogTitle>
          <DialogDescription>
            Nahrajte soubor (PDF, TXT) nebo vložte text ručně.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="members" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Členové
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Platby
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="space-y-4 mt-4">
            {/* File upload */}
            <div className="space-y-2">
              <Label>Nahrát soubor</Label>
              <input
                ref={membersFileRef}
                type="file"
                accept=".pdf,.txt,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'members');
                }}
              />
              <Button
                variant="outline"
                className="w-full h-20 border-dashed flex flex-col gap-2"
                onClick={() => membersFileRef.current?.click()}
                disabled={uploadingFile === 'members'}
              >
                {uploadingFile === 'members' ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">Zpracovávám...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="h-6 w-6" />
                    <span className="text-sm">Klikněte pro nahrání PDF nebo TXT</span>
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">nebo vložte text</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Seznam členů (jeden na řádek)</Label>
              <Textarea
                placeholder="Marie Nováková&#10;Jan Novák, jan@email.cz&#10;Petra Svobodová"
                value={membersText}
                onChange={(e) => setMembersText(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Formát: Jméno Příjmení, email (volitelné), telefon (volitelné)
              </p>
            </div>
            <Button 
              onClick={handleImportMembers} 
              disabled={!membersText.trim() || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importuji...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Importovat členy</>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-4 mt-4">
            {/* File upload */}
            <div className="space-y-2">
              <Label>Nahrát soubor</Label>
              <input
                ref={paymentsFileRef}
                type="file"
                accept=".pdf,.txt,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'payments');
                }}
              />
              <Button
                variant="outline"
                className="w-full h-20 border-dashed flex flex-col gap-2"
                onClick={() => paymentsFileRef.current?.click()}
                disabled={uploadingFile === 'payments' || existingMembers.length === 0}
              >
                {uploadingFile === 'payments' ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">Zpracovávám...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="h-6 w-6" />
                    <span className="text-sm">Klikněte pro nahrání PDF nebo TXT</span>
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">nebo vložte text</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Seznam plateb</Label>
              <Textarea
                placeholder="Marie Nováková: září, říjen, listopad&#10;Jan Novák: zaplaceno vše&#10;Petra Svobodová: září, říjen"
                value={paymentsText}
                onChange={(e) => setPaymentsText(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Formát: Jméno Příjmení: měsíc1, měsíc2, ... nebo "zaplaceno vše"
              </p>
            </div>
            <Button 
              onClick={handleImportPayments} 
              disabled={!paymentsText.trim() || isProcessing || existingMembers.length === 0}
              className="w-full"
            >
              {isProcessing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importuji...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Importovat platby</>
              )}
            </Button>
            {existingMembers.length === 0 && (
              <p className="text-xs text-destructive text-center">
                Nejprve importujte nebo přidejte členy
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
