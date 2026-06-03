import { redirect } from "next/navigation";
import { CreateCompanyDialog } from "@/components/platform/create-company-dialog";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPlatformSession, listAllOrganizations } from "@/services/platform";

export default async function PlatformPage() {
  const session = await getPlatformSession();
  if (!session) redirect("/dashboard");
  const orgs = await listAllOrganizations();
  const dateFmt = new Intl.DateTimeFormat("es", { dateStyle: "medium" });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Plataforma</h1>
          <p className="text-muted-foreground text-sm">
            Empresas cliente ({orgs.length}).
          </p>
        </div>
        <CreateCompanyDialog />
      </div>

      {orgs.length === 0 ? (
        <EmptyState
          title="Sin empresas"
          description="Crea la primera empresa cliente."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Salones</TableHead>
                <TableHead className="text-right">Miembros</TableHead>
                <TableHead>Creada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell className="text-right">{Number(o.salons)}</TableCell>
                  <TableCell className="text-right">
                    {Number(o.members)}
                  </TableCell>
                  <TableCell>{dateFmt.format(new Date(o.createdAt))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
