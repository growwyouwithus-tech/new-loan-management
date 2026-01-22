import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Bell, Check, Trash2, Eye, AlertCircle, X } from 'lucide-react'
import notificationStore from '../../store/notificationStore'
import loanStore from '../../store/loanStore'

export default function VerifierNotifications() {
  const { notifications, getRecentNotifications, markAsRead, markAllAsRead, clearForRole, clearNotification, updateNotifications, getPanelsWithNotifications } = notificationStore()
  const { loans, activeLoans } = loanStore()

  const [allNotifications, setAllNotifications] = useState([])

  useEffect(() => {
    updateNotifications(loans, activeLoans)
  }, [loans, activeLoans, updateNotifications])

  useEffect(() => {
    setAllNotifications(getRecentNotifications(50))
  }, [notifications, getRecentNotifications])

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    if (notification.type === 'new_loan_application') {
      window.location.href = '/verifier/loan-verifier'
    }
  }

  const showClearMessage = (role) => {
    const panelsBefore = getPanelsWithNotifications()
    const clearedCount = panelsBefore[role] || 0

    // Create toast message
    const message = document.createElement('div')
    message.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm animate-pulse'
    message.innerHTML = `
      <div class="font-semibold capitalize">${role} Notifications Cleared!</div>
      <div class="text-sm mt-1">
        ${clearedCount} notifications cleared from ${role} panel
      </div>
    `

    document.body.appendChild(message)

    // Remove message after 3 seconds
    setTimeout(() => {
      message.remove()
    }, 3000)
  }

  const unreadCount = allNotifications.filter(n => !n.read).length

  const getTypeColor = (type) => {
    switch (type) {
      case 'new_loan_application':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'payment_due':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'payment_overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'loan_approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'loan_rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'new_loan_application':
        return <Bell className="h-4 w-4" />
      case 'payment_due':
        return <Eye className="h-4 w-4" />
      case 'payment_overdue':
        return <AlertCircle className="h-4 w-4" />
      case 'loan_approved':
        return <Check className="h-4 w-4" />
      case 'loan_rejected':
        return <X className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications read'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <Check className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
          <Button onClick={() => {
            showClearMessage('verifier')
            clearForRole('verifier')
          }} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            View and manage all your notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allNotifications.length > 0 ? (
            <div className="space-y-3">
              {allNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1" onClick={() => handleNotificationClick(notification)}>
                      <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(notification.timestamp).toLocaleDateString('en-GB')}</span>
                          <span>{new Date(notification.timestamp).toLocaleTimeString()}</span>
                          {notification.loanId && (
                            <Badge variant="outline" className="text-xs">
                              {notification.loanId}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          clearNotification(notification.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">You don't have any notifications at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
