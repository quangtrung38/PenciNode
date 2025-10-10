import React, { useState } from 'react';

export interface UserFormValues {
  name: string;
  email: string;
  role: string;
  status: string;
}

interface UserFormProps {
  initialValues?: UserFormValues;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function UserForm({
  initialValues = { name: '', email: '', role: 'user', status: 'active' },
  loading = false,
  error,
  onSubmit,
  onCancel,
  submitLabel = 'LÆ°u',
}: UserFormProps) {
  const [form, setForm] = useState<UserFormValues>(initialValues);
  const [touched, setTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setTouched(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          TÃªn <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nháº­p tÃªn ngÆ°á»i dÃ¹ng"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nháº­p email"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vai trÃ²</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tráº¡ng thÃ¡i</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="active">Hoáº¡t Ä‘á»™ng</option>
          <option value="inactive">KhÃ´ng hoáº¡t Ä‘á»™ng</option>
          <option value="blocked">Bá»‹ khÃ³a</option>
        </select>
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="flex space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Há»§y
          </button>
        )}
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || !touched}
        >
          {loading ? 'Äang lÆ°u...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

