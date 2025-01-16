import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Loader } from 'lucide-react';

interface CryptoPrice {
    usd: number;
    usd_24h_change: number;
    last_updated_at: number;
}

interface CryptoPrices {
    [key: string]: CryptoPrice;
}
const CRYPTO_IDS = ['bitcoin', 'ethereum','xrp','tether','bnb','solana','dogecoin','stellar', 'ripple', 'cardano','sui','avalanche','hedera','toncoin'];

const CryptoDashboard = () => {
    const [prices, setPrices] = useState<CryptoPrices | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<String | null>(null);

    const fetchPrices = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/crypto/prices');
            if (!response.ok) throw new Error('Failed to fetch prices');
            const data = await response.json();
            setPrices(data);
        } catch (err) {
            setError('An error occurred');
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
        return (
            <div className="text-red-500 text-center p-4">
                {error}
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Crypto Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {CRYPTO_IDS.map(cryptoId => {
                    const data = prices?.[cryptoId];
                    if (!data) return null;

                    return (
                        <Card key={cryptoId} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="capitalize">{cryptoId}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-2">
                                    ${data.usd.toLocaleString()}
                                </div>
                                <div className={`flex items-center ${
                                    data.usd_24h_change >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                    {data.usd_24h_change >= 0 ? (
                                        <ArrowUpRight size={20} />
                                    ) : (
                                        <ArrowDownRight size={20} />
                                    )}
                                    <span className="ml-1">
                                        {Math.abs(data.usd_24h_change).toFixed(2)}%
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