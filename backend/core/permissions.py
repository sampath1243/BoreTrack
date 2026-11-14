from rest_framework.permissions import BasePermission

ROLE_ACCESS = {
    "owner": {"*"},
    "manager": {"dashboard", "reports", "bookings", "inspections", "agents", "customers", "machines", "workers", "jobs", "points", "casing", "charges", "attendance", "payments", "expenses", "maintenance", "advances", "fuel"},
    "office": {"dashboard", "reports", "bookings", "inspections", "agents", "customers", "jobs", "payments"},
    "supervisor": {"dashboard", "bookings", "inspections", "jobs", "points", "casing", "charges", "attendance", "machines", "workers", "fuel"},
    "driver": {"dashboard", "jobs", "machines", "points"},
    "worker": {"dashboard", "jobs", "attendance"},
    "accountant": {"dashboard", "reports", "payments", "expenses", "advances", "workers"},
}

class BoreTrackRolePermission(BasePermission):
    """Role-based API guard. Superusers are treated as owners."""
    message = "You do not have permission for this BoreTrack module."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        try:
            role = user.profile.role
        except Exception:
            role = "owner" if user.is_staff else "worker"
        module = getattr(view, "boretrack_module", None)
        if module is None:
            return True
        allowed = ROLE_ACCESS.get(role, set())
        if "*" in allowed or module in allowed:
            return True
        return False
