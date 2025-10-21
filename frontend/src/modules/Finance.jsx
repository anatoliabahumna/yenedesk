import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Loader2, Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from 'lucide-react'

export default function Finance() {
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [view, setView] = useState('transactions')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [highlightedId, setHighlightedId] = useState(null)
  const { toast } = useToast()

  // Category dialog
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', kind: 'expense' })
  const originalCategoryForm = useRef({ name: '', kind: 'expense' })

  // Transaction dialog
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState(null)
  const [transactionForm, setTransactionForm] = useState({
    category_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const originalTransactionForm = useRef({
    category_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })

  // Delete dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Detect unsaved changes
    const categoryChanges =
      categoryForm.name !== originalCategoryForm.current.name ||
      categoryForm.kind !== originalCategoryForm.current.kind

    const transactionChanges =
      transactionForm.category_id !== originalTransactionForm.current.category_id ||
      transactionForm.amount !== originalTransactionForm.current.amount ||
      transactionForm.date !== originalTransactionForm.current.date ||
      transactionForm.note !== originalTransactionForm.current.note

    setHasUnsavedChanges(categoryChanges || transactionChanges)
  }, [categoryForm, transactionForm])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [categoriesRes, transactionsRes] = await Promise.all([
        fetch('/api/finance/categories'),
        fetch('/api/finance/transactions')
      ])

      if (!categoriesRes.ok || !transactionsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [categoriesData, transactionsData] = await Promise.all([
        categoriesRes.json(),
        transactionsRes.json()
      ])

      setCategories(categoriesData)
      setTransactions(transactionsData)
    } catch (error) {
      toast.error('Failed to load data', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const validateCategoryForm = () => {
    const errors = {}
    if (!categoryForm.name.trim()) {
      errors.name = 'Category name is required'
    } else if (categoryForm.name.length > 50) {
      errors.name = 'Name must be less than 50 characters'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateTransactionForm = () => {
    const errors = {}
    if (!transactionForm.category_id) {
      errors.category_id = 'Please select a category'
    }
    if (!transactionForm.amount || parseFloat(transactionForm.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0'
    }
    if (!transactionForm.date) {
      errors.date = 'Date is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    if (!validateCategoryForm()) return

    setIsSubmitting(true)
    try {
      const response = currentCategory
        ? await fetch(`/api/finance/categories/${currentCategory.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryForm),
          })
        : await fetch('/api/finance/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryForm),
          })

      if (!response.ok) {
        throw new Error(currentCategory ? 'Failed to update category' : 'Failed to create category')
      }

      const savedCategory = await response.json()

      setIsCategoryDialogOpen(false)
      setCategoryForm({ name: '', kind: 'expense' })
      setCurrentCategory(null)
      setHasUnsavedChanges(false)
      setFormErrors({})

      toast.success(
        currentCategory ? 'Category updated!' : 'Category created!',
        currentCategory ? 'Your category has been updated.' : 'Your category has been created.'
      )

      await fetchData()

      if (!currentCategory && savedCategory.id) {
        setHighlightedId(savedCategory.id)
        setTimeout(() => setHighlightedId(null), 2000)
      }
    } catch (error) {
      toast.error('Failed to save category', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCategory = (category) => {
    setCurrentCategory(category)
    setCategoryForm({ name: category.name, kind: category.kind })
    originalCategoryForm.current = { name: category.name, kind: category.kind }
    setIsCategoryDialogOpen(true)
  }

  const handleDeleteCategory = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/finance/categories/${itemToDelete.id}`, { method: 'DELETE' })

      if (response.status === 409) {
        toast.warning(
          'Cannot delete category',
          `"${itemToDelete.name}" has existing transactions. Please delete or reassign them first.`
        )
      } else if (!response.ok) {
        throw new Error('Failed to delete category')
      } else {
        toast.success('Category deleted', 'Your category has been deleted.')
        await fetchData()
      }

      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
    } catch (error) {
      toast.error('Failed to delete category', error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Transaction handlers
  const handleTransactionSubmit = async (e) => {
    e.preventDefault()
    if (!validateTransactionForm()) return

    setIsSubmitting(true)
    try {
      const response = currentTransaction
        ? await fetch(`/api/finance/transactions/${currentTransaction.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionForm),
          })
        : await fetch('/api/finance/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionForm),
          })

      if (!response.ok) {
        throw new Error(currentTransaction ? 'Failed to update transaction' : 'Failed to create transaction')
      }

      const savedTransaction = await response.json()

      setIsTransactionDialogOpen(false)
      setTransactionForm({
        category_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
      })
      setCurrentTransaction(null)
      setHasUnsavedChanges(false)
      setFormErrors({})

      toast.success(
        currentTransaction ? 'Transaction updated!' : 'Transaction created!',
        currentTransaction ? 'Your transaction has been updated.' : 'Your transaction has been created.'
      )

      await fetchData()

      if (!currentTransaction && savedTransaction.id) {
        setHighlightedId(savedTransaction.id)
        setTimeout(() => setHighlightedId(null), 2000)
      }
    } catch (error) {
      toast.error('Failed to save transaction', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTransaction = (transaction) => {
    setCurrentTransaction(transaction)
    const formData = {
      category_id: transaction.category_id,
      amount: transaction.amount,
      date: transaction.date,
      note: transaction.note || '',
    }
    setTransactionForm(formData)
    originalTransactionForm.current = { ...formData }
    setIsTransactionDialogOpen(true)
  }

  const handleDeleteTransaction = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/finance/transactions/${itemToDelete.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete transaction')

      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      toast.success('Transaction deleted', 'Your transaction has been deleted.')
      await fetchData()
    } catch (error) {
      toast.error('Failed to delete transaction', error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const openNewCategory = () => {
    setCurrentCategory(null)
    setCategoryForm({ name: '', kind: 'expense' })
    originalCategoryForm.current = { name: '', kind: 'expense' }
    setFormErrors({})
    setHasUnsavedChanges(false)
    setIsCategoryDialogOpen(true)
  }

  const openNewTransaction = () => {
    setCurrentTransaction(null)
    const formData = {
      category_id: categories[0]?.id || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    }
    setTransactionForm(formData)
    originalTransactionForm.current = { ...formData }
    setFormErrors({})
    setHasUnsavedChanges(false)
    setIsTransactionDialogOpen(true)
  }

  const handleCategoryDialogClose = (open) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    setIsCategoryDialogOpen(open)
    if (!open) {
      setCategoryForm({ name: '', kind: 'expense' })
      setCurrentCategory(null)
      setFormErrors({})
      setHasUnsavedChanges(false)
    }
  }

  const handleTransactionDialogClose = (open) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    setIsTransactionDialogOpen(open)
    if (!open) {
      setTransactionForm({
        category_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
      })
      setCurrentTransaction(null)
      setFormErrors({})
      setHasUnsavedChanges(false)
    }
  }

  const confirmCloseDialog = () => {
    setShowUnsavedWarning(false)
    setIsCategoryDialogOpen(false)
    setIsTransactionDialogOpen(false)
    setCategoryForm({ name: '', kind: 'expense' })
    setTransactionForm({
      category_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
    setCurrentCategory(null)
    setCurrentTransaction(null)
    setFormErrors({})
    setHasUnsavedChanges(false)
  }

  const formatAmount = (amount, kind) => {
    const sign = kind === 'income' ? '+' : '−'
    return `${sign}$${parseFloat(amount).toFixed(2)}`
  }

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
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-muted-foreground">Track your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'transactions' ? 'default' : 'outline'}
            onClick={() => setView('transactions')}
            className={view === 'transactions' ? 'font-bold' : ''}
          >
            Transactions
          </Button>
          <Button
            variant={view === 'categories' ? 'default' : 'outline'}
            onClick={() => setView('categories')}
            className={view === 'categories' ? 'font-bold' : ''}
          >
            Categories
          </Button>
        </div>
      </div>

      {view === 'transactions' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Transactions</h2>
            <Button onClick={openNewTransaction} disabled={categories.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <Wallet className="h-16 w-16 text-muted-foreground opacity-50" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">No categories yet</p>
                  <p className="text-sm text-muted-foreground">Create a category first to start tracking transactions</p>
                </div>
                <Button onClick={openNewCategory} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Category
                </Button>
              </CardContent>
            </Card>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <Wallet className="h-16 w-16 text-muted-foreground opacity-50" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">No transactions yet</p>
                  <p className="text-sm text-muted-foreground">Create your first transaction to get started</p>
                </div>
                <Button onClick={openNewTransaction} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Transaction
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto relative">
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none md:hidden" />
                  <table className="w-full min-w-[640px] table-fixed">
                    <thead className="border-b bg-muted/50">
                      <tr className="text-left">
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold">Category</th>
                        <th className="p-4 font-semibold">Amount</th>
                        <th className="p-4 font-semibold">Note</th>
                        <th className="p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${
                            highlightedId === transaction.id
                              ? 'bg-primary/10 animate-in fade-in duration-500'
                              : ''
                          }`}
                        >
                          <td className="p-4">{transaction.date}</td>
                          <td className="p-4">{transaction.category_name}</td>
                          <td className={`p-4 font-semibold flex items-center gap-1 ${
                            transaction.category_kind === 'income'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.category_kind === 'income' ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {formatAmount(transaction.amount, transaction.category_kind)}
                          </td>
                          <td className="p-4 text-muted-foreground whitespace-pre-wrap break-words">
                            {transaction.note || '—'}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEditTransaction(transaction)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setItemToDelete(transaction)
                                  setDeleteType('transaction')
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
            <h2 className="text-xl font-semibold">Categories</h2>
            <Button onClick={openNewCategory}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <Wallet className="h-16 w-16 text-muted-foreground opacity-50" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">No categories yet</p>
                  <p className="text-sm text-muted-foreground">Create your first category to organize your finances</p>
                </div>
                <Button onClick={openNewCategory} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className={`hover:shadow-lg transition-all ${
                    highlightedId === category.id
                      ? 'ring-2 ring-primary animate-in fade-in duration-500'
                      : ''
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {category.kind === 'income' ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        {category.name}
                      </span>
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                        category.kind === 'income'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {category.kind}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditCategory(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setItemToDelete(category)
                          setDeleteType('category')
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={handleCategoryDialogClose}>
        <DialogContent onKeyDown={(e) => e.key === 'Escape' && handleCategoryDialogClose(false)}>
          <DialogHeader>
            <DialogTitle>{currentCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(e) => {
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
                  }}
                  className={formErrors.name ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  autoFocus
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-kind">Type</Label>
                <Select
                  id="category-kind"
                  value={categoryForm.kind}
                  onChange={(e) => setCategoryForm({ ...categoryForm, kind: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCategoryDialogClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentCategory ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  currentCategory ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={handleTransactionDialogClose}>
        <DialogContent onKeyDown={(e) => e.key === 'Escape' && handleTransactionDialogClose(false)}>
          <DialogHeader>
            <DialogTitle>{currentTransaction ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransactionSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-category">Category</Label>
                <Select
                  id="transaction-category"
                  value={transactionForm.category_id}
                  onChange={(e) => {
                    setTransactionForm({ ...transactionForm, category_id: e.target.value })
                    if (formErrors.category_id) setFormErrors({ ...formErrors, category_id: '' })
                  }}
                  className={formErrors.category_id ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.kind})
                    </option>
                  ))}
                </Select>
                {formErrors.category_id && (
                  <p className="text-sm text-red-500">{formErrors.category_id}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-amount">Amount</Label>
                <Input
                  id="transaction-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => {
                    setTransactionForm({ ...transactionForm, amount: e.target.value })
                    if (formErrors.amount) setFormErrors({ ...formErrors, amount: '' })
                  }}
                  className={formErrors.amount ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {formErrors.amount && (
                  <p className="text-sm text-red-500">{formErrors.amount}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-date">Date</Label>
                <Input
                  id="transaction-date"
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => {
                    setTransactionForm({ ...transactionForm, date: e.target.value })
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
                <Label htmlFor="transaction-note">Note (optional)</Label>
                <Input
                  id="transaction-note"
                  value={transactionForm.note}
                  onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleTransactionDialogClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentTransaction ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  currentTransaction ? 'Update' : 'Create'
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

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteType === 'category' ? 'Category' : 'Transaction'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-semibold">
              "{deleteType === 'category' ? itemToDelete?.name : itemToDelete?.category_name}"
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
              onClick={deleteType === 'category' ? handleDeleteCategory : handleDeleteTransaction}
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
