import { useEffect, useRef, useState } from 'react'
import { User, Mail, Phone, MapPin, Building, Shield, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import shopkeeperStore from '../../store/shopkeeperStore'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-toastify'

export default function Profile() {
    const { user } = useAuthStore()
    const { shopkeepers, fetchShopkeepers, updateShopkeeper } = shopkeeperStore()
    const fileInputRef = useRef(null)
    const [imageError, setImageError] = useState(false)
    const [uploading, setUploading] = useState(false)

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

    const handlePhotoClick = () => {
        fileInputRef.current?.click()
    }

    const getImageUrl = (photoUrl) => {
        if (!photoUrl) return null
        if (photoUrl.startsWith('data:image') || photoUrl.startsWith('http')) {
            return photoUrl
        }
        // Remove leading slash if present to avoid double slashes
        const cleanPath = photoUrl.startsWith('/') ? photoUrl.slice(1) : photoUrl
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        return `${baseUrl}/${cleanPath}`
    }

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('Image size should be less than 5MB')
            return
        }

        try {
            setUploading(true)
            const reader = new FileReader()
            reader.onloadend = async () => {
                try {
                    const base64String = reader.result
                    await updateShopkeeper(currentShopkeeper.id || currentShopkeeper._id, {
                        ownerPhoto: base64String
                    })
                    setImageError(false) // Reset error state on new upload
                    toast.success('Profile photo updated successfully')
                } catch (error) {
                    console.error('Failed to update profile photo:', error)
                    toast.error('Failed to update profile photo')
                } finally {
                    setUploading(false)
                }
            }
            reader.readAsDataURL(file)
        } catch (error) {
            console.error('Error reading file:', error)
            toast.error('Error processing image')
            setUploading(false)
        }
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
                        <div className="relative w-32 h-32 mx-auto mb-4 group cursor-pointer" onClick={handlePhotoClick}>
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-blue-100 shadow-inner">
                                {currentShopkeeper.ownerPhoto && !imageError ? (
                                    <img
                                        src={getImageUrl(currentShopkeeper.ownerPhoto)}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            console.error('Error loading profile image:', e)
                                            setImageError(true)
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                                        <User className="w-16 h-16 text-blue-300" />
                                    </div>
                                )}
                            </div>

                            {/* Overlay */}
                            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Camera className="w-8 h-8 text-white" />
                            </div>

                            {/* Loading State */}
                            {uploading && (
                                <div className="absolute inset-0 rounded-full bg-white/80 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoChange}
                                className="hidden"
                                accept="image/*"
                            />
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
