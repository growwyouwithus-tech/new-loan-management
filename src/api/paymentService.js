
import { apiClient } from './client';

const paymentService = {
    getAllPayments: async (params) => {
        const response = await apiClient.get('/payments', { params });
        // Assuming backend returns { payments: [...], totalPages, currentPage, total }
        return response.data;
    },

    getPaymentStatistics: async (params) => {
        const response = await apiClient.get('/payments/stats/statistics', { params });
        return response.data;
    }
};

export default paymentService;
