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
