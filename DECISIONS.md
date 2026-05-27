# DECISIONS.md

## Ambiguity resolutions

### General app scope
- I chose a Django REST backend with React frontend because the assignment specifically asked for those technologies.
- The prototype focuses on ingestion, normalization, and analyst review rather than full auditing or certification.

### SAP source choice
- I modeled SAP ingestion as a CSV upload representing a flat export.
- Justification: SAP data is often delivered as spreadsheet extracts from IDoc or OData exports in an implementation context, and a prototype should handle the realistic case where an enterprise sustainability team gives a CSV.
- Handled subset: fuel and procurement lines, German/English headers, inconsistent unit labels, and several date formats.
- Ignored: full BAPI/OData integration, deep SAP master data mapping, and real IDoc structure.

### Utility electricity source
- I chose portal CSV export as the ingestion mechanism.
- Justification: facilities teams frequently download CSV exports from utility portals; CSV gives a realistic and testable prototype while still showing alignment and unit normalization.
- Handled subset: billing period start/end, meter ID, tariff, kWh usage, and non-calendar-period handling.
- Ignored: PDF bill parsing, utility API integration, and tariff seasonality.

### Travel source
- I modeled corporate travel as a CSV expense export with trips, categories, origin, and destination.
- Justification: Concur and Navan frequently offer CSV/expense report exports for expense review and auditing, and this is a realistic initial source shape.
- Handled subset: flights, hotels, ground transport, airport codes, and distance-based emission estimation.
- Ignored: detailed itinerary parsing, exact flight leg calculations, and external API lookups for airports.

## What I would ask the PM

- What exact client onboarding integration points are highest priority: API pull versus file ingestion?
- Should we support both raw billing invoices (PDF) and structured portal exports for utilities?
- What level of facility metadata lookup should we include for plant codes and meter IDs?
- Are we expected to persist finalized audit approvals as an immutable ledger?
