from rest_framework import serializers
from .models import Client, ImportBatch, EmissionRecord


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ["id", "name", "code"]


class ImportBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportBatch
        fields = [
            "id",
            "client",
            "source_type",
            "ingestion_method",
            "external_id",
            "file_name",
            "imported_at",
        ]


class EmissionRecordSerializer(serializers.ModelSerializer):
    source_type = serializers.CharField(source="source.source_type", read_only=True)

    class Meta:
        model = EmissionRecord
        fields = [
            "id",
            "client",
            "source",
            "source_type",
            "source_row_id",
            "source_category",
            "scope",
            "activity_date",
            "facility_code",
            "origin",
            "destination",
            "mode",
            "quantity",
            "quantity_unit",
            "normalized_quantity",
            "normalized_unit",
            "emission_kg_co2e",
            "status",
            "reviewed_at",
            "reviewed_by",
            "locked_for_audit",
            "raw_row",
            "created_at",
            "updated_at",
        ]
