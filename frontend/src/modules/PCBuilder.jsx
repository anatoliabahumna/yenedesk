import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2 } from 'lucide-react'

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

  useEffect(() => {
    fetchParts()
    fetchOrders()
  }, [])

  async function fetchParts() {
    const res = await fetch('/api/pc/parts')
    setParts(await res.json())
  }

  async function fetchOrders() {
    const res = await fetch('/api/pc/orders')
    setOrders(await res.json())
  }

  async function submitPart(e) {
    e.preventDefault()
    if (currentPart) {
      await fetch(`/api/pc/parts/${currentPart.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partForm),
      })
    } else {
      await fetch('/api/pc/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partForm),
      })
    }
    setIsPartDialogOpen(false)
    setCurrentPart(null)
    setPartForm({ category: '', part_name: '', store: '', price: '', url: '', note: '' })
    fetchParts()
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

  async function deletePart(id) {
    await fetch(`/api/pc/parts/${id}`, { method: 'DELETE' })
    fetchParts()
  }

  async function submitOrder(e) {
    e.preventDefault()
    if (currentOrder) {
      await fetch(`/api/pc/orders/${currentOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm),
      })
    } else {
      await fetch('/api/pc/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm),
      })
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
    fetchOrders()
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

  async function deleteOrder(id) {
    await fetch(`/api/pc/orders/${id}`, { method: 'DELETE' })
    fetchOrders()
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

      {view === 'parts' ? (
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
            <Card>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                <table className="w-full table-auto">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 hidden md:table-cell">Category</th>
                      <th className="p-4">Part</th>
                      <th className="p-4 hidden md:table-cell">Store</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Link</th>
                      <th className="p-4 hidden lg:table-cell">Note</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="p-4 hidden md:table-cell">{p.category}</td>
                        <td className="p-4 font-semibold break-anywhere">{p.part_name}</td>
                        <td className="p-4 hidden md:table-cell break-anywhere">{p.store}</td>
                        <td className="p-4 whitespace-nowrap">{currency(p.price)}</td>
                        <td className="p-4 whitespace-nowrap">
                          {p.url ? (
                            <a href={p.url} className="text-primary underline" target="_blank" rel="noreferrer">Open</a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-pre-wrap break-anywhere hidden lg:table-cell">{p.note}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => editPart(p)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deletePart(p.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </CardContent>
            </Card>
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
            <Card>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                <table className="w-full table-auto">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4">Date</th>
                      <th className="p-4">Item</th>
                      <th className="p-4 hidden md:table-cell">Store</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 hidden lg:table-cell">Courier</th>
                      <th className="p-4 hidden lg:table-cell">Tracking</th>
                      <th className="p-4 hidden md:table-cell">Note</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="p-4">{o.date}</td>
                        <td className="p-4 font-semibold break-anywhere">{o.item}</td>
                        <td className="p-4 hidden md:table-cell break-anywhere">{o.store}</td>
                        <td className="p-4 whitespace-nowrap">{currency(o.price)}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-[10px] uppercase tracking-wide">
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 hidden lg:table-cell break-anywhere">{o.courier}</td>
                        <td className="p-4 hidden lg:table-cell break-anywhere">{o.tracking_number}</td>
                        <td className="p-4 text-muted-foreground whitespace-pre-wrap break-anywhere hidden md:table-cell">{o.note}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => editOrder(o)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteOrder(o.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </CardContent>
            </Card>
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
    </div>
  )
}


