import { useEffect } from 'react'
import { User, Mail, Phone, MapPin, Building, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import shopkeeperStore from '../../store/shopkeeperStore'
import { useAuthStore } from '../../store/authStore'

export default function Profile() {
    const { user } = useAuthStore()
    const { shopkeepers, fetchShopkeepers } = shopkeeperStore()

    useEffect(() => {
        fetchShopkeepers()
    }, [fetchShopkeepers])

    // Get current shopkeeper's details
    const currentShopkeeper = shopkeepers.find(sk => sk.email === user?.email)

    if (!currentShopkeeper) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading profile...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    My Profile
                </h1>
                <p className="text-muted-foreground mt-1">View your account and shop details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="md:col-span-1 border-t-4 border-t-blue-500 shadow-lg">
                    <CardContent className="pt-6 text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
                            <User className="w-12 h-12 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">{currentShopkeeper.name}</h2>
                        <p className="text-sm text-gray-500 font-medium">{currentShopkeeper.role || 'Shopkeeper'}</p>
                        <div className="mt-6 flex flex-col gap-2">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs text-blue-600 font-semibold uppercase">Token Balance</p>
                                <p className="text-xl font-bold text-blue-800">{currentShopkeeper.tokenBalance || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Card */}
                <Card className="md:col-span-2 shadow-lg">
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <Building className="w-3 h-3" /> Shop Name
                                </label>
                                <p className="font-medium">{currentShopkeeper.shopName || 'N/A'}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> Email Address
                                </label>
                                <p className="font-medium">{currentShopkeeper.email}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Phone Number
                                </label>
                                <p className="font-medium">{currentShopkeeper.phone || 'N/A'}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Status
                                </label>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${currentShopkeeper.isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {currentShopkeeper.isActive === false ? 'Inactive' : 'Active'}
                                </span>
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Address
                                </label>
                                <p className="font-medium">{currentShopkeeper.address || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
