import React, { useState, useEffect } from 'react';
import { refundApi } from '../services/api';
import { Package, Clock, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RefundStatus() {
    const navigate = useNavigate();
    const [refunds, setRefunds] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        refundApi.listMine().then(res => {
            setRefunds(res.data);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return <div className="p-8 text-center"><div className="spinner" /></div>;
    }

    if (!refunds || refunds.length === 0) {
        return (
            <div className="container mx-auto p-4 md:p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">My Refunds</h1>
                <p className="text-gray-500">You have no active or past refund requests.</p>
                <button onClick={() => navigate('/orders')} className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-bold">
                    View Orders
                </button>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        if (status === 'approved') return 'text-green-600 bg-green-50';
        if (status === 'rejected') return 'text-red-600 bg-red-50';
        return 'text-amber-600 bg-amber-50';
    };

    const getStatusIcon = (status: string) => {
        if (status === 'approved') return <CheckCircle2 size={18} className="text-green-600" />;
        if (status === 'rejected') return <XCircle size={18} className="text-red-600" />;
        return <Clock size={18} className="text-amber-600" />;
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <h1 className="text-3xl font-extrabold mb-8 text-gray-900 tracking-tight">Refund History</h1>
            <div className="flex flex-col gap-6">
                {refunds.map((refund: any) => (
                    <div key={refund.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Requested on {new Date(refund.created_at).toLocaleDateString()}
                                </div>
                                <div className="font-bold text-lg flex items-center gap-2">
                                    Total: £{Number(refund.total_amount).toFixed(2)}
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${getStatusColor(refund.status)}`}>
                                {getStatusIcon(refund.status)}
                                <span className="capitalize">{refund.status}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {refund.items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-xl">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm text-primary">
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{item.reason?.replace('_', ' ').toUpperCase()}</div>
                                            <div className="text-sm text-gray-600 mt-1">Qty: {item.quantity} • £{Number(item.amount).toFixed(2)}</div>
                                            {item.customer_notes && (
                                                <div className="text-sm text-gray-500 mt-2 italic">"{item.customer_notes}"</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)} capitalize`}>
                                            {item.status}
                                        </div>
                                        {item.status === 'pending' && ['damaged_item', 'wrong_item', 'quality_issue'].includes(item.reason) && (!item.evidence || item.evidence.length === 0) && (
                                            <label className="cursor-pointer flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark mt-2">
                                                <Camera size={14} /> Upload Photo
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                await refundApi.uploadEvidence(item.id, file);
                                                                window.location.reload();
                                                            } catch (err) {
                                                                alert("Upload failed.");
                                                            }
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                        {item.evidence?.length > 0 && (
                                            <div className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-2">
                                                <CheckCircle2 size={12} /> Photo Uploaded
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
