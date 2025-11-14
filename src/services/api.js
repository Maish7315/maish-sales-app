import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const api = {
  auth: {
    signup: (data) => fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.json()),

    login: (data) => fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.json()),
  },

  sales: {
    submit: (data, token) => {
      const formData = new FormData();
      formData.append('item_description', data.item_description);
      formData.append('amount', data.amount);
      if (data.receipt) {
        formData.append('receipt', data.receipt);
      }

      return fetch(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }).then(res => res.json());
    },

    getUserSales: (token) => fetch(`${API_BASE_URL}/sales/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then(res => res.json()),
  },
};

export default api;