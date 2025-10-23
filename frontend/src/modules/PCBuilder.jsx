import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { request } from '@/lib/api'
import { useToast } from '@/components/ui/toast.jsx'

export default function PCBuilder() {
  const [view, setView] = useState('parts') // 'parts' | 'orders'

  // Parts
  const [parts, setParts] = useState([])
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false)
  const [currentPart, setCurrentPart] = useState(null)
  const [partForm, setPartForm] = useState({
    category: '',
    part_name: '',
    store: '',
    price: '',
    url: '',
    note: '',
  })

  // Orders
  const [orders, setOrders] = useState([])
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [orderForm, setOrderForm] = useState({
    item: '',
    date: new Date().toISOString().split('T')[0],
    store: '',
    price: '',
    status: 'ordered',
    courier: '',
    tracking_number: '',
    note: '',
  })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const toast = useToast()

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setIsLoading(true)
    setLoadError(null)
    try {
      const [partData, orderData] = await Promise.all([
        request('/api/pc/parts'),
        request('/api/pc/orders'),
      ])
      setParts(Array.isArray(partData) ? partData : [])
      setOrders(Array.isArray(orderData) ? orderData : [])
    } catch (error) {
      setLoadError(error.message || 'Failed to load PC Builder data')
      toast({
        title: 'Unable to load PC Builder data',
        description: error.message,
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function refreshParts() {
    try {
      const data = await request('/api/pc/parts')
      setParts(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: 'Failed to refresh parts',
        description: error.message,
        variant: 'error',
      })
    }
  }

  async function refreshOrders() {
    try {
      const data = await request('/api/pc/orders')
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: 'Failed to refresh orders',
        description: error.message,
        variant: 'error',
      })
    }
  }

  async function submitPart(e) {
    e.preventDefault()
    try {
      if (currentPart) {
        await request(`/api/pc/parts/${currentPart.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partForm),
        })
        toast({ title: 'Part updated', description: 'Changes saved successfully.', variant: 'success' })
      } else {
        await request('/api/pc/parts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partForm),
        })
        toast({ title: 'Part added', description: 'The part has been added to your plan.', variant: 'success' })
      }
      setIsPartDialogOpen(false)
      setCurrentPart(null)
      setPartForm({ category: '', part_name: '', store: '', price: '', url: '', note: '' })
      refreshParts()
    } catch (error) {
      toast({
        title: currentPart ? 'Unable to update part' : 'Unable to create part',
        description: error.message,
        variant: 'error',
      })
    }
  }

  function editPart(part) {
    setCurrentPart(part)
    setPartForm({
      category: part.category,
      part_name: part.part_name,
      store: part.store || '',
      price: part.price ?? '',
      url: part.url || '',
      note: part.note || '',
    })
    setIsPartDialogOpen(true)
  }

  async function submitOrder(e) {
    e.preventDefault()
    try {
      if (currentOrder) {
        await request(`/api/pc/orders/${currentOrder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderForm),
        })
        toast({ title: 'Entry updated', description: 'Changes saved successfully.', variant: 'success' })
      } else {
        await request('/api/pc/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderForm),
        })
        toast({ title: 'Entry added', description: 'The log entry has been created.', variant: 'success' })
      }
      setIsOrderDialogOpen(false)
      setCurrentOrder(null)
      setOrderForm({
        item: '',
        date: new Date().toISOString().split('T')[0],
        store: '',
        price: '',
        status: 'ordered',
        courier: '',
        tracking_number: '',
        note: '',
      })
      refreshOrders()
    } catch (error) {
      toast({
        title: currentOrder ? 'Unable to update entry' : 'Unable to create entry',
        description: error.message,
        variant: 'error',
      })
    }
  }

  function editOrder(order) {
    setCurrentOrder(order)
    setOrderForm({
      item: order.item,
      date: order.date,
      store: order.store,
      price: order.price ?? '',
      status: order.status,
      courier: order.courier || '',
      tracking_number: order.tracking_number || '',
      note: order.note || '',
    })
    setIsOrderDialogOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'part') {
        await request(`/api/pc/parts/${deleteTarget.item.id}`, { method: 'DELETE' })
        toast({ title: 'Part deleted', description: 'The part has been removed.', variant: 'success' })
        refreshParts()
      } else {
        await request(`/api/pc/orders/${deleteTarget.item.id}`, { method: 'DELETE' })
        toast({ title: 'Entry deleted', description: 'The log entry has been removed.', variant: 'success' })
        refreshOrders()
      }
      setDeleteTarget(null)
    } catch (error) {
      toast({
        title: deleteTarget.type === 'part' ? 'Unable to delete part' : 'Unable to delete entry',
        description: error.message,
        variant: 'error',
      })
    }
  }

  const currency = (n) => `$${Number(n || 0).toFixed(2)}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">PC Build Planner</h1>
          <p className="text-muted-foreground">Plan parts and track shopping/returns</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'parts' ? 'default' : 'outline'} onClick={() => setView('parts')}>Parts Plan</Button>
          <Button variant={view === 'orders' ? 'default' : 'outline'} onClick={() => setView('orders')}>Shopping & Returns</Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Loading your PC Builder data…</p>
          </CardContent>
        </Card>
      ) : loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" onClick={loadInitialData}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : view === 'parts' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Parts</h2>
            <Button onClick={() => setIsPartDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Part
            </Button>
          </div>
          {parts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No parts yet. Add your first planned part.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <table className="w-full table-auto">
                    <thead className="border-b text-sm font-semibold text-muted-foreground">
                      <tr className="text-left">
                        <th className="p-4">Category</th>
                        <th className="p-4">Part</th>
                        <th className="p-4">Store</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Link</th>
                        <th className="p-4">Note</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="p-4 align-top">{p.category}</td>
                          <td className="p-4 font-semibold break-anywhere align-top">{p.part_name}</td>
                          <td className="p-4 break-anywhere align-top">{p.store}</td>
                          <td className="p-4 whitespace-nowrap align-top">{currency(p.price)}</td>
                          <td className="p-4 align-top">
                            {p.url ? (
                              <a
                                href={p.url}
                                className="text-primary underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground whitespace-pre-wrap break-anywhere align-top">{p.note}</td>
                          <td className="p-4 align-top">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => editPart(p)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteTarget({ type: 'part', item: p })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              <div className="space-y-3 md:hidden">
                {parts.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{p.part_name}</p>
                          <p className="text-xs text-muted-foreground">{p.category}</p>
                        </div>
                        <span className="text-sm font-semibold">{currency(p.price)}</span>
                      </div>
                      {p.store ? (
                        <p className="text-sm text-muted-foreground break-anywhere">Store: {p.store}</p>
                      ) : null}
                      {p.note ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.note}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        {p.url ? (
                          <a
                            href={p.url}
                            className="text-sm font-medium text-primary underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open link
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">No link provided</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => editPart(p)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setDeleteTarget({ type: 'part', item: p })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Shopping & Return Log</h2>
            <Button onClick={() => setIsOrderDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </div>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No entries yet. Log your first purchase/return.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <table className="w-full table-auto">
                    <thead className="border-b text-sm font-semibold text-muted-foreground">
                      <tr className="text-left">
                        <th className="p-4">Date</th>
                        <th className="p-4">Item</th>
                        <th className="p-4">Store</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Courier</th>
                        <th className="p-4">Tracking</th>
                        <th className="p-4">Note</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} className="border-b last:border-0">
                          <td className="p-4 align-top">{o.date}</td>
                          <td className="p-4 font-semibold break-anywhere align-top">{o.item}</td>
                          <td className="p-4 break-anywhere align-top">{o.store}</td>
                          <td className="p-4 whitespace-nowrap align-top">{currency(o.price)}</td>
                          <td className="p-4 align-top">
                            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4 break-anywhere align-top">{o.courier}</td>
                          <td className="p-4 break-anywhere align-top">{o.tracking_number}</td>
                          <td className="p-4 text-muted-foreground whitespace-pre-wrap break-anywhere align-top">{o.note}</td>
                          <td className="p-4 align-top">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => editOrder(o)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteTarget({ type: 'order', item: o })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              <div className="space-y-3 md:hidden">
                {orders.map((o) => (
                  <Card key={o.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{o.item}</p>
                          <p className="text-xs text-muted-foreground">{o.date}</p>
                        </div>
                        <span className="text-sm font-semibold">{currency(o.price)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-secondary px-2 py-1 font-semibold uppercase tracking-wide text-secondary-foreground">
                          {o.status}
                        </span>
                        {o.store ? <span>Store: {o.store}</span> : null}
                        {o.courier ? <span>Courier: {o.courier}</span> : null}
                        {o.tracking_number ? <span>Tracking: {o.tracking_number}</span> : null}
                      </div>
                      {o.note ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{o.note}</p>
                      ) : null}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => editOrder(o)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setDeleteTarget({ type: 'order', item: o })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Part Dialog */}
      <Dialog open={isPartDialogOpen} onOpenChange={setIsPartDialogOpen}>
        <DialogContent onClose={() => setIsPartDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{currentPart ? 'Edit Part' : 'Add Part'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPart}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={partForm.category} onChange={(e) => setPartForm({ ...partForm, category: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="part_name">Part</Label>
                <Input id="part_name" value={partForm.part_name} onChange={(e) => setPartForm({ ...partForm, part_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <Input id="store" value={partForm.store} onChange={(e) => setPartForm({ ...partForm, store: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" step="0.01" min="0" value={partForm.price} onChange={(e) => setPartForm({ ...partForm, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Link</Label>
                <Input id="url" value={partForm.url} onChange={(e) => setPartForm({ ...partForm, url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea id="note" rows={4} value={partForm.note} onChange={(e) => setPartForm({ ...partForm, note: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPartDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{currentPart ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent onClose={() => setIsOrderDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{currentOrder ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitOrder}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item">Item</Label>
                <Input id="item" value={orderForm.item} onChange={(e) => setOrderForm({ ...orderForm, item: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={orderForm.date} onChange={(e) => setOrderForm({ ...orderForm, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <Input id="store" value={orderForm.store} onChange={(e) => setOrderForm({ ...orderForm, store: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oprice">Price</Label>
                <Input id="oprice" type="number" step="0.01" min="0" value={orderForm.price} onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" className="w-full rounded-md border border-input bg-background px-3 py-2" value={orderForm.status} onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}>
                  <option value="ordered">ordered</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="returned">returned</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courier">Courier</Label>
                  <Input id="courier" value={orderForm.courier} onChange={(e) => setOrderForm({ ...orderForm, courier: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking">Tracking Number</Label>
                  <Input id="tracking" value={orderForm.tracking_number} onChange={(e) => setOrderForm({ ...orderForm, tracking_number: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onote">Note</Label>
                <Textarea id="onote" rows={4} value={orderForm.note} onChange={(e) => setOrderForm({ ...orderForm, note: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOrderDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{currentOrder ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent onClose={() => setDeleteTarget(null)}>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.type === 'part' ? 'Part' : 'Log Entry'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{deleteTarget?.item?.part_name || deleteTarget?.item?.item}"? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


