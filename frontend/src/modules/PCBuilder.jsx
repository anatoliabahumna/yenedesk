import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Loader2, Cpu, Package, Truck, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

export default function PCBuilder() {
  const [view, setView] = useState('parts')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [highlightedId, setHighlightedId] = useState(null)
  const { toast } = useToast()

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
  const originalPartForm = useRef({
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
  const originalOrderForm = useRef({
    item: '',
    date: new Date().toISOString().split('T')[0],
    store: '',
    price: '',
    status: 'ordered',
    courier: '',
    tracking_number: '',
    note: '',
  })

  // Delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Detect unsaved changes
    const partChanges = Object.keys(partForm).some(
      key => partForm[key] !== originalPartForm.current[key]
    )
    const orderChanges = Object.keys(orderForm).some(
      key => orderForm[key] !== originalOrderForm.current[key]
    )
    setHasUnsavedChanges(partChanges || orderChanges)
  }, [partForm, orderForm])

  async function fetchData() {
    try {
      setIsLoading(true)
      const [partsRes, ordersRes] = await Promise.all([
        fetch('/api/pc/parts'),
        fetch('/api/pc/orders')
      ])

      if (!partsRes.ok || !ordersRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [partsData, ordersData] = await Promise.all([
        partsRes.json(),
        ordersRes.json()
      ])

      setParts(partsData)
      setOrders(ordersData)
    } catch (error) {
      toast.error('Failed to load data', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const validatePartForm = () => {
    const errors = {}
    if (!partForm.category.trim()) {
      errors.category = 'Category is required'
    }
    if (!partForm.part_name.trim()) {
      errors.part_name = 'Part name is required'
    }
    if (partForm.url && !partForm.url.match(/^https?:\/\/.+/)) {
      errors.url = 'Please enter a valid URL starting with http:// or https://'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateOrderForm = () => {
    const errors = {}
    if (!orderForm.item.trim()) {
      errors.item = 'Item is required'
    }
    if (!orderForm.date) {
      errors.date = 'Date is required'
    }
    if (!orderForm.store.trim()) {
      errors.store = 'Store is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function submitPart(e) {
    e.preventDefault()
    if (!validatePartForm()) return

    setIsSubmitting(true)
    try {
      const response = currentPart
        ? await fetch(`/api/pc/parts/${currentPart.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partForm),
          })
        : await fetch('/api/pc/parts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partForm),
          })

      if (!response.ok) {
        throw new Error(currentPart ? 'Failed to update part' : 'Failed to create part')
      }

      const savedPart = await response.json()

      setIsPartDialogOpen(false)
      setCurrentPart(null)
      setPartForm({ category: '', part_name: '', store: '', price: '', url: '', note: '' })
      setHasUnsavedChanges(false)
      setFormErrors({})

      toast.success(
        currentPart ? 'Part updated!' : 'Part added!',
        currentPart ? 'Your part has been updated.' : 'Your part has been added to the plan.'
      )

      await fetchData()

      if (!currentPart && savedPart.id) {
        setHighlightedId(savedPart.id)
        setTimeout(() => setHighlightedId(null), 2000)
      }
    } catch (error) {
      toast.error('Failed to save part', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function editPart(part) {
    setCurrentPart(part)
    const formData = {
      category: part.category,
      part_name: part.part_name,
      store: part.store || '',
      price: part.price ?? '',
      url: part.url || '',
      note: part.note || '',
    }
    setPartForm(formData)
    originalPartForm.current = { ...formData }
    setIsPartDialogOpen(true)
  }

  async function deletePart() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/pc/parts/${itemToDelete.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete part')

      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      toast.success('Part deleted', 'Your part has been removed from the plan.')
      await fetchData()
    } catch (error) {
      toast.error('Failed to delete part', error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  async function submitOrder(e) {
    e.preventDefault()
    if (!validateOrderForm()) return

    setIsSubmitting(true)
    try {
      const response = currentOrder
        ? await fetch(`/api/pc/orders/${currentOrder.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderForm),
          })
        : await fetch('/api/pc/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderForm),
          })

      if (!response.ok) {
        throw new Error(currentOrder ? 'Failed to update order' : 'Failed to create order')
      }

      const savedOrder = await response.json()

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
      setHasUnsavedChanges(false)
      setFormErrors({})

      toast.success(
        currentOrder ? 'Order updated!' : 'Order added!',
        currentOrder ? 'Your order has been updated.' : 'Your order has been logged.'
      )

      await fetchData()

      if (!currentOrder && savedOrder.id) {
        setHighlightedId(savedOrder.id)
        setTimeout(() => setHighlightedId(null), 2000)
      }
    } catch (error) {
      toast.error('Failed to save order', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function editOrder(order) {
    setCurrentOrder(order)
    const formData = {
      item: order.item,
      date: order.date,
      store: order.store,
      price: order.price ?? '',
      status: order.status,
      courier: order.courier || '',
      tracking_number: order.tracking_number || '',
      note: order.note || '',
    }
    setOrderForm(formData)
    originalOrderForm.current = { ...formData }
    setIsOrderDialogOpen(true)
  }

  async function deleteOrder() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/pc/orders/${itemToDelete.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete order')

      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      toast.success('Order deleted', 'Your order has been removed.')
      await fetchData()
    } catch (error) {
      toast.error('Failed to delete order', error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePartDialogClose = (open) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    setIsPartDialogOpen(open)
    if (!open) {
      setPartForm({ category: '', part_name: '', store: '', price: '', url: '', note: '' })
      setCurrentPart(null)
      setFormErrors({})
      setHasUnsavedChanges(false)
    }
  }

  const handleOrderDialogClose = (open) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    setIsOrderDialogOpen(open)
    if (!open) {
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
      setCurrentOrder(null)
      setFormErrors({})
      setHasUnsavedChanges(false)
    }
  }

  const confirmCloseDialog = () => {
    setShowUnsavedWarning(false)
    setIsPartDialogOpen(false)
    setIsOrderDialogOpen(false)
    setPartForm({ category: '', part_name: '', store: '', price: '', url: '', note: '' })
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
    setCurrentPart(null)
    setCurrentOrder(null)
    setFormErrors({})
    setHasUnsavedChanges(false)
  }

  const openNewPart = () => {
    setCurrentPart(null)
    setPartForm({ category: '', part_name: '', store: '', price: '', url: '', note: '' })
    originalPartForm.current = { category: '', part_name: '', store: '', price: '', url: '', note: '' }
    setFormErrors({})
    setHasUnsavedChanges(false)
    setIsPartDialogOpen(true)
  }

  const openNewOrder = () => {
    setCurrentOrder(null)
    const formData = {
      item: '',
      date: new Date().toISOString().split('T')[0],
      store: '',
      price: '',
      status: 'ordered',
      courier: '',
      tracking_number: '',
      note: '',
    }
    setOrderForm(formData)
    originalOrderForm.current = { ...formData }
    setFormErrors({})
    setHasUnsavedChanges(false)
    setIsOrderDialogOpen(true)
  }

  const getStatusBadge = (status) => {
    const configs = {
      ordered: {
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        icon: <Package className="h-3 w-3" />
      },
      shipped: {
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        icon: <Truck className="h-3 w-3" />
      },
      delivered: {
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        icon: <CheckCircle className="h-3 w-3" />
      },
      returned: {
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
        icon: <RotateCcw className="h-3 w-3" />
      },
      cancelled: {
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
        icon: <XCircle className="h-3 w-3" />
      }
    }

    const config = configs[status] || configs.ordered

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.icon}
        {status}
      </span>
    )
  }

  const currency = (n) => `$${Number(n || 0).toFixed(2)}`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">PC Build Planner</h1>
          <p className="text-muted-foreground">Plan parts and track shopping/returns</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'parts' ? 'default' : 'outline'}
            onClick={() => setView('parts')}
            className={view === 'parts' ? 'font-bold' : ''}
          >
            Parts Plan
          </Button>
          <Button
            variant={view === 'orders' ? 'default' : 'outline'}
            onClick={() => setView('orders')}
            className={view === 'orders' ? 'font-bold' : ''}
          >
            Shopping & Returns
          </Button>
        </div>
      </div>

      {view === 'parts' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Parts</h2>
            <Button onClick={openNewPart}>
              <Plus className="mr-2 h-4 w-4" />
              Add Part
            </Button>
          </div>
          {parts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <Cpu className="h-16 w-16 text-muted-foreground opacity-50" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">No parts yet</p>
                  <p className="text-sm text-muted-foreground">Add your first part to start planning your PC build</p>
                </div>
                <Button onClick={openNewPart} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Part
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto relative">
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none md:hidden" />
                  <table className="w-full table-auto min-w-[640px]">
                    <thead className="border-b bg-muted/50">
                      <tr className="text-left">
                        <th className="p-4 font-semibold hidden md:table-cell">Category</th>
                        <th className="p-4 font-semibold">Part</th>
                        <th className="p-4 font-semibold hidden md:table-cell">Store</th>
                        <th className="p-4 font-semibold">Price</th>
                        <th className="p-4 font-semibold">Link</th>
                        <th className="p-4 font-semibold hidden lg:table-cell">Note</th>
                        <th className="p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map((p) => (
                        <tr
                          key={p.id}
                          className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${
                            highlightedId === p.id
                              ? 'bg-primary/10 animate-in fade-in duration-500'
                              : ''
                          }`}
                        >
                          <td className="p-4 hidden md:table-cell">{p.category}</td>
                          <td className="p-4 font-semibold break-anywhere">{p.part_name}</td>
                          <td className="p-4 hidden md:table-cell break-anywhere">{p.store || '—'}</td>
                          <td className="p-4 whitespace-nowrap">{currency(p.price)}</td>
                          <td className="p-4 whitespace-nowrap">
                            {p.url ? (
                              <a href={p.url} className="text-primary underline hover:text-primary/80" target="_blank" rel="noreferrer">
                                Open
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground whitespace-pre-wrap break-anywhere hidden lg:table-cell">
                            {p.note || '—'}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => editPart(p)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setItemToDelete(p)
                                  setDeleteType('part')
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
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
            <Button onClick={openNewOrder}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </div>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <Package className="h-16 w-16 text-muted-foreground opacity-50" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">No orders yet</p>
                  <p className="text-sm text-muted-foreground">Log your first purchase or return to start tracking</p>
                </div>
                <Button onClick={openNewOrder} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto relative">
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none md:hidden" />
                  <table className="w-full table-auto min-w-[640px]">
                    <thead className="border-b bg-muted/50">
                      <tr className="text-left">
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold">Item</th>
                        <th className="p-4 font-semibold hidden md:table-cell">Store</th>
                        <th className="p-4 font-semibold">Price</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold hidden lg:table-cell">Courier</th>
                        <th className="p-4 font-semibold hidden lg:table-cell">Tracking</th>
                        <th className="p-4 font-semibold hidden md:table-cell">Note</th>
                        <th className="p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr
                          key={o.id}
                          className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${
                            highlightedId === o.id
                              ? 'bg-primary/10 animate-in fade-in duration-500'
                              : ''
                          }`}
                        >
                          <td className="p-4">{o.date}</td>
                          <td className="p-4 font-semibold break-anywhere">{o.item}</td>
                          <td className="p-4 hidden md:table-cell break-anywhere">{o.store}</td>
                          <td className="p-4 whitespace-nowrap">{currency(o.price)}</td>
                          <td className="p-4">{getStatusBadge(o.status)}</td>
                          <td className="p-4 hidden lg:table-cell break-anywhere">{o.courier || '—'}</td>
                          <td className="p-4 hidden lg:table-cell break-anywhere">{o.tracking_number || '—'}</td>
                          <td className="p-4 text-muted-foreground whitespace-pre-wrap break-anywhere hidden md:table-cell">
                            {o.note || '—'}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => editOrder(o)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setItemToDelete(o)
                                  setDeleteType('order')
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
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
      <Dialog open={isPartDialogOpen} onOpenChange={handlePartDialogClose}>
        <DialogContent onKeyDown={(e) => e.key === 'Escape' && handlePartDialogClose(false)}>
          <DialogHeader>
            <DialogTitle>{currentPart ? 'Edit Part' : 'Add Part'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPart}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={partForm.category}
                  onChange={(e) => {
                    setPartForm({ ...partForm, category: e.target.value })
                    if (formErrors.category) setFormErrors({ ...formErrors, category: '' })
                  }}
                  className={formErrors.category ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  autoFocus
                />
                {formErrors.category && (
                  <p className="text-sm text-red-500">{formErrors.category}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="part_name">Part</Label>
                <Input
                  id="part_name"
                  value={partForm.part_name}
                  onChange={(e) => {
                    setPartForm({ ...partForm, part_name: e.target.value })
                    if (formErrors.part_name) setFormErrors({ ...formErrors, part_name: '' })
                  }}
                  className={formErrors.part_name ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {formErrors.part_name && (
                  <p className="text-sm text-red-500">{formErrors.part_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="store">Store (optional)</Label>
                <Input
                  id="store"
                  value={partForm.store}
                  onChange={(e) => setPartForm({ ...partForm, store: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (optional)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={partForm.price}
                  onChange={(e) => setPartForm({ ...partForm, price: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Link (optional)</Label>
                <Input
                  id="url"
                  value={partForm.url}
                  onChange={(e) => {
                    setPartForm({ ...partForm, url: e.target.value })
                    if (formErrors.url) setFormErrors({ ...formErrors, url: '' })
                  }}
                  className={formErrors.url ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  placeholder="https://..."
                />
                {formErrors.url && (
                  <p className="text-sm text-red-500">{formErrors.url}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea
                  id="note"
                  rows={4}
                  value={partForm.note}
                  onChange={(e) => setPartForm({ ...partForm, note: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePartDialogClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentPart ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  currentPart ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={handleOrderDialogClose}>
        <DialogContent onKeyDown={(e) => e.key === 'Escape' && handleOrderDialogClose(false)}>
          <DialogHeader>
            <DialogTitle>{currentOrder ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitOrder}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item">Item</Label>
                <Input
                  id="item"
                  value={orderForm.item}
                  onChange={(e) => {
                    setOrderForm({ ...orderForm, item: e.target.value })
                    if (formErrors.item) setFormErrors({ ...formErrors, item: '' })
                  }}
                  className={formErrors.item ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  autoFocus
                />
                {formErrors.item && (
                  <p className="text-sm text-red-500">{formErrors.item}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={orderForm.date}
                  onChange={(e) => {
                    setOrderForm({ ...orderForm, date: e.target.value })
                    if (formErrors.date) setFormErrors({ ...formErrors, date: '' })
                  }}
                  className={formErrors.date ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {formErrors.date && (
                  <p className="text-sm text-red-500">{formErrors.date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <Input
                  id="store"
                  value={orderForm.store}
                  onChange={(e) => {
                    setOrderForm({ ...orderForm, store: e.target.value })
                    if (formErrors.store) setFormErrors({ ...formErrors, store: '' })
                  }}
                  className={formErrors.store ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {formErrors.store && (
                  <p className="text-sm text-red-500">{formErrors.store}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="oprice">Price (optional)</Label>
                <Input
                  id="oprice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={orderForm.price}
                  onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={orderForm.status}
                  onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="ordered">Ordered</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courier">Courier (optional)</Label>
                  <Input
                    id="courier"
                    value={orderForm.courier}
                    onChange={(e) => setOrderForm({ ...orderForm, courier: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking">Tracking Number (optional)</Label>
                  <Input
                    id="tracking"
                    value={orderForm.tracking_number}
                    onChange={(e) => setOrderForm({ ...orderForm, tracking_number: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onote">Note (optional)</Label>
                <Textarea
                  id="onote"
                  rows={4}
                  value={orderForm.note}
                  onChange={(e) => setOrderForm({ ...orderForm, note: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOrderDialogClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentOrder ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  currentOrder ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning */}
      <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You have unsaved changes. Are you sure you want to close this dialog? Your changes will be lost.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnsavedWarning(false)}>
              Keep Editing
            </Button>
            <Button variant="destructive" onClick={confirmCloseDialog}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteType === 'part' ? 'Part' : 'Order'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-semibold">
              "{deleteType === 'part' ? itemToDelete?.part_name : itemToDelete?.item}"
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteType === 'part' ? deletePart : deleteOrder}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
