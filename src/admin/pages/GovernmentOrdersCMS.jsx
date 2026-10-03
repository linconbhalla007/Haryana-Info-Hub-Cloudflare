import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import GovernmentOrderView from '../components/GovernmentOrderView.jsx';
import GovernmentOrderForm from '../components/GovernmentOrderForm.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import ToastNotification from '../components/ToastNotification.jsx';
import {
  getGovernmentOrders,
  createGovernmentOrder,
  updateGovernmentOrder,
  deleteGovernmentOrder,
} from '../services/adminApi.js';

function getShortOrderId(id) {
  if (!id) return '-';
  return id.replace(/^order-?/i, '') || id;
}

function GovernmentOrdersCMS() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Action States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchOrders = async (pageToFetch = currentPage) => {
    setLoading(true);
    setError('');
    setOrders([]);
    try {
      const res = await getGovernmentOrders(pageToFetch, ITEMS_PER_PAGE);
      setOrders(res.data || []);
      const pageMeta = res.pagination || {
        page: pageToFetch,
        limit: ITEMS_PER_PAGE,
        total: res.data?.length || 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      setPagination(pageMeta);
      setCurrentPage(pageMeta.page);
    } catch (err) {
      setError(err.message || 'Failed to load government orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  // Unique departments for filter dropdown
  const departmentOptions = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => {
      if (o.department) set.add(o.department);
    });
    return Array.from(set).sort();
  }, [orders]);

  // Filtered & Searched Orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesDept =
        selectedDepartment === 'ALL' || o.department === selectedDepartment;
      
      if (!matchesDept) return false;
      if (!q) return true;

      return (
        (o.title && o.title.toLowerCase().includes(q)) ||
        (o.department && o.department.toLowerCase().includes(q)) ||
        (o.departmentHindi && o.departmentHindi.toLowerCase().includes(q)) ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.description && o.description.toLowerCase().includes(q))
      );
    });
  }, [orders, searchQuery, selectedDepartment]);

  // Reset to page 1 on search / filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDepartment]);

  // Paginated List (server-side paginated)
  const paginatedOrders = filteredOrders;

  // Handlers
  const handleOpenView = (order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const handleOpenEdit = (order) => {
    setSelectedOrder(order);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedOrder(null);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenDelete = (order) => {
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setActionLoading(true);
    setFormError('');
    try {
      if (selectedOrder) {
        await updateGovernmentOrder(selectedOrder.id, formData);
        setToast({ type: 'success', message: 'Government order updated successfully!' });
      } else {
        const res = await createGovernmentOrder(formData);
        const newId = res?.data?.id || res?.id || res?.data?._id || '';
        setToast({
          type: 'success',
          message: `Government order created successfully! ${newId ? `(ID: ${newId})` : ''}`,
        });
      }
      setIsFormOpen(false);
      fetchOrders(currentPage);
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please check inputs.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await deleteGovernmentOrder(selectedOrder.id);
      setToast({ type: 'success', message: 'Government order deleted successfully!' });
      setIsDeleteOpen(false);

      const targetPage = orders.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      } else {
        fetchOrders(targetPage);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete order.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Top Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h1>Government Orders</h1>
          <p>Manage Haryana Government Orders & Public Notifications</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          + Add Government Order
        </button>
      </div>

      {/* Table Card */}
      <div className="admin-card">
        {/* Filters Toolbar */}
        <div className="admin-card__header">
          <div className="admin-filters-bar">
            {/* Search Box */}
            <div className="admin-search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="admin-input"
                placeholder="Search orders, department, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Department Filter */}
            <select
              className="admin-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="ALL">All Departments ({departmentOptions.length})</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {(searchQuery || selectedDepartment !== 'ALL') && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDepartment('ALL');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
            Showing page {pagination.page} of {pagination.totalPages} — {pagination.total} total government orders
          </div>
        </div>

        {/* Content Table / Loading / Errors */}
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="admin-spinner" />
            <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>
              Fetching MongoDB records...
            </p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px' }}>
            <div className="admin-alert-error" style={{ marginBottom: '16px' }}>
              <span>⚠️</span>
              <div>{error}</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => fetchOrders(currentPage)}>
              Retry Fetching
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: '0 0 4px' }}>
              No Government Orders Found
            </h3>
            <p style={{ fontSize: '13.5px', margin: 0 }}>
              Try adjusting your search filters or click "+ Add Government Order" to create one.
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th style={{ width: '30%' }}>Title</th>
                    <th>Department</th>
                    <th>Order No.</th>
                    <th>Date</th>
                    <th>PDF</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                          {getShortOrderId(order.id)}
                        </code>
                      </td>
                      <td className="admin-table__title">
                        <div>{order.title}</div>
                      </td>
                      <td>{order.departmentHindi || order.department}</td>
                      <td>
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                          {order.orderNumber}
                        </code>
                      </td>
                      <td>{order.date}</td>
                      <td>
                        {order.pdf ? (
                          <a
                            href={order.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--saffron-600)', fontWeight: 600, fontSize: 13 }}
                          >
                            View ↗
                          </a>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>None</span>
                        )}
                      </td>
                      <td>
                        <div className="admin-table__actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="admin-btn-action"
                            onClick={() => handleOpenView(order)}
                            title="View"
                          >
                            View
                          </button>
                          <button
                            className="admin-btn-action"
                            onClick={() => handleOpenEdit(order)}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            className="admin-btn-action admin-btn-action--danger"
                            onClick={() => handleOpenDelete(order)}
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Server-Side Pagination Controls */}
            <div className="admin-table-pagination">
              <div className="admin-table-pagination__info">
                Showing page {pagination.page} of {pagination.totalPages} — {pagination.total} total government orders
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={!pagination.hasPreviousPage || loading}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', padding: '0 4px' }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* View Modal */}
      <GovernmentOrderView
        isOpen={isViewOpen}
        order={selectedOrder}
        onClose={() => setIsViewOpen(false)}
      />

      {/* Form Add / Edit Modal */}
      <GovernmentOrderForm
        isOpen={isFormOpen}
        initialData={selectedOrder}
        onSubmit={handleFormSubmit}
        onClose={() => setIsFormOpen(false)}
        loading={actionLoading}
        apiError={formError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        order={selectedOrder}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteOpen(false)}
        loading={actionLoading}
      />
    </AdminLayout>
  );
}

export default GovernmentOrdersCMS;
