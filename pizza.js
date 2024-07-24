document.addEventListener('alpine:init', () => {
    Alpine.data('pizzaCart', () => {
        return {
            title: 'Pizza Cart API',
            pizzas: [],
            username: '',
            cartId: '',
            cartPizzas: [],
            cartTotal: 0.00,
            change: 0,
            paymentAmount: 0.00,
            message: '',
            login() {
                if (this.username.length > 2) {
                    this.createCart();
                } else {
                    alert("Username is too short");
                }
            },
            logout() {
                if (confirm('Do you want to log out of the Pizza App?')) {
                    this.username = '';
                    this.cartId = '';
                    localStorage.removeItem('cartId');
                }
            },
            
            createCart() {
                if (!this.username) {
                    this.cartId = 'No username to create cart for';
                    return Promise.resolve()
                }
                
                const cartId = localStorage.getItem('cartId');
                
                if (cartId) {
                    this.cartId = cartId;
                    return Promise.resolve()
                } else {
                    const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`;
                    return axios.get(createCartURL)
                        .then(result => {
                            this.cartId = result.data.cart_code;
                            localStorage.setItem('cartId', this.cartId);
                        });
                }
            },
            getCart() {
                const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cartId}/get`;
                return axios.get(getCartURL);
            },
            addPizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                });
            },
            removePizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                });
            },
            pay(amount) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
                    "cart_code": this.cartId,
                    "amount": parseFloat(amount).toFixed(2)
                });
            },
            
            payForCart() {
                this.pay(this.paymentAmount).then(result => {
                    if (result.data.status === 'failure') {
                        this.message = result.data.message;
                    } else {
                        // Calculate change
                        const change = this.paymentAmount - this.cartTotal;
            
                        // Display success message with change amount
                        this.message = `Payment successful! Your change is this thank you for your continued support R${change.toFixed(2)}.`;
            
                        this.showCartData(); // Refresh cart data after payment
                        setTimeout(() => {
                            this.message = '';
                            this.cartPizzas = [];
                            this.cartTotal = '0.00';
                            this.cartId = '';
                            localStorage.removeItem('cartId'); // Remove old cartId from local storage
                            this.createCart(); // Create a new cart
                            this.paymentAmount = 0.00;
                        }, 3000); // 3 seconds in milliseconds
                        
                    }
                });
            },
           
            
            
            showCartData() {
                this.getCart().then(result => {
                    const cartData = result.data;
                    this.cartPizzas = cartData.pizzas.map(pizza => {
                        return {
                            ...pizza,
                            price: parseFloat(pizza.price).toFixed(2),
                            total: (parseFloat(pizza.price) * pizza.qty).toFixed(2)
                        };
                    });
                    this.cartTotal = parseFloat(cartData.total).toFixed(2);
                }).catch(error => {
                    console.error('Error fetching cart data:', error);
                });
            },
            init() {
                this.username = localStorage.getItem('username') || '';
                const cartId = localStorage.getItem('cartId');
                if (cartId) {
                    this.cartId = cartId;
                    this.showCartData();
                }
                axios
                    .get('https://pizza-api.projectcodex.net/api/pizzas')
                    .then(result => {
                        this.pizzas = result.data.pizzas.map(pizza => {
                            return {
                                ...pizza,
                                price: parseFloat(pizza.price).toFixed(2)
                            };
                        });
                    });
            },
            addPizzaToCart(pizzaId) {
                this.addPizza(pizzaId).then(() => {
                    this.showCartData(); // Ensure the cart is refreshed after adding a pizza
                });
            },
            removePizzaFromCart(pizzaId) {
                this.removePizza(pizzaId).then(() => {
                    this.showCartData(); // Ensure the cart is refreshed after removing a pizza
                    // Function for cart history


                });
            },
            fetchCartHistory() {
                const historicalOrderUrl = `https://pizza-api.projectcodex.net/api/pizza-cart/username/${this.username}`;
            
                return axios
                .get(historicalOrderUrl)
                    .then((res) => {
                        const carts = res.data;
                        const paidCartPromises = carts
                            .filter((cart) => cart.status === 'paid')
                            .map((cart) => {
                                const paidCartCode = cart.cart_code;
                                const getCartUrl = `https://pizza-api.projectcodex.net/api/pizza-cart/${paidCartCode}/get`;
                                return axios
                                .get(getCartUrl)
                                .then((res) => res.data.pizzas);
                            });
            
                        return Promise.all(paidCartPromises);
                    })
                    .then((cartHistories) => {
                        this.cartHistory = cartHistories.flat();
                        console.log('History:', this.cartHistoryArr);
                    })
                    
                    
            },
        };
    });
});

