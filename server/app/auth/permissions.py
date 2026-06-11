"""
Permissions Module
Centralized role-based permissions definitions.
"""

from enum import StrEnum

from loguru import logger

from app.schemas.user import UserRole


class Permission(StrEnum):
    """Available permissions."""

    READ_CAMERAS = "read:cameras"
    WRITE_CAMERAS = "write:cameras"
    DELETE_CAMERAS = "delete:cameras"
    READ_ALERTS = "read:alerts"
    READ_EVENTS = "read:events"
    WRITE_EVENTS = "write:events"
    ACK_ALERTS = "ack:alerts"
    MANAGE_USERS = "manage:users"
    VIEW_SYSTEM = "view:system"
    VIEW_ANALYTICS = "view:analytics"


# Role to permissions mapping
ROLE_PERMISSIONS: dict[UserRole, set[Permission]] = {
    UserRole.ADMIN: {
        Permission.READ_CAMERAS,
        Permission.WRITE_CAMERAS,
        Permission.DELETE_CAMERAS,
        Permission.READ_ALERTS,
        Permission.READ_EVENTS,
        Permission.WRITE_EVENTS,
        Permission.ACK_ALERTS,
        Permission.MANAGE_USERS,
        Permission.VIEW_SYSTEM,
        Permission.VIEW_ANALYTICS,
    },
    UserRole.COMMAND_OFFICER: {
        Permission.READ_CAMERAS,
        Permission.WRITE_CAMERAS,
        Permission.READ_ALERTS,
        Permission.READ_EVENTS,
        Permission.ACK_ALERTS,
        Permission.VIEW_SYSTEM,
        Permission.VIEW_ANALYTICS,
    },
    UserRole.REGIONAL_OFFICER: {
        Permission.READ_CAMERAS,
        Permission.READ_ALERTS,
        Permission.READ_EVENTS,
        Permission.ACK_ALERTS,
        Permission.VIEW_ANALYTICS,
    },
    UserRole.SOLDIER: {
        Permission.READ_ALERTS,
        Permission.ACK_ALERTS,
    },
    UserRole.VIEWER: {
        Permission.READ_CAMERAS,
        Permission.READ_ALERTS,
        Permission.READ_EVENTS,
    },
}


class PermissionChecker:
    """Checks if a user has required permissions."""

    @staticmethod
    def has_permission(user_role: UserRole, permission: Permission) -> bool:
        """Checks if a user's role has a specific permission."""
        allowed = permission in ROLE_PERMISSIONS.get(user_role, set())
        logger.debug(
            f"Permission check for role {user_role.value}, "
            f"permission {permission.value}: {'allowed' if allowed else 'denied'}"
        )
        return allowed

    @staticmethod
    def has_any_permission(user_role: UserRole, permissions: list[Permission]) -> bool:
        """Checks if a user's role has any of the specified permissions."""
        allowed = any(p in ROLE_PERMISSIONS.get(user_role, set()) for p in permissions)
        logger.debug(
            f"Any permission check for role {user_role.value}, "
            f"permissions {[p.value for p in permissions]}: {'allowed' if allowed else 'denied'}"
        )
        return allowed

    @staticmethod
    def get_permissions_for_role(role: UserRole) -> set[Permission]:
        """Returns all permissions for a given role."""
        return ROLE_PERMISSIONS.get(role, set())


# Singleton instance
permission_checker = PermissionChecker()
