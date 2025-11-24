'use client'

import { Pie as ChartJsPie } from 'react-chartjs-2'
import { defaultChartOptions } from '@/lib/chart-config'

interface PieChartProps {
    data: {
        labels: string[]
        datasets: {
            label?: string
            data: number[]
            backgroundColor: string[]
            borderColor?: string[]
            borderWidth?: number
        }[]
    }
    options?: any
    height?: number
}

export function PieChart({ data, options, height = 320 }: PieChartProps) {
    const mergedOptions = {
        ...defaultChartOptions,
        ...options,
        scales: undefined, // Pie charts don't use scales
    }

    return (
        <div style={{ height: `${height}px` }}>
            <ChartJsPie data={data} options={mergedOptions} />
        </div>
    )
}
