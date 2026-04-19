/**
 * Product management page — list, create, edit, delete products.
 * Enhanced with barcode scan/auto-generate, JsBarcode preview, and label printing.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { productApi, categoryApi, storeApi, getErrorMessage } from '../../services/api';
import type { Product, Category, Store } from '../../types';
import { Plus, Edit2, Trash2, Search, Printer, Check, Zap, ScanBarcode, History, Image as ImageIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import EntityHistoryPanel from '../../components/audit/EntityHistoryPanel';

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
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [search, setSearch] = useState('');
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
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const labelSvgRefs = useRef<{ [key: string]: SVGSVGElement | null }>({});
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
                productApi.list({ limit: 200, ...(search ? { search } : {}) }),
                categories.length === 0 ? categoryApi.list() : Promise.resolve({ data: categories }),
                stores.length === 0 ? storeApi.list() : Promise.resolve({ data: stores }),
            ]);
            setProducts(prodRes.data.items || []);
            if (categories.length === 0) setCategories(catRes.data || []);
            if (stores.length === 0) setStores(storeRes.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [search, categories.length, stores.length]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 500);
        return () => clearTimeout(timer);
    }, [loadData, search]);

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

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this product?')) return;
        try {
            await productApi.delete(id);
            toast.success('Product deleted');
            loadData();
        } catch { toast.error('Failed to delete'); }
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
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === products.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(products.map(p => p.id)));
        }
    };

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

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 12, flex: 1, alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }}
                        />
                        <input
                            className="form-input"
                            placeholder="Search products by name, SKU or barcode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 40 }}
                        />
                    </div>
                    {selectedIds.size > 0 && (
                        <button className="btn btn-secondary" onClick={() => openLabelPrint(products.filter(p => selectedIds.has(p.id)))}>
                            <Printer size={14} /> Print {selectedIds.size} Labels
                        </button>
                    )}
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={16} /> Add Product
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>
                                    <input type="checkbox"
                                        checked={selectedIds.size === products.length && products.length > 0}
                                        onChange={toggleSelectAll}
                                        style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                                </th>
                                <th>Image</th>
                                <th>Name</th>
                                <th>SKU</th>
                                <th>Barcode</th>
                                <th>Category</th>
                                <th>Cost</th>
                                <th>Price</th>
                                <th>Tax</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No products yet</td></tr>
                            ) : products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <input type="checkbox"
                                            checked={selectedIds.has(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                            style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                                    </td>
                                    <td>
                                        <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <ImageIcon size={20} style={{ opacity: 0.3 }} />
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{product.name}</td>
                                    <td><span className="badge badge-primary">{product.sku}</span></td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{product.barcode || '—'}</td>
                                    <td>{categories.find(c => c.id === product.category_id)?.name || '—'}</td>
                                    <td>£{Number(product.cost_price).toFixed(2)}</td>
                                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>£{Number(product.selling_price).toFixed(2)}</td>
                                    <td>{Number(product.tax_rate)}%</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn-icon" onClick={() => openEdit(product)} title="Edit"><Edit2 size={14} /></button>
                                            <button className="btn-icon" onClick={() => { setHistoryEntityId(product.id); setHistoryEntityName(product.name); }} title="History"><History size={14} /></button>
                                            <button className="btn-icon" onClick={() => openLabelPrint([product])} title="Print Label"><Printer size={14} /></button>
                                            <button className="btn-icon" onClick={() => handleDelete(product.id)} title="Delete"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===== Create/Edit Modal ===== */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editProduct ? 'Edit Product' : 'New Product'}</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><CloseIcon size={16} /></button>
                        </div>

                        {/* Image Section (Edit only) */}
                        {editProduct && (
                            <div style={{ marginBottom: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 20 }}>
                                <div style={{ width: 100, height: 100, borderRadius: 12, background: '#fff', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {products.find(p => p.id === editProduct.id)?.image_url ? (
                                        <img src={products.find(p => p.id === editProduct.id)?.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <ImageIcon size={32} style={{ opacity: 0.2 }} />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Product Photo</h4>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>JPG or PNG, max 5MB</p>
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        style={{ height: 36, fontSize: '0.85rem' }}
                                    >
                                        <Upload size={14} /> {uploading ? 'Uploading...' : 'Change Photo'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Product Name *</label>
                                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">SKU (auto if empty)</label>
                                    <input className="form-input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                                </div>
                            </div>

                            {/* Enhanced Barcode Field */}
                            <div className="form-group">
                                <label className="form-label">Barcode</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        ref={barcodeInputRef}
                                        className="form-input"
                                        value={form.barcode}
                                        onChange={(e) => handleBarcodeChange(e.target.value)}
                                        onKeyDown={handleBarcodeKeyDown}
                                        onBlur={() => { setScanMode(false); if (form.barcode) validateBarcode(form.barcode); }}
                                        placeholder={scanMode ? 'Ready to scan... (press Enter)' : 'Enter barcode'}
                                        style={{
                                            flex: 1, fontFamily: 'monospace',
                                            ...(scanMode ? { borderColor: 'var(--warning)', boxShadow: '0 0 0 3px rgba(234,179,8,0.2)' } : {}),
                                            ...(barcodeError ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.2)' } : {}),
                                        }}
                                    />
                                    <button type="button" className="btn btn-secondary" onClick={handleScanMode} title="Scan barcode"
                                        style={{ padding: '0 12px' }}>
                                        <ScanBarcode size={16} /> Scan
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={handleAutoGenerate} title="Auto-generate EAN-13"
                                        style={{ padding: '0 12px' }}>
                                        <Zap size={16} /> Auto
                                    </button>
                                </div>
                                {barcodeError && (
                                    <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 500 }}>{barcodeError}</div>
                                )}
                            </div>

                            {/* Barcode Preview */}
                            {form.barcode && isValidBarcode(form.barcode) && (
                                <div style={{ textAlign: 'center', padding: 12, marginBottom: 16, background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <svg ref={barcodePreviewRef} />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                                    <option value="">None</option>
                                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Cost Price *</label>
                                    <input type="number" step="0.01" className="form-input" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Selling Price *</label>
                                    <input type="number" step="0.01" className="form-input" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Tax %</label>
                                    <input type="number" step="0.01" className="form-input" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Unit</label>
                                    <input className="form-input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Low Stock Threshold</label>
                                    <input type="number" className="form-input" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
                                </div>
                            </div>
                            {!editProduct && (
                                <div className="input-group">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Store (for initial stock)</label>
                                        <select className="form-select" value={form.store_id} onChange={(e) => setForm({ ...form, store_id: e.target.value })}>
                                            <option value="">Select a store</option>
                                            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Initial Stock</label>
                                        <input type="number" min="0" className="form-input" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: e.target.value })} />
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editProduct ? 'Update' : 'Create'} Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== Label Print Modal ===== */}
            {showLabelModal && (
                <div className="modal-overlay" onClick={() => setShowLabelModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h3 className="modal-title"><Printer size={18} /> Print Labels ({labelProducts.length} product{labelProducts.length > 1 ? 's' : ''})</h3>
                            <button className="btn-icon" onClick={() => setShowLabelModal(false)}><CloseIcon size={16} /></button>
                        </div>

                        {/* Settings */}
                        <div className="input-group" style={{ marginBottom: 20 }}>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="form-label">Label Size</label>
                                <select className="form-select" value={labelSize} onChange={(e) => setLabelSize(e.target.value)}>
                                    <option value="40x25">40mm × 25mm</option>
                                    <option value="50x30">50mm × 30mm (default)</option>
                                    <option value="58x40">58mm × 40mm</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ width: 120, marginBottom: 0 }}>
                                <label className="form-label">Quantity</label>
                                <input type="number" min={1} max={100} className="form-input"
                                    value={labelQty} onChange={(e) => setLabelQty(Math.max(1, parseInt(e.target.value) || 1))} />
                            </div>
                        </div>

                        {/* Preview */}
                        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, background: '#fff', marginBottom: 20, overflowX: 'auto' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {labelProducts.map((p) => (
                                    <div key={p.id} style={{
                                        width: labelDims[labelSize].w, minHeight: labelDims[labelSize].h,
                                        border: '1px dashed #ccc', borderRadius: 4, padding: 6,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: 'monospace', color: '#000', fontSize: '0.65rem', textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: '0.55rem', fontWeight: 500, opacity: 0.7 }}>RetailPOS</div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, margin: '2px 0' }}>{p.name}</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>£{Number(p.selling_price).toFixed(2)}</div>
                                        {p.barcode && (
                                            <>
                                                <svg ref={(el) => {
                                                    printLabelSvgRefs.current[p.id] = el;
                                                    if (el && p.barcode) renderBarcode(el, p.barcode);
                                                }} style={{ maxWidth: '90%' }} />
                                            </>
                                        )}
                                        {!p.barcode && <div style={{ fontSize: '0.55rem', opacity: 0.5, marginTop: 4 }}>No barcode</div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hidden print area */}
                        <div className="label-print-area" id="label-print-area" style={{ display: 'none' }}>
                            {labelProducts.flatMap((p) =>
                                Array.from({ length: labelQty }, (_, qi) => (
                                    <div key={`${p.id}-${qi}`} className="single-label" style={{
                                        width: labelDims[labelSize].w, height: labelDims[labelSize].h,
                                    }}>
                                        <div style={{ fontSize: '7px', fontWeight: 500, opacity: 0.7 }}>RetailPOS</div>
                                        <div style={{ fontSize: '9px', fontWeight: 600, margin: '1px 0' }}>{p.name}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 800 }}>£{Number(p.selling_price).toFixed(2)}</div>
                                        {p.barcode && (
                                            <svg ref={(el) => {
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
                                            }} style={{ maxWidth: '95%' }} />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowLabelModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handlePrintLabels}>
                                <Printer size={16} /> Print {labelQty * labelProducts.length} Label{(labelQty * labelProducts.length) > 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

function CloseIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
