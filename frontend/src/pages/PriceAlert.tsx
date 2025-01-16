import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Plus } from 'lucide-react';

interface AlertFormData {
    symbol: string;
    targetPrice: string;
    email: string;
    isAbove: boolean;
}

const PriceAlerts = () => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<AlertFormData>({
        symbol: 'bitcoin',
        targetPrice: '',
        email: '',
        isAbove: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/api/alert/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    ...formData,
                    targetPrice: parseFloat(formData.targetPrice)
                })
            });
            
            if (!response.ok) throw new Error('Failed to create alert');
            
            const newAlert = await response.json();
            setAlerts([...alerts, newAlert]);
            setShowForm(false);
            setFormData({ symbol: 'bitcoin', targetPrice: '', email: '', isAbove: true });
        } catch (error) {
            console.error('Error creating alert:', error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Price Alerts</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    <Plus size={20} />
                    New Alert
                </button>
            </div>

            {showForm && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Create Alert</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-2">Cryptocurrency</label>
                                <select
                                    value={formData.symbol}
                                    onChange={e => setFormData({...formData, symbol: e.target.value})}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="bitcoin">Bitcoin</option>
                                    <option value="ethereum">Ethereum</option>
                                    <option value="ripple">Ripple</option>
                                    <option value="cardano">Cardano</option>
                                    <option value="solana">Solana</option>
                                    <option value="tether">Tether</option>
                                    <option value="stellar">Stellar</option>
                                    <option value="dogecoin">Dogecoin</option>
                                    <option value="sui">Sui</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2">Target Price ($)</label>
                                <input
                                    type="number"
                                    value={formData.targetPrice}
                                    onChange={e => setFormData({...formData, targetPrice: e.target.value})}
                                    className="w-full p-2 border rounded"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Email</label>
                                <input type="email" onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block mb-2">Condition</label>
                                <select
                                    value={formData.isAbove ? 'above' : 'below'}
                                    onChange={e => setFormData({...formData, isAbove: e.target.value === 'above'})}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="above">Price goes above</option>
                                    <option value="below">Price goes below</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Create Alert
                            </button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map(alert => (
                    <Card key={alert.id}>
                        <CardContent className="flex items-center gap-4 p-4">
                            <Bell size={24} className="text-blue-500" />
                            <div>
                                <div className="font-semibold capitalize">{alert.symbol}</div>
                                <div className="text-sm text-gray-500">
                                    Alert when price goes {alert.is_above ? 'above' : 'below'} ${alert.target_price}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PriceAlerts;