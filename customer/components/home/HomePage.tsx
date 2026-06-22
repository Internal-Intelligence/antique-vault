import HomeHub from "./HomeHub";
import HomeCustodyStrip from "./HomeCustodyStrip";
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
      <HomeYourVault />
      <HomeCustodyStrip />
      <HomeTrustBar />
      <HomeCategoryGrid />
      <HomeFeaturedRow />
      <HomeHowItWorks />
      <HomeAuctionStrip />
      <HomeSellerBand />
    </div>
  );
}