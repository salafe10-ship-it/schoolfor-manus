# DB-001-NONACC-019 — Canonical Notification Read/Write Parity

## Mission result

The notification repository now uses `notification_queue` as its only canonical persistence source. The implementation follows the consultant decision `NOTIFICATION-CONTRACT-005` and does not modify SQL, migrations, RLS, Storage, staging, or production.

## Implemented contract

- `tenant_id` is the tenant boundary for every inbox read and write.
- `recipientUserId` maps to `recipient_user_id`.
- `low`, `normal`, `high`, `urgent`, and `critical` map to priorities `1` through `5`.
- Canonical channels are `email`, `sms`, `push`, `in_app`, and `webhook`.
- Legacy channel values are normalized without false semantic claims; legacy identity is preserved in payload when required.
- The canonical persistence lifecycle is `queued`, `processing`, `delivered`, `failed`, and `dead_letter`.
- `read`, `archived`, `pending`, `sending`, and `sent` are rejected as persistence statuses; `read/unread` remains a separate interaction concern.
- The payload contract contains `module`, `reference`, `category`, `subject`, `body`, and `language`.
- The notification id is used as the stable idempotency key for the write.

## Failure behavior

- Missing canonical client fails the operation.
- Supabase insert errors are propagated.
- Supabase read errors are propagated.
- No local fallback success is returned.
- No automatic retry is performed.
- Inbox reads require both tenant and recipient predicates and exclude soft-deleted rows.

## Scope control

Modified implementation scope is limited to the NotificationRepository, notification types, notification-specific tests, and notification-specific documentation. No schema or deployment mutation was performed.

