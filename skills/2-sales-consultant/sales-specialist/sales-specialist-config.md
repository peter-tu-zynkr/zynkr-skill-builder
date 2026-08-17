---
name: sales-specialist-config
description: "Configuration for the business card pipeline skill — Zynkr platform target, field mapping, and email defaults."
---

# Business Card Pipeline Config

## Zynkr platform (the only destination)

| Setting | Value |
|---------|-------|
| **Project ID** | `uomieoqlkazknjgmfdda` (shared `Zynkr` Supabase project; platform tables are `crm_*`) |
| **Tables** | `crm_contacts` · `crm_companies` · `crm_activities` (the 名片 note) |
| **Contacts page** | `https://platform.zynkr.ai/contacts` |
| **Owner** | `peter_tu@zynkr.ai` → looked up to `owner_id` in the SQL |
| **Insert template** | `./references/contact-insert.sql` (find-or-create company, enrich blanks, dedup-by-email, attach note) |

### Card → platform field mapping (all 12 fields have a home)

| Card field | Lands in |
|------------|----------|
| name | `crm_contacts.last_name` (whole name as printed; `first_name` left blank so it renders exactly) |
| title | `crm_contacts.title` |
| email | `crm_contacts.email` (dedup key) |
| mobile | `crm_contacts.phone` |
| company | `crm_companies.name` (find-or-create) |
| website | `crm_companies.domain` (SQL strips scheme and `www.`) |
| industry | `crm_companies.industry` |
| address | `crm_companies.address` |
| phone (office) | `crm_companies.phone` |
| linkedin · notes · card_date | body of the `名片` note on the contact (`crm_activities`, `kind='note'`) |

Enriching an existing company only fills columns that are still `NULL`, so a card
can never overwrite something curated by hand.

### Contact defaults (baked into `contact-insert.sql` — change there, not in prose)

| Field | Default | Why |
|-------|---------|-----|
| `lifecycle_stage` | `lead` (prospect) | a freshly-met card is top-of-funnel |
| `legal_basis` | `consent` | required field; the card was handed over |
| `lead_status` | `other` | "met in person / event" has no dedicated enum |
| `deal_status` | `NULL` | not a deal yet |

## Retired: the B2B Customer List Sheet

Until 2026-08-17 each card was **also** appended to a Google Sheet
(`1Y4ImMHewm3BXRj-msTD8Y-nZtRBPWcDRBt6CfczLZ5A`, tab `Sheet2`, columns A–L =
the 12 fields in schema order), because `crm_contacts` had no column for 7 of them.
`crm_companies` has since grown `domain` / `industry` / `address` / `phone`, so the
platform holds the entire card and the dual-write was dropped.

**Do not append to that Sheet.** It stays readable as the historical record of
cards captured before the cutover; anything newer lives on the platform.

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
