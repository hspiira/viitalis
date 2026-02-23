/**
 * Dummy data for the claims & premiums dashboard.
 * Replace with API-backed data when integrating.
 */

export const CURRENCY_CODE = 'UGXV' as const

export interface ClientClaim {
  id: string
  name: string
  amount: number
  changePercent: number
}

export interface MonthlyClaims {
  month: string
  claims: number
}

export interface DashboardSummary {
  totalClaims: number
  totalClaimsChangePercent: number
  totalPremiums: number
  totalPremiumsChangePercent: number
  projectedClaims: number
  projectedClaimsChangePercent: number
  periodLabel: string
}

export const dashboardSummary: DashboardSummary = {
  totalClaims: 39_658,
  totalClaimsChangePercent: 2.87,
  totalPremiums: 9_856.28,
  totalPremiumsChangePercent: -3.6,
  projectedClaims: 18_732,
  projectedClaimsChangePercent: 15,
  periodLabel: 'from last month',
}

export const clientClaims: ClientClaim[] = [
  { id: '1', name: 'Acme Health Partners', amount: 8_420, changePercent: 2.1 },
  { id: '2', name: 'Nordic Life Assurance', amount: 6_150, changePercent: -0.8 },
  { id: '3', name: 'Pacific Medical Group', amount: 9_230, changePercent: 4.2 },
  { id: '4', name: 'Summit Care Ltd', amount: 4_100, changePercent: 1.5 },
  { id: '5', name: 'Horizon Insurance Co', amount: 7_890, changePercent: -1.2 },
  { id: '6', name: 'Meridian Health', amount: 5_560, changePercent: 3.0 },
  { id: '7', name: 'Stellar Benefits Inc', amount: 3_210, changePercent: 0.5 },
  { id: '8', name: 'Atlas Corporate Care', amount: 6_740, changePercent: 2.8 },
  { id: '9', name: 'Cascade Health Solutions', amount: 4_890, changePercent: -0.3 },
  { id: '10', name: 'Pinnacle Assurance', amount: 5_820, changePercent: 1.9 },
  { id: '11', name: 'Vertex Medical Trust', amount: 7_120, changePercent: 2.4 },
  { id: '12', name: 'Apex Health Network', amount: 4_350, changePercent: -0.6 },
]

export const claimsPerMonth: MonthlyClaims[] = [
  { month: 'Jan', claims: 18_200 },
  { month: 'Feb', claims: 22_100 },
  { month: 'Mar', claims: 19_500 },
  { month: 'Apr', claims: 24_800 },
  { month: 'May', claims: 31_200 },
  { month: 'Jun', claims: 28_600 },
  { month: 'Jul', claims: 33_400 },
  { month: 'Aug', claims: 34_850 },
  { month: 'Sep', claims: 28_900 },
  { month: 'Oct', claims: 30_200 },
  { month: 'Nov', claims: 27_500 },
  { month: 'Dec', claims: 31_800 },
]
