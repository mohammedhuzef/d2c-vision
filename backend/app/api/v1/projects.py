"""API endpoints for Projects (/api/v1/projects)."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import NotFoundError
from backend.app.models.project import Project
from backend.app.repositories.project_repository import ProjectRepository
from backend.app.schemas.project import (
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["Projects"])


def _to_project_response(project: Project) -> ProjectResponse:
    """Helper to convert Project ORM model to ProjectResponse schema."""
    created_iso = (
        project.created_at.isoformat()
        if hasattr(project.created_at, "isoformat")
        else str(project.created_at)
    )
    updated_iso = (
        project.updated_at.isoformat()
        if hasattr(project.updated_at, "isoformat")
        else str(project.updated_at)
    )

    return ProjectResponse(
        id=project.id,
        name=project.name,
        category=project.category,
        target_market=project.target_market,
        selling_price=project.selling_price,
        mfg_cost=project.mfg_cost,
        moq=project.moq,
        marketing_budget=project.marketing_budget,
        margin=project.margin,
        description=project.description,
        ingredients=project.ingredients,
        target_audience=project.target_audience,
        image=project.image,
        status=project.status,
        viability_score=project.viability_score,
        viability_grade=project.viability_grade,
        report=project.report,
        user_id=project.user_id,
        created_at=created_iso,
        updated_at=updated_iso,
    )


@router.get(
    "",
    response_model=ProjectListResponse,
    summary="List saved projects with optional filtering",
)
def list_projects(
    search: Optional[str] = Query(None, description="Search term across name, category, description, ingredients"),
    category: Optional[str] = Query(None, description="Category filter"),
    status: Optional[str] = Query(None, description="Status filter"),
    user_id: Optional[str] = Query(None, description="User ID filter"),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = ProjectRepository.list_projects(
        db=db,
        search=search,
        category=category,
        status=status,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )
    return ProjectListResponse(
        items=[_to_project_response(p) for p in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a validated product project to the database",
)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
):
    project = ProjectRepository.create_project(db=db, data=data)
    return _to_project_response(project)


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get saved project details including feasibility report",
)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
):
    project = ProjectRepository.get_by_id(db=db, project_id=project_id)
    if not project:
        raise NotFoundError(f"Project '{project_id}' not found")
    return _to_project_response(project)


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update project specifications and status",
)
def update_project_put(
    project_id: str,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
):
    project = ProjectRepository.update_project(db=db, project_id=project_id, data=data)
    if not project:
        raise NotFoundError(f"Project '{project_id}' not found")
    return _to_project_response(project)


@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Patch project specifications and status",
)
def update_project_patch(
    project_id: str,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
):
    project = ProjectRepository.update_project(db=db, project_id=project_id, data=data)
    if not project:
        raise NotFoundError(f"Project '{project_id}' not found")
    return _to_project_response(project)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a saved project from the database",
)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
):
    deleted = ProjectRepository.delete_project(db=db, project_id=project_id)
    if not deleted:
        raise NotFoundError(f"Project '{project_id}' not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
