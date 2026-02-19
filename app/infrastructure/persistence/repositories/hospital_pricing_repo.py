"""Hospital-specific pricing repository. CRUD for medicine, service, lab; agreed price lookup."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.hospital_pricing import (
    HospitalLabTestCreate,
    HospitalLabTestResult,
    HospitalMedicineCreate,
    HospitalMedicineResult,
    HospitalServicePriceCreate,
    HospitalServicePriceResult,
)
from app.infrastructure.persistence.models.hospital_lab_test import HospitalLabTest
from app.infrastructure.persistence.models.hospital_medicine import HospitalMedicine
from app.infrastructure.persistence.models.hospital_service import HospitalServicePrice
from app.infrastructure.persistence.models.lab import Lab
from app.infrastructure.persistence.models.medicine import Medicine
from app.infrastructure.persistence.models.service_maintenance import ServiceMaintenance


def _hm_to_result(m: HospitalMedicine) -> HospitalMedicineResult:
    return HospitalMedicineResult(
        id=m.id,
        tenant_id=m.tenant_id,
        hospital_id=m.hospital_id,
        medicine_id=m.medicine_id,
        unit_price=Decimal(str(m.unit_price)),
        effective_date=m.effective_date,
        status=m.status,
    )


def _hs_to_result(h: HospitalServicePrice) -> HospitalServicePriceResult:
    return HospitalServicePriceResult(
        id=h.id,
        tenant_id=h.tenant_id,
        hospital_id=h.hospital_id,
        service_id=h.service_id,
        amount=Decimal(str(h.amount)),
        effective_date=h.effective_date,
        status=h.status,
    )


def _hl_to_result(l: HospitalLabTest) -> HospitalLabTestResult:
    return HospitalLabTestResult(
        id=l.id,
        tenant_id=l.tenant_id,
        hospital_id=l.hospital_id,
        lab_id=l.lab_id,
        amount=Decimal(str(l.amount)),
        effective_date=l.effective_date,
        status=l.status,
    )


class HospitalPricingRepository:
    """Single repo for hospital medicine, service, and lab pricing. Tenant-scoped."""

    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    # --- Medicine ---
    async def list_medicines_by_hospital(
        self, hospital_id: str, skip: int = 0, limit: int = 100
    ) -> list[HospitalMedicineResult]:
        r = await self.db.execute(
            select(HospitalMedicine)
            .where(
                HospitalMedicine.tenant_id == self.tenant_id,
                HospitalMedicine.hospital_id == hospital_id,
            )
            .offset(skip)
            .limit(limit)
            .order_by(HospitalMedicine.medicine_id)
        )
        return [_hm_to_result(m) for m in r.scalars().all()]

    async def get_hospital_medicine(self, id: str) -> HospitalMedicineResult | None:
        r = await self.db.execute(
            select(HospitalMedicine).where(
                HospitalMedicine.id == id,
                HospitalMedicine.tenant_id == self.tenant_id,
            )
        )
        m = r.scalar_one_or_none()
        return _hm_to_result(m) if m else None

    async def create_hospital_medicine(
        self, data: HospitalMedicineCreate
    ) -> HospitalMedicineResult:
        m = HospitalMedicine(
            tenant_id=self.tenant_id,
            hospital_id=data.hospital_id,
            medicine_id=data.medicine_id,
            unit_price=data.unit_price,
            effective_date=data.effective_date,
            status=data.status,
        )
        self.db.add(m)
        await self.db.flush()
        await self.db.refresh(m)
        return _hm_to_result(m)

    # --- Service ---
    async def list_services_by_hospital(
        self, hospital_id: str, skip: int = 0, limit: int = 100
    ) -> list[HospitalServicePriceResult]:
        r = await self.db.execute(
            select(HospitalServicePrice)
            .where(
                HospitalServicePrice.tenant_id == self.tenant_id,
                HospitalServicePrice.hospital_id == hospital_id,
            )
            .offset(skip)
            .limit(limit)
            .order_by(HospitalServicePrice.service_id)
        )
        return [_hs_to_result(h) for h in r.scalars().all()]

    async def get_hospital_service(self, id: str) -> HospitalServicePriceResult | None:
        r = await self.db.execute(
            select(HospitalServicePrice).where(
                HospitalServicePrice.id == id,
                HospitalServicePrice.tenant_id == self.tenant_id,
            )
        )
        h = r.scalar_one_or_none()
        return _hs_to_result(h) if h else None

    async def create_hospital_service(
        self, data: HospitalServicePriceCreate
    ) -> HospitalServicePriceResult:
        h = HospitalServicePrice(
            tenant_id=self.tenant_id,
            hospital_id=data.hospital_id,
            service_id=data.service_id,
            amount=data.amount,
            effective_date=data.effective_date,
            status=data.status,
        )
        self.db.add(h)
        await self.db.flush()
        await self.db.refresh(h)
        return _hs_to_result(h)

    # --- Lab ---
    async def list_labs_by_hospital(
        self, hospital_id: str, skip: int = 0, limit: int = 100
    ) -> list[HospitalLabTestResult]:
        r = await self.db.execute(
            select(HospitalLabTest)
            .where(
                HospitalLabTest.tenant_id == self.tenant_id,
                HospitalLabTest.hospital_id == hospital_id,
            )
            .offset(skip)
            .limit(limit)
            .order_by(HospitalLabTest.lab_id)
        )
        return [_hl_to_result(l) for l in r.scalars().all()]

    async def get_hospital_lab_test(self, id: str) -> HospitalLabTestResult | None:
        r = await self.db.execute(
            select(HospitalLabTest).where(
                HospitalLabTest.id == id,
                HospitalLabTest.tenant_id == self.tenant_id,
            )
        )
        l = r.scalar_one_or_none()
        return _hl_to_result(l) if l else None

    async def create_hospital_lab_test(
        self, data: HospitalLabTestCreate
    ) -> HospitalLabTestResult:
        l = HospitalLabTest(
            tenant_id=self.tenant_id,
            hospital_id=data.hospital_id,
            lab_id=data.lab_id,
            amount=data.amount,
            effective_date=data.effective_date,
            status=data.status,
        )
        self.db.add(l)
        await self.db.flush()
        await self.db.refresh(l)
        return _hl_to_result(l)

    # --- Agreed price lookup (for claim validation) ---
    async def get_agreed_unit_price(
        self,
        hospital_id: str,
        item_type: str,
        item_code: str,
    ) -> Decimal | None:
        """
        Return agreed unit price (medicine) or amount (service/lab) for (hospital, item_type, item_code).
        item_type: 'medicine' | 'service' | 'lab'. Resolves item_code to catalog id then looks up hospital price.
        """
        if not item_code or not item_code.strip():
            return None
        code = item_code.strip()
        if item_type == "medicine":
            r = await self.db.execute(
                select(Medicine.id).where(
                    Medicine.tenant_id == self.tenant_id,
                    Medicine.code == code,
                ).limit(1)
            )
            medicine_id = r.scalar_one_or_none()
            if not medicine_id:
                return None
            r2 = await self.db.execute(
                select(HospitalMedicine.unit_price).where(
                    HospitalMedicine.tenant_id == self.tenant_id,
                    HospitalMedicine.hospital_id == hospital_id,
                    HospitalMedicine.medicine_id == medicine_id,
                    HospitalMedicine.status == "active",
                ).limit(1)
            )
            price = r2.scalar_one_or_none()
            return Decimal(str(price)) if price is not None else None
        if item_type == "service":
            r = await self.db.execute(
                select(ServiceMaintenance.id).where(
                    ServiceMaintenance.tenant_id == self.tenant_id,
                    ServiceMaintenance.code == code,
                ).limit(1)
            )
            service_id = r.scalar_one_or_none()
            if not service_id:
                return None
            r2 = await self.db.execute(
                select(HospitalServicePrice.amount).where(
                    HospitalServicePrice.tenant_id == self.tenant_id,
                    HospitalServicePrice.hospital_id == hospital_id,
                    HospitalServicePrice.service_id == service_id,
                    HospitalServicePrice.status == "active",
                ).limit(1)
            )
            amount = r2.scalar_one_or_none()
            return Decimal(str(amount)) if amount is not None else None
        if item_type == "lab":
            r = await self.db.execute(
                select(Lab.id).where(
                    Lab.tenant_id == self.tenant_id,
                    Lab.code == code,
                ).limit(1)
            )
            lab_id = r.scalar_one_or_none()
            if not lab_id:
                return None
            r2 = await self.db.execute(
                select(HospitalLabTest.amount).where(
                    HospitalLabTest.tenant_id == self.tenant_id,
                    HospitalLabTest.hospital_id == hospital_id,
                    HospitalLabTest.lab_id == lab_id,
                    HospitalLabTest.status == "active",
                ).limit(1)
            )
            amount = r2.scalar_one_or_none()
            return Decimal(str(amount)) if amount is not None else None
        return None
