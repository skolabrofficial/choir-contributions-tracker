import { useState } from "react";
import { Music } from "lucide-react";
import { MemberSelector } from "@/components/MemberSelector";
import { UnpaidMembersList } from "@/components/UnpaidMembersList";
import { PaymentStatus } from "@/components/PaymentStatus";
import { PaymentActions } from "@/components/PaymentActions";
import { ExportActions } from "@/components/ExportActions";
import { useMember } from "@/hooks/useMembers";
import { getCurrentSchoolYear } from "@/lib/schoolYearUtils";

const Index = () => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { data: selectedMember } = useMember(selectedMemberId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container max-w-4xl py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-gold">
              <Music className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Krušnohorský pěvecký sbor
              </h1>
              <p className="text-sm text-muted-foreground">
                Evidence příspěvků • Školní rok {getCurrentSchoolYear()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-4xl py-8 space-y-6">
        {/* Member selector */}
        <section>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Vyberte člena sboru
          </label>
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
          <section className="space-y-4">
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
        <div className="container max-w-4xl py-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Krušnohorský pěvecký sbor
        </div>
      </footer>
    </div>
  );
};

export default Index;
