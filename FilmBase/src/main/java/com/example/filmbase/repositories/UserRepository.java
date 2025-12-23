package com.example.filmbase.repositories;

import com.example.filmbase.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    User findByLogin(String login);
    User findById(int id);
    User findByEmail(String email);
}