import { supabase } from './supabase';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  referenceType?: string;
  /**
   * Opsional. Identifikues per template push notification (psh 'booking_approved').
   * Kur set, push notification render-ohet ne gjuhen e recipient-it
   * ne edge function (jo gjuhen e sender-it). In-app notification perdor
   * title/message e ruajtur. Shih supabase/functions/send-push-notification
   * per template-t e disponueshme.
   */
  templateKey?: string;
  templateVars?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    reference_id: params.referenceId || null,
    reference_type: params.referenceType || null,
    template_key: params.templateKey || null,
    template_vars: params.templateVars || {},
  });
  return { error };
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  return { error };
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return { error };
}
