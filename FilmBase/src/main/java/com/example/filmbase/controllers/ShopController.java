package com.example.filmbase.controllers;

import com.example.filmbase.dto.CartEvent;
import com.example.filmbase.dto.OrderEvent;
import com.example.filmbase.dto.ProductEvent;
import com.example.filmbase.entities.*;
import com.example.filmbase.repositories.*;
import com.example.filmbase.services.KafkaProducerService;
import com.example.filmbase.services.RedisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class ShopController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private RedisService redisService;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    private User currentUser;

    // ============ АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ ============

    @PostMapping("/register")
    public String register(@RequestBody User user) {
        if (userRepository.findByLogin(user.getLogin()) != null) {
            return "ERRORLOGIN";
        }
        if (userRepository.findByEmail(user.getEmail()) != null) {
            return "ERROREMAIL";
        }
        userRepository.save(user);
        return "GOOD";
    }

    @PostMapping("/login")
    public String login(@RequestBody User user) {
        User dbUser = userRepository.findByLogin(user.getLogin());
        if (dbUser != null && dbUser.getPassword().equals(user.getPassword())) {
            currentUser = dbUser;
            // Сохраняем сессию пользователя в Redis на 30 минут
            String sessionKey = "session:" + dbUser.getId();
            redisService.set(sessionKey, dbUser.getId(), 1800);
            return "AUTH";
        }
        return "NOAUTH";
    }

    @GetMapping("/current-user")
    public String getCurrentUser() {
        if (currentUser == null) return "NULL";
        if (currentUser.getLogin().equals("admin")) return "ADMIN";
        return "USER";
    }

    @GetMapping("/logout")
    public String logout() {
        if (currentUser != null) {
            // Удаляем сессию из Redis
            String sessionKey = "session:" + currentUser.getId();
            redisService.delete(sessionKey);
        }
        currentUser = null;
        return "DEAUTH";
    }

    // ============ КАТЕГОРИИ ============

    @GetMapping("/categories")
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @PostMapping("/categories/add")
    public String addCategory(@RequestBody Category category) {
        if (categoryRepository.findByName(category.getName()) != null) {
            return "Эта категория уже существует";
        }
        categoryRepository.save(category);
        return "1. Категория успешно добавлена";
    }

    // ============ ТОВАРЫ ============

    @GetMapping("/products")
    public List<Product> getAllProducts() {
        // Проверяем кеш в Redis
        String cacheKey = "products:all";
        @SuppressWarnings("unchecked")
        List<Product> cachedProducts = (List<Product>) redisService.get(cacheKey);
        if (cachedProducts != null) {
            return cachedProducts;
        }
        
        List<Product> products = productRepository.findAll();
        // Сохраняем в кеш на 5 минут
        redisService.set(cacheKey, products, 300);
        return products;
    }

    @GetMapping("/products/category/{categoryId}")
    public List<Product> getProductsByCategory(@PathVariable int categoryId) {
        return productRepository.findByCategory_Id(categoryId);
    }

    @PostMapping("/products/search")
    public List<Product> searchProducts(@RequestBody Product search) {
        return productRepository.findByNameContainingOrDescriptionContaining(
                search.getName() != null ? search.getName() : "",
                search.getName() != null ? search.getName() : "");
    }

    @PostMapping("/products/add")
    @CacheEvict(value = "products", allEntries = true)
    public String addProduct(@RequestBody Product product) {
        productRepository.save(product);
        // Очищаем кеш товаров
        redisService.delete("products:all");
        return "1. Товар успешно добавлен";
    }

    @PostMapping("/products/edit")
    @CacheEvict(value = "products", allEntries = true)
    public String editProduct(@RequestBody Product product) {
        Product existing = productRepository.findById(product.getId());
        if (existing == null) return "Товар не найден";

        existing.setName(product.getName());
        existing.setDescription(product.getDescription());
        existing.setPrice(product.getPrice());
        existing.setImageUrl(product.getImageUrl());
        existing.setCategory(product.getCategory());
        existing.setStockQuantity(product.getStockQuantity());

        productRepository.save(existing);
        // Очищаем кеш товаров
        redisService.delete("products:all");
        
        // Отправляем событие в Kafka
        ProductEvent event = new ProductEvent();
        event.setEventType("UPDATED");
        event.setProductId(existing.getId());
        event.setProductName(existing.getName());
        event.setPrice(existing.getPrice());
        event.setStockQuantity(existing.getStockQuantity());
        if (existing.getCategory() != null) {
            event.setCategoryId(existing.getCategory().getId());
            event.setCategoryName(existing.getCategory().getName());
        }
        kafkaProducerService.sendProductEvent(event);
        
        return "1. Изменения успешно сохранены";
    }

    @PostMapping("/products/delete")
    @CacheEvict(value = "products", allEntries = true)
    public String deleteProduct(@RequestBody Product product) {
        Product existing = productRepository.findById(product.getId());
        if (existing == null) return "Товар не найден";
        
        // Отправляем событие в Kafka перед удалением
        ProductEvent event = new ProductEvent();
        event.setEventType("DELETED");
        event.setProductId(existing.getId());
        event.setProductName(existing.getName());
        event.setPrice(existing.getPrice());
        if (existing.getCategory() != null) {
            event.setCategoryId(existing.getCategory().getId());
            event.setCategoryName(existing.getCategory().getName());
        }
        kafkaProducerService.sendProductEvent(event);
        
        productRepository.delete(existing);
        // Очищаем кеш товаров
        redisService.delete("products:all");
        return "1. Товар успешно удален";
    }

    // ============ КОРЗИНА ============

    @GetMapping("/cart")
    public List<CartItem> getCart() {
        return cartItemRepository.findAllByUser(currentUser);
    }

    @PostMapping("/cart/add")
    public String addToCart(@RequestBody CartItemRequest request) {
        if (currentUser == null) return "ERRORAUTH";
        
        Product product = productRepository.findById(request.getProductId());
        if (product == null) return "ERRORPRODUCT";
        
        if (product.getStockQuantity() < request.getQuantity()) {
            return "ERRORSTOCK";
        }

        CartItem existing = cartItemRepository.findByProductAndUser(product, currentUser);
        if (existing != null) {
            int newQuantity = existing.getQuantity() + request.getQuantity();
            if (product.getStockQuantity() < newQuantity) {
                return "ERRORSTOCK";
            }
            existing.setQuantity(newQuantity);
            cartItemRepository.save(existing);
            
            // Отправляем событие обновления корзины в Kafka
            CartEvent event = new CartEvent();
            event.setEventType("UPDATED");
            event.setUserId(currentUser.getId());
            event.setUserLogin(currentUser.getLogin());
            event.setProductId(product.getId());
            event.setProductName(product.getName());
            event.setQuantity(existing.getQuantity());
            event.setPrice(product.getPrice());
            kafkaProducerService.sendCartEvent(event);
        } else {
            CartItem cartItem = new CartItem();
            cartItem.setUser(currentUser);
            cartItem.setProduct(product);
            cartItem.setQuantity(request.getQuantity());
            cartItemRepository.save(cartItem);
            
            // Отправляем событие добавления в корзину в Kafka
            CartEvent event = new CartEvent();
            event.setEventType("ADDED");
            event.setUserId(currentUser.getId());
            event.setUserLogin(currentUser.getLogin());
            event.setProductId(product.getId());
            event.setProductName(product.getName());
            event.setQuantity(request.getQuantity());
            event.setPrice(product.getPrice());
            kafkaProducerService.sendCartEvent(event);
        }
        return "GOOD";
    }

    @PostMapping("/cart/update")
    public String updateCartItem(@RequestBody CartItem cartItem) {
        CartItem existing = cartItemRepository.findById(cartItem.getId());
        if (existing == null || existing.getUser().getId() != currentUser.getId()) {
            return "ERROR";
        }

        if (existing.getProduct().getStockQuantity() < cartItem.getQuantity()) {
            return "ERRORSTOCK";
        }

        existing.setQuantity(cartItem.getQuantity());
        cartItemRepository.save(existing);
        return "GOOD";
    }

    @PostMapping("/cart/delete")
    public String deleteFromCart(@RequestBody CartItem cartItem) {
        CartItem existing = cartItemRepository.findById(cartItem.getId());
        if (existing == null || existing.getUser().getId() != currentUser.getId()) {
            return "ERROR";
        }
        
        // Отправляем событие удаления из корзины в Kafka
        CartEvent event = new CartEvent();
        event.setEventType("REMOVED");
        event.setUserId(currentUser.getId());
        event.setUserLogin(currentUser.getLogin());
        event.setProductId(existing.getProduct().getId());
        event.setProductName(existing.getProduct().getName());
        event.setQuantity(existing.getQuantity());
        event.setPrice(existing.getProduct().getPrice());
        kafkaProducerService.sendCartEvent(event);
        
        cartItemRepository.delete(existing);
        return "GOOD";
    }

    // ============ ЗАКАЗЫ ============

    @PostMapping("/orders/create")
    public String createOrder(@RequestBody OrderRequest request) {
        if (currentUser == null) return "ERRORAUTH";

        List<CartItem> cartItems = cartItemRepository.findAllByUser(currentUser);
        if (cartItems.isEmpty()) return "ERROREMPTY";

        // Проверка наличия товаров
        for (CartItem item : cartItems) {
            if (item.getProduct().getStockQuantity() < item.getQuantity()) {
                return "ERRORSTOCK_" + item.getProduct().getName();
            }
        }

        // Создание заказа
        Order order = new Order();
        order.setUser(currentUser);
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setStatus("В обработке");
        order.setOrderDate(LocalDateTime.now());

        double totalAmount = 0;
        for (CartItem item : cartItems) {
            totalAmount += item.getProduct().getPrice() * item.getQuantity();
        }
        order.setTotalAmount(totalAmount);

        order = orderRepository.save(order);

        // Создание позиций заказа и обновление количества товаров
        for (CartItem item : cartItems) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(item.getProduct());
            orderItem.setQuantity(item.getQuantity());
            orderItem.setPrice(item.getProduct().getPrice());
            orderItemRepository.save(orderItem);

            // Уменьшаем количество товара на складе
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);

            // Удаляем из корзины
            cartItemRepository.delete(item);
        }

        // Отправляем событие создания заказа в Kafka
        OrderEvent orderEvent = new OrderEvent();
        orderEvent.setEventType("CREATED");
        orderEvent.setOrderId(order.getId());
        orderEvent.setUserId(currentUser.getId());
        orderEvent.setUserLogin(currentUser.getLogin());
        orderEvent.setTotalAmount(order.getTotalAmount());
        orderEvent.setStatus(order.getStatus());
        orderEvent.setDeliveryAddress(order.getDeliveryAddress());
        kafkaProducerService.sendOrderEvent(orderEvent);

        return "GOOD";
    }

    @GetMapping("/orders")
    public List<Order> getMyOrders() {
        return orderRepository.findAllByUserOrderByOrderDateDesc(currentUser);
    }

    @GetMapping("/orders/{orderId}")
    public Order getOrder(@PathVariable int orderId) {
        Order order = orderRepository.findById(orderId);
        if (order == null || order.getUser().getId() != currentUser.getId()) {
            return null;
        }
        return order;
    }

    @GetMapping("/orders/{orderId}/items")
    public List<OrderItem> getOrderItems(@PathVariable int orderId) {
        Order order = orderRepository.findById(orderId);
        if (order == null || order.getUser().getId() != currentUser.getId()) {
            return null;
        }
        return orderItemRepository.findAllByOrder(order);
    }

    @PostMapping("/orders/{orderId}/cancel")
    public String cancelOrder(@PathVariable int orderId) {
        Order order = orderRepository.findById(orderId);
        if (order == null || order.getUser().getId() != currentUser.getId()) {
            return "ERROR";
        }
        if (!order.getStatus().equals("В обработке")) {
            return "ERRORSTATUS";
        }

        // Возвращаем товары на склад
        List<OrderItem> items = orderItemRepository.findAllByOrder(order);
        for (OrderItem item : items) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus("Отменен");
        orderRepository.save(order);
        
        // Отправляем событие отмены заказа в Kafka
        OrderEvent orderEvent = new OrderEvent();
        orderEvent.setEventType("CANCELLED");
        orderEvent.setOrderId(order.getId());
        orderEvent.setUserId(order.getUser().getId());
        orderEvent.setUserLogin(order.getUser().getLogin());
        orderEvent.setTotalAmount(order.getTotalAmount());
        orderEvent.setStatus(order.getStatus());
        orderEvent.setDeliveryAddress(order.getDeliveryAddress());
        kafkaProducerService.sendOrderEvent(orderEvent);
        
        return "GOOD";
    }

    // ============ НАСТРОЙКИ АККАУНТА ============

    @GetMapping("/account")
    public User getAccount() {
        User user = userRepository.findById(currentUser.getId());
        user.setPassword(""); // Не возвращаем пароль
        return user;
    }

    @PostMapping("/account/update")
    public String updateAccount(@RequestBody User settings) {
        currentUser.setFullName(settings.getFullName());
        currentUser.setPhone(settings.getPhone());
        currentUser.setAddress(settings.getAddress());
        userRepository.save(currentUser);
        return "1. Данные сохранены";
    }

    @PostMapping("/account/password")
    public String changePassword(@RequestBody PasswordChangeRequest request) {
        if (!currentUser.getPassword().equals(request.getOldPassword())) {
            return "2. Старый пароль введен неверно";
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return "3. Новый пароль не совпадает";
        }

        currentUser.setPassword(request.getNewPassword());
        userRepository.save(currentUser);
        return "1. Пароль успешно изменен";
    }

    // ============ ВСПОМОГАТЕЛЬНЫЕ КЛАССЫ ============

    public static class CartItemRequest {
        private int productId;
        private int quantity;

        public int getProductId() { return productId; }
        public void setProductId(int productId) { this.productId = productId; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }

    public static class OrderRequest {
        private String deliveryAddress;

        public String getDeliveryAddress() { return deliveryAddress; }
        public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    }

    public static class PasswordChangeRequest {
        private String oldPassword;
        private String newPassword;
        private String confirmPassword;

        public String getOldPassword() { return oldPassword; }
        public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
        public String getConfirmPassword() { return confirmPassword; }
        public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
    }
}



