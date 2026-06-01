import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Panel</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bienvenido a salon360</CardTitle>
          <CardDescription>
            Sistema contable. Las métricas (ventas, caja, gastos) aparecerán
            aquí conforme se construya la Fase 1.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
