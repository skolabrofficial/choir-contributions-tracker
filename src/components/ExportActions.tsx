import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllPaymentsForExport } from "@/hooks/usePayments";
import { getMonthName, getSchoolYearMonthsOrdered, MONTHLY_FEE } from "@/lib/schoolYearUtils";
import { getMemberLabel } from "@/lib/genderUtils";
import { toast } from "sonner";

export function ExportActions() {
  const { data, isLoading } = useAllPaymentsForExport();

  const generateCSV = () => {
    if (!data) return;
    
    const schoolYearMonths = getSchoolYearMonthsOrdered();
    const paymentsByMember = new Map<string, Set<number>>();
    
    data.payments?.forEach(p => {
      if (!paymentsByMember.has(p.member_id)) {
        paymentsByMember.set(p.member_id, new Set());
      }
      paymentsByMember.get(p.member_id)!.add(p.month);
    });

    const surplusByMember = new Map<string, number>();
    data.surplus?.forEach(s => {
      surplusByMember.set(s.member_id, (surplusByMember.get(s.member_id) || 0) + s.amount);
    });

    // CSV header
    const headers = ["Jméno", "Příjmení", "Pohlaví", ...schoolYearMonths.map(m => getMonthName(m)), "Celkem", "Přebytek"];
    const rows = [headers.join(";")];

    data.members?.forEach(member => {
      const paidMonths = paymentsByMember.get(member.id) || new Set();
      const surplus = surplusByMember.get(member.id) || 0;
      const total = paidMonths.size * MONTHLY_FEE;
      
      const row = [
        member.first_name,
        member.last_name,
        getMemberLabel(member.gender as 'male' | 'female'),
        ...schoolYearMonths.map(m => paidMonths.has(m) ? "✓" : ""),
        `${total} Kč`,
        surplus > 0 ? `${surplus} Kč` : "",
      ];
      rows.push(row.join(";"));
    });

    const csv = rows.join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prispevky_${data.schoolYear.replace("/", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("CSV soubor byl stažen");
  };

  const generatePrintable = () => {
    if (!data) return;
    
    const schoolYearMonths = getSchoolYearMonthsOrdered();
    const paymentsByMember = new Map<string, Set<number>>();
    
    data.payments?.forEach(p => {
      if (!paymentsByMember.has(p.member_id)) {
        paymentsByMember.set(p.member_id, new Set());
      }
      paymentsByMember.get(p.member_id)!.add(p.month);
    });

    const html = `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <title>Příspěvky ${data.schoolYear}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: center; }
          th { background: #f5f5f5; }
          .paid { color: green; font-weight: bold; }
          .unpaid { color: #ccc; }
          h1 { font-size: 16px; margin-bottom: 10px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>Krušnohorský pěvecký sbor - Příspěvky ${data.schoolYear}</h1>
        <table>
          <thead>
            <tr>
              <th>Jméno</th>
              ${schoolYearMonths.map(m => `<th>${getMonthName(m).slice(0, 3)}</th>`).join("")}
              <th>Celkem</th>
            </tr>
          </thead>
          <tbody>
            ${data.members?.map(member => {
              const paidMonths = paymentsByMember.get(member.id) || new Set();
              const total = paidMonths.size * MONTHLY_FEE;
              return `
                <tr>
                  <td style="text-align: left;">${member.first_name} ${member.last_name}</td>
                  ${schoolYearMonths.map(m => 
                    `<td class="${paidMonths.has(m) ? 'paid' : 'unpaid'}">${paidMonths.has(m) ? '✓' : '–'}</td>`
                  ).join("")}
                  <td><strong>${total} Kč</strong></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateSlips = () => {
    if (!data) return;
    
    const schoolYearMonths = getSchoolYearMonthsOrdered();
    const paymentsByMember = new Map<string, Set<number>>();
    
    data.payments?.forEach(p => {
      if (!paymentsByMember.has(p.member_id)) {
        paymentsByMember.set(p.member_id, new Set());
      }
      paymentsByMember.get(p.member_id)!.add(p.month);
    });

    const slips = data.members?.map(member => {
      const paidMonths = paymentsByMember.get(member.id) || new Set();
      const paidList = schoolYearMonths.filter(m => paidMonths.has(m)).map(m => getMonthName(m).slice(0, 3)).join(", ");
      const unpaidList = schoolYearMonths.filter(m => !paidMonths.has(m)).map(m => getMonthName(m).slice(0, 3)).join(", ");
      const total = paidMonths.size * MONTHLY_FEE;
      const remaining = (schoolYearMonths.length - paidMonths.size) * MONTHLY_FEE;

      return `
        <div class="slip">
          <strong>${member.first_name} ${member.last_name}</strong><br>
          <small>Rok ${data.schoolYear}</small><br>
          <span class="paid">Zaplaceno: ${paidList || "–"}</span><br>
          <span class="unpaid">Zbývá: ${unpaidList || "–"}</span><br>
          <strong>Zaplaceno: ${total} Kč | Zbývá: ${remaining} Kč</strong>
        </div>
      `;
    }).join("");

    const html = `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <title>Lístečky - ${data.schoolYear}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 10px; }
          .slip { 
            border: 1px dashed #999; 
            padding: 8px; 
            margin: 4px;
            width: 200px;
            display: inline-block;
            vertical-align: top;
          }
          .paid { color: green; }
          .unpaid { color: #c00; }
          @media print { 
            body { margin: 0; }
            .slip { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${slips}
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Export dat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={generateCSV}
            disabled={isLoading}
            className="h-12"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel (CSV)
          </Button>
          <Button
            variant="outline"
            onClick={generatePrintable}
            disabled={isLoading}
            className="h-12"
          >
            <FileText className="mr-2 h-4 w-4" />
            Tabulka PDF
          </Button>
          <Button
            variant="outline"
            onClick={generateSlips}
            disabled={isLoading}
            className="h-12"
          >
            <Printer className="mr-2 h-4 w-4" />
            Lístečky
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
