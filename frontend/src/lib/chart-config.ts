import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
)

export const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top' as const,
            labels: {
                font: { size: 12 },
                padding: 10,
                usePointStyle: true,
            },
        },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1f2937',
            bodyColor: '#4b5563',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
        },
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { font: { size: 11 } },
        },
        y: {
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: { font: { size: 11 } },
            beginAtZero: true,
        },
    },
}

export const colorScheme = {
    blue: {
        bg: 'rgba(59, 130, 246, 0.8)',
        border: 'rgb(59, 130, 246)',
    },
    green: {
        bg: 'rgba(16, 185, 129, 0.8)',
        border: 'rgb(16, 185, 129)',
    },
    purple: {
        bg: 'rgba(139, 92, 246, 0.8)',
        border: 'rgb(139, 92, 246)',
    },
    orange: {
        bg: 'rgba(249, 115, 22, 0.8)',
        border: 'rgb(249, 115, 22)',
    },
    red: {
        bg: 'rgba(239, 68, 68, 0.8)',
        border: 'rgb(239, 68, 68)',
    },
    indigo: {
        bg: 'rgba(99, 102, 241, 0.8)',
        border: 'rgb(99, 102, 241)',
    },
    emerald: {
        bg: 'rgba(52, 211, 153, 0.8)',
        border: 'rgb(52, 211, 153)',
    },
}
