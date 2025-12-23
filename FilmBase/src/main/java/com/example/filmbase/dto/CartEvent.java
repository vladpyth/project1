package com.example.filmbase.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartEvent {
    private String eventType; // ADDED, UPDATED, REMOVED
    private Integer userId;
    private String userLogin;
    private Integer productId;
    private String productName;
    private Integer quantity;
    private Double price;
    private LocalDateTime timestamp;
}



