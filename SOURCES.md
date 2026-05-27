# SOURCES.md

## SAP fuel and procurement
- Real-world format: enterprise SAP exports are often delivered as CSV extracts from IDocs, OData services, or spreadsheet reports.
- What I learned: SAP headers vary by language and configuration; material descriptions, plant codes, and unit columns are common; dates may be in German format or U.S./ISO formats.
- Sample data shape: rows with `Material`, `Quantity`, `UoM`, `Plant`, `Posting Date`, `Document`.
- What would break in real deployment: if the CSV uses complex IDoc nested segments, if quantities are in different units without a unit conversion map, or if plant codes require a separate master-data lookup.

## Utility electricity
- Real-world format: utility portal exports typically provide CSV downloads with meter IDs, billing period start/end, consumption kWh, and tariff details.
- What I learned: meter readings may be separate from invoice dates; facility codes and tariff names are often needed to map to cost centers.
- Sample data shape: rows with `Meter ID`, `Period Start`, `Period End`, `Usage (kWh)`, `Tariff Name`, `Invoice Number`.
- What would break in real deployment: if a utility exports data only as PDF bills, if billing periods are irregular or span multiple months, or if usage units are not standardized to kWh.

## Corporate travel
- Real-world format: Concur and Navan exports often include trip dates, expense categories, origin/destination codes, distances, and line item IDs.
- What I learned: distance may be missing, category labels vary, and flights/hotels/ground transport need different emission factors.
- Sample data shape: rows with `Trip ID`, `Trip Date`, `Category`, `Origin`, `Destination`, `Mode`, `Distance (km)`.
- What would break in real deployment: if the travel export omits distances entirely, if airport codes require geocoding, or if the travel platform provides more complex itinerary details than a flat expense export.
