import { redirect } from "next/navigation";
import { StaffEditDialog } from "@/components/staff/staff-edit-dialog";
import { StaffFormDialog } from "@/components/staff/staff-form-dialog";
import { ResourceDeleteButton } from "@/components/resource-delete-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listStaff } from "@/services/staff";
import { can, roleLabels, type Role } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

export default async function StaffPage() {
  const ctx = await requireSalonContext();
  if (!can(ctx, "staff:manage")) redirect("/dashboard");
  const staff = await listStaff(ctx);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Personal</h1>
        <StaffFormDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="w-20 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.memberId}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>
                  <Badge variant={s.role === "owner" ? "default" : "secondary"}>
                    {roleLabels[s.role as Role] ?? s.role}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end text-right">
                  <StaffEditDialog staff={s} />
                  {s.role !== "owner" && s.userId !== ctx.userId && (
                    <ResourceDeleteButton
                      endpoint={`/api/staff/${s.memberId}`}
                      name={s.name}
                      successMessage="Staff eliminado"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
