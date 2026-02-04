import { useState } from "react";
import { Music } from "lucide-react";
import { MemberSelector } from "@/components/MemberSelector";
import { UnpaidMembersList } from "@/components/UnpaidMembersList";
import { PaymentStatus } from "@/components/PaymentStatus";
import { PaymentActions } from "@/components/PaymentActions";
import { ExportActions } from "@/components/ExportActions";
import { ImportDialog } from "@/components/ImportDialog";
import { useMember } from "@/hooks/useMembers";
import { getCurrentSchoolYear } from "@/lib/schoolYearUtils";

const Index = () => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { data: selectedMember } = useMember(selectedMemberId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-10">
        <div className="container max-w-4xl py-4 sm:py-6 px-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg gradient-gold shrink-0">
              <Music className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground truncate">
                Krušnohorský pěvecký sbor
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Evidence příspěvků • {getCurrentSchoolYear()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-4xl py-4 sm:py-8 px-4 space-y-4 sm:space-y-6 flex-1">
        {/* Member selector + Import */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-muted-foreground">
              Vyberte člena sboru
            </label>
            <ImportDialog />
          </div>
          <MemberSelector 
            selectedMemberId={selectedMemberId} 
            onSelect={setSelectedMemberId} 
          />
        </section>

        {/* Unpaid members list */}
        <section>
          <UnpaidMembersList onSelectMember={setSelectedMemberId} />
        </section>

        {/* Selected member details */}
        {selectedMember && (
          <section className="space-y-3 sm:space-y-4">
            <PaymentStatus member={selectedMember} />
            <PaymentActions member={selectedMember} />
          </section>
        )}

        {/* Export section */}
        <section className="pt-4 border-t border-border">
          <ExportActions />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container max-w-4xl py-3 sm:py-4 px-4 text-center text-xs sm:text-sm text-muted-foreground">
          © {new Date().getFullYear()} Krušnohorský pěvecký sbor
        </div>
      </footer>
    </div>
  );
};

export default Index;
