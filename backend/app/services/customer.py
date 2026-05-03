from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.customer import Customer, CustomerAddress
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerAddressCreate
from app.core.security import hash_password, verify_password
from app.core.exceptions import NotFoundException, ValidationException

class CustomerService:
    @staticmethod
    async def create_customer(db: AsyncSession, org_id: UUID, data: CustomerCreate) -> Customer:
        stmt = select(Customer).where(Customer.email == data.email)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise ValidationException("Email already registered")

        customer = Customer(
            organization_id=org_id,
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            dob=data.dob,
        )
        db.add(customer)
        await db.flush()
        # Loading the customer again with addresses to ensure serialization works
        return await CustomerService.get_customer(db, customer.id)

    @staticmethod
    async def get_customer(db: AsyncSession, customer_id: UUID) -> Customer:
        stmt = select(Customer).where(Customer.id == customer_id).options(selectinload(Customer.addresses))
        result = await db.execute(stmt)
        customer = result.scalar_one_or_none()
        if not customer:
            raise NotFoundException("Customer not found")
        return customer

    @staticmethod
    async def get_customers(db: AsyncSession, org_id: UUID, skip: int = 0, limit: int = 100) -> List[Customer]:
        stmt = select(Customer).where(Customer.organization_id == org_id).options(selectinload(Customer.addresses)).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def authenticate_customer(db: AsyncSession, email: str, password: str) -> Optional[Customer]:
        stmt = select(Customer).where(Customer.email == email)
        result = await db.execute(stmt)
        customer = result.scalar_one_or_none()
        if not customer:
            return None
        if not verify_password(password, customer.hashed_password):
            return None
        if not customer.is_active:
            raise ValidationException("Customer account is inactive")
        return customer

    @staticmethod
    async def update_customer(db: AsyncSession, customer_id: UUID, data: CustomerUpdate) -> Customer:
        customer = await CustomerService.get_customer(db, customer_id)
        
        if data.full_name is not None:
            customer.full_name = data.full_name
        if data.phone is not None:
            customer.phone = data.phone
        if data.is_active is not None:
            customer.is_active = data.is_active
        if data.dob is not None:
            customer.dob = data.dob
            
        await db.flush()
        await db.refresh(customer)
        return customer

    @staticmethod
    async def add_address(db: AsyncSession, customer_id: UUID, data: CustomerAddressCreate) -> CustomerAddress:
        customer = await CustomerService.get_customer(db, customer_id)
        
        if data.is_default:
            for addr in customer.addresses:
                addr.is_default = False
                
        address = CustomerAddress(
            customer_id=customer.id,
            label=data.label,
            street=data.street,
            city=data.city,
            state=data.state,
            postcode=data.postcode,
            country=data.country,
            lat=data.lat,
            lng=data.lng,
            is_default=data.is_default or len(customer.addresses) == 0
        )
        db.add(address)
        await db.flush()
        await db.refresh(address)
        return address

    @staticmethod
    async def remove_address(db: AsyncSession, address_id: UUID) -> None:
        address = await db.get(CustomerAddress, address_id)
        if not address:
            raise NotFoundException("Address not found")
        await db.delete(address)
        await db.flush()

    @staticmethod
    async def set_default_address(db: AsyncSession, customer_id: UUID, address_id: UUID) -> Optional[CustomerAddress]:
        customer = await CustomerService.get_customer(db, customer_id)
        
        target_address = None
        for addr in customer.addresses:
            if addr.id == address_id:
                addr.is_default = True
                target_address = addr
            else:
                addr.is_default = False
                
        if not target_address:
            raise NotFoundException("Address not found")
            
        await db.flush()
        return target_address
