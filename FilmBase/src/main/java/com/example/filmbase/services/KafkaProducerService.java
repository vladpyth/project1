package com.example.filmbase.services;

import com.example.filmbase.config.KafkaConfig;
import com.example.filmbase.dto.CartEvent;
import com.example.filmbase.dto.OrderEvent;
import com.example.filmbase.dto.ProductEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.util.concurrent.ListenableFutureCallback;

import java.time.LocalDateTime;

@Service
public class KafkaProducerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Отправка события о заказе
     */
    public void sendOrderEvent(OrderEvent event) {
        event.setTimestamp(LocalDateTime.now());
        sendMessage(KafkaConfig.ORDER_TOPIC, String.valueOf(event.getOrderId()), event);
    }

    /**
     * Отправка события о товаре
     */
    public void sendProductEvent(ProductEvent event) {
        event.setTimestamp(LocalDateTime.now());
        sendMessage(KafkaConfig.PRODUCT_TOPIC, String.valueOf(event.getProductId()), event);
    }

    /**
     * Отправка события о корзине
     */
    public void sendCartEvent(CartEvent event) {
        event.setTimestamp(LocalDateTime.now());
        sendMessage(KafkaConfig.CART_TOPIC, String.valueOf(event.getUserId()), event);
    }

    /**
     * Общий метод для отправки сообщений в Kafka
     */
    private void sendMessage(String topic, String key, Object message) {
        ListenableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, key, message);

        future.addCallback(new ListenableFutureCallback<SendResult<String, Object>>() {
            @Override
            public void onSuccess(SendResult<String, Object> result) {
                logger.info("Sent message=[{}] with offset=[{}] to topic=[{}]",
                        message, result.getRecordMetadata().offset(), topic);
            }

            @Override
            public void onFailure(Throwable ex) {
                logger.error("Unable to send message=[{}] to topic=[{}] due to: {}",
                        message, topic, ex.getMessage());
            }
        });
    }
}



