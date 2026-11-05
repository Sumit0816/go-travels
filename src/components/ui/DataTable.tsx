import type { ReactNode } from 'react'

export type Column<Row> = {
  key: string
  header: string
  /** Visually hide the header text (e.g. an "Actions" column) while keeping it for screen readers. */
  hideHeader?: boolean
  align?: 'left' | 'right' | 'center'
  render: (row: Row) => ReactNode
}

type DataTableProps<Row> = {
  columns: Column<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  caption?: string
  empty?: ReactNode
  minWidth?: number
}

/** CMS list table: white panel, uppercase 12px headers, horizontal scroll on small screens. */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
  minWidth = 760,
}: DataTableProps<Row>) {
  return (
    <div className="gt-table-wrap">
      <table className="gt-table" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" style={{ textAlign: c.align }}>
                {c.hideHeader ? <span className="sr-only">{c.header}</span> : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-ink-500">
                {empty ?? 'Nothing here yet.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td key={c.key} style={{ textAlign: c.align }}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
