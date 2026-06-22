import HomeHub from "./HomeHub";
import HomeLiveActivity from "./HomeLiveActivity";
import HomeCategoryGrid from "./HomeCategoryGrid";
import HomeFeaturedRow from "./HomeFeaturedRow";
import HomeAuctionStrip from "./HomeAuctionStrip";
import HomeTrustBar from "./HomeTrustBar";
import HomeSellerBand from "./HomeSellerBand";
import HomeHowItWorks from "./HomeHowItWorks";
import HomeYourVault from "./HomeYourVault";

export default function HomePage() {
  return (
    <div className="home-page">
      <HomeHub />
      <HomeLiveActivity />
      <HomeYourVault />
      <HomeCategoryGrid />
      <HomeFeaturedRow />
      <HomeAuctionStrip />
      <HomeTrustBar />
      <HomeSellerBand />
      <HomeHowItWorks />
    </div>
  );
}