from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import *
from core.models import UserProfile
from decimal import Decimal
from django.utils import timezone

class Command(BaseCommand):
    help = "Create demo BoreTrack data."

    def handle(self, *args, **kwargs):
        user, created = User.objects.get_or_create(username="admin")
        if created:
            user.set_password("admin123")
            user.is_staff = True
            user.is_superuser = True
            user.save()
        UserProfile.objects.update_or_create(user=user, defaults={"role":"owner", "job_title":"Business Owner"})

        agent, _ = Agent.objects.get_or_create(name="Ramesh Agencies", defaults={"phone":"9000000001"})
        c1, _ = Customer.objects.get_or_create(name="Srinivas Reddy", defaults={"phone":"9000000002","village":"Nalgonda","agent":agent})
        c2, _ = Customer.objects.get_or_create(name="Lakshmi Farm", defaults={"phone":"9000000003","village":"Chityala","agent":agent})

        m1, _ = Machine.objects.get_or_create(code="BT-RIG-01", defaults={"name":"BoreTrack Rig 01","status":"drilling","hour_meter":Decimal("842.50")})
        m2, _ = Machine.objects.get_or_create(code="BT-RIG-02", defaults={"name":"BoreTrack Rig 02","status":"available","hour_meter":Decimal("421.20")})
        m3, _ = Machine.objects.get_or_create(code="BT-RIG-03", defaults={"name":"BoreTrack Rig 03","status":"maintenance","hour_meter":Decimal("1204.80")})

        Worker.objects.get_or_create(name="Mahesh", defaults={"phone":"9000000010","role":"driller","daily_wage":Decimal("900")})
        Worker.objects.get_or_create(name="Ravi", defaults={"phone":"9000000011","role":"driver","daily_wage":Decimal("800")})
        Worker.objects.get_or_create(name="Naresh", defaults={"phone":"9000000012","role":"helper","daily_wage":Decimal("650")})

        j1, _ = Job.objects.get_or_create(customer=c1, site="Nalgonda — Farm Road", defaults={
            "agent":agent,"machine":m1,"status":"active","agreed_total":Decimal("37250"),"advance":Decimal("10000"),
            "price_note":"Drilling ₹70/ft; Jali ₹550/ft; Normal casing ₹350/ft"
        })
        j2, _ = Job.objects.get_or_create(customer=c2, site="Chityala — Bore Point", defaults={
            "agent":agent,"machine":m2,"status":"booked","agreed_total":Decimal("59000"),"advance":Decimal("15000")
        })

        if not j1.points.exists():
            Point.objects.create(job=j1,name="P1",result="passed",rods=10,inner_feet=5,bit_feet=0,drilling_rate=70)
            Point.objects.create(job=j1,name="P2",result="failed",rods=9,inner_feet=5,bit_feet=0,drilling_rate=70)
            CasingLine.objects.create(job=j1,company="Sudhakar",casing_type="Normal",source="business",quantity_feet=44,rate=350)
            CasingLine.objects.create(job=j1,company="Sudhakar",casing_type="Jali",source="business",quantity_feet=20,rate=550)

        b1, _ = Booking.objects.get_or_create(customer=c1, requested_site="Nalgonda — Farm Road", defaults={"agent":agent,"source":"agent","status":"confirmed","enquiry_note":"Agent shared point; customer contacted after enquiry."})
        SiteInspection.objects.get_or_create(booking=b1, defaults={"inspector_name":"Field Team","road_access":"good","ground_wet":False,"nearby_borewell":True,"nearby_distance_m":100,"nearby_borewell_owner":"Nearby farmer","machine_can_reach":True,"site_suitable":True,"decision":"suitable","notes":"Demo inspection. 100m is stored as observed data, not a hard rule."})

        Payment.objects.get_or_create(job=j1, amount=Decimal("10000"), defaults={"method":"cash"})
        Expense.objects.get_or_create(job=j1, category="fuel", amount=Decimal("4500"), defaults={"description":"Diesel", "expense_date":timezone.localdate()})

        self.stdout.write(self.style.SUCCESS("Demo data ready. Login: admin / admin123"))
