import HomeHub from "./HomeHub";
import HomeGlobeSection from "./HomeGlobeSection";
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
      <HomeGlobeSection />
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