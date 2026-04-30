/**
 * Permission name constants. Mirror Domain.Enums.Permission on the backend
 * (1:1 by string name). The values match the strings returned by
 * `GET /api/Auth/me/permissions` so a `Set<string>` membership check is
 * enough — the SPA never has to know the underlying integer codes.
 */
export const Permission = {
  // Family
  GET_FAMILY: 'GET_FAMILY',
  CREATE_FAMILY: 'CREATE_FAMILY',
  UPDATE_FAMILY: 'UPDATE_FAMILY',
  DELETE_FAMILY: 'DELETE_FAMILY',

  // Member
  GET_MEMBER: 'GET_MEMBER',
  CREATE_MEMBER: 'CREATE_MEMBER',
  UPDATE_MEMBER: 'UPDATE_MEMBER',
  DELETE_MEMBER: 'DELETE_MEMBER',

  // User
  GET_USER: 'GET_USER',
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',

  // Role
  GET_ROLE: 'GET_ROLE',
  CREATE_ROLE: 'CREATE_ROLE',
  UPDATE_ROLE: 'UPDATE_ROLE',
  DELETE_ROLE: 'DELETE_ROLE',

  // File
  GET_FILE: 'GET_FILE',
  CREATE_FILE: 'CREATE_FILE',
  UPDATE_FILE: 'UPDATE_FILE',
  DELETE_FILE: 'DELETE_FILE',

  // Role-permission
  GET_ROLE_PERMISSION: 'GET_ROLE_PERMISSION',
  CREATE_ROLE_PERMISSION: 'CREATE_ROLE_PERMISSION',
  UPDATE_ROLE_PERMISSION: 'UPDATE_ROLE_PERMISSION',
  DELETE_ROLE_PERMISSION: 'DELETE_ROLE_PERMISSION'
} as const;

export type PermissionName = typeof Permission[keyof typeof Permission];
