// Cart functionality
$(document).ready(function() {
    // Function to update product quantity
    function updateQuantity(productId, quantity, maxQuantity) {
        // Kiểm tra số lượng tồn kho
        if (quantity > maxQuantity) {
            alert('Số lượng vuien quá tồn kho! Tối đa: ' + maxQuantity);
            return false;
        }

        $.ajax({
            url: '/updatecart',
            method: 'POST',
            data: {
                productId: productId,
                productQuantity: quantity
            },
            success: function(response) {
                if (response.success) {
                    // Cập nhật giá tiền của sản phẩm
                    const price = parseFloat($('#price-' + productId).data('price'));
                    const newTotal = price * quantity;
                    $('#total-' + productId).text('$' + newTotal.toFixed(2));
                    
                    // Cập nhật tổng tiền
                    updateTotalPrice();
                } else {
                    window.location.reload();
                }
            },
            error: function(error) {
                console.error('Error updating quantity:', error);
            }
        });
    }

    // Function to remove product from cart
    window.removeFromCart = function(productId) {
        console.log('Attempting to remove product:', productId);
        $.ajax({
            url: '/cart/delete-item',
            method: 'POST',
            data: JSON.stringify({ productId: productId }),
            dataType: 'json',
            contentType: 'application/json',
            success: function(response) {
                console.log('Remove product response:', response);
                if (response.success) {
                    // Xóa ngay lập tức dòng sản phẩm khỏi giao diện
                    $(`tr[data-product-id="${productId}"]`).remove();
                    
                    // Kiểm tra và cập nhật giao diện nếu giỏ hàng trống
                    if ($('.table_row').length === 0) {
                        $('.wrap-table-shopping-cart').html(
                            '<div class="empty-cart-message text-center">Giỏ hàng của bạn hiện đang trống</div>'
                        );
                    }
                    
                    // Cập nhật tổng tiền
                    updateTotalPrice();
                } else {
                    console.error('Không thể xóa sản phẩm:', response.error);
                    alert(response.error || 'Không thể xóa sản phẩm khỏi giỏ hàng');
                }
            },
            error: function(xhr, status, error) {
                console.error('Lỗi khi xóa sản phẩm:', xhr.responseText, status, error);
                alert('Đã xảy ra lỗi khi xóa sản phẩm');
            }
        });
    };

    // Loại bỏ các event handlers cho nút tăng/giảm số lượng
    // $('.btn-num-product-up').click(...) đã được loại bỏ
    // $('.btn-num-product-down').click(...) đã được loại bỏ

    // Handle direct input changes
    $('.num-product').on('input', function() {
        const input = $(this);
        let val = parseInt(input.val()) || 0;
        const maxQuantity = parseInt(input.data('max-quantity'));
        const productId = input.siblings('input[name="productId"]').val();

        // Đảm bảo giá trị nằm trong khoảng cho phép
        if (val < 1) val = 1;
        if (val > maxQuantity) {
            val = maxQuantity;
            alert('Số lượng vượt quá tồn kho! Tối đa: ' + maxQuantity);
        }

        // Cập nhật giá trị vào input
        input.val(val);
        
        // Cập nhật server và UI
        updateQuantity(productId, val, maxQuantity);
    });

    // Khi blur khỏi input, đảm bảo giá trị hợp lệ
    $('.num-product').on('blur', function() {
        const input = $(this);
        let val = parseInt(input.val()) || 1;
        input.val(val);
    });

    // Update total price
    function updateTotalPrice() {
        let total = 0;
        $('.total-prod:visible').each(function() {
            if ($(this).closest('tr').find('.product-checkbox').prop('checked')) {
                const price = parseFloat($(this).text().replace('$', '')) || 0;
                total += price;
            }
        });
        $('#sumPrice').text('$' + total.toFixed(2));
    }

    // Update total when checkboxes change
    $('.product-checkbox').change(function() {
        updateTotalPrice();
    });

    // Initial total price update
    updateTotalPrice();

    // Handle payment method selection
    $('#paymentMethodForm').on('submit', function(e) {
        e.preventDefault();
        const selectedPaymentMethod = $('input[name="paymentMethod"]:checked').val();
        const totalAmount = parseFloat($('#sumPrice').text().replace('$', ''));

        if (selectedPaymentMethod === 'vnpay') {
            // Redirect to VNPay payment gateway
            $.ajax({
                url: '/create-vnpay-payment',
                method: 'POST',
                data: { 
                    amount: totalAmount,
                    orderDescription: 'Thanh toán đơn hàng'
                },
                success: function(response) {
                    if (response.paymentUrl) {
                        // Redirect to VNPay payment URL
                        window.location.href = response.paymentUrl;
                    } else {
                        alert('Không thể tạo liên kết thanh toán. Vui lòng thử lại.');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('VNPay Payment Error:', error);
                    alert('Đã xảy ra lỗi khi tạo liên kết thanh toán. Vui lòng thử lại.');
                }
            });
        } else {
            // Proceed with COD (Cash on Delivery)
            this.submit();
        }
    });
});
