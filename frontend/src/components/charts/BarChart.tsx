'use client'

import { Bar as ChartJsBar } from 'react-chartjs-2'
import { defaultChartOptions } from '@/lib/chart-config'

interface BarChartProps {
    data: {
        labels: string[]
        datasets: {
            label: string
            data: number[]
            backgroundColor: string | string[]
            borderColor: string | string[]
            borderWidth?: number
        }[]
    }
    options?: any
    height?: number
}

export function BarChart({ data, options, height = 320 }: BarChartProps) {
    const mergedOptions = {
        ...defaultChartOptions,
        ...options,
    }

    return (
        <div style={{ height: `${height}px` }}>
            <ChartJsBar data={data} options={mergedOptions} />
        </div>
    )
}
