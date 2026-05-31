/*
  # Aktivizon Supabase Realtime per tabelen notifications

  Pa kete, NotificationBell ne UI nuk merr update-e live — duhet refresh.
  Me kete, kambana shfaq njoftime te reja menjehere kur insertohen.

  REPLICA IDENTITY FULL = perfshin te gjitha kolonat ne update events
  (e nevojshme per qe payload.new te kete te dhena te plota).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
