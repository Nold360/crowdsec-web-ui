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
    const padding = 8; // increased padding for better point visibility

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

    // Smart tooltip positioning - avoid edges
    const getTooltipPosition = (index) => {
        const percentage = (index / (data.length - 1)) * 100;
        let left = `${percentage}%`;
        let transform = 'translate(-50%, -50%)';

        // Adjust for edges
        if (percentage < 15) {
            left = '15%';
            transform = 'translate(-50%, -50%)';
        } else if (percentage > 85) {
            left = '85%';
            transform = 'translate(-50%, -50%)';
        }

        return { left, transform };
    };

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
                                {/* Y-axis values - improved visibility */}
                                <text
                                    x="-1.5"
                                    y={chartHeight * (1 - ratio)}
                                    fontSize="3.5"
                                    fill="currentColor"
                                    className="text-gray-600 dark:text-gray-300"
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    fontWeight="500"
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
                            strokeWidth="0.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Points - improved visibility and interaction */}
                        {points.map((point, index) => {
                            const isHovered = hoveredIndex === index;
                            return (
                                <g key={index}>
                                    {/* Larger invisible hit area for better interaction */}
                                    <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r="3"
                                        fill="transparent"
                                        className="cursor-pointer"
                                        onMouseEnter={() => setHoveredIndex(index)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    />
                                    {/* Visible point */}
                                    <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r={isHovered ? "2" : "1.2"}
                                        fill={isHovered ? "#ffffff" : color}
                                        stroke={isHovered ? color : "none"}
                                        strokeWidth={isHovered ? "0.8" : "0"}
                                        className="transition-all pointer-events-none"
                                        style={{
                                            filter: isHovered ? 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' : 'none'
                                        }}
                                    />
                                </g>
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

                    {/* Tooltip - improved positioning and styling */}
                    {hoveredIndex !== null && (
                        <div
                            className="absolute bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-xl text-sm font-medium pointer-events-none z-10 transition-all duration-150"
                            style={{
                                ...getTooltipPosition(hoveredIndex),
                                top: '45%',
                            }}
                        >
                            <div className="font-bold text-base">{points[hoveredIndex].count}</div>
                            <div className="text-xs opacity-80 mt-0.5">{points[hoveredIndex].label}</div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
