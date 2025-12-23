package com.example.filmbase.repositories;

import com.example.filmbase.entities.CartItem;
import com.example.filmbase.entities.Product;
import com.example.filmbase.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {
    CartItem findByProductAndUser(Product product, User user);
    CartItem findById(int id);
    List<CartItem> findAllByUser(User user);
}



