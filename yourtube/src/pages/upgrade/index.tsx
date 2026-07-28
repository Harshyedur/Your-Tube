import PricingCards from "@/components/PricingCards";

export default function UpgradePage() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Choose your plan</h1>
        <p className="text-gray-600">Upgrade anytime. Cancel anytime.</p>
      </div>
      <PricingCards />
    </div>
  );
}