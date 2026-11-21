-- ════════════════════════════════════════════════════════════════════════════
--  Diaspora Connect — remove ALL records (start clean)
--
--  Run in Supabase → SQL Editor only if test/sample records reached the database.
--  It empties every SACCO and farm table and restarts the numbering at 1.
--  Logins (Authentication → Users) and their roles in `profiles` are kept.
--  This cannot be undone.
-- ════════════════════════════════════════════════════════════════════════════
truncate table
  public.members,
  public.member_applications,
  public.kyc_submissions,
  public.payment_requests,
  public.share_conversions,
  public.loans,
  public.transactions,
  public.investors,
  public.dividends,
  public.period_closes,
  public.sms_messages,
  public.audit_log,
  public.staff,
  public.task_assignments,
  public.app_settings,
  public.mobile_money_payments,
  public.cattle,
  public.milk_logs,
  public.cow_milk_records,
  public.health_records,
  public.breeding_records,
  public.feed_inventory
restart identity;

alter sequence public.member_application_no restart with 1;

-- member logins are unlinked from the removed member records
update public.profiles set member_id = null where role = 'MEMBER';
