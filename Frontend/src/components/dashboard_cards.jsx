// Will display the Total Events, Events/sec, Top Topic, Percantages on the sentiments
// import { useState, useEffect } from 'react'



export function Dashboard_Cards({analytics}) {
    const eventsPerSecond = analytics?.events_per_second ?? 0;
    const totalEvents = analytics?.total_events ?? 0;
    const topicCounts = analytics?.topic_counts ?? {};
    const sentimentCounts = analytics?.sentiment_counts ?? {};
    
    const topTopic = Object.entries(topicCounts).reduce(
    (max, current) => current[1] > max[1] ? current : max,
    ['No data', 0])[0];

    const [topSentiment, topSentimentCount] = Object.entries(sentimentCounts).reduce(
    (max, current) => current[1] > max[1] ? current : max,
    ['No data', 0]
    )

    const totalSentiments = Object.values(sentimentCounts).reduce(
    (sum, count) => sum + count, 0)

    const sentimentPercentage = totalSentiments > 0
    ? Math.round((topSentimentCount / totalSentiments) * 100): 0

    

    return (
        <section>
            <article>
                <h2>Total Event</h2>
                <p>analytics for total events: {totalEvents.toLocaleString()}</p>
            </article>

            <article>
                <h2>Events Per/Second:</h2>
                <p>{eventsPerSecond}</p>
            </article>

            <article>
                <h2>Top Topic</h2>
                <p>{topTopic}</p>
            </article>

            <article>
            <h2>{topSentiment}</h2>
               <p>{sentimentPercentage}%</p>
            </article>
        </section>
    )
}