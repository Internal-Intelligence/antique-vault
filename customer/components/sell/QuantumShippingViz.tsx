import ShippingGlobe from "../globe/ShippingGlobe";

interface QuantumShippingVizProps {
  animating: boolean;
  optimizedIndex: number | null;
  shipAddress: string;
  onOptimize: (idx: number) => void;
}

export default function QuantumShippingViz({
  animating,
  optimizedIndex,
  shipAddress,
}: QuantumShippingVizProps) {
  return (
    <ShippingGlobe
      mode="sell"
      animating={animating}
      optimizedIndex={optimizedIndex}
      shipAddress={shipAddress}
      height={460}
      active
    />
  );
}