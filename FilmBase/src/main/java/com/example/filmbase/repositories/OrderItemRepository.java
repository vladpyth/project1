package com.example.filmbase.repositories;

import com.example.filmbase.entities.Order;
import com.example.filmbase.entities.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    List<OrderItem> findAllByOrder(Order order);
}



