"use client";

import { useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

export type TourCaps = {
  sales: boolean;
  clients: boolean;
  catalog: boolean;
  cash: boolean;
  expenses: boolean;
  reports: boolean;
  admin: boolean;
  platformAdmin: boolean;
};

/**
 * First-run interactive tour (driver.js). Auto-starts once per user; steps are
 * role-aware (only modules the user can access). Marks the user onboarded on
 * finish/skip so it never shows again.
 */
export function ProductTour({ caps }: { caps: TourCaps }) {
  useEffect(() => {
    const navStep = (href: string, title: string, description: string): DriveStep | null => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${href}"]`);
      // Only include visible elements (desktop nav); skip on small screens.
      if (!el || el.offsetParent === null) return null;
      return { element: el, popover: { title, description } };
    };

    const steps: DriveStep[] = [
      {
        popover: {
          title: "¡Bienvenido a salon360! 👋",
          description:
            "Te mostramos lo esencial en 30 segundos. Puedes saltar cuando quieras.",
        },
      },
      navStep("/dashboard", "Panel", "Resumen del día: ventas, caja, por cobrar y más."),
      caps.sales && navStep("/sales", "Ventas", "Registra ventas con sus ítems y cobra (efectivo, tarjeta, transferencia)."),
      caps.clients && navStep("/clients", "Clientes", "Administra la ficha de tus clientes."),
      caps.catalog && navStep("/catalog", "Servicios", "Define servicios con precio y duración."),
      caps.cash && navStep("/cash", "Caja", "Abre y cierra caja; cuadra efectivo esperado vs contado."),
      caps.expenses && navStep("/expenses", "Gastos", "Registra gastos; los de efectivo afectan la caja."),
      caps.reports && navStep("/reports", "Reportes", "Utilidad, ventas por servicio/staff y cierre diario."),
      caps.admin && navStep("/staff", "Personal", "Crea usuarios y asigna roles y salón."),
      caps.admin && navStep("/settings", "Configuración", "Moneda, impuesto, logo y salones."),
      caps.platformAdmin && navStep("/platform", "Plataforma", "Da de alta empresas cliente y entra a gestionarlas."),
      {
        popover: {
          title: "¡Listo! 🎉",
          description: "Eso es todo. Explora con calma — aquí estará cuando lo necesites.",
        },
      },
    ].filter((s): s is DriveStep => Boolean(s));

    let done = false;
    const complete = () => {
      if (done) return;
      done = true;
      void fetch("/api/onboarding/complete", { method: "POST" });
    };

    const d = driver({
      showProgress: true,
      nextBtnText: "Siguiente",
      prevBtnText: "Atrás",
      doneBtnText: "Listo",
      progressText: "{{current}} de {{total}}",
      steps,
      onDestroyed: complete,
    });
    d.drive();

    return () => d.destroy();
  }, [caps]);

  return null;
}
