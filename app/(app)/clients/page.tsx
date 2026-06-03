import { Pencil, Plus } from "lucide-react";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listClients } from "@/services/clients";
import { requireSalonContext } from "@/lib/tenant";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requireSalonContext();
  const { q } = await searchParams;
  const clients = await listClients(ctx, q);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <ClientFormDialog
          trigger={
            <Button>
              <Plus className="size-4" />
              Nuevo cliente
            </Button>
          }
        />
      </div>
      <SearchInput placeholder="Buscar por nombre, teléfono o correo" />

      {clients.length === 0 ? (
        <EmptyState
          title="Aún no hay clientes"
          description="Registra tu primer cliente para asociarlo a las ventas."
          action={
            <ClientFormDialog
              trigger={
                <Button>
                  <Plus className="size-4" />
                  Nuevo cliente
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.fullName}</TableCell>
                  <TableCell>{c.phone ?? "—"}</TableCell>
                  <TableCell>{c.email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <ClientFormDialog
                      client={c}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Editar">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <DeleteClientButton id={c.id} name={c.fullName} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
