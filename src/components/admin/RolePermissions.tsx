import { MODULE_LABELS, MODULES, PERMISSIONS, ROLE_LABELS, ROLES, type Permission } from '@/access'

const LABEL: Record<Permission, string> = {
  full: 'Full',
  view: 'View',
  editStatus: 'Edit status',
  assigned: 'Assigned',
  none: 'None',
}

const COLOUR: Record<Permission, string | undefined> = {
  full: '#0F5E3A',
  view: undefined,
  editStatus: undefined,
  assigned: undefined,
  none: 'var(--theme-elevation-500)',
}

/**
 * "Role permissions" table above the Users list. Rendered straight from src/access/roles.ts,
 * so it always shows the rules the CMS actually enforces.
 */
export function RolePermissions() {
  return (
    <section className="gta-panel gta-perms" aria-labelledby="role-permissions-title">
      <div className="gta-panel__head">
        <h2 id="role-permissions-title" style={{ margin: 0, fontSize: 16 }}>
          Role permissions
        </h2>
      </div>
      <div className="gta-table-wrap">
        <table className="gta-table">
          <thead>
            <tr>
              <th scope="col">Module</th>
              {ROLES.map((r) => (
                <th scope="col" key={r}>
                  {ROLE_LABELS[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => (
              <tr key={m}>
                <th
                  scope="row"
                  style={{
                    background: 'transparent',
                    textTransform: 'none',
                    fontSize: 14,
                    letterSpacing: 0,
                  }}
                >
                  {MODULE_LABELS[m]}
                </th>
                {ROLES.map((r) => {
                  const p = PERMISSIONS[m][r]
                  return (
                    <td key={r} style={{ color: COLOUR[p], fontWeight: p === 'full' ? 600 : 400 }}>
                      {LABEL[p]}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
