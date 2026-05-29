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
    is_suspicious = serializers.SerializerMethodField()
    validation_errors = serializers.SerializerMethodField()

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
            "is_suspicious",
            "validation_errors",
            "created_at",
            "updated_at",
        ]

    def get_is_suspicious(self, obj):
        import datetime
        # Check quantity limits
        if obj.quantity is not None:
            st = obj.source.source_type
            if st == "sap" and obj.quantity > 1000:
                return True
            if st == "utility" and obj.quantity > 12000:
                return True
            if st == "travel" and obj.quantity > 5000:
                return True
        # Missing facility code for SAP imports
        if obj.source.source_type == "sap" and not obj.facility_code:
            return True
        # Missing origin/destination for flights
        if obj.source.source_type == "travel" and obj.mode == "flight" and (not obj.origin or not obj.destination):
            return True
        # Out of bounds date
        if obj.activity_date:
            try:
                if obj.activity_date > datetime.date.today():
                    return True
                if obj.activity_date < datetime.date(2023, 1, 1):
                    return True
            except Exception:
                pass
        return False

    def get_validation_errors(self, obj):
        errors = []
        if not obj.activity_date:
            errors.append("Invalid or missing activity date")
        if obj.quantity is None:
            errors.append("Could not parse quantity value")
        if obj.emission_kg_co2e is None:
            errors.append("Carbon footprint calculation failed")
        return errors

