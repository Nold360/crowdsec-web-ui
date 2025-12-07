import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import * as ReactWindow from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { fetchAlerts, fetchAlert } from "../lib/api";
import { Badge } from "../components/ui/Badge";
import { Search, Info, ExternalLink, Shield } from "lucide-react";

const List = ReactWindow.FixedSizeList || ReactWindow.default?.FixedSizeList;

export function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const loadAlerts = async () => {
            try {
                const alertsData = await fetchAlerts();
                setAlerts(alertsData);

                // Check if there's an alert ID in the URL
                const alertIdParam = searchParams.get("id");
                if (alertIdParam) {
                    const existingAlert = alertsData.find(a => String(a.id) === alertIdParam);
                    if (existingAlert) {
                        setSelectedAlert(existingAlert);
                    } else {
                        // Fetch the specific alert if not in the list
                        try {
                            const alertData = await fetchAlert(alertIdParam);
                            setSelectedAlert(alertData);
                        } catch (err) {
                            console.error("Alert not found", err);
                        }
                    }
                    // Clear the URL param after loading
                    setSearchParams({});
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadAlerts();
    }, [searchParams, setSearchParams]);

    const filteredAlerts = alerts.filter(alert =>
        (alert.scenario || "").toLowerCase().includes(filter.toLowerCase()) ||
        (alert.message || "").toLowerCase().includes(filter.toLowerCase())
    );

    // Grid columns configuration
    // ID | Time | Scenario | Message | Decisions | Actions
    const gridTemplateColumns = "80px 180px 220px 1fr 100px 80px";

    const Row = ({ index, style }) => {
        const alert = filteredAlerts[index];
        // Apply alternate background manually since we don't have :nth-child in virtual list
        const bgClass = index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900/30";

        return (
            <div style={style} className={`${bgClass} border-b border-gray-100 dark:border-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center group`}>
                <div className="grid w-full items-center px-4" style={{ gridTemplateColumns }}>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate pr-2 font-mono">
                        #{alert.id}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 truncate pr-2">
                        {new Date(alert.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 pr-2 overflow-hidden">
                        <Badge variant="warning" className="truncate block max-w-full text-center">{alert.scenario}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate pr-4" title={alert.message}>
                        {alert.message}
                    </div>
                    <div className="text-sm pl-2">
                        {alert.decisions && alert.decisions.length > 0 ? (() => {
                            // Check if there are any active (non-expired) decisions
                            const activeDecisions = alert.decisions.filter(d => {
                                if (!d.stop_at) return true; // No expiration means active
                                return new Date(d.stop_at) > new Date();
                            });

                            const hasActiveDecisions = activeDecisions.length > 0;

                            if (hasActiveDecisions) {
                                return (
                                    <Link
                                        to={`/decisions?alert_id=${alert.id}`}
                                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition-colors"
                                        title="View active decisions for this alert"
                                    >
                                        <Shield size={16} className="text-red-600 dark:text-red-400" />
                                        <span className="text-gray-900 dark:text-gray-100 font-medium">{activeDecisions.length}</span>
                                    </Link>
                                );
                            } else {
                                return (
                                    <div className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-600 cursor-help" title="All decisions expired">
                                        <Shield size={16} className="opacity-50" />
                                        <span className="font-medium line-through">{alert.decisions.length}</span>
                                    </div>
                                );
                            }
                        })() : (
                            <span className="text-gray-400">-</span>
                        )}
                    </div>
                    <div className="text-right">
                        <button
                            onClick={() => setSelectedAlert(alert)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="View Details"
                        >
                            <Info size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
            <div className="flex justify-between items-center flex-shrink-0">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Alerts</h2>
                {(filteredAlerts.length !== alerts.length) && (
                    <div className="text-sm text-gray-500">
                        Showing {filteredAlerts.length} of {alerts.length} alerts
                    </div>
                )}
            </div>

            <div className="relative flex-shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Filter alerts by scenario or message..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                {/* Header Row */}
                <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0 z-10">
                    <div className="grid w-full" style={{ gridTemplateColumns }}>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scenario</div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-2">Decisions</div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</div>
                    </div>
                </div>

                {/* Virtual List */}
                <div className="flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-500">Loading alerts...</div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">No alerts found</div>
                    ) : (
                        <AutoSizer>
                            {({ height, width }) => (
                                <List
                                    height={height}
                                    width={width}
                                    itemCount={filteredAlerts.length}
                                    itemSize={64} // Row height
                                    className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                                >
                                    {Row}
                                </List>
                            )}
                        </AutoSizer>
                    )}
                </div>
            </div>

            {selectedAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAlert(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Alert Details <span className="text-gray-400">#{selectedAlert.id}</span>
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Captured at {new Date(selectedAlert.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Scenario</h4>
                                    <div className="font-medium text-gray-900 dark:text-gray-100 break-words">
                                        <Badge variant="warning">{selectedAlert.scenario}</Badge>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Attacker IP</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                                            {selectedAlert.source?.ip || selectedAlert.source?.value || "N/A"}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {selectedAlert.source?.as_name} ({selectedAlert.source?.as_number})
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Location</h4>
                                    <div className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                                        {selectedAlert.source?.cn}
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono mt-1">
                                        Lat: {selectedAlert.source?.latitude}, Long: {selectedAlert.source?.longitude}
                                    </div>
                                </div>
                            </div>

                            {/* Decisions */}
                            {selectedAlert.decisions && selectedAlert.decisions.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Decisions Taken</h4>
                                        <Link
                                            to={`/decisions?alert_id=${selectedAlert.id}`}
                                            className="p-2 rounded-full text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                            title="View in Decisions"
                                        >
                                            <ExternalLink size={18} />
                                        </Link>
                                    </div>
                                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-900">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Origin</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                                {selectedAlert.decisions.map((decision, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 text-sm"><Badge variant="danger">{decision.type}</Badge></td>
                                                        <td className="px-4 py-2 text-sm font-mono">{decision.value}</td>
                                                        <td className="px-4 py-2 text-sm">{decision.duration}</td>
                                                        <td className="px-4 py-2 text-sm">{decision.origin}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Events Breakdown */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    Events ({selectedAlert.events_count})
                                </h4>
                                <div className="space-y-2">
                                    {selectedAlert.events?.slice(0, 10).map((event, idx) => {
                                        // Helper to extract meta value
                                        const getMeta = (key) => event.meta?.find(m => m.key === key)?.value || "-";

                                        return (
                                            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded border border-gray-100 dark:border-gray-800 text-sm">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="text-gray-500">Timestamp:</span> <span className="font-mono text-xs">{event.timestamp}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Service:</span> {getMeta('service')}
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 font-mono text-xs break-all bg-white dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-800 mt-1">
                                                        <span className="text-blue-600 dark:text-blue-400 font-bold">{getMeta('http_verb')}</span> {getMeta('http_path') || getMeta('target_fqdn')}
                                                        <div className="text-gray-400 mt-1">Status: {getMeta('http_status')} | UA: {getMeta('http_user_agent')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {selectedAlert.events?.length > 10 && (
                                        <div className="text-center text-sm text-gray-500">
                                            + {selectedAlert.events.length - 10} more events
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
