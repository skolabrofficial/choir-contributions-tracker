import { useState, useRef } from "react";
import { Upload, FileText, Users, Loader2 } from "lucide-react";
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
import { toast } from "sonner";

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [membersText, setMembersText] = useState("");
  const [paymentsText, setPaymentsText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const importMembers = useImportMembers();
  const importPayments = useImportPayments();
  const { data: existingMembers = [] } = useMembers();

  const parseMembersFromText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const members: { first_name: string; last_name: string; gender: 'male' | 'female'; email: string | null; phone: string | null; is_active: boolean }[] = [];
    
    for (const line of lines) {
      // Očekávaný formát: "Jméno Příjmení" nebo "Jméno Příjmení, email, telefon"
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
      // Formát: "Jméno Příjmení: září, říjen, listopad" nebo "Jméno Příjmení - zaplaceno vše"
      const colonIndex = line.indexOf(':');
      const dashIndex = line.indexOf('-');
      const separator = colonIndex > 0 ? colonIndex : dashIndex;
      
      if (separator > 0) {
        const namePart = line.substring(0, separator).trim();
        const monthsPart = line.substring(separator + 1).trim().toLowerCase();
        
        // Najdeme člena podle jména
        const nameParts = namePart.split(/\s+/).filter(p => p);
        const member = existingMembers.find(m => {
          const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
          const searchName = nameParts.join(' ').toLowerCase();
          return fullName === searchName || fullName.includes(searchName);
        });
        
        if (member) {
          if (monthsPart.includes('vše') || monthsPart.includes('celý rok') || monthsPart.includes('komplet')) {
            // Zaplaceno vše
            for (const month of getSchoolYearMonthsOrdered()) {
              payments.push({
                member_id: member.id,
                school_year: schoolYear,
                month,
                amount: 100,
              });
            }
          } else {
            // Parse jednotlivé měsíce
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
            Vložte text ze souboru nebo PDF. Data budou automaticky rozpoznána.
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
            <div className="space-y-2">
              <Label>Seznam členů (jeden na řádek)</Label>
              <Textarea
                placeholder="Marie Nováková&#10;Jan Novák, jan@email.cz&#10;Petra Svobodová, petra@email.cz, +420123456789"
                value={membersText}
                onChange={(e) => setMembersText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
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
            <div className="space-y-2">
              <Label>Seznam plateb</Label>
              <Textarea
                placeholder="Marie Nováková: září, říjen, listopad&#10;Jan Novák: zaplaceno vše&#10;Petra Svobodová: září, říjen"
                value={paymentsText}
                onChange={(e) => setPaymentsText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
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
