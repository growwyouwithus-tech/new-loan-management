const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const BASE_URL = API_BASE_URL.replace('/api', '')

export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    console.log('getImageUrl: No image path provided')
    return null
  }

  // Normalize Windows paths
  imagePath = imagePath.replace(/\\/g, '/')

  console.log('getImageUrl input:', imagePath)

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('getImageUrl: Returning absolute URL:', imagePath)
    return imagePath
  }

  if (imagePath.startsWith('data:image')) {
    console.log('getImageUrl: Returning base64 image')
    return imagePath
  }

  if (imagePath.startsWith('/uploads')) {
    const url = `${BASE_URL}${imagePath}`
    console.log('getImageUrl: Constructed URL from /uploads:', url)
    return url
  }

  if (imagePath.startsWith('uploads')) {
    const url = `${BASE_URL}/${imagePath}`
    console.log('getImageUrl: Constructed URL from uploads:', url)
    return url
  }

  const url = `${BASE_URL}/uploads/${imagePath}`
  console.log('getImageUrl: Constructed default URL:', url)
  return url
}
