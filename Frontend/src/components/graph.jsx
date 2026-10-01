
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function Live_Traffic_Graph({analytics}) {
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!analytics) return

        const point = {
            time: Date.now(),
            eventPerSecond: analytics.events_per_second ?? 0
        };

        setData((previous) =>  [...previous, point].slice(-240))
    }, [analytics])

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
                dataKey="time"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickCount={6}
                tickFormatter={(time) =>
                    new Date(time).toLocaleTimeString([], {
                    minute: '2-digit',
                    second: '2-digit',
                    }) 
                }           
             />
            <YAxis />
            <Tooltip
                labelFormatter={(time) => new Date(time).toLocaleTimeString()}
            />
            <Area
                type="monotone"
                dataKey="eventPerSecond"
                name="Events / second"
                stroke="#2563eb"
                fill="#93c5fd"
            />
            </AreaChart>
        </ResponsiveContainer>
    )
}