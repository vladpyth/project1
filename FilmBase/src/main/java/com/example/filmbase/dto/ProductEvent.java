package com.example.filmbase.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductEvent {
    private String eventType; // CREATED, UPDATED, DELETED
    private Integer productId;
    private String productName;
    private Double price;
    private Integer categoryId;
    private String categoryName;
    private Integer stockQuantity;
    private LocalDateTime timestamp;
}



