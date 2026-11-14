from django.contrib import admin
from .models import *

admin.site.register([
    Agent, Customer, Machine, Worker, Job, Point, CasingLine,
    JobCharge, Attendance, Payment, Expense, Maintenance, WorkerAdvance
])
admin.site.register(UserProfile)

from .models import FuelLog, MachineOperation, Breakdown
admin.site.register([FuelLog, MachineOperation, Breakdown])

from .models import Booking, SiteInspection, RateCard, RateLine, WageSettlement, JobFile, JobLocation
admin.site.register([Booking, SiteInspection, RateCard, RateLine, WageSettlement, JobFile, JobLocation])
