/**
 * Product management page — list, create, edit, delete products.
 * Enhanced with barcode scan/auto-generate, JsBarcode preview, and label printing.
 *
 * Migrated to the design-system DataTable / Modal / primitives while preserving
 * all existing capabilities: EAN-13 generation + validation + scan-to-add,
 * label-printing (the `.label-print-area` / `.single-label` print classes are kept
 * intact for window.print), product image upload, and the create/edit modal.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { productApi, categoryApi, storeApi, getErrorMessage } from '../../services/api';
import type { Product, Category, Store } from '../../types';
import { Plus, Edit2, Trash2, Printer, Zap, ScanBarcode, History, Image as ImageIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import EntityHistoryPanel from '../../components/audit/EntityHistoryPanel';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader, Button, Badge, FormField, Input, Select } from '../../components/ui/primitives';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { usePermissions } from '../../features/auth/PermissionContext';

// ===== EAN-13 helpers =====
function calculateEAN13Checksum(digits12: string): string {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const d = parseInt(digits12[i], 10);
        sum += i % 2 === 0 ? d : d * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    return digits12 + String(check);
}

function generateEAN13(): string {
    const prefix = '501'; // UK country code (500-509)
    let body = '';
    for (let i = 0; i < 9; i++) body += String(Math.floor(Math.random() * 10));
    return calculateEAN13Checksum(prefix + body);
}

function isValidBarcode(code: string): boolean {
    if (!/^\d+$/.test(code)) return false;
    return code.length === 8 || code.length === 13;
}

// Render barcode to an SVG element
function renderBarcode(svgEl: SVGSVGElement | null, value: string) {
    if (!svgEl || !value) return;
    try {
        JsBarcode(svgEl, value, {
            format: value.length === 8 ? 'EAN8' : 'EAN13',
            width: 2, height: 50, displayValue: true,
            fontSize: 12, margin: 4, background: 'transparent',
            lineColor: 'currentColor',
        });
    } catch {
        // Invalid barcode format, just clear
        svgEl.innerHTML = '';
    }
}

export default function ProductsPage() {
    const { can } = usePermissions();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [form, setForm] = useState({
        name: '', sku: '', barcode: '', description: '', category_id: '',
        cost_price: '', selling_price: '', tax_rate: '0', unit: 'pcs', low_stock_threshold: '10',
        store_id: '', initial_stock: '0',
    });
    const [uploading, setUploading] = useState(false);

    const [historyEntityId, setHistoryEntityId] = useState<string | null>(null);
    const [historyEntityName, setHistoryEntityName] = useState<string>('');

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Barcode form state
    const [barcodeError, setBarcodeError] = useState('');
    const [scanMode, setScanMode] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const barcodePreviewRef = useRef<SVGSVGElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Label print state
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [labelProducts, setLabelProducts] = useState<Product[]>([]);
    const [labelSize, setLabelSize] = useState<string>('50x30');
    const [labelQty, setLabelQty] = useState(1);
    const printLabelSvgRefs = useRef<{ [key: string]: SVGSVGElement | null }>({});

    // Render barcode preview when form.barcode changes
    useEffect(() => {
        if (barcodePreviewRef.current && form.barcode) {
            if (isValidBarcode(form.barcode)) {
                renderBarcode(barcodePreviewRef.current, form.barcode);
            } else {
                barcodePreviewRef.current.innerHTML = '';
            }
        } else if (barcodePreviewRef.current) {
            barcodePreviewRef.current.innerHTML = '';
        }
    }, [form.barcode, showModal]);

    // Render label barcodes when label modal opens
    useEffect(() => {
        if (showLabelModal) {
            setTimeout(() => {
                labelProducts.forEach((p) => {
                    if (p.barcode && printLabelSvgRefs.current[p.id]) {
                        renderBarcode(printLabelSvgRefs.current[p.id], p.barcode);
                    }
                });
            }, 100);
        }
    }, [showLabelModal, labelProducts]);

    const loadData = useCallback(async () => {
        try {
            const [prodRes, catRes, storeRes] = await Promise.all([
                productApi.list({ limit: 200 }),
                categories.length === 0 ? categoryApi.list() : Promise.resolve({ data: categories }),
                stores.length === 0 ? storeApi.list() : Promise.resolve({ data: stores }),
            ]);
            setProducts(prodRes.data.items || []);
            if (categories.length === 0) setCategories(catRes.data || []);
            if (stores.length === 0) setStores(storeRes.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [categories, stores]);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ===== Barcode validation =====
    const validateBarcode = async (barcode: string): Promise<boolean> => {
        if (!barcode) { setBarcodeError(''); return true; }
        if (!isValidBarcode(barcode)) {
            setBarcodeError('Invalid barcode format — must be 8 or 13 digits');
            return false;
        }
        // Uniqueness check — search products with this barcode
        try {
            const res = await productApi.list({ search: barcode, limit: 5 });
            const existing = (res.data.items || []).find(
                (p: Product) => p.barcode === barcode && p.id !== editProduct?.id
            );
            if (existing) {
                setBarcodeError(`Barcode already used by "${existing.name}"`);
                return false;
            }
        } catch { /* ignore network errors during validation */ }
        setBarcodeError('');
        return true;
    };

    const handleBarcodeChange = (value: string) => {
        setForm({ ...form, barcode: value });
        setBarcodeError('');
    };

    const handleAutoGenerate = () => {
        const ean = generateEAN13();
        setForm({ ...form, barcode: ean });
        setBarcodeError('');
        toast.success(`Generated EAN-13: ${ean}`);
    };

    const handleScanMode = () => {
        setScanMode(true);
        setForm({ ...form, barcode: '' });
        setTimeout(() => barcodeInputRef.current?.focus(), 50);
    };

    const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setScanMode(false);
            validateBarcode(form.barcode);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate barcode before submit
        if (form.barcode && !(await validateBarcode(form.barcode))) {
            return;
        }

        try {
            const payload: any = {
                ...form,
                cost_price: parseFloat(form.cost_price) || 0,
                selling_price: parseFloat(form.selling_price) || 0,
                tax_rate: parseFloat(form.tax_rate) || 0,
                low_stock_threshold: parseInt(form.low_stock_threshold) || 10,
                category_id: form.category_id || undefined,
                sku: form.sku || undefined,
                store_id: form.store_id || undefined,
                initial_stock: parseInt(form.initial_stock) || 0,
            };

            if (editProduct) {
                await productApi.update(editProduct.id, payload);
                toast.success('Product updated');
            } else {
                await productApi.create(payload);
                toast.success('Product created');
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (err: any) {
            toast.error(getErrorMessage(err, 'Failed'));
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editProduct) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image too large (max 5MB)');
            return;
        }

        setUploading(true);
        try {
            await productApi.uploadImage(editProduct.id, file);
            toast.success('Image uploaded');
            // Refresh data to show new image
            loadData();
            // Close modal after success to show the update in list
            setShowModal(false);
        } catch (err) {
            toast.error(getErrorMessage(err, 'Upload failed'));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await productApi.delete(deleteTarget.id);
            toast.success('Product deleted');
            setDeleteTarget(null);
            loadData();
        } catch {
            toast.error('Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const openEdit = (product: Product) => {
        setEditProduct(product);
        setForm({
            name: product.name, sku: product.sku, barcode: product.barcode || '',
            description: product.description || '', category_id: product.category_id || '',
            cost_price: String(product.cost_price), selling_price: String(product.selling_price),
            tax_rate: String(product.tax_rate), unit: product.unit,
            low_stock_threshold: String(product.low_stock_threshold),
            store_id: '', initial_stock: '0',
        });
        setBarcodeError('');
        setScanMode(false);
        setShowModal(true);
    };

    const resetForm = () => {
        setEditProduct(null);
        setForm({ name: '', sku: '', barcode: '', description: '', category_id: '', cost_price: '', selling_price: '', tax_rate: '0', unit: 'pcs', low_stock_threshold: '10', store_id: '', initial_stock: '0' });
        setBarcodeError('');
        setScanMode(false);
    };

    // ===== Label Printing =====
    const openLabelPrint = (prods: Product[]) => {
        setLabelProducts(prods);
        setLabelQty(1);
        setShowLabelModal(true);
    };

    const labelDims: Record<string, { w: string; h: string }> = {
        '40x25': { w: '40mm', h: '25mm' },
        '50x30': { w: '50mm', h: '30mm' },
        '58x40': { w: '58mm', h: '40mm' },
    };

    const handlePrintLabels = () => window.print();

    const categoryName = (id?: string) => categories.find((c) => c.id === id)?.name || '—';

    // ===== Table columns =====
    const columns: Column<Product>[] = [
        {
            key: 'image_url',
            header: 'Image',
            render: (p) => (
                <div className="w-10 h-10 rounded-md bg-surface-container overflow-hidden flex items-center justify-center border border-outline-variant">
                    {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon size={20} className="text-on-surface-variant/40" />
                    )}
                </div>
            ),
        },
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            accessor: (p) => p.name,
            render: (p) => <span className="font-medium text-on-surface">{p.name}</span>,
        },
        {
            key: 'sku',
            header: 'SKU',
            sortable: true,
            accessor: (p) => p.sku,
            render: (p) => <Badge tone="primary">{p.sku}</Badge>,
        },
        {
            key: 'barcode',
            header: 'Barcode',
            accessor: (p) => p.barcode ?? '',
            render: (p) => <span className="font-mono text-xs">{p.barcode || '—'}</span>,
        },
        {
            key: 'category_id',
            header: 'Category',
            accessor: (p) => categoryName(p.category_id),
            render: (p) => categoryName(p.category_id),
        },
        ...(can('view_cost') ? ([{
            key: 'cost_price',
            header: 'Cost',
            align: 'right',
            accessor: (p: Product) => Number(p.cost_price),
            render: (p: Product) => `£${Number(p.cost_price).toFixed(2)}`,
        }] as Column<Product>[]) : []),
        {
            key: 'selling_price',
            header: 'Price',
            sortable: true,
            align: 'right',
            accessor: (p) => Number(p.selling_price),
            render: (p) => <span className="font-semibold text-success">£{Number(p.selling_price).toFixed(2)}</span>,
        },
        {
            key: 'tax_rate',
            header: 'Tax',
            align: 'right',
            accessor: (p) => Number(p.tax_rate),
            render: (p) => `${Number(p.tax_rate)}%`,
        },
        {
            key: 'low_stock_threshold',
            header: 'Low Stock At',
            sortable: true,
            align: 'center',
            accessor: (p) => Number(p.low_stock_threshold),
            render: (p) => {
                const t = Number(p.low_stock_threshold);
                const tone = t <= 0 ? 'danger' : t <= 5 ? 'warning' : 'neutral';
                return <Badge tone={tone}>{t <= 0 ? 'Off' : `≤ ${t}`}</Badge>;
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (p) => (
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(p)} title="Edit" aria-label="Edit" />
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={History}
                        title="History"
                        aria-label="History"
                        onClick={() => { setHistoryEntityId(p.id); setHistoryEntityName(p.name); }}
                    />
                    <Button variant="ghost" size="sm" icon={Printer} onClick={() => openLabelPrint([p])} title="Print Label" aria-label="Print Label" />
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(p)} title="Delete" aria-label="Delete" className="text-error hover:text-error" />
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Products"
                subtitle="Manage your catalogue, barcodes, and shelf labels."
                actions={
                    <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>
                        Add Product
                    </Button>
                }
            />

            <DataTable<Product>
                data={products}
                columns={columns}
                rowKey={(p) => p.id}
                loading={loading}
                searchKeys={[(p) => p.name, (p) => p.sku, (p) => p.barcode]}
                searchPlaceholder="Search products by name, SKU or barcode…"
                exportFilename="products"
                pageSize={12}
                selectable
                bulkActions={(rows, clear) => (
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={Printer}
                        onClick={() => { openLabelPrint(rows); clear(); }}
                    >
                        Print {rows.length} Labels
                    </Button>
                )}
                emptyTitle="No products yet"
                emptyMessage="Add your first product to start building your catalogue."
            />

            {/* ===== Create/Edit Modal ===== */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editProduct ? 'Edit Product' : 'New Product'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" form="product-form">{editProduct ? 'Update' : 'Create'} Product</Button>
                    </>
                }
            >
                {/* Image Section (Edit only) */}
                {editProduct && (
                    <div className="mb-6 p-4 bg-surface-container rounded-lg flex items-center gap-5">
                        <div className="w-24 h-24 rounded-xl bg-surface-container-lowest border border-outline-variant overflow-hidden flex items-center justify-center">
                            {products.find((p) => p.id === editProduct.id)?.image_url ? (
                                <img src={products.find((p) => p.id === editProduct.id)?.image_url} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon size={32} className="text-on-surface-variant/30" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-on-surface mb-1">Product Photo</h4>
                            <p className="text-xs text-on-surface-variant mb-3">JPG or PNG, max 5MB</p>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                icon={Upload}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading…' : 'Change Photo'}
                            </Button>
                        </div>
                    </div>
                )}

                <form id="product-form" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <FormField label="Product Name" required>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </FormField>
                        <FormField label="SKU (auto if empty)">
                            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                        </FormField>
                    </div>

                    {/* Enhanced Barcode Field */}
                    <FormField label="Barcode" error={barcodeError || undefined}>
                        <div className="flex gap-2">
                            <Input
                                ref={barcodeInputRef}
                                value={form.barcode}
                                onChange={(e) => handleBarcodeChange(e.target.value)}
                                onKeyDown={handleBarcodeKeyDown}
                                onBlur={() => { setScanMode(false); if (form.barcode) validateBarcode(form.barcode); }}
                                placeholder={scanMode ? 'Ready to scan... (press Enter)' : 'Enter barcode'}
                                className={cnField(scanMode, !!barcodeError)}
                            />
                            <Button type="button" variant="secondary" icon={ScanBarcode} onClick={handleScanMode} title="Scan barcode">
                                Scan
                            </Button>
                            <Button type="button" variant="secondary" icon={Zap} onClick={handleAutoGenerate} title="Auto-generate EAN-13">
                                Auto
                            </Button>
                        </div>
                    </FormField>

                    {/* Barcode Preview */}
                    {form.barcode && isValidBarcode(form.barcode) && (
                        <div className="text-center p-3 mb-4 bg-surface-container-lowest rounded-md border border-outline-variant text-on-surface">
                            <svg ref={barcodePreviewRef} />
                        </div>
                    )}

                    <FormField label="Description">
                        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </FormField>

                    <FormField label="Category">
                        <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                            <option value="">None</option>
                            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </Select>
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                        <FormField label="Cost Price" required>
                            <Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} required />
                        </FormField>
                        <FormField label="Selling Price" required>
                            <Input type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} required />
                        </FormField>
                        <FormField label="Tax %">
                            <Input type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <FormField label="Unit">
                            <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                        </FormField>
                        <FormField label="Low Stock Threshold">
                            <Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
                        </FormField>
                    </div>

                    {!editProduct && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            <FormField label="Store (for initial stock)">
                                <Select value={form.store_id} onChange={(e) => setForm({ ...form, store_id: e.target.value })}>
                                    <option value="">Select a store</option>
                                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Select>
                            </FormField>
                            <FormField label="Initial Stock">
                                <Input type="number" min="0" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: e.target.value })} />
                            </FormField>
                        </div>
                    )}
                </form>
            </Modal>

            {/* ===== Label Print Modal ===== */}
            <Modal
                open={showLabelModal}
                onClose={() => setShowLabelModal(false)}
                title={
                    <span className="inline-flex items-center gap-2">
                        <Printer size={18} /> Print Labels ({labelProducts.length} product{labelProducts.length > 1 ? 's' : ''})
                    </span>
                }
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowLabelModal(false)}>Cancel</Button>
                        <Button icon={Printer} onClick={handlePrintLabels}>
                            Print {labelQty * labelProducts.length} Label{(labelQty * labelProducts.length) > 1 ? 's' : ''}
                        </Button>
                    </>
                }
            >
                {/* Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4 mb-5">
                    <FormField label="Label Size" className="mb-0">
                        <Select value={labelSize} onChange={(e) => setLabelSize(e.target.value)}>
                            <option value="40x25">40mm × 25mm</option>
                            <option value="50x30">50mm × 30mm (default)</option>
                            <option value="58x40">58mm × 40mm</option>
                        </Select>
                    </FormField>
                    <FormField label="Quantity" className="mb-0">
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={labelQty}
                            onChange={(e) => setLabelQty(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                    </FormField>
                </div>

                {/* Preview */}
                <div className="border border-outline-variant rounded-md p-4 bg-surface-container-lowest mb-2 overflow-x-auto">
                    <div className="flex flex-wrap gap-2">
                        {labelProducts.map((p) => (
                            <div
                                key={p.id}
                                className="border border-dashed border-outline-variant rounded p-1.5 flex flex-col items-center justify-center font-mono text-center text-on-surface"
                                style={{ width: labelDims[labelSize].w, minHeight: labelDims[labelSize].h, fontSize: '0.65rem' }}
                            >
                                <div className="text-on-surface-variant" style={{ fontSize: '0.55rem', fontWeight: 500 }}>Daily Grocer</div>
                                <div className="my-0.5" style={{ fontSize: '0.7rem', fontWeight: 600 }}>{p.name}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800 }}>£{Number(p.selling_price).toFixed(2)}</div>
                                {p.barcode ? (
                                    <svg
                                        ref={(el) => {
                                            printLabelSvgRefs.current[p.id] = el;
                                            if (el && p.barcode) renderBarcode(el, p.barcode);
                                        }}
                                        style={{ maxWidth: '90%' }}
                                    />
                                ) : (
                                    <div className="text-on-surface-variant/60 mt-1" style={{ fontSize: '0.55rem' }}>No barcode</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            {/*
              Hidden print area — rendered OUTSIDE the Modal at page root so the
              `@media print` rules (`body * { visibility:hidden }` /
              `.label-print-area * { visible }`) target it without any modal
              stacking-context / overflow interference. Kept in the DOM while the
              label modal is open, which is when window.print() is invoked.
              The `.label-print-area` and `.single-label` class names MUST stay
              intact (see src/index.css @media print block).
            */}
            {showLabelModal && (
                <div className="label-print-area" id="label-print-area" style={{ display: 'none' }}>
                    {labelProducts.flatMap((p) =>
                        Array.from({ length: labelQty }, (_, qi) => (
                            <div
                                key={`${p.id}-${qi}`}
                                className="single-label"
                                style={{ width: labelDims[labelSize].w, height: labelDims[labelSize].h }}
                            >
                                <div style={{ fontSize: '7px', fontWeight: 500, opacity: 0.7 }}>Daily Grocer</div>
                                <div style={{ fontSize: '9px', fontWeight: 600, margin: '1px 0' }}>{p.name}</div>
                                <div style={{ fontSize: '14px', fontWeight: 800 }}>£{Number(p.selling_price).toFixed(2)}</div>
                                {p.barcode && (
                                    <svg
                                        ref={(el) => {
                                            if (el && p.barcode) {
                                                try {
                                                    JsBarcode(el, p.barcode, {
                                                        format: p.barcode.length === 8 ? 'EAN8' : 'EAN13',
                                                        width: 1.5, height: 30, displayValue: true,
                                                        fontSize: 8, margin: 2, background: 'transparent',
                                                        lineColor: '#000',
                                                    });
                                                } catch { /* skip */ }
                                            }
                                        }}
                                        style={{ maxWidth: '95%' }}
                                    />
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ===== Delete confirmation ===== */}
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete product"
                message={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone.` : ''}
                confirmLabel="Delete"
                loading={deleting}
            />

            <EntityHistoryPanel
                isOpen={!!historyEntityId}
                onClose={() => setHistoryEntityId(null)}
                entityType="Product"
                entityId={historyEntityId || ''}
                entityName={historyEntityName}
            />
        </div>
    );
}

/** Extra emphasis classes for the barcode input while scanning / on error. */
function cnField(scan: boolean, error: boolean): string {
    if (error) return 'font-mono border-error focus:border-error focus:ring-error/20';
    if (scan) return 'font-mono border-warning focus:border-warning focus:ring-warning/20';
    return 'font-mono';
}
