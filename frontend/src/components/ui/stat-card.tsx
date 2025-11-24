import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    iconColor?: string
    iconBg?: string
}

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor = 'text-white',
    iconBg = 'bg-blue-500'
}: StatCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium text-gray-600">{title}</div>
                    <div className={`p-2.5 rounded-lg ${iconBg}`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
                {subtitle && (
                    <div className="text-sm text-gray-500">{subtitle}</div>
                )}
            </div>
        </div>
    )
}
