package com.example.filmbase.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderEvent {
    private String eventType; // CREATED, CANCELLED, DELIVERED
    private Integer orderId;
    private Integer userId;
    private String userLogin;
    private Double totalAmount;
    private String status;
    private String deliveryAddress;
    private LocalDateTime timestamp;
}



