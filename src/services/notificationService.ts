import { supabase } from '@/integrations/supabase/client';

export const notificationService = {
  // README: sendNotification(userId, message)
  async send(userId: string, message: string) {
    const { error } = await supabase.from('notifications').insert({ user_id: userId, message });
    if (error) throw error;
  },

  // Alias for README name
  async sendNotification(userId: string, message: string) {
    return this.send(userId, message);
  },

  // README: getNotifications(userId)
  async getNotifications(userId: string) {
    const { data, error } = await supabase.from('notifications')
      .select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Legacy alias
  async getByUser(userId: string) {
    return this.getNotifications(userId);
  },

  // README: markAsRead(notificationId)
  async markAsRead(notificationId: string) {
    const { error } = await supabase.from('notifications')
      .update({ is_read: true }).eq('notification_id', notificationId);
    if (error) throw error;
  },

  // README: markAllAsRead(userId)
  async markAllAsRead(userId: string) {
    const { error } = await supabase.from('notifications')
      .update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    if (error) throw error;
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('is_read', false);
    if (error) throw error;
    return count || 0;
  },
};
