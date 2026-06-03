import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/db";
import { salonSettings } from "@/db/schema";
import { ExpenseCategoryFormDialog } from "@/components/expenses/expense-category-form-dialog";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/search-input";
import { ResourceDeleteButton } from "@/components/resource-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listExpenseCategories, listExpenses } from "@/services/expenses";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import {
  paymentMethodLabels,
  type PaymentMethod,
} from "@/lib/validations/payment";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requireSalonContext();
  if (!can(ctx.role, "expenses:write")) redirect("/dashboard");
  const { q } = await searchParams;
  const [categories, expenses, settings] = await Promise.all([
    listExpenseCategories(ctx),
    listExpenses(ctx, q),
    db.query.salonSettings.findFirst({
      where: eq(salonSettings.teamId, ctx.salonId),
    }),
  ]);
  const fmt = new Intl.NumberFormat("es", {
    style: "currency",
    currency: settings?.currency ?? "USD",
  });
  const dateFmt = new Intl.DateTimeFormat("es", { dateStyle: "medium" });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Gastos</h1>
          <ExpenseFormDialog
            categories={categories}
            trigger={
              <Button>
                <Plus className="size-4" />
                Nuevo gasto
              </Button>
            }
          />
        </div>
        <SearchInput placeholder="Buscar por proveedor o descripción" />

        {expenses.length === 0 ? (
          <EmptyState
            title="Aún no hay gastos"
            description="Registra los gastos del salón para reflejarlos en el P&L."
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{dateFmt.format(new Date(e.expenseDate))}</TableCell>
                    <TableCell>
                      {e.categoryName ? (
                        <Badge variant="secondary">{e.categoryName}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{e.vendor ?? "—"}</TableCell>
                    <TableCell>
                      {e.paymentMethod
                        ? (paymentMethodLabels[e.paymentMethod as PaymentMethod] ??
                          e.paymentMethod)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt.format(Number(e.amount))}
                    </TableCell>
                    <TableCell className="flex justify-end text-right">
                      <ExpenseFormDialog
                        expense={e}
                        categories={categories}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Editar">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <ResourceDeleteButton
                        endpoint={`/api/expenses/${e.id}`}
                        name="este gasto"
                        successMessage="Gasto eliminado"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Categorías de gasto</h2>
          <ExpenseCategoryFormDialog
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="size-4" />
                Nueva categoría
              </Button>
            }
          />
        </div>

        {categories.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">Sin categorías.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-4 py-2"
              >
                <span>{c.name}</span>
                <span className="flex items-center">
                  <ExpenseCategoryFormDialog
                    category={c}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Editar">
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <ResourceDeleteButton
                    endpoint={`/api/expense-categories/${c.id}`}
                    name={`la categoría ${c.name}`}
                    successMessage="Categoría eliminada"
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
