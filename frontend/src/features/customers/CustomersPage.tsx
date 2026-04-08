import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../../services/api';

export default function CustomersPage() {
    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await customerApi.list();
            return res.data;
        },
    });

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Customers Database</h3>
            </div>
            
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Joined Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c: any) => (
                                <tr key={c.id}>
                                    <td><strong>{c.full_name}</strong></td>
                                    <td>{c.email}</td>
                                    <td>{c.phone || 'N/A'}</td>
                                    <td>
                                        <span className={`badge badge-${c.is_active ? 'success' : 'danger'}`}>
                                            {c.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center' }}>No customers found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
