import {
  GLOBE_NETWORK_STATS,
  type GlobeActivityEvent,
} from "../../../lib/globeActivity";

type Props = {
  activity: GlobeActivityEvent;
  interactive?: boolean;
};

export default function GlobeOverlayHome({ activity, interactive = false }: Props) {
  return (
    <div className="home-globe-overlay" aria-hidden={!interactive}>
      <div className="home-globe-overlay__head">
        <span className="home-globe-live">
          <span className="home-globe-live__pulse" />
          Live
        </span>
        <span className="home-globe-stat">{GLOBE_NETWORK_STATS.activeBuyers} active</span>
        <span className="home-globe-stat">{GLOBE_NETWORK_STATS.inTransit} in transit</span>
      </div>

      <p className="home-globe-activity" aria-live="polite">
        <span className="home-globe-activity__who">{activity.who}</span> {activity.action}{" "}
        <span className="home-globe-activity__item">{activity.item}</span>
        <span className="home-globe-activity__ago"> · {activity.ago}</span>
      </p>

      {interactive ? (
        <p className="home-globe-hint">Drag to rotate · Scroll to zoom</p>
      ) : (
        <p className="home-globe-hint home-globe-hint--idle">Click globe to explore</p>
      )}
    </div>
  );
}