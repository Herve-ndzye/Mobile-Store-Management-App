import io from "socket.io-client";

// Update this if the backend IP changes
export const BASE_URL = "http://10.11.74.149:8255";

export const socket = io(BASE_URL, {
    autoConnect: false,
});

export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
}

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
}

export const api = {
    async topup(uid: string, amount: number, holderName: string) {
        const response = await fetch(`${BASE_URL}/topup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, amount, holderName })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || data.message || 'Topup failed');
        }
        return await response.json();
    },

    async pay(uid: string, product_id: string, quantity: number) {
        const response = await fetch(`${BASE_URL}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, product_id, quantity })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || data.message || 'Payment failed');
        }
        return await response.json();
    },

    async getProducts() {
        const response = await fetch(`${BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return await response.json();
    },

    async getDashboardStats() {
        const [cardsRes, txRes] = await Promise.all([
            fetch(`${BASE_URL}/cards`),
            fetch(`${BASE_URL}/transactions?limit=1000`)
        ]);

        if (!cardsRes.ok || !txRes.ok) throw new Error('Failed to fetch dashboard data');

        const cards = await cardsRes.json();
        const transactions = await txRes.json();

        return { cards, transactions };
    }
}
