'use client'

import { useConfig } from '@payloadcms/ui'
import { useRef, useState } from 'react'

import type { ImportProduct, ImportRow } from '@/lib/product-import/parse'

type PreviewRow = ImportRow & { exists: boolean }
type Result = {
  line: number
  name: string
  action: 'created' | 'updated' | 'skipped' | 'failed'
  messages: string[]
}

const cell: React.CSSProperties = {
  padding: '0.5rem 0.6rem',
  borderBottom: '1px solid var(--theme-elevation-100)',
  textAlign: 'left',
  verticalAlign: 'top',
}
const small: React.CSSProperties = { fontSize: '0.85em', opacity: 0.8, margin: 0 }
const label: React.CSSProperties = { display: 'block', fontWeight: 600, marginBottom: '0.35rem' }

/** Products list: "Import from CSV" panel for moving the product catalogue over from WordPress. */
export function ProductImport() {
  const { config } = useConfig()
  const api = `${config.serverURL}${config.routes.api}/products/import`

  const [open, setOpen] = useState(false)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<PreviewRow[] | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [existing, setExisting] = useState<'skip' | 'update'>('skip')
  const [defaultStock, setDefaultStock] = useState(0)
  const [confirmOTC, setConfirmOTC] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [results, setResults] = useState<Result[] | null>(null)
  const stopRequested = useRef(false)

  function reset() {
    setFileName('')
    setRows(null)
    setSelected(new Set())
    setConfirmOTC(false)
    setError('')
    setProgress(null)
    setResults(null)
  }

  async function onFile(file: File | undefined) {
    reset()
    if (!file) return
    setFileName(file.name)
    setBusy(true)
    try {
      const res = await fetch(`${api}/preview`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: await file.text() }),
      })
      const data = (await res.json()) as { rows?: PreviewRow[]; error?: string }
      if (!res.ok || !data.rows) throw new Error(data.error || 'The file could not be read.')
      setRows(data.rows)
      setSelected(new Set(data.rows.filter((r) => r.include && !r.error).map((r) => r.line)))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function runImport() {
    if (!rows) return
    // One product per request: image downloads are slow and hosting functions have short time limits.
    const todo = rows.filter((r) => selected.has(r.line) && r.product)
    stopRequested.current = false
    setBusy(true)
    setError('')
    setProgress({ done: 0, total: todo.length })
    const out: Result[] = []
    for (const [i, row] of todo.entries()) {
      if (stopRequested.current) break
      try {
        const res = await fetch(`${api}/commit`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product: row.product as ImportProduct,
            existing,
            defaultStock,
            confirmOTC,
          }),
        })
        const data = (await res.json()) as {
          action?: Result['action']
          warnings?: string[]
          error?: string
        }
        if (!res.ok || !data.action) throw new Error(data.error || `Server error (${res.status}).`)
        out.push({ line: row.line, name: row.name, action: data.action, messages: data.warnings ?? [] })
      } catch (err) {
        out.push({ line: row.line, name: row.name, action: 'failed', messages: [(err as Error).message] })
      }
      setProgress({ done: i + 1, total: todo.length })
    }
    setResults(out)
    setBusy(false)
  }

  if (!open) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: 'var(--base)',
        }}
      >
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          style={{ margin: 0 }}
          onClick={() => setOpen(true)}
        >
          Import from CSV
        </button>
        <p style={small}>Moving from WordPress? Import your products from a WooCommerce CSV export.</p>
      </div>
    )
  }

  const importable = rows?.filter((r) => !r.error) ?? []
  const count = (pred: (r: PreviewRow) => boolean) => rows?.filter(pred).length ?? 0
  const cantImport = count((r) => !!r.error)
  const alreadyThere = count((r) => r.exists && !r.error)
  const tally = (action: Result['action']) => results?.filter((r) => r.action === action).length ?? 0

  return (
    <section
      aria-labelledby="product-import-title"
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 'var(--style-radius-m)',
        padding: 'calc(var(--base) * 1.25)',
        marginBottom: 'calc(var(--base) * 1.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
        <h2 id="product-import-title" style={{ margin: 0, fontSize: '1.25rem' }}>
          Import products from CSV
        </h2>
        {!busy && (
          <button
            type="button"
            className="btn btn--style-subtle btn--size-small"
            style={{ margin: 0 }}
            onClick={() => {
              reset()
              setOpen(false)
            }}
          >
            Close
          </button>
        )}
      </div>

      {!results && (
        <>
          <p style={{ ...small, marginTop: '0.5rem' }}>
            In your old WordPress admin go to <strong>Products → Export</strong>, keep “Export all
            columns” and all product types, and click <strong>Generate CSV</strong>. Then choose that
            file here. Nothing is saved until you click Import.
          </p>
          <div style={{ marginTop: 'var(--base)' }}>
            <label htmlFor="product-import-file" style={label}>
              CSV file
            </label>
            <input
              id="product-import-file"
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            {busy && !progress && (
              <p role="status" style={small}>
                Reading {fileName}…
              </p>
            )}
          </div>
        </>
      )}

      {error && (
        <p role="alert" style={{ color: 'var(--theme-error-500)', marginTop: 'var(--base)' }}>
          {error}
        </p>
      )}

      {rows && !results && (
        <>
          <p style={{ marginTop: 'var(--base)' }}>
            <strong>{rows.length}</strong> rows in {fileName}: {importable.length} can be imported
            {cantImport > 0 && <>, {cantImport} can’t</>}
            {alreadyThere > 0 && <>, {alreadyThere} already in the shop</>}.
          </p>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', margin: 'var(--base) 0' }}>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={label}>Products already in the shop (same SKU or name)</legend>
              <label style={{ display: 'block' }}>
                <input
                  type="radio"
                  name="existing"
                  checked={existing === 'skip'}
                  onChange={() => setExisting('skip')}
                  disabled={busy}
                />{' '}
                Leave them unchanged
              </label>
              <label style={{ display: 'block' }}>
                <input
                  type="radio"
                  name="existing"
                  checked={existing === 'update'}
                  onChange={() => setExisting('update')}
                  disabled={busy}
                />{' '}
                Update them with the file’s details
              </label>
            </fieldset>
            <div>
              <label htmlFor="product-import-stock" style={label}>
                Stock for new products without a count
              </label>
              <input
                id="product-import-stock"
                type="number"
                min={0}
                step={1}
                value={defaultStock}
                disabled={busy}
                onChange={(e) => setDefaultStock(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                style={{ width: '6rem' }}
              />
              <p style={small}>0 shows them as “Out of stock”.</p>
            </div>
          </div>

          <div
            style={{
              overflow: 'auto',
              maxHeight: '28rem',
              border: '1px solid var(--theme-elevation-100)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--theme-elevation-50)' }}>
                <tr>
                  <th style={cell} scope="col">
                    <input
                      type="checkbox"
                      aria-label="Select all products that can be imported"
                      checked={importable.length > 0 && selected.size === importable.length}
                      onChange={(e) =>
                        setSelected(new Set(e.target.checked ? importable.map((r) => r.line) : []))
                      }
                      disabled={busy}
                    />
                  </th>
                  <th style={cell} scope="col">Line</th>
                  <th style={cell} scope="col">Product</th>
                  <th style={cell} scope="col">Price</th>
                  <th style={cell} scope="col">Stock</th>
                  <th style={cell} scope="col">Category</th>
                  <th style={cell} scope="col">Images</th>
                  <th style={cell} scope="col">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line} style={r.error ? { opacity: 0.65 } : undefined}>
                    <td style={cell}>
                      <input
                        type="checkbox"
                        aria-label={`Import ${r.name}`}
                        checked={selected.has(r.line)}
                        disabled={busy || !!r.error}
                        onChange={(e) => {
                          const next = new Set(selected)
                          if (e.target.checked) next.add(r.line)
                          else next.delete(r.line)
                          setSelected(next)
                        }}
                      />
                    </td>
                    <td style={cell}>{r.line}</td>
                    <td style={cell}>
                      {r.name}
                      {r.product?.sku && <p style={small}>SKU {r.product.sku}</p>}
                      {r.exists && <p style={small}>Already in the shop</p>}
                    </td>
                    <td style={cell}>{r.product ? `$${r.product.price.toFixed(2)}` : ''}</td>
                    <td style={cell}>{r.product ? (r.product.stock ?? '—') : ''}</td>
                    <td style={cell}>{r.product?.categoryName ?? ''}</td>
                    <td style={cell}>{r.product ? r.product.imageUrls.length : ''}</td>
                    <td style={cell}>
                      {r.error && (
                        <p style={{ margin: 0, color: 'var(--theme-error-500)' }}>{r.error}</p>
                      )}
                      {r.warnings.map((w) => (
                        <p key={w} style={small}>
                          {w}
                        </p>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start',
              marginTop: 'var(--base)',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={confirmOTC}
              onChange={(e) => setConfirmOTC(e.target.checked)}
              disabled={busy}
              style={{ marginTop: '0.2rem' }}
            />
            I confirm every selected product is an over-the-counter product that can be sold without
            a prescription.
          </label>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginTop: 'var(--base)',
            }}
          >
            <button
              type="button"
              className="btn btn--style-primary btn--size-medium"
              style={{ margin: 0 }}
              disabled={busy || !confirmOTC || selected.size === 0}
              onClick={runImport}
            >
              {busy
                ? 'Importing…'
                : `Import ${selected.size} product${selected.size === 1 ? '' : 's'}`}
            </button>
            {busy && progress && (
              <>
                <span role="status">
                  Importing {progress.done} of {progress.total}… (images can take a few seconds each)
                </span>
                <button
                  type="button"
                  className="btn btn--style-secondary btn--size-small"
                  style={{ margin: 0 }}
                  onClick={() => {
                    stopRequested.current = true
                  }}
                >
                  Stop
                </button>
              </>
            )}
          </div>
        </>
      )}

      {results && (
        <div role="status" style={{ marginTop: 'var(--base)' }}>
          <p>
            <strong>Done.</strong> {tally('created')} created, {tally('updated')} updated,{' '}
            {tally('skipped')} left unchanged, {tally('failed')} failed
            {progress && progress.done < progress.total &&
              ` (stopped after ${progress.done} of ${progress.total})`}
            . Check prices, stock and descriptions before customers see them.
          </p>
          {results.some((r) => r.action === 'failed' || r.messages.length > 0) && (
            <ul style={{ maxHeight: '18rem', overflowY: 'auto', paddingLeft: '1.25rem' }}>
              {results
                .filter((r) => r.action === 'failed' || r.messages.length > 0)
                .map((r) => (
                  <li key={r.line} style={{ marginBottom: '0.35rem' }}>
                    <strong
                      style={r.action === 'failed' ? { color: 'var(--theme-error-500)' } : undefined}
                    >
                      Line {r.line}, {r.name} ({r.action})
                    </strong>
                    {r.messages.map((m) => (
                      <p key={m} style={small}>
                        {m}
                      </p>
                    ))}
                  </li>
                ))}
            </ul>
          )}
          <button
            type="button"
            className="btn btn--style-primary btn--size-medium"
            style={{ margin: 0 }}
            onClick={() => window.location.reload()}
          >
            Show the products
          </button>
        </div>
      )}
    </section>
  )
}
