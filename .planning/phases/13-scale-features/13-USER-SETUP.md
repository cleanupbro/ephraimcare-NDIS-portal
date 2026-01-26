# Phase 13: User Setup Required

**Generated:** 2026-01-27
**Phase:** 13-scale-features
**Status:** Incomplete

Complete these items for SMS notifications to function. Claude automated everything possible; these items require human access to external dashboards/accounts.

## Twilio SMS Configuration

### Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `TWILIO_ACCOUNT_SID` | Twilio Console -> Account -> Account SID | Organization settings via admin dashboard |
| [ ] | `TWILIO_AUTH_TOKEN` | Twilio Console -> Account -> Auth Token | Organization settings via admin dashboard |

**Note:** These credentials are stored per-organization in the database (not .env.local) for multi-tenant isolation.

### Account Setup

- [ ] **Create Twilio account** (if needed)
  - URL: https://www.twilio.com/try-twilio
  - Skip if: Already have Twilio account

### Dashboard Configuration

- [ ] **Purchase Australian phone number**
  - Location: Twilio Console -> Phone Numbers -> Buy a Number
  - Requirements:
    - Country: Australia
    - Capabilities: SMS (Voice optional)
  - Note: Monthly cost applies (~$1.50/month for AU numbers)
  - Store the purchased number in organization settings

- [ ] **Enable SMS in organization settings**
  - Location: Admin Dashboard -> Settings -> Integrations
  - Toggle SMS notifications ON
  - Enter Account SID, Auth Token, and Phone Number

### Local Development

For local testing without sending real SMS:
1. Use Twilio test credentials (don't incur charges)
2. Test phone numbers: +15005550006 always succeeds

```bash
# Twilio Magic Numbers for testing
+15005550006  # Always succeeds
+15005550001  # Invalid number error
```

## Verification

After completing setup, verify with:

1. Go to Admin Dashboard -> Settings -> Integrations
2. Click "Send Test SMS"
3. Enter your mobile number
4. Check phone for test message

Expected results:
- Test SMS received on phone
- sms_logs table shows new entry with status='sent'

```bash
# Check sms_logs table (via Supabase Dashboard or SQL)
SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 5;
```

---

**Once all items complete:** Mark status as "Complete" at top of file.
