import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../services/api';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader, Badge } from '../../components/ui/primitives';

interface Customer {
    id: string;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    membership_tier?: string | null;
    is_active?: boolean;
    created_at: string;
}

const TIER_TONE: Record<string, 'primary' | 'info' | 'neutral'> = {
    vip: 'primary',
    premium: 'info',
    standard: 'neutral',
};

function tierLabel(tier?: string | null) {
    const t = (tier || 'standard').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
}

function formatDate(value?: string | null) {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

export default function CustomersPage() {
    const navigate = useNavigate();
    const { data: customers = [], isLoading } = useQuery<Customer[]>({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await customerApi.list();
            return res.data;
        },
    });

    const columns: Column<Customer>[] = [
        {
            key: 'full_name',
            header: 'Name',
            sortable: true,
            accessor: (c) => c.full_name ?? '',
            render: (c) => <span className="font-semibold text-on-surface">{c.full_name || '—'}</span>,
        },
        {
            key: 'email',
            header: 'Email',
            sortable: true,
            accessor: (c) => c.email ?? '',
            render: (c) => c.email || '—',
        },
        {
            key: 'phone',
            header: 'Phone',
            accessor: (c) => c.phone ?? '',
            render: (c) => c.phone || 'N/A',
        },
        {
            key: 'membership_tier',
            header: 'Tier',
            sortable: true,
            accessor: (c) => tierLabel(c.membership_tier),
            render: (c) => {
                const tier = (c.membership_tier || 'standard').toLowerCase();
                return <Badge tone={TIER_TONE[tier] ?? 'neutral'}>{tierLabel(tier)}</Badge>;
            },
        },
        {
            key: 'is_active',
            header: 'Status',
            accessor: (c) => (c.is_active ? 'Active' : 'Inactive'),
            render: (c) => (
                <Badge tone={c.is_active ? 'success' : 'danger'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
            ),
        },
        {
            key: 'created_at',
            header: 'Joined',
            sortable: true,
            accessor: (c) => c.created_at ?? '',
            render: (c) => formatDate(c.created_at),
        },
    ];

    return (
        <div>
            <PageHeader title="Customers" subtitle="Browse and manage your customer database." />
            <DataTable<Customer>
                data={customers}
                columns={columns}
                rowKey={(c) => c.id}
                loading={isLoading}
                onRowClick={(c) => navigate(`/customers/${c.id}`)}
                searchKeys={[(c) => c.full_name, (c) => c.email, (c) => c.phone]}
                searchPlaceholder="Search customers…"
                exportFilename="customers"
                pageSize={12}
                emptyTitle="No customers yet"
                emptyMessage="Customers will appear here once they register or place an order."
            />
        </div>
    );
}
