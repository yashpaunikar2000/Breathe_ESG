import csv
import io
from datetime import datetime

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import Client, EmissionRecord, ImportBatch
from .serializers import ClientSerializer, EmissionRecordSerializer, ImportBatchSerializer


def parse_float(value, default=None):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def normalize_date(value):
    for fmt in ["%Y-%m-%d", "%d.%m.%Y", "%m/%d/%Y", "%d/%m/%Y"]:
        try:
            return datetime.strptime(value.strip(), fmt).date()
        except Exception:
            continue
    return None


def parse_csv_rows(file_obj):
    text = file_obj.read().decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    return [row for row in reader if any(row.values())]


def choose_emission_factor(material_name, source_type):
    material = (material_name or "").lower()
    if source_type == "utility":
        return 0.42
    if "diesel" in material or "fuel" in material:
        return 2.68
    if "petrol" in material or "gasoline" in material:
        return 2.31
    if "procurement" in material:
        return 1.85
    return 2.0


def parse_sap_row(row):
    keys = {k.lower(): v for k, v in row.items()}
    material = keys.get("material") or keys.get("materialnummer") or keys.get("materialbeschreibung")
    quantity = parse_float(keys.get("quantity") or keys.get("qty") or keys.get("menge") or keys.get("quantity_uom"))
    unit = keys.get("uom") or keys.get("unit") or keys.get("einheit") or "kg"
    activity_date = normalize_date(keys.get("posting date") or keys.get("document date") or keys.get("date"))
    plant = keys.get("plant") or keys.get("plant code") or keys.get("werks")
    if quantity is None:
        quantity = parse_float(keys.get("amount"))
    normalized_quantity = quantity
    emission_factor = choose_emission_factor(material, "sap")
    return {
        "source_row_id": keys.get("document") or keys.get("id") or "",
        "source_category": "procurement" if "procurement" in (material or "").lower() else "fuel",
        "scope": "scope_1",
        "activity_date": activity_date,
        "facility_code": plant,
        "origin": None,
        "destination": None,
        "mode": None,
        "quantity": quantity,
        "quantity_unit": unit,
        "normalized_quantity": normalized_quantity,
        "normalized_unit": unit,
        "emission_kg_co2e": quantity * emission_factor if quantity is not None else None,
    }


def parse_utility_row(row):
    keys = {k.lower(): v for k, v in row.items()}
    period_start = normalize_date(keys.get("period start") or keys.get("start date") or keys.get("from"))
    period_end = normalize_date(keys.get("period end") or keys.get("end date") or keys.get("to"))
    quantity = parse_float(keys.get("usage (kwh)") or keys.get("kwh") or keys.get("consumption") or keys.get("volume"))
    unit = "kWh"
    tariff = keys.get("tariff name") or keys.get("rate") or "standard"
    plant = keys.get("meter id") or keys.get("facility") or ""
    emission_factor = 0.42
    return {
        "source_row_id": keys.get("meter id") or keys.get("invoice") or "",
        "source_category": tariff,
        "scope": "scope_2",
        "activity_date": period_end or period_start,
        "facility_code": plant,
        "origin": None,
        "destination": None,
        "mode": "electricity",
        "quantity": quantity,
        "quantity_unit": unit,
        "normalized_quantity": quantity,
        "normalized_unit": unit,
        "emission_kg_co2e": quantity * emission_factor if quantity is not None else None,
    }


def parse_travel_row(row):
    keys = {k.lower(): v for k, v in row.items()}
    travel_date = normalize_date(keys.get("trip date") or keys.get("date") or keys.get("travel date"))
    category = (keys.get("category") or keys.get("expense type") or "flight").lower()
    origin = keys.get("origin") or keys.get("from") or ""
    destination = keys.get("destination") or keys.get("to") or ""
    mode = keys.get("mode") or ("flight" if "flight" in category else "ground")
    distance = parse_float(keys.get("distance (km)") or keys.get("distance") or keys.get("miles"))
    if distance is None and origin and destination and mode == "flight":
        distance = 800.0
    if distance is None:
        distance = 10.0
    emission_factors = {"flight": 0.18, "hotel": 0.05, "ground": 0.12}
    factor = emission_factors.get(mode, 0.12)
    return {
        "source_row_id": keys.get("trip id") or keys.get("confirmation") or "",
        "source_category": category,
        "scope": "scope_3",
        "activity_date": travel_date,
        "facility_code": None,
        "origin": origin,
        "destination": destination,
        "mode": mode,
        "quantity": distance,
        "quantity_unit": "km",
        "normalized_quantity": distance,
        "normalized_unit": "km",
        "emission_kg_co2e": distance * factor if distance is not None else None,
    }


def parse_rows(source_type, rows):
    parser = {
        "sap": parse_sap_row,
        "utility": parse_utility_row,
        "travel": parse_travel_row,
    }.get(source_type)
    if parser is None:
        return []
    return [parser(row) for row in rows]


@api_view(["GET"])
def client_list(request):
    clients = Client.objects.all()
    serializer = ClientSerializer(clients, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def record_list(request):
    status_filter = request.query_params.get("status")
    queryset = EmissionRecord.objects.all()
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    serializer = EmissionRecordSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def ingest_data(request):
    source_type = request.data.get("source_type")
    ingestion_method = request.data.get("ingestion_method", "csv_upload")
    client_id = request.data.get("client_id")
    raw_file = request.FILES.get("file")
    if not source_type or not raw_file or not client_id:
        return Response({"error": "source_type, client_id, and file are required."}, status=status.HTTP_400_BAD_REQUEST)

    client = get_object_or_404(Client, id=client_id)
    batch = ImportBatch.objects.create(
        client=client,
        source_type=source_type,
        ingestion_method=ingestion_method,
        file_name=raw_file.name,
        raw_payload={"filename": raw_file.name},
    )

    rows = parse_csv_rows(raw_file)
    parsed_rows = parse_rows(source_type, rows)
    records = []
    for index, parsed in enumerate(parsed_rows):
        record = EmissionRecord(
            client=client,
            source=batch,
            source_row_id=parsed.get("source_row_id") or str(index + 1),
            source_category=parsed.get("source_category"),
            scope=parsed.get("scope"),
            activity_date=parsed.get("activity_date"),
            facility_code=parsed.get("facility_code"),
            origin=parsed.get("origin"),
            destination=parsed.get("destination"),
            mode=parsed.get("mode"),
            quantity=parsed.get("quantity"),
            quantity_unit=parsed.get("quantity_unit"),
            normalized_quantity=parsed.get("normalized_quantity"),
            normalized_unit=parsed.get("normalized_unit"),
            emission_kg_co2e=parsed.get("emission_kg_co2e"),
            raw_row=rows[index],
        )
        records.append(record)
    EmissionRecord.objects.bulk_create(records)

    serializer = EmissionRecordSerializer(EmissionRecord.objects.filter(source=batch), many=True)
    return Response({"batch_id": batch.id, "records": serializer.data}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def approve_record(request, pk):
    record = get_object_or_404(EmissionRecord, pk=pk)
    action = request.data.get("action")
    reviewer = request.data.get("reviewed_by", "analyst")
    if action not in ["approve", "reject"]:
        return Response({"error": "action must be approve or reject."}, status=status.HTTP_400_BAD_REQUEST)
    record.status = "approved" if action == "approve" else "rejected"
    record.reviewed_at = timezone.now()
    record.reviewed_by = reviewer
    record.locked_for_audit = True
    record.save()
    serializer = EmissionRecordSerializer(record)
    return Response(serializer.data)
