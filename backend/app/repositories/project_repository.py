"""Repository for Project database operations."""

from datetime import datetime, timezone
from typing import List, Optional, Tuple
import uuid

from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from backend.app.models.project import Project
from backend.app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectRepository:
    @staticmethod
    def list_projects(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Tuple[List[Project], int]:
        """Queries projects with optional search, category, and status filters."""
        query = select(Project)

        if user_id:
            query = query.where(Project.user_id == user_id)

        if category and category.lower() != "all":
            query = query.where(Project.category.ilike(category.strip()))

        if status and status.lower() != "all":
            query = query.where(Project.status.ilike(status.strip()))

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Project.name.ilike(term),
                    Project.category.ilike(term),
                    Project.description.ilike(term),
                    Project.ingredients.ilike(term),
                    Project.target_audience.ilike(term),
                )
            )

        # Count total matching
        count_query = select(func.count()).select_from(query.subquery())
        total = db.scalar(count_query) or 0

        # Order and paginate
        query = query.order_by(desc(Project.updated_at), desc(Project.created_at))
        query = query.offset(offset).limit(limit)

        items = db.scalars(query).all()
        return list(items), total

    @staticmethod
    def get_by_id(db: Session, project_id: str) -> Optional[Project]:
        """Fetches a single project by primary key ID."""
        return db.scalar(select(Project).where(Project.id == project_id))

    @staticmethod
    def create_project(db: Session, data: ProjectCreate) -> Project:
        """Creates and persists a new Project."""
        project_id = data.id if data.id else f"proj-{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)

        # Compute margin
        selling_price = float(data.selling_price)
        mfg_cost = float(data.mfg_cost)
        margin = round(((selling_price - mfg_cost) / selling_price) * 100.0, 1) if selling_price > 0 else 0.0

        project = Project(
            id=project_id,
            name=data.name.strip(),
            category=data.category.strip(),
            target_market=data.target_market,
            selling_price=selling_price,
            mfg_cost=mfg_cost,
            moq=data.moq if data.moq is not None else 500,
            marketing_budget=float(data.marketing_budget) if data.marketing_budget is not None else 50000.0,
            margin=margin,
            description=data.description,
            ingredients=data.ingredients,
            target_audience=data.target_audience,
            image=data.image or "/images/cat-beverages.jpg",
            status=data.status or "In Progress",
            viability_score=data.viability_score if data.viability_score is not None else 50,
            viability_grade=data.viability_grade,
            report=data.report,
            user_id=data.user_id or "default_user",
            created_at=now,
            updated_at=now,
        )

        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def update_project(db: Session, project_id: str, data: ProjectUpdate) -> Optional[Project]:
        """Updates an existing project in place, recalculating metrics and updating timestamp."""
        project = ProjectRepository.get_by_id(db, project_id)
        if not project:
            return None

        update_dict = data.model_dump(exclude_unset=True)

        for key, val in update_dict.items():
            if hasattr(project, key) and val is not None:
                setattr(project, key, val)

        # Recalculate margin if price or cost updated
        if "selling_price" in update_dict or "mfg_cost" in update_dict:
            if project.selling_price > 0:
                project.margin = round(((project.selling_price - project.mfg_cost) / project.selling_price) * 100.0, 1)

        project.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete_project(db: Session, project_id: str) -> bool:
        """Deletes a project by ID."""
        project = ProjectRepository.get_by_id(db, project_id)
        if not project:
            return False

        db.delete(project)
        db.commit()
        return True
