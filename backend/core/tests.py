from django.test import TestCase
from .models import Agent, Customer, Job, Point

class BoreTrackModelTests(TestCase):
    def test_depth_calculation(self):
        agent=Agent.objects.create(name="Test Agent")
        customer=Customer.objects.create(name="Test Customer",agent=agent)
        job=Job.objects.create(customer=customer,site="Test")
        point=Point.objects.create(job=job,name="P1",rods=10,inner_feet=5,bit_feet=0)
        self.assertEqual(point.calculated_depth(), 155)
