package com.example.filmbase.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class RedisService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * Сохранить значение в Redis
     * @param key ключ
     * @param value значение
     */
    public void set(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    /**
     * Сохранить значение в Redis с временем жизни
     * @param key ключ
     * @param value значение
     * @param timeout время жизни в секундах
     */
    public void set(String key, Object value, long timeout) {
        redisTemplate.opsForValue().set(key, value, timeout, TimeUnit.SECONDS);
    }

    /**
     * Получить значение из Redis
     * @param key ключ
     * @return значение
     */
    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * Удалить значение из Redis
     * @param key ключ
     * @return true если удалено успешно
     */
    public Boolean delete(String key) {
        return redisTemplate.delete(key);
    }

    /**
     * Проверить существование ключа
     * @param key ключ
     * @return true если ключ существует
     */
    public Boolean hasKey(String key) {
        return redisTemplate.hasKey(key);
    }

    /**
     * Установить время жизни для ключа
     * @param key ключ
     * @param timeout время жизни в секундах
     * @return true если установлено успешно
     */
    public Boolean expire(String key, long timeout) {
        return redisTemplate.expire(key, timeout, TimeUnit.SECONDS);
    }

    /**
     * Получить время жизни ключа
     * @param key ключ
     * @return время жизни в секундах, -1 если бессрочно, -2 если ключ не существует
     */
    public Long getExpire(String key) {
        return redisTemplate.getExpire(key, TimeUnit.SECONDS);
    }
}



