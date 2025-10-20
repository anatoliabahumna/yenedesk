import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function Finance() {
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [view, setView] = useState('transactions') // 'transactions' or 'categories'
  
  // Category dialog
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', kind: 'expense' })
  
  // Transaction dialog
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState(null)
  const [transactionForm, setTransactionForm] = useState({
    category_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  
  // Delete dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState(null)

  useEffect(() => {
    fetchCategories()
    fetchTransactions()
  }, [])

  const fetchCategories = async () => {
    const response = await fetch('/api/finance/categories')
    const data = await response.json()
    setCategories(data)
  }

  const fetchTransactions = async () => {
    const response = await fetch('/api/finance/transactions')
    const data = await response.json()
    setTransactions(data)
  }

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    if (currentCategory) {
      await fetch(`/api/finance/categories/${currentCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      })
    } else {
      await fetch('/api/finance/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      })
    }
    setIsCategoryDialogOpen(false)
    setCategoryForm({ name: '', kind: 'expense' })
    setCurrentCategory(null)
    fetchCategories()
  }

  const handleEditCategory = (category) => {
    setCurrentCategory(category)
    setCategoryForm({ name: category.name, kind: category.kind })
    setIsCategoryDialogOpen(true)
  }

  const handleDeleteCategory = async () => {
    const response = await fetch(`/api/finance/categories/${itemToDelete.id}`, { method: 'DELETE' })
    if (response.status === 409) {
      alert('Cannot delete category with existing transactions')
    }
    setIsDeleteDialogOpen(false)
    setItemToDelete(null)
    fetchCategories()
  }

  // Transaction handlers
  const handleTransactionSubmit = async (e) => {
    e.preventDefault()
    if (currentTransaction) {
      await fetch(`/api/finance/transactions/${currentTransaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionForm),
      })
    } else {
      await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionForm),
      })
    }
    setIsTransactionDialogOpen(false)
    setTransactionForm({
      category_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
    setCurrentTransaction(null)
    fetchTransactions()
  }

  const handleEditTransaction = (transaction) => {
    setCurrentTransaction(transaction)
    setTransactionForm({
      category_id: transaction.category_id,
      amount: transaction.amount,
      date: transaction.date,
      note: transaction.note || '',
    })
    setIsTransactionDialogOpen(true)
  }

  const handleDeleteTransaction = async () => {
    await fetch(`/api/finance/transactions/${itemToDelete.id}`, { method: 'DELETE' })
    setIsDeleteDialogOpen(false)
    setItemToDelete(null)
    fetchTransactions()
  }

  const openNewCategory = () => {
    setCurrentCategory(null)
    setCategoryForm({ name: '', kind: 'expense' })
    setIsCategoryDialogOpen(true)
  }

  const openNewTransaction = () => {
    setCurrentTransaction(null)
    setTransactionForm({
      category_id: categories[0]?.id || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
    setIsTransactionDialogOpen(true)
  }

  const formatAmount = (amount, kind) => {
    const sign = kind === 'income' ? '+' : '-'
    return `${sign}$${parseFloat(amount).toFixed(2)}`
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
          >
            Transactions
          </Button>
          <Button
            variant={view === 'categories' ? 'default' : 'outline'}
            onClick={() => setView('categories')}
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
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">Please create a category first</p>
                <Button className="mt-4" onClick={openNewCategory}>
                  Create Category
                </Button>
              </CardContent>
            </Card>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No transactions yet. Create your first transaction!</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4">Date</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Note</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b last:border-0">
                        <td className="p-4">{transaction.date}</td>
                        <td className="p-4">{transaction.category_name}</td>
                        <td className={`p-4 font-semibold ${transaction.category_kind === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(transaction.amount, transaction.category_kind)}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-pre-wrap break-words">{transaction.note}</td>
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
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No categories yet. Create your first category!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{category.name}</span>
                      <span className={`text-sm px-2 py-1 rounded ${category.kind === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent onClose={() => setIsCategoryDialogOpen(false)}>
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
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-kind">Type</Label>
                <Select
                  id="category-kind"
                  value={categoryForm.kind}
                  onChange={(e) => setCategoryForm({ ...categoryForm, kind: e.target.value })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{currentCategory ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent onClose={() => setIsTransactionDialogOpen(false)}>
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
                  onChange={(e) => setTransactionForm({ ...transactionForm, category_id: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.kind})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-amount">Amount</Label>
                <Input
                  id="transaction-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-date">Date</Label>
                <Input
                  id="transaction-date"
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-note">Note</Label>
                <Input
                  id="transaction-note"
                  value={transactionForm.note}
                  onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{currentTransaction ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent onClose={() => setIsDeleteDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Delete {deleteType === 'category' ? 'Category' : 'Transaction'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this {deleteType}? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteType === 'category' ? handleDeleteCategory : handleDeleteTransaction}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

