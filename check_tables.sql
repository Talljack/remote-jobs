SELECT 
  table_name 
FROM 
  information_schema.tables 
WHERE 
  table_schema = 'public' 
  AND table_name IN ('job_subscriptions', 'notification_queue', 'audit_logs', 'subscription_tag_relations')
ORDER BY 
  table_name;
