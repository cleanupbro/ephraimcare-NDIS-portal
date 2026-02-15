# Support & Costs

This document covers what the Ephraim Care Portal costs to run, what support is included, and how to get help.

---

## Monthly Running Costs

Your portal runs on free-tier cloud services. Here's the breakdown:

| Service | What It Does | Monthly Cost |
|---------|-------------|--------------|
| **Vercel** (hosting) | Hosts both web portals (admin + participant) | **$0** (free tier) |
| **Supabase** (database) | Stores all your data — participants, shifts, invoices, etc. | **$0** (free tier) |
| **Resend** (email) | Sends worker invite emails and notifications | **$0** (free tier, up to 100 emails/day) |
| **GitHub** (code storage) | Stores the code so Vercel can auto-deploy updates | **$0** (free tier) |

### Total: $0/month

> The free tiers are generous and will cover you well into hundreds of participants. You'll only need to upgrade if you exceed: 50,000 monthly page views (Vercel), 500MB database storage (Supabase), or 100 emails/day (Resend).

### When Would Costs Increase?

| Trigger | Approximate Cost |
|---------|-----------------|
| Supabase Pro (if you exceed free tier limits) | ~$25/month |
| Vercel Pro (if you need more performance) | ~$20/month |
| Custom email domain (@ephraimcare.com.au emails) | ~$3/month |
| Twilio SMS (shift reminders to workers) | ~$0.05 per SMS |
| Xero integration (accounting sync) | Already included in your Xero subscription |

---

## What's Included

Your platform comes with:

- Admin Portal — fully functional, auto-deploys from GitHub
- Participant Portal — fully functional, auto-deploys from GitHub
- Worker Mobile App — built and testable via Expo Go
- All documentation and guides (this folder)
- 6 sample participants and 7 workers pre-loaded for testing
- Sample invoices and shifts for reference

---

## What's NOT Yet Configured (Optional Add-Ons)

These features are built into the system but require configuration:

| Feature | What's Needed | Difficulty |
|---------|--------------|------------|
| **SMS Notifications** | Twilio account + API keys added to Vercel | Easy (30 min setup) |
| **Xero Accounting Sync** | Connect your Xero account in portal Settings | Easy (15 min setup) |
| **Custom Email Sender** | Verify your domain with Resend | Medium (1 hour) |
| **App Store Publishing** | Apple Developer + Google Play accounts | Medium (requires review process) |

---

## Getting Help

### For Questions About Using the Portal
- Refer to the guides in this folder first
- Contact OpBros.ai for anything not covered

### For Bug Reports or Feature Requests
- Email: contact@opbros.online
- Website: https://opbros.online
- Describe what happened, what you expected, and include a screenshot if possible

### For Urgent Issues (Portal Down)
- Contact OpBros.ai directly
- We'll check Vercel and Supabase status and resolve

---

## Future Features (Roadmap Ideas)

These are features that can be added if you want to grow the platform:

| Feature | Description |
|---------|-------------|
| **Document Management** | Upload and store participant documents (NDIS plans, medical reports) |
| **AI Shift Suggestions** | Automatically suggest best worker-participant matches based on history |
| **Family Portal** | Read-only access for participant families to view progress |
| **Bulk SMS** | Send shift reminders or announcements to multiple workers at once |
| **Reports Dashboard** | Visual charts showing revenue, shift hours, and compliance trends |
| **Worker Mobile App (Published)** | Publish the mobile app to App Store and Google Play |

Contact OpBros.ai to discuss pricing and timelines for any of these.

---

## Built By

**OpBros.ai** — Shamal + Hafsah
- Email: contact@opbros.online
- Web: https://opbros.online
