import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Loader, Plus } from "lucide-react";
interface CryptoData {
  usd: number;
  usd_24h_change: number;
  last_updated_at: number;
}

interface CryptoPrices {
  [key: string]: CryptoData;
}
const CryptoDashboard = () => {
  const [prices, setPrices] = useState<CryptoPrices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<String | null>(null);

  const fetchPrices = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/crypto/prices");
      if (!response.ok) throw new Error("Failed to fetch prices");
      const data = await response.json();
      setPrices(data);
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="p-6">
        <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Crypto Dashboard</h1>
      <button
        onClick={() => {
          window.location.href = "/alerts";
        }}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        <Plus size={20} />
        Make Alert
      </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(prices).map(([coinId, coinData]) => {
          const coinName = coinId
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          return (
            <Card key={coinId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="capitalize">{coinName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                ${coinData.usd.toLocaleString()}
                </div>
                <div
                  className={`flex items-center ${
                    coinData.usd_24h_change >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {coinData.usd_24h_change >= 0 ? (
                    <ArrowUpRight size={20} />
                  ) : (
                    <ArrowDownRight size={20} />
                  )}
                  <span className="ml-1">
                    {Math.abs(coinData.usd_24h_change).toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CryptoDashboard;
