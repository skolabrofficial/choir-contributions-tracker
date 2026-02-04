import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateMember } from "@/hooks/useMembers";
import { detectGender } from "@/lib/genderUtils";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const createMember = useCreateMember();

  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    if (value.trim()) {
      setGender(detectGender(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createMember.mutateAsync({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      gender,
      email: email.trim() || null,
      phone: phone.trim() || null,
      is_active: true,
    });

    // Reset form
    setFirstName("");
    setLastName("");
    setGender("male");
    setEmail("");
    setPhone("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Přidat nového člena</DialogTitle>
            <DialogDescription>
              Vyplňte údaje o novém členovi sboru. Pohlaví se automaticky rozpozná podle jména.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Jméno *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => handleFirstNameChange(e.target.value)}
                placeholder="Marie"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Příjmení *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nováková"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Pohlaví</Label>
              <RadioGroup value={gender} onValueChange={(v) => setGender(v as "male" | "female")}>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="font-normal">Žena (členka)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="font-normal">Muž (člen)</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marie@email.cz"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+420 123 456 789"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
            <Button type="submit" disabled={createMember.isPending}>
              {createMember.isPending ? "Přidávám..." : "Přidat člena"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
