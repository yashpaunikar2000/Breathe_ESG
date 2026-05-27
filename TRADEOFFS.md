# TRADEOFFS.md

## Deliberate omissions

1. Full SAP API integration
- I did not build a direct SAP OData/BAPI connector.
- Reason: the assignment can be prototyped realistically using exported CSVs, and integrating with SAP APIs would require far more infrastructure and access than a 4-day prototype should assume.

2. PDF bill parsing for utility data
- I did not build a PDF invoice parser.
- Reason: CSV portal exports are a common facilities-team format and allow the prototype to focus on normalization and review rather than brittle PDF OCR.

3. Fine-grained travel itinerary enrichment
- I did not implement airport lookup, route distance calculation, or multipiece itinerary parsing.
- Reason: for a first pass, a CSV-based travel export with category-based emission factors is realistic and easier to validate than a full travel-API integration.
