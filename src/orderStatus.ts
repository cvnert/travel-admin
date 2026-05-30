import type { OrderStatus } from './types'

export type NormalizedOrderStatus = 'pending_payment' | 'pending_travel' | 'completed'

export function normalizeOrderStatus(status: OrderStatus | string): NormalizedOrderStatus {
  if (status === 'paid') {
    return 'pending_travel'
  }
  if (status === 'completed') {
    return 'completed'
  }
  if (status === 'pending_travel') {
    return 'pending_travel'
  }
  return 'pending_payment'
}

export function getOrderStatusMeta(status: OrderStatus | string) {
  switch (normalizeOrderStatus(status)) {
    case 'pending_payment':
      return { color: 'processing', text: '待支付' } as const
    case 'pending_travel':
      return { color: 'blue', text: '待出行' } as const
    case 'completed':
      return { color: 'success', text: '已出行' } as const
    default:
      return { color: 'default', text: '处理中' } as const
  }
}

export function getPaymentMethodLabel(paymentMethod?: string | null) {
  switch ((paymentMethod || '').trim()) {
    case 'wechat_pay':
      return '微信支付'
    case 'mock_wechat':
      return '模拟微信支付'
    default:
      return '-'
  }
}

export function formatDateTime(value?: string | null) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-'
}
