        // Ambil data produk dari localStorage
        const productId = localStorage.getItem('selectedProduct');
        
        // Fetch detail produk
        fetch(`http://localhost:3000/product/${productId}`)
            .then(response => response.json())
            .then(product => {
                const productSummary = document.getElementById('productSummary');
                const quantityInput = document.getElementById('quantity');
                const totalAmount = document.getElementById('totalAmount');

                // Tampilkan detail produk
                productSummary.innerHTML = `
                    <div class="checkout-product">
                        <img src="${product.image_url}" alt="${product.name}">
                        <div>
                            <h3>${product.name}</h3>
                            <p>Harga Satuan: Rp ${product.price.toLocaleString()}</p>
                        </div>
                    </div>
                `;

                // Update total harga
                const updateTotal = () => {
                    const total = product.price * quantityInput.value;
                    totalAmount.textContent = `Rp ${total.toLocaleString()}`;
                };

                quantityInput.addEventListener('input', updateTotal);
                updateTotal();

                // Handle form submission
                document.getElementById('checkoutForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const formData = {
                        productId: product.id,
                        productName: product.name,
                        quantity: quantityInput.value,
                        totalPrice: product.price * quantityInput.value,
                        customer: {
                            name: document.getElementById('name').value,
                            address: document.getElementById('address').value,
                            email: document.getElementById('email').value,
                            phone: document.getElementById('phone').value,
                            note: document.getElementById('note').value
                        }
                    };

                    // Simpan data ke localStorage
                    localStorage.setItem('transactionData', JSON.stringify(formData));

                    // Redirect ke WhatsApp
                    const phoneNumber = '+62895334181531'; // Nomor WhatsApp admin
                    const message = `Halo, saya ingin memesan:\n\n` +
                                   `Produk: ${formData.productName}\n` +
                                   `Jumlah: ${formData.quantity}\n` +
                                   `Total: Rp ${formData.totalPrice.toLocaleString()}\n\n` +
                                   `Nama: ${formData.customer.name}\n` +
                                   `Alamat: ${formData.customer.address}\n` +
                                   `No. HP: ${formData.customer.phone}\n` +
                                   `Email: ${formData.customer.email}\n` +
                                   `Catatan: ${formData.customer.note || '-'}`;

                    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                    window.location.href = whatsappUrl;
                });
            })
            .catch(error => {
                console.error('Error:', error);
                window.location.href = 'products.html';
            });