from django.db import models


class Client(models.Model):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class ImportBatch(models.Model):
    SOURCE_CHOICES = [
        ("sap", "SAP fuel/procurement"),
        ("utility", "Utility electricity"),
        ("travel", "Corporate travel"),
    ]
    INGESTION_CHOICES = [
        ("csv_upload", "CSV upload"),
        ("api_pull", "API pull"),
        ("manual", "Manual entry"),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="batches")
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    ingestion_method = models.CharField(max_length=20, choices=INGESTION_CHOICES)
    external_id = models.CharField(max_length=150, blank=True, null=True)
    file_name = models.CharField(max_length=200, blank=True, null=True)
    raw_payload = models.JSONField(blank=True, null=True)
    imported_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client.code} {self.source_type} {self.imported_at:%Y-%m-%d}"


class EmissionRecord(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]
    SCOPE_CHOICES = [
        ("scope_1", "Scope 1"),
        ("scope_2", "Scope 2"),
        ("scope_3", "Scope 3"),
    ]
    source = models.ForeignKey(ImportBatch, on_delete=models.CASCADE, related_name="records")
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="records")
    source_row_id = models.CharField(max_length=200, blank=True, null=True)
    source_category = models.CharField(max_length=100, blank=True, null=True)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES)
    activity_date = models.DateField(blank=True, null=True)
    facility_code = models.CharField(max_length=100, blank=True, null=True)
    origin = models.CharField(max_length=100, blank=True, null=True)
    destination = models.CharField(max_length=100, blank=True, null=True)
    mode = models.CharField(max_length=50, blank=True, null=True)
    quantity = models.FloatField(blank=True, null=True)
    quantity_unit = models.CharField(max_length=30, blank=True, null=True)
    normalized_quantity = models.FloatField(blank=True, null=True)
    normalized_unit = models.CharField(max_length=30, blank=True, null=True)
    emission_kg_co2e = models.FloatField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    raw_row = models.JSONField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.CharField(max_length=100, blank=True, null=True)
    locked_for_audit = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.source_type_display()} {self.activity_date} {self.status}"

    def source_type_display(self):
        return self.source.source_type
