package com.example.filmbase.repositories;

import com.example.filmbase.entities.Order;
import com.example.filmbase.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    Order findById(int id);
    List<Order> findAllByUser(User user);
    List<Order> findAllByUserOrderByOrderDateDesc(User user);
}



