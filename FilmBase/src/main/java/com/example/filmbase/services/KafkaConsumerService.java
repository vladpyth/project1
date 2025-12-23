package com.example.filmbase.services;

import com.example.filmbase.dto.CartEvent;
import com.example.filmbase.dto.OrderEvent;
import com.example.filmbase.dto.ProductEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaConsumerService.class);

    @Autowired
    private RedisService redisService;

    /**
     * Обработка событий заказов
     */
    @KafkaListener(topics = "orders", groupId = "onlineshop-group")
    public void consumeOrderEvent(
            @Payload OrderEvent event,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {
        
        logger.info("Received OrderEvent: eventType={}, orderId={}, userId={}, amount={}",
                event.getEventType(), event.getOrderId(), event.getUserId(), event.getTotalAmount());

        // Обработка события заказа
        try {
            switch (event.getEventType()) {
                case "CREATED":
                    handleOrderCreated(event);
                    break;
                case "CANCELLED":
                    handleOrderCancelled(event);
                    break;
                case "DELIVERED":
                    handleOrderDelivered(event);
                    break;
            }
            
            // Сохраняем событие в Redis для аналитики (только основные данные)
            String cacheKey = "order:event:" + event.getOrderId();
            // Сохраняем как строку JSON для избежания проблем с сериализацией
            String eventData = String.format("{\"orderId\":%d,\"userId\":%d,\"eventType\":\"%s\",\"amount\":%.2f,\"status\":\"%s\"}",
                event.getOrderId(), event.getUserId(), event.getEventType(), 
                event.getTotalAmount(), event.getStatus());
            redisService.set(cacheKey, eventData, 3600); // Храним 1 час
        } catch (Exception e) {
            logger.error("Error processing OrderEvent: {}", e.getMessage(), e);
        }
    }

    /**
     * Обработка событий товаров
     */
    @KafkaListener(topics = "products", groupId = "onlineshop-group")
    public void consumeProductEvent(
            @Payload ProductEvent event,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        
        logger.info("Received ProductEvent: eventType={}, productId={}, productName={}",
                event.getEventType(), event.getProductId(), event.getProductName());

        try {
            switch (event.getEventType()) {
                case "CREATED":
                    handleProductCreated(event);
                    break;
                case "UPDATED":
                    handleProductUpdated(event);
                    break;
                case "DELETED":
                    handleProductDeleted(event);
                    break;
            }
            
            // Очищаем кеш товаров при изменениях
            redisService.delete("products:all");
        } catch (Exception e) {
            logger.error("Error processing ProductEvent: {}", e.getMessage(), e);
        }
    }

    /**
     * Обработка событий корзины
     */
    @KafkaListener(topics = "cart", groupId = "onlineshop-group")
    public void consumeCartEvent(@Payload CartEvent event) {
        
        logger.info("Received CartEvent: eventType={}, userId={}, productId={}, quantity={}",
                event.getEventType(), event.getUserId(), event.getProductId(), event.getQuantity());

        try {
            // Можно добавить логику обработки событий корзины
            // Например, обновление статистики, отправка уведомлений и т.д.
        } catch (Exception e) {
            logger.error("Error processing CartEvent: {}", e.getMessage(), e);
        }
    }

    // Обработчики событий заказов
    private void handleOrderCreated(OrderEvent event) {
        logger.info("Processing order creation: OrderId={}, Amount={}", 
                event.getOrderId(), event.getTotalAmount());
        // Здесь можно добавить логику: отправка email, обновление статистики и т.д.
    }

    private void handleOrderCancelled(OrderEvent event) {
        logger.info("Processing order cancellation: OrderId={}", event.getOrderId());
        // Здесь можно добавить логику: возврат товаров на склад, уведомления и т.д.
    }

    private void handleOrderDelivered(OrderEvent event) {
        logger.info("Processing order delivery: OrderId={}", event.getOrderId());
        // Здесь можно добавить логику: отправка уведомления клиенту и т.д.
    }

    // Обработчики событий товаров
    private void handleProductCreated(ProductEvent event) {
        logger.info("Processing product creation: ProductId={}, Name={}", 
                event.getProductId(), event.getProductName());
    }

    private void handleProductUpdated(ProductEvent event) {
        logger.info("Processing product update: ProductId={}, Name={}", 
                event.getProductId(), event.getProductName());
    }

    private void handleProductDeleted(ProductEvent event) {
        logger.info("Processing product deletion: ProductId={}, Name={}", 
                event.getProductId(), event.getProductName());
    }
}



