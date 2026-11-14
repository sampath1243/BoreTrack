from django.db import models
from django.utils import timezone

class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class Agent(TimeStamped):
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30, blank=True)
    active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    def __str__(self): return self.name

class Customer(TimeStamped):
    name = models.CharField(max_length=160)
    phone = models.CharField(max_length=30, blank=True)
    village = models.CharField(max_length=120, blank=True)
    address = models.TextField(blank=True)
    agent = models.ForeignKey(Agent, null=True, blank=True, on_delete=models.SET_NULL, related_name="customers")
    notes = models.TextField(blank=True)
    def __str__(self): return self.name

class Machine(TimeStamped):
    STATUS = [
        ("available", "Available"),
        ("drilling", "Drilling"),
        ("maintenance", "Maintenance"),
        ("breakdown", "Breakdown"),
    ]
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=40, unique=True)
    status = models.CharField(max_length=20, choices=STATUS, default="available")
    hour_meter = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    def __str__(self): return f"{self.name} ({self.code})"

class Worker(TimeStamped):
    ROLE = [
        ("driver", "Driver"),
        ("driller", "Driller"),
        ("helper", "Helper"),
        ("mechanic", "Mechanic"),
        ("other", "Other"),
    ]
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=20, choices=ROLE, default="helper")
    daily_wage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    def __str__(self): return self.name

class Job(TimeStamped):
    STATUS = [
        ("site_check", "Site Check"),
        ("booked", "Booked"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="jobs")
    agent = models.ForeignKey(Agent, null=True, blank=True, on_delete=models.SET_NULL, related_name="jobs")
    machine = models.ForeignKey(Machine, null=True, blank=True, on_delete=models.SET_NULL, related_name="jobs")
    site = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS, default="site_check")
    agreed_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    advance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    price_note = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    booked_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    def __str__(self): return f"BT-{self.pk:04d}"

class Point(models.Model):
    RESULT = [
        ("pending", "Pending"),
        ("passed", "Passed"),
        ("failed", "Failed"),
    ]
    job = models.ForeignKey(Job, related_name="points", on_delete=models.CASCADE)
    name = models.CharField(max_length=80)
    result = models.CharField(max_length=20, choices=RESULT, default="pending")
    rods = models.PositiveIntegerField(default=0)
    inner_feet = models.DecimalField(max_digits=8, decimal_places=2, default=5)
    bit_feet = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    drilling_rate = models.DecimalField(max_digits=10, decimal_places=2, default=70)
    notes = models.TextField(blank=True)
    def calculated_depth(self):
        return self.rods * 15 + self.inner_feet + self.bit_feet

class CasingLine(models.Model):
    SOURCE = [("business", "Business supplied"), ("customer", "Customer supplied")]
    job = models.ForeignKey(Job, related_name="casing_lines", on_delete=models.CASCADE)
    company = models.CharField(max_length=100, default="Sudhakar")
    casing_type = models.CharField(max_length=100, default="Normal")
    source = models.CharField(max_length=20, choices=SOURCE, default="business")
    quantity_feet = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rate = models.DecimalField(max_digits=10, decimal_places=2, default=350)
    note = models.TextField(blank=True)

class JobCharge(models.Model):
    CHARGE_TYPES = [
        ("drilling", "Drilling"),
        ("jali", "Jali"),
        ("normal_casing", "Normal Casing"),
        ("freshing", "Freshing"),
        ("bata", "Bata"),
        ("transport", "Transport"),
        ("other", "Other"),
    ]
    job = models.ForeignKey(Job, related_name="charges", on_delete=models.CASCADE)
    point = models.ForeignKey(Point, null=True, blank=True, on_delete=models.SET_NULL)
    charge_type = models.CharField(max_length=30, choices=CHARGE_TYPES)
    description = models.CharField(max_length=255, blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.CharField(max_length=40, default="ft")
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

class Attendance(models.Model):
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name="attendance")
    job = models.ForeignKey(Job, null=True, blank=True, on_delete=models.SET_NULL, related_name="attendance")
    date = models.DateField(default=timezone.localdate)
    present = models.BooleanField(default=True)
    hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    note = models.CharField(max_length=255, blank=True)

class Payment(models.Model):
    job = models.ForeignKey(Job, related_name="payments", on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=40, default="cash")
    received_at = models.DateTimeField(auto_now_add=True)
    reference = models.CharField(max_length=120, blank=True)
    note = models.CharField(max_length=255, blank=True)

class Expense(models.Model):
    CATEGORY = [
        ("fuel", "Fuel / Diesel"),
        ("maintenance", "Maintenance"),
        ("wages", "Wages"),
        ("transport", "Transport"),
        ("other", "Other"),
    ]
    job = models.ForeignKey(Job, null=True, blank=True, on_delete=models.SET_NULL, related_name="expenses")
    category = models.CharField(max_length=30, choices=CATEGORY)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    expense_date = models.DateField(default=timezone.localdate)

class Maintenance(models.Model):
    machine = models.ForeignKey(Machine, related_name="maintenance", on_delete=models.CASCADE)
    maintenance_type = models.CharField(max_length=100)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

class WorkerAdvance(models.Model):
    worker = models.ForeignKey(Worker, related_name="advances", on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=timezone.localdate)
    note = models.CharField(max_length=255, blank=True)


class FuelLog(TimeStamped):
    machine = models.ForeignKey(Machine, on_delete=models.PROTECT, related_name="fuel_logs")
    job = models.ForeignKey(Job, null=True, blank=True, on_delete=models.SET_NULL, related_name="fuel_logs")
    date = models.DateField(default=timezone.localdate)
    liters = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_per_liter = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hour_meter = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    supplier = models.CharField(max_length=160, blank=True)
    reference = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)

    @property
    def total_cost(self):
        return self.liters * self.price_per_liter


class MachineOperation(TimeStamped):
    machine = models.ForeignKey(Machine, on_delete=models.PROTECT, related_name="operations")
    job = models.ForeignKey(Job, null=True, blank=True, on_delete=models.SET_NULL, related_name="machine_operations")
    worker = models.ForeignKey(Worker, null=True, blank=True, on_delete=models.SET_NULL, related_name="machine_operations")
    date = models.DateField(default=timezone.localdate)
    start_hour_meter = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    end_hour_meter = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    @property
    def running_hours(self):
        return max(self.end_hour_meter - self.start_hour_meter, 0)


class Breakdown(TimeStamped):
    STATUS = [("open", "Open"), ("repairing", "Repairing"), ("resolved", "Resolved")]
    machine = models.ForeignKey(Machine, on_delete=models.PROTECT, related_name="breakdowns")
    job = models.ForeignKey(Job, null=True, blank=True, on_delete=models.SET_NULL, related_name="breakdowns")
    started_at = models.DateTimeField()
    resolved_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default="open")
    reason = models.CharField(max_length=255)
    repair_work = models.TextField(blank=True)
    mechanic = models.CharField(max_length=120, blank=True)
    parts_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    labour_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

class UserProfile(TimeStamped):
    ROLE = [
        ("owner", "Owner"),
        ("manager", "Manager"),
        ("office", "Office Staff"),
        ("supervisor", "Site Supervisor"),
        ("driver", "Driver"),
        ("worker", "Worker"),
        ("accountant", "Accountant"),
    ]
    user = models.OneToOneField("auth.User", on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE, default="worker")
    phone = models.CharField(max_length=30, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class Booking(TimeStamped):
    STATUS = [
        ("enquiry", "Enquiry"),
        ("site_check", "Site Check"),
        ("quoted", "Quoted"),
        ("confirmed", "Confirmed"),
        ("rejected", "Rejected"),
        ("cancelled", "Cancelled"),
    ]
    SOURCE = [("agent", "Agent"), ("direct", "Direct"), ("other", "Other")]
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="bookings")
    agent = models.ForeignKey(Agent, null=True, blank=True, on_delete=models.SET_NULL, related_name="bookings")
    source = models.CharField(max_length=20, choices=SOURCE, default="agent")
    requested_site = models.CharField(max_length=255)
    requested_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default="enquiry")
    enquiry_note = models.TextField(blank=True)
    def __str__(self): return f"BK-{self.pk:04d}"

class SiteInspection(TimeStamped):
    DECISION = [("pending", "Pending"), ("suitable", "Suitable"), ("not_suitable", "Not suitable")]
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="inspection")
    inspection_date = models.DateField(default=timezone.localdate)
    inspector_name = models.CharField(max_length=120, blank=True)
    road_access = models.CharField(max_length=30, choices=[("good", "Good"), ("limited", "Limited"), ("not_accessible", "Not accessible")], default="good")
    ground_wet = models.BooleanField(default=False)
    nearby_borewell = models.BooleanField(default=False)
    nearby_distance_m = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    nearby_borewell_owner = models.CharField(max_length=160, blank=True)
    machine_can_reach = models.BooleanField(default=True)
    site_suitable = models.BooleanField(default=False)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    decision = models.CharField(max_length=20, choices=DECISION, default="pending")
    notes = models.TextField(blank=True)
    def __str__(self): return f"Inspection for {self.booking}"


class RateCard(TimeStamped):
    """Versioned pricing header. Historical job charges remain independent snapshots."""
    name = models.CharField(max_length=160)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    season = models.CharField(max_length=80, blank=True, help_text="e.g. Summer, Off-season")
    active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-effective_from", "-id"]

    def __str__(self):
        return f"{self.name} ({self.effective_from})"


class RateLine(models.Model):
    CHARGE_TYPES = [
        ("drilling", "Drilling"),
        ("jali", "Jali"),
        ("normal_casing", "Normal Casing"),
        ("freshing", "Freshing"),
        ("bata", "Bata"),
        ("transport", "Transport"),
        ("other", "Other"),
    ]
    rate_card = models.ForeignKey(RateCard, related_name="lines", on_delete=models.CASCADE)
    charge_type = models.CharField(max_length=30, choices=CHARGE_TYPES)
    unit = models.CharField(max_length=40, default="ft")
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    casing_company = models.CharField(max_length=100, blank=True)
    casing_type = models.CharField(max_length=100, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["charge_type", "id"]

    def __str__(self):
        return f"{self.get_charge_type_display()} - {self.rate} / {self.unit}"

class WageSettlement(TimeStamped):
    STATUS = [("draft", "Draft"), ("approved", "Approved"), ("paid", "Paid"), ("partial", "Partially Paid")]
    worker = models.ForeignKey(Worker, on_delete=models.PROTECT, related_name="wage_settlements")
    period_start = models.DateField()
    period_end = models.DateField()
    payable_days = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    base_wage = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    overtime_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_wage = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    advance_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS, default="draft")
    paid_date = models.DateField(null=True, blank=True)
    note = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        self.gross_wage = self.base_wage + self.overtime_amount
        self.net_payable = max(self.gross_wage - self.advance_deduction - self.other_deduction, 0)
        if self.paid_amount >= self.net_payable and self.net_payable > 0:
            self.status = "paid"
        elif self.paid_amount > 0:
            self.status = "partial"
        super().save(*args, **kwargs)

class JobFile(TimeStamped):
    FILE_TYPE = [("document","Document"),("receipt","Receipt"),("photo","Job Photo"),("other","Other")]
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="boretrack/jobs/%Y/%m/")
    file_type = models.CharField(max_length=20, choices=FILE_TYPE, default="document")
    caption = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    uploaded_by = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="boretrack_job_files")
    def __str__(self): return f"{self.job} - {self.caption or self.file.name}"

class JobLocation(TimeStamped):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="locations")
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    accuracy_m = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    captured_at = models.DateTimeField(default=timezone.now)
    note = models.CharField(max_length=255, blank=True)
    captured_by = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="boretrack_locations")
    def __str__(self): return f"{self.job} @ {self.latitude},{self.longitude}"
