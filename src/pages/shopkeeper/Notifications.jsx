import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import notificationStore from '../../store/notificationStore'
import { useEffect } from 'react'
import { Trash2 } from 'lucide-react'

export default function ShopkeeperNotifications() {
  const { notifications, getRecentNotifications, clearNotification, clearAllNotifications: clearAll } = notificationStore()
  
  useEffect(() => {
    getRecentNotifications()
  }, [])

  const clearAllNotifications = () => {
    clearAll()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with important alerts</p>
        </div>
        {notifications.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={clearAllNotifications}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border rounded-lg ${!notif.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{notif.title}</p>
                        {!notif.read && <Badge variant="destructive">New</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{notif.timestamp}</p>
                    </div>
                    <Badge
                      variant={
                        notif.type === 'success'
                          ? 'success'
                          : notif.type === 'warning'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {notif.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No notifications</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
