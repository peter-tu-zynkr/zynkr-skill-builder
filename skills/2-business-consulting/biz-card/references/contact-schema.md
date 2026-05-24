---
name: contact-schema
description: "Standard 12-field contact schema used to normalize business card data."
---

# Contact Schema

The following schema is used to store all contacts extracted from business cards.

## Fields

| # | Field | Description | Example |
|---|-------|-------------|---------|
| 1 | `name` | Full name (First + Last) | 王大明 / David Wang |
| 2 | `title` | Job title | Business Development Manager |
| 3 | `company` | Company name (full, official) | Zynkr Technology Co., Ltd. |
| 4 | `email` | Primary email | david@zynkr.ai |
| 5 | `phone` | Office phone (with country/area code) | +886-2-1234-5678 |
| 6 | `mobile` | Mobile number | +886-912-345-678 |
| 7 | `website` | Company website | https://zynkr.ai |
| 8 | `address` | Office address | No. 1, Xinyi Rd., Taipei |
| 9 | `linkedin` | LinkedIn URL or handle | linkedin.com/in/davidwang |
| 10 | `industry` | Industry category (inferred if not stated) | SaaS / Enterprise Software |
| 11 | `notes` | Any extra info from card or context | 展場: COMPUTEX 2025 |
| 12 | `card_date` | Date the card was received | 2026-04-08 |

## Normalization Rules

- **name**: If Chinese name, keep full Chinese name; add romanized version if printed on card
- **phone / mobile**: Always include country code (+886 for Taiwan, +86 for China, +1 for US/CA)
- **company**: Use the most complete official name found on the card
- **industry**: Infer from company name/website if not stated; use short category label
- **linkedin**: If not on card, leave blank — do not infer
- **notes**: Record trade show name, booth number, or any verbal context noted at the time
- **card_date**: Default to today's date if not specified by user

## Google Sheet Column Order

Columns map 1:1 to the field order above:
`A=name, B=title, C=company, D=email, E=phone, F=mobile, G=website, H=address, I=linkedin, J=industry, K=notes, L=card_date`
