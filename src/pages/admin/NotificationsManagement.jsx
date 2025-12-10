import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useEffect } from 'react'
import notificationStore from '../../store/notificationStore'
import loanStore from '../../store/loanStore'
import Badge from '../../components/ui/Badge'

export default function NotificationsManagement() {
  const { notifications, getRecentNotifications, markAsRead, clearForRole, updateNotifications, getPanelsWithNotifications } = notificationStore()
  const { loans, activeLoans } = loanStore()
  
  useEffect(() => {
    updateNotifications(loans, activeLoans)
  }, [loans, activeLoans, updateNotifications])
  
  const recentNotifications = getRecentNotifications(20)
  
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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Manage system notifications and alerts</p>
        </div>
        <Button>Create Template</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentNotifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No notifications</p>
            ) : (
              recentNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    !notif.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{notif.title}</p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                      {notif.loanId && (
                        <p className="text-xs text-blue-600 mt-1">
                          Loan ID: {notif.loanId}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant={
                        notif.severity === 'high' ? 'destructive' : 
                        notif.severity === 'medium' ? 'warning' : 
                        notif.type === 'success' ? 'success' : 'default'
                      }
                    >
                      {notif.type}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          {recentNotifications.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                showClearMessage('admin')
                clearForRole('admin')
              }}
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
