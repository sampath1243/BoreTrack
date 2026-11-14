from rest_framework import serializers
from .models import *

class AgentSerializer(serializers.ModelSerializer):
    class Meta: model = Agent; fields = "__all__"

class CustomerSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source="agent.name", read_only=True)
    class Meta: model = Customer; fields = "__all__"; extra_fields = ["agent_name"]

class MachineSerializer(serializers.ModelSerializer):
    class Meta: model = Machine; fields = "__all__"

class WorkerSerializer(serializers.ModelSerializer):
    class Meta: model = Worker; fields = "__all__"

class JobSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    agent_name = serializers.CharField(source="agent.name", read_only=True)
    machine_name = serializers.CharField(source="machine.name", read_only=True)
    points_count = serializers.IntegerField(source="points.count", read_only=True)
    class Meta: model = Job; fields = "__all__"

class PointSerializer(serializers.ModelSerializer):
    calculated_depth = serializers.SerializerMethodField()
    def get_calculated_depth(self, obj): return float(obj.calculated_depth())
    class Meta: model = Point; fields = "__all__"

class CasingLineSerializer(serializers.ModelSerializer):
    class Meta: model = CasingLine; fields = "__all__"

class JobChargeSerializer(serializers.ModelSerializer):
    class Meta: model = JobCharge; fields = "__all__"

class AttendanceSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.name", read_only=True)
    class Meta: model = Attendance; fields = "__all__"

class PaymentSerializer(serializers.ModelSerializer):
    class Meta: model = Payment; fields = "__all__"

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta: model = Expense; fields = "__all__"

class MaintenanceSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source="machine.name", read_only=True)
    class Meta: model = Maintenance; fields = "__all__"

class WorkerAdvanceSerializer(serializers.ModelSerializer):
    class Meta: model = WorkerAdvance; fields = "__all__"

class FuelLogSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source="machine.name", read_only=True)
    job_code = serializers.SerializerMethodField()
    total_cost = serializers.SerializerMethodField()
    def get_job_code(self, obj): return f"BT-{obj.job_id:04d}" if obj.job_id else None
    def get_total_cost(self, obj): return float(obj.total_cost)
    class Meta: model = FuelLog; fields = "__all__"

class MachineOperationSerializer(serializers.ModelSerializer):
    running_hours = serializers.SerializerMethodField()
    machine_name = serializers.CharField(source="machine.name", read_only=True)
    def get_running_hours(self, obj): return float(obj.running_hours)
    class Meta: model = MachineOperation; fields = "__all__"

class BreakdownSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source="machine.name", read_only=True)
    downtime_hours = serializers.SerializerMethodField()
    total_repair_cost = serializers.SerializerMethodField()
    def get_downtime_hours(self, obj):
        if not obj.resolved_at: return None
        return round((obj.resolved_at - obj.started_at).total_seconds()/3600, 2)
    def get_total_repair_cost(self, obj): return float(obj.parts_cost + obj.labour_cost)
    class Meta: model = Breakdown; fields = "__all__"


class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    agent_name = serializers.CharField(source="agent.name", read_only=True)
    class Meta: model = Booking; fields = "__all__"

class SiteInspectionSerializer(serializers.ModelSerializer):
    booking_code = serializers.SerializerMethodField()
    def get_booking_code(self, obj): return str(obj.booking)
    class Meta: model = SiteInspection; fields = "__all__"


class RateLineSerializer(serializers.ModelSerializer):
    charge_type_display = serializers.CharField(source="get_charge_type_display", read_only=True)
    class Meta:
        model = RateLine
        fields = "__all__"

class RateCardSerializer(serializers.ModelSerializer):
    lines = RateLineSerializer(many=True, read_only=True)
    class Meta:
        model = RateCard
        fields = "__all__"

class WageSettlementSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.name", read_only=True)
    class Meta:
        model = WageSettlement
        fields = "__all__"
        read_only_fields = ["gross_wage", "net_payable", "status"]

class JobFileSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    def get_uploaded_by_name(self, obj): return obj.uploaded_by.username if obj.uploaded_by else None
    def get_file_url(self, obj):
        try: return obj.file.url
        except Exception: return None
    class Meta:
        model = JobFile
        fields = "__all__"
        read_only_fields = ["uploaded_by"]

class JobLocationSerializer(serializers.ModelSerializer):
    captured_by_name = serializers.SerializerMethodField()
    def get_captured_by_name(self, obj): return obj.captured_by.username if obj.captured_by else None
    class Meta:
        model = JobLocation
        fields = "__all__"
        read_only_fields = ["captured_by"]
