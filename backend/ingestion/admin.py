from django.contrib import admin
from .models import Client, ImportBatch, EmissionRecord


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "code"]
    search_fields = ["name", "code"]


@admin.register(ImportBatch)
class ImportBatchAdmin(admin.ModelAdmin):
    list_display = ["id", "client", "source_type", "ingestion_method", "file_name", "imported_at"]
    list_filter = ["source_type", "ingestion_method"]
    search_fields = ["file_name", "external_id"]


@admin.register(EmissionRecord)
class EmissionRecordAdmin(admin.ModelAdmin):
    list_display = ["id", "client", "source", "scope", "activity_date", "status", "emission_kg_co2e"]
    list_filter = ["scope", "status", "locked_for_audit"]
    search_fields = ["source_row_id", "facility_code", "origin", "destination"]
