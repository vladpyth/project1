package com.example.filmbase.repositories;

import com.example.filmbase.entities.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    Category findById(int id);
    Category findByName(String name);
}



