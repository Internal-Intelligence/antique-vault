import {
  GLOBE_NETWORK_STATS,
  type GlobeActivityEvent,
} from "../../../lib/globeActivity";

type Props = {
  activity: GlobeActivityEvent;
};

export default function GlobeOverlayHome({ activity }: Props) {
  return (
    <div className="home-globe-overlay" aria-hidden>
      <div className="home-globe-overlay__top">
        <div className="home-globe-panel home-globe-panel--status">
          <span className="home-globe-live">
            <span className="home-globe-live__pulse" />
            Live network
          </span>
          <p className="home-globe-activity" aria-live="polite">
            <span className="home-globe-activity__who">{activity.who}</span> {activity.action}{" "}
            <span className="home-globe-activity__item">{activity.item}</span>
            <span className="home-globe-activity__ago"> · {activity.ago} ago</span>
          </p>
        </div>

        <div className="home-globe-stats">
          <span className="home-globe-stat">{GLOBE_NETWORK_STATS.activeBuyers} active</span>
          <span className="home-globe-stat">{GLOBE_NETWORK_STATS.inTransit} in transit</span>
          <span className="home-globe-stat home-globe-stat--vault">{GLOBE_NETWORK_STATS.vaultLabel}</span>
        </div>
      </div>

      <p className="home-globe-hint">Drag to explore · Real gear moving through the mesh</p>
    </div>
  );
}