---
name: biz-card-config
description: "Configuration for the business card pipeline skill — Google Sheet target, column mapping, and email defaults."
---

# Business Card Pipeline Config

## Google Sheet

| Setting | Value |
|---------|-------|
| **Sheet ID** | `1Y4ImMHewm3BXRj-msTD8Y-nZtRBPWcDRBt6CfczLZ5A` |
| **Sheet Name** | `B2B Customer List` |
| **Sheet Tab Name** | `Sheet2` |
| **Header Row** | Row 1 (auto-created if missing) |
| **Data Start Row** | Row 2 |

### Column Mapping (A → L)

| Column | Field |
|--------|-------|
| A | name |
| B | title |
| C | company |
| D | email |
| E | phone |
| F | mobile |
| G | website |
| H | address |
| I | linkedin |
| J | industry |
| K | notes |
| L | card_date |

## Supabase CRM (Contacts)

Each card is also written to the live Zynkr CRM so it appears on the contacts page.
This is a dual-write — the Sheet above stays as the full-fidelity record.

| Setting | Value |
|---------|-------|
| **Project ID** | `uomieoqlkazknjgmfdda` (shared `Zynkr` Supabase project; CRM tables are `crm_*`) |
| **Table** | `crm_contacts` |
| **Contacts page** | `https://zynkr-crm.vercel.app/contacts` |
| **Owner** | `peter_tu@zynkr.ai` → looked up to `owner_id` in the SQL |
| **Insert template** | `./references/contact-insert.sql` (find-or-create company + dedup-by-email) |

### Contact defaults (baked into `contact-insert.sql` — change there, not in prose)

| Field | Default | Why |
|-------|---------|-----|
| `lifecycle_stage` | `lead` (潛在客戶) | a freshly-met card is top-of-funnel |
| `legal_basis` | `consent` (同意) | required field; the card was handed over |
| `lead_status` | `other` (其他) | "met in person / event" has no dedicated enum |
| `deal_status` | `NULL` | not a deal yet |

### Card → CRM field mapping (only 5 of the 12 fields have a column)

| Card field | `crm_contacts` column |
|------------|-----------------------|
| name | `last_name` (whole name as printed; `first_name` left blank so it renders exactly) |
| title | `title` |
| company | `company_id` (find-or-create) |
| email | `email` (dedup key) |
| mobile *or* phone | `phone` |

mobile/website/address/linkedin/industry/notes/card_date have no CRM column — they
stay in the Google Sheet only.

## Google Account

```
user_google_email: <your-google-workspace-account>
```

## Email Defaults

| Setting | Value |
|---------|-------|
| **From** | <your-google-workspace-account> |
| **Default action** | Save as Draft (never auto-send) |
| **Language** | Match the contact's card language (Chinese card → Traditional Chinese email; English card → English email) |
| **Tone** | Professional, warm, brief — reference one specific detail from company research |
| **Style guide** | TBD — outbound reference examples to be added in v2 |

## Email Signature Placeholder

```
---
Peter Tu
[Title] | Zynkr
<your-google-workspace-account>
```

> Note: Update this signature once confirmed. It will be appended to every drafted email.
