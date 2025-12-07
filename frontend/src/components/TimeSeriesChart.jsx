import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

/**
 * Simple SVG-based time series line chart component
 */
export function TimeSeriesChart({ title, data, color = "#3b82f6", icon: Icon }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {Icon && <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                        No data available
                    </p>
                </CardContent>
            </Card>
        );
    }

    const maxValue = Math.max(...data.map(d => d.count), 1);
    const chartHeight = 200;
    const chartWidth = 100; // percentage
    const padding = 5; // padding for points

    // Calculate points for the line
    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * chartWidth;
        const y = chartHeight - ((item.count / maxValue) * (chartHeight - padding * 2)) - padding;
        return { x, y, count: item.count, label: item.label };
    });

    // Create path for the line
    const linePath = points.map((point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    // Create area path (filled area under the line)
    const areaPath = `M ${points[0].x} ${chartHeight} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${chartHeight} Z`;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative" style={{ height: `${chartHeight + 40}px` }}>
                    {/* Chart area */}
                    <svg
                        className="w-full"
                        height={chartHeight}
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        preserveAspectRatio="none"
                    >
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                            <g key={i}>
                                <line
                                    x1="0"
                                    y1={chartHeight * (1 - ratio)}
                                    x2={chartWidth}
                                    y2={chartHeight * (1 - ratio)}
                                    stroke="currentColor"
                                    strokeWidth="0.1"
                                    className="text-gray-200 dark:text-gray-700"
                                    opacity="0.5"
                                />
                                {/* Y-axis values */}
                                <text
                                    x="-1"
                                    y={chartHeight * (1 - ratio)}
                                    fontSize="2"
                                    fill="currentColor"
                                    className="text-gray-500 dark:text-gray-400"
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                >
                                    {Math.round(maxValue * ratio)}
                                </text>
                            </g>
                        ))}

                        {/* Area under the line */}
                        <path
                            d={areaPath}
                            fill={color}
                            opacity="0.1"
                        />

                        {/* Line */}
                        <path
                            d={linePath}
                            fill="none"
                            stroke={color}
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Points */}
                        {points.map((point, index) => {
                            const isHovered = hoveredIndex === index;
                            return (
                                <circle
                                    key={index}
                                    cx={point.x}
                                    cy={point.y}
                                    r={isHovered ? "1.5" : "1"}
                                    fill={color}
                                    className="cursor-pointer transition-all"
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                />
                            );
                        })}
                    </svg>

                    {/* X-axis labels */}
                    <div className="flex justify-between mt-2 px-1">
                        {data.map((item, index) => (
                            <div
                                key={index}
                                className="text-xs text-gray-500 dark:text-gray-400 text-center"
                                style={{ width: `${100 / data.length}%` }}
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>

                    {/* Tooltip */}
                    {hoveredIndex !== null && (
                        <div
                            className="absolute bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm font-medium pointer-events-none z-10"
                            style={{
                                left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
                                top: '50%',
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <div className="font-bold">{points[hoveredIndex].count}</div>
                            <div className="text-xs opacity-90">{points[hoveredIndex].label}</div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
