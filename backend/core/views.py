from django.db.models import Sum, Count, F
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .permissions import BoreTrackRolePermission
from rest_framework.response import Response
from .models import *
from .serializers import *

class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [BoreTrackRolePermission]
    boretrack_module = None

class BookingViewSet(BaseViewSet):
    boretrack_module = "bookings"
    queryset = Booking.objects.select_related("customer", "agent").all().order_by("-id")
    serializer_class = BookingSerializer

class SiteInspectionViewSet(BaseViewSet):
    boretrack_module = "inspections"
    queryset = SiteInspection.objects.select_related("booking", "booking__customer").all().order_by("-id")
    serializer_class = SiteInspectionSerializer

class AgentViewSet(BaseViewSet):
    boretrack_module = "agents"
    queryset = Agent.objects.all().order_by("-id")
    serializer_class = AgentSerializer

class CustomerViewSet(BaseViewSet):
    boretrack_module = "customers"
    queryset = Customer.objects.select_related("agent").all().order_by("-id")
    serializer_class = CustomerSerializer

class MachineViewSet(BaseViewSet):
    boretrack_module = "machines"
    queryset = Machine.objects.all().order_by("name")
    serializer_class = MachineSerializer

class WorkerViewSet(BaseViewSet):
    boretrack_module = "workers"
    queryset = Worker.objects.all().order_by("name")
    serializer_class = WorkerSerializer

class JobViewSet(BaseViewSet):
    boretrack_module = "jobs"
    queryset = Job.objects.select_related("customer","agent","machine").all().order_by("-id")
    serializer_class = JobSerializer

class PointViewSet(BaseViewSet):
    boretrack_module = "points"
    queryset = Point.objects.select_related("job").all().order_by("-id")
    serializer_class = PointSerializer
    def get_queryset(self):
        qs = super().get_queryset()
        job = self.request.query_params.get("job")
        return qs.filter(job_id=job) if job else qs

class CasingLineViewSet(BaseViewSet):
    boretrack_module = "casing"
    queryset = CasingLine.objects.select_related("job").all().order_by("-id")
    serializer_class = CasingLineSerializer
    def get_queryset(self):
        qs = super().get_queryset()
        job = self.request.query_params.get("job")
        return qs.filter(job_id=job) if job else qs

class JobChargeViewSet(BaseViewSet):
    boretrack_module = "charges"
    queryset = JobCharge.objects.select_related("job","point").all().order_by("-id")
    serializer_class = JobChargeSerializer
    def get_queryset(self):
        qs = super().get_queryset()
        job = self.request.query_params.get("job")
        return qs.filter(job_id=job) if job else qs

class AttendanceViewSet(BaseViewSet):
    boretrack_module = "attendance"
    queryset = Attendance.objects.select_related("worker","job").all().order_by("-date","-id")
    serializer_class = AttendanceSerializer

class PaymentViewSet(BaseViewSet):
    boretrack_module = "payments"
    queryset = Payment.objects.select_related("job").all().order_by("-received_at")
    serializer_class = PaymentSerializer
    def get_queryset(self):
        qs = super().get_queryset()
        job = self.request.query_params.get("job")
        return qs.filter(job_id=job) if job else qs

class ExpenseViewSet(BaseViewSet):
    boretrack_module = "expenses"
    queryset = Expense.objects.select_related("job").all().order_by("-expense_date","-id")
    serializer_class = ExpenseSerializer

class MaintenanceViewSet(BaseViewSet):
    boretrack_module = "maintenance"
    queryset = Maintenance.objects.select_related("machine").all().order_by("-started_at")
    serializer_class = MaintenanceSerializer

class WorkerAdvanceViewSet(BaseViewSet):
    boretrack_module = "advances"
    queryset = WorkerAdvance.objects.select_related("worker").all().order_by("-date","-id")
    serializer_class = WorkerAdvanceSerializer

@api_view(["GET"])
@permission_classes([BoreTrackRolePermission])
def dashboard(request):
    revenue = Payment.objects.aggregate(v=Sum("amount"))["v"] or 0
    expenses = Expense.objects.aggregate(v=Sum("amount"))["v"] or 0
    agreed = Job.objects.aggregate(v=Sum("agreed_total"))["v"] or 0
    today = timezone.localdate()
    attendance = Attendance.objects.filter(date=today, present=True).count()
    return Response({
        "revenue": float(revenue),
        "expenses": float(expenses),
        "outstanding": max(float(agreed - revenue), 0),
        "active_jobs": Job.objects.filter(status="active").count(),
        "booked_jobs": Job.objects.filter(status="booked").count(),
        "site_checks": Job.objects.filter(status="site_check").count(),
        "completed_jobs": Job.objects.filter(status="completed").count(),
        "available_machines": Machine.objects.filter(status="available").count(),
        "drilling_machines": Machine.objects.filter(status="drilling").count(),
        "maintenance_machines": Machine.objects.filter(status__in=["maintenance","breakdown"]).count(),
        "workers": Worker.objects.filter(active=True).count(),
        "present_today": attendance,
        "customers": Customer.objects.count(),
        "jobs": Job.objects.count(),
    })

@api_view(["GET"])
@permission_classes([BoreTrackRolePermission])
def revenue_report(request):
    revenue = float(Payment.objects.aggregate(v=Sum("amount"))["v"] or 0)
    expenses = float(Expense.objects.aggregate(v=Sum("amount"))["v"] or 0)
    jobs = Job.objects.count()
    completed = Job.objects.filter(status="completed").count()
    return Response({
        "revenue": revenue,
        "expenses": expenses,
        "net": revenue-expenses,
        "jobs": jobs,
        "completed_jobs": completed,
        "average_revenue_per_job": revenue/jobs if jobs else 0,
    })

@api_view(["GET"])
@permission_classes([BoreTrackRolePermission])
def operations_report(request):
    return Response({
        "machines": {
            "available": Machine.objects.filter(status="available").count(),
            "drilling": Machine.objects.filter(status="drilling").count(),
            "maintenance": Machine.objects.filter(status="maintenance").count(),
            "breakdown": Machine.objects.filter(status="breakdown").count(),
        },
        "jobs": dict(Job.objects.values_list("status").annotate(total=Count("id"))),
        "workers": Worker.objects.filter(active=True).count(),
    })

# Module names used by BoreTrackRolePermission for function-based endpoints.
dashboard.boretrack_module = "dashboard"
revenue_report.boretrack_module = "reports"
operations_report.boretrack_module = "reports"

@api_view(["GET"])
@permission_classes([BoreTrackRolePermission])
def cash_control_report(request):
    total = float(Expense.objects.aggregate(v=Sum("amount"))["v"] or 0)
    by_category = []
    for key, label in Expense.CATEGORY:
        amount = float(Expense.objects.filter(category=key).aggregate(v=Sum("amount"))["v"] or 0)
        by_category.append({"category": key, "label": label, "amount": amount})
    job_linked = float(Expense.objects.filter(job__isnull=False).aggregate(v=Sum("amount"))["v"] or 0)
    unallocated = float(Expense.objects.filter(job__isnull=True).aggregate(v=Sum("amount"))["v"] or 0)
    today_total = float(Expense.objects.filter(expense_date=timezone.localdate()).aggregate(v=Sum("amount"))["v"] or 0)
    return Response({"total": total, "job_linked": job_linked, "unallocated": unallocated, "today": today_total, "by_category": by_category})

cash_control_report.boretrack_module = "expenses"


class RateCardViewSet(BaseViewSet):
    boretrack_module = "pricing"
    queryset = RateCard.objects.prefetch_related("lines").all()
    serializer_class = RateCardSerializer

class RateLineViewSet(BaseViewSet):
    boretrack_module = "pricing"
    queryset = RateLine.objects.select_related("rate_card").all()
    serializer_class = RateLineSerializer
    def get_queryset(self):
        qs = super().get_queryset()
        card = self.request.query_params.get("rate_card")
        return qs.filter(rate_card_id=card) if card else qs


class FuelLogViewSet(BaseViewSet):
    boretrack_module = "fuel"
    queryset = FuelLog.objects.select_related("machine", "job").all().order_by("-date", "-id")
    serializer_class = FuelLogSerializer

class MachineOperationViewSet(BaseViewSet):
    boretrack_module = "machines"
    queryset = MachineOperation.objects.select_related("machine", "job", "worker").all().order_by("-date", "-id")
    serializer_class = MachineOperationSerializer

class BreakdownViewSet(BaseViewSet):
    boretrack_module = "maintenance"
    queryset = Breakdown.objects.select_related("machine", "job").all().order_by("-started_at", "-id")
    serializer_class = BreakdownSerializer

class WageSettlementViewSet(BaseViewSet):
    boretrack_module = "workers"
    queryset = WageSettlement.objects.select_related("worker").all().order_by("-period_end", "-id")
    serializer_class = WageSettlementSerializer

@api_view(["GET"])
@permission_classes([BoreTrackRolePermission])
def profitability_report(request):
    """Per-job profitability using recorded payments, fuel, attendance wages, breakdown repair and other job expenses.
    Worker overtime is intentionally excluded because its business rule is not yet validated.
    """
    jobs = Job.objects.select_related("customer", "machine").all().order_by("-id")
    rows = []
    total = {"revenue": 0, "fuel": 0, "wages": 0, "maintenance": 0, "other": 0}
    for job in jobs:
        revenue = float(job.payments.aggregate(v=Sum("amount"))["v"] or 0)
        fuel = float(job.fuel_logs.aggregate(v=Sum(F("liters") * F("price_per_liter")))["v"] or 0)
        wages = 0.0
        for att in job.attendance.filter(present=True).select_related("worker"):
            wages += float(att.worker.daily_wage or 0)
        maintenance = float(job.breakdowns.aggregate(v=Sum(F("parts_cost") + F("labour_cost")))["v"] or 0)
        other = float(job.expenses.exclude(category__in=["fuel", "wages", "maintenance"]).aggregate(v=Sum("amount"))["v"] or 0)
        cost = fuel + wages + maintenance + other
        profit = revenue - cost
        for k, v in [("revenue", revenue), ("fuel", fuel), ("wages", wages), ("maintenance", maintenance), ("other", other)]:
            total[k] += v
        rows.append({
            "job_id": job.id,
            "job_code": f"BT-{job.id:04d}",
            "customer": job.customer.name,
            "machine": job.machine.code if job.machine else None,
            "status": job.status,
            "agreed_total": float(job.agreed_total or 0),
            "revenue": revenue,
            "fuel_cost": fuel,
            "worker_cost": wages,
            "maintenance_cost": maintenance,
            "other_cost": other,
            "total_cost": cost,
            "profit": profit,
            "margin_percent": (profit / revenue * 100) if revenue else 0,
        })
    total["cost"] = total["fuel"] + total["wages"] + total["maintenance"] + total["other"]
    total["profit"] = total["revenue"] - total["cost"]
    total["margin_percent"] = (total["profit"] / total["revenue"] * 100) if total["revenue"] else 0
    unallocated = float(Expense.objects.filter(job__isnull=True).aggregate(v=Sum("amount"))["v"] or 0)
    return Response({"summary": total, "jobs": rows, "unallocated_expenses": unallocated,
                     "notes": ["Revenue is recorded customer payments, not invoice value.",
                               "Worker cost uses daily wage × present attendance; overtime is excluded until validated.",
                               "Fuel comes from Fuel Logs and repair cost from job-linked Breakdowns.",
                               "Other job expenses exclude fuel, wages and maintenance categories to reduce double counting."]})

class JobFileViewSet(BaseViewSet):
    boretrack_module = "jobs"
    queryset = JobFile.objects.select_related("job", "uploaded_by").all().order_by("-created_at")
    serializer_class = JobFileSerializer
    def perform_create(self, serializer): serializer.save(uploaded_by=self.request.user)

class JobLocationViewSet(BaseViewSet):
    boretrack_module = "jobs"
    queryset = JobLocation.objects.select_related("job", "captured_by").all().order_by("-captured_at", "-id")
    serializer_class = JobLocationSerializer
    def perform_create(self, serializer): serializer.save(captured_by=self.request.user)
