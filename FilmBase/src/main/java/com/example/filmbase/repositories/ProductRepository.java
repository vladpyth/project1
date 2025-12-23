package com.example.filmbase.repositories;

import com.example.filmbase.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    Product findById(int id);
    List<Product> findByNameContainingOrDescriptionContaining(String name, String description);
    List<Product> findByCategory_Id(int categoryId);
}



