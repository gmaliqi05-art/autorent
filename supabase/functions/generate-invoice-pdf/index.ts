// Edge function: generate-invoice-pdf
// Gjeneron PDF te faturës per nje booking ose invoice te dhene.
//
// POST /functions/v1/generate-invoice-pdf
// Body: { bookingId: string } OSE { invoiceId: string }
// Query: ?lang=sq|en|de|it|fr|nl|pl (default 'sq')
//
// Authorization: kerkon JWT te perdoruesit. Verifikon qe user-i eshte:
//   - klienti i booking-ut OSE
//   - owner i kompanise se booking-ut OSE
//   - super_admin (nga JWT app_metadata)
//
// Pergjigja: application/pdf binary (download direkt).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { jsPDF } from "npm:jspdf@2.5.2";
import { handleCorsPreflight, corsHeaders } from "../_shared/cors.ts";

type Lang = "sq" | "en" | "de" | "it" | "fr" | "nl" | "pl";

interface I18nStrings {
  invoice: string;
  invoiceNumber: string;
  invoiceDate: string;
  from: string;
  to: string;
  vehicle: string;
  rental_period: string;
  pickup: string;
  return: string;
  description: string;
  quantity: string;
  unit_price: string;
  subtotal: string;
  baseRental: string;
  insurance: string;
  extras: string;
  oneWayFee: string;
  youngDriverFee: string;
  discount: string;
  tax: string;
  total: string;
  deposit: string;
  paymentMethod: string;
  paymentStatus: string;
  paid: string;
  pending: string;
  failed: string;
  refunded: string;
  thankYou: string;
  generatedAt: string;
  days: string;
}

const I18N: Record<Lang, I18nStrings> = {
  sq: {
    invoice: "FATURË", invoiceNumber: "Numri i faturës", invoiceDate: "Data e faturës",
    from: "Lëshuar nga", to: "Klienti", vehicle: "Automjeti",
    rental_period: "Periudha e qirasë", pickup: "Marrja", return: "Kthimi",
    description: "Përshkrimi", quantity: "Sasia", unit_price: "Çmim njësi", subtotal: "Nëntotali",
    baseRental: "Qira bazë", insurance: "Sigurim", extras: "Shtesa",
    oneWayFee: "Dorëzim në vendndodhje tjetër", youngDriverFee: "Tarifë shofer i ri",
    discount: "Zbritje", tax: "TVSH", total: "TOTALI",
    deposit: "Depozita (kthehet)", paymentMethod: "Metoda e pagesës", paymentStatus: "Statusi i pagesës",
    paid: "Paguar", pending: "Në pritje", failed: "Dështoi", refunded: "Rimbursuar",
    thankYou: "Faleminderit që zgjodhët shërbimin tonë!", generatedAt: "Gjeneruar më", days: "ditë",
  },
  en: {
    invoice: "INVOICE", invoiceNumber: "Invoice number", invoiceDate: "Invoice date",
    from: "Issued by", to: "Client", vehicle: "Vehicle",
    rental_period: "Rental period", pickup: "Pickup", return: "Return",
    description: "Description", quantity: "Qty", unit_price: "Unit price", subtotal: "Subtotal",
    baseRental: "Base rental", insurance: "Insurance", extras: "Extras",
    oneWayFee: "One-way drop-off fee", youngDriverFee: "Young driver fee",
    discount: "Discount", tax: "VAT", total: "TOTAL",
    deposit: "Deposit (refundable)", paymentMethod: "Payment method", paymentStatus: "Payment status",
    paid: "Paid", pending: "Pending", failed: "Failed", refunded: "Refunded",
    thankYou: "Thank you for choosing our service!", generatedAt: "Generated on", days: "days",
  },
  de: {
    invoice: "RECHNUNG", invoiceNumber: "Rechnungsnummer", invoiceDate: "Rechnungsdatum",
    from: "Ausgestellt von", to: "Kunde", vehicle: "Fahrzeug",
    rental_period: "Mietzeitraum", pickup: "Abholung", return: "Rückgabe",
    description: "Beschreibung", quantity: "Menge", unit_price: "Einzelpreis", subtotal: "Zwischensumme",
    baseRental: "Grundmiete", insurance: "Versicherung", extras: "Extras",
    oneWayFee: "Einwegrückgabegebühr", youngDriverFee: "Junge-Fahrer-Gebühr",
    discount: "Rabatt", tax: "MwSt.", total: "GESAMT",
    deposit: "Kaution (rückzahlbar)", paymentMethod: "Zahlungsart", paymentStatus: "Zahlungsstatus",
    paid: "Bezahlt", pending: "Ausstehend", failed: "Fehlgeschlagen", refunded: "Erstattet",
    thankYou: "Vielen Dank für Ihre Wahl!", generatedAt: "Erstellt am", days: "Tage",
  },
  it: {
    invoice: "FATTURA", invoiceNumber: "Numero fattura", invoiceDate: "Data fattura",
    from: "Emessa da", to: "Cliente", vehicle: "Veicolo",
    rental_period: "Periodo noleggio", pickup: "Ritiro", return: "Consegna",
    description: "Descrizione", quantity: "Q.tà", unit_price: "Prezzo unitario", subtotal: "Subtotale",
    baseRental: "Noleggio base", insurance: "Assicurazione", extras: "Extra",
    oneWayFee: "Costo restituzione altra sede", youngDriverFee: "Tariffa giovane conducente",
    discount: "Sconto", tax: "IVA", total: "TOTALE",
    deposit: "Cauzione (rimborsabile)", paymentMethod: "Metodo di pagamento", paymentStatus: "Stato pagamento",
    paid: "Pagato", pending: "In attesa", failed: "Fallito", refunded: "Rimborsato",
    thankYou: "Grazie per aver scelto il nostro servizio!", generatedAt: "Generato il", days: "giorni",
  },
  fr: {
    invoice: "FACTURE", invoiceNumber: "Numéro de facture", invoiceDate: "Date de facture",
    from: "Émis par", to: "Client", vehicle: "Véhicule",
    rental_period: "Période de location", pickup: "Retrait", return: "Retour",
    description: "Description", quantity: "Qté", unit_price: "Prix unitaire", subtotal: "Sous-total",
    baseRental: "Location de base", insurance: "Assurance", extras: "Extras",
    oneWayFee: "Frais de retour autre site", youngDriverFee: "Frais jeune conducteur",
    discount: "Remise", tax: "TVA", total: "TOTAL",
    deposit: "Caution (remboursable)", paymentMethod: "Mode de paiement", paymentStatus: "Statut de paiement",
    paid: "Payé", pending: "En attente", failed: "Échoué", refunded: "Remboursé",
    thankYou: "Merci d'avoir choisi notre service !", generatedAt: "Généré le", days: "jours",
  },
  nl: {
    invoice: "FACTUUR", invoiceNumber: "Factuurnummer", invoiceDate: "Factuurdatum",
    from: "Uitgegeven door", to: "Klant", vehicle: "Voertuig",
    rental_period: "Huurperiode", pickup: "Ophalen", return: "Inleveren",
    description: "Omschrijving", quantity: "Aantal", unit_price: "Stukprijs", subtotal: "Subtotaal",
    baseRental: "Basishuur", insurance: "Verzekering", extras: "Extras",
    oneWayFee: "One-way inleververgoeding", youngDriverFee: "Toeslag jonge bestuurder",
    discount: "Korting", tax: "BTW", total: "TOTAAL",
    deposit: "Borg (terugbetaalbaar)", paymentMethod: "Betaalmethode", paymentStatus: "Betalingsstatus",
    paid: "Betaald", pending: "In afwachting", failed: "Mislukt", refunded: "Terugbetaald",
    thankYou: "Bedankt voor uw vertrouwen!", generatedAt: "Gegenereerd op", days: "dagen",
  },
  pl: {
    invoice: "FAKTURA", invoiceNumber: "Numer faktury", invoiceDate: "Data faktury",
    from: "Wystawca", to: "Klient", vehicle: "Pojazd",
    rental_period: "Okres wynajmu", pickup: "Odbiór", return: "Zwrot",
    description: "Opis", quantity: "Ilość", unit_price: "Cena jedn.", subtotal: "Suma częściowa",
    baseRental: "Wynajem podstawowy", insurance: "Ubezpieczenie", extras: "Dodatki",
    oneWayFee: "Opłata za zwrot w innym miejscu", youngDriverFee: "Opłata młodego kierowcy",
    discount: "Rabat", tax: "VAT", total: "SUMA",
    deposit: "Kaucja (zwrotna)", paymentMethod: "Metoda płatności", paymentStatus: "Status płatności",
    paid: "Zapłacone", pending: "Oczekuje", failed: "Nieudane", refunded: "Zwrócone",
    thankYou: "Dziękujemy za wybór naszej usługi!", generatedAt: "Wygenerowano", days: "dni",
  },
};

function fmtCurrency(amount: number, currency: string): string {
  const symbol = currency === "EUR" ? "EUR" : currency === "USD" ? "USD" : currency;
  return `${Number(amount).toFixed(2)} ${symbol}`;
}

function fmtDate(iso: string, lang: Lang): string {
  const localeMap: Record<Lang, string> = {
    sq: "sq-AL", en: "en-GB", de: "de-DE",
    it: "it-IT", fr: "fr-FR", nl: "nl-NL", pl: "pl-PL",
  };
  try {
    return new Date(iso).toLocaleDateString(localeMap[lang], {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return iso;
  }
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;
  const cors = corsHeaders(req.headers.get("origin"));

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Verifikoj user-in nga JWT
  const authHeader = req.headers.get("authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const callerId = userData.user.id;
  const callerRole = (userData.user.app_metadata as Record<string, unknown> | undefined)?.role;
  const isSuperAdmin = callerRole === "super_admin";

  let body: { bookingId?: string; invoiceId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const lang = (url.searchParams.get("lang") || "sq") as Lang;
  const t = I18N[lang] || I18N.sq;

  // Service role per te marre te gjitha relacionet (RLS bypass)
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let bookingId = body.bookingId;
  if (!bookingId && body.invoiceId) {
    const { data: inv } = await admin
      .from("invoices")
      .select("booking_id")
      .eq("id", body.invoiceId)
      .maybeSingle();
    if (!inv?.booking_id) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    bookingId = inv.booking_id;
  }
  if (!bookingId) {
    return new Response(JSON.stringify({ error: "bookingId or invoiceId required" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const { data: booking, error: bookErr } = await admin
    .from("bookings")
    .select(`
      *,
      vehicle:vehicles(brand, model, year, plate_number),
      company:companies(name, email, phone, address, city, country, license_number, logo_url),
      insurance_plan:insurance_plans(name_en, name_sq, name_de, code, tier),
      extras:booking_extras(quantity, unit_price_per_day, unit_price_per_rental, subtotal, currency, extra:vehicle_extras(code, name_en, name_sq, name_de))
    `)
    .eq("id", bookingId)
    .maybeSingle();

  if (bookErr || !booking) {
    return new Response(JSON.stringify({ error: "Booking not found" }), {
      status: 404, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Authorization: client/company-owner/super_admin
  const isClient = booking.client_id === callerId;
  let isCompanyOwner = false;
  if (!isClient && !isSuperAdmin) {
    const { data: comp } = await admin
      .from("companies")
      .select("owner_id")
      .eq("id", booking.company_id)
      .maybeSingle();
    isCompanyOwner = comp?.owner_id === callerId;
  }
  if (!isClient && !isCompanyOwner && !isSuperAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Marr invoice me invoice_number
  const { data: invoice } = await admin
    .from("invoices")
    .select("invoice_number, issued_at, created_at")
    .eq("booking_id", bookingId)
    .maybeSingle();

  const invoiceNumber = invoice?.invoice_number || `INV-${String(bookingId).slice(0, 8).toUpperCase()}`;
  const invoiceDate = invoice?.issued_at || invoice?.created_at || booking.created_at;
  const currency = booking.currency || "EUR";
  const vehicleName = booking.vehicle
    ? `${booking.vehicle.brand} ${booking.vehicle.model} (${booking.vehicle.year})`
    : "—";

  // ============== Gjenero PDF ==============
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(t.invoice, margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${t.invoiceNumber}: ${invoiceNumber}`, margin, 26);
  doc.text(`${t.invoiceDate}: ${fmtDate(invoiceDate, lang)}`, margin, 31);
  doc.setTextColor(15, 23, 42);

  y = 45;

  // Two columns: From / To
  const colWidth = (pageWidth - 2 * margin - 10) / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(t.from, margin, y);
  doc.text(t.to, margin + colWidth + 10, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const company = booking.company || {};
  const companyLines = [
    company.name || "—",
    company.address || "",
    `${company.city || ""}, ${company.country || ""}`,
    company.email ? `Email: ${company.email}` : "",
    company.phone ? `Tel: ${company.phone}` : "",
    company.license_number ? `License: ${company.license_number}` : "",
  ].filter(Boolean);
  companyLines.forEach((line: string, i: number) => {
    doc.text(String(line), margin, y + i * 4.5);
  });

  const clientLines = [
    booking.client_name || "—",
    booking.client_email ? `Email: ${booking.client_email}` : "",
    booking.client_phone ? `Tel: ${booking.client_phone}` : "",
  ].filter(Boolean);
  clientLines.forEach((line: string, i: number) => {
    doc.text(String(line), margin + colWidth + 10, y + i * 4.5);
  });

  y += Math.max(companyLines.length, clientLines.length) * 4.5 + 8;

  // Vehicle + period block
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, y, pageWidth - 2 * margin, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(t.vehicle, margin + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(vehicleName, margin + 3, y + 11);
  doc.setFont("helvetica", "bold");
  doc.text(t.rental_period, margin + 3, y + 17);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${t.pickup}: ${fmtDate(booking.pickup_date, lang)}  →  ${t.return}: ${fmtDate(booking.return_date, lang)}  (${booking.total_days} ${t.days})`,
    margin + 3 + 35, y + 17,
  );
  y += 30;

  // Line items table
  const tableStartX = margin;
  const tableWidth = pageWidth - 2 * margin;
  const colDesc = tableStartX + 3;
  const colAmount = tableStartX + tableWidth - 3;

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(tableStartX, y, tableWidth, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(t.description, colDesc, y + 5);
  doc.text(t.subtotal, colAmount, y + 5, { align: "right" });
  doc.setTextColor(15, 23, 42);
  y += 7;

  doc.setFont("helvetica", "normal");

  function addRow(label: string, amount: number, options: { bold?: boolean; total?: boolean } = {}) {
    if (options.total) {
      doc.setFillColor(245, 247, 250);
      doc.rect(tableStartX, y, tableWidth, 9, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(label, colDesc, y + 6);
      doc.text(fmtCurrency(amount, currency), colAmount, y + 6, { align: "right" });
      y += 9;
    } else {
      doc.setFont("helvetica", options.bold ? "bold" : "normal");
      doc.setFontSize(9);
      doc.text(label, colDesc, y + 5);
      doc.text(fmtCurrency(amount, currency), colAmount, y + 5, { align: "right" });
      y += 7;
      doc.setDrawColor(230, 232, 237);
      doc.line(tableStartX, y, tableStartX + tableWidth, y);
    }
  }

  // Base rental
  const baseRental = Number(booking.price_per_day) * Number(booking.total_days);
  addRow(
    `${t.baseRental} (${fmtCurrency(Number(booking.price_per_day), currency)} × ${booking.total_days} ${t.days})`,
    baseRental,
  );

  // Insurance
  if (Number(booking.insurance_total) > 0) {
    const insName = booking.insurance_plan
      ? ((booking.insurance_plan as Record<string, string>)[`name_${lang}`] || booking.insurance_plan.name_en || booking.insurance_plan.code)
      : "";
    addRow(
      `${t.insurance}${insName ? ` — ${insName}` : ""}`,
      Number(booking.insurance_total),
    );
  }

  // Extras (line per extra)
  if (Array.isArray(booking.extras) && booking.extras.length > 0) {
    for (const ex of booking.extras) {
      const extraName = ex.extra
        ? ((ex.extra as Record<string, string>)[`name_${lang}`] || ex.extra.name_en || ex.extra.code)
        : "Extra";
      const qty = ex.quantity > 1 ? ` × ${ex.quantity}` : "";
      addRow(`${t.extras}: ${extraName}${qty}`, Number(ex.subtotal));
    }
  }

  // One-way fee
  if (Number(booking.one_way_fee) > 0) {
    addRow(t.oneWayFee, Number(booking.one_way_fee));
  }

  // Discount (negative)
  if (Number(booking.discount_total) > 0) {
    addRow(`− ${t.discount}`, -Number(booking.discount_total));
  }

  // Tax
  if (Number(booking.tax_total) > 0) {
    addRow(t.tax, Number(booking.tax_total));
  }

  // TOTAL
  addRow(t.total, Number(booking.total_price), { total: true });

  y += 4;

  // Deposit (separate, refundable)
  if (Number(booking.deposit_amount) > 0) {
    doc.setFillColor(254, 243, 199);
    doc.rect(tableStartX, y, tableWidth, 9, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(t.deposit, colDesc, y + 6);
    doc.text(fmtCurrency(Number(booking.deposit_amount), currency), colAmount, y + 6, { align: "right" });
    y += 12;
  }

  // Payment info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const paymentMethodMap: Record<string, string> = {
    stripe: "Stripe (Card)", paypal: "PayPal", bank_transfer: "Bank transfer", cash: "Cash",
  };
  const paymentStatusMap: Record<string, string> = {
    paid: t.paid, pending: t.pending, failed: t.failed, refunded: t.refunded,
  };
  doc.text(`${t.paymentMethod}:`, margin, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(paymentMethodMap[booking.payment_method] || booking.payment_method, margin + 40, y + 5);

  doc.setFont("helvetica", "bold");
  doc.text(`${t.paymentStatus}:`, margin + 100, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(paymentStatusMap[booking.payment_status] || booking.payment_status, margin + 135, y + 5);

  y += 15;

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(t.thankYou, pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setFontSize(7);
  doc.text(
    `${t.generatedAt}: ${fmtDate(new Date().toISOString(), lang)} · RentaKar / rentcars.life`,
    pageWidth / 2, y, { align: "center" },
  );

  // ============== Output ==============
  const pdfArrayBuffer = doc.output("arraybuffer");
  const filename = `invoice-${invoiceNumber}.pdf`;

  return new Response(pdfArrayBuffer, {
    status: 200,
    headers: {
      ...cors,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
});
