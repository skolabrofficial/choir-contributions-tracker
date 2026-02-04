import { useState } from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMembers } from "@/hooks/useMembers";
import { getMemberLabel } from "@/lib/genderUtils";
import { AddMemberDialog } from "./AddMemberDialog";

interface MemberSelectorProps {
  selectedMemberId: string | null;
  onSelect: (memberId: string | null) => void;
}

export function MemberSelector({ selectedMemberId, onSelect }: MemberSelectorProps) {
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { data: members = [], isLoading } = useMembers();

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 sm:h-12 text-sm sm:text-base shadow-card bg-card hover:shadow-card-hover transition-shadow"
          >
            {selectedMember ? (
              <span className="flex items-center gap-1 sm:gap-2 truncate">
                <span className="font-medium truncate">
                  {selectedMember.first_name} {selectedMember.last_name}
                </span>
                <span className="text-muted-foreground text-xs sm:text-sm hidden sm:inline">
                  ({getMemberLabel(selectedMember.gender as 'male' | 'female')})
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Vyberte člena...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Hledat člena..." />
            <CommandList>
              <CommandEmpty>Žádný člen nenalezen.</CommandEmpty>
              <CommandGroup>
                {members.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={`${member.first_name} ${member.last_name}`}
                    onSelect={() => {
                      onSelect(member.id === selectedMemberId ? null : member.id);
                      setOpen(false);
                    }}
                    className="py-3"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedMemberId === member.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">
                      {member.first_name} {member.last_name}
                    </span>
                    <span className="ml-2 text-muted-foreground text-sm">
                      ({getMemberLabel(member.gender as 'male' | 'female')})
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 shadow-card hover:shadow-card-hover transition-shadow"
        onClick={() => setAddDialogOpen(true)}
      >
        <UserPlus className="h-5 w-5" />
      </Button>
      
      <AddMemberDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
