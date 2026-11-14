from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import *
from .auth_views import UserViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="users")
router.register("bookings", BookingViewSet)
router.register("inspections", SiteInspectionViewSet)
router.register("agents", AgentViewSet)
router.register("customers", CustomerViewSet)
router.register("machines", MachineViewSet)
router.register("workers", WorkerViewSet)
router.register("jobs", JobViewSet)
router.register("points", PointViewSet)
router.register("casing", CasingLineViewSet)
router.register("charges", JobChargeViewSet)
router.register("attendance", AttendanceViewSet)
router.register("payments", PaymentViewSet)
router.register("expenses", ExpenseViewSet)
router.register("maintenance", MaintenanceViewSet)
router.register("advances", WorkerAdvanceViewSet)
router.register("wage-settlements", WageSettlementViewSet)
router.register("rate-cards", RateCardViewSet)
router.register("rate-lines", RateLineViewSet)
router.register("fuel-logs", FuelLogViewSet)
router.register("machine-operations", MachineOperationViewSet)
router.register("breakdowns", BreakdownViewSet)
router.register("job-files", JobFileViewSet)
router.register("job-locations", JobLocationViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/", dashboard),
    path("reports/revenue/", revenue_report),
    path("reports/operations/", operations_report),
    path("reports/profitability/", profitability_report),
    path("reports/cash-control/", cash_control_report),
]
