export type ProductStatus = 'draft' | 'published' | 'offline'
export type BannerStatus = 'draft' | 'published' | 'offline'

export interface AdminUser {
  id: string
  username: string
}

export interface TravelProduct {
  id: string
  title: string
  coverImage: string
  coverImageUrl: string
  bannerImages: string[]
  bannerImageUrls: string[]
  detailImages: string[]
  detailImageUrls: string[]
  shortDescription: string
  price: number
  salesCount: number
  tag: string
  summary: string
  itinerary: string
  feeDescription: string
  travelNotice: string
  refundPolicy: string
  customerServicePhone: string
  sortOrder: number
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export interface ProductPayload {
  title: string
  coverImage: string
  bannerImages: string[]
  detailImages: string[]
  shortDescription: string
  price: number
  salesCount: number
  tag: string
  summary: string
  itinerary: string
  feeDescription: string
  travelNotice: string
  refundPolicy: string
  customerServicePhone: string
  sortOrder: number
  status: ProductStatus
}

export interface HomeBanner {
  id: string
  title: string
  description: string
  image: string
  imageUrl: string
  linkedProductId: string
  tag: string
  sortOrder: number
  status: BannerStatus
  createdAt: string
  updatedAt: string
}

export interface HomeBannerPayload {
  title: string
  description: string
  image: string
  linkedProductId: string
  tag: string
  sortOrder: number
  status: BannerStatus
}
