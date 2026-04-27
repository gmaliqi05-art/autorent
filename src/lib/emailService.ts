import { supabase } from './supabase';

export type EmailType =
  | 'booking_confirmation_client'
  | 'booking_confirmation_company'
  | 'booking_approved'
  | 'booking_rejected'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'pickup_reminder'
  | 'review_request'
  | 'company_approved'
  | 'company_rejected'
  | 'company_suspended'
  | 'welcome_client'
  | 'welcome_company'
  | 'booking_invoice';

interface EmailData {
  recipientEmail: string;
  recipientName: string;
  emailType: EmailType;
  templateData: Record<string, any>;
  referenceId?: string;
  referenceType?: string;
}

const EMAIL_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;

export async function sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('No active session for sending email');
      return { success: false, error: 'No active session' };
    }

    const response = await fetch(EMAIL_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email sending failed:', errorText);
      return { success: false, error: errorText };
    }

    await response.json();
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendBookingConfirmationToClient(
  clientEmail: string,
  clientName: string,
  bookingData: {
    bookingId: string;
    vehicleName: string;
    companyName: string;
    pickupDate: string;
    returnDate: string;
    totalDays: number;
    pricePerDay: number;
    deposit: number;
    paymentMethod: string;
    totalPrice: number;
    status: string;
  }
) {
  const dashboardUrl = `${window.location.origin}/dashboard/bookings`;
  const supportEmail = 'info@rentakar.com';

  return sendEmail({
    recipientEmail: clientEmail,
    recipientName: clientName,
    emailType: 'booking_confirmation_client',
    templateData: {
      ...bookingData,
      dashboardUrl,
      supportEmail,
    },
    referenceId: bookingData.bookingId,
    referenceType: 'booking',
  });
}

export async function sendBookingNotificationToCompany(
  companyEmail: string,
  companyName: string,
  bookingData: {
    bookingId: string;
    vehicleName: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    pickupDate: string;
    returnDate: string;
    totalDays: number;
    totalPrice: number;
    paymentMethod: string;
  }
) {
  const dashboardUrl = `${window.location.origin}/company/bookings`;

  return sendEmail({
    recipientEmail: companyEmail,
    recipientName: companyName,
    emailType: 'booking_confirmation_company',
    templateData: {
      ...bookingData,
      dashboardUrl,
    },
    referenceId: bookingData.bookingId,
    referenceType: 'booking',
  });
}

export async function sendBookingApprovedEmail(
  clientEmail: string,
  clientName: string,
  bookingData: {
    bookingId: string;
    vehicleName: string;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    pickupDate: string;
    returnDate: string;
    pickupLocation: string;
    totalPrice: number;
  }
) {
  const dashboardUrl = `${window.location.origin}/dashboard/bookings`;
  const supportEmail = 'info@rentakar.com';

  return sendEmail({
    recipientEmail: clientEmail,
    recipientName: clientName,
    emailType: 'booking_approved',
    templateData: {
      ...bookingData,
      dashboardUrl,
      supportEmail,
    },
    referenceId: bookingData.bookingId,
    referenceType: 'booking',
  });
}

export async function sendBookingRejectedEmail(
  clientEmail: string,
  clientName: string,
  bookingData: {
    bookingId: string;
    vehicleName: string;
    pickupDate: string;
    returnDate: string;
    rejectionReason: string;
  }
) {
  const searchUrl = `${window.location.origin}/vehicles`;
  const supportEmail = 'info@rentakar.com';

  return sendEmail({
    recipientEmail: clientEmail,
    recipientName: clientName,
    emailType: 'booking_rejected',
    templateData: {
      ...bookingData,
      searchUrl,
      supportEmail,
    },
    referenceId: bookingData.bookingId,
    referenceType: 'booking',
  });
}

export async function sendBookingCompletedEmail(
  clientEmail: string,
  clientName: string,
  bookingData: {
    bookingId: string;
    vehicleName: string;
    pickupDate: string;
    returnDate: string;
  }
) {
  const reviewUrl = `${window.location.origin}/dashboard/bookings?review=${bookingData.bookingId}`;
  const searchUrl = `${window.location.origin}/vehicles`;

  return sendEmail({
    recipientEmail: clientEmail,
    recipientName: clientName,
    emailType: 'booking_completed',
    templateData: {
      ...bookingData,
      reviewUrl,
      searchUrl,
    },
    referenceId: bookingData.bookingId,
    referenceType: 'booking',
  });
}

export async function sendBookingCancelledEmail(
  clientEmail: string,
  clientName: string,
  bookingData: {
    bookingId: string;
    vehicleName: string;
    cancelDate: string;
  }
) {
  const searchUrl = `${window.location.origin}/vehicles`;

  return sendEmail({
    recipientEmail: clientEmail,
    recipientName: clientName,
    emailType: 'booking_cancelled',
    templateData: {
      ...bookingData,
      searchUrl,
    },
    referenceId: bookingData.bookingId,
    referenceType: 'booking',
  });
}

export async function sendPickupReminderEmail(
  clientEmail: string,
  clientName: string,
  bookingData: {
    bookingId: string;
    vehicleName: string;
    companyName: string;
    companyPhone: string;
    pickupDate: string;
    pickupTime: string;
    pickupLocation: string;
    deposit: number;
  }
) {
  const dashboardUrl = `${window.location.origin}/dashboard/bookings`;

  return sendEmail({
    recipientEmail: clientEmail,
    recipientName: clientName,
    emailType: 'pickup_reminder',
    templateData: {
      ...bookingData,
      dashboardUrl,
    },
    referenceId: bookingData.bookingId,
    referenceType: 'booking',
  });
}

export async function sendReviewRequestEmail(
  clientEmail: string,
  clientName: string,
  bookingData: {
    bookingId: string;
    vehicleName: string;
  }
) {
  const reviewUrl = `${window.location.origin}/dashboard/bookings?review=${bookingData.bookingId}`;

  return sendEmail({
    recipientEmail: clientEmail,
    recipientName: clientName,
    emailType: 'review_request',
    templateData: {
      ...bookingData,
      reviewUrl,
    },
    referenceId: bookingData.bookingId,
    referenceType: 'booking',
  });
}

export async function sendCompanyApprovedEmail(
  companyEmail: string,
  companyName: string,
  companyId: string
) {
  const dashboardUrl = `${window.location.origin}/company/dashboard`;
  const supportEmail = 'info@rentakar.com';
  const supportPhone = '+383 49 400 006';

  return sendEmail({
    recipientEmail: companyEmail,
    recipientName: companyName,
    emailType: 'company_approved',
    templateData: {
      companyName,
      dashboardUrl,
      supportEmail,
      supportPhone,
    },
    referenceId: companyId,
    referenceType: 'company',
  });
}

export async function sendCompanyRejectedEmail(
  companyEmail: string,
  companyName: string,
  companyId: string,
  rejectionReason: string
) {
  const supportEmail = 'info@rentakar.com';
  const supportPhone = '+383 49 400 006';

  return sendEmail({
    recipientEmail: companyEmail,
    recipientName: companyName,
    emailType: 'company_rejected',
    templateData: {
      companyName,
      rejectionReason,
      supportEmail,
      supportPhone,
    },
    referenceId: companyId,
    referenceType: 'company',
  });
}

export async function sendCompanySuspendedEmail(
  companyEmail: string,
  companyName: string,
  companyId: string,
  suspensionReason: string
) {
  const supportEmail = 'info@rentakar.com';
  const supportPhone = '+383 49 400 006';

  return sendEmail({
    recipientEmail: companyEmail,
    recipientName: companyName,
    emailType: 'company_suspended',
    templateData: {
      companyName,
      suspensionReason,
      supportEmail,
      supportPhone,
    },
    referenceId: companyId,
    referenceType: 'company',
  });
}

export async function sendWelcomeClientEmail(
  clientEmail: string,
  clientName: string,
  userId: string
) {
  const searchUrl = `${window.location.origin}/vehicles`;
  const supportEmail = 'info@rentakar.com';

  return sendEmail({
    recipientEmail: clientEmail,
    recipientName: clientName,
    emailType: 'welcome_client',
    templateData: {
      clientName,
      searchUrl,
      supportEmail,
    },
    referenceId: userId,
    referenceType: 'user',
  });
}

export async function sendWelcomeCompanyEmail(
  companyEmail: string,
  companyName: string,
  companyId: string
) {
  const dashboardUrl = `${window.location.origin}/company/dashboard`;
  const supportEmail = 'info@rentakar.com';
  const supportPhone = '+383 49 400 006';

  return sendEmail({
    recipientEmail: companyEmail,
    recipientName: companyName,
    emailType: 'welcome_company',
    templateData: {
      companyName,
      dashboardUrl,
      supportEmail,
      supportPhone,
    },
    referenceId: companyId,
    referenceType: 'company',
  });
}

export async function sendBookingInvoiceEmail(
  clientEmail: string,
  clientName: string,
  invoiceData: {
    bookingId: string;
    invoiceDate: string;
    clientPhone: string;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    vehicleName: string;
    pickupDate: string;
    returnDate: string;
    totalDays: number;
    pricePerDay: number;
    subtotal: number;
    deposit: number;
    paymentMethod: string;
    totalPrice: number;
  }
) {
  const invoiceUrl = `${window.location.origin}/dashboard/bookings/invoice/${invoiceData.bookingId}`;
  const supportEmail = 'info@rentakar.com';
  const supportPhone = '+383 49 400 006';

  return sendEmail({
    recipientEmail: clientEmail,
    recipientName: clientName,
    emailType: 'booking_invoice',
    templateData: {
      ...invoiceData,
      clientName,
      clientEmail,
      invoiceUrl,
      supportEmail,
      supportPhone,
    },
    referenceId: invoiceData.bookingId,
    referenceType: 'booking',
  });
}
