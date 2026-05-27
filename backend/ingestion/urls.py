from django.urls import path
from .views import client_list, ingest_data, record_list, approve_record

urlpatterns = [
    path("clients/", client_list, name="client-list"),
    path("ingest/", ingest_data, name="ingest-data"),
    path("records/", record_list, name="record-list"),
    path("records/<int:pk>/review/", approve_record, name="record-review"),
]
